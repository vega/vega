var rangeDef = [
  {
    "enum": ["width", "height", "shapes", "category"]
  },
  {
    "type": "array",
    "items": {
      "oneOf": [
        {"type":"string"},
        {"type": "number"},
        {"$ref": "#/refs/signal"}
      ]
    }
  },
  {"$ref": "#/refs/signal"}
];

export default {
  "refs": {
    "scaleField": {
      "oneOf": [
        {"type": "string"},
        {"$ref": "#/refs/signal"},
        {"$ref": "#/refs/expr"}
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
                    "op": {"$ref": "#/refs/scaleField"}
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
          "required": ["data", "fields"],
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
                },
                "scheme": {"type": "string"}
              },
              "required": ["type"]
            },
            {
              "properties": {
                "type": {"enum": ["band", "point"]},
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
                "bandSize": {
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
                "scheme": {"type": "string"},
                "clamp": {
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
              "properties": {
                "type": {"enum": ["linear", "sqrt", "log"]},
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
              "allOf": [
                {
                  "properties": {
                    "type": {"enum": ["index"]},
                    "clamp": {
                      "oneOf": [
                        {"type": "boolean"},
                        {"$ref": "#/refs/signal"}
                      ]
                    }
                  },
                  "required": ["type", "scheme"]
                },
                {
                  "oneOf": [
                    {
                      "properties": {"range": {"oneOf": rangeDef}},
                      "required": ["range"]
                    },
                    {
                      "properties": {"scheme": {"type": "string"}},
                      "required": ["scheme"]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
};
