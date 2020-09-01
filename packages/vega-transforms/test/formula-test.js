var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Formula = tx.formula,
    Collect = tx.collect;

tape('Formula extends tuples', t => {
  const data = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ];

  var df = new vega.Dataflow(),
      x  = util.field('x'),
      y  = util.field('y'),
      f0 = util.accessor(t => t.id * 2, ['id']),
      f1 = util.accessor(t => t.value[0], ['value']),
      c0 = df.add(Collect),
      fa = df.add(Formula, {expr:f0, as:'x', pulse:c0}),
      fb = df.add(Formula, {expr:f1, as:'y', pulse:fa});

  // add data
  df.pulse(c0, changeset().insert(data)).run();
  t.equal(fb.pulse.add.length, 3);
  t.deepEqual(c0.value.map(x), [2, 6, 10]);
  t.deepEqual(c0.value.map(y), ['f', 'b', 'b']);

  // modify data
  df.pulse(c0, changeset()
    .modify(data[0], 'value', 'doo')
    .modify(data[0], 'id', '2'))
    .run();
  t.equal(fb.pulse.mod.length, 1);
  t.deepEqual(c0.value.map(x), [4, 6, 10]);
  t.deepEqual(c0.value.map(y), ['d', 'b', 'b']);

  t.end();
});
