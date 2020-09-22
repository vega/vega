var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Aggregate = tx.aggregate,
    Collect = tx.collect,
    Values = tx.values;

tape('Values extracts values', t => {
  const data = [
    {k:'a', v:1}, {k:'b', v:3},
    {k:'c', v:2}, {k:'d', v:4}
  ];

  var key = util.field('k'),
      df = new vega.Dataflow(),
      srt = df.add(null),
      col = df.add(Collect),
      val = df.add(Values, {field:key, sort:srt, pulse:col});

  df.pulse(col, changeset().insert(data)).run();
  const values = val.value;
  t.deepEqual(values, ['a', 'b', 'c', 'd']);

  df.touch(val).run(); // no-op pulse
  t.equal(val.value, values); // no change!

  df.update(srt, util.compare('v', 'descending')).run();
  t.deepEqual(val.value, ['d', 'b', 'c', 'a']);

  t.end();
});

tape('Values extracts sorted domain values', t => {
  var byCount = util.compare('count', 'descending'),
      key = util.field('k'),
      df = new vega.Dataflow(),
      col = df.add(Collect),
      agg = df.add(Aggregate, {groupby:key, pulse:col}),
      out = df.add(Collect, {pulse:agg}),
      val = df.add(Values, {field:key, sort:byCount, pulse:out});

  // -- initial
  df.pulse(col, changeset().insert([
    {k:'b', v:1}, {k:'a', v:2}, {k:'a', v:3}
  ])).run();
  t.deepEqual(val.value, ['a', 'b']);

  // -- update
  df.pulse(col, changeset().insert([
    {k:'b', v:1}, {k:'b', v:2}, {k:'c', v:3}
  ])).run();
  t.deepEqual(val.value, ['b', 'a', 'c']);

  t.end();
});

tape('Values extracts multi-domain values', t => {
  var byCount = util.compare('count', 'descending'),
      count = util.field('count'),
      key = util.field('key'),
      k1 = util.field('k1', 'key'),
      k2 = util.field('k2', 'key'),
      df = new vega.Dataflow(),
      col = df.add(Collect),
      ag1 = df.add(Aggregate, {groupby:k1, pulse:col}),
      ca1 = df.add(Collect, {pulse:ag1}),
      ag2 = df.add(Aggregate, {groupby:k2, pulse:col}),
      ca2 = df.add(Collect, {pulse:ag2}),
      sum = df.add(Aggregate, {groupby:key,
        fields:[count], ops:['sum'], as:['count'], pulse:[ca1, ca2]}),
      out = df.add(Collect, {sort:byCount, pulse:sum}),
      val = df.add(Values, {field:key, pulse:out});

  // -- initial
  df.pulse(col, changeset().insert([
    {k1:'b', k2:'a'}, {k1:'a', k2:'c'}, {k1:'c', k2:'a'}
  ])).run();
  t.deepEqual(val.value, ['a', 'c', 'b']);

  // -- update
  df.pulse(col, changeset().insert([
    {k1:'b', k2:'b'}, {k1:'b', k2:'c'}, {k1:'b', k2:'c'}
  ])).run();
  t.deepEqual(val.value, ['b', 'c', 'a']);

  t.end();
});
