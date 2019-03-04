var util = require('vega-util'), vega = require('vega-dataflow'), tx = require('../'), changeset = vega.changeset, Collect = tx.collect, Extent = tx.extent;

test('Extent computes extents', function() {
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
  expect(a.value).toEqual([0, 1]);
  expect(b.value).toEqual([28, 72]);

  df.update(f, y).run();
  expect(a.value).toEqual([28, 72]);
  expect(b.value).toEqual([28, 72]);
});

test('Extent handles empty and invalid data', function() {
  var x = util.field('x'),
      df = new vega.Dataflow(),
      c = df.add(Collect),
      e = df.add(Extent, {field:x, pulse:c});

  df.pulse(c, changeset().insert([])).run();
  expect(e.value).toEqual([undefined, undefined]);

  df.pulse(c, changeset().insert([
    {x: NaN}, {x: null}, {x: undefined}
  ])).run();
  expect(e.value).toEqual([undefined, undefined]);
});
