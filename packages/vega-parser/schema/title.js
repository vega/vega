export default {
  "defs": {
    "titleEncode": {
      "type": "object",
      "patternProperties": {
        "^(?!interactive|name|style).+$": {"$ref": "#/defs/encodeEntry"},
      },
      "additionalProperties": false
    },
    "title": {
      "oneOf": [
        {"type": "string"},
        {
          "type": "object",
          "properties": {
            "name": {"type": "string"},
            "orient": {
              "enum": [
                "none",
                "left",
                "right",
                "top",
                "bottom"
              ],
              "default": "top"
            },
            "anchor": {
              "enum": [
                "start",
                "middle",
                "end"
              ],
              "default": "middle"
            },
            "style": {"$ref": "#/refs/style"},
            "text": {"$ref": "#/refs/stringOrSignal"},
            "zindex": {"type": "number"},
            "interactive": {"type": "boolean"},
            "offset": {
              "oneOf": [
                {"type": "number"},
                {"$ref": "#/refs/numberValue"}
              ]
            },
            "encode": {"$ref": "#/defs/titleEncode"}
          },
          "required": ["text"],
          "additionalProperties": false
        }
      ]
    }
  }
};
