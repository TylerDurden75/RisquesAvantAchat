/**
 * Tests unitaires pour extractRiskTypes.
 */

import { describe, it, expect } from 'vitest';
import { extractRiskTypes } from './extractRiskTypes.js';

describe('extractRiskTypes', () => {
  it('retourne un tableau vide si zones null', () => {
    expect(extractRiskTypes(null)).toEqual([]);
  });

  it('retourne un tableau vide si features vide', () => {
    expect(
      extractRiskTypes({ type: 'FeatureCollection', features: [] })
    ).toEqual([]);
  });

  it('extrait et trie les types uniques', () => {
    const zones = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: { riskType: 'Inondation', id: '1', name: 'A', approvalYear: 2020 },
          geometry: { type: 'Polygon' as const, coordinates: [] },
        },
        {
          type: 'Feature' as const,
          properties: { riskType: 'Mouvement de terrain', id: '2', name: 'B', approvalYear: 2019 },
          geometry: { type: 'Polygon' as const, coordinates: [] },
        },
        {
          type: 'Feature' as const,
          properties: { riskType: 'Inondation', id: '3', name: 'C', approvalYear: 2021 },
          geometry: { type: 'Polygon' as const, coordinates: [] },
        },
      ],
    };
    expect(extractRiskTypes(zones)).toEqual(['Inondation', 'Mouvement de terrain']);
  });

  it('ignore les features sans riskType', () => {
    const zones = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: { id: '1', name: 'A', riskType: '' },
          geometry: { type: 'Polygon' as const, coordinates: [] },
        },
      ],
    };
    expect(extractRiskTypes(zones)).toEqual([]);
  });
});
