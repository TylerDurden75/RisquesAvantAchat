/**
 * Routes parcelle cadastrale (API Carto IGN).
 */

import { Router, Request, Response } from 'express';
import { getParcelleByPoint } from './cadastre.service.js';
import { logger } from '../../utils/logger.js';

const router = Router();

router.get('/parcelle', async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ error: 'Paramètres lat et lng requis (nombre valide)' });
  }
  try {
    const parcelle = await getParcelleByPoint(lng, lat);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.json(parcelle);
  } catch (err) {
    logger.error('GET /parcelle error', err);
    return res.status(502).json({ error: 'Service cadastre indisponible' });
  }
});

export default router;
