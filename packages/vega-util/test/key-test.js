var vega = require('../');

test('key creates a key accessor', function() {
  var _ = {a:1, b:2, c:3, d:{0:5, e:4}}, k;

  k = vega.key();
  expect(typeof k).toBe('function');
  expect(vega.accessorName(k)).toBe('key');
  expect(vega.accessorFields(k)).toEqual([]);
  expect(k(_)).toBe('');

  k = vega.key('a');
  expect(typeof k).toBe('function');
  expect(vega.accessorName(k)).toBe('key');
  expect(vega.accessorFields(k)).toEqual(['a']);
  expect(k(_)).toBe('1');

  k = vega.key(['a']);
  expect(typeof k).toBe('function');
  expect(vega.accessorName(k)).toBe('key');
  expect(vega.accessorFields(k)).toEqual(['a']);
  expect(k(_)).toBe('1');

  k = vega.key(['a', 'b', 'c']);
  expect(typeof k).toBe('function');
  expect(vega.accessorName(k)).toBe('key');
  expect(vega.accessorFields(k)).toEqual(['a', 'b', 'c']);
  expect(k(_)).toBe('1|2|3');

  k = vega.key(['a', 'c', 'd.e']);
  expect(typeof k).toBe('function');
  expect(vega.accessorName(k)).toBe('key');
  expect(vega.accessorFields(k)).toEqual(['a', 'c', 'd.e']);
  expect(k(_)).toBe('1|3|4');

  k = vega.key(['a', 'c', 'd["e"]', 'd[0]']);
  expect(typeof k).toBe('function');
  expect(vega.accessorName(k)).toBe('key');
  expect(vega.accessorFields(k)).toEqual(['a', 'c', 'd["e"]', 'd[0]']);
  expect(k(_)).toBe('1|3|4|5');
});

test('key respects the "flat" argument', function() {
  var _ = {"d.e": 1, "d[e]": 2, d:{0:5, e:4}}, k;

  k = vega.key('d.e', false);
  expect(typeof k).toBe('function');
  expect(vega.accessorName(k)).toBe('key');
  expect(vega.accessorFields(k)).toEqual(['d.e']);
  expect(k(_)).toBe('4');

  k = vega.key('d.e', true);
  expect(typeof k).toBe('function');
  expect(vega.accessorName(k)).toBe('key');
  expect(vega.accessorFields(k)).toEqual(['d.e']);
  expect(k(_)).toBe('1');

  k = vega.key('d\\.e', true);
  expect(typeof k).toBe('function');
  expect(vega.accessorName(k)).toBe('key');
  expect(vega.accessorFields(k)).toEqual(['d.e']);
  expect(k(_)).toBe('1');

  k = vega.key('d\\[e\\]', true);
  expect(typeof k).toBe('function');
  expect(vega.accessorName(k)).toBe('key');
  expect(vega.accessorFields(k)).toEqual(['d[e]']);
  expect(k(_)).toBe('2');
});
