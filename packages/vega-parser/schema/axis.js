import {timeIntervals} from './scale';
import {
  numberValue, stringValue, booleanValue, colorValue,
  alignValue, baselineValue, fontWeightValue, dashArrayValue,
  booleanOrSignal, arrayOrSignal, numberOrSignal, stringOrSignal,
  booleanOrNumberOrSignal
} from './util';

export default {
  "refs": {
    "labelOverlap": {
      "oneOf": [
        {"type": "boolean"},
        {"enum": ["parity", "greedy"], "type": "string"},
        {"$ref": "#/refs/signal"}
      ]
    },
    "tickCount": {
      "oneOf": [
        {"type": "number"},
        {"type": "string", "enum": timeIntervals},
        {
          "type": "object",
          "properties": {
            "interval": {
              "oneOf": [
                {"type": "string", "enum": timeIntervals},
                {"$ref": "#/refs/signal"}
              ]
            },
            "step": numberOrSignal
          },
          "required": ["interval"]
        },
        {"$ref": "#/refs/signal"}
      ]
    }
  },
  "defs": {
    "axis": {
      "type": "object",
      "properties": {
        "orient": {"enum": ["top", "bottom", "left", "right"]},
        "scale": {"type": "string"},
        "format": stringOrSignal,
        "minExtent": numberValue,
        "maxExtent": numberValue,
        "offset": numberValue,
        "position": numberValue,
        "bandPosition": numberValue,
        "values": arrayOrSignal,
        "zindex": {"type": "number"},

        // TITLE CONFIG
        "title": stringOrSignal,
        "titlePadding": numberValue,
        "titleAlign": alignValue,
        "titleAngle": numberValue,
        "titleX": numberValue,
        "titleY": numberValue,
        "titleBaseline": baselineValue,
        "titleColor": colorValue,
        "titleFont": stringValue,
        "titleFontSize": numberValue,
        "titleFontWeight": fontWeightValue,
        "titleLimit": numberValue,
        "titleOpacity": numberValue,

        // DOMAIN CONFIG
        "domain": {"type": "boolean"},
        "domainColor": colorValue,
        "domainOpacity": numberValue,
        "domainWidth": numberValue,

        // TICK CONFIG
        "ticks": {"type": "boolean"},
        "tickColor": colorValue,
        "tickOffset": numberValue,
        "tickOpacity": numberValue,
        "tickRound": booleanValue,
        "tickSize": numberValue,
        "tickWidth": numberValue,

        "tickCount": {"$ref": "#/refs/tickCount"},
        "tickExtra": booleanOrSignal,

        // GRID CONFIG
        "grid": {"type": "boolean"},
        "gridScale": {"type": "string"},
        "gridColor": colorValue,
        "gridDash": dashArrayValue,
        "gridOpacity": numberValue,
        "gridWidth": numberValue,

        // LABEL CONFIG
        "labels": {"type": "boolean"},
        "labelAlign": alignValue,
        "labelBaseline": baselineValue,
        "labelBound": booleanOrNumberOrSignal,
        "labelFlush": booleanOrNumberOrSignal,
        "labelFlushOffset": numberOrSignal,
        "labelOverlap": {"$ref": "#/refs/labelOverlap"},
        "labelAngle": numberValue,
        "labelColor": colorValue,
        "labelFont": stringValue,
        "labelFontSize": numberValue,
        "labelFontWeight": fontWeightValue,
        "labelLimit": numberValue,
        "labelOpacity": numberValue,
        "labelPadding": numberValue,

        // CUSTOMIZED ENCODERS
        "encode": {
          "type": "object",
          "properties": {
            "axis": {"$ref": "#/defs/guideEncode"},
            "ticks": {"$ref": "#/defs/guideEncode"},
            "labels": {"$ref": "#/defs/guideEncode"},
            "title": {"$ref": "#/defs/guideEncode"},
            "grid": {"$ref": "#/defs/guideEncode"},
            "domain": {"$ref": "#/defs/guideEncode"}
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false,
      "required": ["orient", "scale"]
    }
  }
};
