var bins = require('datalib').bins,
    Tuple = require('vega-dataflow').Tuple,
    log = require('vega-logging'),
    Transform = require('./Transform');

function Bin(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    field: {type: 'field'},
    min: {type: 'value'},
    max: {type: 'value'},
    base: {type: 'value', default: 10},
    maxbins: {type: 'value', default: 20},
    step: {type: 'value'},
    steps: {type: 'value'},
    minstep: {type: 'value'},
    div: {type: 'array<value>', default: [5, 2]}
  });

  this._output = {bin: 'bin'};
  return this.mutates(true);
}

var prototype = (Bin.prototype = Object.create(Transform.prototype));
prototype.constructor = Bin;

prototype.transform = function(input) {
  log.debug(input, ['binning']);

  var output  = this._output.bin,
      step    = this.param('step'),
      steps   = this.param('steps'),
      minstep = this.param('minstep'),
      get     = this.param('field').accessor,
      opt = {
        min: this.param('min'),
        max: this.param('max'),
        base: this.param('base'),
        maxbins: this.param('maxbins'),
        div: this.param('div')
      };

  if (step) opt.step = step;
  if (steps) opt.steps = steps;
  if (minstep) opt.minstep = minstep;
  var b = bins(opt);

  function update(d) {
    var v = get(d);
    v = v == null ? null
      : b.start + b.step * ~~((v - b.start) / b.step);
    Tuple.set(d, output, v);
  }
  input.add.forEach(update);
  input.mod.forEach(update);
  input.rem.forEach(update);

  return input;
};

module.exports = Bin;

Bin.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Bin transform",
  "description": "Bins values into quantitative bins (e.g., for a histogram).",
  "type": "object",
  "properties": {
    "type": {"enum": ["bin"]},
    "field": {
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "description": "The name of the field to bin values from."
    },
    "min": {
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "description": "The minimum bin value to consider."
    },
    "max": {
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "description": "The maximum bin value to consider."
    },
    "base": {
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "description": "The number base to use for automatic bin determination.",
      "default": 10
    },
    "maxbins": {
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "description": "The maximum number of allowable bins.",
      "default": 20
    },
    "step": {
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "description": "An exact step size to use between bins. If provided, options such as maxbins will be ignored."
    },
    "steps": {
      "description": "An array of allowable step sizes to choose from.",
      "oneOf": [
        {
          "type": "array",
          "items": {"type": "number"}
        },
        {"$ref": "#/refs/signal"}
      ]
    },
    "minstep": {
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "description": "A minimum allowable step size (particularly useful for integer values)."
    },
    "div": {
      "description": "An array of scale factors indicating allowable subdivisions.",
      "oneOf": [
        {
          "type": "array",
          "items": {"type": "number"},
          "default": [5, 2]
        },
        {"$ref": "#/refs/signal"}
      ]
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "bin": {"type": "string", "default": "bin"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required":["type", "field", "min", "max"]
};
