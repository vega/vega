var tape = require('tape');
var util = require('vega-util');
var vega = require('vega-dataflow');
var Collect = require('vega-transforms').collect;
var Regression = require('../').regression;
var changeset = vega.changeset;

tape('Regression fits linear regression model', t => {
  const data = [
    {k: 'a', u: 2, v: 2}, {k: 'a', u: 1, v: 1},
    {k: 'b', u: 3, v: 2}, {k: 'b', u: 2, v: 1}
  ];

  var k = util.field('k');
  var u = util.field('u');
  var v = util.field('v');
  var df = new vega.Dataflow();
  var col = df.add(Collect);
  var reg = df.add(Regression, {
    method: 'linear',
    groupby: [k],
    x: u,
    y: v,
    pulse: col
  });
  var out = df.add(Collect, {pulse: reg});

  // -- test adds
  df.pulse(col, changeset().insert(data)).run();
  const d = out.value;
  t.equal(d.length, 4);

  t.equal(d[0].k, 'a');
  t.equal(d[0].u, 1);
  t.equal(d[0].v, 1);

  t.equal(d[1].k, 'a');
  t.equal(d[1].u, 2);
  t.equal(d[1].v, 2);

  t.equal(d[2].k, 'b');
  t.equal(d[2].u, 2);
  t.equal(d[2].v, 1);

  t.equal(d[3].k, 'b');
  t.equal(d[3].u, 3);
  t.equal(d[3].v, 2);

  t.end();
});

tape('Regression fits quadratic regression model', t => {
  var data = [0, 1, 2, 3].map(x => ({x: x, y: 1 + x*x}));
  var x = util.field('x');
  var y = util.field('y');
  var df = new vega.Dataflow();
  var col = df.add(Collect);
  var reg = df.add(Regression, {method: 'quad', x: x, y: y, pulse: col});
  var out = df.add(Collect, {pulse: reg});

  // -- test adds
  df.pulse(col, changeset().insert(data)).run();
  const d = out.value;
  t.equal(d[0].x, 0);
  t.equal(d[0].y, 1);
  t.equal(d[d.length-1].x, 3);
  t.equal(d[d.length-1].y, 10);

  t.end();
});

tape('Regression outputs model parameters', t => {
  var data = [0, 1, 2, 3].map(x => ({x: x, y: 1 + x*x}));
  var x = util.field('x');
  var y = util.field('y');
  var df = new vega.Dataflow();
  var col = df.add(Collect);
  var reg = df.add(Regression, {method: 'quad', params: true, x: x, y: y, pulse: col});
  var out = df.add(Collect, {pulse: reg});

  // -- test adds
  df.pulse(col, changeset().insert(data)).run();
  const d = out.value;
  t.equal(d.length, 1);
  t.deepEqual(d[0].coef, [1, 0, 1]);
  t.equal(d[0].rSquared, 1);

  t.end();
});
