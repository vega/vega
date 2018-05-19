import {peek} from 'vega-util';

export default function(range, value, threshold, left, right, center) {
  var a = range[0],
      b = peek(range),
      l, r;

  // swap endpoints if range is reversed
  if (b < a) {
    l = a; a = b; b = l;
  }

  // compare value to endpoints
  l = Math.abs(value - a);
  r = Math.abs(b - value);

  // adjust if value within threshold distance of endpoint
  return l < r && l <= threshold ? left
    : r <= threshold ? right
    : center;
}
