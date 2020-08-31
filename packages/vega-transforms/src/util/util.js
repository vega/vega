import {accessorName} from 'vega-util';

// use either provided alias or accessor field name
export function fieldNames(fields, as) {
  if (!fields) return null;
  return fields.map((f, i) => as[i] || accessorName(f));
}

export function partition(data, groupby, field) {
  const groups = [],
        get = f => f(t);
  let map, i, n, t, k, g;

  // partition data points into groups
  if (groupby == null) {
    groups.push(data.map(field));
  } else {
    for (map={}, i=0, n=data.length; i<n; ++i) {
      t = data[i];
      k = groupby.map(get);
      g = map[k];
      if (!g) {
        map[k] = (g = []);
        g.dims = k;
        groups.push(g);
      }
      g.push(field(t));
    }
  }

  return groups;
}
