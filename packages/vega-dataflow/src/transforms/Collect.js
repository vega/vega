import {tupleid} from '../Tuple';
import Transform from '../Transform';
import SortedList from '../util/SortedList';
import {inherits} from 'vega-util';

/**
 * Collects all data tuples that pass through this operator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(*,*): number} [params.sort] - An optional
 *   comparator function for additionally sorting the collected tuples.
 */
export default function Collect(params) {
  Transform.call(this, [], params);
}

var prototype = inherits(Collect, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ALL),
      list = SortedList(tupleid, this.value, out.materialize(out.ADD).add),
      sort = _.sort,
      mod = pulse.changed() || (sort &&
            (_.modified('sort') || pulse.modified(sort.fields)));

  out.visit(out.REM, list.remove);

  this.modified(mod);
  this.value = out.source = list.data(sort, mod);
  return out;
};
