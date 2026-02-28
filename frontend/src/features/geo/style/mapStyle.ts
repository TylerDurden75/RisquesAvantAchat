/**
 * Style MapLibre — couches OSM et zones PPR.
 *
 * @module features/geo/style
 */

import type { StyleSpecification } from 'maplibre-gl';

export const ZONES_SOURCE_ID = 'risk-zones';
export const ZONES_FILL_LAYER_ID = 'risk-zones-fill';
export const ZONES_LINE_LAYER_ID = 'risk-zones-line';

/** IDs des calques WMS BRGM (proxy backend). */
export const WMS_RGA_SOURCE_ID = 'wms-rga';
export const WMS_RGA_LAYER_ID = 'wms-rga-layer';
export const WMS_MVT_SOURCE_ID = 'wms-mvt';
export const WMS_MVT_LAYER_ID = 'wms-mvt-layer';

export const DEFAULT_CENTER: [number, number] = [2.35, 46.5];
export const DEFAULT_ZOOM = 6;

export const FRANCE_BOUNDS: [[number, number], [number, number]] = [
  [-5.5, 41.3],
  [9.6, 51.1],
];

export const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
    [ZONES_SOURCE_ID]: {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    },
  },
  layers: [
    { id: 'osm-tiles', type: 'raster', source: 'osm' },
    {
      id: ZONES_FILL_LAYER_ID,
      type: 'fill',
      source: ZONES_SOURCE_ID,
      paint: {
        'fill-color': [
          'match', ['get', 'riskType'],
          'Inondation', 'rgba(59, 130, 246, 1)',
          'Mouvement de terrain', 'rgba(121, 85, 72, 1)',
          'Mouvements de terrain', 'rgba(121, 85, 72, 1)',
          'rgba(220, 38, 38, 1)',
        ],
        'fill-opacity': [
          'interpolate', ['linear'],
          ['coalesce', ['get', 'approvalYear'], 2000],
          1990, 0.22, 2000, 0.4, 2010, 0.58, 2024, 0.72,
        ],
        'fill-outline-color': [
          'match', ['get', 'riskType'],
          'Inondation', '#2563eb',
          'Mouvement de terrain', '#5d4037',
          'Mouvements de terrain', '#5d4037',
          '#dc2626',
        ],
      },
    },
    {
      id: ZONES_LINE_LAYER_ID,
      type: 'line',
      source: ZONES_SOURCE_ID,
      paint: {
        'line-color': [
          'match', ['get', 'riskType'],
          'Inondation', '#2563eb',
          'Mouvement de terrain', '#5d4037',
          'Mouvements de terrain', '#5d4037',
          '#dc2626',
        ],
        'line-opacity': [
          'interpolate', ['linear'],
          ['coalesce', ['get', 'approvalYear'], 2000],
          1990, 0.35, 2000, 0.5, 2010, 0.7, 2024, 0.9,
        ],
        'line-width': 2,
      },
    },
  ],
};
