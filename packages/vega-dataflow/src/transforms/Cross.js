import Transform from '../Transform';
import {ingest} from '../Tuple';
import {inherits, truthy} from 'vega-util';

/**
 * Perform a cross-product of a tuple stream with itself.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object):boolean} [params.filter] - An optional filter
 *   function for selectively including tuples in the cross product.
 * @param {Array<string>} [params.as] - The names of the output fields.
 */
export default function Cross(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Cross, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE),
      data = this.value,
      as = _.as || ['a', 'b'],
      a = as[0], b = as[1],
      reset = !data
          || pulse.changed(pulse.ADD_REM)
          || _.modified('as')
          || _.modified('filter');

  if (reset) {
    if (data) out.rem = data;
    out.add = this.value = cross(pulse.source, a, b, _.filter || truthy);
  } else {
    out.mod = data;
  }

  return out.source = this.value, out.modifies(as);
};

function cross(input, a, b, filter) {
  var data = [],
      t = {},
      n = input.length,
      i = 0,
      j, left;

  for (; i<n; ++i) {
    t[a] = left = input[i];
    for (j=0; j<n; ++j) {
      t[b] = input[j];
      if (filter(t)) {
        data.push(ingest(t));
        t = {};
        t[a] = left;
      }
    }
  }

  return data;
}
