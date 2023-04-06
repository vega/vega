import { sum } from 'd3-array';
import rSquared from './r-squared';

export default function (data, x, y) {
  const validData = data.filter(d => x(d) != null && y(d) != null),
    meanY = sum(validData.map(y)) / validData.length,
    predict = () => meanY;

  return {
    coef: [meanY],
    predict: predict,
    rSquared: rSquared(data, x, y, meanY, predict)
  };
}
