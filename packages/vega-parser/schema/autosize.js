var types = {"enum": ["pad", "fit", "fit-x", "fit-y", "none"]};

export default {
  "defs": {
    "autosize": {
      "oneOf": [
        types,
        {
          "type": "object",
          "properties": {
            "type": types,
            "resize": {"type": "boolean"},
            "contains": {"enum": ["content", "padding"]}
          },
          "required": ["type"],
          "additionalProperties": false
        }
      ],
      "default": "pad"
    }
  }
};
