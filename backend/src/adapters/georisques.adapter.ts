/**
 * Adapter Georisques — API risques naturels (v2 avec token Bearer).
 * Doc officielle v2 : https://www.georisques.gouv.fr/doc-api?urls.primaryName=Api%20de%20G%C3%A9orisques%20V2
 *
 * @module adapters/georisques
 * @see https://www.georisques.gouv.fr/doc-api
 */

import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { fetchWithTimeout } from './http.js';

const BASE_V2 = 'https://www.georisques.gouv.fr/api/v2';
const BASE_V1 = 'https://www.georisques.gouv.fr/api/v1';

/** Retries sur erreur 5xx ou réseau (backoff 500ms, 1s). */
const RETRIES = 2;
const RETRY_DELAYS_MS = [500, 1000];

/** Base URL pour les appels API JSON (v2). Token requis. */
export const GEORISQUES_BASE = BASE_V2;

/** Base URL pour le rapport PDF (v1, pas d’équivalent v2 documenté). */
export const GEORISQUES_BASE_PDF = BASE_V1;

let tokenLogged = false;

function getHeaders(accept: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: accept };
  if (config.georisquesApiToken) {
    headers['Authorization'] = `Bearer ${config.georisquesApiToken}`;
  }
  if (!tokenLogged) {
    logger.info('Georisques API: token Bearer', { hasToken: Boolean(config.georisquesApiToken) });
    tokenLogged = true;
  }
  return headers;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export type GeorisquesContext = { codeInsee?: string };

export const georisquesAdapter = {
  /** GET JSON sur l’API v2 (token Bearer requis). */
  async get<T>(path: string, timeoutMs = 8000, context: GeorisquesContext = {}): Promise<T> {
    const url = path.startsWith('http') ? path : `${BASE_V2}${path}`;
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      try {
        const res = await fetchWithTimeout(url, {
          headers: getHeaders('application/json'),
          timeoutMs,
        });
        const status = res?.status ?? 0;
        logger.info('Georisques GET', { path, status, attempt: attempt + 1, ...context });
        if (!res.ok) {
          if (status >= 500 && attempt < RETRIES) {
            const delay = RETRY_DELAYS_MS[attempt] ?? 1000;
            logger.warn('Georisques retry après 5xx', { path, status, delayMs: delay, ...context });
            await sleep(delay);
            continue;
          }
          throw new Error(`Georisques ${path}: ${status}`);
        }
        return (await res.json()) as T;
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
        const is4xx = /: 4\d\d$/.test(lastErr.message);
        if (attempt < RETRIES && !is4xx) {
          const delay = RETRY_DELAYS_MS[attempt] ?? 1000;
          logger.warn('Georisques retry après erreur', { path, message: lastErr.message, delayMs: delay, ...context });
          await sleep(delay);
        } else {
          logger.error('Georisques GET échec après retries', lastErr, { path, attempts: RETRIES + 1, ...context });
          throw lastErr;
        }
      }
    }
    throw lastErr ?? new Error(`Georisques ${path}: échec`);
  },
  /** GET JSON sur l'API v1 (sans token, pour fallback PPR). */
  async getV1<T>(path: string, timeoutMs = 8000, context: GeorisquesContext = {}): Promise<T> {
    const url = path.startsWith('http') ? path : `${BASE_V1}${path}`;
    const res = await fetchWithTimeout(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'RisquesAvantAchat/1.0' },
      timeoutMs,
    });
    logger.info('Georisques GET v1', { path, status: res?.status ?? 0, ...context });
    if (!res.ok) throw new Error(`Georisques v1 ${path}: ${res.status}`);
    return (await res.json()) as T;
  },
  /** GET PDF (rapport communal, v1). */
  async getPdf(path: string, timeoutMs = 10000): Promise<Buffer> {
    const url = path.startsWith('http') ? path : `${BASE_V1}${path}`;
    const res = await fetchWithTimeout(url, {
      headers: getHeaders('application/pdf'),
      timeoutMs,
    });
    if (!res.ok) throw new Error(`Georisques PDF ${path}: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  },
};
