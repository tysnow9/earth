# Earth — Claude Code Context

Auto-loaded by Claude Code. Keep this current so every session starts with full context.

---

## What This Is

Fullscreen interactive 3D globe in the browser. No API keys. Keyboard + trackpad + DualShock 4 controller. Two view modes: globe (space) and drone (street-level FPS camera).

**Run it:** `npm run dev` → `http://localhost:5173`

---

## Architecture

| Concern | File | Notes |
|---------|------|-------|
| Entry | `src/main.ts` | Wires globe + controls + fullscreen |
| Globe | `src/globe.ts` | MapLibre init, layer stack, terrain, sky |
| Controls | `src/controls.ts` | All input: keyboard, trackpad, DS4 gamepad |
| Config | `src/config.ts` | Tile URLs, initial view, keyboard constants |
| Bookmarks | `src/bookmarks.ts` | localStorage save/recall — not yet wired to UI |
| Layers | `src/layers/` | Placeholder modules (satellite, weather, wildfires, political) |
| Fullscreen | `src/ui/fullscreen.ts` | `F` key toggle |

**Build:** Vite + TypeScript. `npm run dev` uses esbuild, no tsc compile step during dev.

**Critical:** Vite resolves `.js` before `.ts` in its default extension order. Never run `tsc` directly in `src/` — it generates `.js` artifacts that shadow the `.ts` sources and silently break everything. `src/**/*.js` is gitignored.

---

## MapLibre Notes

- Version: **v5.x** (v4 has no globe mode — do not downgrade)
- Globe projection: must call `map.setProjection({ type: 'globe' })` both in the style spec AND inside `map.on('load', ...)` or it gets overridden during style init
- `maxPitch: 90` is set on the Map constructor
- Globe mode enforces a **zoom-dependent pitch cap** (lower zoom = lower max pitch). This is a MapLibre internal limit, not fixable without forking
- **Workaround:** switch to mercator projection in drone mode (`map.setProjection({ type: 'mercator' })`). At street zoom it's visually identical but unlocks full 0–85° pitch. Switch back to globe on exit

---

## View Modes

### Globe mode
- Projection: `globe`
- Left stick / trackpad: spins globe (`map.panBy`) — bearing-aware
- DS4 cursor: small ring at screen center (visible when DS4 was last input)
- Mouse crosshair: follows cursor, marks drone entry point
- Drone entry position: mouse cursor position (if mouse active) or globe center (if DS4)

### Drone mode
- Projection: dynamically switches — `globe` below zoom 5, `mercator` at zoom 5+
- Left stick: thrust/strafe in bearing direction
- Right stick: yaw + pitch (stick UP = look toward horizon)
- L2/R2: altitude (L2 ascend, R2 descend)
- L1/R1: coarse pitch (L1 up, R1 down)
- Crosshair: fixed at screen center

### Mode toggle
- `T` key or DS4 **Triangle**
- DS4 **Options**: emergency reset → globe overview
- DS4 **Share**: north-up reset (bearing → 0)

---

## DS4 Gamepad — Standard Browser Mapping

Axes: `0`=leftX `1`=leftY `2`=rightX `3`=rightY
L2/R2 are **analog buttons** (`buttons[6/7].value`: 0→1), **not axes[4/5]** — common source of bugs.

```
Cross=0  Circle=1  Square=2  Triangle=3
L1=4  R1=5  L2=6  R2=7  Share=8  Options=9
L3=10  R3=11  DPad=12-15  PS=16  Touchpad=17
```

**Gamepad loop:** RAF is scheduled *before* input processing so a throw can't kill the loop.
**Detection:** `Array.from(navigator.getGamepads()).find(g => g !== null)` — index can shift on macOS Bluetooth.

---

## Tile Sources (all free, no keys)

| Source | Used for |
|--------|----------|
| ESRI World Imagery | Satellite basemap — `{z}/{y}/{x}` order (not standard) |
| OpenFreeMap | Vector tiles (labels, roads, borders) |
| AWS Terrain Tiles | Elevation / 3D terrain (Terrarium encoding) |
| NASA GIBS | Live overlays (weather, wildfires) — not yet active |

---

## Known Limitations

- Globe-mode pitch cap: MapLibre limits pitch at low zoom. Mitigated by switching to mercator in drone mode.
- Gamepad occasionally drops on macOS Bluetooth — loop is resilient; input resumes on reconnect.
- Bookmarks, layer toggles, and UI panel not yet built (Phase 3/4).

---

## Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Core globe, trackpad, keyboard, PS4 skeleton | ✅ Complete |
| 2 | Drone mode, full PS4 integration, mode switching | ✅ Complete |
| 3 | Bookmarks UI panel | Not started |
| 4 | Weather / wildfire / political layer toggles | Not started |
