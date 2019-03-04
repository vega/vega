var util = require('vega-util'), vega = require('vega-dataflow'), encode = require('../'), changeset = vega.changeset, Collect = require('vega-transforms').collect, DataJoin = encode.datajoin;

test('DataJoin joins tuples and items', function() {
  var data = [
    {key: 'a', value: 1},
    {key: 'b', value: 2},
    {key: 'c', value: 3}
  ];

  var df = new vega.Dataflow(),
      c0 = df.add(Collect),
      dj = df.add(DataJoin, {key:util.field('key'), pulse:c0});

  // Insert data, check for resulting items
  df.pulse(c0, changeset().insert(data)).run();
  expect(dj.pulse.add.length).toBe(3);
  expect(dj.pulse.rem.length).toBe(0);
  expect(dj.pulse.mod.length).toBe(0);
  expect(dj.pulse.add[0].datum).toBe(data[0]);
  expect(dj.pulse.add[1].datum).toBe(data[1]);
  expect(dj.pulse.add[2].datum).toBe(data[2]);

  // Redundant add should not change output size
  // Fake changeset to test invalid insert
  df.pulse(c0, {
    pulse: function(p) {
      p.add.push(data[0]);
      return p;
    }
  }).run();
  expect(dj.pulse.add.length).toBe(0);
  expect(dj.pulse.rem.length).toBe(0);
  expect(dj.pulse.mod.length).toBe(1);
  expect(dj.pulse.mod[0].datum).toBe(data[0]);

  // Remove datum, check for fewer items
  df.pulse(c0, changeset().remove(data[0])).run();
  expect(dj.pulse.add.length).toBe(0);
  expect(dj.pulse.rem.length).toBe(1);
  expect(dj.pulse.mod.length).toBe(0);
  expect(dj.pulse.rem[0].datum).toBe(data[0]);

  // Re-introduce datum, check for increased items
  df.pulse(c0, changeset().insert(data[0])).run();
  expect(dj.pulse.add.length).toBe(1);
  expect(dj.pulse.rem.length).toBe(0);
  expect(dj.pulse.mod.length).toBe(0);
  expect(dj.pulse.add[0].datum).toBe(data[0]);

  // Modify datum, check for modified item
  df.pulse(c0, changeset().modify(data[1], 'value', 5)).run();
  expect(dj.pulse.add.length).toBe(0);
  expect(dj.pulse.rem.length).toBe(0);
  expect(dj.pulse.mod.length).toBe(1);
  expect(dj.pulse.mod[0].datum).toBe(data[1]);
});

test('DataJoin garbage collects if requested', function() {
  var df = new vega.Dataflow(),
      c0 = df.add(Collect),
      dj = df.add(DataJoin, {clean:true, pulse:c0}),
      n = df.cleanThreshold + 1;

  function generate() {
    for (var data = [], i=0; i<n; ++i) {
      data.push({index: i});
    }
    return data;
  }

  // burn in by filling up to threshold, then remove all
  df.pulse(c0, changeset().insert(generate())).run();
  df.pulse(c0, changeset().remove(util.truthy)).run();
  expect(dj.value.empty).toBe(0);
});
