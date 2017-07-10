import {format as d3_format} from 'd3-format';
import {
  timeFormat as d3_timeFormat,
  timeParse as d3_timeParse,
  utcFormat as d3_utcFormat,
  utcParse as d3_utcParse
} from 'd3-time-format';

var formatCache = {};

function formatter(type, method, specifier) {
  var k = type + ':' + specifier,
      e = formatCache[k];
  if (!e || e[0] !== method) {
    formatCache[k] = (e = [method, method(specifier)]);
  }
  return e[1];
}

export function format(_, specifier) {
  return formatter('format', d3_format, specifier)(_);
}

export function timeFormat(_, specifier) {
  return formatter('timeFormat', d3_timeFormat, specifier)(_);
}

export function utcFormat(_, specifier) {
  return formatter('utcFormat', d3_utcFormat, specifier)(_);
}

export function timeParse(_, specifier) {
  return formatter('timeParse', d3_timeParse, specifier)(_);
}

export function utcParse(_, specifier) {
  return formatter('utcParse', d3_utcParse, specifier)(_);
}

var dateObj = new Date(2000, 0, 1);

function time(month, day, specifier) {
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
