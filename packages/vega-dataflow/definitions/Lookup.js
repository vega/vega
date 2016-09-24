export default {
  "type": "Lookup",
  "metadata": {"modifies": true},
  "params": [
    { "name": "index", "type": "index", "params": [
        {"name": "from", "type": "data", "required": true },
        {"name": "key", "type": "field", "required": true }
      ] },
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "as", "type": "string", "array": true, "required": true },
    { "name": "default", "default": null }
  ]
};
