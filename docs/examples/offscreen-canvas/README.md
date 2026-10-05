# OffscreenCanvas Example

A working example of Vega rendering in a Web Worker via [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas). The chart uses the label transform deliberately: label collision detection creates canvases internally, so it demonstrates that transforms which depend on a canvas also work inside a worker.

See [OffscreenCanvas Support](../../offscreen-canvas-support.md) for the API documentation.

Files:

- `labeled-line-chart.html` - example page
- `main.js` - main thread code (creates the worker, transfers the canvas)
- `worker.js` - worker code (parses the spec and renders)
- `spec.json` - the chart specification, using the `driving.json` demo dataset

## Running

Serve the repository root over HTTP (the example loads Vega from `packages/vega/build/`, so build first with `npm run build`), for example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/docs/examples/offscreen-canvas/labeled-line-chart.html`. For production use, load Vega from a CDN instead, e.g. `https://cdn.jsdelivr.net/npm/vega@6`.

## Label transform pattern

Text marks read from the named symbol mark (not the raw data source) so they inherit x/y positions; the label transform then adjusts them for collision avoidance:

```js
{
  "name": "points",
  "type": "symbol",
  "from": {"data": "driving"},
  ...
},
{
  "type": "text",
  "from": {"data": "points"},
  "encode": {
    "enter": {
      "text": {"field": "datum.year"},
      "fontSize": {"value": 10}
    }
  },
  "transform": [
    {
      "type": "label",
      "size": [700, 400],
      "anchor": ["top", "bottom", "left", "right"],
      "avoidMarks": ["line"]
    }
  ]
}
```
