/**
 * Composable risques — charge les scores via l'API.
 * Cache en sessionStorage (TTL 24h).
 * Accepte une API injectable pour la testabilité (DI).
 *
 * @module features/risks/composables
 */

import { ref, watch, inject, type Ref } from 'vue';
import type { AddressFeature, RiskScoreResult } from '@risquesavantachat/shared-types';
import type { RisksApi } from '@core';
import { API_CONTEXT_KEY, defaultApiClients } from '@/app/apiContext.js';

/** Préfixe du cache sessionStorage (changer pour v2 pour invalider l'ancien cache). */
const STORAGE_KEY = 'risk-scores-cache-v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedRisks {
  data: RiskScoreResult;
  ts: number;
}

function loadFromCache(codeInsee: string, radiusMeters: number): RiskScoreResult | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_KEY}-${codeInsee}-${radiusMeters}`);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedRisks;
    if (!cached?.data || Date.now() - cached.ts > CACHE_TTL_MS) return null;
    if (cached.data.categories.length === 0 && cached.data.documents.length === 0) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function clearExpiredRisksCache(): void {
  try {
    const now = Date.now();
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (!key?.startsWith(STORAGE_KEY + '-') || key === STORAGE_KEY) continue;
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;
      try {
        const cached = JSON.parse(raw) as { ts?: number };
        if (cached?.ts && now - cached.ts > CACHE_TTL_MS) sessionStorage.removeItem(key);
      } catch {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Ignorer
  }
}

function saveToCache(codeInsee: string, radiusMeters: number, data: RiskScoreResult): void {
  if (data.categories.length === 0 && data.documents.length === 0) return;
  try {
    sessionStorage.setItem(`${STORAGE_KEY}-${codeInsee}-${radiusMeters}`, JSON.stringify({ data, ts: Date.now() }));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      clearExpiredRisksCache();
      try {
        sessionStorage.setItem(`${STORAGE_KEY}-${codeInsee}-${radiusMeters}`, JSON.stringify({ data, ts: Date.now() }));
      } catch {
        // Abandon après tentative de libération
      }
    }
  }
}

const DEFAULT_RADIUS_M = 500;

async function fetchRisks(
  addr: AddressFeature,
  api: RisksApi,
  signal: AbortSignal,
  radiusMeters: number = DEFAULT_RADIUS_M
): Promise<{ data: RiskScoreResult | null; err: string | null }> {
  try {
    const codeInsee =
      (addr.properties.citycode as string) ||
      (typeof addr.properties.id === 'string' && /^\d{5}$/.test(addr.properties.id) ? addr.properties.id : undefined) ||
      undefined;
    const [lng, lat] = addr.geometry.coordinates;
    const data = await api.getRisksNearby(lat, lng, codeInsee, signal, radiusMeters);
    return { data, err: null };
  } catch (e) {
    return { data: null, err: e instanceof Error ? e.message : 'Erreur risques' };
  }
}

export function useRisks(
  selectedAddress: Ref<AddressFeature | null>,
  risksApi?: RisksApi,
  radiusMetersRef?: Ref<number>
) {
  const api = risksApi ?? inject(API_CONTEXT_KEY, defaultApiClients).risks;
  const risks = ref<RiskScoreResult | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let abortController: AbortController | null = null;

  async function loadForAddress(addr: AddressFeature) {
    abortController?.abort();
    abortController = new AbortController();
    const signal = abortController.signal;
    const codeInsee =
      (addr.properties.citycode as string) ||
      (typeof addr.properties.id === 'string' && /^\d{5}$/.test(addr.properties.id) ? addr.properties.id : undefined) ||
      undefined;
    const radius = radiusMetersRef?.value ?? DEFAULT_RADIUS_M;
    const cached = codeInsee ? loadFromCache(codeInsee, radius) : null;
    if (cached) risks.value = { ...cached, radiusMeters: radius };

    loading.value = true;
    error.value = null;
    const result = await fetchRisks(addr, api, signal, radius);
    if (signal.aborted) return;
    if (result.err) {
      error.value = result.err;
      risks.value = cached ?? null;
    } else if (result.data) {
      risks.value = result.data;
      if (codeInsee) saveToCache(codeInsee, radius, result.data);
    }
    loading.value = false;
  }

  function retry() {
    const addr = selectedAddress.value;
    if (addr?.geometry?.coordinates) loadForAddress(addr);
  }

  watch(
    selectedAddress,
    (addr) => {
      if (!addr?.geometry?.coordinates) {
        risks.value = null;
        error.value = null;
        return;
      }
      loadForAddress(addr);
    },
    { immediate: true }
  );

  if (radiusMetersRef) {
    watch(
      () => radiusMetersRef.value,
      (newVal, oldVal) => {
        if (oldVal !== undefined && newVal === oldVal) return;
        const addr = selectedAddress.value;
        if (!addr?.geometry?.coordinates) return;
        loadForAddress(addr);
      }
    );
  }

  return { risks, loading, error, retry };
}
