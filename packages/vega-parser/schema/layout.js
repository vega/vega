var align = {
  "oneOf": [
    {"enum": ["all", "each", "none"]},
    {"$ref": "#/refs/signal", "additionalProperties": false}
  ]
};

export default {
  "defs": {
    "layout": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "columns": {"#/refs/numberOrSignal"},
            "padding": {
              "oneOf": [
                {"#/refs/numberOrSignal"},
                {
                  "type": "object",
                  "properties": {
                    "row": {"#/refs/numberOrSignal"},
                    "column": {"#/refs/numberOrSignal"},
                    "header": {"#/refs/numberOrSignal"}
                  }
                }
              ]
            },
            "bounds": {
              "oneOf": [
                {"enum": ["full", "flush"]},
                {"$ref": "#/refs/signal", "additionalProperties": false}
              ]
            },
            "align": {
              "oneOf": [
                align,
                {
                  "type": "object",
                  "properties": {
                    "row": align,
                    "column": align
                  }
                }
              ]
            }
          }
        },
        {"$ref": "#/refs/signal", "additionalProperties": false}
      ]
    }
  }
};
