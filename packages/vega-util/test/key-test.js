var tape = require('tape'),
    vega = require('../');

tape('key creates a key accessor', t => {
  var _ = {a:1, b:2, c:3, d:{0:5, e:4}}, k;

  k = vega.key();
  t.equal(typeof k, 'function');
  t.equal(vega.accessorName(k), 'key');
  t.deepEqual(vega.accessorFields(k), []);
  t.equal(k(_), '');

  k = vega.key('a');
  t.equal(typeof k, 'function');
  t.equal(vega.accessorName(k), 'key');
  t.deepEqual(vega.accessorFields(k), ['a']);
  t.equal(k(_), '1');

  k = vega.key(['a']);
  t.equal(typeof k, 'function');
  t.equal(vega.accessorName(k), 'key');
  t.deepEqual(vega.accessorFields(k), ['a']);
  t.equal(k(_), '1');

  k = vega.key(['a', 'b', 'c']);
  t.equal(typeof k, 'function');
  t.equal(vega.accessorName(k), 'key');
  t.deepEqual(vega.accessorFields(k), ['a', 'b', 'c']);
  t.equal(k(_), '1|2|3');

  k = vega.key(['a', 'c', 'd.e']);
  t.equal(typeof k, 'function');
  t.equal(vega.accessorName(k), 'key');
  t.deepEqual(vega.accessorFields(k), ['a', 'c', 'd.e']);
  t.equal(k(_), '1|3|4');

  k = vega.key(['a', 'c', 'd["e"]', 'd[0]']);
  t.equal(typeof k, 'function');
  t.equal(vega.accessorName(k), 'key');
  t.deepEqual(vega.accessorFields(k), ['a', 'c', 'd["e"]', 'd[0]']);
  t.equal(k(_), '1|3|4|5');

  t.end();
});

tape('key respects the "flat" argument', t => {
  var _ = {'d.e': 1, 'd[e]': 2, d:{0:5, e:4}}, k;

  k = vega.key('d.e', false);
  t.equal(typeof k, 'function');
  t.equal(vega.accessorName(k), 'key');
  t.deepEqual(vega.accessorFields(k), ['d.e']);
  t.equal(k(_), '4');

  k = vega.key('d.e', true);
  t.equal(typeof k, 'function');
  t.equal(vega.accessorName(k), 'key');
  t.deepEqual(vega.accessorFields(k), ['d.e']);
  t.equal(k(_), '1');

  k = vega.key('d\\.e', true);
  t.equal(typeof k, 'function');
  t.equal(vega.accessorName(k), 'key');
  t.deepEqual(vega.accessorFields(k), ['d.e']);
  t.equal(k(_), '1');

  k = vega.key('d\\[e\\]', true);
  t.equal(typeof k, 'function');
  t.equal(vega.accessorName(k), 'key');
  t.deepEqual(vega.accessorFields(k), ['d[e]']);
  t.equal(k(_), '2');

  t.end();
});
