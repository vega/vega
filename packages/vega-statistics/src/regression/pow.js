import ols from './ols';
import {visitPoints} from './points';
import rSquared from './r-squared';

// Adapted from d3-regression by Harry Stevens
// License: https://github.com/HarryStevens/d3-regression/blob/master/LICENSE
export default function(data, x, y) {
  let X = 0, Y = 0, XY = 0, X2 = 0, YS = 0, n = 0;

  visitPoints(data, x, y, (dx, dy) => {
    const lx = Math.log(dx),
          ly = Math.log(dy);
    X += lx;
    Y += ly;
    XY += lx * ly;
    X2 += lx * lx;
    YS += dy;
    ++n;
  });

  const coef = ols(X / n, Y / n, XY / n, X2 / n),
        predict = x => coef[0] * Math.pow(x, coef[1]);

  coef[0] = Math.exp(coef[0]);

  return {
    coef: coef,
    predict: predict,
    rSquared: rSquared(data, x, y, YS / n, predict)
  };
}