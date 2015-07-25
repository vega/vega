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
    // Topological sort on qrank as rank may change during propagation.
    return a.qrank() - b.qrank();
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

// Connect a branch of dataflow nodes. 
// Dependencies are wired to the nearest collector. 
function forEachNode(branch, fn) {
  var node, collector, router, i;

  for (i=0; i<branch.length; ++i) {
    node = branch[i];

    // Share collectors between batch transforms. We can reuse an
    // existing collector unless a router node has come after it,
    // in which case, we splice in a new collector.
    if (!node.data && node.batch()) {
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
