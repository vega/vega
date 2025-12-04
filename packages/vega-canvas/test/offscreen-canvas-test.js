import tape from 'tape';
import {offscreenCanvas} from '../index.js';

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

tape('offscreenCanvas returns null when OffscreenCanvas is not available', t => {
  // Ensure OffscreenCanvas is undefined
  global.OffscreenCanvas = undefined;

  const result = offscreenCanvas(100, 100);
  t.equal(result, null, 'should return null when OffscreenCanvas is unavailable');

  global.OffscreenCanvas = originalOffscreenCanvas;
  t.end();
});

tape('offscreenCanvas creates OffscreenCanvas when available', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  const result = offscreenCanvas(200, 150);
  t.ok(result, 'should return an OffscreenCanvas instance');
  t.equal(result.width, 200, 'should have correct width');
  t.equal(result.height, 150, 'should have correct height');

  global.OffscreenCanvas = originalOffscreenCanvas;
  t.end();
});

tape('offscreenCanvas returns null when constructor throws', t => {
  // Mock OffscreenCanvas that throws
  global.OffscreenCanvas = function() {
    throw new Error('OffscreenCanvas not supported in this context');
  };

  const result = offscreenCanvas(100, 100);
  t.equal(result, null, 'should return null when constructor throws');

  global.OffscreenCanvas = originalOffscreenCanvas;
  t.end();
});
