/**
 * Composable d'orchestration — agrège risques, zones, DVF et filtres.
 * Simplifie HomePage en centralisant la logique métier.
 *
 * @module app/composables
 */

import { inject, computed, ref, watch } from 'vue';
import { useRisks, useRiskZones, extractRiskTypes, ARGILES_RISK_TYPE } from '@features/risks';
import { useDvf } from '@features/dvf';
import { GEO_CONTEXT_KEY } from '../geoContext.js';

export function useReportData() {
  const geo = inject(GEO_CONTEXT_KEY)!;
  const selectedAddress = geo.selectedAddress;
  const mapCenter = geo.mapCenter;
  const copyShareLink = geo.copyShareLink;

  const { risks, loading, error, retry } = useRisks(selectedAddress);
  const codeInsee = computed(() => {
    const addr = selectedAddress.value?.properties;
    if (!addr) return undefined;
    const citycode = (addr.citycode as string)?.trim();
    if (citycode) return citycode;
    const id = typeof addr.id === 'string' && /^\d{5}$/.test(addr.id) ? addr.id : undefined;
    return id ?? undefined;
  });
  const { zones } = useRiskZones(codeInsee);
  const mapCenterRef = computed(() => mapCenter.value);
  const { indicators: dvfIndicators } = useDvf(codeInsee, mapCenterRef);

  const availableRiskTypes = computed(() => {
    const fromZones = extractRiskTypes(zones.value);
    const list = [...fromZones];
    if (selectedAddress.value) list.push(ARGILES_RISK_TYPE);
    return [...new Set(list)].sort();
  });
  const selectedRiskTypes = ref<string[]>([]);

  watch(
    zones,
    (z) => {
      const fromZones = extractRiskTypes(z);
      selectedRiskTypes.value = [...new Set([...fromZones, ARGILES_RISK_TYPE])].sort();
    },
    { immediate: true, flush: 'sync' },
  );

  function toggleRiskType(type: string) {
    const idx = selectedRiskTypes.value.indexOf(type);
    if (idx >= 0) {
      selectedRiskTypes.value = selectedRiskTypes.value.filter((t) => t !== type);
    } else {
      selectedRiskTypes.value = [...selectedRiskTypes.value, type].sort();
    }
  }

  return {
    selectedAddress,
    mapCenter,
    copyShareLink,
    risks,
    loading,
    error,
    retry,
    zones,
    dvfIndicators,
    availableRiskTypes,
    selectedRiskTypes,
    toggleRiskType,
    codeInsee,
  };
}
