export function points(data, x, y, sort) {
  data = data.filter(d => {
    let u = x(d), v = y(d);
    return u != null && (u = +u) >= u && v != null && (v = +v) >= v;
  });

  if (sort) {
    data.sort((a, b) => x(a) - x(b));
  }

  const X = new Float64Array(data.length),
        Y = new Float64Array(data.length);

  let i = 0;
  for (let d of data) {
    X[i] = x(d);
    Y[i] = y(d);
    ++i;
  }

  return [X, Y];
}

export function visitPoints(data, x, y, callback) {
  let index = -1, i = -1, u, v;

  for (let d of data) {
    u = x(d, ++index, data);
    v = y(d, index, data);
    if (u != null && (u = +u) >= u && v != null && (v = +v) >= v) {
      callback(u, v, ++i);
    }
  }
}
