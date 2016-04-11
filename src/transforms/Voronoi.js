var d3 = require('d3'),
    Tuple = require('vega-dataflow/src/Tuple'),
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function Voronoi(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    clipExtent: {type: 'array<value>', default: require('./screen').extent},
    x: {type: 'field', default: 'layout_x'},
    y: {type: 'field', default: 'layout_y'}
  });

  this._layout = d3.geom.voronoi();
  this._output = {'path': 'layout_path'};

  return this.mutates(true);
}

var prototype = (Voronoi.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Voronoi;

prototype.batchTransform = function(input, data) {
  log.debug(input, ['voronoi']);

  // get variables
  var pathname = this._output.path;

  // configure layout
  var polygons = this._layout
    .clipExtent(this.param('clipExtent'))
    .x(this.param('x').accessor)
    .y(this.param('y').accessor)
    (data);

  // build and assign path strings
  for (var i=0; i<data.length; ++i) {
    if (polygons[i]) Tuple.set(data[i], pathname, 'M' + polygons[i].join('L') + 'Z');
  }

  // return changeset
  input.fields[pathname] = 1;
  return input;
};

module.exports = Voronoi;

Voronoi.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Voronoi transform",
  "type": "object",
  "properties": {
    "type": {"enum": ["voronoi"]},
    "clipExtent": {
      "description": "The min and max points at which to clip the voronoi diagram.",
      "oneOf": [
        {
          "type": "array",
          "items": {
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
          "minItems": 2,
          "maxItems": 2
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": [[-1e5,-1e5],[1e5,1e5]]
    },
    "x": {
      "description": "The input x coordinates.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "y": {
      "description": "The input y coordinates.",
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
  },
  "additionalProperties": false,
  "required": ["type"]
};
