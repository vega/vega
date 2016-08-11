export default function(r0, r1) {
  var lo = r0,
      hi = r1,
      t;

  if (hi < lo) t = lo, lo = hi, hi = t;

  return [
    this.invert(lo),
    this.invert(hi)
  ];
}