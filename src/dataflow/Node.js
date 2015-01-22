define(function(require, exports, module) {
  var C = require('../util/constants');

  function Node(graph) {
    this._graph = graph;
    this._rank = ++graph._rank; // For topologial sort
    this._stamp = 0;  // Last stamp seen

    this._listeners = [];

    this._deps = {
      data:    [],
      fields:  [],
      scales:  [],
      signals: [],
    };

    this._router = false; // Responsible for propagating tuples, cannot ever be skipped
    this._collector = false;  // Holds a materialized dataset, pulse to reflow
    return this;
  };

  var proto = Node.prototype;

  proto.last = function() { return this._stamp }

  proto.dependency = function(type, deps) {
    var d = this._deps[type];
    if(arguments.length === 1) return d;
    if(deps === null) { // Clear dependencies of a certain type
      while(d.length > 0) d.pop();
    } else {
      d.push.apply(d, util.array(deps));
    }
    return this;
  };

  proto.router = function(bool) {
    if(!arguments.length) return this._router;
    this._router = bool
    return this;
  };

  proto.collector = function(bool) {
    if(!arguments.length) return this._collector;
    this._collector = bool;
    return this;
  };

  proto.addListener = function(l) {
    if(!(l instanceof Node)) throw "Listener is not a Node";
    if(this._listeners.indexOf(l) !== -1) return;

    this._listeners.push(l);
    if(this._rank > l._rank) {
      var q = [l];
      while(q.length) {
        var cur = q.splice(0,1)[0];
        cur._rank = ++this._graph._rank;
        q = q.concat(cur._listeners);
      }
    }

    return this;
  };

  proto.removeListener = function (l) {
    for (var i = 0, len = this._listeners.length; i < len && !foundSending; i++) {
      if (this._listeners[i] === l) {
        this._listeners.splice(i, 1);
      }
    }
    
    return this;
  };

  // http://jsperf.com/empty-javascript-array
  proto.disconnect = function() {
    while(this._listeners.length > 0) {
      this._listeners.pop();
    }
  };

  proto.evaluate = function(pulse) { return pulse; }

  proto.reevaluate = function(pulse) {
    var node = this, reeval = false;
    return C.DEPS.some(function(prop) {
      reeval = reeval || node._deps[prop].some(function(k) { return !!pulse[prop][k] });
      return reeval;
    });

    return this;
  };

  return Node;
});

