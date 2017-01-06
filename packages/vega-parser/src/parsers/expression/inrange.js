export default function(value, range) {
  var r0 = range[0], r1 = range[range.length-1], t;
  if (r0 > r1) t = r0, r0 = r1, r1 = t;
  return r0 <= value && value <= r1;
}
