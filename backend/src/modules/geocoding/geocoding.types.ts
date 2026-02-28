/**
 * Types spécifiques au module géocodage.
 *
 * @module modules/geocoding/geocoding.types
 */

import type { AddressFeature } from '../../domain/types.js';

export type { AddressFeature };

/**
 * Résultat d'une recherche d'adresses.
 *
 * @interface GeocodingSearchResult
 * @property {AddressFeature[]} features - Liste des adresses trouvées
 */
export interface GeocodingSearchResult {
  features: AddressFeature[];
}
