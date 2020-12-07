export default function(scale) {
  return function(_) {
    let lo = _[0];
    let hi = _[1];
    let t;

    if (hi < lo) {
      t = lo;
      lo = hi;
      hi = t;
    }

    return [
      scale.invert(lo),
      scale.invert(hi)
    ];
  };
}
