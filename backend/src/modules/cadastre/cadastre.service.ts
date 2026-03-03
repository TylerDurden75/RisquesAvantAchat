/**
 * Service parcelle cadastrale — API Carto Cadastre IGN.
 * @see https://apicarto.ign.fr/api/doc/cadastre.yml
 * @see https://www.data.gouv.fr/dataservices/api-carto-module-cadastre
 */

import type { ParcelleInfo } from '@risquesavantachat/shared-types';
import { fetchWithTimeout } from '../../adapters/http.js';
import { logger } from '../../utils/logger.js';

const CADASTRE_BASE = 'https://apicarto.ign.fr/api/cadastre';
const TIMEOUT_MS = 8000;

/**
 * Récupère la parcelle cadastrale contenant le point (lng, lat).
 * Retourne la première parcelle de la FeatureCollection ou null.
 */
export async function getParcelleByPoint(lng: number, lat: number): Promise<ParcelleInfo | null> {
  const geom = JSON.stringify({ type: 'Point' as const, coordinates: [lng, lat] });
  const url = `${CADASTRE_BASE}/parcelle?geom=${encodeURIComponent(geom)}&_limit=1`;
  try {
    const res = await fetchWithTimeout(url, {
      headers: { Accept: 'application/json' },
      timeoutMs: TIMEOUT_MS,
    });
    if (!res.ok) {
      logger.warn('Cadastre parcelle API error', { status: res.status, lng, lat });
      return null;
    }
    const data = (await res.json()) as {
      features?: Array<{
        properties?: {
          code_insee?: string;
          code_arr?: string;
          section?: string;
          numero?: string;
        };
      }>;
    };
    const feature = data?.features?.[0];
    const props = feature?.properties;
    if (!props) return null;
    const code_insee = props.code_insee ?? '';
    const section = (props.section ?? '').toString().trim();
    const numero = (props.numero ?? '').toString().trim();
    if (!code_insee) return null;
    logger.info('Cadastre parcelle trouvée', { code_insee, section, numero, lng, lat });
    return { code_insee, section, numero };
  } catch (err) {
    logger.warn('Cadastre parcelle fetch failed', { lng, lat, message: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
