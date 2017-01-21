import {Transform, ingest} from 'vega-dataflow';
import {scaleFraction} from 'vega-scale';
import {constant, inherits, isFunction, peek} from 'vega-util';
import {labelValues, labelFormat} from './labels';
import {tickFormat} from './ticks';

/**
 * Generates legend entries for visualizing a scale.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Scale} params.scale - The scale to generate items for.
 * @param {*} [params.count=10] - The approximate number of items, or
 *   desired tick interval, to use.
 * @param {Array<*>} [params.values] - The exact tick values to use.
 *   These must be legal domain values for the provided scale.
 *   If provided, the count argument is ignored.
 * @param {function(*):string} [params.formatSpecifier] - A format specifier
 *   to use in conjunction with scale.tickFormat. Legal values are
 *   any valid d3 4.0 format specifier.
 * @param {function(*):string} [params.format] - The format function to use.
 *   If provided, the formatSpecifier argument is ignored.
 */
export default function LegendEntries(params) {
  Transform.call(this, [], params);
}

var prototype = inherits(LegendEntries, Transform);

prototype.transform = function(_, pulse) {
  if (this.value != null && !_.modified()) {
    return pulse.StopPropagation;
  }

  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      total = 0,
      items = this.value,
      grad  = _.type === 'gradient',
      scale = _.scale,
      count = _.count == null ? 5 : _.count,
      format = _.format || tickFormat(scale, count, _.formatSpecifier),
      values = _.values || labelValues(scale, count, grad);

  format = labelFormat(scale, format);
  if (items) out.rem = items;

  if (grad) {
    var domain = _.values ? scale.domain() : values,
        fraction = scaleFraction(scale, domain[0], peek(domain));
  } else {
    var size = _.size,
        offset;
    if (isFunction(size)) {
      // if first value maps to size zero, remove from list (vega#717)
      if (!_.values && scale(values[0]) === 0) {
        values = values.slice(1);
      }
      // compute size offset for legend entries
      offset = values.reduce(function(max, value) {
        return Math.max(max, size(value, _));
      }, 0);
    } else {
      size = constant(offset = size || 8);
    }
  }

  items = values.map(function(value, index) {
    var t = ingest({
      index: index,
      label: format(value, index, values),
      value: value
    });

    if (grad) {
      t.perc = fraction(value);
    } else {
      t.offset = offset;
      t.size = size(value, _);
      t.total = Math.round(total);
      total += t.size;
    }
    return t;
  });

  return (out.source = out.add = this.value = items), out;
};
