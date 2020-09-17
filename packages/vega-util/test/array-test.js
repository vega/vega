var tape = require('tape'),
    vega = require('../');

tape('array wraps values in an array', t => {
  // should return an empty array for null argument
  t.deepEqual(vega.array(null), []);

  // should return an empty array for undefined argument
  t.deepEqual(vega.array(), []);

  // should return an unmodified array argument
  const value = [1, 2, 3];
  t.equal(vega.array(value), value);

  // should return an array for non-array argument
  t.deepEqual(vega.array(1), [1]);

  t.end();
});
