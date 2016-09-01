export default {
  "defs": {
    "legend": {
      "type": "object",
      "properties": {
        "size":    {"type": "string"},
        "shape":   {"type": "string"},
        "fill":    {"type": "string"},
        "stroke":  {"type": "string"},
        "opacity": {"type": "string"},
        "type": {
          "enum": ["gradient", "symbol"],
          "default": "symbol"
        },
        "orient": {
          "enum": ["left", "right"],
          "default": "right"
        },
        "title": {"type": "string"},
        "zindex": {"type": "number"},
        "interactive": {"type": "boolean"},

        "offset": {
          "oneOf": [
            {"type": "number"},
            {"$ref": "#/refs/numberValue"}
          ]
        },
        "padding": {
          "oneOf": [
            {"type": "number"},
            {"$ref": "#/refs/numberValue"}
          ]
        },
        "titlePadding": {
          "oneOf": [
            {"type": "number"},
            {"$ref": "#/refs/numberValue"}
          ]
        },
        "entryPadding": {
          "oneOf": [
            {"type": "number"},
            {"$ref": "#/refs/numberValue"}
          ]
        },

        "count": {
          "oneOf": [
            {"type": "number"},
            {"$ref": "#/refs/signal"}
          ]
        },
        "format": {
          "oneOf": [
            {"type": "string"},
            {"$ref": "#/refs/signal"}
          ]
        },
        "values": {
          "oneOf": [
            {"type": "array"},
            {"$ref": "#/refs/signal"}
          ]
        },

        "encode": {
          "type": "object",
          "properties": {
            "title": {"$ref": "#/defs/encode"},
            "labels": {"$ref": "#/defs/encode"},
            "legend": {"$ref": "#/defs/encode"},
            "symbols": {"$ref": "#/defs/encode"},
            "gradient": {"$ref": "#/defs/encode"}
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false,
      "anyOf": [
        {"required": ["size"]},
        {"required": ["shape"]},
        {"required": ["fill"]},
        {"required": ["stroke"]},
        {"required": ["opacity"]}
      ]
    }
  }
};
