var tape = require('tape'),
    vega = require('../');

tape('truncate truncates strings', t => {
  // should reduce string length
  t.equal(vega.truncate('123456789', 5), '1234…');
  t.equal(vega.truncate('123456789', 5, null, ''), '12345');

  // should respect position argument
  t.equal(vega.truncate('123456789', 5, 'right'), '1234…');
  t.equal(vega.truncate('123456789', 5, 'left'), '…6789');
  t.equal(vega.truncate('123456789', 5, 'center'), '12…89');

  t.end();
});

tape('truncate truncates numbers', t => {
  // should reduce length
  t.equal(vega.truncate(123456789, 5), '1234…');
  t.equal(vega.truncate(123456789, 5, null, ''), '12345');

  // should respect position argument
  t.equal(vega.truncate(123456789, 5, 'right'), '1234…');
  t.equal(vega.truncate(123456789, 5, 'left'), '…6789');
  t.equal(vega.truncate(123456789, 5, 'center'), '12…89');

  t.end();
});
