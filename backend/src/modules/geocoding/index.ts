/**
 * Module Géocodage — Recherche d'adresses via API BAN.
 *
 * @module modules/geocoding
 */

export { geocodingService } from './geocoding.service.js';
export type { GeocodingService } from './geocoding.service.js';
export type { GeocodingSearchResult } from './geocoding.types.js';
export type { AddressFeature } from './geocoding.types.js';
export { default as geocodingRouter } from './geocoding.router.js';
