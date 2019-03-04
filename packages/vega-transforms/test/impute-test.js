var util = require('vega-util'), vega = require('vega-dataflow'), tx = require('../'), changeset = vega.changeset, Collect = tx.collect, Impute = tx.impute;

test('Impute imputes missing tuples', function() {
  var data = [
    {'x': 0, 'y': 28, 'c':0},
    {'x': 0, 'y': 55, 'c':1},
    {'x': 1, 'y': 43, 'c':0}
  ];

  var x = util.field('x'),
      y = util.field('y'),
      c = util.field('c'),
      df = new vega.Dataflow(),
      m  = df.add('value'),
      co = df.add(Collect),
      im = df.add(Impute, {
        field: y,
        method: m,
        value: -1,
        groupby: [c],
        key: x,
        pulse: co
      });

  df.pulse(co, changeset().insert(data)).run();

  var p = im.pulse;
  expect(p.add.length).toBe(4);
  expect(p.add[3].c).toBe(1);
  expect(p.add[3].x).toBe(1);
  expect(p.add[3].y).toBe(-1);

  ['min', 'max', 'mean', 'median'].forEach(function(method) {
    df.update(m, method).run();
    p = im.pulse;
    expect(p.rem.length).toBe(1);
    expect(p.add.length).toBe(1);
    expect(p.add[0].c).toBe(1);
    expect(p.add[0].x).toBe(1);
    expect(p.add[0].y).toBe(55);
  });
});

test('Impute imputes missing tuples for provided domain', function() {
  var data = [
    {c: 0, x: 0, y: 28},
    {c: 1, x: 0, y: 55},
    {c: 0, x: 1, y: 43},
    {c: 0, x: 2, y: -1},
    {c: 0, x: 3, y: -1},
    {c: 1, x: 2, y: -1},
    {c: 1, x: 3, y: -1},
    {c: 1, x: 1, y: -1}
  ];

  var x = util.field('x'),
      y = util.field('y'),
      c = util.field('c'),
      df = new vega.Dataflow(),
      m  = df.add('value'),
      co = df.add(Collect),
      im = df.add(Impute, {
        field: y,
        method: m,
        value: -1,
        groupby: [c],
        key: x,
        keyvals: [2, 3],
        pulse: co
      });

  df.pulse(co, changeset().insert(data.slice(0, 3))).run();

  var p = im.pulse;
  expect(p.add.length).toBe(8);
  for (var i=0; i<data.length; ++i) {
    expect(p.add[i].c).toBe(data[i].c);
    expect(p.add[i].x).toBe(data[i].x);
    expect(p.add[i].y).toBe(data[i].y);
  }
});

test('Impute imputes missing tuples without groupby', function() {
  var data = [
    {x: 0, y: 28},
    {x: 1, y: 43},
    {x: 2, y: -1},
    {x: 3, y: -1}
  ];

  var x = util.field('x'),
      y = util.field('y'),
      df = new vega.Dataflow(),
      m  = df.add('value'),
      co = df.add(Collect),
      im = df.add(Impute, {
        field: y,
        method: m,
        value: -1,
        key: x,
        keyvals: [2, 3],
        pulse: co
      });

  df.pulse(co, changeset().insert(data.slice(0, 2))).run();

  var p = im.pulse;
  expect(p.add.length).toBe(4);
  for (var i=0; i<data.length; ++i) {
    expect(p.add[i].c).toBe(data[i].c);
    expect(p.add[i].x).toBe(data[i].x);
    expect(p.add[i].y).toBe(data[i].y);
  }
});
