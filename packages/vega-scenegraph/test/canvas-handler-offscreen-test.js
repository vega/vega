import tape from 'tape';
import {CanvasHandler} from '../index.js';
import './__init__.js';

// Mock OffscreenCanvas for testing
class MockOffscreenCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this._context = null;
  }

  getContext(type) {
    if (type === '2d' && !this._context) {
      this._context = {
        canvas: this,
        fillStyle: '',
        strokeStyle: '',
        setTransform: () => {},
        save: () => {},
        restore: () => {},
        scale: () => {},
        translate: () => {},
        pixelRatio: 1
      };
    }
    return this._context;
  }
}

const originalOffscreenCanvas = global.OffscreenCanvas;

tape('CanvasHandler should accept OffscreenCanvas directly', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreenCanvas = new MockOffscreenCanvas(400, 300);
    const handler = new CanvasHandler();
    const scene = {marktype: 'group', items: []};

    // Initialize handler with OffscreenCanvas passed via obj.canvas
    handler.scene(scene).initialize(null, [0, 0], { canvas: offscreenCanvas });

    t.equal(handler.canvas(), offscreenCanvas, 'handler should use provided OffscreenCanvas');
    t.ok(handler.context(), 'handler should have valid context');
    t.equal(handler.context().canvas, offscreenCanvas, 'context should reference OffscreenCanvas');

    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});

tape('CanvasHandler should not add event listeners to OffscreenCanvas', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreenCanvas = new MockOffscreenCanvas(400, 300);
    const handler = new CanvasHandler();
    const scene = {marktype: 'group', items: []};

    // Mock addEventListener to track calls
    let eventListenersAdded = 0;
    offscreenCanvas.addEventListener = () => {
      eventListenersAdded++;
    };

    handler.scene(scene).initialize(null, [0, 0], { canvas: offscreenCanvas });

    // OffscreenCanvas should not have event listeners added
    t.equal(eventListenersAdded, 0, 'no event listeners should be added to OffscreenCanvas');

    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});

tape('CanvasHandler should handle OffscreenCanvas with null element', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreenCanvas = new MockOffscreenCanvas(400, 300);
    const handler = new CanvasHandler();
    const scene = {marktype: 'group', items: []};

    // Initialize with null element (typical for Web Worker scenario)
    t.doesNotThrow(() => {
      handler.scene(scene).initialize(null, [0, 0], { canvas: offscreenCanvas });
    }, 'should initialize without DOM element');

    t.ok(handler.canvas(), 'canvas should be available');
    t.ok(handler.context(), 'context should be available');

    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});
