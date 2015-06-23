var util = require('datalib/src/util'),
    Heap = require('heap'),
    Datasource = require('./Datasource'),
    Signal = require('./Signal'),
    Collector = require('./Collector'),
    BatchTransform = require('../transforms/BatchTransform'),
    changeset = require('./changeset'),
    log = require('../util/log'),
    C = require('../util/constants');

function Graph() {
}

var proto = Graph.prototype;

proto.init = function() {
  this._stamp = 0;
  this._rank  = 0;

  this._data = {};
  this._signals = {};

  this.doNotPropagate = {};
};

proto.data = function(name, pipeline, facet) {
  var db = this._data;
  if(!arguments.length) return util.keys(db).map(function(d) { return db[d]; });
  if(arguments.length === 1) return db[name];
  return (db[name] = new Datasource(this, name, facet).pipeline(pipeline));
};

proto.dataValues = function(names) {
  var graph = this;
  if (!arguments.length) names = util.keys(this._data);
  if (!util.isArray(names)) return this._data[names].values();
  return names.reduce(function(db, n) {
    return (db[n] = graph._data[n].values(), db);
  }, {});
};

function signal(name) {
  var m = this, i, len;
  if(!util.isArray(name)) return this._signals[name];
  return name.map(function(n) { m._signals[n]; });
}

proto.signal = function(name, init) {
  var m = this;
  if(arguments.length === 1) return signal.call(this, name);
  return (this._signals[name] = new Signal(this, name, init));
};

proto.signalValues = function(names) {
  var graph = this;
  if(!arguments.length) names = util.keys(this._signals);
  if(!util.isArray(names)) return this._signals[names].value();
  return names.reduce(function(sg, n) {
    return (sg[n] = graph._signals[n].value(), sg);
  }, {});
};

proto.signalRef = function(ref) {
  if(!util.isArray(ref)) ref = util.field(ref);
  var value = this.signal(ref.shift()).value();
  if(ref.length > 0) {
    var fn = Function("s", "return s["+ref.map(util.str).join("][")+"]");
    value = fn.call(null, value);
  }

  return value;
};

var schedule = function(a, b) {
  // If the nodes are equal, propagate the non-reflow pulse first,
  // so that we can ignore subsequent reflow pulses. 
  if(a.rank == b.rank) return a.pulse.reflow ? 1 : -1;
  else return a.rank - b.rank; 
};

proto.propagate = function(pulse, node) {
  var v, l, n, p, r, i, len, reflowed;

  // new PQ with each propagation cycle so that we can pulse branches
  // of the dataflow graph during a propagation (e.g., when creating
  // a new inline datasource).
  var pq = new Heap(schedule); 

  if(pulse.stamp) throw "Pulse already has a non-zero stamp"

  pulse.stamp = ++this._stamp;
  pq.push({ node: node, pulse: pulse, rank: node.rank() });

  while (pq.size() > 0) {
    v = pq.pop(), n = v.node, p = v.pulse, r = v.rank, l = n._listeners;
    reflowed = p.reflow && n.last() >= p.stamp;

    if(reflowed) continue; // Don't needlessly reflow ops.

    // A node's rank might change during a propagation (e.g. instantiating
    // a group's dataflow branch). Re-queue if it has. T
    // TODO: use pq.replace or pq.poppush?
    if(r != n.rank()) {
      log.debug(p, ['Rank mismatch', r, n.rank()]);
      pq.push({ node: n, pulse: p, rank: n.rank() });
      continue;
    }

    p = this.evaluate(p, n);

    // Even if we didn't run the node, we still want to propagate 
    // the pulse. 
    if (p !== this.doNotPropagate) {
      p.reflow = p.reflow || n.reflows(); // If skipped eval of reflows node
      for (i = 0, len = l.length; i < len; i++) {
        pq.push({ node: l[i], pulse: p, rank: l[i]._rank });
      }
    }
  }
};

// Connect a branch of dataflow nodes. 
// Dependencies get wired to the nearest collector. 
function forEachNode(branch, fn) {
  var node, collector, router, i;
  for(i=0; i<branch.length; ++i) {
    node = branch[i];

    // Share collectors between batch transforms. We can reuse an
    // existing collector unless a router node has come after it,
    // in which case, we splice in a new collector.
    if (node instanceof BatchTransform && !node.data) {
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

proto.connect = function(branch) {
  log.debug({}, ['connecting']);
  var graph = this;

  forEachNode.call(this, branch, function(n, c, i) {
    var data = n.dependency(C.DATA),
        signals = n.dependency(C.SIGNALS);

    if(data.length > 0) {
      data.forEach(function(d) { 
        graph.data(d)
          .revises(n.revises())
          .addListener(c);
      });
    }

    if(signals.length > 0) {
      signals.forEach(function(s) { graph.signal(s).addListener(c); });
    }

    if(i > 0) {
      branch[i-1].addListener(branch[i]);
    }
  });

  return branch;
};

proto.disconnect = function(branch) {
  log.debug({}, ['disconnecting']);
  var graph = this;

  forEachNode.call(this, branch, function(n, c, i) {
    var data = n.dependency(C.DATA),
        signals = n.dependency(C.SIGNALS);

    if(data.length > 0) {
      data.forEach(function(d) { graph.data(d).removeListener(c); });
    }

    if(signals.length > 0) {
      signals.forEach(function(s) { graph.signal(s).removeListener(c) });
    }

    n.disconnect();  
  });

  return branch;
};

proto.reevaluate = function(pulse, node) {
  var reflowed = !pulse.reflow || (pulse.reflow && node.last() >= pulse.stamp),
      run = !!pulse.add.length || !!pulse.rem.length || node.router();
  run = run || !reflowed;
  return run || node.reevaluate(pulse);
};

proto.evaluate = function(pulse, node) {
  if(!this.reevaluate(pulse, node)) return pulse;
  pulse = node.evaluate(pulse);
  node.last(pulse.stamp);
  return pulse
};

module.exports = Graph;