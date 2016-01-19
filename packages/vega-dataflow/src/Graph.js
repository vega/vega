var dl = require('datalib'),
    log = require('vega-logging'),
    Heap = require('./Heap'),
    ChangeSet = require('./ChangeSet'),
    DataSource = require('./DataSource'),
    Collector = require('./Collector'),
    Tuple = require('./Tuple'),
    Signal = require('./Signal'),
    Deps = require('./Dependencies');

function Graph() {
}

var prototype = Graph.prototype;

prototype.init = function() {
  this._stamp = 0;
  this._rank  = 0;

  this._data = {};
  this._signals = {};
  this._requestedIndexes = {};

  this.doNotPropagate = {};
};

prototype.rank = function() {
  return ++this._rank;
};

prototype.values = function(type, names, hash) {
  var data = (type === Deps.SIGNALS ? this._signals : this._data),
      n = (names !== undefined ? names : dl.keys(data)),
      vals, i;

  if (Array.isArray(n)) {
    vals = hash || {};
    for (i=0; i<n.length; ++i) {
      vals[n[i]] = data[n[i]].values();
    }
    return vals;
  } else {
    return data[n].values();
  }
};

// Retain for backwards-compatibility
prototype.dataValues = function(names) {
  return this.values(Deps.DATA, names);
};

// Retain for backwards-compatibility
prototype.signalValues = function(names) {
  return this.values(Deps.SIGNALS, names);
};

prototype.data = function(name, pipeline, facet) {
  var db = this._data;
  if (!arguments.length) {
    var all = [], key;
    for (key in db) { all.push(db[key]); }
    return all;
  } else if (arguments.length === 1) {
    return db[name];
  } else {
    return (db[name] = new DataSource(this, name, facet).pipeline(pipeline));
  }
};

prototype.signal = function(name, init) {
  if (arguments.length === 1) {
    var m = this;
    return Array.isArray(name) ?
      name.map(function(n) { return m._signals[n]; }) :
      this._signals[name];
  } else {
    return (this._signals[name] = new Signal(this, name, init));
  }
};

prototype.signalRef = function(ref) {
  if (!Array.isArray(ref)) {
    ref = dl.field(ref);
  }

  var value = this.signal(ref[0]).value();
  if (ref.length > 1) {
    for (var i=1, n=ref.length; i<n; ++i) {
      value = value[ref[i]];
    }
  }
  return value;
};

prototype.requestIndex = function(data, field) {
  var ri  = this._requestedIndexes,
      reg = ri[data] || (ri[data] = {}); 
  return (reg[field] = true, this);
};

prototype.buildIndexes = function() {
  var ri = this._requestedIndexes,
      data = dl.keys(ri),
      i, len, j, jlen, d, src, fields, f;

  for (i=0, len=data.length; i<len; ++i) {
    src = this.data(d=data[i]);
    if (!src) throw Error('Data source '+dl.str(d)+' does not exist.');

    fields = dl.keys(ri[d]);
    for (j=0, jlen=fields.length; j<jlen; ++j) {
      if ((f=fields[j]) === null) continue;
      src.getIndex(f);
      ri[d][f] = null;
    }
  }

  return this;
};

// Stamp should be specified with caution. It is necessary for inline datasources,
// which need to be populated during the same cycle even though propagation has
// passed that part of the dataflow graph. 
// If skipSignals is true, Signal nodes do not get reevaluated but their listeners
// are queued for propagation. This is useful when setting signal values in batch
// (e.g., time travel to the initial state).
prototype.propagate = function(pulse, node, stamp, skipSignals) {
  var pulses = {},
      listeners, next, nplse, tpls, ntpls, i, len, isSg;

  // new PQ with each propagation cycle so that we can pulse branches
  // of the dataflow graph during a propagation (e.g., when creating
  // a new inline datasource).
  var pq = new Heap(function(a, b) {
    // Sort on qrank (queue-rank).
    // Rank can change during propagation due to rewiring.
    return a._qrank - b._qrank;
  });

  if (pulse.stamp) throw Error('Pulse already has a non-zero stamp.');

  pulse.stamp = stamp || ++this._stamp;
  pulses[node._id] = pulse;
  pq.push(node.qrank(true));

  while (pq.size() > 0) {
    node  = pq.peek();
    isSg  = node instanceof Signal;
    pulse = pulses[node._id];

    if (node.rank() !== node.qrank()) {
      // A node's rank might change during a propagation. Re-queue if so.
      pq.replace(node.qrank(true));
    } else {
      // Evaluate node and propagate pulse.
      pq.pop();
      pulses[node._id] = null;
      listeners = node._listeners;

      if (!isSg || (isSg && !skipSignals)) {
        pulse = this.evaluate(pulse, node);
      }

      // Propagate the pulse.
      if (pulse !== this.doNotPropagate) {
        // Ensure reflow pulses always send reflow pulses even if skipped.
        if (!pulse.reflow && node.reflows()) {
          pulse = ChangeSet.create(pulse, true);
        }

        for (i=0, len=listeners.length; i<len; ++i) {
          next = listeners[i];

          if ((nplse = pulses[next._id]) !== undefined) {
            if (nplse === null) throw Error('Already propagated to node.');
            if (nplse === pulse) continue;  // Re-queueing the same pulse.

            // We've already queued this node. Ensure there should be at most one
            // pulse with tuples (add/mod/rem), and the remainder will be reflows.
            tpls  = pulse.add.length || pulse.mod.length || pulse.rem.length;
            ntpls = nplse.add.length || nplse.mod.length || nplse.rem.length;

            if (tpls && ntpls) throw Error('Multiple changeset pulses to same node');

            // Combine reflow and tuples into a single pulse.
            pulses[next._id] = tpls ? pulse : nplse;
            pulses[next._id].reflow = pulse.reflow || nplse.reflow;
          } else {
            // First time we're seeing this node, queue it for propagation.
            pq.push(next.qrank(true));
            pulses[next._id] = pulse;
          }
        }
      }
    }
  }

  return this.done(pulse);
};

// Perform final bookkeeping on the graph, after propagation is complete.
//  - For all updated datasources, synchronize their previous values.
prototype.done = function(pulse) {
  log.debug(pulse, ['bookkeeping']);
  for (var d in pulse.data) { this.data(d).synchronize(); }
  return this;
};

// Process a new branch of the dataflow graph prior to connection:
// (1) Insert new Collector nodes as needed.
// (2) Track + return mutation/routing status of the branch.
prototype.preprocess = function(branch) {
  var graph = this,
      mutates = 0,
      node, router, collector, collects;

  for (var i=0; i<branch.length; ++i) {
    node = branch[i];

    // Batch nodes need access to a materialized dataset.
    if (node.batch() && !node._collector) {
      if (router || !collector) {
        node = new Collector(graph);
        branch.splice(i, 0, node);
        router = false;
      } else {
        node._collector = collector;
      }
    }

    if ((collects = node.collector())) collector = node;
    router  = router  || node.router() && !collects;
    mutates = mutates || node.mutates();

    // A collector needs to be inserted after tuple-producing
    // nodes for correct previous value tracking.
    if (node.produces()) {
      branch.splice(i+1, 0, new Collector(graph));
      router = false;
    }
  }

  return {router: router, collector: collector, mutates: mutates};
};

prototype.connect = function(branch) {
  var collector, node, data, signals, i, n, j, m, x, y;

  // connect the pipeline
  for (i=0, n=branch.length; i<n; ++i) {
    node = branch[i];
    if (node.collector()) collector = node;

    data = node.dependency(Deps.DATA);
    for (j=0, m=data.length; j<m; ++j) {
      if (!(x=this.data(y=data[j]))) {
        throw new Error('Unknown data source ' + dl.str(y));
      }

      x.addListener(collector);
    }

    signals = node.dependency(Deps.SIGNALS);
    for (j=0, m=signals.length; j<m; ++j) {
      if (!(x=this.signal(y=signals[j]))) {
        throw new Error('Unknown signal ' + dl.str(y));
      }

      x.addListener(collector);
    }

    if (i > 0) branch[i-1].addListener(node);
  }

  return branch;
};

prototype.disconnect = function(branch) {
  var collector, node, data, signals, i, n, j, m;

  for (i=0, n=branch.length; i<n; ++i) {
    node = branch[i];
    if (node.collector()) collector = node;

    data = node.dependency(Deps.DATA);
    for (j=0, m=data.length; j<m; ++j) {
      this.data(data[j]).removeListener(collector);
    }

    signals = node.dependency(Deps.SIGNALS);
    for (j=0, m=signals.length; j<m; ++j) {
      this.signal(signals[j]).removeListener(collector);
    }

    node.disconnect();
  }

  return branch;
};

prototype.synchronize = function(branch) {
  var ids = {},
      node, data, i, n, j, m, d, id;

  for (i=0, n=branch.length; i<n; ++i) {
    node = branch[i];
    if (!node.collector()) continue;

    for (j=0, data=node.data(), m=data.length; j<m; ++j) {
      id = (d = data[j])._id;
      if (ids[id]) continue;
      Tuple.prev_update(d);
      ids[id] = 1;
    }
  }

  return this;
};

prototype.reevaluate = function(pulse, node) {
  var reflowed = pulse.reflow && node.last() >= pulse.stamp,
      run = node.router() || pulse.add.length || pulse.rem.length;

  return run || !reflowed || node.reevaluate(pulse);
};

prototype.evaluate = function(pulse, node) {
  if (!this.reevaluate(pulse, node)) return pulse;
  pulse = node.evaluate(pulse);
  node.last(pulse.stamp);
  return pulse;
};

module.exports = Graph;
