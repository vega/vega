var tape = require('tape'),
    vega = require('../'),
    {local, utc} = require('./util');

var UNITS = [
  'year',
  'quarter',
  'month',
  'week',
  'date',
  'day',
  'year-quarter',
  'year-month',
  'year-month-date',
  'year-week',
  'year-week-day',
  'month-date',
  'week-day'
];

function floor(unit, date) {
  switch (unit) {
    case 'year':            return d => date(d.y, 0, 1);
    case 'quarter':         return d => date(2012, 3 * d.q, 1);
    case 'month':           return d => date(2012, d.m, 1);
    case 'week':            return d => date(2012, 0, 7 * (d.w - 1) + 1);
    case 'date':            return d => date(2012, 0, d.d);
    case 'day':             return d => date(2012, 0, d.u + 1);
    case 'year-quarter':    return d => date(d.y, 3 * d.q, 1);
    case 'year-month':      return d => date(d.y, d.m, 1);
    case 'year-month-date': return d => date(d.y, d.m, d.d);
    case 'year-week':       return d => date(d.y, 0, 7 * (d.w - 1) + 1);
    case 'year-week-day':   return d => date(d.y, d.m, d.d);
    case 'month-date':      return d => date(2012, d.m, d.d);
    case 'week-day':        return d => date(2012, 0, 7 * (d.w - 1) + d.u + 1);
  }
}

function testFloor(t, data, f, g) {
  data.forEach(d => t.equal(+f(d.date), +g(d)));
}

tape('timeFloor generates local floor function', function(t) {
  var data = [
    {y: 2012, q: 0, m: 0, d: 1, w: 1, u: 0},
    {y: 2012, q: 1, m: 3, d: 2, w: 14, u: 1},
    {y: 2012, q: 2, m: 6, d: 3, w: 27, u: 2},
    {y: 2012, q: 3, m: 9, d: 4, w: 40, u: 4}
  ];
  data.forEach(o => o.date = local(o.y, o.m, o.d));

  UNITS.forEach(u => testFloor(t, data,
    vega.timeFloor(u.split('-')),
    floor(u, local)
  ));

  t.end();
});

tape('utcFloor generates utc floor function', function(t) {
  var data = [
    {y: 2012, q: 0, m: 0, d: 1, w: 1, u: 0},
    {y: 2012, q: 1, m: 3, d: 2, w: 14, u: 1},
    {y: 2012, q: 2, m: 6, d: 3, w: 27, u: 2},
    {y: 2012, q: 3, m: 9, d: 4, w: 40, u: 4}
  ];
  data.forEach(o => o.date = utc(o.y, o.m, o.d));

  UNITS.forEach(u => testFloor(t, data,
    vega.utcFloor(u.split('-')),
    floor(u, utc)
  ));

  t.end();
});
