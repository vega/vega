var tape = require('tape'),
    vega = require('../'),
    locale = vega.timeFormatDefaultLocale(),
    {deDE, local, utc} = require('./util');

tape('timeParse supports specifier strings', t => {
  const d = local(2001, 2, 1);
  t.equal(+locale.timeParse('%Y-%m-%d')('2001-03-01'), +d);
  t.equal(+locale.timeParse('%d %b %Y')('01 Mar 2001'), +d);
  t.equal(+locale.timeParse('%d %B %Y')('1 March 2001'), +d);
  t.end();
});

tape('timeFormat supports specifier strings', t => {
  const d = local(2001, 0, 1);
  t.equal(locale.timeFormat('%Y')(d), '2001');
  t.equal(locale.timeFormat('%m')(d), '01');
  t.equal(locale.timeFormat('%d')(d), '01');
  t.throws(() => locale.timeFormat(2));
  t.throws(() => locale.timeFormat(true));
  t.end();
});

tape('timeFormat supports specifier objects', t => {
  let f = locale.timeFormat();
  t.equal(f(local(2001, 0, 1)), '2001');
  t.equal(f(local(2001, 1, 1)), 'February');
  t.equal(f(local(2001, 1, 2)), 'Fri 02');
  t.equal(f(local(2001, 1, 4)), 'Feb 04');
  t.equal(f(local(2001, 3, 1)), 'April');
  t.equal(f(local(2001, 0, 1, 0, 0, 30)), ':30');

  f = locale.timeFormat({
    year: '%y',
    quarter: 'Q%q',
    month: '%m',
    week: 'W%U',
    seconds: '%Ss'
  });
  t.equal(f(local(2001, 0, 1)), '01');
  t.equal(f(local(2001, 1, 1)), '02');
  t.equal(f(local(2001, 1, 2)), 'Fri 02');
  t.equal(f(local(2001, 1, 4)), 'W05');
  t.equal(f(local(2001, 3, 1)), 'Q2');
  t.equal(f(local(2001, 0, 1, 0, 0, 30)), '30s');

  t.end();
});

tape('utcParse supports specifier strings', t => {
  const d = utc(2001, 2, 1);
  t.equal(+locale.utcParse('%Y-%m-%d')('2001-03-01'), +d);
  t.equal(+locale.utcParse('%d %b %Y')('01 Mar 2001'), +d);
  t.equal(+locale.utcParse('%d %B %Y')('1 March 2001'), +d);
  t.end();
});

tape('utcFormat supports specifier strings', t => {
  const d = utc(2001, 0, 1);
  t.equal(locale.utcFormat('%Y')(d), '2001');
  t.equal(locale.utcFormat('%m')(d), '01');
  t.equal(locale.utcFormat('%d')(d), '01');
  t.throws(() => locale.utcFormat(2));
  t.throws(() => locale.utcFormat(true));
  t.end();
});

tape('utcFormat supports specifier objects', t => {
  let f = locale.utcFormat();
  t.equal(f(utc(2001, 0, 1)), '2001');
  t.equal(f(utc(2001, 1, 1)), 'February');
  t.equal(f(utc(2001, 1, 2)), 'Fri 02');
  t.equal(f(utc(2001, 1, 4)), 'Feb 04');
  t.equal(f(utc(2001, 3, 1)), 'April');
  t.equal(f(utc(2001, 0, 1, 0, 0, 30)), ':30');

  f = locale.utcFormat({
    year: '%y',
    quarter: 'Q%q',
    month: '%m',
    week: 'W%U',
    seconds: '%Ss'
  });
  t.equal(f(utc(2001, 0, 1)), '01');
  t.equal(f(utc(2001, 1, 1)), '02');
  t.equal(f(utc(2001, 1, 2)), 'Fri 02');
  t.equal(f(utc(2001, 1, 4)), 'W05');
  t.equal(f(utc(2001, 3, 1)), 'Q2');
  t.equal(f(utc(2001, 0, 1, 0, 0, 30)), '30s');

  t.end();
});

tape('timeFormatLocale creates a new locale', t => {
  const locale = vega.timeFormatLocale(deDE.time);
  let d, f;

  d = local(2001, 2, 1);
  t.equal(+locale.timeParse('%Y-%m-%d')('2001-03-01'), +d);
  t.equal(+locale.timeParse('%d %b %Y')('01 Mrz 2001'), +d);
  t.equal(+locale.timeParse('%d %B %Y')('1 März 2001'), +d);

  d = utc(2001, 2, 1);
  t.equal(+locale.utcParse('%Y-%m-%d')('2001-03-01'), +d);
  t.equal(+locale.utcParse('%d %b %Y')('01 Mrz 2001'), +d);
  t.equal(+locale.utcParse('%d %B %Y')('1 März 2001'), +d);

  d = local(2001, 0, 1);
  t.equal(locale.timeFormat('%Y')(d), '2001');
  t.equal(locale.timeFormat('%m')(d), '01');
  t.equal(locale.timeFormat('%d')(d), '01');
  t.throws(() => locale.timeFormat(2));
  t.throws(() => locale.timeFormat(true));

  d = utc(2001, 0, 1);
  t.equal(locale.utcFormat('%Y')(d), '2001');
  t.equal(locale.utcFormat('%m')(d), '01');
  t.equal(locale.utcFormat('%d')(d), '01');
  t.throws(() => locale.utcFormat(2));
  t.throws(() => locale.utcFormat(true));

  f = locale.timeFormat();
  t.equal(f(local(2001, 0, 1)), '2001');
  t.equal(f(local(2001, 1, 1)), 'Februar');
  t.equal(f(local(2001, 1, 2)), 'Fr 02');
  t.equal(f(local(2001, 1, 4)), 'Feb 04');
  t.equal(f(local(2001, 3, 1)), 'April');
  t.equal(f(local(2001, 0, 1, 0, 0, 30)), ':30');

  f = locale.timeFormat({
    year: '%y',
    quarter: 'Q%q',
    month: '%m',
    week: 'W%U',
    seconds: '%Ss'
  });
  t.equal(f(local(2001, 0, 1)), '01');
  t.equal(f(local(2001, 1, 1)), '02');
  t.equal(f(local(2001, 1, 2)), 'Fr 02');
  t.equal(f(local(2001, 1, 4)), 'W05');
  t.equal(f(local(2001, 3, 1)), 'Q2');
  t.equal(f(local(2001, 0, 1, 0, 0, 30)), '30s');

  f = locale.utcFormat();
  t.equal(f(utc(2001, 0, 1)), '2001');
  t.equal(f(utc(2001, 1, 1)), 'Februar');
  t.equal(f(utc(2001, 1, 2)), 'Fr 02');
  t.equal(f(utc(2001, 1, 4)), 'Feb 04');
  t.equal(f(utc(2001, 3, 1)), 'April');
  t.equal(f(utc(2001, 0, 1, 0, 0, 30)), ':30');

  f = locale.utcFormat({
    year: '%y',
    quarter: 'Q%q',
    month: '%m',
    week: 'W%U',
    seconds: '%Ss'
  });
  t.equal(f(utc(2001, 0, 1)), '01');
  t.equal(f(utc(2001, 1, 1)), '02');
  t.equal(f(utc(2001, 1, 2)), 'Fr 02');
  t.equal(f(utc(2001, 1, 4)), 'W05');
  t.equal(f(utc(2001, 3, 1)), 'Q2');
  t.equal(f(utc(2001, 0, 1, 0, 0, 30)), '30s');

  t.end();
});
