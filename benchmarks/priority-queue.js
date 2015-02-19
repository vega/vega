var fs = require('fs'),
    heap = require('heap'),
    amdLoader = require('amd-loader'),
    Promise = require('promise');
    d3 = require('d3'),
    canvas = require('canvas'),
    vg = require('vega'),
    vg2 = require('../vega2');

var bars = JSON.parse(fs.readFileSync('../examples/spec/bar.json').toString()),
    cars = JSON.parse(fs.readFileSync('../examples/data/cars.json').toString()),
    parallel_coords = JSON.parse(fs.readFileSync('../examples/spec/parallel_coords.json').toString());

bars.name = "Bars";
parallel_coords.name = "Parallel Coords";
delete parallel_coords.data[0].url;
parallel_coords.data[0].values = cars;

// Give them both at least N data points
function prepSpecs(N) {
  var v = bars.data[0].values;
  while(v.length < N) v.push.apply(v, v);
  while(cars.length < N) cars.push.apply(cars, cars);
}

function vg1(spec) {
  var start = Date.now();
  return new Promise(function(resolve, err) {
    vg.parse.spec(spec, function(model) {
      console.log('vg1', Date.now() - start);
      resolve();
    });
  });
}

function sortedArray(spec) {
  var start = Date.now();
  return new Promise(function(resolve, err) {
    vg2.parse.spec(spec, function(model) {
      console.log('sortedArray', Date.now() - start);
      resolve();
    }, function(model) {
      model.scene(new vg2.dataflow.Node(model.graph)).fire();
      return model; 
    });
  });
}

function binHeap(spec) {
  var start = Date.now();
  return new Promise(function(resolve, err) {
    vg2.parse.spec(spec, function(model) {
      console.log('binHeap', Date.now() - start);
      resolve();
    }, function(model) {
      model.scene(new vg2.dataflow.Node(model.graph));

      model.graph.propagate = function(pulse, node) {
        var v, l, n, p, r, i, len;

        var pq = new Heap(function(a, b) {
          if(a.rank == b.rank) return a.pulse.reflow ? 1 : -1;
          else return a.rank - b.rank; 
        });

        if(pulse.stamp) throw "Pulse already has a non-zero stamp"

        pulse.stamp = ++this._stamp;
        pq.push({ node: node, pulse: pulse, rank: node.rank() });

        while (pq.size() > 0) {
          v = pq.pop(), n = v.node, p = v.pulse, r = v.rank, l = n._listeners;

          // A node's rank might change during a propagation (e.g. instantiating
          // a group's dataflow branch). Re-queue if it has.
          if(r != n.rank()) {
            util.debug(p, ['Rank mismatch', r, n.rank()]);
            pq.push({ node: n, pulse: p, rank: n.rank() });
            continue;
          }

          var reflowed = p.reflow && n.last() >= p.stamp;
          if(reflowed) continue; // Don't needlessly reflow ops.

          var run = !!p.add.length || !!p.rem.length || n.router();
          run = run || !reflowed;
          run = run || n.reevaluate(p);

          if(run) {
            pulse = n.evaluate(p);
            n.last(pulse.stamp);
          }

          // Even if we didn't run the node, we still want to propagate 
          // the pulse. 
          if (pulse !== this.doNotPropagate || !run) {
            for (i = 0, len = l.length; i < len; i++) {
              pq.push({ node: l[i], pulse: pulse, rank: l[i]._rank });
            }
          }
        }
      };

      return model; 
    });
  });
}

function run(N) {
  prepSpecs(N);
  console.log('\n== BARS (N = '+N+') ==');
  return vg1(bars)
    .then(function() { return binHeap(bars) })
    .then(function() { return N < 100000 ? sortedArray(bars) : null })
    .then(function() {
      console.log('\n== PARALLEL COORDS (N = '+N+') ==');
      return vg1(parallel_coords);
    })
    .then(function() { return binHeap(parallel_coords) })
    .then(function() { return N < 100000 ? sortedArray(parallel_coords) : null });
}

run(1000)
  .then(function() { return run(10000); })
  .then(function() { return run(100000); });
