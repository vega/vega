var util = require('datalib/src/util'),
    Heap = require('./Heap'),
    ChangeSet = require('./ChangeSet'),
    DataSource = require('./DataSource'),
    Collector = require('./Collector'),
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

prototype.dataValues = function(names) {
  var data = this._data, k;
  if (!arguments.length) {
    names = [];
    for (k in data) names.push(k);
  }
  if (Array.isArray(names)) {
    return names.reduce(function(db, name) {
      return (db[name] = data[name].values(), db);
    }, {});
  } else {
    return data[names].values();
  }
};

function signal(names) {
  var m = this;
  if (Array.isArray(names)) {
    return names.map(function(name) {
      return m._signals[name];
    });
  } else {
    return this._signals[names];
  }
}

prototype.signal = function(name, init) {
  if (arguments.length === 1) {
    return signal.call(this, name);
  } else {
    return (this._signals[name] = new Signal(this, name, init));
  }
};

// TODO: separate into signalValue and signalValues?
prototype.signalValues = function(names) {
  if (!arguments.length) {
    names = [];
    for (var k in this._signals) names.push(k);
  }
  if (Array.isArray(names)) {
    var values = {};
    for (var i=0, n=names.length; i<n; ++i) {
      values[names[i]] = this._signals[names[i]].value();
    }
    return values;
  } else {
    return this._signals[names].value();
  }
};

prototype.signalRef = function(ref) {
  if (!Array.isArray(ref)) {
    ref = util.field(ref);
  }

  var value = this.signal(ref[0]).value();
  if (ref.length > 1) {
    for (var i=1, n=ref.length; i<n; ++i) {
      value = value[ref[i]];
    }
  }
  return value;
};

var schedule = function(a, b) {
  if (a.rank !== b.rank) {  
    // Topological sort
    return a.rank - b.rank;
  } else {
    // If queueing multiple pulses to the same node, then there will be
    // at most one pulse with a changeset (add/mod/rem), and the remainder
    // will be reflows. Combine the changeset and reflows into a single pulse
    // and queue that first. Subsequent reflow-only pulses will be pruned.
    var pa = a.pulse, pb = b.pulse,
        paCS = pa.add.length || pa.mod.length || pa.rem.length,
        pbCS = pb.add.length || pb.mod.length || pb.rem.length;

    pa.reflow = pb.reflow = pa.reflow || pb.reflow;

    if (paCS && pbCS) throw Error('Both pulses have changesets.');
    return paCS ? -1 : 1;
  }
};

// Stamp should be specified with caution. It is necessary for inline datasources,
// which need to be populated during the same cycle even though propagation has
// passed that part of the dataflow graph.  
prototype.propagate = function(pulse, node, stamp) {
  var v, l, n, p, r, i, len, reflowed;

  // new PQ with each propagation cycle so that we can pulse branches
  // of the dataflow graph during a propagation (e.g., when creating
  // a new inline datasource).
  var pq = new Heap(schedule); 

  if (pulse.stamp) throw Error('Pulse already has a non-zero stamp.');

  pulse.stamp = stamp || ++this._stamp;
  pq.push({node: node, pulse: pulse, rank: node.rank()});

  while (pq.size() > 0) {
    v = pq.peek();
    n = v.node;
    p = v.pulse;
    reflowed = p.reflow && n.last() >= p.stamp;

    if (reflowed) {
      // Don't needlessly reflow ops.
      pq.pop();
    } else if (v.rank !== (r = n.rank())) {
      // A node's rank might change during a propagation. Re-queue if so.
      v.rank = r;
      pq.replace(v);
    } else {
      // Evaluate node and propagate pulse.
      pq.pop();
      l = n._listeners;
      p = this.evaluate(p, n);

      // Propagate the pulse. 
      if (p !== this.doNotPropagate) {
        if (!p.reflow && n.reflows()) { // If skipped eval of reflows node
          p = ChangeSet.create(p, true);
        }
        for (i=0, len=l.length; i<len; ++i) {
          pq.push({node: l[i], pulse: p, rank: l[i]._rank});
        }
      }
    }
  }
};

// Connect a branch of dataflow nodes. 
// Dependencies are wired to the nearest collector. 
function forEachNode(branch, fn) {
  var node, collector, router, i, n;

  for (i=0, n=branch.length; i<n; ++i) {
    node = branch[i];

    // Share collectors between batch transforms. We can reuse an
    // existing collector unless a router node has come after it,
    // in which case, we splice in a new collector.
    if (!node.data && node.batch()) { /* TODO: update transforms! */
      if (router) {
        branch.splice(i, 0, (node = new Collector(this)));
      } else {
        node.data = collector.data.bind(collector);
      }
    } 

    if (node.collector()) collector = node;
    router = node.router() && !node.collector(); 
    fn(node, collector, i);
  }
}

prototype.connect = function(branch) {
  var graph = this;

  forEachNode.call(this, branch, function(n, c, i) {
    var data = n.dependency(Deps.DATA),
        signals = n.dependency(Deps.SIGNALS);

    if (data.length > 0) {
      data.forEach(function(d) { 
        graph.data(d)
          .revises(n.revises())
          .addListener(c);
      });
    }

    if (signals.length > 0) {
      signals.forEach(function(s) { graph.signal(s).addListener(c); });
    }

    if (i > 0) {
      branch[i-1].addListener(branch[i]);
    }
  });

  return branch;
};

prototype.disconnect = function(branch) {
  var graph = this;

  forEachNode.call(this, branch, function(n, c) {
    var data = n.dependency(Deps.DATA),
        signals = n.dependency(Deps.SIGNALS);

    if (data.length > 0) {
      data.forEach(function(d) { graph.data(d).removeListener(c); });
    }

    if (signals.length > 0) {
      signals.forEach(function(s) { graph.signal(s).removeListener(c); });
    }

    n.disconnect();  
  });

  return branch;
};

prototype.reevaluate = function(pulse, node) {
  var reflowed = !pulse.reflow || (pulse.reflow && node.last() >= pulse.stamp),
      run = !!pulse.add.length || !!pulse.rem.length || node.router();

  return run || !reflowed || node.reevaluate(pulse);
};

prototype.evaluate = function(pulse, node) {
  if (!this.reevaluate(pulse, node)) return pulse;
  pulse = node.evaluate(pulse);
  node.last(pulse.stamp);
  return pulse;
};

module.exports = Graph;
