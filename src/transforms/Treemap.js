var dl = require('datalib'),
    Transform = require('./Transform'),
    Collector = require('../dataflow/Collector'),
    tuple = require('../dataflow/tuple'),
    d3 = require('d3');

function Treemap(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    // hierarchy parameters
    sort: {type: "array<field>", default: ["-value"]},
    children: {type: "field", default: "children"},
    value: {type: "field", default: "value"},
    // treemap parameters
    size: {type: "array<value>", default: [500, 500]},
    round: {type: "value", default: true},
    sticky: {type: "value", default: false},
    ratio: {type: "value", default: 0.5 * (1 + Math.sqrt(5))},
    padding: {type: "value", default: null},
    mode: {type: "value", default: "squarify"}
  });

  this._layout = d3.layout.treemap();

  this._output = {
    "x":      "layout:x",
    "y":      "layout:y",
    "width":  "layout:width",
    "height": "layout:height"
  };
  this._collector = new Collector(graph);

  return this;
}

var proto = (Treemap.prototype = new Transform());

proto.transform = function(input) {
  // Materialize the current datasource. TODO: share collectors
  this._collector.evaluate(input);
  var data = this._collector.data();

  // get variables
  var g = this._graph,
      layout = this._layout,
      output = this._output;

  // configure layout
  layout
    .sort(dl.comparator(this.sort.get(g).fields))
    .children(this.children.get(g).accessor)
    .value(this.value.get(g).accessor)
    .size(this.size.get(g))
    .round(this.round.get(g))
    .sticky(this.sticky.get(g))
    .ratio(this.ratio.get(g))
    .padding(this.padding.get(g))
    .mode(this.mode.get(g))
    .nodes(data[0]);

  // copy layout values to nodes
  data.forEach(function(n) {
    tuple.set(n, output.x, n.x);
    tuple.set(n, output.y, n.y);
    tuple.set(n, output.width, n.dx);
    tuple.set(n, output.height, n.dy);
  });

  // return changeset
  input.fields[output.x] = 1;
  input.fields[output.y] = 1;
  input.fields[output.width] = 1;
  input.fields[output.height] = 1;
  return input;
};

module.exports = Treemap;