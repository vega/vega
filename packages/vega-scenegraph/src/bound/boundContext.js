import {Epsilon, HalfPi, Tau} from '../util/constants';

var bounds, lx, ly,
    circleThreshold = Tau - 1e-8;

export default function context(_) {
  bounds = _;
  return context;
}

function noop() {}

function add(x, y) {
  bounds.add(x, y);
  lx = x;
  ly = y;
}

function addX(x) { bounds.add(x, bounds.y1); }

function addY(y) { bounds.add(bounds.x1, y); }

context.beginPath = noop;

context.closePath = noop;

context.moveTo = add;

context.lineTo = add;

context.rect = function(x, y, w, h) {
  add(x + w, y + h);
  add(x, y);
};

context.quadraticCurveTo = function(x1, y1, x2, y2) {
  quadExtrema(lx, x1, x2, addX);
  quadExtrema(ly, y1, y2, addY);
  add(x2, y2);
};

function quadExtrema(x0, x1, x2, cb) {
  const t = (x0 - x1) / (x0 + x2 - 2 * x1);
  if (0 < t && t < 1) cb(x0 + (x1 - x0) * t);
}

context.bezierCurveTo = function(x1, y1, x2, y2, x3, y3) {
  cubicExtrema(lx, x1, x2, x3, addX);
  cubicExtrema(ly, y1, y2, y3, addY);
  add(x3, y3);
};

function cubicExtrema(x0, x1, x2, x3, cb) {
  const a = x3 - x0 + 3 * x1 - 3 * x2,
        b = x0 + x2 - 2 * x1,
        c = x0 - x1;

  let t0 = 0, t1 = 0, r;

  // solve for parameter t
  if (Math.abs(a) > Epsilon) {
    // quadratic equation
    r = b * b + c * a;
    if (r >= 0) {
      r = Math.sqrt(r);
      t0 = (-b + r) / a;
      t1 = (-b - r) / a;
    }
  } else {
    // linear equation
    t0 = 0.5 * c / b;
  }

  // calculate position
  if (0 < t0 && t0 < 1) cb(cubic(t0, x0, x1, x2, x3));
  if (0 < t1 && t1 < 1) cb(cubic(t1, x0, x1, x2, x3));
}

function cubic(t, x0, x1, x2, x3) {
  const s = 1 - t, s2 = s * s, t2 = t * t;
  return (s2 * s * x0) + (3 * s2 * t * x1) + (3 * s * t2 * x2) + (t2 * t * x3);
}

context.arc = function(cx, cy, r, sa, ea, ccw) {
  var xmin = Infinity, xmax = -Infinity,
      ymin = Infinity, ymax = -Infinity,
      s, i, x, y, ex, ey;

  function update(a) {
    x = r * Math.cos(a);
    y = r * Math.sin(a);
    if (x < xmin) xmin = x;
    if (x > xmax) xmax = x;
    if (y < ymin) ymin = y;
    if (y > ymax) ymax = y;
  }

  // get last point
  update(ea); ex = x; ey = y;

  if (Math.abs(ea - sa) > circleThreshold) {
    // treat as full circle
    add(cx - r, cy - r);
    add(cx + r, cy + r);
  } else {
    // sample end points and interior points aligned with 90 degrees
    update(sa);

    if (ea !== sa) {
      sa = sa % Tau; if (sa < 0) sa += Tau;
      ea = ea % Tau; if (ea < 0) ea += Tau;

      if (ea < sa) {
        ccw = !ccw; // flip direction
        s = sa; sa = ea; ea = s; // swap end-points
      }

      if (ccw) {
        ea -= Tau;
        s = sa - (sa % HalfPi);
        for (i=0; i<4 && s>ea; ++i, s-=HalfPi) update(s);
      } else {
        s = sa - (sa % HalfPi) + HalfPi;
        for (i=0; i<4 && s<ea; ++i, s=s+HalfPi) update(s);
      }
    }

    add(cx + xmin, cy + ymin);
    add(cx + xmax, cy + ymax);
  }

  // set last point
  lx = ex; ly = ey;
};
