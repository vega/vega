var d3 = require('d3'),
    dl = require('datalib'),
    Tuple = require('vega-dataflow').Tuple,
    log = require('vega-logging'),
    Transform = require('./Transform');

function Geo(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, Geo.Parameters);
  Transform.addParameters(this, {
    lon: {type: 'field'},
    lat: {type: 'field'}
  });

  this._output = {
    'x': 'layout_x',
    'y': 'layout_y'
  };
  return this.mutates(true);
}

Geo.Parameters = {
  projection: {type: 'value', default: 'mercator'},
  center:     {type: 'array<value>'},
  translate:  {type: 'array<value>', default: require('./screen').center},
  rotate:     {type: 'array<value>'},
  scale:      {type: 'value'},
  precision:  {type: 'value'},
  clipAngle:  {type: 'value'},
  clipExtent: {type: 'value'}
};

Geo.d3Projection = function() {
  var p = this.param('projection'),
      param = Geo.Parameters,
      proj, name, value;

  if (p !== this._mode) {
    this._mode = p;
    this._projection = d3.geo[p]();
  }
  proj = this._projection;

  for (name in param) {
    if (name === 'projection' || !proj[name]) continue;
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

var prototype = (Geo.prototype = Object.create(Transform.prototype));
prototype.constructor = Geo;

prototype.transform = function(input) {
  log.debug(input, ['geo']);

  var output = this._output,
      lon = this.param('lon').accessor,
      lat = this.param('lat').accessor,
      proj = Geo.d3Projection.call(this);

  function set(t) {
    var ll = [lon(t), lat(t)];
    var xy = proj(ll) || [null, null];
    Tuple.set(t, output.x, xy[0]);
    Tuple.set(t, output.y, xy[1]);
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
    "description": "The type of cartographic projection to use.",
    "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
    "default": "mercator"
  },
  "center": {
    "description": "The center of the projection.",
    "oneOf": [
      {
        "type": "array",
        "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
        "minItems": 2,
        "maxItems": 2
      },
      {"$ref": "#/refs/signal"}
    ]
  },
  "translate": {
    "description": "The translation of the projection.",
    "oneOf": [
      {
        "type": "array",
        "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
        "minItems": 2,
        "maxItems": 2
      },
      {"$ref": "#/refs/signal"}
    ]
  },
  "rotate": {
    "description": "The rotation of the projection.",
    "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
  },
  "scale": {
    "description": "The scale of the projection.",
    "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
  },
  "precision": {
    "description": "The desired precision of the projection.",
    "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
  },
  "clipAngle": {
    "description": "The clip angle of the projection.",
    "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
  },
  "clipExtent": {
    "description": "The clip extent of the projection.",
    "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
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
      "description": "The input longitude values.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "lat": {
      "description": "The input latitude values.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "x": {"type": "string", "default": "layout_x"},
        "y": {"type": "string", "default": "layout_y"}
      },
      "additionalProperties": false
    }
  }, Geo.baseSchema),
  "required": ["type", "lon", "lat"],
  "additionalProperties": false
};

