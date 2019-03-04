var util = require('vega-util'), vega = require('vega-dataflow'), Field = require('../').field;

test('Field generates field accessors', function() {
  var df = new vega.Dataflow(),
      n = df.add('foo'),
      a = df.add(null),
      f = df.add(Field, {name:n, as:a});

  df.run();
  expect(typeof f.value).toBe('function');
  expect(util.accessorName(f.value)).toBe('foo');
  expect(util.accessorFields(f.value)).toEqual(['foo']);

  df.update(n, 'bar').run();
  expect(typeof f.value).toBe('function');
  expect(util.accessorName(f.value)).toBe('bar');
  expect(util.accessorFields(f.value)).toEqual(['bar']);

  df.update(a, 'baz').run();
  expect(typeof f.value).toBe('function');
  expect(util.accessorName(f.value)).toBe('baz');
  expect(util.accessorFields(f.value)).toEqual(['bar']);

  df.update(n, ['foo', 'bar']).run();
  expect(Array.isArray(f.value)).toBe(true);
  expect(f.value.map(util.accessorName)).toEqual(['foo', 'bar']);
  expect(f.value.map(util.accessorFields)).toEqual([['foo'], ['bar']]);
});
