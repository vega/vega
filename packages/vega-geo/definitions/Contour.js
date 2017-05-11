export default {
  "type": "Contour",
  "metadata": {"generates": true, "source": true},
  "params": [
    { "name": "size", "type": "number", "array": true, "length": 2, "required": true },
    { "name": "values", "type": "number", "array": true },
    { "name": "x", "type": "field" },
    { "name": "y", "type": "field" },
    { "name": "cellSize", "type": "number" },
    { "name": "bandwidth", "type": "number" },
    { "name": "thresholds", "type": "number" }
  ]
}