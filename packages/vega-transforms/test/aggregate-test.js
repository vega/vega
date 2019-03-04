var util = require('vega-util'), vega = require('vega-dataflow'), tx = require('../'), changeset = vega.changeset, Collect = tx.collect, Aggregate = tx.aggregate;

test('Aggregate aggregates tuples', function() {
  var data = [
    {k:'a', v:1}, {k:'b', v:3},
    {k:'a', v:2}, {k:'b', v:4}
  ];

  var key = util.field('k'),
      val = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(Collect),
      agg = df.add(Aggregate, {
        groupby: [key],
        fields: [val, val, val, val],
        ops: ['count', 'sum', 'min', 'max'],
        pulse: col
      }),
      out = df.add(Collect, {pulse: agg});

  // -- test adds
  df.pulse(col, changeset().insert(data)).run();
  var d = out.value;
  expect(d.length).toBe(2);
  expect(d[0].k).toBe('a');
  expect(d[0].count_v).toBe(2);
  expect(d[0].sum_v).toBe(3);
  expect(d[0].min_v).toBe(1);
  expect(d[0].max_v).toBe(2);
  expect(d[1].k).toBe('b');
  expect(d[1].count_v).toBe(2);
  expect(d[1].sum_v).toBe(7);
  expect(d[1].min_v).toBe(3);
  expect(d[1].max_v).toBe(4);

  // -- test rems
  df.pulse(col, changeset().remove(data.slice(0, 2))).run();
  d = out.value;
  expect(d.length).toBe(2);
  expect(d[0].k).toBe('a');
  expect(d[0].count_v).toBe(1);
  expect(d[0].sum_v).toBe(2);
  expect(d[0].min_v).toBe(2);
  expect(d[0].max_v).toBe(2);
  expect(d[1].k).toBe('b');
  expect(d[1].count_v).toBe(1);
  expect(d[1].sum_v).toBe(4);
  expect(d[1].min_v).toBe(4);
  expect(d[1].max_v).toBe(4);

  // -- test mods, no groupby change
  df.pulse(col, changeset().modify(data[2], 'v', 3)).run();
  d = out.value;
  expect(d.length).toBe(2);
  expect(d[0].k).toBe('a');
  expect(d[0].count_v).toBe(1);
  expect(d[0].sum_v).toBe(3);
  expect(d[0].min_v).toBe(3);
  expect(d[0].max_v).toBe(3);
  expect(d[1].k).toBe('b');
  expect(d[1].count_v).toBe(1);
  expect(d[1].sum_v).toBe(4);
  expect(d[1].min_v).toBe(4);
  expect(d[1].max_v).toBe(4);

  // -- test mods, groupby change
  df.pulse(col, changeset().modify(data[2], 'k', 'b')).run();
  d = out.value;
  expect(d.length).toBe(1);
  expect(d[0].k).toBe('b');
  expect(d[0].count_v).toBe(2);
  expect(d[0].sum_v).toBe(7);
  expect(d[0].min_v).toBe(3);
  expect(d[0].max_v).toBe(4);
});

test('Aggregate handles count aggregates', function() {
  var data = [
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
  expect(d.length).toBe(1);
  expect(Object.keys(d[0]).length).toBe(3); // outputs
  expect(d[0].count).toBe(3);
  expect(d[0].count_foo).toBe(3);
  expect(d[0].count_bar).toBe(3);

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
  expect(d.length).toBe(1);
  expect(Object.keys(d[0]).length).toBe(4); // outputs
  expect(d[0].count).toBe(3);
  expect(d[0].sum_foo).toBe(6);
  expect(d[0].sum_bar).toBe(9);
  expect(d[0].count_bar).toBe(3);
});


test('Aggregate properly handles empty aggregation cells', function() {
  var data = [
    {k:'a', v:1}, {k:'b', v:3},
    {k:'a', v:2}, {k:'b', v:4}
  ];

  var key = util.field('k'),
      val = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(Collect),
      agg = df.add(Aggregate, {
        groupby: [key],
        fields: [val, val, val, val],
        ops: ['count', 'sum', 'min', 'max'],
        pulse: col
      }),
      out = df.add(Collect, {pulse: agg});

  // -- add data
  df.pulse(col, changeset().insert(data)).run();
  expect(out.value.length).toBe(2);

  // -- remove category 'b'
  df.pulse(col, changeset()
    .remove(function(d) { return d.k === 'b'; })).run();
  expect(out.value.length).toBe(1);

  // -- modify tuple
  df.pulse(col, changeset().modify(data[0], 'v', 2)).run();

  var d = out.value;
  expect(d.length).toBe(1);
  expect(d[0].k).toBe('a');
  expect(d[0].count_v).toBe(2);
  expect(d[0].sum_v).toBe(4);
  expect(d[0].min_v).toBe(2);
  expect(d[0].max_v).toBe(2);
});

test('Aggregate handles distinct aggregates', function() {
  var data = [
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
  expect(d.length).toBe(1);
  expect(d[0].distinct_foo).toBe(4);

  df.pulse(col, changeset().remove(data[0])).run();
  d = out.value;
  expect(d.length).toBe(1);
  expect(d[0].distinct_foo).toBe(4);

  df.pulse(col, changeset().remove(data[1])).run();
  d = out.value;
  expect(d.length).toBe(1);
  expect(d[0].distinct_foo).toBe(3);
});

test('Aggregate handles cross-product', function() {
  var data = [
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
  var d = out.value;
  expect(d.length).toBe(4);
  expect(d[0].a).toBe(0);
  expect(d[0].b).toBe(2);
  expect(d[0].count).toBe(1);
  expect(d[1].a).toBe(0);
  expect(d[1].b).toBe(3);
  expect(d[1].count).toBe(0);
  expect(d[2].a).toBe(1);
  expect(d[2].b).toBe(2);
  expect(d[2].count).toBe(0);
  expect(d[3].a).toBe(1);
  expect(d[3].b).toBe(3);
  expect(d[3].count).toBe(1);

  // -- test mod
  df.pulse(col, changeset().modify(data[0], 'b', 4)).run();
  d = out.value;
  expect(d.length).toBe(6);
  expect(d[0].a).toBe(0);
  expect(d[0].b).toBe(2);
  expect(d[0].count).toBe(0);
  expect(d[1].a).toBe(0);
  expect(d[1].b).toBe(3);
  expect(d[1].count).toBe(0);
  expect(d[2].a).toBe(0);
  expect(d[2].b).toBe(4);
  expect(d[2].count).toBe(1);
  expect(d[3].a).toBe(1);
  expect(d[3].b).toBe(2);
  expect(d[3].count).toBe(0);
  expect(d[4].a).toBe(1);
  expect(d[4].b).toBe(3);
  expect(d[4].count).toBe(1);
  expect(d[5].a).toBe(1);
  expect(d[5].b).toBe(4);
  expect(d[5].count).toBe(0);

  // -- test rem
  df.pulse(col, changeset().remove(data)).run();
  d = out.value;
  expect(d.length).toBe(6);
  expect(d[0].a).toBe(0);
  expect(d[0].b).toBe(2);
  expect(d[0].count).toBe(0);
  expect(d[1].a).toBe(0);
  expect(d[1].b).toBe(3);
  expect(d[1].count).toBe(0);
  expect(d[2].a).toBe(0);
  expect(d[2].b).toBe(4);
  expect(d[2].count).toBe(0);
  expect(d[3].a).toBe(1);
  expect(d[3].b).toBe(2);
  expect(d[3].count).toBe(0);
  expect(d[4].a).toBe(1);
  expect(d[4].b).toBe(3);
  expect(d[4].count).toBe(0);
  expect(d[5].a).toBe(1);
  expect(d[5].b).toBe(4);
  expect(d[5].count).toBe(0);
});

test('Aggregate handles empty/invalid data', function() {
  var ops = [
    'count',
    'valid',
    'sum',
    'mean',
    'variance',
    'stdev',
    'min',
    'max',
    'median'
  ];
  var res = [1, 0, 0]; // higher indices 'undefined'

  var v = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(Collect),
      agg = df.add(Aggregate, {
        fields: ops.map(function() { return v; }),
        ops: ops,
        as: ops,
        pulse: col
      }),
      out = df.add(Collect, {pulse: agg});

  df.pulse(col, changeset().insert([{v: NaN}])).run();
  var d = out.value[0];

  ops.forEach(function(op, i) {
    expect(d[op]).toBe(res[i]);
  });
});
