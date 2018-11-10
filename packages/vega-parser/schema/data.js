import {stringOrSignal} from './util';

var parseDef = {
  "oneOf": [
    {"enum": ["auto"]},
    {
      "type": "object",
      "additionalProperties": {
        "oneOf": [
          {
            "enum": ["boolean", "number", "date", "string"]
          },
          {
            "type": "string",
            "pattern": "^(date|utc):.*$"
          }
        ]
      }
    }
  ]
};

export default {
  "refs": {
    "paramField": {
      "type": "object",
      "properties": {
        "field": {"type": "string"},
        "as": {"type": "string"}
      },
      "additionalProperties": false,
      "required": ["field"]
    }
  },
  "defs": {
    "dataFormat": {
      "type": "object",
      "anyOf": [
        {
          "properties": {
            "type": {"enum": ["json"]},
            "parse": parseDef,
            "property": {"type": "string"},
            "copy": {"type": "boolean"}
          },
          "additionalProperties": false
        },
        {
          "properties": {
            "type": {"enum": ["csv", "tsv"]},
            "parse": parseDef
          },
          "additionalProperties": false
        },
        {
          "properties": {
            "type": {"enum": ["dsv"]},
            "delimiter": {"type": "string"},
            "parse": parseDef
          },
          "additionalProperties": false
        },
        {
          "oneOf": [
            {
              "properties": {
                "type": {"enum": ["topojson"]},
                "feature": {"type": "string"},
                "property": {"type": "string"}
              },
              "additionalProperties": false
            },
            {
              "properties": {
                "type": {"enum": ["topojson"]},
                "mesh": {"type": "string"},
                "property": {"type": "string"}
              },
              "additionalProperties": false
            }
          ]
        }
      ]
    },
    "data": {
      "title": "Input data set definition",
      "type": "object",
      "allOf": [
        {
          "properties": {
            "name": {"type": "string"},
            "transform": {
              "type": "array",
              "items": {"$ref": "#/defs/transform"}
            },
            "on": {"$ref": "#/defs/onTrigger"}
          },
          "required": ["name"]
        },
        {
          "anyOf": [
            {
              "required": ["name"]
            },
            {
              "oneOf": [
                {
                  "properties": {
                    "source": {
                      "oneOf": [
                        {"type": "string"},
                        {
                          "type": "array",
                          "items": {"type": "string"},
                          "minItems": 1
                        }
                      ]
                    }
                  },
                  "required": ["source"]
                },
                {
                  "properties": {
                    "values": {"type": "array"},
                    "format": {"$ref": "#/defs/dataFormat"}
                  },
                  "required": ["values"]
                },
                {
                  "properties": {
                    "url": stringOrSignal,
                    "format": {
                      "oneOf": [
                        {"$ref": "#/defs/dataFormat"},
                        {"$ref": "#/refs/signal"}
                      ]
                    }
                  },
                  "required": ["url"]
                }
              ]
            }
          ]
        }
      ]
    }
  }
};
