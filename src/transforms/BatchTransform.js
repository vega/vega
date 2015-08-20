var Base = require('./Transform').prototype;

function BatchTransform() {
  // Nearest appropriate collector. 
  // Set by the dataflow Graph during connection.
  this._collector = null; 
}

var prototype = (BatchTransform.prototype = Object.create(Base));
prototype.constructor = BatchTransform;

prototype.init = function(graph) {
  Base.init.call(this, graph);
  return this.batch(true);
};

prototype.transform = function(input) {
  return this.batchTransform(input, this._collector.data());
};

prototype.batchTransform = function(/* input, data */) {
};

module.exports = BatchTransform;
