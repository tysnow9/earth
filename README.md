# Earth

Fullscreen interactive 3D globe. Satellite imagery, terrain, live data layers. No API keys.

Built with [MapLibre GL JS v5](https://maplibre.org/).

```bash
npm install
npm run dev
# → http://localhost:5173
```

---

## Controls

### Globe mode — navigate the planet

| Input | Action |
|-------|--------|
| Trackpad drag | Spin globe |
| Pinch | Zoom |
| `WASD` / Arrow keys | Spin / tilt |
| `+` / `-` | Zoom |
| `Q` / `E` | Tilt |
| `N` | Reset north-up |
| `R` | Reset to space view |
| `F` | Toggle fullscreen |
| `T` | Enter drone mode at cursor |

**DS4 — globe:**

| Input | Action |
|-------|--------|
| Left stick | Spin globe |
| L2 / R2 | Zoom out / in |
| L1 / R1 | Tilt |
| Triangle | Enter drone mode |
| Share | Reset north-up |
| Options | Reset to space view |

---

### Drone mode — low-altitude FPS camera

| Input | Action |
|-------|--------|
| `T` | Return to globe |

**DS4 — drone:**

| Input | Action |
|-------|--------|
| Left stick | Thrust forward/back, strafe left/right |
| Right stick X | Yaw (turn) |
| Right stick Y | Pitch (look up/down) |
| L2 / R2 | Ascend / descend |
| L1 / R1 | Pitch up / down (coarse) |
| Triangle | Return to globe |
| Options | Emergency reset to space view |

---

## Stack

| | |
|-|-|
| Renderer | MapLibre GL JS v5 (WebGL2, globe projection) |
| Build | Vite + TypeScript |
| Satellite | ESRI World Imagery — free, no key |
| Vector | OpenFreeMap — labels, roads, borders |
| Terrain | AWS Terrain Tiles — Terrarium DEM, free |
| Live data | NASA GIBS / FIRMS — not yet active |

---

## Project Structure

```
src/
├── main.ts           Entry point
├── globe.ts          Globe init, layer stack, sky/atmosphere
├── config.ts         Tile sources, constants
├── controls.ts       All input — keyboard, trackpad, DS4 gamepad, mode switching
├── bookmarks.ts      Save/recall locations (localStorage) — UI not yet built
├── layers/
│   ├── satellite.ts  NASA GIBS live composites (stub)
│   ├── weather.ts    Cloud cover / precipitation (stub)
│   ├── wildfires.ts  NASA FIRMS active fires (stub)
│   └── political.ts  Political overlays (stub)
└── ui/
    └── fullscreen.ts F key toggle
```

---

## Roadmap

- [x] Core globe — satellite imagery, terrain, borders, labels
- [x] Trackpad + keyboard controls
- [x] DualShock 4 controller — full integration
- [x] Drone mode — low-altitude FPS camera with mode switching
- [ ] Bookmarks UI panel
- [ ] Weather layer
- [ ] Wildfire layer
- [ ] Political layer toggles
