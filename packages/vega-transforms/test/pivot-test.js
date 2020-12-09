var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Pivot = tx.pivot;

tape('Pivot pivots values', t => {
  const data = [
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
  t.equal(d.length, 3);
  t.equal(d[0].a, 'A');
  t.equal(d[0].u, 1);
  t.equal(d[0].v, 2);
  t.equal(d[1].a, 'B');
  t.equal(d[1].u, 3);
  t.equal(d[1].v, 4);
  t.equal(d[2].a, 'C');
  t.equal(d[2].u, 5);
  t.equal(d[2].v, 6);

  // -- process mods
  df.pulse(c0, changeset().modify(data[1], 'c', 9)).run();
  d = out.value;
  t.equal(d[0].a, 'A');
  t.equal(d[0].u, 1);
  t.equal(d[0].v, 9);

  // -- process block rems
  df.pulse(c0, changeset().remove(data.slice(4))).run();
  d = out.value;
  t.equal(d.length, 2);
  t.equal(d[0].a, 'A');
  t.equal(d[0].u, 1);
  t.equal(d[0].v, 9);
  t.equal(d[1].a, 'B');
  t.equal(d[1].u, 3);
  t.equal(d[1].v, 4);

  // -- process partial rems
  df.pulse(c0, changeset().remove([data[0], data[3]])).run();
  d = out.value;
  t.equal(d.length, 2);
  t.equal(d[0].a, 'A');
  t.equal(d[0].u, 0);
  t.equal(d[0].v, 9);
  t.equal(d[1].a, 'B');
  t.equal(d[1].u, 3);
  t.equal(d[1].v, 0);

  t.end();
});

tape('Pivot pivots values within limit', t => {
  const data = [
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
  t.equal(d.length, 2);
  t.equal(Object.keys(d[0]).length, 3);
  t.equal(d[0].a, 'A');
  t.equal(d[0].u, 1);
  t.equal(d[0].v, 2);
  t.equal(d[0].w, undefined);
  t.equal(Object.keys(d[1]).length, 3);
  t.equal(d[1].a, 'B');
  t.equal(d[1].u, 4);
  t.equal(d[1].v, 5);
  t.equal(d[1].w, undefined);

  t.end();
});

tape('Pivot handles count aggregate', t => {
  const data = [
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
  t.equal(d.length, 3);
  t.equal(d[0].a, 'A');
  t.equal(d[0].u, 1);
  t.equal(d[0].v, 1);
  t.equal(d[1].a, 'B');
  t.equal(d[1].u, 0);
  t.equal(d[1].v, 1);
  t.equal(d[2].a, 'C');
  t.equal(d[2].u, 1);
  t.equal(d[2].v, 0);

  t.end();
});
