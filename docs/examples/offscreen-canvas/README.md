# OffscreenCanvas Examples

This directory contains working examples demonstrating how to use Vega with OffscreenCanvas in Web Workers.

## Examples

### Labeled Line Chart (`labeled-line-chart.html`)

A complete working example showing:
- Rendering a line chart with 52 data points in a Web Worker
- Using the label transform with collision detection
- Intelligent label placement that avoids overlapping marks
- Symbol marks (points) and line marks with proper collision avoidance

**Features demonstrated:**
- ✅ OffscreenCanvas rendering in Web Worker
- ✅ Label transform with `avoidMarks` parameter
- ✅ Text marks reading from symbol mark data
- ✅ Collision detection using internal canvas bitmaps
- ✅ Automatic positioning with multiple anchor points

**Files:**
- `labeled-line-chart.html` - Main HTML page
- `main.js` - Main thread code (creates worker, transfers canvas)
- `worker.js` - Worker thread code (runs Vega rendering)

## Running the Examples

### Option 1: Local HTTP Server

```bash
# From the repository root
cd docs/examples/offscreen-canvas
python3 -m http.server 8080
```

Then open: `http://localhost:8080/labeled-line-chart.html`

### Option 2: VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `labeled-line-chart.html`
3. Select "Open with Live Server"

## Important Notes

### Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 69+     | ✅ Full |
| Edge    | 79+     | ✅ Full |
| Firefox | 105+    | ✅ Full |
| Safari  | 16.4+   | ✅ Full |

### Label Transform Usage

When using the label transform with OffscreenCanvas, follow this pattern:

```javascript
{
  name: "points",
  type: "symbol",
  from: { data: "table" },
  encode: {
    enter: {
      x: { scale: "x", field: "xField" },
      y: { scale: "y", field: "yField" }
    }
  }
},
{
  type: "text",
  from: { data: "points" },  // Read from symbol marks, not raw data
  encode: {
    enter: {
      text: { field: "datum.label" },
      fontSize: { value: 9 }
    }
  },
  transform: [
    {
      type: "label",
      size: [width, height],
      avoidMarks: ["lineMark"],
      anchor: ["top", "bottom", "left", "right"],
      offset: [1]
    }
  ]
}
```

**Key points:**
- Text marks should read `from: { data: "points" }` (the symbol mark name), not from the original data source
- This allows text marks to inherit x/y positions from the symbols
- The label transform then adjusts positions for collision avoidance
- No need to specify custom `as` parameter or use `update` encoding

### Path Configuration

The examples reference Vega from the built bundle:

```javascript
const vegaPath = "/packages/vega/build/vega.js";
```

You may need to adjust this path based on your server setup:
- **Local development**: `/packages/vega/build/vega.js` (from repo root)
- **Production**: Use a CDN like `https://cdn.jsdelivr.net/npm/vega@6`

## Troubleshooting

### Canvas is blank
- Check browser console for errors
- Verify OffscreenCanvas is supported: `typeof OffscreenCanvas !== 'undefined'`
- Ensure worker is loading correctly
- Check that Vega bundle path is correct

### Labels not appearing
- Verify text mark reads `from: { data: "symbolMarkName" }`
- Check that symbol marks are named (e.g., `name: "points"`)
- Ensure label transform has correct `size` parameter
- Review console for transform errors

### Labels overlapping marks
- Verify `avoidMarks` parameter references correct mark names
- Ensure marks are rendering before label transform runs
- Check that marks have proper bounds computed
- Increase `padding` parameter for more spacing

## Additional Resources

- [OffscreenCanvas Support Documentation](../../offscreen-canvas-support.md)
- [Label Transform Documentation](https://vega.github.io/vega/docs/transforms/label/)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [OffscreenCanvas API](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)
