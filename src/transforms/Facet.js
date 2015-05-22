var Transform = require('./Transform'),
    Aggregate = require('./Aggregate');

function Facet(graph) {
  this._pipeline = [];
  return Aggregate.call(this, graph);
}

var proto = (Facet.prototype = Object.create(Aggregate.prototype));

proto.pipeline = {
  set: function(facet, pipeline) {
    facet._pipeline = pipeline;
    return facet;
  },
  get: function(model, facet) {
    var parse = require('../parse/transforms');
    return facet._pipeline.map(function(t) { return parse(model, t) });
  }
};

proto.aggr = function() {
  return Aggregate.prototype.aggr.call(this).facet(this);
};

module.exports = Facet;