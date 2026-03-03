<script setup lang="ts">
import { ref, inject, computed } from "vue";
import type { AddressFeature, DvfIndicators, RiskCategory, RiskScoreResult } from '@risquesavantachat/shared-types';
import ScoreBlock from "./ScoreBlock.vue";
import DocumentsList from "./DocumentsList.vue";
import RisksCardSkeleton from "@shared/components/RisksCardSkeleton.vue";
import RiskFilters from "./RiskFilters.vue";
import RiskList from "./RiskList.vue";
import WmsLegend from "@features/geo/components/WmsLegend.vue";
import DvfSection from "./DvfSection.vue";
import ExportSection from "./ExportSection.vue";
import { API_CONTEXT_KEY, defaultApiClients } from "@/app/apiContext.js";

const props = defineProps<{
  selectedAddress: AddressFeature;
  risks: RiskScoreResult | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  dvfIndicators?: DvfIndicators | null;
  availableRiskTypes: string[];
  selectedRiskTypes: string[];
  onToggleRiskType: (type: string) => void;
  copyShareLink?: () => Promise<boolean>;
  radiusMeters?: number;
  radiusPresets?: readonly number[];
}>();

const emit = defineEmits<{ (e: 'update:radiusMeters', value: number): void }>();

function formatRadius(m: number): string {
  if (m >= 1000) return `${m / 1000} km`;
  return `${m} m`;
}

const displayCategories = computed((): RiskCategory[] => {
  return props.risks?.categories ?? [];
});

const hasNoRiskFromApi = computed(
  () => props.risks && props.risks.categories.length === 0 && props.risks.globalScore === 0
);
const showNoRiskBlock = computed(
  () =>
    !props.loading &&
    !props.error &&
    hasNoRiskFromApi.value
);
const showRisksBlock = computed(
  () => props.risks && (displayCategories.value.length > 0 || (props.risks.globalScore ?? 0) > 0)
);

const reportApi = inject(API_CONTEXT_KEY, defaultApiClients).report;
const pdfLoading = ref(false);
const pdfError = ref<string | null>(null);
const shareCopied = ref(false);

async function handleDownloadPdf() {
  pdfError.value = null;
  pdfLoading.value = true;
  try {
    await reportApi.downloadReportPdf(props.selectedAddress);
  } catch (e) {
    pdfError.value = e instanceof Error ? e.message : "Erreur téléchargement PDF";
  } finally {
    pdfLoading.value = false;
  }
}

async function handleCopyShareLink() {
  if (!props.copyShareLink) return;
  const ok = await props.copyShareLink();
  shareCopied.value = ok;
  if (ok) setTimeout(() => { shareCopied.value = false; }, 2000);
}
</script>

<template>
  <section class="info-card" aria-labelledby="risks-card-title" aria-label="Détail de l'analyse des risques">
    <div class="info-card-header">
      <h2 id="risks-card-title">Adresse</h2>
      <span class="info-badge">Analyse</span>
    </div>
    <div class="info-card-body">
      <p class="address-label">{{ selectedAddress.properties.label }}</p>
      <div class="coords-row">
        <span class="coords">{{ selectedAddress.geometry.coordinates[1].toFixed(5) }}° N</span>
        <span class="coords">{{ selectedAddress.geometry.coordinates[0].toFixed(5) }}° E</span>
      </div>
      <p v-if="risks?.parcelle" class="parcelle-label">
        Parcelle cadastrale : section {{ risks.parcelle.section || '–' }}, n° {{ risks.parcelle.numero || '–' }}
      </p>
      <div v-if="radiusPresets?.length" class="radius-row">
        <span class="radius-label">Zone :</span>
        <div class="radius-buttons">
          <button
            v-for="r in radiusPresets"
            :key="r"
            type="button"
            class="radius-btn"
            :class="{ active: (radiusMeters ?? 500) === r }"
            :aria-pressed="(radiusMeters ?? 500) === r"
            @click="emit('update:radiusMeters', Number(r))"
          >
            {{ formatRadius(r) }}
          </button>
        </div>
        <p class="radius-hint">Le score et les risques sont à l’échelle de la commune. Le cercle sur la carte indique la zone affichée.</p>
      </div>
      <DvfSection v-if="dvfIndicators?.prixM2Moyen" :dvf-indicators="dvfIndicators" />
      <div class="risks-section">
        <template v-if="loading">
          <RisksCardSkeleton />
        </template>
        <template v-else-if="error">
          <p class="risks-error">{{ error }}</p>
          <button v-if="onRetry" type="button" class="btn-retry" @click="onRetry">
            Réessayer
          </button>
        </template>
        <template v-else-if="showNoRiskBlock">
          <div class="no-risk-icon">✓</div>
          <p class="no-risk-title">Aucun risque identifié</p>
          <p class="no-risk-hint">L'analyse n'a pas détecté de risques majeurs pour cette commune.</p>
          <p class="no-risk-note">Radon, sismicité, PPR, mouvements de terrain et zonage argiles (carte) ont été vérifiés.</p>
          <ExportSection
            :pdf-loading="pdfLoading"
            :pdf-error="pdfError"
            :share-copied="shareCopied"
            :copy-share-link="copyShareLink"
            @download-pdf="handleDownloadPdf"
            @copy-share="handleCopyShareLink"
          />
        </template>
        <template v-else-if="showRisksBlock">
          <ScoreBlock :score="risks!.globalScore" :score-interpretation="risks!.scoreInterpretation" />
          <RiskList
            :categories="displayCategories"
            :exclude-ppr="(risks!.documents?.length ?? 0) > 0"
          />
          <RiskFilters
            :available-types="availableRiskTypes"
            :selected-types="selectedRiskTypes"
            :on-toggle="onToggleRiskType"
          />
          <WmsLegend />
          <DocumentsList :documents="risks!.documents ?? []" />
          <ExportSection
            :pdf-loading="pdfLoading"
            :pdf-error="pdfError"
            :share-copied="shareCopied"
            :copy-share-link="copyShareLink"
            @download-pdf="handleDownloadPdf"
            @copy-share="handleCopyShareLink"
          />
        </template>
        <template v-else>
          <div class="coming-icon">📋</div>
          <p class="coming-title">Données non disponibles</p>
          <p class="coming-hint">L'analyse des risques n'a pas pu être effectuée pour cette adresse.</p>
          <p class="coming-status">Vérifiez que l'adresse comporte un code commune (ville).</p>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.info-card {
  width: 320px;
  max-width: calc(100vw - 3rem);
  max-height: calc(100vh - 8rem);
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-xl, 16px);
  box-shadow: var(--shadow-float, 0 4px 24px rgba(0, 0, 0, 0.12));
  border: 1px solid rgba(255, 255, 255, 0.8);
  overflow: hidden;
}
@media (min-width: 900px) {
  .info-card { width: 340px; max-height: calc(100vh - 110px); }
}
@media (max-width: 640px) {
  .info-card { width: calc(100vw - 2rem); max-height: calc(100vh - 10rem); }
}
.info-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f4f4f5;
  flex-shrink: 0;
}
.info-card-header h2 { font-size: 0.8125rem; font-weight: 700; color: var(--color-primary, #0d9488); text-transform: uppercase; letter-spacing: 0.08em; }
.info-badge { font-size: 0.6875rem; font-weight: 600; padding: 0.25rem 0.5rem; background: rgba(13, 148, 136, 0.12); color: var(--color-primary, #0d9488); border-radius: 6px; }
.info-card-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 0;
}
.address-label { font-size: 1rem; font-weight: 600; color: var(--color-text, #18181b); line-height: 1.4; margin-bottom: 0.5rem; }
.parcelle-label {
  font-size: 0.85rem;
  color: var(--muted, #666);
  margin: 0.25rem 0 0;
}
.radius-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0 0;
  flex-wrap: wrap;
}
.radius-label {
  font-size: 0.85rem;
  color: var(--muted, #666);
}
.radius-buttons {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}
.radius-btn {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  color: #374151;
  cursor: pointer;
}
.radius-btn:hover {
  background: #f3f4f6;
}
.radius-btn.active {
  background: #0d9488;
  color: #fff;
  border-color: #0d9488;
}
.radius-hint {
  font-size: 0.7rem;
  color: var(--color-text-muted, #71717a);
  margin: 0.35rem 0 0;
  line-height: 1.3;
  width: 100%;
}
.coords-row { display: flex; gap: 1rem; margin-bottom: 1.25rem; }
.coords { font-size: 0.75rem; color: var(--color-text-muted, #52525b); font-family: ui-monospace, monospace; }
.risks-section { padding-top: 1rem; border-top: 1px solid #f4f4f5; text-align: center; }
.coming-icon { font-size: 2rem; margin-bottom: 0.75rem; opacity: 0.7; }
.coming-title { font-size: 0.9375rem; font-weight: 600; color: var(--color-text, #18181b); margin-bottom: 0.25rem; }
.coming-hint { font-size: 0.75rem; color: var(--color-text-muted, #52525b); margin-bottom: 0.75rem; }
.coming-status { font-size: 0.6875rem; font-weight: 600; color: var(--color-primary, #0d9488); text-transform: uppercase; letter-spacing: 0.06em; }
.no-risk-icon { font-size: 2rem; font-weight: 700; color: #16a34a; margin-bottom: 0.5rem; line-height: 1; }
.no-risk-title { font-size: 0.9375rem; font-weight: 600; color: var(--color-text, #18181b); margin-bottom: 0.25rem; }
.no-risk-hint { font-size: 0.8125rem; color: var(--color-text-muted, #52525b); margin-bottom: 0.5rem; line-height: 1.4; }
.no-risk-note { font-size: 0.6875rem; color: var(--color-text-muted, #52525b); font-style: italic; }
.risks-loading, .risks-error { font-size: 0.8125rem; }
.risks-error { color: #b91c1c; margin-bottom: 0.75rem; }
.btn-retry {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #fff;
  background: var(--color-primary, #0d9488);
  border: none;
  border-radius: var(--radius-md, 12px);
  cursor: pointer;
}
.btn-retry:hover { background: var(--color-primary-hover, #0f766e); }
</style>
