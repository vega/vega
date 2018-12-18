import {
  numberValue, stringValue, stringOrSignal, anchorValue,
  alignValue, baselineValue, colorValue, fontWeightValue
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
            "frame": {
              "oneOf": [
                {"enum": ["group", "bounds"]},
                {"$ref": "#/refs/stringValue"}
              ]
            },
            "offset": numberValue,
            "style": {"$ref": "#/refs/style"},
            "text": stringOrSignal,
            "zindex": {"type": "number"},
            "interactive": {"type": "boolean"},

            "align": alignValue,
            "angle": numberValue,
            "baseline": baselineValue,
            "color": colorValue,
            "font": stringValue,
            "fontSize": numberValue,
            "fontWeight": fontWeightValue,
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
