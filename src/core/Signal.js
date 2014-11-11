define(function(require, exports, module) {
  var changeset = require('./changeset'),
      util = require('../util/index');

  return function(model) {
    function Signal(name, init) {
      this._name  = name;
      this._value = init;
      this._node  = new model.Node();
    };

    Signal.prototype.name = function() { return this._name; };

    Signal.prototype.node = function(node) {
      if(!arguments.length) return this._node;
      this._node = node;
      return this;
    };

    Signal.prototype.value = function(val) {
      if(!arguments.length) return this._value;
      this._value = val;
      return this;
    };

    Signal.prototype.fire = function() {
      var c = changeset.create({}, true);
      c.signals[this._name] = 1;
      model.graph.propagate(c, this._node);
    };

    Signal.prototype.addListener = function(l) { 
      if(l instanceof Signal) l = l.node();
      this._node.addListener(l); 
    };

    Signal.prototype.removeListener = function(l) { 
      if(l instanceof Signal) l = l.node();
      this._node.removeListener(l); 
    };

    return Signal;
  };
})