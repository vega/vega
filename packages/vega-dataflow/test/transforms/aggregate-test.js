var tape = require('tape'),
    util = require('vega-util'),
    vega = require('../../'),
    changeset = vega.changeset,
    tx = vega.transforms;

tape('Aggregate aggregates tuples', function(test) {
  var data = [
    {k:'a', v:1}, {k:'b', v:3},
    {k:'a', v:2}, {k:'b', v:4}
  ];

  var key = util.field('k'),
      val = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(tx.Collect),
      agg = df.add(tx.Aggregate, {
        groupby: [key],
        fields: [val, val, val, val],
        ops: ['count', 'sum', 'min', 'max'],
        pulse: col
      }),
      out = df.add(tx.Collect, {pulse: agg});

  // -- test adds
  df.pulse(col, changeset().insert(data)).run();
  var d = out.value;
  test.equal(d.length, 2);
  test.equal(d[0].k, 'a');
  test.equal(d[0].count_v, 2);
  test.equal(d[0].sum_v, 3);
  test.equal(d[0].min_v, 1);
  test.equal(d[0].max_v, 2);
  test.equal(d[1].k, 'b');
  test.equal(d[1].count_v, 2);
  test.equal(d[1].sum_v, 7);
  test.equal(d[1].min_v, 3);
  test.equal(d[1].max_v, 4);

  // -- test rems
  df.pulse(col, changeset().remove(data.slice(0, 2))).run();
  d = out.value;
  test.equal(d.length, 2);
  test.equal(d[0].k, 'a');
  test.equal(d[0].count_v, 1);
  test.equal(d[0].sum_v, 2);
  test.equal(d[0].min_v, 2);
  test.equal(d[0].max_v, 2);
  test.equal(d[1].k, 'b');
  test.equal(d[1].count_v, 1);
  test.equal(d[1].sum_v, 4);
  test.equal(d[1].min_v, 4);
  test.equal(d[1].max_v, 4);

  // -- test mods, no groupby change
  df.pulse(col, changeset().modify(data[2], 'v', 3)).run();
  d = out.value;
  test.equal(d.length, 2);
  test.equal(d[0].k, 'a');
  test.equal(d[0].count_v, 1);
  test.equal(d[0].sum_v, 3);
  test.equal(d[0].min_v, 3);
  test.equal(d[0].max_v, 3);
  test.equal(d[1].k, 'b');
  test.equal(d[1].count_v, 1);
  test.equal(d[1].sum_v, 4);
  test.equal(d[1].min_v, 4);
  test.equal(d[1].max_v, 4);

  // -- test mods, groupby change
  df.pulse(col, changeset().modify(data[2], 'k', 'b')).run();
  d = out.value;
  test.equal(d.length, 1);
  test.equal(d[0].k, 'b');
  test.equal(d[0].count_v, 2);
  test.equal(d[0].sum_v, 7);
  test.equal(d[0].min_v, 3);
  test.equal(d[0].max_v, 4);

  test.end();
});

tape('Aggregate handles count aggregates', function(test) {
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
  col = df.add(tx.Collect);
  agg = df.add(tx.Aggregate, {
    fields: [null, foo, bar],
    ops: ['count', 'count', 'count'],
    pulse: col
  });
  out = df.add(tx.Collect, {pulse: agg});

  df.pulse(col, changeset().insert(data)).run();
  d = out.value;
  test.equal(d.length, 1);
  test.equal(Object.keys(d[0]).length, 4); // outputs + id
  test.equal(d[0].count, 3);
  test.equal(d[0].count_foo, 3);
  test.equal(d[0].count_bar, 3);

  // multiple counts plus other measures
  df = new vega.Dataflow();
  col = df.add(tx.Collect);
  agg = df.add(tx.Aggregate, {
    fields: [null, foo, bar, bar],
    ops: ['count', 'sum', 'sum', 'count'],
    pulse: col
  });
  out = df.add(tx.Collect, {pulse: agg});

  df.pulse(col, changeset().insert(data)).run();
  d = out.value;
  test.equal(d.length, 1);
  test.equal(Object.keys(d[0]).length, 5); // outputs + id
  test.equal(d[0].count, 3);
  test.equal(d[0].sum_foo, 6);
  test.equal(d[0].sum_bar, 9);
  test.equal(d[0].count_bar, 3);

  test.end();
});