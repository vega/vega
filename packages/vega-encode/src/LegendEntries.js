import {labelFormat, labelFraction, labelValues} from './labels';
import {Symbols, Gradient} from './legend-types';
import {tickCount, tickFormat} from './ticks';
import {Transform, ingest} from 'vega-dataflow';
import {scaleFraction} from 'vega-scale';
import {constant, inherits, isFunction, peek} from 'vega-util';

/**
 * Generates legend entries for visualizing a scale.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Scale} params.scale - The scale to generate items for.
 * @param {*} [params.count=5] - The approximate number of items, or
 *   desired tick interval, to use.
 * @param {Array<*>} [params.values] - The exact tick values to use.
 *   These must be legal domain values for the provided scale.
 *   If provided, the count argument is ignored.
 * @param {string} [params.formatSpecifier] - A format specifier
 *   to use in conjunction with scale.tickFormat. Legal values are
 *   any valid D3 format specifier string.
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
      items = this.value,
      type  = _.type || Symbols,
      scale = _.scale,
      count = _.count == null ? 5 : tickCount(scale, _.count),
      format = _.format || tickFormat(scale, count, _.formatSpecifier),
      values = _.values || labelValues(scale, count, type),
      domain, fraction, size, offset;

  format = labelFormat(scale, format, type);
  if (items) out.rem = items;

  if (type === Symbols) {
    if (isFunction(size = _.size)) {
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

    items = values.map(function(value, index) {
      return ingest({
        index:  index,
        label:  format(value, index, values),
        value:  value,
        offset: offset,
        size:   size(value, _)
      });
    });
  }

  else if (type === Gradient) {
    domain = scale.domain(),
    fraction = scaleFraction(scale, domain[0], peek(domain));

    // if automatic label generation produces 2 or fewer values,
    // use the domain end points instead (fixes vega/vega#1364)
    if (values.length < 3 && !_.values && domain[0] !== peek(domain)) {
      values = [domain[0], peek(domain)];
    }

    items = values.map(function(value, index) {
      return ingest({
        index: index,
        label: format(value, index, values),
        value: value,
        perc:  fraction(value)
      });
    });
  }

  else {
    size = values.length - 1;
    fraction = labelFraction(scale);

    items = values.map(function(value, index) {
      return ingest({
        index: index,
        label: format(value, index, values),
        value: value,
        perc:  index ? fraction(value) : 0,
        perc2: index === size ? 1 : fraction(values[index+1])
      });
    });
  }

  out.source = items;
  out.add = items;
  this.value = items;

  return out;
};
