import {array, error, hasOwnProperty} from 'vega-util';

export const YEAR = 'year';
export const QUARTER = 'quarter';
export const MONTH = 'month';
export const WEEK = 'week';
export const DATE = 'date';
export const DAY = 'day';
export const HOURS = 'hours';
export const MINUTES = 'minutes';
export const SECONDS = 'seconds';
export const MILLISECONDS = 'milliseconds';

const UNITS = [
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
].reduce((o, u, i) => (o[u] = 1 + i, o), {});

export function timeUnits(units) {
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

  if ((m[WEEK] || m[DAY]) && (m[QUARTER] || m[MONTH] || m[DATE])) {
    error(`Incompatible time units: ${units}`);
  }

  // ensure proper sort order
  u.sort((a, b) => UNITS[a] - UNITS[b]);

  return u;
}
