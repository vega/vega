/**
 * Create an OffscreenCanvas instance, or return null if OffscreenCanvas is
 * not available (for example in Node.js, where node-canvas is used instead).
 * @param {number} w - The canvas width in pixels.
 * @param {number} h - The canvas height in pixels.
 * @returns {OffscreenCanvas|null}
 */
export function offscreenCanvas(w, h) {
  return typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : null;
}

/**
 * Test if a value is an OffscreenCanvas instance.
 * @param {*} canvas - The value to test.
 * @returns {boolean}
 */
export function isOffscreenCanvas(canvas) {
  return typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas;
}
