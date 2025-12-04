# Using Vega with OffscreenCanvas in Web Workers

This example demonstrates how to use Vega with OffscreenCanvas to render visualizations in a Web Worker, enabling multi-threaded rendering for improved performance.

## Overview

OffscreenCanvas is a browser API that provides a canvas which can be rendered off screen in Web Workers. This allows you to perform expensive rendering operations in a background thread without blocking the main UI thread.

## Prerequisites

- Modern browser with OffscreenCanvas support (Chrome 69+, Edge 79+, Firefox 105+)
- Vega with OffscreenCanvas support (this version or later)

## Example: Web Worker Setup

### 1. Main Thread (main.js)

```javascript
import * as vega from 'vega';
import spec from './spec.json';

// Create OffscreenCanvas
const canvas = document.getElementById('myCanvas');
const offscreen = canvas.transferControlToOffscreen();

// Create worker
const worker = new Worker('vega-worker.js', { type: 'module' });

// Transfer OffscreenCanvas to worker
worker.postMessage({
  type: 'init',
  canvas: offscreen,
  spec: spec
}, [offscreen]);

// Listen for results
worker.addEventListener('message', (event) => {
  if (event.data.type === 'rendered') {
    console.log('Visualization rendered in worker!');
  }
});
```

### 2. Worker Thread (vega-worker.js)

```javascript
import * as vega from 'vega';
import { offscreenCanvas } from 'vega-canvas';

self.addEventListener('message', async (event) => {
  if (event.data.type === 'init') {
    const { canvas, spec } = event.data;

    // Parse the Vega specification
    const runtime = vega.parse(spec);

    // Create a View with the OffscreenCanvas
    // renderer defaults to 'canvas' when a canvas is provided
    const view = new vega.View(runtime, {
      canvas: canvas  // Pass OffscreenCanvas directly
    });

    // Run the visualization
    await view.runAsync();

    // Notify main thread
    self.postMessage({ type: 'rendered' });
  }
});
```

### 3. HTML (index.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Vega OffscreenCanvas Example</title>
</head>
<body>
  <h1>Vega Rendering in Web Worker</h1>
  <canvas id="myCanvas" width="800" height="600"></canvas>
  <script type="module" src="main.js"></script>
</body>
</html>
```

## Advanced Usage: Label Layout with OffscreenCanvas

When using label transforms in a Web Worker, you need to provide a canvas factory for internal bitmap generation:

```javascript
// In your Vega spec, configure the label transform:
{
  "type": "label",
  "size": [800, 600],
  "canvasFactory": {"expr": "offscreenCanvas"}
}
```

Then register the offscreenCanvas function in your worker:

```javascript
import { offscreenCanvas } from 'vega-canvas';

// Create View with custom expression functions
const view = new vega.View(runtime, {
  canvas: canvas,
  expr: vega.expressionInterpreter({
    offscreenCanvas: offscreenCanvas
  })
});
```

## Image Export from Web Worker

To export images from OffscreenCanvas:

```javascript
// In worker
async function exportImage(view) {
  const canvas = view._renderer.canvas();
  const blob = await canvas.convertToBlob({ type: 'image/png' });

  // Send blob back to main thread
  self.postMessage({
    type: 'image',
    blob: blob
  });
}

// In main thread
worker.addEventListener('message', (event) => {
  if (event.data.type === 'image') {
    const url = URL.createObjectURL(event.data.blob);
    const img = document.createElement('img');
    img.src = url;
    document.body.appendChild(img);
  }
});
```

## Performance Considerations

1. **Transferring Data**: Use `transferable` objects when posting messages to avoid copying large data
2. **Multiple Workers**: Create worker pools for rendering multiple visualizations in parallel
3. **Shared Array Buffers**: For very large datasets, consider using SharedArrayBuffer
4. **Canvas Size**: Larger canvases require more memory; consider rendering at lower resolution in workers

## Browser Compatibility

| Browser | OffscreenCanvas Support | Notes |
|---------|------------------------|-------|
| Chrome  | 69+ | Full support |
| Edge    | 79+ | Full support |
| Firefox | 105+ | Full support |
| Safari  | Not yet | Use feature detection |

## Feature Detection

```javascript
if (typeof OffscreenCanvas !== 'undefined') {
  // Use OffscreenCanvas rendering
  useWorkerRendering();
} else {
  // Fallback to main thread rendering
  useMainThreadRendering();
}
```

## Complete Example

See the [complete example](https://github.com/vega/vega/tree/main/docs/examples/offscreen-canvas) for a working demonstration with multiple visualizations rendered in parallel using worker pools.

## API Reference

### View Options

- `canvas` (OffscreenCanvas): The OffscreenCanvas instance to render to
- `renderer` (string): Set to 'canvas' for OffscreenCanvas rendering

### vega-canvas Functions

- `offscreenCanvas(width, height)`: Creates an OffscreenCanvas instance

### Label Transform

- `canvasFactory` (expr): Expression that returns a canvas factory function for internal bitmap generation

## Troubleshooting

**Q: My worker can't find the canvas context**
A: Ensure you're passing the OffscreenCanvas, not a regular HTMLCanvasElement

**Q: Labels aren't rendering in the worker**
A: Make sure to configure the `canvasFactory` parameter in label transforms

**Q: Performance is worse in the worker**
A: Check that you're using transferable objects and not copying large datasets

## See Also

- [OffscreenCanvas MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)
- [Vega View API](https://vega.github.io/vega/docs/api/view/)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
