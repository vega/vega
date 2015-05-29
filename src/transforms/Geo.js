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
    "x": "layout_x",
    "y": "layout_y"
  };
  return this;
}

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
      p = this.param("projection"),
      param = Geo.Parameters,
      proj, name, value;

  if (p !== this._mode) {
    this._mode = p;
    this._projection = d3.geo[p]();
  }
  proj = this._projection;

  for (name in param) {
    if (name === "projection" || !proj[name]) continue;
    value = this.param(name);
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
      lon = this.param("lon").accessor,
      lat = this.param("lat").accessor,
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

Geo.baseSchema = {
  "projection": {
    "type": "string",
    "description": "The type of cartographic projection to use.",
    "default": "mercator"
  },
  "center": {
    "type": "array",
    "description": "The center of the projection.",
    "items": {"type": "number"},
    "minItems": 2,
    "maxItems": 2
  },
  "translate": {
    "type": "array",
    "description": "The translation of the projection.",
    "items": {"type": "number"},
    "minItems": 2,
    "maxItems": 2
  },
  "rotate": {
    "type": "number",
    "description": "The rotation of the projection."
  },
  "scale": {
    "type": "number",
    "description": "The scale of the projection."
  },
  "precision": {
    "type": "number",
    "description": "The desired precision of the projection."
  },
  "clipAngle": {
    "type": "number",
    "description": "The clip angle of the projection."
  },
  "clipExtent": {
    "type": "number",
    "description": "The clip extent of the projection."
  }
};

Geo.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Geo transform",
  "description": "Performs a cartographic projection. Given longitude and latitude values, sets corresponding x and y properties for a mark.",
  "type": "object",
  "properties": dl.extend({
    "type": {"enum": ["geo"]},
    "lon": {
      "type": "string",
      "description": "The input longitude values."
    },
    "lat": {
      "type": "string",
      "description": "The input latitude values."
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "x": {"type": "string", "default": "layout_x"},
        "y": {"type": "string", "default": "layout_y"}
      }
    }
  }, Geo.baseSchema),
  "required": ["type", "lon", "lat"]
};
