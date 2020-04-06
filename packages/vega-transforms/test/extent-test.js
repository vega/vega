const tape = require('tape');
const util = require('vega-util');
const vega = require('vega-dataflow');
const tx = require('../');
const changeset = vega.changeset;
const Collect = tx.collect;
const Extent = tx.extent;

tape('Extent computes extents', function (t) {
  const data = [
    {x: 0, y: 28},
    {x: 1, y: 43},
    {x: 0, y: 55},
    {x: 1, y: 72}
  ];

  const x = util.field('x');
  const y = util.field('y');
  const df = new vega.Dataflow();
  const f = df.add(null);
  const c = df.add(Collect);
  const a = df.add(Extent, {field: f, pulse: c});
  const b = df.add(Extent, {field: y, pulse: c});

  df.update(f, x).pulse(c, changeset().insert(data)).run();
  t.deepEqual(a.value, [0, 1]);
  t.deepEqual(b.value, [28, 72]);

  df.update(f, y).run();
  t.deepEqual(a.value, [28, 72]);
  t.deepEqual(b.value, [28, 72]);

  t.end();
});

tape('Extent handles empty and invalid data', function (t) {
  const x = util.field('x');
  const df = new vega.Dataflow();
  const c = df.add(Collect);
  const e = df.add(Extent, {field: x, pulse: c});

  df.pulse(c, changeset().insert([])).run();
  t.deepEqual(e.value, [undefined, undefined]);

  df.pulse(c, changeset().insert([{x: NaN}, {x: null}, {x: undefined}])).run();
  t.deepEqual(e.value, [undefined, undefined]);

  t.end();
});
