import {domCanvas} from './src/domCanvas.js';
import {offscreenCanvas} from './src/offscreenCanvas.js';

export {domCanvas, domImage as image} from './src/domCanvas.js';
export {offscreenCanvas, isOffscreenCanvas} from './src/offscreenCanvas.js';

// domCanvas succeeds on the browser main thread, so it stays the preferred
// choice; the OffscreenCanvas fallback is reached in Web Workers, where no
// document is available. Both return null when unsupported.
export function canvas(w, h) {
  return domCanvas(w, h) || offscreenCanvas(w, h);
}
