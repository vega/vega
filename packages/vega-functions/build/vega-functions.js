(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vega-util'), require('vega-expression'), require('vega-scale'), require('vega-dataflow'), require('vega-scenegraph'), require('vega-selections'), require('vega-statistics'), require('vega-time')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vega-util', 'vega-expression', 'vega-scale', 'vega-dataflow', 'vega-scenegraph', 'vega-selections', 'vega-statistics', 'vega-time'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.vega = {}, global.vega, global.vega, global.vega, global.vega, global.vega, global.vega, global.vega, global.vega));
})(this, (function (exports, vegaUtil, vegaExpression, vegaScale, vegaDataflow, vegaScenegraph, vegaSelections, vegaStatistics, vegaTime) { 'use strict';

  function data(name) {
    const data = this.context.data[name];
    return data ? data.values.value : [];
  }
  function indata(name, field, value) {
    const index = this.context.data[name]['index:' + field],
      entry = index ? index.value.get(value) : undefined;
    return entry ? entry.count : entry;
  }
  function setdata(name, tuples) {
    const df = this.context.dataflow,
      data = this.context.data[name],
      input = data.input;
    df.pulse(input, df.changeset().remove(vegaUtil.truthy).insert(tuples));
    return 1;
  }

  function encode (item, name, retval) {
    if (item) {
      const df = this.context.dataflow,
        target = item.mark.source;
      df.pulse(target, df.changeset().encode(item, name));
    }
    return retval !== undefined ? retval : item;
  }

  const wrap = method => function (value, spec) {
    const locale = this.context.dataflow.locale();
    return locale[method](spec)(value);
  };
  const format = wrap('format');
  const timeFormat = wrap('timeFormat');
  const utcFormat = wrap('utcFormat');
  const timeParse = wrap('timeParse');
  const utcParse = wrap('utcParse');
  const dateObj = new Date(2000, 0, 1);
  function time(month, day, specifier) {
    if (!Number.isInteger(month) || !Number.isInteger(day)) return '';
    dateObj.setYear(2000);
    dateObj.setMonth(month);
    dateObj.setDate(day);
    return timeFormat.call(this, dateObj, specifier);
  }
  function monthFormat(month) {
    return time.call(this, month, 1, '%B');
  }
  function monthAbbrevFormat(month) {
    return time.call(this, month, 1, '%b');
  }
  function dayFormat(day) {
    return time.call(this, 0, 2 + day, '%A');
  }
  function dayAbbrevFormat(day) {
    return time.call(this, 0, 2 + day, '%a');
  }

  const DataPrefix = ':';
  const IndexPrefix = '@';
  const ScalePrefix = '%';
  const SignalPrefix = '$';

  function dataVisitor(name, args, scope, params) {
    if (args[0].type !== vegaExpression.Literal) {
      vegaUtil.error('First argument to data functions must be a string literal.');
    }
    const data = args[0].value,
      dataName = DataPrefix + data;
    if (!vegaUtil.hasOwnProperty(dataName, params)) {
      try {
        params[dataName] = scope.getData(data).tuplesRef();
      } catch (err) {
        // if data set does not exist, there's nothing to track
      }
    }
  }
  function indataVisitor(name, args, scope, params) {
    if (args[0].type !== vegaExpression.Literal) vegaUtil.error('First argument to indata must be a string literal.');
    if (args[1].type !== vegaExpression.Literal) vegaUtil.error('Second argument to indata must be a string literal.');
    const data = args[0].value,
      field = args[1].value,
      indexName = IndexPrefix + field;
    if (!vegaUtil.hasOwnProperty(indexName, params)) {
      params[indexName] = scope.getData(data).indataRef(scope, field);
    }
  }
  function scaleVisitor(name, args, scope, params) {
    if (args[0].type === vegaExpression.Literal) {
      // add scale dependency
      addScaleDependency(scope, params, args[0].value);
    } else {
      // indirect scale lookup; add all scales as parameters
      for (name in scope.scales) {
        addScaleDependency(scope, params, name);
      }
    }
  }
  function addScaleDependency(scope, params, name) {
    const scaleName = ScalePrefix + name;
    if (!vegaUtil.hasOwnProperty(params, scaleName)) {
      try {
        params[scaleName] = scope.scaleRef(name);
      } catch (err) {
        // TODO: error handling? warning?
      }
    }
  }

  function getScale(nameOrFunction, ctx) {
    if (vegaUtil.isFunction(nameOrFunction)) {
      return nameOrFunction;
    }
    if (vegaUtil.isString(nameOrFunction)) {
      const maybeScale = ctx.scales[nameOrFunction];
      return maybeScale && vegaScale.isRegisteredScale(maybeScale.value) ? maybeScale.value : undefined;
    }
    return undefined;
  }
  function internalScaleFunctions(codegen, fnctx, visitors) {
    // add helper method to the 'this' expression function context
    fnctx.__bandwidth = s => s && s.bandwidth ? s.bandwidth() : 0;

    // register AST visitors for internal scale functions
    visitors._bandwidth = scaleVisitor;
    visitors._range = scaleVisitor;
    visitors._scale = scaleVisitor;

    // resolve scale reference directly to the signal hash argument
    const ref = arg => '_[' + (arg.type === vegaExpression.Literal ? vegaUtil.stringValue(ScalePrefix + arg.value) : vegaUtil.stringValue(ScalePrefix) + '+' + codegen(arg)) + ']';

    // define and return internal scale function code generators
    // these internal functions are called by mark encoders
    return {
      _bandwidth: args => `this.__bandwidth(${ref(args[0])})`,
      _range: args => `${ref(args[0])}.range()`,
      _scale: args => `${ref(args[0])}(${codegen(args[1])})`
    };
  }

  // https://github.com/python/cpython/blob/a74eea238f5baba15797e2e8b570d153bc8690a7/Modules/mathmodule.c#L1423
  class Adder {
    constructor() {
      this._partials = new Float64Array(32);
      this._n = 0;
    }
    add(x) {
      const p = this._partials;
      let i = 0;
      for (let j = 0; j < this._n && j < 32; j++) {
        const y = p[j],
          hi = x + y,
          lo = Math.abs(x) < Math.abs(y) ? x - (hi - y) : y - (hi - x);
        if (lo) p[i++] = lo;
        x = hi;
      }
      p[i] = x;
      this._n = i + 1;
      return this;
    }
    valueOf() {
      const p = this._partials;
      let n = this._n,
        x,
        y,
        lo,
        hi = 0;
      if (n > 0) {
        hi = p[--n];
        while (n > 0) {
          x = hi;
          y = p[--n];
          hi = x + y;
          lo = y - (hi - x);
          if (lo) break;
        }
        if (n > 0 && (lo < 0 && p[n - 1] < 0 || lo > 0 && p[n - 1] > 0)) {
          y = lo * 2;
          x = hi + y;
          if (y == x - hi) hi = x;
        }
      }
      return hi;
    }
  }

  function range$2(start, stop, step) {
    start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;
    var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);
    while (++i < n) {
      range[i] = start + i * step;
    }
    return range;
  }

  var epsilon = 1e-6;
  var epsilon2 = 1e-12;
  var pi = Math.PI;
  var halfPi = pi / 2;
  var quarterPi = pi / 4;
  var tau = pi * 2;
  var degrees$1 = 180 / pi;
  var radians$1 = pi / 180;
  var abs = Math.abs;
  var atan2 = Math.atan2;
  var cos = Math.cos;
  var hypot = Math.hypot;
  var sin = Math.sin;
  var sqrt = Math.sqrt;
  function asin(x) {
    return x > 1 ? halfPi : x < -1 ? -halfPi : Math.asin(x);
  }

  function noop() {}

  function streamGeometry(geometry, stream) {
    if (geometry && streamGeometryType.hasOwnProperty(geometry.type)) {
      streamGeometryType[geometry.type](geometry, stream);
    }
  }
  var streamObjectType = {
    Feature: function (object, stream) {
      streamGeometry(object.geometry, stream);
    },
    FeatureCollection: function (object, stream) {
      var features = object.features,
        i = -1,
        n = features.length;
      while (++i < n) streamGeometry(features[i].geometry, stream);
    }
  };
  var streamGeometryType = {
    Sphere: function (object, stream) {
      stream.sphere();
    },
    Point: function (object, stream) {
      object = object.coordinates;
      stream.point(object[0], object[1], object[2]);
    },
    MultiPoint: function (object, stream) {
      var coordinates = object.coordinates,
        i = -1,
        n = coordinates.length;
      while (++i < n) object = coordinates[i], stream.point(object[0], object[1], object[2]);
    },
    LineString: function (object, stream) {
      streamLine(object.coordinates, stream, 0);
    },
    MultiLineString: function (object, stream) {
      var coordinates = object.coordinates,
        i = -1,
        n = coordinates.length;
      while (++i < n) streamLine(coordinates[i], stream, 0);
    },
    Polygon: function (object, stream) {
      streamPolygon(object.coordinates, stream);
    },
    MultiPolygon: function (object, stream) {
      var coordinates = object.coordinates,
        i = -1,
        n = coordinates.length;
      while (++i < n) streamPolygon(coordinates[i], stream);
    },
    GeometryCollection: function (object, stream) {
      var geometries = object.geometries,
        i = -1,
        n = geometries.length;
      while (++i < n) streamGeometry(geometries[i], stream);
    }
  };
  function streamLine(coordinates, stream, closed) {
    var i = -1,
      n = coordinates.length - closed,
      coordinate;
    stream.lineStart();
    while (++i < n) coordinate = coordinates[i], stream.point(coordinate[0], coordinate[1], coordinate[2]);
    stream.lineEnd();
  }
  function streamPolygon(coordinates, stream) {
    var i = -1,
      n = coordinates.length;
    stream.polygonStart();
    while (++i < n) streamLine(coordinates[i], stream, 1);
    stream.polygonEnd();
  }
  function geoStream (object, stream) {
    if (object && streamObjectType.hasOwnProperty(object.type)) {
      streamObjectType[object.type](object, stream);
    } else {
      streamGeometry(object, stream);
    }
  }

  var areaRingSum = new Adder();

  // hello?

  var areaSum = new Adder(),
    lambda00$2,
    phi00$2,
    lambda0$1,
    cosPhi0,
    sinPhi0;
  var areaStream = {
    point: noop,
    lineStart: noop,
    lineEnd: noop,
    polygonStart: function () {
      areaRingSum = new Adder();
      areaStream.lineStart = areaRingStart;
      areaStream.lineEnd = areaRingEnd;
    },
    polygonEnd: function () {
      var areaRing = +areaRingSum;
      areaSum.add(areaRing < 0 ? tau + areaRing : areaRing);
      this.lineStart = this.lineEnd = this.point = noop;
    },
    sphere: function () {
      areaSum.add(tau);
    }
  };
  function areaRingStart() {
    areaStream.point = areaPointFirst;
  }
  function areaRingEnd() {
    areaPoint(lambda00$2, phi00$2);
  }
  function areaPointFirst(lambda, phi) {
    areaStream.point = areaPoint;
    lambda00$2 = lambda, phi00$2 = phi;
    lambda *= radians$1, phi *= radians$1;
    lambda0$1 = lambda, cosPhi0 = cos(phi = phi / 2 + quarterPi), sinPhi0 = sin(phi);
  }
  function areaPoint(lambda, phi) {
    lambda *= radians$1, phi *= radians$1;
    phi = phi / 2 + quarterPi; // half the angular distance from south pole

    // Spherical excess E for a spherical triangle with vertices: south pole,
    // previous point, current point.  Uses a formula derived from Cagnoli’s
    // theorem.  See Todhunter, Spherical Trig. (1871), Sec. 103, Eq. (2).
    var dLambda = lambda - lambda0$1,
      sdLambda = dLambda >= 0 ? 1 : -1,
      adLambda = sdLambda * dLambda,
      cosPhi = cos(phi),
      sinPhi = sin(phi),
      k = sinPhi0 * sinPhi,
      u = cosPhi0 * cosPhi + k * cos(adLambda),
      v = k * sdLambda * sin(adLambda);
    areaRingSum.add(atan2(v, u));

    // Advance the previous points.
    lambda0$1 = lambda, cosPhi0 = cosPhi, sinPhi0 = sinPhi;
  }
  function area (object) {
    areaSum = new Adder();
    geoStream(object, areaStream);
    return areaSum * 2;
  }

  function spherical(cartesian) {
    return [atan2(cartesian[1], cartesian[0]), asin(cartesian[2])];
  }
  function cartesian(spherical) {
    var lambda = spherical[0],
      phi = spherical[1],
      cosPhi = cos(phi);
    return [cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi)];
  }
  function cartesianCross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  // TODO return d
  function cartesianNormalizeInPlace(d) {
    var l = sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    d[0] /= l, d[1] /= l, d[2] /= l;
  }

  var lambda0, phi0, lambda1, phi1,
    // bounds
    lambda2,
    // previous lambda-coordinate
    lambda00$1, phi00$1,
    // first point
    p0,
    // previous 3D point
    deltaSum, ranges, range$1;
  var boundsStream = {
    point: boundsPoint,
    lineStart: boundsLineStart,
    lineEnd: boundsLineEnd,
    polygonStart: function () {
      boundsStream.point = boundsRingPoint;
      boundsStream.lineStart = boundsRingStart;
      boundsStream.lineEnd = boundsRingEnd;
      deltaSum = new Adder();
      areaStream.polygonStart();
    },
    polygonEnd: function () {
      areaStream.polygonEnd();
      boundsStream.point = boundsPoint;
      boundsStream.lineStart = boundsLineStart;
      boundsStream.lineEnd = boundsLineEnd;
      if (areaRingSum < 0) lambda0 = -(lambda1 = 180), phi0 = -(phi1 = 90);else if (deltaSum > epsilon) phi1 = 90;else if (deltaSum < -epsilon) phi0 = -90;
      range$1[0] = lambda0, range$1[1] = lambda1;
    },
    sphere: function () {
      lambda0 = -(lambda1 = 180), phi0 = -(phi1 = 90);
    }
  };
  function boundsPoint(lambda, phi) {
    ranges.push(range$1 = [lambda0 = lambda, lambda1 = lambda]);
    if (phi < phi0) phi0 = phi;
    if (phi > phi1) phi1 = phi;
  }
  function linePoint(lambda, phi) {
    var p = cartesian([lambda * radians$1, phi * radians$1]);
    if (p0) {
      var normal = cartesianCross(p0, p),
        equatorial = [normal[1], -normal[0], 0],
        inflection = cartesianCross(equatorial, normal);
      cartesianNormalizeInPlace(inflection);
      inflection = spherical(inflection);
      var delta = lambda - lambda2,
        sign = delta > 0 ? 1 : -1,
        lambdai = inflection[0] * degrees$1 * sign,
        phii,
        antimeridian = abs(delta) > 180;
      if (antimeridian ^ (sign * lambda2 < lambdai && lambdai < sign * lambda)) {
        phii = inflection[1] * degrees$1;
        if (phii > phi1) phi1 = phii;
      } else if (lambdai = (lambdai + 360) % 360 - 180, antimeridian ^ (sign * lambda2 < lambdai && lambdai < sign * lambda)) {
        phii = -inflection[1] * degrees$1;
        if (phii < phi0) phi0 = phii;
      } else {
        if (phi < phi0) phi0 = phi;
        if (phi > phi1) phi1 = phi;
      }
      if (antimeridian) {
        if (lambda < lambda2) {
          if (angle(lambda0, lambda) > angle(lambda0, lambda1)) lambda1 = lambda;
        } else {
          if (angle(lambda, lambda1) > angle(lambda0, lambda1)) lambda0 = lambda;
        }
      } else {
        if (lambda1 >= lambda0) {
          if (lambda < lambda0) lambda0 = lambda;
          if (lambda > lambda1) lambda1 = lambda;
        } else {
          if (lambda > lambda2) {
            if (angle(lambda0, lambda) > angle(lambda0, lambda1)) lambda1 = lambda;
          } else {
            if (angle(lambda, lambda1) > angle(lambda0, lambda1)) lambda0 = lambda;
          }
        }
      }
    } else {
      ranges.push(range$1 = [lambda0 = lambda, lambda1 = lambda]);
    }
    if (phi < phi0) phi0 = phi;
    if (phi > phi1) phi1 = phi;
    p0 = p, lambda2 = lambda;
  }
  function boundsLineStart() {
    boundsStream.point = linePoint;
  }
  function boundsLineEnd() {
    range$1[0] = lambda0, range$1[1] = lambda1;
    boundsStream.point = boundsPoint;
    p0 = null;
  }
  function boundsRingPoint(lambda, phi) {
    if (p0) {
      var delta = lambda - lambda2;
      deltaSum.add(abs(delta) > 180 ? delta + (delta > 0 ? 360 : -360) : delta);
    } else {
      lambda00$1 = lambda, phi00$1 = phi;
    }
    areaStream.point(lambda, phi);
    linePoint(lambda, phi);
  }
  function boundsRingStart() {
    areaStream.lineStart();
  }
  function boundsRingEnd() {
    boundsRingPoint(lambda00$1, phi00$1);
    areaStream.lineEnd();
    if (abs(deltaSum) > epsilon) lambda0 = -(lambda1 = 180);
    range$1[0] = lambda0, range$1[1] = lambda1;
    p0 = null;
  }

  // Finds the left-right distance between two longitudes.
  // This is almost the same as (lambda1 - lambda0 + 360°) % 360°, except that we want
  // the distance between ±180° to be 360°.
  function angle(lambda0, lambda1) {
    return (lambda1 -= lambda0) < 0 ? lambda1 + 360 : lambda1;
  }
  function rangeCompare(a, b) {
    return a[0] - b[0];
  }
  function rangeContains(range, x) {
    return range[0] <= range[1] ? range[0] <= x && x <= range[1] : x < range[0] || range[1] < x;
  }
  function bounds (feature) {
    var i, n, a, b, merged, deltaMax, delta;
    phi1 = lambda1 = -(lambda0 = phi0 = Infinity);
    ranges = [];
    geoStream(feature, boundsStream);

    // First, sort ranges by their minimum longitudes.
    if (n = ranges.length) {
      ranges.sort(rangeCompare);

      // Then, merge any ranges that overlap.
      for (i = 1, a = ranges[0], merged = [a]; i < n; ++i) {
        b = ranges[i];
        if (rangeContains(a, b[0]) || rangeContains(a, b[1])) {
          if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1];
          if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0];
        } else {
          merged.push(a = b);
        }
      }

      // Finally, find the largest gap between the merged ranges.
      // The final bounding box will be the inverse of this gap.
      for (deltaMax = -Infinity, n = merged.length - 1, i = 0, a = merged[n]; i <= n; a = b, ++i) {
        b = merged[i];
        if ((delta = angle(a[1], b[0])) > deltaMax) deltaMax = delta, lambda0 = b[0], lambda1 = a[1];
      }
    }
    ranges = range$1 = null;
    return lambda0 === Infinity || phi0 === Infinity ? [[NaN, NaN], [NaN, NaN]] : [[lambda0, phi0], [lambda1, phi1]];
  }

  var W0, W1, X0, Y0, Z0, X1, Y1, Z1, X2, Y2, Z2, lambda00, phi00,
    // first point
    x0, y0, z0; // previous point

  var centroidStream = {
    sphere: noop,
    point: centroidPoint,
    lineStart: centroidLineStart,
    lineEnd: centroidLineEnd,
    polygonStart: function () {
      centroidStream.lineStart = centroidRingStart;
      centroidStream.lineEnd = centroidRingEnd;
    },
    polygonEnd: function () {
      centroidStream.lineStart = centroidLineStart;
      centroidStream.lineEnd = centroidLineEnd;
    }
  };

  // Arithmetic mean of Cartesian vectors.
  function centroidPoint(lambda, phi) {
    lambda *= radians$1, phi *= radians$1;
    var cosPhi = cos(phi);
    centroidPointCartesian(cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi));
  }
  function centroidPointCartesian(x, y, z) {
    ++W0;
    X0 += (x - X0) / W0;
    Y0 += (y - Y0) / W0;
    Z0 += (z - Z0) / W0;
  }
  function centroidLineStart() {
    centroidStream.point = centroidLinePointFirst;
  }
  function centroidLinePointFirst(lambda, phi) {
    lambda *= radians$1, phi *= radians$1;
    var cosPhi = cos(phi);
    x0 = cosPhi * cos(lambda);
    y0 = cosPhi * sin(lambda);
    z0 = sin(phi);
    centroidStream.point = centroidLinePoint;
    centroidPointCartesian(x0, y0, z0);
  }
  function centroidLinePoint(lambda, phi) {
    lambda *= radians$1, phi *= radians$1;
    var cosPhi = cos(phi),
      x = cosPhi * cos(lambda),
      y = cosPhi * sin(lambda),
      z = sin(phi),
      w = atan2(sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);
    W1 += w;
    X1 += w * (x0 + (x0 = x));
    Y1 += w * (y0 + (y0 = y));
    Z1 += w * (z0 + (z0 = z));
    centroidPointCartesian(x0, y0, z0);
  }
  function centroidLineEnd() {
    centroidStream.point = centroidPoint;
  }

  // See J. E. Brock, The Inertia Tensor for a Spherical Triangle,
  // J. Applied Mechanics 42, 239 (1975).
  function centroidRingStart() {
    centroidStream.point = centroidRingPointFirst;
  }
  function centroidRingEnd() {
    centroidRingPoint(lambda00, phi00);
    centroidStream.point = centroidPoint;
  }
  function centroidRingPointFirst(lambda, phi) {
    lambda00 = lambda, phi00 = phi;
    lambda *= radians$1, phi *= radians$1;
    centroidStream.point = centroidRingPoint;
    var cosPhi = cos(phi);
    x0 = cosPhi * cos(lambda);
    y0 = cosPhi * sin(lambda);
    z0 = sin(phi);
    centroidPointCartesian(x0, y0, z0);
  }
  function centroidRingPoint(lambda, phi) {
    lambda *= radians$1, phi *= radians$1;
    var cosPhi = cos(phi),
      x = cosPhi * cos(lambda),
      y = cosPhi * sin(lambda),
      z = sin(phi),
      cx = y0 * z - z0 * y,
      cy = z0 * x - x0 * z,
      cz = x0 * y - y0 * x,
      m = hypot(cx, cy, cz),
      w = asin(m),
      // line weight = angle
      v = m && -w / m; // area weight multiplier
    X2.add(v * cx);
    Y2.add(v * cy);
    Z2.add(v * cz);
    W1 += w;
    X1 += w * (x0 + (x0 = x));
    Y1 += w * (y0 + (y0 = y));
    Z1 += w * (z0 + (z0 = z));
    centroidPointCartesian(x0, y0, z0);
  }
  function centroid (object) {
    W0 = W1 = X0 = Y0 = Z0 = X1 = Y1 = Z1 = 0;
    X2 = new Adder();
    Y2 = new Adder();
    Z2 = new Adder();
    geoStream(object, centroidStream);
    var x = +X2,
      y = +Y2,
      z = +Z2,
      m = hypot(x, y, z);

    // If the area-weighted ccentroid is undefined, fall back to length-weighted ccentroid.
    if (m < epsilon2) {
      x = X1, y = Y1, z = Z1;
      // If the feature has zero length, fall back to arithmetic mean of point vectors.
      if (W1 < epsilon) x = X0, y = Y0, z = Z0;
      m = hypot(x, y, z);
      // If the feature still has an undefined ccentroid, then return.
      if (m < epsilon2) return [NaN, NaN];
    }
    return [atan2(y, x) * degrees$1, asin(z / m) * degrees$1];
  }

  function geoMethod(methodName, globalMethod) {
    return function (projection, geojson, group) {
      if (projection) {
        // projection defined, use it
        const p = getScale(projection, (group || this).context);
        return p && p.path[methodName](geojson);
      } else {
        // projection undefined, use global method
        return globalMethod(geojson);
      }
    };
  }
  const geoArea = geoMethod('area', area);
  const geoBounds = geoMethod('bounds', bounds);
  const geoCentroid = geoMethod('centroid', centroid);

  function inScope (item) {
    const group = this.context.group;
    let value = false;
    if (group) while (item) {
      if (item === group) {
        value = true;
        break;
      }
      item = item.mark.group;
    }
    return value;
  }

  function log(df, method, args) {
    try {
      df[method].apply(df, ['EXPRESSION'].concat([].slice.call(args)));
    } catch (err) {
      df.warn(err);
    }
    return args[args.length - 1];
  }
  function warn() {
    return log(this.context.dataflow, 'warn', arguments);
  }
  function info() {
    return log(this.context.dataflow, 'info', arguments);
  }
  function debug() {
    return log(this.context.dataflow, 'debug', arguments);
  }

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

  const radians = Math.PI / 180;
  const degrees = 180 / Math.PI;

  // https://observablehq.com/@mbostock/lab-and-rgb
  const K = 18,
    Xn = 0.96422,
    Yn = 1,
    Zn = 0.82521,
    t0 = 4 / 29,
    t1 = 6 / 29,
    t2 = 3 * t1 * t1,
    t3 = t1 * t1 * t1;
  function labConvert(o) {
    if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
    if (o instanceof Hcl) return hcl2lab(o);
    if (!(o instanceof Rgb)) o = rgbConvert(o);
    var r = rgb2lrgb(o.r),
      g = rgb2lrgb(o.g),
      b = rgb2lrgb(o.b),
      y = xyz2lab((0.2225045 * r + 0.7168786 * g + 0.0606169 * b) / Yn),
      x,
      z;
    if (r === g && g === b) x = z = y;else {
      x = xyz2lab((0.4360747 * r + 0.3850649 * g + 0.1430804 * b) / Xn);
      z = xyz2lab((0.0139322 * r + 0.0971045 * g + 0.7141733 * b) / Zn);
    }
    return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
  }
  function lab(l, a, b, opacity) {
    return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
  }
  function Lab(l, a, b, opacity) {
    this.l = +l;
    this.a = +a;
    this.b = +b;
    this.opacity = +opacity;
  }
  define(Lab, lab, extend(Color, {
    brighter(k) {
      return new Lab(this.l + K * (k == null ? 1 : k), this.a, this.b, this.opacity);
    },
    darker(k) {
      return new Lab(this.l - K * (k == null ? 1 : k), this.a, this.b, this.opacity);
    },
    rgb() {
      var y = (this.l + 16) / 116,
        x = isNaN(this.a) ? y : y + this.a / 500,
        z = isNaN(this.b) ? y : y - this.b / 200;
      x = Xn * lab2xyz(x);
      y = Yn * lab2xyz(y);
      z = Zn * lab2xyz(z);
      return new Rgb(lrgb2rgb(3.1338561 * x - 1.6168667 * y - 0.4906146 * z), lrgb2rgb(-0.9787684 * x + 1.9161415 * y + 0.0334540 * z), lrgb2rgb(0.0719453 * x - 0.2289914 * y + 1.4052427 * z), this.opacity);
    }
  }));
  function xyz2lab(t) {
    return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
  }
  function lab2xyz(t) {
    return t > t1 ? t * t * t : t2 * (t - t0);
  }
  function lrgb2rgb(x) {
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  }
  function rgb2lrgb(x) {
    return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  }
  function hclConvert(o) {
    if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
    if (!(o instanceof Lab)) o = labConvert(o);
    if (o.a === 0 && o.b === 0) return new Hcl(NaN, 0 < o.l && o.l < 100 ? 0 : NaN, o.l, o.opacity);
    var h = Math.atan2(o.b, o.a) * degrees;
    return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
  }
  function hcl(h, c, l, opacity) {
    return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
  }
  function Hcl(h, c, l, opacity) {
    this.h = +h;
    this.c = +c;
    this.l = +l;
    this.opacity = +opacity;
  }
  function hcl2lab(o) {
    if (isNaN(o.h)) return new Lab(o.l, 0, 0, o.opacity);
    var h = o.h * radians;
    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }
  define(Hcl, hcl, extend(Color, {
    brighter(k) {
      return new Hcl(this.h, this.c, this.l + K * (k == null ? 1 : k), this.opacity);
    },
    darker(k) {
      return new Hcl(this.h, this.c, this.l - K * (k == null ? 1 : k), this.opacity);
    },
    rgb() {
      return hcl2lab(this).rgb();
    }
  }));

  // https://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
  function channel_luminance_value(channelValue) {
    const val = channelValue / 255;
    if (val <= 0.03928) {
      return val / 12.92;
    }
    return Math.pow((val + 0.055) / 1.055, 2.4);
  }
  function luminance(color) {
    const c = rgb(color),
      r = channel_luminance_value(c.r),
      g = channel_luminance_value(c.g),
      b = channel_luminance_value(c.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // https://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
  function contrast(color1, color2) {
    const lum1 = luminance(color1),
      lum2 = luminance(color2),
      lumL = Math.max(lum1, lum2),
      lumD = Math.min(lum1, lum2);
    return (lumL + 0.05) / (lumD + 0.05);
  }

  function merge () {
    const args = [].slice.call(arguments);
    args.unshift({});
    return vegaUtil.extend(...args);
  }

  function equal(a, b) {
    return a === b || a !== a && b !== b ? true : vegaUtil.isArray(a) ? vegaUtil.isArray(b) && a.length === b.length ? equalArray(a, b) : false : vegaUtil.isObject(a) && vegaUtil.isObject(b) ? equalObject(a, b) : false;
  }
  function equalArray(a, b) {
    for (let i = 0, n = a.length; i < n; ++i) {
      if (!equal(a[i], b[i])) return false;
    }
    return true;
  }
  function equalObject(a, b) {
    for (const key in a) {
      if (!equal(a[key], b[key])) return false;
    }
    return true;
  }
  function removePredicate(props) {
    return _ => equalObject(props, _);
  }
  function modify (name, insert, remove, toggle, modify, values) {
    const df = this.context.dataflow,
      data = this.context.data[name],
      input = data.input,
      stamp = df.stamp();
    let changes = data.changes,
      predicate,
      key;
    if (df._trigger === false || !(input.value.length || insert || toggle)) {
      // nothing to do!
      return 0;
    }
    if (!changes || changes.stamp < stamp) {
      data.changes = changes = df.changeset();
      changes.stamp = stamp;
      df.runAfter(() => {
        data.modified = true;
        df.pulse(input, changes).run();
      }, true, 1);
    }
    if (remove) {
      predicate = remove === true ? vegaUtil.truthy : vegaUtil.isArray(remove) || vegaDataflow.isTuple(remove) ? remove : removePredicate(remove);
      changes.remove(predicate);
    }
    if (insert) {
      changes.insert(insert);
    }
    if (toggle) {
      predicate = removePredicate(toggle);
      if (input.value.some(predicate)) {
        changes.remove(predicate);
      } else {
        changes.insert(toggle);
      }
    }
    if (modify) {
      for (key in values) {
        changes.modify(modify, key, values[key]);
      }
    }
    return 1;
  }

  function pinchDistance(event) {
    const t = event.touches,
      dx = t[0].clientX - t[1].clientX,
      dy = t[0].clientY - t[1].clientY;
    return Math.hypot(dx, dy);
  }
  function pinchAngle(event) {
    const t = event.touches;
    return Math.atan2(t[0].clientY - t[1].clientY, t[0].clientX - t[1].clientX);
  }

  // memoize accessor functions
  const accessors = {};
  function pluck (data, name) {
    const accessor = accessors[name] || (accessors[name] = vegaUtil.field(name));
    return vegaUtil.isArray(data) ? data.map(accessor) : accessor(data);
  }

  function array(seq) {
    return vegaUtil.isArray(seq) || ArrayBuffer.isView(seq) ? seq : null;
  }
  function sequence(seq) {
    return array(seq) || (vegaUtil.isString(seq) ? seq : null);
  }
  function join(seq, ...args) {
    return array(seq).join(...args);
  }
  function indexof(seq, ...args) {
    return sequence(seq).indexOf(...args);
  }
  function lastindexof(seq, ...args) {
    return sequence(seq).lastIndexOf(...args);
  }
  function slice(seq, ...args) {
    return sequence(seq).slice(...args);
  }
  function replace(str, pattern, repl) {
    if (vegaUtil.isFunction(repl)) vegaUtil.error('Function argument passed to replace.');
    return String(str).replace(pattern, repl);
  }
  function reverse(seq) {
    return array(seq).slice().reverse();
  }

  function bandspace(count, paddingInner, paddingOuter) {
    return vegaScale.bandSpace(count || 0, paddingInner || 0, paddingOuter || 0);
  }
  function bandwidth(name, group) {
    const s = getScale(name, (group || this).context);
    return s && s.bandwidth ? s.bandwidth() : 0;
  }
  function copy(name, group) {
    const s = getScale(name, (group || this).context);
    return s ? s.copy() : undefined;
  }
  function domain(name, group) {
    const s = getScale(name, (group || this).context);
    return s ? s.domain() : [];
  }
  function invert(name, range, group) {
    const s = getScale(name, (group || this).context);
    return !s ? undefined : vegaUtil.isArray(range) ? (s.invertRange || s.invert)(range) : (s.invert || s.invertExtent)(range);
  }
  function range(name, group) {
    const s = getScale(name, (group || this).context);
    return s && s.range ? s.range() : [];
  }
  function scale(name, value, group) {
    const s = getScale(name, (group || this).context);
    return s ? s(value) : undefined;
  }

  function scaleGradient (scale, p0, p1, count, group) {
    scale = getScale(scale, (group || this).context);
    const gradient = vegaScenegraph.Gradient(p0, p1);
    let stops = scale.domain(),
      min = stops[0],
      max = vegaUtil.peek(stops),
      fraction = vegaUtil.identity;
    if (!(max - min)) {
      // expand scale if domain has zero span, fix #1479
      scale = (scale.interpolator ? vegaScale.scale('sequential')().interpolator(scale.interpolator()) : vegaScale.scale('linear')().interpolate(scale.interpolate()).range(scale.range())).domain([min = 0, max = 1]);
    } else {
      fraction = vegaScale.scaleFraction(scale, min, max);
    }
    if (scale.ticks) {
      stops = scale.ticks(+count || 15);
      if (min !== stops[0]) stops.unshift(min);
      if (max !== vegaUtil.peek(stops)) stops.push(max);
    }
    stops.forEach(_ => gradient.stop(fraction(_), scale(_)));
    return gradient;
  }

  function geoShape(projection, geojson, group) {
    const p = getScale(projection, (group || this).context);
    return function (context) {
      return p ? p.path.context(context)(geojson) : '';
    };
  }
  function pathShape(path) {
    let p = null;
    return function (context) {
      return context ? vegaScenegraph.pathRender(context, p = p || vegaScenegraph.pathParse(path)) : path;
    };
  }

  const datum = d => d.data;
  function treeNodes(name, context) {
    const tree = data.call(context, name);
    return tree.root && tree.root.lookup || {};
  }
  function treePath(name, source, target) {
    const nodes = treeNodes(name, this),
      s = nodes[source],
      t = nodes[target];
    return s && t ? s.path(t).map(datum) : undefined;
  }
  function treeAncestors(name, node) {
    const n = treeNodes(name, this)[node];
    return n ? n.ancestors().map(datum) : undefined;
  }

  const _window = () => typeof window !== 'undefined' && window || null;
  function screen() {
    const w = _window();
    return w ? w.screen : {};
  }
  function windowSize() {
    const w = _window();
    return w ? [w.innerWidth, w.innerHeight] : [undefined, undefined];
  }
  function containerSize() {
    const view = this.context.dataflow,
      el = view.container && view.container();
    return el ? [el.clientWidth, el.clientHeight] : [undefined, undefined];
  }

  function intersect (b, opt, group) {
    if (!b) return [];
    const [u, v] = b,
      box = new vegaScenegraph.Bounds().set(u[0], u[1], v[0], v[1]),
      scene = group || this.context.dataflow.scenegraph().root;
    return vegaScenegraph.intersect(scene, box, filter(opt));
  }
  function filter(opt) {
    let p = null;
    if (opt) {
      const types = vegaUtil.array(opt.marktype),
        names = vegaUtil.array(opt.markname);
      p = _ => (!types.length || types.some(t => _.marktype === t)) && (!names.length || names.some(s => _.name === s));
    }
    return p;
  }

  /**
   * Appends a new point to the lasso
   *
   * @param {*} lasso the lasso in pixel space
   * @param {*} x the x coordinate in pixel space
   * @param {*} y the y coordinate in pixel space
   * @param {*} minDist the minimum distance, in pixels, that thenew point needs to be apart from the last point
   * @returns a new array containing the lasso with the new point
   */
  function lassoAppend(lasso, x, y, minDist = 5) {
    lasso = vegaUtil.array(lasso);
    const last = lasso[lasso.length - 1];

    // Add point to lasso if its the first point or distance to last point exceed minDist
    return last === undefined || Math.hypot(last[0] - x, last[1] - y) > minDist ? [...lasso, [x, y]] : lasso;
  }

  /**
   * Generates a svg path command which draws a lasso
   *
   * @param {*} lasso the lasso in pixel space in the form [[x,y], [x,y], ...]
   * @returns the svg path command that draws the lasso
   */
  function lassoPath(lasso) {
    return vegaUtil.array(lasso).reduce((svg, [x, y], i) => {
      return svg += i == 0 ? `M ${x},${y} ` : i === lasso.length - 1 ? ' Z' : `L ${x},${y} `;
    }, '');
  }

  /**
   * Inverts the lasso from pixel space to an array of vega scenegraph tuples
   *
   * @param {*} data the dataset
   * @param {*} pixelLasso the lasso in pixel space, [[x,y], [x,y], ...]
   * @param {*} unit the unit where the lasso is defined
   *
   * @returns an array of vega scenegraph tuples
   */
  function intersectLasso(markname, pixelLasso, unit) {
    const {
      x,
      y,
      mark
    } = unit;
    const bb = new vegaScenegraph.Bounds().set(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);

    // Get bounding box around lasso
    for (const [px, py] of pixelLasso) {
      if (px < bb.x1) bb.x1 = px;
      if (px > bb.x2) bb.x2 = px;
      if (py < bb.y1) bb.y1 = py;
      if (py > bb.y2) bb.y2 = py;
    }

    // Translate bb against unit coordinates
    bb.translate(x, y);
    const intersection = intersect([[bb.x1, bb.y1], [bb.x2, bb.y2]], markname, mark);

    // Check every point against the lasso
    return intersection.filter(tuple => pointInPolygon(tuple.x, tuple.y, pixelLasso));
  }

  /**
   * Performs a test if a point is inside a polygon based on the idea from
   * https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
   *
   * This method will not need the same start/end point since it wraps around the edges of the array
   *
   * @param {*} test a point to test against
   * @param {*} polygon a polygon in the form [[x,y], [x,y], ...]
   * @returns true if the point lies inside the polygon, false otherwise
   */
  function pointInPolygon(testx, testy, polygon) {
    let intersections = 0;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [prevX, prevY] = polygon[j];
      const [x, y] = polygon[i];

      // count intersections
      if (y > testy != prevY > testy && testx < (prevX - x) * (testy - y) / (prevY - y) + x) {
        intersections++;
      }
    }

    // point is in polygon if intersection count is odd
    return intersections & 1;
  }

  // Expression function context object
  const functionContext = {
    random() {
      return vegaStatistics.random();
    },
    // override default
    cumulativeNormal: vegaStatistics.cumulativeNormal,
    cumulativeLogNormal: vegaStatistics.cumulativeLogNormal,
    cumulativeUniform: vegaStatistics.cumulativeUniform,
    densityNormal: vegaStatistics.densityNormal,
    densityLogNormal: vegaStatistics.densityLogNormal,
    densityUniform: vegaStatistics.densityUniform,
    quantileNormal: vegaStatistics.quantileNormal,
    quantileLogNormal: vegaStatistics.quantileLogNormal,
    quantileUniform: vegaStatistics.quantileUniform,
    sampleNormal: vegaStatistics.sampleNormal,
    sampleLogNormal: vegaStatistics.sampleLogNormal,
    sampleUniform: vegaStatistics.sampleUniform,
    isArray: vegaUtil.isArray,
    isBoolean: vegaUtil.isBoolean,
    isDate: vegaUtil.isDate,
    isDefined(_) {
      return _ !== undefined;
    },
    isNumber: vegaUtil.isNumber,
    isObject: vegaUtil.isObject,
    isRegExp: vegaUtil.isRegExp,
    isString: vegaUtil.isString,
    isTuple: vegaDataflow.isTuple,
    isValid(_) {
      return _ != null && _ === _;
    },
    toBoolean: vegaUtil.toBoolean,
    toDate(_) {
      return vegaUtil.toDate(_);
    },
    // suppress extra arguments
    toNumber: vegaUtil.toNumber,
    toString: vegaUtil.toString,
    indexof,
    join,
    lastindexof,
    replace,
    reverse,
    slice,
    flush: vegaUtil.flush,
    lerp: vegaUtil.lerp,
    merge,
    pad: vegaUtil.pad,
    peek: vegaUtil.peek,
    pluck,
    span: vegaUtil.span,
    inrange: vegaUtil.inrange,
    truncate: vegaUtil.truncate,
    rgb,
    lab,
    hcl,
    hsl,
    luminance,
    contrast,
    sequence: range$2,
    format,
    utcFormat,
    utcParse,
    utcOffset: vegaTime.utcOffset,
    utcSequence: vegaTime.utcSequence,
    timeFormat,
    timeParse,
    timeOffset: vegaTime.timeOffset,
    timeSequence: vegaTime.timeSequence,
    timeUnitSpecifier: vegaTime.timeUnitSpecifier,
    monthFormat,
    monthAbbrevFormat,
    dayFormat,
    dayAbbrevFormat,
    quarter: vegaUtil.quarter,
    utcquarter: vegaUtil.utcquarter,
    week: vegaTime.week,
    utcweek: vegaTime.utcweek,
    dayofyear: vegaTime.dayofyear,
    utcdayofyear: vegaTime.utcdayofyear,
    warn,
    info,
    debug,
    extent(_) {
      return vegaUtil.extent(_);
    },
    // suppress extra arguments
    inScope,
    intersect,
    clampRange: vegaUtil.clampRange,
    pinchDistance,
    pinchAngle,
    screen,
    containerSize,
    windowSize,
    bandspace,
    setdata,
    pathShape,
    panLinear: vegaUtil.panLinear,
    panLog: vegaUtil.panLog,
    panPow: vegaUtil.panPow,
    panSymlog: vegaUtil.panSymlog,
    zoomLinear: vegaUtil.zoomLinear,
    zoomLog: vegaUtil.zoomLog,
    zoomPow: vegaUtil.zoomPow,
    zoomSymlog: vegaUtil.zoomSymlog,
    encode,
    modify,
    lassoAppend,
    lassoPath,
    intersectLasso
  };
  const eventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'],
    // event functions
    eventPrefix = 'event.vega.',
    // event function prefix
    thisPrefix = 'this.',
    // function context prefix
    astVisitors = {}; // AST visitors for dependency analysis

  // export code generator parameters
  const codegenParams = {
    forbidden: ['_'],
    allowed: ['datum', 'event', 'item'],
    fieldvar: 'datum',
    globalvar: id => `_[${vegaUtil.stringValue(SignalPrefix + id)}]`,
    functions: buildFunctions,
    constants: vegaExpression.constants,
    visitors: astVisitors
  };

  // export code generator
  const codeGenerator = vegaExpression.codegenExpression(codegenParams);

  // Build expression function registry
  function buildFunctions(codegen) {
    const fn = vegaExpression.functions(codegen);
    eventFunctions.forEach(name => fn[name] = eventPrefix + name);
    for (const name in functionContext) {
      fn[name] = thisPrefix + name;
    }
    vegaUtil.extend(fn, internalScaleFunctions(codegen, functionContext, astVisitors));
    return fn;
  }

  // Register an expression function
  function expressionFunction(name, fn, visitor) {
    if (arguments.length === 1) {
      return functionContext[name];
    }

    // register with the functionContext
    functionContext[name] = fn;

    // if there is an astVisitor register that, too
    if (visitor) astVisitors[name] = visitor;

    // if the code generator has already been initialized,
    // we need to also register the function with it
    if (codeGenerator) codeGenerator.functions[name] = thisPrefix + name;
    return this;
  }

  // register expression functions with ast visitors
  expressionFunction('bandwidth', bandwidth, scaleVisitor);
  expressionFunction('copy', copy, scaleVisitor);
  expressionFunction('domain', domain, scaleVisitor);
  expressionFunction('range', range, scaleVisitor);
  expressionFunction('invert', invert, scaleVisitor);
  expressionFunction('scale', scale, scaleVisitor);
  expressionFunction('gradient', scaleGradient, scaleVisitor);
  expressionFunction('geoArea', geoArea, scaleVisitor);
  expressionFunction('geoBounds', geoBounds, scaleVisitor);
  expressionFunction('geoCentroid', geoCentroid, scaleVisitor);
  expressionFunction('geoShape', geoShape, scaleVisitor);
  expressionFunction('indata', indata, indataVisitor);
  expressionFunction('data', data, dataVisitor);
  expressionFunction('treePath', treePath, dataVisitor);
  expressionFunction('treeAncestors', treeAncestors, dataVisitor);

  // register Vega-Lite selection functions
  expressionFunction('vlSelectionTest', vegaSelections.selectionTest, vegaSelections.selectionVisitor);
  expressionFunction('vlSelectionIdTest', vegaSelections.selectionIdTest, vegaSelections.selectionVisitor);
  expressionFunction('vlSelectionResolve', vegaSelections.selectionResolve, vegaSelections.selectionVisitor);
  expressionFunction('vlSelectionTuples', vegaSelections.selectionTuples);

  function parser (expr, scope) {
    const params = {};

    // parse the expression to an abstract syntax tree (ast)
    let ast;
    try {
      expr = vegaUtil.isString(expr) ? expr : vegaUtil.stringValue(expr) + '';
      ast = vegaExpression.parseExpression(expr);
    } catch (err) {
      vegaUtil.error('Expression parse error: ' + expr);
    }

    // analyze ast function calls for dependencies
    ast.visit(node => {
      if (node.type !== vegaExpression.CallExpression) return;
      const name = node.callee.name,
        visit = codegenParams.visitors[name];
      if (visit) visit(name, node.arguments, scope, params);
    });

    // perform code generation
    const gen = codeGenerator(ast);

    // collect signal dependencies
    gen.globals.forEach(name => {
      const signalName = SignalPrefix + name;
      if (!vegaUtil.hasOwnProperty(params, signalName) && scope.getSignal(name)) {
        params[signalName] = scope.signalRef(name);
      }
    });

    // return generated expression code and dependencies
    return {
      $expr: vegaUtil.extend({
        code: gen.code
      }, scope.options.ast ? {
        ast
      } : null),
      $fields: gen.fields,
      $params: params
    };
  }

  exports.DataPrefix = DataPrefix;
  exports.IndexPrefix = IndexPrefix;
  exports.ScalePrefix = ScalePrefix;
  exports.SignalPrefix = SignalPrefix;
  exports.bandspace = bandspace;
  exports.bandwidth = bandwidth;
  exports.codeGenerator = codeGenerator;
  exports.codegenParams = codegenParams;
  exports.containerSize = containerSize;
  exports.contrast = contrast;
  exports.copy = copy;
  exports.data = data;
  exports.dataVisitor = dataVisitor;
  exports.dayAbbrevFormat = dayAbbrevFormat;
  exports.dayFormat = dayFormat;
  exports.debug = debug;
  exports.domain = domain;
  exports.encode = encode;
  exports.expressionFunction = expressionFunction;
  exports.format = format;
  exports.functionContext = functionContext;
  exports.geoArea = geoArea;
  exports.geoBounds = geoBounds;
  exports.geoCentroid = geoCentroid;
  exports.geoShape = geoShape;
  exports.inScope = inScope;
  exports.indata = indata;
  exports.indataVisitor = indataVisitor;
  exports.indexof = indexof;
  exports.info = info;
  exports.invert = invert;
  exports.join = join;
  exports.lastindexof = lastindexof;
  exports.luminance = luminance;
  exports.merge = merge;
  exports.modify = modify;
  exports.monthAbbrevFormat = monthAbbrevFormat;
  exports.monthFormat = monthFormat;
  exports.parseExpression = parser;
  exports.pathShape = pathShape;
  exports.pinchAngle = pinchAngle;
  exports.pinchDistance = pinchDistance;
  exports.pluck = pluck;
  exports.range = range;
  exports.replace = replace;
  exports.reverse = reverse;
  exports.scale = scale;
  exports.scaleGradient = scaleGradient;
  exports.scaleVisitor = scaleVisitor;
  exports.screen = screen;
  exports.setdata = setdata;
  exports.slice = slice;
  exports.timeFormat = timeFormat;
  exports.timeParse = timeParse;
  exports.treeAncestors = treeAncestors;
  exports.treePath = treePath;
  exports.utcFormat = utcFormat;
  exports.utcParse = utcParse;
  exports.warn = warn;
  exports.windowSize = windowSize;

}));
