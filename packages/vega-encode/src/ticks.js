import {isLogarithmic, Time, UTC} from 'vega-scale';
import {timeFormat, timeInterval, utcFormat, utcInterval} from 'vega-time';
import {error, isNumber, isObject, isString, peek, span} from 'vega-util';
import {format as numberFormat, formatSpecifier} from 'd3-format';

/**
 * Determine the tick count or interval function.
 * @param {Scale} scale - The scale for which to generate tick values.
 * @param {*} count - The desired tick count or interval specifier.
 * @param {number} minStep - The desired minimum step between tick values.
 * @return {*} - The tick count or interval function.
 */
export function tickCount(scale, count, minStep) {
  var step;

  if (isNumber(count)) {
    if (scale.bins) {
      count = Math.max(count, scale.bins.length);
    }
    if (minStep != null) {
      count = Math.min(count, ~~(span(scale.domain()) / minStep) || 1);
    }
  }

  if (isObject(count)) {
    step = count.step;
    count = count.interval;
  }

  if (isString(count)) {
    count = scale.type === Time ? timeInterval(count)
      : scale.type == UTC ? utcInterval(count)
      : error('Only time and utc scales accept interval strings.');
    if (step) count = count.every(step);
  }

  return count;
}

/**
 * Filter a set of candidate tick values, ensuring that only tick values
 * that lie within the scale range are included.
 * @param {Scale} scale - The scale for which to generate tick values.
 * @param {Array<*>} ticks - The candidate tick values.
 * @param {*} count - The tick count or interval function.
 * @return {Array<*>} - The filtered tick values.
 */
export function validTicks(scale, ticks, count) {
  var range = scale.range(),
      lo = Math.floor(range[0]),
      hi = Math.ceil(peek(range));

  if (lo > hi) {
    range = hi;
    hi = lo;
    lo = range;
  }

  ticks = ticks.filter(function(v) {
    v = scale(v);
    return lo <= v && v <= hi;
  });

  if (count > 0 && ticks.length > 1) {
    var endpoints = [ticks[0], peek(ticks)];
    while (ticks.length > count && ticks.length >= 3) {
      ticks = ticks.filter(function(_, i) { return !(i % 2); });
    }
    if (ticks.length < 3) {
      ticks = endpoints;
    }
  }

  return ticks;
}

/**
 * Generate tick values for the given scale and approximate tick count or
 * interval value. If the scale has a 'ticks' method, it will be used to
 * generate the ticks, with the count argument passed as a parameter. If the
 * scale lacks a 'ticks' method, the full scale domain will be returned.
 * @param {Scale} scale - The scale for which to generate tick values.
 * @param {*} [count] - The approximate number of desired ticks.
 * @return {Array<*>} - The generated tick values.
 */
export function tickValues(scale, count) {
  return scale.bins ? validTicks(scale, scale.bins)
    : scale.ticks ? scale.ticks(count)
    : scale.domain();
}

/**
 * Generate a label format function for a scale. If the scale has a
 * 'tickFormat' method, it will be used to generate the formatter, with the
 * count and specifier arguments passed as parameters. If the scale lacks a
 * 'tickFormat' method, the returned formatter performs simple string coercion.
 * If the input scale is a logarithmic scale and the format specifier does not
 * indicate a desired decimal precision, a special variable precision formatter
 * that automatically trims trailing zeroes will be generated.
 * @param {Scale} scale - The scale for which to generate the label formatter.
 * @param {*} [count] - The approximate number of desired ticks.
 * @param {string} [specifier] - The format specifier. Must be a legal d3
 *   specifier string (see https://github.com/d3/d3-format#formatSpecifier) or
 *   time multi-format specifier object.
 * @return {function(*):string} - The generated label formatter.
 */
export function tickFormat(scale, count, specifier, formatType, noSkip) {
  var type = scale.type,
      format = (type === Time || formatType === Time) ? timeFormat(specifier)
        : (type === UTC || formatType === UTC) ? utcFormat(specifier)
        : scale.tickFormat ? scale.tickFormat(count, specifier)
        : specifier ? numberFormat(specifier)
        : String;

  if (isLogarithmic(type)) {
    var logfmt = variablePrecision(specifier);
    format = noSkip || scale.bins ? logfmt : filter(format, logfmt);
  }

  return format;
}

function filter(sourceFormat, targetFormat) {
  return _ => sourceFormat(_) ? targetFormat(_) : '';
}

function variablePrecision(specifier) {
  var s = formatSpecifier(specifier || ',');

  if (s.precision == null) {
    s.precision = 12;
    switch (s.type) {
      case '%': s.precision -= 2; break;
      case 'e': s.precision -= 1; break;
    }
    return trimZeroes(
      numberFormat(s),          // number format
      numberFormat('.1f')(1)[1] // decimal point character
    );
  } else {
    return numberFormat(s);
  }
}

function trimZeroes(format, decimalChar) {
  return function(x) {
    var str = format(x),
        dec = str.indexOf(decimalChar),
        idx, end;

    if (dec < 0) return str;

    idx = rightmostDigit(str, dec);
    end = idx < str.length ? str.slice(idx) : '';
    while (--idx > dec) if (str[idx] !== '0') { ++idx; break; }

    return str.slice(0, idx) + end;
  };
}

function rightmostDigit(str, dec) {
  var i = str.lastIndexOf('e'), c;
  if (i > 0) return i;
  for (i=str.length; --i > dec;) {
    c = str.charCodeAt(i);
    if (c >= 48 && c <= 57) return i + 1; // is digit
  }
}
