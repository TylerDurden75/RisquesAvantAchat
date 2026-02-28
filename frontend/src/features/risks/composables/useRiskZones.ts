/**
 * Composable zones PPR — charge les géométries pour la carte.
 * Cache en sessionStorage (TTL 24h).
 * Accepte une API injectable pour la testabilité (DI).
 *
 * @module features/risks/composables
 */

import { ref, watch, inject, type Ref } from 'vue';
import type { RiskZonesGeoJSON } from '@risquesavantachat/shared-types';
import type { RisksApi } from '@core';
import { API_CONTEXT_KEY, defaultApiClients } from '@/app/apiContext.js';

/** Préfixe du cache sessionStorage (changer pour v2 pour invalider l'ancien cache). */
const STORAGE_KEY = 'risk-zones-cache-v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedZones {
  data: RiskZonesGeoJSON;
  ts: number;
}

let _cacheCleaned = false;

function cleanupStaleCache(): void {
  if (_cacheCleaned) return;
  _cacheCleaned = true;
  try {
    const now = Date.now();
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(STORAGE_KEY + '-') || key?.startsWith('risk-scores-cache-')) {
        const raw = sessionStorage.getItem(key);
        if (raw) {
          const cached = JSON.parse(raw) as { ts?: number };
          if (cached?.ts && now - cached.ts > CACHE_TTL_MS) sessionStorage.removeItem(key);
        }
      }
    }
  } catch {
    // Ignorer
  }
}

function normalizeRiskTypes(zones: RiskZonesGeoJSON): RiskZonesGeoJSON {
  if (!zones?.features?.length) return zones;
  return {
    ...zones,
    features: zones.features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        riskType: f.properties?.riskType ? String(f.properties.riskType).trim() : f.properties?.riskType,
      },
    })),
  };
}

function loadFromCache(codeInsee: string): RiskZonesGeoJSON | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_KEY}-${codeInsee}`);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedZones;
    if (!cached?.data?.features?.length || Date.now() - cached.ts > CACHE_TTL_MS) return null;
    return normalizeRiskTypes(cached.data);
  } catch {
    return null;
  }
}

function clearExpiredZonesCache(): void {
  try {
    const now = Date.now();
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (!key?.startsWith(STORAGE_KEY + '-')) continue;
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;
      try {
        const cached = JSON.parse(raw) as CachedZones;
        if (cached?.ts && now - cached.ts > CACHE_TTL_MS) sessionStorage.removeItem(key);
      } catch {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Ignorer
  }
}

function saveToCache(codeInsee: string, zones: RiskZonesGeoJSON): void {
  try {
    sessionStorage.setItem(`${STORAGE_KEY}-${codeInsee}`, JSON.stringify({ data: zones, ts: Date.now() }));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      clearExpiredZonesCache();
      try {
        sessionStorage.setItem(`${STORAGE_KEY}-${codeInsee}`, JSON.stringify({ data: zones, ts: Date.now() }));
      } catch {
        // Abandon après tentative de libération
      }
    }
  }
}

export function useRiskZones(codeInsee: Ref<string | undefined>, risksApi?: RisksApi) {
  const api = risksApi ?? inject(API_CONTEXT_KEY, defaultApiClients).risks;
  const zones = ref<RiskZonesGeoJSON | null>(null);
  const loading = ref(false);

  let abortController: AbortController | null = null;

  watch(
    codeInsee,
    async (code) => {
      cleanupStaleCache();
      abortController?.abort();
      if (!code) {
        zones.value = null;
        return;
      }
      const cached = loadFromCache(code);
      if (cached) zones.value = cached;

      abortController = new AbortController();
      const signal = abortController.signal;
      loading.value = true;
      try {
        const data = await api.getRiskZones(code, signal);
        if (!signal.aborted && codeInsee.value === code) {
          const normalized = normalizeRiskTypes(data);
          zones.value = normalized;
          saveToCache(code, normalized);
        }
      } catch (e) {
        if (import.meta.env.DEV && !signal.aborted) console.warn('[useRiskZones] Erreur:', e);
        if (!signal.aborted && codeInsee.value === code) zones.value = cached ?? null;
      } finally {
        if (!signal.aborted) loading.value = false;
      }
    },
    { immediate: true }
  );

  return { zones, loading };
}
