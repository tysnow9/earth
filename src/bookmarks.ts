/**
 * bookmarks.ts
 * Save and recall named locations (coordinates, zoom, pitch, bearing).
 * Persisted in localStorage. Exportable to JSON.
 *
 * TODO: wire up to a UI panel and keyboard shortcuts
 */

import maplibregl from 'maplibre-gl'

export interface Bookmark {
  name: string
  lat: number
  lng: number
  zoom: number
  pitch: number
  bearing: number
  createdAt: string
}

const STORAGE_KEY = 'earth:bookmarks'

export function saveBookmark(map: maplibregl.Map, name: string): Bookmark {
  const center = map.getCenter()
  const bookmark: Bookmark = {
    name,
    lat: center.lat,
    lng: center.lng,
    zoom: map.getZoom(),
    pitch: map.getPitch(),
    bearing: map.getBearing(),
    createdAt: new Date().toISOString(),
  }

  const all = loadBookmarks()
  all[name] = bookmark
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  console.log(`[earth] Bookmark saved: "${name}"`)
  return bookmark
}

export function flyToBookmark(map: maplibregl.Map, name: string): boolean {
  const all = loadBookmarks()
  const bm = all[name]
  if (!bm) {
    console.warn(`[earth] Bookmark not found: "${name}"`)
    return false
  }

  map.flyTo({
    center: [bm.lng, bm.lat],
    zoom: bm.zoom,
    pitch: bm.pitch,
    bearing: bm.bearing,
    duration: 2500,
    essential: true,
  })
  return true
}

export function deleteBookmark(name: string): void {
  const all = loadBookmarks()
  delete all[name]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function loadBookmarks(): Record<string, Bookmark> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function exportBookmarks(): string {
  return JSON.stringify(loadBookmarks(), null, 2)
}

export function importBookmarks(json: string): void {
  const parsed = JSON.parse(json)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
}
