var trueFunc = function() { return true; };

export function pick(test) {
  if (!test) test = trueFunc;

  return function(context, scene, x, y, gx, gy) {
    var items = scene.items, item, b, i;
    if (!items.length) return null;

    if (context.pixelratio != null && context.pixelratio !== 1) {
      x *= context.pixelratio;
      y *= context.pixelratio;
    }

    for (i=items.length; --i >= 0;) {
      item = items[i];
      b = item.bounds;

      // first hit test against bounding box
      if ((b && !b.contains(gx, gy)) || !b) continue;

      // if in bounding box, perform more careful test
      if (test(context, item, x, y, gx, gy)) return item;
    }

    return null;
  };
}

export function hitPath(path, filled) {
  return function(context, o, x, y) {
    var item = Array.isArray(o) ? o[0] : o,
        fill = (filled == null) ? item.fill : filled,
        stroke = item.stroke && context.isPointInStroke, lw, lc;

    if (stroke) {
      lw = item.strokeWidth;
      lc = item.strokeCap;
      context.lineWidth = lw != null ? lw : 1;
      context.lineCap   = lc != null ? lc : 'butt';
    }

    return path(context, o) ? false :
      (fill && context.isPointInPath(x, y)) ||
      (stroke && context.isPointInStroke(x, y));
  };
}

export function pickPath(path) {
  return pick(hitPath(path));
}
