var types = {"enum": ["pad", "fit", "none"]};

export default {
  "defs": {
    "autosize": {
      "oneOf": [
        types,
        {
          "type": "object",
          "properties": {
            "type": types,
            "resize": {"type": "boolean"}
          },
          "required": ["type"],
          "additionalProperties": false
        }
      ],
      "default": "pad"
    }
  }
};
