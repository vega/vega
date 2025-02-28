import {DegToRad, Epsilon, HalfPi, Tau} from '../util/constants.js';

const circleThreshold = Tau - 1e-8;
let bounds, lx, ly, rot, ma, mb, mc, md;

const add = (x, y) => bounds.add(x, y);
const addL = (x, y) => add(lx = x, ly = y);
const addX = x => add(x, bounds.y1);
const addY = y => add(bounds.x1, y);

const px = (x, y) => ma * x + mc * y;
const py = (x, y) => mb * x + md * y;
const addp = (x, y) => add(px(x, y), py(x, y));
const addpL = (x, y) => addL(px(x, y), py(x, y));

export default function(_, deg) {
  bounds = _;
  if (deg) {
    rot = deg * DegToRad;
    ma = md = Math.cos(rot);
    mb = Math.sin(rot);
    mc = -mb;
  } else {
    ma = md = 1;
    rot = mb = mc = 0;
  }
  return context;
}

const context = {
  beginPath() {},
  closePath() {},

  moveTo: addpL,
  lineTo: addpL,

  rect(x, y, w, h) {
    if (rot) {
      addp(x + w, y);
      addp(x + w, y + h);
      addp(x, y + h);
      addpL(x, y);
    } else {
      add(x + w, y + h);
      addL(x, y);
    }
  },

  quadraticCurveTo(x1, y1, x2, y2) {
    const px1 = px(x1, y1),
          py1 = py(x1, y1),
          px2 = px(x2, y2),
          py2 = py(x2, y2);
    quadExtrema(lx, px1, px2, addX);
    quadExtrema(ly, py1, py2, addY);
    addL(px2, py2);
  },

  bezierCurveTo(x1, y1, x2, y2, x3, y3) {
    const px1 = px(x1, y1),
          py1 = py(x1, y1),
          px2 = px(x2, y2),
          py2 = py(x2, y2),
          px3 = px(x3, y3),
          py3 = py(x3, y3);
    cubicExtrema(lx, px1, px2, px3, addX);
    cubicExtrema(ly, py1, py2, py3, addY);
    addL(px3, py3);
  },

  arc(cx, cy, r, sa, ea, ccw) {
    sa += rot;
    ea += rot;

    // store last point on path
    lx = r * Math.cos(ea) + cx;
    ly = r * Math.sin(ea) + cy;

    if (Math.abs(ea - sa) > circleThreshold) {
      // treat as full circle
      add(cx - r, cy - r);
      add(cx + r, cy + r);
    } else {
      const update = a => add(r * Math.cos(a) + cx, r * Math.sin(a) + cy);
      let s, i;

      // sample end points
      update(sa);
      update(ea);

      // sample interior points aligned with 90 degrees
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
    }
  }
};

function quadExtrema(x0, x1, x2, cb) {
  const t = (x0 - x1) / (x0 + x2 - 2 * x1);
  if (0 < t && t < 1) cb(x0 + (x1 - x0) * t);
}

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
