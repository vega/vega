var tape = require('tape'),
    quartiles = require('../').quartiles;

tape('quartiles calculates quartile values', function(t) {
  // unsorted
  var a = [9, 7, 8, 1, 2, 3, 4, 5, 6];

  // with number array
  t.deepEqual([3, 5, 7], quartiles(a));

  // with object array
  t.deepEqual([3, 5, 7], quartiles(a.map(_ => ({v:_})), _ => _.v));

  t.end();
});

tape('quartiles ignores invalid values', function(t) {
  // unsorted
  var a = [9, 7, null, 8, 1, NaN, 2, 3, undefined, 4, 5, '', 6];

  // with number array
  t.deepEqual([3, 5, 7], quartiles(a));

  // with object array
  t.deepEqual([3, 5, 7], quartiles(a.map(_ => ({v:_})), _ => _.v));

  t.end();
});
