import Transform from '../Transform';
import {inherits, merge} from 'vega-util';

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
      add = pulse.changed(pulse.ADD),
      mod = pulse.changed(),
      sort = _.sort,
      data = this.value,
      push = function(t) { data.push(t); },
      n = 0, map;

  if (out.rem.length) { // build id map and filter data array
    map = {};
    out.visit(out.REM, function(t) { map[t._id] = 1; ++n; });
    data = data.filter(function(t) { return !map[t._id]; });
  }

  if (sort) {
    // if sort criteria change, re-sort the full data array
    if (_.modified('sort') || pulse.modified(sort.fields)) {
      data.sort(sort);
      mod = true;
    }
    // if added tuples, sort them in place and then merge
    if (add) {
      data = merge(sort, data, out.add.sort(sort));
    }
  } else if (add) {
    // no sort, so simply add new tuples
    out.visit(out.ADD, push);
  }

  this.modified(mod);
  this.value = out.source = data;
  return out;
};
