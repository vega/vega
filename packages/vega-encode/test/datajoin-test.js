var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    encode = require('../'),
    changeset = vega.changeset,
    Collect = vega.transforms.Collect,
    DataJoin = vega.transforms.DataJoin;

tape('DataJoin registers transforms', function(test) {
  test.equal(encode.transform, vega.transform);
  test.equal(encode.definition, vega.definition);
  test.end();
});

tape('DataJoin joins tuples and items', function(test) {
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
  test.equal(dj.pulse.add.length, 3);
  test.equal(dj.pulse.rem.length, 0);
  test.equal(dj.pulse.mod.length, 0);
  test.equal(dj.pulse.add[0].datum, data[0]);
  test.equal(dj.pulse.add[1].datum, data[1]);
  test.equal(dj.pulse.add[2].datum, data[2]);

  // Redundant add should not change output size
  df.pulse(c0, changeset().insert(data[0])).run();
  test.equal(dj.pulse.add.length, 0);
  test.equal(dj.pulse.rem.length, 0);
  test.equal(dj.pulse.mod.length, 1);
  test.equal(dj.pulse.mod[0].datum, data[0]);

  // Remove datum, check for fewer items
  df.pulse(c0, changeset().remove(data[0])).run();
  test.equal(dj.pulse.add.length, 0);
  test.equal(dj.pulse.rem.length, 1);
  test.equal(dj.pulse.mod.length, 0);
  test.equal(dj.pulse.rem[0].datum, data[0]);

  // Re-introduce datum, check for increased items
  df.pulse(c0, changeset().insert(data[0])).run();
  test.equal(dj.pulse.add.length, 1);
  test.equal(dj.pulse.rem.length, 0);
  test.equal(dj.pulse.mod.length, 0);
  test.equal(dj.pulse.add[0].datum, data[0]);

  // Modify datum, check for modified item
  df.pulse(c0, changeset().modify(data[1], 'value', 5)).run();
  test.equal(dj.pulse.add.length, 0);
  test.equal(dj.pulse.rem.length, 0);
  test.equal(dj.pulse.mod.length, 1);
  test.equal(dj.pulse.mod[0].datum, data[1]);

  test.end();
});

tape('DataJoin garbage collects if requested', function(test) {
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
  test.equal(dj.value.empty, 0, 'Zero empty map entries');

  test.end();
});