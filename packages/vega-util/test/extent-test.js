var tape = require('tape'),
    vega = require('../');

tape('extent calculates array extents', t => {
  t.deepEqual(vega.extent([0, 0, 0]), [0, 0]);
  t.deepEqual(vega.extent([4, -1, 2]), [-1, 4]);
  t.deepEqual(vega.extent([4, -1, null, undefined, NaN, 2]), [-1, 4]);
  t.deepEqual(vega.extent([]), [undefined, undefined]);
  t.deepEqual(vega.extent([null, undefined, NaN]), [undefined, undefined]);
  t.end();
});
