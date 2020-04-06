const tape = require('tape');
const bootstrapCI = require('../').bootstrapCI;

tape('bootstrapCI returns array of undefined for empty data', function (t) {
  const ci = bootstrapCI([], 1000, 0.05);
  t.deepEqual(ci, [undefined, undefined]);
  t.end();
});
