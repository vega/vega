import tape from 'tape';
import {CanvasRenderer as Renderer, sceneFromJSON} from '../index.js';
import './__init__.js';

// Mock OffscreenCanvas for Node.js testing environment
class MockOffscreenCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this._context = null;
  }

  getContext(type) {
    if (type === '2d' && !this._context) {
      // Create a minimal mock 2D context
      this._context = {
        canvas: this,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        globalAlpha: 1,
        setTransform: () => {},
        save: () => {},
        restore: () => {},
        scale: () => {},
        translate: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        fill: () => {},
        stroke: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        clearRect: () => {},
        rect: () => {},
        arc: () => {},
        clip: () => {},
        // Add pixelRatio property that will be set by resize
        pixelRatio: 1
      };
    }
    return this._context;
  }

  convertToBlob() {
    return Promise.resolve(new Blob());
  }
}

// Temporarily set global OffscreenCanvas for testing
const originalOffscreenCanvas = global.OffscreenCanvas;

tape('CanvasRenderer should support OffscreenCanvas via canvas option', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreenCanvas = new MockOffscreenCanvas(400, 400);
    const cr = new Renderer();

    // Initialize with OffscreenCanvas passed via options.canvas
    cr.initialize(null, 400, 200, [0, 0], 1.0, { canvas: offscreenCanvas });

    t.equal(cr.canvas(), offscreenCanvas, 'renderer should use provided OffscreenCanvas');
    t.ok(cr.context(), 'renderer should have valid context');
    t.equal(cr.context().canvas, offscreenCanvas, 'context should reference OffscreenCanvas');

    // Verify canvas was resized properly
    t.equal(offscreenCanvas.width, 400, 'canvas width should be set');
    t.equal(offscreenCanvas.height, 200, 'canvas height should be set');

    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});

tape('CanvasRenderer should support OffscreenCanvas context via externalContext', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreenCanvas = new MockOffscreenCanvas(400, 400);
    const offscreenContext = offscreenCanvas.getContext('2d');
    const cr = new Renderer();

    // Initialize with OffscreenCanvas context passed via externalContext (legacy approach)
    cr.initialize(null, 400, 200, [0, 0], 1.0, { externalContext: offscreenContext });

    t.equal(cr.canvas(), null, 'canvas should be null when using externalContext');
    t.equal(cr.context(), offscreenContext, 'context should match provided context');

    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});

tape('CanvasRenderer resize should handle OffscreenCanvas without style property', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreenCanvas = new MockOffscreenCanvas(400, 400);
    const cr = new Renderer();

    cr.initialize(null, 200, 100, [0, 0], 1.0, { canvas: offscreenCanvas });

    // Resize should work without trying to set style.width/height
    t.doesNotThrow(() => {
      cr.resize(800, 600, [10, 10], 2.0);
    }, 'resize should not throw on OffscreenCanvas');

    // Verify resize worked
    t.equal(offscreenCanvas.width, 1600, 'canvas width should be scaled');
    t.equal(offscreenCanvas.height, 1200, 'canvas height should be scaled');

    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});
