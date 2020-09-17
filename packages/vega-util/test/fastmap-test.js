var tape = require('tape'),
    vega = require('../');

tape('fastmap maps keys to values', t => {
  const m = vega.fastmap();

  m.set('foo', 1);
  m.set('bar', 2);
  m.set('baz', 3);

  t.equal(m.has('foo'), true);
  t.equal(m.has('bar'), true);
  t.equal(m.has('baz'), true);
  t.equal(m.has('bak'), false);

  t.equal(m.get('foo'), 1);
  t.equal(m.get('bar'), 2);
  t.equal(m.get('baz'), 3);
  t.equal(m.get('bak'), undefined);

  t.equal(m.size, 3);

  m.delete('foo');
  t.equal(m.size, 2);
  t.equal(m.empty, 1);
  t.equal(m.get('foo'), undefined);

  m.set('foo', 4);
  t.equal(m.size, 3);
  t.equal(m.empty, 0);
  t.equal(m.get('foo'), 4);

  m.delete('bar');
  m.delete('baz');
  t.equal(m.size, 1);
  t.equal(m.empty, 2);

  m.clean();
  t.equal(m.size, 1);
  t.equal(m.empty, 0);

  m.clear();
  t.equal(m.size, 0);
  t.equal(m.empty, 0);
  t.equal(m.has('foo'), false);
  t.equal(m.get('foo'), undefined);

  t.end();
});

tape('fastmap accepts object as argument', t => {
  const m = vega.fastmap({a:1, b:2});
  t.equal(m.size, 2);
  t.equal(m.empty, 0);
  t.equal(m.has('a'), true);
  t.equal(m.has('b'), true);
  t.equal(m.get('a'), 1);
  t.equal(m.get('b'), 2);
  t.end();
});

tape('fastmap supports external clean test', t => {
  const m = vega.fastmap({a:1, b:2, c:1});

  m.test(value => value === 1);
  m.clean();

  t.equal(m.size, 1);
  t.equal(m.empty, 0);
  t.equal(m.has('a'), false);
  t.equal(m.has('b'), true);
  t.equal(m.has('c'), false);
  t.equal(m.get('b'), 2);
  t.end();
});
