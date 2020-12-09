var tape = require('tape'),
    vega = require('../');

tape('timeUnitSpecifier produces specifier for single time units', t => {
  t.equal(vega.timeUnitSpecifier('year'), '%Y');
  t.equal(vega.timeUnitSpecifier('quarter'), 'Q%q');
  t.equal(vega.timeUnitSpecifier('month'), '%b');
  t.equal(vega.timeUnitSpecifier('week'), 'W%U');
  t.equal(vega.timeUnitSpecifier('day'), '%a');
  t.equal(vega.timeUnitSpecifier('date'), '%d');
  t.equal(vega.timeUnitSpecifier('dayofyear'), '%j');
  t.equal(vega.timeUnitSpecifier('hours'), '%H:00');
  t.equal(vega.timeUnitSpecifier('minutes'), '00:%M');
  t.equal(vega.timeUnitSpecifier('seconds'), ':%S');
  t.equal(vega.timeUnitSpecifier('milliseconds'), '.%L');
  t.end();
});

tape('timeUnitSpecifier produces specifier for multiple time units', t => {
  t.equal(vega.timeUnitSpecifier(['year', 'quarter']), '%Y Q%q');
  t.equal(vega.timeUnitSpecifier(['year', 'month']), '%Y-%m');
  t.equal(vega.timeUnitSpecifier(['year', 'month', 'date']), '%Y-%m-%d');
  t.equal(vega.timeUnitSpecifier(['year', 'week']), '%Y W%U');
  t.equal(vega.timeUnitSpecifier(['year', 'week', 'day']), '%Y W%U %a');
  t.equal(vega.timeUnitSpecifier(['year', 'dayofyear']), '%Y %j');
  t.equal(vega.timeUnitSpecifier(['day', 'hours', 'minutes']), '%a %H:%M');
  t.equal(vega.timeUnitSpecifier(['year', 'month', 'date', 'hours']), '%Y-%m-%d %H:00');
  t.equal(vega.timeUnitSpecifier(['year', 'month', 'date', 'minutes']), '%Y-%m-%d 00:%M');
  t.equal(vega.timeUnitSpecifier(['year', 'month', 'date', 'hours', 'minutes']), '%Y-%m-%d %H:%M');
  t.equal(vega.timeUnitSpecifier(['hours', 'minutes', 'seconds', 'milliseconds']), '%H:%M:%S.%L');
  t.end();
});

tape('timeUnitSpecifier supports configurable specifiers', t => {
  const specs = {
    'year': '%y',
    'month': 'M%m',
    'year-month': '%y-%b',
    'year-month-date': '%y-%b-%d',
    'dayofyear': 'D%j',
    'hours': '%H ',
    'minutes': '%Mmin ',
    'hours-minutes': null
  };
  t.equal(vega.timeUnitSpecifier(['year'], specs), '%y');
  t.equal(vega.timeUnitSpecifier(['month'], specs), 'M%m');
  t.equal(vega.timeUnitSpecifier(['year', 'month'], specs), '%y-%b');
  t.equal(vega.timeUnitSpecifier(['year', 'month', 'date'], specs), '%y-%b-%d');
  t.equal(vega.timeUnitSpecifier(['dayofyear'], specs), 'D%j');
  t.equal(vega.timeUnitSpecifier(['hours', 'minutes'], specs), '%H %Mmin');
  t.end();
});
