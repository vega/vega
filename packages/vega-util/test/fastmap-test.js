var tape = require('tape'),
    vega = require('../');

tape('fastmap maps keys to values', function(test) {
  var m = vega.fastmap();

  m.set('foo', 1);
  m.set('bar', 2);
  m.set('baz', 3);

  test.equal(m.has('foo'), true);
  test.equal(m.has('bar'), true);
  test.equal(m.has('baz'), true);
  test.equal(m.has('bak'), false);

  test.equal(m.get('foo'), 1);
  test.equal(m.get('bar'), 2);
  test.equal(m.get('baz'), 3);
  test.equal(m.get('bak'), undefined);

  test.equal(m.size, 3);

  m.delete('foo');
  test.equal(m.size, 2);
  test.equal(m.empty, 1);
  test.equal(m.get('foo'), undefined);

  m.set('foo', 4);
  test.equal(m.size, 3);
  test.equal(m.empty, 0);
  test.equal(m.get('foo'), 4);

  m.delete('bar');
  m.delete('baz');
  test.equal(m.size, 1);
  test.equal(m.empty, 2);

  m.clean();
  test.equal(m.size, 1);
  test.equal(m.empty, 0);

  m.clear();
  test.equal(m.size, 0);
  test.equal(m.empty, 0);
  test.equal(m.has('foo'), false);
  test.equal(m.get('foo'), undefined);

  test.end();
});

tape('fastmap accepts object as argument', function(test) {
  var m = vega.fastmap({a:1, b:2});
  test.equal(m.size, 2);
  test.equal(m.empty, 0);
  test.equal(m.has('a'), true);
  test.equal(m.has('b'), true);
  test.equal(m.get('a'), 1);
  test.equal(m.get('b'), 2);
  test.end();
});

tape('fastmap supports external clean test', function(test) {
  var m = vega.fastmap({a:1, b:2, c:1});

  m.test(function(value) { return value === 1; });
  m.clean();

  test.equal(m.size, 1);
  test.equal(m.empty, 0);
  test.equal(m.has('a'), false);
  test.equal(m.has('b'), true);
  test.equal(m.has('c'), false);
  test.equal(m.get('b'), 2);
  test.end();
});
