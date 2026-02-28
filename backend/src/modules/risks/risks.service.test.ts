/**
 * Tests unitaires du service risks.
 *
 * @module modules/risks/risks.service.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { risksService } from './risks.service.js';

describe('risksService', () => {
  const mockFetch = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('getRisksNearby', () => {
    it('retourne un score vide si pas de codeInsee', async () => {
      const result = await risksService.getRisksNearby([2.35, 48.85], 500);
      expect(result).toEqual({ globalScore: 0, categories: [], documents: [] });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('retourne les catégories agrégées avec les bonnes interprétations', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ classe_potentiel: '2' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ zone_sismicite: 'zone_2' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], results: 0 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], results: 0 }),
        });

      const result = await risksService.getRisksNearby(
        [2.35, 48.85],
        500,
        '75101'
      );

      expect(result.globalScore).toBeGreaterThanOrEqual(0);
      expect(result.globalScore).toBeLessThanOrEqual(100);
      expect(result.scoreInterpretation).toBeDefined();
      expect(result.categories.length).toBeGreaterThan(0);
      expect(result.scoreInterpretation?.level).toMatch(/low|moderate|high|critical/);
    });

    it('retourne scoreInterpretation "Risque faible" pour score < 15', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], results: 0 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], results: 0 }),
        });

      const result = await risksService.getRisksNearby(
        [2.35, 48.85],
        500,
        '99999'
      );

      // MVT, PPR, RGA, AZI sont toujours renvoyés (même sans risque) pour afficher ce qui a été vérifié
      expect(result.categories.length).toBeGreaterThanOrEqual(4);
      expect(result.globalScore).toBe(0);
      expect(result.scoreInterpretation?.label).toBe('Risque faible');
      expect(result.scoreInterpretation?.level).toBe('low');
    });
  });

  describe('getRiskZones', () => {
    it('retourne une FeatureCollection vide si pas de PPR', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      const result = await risksService.getRiskZones('75101');

      expect(result).toEqual({ type: 'FeatureCollection', features: [] });
    });

    it('retourne les features PPR avec géométries (détail par idGaspar)', async () => {
      // 3 appels liste (pprn, pprt, pprm) au format v2 (content), puis 1 appel détail
      const listPprn = {
        content: [
          {
            idGaspar: 'PPR001',
            libPpr: 'PPR Inondation',
            dateModification: '2020-01-15',
            libBassinRisques: 'Inondation',
          },
        ],
      };
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => listPprn })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ content: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ content: [] }) })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id_gaspar: 'PPR001',
            nom_ppr: 'PPR Inondation',
            date_approbation: '2020-01-15',
            risque: { libelle_risque: 'Inondation' },
            geom_zonage: {
              features: [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Polygon',
                    coordinates: [
                      [
                        [2.35, 48.85],
                        [2.36, 48.85],
                        [2.36, 48.86],
                        [2.35, 48.86],
                        [2.35, 48.85],
                      ],
                    ],
                  },
                },
              ],
            },
          }),
        });

      const result = await risksService.getRiskZones('75001');

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(1);
      expect(result.features[0].properties.id).toBe('PPR001');
      expect(result.features[0].properties.name).toBe('PPR Inondation');
      expect(result.features[0].properties.riskType).toBe('Inondation');
      expect(result.features[0].properties.approvalYear).toBe(2020);
    });
  });
});
