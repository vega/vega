var tape = require('tape'),
    {monthAbbrevFormat} = require('../');

tape('monthAbbrevFormat returns empty string for non-integer values', function(t) {
  t.equal(monthAbbrevFormat(0), 'Jan');
  t.equal(monthAbbrevFormat(NaN), '');
  t.equal(monthAbbrevFormat(1.1), '');
  t.equal(monthAbbrevFormat('Missing'), '');
  t.equal(monthAbbrevFormat(1), 'Feb');
  t.end()
});
