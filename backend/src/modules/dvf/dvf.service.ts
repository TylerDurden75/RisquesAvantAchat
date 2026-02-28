/**
 * Service DVF — indicateurs de prix immobiliers.
 *
 * Tente d'abord les prix localisés (rayon 500 m) via l'API cquest, sinon fallback
 * sur les indicateurs par commune (API Tabulaire data.gouv.fr).
 *
 * @module modules/dvf/dvf.service
 */

import type { DvfIndicators } from '@risquesavantachat/shared-types';
import { createLruCache } from '../../utils/cache.js';
import { logger } from '../../utils/logger.js';

export type { DvfIndicators };

const TABULAR_API =
  'https://tabular-api.data.gouv.fr/api/resources/1b85be7c-17ce-42dc-b191-3b8f3c469087/data';
const CQUEST_API = 'https://api.cquest.org/dvf';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** Préfixe des clés de cache (changer pour v2 lors d'un changement de format). */
const CACHE_KEY_DVF = 'dvf-v1-';
const CACHE_KEY_DVF_COORDS = 'dvf-coords-v1-';

const store = createLruCache<DvfIndicators>({ ttl: CACHE_TTL_MS, max: 1000 });

/** Cache pour requêtes par coords (clé "lat,lon" avec précision 4 décimales) */
const storeCoords = createLruCache<DvfIndicators>({ ttl: CACHE_TTL_MS, max: 1000 });

export interface DvfService {
  getIndicatorsByCommune(codeInsee: string): Promise<DvfIndicators | null>;
  getIndicators(codeInsee: string, lat?: number, lon?: number): Promise<DvfIndicators | null>;
}

async function getIndicatorsByCommune(codeInsee: string): Promise<DvfIndicators | null> {
  const cacheKey = CACHE_KEY_DVF + codeInsee;
  const cached = store.get(cacheKey);
  if (cached) {
    logger.info('Cache hit for DVF commune', { codeInsee });
    return cached;
  }

  try {
    for (const annee of ['2024', '2023']) {
      const url = `${TABULAR_API}/?INSEE_COM__exact=${encodeURIComponent(codeInsee)}&annee__exact=${annee}&page_size=1`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = (await res.json()) as {
        data?: Array<{
          Prixm2Moyen?: number;
          PrixMoyen?: number;
          nb_mutations?: number;
          NbMaisons?: number;
          NbApparts?: number;
          PropMaison?: number;
          PropAppart?: number;
          SurfaceMoy?: number;
          annee?: string;
        }>;
      };
      const row = json.data?.[0];
      if (!row) continue;

      const data: DvfIndicators = {
        codeInsee,
        prixM2Moyen: row.Prixm2Moyen,
        prixMoyen: row.PrixMoyen,
        nbMutations: row.nb_mutations,
        nbMaisons: row.NbMaisons,
        nbApparts: row.NbApparts,
        propMaison: row.PropMaison,
        propAppart: row.PropAppart,
        surfaceMoy: row.SurfaceMoy,
        annee: row.annee,
      };
      store.set(cacheKey, data);
      return data;
    }
    return null;
  } catch (e) {
    logger.error('DVF commune fetch error', e, { codeInsee, endpoint: 'tabular-api' });
    return null;
  }
}

interface CquestFeature {
  type: string;
  properties?: Record<string, unknown>;
}

function getProp(props: Record<string, unknown> | undefined, ...keys: string[]): number | undefined {
  if (!props) return undefined;
  for (const k of keys) {
    const v = props[k];
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = parseFloat(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function aggregateFromCquest(
  features: CquestFeature[],
  codeInsee: string
): DvfIndicators | null {
  const valid: { prixM2: number; surface: number; type: string }[] = [];
  for (const f of features) {
    const vf = getProp(f.properties, 'valeur_fonciere', 'Valeur_fonciere');
    const surf = getProp(f.properties, 'surface_reelle_bati');
    const type = String(f.properties?.type_local ?? f.properties?.type ?? '').toLowerCase();
    if (
      typeof vf !== 'number' ||
      typeof surf !== 'number' ||
      vf < 15000 ||
      vf > 10_000_000 ||
      surf < 10
    )
      continue;
    const prixM2 = vf / surf;
    if (prixM2 < 330 || prixM2 > 15000) continue;
    const isMaison = type.includes('maison');
    const isAppart = type.includes('appartement');
    if (!isMaison && !isAppart) continue;
    if (isAppart && surf > 250) continue;
    if (isMaison && surf > 400) continue;
    valid.push({
      prixM2,
      surface: surf,
      type: isMaison ? 'maison' : 'appartement',
    });
  }
  if (valid.length < 3) return null;
  const prixM2Moyen =
    valid.reduce((s, x) => s + x.prixM2, 0) / valid.length;
  const prixMoyen = valid.reduce((s, x) => s + x.prixM2 * x.surface, 0) / valid.length;
  const nbMaisons = valid.filter((x) => x.type === 'maison').length;
  const nbApparts = valid.filter((x) => x.type === 'appartement').length;
  const surfaceMoy =
    valid.reduce((s, x) => s + x.surface, 0) / valid.length;
  return {
    codeInsee,
    granularite: 'quartier',
    prixM2Moyen: Math.round(prixM2Moyen),
    prixMoyen: Math.round(prixMoyen),
    nbMutations: valid.length,
    nbMaisons,
    nbApparts,
    propMaison: Math.round((nbMaisons / valid.length) * 100),
    propAppart: Math.round((nbApparts / valid.length) * 100),
    surfaceMoy: Math.round(surfaceMoy * 10) / 10,
    annee: new Date().getFullYear().toString(),
  };
}

async function getIndicatorsNearby(
  lat: number,
  lon: number,
  codeInsee: string
): Promise<DvfIndicators | null> {
  const coordsKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cacheKey = CACHE_KEY_DVF_COORDS + coordsKey;
  const cached = storeCoords.get(cacheKey);
  if (cached) {
    logger.info('Cache hit for DVF coords', { codeInsee, key: coordsKey });
    return cached;
  }

  try {
    const url = `${CQUEST_API}?lat=${lat}&lon=${lon}&dist=500`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      type?: string;
      features?: CquestFeature[];
    };
    const features = json.features ?? [];
    const data = aggregateFromCquest(features, codeInsee);
    if (data) {
      storeCoords.set(cacheKey, data);
      return data;
    }
  } catch (e) {
    logger.warn('Cquest API failed', {
      codeInsee,
      key: coordsKey,
      errMessage: e instanceof Error ? e.message : String(e),
    });
  }
  return null;
}

async function getIndicators(
  codeInsee: string,
  lat?: number,
  lon?: number
): Promise<DvfIndicators | null> {
  if (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon)
  ) {
    const local = await getIndicatorsNearby(lat, lon, codeInsee);
    if (local) return local;
  }
  const commune = await getIndicatorsByCommune(codeInsee);
  return commune ? { ...commune, granularite: 'commune' } : null;
}

export const dvfService: DvfService = {
  getIndicatorsByCommune,
  getIndicators,
};
