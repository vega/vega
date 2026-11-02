import {Transform, ingest} from 'vega-dataflow';
import {accessorName, inherits} from 'vega-util';

export default function ConvexHull(params) {
  Transform.call(this, null, params);
}

ConvexHull.Definition = {
  'type': 'ConvexHull',
  'metadata': {'generates': true, 'changes': true},
  'params': [
    { 'name': 'x', 'type': 'field', 'required': true },
    { 'name': 'y', 'type': 'field', 'required': true },
    { 'name': 'groupby', 'type': 'field', 'array': true },
    { 'name': 'offset', 'type': 'number', 'default': 0 },
    { 'name': 'as', 'type': 'string', 'array': true, 'default': ['x', 'y', 'x0', 'y0'] }
  ]
};

inherits(ConvexHull, Transform, {
  transform(_, pulse) {
    const out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);

    if (this.value && !pulse.changed() && !_.modified()) {
      out.source = this.value;
      return out;
    }

    const source = pulse.materialize(pulse.SOURCE).source,
          groupby = _.groupby || [],
          names = groupby.map(accessorName),
          groups = partition(source, groupby, _.x, _.y),
          as = _.as || ['x', 'y', 'x0', 'y0'],
          values = [];

    groups.forEach(group => {
      convexHull(group.points)
        .map(p => offsetPoint(p, _.offset || 0))
        .forEach(p => values.push(ingest(output(group.dims, names, p, as))));
    });

    if (this.value) out.rem = this.value;
    this.value = out.add = out.source = values;

    return out;
  }
});

function partition(data, groupby, x, y) {
  const groups = [],
        map = Object.create(null);

  for (let i=0, n=data.length; i<n; ++i) {
    const t = data[i],
          px = +x(t),
          py = +y(t);

    if (!Number.isFinite(px) || !Number.isFinite(py)) continue;

    const dims = groupby.map(g => g(t)),
          key = dims + '',
          group = map[key] || (map[key] = groups[groups.push({dims, points: []}) - 1]);

    group.points.push({x: px, y: py});
  }

  return groups;
}

function convexHull(points) {
  const sorted = dedupe(points).sort(comparePoints);

  if (sorted.length <= 2) {
    return sorted.map(point);
  }

  const lower = [],
        upper = [];

  for (let i=0, n=sorted.length; i<n; ++i) {
    scan(lower, sorted[i]);
  }

  for (let i=sorted.length - 1; i>=0; --i) {
    scan(upper, sorted[i]);
  }

  lower.pop();
  upper.pop();

  return lower.concat(upper).map(point);
}

function scan(hull, p) {
  while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0) {
    hull.pop();
  }
  hull.push(p);
}

function dedupe(points) {
  const unique = [],
        seen = {};

  for (let i=0, n=points.length; i<n; ++i) {
    const p = points[i],
          key = p.x + '\u0000' + p.y;
    if (!seen[key]) {
      seen[key] = 1;
      unique.push(p);
    }
  }

  return unique;
}

function comparePoints(a, b) {
  return a.x - b.x || a.y - b.y;
}

function cross(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function point(p, i, points) {
  return {x: p.x, y: p.y, x0: p.x, y0: p.y, prev: points[i ? i - 1 : points.length - 1], next: points[(i + 1) % points.length]};
}

function offsetPoint(p, offset) {
  if (!offset || !p.prev || !p.next || p.prev === p.next) {
    return p;
  }

  const e0 = unit(p.prev, p),
        e1 = unit(p, p.next),
        n0 = normal(e0),
        n1 = normal(e1),
        q0 = {x: p.x + offset * n0.x, y: p.y + offset * n0.y},
        q1 = {x: p.x + offset * n1.x, y: p.y + offset * n1.y},
        o = intersect(q0, e0, q1, e1) || fallback(p, n0, n1, offset);

  return {
    x: o.x,
    y: o.y,
    x0: p.x0,
    y0: p.y0
  };
}

function unit(a, b) {
  const dx = b.x - a.x,
        dy = b.y - a.y,
        z = Math.sqrt(dx * dx + dy * dy) || 1;
  return {x: dx / z, y: dy / z};
}

function normal(e) {
  return {x: e.y, y: -e.x};
}

function intersect(p0, e0, p1, e1) {
  const dx = p1.x - p0.x,
        dy = p1.y - p0.y,
        cross = e0.x * e1.y - e0.y * e1.x;

  if (Math.abs(cross) < 1e-12) return null;

  const t = (dx * e1.y - dy * e1.x) / cross;
  return {x: p0.x + t * e0.x, y: p0.y + t * e0.y};
}

function fallback(p, n0, n1, offset) {
  let x = n0.x + n1.x,
      y = n0.y + n1.y,
      z = Math.sqrt(x * x + y * y);

  if (!z) {
    x = n0.x;
    y = n0.y;
    z = 1;
  }

  return {x: p.x + offset * x / z, y: p.y + offset * y / z};
}

function output(dims, names, p, as) {
  const tuple = {};

  for (let i=0, n=names.length; i<n; ++i) {
    tuple[names[i]] = dims[i];
  }

  tuple[as[0]] = p.x;
  tuple[as[1]] = p.y;

  if (as[2] != null) tuple[as[2]] = p.x0;
  if (as[3] != null) tuple[as[3]] = p.y0;

  return tuple;
}
