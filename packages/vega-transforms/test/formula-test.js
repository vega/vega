var tape = require('tape');
var util = require('vega-util');
var vega = require('vega-dataflow');
var tx = require('../');
var changeset = vega.changeset;
var Formula = tx.formula;
var Collect = tx.collect;

tape('Formula extends tuples', t => {
  const data = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ];

  var df = new vega.Dataflow();
  var x  = util.field('x');
  var y  = util.field('y');
  var f0 = util.accessor(t => t.id * 2, ['id']);
  var f1 = util.accessor(t => t.value[0], ['value']);
  var c0 = df.add(Collect);
  var fa = df.add(Formula, {expr:f0, as:'x', pulse:c0});
  var fb = df.add(Formula, {expr:f1, as:'y', pulse:fa});

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
