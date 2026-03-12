/**
 * Configuration de l'application chargée depuis les variables d'environnement.
 *
 * @module config/env
 */

/**
 * Configuration globale de l'API.
 *
 * @property {number} config.port - Port du serveur HTTP
 * @property {string} config.databaseUrl - URL de connexion PostgreSQL
 * @property {string} config.nodeEnv - Environnement (development|production)
 */
export const config = {
  /** @type {number} Port du serveur (défaut: 3000) */
  port: parseInt(process.env.PORT ?? '3000', 10),
  /** @type {string} URL PostgreSQL (ex: postgresql://user:pass@host:5432/db) */
  databaseUrl:
    process.env.DATABASE_URL ??
    (process.env.NODE_ENV === 'production'
      ? (() => {
          throw new Error('DATABASE_URL must be set in production');
        })()
      : 'postgresql://postgres:postgres@localhost:5432/risquesavantachat'),
  /** @type {string} NODE_ENV */
  nodeEnv: process.env.NODE_ENV ?? 'development',
  /** @type {string[]} Domaines autorisés pour CORS (en production, ALLOWED_ORIGINS doit être défini) */
  allowedOrigins: (() => {
    const raw = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean) ?? null;
    if (process.env.NODE_ENV === 'production') {
      if (!raw?.length) {
        throw new Error('ALLOWED_ORIGINS must be set in production (e.g. https://votredomaine.fr)');
      }
      return raw;
    }
    return raw ?? ['http://localhost:5173'];
  })(),
  /** @type {string | undefined} Token Bearer pour l'API Georisques v2 (optionnel ; si absent, seule la v1 est utilisée) */
  georisquesApiToken: process.env.GEORISQUES_API_TOKEN?.trim() || undefined,
  /** @type {string} URL de l'API DVF Cquest (ex: https://api.cquest.org/dvf ou http://localhost:8888/dvf pour une instance auto-hébergée) */
  cquestDvfApiUrl: (process.env.CQUEST_DVF_API_URL?.trim() || 'https://api.cquest.org/dvf').replace(/\/?$/, ''),
} as const;
