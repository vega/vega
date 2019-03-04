var util = require('vega-util'), vega = require('vega-dataflow'), tx = require('../'), changeset = vega.changeset, Formula = tx.formula, Collect = tx.collect;

test('Formula extends tuples', function() {
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
  expect(fb.pulse.add.length).toBe(3);
  expect(c0.value.map(x)).toEqual([2, 6, 10]);
  expect(c0.value.map(y)).toEqual(['f', 'b', 'b']);

  // modify data
  df.pulse(c0, changeset()
    .modify(data[0], 'value', 'doo')
    .modify(data[0], 'id', '2'))
    .run();
  expect(fb.pulse.mod.length).toBe(1);
  expect(c0.value.map(x)).toEqual([4, 6, 10]);
  expect(c0.value.map(y)).toEqual(['d', 'b', 'b']);
});
