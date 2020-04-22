var tape = require('tape'),
    validTicks = require('../').validTicks,
    timeInterval = require('vega-time').timeInterval;

tape('validTicks uses count correctly', function(t) {
  var data = [0, 1, 2, 3, 4, 5, 6, 7];

  var identity = function(x) { return x; };
  identity.range = function() { return [0, 10]; };

  var t1 = validTicks(identity, data, 5);
  t.deepEqual(t1, [0, 2, 4, 6]);

  // don't change ticks if count is large
  var t2 = validTicks(identity, data, 100);
  t.deepEqual(t2, data);

  // special case for low number of ticks
  var t3 = validTicks(identity, data, 3);
  t.deepEqual(t3, [0, 7]);

  // validTicks ignores interval function
  var t4 = validTicks(identity, data, timeInterval('hour'));
  t.deepEqual(t4, data);

  // single tick should pass through
  var t5 = validTicks(identity, [1], 5);
  t.deepEqual(t5, [1]);

  t.end();
});
