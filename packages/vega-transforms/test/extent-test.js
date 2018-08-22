var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Extent = tx.extent;

tape('Extent computes extents', function(test) {
  var data = [
    {"x": 0, "y": 28}, {"x": 1, "y": 43},
    {"x": 0, "y": 55}, {"x": 1, "y": 72}
  ];

  var x = util.field('x'),
      y = util.field('y'),
      df = new vega.Dataflow(),
      f = df.add(null),
      c = df.add(Collect),
      a = df.add(Extent, {field:f, pulse:c}),
      b = df.add(Extent, {field:y, pulse:c});

  df.update(f, x)
    .pulse(c, changeset().insert(data))
    .run();
  test.deepEqual(a.value, [0, 1]);
  test.deepEqual(b.value, [28, 72]);

  df.update(f, y).run();
  test.deepEqual(a.value, [28, 72]);
  test.deepEqual(b.value, [28, 72]);

  test.end();
});

tape('Extent handles empty and invalid data', function(test) {
  var x = util.field('x'),
      df = new vega.Dataflow(),
      c = df.add(Collect),
      e = df.add(Extent, {field:x, pulse:c});

  df.pulse(c, changeset().insert([])).run();
  test.deepEqual(e.value, [undefined, undefined]);

  df.pulse(c, changeset().insert([
    {x: NaN}, {x: null}, {x: undefined}
  ])).run();
  test.deepEqual(e.value, [undefined, undefined]);

  test.end();
});
