var NodeCanvas;

['canvas', 'canvas-prebuilt'].some(function(libName) {
  try {
    NodeCanvas = require(libName);
    if (typeof NodeCanvas !== 'function') {
      NodeCanvas = null;
    }
  } catch (error) {
    NodeCanvas = null;
  }
  return NodeCanvas;
});

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
  return (NodeCanvas && NodeCanvas.Image) || null;
}
