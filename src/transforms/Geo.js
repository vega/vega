var dl = require('datalib'),
    d3 = require('d3'),
    Transform = require('./Transform'),
    tuple = require('../dataflow/tuple');

function Geo(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, Geo.Parameters);
  Transform.addParameters(this, {
    lon: {type: "field"},
    lat: {type: "field"}
  });

  this._output = {
    "x": "geo:x",
    "y": "geo:y"
  };
  return this;
}

var None

Geo.Parameters = {
  projection: {type: "value", default: "mercator"},
  center:     {type: "array[value]"},
  translate:  {type: "array[value]"},
  rotate:     {type: "array[value]"},
  scale:      {type: "value"},
  precision:  {type: "value"},
  clipAngle:  {type: "value"},
  clipExtent: {type: "value"}
};

Geo.d3Projection = function() {
  var g = this._graph,
      p = this.projection.get(g),
      param = Geo.Parameters,
      proj, name, value;

  if (p !== this._mode) {
    this._mode = p;
    this._projection = d3.geo[p]();
  }
  proj = this._projection;

  for (name in param) {
    if (name === "projection" || !proj[name]) continue;
    value = this[name].get(g);
    if (value === undefined || (dl.isArray(value) && value.length === 0)) {
      continue;
    }
    if (value !== proj[name]()) {
      proj[name](value);
    }
  }

  return proj;
};

var proto = (Geo.prototype = new Transform());

proto.transform = function(input) {
  var g = this._graph,
      output = this._output,
      lon = this.lon.get(g).accessor,
      lat = this.lat.get(g).accessor,
      proj = Geo.d3Projection.call(this);

  function set(t) {
    var ll = [lon(t), lat(t)];
    var xy = proj(ll);
    tuple.set(t, output.x, xy[0]);
    tuple.set(t, output.y, xy[1]);
  }

  input.add.forEach(set);
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
    input.rem.forEach(set);
  }

  input.fields[output.x] = 1;
  input.fields[output.y] = 1;
  return input;
};

module.exports = Geo;
