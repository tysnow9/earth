# Earth

An interactive 3D globe with realistic satellite imagery, terrain, and live data layers.
Built with [MapLibre GL JS](https://maplibre.org/) — no API keys required.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Rendering | MapLibre GL JS v4 (WebGL2 globe mode) |
| Build | Vite + TypeScript |
| Satellite imagery | ESRI World Imagery (free, no key) |
| Vector tiles | OpenFreeMap (labels, roads, borders) |
| 3D terrain | AWS Terrain Tiles (Terrarium DEM, free) |
| Live data | NASA GIBS, NASA FIRMS (free) |

---

## Getting Started

```bash
npm install
npm run dev
```

Opens in browser at `http://localhost:5173`. Press `F` for fullscreen.

---

## Controls

### Keyboard

| Key | Action |
|-----|--------|
| `Arrow keys` / `WASD` | Pan / rotate globe |
| `+` / `-` | Zoom in / out |
| `Q` / `E` | Tilt up / down |
| `R` | Reset to space view |
| `F` | Toggle fullscreen |

### Trackpad

| Gesture | Action |
|---------|--------|
| One-finger drag | Pan |
| Pinch | Zoom |
| Two-finger rotate | Rotate |

### PS4 Controller (USB or Bluetooth)

| Input | Action |
|-------|--------|
| Left stick | Pan / rotate |
| R2 / L2 | Zoom in / out |
| R1 / L1 | Tilt up / down |
| Options | Reset to space view |

> Connect the controller before opening the app, or press any button after connecting.

---

## Project Structure

```
src/
├── main.ts           Entry point
├── globe.ts          Globe init, layer stack, sky/atmosphere
├── config.ts         Tile sources, camera constants, key bindings
├── controls.ts       Keyboard + gamepad input
├── bookmarks.ts      Save/recall named locations (localStorage)
├── layers/
│   ├── satellite.ts  NASA GIBS live satellite composites
│   ├── weather.ts    Cloud cover, precipitation (TODO)
│   ├── wildfires.ts  NASA FIRMS active fires (TODO)
│   └── political.ts  Extended political layers (TODO)
└── ui/
    └── fullscreen.ts Fullscreen toggle
```

---

## Tile Sources

All sources are free and require no API key:

| Source | Used For | URL |
|--------|----------|-----|
| ESRI World Imagery | Satellite basemap | `server.arcgisonline.com` |
| OpenFreeMap | Vector tiles | `tiles.openfreemap.org` |
| AWS Terrain Tiles | Elevation / 3D terrain | `s3.amazonaws.com/elevation-tiles-prod` |
| NASA GIBS | Live satellite overlays | `gibs.earthdata.nasa.gov` |
| NASA FIRMS | Active fire data | `firms.modaps.eosdis.nasa.gov` |

---

## Roadmap

- [x] Phase 1 — Core globe (satellite + terrain + borders + labels)
- [x] Phase 1 — Trackpad + keyboard controls
- [x] Phase 1 — PS4 controller skeleton
- [ ] Phase 2 — Drone mode (low-altitude FPS camera)
- [ ] Phase 2 — Full PS4 controller integration
- [ ] Phase 3 — Bookmarks UI panel + keyboard shortcuts
- [ ] Phase 4 — Weather layer (NASA GIBS clouds/precip)
- [ ] Phase 4 — Wildfire layer (NASA FIRMS)
- [ ] Phase 4 — Political layer toggles
