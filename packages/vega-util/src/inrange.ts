export default function inrange(
  value: number,
  range: readonly number[],
  left?: boolean,
  right?: boolean
): boolean {
  let r0 = range[0], r1 = range[range.length-1], t: number;
  if (r0 > r1) {
    t = r0;
    r0 = r1;
    r1 = t;
  }
  left = left === undefined || left;
  right = right === undefined || right;

  return (left ? r0 <= value : r0 < value) &&
    (right ? value <= r1 : value < r1);
}
