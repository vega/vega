// Builds a path at (x, y), rotated by an angle in radians, by moving its
// points instead of the canvas matrix. Moving the matrix to an item and back
// does not always cancel where the canvas keeps its matrix in float32, and
// the error adds up over many items (#4409).
// Covers the path methods that the mark shape generators use.

let context, dx, dy, rot, cos, sin;

const px = (x, y) => cos * x - sin * y + dx,
      py = (x, y) => sin * x + cos * y + dy;

const placed = {
  beginPath() {
    context.beginPath();
  },
  closePath() {
    context.closePath();
  },
  moveTo(x, y) {
    context.moveTo(px(x, y), py(x, y));
  },
  lineTo(x, y) {
    context.lineTo(px(x, y), py(x, y));
  },
  rect(x, y, w, h) {
    if (rot) {
      // as rect() does it: a closed subpath, then a new one at its start
      placed.moveTo(x, y);
      placed.lineTo(x + w, y);
      placed.lineTo(x + w, y + h);
      placed.lineTo(x, y + h);
      context.closePath();
      placed.moveTo(x, y);
    } else {
      context.rect(x + dx, y + dy, w, h);
    }
  },
  arc(x, y, r, a0, a1, ccw) {
    context.arc(px(x, y), py(x, y), r, a0 + rot, a1 + rot, ccw);
  },
  arcTo(x1, y1, x2, y2, r) {
    context.arcTo(px(x1, y1), py(x1, y1), px(x2, y2), py(x2, y2), r);
  },
  ellipse(x, y, rx, ry, a, a0, a1, ccw) {
    context.ellipse(px(x, y), py(x, y), rx, ry, a + rot, a0, a1, ccw);
  },
  quadraticCurveTo(x1, y1, x, y) {
    context.quadraticCurveTo(px(x1, y1), py(x1, y1), px(x, y), py(x, y));
  },
  bezierCurveTo(x1, y1, x2, y2, x, y) {
    context.bezierCurveTo(
      px(x1, y1), py(x1, y1),
      px(x2, y2), py(x2, y2),
      px(x, y), py(x, y)
    );
  }
};

export default function(_, x, y, angle) {
  context = _;
  dx = x;
  dy = y;
  rot = angle || 0;
  cos = rot ? Math.cos(rot) : 1;
  sin = rot ? Math.sin(rot) : 0;
  return placed;
}
