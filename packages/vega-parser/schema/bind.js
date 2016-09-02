export default {
  "refs": {
    "element": {
      "type": "string"
    },
  },
  "defs": {
    "bind": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "type": {"enum": ["checkbox"]},
            "element": {"$ref": "#/refs/element"}
          },
          "required": ["type"]
        },
        {
          "type": "object",
          "properties": {
            "type": {"enum": ["radio", "select"]},
            "element": {"$ref": "#/refs/element"},
            "options": {
              "type": "array",
              "items": {"type": {}}
            }
          },
          "additionalProperties": false,
          "required": ["type", "options"]
        },
        {
          "type": "object",
          "properties": {
            "type": {"enum": ["range"]},
            "element": {"$ref": "#/refs/element"},
            "min": {"type": "number"},
            "max": {"type": "number"},
            "step": {"type": "number"}
          },
          "additionalProperties": false,
          "required": ["type"]
        },
        {
          "type": "object",
          "properties": {
            "type": {"enum": ["form"]},
            "element": {"$ref": "#/refs/element"}
          },
          "additionalProperties": true
        },
      ]
    }
  }
};
