var util = require('vega-util'), vega = require('vega-dataflow'), tx = require('../'), changeset = vega.changeset, Collect = tx.collect, JoinAggregate = tx.joinaggregate;

test('JoinAggregate extends tuples with aggregate values', function() {
  var data = [
    {k:'a', v:1}, {k:'b', v:3},
    {k:'a', v:2}, {k:'b', v:4}
  ];

  var key = util.field('k'),
      val = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(Collect),
      agg = df.add(JoinAggregate, {
        groupby: [key],
        fields: [val, val, val, val],
        ops: ['count', 'sum', 'min', 'max'],
        pulse: col
      }),
      out = df.add(Collect, {pulse: agg});

  // -- test adds
  df.pulse(col, changeset().insert(data)).run();
  var d = out.value;

  expect(d.length).toBe(4);
  expect(d[0].k).toBe('a');
  expect(d[0].v).toBe(1);
  expect(d[0].count_v).toBe(2);
  expect(d[0].sum_v).toBe(3);
  expect(d[0].min_v).toBe(1);
  expect(d[0].max_v).toBe(2);
  expect(d[1].k).toBe('b');
  expect(d[1].v).toBe(3);
  expect(d[1].count_v).toBe(2);
  expect(d[1].sum_v).toBe(7);
  expect(d[1].min_v).toBe(3);
  expect(d[1].max_v).toBe(4);

  // -- test rems
  df.pulse(col, changeset().remove(data.slice(0, 2))).run();
  d = out.value;
  expect(d.length).toBe(2);
  expect(d[0].k).toBe('a');
  expect(d[0].v).toBe(2);
  expect(d[0].count_v).toBe(1);
  expect(d[0].sum_v).toBe(2);
  expect(d[0].min_v).toBe(2);
  expect(d[0].max_v).toBe(2);
  expect(d[1].k).toBe('b');
  expect(d[1].v).toBe(4);
  expect(d[1].count_v).toBe(1);
  expect(d[1].sum_v).toBe(4);
  expect(d[1].min_v).toBe(4);
  expect(d[1].max_v).toBe(4);

  // -- test mods, no groupby change
  df.pulse(col, changeset().modify(data[2], 'v', 3)).run();
  d = out.value;
  expect(d.length).toBe(2);
  expect(d[0].k).toBe('a');
  expect(d[0].v).toBe(3);
  expect(d[0].count_v).toBe(1);
  expect(d[0].sum_v).toBe(3);
  expect(d[0].min_v).toBe(3);
  expect(d[0].max_v).toBe(3);
  expect(d[1].k).toBe('b');
  expect(d[1].v).toBe(4);
  expect(d[1].count_v).toBe(1);
  expect(d[1].sum_v).toBe(4);
  expect(d[1].min_v).toBe(4);
  expect(d[1].max_v).toBe(4);

  // -- test mods, groupby change
  df.pulse(col, changeset().modify(data[2], 'k', 'b')).run();
  d = out.value;
  expect(d.length).toBe(2);
  expect(d[0].k).toBe('b');
  expect(d[0].v).toBe(3);
  expect(d[0].count_v).toBe(2);
  expect(d[0].sum_v).toBe(7);
  expect(d[0].min_v).toBe(3);
  expect(d[0].max_v).toBe(4);
  expect(d[1].k).toBe('b');
  expect(d[1].v).toBe(4);
  expect(d[1].count_v).toBe(2);
  expect(d[1].sum_v).toBe(7);
  expect(d[1].min_v).toBe(3);
  expect(d[1].max_v).toBe(4);
});

test('JoinAggregate handles count aggregates', function() {
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
  agg = df.add(JoinAggregate, {
    fields: [null, foo, bar],
    ops: ['count', 'count', 'count'],
    pulse: col
  });
  out = df.add(Collect, {pulse: agg});

  df.pulse(col, changeset().insert(data)).run();
  d = out.value;
  expect(d.length).toBe(3);
  expect(Object.keys(d[0]).length).toBe(5); // fields + outputs
  expect(d[0].foo).toBe(0);
  expect(d[0].bar).toBe(1);
  expect(d[0].count).toBe(3);
  expect(d[0].count_foo).toBe(3);
  expect(d[0].count_bar).toBe(3);
  expect(d[1].foo).toBe(2);
  expect(d[1].bar).toBe(3);
  expect(d[1].count).toBe(3);
  expect(d[1].count_foo).toBe(3);
  expect(d[1].count_bar).toBe(3);
  expect(d[2].foo).toBe(4);
  expect(d[2].bar).toBe(5);
  expect(d[2].count).toBe(3);
  expect(d[2].count_foo).toBe(3);
  expect(d[2].count_bar).toBe(3);

  // multiple counts plus other measures
  df = new vega.Dataflow();
  col = df.add(Collect);
  agg = df.add(JoinAggregate, {
    fields: [null, foo, bar, bar],
    ops: ['count', 'sum', 'sum', 'count'],
    pulse: col
  });
  out = df.add(Collect, {pulse: agg});

  data = [
    {foo:0, bar:1},
    {foo:2, bar:3},
    {foo:4, bar:5}
  ];

  df.pulse(col, changeset().insert(data)).run();
  d = out.value;
  expect(d.length).toBe(3);
  expect(Object.keys(d[0]).length).toBe(6); // fields + outputs
  expect(d[0].foo).toBe(0);
  expect(d[0].bar).toBe(1);
  expect(d[0].count).toBe(3);
  expect(d[0].sum_foo).toBe(6);
  expect(d[0].sum_bar).toBe(9);
  expect(d[0].count_bar).toBe(3);
  expect(d[1].foo).toBe(2);
  expect(d[1].bar).toBe(3);
  expect(d[1].count).toBe(3);
  expect(d[1].sum_foo).toBe(6);
  expect(d[1].sum_bar).toBe(9);
  expect(d[1].count_bar).toBe(3);
  expect(d[2].foo).toBe(4);
  expect(d[2].bar).toBe(5);
  expect(d[2].count).toBe(3);
  expect(d[2].sum_foo).toBe(6);
  expect(d[2].sum_bar).toBe(9);
  expect(d[2].count_bar).toBe(3);
});

test('JoinAggregate handles distinct aggregates', function() {
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
      df, col, agg, out, d, i, n;

  // counts only
  df = new vega.Dataflow();
  col = df.add(Collect);
  agg = df.add(JoinAggregate, {
    fields: [foo],
    ops: ['distinct'],
    pulse: col
  });
  out = df.add(Collect, {pulse: agg});

  df.pulse(col, changeset().insert(data)).run();
  d = out.value;
  n = data.length;
  expect(d.length).toBe(n);
  for (i=0; i<n; ++i) {
    expect(d[i].distinct_foo).toBe(4);
  }

  df.pulse(col, changeset().remove(data[0])).run();
  d = out.value;
  n = data.length - 1;
  expect(d.length).toBe(n);
  for (i=0; i<n; ++i) {
    expect(d[i].distinct_foo).toBe(4);
  }

  df.pulse(col, changeset().remove(data[1])).run();
  d = out.value;
  n = data.length - 2;
  expect(d.length).toBe(n);
  for (i=0; i<n; ++i) {
    expect(d[i].distinct_foo).toBe(3);
  }
});
