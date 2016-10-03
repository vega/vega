var tape = require('tape'),
    vega = require('../');

tape('visitArray should visit arrays', function(test) {
  // check visited item count
  function run(array, filter) {
    var count = 0;
    vega.visitArray(array, filter, function() { ++count; });
    return count;
  }
  test.equal(run(null), 0);
  test.equal(run(undefined), 0);
  test.equal(run([]), 0);
  test.equal(run([1,2,3]), 3);
  test.equal(run([1,2,3], function(x) { return x > 1; }), 2);

  // check value transformation
  vega.visitArray([1,2,3],
    function(x) { return x*x; },
    function(value, i, array) {
      test.equal(value, array[i] * array[i]);
    });

  test.end();
});
