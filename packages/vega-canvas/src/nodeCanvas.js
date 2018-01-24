var NodeCanvas;

try {
  // try to load canvas module
  NodeCanvas = require('canvas');
  if (!NodeCanvas) throw 1;
} catch (e) {
  try {
    // if canvas fails, try to load canvas-prebuilt
    NodeCanvas = require('canvas-prebuilt');
  } catch (e2) {
    // if all options fail, set to null
    NodeCanvas = null;
  }
}

export function nodeCanvas(w, h) {
  if (NodeCanvas) {
    try {
      return new NodeCanvas(w, h);
    } catch (e) {
      // do nothing, return null on error
    }
  }
  return null;
}

export function nodeImage() {
  return NodeCanvas && NodeCanvas.Image || null;
}
