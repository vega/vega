import {
  fontWeightEnum, alignEnum, baselineEnum, valueSchema
} from './encode';

var anchorEnum = ['start', 'middle', 'end'];

export var alignValue = {
  "oneOf": [
    {"enum": alignEnum},
    {"$ref": "#/refs/alignValue"}
  ]
};

export var anchorValue = {
  "oneOf": [
    {"enum": anchorEnum, "default": "middle"},
    valueSchema(anchorEnum)
  ]
};

export var baselineValue = {
  "oneOf": [
    {"enum": baselineEnum},
    {"$ref": "#/refs/baselineValue"}
  ]
};

export var booleanValue = {
  "oneOf": [
    {"type": "boolean"},
    {"$ref": "#/refs/booleanValue"}
  ]
};

export var colorValue = {
  "oneOf": [
    {"type": "null"},
    {"type": "string"},
    {"$ref": "#/refs/colorValue"}
  ]
};

export var dashArrayValue = {
  "oneOf": [
    {
      "type": "array",
      "items": {"type": "number"}
    },
    {"$ref": "#/refs/arrayValue"}
  ]
};

export var fontWeightValue = {
  "oneOf": [
    {"enum": fontWeightEnum},
    {"$ref": "#/refs/fontWeightValue"}
  ]
};

export var numberValue = {
  "oneOf": [
    {"type": "number"},
    {"$ref": "#/refs/numberValue"}
  ]
};

export var stringValue = {
  "oneOf": [
    {"type": "string"},
    {"$ref": "#/refs/stringValue"}
  ]
};

export var booleanOrNumberOrSignal = {
  "oneOf": [
    {"type": "boolean"},
    {"type": "number"},
    {"$ref": "#/refs/signal"}
  ]
};

export var booleanOrSignal = {
  "$ref": "#/refs/booleanOrSignal"
};

export var arrayOrSignal = {
  "$ref": "#/refs/arrayOrSignal"
};

export var numberOrSignal = {
  "$ref": "#/refs/numberOrSignal"
};

export var stringOrSignal = {
  "$ref": "#/refs/stringOrSignal"
};
