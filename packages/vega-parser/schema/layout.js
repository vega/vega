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
            },
            "bounds": {
              "oneOf": [
                {"enum": ["full", "flush"]},
                {"$ref": "#/refs/signal", "additionalProperties": false}
              ]
            },
            "columns": {"#/refs/numberOrSignal"},
            "padding": {
              "oneOf": [
                {"#/refs/numberOrSignal"},
                {
                  "type": "object",
                  "properties": {
                    "row": {"#/refs/numberOrSignal"},
                    "column": {"#/refs/numberOrSignal"}
                  }
                }
              ]
            },
            "offset": {
              "oneOf": [
                {"#/refs/numberOrSignal"},
                {
                  "type": "object",
                  "properties": {
                    "rowHeader": {"#/refs/numberOrSignal"},
                    "rowFooter": {"#/refs/numberOrSignal"},
                    "rowTitle": {"#/refs/numberOrSignal"},
                    "columnHeader": {"#/refs/numberOrSignal"},
                    "columnFooter": {"#/refs/numberOrSignal"},
                    "columnTitle": {"#/refs/numberOrSignal"}
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
