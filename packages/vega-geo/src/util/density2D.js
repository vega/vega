import {estimateBandwidth} from 'vega-statistics';
import {constant, error, one} from 'vega-util';
import {sum} from 'd3-array';

function bw(bandwidth, data, x, y) {
  const v = bandwidth || Math.max(
    estimateBandwidth(data, x),
    estimateBandwidth(data, y)
  );
  return Math.round((Math.sqrt(4 * v * v + 1) - 1) / 2);
}

// Implementation adapted from d3/d3-contour. Thanks!
export default function() {
  var x = d => d[0],
      y = d => d[1],
      weight = one,
      dx = 960,
      dy = 500,
      k = 2, // log2(grid cell size)
      bandwidth = 0;

  function density(data, counts) {
    const r = bw(bandwidth, data, x, y), // blur radius
          o = r * 3, // grid offset, to pad for blur
          n = (dx + o * 2) >> k, // grid width
          m = (dy + o * 2) >> k, // grid height
          values0 = new Float32Array(n * m),
          values1 = new Float32Array(n * m);

    data.forEach(function(d, i, data) {
      const xi = (+x(d, i, data) + o) >> k,
            yi = (+y(d, i, data) + o) >> k;

      if (xi >= 0 && xi < n && yi >= 0 && yi < m) {
        values0[xi + yi * n] += +weight(d, i, data);
      }
    });

    const b = r >> k;
    blurX(n, m, values0, values1, b);
    blurY(n, m, values1, values0, b);
    blurX(n, m, values0, values1, b);
    blurY(n, m, values1, values0, b);
    blurX(n, m, values0, values1, b);
    blurY(n, m, values1, values0, b);

    // scale density estimates
    // density in points per square pixel or probability density
    const s = counts ? Math.pow(2, -2 * k) : 1 / sum(values0);
    for (let i=0, sz=n*m; i<sz; ++i) values0[i] *= s;

    return {
      values: values0,
      scale: 1 << k,
      width: n,
      height: m,
      x1: o >> k,
      y1: o >> k,
      x2: (dx + o) >> k,
      y2: (dy + o) >> k
    };
  }

  density.x = function(_) {
    return arguments.length ? (x = typeof _ === 'function' ? _ : constant(+_), density) : x;
  };

  density.y = function(_) {
    return arguments.length ? (y = typeof _ === 'function' ? _ : constant(+_), density) : y;
  };

  density.weight = function(_) {
    return arguments.length ? (weight = typeof _ === 'function' ? _ : constant(+_), density) : weight;
  };

  density.size = function(_) {
    if (!arguments.length) return [dx, dy];
    var _0 = Math.ceil(_[0]), _1 = Math.ceil(_[1]);
    if (!(_0 >= 0) && !(_0 >= 0)) error('invalid size');
    return dx = _0, dy = _1, density;
  };

  density.cellSize = function(_) {
    if (!arguments.length) return 1 << k;
    if (!((_ = +_) >= 1)) error('invalid cell size');
    k = Math.floor(Math.log(_) / Math.LN2);
    return density;
  };

  density.bandwidth = function(_) {
    if (!arguments.length) return bandwidth;
    if (!((_ = +_) >= 0)) error('invalid bandwidth');
    return bandwidth = _, density;
  };

  return density;
}

function blurX(n, m, source, target, r) {
  const w = (r << 1) + 1;
  for (let j = 0; j < m; ++j) {
    for (let i = 0, sr = 0; i < n + r; ++i) {
      if (i < n) {
        sr += source[i + j * n];
      }
      if (i >= r) {
        if (i >= w) {
          sr -= source[i - w + j * n];
        }
        target[i - r + j * n] = sr / Math.min(i + 1, n - 1 + w - i, w);
      }
    }
  }
}

function blurY(n, m, source, target, r) {
  const w = (r << 1) + 1;
  for (let i = 0; i < n; ++i) {
    for (let j = 0, sr = 0; j < m + r; ++j) {
      if (j < m) {
        sr += source[i + j * n];
      }
      if (j >= r) {
        if (j >= w) {
          sr -= source[i + (j - w) * n];
        }
        target[i + (j - r) * n] = sr / Math.min(j + 1, m - 1 + w - j, w);
      }
    }
  }
}