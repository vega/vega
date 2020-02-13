import {
  timeFormat as _timeFormat,
  utcFormat as _utcFormat
} from 'vega-time';

import {
  format as _numberFormat
} from 'd3-format';

import {
  timeParse as _timeParse,
  utcParse as _utcParse
} from 'd3-time-format';

const formatCache = {};

function formatter(type, method, specifier) {
  let k = type + ':' + specifier,
      e = formatCache[k];
  if (!e || e[0] !== method) {
    formatCache[k] = (e = [method, method(specifier)]);
  }
  return e[1];
}

export function format(_, specifier) {
  return formatter('format', _numberFormat, specifier)(_);
}

export function timeFormat(_, specifier) {
  return formatter('timeFormat', _timeFormat, specifier)(_);
}

export function utcFormat(_, specifier) {
  return formatter('utcFormat', _utcFormat, specifier)(_);
}

export function timeParse(_, specifier) {
  return formatter('timeParse', _timeParse, specifier)(_);
}

export function utcParse(_, specifier) {
  return formatter('utcParse', _utcParse, specifier)(_);
}

var dateObj = new Date(2000, 0, 1);

function time(month, day, specifier) {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return '';
  dateObj.setYear(2000);
  dateObj.setMonth(month);
  dateObj.setDate(day);
  return timeFormat(dateObj, specifier);
}

export function monthFormat(month) {
  return time(month, 1, '%B');
}

export function monthAbbrevFormat(month) {
  return time(month, 1, '%b');
}

export function dayFormat(day) {
  return time(0, 2 + day, '%A');
}

export function dayAbbrevFormat(day) {
  return time(0, 2 + day, '%a');
}
