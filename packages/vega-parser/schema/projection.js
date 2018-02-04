function orSignal(obj) {
  return {
    "oneOf": [
      {"$ref": "#/refs/signal"},
      obj
    ]
  };
}

export default {
  "defs": {
    "projection": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "type": {"$ref": "#/refs/stringOrSignal"},
        "clipAngle": {"$ref": "#/refs/numberOrSignal"},
        "clipExtent": orSignal({
          "type": "array",
          "items": orSignal({
            "type": "array",
            "items": {"$ref": "#/refs/numberOrSignal"},
            "minItems": 2,
            "maxItems": 2
          })
        }),
        "scale": {"$ref": "#/refs/numberOrSignal"},
        "translate": orSignal({
          "type": "array",
          "items": {"$ref": "#/refs/numberOrSignal"},
          "minItems": 2,
          "maxItems": 2
        }),
        "center": orSignal({
          "type": "array",
          "items": {"$ref": "#/refs/numberOrSignal"},
          "minItems": 2,
          "maxItems": 2
        }),
        "rotate": orSignal({
          "type": "array",
          "items": {"$ref": "#/refs/numberOrSignal"},
          "minItems": 2,
          "maxItems": 3
        }),
        "parallels": orSignal({
          "type": "array",
          "items": {"$ref": "#/refs/numberOrSignal"},
          "minItems": 2,
          "maxItems": 2
        }),
        "precision": {"$ref": "#/refs/numberOrSignal"},
        "pointRadius": {"$ref": "#/refs/numberOrSignal"},
        "fit": {
          "oneOf": [
            {"type": "object"},
            {"type": "array"}
          ]
        },
        "extent": orSignal({
          "type": "array",
          "items": orSignal({
            "type": "array",
            "items": {"$ref": "#/refs/numberOrSignal"},
            "minItems": 2,
            "maxItems": 2
          }),
          "minItems": 2,
          "maxItems": 2
        }),
        "size": orSignal({
          "type": "array",
          "items": {"$ref": "#/refs/numberOrSignal"},
          "minItems": 2,
          "maxItems": 2
        })
      },
      "additionalProperties": true,
      "required": ["name"]
    }
  }
};
