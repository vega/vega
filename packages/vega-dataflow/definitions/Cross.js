export default {
  "type": "Cross",
  "metadata": {"source": true, "generates": true, "changes": true},
  "params": [
    { "name": "filter", "type": "expr" },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["a", "b"] }
  ]
};
