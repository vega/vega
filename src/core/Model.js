define(function(require, exports, module) {
  var vg = require('vega'), 
      Datasource = require('./Datasource'), 
      Signal = require('./Signal'),
      Node = require('./Node'),
      graph = require('./graph'), 
      changeset = require('./changeset'), 
      scene = require('../scene/index');

  function Model() {
    this._stamp = 0;
    this._rank  = 0;

    this._defs = {};
    this._data = {};
    this._signals = {};
    this._predicates = {};

    this.Datasource = Datasource(this);
    this.Signal = Signal(this);
    this.Node = Node(this);
    this.graph = graph(this);
    this.scene = scene(this);

    this._node = new this.Node();
  };

  Model.prototype.data = function(name, pipeline, facet) {
    if(arguments.length === 1) return this._data[name];
    return this._data[name] = new this.Datasource(name, facet)
      .pipeline(pipeline);
  };

  function signals(name) {
    var m = this, signals = {};
    if(!vg.isArray(name)) return this._signals[name];
    name.forEach(function(n) { signals[n] = m._signals[n].value() });
    return signals;
  }

  Model.prototype.signal = function(name, init) {
    var m = this;
    if(arguments.length === 1) return signals.call(this, name);
    return this._signals[name] = new this.Signal(name, init);
  };

  function predicates(name) {
    var m = this, predicates = {};
    if(!vg.isArray(name)) return this._predicates[name];
    name.forEach(function(n) { predicates[n] = m._predicates[n] });
    return predicates;
  }

  Model.prototype.predicate = function(name, predicate) {
    if(arguments.length === 1) return predicates.call(this, name);
    return this._predicates[name] = predicate;
  };

  Model.prototype.addListener = function(l) { this._node.addListener(l); }
  Model.prototype.fire = function() {
    var c = changeset.create({}); 
    this.graph.propagate(c, this._node);
  };

  return Model;
});