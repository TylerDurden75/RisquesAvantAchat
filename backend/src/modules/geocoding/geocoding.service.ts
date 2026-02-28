/**
 * Service de géocodage via l'API BAN (Base Adresse Nationale).
 *
 * @module modules/geocoding/geocoding.service
 * @see https://api-adresse.data.gouv.fr/
 */

import type { AddressFeature } from './geocoding.types.js';
import { banAdapter } from '../../adapters/ban.adapter.js';

export interface GeocodingService {
  searchAddresses(query: string, limit?: number): Promise<AddressFeature[]>;
}

async function searchAddresses(
  query: string,
  limit = 10
): Promise<AddressFeature[]> {
  const features = await banAdapter.search(query, limit);
  return features as AddressFeature[];
}

/** Instance du service de géocodage */
export const geocodingService: GeocodingService = {
  searchAddresses,
};
