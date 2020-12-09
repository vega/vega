var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Aggregate = tx.aggregate;

tape('Aggregate aggregates tuples', t => {
  const data = [
    {k:'a', v:1}, {k:'b', v:3},
    {k:'a', v:2}, {k:'b', v:4}
  ];

  var key = util.field('k'),
      val = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(Collect),
      agg = df.add(Aggregate, {
        groupby: [key],
        fields: [val, val, val, val, val],
        ops: ['count', 'sum', 'min', 'max', 'product'],
        pulse: col
      }),
      out = df.add(Collect, {pulse: agg});

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

tape('Aggregate handles count aggregates', t => {
  const data = [
    {foo:0, bar:1},
    {foo:2, bar:3},
    {foo:4, bar:5}
  ];

  var foo = util.field('foo'),
      bar = util.field('bar'),
      df, col, agg, out, d;

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

tape('Aggregate properly handles empty aggregation cells', t => {
  const data = [
    {k:'a', v:1}, {k:'b', v:3},
    {k:'a', v:2}, {k:'b', v:4}
  ];

  var key = util.field('k'),
      val = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(Collect),
      agg = df.add(Aggregate, {
        groupby: [key],
        fields: [val, val, val, val, val],
        ops: ['count', 'sum', 'min', 'max', 'product'],
        pulse: col
      }),
      out = df.add(Collect, {pulse: agg});

  // -- add data
  df.pulse(col, changeset().insert(data)).run();
  t.equal(out.value.length, 2);

  // -- remove category 'b'
  df.pulse(col, changeset()
    .remove(d => d.k === 'b')).run();
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

tape('Aggregate handles distinct aggregates', t => {
  const data = [
    {foo:null},
    {foo:null},
    {foo:undefined},
    {foo:undefined},
    {foo:NaN},
    {foo:NaN},
    {foo:0},
    {foo:0}
  ];

  var foo = util.field('foo'),
      df, col, agg, out, d;

  // counts only
  df = new vega.Dataflow();
  col = df.add(Collect);
  agg = df.add(Aggregate, {
    fields: [foo],
    ops: ['distinct'],
    pulse: col
  });
  out = df.add(Collect, {pulse: agg});

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

tape('Aggregate handles cross-product', t => {
  const data = [
    {a: 0, b: 2},
    {a: 1, b: 3}
  ];

  var a = util.field('a'),
      b = util.field('b'),
      df = new vega.Dataflow(),
      col = df.add(Collect),
      agg = df.add(Aggregate, {
        groupby: [a, b],
        cross: true,
        pulse: col
      }),
      out = df.add(Collect, {
        sort: function(u, v) { return (u.a - v.a) || (u.b - v.b); },
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

tape('Aggregate handles empty/invalid data', t => {
  const ops = [
    'count',
    'missing',
    'valid',
    'sum',
    'product',
    'mean',
    'variance',
    'stdev',
    'min',
    'max',
    'median'
  ];
  const res = [4, 3, 0, 0]; // higher indices 'undefined'

  var v = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(Collect),
      agg = df.add(Aggregate, {
        fields: ops.map(() => v),
        ops: ops,
        as: ops,
        pulse: col
      }),
      out = df.add(Collect, {pulse: agg});

  df.pulse(
    col,
    changeset().insert([
      {v: NaN}, {v: null}, {v: undefined}, {v: ''}
    ])
  ).run();
  const d = out.value[0];

  ops.forEach((op, i) => {
    t.equal(d[op], res[i], op);
  });

  t.end();
});
