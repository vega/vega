var DEPS = require('./Dependencies').ALL,
    nodeID = 0;

function Node(graph) {
  if (graph) this.init(graph);
}

var Flags = Node.Flags = {
  Router:     0x01, // Responsible for propagating tuples, cannot be skipped.
  Collector:  0x02, // Holds a materialized dataset, pulse node to reflow.
  Produces:   0x04, // Produces new tuples. 
  Mutates:    0x08, // Sets properties of incoming tuples.
  Reflows:    0x10, // Forwards a reflow pulse.
  Batch:      0x20  // Performs batch data processing, needs collector.
};

var prototype = Node.prototype;

prototype.init = function(graph) {
  this._id = ++nodeID;
  this._graph = graph;
  this._rank  = graph.rank(); // Topological sort by rank
  this._qrank = null; // Rank when enqueued for propagation
  this._stamp = 0;    // Last stamp seen

  this._listeners = [];
  this._listeners._ids = {}; // To prevent duplicate listeners

  // Initialize dependencies.
  this._deps = {};
  for (var i=0, n=DEPS.length; i<n; ++i) {
    this._deps[DEPS[i]] = [];
  }

  // Initialize status flags.
  this._flags = 0;

  return this;
};

prototype.rank = function() {
  return this._rank;
};

prototype.rerank = function() {
  var g = this._graph, 
      q = [this],
      cur;

  while (q.length) {
    cur = q.shift();
    cur._rank = g.rank();
    q.unshift.apply(q, cur.listeners());
  }

  return this;
};

prototype.qrank = function(/* set */) {
  if (!arguments.length) return this._qrank;
  return (this._qrank = this._rank, this);
};

prototype.last = function(stamp) { 
  if (!arguments.length) return this._stamp;
  return (this._stamp = stamp, this);
};

// -- status flags ---

prototype._setf = function(v, b) {
  if (b) { this._flags |= v; } else { this._flags &= ~v; }
  return this;
};

prototype.router = function(state) {
  if (!arguments.length) return (this._flags & Flags.Router);
  return this._setf(Flags.Router, state);
};

prototype.collector = function(state) {
  if (!arguments.length) return (this._flags & Flags.Collector);
  return this._setf(Flags.Collector, state);
};

prototype.produces = function(state) {
  if (!arguments.length) return (this._flags & Flags.Produces);
  return this._setf(Flags.Produces, state);
};

prototype.mutates = function(state) {
  if (!arguments.length) return (this._flags & Flags.Mutates);
  return this._setf(Flags.Mutates, state);
};

prototype.reflows = function(state) {
  if (!arguments.length) return (this._flags & Flags.Reflows);
  return this._setf(Flags.Reflows, state);
};

prototype.batch = function(state) {
  if (!arguments.length) return (this._flags & Flags.Batch);
  return this._setf(Flags.Batch, state);
};

prototype.dependency = function(type, deps) {
  var d = this._deps[type],
      n = d._names || (d._names = {});  // To prevent dupe deps

  // Get dependencies of the given type
  if (arguments.length === 1) {
    return d;
  }

  if (deps === null) {
    // Clear dependencies of the given type
    d.splice(0, d.length);
    d._names = {};
  } else if (!Array.isArray(deps)) {
    // Separate this case to avoid cost of array creation
    if (n[deps]) return this;
    d.push(deps);
    n[deps] = 1;
  } else {
    for (var i=0, len=deps.length, dep; i<len; ++i) {
      dep = deps[i];
      if (n[dep]) continue;
      d.push(dep);
      n[dep] = 1;
    }
  }

  return this;
};

prototype.listeners = function() {
  return this._listeners;
};

prototype.addListener = function(l) {
  if (!(l instanceof Node)) {
    throw Error('Listener is not a Node');
  }
  if (this._listeners._ids[l._id]) return this;

  this._listeners.push(l);
  this._listeners._ids[l._id] = 1;
  if (this._rank > l._rank) {
    l.rerank();
  }

  return this;
};

prototype.removeListener = function(l) {
  if (!this._listeners._ids[l._id]) return false;
  
  var idx = this._listeners.indexOf(l),
      b = idx >= 0;

  if (b) {
    this._listeners.splice(idx, 1);
    this._listeners._ids[l._id] = null;
  }
  return b;
};

prototype.disconnect = function() {
  this._listeners = [];
  this._listeners._ids = {};
};

// Evaluate this dataflow node for the current pulse.
// Subclasses should override to perform custom processing.
prototype.evaluate = function(pulse) {
  return pulse;
};

// Should this node be re-evaluated for the current pulse?
// Searches pulse to see if any dependencies have updated.
prototype.reevaluate = function(pulse) {
  var prop, dep, i, n, j, m;

  for (i=0, n=DEPS.length; i<n; ++i) {
    prop = DEPS[i];
    dep = this._deps[prop];
    for (j=0, m=dep.length; j<m; ++j) {
      if (pulse[prop][dep[j]]) return true;
    }
  }

  return false;
};

Node.reset = function() { nodeID = 0; };

module.exports = Node;
