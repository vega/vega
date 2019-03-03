var vega = require('../');

test('array wraps values in an array', function() {
  // should return an empty array for null argument
  expect(vega.array(null)).toEqual([]);

  // should return an empty array for undefined argument
  expect(vega.array()).toEqual([]);

  // should return an unmodified array argument
  var value = [1, 2, 3];
  expect(vega.array(value)).toBe(value);

  // should return an array for non-array argument
  expect(vega.array(1)).toEqual([1]);
});
