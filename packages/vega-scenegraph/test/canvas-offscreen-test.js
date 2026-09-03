import tape from 'tape';
import {nodeCanvas} from 'vega-canvas';
import {CanvasRenderer as Renderer, sceneFromJSON} from '../index.js';
import './__init__.js';

// OffscreenCanvas stand-in for Node.js: rendering is delegated to a
// node-canvas instance, so we do not maintain a hand-written mock of the
// Canvas 2D API.
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
  convertToBlob() {
    return Promise.resolve(new Blob([this._canvas.toBuffer('image/png')], {type: 'image/png'}));
  }
}

const originalOffscreenCanvas = global.OffscreenCanvas;

tape('CanvasRenderer should support OffscreenCanvas via canvas option', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreenCanvas = new MockOffscreenCanvas(400, 400);
    const cr = new Renderer();

    cr.initialize(null, 400, 200, [0, 0], 1.0, { canvas: offscreenCanvas });

    t.equal(cr.canvas(), offscreenCanvas, 'renderer should use provided OffscreenCanvas');
    t.ok(cr.context(), 'renderer should have valid context');
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

    // OffscreenCanvas has no style property, so resize must not touch it
    t.doesNotThrow(() => {
      cr.resize(800, 600, [10, 10], 2.0);
    }, 'resize should not throw on OffscreenCanvas');

    t.equal(offscreenCanvas.width, 1600, 'canvas width should be scaled');
    t.equal(offscreenCanvas.height, 1200, 'canvas height should be scaled');

    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});

tape('CanvasRenderer should render scene to OffscreenCanvas', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreenCanvas = new MockOffscreenCanvas(400, 400);
    const cr = new Renderer();

    const scene = sceneFromJSON({
      marktype: 'rect',
      items: [
        {x: 0, y: 0, width: 100, height: 50, fill: 'steelblue'}
      ]
    });

    cr.initialize(null, 400, 200, [0, 0], 1.0, { canvas: offscreenCanvas });

    t.doesNotThrow(() => {
      cr.render(scene);
    }, 'render should not throw on OffscreenCanvas');

    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});

tape('CanvasRenderer should handle dirty rendering with OffscreenCanvas', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreenCanvas = new MockOffscreenCanvas(400, 400);
    const cr = new Renderer();

    const scene = sceneFromJSON({
      marktype: 'rect',
      items: [
        {x: 0, y: 0, width: 100, height: 50, fill: 'steelblue'}
      ]
    });

    cr.initialize(null, 400, 200, [0, 0], 1.0, { canvas: offscreenCanvas });
    cr.render(scene);

    t.doesNotThrow(() => {
      cr.dirty(scene.items[0]);
      cr.render(scene);
    }, 'dirty re-render should not throw on OffscreenCanvas');

    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});
