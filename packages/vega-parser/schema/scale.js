var rangeDef = [
  {
    "enum": [
      "width",
      "height",
      "shapes",
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
  {
    "type": "object",
    "properties": {
      "scheme": {"$ref": "#/refs/scaleScheme"},
      "extent": {"$ref": "#/refs/scaleSchemeExtent"},
      "count": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]}
    },
    "required": ["scheme"]
  },
  {"$ref": "#/refs/signal"}
];

export default {
  "refs": {
    "sortOrder": {
      "oneOf": [
        {"enum": ["ascending", "descending"]},
        {"$ref": "#/refs/signal", "additionalProperties": false}
      ]
    },
    "scaleField": {
      "oneOf": [
        {"type": "string"},
        {"$ref": "#/refs/signal", "additionalProperties": false}
      ]
    },
    "scaleScheme": {
      "oneOf": [
        {"type": "string"},
        {"$ref": "#/refs/signal", "additionalProperties": false}
      ]
    },
    "scaleSchemeExtent": {
      "oneOf": [
        {
          "type": "array",
          "items": {
            "oneOf": [
              {"type": "number"},
              {"$ref": "#/refs/signal"}
            ]
          },
          "numItems": 2
        },
        {"$ref": "#/refs/signal"}
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
            "domainMin": {
              "oneOf": [
                {"type": "number"},
                {"$ref": "#/refs/signal"}
              ]
            },
            "domainMax": {
              "oneOf": [
                {"type": "number"},
                {"$ref": "#/refs/signal"}
              ]
            },
            "domainMid": {
              "oneOf": [
                {"type": "number"},
                {"$ref": "#/refs/signal"}
              ]
            },
            "domainRaw": {
              "oneOf": [
                {"type": "null"},
                {"type": "array"},
                {"$ref": "#/refs/signal"}
              ]
            },
            "reverse": {
              "oneOf": [
                {"type": "boolean"},
                {"$ref": "#/refs/signal"}
              ]
            },
            "round": {
              "oneOf": [
                {"type": "boolean"},
                {"$ref": "#/refs/signal"}
              ]
            },
          },
          "required": ["name"]
        },
        {
          "oneOf": [
            {
              "properties": {
                "type": {"enum": ["ordinal"]},
                "range": {
                  "oneOf": rangeDef.concat({"$ref": "#/refs/scaleData"})
                }
              },
              "required": ["type"]
            },
            {
              "properties": {
                "type": {"enum": ["band"]},
                "range": {"oneOf": rangeDef},
                "padding": {
                  "oneOf": [
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
                "paddingInner": {
                  "oneOf": [
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
                "paddingOuter": {
                  "oneOf": [
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
                "align": {
                  "oneOf": [
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
                "rangeStep": {
                  "oneOf": [
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                }
              },
              "required": ["type"]
            },
            {
              "properties": {
                "type": {"enum": ["point"]},
                "range": {"oneOf": rangeDef},
                "padding": {
                  "oneOf": [
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
                "paddingOuter": {
                  "oneOf": [
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
                "align": {
                  "oneOf": [
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
                "rangeStep": {
                  "oneOf": [
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                }
              },
              "required": ["type"]
            },
            {
              "properties": {
                "type": {"enum": ["sequential"]},
                "range": {"oneOf": rangeDef},
                "clamp": {
                  "oneOf": [
                    {"type": "boolean"},
                    {"$ref": "#/refs/signal"}
                  ]
                }
              },
              "required": ["type"]
            },
            {
              "properties": {
                "type": {"enum": ["time", "utc"]},
                "range": {"oneOf": rangeDef},
                "clamp": {
                  "oneOf": [
                    {"type": "boolean"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
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
                "nice": {
                  "oneOf": [
                    {"type": "boolean"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
              },
              "required": ["type"]
            },
            {
              "properties": {
                "type": {"enum": ["quantile", "quantize", "threshold"]},
                "range": {"oneOf": rangeDef}
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
                "range": {"oneOf": rangeDef},
                "interpolate": {
                  "oneOf": [
                    {"type": "string"},
                    {"$ref": "#/refs/signal"},
                    {
                      "type": "object",
                      "properties": {
                        "type": {
                          "oneOf": [
                            {"type": "string"},
                            {"$ref": "#/refs/signal"}
                          ]
                        },
                        "gamma": {
                          "oneOf": [
                            {"type": "number"},
                            {"$ref": "#/refs/signal"}
                          ]
                        }
                      },
                      "required": ["type"]
                    }
                  ]
                },
                "clamp": {
                  "oneOf": [
                    {"type": "boolean"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
                "nice": {
                  "oneOf": [
                    {"type": "boolean"},
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
                "zero": {
                  "oneOf": [
                    {"type": "boolean"},
                    {"$ref": "#/refs/signal"}
                  ]
                }
              }
            },
            {
              "properties": {
                "type": {"enum": ["pow"]},
                "range": {"oneOf": rangeDef},
                "clamp": {
                  "oneOf": [
                    {"type": "boolean"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
                "exponent": {
                  "oneOf": [
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
                "nice": {
                  "oneOf": [
                    {"type": "boolean"},
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                },
                "zero": {
                  "oneOf": [
                    {"type": "boolean"},
                    {"$ref": "#/refs/signal"}
                  ]
                }
              },
              "required": ["type"]
            },
            {
              "properties": {
                  "type": {"enum": ["index"]},
                  "range": {"oneOf": rangeDef}
              },
              "required": ["type"]
            }
          ]
        }
      ]
    }
  }
};
