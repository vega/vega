var tape = require('tape'),
    vega = require('../');

tape('repeat repeats strings', function(test) {
  test.equal(vega.repeat('1', 0), '');
  test.equal(vega.repeat('1', 1), '1');
  test.equal(vega.repeat('1', 3), '111');
  test.equal(vega.repeat('1', 1), '1');
  test.equal(vega.repeat('1', -1), '');
  test.equal(vega.repeat('1'), '');

  test.end();
});
