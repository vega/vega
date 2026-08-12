import {timeDay, timeMonday, timeWeek, utcDay, utcMonday, utcWeek} from 'd3-time';

const t0 = new Date;

function localYear(y) {
  t0.setFullYear(y);
  t0.setMonth(0);
  t0.setDate(1);
  t0.setHours(0, 0, 0, 0);
  return t0;
}

export function dayofyear(d) {
  return localDayOfYear(new Date(d));
}

export function week(d) {
  return localWeekNum(new Date(d));
}

export function isoweek(d) {
  return localISOWeekNum(new Date(d));
}

export function localDayOfYear(d) {
  return timeDay.count(localYear(d.getFullYear()) - 1, d);
}

export function localWeekNum(d) {
  return timeWeek.count(localYear(d.getFullYear()) - 1, d);
}

export function localISOWeekYear(d) {
  return timeDay.offset(timeMonday.floor(d), 3).getFullYear();
}

export function localISOWeekNum(d) {
  return 1 + timeMonday.count(localISOWeekOne(localISOWeekYear(d)), d);
}

// The Monday on which week 1 of the given week-numbering year begins.
function localISOWeekOne(y) {
  return timeMonday.floor(timeDay.offset(localYear(y), 3));
}

// The day of January on which week 1 of the given week-numbering year begins. Values of zero or
// less refer to the preceding December, which localDate rolls over for us.
export function localISOWeekOneDate(y) {
  const d = localISOWeekOne(y);
  return d.getMonth() ? d.getDate() - 31 : d.getDate();
}

export function localFirst(y) {
  return localYear(y).getDay();
}

export function localDate(y, m, d, H, M, S, L) {
  if (0 <= y && y < 100) {
    const date = new Date(-1, m, d, H, M, S, L);
    date.setFullYear(y);
    return date;
  }
  return new Date(y, m, d, H, M, S, L);
}

export function utcdayofyear(d) {
  return utcDayOfYear(new Date(d));
}

export function utcweek(d) {
  return utcWeekNum(new Date(d));
}

export function utcisoweek(d) {
  return utcISOWeekNum(new Date(d));
}

export function utcDayOfYear(d) {
  const y = Date.UTC(d.getUTCFullYear(), 0, 1);
  return utcDay.count(y - 1, d);
}

export function utcWeekNum(d) {
  const y = Date.UTC(d.getUTCFullYear(), 0, 1);
  return utcWeek.count(y - 1, d);
}

export function utcISOWeekYear(d) {
  return utcDay.offset(utcMonday.floor(d), 3).getUTCFullYear();
}

export function utcISOWeekNum(d) {
  return 1 + utcMonday.count(utcISOWeekOne(utcISOWeekYear(d)), d);
}

function utcISOWeekOne(y) {
  return utcMonday.floor(utcDay.offset(Date.UTC(y, 0, 1), 3));
}

export function utcISOWeekOneDate(y) {
  const d = utcISOWeekOne(y);
  return d.getUTCMonth() ? d.getUTCDate() - 31 : d.getUTCDate();
}

export function utcFirst(y) {
  t0.setTime(Date.UTC(y, 0, 1));
  return t0.getUTCDay();
}

export function utcDate(y, m, d, H, M, S, L) {
  if (0 <= y && y < 100) {
    const date = new Date(Date.UTC(-1, m, d, H, M, S, L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(y, m, d, H, M, S, L));
}
