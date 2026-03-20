/**
 * globe.ts
 * Core MapLibre GL globe initialization and layer composition.
 *
 * Layer stack (bottom to top):
 *   1. ESRI World Imagery    — satellite raster basemap (free, no key)
 *   2. AWS Terrain           — elevation/3D terrain (free public dataset)
 *   3. OpenFreeMap vector    — roads, labels, borders (free, no key)
 *
 * Future layers (see src/layers/) can be toggled on/off independently.
 */

import maplibregl from 'maplibre-gl'
import { SOURCES, INITIAL_VIEW } from './config'

export function initGlobe(containerId: string): maplibregl.Map {
  const map = new maplibregl.Map({
    container: containerId,
    style: buildStyle(),
    center: [INITIAL_VIEW.lng, INITIAL_VIEW.lat],
    zoom: INITIAL_VIEW.zoom,
    pitch: INITIAL_VIEW.pitch,
    bearing: INITIAL_VIEW.bearing,
    // Globe projection — full sphere rendering
    projection: { type: 'globe' },
    // Disable default attribution control (we'll add a custom one later)
    attributionControl: false,
    // Smooth rendering
    antialias: true,
  })

  map.on('load', () => {
    addTerrain(map)
    configureSky(map)
    console.log('[earth] Globe initialized')
  })

  return map
}

function buildStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sprite: 'https://demotiles.maplibre.org/styles/osm-bright-gl-style/sprite',
    sources: {
      // Satellite raster — ESRI World Imagery (free, no key required)
      satellite: {
        type: 'raster',
        tiles: [SOURCES.esriSatellite],
        tileSize: 256,
        attribution: 'Esri, Maxar, Earthstar Geographics',
        maxzoom: 19,
      },
      // Vector tiles — OpenFreeMap (roads, labels, borders, POIs)
      openmaptiles: {
        type: 'vector',
        url: SOURCES.openFreeMap,
        attribution: '© OpenFreeMap © OpenStreetMap contributors',
      },
    },
    layers: [
      // --- Satellite base ---
      {
        id: 'satellite',
        type: 'raster',
        source: 'satellite',
        minzoom: 0,
        maxzoom: 22,
      },
      // --- Country borders ---
      {
        id: 'country-boundary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['==', 'admin_level', 2],
        paint: {
          'line-color': 'rgba(255, 255, 255, 0.5)',
          'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.5, 8, 1.5],
        },
      },
      // --- State/province borders ---
      {
        id: 'state-boundary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['==', 'admin_level', 4],
        paint: {
          'line-color': 'rgba(255, 255, 255, 0.25)',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.25, 10, 1],
          'line-dasharray': [4, 4],
        },
      },
      // --- Water labels ---
      {
        id: 'water-label',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'water_name',
        layout: {
          'text-field': ['get', 'name:en'],
          'text-font': ['Open Sans Italic'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 8, 14],
        },
        paint: {
          'text-color': 'rgba(180, 220, 255, 0.9)',
          'text-halo-color': 'rgba(0, 0, 0, 0.5)',
          'text-halo-width': 1,
        },
      },
      // --- Country labels ---
      {
        id: 'country-label',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        filter: ['==', 'class', 'country'],
        layout: {
          'text-field': ['get', 'name:en'],
          'text-font': ['Open Sans Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 2, 10, 6, 16],
        },
        paint: {
          'text-color': 'rgba(255, 255, 255, 0.95)',
          'text-halo-color': 'rgba(0, 0, 0, 0.6)',
          'text-halo-width': 1.5,
        },
      },
    ],
  }
}

function addTerrain(map: maplibregl.Map): void {
  // AWS Terrain Tiles — free public elevation dataset
  map.addSource('terrain', {
    type: 'raster-dem',
    tiles: [SOURCES.awsTerrain],
    tileSize: 256,
    encoding: 'terrarium',
    attribution: 'Terrain tiles by Mapzen, hosted on AWS',
  })

  map.setTerrain({ source: 'terrain', exaggeration: 1.5 })
}

function configureSky(map: maplibregl.Map): void {
  map.setSky({
    'sky-color': '#000005',
    'sky-horizon-blend': 0.5,
    'horizon-color': '#0a1a3a',
    'horizon-fog-blend': 0.8,
    'fog-color': '#0a1a3a',
    'fog-ground-blend': 0.9,
  })
}
