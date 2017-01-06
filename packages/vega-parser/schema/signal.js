export default {
  "refs": {
    "signal": {
      "title": "SignalRef",
      "type": "object",
      "properties": {
        "signal": {"type": "string"}
      },
      "required": ["signal"]
    },
    "numberOrSignal": {
      "oneOf": [
        {"type": "number"},
        {"$ref": "#/refs/signal", "additionalProperties": false}
      ]
    },
    "stringOrSignal": {
      "oneOf": [
        {"type": "string"},
        {"$ref": "#/refs/signal", "additionalProperties": false}
      ]
    }
  },

  "defs": {
    "signal": {
      "oneOf": [
        {"$ref": "#/defs/signalOuter"},
        {"$ref": "#/defs/signalNew"}
      ]
    },
    "signalName": {
      "type": "string",
      "not": {"enum": ["parent"]}
    },
    "signalNew": {
      "type": "object",
      "properties": {
        "name": {"$ref": "#/defs/signalName"},
        "description": {"type": "string"},
        "value": {},
        "react": {"type": "boolean", "default": true},
        "update": {"$ref": "#/refs/exprString"},
        "on": {"$ref": "#/defs/onEvents"},
        "bind": {"$ref": "#/defs/bind"}
      },
      "additionalProperties": false,
      "required": ["name"]
    },
    "signalOuter": {
      "type": "object",
      "properties": {
        "name": {"$ref": "#/defs/signalName"},
        "outer": {"enum": [true]},
        "description": {"type": "string"},
        "on": {"$ref": "#/defs/onEvents"}
      },
      "additionalProperties": false,
      "required": ["name", "outer"]
    }
  }
};
