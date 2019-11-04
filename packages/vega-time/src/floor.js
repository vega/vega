import {
  YEAR,
  QUARTER,
  MONTH,
  WEEK,
  DATE,
  DAY,
  HOURS,
  MINUTES,
  SECONDS,
  MILLISECONDS
} from './units';
import {constant, one, peek, toSet, zero} from 'vega-util';
import {timeWeek, utcWeek} from 'd3-time';

const t0 = new Date;

function floor(units, step, fn, newDate) {
  const s = step || 1,
        b = peek(units),
        _ = (unit, p, key) => skip(fn[key || unit], unit === b && s, p);

  const t = new Date,
        u = toSet(units),
        y = u[YEAR] ? _(YEAR) : constant(2012),
        m = u[MONTH] ? _(MONTH)
          : u[QUARTER] ? _(QUARTER)
          : zero,
        d = u[WEEK] && u[DAY] ? _(DAY, 1, WEEK + DAY)
          : u[WEEK] ? _(WEEK, 1)
          : u[DAY] ? _(DAY, 1)
          : u[DATE] ? _(DATE, 1)
          : one,
        H = u[HOURS] ? _(HOURS) : zero,
        M = u[MINUTES] ? _(MINUTES) : zero,
        S = u[SECONDS] ? _(SECONDS) : zero,
        L = u[MILLISECONDS] ? _(MILLISECONDS) : zero;

  return function(v) {
    t.setTime(+v);
    const year = y(t);
    return newDate(year, m(t), d(t, year), H(t), M(t), S(t), L(t));
  };
}

function skip(f, step, phase) {
  return step <= 1 ? f
    : phase ? (d, y) => phase + step * Math.floor((f(d, y) - phase) / step)
    : (d, y) => step * Math.floor(f(d, y) / step);
}

// returns the day of the year based on week number, day of week,
// and the day of the week for the first day of the year
function weekday(week, day, firstDay) {
  return day + week * 7 - (firstDay + 6) % 7;
}

// -- LOCAL TIME --

const localGet = {
  [YEAR]:         d => d.getFullYear(),
  [QUARTER]:      d => 3 * ~~(d.getMonth() / 3),
  [MONTH]:        d => d.getMonth(),
  [DATE]:         d => d.getDate(),
  [HOURS]:        d => d.getHours(),
  [MINUTES]:      d => d.getMinutes(),
  [SECONDS]:      d => d.getSeconds(),
  [MILLISECONDS]: d => d.getMilliseconds(),
  [DAY]:          (d, y) => weekday(1, d.getDay(), localFirst(y)),
  [WEEK]:         (d, y) => weekday(localWeekNum(d), 0, localFirst(y)),
  [WEEK + DAY]:   (d, y) => weekday(localWeekNum(d), d.getDay(), localFirst(y))
};

function localYear(y) {
  t0.setFullYear(y);
  t0.setMonth(0);
  t0.setDate(1);
  t0.setHours(0, 0, 0, 0);
  return t0;
}

function localWeekNum(d) {
  return timeWeek.count(localYear(d.getFullYear()) - 1, d);
}

function localFirst(y) {
  return localYear(y).getDay();
}

function localDate(y, m, d, H, M, S, L) {
  if (0 <= y && y < 100) {
    var date = new Date(-1, m, d, H, M, S, L);
    date.setFullYear(y);
    return date;
  }
  return new Date(y, m, d, H, M, S, L);
}

export function timeFloor(units, step) {
  return floor(units, step || 1, localGet, localDate);
}

// -- UTC TIME --

const utcGet = {
  [YEAR]:         d => d.getUTCFullYear(),
  [QUARTER]:      d => 3 * ~~(d.getUTCMonth() / 3),
  [MONTH]:        d => d.getUTCMonth(),
  [DATE]:         d => d.getUTCDate(),
  [HOURS]:        d => d.getUTCHours(),
  [MINUTES]:      d => d.getUTCMinutes(),
  [SECONDS]:      d => d.getUTCSeconds(),
  [MILLISECONDS]: d => d.getUTCMilliseconds(),
  [DAY]:          (d, y) => weekday(1, d.getUTCDay(), utcFirst(y)),
  [WEEK]:         (d, y) => weekday(utcWeekNum(d), 0, utcFirst(y)),
  [WEEK + DAY]:   (d, y) => weekday(utcWeekNum(d), d.getUTCDay(), utcFirst(y))
};

function utcWeekNum(d) {
  const y = Date.UTC(d.getUTCFullYear(), 0, 1);
  return utcWeek.count(y - 1, d);
}

function utcFirst(y) {
  t0.setTime(Date.UTC(y, 0, 1));
  return t0.getUTCDay();
}

function utcDate(y, m, d, H, M, S, L) {
  if (0 <= y && y < 100) {
    var date = new Date(Date.UTC(-1, m, d, H, M, S, L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(y, m, d, H, M, S, L));
}

export function utcFloor(units, step) {
  return floor(units, step || 1, utcGet, utcDate);
}
