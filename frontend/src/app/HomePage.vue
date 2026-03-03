<script setup lang="ts">
import EmptyState from "@shared/components/EmptyState.vue";
import { RisksCard } from "@features/risks";
import { MapView } from "@features/geo";
import { useReportData } from "./composables/useReportData.js";

const {
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
} = useReportData();

function setRadiusMeters(v: number) {
  radiusMeters.value = v;
}

</script>

<template>
  <main id="main-content" class="home-page" role="main" aria-label="Analyse des risques immobiliers">
    <div class="map-fullscreen">
      <Suspense>
        <MapView
          :key="codeInsee ?? 'no-address'"
          :center="mapCenter"
          :zoom="mapCenter ? 15 : 6"
          :show-marker="!!mapCenter"
          :risk-zones="zones"
          :risk-type-filters="selectedRiskTypes"
          :radius-meters="radiusMeters"
        />
        <template #fallback>
          <div class="map-loading" aria-hidden="true" />
        </template>
      </Suspense>
    </div>

    <EmptyState v-if="!selectedAddress" />

    <div class="bottom-bar">
      <Transition name="fade">
        <RisksCard
          v-if="selectedAddress"
          :selected-address="selectedAddress"
          :risks="risks"
          :loading="loading"
          :error="error"
          :on-retry="retry"
          :dvf-indicators="dvfIndicators"
          :available-risk-types="availableRiskTypes"
          :selected-risk-types="selectedRiskTypes"
          :on-toggle-risk-type="toggleRiskType"
          :copy-share-link="copyShareLink"
          :radius-meters="radiusMeters"
          :radius-presets="RADIUS_PRESETS"
          @update:radius-meters="setRadiusMeters"
        />
      </Transition>
      <footer class="floating-footer" role="contentinfo" aria-label="Sources des données">
        <span>Données publiques — Georisques, DVF, BAN</span>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.home-page { position: absolute; inset: 0; width: 100%; height: 100%; }
.map-fullscreen { position: absolute; inset: 0; }
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 1rem;
  padding: 1rem;
  pointer-events: none;
}
.bottom-bar > * { pointer-events: auto; }
.floating-footer {
  position: absolute;
  left: 50%;
  bottom: 1rem;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
  border-radius: 999px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}
.map-loading {
  position: absolute;
  inset: 0;
  background: var(--color-bg, #0a0a0b);
  display: flex;
  align-items: center;
  justify-content: center;
}
.map-loading::after {
  content: "";
  width: 40px;
  height: 40px;
  border: 2px solid rgba(255,255,255,0.1);
  border-top-color: rgba(13, 148, 136, 0.6);
  border-radius: 50%;
  animation: map-spin 1s linear infinite;
}
@keyframes map-spin {
  to { transform: rotate(360deg); }
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
