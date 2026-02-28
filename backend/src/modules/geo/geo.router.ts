/**
 * Proxy WMS BRGM — tuiles GetMap pour affichage zonage (RGA, MVT) sur la carte.
 *
 * Évite CORS, cache les tuiles côté serveur pour accélérer les réponses.
 * @see https://geoservices.brgm.fr/risques (GetCapabilities 1.3.0)
 *
 * @module modules/geo/geo.router
 */

import { Router, Request, Response } from 'express';
import { logger } from '../../utils/logger.js';
import { createLruCache } from '../../utils/cache.js';

const router = Router();

const BRGM_WMS_BASE = 'http://geoservices.brgm.fr/risques';

/** Cache tuiles WMS : 24h TTL, 2000 tuiles max. Préfixe de clé pour invalidation future (ex. wms-v2). */
const WMS_CACHE_KEY_PREFIX = 'wms-v1:';
const wmsTileCache = createLruCache<Buffer>({ ttl: 24 * 60 * 60 * 1000, max: 2000 });

/** Calques WMS BRGM autorisés (whitelist pour éviter abus). */
const WMS_LAYER_WHITELIST = new Set([
  'ALEARG',           // Aléa retrait-gonflement (préventif)
  'ALEARG_REALISE',   // RGA réalisé
  'MVT_LOCALISE',     // Mouvements de terrain localisés
  'MVT_COMMUNE',      // Mouvements de terrain à l'échelle commune
  'REMNAPPE',         // Cavités / marnières
  'SIS_FRANCE',       // Sismicité
]);

/**
 * GET /geo/wms — proxy GetMap WMS BRGM (avec cache serveur).
 * Query: layer (requis), bbox (requis, format minX,minY,maxX,maxY EPSG:3857), width?, height?
 */
router.get('/wms', async (req: Request, res: Response) => {
  const layer = typeof req.query.layer === 'string' ? req.query.layer.trim() : '';
  const bbox = typeof req.query.bbox === 'string' ? req.query.bbox.trim() : '';
  const width = Math.min(512, Math.max(64, parseInt(String(req.query.width || 256), 10) || 256));
  const height = Math.min(512, Math.max(64, parseInt(String(req.query.height || 256), 10) || 256));

  if (!layer || !WMS_LAYER_WHITELIST.has(layer)) {
    res.status(400).json({ error: 'Paramètre layer requis et doit être un calque autorisé.' });
    return;
  }
  if (!bbox || !/^-?[\d.e+-]+,-?[\d.e+-]+,-?[\d.e+-]+,-?[\d.e+-]+$/.test(bbox)) {
    res.status(400).json({ error: 'Paramètre bbox requis (minX,minY,maxX,maxY en EPSG:3857).' });
    return;
  }

  const cacheKey = WMS_CACHE_KEY_PREFIX + `${layer}:${width}:${height}:${bbox}`;
  const cached = wmsTileCache.get(cacheKey);
  if (cached) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(cached);
  }

  const url = new URL(BRGM_WMS_BASE);
  url.searchParams.set('SERVICE', 'WMS');
  url.searchParams.set('VERSION', '1.3.0');
  url.searchParams.set('REQUEST', 'GetMap');
  url.searchParams.set('FORMAT', 'image/png');
  url.searchParams.set('TRANSPARENT', 'TRUE');
  url.searchParams.set('LAYERS', layer);
  url.searchParams.set('CRS', 'EPSG:3857');
  url.searchParams.set('BBOX', bbox);
  url.searchParams.set('WIDTH', String(width));
  url.searchParams.set('HEIGHT', String(height));

  try {
    const upstream = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!upstream.ok) {
      logger.warn('WMS proxy upstream error', { layer, status: upstream.status });
      res.status(upstream.status).set('Content-Type', 'text/plain').send(upstream.statusText);
      return;
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    wmsTileCache.set(cacheKey, buf);
    res.setHeader('Content-Type', upstream.headers.get('Content-Type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buf);
  } catch (err) {
    logger.warn('WMS proxy fetch failed', { layer, err: (err as Error).message });
    res.status(502).json({ error: 'Service WMS temporairement indisponible.' });
  }
});

/**
 * GET /geo/wms/legend — proxy GetLegendGraphic BRGM pour afficher la légende des couleurs.
 * Query: layer (requis, ex. ALEARG_REALISE, MVT_LOCALISE).
 */
router.get('/wms/legend', async (req: Request, res: Response) => {
  const layer = typeof req.query.layer === 'string' ? req.query.layer.trim() : '';
  if (!layer || !WMS_LAYER_WHITELIST.has(layer)) {
    res.status(400).json({ error: 'Paramètre layer requis et doit être un calque autorisé.' });
    return;
  }
  const url = new URL(BRGM_WMS_BASE);
  url.searchParams.set('SERVICE', 'WMS');
  url.searchParams.set('VERSION', '1.3.0');
  url.searchParams.set('REQUEST', 'GetLegendGraphic');
  url.searchParams.set('FORMAT', 'image/png');
  url.searchParams.set('LAYER', layer);
  try {
    const upstream = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) {
      res.status(upstream.status).end();
      return;
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', upstream.headers.get('Content-Type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buf);
  } catch {
    res.status(502).end();
  }
});

export default router;
