# OffscreenCanvas Support in Vega

## Overview

Vega now supports rendering with OffscreenCanvas, enabling visualization rendering in Web Workers for improved performance through multi-threading.

## What is OffscreenCanvas?

OffscreenCanvas is a browser API that provides a canvas which can be rendered off screen, particularly in Web Workers. This allows expensive rendering operations to run in background threads without blocking the main UI thread.

## Benefits

1. **Non-blocking rendering**: Heavy visualizations don't freeze the UI
2. **Parallel processing**: Render multiple visualizations simultaneously in different workers
3. **Better responsiveness**: Main thread remains free for user interactions
4. **Scalability**: Distribute rendering workload across multiple CPU cores

## Quick Start

### Basic Usage

```javascript
// In Web Worker
import * as vega from 'vega';

self.addEventListener('message', async (event) => {
  const { canvas, spec } = event.data;

  const runtime = vega.parse(spec);
  const view = new vega.View(runtime, {
    canvas: canvas,  // OffscreenCanvas instance
    renderer: 'canvas'
  });

  await view.runAsync();
});
```

```javascript
// In Main Thread
const canvas = document.getElementById('myCanvas');
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker('vega-worker.js', { type: 'module' });

worker.postMessage({
  canvas: offscreen,
  spec: myVegaSpec
}, [offscreen]);
```

## Package Changes

### vega-canvas (v2.0.0+)

**New Functions:**
- `offscreenCanvas(width, height)` - Creates an OffscreenCanvas instance

**Updated Type Definitions:**
- `canvas()` return type now includes `OffscreenCanvas | null`

### vega-scenegraph (v5.1.0+)

**CanvasRenderer:**
- Accepts OffscreenCanvas via `options.canvas` parameter
- Skips DOM operations (appendChild, style) for OffscreenCanvas
- Handles resize without CSS style properties

**CanvasHandler:**
- Accepts OffscreenCanvas via `obj.canvas` parameter
- Skips DOM event listener registration for OffscreenCanvas
- Works without DOM element (null el parameter)

### vega-view (v5.11.0+)

**View Constructor:**
- New `options.canvas` parameter accepts OffscreenCanvas
- Automatically configures renderer and handler for OffscreenCanvas

**Image Export:**
- `toImageURL()` method supports OffscreenCanvas via `convertToBlob()`
- Returns blob URL instead of data URL for OffscreenCanvas

### vega-label (v2.1.0+)

**Label Transform:**
- Works automatically with OffscreenCanvas in Web Workers
- Internal bitmap canvases use `vega-canvas` fallback (domCanvas → OffscreenCanvas → nodeCanvas)
- No configuration needed - collision detection works out of the box

## API Documentation

### View Options

```typescript
interface ViewOptions {
  canvas?: OffscreenCanvas | HTMLCanvasElement;
  renderer?: 'canvas' | 'svg' | 'none';
  // ... other options
}
```

**Example:**
```javascript
const view = new vega.View(runtime, {
  canvas: myOffscreenCanvas,
  renderer: 'canvas'
});
```

### Canvas Renderer Options

```typescript
interface CanvasRendererOptions {
  canvas?: OffscreenCanvas | HTMLCanvasElement;
  externalContext?: CanvasRenderingContext2D;  // backward compat
  type?: 'pdf' | 'svg';
}
```

**Example:**
```javascript
renderer.initialize(null, 800, 600, [0, 0], 1.0, {
  canvas: myOffscreenCanvas
});
```

### Label Transform with OffscreenCanvas

The label transform works automatically with OffscreenCanvas - no special configuration needed:

```json
{
  "type": "text",
  "from": {"data": "points"},
  "encode": {
    "enter": {
      "text": {"field": "datum.label"},
      "fontSize": {"value": 9}
    }
  },
  "transform": [
    {
      "type": "label",
      "size": [800, 600],
      "anchor": ["top", "bottom", "left", "right"],
      "offset": [1],
      "avoidMarks": ["trend"]
    }
  ]
}
```

**Important**: Text marks should read `from: {"data": "symbolMarkName"}` to inherit positions from symbol marks, then the label transform adjusts for collision avoidance.

## Migration Guide

### From Regular Canvas to OffscreenCanvas

**Before:**
```javascript
const view = new vega.View(runtime, {
  renderer: 'canvas'
});
view.initialize('#myDiv');
```

**After (Web Worker):**
```javascript
// Main thread
const canvas = document.getElementById('myCanvas');
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen, spec }, [offscreen]);

// Worker thread
const view = new vega.View(runtime, {
  canvas: event.data.canvas,
  renderer: 'canvas'
});
await view.runAsync();
```

### Image Export

**Before:**
```javascript
const url = await view.toImageURL('png');
```

**After (works with both):**
```javascript
// Automatically handles OffscreenCanvas.convertToBlob()
// or HTMLCanvasElement.toDataURL()
const url = await view.toImageURL('png');
```

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 69+     | ✅ Full |
| Edge    | 79+     | ✅ Full |
| Firefox | 105+    | ✅ Full |
| Safari  | -       | ❌ Not yet |

**Feature Detection:**
```javascript
if (typeof OffscreenCanvas !== 'undefined') {
  // Use OffscreenCanvas
} else {
  // Fallback to main thread
}
```

## Performance Tips

1. **Transfer, don't copy**: Use transferable objects in `postMessage()`
2. **Worker pools**: Create multiple workers for parallel rendering
3. **Batch updates**: Send multiple spec updates in one message
4. **Canvas size**: Smaller canvases = less memory, faster rendering
5. **Data transfer**: Use SharedArrayBuffer for large datasets

## Limitations

1. **No DOM access**: Workers can't access document or window
2. **Event handling**: Mouse/touch events must be proxied from main thread
3. **Browser support**: Not available in Safari (as of 2025)
4. **Debugging**: Worker debugging can be more complex

## Examples

- [Labeled Line Chart with Worker](./examples/offscreen-canvas/README.md) - Complete working example with label transform and collision detection

## Testing

Run tests to verify OffscreenCanvas support:

```bash
npm test -- --workspace=vega-scenegraph
```

Key test files:
- `packages/vega-scenegraph/test/canvas-offscreen-test.js`
- `packages/vega-scenegraph/test/canvas-handler-offscreen-test.js`

## See Also

- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [OffscreenCanvas API](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)
- [Vega View API](https://vega.github.io/vega/docs/api/view/)
- [Vega Transforms](https://vega.github.io/vega/docs/transforms/)
