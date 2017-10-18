import {timeIntervals} from './scale';

export default {
  "refs": {
    "tickCount": {
      "oneOf": [
        {"type": "number"},
        {"type": "string", "enum": timeIntervals},
        {
          "type": "object",
          "properties": {
            "interval": {
              "oneOf": [
                {"type": "string", "enum": timeIntervals},
                {"$ref": "#/refs/signal"}
              ]
            },
            "step": {"$ref": "#/refs/numberOrSignal"}
          },
          "required": ["interval"]
        },
        {"$ref": "#/refs/signal"}
      ]
    }
  },
  "defs": {
    "axis": {
      "type": "object",
      "properties": {
        "orient": {"enum": ["top", "bottom", "left", "right"]},
        "scale": {"type": "string"},
        "title": {"$ref": "#/refs/stringOrSignal"},
        "zindex": {"type": "number"},
        "ticks": {"type": "boolean"},
        "labels": {"type": "boolean"},
        "domain": {"type": "boolean"},
        "grid": {"type": "boolean"},
        "gridScale": {"type": "string"},
        "tickSize": {"type": "number"},
        "labelPadding": {"type": "number"},
        "labelFlush": {
          "oneOf": [
            {"type": "boolean"},
            {"type": "number"}
          ]
        },
        "labelFlushOffset": {"type": "number"},
        "labelOverlap": {
          "oneOf": [
            {"type": "boolean"},
            {"enum": ["parity", "greedy"], "type": "string"}
          ]
        },
        "labelBound": {
          "oneOf": [
            {"type": "boolean"},
            {"type": "number"}
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
            "axis": {"$ref": "#/defs/guideEncode"},
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
