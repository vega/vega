var bootstrapCI = require('../').bootstrapCI;

test('bootstrapCI returns array of undefined for empty data', function() {
  var ci = bootstrapCI([], 1000, 0.05);
  expect(ci).toEqual([undefined, undefined]);
});
