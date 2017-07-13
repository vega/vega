export default {
  "defs": {
    "events": {
      "type": "object",
      "properties": {
        "defaults": {
          "oneOf": [
            {
              "type": "object",
              "properties": {
                "prevent": {
                  "oneOf": [
                    {"type": "boolean"},
                    {"type": "array", "items": {"type": "string"}}
                  ]
                }
              },
              "required": ["prevent"],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {
                "allow": {
                  "oneOf": [
                    {"type": "boolean"},
                    {"type": "array", "items": {"type": "string"}}
                  ]
                }
              },
              "required": ["allow"],
              "additionalProperties": false
            }
          ]
        }
      }
    }
  }
};
