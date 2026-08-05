let NodeCanvas;

try {
  NodeCanvas = await import('canvas');
  if (!(NodeCanvas && NodeCanvas.createCanvas)) {
    NodeCanvas = null;
  }
} catch (error) {
  // do nothing
}

export function nodeCanvas(w, h, type) {
  if (NodeCanvas) {
    try {
      return new NodeCanvas.Canvas(w, h, type);
    } catch (e) {
      // do nothing, return null on error
    }
  }
  return null;
}

export const nodeImage = () =>
  (NodeCanvas && NodeCanvas.Image) || null;
