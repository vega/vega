var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    xf = require('../'),
    changeset = vega.changeset,
    Collect = require('vega-transforms').collect,
    CrossFilter = xf.crossfilter,
    ResolveFilter = xf.resolvefilter;

tape('Crossfilter filters tuples', t => {
  const data = [
    {a: 1, b: 1, c:0}, {a: 2, b: 2, c:1},
    {a: 4, b: 4, c:2}, {a: 3, b: 3, c:3}
  ];

  var a = util.field('a'),
      b = util.field('b'),
      df = new vega.Dataflow(),
      r1 = df.add([0, 5]),
      r2 = df.add([0, 5]),
      c0 = df.add(Collect),
      cf = df.add(CrossFilter, {fields:[a,b], query:[r1,r2], pulse:c0}),
      f1 = df.add(ResolveFilter, {ignore:2, filter:cf, pulse:cf}),
      o1 = df.add(Collect, {pulse: f1}),
      f2 = df.add(ResolveFilter, {ignore:1, filter:cf, pulse:cf}),
      o2 = df.add(Collect, {pulse: f2}),
      fn = df.add(ResolveFilter, {ignore:0, filter:cf, pulse:cf}),
      on = df.add(Collect, {pulse: fn});

  // -- add data
  df.pulse(c0, changeset().insert(data)).run();
  t.equal(o1.value.length, 4);
  t.equal(o2.value.length, 4);
  t.equal(on.value.length, 4);

  // -- update single query
  df.update(r2, [1,2]).run();
  t.equal(o1.value.length, 4);
  t.equal(o2.value.length, 2);
  t.equal(on.value.length, 2);

  // -- update multiple queries
  df.update(r1, [1,3])
    .update(r2, [3,4])
    .run();
  t.equal(o1.value.length, 3);
  t.equal(o2.value.length, 2);
  t.equal(on.value.length, 1);

  // -- remove data
  df.pulse(c0, changeset().remove(data.slice(0, 2))).run();
  t.equal(o1.value.length, 1);
  t.equal(o2.value.length, 2);
  t.equal(on.value.length, 1);

  // -- remove more data
  df.pulse(c0, changeset().remove(data.slice(-2))).run();
  t.equal(o1.value.length, 0);
  t.equal(o2.value.length, 0);
  t.equal(on.value.length, 0);

  // -- add data back
  df.pulse(c0, changeset().insert(data)).run();
  t.equal(o1.value.length, 3);
  t.equal(o2.value.length, 2);
  t.equal(on.value.length, 1);

  // -- modify non-indexed values
  df.pulse(c0, changeset()
    .modify(data[0], 'c', 5)
    .modify(data[3], 'c', 5)).run();
  t.equal(o1.value.length, 3);
  t.equal(o2.value.length, 2);
  t.equal(on.value.length, 1);
  t.equal(o1.pulse.materialize().mod.length, 2);
  t.equal(o2.pulse.materialize().mod.length, 1);
  t.equal(on.pulse.materialize().mod.length, 1);

  t.end();
});

tape('Crossfilter consolidates after remove', t => {
  const data = [
    {a: 1, b: 1, c:0}, {a: 2, b: 2, c:1},
    {a: 4, b: 4, c:2}, {a: 3, b: 3, c:3}
  ];

  var a = util.field('a'),
      b = util.field('b'),
      df = new vega.Dataflow(),
      r1 = df.add([0, 3]),
      r2 = df.add([0, 3]),
      c0 = df.add(Collect),
      cf = df.add(CrossFilter, {fields:[a,b], query:[r1,r2], pulse:c0});

  // -- add data
  df.pulse(c0, changeset().insert(data)).run();

  // -- remove data
  df.pulse(c0, changeset().remove(data.slice(0, 2))).run();

  // crossfilter consolidates after removal
  // this happens *after* propagation completes

  // were dimensions appropriately remapped?
  cf._dims.map(dim => {
    t.equal(dim.size(), 2);

    const idx = dim.index();
    t.equal(idx[0], 1);
    t.equal(idx[1], 0);
  });

  // was the filter state appropriately updated?
  var d = cf.value.data(),
      curr = cf.value.curr();
  t.equal(cf.value.size(), 2);
  t.equal(d[0], data[2]);
  t.equal(d[1], data[3]);
  t.equal(curr[0], (1 << 2) - 1); // first filter should fail all
  t.equal(curr[1], 0); // second filter should pass all

  t.end();
});
