export default function(min, max) {
  var a = max == null ? 0 : min,
      b = max == null ? (min == null ? 1 : min) : max,
      d = b - a,
      dist = {};

  dist.sample = function() {
    return a + d * Math.random();
  };

  dist.pdf = function(x) {
    return (x >= a && x <= b) ? 1 / d : 0;
  };

  dist.cdf = function(x) {
    return x < a ? 0 : x > b ? 1 : (x - a) / d;
  };

  dist.icdf = function(p) {
    return (p >= 0 && p <= 1) ? a + p * d : NaN;
  };

  return dist;
}
