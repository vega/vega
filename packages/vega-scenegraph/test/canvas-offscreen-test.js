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
        lineCap: 'butt',
        lineJoin: 'miter',
        miterLimit: 10,
        lineDashOffset: 0,
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        direction: 'ltr',
        imageSmoothingEnabled: true,
        setTransform: () => {},
        resetTransform: () => {},
        save: () => {},
        restore: () => {},
        scale: () => {},
        translate: () => {},
        rotate: () => {},
        transform: () => {},
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
        arcTo: () => {},
        ellipse: () => {},
        bezierCurveTo: () => {},
        quadraticCurveTo: () => {},
        clip: () => {},
        isPointInPath: () => false,
        isPointInStroke: () => false,
        fillText: () => {},
        strokeText: () => {},
        measureText: (text) => ({ width: text.length * 6 }),
        getLineDash: () => [],
        setLineDash: () => {},
        drawImage: () => {},
        createLinearGradient: () => ({
          addColorStop: () => {}
        }),
        createRadialGradient: () => ({
          addColorStop: () => {}
        }),
        createPattern: () => null,
        getImageData: () => ({ data: new Uint8ClampedArray(0), width: 0, height: 0 }),
        putImageData: () => {},
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

tape('CanvasRenderer should render scene to OffscreenCanvas', t => {
  global.OffscreenCanvas = MockOffscreenCanvas;

  try {
    const offscreenCanvas = new MockOffscreenCanvas(400, 400);
    const cr = new Renderer();

    // Create a simple scene with a rectangle
    const scene = sceneFromJSON({
      marktype: 'rect',
      items: [
        {x: 0, y: 0, width: 100, height: 50, fill: 'steelblue'}
      ]
    });

    cr.initialize(null, 400, 200, [0, 0], 1.0, { canvas: offscreenCanvas });

    // Render should not throw
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

    // Mark a region as dirty using a Bounds-like object and re-render
    t.doesNotThrow(() => {
      cr.dirty(scene.items[0]);
      cr.render(scene);
    }, 'dirty re-render should not throw on OffscreenCanvas');

    t.end();
  } finally {
    global.OffscreenCanvas = originalOffscreenCanvas;
  }
});
