var Transform = require('./Transform'),
    Aggregate = require('./Aggregate');

function Facet(graph) {
  Transform.addParameters(this, {
    transform: {
      type: "custom",
      set: function(pipeline) {
        return (this._transform._pipeline = pipeline, this._transform);
      },
      get: function() {
        var parse = require('../parse/transforms'),
            facet = this._transform;
        return facet._pipeline.map(function(t) {
          return parse(facet._graph, t);
        });
      }
    }
  });

  this._pipeline = [];
  return Aggregate.call(this, graph);
}

var prototype = (Facet.prototype = Object.create(Aggregate.prototype));
prototype.constructor = Facet;

prototype.aggr = function() {
  return Aggregate.prototype.aggr.call(this).facet(this);
};

prototype.transform = function(input, reset) {
  var output  = Aggregate.prototype.transform.call(this, input, reset);

  // New facet cells should trigger a re-ranking of the dataflow graph.
  // This ensures facet datasources are computed before scenegraph nodes.
  // We rerank the Facet's first listener, which is the next node in the
  // datasource's pipeline.
  if (input.add.length) {
    this.listeners()[0].rerank();
  }

  return output;
};

module.exports = Facet;

var dl = require('datalib');

Facet.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Facet transform",
  "description": "A special aggregate transform that organizes a data set into groups or \"facets\".",
  "type": "object",
  "properties": dl.extend({}, Aggregate.schema.properties, {
    "type": {"enum": ["facet"]},
    "transform": {"$ref": "#/defs/transform"}
  }),
  "additionalProperties": false,
  "required": ["type"]
};
