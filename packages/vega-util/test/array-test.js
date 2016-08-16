var tape = require('tape'),
    vega = require('../');

tape('array wraps values in an array', function(test) {
  // should return an empty array for null argument
  test.deepEqual(vega.array(null), []);

  // should return an empty array for undefined argument
  test.deepEqual(vega.array(), []);

  // should return an unmodified array argument
  var value = [1, 2, 3];
  test.equal(vega.array(value), value);

  // should return an array for non-array argument
  test.deepEqual(vega.array(1), [1]);

  test.end();
});
