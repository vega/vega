export default function(path) {
  const len = path.length;

  if (len === 1) {
    const field = path[0];
    return function(obj) {
      return obj[field];
    };
  } else {
    return function(obj) {
      let v = obj, i = -1;
      while (++i < len) v = v[path[i]];
      return v;
    };
  }
}
