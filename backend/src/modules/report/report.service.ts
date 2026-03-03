/**
 * Service de génération de rapports de risque complets.
 *
 * Agrège géocodage, risques, données DVF et synthèse texte.
 *
 * @module modules/report/report.service
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { DvfIndicators, RiskScoreResult } from '@risquesavantachat/shared-types';
import { risksService } from '../risks/risks.service.js';
import { dvfService } from '../dvf/dvf.service.js';
import { logger } from '../../utils/logger.js';
import { DEFAULT_RADIUS_METERS } from '../risks/risks.constants.js';

/**
 * Rapport de risque complet pour une adresse.
 */
export interface Report {
  id: string;
  address: ReportAddress;
  riskScore: RiskScoreResult;
  dvfData?: DvfIndicators | null;
  synthesis?: string;
  createdAt: string;
}

/** Adresse minimale pour le rapport (label + coords requis) */
export interface ReportAddress {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: { label: string; [key: string]: unknown };
}

export interface ReportService {
  generateReport(address: ReportAddress, coords: [number, number]): Promise<Report>;
  generatePdf(report: Report): Promise<Uint8Array>;
  getReport(id: string): Promise<Report | null>;
}

const generateReport = async (
  address: ReportAddress,
  coords: [number, number]
): Promise<Report> => {
  const [lng, lat] = coords;
  const codeInsee = (address.properties?.citycode as string) || undefined;

  try {
    const [riskScore, dvfData] = await Promise.all([
      risksService.getRisksNearby(coords, DEFAULT_RADIUS_METERS, codeInsee),
      codeInsee ? dvfService.getIndicators(codeInsee, lat, lng) : Promise.resolve(null),
    ]);

    return {
      id: `report-${Date.now()}`,
      address,
      riskScore,
      dvfData: dvfData ?? undefined,
      synthesis: buildSynthesis(riskScore),
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.error('Failed to generate report data', err, { codeInsee, coords });
    throw err;
  }
};

/**
 * Nettoie le texte pour l'encodage WinAnsi.
 * Translittère les accents français vers ASCII pour garantir la compatibilité.
 * WinAnsi devrait supporter les accents, mais certains caractères peuvent poser problème.
 */
function cleanTextForPdf(text: string): string {
  return text
    // Espaces insécables problématiques (0x202F et 0x00A0 causent des erreurs)
    .replace(/\u202F/g, ' ') // Narrow No-Break Space → espace normal
    .replace(/\u00A0/g, ' ') // Non-breaking space → espace normal
    // Tirets Unicode → tiret ASCII
    .replace(/\u2013/g, '-') // En dash → tiret
    .replace(/\u2014/g, '-') // Em dash → tiret
    // Guillemets Unicode → guillemets ASCII
    .replace(/\u2018/g, "'") // Left single quotation mark → apostrophe
    .replace(/\u2019/g, "'") // Right single quotation mark → apostrophe
    .replace(/\u201C/g, '"') // Left double quotation mark → guillemet
    .replace(/\u201D/g, '"') // Right double quotation mark → guillemet
    // Symboles non supportés par WinAnsi
    .replace(/\u20AC/g, 'EUR') // Euro sign → EUR
    .replace(/\u00A9/g, '(c)') // Copyright → (c)
    .replace(/\u00AE/g, '(R)') // Registered → (R)
    .replace(/\u2122/g, '(TM)') // Trademark → (TM)
    .replace(/\u00B2/g, '2') // Superscript 2 → 2
    .replace(/\u00B3/g, '3') // Superscript 3 → 3
    .replace(/\u00B0/g, 'deg') // Degree sign → deg
    // Translittération accents français → ASCII (pour garantir compatibilité)
    .replace(/[àáâãäå]/gi, 'a')
    .replace(/[èéêë]/gi, 'e')
    .replace(/[ìíîï]/gi, 'i')
    .replace(/[òóôõö]/gi, 'o')
    .replace(/[ùúûü]/gi, 'u')
    .replace(/[ýÿ]/gi, 'y')
    .replace(/ç/gi, 'c')
    .replace(/ñ/gi, 'n')
    .replace(/[ÀÁÂÃÄÅ]/g, 'A')
    .replace(/[ÈÉÊË]/g, 'E')
    .replace(/[ÌÍÎÏ]/g, 'I')
    .replace(/[ÒÓÔÕÖ]/g, 'O')
    .replace(/[ÙÚÛÜ]/g, 'U')
    .replace(/[ÝŸ]/g, 'Y')
    .replace(/Ç/g, 'C')
    .replace(/Ñ/g, 'N');
}

function buildSynthesis(risk: RiskScoreResult): string {
  if (risk.categories.length === 0) return 'Aucun risque identifié pour cette commune.';
  const interp = risk.scoreInterpretation?.label ?? '';
  const lines = [
    `Score global : ${risk.globalScore}/100${interp ? ` — ${interp}` : ''}.`,
  ];
  for (const c of risk.categories) {
    lines.push(`- ${c.name} : ${c.description ?? `Niveau ${c.level}`}`);
    if (c.recommendation) lines.push(`  Recommandation : ${c.recommendation}`);
  }
  return lines.join('\n');
}

async function generatePdf(report: Report): Promise<Uint8Array> {
  try {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 750;
  const margin = 50;
  const lineHeight = 20;

  const addText = (text: string, size = 12, bold = false) => {
    const f = bold ? fontBold : font;
    const cleanedText = cleanTextForPdf(text);
    page.drawText(cleanedText, { x: margin, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
    y -= lineHeight;
  };

  page.drawText(cleanTextForPdf('Rapport RisquesAvantAchat'), {
    x: margin,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.05, 0.58, 0.53),
  });
  y -= lineHeight * 1.5;

  addText(`Adresse : ${report.address.properties.label}`, 12, true);
  y -= 8;
  const interp = report.riskScore.scoreInterpretation?.label;
  addText(
    `Score de risque : ${report.riskScore.globalScore}/100${interp ? ` - ${interp}` : ''}`,
    12
  );
  y -= 12;

  if (report.riskScore.categories.length > 0) {
    addText('Risques identifiés :', 11, true);
    for (const c of report.riskScore.categories) {
      addText(`  • ${c.name} - ${c.description ?? `Niveau ${c.level}`}`, 10);
    }
    y -= 8;
  }

  if (report.riskScore.documents.length > 0) {
    addText('Documents PPR :', 11, true);
    for (const d of report.riskScore.documents) {
      addText(`  • ${d.name}`, 9);
    }
    y -= 8;
  }

  const dvf = report.dvfData;
  if (dvf) {
    addText('Indicateurs DVF (prix immobilier) :', 11, true);
    const granularite =
      dvf.granularite === 'quartier' && dvf.rayonMeters
        ? `quartier (~${dvf.rayonMeters} m)`
        : dvf.granularite === 'quartier'
          ? 'quartier'
          : 'commune';
    // Utiliser replace pour éviter les espaces insécables de toLocaleString
    const prixM2 = dvf.prixM2Moyen != null 
      ? String(dvf.prixM2Moyen).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') 
      : '-';
    addText(`  Prix moyen : ${prixM2} EUR/m2 (${granularite})`, 10);
    if (dvf.nbMutations != null) {
      const nbMutations = String(dvf.nbMutations).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      addText(`  Nombre de ventes : ${nbMutations}`, 10);
    }
    if (dvf.annee) {
      addText(`  Annee des donnees : ${dvf.annee}`, 10);
    }
    if (dvf.nbMutations != null && dvf.nbMutations < 10) {
      addText('  (!) Echantillon faible - prix indicatif uniquement', 9);
    }
    y -= 8;
  }

    const dateStr = new Date().toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    addText(`Genere le ${dateStr}`, 9);
    return await doc.save();
  } catch (err) {
    logger.error('PDF generation failed', err, { reportId: report.id });
    throw err;
  }
}

const getReport = async (_id: string): Promise<Report | null> => {
  return null;
};

export const reportService: ReportService = {
  generateReport,
  generatePdf,
  getReport,
};
