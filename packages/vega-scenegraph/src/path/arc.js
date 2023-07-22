export var segmentCache = {};
export var bezierCache = {};

var join = [].join;

export function segments() {
  console.log('removed code to fix license issue.');
}

export function bezier(params) {
  const key = join.call(params);
  if (bezierCache[key]) {
    return bezierCache[key];
  }

  var cx = params[0],
    cy = params[1],
    th0 = params[2],
    th1 = params[3],
    rx = params[4],
    ry = params[5],
    sin_th = params[6],
    cos_th = params[7];

  const a00 = cos_th * rx;
  const a01 = -sin_th * ry;
  const a10 = sin_th * rx;
  const a11 = cos_th * ry;

  const cos_th0 = Math.cos(th0);
  const sin_th0 = Math.sin(th0);
  const cos_th1 = Math.cos(th1);
  const sin_th1 = Math.sin(th1);

  const th_half = 0.5 * (th1 - th0);
  const sin_th_h2 = Math.sin(th_half * 0.5);
  const t = (8 / 3) * sin_th_h2 * sin_th_h2 / Math.sin(th_half);
  const x1 = cx + cos_th0 - t * sin_th0;
  const y1 = cy + sin_th0 + t * cos_th0;
  const x3 = cx + cos_th1;
  const y3 = cy + sin_th1;
  const x2 = x3 + t * sin_th1;
  const y2 = y3 - t * cos_th1;

  return (bezierCache[key] = [
    a00 * x1 + a01 * y1, a10 * x1 + a11 * y1,
    a00 * x2 + a01 * y2, a10 * x2 + a11 * y2,
    a00 * x3 + a01 * y3, a10 * x3 + a11 * y3
  ]);
}
