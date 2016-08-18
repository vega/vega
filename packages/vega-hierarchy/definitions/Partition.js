export default {
  "type": "Partition",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "padding", "type": "number", "default": 0 },
    { "name": "round", "type": "boolean", "default": false },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 4, "default": ["x0", "y0", "x1", "y1", "depth", "children"] }
  ]
};
