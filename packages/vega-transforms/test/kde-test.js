var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    KDE = tx.kde;

tape('KDE computes kernel density estimates', t => {
  const data = [
    {k:'a', v:1}, {k:'a', v:2}, {k:'a', v:2}, {k:'a', v:3},
    {k:'b', v:1}, {k:'b', v:1}, {k:'b', v:2}
  ];

  var key = util.field('k'),
      val = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(Collect),
      kde = df.add(KDE, {
        groupby: [key],
        cumulative: true,
        steps: 10,
        field: val,
        pulse: col
      }),
      out = df.add(Collect, {pulse: kde});

  // -- test adds
  df.pulse(col, changeset().insert(data)).run();
  const d = out.value;
  t.equal(d.length, 22);
  t.equal(d[10].k, 'a');
  t.equal(d[10].value, 3);
  t.ok(d[10].density > 0.8);
  t.equal(d[21].k, 'b');
  t.equal(d[21].value, 2);
  t.ok(d[21].density > 0.8);

  t.end();
});

tape('KDE computes estimates with shared configurations', t => {
  const data = [
    {k:'a', v:1}, {k:'a', v:2}, {k:'a', v:2}, {k:'a', v:3},
    {k:'b', v:1}, {k:'b', v:1}, {k:'b', v:2}
  ];

  var key = util.field('k'),
      val = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(Collect),
      kde = df.add(KDE, {
        groupby: [key],
        resolve: 'shared',
        maxsteps: 10,
        field: val,
        pulse: col
      }),
      out = df.add(Collect, {pulse: kde});

  // -- test adds
  df.pulse(col, changeset().insert(data)).run();
  const d = out.value;
  t.equal(d.length, 22);
  for (let i=0; i<11; ++i) {
    t.equal(d[i].value, d[i+11].value);
  }

  t.end();
});

tape('KDE computes unnormalized kernel density estimates', t => {
  const data = [
    {k:'a', v:1}, {k:'a', v:2}, {k:'a', v:2}, {k:'a', v:3},
    {k:'b', v:1}, {k:'b', v:1}, {k:'b', v:2}
  ];

  var key = util.field('k'),
      val = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(Collect),
      kde = df.add(KDE, {
        groupby: [key],
        cumulative: true,
        counts: true,
        steps: 10,
        field: val,
        pulse: col
      }),
      out = df.add(Collect, {pulse: kde});

  // -- test adds
  df.pulse(col, changeset().insert(data)).run();
  const d = out.value;
  t.equal(d.length, 22);
  t.equal(d[10].k, 'a');
  t.equal(d[10].value, 3);
  t.ok(d[10].density > 4 * 0.8);
  t.equal(d[21].k, 'b');
  t.equal(d[21].value, 2);
  t.ok(d[21].density > 3 * 0.8);

  t.end();
});
