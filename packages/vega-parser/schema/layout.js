var align = {
  "oneOf": [
    {"enum": ["all", "each", "none"]},
    {"$ref": "#/refs/signal"}
  ]
};

var band = {
  "oneOf": [
    {"$ref": "#/refs/numberOrSignal"},
    {"type": "null"},
    {
      "type": "object",
      "properties": {
        "row": {"$ref": "#/refs/numberOrSignal"},
        "column": {"$ref": "#/refs/numberOrSignal"}
      },
      "additionalProperties": false
    }
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
                  },
                  "additionalProperties": false
                }
              ]
            },
            "bounds": {
              "oneOf": [
                {"enum": ["full", "flush"]},
                {"$ref": "#/refs/signal"}
              ]
            },
            "columns": {"$ref": "#/refs/numberOrSignal"},
            "padding": {
              "oneOf": [
                {"$ref": "#/refs/numberOrSignal"},
                {
                  "type": "object",
                  "properties": {
                    "row": {"$ref": "#/refs/numberOrSignal"},
                    "column": {"$ref": "#/refs/numberOrSignal"}
                  },
                  "additionalProperties": false
                }
              ]
            },
            "offset": {
              "oneOf": [
                {"$ref": "#/refs/numberOrSignal"},
                {
                  "type": "object",
                  "properties": {
                    "rowHeader": {"$ref": "#/refs/numberOrSignal"},
                    "rowFooter": {"$ref": "#/refs/numberOrSignal"},
                    "rowTitle": {"$ref": "#/refs/numberOrSignal"},
                    "columnHeader": {"$ref": "#/refs/numberOrSignal"},
                    "columnFooter": {"$ref": "#/refs/numberOrSignal"},
                    "columnTitle": {"$ref": "#/refs/numberOrSignal"}
                  },
                  "additionalProperties": false
                }
              ]
            },
            "headerBand": band,
            "footerBand": band,
            "titleBand": band
          }
        },
        {"$ref": "#/refs/signal"}
      ]
    }
  }
};
