export default function(data, x, y) {
  let mean = 0, n = 0;

  for (const d of data) {
    const val = y(d);
    if (x(d) == null || val == null || isNaN(val)) continue;
    mean += (val - mean) / ++n;
  }

  return {
    coef: [mean],
    predict: () => mean,
    rSquared: 0
  };
}
