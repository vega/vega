import {
  YEAR, QUARTER, MONTH, WEEK, DATE, DAY,
  HOURS, MINUTES, SECONDS, MILLISECONDS,
  timeUnits
} from './units';

import {
  timeInterval,
  utcInterval
} from './interval';

import {
  timeFormat as d3_timeFormat,
  utcFormat as d3_utcFormat
} from 'd3-time-format';

import {error, extend, isObject, isString} from 'vega-util';

const defaultSpecifiers = {
  [YEAR]: '%Y ',
  [QUARTER]: 'Q%q ',
  [MONTH]: '%b ',
  [DATE]: '%d ',
  [WEEK]: 'W%U ',
  [DAY]: '%a ',
  [HOURS]: '%H:00',
  [MINUTES]: '00:%M',
  [SECONDS]: ':%S',
  [MILLISECONDS]: '.%L',
  [`${YEAR}-${MONTH}`]: '%Y-%m ',
  [`${YEAR}-${MONTH}-${DATE}`]: '%Y-%m-%d ',
  [`${HOURS}-${MINUTES}`]: '%H:%M'
}

export function timeUnitSpecifier(units, specifiers) {
  const s = extend({}, defaultSpecifiers, specifiers),
        u = timeUnits(units),
        n = u.length;

  let fmt = '', start = 0, end, key;

  for (start=0; start<n; ) {
    for (end=u.length; end > start; --end) {
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

export function timeFormat(specifier) {
  return formatter(d3_timeFormat, timeInterval, specifier);
}

export function utcFormat(specifier) {
  return formatter(d3_utcFormat, utcInterval, specifier);
}

function formatter(format, interval, specifier) {
  return isString(specifier)
    ? format(specifier)
    : multiFormat(format, interval, specifier);
}

function multiFormat(format, interval, spec) {
  spec = spec || {};
  if (!isObject(spec)) {
    error(`Invalid time multi-format specifier: ${spec}`);
  }

  const second = interval(SECONDS),
        minute = interval(MINUTES),
        hour = interval(HOURS),
        day = interval(DATE),
        week = interval(WEEK),
        month = interval(MONTH),
        quarter = interval(QUARTER),
        year = interval(YEAR),
        L = format(spec[MILLISECONDS] || '.%L'),
        S = format(spec[SECONDS] || ':%S'),
        M = format(spec[MINUTES] || '%I:%M'),
        H = format(spec[HOURS] || '%I %p'),
        d = format(spec[DATE] || spec[DAY] || '%a %d'),
        w = format(spec[WEEK] || '%b %d'),
        m = format(spec[MONTH] || '%B'),
        q = format(spec[QUARTER] || '%B'),
        y = format(spec[YEAR] || '%Y');

  return function(date) {
    return (second(date) < date ? L
      : minute(date) < date ? S
      : hour(date) < date ? M
      : day(date) < date ? H
      : month(date) < date ? (week(date) < date ? d : w)
      : year(date) < date ? (quarter(date) < date ? m : q)
      : y)(date);
  };
}
