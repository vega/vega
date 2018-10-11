var tape = require('tape'),
    bootstrapCI = require('../').bootstrapCI;

tape('bootstrapCI returns array of undefined for empty data', function(test) {
  var ci = bootstrapCI([], 1000, 0.05);
  test.deepEqual(ci, [undefined, undefined]);
  test.end();
});
