import {visitPoints} from './points';
import rSquared from './r-squared';

export default function(data, x, y) {
  let X = 0, Y = 0, X2 = 0, X3 = 0, X4 = 0, XY = 0, X2Y = 0, n = 0;

  visitPoints(data, x, y, (dx, dy) => {
    const x2 = dx * dx;
    X += dx;
    Y += dy;
    X2 += x2;
    X3 += x2 * dx;
    X4 += x2 * x2;
    XY += dx * dy;
    X2Y += x2 * dy;
    ++n;
  });

  Y = Y / n;
  XY = XY - X * Y;
  X2Y = X2Y - X2 * Y;

  const XX = X2 - X * X / n,
        XX2 = X3 - (X2 * X / n),
        X2X2 = X4 - (X2 * X2 / n),
        d = (XX * X2X2 - XX2 * XX2),
        a = (X2Y * XX - XY * XX2) / d,
        b = (XY * X2X2 - X2Y * XX2) / d,
        c = Y - (b * (X / n)) - (a * (X2 / n)),
        predict = x => a * x * x + b * x + c;

  return {
    coef: [c, b, a],
    predict: predict,
    rSquared: rSquared(data, x, y, Y, predict)
  };
}
