/**
 * Predicate that returns true if the value lies within the span
 * of the given range. The left and right flags control the use
 * of inclusive (true) or exclusive (false) comparisons.
 */
export default function(value: number, range: [number, number], left: number, right: number) {
  var r0 = range[0], r1 = range[range.length-1], t;
  if (r0 > r1) {
    t = r0;
    r0 = r1;
    r1 = t;
  }
  const l = left === undefined || left;
  const r = right === undefined || right;

  return (l ? r0 <= value : r0 < value) &&
    (r ? value <= r1 : value < r1);
}
