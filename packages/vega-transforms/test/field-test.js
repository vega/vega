var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    Field = require('../').field;

tape('Field generates field accessors', function(test) {
  var df = new vega.Dataflow(),
      n = df.add('foo'),
      a = df.add(null),
      f = df.add(Field, {name:n, as:a});

  df.run();
  test.equal(typeof f.value, 'function');
  test.equal(util.accessorName(f.value), 'foo');
  test.deepEqual(util.accessorFields(f.value), ['foo']);

  df.update(n, 'bar').run();
  test.equal(typeof f.value, 'function');
  test.equal(util.accessorName(f.value), 'bar');
  test.deepEqual(util.accessorFields(f.value), ['bar']);

  df.update(a, 'baz').run();
  test.equal(typeof f.value, 'function');
  test.equal(util.accessorName(f.value), 'baz');
  test.deepEqual(util.accessorFields(f.value), ['bar']);

  df.update(n, ['foo', 'bar']).run();
  test.equal(Array.isArray(f.value), true);
  test.deepEqual(f.value.map(util.accessorName), ['foo', 'bar']);
  test.deepEqual(
    f.value.map(util.accessorFields),
    [['foo'], ['bar']]);

  test.end();
});
