/**
 * Tests pour useAddressSearch — vérifie que l'injection d'API fonctionne (DI).
 */

import { describe, it, expect, vi } from 'vitest';
import { useAddressSearch } from './useAddressSearch.js';
import type { AddressApi } from '@core';

describe('useAddressSearch', () => {
  it('utilise l\'API mockée quand fournie', async () => {
    const mockResults = [
      {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [2.3, 48.8] as [number, number] },
        properties: { label: '10 rue de Rivoli, Paris', score: 1 },
      },
    ];
    const mockApi: AddressApi = {
      searchAddresses: vi.fn().mockResolvedValue(mockResults),
    };

    const { query, results, search } = useAddressSearch('', mockApi);
    query.value = '10 rue de Rivoli';

    await search();

    expect(mockApi.searchAddresses).toHaveBeenCalledWith('10 rue de Rivoli', 10);
    expect(results.value).toEqual(mockResults);
  });

  it('ne lance pas de requête si query vide', async () => {
    const mockApi: AddressApi = {
      searchAddresses: vi.fn(),
    };

    const { search } = useAddressSearch('', mockApi);
    await search();

    expect(mockApi.searchAddresses).not.toHaveBeenCalled();
  });
});
