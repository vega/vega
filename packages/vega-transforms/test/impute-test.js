var tape = require('tape');
var util = require('vega-util');
var vega = require('vega-dataflow');
var tx = require('../');
var changeset = vega.changeset;
var Collect = tx.collect;
var Impute = tx.impute;

tape('Impute imputes missing tuples', t => {
  const data = [
    {'x': 0, 'y': 28, 'c':0},
    {'x': 0, 'y': 55, 'c':1},
    {'x': 1, 'y': 43, 'c':0}
  ];

  var x = util.field('x');
  var y = util.field('y');
  var c = util.field('c');
  var df = new vega.Dataflow();
  var m  = df.add('value');
  var co = df.add(Collect);
  var im = df.add(Impute, {
    field: y,
    method: m,
    value: -1,
    groupby: [c],
    key: x,
    pulse: co
  });

  df.pulse(co, changeset().insert(data)).run();

  let p = im.pulse;
  t.equal(p.add.length, 4);
  t.equal(p.add[3].c, 1);
  t.equal(p.add[3].x, 1);
  t.equal(p.add[3].y, -1);

  ['min', 'max', 'mean', 'median'].forEach(method => {
    df.update(m, method).run();
    p = im.pulse;
    t.equal(p.rem.length, 1);
    t.equal(p.add.length, 1);
    t.equal(p.add[0].c, 1);
    t.equal(p.add[0].x, 1);
    t.equal(p.add[0].y, 55);
  });

  t.end();
});

tape('Impute imputes missing tuples for provided domain', t => {
  const data = [
    {c: 0, x: 0, y: 28},
    {c: 1, x: 0, y: 55},
    {c: 0, x: 1, y: 43},
    {c: 0, x: 2, y: -1},
    {c: 0, x: 3, y: -1},
    {c: 1, x: 2, y: -1},
    {c: 1, x: 3, y: -1},
    {c: 1, x: 1, y: -1}
  ];

  var x = util.field('x');
  var y = util.field('y');
  var c = util.field('c');
  var df = new vega.Dataflow();
  var m  = df.add('value');
  var co = df.add(Collect);
  var im = df.add(Impute, {
    field: y,
    method: m,
    value: -1,
    groupby: [c],
    key: x,
    keyvals: [2, 3],
    pulse: co
  });

  df.pulse(co, changeset().insert(data.slice(0, 3))).run();

  const p = im.pulse;
  t.equal(p.add.length, 8);
  for (let i=0; i<data.length; ++i) {
    t.equal(p.add[i].c, data[i].c);
    t.equal(p.add[i].x, data[i].x);
    t.equal(p.add[i].y, data[i].y);
  }

  t.end();
});

tape('Impute imputes missing tuples without groupby', t => {
  const data = [
    {x: 0, y: 28},
    {x: 1, y: 43},
    {x: 2, y: -1},
    {x: 3, y: -1}
  ];

  var x = util.field('x');
  var y = util.field('y');
  var df = new vega.Dataflow();
  var m  = df.add('value');
  var co = df.add(Collect);
  var im = df.add(Impute, {
    field: y,
    method: m,
    value: -1,
    key: x,
    keyvals: [2, 3],
    pulse: co
  });

  df.pulse(co, changeset().insert(data.slice(0, 2))).run();

  const p = im.pulse;
  t.equal(p.add.length, 4);
  for (let i=0; i<data.length; ++i) {
    t.equal(p.add[i].c, data[i].c);
    t.equal(p.add[i].x, data[i].x);
    t.equal(p.add[i].y, data[i].y);
  }

  t.end();
});
