import {peek} from 'vega-util';

export default function(range, value, threshold, left, right, center) {
  var l = Math.abs(value - range[0]),
      r = Math.abs(peek(range) - value);
  return l < r && l <= threshold ? left
    : r <= threshold ? right
    : center;
}
