import Transform from '../Transform';
import {inherits} from 'vega-util';

/**
 * Sorts data tuples in the pulse source array.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(*,*): number} [params.sort] - A comparator
 *   function for sorting tuples.
 */
export default function Sort(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Sort, Transform);

prototype.transform = function(_, pulse) {
  this.modified(_.modified('sort') || pulse.changed()
    ? (pulse.source.sort(_.sort), true)
    : false);

  return pulse;
};
