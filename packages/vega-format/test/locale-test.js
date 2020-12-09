var tape = require('tape'),
    d3f = require('d3-format'),
    d3t = require('d3-time-format'),
    vega = require('../'),
    {deDE} = require('./util');

function isFunction(t, value) {
  t.equal(typeof value, 'function');
}

function isLocale(t, locale) {
  isFunction(t, locale.format);
  isFunction(t, locale.formatPrefix);
  isFunction(t, locale.formatFloat);
  isFunction(t, locale.formatSpan);
  isFunction(t, locale.timeFormat);
  isFunction(t, locale.utcFormat);
  isFunction(t, locale.timeParse);
  isFunction(t, locale.utcParse);
}

function isEquivalent(t, actual, expect) {
  t.equal(actual.format, expect.format);
  t.equal(actual.formatPrefix, expect.formatPrefix);
  t.equal(actual.formatFloat, expect.formatFloat);
  t.equal(actual.formatSpan, expect.formatSpan);
  t.equal(actual.timeFormat, expect.timeFormat);
  t.equal(actual.utcFormat, expect.utcFormat);
  t.equal(actual.timeParse, expect.timeParse);
  t.equal(actual.utcParse, expect.utcParse);
}

tape('defaultLocale checks arguments', t => {
  t.throws(() => vega.defaultLocale(1));
  t.throws(() => vega.defaultLocale(1, 2, 3));
  t.end();
});


tape('defaultLocale gets the default locale', t => {
  isLocale(t, vega.defaultLocale());
  t.end();
});

tape('defaultLocale sets the default locale', t => {
  const d = new Date(2000, 2, 1);
  const init = vega.defaultLocale();

  // change vega's default locale
  const locale = vega.defaultLocale(deDE.number, deDE.time);
  isLocale(t, locale);

  // getter should return equivalent methods
  const loc2 = vega.defaultLocale();
  isEquivalent(t, loc2, locale);

  // new default uses proper formatting
  t.equal(locale.format(',.2f')(1234.1), '1.234,10');
  t.equal(locale.timeFormat('%d %B %Y')(d), '01 März 2000');

  // methods from original default should be unchanged
  t.equal(init.format(',.2f')(1234.1), '1,234.10');
  t.equal(init.timeFormat('%d %B %Y')(d), '01 March 2000');

  // d3 methods should be unchanged
  t.equal(d3f.format(',.2f')(1234.1), '1,234.10');
  t.equal(d3t.timeFormat('%d %B %Y')(d), '01 March 2000');

  // reset to current d3 default locales
  const reset = vega.resetDefaultLocale();
  t.equal(reset.format(',.2f')(1234.1), '1,234.10');
  t.equal(reset.timeFormat('%d %B %Y')(d), '01 March 2000');

  t.end();
});

tape('locale creates a new locale', t => {
  const locale = vega.locale(deDE.number, deDE.time);
  isLocale(t, locale);
  t.equal(locale.format(',.2f')(1234.1), '1.234,10');
  t.equal(locale.timeFormat('%d %B %Y')(new Date(2000, 2, 1)), '01 März 2000');

  t.end();
});

tape('locale uses default locale for missing arguments', t => {
  const localeNum = vega.locale(deDE.number);
  isLocale(t, localeNum);
  t.equal(localeNum.format(',.2f')(1234.1), '1.234,10');
  t.equal(localeNum.timeFormat('%d %B %Y')(new Date(2000, 2, 1)), '01 March 2000');

  const localeTime = vega.locale(null, deDE.time);
  isLocale(t, localeTime);
  t.equal(localeTime.format(',.2f')(1234.1), '1,234.10');
  t.equal(localeTime.timeFormat('%d %B %Y')(new Date(2000, 2, 1)), '01 März 2000');

  const localeDef = vega.locale();
  isLocale(t, localeDef);
  t.equal(localeDef.format(',.2f')(1234.1), '1,234.10');
  t.equal(localeDef.timeFormat('%d %B %Y')(new Date(2000, 2, 1)), '01 March 2000');

  t.end();
});
