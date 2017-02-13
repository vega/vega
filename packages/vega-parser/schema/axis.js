export default {
  "defs": {
    "axis": {
      "type": "object",
      "properties": {
        "orient": {"enum": ["top", "bottom", "left", "right"]},
        "name": {"type": "string"},
        "scale": {"type": "string"},
        "title": {"$ref": "#/refs/stringOrSignal"},
        "zindex": {"type": "number"},
        "interactive": {"type": "boolean"},
        "ticks": {"type": "boolean"},
        "labels": {"type": "boolean"},
        "domain": {"type": "boolean"},
        "grid": {"type": "boolean"},
        "gridScale": {"type": "string"},
        "tickSize": {"type": "number"},
        "labelPadding": {"type": "number"},

        "tickCount": {"$ref": "#/refs/numberOrSignal"},
        "format": {"$ref": "#/refs/stringOrSignal"},
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
            "domain": {"$ref": "#/defs/guideEncode"}
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false,
      "required": ["orient", "scale"]
    }
  }
};
