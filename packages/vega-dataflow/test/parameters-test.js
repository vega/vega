var tape = require('tape'),
    vega = require('../');

tape('Parameters handles parameter values', t => {
  const p = new vega.Parameters;

  // test initial state
  t.equal(p.modified('foo'), false);
  t.equal(p.modified('bar', 1), false);
  t.equal(p.modified(['foo', 'bar']), false);

  // test scalar parameter
  t.equal(p.set('foo', -1, 3), p);
  t.equal(p.modified('foo'), true);
  t.equal(p.modified('foo', -1), true);
  t.equal(p.modified('foo', null), true);
  t.equal(p.modified('foo', undefined), true);
  t.equal(p.modified('foo', 0), false);
  t.equal(p.modified('foo', 1), false);
  t.equal(p.foo, 3);

  // test array parameter
  const bar = ['a', 'b', 'c'];
  t.equal(p.set('bar', -1, bar), p);
  t.equal(p.modified('bar'), true);
  t.equal(p.modified('bar', 0), true);
  t.equal(p.modified('bar', 1), true);
  t.equal(p.modified('bar', 2), true);
  t.equal(p.modified('bar', 3), false);

  // test clear
  t.equal(p.clear(), p);
  t.equal(p.modified('foo'), false);
  t.equal(p.modified('bar'), false);
  t.equal(p.modified('bar', 0), false);
  t.equal(p.modified('bar', 1), false);
  t.equal(p.modified('bar', 2), false);

  // test array index parameter
  t.equal(p.set('bar', 1, 'd'), p);
  t.equal(p.modified('foo'), false);
  t.equal(p.modified('bar'), true);
  t.equal(p.modified('bar', 0), false);
  t.equal(p.modified('bar', 1), true);
  t.equal(p.modified('bar', 2), false);

  t.end();
});
