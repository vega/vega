import {YEAR, QUARTER, MONTH, WEEK, DATE, DAY, HOURS, MINUTES, SECONDS, MILLISECONDS, timeUnits} from './units';

import {timeInterval, utcInterval} from './interval';

import {timeFormat as d3_timeFormat, utcFormat as d3_utcFormat} from 'd3-time-format';

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
};

export function timeUnitSpecifier(units, specifiers) {
  const s = extend({}, defaultSpecifiers, specifiers);
  const u = timeUnits(units);
  const n = u.length;

  let fmt = '';
  let start = 0;
  let end;
  let key;

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

export function timeFormat(specifier) {
  return formatter(d3_timeFormat, timeInterval, specifier);
}

export function utcFormat(specifier) {
  return formatter(d3_utcFormat, utcInterval, specifier);
}

function formatter(format, interval, specifier) {
  return isString(specifier) ? format(specifier) : multiFormat(format, interval, specifier);
}

function multiFormat(format, interval, spec) {
  spec = spec || {};
  if (!isObject(spec)) {
    error(`Invalid time multi-format specifier: ${spec}`);
  }

  const second = interval(SECONDS);
  const minute = interval(MINUTES);
  const hour = interval(HOURS);
  const day = interval(DATE);
  const week = interval(WEEK);
  const month = interval(MONTH);
  const quarter = interval(QUARTER);
  const year = interval(YEAR);
  const L = format(spec[MILLISECONDS] || '.%L');
  const S = format(spec[SECONDS] || ':%S');
  const M = format(spec[MINUTES] || '%I:%M');
  const H = format(spec[HOURS] || '%I %p');
  const d = format(spec[DATE] || spec[DAY] || '%a %d');
  const w = format(spec[WEEK] || '%b %d');
  const m = format(spec[MONTH] || '%B');
  const q = format(spec[QUARTER] || '%B');
  const y = format(spec[YEAR] || '%Y');

  return function (date) {
    return (second(date) < date
      ? L
      : minute(date) < date
      ? S
      : hour(date) < date
      ? M
      : day(date) < date
      ? H
      : month(date) < date
      ? week(date) < date
        ? d
        : w
      : year(date) < date
      ? quarter(date) < date
        ? m
        : q
      : y)(date);
  };
}
