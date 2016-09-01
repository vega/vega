export default {
  "refs": {
    "signal": {
      "title": "SignalRef",
      "type": "object",
      "properties": {
        "signal": {"type": "string"}
      },
      "required": ["signal"]
    }
  },

  "defs": {
    "signal": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "not": {"enum": ["parent"]}
        },
        "value": {},
        "react": {"type": "boolean", "default": true},
        "update": {"$ref": "#/defs/exprString"},
        "on": {"$ref": "#/defs/onEvents"}
      },
      "additionalProperties": false,
      "required": ["name"]
    }
  }
};
