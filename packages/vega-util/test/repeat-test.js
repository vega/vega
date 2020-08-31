var tape = require('tape'),
    vega = require('../');

tape('repeat repeats strings', t => {
  t.equal(vega.repeat('1', 0), '');
  t.equal(vega.repeat('1', 1), '1');
  t.equal(vega.repeat('1', 3), '111');
  t.equal(vega.repeat('1', 1), '1');
  t.equal(vega.repeat('1', -1), '');
  t.equal(vega.repeat('1'), '');

  t.end();
});
