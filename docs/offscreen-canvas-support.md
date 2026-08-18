# OffscreenCanvas Support in Vega

Vega can render to an [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas), enabling rendering inside [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API). Heavy visualizations render in a background thread, keeping the main UI thread responsive.

## Quick Start

Transfer a canvas to a worker from the main thread:

```js
// Main thread
const canvas = document.getElementById('myCanvas');
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker('vega-worker.js', { type: 'module' });

worker.postMessage({ canvas: offscreen, spec: myVegaSpec }, [offscreen]);
```

Create a View with the transferred canvas inside the worker:

```js
// Worker thread
import * as vega from 'vega';

self.addEventListener('message', async (event) => {
  const { canvas, spec } = event.data;

  const runtime = vega.parse(spec);
  // renderer defaults to 'canvas' when a canvas is provided
  const view = new vega.View(runtime, { canvas });

  await view.runAsync();
});
```

## API

### View Options

```ts
interface ViewOptions {
  canvas?: HTMLCanvasElement | OffscreenCanvas;
  scaleFactor?: number;
  renderer?: 'canvas' | 'svg' | 'none';
  // ... other options
}
```

When `canvas` is provided, the View automatically configures the canvas renderer and handler for it. No DOM element is required. Because a worker cannot read `devicePixelRatio`, pass `scaleFactor` from the main thread to render at the display's pixel ratio; the `view.scaleFactor(ratio)` method updates it later (for example when the window moves to another display).

### Canvas Renderer Options

```ts
interface CanvasRendererOptions {
  canvas?: HTMLCanvasElement | OffscreenCanvas;
  externalContext?: CanvasRenderingContext2D;  // backward compat
  type?: 'pdf' | 'svg';
}
```

```js
renderer.initialize(null, 800, 600, [0, 0], 1.0, {
  canvas: myOffscreenCanvas
});
```

### vega-canvas

`canvas()` falls back in order: DOM canvas, then OffscreenCanvas, then node-canvas. New `offscreenCanvas(width, height)` and `isOffscreenCanvas(value)` functions are also exported. Because of this fallback, the label transform's collision detection works in workers automatically - no configuration needed.

### Image Export

`view.toImageURL()` works with both canvas types. For OffscreenCanvas it uses `convertToBlob()` and returns a blob URL; for HTMLCanvasElement it returns a data URL as before.

```js
const url = await view.toImageURL('png');
```

## Browser Support

See the [OffscreenCanvas compatibility table on MDN](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas#browser_compatibility). Use feature detection to fall back to main-thread rendering:

```js
if (typeof OffscreenCanvas !== 'undefined') {
  // render in a worker
} else {
  // fall back to main-thread rendering
}
```

## Limitations

1. **No DOM access**: workers cannot access `document` or `window`
2. **Event handling**: mouse/touch events must be proxied from the main thread

## Example

See [docs/examples/offscreen-canvas](./examples/offscreen-canvas/README.md) for a complete working example: a labeled chart rendered in a worker, using the label transform with collision detection.
