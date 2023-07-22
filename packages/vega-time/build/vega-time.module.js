import { array, error, hasOwnProperty, extend, peek, toSet, constant, zero, one, span } from 'vega-util';
import { timeDay, timeWeek, utcDay, utcWeek, timeYear, timeMonth, timeHour, timeMinute, timeSecond, timeMillisecond, utcYear, utcMonth, utcHour, utcMinute, utcSecond, utcMillisecond } from 'd3-time';
import { bisector, tickStep } from 'd3-array';

const YEAR = 'year';
const QUARTER = 'quarter';
const MONTH = 'month';
const WEEK = 'week';
const DATE = 'date';
const DAY = 'day';
const DAYOFYEAR = 'dayofyear';
const HOURS = 'hours';
const MINUTES = 'minutes';
const SECONDS = 'seconds';
const MILLISECONDS = 'milliseconds';
const TIME_UNITS = [YEAR, QUARTER, MONTH, WEEK, DATE, DAY, DAYOFYEAR, HOURS, MINUTES, SECONDS, MILLISECONDS];
const UNITS = TIME_UNITS.reduce((o, u, i) => (o[u] = 1 + i, o), {});
function timeUnits(units) {
  const u = array(units).slice(),
    m = {};

  // check validity
  if (!u.length) error('Missing time unit.');
  u.forEach(unit => {
    if (hasOwnProperty(UNITS, unit)) {
      m[unit] = 1;
    } else {
      error(`Invalid time unit: ${unit}.`);
    }
  });
  const numTypes = (m[WEEK] || m[DAY] ? 1 : 0) + (m[QUARTER] || m[MONTH] || m[DATE] ? 1 : 0) + (m[DAYOFYEAR] ? 1 : 0);
  if (numTypes > 1) {
    error(`Incompatible time units: ${units}`);
  }

  // ensure proper sort order
  u.sort((a, b) => UNITS[a] - UNITS[b]);
  return u;
}
const defaultSpecifiers = {
  [YEAR]: '%Y ',
  [QUARTER]: 'Q%q ',
  [MONTH]: '%b ',
  [DATE]: '%d ',
  [WEEK]: 'W%U ',
  [DAY]: '%a ',
  [DAYOFYEAR]: '%j ',
  [HOURS]: '%H:00',
  [MINUTES]: '00:%M',
  [SECONDS]: ':%S',
  [MILLISECONDS]: '.%L',
  [`${YEAR}-${MONTH}`]: '%Y-%m ',
  [`${YEAR}-${MONTH}-${DATE}`]: '%Y-%m-%d ',
  [`${HOURS}-${MINUTES}`]: '%H:%M'
};
function timeUnitSpecifier(units, specifiers) {
  const s = extend({}, defaultSpecifiers, specifiers),
    u = timeUnits(units),
    n = u.length;
  let fmt = '',
    start = 0,
    end,
    key;
  for (start = 0; start < n;) {
    for (end = u.length; end > start; --end) {
      key = u.slice(start, end).join('-');
      if (s[key] != null) {
        fmt += s[key];
        start = end;
        break;
      }
    }
  }
  return fmt.trim();
}

const t0 = new Date();
function localYear(y) {
  t0.setFullYear(y);
  t0.setMonth(0);
  t0.setDate(1);
  t0.setHours(0, 0, 0, 0);
  return t0;
}
function dayofyear(d) {
  return localDayOfYear(new Date(d));
}
function week(d) {
  return localWeekNum(new Date(d));
}
function localDayOfYear(d) {
  return timeDay.count(localYear(d.getFullYear()) - 1, d);
}
function localWeekNum(d) {
  return timeWeek.count(localYear(d.getFullYear()) - 1, d);
}
function localFirst(y) {
  return localYear(y).getDay();
}
function localDate(y, m, d, H, M, S, L) {
  if (0 <= y && y < 100) {
    const date = new Date(-1, m, d, H, M, S, L);
    date.setFullYear(y);
    return date;
  }
  return new Date(y, m, d, H, M, S, L);
}
function utcdayofyear(d) {
  return utcDayOfYear(new Date(d));
}
function utcweek(d) {
  return utcWeekNum(new Date(d));
}
function utcDayOfYear(d) {
  const y = Date.UTC(d.getUTCFullYear(), 0, 1);
  return utcDay.count(y - 1, d);
}
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
    const date = new Date(Date.UTC(-1, m, d, H, M, S, L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(y, m, d, H, M, S, L));
}

function floor(units, step, get, inv, newDate) {
  const s = step || 1,
    b = peek(units),
    _ = (unit, p, key) => {
      key = key || unit;
      return getUnit(get[key], inv[key], unit === b && s, p);
    };
  const t = new Date(),
    u = toSet(units),
    y = u[YEAR] ? _(YEAR) : constant(2012),
    m = u[MONTH] ? _(MONTH) : u[QUARTER] ? _(QUARTER) : zero,
    d = u[WEEK] && u[DAY] ? _(DAY, 1, WEEK + DAY) : u[WEEK] ? _(WEEK, 1) : u[DAY] ? _(DAY, 1) : u[DATE] ? _(DATE, 1) : u[DAYOFYEAR] ? _(DAYOFYEAR, 1) : one,
    H = u[HOURS] ? _(HOURS) : zero,
    M = u[MINUTES] ? _(MINUTES) : zero,
    S = u[SECONDS] ? _(SECONDS) : zero,
    L = u[MILLISECONDS] ? _(MILLISECONDS) : zero;
  return function (v) {
    t.setTime(+v);
    const year = y(t);
    return newDate(year, m(t), d(t, year), H(t), M(t), S(t), L(t));
  };
}
function getUnit(f, inv, step, phase) {
  const u = step <= 1 ? f : phase ? (d, y) => phase + step * Math.floor((f(d, y) - phase) / step) : (d, y) => step * Math.floor(f(d, y) / step);
  return inv ? (d, y) => inv(u(d, y), y) : u;
}

// returns the day of the year based on week number, day of week,
// and the day of the week for the first day of the year
function weekday(week, day, firstDay) {
  return day + week * 7 - (firstDay + 6) % 7;
}

// -- LOCAL TIME --

const localGet = {
  [YEAR]: d => d.getFullYear(),
  [QUARTER]: d => Math.floor(d.getMonth() / 3),
  [MONTH]: d => d.getMonth(),
  [DATE]: d => d.getDate(),
  [HOURS]: d => d.getHours(),
  [MINUTES]: d => d.getMinutes(),
  [SECONDS]: d => d.getSeconds(),
  [MILLISECONDS]: d => d.getMilliseconds(),
  [DAYOFYEAR]: d => localDayOfYear(d),
  [WEEK]: d => localWeekNum(d),
  [WEEK + DAY]: (d, y) => weekday(localWeekNum(d), d.getDay(), localFirst(y)),
  [DAY]: (d, y) => weekday(1, d.getDay(), localFirst(y))
};
const localInv = {
  [QUARTER]: q => 3 * q,
  [WEEK]: (w, y) => weekday(w, 0, localFirst(y))
};
function timeFloor(units, step) {
  return floor(units, step || 1, localGet, localInv, localDate);
}

// -- UTC TIME --

const utcGet = {
  [YEAR]: d => d.getUTCFullYear(),
  [QUARTER]: d => Math.floor(d.getUTCMonth() / 3),
  [MONTH]: d => d.getUTCMonth(),
  [DATE]: d => d.getUTCDate(),
  [HOURS]: d => d.getUTCHours(),
  [MINUTES]: d => d.getUTCMinutes(),
  [SECONDS]: d => d.getUTCSeconds(),
  [MILLISECONDS]: d => d.getUTCMilliseconds(),
  [DAYOFYEAR]: d => utcDayOfYear(d),
  [WEEK]: d => utcWeekNum(d),
  [DAY]: (d, y) => weekday(1, d.getUTCDay(), utcFirst(y)),
  [WEEK + DAY]: (d, y) => weekday(utcWeekNum(d), d.getUTCDay(), utcFirst(y))
};
const utcInv = {
  [QUARTER]: q => 3 * q,
  [WEEK]: (w, y) => weekday(w, 0, utcFirst(y))
};
function utcFloor(units, step) {
  return floor(units, step || 1, utcGet, utcInv, utcDate);
}

const timeIntervals = {
  [YEAR]: timeYear,
  [QUARTER]: timeMonth.every(3),
  [MONTH]: timeMonth,
  [WEEK]: timeWeek,
  [DATE]: timeDay,
  [DAY]: timeDay,
  [DAYOFYEAR]: timeDay,
  [HOURS]: timeHour,
  [MINUTES]: timeMinute,
  [SECONDS]: timeSecond,
  [MILLISECONDS]: timeMillisecond
};
const utcIntervals = {
  [YEAR]: utcYear,
  [QUARTER]: utcMonth.every(3),
  [MONTH]: utcMonth,
  [WEEK]: utcWeek,
  [DATE]: utcDay,
  [DAY]: utcDay,
  [DAYOFYEAR]: utcDay,
  [HOURS]: utcHour,
  [MINUTES]: utcMinute,
  [SECONDS]: utcSecond,
  [MILLISECONDS]: utcMillisecond
};
function timeInterval(unit) {
  return timeIntervals[unit];
}
function utcInterval(unit) {
  return utcIntervals[unit];
}
function offset(ival, date, step) {
  return ival ? ival.offset(date, step) : undefined;
}
function timeOffset(unit, date, step) {
  return offset(timeInterval(unit), date, step);
}
function utcOffset(unit, date, step) {
  return offset(utcInterval(unit), date, step);
}
function sequence(ival, start, stop, step) {
  return ival ? ival.range(start, stop, step) : undefined;
}
function timeSequence(unit, start, stop, step) {
  return sequence(timeInterval(unit), start, stop, step);
}
function utcSequence(unit, start, stop, step) {
  return sequence(utcInterval(unit), start, stop, step);
}

const durationSecond = 1000,
  durationMinute = durationSecond * 60,
  durationHour = durationMinute * 60,
  durationDay = durationHour * 24,
  durationWeek = durationDay * 7,
  durationMonth = durationDay * 30,
  durationYear = durationDay * 365;
const Milli = [YEAR, MONTH, DATE, HOURS, MINUTES, SECONDS, MILLISECONDS],
  Seconds = Milli.slice(0, -1),
  Minutes = Seconds.slice(0, -1),
  Hours = Minutes.slice(0, -1),
  Day = Hours.slice(0, -1),
  Week = [YEAR, WEEK],
  Month = [YEAR, MONTH],
  Year = [YEAR];
const intervals = [[Seconds, 1, durationSecond], [Seconds, 5, 5 * durationSecond], [Seconds, 15, 15 * durationSecond], [Seconds, 30, 30 * durationSecond], [Minutes, 1, durationMinute], [Minutes, 5, 5 * durationMinute], [Minutes, 15, 15 * durationMinute], [Minutes, 30, 30 * durationMinute], [Hours, 1, durationHour], [Hours, 3, 3 * durationHour], [Hours, 6, 6 * durationHour], [Hours, 12, 12 * durationHour], [Day, 1, durationDay], [Week, 1, durationWeek], [Month, 1, durationMonth], [Month, 3, 3 * durationMonth], [Year, 1, durationYear]];
function bin (opt) {
  const ext = opt.extent,
    max = opt.maxbins || 40,
    target = Math.abs(span(ext)) / max;
  let i = bisector(i => i[2]).right(intervals, target),
    units,
    step;
  if (i === intervals.length) {
    units = Year, step = tickStep(ext[0] / durationYear, ext[1] / durationYear, max);
  } else if (i) {
    i = intervals[target / intervals[i - 1][2] < intervals[i][2] / target ? i - 1 : i];
    units = i[0];
    step = i[1];
  } else {
    units = Milli;
    step = Math.max(tickStep(ext[0], ext[1], max), 1);
  }
  return {
    units,
    step
  };
}

export { DATE, DAY, DAYOFYEAR, HOURS, MILLISECONDS, MINUTES, MONTH, QUARTER, SECONDS, TIME_UNITS, WEEK, YEAR, dayofyear, bin as timeBin, timeFloor, timeInterval, timeOffset, timeSequence, timeUnitSpecifier, timeUnits, utcFloor, utcInterval, utcOffset, utcSequence, utcdayofyear, utcweek, week };
