import {
  numberValue, stringValue, colorValue, baselineValue, fontWeightValue,
  anchorValue, stringOrSignal
} from './util';

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
            "anchor": anchorValue,
            "style": {"$ref": "#/refs/style"},
            "text": stringOrSignal,
            "zindex": {"type": "number"},
            "interactive": {"type": "boolean"},

            "color": colorValue,
            "font": stringValue,
            "fontSize": numberValue,
            "fontWeight": fontWeightValue,
            "offset": numberValue,
            "frame": {
              "oneOf": [
                {"enum": ["group", "bounds"]},
                {"$ref": "#/refs/stringValue"}
              ]
            },
            "angle": numberValue,
            "baseline": baselineValue,
            "limit": numberValue,

            "encode": {"$ref": "#/defs/titleEncode"}
          },
          "required": ["text"],
          "additionalProperties": false
        }
      ]
    }
  }
};
