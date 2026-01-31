import {timeDay, timeWeek, utcDay, utcWeek} from 'd3-time';

const t0 = new Date;

function localYear(y: number): Date {
  t0.setFullYear(y);
  t0.setMonth(0);
  t0.setDate(1);
  t0.setHours(0, 0, 0, 0);
  return t0;
}

export function dayofyear(d: Date): number {
  return localDayOfYear(new Date(d));
}

export function week(d: Date): number {
  return localWeekNum(new Date(d));
}

export function localDayOfYear(d: Date): number {
  return timeDay.count(new Date(+localYear(d.getFullYear()) - 1), d);
}

export function localWeekNum(d: Date): number {
  return timeWeek.count(new Date(+localYear(d.getFullYear()) - 1), d);
}

export function localFirst(y: number): number {
  return localYear(y).getDay();
}

export function localDate(y: number, m: number, d: number, H: number, M: number, S: number, L: number): Date {
  if (0 <= y && y < 100) {
    const date = new Date(-1, m, d, H, M, S, L);
    date.setFullYear(y);
    return date;
  }
  return new Date(y, m, d, H, M, S, L);
}

export function utcdayofyear(d: Date): number {
  return utcDayOfYear(new Date(d));
}

export function utcweek(d: Date): number {
  return utcWeekNum(new Date(d));
}

export function utcDayOfYear(d: Date): number {
  const y = Date.UTC(d.getUTCFullYear(), 0, 1);
  return utcDay.count(new Date(y - 1), d);
}

export function utcWeekNum(d: Date): number {
  const y = Date.UTC(d.getUTCFullYear(), 0, 1);
  return utcWeek.count(new Date(y - 1), d);
}

export function utcFirst(y: number): number {
  t0.setTime(Date.UTC(y, 0, 1));
  return t0.getUTCDay();
}

export function utcDate(y: number, m: number, d: number, H: number, M: number, S: number, L: number): Date {
  if (0 <= y && y < 100) {
    const date = new Date(Date.UTC(-1, m, d, H, M, S, L));
    date.setUTCFullYear(d);
    return date;
  }
  return new Date(Date.UTC(y, m, d, H, M, S, L));
}
