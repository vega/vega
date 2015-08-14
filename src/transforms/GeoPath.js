var d3 = require('d3'),
    dl = require('datalib'),
    Tuple = require('vega-dataflow').Tuple,
    log = require('vega-logging'),
    Geo = require('./Geo'),
    Transform = require('./Transform');

function GeoPath(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, Geo.Parameters);
  Transform.addParameters(this, {
    field: {type: 'field', default: null},
  });

  this._output = {
    'path': 'layout_path'
  };
  return this.mutates(true);
}

var prototype = (GeoPath.prototype = Object.create(Transform.prototype));
prototype.constructor = GeoPath;

prototype.transform = function(input) {
  log.debug(input, ['geopath']);

  var output = this._output,
      geojson = this.param('field').accessor || dl.identity,
      proj = Geo.d3Projection.call(this),
      path = d3.geo.path().projection(proj);

  function set(t) {
    Tuple.set(t, output.path, path(geojson(t)));
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
  "title": "GeoPath transform",
  "description": "Creates paths for geographic regions, such as countries, states and counties.",
  "type": "object",
  "properties": dl.extend({
    "type": {"enum": ["geopath"]},
    "field": {
      "description": "The data field containing GeoJSON Feature data.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "path": {"type": "string", "default": "layout_path"}
      },
      "additionalProperties": false
    }
  }, Geo.baseSchema),
  "required": ["type"],
  "additionalProperties": false
};