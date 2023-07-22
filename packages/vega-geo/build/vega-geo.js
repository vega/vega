(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vega-dataflow'), require('vega-util'), require('vega-statistics'), require('vega-projection'), require('vega-canvas')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vega-dataflow', 'vega-util', 'vega-statistics', 'vega-projection', 'vega-canvas'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.vega = global.vega || {}, global.vega.transforms = {}), global.vega, global.vega, global.vega, global.vega, global.vega));
})(this, (function (exports, vegaDataflow, vegaUtil, vegaStatistics, vegaProjection, vegaCanvas) { 'use strict';

  const e10 = Math.sqrt(50),
    e5 = Math.sqrt(10),
    e2 = Math.sqrt(2);
  function tickSpec(start, stop, count) {
    const step = (stop - start) / Math.max(0, count),
      power = Math.floor(Math.log10(step)),
      error = step / Math.pow(10, power),
      factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
    let i1, i2, inc;
    if (power < 0) {
      inc = Math.pow(10, -power) / factor;
      i1 = Math.round(start * inc);
      i2 = Math.round(stop * inc);
      if (i1 / inc < start) ++i1;
      if (i2 / inc > stop) --i2;
      inc = -inc;
    } else {
      inc = Math.pow(10, power) * factor;
      i1 = Math.round(start / inc);
      i2 = Math.round(stop / inc);
      if (i1 * inc < start) ++i1;
      if (i2 * inc > stop) --i2;
    }
    if (i2 < i1 && 0.5 <= count && count < 2) return tickSpec(start, stop, count * 2);
    return [i1, i2, inc];
  }
  function tickIncrement(start, stop, count) {
    stop = +stop, start = +start, count = +count;
    return tickSpec(start, stop, count)[2];
  }
  function tickStep(start, stop, count) {
    stop = +stop, start = +start, count = +count;
    const reverse = stop < start,
      inc = reverse ? tickIncrement(stop, start, count) : tickIncrement(start, stop, count);
    return (reverse ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
  }

  function max(values, valueof) {
    let max;
    if (valueof === undefined) {
      for (const value of values) {
        if (value != null && (max < value || max === undefined && value >= value)) {
          max = value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null && (max < value || max === undefined && value >= value)) {
          max = value;
        }
      }
    }
    return max;
  }

  function range(start, stop, step) {
    start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;
    var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);
    while (++i < n) {
      range[i] = start + i * step;
    }
    return range;
  }

  function sum(values, valueof) {
    let sum = 0;
    if (valueof === undefined) {
      for (let value of values) {
        if (value = +value) {
          sum += value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if (value = +valueof(value, ++index, values)) {
          sum += value;
        }
      }
    }
    return sum;
  }

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
      if (!(_0 >= 0 && _1 >= 0)) vegaUtil.error('invalid size');
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
      var ex = vegaUtil.extent(values),
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
    vegaDataflow.Transform.call(this, null, params);
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
  vegaUtil.inherits(Isocontour, vegaDataflow.Transform, {
    transform(_, pulse) {
      if (this.value && !pulse.changed() && !_.modified()) {
        return pulse.StopPropagation;
      }
      var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
        source = pulse.materialize(pulse.SOURCE).source,
        field = _.field || vegaUtil.identity,
        contour = contours().smooth(_.smooth !== false),
        tz = _.thresholds || levels(source, field, _),
        as = _.as === null ? null : _.as || 'contour',
        values = [];
      source.forEach(t => {
        const grid = field(t);

        // generate contour paths in GeoJSON format
        const paths = contour.size([grid.width, grid.height])(grid.values, vegaUtil.isArray(tz) ? tz : tz(grid.values));

        // adjust contour path coordinates as needed
        transformPaths(paths, grid, t, _);

        // ingest; copy source data properties to output
        paths.forEach(p => {
          values.push(vegaDataflow.rederive(t, vegaDataflow.ingest(as != null ? {
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
    if (vegaUtil.isFunction(s)) s = s(datum, _);
    if (vegaUtil.isFunction(t)) t = t(datum, _);
    if ((s === 1 || s == null) && !t) return;
    const sx = (vegaUtil.isNumber(s) ? s : s[0]) || 1,
      sy = (vegaUtil.isNumber(s) ? s : s[1]) || 1,
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
    const v = bw >= 0 ? bw : vegaStatistics.bandwidthNRD(data, f);
    return Math.round((Math.sqrt(4 * v * v + 1) - 1) / 2);
  }
  function number(_) {
    return vegaUtil.isFunction(_) ? _ : vegaUtil.constant(+_);
  }

  // Implementation adapted from d3/d3-contour. Thanks!
  function density2D () {
    var x = d => d[0],
      y = d => d[1],
      weight = vegaUtil.one,
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
      if (!(_0 >= 0 && _1 >= 0)) vegaUtil.error('invalid size');
      return dx = _0, dy = _1, density;
    };
    density.cellSize = function (_) {
      if (!arguments.length) return 1 << k;
      if (!((_ = +_) >= 1)) vegaUtil.error('invalid cell size');
      k = Math.floor(Math.log(_) / Math.LN2);
      return density;
    };
    density.bandwidth = function (_) {
      if (!arguments.length) return bandwidth;
      _ = vegaUtil.array(_);
      if (_.length === 1) _ = [+_[0], +_[0]];
      if (_.length !== 2) vegaUtil.error('invalid bandwidth');
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
    vegaDataflow.Transform.call(this, null, params);
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
  vegaUtil.inherits(KDE2D, vegaDataflow.Transform, {
    transform(_, pulse) {
      if (this.value && !pulse.changed() && !_.modified()) return pulse.StopPropagation;
      var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
        source = pulse.materialize(pulse.SOURCE).source,
        groups = partition(source, _.groupby),
        names = (_.groupby || []).map(vegaUtil.accessorName),
        kde = params(density2D(), _),
        as = _.as || 'grid',
        values = [];
      function set(t, vals) {
        for (let i = 0; i < names.length; ++i) t[names[i]] = vals[i];
        return t;
      }

      // generate density raster grids
      values = groups.map(g => vegaDataflow.ingest(set({
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
    vegaDataflow.Transform.call(this, null, params);
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
  vegaUtil.inherits(Contour, vegaDataflow.Transform, {
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
      thresh = vegaUtil.isArray(thresh) ? thresh : thresh(values);
      values = contour.size(size)(values, thresh);
      if (post) values.forEach(post);
      if (this.value) out.rem = this.value;
      this.value = out.source = out.add = (values || []).map(vegaDataflow.ingest);
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
    vegaDataflow.Transform.call(this, null, params);
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
  vegaUtil.inherits(GeoJSON, vegaDataflow.Transform, {
    transform(_, pulse) {
      var features = this._features,
        points = this._points,
        fields = _.fields,
        lon = fields && fields[0],
        lat = fields && fields[1],
        geojson = _.geojson || !fields && vegaUtil.identity,
        flag = pulse.ADD,
        mod;
      mod = _.modified() || pulse.changed(pulse.REM) || pulse.modified(vegaUtil.accessorFields(geojson)) || lon && pulse.modified(vegaUtil.accessorFields(lon)) || lat && pulse.modified(vegaUtil.accessorFields(lat));
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
    vegaDataflow.Transform.call(this, null, params);
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
  vegaUtil.inherits(GeoPath, vegaDataflow.Transform, {
    transform(_, pulse) {
      var out = pulse.fork(pulse.ALL),
        path = this.value,
        field = _.field || vegaUtil.identity,
        as = _.as || 'path',
        flag = out.SOURCE;
      if (!path || _.modified()) {
        // parameters updated, reset and reflow
        this.value = path = vegaProjection.getProjectionPath(_.projection);
        out.materialize().reflow();
      } else {
        flag = field === vegaUtil.identity || pulse.modified(field.fields) ? out.ADD_MOD : out.ADD;
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
    vegaDataflow.Transform.call(this, null, params);
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
  vegaUtil.inherits(GeoPoint, vegaDataflow.Transform, {
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
    vegaDataflow.Transform.call(this, null, params);
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
  vegaUtil.inherits(GeoShape, vegaDataflow.Transform, {
    transform(_, pulse) {
      var out = pulse.fork(pulse.ALL),
        shape = this.value,
        as = _.as || 'shape',
        flag = out.ADD;
      if (!shape || _.modified()) {
        // parameters updated, reset and reflow
        this.value = shape = shapeGenerator(vegaProjection.getProjectionPath(_.projection), _.field || vegaUtil.field('datum'), _.pointRadius);
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

  var epsilon = 1e-6;
  var abs = Math.abs;
  var ceil = Math.ceil;

  function graticuleX(y0, y1, dy) {
    var y = range(y0, y1 - epsilon, dy).concat(y1);
    return function (x) {
      return y.map(function (y) {
        return [x, y];
      });
    };
  }
  function graticuleY(x0, x1, dx) {
    var x = range(x0, x1 - epsilon, dx).concat(x1);
    return function (y) {
      return x.map(function (x) {
        return [x, y];
      });
    };
  }
  function graticule() {
    var x1,
      x0,
      X1,
      X0,
      y1,
      y0,
      Y1,
      Y0,
      dx = 10,
      dy = dx,
      DX = 90,
      DY = 360,
      x,
      y,
      X,
      Y,
      precision = 2.5;
    function graticule() {
      return {
        type: "MultiLineString",
        coordinates: lines()
      };
    }
    function lines() {
      return range(ceil(X0 / DX) * DX, X1, DX).map(X).concat(range(ceil(Y0 / DY) * DY, Y1, DY).map(Y)).concat(range(ceil(x0 / dx) * dx, x1, dx).filter(function (x) {
        return abs(x % DX) > epsilon;
      }).map(x)).concat(range(ceil(y0 / dy) * dy, y1, dy).filter(function (y) {
        return abs(y % DY) > epsilon;
      }).map(y));
    }
    graticule.lines = function () {
      return lines().map(function (coordinates) {
        return {
          type: "LineString",
          coordinates: coordinates
        };
      });
    };
    graticule.outline = function () {
      return {
        type: "Polygon",
        coordinates: [X(X0).concat(Y(Y1).slice(1), X(X1).reverse().slice(1), Y(Y0).reverse().slice(1))]
      };
    };
    graticule.extent = function (_) {
      if (!arguments.length) return graticule.extentMinor();
      return graticule.extentMajor(_).extentMinor(_);
    };
    graticule.extentMajor = function (_) {
      if (!arguments.length) return [[X0, Y0], [X1, Y1]];
      X0 = +_[0][0], X1 = +_[1][0];
      Y0 = +_[0][1], Y1 = +_[1][1];
      if (X0 > X1) _ = X0, X0 = X1, X1 = _;
      if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;
      return graticule.precision(precision);
    };
    graticule.extentMinor = function (_) {
      if (!arguments.length) return [[x0, y0], [x1, y1]];
      x0 = +_[0][0], x1 = +_[1][0];
      y0 = +_[0][1], y1 = +_[1][1];
      if (x0 > x1) _ = x0, x0 = x1, x1 = _;
      if (y0 > y1) _ = y0, y0 = y1, y1 = _;
      return graticule.precision(precision);
    };
    graticule.step = function (_) {
      if (!arguments.length) return graticule.stepMinor();
      return graticule.stepMajor(_).stepMinor(_);
    };
    graticule.stepMajor = function (_) {
      if (!arguments.length) return [DX, DY];
      DX = +_[0], DY = +_[1];
      return graticule;
    };
    graticule.stepMinor = function (_) {
      if (!arguments.length) return [dx, dy];
      dx = +_[0], dy = +_[1];
      return graticule;
    };
    graticule.precision = function (_) {
      if (!arguments.length) return precision;
      precision = +_;
      x = graticuleX(y0, y1, 90);
      y = graticuleY(x0, x1, precision);
      X = graticuleX(Y0, Y1, 90);
      Y = graticuleY(X0, X1, precision);
      return graticule;
    };
    return graticule.extentMajor([[-180, -90 + epsilon], [180, 90 - epsilon]]).extentMinor([[-180, -80 - epsilon], [180, 80 + epsilon]]);
  }

  /**
   * GeoJSON feature generator for creating graticules.
   * @constructor
   */
  function Graticule(params) {
    vegaDataflow.Transform.call(this, [], params);
    this.generator = graticule();
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
  vegaUtil.inherits(Graticule, vegaDataflow.Transform, {
    transform(_, pulse) {
      var src = this.value,
        gen = this.generator,
        t;
      if (!src.length || _.modified()) {
        for (const prop in _) {
          if (vegaUtil.isFunction(gen[prop])) {
            gen[prop](_[prop]);
          }
        }
      }
      t = gen();
      if (src.length) {
        pulse.mod.push(vegaDataflow.replace(src[0], t));
      } else {
        pulse.add.push(vegaDataflow.ingest(t));
      }
      src[0] = t;
      return pulse;
    }
  });

  function define (constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }
  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) prototype[key] = definition[key];
    return prototype;
  }

  function Color() {}
  var darker = 0.7;
  var brighter = 1 / darker;
  var reI = "\\s*([+-]?\\d+)\\s*",
    reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
    reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
    reHex = /^#([0-9a-f]{3,8})$/,
    reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`),
    reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`),
    reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`),
    reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`),
    reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`),
    reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
  var named = {
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0x00ffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0x000000,
    blanchedalmond: 0xffebcd,
    blue: 0x0000ff,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0x00ffff,
    darkblue: 0x00008b,
    darkcyan: 0x008b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x006400,
    darkgrey: 0xa9a9a9,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkslategrey: 0x2f4f4f,
    darkturquoise: 0x00ced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0x00bfff,
    dimgray: 0x696969,
    dimgrey: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x008000,
    greenyellow: 0xadff2f,
    grey: 0x808080,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightgrey: 0xd3d3d3,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightslategrey: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0x00ff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 0x0000cd,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0x00fa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 0x000080,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    slategrey: 0x708090,
    snow: 0xfffafa,
    springgreen: 0x00ff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x008080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32
  };
  define(Color, color, {
    copy(channels) {
      return Object.assign(new this.constructor(), this, channels);
    },
    displayable() {
      return this.rgb().displayable();
    },
    hex: color_formatHex,
    // Deprecated! Use color.formatHex.
    formatHex: color_formatHex,
    formatHex8: color_formatHex8,
    formatHsl: color_formatHsl,
    formatRgb: color_formatRgb,
    toString: color_formatRgb
  });
  function color_formatHex() {
    return this.rgb().formatHex();
  }
  function color_formatHex8() {
    return this.rgb().formatHex8();
  }
  function color_formatHsl() {
    return hslConvert(this).formatHsl();
  }
  function color_formatRgb() {
    return this.rgb().formatRgb();
  }
  function color(format) {
    var m, l;
    format = (format + "").trim().toLowerCase();
    return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
    : l === 3 ? new Rgb(m >> 8 & 0xf | m >> 4 & 0xf0, m >> 4 & 0xf | m & 0xf0, (m & 0xf) << 4 | m & 0xf, 1) // #f00
    : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
    : l === 4 ? rgba(m >> 12 & 0xf | m >> 8 & 0xf0, m >> 8 & 0xf | m >> 4 & 0xf0, m >> 4 & 0xf | m & 0xf0, ((m & 0xf) << 4 | m & 0xf) / 0xff) // #f000
    : null // invalid hex
    ) : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
    : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
    : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
    : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
    : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
    : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
    : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
    : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
  }
  function rgbn(n) {
    return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
  }
  function rgba(r, g, b, a) {
    if (a <= 0) r = g = b = NaN;
    return new Rgb(r, g, b, a);
  }
  function rgbConvert(o) {
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Rgb();
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }
  function rgb(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }
  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }
  define(Rgb, rgb, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb() {
      return this;
    },
    clamp() {
      return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
    },
    displayable() {
      return -0.5 <= this.r && this.r < 255.5 && -0.5 <= this.g && this.g < 255.5 && -0.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
    },
    hex: rgb_formatHex,
    // Deprecated! Use color.formatHex.
    formatHex: rgb_formatHex,
    formatHex8: rgb_formatHex8,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb
  }));
  function rgb_formatHex() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
  }
  function rgb_formatHex8() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
  }
  function rgb_formatRgb() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
  }
  function clampa(opacity) {
    return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
  }
  function clampi(value) {
    return Math.max(0, Math.min(255, Math.round(value) || 0));
  }
  function hex(value) {
    value = clampi(value);
    return (value < 16 ? "0" : "") + value.toString(16);
  }
  function hsla(h, s, l, a) {
    if (a <= 0) h = s = l = NaN;else if (l <= 0 || l >= 1) h = s = NaN;else if (s <= 0) h = NaN;
    return new Hsl(h, s, l, a);
  }
  function hslConvert(o) {
    if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Hsl();
    if (o instanceof Hsl) return o;
    o = o.rgb();
    var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
    if (s) {
      if (r === max) h = (g - b) / s + (g < b) * 6;else if (g === max) h = (b - r) / s + 2;else h = (r - g) / s + 4;
      s /= l < 0.5 ? max + min : 2 - max - min;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }
  function hsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }
  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }
  define(Hsl, hsl, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb() {
      var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
      return new Rgb(hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2), hsl2rgb(h, m1, m2), hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2), this.opacity);
    },
    clamp() {
      return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
    },
    displayable() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
    },
    formatHsl() {
      const a = clampa(this.opacity);
      return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
    }
  }));
  function clamph(value) {
    value = (value || 0) % 360;
    return value < 0 ? value + 360 : value;
  }
  function clampt(value) {
    return Math.max(0, Math.min(1, value || 0));
  }

  /* From FvD 13.37, CSS Color Module Level 3 */
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
  }

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
    vegaDataflow.Transform.call(this, null, params);
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
  vegaUtil.inherits(Heatmap, vegaDataflow.Transform, {
    transform(_, pulse) {
      if (!pulse.changed() && !_.modified()) {
        return pulse.StopPropagation;
      }
      var source = pulse.materialize(pulse.SOURCE).source,
        shared = _.resolve === 'shared',
        field = _.field || vegaUtil.identity,
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
        const o = vegaUtil.extend({}, t, obj);
        // set maximum value if not globally shared
        if (!shared) o.$max = max(v.values || []);

        // generate canvas image
        // optimize color/opacity if not pixel-dependent
        t[as] = toCanvas(v, o, color.dep ? color : vegaUtil.constant(color(o)), opacity.dep ? opacity : vegaUtil.constant(opacity(o)));
      });
      return pulse.reflow(true).modifies(as);
    }
  });

  // get image color function
  function color_(color, _) {
    let f;
    if (vegaUtil.isFunction(color)) {
      f = obj => rgb(color(obj, _));
      f.dep = dependency(color);
    } else {
      // default to mid-grey
      f = vegaUtil.constant(rgb(color || '#888'));
    }
    return f;
  }

  // get image opacity function
  function opacity_(opacity, _) {
    let f;
    if (vegaUtil.isFunction(opacity)) {
      f = obj => opacity(obj, _);
      f.dep = dependency(opacity);
    } else if (opacity) {
      f = vegaUtil.constant(opacity);
    } else {
      // default to [0, max] opacity gradient
      f = obj => obj.$value / obj.$max || 0;
      f.dep = true;
    }
    return f;
  }

  // check if function depends on individual pixel data
  function dependency(f) {
    if (!vegaUtil.isFunction(f)) return false;
    const set = vegaUtil.toSet(vegaUtil.accessorFields(f));
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
      value = val ? i => val[i] : vegaUtil.zero,
      can = vegaCanvas.canvas(x2 - x1, y2 - y1),
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
    vegaDataflow.Transform.call(this, null, params);
    this.modified(true); // always treat as modified
  }

  vegaUtil.inherits(Projection, vegaDataflow.Transform, {
    transform(_, pulse) {
      let proj = this.value;
      if (!proj || _.modified('type')) {
        this.value = proj = create(_.type);
        vegaProjection.projectionProperties.forEach(prop => {
          if (_[prop] != null) set(proj, prop, _[prop]);
        });
      } else {
        vegaProjection.projectionProperties.forEach(prop => {
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
    const constructor = vegaProjection.projection((type || 'mercator').toLowerCase());
    if (!constructor) vegaUtil.error('Unrecognized projection type: ' + type);
    return constructor();
  }
  function set(proj, key, value) {
    if (vegaUtil.isFunction(proj[key])) proj[key](value);
  }
  function collectGeoJSON(data) {
    data = vegaUtil.array(data);
    return data.length === 1 ? data[0] : {
      type: FeatureCollection,
      features: data.reduce((a, f) => a.concat(featurize(f)), [])
    };
  }
  function featurize(f) {
    return f.type === FeatureCollection ? f.features : vegaUtil.array(f).filter(d => d != null).map(d => d.type === Feature ? d : {
      type: Feature,
      geometry: d
    });
  }

  exports.contour = Contour;
  exports.geojson = GeoJSON;
  exports.geopath = GeoPath;
  exports.geopoint = GeoPoint;
  exports.geoshape = GeoShape;
  exports.graticule = Graticule;
  exports.heatmap = Heatmap;
  exports.isocontour = Isocontour;
  exports.kde2d = KDE2D;
  exports.projection = Projection;

}));
