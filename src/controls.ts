/**
 * controls.ts
 * Unified input handler: trackpad, keyboard, and DualShock 4 gamepad.
 *
 * Trackpad: MapLibre handles natively (pan, pinch-zoom, two-finger rotate).
 * Keyboard: WASD/arrows, +/- zoom, Q/E tilt, R reset, N north-up, T mode, F fullscreen.
 *
 * DS4 — Globe:  left stick = spin globe, L2/R2 = zoom, L1/R1 = tilt
 * DS4 — Drone:  left stick = thrust/strafe, right stick = look, L2/R2 = altitude, L1/R1 = pitch
 * DS4 — Both:   Triangle = toggle mode, Share = north-up, Options = reset to space view
 *
 * HUD:
 *   Globe mode → mouse crosshair follows cursor (mouse input) or center ring (DS4 input)
 *   Drone mode → crosshair locked to screen center
 */

import maplibregl from 'maplibre-gl'
import { KEYBOARD } from './config'

// ---------------------------------------------------------------------------
// View mode state
// ---------------------------------------------------------------------------

type ViewMode = 'globe' | 'drone'

interface DroneState { zoom: number; pitch: number }

const DRONE_DEFAULTS: DroneState = { zoom: 14, pitch: 65 }

let currentMode: ViewMode = 'globe'
let lastDroneState: DroneState | null = null

// Mouse position in client (screen) coordinates, updated on every mousemove
let mouseClient = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
let mouseIsOverCanvas = false
let lastInputType: 'gamepad' | 'mouse' = 'gamepad'

// Current projection active in drone mode — switches by zoom threshold
let droneProj: 'globe' | 'mercator' | null = null
const DRONE_GLOBE_ZOOM = 5  // below this zoom, use globe even in drone mode

// ---------------------------------------------------------------------------
// Crosshair HUD — follows mouse in globe mode, locked to center in drone mode
// ---------------------------------------------------------------------------

let crosshairEl: HTMLElement | null = null

function createCrosshair(): void {
  const size      = 26   // arm length from center edge to tip
  const gap       = 6    // gap between center and arm start
  const thickness = 1.5
  const color     = 'rgba(255, 255, 255, 0.85)'

  crosshairEl = document.createElement('div')
  Object.assign(crosshairEl.style, {
    position:      'fixed',
    top:           '50%',
    left:          '50%',
    transform:     'translate(-50%, -50%)',
    width:         '0',
    height:        '0',
    pointerEvents: 'none',
    display:       'none',
    zIndex:        '9998',
  })

  // Four arms: top, bottom, left, right
  const arms = [
    { w: thickness,      h: size - gap, t: -(size),         l: -thickness / 2 },
    { w: thickness,      h: size - gap, t: gap,             l: -thickness / 2 },
    { w: size - gap,     h: thickness,  t: -thickness / 2,  l: -(size)        },
    { w: size - gap,     h: thickness,  t: -thickness / 2,  l: gap            },
  ]
  for (const arm of arms) {
    const el = document.createElement('div')
    Object.assign(el.style, {
      position: 'absolute',
      width:    `${arm.w}px`,
      height:   `${arm.h}px`,
      top:      `${arm.t}px`,
      left:     `${arm.l}px`,
      background: color,
    })
    crosshairEl.appendChild(el)
  }

  // Center dot
  const dot = document.createElement('div')
  Object.assign(dot.style, {
    position:     'absolute',
    width:        '3px',
    height:       '3px',
    top:          '-1.5px',
    left:         '-1.5px',
    background:   color,
    borderRadius: '50%',
  })
  crosshairEl.appendChild(dot)

  document.body.appendChild(crosshairEl)
}

/** Move crosshair to a screen position (for globe mouse-follow). */
function setCrosshairPosition(x: number, y: number): void {
  if (!crosshairEl) return
  crosshairEl.style.left = `${x}px`
  crosshairEl.style.top  = `${y}px`
}

/** Reset crosshair to screen center (for drone aim). */
function centerCrosshair(): void {
  if (!crosshairEl) return
  crosshairEl.style.left = '50%'
  crosshairEl.style.top  = '50%'
}

function setCrosshairVisible(v: boolean): void {
  if (crosshairEl) crosshairEl.style.display = v ? 'block' : 'none'
}

// ---------------------------------------------------------------------------
// DS4 globe cursor — small ring+dot at screen center, visible in globe mode
// when the mouse is not over the canvas (i.e. user is navigating with DS4)
// ---------------------------------------------------------------------------

let globeCursorEl: HTMLElement | null = null

function createGlobeCursor(): void {
  globeCursorEl = document.createElement('div')
  Object.assign(globeCursorEl.style, {
    position:      'fixed',
    top:           '50%',
    left:          '50%',
    transform:     'translate(-50%, -50%)',
    width:         '14px',
    height:        '14px',
    border:        '1px solid rgba(255,255,255,0.7)',
    borderRadius:  '50%',
    pointerEvents: 'none',
    display:       'none',
    zIndex:        '9998',
  })
  // Center dot
  const dot = document.createElement('div')
  Object.assign(dot.style, {
    position:     'absolute',
    width:        '3px',
    height:       '3px',
    top:          '50%',
    left:         '50%',
    transform:    'translate(-50%, -50%)',
    background:   'rgba(255,255,255,0.7)',
    borderRadius: '50%',
  })
  globeCursorEl.appendChild(dot)
  document.body.appendChild(globeCursorEl)
}

function setGlobeCursorVisible(v: boolean): void {
  if (globeCursorEl) globeCursorEl.style.display = v ? 'block' : 'none'
}

/** Sync globe-mode cursor visibility to the current lastInputType. */
function syncGlobeCursor(): void {
  if (currentMode !== 'globe') return
  const usingGamepad = lastInputType === 'gamepad'
  setGlobeCursorVisible(usingGamepad)
  setCrosshairVisible(!usingGamepad && mouseIsOverCanvas)
}

// ---------------------------------------------------------------------------
// Mode indicator HUD
// ---------------------------------------------------------------------------

let modeEl: HTMLElement | null = null
let modeFadeTimer: ReturnType<typeof setTimeout> | null = null

function createModeIndicator(): void {
  modeEl = document.createElement('div')
  Object.assign(modeEl.style, {
    position:      'fixed',
    top:           '16px',
    left:          '50%',
    transform:     'translateX(-50%)',
    background:    'rgba(0, 0, 0, 0.6)',
    color:         '#fff',
    fontFamily:    'monospace',
    fontSize:      '13px',
    letterSpacing: '0.15em',
    padding:       '5px 16px',
    borderRadius:  '4px',
    pointerEvents: 'none',
    userSelect:    'none',
    opacity:       '0',
    transition:    'opacity 0.35s',
    zIndex:        '9999',
  })
  document.body.appendChild(modeEl)
}

function showModeIndicator(mode: ViewMode): void {
  if (!modeEl) return
  modeEl.textContent = mode === 'drone' ? '[ DRONE MODE ]' : '[ GLOBE MODE ]'
  modeEl.style.opacity = '1'
  if (modeFadeTimer !== null) clearTimeout(modeFadeTimer)
  modeFadeTimer = setTimeout(() => { if (modeEl) modeEl.style.opacity = '0' }, 2000)
}

// ---------------------------------------------------------------------------
// Mouse tracking — drives globe-mode crosshair and drone entry position
// ---------------------------------------------------------------------------

function initMouseTracking(map: maplibregl.Map): void {
  const canvas = map.getCanvas()

  canvas.addEventListener('mousemove', (e) => {
    mouseClient = { x: e.clientX, y: e.clientY }
    if (currentMode === 'globe') setCrosshairPosition(e.clientX, e.clientY)
    if (lastInputType !== 'mouse') { lastInputType = 'mouse'; syncGlobeCursor() }
  })

  canvas.addEventListener('mouseenter', () => {
    mouseIsOverCanvas = true
    syncGlobeCursor()
  })
  canvas.addEventListener('mouseleave', () => {
    mouseIsOverCanvas = false
    syncGlobeCursor()
  })
}

/** Unproject the current mouse screen position to a geographic coordinate. */
function mouseToLngLat(map: maplibregl.Map): maplibregl.LngLat | null {
  try {
    const canvas = map.getCanvas()
    const rect   = canvas.getBoundingClientRect()
    const point  = new maplibregl.Point(
      mouseClient.x - rect.left,
      mouseClient.y - rect.top,
    )
    return map.unproject(point)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Mode toggle
// ---------------------------------------------------------------------------

function saveDroneState(map: maplibregl.Map): void {
  lastDroneState = { zoom: map.getZoom(), pitch: map.getPitch() }
}

function toggleMode(map: maplibregl.Map): void {
  if (currentMode === 'globe') {
    // DS4: enter at globe center. Mouse: enter at cursor position.
    const lngLat = (lastInputType === 'mouse' && mouseIsOverCanvas)
      ? (mouseToLngLat(map) ?? map.getCenter())
      : map.getCenter()
    const ds = lastDroneState ?? DRONE_DEFAULTS
    currentMode = 'drone'
    setGlobeCursorVisible(false)
    centerCrosshair()
    setCrosshairVisible(true)
    showModeIndicator('drone')
    map.flyTo({
      center:   [lngLat.lng, lngLat.lat],
      zoom:     ds.zoom,
      pitch:    ds.pitch,
      bearing:  map.getBearing(),
      duration: 1500,
    })
    // After flyTo, set projection based on zoom (mercator unlocks pitch; globe looks right when far out)
    map.once('moveend', () => {
      if (currentMode !== 'drone') return
      droneProj = map.getZoom() < DRONE_GLOBE_ZOOM ? 'globe' : 'mercator'
      map.setProjection({ type: droneProj })
    })
  } else {
    saveDroneState(map)
    droneProj = null
    map.setProjection({ type: 'globe' })
    currentMode = 'globe'
    setCrosshairVisible(false)
    showModeIndicator('globe')
    // Reset to north-up globe overview
    map.flyTo({ zoom: 1.5, pitch: 0, bearing: 0, duration: 1500 })
    syncGlobeCursor()
  }
  console.log(`[earth] Mode → ${currentMode}`)
}

// ---------------------------------------------------------------------------
// Public init
// ---------------------------------------------------------------------------

export function initControls(map: maplibregl.Map): void {
  createModeIndicator()
  createCrosshair()
  createGlobeCursor()
  initMouseTracking(map)
  initKeyboard(map)
  initGamepad(map)

  // In drone mode, dynamically switch projection by zoom so the globe stays spherical
  // when zoomed far out, and mercator unlocks full pitch when close in.
  map.on('zoom', () => {
    if (currentMode !== 'drone' || droneProj === null) return
    const target: 'globe' | 'mercator' = map.getZoom() < DRONE_GLOBE_ZOOM ? 'globe' : 'mercator'
    if (target !== droneProj) {
      droneProj = target
      map.setProjection({ type: target })
    }
  })
}

// ---------------------------------------------------------------------------
// Keyboard
// ---------------------------------------------------------------------------

function initKeyboard(map: maplibregl.Map): void {
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

    const { rotateStep, zoomStep, pitchStep } = KEYBOARD
    const center  = map.getCenter()
    const zoom    = map.getZoom()
    const bearing = map.getBearing()
    const pitch   = map.getPitch()

    switch (e.key) {
      case 'ArrowLeft':  case 'a': map.easeTo({ bearing: bearing - rotateStep, duration: 200 }); break
      case 'ArrowRight': case 'd': map.easeTo({ bearing: bearing + rotateStep, duration: 200 }); break
      case 'ArrowUp':    case 'w': map.easeTo({ center: [center.lng, center.lat + 2], duration: 200 }); break
      case 'ArrowDown':  case 's': map.easeTo({ center: [center.lng, center.lat - 2], duration: 200 }); break
      case '+': case '=':          map.easeTo({ zoom: zoom + zoomStep, duration: 200 }); break
      case '-':                    map.easeTo({ zoom: zoom - zoomStep, duration: 200 }); break
      case 'q':                    map.easeTo({ pitch: Math.min(pitch + pitchStep, 85), duration: 200 }); break
      case 'e':                    map.easeTo({ pitch: Math.max(pitch - pitchStep, 0),  duration: 200 }); break
      case 'r':                    map.flyTo({ zoom: 1.5, pitch: 0, bearing: 0, duration: 1000 }); break
      case 'n':                    map.easeTo({ bearing: 0, duration: 500 }); break
      case 't':                    toggleMode(map); break
    }
  })
}

// ---------------------------------------------------------------------------
// Gamepad (PS4 / DualShock 4 — standard browser mapping)
// ---------------------------------------------------------------------------
// Standard mapping:
//   Axes: 0=leftX, 1=leftY, 2=rightX, 3=rightY
//   L2/R2 are analog *buttons* (buttons[6/7].value: 0→1), NOT axes[4/5]
//   Buttons: 0=Cross 1=Circle 2=Square 3=Triangle
//            4=L1 5=R1 6=L2 7=R2  8=Share 9=Options
//            10=L3 11=R3  12-15=DPad  16=PS 17=Touchpad

const BTN = {
  cross: 0, circle: 1, square: 2, triangle: 3,
  l1: 4, r1: 5, l2: 6, r2: 7,
  share: 8, options: 9, l3: 10, r3: 11,
  dpadUp: 12, dpadDown: 13, dpadLeft: 14, dpadRight: 15,
  ps: 16, touchpad: 17,
} as const

const DEADZONE = 0.12
let gamepadLoopId: number | null = null
const prevButtons: boolean[] = []

function applyDeadzone(v: number): number {
  return Math.abs(v) < DEADZONE ? 0 : v
}

/** Fire only on the frame a button transitions released → pressed. */
function isJustPressed(gp: Gamepad, btn: number): boolean {
  const now = gp.buttons[btn]?.pressed ?? false
  const was = prevButtons[btn] ?? false
  prevButtons[btn] = now
  return now && !was
}

/** Analog trigger value 0→1. Checks button.value first (standard), falls back to axis. */
function triggerValue(gp: Gamepad, btnIndex: number, axisIndex: number): number {
  const bv = gp.buttons[btnIndex]?.value
  if (bv !== undefined && bv > 0.01) return bv
  const av = gp.axes[axisIndex]
  return av !== undefined ? (av + 1) / 2 : 0
}

function initGamepad(map: maplibregl.Map): void {
  window.addEventListener('gamepadconnected', (e) => {
    console.log(`[earth] Gamepad connected: ${e.gamepad.id}`)
    if (gamepadLoopId === null) startGamepadLoop(map)
  })
  window.addEventListener('gamepaddisconnected', (e) => {
    console.log(`[earth] Gamepad disconnected: ${e.gamepad.id}`)
    if (gamepadLoopId !== null) { cancelAnimationFrame(gamepadLoopId); gamepadLoopId = null }
  })
}

function startGamepadLoop(map: maplibregl.Map): void {
  function loop(): void {
    // Schedule FIRST — keeps the loop alive even if input processing throws
    gamepadLoopId = requestAnimationFrame(loop)
    const gp = Array.from(navigator.getGamepads()).find(g => g !== null) ?? null
    if (!gp) return
    try {
      handleGamepadInput(map, gp)
    } catch (err) {
      console.warn('[earth] Gamepad input error:', err)
    }
  }
  gamepadLoopId = requestAnimationFrame(loop)
}

function handleGamepadInput(map: maplibregl.Map, gp: Gamepad): void {
  // Detect any real input to switch cursor to gamepad mode
  const anyInput = gp.axes.some(a => Math.abs(a) > DEADZONE) ||
                   gp.buttons.some(b => b.pressed || b.value > 0.05)
  if (anyInput && lastInputType !== 'gamepad') { lastInputType = 'gamepad'; syncGlobeCursor() }

  if (isJustPressed(gp, BTN.triangle)) toggleMode(map)
  if (isJustPressed(gp, BTN.share))   map.easeTo({ bearing: 0, duration: 500 })

  if (isJustPressed(gp, BTN.options)) {
    if (currentMode === 'drone') saveDroneState(map)
    droneProj = null
    map.setProjection({ type: 'globe' })
    currentMode = 'globe'
    setCrosshairVisible(false)
    showModeIndicator('globe')
    map.flyTo({ zoom: 1.5, pitch: 0, bearing: 0, duration: 1000 })
    syncGlobeCursor()
  }

  if (currentMode === 'drone') {
    handleDroneAnalog(map, gp)
  } else {
    handleGlobeAnalog(map, gp)
  }
}

// ---------------------------------------------------------------------------
// Globe mode analog
// ---------------------------------------------------------------------------

function handleGlobeAnalog(map: maplibregl.Map, gp: Gamepad): void {
  const leftX = applyDeadzone(gp.axes[0] ?? 0)
  const leftY = applyDeadzone(gp.axes[1] ?? 0)
  const l2 = triggerValue(gp, BTN.l2, 4)
  const r2 = triggerValue(gp, BTN.r2, 5)

  const zoom  = map.getZoom()
  const pitch = map.getPitch()

  // Left stick: panBy matches trackpad drag exactly — MapLibre handles bearing,
  // globe curvature, and zoom scaling automatically.
  // Scale pixel rate with zoom so speed stays comfortable when close to globe.
  if (leftX !== 0 || leftY !== 0) {
    const panPx = Math.min(20, 1.5 * Math.pow(2, Math.max(0, zoom - 1.5)))
    map.panBy([leftX * panPx, leftY * panPx], { animate: false })
  }

  if (gp.buttons[BTN.r1]?.pressed) map.setPitch(Math.min(pitch + 1, 85))
  if (gp.buttons[BTN.l1]?.pressed) map.setPitch(Math.max(pitch - 1, 0))

  const zoomDelta = (r2 - l2) * 0.05
  if (Math.abs(zoomDelta) > 0.001) map.setZoom(zoom + zoomDelta)
}

// ---------------------------------------------------------------------------
// Drone mode analog
// ---------------------------------------------------------------------------
// Left  stick Y  = thrust forward/back  (in bearing direction)
// Left  stick X  = strafe left/right    (perpendicular to bearing)
// Right stick X  = yaw
// Right stick Y  = pitch  (no upper cap — can look up at sky)
// L2 = ascend, R2 = descend
// L1/R1 = coarse pitch steps

function handleDroneAnalog(map: maplibregl.Map, gp: Gamepad): void {
  const leftX  = applyDeadzone(gp.axes[0] ?? 0)
  const leftY  = applyDeadzone(gp.axes[1] ?? 0)
  const rightX = applyDeadzone(gp.axes[2] ?? 0)
  const rightY = applyDeadzone(gp.axes[3] ?? 0)
  const l2 = triggerValue(gp, BTN.l2, 4)
  const r2 = triggerValue(gp, BTN.r2, 5)

  const zoom    = map.getZoom()
  const bearing = map.getBearing()
  const pitch   = map.getPitch()
  const center  = map.getCenter()

  // Speed scales with altitude — faster high up, slower near ground
  const moveSpeed = 0.00035 * Math.pow(2, 14 - zoom)
  const rad = (bearing * Math.PI) / 180

  let dlng = 0, dlat = 0
  if (leftY !== 0) { dlng += Math.sin(rad) * (-leftY) * moveSpeed; dlat += Math.cos(rad) * (-leftY) * moveSpeed }
  if (leftX !== 0) { dlng += Math.cos(rad) * leftX * moveSpeed;    dlat -= Math.sin(rad) * leftX * moveSpeed }

  if (dlng !== 0 || dlat !== 0) {
    // Clamp latitude to ±89.9° — values outside this range cause MapLibre to throw,
    // which would break the gamepad loop if not caught. Longitude wraps naturally.
    const newLat = Math.max(-89.9, Math.min(89.9, center.lat + dlat))
    map.setCenter([center.lng + dlng, newLat])
  }

  // Yaw: scale sensitivity down when zoomed in — same angular feel regardless of altitude
  const yawRate = Math.max(0.5, 2.5 / Math.pow(2, Math.max(0, zoom - 12) / 2))
  if (rightX !== 0) map.setBearing(bearing + rightX * yawRate)

  // Pitch: stick UP (rightY < 0) = look toward horizon; stick DOWN = look toward ground
  // Floor at 0. MapLibre caps at maxPitch (85°).
  if (rightY !== 0) map.setPitch(Math.max(0, pitch - rightY * 1.5))
  if (gp.buttons[BTN.r1]?.pressed) map.setPitch(Math.min(85, pitch + 1.5))
  if (gp.buttons[BTN.l1]?.pressed) map.setPitch(Math.max(0,  pitch - 1.5))

  // L2 = ascend (zoom out), R2 = descend (zoom in)
  const altDelta = (l2 - r2) * 0.06
  if (Math.abs(altDelta) > 0.001) map.setZoom(Math.max(1, zoom - altDelta))
}
