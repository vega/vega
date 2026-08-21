import {
  DATE,
  DAY,
  DAYOFYEAR,
  HOURS,
  ISOWEEK,
  MILLISECONDS,
  MINUTES,
  MONTH,
  QUARTER,
  SECONDS,
  WEEK,
  YEAR
} from './units.js';
import {
  localDate, localDayOfYear, localFirst, localISOWeekNum, localISOWeekOneDate,
  localISOWeekYear, localWeekNum,
  utcDate, utcDayOfYear, utcFirst, utcISOWeekNum, utcISOWeekOneDate,
  utcISOWeekYear, utcWeekNum
} from './util.js';
import {constant, one, peek, toSet, zero} from 'vega-util';

// Just like Vega's timeunit transform, set default year to 2012, so domain conversion will be
// compatible with Vega. 2012 is a leap year beginning on a Sunday, so days of the week order
// properly at the start of the year.
const REFERENCE_YEAR = 2012;

// Reference year for isoweek units with no year unit. ISO 8601 week numbers run to 53 in a long
// year, and 2015 is one (its week 1 starts on 2014-12-29), so every week number maps to a real
// week that formats back to the same number.
const ISOWEEK_REFERENCE_YEAR = 2015;

function floor(units, step, get, inv, newDate) {
  const s = step || 1,
        b = peek(units),
        _ = (unit, p, key) => {
          key = key || unit;
          return getUnit(get[key], inv[key], unit === b && s, p);
        };

  const t = new Date,
        u = toSet(units),
        y = u[YEAR] ? _(YEAR, null, u[ISOWEEK] ? YEAR + ISOWEEK : YEAR)
          : constant(u[ISOWEEK] ? ISOWEEK_REFERENCE_YEAR : REFERENCE_YEAR),
        m = u[MONTH] ? _(MONTH)
          : u[QUARTER] ? _(QUARTER)
          : zero,
        d = u[WEEK] && u[DAY] ? _(DAY, 1, WEEK + DAY)
          : u[ISOWEEK] && u[DAY] ? _(DAY, 1, ISOWEEK + DAY)
          : u[WEEK] ? _(WEEK, 1)
          : u[ISOWEEK] ? _(ISOWEEK, 1)
          : u[DAY] ? _(DAY, 1)
          : u[DATE] ? _(DATE, 1)
          : u[DAYOFYEAR] ? _(DAYOFYEAR, 1)
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

function getUnit(f, inv, step, phase) {
  const u = step <= 1 ? f
    : phase ? (d, y) => phase + step * Math.floor((f(d, y) - phase) / step)
    : (d, y) => step * Math.floor(f(d, y) / step);
  return inv ? (d, y) => inv(u(d, y), y) : u;
}

// returns the day of the year based on week number, day of week,
// and the day of the week for the first day of the year
function weekday(week, day, firstDay) {
  return day + week * 7 - (firstDay + 6) % 7;
}

// day within an ISO week, Monday = 0 through Sunday = 6
function isoDay(day) {
  return (day + 6) % 7;
}

// returns the day of the year for the given day of the given ISO week number, where
// weekOneDate is the day of January on which week 1 begins
function isoWeekday(weekOneDate, week, day) {
  return weekOneDate + (week - 1) * 7 + day;
}

// -- LOCAL TIME --

const localGet = {
  [YEAR]:         d => d.getFullYear(),
  [QUARTER]:      d => Math.floor(d.getMonth() / 3),
  [MONTH]:        d => d.getMonth(),
  [DATE]:         d => d.getDate(),
  [HOURS]:        d => d.getHours(),
  [MINUTES]:      d => d.getMinutes(),
  [SECONDS]:      d => d.getSeconds(),
  [MILLISECONDS]: d => d.getMilliseconds(),
  [DAYOFYEAR]:    d => localDayOfYear(d),
  [WEEK]:         d => localWeekNum(d),
  [WEEK + DAY]:   (d, y) => weekday(localWeekNum(d), d.getDay(), localFirst(y)),
  [DAY]:          (d, y) => weekday(1, d.getDay(), localFirst(y)),
  [ISOWEEK]:         d => localISOWeekNum(d),
  [YEAR + ISOWEEK]:  d => localISOWeekYear(d),
  [ISOWEEK + DAY]:   (d, y) =>
    isoWeekday(localISOWeekOneDate(y), localISOWeekNum(d), isoDay(d.getDay()))
};

const localInv = {
  [QUARTER]: q => 3 * q,
  [WEEK]:    (w, y) => weekday(w, 0, localFirst(y)),
  [ISOWEEK]: (w, y) => isoWeekday(localISOWeekOneDate(y), w, 0)
};

export function timeFloor(units, step) {
  return floor(units, step || 1, localGet, localInv, localDate);
}

// -- UTC TIME --

const utcGet = {
  [YEAR]:         d => d.getUTCFullYear(),
  [QUARTER]:      d => Math.floor(d.getUTCMonth() / 3),
  [MONTH]:        d => d.getUTCMonth(),
  [DATE]:         d => d.getUTCDate(),
  [HOURS]:        d => d.getUTCHours(),
  [MINUTES]:      d => d.getUTCMinutes(),
  [SECONDS]:      d => d.getUTCSeconds(),
  [MILLISECONDS]: d => d.getUTCMilliseconds(),
  [DAYOFYEAR]:    d => utcDayOfYear(d),
  [WEEK]:         d => utcWeekNum(d),
  [DAY]:          (d, y) => weekday(1, d.getUTCDay(), utcFirst(y)),
  [WEEK + DAY]:   (d, y) => weekday(utcWeekNum(d), d.getUTCDay(), utcFirst(y)),
  [ISOWEEK]:         d => utcISOWeekNum(d),
  [YEAR + ISOWEEK]:  d => utcISOWeekYear(d),
  [ISOWEEK + DAY]:   (d, y) =>
    isoWeekday(utcISOWeekOneDate(y), utcISOWeekNum(d), isoDay(d.getUTCDay()))
};

const utcInv = {
  [QUARTER]: q => 3 * q,
  [WEEK]:    (w, y) => weekday(w, 0, utcFirst(y)),
  [ISOWEEK]: (w, y) => isoWeekday(utcISOWeekOneDate(y), w, 0)
};

export function utcFloor(units, step) {
  return floor(units, step || 1, utcGet, utcInv, utcDate);
}
