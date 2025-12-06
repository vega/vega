export default function clampRange(range: number[], min: number, max: number): number[] {
  let lo = range[0],
      hi = range[1],
      span: number;

  if (hi < lo) {
    span = hi;
    hi = lo;
    lo = span;
  }
  span = hi - lo;

  return span >= (max - min)
    ? [min, max]
    : [
        (lo = Math.min(Math.max(lo, min), max - span)),
        lo + span
      ];
}
