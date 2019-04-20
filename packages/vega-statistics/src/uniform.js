import {random} from './random';

export default function(min, max) {
  if (max == null) {
    max = (min == null ? 1 : min);
    min = 0;
  }

  var dist = {},
      a, b, d;

  dist.min = function(_) {
    if (arguments.length) {
      a = _ || 0;
      d = b - a;
      return dist;
    } else {
      return a;
    }
  };

  dist.max = function(_) {
    if (arguments.length) {
      b = _ || 0;
      d = b - a;
      return dist;
    } else {
      return b;
    }
  };

  dist.sample = function() {
    return a + d * random();
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

  return dist.min(min).max(max);
}
