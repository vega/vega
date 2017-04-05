import {format as d3_format} from 'd3-format';
import {
  timeFormat as d3_timeFormat,
  timeParse as d3_timeParse,
  utcFormat as d3_utcFormat,
  utcParse as d3_utcParse
} from 'd3-time-format';

function formatter(method) {
  var cache = {};
  return function(_, specifier) {
    var f = cache[specifier] || (cache[specifier] = method(specifier));
    return f(_);
  };
}

export var format = formatter(d3_format);
export var utcFormat = formatter(d3_utcFormat);
export var timeFormat = formatter(d3_timeFormat);

export var utcParse = formatter(d3_utcParse);
export var timeParse = formatter(d3_timeParse);

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
