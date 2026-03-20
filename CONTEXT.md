# Earth — Development Context

This file is the living context for ongoing development.
Update it as the project evolves. Reference it at the start of new sessions.

---

## Project Goal

An interactive 3D globe running in a browser (fullscreen, no chrome).
Controls: trackpad, keyboard, PS4 controller.
Imagery: fully free sources, no API keys.
Future: drone mode near surface, bookmarks, live data layers.

---

## Current State

**Phase 1 — Core globe WORKING ✓**

Visually confirmed working:
- 3D sphere globe renders correctly (MapLibre GL JS v5 globe projection)
- ESRI World Imagery satellite basemap loading with good detail
- Country borders, labels rendering cleanly over satellite
- AWS terrain elevation active
- Sky/atmosphere configured
- Runs fast, graphics look great per user

Files in place:
- `index.html` — bare full-screen shell, no browser chrome
- `src/main.ts` — entry: init globe, controls, fullscreen
- `src/globe.ts` — MapLibre globe, ESRI satellite + OpenFreeMap vector + AWS terrain + sky
- `src/config.ts` — all tile URLs and constants in one place
- `src/controls.ts` — keyboard + PS4 gamepad skeleton
- `src/bookmarks.ts` — save/load/fly-to locations via localStorage
- `src/ui/fullscreen.ts` — `F` key toggles OS fullscreen
- `src/layers/` — placeholder modules for satellite, weather, wildfires, political
- `package.json`, `tsconfig.json`, `vite.config.ts`

**Not yet done:**
- Gamepad axis mapping needs testing with actual PS4 controller
- No UI panel yet (bookmarks, layer toggles are code-only)
- Drone mode (Phase 2) not yet implemented

---

## Architecture Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Renderer | MapLibre GL JS v4 | Globe mode, WebGL2, no key needed |
| Satellite | ESRI World Imagery | High quality, free, widely used |
| Vector | OpenFreeMap | Fully free, OpenMapTiles schema |
| Terrain | AWS Terrain Tiles (Terrarium) | Free, public, good global coverage |
| Live data | NASA GIBS / FIRMS | Free, no key, frequently updated |
| Build | Vite + TypeScript | Fast DX, type safety |
| State | localStorage | Simple persistence for bookmarks |

---

## Known Issues / TODOs

- [ ] Gamepad: test actual PS4 button/axis mapping (controller-specific variation possible)
- [ ] Drone mode: not yet implemented (Phase 2)
- [ ] No UI — bookmarks and layer toggles are API-only for now
- [ ] Attribution panel: should add visible credits for tile sources

---

## Phase Plan

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Core globe + trackpad + keyboard + PS4 skeleton | **Complete ✓** |
| 2 | Drone mode, full PS4 integration | Not started |
| 3 | Bookmarks UI | Not started |
| 4 | Weather / wildfire / political layers | Not started |

---

## Tile Source Reference

```
ESRI Satellite:
  https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
  Note: {z}/{y}/{x} order (not standard {z}/{x}/{y})

OpenFreeMap:
  https://tiles.openfreemap.org/planet
  Schema: OpenMapTiles (same layer names as MapTiler)

AWS Terrain:
  https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png
  Encoding: Terrarium (RGB-encoded elevation)
  Max zoom: 15

NASA GIBS WMTS:
  https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg
  Docs: https://nasa-gibs.github.io/gibs-api-docs/
```

---

## Session Log

### 2026-03-20 — Initial scaffold + Phase 1 complete
- Discussed tech stack options (CesiumJS vs MapLibre vs Three.js)
- Chose MapLibre GL JS (globe mode, fully free, no keys)
- Defined 4-phase roadmap
- Scaffolded full project structure
- **Key bug fixed:** maplibre-gl v4 has no globe mode — upgraded to v5.20.2
- **Key bug fixed:** `setProjection()` must be called inside `map.on('load')`, and also set in the style spec itself, or it gets overridden during style init
- Globe confirmed working: 3D sphere, satellite imagery, labels, terrain
- Next: Phase 2 — drone mode + full PS4 controller integration
