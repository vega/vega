var tape = require('tape'),
    vega = require('../'),
    locale = vega.numberFormatDefaultLocale(),
    {deDE} = require('./util');

tape('format formats numbers', t => {
  t.equal(locale.format('.1f')(0.16), '0.2');
  t.equal(locale.format('.0s')(1e6), '1M');
  t.equal(locale.format(',')(1234), '1,234');
  t.equal(locale.format('$')(1.09), '$1.09');
  t.end();
});

tape('formatPrefix formats numbers', t => {
  t.equal(locale.formatPrefix('.1s', 1e6)(1e5), '0.1M');
  t.equal(locale.formatPrefix('.0s', 1e4)(1e5), '100k');
  t.end();
});

tape('formatFloat formats numbers', t => {
  t.equal(locale.formatFloat('')(0.123), '0.123');
  t.equal(locale.formatFloat('')(0.1234), '0.1234');
  t.equal(locale.formatFloat('.2f')(0.1234), '0.12');
  t.end();
});

tape('formatSpan formats number spans', t => {
  t.equal(locale.formatSpan(0, 10, 5)(5), '5');
  t.equal(locale.formatSpan(0, 10, 20)(5), '5.0');
  t.equal(locale.formatSpan(0, 10, 200)(5), '5.00');
  t.equal(locale.formatSpan(0, 10, 200, '.1f')(5), '5.0');
  t.end();
});

tape('numberFormatLocale creates a new locale', t => {
  const locale = vega.numberFormatLocale(deDE.number);
  t.equal(locale.format('.1f')(0.16), '0,2');
  t.equal(locale.format('.0s')(1e6), '1M');
  t.equal(locale.format(',')(1234), '1.234');
  t.equal(locale.format('$')(1.09), '1,09' + deDE.number.currency[1]);

  t.equal(locale.formatPrefix('.1s', 1e6)(1e5), '0,1M');
  t.equal(locale.formatPrefix('.0s', 1e4)(1e5), '100k');

  t.equal(locale.formatFloat('')(0.123), '0,123');
  t.equal(locale.formatFloat('')(0.1234), '0,1234');
  t.equal(locale.formatFloat('.2f')(0.1234), '0,12');

  t.equal(locale.formatSpan(0, 10, 5)(5), '5');
  t.equal(locale.formatSpan(0, 10, 20)(5), '5,0');
  t.equal(locale.formatSpan(0, 10, 200)(5), '5,00');
  t.equal(locale.formatSpan(0, 10, 200, '.1f')(5), '5,0');
  t.end();
});
