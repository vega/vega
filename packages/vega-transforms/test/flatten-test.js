var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Flatten = tx.flatten;

tape('Flatten flattens arrays', function(test) {
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
  test.equal(d.length, 5);
  test.equal(d[0].k, 'a'); test.equal(d[0].v, 1);
  test.equal(d[1].k, 'a'); test.equal(d[1].v, 2);
  test.equal(d[2].k, 'b'); test.equal(d[2].v, 3);
  test.equal(d[3].k, 'b'); test.equal(d[3].v, 4);
  test.equal(d[4].k, 'b'); test.equal(d[4].v, 5);

  // -- process mods
  df.pulse(c0, changeset().modify(data[0], 'v', [1, 9])).run();
  d = out.value;
  test.equal(d.length, 5);
  test.equal(d[0].k, 'a'); test.equal(d[0].v, 1);
  test.equal(d[1].k, 'a'); test.equal(d[1].v, 9);
  test.equal(d[2].k, 'b'); test.equal(d[2].v, 3);
  test.equal(d[3].k, 'b'); test.equal(d[3].v, 4);
  test.equal(d[4].k, 'b'); test.equal(d[4].v, 5);

  // -- process rems
  df.pulse(c0, changeset().remove(data[0])).run();
  d = out.value;
  test.equal(d.length, 3);
  test.equal(d[0].k, 'b'); test.equal(d[0].v, 3);
  test.equal(d[1].k, 'b'); test.equal(d[1].v, 4);
  test.equal(d[2].k, 'b'); test.equal(d[2].v, 5);

  test.end();
});

tape('Flatten flattens parallel arrays', function(test) {
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
  test.equal(d.length, 5);
  test.equal(d[0].k, 'a'); test.equal(d[0].a, 1); test.equal(d[0].b, 'A');
  test.equal(d[1].k, 'a'); test.equal(d[1].a, 2); test.equal(d[1].b, 'B');
  test.equal(d[2].k, 'b'); test.equal(d[2].a, 3); test.equal(d[2].b, 'C');
  test.equal(d[3].k, 'b'); test.equal(d[3].a, 4); test.equal(d[3].b, 'D');
  test.equal(d[4].k, 'b'); test.equal(d[4].a, 5); test.equal(d[4].b, 'E');

  // -- process mods
  df.pulse(c0, changeset().modify(data[0], 'a', [1, 9])).run();
  d = out.value;
  test.equal(d.length, 5);
  test.equal(d[0].k, 'a'); test.equal(d[0].a, 1); test.equal(d[0].b, 'A');
  test.equal(d[1].k, 'a'); test.equal(d[1].a, 9); test.equal(d[1].b, 'B');
  test.equal(d[2].k, 'b'); test.equal(d[2].a, 3); test.equal(d[2].b, 'C');
  test.equal(d[3].k, 'b'); test.equal(d[3].a, 4); test.equal(d[3].b, 'D');
  test.equal(d[4].k, 'b'); test.equal(d[4].a, 5); test.equal(d[4].b, 'E');

  // -- process rems
  df.pulse(c0, changeset().remove(data[0])).run();
  d = out.value;
  test.equal(d.length, 3);
  test.equal(d[0].k, 'b'); test.equal(d[0].a, 3); test.equal(d[0].b, 'C');
  test.equal(d[1].k, 'b'); test.equal(d[1].a, 4); test.equal(d[1].b, 'D');
  test.equal(d[2].k, 'b'); test.equal(d[2].a, 5); test.equal(d[2].b, 'E');

  test.end();
});
