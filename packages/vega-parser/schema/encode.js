import {isArray} from 'vega-util';

export var fontWeightEnum = [
  null, "normal", "bold", "lighter", "bolder",
  "100", "200", "300", "400", "500", "600", "700", "800", "900",
  100, 200, 300, 400, 500, 600, 700, 800, 900
];

export var alignEnum = ["left", "right", "center"];

export var baselineEnum = ["top", "middle", "bottom", "alphabetic"];

export var areaOrientEnum = ["horizontal", "vertical"];

export function valueSchema(type, nullable) {
  type = isArray(type) ? {"enum": type} : {"type": type};

  var modType = type.type === "number" ? "number" : "string",
      valueType = nullable ? {"oneOf": [type, {"type": "null"}]} : type;

  var valueRef = {
    "type": "object",
    "allOf": [
      { "$ref": "#/refs/" + modType + "Modifiers" },
      {
        "anyOf": [
          {
            "oneOf": [
              { "$ref": "#/refs/signal" },
              {
                "properties": {"value": valueType},
                "required": ["value"]
              },
              {
                "properties": {"field": {"$ref": "#/refs/field"}},
                "required": ["field"]
              },
              {
                "properties": {"range": {"type": ["number", "boolean"]}},
                "required": ["range"]
              }
            ]
          },
          {
            "required": ["scale", "value"]
          },
          {
            "required": ["scale", "band"]
          },
          {
            "required": ["offset"]
          }
        ]
      }
    ]
  };

  return {
    "oneOf": [
      {
        "type": "array",
        "items": {
          "allOf": [
            {"$ref": "#/defs/rule"},
            valueRef
          ]
        }
      },
      valueRef
    ]
  };
}

export default {
  "refs": {

    "field": {
      "title": "FieldRef",
      "oneOf": [
        {"type": "string"},
        {
          "oneOf": [
            { "$ref": "#/refs/signal" },
            {
              "type": "object",
              "properties": {
                "datum": {"$ref": "#/refs/field"}
              },
              "required": ["datum"],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {
                "group": {"$ref": "#/refs/field"},
                "level": {"type": "number"}
              },
              "required": ["group"],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {
                "parent": {"$ref": "#/refs/field"},
                "level": {"type": "number"}
              },
              "required": ["parent"],
              "additionalProperties": false
            }
          ]
        }
      ]
    },

    "scale": {
      "$ref": "#/refs/field"
    },

    "stringModifiers": {
      "properties": {
        "scale": {"$ref": "#/refs/scale"}
      }
    },

    "numberModifiers": {
      "properties": {
        "exponent": {
          "oneOf": [
            {"type": "number"},
            {"$ref": "#/refs/numberValue"}
          ]
        },
        "mult": {
          "oneOf": [
            {"type": "number"},
            {"$ref": "#/refs/numberValue"}
          ]
        },
        "offset": {
          "oneOf": [
            {"type": "number"},
            {"$ref": "#/refs/numberValue"}
          ]
        },
        "round": {"type": "boolean", "default": false},
        "scale": {"$ref": "#/refs/scale"},
        "band": {"type": ["number", "boolean"]},
        "extra": {"type": "boolean"}
      }
    },

    "value": valueSchema({}, "value"),
    "numberValue": valueSchema("number"),
    "stringValue": valueSchema("string"),
    "booleanValue": valueSchema("boolean"),
    "arrayValue": valueSchema("array"),
    "nullableStringValue": valueSchema("string", true),
    "fontWeightValue": valueSchema(fontWeightEnum),

    "alignValue": valueSchema(alignEnum),
    "baselineValue": valueSchema(baselineEnum),
    "orientValue": valueSchema(areaOrientEnum),

    "colorRGB": {
      "type": "object",
      "properties": {
        "r": {"$ref": "#/refs/numberValue"},
        "g": {"$ref": "#/refs/numberValue"},
        "b": {"$ref": "#/refs/numberValue"}
      },
      "required": ["r", "g", "b"]
    },

    "colorHSL": {
      "type": "object",
      "properties": {
        "h": {"$ref": "#/refs/numberValue"},
        "s": {"$ref": "#/refs/numberValue"},
        "l": {"$ref": "#/refs/numberValue"}
      },
      "required": ["h", "s", "l"]
    },

    "colorLAB": {
      "type": "object",
      "properties": {
        "l": {"$ref": "#/refs/numberValue"},
        "a": {"$ref": "#/refs/numberValue"},
        "b": {"$ref": "#/refs/numberValue"}
      },
      "required": ["l", "a", "b"]
    },

    "colorHCL": {
      "type": "object",
      "properties": {
        "h": {"$ref": "#/refs/numberValue"},
        "c": {"$ref": "#/refs/numberValue"},
        "l": {"$ref": "#/refs/numberValue"}
      },
      "required": ["h", "c", "l"]
    },

    "colorValue": {
      "title": "ColorRef",
      "oneOf": [
        {"$ref": "#/refs/nullableStringValue"},
        {
          "type": "object",
          "properties": {
            "gradient": {"$ref": "#/refs/scale"}
          },
          "additionalProperties": false,
          "required": ["gradient"]
        },
        {
          "type": "object",
          "properties": {
            "color": {
              "oneOf": [
                {"$ref": "#/refs/colorRGB"},
                {"$ref": "#/refs/colorHSL"},
                {"$ref": "#/refs/colorLAB"},
                {"$ref": "#/refs/colorHCL"}
              ]
            }
          },
          "additionalProperties": false,
          "required": ["color"]
        }
      ]
    }
  },

  "defs": {
    "rule": {
      "type": "object",
      "properties": {
        "test": {"type": "string"}
      }
    },
    "encodeEntry": {
      "title": "Mark encode property set",
      "type": "object",
      "properties": {
        // Common Properties
        "x": {"$ref": "#/refs/numberValue"},
        "x2": {"$ref": "#/refs/numberValue"},
        "xc": {"$ref": "#/refs/numberValue"},
        "width": {"$ref": "#/refs/numberValue"},
        "y": {"$ref": "#/refs/numberValue"},
        "y2": {"$ref": "#/refs/numberValue"},
        "yc": {"$ref": "#/refs/numberValue"},
        "height": {"$ref": "#/refs/numberValue"},
        "opacity": {"$ref": "#/refs/numberValue"},
        "fill": {"$ref": "#/refs/colorValue"},
        "fillOpacity": {"$ref": "#/refs/numberValue"},
        "stroke": {"$ref": "#/refs/colorValue"},
        "strokeWidth": {"$ref": "#/refs/numberValue"},
        "strokeOpacity": {"$ref": "#/refs/numberValue"},
        "strokeDash": {"$ref": "#/refs/arrayValue"},
        "strokeDashOffset": {"$ref": "#/refs/numberValue"},
        "cursor": {"$ref": "#/refs/stringValue"},

        // Group-mark properties
        "clip": {"$ref": "#/refs/booleanValue"},

        // Symbol-mark properties
        "size": {"$ref": "#/refs/numberValue"},
        "shape": {"$ref": "#/refs/stringValue"},

        // Path-mark properties
        "path": {"$ref": "#/refs/stringValue"},

        // Arc-mark properties
        "innerRadius": {"$ref": "#/refs/numberValue"},
        "outerRadius": {"$ref": "#/refs/numberValue"},
        "startAngle": {"$ref": "#/refs/numberValue"},
        "endAngle": {"$ref": "#/refs/numberValue"},

        // Area- and line-mark properties
        "interpolate": {"$ref": "#/refs/stringValue"},
        "tension": {"$ref": "#/refs/numberValue"},
        "orient": {"$ref": "#/refs/orientValue"},

        // Image-mark properties
        "url": {"$ref": "#/refs/stringValue"},
        "align": {"$ref": "#/refs/alignValue"},
        "baseline": {"$ref": "#/refs/baselineValue"},

        // Text-mark properties
        "text": {"$ref": "#/refs/stringValue"},
        "dir": {"$ref": "#/refs/stringValue"},
        "ellipsis": {"$ref": "#/refs/stringValue"},
        "limit": {"$ref": "#/refs/numberValue"},
        "dx": {"$ref": "#/refs/numberValue"},
        "dy": {"$ref": "#/refs/numberValue"},
        "radius":{"$ref": "#/refs/numberValue"},
        "theta": {"$ref": "#/refs/numberValue"},
        "angle": {"$ref": "#/refs/numberValue"},
        "font": {"$ref": "#/refs/stringValue"},
        "fontSize": {"$ref": "#/refs/numberValue"},
        "fontWeight": {"$ref": "#/refs/fontWeightValue"},
        "fontStyle": {"$ref": "#/refs/stringValue"}
      },
      "additionalProperties": true
    },
    "encode": {
      "type": "object",
      "patternProperties": {
        "^.+$": {"$ref": "#/defs/encodeEntry"},
      },
      "additionalProperties": false
    }
  }
};
