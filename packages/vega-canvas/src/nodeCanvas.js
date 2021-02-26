let SkiaCanvas;

try {
  SkiaCanvas = require('skia-canvas');
  if (!(SkiaCanvas && SkiaCanvas.Canvas)) {
    SkiaCanvas = null;
  }
} catch (error) {
  // do nothing
}

export function nodeCanvas(w = 0, h = 0) {
  if (SkiaCanvas) {
    try {
      return new SkiaCanvas.Canvas(w, h);
    } catch (e) {
      // do nothing, return null on error
    }
  }
  return null;
}

export const nodeImage = () =>
  (SkiaCanvas && SkiaCanvas.Image) || null;
