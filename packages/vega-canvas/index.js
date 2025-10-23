import {domCanvas, domImage} from './src/domCanvas.js';
import {nodeCanvas, nodeImage} from './src/nodeCanvas.js';
import {offscreenCanvas} from './src/offscreenCanvas.js';

export {domCanvas} from './src/domCanvas.js';
export {nodeCanvas} from './src/nodeCanvas.js';
export {offscreenCanvas} from './src/offscreenCanvas.js';

export function canvas(w, h, type) {
  return domCanvas(w, h) || nodeCanvas(w, h, type) || null;
}

export function image() {
  return domImage() || nodeImage() || null;
}
