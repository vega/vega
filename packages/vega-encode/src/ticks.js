import {Log} from './scale-types';

import {
  format as numberFormat,
  formatSpecifier
} from 'd3-format';

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
  return scale.ticks ? scale.ticks(count) : scale.domain();
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
 * @param {string} [specifier] - The format specifier. Must be a legal d3 4.0
 *   specifier string (see https://github.com/d3/d3-format#formatSpecifier).
 * @return {function(*):string} - The generated label formatter.
 */
export function tickFormat(scale, count, specifier) {
  var format = scale.tickFormat
    ? scale.tickFormat(count, specifier)
    : String;

  return (scale.type === Log)
    ? filter(format, variablePrecision(specifier))
    : format;
}

function filter(sourceFormat, targetFormat) {
  return function(_) {
    return sourceFormat(_) ? targetFormat(_) : '';
  };
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
