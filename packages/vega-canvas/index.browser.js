import {domCanvas, domImage} from './src/domCanvas.js';
import {offscreenCanvas} from './src/offscreenCanvas.js';

export {domCanvas, domImage};
export {offscreenCanvas};

// Browser fallback: try domCanvas first, then OffscreenCanvas
export function canvas(w, h) {
  return domCanvas(w, h) || offscreenCanvas(w, h) || null;
}

export function image() {
  return domImage() || null;
}
