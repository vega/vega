import Transform from '../Transform';
import {ingest} from '../Tuple';
import {inherits} from 'vega-util';
import {range} from 'd3-array';

/**
 * Generates data tuples for a specified range of numbers.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {number} params.start - The first number in the range.
 * @param {number} params.stop - The last number (exclusive) in the range.
 * @param {number} [params.step=1] - The step size between numbers in the range.
 */
export default function Range(params) {
  Transform.call(this, [], params);
}

var prototype = inherits(Range, Transform);

prototype.transform = function(_, pulse) {
  if (!_.modified()) return;

  var out = pulse.materialize().fork(pulse.MOD);

  out.rem = pulse.rem.concat(this.value);
  out.source = this.value = range(_.start, _.stop, _.step).map(ingest);
  out.add = pulse.add.concat(this.value);

  return out;
};
