import {random} from './random';

export default function(mean, stdev) {
  var mu,
      sigma,
      next = NaN,
      dist = {};

  dist.mean = function(_) {
    if (arguments.length) {
      mu = _ || 0;
      next = NaN;
      return dist;
    } else {
      return mu;
    }
  };

  dist.stdev = function(_) {
    if (arguments.length) {
      sigma = _ == null ? 1 : _;
      next = NaN;
      return dist;
    } else {
      return sigma;
    }
  };

  dist.sample = function() {
    var x = 0, y = 0, rds, c;
    if (next === next) {
      x = next;
      next = NaN;
      return x;
    }
    do {
      x = random() * 2 - 1;
      y = random() * 2 - 1;
      rds = x * x + y * y;
    } while (rds === 0 || rds > 1);
    c = Math.sqrt(-2 * Math.log(rds) / rds); // Box-Muller transform
    next = mu + y * c * sigma;
    return mu + x * c * sigma;
  };

  dist.pdf = function(x) {
    var exp = Math.exp(Math.pow(x-mu, 2) / (-2 * Math.pow(sigma, 2)));
    return (1 / (sigma * Math.sqrt(2*Math.PI))) * exp;
  };

  // Approximation from West (2009)
  // Better Approximations to Cumulative Normal Functions
  dist.cdf = function(x) {
    var cd,
        z = (x - mu) / sigma,
        Z = Math.abs(z);
    if (Z > 37) {
      cd = 0;
    } else {
      var sum, exp = Math.exp(-Z*Z/2);
      if (Z < 7.07106781186547) {
        sum = 3.52624965998911e-02 * Z + 0.700383064443688;
        sum = sum * Z + 6.37396220353165;
        sum = sum * Z + 33.912866078383;
        sum = sum * Z + 112.079291497871;
        sum = sum * Z + 221.213596169931;
        sum = sum * Z + 220.206867912376;
        cd = exp * sum;
        sum = 8.83883476483184e-02 * Z + 1.75566716318264;
        sum = sum * Z + 16.064177579207;
        sum = sum * Z + 86.7807322029461;
        sum = sum * Z + 296.564248779674;
        sum = sum * Z + 637.333633378831;
        sum = sum * Z + 793.826512519948;
        sum = sum * Z + 440.413735824752;
        cd = cd / sum;
      } else {
        sum = Z + 0.65;
        sum = Z + 4 / sum;
        sum = Z + 3 / sum;
        sum = Z + 2 / sum;
        sum = Z + 1 / sum;
        cd = exp / sum / 2.506628274631;
      }
    }
    return z > 0 ? 1 - cd : cd;
  };

  // Approximation of Probit function using inverse error function.
  dist.icdf = function(p) {
    if (p <= 0 || p >= 1) return NaN;
    var x = 2*p - 1,
        v = (8 * (Math.PI - 3)) / (3 * Math.PI * (4-Math.PI)),
        a = (2 / (Math.PI*v)) + (Math.log(1 - Math.pow(x,2)) / 2),
        b = Math.log(1 - (x*x)) / v,
        s = (x > 0 ? 1 : -1) * Math.sqrt(Math.sqrt((a*a) - b) - a);
    return mu + sigma * Math.SQRT2 * s;
  };

  return dist.mean(mean).stdev(stdev);
}
