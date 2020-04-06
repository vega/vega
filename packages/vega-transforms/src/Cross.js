import {ingest, Transform} from 'vega-dataflow';
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

Cross.Definition = {
  type: 'Cross',
  metadata: {generates: true},
  params: [
    {name: 'filter', type: 'expr'},
    {name: 'as', type: 'string', array: true, length: 2, default: ['a', 'b']}
  ]
};

const prototype = inherits(Cross, Transform);

prototype.transform = function (_, pulse) {
  const out = pulse.fork(pulse.NO_SOURCE);
  let data = this.value;
  const as = _.as || ['a', 'b'];
  const a = as[0];
  const b = as[1];
  const reset = !data || pulse.changed(pulse.ADD_REM) || _.modified('as') || _.modified('filter');

  if (reset) {
    if (data) out.rem = data;
    data = pulse.materialize(pulse.SOURCE).source;
    out.add = this.value = cross(data, a, b, _.filter || truthy);
  } else {
    out.mod = data;
  }

  out.source = this.value;
  return out.modifies(as);
};

function cross(input, a, b, filter) {
  const data = [];
  let t = {};
  const n = input.length;
  let i = 0;
  let j;
  let left;

  for (; i < n; ++i) {
    t[a] = left = input[i];
    for (j = 0; j < n; ++j) {
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
