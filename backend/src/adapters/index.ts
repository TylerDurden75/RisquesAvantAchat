/**
 * Adapters — clients des APIs externes.
 *
 * Centralise les appels HTTP pour tests et évolution.
 *
 * @module adapters
 */

export { georisquesAdapter } from './georisques.adapter.js';
export { banAdapter } from './ban.adapter.js';
export type { BanFeature, BanSearchResponse } from './ban.adapter.js';
export { fetchJson, fetchWithTimeout } from './http.js';
