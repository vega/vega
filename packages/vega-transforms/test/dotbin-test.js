var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    transforms = require('../'),
    changeset = vega.changeset,
    Collect = transforms.collect,
    DotBin = transforms.dotbin;

tape('DotBin assigns dot plot bin positions', t => {
  const data = [
    {key: 'a', value: 1},
    {key: 'a', value: 1},
    {key: 'a', value: 2},
    {key: 'a', value: 4},
    {key: 'b', value: 3},
    {key: 'b', value: 5},
    {key: 'b', value: 5.5}
  ];

  var df = new vega.Dataflow(),
      gb = df.add([]),
      c0 = df.add(Collect),
      db = df.add(DotBin, {
        field: util.field('value'),
        groupby: gb,
        step: 1.5,
        pulse: c0,
        as: 'x'
      });

  // Insert data
  df.pulse(c0, changeset().insert(data)).run();
  t.equal(db.pulse.add.length, 7);
  t.equal(db.pulse.rem.length, 0);
  t.equal(db.pulse.mod.length, 0);

  let d = c0.value;
  t.deepEqual(d[0], {key: 'a', value: 1, x: 1.5});
  t.deepEqual(d[1], {key: 'a', value: 1, x: 1.5});
  t.deepEqual(d[2], {key: 'a', value: 2, x: 1.5});
  t.deepEqual(d[3], {key: 'a', value: 4, x: 3.5});
  t.deepEqual(d[4], {key: 'b', value: 3, x: 3.5});
  t.deepEqual(d[5], {key: 'b', value: 5, x: 5.25});
  t.deepEqual(d[6], {key: 'b', value: 5.5, x: 5.25});

  // Add groupby field
  df.update(gb, [util.field('key')]).run();
  t.equal(db.pulse.add.length, 0);
  t.equal(db.pulse.rem.length, 0);
  t.equal(db.pulse.mod.length, 7);

  d = c0.value;
  t.deepEqual(d[0], {key: 'a', value: 1, x: 1.5});
  t.deepEqual(d[1], {key: 'a', value: 1, x: 1.5});
  t.deepEqual(d[2], {key: 'a', value: 2, x: 1.5});
  t.deepEqual(d[3], {key: 'a', value: 4, x: 4});
  t.deepEqual(d[4], {key: 'b', value: 3, x: 3});
  t.deepEqual(d[5], {key: 'b', value: 5, x: 5.25});
  t.deepEqual(d[6], {key: 'b', value: 5.5, x: 5.25});

  // Remove values
  df.pulse(c0, changeset().remove(t => t.value == 2 || t.value == 5.5)).run();
  t.equal(db.pulse.add.length, 0);
  t.equal(db.pulse.rem.length, 2);
  t.equal(db.pulse.mod.length, 5); // reflow: non-adds/rems should be in mod

  d = c0.value;
  t.deepEqual(d[0], {key: 'a', value: 1, x: 1});
  t.deepEqual(d[1], {key: 'a', value: 1, x: 1});
  t.deepEqual(d[2], {key: 'a', value: 4, x: 4});
  t.deepEqual(d[3], {key: 'b', value: 3, x: 3});
  t.deepEqual(d[4], {key: 'b', value: 5, x: 5});

  t.end();
});
