const tape = require('tape');
const util = require('vega-util');
const vega = require('vega-dataflow');
const tx = require('../');
const changeset = vega.changeset;
const Aggregate = tx.aggregate;
const Collect = tx.collect;
const Values = tx.values;

tape('Values extracts values', function (t) {
  const data = [
    {k: 'a', v: 1},
    {k: 'b', v: 3},
    {k: 'c', v: 2},
    {k: 'd', v: 4}
  ];

  const key = util.field('k');
  const df = new vega.Dataflow();
  const srt = df.add(null);
  const col = df.add(Collect);
  const val = df.add(Values, {field: key, sort: srt, pulse: col});

  df.pulse(col, changeset().insert(data)).run();
  const values = val.value;
  t.deepEqual(values, ['a', 'b', 'c', 'd']);

  df.touch(val).run(); // no-op pulse
  t.equal(val.value, values); // no change!

  df.update(srt, util.compare('v', 'descending')).run();
  t.deepEqual(val.value, ['d', 'b', 'c', 'a']);

  t.end();
});

tape('Values extracts sorted domain values', function (t) {
  const byCount = util.compare('count', 'descending');
  const key = util.field('k');
  const df = new vega.Dataflow();
  const col = df.add(Collect);
  const agg = df.add(Aggregate, {groupby: key, pulse: col});
  const out = df.add(Collect, {pulse: agg});
  const val = df.add(Values, {field: key, sort: byCount, pulse: out});

  // -- initial
  df.pulse(
    col,
    changeset().insert([
      {k: 'b', v: 1},
      {k: 'a', v: 2},
      {k: 'a', v: 3}
    ])
  ).run();
  t.deepEqual(val.value, ['a', 'b']);

  // -- update
  df.pulse(
    col,
    changeset().insert([
      {k: 'b', v: 1},
      {k: 'b', v: 2},
      {k: 'c', v: 3}
    ])
  ).run();
  t.deepEqual(val.value, ['b', 'a', 'c']);

  t.end();
});

tape('Values extracts multi-domain values', function (t) {
  const byCount = util.compare('count', 'descending');
  const count = util.field('count');
  const key = util.field('key');
  const k1 = util.field('k1', 'key');
  const k2 = util.field('k2', 'key');
  const df = new vega.Dataflow();
  const col = df.add(Collect);
  const ag1 = df.add(Aggregate, {groupby: k1, pulse: col});
  const ca1 = df.add(Collect, {pulse: ag1});
  const ag2 = df.add(Aggregate, {groupby: k2, pulse: col});
  const ca2 = df.add(Collect, {pulse: ag2});
  const sum = df.add(Aggregate, {groupby: key, fields: [count], ops: ['sum'], as: ['count'], pulse: [ca1, ca2]});
  const out = df.add(Collect, {sort: byCount, pulse: sum});
  const val = df.add(Values, {field: key, pulse: out});

  // -- initial
  df.pulse(
    col,
    changeset().insert([
      {k1: 'b', k2: 'a'},
      {k1: 'a', k2: 'c'},
      {k1: 'c', k2: 'a'}
    ])
  ).run();
  t.deepEqual(val.value, ['a', 'c', 'b']);

  // -- update
  df.pulse(
    col,
    changeset().insert([
      {k1: 'b', k2: 'b'},
      {k1: 'b', k2: 'c'},
      {k1: 'b', k2: 'c'}
    ])
  ).run();
  t.deepEqual(val.value, ['b', 'c', 'a']);

  t.end();
});
