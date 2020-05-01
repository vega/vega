import {tickStep} from 'd3-array';
import {
  format as d3_format,
  formatLocale as d3_formatLocale,
  formatPrefix as d3_formatPrefix,
  formatSpecifier,
  precisionFixed,
  precisionPrefix,
  precisionRound
} from 'd3-format';

function trimZeroes(numberFormat, decimalChar) {
  return x => {
    var str = numberFormat(x),
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

export function numberLocale(locale) {
  const _format = locale.format,
        _prefix = locale.formatPrefix,
        _cache = {};

  const format = spec =>
    _cache[spec] || (_cache[spec] = _format(spec));

  const prefix = (spec, value) => {
    const key = spec + ':>' + value;
    return _cache[key] || (_cache[key] = _prefix(spec, value));
  };

  return {
    format,
    prefix,
    variable(spec) {
      var s = formatSpecifier(spec || ',');
      if (s.precision == null) {
        s.precision = 12;
        switch (s.type) {
          case '%': s.precision -= 2; break;
          case 'e': s.precision -= 1; break;
        }
        return trimZeroes(
          format(s),          // number format
          format('.1f')(1)[1] // decimal point character
        );
      } else {
        return format(s);
      }
    },
    span(start, stop, count, specifier) {
      var step = tickStep(start, stop, count),
          precision;
      specifier = formatSpecifier(specifier == null ? ',f' : specifier);
      switch (specifier.type) {
        case 's': {
          var value = Math.max(Math.abs(start), Math.abs(stop));
          if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
          return prefix(specifier, value);
        }
        case '':
        case 'e':
        case 'g':
        case 'p':
        case 'r': {
          if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === 'e');
          break;
        }
        case 'f':
        case '%': {
          if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === '%') * 2;
          break;
        }
      }
      return format(specifier);
    }
  };
}

let defaultNumberLocale = numberLocale({
  format: d3_format,
  formatPrefix: d3_formatPrefix
});

export function formatLocale(definition) {
  return arguments.length
    ? defaultNumberLocale
    : (defaultNumberLocale = numberLocale(d3_formatLocale(definition)));
}

export const format = spec =>
  defaultNumberLocale.format(spec);

export const formatPrefix = (spec, value) =>
  defaultNumberLocale.prefix(spec, value);

export const formatVariablePrecision = (spec) =>
  defaultNumberLocale.variable(spec);

export const formatSpan = (start, stop, count, spec) =>
  defaultNumberLocale.span(start, stop, count, spec);
