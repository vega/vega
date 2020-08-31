import peek from './peek';

export default function(range, value, threshold, left, right, center) {
  if (!threshold && threshold !== 0) return center;

  const t = +threshold;
  let a = range[0],
      b = peek(range),
      l;

  // swap endpoints if range is reversed
  if (b < a) {
    l = a; a = b; b = l;
  }

  // compare value to endpoints
  l = Math.abs(value - a);
  const r = Math.abs(b - value);

  // adjust if value is within threshold distance of endpoint
  return l < r && l <= t ? left : r <= t ? right : center;
}
