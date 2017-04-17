export default {
  "defs": {
    "scope": {
      "type": "object",
      "properties": {
        "encode": {"$ref": "#/defs/encode"},
        "layout": {"$ref": "#/defs/layout"},
        "signals": {
          "type": "array",
          "items": {"$ref": "#/defs/signal"}
        },
        "data": {
          "type": "array",
          "items": {"$ref": "#/defs/data"}
        },
        "scales": {
          "type": "array",
          "items": {"$ref": "#/defs/scale"}
        },
        "projections": {
          "type": "array",
          "items": {"$ref": "#/defs/projection"}
        },
        "axes": {
          "type": "array",
          "items": {"$ref": "#/defs/axis"}
        },
        "legends": {
          "type": "array",
          "items": {"$ref": "#/defs/legend"}
        },
        "title": {"$ref": "#/defs/title"},
        "marks": {
          "type": "array",
          "items": {
            "oneOf": [
              {"$ref": "#/defs/markGroup"},
              {"$ref": "#/defs/markVisual"}
            ]
          }
        }
      }
    }
  }
};
