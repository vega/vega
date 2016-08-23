export default {
  "type": "CrossFilter",
  "metadata": {},
  "params": [
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "query", "type": "array", "array": true, "required": true,
      "content": {"type": "number", "array": true, "length": 2} }
  ]
};
