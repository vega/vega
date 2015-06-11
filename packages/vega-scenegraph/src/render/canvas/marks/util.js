function drawPathOne(path, g, o, items) {
  var fill = o.fill,
      stroke = o.stroke,
      opac, lc, lw;

  if (path(g, items)) return;

  opac = o.opacity == null ? 1 : o.opacity;
  if (opac===0 || !fill && !stroke) return;

  if (fill) {
    g.globalAlpha = opac * (o.fillOpacity==null ? 1 : o.fillOpacity);
    g.fillStyle = color(g, o, fill);
    g.fill();
  }

  if (stroke) {
    lw = (lw = o.strokeWidth) != null ? lw : 1;
    if (lw > 0) {
      g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
      g.strokeStyle = color(g, o, stroke);
      g.lineWidth = lw;
      g.lineCap = (lc = o.strokeCap) != null ? lc : 'butt';
      g.vgLineDash(o.strokeDash || null);
      g.vgLineDashOffset(o.strokeDashOffset || 0);
      g.stroke();
    }
  }
}

function drawPathAll(path, g, scene, bounds) {
  var i, len, item;
  for (i=0, len=scene.items.length; i<len; ++i) {
    item = scene.items[i];
    if (bounds && !bounds.intersects(item.bounds))
      continue; // bounds check
    drawPathOne(path, g, item, item);
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
    if (bounds && !bounds.intersects(scene.items[0].bounds))
      return; // bounds check
    drawPathOne(pathFunc, g, scene.items[0], scene.items);
  };
}

function pick(test) {
  if (!test) test = function() { return true; };

  return function(g, scene, x, y, gx, gy) {
    if (!scene.items.length) return false;

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
    return false;
  };
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
  color:    color,
  gradient: gradient
};
