var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    Bin = tx.bin;

var TOLERANCE = 2e-14;

tape('Bin discretizes values', function(t) {
  var df = new vega.Dataflow(),
      extent = df.add([0, 10]),
      step = df.add(10 / 20),
      bin = df.add(Bin, {
        field:  util.field('v'),
        extent: extent,
        step:   step,
        nice:   false
      });

  // stress test floating point math
  var extents = [
    [0, 1e-50],
    [0, 0.1],
    [0, 0.5],
    [0.5, 1],
    [0, 1],
    [1, 5],
    [0, 10],
    [0, 20]
  ];

  var divs = [5, 10, 20, 40];

  extents.forEach(e => {
    divs.forEach(d => {
      df.update(extent, e)
        .update(step, (e[1] - e[0]) / d)
        .run();
      testBin(t, bin.value, extent.value, step.value);
    })
  });

  t.end();
});

function testBin(t, b, extent, step) {
  t.ok(util.isFunction(b));
  t.equal(b.start, extent[0]);
  t.equal(b.stop, extent[1]);
  t.equal(b.step, step);

  var lo = extent[0],
      hi = extent[1],
      f = _ => lo + step * _,
      steps = Math.round((hi - lo) / step),
      i, z;

  for (i=0; i<steps; ++i) {
    z = f(i);
    t.equal(b({v: z}), z);
    t.equal(b({v: f(i + 0.5)}), z);
    t.equal(b({v: f(i + (1 - TOLERANCE))}), z);
  }

  // test bins that precede extent
  t.equal(b({v: f(-1)}), f(0));

  // test very last, inclusive bin
  t.equal(b({v: f(steps)}), f(steps - 1));
}
