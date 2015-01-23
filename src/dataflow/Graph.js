define(function(require, exports, module) {
  var d3 = require('d3'),
      Datasource = require('./Datasource'),
      Signal = require('./Signal'),
      changeset = require('./changeset'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Graph() {
    this._stamp = 0;
    this._rank = 0;

    this._data  = {};
    this._signals = {};

    this.doNotPropagate = {};
  }

  var proto = Graph.prototype;

  proto.data = function(name, pipeline, facet) {
    if(arguments.length === 1) return this._data[name];
    return this._data[name] = new Datasource(this, name, facet)
      .pipeline(pipeline);
  };

  function signal(name) {
    var m = this, i, len;
    if(!util.isArray(name)) return this._signals[name];
    return name.map(function(n) { m._signals[n]; });
  }

  proto.signal = function(name, init) {
    var m = this;
    if(arguments.length === 1) return signal.call(this, name);
    return this._signals[name] = new Signal(this, name, init);
  };

  proto.signalValues = function(name) {
    var signals = {},
        i, len, n;

    if(!util.isArray(name)) return this._signals[name].value();
    for(i=0, len=name.length; i<len; ++i) {
      n = name[i];
      signals[n] = this._signals[n].value();
    }

    return signals;
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

  var schedule = d3.bisector(function(a, b) {
    // If the nodes are equal, propagate the non-touch pulse first,
    // so that we can ignore subsequent touch pulses. To efficiently
    // use the JS array, we want lower ranked nodes on the right so
    // we can pop them. 
    if(a.node == b.node) return a.pulse.touch ? -1 : 1;
    else return b.rank - a.rank; 
  }); 

  proto.propagate = function(pulse, node) {
    var v, l, n, p, r, i, len;

    var pq = [];
    pq.enq = function(x) {
      var idx = schedule.left(this, x);
      this.splice(idx, 0, x);
    };

    if(pulse.stamp) throw "Pulse already has a non-zero stamp"

    pulse.stamp = ++this._stamp;
    pq.enq({ node: node, pulse: pulse, rank: node._rank });

    while (pq.length > 0) {
      v = pq.pop(), n = v.node, p = v.pulse, r = v.rank, l = n._listeners;

      // A node's rank might change during a propagation (e.g. instantiating
      // a group's dataflow branch). Re-queue if it has.
      if(r != n._rank) {
        util.debug(p, ['Rank mismatch', r, n._rank]);
        pq.enq({ node: n, pulse: p, rank: n._rank });
        continue;
      }

      var touched = p.touch && n.last() >= p.stamp;
      if(touched) continue; // Don't needlessly touch ops.

      var run = !!p.add.length || !!p.rem.length || n.router();
      run = run || !touched;
      run = run || n.reevaluate(p);

      if(run) {
        pulse = n.evaluate(p);
        n._stamp = pulse.stamp;
      }

      // Even if we didn't run the node, we still want to propagate 
      // the pulse. 
      if (pulse != this.doNotPropagate || !run) {
        for (i = 0, len = l.length; i < len; i++) {
          pq.enq({ node: l[i], pulse: pulse, rank: l[i]._rank });
        }
      }
    }
  };

  // Connect a branch of dataflow nodes. 
  // Dependencies get wired to the nearest collector. 
  function forEachNode(branch, fn) {
    var node, collector, i, len;
    for(i=0, len=branch.length; i<len; ++i) {
      node = branch[i];
      if(node.collector()) collector = node;

      fn(node, collector, i);
    }
  }

  proto.connect = function(branch) {
    util.debug({}, ['connecting']);
    var graph = this;

    forEachNode(branch, function(n, c, i) {
      var data = n.dependency(C.DATA),
          signals = n.dependency(C.SIGNALS);

      if(data.length > 0) {
        data.forEach(function(d) { graph.data(d).addListener(c); });
      }

      if(signals.length > 0) {
        signals.forEach(function(s) { graph.signal(s).addListener(c) });
      }

      if(i > 0) {
        branch[i-1].addListener(branch[i]);
      }
    });

    return branch;
  };

  proto.disconnect = function(branch) {
    util.debug({}, ['disconnecting']);
    var graph = this;

    forEachNode(branch, function(n, c, i) {
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

  return Graph;
});