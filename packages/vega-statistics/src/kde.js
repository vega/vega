import gaussian from './normal';
import quartiles from './quartiles';
import {random} from './random';
import {variance} from 'd3-array';

// TODO: support for additional kernels?
export default function(support, bandwidth) {
  var kernel = gaussian(),
      dist = {},
      n = 0;

  dist.data = function(_) {
    if (arguments.length) {
      support = _;
      n = _ ? _.length : 0;
      return dist.bandwidth(bandwidth);
    } else {
      return support;
    }
  };

  dist.bandwidth = function(_) {
    if (!arguments.length) return bandwidth;
    bandwidth = _;
    if (!bandwidth && support) bandwidth = estimateBandwidth(support);
    return dist;
  };

  dist.sample = function() {
    return support[~~(random() * n)] + bandwidth * kernel.sample();
  };

  dist.pdf = function(x) {
    for (var y=0, i=0; i<n; ++i) {
      y += kernel.pdf((x - support[i]) / bandwidth);
    }
    return y / bandwidth / n;
  };

  dist.cdf = function(x) {
    for (var y=0, i=0; i<n; ++i) {
      y += kernel.cdf((x - support[i]) / bandwidth);
    }
    return y / n;
  };

  dist.icdf = function() {
    throw Error('KDE icdf not supported.');
  };

  return dist.data(support);
}

// Scott, D. W. (1992) Multivariate Density Estimation:
// Theory, Practice, and Visualization. Wiley.
function estimateBandwidth(array) {
  var n = array.length,
      q = quartiles(array),
      h = (q[2] - q[0]) / 1.34;
  return 1.06 * Math.min(Math.sqrt(variance(array)), h) * Math.pow(n, -0.2);
}
