var tape = require('tape'),
    format = require('vega-format'),
    {monthAbbrevFormat} = require('../');

tape('monthAbbrevFormat returns empty string for non-integer values', t => {
  const locale = format.defaultLocale(),
        self = { context: { dataflow: { locale: () => locale } } },
        abbrev = monthAbbrevFormat.bind(self);

  t.equal(abbrev(0), 'Jan');
  t.equal(abbrev(NaN), '');
  t.equal(abbrev(1.1), '');
  t.equal(abbrev('Missing'), '');
  t.equal(abbrev(1), 'Feb');
  t.end();
});
