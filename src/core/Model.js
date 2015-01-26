define(function(require, exports, module) {
  var Graph = require('../dataflow/Graph'), 
      Node  = require('../dataflow/Node'),
      Builder = require('../scene/Builder'),
      changeset = require('../dataflow/changeset'), 
      util = require('../util/index');

  function Model() {
    this._defs = {};
    this._predicates = {};
    this._scene = null;

    this.graph = new Graph();

    this._node = new Node(this.graph);
    this._builder = null; // Top-level scenegraph builder
  };

  var proto = Model.prototype;

  proto.defs = function(defs) {
    if (!arguments.length) return this._defs;
    this._defs = defs;
    return this;
  };

  proto.data = function() {
    var data = this.graph.data.apply(this.graph, arguments);
    if(arguments.length > 1) {  // new Datasource
      this._node.addListener(data._pipeline[0]);
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
    if(this._builder) this._node.removeListener(this._builder.disconnect());
    this._builder = new Builder(this, renderer, this._defs.marks, this._scene={});
    this._node.addListener(this._builder);
    return this;
  };

  // Helper method to run signals through top-level scales
  proto.scale = function(spec, value) {
    if(!spec.scale) return value;
    var scale = this._scene.items[0].scale(spec.scale);
    if(!scale) return value;
    return spec.invert ? scale.invert(value) : scale(value);
  };

  proto.addListener = function(l) { this._node.addListener(l); };
  proto.removeListener = function(l) { this._node.removeListener(l); };

  proto.fire = function(cs) {
    if(!cs) cs = changeset.create();
    this.graph.propagate(cs, this._node);
  };

  return Model;
});