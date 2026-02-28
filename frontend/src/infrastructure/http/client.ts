/**
 * Client HTTP — base URL et construction d'URLs API.
 *
 * En développement, le proxy Vite redirige /api vers le backend.
 * En production, VITE_API_URL peut être défini pour un domaine externe.
 *
 * @module infrastructure/http/client
 */

/** Préfixe des routes API versionnées (changer pour v2 lors d'un breaking change). */
export const API_PREFIX = '/api/v1';

export function getApiBase(): string {
  return import.meta.env.VITE_API_URL ?? '';
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
