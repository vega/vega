var util = require('vega-util'), vega = require('vega-dataflow'), tx = require('../'), changeset = vega.changeset, Collect = tx.collect, Pivot = tx.pivot;

test('Pivot pivots values', function() {
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
  expect(d.length).toBe(3);
  expect(d[0].a).toBe('A');
  expect(d[0].u).toBe(1);
  expect(d[0].v).toBe(2);
  expect(d[1].a).toBe('B');
  expect(d[1].u).toBe(3);
  expect(d[1].v).toBe(4);
  expect(d[2].a).toBe('C');
  expect(d[2].u).toBe(5);
  expect(d[2].v).toBe(6);

  // -- process mods
  df.pulse(c0, changeset().modify(data[1], 'c', 9)).run();
  d = out.value;
  expect(d[0].a).toBe('A');
  expect(d[0].u).toBe(1);
  expect(d[0].v).toBe(9);

  // -- process block rems
  df.pulse(c0, changeset().remove(data.slice(4))).run();
  d = out.value;
  expect(d.length).toBe(2);
  expect(d[0].a).toBe('A');
  expect(d[0].u).toBe(1);
  expect(d[0].v).toBe(9);
  expect(d[1].a).toBe('B');
  expect(d[1].u).toBe(3);
  expect(d[1].v).toBe(4);

  // -- process partial rems
  df.pulse(c0, changeset().remove([data[0], data[3]])).run();
  d = out.value;
  expect(d.length).toBe(2);
  expect(d[0].a).toBe('A');
  expect(d[0].u).toBe(0);
  expect(d[0].v).toBe(9);
  expect(d[1].a).toBe('B');
  expect(d[1].u).toBe(3);
  expect(d[1].v).toBe(0);
});

test('Pivot pivots values within limit', function() {
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
  expect(d.length).toBe(2);
  expect(Object.keys(d[0]).length).toBe(3);
  expect(d[0].a).toBe('A');
  expect(d[0].u).toBe(1);
  expect(d[0].v).toBe(2);
  expect(d[0].w).toBe(undefined);
  expect(Object.keys(d[1]).length).toBe(3);
  expect(d[1].a).toBe('B');
  expect(d[1].u).toBe(4);
  expect(d[1].v).toBe(5);
  expect(d[1].w).toBe(undefined);
});

test('Pivot handles count aggregate', function() {
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
  expect(d.length).toBe(3);
  expect(d[0].a).toBe('A');
  expect(d[0].u).toBe(1);
  expect(d[0].v).toBe(1);
  expect(d[1].a).toBe('B');
  expect(d[1].u).toBe(0);
  expect(d[1].v).toBe(1);
  expect(d[2].a).toBe('C');
  expect(d[2].u).toBe(1);
  expect(d[2].v).toBe(0);
});
