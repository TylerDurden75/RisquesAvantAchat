/**
 * Composable recherche d'adresses — API + état réactif.
 * Accepte une API injectable pour la testabilité (DI).
 *
 * @module features/address/composables
 */

import { ref, inject } from 'vue';
import type { AddressFeature } from '@risquesavantachat/shared-types';
import type { AddressApi } from '@core';
import { API_CONTEXT_KEY, defaultApiClients } from '@/app/apiContext.js';

export function useAddressSearch(initialQuery = '', addressApi?: AddressApi) {
  const api = addressApi ?? inject(API_CONTEXT_KEY, defaultApiClients).address;
  const query = ref(initialQuery);
  const results = ref<AddressFeature[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let debounceTimer: ReturnType<typeof setTimeout>;

  async function search() {
    if (!query.value.trim()) {
      results.value = [];
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      results.value = await api.searchAddresses(query.value, 10);
    } catch (e) {
      console.error('Erreur recherche adresse:', e);
      error.value = e instanceof Error ? e.message : 'Erreur inconnue';
      results.value = [];
    } finally {
      loading.value = false;
    }
  }

  function onInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(search, 300);
  }

  function clearResults() {
    results.value = [];
  }

  function retry() {
    error.value = null;
    if (query.value.trim()) search();
  }

  return { query, results, loading, error, search, onInput, clearResults, retry };
}
