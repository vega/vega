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
