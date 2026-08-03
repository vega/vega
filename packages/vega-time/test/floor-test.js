import tape from 'tape';
import * as vega from '../index.js';
import { local, utc } from './util.js';
const UNITS = [
  'year',
  'quarter',
  'month',
  'week',
  'isoweek',
  'date',
  'day',
  'dayofyear',
  'year-quarter',
  'year-month',
  'year-month-date',
  'year-week',
  'year-week-day',
  'year-isoweek',
  'year-isoweek-day',
  'year-dayofyear',
  'month-date',
  'week-day',
  'isoweek-day'
];

// isoweek units with no year unit fall in the reference year 2015, a long year (53 weeks)
// whose week 1 starts on Monday 2014-12-29
const ISO_WEEK_ONE = [2014, 11, 29];

function isoRef(date, week, day) {
  return date(ISO_WEEK_ONE[0], ISO_WEEK_ONE[1], ISO_WEEK_ONE[2] + 7 * (week - 1) + day);
}

function floor(unit, date) {
  switch (unit) {
    case 'year':            return d => date(d.y, 0, 1);
    case 'quarter':         return d => date(2012, 3 * d.q, 1);
    case 'month':           return d => date(2012, d.m, 1);
    case 'week':            return d => date(2012, 0, 7 * (d.w - 1) + 1);
    case 'isoweek':         return d => isoRef(date, d.iw, 0);
    case 'date':            return d => date(2012, 0, d.d);
    case 'day':             return d => date(2012, 0, d.u + 1);
    case 'dayofyear':       return d => date(2012, 0, d.doy);
    case 'year-quarter':    return d => date(d.y, 3 * d.q, 1);
    case 'year-month':      return d => date(d.y, d.m, 1);
    case 'year-month-date': return d => date(d.y, d.m, d.d);
    case 'year-week':       return d => date(d.y, 0, 7 * (d.w - 1) + 1);
    case 'year-week-day':   return d => date(d.y, d.m, d.d);
    // an ISO week belongs to its week-numbering year, which is not always the calendar year
    case 'year-isoweek':    return d => date(...d.mon);
    case 'year-isoweek-day':return d => date(d.y, d.m, d.d);
    case 'year-dayofyear':  return d => date(d.y, 0, d.doy);
    case 'month-date':      return d => date(2012, d.m, d.d);
    case 'week-day':        return d => date(2012, 0, 7 * (d.w - 1) + d.u + 1);
    case 'isoweek-day':     return d => isoRef(date, d.iw, (d.u + 6) % 7);
  }
}

function testFloor(t, data, f, g) {
  data.forEach(d => t.equal(+f(d.date), +g(d)));
}

tape('timeFloor generates local floor function', t => {
  const data = [
    // w is the Sunday-based week number, iw the ISO week number, mon the Monday starting
    // that ISO week, and u the JavaScript day of the week
    {y: 2012, q: 0, m: 0, d: 1, w: 1, u: 0, doy: 1, iw: 52, mon: [2011, 11, 26]},
    {y: 2012, q: 1, m: 3, d: 2, w: 14, u: 1, doy: 93, iw: 14, mon: [2012, 3, 2]},
    {y: 2012, q: 2, m: 6, d: 3, w: 27, u: 2, doy: 185, iw: 27, mon: [2012, 6, 2]},
    {y: 2012, q: 3, m: 9, d: 4, w: 40, u: 4, doy: 278, iw: 40, mon: [2012, 9, 1]}
  ];
  data.forEach(o => o.date = local(o.y, o.m, o.d));

  UNITS.forEach(u => testFloor(t, data,
    vega.timeFloor(u.split('-')),
    floor(u, local)
  ));

  t.end();
});

tape('utcFloor generates utc floor function', t => {
  const data = [
    // w is the Sunday-based week number, iw the ISO week number, mon the Monday starting
    // that ISO week, and u the JavaScript day of the week
    {y: 2012, q: 0, m: 0, d: 1, w: 1, u: 0, doy: 1, iw: 52, mon: [2011, 11, 26]},
    {y: 2012, q: 1, m: 3, d: 2, w: 14, u: 1, doy: 93, iw: 14, mon: [2012, 3, 2]},
    {y: 2012, q: 2, m: 6, d: 3, w: 27, u: 2, doy: 185, iw: 27, mon: [2012, 6, 2]},
    {y: 2012, q: 3, m: 9, d: 4, w: 40, u: 4, doy: 278, iw: 40, mon: [2012, 9, 1]}
  ];
  data.forEach(o => o.date = utc(o.y, o.m, o.d));

  UNITS.forEach(u => testFloor(t, data,
    vega.utcFloor(u.split('-')),
    floor(u, utc)
  ));

  t.end();
});

tape('timeFloor uses ISO 8601 boundaries for isoweek', t => {
  const yw = ['year', 'isoweek'];

  // every day of an ISO week floors to that week's Monday
  for (let d = 26; d <= 32; ++d) {
    t.equal(+vega.timeFloor(yw)(local(2011, 11, d)), +local(2011, 11, 26));
    t.equal(+vega.utcFloor(yw)(utc(2011, 11, d)), +utc(2011, 11, 26));
  }

  // week 1 is the week containing January 4, so it can start in the previous calendar year
  t.equal(+vega.timeFloor(yw)(local(2013, 0, 1)), +local(2012, 11, 31));
  t.equal(+vega.utcFloor(yw)(utc(2013, 0, 1)), +utc(2012, 11, 31));

  // and January 1-3 can belong to the last week of the previous week-numbering year
  t.equal(+vega.timeFloor(yw)(local(2010, 0, 3)), +local(2009, 11, 28));
  t.equal(+vega.utcFloor(yw)(utc(2010, 0, 3)), +utc(2009, 11, 28));

  // the Sunday-based week unit is unaffected, and still floors to the preceding Sunday
  t.equal(+vega.timeFloor(['year', 'week'])(local(2013, 0, 1)), +local(2012, 11, 30));
  t.equal(+vega.utcFloor(['year', 'week'])(utc(2013, 0, 1)), +utc(2012, 11, 30));

  t.end();
});

tape('timeFloor handles step parameter', t => {
  const d1 = local(2020, 5, 15),
        d2 = local(2020, 5, 22),
        yq = ['year', 'quarter'],
        yw = ['year', 'week'];

  t.equal(+vega.timeFloor(yq)(d1), +local(2020, 3, 1));
  t.equal(+vega.timeFloor(yq, 1)(d1), +local(2020, 3, 1));
  t.equal(+vega.timeFloor(yq, 2)(d1), +local(2020, 0, 1));

  t.equal(+vega.timeFloor(yw)(d1), +local(2020, 5, 14));
  t.equal(+vega.timeFloor(yw, 1)(d1), +local(2020, 5, 14));
  t.equal(+vega.timeFloor(yw, 2)(d1), +local(2020, 5, 7));
  t.equal(+vega.timeFloor(yw, 3)(d1), +local(2020, 4, 31));
  t.equal(+vega.timeFloor(yw, 4)(d1), +local(2020, 4, 24));
  t.equal(+vega.timeFloor(yw, 4)(d2), +local(2020, 5, 21));

  t.end();
});

tape('utcFloor handles step parameter', t => {
  const d1 = utc(2020, 5, 15),
        d2 = utc(2020, 5, 22),
        yq = ['year', 'quarter'],
        yw = ['year', 'week'];

  t.equal(+vega.utcFloor(yq)(d1), +utc(2020, 3, 1));
  t.equal(+vega.utcFloor(yq, 1)(d1), +utc(2020, 3, 1));
  t.equal(+vega.utcFloor(yq, 2)(d1), +utc(2020, 0, 1));

  t.equal(+vega.utcFloor(yw)(d1), +utc(2020, 5, 14));
  t.equal(+vega.utcFloor(yw, 1)(d1), +utc(2020, 5, 14));
  t.equal(+vega.utcFloor(yw, 2)(d1), +utc(2020, 5, 7));
  t.equal(+vega.utcFloor(yw, 3)(d1), +utc(2020, 4, 31));
  t.equal(+vega.utcFloor(yw, 4)(d1), +utc(2020, 4, 24));
  t.equal(+vega.utcFloor(yw, 4)(d2), +utc(2020, 5, 21));

  t.end();
});

tape('timeFloor handles step parameter for isoweek', t => {
  const d1 = local(2020, 5, 15),
        d2 = local(2020, 5, 22),
        d3 = local(2020, 6, 6),
        yw = ['year', 'isoweek'];

  t.equal(+vega.timeFloor(yw)(d1), +local(2020, 5, 15));
  t.equal(+vega.timeFloor(yw, 1)(d1), +local(2020, 5, 15));
  t.equal(+vega.timeFloor(yw, 2)(d1), +local(2020, 5, 15));
  t.equal(+vega.timeFloor(yw, 2)(d2), +local(2020, 5, 15));
  t.equal(+vega.timeFloor(yw, 4)(d2), +local(2020, 5, 15));

  t.equal(+vega.timeFloor(yw)(d3), +local(2020, 6, 6));
  t.equal(+vega.timeFloor(yw, 2)(d3), +local(2020, 5, 29));
  t.equal(+vega.timeFloor(yw, 3)(d3), +local(2020, 6, 6));
  t.equal(+vega.timeFloor(yw, 4)(d3), +local(2020, 5, 15));

  t.end();
});

tape('utcFloor handles step parameter for isoweek', t => {
  const d1 = utc(2020, 5, 15),
        d2 = utc(2020, 5, 22),
        d3 = utc(2020, 6, 6),
        yw = ['year', 'isoweek'];

  t.equal(+vega.utcFloor(yw)(d1), +utc(2020, 5, 15));
  t.equal(+vega.utcFloor(yw, 1)(d1), +utc(2020, 5, 15));
  t.equal(+vega.utcFloor(yw, 2)(d1), +utc(2020, 5, 15));
  t.equal(+vega.utcFloor(yw, 2)(d2), +utc(2020, 5, 15));
  t.equal(+vega.utcFloor(yw, 4)(d2), +utc(2020, 5, 15));

  t.equal(+vega.utcFloor(yw)(d3), +utc(2020, 6, 6));
  t.equal(+vega.utcFloor(yw, 2)(d3), +utc(2020, 5, 29));
  t.equal(+vega.utcFloor(yw, 3)(d3), +utc(2020, 6, 6));
  t.equal(+vega.utcFloor(yw, 4)(d3), +utc(2020, 5, 15));

  t.end();
});
