var tape = require('tape'),
    dotbin = require('../').dotbin;

tape('dotbin calculates dot plot bin positions', t => {
  const data = [1, 1, 2, 3, 4, 5, 6];
  t.deepEqual(
    Array.from(dotbin(data, 0.5)),
    data
  );
  t.deepEqual(
    Array.from(dotbin(data, 1.5)),
    [1.5, 1.5, 1.5, 3.5, 3.5, 5.5, 5.5]
  );
  t.deepEqual(
    Array.from(dotbin(data, 10)),
    [3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5]
  );

  t.deepEqual(
    Array.from(dotbin(data, 2.0, false)), // no smoothing
    [1.5, 1.5, 1.5, 3.5, 3.5, 5.5, 5.5]
  );
  t.deepEqual(
    Array.from(dotbin(data, 2.0, true)), // smoothing
    [1.5, 1.5, 3.5, 3.5, 3.5, 5.5, 5.5]
  );

  t.end();
});
