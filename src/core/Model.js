var util = require('datalib/src/util'),
    changeset = require('vega-dataflow/src/ChangeSet'),
    Graph = require('vega-dataflow/src/Graph'), 
    Node  = require('vega-dataflow/src/Node'),
    GroupBuilder = require('../scene/GroupBuilder'),
    visit = require('../scene/visit');

function Model() {
  this._defs = {};
  this._predicates = {};
  this._scene = null;

  this._node = null;
  this._builder = null; // Top-level scenegraph builder

  this._reset = {axes: false, legends: false};

  Graph.prototype.init.call(this);
};

var proto = (Model.prototype = new Graph());

proto.defs = function(defs) {
  if (!arguments.length) return this._defs;
  this._defs = defs;
  return this;
};

proto.width = function(width) {
  if (this._defs) this._defs.width = width;
  if (this._defs && this._defs.marks) this._defs.marks.width = width;
  if (this._scene) this._scene.items[0].width = width;
  this._reset.axes = true;
  return this;
};

proto.height = function(height) {
  if (this._defs) this._defs.height = height;
  if (this._defs && this._defs.marks) this._defs.marks.height = height;
  if (this._scene) this._scene.items[0].height = height;
  this._reset.axes = true;
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
  if(!util.isArray(name)) return this._predicates[name];
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

proto.reset = function() {
  if (this._scene && this._reset.axes) {
    visit(this._scene, function(item) {
      if (item.axes) item.axes.forEach(function(axis) { axis.reset(); });
    });
    this._reset.axes = false;
  }
  if (this._scene && this._reset.legends) {
    visit(this._scene, function(item) {
      if (item.legends) item.legends.forEach(function(l) { l.reset(); });
    });
    this._reset.legends = false;
  }
  return this;
};

proto.addListener = function(l) { this.node().addListener(l); };
proto.removeListener = function(l) { this.node().removeListener(l); };

proto.fire = function(cs) {
  if(!cs) cs = changeset.create();
  this.propagate(cs, this.node());
};

module.exports = Model;