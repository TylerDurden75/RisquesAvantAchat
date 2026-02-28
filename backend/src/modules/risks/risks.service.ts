/**
 * Service de calcul des risques environnementaux et géologiques.
 *
 * Agrège les données Georisques API v2 : radon, sismicité, PPR (PPRN/PPRT/PPRM), MVT, RGA (argiles), AZI (atlas zones inondables).
 * Le rapport PDF communal reste servi en v1 (lien uniquement). Token Bearer requis pour la v2.
 *
 * @module modules/risks/risks.service
 * @see https://www.georisques.gouv.fr/doc-api?urls.primaryName=Api%20de%20G%C3%A9orisques%20V2
 */

import type {
  Coordinates,
  RiskCategory,
  RiskDocument,
  RiskScoreResult,
  RiskZonesGeoJSON,
  ScoreInterpretation,
} from '@risquesavantachat/shared-types';
import { z } from 'zod';
import {
  georisquesAdapter,
  GEORISQUES_BASE,
  GEORISQUES_BASE_PDF,
} from '../../adapters/georisques.adapter.js';
import { createLruCache } from '../../utils/cache.js';
import { logger } from '../../utils/logger.js';
import {
  DEFAULT_RADIUS_METERS,
  DEFAULT_PPR_PAGE_SIZE,
  PPR_TIMEOUT_MS,
  ZONES_TIMEOUT_MS,
  MAX_PPR_DETAIL_PER_TYPE,
  MAX_SCORE_PER_CATEGORY,
  SCORE_THRESHOLDS,
  MAX_SISMICITE_LEVEL,
} from './risks.constants.js';
import {
  radonResponseSchema,
  sismiciteResponseSchema,
  mvtResponseSchema,
  pprResponseSchema,
  pprDetailResponseSchema,
  rgaResponseSchema,
  aziResponseSchema,
} from './risks.schemas.js';

export type { RiskCategory, RiskDocument, RiskScoreResult, RiskZonesGeoJSON, ScoreInterpretation };

/** TTL du cache serveur : 24h (données Georisques peu changeantes) */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** Préfixe des clés de cache (changer pour v2 lors d'un changement de format). */
const CACHE_KEY_RISKS = 'risk-v1-';
const CACHE_KEY_ZONES = 'zones-v1-';

const risksCache = createLruCache<RiskScoreResult>({ ttl: CACHE_TTL_MS, max: 1000 });
const zonesCache = createLruCache<RiskZonesGeoJSON>({ ttl: CACHE_TTL_MS, max: 1000 });

export interface RisksService {
  getRisksNearby(
    coords: Coordinates,
    radiusMeters?: number,
    codeInsee?: string
  ): Promise<RiskScoreResult>;
  getRiskZones(codeInsee: string): Promise<RiskZonesGeoJSON>;
}

function levelFromRadon(classe: string): number {
  const n = parseInt(classe, 10);
  if (n === 1) return 0;
  if (n === 2) return 2;
  if (n === 3) return 4;
  return 0;
}

function levelFromSismicite(zone: string): number {
  const m = zone.match(/(\d)/);
  const n = m ? parseInt(m[1], 10) : 0;
  return Math.min(n, MAX_SISMICITE_LEVEL);
}

const RECOMMENDATIONS: Record<string, string> = {
  radon:
    'Faire mesurer le radon avant achat. Vérifier l\'étanchéité du sous-sol et prévoir une ventilation adaptée.',
  sismicite:
    'Vérifier la résistance parasismique du bâti. Consulter le Dossier de Diagnostic Technique (DDT).',
  argiles:
    'Consulter l\'étude géotechnique (G1-G2) si travaux prévus. Anticiper les travaux de confortement.',
  mvt:
    'Consulter l\'étude géotechnique (G1-G2) si travaux prévus. Anticiper les travaux de confortement.',
  ppr: 'Consulter le PPR en mairie. Vérifier les obligations d\'assurance (catastrophes naturelles).',
  azi: 'Consulter l\'atlas des zones inondables (AZI) en mairie ou sur Georisques. Vérifier l\'assurance catastrophes naturelles.',
};

function getScoreInterpretation(score: number): ScoreInterpretation {
  if (score >= SCORE_THRESHOLDS.CRITICAL) return { label: 'À éviter', level: 'critical' };
  if (score >= SCORE_THRESHOLDS.HIGH) return { label: 'À surveiller', level: 'high' };
  if (score >= SCORE_THRESHOLDS.MODERATE) return { label: 'Bien géré', level: 'moderate' };
  return { label: 'Risque faible', level: 'low' };
}

interface GeomFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
}

type RadonData = z.infer<typeof radonResponseSchema>;
type SismiciteData = z.infer<typeof sismiciteResponseSchema>;
type MvtData = z.infer<typeof mvtResponseSchema>;
type PprData = z.infer<typeof pprResponseSchema>;
type RgaData = z.infer<typeof rgaResponseSchema>;
type AziData = z.infer<typeof aziResponseSchema>;

/**
 * Traite les données radon et retourne une catégorie (toujours si données présentes, y compris niveau faible).
 */
function processRadonData(data: RadonData | null): { category: RiskCategory | null; level: number } {
  if (!data?.data?.length) return { category: null, level: 0 };
  const d = data.data[0];
  const level = levelFromRadon(d.classe_potentiel);
  const desc =
    String(d.classe_potentiel || '') === '1' ||
    String(d.classe_potentiel || '') === '2' ||
    String(d.classe_potentiel || '') === '3'
      ? `Potentiel ${d.classe_potentiel}${level === 0 ? ' (faible)' : ''}`
      : `Potentiel ${d.classe_potentiel}`;
  return {
    category: {
      id: 'radon',
      name: 'Radon',
      level,
      description: desc,
      recommendation: level > 0 ? RECOMMENDATIONS.radon : undefined,
    },
    level,
  };
}

/**
 * Traite les données sismicité et retourne une catégorie (toujours si données présentes, y compris zone 1).
 */
function processSismiciteData(data: SismiciteData | null): { category: RiskCategory | null; level: number } {
  if (!data?.data?.length) return { category: null, level: 0 };
  const d = data.data[0];
  const level = levelFromSismicite(d.zone_sismicite);
  const zoneLabel = d.zone_sismicite || 'Non renseigné';
  return {
    category: {
      id: 'sismicite',
      name: 'Sismicité',
      level,
      description: zoneLabel + (level === 0 ? ' (très faible)' : ''),
      recommendation: level > 0 ? RECOMMENDATIONS.sismicite : undefined,
    },
    level,
  };
}

/**
 * Traite les données mouvements de terrain : catégorie toujours renvoyée (avec "Aucun" si pas de données).
 */
function processMvtData(data: MvtData | null): { category: RiskCategory | null; level: number } {
  if (data && data.results > 0 && data.data?.length) {
    const first = data.data[0];
    const desc = first.type || first.libelle_alea || `Mouvement de terrain (${data.results} aléa(s))`;
    return {
      category: {
        id: 'mvt',
        name: 'Mouvements de terrain',
        level: 3,
        description: desc,
        recommendation: RECOMMENDATIONS.mvt,
      },
      level: 3,
    };
  }
  return {
    category: {
      id: 'mvt',
      name: 'Mouvements de terrain',
      level: 0,
      description: 'Aucun mouvement de terrain identifié',
    },
    level: 0,
  };
}

/**
 * Traite les données AZI (Atlas des zones inondables) : catégorie toujours renvoyée.
 */
function processAziData(data: AziData | null): { category: RiskCategory | null; level: number } {
  if (data?.data?.length) {
    const level = 2;
    const libelles = data.data.map((a) => a.libelle).filter(Boolean);
    const description =
      libelles.length <= 2
        ? libelles.join(' ; ')
        : `${data.total} atlas recensé(s) (ex. ${libelles[0] ?? 'zones inondables'})`;
    return {
      category: {
        id: 'azi',
        name: 'Atlas zones inondables (AZI)',
        level,
        description,
        recommendation: RECOMMENDATIONS.azi,
      },
      level,
    };
  }
  return {
    category: {
      id: 'azi',
      name: 'Atlas zones inondables (AZI)',
      level: 0,
      description: 'Aucun atlas recensé',
    },
    level: 0,
  };
}

/**
 * Traite les données RGA (argiles) : catégorie toujours renvoyée (avec "Non concerné" si pas de données ou niveau 0).
 */
function processRgaData(data: RgaData | null): { category: RiskCategory | null; level: number } {
  if (data?.data?.length) {
    const d = data.data[0];
    const level = d.level;
    if (level >= 1) {
      return {
        category: {
          id: 'argiles',
          name: 'Retrait-gonflement argiles',
          level,
          description: d.libelle,
          recommendation: RECOMMENDATIONS.argiles,
        },
        level,
      };
    }
  }
  return {
    category: {
      id: 'argiles',
      name: 'Retrait-gonflement argiles',
      level: 0,
      description: 'Non concerné ou non renseigné',
    },
    level: 0,
  };
}

/**
 * Fusionne les réponses PPR Naturels (pprn), Technologiques (pprt) et Miniers (pprm) en une seule.
 */
function mergePprResponses(
  pprn: PprData | null,
  pprt: PprData | null,
  pprm: PprData | null
): PprData | null {
  const data = [
    ...(pprn?.data ?? []),
    ...(pprt?.data ?? []),
    ...(pprm?.data ?? []),
  ];
  if (data.length === 0) return null;
  return { data, results: data.length };
}

/**
 * Traite les données PPR : catégorie toujours renvoyée (avec "Aucun document" si pas de PPR).
 */
function processPprData(data: PprData | null, reportPdfUrl: string): {
  category: RiskCategory | null;
  documents: RiskDocument[];
  level: number;
} {
  const level = data && data.results > 0 ? 2 : 0;
  const category: RiskCategory = {
    id: 'ppr',
    name: 'PPR (risques naturels)',
    level,
    description: data && data.results > 0 ? `${data.results} document(s)` : 'Aucun document',
    recommendation: level > 0 ? RECOMMENDATIONS.ppr : undefined,
  };
  const documents: RiskDocument[] =
    data?.data?.length
      ? (data.data ?? []).map((p, index) => {
          const id = p.id_gaspar ?? p.idGaspar ?? '';
          const nom = (p.nom_ppr ?? p.nomPpr ?? p.libPpr ?? '').trim();
          const risqueLibelle = p.risque?.libelle_risque ?? p.risque?.libelleRisque ?? 'Risque naturel';
          const dateApprob = p.date_approbation ?? p.dateApprobation ?? undefined;
          const etatLibelle = p.etat?.libelle_etat ?? p.etat?.libelleEtat;
          const composed = [risqueLibelle, dateApprob, id].filter(Boolean).join(' · ');
          const displayName = nom || composed || `${risqueLibelle} (${index + 1})`;
          return {
            id,
            name: displayName,
            riskType: risqueLibelle,
            approvalDate: dateApprob ?? undefined,
            status: etatLibelle,
            reportUrl: reportPdfUrl,
          };
        })
      : [];
  return { category, documents, level };
}

/** Résultat brut des appels Georisques (avant agrégation). */
interface RawRiskData {
  radon: RadonData | null;
  sismicite: SismiciteData | null;
  pprn: PprData | null;
  pprt: PprData | null;
  pprm: PprData | null;
  mvt: MvtData | null;
  rga: RgaData | null;
  azi: AziData | null;
}

/**
 * Récupère toutes les données Georisques en parallèle pour un code Insee.
 */
async function fetchAllRiskData(codeInsee: string): Promise<RawRiskData> {
  const [radonRes, sismiciteRes, pprnRes, pprtRes, pprmRes, mvtRes, rgaRes, aziRes] = await Promise.allSettled([
    georisquesAdapter.get(`/radon?codesInsee=${codeInsee}&pageSize=10&pageNumber=0`, 8000, { codeInsee }).then((data) => radonResponseSchema.parse(data)),
    georisquesAdapter.get(`/zonage_sismique?code_insee=${codeInsee}`, 8000, { codeInsee }).then((data) => sismiciteResponseSchema.parse(data)),
    georisquesAdapter.get(`/gaspar/pprn?codesInsee=${codeInsee}&pageSize=${DEFAULT_PPR_PAGE_SIZE}&pageNumber=0`, PPR_TIMEOUT_MS, { codeInsee }).then((data) => pprResponseSchema.parse(data)),
    georisquesAdapter.get(`/gaspar/pprt?codesInsee=${codeInsee}&pageSize=${DEFAULT_PPR_PAGE_SIZE}&pageNumber=0`, PPR_TIMEOUT_MS, { codeInsee }).then((data) => pprResponseSchema.parse(data)),
    georisquesAdapter.get(`/gaspar/pprm?codesInsee=${codeInsee}&pageSize=${DEFAULT_PPR_PAGE_SIZE}&pageNumber=0`, PPR_TIMEOUT_MS, { codeInsee }).then((data) => pprResponseSchema.parse(data)),
    georisquesAdapter.get(`/mvt?code_insee=${codeInsee}`, PPR_TIMEOUT_MS, { codeInsee })
      .then((data) => mvtResponseSchema.parse(data))
      .catch((err) => {
        logger.warn('MVT API failed, continuing without data', { codeInsee, message: err instanceof Error ? err.message : String(err) });
        return mvtResponseSchema.parse({ data: [], results: 0 });
      }),
    georisquesAdapter.get(`/rga?codesInsee=${codeInsee}&pageSize=10&pageNumber=0`, 8000, { codeInsee })
      .then((data) => rgaResponseSchema.parse(data))
      .catch((err) => {
        logger.warn('RGA API failed, continuing without data', { codeInsee, message: err instanceof Error ? err.message : String(err) });
        return rgaResponseSchema.parse({ data: [] });
      }),
    georisquesAdapter.get(`/gaspar/azi?codesInsee=${codeInsee}&pageSize=20&pageNumber=0`, 8000, { codeInsee })
      .then((data) => aziResponseSchema.parse(data))
      .catch((err) => {
        logger.warn('AZI API failed, continuing without data', { codeInsee, message: err instanceof Error ? err.message : String(err) });
        return aziResponseSchema.parse({ content: [], totalElements: 0 });
      }),
  ]);
  return {
    radon: radonRes.status === 'fulfilled' ? radonRes.value : null,
    sismicite: sismiciteRes.status === 'fulfilled' ? sismiciteRes.value : null,
    pprn: pprnRes.status === 'fulfilled' ? (pprnRes.value as PprData) : null,
    pprt: pprtRes.status === 'fulfilled' ? (pprtRes.value as PprData) : null,
    pprm: pprmRes.status === 'fulfilled' ? (pprmRes.value as PprData) : null,
    mvt: mvtRes.status === 'fulfilled' ? mvtRes.value : null,
    rga: rgaRes.status === 'fulfilled' ? rgaRes.value : null,
    azi: aziRes.status === 'fulfilled' ? aziRes.value : null,
  };
}

/**
 * Agrège les données brutes en catégories et documents (utilisation des process*).
 */
function aggregateRiskData(raw: RawRiskData, reportPdfUrl: string): { categories: RiskCategory[]; documents: RiskDocument[]; totalLevel: number } {
  const categories: RiskCategory[] = [];
  const documents: RiskDocument[] = [];
  let totalLevel = 0;

  const radon = processRadonData(raw.radon);
  if (radon.category) {
    categories.push(radon.category);
    totalLevel += radon.level;
  }
  const sismicite = processSismiciteData(raw.sismicite);
  if (sismicite.category) {
    categories.push(sismicite.category);
    totalLevel += sismicite.level;
  }
  const mvt = processMvtData(raw.mvt);
  categories.push(mvt.category!);
  totalLevel += mvt.level;

  return { categories, documents, totalLevel };
}

const getRisksNearby = async (
  coords: Coordinates,
  _radiusMeters = DEFAULT_RADIUS_METERS,
  codeInsee?: string
): Promise<RiskScoreResult> => {
  if (!codeInsee) {
    return { globalScore: 0, categories: [], documents: [] };
  }

  const cacheKey = CACHE_KEY_RISKS + codeInsee;
  const cached = risksCache.get(cacheKey);
  if (cached) {
    logger.info('Cache hit for risks', { codeInsee });
    return cached;
  }

  const reportPdfUrl = `${GEORISQUES_BASE_PDF}/rapport_pdf?code_insee=${codeInsee}`;
  let categories: RiskCategory[] = [];
  let documents: RiskDocument[] = [];
  let totalLevel = 0;

  try {
    const raw = await fetchAllRiskData(codeInsee);
    const partial = aggregateRiskData(raw, reportPdfUrl);
    categories = partial.categories;
    documents = partial.documents;
    totalLevel = partial.totalLevel;

    const pprMerged = mergePprResponses(raw.pprn, raw.pprt, raw.pprm);
    const ppr = processPprData(pprMerged, reportPdfUrl);
    categories.push(ppr.category!);
    documents.push(...ppr.documents);
    totalLevel += ppr.level;

    const rga = processRgaData(raw.rga);
    categories.push(rga.category!);
    totalLevel += rga.level;

    const azi = processAziData(raw.azi);
    categories.push(azi.category!);
    totalLevel += azi.level;
  } catch (e) {
    logger.error('Georisques fetch error', e, { codeInsee, endpoint: 'risks/nearby' });
  }

  const maxScore = categories.length * MAX_SCORE_PER_CATEGORY;
  const globalScore = maxScore > 0 ? Math.round((totalLevel / maxScore) * 100) : 0;

  const result: RiskScoreResult = {
    globalScore,
    scoreInterpretation: getScoreInterpretation(globalScore),
    categories,
    documents,
  };
  risksCache.set(cacheKey, result);
  logger.info('getRisksNearby: résultat', { codeInsee, globalScore, nbCategories: categories.length, nbDocuments: documents.length });
  return result;
};

/**
 * Récupère les zones PPR (géométries) pour affichage carte.
 *
 * Limitation API v2 : l’API REST Georisques v2 renvoie des listes / métadonnées (identifiants,
 * niveaux de risque, références) mais ne garantit pas de géométries GeoJSON par endpoint.
 * On tente le détail GET /gaspar/pprn|pprt|pprm/{idGaspar} ; si la réponse contient des géométries
 * (geom_zonage, geom_perimetre), on les affiche. Sinon, pour un zonage cartographique complet,
 * il faudrait combiner l’API (listes, niveaux) avec des données géographiques brutes (WFS/WMS
 * ou shapefiles Georisques). Voir docs/ZONAGE_OPENDATA_ROADMAP.md pour une feuille de route
 * (API v2 + open data BRGM, IGN, Copernicus, OSM, etc.).
 */
const getRiskZones = async (codeInsee: string): Promise<RiskZonesGeoJSON> => {
  const features: RiskZonesGeoJSON['features'] = [];
  const params = `codesInsee=${codeInsee}&pageSize=${DEFAULT_PPR_PAGE_SIZE}&pageNumber=0`;
  logger.info('getRiskZones: début', { codeInsee });
  try {
    const [pprnRes, pprtRes, pprmRes] = await Promise.allSettled([
      georisquesAdapter.get(`/gaspar/pprn?${params}`, ZONES_TIMEOUT_MS, { codeInsee }).then((data) => pprResponseSchema.parse(data)),
      georisquesAdapter.get(`/gaspar/pprt?${params}`, ZONES_TIMEOUT_MS, { codeInsee }).then((data) => pprResponseSchema.parse(data)),
      georisquesAdapter.get(`/gaspar/pprm?${params}`, ZONES_TIMEOUT_MS, { codeInsee }).then((data) => pprResponseSchema.parse(data)),
    ]);
    const pprn = pprnRes.status === 'fulfilled' ? pprnRes.value : null;
    const pprt = pprtRes.status === 'fulfilled' ? pprtRes.value : null;
    const pprm = pprmRes.status === 'fulfilled' ? pprmRes.value : null;
    const lists: Array<{ type: 'pprn' | 'pprt' | 'pprm'; data: PprData['data'] }> = [
      { type: 'pprn', data: pprn?.data ?? [] },
      { type: 'pprt', data: pprt?.data ?? [] },
      { type: 'pprm', data: pprm?.data ?? [] },
    ];
    const countPprn = pprn?.data?.length ?? 0;
    const countPprt = pprt?.data?.length ?? 0;
    const countPprm = pprm?.data?.length ?? 0;
    logger.info('getRiskZones: listes PPR reçues', { codeInsee, pprn: countPprn, pprt: countPprt, pprm: countPprm });

    for (const { type, data } of lists) {
      const toFetch = (data ?? []).slice(0, MAX_PPR_DETAIL_PER_TYPE);
      for (const p of toFetch) {
        const idGaspar = p.id_gaspar ?? p.idGaspar ?? '';
        if (!idGaspar) continue;
        try {
          const raw = await georisquesAdapter.get(
            `/gaspar/${type}/${encodeURIComponent(idGaspar)}`,
            ZONES_TIMEOUT_MS,
            { codeInsee }
          );
          const detail = pprDetailResponseSchema.safeParse(raw);
          if (!detail.success) {
            logger.warn('getRiskZones: détail invalide (schema)', { codeInsee, type, idGaspar });
            continue;
          }
          const d = detail.data;
          const riskType = (
            d.risque?.libelle_risque ??
            d.risque?.libelleRisque ??
            d.libBassinRisques ??
            d.modeleProcedure ??
            'Risque naturel'
          ).trim();
          const dateApprob = d.date_approbation ?? d.dateApprobation ?? d.dateModification;
          const approvalYear = dateApprob ? new Date(dateApprob).getFullYear() : undefined;
          const geomSource =
            (d.geom_zonage?.features?.length ?? d.geomZonage?.features?.length ?? 0) > 0
              ? (d.geom_zonage ?? d.geomZonage)!
              : (d.geom_perimetre ?? d.geomPerimetre);
          if (!geomSource?.features?.length) {
            logger.info('getRiskZones: détail sans géométrie', { codeInsee, type, idGaspar });
            continue;
          }
          const nom = d.nom_ppr ?? d.nomPpr ?? d.libPpr ?? '';
          let added = 0;
          for (const f of geomSource.features) {
            const feature = f as GeomFeature;
            if (!feature.geometry?.coordinates) continue;
            features.push({
              type: 'Feature',
              properties: {
                id: idGaspar,
                name: nom,
                riskType,
                ...(approvalYear != null && { approvalYear }),
              },
              geometry: feature.geometry,
            });
            added++;
          }
          logger.info('getRiskZones: détail OK', { codeInsee, type, idGaspar, riskType, featuresAdded: added });
        } catch (err) {
          logger.warn('getRiskZones: détail échec', {
            codeInsee,
            type,
            idGaspar,
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    if (features.length === 0) {
      try {
        const v1Raw = await georisquesAdapter.getV1<{
          results?: number;
          data?: Array<{
            id_gaspar?: string;
            nom_ppr?: string;
            date_approbation?: string | null;
            risque?: { libelle_risque?: string };
            geom_perimetre?: { features?: Array<{ type: string; geometry?: { type: string; coordinates: unknown }; properties?: unknown }> };
            geom_zonage?: { features?: Array<{ type: string; geometry?: { type: string; coordinates: unknown }; properties?: unknown }> };
          }>;
        }>(`/ppr?code_insee=${codeInsee}`, ZONES_TIMEOUT_MS, { codeInsee });
        const v1Data = v1Raw?.data ?? [];
        for (const p of v1Data) {
          const geomSource =
            (p.geom_zonage?.features?.length ?? 0) > 0
              ? p.geom_zonage
              : p.geom_perimetre;
          if (!geomSource?.features?.length) continue;
          const idGaspar = p.id_gaspar ?? '';
          const nom = p.nom_ppr ?? '';
          const riskType = (p.risque?.libelle_risque ?? 'Risque naturel').trim();
          const approvalYear = p.date_approbation ? new Date(p.date_approbation).getFullYear() : undefined;
          for (const f of geomSource.features) {
            if (!f.geometry?.coordinates) continue;
            features.push({
              type: 'Feature',
              properties: {
                id: idGaspar,
                name: nom,
                riskType,
                ...(Number.isFinite(approvalYear) && approvalYear != null && { approvalYear }),
              },
              geometry: f.geometry,
            });
          }
        }
        if (features.length > 0) {
          logger.info('getRiskZones: fallback v1 utilisé (géométries)', { codeInsee, totalFeatures: features.length });
        }
      } catch (err) {
        logger.warn('getRiskZones: fallback v1 échoué', { codeInsee, message: err instanceof Error ? err.message : String(err) });
      }
    }

    logger.info('getRiskZones: fin', { codeInsee, totalFeatures: features.length });
  } catch (e) {
    logger.error('Georisques zones fetch error', e, { codeInsee, endpoint: 'risks/zones' });
  }
  const result: RiskZonesGeoJSON = { type: 'FeatureCollection', features };
  if (features.length > 0) zonesCache.set(CACHE_KEY_ZONES + codeInsee, result);
  return result;
};

export const risksService: RisksService = {
  getRisksNearby,
  getRiskZones,
};
