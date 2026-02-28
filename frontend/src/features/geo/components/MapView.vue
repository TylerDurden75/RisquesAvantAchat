<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { RiskZonesGeoJSON } from '@risquesavantachat/shared-types';
import {
  MAP_STYLE,
  ZONES_SOURCE_ID,
  ZONES_FILL_LAYER_ID,
  ZONES_LINE_LAYER_ID,
  WMS_RGA_SOURCE_ID,
  WMS_RGA_LAYER_ID,
  WMS_MVT_SOURCE_ID,
  WMS_MVT_LAYER_ID,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  FRANCE_BOUNDS,
} from '../style/mapStyle.js';
import { apiUrl, API_PREFIX } from '@infra/http/client.js';
import { ARGILES_RISK_TYPE } from '@features/risks';

const props = withDefaults(
  defineProps<{
    center?: [number, number];
    zoom?: number;
    showMarker?: boolean;
    riskZones?: RiskZonesGeoJSON | null;
    riskTypeFilters?: string[];
  }>(),
  { showMarker: false, riskZones: null, riskTypeFilters: () => [] }
);

const mapContainer = ref<HTMLDivElement | null>(null);
let map: maplibregl.Map | null = null;
let marker: maplibregl.Marker | null = null;
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!mapContainer.value) return;

  map = new maplibregl.Map({
    container: mapContainer.value,
    style: MAP_STYLE,
    center: props.center ?? DEFAULT_CENTER,
    zoom: props.zoom ?? DEFAULT_ZOOM,
    minZoom: 5,
    maxZoom: 18,
    maxBounds: FRANCE_BOUNDS,
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

  map.on('load', () => {
    map!.resize();
    nextTick(() => map!.resize());
    setTimeout(() => map!.resize(), 100);
    addWmsLayers();
    syncZonesAndFilter();
    applyRgaLayerVisibility();
  });

  map.on('error', (e) => {
    console.error('[MapView] Erreur chargement carte:', e.error?.message ?? e);
  });

  resizeObserver = new ResizeObserver(() => map?.resize());
  resizeObserver.observe(mapContainer.value);

  updateMarker();
});

function updateMarker() {
  if (!map) return;
  if (marker) {
    marker.remove();
    marker = null;
  }
  if (props.showMarker && props.center) {
    const el = document.createElement('div');
    el.className = 'address-marker';
    
    // Créer les éléments avec createElement au lieu de innerHTML pour éviter XSS
    const pin = document.createElement('div');
    pin.className = 'marker-pin';
    const pulse = document.createElement('div');
    pulse.className = 'marker-pulse';
    
    el.appendChild(pin);
    el.appendChild(pulse);
    
    marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(props.center!)
      .addTo(map);
  }
}

function applyRiskZonesFilter() {
  if (!map?.getStyle()) return;
  const fillLayer = map.getLayer(ZONES_FILL_LAYER_ID);
  const lineLayer = map.getLayer(ZONES_LINE_LAYER_ID);
  if (!fillLayer || !lineLayer) return;

  const filters = props.riskTypeFilters ?? [];
  const hasFeatures = (props.riskZones?.features?.length ?? 0) > 0;

  if (!hasFeatures || filters.length === 0) {
    // Pas de données ou aucun type coché → masquer les zones PPR
    map.setLayoutProperty(ZONES_FILL_LAYER_ID, 'visibility', 'none');
    map.setLayoutProperty(ZONES_LINE_LAYER_ID, 'visibility', 'none');
  } else {
    map.setLayoutProperty(ZONES_FILL_LAYER_ID, 'visibility', 'visible');
    map.setLayoutProperty(ZONES_LINE_LAYER_ID, 'visibility', 'visible');
    const filter: maplibregl.FilterSpecification = ['in', ['get', 'riskType'], ['literal', filters]];
    map.setFilter(ZONES_FILL_LAYER_ID, filter);
    map.setFilter(ZONES_LINE_LAYER_ID, filter);
  }
}

watch(
  () => [props.center, props.showMarker],
  ([center]) => {
    if (map && center) {
      map.flyTo({
        center: center as [number, number],
        zoom: props.zoom ?? 15,
        duration: 1200,
        essential: true,
      });
    }
    updateMarker();
  }
);

const EMPTY_GEOJSON: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

/** Ajoute les calques WMS BRGM (RGA réalisé, MVT) via le proxy backend. */
function addWmsLayers() {
  if (!map?.getStyle() || map.getSource(WMS_RGA_SOURCE_ID)) return;
  const base = apiUrl(`${API_PREFIX}/geo/wms`);
  const rgaTiles = `${base}?layer=ALEARG_REALISE&bbox={bbox-epsg-3857}&width=256&height=256`;
  const mvtTiles = `${base}?layer=MVT_LOCALISE&bbox={bbox-epsg-3857}&width=256&height=256`;
  const beforeId = ZONES_FILL_LAYER_ID;
  try {
    map.addSource(WMS_RGA_SOURCE_ID, {
      type: 'raster',
      tiles: [rgaTiles],
      tileSize: 256,
      attribution: '© <a href="https://geoservices.brgm.fr/risques">BRGM</a>',
    });
    map.addLayer(
      {
        id: WMS_RGA_LAYER_ID,
        type: 'raster',
        source: WMS_RGA_SOURCE_ID,
        paint: { 'raster-opacity': 0.7 },
      },
      beforeId
    );
    map.addSource(WMS_MVT_SOURCE_ID, {
      type: 'raster',
      tiles: [mvtTiles],
      tileSize: 256,
      attribution: '© <a href="https://geoservices.brgm.fr/risques">BRGM</a>',
    });
    map.addLayer(
      {
        id: WMS_MVT_LAYER_ID,
        type: 'raster',
        source: WMS_MVT_SOURCE_ID,
        paint: { 'raster-opacity': 0.7 },
      },
      beforeId
    );
  } catch (e) {
    console.warn('[MapView] WMS layers failed:', e);
  }
}

/** Affiche ou masque le calque RGA BRGM selon le filtre "Retrait-gonflement argiles". */
function applyRgaLayerVisibility() {
  if (!map?.getStyle()) return;
  const layer = map.getLayer(WMS_RGA_LAYER_ID);
  if (!layer) return;
  const visible = (props.riskTypeFilters ?? []).includes(ARGILES_RISK_TYPE);
  map.setLayoutProperty(WMS_RGA_LAYER_ID, 'visibility', visible ? 'visible' : 'none');
}

let _pendingSourceDataOff: (() => void) | null = null;

function syncZonesAndFilter() {
  if (!map?.getStyle()) return false;
  const source = map.getSource(ZONES_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  const fillLayer = map.getLayer(ZONES_FILL_LAYER_ID);
  if (!source || !fillLayer) return false;
  _pendingSourceDataOff?.();
  const geojson = (props.riskZones?.features?.length
    ? props.riskZones
    : EMPTY_GEOJSON) as GeoJSON.FeatureCollection;
  source.setData(geojson);
  applyRiskZonesFilter();
  const handler = (e: { sourceId?: string; isSourceLoaded?: boolean }) => {
    if (e.sourceId !== ZONES_SOURCE_ID || !e.isSourceLoaded) return;
    _pendingSourceDataOff?.();
    _pendingSourceDataOff = null;
    applyRiskZonesFilter();
  };
  map.on('sourcedata', handler);
  _pendingSourceDataOff = () => {
    map?.off('sourcedata', handler);
  };
  return true;
}

function scheduleSync() {
  if (!map) return;
  if (syncZonesAndFilter()) return;
  const trySync = () => {
    if (syncZonesAndFilter()) return;
    map!.once('load', trySync);
    map!.once('idle', trySync);
    let n = 0;
    const retry = () => {
      if (syncZonesAndFilter() || n++ > 20) return;
      setTimeout(retry, 250);
    };
    setTimeout(retry, 100);
    setTimeout(retry, 500);
    setTimeout(retry, 1500);
  };
  trySync();
}

// Zones PPR : mettre à jour la source GeoJSON seulement quand les données changent (évite setData au simple clic filtre).
watch(
  () => props.riskZones,
  () => {
    if (!map) return;
    scheduleSync();
  },
  { deep: true, immediate: true }
);
// Filtres : appliquer le filtre carte sans toucher aux données (léger, pas de setData).
watch(
  () => props.riskTypeFilters,
  () => {
    if (!map) return;
    nextTick(() => {
      applyRiskZonesFilter();
      applyRgaLayerVisibility();
    });
  },
  { deep: true, immediate: true }
);

onUnmounted(() => {
  _pendingSourceDataOff?.();
  _pendingSourceDataOff = null;
  resizeObserver?.disconnect();
  resizeObserver = null;
  marker?.remove();
  map?.remove();
  map = null;
  marker = null;
});

defineExpose({ getMap: () => map });
</script>

<template>
  <div ref="mapContainer" class="map-container" role="application" aria-label="Carte des risques et zones réglementées" />
</template>

<style scoped>
.map-container {
  position: absolute;
  inset: 0;
  min-height: 400px;
}

:deep(.address-marker) {
  position: relative;
  width: 30px;
  height: 40px;
}

:deep(.marker-pin) {
  position: absolute;
  bottom: 0;
  left: 50%;
  margin-left: -12px;
  width: 24px;
  height: 24px;
  background: #0d9488;
  border: 3px solid white;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);
}

:deep(.marker-pulse) {
  position: absolute;
  bottom: 2px;
  left: 50%;
  margin-left: -12px;
  width: 24px;
  height: 24px;
  background: rgba(13, 148, 136, 0.25);
  border-radius: 50%;
  animation: marker-pulse 2s ease-out infinite;
}

@keyframes marker-pulse {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}

:deep(.maplibregl-ctrl-top-right) {
  top: 50%;
  transform: translateY(-50%);
  margin-top: 0;
}

:deep(.maplibregl-ctrl-group) {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.9);
  overflow: hidden;
}

:deep(.maplibregl-ctrl-group button) {
  width: 40px;
  height: 40px;
}
</style>
