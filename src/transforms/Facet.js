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
  Aggregate.call(this, graph);
}

var prototype = (Facet.prototype = Object.create(Aggregate.prototype));
prototype.constructor = Facet;

prototype.aggr = function() {
  return Aggregate.prototype.aggr.call(this).facet(this);
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
  "required": ["type", "groupby"]
};
