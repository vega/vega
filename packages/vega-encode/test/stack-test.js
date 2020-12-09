var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    encode = require('../'),
    changeset = vega.changeset,
    Collect = require('vega-transforms').collect,
    Stack = encode.stack;

tape('Stack stacks numeric values', t => {
  const data = [
    {key: 'a', value: 1},
    {key: 'a', value: 2},
    {key: 'b', value: 3},
    {key: 'b', value: 4}
  ];

  var df = new vega.Dataflow(),
      gb = df.add([]),
      c0 = df.add(Collect),
      st = df.add(Stack, {
        groupby: gb,
        field: util.field('value'),
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
  df.update(gb, [util.field('key')]).run();
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

  var df = new vega.Dataflow(),
      gb = df.add([]),
      c0 = df.add(Collect),
      st = df.add(Stack, {
        groupby: gb,
        field: util.field('value'),
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
  df.update(gb, [util.field('key')]).run();
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

  var df = new vega.Dataflow(),
      gb = df.add([]),
      c0 = df.add(Collect),
      st = df.add(Stack, {
        groupby: gb,
        field: util.field('value'),
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
  df.update(gb, [util.field('key')]).run();
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
