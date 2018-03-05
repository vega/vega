var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Pivot = tx.pivot;

tape('Pivot pivots values', function(test) {
  var data = [
    {a:'A', b:'u', c:1},
    {a:'A', b:'v', c:2},
    {a:'B', b:'u', c:3},
    {a:'B', b:'v', c:4},
    {a:'C', b:'u', c:5},
    {a:'C', b:'v', c:6}
  ];

  var a = util.field('a'),
      b = util.field('b'),
      c = util.field('c'),
      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      pd = df.add(Pivot, {groupby: [a], field: b, value: c, pulse: c0}),
      out = df.add(Collect, {pulse: pd}),
      d;

  // -- process adds
  df.pulse(c0, changeset().insert(data)).run();
  d = out.value;
  test.equal(d.length, 3);
  test.equal(d[0].a, 'A');
  test.equal(d[0].u, 1);
  test.equal(d[0].v, 2);
  test.equal(d[1].a, 'B');
  test.equal(d[1].u, 3);
  test.equal(d[1].v, 4);
  test.equal(d[2].a, 'C');
  test.equal(d[2].u, 5);
  test.equal(d[2].v, 6);

  // -- process mods
  df.pulse(c0, changeset().modify(data[1], 'c', 9)).run();
  d = out.value;
  test.equal(d[0].a, 'A');
  test.equal(d[0].u, 1);
  test.equal(d[0].v, 9);

  // -- process block rems
  df.pulse(c0, changeset().remove(data.slice(4))).run();
  d = out.value;
  test.equal(d.length, 2);
  test.equal(d[0].a, 'A');
  test.equal(d[0].u, 1);
  test.equal(d[0].v, 9);
  test.equal(d[1].a, 'B');
  test.equal(d[1].u, 3);
  test.equal(d[1].v, 4);

  // -- process partial rems
  df.pulse(c0, changeset().remove([data[0], data[3]])).run();
  d = out.value;
  test.equal(d.length, 2);
  test.equal(d[0].a, 'A');
  test.equal(d[0].u, 0);
  test.equal(d[0].v, 9);
  test.equal(d[1].a, 'B');
  test.equal(d[1].u, 3);
  test.equal(d[1].v, 0);

  test.end();
});

tape('Pivot pivots values within limit', function(test) {
  var data = [
    {a:'A', b:'u', c:1},
    {a:'A', b:'v', c:2},
    {a:'A', b:'w', c:3},
    {a:'B', b:'u', c:4},
    {a:'B', b:'v', c:5},
    {a:'B', b:'w', c:6}
  ];

  var a = util.field('a'),
      b = util.field('b'),
      c = util.field('c'),
      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      pd = df.add(Pivot, {groupby: [a], field: b, value: c, limit: 2, pulse: c0}),
      out = df.add(Collect, {pulse: pd}),
      d;

  // -- process adds
  df.pulse(c0, changeset().insert(data)).run();
  d = out.value;
  test.equal(d.length, 2);
  test.equal(Object.keys(d[0]).length, 3);
  test.equal(d[0].a, 'A');
  test.equal(d[0].u, 1);
  test.equal(d[0].v, 2);
  test.equal(d[0].w, undefined);
  test.equal(Object.keys(d[1]).length, 3);
  test.equal(d[1].a, 'B');
  test.equal(d[1].u, 4);
  test.equal(d[1].v, 5);
  test.equal(d[1].w, undefined);

  test.end();
});

tape('Pivot handles count aggregate', function(test) {
  var data = [
    {a:'A', b:'u', c:1},
    {a:'A', b:'v', c:null},
    {a:'B', b:'v', c:4},
    {a:'C', b:'u', c:undefined}
  ];

  var a = util.field('a'),
      b = util.field('b'),
      c = util.field('c'),
      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      pd = df.add(Pivot, {groupby: [a], field: b, op: 'count', value: c, pulse: c0}),
      out = df.add(Collect, {pulse: pd}),
      d;

  // -- process adds
  df.pulse(c0, changeset().insert(data)).run();
  d = out.value;
  test.equal(d.length, 3);
  test.equal(d[0].a, 'A');
  test.equal(d[0].u, 1);
  test.equal(d[0].v, 1);
  test.equal(d[1].a, 'B');
  test.equal(d[1].u, 0);
  test.equal(d[1].v, 1);
  test.equal(d[2].a, 'C');
  test.equal(d[2].u, 1);
  test.equal(d[2].v, 0);

  test.end();
});