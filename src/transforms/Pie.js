var dl = require('datalib'),
    d3 = require('d3'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform'),
    tuple = require('../dataflow/tuple');

function Pie(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    value:      {type: "field", default: null},
    startAngle: {type: "value", default: 0},
    endAngle:   {type: "value", default: 2 * Math.PI},
    sort:       {type: "value", default: false}
  });

  this._output = {
    "start": "layout:start",
    "stop":  "layout:stop",
    "mid":   "layout:mid"
  };

  return this;
}

var proto = (Pie.prototype = new BatchTransform());

function ones() { return 1; }

proto.batchTransform = function(input, data) {
  var g = this._graph,
      output = this._output,
      value = this.value.get(g).accessor || ones,
      start = this.startAngle.get(g),
      stop = this.endAngle.get(g),
      sort = this.sort.get(g);

  var values = data.map(value),
      a = start,
      k = (stop - start) / d3.sum(values),
      index = dl.range(data.length),
      i, t, v;

  if (sort) {
    index.sort(function(a, b) {
      return values[a] - values[b];
    });
  }

  for (i=0; i<index.length; ++i) {
    t = data[index[i]];
    v = values[index[i]];
    tuple.set(t, output.start, a);
    tuple.set(t, output.mid, (a + 0.5 * v * k));
    tuple.set(t, output.stop, (a += v * k));
  }

  input.fields[output.start] = 1;
  input.fields[output.stop] = 1;
  input.fields[output.mid] = 1;
  return input;
};

module.exports = Pie;
