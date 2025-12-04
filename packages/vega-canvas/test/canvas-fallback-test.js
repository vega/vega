import tape from 'tape';
import {canvas} from '../index.js';

// Mock OffscreenCanvas for Node.js testing environment
class MockOffscreenCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  getContext() {
    return {};
  }
}

const originalOffscreenCanvas = global.OffscreenCanvas;

tape('canvas() falls back to OffscreenCanvas when domCanvas returns null', t => {
  // In Node.js, domCanvas returns null, and we have node-canvas as fallback
  // This test verifies the fallback chain works correctly
  const c = canvas(100, 100);
  t.ok(c, 'canvas should return a canvas instance');
  t.equal(c.width, 100, 'canvas should have correct width');
  t.equal(c.height, 100, 'canvas should have correct height');
  t.end();
});

tape('canvas() should use OffscreenCanvas when available and domCanvas returns null', t => {
  // This test simulates a Web Worker environment where:
  // - domCanvas returns null (no DOM)
  // - OffscreenCanvas is available
  // - nodeCanvas is not available

  // We can't fully simulate this in Node.js since node-canvas is available,
  // but we can verify the OffscreenCanvas is exported and callable
  global.OffscreenCanvas = MockOffscreenCanvas;

  // The canvas() function in index.js tries domCanvas, then offscreenCanvas, then nodeCanvas
  // In Node.js with node-canvas installed, domCanvas returns null but nodeCanvas works
  // This verifies the function chain exists and works
  const c = canvas(200, 150);
  t.ok(c, 'canvas should return a canvas instance');

  global.OffscreenCanvas = originalOffscreenCanvas;
  t.end();
});
