import tape from 'tape';
import { compare, field } from 'vega-util';
import { Dataflow, changeset } from 'vega-dataflow';
import { aggregate as Aggregate, collect as Collect } from 'vega-transforms';
import { stack as Stack } from '../index.js';

tape('Stack stacks numeric values', t => {
  const data = [
    {key: 'a', value: 1},
    {key: 'a', value: 2},
    {key: 'b', value: 3},
    {key: 'b', value: 4}
  ];

  var df = new Dataflow(),
      gb = df.add([]),
      c0 = df.add(Collect),
      st = df.add(Stack, {
        groupby: gb,
        field: field('value'),
        pulse: c0
      });

  // Insert data
  df.pulse(c0, changeset().insert(data)).run();
  t.equal(st.pulse.add.length, 4);
  t.equal(st.pulse.rem.length, 0);
  t.equal(st.pulse.mod.length, 0);

  let d = c0.value;
  t.equal(d[0].y0, 0);
  t.equal(d[0].y1, 1);
  t.equal(d[1].y0, 1);
  t.equal(d[1].y1, 3);
  t.equal(d[2].y0, 3);
  t.equal(d[2].y1, 6);
  t.equal(d[3].y0, 6);
  t.equal(d[3].y1, 10);

  // Add groupby field
  df.update(gb, [field('key')]).run();
  t.equal(st.pulse.add.length, 0);
  t.equal(st.pulse.rem.length, 0);
  t.equal(st.pulse.mod.length, 4);

  d = c0.value;
  t.equal(d[0].y0, 0);
  t.equal(d[0].y1, 1);
  t.equal(d[1].y0, 1);
  t.equal(d[1].y1, 3);
  t.equal(d[2].y0, 0);
  t.equal(d[2].y1, 3);
  t.equal(d[3].y0, 3);
  t.equal(d[3].y1, 7);

  t.end();
});

tape('Stack stacks negative values', t => {
  const data = [
    {key: 'a', value: -1},
    {key: 'a', value: 2},
    {key: 'b', value: 3},
    {key: 'b', value: -4}
  ];

  var df = new Dataflow(),
      gb = df.add([]),
      c0 = df.add(Collect),
      st = df.add(Stack, {
        groupby: gb,
        field: field('value'),
        pulse: c0
      });

  // Insert data
  df.pulse(c0, changeset().insert(data)).run();
  t.equal(st.pulse.add.length, 4);
  t.equal(st.pulse.rem.length, 0);
  t.equal(st.pulse.mod.length, 0);

  let d = c0.value;
  t.equal(d[0].y0, 0);
  t.equal(d[0].y1, -1);
  t.equal(d[1].y0, 0);
  t.equal(d[1].y1, 2);
  t.equal(d[2].y0, 2);
  t.equal(d[2].y1, 5);
  t.equal(d[3].y0, -1);
  t.equal(d[3].y1, -5);

  // Add groupby field
  df.update(gb, [field('key')]).run();
  t.equal(st.pulse.add.length, 0);
  t.equal(st.pulse.rem.length, 0);
  t.equal(st.pulse.mod.length, 4);

  d = c0.value;
  t.equal(d[0].y0, 0);
  t.equal(d[0].y1, -1);
  t.equal(d[1].y0, 0);
  t.equal(d[1].y1, 2);
  t.equal(d[2].y0, 0);
  t.equal(d[2].y1, 3);
  t.equal(d[3].y0, 0);
  t.equal(d[3].y1, -4);

  t.end();
});

tape('Stack stacks coerced string values', t => {
  const data = [
    {key: 'a', value: '1'},
    {key: 'a', value: '2'},
    {key: 'b', value: '3'},
    {key: 'b', value: '4'}
  ];

  var df = new Dataflow(),
      gb = df.add([]),
      c0 = df.add(Collect),
      st = df.add(Stack, {
        groupby: gb,
        field: field('value'),
        pulse: c0
      });

  // Insert data
  df.pulse(c0, changeset().insert(data)).run();
  t.equal(st.pulse.add.length, 4);
  t.equal(st.pulse.rem.length, 0);
  t.equal(st.pulse.mod.length, 0);

  let d = c0.value;
  t.equal(d[0].y0, 0);
  t.equal(d[0].y1, 1);
  t.equal(d[1].y0, 1);
  t.equal(d[1].y1, 3);
  t.equal(d[2].y0, 3);
  t.equal(d[2].y1, 6);
  t.equal(d[3].y0, 6);
  t.equal(d[3].y1, 10);

  // Add groupby field
  df.update(gb, [field('key')]).run();
  t.equal(st.pulse.add.length, 0);
  t.equal(st.pulse.rem.length, 0);
  t.equal(st.pulse.mod.length, 4);

  d = c0.value;
  t.equal(d[0].y0, 0);
  t.equal(d[0].y1, 1);
  t.equal(d[1].y0, 1);
  t.equal(d[1].y1, 3);
  t.equal(d[2].y0, 0);
  t.equal(d[2].y1, 3);
  t.equal(d[3].y0, 3);
  t.equal(d[3].y1, 7);

  t.end();
});

tape('Stack stacks null and empty string groups separately', t => {
  const data = [
    {key: null, value: 1},
    {key: null, value: 2},
    {key: '', value: 3},
    {key: '', value: 4}
  ];

  var df = new Dataflow(),
      c0 = df.add(Collect),
      st = df.add(Stack, {
        groupby: [field('key')],
        field: field('value'),
        pulse: c0
      });

  // Insert data
  df.pulse(c0, changeset().insert(data)).run();
  t.equal(st.pulse.add.length, 4);
  t.equal(st.pulse.rem.length, 0);
  t.equal(st.pulse.mod.length, 0);

  const d = c0.value;
  t.equal(d[0].y0, 0);
  t.equal(d[0].y1, 1);
  t.equal(d[1].y0, 1);
  t.equal(d[1].y1, 3);
  t.equal(d[2].y0, 0);
  t.equal(d[2].y1, 3);
  t.equal(d[3].y0, 3);
  t.equal(d[3].y1, 7);

  t.end();
});

tape('Stack stacks zero and false groups separately', t => {
  const data = [
    {key: 0, value: 1},
    {key: 0, value: 2},
    {key: false, value: 3},
    {key: false, value: 4}
  ];

  var df = new Dataflow(),
      c0 = df.add(Collect),
      st = df.add(Stack, {
        groupby: [field('key')],
        field: field('value'),
        pulse: c0
      });

  // Insert data
  df.pulse(c0, changeset().insert(data)).run();
  t.equal(st.pulse.add.length, 4);
  t.equal(st.pulse.rem.length, 0);
  t.equal(st.pulse.mod.length, 0);

  const d = c0.value;
  t.equal(d[0].y0, 0);
  t.equal(d[0].y1, 1);
  t.equal(d[1].y0, 1);
  t.equal(d[1].y1, 3);
  t.equal(d[2].y0, 0);
  t.equal(d[2].y1, 3);
  t.equal(d[3].y0, 3);
  t.equal(d[3].y1, 7);

  t.end();
});

tape('Stack stacks multi-field groups with commas separately', t => {
  const data = [
    {u: 'a,b', v: 'c', value: 1},
    {u: 'a,b', v: 'c', value: 2},
    {u: 'a', v: 'b,c', value: 3},
    {u: 'a', v: 'b,c', value: 4}
  ];

  var df = new Dataflow(),
      c0 = df.add(Collect),
      st = df.add(Stack, {
        groupby: [field('u'), field('v')],
        field: field('value'),
        pulse: c0
      });

  // Insert data
  df.pulse(c0, changeset().insert(data)).run();
  t.equal(st.pulse.add.length, 4);
  t.equal(st.pulse.rem.length, 0);
  t.equal(st.pulse.mod.length, 0);

  const d = c0.value;
  t.equal(d[0].y0, 0);
  t.equal(d[0].y1, 1);
  t.equal(d[1].y0, 1);
  t.equal(d[1].y1, 3);
  t.equal(d[2].y0, 0);
  t.equal(d[2].y1, 3);
  t.equal(d[3].y0, 3);
  t.equal(d[3].y1, 7);

  t.end();
});

tape('Stack does not propagate missing or NaN values', t => {
  const expected = {
    zero: [[0, 1], [1, 1], [1, NaN], [1, NaN], [0, -3], [0, 2], [0, -6]],
    center: [[2, 3], [3, 3], [3, NaN], [3, NaN], [3, 6], [0, 2], [2, 8]],
    normalize: [[0, 0.25], [0.25, 0.25], [0.25, NaN], [0.25, NaN], [0.25, 1], [0, 0.25], [0.25, 1]]
  };

  for (const offset of Object.keys(expected)) {
    const values = [1, null, undefined, NaN, -3, '2', '-6'],
          data = values.map((value, i) => ({key: i < 5 ? 'a' : 'b', value})),
          df = new Dataflow(),
          col = df.add(Collect);
    df.add(Stack, {
      groupby: [field('key')],
      field: field('value'),
      offset,
      pulse: col
    });

    df.pulse(col, changeset().insert(data)).run();
    t.deepEqual(col.value.map(d => [d.y0, d.y1]), expected[offset], offset);
    t.deepEqual(col.value.map(d => d.value), values, 'preserves input values');
  }
  t.end();
});

tape('Stack preserves valid sums after an all-null aggregate', t => {
  const data = [1, 2, null, 3, 4].map((value, i) => ({key: i, value})),
        df = new Dataflow(),
        col = df.add(Collect),
        agg = df.add(Aggregate, {
          groupby: [field('key')],
          fields: [field('value')],
          ops: ['sum'],
          as: ['sum'],
          pulse: col
        }),
        sums = df.add(Collect, {pulse: agg}),
        sort = df.add(null);
  df.add(Stack, {field: field('sum'), sort, pulse: sums});
  df.update(sort, compare('key'));

  df.pulse(col, changeset().insert(data)).run();
  t.equal(sums.value[2].sum, undefined, 'empty aggregate stays undefined');
  t.deepEqual(sums.value.map(d => [d.y0, d.y1]),
    [[0, 1], [1, 3], [3, NaN], [3, 6], [6, 10]]);

  df.update(sort, compare('key', 'descending')).run();
  t.deepEqual(sums.value.map(d => [d.y0, d.y1]),
    [[9, 10], [7, 9], [7, NaN], [4, 7], [0, 4]], 'sort order does not hide valid rows');

  df.pulse(col, changeset().modify(data[2], 'value', 5)).run();
  t.deepEqual(sums.value.map(d => [d.y0, d.y1]),
    [[14, 15], [12, 14], [7, 12], [4, 7], [0, 4]], 'updates a formerly missing value');

  df.pulse(col, changeset().modify(data[2], 'value', null)).run();
  t.deepEqual(sums.value.map(d => [d.y0, d.y1]),
    [[9, 10], [7, 9], [7, NaN], [4, 7], [0, 4]], 'restores the missing value');
  t.end();
});
