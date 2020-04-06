export default function (data, groupby) {
  const groups = [];
  const get = function (f) {
    return f(t);
  };
  let map;
  let i;
  let n;
  let t;
  let k;
  let g;

  // partition data points into stack groups
  if (groupby == null) {
    groups.push(data);
  } else {
    for (map = {}, i = 0, n = data.length; i < n; ++i) {
      t = data[i];
      k = groupby.map(get);
      g = map[k];
      if (!g) {
        map[k] = g = [];
        g.dims = k;
        groups.push(g);
      }
      g.push(t);
    }
  }

  return groups;
}
