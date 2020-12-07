import ols from './ols';
import {visitPoints} from './points';
import rSquared from './r-squared';

// Adapted from d3-regression by Harry Stevens
// License: https://github.com/HarryStevens/d3-regression/blob/master/LICENSE
export default function(data, x, y) {
  let X = 0;
  let Y = 0;
  let XY = 0;
  let X2 = 0;
  let YS = 0;
  let n = 0;

  visitPoints(data, x, y, (dx, dy) => {
    const lx = Math.log(dx);
    const ly = Math.log(dy);
    ++n;
    X += (lx - X) / n;
    Y += (ly - Y) / n;
    XY += (lx * ly - XY) / n;
    X2 += (lx * lx - X2) / n;
    YS += (dy - YS) / n;
  });

  const coef = ols(X, Y, XY, X2);
  const predict = x => coef[0] * Math.pow(x, coef[1]);

  coef[0] = Math.exp(coef[0]);

  return {
    coef: coef,
    predict: predict,
    rSquared: rSquared(data, x, y, YS, predict)
  };
}
