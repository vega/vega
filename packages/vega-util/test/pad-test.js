var tape = require('tape'),
    vega = require('../');

tape('pad pads strings', function(test) {
  // should increase string length
  test.equal(vega.pad('12345', 8), '12345   ');
  test.equal(vega.pad('12345', 8, '!'), '12345!!!');

  // should return longer inputs as-is
  test.equal(vega.pad('12345', 3), '12345');

  // should respect align argument
  test.equal(vega.pad('12345', 8, ' ', 'right'),  '12345   ');
  test.equal(vega.pad('12345', 8, ' ', 'left'),   '   12345');
  test.equal(vega.pad('12345', 8, ' ', 'center'), ' 12345  ');

  test.end();
});
