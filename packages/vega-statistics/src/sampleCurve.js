// subdivide up to accuracy of 0.5 degrees
const MIN_RADIANS = 0.5 * Math.PI / 180;

// Adaptively sample an interpolated function over a domain extent
export default function(f, extent, minSteps, maxSteps) {
  minSteps = minSteps || 25;
  maxSteps = Math.max(minSteps, maxSteps || 200);

  const point = x => [x, f(x)],
        minX = extent[0],
        maxX = extent[1],
        span = maxX - minX,
        stop = span / maxSteps,
        prev = [point(minX)],
        next = [];

  if (minSteps === maxSteps) {
    // no adaptation, sample uniform grid directly and return
    for (let i = 1; i < maxSteps; ++i) {
      prev.push(point(minX + (i / minSteps) * span));
    }
    prev.push(point(maxX));
    return prev;
  } else {
    // sample minimum points on uniform grid
    // then move on to perform adaptive refinement
    next.push(point(maxX));
    for (let i = minSteps; --i > 0;) {
      next.push(point(minX + (i / minSteps) * span));
    }
  }

  let p0 = prev[0];
  let p1 = next[next.length - 1];

  const sx = 1 / span;
  const sy = scaleY(p0[1], next);

  while (p1) {
    // midpoint for potential curve subdivision
    const pm = point((p0[0] + p1[0]) / 2);
    const dx = pm[0] - p0[0] >= stop;

    if (dx && angleDelta(p0, pm, p1, sx, sy) > MIN_RADIANS) {
      // maximum resolution has not yet been met, and
      // subdivision midpoint is sufficiently different from endpoint
      // save subdivision, push midpoint onto the visitation stack
      next.push(pm);
    } else {
      // subdivision midpoint sufficiently similar to endpoint
      // skip subdivision, store endpoint, move to next point on the stack
      p0 = p1;
      prev.push(p1);
      next.pop();
    }
    p1 = next[next.length - 1];
  }

  return prev;
}

function scaleY(init, points) {
  let ymin = init;
  let ymax = init;

  const n = points.length;
  for (let i = 0; i < n; ++i) {
    const y = points[i][1];
    if (y < ymin) ymin = y;
    if (y > ymax) ymax = y;
  }

  return 1 / (ymax - ymin);
}

function angleDelta(p, q, r, sx, sy) {
  const a0 = Math.atan2(sy * (r[1] - p[1]), sx * (r[0] - p[0])),
        a1 = Math.atan2(sy * (q[1] - p[1]), sx * (q[0] - p[0]));
  return Math.abs(a0 - a1);
}
