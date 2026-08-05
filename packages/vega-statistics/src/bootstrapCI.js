import numbers from './numbers.js';
import {random} from './random.js';
import {ascending, quantile} from 'd3-array';

export default function(array, samples, alpha, f) {
  if (!array.length) return [undefined, undefined];

  const values = Float64Array.from(numbers(array, f)),
        n = values.length,
        m = samples;
  let a, i, j, mu;

  for (j=0, mu=Array(m); j<m; ++j) {
    for (a=0, i=0; i<n; ++i) {
      a += values[~~(random() * n)];
    }
    mu[j] = a / n;
  }

  mu.sort(ascending);

  return [
    quantile(mu, alpha/2),
    quantile(mu, 1-(alpha/2))
  ];
}
