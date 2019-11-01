var tape = require('tape'),
    vega = require('../'),
    {local, utc} = require('./util');

tape('timeUnitSpecifier produces specifier for single time units', function(t) {
  t.equal(vega.timeUnitSpecifier('year'), '%Y');
  t.equal(vega.timeUnitSpecifier('quarter'), 'Q%q');
  t.equal(vega.timeUnitSpecifier('month'), '%b');
  t.equal(vega.timeUnitSpecifier('week'), 'W%U');
  t.equal(vega.timeUnitSpecifier('day'), '%a');
  t.equal(vega.timeUnitSpecifier('date'), '%d');
  t.equal(vega.timeUnitSpecifier('hours'), '%H:00');
  t.equal(vega.timeUnitSpecifier('minutes'), '00:%M');
  t.equal(vega.timeUnitSpecifier('seconds'), ':%S');
  t.equal(vega.timeUnitSpecifier('milliseconds'), '.%L');
  t.end();
});

tape('timeUnitSpecifier produces specifier for multiple time units', function(t) {
  t.equal(vega.timeUnitSpecifier(['year', 'quarter']), '%Y Q%q');
  t.equal(vega.timeUnitSpecifier(['year', 'month']), '%Y-%m');
  t.equal(vega.timeUnitSpecifier(['year', 'month', 'date']), '%Y-%m-%d');
  t.equal(vega.timeUnitSpecifier(['year', 'week']), '%Y W%U');
  t.equal(vega.timeUnitSpecifier(['year', 'week', 'day']), '%Y W%U %a');
  t.equal(vega.timeUnitSpecifier(['day', 'hours', 'minutes']), '%a %H:%M');
  t.equal(vega.timeUnitSpecifier(['year', 'month', 'date', 'hours']), '%Y-%m-%d %H:00');
  t.equal(vega.timeUnitSpecifier(['year', 'month', 'date', 'minutes']), '%Y-%m-%d 00:%M');
  t.equal(vega.timeUnitSpecifier(['year', 'month', 'date', 'hours', 'minutes']), '%Y-%m-%d %H:%M');
  t.equal(vega.timeUnitSpecifier(['hours', 'minutes', 'seconds', 'milliseconds']), '%H:%M:%S.%L');
  t.end();
});

tape('timeUnitSpecifier supports configurable specifiers', function(t) {
  var specs = {
    'year': '%y',
    'month': 'M%m',
    'year-month': '%y-%b',
    'year-month-date': '%y-%b-%d',
    'hours': '%H ',
    'minutes': '%Mmin ',
    'hours-minutes': null
  };
  t.equal(vega.timeUnitSpecifier(['year'], specs), '%y');
  t.equal(vega.timeUnitSpecifier(['month'], specs), 'M%m');
  t.equal(vega.timeUnitSpecifier(['year', 'month'], specs), '%y-%b');
  t.equal(vega.timeUnitSpecifier(['year', 'month', 'date'], specs), '%y-%b-%d');
  t.equal(vega.timeUnitSpecifier(['hours', 'minutes'], specs), '%H %Mmin');
  t.end();
});

tape('timeFormat supports specifier strings', function(t) {
  var d = local(2001, 0, 1);
  t.equal(vega.timeFormat('%Y')(d), '2001');
  t.equal(vega.timeFormat('%m')(d), '01');
  t.equal(vega.timeFormat('%d')(d), '01');
  t.throws(() => vega.timeFormat(2));
  t.throws(() => vega.timeFormat(true));
  t.end();
});

tape('timeFormat supports specifier objects', function(t) {
  var f = vega.timeFormat();
  t.equal(f(local(2001, 0, 1)), '2001');
  t.equal(f(local(2001, 1, 1)), 'February');
  t.equal(f(local(2001, 1, 2)), 'Fri 02');
  t.equal(f(local(2001, 1, 4)), 'Feb 04');
  t.equal(f(local(2001, 3, 1)), 'April');
  t.equal(f(local(2001, 0, 1, 0, 0, 30)), ':30');

  f = vega.timeFormat({
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

tape('utcFormat supports specifier strings', function(t) {
  var d = utc(2001, 0, 1);
  t.equal(vega.utcFormat('%Y')(d), '2001');
  t.equal(vega.utcFormat('%m')(d), '01');
  t.equal(vega.utcFormat('%d')(d), '01');
  t.throws(() => vega.utcFormat(2));
  t.throws(() => vega.utcFormat(true));
  t.end();
});

tape('utcFormat supports specifier objects', function(t) {
  var f = vega.utcFormat();
  t.equal(f(utc(2001, 0, 1)), '2001');
  t.equal(f(utc(2001, 1, 1)), 'February');
  t.equal(f(utc(2001, 1, 2)), 'Fri 02');
  t.equal(f(utc(2001, 1, 4)), 'Feb 04');
  t.equal(f(utc(2001, 3, 1)), 'April');
  t.equal(f(utc(2001, 0, 1, 0, 0, 30)), ':30');

  f = vega.utcFormat({
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
