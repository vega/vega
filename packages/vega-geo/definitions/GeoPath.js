export default {
  "type": "GeoPath",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection", "required": true },
    { "name": "pointRadius", "type": "number" },
    { "name": "field", "type": "field" },
    { "name": "as", "type": "string", "default": "path" }
  ]
}