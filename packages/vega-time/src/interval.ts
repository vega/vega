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
  timeDay,
  timeHour,
  timeMillisecond,
  timeMinute,
  timeMonth,
  timeSecond,
  timeWeek,
  timeYear,
  utcDay,
  utcHour,
  utcMillisecond,
  utcMinute,
  utcMonth,
  utcSecond,
  utcWeek,
  utcYear
} from 'd3-time';

/** Interface for d3-time interval objects */
export interface TimeInterval {
  (date?: Date | number): Date;
  floor(date: Date | number): Date;
  ceil(date: Date | number): Date;
  round(date: Date | number): Date;
  offset(date: Date | number, step?: number): Date;
  range(start: Date | number, stop: Date | number, step?: number): Date[];
  filter(test: (date: Date) => boolean): TimeInterval;
  count?(start: Date | number, end: Date | number): number;
  every?(step: number): TimeInterval | null;
}

const timeIntervals: Record<TimeUnit, TimeInterval | null> = {
  [YEAR]:         timeYear as TimeInterval,
  [QUARTER]:      timeMonth.every(3) as TimeInterval | null,
  [MONTH]:        timeMonth as TimeInterval,
  [WEEK]:         timeWeek as TimeInterval,
  [DATE]:         timeDay as TimeInterval,
  [DAY]:          timeDay as TimeInterval,
  [DAYOFYEAR]:    timeDay as TimeInterval,
  [HOURS]:        timeHour as TimeInterval,
  [MINUTES]:      timeMinute as TimeInterval,
  [SECONDS]:      timeSecond as TimeInterval,
  [MILLISECONDS]: timeMillisecond as TimeInterval
};

const utcIntervals: Record<TimeUnit, TimeInterval | null> = {
  [YEAR]:         utcYear as TimeInterval,
  [QUARTER]:      utcMonth.every(3) as TimeInterval | null,
  [MONTH]:        utcMonth as TimeInterval,
  [WEEK]:         utcWeek as TimeInterval,
  [DATE]:         utcDay as TimeInterval,
  [DAY]:          utcDay as TimeInterval,
  [DAYOFYEAR]:    utcDay as TimeInterval,
  [HOURS]:        utcHour as TimeInterval,
  [MINUTES]:      utcMinute as TimeInterval,
  [SECONDS]:      utcSecond as TimeInterval,
  [MILLISECONDS]: utcMillisecond as TimeInterval
};

export function timeInterval(unit: TimeUnit): TimeInterval | null | undefined {
  return timeIntervals[unit];
}

export function utcInterval(unit: TimeUnit): TimeInterval | null | undefined {
  return utcIntervals[unit];
}

function offset(ival: TimeInterval | null | undefined, date: Date | number, step?: number): Date | undefined {
  return ival ? ival.offset(date, step) : undefined;
}

export function timeOffset(unit: TimeUnit, date: Date | number, step?: number): Date | undefined {
  return offset(timeInterval(unit), date, step);
}

export function utcOffset(unit: TimeUnit, date: Date | number, step?: number): Date | undefined {
  return offset(utcInterval(unit), date, step);
}

function sequence(ival: TimeInterval | null | undefined, start: Date | number, stop: Date | number, step?: number): Date[] | undefined {
  return ival ? ival.range(start, stop, step) : undefined;
}

export function timeSequence(unit: TimeUnit, start: Date | number, stop: Date | number, step?: number): Date[] | undefined {
  return sequence(timeInterval(unit), start, stop, step);
}

export function utcSequence(unit: TimeUnit, start: Date | number, stop: Date | number, step?: number): Date[] | undefined {
  return sequence(utcInterval(unit), start, stop, step);
}
