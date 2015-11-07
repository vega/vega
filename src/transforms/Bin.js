var dl = require('datalib'),
    Tuple = require('vega-dataflow').Tuple,
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function Bin(graph) {
  BatchTransform.prototype.init.call(this, graph);
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

  this._output = {
    start: 'bin_start',
    end:   'bin_end',
    mid:   'bin_mid'
  };
  return this.mutates(true);
}

var prototype = (Bin.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Bin;

prototype.extent = function(data) {
  // TODO only recompute extent upon data or field change?
  var e = [this.param('min'), this.param('max')], d;
  if (e[0] == null || e[1] == null) {
    d = dl.extent(data, this.param('field').accessor);
    if (e[0] == null) e[0] = d[0];
    if (e[1] == null) e[1] = d[1];
  }
  return e;
};

prototype.batchTransform = function(input, data) {
  log.debug(input, ['binning']);

  var extent  = this.extent(data),
      output  = this._output,
      step    = this.param('step'),
      steps   = this.param('steps'),
      minstep = this.param('minstep'),
      get     = this.param('field').accessor,
      opt = {
        min: extent[0],
        max: extent[1],
        base: this.param('base'),
        maxbins: this.param('maxbins'),
        div: this.param('div')
      };

  if (step) opt.step = step;
  if (steps) opt.steps = steps;
  if (minstep) opt.minstep = minstep;
  var b = dl.bins(opt),
      s = b.step;

  function update(d) {
    var v = get(d);
    v = v == null ? null
      : b.start + s * ~~((v - b.start) / s);
    Tuple.set(d, output.start, v);
    Tuple.set(d, output.end, v + s);
    Tuple.set(d, output.mid, v + s/2);
  }
  input.add.forEach(update);
  input.mod.forEach(update);
  input.rem.forEach(update);

  input.fields[output.start] = 1;
  input.fields[output.end] = 1;
  input.fields[output.mid] = 1;
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
        "start": {"type": "string", "default": "bin_start"},
        "end": {"type": "string", "default": "bin_end"},
        "mid": {"type": "string", "default": "bin_mid"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type", "field"]
};
