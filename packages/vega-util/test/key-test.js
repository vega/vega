var tape = require('tape'),
    vega = require('../');

tape('key creates a key accessor', function(test) {
  var _ = {a:1, b:2, c:3, d:{0:5, e:4}}, k;

  k = vega.key();
  test.equal(typeof k, 'function');
  test.equal(vega.accessorName(k), 'key');
  test.deepEqual(vega.accessorFields(k), []);
  test.equal(k(_), '');

  k = vega.key('a');
  test.equal(typeof k, 'function');
  test.equal(vega.accessorName(k), 'key');
  test.deepEqual(vega.accessorFields(k), ['a']);
  test.equal(k(_), '1');

  k = vega.key(['a']);
  test.equal(typeof k, 'function');
  test.equal(vega.accessorName(k), 'key');
  test.deepEqual(vega.accessorFields(k), ['a']);
  test.equal(k(_), '1');

  k = vega.key(['a', 'b', 'c']);
  test.equal(typeof k, 'function');
  test.equal(vega.accessorName(k), 'key');
  test.deepEqual(vega.accessorFields(k), ['a', 'b', 'c']);
  test.equal(k(_), '1|2|3');

  k = vega.key(['a', 'c', 'd.e']);
  test.equal(typeof k, 'function');
  test.equal(vega.accessorName(k), 'key');
  test.deepEqual(vega.accessorFields(k), ['a', 'c', 'd.e']);
  test.equal(k(_), '1|3|4');

  k = vega.key(['a', 'c', 'd["e"]', 'd[0]']);
  test.equal(typeof k, 'function');
  test.equal(vega.accessorName(k), 'key');
  test.deepEqual(vega.accessorFields(k), ['a', 'c', 'd["e"]', 'd[0]']);
  test.equal(k(_), '1|3|4|5');

  test.end();
});

tape('key respects the "flat" argument', function(test) {
  var _ = {"d.e": 1, "d[e]": 2, d:{0:5, e:4}}, k;

  k = vega.key('d.e', false);
  test.equal(typeof k, 'function');
  test.equal(vega.accessorName(k), 'key');
  test.deepEqual(vega.accessorFields(k), ['d.e']);
  test.equal(k(_), '4');

  k = vega.key('d.e', true);
  test.equal(typeof k, 'function');
  test.equal(vega.accessorName(k), 'key');
  test.deepEqual(vega.accessorFields(k), ['d.e']);
  test.equal(k(_), '1');

  k = vega.key('d\\.e', true);
  test.equal(typeof k, 'function');
  test.equal(vega.accessorName(k), 'key');
  test.deepEqual(vega.accessorFields(k), ['d.e']);
  test.equal(k(_), '1');

  k = vega.key('d\\[e\\]', true);
  test.equal(typeof k, 'function');
  test.equal(vega.accessorName(k), 'key');
  test.deepEqual(vega.accessorFields(k), ['d[e]']);
  test.equal(k(_), '2');

  test.end();
});
