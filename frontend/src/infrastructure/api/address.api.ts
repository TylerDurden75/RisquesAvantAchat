/**
 * API Adresses — géocodage via BAN.
 *
 * @module infrastructure/api/address
 */

import type { AddressFeature } from '@risquesavantachat/shared-types';
import { apiUrl, API_PREFIX } from '../http/client.js';
import { fetchWithRetry } from '../http/fetchWithRetry.js';

const BAN_API_URL = 'https://api-adresse.data.gouv.fr/search';

async function searchViaBan(query: string, limit: number): Promise<AddressFeature[]> {
  const url = `${BAN_API_URL}?q=${encodeURIComponent(query.trim())}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'RisquesAvantAchat/1.0' },
  });
  if (!res.ok) throw new Error(`Erreur BAN: ${res.status}`);
  const data = (await res.json()) as { features?: AddressFeature[] };
  return data.features ?? [];
}

export async function searchAddresses(
  query: string,
  limit = 10
): Promise<AddressFeature[]> {
  const safeLimit = Math.min(limit, 20);
  const backendUrl = apiUrl(
    `${API_PREFIX}/addresses/search?q=${encodeURIComponent(query)}&limit=${safeLimit}`
  );

  try {
    const res = await fetchWithRetry(backendUrl, { retries: 2 });
    if (res.ok) {
      const data = await res.json();
      return data.features ?? [];
    }
    return searchViaBan(query, safeLimit);
  } catch {
    return searchViaBan(query, safeLimit);
  }
}
