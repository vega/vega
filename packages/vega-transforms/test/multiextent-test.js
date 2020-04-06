const tape = require('tape');
const vega = require('vega-dataflow');
const MultiExtent = require('../').multiextent;

tape('MultiExtent combines extents', function (t) {
  const df = new vega.Dataflow();
  const e = df.add([10, 50]);
  const m = df.add(MultiExtent, {extents: [[-5, 0], [0, 20], e]});

  t.equal(m.value, null);

  df.run();
  t.deepEqual(m.value, [-5, 50]);

  df.update(e, [0, 1]).run();
  t.deepEqual(m.value, [-5, 20]);

  t.end();
});
