var vega = require('../');

test('visitArray should visit arrays', function() {
  // check visited item count
  function run(array, filter) {
    var count = 0;
    vega.visitArray(array, filter, function() { ++count; });
    return count;
  }
  expect(run(null)).toBe(0);
  expect(run(undefined)).toBe(0);
  expect(run([])).toBe(0);
  expect(run([1,2,3])).toBe(3);
  expect(run([1,2,3], function(x) { return x > 1; })).toBe(2);

  // check value transformation
  vega.visitArray([1,2,3],
    function(x) { return x*x; },
    function(value, i, array) {
      expect(value).toBe(array[i] * array[i]);
    });
});
