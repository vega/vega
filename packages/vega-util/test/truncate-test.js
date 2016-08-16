var tape = require('tape'),
    vega = require('../');

tape('truncate truncates strings', function(test) {
  // should reduce string length
  test.equal(vega.truncate('123456789', 5), '1234…');
  test.equal(vega.truncate('123456789', 5, null, ''), '12345');

  // should respect position argument
  test.equal(vega.truncate('123456789', 5, 'right'), '1234…');
  test.equal(vega.truncate('123456789', 5, 'left'), '…6789');
  test.equal(vega.truncate('123456789', 5, 'center'), '12…89');

  test.end();
});
