import peek from './peek.js';

/**
 * Selects one of three values (left, right, or center) based on whether
 * a value is within a threshold distance of a range's endpoints.
 * @template T The type of value to return (can be any type - string, number, object, etc.)
 */
export default function<T>(
  range: readonly number[],
  value: number,
  threshold: number | null | undefined,
  left: T,
  right: T,
  center: T
): T {
  if (!threshold && threshold !== 0) return center;

  const t = +threshold;
  let a = range[0],
      b = peek(range),
      l: number;

  // TODO: Check in PRV: behavior change to handle empty b
  if (b === undefined) return center;

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
