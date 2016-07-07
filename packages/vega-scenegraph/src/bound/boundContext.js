var bounds,
    tau = Math.PI * 2,
    halfPi = Math.PI / 2;

export default function context(_) {
  return bounds = _, context;
}

function noop() {}

function add(x, y) { bounds.add(x, y); }

context.beginPath = noop;

context.closePath = noop;

context.moveTo = add;

context.lineTo = add;

context.rect = function(x, y, w, h) {
  bounds.add(x, y);
  bounds.add(x + w, y + h);
};

context.quadraticCurveTo = function(x1, y1, x2, y2) {
  bounds.add(x1, y1);
  bounds.add(x2, y2);
};

context.bezierCurveTo = function(x1, y1, x2, y2, x3, y3) {
  bounds.add(x1, y1);
  bounds.add(x2, y2);
  bounds.add(x3, y3);
};

context.arc = function(cx, cy, r, sa, ea, ccw) {
  if (r === tau) {
    bounds.add(cx - r, cy - r);
    bounds.add(cx + r, cy + r);
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

  update(sa);
  update(ea);
  if (ccw) {
    s = ea - (ea % halfPi)
    for (i=0; i<4 && s>sa; ++i, s-=halfPi) update(s);
  } else {
    s = sa - (sa % halfPi);
    for (i=0; i<4 && s<ea; ++i, s+=halfPi) update(s);
  }

  bounds.add(cx + xmin, cy + ymin);
  bounds.add(cx + xmax, cy + ymax);
};
