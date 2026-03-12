/**
 * Composable DVF — indicateurs prix immobiliers.
 * Privilégie parcelle → section → quartier (rayon) si coords et/ou parcelle fournis.
 *
 * @module features/dvf/composables
 */

import { ref, watch, inject, type Ref } from 'vue';
import type { DvfIndicators, ParcelleInfo } from '@risquesavantachat/shared-types';
import type { DvfApi } from '@core';
import { API_CONTEXT_KEY, defaultApiClients } from '@/app/apiContext.js';

export function useDvf(
  codeInsee: Ref<string | undefined>,
  mapCenter?: Ref<[number, number] | undefined>,
  parcelleRef?: Ref<ParcelleInfo | null | undefined>,
  dvfApi?: DvfApi
) {
  const api = dvfApi ?? inject(API_CONTEXT_KEY, defaultApiClients).dvf;
  const indicators = ref<DvfIndicators | null>(null);

  watch(
    [codeInsee, mapCenter ?? ref(undefined), parcelleRef ?? ref(undefined)],
    async ([code, center, parcelle]) => {
      if (!code) {
        indicators.value = null;
        return;
      }
      const [lon, lat] = center ?? [];
      try {
        indicators.value = await api.getDvfIndicators(code, {
          lat: typeof lat === 'number' ? lat : undefined,
          lon: typeof lon === 'number' ? lon : undefined,
          parcelle: parcelle ?? undefined,
        });
      } catch {
        indicators.value = null;
      }
    },
    { immediate: true }
  );

  return { indicators };
}
