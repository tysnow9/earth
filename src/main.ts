import { initGlobe } from './globe'
import { initControls } from './controls'
import { initFullscreen } from './ui/fullscreen'

const map = initGlobe('map')

initControls(map)
initFullscreen()
