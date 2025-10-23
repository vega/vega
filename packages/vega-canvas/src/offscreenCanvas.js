/**
 * Create an OffscreenCanvas instance if available.
 * OffscreenCanvas is a browser API that provides a canvas which can be rendered
 * off screen in Web Workers. It is not available in Node.js environments.
 *
 * @param {number} w - The canvas width in pixels
 * @param {number} h - The canvas height in pixels
 * @returns {OffscreenCanvas|null} An OffscreenCanvas instance, or null if unavailable
 */
export function offscreenCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      return new OffscreenCanvas(w, h);
    } catch (e) {
      // OffscreenCanvas constructor may throw in some contexts
    }
  }
  return null;
}
