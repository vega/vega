import ols from './ols.js';
import {points} from './points.js';
import rSquared from './r-squared.js';

// Adapted from d3-regression by Harry Stevens
// License: https://github.com/HarryStevens/d3-regression/blob/master/LICENSE
export default function(data, x, y) {
  const [xv, yv, ux, uy] = points(data, x, y),
        n = xv.length;

  let XY = 0, X2 = 0, i, dx;

  // accumulate moments of the mean-centered data
  for (i=0; i<n;) {
    dx = xv[i];
    XY += (dx * yv[i++] - XY) / i;
    X2 += (dx * dx - X2) / i;
  }

  // fit in mean-centered space, then transform the intercept back
  const [, slope] = ols(0, 0, XY, X2),
        predict = x => uy + slope * (x - ux);

  return {
    coef: [uy - slope * ux, slope],
    predict: predict,
    rSquared: rSquared(data, x, y, uy, predict)
  };
}
