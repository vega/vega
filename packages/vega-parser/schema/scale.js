var rangeDef = [
  {
    "enum": [
      "width",
      "height",
      "symbol",
      "category",
      "ordinal",
      "ramp",
      "diverging",
      "heatmap"
    ]
  },
  {
    "type": "array",
    "items": {
      "oneOf": [
        {"type": "string"},
        {"type": "number"},
        {"$ref": "#/refs/signal"}
      ]
    }
  },
  {"$ref": "#/refs/signal"}
];

var schemeRangeDef = rangeDef.concat([
  {
    "type": "object",
    "properties": {
      "scheme": {"$ref": "#/refs/stringOrSignal"},
      "count": {"$ref": "#/refs/numberOrSignal"},
      "extent": {
        "oneOf": [
          {
            "type": "array",
            "items": {"$ref": "#/refs/numberOrSignal"},
            "numItems": 2
          },
          {"$ref": "#/refs/signal"}
        ]
      }
    },
    "required": ["scheme"],
    "additionalProperties": false
  }
]);

var bandRangeDef = rangeDef.concat([
  {
    "type": "object",
    "properties": {
      "step": {"$ref": "#/refs/numberOrSignal"}
    },
    "required": ["step"],
    "additionalProperties": false
  }
]);

export default {
  "refs": {
    "sortOrder": {
      "oneOf": [
        {"enum": ["ascending", "descending"]},
        {"$ref": "#/refs/signal", "additionalProperties": false}
      ]
    },
    "scaleField": {"$ref": "#/refs/stringOrSignal"},
    "scaleData": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "data": {"type": "string"},
            "field": {"$ref": "#/refs/scaleField"},
            "sort": {
              "oneOf": [
                {"type": "boolean"},
                {
                  "type": "object",
                  "properties": {
                    "field": {"$ref": "#/refs/scaleField"},
                    "op": {"$ref": "#/refs/scaleField"},
                    "order": {"$ref": "#/refs/sortOrder"}
                  },
                  "additionalProperties": false,
                }
              ]
            }
          },
          "required": ["data", "field"],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "data": {"type": "string"},
            "fields": {
              "type": "array",
              "items": {
                "oneOf": [
                  {
                    "type": "object",
                    "properties": {
                      "data": {"type": "string"},
                      "field": {"$ref": "#/refs/scaleField"},
                    },
                    "required": ["field"],
                    "additionalProperties": false
                  },
                  {"$ref": "#/refs/scaleField"}
                ]
              },
              "minItems": 1
            },
            "sort": {
              "oneOf": [
                {"type": "boolean"},
                {
                  "type": "object",
                  "properties": {
                    "op": {"enum": ["count"]}
                  },
                  "additionalProperties": false,
                }
              ]
            }
          },
          "required": ["data", "fields"],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "fields": {
              "type": "array",
              "items": {
                "oneOf": [
                  {
                    "type": "object",
                    "properties": {
                      "data": {"type": "string"},
                      "field": {"$ref": "#/refs/scaleField"},
                    },
                    "required": ["data", "field"],
                    "additionalProperties": false
                  },
                  {"$ref": "#/refs/scaleField"}
                ]
              },
              "minItems": 1
            },
            "sort": {
              "oneOf": [
                {"type": "boolean"},
                {
                  "type": "object",
                  "properties": {
                    "op": {"enum": ["count"]}
                  },
                  "additionalProperties": false,
                }
              ]
            }
          },
          "required": ["fields"],
          "additionalProperties": false
        }
      ]
    }
  },

  "defs": {
    "scale": {
      "title": "Scale mapping",
      "type": "object",

      "allOf": [
        {
          "properties": {
            "name": {"type": "string"},
            "type": {"type": "string", "default": "linear"},
            "domain": {
              "oneOf": [
                {
                  "type": "array",
                  "items": {
                    "oneOf": [
                      {"type": "string"},
                      {"type": "number"},
                      {"type": "boolean"},
                      {"$ref": "#/refs/signal"}
                    ]
                  }
                },
                {"$ref": "#/refs/scaleData"},
                {"$ref": "#/refs/signal"}
              ]
            },
            "domainMin": {"$ref": "#/refs/numberOrSignal"},
            "domainMax": {"$ref": "#/refs/numberOrSignal"},
            "domainMid": {"$ref": "#/refs/numberOrSignal"},
            "domainRaw": {
              "oneOf": [
                {"type": "null"},
                {"type": "array"},
                {"$ref": "#/refs/signal"}
              ]
            },
            "reverse": {"$ref": "#/refs/booleanOrSignal"},
            "round": {"$ref": "#/refs/booleanOrSignal"}
          },
          "required": ["name"]
        },
        {
          "oneOf": [
            {
              "properties": {
                "type": {"enum": ["ordinal"]},
                "range": {
                  "oneOf": schemeRangeDef.concat({"$ref": "#/refs/scaleData"})
                }
              },
              "required": ["type"]
            },
            {
              "properties": {
                "type": {"enum": ["band"]},
                "range": {"oneOf": bandRangeDef},
                "padding": {"$ref": "#/refs/numberOrSignal"},
                "paddingInner": {"$ref": "#/refs/numberOrSignal"},
                "paddingOuter": {"$ref": "#/refs/numberOrSignal"},
                "align": {"$ref": "#/refs/numberOrSignal"}
              },
              "required": ["type"]
            },
            {
              "properties": {
                "type": {"enum": ["point"]},
                "range": {"oneOf": bandRangeDef},
                "padding": {"$ref": "#/refs/numberOrSignal"},
                "paddingOuter": {"$ref": "#/refs/numberOrSignal"},
                "align": {"$ref": "#/refs/numberOrSignal"}
              },
              "required": ["type"]
            },
            {
              "properties": {
                "type": {"enum": ["sequential"]},
                "range": {"oneOf": schemeRangeDef},
                "clamp": {"$ref": "#/refs/booleanOrSignal"}
              },
              "required": ["type"]
            },
            {
              "properties": {
                "type": {"enum": ["time", "utc"]},
                "range": {"oneOf": schemeRangeDef},
                "clamp": {"$ref": "#/refs/booleanOrSignal"},
                "nice": {
                  "oneOf": [
                    {"type": "boolean"},
                    {"enum": ["second", "minute", "hour", "day", "week", "month", "year"]},
                    {"$ref": "#/refs/signal"}
                  ]
                }
              },
              "required": ["type"]
            },
            {
              "properties": {
                "type": {"enum": ["identity"]},
                "nice": {"$ref": "#/refs/booleanOrSignal"}
              },
              "required": ["type"]
            },
            {
              "properties": {
                "type": {"enum": ["quantile", "quantize", "threshold"]},
                "range": {"oneOf": schemeRangeDef}
              },
              "required": ["type"]
            },
            {
              "description": "Default numeric scale",
              "not": {
                "properties": {
                  "type": {
                    "enum": [
                      "ordinal", "index", "band", "point",
                      "quantile", "quantize", "threshold",
                      "sequential", "pow", "time", "utc",
                      "identity"
                    ]
                  }
                },
                "required": ["type"]
              },
              "properties": {
                "range": {"oneOf": schemeRangeDef},
                "interpolate": {
                  "oneOf": [
                    {"type": "string"},
                    {"$ref": "#/refs/signal"},
                    {
                      "type": "object",
                      "properties": {
                        "type": {"$ref": "#/refs/stringOrSignal"},
                        "gamma": {"$ref": "#/refs/numberOrSignal"}
                      },
                      "required": ["type"]
                    }
                  ]
                },
                "clamp": {"$ref": "#/refs/booleanOrSignal"},
                "nice": {
                  "oneOf": [
                    {"type": "boolean"},
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
                "zero": {"$ref": "#/refs/booleanOrSignal"}
              }
            },
            {
              "properties": {
                "type": {"enum": ["pow"]},
                "range": {"oneOf": schemeRangeDef},
                "clamp": {"$ref": "#/refs/booleanOrSignal"},
                "exponent": {"$ref": "#/refs/numberOrSignal"},
                "nice": {
                  "oneOf": [
                    {"type": "boolean"},
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
                "zero": {"$ref": "#/refs/booleanOrSignal"}
              },
              "required": ["type"]
            }
          ]
        }
      ]
    }
  }
};
