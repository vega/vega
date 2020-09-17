var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Flatten = tx.flatten;

tape('Flatten flattens arrays', t => {
  const data = [
    { k: 'a', v: [ 1, 2 ] },
    { k: 'b', v: [ 3, 4, 5 ] }
  ];

  var v = util.field('v'),
      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      fl = df.add(Flatten, {fields: [v], pulse: c0}),
      out = df.add(Collect, {pulse: fl}),
      d;

  // -- process adds
  df.pulse(c0, changeset().insert(data)).run();
  d = out.value;
  t.equal(d.length, 5);
  t.equal(d[0].k, 'a'); t.equal(d[0].v, 1);
  t.equal(d[1].k, 'a'); t.equal(d[1].v, 2);
  t.equal(d[2].k, 'b'); t.equal(d[2].v, 3);
  t.equal(d[3].k, 'b'); t.equal(d[3].v, 4);
  t.equal(d[4].k, 'b'); t.equal(d[4].v, 5);
  t.equal(fl.pulse.fields['v'], true);

  // -- process mods
  df.pulse(c0, changeset().modify(data[0], 'v', [1, 9])).run();
  d = out.value;
  t.equal(d.length, 5);
  t.equal(d[0].k, 'a'); t.equal(d[0].v, 1);
  t.equal(d[1].k, 'a'); t.equal(d[1].v, 9);
  t.equal(d[2].k, 'b'); t.equal(d[2].v, 3);
  t.equal(d[3].k, 'b'); t.equal(d[3].v, 4);
  t.equal(d[4].k, 'b'); t.equal(d[4].v, 5);

  // -- process rems
  df.pulse(c0, changeset().remove(data[0])).run();
  d = out.value;
  t.equal(d.length, 3);
  t.equal(d[0].k, 'b'); t.equal(d[0].v, 3);
  t.equal(d[1].k, 'b'); t.equal(d[1].v, 4);
  t.equal(d[2].k, 'b'); t.equal(d[2].v, 5);

  t.end();
});

tape('Flatten flattens parallel arrays', t => {
  const data = [
    { k: 'a', a: [ 1, 2 ], b: [ 'A', 'B'] },
    { k: 'b', a: [ 3, 4, 5 ], b: [ 'C', 'D', 'E' ]}
  ];

  var a = util.field('a'),
      b = util.field('b'),
      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      fl = df.add(Flatten, {fields: [a, b], pulse: c0}),
      out = df.add(Collect, {pulse: fl}),
      d;

  // -- process adds
  df.pulse(c0, changeset().insert(data)).run();
  d = out.value;
  t.equal(d.length, 5);
  t.equal(d[0].k, 'a'); t.equal(d[0].a, 1); t.equal(d[0].b, 'A');
  t.equal(d[1].k, 'a'); t.equal(d[1].a, 2); t.equal(d[1].b, 'B');
  t.equal(d[2].k, 'b'); t.equal(d[2].a, 3); t.equal(d[2].b, 'C');
  t.equal(d[3].k, 'b'); t.equal(d[3].a, 4); t.equal(d[3].b, 'D');
  t.equal(d[4].k, 'b'); t.equal(d[4].a, 5); t.equal(d[4].b, 'E');

  // -- process mods
  df.pulse(c0, changeset().modify(data[0], 'a', [1, 9])).run();
  d = out.value;
  t.equal(d.length, 5);
  t.equal(d[0].k, 'a'); t.equal(d[0].a, 1); t.equal(d[0].b, 'A');
  t.equal(d[1].k, 'a'); t.equal(d[1].a, 9); t.equal(d[1].b, 'B');
  t.equal(d[2].k, 'b'); t.equal(d[2].a, 3); t.equal(d[2].b, 'C');
  t.equal(d[3].k, 'b'); t.equal(d[3].a, 4); t.equal(d[3].b, 'D');
  t.equal(d[4].k, 'b'); t.equal(d[4].a, 5); t.equal(d[4].b, 'E');

  // -- process rems
  df.pulse(c0, changeset().remove(data[0])).run();
  d = out.value;
  t.equal(d.length, 3);
  t.equal(d[0].k, 'b'); t.equal(d[0].a, 3); t.equal(d[0].b, 'C');
  t.equal(d[1].k, 'b'); t.equal(d[1].a, 4); t.equal(d[1].b, 'D');
  t.equal(d[2].k, 'b'); t.equal(d[2].a, 5); t.equal(d[2].b, 'E');

  t.end();
});


tape('Flatten flattens and adds index field', t => {
  const data = [
    { k: 'a', v: [ 1, 2 ] },
    { k: 'b', v: [ 3, 4, 5 ] }
  ];

  var v = util.field('v'),
      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      fl = df.add(Flatten, {fields: [v], pulse: c0, index: 'foo'}),
      out = df.add(Collect, {pulse: fl}),
      d;

  // -- process adds
  df.pulse(c0, changeset().insert(data)).run();
  d = out.value;
  t.equal(d.length, 5);
  t.equal(d[0].k, 'a'); t.equal(d[0].foo, 0);
  t.equal(d[1].k, 'a'); t.equal(d[1].foo, 1);
  t.equal(d[2].k, 'b'); t.equal(d[2].foo, 0);
  t.equal(d[3].k, 'b'); t.equal(d[3].foo, 1);
  t.equal(d[4].k, 'b'); t.equal(d[4].foo, 2);
  t.equal(fl.pulse.fields['v'], true);
  t.equal(fl.pulse.fields['foo'], true);

  // -- process mods
  df.pulse(c0, changeset().modify(data[0], 'v', [1, 9])).run();
  d = out.value;
  t.equal(d.length, 5);
  t.equal(d[0].k, 'a'); t.equal(d[0].foo, 0);
  t.equal(d[1].k, 'a'); t.equal(d[1].foo, 1);
  t.equal(d[2].k, 'b'); t.equal(d[2].foo, 0);
  t.equal(d[3].k, 'b'); t.equal(d[3].foo, 1);
  t.equal(d[4].k, 'b'); t.equal(d[4].foo, 2);

  // -- process rems
  df.pulse(c0, changeset().remove(data[0])).run();
  d = out.value;
  t.equal(d.length, 3);
  t.equal(d[0].k, 'b'); t.equal(d[0].foo, 0);
  t.equal(d[1].k, 'b'); t.equal(d[1].foo, 1);
  t.equal(d[2].k, 'b'); t.equal(d[2].foo, 2);

  t.end();
});
