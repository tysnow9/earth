# Earth — Development Context

Living project log. Update as work progresses. For Claude Code architecture/pitfall context, see `CLAUDE.md`.

---

## Project Goal

Fullscreen interactive 3D globe. Controls: trackpad, keyboard, DualShock 4.
Imagery: fully free sources, no API keys.
Future: bookmarks UI, live data layers (weather, wildfires, political).

---

## Current State

### Phase 1 — Core globe ✅
- 3D sphere globe (MapLibre GL JS v5 globe projection)
- ESRI World Imagery satellite basemap
- Country + state borders, labels (OpenFreeMap vector tiles)
- AWS terrain elevation + exaggeration
- Sky / atmosphere

### Phase 2 — Controls + Drone mode ✅
- **Globe mode:** trackpad drag, pinch-zoom, keyboard (WASD/arrows/+/-/Q/E/R/N/T/F)
- **DS4 globe:** left stick spins globe, L2/R2 zoom, L1/R1 tilt, Share=north-up, Options=reset
- **Drone mode:** FPS camera at street level — left stick thrust/strafe, right stick look, L2/R2 altitude
- **Mode switching:** T key or Triangle; enters drone at mouse cursor position (or globe center for DS4)
- **Projection switching:** globe↔mercator based on zoom in drone mode (fixes flat-earth look when zoomed out; mercator unlocks full pitch range when close in)
- **HUD:** mode indicator (fades), crosshair (drone=center, globe=follows mouse or DS4 ring at center)
- **Input detection:** cursor switches between DS4 ring and mouse crosshair based on last input type

### Not yet started
- Bookmarks UI panel (backend complete in `bookmarks.ts`)
- Layer toggles: weather, wildfires, political
- Any server-side or backend component

---

## Key Bugs Solved

| Bug | Fix |
|-----|-----|
| MapLibre v4 has no globe mode | Upgraded to v5 |
| `setProjection` overridden at style init | Call it in style spec AND inside `map.on('load')` |
| DS4 L2/R2 not working | They're analog **buttons** (`buttons[6/7].value`), not `axes[4/5]` |
| Gamepad loop dying near poles | Schedule `requestAnimationFrame` **before** input processing |
| `.js` files shadowing `.ts` sources | Vite resolves `.js` before `.ts`; gitignore `src/**/*.js` |
| Globe pitch cap in drone mode | Switch to mercator projection in drone mode |
| Gamepad index shifting on macOS BT | Use `Array.from(getGamepads()).find(g => g !== null)` |

---

## Architecture Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Renderer | MapLibre GL JS v5 | Globe mode, WebGL2, no key needed |
| Satellite | ESRI World Imagery | High quality, free, widely used |
| Vector | OpenFreeMap | Fully free, OpenMapTiles schema |
| Terrain | AWS Terrain Tiles (Terrarium) | Free, public, good global coverage |
| Live data | NASA GIBS / FIRMS | Free, no key, frequently updated |
| Build | Vite + TypeScript | Fast DX, type safety |
| State | localStorage | Simple persistence for bookmarks |
| Drone projection | mercator | Removes zoom-dependent pitch cap; visually identical at street zoom |

---

## Phase Plan

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Core globe + trackpad + keyboard + PS4 skeleton | ✅ Complete |
| 2 | Drone mode, full PS4 integration, mode switching | ✅ Complete |
| 3 | Bookmarks UI | Not started |
| 4 | Weather / wildfire / political layers | Not started |

---

## Session Log

### 2026-03-20 — Phase 1
- Chose MapLibre GL JS (globe mode, fully free)
- Scaffolded full project structure
- Fixed globe projection init sequencing
- Globe confirmed working: sphere, satellite, labels, terrain

### 2026-03-21 — Phase 2
- DS4 controller: fixed L2/R2 (analog buttons not axes), fixed gamepad loop resilience
- Drone mode: FPS camera, bearing-aware thrust/strafe, altitude controls
- Mode switching: T/Triangle toggles; mouse crosshair marks entry point; DS4 ring cursor
- Projection switching: mercator in drone mode unlocks pitch; globe restored on exit
- Dynamic proj in drone: switches at zoom 5 threshold so globe looks spherical when far out
- Input detection: cursor follows last input type (gamepad vs mouse)
- Fixed critical bug: Vite loads `.js` before `.ts` — stale compiled files were silently used
