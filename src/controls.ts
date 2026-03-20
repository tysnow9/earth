/**
 * controls.ts
 * Unified input handler: trackpad, keyboard, and gamepad (PS4).
 *
 * Trackpad: MapLibre handles natively (pan, pinch-zoom, two-finger rotate).
 * Keyboard: arrow keys, WASD, +/-, F for fullscreen.
 * Gamepad:  Web Gamepad API — PS4 via USB or Bluetooth, no driver needed.
 *           Connect controller first, then press any button to activate.
 */

import maplibregl from 'maplibre-gl'
import { KEYBOARD } from './config'

export function initControls(map: maplibregl.Map): void {
  initKeyboard(map)
  initGamepad(map)
}

// ---------------------------------------------------------------------------
// Keyboard
// ---------------------------------------------------------------------------

function initKeyboard(map: maplibregl.Map): void {
  window.addEventListener('keydown', (e) => {
    // Ignore when typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

    const { rotateStep, zoomStep, pitchStep } = KEYBOARD
    const center = map.getCenter()
    const zoom = map.getZoom()
    const bearing = map.getBearing()
    const pitch = map.getPitch()

    switch (e.key) {
      // Pan
      case 'ArrowLeft':
      case 'a':
        map.easeTo({ bearing: bearing - rotateStep, duration: 200 })
        break
      case 'ArrowRight':
      case 'd':
        map.easeTo({ bearing: bearing + rotateStep, duration: 200 })
        break
      case 'ArrowUp':
      case 'w':
        map.easeTo({ center: [center.lng, center.lat + 2], duration: 200 })
        break
      case 'ArrowDown':
      case 's':
        map.easeTo({ center: [center.lng, center.lat - 2], duration: 200 })
        break
      // Zoom
      case '+':
      case '=':
        map.easeTo({ zoom: zoom + zoomStep, duration: 200 })
        break
      case '-':
        map.easeTo({ zoom: zoom - zoomStep, duration: 200 })
        break
      // Tilt
      case 'q':
        map.easeTo({ pitch: Math.min(pitch + pitchStep, 85), duration: 200 })
        break
      case 'e':
        map.easeTo({ pitch: Math.max(pitch - pitchStep, 0), duration: 200 })
        break
      // Reset view
      case 'r':
        map.flyTo({ zoom: 1.5, pitch: 0, bearing: 0, duration: 1000 })
        break
    }
  })
}

// ---------------------------------------------------------------------------
// Gamepad (PS4 via Web Gamepad API)
// ---------------------------------------------------------------------------
// PS4 button/axis mapping:
//   Axes:   0 = left stick X, 1 = left stick Y, 2 = right stick X, 3 = right stick Y
//   L2/R2:  axes 4/5 (range -1 to 1, resting at -1)
//   Buttons: see PS4_BUTTONS below

const PS4_BUTTONS = {
  cross: 0,
  circle: 1,
  square: 2,
  triangle: 3,
  l1: 4,
  r1: 5,
  l2: 6,
  r2: 7,
  share: 8,
  options: 9,
  l3: 10,
  r3: 11,
  dpadUp: 12,
  dpadDown: 13,
  dpadLeft: 14,
  dpadRight: 15,
  ps: 16,
  touchpad: 17,
} as const

const DEADZONE = 0.12  // ignore small stick drift

let gamepadLoopId: number | null = null

function initGamepad(map: maplibregl.Map): void {
  window.addEventListener('gamepadconnected', (e) => {
    console.log(`[earth] Gamepad connected: ${e.gamepad.id}`)
    startGamepadLoop(map)
  })

  window.addEventListener('gamepaddisconnected', () => {
    console.log('[earth] Gamepad disconnected')
    if (gamepadLoopId !== null) {
      cancelAnimationFrame(gamepadLoopId)
      gamepadLoopId = null
    }
  })
}

function startGamepadLoop(map: maplibregl.Map): void {
  function loop(): void {
    const gamepads = navigator.getGamepads()
    const gp = gamepads[0]

    if (gp) {
      handleGamepadInput(map, gp)
    }

    gamepadLoopId = requestAnimationFrame(loop)
  }

  gamepadLoopId = requestAnimationFrame(loop)
}

function applyDeadzone(value: number): number {
  return Math.abs(value) < DEADZONE ? 0 : value
}

function handleGamepadInput(map: maplibregl.Map, gp: Gamepad): void {
  const leftX  = applyDeadzone(gp.axes[0] ?? 0)
  const leftY  = applyDeadzone(gp.axes[1] ?? 0)
  const rightX = applyDeadzone(gp.axes[2] ?? 0)

  // L2/R2 axes rest at -1, active at +1 — normalize to 0..1
  const l2 = ((gp.axes[4] ?? -1) + 1) / 2
  const r2 = ((gp.axes[5] ?? -1) + 1) / 2

  const zoom    = map.getZoom()
  const bearing = map.getBearing()
  const pitch   = map.getPitch()
  const center  = map.getCenter()

  const speed = Math.max(0.005, 0.08 / Math.pow(2, zoom - 3))  // slower when zoomed in

  if (leftX !== 0) map.setBearing(bearing + leftX * 2)
  if (leftY !== 0) map.setCenter([center.lng, center.lat - leftY * speed * 180])
  if (rightX !== 0) map.setBearing(bearing + rightX * 2)

  const zoomDelta = (r2 - l2) * 0.05
  if (Math.abs(zoomDelta) > 0.001) map.setZoom(zoom + zoomDelta)

  // R1/L1 — tilt
  if (gp.buttons[PS4_BUTTONS.r1]?.pressed) map.setPitch(Math.min(pitch + 1, 85))
  if (gp.buttons[PS4_BUTTONS.l1]?.pressed) map.setPitch(Math.max(pitch - 1, 0))

  // Options button — reset view
  if (gp.buttons[PS4_BUTTONS.options]?.pressed) {
    map.flyTo({ zoom: 1.5, pitch: 0, bearing: 0, duration: 1000 })
  }
}
