import rSquared from './r-squared';

export default function (data, x, y) {
  let mean = 0, n = 0;
  for (const d of data) {
    const val = y(d)
    if (x(d) == null || val == null || isNaN(val)) continue;

    n++;
    mean += (val - mean) / n;
  }
  const predict = () => mean;

  return {
    coef: [mean],
    predict: predict,
    rSquared: rSquared(data, x, y, mean, predict)
  };
}
