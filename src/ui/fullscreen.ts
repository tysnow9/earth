/**
 * fullscreen.ts
 * Toggle true OS-level fullscreen (no browser chrome) via F key or F11.
 */

export function initFullscreen(): void {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F11') {
      e.preventDefault()
      toggleFullscreen()
    }
  })
}

function toggleFullscreen(): void {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.warn('[earth] Fullscreen request failed:', err)
    })
  } else {
    document.exitFullscreen()
  }
}
