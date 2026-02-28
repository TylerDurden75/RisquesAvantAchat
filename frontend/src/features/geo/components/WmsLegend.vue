<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiUrl, API_PREFIX } from '@infra/http/client.js';

/** Couches WMS BRGM affichées sur la carte (proxy backend). */
const LAYERS = [
  {
    id: 'ALEARG_REALISE',
    label: 'RGA réalisé',
    hint: 'Vert = faible, orange = moyen, rouge = fort (aléa retrait-gonflement des argiles, BRGM).',
  },
  {
    id: 'MVT_LOCALISE',
    label: 'Mouvements de terrain',
    hint: 'Zones de mouvements de terrain localisés (glissements, effondrements, BRGM).',
  },
] as const;

const legendUrls = ref<Record<string, string>>({});
onMounted(() => {
  LAYERS.forEach(({ id }) => {
    legendUrls.value[id] = apiUrl(`${API_PREFIX}/geo/wms/legend?layer=${encodeURIComponent(id)}`);
  });
});
</script>

<template>
  <details class="wms-legend">
    <summary class="wms-legend-title">Légende des calques carte (BRGM)</summary>
    <p class="wms-legend-intro">
      Les <strong>couleurs</strong> et <strong>formes</strong> (étoiles, triangles, carrés, losanges) sur la carte
      sont définies par le BRGM. Leur signification exacte est dans l’image de légende ci‑dessous pour chaque calque.
    </p>
    <div class="wms-legend-list">
      <div v-for="layer in LAYERS" :key="layer.id" class="wms-legend-item">
        <img
          v-if="legendUrls[layer.id]"
          :src="legendUrls[layer.id]"
          :alt="`Légende officielle BRGM : ${layer.label}. Définit les symboles et couleurs.`"
          class="wms-legend-img"
          loading="lazy"
          @error="($event.target as HTMLImageElement)?.style.setProperty('display', 'none')"
        />
        <p class="wms-legend-hint">{{ layer.hint }}</p>
      </div>
    </div>
    <p class="wms-legend-source">
      Source : <a href="https://geoservices.brgm.fr/risques" target="_blank" rel="noopener noreferrer">geoservices.brgm.fr</a>
    </p>
  </details>
</template>

<style scoped>
.wms-legend {
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-text-muted, #52525b);
}
.wms-legend-title {
  font-weight: 600;
  cursor: pointer;
  list-style: none;
}
.wms-legend-title::-webkit-details-marker {
  display: none;
}
.wms-legend-title::before {
  content: '▸ ';
  display: inline-block;
  transition: transform 0.2s;
}
.wms-legend[open] .wms-legend-title::before {
  transform: rotate(90deg);
}
.wms-legend-intro {
  margin: 0.5rem 0 0.75rem;
  line-height: 1.4;
}
.wms-legend-list {
  margin-top: 0.5rem;
  padding-left: 0.25rem;
}
.wms-legend-source {
  margin: 0.5rem 0 0;
  font-size: 0.7rem;
  opacity: 0.85;
}
.wms-legend-source a {
  color: var(--color-primary, #0d9488);
}
.wms-legend-item {
  margin-bottom: 0.5rem;
}
.wms-legend-item:last-child {
  margin-bottom: 0;
}
.wms-legend-img {
  max-width: 100%;
  height: auto;
  max-height: 80px;
  display: block;
  margin-bottom: 0.25rem;
}
.wms-legend-hint {
  margin: 0;
  line-height: 1.35;
}
</style>
