export default {
  "type": "Fold",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["key", "value"] }
  ]
};
