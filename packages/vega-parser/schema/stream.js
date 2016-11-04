export default {
  "defs": {
    "streamParams": {
      "properties": {
        "between": {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": {"$ref": "#/defs/stream"}
        },
        "marktype": {"type": "string"},
        "markname": {"type": "string"},
        "filter": {
          "oneOf": [
            {"$ref": "#/refs/exprString"},
            {
              "type": "array",
              "minItems": 1,
              "items": {"$ref": "#/refs/exprString"},
            }
          ]
        },
        "throttle": {"type": "number"},
        "debounce": {"type": "number"},
        "consume": {"type": "boolean"}
      }
    },
    "streamEvents": {
      "properties": {
        "source": {"type": "string"},
        "type": {"type": "string"}
      },
      "required": ["type"]
    },
    "stream": {
      "title": "Input event stream definition",
      "type": "object",
      "allOf": [
        {"$ref": "#/defs/streamParams"},
        {
          "oneOf": [
            {"$ref": "#/defs/streamEvents"},
            {
              "type": "object",
              "properties": {
                "stream": {"$ref": "#/defs/stream"}
              },
              "required": ["stream"]
            },
            {
              "type": "object",
              "properties": {
                "merge": {
                  "type": "array",
                  "minItems": 1,
                  "items": {"$ref": "#/defs/stream"}
                }
              },
              "required": ["merge"]
            }
          ]
        }
      ]
    }
  }
};
