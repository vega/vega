import tape from 'tape';
import {isOffscreenCanvas, offscreenCanvas} from '../index.js';

// stand-in for the OffscreenCanvas constructor, which Node.js lacks
class MockOffscreenCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
}

const originalOffscreenCanvas = global.OffscreenCanvas;

tape('offscreenCanvas returns null when OffscreenCanvas is not available', t => {
  global.OffscreenCanvas = undefined;

  const result = offscreenCanvas(100, 100);
  t.equal(result, null, 'should return null when OffscreenCanvas is unavailable');

  global.OffscreenCanvas = originalOffscreenCanvas;
  t.end();
});

tape('offscreenCanvas creates OffscreenCanvas when available', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  const result = offscreenCanvas(200, 150);
  t.ok(result instanceof MockOffscreenCanvas, 'should return an OffscreenCanvas instance');
  t.equal(result.width, 200, 'should have correct width');
  t.equal(result.height, 150, 'should have correct height');

  global.OffscreenCanvas = originalOffscreenCanvas;
  t.end();
});

tape('isOffscreenCanvas identifies OffscreenCanvas instances', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  t.equal(isOffscreenCanvas(new MockOffscreenCanvas(1, 1)), true, 'true for OffscreenCanvas');
  t.equal(isOffscreenCanvas({}), false, 'false for plain objects');
  t.equal(isOffscreenCanvas(null), false, 'false for null');

  global.OffscreenCanvas = undefined;
  t.equal(isOffscreenCanvas({}), false, 'false when OffscreenCanvas is unavailable');

  global.OffscreenCanvas = originalOffscreenCanvas;
  t.end();
});
