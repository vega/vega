import { Transform, rederive, ingest, replace } from 'vega-dataflow';
import { error, extent, inherits, identity, isArray, isFunction, isNumber, array, constant, one, accessorName, accessorFields, field, extend, toSet, zero } from 'vega-util';
import { tickStep, range, max, sum } from 'd3-array';
import { bandwidthNRD } from 'vega-statistics';
import { getProjectionPath, projectionProperties, projection } from 'vega-projection';
import { geoGraticule } from 'd3-geo';
import { rgb } from 'd3-color';
import { canvas } from 'vega-canvas';

function noop() {}
const cases = [[], [[[1.0, 1.5], [0.5, 1.0]]], [[[1.5, 1.0], [1.0, 1.5]]], [[[1.5, 1.0], [0.5, 1.0]]], [[[1.0, 0.5], [1.5, 1.0]]], [[[1.0, 1.5], [0.5, 1.0]], [[1.0, 0.5], [1.5, 1.0]]], [[[1.0, 0.5], [1.0, 1.5]]], [[[1.0, 0.5], [0.5, 1.0]]], [[[0.5, 1.0], [1.0, 0.5]]], [[[1.0, 1.5], [1.0, 0.5]]], [[[0.5, 1.0], [1.0, 0.5]], [[1.5, 1.0], [1.0, 1.5]]], [[[1.5, 1.0], [1.0, 0.5]]], [[[0.5, 1.0], [1.5, 1.0]]], [[[1.0, 1.5], [1.5, 1.0]]], [[[0.5, 1.0], [1.0, 1.5]]], []];

// Implementation adapted from d3/d3-contour. Thanks!
function contours () {
  var dx = 1,
    dy = 1,
    smooth = smoothLinear;
  function contours(values, tz) {
    return tz.map(value => contour(values, value));
  }

  // Accumulate, smooth contour rings, assign holes to exterior rings.
  // Based on https://github.com/mbostock/shapefile/blob/v0.6.2/shp/polygon.js
  function contour(values, value) {
    var polygons = [],
      holes = [];
    isorings(values, value, ring => {
      smooth(ring, values, value);
      if (area(ring) > 0) polygons.push([ring]);else holes.push(ring);
    });
    holes.forEach(hole => {
      for (var i = 0, n = polygons.length, polygon; i < n; ++i) {
        if (contains((polygon = polygons[i])[0], hole) !== -1) {
          polygon.push(hole);
          return;
        }
      }
    });
    return {
      type: 'MultiPolygon',
      value: value,
      coordinates: polygons
    };
  }

  // Marching squares with isolines stitched into rings.
  // Based on https://github.com/topojson/topojson-client/blob/v3.0.0/src/stitch.js
  function isorings(values, value, callback) {
    var fragmentByStart = new Array(),
      fragmentByEnd = new Array(),
      x,
      y,
      t0,
      t1,
      t2,
      t3;

    // Special case for the first row (y = -1, t2 = t3 = 0).
    x = y = -1;
    t1 = values[0] >= value;
    cases[t1 << 1].forEach(stitch);
    while (++x < dx - 1) {
      t0 = t1, t1 = values[x + 1] >= value;
      cases[t0 | t1 << 1].forEach(stitch);
    }
    cases[t1 << 0].forEach(stitch);

    // General case for the intermediate rows.
    while (++y < dy - 1) {
      x = -1;
      t1 = values[y * dx + dx] >= value;
      t2 = values[y * dx] >= value;
      cases[t1 << 1 | t2 << 2].forEach(stitch);
      while (++x < dx - 1) {
        t0 = t1, t1 = values[y * dx + dx + x + 1] >= value;
        t3 = t2, t2 = values[y * dx + x + 1] >= value;
        cases[t0 | t1 << 1 | t2 << 2 | t3 << 3].forEach(stitch);
      }
      cases[t1 | t2 << 3].forEach(stitch);
    }

    // Special case for the last row (y = dy - 1, t0 = t1 = 0).
    x = -1;
    t2 = values[y * dx] >= value;
    cases[t2 << 2].forEach(stitch);
    while (++x < dx - 1) {
      t3 = t2, t2 = values[y * dx + x + 1] >= value;
      cases[t2 << 2 | t3 << 3].forEach(stitch);
    }
    cases[t2 << 3].forEach(stitch);
    function stitch(line) {
      var start = [line[0][0] + x, line[0][1] + y],
        end = [line[1][0] + x, line[1][1] + y],
        startIndex = index(start),
        endIndex = index(end),
        f,
        g;
      if (f = fragmentByEnd[startIndex]) {
        if (g = fragmentByStart[endIndex]) {
          delete fragmentByEnd[f.end];
          delete fragmentByStart[g.start];
          if (f === g) {
            f.ring.push(end);
            callback(f.ring);
          } else {
            fragmentByStart[f.start] = fragmentByEnd[g.end] = {
              start: f.start,
              end: g.end,
              ring: f.ring.concat(g.ring)
            };
          }
        } else {
          delete fragmentByEnd[f.end];
          f.ring.push(end);
          fragmentByEnd[f.end = endIndex] = f;
        }
      } else if (f = fragmentByStart[endIndex]) {
        if (g = fragmentByEnd[startIndex]) {
          delete fragmentByStart[f.start];
          delete fragmentByEnd[g.end];
          if (f === g) {
            f.ring.push(end);
            callback(f.ring);
          } else {
            fragmentByStart[g.start] = fragmentByEnd[f.end] = {
              start: g.start,
              end: f.end,
              ring: g.ring.concat(f.ring)
            };
          }
        } else {
          delete fragmentByStart[f.start];
          f.ring.unshift(start);
          fragmentByStart[f.start = startIndex] = f;
        }
      } else {
        fragmentByStart[startIndex] = fragmentByEnd[endIndex] = {
          start: startIndex,
          end: endIndex,
          ring: [start, end]
        };
      }
    }
  }
  function index(point) {
    return point[0] * 2 + point[1] * (dx + 1) * 4;
  }
  function smoothLinear(ring, values, value) {
    ring.forEach(point => {
      var x = point[0],
        y = point[1],
        xt = x | 0,
        yt = y | 0,
        v0,
        v1 = values[yt * dx + xt];
      if (x > 0 && x < dx && xt === x) {
        v0 = values[yt * dx + xt - 1];
        point[0] = x + (value - v0) / (v1 - v0) - 0.5;
      }
      if (y > 0 && y < dy && yt === y) {
        v0 = values[(yt - 1) * dx + xt];
        point[1] = y + (value - v0) / (v1 - v0) - 0.5;
      }
    });
  }
  contours.contour = contour;
  contours.size = function (_) {
    if (!arguments.length) return [dx, dy];
    var _0 = Math.floor(_[0]),
      _1 = Math.floor(_[1]);
    if (!(_0 >= 0 && _1 >= 0)) error('invalid size');
    return dx = _0, dy = _1, contours;
  };
  contours.smooth = function (_) {
    return arguments.length ? (smooth = _ ? smoothLinear : noop, contours) : smooth === smoothLinear;
  };
  return contours;
}
function area(ring) {
  var i = 0,
    n = ring.length,
    area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  return area;
}
function contains(ring, hole) {
  var i = -1,
    n = hole.length,
    c;
  while (++i < n) if (c = ringContains(ring, hole[i])) return c;
  return 0;
}
function ringContains(ring, point) {
  var x = point[0],
    y = point[1],
    contains = -1;
  for (var i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
    var pi = ring[i],
      xi = pi[0],
      yi = pi[1],
      pj = ring[j],
      xj = pj[0],
      yj = pj[1];
    if (segmentContains(pi, pj, point)) return 0;
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) contains = -contains;
  }
  return contains;
}
function segmentContains(a, b, c) {
  var i;
  return collinear(a, b, c) && within(a[i = +(a[0] === b[0])], c[i], b[i]);
}
function collinear(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) === (c[0] - a[0]) * (b[1] - a[1]);
}
function within(p, q, r) {
  return p <= q && q <= r || r <= q && q <= p;
}

function quantize (k, nice, zero) {
  return function (values) {
    var ex = extent(values),
      start = zero ? Math.min(ex[0], 0) : ex[0],
      stop = ex[1],
      span = stop - start,
      step = nice ? tickStep(start, stop, k) : span / (k + 1);
    return range(start + step, stop, step);
  };
}

/**
 * Generate isocontours (level sets) based on input raster grid data.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} [params.field] - The field with raster grid
 *   data. If unspecified, the tuple itself is interpreted as a raster grid.
 * @param {Array<number>} [params.thresholds] - Contour threshold array. If
 *   specified, the levels, nice, resolve, and zero parameters are ignored.
 * @param {number} [params.levels] - The desired number of contour levels.
 * @param {boolean} [params.nice] - Boolean flag indicating if the contour
 *   threshold values should be automatically aligned to "nice"
 *   human-friendly values. Setting this flag may cause the number of
 *   thresholds to deviate from the specified levels.
 * @param {string} [params.resolve] - The method for resolving thresholds
 *   across multiple input grids. If 'independent' (the default), threshold
 *   calculation will be performed separately for each grid. If 'shared', a
 *   single set of threshold values will be used for all input grids.
 * @param {boolean} [params.zero] - Boolean flag indicating if the contour
 *   threshold values should include zero.
 * @param {boolean} [params.smooth] - Boolean flag indicating if the contour
 *   polygons should be smoothed using linear interpolation. The default is
 *   true. The parameter is ignored when using density estimation.
 * @param {boolean} [params.scale] - Optional numerical value by which to
 *   scale the output isocontour coordinates. This parameter can be useful
 *   to scale the contours to match a desired output resolution.
 * @param {string} [params.as='contour'] - The output field in which to store
 *   the generated isocontour data (default 'contour').
 */
function Isocontour(params) {
  Transform.call(this, null, params);
}
Isocontour.Definition = {
  'type': 'Isocontour',
  'metadata': {
    'generates': true
  },
  'params': [{
    'name': 'field',
    'type': 'field'
  }, {
    'name': 'thresholds',
    'type': 'number',
    'array': true
  }, {
    'name': 'levels',
    'type': 'number'
  }, {
    'name': 'nice',
    'type': 'boolean',
    'default': false
  }, {
    'name': 'resolve',
    'type': 'enum',
    'values': ['shared', 'independent'],
    'default': 'independent'
  }, {
    'name': 'zero',
    'type': 'boolean',
    'default': true
  }, {
    'name': 'smooth',
    'type': 'boolean',
    'default': true
  }, {
    'name': 'scale',
    'type': 'number',
    'expr': true
  }, {
    'name': 'translate',
    'type': 'number',
    'array': true,
    'expr': true
  }, {
    'name': 'as',
    'type': 'string',
    'null': true,
    'default': 'contour'
  }]
};
inherits(Isocontour, Transform, {
  transform(_, pulse) {
    if (this.value && !pulse.changed() && !_.modified()) {
      return pulse.StopPropagation;
    }
    var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      source = pulse.materialize(pulse.SOURCE).source,
      field = _.field || identity,
      contour = contours().smooth(_.smooth !== false),
      tz = _.thresholds || levels(source, field, _),
      as = _.as === null ? null : _.as || 'contour',
      values = [];
    source.forEach(t => {
      const grid = field(t);

      // generate contour paths in GeoJSON format
      const paths = contour.size([grid.width, grid.height])(grid.values, isArray(tz) ? tz : tz(grid.values));

      // adjust contour path coordinates as needed
      transformPaths(paths, grid, t, _);

      // ingest; copy source data properties to output
      paths.forEach(p => {
        values.push(rederive(t, ingest(as != null ? {
          [as]: p
        } : p)));
      });
    });
    if (this.value) out.rem = this.value;
    this.value = out.source = out.add = values;
    return out;
  }
});
function levels(values, f, _) {
  const q = quantize(_.levels || 10, _.nice, _.zero !== false);
  return _.resolve !== 'shared' ? q : q(values.map(t => max(f(t).values)));
}
function transformPaths(paths, grid, datum, _) {
  let s = _.scale || grid.scale,
    t = _.translate || grid.translate;
  if (isFunction(s)) s = s(datum, _);
  if (isFunction(t)) t = t(datum, _);
  if ((s === 1 || s == null) && !t) return;
  const sx = (isNumber(s) ? s : s[0]) || 1,
    sy = (isNumber(s) ? s : s[1]) || 1,
    tx = t && t[0] || 0,
    ty = t && t[1] || 0;
  paths.forEach(transform(grid, sx, sy, tx, ty));
}
function transform(grid, sx, sy, tx, ty) {
  const x1 = grid.x1 || 0,
    y1 = grid.y1 || 0,
    flip = sx * sy < 0;
  function transformPolygon(coordinates) {
    coordinates.forEach(transformRing);
  }
  function transformRing(coordinates) {
    if (flip) coordinates.reverse(); // maintain winding order
    coordinates.forEach(transformPoint);
  }
  function transformPoint(coordinates) {
    coordinates[0] = (coordinates[0] - x1) * sx + tx;
    coordinates[1] = (coordinates[1] - y1) * sy + ty;
  }
  return function (geometry) {
    geometry.coordinates.forEach(transformPolygon);
    return geometry;
  };
}

function radius(bw, data, f) {
  const v = bw >= 0 ? bw : bandwidthNRD(data, f);
  return Math.round((Math.sqrt(4 * v * v + 1) - 1) / 2);
}
function number(_) {
  return isFunction(_) ? _ : constant(+_);
}

// Implementation adapted from d3/d3-contour. Thanks!
function density2D () {
  var x = d => d[0],
    y = d => d[1],
    weight = one,
    bandwidth = [-1, -1],
    dx = 960,
    dy = 500,
    k = 2; // log2(cellSize)

  function density(data, counts) {
    const rx = radius(bandwidth[0], data, x) >> k,
      // blur x-radius
      ry = radius(bandwidth[1], data, y) >> k,
      // blur y-radius
      ox = rx ? rx + 2 : 0,
      // x-offset padding for blur
      oy = ry ? ry + 2 : 0,
      // y-offset padding for blur
      n = 2 * ox + (dx >> k),
      // grid width
      m = 2 * oy + (dy >> k),
      // grid height
      values0 = new Float32Array(n * m),
      values1 = new Float32Array(n * m);
    let values = values0;
    data.forEach(d => {
      const xi = ox + (+x(d) >> k),
        yi = oy + (+y(d) >> k);
      if (xi >= 0 && xi < n && yi >= 0 && yi < m) {
        values0[xi + yi * n] += +weight(d);
      }
    });
    if (rx > 0 && ry > 0) {
      blurX(n, m, values0, values1, rx);
      blurY(n, m, values1, values0, ry);
      blurX(n, m, values0, values1, rx);
      blurY(n, m, values1, values0, ry);
      blurX(n, m, values0, values1, rx);
      blurY(n, m, values1, values0, ry);
    } else if (rx > 0) {
      blurX(n, m, values0, values1, rx);
      blurX(n, m, values1, values0, rx);
      blurX(n, m, values0, values1, rx);
      values = values1;
    } else if (ry > 0) {
      blurY(n, m, values0, values1, ry);
      blurY(n, m, values1, values0, ry);
      blurY(n, m, values0, values1, ry);
      values = values1;
    }

    // scale density estimates
    // density in points per square pixel or probability density
    const s = counts ? Math.pow(2, -2 * k) : 1 / sum(values);
    for (let i = 0, sz = n * m; i < sz; ++i) values[i] *= s;
    return {
      values: values,
      scale: 1 << k,
      width: n,
      height: m,
      x1: ox,
      y1: oy,
      x2: ox + (dx >> k),
      y2: oy + (dy >> k)
    };
  }
  density.x = function (_) {
    return arguments.length ? (x = number(_), density) : x;
  };
  density.y = function (_) {
    return arguments.length ? (y = number(_), density) : y;
  };
  density.weight = function (_) {
    return arguments.length ? (weight = number(_), density) : weight;
  };
  density.size = function (_) {
    if (!arguments.length) return [dx, dy];
    var _0 = +_[0],
      _1 = +_[1];
    if (!(_0 >= 0 && _1 >= 0)) error('invalid size');
    return dx = _0, dy = _1, density;
  };
  density.cellSize = function (_) {
    if (!arguments.length) return 1 << k;
    if (!((_ = +_) >= 1)) error('invalid cell size');
    k = Math.floor(Math.log(_) / Math.LN2);
    return density;
  };
  density.bandwidth = function (_) {
    if (!arguments.length) return bandwidth;
    _ = array(_);
    if (_.length === 1) _ = [+_[0], +_[0]];
    if (_.length !== 2) error('invalid bandwidth');
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

/**
 * Perform 2D kernel-density estimation of point data.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<number>} params.size - The [width, height] extent (in
 *   units of input pixels) over which to perform density estimation.
 * @param {function(object): number} params.x - The x-coordinate accessor.
 * @param {function(object): number} params.y - The y-coordinate accessor.
 * @param {function(object): number} [params.weight] - The weight accessor.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors
 *   to groupby.
 * @param {number} [params.cellSize] - Contour density calculation cell size.
 *   This parameter determines the level of spatial approximation. For example,
 *   the default value of 4 maps to 2x reductions in both x- and y- dimensions.
 *   A value of 1 will result in an output raster grid whose dimensions exactly
 *   matches the size parameter.
 * @param {Array<number>} [params.bandwidth] - The KDE kernel bandwidths,
 *   in pixels. The input can be a two-element array specifying separate
 *   x and y bandwidths, or a single-element array specifying both. If the
 *   bandwidth is unspecified or less than zero, the bandwidth will be
 *   automatically determined.
 * @param {boolean} [params.counts=false] - A boolean flag indicating if the
 *   output values should be probability estimates (false, default) or
 *   smoothed counts (true).
 * @param {string} [params.as='grid'] - The output field in which to store
 *   the generated raster grid (default 'grid').
 */
function KDE2D(params) {
  Transform.call(this, null, params);
}
KDE2D.Definition = {
  'type': 'KDE2D',
  'metadata': {
    'generates': true
  },
  'params': [{
    'name': 'size',
    'type': 'number',
    'array': true,
    'length': 2,
    'required': true
  }, {
    'name': 'x',
    'type': 'field',
    'required': true
  }, {
    'name': 'y',
    'type': 'field',
    'required': true
  }, {
    'name': 'weight',
    'type': 'field'
  }, {
    'name': 'groupby',
    'type': 'field',
    'array': true
  }, {
    'name': 'cellSize',
    'type': 'number'
  }, {
    'name': 'bandwidth',
    'type': 'number',
    'array': true,
    'length': 2
  }, {
    'name': 'counts',
    'type': 'boolean',
    'default': false
  }, {
    'name': 'as',
    'type': 'string',
    'default': 'grid'
  }]
};
const PARAMS = ['x', 'y', 'weight', 'size', 'cellSize', 'bandwidth'];
function params(obj, _) {
  PARAMS.forEach(param => _[param] != null ? obj[param](_[param]) : 0);
  return obj;
}
inherits(KDE2D, Transform, {
  transform(_, pulse) {
    if (this.value && !pulse.changed() && !_.modified()) return pulse.StopPropagation;
    var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      source = pulse.materialize(pulse.SOURCE).source,
      groups = partition(source, _.groupby),
      names = (_.groupby || []).map(accessorName),
      kde = params(density2D(), _),
      as = _.as || 'grid',
      values = [];
    function set(t, vals) {
      for (let i = 0; i < names.length; ++i) t[names[i]] = vals[i];
      return t;
    }

    // generate density raster grids
    values = groups.map(g => ingest(set({
      [as]: kde(g, _.counts)
    }, g.dims)));
    if (this.value) out.rem = this.value;
    this.value = out.source = out.add = values;
    return out;
  }
});
function partition(data, groupby) {
  var groups = [],
    get = f => f(t),
    map,
    i,
    n,
    t,
    k,
    g;

  // partition data points into groups
  if (groupby == null) {
    groups.push(data);
  } else {
    for (map = {}, i = 0, n = data.length; i < n; ++i) {
      t = data[i];
      k = groupby.map(get);
      g = map[k];
      if (!g) {
        map[k] = g = [];
        g.dims = k;
        groups.push(g);
      }
      g.push(t);
    }
  }
  return groups;
}

/**
 * Generate contours based on kernel-density estimation of point data.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<number>} params.size - The dimensions [width, height] over which to compute contours.
 *  If the values parameter is provided, this must be the dimensions of the input data.
 *  If density estimation is performed, this is the output view dimensions in pixels.
 * @param {Array<number>} [params.values] - An array of numeric values representing an
 *  width x height grid of values over which to compute contours. If unspecified, this
 *  transform will instead attempt to compute contours for the kernel density estimate
 *  using values drawn from data tuples in the input pulse.
 * @param {function(object): number} [params.x] - The pixel x-coordinate accessor for density estimation.
 * @param {function(object): number} [params.y] - The pixel y-coordinate accessor for density estimation.
 * @param {function(object): number} [params.weight] - The data point weight accessor for density estimation.
 * @param {number} [params.cellSize] - Contour density calculation cell size.
 * @param {number} [params.bandwidth] - Kernel density estimation bandwidth.
 * @param {Array<number>} [params.thresholds] - Contour threshold array. If
 *   this parameter is set, the count and nice parameters will be ignored.
 * @param {number} [params.count] - The desired number of contours.
 * @param {boolean} [params.nice] - Boolean flag indicating if the contour
 *   threshold values should be automatically aligned to "nice"
 *   human-friendly values. Setting this flag may cause the number of
 *   thresholds to deviate from the specified count.
 * @param {boolean} [params.smooth] - Boolean flag indicating if the contour
 *   polygons should be smoothed using linear interpolation. The default is
 *   true. The parameter is ignored when using density estimation.
 */
function Contour(params) {
  Transform.call(this, null, params);
}
Contour.Definition = {
  'type': 'Contour',
  'metadata': {
    'generates': true
  },
  'params': [{
    'name': 'size',
    'type': 'number',
    'array': true,
    'length': 2,
    'required': true
  }, {
    'name': 'values',
    'type': 'number',
    'array': true
  }, {
    'name': 'x',
    'type': 'field'
  }, {
    'name': 'y',
    'type': 'field'
  }, {
    'name': 'weight',
    'type': 'field'
  }, {
    'name': 'cellSize',
    'type': 'number'
  }, {
    'name': 'bandwidth',
    'type': 'number'
  }, {
    'name': 'count',
    'type': 'number'
  }, {
    'name': 'nice',
    'type': 'boolean',
    'default': false
  }, {
    'name': 'thresholds',
    'type': 'number',
    'array': true
  }, {
    'name': 'smooth',
    'type': 'boolean',
    'default': true
  }]
};
inherits(Contour, Transform, {
  transform(_, pulse) {
    if (this.value && !pulse.changed() && !_.modified()) {
      return pulse.StopPropagation;
    }
    var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      contour = contours().smooth(_.smooth !== false),
      values = _.values,
      thresh = _.thresholds || quantize(_.count || 10, _.nice, !!values),
      size = _.size,
      grid,
      post;
    if (!values) {
      values = pulse.materialize(pulse.SOURCE).source;
      grid = params(density2D(), _)(values, true);
      post = transform(grid, grid.scale || 1, grid.scale || 1, 0, 0);
      size = [grid.width, grid.height];
      values = grid.values;
    }
    thresh = isArray(thresh) ? thresh : thresh(values);
    values = contour.size(size)(values, thresh);
    if (post) values.forEach(post);
    if (this.value) out.rem = this.value;
    this.value = out.source = out.add = (values || []).map(ingest);
    return out;
  }
});

const Feature = 'Feature';
const FeatureCollection = 'FeatureCollection';
const MultiPoint = 'MultiPoint';

/**
 * Consolidate an array of [longitude, latitude] points or GeoJSON features
 * into a combined GeoJSON object. This transform is particularly useful for
 * combining geo data for a Projection's fit argument. The resulting GeoJSON
 * data is available as this transform's value. Input pulses are unchanged.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} [params.fields] - A two-element array
 *   of field accessors for the longitude and latitude values.
 * @param {function(object): *} params.geojson - A field accessor for
 *   retrieving GeoJSON feature data.
 */
function GeoJSON(params) {
  Transform.call(this, null, params);
}
GeoJSON.Definition = {
  'type': 'GeoJSON',
  'metadata': {},
  'params': [{
    'name': 'fields',
    'type': 'field',
    'array': true,
    'length': 2
  }, {
    'name': 'geojson',
    'type': 'field'
  }]
};
inherits(GeoJSON, Transform, {
  transform(_, pulse) {
    var features = this._features,
      points = this._points,
      fields = _.fields,
      lon = fields && fields[0],
      lat = fields && fields[1],
      geojson = _.geojson || !fields && identity,
      flag = pulse.ADD,
      mod;
    mod = _.modified() || pulse.changed(pulse.REM) || pulse.modified(accessorFields(geojson)) || lon && pulse.modified(accessorFields(lon)) || lat && pulse.modified(accessorFields(lat));
    if (!this.value || mod) {
      flag = pulse.SOURCE;
      this._features = features = [];
      this._points = points = [];
    }
    if (geojson) {
      pulse.visit(flag, t => features.push(geojson(t)));
    }
    if (lon && lat) {
      pulse.visit(flag, t => {
        var x = lon(t),
          y = lat(t);
        if (x != null && y != null && (x = +x) === x && (y = +y) === y) {
          points.push([x, y]);
        }
      });
      features = features.concat({
        type: Feature,
        geometry: {
          type: MultiPoint,
          coordinates: points
        }
      });
    }
    this.value = {
      type: FeatureCollection,
      features: features
    };
  }
});

/**
 * Map GeoJSON data to an SVG path string.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {function(object): *} [params.field] - The field with GeoJSON data,
 *   or null if the tuple itself is a GeoJSON feature.
 * @param {string} [params.as='path'] - The output field in which to store
 *   the generated path data (default 'path').
 */
function GeoPath(params) {
  Transform.call(this, null, params);
}
GeoPath.Definition = {
  'type': 'GeoPath',
  'metadata': {
    'modifies': true
  },
  'params': [{
    'name': 'projection',
    'type': 'projection'
  }, {
    'name': 'field',
    'type': 'field'
  }, {
    'name': 'pointRadius',
    'type': 'number',
    'expr': true
  }, {
    'name': 'as',
    'type': 'string',
    'default': 'path'
  }]
};
inherits(GeoPath, Transform, {
  transform(_, pulse) {
    var out = pulse.fork(pulse.ALL),
      path = this.value,
      field = _.field || identity,
      as = _.as || 'path',
      flag = out.SOURCE;
    if (!path || _.modified()) {
      // parameters updated, reset and reflow
      this.value = path = getProjectionPath(_.projection);
      out.materialize().reflow();
    } else {
      flag = field === identity || pulse.modified(field.fields) ? out.ADD_MOD : out.ADD;
    }
    const prev = initPath(path, _.pointRadius);
    out.visit(flag, t => t[as] = path(field(t)));
    path.pointRadius(prev);
    return out.modifies(as);
  }
});
function initPath(path, pointRadius) {
  const prev = path.pointRadius();
  path.context(null);
  if (pointRadius != null) {
    path.pointRadius(pointRadius);
  }
  return prev;
}

/**
 * Geo-code a longitude/latitude point to an x/y coordinate.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {Array<function(object): *>} params.fields - A two-element array of
 *   field accessors for the longitude and latitude values.
 * @param {Array<string>} [params.as] - A two-element array of field names
 *   under which to store the result. Defaults to ['x','y'].
 */
function GeoPoint(params) {
  Transform.call(this, null, params);
}
GeoPoint.Definition = {
  'type': 'GeoPoint',
  'metadata': {
    'modifies': true
  },
  'params': [{
    'name': 'projection',
    'type': 'projection',
    'required': true
  }, {
    'name': 'fields',
    'type': 'field',
    'array': true,
    'required': true,
    'length': 2
  }, {
    'name': 'as',
    'type': 'string',
    'array': true,
    'length': 2,
    'default': ['x', 'y']
  }]
};
inherits(GeoPoint, Transform, {
  transform(_, pulse) {
    var proj = _.projection,
      lon = _.fields[0],
      lat = _.fields[1],
      as = _.as || ['x', 'y'],
      x = as[0],
      y = as[1],
      mod;
    function set(t) {
      const xy = proj([lon(t), lat(t)]);
      if (xy) {
        t[x] = xy[0];
        t[y] = xy[1];
      } else {
        t[x] = undefined;
        t[y] = undefined;
      }
    }
    if (_.modified()) {
      // parameters updated, reflow
      pulse = pulse.materialize().reflow(true).visit(pulse.SOURCE, set);
    } else {
      mod = pulse.modified(lon.fields) || pulse.modified(lat.fields);
      pulse.visit(mod ? pulse.ADD_MOD : pulse.ADD, set);
    }
    return pulse.modifies(as);
  }
});

/**
 * Annotate items with a geopath shape generator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {function(object): *} [params.field] - The field with GeoJSON data,
 *   or null if the tuple itself is a GeoJSON feature.
 * @param {string} [params.as='shape'] - The output field in which to store
 *   the generated path data (default 'shape').
 */
function GeoShape(params) {
  Transform.call(this, null, params);
}
GeoShape.Definition = {
  'type': 'GeoShape',
  'metadata': {
    'modifies': true,
    'nomod': true
  },
  'params': [{
    'name': 'projection',
    'type': 'projection'
  }, {
    'name': 'field',
    'type': 'field',
    'default': 'datum'
  }, {
    'name': 'pointRadius',
    'type': 'number',
    'expr': true
  }, {
    'name': 'as',
    'type': 'string',
    'default': 'shape'
  }]
};
inherits(GeoShape, Transform, {
  transform(_, pulse) {
    var out = pulse.fork(pulse.ALL),
      shape = this.value,
      as = _.as || 'shape',
      flag = out.ADD;
    if (!shape || _.modified()) {
      // parameters updated, reset and reflow
      this.value = shape = shapeGenerator(getProjectionPath(_.projection), _.field || field('datum'), _.pointRadius);
      out.materialize().reflow();
      flag = out.SOURCE;
    }
    out.visit(flag, t => t[as] = shape);
    return out.modifies(as);
  }
});
function shapeGenerator(path, field, pointRadius) {
  const shape = pointRadius == null ? _ => path(field(_)) : _ => {
    var prev = path.pointRadius(),
      value = path.pointRadius(pointRadius)(field(_));
    path.pointRadius(prev);
    return value;
  };
  shape.context = _ => {
    path.context(_);
    return shape;
  };
  return shape;
}

/**
 * GeoJSON feature generator for creating graticules.
 * @constructor
 */
function Graticule(params) {
  Transform.call(this, [], params);
  this.generator = geoGraticule();
}
Graticule.Definition = {
  'type': 'Graticule',
  'metadata': {
    'changes': true,
    'generates': true
  },
  'params': [{
    'name': 'extent',
    'type': 'array',
    'array': true,
    'length': 2,
    'content': {
      'type': 'number',
      'array': true,
      'length': 2
    }
  }, {
    'name': 'extentMajor',
    'type': 'array',
    'array': true,
    'length': 2,
    'content': {
      'type': 'number',
      'array': true,
      'length': 2
    }
  }, {
    'name': 'extentMinor',
    'type': 'array',
    'array': true,
    'length': 2,
    'content': {
      'type': 'number',
      'array': true,
      'length': 2
    }
  }, {
    'name': 'step',
    'type': 'number',
    'array': true,
    'length': 2
  }, {
    'name': 'stepMajor',
    'type': 'number',
    'array': true,
    'length': 2,
    'default': [90, 360]
  }, {
    'name': 'stepMinor',
    'type': 'number',
    'array': true,
    'length': 2,
    'default': [10, 10]
  }, {
    'name': 'precision',
    'type': 'number',
    'default': 2.5
  }]
};
inherits(Graticule, Transform, {
  transform(_, pulse) {
    var src = this.value,
      gen = this.generator,
      t;
    if (!src.length || _.modified()) {
      for (const prop in _) {
        if (isFunction(gen[prop])) {
          gen[prop](_[prop]);
        }
      }
    }
    t = gen();
    if (src.length) {
      pulse.mod.push(replace(src[0], t));
    } else {
      pulse.add.push(ingest(t));
    }
    src[0] = t;
    return pulse;
  }
});

/**
 * Render a heatmap image for input raster grid data.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} [params.field] - The field with raster grid
 *   data. If unspecified, the tuple itself is interpreted as a raster grid.
 * @param {string} [params.color] - A constant color value or function for
 *   individual pixel color. If a function, it will be invoked with an input
 *   object that includes $x, $y, $value, and $max fields for the grid.
 * @param {number} [params.opacity] - A constant opacity value or function for
 *   individual pixel opacity. If a function, it will be invoked with an input
 *   object that includes $x, $y, $value, and $max fields for the grid.
 * @param {string} [params.resolve] - The method for resolving maximum values
 *   across multiple input grids. If 'independent' (the default), maximum
 *   calculation will be performed separately for each grid. If 'shared',
 *   a single global maximum will be used for all input grids.
 * @param {string} [params.as='image'] - The output field in which to store
 *   the generated bitmap canvas images (default 'image').
 */
function Heatmap(params) {
  Transform.call(this, null, params);
}
Heatmap.Definition = {
  'type': 'heatmap',
  'metadata': {
    'modifies': true
  },
  'params': [{
    'name': 'field',
    'type': 'field'
  }, {
    'name': 'color',
    'type': 'string',
    'expr': true
  }, {
    'name': 'opacity',
    'type': 'number',
    'expr': true
  }, {
    'name': 'resolve',
    'type': 'enum',
    'values': ['shared', 'independent'],
    'default': 'independent'
  }, {
    'name': 'as',
    'type': 'string',
    'default': 'image'
  }]
};
inherits(Heatmap, Transform, {
  transform(_, pulse) {
    if (!pulse.changed() && !_.modified()) {
      return pulse.StopPropagation;
    }
    var source = pulse.materialize(pulse.SOURCE).source,
      shared = _.resolve === 'shared',
      field = _.field || identity,
      opacity = opacity_(_.opacity, _),
      color = color_(_.color, _),
      as = _.as || 'image',
      obj = {
        $x: 0,
        $y: 0,
        $value: 0,
        $max: shared ? max(source.map(t => max(field(t).values))) : 0
      };
    source.forEach(t => {
      const v = field(t);

      // build proxy data object
      const o = extend({}, t, obj);
      // set maximum value if not globally shared
      if (!shared) o.$max = max(v.values || []);

      // generate canvas image
      // optimize color/opacity if not pixel-dependent
      t[as] = toCanvas(v, o, color.dep ? color : constant(color(o)), opacity.dep ? opacity : constant(opacity(o)));
    });
    return pulse.reflow(true).modifies(as);
  }
});

// get image color function
function color_(color, _) {
  let f;
  if (isFunction(color)) {
    f = obj => rgb(color(obj, _));
    f.dep = dependency(color);
  } else {
    // default to mid-grey
    f = constant(rgb(color || '#888'));
  }
  return f;
}

// get image opacity function
function opacity_(opacity, _) {
  let f;
  if (isFunction(opacity)) {
    f = obj => opacity(obj, _);
    f.dep = dependency(opacity);
  } else if (opacity) {
    f = constant(opacity);
  } else {
    // default to [0, max] opacity gradient
    f = obj => obj.$value / obj.$max || 0;
    f.dep = true;
  }
  return f;
}

// check if function depends on individual pixel data
function dependency(f) {
  if (!isFunction(f)) return false;
  const set = toSet(accessorFields(f));
  return set.$x || set.$y || set.$value || set.$max;
}

// render raster grid to canvas
function toCanvas(grid, obj, color, opacity) {
  const n = grid.width,
    m = grid.height,
    x1 = grid.x1 || 0,
    y1 = grid.y1 || 0,
    x2 = grid.x2 || n,
    y2 = grid.y2 || m,
    val = grid.values,
    value = val ? i => val[i] : zero,
    can = canvas(x2 - x1, y2 - y1),
    ctx = can.getContext('2d'),
    img = ctx.getImageData(0, 0, x2 - x1, y2 - y1),
    pix = img.data;
  for (let j = y1, k = 0; j < y2; ++j) {
    obj.$y = j - y1;
    for (let i = x1, r = j * n; i < x2; ++i, k += 4) {
      obj.$x = i - x1;
      obj.$value = value(i + r);
      const v = color(obj);
      pix[k + 0] = v.r;
      pix[k + 1] = v.g;
      pix[k + 2] = v.b;
      pix[k + 3] = ~~(255 * opacity(obj));
    }
  }
  ctx.putImageData(img, 0, 0);
  return can;
}

/**
 * Maintains a cartographic projection.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function Projection(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

inherits(Projection, Transform, {
  transform(_, pulse) {
    let proj = this.value;
    if (!proj || _.modified('type')) {
      this.value = proj = create(_.type);
      projectionProperties.forEach(prop => {
        if (_[prop] != null) set(proj, prop, _[prop]);
      });
    } else {
      projectionProperties.forEach(prop => {
        if (_.modified(prop)) set(proj, prop, _[prop]);
      });
    }
    if (_.pointRadius != null) proj.path.pointRadius(_.pointRadius);
    if (_.fit) fit(proj, _);
    return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
  }
});
function fit(proj, _) {
  const data = collectGeoJSON(_.fit);
  _.extent ? proj.fitExtent(_.extent, data) : _.size ? proj.fitSize(_.size, data) : 0;
}
function create(type) {
  const constructor = projection((type || 'mercator').toLowerCase());
  if (!constructor) error('Unrecognized projection type: ' + type);
  return constructor();
}
function set(proj, key, value) {
  if (isFunction(proj[key])) proj[key](value);
}
function collectGeoJSON(data) {
  data = array(data);
  return data.length === 1 ? data[0] : {
    type: FeatureCollection,
    features: data.reduce((a, f) => a.concat(featurize(f)), [])
  };
}
function featurize(f) {
  return f.type === FeatureCollection ? f.features : array(f).filter(d => d != null).map(d => d.type === Feature ? d : {
    type: Feature,
    geometry: d
  });
}

export { Contour as contour, GeoJSON as geojson, GeoPath as geopath, GeoPoint as geopoint, GeoShape as geoshape, Graticule as graticule, Heatmap as heatmap, Isocontour as isocontour, KDE2D as kde2d, Projection as projection };
