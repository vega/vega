import {error} from 'vega-util';

function noop() {}

const cases = [
  [],
  [
    [
      [1.0, 1.5],
      [0.5, 1.0]
    ]
  ],
  [
    [
      [1.5, 1.0],
      [1.0, 1.5]
    ]
  ],
  [
    [
      [1.5, 1.0],
      [0.5, 1.0]
    ]
  ],
  [
    [
      [1.0, 0.5],
      [1.5, 1.0]
    ]
  ],
  [
    [
      [1.0, 1.5],
      [0.5, 1.0]
    ],
    [
      [1.0, 0.5],
      [1.5, 1.0]
    ]
  ],
  [
    [
      [1.0, 0.5],
      [1.0, 1.5]
    ]
  ],
  [
    [
      [1.0, 0.5],
      [0.5, 1.0]
    ]
  ],
  [
    [
      [0.5, 1.0],
      [1.0, 0.5]
    ]
  ],
  [
    [
      [1.0, 1.5],
      [1.0, 0.5]
    ]
  ],
  [
    [
      [0.5, 1.0],
      [1.0, 0.5]
    ],
    [
      [1.5, 1.0],
      [1.0, 1.5]
    ]
  ],
  [
    [
      [1.5, 1.0],
      [1.0, 0.5]
    ]
  ],
  [
    [
      [0.5, 1.0],
      [1.5, 1.0]
    ]
  ],
  [
    [
      [1.0, 1.5],
      [1.5, 1.0]
    ]
  ],
  [
    [
      [0.5, 1.0],
      [1.0, 1.5]
    ]
  ],
  []
];

// Implementation adapted from d3/d3-contour. Thanks!
export default function () {
  let dx = 1;
  let dy = 1;
  let smooth = smoothLinear;

  function contours(values, tz) {
    return tz.map(value => contour(values, value));
  }

  // Accumulate, smooth contour rings, assign holes to exterior rings.
  // Based on https://github.com/mbostock/shapefile/blob/v0.6.2/shp/polygon.js
  function contour(values, value) {
    const polygons = [];
    const holes = [];

    isorings(values, value, function (ring) {
      smooth(ring, values, value);
      if (area(ring) > 0) polygons.push([ring]);
      else holes.push(ring);
    });

    holes.forEach(function (hole) {
      for (let i = 0, polygon; i < polygons.length; ++i) {
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
    const fragmentByStart = [];
    const fragmentByEnd = [];
    let x;
    let y;
    let t0;
    let t1;
    let t2;
    let t3;

    // Special case for the first row (y = -1, t2 = t3 = 0).
    x = y = -1;
    t1 = values[0] >= value;
    cases[t1 << 1].forEach(stitch);
    while (++x < dx - 1) {
      (t0 = t1), (t1 = values[x + 1] >= value);
      cases[t0 | (t1 << 1)].forEach(stitch);
    }
    cases[t1 << 0].forEach(stitch);

    // General case for the intermediate rows.
    while (++y < dy - 1) {
      x = -1;
      t1 = values[y * dx + dx] >= value;
      t2 = values[y * dx] >= value;
      cases[(t1 << 1) | (t2 << 2)].forEach(stitch);
      while (++x < dx - 1) {
        (t0 = t1), (t1 = values[y * dx + dx + x + 1] >= value);
        (t3 = t2), (t2 = values[y * dx + x + 1] >= value);
        cases[t0 | (t1 << 1) | (t2 << 2) | (t3 << 3)].forEach(stitch);
      }
      cases[t1 | (t2 << 3)].forEach(stitch);
    }

    // Special case for the last row (y = dy - 1, t0 = t1 = 0).
    x = -1;
    t2 = values[y * dx] >= value;
    cases[t2 << 2].forEach(stitch);
    while (++x < dx - 1) {
      (t3 = t2), (t2 = values[y * dx + x + 1] >= value);
      cases[(t2 << 2) | (t3 << 3)].forEach(stitch);
    }
    cases[t2 << 3].forEach(stitch);

    function stitch(line) {
      const start = [line[0][0] + x, line[0][1] + y];
      const end = [line[1][0] + x, line[1][1] + y];
      const startIndex = index(start);
      const endIndex = index(end);
      let f;
      let g;
      if ((f = fragmentByEnd[startIndex])) {
        if ((g = fragmentByStart[endIndex])) {
          delete fragmentByEnd[f.end];
          delete fragmentByStart[g.start];
          if (f === g) {
            f.ring.push(end);
            callback(f.ring);
          } else {
            fragmentByStart[f.start] = fragmentByEnd[g.end] = {start: f.start, end: g.end, ring: f.ring.concat(g.ring)};
          }
        } else {
          delete fragmentByEnd[f.end];
          f.ring.push(end);
          fragmentByEnd[(f.end = endIndex)] = f;
        }
      } else if ((f = fragmentByStart[endIndex])) {
        if ((g = fragmentByEnd[startIndex])) {
          delete fragmentByStart[f.start];
          delete fragmentByEnd[g.end];
          if (f === g) {
            f.ring.push(end);
            callback(f.ring);
          } else {
            fragmentByStart[g.start] = fragmentByEnd[f.end] = {start: g.start, end: f.end, ring: g.ring.concat(f.ring)};
          }
        } else {
          delete fragmentByStart[f.start];
          f.ring.unshift(start);
          fragmentByStart[(f.start = startIndex)] = f;
        }
      } else {
        fragmentByStart[startIndex] = fragmentByEnd[endIndex] = {start: startIndex, end: endIndex, ring: [start, end]};
      }
    }
  }

  function index(point) {
    return point[0] * 2 + point[1] * (dx + 1) * 4;
  }

  function smoothLinear(ring, values, value) {
    ring.forEach(function (point) {
      const x = point[0];
      const y = point[1];
      const xt = x | 0;
      const yt = y | 0;
      let v0;
      const v1 = values[yt * dx + xt];
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
    const _0 = Math.ceil(_[0]);
    const _1 = Math.ceil(_[1]);
    if (!(_0 > 0) || !(_1 > 0)) error('invalid size');
    return (dx = _0), (dy = _1), contours;
  };

  contours.smooth = function (_) {
    return arguments.length ? ((smooth = _ ? smoothLinear : noop), contours) : smooth === smoothLinear;
  };

  return contours;
}

function area(ring) {
  let i = 0;
  const n = ring.length;
  let area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  return area;
}

function contains(ring, hole) {
  let i = -1;
  const n = hole.length;
  let c;
  while (++i < n) if ((c = ringContains(ring, hole[i]))) return c;
  return 0;
}

function ringContains(ring, point) {
  const x = point[0];
  const y = point[1];
  let contains = -1;
  for (let i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
    const pi = ring[i];
    const xi = pi[0];
    const yi = pi[1];
    const pj = ring[j];
    const xj = pj[0];
    const yj = pj[1];
    if (segmentContains(pi, pj, point)) return 0;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) contains = -contains;
  }
  return contains;
}

function segmentContains(a, b, c) {
  let i;
  return collinear(a, b, c) && within(a[(i = +(a[0] === b[0]))], c[i], b[i]);
}

function collinear(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) === (c[0] - a[0]) * (b[1] - a[1]);
}

function within(p, q, r) {
  return (p <= q && q <= r) || (r <= q && q <= p);
}
