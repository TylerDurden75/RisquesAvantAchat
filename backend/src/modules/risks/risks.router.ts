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
import { nearbyQuerySchema, zonesQuerySchema } from './risks.schemas.js';
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

export default router;
