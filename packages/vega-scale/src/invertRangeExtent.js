export default function(r0, r1) {
  var range = this.range(),
      lo = r0,
      hi = r1,
      min = -1, max, t, i, n;
      t;

  if (hi < lo) t = lo, lo = hi, hi = t;

  for (i=0, n=range.length; i<n; ++i) {
    if (range[i] >= lo && range[i] <= hi) {
      if (min < 0) min = i;
      max = i;
    }
  }

  lo = this.invertExtent(range[min]);
  hi = this.invertExtent(range[max]);

  return [
    lo[0] === undefined ? lo[1] : lo[0],
    hi[1] === undefined ? hi[0] : hi[1]
  ];
}