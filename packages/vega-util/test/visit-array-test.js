var tape = require('tape'),
    vega = require('../');

tape('visitArray should visit arrays', function(t) {
  // check visited item count
  function run(array, filter) {
    var count = 0;
    vega.visitArray(array, filter, function() { ++count; });
    return count;
  }
  t.equal(run(null), 0);
  t.equal(run(undefined), 0);
  t.equal(run([]), 0);
  t.equal(run([1,2,3]), 3);
  t.equal(run([1,2,3], function(x) { return x > 1; }), 2);

  // check value transformation
  vega.visitArray([1,2,3],
    function(x) { return x*x; },
    function(value, i, array) {
      t.equal(value, array[i] * array[i]);
    });

  t.end();
});
