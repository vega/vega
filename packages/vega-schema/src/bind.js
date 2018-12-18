export default {
  "refs": {
    "element": {
      "type": "string"
    }
  },
  "defs": {
    "bind": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "input": {"enum": ["checkbox"]},
            "element": {"$ref": "#/refs/element"},
            "debounce": {"type": "number"},
            "name": {"type": "string"}
          },
          "required": ["input"]
        },
        {
          "type": "object",
          "properties": {
            "input": {"enum": ["radio", "select"]},
            "element": {"$ref": "#/refs/element"},
            "options": {"type": "array"},
            "debounce": {"type": "number"},
            "name": {"type": "string"}
          },
          "additionalProperties": false,
          "required": ["input", "options"]
        },
        {
          "type": "object",
          "properties": {
            "input": {"enum": ["range"]},
            "element": {"$ref": "#/refs/element"},
            "min": {"type": "number"},
            "max": {"type": "number"},
            "step": {"type": "number"},
            "debounce": {"type": "number"},
            "name": {"type": "string"}
          },
          "additionalProperties": false,
          "required": ["input"]
        },
        {
          "type": "object",
          "properties": {
            "input": {
              "not": {"enum": ["checkbox", "radio", "range", "select"]}
            },
            "element": {"$ref": "#/refs/element"},
            "debounce": {"type": "number"},
            "name": {"type": "string"}
          },
          "additionalProperties": true
        },
      ]
    }
  }
};
