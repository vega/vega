import {random} from './random.js';

export default function(min, max) {
  if (max == null) {
    max = min;
    min = 0;
  }

  let a, b, d;

  const dist = {
    min(_) {
      if (arguments.length) {
        a = _ || 0;
        d = b - a;
        return dist;
      } else {
        return a;
      }
    },
    max(_) {
      if (arguments.length) {
        b = _ || 0;
        d = b - a;
        return dist;
      } else {
        return b;
      }
    },
    sample() {
      return a + Math.floor(d * random());
    },
    pdf(x) {
      return (x === Math.floor(x) && x >= a && x < b) ? 1 / d : 0;
    },
    cdf(x) {
      const v = Math.floor(x);
      return v < a ? 0 : v >= b ? 1 : (v - a + 1) / d;
    },
    icdf(p) {
      return (p >= 0 && p <= 1) ? a - 1 + Math.floor(p * d) : NaN;
    }
  };

  return dist.min(min).max(max);
}
