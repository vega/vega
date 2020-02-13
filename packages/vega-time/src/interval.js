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

import {
  timeMillisecond,
  timeMinute,
  timeSecond,
  timeHour,
  timeDay,
  timeWeek,
  timeMonth,
  timeYear,
  utcMillisecond,
  utcSecond,
  utcMinute,
  utcHour,
  utcDay,
  utcWeek,
  utcMonth,
  utcYear
} from 'd3-time';

const timeIntervals = {
  [YEAR]:         timeYear,
  [QUARTER]:      timeMonth.every(3),
  [MONTH]:        timeMonth,
  [WEEK]:         timeWeek,
  [DATE]:         timeDay,
  [DAY]:          timeDay,
  [HOURS]:        timeHour,
  [MINUTES]:      timeMinute,
  [SECONDS]:      timeSecond,
  [MILLISECONDS]: timeMillisecond
};

const utcIntervals = {
  [YEAR]:         utcYear,
  [QUARTER]:      utcMonth.every(3),
  [MONTH]:        utcMonth,
  [WEEK]:         utcWeek,
  [DATE]:         utcDay,
  [DAY]:          utcDay,
  [HOURS]:        utcHour,
  [MINUTES]:      utcMinute,
  [SECONDS]:      utcSecond,
  [MILLISECONDS]: utcMillisecond
};

export function timeInterval(unit) {
  return timeIntervals[unit];
}

export function utcInterval(unit) {
  return utcIntervals[unit];
}

function offset(ival, date, step) {
  return ival ? ival.offset(date, step) : undefined;
}

export function timeOffset(unit, date, step) {
  return offset(timeInterval(unit), date, step);
}

export function utcOffset(unit, date, step) {
  return offset(utcInterval(unit), date, step);
}

function sequence(ival, start, stop, step) {
  return ival ? ival.range(start, stop, step) : undefined;
}

export function timeSequence(unit, start, stop, step) {
  return sequence(timeInterval(unit), start, stop, step);
}

export function utcSequence(unit, start, stop, step) {
  return sequence(utcInterval(unit), start, stop, step);
}
