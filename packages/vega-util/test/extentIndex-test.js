var tape = require('tape'),
    vega = require('../');

tape('extentIndex calculates array extent indices', t => {
  t.deepEqual(vega.extentIndex([0, 0, 0]), [0, 0]);
  t.deepEqual(vega.extentIndex([4, -1, 2]), [1, 0]);
  t.deepEqual(vega.extentIndex([4, -1, null, undefined, NaN, 2]), [1, 0]);
  t.deepEqual(vega.extentIndex([]), [-1, -1]);
  t.deepEqual(vega.extentIndex([null, undefined, NaN]), [-1, -1]);
  t.end();
});
