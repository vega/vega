import {stableCompare, Transform} from 'vega-dataflow';
import {inherits, one} from 'vega-util';

const Zero = 'zero';
const Center = 'center';
const Normalize = 'normalize';
const DefOutput = ['y0', 'y1'];

/**
 * Stack layout for visualization elements.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to stack.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
 * @param {function(object,object): number} [params.sort] - A comparator for stack sorting.
 * @param {string} [offset='zero'] - Stack baseline offset. One of 'zero', 'center', 'normalize'.
 */
export default function Stack(params) {
  Transform.call(this, null, params);
}

Stack.Definition = {
  type: 'Stack',
  metadata: {modifies: true},
  params: [
    {name: 'field', type: 'field'},
    {name: 'groupby', type: 'field', array: true},
    {name: 'sort', type: 'compare'},
    {name: 'offset', type: 'enum', default: Zero, values: [Zero, Center, Normalize]},
    {name: 'as', type: 'string', array: true, length: 2, default: DefOutput}
  ]
};

const prototype = inherits(Stack, Transform);

prototype.transform = function (_, pulse) {
  const as = _.as || DefOutput;
  const y0 = as[0];
  const y1 = as[1];
  const sort = stableCompare(_.sort);
  const field = _.field || one;
  const stack = _.offset === Center ? stackCenter : _.offset === Normalize ? stackNormalize : stackZero;
  let i;
  let n;
  let max;

  // partition, sum, and sort the stack groups
  const groups = partition(pulse.source, _.groupby, sort, field);

  // compute stack layouts per group
  for (i = 0, n = groups.length, max = groups.max; i < n; ++i) {
    stack(groups[i], max, field, y0, y1);
  }

  return pulse.reflow(_.modified()).modifies(as);
};

function stackCenter(group, max, field, y0, y1) {
  let last = (max - group.sum) / 2;
  const m = group.length;
  let j = 0;
  let t;

  for (; j < m; ++j) {
    t = group[j];
    t[y0] = last;
    t[y1] = last += Math.abs(field(t));
  }
}

function stackNormalize(group, max, field, y0, y1) {
  const scale = 1 / group.sum;
  let last = 0;
  const m = group.length;
  let j = 0;
  let v = 0;
  let t;

  for (; j < m; ++j) {
    t = group[j];
    t[y0] = last;
    t[y1] = last = scale * (v += Math.abs(field(t)));
  }
}

function stackZero(group, max, field, y0, y1) {
  let lastPos = 0;
  let lastNeg = 0;
  const m = group.length;
  let j = 0;
  let v;
  let t;

  for (; j < m; ++j) {
    t = group[j];
    v = +field(t);
    if (v < 0) {
      t[y0] = lastNeg;
      t[y1] = lastNeg += v;
    } else {
      t[y0] = lastPos;
      t[y1] = lastPos += v;
    }
  }
}

function partition(data, groupby, sort, field) {
  const groups = [];
  const get = function (f) {
    return f(t);
  };
  let map;
  let i;
  let n;
  let m;
  let t;
  let k;
  let g;
  let s;
  let max;

  // partition data points into stack groups
  if (groupby == null) {
    groups.push(data.slice());
  } else {
    for (map = {}, i = 0, n = data.length; i < n; ++i) {
      t = data[i];
      k = groupby.map(get);
      g = map[k];
      if (!g) {
        map[k] = g = [];
        groups.push(g);
      }
      g.push(t);
    }
  }

  // compute sums of groups, sort groups as needed
  for (k = 0, max = 0, m = groups.length; k < m; ++k) {
    g = groups[k];
    for (i = 0, s = 0, n = g.length; i < n; ++i) {
      s += Math.abs(field(g[i]));
    }
    g.sum = s;
    if (s > max) max = s;
    if (sort) g.sort(sort);
  }
  groups.max = max;

  return groups;
}
