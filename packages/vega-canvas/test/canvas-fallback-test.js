import tape from 'tape';
import {canvas} from '../index.js';

// stand-in for the OffscreenCanvas constructor, which Node.js lacks
class MockOffscreenCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
}

const originalOffscreenCanvas = global.OffscreenCanvas;

tape('canvas() falls back to node-canvas when neither DOM nor OffscreenCanvas exist', t => {
  const c = canvas(100, 100);
  t.ok(c, 'canvas should return a canvas instance');
  t.equal(c.width, 100, 'canvas should have correct width');
  t.equal(c.height, 100, 'canvas should have correct height');
  t.end();
});

tape('canvas() prefers OffscreenCanvas over node-canvas when available', t => {
  // simulates a Web Worker: no DOM, but OffscreenCanvas exists
  global.OffscreenCanvas = MockOffscreenCanvas;

  const c = canvas(200, 150);
  t.ok(c instanceof MockOffscreenCanvas, 'canvas should be an OffscreenCanvas');
  t.equal(c.width, 200, 'canvas should have correct width');
  t.equal(c.height, 150, 'canvas should have correct height');

  global.OffscreenCanvas = originalOffscreenCanvas;
  t.end();
});
