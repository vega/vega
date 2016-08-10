import {Transform} from 'vega-dataflow';
import {inherits} from 'vega-util';

var Center = 'center',
    Normalize = 'normalize';

/**
 * Stack layout for visualization elements.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to stack.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
 * @param {function(object,object): number} [params.sort] - A comparator for stack sorting.
 * @param {string} [offset='zero'] - One of 'zero', 'center', 'normalize'.
 */
export default function Stack(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Stack, Transform);

prototype.transform = function(_, pulse) {
  var as = _.as || ['y0', 'y1'],
      y0 = as[0],
      y1 = as[1],
      field = _.field,
      offset = _.offset,
      groups, group, i, j, n, m,
      max, off, scale, t, a, b, v;

  // partition, sum, and sort the stack groups
  groups = partition(pulse.source, _.groupby, _.sort, field);

  // compute stack layouts per group
  for (i=0, n=groups.length, max=groups.max; i<n; ++i) {
    group = groups[i];
    off = offset===Center ? (max - group.sum)/2 : 0;
    scale = offset===Normalize ? (1/group.sum) : 1;

    // set stack coordinates for each datum in group
    for (b=off, v=0, j=0, m=group.length; j<m; ++j) {
      t = group[j];
      a = b; // use previous value for start point
      v += field(t);
      b = scale * v + off; // compute end point
      t[y0] = a;
      t[y1] = b;
    }
  }

  return pulse.reflow().modifies(as);
};

function partition(data, groupby, sort, field) {
  var groups = [],
      get = function(f) { return f(t); },
      map, i, n, m, t, k, g, s, max;

  // partition data points into stack groups
  if (groupby == null) {
    groups.push(data.slice());
  } else {
    for (map={}, i=0, n=data.length; i<n; ++i) {
      t = data[i];
      k = groupby.map(get);
      g = map[k] || (groups.push(map[k] = []), map[k]);
      g.push(t);
    }
  }

  // compute sums of groups, sort groups as needed
  for (k=0, max=0, m=groups.length; k<m; ++k) {
    g = groups[k];
    for (i=0, s=0, n=g.length; i<n; ++i) {
      s += field(g[i]);
    }
    g.sum = s;
    if (s > max) max = s;
    if (sort) g.sort(sort);
  }
  groups.max = max;

  return groups;
}
