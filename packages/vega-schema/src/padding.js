export default {
  "defs": {
    "padding": {
      "oneOf": [
        {
          "type": "number"
        },
        {
          "type": "object",
          "properties": {
            "top": {"type": "number"},
            "bottom": {"type": "number"},
            "left": {"type": "number"},
            "right": {"type": "number"}
          },
          "additionalProperties": false
        }
      ]
    }
  }
};
