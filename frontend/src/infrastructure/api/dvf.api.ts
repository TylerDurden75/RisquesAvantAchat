/**
 * API DVF — indicateurs prix immobiliers.
 *
 * @module infrastructure/api/dvf
 */

import type { DvfIndicators, ParcelleInfo } from '@risquesavantachat/shared-types';
import { apiUrl, API_PREFIX } from '../http/client.js';
import { fetchWithRetry } from '../http/fetchWithRetry.js';

export async function getDvfIndicators(
  codeInsee: string,
  opts?: {
    lat?: number;
    lon?: number;
    parcelle?: ParcelleInfo | null;
    signal?: AbortSignal;
  }
): Promise<DvfIndicators | null> {
  try {
    const params = new URLSearchParams({ code_insee: codeInsee });
    if (opts?.lat != null && opts?.lon != null) {
      params.set('lat', String(opts.lat));
      params.set('lon', String(opts.lon));
    }
    if (opts?.parcelle?.section != null && opts?.parcelle?.numero != null) {
      params.set('section', opts.parcelle.section);
      params.set('numero', opts.parcelle.numero);
    }
    const res = await fetchWithRetry(
      apiUrl(`${API_PREFIX}/dvf/indicators?${params}`),
      { signal: opts?.signal, retries: 1 }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as DvfIndicators & { message?: string };
    if (data.message) return null;
    return data.prixM2Moyen != null ? data : null;
  } catch {
    return null;
  }
}
