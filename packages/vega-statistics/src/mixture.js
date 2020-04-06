import {random} from './random';

export default function (dists, weights) {
  const dist = {};
  let m = 0;
  let w;

  function normalize(x) {
    const w = [];
    let sum = 0;
    let i;
    for (i = 0; i < m; ++i) {
      sum += w[i] = x[i] == null ? 1 : +x[i];
    }
    for (i = 0; i < m; ++i) {
      w[i] /= sum;
    }
    return w;
  }

  dist.weights = function (_) {
    if (arguments.length) {
      w = normalize((weights = _ || []));
      return dist;
    }
    return weights;
  };

  dist.distributions = function (_) {
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
  };

  dist.sample = function () {
    const r = random();
    let d = dists[m - 1];
    let v = w[0];
    let i = 0;

    // first select distribution
    for (; i < m - 1; v += w[++i]) {
      if (r < v) {
        d = dists[i];
        break;
      }
    }
    // then sample from it
    return d.sample();
  };

  dist.pdf = function (x) {
    let p = 0;
    for (let i = 0; i < m; ++i) {
      p += w[i] * dists[i].pdf(x);
    }
    return p;
  };

  dist.cdf = function (x) {
    let p = 0;
    for (let i = 0; i < m; ++i) {
      p += w[i] * dists[i].cdf(x);
    }
    return p;
  };

  dist.icdf = function () {
    throw Error('Mixture icdf not supported.');
  };

  return dist.distributions(dists).weights(weights);
}
