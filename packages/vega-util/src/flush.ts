import peek from './peek.js';

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
      b = peek(range)!,
      l: number;

  if (b < a) {
    l = a; a = b; b = l;
  }

  l = Math.abs(value - a);
  const r = Math.abs(b - value);

  return l < r && l <= t ? left : r <= t ? right : center;
}
