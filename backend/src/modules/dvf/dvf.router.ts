/**
 * Routes API DVF — indicateurs prix immobiliers.
 */

import { Router } from 'express';
import { dvfService } from './dvf.service.js';
import { indicatorsQuerySchema } from './dvf.schemas.js';
import { apiError } from '../../middleware/errorHandler.js';

const router = Router();

router.get('/indicators', async (req, res, next) => {
  const parseResult = indicatorsQuerySchema.safeParse(req.query);
  if (!parseResult.success) return next(parseResult.error);

  const { code_insee, lat, lon, section, numero } = parseResult.data;

  const parcelle =
    section != null && section !== '' && numero != null && numero !== ''
      ? { code_insee, section, numero }
      : undefined;

  try {
    const data = await dvfService.getIndicators(code_insee, lat, lon, parcelle);
    res.json(data ?? { codeInsee: code_insee, message: 'Données DVF non disponibles' });
  } catch (err) {
    next(apiError('Erreur chargement DVF', 502, 'EXTERNAL_SERVICE'));
  }
});

export default router;
