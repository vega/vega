vg.canvas.marks = (function() {
  
  var parsePath = vg.canvas.path.parse,
      renderPath = vg.canvas.path.render,
      arc_path = d3.svg.arc(),
      sqrt3 = Math.sqrt(3),
      tan30 = Math.tan(30 * Math.PI / 180); 

  // path generators
 
  function arcPath(g, o) {
    return renderPath(g, parsePath(arc_path(o)), o.x, o.y);
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
    if (!fill && !stroke) return;

    o.bounds = path(g, items);

    if (fill) {
      g.globalAlpha = (opac=o.fillOpacity) != undefined ? opac : 1;
      g.fillStyle = fill;
      g.fill();
    }

    if (stroke) {
      g.globalAlpha = (opac=o.strokeOpacity) != undefined ? opac : 1;
      g.strokeStyle = stroke;
      g.lineWidth = (lw = o.strokeWidth) != undefined ? lw : 1;
      g.lineCap = (lc = o.strokeCap) != undefined ? lc : "butt";
      g.stroke();
      o.bounds.expand(2 + (lw||0));
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
        o, ob, fill, stroke, opac, lc, lw;

    for (var i=0, len=items.length; i<len; ++i) {
      o = items[i];
      if (bounds && !bounds.intersects(o.bounds))
        continue; // bounds check

      o.bounds = (o.bounds || new vg.Bounds())
        .set(o.x, o.y, o.x+o.width, o.y+o.height);

      if (fill = o.fill) {
        g.globalAlpha = (opac = o.fillOpacity) != undefined ? opac : 1;
        g.fillStyle = fill;
        g.fillRect(o.x, o.y, o.width, o.height);
      }

      if (stroke = o.stroke) {
        g.globalAlpha = (opac = o.strokeOpacity) != undefined ? opac : 1;
        g.strokeStyle = stroke;
        g.lineWidth = (lw = o.strokeWidth) != undefined ? lw : 1;
        g.lineCap = (lc = o.strokeCap) != undefined ? lc : "butt";
        g.strokeRect(o.x, o.y, o.width, o.height);
        o.bounds.expand(2 + (lw||0));
      }
    }
  }
  
  function fontString(o) {
    return o.font ? o.font : ""
      + (o.fontStyle ? o.fontStyle + " " : "")
      + (o.fontVariant ? o.fontVariant + " " : "")
      + (o.fontWeight ? o.fontWeight + " " : "")
      + o.fontSize + " " + o.fontFamily;
  }
  
  function drawText(g, scene, bounds) {
    if (!scene.items.length) return;
    var items = scene.items,
        o, ob, fill, stroke, opac, lw, text, ta, tb, w, h, dx, dy;

    for (var i=0, len=items.length; i<len; ++i) {
      o = items[i];
      if (bounds && !bounds.intersects(o.bounds))
        continue; // bounds check

      g.font = fontString(o);
      g.textAlign = o.textAlign;
      g.textBaseline = o.textBaseline;
      w = g.measureText(o.text).width;
      h = 13;  // TODO get text height
      x = o.x + (o.dx || 0);
      y = o.y + (o.dy || 0);

      o.bounds = (o.bounds || new vg.Bounds())
        .set(x, y, o.x+o.width, o.y+o.height)
        .expand(2);

      if (fill = o.fill) {
        g.globalAlpha = (opac = o.fillOpacity) != undefined ? opac : 1;
        g.fillStyle = fill;
        g.fillText(o.text, x, y);
      }
      
      if (stroke = o.stroke) {
        g.globalAlpha = (opac = o.strokeOpacity) != undefined ? opac : 1;
        g.strokeStyle = stroke;
        g.lineWidth = (w = o.strokeWidth) != undefined ? w : 1;
        g.strokeText(o.text, x, y);
      }
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
      drawPathOne(pathFunc, g, scene.items[0], scene.items);
    }
  }
  
  function drawGroup(g, scene, bounds) {
    if (!scene.items.length) return;
    var items = scene.items, group,
        renderer = this;
    
    for (var i=0, len=items.length; i<len; ++i) {
      group = items[i];
      // render group contents
      g.save();
      g.translate(group.x, group.y);
      for (var j=0, llen=group.items.length; j<llen; ++j) {
        renderer.draw(g, group.items[j], bounds);
      }
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
          hit.push(subscene, group, scene);
          return hit;
        }
      }
      g.restore();
    }
    return false; // TODO allow groups to be pickable
  }
  
  function pickAll(test, g, scene, x, y, gx, gy) {
    if (!scene.items.length) return false;
    var o, b, i;

    for (i=scene.items.length; --i >= 0;) {
      o = scene.items[i]; b = o.bounds;
      // first hit test against bounding box
      if (b && !b.contains(gx, gy)) continue;
      // if in bounding box, perform more careful test
      if (test(g, o, x, y)) return [o];
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
    return [items[0]];
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
    rect: function(g,o,x,y) { return true; }, // bounds test is sufficient
    text: function(g,o,x,y) { return true; }, // use bounds test for now
    arc:  function(g,o,x,y) { arcPath(g,o);  return g.isPointInPath(x,y); },
    area: function(g,s,x,y) { areaPath(g,s); return g.isPointInPath(x,y); },
    path: function(g,o,x,y) { pathPath(g,o); return g.isPointInPath(x,y); },
    symbol: function(g,o,x,y) {symbolPath(g,o); return g.isPointInPath(x,y);},
  };
  
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
      pickAll: pickAll  // expose for extensibility
    }
  };
  
})();