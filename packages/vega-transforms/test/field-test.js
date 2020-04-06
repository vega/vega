const tape = require('tape');
const util = require('vega-util');
const vega = require('vega-dataflow');
const Field = require('../').field;

tape('Field generates field accessors', function (t) {
  const df = new vega.Dataflow();
  const n = df.add('foo');
  const a = df.add(null);
  const f = df.add(Field, {name: n, as: a});

  df.run();
  t.equal(typeof f.value, 'function');
  t.equal(util.accessorName(f.value), 'foo');
  t.deepEqual(util.accessorFields(f.value), ['foo']);

  df.update(n, 'bar').run();
  t.equal(typeof f.value, 'function');
  t.equal(util.accessorName(f.value), 'bar');
  t.deepEqual(util.accessorFields(f.value), ['bar']);

  df.update(a, 'baz').run();
  t.equal(typeof f.value, 'function');
  t.equal(util.accessorName(f.value), 'baz');
  t.deepEqual(util.accessorFields(f.value), ['bar']);

  df.update(n, ['foo', 'bar']).run();
  t.equal(Array.isArray(f.value), true);
  t.deepEqual(f.value.map(util.accessorName), ['foo', 'bar']);
  t.deepEqual(f.value.map(util.accessorFields), [['foo'], ['bar']]);

  t.end();
});
