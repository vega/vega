import { tickStep } from 'd3-array';
import { formatSpecifier, precisionFixed, precisionRound, precisionPrefix, format, formatPrefix, formatLocale } from 'd3-format';
import { SECONDS, MINUTES, HOURS, DATE, WEEK, MONTH, QUARTER, YEAR, MILLISECONDS, DAY, timeInterval, utcInterval } from 'vega-time';
import { isString, isObject, error, extend } from 'vega-util';
import { timeFormat, timeParse, utcFormat, utcParse, timeFormatLocale as timeFormatLocale$1 } from 'd3-time-format';

function memoize (method) {
  const cache = {};
  return spec => cache[spec] || (cache[spec] = method(spec));
}

function trimZeroes(numberFormat, decimalChar) {
  return x => {
    const str = numberFormat(x),
      dec = str.indexOf(decimalChar);
    if (dec < 0) return str;
    let idx = rightmostDigit(str, dec);
    const end = idx < str.length ? str.slice(idx) : '';
    while (--idx > dec) if (str[idx] !== '0') {
      ++idx;
      break;
    }
    return str.slice(0, idx) + end;
  };
}
function rightmostDigit(str, dec) {
  let i = str.lastIndexOf('e'),
    c;
  if (i > 0) return i;
  for (i = str.length; --i > dec;) {
    c = str.charCodeAt(i);
    if (c >= 48 && c <= 57) return i + 1; // is digit
  }
}

function numberLocale(locale) {
  const format = memoize(locale.format),
    formatPrefix = locale.formatPrefix;
  return {
    format,
    formatPrefix,
    formatFloat(spec) {
      const s = formatSpecifier(spec || ',');
      if (s.precision == null) {
        s.precision = 12;
        switch (s.type) {
          case '%':
            s.precision -= 2;
            break;
          case 'e':
            s.precision -= 1;
            break;
        }
        return trimZeroes(format(s),
        // number format
        format('.1f')(1)[1] // decimal point character
        );
      } else {
        return format(s);
      }
    },
    formatSpan(start, stop, count, specifier) {
      specifier = formatSpecifier(specifier == null ? ',f' : specifier);
      const step = tickStep(start, stop, count),
        value = Math.max(Math.abs(start), Math.abs(stop));
      let precision;
      if (specifier.precision == null) {
        switch (specifier.type) {
          case 's':
            {
              if (!isNaN(precision = precisionPrefix(step, value))) {
                specifier.precision = precision;
              }
              return formatPrefix(specifier, value);
            }
          case '':
          case 'e':
          case 'g':
          case 'p':
          case 'r':
            {
              if (!isNaN(precision = precisionRound(step, value))) {
                specifier.precision = precision - (specifier.type === 'e');
              }
              break;
            }
          case 'f':
          case '%':
            {
              if (!isNaN(precision = precisionFixed(step))) {
                specifier.precision = precision - (specifier.type === '%') * 2;
              }
              break;
            }
        }
      }
      return format(specifier);
    }
  };
}
let defaultNumberLocale;
resetNumberFormatDefaultLocale();
function resetNumberFormatDefaultLocale() {
  return defaultNumberLocale = numberLocale({
    format: format,
    formatPrefix: formatPrefix
  });
}
function numberFormatLocale(definition) {
  return numberLocale(formatLocale(definition));
}
function numberFormatDefaultLocale(definition) {
  return arguments.length ? defaultNumberLocale = numberFormatLocale(definition) : defaultNumberLocale;
}

function timeMultiFormat(format, interval, spec) {
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
  return date => (second(date) < date ? L : minute(date) < date ? S : hour(date) < date ? M : day(date) < date ? H : month(date) < date ? week(date) < date ? d : w : year(date) < date ? quarter(date) < date ? m : q : y)(date);
}
function timeLocale(locale) {
  const timeFormat = memoize(locale.format),
    utcFormat = memoize(locale.utcFormat);
  return {
    timeFormat: spec => isString(spec) ? timeFormat(spec) : timeMultiFormat(timeFormat, timeInterval, spec),
    utcFormat: spec => isString(spec) ? utcFormat(spec) : timeMultiFormat(utcFormat, utcInterval, spec),
    timeParse: memoize(locale.parse),
    utcParse: memoize(locale.utcParse)
  };
}
let defaultTimeLocale;
resetTimeFormatDefaultLocale();
function resetTimeFormatDefaultLocale() {
  return defaultTimeLocale = timeLocale({
    format: timeFormat,
    parse: timeParse,
    utcFormat: utcFormat,
    utcParse: utcParse
  });
}
function timeFormatLocale(definition) {
  return timeLocale(timeFormatLocale$1(definition));
}
function timeFormatDefaultLocale(definition) {
  return arguments.length ? defaultTimeLocale = timeFormatLocale(definition) : defaultTimeLocale;
}

const createLocale = (number, time) => extend({}, number, time);
function locale(numberSpec, timeSpec) {
  const number = numberSpec ? numberFormatLocale(numberSpec) : numberFormatDefaultLocale();
  const time = timeSpec ? timeFormatLocale(timeSpec) : timeFormatDefaultLocale();
  return createLocale(number, time);
}
function defaultLocale(numberSpec, timeSpec) {
  const args = arguments.length;
  if (args && args !== 2) {
    error('defaultLocale expects either zero or two arguments.');
  }
  return args ? createLocale(numberFormatDefaultLocale(numberSpec), timeFormatDefaultLocale(timeSpec)) : createLocale(numberFormatDefaultLocale(), timeFormatDefaultLocale());
}
function resetDefaultLocale() {
  resetNumberFormatDefaultLocale();
  resetTimeFormatDefaultLocale();
  return defaultLocale();
}

export { defaultLocale, locale, numberFormatDefaultLocale, numberFormatLocale, resetDefaultLocale, resetNumberFormatDefaultLocale, resetTimeFormatDefaultLocale, timeFormatDefaultLocale, timeFormatLocale };
