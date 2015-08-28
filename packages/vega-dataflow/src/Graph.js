var dl = require('datalib'),
    Heap = require('./Heap'),
    ChangeSet = require('./ChangeSet'),
    DataSource = require('./DataSource'),
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

// Stamp should be specified with caution. It is necessary for inline datasources,
// which need to be populated during the same cycle even though propagation has
// passed that part of the dataflow graph.  
prototype.propagate = function(pulse, node, stamp) {
  var pulses = {},
      listeners, next, nplse, tpls, ntpls, i, len;

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
    pulse = pulses[node._id];

    if (node.rank() !== node.qrank()) {
      // A node's rank might change during a propagation. Re-queue if so.
      pq.replace(node.qrank(true));
    } else {
      // Evaluate node and propagate pulse.
      pq.pop();
      pulses[node._id] = null;
      listeners = node._listeners;
      pulse = this.evaluate(pulse, node);

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
};

prototype.connect = function(branch) {
  var collector, node, data, signals, i, n, j, m;

  // connect the pipeline
  for (i=0, n=branch.length; i<n; ++i) {
    node = branch[i];
    if (node.collector()) collector = node;

    data = node.dependency(Deps.DATA);
    for (j=0, m=data.length; j<m; ++j) {
      this.data(data[j]).addListener(collector);
    }

    signals = node.dependency(Deps.SIGNALS);
    for (j=0, m=signals.length; j<m; ++j) {
      this.signal(signals[j]).addListener(collector);
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
