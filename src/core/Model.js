define(function(require, exports, module) {
  var Datasource = require('./Datasource'), 
      Signal = require('./Signal'),
      Node = require('./Node'),
      graph = require('./graph'), 
      changeset = require('./changeset'), 
      scene = require('../scene/index'),
      util = require('../util/index');

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

  function signal(name) {
    var m = this, i, len;
    if(!util.isArray(name)) return this._signals[name];
    return name.map(function(n) { m._signals[n]; });
  }

  Model.prototype.signal = function(name, init) {
    var m = this;
    if(arguments.length === 1) return signal.call(this, name);
    return this._signals[name] = new this.Signal(name, init);
  };

  Model.prototype.signalValues = function(name) {
    var signals = {},
        i, len, n;

    if(!util.isArray(name)) return this._signals[name].value();
    for(i=0, len=name.length; i<len; ++i) {
      n = name[i];
      signals[n] = this._signals[n].value();
    }

    return signals;
  };

  Model.prototype.signalRef = function(ref) {
    if(!util.isArray(ref)) ref = util.field(ref);
    var value = this.signal(ref.shift()).value();
    if(ref.length > 0) {
      var fn = Function("s", "return s["+ref.map(util.str).join("][")+"]");
      value = fn.call(null, value);
    }

    return value;
  };

  function predicates(name) {
    var m = this, predicates = {};
    if(!util.isArray(name)) return this._predicates[name];
    name.forEach(function(n) { predicates[n] = m._predicates[n] });
    return predicates;
  }

  Model.prototype.predicate = function(name, predicate) {
    if(arguments.length === 1) return predicates.call(this, name);
    return this._predicates[name] = predicate;
  };

  Model.prototype.addListener = function(l) { this._node.addListener(l); }
  Model.prototype.fire = function(cs) {
    if(!cs) cs = changeset.create({});
    this.graph.propagate(cs, this._node);
  };

  return Model;
});