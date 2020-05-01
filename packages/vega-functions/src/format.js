import {
  format as _format,
  timeFormat as _timeFormat,
  timeParse as _timeParse,
  utcFormat as _utcFormat,
  utcParse as _utcParse
} from 'vega-format';

const wrap = method => function(value, spec) {
  return method(spec)(value);
};

export const format = wrap(_format);
export const timeFormat = wrap(_timeFormat);
export const utcFormat = wrap(_utcFormat);
export const timeParse = wrap(_timeParse);
export const utcParse = wrap(_utcParse);

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
