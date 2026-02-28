/**
 * Extrait les types de risques uniques des zones PPR.
 *
 * @module features/risks/utils
 */

import type { RiskZonesGeoJSON } from '@risquesavantachat/shared-types';

export function extractRiskTypes(zones: RiskZonesGeoJSON | null): string[] {
  if (!zones?.features?.length) return [];
  return [...new Set(
    zones.features
      .map((f) => (f.properties.riskType && String(f.properties.riskType).trim()) || '')
      .filter(Boolean)
  )].sort();
}
