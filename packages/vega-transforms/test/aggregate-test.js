const tape = require('tape');
const util = require('vega-util');
const vega = require('vega-dataflow');
const tx = require('../');
const changeset = vega.changeset;
const Collect = tx.collect;
const Aggregate = tx.aggregate;

tape('Aggregate aggregates tuples', function (t) {
  const data = [
    {k: 'a', v: 1},
    {k: 'b', v: 3},
    {k: 'a', v: 2},
    {k: 'b', v: 4}
  ];

  const key = util.field('k');
  const val = util.field('v');
  const df = new vega.Dataflow();
  const col = df.add(Collect);
  const agg = df.add(Aggregate, {
    groupby: [key],
    fields: [val, val, val, val, val],
    ops: ['count', 'sum', 'min', 'max', 'product'],
    pulse: col
  });
  const out = df.add(Collect, {pulse: agg});

  // -- test adds
  df.pulse(col, changeset().insert(data)).run();
  let d = out.value;
  t.equal(d.length, 2);
  t.equal(d[0].k, 'a');
  t.equal(d[0].count_v, 2);
  t.equal(d[0].sum_v, 3);
  t.equal(d[0].min_v, 1);
  t.equal(d[0].max_v, 2);
  t.equal(d[0].product_v, 2);
  t.equal(d[1].k, 'b');
  t.equal(d[1].count_v, 2);
  t.equal(d[1].sum_v, 7);
  t.equal(d[1].min_v, 3);
  t.equal(d[1].max_v, 4);
  t.equal(d[1].product_v, 12);

  // -- test rems
  df.pulse(col, changeset().remove(data.slice(0, 2))).run();
  d = out.value;
  t.equal(d.length, 2);
  t.equal(d[0].k, 'a');
  t.equal(d[0].count_v, 1);
  t.equal(d[0].sum_v, 2);
  t.equal(d[0].min_v, 2);
  t.equal(d[0].max_v, 2);
  t.equal(d[0].product_v, 2);
  t.equal(d[1].k, 'b');
  t.equal(d[1].count_v, 1);
  t.equal(d[1].sum_v, 4);
  t.equal(d[1].min_v, 4);
  t.equal(d[1].max_v, 4);
  t.equal(d[1].product_v, 4);

  // -- test mods, no groupby change
  df.pulse(col, changeset().modify(data[2], 'v', 3)).run();
  d = out.value;
  t.equal(d.length, 2);
  t.equal(d[0].k, 'a');
  t.equal(d[0].count_v, 1);
  t.equal(d[0].sum_v, 3);
  t.equal(d[0].min_v, 3);
  t.equal(d[0].max_v, 3);
  t.equal(d[0].product_v, 3);
  t.equal(d[1].k, 'b');
  t.equal(d[1].count_v, 1);
  t.equal(d[1].sum_v, 4);
  t.equal(d[1].min_v, 4);
  t.equal(d[1].max_v, 4);
  t.equal(d[1].product_v, 4);

  // -- test mods, groupby change
  df.pulse(col, changeset().modify(data[2], 'k', 'b')).run();
  d = out.value;
  t.equal(d.length, 1);
  t.equal(d[0].k, 'b');
  t.equal(d[0].count_v, 2);
  t.equal(d[0].sum_v, 7);
  t.equal(d[0].min_v, 3);
  t.equal(d[0].max_v, 4);
  t.equal(d[0].product_v, 12);

  t.end();
});

tape('Aggregate handles count aggregates', function (t) {
  const data = [
    {foo: 0, bar: 1},
    {foo: 2, bar: 3},
    {foo: 4, bar: 5}
  ];

  const foo = util.field('foo');
  const bar = util.field('bar');
  let df;
  let col;
  let agg;
  let out;
  let d;

  // counts only
  df = new vega.Dataflow();
  col = df.add(Collect);
  agg = df.add(Aggregate, {
    fields: [null, foo, bar],
    ops: ['count', 'count', 'count'],
    pulse: col
  });
  out = df.add(Collect, {pulse: agg});

  df.pulse(col, changeset().insert(data)).run();
  d = out.value;
  t.equal(d.length, 1);
  t.equal(Object.keys(d[0]).length, 3); // outputs
  t.equal(d[0].count, 3);
  t.equal(d[0].count_foo, 3);
  t.equal(d[0].count_bar, 3);

  // multiple counts plus other measures
  df = new vega.Dataflow();
  col = df.add(Collect);
  agg = df.add(Aggregate, {
    fields: [null, foo, bar, bar],
    ops: ['count', 'sum', 'sum', 'count'],
    pulse: col
  });
  out = df.add(Collect, {pulse: agg});

  df.pulse(col, changeset().insert(data)).run();
  d = out.value;
  t.equal(d.length, 1);
  t.equal(Object.keys(d[0]).length, 4); // outputs
  t.equal(d[0].count, 3);
  t.equal(d[0].sum_foo, 6);
  t.equal(d[0].sum_bar, 9);
  t.equal(d[0].count_bar, 3);

  t.end();
});

tape('Aggregate properly handles empty aggregation cells', function (t) {
  const data = [
    {k: 'a', v: 1},
    {k: 'b', v: 3},
    {k: 'a', v: 2},
    {k: 'b', v: 4}
  ];

  const key = util.field('k');
  const val = util.field('v');
  const df = new vega.Dataflow();
  const col = df.add(Collect);
  const agg = df.add(Aggregate, {
    groupby: [key],
    fields: [val, val, val, val, val],
    ops: ['count', 'sum', 'min', 'max', 'product'],
    pulse: col
  });
  const out = df.add(Collect, {pulse: agg});

  // -- add data
  df.pulse(col, changeset().insert(data)).run();
  t.equal(out.value.length, 2);

  // -- remove category 'b'
  df.pulse(
    col,
    changeset().remove(function (d) {
      return d.k === 'b';
    })
  ).run();
  t.equal(out.value.length, 1);

  // -- modify tuple
  df.pulse(col, changeset().modify(data[0], 'v', 2)).run();

  const d = out.value;
  t.equal(d.length, 1);
  t.equal(d[0].k, 'a');
  t.equal(d[0].count_v, 2);
  t.equal(d[0].sum_v, 4);
  t.equal(d[0].min_v, 2);
  t.equal(d[0].max_v, 2);
  t.equal(d[0].product_v, 4);

  t.end();
});

tape('Aggregate handles distinct aggregates', function (t) {
  const data = [
    {foo: null},
    {foo: null},
    {foo: undefined},
    {foo: undefined},
    {foo: NaN},
    {foo: NaN},
    {foo: 0},
    {foo: 0}
  ];

  const foo = util.field('foo');
  let d;

  // counts only
  const df = new vega.Dataflow();
  const col = df.add(Collect);
  const agg = df.add(Aggregate, {
    fields: [foo],
    ops: ['distinct'],
    pulse: col
  });
  const out = df.add(Collect, {pulse: agg});

  df.pulse(col, changeset().insert(data)).run();
  d = out.value;
  t.equal(d.length, 1);
  t.equal(d[0].distinct_foo, 4);

  df.pulse(col, changeset().remove(data[0])).run();
  d = out.value;
  t.equal(d.length, 1);
  t.equal(d[0].distinct_foo, 4);

  df.pulse(col, changeset().remove(data[1])).run();
  d = out.value;
  t.equal(d.length, 1);
  t.equal(d[0].distinct_foo, 3);

  t.end();
});

tape('Aggregate handles cross-product', function (t) {
  const data = [
    {a: 0, b: 2},
    {a: 1, b: 3}
  ];

  const a = util.field('a');
  const b = util.field('b');
  const df = new vega.Dataflow();
  const col = df.add(Collect);
  const agg = df.add(Aggregate, {
    groupby: [a, b],
    cross: true,
    pulse: col
  });
  const out = df.add(Collect, {
    sort: function (u, v) {
      return u.a - v.a || u.b - v.b;
    },
    pulse: agg
  });

  // -- test add
  df.pulse(col, changeset().insert(data)).run();
  let d = out.value;
  t.equal(d.length, 4);
  t.equal(d[0].a, 0);
  t.equal(d[0].b, 2);
  t.equal(d[0].count, 1);
  t.equal(d[1].a, 0);
  t.equal(d[1].b, 3);
  t.equal(d[1].count, 0);
  t.equal(d[2].a, 1);
  t.equal(d[2].b, 2);
  t.equal(d[2].count, 0);
  t.equal(d[3].a, 1);
  t.equal(d[3].b, 3);
  t.equal(d[3].count, 1);

  // -- test mod
  df.pulse(col, changeset().modify(data[0], 'b', 4)).run();
  d = out.value;
  t.equal(d.length, 6);
  t.equal(d[0].a, 0);
  t.equal(d[0].b, 2);
  t.equal(d[0].count, 0);
  t.equal(d[1].a, 0);
  t.equal(d[1].b, 3);
  t.equal(d[1].count, 0);
  t.equal(d[2].a, 0);
  t.equal(d[2].b, 4);
  t.equal(d[2].count, 1);
  t.equal(d[3].a, 1);
  t.equal(d[3].b, 2);
  t.equal(d[3].count, 0);
  t.equal(d[4].a, 1);
  t.equal(d[4].b, 3);
  t.equal(d[4].count, 1);
  t.equal(d[5].a, 1);
  t.equal(d[5].b, 4);
  t.equal(d[5].count, 0);

  // -- test rem
  df.pulse(col, changeset().remove(data)).run();
  d = out.value;
  t.equal(d.length, 6);
  t.equal(d[0].a, 0);
  t.equal(d[0].b, 2);
  t.equal(d[0].count, 0);
  t.equal(d[1].a, 0);
  t.equal(d[1].b, 3);
  t.equal(d[1].count, 0);
  t.equal(d[2].a, 0);
  t.equal(d[2].b, 4);
  t.equal(d[2].count, 0);
  t.equal(d[3].a, 1);
  t.equal(d[3].b, 2);
  t.equal(d[3].count, 0);
  t.equal(d[4].a, 1);
  t.equal(d[4].b, 3);
  t.equal(d[4].count, 0);
  t.equal(d[5].a, 1);
  t.equal(d[5].b, 4);
  t.equal(d[5].count, 0);

  t.end();
});

tape('Aggregate handles empty/invalid data', function (t) {
  const ops = ['count', 'valid', 'sum', 'product', 'mean', 'variance', 'stdev', 'min', 'max', 'median'];
  const res = [1, 0, 0]; // higher indices 'undefined'

  const v = util.field('v');
  const df = new vega.Dataflow();
  const col = df.add(Collect);
  const agg = df.add(Aggregate, {
    fields: ops.map(function () {
      return v;
    }),
    ops: ops,
    as: ops,
    pulse: col
  });
  const out = df.add(Collect, {pulse: agg});

  df.pulse(col, changeset().insert([{v: NaN}])).run();
  const d = out.value[0];

  ops.forEach(function (op, i) {
    t.equal(d[op], res[i], op);
  });

  t.end();
});
