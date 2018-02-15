var bounds,
    tau = Math.PI * 2,
    halfPi = tau / 4,
    circleThreshold = tau - 1e-8;

export default function context(_) {
  bounds = _;
  return context;
}

function noop() {}

function add(x, y) { bounds.add(x, y); }

context.beginPath = noop;

context.closePath = noop;

context.moveTo = add;

context.lineTo = add;

context.rect = function(x, y, w, h) {
  add(x, y);
  add(x + w, y + h);
};

context.quadraticCurveTo = function(x1, y1, x2, y2) {
  add(x1, y1);
  add(x2, y2);
};

context.bezierCurveTo = function(x1, y1, x2, y2, x3, y3) {
  add(x1, y1);
  add(x2, y2);
  add(x3, y3);
};

context.arc = function(cx, cy, r, sa, ea, ccw) {
  if (Math.abs(ea - sa) > circleThreshold) {
    add(cx - r, cy - r);
    add(cx + r, cy + r);
    return;
  }

  var xmin = Infinity, xmax = -Infinity,
      ymin = Infinity, ymax = -Infinity,
      s, i, x, y;

  function update(a) {
    x = r * Math.cos(a);
    y = r * Math.sin(a);
    if (x < xmin) xmin = x;
    if (x > xmax) xmax = x;
    if (y < ymin) ymin = y;
    if (y > ymax) ymax = y;
  }

  // Sample end points and interior points aligned with 90 degrees
  update(sa);
  update(ea);

  if (ea !== sa) {
    sa = sa % tau; if (sa < 0) sa += tau;
    ea = ea % tau; if (ea < 0) ea += tau;

    if (ea < sa) {
      ccw = !ccw; // flip direction
      s = sa; sa = ea; ea = s; // swap end-points
    }

    if (ccw) {
      ea -= tau;
      s = sa - (sa % halfPi);
      for (i=0; i<4 && s>ea; ++i, s-=halfPi) update(s);
    } else {
      s = sa - (sa % halfPi) + halfPi;
      for (i=0; i<4 && s<ea; ++i, s=s+halfPi) update(s);
    }
  }

  add(cx + xmin, cy + ymin);
  add(cx + xmax, cy + ymax);
};
