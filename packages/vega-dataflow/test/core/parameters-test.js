var tape = require('tape'),
    vega = require('../../');

tape('Parameters handles parameter values', function(test) {
  var p = new vega.Parameters;

  // test initial state
  test.equal(p.modified('foo'), false);
  test.equal(p.modified('bar', 1), false);
  test.equal(p.modified(['foo', 'bar']), false);

  // test scalar parameter
  test.equal(p.set('foo', -1, 3), p);
  test.equal(p.modified('foo'), true);
  test.equal(p.modified('foo', -1), true);
  test.equal(p.modified('foo', null), true);
  test.equal(p.modified('foo', undefined), true);
  test.equal(p.modified('foo', 0), false);
  test.equal(p.modified('foo', 1), false);
  test.equal(p.foo, 3);

  // test array parameter
  var bar = ['a', 'b', 'c'];
  test.equal(p.set('bar', -1, bar), p);
  test.equal(p.modified('bar'), true);
  test.equal(p.modified('bar', 0), true);
  test.equal(p.modified('bar', 1), true);
  test.equal(p.modified('bar', 2), true);
  test.equal(p.modified('bar', 3), false);

  // test clear
  test.equal(p.clear(), p);
  test.equal(p.modified('foo'), false);
  test.equal(p.modified('bar'), false);
  test.equal(p.modified('bar', 0), false);
  test.equal(p.modified('bar', 1), false);
  test.equal(p.modified('bar', 2), false);

  // test array index parameter
  test.equal(p.set('bar', 1, 'd'), p);
  test.equal(p.modified('foo'), false);
  test.equal(p.modified('bar'), true);
  test.equal(p.modified('bar', 0), false);
  test.equal(p.modified('bar', 1), true);
  test.equal(p.modified('bar', 2), false);

  test.end();
});
