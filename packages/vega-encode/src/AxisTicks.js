import {Transform, ingest} from 'vega-dataflow';
import {inherits} from 'vega-util';
import {tickValues, tickFormat} from './ticks';

/**
 * Generates axis ticks for visualizing a spatial scale.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Scale} params.scale - The scale to generate ticks for.
 * @param {*} [params.count=10] - The approximate number of ticks, or
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
export default function AxisTicks(params) {
  Transform.call(this, [], params);
}

var prototype = inherits(AxisTicks, Transform);

prototype.transform = function(_, pulse) {
  if (this.value != null && !_.modified()) {
    return pulse.StopPropagation;
  }

  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      ticks = this.value,
      scale = _.scale,
      count = _.count,
      format = _.format || tickFormat(scale, count, _.formatSpecifier),
      values = _.values || tickValues(scale, count);

  if (ticks) out.rem = ticks;

  ticks = values.map(function(value) {
    return ingest({value: value, label: format(value)})
  });

  if (_.extra) {
    // add an extra tick pegged to the initial domain value
    // this is used to generate axes with 'binned' domains
    ticks.push(ingest({
      extra: {value: ticks[0].value},
      label: ''
    }));
  }

  return (out.source = out.add = this.value = ticks), out;
};
