var vega = require('vega-dataflow'), Compare = require('../').compare;

test('Compare generates comparator functions', function() {
  var df = new vega.Dataflow(),
      c = df.add('foo'),
      o = df.add('ascending'),
      f = df.add(Compare, {fields:c, orders:o});

  df.run();
  expect(typeof f.value).toBe('function');
  expect(f.value.fields).toEqual(['foo']);

  df.update(o, 'descending').run();
  expect(typeof f.value).toBe('function');
  expect(f.value.fields).toEqual(['foo']);

  df.update(c, 'bar').run();
  expect(typeof f.value).toBe('function');
  expect(f.value.fields).toEqual(['bar']);

  df.update(c, ['foo', 'bar'])
    .update(o, ['descending', 'descending'])
    .run();
  expect(typeof f.value).toBe('function');
  expect(f.value.fields).toEqual(['foo', 'bar']);

  df.update(c, null).update(o, null).run();
  expect(f.value).toBe(null);
});
