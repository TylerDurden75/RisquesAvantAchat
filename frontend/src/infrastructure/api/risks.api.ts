/**
 * API Risques — score et zones PPR.
 *
 * @module infrastructure/api/risks
 */

import type {
  RiskScoreResult,
  RiskZonesGeoJSON,
} from '@risquesavantachat/shared-types';
import { apiUrl, API_PREFIX } from '../http/client.js';
import { fetchWithRetry } from '../http/fetchWithRetry.js';

export async function getRisksNearby(
  lat: number,
  lng: number,
  codeInsee?: string,
  signal?: AbortSignal
): Promise<RiskScoreResult> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  if (codeInsee) params.set('code_insee', codeInsee);

  const res = await fetch(apiUrl(`${API_PREFIX}/risks/nearby?${params}`), { signal });
  if (!res.ok) throw new Error(`Erreur risques: ${res.status}`);
  return res.json();
}

export async function getRiskZones(
  codeInsee: string,
  signal?: AbortSignal
): Promise<RiskZonesGeoJSON> {
  const res = await fetchWithRetry(
    apiUrl(`${API_PREFIX}/risks/zones?code_insee=${encodeURIComponent(codeInsee)}`),
    { signal, retries: 2 }
  );
  if (!res.ok) throw new Error(`Erreur zones PPR: ${res.status}`);
  return res.json();
}
