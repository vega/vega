import estimateBandwidth from './bandwidth.js';
import gaussian from './normal.js';
import numbers from './numbers.js';
import {random} from './random.js';

export default function(support, bandwidth) {
  const kernel = gaussian();
  let n = 0;

  const dist = {
    data(_) {
      if (arguments.length) {
        // ignore null, undefined and NaN values
        support = _ ? Array.from(numbers(_)) : _;
        n = support ? support.length : 0;
        return dist.bandwidth(bandwidth);
      } else {
        return support;
      }
    },

    bandwidth(_) {
      if (!arguments.length) return bandwidth;
      bandwidth = _;
      if (!bandwidth && support) bandwidth = estimateBandwidth(support);
      return dist;
    },

    sample() {
      return support[~~(random() * n)] + bandwidth * kernel.sample();
    },

    pdf(x) {
      let y = 0, i = 0;
      for (; i<n; ++i) {
        y += kernel.pdf((x - support[i]) / bandwidth);
      }
      return y / bandwidth / n;
    },

    cdf(x) {
      let y = 0, i = 0;
      for (; i<n; ++i) {
        y += kernel.cdf((x - support[i]) / bandwidth);
      }
      return y / n;
    },

    icdf() {
      throw Error('KDE icdf not supported.');
    }
  };

  return dist.data(support);
}
