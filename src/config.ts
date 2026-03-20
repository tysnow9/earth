/**
 * config.ts
 * Central configuration — tile sources, initial view, constants.
 */

export const SOURCES = {
  // ESRI World Imagery — free satellite basemap, no API key required
  esriSatellite:
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',

  // OpenFreeMap — free vector tiles (roads, labels, borders)
  // Hosted by OpenFreeMap.org, no key required
  openFreeMap: 'https://tiles.openfreemap.org/planet',

  // AWS Terrain Tiles — free public elevation (Terrarium RGB-encoded DEM)
  awsTerrain:
    'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',

  // NASA GIBS — free live satellite imagery layers (weather, wildfires, etc.)
  // Individual layer URLs added as needed in src/layers/
  nasaGibs: (layer: string) =>
    `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
} as const

export const INITIAL_VIEW = {
  lat: 20,
  lng: 0,
  zoom: 1.5,   // ~"from space" — full globe visible
  pitch: 0,
  bearing: 0,
} as const

export const CAMERA = {
  // Altitude thresholds for mode switching (meters above ground)
  droneAltitudeThreshold: 50_000,  // below this = drone mode
  minAltitude: 50,                  // minimum drone flight height
  maxZoom: 18,
  minZoom: 1,
} as const

export const KEYBOARD = {
  rotateStep: 5,       // degrees per keypress
  zoomStep: 0.5,
  pitchStep: 5,
} as const
