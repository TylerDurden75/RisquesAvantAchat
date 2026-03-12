<script setup lang="ts">
import { computed } from 'vue';
import type { DvfIndicators } from '@risquesavantachat/shared-types';

const props = defineProps<{ dvfIndicators: DvfIndicators }>();

const granulariteLabel = computed(() => {
  const g = props.dvfIndicators.granularite;
  if (g === 'parcelle') return 'parcelle cadastrale';
  if (g === 'section') return 'section cadastrale';
  if (g === 'quartier' && props.dvfIndicators.rayonMeters) return `quartier (~${props.dvfIndicators.rayonMeters} m)`;
  if (g === 'quartier') return 'quartier';
  return 'commune';
});

const granulariteCaveat = computed(() => {
  const g = props.dvfIndicators.granularite;
  if (g === 'parcelle') return 'Prix à l\'échelle de la parcelle cadastrale.';
  if (g === 'section') return 'Prix à l\'échelle de la section cadastrale.';
  if (g === 'quartier' && props.dvfIndicators.rayonMeters) return `Prix localisés dans un rayon de ~${props.dvfIndicators.rayonMeters} m.`;
  if (g === 'quartier') return 'Prix localisés au quartier.';
  return "Prix à l'échelle de la commune (données quartier indisponibles ou service de prix local temporairement indisponible).";
});
</script>

<template>
  <div class="dvf-section">
    <p class="dvf-title">
      Prix immobilier (DVF {{ dvfIndicators.annee ?? "" }})
      <span v-if="dvfIndicators.granularite" class="dvf-granularite">
        — {{ granulariteLabel }}
      </span>
    </p>
    <p class="dvf-value">
      {{ dvfIndicators.prixM2Moyen!.toLocaleString("fr-FR") }} €/m²
      <span v-if="dvfIndicators.nbMutations" class="dvf-meta">
        ({{ dvfIndicators.nbMutations.toLocaleString("fr-FR") }} ventes)
      </span>
    </p>
    <p v-if="dvfIndicators.nbMutations != null && dvfIndicators.nbMutations < 10" class="dvf-low-sample">
      Échantillon faible — prix indicatif uniquement
    </p>
    <p v-else-if="(dvfIndicators.nbMaisons ?? 0) + (dvfIndicators.nbApparts ?? 0) > 0" class="dvf-detail">
      {{ dvfIndicators.nbMaisons ?? 0 }} maison{{ (dvfIndicators.nbMaisons ?? 0) > 1 ? "s" : "" }},
      {{ dvfIndicators.nbApparts ?? 0 }} appart.
      <template v-if="dvfIndicators.surfaceMoy != null"> · {{ Math.round(dvfIndicators.surfaceMoy) }} m² moy.</template>
    </p>
    <a href="https://www.meilleursagents.com/estimation-immobilier/" target="_blank" rel="noopener noreferrer" class="dvf-cta">
      Estimation personnalisée → MeilleursAgents
    </a>
    <details class="dvf-disclaimer">
      <summary>Limites des données DVF</summary>
      <p class="dvf-caveat">
        {{ granulariteCaveat }}
        Les prix peuvent être obsolètes (retard de plusieurs mois voire plus d'un an). Couverture incomplète : Moselle, Bas-Rhin, Haut-Rhin et Mayotte non couverts. Toutes les ventes ne sont pas enregistrées. Pour une estimation fiable, consultez un professionnel ou utilisez MeilleursAgents.
      </p>
    </details>
  </div>
</template>

<style scoped>
.dvf-section { padding: 0.75rem 0; border-bottom: 1px solid #f4f4f5; }
.dvf-title { font-size: 0.7rem; font-weight: 700; color: var(--color-text-muted, #52525b); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
.dvf-granularite { font-weight: 600; color: var(--color-primary, #0d9488); text-transform: none; }
.dvf-value { font-size: 1rem; font-weight: 600; color: var(--color-text, #18181b); }
.dvf-meta { font-size: 0.75rem; font-weight: 500; color: var(--color-text-muted, #52525b); }
.dvf-low-sample { font-size: 0.6875rem; font-weight: 600; color: #b45309; margin: 0.25rem 0 0; }
.dvf-detail { font-size: 0.6875rem; color: var(--color-text-muted, #52525b); margin: 0.25rem 0 0; }
.dvf-cta { display: inline-block; margin-top: 0.5rem; font-size: 0.75rem; font-weight: 600; color: var(--color-primary, #0d9488); text-decoration: none; }
.dvf-cta:hover { color: var(--color-primary-hover, #0f766e); text-decoration: underline; }
.dvf-disclaimer { margin-top: 0.5rem; font-size: 0.6875rem; }
.dvf-disclaimer summary { cursor: pointer; color: var(--color-primary, #0d9488); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.dvf-disclaimer summary:hover { text-decoration: underline; }
.dvf-caveat { margin: 0.35rem 0 0; padding: 0.5rem; background: rgba(0, 0, 0, 0.03); border-radius: 6px; color: var(--color-text-muted, #52525b); line-height: 1.45; }
</style>
