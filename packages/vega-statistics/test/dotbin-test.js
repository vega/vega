var tape = require('tape'),
    dotbin = require('../').dotbin;

tape('dotbin calculates dot plot bin positions', function(t) {
  var data = [1, 1, 2, 3, 4, 5, 6];
  t.deepEqual(dotbin(data, 0.5), data);
  t.deepEqual(dotbin(data, 1.5), [1.5, 1.5, 1.5, 3.5, 3.5, 5.5, 5.5]);
  t.deepEqual(dotbin(data, 10), [3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5]);

  t.deepEqual(dotbin(data, 2.0, false), [1.5, 1.5, 1.5, 3.5, 3.5, 5.5, 5.5]); // no smoothing
  t.deepEqual(dotbin(data, 2.0, true), [1.5, 1.5, 3.5, 3.5, 3.5, 5.5, 5.5]); // smoothing

  t.end();
});
