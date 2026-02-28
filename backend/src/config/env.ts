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
    const raw = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? null;
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
} as const;
