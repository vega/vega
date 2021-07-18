var tape = require('tape');
var util = require('vega-util');
var vega = require('vega-dataflow');
var tx = require('../');
var changeset = vega.changeset;
var Bin = tx.bin;
var Collect = tx.collect;

const TOLERANCE = 2e-14;

tape('Bin discretizes values', t => {
  var df = new vega.Dataflow();
  var extent = df.add([0, 10]);
  var step = df.add(10 / 20);
  var bin = df.add(Bin, {
    field:  util.field('v'),
    extent: extent,
    step:   step,
    nice:   false
  });

  // stress test floating point math
  const extents = [
    [0, 1e-50],
    [0, 0.1],
    [0, 0.5],
    [0.5, 1],
    [0, 1],
    [1, 5],
    [0, 10],
    [0, 20]
  ];

  const divs = [5, 10, 20, 40];

  extents.forEach(e => {
    divs.forEach(d => {
      df.update(extent, e)
        .update(step, (e[1] - e[0]) / d)
        .run();
      testBin(t, bin.value, extent.value, step.value);
    });
  });

  t.end();
});

function testBin(t, b, extent, step) {
  t.ok(util.isFunction(b));
  t.equal(b.start, extent[0]);
  t.equal(b.stop, extent[1]);
  t.equal(b.step, step);

  var lo = extent[0];
  var hi = extent[1];
  var f = _ => lo + step * _;
  var steps = Math.round((hi - lo) / step);
  var i;
  var z;

  for (i=0; i<steps; ++i) {
    z = f(i);
    t.equal(b({v: z}), z);
    t.equal(b({v: f(i + 0.5)}), z);
    t.equal(b({v: f(i + (1 - TOLERANCE))}), z);
  }

  // test bins that precede extent
  t.equal(b({v: f(-1)}), -Infinity);

  // test very last, inclusive bin
  t.equal(b({v: f(steps)}), f(steps - 1));

  // test bins that exceed extent
  t.equal(b({v: f(steps+1)}), Infinity);
}

tape('Bin handles tail aggregation for last bin', t => {
  var df = new vega.Dataflow();
  var bin = df.add(Bin, {
    field:   util.field('v'),
    extent:  [0, 29],
    maxbins: 10,
    nice:    false
  });

  df.run();
  testBin(t, bin.value, [0, 29], 5);

  // inspired by vega/vega#2181
  t.equal(bin.value({v:28}), 25);
  t.equal(bin.value({v:29}), 25);
  t.equal(bin.value({v:30}), 25);
  t.equal(bin.value({v:31}), Infinity);

  t.end();
});

tape('Bin supports point output', t => {
  const data = [{v: 5.5}];

  var df = new vega.Dataflow();
  var c = df.add(Collect);
  var b = df.add(Bin, {
    field:    util.field('v'),
    interval: false,
    extent:   [0, 10],
    step:     1,
    nice:     false,
    pulse:    c
  });

  df.pulse(c, changeset().insert(data)).run();
  t.equal(b.pulse.rem.length, 0);
  t.equal(b.pulse.add.length, 1);
  t.equal(b.pulse.mod.length, 0);
  t.equal(b.pulse.add[0].bin0, 5);
  t.equal(b.pulse.add[0].bin1, undefined);
  t.equal(b.pulse.fields.bin0, true);
  t.equal(b.pulse.fields.bin1, undefined);

  t.end();
});

tape('Bin ignores invalid values', t => {
  var df = new vega.Dataflow();
  var extent = df.add([0, 10]);
  var step = df.add(10 / 20);
  var bin = df.add(Bin, {
    field:  util.field('v'),
    extent: extent,
    step:   step,
    nice:   false
  });

  df.run();

  t.equal(bin.value({v: 0}), 0);
  t.equal(bin.value({v: null}), null);
  t.equal(bin.value({v: undefined}), null);
  t.equal(bin.value({v: NaN}), NaN);
  t.equal(bin.value({v: ''}), null);

  t.end();
});
