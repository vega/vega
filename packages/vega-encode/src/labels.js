import {Symbols, Discrete} from './legend-types';
import {tickFormat, tickValues} from './ticks';

import {
  Quantile,
  Quantize,
  Threshold,
  tickFormat as spanFormat,
  Time
} from 'vega-scale';
import {peek} from 'vega-util';

const symbols = {
  [Quantile]:  'quantiles',
  [Quantize]:  'thresholds',
  [Threshold]: 'domain'
};

const formats = {
  [Quantile]:  'quantiles',
  [Quantize]:  'domain'
};

export function labelValues(scale, count) {
  return scale.bins ? binValues(scale.bins)
    : symbols[scale.type] ? thresholdValues(scale[symbols[scale.type]]())
    : tickValues(scale, count);
}

export function thresholdFormat(scale, specifier) {
  var _ = scale[formats[scale.type]](),
      n = _.length,
      d = n > 1 ? _[1] - _[0] : _[0], i;

  for (i=1; i<n; ++i) {
    d = Math.min(d, _[i] - _[i-1]);
  }

  // 3 ticks times 10 for increased resolution
  return spanFormat(0, d, 3 * 10, specifier);
}

function thresholdValues(thresholds) {
  const values = [-Infinity].concat(thresholds);
  values.max = +Infinity;

  return values;
}

function binValues(bins) {
  const values = bins.slice(0, -1);
  values.max = peek(bins);

  return values;
}

function isDiscreteRange(scale) {
  return symbols[scale.type] || scale.bins;
}

export function labelFormat(scale, count, type, specifier, formatType) {
  const format = formats[scale.type] && formatType !== Time
    ? thresholdFormat(scale, specifier)
    : tickFormat(scale, count, specifier, formatType);

  return type === Symbols && isDiscreteRange(scale) ? formatRange(format)
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
