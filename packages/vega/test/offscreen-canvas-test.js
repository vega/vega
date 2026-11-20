import tape from 'tape';
import * as vega from '../index.js';
import {nodeCanvas} from '../../vega-canvas/index.js';

// OffscreenCanvas stand-in for Node.js: rendering is delegated to a
// node-canvas instance, matching the convention of the vega-scenegraph tests
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

const spec = {
  width: 100,
  height: 100,
  padding: 0,
  autosize: 'none',
  data: [{name: 'table', values: [{}]}],
  marks: [
    {
      type: 'rect',
      from: {data: 'table'},
      encode: {
        enter: {
          x: {value: 0},
          y: {value: 0},
          width: {value: 50},
          height: {value: 50},
          fill: {value: 'steelblue'}
        }
      }
    }
  ]
};

tape('View renders to a provided OffscreenCanvas', async t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreen = new MockOffscreenCanvas(100, 100);
    const view = new vega.View(vega.parse(spec), {canvas: offscreen});
    await view.runAsync();

    t.equal(view._renderer.canvas(), offscreen, 'renderer should use the provided canvas');
    const {data} = offscreen.getContext('2d').getImageData(10, 10, 1, 1);
    t.deepEqual([data[0], data[1], data[2]], [70, 130, 180],
      'pixel inside the rect should be steelblue');

    view.finalize();
    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});

tape('headless export does not reuse or resize the live canvas', async t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreen = new MockOffscreenCanvas(100, 100);
    const view = new vega.View(vega.parse(spec), {canvas: offscreen, scaleFactor: 1});
    await view.runAsync();

    const exported = await view.toCanvas(3);

    t.notEqual(exported, offscreen, 'export must render to its own canvas');
    t.equal(exported.width, 300, 'export should honor its own scaleFactor argument');
    t.equal(offscreen.width, 100, 'live canvas width must be unaffected by an export');
    t.equal(offscreen.height, 100, 'live canvas height must be unaffected by an export');

    view.finalize();
    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});

tape('view-level scaleFactor applies and per-call export arguments win', async t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreen = new MockOffscreenCanvas(100, 100);
    const view = new vega.View(vega.parse(spec), {canvas: offscreen, scaleFactor: 2});
    await view.runAsync();

    t.equal(offscreen.width, 200, 'live canvas uses the view-level scale factor');

    const dflt = await view.toCanvas();
    t.equal(dflt.width, 200, 'export without an argument defaults to the view scale factor');

    const explicit = await view.toCanvas(3);
    t.equal(explicit.width, 300, 'an explicit export scaleFactor overrides the view option');

    view.finalize();
    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});

tape('scale factor survives a resize', async t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreen = new MockOffscreenCanvas(100, 100);
    const view = new vega.View(vega.parse(spec), {canvas: offscreen, scaleFactor: 2});
    await view.runAsync();

    await view.width(300).runAsync();
    t.equal(view._renderer._scale, 2, 'scale factor is not reset by a resize');
    t.equal(offscreen.width, 600, 'canvas backing store reflects width * scale factor');

    view.scaleFactor(3);
    await view.resize().runAsync();
    t.equal(offscreen.width, 900, 'scaleFactor() updates take effect on the next resize');

    view.finalize();
    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});

tape('toImageURL returns a blob URL for an OffscreenCanvas view', async t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreen = new MockOffscreenCanvas(100, 100);
    const view = new vega.View(vega.parse(spec), {canvas: offscreen});
    await view.runAsync();

    const url = await view.toImageURL('png');
    t.ok(/^blob:/.test(url), 'toImageURL should produce a blob URL via convertToBlob');
    URL.revokeObjectURL(url);

    view.finalize();
    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});

tape('the canvas option requires the canvas renderer', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreen = new MockOffscreenCanvas(100, 100);
    t.throws(
      () => new vega.View(vega.parse(spec), {canvas: offscreen, renderer: 'svg'}),
      /canvas option requires the canvas renderer/,
      'a non-canvas renderer combined with the canvas option should error'
    );
    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});
