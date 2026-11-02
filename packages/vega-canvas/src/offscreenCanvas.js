// returns null where OffscreenCanvas is unavailable (e.g. Node.js)
export function offscreenCanvas(w, h) {
  return typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : null;
}

export function isOffscreenCanvas(canvas) {
  return typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas;
}
