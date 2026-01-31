import {
  DATE,
  DAY,
  DAYOFYEAR,
  HOURS,
  MILLISECONDS,
  MINUTES,
  MONTH,
  QUARTER,
  SECONDS,
  TimeUnit,
  WEEK,
  YEAR
} from './units.js';
import {
  localDate, localDayOfYear, localFirst, localWeekNum,
  utcDate, utcDayOfYear, utcFirst, utcWeekNum
} from './util.js';
import {constant, one, peek, toSet, zero} from 'vega-util';

type DateFactory = (y: number, m: number, d: number, H: number, M: number, S: number, L: number) => Date;
type GetterFn = (d: Date, y?: number) => number;
type GetterRecord = Record<string, GetterFn>;
type InverterFn = (v: number, y?: number) => number;
type InverterRecord = Record<string, InverterFn>;
type FloorFn = (date: Date) => Date;
type UnitFn = (d: Date, y?: number) => number;

function floor(
  units: TimeUnit[],
  step: number,
  get: GetterRecord,
  inv: InverterRecord,
  newDate: DateFactory
): FloorFn {
  const s = step || 1,
        b = peek(units) as string,
        _ = (unit: string, p?: number, key?: string): UnitFn => {
          key = key || unit;
          return getUnit(get[key], inv[key], unit === b && s, p);
        };

  const t = new Date,
        u = toSet(units) as Record<string, boolean>,
        y = u[YEAR] ? _(YEAR) : constant(2012),
        m = u[MONTH] ? _(MONTH)
          : u[QUARTER] ? _(QUARTER)
          : zero,
        d = u[WEEK] && u[DAY] ? _(DAY, 1, WEEK + DAY)
          : u[WEEK] ? _(WEEK, 1)
          : u[DAY] ? _(DAY, 1)
          : u[DATE] ? _(DATE, 1)
          : u[DAYOFYEAR] ? _(DAYOFYEAR, 1)
          : one,
        H = u[HOURS] ? _(HOURS) : zero,
        M = u[MINUTES] ? _(MINUTES) : zero,
        S = u[SECONDS] ? _(SECONDS) : zero,
        L = u[MILLISECONDS] ? _(MILLISECONDS) : zero;

  return function(v: Date): Date {
    t.setTime(+v);
    const year = y(t);
    return newDate(year, m(t), d(t, year), H(t), M(t), S(t), L(t));
  };
}

function getUnit(f: GetterFn, inv: InverterFn | undefined, step: number | false, phase?: number): UnitFn {
  const u: UnitFn = !step || step <= 1 ? f
    : phase ? (d, y) => phase + step * Math.floor((f(d, y) - phase) / step)
    : (d, y) => step * Math.floor(f(d, y) / step);
  return inv ? (d, y) => inv(u(d, y), y) : u;
}

// returns the day of the year based on week number, day of week,
// and the day of the week for the first day of the year
function weekday(week: number, day: number, firstDay: number): number {
  return day + week * 7 - (firstDay + 6) % 7;
}

// -- LOCAL TIME --

const localGet: GetterRecord = {
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
  [WEEK + DAY]:   (d, y) => weekday(localWeekNum(d), d.getDay(), localFirst(y!)),
  [DAY]:          (d, y) => weekday(1, d.getDay(), localFirst(y!))
};

const localInv: InverterRecord = {
  [QUARTER]: q => 3 * q,
  [WEEK]:    (w, y) => weekday(w, 0, localFirst(y!))
};

export function timeFloor(units: TimeUnit[], step?: number): FloorFn {
  return floor(units, step || 1, localGet, localInv, localDate);
}

// -- UTC TIME --

const utcGet: GetterRecord = {
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
  [DAY]:          (d, y) => weekday(1, d.getUTCDay(), utcFirst(y!)),
  [WEEK + DAY]:   (d, y) => weekday(utcWeekNum(d), d.getUTCDay(), utcFirst(y!))
};

const utcInv: InverterRecord = {
  [QUARTER]: q => 3 * q,
  [WEEK]:    (w, y) => weekday(w, 0, utcFirst(y!))
};

export function utcFloor(units: TimeUnit[], step?: number): FloorFn {
  return floor(units, step || 1, utcGet, utcInv, utcDate);
}
