import {isArray} from 'vega-util';

function valueSchema(type) {
  type = isArray(type) ? {"enum": type} : {"type": type};

  var modType = type.type === "number" ? "number" : "string";

  var valueRef  = {
    "type": "object",
    "allOf": [
      { "$ref": "#/refs/" + modType + "Modifiers" },
      {
        "oneOf": [
          {
            "$ref": "#/refs/signal",
          },
          {
            "$ref": "#/refs/expr"
          },
          {
            "properties": {"value": type},
            "required": ["value"]
          },
          {
            "properties": {"field": {"$ref": "#/refs/field"}},
            "required": ["field"]
          },
          {
            "properties": {"band": {"type": ["number", "boolean"]}},
            "required": ["band"]
          },
          {
            "properties": {"extra": {"type": "boolean"}},
            "required": ["extra"]
          },
          {
            "properties": {"range": {"type": ["number", "boolean"]}},
            "required": ["range"]
          },
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
            {"$ref": "#/refs/signal"},
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
      "title": "ScaleRef",
      "oneOf": [
        {"$ref": "#/refs/field"}
      ]
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
        "scale": {"$ref": "#/refs/scale"}
      }
    },

    "value": valueSchema({}, "value"),
    "numberValue": valueSchema("number"),
    "stringValue": valueSchema("string"),
    "booleanValue": valueSchema("boolean"),
    "arrayValue": valueSchema("array"),

    "colorValue": {
      "title": "ColorRef",
      "oneOf": [{"$ref": "#/refs/stringValue"}, {
        "type": "object",
        "properties": {
          "r": {"$ref": "#/refs/numberValue"},
          "g": {"$ref": "#/refs/numberValue"},
          "b": {"$ref": "#/refs/numberValue"}
        },
        "required": ["r", "g", "b"]
      }, {
        "type": "object",
        "properties": {
          "h": {"$ref": "#/refs/numberValue"},
          "s": {"$ref": "#/refs/numberValue"},
          "l": {"$ref": "#/refs/numberValue"}
        },
        "required": ["h", "s", "l"]
      }, {
        "type": "object",
        "properties": {
          "l": {"$ref": "#/refs/numberValue"},
          "a": {"$ref": "#/refs/numberValue"},
          "b": {"$ref": "#/refs/numberValue"}
        },
        "required": ["l", "a", "b"]
      }, {
        "type": "object",
        "properties": {
          "h": {"$ref": "#/refs/numberValue"},
          "c": {"$ref": "#/refs/numberValue"},
          "l": {"$ref": "#/refs/numberValue"}
        },
        "required": ["h", "c", "l"]
      }]
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
        "shape": {
          "anyOf": [
            {"type": "string"},
            {"$ref": "#/refs/stringValue"}
          ]
        },

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
        "orient": valueSchema(["horizontal", "vertical"]),

        // Image-mark properties
        "url": {"$ref": "#/refs/stringValue"},
        "align": valueSchema(["left", "right", "center"]),
        "baseline": valueSchema(["top", "middle", "bottom", "alphabetic"]),

        // Text-mark properties
        "text": {"$ref": "#/refs/stringValue"},
        "dx": {"$ref": "#/refs/numberValue"},
        "dy": {"$ref": "#/refs/numberValue"},
        "radius":{"$ref": "#/refs/numberValue"},
        "theta": {"$ref": "#/refs/numberValue"},
        "angle": {"$ref": "#/refs/numberValue"},
        "font": {"$ref": "#/refs/stringValue"},
        "fontSize": {"$ref": "#/refs/numberValue"},
        "fontWeight": {"$ref": "#/refs/stringValue"},
        "fontStyle": {"$ref": "#/refs/stringValue"}
      },
      "additionalProperties": true
    },
    "encode": {
      "type": "object",
      "patternProperties": {
        "^.+$": {"$ref": "#/defs/encodeEntry"},
      },
      "additionalProperties": false,
    }
  }
};
