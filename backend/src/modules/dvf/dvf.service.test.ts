/**
 * Tests unitaires du service DVF.
 *
 * @module modules/dvf/dvf.service.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dvfService } from './dvf.service.js';

describe('dvfService', () => {
  const mockFetch = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('getIndicatorsByCommune', () => {
    it('retourne null si pas de données pour la commune', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await dvfService.getIndicatorsByCommune('99999');

      expect(result).toBeNull();
    });

    it('retourne les indicateurs quand l\'API Tabulaire répond', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              Prixm2Moyen: 4500,
              PrixMoyen: 280000,
              nb_mutations: 42,
              NbMaisons: 15,
              NbApparts: 27,
              PropMaison: 36,
              PropAppart: 64,
              SurfaceMoy: 62,
              annee: '2023',
            },
          ],
        }),
      });

      const result = await dvfService.getIndicatorsByCommune('75101');

      expect(result).not.toBeNull();
      expect(result?.codeInsee).toBe('75101');
      expect(result?.prixM2Moyen).toBe(4500);
      expect(result?.nbMutations).toBe(42);
      expect(result?.annee).toBe('2023');
    });

    it('utilise le cache lors d\'appels répétés', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              Prixm2Moyen: 5000,
              nb_mutations: 10,
              annee: '2024',
            },
          ],
        }),
      });

      const r1 = await dvfService.getIndicatorsByCommune('75102');
      const r2 = await dvfService.getIndicatorsByCommune('75102');

      expect(r1?.prixM2Moyen).toBe(5000);
      expect(r2?.prixM2Moyen).toBe(5000);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getIndicators', () => {
    it('privilégie cquest (quartier) avec le premier rayon ayant assez de ventes (≥5)', async () => {
      // 250 m : 6 ventes → on retient ce rayon
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          features: [1, 2, 3, 4, 5, 6].map((i) => ({
            properties: {
              valeur_fonciere: 200000 + i * 10000,
              surface_reelle_bati: 50 + i,
              type_local: 'Appartement',
            },
          })),
        }),
      });

      const result = await dvfService.getIndicators('75101', 48.85, 2.35);

      expect(result).not.toBeNull();
      expect(result?.granularite).toBe('quartier');
      expect(result?.rayonMeters).toBe(250);
      expect(result?.nbMutations).toBe(6);
      expect(result?.prixM2Moyen).toBeGreaterThan(0);
    });

    it('fallback sur commune si cquest retourne trop peu sur tous les rayons (250, 500, 1000)', async () => {
      // 250 m, 500 m, 1000 m : chacun < 5 ventes (on renvoie 3 pour avoir un aggregate mais sous le seuil)
      const fewFeatures = [
        { properties: { valeur_fonciere: 200000, surface_reelle_bati: 50, type_local: 'Appartement' } },
        { properties: { valeur_fonciere: 250000, surface_reelle_bati: 55, type_local: 'Appartement' } },
        { properties: { valeur_fonciere: 300000, surface_reelle_bati: 60, type_local: 'Appartement' } },
      ];
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ features: fewFeatures }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ features: fewFeatures }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ features: fewFeatures }) })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              {
                Prixm2Moyen: 4200,
                nb_mutations: 25,
                annee: '2023',
              },
            ],
          }),
        });

      const result = await dvfService.getIndicators('75103', 48.80, 2.30);

      expect(result).not.toBeNull();
      expect(result?.granularite).toBe('commune');
      expect(result?.prixM2Moyen).toBe(4200);
    });
  });
});
