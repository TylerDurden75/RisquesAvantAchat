/**
 * Composable d'orchestration — agrège risques, zones, DVF et filtres.
 * Simplifie HomePage en centralisant la logique métier.
 *
 * @module app/composables
 */

import { inject, computed, ref, watch } from "vue";
import {
  useRisks,
  useRiskZones,
  extractRiskTypes,
  ARGILES_RISK_TYPE,
} from "@features/risks";
import { useDvf } from "@features/dvf";
import { GEO_CONTEXT_KEY } from "../geoContext.js";

/** Rayons de zone disponibles (mètres). */
export const RADIUS_PRESETS = [500, 1000, 2000, 5000] as const;

export function useReportData() {
  const geo = inject(GEO_CONTEXT_KEY)!;
  const selectedAddress = geo.selectedAddress;
  const mapCenter = geo.mapCenter;
  const copyShareLink = geo.copyShareLink;

  const radiusMeters = ref(500);
  const { risks, loading, error, retry } = useRisks(
    selectedAddress,
    undefined,
    radiusMeters,
  );
  const codeInsee = computed(() => {
    const addr = selectedAddress.value?.properties;
    if (!addr) return undefined;
    const citycode = (addr.citycode as string)?.trim();
    if (citycode) return citycode;
    const id =
      typeof addr.id === "string" && /^\d{5}$/.test(addr.id)
        ? addr.id
        : undefined;
    return id ?? undefined;
  });
  const { zones } = useRiskZones(codeInsee);
  /** Coordonnées pour DVF : mapCenter ou géométrie de l'adresse (pour avoir lat/lon dès la sélection). */
  const dvfCoordsRef = computed(() => {
    const center = mapCenter.value;
    if (center != null) return center;
    const addr = selectedAddress.value;
    const coords = addr?.geometry?.coordinates;
    if (coords?.length === 2) return [coords[0], coords[1]] as [number, number];
    return undefined;
  });
  const parcelleRef = computed(() => risks.value?.parcelle ?? null);
  const { indicators: dvfIndicators } = useDvf(
    codeInsee,
    dvfCoordsRef,
    parcelleRef,
  );

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
      selectedRiskTypes.value = [
        ...new Set([...fromZones, ARGILES_RISK_TYPE]),
      ].sort();
    },
    { immediate: true, flush: "sync" },
  );

  function toggleRiskType(type: string) {
    const idx = selectedRiskTypes.value.indexOf(type);
    if (idx >= 0) {
      selectedRiskTypes.value = selectedRiskTypes.value.filter(
        (t) => t !== type,
      );
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
    radiusMeters,
    RADIUS_PRESETS,
  };
}
