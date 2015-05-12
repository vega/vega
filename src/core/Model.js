var Graph = require('../dataflow/Graph'), 
    Node  = require('../dataflow/Node'),
    GroupBuilder = require('../scene/GroupBuilder'),
    changeset = require('../dataflow/changeset'), 
    dl = require('datalib');

function Model() {
  this._defs = {};
  this._predicates = {};
  this._scene = null;

  this._node = null;
  this._builder = null; // Top-level scenegraph builder

  Graph.prototype.init.call(this);
};

var proto = (Model.prototype = new Graph());

proto.defs = function(defs) {
  if (!arguments.length) return this._defs;
  this._defs = defs;
  return this;
};

proto.node = function() {
  return this._node || (this._node = new Node(this));
};

proto.data = function() {
  var data = Graph.prototype.data.apply(this, arguments);
  if(arguments.length > 1) {  // new Datasource
    this.node().addListener(data.pipeline()[0]);
  }

  return data;
};

function predicates(name) {
  var m = this, predicates = {};
  if(!dl.isArray(name)) return this._predicates[name];
  name.forEach(function(n) { predicates[n] = m._predicates[n] });
  return predicates;
}

proto.predicate = function(name, predicate) {
  if(arguments.length === 1) return predicates.call(this, name);
  return (this._predicates[name] = predicate);
};

proto.predicates = function() { return this._predicates; };

proto.scene = function(renderer) {
  if(!arguments.length) return this._scene;
  if(this._builder) this.node().removeListener(this._builder.disconnect());
  this._builder = new GroupBuilder(this, this._defs.marks, this._scene={});
  this.node().addListener(this._builder.connect());
  var p = this._builder.pipeline();
  p[p.length-1].addListener(renderer);
  return this;
};

proto.addListener = function(l) { this.node().addListener(l); };
proto.removeListener = function(l) { this.node().removeListener(l); };

proto.fire = function(cs) {
  if(!cs) cs = changeset.create();
  this.propagate(cs, this.node());
};

module.exports = Model;