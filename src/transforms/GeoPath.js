var dl = require('datalib'),
    d3 = require('d3'),
    Geo = require('./Geo'),
    Transform = require('./Transform'),
    tuple = require('../dataflow/tuple');

function GeoPath(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, Geo.Parameters);
  Transform.addParameters(this, {
    value: {type: "field", default: null},
  });

  this._output = {
    "path": "layout_path"
  };
  return this;
}

var proto = (GeoPath.prototype = new Transform());

proto.transform = function(input) {
  var output = this._output,
      geojson = this.param("value").accessor || dl.identity,
      proj = Geo.d3Projection.call(this),
      path = d3.geo.path().projection(proj);

  function set(t) {
    tuple.set(t, output.path, path(geojson(t)));
  }

  input.add.forEach(set);
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
    input.rem.forEach(set);
  }

  input.fields[output.path] = 1;
  return input;
};

module.exports = GeoPath;
GeoPath.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Geopath transform",
  "description": "Creates paths for geographic regions, such as countries, states and counties.",
  "type": "object",
  "properties": dl.extend({
    "type": {"enum": ["geopath"]},
    "value": {
      "description": "The data field containing GeoJSON Feature data.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "path": {"type": "string", "default": "layout_path"}
      }
    }
  }, Geo.baseSchema),
  "required": ["type"]
};