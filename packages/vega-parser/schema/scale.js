export var timeIntervals = [
  "millisecond",
  "second",
  "minute",
  "hour",
  "day",
  "week",
  "month",
  "year"
];

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
        {"type": "null"},
        {"type": "boolean"},
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
        {"$ref": "#/refs/signal"}
      ]
    },
    "scaleField": {"$ref": "#/refs/stringOrSignal"},
    "scaleInterpolate": {
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
              "items": {"$ref": "#/refs/scaleField"},
              "minItems": 1
            },
            "sort": {
              "oneOf": [
                {"type": "boolean"},
                {
                  "type": "object",
                  "properties": {
                    "op": {"enum": ["count"]},
                    "order": {"$ref": "#/refs/sortOrder"}
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
                  {
                    "type": "array",
                    "items": {
                      "oneOf": [
                        {"type": "string"},
                        {"type": "number"},
                        {"type": "boolean"}
                      ]
                    }
                  },
                  {"$ref": "#/refs/signal"}
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
                    "op": {"enum": ["count"]},
                    "order": {"$ref": "#/refs/sortOrder"}
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
                      {"type": "null"},
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
                },
                "domainImplicit": {"$ref": "#/refs/booleanOrSignal"}
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
              "required": ["type", "range"]
            },
            {
              "properties": {
                "type": {"enum": ["time", "utc"]},
                "range": {"oneOf": schemeRangeDef},
                "clamp": {"$ref": "#/refs/booleanOrSignal"},
                "padding": {"$ref": "#/refs/numberOrSignal"},
                "nice": {
                  "oneOf": [
                    {"type": "boolean"},
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
              "description": "Discretizing scales",
              "properties": {
                "type": {"enum": ["quantile", "quantize", "threshold", "bin-ordinal"]},
                "range": {"oneOf": schemeRangeDef},
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
            },
            {
              "description": "Default numeric scale",
              "not": {
                "properties": {
                  "type": {
                    "enum": [
                      "ordinal", "band", "point",
                      "quantile", "quantize", "threshold",
                      "sequential", "pow", "log", "time", "utc",
                      "identity", "bin-ordinal", "bin-linear"
                    ]
                  }
                },
                "required": ["type"]
              },
              "properties": {
                "range": {"oneOf": schemeRangeDef},
                "interpolate": {"$ref": "#/refs/scaleInterpolate"},
                "clamp": {"$ref": "#/refs/booleanOrSignal"},
                "padding": {"$ref": "#/refs/numberOrSignal"},
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
                "type": {"enum": ["log"]},
                "range": {"oneOf": schemeRangeDef},
                "interpolate": {"$ref": "#/refs/scaleInterpolate"},
                "base": {"$ref": "#/refs/numberOrSignal"},
                "clamp": {"$ref": "#/refs/booleanOrSignal"},
                "padding": {"$ref": "#/refs/numberOrSignal"},
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
            },
            {
              "properties": {
                "type": {"enum": ["pow"]},
                "range": {"oneOf": schemeRangeDef},
                "interpolate": {"$ref": "#/refs/scaleInterpolate"},
                "clamp": {"$ref": "#/refs/booleanOrSignal"},
                "exponent": {"$ref": "#/refs/numberOrSignal"},
                "padding": {"$ref": "#/refs/numberOrSignal"},
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
            },
            {
              "properties": {
                "type": {"enum": ["bin-linear"]},
                "range": {"oneOf": schemeRangeDef},
                "interpolate": {"$ref": "#/refs/scaleInterpolate"}
              },
              "required": ["type"]
            }
          ]
        }
      ]
    }
  }
};
