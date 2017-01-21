export default {
  "defs": {
    "guideEncode": {
      "type": "object",
      "properties": {
        "interactive": {"type": "boolean", "default": false}
      },
      "patternProperties": {
        "^(?!interactive).+$": {"$ref": "#/defs/encodeEntry"},
      },
      "additionalProperties": false
    },
    "legend": {
      "type": "object",
      "properties": {
        "name":    {"type": "string"},
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
          "enum": [
            "none",
            "left",
            "right",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right"
          ],
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

        "tickCount": {
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
        {"required": ["opacity"]}
      ]
    }
  }
};
