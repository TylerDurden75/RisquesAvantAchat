/**
 * Routes API pour le géocodage et la recherche d'adresses.
 *
 * - GET /search : Autocomplétion d'adresses (q, limit)
 * - GET /:id : Détails adresse (non implémenté)
 *
 * @module modules/geocoding/geocoding.router
 */

import { Router } from 'express';
import { geocodingService } from './geocoding.service.js';
import { searchQuerySchema } from './geocoding.schemas.js';
import { apiError } from '../../middleware/errorHandler.js';

const router = Router();

router.get('/search', async (req, res, next) => {
  const parseResult = searchQuerySchema.safeParse(req.query);
  if (!parseResult.success) return next(parseResult.error);

  const { q, limit } = parseResult.data;

  try {
    const features = await geocodingService.searchAddresses(q, limit);
    res.json({ features });
  } catch (err) {
    next(apiError('Erreur géocodage', 502, 'EXTERNAL_SERVICE'));
  }
});

router.get('/:id', (_req, res) => {
  res.status(501).json({ error: 'Non implémenté' });
});

export default router;
