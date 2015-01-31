define(function(require, exports, module) {
  var util = require('../util/index'),
      C = require('../util/constants'),
      REEVAL = [C.DATA, C.FIELDS, C.SCALES, C.SIGNALS];

  function Node(graph) {
    if(graph) this.init(graph);
  }

  var proto = Node.prototype;

  proto.init = function(graph) {
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

    this._isRouter = false; // Responsible for propagating tuples, cannot ever be skipped
    this._isCollector = false;  // Holds a materialized dataset, pulse to reflow
    this._needsPrev = false; // Does the operator require tuples' previous values? 
    return this;
  };

  proto.clone = function() {
    var n = new Node(this._graph);
    n.evaluate = this.evaluate;
    n._deps = this._deps;
    n._isRouter = this._isRouter;
    n._isCollector = this._isCollector;
    return n;
  };

  proto.rank = function() { return this._rank; };

  proto.last = function(stamp) { 
    if(!arguments.length) return this._stamp;
    this._stamp = stamp;
    return this;
  };

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
    if(!arguments.length) return this._isRouter;
    this._isRouter = !!bool
    return this;
  };

  proto.collector = function(bool) {
    if(!arguments.length) return this._isCollector;
    this._isCollector = !!bool;
    return this;
  };

  proto.prev = function(bool) {
    if(!arguments.length) return this._needsPrev;
    this._needsPrev = !!bool;
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
    var foundSending = false;
    for (var i = 0, len = this._listeners.length; i < len && !foundSending; i++) {
      if (this._listeners[i] === l) {
        this._listeners.splice(i, 1);
        foundSending = true;
      }
    }
    
    return foundSending;
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
    return REEVAL.some(function(prop) {
      reeval = reeval || node._deps[prop].some(function(k) { return !!pulse[prop][k] });
      return reeval;
    });

    return this;
  };

  return Node;
});

