import tape from 'tape';
import {field, isFunction} from 'vega-util';
import {Dataflow, changeset} from 'vega-dataflow';
import {bin as Bin, collect as Collect} from '../index.js';
const TOLERANCE = 2e-14;

tape('Bin discretizes values', t => {
  var df = new Dataflow(),
      extent = df.add([0, 10]),
      step = df.add(10 / 20),
      bin = df.add(Bin, {
        field:  field('v'),
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
  t.ok(isFunction(b));
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
  t.equal(b({v: f(-1)}), -Infinity);

  // test very last, inclusive bin
  t.equal(b({v: f(steps)}), f(steps - 1));

  // test bins that exceed extent
  t.equal(b({v: f(steps+1)}), Infinity);
}

tape('Bin handles tail aggregation for last bin', t => {
  var df = new Dataflow(),
      bin = df.add(Bin, {
        field:   field('v'),
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

  var df = new Dataflow(),
      c = df.add(Collect),
      b = df.add(Bin, {
        field:    field('v'),
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
  var df = new Dataflow(),
      extent = df.add([0, 10]),
      step = df.add(10 / 20),
      bin = df.add(Bin, {
        field:  field('v'),
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


tape('Bin ignores invalid values', t => {
  var df = new vega.Dataflow(),
      extent = df.add([0, 10]),
      step = df.add(10 / 20),
      bin = df.add(Bin, {
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

tape('Bin dynamic bins', t => {
  var df = new vega.Dataflow(),
      extent = df.add([0, 100]),
      step = df.add(10),
      bin = df.add(Bin, {
        field: util.field('v'),
        extent: extent,
        step: step,
        nice: false
      });

  df.run();

  // Test dynamic bins
  t.equal(bin.value({v: 5}), 0, 'Value 5 should fall into bin [0, 10)');
  t.equal(bin.value({v: 25}), 20, 'Value 25 should fall into bin [20, 30)');
  t.equal(bin.value({v: 95}), 90, 'Value 95 should fall into bin [90, 100)');

  t.equal(bin.value({v: -5}), -Infinity, 'Value -5 should return -Infinity');
  t.equal(bin.value({v: 105}), Infinity, 'Value 105 should return Infinity');

  t.end();
});

tape('Bin custom thresholds', t => {
  var df = new vega.Dataflow(),
      thresholds = df.add([0, 10, 20, 50, 100]),
      bin = df.add(Bin, {
        field: util.field('v'),
        thresholds: thresholds,
        nice: false
      });

  df.run();

  // Test values within thresholds
  t.equal(bin.value({v: 5}), 0, 'Value 5 should fall into bin [0, 10)');
  t.equal(bin.value({v: 15}), 10, 'Value 15 should fall into bin [10, 20)');
  t.equal(bin.value({v: 70}), 50, 'Value 70 should fall into bin [50, 100)');

  // Test out-of-bounds values
  t.equal(bin.value({v: -5}), -Infinity, 'Value -5 should return -Infinity');
  t.equal(bin.value({v: 150}), Infinity, 'Value 150 should return Infinity');

  t.end();
});

tape('Bin edge cases', t => {
  var df = new vega.Dataflow(),
      thresholds = df.add([0, 10, 20, 50]),
      bin = df.add(Bin, {
        field: util.field('v'),
        thresholds: thresholds,
        nice: false
      });

  df.run();

  // Test exact matches with thresholds
  t.equal(bin.value({v: 0}), 0, 'Value 0 should fall into bin [0, 10)');

  // the last bin should contain the max threshold value
  t.equal(bin.value({v: 50}), 50, 'Value 50 should fall into bin [20,50]');

  // Test out-of-bounds values
  t.equal(bin.value({v: -10}), -Infinity, 'Value -10 should return -Infinity');
  t.equal(bin.value({v: 100}), Infinity, 'Value 100 should return Infinity');

  t.end();
});

tape('Bin mixed custom thresholds and dynamic bins', t => {
  var df = new vega.Dataflow(),
      extent = df.add([0, 50]),
      step = df.add(10),
      thresholds = df.add([0, 10, 20]),
      bin = df.add(Bin, {
        field: util.field('v'),
        thresholds: thresholds,
        extent: extent,
        step: step,
        nice: false
      });

  df.run();

  // Test custom thresholds
  t.equal(bin.value({v: 5}), 0, 'Value 5 should fall into bin [0, 10)');
  t.equal(bin.value({v: 15}), 10, 'Value 15 should fall into bin [10, 20)');

  // Test out-of-bounds values
  t.equal(bin.value({v: -5}), -Infinity, 'Value -5 should return -Infinity');
  t.equal(bin.value({v: 55}), Infinity, 'Value 55 should return Infinity');

  t.end();
});

tape('Bin dynamic thresholds - irregular intervals', t => {
  var df = new vega.Dataflow(),
      thresholds = df.add([0, 5, 15, 50, 100]),
      bin = df.add(Bin, {
        field: util.field('v'),
        thresholds: thresholds,
        nice: false
      });

  df.run();

  // Test values within thresholds
  t.equal(bin.value({v: 3}), 0, 'Value 3 should fall into bin [0, 5)');
  t.equal(bin.value({v: 7}), 5, 'Value 7 should fall into bin [5, 15)');
  t.equal(bin.value({v: 20}), 15, 'Value 20 should fall into bin [15, 50)');

  // Test value exceeding highest threshold
  t.equal(bin.value({v: 150}), Infinity, 'Value 150 should fall into dynamically added bin [100, 150)');

  t.end();
});