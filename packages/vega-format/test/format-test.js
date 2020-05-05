var tape = require('tape'),
    vega = require('../'),
    locale = vega.numberFormatDefaultLocale();

tape('format supports specifier strings', function(t) {
  t.equal(locale.format('.0s')(1e6), '1M');
  t.equal(locale.formatPrefix('.1s', 1e6)(1e5), '0.1M');
  t.end();
});
