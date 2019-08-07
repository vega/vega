var tape = require('tape'),
    {monthAbbrevFormat} = require('../');

tape('monthAbbrevFormat handles bad data', function(t) {
  t.equal(monthAbbrevFormat(0), "Jan")
  t.equal(monthAbbrevFormat("Missing"), "")
  t.equal(monthAbbrevFormat(1), "Feb")

  t.end()
})
