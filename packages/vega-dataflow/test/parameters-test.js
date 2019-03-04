var vega = require('../');

test('Parameters handles parameter values', function() {
  var p = new vega.Parameters;

  // test initial state
  expect(p.modified('foo')).toBe(false);
  expect(p.modified('bar', 1)).toBe(false);
  expect(p.modified(['foo', 'bar'])).toBe(false);

  // test scalar parameter
  expect(p.set('foo', -1, 3)).toBe(p);
  expect(p.modified('foo')).toBe(true);
  expect(p.modified('foo', -1)).toBe(true);
  expect(p.modified('foo', null)).toBe(true);
  expect(p.modified('foo', undefined)).toBe(true);
  expect(p.modified('foo', 0)).toBe(false);
  expect(p.modified('foo', 1)).toBe(false);
  expect(p.foo).toBe(3);

  // test array parameter
  var bar = ['a', 'b', 'c'];
  expect(p.set('bar', -1, bar)).toBe(p);
  expect(p.modified('bar')).toBe(true);
  expect(p.modified('bar', 0)).toBe(true);
  expect(p.modified('bar', 1)).toBe(true);
  expect(p.modified('bar', 2)).toBe(true);
  expect(p.modified('bar', 3)).toBe(false);

  // test clear
  expect(p.clear()).toBe(p);
  expect(p.modified('foo')).toBe(false);
  expect(p.modified('bar')).toBe(false);
  expect(p.modified('bar', 0)).toBe(false);
  expect(p.modified('bar', 1)).toBe(false);
  expect(p.modified('bar', 2)).toBe(false);

  // test array index parameter
  expect(p.set('bar', 1, 'd')).toBe(p);
  expect(p.modified('foo')).toBe(false);
  expect(p.modified('bar')).toBe(true);
  expect(p.modified('bar', 0)).toBe(false);
  expect(p.modified('bar', 1)).toBe(true);
  expect(p.modified('bar', 2)).toBe(false);
});
