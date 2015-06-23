var Transform = require('./Transform'),
    Collector = require('vega-dataflow/src/Collector');

function BatchTransform() {
  // Funcptr to nearest shared upstream collector. 
  // Populated by the dataflow Graph during connection.
  this.data = null; 
}

var proto = (BatchTransform.prototype = new Transform());

proto.init = function(graph) {
  Transform.prototype.init.call(this, graph);
  return this.batch(true);
};

proto.transform = function(input) {
  return this.batchTransform(input, this.data());
};

proto.batchTransform = function(input, data) {
};

module.exports = BatchTransform;
