export default {
  "type": "LinkPath",
  "metadata": {"modifies": true},
  "params": [
    { "name": "sourceX", "type": "field", "default": "source.x" },
    { "name": "sourceY", "type": "field", "default": "source.y" },
    { "name": "targetX", "type": "field", "default": "target.x" },
    { "name": "targetY", "type": "field", "default": "target.y" },
    { "name": "orient", "type": "enum", "default": "vertical",
      "values": ["horizontal", "vertical", "radial"] },
    { "name": "shape", "type": "enum", "default": "line",
      "values": ["line", "arc", "curve", "diagonal", "orthogonal"] },
    { "name": "as", "type": "string", "default": "path" }
  ]
};
