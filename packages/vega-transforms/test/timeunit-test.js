var tape = require('tape'),
    field = require('vega-util').field,
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    TimeUnit = tx.timeunit;

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

function increment(unit, step) {
  switch (unit) {
    case 'year':            return d => inc(d, 'y', step);
    case 'quarter':         return d => inc(d, 'q', step);
    case 'month':           return d => inc(d, 'm', step);
    case 'week':            return d => inc(d, 'w', step);
    case 'date':            return d => inc(d, 'd', step);
    case 'day':             return d => inc(d, 'u', step);
    case 'year-quarter':    return d => inc(d, 'q', step);
    case 'year-month':      return d => inc(d, 'm', step);
    case 'year-month-date': return d => inc(d, 'd', step);
    case 'year-week':       return d => inc(d, 'w', step);
    case 'year-week-day':   return d => inc(d, 'd', step);
    case 'month-date':      return d => inc(d, 'd', step);
    case 'week-day':        return d => inc(d, 'u', step);
  }
}

function inc(d, f, s) {
  return Object.assign({}, d, {[f]: d[f] + (s || 1)});
}

function localDate(y, m, d, H, M, S, L) {
  return new Date(y, m, d, H||0, M||0, S||0, L||0);
}

function utcDate(y, m, d, H, M, S, L) {
  return new Date(Date.UTC(y, m, d, H||0, M||0, S||0, L||0));
}

function testDates(t, data, unit, date) {
  const f = floor(unit, date),
        i = increment(unit);
  data.forEach(d => {
    t.equal(+d.unit0, +f(d));
    t.equal(+d.unit1, +f(i(d)));
  });
}

tape('TimeUnit truncates dates to time units', function(t) {
  var data = [
    {y: 2012, q: 0, m: 0, d: 1, w: 1, u: 0},
    {y: 2012, q: 1, m: 3, d: 2, w: 14, u: 1},
    {y: 2012, q: 2, m: 6, d: 3, w: 27, u: 2},
    {y: 2012, q: 3, m: 9, d: 4, w: 40, u: 4}
  ];
  data.forEach(o => o.date = new Date(o.y, o.m, o.d));

  var df = new vega.Dataflow(),
      date = field('date'),
      units = df.add(['year']),
      c = df.add(Collect),
      s = df.add(TimeUnit, {unit:units, field:date, pulse:c});

  df.pulse(c, changeset().insert(data));

  UNITS.forEach((u, i) => {
    var a = u.split('-');
    df.update(units, a).run();
    t.equal(s.pulse.rem.length, 0);
    t.equal(s.pulse.add.length, i ? 0 : 4);
    t.equal(s.pulse.mod.length, i ? 4 : 0);
    testDates(t, s.pulse.source, u, localDate);
    t.equal(s.value.unit, a[a.length-1]);
    t.equal(s.value.step, 1);
  });

  t.end();
});

tape('TimeUnit truncates UTC dates to time units', function(t) {
  var data = [
    {y: 2012, q: 0, m: 0, d: 1, w: 1, u: 0},
    {y: 2012, q: 1, m: 3, d: 2, w: 14, u: 1},
    {y: 2012, q: 2, m: 6, d: 3, w: 27, u: 2},
    {y: 2012, q: 3, m: 9, d: 4, w: 40, u: 4}
  ];
  data.forEach(o => o.date = new Date(Date.UTC(o.y, o.m, o.d)));

  var df = new vega.Dataflow(),
      date = field('date'),
      units = df.add(['year']),
      c = df.add(Collect),
      s = df.add(TimeUnit, {unit:units, timezone:'utc', field:date, pulse:c});

  df.pulse(c, changeset().insert(data));

  UNITS.forEach((u, i) => {
    var a = u.split('-');
    df.update(units, a).run();
    t.equal(s.pulse.rem.length, 0);
    t.equal(s.pulse.add.length, i ? 0 : 4);
    t.equal(s.pulse.mod.length, i ? 4 : 0);
    testDates(t, s.pulse.source, u, utcDate);
    t.equal(s.value.unit, a[a.length-1]);
    t.equal(s.value.step, 1);
  });

  t.end();
});

tape('TimeUnit supports stepped units', function(t) {
  var data = [
    {y: 2012, q: 0, m: 0, d: 1, w: 1, u: 0},
    {y: 2012, q: 1, m: 3, d: 2, w: 14, u: 1},
    {y: 2012, q: 2, m: 6, d: 3, w: 27, u: 2},
    {y: 2012, q: 3, m: 9, d: 4, w: 40, u: 4}
  ];
  data.forEach(o => o.date = new Date(o.y, o.m, o.d));

  var df = new vega.Dataflow(),
      date = field('date'),
      units = df.add(['year', 'month']),
      step = df.add(1),
      c = df.add(Collect),
      s = df.add(TimeUnit, {unit:units, step:step, field:date, pulse:c});

  df.pulse(c, changeset().insert(data)).run();
  t.equal(s.pulse.add.length, 4);
  t.equal(s.pulse.rem.length, 0);
  t.equal(s.pulse.mod.length, 0);
  t.equal(s.value.step, 1);
  testDates(t, data, 'year-month', localDate);

  df.update(step, 3).run();
  t.equal(s.pulse.add.length, 0);
  t.equal(s.pulse.rem.length, 0);
  t.equal(s.pulse.mod.length, 4);
  t.equal(s.value.step, 3);
  testDates(t, data, 'year-quarter', localDate);

  t.end();
});
