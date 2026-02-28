/**
 * Constantes pour le module risques.
 *
 * @module modules/risks/risks.constants
 */

/** Rayon de recherche par défaut en mètres */
export const DEFAULT_RADIUS_METERS = 500;

/** Rayon de recherche maximum en mètres */
export const MAX_RADIUS_METERS = 5000;

/** Taille de page par défaut pour les requêtes PPR */
export const DEFAULT_PPR_PAGE_SIZE = 50;

/** Timeout par défaut pour les requêtes Georisques (ms) */
export const DEFAULT_GEORISQUES_TIMEOUT_MS = 8000;

/** Timeout pour les requêtes PPR (ms) */
export const PPR_TIMEOUT_MS = 5000;

/** Timeout pour les requêtes zones PPR (ms) */
export const ZONES_TIMEOUT_MS = 10000;

/** Nombre max de PPR pour lesquels on récupère le détail (géométries) par type, pour limiter les appels API */
export const MAX_PPR_DETAIL_PER_TYPE = 12;

/** Score maximum par catégorie de risque */
export const MAX_SCORE_PER_CATEGORY = 5;

/** Seuils d'interprétation du score */
export const SCORE_THRESHOLDS = {
  CRITICAL: 60,
  HIGH: 35,
  MODERATE: 15,
} as const;

/** Niveaux de risque pour sismicité */
export const MAX_SISMICITE_LEVEL = 5;
