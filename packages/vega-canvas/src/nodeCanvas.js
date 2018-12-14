var NodeCanvas;

try {
  NodeCanvas = require('canvas');
  if (!(NodeCanvas && NodeCanvas.createCanvas)) {
    NodeCanvas = null;
  }
} catch (error) {
  // do nothing
}

export function nodeCanvas(w, h) {
  if (NodeCanvas) {
    try {
      return new NodeCanvas.Canvas(w, h);
    } catch (e) {
      // do nothing, return null on error
    }
  }
  return null;
}

export function nodeImage() {
  return (NodeCanvas && NodeCanvas.Image) || null;
}
