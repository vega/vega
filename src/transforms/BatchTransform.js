var Transform = require('./Transform'),
    Collector = require('../dataflow/Collector');

function BatchTransform() {
}

var proto = (BatchTransform.prototype = new Transform());

proto.init = function(graph) {
  Transform.prototype.init.call(this, graph);
  this._collector = new Collector(graph);
  return this;
};

proto.transform = function(input) {
  // Materialize the current datasource.
  // TODO: efficiently share collectors
  this._collector.evaluate(input);
  var data = this._collector.data();
  return this.batchTransform(input, data);
};

proto.batchTransform = function(input, data) {
};

module.exports = BatchTransform;
