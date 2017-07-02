export default {
  "type": "Impute",
  "metadata": {"changes": true},
  "params": [
    { "name": "field", "type": "field", "required": true },
    { "name": "key", "type": "field", "required": true },
    { "name": "keyvals", "array": true },
    { "name": "groupby", "type": "field", "array": true },
    { "name": "method", "type": "enum", "default": "value",
      "values": ["value", "mean", "median", "max", "min"] },
    { "name": "value", "default": 0 }
  ]
};
