export default {
  "defs": {
    "onTrigger": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "trigger": {"$ref": "#/refs/exprString"},
          "insert": {"$ref": "#/refs/exprString"},
          "remove": {
            "oneOf": [
              {"type": "boolean"},
              {"$ref": "#/refs/exprString"}
            ]
          },
          "toggle": {"$ref": "#/refs/exprString"},
          "modify": {"$ref": "#/refs/exprString"},
          "values": {"$ref": "#/refs/exprString"}
        },
        "required": ["trigger"]
      }
    },
    "onMarkTrigger": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "trigger": {"$ref": "#/refs/exprString"},
          "modify": {"$ref": "#/refs/exprString"},
          "values": {"$ref": "#/refs/exprString"}
        },
        "required": ["trigger"]
      }
    }
  }
};
