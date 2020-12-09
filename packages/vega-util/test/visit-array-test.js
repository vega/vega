var tape = require('tape'),
    vega = require('../');

tape('visitArray should visit arrays', t => {
  // check visited item count
  function run(array, filter) {
    let count = 0;
    vega.visitArray(array, filter, () => { ++count; });
    return count;
  }
  t.equal(run(null), 0);
  t.equal(run(undefined), 0);
  t.equal(run([]), 0);
  t.equal(run([1,2,3]), 3);
  t.equal(run([1,2,3], x => x > 1), 2);

  // check value transformation
  vega.visitArray([1,2,3],
    x => x * x,
    (value, i, array) => {
      t.equal(value, array[i] * array[i]);
    });

  t.end();
});
