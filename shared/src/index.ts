/**
 * Types partagés entre le backend et le frontend.
 *
 * @packageDocumentation
 */

// --- Risques ---
export interface RiskCategory {
  id: string;
  name: string;
  level: number;
  description?: string;
  recommendation?: string;
}

export interface ScoreInterpretation {
  label: string;
  level: 'low' | 'moderate' | 'high' | 'critical';
}

export interface RiskDocument {
  id: string;
  name: string;
  riskType: string;
  approvalDate?: string;
  status?: string;
  reportUrl?: string;
}

/** Info parcelle cadastrale (API Carto Cadastre IGN). */
export interface ParcelleInfo {
  code_insee: string;
  section: string;
  numero: string;
}

export interface RiskScoreResult {
  globalScore: number;
  scoreInterpretation?: ScoreInterpretation;
  categories: RiskCategory[];
  documents: RiskDocument[];
  /** Parcelle cadastrale contenant le point (si disponible). */
  parcelle?: ParcelleInfo | null;
  /** Rayon de la zone d'analyse en mètres (pour affichage du cercle sur la carte). */
  radiusMeters?: number;
}

export interface RiskZonesGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: { id: string; name: string; riskType: string; approvalYear?: number };
    geometry: { type: string; coordinates: unknown };
  }>;
}

// --- DVF ---
export interface DvfIndicators {
  codeInsee: string;
  granularite?: 'quartier' | 'commune';
  /** Rayon en mètres utilisé pour le prix local (quartier). Ex. 250, 500, 1000. */
  rayonMeters?: number;
  prixM2Moyen?: number;
  prixMoyen?: number;
  nbMutations?: number;
  nbMaisons?: number;
  nbApparts?: number;
  propMaison?: number;
  propAppart?: number;
  surfaceMoy?: number;
  annee?: string;
}

// --- Géocodage ---
export type Coordinates = [number, number]; // [lng, lat]

export interface AddressFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    label: string;
    score: number;
    id?: string;
    postcode?: string;
    city?: string;
    citycode?: string;
    [key: string]: unknown;
  };
}
