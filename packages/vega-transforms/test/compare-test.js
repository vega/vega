var tape = require('tape');
var vega = require('vega-dataflow');
var Compare = require('../').compare;

tape('Compare generates comparator functions', t => {
  var df = new vega.Dataflow();
  var c = df.add('foo');
  var o = df.add('ascending');
  var f = df.add(Compare, {fields:c, orders:o});

  df.run();
  t.equal(typeof f.value, 'function');
  t.deepEqual(f.value.fields, ['foo']);

  df.update(o, 'descending').run();
  t.equal(typeof f.value, 'function');
  t.deepEqual(f.value.fields, ['foo']);

  df.update(c, 'bar').run();
  t.equal(typeof f.value, 'function');
  t.deepEqual(f.value.fields, ['bar']);

  df.update(c, ['foo', 'bar'])
    .update(o, ['descending', 'descending'])
    .run();
  t.equal(typeof f.value, 'function');
  t.deepEqual(f.value.fields, ['foo', 'bar']);

  df.update(c, null).update(o, null).run();
  t.equal(f.value, null);

  t.end();
});
