var Base = require('./Transform').prototype;

function BatchTransform() {
  // Funcptr to nearest shared upstream collector. 
  // Populated by the dataflow Graph during connection.
  this.data = null; 
}

var prototype = (BatchTransform.prototype = Object.create(Base));
prototype.constructor = BatchTransform;

prototype.init = function(graph) {
  Base.init.call(this, graph);
  return this.batch(true);
};

prototype.transform = function(input) {
  return this.batchTransform(input, this.data());
};

prototype.batchTransform = function(/* input, data */) {
};

module.exports = BatchTransform;
