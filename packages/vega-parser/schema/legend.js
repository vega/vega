import {layoutAlign} from './layout';
import {
  numberValue, stringValue, colorValue,
  alignValue, baselineValue, fontWeightValue,
  numberOrSignal, stringOrSignal, arrayOrSignal
} from './util';

export default {
  "defs": {
    "guideEncode": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "interactive": {"type": "boolean", "default": false},
        "style": {"$ref": "#/refs/style"}
      },
      "patternProperties": {
        "^(?!interactive|name|style).+$": {"$ref": "#/defs/encodeEntry"},
      },
      "additionalProperties": false
    },
    "legend": {
      "type": "object",
      "properties": {
        "size":       {"type": "string"},
        "shape":      {"type": "string"},
        "fill":       {"type": "string"},
        "stroke":     {"type": "string"},
        "opacity":    {"type": "string"},
        "strokeDash": {"type": "string"},
        "type": {
          "enum": ["gradient", "symbol"]
        },
        "direction": {
          "enum": ["vertical", "horizontal"]
        },
        "orient": {
          "enum": [
            "none",
            "left",
            "right",
            "top",
            "bottom",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right"
          ],
          "default": "right"
        },
        "format": stringOrSignal,
        "title": stringOrSignal,
        "tickCount": {"$ref": "#/refs/tickCount"},
        "values": arrayOrSignal,
        "zindex": {"type": "number"},

        // LEGEND GROUP CONFIG
        "cornerRadius": numberValue,
        "fillColor": colorValue,
        "offset": numberValue,
        "padding": numberValue,
        "strokeColor": colorValue,
        "strokeWidth": numberValue,

        // LEGEND TITLE CONFIG
        "titleAlign": alignValue,
        "titleBaseline": baselineValue,
        "titleColor": colorValue,
        "titleFont": stringValue,
        "titleFontSize": numberValue,
        "titleFontWeight": fontWeightValue,
        "titleLimit": numberValue,
        "titleOpacity": numberValue,
        "titlePadding": numberValue,

        // GRADIENT CONFIG
        "gradientLength": numberOrSignal,
        "gradientOpacity": numberValue,
        "gradientStrokeColor": colorValue,
        "gradientStrokeWidth": numberValue,
        "gradientThickness": numberOrSignal,

        // SYMBOL LAYOUT CONFIG
        "clipHeight": numberOrSignal,
        "columns": numberOrSignal,
        "columnPadding": numberOrSignal,
        "rowPadding": numberOrSignal,
        "gridAlign": layoutAlign,

        // SYMBOL CONFIG
        "symbolFillColor": colorValue,
        "symbolOffset": numberValue,
        "symbolOpacity": numberValue,
        "symbolSize": numberValue,
        "symbolStrokeColor": colorValue,
        "symbolStrokeWidth": numberValue,
        "symbolType": stringValue,

        // LABEL CONFIG
        "labelAlign": alignValue,
        "labelBaseline": baselineValue,
        "labelColor": colorValue,
        "labelFont": stringValue,
        "labelFontSize": numberValue,
        "labelFontWeight": fontWeightValue,
        "labelLimit": numberValue,
        "labelOffset": numberValue,
        "labelOpacity": numberValue,
        "labelOverlap": {"$ref": "#/refs/labelOverlap"},

        // CUSTOMIZED ENCODERS
        "encode": {
          "type": "object",
          "properties": {
            "title": {"$ref": "#/defs/guideEncode"},
            "labels": {"$ref": "#/defs/guideEncode"},
            "legend": {"$ref": "#/defs/guideEncode"},
            "entries": {"$ref": "#/defs/guideEncode"},
            "symbols": {"$ref": "#/defs/guideEncode"},
            "gradient": {"$ref": "#/defs/guideEncode"}
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false,
      "anyOf": [
        {"required": ["size"]},
        {"required": ["shape"]},
        {"required": ["fill"]},
        {"required": ["stroke"]},
        {"required": ["opacity"]},
        {"required": ["strokeDash"]}
      ]
    }
  }
};
