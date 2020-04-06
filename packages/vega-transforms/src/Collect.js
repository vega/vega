import SortedList from './util/SortedList';
import {stableCompare, Transform, tupleid} from 'vega-dataflow';
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

Collect.Definition = {
  type: 'Collect',
  metadata: {source: true},
  params: [{name: 'sort', type: 'compare'}]
};

const prototype = inherits(Collect, Transform);

prototype.transform = function (_, pulse) {
  const out = pulse.fork(pulse.ALL);
  const list = SortedList(tupleid, this.value, out.materialize(out.ADD).add);
  const sort = _.sort;
  const mod = pulse.changed() || (sort && (_.modified('sort') || pulse.modified(sort.fields)));

  out.visit(out.REM, list.remove);

  this.modified(mod);
  this.value = out.source = list.data(stableCompare(sort), mod);

  // propagate tree root if defined
  if (pulse.source && pulse.source.root) {
    this.value.root = pulse.source.root;
  }

  return out;
};
