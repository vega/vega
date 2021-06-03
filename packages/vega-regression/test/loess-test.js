var tape = require('tape');
var util = require('vega-util');
var vega = require('vega-dataflow');
var Collect = require('vega-transforms').collect;
var Loess = require('../').loess;
var changeset = vega.changeset;

tape('Loess handles repeated x-values', t => {
  const data = [
    {k: 'a', u: 1, v: 1}, {k: 'a', u: 2, v: 2}, {k: 'a', u: 3, v: 5},
    {k: 'b', u: 1, v: 3}, {k: 'b', u: 2, v: 6}, {k: 'b', u: 3, v: 7}
  ];

  var u = util.field('u');
  var v = util.field('v');
  var df = new vega.Dataflow();
  var col = df.add(Collect);
  var reg = df.add(Loess, {x: u, y: v, bandwidth: 1, pulse: col});
  var out = df.add(Collect, {pulse: reg});

  // -- test adds
  df.pulse(col, changeset().insert(data)).run();
  const d = out.value;
  t.equal(d.length, 3);
  t.equal(d[0].u, 1);
  t.equal(d[1].u, 2);
  t.equal(d[2].u, 3);
  t.equal(d[0].v.toFixed(10), (2).toFixed(10));
  t.equal(d[1].v.toFixed(10), (4).toFixed(10));
  t.equal(d[2].v.toFixed(10), (6).toFixed(10));

  t.end();
});

tape('Loess adapts bandwidth when too small', t => {
  const data = [
    {k: 'a', u: 1, v: 1}, {k: 'a', u: 2, v: 2}, {k: 'a', u: 3, v: 5},
    {k: 'b', u: 1, v: 2}, {k: 'b', u: 2, v: 5}, {k: 'b', u: 3, v: 6}
  ];

  var k = util.field('k');
  var u = util.field('u');
  var v = util.field('v');
  var df = new vega.Dataflow();
  var col = df.add(Collect);
  var reg = df.add(Loess, {
    groupby: [k],
    x: u,
    y: v,
    bandwidth: 0,
    pulse: col
  });
  var out = df.add(Collect, {pulse: reg});

  // -- test adds
  df.pulse(col, changeset().insert(data)).run();
  const d = out.value;

  const a = d.filter(_ => _.k === 'a');
  t.equal(a.length, 3);
  t.equal(a[0].u, 1);
  t.equal(a[0].v, 1);
  t.equal(a[1].u, 2);
  t.equal(a[1].v, 2);
  t.equal(a[2].u, 3);
  t.equal(a[2].v, 5);

  const b = d.filter(_ => _.k === 'b');
  t.equal(b.length, 3);
  t.equal(b[0].u, 1);
  t.equal(b[0].v, 2);
  t.equal(b[1].u, 2);
  t.equal(b[1].v, 5);
  t.equal(b[2].u, 3);
  t.equal(b[2].v, 6);

  t.end();
});
