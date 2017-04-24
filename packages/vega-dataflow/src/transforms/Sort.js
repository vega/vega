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
  var mod = _.modified('sort')
         || pulse.changed(pulse.ADD)
         || pulse.modified(_.sort.fields);

  if (mod) pulse.source.sort(_.sort);

  this.modified(mod);
  return pulse;
};
