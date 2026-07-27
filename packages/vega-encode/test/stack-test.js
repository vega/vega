import tape from 'tape';
import { field } from 'vega-util';
import { Dataflow, changeset } from 'vega-dataflow';
import { collect as Collect } from 'vega-transforms';
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
