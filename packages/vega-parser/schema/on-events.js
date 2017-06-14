export default {
  "defs": {
    "listener": {
      "oneOf": [
        {"$ref": "#/refs/signal"},
        {
          "type": "object",
          "properties": {
            "scale": {"type": "string"}
          },
          "required": ["scale"]
        },
        {"$ref": "#/defs/stream"}
      ]
    },

    "onEvents": {
      "type": "array",
      "items": {
        "allOf": [
          {
            "type": "object",
            "properties": {
              "events": {
                "oneOf": [
                  {"$ref": "#/refs/selector"},
                  {"$ref": "#/defs/listener"},
                  {
                    "type": "array",
                    "minItems": 1,
                    "items": {"$ref": "#/defs/listener"}
                  }
                ]
              },
              "force": {"type": "boolean"}
            },
            "required": ["events"]
          },
          {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "encode": {"type": "string"}
                },
                "required": ["encode"]
              },
              {
                "type": "object",
                "properties": {
                  "update": {
                    "oneOf": [
                      {"$ref": "#/refs/exprString"},
                      {"$ref": "#/refs/expr"},
                      {"$ref": "#/refs/signal"},
                      {
                        "type": "object",
                        "properties": {"value": {}},
                        "required": ["value"]
                      }
                    ]
                  }
                },
                "required": ["update"]
              }
            ]
          }
        ]
      }
    }
  }
};
