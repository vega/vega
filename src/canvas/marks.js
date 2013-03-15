vg.canvas.marks = (function() {
  
  var parsePath = vg.canvas.path.parse,
      renderPath = vg.canvas.path.render,
      sqrt3 = Math.sqrt(3),
      tan30 = Math.tan(30 * Math.PI / 180),
      tmpBounds = new vg.Bounds();

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
    return new vg.Bounds()
      .set(x-or, y-or, x+or, y+or);
  }

  function pathPath(g, o) {
    return renderPath(g, parsePath(o.path), o.x, o.y);
  }
  
  function symbolPath(g, o) {
    g.beginPath();
    var size = o.size != undefined ? o.size : 100,
        x = o.x, y = o.y, r, t, rx, ry,
        bounds = new vg.Bounds();

    if (o.shape == undefined || o.shape === "circle") {
      r = Math.sqrt(size/Math.PI);
      g.arc(x, y, r, 0, 2*Math.PI, 0);
      g.closePath();
      return bounds.set(x-r, y-r, x+r, y+r);
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
        bounds.set(x-t, y-t, x+y, y+t);
        break;

      case "diamond":
        ry = Math.sqrt(size / (2 * tan30));
        rx = ry * tan30;
        g.moveTo(x, y-ry);
        g.lineTo(x+rx, y);
        g.lineTo(x, y+ry);
        g.lineTo(x-rx, y);
        bounds.set(x-rx, y-ry, x+rx, y+ry);
        break;

      case "square":
        t = Math.sqrt(size);
        r = t / 2;
        g.rect(x-r, y-r, t, t);
        bounds.set(x-r, y-r, x+r, y+r);
        break;

      case "triangle-down":
        rx = Math.sqrt(size / sqrt3);
        ry = rx * sqrt3 / 2;
        g.moveTo(x, y+ry);
        g.lineTo(x+rx, y-ry);
        g.lineTo(x-rx, y-ry);
        bounds.set(x-rx, y-ry, x+rx, y+ry);
        break;

      case "triangle-up":
        rx = Math.sqrt(size / sqrt3);
        ry = rx * sqrt3 / 2;
        g.moveTo(x, y-ry);
        g.lineTo(x+rx, y+ry);
        g.lineTo(x-rx, y+ry);
        bounds.set(x-rx, y-ry, x+rx, y+ry);
    }
    g.closePath();
    return bounds;
  }
  
  function areaPath(g, items) {
    var area = d3.svg.area()
     .x(function(d) { return d.x; })
     .y1(function(d) { return d.y; })
     .y0(function(d) { return d.y + d.height; });
    var o = items[0];
    if (o.interpolate) area.interpolate(o.interpolate);
    if (o.tension != undefined) area.tension(o.tension);
    return renderPath(g, parsePath(area(items)));
  }

  function linePath(g, items) {
    var line = d3.svg.line()
     .x(function(d) { return d.x; })
     .y(function(d) { return d.y; });
    var o = items[0];
    if (o.interpolate) line.interpolate(o.interpolate);
    if (o.tension != undefined) line.tension(o.tension);
    return renderPath(g, parsePath(line(items)));
  }
  
  // drawing functions
  
  function drawPathOne(path, g, o, items) {
    var fill = o.fill, stroke = o.stroke, opac, lc, lw;
    o.bounds = path(g, items);
    
    opac = o.opacity == null ? 1 : o.opacity;
    if (opac == 0 || !fill && !stroke) return;

    if (fill) {
      g.globalAlpha = opac * (o.fillOpacity==null ? 1 : o.fillOpacity);
      g.fillStyle = fill;
      g.fill();
    }

    if (stroke) {
      lw = (lw = o.strokeWidth) != undefined ? lw : 1;
      if (lw > 0) {
        g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
        g.strokeStyle = stroke;
        g.lineWidth = lw;
        g.lineCap = (lc = o.strokeCap) != undefined ? lc : "butt";
        g.stroke();
        o.bounds.expand(lw);
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
        o, ob, fill, stroke, opac, lc, lw, x, y;

    for (var i=0, len=items.length; i<len; ++i) {
      o = items[i];
      if (bounds && !bounds.intersects(o.bounds))
        continue; // bounds check

      x = o.x || 0;
      y = o.y || 0;
      o.bounds = (o.bounds || new vg.Bounds())
        .set(x, y, x+o.width, y+o.height);

      opac = o.opacity == null ? 1 : o.opacity;
      if (opac == 0) return;

      if (fill = o.fill) {
        g.globalAlpha = opac * (o.fillOpacity==null ? 1 : o.fillOpacity);
        g.fillStyle = fill;
        g.fillRect(x, y, o.width, o.height);
      }

      if (stroke = o.stroke) {
        lw = (lw = o.strokeWidth) != undefined ? lw : 1;
        if (lw > 0) {
          g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
          g.strokeStyle = stroke;
          g.lineWidth = lw;
          g.lineCap = (lc = o.strokeCap) != undefined ? lc : "butt";
          g.strokeRect(x, y, o.width, o.height);
          o.bounds.expand(lw);
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
      x = o.x - (o.align === "center"
        ? w/2 : (o.align === "right" ? w : 0));
      y = o.y - (o.baseline === "middle"
        ? h/2 : (o.baseline === "bottom" ? h : 0));
      o.bounds = (o.bounds || new vg.Bounds()).set(x, y, x+w, y+h);

      g.globalAlpha = (opac = o.opacity) != undefined ? opac : 1;
      g.drawImage(o.image, x, y, w, h);
    }
  }
  
  function fontString(o) {
    return (o.fontStyle ? o.fontStyle + " " : "")
      + (o.fontVariant ? o.fontVariant + " " : "")
      + (o.fontWeight ? o.fontWeight + " " : "")
      + (o.fontSize != undefined ? o.fontSize + "px " : "11px ")
      + (o.font || "sans-serif");
  }
  
  function drawText(g, scene, bounds) {
    if (!scene.items.length) return;
    var items = scene.items,
        o, ob, fill, stroke, opac, lw, text, ta, tb;

    for (var i=0, len=items.length; i<len; ++i) {
      o = items[i];
      if (bounds && !bounds.intersects(o.bounds))
        continue; // bounds check

      g.font = fontString(o);
      g.textAlign = o.align || "left";
      g.textBaseline = o.baseline || "alphabetic";
      o.bounds = textBounds(g, o, (o.bounds || new vg.Bounds())).expand(1);

      opac = o.opacity == null ? 1 : o.opacity;
      if (opac == 0) return;

      if (o.angle) {
        g.save();
        g.translate(o.x, o.y);
        g.rotate(o.angle * Math.PI/180);
        x = o.dx || 0;
        y = o.dy || 0;
      } else {
        x = o.x + (o.dx || 0);
        y = o.y + (o.dy || 0);
      }

      if (fill = o.fill) {
        g.globalAlpha = opac * (o.fillOpacity==null ? 1 : o.fillOpacity);
        g.fillStyle = fill;
        g.fillText(o.text, x, y);
      }
      
      if (stroke = o.stroke) {
        lw = (lw = o.strokeWidth) != undefined ? lw : 1;
        if (lw > 0) {
          g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
          g.strokeStyle = stroke;
          g.lineWidth = lw;
          g.strokeText(o.text, x, y);
        }
      }
      
      if (o.angle) {
        g.restore();
      }
    }
  }
  
  function textBounds(g, o, bounds, noRotate) {
    var x = o.x + (o.dx || 0),
        y = o.y + (o.dy || 0),
        w = g.measureText(o.text).width,
        h = o.fontSize,
        a = o.align,
        b = o.baseline,
        angle, cos, sin, cx, cy;
    
    // horizontal
    if (a === "center") {
      x = x - (w / 2);
    } else if (a === "right") {
      x = x - w;
    } else {
      // left by default, do nothing
    }
    
    /// TODO find a robust solution for heights!
    /// These offsets work for some but not all fonts.
    
    // vertical
    if (b === "top") {
      y = y + (h/5);
    } else if (b === "bottom") {
      y = y - h;
    } else if (b === "middle") {
      y = y - (h/2) + (h/10);
    } else {
      // alphabetic by default
      y = y - 4*h/5;
    }
    
    bounds.set(x, y, x+w, y+h);
    if (!noRotate && o.angle) {
      bounds.rotate(o.angle*Math.PI/180, o.x, o.y);
    }
    return bounds;
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
    var items = scene.items, group,
        renderer = this, gx, gy;
    
    drawRect(g, scene, bounds);
    
    for (var i=0, len=items.length; i<len; ++i) {
      group = items[i];
      gx = group.x || 0;
      gy = group.y || 0;
      
      // render group contents
      g.save();
      g.translate(gx, gy);
      if (bounds) bounds.translate(-gx, -gy);
      for (var j=0, llen=group.items.length; j<llen; ++j) {
        renderer.draw(g, group.items[j], bounds);
      }
      if (bounds) bounds.translate(gx, gy);
      g.restore(); 
    }
  }
  
  // hit testing
  
  function pickGroup(g, scene, x, y, gx, gy) {
    if (scene.items.length === 0 ||
        scene.bounds && !scene.bounds.contains(gx, gy)) {
      return false;
    }
    var items = scene.items, subscene, group, hit, dx, dy,
        handler = this;

    for (var i=0, len=items.length; i<len; ++i) {
      group = items[i];
      dx = group.x || 0;
      dy = group.y || 0;
      
      g.save();
      g.translate(dx, dy);
      for (var j=0, llen=group.items.length; j<llen; ++j) {
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
      ? pickAll(hitTests.rect, g, scene, x, y, gx, gy)
      : false;
  }
  
  function pickAll(test, g, scene, x, y, gx, gy) {
    if (!scene.items.length) return false;
    var o, b, i;

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
    if (!hitTests.area(g, items, x, y)) return false;
    return items[0];
  }
  
  function pickLine(g, scene, x, y, gx, gy) {
    // TODO...
    return false;
  }
  
  function pick(test) {
    return function (g, scene, x, y, gx, gy) {
      return pickAll(test, g, scene, x, y, gx, gy);
    };
  }

  var hitTests = {
    text:   hitTestText,
    rect:   function(g,o,x,y) { return true; }, // bounds test is sufficient
    image:  function(g,o,x,y) { return true; }, // bounds test is sufficient
    arc:    function(g,o,x,y) { arcPath(g,o);  return g.isPointInPath(x,y); },
    area:   function(g,s,x,y) { areaPath(g,s); return g.isPointInPath(x,y); },
    path:   function(g,o,x,y) { pathPath(g,o); return g.isPointInPath(x,y); },
    symbol: function(g,o,x,y) {symbolPath(g,o); return g.isPointInPath(x,y);},
  };
  
  function hitTestText(g, o, x, y, gx, gy) {
    if (!o.fontSize) return false;
    if (!o.angle) return true; // bounds sufficient if no rotation

    g.font = fontString(o);
    
    var b = textBounds(g, o, tmpBounds, true),
        a = -o.angle * Math.PI / 180,
        cos = Math.cos(a),
        sin = Math.sin(a),
        x = o.x,
        y = o.y,
        px = cos*gx - sin*gy + (x - x*cos + y*sin),
        py = sin*gx + cos*gy + (y - x*sin - y*cos);
        
    return b.contains(px, py);
  }
  
  return {
    draw: {
      group:   drawGroup,
      area:    drawOne(areaPath),
      line:    drawOne(linePath),
      arc:     drawAll(arcPath),
      path:    drawAll(pathPath),
      symbol:  drawAll(symbolPath),
      rect:    drawRect,
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
      text:    pick(hitTests.text),
      image:   pick(hitTests.image),
      pickAll: pickAll  // expose for extensibility
    }
  };
  
})();