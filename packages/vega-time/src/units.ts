import {array, error, extend, hasOwnProperty} from 'vega-util';

export const YEAR = 'year';
export const QUARTER = 'quarter';
export const MONTH = 'month';
export const WEEK = 'week';
export const DATE = 'date';
export const DAY = 'day';
export const DAYOFYEAR = 'dayofyear';
export const HOURS = 'hours';
export const MINUTES = 'minutes';
export const SECONDS = 'seconds';
export const MILLISECONDS = 'milliseconds';

/** Time unit string literal type */
export type TimeUnit =
  | typeof YEAR
  | typeof QUARTER
  | typeof MONTH
  | typeof WEEK
  | typeof DATE
  | typeof DAY
  | typeof DAYOFYEAR
  | typeof HOURS
  | typeof MINUTES
  | typeof SECONDS
  | typeof MILLISECONDS;

export const TIME_UNITS: readonly TimeUnit[] = [
  YEAR,
  QUARTER,
  MONTH,
  WEEK,
  DATE,
  DAY,
  DAYOFYEAR,
  HOURS,
  MINUTES,
  SECONDS,
  MILLISECONDS
];

const UNITS: Record<TimeUnit, number> = TIME_UNITS.reduce(
  (o, u, i) => ((o[u] = 1 + i), o),
  {} as Record<TimeUnit, number>
);

/** Input type for time units - can be a single unit or array of units */
export type TimeUnitsInput = TimeUnit | readonly TimeUnit[];

export function timeUnits(units: TimeUnitsInput): TimeUnit[] {
  const u = array(units).slice() as TimeUnit[],
    m: Partial<Record<TimeUnit, number>> = {};

  // check validity
  if (!u.length) error('Missing time unit.');

  u.forEach((unit) => {
    if (hasOwnProperty(UNITS, unit)) {
      m[unit] = 1;
    } else {
      error(`Invalid time unit: ${unit}.`);
    }
  });

  const numTypes =
    (m[WEEK] || m[DAY] ? 1 : 0) +
    (m[QUARTER] || m[MONTH] || m[DATE] ? 1 : 0) +
    (m[DAYOFYEAR] ? 1 : 0);

  if (numTypes > 1) {
    error(`Incompatible time units: ${units}`);
  }

  // ensure proper sort order
  u.sort((a, b) => UNITS[a] - UNITS[b]);

  return u;
}

/** Format specifiers mapping time unit keys to format strings */
export type TimeUnitSpecifiers = Partial<Record<string, string>>;

const defaultSpecifiers: TimeUnitSpecifiers = {
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

export function timeUnitSpecifier(
  units: TimeUnitsInput,
  specifiers?: TimeUnitSpecifiers
): string {
  const s = extend({}, defaultSpecifiers, specifiers ?? {}) as TimeUnitSpecifiers,
    u = timeUnits(units),
    n = u.length;

  let fmt = '',
    start = 0,
    end: number,
    key: string;

  for (start = 0; start < n; ) {
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
