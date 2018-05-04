import {Symbols, Discrete} from './legend-types';
import {Quantile, Quantize, Threshold, BinLinear, BinOrdinal} from './scale-types';
import {tickValues} from './ticks';
import {peek} from 'vega-util';

var symbols = {};
symbols[Quantile] = quantileSymbols;
symbols[Quantize] = quantizeSymbols;
symbols[Threshold] = thresholdSymbols;
symbols[BinLinear] = symbols[BinOrdinal] = binSymbols;

export function labelValues(scale, count) {
  var values = symbols[scale.type];
  return values ? values(scale) : tickValues(scale, count);
}

function quantizeSymbols(scale) {
  var domain = scale.domain(),
      x0 = domain[0],
      x1 = peek(domain),
      n = scale.range().length,
      values = new Array(n),
      i = 0;

  values[0] = -Infinity;
  while (++i < n) values[i] = (i * x1 - (i - n) * x0) / n;
  values.max = +Infinity;

  return values;
}

function quantileSymbols(scale) {
  var values = [-Infinity].concat(scale.quantiles());
  values.max = +Infinity;

  return values;
}

function thresholdSymbols(scale) {
  var values = [-Infinity].concat(scale.domain());
  values.max = +Infinity;

  return values;
}

function binSymbols(scale) {
  var values = scale.domain();
  values.max = values.pop();

  return values;
}

export function labelFormat(scale, format, type) {
  return type === Symbols && symbols[scale.type] ? formatRange(format)
    : type === Discrete ? formatDiscrete(format)
    : formatPoint(format);
}

function formatRange(format) {
  return function(value, index, array) {
    var limit = array[index + 1] || array.max || +Infinity,
        lo = formatValue(value, format),
        hi = formatValue(limit, format);
    return lo && hi ? lo + '\u2013' + hi : hi ? '< ' + hi : '\u2265 ' + lo;
  };
}

function formatDiscrete(format) {
  return function(value, index) {
    return index ? format(value) : null;
  }
}

function formatPoint(format) {
  return function(value) {
    return format(value);
  };
}

function formatValue(value, format) {
  return isFinite(value) ? format(value) : null;
}

export function labelFraction(scale) {
  var domain = scale.domain(),
      count = domain.length - 1,
      lo = +domain[0],
      hi = +peek(domain),
      span = hi - lo;

  if (scale.type === Threshold) {
    var adjust = count ? span / count : 0.1;
    lo -= adjust;
    hi += adjust;
    span = hi - lo;
  }

  return function(value) {
    return (value - lo) / span;
  };
}
