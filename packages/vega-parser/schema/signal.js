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
        "description": {"type": "string"},
        "value": {},
        "react": {"type": "boolean", "default": true},
        "update": {"$ref": "#/refs/exprString"},
        "on": {"$ref": "#/defs/onEvents"},
        "bind": {"$ref": "#/defs/bind"}
      },
      "additionalProperties": false,
      "required": ["name"]
    }
  }
};
