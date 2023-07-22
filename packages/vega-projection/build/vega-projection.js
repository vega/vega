(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vega-scale')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vega-scale'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.vega = {}, global.vega));
})(this, (function (exports, vegaScale) { 'use strict';

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

  var epsilon$1 = 1e-6;
  var epsilon2 = 1e-12;
  var pi$1 = Math.PI;
  var halfPi$1 = pi$1 / 2;
  var quarterPi = pi$1 / 4;
  var tau = pi$1 * 2;
  var degrees = 180 / pi$1;
  var radians = pi$1 / 180;
  var abs$1 = Math.abs;
  var atan = Math.atan;
  var atan2 = Math.atan2;
  var cos$1 = Math.cos;
  var exp = Math.exp;
  var log = Math.log;
  var pow = Math.pow;
  var sin$1 = Math.sin;
  var sign = Math.sign || function (x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  };
  var sqrt$1 = Math.sqrt;
  var tan = Math.tan;
  function acos(x) {
    return x > 1 ? 0 : x < -1 ? pi$1 : Math.acos(x);
  }
  function asin$1(x) {
    return x > 1 ? halfPi$1 : x < -1 ? -halfPi$1 : Math.asin(x);
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

  function spherical(cartesian) {
    return [atan2(cartesian[1], cartesian[0]), asin$1(cartesian[2])];
  }
  function cartesian(spherical) {
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
    if (abs$1(lambda) > pi$1) lambda -= Math.round(lambda / tau) * tau;
    return [lambda, phi];
  }
  rotationIdentity.invert = rotationIdentity;
  function rotateRadians(deltaLambda, deltaPhi, deltaGamma) {
    return (deltaLambda %= tau) ? deltaPhi || deltaGamma ? compose(rotationLambda(deltaLambda), rotationPhiGamma(deltaPhi, deltaGamma)) : rotationLambda(deltaLambda) : deltaPhi || deltaGamma ? rotationPhiGamma(deltaPhi, deltaGamma) : rotationIdentity;
  }
  function forwardRotationLambda(deltaLambda) {
    return function (lambda, phi) {
      lambda += deltaLambda;
      if (abs$1(lambda) > pi$1) lambda -= Math.round(lambda / tau) * tau;
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
      return [atan2(y * cosDeltaGamma - k * sinDeltaGamma, x * cosDeltaPhi - z * sinDeltaPhi), asin$1(k * cosDeltaGamma + y * sinDeltaGamma)];
    }
    rotation.invert = function (lambda, phi) {
      var cosPhi = cos$1(phi),
        x = cos$1(lambda) * cosPhi,
        y = sin$1(lambda) * cosPhi,
        z = sin$1(phi),
        k = z * cosDeltaGamma - y * sinDeltaGamma;
      return [atan2(y * cosDeltaGamma + z * sinDeltaGamma, x * cosDeltaPhi + k * sinDeltaPhi), asin$1(k * cosDeltaPhi - x * sinDeltaPhi)];
    };
    return rotation;
  }
  function rotation (rotate) {
    rotate = rotateRadians(rotate[0] * radians, rotate[1] * radians, rotate.length > 2 ? rotate[2] * radians : 0);
    function forward(coordinates) {
      coordinates = rotate(coordinates[0] * radians, coordinates[1] * radians);
      return coordinates[0] *= degrees, coordinates[1] *= degrees, coordinates;
    }
    forward.invert = function (coordinates) {
      coordinates = rotate.invert(coordinates[0] * radians, coordinates[1] * radians);
      return coordinates[0] *= degrees, coordinates[1] *= degrees, coordinates;
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
      t0 = radius + direction * tau;
      t1 = radius - step / 2;
    } else {
      t0 = circleRadius(cosRadius, t0);
      t1 = circleRadius(cosRadius, t1);
      if (direction > 0 ? t0 < t1 : t0 > t1) t0 += direction * tau;
    }
    for (var point, t = t0; direction > 0 ? t > t1 : t < t1; t -= step) {
      point = spherical([cosRadius, -sinRadius * cos$1(t), -sinRadius * sin$1(t)]);
      stream.point(point[0], point[1]);
    }
  }

  // Returns the signed angle of a cartesian point relative to [cosRadius, 0, 0].
  function circleRadius(cosRadius, point) {
    point = cartesian(point), point[0] -= cosRadius;
    cartesianNormalizeInPlace(point);
    var radius = acos(-point[1]);
    return ((-point[2] < 0 ? -radius : radius) + tau - epsilon$1) % tau;
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

  function pointEqual (a, b) {
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
      if (pointEqual(p0, p1)) {
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

  function longitude(point) {
    return abs$1(point[0]) <= pi$1 ? point[0] : sign(point[0]) * ((abs$1(point[0]) + pi$1) % tau - pi$1);
  }
  function polygonContains (polygon, point) {
    var lambda = longitude(point),
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
        lambda0 = longitude(point0),
        phi0 = point0[1] / 2 + quarterPi,
        sinPhi0 = sin$1(phi0),
        cosPhi0 = cos$1(phi0);
      for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
        var point1 = ring[j],
          lambda1 = longitude(point1),
          phi1 = point1[1] / 2 + quarterPi,
          sinPhi1 = sin$1(phi1),
          cosPhi1 = cos$1(phi1),
          delta = lambda1 - lambda0,
          sign = delta >= 0 ? 1 : -1,
          absDelta = sign * delta,
          antimeridian = absDelta > pi$1,
          k = sinPhi0 * sinPhi1;
        sum.add(atan2(k * sign * sin$1(absDelta), cosPhi0 * cosPhi1 + k * cos$1(absDelta)));
        angle += antimeridian ? delta + sign * tau : delta;

        // Are the longitudes either side of the point’s meridian (lambda),
        // and are the latitudes smaller than the parallel (phi)?
        if (antimeridian ^ lambda0 >= lambda ^ lambda1 >= lambda) {
          var arc = cartesianCross(cartesian(point0), cartesian(point1));
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

    return (angle < -epsilon$1 || angle < epsilon$1 && sum < -epsilon2) ^ winding & 1;
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
    return abs$1(sinLambda0Lambda1) > epsilon$1 ? atan((sin$1(phi0) * (cosPhi1 = cos$1(phi1)) * sin$1(lambda1) - sin$1(phi1) * (cosPhi0 = cos$1(phi0)) * sin$1(lambda0)) / (cosPhi0 * cosPhi1 * sinLambda0Lambda1)) : (phi0 + phi1) / 2;
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
      delta = 6 * radians,
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
            if (!point2 || pointEqual(point0, point2) || pointEqual(point1, point2)) point1[2] = 1;
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
          if (v && (!point0 || !pointEqual(point0, point1))) {
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
      var pa = cartesian(a),
        pb = cartesian(b);

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
      q = spherical(q);
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
        return [q, spherical(q1)];
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

  var identity = (x => x);

  var areaSum = new Adder(),
    areaRingSum = new Adder(),
    x00$2,
    y00$2,
    x0$3,
    y0$3;
  var areaStream = {
    point: noop,
    lineStart: noop,
    lineEnd: noop,
    polygonStart: function () {
      areaStream.lineStart = areaRingStart;
      areaStream.lineEnd = areaRingEnd;
    },
    polygonEnd: function () {
      areaStream.lineStart = areaStream.lineEnd = areaStream.point = noop;
      areaSum.add(abs$1(areaRingSum));
      areaRingSum = new Adder();
    },
    result: function () {
      var area = areaSum / 2;
      areaSum = new Adder();
      return area;
    }
  };
  function areaRingStart() {
    areaStream.point = areaPointFirst;
  }
  function areaPointFirst(x, y) {
    areaStream.point = areaPoint;
    x00$2 = x0$3 = x, y00$2 = y0$3 = y;
  }
  function areaPoint(x, y) {
    areaRingSum.add(y0$3 * x - x0$3 * y);
    x0$3 = x, y0$3 = y;
  }
  function areaRingEnd() {
    areaPoint(x00$2, y00$2);
  }
  var pathArea = areaStream;

  var x0$2 = Infinity,
    y0$2 = x0$2,
    x1 = -x0$2,
    y1 = x1;
  var boundsStream = {
    point: boundsPoint,
    lineStart: noop,
    lineEnd: noop,
    polygonStart: noop,
    polygonEnd: noop,
    result: function () {
      var bounds = [[x0$2, y0$2], [x1, y1]];
      x1 = y1 = -(y0$2 = x0$2 = Infinity);
      return bounds;
    }
  };
  function boundsPoint(x, y) {
    if (x < x0$2) x0$2 = x;
    if (x > x1) x1 = x;
    if (y < y0$2) y0$2 = y;
    if (y > y1) y1 = y;
  }
  var boundsStream$1 = boundsStream;

  // TODO Enforce positive area for exterior, negative area for interior?

  var X0 = 0,
    Y0 = 0,
    Z0 = 0,
    X1 = 0,
    Y1 = 0,
    Z1 = 0,
    X2 = 0,
    Y2 = 0,
    Z2 = 0,
    x00$1,
    y00$1,
    x0$1,
    y0$1;
  var centroidStream = {
    point: centroidPoint,
    lineStart: centroidLineStart,
    lineEnd: centroidLineEnd,
    polygonStart: function () {
      centroidStream.lineStart = centroidRingStart;
      centroidStream.lineEnd = centroidRingEnd;
    },
    polygonEnd: function () {
      centroidStream.point = centroidPoint;
      centroidStream.lineStart = centroidLineStart;
      centroidStream.lineEnd = centroidLineEnd;
    },
    result: function () {
      var centroid = Z2 ? [X2 / Z2, Y2 / Z2] : Z1 ? [X1 / Z1, Y1 / Z1] : Z0 ? [X0 / Z0, Y0 / Z0] : [NaN, NaN];
      X0 = Y0 = Z0 = X1 = Y1 = Z1 = X2 = Y2 = Z2 = 0;
      return centroid;
    }
  };
  function centroidPoint(x, y) {
    X0 += x;
    Y0 += y;
    ++Z0;
  }
  function centroidLineStart() {
    centroidStream.point = centroidPointFirstLine;
  }
  function centroidPointFirstLine(x, y) {
    centroidStream.point = centroidPointLine;
    centroidPoint(x0$1 = x, y0$1 = y);
  }
  function centroidPointLine(x, y) {
    var dx = x - x0$1,
      dy = y - y0$1,
      z = sqrt$1(dx * dx + dy * dy);
    X1 += z * (x0$1 + x) / 2;
    Y1 += z * (y0$1 + y) / 2;
    Z1 += z;
    centroidPoint(x0$1 = x, y0$1 = y);
  }
  function centroidLineEnd() {
    centroidStream.point = centroidPoint;
  }
  function centroidRingStart() {
    centroidStream.point = centroidPointFirstRing;
  }
  function centroidRingEnd() {
    centroidPointRing(x00$1, y00$1);
  }
  function centroidPointFirstRing(x, y) {
    centroidStream.point = centroidPointRing;
    centroidPoint(x00$1 = x0$1 = x, y00$1 = y0$1 = y);
  }
  function centroidPointRing(x, y) {
    var dx = x - x0$1,
      dy = y - y0$1,
      z = sqrt$1(dx * dx + dy * dy);
    X1 += z * (x0$1 + x) / 2;
    Y1 += z * (y0$1 + y) / 2;
    Z1 += z;
    z = y0$1 * x - x0$1 * y;
    X2 += z * (x0$1 + x);
    Y2 += z * (y0$1 + y);
    Z2 += z * 3;
    centroidPoint(x0$1 = x, y0$1 = y);
  }
  var pathCentroid = centroidStream;

  function PathContext(context) {
    this._context = context;
  }
  PathContext.prototype = {
    _radius: 4.5,
    pointRadius: function (_) {
      return this._radius = _, this;
    },
    polygonStart: function () {
      this._line = 0;
    },
    polygonEnd: function () {
      this._line = NaN;
    },
    lineStart: function () {
      this._point = 0;
    },
    lineEnd: function () {
      if (this._line === 0) this._context.closePath();
      this._point = NaN;
    },
    point: function (x, y) {
      switch (this._point) {
        case 0:
          {
            this._context.moveTo(x, y);
            this._point = 1;
            break;
          }
        case 1:
          {
            this._context.lineTo(x, y);
            break;
          }
        default:
          {
            this._context.moveTo(x + this._radius, y);
            this._context.arc(x, y, this._radius, 0, tau);
            break;
          }
      }
    },
    result: noop
  };

  var lengthSum = new Adder(),
    lengthRing,
    x00,
    y00,
    x0,
    y0;
  var lengthStream = {
    point: noop,
    lineStart: function () {
      lengthStream.point = lengthPointFirst;
    },
    lineEnd: function () {
      if (lengthRing) lengthPoint(x00, y00);
      lengthStream.point = noop;
    },
    polygonStart: function () {
      lengthRing = true;
    },
    polygonEnd: function () {
      lengthRing = null;
    },
    result: function () {
      var length = +lengthSum;
      lengthSum = new Adder();
      return length;
    }
  };
  function lengthPointFirst(x, y) {
    lengthStream.point = lengthPoint;
    x00 = x0 = x, y00 = y0 = y;
  }
  function lengthPoint(x, y) {
    x0 -= x, y0 -= y;
    lengthSum.add(sqrt$1(x0 * x0 + y0 * y0));
    x0 = x, y0 = y;
  }
  var pathMeasure = lengthStream;

  // Simple caching for constant-radius points.
  let cacheDigits, cacheAppend, cacheRadius, cacheCircle;
  class PathString {
    constructor(digits) {
      this._append = digits == null ? append : appendRound(digits);
      this._radius = 4.5;
      this._ = "";
    }
    pointRadius(_) {
      this._radius = +_;
      return this;
    }
    polygonStart() {
      this._line = 0;
    }
    polygonEnd() {
      this._line = NaN;
    }
    lineStart() {
      this._point = 0;
    }
    lineEnd() {
      if (this._line === 0) this._ += "Z";
      this._point = NaN;
    }
    point(x, y) {
      switch (this._point) {
        case 0:
          {
            this._append`M${x},${y}`;
            this._point = 1;
            break;
          }
        case 1:
          {
            this._append`L${x},${y}`;
            break;
          }
        default:
          {
            this._append`M${x},${y}`;
            if (this._radius !== cacheRadius || this._append !== cacheAppend) {
              const r = this._radius;
              const s = this._;
              this._ = ""; // stash the old string so we can cache the circle path fragment
              this._append`m0,${r}a${r},${r} 0 1,1 0,${-2 * r}a${r},${r} 0 1,1 0,${2 * r}z`;
              cacheRadius = r;
              cacheAppend = this._append;
              cacheCircle = this._;
              this._ = s;
            }
            this._ += cacheCircle;
            break;
          }
      }
    }
    result() {
      const result = this._;
      this._ = "";
      return result.length ? result : null;
    }
  }
  function append(strings) {
    let i = 1;
    this._ += strings[0];
    for (const j = strings.length; i < j; ++i) {
      this._ += arguments[i] + strings[i];
    }
  }
  function appendRound(digits) {
    const d = Math.floor(digits);
    if (!(d >= 0)) throw new RangeError(`invalid digits: ${digits}`);
    if (d > 15) return append;
    if (d !== cacheDigits) {
      const k = 10 ** d;
      cacheDigits = d;
      cacheAppend = function append(strings) {
        let i = 1;
        this._ += strings[0];
        for (const j = strings.length; i < j; ++i) {
          this._ += Math.round(arguments[i] * k) / k + strings[i];
        }
      };
    }
    return cacheAppend;
  }

  function geoPath (projection, context) {
    let digits = 3,
      pointRadius = 4.5,
      projectionStream,
      contextStream;
    function path(object) {
      if (object) {
        if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
        geoStream(object, projectionStream(contextStream));
      }
      return contextStream.result();
    }
    path.area = function (object) {
      geoStream(object, projectionStream(pathArea));
      return pathArea.result();
    };
    path.measure = function (object) {
      geoStream(object, projectionStream(pathMeasure));
      return pathMeasure.result();
    };
    path.bounds = function (object) {
      geoStream(object, projectionStream(boundsStream$1));
      return boundsStream$1.result();
    };
    path.centroid = function (object) {
      geoStream(object, projectionStream(pathCentroid));
      return pathCentroid.result();
    };
    path.projection = function (_) {
      if (!arguments.length) return projection;
      projectionStream = _ == null ? (projection = null, identity) : (projection = _).stream;
      return path;
    };
    path.context = function (_) {
      if (!arguments.length) return context;
      contextStream = _ == null ? (context = null, new PathString(digits)) : new PathContext(context = _);
      if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
      return path;
    };
    path.pointRadius = function (_) {
      if (!arguments.length) return pointRadius;
      pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
      return path;
    };
    path.digits = function (_) {
      if (!arguments.length) return digits;
      if (_ == null) digits = null;else {
        const d = Math.floor(_);
        if (!(d >= 0)) throw new RangeError(`invalid digits: ${_}`);
        digits = d;
      }
      if (context === null) contextStream = new PathString(digits);
      return path;
    };
    return path.projection(projection).digits(digits).context(context);
  }

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
    cosMinDistance = cos$1(30 * radians); // cos(minimum angular distance)

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
          lambda2 = abs$1(abs$1(c) - 1) < epsilon$1 || abs$1(lambda0 - lambda1) < epsilon$1 ? (lambda0 + lambda1) / 2 : atan2(b, a),
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
        var c = cartesian([lambda, phi]),
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
      this.stream.point(x * radians, y * radians);
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
  function projection$1(project) {
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
      return projectRotateTransform(point[0] * radians, point[1] * radians);
    }
    function invert(point) {
      point = projectRotateTransform.invert(point[0], point[1]);
      return point && [point[0] * degrees, point[1] * degrees];
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
      return arguments.length ? (preclip = +_ ? clipCircle(theta = _ * radians) : (theta = null, clipAntimeridian), reset()) : theta * degrees;
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
      return arguments.length ? (lambda = _[0] % 360 * radians, phi = _[1] % 360 * radians, recenter()) : [lambda * degrees, phi * degrees];
    };
    projection.rotate = function (_) {
      return arguments.length ? (deltaLambda = _[0] % 360 * radians, deltaPhi = _[1] % 360 * radians, deltaGamma = _.length > 2 ? _[2] % 360 * radians : 0, recenter()) : [deltaLambda * degrees, deltaPhi * degrees, deltaGamma * degrees];
    };
    projection.angle = function (_) {
      return arguments.length ? (alpha = _ % 360 * radians, recenter()) : alpha * degrees;
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

  function conicProjection(projectAt) {
    var phi0 = 0,
      phi1 = pi$1 / 3,
      m = projectionMutator(projectAt),
      p = m(phi0, phi1);
    p.parallels = function (_) {
      return arguments.length ? m(phi0 = _[0] * radians, phi1 = _[1] * radians) : [phi0 * degrees, phi1 * degrees];
    };
    return p;
  }

  function cylindricalEqualAreaRaw(phi0) {
    var cosPhi0 = cos$1(phi0);
    function forward(lambda, phi) {
      return [lambda * cosPhi0, sin$1(phi) / cosPhi0];
    }
    forward.invert = function (x, y) {
      return [x / cosPhi0, asin$1(y * cosPhi0)];
    };
    return forward;
  }

  function conicEqualAreaRaw(y0, y1) {
    var sy0 = sin$1(y0),
      n = (sy0 + sin$1(y1)) / 2;

    // Are the parallels symmetrical around the Equator?
    if (abs$1(n) < epsilon$1) return cylindricalEqualAreaRaw(y0);
    var c = 1 + sy0 * (2 * n - sy0),
      r0 = sqrt$1(c) / n;
    function project(x, y) {
      var r = sqrt$1(c - 2 * n * sin$1(y)) / n;
      return [r * sin$1(x *= n), r0 - r * cos$1(x)];
    }
    project.invert = function (x, y) {
      var r0y = r0 - y,
        l = atan2(x, abs$1(r0y)) * sign(r0y);
      if (r0y * n < 0) l -= pi$1 * sign(x) * sign(r0y);
      return [l / n, asin$1((c - (x * x + r0y * r0y) * n * n) / (2 * n))];
    };
    return project;
  }
  function geoConicEqualArea () {
    return conicProjection(conicEqualAreaRaw).scale(155.424).center([0, 33.6442]);
  }

  function geoAlbers () {
    return geoConicEqualArea().parallels([29.5, 45.5]).scale(1070).translate([480, 250]).rotate([96, 0]).center([-0.6, 38.7]);
  }

  // The projections must have mutually exclusive clip regions on the sphere,
  // as this will avoid emitting interleaving lines and polygons.
  function multiplex(streams) {
    var n = streams.length;
    return {
      point: function (x, y) {
        var i = -1;
        while (++i < n) streams[i].point(x, y);
      },
      sphere: function () {
        var i = -1;
        while (++i < n) streams[i].sphere();
      },
      lineStart: function () {
        var i = -1;
        while (++i < n) streams[i].lineStart();
      },
      lineEnd: function () {
        var i = -1;
        while (++i < n) streams[i].lineEnd();
      },
      polygonStart: function () {
        var i = -1;
        while (++i < n) streams[i].polygonStart();
      },
      polygonEnd: function () {
        var i = -1;
        while (++i < n) streams[i].polygonEnd();
      }
    };
  }

  // A composite projection for the United States, configured by default for
  // 960×500. The projection also works quite well at 960×600 if you change the
  // scale to 1285 and adjust the translate accordingly. The set of standard
  // parallels for each region comes from USGS, which is published here:
  // http://egsc.usgs.gov/isb/pubs/MapProjections/projections.html#albers
  function geoAlbersUsa () {
    var cache,
      cacheStream,
      lower48 = geoAlbers(),
      lower48Point,
      alaska = geoConicEqualArea().rotate([154, 0]).center([-2, 58.5]).parallels([55, 65]),
      alaskaPoint,
      // EPSG:3338
      hawaii = geoConicEqualArea().rotate([157, 0]).center([-3, 19.9]).parallels([8, 18]),
      hawaiiPoint,
      // ESRI:102007
      point,
      pointStream = {
        point: function (x, y) {
          point = [x, y];
        }
      };
    function albersUsa(coordinates) {
      var x = coordinates[0],
        y = coordinates[1];
      return point = null, (lower48Point.point(x, y), point) || (alaskaPoint.point(x, y), point) || (hawaiiPoint.point(x, y), point);
    }
    albersUsa.invert = function (coordinates) {
      var k = lower48.scale(),
        t = lower48.translate(),
        x = (coordinates[0] - t[0]) / k,
        y = (coordinates[1] - t[1]) / k;
      return (y >= 0.120 && y < 0.234 && x >= -0.425 && x < -0.214 ? alaska : y >= 0.166 && y < 0.234 && x >= -0.214 && x < -0.115 ? hawaii : lower48).invert(coordinates);
    };
    albersUsa.stream = function (stream) {
      return cache && cacheStream === stream ? cache : cache = multiplex([lower48.stream(cacheStream = stream), alaska.stream(stream), hawaii.stream(stream)]);
    };
    albersUsa.precision = function (_) {
      if (!arguments.length) return lower48.precision();
      lower48.precision(_), alaska.precision(_), hawaii.precision(_);
      return reset();
    };
    albersUsa.scale = function (_) {
      if (!arguments.length) return lower48.scale();
      lower48.scale(_), alaska.scale(_ * 0.35), hawaii.scale(_);
      return albersUsa.translate(lower48.translate());
    };
    albersUsa.translate = function (_) {
      if (!arguments.length) return lower48.translate();
      var k = lower48.scale(),
        x = +_[0],
        y = +_[1];
      lower48Point = lower48.translate(_).clipExtent([[x - 0.455 * k, y - 0.238 * k], [x + 0.455 * k, y + 0.238 * k]]).stream(pointStream);
      alaskaPoint = alaska.translate([x - 0.307 * k, y + 0.201 * k]).clipExtent([[x - 0.425 * k + epsilon$1, y + 0.120 * k + epsilon$1], [x - 0.214 * k - epsilon$1, y + 0.234 * k - epsilon$1]]).stream(pointStream);
      hawaiiPoint = hawaii.translate([x - 0.205 * k, y + 0.212 * k]).clipExtent([[x - 0.214 * k + epsilon$1, y + 0.166 * k + epsilon$1], [x - 0.115 * k - epsilon$1, y + 0.234 * k - epsilon$1]]).stream(pointStream);
      return reset();
    };
    albersUsa.fitExtent = function (extent, object) {
      return fitExtent(albersUsa, extent, object);
    };
    albersUsa.fitSize = function (size, object) {
      return fitSize(albersUsa, size, object);
    };
    albersUsa.fitWidth = function (width, object) {
      return fitWidth(albersUsa, width, object);
    };
    albersUsa.fitHeight = function (height, object) {
      return fitHeight(albersUsa, height, object);
    };
    function reset() {
      cache = cacheStream = null;
      return albersUsa;
    }
    return albersUsa.scale(1070);
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
      return [atan2(x * sc, z * cc), asin$1(z && y * sc / z)];
    };
  }

  var azimuthalEqualAreaRaw = azimuthalRaw(function (cxcy) {
    return sqrt$1(2 / (1 + cxcy));
  });
  azimuthalEqualAreaRaw.invert = azimuthalInvert(function (z) {
    return 2 * asin$1(z / 2);
  });
  function geoAzimuthalEqualArea () {
    return projection$1(azimuthalEqualAreaRaw).scale(124.75).clipAngle(180 - 1e-3);
  }

  var azimuthalEquidistantRaw = azimuthalRaw(function (c) {
    return (c = acos(c)) && c / sin$1(c);
  });
  azimuthalEquidistantRaw.invert = azimuthalInvert(function (z) {
    return z;
  });
  function geoAzimuthalEquidistant () {
    return projection$1(azimuthalEquidistantRaw).scale(79.4188).clipAngle(180 - 1e-3);
  }

  function mercatorRaw(lambda, phi) {
    return [lambda, log(tan((halfPi$1 + phi) / 2))];
  }
  mercatorRaw.invert = function (x, y) {
    return [x, 2 * atan(exp(y)) - halfPi$1];
  };
  function geoMercator () {
    return mercatorProjection(mercatorRaw).scale(961 / tau);
  }
  function mercatorProjection(project) {
    var m = projection$1(project),
      center = m.center,
      scale = m.scale,
      translate = m.translate,
      clipExtent = m.clipExtent,
      x0 = null,
      y0,
      x1,
      y1; // clip extent

    m.scale = function (_) {
      return arguments.length ? (scale(_), reclip()) : scale();
    };
    m.translate = function (_) {
      return arguments.length ? (translate(_), reclip()) : translate();
    };
    m.center = function (_) {
      return arguments.length ? (center(_), reclip()) : center();
    };
    m.clipExtent = function (_) {
      return arguments.length ? (_ == null ? x0 = y0 = x1 = y1 = null : (x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reclip()) : x0 == null ? null : [[x0, y0], [x1, y1]];
    };
    function reclip() {
      var k = pi$1 * scale(),
        t = m(rotation(m.rotate()).invert([0, 0]));
      return clipExtent(x0 == null ? [[t[0] - k, t[1] - k], [t[0] + k, t[1] + k]] : project === mercatorRaw ? [[Math.max(t[0] - k, x0), y0], [Math.min(t[0] + k, x1), y1]] : [[x0, Math.max(t[1] - k, y0)], [x1, Math.min(t[1] + k, y1)]]);
    }
    return reclip();
  }

  function tany(y) {
    return tan((halfPi$1 + y) / 2);
  }
  function conicConformalRaw(y0, y1) {
    var cy0 = cos$1(y0),
      n = y0 === y1 ? sin$1(y0) : log(cy0 / cos$1(y1)) / log(tany(y1) / tany(y0)),
      f = cy0 * pow(tany(y0), n) / n;
    if (!n) return mercatorRaw;
    function project(x, y) {
      if (f > 0) {
        if (y < -halfPi$1 + epsilon$1) y = -halfPi$1 + epsilon$1;
      } else {
        if (y > halfPi$1 - epsilon$1) y = halfPi$1 - epsilon$1;
      }
      var r = f / pow(tany(y), n);
      return [r * sin$1(n * x), f - r * cos$1(n * x)];
    }
    project.invert = function (x, y) {
      var fy = f - y,
        r = sign(n) * sqrt$1(x * x + fy * fy),
        l = atan2(x, abs$1(fy)) * sign(fy);
      if (fy * n < 0) l -= pi$1 * sign(x) * sign(fy);
      return [l / n, 2 * atan(pow(f / r, 1 / n)) - halfPi$1];
    };
    return project;
  }
  function geoConicConformal () {
    return conicProjection(conicConformalRaw).scale(109.5).parallels([30, 30]);
  }

  function equirectangularRaw(lambda, phi) {
    return [lambda, phi];
  }
  equirectangularRaw.invert = equirectangularRaw;
  function geoEquirectangular () {
    return projection$1(equirectangularRaw).scale(152.63);
  }

  function conicEquidistantRaw(y0, y1) {
    var cy0 = cos$1(y0),
      n = y0 === y1 ? sin$1(y0) : (cy0 - cos$1(y1)) / (y1 - y0),
      g = cy0 / n + y0;
    if (abs$1(n) < epsilon$1) return equirectangularRaw;
    function project(x, y) {
      var gy = g - y,
        nx = n * x;
      return [gy * sin$1(nx), g - gy * cos$1(nx)];
    }
    project.invert = function (x, y) {
      var gy = g - y,
        l = atan2(x, abs$1(gy)) * sign(gy);
      if (gy * n < 0) l -= pi$1 * sign(x) * sign(gy);
      return [l / n, g - sign(n) * sqrt$1(x * x + gy * gy)];
    };
    return project;
  }
  function geoConicEquidistant () {
    return conicProjection(conicEquidistantRaw).scale(131.154).center([0, 13.9389]);
  }

  var A1 = 1.340264,
    A2 = -0.081106,
    A3 = 0.000893,
    A4 = 0.003796,
    M = sqrt$1(3) / 2,
    iterations = 12;
  function equalEarthRaw(lambda, phi) {
    var l = asin$1(M * sin$1(phi)),
      l2 = l * l,
      l6 = l2 * l2 * l2;
    return [lambda * cos$1(l) / (M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2))), l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2))];
  }
  equalEarthRaw.invert = function (x, y) {
    var l = y,
      l2 = l * l,
      l6 = l2 * l2 * l2;
    for (var i = 0, delta, fy, fpy; i < iterations; ++i) {
      fy = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2)) - y;
      fpy = A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2);
      l -= delta = fy / fpy, l2 = l * l, l6 = l2 * l2 * l2;
      if (abs$1(delta) < epsilon2) break;
    }
    return [M * x * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)) / cos$1(l), asin$1(sin$1(l) / M)];
  };
  function geoEqualEarth () {
    return projection$1(equalEarthRaw).scale(177.158);
  }

  function gnomonicRaw(x, y) {
    var cy = cos$1(y),
      k = cos$1(x) * cy;
    return [cy * sin$1(x) / k, sin$1(y) / k];
  }
  gnomonicRaw.invert = azimuthalInvert(atan);
  function geoGnomonic () {
    return projection$1(gnomonicRaw).scale(144.049).clipAngle(60);
  }

  function geoIdentity () {
    var k = 1,
      tx = 0,
      ty = 0,
      sx = 1,
      sy = 1,
      // scale, translate and reflect
      alpha = 0,
      ca,
      sa,
      // angle
      x0 = null,
      y0,
      x1,
      y1,
      // clip extent
      kx = 1,
      ky = 1,
      transform = transformer({
        point: function (x, y) {
          var p = projection([x, y]);
          this.stream.point(p[0], p[1]);
        }
      }),
      postclip = identity,
      cache,
      cacheStream;
    function reset() {
      kx = k * sx;
      ky = k * sy;
      cache = cacheStream = null;
      return projection;
    }
    function projection(p) {
      var x = p[0] * kx,
        y = p[1] * ky;
      if (alpha) {
        var t = y * ca - x * sa;
        x = x * ca + y * sa;
        y = t;
      }
      return [x + tx, y + ty];
    }
    projection.invert = function (p) {
      var x = p[0] - tx,
        y = p[1] - ty;
      if (alpha) {
        var t = y * ca + x * sa;
        x = x * ca - y * sa;
        y = t;
      }
      return [x / kx, y / ky];
    };
    projection.stream = function (stream) {
      return cache && cacheStream === stream ? cache : cache = transform(postclip(cacheStream = stream));
    };
    projection.postclip = function (_) {
      return arguments.length ? (postclip = _, x0 = y0 = x1 = y1 = null, reset()) : postclip;
    };
    projection.clipExtent = function (_) {
      return arguments.length ? (postclip = _ == null ? (x0 = y0 = x1 = y1 = null, identity) : clipRectangle(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reset()) : x0 == null ? null : [[x0, y0], [x1, y1]];
    };
    projection.scale = function (_) {
      return arguments.length ? (k = +_, reset()) : k;
    };
    projection.translate = function (_) {
      return arguments.length ? (tx = +_[0], ty = +_[1], reset()) : [tx, ty];
    };
    projection.angle = function (_) {
      return arguments.length ? (alpha = _ % 360 * radians, sa = sin$1(alpha), ca = cos$1(alpha), reset()) : alpha * degrees;
    };
    projection.reflectX = function (_) {
      return arguments.length ? (sx = _ ? -1 : 1, reset()) : sx < 0;
    };
    projection.reflectY = function (_) {
      return arguments.length ? (sy = _ ? -1 : 1, reset()) : sy < 0;
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
    return projection;
  }

  function naturalEarth1Raw(lambda, phi) {
    var phi2 = phi * phi,
      phi4 = phi2 * phi2;
    return [lambda * (0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4))), phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4)))];
  }
  naturalEarth1Raw.invert = function (x, y) {
    var phi = y,
      i = 25,
      delta;
    do {
      var phi2 = phi * phi,
        phi4 = phi2 * phi2;
      phi -= delta = (phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))) - y) / (1.007226 + phi2 * (0.015085 * 3 + phi4 * (-0.044475 * 7 + 0.028874 * 9 * phi2 - 0.005916 * 11 * phi4)));
    } while (abs$1(delta) > epsilon$1 && --i > 0);
    return [x / (0.8707 + (phi2 = phi * phi) * (-0.131979 + phi2 * (-0.013791 + phi2 * phi2 * phi2 * (0.003971 - 0.001529 * phi2)))), phi];
  };
  function geoNaturalEarth1 () {
    return projection$1(naturalEarth1Raw).scale(175.295);
  }

  function orthographicRaw(x, y) {
    return [cos$1(y) * sin$1(x), sin$1(y)];
  }
  orthographicRaw.invert = azimuthalInvert(asin$1);
  function geoOrthographic () {
    return projection$1(orthographicRaw).scale(249.5).clipAngle(90 + epsilon$1);
  }

  function stereographicRaw(x, y) {
    var cy = cos$1(y),
      k = 1 + cos$1(x) * cy;
    return [cy * sin$1(x) / k, sin$1(y) / k];
  }
  stereographicRaw.invert = azimuthalInvert(function (z) {
    return 2 * atan(z);
  });
  function geoStereographic () {
    return projection$1(stereographicRaw).scale(250).clipAngle(142);
  }

  function transverseMercatorRaw(lambda, phi) {
    return [log(tan((halfPi$1 + phi) / 2)), -lambda];
  }
  transverseMercatorRaw.invert = function (x, y) {
    return [-y, 2 * atan(exp(x)) - halfPi$1];
  };
  function geoTransverseMercator () {
    var m = mercatorProjection(transverseMercatorRaw),
      center = m.center,
      rotate = m.rotate;
    m.center = function (_) {
      return arguments.length ? center([-_[1], _[0]]) : (_ = center(), [_[1], -_[0]]);
    };
    m.rotate = function (_) {
      return arguments.length ? rotate([_[0], _[1], _.length > 2 ? _[2] + 90 : 90]) : (_ = rotate(), [_[0], _[1], _[2] - 90]);
    };
    return rotate([0, 0, 90]).scale(159.155);
  }

  var abs = Math.abs;
  var cos = Math.cos;
  var sin = Math.sin;
  var epsilon = 1e-6;
  var pi = Math.PI;
  var halfPi = pi / 2;
  var sqrt2 = sqrt(2);
  function asin(x) {
    return x > 1 ? halfPi : x < -1 ? -halfPi : Math.asin(x);
  }
  function sqrt(x) {
    return x > 0 ? Math.sqrt(x) : 0;
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
  function geoMollweide () {
    return projection$1(mollweideRaw).scale(169.529);
  }

  const defaultPath = geoPath();
  const projectionProperties = [
  // standard properties in d3-geo
  'clipAngle', 'clipExtent', 'scale', 'translate', 'center', 'rotate', 'parallels', 'precision', 'reflectX', 'reflectY',
  // extended properties in d3-geo-projections
  'coefficient', 'distance', 'fraction', 'lobes', 'parallel', 'radius', 'ratio', 'spacing', 'tilt'];

  /**
   * Augment projections with their type and a copy method.
   */
  function create(type, constructor) {
    return function projection() {
      const p = constructor();
      p.type = type;
      p.path = geoPath().projection(p);
      p.copy = p.copy || function () {
        const c = projection();
        projectionProperties.forEach(prop => {
          if (p[prop]) c[prop](p[prop]());
        });
        c.path.pointRadius(p.path.pointRadius());
        return c;
      };
      return vegaScale.registerScale(p);
    };
  }
  function projection(type, proj) {
    if (!type || typeof type !== 'string') {
      throw new Error('Projection type must be a name string.');
    }
    type = type.toLowerCase();
    if (arguments.length > 1) {
      projections[type] = create(type, proj);
      return this;
    } else {
      return projections[type] || null;
    }
  }
  function getProjectionPath(proj) {
    return proj && proj.path || defaultPath;
  }
  const projections = {
    // base d3-geo projection types
    albers: geoAlbers,
    albersusa: geoAlbersUsa,
    azimuthalequalarea: geoAzimuthalEqualArea,
    azimuthalequidistant: geoAzimuthalEquidistant,
    conicconformal: geoConicConformal,
    conicequalarea: geoConicEqualArea,
    conicequidistant: geoConicEquidistant,
    equalEarth: geoEqualEarth,
    equirectangular: geoEquirectangular,
    gnomonic: geoGnomonic,
    identity: geoIdentity,
    mercator: geoMercator,
    mollweide: geoMollweide,
    naturalEarth1: geoNaturalEarth1,
    orthographic: geoOrthographic,
    stereographic: geoStereographic,
    transversemercator: geoTransverseMercator
  };
  for (const key in projections) {
    projection(key, projections[key]);
  }

  exports.getProjectionPath = getProjectionPath;
  exports.projection = projection;
  exports.projectionProperties = projectionProperties;

}));
