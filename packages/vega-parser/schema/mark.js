export default {
  "refs": {
    "compare": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "field": {
              "oneOf": [
                {"type": "string"},
                {"$ref": "#/refs/signal"}
              ]
            },
            "order": {"$ref": "#/refs/sortOrder"}
          }
        },
        {
          "type": "object",
          "properties": {
            "field": {
              "type": "array",
              "items": {
                "anyOf": [
                  {"type": "string"},
                  {"$ref": "#/refs/signal"}
                ]
              }
            },
            "order": {
              "type": "array",
              "items": {"$ref": "#/refs/sortOrder"}
            }
          }
        }
      ]
    },
    "from": {
      "type": "object",
      "properties": {
        "data": {"type": "string"},
      },
      "additionalProperties": false
    },
    "facet": {
      "type": "object",
      "properties": {
        "data": {"type": "string"},
        "facet": {
          "oneOf": [
            {
              "type": "object",
              "properties": {
                "name": {"type": "string"},
                "data": {"type": "string"},
                "field": {"type": "string"}
              },
              "additionalProperties": false,
              "required": ["name", "data", "field"]
            },
            {
              "type": "object",
              "properties": {
                "name": {"type": "string"},
                "data": {"type": "string"},
                // TODO revisit for signal support
                "groupby": {
                  "oneOf": [
                    {"type": "string"},
                    {"type": "array", "items": {"type": "string"}}
                  ]
                },
                "aggregate": {
                  "type": "object",
                  "properties": {
                    "cross": {"type": "boolean"},
                    "fields": {"type": "array", "items": {"type": "string"}},
                    "ops": {"type": "array", "items": {"type": "string"}},
                    "as": {"type": "array", "items": {"type": "string"}}
                  }
                }
              },
              "additionalProperties": false,
              "required": ["name", "data", "groupby"]
            },
          ]
        }
      },
      "additionalProperties": false,
      "required": ["facet"]
    }
  },

  "defs": {
    "mark": {
      "type": "object",
      "properties": {
        "type": {"$ref": "#/refs/marktype"},
        "role": {"type": "string"},
        "name": {"type": "string"},
        "key": {"type": "string"},
        "clip": {"type": "boolean"},
        "sort": {"$ref": "#/refs/compare"},
        "interactive": {"type": "boolean"},
        "encode": {"$ref": "#/defs/encode"},
        "transform": {
          "type": "array",
          "items": {"$ref": "#/defs/transformMark"}
        },
        "on": {"$ref": "#/defs/onMarkTrigger"}
      },
      "required": ["type"]
    },
    "markGroup": {
      "allOf": [
        {
          "properties": { "type": {"enum": ["group"]} },
          "required": ["type"]
        },
        {"$ref": "#/defs/mark"},
        {"$ref": "#/defs/scope"},
        {
          "type": "object",
          "properties": {
            "from": {
              "oneOf": [
                {"$ref": "#/refs/from"},
                {"$ref": "#/refs/facet"}
              ]
            }
          }
        }
      ]
    },
    "markVisual": {
      "allOf": [
        {"not": {"properties": { "type": {"enum": ["group"]} }}},
        {"$ref": "#/defs/mark"},
        {
          "type": "object",
          "properties": {
            "from": {"$ref": "#/refs/from"}
          }
        }
      ]
    }
  }
};
