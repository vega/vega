var vega = require('../');

test('fastmap maps keys to values', function() {
  var m = vega.fastmap();

  m.set('foo', 1);
  m.set('bar', 2);
  m.set('baz', 3);

  expect(m.has('foo')).toBe(true);
  expect(m.has('bar')).toBe(true);
  expect(m.has('baz')).toBe(true);
  expect(m.has('bak')).toBe(false);

  expect(m.get('foo')).toBe(1);
  expect(m.get('bar')).toBe(2);
  expect(m.get('baz')).toBe(3);
  expect(m.get('bak')).toBe(undefined);

  expect(m.size).toBe(3);

  m.delete('foo');
  expect(m.size).toBe(2);
  expect(m.empty).toBe(1);
  expect(m.get('foo')).toBe(undefined);

  m.set('foo', 4);
  expect(m.size).toBe(3);
  expect(m.empty).toBe(0);
  expect(m.get('foo')).toBe(4);

  m.delete('bar');
  m.delete('baz');
  expect(m.size).toBe(1);
  expect(m.empty).toBe(2);

  m.clean();
  expect(m.size).toBe(1);
  expect(m.empty).toBe(0);

  m.clear();
  expect(m.size).toBe(0);
  expect(m.empty).toBe(0);
  expect(m.has('foo')).toBe(false);
  expect(m.get('foo')).toBe(undefined);
});

test('fastmap accepts object as argument', function() {
  var m = vega.fastmap({a:1, b:2});
  expect(m.size).toBe(2);
  expect(m.empty).toBe(0);
  expect(m.has('a')).toBe(true);
  expect(m.has('b')).toBe(true);
  expect(m.get('a')).toBe(1);
  expect(m.get('b')).toBe(2);
});

test('fastmap supports external clean test', function() {
  var m = vega.fastmap({a:1, b:2, c:1});

  m.test(function(value) { return value === 1; });
  m.clean();

  expect(m.size).toBe(1);
  expect(m.empty).toBe(0);
  expect(m.has('a')).toBe(false);
  expect(m.has('b')).toBe(true);
  expect(m.has('c')).toBe(false);
  expect(m.get('b')).toBe(2);
});
