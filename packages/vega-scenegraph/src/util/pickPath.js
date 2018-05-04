export function pickArea(a, p) {
  var v = a[0].orient === 'horizontal' ? p[1] : p[0],
      z = a[0].orient === 'horizontal' ? 'y' : 'x',
      lo = 0,
      hi = a.length;

  if (hi === 1) return a[0];

  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (a[mid][z] < v) lo = mid + 1;
    else hi = mid;
  }
  lo = Math.max(0, lo - 1);
  hi = Math.min(a.length - 1, hi);

  return (v - a[lo][z]) < (a[hi][z] - v) ? a[lo] : a[hi];
}

export function pickLine(a, p) {
  var t = Math.pow(a[0].strokeWidth || 1, 2),
      i = a.length, dx, dy, dd;

  while (--i >= 0) {
    if (a[i].defined === false) continue;
    dx = a[i].x - p[0];
    dy = a[i].y - p[1];
    dd = dx * dx + dy * dy;
    if (dd < t) return a[i];
  }

  return null;
}

export function pickTrail(a, p) {
  var i = a.length, dx, dy, dd;

  while (--i >= 0) {
    if (a[i].defined === false) continue;
    dx = a[i].x - p[0];
    dy = a[i].y - p[1];
    dd = dx * dx + dy * dy;
    dx = a[i].size || 1;
    if (dd < dx*dx) return a[i];
  }

  return null;
}
