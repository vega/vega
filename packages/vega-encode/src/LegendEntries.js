import {Transform, Tuple} from 'vega-dataflow';
import {constant, inherits, isFunction} from 'vega-util';
import {tickValues, tickFormat} from './ticks';

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

  var out = pulse.fork(),
      items = this.value,
      size  = _.size,
      scale = _.scale,
      count = _.count == null ? 5 : _.count,
      format = _.format || tickFormat(scale, count, _.formatSpecifier),
      values = _.values || tickValues(scale, count),
      total = 0;

  if (!isFunction(size)) size = constant(size || 8);
  if (items) out.rem = items;

  items = values.map(function(value, index) {
    var t = Tuple.ingest({
      index: index,
      label: format(value),
      size:  size(value),
      total: Math.round(total),
      value: value
    });
    total += t.size;
    return t;
  });

  return (out.source = out.add = this.value = items), out;
};
