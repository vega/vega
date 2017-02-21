import Transform from '../Transform';
import {ingest} from '../Tuple';
import {inherits} from 'vega-util';
import {range} from 'd3-array';

/**
 * Generates data tuples for a specified sequence range of numbers.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {number} params.start - The first number in the sequence.
 * @param {number} params.stop - The last number (exclusive) in the sequence.
 * @param {number} [params.step=1] - The step size between numbers in the sequence.
 */
export default function Sequence(params) {
  Transform.call(this, [], params);
}

var prototype = inherits(Sequence, Transform);

prototype.transform = function(_, pulse) {
  if (!_.modified()) return;

  var out = pulse.materialize().fork(pulse.MOD);

  out.rem = pulse.rem.concat(this.value);
  out.source = this.value = range(_.start, _.stop, _.step).map(ingest);
  out.add = pulse.add.concat(this.value);

  return out;
};
