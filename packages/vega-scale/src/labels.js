import {DiscreteLegend, SymbolLegend} from './legend-types';
import {Log, Quantile, Quantize, Threshold, Time, UTC} from './scales/types';
import {tickFormat, tickLog, tickValues} from './ticks';
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
    : scale.type === Log ? tickLog(scale, count, true)
    : symbols[scale.type] ? thresholdValues(scale[symbols[scale.type]]())
    : tickValues(scale, count);
}

export function thresholdFormat(locale, scale, specifier) {
  const _ = scale[formats[scale.type]](),
        n = _.length;

  let d = n > 1 ? _[1] - _[0] : _[0], i;

  for (i=1; i<n; ++i) {
    d = Math.min(d, _[i] - _[i-1]);
  }

  // tickCount = 3 ticks times 10 for increased resolution
  return locale.formatSpan(0, d, 3 * 10, specifier);
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

const isDiscreteRange = scale =>
  symbols[scale.type] || scale.bins;

export function labelFormat(locale, scale, count, type, specifier, formatType, noSkip) {
  const format = formats[scale.type] && formatType !== Time && formatType !== UTC
    ? thresholdFormat(locale, scale, specifier)
    : tickFormat(locale, scale, count, specifier, formatType, noSkip);

  return type === SymbolLegend && isDiscreteRange(scale) ? formatRange(format)
    : type === DiscreteLegend ? formatDiscrete(format)
    : formatPoint(format);
}

const formatRange = format =>
  (value, index, array) => {
    const limit = get(array[index + 1], get(array.max, +Infinity)),
          lo = formatValue(value, format),
          hi = formatValue(limit, format);
    return lo && hi ? lo + ' \u2013 ' + hi : hi ? '< ' + hi : '\u2265 ' + lo;
  };

const get = (value, dflt) =>
  value != null ? value : dflt;

const formatDiscrete = format =>
  (value, index) => index ? format(value) : null;

const formatPoint = format =>
  value => format(value);

const formatValue = (value, format) =>
  Number.isFinite(value) ? format(value) : null;

export function labelFraction(scale) {
  const domain = scale.domain(),
        count = domain.length - 1;

  let lo = +domain[0],
      hi = +peek(domain),
      span = hi - lo;

  if (scale.type === Threshold) {
    const adjust = count ? span / count : 0.1;
    lo -= adjust;
    hi += adjust;
    span = hi - lo;
  }

  return value => (value - lo) / span;
}
