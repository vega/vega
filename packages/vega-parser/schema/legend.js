export default {
  "defs": {
    "guideEncode": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "interactive": {"type": "boolean", "default": false},
        "style": {"$ref": "#/refs/style"}
      },
      "patternProperties": {
        "^(?!interactive|name|style).+$": {"$ref": "#/defs/encodeEntry"},
      },
      "additionalProperties": false
    },
    "legend": {
      "type": "object",
      "properties": {
        "size":       {"type": "string"},
        "shape":      {"type": "string"},
        "fill":       {"type": "string"},
        "stroke":     {"type": "string"},
        "opacity":    {"type": "string"},
        "strokeDash": {"type": "string"},
        "type": {
          "enum": ["gradient", "symbol"],
          "default": "symbol"
        },
        "orient": {
          "enum": [
            "none",
            "left",
            "right",
            "top",
            "bottom",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right"
          ],
          "default": "right"
        },
        "title": {"$ref": "#/refs/stringOrSignal"},
        "zindex": {"type": "number"},

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

        "tickCount": {"$ref": "#/refs/tickCount"},
        "format": {"$ref": "#/refs/stringOrSignal"},
        "values": {
          "oneOf": [
            {"type": "array"},
            {"$ref": "#/refs/signal"}
          ]
        },

        "encode": {
          "type": "object",
          "properties": {
            "title": {"$ref": "#/defs/guideEncode"},
            "labels": {"$ref": "#/defs/guideEncode"},
            "legend": {"$ref": "#/defs/guideEncode"},
            "symbols": {"$ref": "#/defs/guideEncode"},
            "gradient": {"$ref": "#/defs/guideEncode"}
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
        {"required": ["opacity"]},
        {"required": ["strokeDash"]}
      ]
    }
  }
};
