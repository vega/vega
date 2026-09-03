import tape from 'tape';
import {nodeCanvas} from 'vega-canvas';
import {CanvasHandler} from '../index.js';
import './__init__.js';

// OffscreenCanvas stand-in for Node.js: the 2D context comes from
// node-canvas, so we do not maintain a hand-written mock of the Canvas API.
class MockOffscreenCanvas {
  constructor(width, height) {
    this._canvas = nodeCanvas(width, height);
  }
  get width() { return this._canvas.width; }
  set width(width) { this._canvas.width = width; }
  get height() { return this._canvas.height; }
  set height(height) { this._canvas.height = height; }
  getContext(type) {
    return this._canvas.getContext(type);
  }
}

const originalOffscreenCanvas = global.OffscreenCanvas;

tape('CanvasHandler should accept OffscreenCanvas directly', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreenCanvas = new MockOffscreenCanvas(400, 300);
    const handler = new CanvasHandler();
    const scene = {marktype: 'group', items: []};

    // the third argument of Handler.initialize is an options object;
    // its canvas property supplies the render target directly, in place
    // of a DOM element to search
    handler.scene(scene).initialize(null, [0, 0], { canvas: offscreenCanvas });

    t.equal(handler.canvas(), offscreenCanvas, 'handler should use provided OffscreenCanvas');
    t.ok(handler.context(), 'handler should have valid context');

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

    let eventListenersAdded = 0;
    offscreenCanvas.addEventListener = () => {
      eventListenersAdded++;
    };

    handler.scene(scene).initialize(null, [0, 0], { canvas: offscreenCanvas });

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
