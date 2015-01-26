define(function(require, exports, module) {
  var Graph = require('../dataflow/Graph'), 
      Node  = require('../dataflow/Node'),
      changeset = require('../dataflow/changeset'), 
      // scene = require('../scene/index'),
      util = require('../util/index');

  function Model() {
    this._stamp = 0;
    this._rank  = 0;

    this._defs = {};
    this._predicates = {};

    this.graph = new Graph();
    // this.scene = scene(this);

    this._node = new Node(this.graph);
  };

  var proto = Model.prototype;

  prototype.defs = function(defs) {
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

  proto.addListener = function(l) { this._node.addListener(l); }
  proto.removeListener = function(l) { this._node.removeListener(l); }

  proto.fire = function(cs) {
    if(!cs) cs = changeset.create();
    this.graph.propagate(cs, this._node);
  };

  return Model;
});