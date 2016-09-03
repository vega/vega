var parseDef = {
  "oneOf": [
    {"enum": ["auto"]},
    {
      "type": "object",
      "additionalProperties": {
        "enum": ["number", "boolean", "date", "string"]
      }
    }
  ]
};

export default {
  "refs": {
    "paramField": {
      "type": "object",
      "properties": {
        "field": {"type": "string"}
      },
      "additionalProperties": false,
      "required": ["field"]
    }
  },
  "defs": {
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
            "on": {"$ref": "#/defs/onTrigger"},
            "format": {
              "type": "object",
              "oneOf": [
                {
                  "properties": {
                    "type": {"enum": ["json"]},
                    "parse": parseDef,
                    "property": {"type": "string"}
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
            }
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
                  "properties": {"source": {"type": "string"}},
                  "required": ["source"]
                },
                {
                  "properties": {"values": {"type": "array"}},
                  "required": ["values"]
                },
                {
                  "properties": {"url": {"type": "string"}},
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
