(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('vega-projection')) :
  typeof define === 'function' && define.amd ? define(['vega-projection'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.vega));
})(this, (function (vegaProjection) { 'use strict';

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

  function* flatten(arrays) {
    for (const array of arrays) {
      yield* array;
    }
  }
  function merge(arrays) {
    return Array.from(flatten(arrays));
  }

  function range$1(start, stop, step) {
    start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;
    var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);
    while (++i < n) {
      range[i] = start + i * step;
    }
    return range;
  }

  var epsilon$1 = 1e-6;
  var epsilon2$1 = 1e-12;
  var pi$1 = Math.PI;
  var halfPi$1 = pi$1 / 2;
  var quarterPi$1 = pi$1 / 4;
  var tau$1 = pi$1 * 2;
  var degrees$1 = 180 / pi$1;
  var radians$1 = pi$1 / 180;
  var abs$1 = Math.abs;
  var atan$1 = Math.atan;
  var atan2$1 = Math.atan2;
  var cos$1 = Math.cos;
  var hypot = Math.hypot;
  var sin$1 = Math.sin;
  var sign$1 = Math.sign || function (x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  };
  var sqrt$1 = Math.sqrt;
  function acos$1(x) {
    return x > 1 ? 0 : x < -1 ? pi$1 : Math.acos(x);
  }
  function asin$1(x) {
    return x > 1 ? halfPi$1 : x < -1 ? -halfPi$1 : Math.asin(x);
  }
  function haversin(x) {
    return (x = sin$1(x / 2)) * x;
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
      areaSum.add(areaRing < 0 ? tau$1 + areaRing : areaRing);
      this.lineStart = this.lineEnd = this.point = noop;
    },
    sphere: function () {
      areaSum.add(tau$1);
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
    lambda0$1 = lambda, cosPhi0 = cos$1(phi = phi / 2 + quarterPi$1), sinPhi0 = sin$1(phi);
  }
  function areaPoint(lambda, phi) {
    lambda *= radians$1, phi *= radians$1;
    phi = phi / 2 + quarterPi$1; // half the angular distance from south pole

    // Spherical excess E for a spherical triangle with vertices: south pole,
    // previous point, current point.  Uses a formula derived from Cagnoli’s
    // theorem.  See Todhunter, Spherical Trig. (1871), Sec. 103, Eq. (2).
    var dLambda = lambda - lambda0$1,
      sdLambda = dLambda >= 0 ? 1 : -1,
      adLambda = sdLambda * dLambda,
      cosPhi = cos$1(phi),
      sinPhi = sin$1(phi),
      k = sinPhi0 * sinPhi,
      u = cosPhi0 * cosPhi + k * cos$1(adLambda),
      v = k * sdLambda * sin$1(adLambda);
    areaRingSum.add(atan2$1(v, u));

    // Advance the previous points.
    lambda0$1 = lambda, cosPhi0 = cosPhi, sinPhi0 = sinPhi;
  }

  function spherical$1(cartesian) {
    return [atan2$1(cartesian[1], cartesian[0]), asin$1(cartesian[2])];
  }
  function cartesian$1(spherical) {
    var lambda = spherical[0],
      phi = spherical[1],
      cosPhi = cos$1(phi);
    return [cosPhi * cos$1(lambda), cosPhi * sin$1(lambda), sin$1(phi)];
  }
  function cartesianDot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function cartesianCross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  // TODO return a
  function cartesianAddInPlace(a, b) {
    a[0] += b[0], a[1] += b[1], a[2] += b[2];
  }
  function cartesianScale(vector, k) {
    return [vector[0] * k, vector[1] * k, vector[2] * k];
  }

  // TODO return d
  function cartesianNormalizeInPlace(d) {
    var l = sqrt$1(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    d[0] /= l, d[1] /= l, d[2] /= l;
  }

  var lambda0, phi0$1, lambda1, phi1,
    // bounds
    lambda2,
    // previous lambda-coordinate
    lambda00$1, phi00$1,
    // first point
    p0,
    // previous 3D point
    deltaSum, ranges, range;
  var boundsStream$2 = {
    point: boundsPoint$1,
    lineStart: boundsLineStart,
    lineEnd: boundsLineEnd,
    polygonStart: function () {
      boundsStream$2.point = boundsRingPoint;
      boundsStream$2.lineStart = boundsRingStart;
      boundsStream$2.lineEnd = boundsRingEnd;
      deltaSum = new Adder();
      areaStream.polygonStart();
    },
    polygonEnd: function () {
      areaStream.polygonEnd();
      boundsStream$2.point = boundsPoint$1;
      boundsStream$2.lineStart = boundsLineStart;
      boundsStream$2.lineEnd = boundsLineEnd;
      if (areaRingSum < 0) lambda0 = -(lambda1 = 180), phi0$1 = -(phi1 = 90);else if (deltaSum > epsilon$1) phi1 = 90;else if (deltaSum < -epsilon$1) phi0$1 = -90;
      range[0] = lambda0, range[1] = lambda1;
    },
    sphere: function () {
      lambda0 = -(lambda1 = 180), phi0$1 = -(phi1 = 90);
    }
  };
  function boundsPoint$1(lambda, phi) {
    ranges.push(range = [lambda0 = lambda, lambda1 = lambda]);
    if (phi < phi0$1) phi0$1 = phi;
    if (phi > phi1) phi1 = phi;
  }
  function linePoint(lambda, phi) {
    var p = cartesian$1([lambda * radians$1, phi * radians$1]);
    if (p0) {
      var normal = cartesianCross(p0, p),
        equatorial = [normal[1], -normal[0], 0],
        inflection = cartesianCross(equatorial, normal);
      cartesianNormalizeInPlace(inflection);
      inflection = spherical$1(inflection);
      var delta = lambda - lambda2,
        sign = delta > 0 ? 1 : -1,
        lambdai = inflection[0] * degrees$1 * sign,
        phii,
        antimeridian = abs$1(delta) > 180;
      if (antimeridian ^ (sign * lambda2 < lambdai && lambdai < sign * lambda)) {
        phii = inflection[1] * degrees$1;
        if (phii > phi1) phi1 = phii;
      } else if (lambdai = (lambdai + 360) % 360 - 180, antimeridian ^ (sign * lambda2 < lambdai && lambdai < sign * lambda)) {
        phii = -inflection[1] * degrees$1;
        if (phii < phi0$1) phi0$1 = phii;
      } else {
        if (phi < phi0$1) phi0$1 = phi;
        if (phi > phi1) phi1 = phi;
      }
      if (antimeridian) {
        if (lambda < lambda2) {
          if (angle$2(lambda0, lambda) > angle$2(lambda0, lambda1)) lambda1 = lambda;
        } else {
          if (angle$2(lambda, lambda1) > angle$2(lambda0, lambda1)) lambda0 = lambda;
        }
      } else {
        if (lambda1 >= lambda0) {
          if (lambda < lambda0) lambda0 = lambda;
          if (lambda > lambda1) lambda1 = lambda;
        } else {
          if (lambda > lambda2) {
            if (angle$2(lambda0, lambda) > angle$2(lambda0, lambda1)) lambda1 = lambda;
          } else {
            if (angle$2(lambda, lambda1) > angle$2(lambda0, lambda1)) lambda0 = lambda;
          }
        }
      }
    } else {
      ranges.push(range = [lambda0 = lambda, lambda1 = lambda]);
    }
    if (phi < phi0$1) phi0$1 = phi;
    if (phi > phi1) phi1 = phi;
    p0 = p, lambda2 = lambda;
  }
  function boundsLineStart() {
    boundsStream$2.point = linePoint;
  }
  function boundsLineEnd() {
    range[0] = lambda0, range[1] = lambda1;
    boundsStream$2.point = boundsPoint$1;
    p0 = null;
  }
  function boundsRingPoint(lambda, phi) {
    if (p0) {
      var delta = lambda - lambda2;
      deltaSum.add(abs$1(delta) > 180 ? delta + (delta > 0 ? 360 : -360) : delta);
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
    if (abs$1(deltaSum) > epsilon$1) lambda0 = -(lambda1 = 180);
    range[0] = lambda0, range[1] = lambda1;
    p0 = null;
  }

  // Finds the left-right distance between two longitudes.
  // This is almost the same as (lambda1 - lambda0 + 360°) % 360°, except that we want
  // the distance between ±180° to be 360°.
  function angle$2(lambda0, lambda1) {
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
    phi1 = lambda1 = -(lambda0 = phi0$1 = Infinity);
    ranges = [];
    geoStream(feature, boundsStream$2);

    // First, sort ranges by their minimum longitudes.
    if (n = ranges.length) {
      ranges.sort(rangeCompare);

      // Then, merge any ranges that overlap.
      for (i = 1, a = ranges[0], merged = [a]; i < n; ++i) {
        b = ranges[i];
        if (rangeContains(a, b[0]) || rangeContains(a, b[1])) {
          if (angle$2(a[0], b[1]) > angle$2(a[0], a[1])) a[1] = b[1];
          if (angle$2(b[0], a[1]) > angle$2(a[0], a[1])) a[0] = b[0];
        } else {
          merged.push(a = b);
        }
      }

      // Finally, find the largest gap between the merged ranges.
      // The final bounding box will be the inverse of this gap.
      for (deltaMax = -Infinity, n = merged.length - 1, i = 0, a = merged[n]; i <= n; a = b, ++i) {
        b = merged[i];
        if ((delta = angle$2(a[1], b[0])) > deltaMax) deltaMax = delta, lambda0 = b[0], lambda1 = a[1];
      }
    }
    ranges = range = null;
    return lambda0 === Infinity || phi0$1 === Infinity ? [[NaN, NaN], [NaN, NaN]] : [[lambda0, phi0$1], [lambda1, phi1]];
  }

  var W0, W1, X0, Y0, Z0, X1, Y1, Z1, X2, Y2, Z2, lambda00, phi00,
    // first point
    x0$1, y0$1, z0; // previous point

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
    var cosPhi = cos$1(phi);
    centroidPointCartesian(cosPhi * cos$1(lambda), cosPhi * sin$1(lambda), sin$1(phi));
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
    var cosPhi = cos$1(phi);
    x0$1 = cosPhi * cos$1(lambda);
    y0$1 = cosPhi * sin$1(lambda);
    z0 = sin$1(phi);
    centroidStream.point = centroidLinePoint;
    centroidPointCartesian(x0$1, y0$1, z0);
  }
  function centroidLinePoint(lambda, phi) {
    lambda *= radians$1, phi *= radians$1;
    var cosPhi = cos$1(phi),
      x = cosPhi * cos$1(lambda),
      y = cosPhi * sin$1(lambda),
      z = sin$1(phi),
      w = atan2$1(sqrt$1((w = y0$1 * z - z0 * y) * w + (w = z0 * x - x0$1 * z) * w + (w = x0$1 * y - y0$1 * x) * w), x0$1 * x + y0$1 * y + z0 * z);
    W1 += w;
    X1 += w * (x0$1 + (x0$1 = x));
    Y1 += w * (y0$1 + (y0$1 = y));
    Z1 += w * (z0 + (z0 = z));
    centroidPointCartesian(x0$1, y0$1, z0);
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
    var cosPhi = cos$1(phi);
    x0$1 = cosPhi * cos$1(lambda);
    y0$1 = cosPhi * sin$1(lambda);
    z0 = sin$1(phi);
    centroidPointCartesian(x0$1, y0$1, z0);
  }
  function centroidRingPoint(lambda, phi) {
    lambda *= radians$1, phi *= radians$1;
    var cosPhi = cos$1(phi),
      x = cosPhi * cos$1(lambda),
      y = cosPhi * sin$1(lambda),
      z = sin$1(phi),
      cx = y0$1 * z - z0 * y,
      cy = z0 * x - x0$1 * z,
      cz = x0$1 * y - y0$1 * x,
      m = hypot(cx, cy, cz),
      w = asin$1(m),
      // line weight = angle
      v = m && -w / m; // area weight multiplier
    X2.add(v * cx);
    Y2.add(v * cy);
    Z2.add(v * cz);
    W1 += w;
    X1 += w * (x0$1 + (x0$1 = x));
    Y1 += w * (y0$1 + (y0$1 = y));
    Z1 += w * (z0 + (z0 = z));
    centroidPointCartesian(x0$1, y0$1, z0);
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
    if (m < epsilon2$1) {
      x = X1, y = Y1, z = Z1;
      // If the feature has zero length, fall back to arithmetic mean of point vectors.
      if (W1 < epsilon$1) x = X0, y = Y0, z = Z0;
      m = hypot(x, y, z);
      // If the feature still has an undefined ccentroid, then return.
      if (m < epsilon2$1) return [NaN, NaN];
    }
    return [atan2$1(y, x) * degrees$1, asin$1(z / m) * degrees$1];
  }

  function constant (x) {
    return function () {
      return x;
    };
  }

  function compose (a, b) {
    function compose(x, y) {
      return x = a(x, y), b(x[0], x[1]);
    }
    if (a.invert && b.invert) compose.invert = function (x, y) {
      return x = b.invert(x, y), x && a.invert(x[0], x[1]);
    };
    return compose;
  }

  function rotationIdentity(lambda, phi) {
    if (abs$1(lambda) > pi$1) lambda -= Math.round(lambda / tau$1) * tau$1;
    return [lambda, phi];
  }
  rotationIdentity.invert = rotationIdentity;
  function rotateRadians(deltaLambda, deltaPhi, deltaGamma) {
    return (deltaLambda %= tau$1) ? deltaPhi || deltaGamma ? compose(rotationLambda(deltaLambda), rotationPhiGamma(deltaPhi, deltaGamma)) : rotationLambda(deltaLambda) : deltaPhi || deltaGamma ? rotationPhiGamma(deltaPhi, deltaGamma) : rotationIdentity;
  }
  function forwardRotationLambda(deltaLambda) {
    return function (lambda, phi) {
      lambda += deltaLambda;
      if (abs$1(lambda) > pi$1) lambda -= Math.round(lambda / tau$1) * tau$1;
      return [lambda, phi];
    };
  }
  function rotationLambda(deltaLambda) {
    var rotation = forwardRotationLambda(deltaLambda);
    rotation.invert = forwardRotationLambda(-deltaLambda);
    return rotation;
  }
  function rotationPhiGamma(deltaPhi, deltaGamma) {
    var cosDeltaPhi = cos$1(deltaPhi),
      sinDeltaPhi = sin$1(deltaPhi),
      cosDeltaGamma = cos$1(deltaGamma),
      sinDeltaGamma = sin$1(deltaGamma);
    function rotation(lambda, phi) {
      var cosPhi = cos$1(phi),
        x = cos$1(lambda) * cosPhi,
        y = sin$1(lambda) * cosPhi,
        z = sin$1(phi),
        k = z * cosDeltaPhi + x * sinDeltaPhi;
      return [atan2$1(y * cosDeltaGamma - k * sinDeltaGamma, x * cosDeltaPhi - z * sinDeltaPhi), asin$1(k * cosDeltaGamma + y * sinDeltaGamma)];
    }
    rotation.invert = function (lambda, phi) {
      var cosPhi = cos$1(phi),
        x = cos$1(lambda) * cosPhi,
        y = sin$1(lambda) * cosPhi,
        z = sin$1(phi),
        k = z * cosDeltaGamma - y * sinDeltaGamma;
      return [atan2$1(y * cosDeltaGamma + z * sinDeltaGamma, x * cosDeltaPhi + k * sinDeltaPhi), asin$1(k * cosDeltaPhi - x * sinDeltaPhi)];
    };
    return rotation;
  }
  function rotation (rotate) {
    rotate = rotateRadians(rotate[0] * radians$1, rotate[1] * radians$1, rotate.length > 2 ? rotate[2] * radians$1 : 0);
    function forward(coordinates) {
      coordinates = rotate(coordinates[0] * radians$1, coordinates[1] * radians$1);
      return coordinates[0] *= degrees$1, coordinates[1] *= degrees$1, coordinates;
    }
    forward.invert = function (coordinates) {
      coordinates = rotate.invert(coordinates[0] * radians$1, coordinates[1] * radians$1);
      return coordinates[0] *= degrees$1, coordinates[1] *= degrees$1, coordinates;
    };
    return forward;
  }

  // Generates a circle centered at [0°, 0°], with a given radius and precision.
  function circleStream(stream, radius, delta, direction, t0, t1) {
    if (!delta) return;
    var cosRadius = cos$1(radius),
      sinRadius = sin$1(radius),
      step = direction * delta;
    if (t0 == null) {
      t0 = radius + direction * tau$1;
      t1 = radius - step / 2;
    } else {
      t0 = circleRadius(cosRadius, t0);
      t1 = circleRadius(cosRadius, t1);
      if (direction > 0 ? t0 < t1 : t0 > t1) t0 += direction * tau$1;
    }
    for (var point, t = t0; direction > 0 ? t > t1 : t < t1; t -= step) {
      point = spherical$1([cosRadius, -sinRadius * cos$1(t), -sinRadius * sin$1(t)]);
      stream.point(point[0], point[1]);
    }
  }

  // Returns the signed angle of a cartesian point relative to [cosRadius, 0, 0].
  function circleRadius(cosRadius, point) {
    point = cartesian$1(point), point[0] -= cosRadius;
    cartesianNormalizeInPlace(point);
    var radius = acos$1(-point[1]);
    return ((-point[2] < 0 ? -radius : radius) + tau$1 - epsilon$1) % tau$1;
  }
  function geoCircle () {
    var center = constant([0, 0]),
      radius = constant(90),
      precision = constant(6),
      ring,
      rotate,
      stream = {
        point: point
      };
    function point(x, y) {
      ring.push(x = rotate(x, y));
      x[0] *= degrees$1, x[1] *= degrees$1;
    }
    function circle() {
      var c = center.apply(this, arguments),
        r = radius.apply(this, arguments) * radians$1,
        p = precision.apply(this, arguments) * radians$1;
      ring = [];
      rotate = rotateRadians(-c[0] * radians$1, -c[1] * radians$1, 0).invert;
      circleStream(stream, r, p, 1);
      c = {
        type: "Polygon",
        coordinates: [ring]
      };
      ring = rotate = null;
      return c;
    }
    circle.center = function (_) {
      return arguments.length ? (center = typeof _ === "function" ? _ : constant([+_[0], +_[1]]), circle) : center;
    };
    circle.radius = function (_) {
      return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), circle) : radius;
    };
    circle.precision = function (_) {
      return arguments.length ? (precision = typeof _ === "function" ? _ : constant(+_), circle) : precision;
    };
    return circle;
  }

  function clipBuffer () {
    var lines = [],
      line;
    return {
      point: function (x, y, m) {
        line.push([x, y, m]);
      },
      lineStart: function () {
        lines.push(line = []);
      },
      lineEnd: noop,
      rejoin: function () {
        if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
      },
      result: function () {
        var result = lines;
        lines = [];
        line = null;
        return result;
      }
    };
  }

  function pointEqual$2 (a, b) {
    return abs$1(a[0] - b[0]) < epsilon$1 && abs$1(a[1] - b[1]) < epsilon$1;
  }

  function Intersection(point, points, other, entry) {
    this.x = point;
    this.z = points;
    this.o = other; // another intersection
    this.e = entry; // is an entry?
    this.v = false; // visited
    this.n = this.p = null; // next & previous
  }

  // A generalized polygon clipping algorithm: given a polygon that has been cut
  // into its visible line segments, and rejoins the segments by interpolating
  // along the clip edge.
  function clipRejoin (segments, compareIntersection, startInside, interpolate, stream) {
    var subject = [],
      clip = [],
      i,
      n;
    segments.forEach(function (segment) {
      if ((n = segment.length - 1) <= 0) return;
      var n,
        p0 = segment[0],
        p1 = segment[n],
        x;
      if (pointEqual$2(p0, p1)) {
        if (!p0[2] && !p1[2]) {
          stream.lineStart();
          for (i = 0; i < n; ++i) stream.point((p0 = segment[i])[0], p0[1]);
          stream.lineEnd();
          return;
        }
        // handle degenerate cases by moving the point
        p1[0] += 2 * epsilon$1;
      }
      subject.push(x = new Intersection(p0, segment, null, true));
      clip.push(x.o = new Intersection(p0, null, x, false));
      subject.push(x = new Intersection(p1, segment, null, false));
      clip.push(x.o = new Intersection(p1, null, x, true));
    });
    if (!subject.length) return;
    clip.sort(compareIntersection);
    link(subject);
    link(clip);
    for (i = 0, n = clip.length; i < n; ++i) {
      clip[i].e = startInside = !startInside;
    }
    var start = subject[0],
      points,
      point;
    while (1) {
      // Find first unvisited intersection.
      var current = start,
        isSubject = true;
      while (current.v) if ((current = current.n) === start) return;
      points = current.z;
      stream.lineStart();
      do {
        current.v = current.o.v = true;
        if (current.e) {
          if (isSubject) {
            for (i = 0, n = points.length; i < n; ++i) stream.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.n.x, 1, stream);
          }
          current = current.n;
        } else {
          if (isSubject) {
            points = current.p.z;
            for (i = points.length - 1; i >= 0; --i) stream.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.p.x, -1, stream);
          }
          current = current.p;
        }
        current = current.o;
        points = current.z;
        isSubject = !isSubject;
      } while (!current.v);
      stream.lineEnd();
    }
  }
  function link(array) {
    if (!(n = array.length)) return;
    var n,
      i = 0,
      a = array[0],
      b;
    while (++i < n) {
      a.n = b = array[i];
      b.p = a;
      a = b;
    }
    a.n = b = array[0];
    b.p = a;
  }

  function longitude$1(point) {
    return abs$1(point[0]) <= pi$1 ? point[0] : sign$1(point[0]) * ((abs$1(point[0]) + pi$1) % tau$1 - pi$1);
  }
  function polygonContains (polygon, point) {
    var lambda = longitude$1(point),
      phi = point[1],
      sinPhi = sin$1(phi),
      normal = [sin$1(lambda), -cos$1(lambda), 0],
      angle = 0,
      winding = 0;
    var sum = new Adder();
    if (sinPhi === 1) phi = halfPi$1 + epsilon$1;else if (sinPhi === -1) phi = -halfPi$1 - epsilon$1;
    for (var i = 0, n = polygon.length; i < n; ++i) {
      if (!(m = (ring = polygon[i]).length)) continue;
      var ring,
        m,
        point0 = ring[m - 1],
        lambda0 = longitude$1(point0),
        phi0 = point0[1] / 2 + quarterPi$1,
        sinPhi0 = sin$1(phi0),
        cosPhi0 = cos$1(phi0);
      for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
        var point1 = ring[j],
          lambda1 = longitude$1(point1),
          phi1 = point1[1] / 2 + quarterPi$1,
          sinPhi1 = sin$1(phi1),
          cosPhi1 = cos$1(phi1),
          delta = lambda1 - lambda0,
          sign = delta >= 0 ? 1 : -1,
          absDelta = sign * delta,
          antimeridian = absDelta > pi$1,
          k = sinPhi0 * sinPhi1;
        sum.add(atan2$1(k * sign * sin$1(absDelta), cosPhi0 * cosPhi1 + k * cos$1(absDelta)));
        angle += antimeridian ? delta + sign * tau$1 : delta;

        // Are the longitudes either side of the point’s meridian (lambda),
        // and are the latitudes smaller than the parallel (phi)?
        if (antimeridian ^ lambda0 >= lambda ^ lambda1 >= lambda) {
          var arc = cartesianCross(cartesian$1(point0), cartesian$1(point1));
          cartesianNormalizeInPlace(arc);
          var intersection = cartesianCross(normal, arc);
          cartesianNormalizeInPlace(intersection);
          var phiArc = (antimeridian ^ delta >= 0 ? -1 : 1) * asin$1(intersection[2]);
          if (phi > phiArc || phi === phiArc && (arc[0] || arc[1])) {
            winding += antimeridian ^ delta >= 0 ? 1 : -1;
          }
        }
      }
    }

    // First, determine whether the South pole is inside or outside:
    //
    // It is inside if:
    // * the polygon winds around it in a clockwise direction.
    // * the polygon does not (cumulatively) wind around it, but has a negative
    //   (counter-clockwise) area.
    //
    // Second, count the (signed) number of times a segment crosses a lambda
    // from the point to the South pole.  If it is zero, then the point is the
    // same side as the South pole.

    return (angle < -epsilon$1 || angle < epsilon$1 && sum < -epsilon2$1) ^ winding & 1;
  }

  function clip (pointVisible, clipLine, interpolate, start) {
    return function (sink) {
      var line = clipLine(sink),
        ringBuffer = clipBuffer(),
        ringSink = clipLine(ringBuffer),
        polygonStarted = false,
        polygon,
        segments,
        ring;
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function () {
          clip.point = pointRing;
          clip.lineStart = ringStart;
          clip.lineEnd = ringEnd;
          segments = [];
          polygon = [];
        },
        polygonEnd: function () {
          clip.point = point;
          clip.lineStart = lineStart;
          clip.lineEnd = lineEnd;
          segments = merge(segments);
          var startInside = polygonContains(polygon, start);
          if (segments.length) {
            if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
            clipRejoin(segments, compareIntersection, startInside, interpolate, sink);
          } else if (startInside) {
            if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
            sink.lineStart();
            interpolate(null, null, 1, sink);
            sink.lineEnd();
          }
          if (polygonStarted) sink.polygonEnd(), polygonStarted = false;
          segments = polygon = null;
        },
        sphere: function () {
          sink.polygonStart();
          sink.lineStart();
          interpolate(null, null, 1, sink);
          sink.lineEnd();
          sink.polygonEnd();
        }
      };
      function point(lambda, phi) {
        if (pointVisible(lambda, phi)) sink.point(lambda, phi);
      }
      function pointLine(lambda, phi) {
        line.point(lambda, phi);
      }
      function lineStart() {
        clip.point = pointLine;
        line.lineStart();
      }
      function lineEnd() {
        clip.point = point;
        line.lineEnd();
      }
      function pointRing(lambda, phi) {
        ring.push([lambda, phi]);
        ringSink.point(lambda, phi);
      }
      function ringStart() {
        ringSink.lineStart();
        ring = [];
      }
      function ringEnd() {
        pointRing(ring[0][0], ring[0][1]);
        ringSink.lineEnd();
        var clean = ringSink.clean(),
          ringSegments = ringBuffer.result(),
          i,
          n = ringSegments.length,
          m,
          segment,
          point;
        ring.pop();
        polygon.push(ring);
        ring = null;
        if (!n) return;

        // No intersections.
        if (clean & 1) {
          segment = ringSegments[0];
          if ((m = segment.length - 1) > 0) {
            if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
            sink.lineStart();
            for (i = 0; i < m; ++i) sink.point((point = segment[i])[0], point[1]);
            sink.lineEnd();
          }
          return;
        }

        // Rejoin connected segments.
        // TODO reuse ringBuffer.rejoin()?
        if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));
        segments.push(ringSegments.filter(validSegment));
      }
      return clip;
    };
  }
  function validSegment(segment) {
    return segment.length > 1;
  }

  // Intersections are sorted along the clip edge. For both antimeridian cutting
  // and circle clipping, the same comparison is used.
  function compareIntersection(a, b) {
    return ((a = a.x)[0] < 0 ? a[1] - halfPi$1 - epsilon$1 : halfPi$1 - a[1]) - ((b = b.x)[0] < 0 ? b[1] - halfPi$1 - epsilon$1 : halfPi$1 - b[1]);
  }

  var clipAntimeridian = clip(function () {
    return true;
  }, clipAntimeridianLine, clipAntimeridianInterpolate, [-pi$1, -halfPi$1]);

  // Takes a line and cuts into visible segments. Return values: 0 - there were
  // intersections or the line was empty; 1 - no intersections; 2 - there were
  // intersections, and the first and last segments should be rejoined.
  function clipAntimeridianLine(stream) {
    var lambda0 = NaN,
      phi0 = NaN,
      sign0 = NaN,
      clean; // no intersections

    return {
      lineStart: function () {
        stream.lineStart();
        clean = 1;
      },
      point: function (lambda1, phi1) {
        var sign1 = lambda1 > 0 ? pi$1 : -pi$1,
          delta = abs$1(lambda1 - lambda0);
        if (abs$1(delta - pi$1) < epsilon$1) {
          // line crosses a pole
          stream.point(lambda0, phi0 = (phi0 + phi1) / 2 > 0 ? halfPi$1 : -halfPi$1);
          stream.point(sign0, phi0);
          stream.lineEnd();
          stream.lineStart();
          stream.point(sign1, phi0);
          stream.point(lambda1, phi0);
          clean = 0;
        } else if (sign0 !== sign1 && delta >= pi$1) {
          // line crosses antimeridian
          if (abs$1(lambda0 - sign0) < epsilon$1) lambda0 -= sign0 * epsilon$1; // handle degeneracies
          if (abs$1(lambda1 - sign1) < epsilon$1) lambda1 -= sign1 * epsilon$1;
          phi0 = clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1);
          stream.point(sign0, phi0);
          stream.lineEnd();
          stream.lineStart();
          stream.point(sign1, phi0);
          clean = 0;
        }
        stream.point(lambda0 = lambda1, phi0 = phi1);
        sign0 = sign1;
      },
      lineEnd: function () {
        stream.lineEnd();
        lambda0 = phi0 = NaN;
      },
      clean: function () {
        return 2 - clean; // if intersections, rejoin first and last segments
      }
    };
  }

  function clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1) {
    var cosPhi0,
      cosPhi1,
      sinLambda0Lambda1 = sin$1(lambda0 - lambda1);
    return abs$1(sinLambda0Lambda1) > epsilon$1 ? atan$1((sin$1(phi0) * (cosPhi1 = cos$1(phi1)) * sin$1(lambda1) - sin$1(phi1) * (cosPhi0 = cos$1(phi0)) * sin$1(lambda0)) / (cosPhi0 * cosPhi1 * sinLambda0Lambda1)) : (phi0 + phi1) / 2;
  }
  function clipAntimeridianInterpolate(from, to, direction, stream) {
    var phi;
    if (from == null) {
      phi = direction * halfPi$1;
      stream.point(-pi$1, phi);
      stream.point(0, phi);
      stream.point(pi$1, phi);
      stream.point(pi$1, 0);
      stream.point(pi$1, -phi);
      stream.point(0, -phi);
      stream.point(-pi$1, -phi);
      stream.point(-pi$1, 0);
      stream.point(-pi$1, phi);
    } else if (abs$1(from[0] - to[0]) > epsilon$1) {
      var lambda = from[0] < to[0] ? pi$1 : -pi$1;
      phi = direction * lambda / 2;
      stream.point(-lambda, phi);
      stream.point(0, phi);
      stream.point(lambda, phi);
    } else {
      stream.point(to[0], to[1]);
    }
  }

  function clipCircle (radius) {
    var cr = cos$1(radius),
      delta = 6 * radians$1,
      smallRadius = cr > 0,
      notHemisphere = abs$1(cr) > epsilon$1; // TODO optimise for this common case

    function interpolate(from, to, direction, stream) {
      circleStream(stream, radius, delta, direction, from, to);
    }
    function visible(lambda, phi) {
      return cos$1(lambda) * cos$1(phi) > cr;
    }

    // Takes a line and cuts into visible segments. Return values used for polygon
    // clipping: 0 - there were intersections or the line was empty; 1 - no
    // intersections 2 - there were intersections, and the first and last segments
    // should be rejoined.
    function clipLine(stream) {
      var point0,
        // previous point
        c0,
        // code for previous point
        v0,
        // visibility of previous point
        v00,
        // visibility of first point
        clean; // no intersections
      return {
        lineStart: function () {
          v00 = v0 = false;
          clean = 1;
        },
        point: function (lambda, phi) {
          var point1 = [lambda, phi],
            point2,
            v = visible(lambda, phi),
            c = smallRadius ? v ? 0 : code(lambda, phi) : v ? code(lambda + (lambda < 0 ? pi$1 : -pi$1), phi) : 0;
          if (!point0 && (v00 = v0 = v)) stream.lineStart();
          if (v !== v0) {
            point2 = intersect(point0, point1);
            if (!point2 || pointEqual$2(point0, point2) || pointEqual$2(point1, point2)) point1[2] = 1;
          }
          if (v !== v0) {
            clean = 0;
            if (v) {
              // outside going in
              stream.lineStart();
              point2 = intersect(point1, point0);
              stream.point(point2[0], point2[1]);
            } else {
              // inside going out
              point2 = intersect(point0, point1);
              stream.point(point2[0], point2[1], 2);
              stream.lineEnd();
            }
            point0 = point2;
          } else if (notHemisphere && point0 && smallRadius ^ v) {
            var t;
            // If the codes for two points are different, or are both zero,
            // and there this segment intersects with the small circle.
            if (!(c & c0) && (t = intersect(point1, point0, true))) {
              clean = 0;
              if (smallRadius) {
                stream.lineStart();
                stream.point(t[0][0], t[0][1]);
                stream.point(t[1][0], t[1][1]);
                stream.lineEnd();
              } else {
                stream.point(t[1][0], t[1][1]);
                stream.lineEnd();
                stream.lineStart();
                stream.point(t[0][0], t[0][1], 3);
              }
            }
          }
          if (v && (!point0 || !pointEqual$2(point0, point1))) {
            stream.point(point1[0], point1[1]);
          }
          point0 = point1, v0 = v, c0 = c;
        },
        lineEnd: function () {
          if (v0) stream.lineEnd();
          point0 = null;
        },
        // Rejoin first and last segments if there were intersections and the first
        // and last points were visible.
        clean: function () {
          return clean | (v00 && v0) << 1;
        }
      };
    }

    // Intersects the great circle between a and b with the clip circle.
    function intersect(a, b, two) {
      var pa = cartesian$1(a),
        pb = cartesian$1(b);

      // We have two planes, n1.p = d1 and n2.p = d2.
      // Find intersection line p(t) = c1 n1 + c2 n2 + t (n1 ⨯ n2).
      var n1 = [1, 0, 0],
        // normal
        n2 = cartesianCross(pa, pb),
        n2n2 = cartesianDot(n2, n2),
        n1n2 = n2[0],
        // cartesianDot(n1, n2),
        determinant = n2n2 - n1n2 * n1n2;

      // Two polar points.
      if (!determinant) return !two && a;
      var c1 = cr * n2n2 / determinant,
        c2 = -cr * n1n2 / determinant,
        n1xn2 = cartesianCross(n1, n2),
        A = cartesianScale(n1, c1),
        B = cartesianScale(n2, c2);
      cartesianAddInPlace(A, B);

      // Solve |p(t)|^2 = 1.
      var u = n1xn2,
        w = cartesianDot(A, u),
        uu = cartesianDot(u, u),
        t2 = w * w - uu * (cartesianDot(A, A) - 1);
      if (t2 < 0) return;
      var t = sqrt$1(t2),
        q = cartesianScale(u, (-w - t) / uu);
      cartesianAddInPlace(q, A);
      q = spherical$1(q);
      if (!two) return q;

      // Two intersection points.
      var lambda0 = a[0],
        lambda1 = b[0],
        phi0 = a[1],
        phi1 = b[1],
        z;
      if (lambda1 < lambda0) z = lambda0, lambda0 = lambda1, lambda1 = z;
      var delta = lambda1 - lambda0,
        polar = abs$1(delta - pi$1) < epsilon$1,
        meridian = polar || delta < epsilon$1;
      if (!polar && phi1 < phi0) z = phi0, phi0 = phi1, phi1 = z;

      // Check that the first point is between a and b.
      if (meridian ? polar ? phi0 + phi1 > 0 ^ q[1] < (abs$1(q[0] - lambda0) < epsilon$1 ? phi0 : phi1) : phi0 <= q[1] && q[1] <= phi1 : delta > pi$1 ^ (lambda0 <= q[0] && q[0] <= lambda1)) {
        var q1 = cartesianScale(u, (-w + t) / uu);
        cartesianAddInPlace(q1, A);
        return [q, spherical$1(q1)];
      }
    }

    // Generates a 4-bit vector representing the location of a point relative to
    // the small circle's bounding box.
    function code(lambda, phi) {
      var r = smallRadius ? radius : pi$1 - radius,
        code = 0;
      if (lambda < -r) code |= 1; // left
      else if (lambda > r) code |= 2; // right
      if (phi < -r) code |= 4; // below
      else if (phi > r) code |= 8; // above
      return code;
    }
    return clip(visible, clipLine, interpolate, smallRadius ? [0, -radius] : [-pi$1, radius - pi$1]);
  }

  function clipLine (a, b, x0, y0, x1, y1) {
    var ax = a[0],
      ay = a[1],
      bx = b[0],
      by = b[1],
      t0 = 0,
      t1 = 1,
      dx = bx - ax,
      dy = by - ay,
      r;
    r = x0 - ax;
    if (!dx && r > 0) return;
    r /= dx;
    if (dx < 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    } else if (dx > 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    }
    r = x1 - ax;
    if (!dx && r < 0) return;
    r /= dx;
    if (dx < 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    } else if (dx > 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    }
    r = y0 - ay;
    if (!dy && r > 0) return;
    r /= dy;
    if (dy < 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    } else if (dy > 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    }
    r = y1 - ay;
    if (!dy && r < 0) return;
    r /= dy;
    if (dy < 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    } else if (dy > 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    }
    if (t0 > 0) a[0] = ax + t0 * dx, a[1] = ay + t0 * dy;
    if (t1 < 1) b[0] = ax + t1 * dx, b[1] = ay + t1 * dy;
    return true;
  }

  var clipMax = 1e9,
    clipMin = -clipMax;

  // TODO Use d3-polygon’s polygonContains here for the ring check?
  // TODO Eliminate duplicate buffering in clipBuffer and polygon.push?

  function clipRectangle(x0, y0, x1, y1) {
    function visible(x, y) {
      return x0 <= x && x <= x1 && y0 <= y && y <= y1;
    }
    function interpolate(from, to, direction, stream) {
      var a = 0,
        a1 = 0;
      if (from == null || (a = corner(from, direction)) !== (a1 = corner(to, direction)) || comparePoint(from, to) < 0 ^ direction > 0) {
        do stream.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0); while ((a = (a + direction + 4) % 4) !== a1);
      } else {
        stream.point(to[0], to[1]);
      }
    }
    function corner(p, direction) {
      return abs$1(p[0] - x0) < epsilon$1 ? direction > 0 ? 0 : 3 : abs$1(p[0] - x1) < epsilon$1 ? direction > 0 ? 2 : 1 : abs$1(p[1] - y0) < epsilon$1 ? direction > 0 ? 1 : 0 : direction > 0 ? 3 : 2; // abs(p[1] - y1) < epsilon
    }

    function compareIntersection(a, b) {
      return comparePoint(a.x, b.x);
    }
    function comparePoint(a, b) {
      var ca = corner(a, 1),
        cb = corner(b, 1);
      return ca !== cb ? ca - cb : ca === 0 ? b[1] - a[1] : ca === 1 ? a[0] - b[0] : ca === 2 ? a[1] - b[1] : b[0] - a[0];
    }
    return function (stream) {
      var activeStream = stream,
        bufferStream = clipBuffer(),
        segments,
        polygon,
        ring,
        x__,
        y__,
        v__,
        // first point
        x_,
        y_,
        v_,
        // previous point
        first,
        clean;
      var clipStream = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: polygonStart,
        polygonEnd: polygonEnd
      };
      function point(x, y) {
        if (visible(x, y)) activeStream.point(x, y);
      }
      function polygonInside() {
        var winding = 0;
        for (var i = 0, n = polygon.length; i < n; ++i) {
          for (var ring = polygon[i], j = 1, m = ring.length, point = ring[0], a0, a1, b0 = point[0], b1 = point[1]; j < m; ++j) {
            a0 = b0, a1 = b1, point = ring[j], b0 = point[0], b1 = point[1];
            if (a1 <= y1) {
              if (b1 > y1 && (b0 - a0) * (y1 - a1) > (b1 - a1) * (x0 - a0)) ++winding;
            } else {
              if (b1 <= y1 && (b0 - a0) * (y1 - a1) < (b1 - a1) * (x0 - a0)) --winding;
            }
          }
        }
        return winding;
      }

      // Buffer geometry within a polygon and then clip it en masse.
      function polygonStart() {
        activeStream = bufferStream, segments = [], polygon = [], clean = true;
      }
      function polygonEnd() {
        var startInside = polygonInside(),
          cleanInside = clean && startInside,
          visible = (segments = merge(segments)).length;
        if (cleanInside || visible) {
          stream.polygonStart();
          if (cleanInside) {
            stream.lineStart();
            interpolate(null, null, 1, stream);
            stream.lineEnd();
          }
          if (visible) {
            clipRejoin(segments, compareIntersection, startInside, interpolate, stream);
          }
          stream.polygonEnd();
        }
        activeStream = stream, segments = polygon = ring = null;
      }
      function lineStart() {
        clipStream.point = linePoint;
        if (polygon) polygon.push(ring = []);
        first = true;
        v_ = false;
        x_ = y_ = NaN;
      }

      // TODO rather than special-case polygons, simply handle them separately.
      // Ideally, coincident intersection points should be jittered to avoid
      // clipping issues.
      function lineEnd() {
        if (segments) {
          linePoint(x__, y__);
          if (v__ && v_) bufferStream.rejoin();
          segments.push(bufferStream.result());
        }
        clipStream.point = point;
        if (v_) activeStream.lineEnd();
      }
      function linePoint(x, y) {
        var v = visible(x, y);
        if (polygon) ring.push([x, y]);
        if (first) {
          x__ = x, y__ = y, v__ = v;
          first = false;
          if (v) {
            activeStream.lineStart();
            activeStream.point(x, y);
          }
        } else {
          if (v && v_) activeStream.point(x, y);else {
            var a = [x_ = Math.max(clipMin, Math.min(clipMax, x_)), y_ = Math.max(clipMin, Math.min(clipMax, y_))],
              b = [x = Math.max(clipMin, Math.min(clipMax, x)), y = Math.max(clipMin, Math.min(clipMax, y))];
            if (clipLine(a, b, x0, y0, x1, y1)) {
              if (!v_) {
                activeStream.lineStart();
                activeStream.point(a[0], a[1]);
              }
              activeStream.point(b[0], b[1]);
              if (!v) activeStream.lineEnd();
              clean = false;
            } else if (v) {
              activeStream.lineStart();
              activeStream.point(x, y);
              clean = false;
            }
          }
        }
        x_ = x, y_ = y, v_ = v;
      }
      return clipStream;
    };
  }

  function interpolate (a, b) {
    var x0 = a[0] * radians$1,
      y0 = a[1] * radians$1,
      x1 = b[0] * radians$1,
      y1 = b[1] * radians$1,
      cy0 = cos$1(y0),
      sy0 = sin$1(y0),
      cy1 = cos$1(y1),
      sy1 = sin$1(y1),
      kx0 = cy0 * cos$1(x0),
      ky0 = cy0 * sin$1(x0),
      kx1 = cy1 * cos$1(x1),
      ky1 = cy1 * sin$1(x1),
      d = 2 * asin$1(sqrt$1(haversin(y1 - y0) + cy0 * cy1 * haversin(x1 - x0))),
      k = sin$1(d);
    var interpolate = d ? function (t) {
      var B = sin$1(t *= d) / k,
        A = sin$1(d - t) / k,
        x = A * kx0 + B * kx1,
        y = A * ky0 + B * ky1,
        z = A * sy0 + B * sy1;
      return [atan2$1(y, x) * degrees$1, atan2$1(z, sqrt$1(x * x + y * y)) * degrees$1];
    } : function () {
      return [x0 * degrees$1, y0 * degrees$1];
    };
    interpolate.distance = d;
    return interpolate;
  }

  var identity = (x => x);

  var x0 = Infinity,
    y0 = x0,
    x1 = -x0,
    y1 = x1;
  var boundsStream = {
    point: boundsPoint,
    lineStart: noop,
    lineEnd: noop,
    polygonStart: noop,
    polygonEnd: noop,
    result: function () {
      var bounds = [[x0, y0], [x1, y1]];
      x1 = y1 = -(y0 = x0 = Infinity);
      return bounds;
    }
  };
  function boundsPoint(x, y) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  var boundsStream$1 = boundsStream;

  function transformer(methods) {
    return function (stream) {
      var s = new TransformStream();
      for (var key in methods) s[key] = methods[key];
      s.stream = stream;
      return s;
    };
  }
  function TransformStream() {}
  TransformStream.prototype = {
    constructor: TransformStream,
    point: function (x, y) {
      this.stream.point(x, y);
    },
    sphere: function () {
      this.stream.sphere();
    },
    lineStart: function () {
      this.stream.lineStart();
    },
    lineEnd: function () {
      this.stream.lineEnd();
    },
    polygonStart: function () {
      this.stream.polygonStart();
    },
    polygonEnd: function () {
      this.stream.polygonEnd();
    }
  };

  function fit(projection, fitBounds, object) {
    var clip = projection.clipExtent && projection.clipExtent();
    projection.scale(150).translate([0, 0]);
    if (clip != null) projection.clipExtent(null);
    geoStream(object, projection.stream(boundsStream$1));
    fitBounds(boundsStream$1.result());
    if (clip != null) projection.clipExtent(clip);
    return projection;
  }
  function fitExtent(projection, extent, object) {
    return fit(projection, function (b) {
      var w = extent[1][0] - extent[0][0],
        h = extent[1][1] - extent[0][1],
        k = Math.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1])),
        x = +extent[0][0] + (w - k * (b[1][0] + b[0][0])) / 2,
        y = +extent[0][1] + (h - k * (b[1][1] + b[0][1])) / 2;
      projection.scale(150 * k).translate([x, y]);
    }, object);
  }
  function fitSize(projection, size, object) {
    return fitExtent(projection, [[0, 0], size], object);
  }
  function fitWidth(projection, width, object) {
    return fit(projection, function (b) {
      var w = +width,
        k = w / (b[1][0] - b[0][0]),
        x = (w - k * (b[1][0] + b[0][0])) / 2,
        y = -k * b[0][1];
      projection.scale(150 * k).translate([x, y]);
    }, object);
  }
  function fitHeight(projection, height, object) {
    return fit(projection, function (b) {
      var h = +height,
        k = h / (b[1][1] - b[0][1]),
        x = -k * b[0][0],
        y = (h - k * (b[1][1] + b[0][1])) / 2;
      projection.scale(150 * k).translate([x, y]);
    }, object);
  }

  var maxDepth = 16,
    // maximum depth of subdivision
    cosMinDistance = cos$1(30 * radians$1); // cos(minimum angular distance)

  function resample (project, delta2) {
    return +delta2 ? resample$1(project, delta2) : resampleNone(project);
  }
  function resampleNone(project) {
    return transformer({
      point: function (x, y) {
        x = project(x, y);
        this.stream.point(x[0], x[1]);
      }
    });
  }
  function resample$1(project, delta2) {
    function resampleLineTo(x0, y0, lambda0, a0, b0, c0, x1, y1, lambda1, a1, b1, c1, depth, stream) {
      var dx = x1 - x0,
        dy = y1 - y0,
        d2 = dx * dx + dy * dy;
      if (d2 > 4 * delta2 && depth--) {
        var a = a0 + a1,
          b = b0 + b1,
          c = c0 + c1,
          m = sqrt$1(a * a + b * b + c * c),
          phi2 = asin$1(c /= m),
          lambda2 = abs$1(abs$1(c) - 1) < epsilon$1 || abs$1(lambda0 - lambda1) < epsilon$1 ? (lambda0 + lambda1) / 2 : atan2$1(b, a),
          p = project(lambda2, phi2),
          x2 = p[0],
          y2 = p[1],
          dx2 = x2 - x0,
          dy2 = y2 - y0,
          dz = dy * dx2 - dx * dy2;
        if (dz * dz / d2 > delta2 // perpendicular projected distance
        || abs$1((dx * dx2 + dy * dy2) / d2 - 0.5) > 0.3 // midpoint close to an end
        || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) {
          // angular distance
          resampleLineTo(x0, y0, lambda0, a0, b0, c0, x2, y2, lambda2, a /= m, b /= m, c, depth, stream);
          stream.point(x2, y2);
          resampleLineTo(x2, y2, lambda2, a, b, c, x1, y1, lambda1, a1, b1, c1, depth, stream);
        }
      }
    }
    return function (stream) {
      var lambda00, x00, y00, a00, b00, c00,
        // first point
        lambda0, x0, y0, a0, b0, c0; // previous point

      var resampleStream = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function () {
          stream.polygonStart();
          resampleStream.lineStart = ringStart;
        },
        polygonEnd: function () {
          stream.polygonEnd();
          resampleStream.lineStart = lineStart;
        }
      };
      function point(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      }
      function lineStart() {
        x0 = NaN;
        resampleStream.point = linePoint;
        stream.lineStart();
      }
      function linePoint(lambda, phi) {
        var c = cartesian$1([lambda, phi]),
          p = project(lambda, phi);
        resampleLineTo(x0, y0, lambda0, a0, b0, c0, x0 = p[0], y0 = p[1], lambda0 = lambda, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
        stream.point(x0, y0);
      }
      function lineEnd() {
        resampleStream.point = point;
        stream.lineEnd();
      }
      function ringStart() {
        lineStart();
        resampleStream.point = ringPoint;
        resampleStream.lineEnd = ringEnd;
      }
      function ringPoint(lambda, phi) {
        linePoint(lambda00 = lambda, phi), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
        resampleStream.point = linePoint;
      }
      function ringEnd() {
        resampleLineTo(x0, y0, lambda0, a0, b0, c0, x00, y00, lambda00, a00, b00, c00, maxDepth, stream);
        resampleStream.lineEnd = lineEnd;
        lineEnd();
      }
      return resampleStream;
    };
  }

  var transformRadians = transformer({
    point: function (x, y) {
      this.stream.point(x * radians$1, y * radians$1);
    }
  });
  function transformRotate(rotate) {
    return transformer({
      point: function (x, y) {
        var r = rotate(x, y);
        return this.stream.point(r[0], r[1]);
      }
    });
  }
  function scaleTranslate(k, dx, dy, sx, sy) {
    function transform(x, y) {
      x *= sx;
      y *= sy;
      return [dx + k * x, dy - k * y];
    }
    transform.invert = function (x, y) {
      return [(x - dx) / k * sx, (dy - y) / k * sy];
    };
    return transform;
  }
  function scaleTranslateRotate(k, dx, dy, sx, sy, alpha) {
    if (!alpha) return scaleTranslate(k, dx, dy, sx, sy);
    var cosAlpha = cos$1(alpha),
      sinAlpha = sin$1(alpha),
      a = cosAlpha * k,
      b = sinAlpha * k,
      ai = cosAlpha / k,
      bi = sinAlpha / k,
      ci = (sinAlpha * dy - cosAlpha * dx) / k,
      fi = (sinAlpha * dx + cosAlpha * dy) / k;
    function transform(x, y) {
      x *= sx;
      y *= sy;
      return [a * x - b * y + dx, dy - b * x - a * y];
    }
    transform.invert = function (x, y) {
      return [sx * (ai * x - bi * y + ci), sy * (fi - bi * x - ai * y)];
    };
    return transform;
  }
  function projection(project) {
    return projectionMutator(function () {
      return project;
    })();
  }
  function projectionMutator(projectAt) {
    var project,
      k = 150,
      // scale
      x = 480,
      y = 250,
      // translate
      lambda = 0,
      phi = 0,
      // center
      deltaLambda = 0,
      deltaPhi = 0,
      deltaGamma = 0,
      rotate,
      // pre-rotate
      alpha = 0,
      // post-rotate angle
      sx = 1,
      // reflectX
      sy = 1,
      // reflectX
      theta = null,
      preclip = clipAntimeridian,
      // pre-clip angle
      x0 = null,
      y0,
      x1,
      y1,
      postclip = identity,
      // post-clip extent
      delta2 = 0.5,
      // precision
      projectResample,
      projectTransform,
      projectRotateTransform,
      cache,
      cacheStream;
    function projection(point) {
      return projectRotateTransform(point[0] * radians$1, point[1] * radians$1);
    }
    function invert(point) {
      point = projectRotateTransform.invert(point[0], point[1]);
      return point && [point[0] * degrees$1, point[1] * degrees$1];
    }
    projection.stream = function (stream) {
      return cache && cacheStream === stream ? cache : cache = transformRadians(transformRotate(rotate)(preclip(projectResample(postclip(cacheStream = stream)))));
    };
    projection.preclip = function (_) {
      return arguments.length ? (preclip = _, theta = undefined, reset()) : preclip;
    };
    projection.postclip = function (_) {
      return arguments.length ? (postclip = _, x0 = y0 = x1 = y1 = null, reset()) : postclip;
    };
    projection.clipAngle = function (_) {
      return arguments.length ? (preclip = +_ ? clipCircle(theta = _ * radians$1) : (theta = null, clipAntimeridian), reset()) : theta * degrees$1;
    };
    projection.clipExtent = function (_) {
      return arguments.length ? (postclip = _ == null ? (x0 = y0 = x1 = y1 = null, identity) : clipRectangle(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reset()) : x0 == null ? null : [[x0, y0], [x1, y1]];
    };
    projection.scale = function (_) {
      return arguments.length ? (k = +_, recenter()) : k;
    };
    projection.translate = function (_) {
      return arguments.length ? (x = +_[0], y = +_[1], recenter()) : [x, y];
    };
    projection.center = function (_) {
      return arguments.length ? (lambda = _[0] % 360 * radians$1, phi = _[1] % 360 * radians$1, recenter()) : [lambda * degrees$1, phi * degrees$1];
    };
    projection.rotate = function (_) {
      return arguments.length ? (deltaLambda = _[0] % 360 * radians$1, deltaPhi = _[1] % 360 * radians$1, deltaGamma = _.length > 2 ? _[2] % 360 * radians$1 : 0, recenter()) : [deltaLambda * degrees$1, deltaPhi * degrees$1, deltaGamma * degrees$1];
    };
    projection.angle = function (_) {
      return arguments.length ? (alpha = _ % 360 * radians$1, recenter()) : alpha * degrees$1;
    };
    projection.reflectX = function (_) {
      return arguments.length ? (sx = _ ? -1 : 1, recenter()) : sx < 0;
    };
    projection.reflectY = function (_) {
      return arguments.length ? (sy = _ ? -1 : 1, recenter()) : sy < 0;
    };
    projection.precision = function (_) {
      return arguments.length ? (projectResample = resample(projectTransform, delta2 = _ * _), reset()) : sqrt$1(delta2);
    };
    projection.fitExtent = function (extent, object) {
      return fitExtent(projection, extent, object);
    };
    projection.fitSize = function (size, object) {
      return fitSize(projection, size, object);
    };
    projection.fitWidth = function (width, object) {
      return fitWidth(projection, width, object);
    };
    projection.fitHeight = function (height, object) {
      return fitHeight(projection, height, object);
    };
    function recenter() {
      var center = scaleTranslateRotate(k, 0, 0, sx, sy, alpha).apply(null, project(lambda, phi)),
        transform = scaleTranslateRotate(k, x - center[0], y - center[1], sx, sy, alpha);
      rotate = rotateRadians(deltaLambda, deltaPhi, deltaGamma);
      projectTransform = compose(project, transform);
      projectRotateTransform = compose(rotate, projectTransform);
      projectResample = resample(projectTransform, delta2);
      return reset();
    }
    function reset() {
      cache = cacheStream = null;
      return projection;
    }
    return function () {
      project = projectAt.apply(this, arguments);
      projection.invert = project.invert && invert;
      return recenter();
    };
  }

  function azimuthalRaw(scale) {
    return function (x, y) {
      var cx = cos$1(x),
        cy = cos$1(y),
        k = scale(cx * cy);
      if (k === Infinity) return [2, 0];
      return [k * cy * sin$1(x), k * sin$1(y)];
    };
  }
  function azimuthalInvert(angle) {
    return function (x, y) {
      var z = sqrt$1(x * x + y * y),
        c = angle(z),
        sc = sin$1(c),
        cc = cos$1(c);
      return [atan2$1(x * sc, z * cc), asin$1(z && y * sc / z)];
    };
  }

  var azimuthalEqualAreaRaw = azimuthalRaw(function (cxcy) {
    return sqrt$1(2 / (1 + cxcy));
  });
  azimuthalEqualAreaRaw.invert = azimuthalInvert(function (z) {
    return 2 * asin$1(z / 2);
  });

  var azimuthalEquidistantRaw = azimuthalRaw(function (c) {
    return (c = acos$1(c)) && c / sin$1(c);
  });
  azimuthalEquidistantRaw.invert = azimuthalInvert(function (z) {
    return z;
  });

  function equirectangularRaw(lambda, phi) {
    return [lambda, phi];
  }
  equirectangularRaw.invert = equirectangularRaw;
  function geoEquirectangular () {
    return projection(equirectangularRaw).scale(152.63);
  }

  function gnomonicRaw(x, y) {
    var cy = cos$1(y),
      k = cos$1(x) * cy;
    return [cy * sin$1(x) / k, sin$1(y) / k];
  }
  gnomonicRaw.invert = azimuthalInvert(atan$1);
  function gnomonic () {
    return projection(gnomonicRaw).scale(144.049).clipAngle(60);
  }

  function orthographicRaw(x, y) {
    return [cos$1(y) * sin$1(x), sin$1(y)];
  }
  orthographicRaw.invert = azimuthalInvert(asin$1);
  function geoOrthographic () {
    return projection(orthographicRaw).scale(249.5).clipAngle(90 + epsilon$1);
  }

  var abs = Math.abs;
  var atan = Math.atan;
  var atan2 = Math.atan2;
  var cos = Math.cos;
  var exp = Math.exp;
  var floor = Math.floor;
  var log = Math.log;
  var max = Math.max;
  var min = Math.min;
  var pow = Math.pow;
  var round = Math.round;
  var sign = Math.sign || function (x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  };
  var sin = Math.sin;
  var tan = Math.tan;
  var epsilon = 1e-6;
  var epsilon2 = 1e-12;
  var pi = Math.PI;
  var halfPi = pi / 2;
  var quarterPi = pi / 4;
  var sqrt1_2 = Math.SQRT1_2;
  var sqrt2 = sqrt(2);
  var sqrtPi = sqrt(pi);
  var tau = pi * 2;
  var degrees = 180 / pi;
  var radians = pi / 180;
  function sinci(x) {
    return x ? x / Math.sin(x) : 1;
  }
  function asin(x) {
    return x > 1 ? halfPi : x < -1 ? -halfPi : Math.asin(x);
  }
  function acos(x) {
    return x > 1 ? 0 : x < -1 ? pi : Math.acos(x);
  }
  function sqrt(x) {
    return x > 0 ? Math.sqrt(x) : 0;
  }
  function tanh(x) {
    x = exp(2 * x);
    return (x - 1) / (x + 1);
  }
  function sinh(x) {
    return (exp(x) - exp(-x)) / 2;
  }
  function cosh(x) {
    return (exp(x) + exp(-x)) / 2;
  }
  function arsinh(x) {
    return log(x + sqrt(x * x + 1));
  }
  function arcosh(x) {
    return log(x + sqrt(x * x - 1));
  }

  function airyRaw(beta) {
    var tanBeta_2 = tan(beta / 2),
      b = 2 * log(cos(beta / 2)) / (tanBeta_2 * tanBeta_2);
    function forward(x, y) {
      var cosx = cos(x),
        cosy = cos(y),
        siny = sin(y),
        cosz = cosy * cosx,
        k = -((1 - cosz ? log((1 + cosz) / 2) / (1 - cosz) : -0.5) + b / (1 + cosz));
      return [k * cosy * sin(x), k * siny];
    }
    forward.invert = function (x, y) {
      var r = sqrt(x * x + y * y),
        z = -beta / 2,
        i = 50,
        delta;
      if (!r) return [0, 0];
      do {
        var z_2 = z / 2,
          cosz_2 = cos(z_2),
          sinz_2 = sin(z_2),
          tanz_2 = sinz_2 / cosz_2,
          lnsecz_2 = -log(abs(cosz_2));
        z -= delta = (2 / tanz_2 * lnsecz_2 - b * tanz_2 - r) / (-lnsecz_2 / (sinz_2 * sinz_2) + 1 - b / (2 * cosz_2 * cosz_2)) * (cosz_2 < 0 ? 0.7 : 1);
      } while (abs(delta) > epsilon && --i > 0);
      var sinz = sin(z);
      return [atan2(x * sinz, r * cos(z)), asin(y * sinz / r)];
    };
    return forward;
  }
  function geoAiry () {
    var beta = halfPi,
      m = projectionMutator(airyRaw),
      p = m(beta);
    p.radius = function (_) {
      return arguments.length ? m(beta = _ * radians) : beta * degrees;
    };
    return p.scale(179.976).clipAngle(147);
  }

  function aitoffRaw(x, y) {
    var cosy = cos(y),
      sincia = sinci(acos(cosy * cos(x /= 2)));
    return [2 * cosy * sin(x) * sincia, sin(y) * sincia];
  }

  // Abort if [x, y] is not within an ellipse centered at [0, 0] with
  // semi-major axis pi and semi-minor axis pi/2.
  aitoffRaw.invert = function (x, y) {
    if (x * x + 4 * y * y > pi * pi + epsilon) return;
    var x1 = x,
      y1 = y,
      i = 25;
    do {
      var sinx = sin(x1),
        sinx_2 = sin(x1 / 2),
        cosx_2 = cos(x1 / 2),
        siny = sin(y1),
        cosy = cos(y1),
        sin_2y = sin(2 * y1),
        sin2y = siny * siny,
        cos2y = cosy * cosy,
        sin2x_2 = sinx_2 * sinx_2,
        c = 1 - cos2y * cosx_2 * cosx_2,
        e = c ? acos(cosy * cosx_2) * sqrt(f = 1 / c) : f = 0,
        f,
        fx = 2 * e * cosy * sinx_2 - x,
        fy = e * siny - y,
        dxdx = f * (cos2y * sin2x_2 + e * cosy * cosx_2 * sin2y),
        dxdy = f * (0.5 * sinx * sin_2y - e * 2 * siny * sinx_2),
        dydx = f * 0.25 * (sin_2y * sinx_2 - e * siny * cos2y * sinx),
        dydy = f * (sin2y * cosx_2 + e * sin2x_2 * cosy),
        z = dxdy * dydx - dydy * dxdx;
      if (!z) break;
      var dx = (fy * dxdy - fx * dydy) / z,
        dy = (fx * dydx - fy * dxdx) / z;
      x1 -= dx, y1 -= dy;
    } while ((abs(dx) > epsilon || abs(dy) > epsilon) && --i > 0);
    return [x1, y1];
  };
  function geoAitoff () {
    return projection(aitoffRaw).scale(152.63);
  }

  function armadilloRaw(phi0) {
    var sinPhi0 = sin(phi0),
      cosPhi0 = cos(phi0),
      sPhi0 = phi0 >= 0 ? 1 : -1,
      tanPhi0 = tan(sPhi0 * phi0),
      k = (1 + sinPhi0 - cosPhi0) / 2;
    function forward(lambda, phi) {
      var cosPhi = cos(phi),
        cosLambda = cos(lambda /= 2);
      return [(1 + cosPhi) * sin(lambda), (sPhi0 * phi > -atan2(cosLambda, tanPhi0) - 1e-3 ? 0 : -sPhi0 * 10) + k + sin(phi) * cosPhi0 - (1 + cosPhi) * sinPhi0 * cosLambda // TODO D3 core should allow null or [NaN, NaN] to be returned.
      ];
    }

    forward.invert = function (x, y) {
      var lambda = 0,
        phi = 0,
        i = 50;
      do {
        var cosLambda = cos(lambda),
          sinLambda = sin(lambda),
          cosPhi = cos(phi),
          sinPhi = sin(phi),
          A = 1 + cosPhi,
          fx = A * sinLambda - x,
          fy = k + sinPhi * cosPhi0 - A * sinPhi0 * cosLambda - y,
          dxdLambda = A * cosLambda / 2,
          dxdPhi = -sinLambda * sinPhi,
          dydLambda = sinPhi0 * A * sinLambda / 2,
          dydPhi = cosPhi0 * cosPhi + sinPhi0 * cosLambda * sinPhi,
          denominator = dxdPhi * dydLambda - dydPhi * dxdLambda,
          dLambda = (fy * dxdPhi - fx * dydPhi) / denominator / 2,
          dPhi = (fx * dydLambda - fy * dxdLambda) / denominator;
        if (abs(dPhi) > 2) dPhi /= 2;
        lambda -= dLambda, phi -= dPhi;
      } while ((abs(dLambda) > epsilon || abs(dPhi) > epsilon) && --i > 0);
      return sPhi0 * phi > -atan2(cos(lambda), tanPhi0) - 1e-3 ? [lambda * 2, phi] : null;
    };
    return forward;
  }
  function geoArmadillo () {
    var phi0 = 20 * radians,
      sPhi0 = phi0 >= 0 ? 1 : -1,
      tanPhi0 = tan(sPhi0 * phi0),
      m = projectionMutator(armadilloRaw),
      p = m(phi0),
      stream_ = p.stream;
    p.parallel = function (_) {
      if (!arguments.length) return phi0 * degrees;
      tanPhi0 = tan((sPhi0 = (phi0 = _ * radians) >= 0 ? 1 : -1) * phi0);
      return m(phi0);
    };
    p.stream = function (stream) {
      var rotate = p.rotate(),
        rotateStream = stream_(stream),
        sphereStream = (p.rotate([0, 0]), stream_(stream)),
        precision = p.precision();
      p.rotate(rotate);
      rotateStream.sphere = function () {
        sphereStream.polygonStart(), sphereStream.lineStart();
        for (var lambda = sPhi0 * -180; sPhi0 * lambda < 180; lambda += sPhi0 * 90) sphereStream.point(lambda, sPhi0 * 90);
        if (phi0) while (sPhi0 * (lambda -= 3 * sPhi0 * precision) >= -180) {
          sphereStream.point(lambda, sPhi0 * -atan2(cos(lambda * radians / 2), tanPhi0) * degrees);
        }
        sphereStream.lineEnd(), sphereStream.polygonEnd();
      };
      return rotateStream;
    };
    return p.scale(218.695).center([0, 28.0974]);
  }

  function augustRaw(lambda, phi) {
    var tanPhi = tan(phi / 2),
      k = sqrt(1 - tanPhi * tanPhi),
      c = 1 + k * cos(lambda /= 2),
      x = sin(lambda) * k / c,
      y = tanPhi / c,
      x2 = x * x,
      y2 = y * y;
    return [4 / 3 * x * (3 + x2 - 3 * y2), 4 / 3 * y * (3 + 3 * x2 - y2)];
  }
  augustRaw.invert = function (x, y) {
    x *= 3 / 8, y *= 3 / 8;
    if (!x && abs(y) > 1) return null;
    var x2 = x * x,
      y2 = y * y,
      s = 1 + x2 + y2,
      sin3Eta = sqrt((s - sqrt(s * s - 4 * y * y)) / 2),
      eta = asin(sin3Eta) / 3,
      xi = sin3Eta ? arcosh(abs(y / sin3Eta)) / 3 : arsinh(abs(x)) / 3,
      cosEta = cos(eta),
      coshXi = cosh(xi),
      d = coshXi * coshXi - cosEta * cosEta;
    return [sign(x) * 2 * atan2(sinh(xi) * cosEta, 0.25 - d), sign(y) * 2 * atan2(coshXi * sin(eta), 0.25 + d)];
  };
  function geoAugust () {
    return projection(augustRaw).scale(66.1603);
  }

  var sqrt8 = sqrt(8),
    phi0 = log(1 + sqrt2);
  function bakerRaw(lambda, phi) {
    var phi0 = abs(phi);
    return phi0 < quarterPi ? [lambda, log(tan(quarterPi + phi / 2))] : [lambda * cos(phi0) * (2 * sqrt2 - 1 / sin(phi0)), sign(phi) * (2 * sqrt2 * (phi0 - quarterPi) - log(tan(phi0 / 2)))];
  }
  bakerRaw.invert = function (x, y) {
    if ((y0 = abs(y)) < phi0) return [x, 2 * atan(exp(y)) - halfPi];
    var phi = quarterPi,
      i = 25,
      delta,
      y0;
    do {
      var cosPhi_2 = cos(phi / 2),
        tanPhi_2 = tan(phi / 2);
      phi -= delta = (sqrt8 * (phi - quarterPi) - log(tanPhi_2) - y0) / (sqrt8 - cosPhi_2 * cosPhi_2 / (2 * tanPhi_2));
    } while (abs(delta) > epsilon2 && --i > 0);
    return [x / (cos(phi) * (sqrt8 - 1 / sin(phi))), sign(y) * phi];
  };
  function geoBaker () {
    return projection(bakerRaw).scale(112.314);
  }

  function berghausRaw(lobes) {
    var k = 2 * pi / lobes;
    function forward(lambda, phi) {
      var p = azimuthalEquidistantRaw(lambda, phi);
      if (abs(lambda) > halfPi) {
        // back hemisphere
        var theta = atan2(p[1], p[0]),
          r = sqrt(p[0] * p[0] + p[1] * p[1]),
          theta0 = k * round((theta - halfPi) / k) + halfPi,
          alpha = atan2(sin(theta -= theta0), 2 - cos(theta)); // angle relative to lobe end
        theta = theta0 + asin(pi / r * sin(alpha)) - alpha;
        p[0] = r * cos(theta);
        p[1] = r * sin(theta);
      }
      return p;
    }
    forward.invert = function (x, y) {
      var r = sqrt(x * x + y * y);
      if (r > halfPi) {
        var theta = atan2(y, x),
          theta0 = k * round((theta - halfPi) / k) + halfPi,
          s = theta > theta0 ? -1 : 1,
          A = r * cos(theta0 - theta),
          cotAlpha = 1 / tan(s * acos((A - pi) / sqrt(pi * (pi - 2 * A) + r * r)));
        theta = theta0 + 2 * atan((cotAlpha + s * sqrt(cotAlpha * cotAlpha - 3)) / 3);
        x = r * cos(theta), y = r * sin(theta);
      }
      return azimuthalEquidistantRaw.invert(x, y);
    };
    return forward;
  }
  function geoBerghaus () {
    var lobes = 5,
      m = projectionMutator(berghausRaw),
      p = m(lobes),
      projectionStream = p.stream,
      epsilon = 1e-2,
      cr = -cos(epsilon * radians),
      sr = sin(epsilon * radians);
    p.lobes = function (_) {
      return arguments.length ? m(lobes = +_) : lobes;
    };
    p.stream = function (stream) {
      var rotate = p.rotate(),
        rotateStream = projectionStream(stream),
        sphereStream = (p.rotate([0, 0]), projectionStream(stream));
      p.rotate(rotate);
      rotateStream.sphere = function () {
        sphereStream.polygonStart(), sphereStream.lineStart();
        for (var i = 0, delta = 360 / lobes, delta0 = 2 * pi / lobes, phi = 90 - 180 / lobes, phi0 = halfPi; i < lobes; ++i, phi -= delta, phi0 -= delta0) {
          sphereStream.point(atan2(sr * cos(phi0), cr) * degrees, asin(sr * sin(phi0)) * degrees);
          if (phi < -90) {
            sphereStream.point(-90, -180 - phi - epsilon);
            sphereStream.point(-90, -180 - phi + epsilon);
          } else {
            sphereStream.point(90, phi + epsilon);
            sphereStream.point(90, phi - epsilon);
          }
        }
        sphereStream.lineEnd(), sphereStream.polygonEnd();
      };
      return rotateStream;
    };
    return p.scale(87.8076).center([0, 17.1875]).clipAngle(180 - 1e-3);
  }

  function hammerRaw(A, B) {
    if (arguments.length < 2) B = A;
    if (B === 1) return azimuthalEqualAreaRaw;
    if (B === Infinity) return hammerQuarticAuthalicRaw;
    function forward(lambda, phi) {
      var coordinates = azimuthalEqualAreaRaw(lambda / B, phi);
      coordinates[0] *= A;
      return coordinates;
    }
    forward.invert = function (x, y) {
      var coordinates = azimuthalEqualAreaRaw.invert(x / A, y);
      coordinates[0] *= B;
      return coordinates;
    };
    return forward;
  }
  function hammerQuarticAuthalicRaw(lambda, phi) {
    return [lambda * cos(phi) / cos(phi /= 2), 2 * sin(phi)];
  }
  hammerQuarticAuthalicRaw.invert = function (x, y) {
    var phi = 2 * asin(y / 2);
    return [x * cos(phi / 2) / cos(phi), phi];
  };
  function geoHammer () {
    var B = 2,
      m = projectionMutator(hammerRaw),
      p = m(B);
    p.coefficient = function (_) {
      if (!arguments.length) return B;
      return m(B = +_);
    };
    return p.scale(169.529);
  }

  // Approximate Newton-Raphson
  // Solve f(x) = y, start from x
  function solve(f, y, x) {
    var steps = 100,
      delta,
      f0,
      f1;
    x = x === undefined ? 0 : +x;
    y = +y;
    do {
      f0 = f(x);
      f1 = f(x + epsilon);
      if (f0 === f1) f1 = f0 + epsilon;
      x -= delta = -1 * epsilon * (f0 - y) / (f0 - f1);
    } while (steps-- > 0 && abs(delta) > epsilon);
    return steps < 0 ? NaN : x;
  }

  // Approximate Newton-Raphson in 2D
  // Solve f(a,b) = [x,y]
  function solve2d(f, MAX_ITERATIONS, eps) {
    if (MAX_ITERATIONS === undefined) MAX_ITERATIONS = 40;
    if (eps === undefined) eps = epsilon2;
    return function (x, y, a, b) {
      var err2, da, db;
      a = a === undefined ? 0 : +a;
      b = b === undefined ? 0 : +b;
      for (var i = 0; i < MAX_ITERATIONS; i++) {
        var p = f(a, b),
          // diffs
          tx = p[0] - x,
          ty = p[1] - y;
        if (abs(tx) < eps && abs(ty) < eps) break; // we're there!

        // backtrack if we overshot
        var h = tx * tx + ty * ty;
        if (h > err2) {
          a -= da /= 2;
          b -= db /= 2;
          continue;
        }
        err2 = h;

        // partial derivatives
        var ea = (a > 0 ? -1 : 1) * eps,
          eb = (b > 0 ? -1 : 1) * eps,
          pa = f(a + ea, b),
          pb = f(a, b + eb),
          dxa = (pa[0] - p[0]) / ea,
          dya = (pa[1] - p[1]) / ea,
          dxb = (pb[0] - p[0]) / eb,
          dyb = (pb[1] - p[1]) / eb,
          // determinant
          D = dyb * dxa - dya * dxb,
          // newton step — or half-step for small D
          l = (abs(D) < 0.5 ? 0.5 : 1) / D;
        da = (ty * dxb - tx * dyb) * l;
        db = (tx * dya - ty * dxa) * l;
        a += da;
        b += db;
        if (abs(da) < eps && abs(db) < eps) break; // we're crawling
      }

      return [a, b];
    };
  }

  // Bertin 1953 as a modified Briesemeister
  // https://bl.ocks.org/Fil/5b9ee9636dfb6ffa53443c9006beb642
  function bertin1953Raw() {
    var hammer = hammerRaw(1.68, 2),
      fu = 1.4,
      k = 12;
    function forward(lambda, phi) {
      if (lambda + phi < -fu) {
        var u = (lambda - phi + 1.6) * (lambda + phi + fu) / 8;
        lambda += u;
        phi -= 0.8 * u * sin(phi + pi / 2);
      }
      var r = hammer(lambda, phi);
      var d = (1 - cos(lambda * phi)) / k;
      if (r[1] < 0) {
        r[0] *= 1 + d;
      }
      if (r[1] > 0) {
        r[1] *= 1 + d / 1.5 * r[0] * r[0];
      }
      return r;
    }
    forward.invert = solve2d(forward);
    return forward;
  }
  function geoBertin1953 () {
    // this projection should not be rotated
    return projection(bertin1953Raw()).rotate([-16.5, -42]).scale(176.57).center([7.93, 0.09]);
  }

  function mollweideBromleyTheta(cp, phi) {
    var cpsinPhi = cp * sin(phi),
      i = 30,
      delta;
    do phi -= delta = (phi + sin(phi) - cpsinPhi) / (1 + cos(phi)); while (abs(delta) > epsilon && --i > 0);
    return phi / 2;
  }
  function mollweideBromleyRaw(cx, cy, cp) {
    function forward(lambda, phi) {
      return [cx * lambda * cos(phi = mollweideBromleyTheta(cp, phi)), cy * sin(phi)];
    }
    forward.invert = function (x, y) {
      return y = asin(y / cy), [x / (cx * cos(y)), asin((2 * y + sin(2 * y)) / cp)];
    };
    return forward;
  }
  var mollweideRaw = mollweideBromleyRaw(sqrt2 / halfPi, sqrt2, pi);

  var k = 2.00276,
    w = 1.11072;
  function boggsRaw(lambda, phi) {
    var theta = mollweideBromleyTheta(pi, phi);
    return [k * lambda / (1 / cos(phi) + w / cos(theta)), (phi + sqrt2 * sin(theta)) / k];
  }
  boggsRaw.invert = function (x, y) {
    var ky = k * y,
      theta = y < 0 ? -quarterPi : quarterPi,
      i = 25,
      delta,
      phi;
    do {
      phi = ky - sqrt2 * sin(theta);
      theta -= delta = (sin(2 * theta) + 2 * theta - pi * sin(phi)) / (2 * cos(2 * theta) + 2 + pi * cos(phi) * sqrt2 * cos(theta));
    } while (abs(delta) > epsilon && --i > 0);
    phi = ky - sqrt2 * sin(theta);
    return [x * (1 / cos(phi) + w / cos(theta)) / k, phi];
  };
  function geoBoggs () {
    return projection(boggsRaw).scale(160.857);
  }

  function parallel1 (projectAt) {
    var phi0 = 0,
      m = projectionMutator(projectAt),
      p = m(phi0);
    p.parallel = function (_) {
      return arguments.length ? m(phi0 = _ * radians) : phi0 * degrees;
    };
    return p;
  }

  function sinusoidalRaw(lambda, phi) {
    return [lambda * cos(phi), phi];
  }
  sinusoidalRaw.invert = function (x, y) {
    return [x / cos(y), y];
  };
  function geoSinusoidal () {
    return projection(sinusoidalRaw).scale(152.63);
  }

  function bonneRaw(phi0) {
    if (!phi0) return sinusoidalRaw;
    var cotPhi0 = 1 / tan(phi0);
    function forward(lambda, phi) {
      var rho = cotPhi0 + phi0 - phi,
        e = rho ? lambda * cos(phi) / rho : rho;
      return [rho * sin(e), cotPhi0 - rho * cos(e)];
    }
    forward.invert = function (x, y) {
      var rho = sqrt(x * x + (y = cotPhi0 - y) * y),
        phi = cotPhi0 + phi0 - rho;
      return [rho / cos(phi) * atan2(x, y), phi];
    };
    return forward;
  }
  function geoBonne () {
    return parallel1(bonneRaw).scale(123.082).center([0, 26.1441]).parallel(45);
  }

  function bottomleyRaw(sinPsi) {
    function forward(lambda, phi) {
      var rho = halfPi - phi,
        eta = rho ? lambda * sinPsi * sin(rho) / rho : rho;
      return [rho * sin(eta) / sinPsi, halfPi - rho * cos(eta)];
    }
    forward.invert = function (x, y) {
      var x1 = x * sinPsi,
        y1 = halfPi - y,
        rho = sqrt(x1 * x1 + y1 * y1),
        eta = atan2(x1, y1);
      return [(rho ? rho / sin(rho) : 1) * eta / sinPsi, halfPi - rho];
    };
    return forward;
  }
  function geoBottomley () {
    var sinPsi = 0.5,
      m = projectionMutator(bottomleyRaw),
      p = m(sinPsi);
    p.fraction = function (_) {
      return arguments.length ? m(sinPsi = +_) : sinPsi;
    };
    return p.scale(158.837);
  }

  var bromleyRaw = mollweideBromleyRaw(1, 4 / pi, pi);
  function geoBromley () {
    return projection(bromleyRaw).scale(152.63);
  }

  // Azimuthal distance.
  function distance(dPhi, c1, s1, c2, s2, dLambda) {
    var cosdLambda = cos(dLambda),
      r;
    if (abs(dPhi) > 1 || abs(dLambda) > 1) {
      r = acos(s1 * s2 + c1 * c2 * cosdLambda);
    } else {
      var sindPhi = sin(dPhi / 2),
        sindLambda = sin(dLambda / 2);
      r = 2 * asin(sqrt(sindPhi * sindPhi + c1 * c2 * sindLambda * sindLambda));
    }
    return abs(r) > epsilon ? [r, atan2(c2 * sin(dLambda), c1 * s2 - s1 * c2 * cosdLambda)] : [0, 0];
  }

  // Angle opposite a, and contained between sides of lengths b and c.
  function angle$1(b, c, a) {
    return acos((b * b + c * c - a * a) / (2 * b * c));
  }

  // Normalize longitude.
  function longitude(lambda) {
    return lambda - 2 * pi * floor((lambda + pi) / (2 * pi));
  }
  function chamberlinRaw(p0, p1, p2) {
    var points = [[p0[0], p0[1], sin(p0[1]), cos(p0[1])], [p1[0], p1[1], sin(p1[1]), cos(p1[1])], [p2[0], p2[1], sin(p2[1]), cos(p2[1])]];
    for (var a = points[2], b, i = 0; i < 3; ++i, a = b) {
      b = points[i];
      a.v = distance(b[1] - a[1], a[3], a[2], b[3], b[2], b[0] - a[0]);
      a.point = [0, 0];
    }
    var beta0 = angle$1(points[0].v[0], points[2].v[0], points[1].v[0]),
      beta1 = angle$1(points[0].v[0], points[1].v[0], points[2].v[0]),
      beta2 = pi - beta0;
    points[2].point[1] = 0;
    points[0].point[0] = -(points[1].point[0] = points[0].v[0] / 2);
    var mean = [points[2].point[0] = points[0].point[0] + points[2].v[0] * cos(beta0), 2 * (points[0].point[1] = points[1].point[1] = points[2].v[0] * sin(beta0))];
    function forward(lambda, phi) {
      var sinPhi = sin(phi),
        cosPhi = cos(phi),
        v = new Array(3),
        i;

      // Compute distance and azimuth from control points.
      for (i = 0; i < 3; ++i) {
        var p = points[i];
        v[i] = distance(phi - p[1], p[3], p[2], cosPhi, sinPhi, lambda - p[0]);
        if (!v[i][0]) return p.point;
        v[i][1] = longitude(v[i][1] - p.v[1]);
      }

      // Arithmetic mean of interception points.
      var point = mean.slice();
      for (i = 0; i < 3; ++i) {
        var j = i == 2 ? 0 : i + 1;
        var a = angle$1(points[i].v[0], v[i][0], v[j][0]);
        if (v[i][1] < 0) a = -a;
        if (!i) {
          point[0] += v[i][0] * cos(a);
          point[1] -= v[i][0] * sin(a);
        } else if (i == 1) {
          a = beta1 - a;
          point[0] -= v[i][0] * cos(a);
          point[1] -= v[i][0] * sin(a);
        } else {
          a = beta2 - a;
          point[0] += v[i][0] * cos(a);
          point[1] += v[i][0] * sin(a);
        }
      }
      point[0] /= 3, point[1] /= 3;
      return point;
    }
    return forward;
  }
  function pointRadians(p) {
    return p[0] *= radians, p[1] *= radians, p;
  }
  function chamberlinAfrica() {
    return chamberlin([0, 22], [45, 22], [22.5, -22]).scale(380).center([22.5, 2]);
  }
  function chamberlin(p0, p1, p2) {
    // TODO order matters!
    var c = centroid({
        type: "MultiPoint",
        coordinates: [p0, p1, p2]
      }),
      R = [-c[0], -c[1]],
      r = rotation(R),
      f = chamberlinRaw(pointRadians(r(p0)), pointRadians(r(p1)), pointRadians(r(p2)));
    f.invert = solve2d(f);
    var p = projection(f).rotate(R),
      center = p.center;
    delete p.rotate;
    p.center = function (_) {
      return arguments.length ? center(r(_)) : r.invert(center());
    };
    return p.clipAngle(90);
  }

  function collignonRaw(lambda, phi) {
    var alpha = sqrt(1 - sin(phi));
    return [2 / sqrtPi * lambda * alpha, sqrtPi * (1 - alpha)];
  }
  collignonRaw.invert = function (x, y) {
    var lambda = (lambda = y / sqrtPi - 1) * lambda;
    return [lambda > 0 ? x * sqrt(pi / lambda) / 2 : 0, asin(1 - lambda)];
  };
  function geoCollignon () {
    return projection(collignonRaw).scale(95.6464).center([0, 30]);
  }

  function craigRaw(phi0) {
    var tanPhi0 = tan(phi0);
    function forward(lambda, phi) {
      return [lambda, (lambda ? lambda / sin(lambda) : 1) * (sin(phi) * cos(lambda) - tanPhi0 * cos(phi))];
    }
    forward.invert = tanPhi0 ? function (x, y) {
      if (x) y *= sin(x) / x;
      var cosLambda = cos(x);
      return [x, 2 * atan2(sqrt(cosLambda * cosLambda + tanPhi0 * tanPhi0 - y * y) - cosLambda, tanPhi0 - y)];
    } : function (x, y) {
      return [x, asin(x ? y * tan(x) / x : y)];
    };
    return forward;
  }
  function geoCraig () {
    return parallel1(craigRaw).scale(249.828).clipAngle(90);
  }

  var sqrt3 = sqrt(3);
  function crasterRaw(lambda, phi) {
    return [sqrt3 * lambda * (2 * cos(2 * phi / 3) - 1) / sqrtPi, sqrt3 * sqrtPi * sin(phi / 3)];
  }
  crasterRaw.invert = function (x, y) {
    var phi = 3 * asin(y / (sqrt3 * sqrtPi));
    return [sqrtPi * x / (sqrt3 * (2 * cos(2 * phi / 3) - 1)), phi];
  };
  function geoCraster () {
    return projection(crasterRaw).scale(156.19);
  }

  function cylindricalEqualAreaRaw(phi0) {
    var cosPhi0 = cos(phi0);
    function forward(lambda, phi) {
      return [lambda * cosPhi0, sin(phi) / cosPhi0];
    }
    forward.invert = function (x, y) {
      return [x / cosPhi0, asin(y * cosPhi0)];
    };
    return forward;
  }
  function geoCylindricalEqualArea () {
    return parallel1(cylindricalEqualAreaRaw).parallel(38.58) // acos(sqrt(width / height / pi)) * radians
    .scale(195.044); // width / (sqrt(width / height / pi) * 2 * pi)
  }

  function cylindricalStereographicRaw(phi0) {
    var cosPhi0 = cos(phi0);
    function forward(lambda, phi) {
      return [lambda * cosPhi0, (1 + cosPhi0) * tan(phi / 2)];
    }
    forward.invert = function (x, y) {
      return [x / cosPhi0, atan(y / (1 + cosPhi0)) * 2];
    };
    return forward;
  }
  function geoCylindricalStereographic () {
    return parallel1(cylindricalStereographicRaw).scale(124.75);
  }

  function eckert1Raw(lambda, phi) {
    var alpha = sqrt(8 / (3 * pi));
    return [alpha * lambda * (1 - abs(phi) / pi), alpha * phi];
  }
  eckert1Raw.invert = function (x, y) {
    var alpha = sqrt(8 / (3 * pi)),
      phi = y / alpha;
    return [x / (alpha * (1 - abs(phi) / pi)), phi];
  };
  function geoEckert1 () {
    return projection(eckert1Raw).scale(165.664);
  }

  function eckert2Raw(lambda, phi) {
    var alpha = sqrt(4 - 3 * sin(abs(phi)));
    return [2 / sqrt(6 * pi) * lambda * alpha, sign(phi) * sqrt(2 * pi / 3) * (2 - alpha)];
  }
  eckert2Raw.invert = function (x, y) {
    var alpha = 2 - abs(y) / sqrt(2 * pi / 3);
    return [x * sqrt(6 * pi) / (2 * alpha), sign(y) * asin((4 - alpha * alpha) / 3)];
  };
  function geoEckert2 () {
    return projection(eckert2Raw).scale(165.664);
  }

  function eckert3Raw(lambda, phi) {
    var k = sqrt(pi * (4 + pi));
    return [2 / k * lambda * (1 + sqrt(1 - 4 * phi * phi / (pi * pi))), 4 / k * phi];
  }
  eckert3Raw.invert = function (x, y) {
    var k = sqrt(pi * (4 + pi)) / 2;
    return [x * k / (1 + sqrt(1 - y * y * (4 + pi) / (4 * pi))), y * k / 2];
  };
  function geoEckert3 () {
    return projection(eckert3Raw).scale(180.739);
  }

  function eckert4Raw(lambda, phi) {
    var k = (2 + halfPi) * sin(phi);
    phi /= 2;
    for (var i = 0, delta = Infinity; i < 10 && abs(delta) > epsilon; i++) {
      var cosPhi = cos(phi);
      phi -= delta = (phi + sin(phi) * (cosPhi + 2) - k) / (2 * cosPhi * (1 + cosPhi));
    }
    return [2 / sqrt(pi * (4 + pi)) * lambda * (1 + cos(phi)), 2 * sqrt(pi / (4 + pi)) * sin(phi)];
  }
  eckert4Raw.invert = function (x, y) {
    var A = y * sqrt((4 + pi) / pi) / 2,
      k = asin(A),
      c = cos(k);
    return [x / (2 / sqrt(pi * (4 + pi)) * (1 + c)), asin((k + A * (c + 2)) / (2 + halfPi))];
  };
  function geoEckert4 () {
    return projection(eckert4Raw).scale(180.739);
  }

  function eckert5Raw(lambda, phi) {
    return [lambda * (1 + cos(phi)) / sqrt(2 + pi), 2 * phi / sqrt(2 + pi)];
  }
  eckert5Raw.invert = function (x, y) {
    var k = sqrt(2 + pi),
      phi = y * k / 2;
    return [k * x / (1 + cos(phi)), phi];
  };
  function geoEckert5 () {
    return projection(eckert5Raw).scale(173.044);
  }

  function eckert6Raw(lambda, phi) {
    var k = (1 + halfPi) * sin(phi);
    for (var i = 0, delta = Infinity; i < 10 && abs(delta) > epsilon; i++) {
      phi -= delta = (phi + sin(phi) - k) / (1 + cos(phi));
    }
    k = sqrt(2 + pi);
    return [lambda * (1 + cos(phi)) / k, 2 * phi / k];
  }
  eckert6Raw.invert = function (x, y) {
    var j = 1 + halfPi,
      k = sqrt(j / 2);
    return [x * 2 * k / (1 + cos(y *= k)), asin((y + sin(y)) / j)];
  };
  function geoEckert6 () {
    return projection(eckert6Raw).scale(173.044);
  }

  var eisenlohrK = 3 + 2 * sqrt2;
  function eisenlohrRaw(lambda, phi) {
    var s0 = sin(lambda /= 2),
      c0 = cos(lambda),
      k = sqrt(cos(phi)),
      c1 = cos(phi /= 2),
      t = sin(phi) / (c1 + sqrt2 * c0 * k),
      c = sqrt(2 / (1 + t * t)),
      v = sqrt((sqrt2 * c1 + (c0 + s0) * k) / (sqrt2 * c1 + (c0 - s0) * k));
    return [eisenlohrK * (c * (v - 1 / v) - 2 * log(v)), eisenlohrK * (c * t * (v + 1 / v) - 2 * atan(t))];
  }
  eisenlohrRaw.invert = function (x, y) {
    if (!(p = augustRaw.invert(x / 1.2, y * 1.065))) return null;
    var lambda = p[0],
      phi = p[1],
      i = 20,
      p;
    x /= eisenlohrK, y /= eisenlohrK;
    do {
      var _0 = lambda / 2,
        _1 = phi / 2,
        s0 = sin(_0),
        c0 = cos(_0),
        s1 = sin(_1),
        c1 = cos(_1),
        cos1 = cos(phi),
        k = sqrt(cos1),
        t = s1 / (c1 + sqrt2 * c0 * k),
        t2 = t * t,
        c = sqrt(2 / (1 + t2)),
        v0 = sqrt2 * c1 + (c0 + s0) * k,
        v1 = sqrt2 * c1 + (c0 - s0) * k,
        v2 = v0 / v1,
        v = sqrt(v2),
        vm1v = v - 1 / v,
        vp1v = v + 1 / v,
        fx = c * vm1v - 2 * log(v) - x,
        fy = c * t * vp1v - 2 * atan(t) - y,
        deltatDeltaLambda = s1 && sqrt1_2 * k * s0 * t2 / s1,
        deltatDeltaPhi = (sqrt2 * c0 * c1 + k) / (2 * (c1 + sqrt2 * c0 * k) * (c1 + sqrt2 * c0 * k) * k),
        deltacDeltat = -0.5 * t * c * c * c,
        deltacDeltaLambda = deltacDeltat * deltatDeltaLambda,
        deltacDeltaPhi = deltacDeltat * deltatDeltaPhi,
        A = (A = 2 * c1 + sqrt2 * k * (c0 - s0)) * A * v,
        deltavDeltaLambda = (sqrt2 * c0 * c1 * k + cos1) / A,
        deltavDeltaPhi = -(sqrt2 * s0 * s1) / (k * A),
        deltaxDeltaLambda = vm1v * deltacDeltaLambda - 2 * deltavDeltaLambda / v + c * (deltavDeltaLambda + deltavDeltaLambda / v2),
        deltaxDeltaPhi = vm1v * deltacDeltaPhi - 2 * deltavDeltaPhi / v + c * (deltavDeltaPhi + deltavDeltaPhi / v2),
        deltayDeltaLambda = t * vp1v * deltacDeltaLambda - 2 * deltatDeltaLambda / (1 + t2) + c * vp1v * deltatDeltaLambda + c * t * (deltavDeltaLambda - deltavDeltaLambda / v2),
        deltayDeltaPhi = t * vp1v * deltacDeltaPhi - 2 * deltatDeltaPhi / (1 + t2) + c * vp1v * deltatDeltaPhi + c * t * (deltavDeltaPhi - deltavDeltaPhi / v2),
        denominator = deltaxDeltaPhi * deltayDeltaLambda - deltayDeltaPhi * deltaxDeltaLambda;
      if (!denominator) break;
      var deltaLambda = (fy * deltaxDeltaPhi - fx * deltayDeltaPhi) / denominator,
        deltaPhi = (fx * deltayDeltaLambda - fy * deltaxDeltaLambda) / denominator;
      lambda -= deltaLambda;
      phi = max(-halfPi, min(halfPi, phi - deltaPhi));
    } while ((abs(deltaLambda) > epsilon || abs(deltaPhi) > epsilon) && --i > 0);
    return abs(abs(phi) - halfPi) < epsilon ? [0, phi] : i && [lambda, phi];
  };
  function geoEisenlohr () {
    return projection(eisenlohrRaw).scale(62.5271);
  }

  var faheyK = cos(35 * radians);
  function faheyRaw(lambda, phi) {
    var t = tan(phi / 2);
    return [lambda * faheyK * sqrt(1 - t * t), (1 + faheyK) * t];
  }
  faheyRaw.invert = function (x, y) {
    var t = y / (1 + faheyK);
    return [x && x / (faheyK * sqrt(1 - t * t)), 2 * atan(t)];
  };
  function geoFahey () {
    return projection(faheyRaw).scale(137.152);
  }

  function foucautRaw(lambda, phi) {
    var k = phi / 2,
      cosk = cos(k);
    return [2 * lambda / sqrtPi * cos(phi) * cosk * cosk, sqrtPi * tan(k)];
  }
  foucautRaw.invert = function (x, y) {
    var k = atan(y / sqrtPi),
      cosk = cos(k),
      phi = 2 * k;
    return [x * sqrtPi / 2 / (cos(phi) * cosk * cosk), phi];
  };
  function geoFoucaut () {
    return projection(foucautRaw).scale(135.264);
  }

  function foucautSinusoidalRaw(alpha) {
    var beta = 1 - alpha,
      equatorial = raw(pi, 0)[0] - raw(-pi, 0)[0],
      polar = raw(0, halfPi)[1] - raw(0, -halfPi)[1],
      ratio = sqrt(2 * polar / equatorial);
    function raw(lambda, phi) {
      var cosphi = cos(phi),
        sinphi = sin(phi);
      return [cosphi / (beta + alpha * cosphi) * lambda, beta * phi + alpha * sinphi];
    }
    function forward(lambda, phi) {
      var p = raw(lambda, phi);
      return [p[0] * ratio, p[1] / ratio];
    }
    function forwardMeridian(phi) {
      return forward(0, phi)[1];
    }
    forward.invert = function (x, y) {
      var phi = solve(forwardMeridian, y),
        lambda = x / ratio * (alpha + beta / cos(phi));
      return [lambda, phi];
    };
    return forward;
  }
  function geoFoucautSinusoidal () {
    var alpha = 0.5,
      m = projectionMutator(foucautSinusoidalRaw),
      p = m(alpha);
    p.alpha = function (_) {
      return arguments.length ? m(alpha = +_) : alpha;
    };
    return p.scale(168.725);
  }

  function gilbertForward(point) {
    return [point[0] / 2, asin(tan(point[1] / 2 * radians)) * degrees];
  }
  function gilbertInvert(point) {
    return [point[0] * 2, 2 * atan(sin(point[1] * radians)) * degrees];
  }
  function geoGilbert (projectionType) {
    if (projectionType == null) projectionType = geoOrthographic;
    var projection = projectionType(),
      equirectangular = geoEquirectangular().scale(degrees).precision(0).clipAngle(null).translate([0, 0]); // antimeridian cutting

    function gilbert(point) {
      return projection(gilbertForward(point));
    }
    if (projection.invert) gilbert.invert = function (point) {
      return gilbertInvert(projection.invert(point));
    };
    gilbert.stream = function (stream) {
      var s1 = projection.stream(stream),
        s0 = equirectangular.stream({
          point: function (lambda, phi) {
            s1.point(lambda / 2, asin(tan(-phi / 2 * radians)) * degrees);
          },
          lineStart: function () {
            s1.lineStart();
          },
          lineEnd: function () {
            s1.lineEnd();
          },
          polygonStart: function () {
            s1.polygonStart();
          },
          polygonEnd: function () {
            s1.polygonEnd();
          }
        });
      s0.sphere = s1.sphere;
      return s0;
    };
    function property(name) {
      gilbert[name] = function () {
        return arguments.length ? (projection[name].apply(projection, arguments), gilbert) : projection[name]();
      };
    }
    gilbert.rotate = function (_) {
      return arguments.length ? (equirectangular.rotate(_), gilbert) : equirectangular.rotate();
    };
    gilbert.center = function (_) {
      return arguments.length ? (projection.center(gilbertForward(_)), gilbert) : gilbertInvert(projection.center());
    };
    property("angle");
    property("clipAngle");
    property("clipExtent");
    property("fitExtent");
    property("fitHeight");
    property("fitSize");
    property("fitWidth");
    property("scale");
    property("translate");
    property("precision");
    return gilbert.scale(249.5);
  }

  function gingeryRaw(rho, n) {
    var k = 2 * pi / n,
      rho2 = rho * rho;
    function forward(lambda, phi) {
      var p = azimuthalEquidistantRaw(lambda, phi),
        x = p[0],
        y = p[1],
        r2 = x * x + y * y;
      if (r2 > rho2) {
        var r = sqrt(r2),
          theta = atan2(y, x),
          theta0 = k * round(theta / k),
          alpha = theta - theta0,
          rhoCosAlpha = rho * cos(alpha),
          k_ = (rho * sin(alpha) - alpha * sin(rhoCosAlpha)) / (halfPi - rhoCosAlpha),
          s_ = gingeryLength(alpha, k_),
          e = (pi - rho) / gingeryIntegrate(s_, rhoCosAlpha, pi);
        x = r;
        var i = 50,
          delta;
        do {
          x -= delta = (rho + gingeryIntegrate(s_, rhoCosAlpha, x) * e - r) / (s_(x) * e);
        } while (abs(delta) > epsilon && --i > 0);
        y = alpha * sin(x);
        if (x < halfPi) y -= k_ * (x - halfPi);
        var s = sin(theta0),
          c = cos(theta0);
        p[0] = x * c - y * s;
        p[1] = x * s + y * c;
      }
      return p;
    }
    forward.invert = function (x, y) {
      var r2 = x * x + y * y;
      if (r2 > rho2) {
        var r = sqrt(r2),
          theta = atan2(y, x),
          theta0 = k * round(theta / k),
          dTheta = theta - theta0;
        x = r * cos(dTheta);
        y = r * sin(dTheta);
        var x_halfPi = x - halfPi,
          sinx = sin(x),
          alpha = y / sinx,
          delta = x < halfPi ? Infinity : 0,
          i = 10;
        while (true) {
          var rhosinAlpha = rho * sin(alpha),
            rhoCosAlpha = rho * cos(alpha),
            sinRhoCosAlpha = sin(rhoCosAlpha),
            halfPi_RhoCosAlpha = halfPi - rhoCosAlpha,
            k_ = (rhosinAlpha - alpha * sinRhoCosAlpha) / halfPi_RhoCosAlpha,
            s_ = gingeryLength(alpha, k_);
          if (abs(delta) < epsilon2 || ! --i) break;
          alpha -= delta = (alpha * sinx - k_ * x_halfPi - y) / (sinx - x_halfPi * 2 * (halfPi_RhoCosAlpha * (rhoCosAlpha + alpha * rhosinAlpha * cos(rhoCosAlpha) - sinRhoCosAlpha) - rhosinAlpha * (rhosinAlpha - alpha * sinRhoCosAlpha)) / (halfPi_RhoCosAlpha * halfPi_RhoCosAlpha));
        }
        r = rho + gingeryIntegrate(s_, rhoCosAlpha, x) * (pi - rho) / gingeryIntegrate(s_, rhoCosAlpha, pi);
        theta = theta0 + alpha;
        x = r * cos(theta);
        y = r * sin(theta);
      }
      return azimuthalEquidistantRaw.invert(x, y);
    };
    return forward;
  }
  function gingeryLength(alpha, k) {
    return function (x) {
      var y_ = alpha * cos(x);
      if (x < halfPi) y_ -= k;
      return sqrt(1 + y_ * y_);
    };
  }

  // Numerical integration: trapezoidal rule.
  function gingeryIntegrate(f, a, b) {
    var n = 50,
      h = (b - a) / n,
      s = f(a) + f(b);
    for (var i = 1, x = a; i < n; ++i) s += 2 * f(x += h);
    return s * 0.5 * h;
  }
  function geoGingery () {
    var n = 6,
      rho = 30 * radians,
      cRho = cos(rho),
      sRho = sin(rho),
      m = projectionMutator(gingeryRaw),
      p = m(rho, n),
      stream_ = p.stream,
      epsilon = 1e-2,
      cr = -cos(epsilon * radians),
      sr = sin(epsilon * radians);
    p.radius = function (_) {
      if (!arguments.length) return rho * degrees;
      cRho = cos(rho = _ * radians);
      sRho = sin(rho);
      return m(rho, n);
    };
    p.lobes = function (_) {
      if (!arguments.length) return n;
      return m(rho, n = +_);
    };
    p.stream = function (stream) {
      var rotate = p.rotate(),
        rotateStream = stream_(stream),
        sphereStream = (p.rotate([0, 0]), stream_(stream));
      p.rotate(rotate);
      rotateStream.sphere = function () {
        sphereStream.polygonStart(), sphereStream.lineStart();
        for (var i = 0, delta = 2 * pi / n, phi = 0; i < n; ++i, phi -= delta) {
          sphereStream.point(atan2(sr * cos(phi), cr) * degrees, asin(sr * sin(phi)) * degrees);
          sphereStream.point(atan2(sRho * cos(phi - delta / 2), cRho) * degrees, asin(sRho * sin(phi - delta / 2)) * degrees);
        }
        sphereStream.lineEnd(), sphereStream.polygonEnd();
      };
      return rotateStream;
    };
    return p.rotate([90, -40]).scale(91.7095).clipAngle(180 - 1e-3);
  }

  function ginzburgPolyconicRaw (a, b, c, d, e, f, g, h) {
    if (arguments.length < 8) h = 0;
    function forward(lambda, phi) {
      if (!phi) return [a * lambda / pi, 0];
      var phi2 = phi * phi,
        xB = a + phi2 * (b + phi2 * (c + phi2 * d)),
        yB = phi * (e - 1 + phi2 * (f - h + phi2 * g)),
        m = (xB * xB + yB * yB) / (2 * yB),
        alpha = lambda * asin(xB / m) / pi;
      return [m * sin(alpha), phi * (1 + phi2 * h) + m * (1 - cos(alpha))];
    }
    forward.invert = function (x, y) {
      var lambda = pi * x / a,
        phi = y,
        deltaLambda,
        deltaPhi,
        i = 50;
      do {
        var phi2 = phi * phi,
          xB = a + phi2 * (b + phi2 * (c + phi2 * d)),
          yB = phi * (e - 1 + phi2 * (f - h + phi2 * g)),
          p = xB * xB + yB * yB,
          q = 2 * yB,
          m = p / q,
          m2 = m * m,
          dAlphadLambda = asin(xB / m) / pi,
          alpha = lambda * dAlphadLambda,
          xB2 = xB * xB,
          dxBdPhi = (2 * b + phi2 * (4 * c + phi2 * 6 * d)) * phi,
          dyBdPhi = e + phi2 * (3 * f + phi2 * 5 * g),
          dpdPhi = 2 * (xB * dxBdPhi + yB * (dyBdPhi - 1)),
          dqdPhi = 2 * (dyBdPhi - 1),
          dmdPhi = (dpdPhi * q - p * dqdPhi) / (q * q),
          cosAlpha = cos(alpha),
          sinAlpha = sin(alpha),
          mcosAlpha = m * cosAlpha,
          msinAlpha = m * sinAlpha,
          dAlphadPhi = lambda / pi * (1 / sqrt(1 - xB2 / m2)) * (dxBdPhi * m - xB * dmdPhi) / m2,
          fx = msinAlpha - x,
          fy = phi * (1 + phi2 * h) + m - mcosAlpha - y,
          deltaxDeltaPhi = dmdPhi * sinAlpha + mcosAlpha * dAlphadPhi,
          deltaxDeltaLambda = mcosAlpha * dAlphadLambda,
          deltayDeltaPhi = 1 + dmdPhi - (dmdPhi * cosAlpha - msinAlpha * dAlphadPhi),
          deltayDeltaLambda = msinAlpha * dAlphadLambda,
          denominator = deltaxDeltaPhi * deltayDeltaLambda - deltayDeltaPhi * deltaxDeltaLambda;
        if (!denominator) break;
        lambda -= deltaLambda = (fy * deltaxDeltaPhi - fx * deltayDeltaPhi) / denominator;
        phi -= deltaPhi = (fx * deltayDeltaLambda - fy * deltaxDeltaLambda) / denominator;
      } while ((abs(deltaLambda) > epsilon || abs(deltaPhi) > epsilon) && --i > 0);
      return [lambda, phi];
    };
    return forward;
  }

  var ginzburg4Raw = ginzburgPolyconicRaw(2.8284, -1.6988, 0.75432, -0.18071, 1.76003, -0.38914, 0.042555);
  function geoGinzburg4 () {
    return projection(ginzburg4Raw).scale(149.995);
  }

  var ginzburg5Raw = ginzburgPolyconicRaw(2.583819, -0.835827, 0.170354, -0.038094, 1.543313, -0.411435, 0.082742);
  function geoGinzburg5 () {
    return projection(ginzburg5Raw).scale(153.93);
  }

  var ginzburg6Raw = ginzburgPolyconicRaw(5 / 6 * pi, -0.62636, -0.0344, 0, 1.3493, -0.05524, 0, 0.045);
  function geoGinzburg6 () {
    return projection(ginzburg6Raw).scale(130.945);
  }

  function ginzburg8Raw(lambda, phi) {
    var lambda2 = lambda * lambda,
      phi2 = phi * phi;
    return [lambda * (1 - 0.162388 * phi2) * (0.87 - 0.000952426 * lambda2 * lambda2), phi * (1 + phi2 / 12)];
  }
  ginzburg8Raw.invert = function (x, y) {
    var lambda = x,
      phi = y,
      i = 50,
      delta;
    do {
      var phi2 = phi * phi;
      phi -= delta = (phi * (1 + phi2 / 12) - y) / (1 + phi2 / 4);
    } while (abs(delta) > epsilon && --i > 0);
    i = 50;
    x /= 1 - 0.162388 * phi2;
    do {
      var lambda4 = (lambda4 = lambda * lambda) * lambda4;
      lambda -= delta = (lambda * (0.87 - 0.000952426 * lambda4) - x) / (0.87 - 0.00476213 * lambda4);
    } while (abs(delta) > epsilon && --i > 0);
    return [lambda, phi];
  };
  function geoGinzburg8 () {
    return projection(ginzburg8Raw).scale(131.747);
  }

  var ginzburg9Raw = ginzburgPolyconicRaw(2.6516, -0.76534, 0.19123, -0.047094, 1.36289, -0.13965, 0.031762);
  function geoGinzburg9 () {
    return projection(ginzburg9Raw).scale(131.087);
  }

  function squareRaw (project) {
    var dx = project(halfPi, 0)[0] - project(-halfPi, 0)[0];
    function projectSquare(lambda, phi) {
      var s = lambda > 0 ? -0.5 : 0.5,
        point = project(lambda + s * pi, phi);
      point[0] -= s * dx;
      return point;
    }
    if (project.invert) projectSquare.invert = function (x, y) {
      var s = x > 0 ? -0.5 : 0.5,
        location = project.invert(x + s * dx, y),
        lambda = location[0] - s * pi;
      if (lambda < -pi) lambda += 2 * pi;else if (lambda > pi) lambda -= 2 * pi;
      location[0] = lambda;
      return location;
    };
    return projectSquare;
  }

  function gringortenRaw(lambda, phi) {
    var sLambda = sign(lambda),
      sPhi = sign(phi),
      cosPhi = cos(phi),
      x = cos(lambda) * cosPhi,
      y = sin(lambda) * cosPhi,
      z = sin(sPhi * phi);
    lambda = abs(atan2(y, z));
    phi = asin(x);
    if (abs(lambda - halfPi) > epsilon) lambda %= halfPi;
    var point = gringortenHexadecant(lambda > pi / 4 ? halfPi - lambda : lambda, phi);
    if (lambda > pi / 4) z = point[0], point[0] = -point[1], point[1] = -z;
    return point[0] *= sLambda, point[1] *= -sPhi, point;
  }
  gringortenRaw.invert = function (x, y) {
    if (abs(x) > 1) x = sign(x) * 2 - x;
    if (abs(y) > 1) y = sign(y) * 2 - y;
    var sx = sign(x),
      sy = sign(y),
      x0 = -sx * x,
      y0 = -sy * y,
      t = y0 / x0 < 1,
      p = gringortenHexadecantInvert(t ? y0 : x0, t ? x0 : y0),
      lambda = p[0],
      phi = p[1],
      cosPhi = cos(phi);
    if (t) lambda = -halfPi - lambda;
    return [sx * (atan2(sin(lambda) * cosPhi, -sin(phi)) + pi), sy * asin(cos(lambda) * cosPhi)];
  };
  function gringortenHexadecant(lambda, phi) {
    if (phi === halfPi) return [0, 0];
    var sinPhi = sin(phi),
      r = sinPhi * sinPhi,
      r2 = r * r,
      j = 1 + r2,
      k = 1 + 3 * r2,
      q = 1 - r2,
      z = asin(1 / sqrt(j)),
      v = q + r * j * z,
      p2 = (1 - sinPhi) / v,
      p = sqrt(p2),
      a2 = p2 * j,
      a = sqrt(a2),
      h = p * q,
      x,
      i;
    if (lambda === 0) return [0, -(h + r * a)];
    var cosPhi = cos(phi),
      secPhi = 1 / cosPhi,
      drdPhi = 2 * sinPhi * cosPhi,
      dvdPhi = (-3 * r + z * k) * drdPhi,
      dp2dPhi = (-v * cosPhi - (1 - sinPhi) * dvdPhi) / (v * v),
      dpdPhi = 0.5 * dp2dPhi / p,
      dhdPhi = q * dpdPhi - 2 * r * p * drdPhi,
      dra2dPhi = r * j * dp2dPhi + p2 * k * drdPhi,
      mu = -secPhi * drdPhi,
      nu = -secPhi * dra2dPhi,
      zeta = -2 * secPhi * dhdPhi,
      lambda1 = 4 * lambda / pi,
      delta;

    // Slower but accurate bisection method.
    if (lambda > 0.222 * pi || phi < pi / 4 && lambda > 0.175 * pi) {
      x = (h + r * sqrt(a2 * (1 + r2) - h * h)) / (1 + r2);
      if (lambda > pi / 4) return [x, x];
      var x1 = x,
        x0 = 0.5 * x;
      x = 0.5 * (x0 + x1), i = 50;
      do {
        var g = sqrt(a2 - x * x),
          f = x * (zeta + mu * g) + nu * asin(x / a) - lambda1;
        if (!f) break;
        if (f < 0) x0 = x;else x1 = x;
        x = 0.5 * (x0 + x1);
      } while (abs(x1 - x0) > epsilon && --i > 0);
    }

    // Newton-Raphson.
    else {
      x = epsilon, i = 25;
      do {
        var x2 = x * x,
          g2 = sqrt(a2 - x2),
          zetaMug = zeta + mu * g2,
          f2 = x * zetaMug + nu * asin(x / a) - lambda1,
          df = zetaMug + (nu - mu * x2) / g2;
        x -= delta = g2 ? f2 / df : 0;
      } while (abs(delta) > epsilon && --i > 0);
    }
    return [x, -h - r * sqrt(a2 - x * x)];
  }
  function gringortenHexadecantInvert(x, y) {
    var x0 = 0,
      x1 = 1,
      r = 0.5,
      i = 50;
    while (true) {
      var r2 = r * r,
        sinPhi = sqrt(r),
        z = asin(1 / sqrt(1 + r2)),
        v = 1 - r2 + r * (1 + r2) * z,
        p2 = (1 - sinPhi) / v,
        p = sqrt(p2),
        a2 = p2 * (1 + r2),
        h = p * (1 - r2),
        g2 = a2 - x * x,
        g = sqrt(g2),
        y0 = y + h + r * g;
      if (abs(x1 - x0) < epsilon2 || --i === 0 || y0 === 0) break;
      if (y0 > 0) x0 = r;else x1 = r;
      r = 0.5 * (x0 + x1);
    }
    if (!i) return null;
    var phi = asin(sinPhi),
      cosPhi = cos(phi),
      secPhi = 1 / cosPhi,
      drdPhi = 2 * sinPhi * cosPhi,
      dvdPhi = (-3 * r + z * (1 + 3 * r2)) * drdPhi,
      dp2dPhi = (-v * cosPhi - (1 - sinPhi) * dvdPhi) / (v * v),
      dpdPhi = 0.5 * dp2dPhi / p,
      dhdPhi = (1 - r2) * dpdPhi - 2 * r * p * drdPhi,
      zeta = -2 * secPhi * dhdPhi,
      mu = -secPhi * drdPhi,
      nu = -secPhi * (r * (1 + r2) * dp2dPhi + p2 * (1 + 3 * r2) * drdPhi);
    return [pi / 4 * (x * (zeta + mu * g) + nu * asin(x / sqrt(a2))), phi];
  }
  function geoGringorten () {
    return projection(squareRaw(gringortenRaw)).scale(239.75);
  }

  // Returns [sn, cn, dn](u + iv|m).
  function ellipticJi(u, v, m) {
    var a, b, c;
    if (!u) {
      b = ellipticJ(v, 1 - m);
      return [[0, b[0] / b[1]], [1 / b[1], 0], [b[2] / b[1], 0]];
    }
    a = ellipticJ(u, m);
    if (!v) return [[a[0], 0], [a[1], 0], [a[2], 0]];
    b = ellipticJ(v, 1 - m);
    c = b[1] * b[1] + m * a[0] * a[0] * b[0] * b[0];
    return [[a[0] * b[2] / c, a[1] * a[2] * b[0] * b[1] / c], [a[1] * b[1] / c, -a[0] * a[2] * b[0] * b[2] / c], [a[2] * b[1] * b[2] / c, -m * a[0] * a[1] * b[0] / c]];
  }

  // Returns [sn, cn, dn, ph](u|m).
  function ellipticJ(u, m) {
    var ai, b, phi, t, twon;
    if (m < epsilon) {
      t = sin(u);
      b = cos(u);
      ai = m * (u - t * b) / 4;
      return [t - ai * b, b + ai * t, 1 - m * t * t / 2, u - ai];
    }
    if (m >= 1 - epsilon) {
      ai = (1 - m) / 4;
      b = cosh(u);
      t = tanh(u);
      phi = 1 / b;
      twon = b * sinh(u);
      return [t + ai * (twon - u) / (b * b), phi - ai * t * phi * (twon - u), phi + ai * t * phi * (twon + u), 2 * atan(exp(u)) - halfPi + ai * (twon - u) / b];
    }
    var a = [1, 0, 0, 0, 0, 0, 0, 0, 0],
      c = [sqrt(m), 0, 0, 0, 0, 0, 0, 0, 0],
      i = 0;
    b = sqrt(1 - m);
    twon = 1;
    while (abs(c[i] / a[i]) > epsilon && i < 8) {
      ai = a[i++];
      c[i] = (ai - b) / 2;
      a[i] = (ai + b) / 2;
      b = sqrt(ai * b);
      twon *= 2;
    }
    phi = twon * a[i] * u;
    do {
      t = c[i] * sin(b = phi) / a[i];
      phi = (asin(t) + phi) / 2;
    } while (--i);
    return [sin(phi), t = cos(phi), t / cos(phi - b), phi];
  }

  // Calculate F(phi+iPsi|m).
  // See Abramowitz and Stegun, 17.4.11.
  function ellipticFi(phi, psi, m) {
    var r = abs(phi),
      i = abs(psi),
      sinhPsi = sinh(i);
    if (r) {
      var cscPhi = 1 / sin(r),
        cotPhi2 = 1 / (tan(r) * tan(r)),
        b = -(cotPhi2 + m * (sinhPsi * sinhPsi * cscPhi * cscPhi) - 1 + m),
        c = (m - 1) * cotPhi2,
        cotLambda2 = (-b + sqrt(b * b - 4 * c)) / 2;
      return [ellipticF(atan(1 / sqrt(cotLambda2)), m) * sign(phi), ellipticF(atan(sqrt((cotLambda2 / cotPhi2 - 1) / m)), 1 - m) * sign(psi)];
    }
    return [0, ellipticF(atan(sinhPsi), 1 - m) * sign(psi)];
  }

  // Calculate F(phi|m) where m = k² = sin²α.
  // See Abramowitz and Stegun, 17.6.7.
  function ellipticF(phi, m) {
    if (!m) return phi;
    if (m === 1) return log(tan(phi / 2 + quarterPi));
    var a = 1,
      b = sqrt(1 - m),
      c = sqrt(m);
    for (var i = 0; abs(c) > epsilon; i++) {
      if (phi % pi) {
        var dPhi = atan(b * tan(phi) / a);
        if (dPhi < 0) dPhi += pi;
        phi += dPhi + ~~(phi / pi) * pi;
      } else phi += phi;
      c = (a + b) / 2;
      b = sqrt(a * b);
      c = ((a = c) - b) / 2;
    }
    return phi / (pow(2, i) * a);
  }

  function guyouRaw(lambda, phi) {
    var k_ = (sqrt2 - 1) / (sqrt2 + 1),
      k = sqrt(1 - k_ * k_),
      K = ellipticF(halfPi, k * k),
      f = -1,
      psi = log(tan(pi / 4 + abs(phi) / 2)),
      r = exp(f * psi) / sqrt(k_),
      at = guyouComplexAtan(r * cos(f * lambda), r * sin(f * lambda)),
      t = ellipticFi(at[0], at[1], k * k);
    return [-t[1], (phi >= 0 ? 1 : -1) * (0.5 * K - t[0])];
  }
  function guyouComplexAtan(x, y) {
    var x2 = x * x,
      y_1 = y + 1,
      t = 1 - x2 - y * y;
    return [0.5 * ((x >= 0 ? halfPi : -halfPi) - atan2(t, 2 * x)), -0.25 * log(t * t + 4 * x2) + 0.5 * log(y_1 * y_1 + x2)];
  }
  function guyouComplexDivide(a, b) {
    var denominator = b[0] * b[0] + b[1] * b[1];
    return [(a[0] * b[0] + a[1] * b[1]) / denominator, (a[1] * b[0] - a[0] * b[1]) / denominator];
  }
  guyouRaw.invert = function (x, y) {
    var k_ = (sqrt2 - 1) / (sqrt2 + 1),
      k = sqrt(1 - k_ * k_),
      K = ellipticF(halfPi, k * k),
      f = -1,
      j = ellipticJi(0.5 * K - y, -x, k * k),
      tn = guyouComplexDivide(j[0], j[1]),
      lambda = atan2(tn[1], tn[0]) / f;
    return [lambda, 2 * atan(exp(0.5 / f * log(k_ * tn[0] * tn[0] + k_ * tn[1] * tn[1]))) - halfPi];
  };
  function geoGuyou () {
    return projection(squareRaw(guyouRaw)).scale(151.496);
  }

  function hammerRetroazimuthalRaw(phi0) {
    var sinPhi0 = sin(phi0),
      cosPhi0 = cos(phi0),
      rotate = hammerRetroazimuthalRotation(phi0);
    rotate.invert = hammerRetroazimuthalRotation(-phi0);
    function forward(lambda, phi) {
      var p = rotate(lambda, phi);
      lambda = p[0], phi = p[1];
      var sinPhi = sin(phi),
        cosPhi = cos(phi),
        cosLambda = cos(lambda),
        z = acos(sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosLambda),
        sinz = sin(z),
        K = abs(sinz) > epsilon ? z / sinz : 1;
      return [K * cosPhi0 * sin(lambda), (abs(lambda) > halfPi ? K : -K // rotate for back hemisphere
      ) * (sinPhi0 * cosPhi - cosPhi0 * sinPhi * cosLambda)];
    }
    forward.invert = function (x, y) {
      var rho = sqrt(x * x + y * y),
        sinz = -sin(rho),
        cosz = cos(rho),
        a = rho * cosz,
        b = -y * sinz,
        c = rho * sinPhi0,
        d = sqrt(a * a + b * b - c * c),
        phi = atan2(a * c + b * d, b * c - a * d),
        lambda = (rho > halfPi ? -1 : 1) * atan2(x * sinz, rho * cos(phi) * cosz + y * sin(phi) * sinz);
      return rotate.invert(lambda, phi);
    };
    return forward;
  }

  // Latitudinal rotation by phi0.
  // Temporary hack until D3 supports arbitrary small-circle clipping origins.
  function hammerRetroazimuthalRotation(phi0) {
    var sinPhi0 = sin(phi0),
      cosPhi0 = cos(phi0);
    return function (lambda, phi) {
      var cosPhi = cos(phi),
        x = cos(lambda) * cosPhi,
        y = sin(lambda) * cosPhi,
        z = sin(phi);
      return [atan2(y, x * cosPhi0 - z * sinPhi0), asin(z * cosPhi0 + x * sinPhi0)];
    };
  }
  function geoHammerRetroazimuthal () {
    var phi0 = 0,
      m = projectionMutator(hammerRetroazimuthalRaw),
      p = m(phi0),
      rotate_ = p.rotate,
      stream_ = p.stream,
      circle = geoCircle();
    p.parallel = function (_) {
      if (!arguments.length) return phi0 * degrees;
      var r = p.rotate();
      return m(phi0 = _ * radians).rotate(r);
    };

    // Temporary hack; see hammerRetroazimuthalRotation.
    p.rotate = function (_) {
      if (!arguments.length) return _ = rotate_.call(p), _[1] += phi0 * degrees, _;
      rotate_.call(p, [_[0], _[1] - phi0 * degrees]);
      circle.center([-_[0], -_[1]]);
      return p;
    };
    p.stream = function (stream) {
      stream = stream_(stream);
      stream.sphere = function () {
        stream.polygonStart();
        var epsilon = 1e-2,
          ring = circle.radius(90 - epsilon)().coordinates[0],
          n = ring.length - 1,
          i = -1,
          p;
        stream.lineStart();
        while (++i < n) stream.point((p = ring[i])[0], p[1]);
        stream.lineEnd();
        ring = circle.radius(90 + epsilon)().coordinates[0];
        n = ring.length - 1;
        stream.lineStart();
        while (--i >= 0) stream.point((p = ring[i])[0], p[1]);
        stream.lineEnd();
        stream.polygonEnd();
      };
      return stream;
    };
    return p.scale(79.4187).parallel(45).clipAngle(180 - 1e-3);
  }

  var K$1 = 3,
    healpixParallel = asin(1 - 1 / K$1) * degrees,
    healpixLambert = cylindricalEqualAreaRaw(0);
  function healpixRaw(H) {
    var phi0 = healpixParallel * radians,
      dx = collignonRaw(pi, phi0)[0] - collignonRaw(-pi, phi0)[0],
      y0 = healpixLambert(0, phi0)[1],
      y1 = collignonRaw(0, phi0)[1],
      dy1 = sqrtPi - y1,
      k = tau / H,
      w = 4 / tau,
      h = y0 + dy1 * dy1 * 4 / tau;
    function forward(lambda, phi) {
      var point,
        phi2 = abs(phi);
      if (phi2 > phi0) {
        var i = min(H - 1, max(0, floor((lambda + pi) / k)));
        lambda += pi * (H - 1) / H - i * k;
        point = collignonRaw(lambda, phi2);
        point[0] = point[0] * tau / dx - tau * (H - 1) / (2 * H) + i * tau / H;
        point[1] = y0 + (point[1] - y1) * 4 * dy1 / tau;
        if (phi < 0) point[1] = -point[1];
      } else {
        point = healpixLambert(lambda, phi);
      }
      point[0] *= w, point[1] /= h;
      return point;
    }
    forward.invert = function (x, y) {
      x /= w, y *= h;
      var y2 = abs(y);
      if (y2 > y0) {
        var i = min(H - 1, max(0, floor((x + pi) / k)));
        x = (x + pi * (H - 1) / H - i * k) * dx / tau;
        var point = collignonRaw.invert(x, 0.25 * (y2 - y0) * tau / dy1 + y1);
        point[0] -= pi * (H - 1) / H - i * k;
        if (y < 0) point[1] = -point[1];
        return point;
      }
      return healpixLambert.invert(x, y);
    };
    return forward;
  }
  function sphereTop(x, i) {
    return [x, i & 1 ? 90 - epsilon : healpixParallel];
  }
  function sphereBottom(x, i) {
    return [x, i & 1 ? -90 + epsilon : -healpixParallel];
  }
  function sphereNudge(d) {
    return [d[0] * (1 - epsilon), d[1]];
  }
  function sphere(step) {
    var c = [].concat(range$1(-180, 180 + step / 2, step).map(sphereTop), range$1(180, -180 - step / 2, -step).map(sphereBottom));
    return {
      type: "Polygon",
      coordinates: [step === 180 ? c.map(sphereNudge) : c]
    };
  }
  function geoHealpix () {
    var H = 4,
      m = projectionMutator(healpixRaw),
      p = m(H),
      stream_ = p.stream;
    p.lobes = function (_) {
      return arguments.length ? m(H = +_) : H;
    };
    p.stream = function (stream) {
      var rotate = p.rotate(),
        rotateStream = stream_(stream),
        sphereStream = (p.rotate([0, 0]), stream_(stream));
      p.rotate(rotate);
      rotateStream.sphere = function () {
        geoStream(sphere(180 / H), sphereStream);
      };
      return rotateStream;
    };
    return p.scale(239.75);
  }

  function hillRaw(K) {
    var L = 1 + K,
      sinBt = sin(1 / L),
      Bt = asin(sinBt),
      A = 2 * sqrt(pi / (B = pi + 4 * Bt * L)),
      B,
      rho0 = 0.5 * A * (L + sqrt(K * (2 + K))),
      K2 = K * K,
      L2 = L * L;
    function forward(lambda, phi) {
      var t = 1 - sin(phi),
        rho,
        omega;
      if (t && t < 2) {
        var theta = halfPi - phi,
          i = 25,
          delta;
        do {
          var sinTheta = sin(theta),
            cosTheta = cos(theta),
            Bt_Bt1 = Bt + atan2(sinTheta, L - cosTheta),
            C = 1 + L2 - 2 * L * cosTheta;
          theta -= delta = (theta - K2 * Bt - L * sinTheta + C * Bt_Bt1 - 0.5 * t * B) / (2 * L * sinTheta * Bt_Bt1);
        } while (abs(delta) > epsilon2 && --i > 0);
        rho = A * sqrt(C);
        omega = lambda * Bt_Bt1 / pi;
      } else {
        rho = A * (K + t);
        omega = lambda * Bt / pi;
      }
      return [rho * sin(omega), rho0 - rho * cos(omega)];
    }
    forward.invert = function (x, y) {
      var rho2 = x * x + (y -= rho0) * y,
        cosTheta = (1 + L2 - rho2 / (A * A)) / (2 * L),
        theta = acos(cosTheta),
        sinTheta = sin(theta),
        Bt_Bt1 = Bt + atan2(sinTheta, L - cosTheta);
      return [asin(x / sqrt(rho2)) * pi / Bt_Bt1, asin(1 - 2 * (theta - K2 * Bt - L * sinTheta + (1 + L2 - 2 * L * cosTheta) * Bt_Bt1) / B)];
    };
    return forward;
  }
  function geoHill () {
    var K = 1,
      m = projectionMutator(hillRaw),
      p = m(K);
    p.ratio = function (_) {
      return arguments.length ? m(K = +_) : K;
    };
    return p.scale(167.774).center([0, 18.67]);
  }

  var sinuMollweidePhi = 0.7109889596207567;
  var sinuMollweideY = 0.0528035274542;
  function sinuMollweideRaw(lambda, phi) {
    return phi > -sinuMollweidePhi ? (lambda = mollweideRaw(lambda, phi), lambda[1] += sinuMollweideY, lambda) : sinusoidalRaw(lambda, phi);
  }
  sinuMollweideRaw.invert = function (x, y) {
    return y > -sinuMollweidePhi ? mollweideRaw.invert(x, y - sinuMollweideY) : sinusoidalRaw.invert(x, y);
  };
  function geoSinuMollweide () {
    return projection(sinuMollweideRaw).rotate([-20, -55]).scale(164.263).center([0, -5.4036]);
  }

  function homolosineRaw(lambda, phi) {
    return abs(phi) > sinuMollweidePhi ? (lambda = mollweideRaw(lambda, phi), lambda[1] -= phi > 0 ? sinuMollweideY : -sinuMollweideY, lambda) : sinusoidalRaw(lambda, phi);
  }
  homolosineRaw.invert = function (x, y) {
    return abs(y) > sinuMollweidePhi ? mollweideRaw.invert(x, y + (y > 0 ? sinuMollweideY : -sinuMollweideY)) : sinusoidalRaw.invert(x, y);
  };
  function geoHomolosine () {
    return projection(homolosineRaw).scale(152.63);
  }

  function hufnagelRaw(a, b, psiMax, ratio) {
    var k = sqrt(4 * pi / (2 * psiMax + (1 + a - b / 2) * sin(2 * psiMax) + (a + b) / 2 * sin(4 * psiMax) + b / 2 * sin(6 * psiMax))),
      c = sqrt(ratio * sin(psiMax) * sqrt((1 + a * cos(2 * psiMax) + b * cos(4 * psiMax)) / (1 + a + b))),
      M = psiMax * mapping(1);
    function radius(psi) {
      return sqrt(1 + a * cos(2 * psi) + b * cos(4 * psi));
    }
    function mapping(t) {
      var psi = t * psiMax;
      return (2 * psi + (1 + a - b / 2) * sin(2 * psi) + (a + b) / 2 * sin(4 * psi) + b / 2 * sin(6 * psi)) / psiMax;
    }
    function inversemapping(psi) {
      return radius(psi) * sin(psi);
    }
    var forward = function (lambda, phi) {
      var psi = psiMax * solve(mapping, M * sin(phi) / psiMax, phi / pi);
      if (isNaN(psi)) psi = psiMax * sign(phi);
      var kr = k * radius(psi);
      return [kr * c * lambda / pi * cos(psi), kr / c * sin(psi)];
    };
    forward.invert = function (x, y) {
      var psi = solve(inversemapping, y * c / k);
      return [x * pi / (cos(psi) * k * c * radius(psi)), asin(psiMax * mapping(psi / psiMax) / M)];
    };
    if (psiMax === 0) {
      k = sqrt(ratio / pi);
      forward = function (lambda, phi) {
        return [lambda * k, sin(phi) / k];
      };
      forward.invert = function (x, y) {
        return [x / k, asin(y * k)];
      };
    }
    return forward;
  }
  function geoHufnagel () {
    var a = 1,
      b = 0,
      psiMax = 45 * radians,
      ratio = 2,
      mutate = projectionMutator(hufnagelRaw),
      projection = mutate(a, b, psiMax, ratio);
    projection.a = function (_) {
      return arguments.length ? mutate(a = +_, b, psiMax, ratio) : a;
    };
    projection.b = function (_) {
      return arguments.length ? mutate(a, b = +_, psiMax, ratio) : b;
    };
    projection.psiMax = function (_) {
      return arguments.length ? mutate(a, b, psiMax = +_ * radians, ratio) : psiMax * degrees;
    };
    projection.ratio = function (_) {
      return arguments.length ? mutate(a, b, psiMax, ratio = +_) : ratio;
    };
    return projection.scale(180.739);
  }

  // https://github.com/scijs/integrate-adaptive-simpson

  // This algorithm adapted from pseudocode in:
  // http://www.math.utk.edu/~ccollins/refs/Handouts/rich.pdf
  function adsimp(f, a, b, fa, fm, fb, V0, tol, maxdepth, depth, state) {
    if (state.nanEncountered) {
      return NaN;
    }
    var h, f1, f2, sl, sr, s2, m, V1, V2, err;
    h = b - a;
    f1 = f(a + h * 0.25);
    f2 = f(b - h * 0.25);

    // Simple check for NaN:
    if (isNaN(f1)) {
      state.nanEncountered = true;
      return;
    }

    // Simple check for NaN:
    if (isNaN(f2)) {
      state.nanEncountered = true;
      return;
    }
    sl = h * (fa + 4 * f1 + fm) / 12;
    sr = h * (fm + 4 * f2 + fb) / 12;
    s2 = sl + sr;
    err = (s2 - V0) / 15;
    if (depth > maxdepth) {
      state.maxDepthCount++;
      return s2 + err;
    } else if (Math.abs(err) < tol) {
      return s2 + err;
    } else {
      m = a + h * 0.5;
      V1 = adsimp(f, a, m, fa, f1, fm, sl, tol * 0.5, maxdepth, depth + 1, state);
      if (isNaN(V1)) {
        state.nanEncountered = true;
        return NaN;
      }
      V2 = adsimp(f, m, b, fm, f2, fb, sr, tol * 0.5, maxdepth, depth + 1, state);
      if (isNaN(V2)) {
        state.nanEncountered = true;
        return NaN;
      }
      return V1 + V2;
    }
  }
  function integrate(f, a, b, tol, maxdepth) {
    var state = {
      maxDepthCount: 0,
      nanEncountered: false
    };
    if (tol === undefined) {
      tol = 1e-8;
    }
    if (maxdepth === undefined) {
      maxdepth = 20;
    }
    var fa = f(a);
    var fm = f(0.5 * (a + b));
    var fb = f(b);
    var V0 = (fa + 4 * fm + fb) * (b - a) / 6;
    var result = adsimp(f, a, b, fa, fm, fb, V0, tol, maxdepth, 1, state);

    /*
      if (state.maxDepthCount > 0 && console && console.warn) {
        console.warn('integrate-adaptive-simpson: Warning: maximum recursion depth (' + maxdepth + ') reached ' + state.maxDepthCount + ' times');
      }
    
      if (state.nanEncountered && console && console.warn) {
        console.warn('integrate-adaptive-simpson: Warning: NaN encountered. Halting early.');
      }
    */

    return result;
  }

  function hyperellipticalRaw(alpha, k, gamma) {
    function elliptic(f) {
      return alpha + (1 - alpha) * pow(1 - pow(f, k), 1 / k);
    }
    function z(f) {
      return integrate(elliptic, 0, f, 1e-4);
    }
    var G = 1 / z(1),
      n = 1000,
      m = (1 + 1e-8) * G,
      approx = [];
    for (var i = 0; i <= n; i++) approx.push(z(i / n) * m);
    function Y(sinphi) {
      var rmin = 0,
        rmax = n,
        r = n >> 1;
      do {
        if (approx[r] > sinphi) rmax = r;else rmin = r;
        r = rmin + rmax >> 1;
      } while (r > rmin);
      var u = approx[r + 1] - approx[r];
      if (u) u = (sinphi - approx[r + 1]) / u;
      return (r + 1 + u) / n;
    }
    var ratio = 2 * Y(1) / pi * G / gamma;
    var forward = function (lambda, phi) {
      var y = Y(abs(sin(phi))),
        x = elliptic(y) * lambda;
      y /= ratio;
      return [x, phi >= 0 ? y : -y];
    };
    forward.invert = function (x, y) {
      var phi;
      y *= ratio;
      if (abs(y) < 1) phi = sign(y) * asin(z(abs(y)) * G);
      return [x / elliptic(abs(y)), phi];
    };
    return forward;
  }
  function geoHyperelliptical () {
    var alpha = 0,
      k = 2.5,
      gamma = 1.183136,
      // affine = sqrt(2 * gamma / pi) = 0.8679
      m = projectionMutator(hyperellipticalRaw),
      p = m(alpha, k, gamma);
    p.alpha = function (_) {
      return arguments.length ? m(alpha = +_, k, gamma) : alpha;
    };
    p.k = function (_) {
      return arguments.length ? m(alpha, k = +_, gamma) : k;
    };
    p.gamma = function (_) {
      return arguments.length ? m(alpha, k, gamma = +_) : gamma;
    };
    return p.scale(152.63);
  }

  function pointEqual$1(a, b) {
    return abs(a[0] - b[0]) < epsilon && abs(a[1] - b[1]) < epsilon;
  }
  function interpolateLine(coordinates, m) {
    var i = -1,
      n = coordinates.length,
      p0 = coordinates[0],
      p1,
      dx,
      dy,
      resampled = [];
    while (++i < n) {
      p1 = coordinates[i];
      dx = (p1[0] - p0[0]) / m;
      dy = (p1[1] - p0[1]) / m;
      for (var j = 0; j < m; ++j) resampled.push([p0[0] + j * dx, p0[1] + j * dy]);
      p0 = p1;
    }
    resampled.push(p1);
    return resampled;
  }
  function interpolateSphere(lobes) {
    var coordinates = [],
      lobe,
      lambda0,
      phi0,
      phi1,
      lambda2,
      phi2,
      i,
      n = lobes[0].length;

    // Northern Hemisphere
    for (i = 0; i < n; ++i) {
      lobe = lobes[0][i];
      lambda0 = lobe[0][0], phi0 = lobe[0][1], phi1 = lobe[1][1];
      lambda2 = lobe[2][0], phi2 = lobe[2][1];
      coordinates.push(interpolateLine([[lambda0 + epsilon, phi0 + epsilon], [lambda0 + epsilon, phi1 - epsilon], [lambda2 - epsilon, phi1 - epsilon], [lambda2 - epsilon, phi2 + epsilon]], 30));
    }

    // Southern Hemisphere
    for (i = lobes[1].length - 1; i >= 0; --i) {
      lobe = lobes[1][i];
      lambda0 = lobe[0][0], phi0 = lobe[0][1], phi1 = lobe[1][1];
      lambda2 = lobe[2][0], phi2 = lobe[2][1];
      coordinates.push(interpolateLine([[lambda2 - epsilon, phi2 - epsilon], [lambda2 - epsilon, phi1 + epsilon], [lambda0 + epsilon, phi1 + epsilon], [lambda0 + epsilon, phi0 - epsilon]], 30));
    }
    return {
      type: "Polygon",
      coordinates: [merge(coordinates)]
    };
  }
  function interrupt (project, lobes, inverse) {
    var sphere, bounds;
    function forward(lambda, phi) {
      var sign = phi < 0 ? -1 : +1,
        lobe = lobes[+(phi < 0)];
      for (var i = 0, n = lobe.length - 1; i < n && lambda > lobe[i][2][0]; ++i);
      var p = project(lambda - lobe[i][1][0], phi);
      p[0] += project(lobe[i][1][0], sign * phi > sign * lobe[i][0][1] ? lobe[i][0][1] : phi)[0];
      return p;
    }
    if (inverse) {
      forward.invert = inverse(forward);
    } else if (project.invert) {
      forward.invert = function (x, y) {
        var bound = bounds[+(y < 0)],
          lobe = lobes[+(y < 0)];
        for (var i = 0, n = bound.length; i < n; ++i) {
          var b = bound[i];
          if (b[0][0] <= x && x < b[1][0] && b[0][1] <= y && y < b[1][1]) {
            var p = project.invert(x - project(lobe[i][1][0], 0)[0], y);
            p[0] += lobe[i][1][0];
            return pointEqual$1(forward(p[0], p[1]), [x, y]) ? p : null;
          }
        }
      };
    }
    var p = projection(forward),
      stream_ = p.stream;
    p.stream = function (stream) {
      var rotate = p.rotate(),
        rotateStream = stream_(stream),
        sphereStream = (p.rotate([0, 0]), stream_(stream));
      p.rotate(rotate);
      rotateStream.sphere = function () {
        geoStream(sphere, sphereStream);
      };
      return rotateStream;
    };
    p.lobes = function (_) {
      if (!arguments.length) return lobes.map(function (lobe) {
        return lobe.map(function (l) {
          return [[l[0][0] * degrees, l[0][1] * degrees], [l[1][0] * degrees, l[1][1] * degrees], [l[2][0] * degrees, l[2][1] * degrees]];
        });
      });
      sphere = interpolateSphere(_);
      lobes = _.map(function (lobe) {
        return lobe.map(function (l) {
          return [[l[0][0] * radians, l[0][1] * radians], [l[1][0] * radians, l[1][1] * radians], [l[2][0] * radians, l[2][1] * radians]];
        });
      });
      bounds = lobes.map(function (lobe) {
        return lobe.map(function (l) {
          var x0 = project(l[0][0], l[0][1])[0],
            x1 = project(l[2][0], l[2][1])[0],
            y0 = project(l[1][0], l[0][1])[1],
            y1 = project(l[1][0], l[1][1])[1],
            t;
          if (y0 > y1) t = y0, y0 = y1, y1 = t;
          return [[x0, y0], [x1, y1]];
        });
      });
      return p;
    };
    if (lobes != null) p.lobes(lobes);
    return p;
  }

  var lobes$6 = [[
  // northern hemisphere
  [[-180, 0], [-100, 90], [-40, 0]], [[-40, 0], [30, 90], [180, 0]]], [
  // southern hemisphere
  [[-180, 0], [-160, -90], [-100, 0]], [[-100, 0], [-60, -90], [-20, 0]], [[-20, 0], [20, -90], [80, 0]], [[80, 0], [140, -90], [180, 0]]]];
  function geoInterruptedBoggs () {
    return interrupt(boggsRaw, lobes$6).scale(160.857);
  }

  var lobes$5 = [[
  // northern hemisphere
  [[-180, 0], [-100, 90], [-40, 0]], [[-40, 0], [30, 90], [180, 0]]], [
  // southern hemisphere
  [[-180, 0], [-160, -90], [-100, 0]], [[-100, 0], [-60, -90], [-20, 0]], [[-20, 0], [20, -90], [80, 0]], [[80, 0], [140, -90], [180, 0]]]];
  function geoInterruptedHomolosine () {
    return interrupt(homolosineRaw, lobes$5).scale(152.63);
  }

  var lobes$4 = [[
  // northern hemisphere
  [[-180, 0], [-100, 90], [-40, 0]], [[-40, 0], [30, 90], [180, 0]]], [
  // southern hemisphere
  [[-180, 0], [-160, -90], [-100, 0]], [[-100, 0], [-60, -90], [-20, 0]], [[-20, 0], [20, -90], [80, 0]], [[80, 0], [140, -90], [180, 0]]]];
  function geoInterruptedMollweide () {
    return interrupt(mollweideRaw, lobes$4).scale(169.529);
  }

  var lobes$3 = [[
  // northern hemisphere
  [[-180, 0], [-90, 90], [0, 0]], [[0, 0], [90, 90], [180, 0]]], [
  // southern hemisphere
  [[-180, 0], [-90, -90], [0, 0]], [[0, 0], [90, -90], [180, 0]]]];
  function geoInterruptedMollweideHemispheres () {
    return interrupt(mollweideRaw, lobes$3).scale(169.529).rotate([20, 0]);
  }

  var lobes$2 = [[
  // northern hemisphere
  [[-180, 35], [-30, 90], [0, 35]], [[0, 35], [30, 90], [180, 35]]], [
  // southern hemisphere
  [[-180, -10], [-102, -90], [-65, -10]], [[-65, -10], [5, -90], [77, -10]], [[77, -10], [103, -90], [180, -10]]]];
  function geoInterruptedSinuMollweide () {
    return interrupt(sinuMollweideRaw, lobes$2, solve2d).rotate([-20, -55]).scale(164.263).center([0, -5.4036]);
  }

  var lobes$1 = [[
  // northern hemisphere
  [[-180, 0], [-110, 90], [-40, 0]], [[-40, 0], [0, 90], [40, 0]], [[40, 0], [110, 90], [180, 0]]], [
  // southern hemisphere
  [[-180, 0], [-110, -90], [-40, 0]], [[-40, 0], [0, -90], [40, 0]], [[40, 0], [110, -90], [180, 0]]]];
  function geoInterruptedSinusoidal () {
    return interrupt(sinusoidalRaw, lobes$1).scale(152.63).rotate([-20, 0]);
  }

  function kavrayskiy7Raw(lambda, phi) {
    return [3 / tau * lambda * sqrt(pi * pi / 3 - phi * phi), phi];
  }
  kavrayskiy7Raw.invert = function (x, y) {
    return [tau / 3 * x / sqrt(pi * pi / 3 - y * y), y];
  };
  function geoKavrayskiy7 () {
    return projection(kavrayskiy7Raw).scale(158.837);
  }

  function lagrangeRaw(n) {
    function forward(lambda, phi) {
      if (abs(abs(phi) - halfPi) < epsilon) return [0, phi < 0 ? -2 : 2];
      var sinPhi = sin(phi),
        v = pow((1 + sinPhi) / (1 - sinPhi), n / 2),
        c = 0.5 * (v + 1 / v) + cos(lambda *= n);
      return [2 * sin(lambda) / c, (v - 1 / v) / c];
    }
    forward.invert = function (x, y) {
      var y0 = abs(y);
      if (abs(y0 - 2) < epsilon) return x ? null : [0, sign(y) * halfPi];
      if (y0 > 2) return null;
      x /= 2, y /= 2;
      var x2 = x * x,
        y2 = y * y,
        t = 2 * y / (1 + x2 + y2); // tanh(nPhi)
      t = pow((1 + t) / (1 - t), 1 / n);
      return [atan2(2 * x, 1 - x2 - y2) / n, asin((t - 1) / (t + 1))];
    };
    return forward;
  }
  function geoLagrange () {
    var n = 0.5,
      m = projectionMutator(lagrangeRaw),
      p = m(n);
    p.spacing = function (_) {
      return arguments.length ? m(n = +_) : n;
    };
    return p.scale(124.75);
  }

  var pi_sqrt2 = pi / sqrt2;
  function larriveeRaw(lambda, phi) {
    return [lambda * (1 + sqrt(cos(phi))) / 2, phi / (cos(phi / 2) * cos(lambda / 6))];
  }
  larriveeRaw.invert = function (x, y) {
    var x0 = abs(x),
      y0 = abs(y),
      lambda = epsilon,
      phi = halfPi;
    if (y0 < pi_sqrt2) phi *= y0 / pi_sqrt2;else lambda += 6 * acos(pi_sqrt2 / y0);
    for (var i = 0; i < 25; i++) {
      var sinPhi = sin(phi),
        sqrtcosPhi = sqrt(cos(phi)),
        sinPhi_2 = sin(phi / 2),
        cosPhi_2 = cos(phi / 2),
        sinLambda_6 = sin(lambda / 6),
        cosLambda_6 = cos(lambda / 6),
        f0 = 0.5 * lambda * (1 + sqrtcosPhi) - x0,
        f1 = phi / (cosPhi_2 * cosLambda_6) - y0,
        df0dPhi = sqrtcosPhi ? -0.25 * lambda * sinPhi / sqrtcosPhi : 0,
        df0dLambda = 0.5 * (1 + sqrtcosPhi),
        df1dPhi = (1 + 0.5 * phi * sinPhi_2 / cosPhi_2) / (cosPhi_2 * cosLambda_6),
        df1dLambda = phi / cosPhi_2 * (sinLambda_6 / 6) / (cosLambda_6 * cosLambda_6),
        denom = df0dPhi * df1dLambda - df1dPhi * df0dLambda,
        dPhi = (f0 * df1dLambda - f1 * df0dLambda) / denom,
        dLambda = (f1 * df0dPhi - f0 * df1dPhi) / denom;
      phi -= dPhi;
      lambda -= dLambda;
      if (abs(dPhi) < epsilon && abs(dLambda) < epsilon) break;
    }
    return [x < 0 ? -lambda : lambda, y < 0 ? -phi : phi];
  };
  function geoLarrivee () {
    return projection(larriveeRaw).scale(97.2672);
  }

  function laskowskiRaw(lambda, phi) {
    var lambda2 = lambda * lambda,
      phi2 = phi * phi;
    return [lambda * (0.975534 + phi2 * (-0.119161 + lambda2 * -0.0143059 + phi2 * -0.0547009)), phi * (1.00384 + lambda2 * (0.0802894 + phi2 * -0.02855 + lambda2 * 0.000199025) + phi2 * (0.0998909 + phi2 * -0.0491032))];
  }
  laskowskiRaw.invert = function (x, y) {
    var lambda = sign(x) * pi,
      phi = y / 2,
      i = 50;
    do {
      var lambda2 = lambda * lambda,
        phi2 = phi * phi,
        lambdaPhi = lambda * phi,
        fx = lambda * (0.975534 + phi2 * (-0.119161 + lambda2 * -0.0143059 + phi2 * -0.0547009)) - x,
        fy = phi * (1.00384 + lambda2 * (0.0802894 + phi2 * -0.02855 + lambda2 * 0.000199025) + phi2 * (0.0998909 + phi2 * -0.0491032)) - y,
        deltaxDeltaLambda = 0.975534 - phi2 * (0.119161 + 3 * lambda2 * 0.0143059 + phi2 * 0.0547009),
        deltaxDeltaPhi = -lambdaPhi * (2 * 0.119161 + 4 * 0.0547009 * phi2 + 2 * 0.0143059 * lambda2),
        deltayDeltaLambda = lambdaPhi * (2 * 0.0802894 + 4 * 0.000199025 * lambda2 + 2 * -0.02855 * phi2),
        deltayDeltaPhi = 1.00384 + lambda2 * (0.0802894 + 0.000199025 * lambda2) + phi2 * (3 * (0.0998909 - 0.02855 * lambda2) - 5 * 0.0491032 * phi2),
        denominator = deltaxDeltaPhi * deltayDeltaLambda - deltayDeltaPhi * deltaxDeltaLambda,
        deltaLambda = (fy * deltaxDeltaPhi - fx * deltayDeltaPhi) / denominator,
        deltaPhi = (fx * deltayDeltaLambda - fy * deltaxDeltaLambda) / denominator;
      lambda -= deltaLambda, phi -= deltaPhi;
    } while ((abs(deltaLambda) > epsilon || abs(deltaPhi) > epsilon) && --i > 0);
    return i && [lambda, phi];
  };
  function geoLaskowski () {
    return projection(laskowskiRaw).scale(139.98);
  }

  function littrowRaw(lambda, phi) {
    return [sin(lambda) / cos(phi), tan(phi) * cos(lambda)];
  }
  littrowRaw.invert = function (x, y) {
    var x2 = x * x,
      y2 = y * y,
      y2_1 = y2 + 1,
      x2_y2_1 = x2 + y2_1,
      cosPhi = x ? sqrt1_2 * sqrt((x2_y2_1 - sqrt(x2_y2_1 * x2_y2_1 - 4 * x2)) / x2) : 1 / sqrt(y2_1);
    return [asin(x * cosPhi), sign(y) * acos(cosPhi)];
  };
  function geoLittrow () {
    return projection(littrowRaw).scale(144.049).clipAngle(90 - 1e-3);
  }

  function loximuthalRaw(phi0) {
    var cosPhi0 = cos(phi0),
      tanPhi0 = tan(quarterPi + phi0 / 2);
    function forward(lambda, phi) {
      var y = phi - phi0,
        x = abs(y) < epsilon ? lambda * cosPhi0 : abs(x = quarterPi + phi / 2) < epsilon || abs(abs(x) - halfPi) < epsilon ? 0 : lambda * y / log(tan(x) / tanPhi0);
      return [x, y];
    }
    forward.invert = function (x, y) {
      var lambda,
        phi = y + phi0;
      return [abs(y) < epsilon ? x / cosPhi0 : abs(lambda = quarterPi + phi / 2) < epsilon || abs(abs(lambda) - halfPi) < epsilon ? 0 : x * log(tan(lambda) / tanPhi0) / y, phi];
    };
    return forward;
  }
  function geoLoximuthal () {
    return parallel1(loximuthalRaw).parallel(40).scale(158.837);
  }

  function millerRaw(lambda, phi) {
    return [lambda, 1.25 * log(tan(quarterPi + 0.4 * phi))];
  }
  millerRaw.invert = function (x, y) {
    return [x, 2.5 * atan(exp(0.8 * y)) - 0.625 * pi];
  };
  function geoMiller () {
    return projection(millerRaw).scale(108.318);
  }

  function modifiedStereographicRaw(C) {
    var m = C.length - 1;
    function forward(lambda, phi) {
      var cosPhi = cos(phi),
        k = 2 / (1 + cosPhi * cos(lambda)),
        zr = k * cosPhi * sin(lambda),
        zi = k * sin(phi),
        i = m,
        w = C[i],
        ar = w[0],
        ai = w[1],
        t;
      while (--i >= 0) {
        w = C[i];
        ar = w[0] + zr * (t = ar) - zi * ai;
        ai = w[1] + zr * ai + zi * t;
      }
      ar = zr * (t = ar) - zi * ai;
      ai = zr * ai + zi * t;
      return [ar, ai];
    }
    forward.invert = function (x, y) {
      var i = 20,
        zr = x,
        zi = y;
      do {
        var j = m,
          w = C[j],
          ar = w[0],
          ai = w[1],
          br = 0,
          bi = 0,
          t;
        while (--j >= 0) {
          w = C[j];
          br = ar + zr * (t = br) - zi * bi;
          bi = ai + zr * bi + zi * t;
          ar = w[0] + zr * (t = ar) - zi * ai;
          ai = w[1] + zr * ai + zi * t;
        }
        br = ar + zr * (t = br) - zi * bi;
        bi = ai + zr * bi + zi * t;
        ar = zr * (t = ar) - zi * ai - x;
        ai = zr * ai + zi * t - y;
        var denominator = br * br + bi * bi,
          deltar,
          deltai;
        zr -= deltar = (ar * br + ai * bi) / denominator;
        zi -= deltai = (ai * br - ar * bi) / denominator;
      } while (abs(deltar) + abs(deltai) > epsilon * epsilon && --i > 0);
      if (i) {
        var rho = sqrt(zr * zr + zi * zi),
          c = 2 * atan(rho * 0.5),
          sinc = sin(c);
        return [atan2(zr * sinc, rho * cos(c)), rho ? asin(zi * sinc / rho) : 0];
      }
    };
    return forward;
  }
  var alaska = [[0.9972523, 0], [0.0052513, -0.0041175], [0.0074606, 0.0048125], [-0.0153783, -0.1968253], [0.0636871, -0.1408027], [0.3660976, -0.2937382]],
    gs48 = [[0.98879, 0], [0, 0], [-0.050909, 0], [0, 0], [0.075528, 0]],
    gs50 = [[0.9842990, 0], [0.0211642, 0.0037608], [-0.1036018, -0.0575102], [-0.0329095, -0.0320119], [0.0499471, 0.1223335], [0.0260460, 0.0899805], [0.0007388, -0.1435792], [0.0075848, -0.1334108], [-0.0216473, 0.0776645], [-0.0225161, 0.0853673]],
    miller = [[0.9245, 0], [0, 0], [0.01943, 0]],
    lee = [[0.721316, 0], [0, 0], [-0.00881625, -0.00617325]];
  function modifiedStereographicAlaska() {
    return modifiedStereographic(alaska, [152, -64]).scale(1400).center([-160.908, 62.4864]).clipAngle(30).angle(7.8);
  }
  function modifiedStereographicGs48() {
    return modifiedStereographic(gs48, [95, -38]).scale(1000).clipAngle(55).center([-96.5563, 38.8675]);
  }
  function modifiedStereographicGs50() {
    return modifiedStereographic(gs50, [120, -45]).scale(359.513).clipAngle(55).center([-117.474, 53.0628]);
  }
  function modifiedStereographicMiller() {
    return modifiedStereographic(miller, [-20, -18]).scale(209.091).center([20, 16.7214]).clipAngle(82);
  }
  function modifiedStereographicLee() {
    return modifiedStereographic(lee, [165, 10]).scale(250).clipAngle(130).center([-165, -10]);
  }
  function modifiedStereographic(coefficients, rotate) {
    var p = projection(modifiedStereographicRaw(coefficients)).rotate(rotate).clipAngle(90),
      r = rotation(rotate),
      center = p.center;
    delete p.rotate;
    p.center = function (_) {
      return arguments.length ? center(r(_)) : r.invert(center());
    };
    return p;
  }

  var sqrt6 = sqrt(6),
    sqrt7 = sqrt(7);
  function mtFlatPolarParabolicRaw(lambda, phi) {
    var theta = asin(7 * sin(phi) / (3 * sqrt6));
    return [sqrt6 * lambda * (2 * cos(2 * theta / 3) - 1) / sqrt7, 9 * sin(theta / 3) / sqrt7];
  }
  mtFlatPolarParabolicRaw.invert = function (x, y) {
    var theta = 3 * asin(y * sqrt7 / 9);
    return [x * sqrt7 / (sqrt6 * (2 * cos(2 * theta / 3) - 1)), asin(sin(theta) * 3 * sqrt6 / 7)];
  };
  function geoMtFlatPolarParabolic () {
    return projection(mtFlatPolarParabolicRaw).scale(164.859);
  }

  function mtFlatPolarQuarticRaw(lambda, phi) {
    var k = (1 + sqrt1_2) * sin(phi),
      theta = phi;
    for (var i = 0, delta; i < 25; i++) {
      theta -= delta = (sin(theta / 2) + sin(theta) - k) / (0.5 * cos(theta / 2) + cos(theta));
      if (abs(delta) < epsilon) break;
    }
    return [lambda * (1 + 2 * cos(theta) / cos(theta / 2)) / (3 * sqrt2), 2 * sqrt(3) * sin(theta / 2) / sqrt(2 + sqrt2)];
  }
  mtFlatPolarQuarticRaw.invert = function (x, y) {
    var sinTheta_2 = y * sqrt(2 + sqrt2) / (2 * sqrt(3)),
      theta = 2 * asin(sinTheta_2);
    return [3 * sqrt2 * x / (1 + 2 * cos(theta) / cos(theta / 2)), asin((sinTheta_2 + sin(theta)) / (1 + sqrt1_2))];
  };
  function geoMtFlatPolarQuartic () {
    return projection(mtFlatPolarQuarticRaw).scale(188.209);
  }

  function mtFlatPolarSinusoidalRaw(lambda, phi) {
    var A = sqrt(6 / (4 + pi)),
      k = (1 + pi / 4) * sin(phi),
      theta = phi / 2;
    for (var i = 0, delta; i < 25; i++) {
      theta -= delta = (theta / 2 + sin(theta) - k) / (0.5 + cos(theta));
      if (abs(delta) < epsilon) break;
    }
    return [A * (0.5 + cos(theta)) * lambda / 1.5, A * theta];
  }
  mtFlatPolarSinusoidalRaw.invert = function (x, y) {
    var A = sqrt(6 / (4 + pi)),
      theta = y / A;
    if (abs(abs(theta) - halfPi) < epsilon) theta = theta < 0 ? -halfPi : halfPi;
    return [1.5 * x / (A * (0.5 + cos(theta))), asin((theta / 2 + sin(theta)) / (1 + pi / 4))];
  };
  function geoMtFlatPolarSinusoidal () {
    return projection(mtFlatPolarSinusoidalRaw).scale(166.518);
  }

  function naturalEarth2Raw(lambda, phi) {
    var phi2 = phi * phi,
      phi4 = phi2 * phi2,
      phi6 = phi2 * phi4;
    return [lambda * (0.84719 - 0.13063 * phi2 + phi6 * phi6 * (-0.04515 + 0.05494 * phi2 - 0.02326 * phi4 + 0.00331 * phi6)), phi * (1.01183 + phi4 * phi4 * (-0.02625 + 0.01926 * phi2 - 0.00396 * phi4))];
  }
  naturalEarth2Raw.invert = function (x, y) {
    var phi = y,
      i = 25,
      delta,
      phi2,
      phi4,
      phi6;
    do {
      phi2 = phi * phi;
      phi4 = phi2 * phi2;
      phi -= delta = (phi * (1.01183 + phi4 * phi4 * (-0.02625 + 0.01926 * phi2 - 0.00396 * phi4)) - y) / (1.01183 + phi4 * phi4 * (9 * -0.02625 + 11 * 0.01926 * phi2 + 13 * -0.00396 * phi4));
    } while (abs(delta) > epsilon2 && --i > 0);
    phi2 = phi * phi;
    phi4 = phi2 * phi2;
    phi6 = phi2 * phi4;
    return [x / (0.84719 - 0.13063 * phi2 + phi6 * phi6 * (-0.04515 + 0.05494 * phi2 - 0.02326 * phi4 + 0.00331 * phi6)), phi];
  };
  function geoNaturalEarth2 () {
    return projection(naturalEarth2Raw).scale(175.295);
  }

  function nellHammerRaw(lambda, phi) {
    return [lambda * (1 + cos(phi)) / 2, 2 * (phi - tan(phi / 2))];
  }
  nellHammerRaw.invert = function (x, y) {
    var p = y / 2;
    for (var i = 0, delta = Infinity; i < 10 && abs(delta) > epsilon; ++i) {
      var c = cos(y / 2);
      y -= delta = (y - tan(y / 2) - p) / (1 - 0.5 / (c * c));
    }
    return [2 * x / (1 + cos(y)), y];
  };
  function geoNellHammer () {
    return projection(nellHammerRaw).scale(152.63);
  }

  var lobes = [[
  // northern hemisphere
  [[-180, 0], [-90, 90], [0, 0]], [[0, 0], [90, 90], [180, 0]]], [
  // southern hemisphere
  [[-180, 0], [-90, -90], [0, 0]], [[0, 0], [90, -90], [180, 0]]]];
  function geoInterruptedQuarticAuthalic () {
    return interrupt(hammerRaw(Infinity), lobes).rotate([20, 0]).scale(152.63);
  }

  // Based on Torben Jansen's implementation
  // https://beta.observablehq.com/@toja/nicolosi-globular-projection
  // https://beta.observablehq.com/@toja/nicolosi-globular-inverse

  function nicolosiRaw(lambda, phi) {
    var sinPhi = sin(phi),
      q = cos(phi),
      s = sign(lambda);
    if (lambda === 0 || abs(phi) === halfPi) return [0, phi];else if (phi === 0) return [lambda, 0];else if (abs(lambda) === halfPi) return [lambda * q, halfPi * sinPhi];
    var b = pi / (2 * lambda) - 2 * lambda / pi,
      c = 2 * phi / pi,
      d = (1 - c * c) / (sinPhi - c);
    var b2 = b * b,
      d2 = d * d,
      b2d2 = 1 + b2 / d2,
      d2b2 = 1 + d2 / b2;
    var M = (b * sinPhi / d - b / 2) / b2d2,
      N = (d2 * sinPhi / b2 + d / 2) / d2b2,
      m = M * M + q * q / b2d2,
      n = N * N - (d2 * sinPhi * sinPhi / b2 + d * sinPhi - 1) / d2b2;
    return [halfPi * (M + sqrt(m) * s), halfPi * (N + sqrt(n < 0 ? 0 : n) * sign(-phi * b) * s)];
  }
  nicolosiRaw.invert = function (x, y) {
    x /= halfPi;
    y /= halfPi;
    var x2 = x * x,
      y2 = y * y,
      x2y2 = x2 + y2,
      pi2 = pi * pi;
    return [x ? (x2y2 - 1 + sqrt((1 - x2y2) * (1 - x2y2) + 4 * x2)) / (2 * x) * halfPi : 0, solve(function (phi) {
      return x2y2 * (pi * sin(phi) - 2 * phi) * pi + 4 * phi * phi * (y - sin(phi)) + 2 * pi * phi - pi2 * y;
    }, 0)];
  };
  function geoNicolosi () {
    return projection(nicolosiRaw).scale(127.267);
  }

  // Based on Java implementation by Bojan Savric.
  // https://github.com/OSUCartography/JMapProjLib/blob/master/src/com/jhlabs/map/proj/PattersonProjection.java

  var pattersonK1 = 1.0148,
    pattersonK2 = 0.23185,
    pattersonK3 = -0.14499,
    pattersonK4 = 0.02406,
    pattersonC1 = pattersonK1,
    pattersonC2 = 5 * pattersonK2,
    pattersonC3 = 7 * pattersonK3,
    pattersonC4 = 9 * pattersonK4,
    pattersonYmax = 1.790857183;
  function pattersonRaw(lambda, phi) {
    var phi2 = phi * phi;
    return [lambda, phi * (pattersonK1 + phi2 * phi2 * (pattersonK2 + phi2 * (pattersonK3 + pattersonK4 * phi2)))];
  }
  pattersonRaw.invert = function (x, y) {
    if (y > pattersonYmax) y = pattersonYmax;else if (y < -pattersonYmax) y = -pattersonYmax;
    var yc = y,
      delta;
    do {
      // Newton-Raphson
      var y2 = yc * yc;
      yc -= delta = (yc * (pattersonK1 + y2 * y2 * (pattersonK2 + y2 * (pattersonK3 + pattersonK4 * y2))) - y) / (pattersonC1 + y2 * y2 * (pattersonC2 + y2 * (pattersonC3 + pattersonC4 * y2)));
    } while (abs(delta) > epsilon);
    return [x, yc];
  };
  function geoPatterson () {
    return projection(pattersonRaw).scale(139.319);
  }

  function polyconicRaw(lambda, phi) {
    if (abs(phi) < epsilon) return [lambda, 0];
    var tanPhi = tan(phi),
      k = lambda * sin(phi);
    return [sin(k) / tanPhi, phi + (1 - cos(k)) / tanPhi];
  }
  polyconicRaw.invert = function (x, y) {
    if (abs(y) < epsilon) return [x, 0];
    var k = x * x + y * y,
      phi = y * 0.5,
      i = 10,
      delta;
    do {
      var tanPhi = tan(phi),
        secPhi = 1 / cos(phi),
        j = k - 2 * y * phi + phi * phi;
      phi -= delta = (tanPhi * j + 2 * (phi - y)) / (2 + j * secPhi * secPhi + 2 * (phi - y) * tanPhi);
    } while (abs(delta) > epsilon && --i > 0);
    tanPhi = tan(phi);
    return [(abs(y) < abs(phi + 1 / tanPhi) ? asin(x * tanPhi) : sign(y) * sign(x) * (acos(abs(x * tanPhi)) + halfPi)) / sin(phi), phi];
  };
  function geoPolyconic () {
    return projection(polyconicRaw).scale(103.74);
  }

  // Note: 6-element arrays are used to denote the 3x3 affine transform matrix:
  // [a, b, c,
  //  d, e, f,
  //  0, 0, 1] - this redundant row is left out.

  // Transform matrix for [a0, a1] -> [b0, b1].
  function matrix (a, b) {
    var u = subtract(a[1], a[0]),
      v = subtract(b[1], b[0]),
      phi = angle(u, v),
      s = length(u) / length(v);
    return multiply([1, 0, a[0][0], 0, 1, a[0][1]], multiply([s, 0, 0, 0, s, 0], multiply([cos(phi), sin(phi), 0, -sin(phi), cos(phi), 0], [1, 0, -b[0][0], 0, 1, -b[0][1]])));
  }

  // Inverts a transform matrix.
  function inverse(m) {
    var k = 1 / (m[0] * m[4] - m[1] * m[3]);
    return [k * m[4], -k * m[1], k * (m[1] * m[5] - m[2] * m[4]), -k * m[3], k * m[0], k * (m[2] * m[3] - m[0] * m[5])];
  }

  // Multiplies two 3x2 matrices.
  function multiply(a, b) {
    return [a[0] * b[0] + a[1] * b[3], a[0] * b[1] + a[1] * b[4], a[0] * b[2] + a[1] * b[5] + a[2], a[3] * b[0] + a[4] * b[3], a[3] * b[1] + a[4] * b[4], a[3] * b[2] + a[4] * b[5] + a[5]];
  }

  // Subtracts 2D vectors.
  function subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1]];
  }

  // Magnitude of a 2D vector.
  function length(v) {
    return sqrt(v[0] * v[0] + v[1] * v[1]);
  }

  // Angle between two 2D vectors.
  function angle(a, b) {
    return atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]);
  }

  // Creates a polyhedral projection.
  //  * root: a spanning tree of polygon faces.  Nodes are automatically
  //    augmented with a transform matrix.
  //  * face: a function that returns the appropriate node for a given {lambda, phi}
  //    point (radians).
  function polyhedral (root, face) {
    recurse(root, {
      transform: null
    });
    function recurse(node, parent) {
      node.edges = faceEdges(node.face);
      // Find shared edge.
      if (parent.face) {
        var shared = node.shared = sharedEdge(node.face, parent.face),
          m = matrix(shared.map(parent.project), shared.map(node.project));
        node.transform = parent.transform ? multiply(parent.transform, m) : m;
        // Replace shared edge in parent edges array.
        var edges = parent.edges;
        for (var i = 0, n = edges.length; i < n; ++i) {
          if (pointEqual(shared[0], edges[i][1]) && pointEqual(shared[1], edges[i][0])) edges[i] = node;
          if (pointEqual(shared[0], edges[i][0]) && pointEqual(shared[1], edges[i][1])) edges[i] = node;
        }
        edges = node.edges;
        for (i = 0, n = edges.length; i < n; ++i) {
          if (pointEqual(shared[0], edges[i][0]) && pointEqual(shared[1], edges[i][1])) edges[i] = parent;
          if (pointEqual(shared[0], edges[i][1]) && pointEqual(shared[1], edges[i][0])) edges[i] = parent;
        }
      } else {
        node.transform = parent.transform;
      }
      if (node.children) {
        node.children.forEach(function (child) {
          recurse(child, node);
        });
      }
      return node;
    }
    function forward(lambda, phi) {
      var node = face(lambda, phi),
        point = node.project([lambda * degrees, phi * degrees]),
        t;
      if (t = node.transform) {
        return [t[0] * point[0] + t[1] * point[1] + t[2], -(t[3] * point[0] + t[4] * point[1] + t[5])];
      }
      point[1] = -point[1];
      return point;
    }

    // Naive inverse!  A faster solution would use bounding boxes, or even a
    // polygonal quadtree.
    if (hasInverse(root)) forward.invert = function (x, y) {
      var coordinates = faceInvert(root, [x, -y]);
      return coordinates && (coordinates[0] *= radians, coordinates[1] *= radians, coordinates);
    };
    function faceInvert(node, coordinates) {
      var invert = node.project.invert,
        t = node.transform,
        point = coordinates;
      if (t) {
        t = inverse(t);
        point = [t[0] * point[0] + t[1] * point[1] + t[2], t[3] * point[0] + t[4] * point[1] + t[5]];
      }
      if (invert && node === faceDegrees(p = invert(point))) return p;
      var p,
        children = node.children;
      for (var i = 0, n = children && children.length; i < n; ++i) {
        if (p = faceInvert(children[i], coordinates)) return p;
      }
    }
    function faceDegrees(coordinates) {
      return face(coordinates[0] * radians, coordinates[1] * radians);
    }
    var proj = projection(forward),
      stream_ = proj.stream;
    proj.stream = function (stream) {
      var rotate = proj.rotate(),
        rotateStream = stream_(stream),
        sphereStream = (proj.rotate([0, 0]), stream_(stream));
      proj.rotate(rotate);
      rotateStream.sphere = function () {
        sphereStream.polygonStart();
        sphereStream.lineStart();
        outline(sphereStream, root);
        sphereStream.lineEnd();
        sphereStream.polygonEnd();
      };
      return rotateStream;
    };
    return proj.angle(-30);
  }
  function outline(stream, node, parent) {
    var point,
      edges = node.edges,
      n = edges.length,
      edge,
      multiPoint = {
        type: "MultiPoint",
        coordinates: node.face
      },
      notPoles = node.face.filter(function (d) {
        return abs(d[1]) !== 90;
      }),
      b = bounds({
        type: "MultiPoint",
        coordinates: notPoles
      }),
      inside = false,
      j = -1,
      dx = b[1][0] - b[0][0];
    // TODO
    var c = dx === 180 || dx === 360 ? [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2] : centroid(multiPoint);
    // First find the shared edge…
    if (parent) while (++j < n) {
      if (edges[j] === parent) break;
    }
    ++j;
    for (var i = 0; i < n; ++i) {
      edge = edges[(i + j) % n];
      if (Array.isArray(edge)) {
        if (!inside) {
          stream.point((point = interpolate(edge[0], c)(epsilon))[0], point[1]);
          inside = true;
        }
        stream.point((point = interpolate(edge[1], c)(epsilon))[0], point[1]);
      } else {
        inside = false;
        if (edge !== parent) outline(stream, edge, node);
      }
    }
  }

  // Tests equality of two spherical points.
  function pointEqual(a, b) {
    return a && b && a[0] === b[0] && a[1] === b[1];
  }

  // Finds a shared edge given two clockwise polygons.
  function sharedEdge(a, b) {
    var x,
      y,
      n = a.length,
      found = null;
    for (var i = 0; i < n; ++i) {
      x = a[i];
      for (var j = b.length; --j >= 0;) {
        y = b[j];
        if (x[0] === y[0] && x[1] === y[1]) {
          if (found) return [found, x];
          found = x;
        }
      }
    }
  }

  // Converts an array of n face vertices to an array of n + 1 edges.
  function faceEdges(face) {
    var n = face.length,
      edges = [];
    for (var a = face[n - 1], i = 0; i < n; ++i) edges.push([a, a = face[i]]);
    return edges;
  }
  function hasInverse(node) {
    return node.project.invert || node.children && node.children.some(hasInverse);
  }

  // TODO generate on-the-fly to avoid external modification.
  var octahedron = [[0, 90], [-90, 0], [0, 0], [90, 0], [180, 0], [0, -90]];
  var octahedron$1 = [[0, 2, 1], [0, 3, 2], [5, 1, 2], [5, 2, 3], [0, 1, 4], [0, 4, 3], [5, 4, 1], [5, 3, 4]].map(function (face) {
    return face.map(function (i) {
      return octahedron[i];
    });
  });

  function geoPolyhedralButterfly (faceProjection) {
    faceProjection = faceProjection || function (face) {
      var c = centroid({
        type: "MultiPoint",
        coordinates: face
      });
      return gnomonic().scale(1).translate([0, 0]).rotate([-c[0], -c[1]]);
    };
    var faces = octahedron$1.map(function (face) {
      return {
        face: face,
        project: faceProjection(face)
      };
    });
    [-1, 0, 0, 1, 0, 1, 4, 5].forEach(function (d, i) {
      var node = faces[d];
      node && (node.children || (node.children = [])).push(faces[i]);
    });
    return polyhedral(faces[0], function (lambda, phi) {
      return faces[lambda < -pi / 2 ? phi < 0 ? 6 : 4 : lambda < 0 ? phi < 0 ? 2 : 0 : lambda < pi / 2 ? phi < 0 ? 3 : 1 : phi < 0 ? 7 : 5];
    }).angle(-30).scale(101.858).center([0, 45]);
  }

  var kx = 2 / sqrt(3);
  function collignonK(a, b) {
    var p = collignonRaw(a, b);
    return [p[0] * kx, p[1]];
  }
  collignonK.invert = function (x, y) {
    return collignonRaw.invert(x / kx, y);
  };
  function geoPolyhedralCollignon (faceProjection) {
    faceProjection = faceProjection || function (face) {
      var c = centroid({
        type: "MultiPoint",
        coordinates: face
      });
      return projection(collignonK).translate([0, 0]).scale(1).rotate(c[1] > 0 ? [-c[0], 0] : [180 - c[0], 180]);
    };
    var faces = octahedron$1.map(function (face) {
      return {
        face: face,
        project: faceProjection(face)
      };
    });
    [-1, 0, 0, 1, 0, 1, 4, 5].forEach(function (d, i) {
      var node = faces[d];
      node && (node.children || (node.children = [])).push(faces[i]);
    });
    return polyhedral(faces[0], function (lambda, phi) {
      return faces[lambda < -pi / 2 ? phi < 0 ? 6 : 4 : lambda < 0 ? phi < 0 ? 2 : 0 : lambda < pi / 2 ? phi < 0 ? 3 : 1 : phi < 0 ? 7 : 5];
    }).angle(-30).scale(121.906).center([0, 48.5904]);
  }

  function geoPolyhedralWaterman (faceProjection) {
    faceProjection = faceProjection || function (face) {
      var c = face.length === 6 ? centroid({
        type: "MultiPoint",
        coordinates: face
      }) : face[0];
      return gnomonic().scale(1).translate([0, 0]).rotate([-c[0], -c[1]]);
    };
    var w5 = octahedron$1.map(function (face) {
      var xyz = face.map(cartesian),
        n = xyz.length,
        a = xyz[n - 1],
        b,
        hexagon = [];
      for (var i = 0; i < n; ++i) {
        b = xyz[i];
        hexagon.push(spherical([a[0] * 0.9486832980505138 + b[0] * 0.31622776601683794, a[1] * 0.9486832980505138 + b[1] * 0.31622776601683794, a[2] * 0.9486832980505138 + b[2] * 0.31622776601683794]), spherical([b[0] * 0.9486832980505138 + a[0] * 0.31622776601683794, b[1] * 0.9486832980505138 + a[1] * 0.31622776601683794, b[2] * 0.9486832980505138 + a[2] * 0.31622776601683794]));
        a = b;
      }
      return hexagon;
    });
    var cornerNormals = [];
    var parents = [-1, 0, 0, 1, 0, 1, 4, 5];
    w5.forEach(function (hexagon, j) {
      var face = octahedron$1[j],
        n = face.length,
        normals = cornerNormals[j] = [];
      for (var i = 0; i < n; ++i) {
        w5.push([face[i], hexagon[(i * 2 + 2) % (2 * n)], hexagon[(i * 2 + 1) % (2 * n)]]);
        parents.push(j);
        normals.push(cross(cartesian(hexagon[(i * 2 + 2) % (2 * n)]), cartesian(hexagon[(i * 2 + 1) % (2 * n)])));
      }
    });
    var faces = w5.map(function (face) {
      return {
        project: faceProjection(face),
        face: face
      };
    });
    parents.forEach(function (d, i) {
      var parent = faces[d];
      parent && (parent.children || (parent.children = [])).push(faces[i]);
    });
    function face(lambda, phi) {
      var cosphi = cos(phi),
        p = [cosphi * cos(lambda), cosphi * sin(lambda), sin(phi)];
      var hexagon = lambda < -pi / 2 ? phi < 0 ? 6 : 4 : lambda < 0 ? phi < 0 ? 2 : 0 : lambda < pi / 2 ? phi < 0 ? 3 : 1 : phi < 0 ? 7 : 5;
      var n = cornerNormals[hexagon];
      return faces[dot(n[0], p) < 0 ? 8 + 3 * hexagon : dot(n[1], p) < 0 ? 8 + 3 * hexagon + 1 : dot(n[2], p) < 0 ? 8 + 3 * hexagon + 2 : hexagon];
    }
    return polyhedral(faces[0], face).angle(-30).scale(110.625).center([0, 45]);
  }
  function dot(a, b) {
    for (var i = 0, n = a.length, s = 0; i < n; ++i) s += a[i] * b[i];
    return s;
  }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  // Converts 3D Cartesian to spherical coordinates (degrees).
  function spherical(cartesian) {
    return [atan2(cartesian[1], cartesian[0]) * degrees, asin(max(-1, min(1, cartesian[2]))) * degrees];
  }

  // Converts spherical coordinates (degrees) to 3D Cartesian.
  function cartesian(coordinates) {
    var lambda = coordinates[0] * radians,
      phi = coordinates[1] * radians,
      cosphi = cos(phi);
    return [cosphi * cos(lambda), cosphi * sin(lambda), sin(phi)];
  }

  function quincuncial (project) {
    var dx = project(halfPi, 0)[0] - project(-halfPi, 0)[0];
    function projectQuincuncial(lambda, phi) {
      var t = abs(lambda) < halfPi,
        p = project(t ? lambda : lambda > 0 ? lambda - pi : lambda + pi, phi),
        x = (p[0] - p[1]) * sqrt1_2,
        y = (p[0] + p[1]) * sqrt1_2;
      if (t) return [x, y];
      var d = dx * sqrt1_2,
        s = x > 0 ^ y > 0 ? -1 : 1;
      return [s * x - sign(y) * d, s * y - sign(x) * d];
    }
    if (project.invert) projectQuincuncial.invert = function (x0, y0) {
      var x = (x0 + y0) * sqrt1_2,
        y = (y0 - x0) * sqrt1_2,
        t = abs(x) < 0.5 * dx && abs(y) < 0.5 * dx;
      if (!t) {
        var d = dx * sqrt1_2,
          s = x > 0 ^ y > 0 ? -1 : 1,
          x1 = -s * x0 + (y > 0 ? 1 : -1) * d,
          y1 = -s * y0 + (x > 0 ? 1 : -1) * d;
        x = (-x1 - y1) * sqrt1_2;
        y = (x1 - y1) * sqrt1_2;
      }
      var p = project.invert(x, y);
      if (!t) p[0] += x > 0 ? pi : -pi;
      return p;
    };
    return projection(projectQuincuncial).rotate([-90, -90, 45]).clipAngle(180 - 1e-3);
  }

  function geoGringortenQuincuncial () {
    return quincuncial(gringortenRaw).scale(176.423);
  }

  function geoPeirceQuincuncial () {
    return quincuncial(guyouRaw).scale(111.48);
  }

  function rectangularPolyconicRaw(phi0) {
    var sinPhi0 = sin(phi0);
    function forward(lambda, phi) {
      var A = sinPhi0 ? tan(lambda * sinPhi0 / 2) / sinPhi0 : lambda / 2;
      if (!phi) return [2 * A, -phi0];
      var E = 2 * atan(A * sin(phi)),
        cotPhi = 1 / tan(phi);
      return [sin(E) * cotPhi, phi + (1 - cos(E)) * cotPhi - phi0];
    }

    // TODO return null for points outside outline.
    forward.invert = function (x, y) {
      if (abs(y += phi0) < epsilon) return [sinPhi0 ? 2 * atan(sinPhi0 * x / 2) / sinPhi0 : x, 0];
      var k = x * x + y * y,
        phi = 0,
        i = 10,
        delta;
      do {
        var tanPhi = tan(phi),
          secPhi = 1 / cos(phi),
          j = k - 2 * y * phi + phi * phi;
        phi -= delta = (tanPhi * j + 2 * (phi - y)) / (2 + j * secPhi * secPhi + 2 * (phi - y) * tanPhi);
      } while (abs(delta) > epsilon && --i > 0);
      var E = x * (tanPhi = tan(phi)),
        A = tan(abs(y) < abs(phi + 1 / tanPhi) ? asin(E) * 0.5 : acos(E) * 0.5 + pi / 4) / sin(phi);
      return [sinPhi0 ? 2 * atan(sinPhi0 * A) / sinPhi0 : 2 * A, phi];
    };
    return forward;
  }
  function geoRectangularPolyconic () {
    return parallel1(rectangularPolyconicRaw).scale(131.215);
  }

  var K = [[0.9986, -0.062], [1.0000, 0.0000], [0.9986, 0.0620], [0.9954, 0.1240], [0.9900, 0.1860], [0.9822, 0.2480], [0.9730, 0.3100], [0.9600, 0.3720], [0.9427, 0.4340], [0.9216, 0.4958], [0.8962, 0.5571], [0.8679, 0.6176], [0.8350, 0.6769], [0.7986, 0.7346], [0.7597, 0.7903], [0.7186, 0.8435], [0.6732, 0.8936], [0.6213, 0.9394], [0.5722, 0.9761], [0.5322, 1.0000]];
  K.forEach(function (d) {
    d[1] *= 1.593415793900743;
  });
  function robinsonRaw(lambda, phi) {
    var i = min(18, abs(phi) * 36 / pi),
      i0 = floor(i),
      di = i - i0,
      ax = (k = K[i0])[0],
      ay = k[1],
      bx = (k = K[++i0])[0],
      by = k[1],
      cx = (k = K[min(19, ++i0)])[0],
      cy = k[1],
      k;
    return [lambda * (bx + di * (cx - ax) / 2 + di * di * (cx - 2 * bx + ax) / 2), sign(phi) * (by + di * (cy - ay) / 2 + di * di * (cy - 2 * by + ay) / 2)];
  }
  robinsonRaw.invert = function (x, y) {
    var phi = y * 90,
      i = min(18, abs(phi / 5)),
      i0 = max(0, floor(i));
    do {
      var ay = K[i0][1],
        by = K[i0 + 1][1],
        cy = K[min(19, i0 + 2)][1],
        u = cy - ay,
        v = cy - 2 * by + ay,
        t = 2 * (abs(y) - by) / u,
        c = v / u,
        di = t * (1 - c * t * (1 - 2 * c * t));
      if (di >= 0 || i0 === 1) {
        phi = (y >= 0 ? 5 : -5) * (di + i);
        var j = 50,
          delta;
        do {
          i = min(18, abs(phi) / 5);
          i0 = floor(i);
          di = i - i0;
          ay = K[i0][1];
          by = K[i0 + 1][1];
          cy = K[min(19, i0 + 2)][1];
          phi -= (delta = sign(y) * (by + di * (cy - ay) / 2 + di * di * (cy - 2 * by + ay) / 2) - y) * degrees;
        } while (abs(delta) > epsilon2 && --j > 0);
        break;
      }
    } while (--i0 >= 0);
    var ax = K[i0][0],
      bx = K[i0 + 1][0],
      cx = K[min(19, i0 + 2)][0];
    return [x / (bx + di * (cx - ax) / 2 + di * di * (cx - 2 * bx + ax) / 2), phi * radians];
  };
  function geoRobinson () {
    return projection(robinsonRaw).scale(152.63);
  }

  function satelliteVerticalRaw(P) {
    function forward(lambda, phi) {
      var cosPhi = cos(phi),
        k = (P - 1) / (P - cosPhi * cos(lambda));
      return [k * cosPhi * sin(lambda), k * sin(phi)];
    }
    forward.invert = function (x, y) {
      var rho2 = x * x + y * y,
        rho = sqrt(rho2),
        sinc = (P - sqrt(1 - rho2 * (P + 1) / (P - 1))) / ((P - 1) / rho + rho / (P - 1));
      return [atan2(x * sinc, rho * sqrt(1 - sinc * sinc)), rho ? asin(y * sinc / rho) : 0];
    };
    return forward;
  }
  function satelliteRaw(P, omega) {
    var vertical = satelliteVerticalRaw(P);
    if (!omega) return vertical;
    var cosOmega = cos(omega),
      sinOmega = sin(omega);
    function forward(lambda, phi) {
      var coordinates = vertical(lambda, phi),
        y = coordinates[1],
        A = y * sinOmega / (P - 1) + cosOmega;
      return [coordinates[0] * cosOmega / A, y / A];
    }
    forward.invert = function (x, y) {
      var k = (P - 1) / (P - 1 - y * sinOmega);
      return vertical.invert(k * x, k * y * cosOmega);
    };
    return forward;
  }
  function geoSatellite () {
    var distance = 2,
      omega = 0,
      m = projectionMutator(satelliteRaw),
      p = m(distance, omega);

    // As a multiple of radius.
    p.distance = function (_) {
      if (!arguments.length) return distance;
      return m(distance = +_, omega);
    };
    p.tilt = function (_) {
      if (!arguments.length) return omega * degrees;
      return m(distance, omega = _ * radians);
    };
    return p.scale(432.147).clipAngle(acos(1 / distance) * degrees - 1e-6);
  }

  function timesRaw(lambda, phi) {
    var t = tan(phi / 2),
      s = sin(quarterPi * t);
    return [lambda * (0.74482 - 0.34588 * s * s), 1.70711 * t];
  }
  timesRaw.invert = function (x, y) {
    var t = y / 1.70711,
      s = sin(quarterPi * t);
    return [x / (0.74482 - 0.34588 * s * s), 2 * atan(t)];
  };
  function geoTimes () {
    return projection(timesRaw).scale(146.153);
  }

  // Compute the origin as the midpoint of the two reference points.
  // Rotate one of the reference points by the origin.
  // Apply the spherical law of sines to compute gamma rotation.
  function twoPoint (raw, p0, p1) {
    var i = interpolate(p0, p1),
      o = i(0.5),
      a = rotation([-o[0], -o[1]])(p0),
      b = i.distance / 2,
      y = -asin(sin(a[1] * radians) / sin(b)),
      R = [-o[0], -o[1], -(a[0] > 0 ? pi - y : y) * degrees],
      p = projection(raw(b)).rotate(R),
      r = rotation(R),
      center = p.center;
    delete p.rotate;
    p.center = function (_) {
      return arguments.length ? center(r(_)) : r.invert(center());
    };
    return p.clipAngle(90);
  }

  function twoPointAzimuthalRaw(d) {
    var cosd = cos(d);
    function forward(lambda, phi) {
      var coordinates = gnomonicRaw(lambda, phi);
      coordinates[0] *= cosd;
      return coordinates;
    }
    forward.invert = function (x, y) {
      return gnomonicRaw.invert(x / cosd, y);
    };
    return forward;
  }
  function twoPointAzimuthalUsa() {
    return twoPointAzimuthal([-158, 21.5], [-77, 39]).clipAngle(60).scale(400);
  }
  function twoPointAzimuthal(p0, p1) {
    return twoPoint(twoPointAzimuthalRaw, p0, p1);
  }

  function twoPointEquidistantRaw(z0) {
    if (!(z0 *= 2)) return azimuthalEquidistantRaw;
    var lambdaa = -z0 / 2,
      lambdab = -lambdaa,
      z02 = z0 * z0,
      tanLambda0 = tan(lambdab),
      S = 0.5 / sin(lambdab);
    function forward(lambda, phi) {
      var za = acos(cos(phi) * cos(lambda - lambdaa)),
        zb = acos(cos(phi) * cos(lambda - lambdab)),
        ys = phi < 0 ? -1 : 1;
      za *= za, zb *= zb;
      return [(za - zb) / (2 * z0), ys * sqrt(4 * z02 * zb - (z02 - za + zb) * (z02 - za + zb)) / (2 * z0)];
    }
    forward.invert = function (x, y) {
      var y2 = y * y,
        cosza = cos(sqrt(y2 + (t = x + lambdaa) * t)),
        coszb = cos(sqrt(y2 + (t = x + lambdab) * t)),
        t,
        d;
      return [atan2(d = cosza - coszb, t = (cosza + coszb) * tanLambda0), (y < 0 ? -1 : 1) * acos(sqrt(t * t + d * d) * S)];
    };
    return forward;
  }
  function twoPointEquidistantUsa() {
    return twoPointEquidistant([-158, 21.5], [-77, 39]).clipAngle(130).scale(122.571);
  }
  function twoPointEquidistant(p0, p1) {
    return twoPoint(twoPointEquidistantRaw, p0, p1);
  }

  function vanDerGrintenRaw(lambda, phi) {
    if (abs(phi) < epsilon) return [lambda, 0];
    var sinTheta = abs(phi / halfPi),
      theta = asin(sinTheta);
    if (abs(lambda) < epsilon || abs(abs(phi) - halfPi) < epsilon) return [0, sign(phi) * pi * tan(theta / 2)];
    var cosTheta = cos(theta),
      A = abs(pi / lambda - lambda / pi) / 2,
      A2 = A * A,
      G = cosTheta / (sinTheta + cosTheta - 1),
      P = G * (2 / sinTheta - 1),
      P2 = P * P,
      P2_A2 = P2 + A2,
      G_P2 = G - P2,
      Q = A2 + G;
    return [sign(lambda) * pi * (A * G_P2 + sqrt(A2 * G_P2 * G_P2 - P2_A2 * (G * G - P2))) / P2_A2, sign(phi) * pi * (P * Q - A * sqrt((A2 + 1) * P2_A2 - Q * Q)) / P2_A2];
  }
  vanDerGrintenRaw.invert = function (x, y) {
    if (abs(y) < epsilon) return [x, 0];
    if (abs(x) < epsilon) return [0, halfPi * sin(2 * atan(y / pi))];
    var x2 = (x /= pi) * x,
      y2 = (y /= pi) * y,
      x2_y2 = x2 + y2,
      z = x2_y2 * x2_y2,
      c1 = -abs(y) * (1 + x2_y2),
      c2 = c1 - 2 * y2 + x2,
      c3 = -2 * c1 + 1 + 2 * y2 + z,
      d = y2 / c3 + (2 * c2 * c2 * c2 / (c3 * c3 * c3) - 9 * c1 * c2 / (c3 * c3)) / 27,
      a1 = (c1 - c2 * c2 / (3 * c3)) / c3,
      m1 = 2 * sqrt(-a1 / 3),
      theta1 = acos(3 * d / (a1 * m1)) / 3;
    return [pi * (x2_y2 - 1 + sqrt(1 + 2 * (x2 - y2) + z)) / (2 * x), sign(y) * pi * (-m1 * cos(theta1 + pi / 3) - c2 / (3 * c3))];
  };
  function geoVanDerGrinten () {
    return projection(vanDerGrintenRaw).scale(79.4183);
  }

  function vanDerGrinten2Raw(lambda, phi) {
    if (abs(phi) < epsilon) return [lambda, 0];
    var sinTheta = abs(phi / halfPi),
      theta = asin(sinTheta);
    if (abs(lambda) < epsilon || abs(abs(phi) - halfPi) < epsilon) return [0, sign(phi) * pi * tan(theta / 2)];
    var cosTheta = cos(theta),
      A = abs(pi / lambda - lambda / pi) / 2,
      A2 = A * A,
      x1 = cosTheta * (sqrt(1 + A2) - A * cosTheta) / (1 + A2 * sinTheta * sinTheta);
    return [sign(lambda) * pi * x1, sign(phi) * pi * sqrt(1 - x1 * (2 * A + x1))];
  }
  vanDerGrinten2Raw.invert = function (x, y) {
    if (!x) return [0, halfPi * sin(2 * atan(y / pi))];
    var x1 = abs(x / pi),
      A = (1 - x1 * x1 - (y /= pi) * y) / (2 * x1),
      A2 = A * A,
      B = sqrt(A2 + 1);
    return [sign(x) * pi * (B - A), sign(y) * halfPi * sin(2 * atan2(sqrt((1 - 2 * A * x1) * (A + B) - x1), sqrt(B + A + x1)))];
  };
  function geoVanDerGrinten2 () {
    return projection(vanDerGrinten2Raw).scale(79.4183);
  }

  function vanDerGrinten3Raw(lambda, phi) {
    if (abs(phi) < epsilon) return [lambda, 0];
    var sinTheta = phi / halfPi,
      theta = asin(sinTheta);
    if (abs(lambda) < epsilon || abs(abs(phi) - halfPi) < epsilon) return [0, pi * tan(theta / 2)];
    var A = (pi / lambda - lambda / pi) / 2,
      y1 = sinTheta / (1 + cos(theta));
    return [pi * (sign(lambda) * sqrt(A * A + 1 - y1 * y1) - A), pi * y1];
  }
  vanDerGrinten3Raw.invert = function (x, y) {
    if (!y) return [x, 0];
    var y1 = y / pi,
      A = (pi * pi * (1 - y1 * y1) - x * x) / (2 * pi * x);
    return [x ? pi * (sign(x) * sqrt(A * A + 1) - A) : 0, halfPi * sin(2 * atan(y1))];
  };
  function geoVanDerGrinten3 () {
    return projection(vanDerGrinten3Raw).scale(79.4183);
  }

  function vanDerGrinten4Raw(lambda, phi) {
    if (!phi) return [lambda, 0];
    var phi0 = abs(phi);
    if (!lambda || phi0 === halfPi) return [0, phi];
    var B = phi0 / halfPi,
      B2 = B * B,
      C = (8 * B - B2 * (B2 + 2) - 5) / (2 * B2 * (B - 1)),
      C2 = C * C,
      BC = B * C,
      B_C2 = B2 + C2 + 2 * BC,
      B_3C = B + 3 * C,
      lambda0 = lambda / halfPi,
      lambda1 = lambda0 + 1 / lambda0,
      D = sign(abs(lambda) - halfPi) * sqrt(lambda1 * lambda1 - 4),
      D2 = D * D,
      F = B_C2 * (B2 + C2 * D2 - 1) + (1 - B2) * (B2 * (B_3C * B_3C + 4 * C2) + 12 * BC * C2 + 4 * C2 * C2),
      x1 = (D * (B_C2 + C2 - 1) + 2 * sqrt(F)) / (4 * B_C2 + D2);
    return [sign(lambda) * halfPi * x1, sign(phi) * halfPi * sqrt(1 + D * abs(x1) - x1 * x1)];
  }
  vanDerGrinten4Raw.invert = function (x, y) {
    var delta;
    if (!x || !y) return [x, y];
    var sy = sign(y);
    y = abs(y) / pi;
    var x1 = sign(x) * x / halfPi,
      D = (x1 * x1 - 1 + 4 * y * y) / abs(x1),
      D2 = D * D,
      B = y * (2 - (y > 0.5 ? min(y, abs(x)) : 0)),
      r = x * x + y * y,
      i = 50;
    do {
      var B2 = B * B,
        C = (8 * B - B2 * (B2 + 2) - 5) / (2 * B2 * (B - 1)),
        C_ = (3 * B - B2 * B - 10) / (2 * B2 * B),
        C2 = C * C,
        BC = B * C,
        B_C = B + C,
        B_C2 = B_C * B_C,
        B_3C = B + 3 * C,
        F = B_C2 * (B2 + C2 * D2 - 1) + (1 - B2) * (B2 * (B_3C * B_3C + 4 * C2) + C2 * (12 * BC + 4 * C2)),
        F_ = -2 * B_C * (4 * BC * C2 + (1 - 4 * B2 + 3 * B2 * B2) * (1 + C_) + C2 * (-6 + 14 * B2 - D2 + (-8 + 8 * B2 - 2 * D2) * C_) + BC * (-8 + 12 * B2 + (-10 + 10 * B2 - D2) * C_)),
        sqrtF = sqrt(F),
        f = D * (B_C2 + C2 - 1) + 2 * sqrtF - x1 * (4 * B_C2 + D2),
        f_ = D * (2 * C * C_ + 2 * B_C * (1 + C_)) + F_ / sqrtF - 8 * B_C * (D * (-1 + C2 + B_C2) + 2 * sqrtF) * (1 + C_) / (D2 + 4 * B_C2);
      B -= delta = f / f_;
    } while (delta * r * r > epsilon && --i > 0);
    return [sign(x) * (sqrt(D * D + 4) + D) * pi / 4, sy * halfPi * B];
  };
  function geoVanDerGrinten4 () {
    return projection(vanDerGrinten4Raw).scale(127.16);
  }

  function wagnerFormula(cx, cy, m1, m2, n) {
    function forward(lambda, phi) {
      var s = m1 * sin(m2 * phi),
        c0 = sqrt(1 - s * s),
        c1 = sqrt(2 / (1 + c0 * cos(lambda *= n)));
      return [cx * c0 * c1 * sin(lambda), cy * s * c1];
    }
    forward.invert = function (x, y) {
      var t1 = x / cx,
        t2 = y / cy,
        p = sqrt(t1 * t1 + t2 * t2),
        c = 2 * asin(p / 2);
      return [atan2(x * tan(c), cx * p) / n, p && asin(y * sin(c) / (cy * m1 * p)) / m2];
    };
    return forward;
  }
  function wagnerRaw(poleline, parallels, inflation, ratio) {
    // 60 is always used as reference parallel
    var phi1 = pi / 3;

    // sanitizing the input values
    // poleline and parallels may approximate but never equal 0
    poleline = max(poleline, epsilon);
    parallels = max(parallels, epsilon);
    // poleline must be <= 90; parallels may approximate but never equal 180
    poleline = min(poleline, halfPi);
    parallels = min(parallels, pi - epsilon);
    // 0 <= inflation <= 99.999
    inflation = max(inflation, 0);
    inflation = min(inflation, 100 - epsilon);
    // ratio > 0.
    // sensible values, i.e. something that renders a map which still can be
    // recognized as world map, are e.g. 20 <= ratio <= 1000.
    ratio = max(ratio, epsilon);

    // convert values from boehm notation
    // areal inflation e.g. from 0 to 1 or 20 to 1.2:
    var vinflation = inflation / 100 + 1;
    // axial ratio e.g. from 200 to 2:
    var vratio = ratio / 100;
    // the other ones are a bit more complicated...
    var m2 = acos(vinflation * cos(phi1)) / phi1,
      m1 = sin(poleline) / sin(m2 * halfPi),
      n = parallels / pi,
      k = sqrt(vratio * sin(poleline / 2) / sin(parallels / 2)),
      cx = k / sqrt(n * m1 * m2),
      cy = 1 / (k * sqrt(n * m1 * m2));
    return wagnerFormula(cx, cy, m1, m2, n);
  }
  function wagner() {
    // default values generate wagner8
    var poleline = 65 * radians,
      parallels = 60 * radians,
      inflation = 20,
      ratio = 200,
      mutate = projectionMutator(wagnerRaw),
      projection = mutate(poleline, parallels, inflation, ratio);
    projection.poleline = function (_) {
      return arguments.length ? mutate(poleline = +_ * radians, parallels, inflation, ratio) : poleline * degrees;
    };
    projection.parallels = function (_) {
      return arguments.length ? mutate(poleline, parallels = +_ * radians, inflation, ratio) : parallels * degrees;
    };
    projection.inflation = function (_) {
      return arguments.length ? mutate(poleline, parallels, inflation = +_, ratio) : inflation;
    };
    projection.ratio = function (_) {
      return arguments.length ? mutate(poleline, parallels, inflation, ratio = +_) : ratio;
    };
    return projection.scale(163.775);
  }
  function wagner7() {
    return wagner().poleline(65).parallels(60).inflation(0).ratio(200).scale(172.633);
  }

  var A = 4 * pi + 3 * sqrt(3),
    B = 2 * sqrt(2 * pi * sqrt(3) / A);
  var wagner4Raw = mollweideBromleyRaw(B * sqrt(3) / pi, B, A / 6);
  function geoWagner4 () {
    return projection(wagner4Raw).scale(176.84);
  }

  function wagner6Raw(lambda, phi) {
    return [lambda * sqrt(1 - 3 * phi * phi / (pi * pi)), phi];
  }
  wagner6Raw.invert = function (x, y) {
    return [x / sqrt(1 - 3 * y * y / (pi * pi)), y];
  };
  function geoWagner6 () {
    return projection(wagner6Raw).scale(152.63);
  }

  function wiechelRaw(lambda, phi) {
    var cosPhi = cos(phi),
      sinPhi = cos(lambda) * cosPhi,
      sin1_Phi = 1 - sinPhi,
      cosLambda = cos(lambda = atan2(sin(lambda) * cosPhi, -sin(phi))),
      sinLambda = sin(lambda);
    cosPhi = sqrt(1 - sinPhi * sinPhi);
    return [sinLambda * cosPhi - cosLambda * sin1_Phi, -cosLambda * cosPhi - sinLambda * sin1_Phi];
  }
  wiechelRaw.invert = function (x, y) {
    var w = (x * x + y * y) / -2,
      k = sqrt(-w * (2 + w)),
      b = y * w + x * k,
      a = x * w - y * k,
      D = sqrt(a * a + b * b);
    return [atan2(k * b, D * (1 + w)), D ? -asin(k * a / D) : 0];
  };
  function geoWiechel () {
    return projection(wiechelRaw).rotate([0, -90, 45]).scale(124.75).clipAngle(180 - 1e-3);
  }

  function winkel3Raw(lambda, phi) {
    var coordinates = aitoffRaw(lambda, phi);
    return [(coordinates[0] + lambda / halfPi) / 2, (coordinates[1] + phi) / 2];
  }
  winkel3Raw.invert = function (x, y) {
    var lambda = x,
      phi = y,
      i = 25;
    do {
      var cosphi = cos(phi),
        sinphi = sin(phi),
        sin_2phi = sin(2 * phi),
        sin2phi = sinphi * sinphi,
        cos2phi = cosphi * cosphi,
        sinlambda = sin(lambda),
        coslambda_2 = cos(lambda / 2),
        sinlambda_2 = sin(lambda / 2),
        sin2lambda_2 = sinlambda_2 * sinlambda_2,
        C = 1 - cos2phi * coslambda_2 * coslambda_2,
        E = C ? acos(cosphi * coslambda_2) * sqrt(F = 1 / C) : F = 0,
        F,
        fx = 0.5 * (2 * E * cosphi * sinlambda_2 + lambda / halfPi) - x,
        fy = 0.5 * (E * sinphi + phi) - y,
        dxdlambda = 0.5 * F * (cos2phi * sin2lambda_2 + E * cosphi * coslambda_2 * sin2phi) + 0.5 / halfPi,
        dxdphi = F * (sinlambda * sin_2phi / 4 - E * sinphi * sinlambda_2),
        dydlambda = 0.125 * F * (sin_2phi * sinlambda_2 - E * sinphi * cos2phi * sinlambda),
        dydphi = 0.5 * F * (sin2phi * coslambda_2 + E * sin2lambda_2 * cosphi) + 0.5,
        denominator = dxdphi * dydlambda - dydphi * dxdlambda,
        dlambda = (fy * dxdphi - fx * dydphi) / denominator,
        dphi = (fx * dydlambda - fy * dxdlambda) / denominator;
      lambda -= dlambda, phi -= dphi;
    } while ((abs(dlambda) > epsilon || abs(dphi) > epsilon) && --i > 0);
    return [lambda, phi];
  };
  function geoWinkel3 () {
    return projection(winkel3Raw).scale(158.837);
  }

  vegaProjection.projection('airy', geoAiry);
  vegaProjection.projection('aitoff', geoAitoff);
  vegaProjection.projection('armadillo', geoArmadillo);
  vegaProjection.projection('august', geoAugust);
  vegaProjection.projection('baker', geoBaker);
  vegaProjection.projection('berghaus', geoBerghaus);
  vegaProjection.projection('bertin1953', geoBertin1953);
  vegaProjection.projection('boggs', geoBoggs);
  vegaProjection.projection('bonne', geoBonne);
  vegaProjection.projection('bottomley', geoBottomley);
  vegaProjection.projection('bromley', geoBromley);
  vegaProjection.projection('chamberlinAfrica', chamberlinAfrica);
  vegaProjection.projection('collignon', geoCollignon);
  vegaProjection.projection('craig', geoCraig);
  vegaProjection.projection('craster', geoCraster);
  vegaProjection.projection('cylindricalEqualArea', geoCylindricalEqualArea);
  vegaProjection.projection('cylindricalStereographic', geoCylindricalStereographic);
  vegaProjection.projection('eckert1', geoEckert1);
  vegaProjection.projection('eckert2', geoEckert2);
  vegaProjection.projection('eckert3', geoEckert3);
  vegaProjection.projection('eckert4', geoEckert4);
  vegaProjection.projection('eckert5', geoEckert5);
  vegaProjection.projection('eckert6', geoEckert6);
  vegaProjection.projection('eisenlohr', geoEisenlohr);
  vegaProjection.projection('fahey', geoFahey);
  vegaProjection.projection('foucaut', geoFoucaut);
  vegaProjection.projection('foucautSinusoidal', geoFoucautSinusoidal);
  vegaProjection.projection('gilbert', geoGilbert);
  vegaProjection.projection('gingery', geoGingery);
  vegaProjection.projection('ginzburg4', geoGinzburg4);
  vegaProjection.projection('ginzburg5', geoGinzburg5);
  vegaProjection.projection('ginzburg6', geoGinzburg6);
  vegaProjection.projection('ginzburg8', geoGinzburg8);
  vegaProjection.projection('ginzburg9', geoGinzburg9);
  vegaProjection.projection('gringorten', geoGringorten);
  vegaProjection.projection('gringortenQuincuncial', geoGringortenQuincuncial);
  vegaProjection.projection('guyou', geoGuyou);
  vegaProjection.projection('hammer', geoHammer);
  vegaProjection.projection('hammerRetroazimuthal', geoHammerRetroazimuthal);
  vegaProjection.projection('healpix', geoHealpix);
  vegaProjection.projection('hill', geoHill);
  vegaProjection.projection('homolosine', geoHomolosine);
  vegaProjection.projection('hufnagel', geoHufnagel);
  vegaProjection.projection('hyperelliptical', geoHyperelliptical);
  vegaProjection.projection('interruptedBoggs', geoInterruptedBoggs);
  vegaProjection.projection('interruptedHomolosine', geoInterruptedHomolosine);
  vegaProjection.projection('interruptedMollweide', geoInterruptedMollweide);
  vegaProjection.projection('interruptedMollweideHemispheres', geoInterruptedMollweideHemispheres);
  vegaProjection.projection('interruptedQuarticAuthalic', geoInterruptedQuarticAuthalic);
  vegaProjection.projection('interruptedSinuMollweide', geoInterruptedSinuMollweide);
  vegaProjection.projection('interruptedSinusoidal', geoInterruptedSinusoidal);
  vegaProjection.projection('kavrayskiy7', geoKavrayskiy7);
  vegaProjection.projection('lagrange', geoLagrange);
  vegaProjection.projection('larrivee', geoLarrivee);
  vegaProjection.projection('laskowski', geoLaskowski);
  vegaProjection.projection('littrow', geoLittrow);
  vegaProjection.projection('loximuthal', geoLoximuthal);
  vegaProjection.projection('miller', geoMiller);
  vegaProjection.projection('modifiedStereographicAlaska', modifiedStereographicAlaska);
  vegaProjection.projection('modifiedStereographicGs48', modifiedStereographicGs48);
  vegaProjection.projection('modifiedStereographicGs50', modifiedStereographicGs50);
  vegaProjection.projection('modifiedStereographicLee', modifiedStereographicLee);
  vegaProjection.projection('modifiedStereographicMiller', modifiedStereographicMiller);
  vegaProjection.projection('mtFlatPolarParabolic', geoMtFlatPolarParabolic);
  vegaProjection.projection('mtFlatPolarQuartic', geoMtFlatPolarQuartic);
  vegaProjection.projection('mtFlatPolarSinusoidal', geoMtFlatPolarSinusoidal);
  vegaProjection.projection('naturalEarth2', geoNaturalEarth2);
  vegaProjection.projection('nellHammer', geoNellHammer);
  vegaProjection.projection('nicolosi', geoNicolosi);
  vegaProjection.projection('patterson', geoPatterson);
  vegaProjection.projection('peirceQuincuncial', geoPeirceQuincuncial);
  vegaProjection.projection('polyconic', geoPolyconic);
  vegaProjection.projection('polyhedralButterfly', geoPolyhedralButterfly);
  vegaProjection.projection('polyhedralCollignon', geoPolyhedralCollignon);
  vegaProjection.projection('polyhedralWaterman', geoPolyhedralWaterman);
  vegaProjection.projection('rectangularPolyconic', geoRectangularPolyconic);
  vegaProjection.projection('robinson', geoRobinson);
  vegaProjection.projection('satellite', geoSatellite);
  vegaProjection.projection('sinuMollweide', geoSinuMollweide);
  vegaProjection.projection('sinusoidal', geoSinusoidal);
  vegaProjection.projection('times', geoTimes);
  vegaProjection.projection('twoPointAzimuthalUsa', twoPointAzimuthalUsa);
  vegaProjection.projection('twoPointEquidistantUsa', twoPointEquidistantUsa);
  vegaProjection.projection('vanDerGrinten', geoVanDerGrinten);
  vegaProjection.projection('vanDerGrinten2', geoVanDerGrinten2);
  vegaProjection.projection('vanDerGrinten3', geoVanDerGrinten3);
  vegaProjection.projection('vanDerGrinten4', geoVanDerGrinten4);
  vegaProjection.projection('wagner', wagner);
  vegaProjection.projection('wagner4', geoWagner4);
  vegaProjection.projection('wagner6', geoWagner6);
  vegaProjection.projection('wagner7', wagner7);
  vegaProjection.projection('wiechel', geoWiechel);
  vegaProjection.projection('winkel3', geoWinkel3);

}));
