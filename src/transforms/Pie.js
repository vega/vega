var d3 = require('d3'),
    gen  = require('datalib/src/generate'),
    Tuple = require('vega-dataflow/src/Tuple'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function Pie(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    value:      {type: "field", default: null},
    startAngle: {type: "value", default: 0},
    endAngle:   {type: "value", default: 2 * Math.PI},
    sort:       {type: "value", default: false}
  });

  this._output = {
    "start": "layout_start",
    "end":   "layout_end",
    "mid":   "layout_mid"
  };

  return this;
}

var prototype = (Pie.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Pie;

function ones() { return 1; }

prototype.batchTransform = function(input, data) {
  var output = this._output,
      value = this.param("value").accessor || ones,
      start = this.param("startAngle"),
      stop = this.param("endAngle"),
      sort = this.param("sort");

  var values = data.map(value),
      a = start,
      k = (stop - start) / d3.sum(values),
      index = gen.range(data.length),
      i, t, v;

  if (sort) {
    index.sort(function(a, b) {
      return values[a] - values[b];
    });
  }

  for (i=0; i<index.length; ++i) {
    t = data[index[i]];
    v = values[index[i]];
    Tuple.set(t, output.start, a);
    Tuple.set(t, output.mid, (a + 0.5 * v * k));
    Tuple.set(t, output.end, (a += v * k));
  }

  input.fields[output.start] = 1;
  input.fields[output.end] = 1;
  input.fields[output.mid] = 1;
  return input;
};

module.exports = Pie;

Pie.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Pie transform",
  "description": "Computes a pie chart layout.",
  "type": "object",
  "properties": {
    "type": {"enum": ["pie"]},
    "value": {
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "description": "The data values to encode as angular spans. " + 
        "If this property is omitted, all pie slices will have equal spans."
    },
    "startAngle": {
      "oneOf": [
        {
          "type": "number",
          "minimum": 0,
          "maximum": 2 * Math.PI
        }, 
        {"$ref": "#/refs/signal"}
      ],
      "default": 0
    },
    "endAngle": {
      "oneOf": [
        {
          "type": "number",
          "minimum": 0,
          "maximum": 2 * Math.PI
        }, 
        {"$ref": "#/refs/signal"}
      ],
      "default": 2 * Math.PI,
    },
    "sort": {
      "description": " If true, will sort the data prior to computing angles.",
      "oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}],
      "default": false
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "start": {"type": "string", "default": "layout_start"},
        "end": {"type": "string", "default": "layout_end"},
        "mid": {"type": "string", "default": "layout_mid"}
      }
    }
  },
  "required": ["type"]
};