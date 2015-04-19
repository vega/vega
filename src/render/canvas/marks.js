var Bounds = require('../../core/Bounds'),
    boundsCalc = require('../../util/bounds'),
    config = require('../../util/config'),
    path = require('./path');

var parsePath = path.parse,
    renderPath = path.render,
    halfpi = Math.PI / 2,
    sqrt3 = Math.sqrt(3),
    tan30 = Math.tan(30 * Math.PI / 180),
    tmpBounds = new Bounds();

function fontString(o) {
  return (o.fontStyle ? o.fontStyle + " " : "")
    + (o.fontVariant ? o.fontVariant + " " : "")
    + (o.fontWeight ? o.fontWeight + " " : "")
    + (o.fontSize != null ? o.fontSize : config.render.fontSize) + "px "
    + (o.font || config.render.font);
}

// path generators

function arcPath(g, o) {
  var x = o.x || 0,
      y = o.y || 0,
      ir = o.innerRadius || 0,
      or = o.outerRadius || 0,
      sa = (o.startAngle || 0) - Math.PI/2,
      ea = (o.endAngle || 0) - Math.PI/2;
  g.beginPath();
  if (ir === 0) g.moveTo(x, y);
  else g.arc(x, y, ir, sa, ea, 0);
  g.arc(x, y, or, ea, sa, 1);
  g.closePath();
}

function areaPath(g, items) {
  var o = items[0],
      m = o.mark,
      p = m.pathCache || (m.pathCache = parsePath(path.area(items)));
  renderPath(g, p);
}

function linePath(g, items) {
  var o = items[0],
      m = o.mark,
      p = m.pathCache || (m.pathCache = parsePath(path.line(items)));
  renderPath(g, p);
}

function pathPath(g, o) {
  if (o.path == null) return;
  var p = o.pathCache || (o.pathCache = parsePath(o.path));
  return renderPath(g, p, o.x, o.y);
}

function symbolPath(g, o) {
  g.beginPath();
  var size = o.size != null ? o.size : 100,
      x = o.x, y = o.y, r, t, rx, ry;

  if (o.shape == null || o.shape === "circle") {
    r = Math.sqrt(size/Math.PI);
    g.arc(x, y, r, 0, 2*Math.PI, 0);
    g.closePath();
    return;
  }

  switch (o.shape) {
    case "cross":
      r = Math.sqrt(size / 5) / 2;
      t = 3*r;
      g.moveTo(x-t, y-r);
      g.lineTo(x-r, y-r);
      g.lineTo(x-r, y-t);
      g.lineTo(x+r, y-t);
      g.lineTo(x+r, y-r);
      g.lineTo(x+t, y-r);
      g.lineTo(x+t, y+r);
      g.lineTo(x+r, y+r);
      g.lineTo(x+r, y+t);
      g.lineTo(x-r, y+t);
      g.lineTo(x-r, y+r);
      g.lineTo(x-t, y+r);
      break;

    case "diamond":
      ry = Math.sqrt(size / (2 * tan30));
      rx = ry * tan30;
      g.moveTo(x, y-ry);
      g.lineTo(x+rx, y);
      g.lineTo(x, y+ry);
      g.lineTo(x-rx, y);
      break;

    case "square":
      t = Math.sqrt(size);
      r = t / 2;
      g.rect(x-r, y-r, t, t);
      break;

    case "triangle-down":
      rx = Math.sqrt(size / sqrt3);
      ry = rx * sqrt3 / 2;
      g.moveTo(x, y+ry);
      g.lineTo(x+rx, y-ry);
      g.lineTo(x-rx, y-ry);
      break;

    case "triangle-up":
      rx = Math.sqrt(size / sqrt3);
      ry = rx * sqrt3 / 2;
      g.moveTo(x, y-ry);
      g.lineTo(x+rx, y+ry);
      g.lineTo(x-rx, y+ry);
  }
  g.closePath();
}

function lineStroke(g, items) {
  var o = items[0],
      lw = o.strokeWidth,
      lc = o.strokeCap;
  g.lineWidth = lw != null ? lw : config.render.lineWidth;
  g.lineCap   = lc != null ? lc : config.render.lineCap;
  linePath(g, items);
}

function ruleStroke(g, o) {
  var x1 = o.x || 0,
      y1 = o.y || 0,
      x2 = o.x2 != null ? o.x2 : x1,
      y2 = o.y2 != null ? o.y2 : y1,
      lw = o.strokeWidth,
      lc = o.strokeCap;

  g.lineWidth = lw != null ? lw : config.render.lineWidth;
  g.lineCap   = lc != null ? lc : config.render.lineCap;
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
}

// drawing functions

function drawPathOne(path, g, o, items) {
  var fill = o.fill, stroke = o.stroke, opac, lc, lw;

  path(g, items);

  opac = o.opacity == null ? 1 : o.opacity;
  if (opac == 0 || !fill && !stroke) return;

  if (fill) {
    g.globalAlpha = opac * (o.fillOpacity==null ? 1 : o.fillOpacity);
    g.fillStyle = color(g, o, fill);
    g.fill();
  }

  if (stroke) {
    lw = (lw = o.strokeWidth) != null ? lw : config.render.lineWidth;
    if (lw > 0) {
      g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
      g.strokeStyle = color(g, o, stroke);
      g.lineWidth = lw;
      g.lineCap = (lc = o.strokeCap) != null ? lc : config.render.lineCap;
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

function drawRect(g, scene, bounds) {
  if (!scene.items.length) return;
  var items = scene.items,
      o, fill, stroke, opac, lc, lw, x, y, w, h;

  for (var i=0, len=items.length; i<len; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds))
      continue; // bounds check

    x = o.x || 0;
    y = o.y || 0;
    w = o.width || 0;
    h = o.height || 0;

    opac = o.opacity == null ? 1 : o.opacity;
    if (opac == 0) continue;

    if (fill = o.fill) {
      g.globalAlpha = opac * (o.fillOpacity==null ? 1 : o.fillOpacity);
      g.fillStyle = color(g, o, fill);
      g.fillRect(x, y, w, h);
    }

    if (stroke = o.stroke) {
      lw = (lw = o.strokeWidth) != null ? lw : config.render.lineWidth;
      if (lw > 0) {
        g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
        g.strokeStyle = color(g, o, stroke);
        g.lineWidth = lw;
        g.lineCap = (lc = o.strokeCap) != null ? lc : config.render.lineCap;
        g.vgLineDash(o.strokeDash || null);
        g.vgLineDashOffset(o.strokeDashOffset || 0);
        g.strokeRect(x, y, w, h);
      }
    }
  }
}

function drawRule(g, scene, bounds) {
  if (!scene.items.length) return;
  var items = scene.items,
      o, stroke, opac, lc, lw, x1, y1, x2, y2;

  for (var i=0, len=items.length; i<len; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds))
      continue; // bounds check

    x1 = o.x || 0;
    y1 = o.y || 0;
    x2 = o.x2 != null ? o.x2 : x1;
    y2 = o.y2 != null ? o.y2 : y1;

    opac = o.opacity == null ? 1 : o.opacity;
    if (opac == 0) continue;
    
    if (stroke = o.stroke) {
      lw = (lw = o.strokeWidth) != null ? lw : config.render.lineWidth;
      if (lw > 0) {
        g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
        g.strokeStyle = color(g, o, stroke);
        g.lineWidth = lw;
        g.lineCap = (lc = o.strokeCap) != null ? lc : config.render.lineCap;
        g.vgLineDash(o.strokeDash || null);
        g.vgLineDashOffset(o.strokeDashOffset || 0);
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.stroke();
      }
    }
  }
}

function drawImage(g, scene, bounds) {
  if (!scene.items.length) return;
  var renderer = this,
      items = scene.items, o;

  for (var i=0, len=items.length; i<len; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds))
      continue; // bounds check

    if (!(o.image && o.image.url === o.url)) {
      o.image = renderer.loadImage(o.url);
      o.image.url = o.url;
    }

    var x, y, w, h, opac;
    w = o.width || (o.image && o.image.width) || 0;
    h = o.height || (o.image && o.image.height) || 0;
    x = (o.x||0) - (o.align === "center"
      ? w/2 : (o.align === "right" ? w : 0));
    y = (o.y||0) - (o.baseline === "middle"
      ? h/2 : (o.baseline === "bottom" ? h : 0));

    if (o.image.loaded) {
      g.globalAlpha = (opac = o.opacity) != null ? opac : 1;
      g.drawImage(o.image, x, y, w, h);
    }
  }
}

function drawText(g, scene, bounds) {
  if (!scene.items.length) return;
  var items = scene.items,
      o, fill, stroke, opac, lw, x, y, r, t;

  for (var i=0, len=items.length; i<len; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds))
      continue; // bounds check

    g.font = fontString(o);
    g.textAlign = o.align || "left";
    g.textBaseline = o.baseline || "alphabetic";

    opac = o.opacity == null ? 1 : o.opacity;
    if (opac == 0) continue;

    x = o.x || 0;
    y = o.y || 0;
    if (r = o.radius) {
      t = (o.theta || 0) - Math.PI/2;
      x += r * Math.cos(t);
      y += r * Math.sin(t);
    }

    if (o.angle) {
      g.save();
      g.translate(x, y);
      g.rotate(o.angle * Math.PI/180);
      x = o.dx || 0;
      y = o.dy || 0;
    } else {
      x += (o.dx || 0);
      y += (o.dy || 0);
    }

    if (fill = o.fill) {
      g.globalAlpha = opac * (o.fillOpacity==null ? 1 : o.fillOpacity);
      g.fillStyle = color(g, o, fill);
      g.fillText(o.text, x, y);
    }

    if (stroke = o.stroke) {
      lw = (lw = o.strokeWidth) != null ? lw : 1;
      if (lw > 0) {
        g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
        g.strokeStyle = color(o, stroke);
        g.lineWidth = lw;
        g.strokeText(o.text, x, y);
      }
    }

    if (o.angle) g.restore();
  }
}

function drawAll(pathFunc) {
  return function(g, scene, bounds) {
    drawPathAll(pathFunc, g, scene, bounds);
  }
}

function drawOne(pathFunc) {
  return function(g, scene, bounds) {
    if (!scene.items.length) return;
    if (bounds && !bounds.intersects(scene.items[0].bounds))
      return; // bounds check
    drawPathOne(pathFunc, g, scene.items[0], scene.items);
  }
}

function drawGroup(g, scene, bounds) {
  if (!scene.items.length) return;
  var items = scene.items, group, axes, legends,
      renderer = this, gx, gy, gb, i, n, j, m;

  drawRect(g, scene, bounds);

  for (i=0, n=items.length; i<n; ++i) {
    group = items[i];
    axes = group.axisItems || [];
    legends = group.legendItems || [];
    gx = group.x || 0;
    gy = group.y || 0;

    // render group contents
    g.save();
    g.translate(gx, gy);
    if (group.clip) {
      g.beginPath();
      g.rect(0, 0, group.width || 0, group.height || 0);
      g.clip();
    }
    
    if (bounds) bounds.translate(-gx, -gy);
    
    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].def.layer === "back") {
        renderer.draw(g, axes[j], bounds);
      }
    }
    for (j=0, m=group.items.length; j<m; ++j) {
      renderer.draw(g, group.items[j], bounds);
    }
    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].def.layer !== "back") {
        renderer.draw(g, axes[j], bounds);
      }
    }
    for (j=0, m=legends.length; j<m; ++j) {
      renderer.draw(g, legends[j], bounds);
    }
    
    if (bounds) bounds.translate(gx, gy);
    g.restore();
  }    
}

function color(g, o, value) {
  return (value.id)
    ? gradient(g, value, o.bounds)
    : value;
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

// hit testing

function pickGroup(g, scene, x, y, gx, gy) {
  if (scene.items.length === 0 ||
      scene.bounds && !scene.bounds.contains(gx, gy)) {
    return false;
  }
  var items = scene.items, subscene, group, hit, dx, dy,
      handler = this, i, j;

  for (i=items.length; --i>=0;) {
    group = items[i];
    dx = group.x || 0;
    dy = group.y || 0;

    g.save();
    g.translate(dx, dy);
    for (j=group.items.length; --j >= 0;) {
      subscene = group.items[j];
      if (subscene.interactive === false) continue;
      hit = handler.pick(subscene, x, y, gx-dx, gy-dy);
      if (hit) {
        g.restore();
        return hit;
      }
    }
    g.restore();
  }

  return scene.interactive
    ? pickAll(hitTests.group, g, scene, x, y, gx, gy)
    : false;
}

function pickAll(test, g, scene, x, y, gx, gy) {
  if (!scene.items.length) return false;
  var o, b, i;

  if (g._ratio !== 1) {
    x *= g._ratio;
    y *= g._ratio;
  }

  for (i=scene.items.length; --i >= 0;) {
    o = scene.items[i]; b = o.bounds;
    // first hit test against bounding box
    if ((b && !b.contains(gx, gy)) || !b) continue;
    // if in bounding box, perform more careful test
    if (test(g, o, x, y, gx, gy)) return o;
  }
  return false;
}

function pickArea(g, scene, x, y, gx, gy) {
  if (!scene.items.length) return false;
  var items = scene.items,
      o, b, i, di, dd, od, dx, dy;

  b = items[0].bounds;
  if (b && !b.contains(gx, gy)) return false;
  if (g._ratio !== 1) {
    x *= g._ratio;
    y *= g._ratio;
  }
  if (!hitTests.area(g, items, x, y)) return false;
  return items[0];
}

function pickLine(g, scene, x, y, gx, gy) {
  if (!scene.items.length) return false;
  var items = scene.items,
      o, b, i, di, dd, od, dx, dy;

  b = items[0].bounds;
  if (b && !b.contains(gx, gy)) return false;
  if (g._ratio !== 1) {
    x *= g._ratio;
    y *= g._ratio;
  }
  if (!hitTests.line(g, items, x, y)) return false;
  return items[0];
}

function pick(test) {
  return function (g, scene, x, y, gx, gy) {
    return pickAll(test, g, scene, x, y, gx, gy);
  };
}

function textHit(g, o, x, y, gx, gy) {
  if (!o.fontSize) return false;
  if (!o.angle) return true; // bounds sufficient if no rotation

  var b = boundsCalc.text(o, tmpBounds, true),
      a = -o.angle * Math.PI / 180,
      cos = Math.cos(a),
      sin = Math.sin(a),
      x = o.x,
      y = o.y,
      px = cos*gx - sin*gy + (x - x*cos + y*sin),
      py = sin*gx + cos*gy + (y - x*sin - y*cos);

  return b.contains(px, py);
}

var hitTests = {
  text:   textHit,
  rect:   function(g,o,x,y) { return true; }, // bounds test is sufficient
  image:  function(g,o,x,y) { return true; }, // bounds test is sufficient
  group:  function(g,o,x,y) { return o.fill || o.stroke; },
  rule:   function(g,o,x,y) {
            if (!g.isPointInStroke) return false;
            ruleStroke(g,o); return g.isPointInStroke(x,y);
          },
  line:   function(g,s,x,y) {
            if (!g.isPointInStroke) return false;
            lineStroke(g,s); return g.isPointInStroke(x,y);
          },
  arc:    function(g,o,x,y) { arcPath(g,o);  return g.isPointInPath(x,y); },
  area:   function(g,s,x,y) { areaPath(g,s); return g.isPointInPath(x,y); },
  path:   function(g,o,x,y) { pathPath(g,o); return g.isPointInPath(x,y); },
  symbol: function(g,o,x,y) { symbolPath(g,o); return g.isPointInPath(x,y); }
};

module.exports = {
  draw: {
    group:   drawGroup,
    area:    drawOne(areaPath),
    line:    drawOne(linePath),
    arc:     drawAll(arcPath),
    path:    drawAll(pathPath),
    symbol:  drawAll(symbolPath),
    rect:    drawRect,
    rule:    drawRule,
    text:    drawText,
    image:   drawImage,
    drawOne: drawOne, // expose for extensibility
    drawAll: drawAll  // expose for extensibility
  },
  pick: {
    group:   pickGroup,
    area:    pickArea,
    line:    pickLine,
    arc:     pick(hitTests.arc),
    path:    pick(hitTests.path),
    symbol:  pick(hitTests.symbol),
    rect:    pick(hitTests.rect),
    rule:    pick(hitTests.rule),
    text:    pick(hitTests.text),
    image:   pick(hitTests.image),
    pickAll: pickAll  // expose for extensibility
  }
};