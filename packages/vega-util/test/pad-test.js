var tape = require('tape'),
    vega = require('../');

tape('pad pads strings', t => {
  // should increase string length
  t.equal(vega.pad('12345', 8), '12345   ');
  t.equal(vega.pad('12345', 8, '!'), '12345!!!');

  // should return longer inputs as-is
  t.equal(vega.pad('12345', 3), '12345');

  // should respect align argument
  t.equal(vega.pad('12345', 8, ' ', 'right'),  '12345   ');
  t.equal(vega.pad('12345', 8, ' ', 'left'),   '   12345');
  t.equal(vega.pad('12345', 8, ' ', 'center'), ' 12345  ');

  t.end();
});

tape('pad pads numbers', t => {
  // should increase string length
  t.equal(vega.pad(12345, 8), '12345   ');
  t.equal(vega.pad(12345, 8, '!'), '12345!!!');

  // should return longer inputs as-is
  t.equal(vega.pad(12345, 3), '12345');

  // should respect align argument
  t.equal(vega.pad(12345, 8, ' ', 'right'),  '12345   ');
  t.equal(vega.pad(12345, 8, ' ', 'left'),   '   12345');
  t.equal(vega.pad(12345, 8, ' ', 'center'), ' 12345  ');

  t.end();
});
