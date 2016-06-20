export default function(min, max) {
  var a = max == null ? 0 : min,
      b = max == null ? min : max,
      d = b - a,
      dist = {};

  dist.sample = function() {
    return a + Math.floor(d * Math.random());
  };

  dist.pdf = function(x) {
    return (x === Math.floor(x) && x >= a && x < b) ? 1 / d : 0;
  };

  dist.cdf = function(x) {
    var v = Math.floor(x);
    return v < a ? 0 : v >= b ? 1 : (v - a + 1) / d;
  };

  dist.icdf = function(p) {
    return (p >= 0 && p <= 1) ? a - 1 + Math.floor(p * d) : NaN;
  };

  return dist;
}
