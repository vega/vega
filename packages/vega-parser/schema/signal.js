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
    "arrayOrSignal": {
      "oneOf": [
        {"type": "array"},
        {"$ref": "#/refs/signal"}
      ]
    },
    "booleanOrSignal": {
      "oneOf": [
        {"type": "boolean"},
        {"$ref": "#/refs/signal"}
      ]
    },
    "numberOrSignal": {
      "oneOf": [
        {"type": "number"},
        {"$ref": "#/refs/signal"}
      ]
    },
    "stringOrSignal": {
      "oneOf": [
        {"type": "string"},
        {"$ref": "#/refs/signal"}
      ]
    }
  },

  "defs": {
    "signal": {
      "oneOf": [
        {"$ref": "#/defs/signalPush"},
        {"$ref": "#/defs/signalNew"},
        {"$ref": "#/defs/signalInit"}
      ]
    },
    "signalName": {
      "type": "string",
      "not": {"enum": ["parent", "datum", "event", "item"]}
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
    "signalInit": {
      "type": "object",
      "properties": {
        "name": {"$ref": "#/defs/signalName"},
        "description": {"type": "string"},
        "value": {},
        "init": {"$ref": "#/refs/exprString"},
        "on": {"$ref": "#/defs/onEvents"},
        "bind": {"$ref": "#/defs/bind"}
      },
      "additionalProperties": false,
      "required": ["name", "init"]
    },
    "signalPush": {
      "type": "object",
      "properties": {
        "name": {"$ref": "#/defs/signalName"},
        "push": {"enum": ["outer"]},
        "description": {"type": "string"},
        "on": {"$ref": "#/defs/onEvents"}
      },
      "additionalProperties": false,
      "required": ["name", "push"]
    }
  }
};
