import linear from './linear';
import {points} from './points';
import quad from './quad';
import rSquared from './r-squared';

// Adapted from d3-regression by Harry Stevens
// License: https://github.com/HarryStevens/d3-regression/blob/master/LICENSE
// ... which was adapted from regression-js by Tom Alexander
// Source: https://github.com/Tom-Alexander/regression-js/blob/master/src/regression.js#L246
// License: https://github.com/Tom-Alexander/regression-js/blob/master/LICENSE
export default function(data, x, y, order) {
  // use more efficient methods for lower orders
  if (order === 1) return linear(data, x, y);
  if (order === 2) return quad(data, x, y);

  const [xv, yv] = points(data, x, y),
        n = xv.length,
        lhs = [],
        rhs = [],
        k = order + 1;

  let Y = 0, i, j, l, v, c;

  for (i = 0; i < n; ++i) {
    Y += yv[i];
  }

  for (i = 0; i < k; ++i) {
    for (l = 0, v = 0; l < n; ++l) {
      v += Math.pow(xv[l], i) * yv[l];
    }
    lhs.push(v);

    c = new Float64Array(k);
    for (j = 0; j < k; ++j) {
      for (l = 0, v = 0; l < n; ++l) {
        v += Math.pow(xv[l], i + j);
      }
      c[j] = v;
    }
    rhs.push(c);
  }
  rhs.push(lhs);

  const coef = gaussianElimination(rhs),
        predict = x => {
          let y = 0, i = 0, n = coef.length;
          for (; i < n; ++i) y += coef[i] * Math.pow(x, i);
          return y;
        };

  return {
    coef: coef,
    predict: predict,
    rSquared: rSquared(data, x, y, Y / n, predict)
  };
}

// Given an array for a two-dimensional matrix and the polynomial order,
// solve A * x = b using Gaussian elimination.
function gaussianElimination(matrix) {
  const n = matrix.length - 1,
        coef = [];

  let i, j, k, r, t;

  for (i = 0; i < n; ++i) {
    r = i; // max row
    for (j = i + 1; j < n; ++j) {
      if (Math.abs(matrix[i][j]) > Math.abs(matrix[i][r])) {
        r = j;
      }
    }

    for (k = i; k < n + 1; ++k) {
      t = matrix[k][i];
      matrix[k][i] = matrix[k][r];
      matrix[k][r] = t;
    }

    for (j = i + 1; j < n; ++j) {
      for (k = n; k >= i; k--) {
        matrix[k][j] -= (matrix[k][i] * matrix[i][j]) / matrix[i][i];
      }
    }
  }

  for (j = n - 1; j >= 0; --j) {
    t = 0;
    for (k = j + 1; k < n; ++k) {
      t += matrix[k][j] * coef[k];
    }
    coef[j] = (matrix[n][j] - t) / matrix[j][j];
  }

  return coef;
}