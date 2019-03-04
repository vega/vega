var util = require('vega-util'), vega = require('vega-dataflow'), tx = require('../'), changeset = vega.changeset, Collect = tx.collect, Flatten = tx.flatten;

test('Flatten flattens arrays', function() {
  var data = [
    { k: 'a', v: [ 1, 2 ] },
    { k: 'b', v: [ 3, 4, 5 ] }
  ];

  var v = util.field('v'),
      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      fl = df.add(Flatten, {fields: [v], pulse:c0}),
      out = df.add(Collect, {pulse: fl}),
      d;

  // -- process adds
  df.pulse(c0, changeset().insert(data)).run();
  d = out.value;
  expect(d.length).toBe(5);
  expect(d[0].k).toBe('a');expect(d[0].v).toBe(1);
  expect(d[1].k).toBe('a');expect(d[1].v).toBe(2);
  expect(d[2].k).toBe('b');expect(d[2].v).toBe(3);
  expect(d[3].k).toBe('b');expect(d[3].v).toBe(4);
  expect(d[4].k).toBe('b');expect(d[4].v).toBe(5);

  // -- process mods
  df.pulse(c0, changeset().modify(data[0], 'v', [1, 9])).run();
  d = out.value;
  expect(d.length).toBe(5);
  expect(d[0].k).toBe('a');expect(d[0].v).toBe(1);
  expect(d[1].k).toBe('a');expect(d[1].v).toBe(9);
  expect(d[2].k).toBe('b');expect(d[2].v).toBe(3);
  expect(d[3].k).toBe('b');expect(d[3].v).toBe(4);
  expect(d[4].k).toBe('b');expect(d[4].v).toBe(5);

  // -- process rems
  df.pulse(c0, changeset().remove(data[0])).run();
  d = out.value;
  expect(d.length).toBe(3);
  expect(d[0].k).toBe('b');expect(d[0].v).toBe(3);
  expect(d[1].k).toBe('b');expect(d[1].v).toBe(4);
  expect(d[2].k).toBe('b');expect(d[2].v).toBe(5);
});

test('Flatten flattens parallel arrays', function() {
  var data = [
    { k: 'a', a: [ 1, 2 ], b: [ 'A', 'B'] },
    { k: 'b', a: [ 3, 4, 5 ], b: [ 'C', 'D', 'E' ]}
  ];

  var a = util.field('a'),
      b = util.field('b'),
      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      fl = df.add(Flatten, {fields: [a, b], pulse:c0}),
      out = df.add(Collect, {pulse: fl}),
      d;

  // -- process adds
  df.pulse(c0, changeset().insert(data)).run();
  d = out.value;
  expect(d.length).toBe(5);
  expect(d[0].k).toBe('a');expect(d[0].a).toBe(1);expect(d[0].b).toBe('A');
  expect(d[1].k).toBe('a');expect(d[1].a).toBe(2);expect(d[1].b).toBe('B');
  expect(d[2].k).toBe('b');expect(d[2].a).toBe(3);expect(d[2].b).toBe('C');
  expect(d[3].k).toBe('b');expect(d[3].a).toBe(4);expect(d[3].b).toBe('D');
  expect(d[4].k).toBe('b');expect(d[4].a).toBe(5);expect(d[4].b).toBe('E');

  // -- process mods
  df.pulse(c0, changeset().modify(data[0], 'a', [1, 9])).run();
  d = out.value;
  expect(d.length).toBe(5);
  expect(d[0].k).toBe('a');expect(d[0].a).toBe(1);expect(d[0].b).toBe('A');
  expect(d[1].k).toBe('a');expect(d[1].a).toBe(9);expect(d[1].b).toBe('B');
  expect(d[2].k).toBe('b');expect(d[2].a).toBe(3);expect(d[2].b).toBe('C');
  expect(d[3].k).toBe('b');expect(d[3].a).toBe(4);expect(d[3].b).toBe('D');
  expect(d[4].k).toBe('b');expect(d[4].a).toBe(5);expect(d[4].b).toBe('E');

  // -- process rems
  df.pulse(c0, changeset().remove(data[0])).run();
  d = out.value;
  expect(d.length).toBe(3);
  expect(d[0].k).toBe('b');expect(d[0].a).toBe(3);expect(d[0].b).toBe('C');
  expect(d[1].k).toBe('b');expect(d[1].a).toBe(4);expect(d[1].b).toBe('D');
  expect(d[2].k).toBe('b');expect(d[2].a).toBe(5);expect(d[2].b).toBe('E');
});
