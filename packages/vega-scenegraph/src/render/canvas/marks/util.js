function drawPathOne(path, g, o, items) {
  if (path(g, items)) return;

  var opac = o.opacity == null ? 1 : o.opacity;
  if (opac===0) return;

  if (o.fill && fill(g, o, opac)) { g.fill(); }
  if (o.stroke && stroke(g, o, opac)) { g.stroke(); }
}

function drawPathAll(path, g, scene, bounds) {
  var i, len, item;
  for (i=0, len=scene.items.length; i<len; ++i) {
    item = scene.items[i];
    if (!bounds || bounds.intersects(item.bounds)) {
      drawPathOne(path, g, item, item);
    }
  }
}

function drawAll(pathFunc) {
  return function(g, scene, bounds) {
    drawPathAll(pathFunc, g, scene, bounds);
  };
}

function drawOne(pathFunc) {
  return function(g, scene, bounds) {
    if (!scene.items.length) return;
    if (!bounds || bounds.intersects(scene.bounds)) {
      drawPathOne(pathFunc, g, scene.items[0], scene.items);
    }
  };
}

var trueFunc = function() { return true; };

function pick(test) {
  if (!test) test = trueFunc;

  return function(g, scene, x, y, gx, gy) {
    if (!scene.items.length) return null;

    var o, b, i;

    if (g.pixelratio != null && g.pixelratio !== 1) {
      x *= g.pixelratio;
      y *= g.pixelratio;
    }

    for (i=scene.items.length; --i >= 0;) {
      o = scene.items[i]; b = o.bounds;
      // first hit test against bounding box
      if ((b && !b.contains(gx, gy)) || !b) continue;
      // if in bounding box, perform more careful test
      if (test(g, o, x, y, gx, gy)) return o;
    }
    return null;
  };
}

function testPath(path, filled) {
  return function(g, o, x, y) {
    var item = Array.isArray(o) ? o[0] : o,
        fill = (filled == null) ? item.fill : filled,
        stroke = item.stroke && g.isPointInStroke, lw, lc;

    if (stroke) {
      lw = item.strokeWidth;
      lc = item.strokeCap;
      g.lineWidth = lw != null ? lw : 1;
      g.lineCap   = lc != null ? lc : 'butt';
    }

    return path(g, o) ? false :
      (fill && g.isPointInPath(x, y)) ||
      (stroke && g.isPointInStroke(x, y));
  };
}

function pickPath(path) {
  return pick(testPath(path));
}

function fill(g, o, opacity) {
  opacity *= (o.fillOpacity==null ? 1 : o.fillOpacity);
  if (opacity > 0) {
    g.globalAlpha = opacity;
    g.fillStyle = color(g, o, o.fill);
    return true;
  } else {
    return false;
  }
}

function stroke(g, o, opacity) {
  var lw = (lw = o.strokeWidth) != null ? lw : 1, lc;
  if (lw <= 0) return false;

  opacity *= (o.strokeOpacity==null ? 1 : o.strokeOpacity);
  if (opacity > 0) {
    g.globalAlpha = opacity;
    g.strokeStyle = color(g, o, o.stroke);
    g.lineWidth = lw;
    g.lineCap = (lc = o.strokeCap) != null ? lc : 'butt';
    g.vgLineDash(o.strokeDash || null);
    g.vgLineDashOffset(o.strokeDashOffset || 0);
    return true;
  } else {
    return false;
  }
}

function color(g, o, value) {
  return (value.id) ?
    gradient(g, value, o.bounds) :
    value;
}

function gradient(g, p, b) {
  var w = b.width(),
      h = b.height(),
      x1 = b.x1 + p.x1 * w,
      y1 = b.y1 + p.y1 * h,
      x2 = b.x1 + p.x2 * w,
      y2 = b.y1 + p.y2 * h,
      grad = g.createLinearGradient(x1, y1, x2, y2),
      stop = p.stops,
      i, n;

  for (i=0, n=stop.length; i<n; ++i) {
    grad.addColorStop(stop[i].offset, stop[i].color);
  }
  return grad;
}

module.exports = {
  drawOne:  drawOne,
  drawAll:  drawAll,
  pick:     pick,
  pickPath: pickPath,
  testPath: testPath,
  stroke:   stroke,
  fill:     fill,
  color:    color,
  gradient: gradient
};
