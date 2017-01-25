import {Quantile, Quantize, Threshold, BinLinear, BinOrdinal} from './scale-types';
import {tickValues} from './ticks';
import {peek} from 'vega-util';

var discrete = {}
discrete[Quantile] = quantile;
discrete[Quantize] = quantize;
discrete[Threshold] = threshold;
discrete[BinLinear] = bin;
discrete[BinOrdinal] = bin;

export function labelValues(scale, count, gradient) {
  if (gradient) return scale.domain();
  var values = discrete[scale.type];
  return values ? values(scale) : tickValues(scale, count);
}

function quantize(scale) {
  var domain = scale.domain(),
      x0 = domain[0],
      x1 = peek(domain),
      n = scale.range().length,
      values = new Array(n),
      i = 0;

  values[0] = x0;
  while (++i < n) values[i] = (i * x1 - (i - n) * x0) / n;
  return values.max = x1, values;
}

function quantile(scale) {
  var domain = scale.domain(),
      values = [domain[0]].concat(scale.quantiles());
  return values.max = peek(domain), values;
}

function threshold(scale) {
  var values = [-Infinity].concat(scale.domain());
  return values.max = +Infinity, values;
}

function bin(scale) {
  var values = scale.domain();
  return values.max = values.pop(), values;
}

export function labelFormat(scale, format) {
  return discrete[scale.type] ? formatRange(format) : formatPoint(format);
}

function formatRange(format) {
  return function(value, index, array) {
    var limit = array[index + 1] || array.max || +Infinity,
        lo = formatValue(value, format),
        hi = formatValue(limit, format);
    return lo && hi ? lo + '\u2013' + hi : hi ? '< ' + hi : '\u2265 ' + lo;
  };
}

function formatValue(value, format) {
  return isFinite(value) ? format(value) : null;
}

function formatPoint(format) {
  return function(value) {
    return format(value);
  };
}
