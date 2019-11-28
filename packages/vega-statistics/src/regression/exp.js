import ols from './ols';
import {visitPoints} from './points';
import rSquared from './r-squared';

export default function(data, x, y) {
  let Y = 0, YL = 0, XY = 0, XYL = 0, X2Y = 0, n = 0;

  visitPoints(data, x, y, (dx, dy) => {
    const ly = Math.log(dy),
          xy = dx * dy;
    ++n;
    Y += (dy - Y) / n;
    XY += (xy - XY) / n;
    X2Y += (dx * xy - X2Y) / n;
    YL += (dy * ly - YL) / n;
    XYL += (xy * ly - XYL) / n;
  });

  const coef = ols(XY / Y, YL / Y, XYL / Y, X2Y / Y),
        predict = x => coef[0] * Math.exp(coef[1] * x);

  coef[0] = Math.exp(coef[0]);

  return {
    coef: coef,
    predict: predict,
    rSquared: rSquared(data, x, y, Y, predict)
  };
}
