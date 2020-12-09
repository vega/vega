var tape = require('tape'),
    validTicks = require('../').validTicks,
    timeInterval = require('vega-time').timeInterval;

tape('validTicks uses count correctly', t => {
  const data = [0, 1, 2, 3, 4, 5, 6, 7];

  const identity = function(x) { return x; };
  identity.range = function() { return [0, 10]; };

  const t1 = validTicks(identity, data, 5);
  t.deepEqual(t1, [0, 2, 4, 6]);

  // don't change ticks if count is large
  const t2 = validTicks(identity, data, 100);
  t.deepEqual(t2, data);

  // special case for low number of ticks
  const t3 = validTicks(identity, data, 3);
  t.deepEqual(t3, [0, 7]);

  // validTicks ignores interval function
  const t4 = validTicks(identity, data, timeInterval('hour'));
  t.deepEqual(t4, data);

  // single tick should pass through
  const t5 = validTicks(identity, [1], 5);
  t.deepEqual(t5, [1]);

  t.end();
});
