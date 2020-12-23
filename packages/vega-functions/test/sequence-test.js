var tape = require('tape'),
    {
      indexof,
      join,
      lastindexof,
      replace,
      reverse,
      slice
    } = require('../');

tape('indexof finds first index', t => {
  t.deepEqual(indexof([1, 2, 2, 3], 2), [1, 2, 2, 3].indexOf(2));
  t.equal(indexof('hello world', 'l'), 2);
  t.throws(() => indexof({indexof: v => v + 1}, 1));
  t.end();
});

tape('lastindexof finds last index', t => {
  t.deepEqual(lastindexof([1, 2, 2, 3], 2), [1, 2, 2, 3].lastIndexOf(2));
  t.equal(lastindexof('hello world', 'l'), 9);
  t.throws(() => lastindexof({lastindexof: v => v + 1}, 1));
  t.end();
});

tape('replace replaces substrings', t => {
  t.equal(replace('hello world', /hello/, 'goodbye'), 'goodbye world');
  t.throws(() => replace('evil', /.*/,  d => d));
  t.end();
});

tape('reverse reverses an array', t => {
  t.deepEqual(reverse([1, 2, 3]), [1, 2, 3].reverse());
  t.throws(() => reverse({reverse: v => v + 1}));
  t.end();
});

tape('slice selects a subsequence', t => {
  t.deepEqual(slice([1, 2, 3], 1), [1, 2, 3].slice(1));
  t.deepEqual(slice([1, 2, 3], -1), [1, 2, 3].slice(-1));
  t.deepEqual(slice([1, 2, 3], 1, -1), [1, 2, 3].slice(1, -1));
  t.equal(slice('123', 1), '123'.slice(1));
  t.equal(slice('123', -1), '123'.slice(-1));
  t.equal(slice('123', 0, 1), '123'.slice(0, 1));
  t.throws(() => slice({slice: v => v + 1}, 1));
  t.end();
});

tape('join combines elements into a string', t => {
  t.deepEqual(join([1, 2, 3]), [1, 2, 3].join());
  t.deepEqual(join([1, 2, 3], ', '), [1, 2, 3].join(', '));
  t.throws(() => join({join: v => v + 1}, 1));
  t.end();
});
