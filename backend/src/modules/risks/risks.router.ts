/**
 * Routes API pour les risques à proximité.
 *
 * - GET /nearby : Risques autour d'un point (lat, lng, radius)
 * - GET /zones : Zones PPR (géométries) pour affichage carte
 *
 * @module modules/risks/risks.router
 */

import { Router } from 'express';
import { logger } from '../../utils/logger.js';
import { risksService } from './risks.service.js';
import { nearbyQuerySchema, zonesQuerySchema, etatDesRisquesQuerySchema } from './risks.schemas.js';
import { apiError } from '../../middleware/errorHandler.js';

const router = Router();

router.get('/nearby', async (req, res, next) => {
  const parseResult = nearbyQuerySchema.safeParse(req.query);
  if (!parseResult.success) return next(parseResult.error);

  const { lat, lng, code_insee, radius } = parseResult.data;
  const codeInsee = code_insee && code_insee.trim() ? code_insee.trim() : undefined;
  if (!codeInsee) {
    logger.warn('GET /api/risks/nearby: code_insee absent, retour vide', { lat, lng });
  }
  logger.info('GET /api/risks/nearby', { lat, lng, code_insee: codeInsee ?? '(absent)', radius });

  try {
    const result = await risksService.getRisksNearby([lng, lat], radius, codeInsee);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.json(result);
  } catch (err) {
    next(apiError('Erreur calcul risques', 502, 'EXTERNAL_SERVICE'));
  }
});

router.get('/zones', async (req, res, next) => {
  const parseResult = zonesQuerySchema.safeParse(req.query);
  if (!parseResult.success) return next(parseResult.error);

  const { code_insee } = parseResult.data;
  logger.info('GET /api/risks/zones', { code_insee });

  try {
    const result = await risksService.getRiskZones(code_insee);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.json(result);
  } catch (err) {
    next(apiError('Erreur chargement zones PPR', 502, 'EXTERNAL_SERVICE'));
  }
});

/** Pré-remplissage formulaire état des risques — JSON synthèse des risques pour la commune (et parcelle si lat/lng fournis). */
router.get('/etat-des-risques', async (req, res, next) => {
  const parseResult = etatDesRisquesQuerySchema.safeParse(req.query);
  if (!parseResult.success) return next(parseResult.error);

  const { code_insee, lat, lng } = parseResult.data;
  const coords: [number, number] | undefined =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng) ? [lng, lat] : undefined;

  try {
    const result = await risksService.getRisksNearby(
      coords ?? [0, 0],
      undefined,
      code_insee
    );
    const body = {
      code_insee,
      parcelle: result.parcelle ?? null,
      categories: result.categories.map((c) => ({
        id: c.id,
        name: c.name,
        level: c.level,
        description: c.description,
        recommendation: c.recommendation,
      })),
      documents: result.documents,
      globalScore: result.globalScore,
      generatedAt: new Date().toISOString(),
    };
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.json(body);
  } catch (err) {
    next(apiError('Erreur état des risques', 502, 'EXTERNAL_SERVICE'));
  }
});

export default router;
