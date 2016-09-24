var tape = require('tape'),
    util = require('vega-util'),
    vega = require('../../'),
    changeset = vega.changeset,
    Formula = vega.transforms.Formula,
    Collect = vega.transforms.Collect;

tape('Formula extends tuples', function(test) {
  var data = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ];

  var df = new vega.Dataflow(),
      x  = util.field('x'),
      y  = util.field('y'),
      f0 = util.accessor(function(t) { return t.id * 2; }, ['id']),
      f1 = util.accessor(function(t) { return t.value[0]; }, ['value']),
      c0 = df.add(Collect),
      fa = df.add(Formula, {expr:f0, as:'x', pulse:c0}),
      fb = df.add(Formula, {expr:f1, as:'y', pulse:fa});

  // add data
  df.pulse(c0, changeset().insert(data)).run();
  test.equal(fb.pulse.add.length, 3);
  test.deepEqual(c0.value.map(x), [2, 6, 10]),
  test.deepEqual(c0.value.map(y), ['f', 'b', 'b']);

  // modify data
  df.pulse(c0, changeset()
    .modify(data[0], 'value', 'doo')
    .modify(data[0], 'id', '2'))
    .run();
  test.equal(fb.pulse.mod.length, 1);
  test.deepEqual(c0.value.map(x), [4, 6, 10]),
  test.deepEqual(c0.value.map(y), ['d', 'b', 'b']);

  test.end();
});
