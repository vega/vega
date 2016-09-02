export default {
  "defs": {
    "axis": {
      "type": "object",
      "properties": {
        "orient": {"enum": ["top", "bottom", "left", "right"]},
        "scale": {"type": "string"},
        "title": {"type": "string"},
        "zindex": {"type": "number"},
        "interactive": {"type": "boolean"},
        "domain": {"type": "boolean"},
        "grid": {"type": "boolean"},
        "tickSize": {"type": "number"},
        "tickPadding": {"type": "number"},

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

        "offset": {
          "oneOf": [
            {"type": "number"},
            {"$ref": "#/refs/numberValue"}
          ]
        },
        "position": {
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
        "minExtent": {
          "oneOf": [
            {"type": "number"},
            {"$ref": "#/refs/numberValue"}
          ]
        },
        "maxExtent": {
          "oneOf": [
            {"type": "number"},
            {"$ref": "#/refs/numberValue"}
          ]
        },

        "encode": {
          "type": "object",
          "properties": {
            "ticks": {"$ref": "#/defs/guideEncode"},
            "labels": {"$ref": "#/defs/guideEncode"},
            "title": {"$ref": "#/defs/guideEncode"},
            "grid": {"$ref": "#/defs/guideEncode"},
            "axis": {"$ref": "#/defs/guideEncode"}
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false,
      "required": ["orient", "scale"]
    }
  }
};
