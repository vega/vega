var tape = require('tape'),
    {
      indexof,
      join,
      lastindexof,
      replace,
      reverse,
      slice,
      sort
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

tape('sort handles strings, numbers, dates, and missing data in ascending order', t => {
  t.deepEqual(sort([3, 1, 2]), [1, 2, 3]);
  t.deepEqual(sort(['c', 'a', 'b']), ['a', 'b', 'c']);
  t.deepEqual(sort([2, null, 1]), [null, 1, 2]);
  t.deepEqual(sort([2, undefined, 1]), [1, 2, undefined]);
  t.deepEqual(sort([1, NaN, 2]), [NaN, 1, 2]);
  t.deepEqual(sort([new Date('2019-01-01'), new Date('2018-01-01')]), [new Date('2018-01-01'), new Date('2019-01-01')]);
  t.end();
});
