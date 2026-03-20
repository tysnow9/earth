/**
 * layers/satellite.ts
 * Additional satellite imagery layers beyond the ESRI basemap.
 *
 * NASA GIBS provides free, frequently-updated global satellite composites.
 * See: https://nasa-gibs.github.io/gibs-api-docs/
 *
 * TODO: implement layer toggle, opacity control
 */

import maplibregl from 'maplibre-gl'
import { SOURCES } from '../config'

// Example GIBS layers (add more as needed):
//   MODIS_Terra_CorrectedReflectance_TrueColor — true color daily composite
//   VIIRS_SNPP_CorrectedReflectance_TrueColor  — higher resolution daily
//   MODIS_Terra_Snow_Cover                     — snow coverage

export function addNasaGibsLayer(
  map: maplibregl.Map,
  layerId: string,
  date?: string  // YYYY-MM-DD, defaults to today
): void {
  const _dateStr = date ?? new Date().toISOString().split('T')[0]

  map.addSource(`gibs-${layerId}`, {
    type: 'raster',
    tiles: [SOURCES.nasaGibs(layerId)],
    tileSize: 256,
    attribution: 'NASA GIBS',
  })

  map.addLayer({
    id: `gibs-${layerId}`,
    type: 'raster',
    source: `gibs-${layerId}`,
    paint: { 'raster-opacity': 0.7 },
  })
}

export function removeNasaGibsLayer(map: maplibregl.Map, layerId: string): void {
  const id = `gibs-${layerId}`
  if (map.getLayer(id)) map.removeLayer(id)
  if (map.getSource(id)) map.removeSource(id)
}
