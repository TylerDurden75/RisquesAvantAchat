/**
 * Utilitaire de cache LRU partagé pour éviter les fuites mémoire.
 *
 * @module utils/cache
 */

import { LRUCache } from 'lru-cache';

export interface CacheOptions {
  /** TTL en millisecondes (défaut: 24h) */
  ttl?: number;
  /** Nombre maximum d'entrées (défaut: 1000) */
  max?: number;
}

/**
 * Crée un cache LRU avec TTL et limite de taille.
 *
 * @example
 * const cache = createLruCache<RiskScoreResult>({ ttl: 3600000, max: 500 });
 * cache.set('key', data);
 * const data = cache.get('key');
 */
export function createLruCache<T extends NonNullable<unknown>>(options: CacheOptions = {}): LRUCache<string, T> {
  const { ttl = 24 * 60 * 60 * 1000, max = 1000 } = options;
  return new LRUCache<string, T>({
    max,
    ttl,
    updateAgeOnGet: false,
    updateAgeOnHas: false,
  });
}
