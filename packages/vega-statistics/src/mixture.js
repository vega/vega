import {random} from './random.js';

export default function(dists, weights) {
  let m = 0, w;

  function normalize(x) {
    const w = [];
    let sum = 0, i;
    for (i = 0; i < m; ++i) { sum += (w[i] = (x[i]==null ? 1 : +x[i])); }
    for (i = 0; i < m; ++i) { w[i] /= sum; }
    return w;
  }

  const dist = {
    weights(_) {
      if (arguments.length) {
        w = normalize(weights = (_ || []));
        return dist;
      }
      return weights;
    },

    distributions(_) {
      if (arguments.length) {
        if (_) {
          m = _.length;
          dists = _;
        } else {
          m = 0;
          dists = [];
        }
        return dist.weights(weights);
      }
      return dists;
    },

    sample() {
      const r = random();
      let d = dists[m-1],
          v = w[0],
          i = 0;

      // first select distribution
      for (; i<m-1; v += w[++i]) {
        if (r < v) { d = dists[i]; break; }
      }
      // then sample from it
      return d.sample();
    },

    pdf(x) {
      let p = 0, i = 0;
      for (; i<m; ++i) {
        p += w[i] * dists[i].pdf(x);
      }
      return p;
    },

    cdf(x) {
      let p = 0, i = 0;
      for (; i<m; ++i) {
        p += w[i] * dists[i].cdf(x);
      }
      return p;
    },

    icdf() {
      throw Error('Mixture icdf not supported.');
    }
  };

  return dist.distributions(dists).weights(weights);
}
