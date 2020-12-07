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

  const [xv, yv, ux, uy] = points(data, x, y);
  const n = xv.length;
  const lhs = [];
  const rhs = [];
  const k = order + 1;
  let i;
  let j;
  let l;
  let v;
  let c;

  for (i=0; i<k; ++i) {
    for (l=0, v=0; l<n; ++l) {
      v += Math.pow(xv[l], i) * yv[l];
    }
    lhs.push(v);

    c = new Float64Array(k);
    for (j=0; j<k; ++j) {
      for (l=0, v=0; l<n; ++l) {
        v += Math.pow(xv[l], i + j);
      }
      c[j] = v;
    }
    rhs.push(c);
  }
  rhs.push(lhs);

  const coef = gaussianElimination(rhs);

  const predict = x => {
    x -= ux;
    let y = uy + coef[0] + coef[1] * x + coef[2] * x * x;
    for (i=3; i<k; ++i) y += coef[i] * Math.pow(x, i);
    return y;
  };

  return {
    coef: uncenter(k, coef, -ux, uy),
    predict: predict,
    rSquared: rSquared(data, x, y, uy, predict)
  };
}

function uncenter(k, a, x, y) {
  const z = Array(k);
  let i;
  let j;
  let v;
  let c;

  // initialize to zero
  for (i=0; i<k; ++i) z[i] = 0;

  // polynomial expansion
  for (i=k-1; i>=0; --i) {
    v = a[i];
    c = 1;
    z[i] += v;
    for (j=1; j<=i; ++j) {
      c *= (i + 1 - j) / j; // binomial coefficent
      z[i-j] += v * Math.pow(x, j) * c;
    }
  }

  // bias term
  z[0] += y;

  return z;
}

// Given an array for a two-dimensional matrix and the polynomial order,
// solve A * x = b using Gaussian elimination.
function gaussianElimination(matrix) {
  const n = matrix.length - 1;
  const coef = [];
  let i;
  let j;
  let k;
  let r;
  let t;

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
