(function(){if (typeof vg === 'undefined') { vg = {}; }

vg.version = '1.0.0'; // semantic versioning

vg.identity = function(x) { return x; };

vg.duplicate = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

vg.isObject = function(obj) {
  return obj === Object(obj);
};

vg.accessor = function(f) {
  return (typeof f === "function") ? f : Array.isArray(f)
    ? function(x) { return f.reduce(function(x,f) { return x[f]; }, x); }
    : function(x) { return x[f]; };
};

vg.array = function(x) {
  return Array.isArray(x) ? x : [x];
};

vg.str = function(str) {
  return Array.isArray(str)
    ? "[" + str.map(vg.str) + "]"
    : (typeof str === 'string') ? ("'"+str+"'") : str;
};

vg.keys = function(x) {
  var keys = [];
  for (var key in x) keys.push(key);
  return keys;
};

vg.unique = function(data, f) {
  f = f || vg.identity;
  var results = [], v;
  for (var i=0; i<data.length; ++i) {
    v = f(data[i]);
    if (results.indexOf(v) < 0) results.push(v);
  }
  return results;
};

vg.log = function(msg) {
  console.log(msg);
};

vg.error = function(msg) {
  console.log(msg);
  alert(msg);
};vg.canvas = {};vg.canvas.path = (function() {

  // Path parsing and rendering code taken from fabric.js -- Thanks!
  var cmdLength = { m:2, l:2, h:1, v:1, c:6, s:4, q:4, t:2, a:7 },
      re = [/([MLHVCSQTAZmlhvcsqtaz])/g, /###/, /(\d)-/g, /\s|,|###/];

  function parse(path) {
    var result = [],
        currentPath,
        chunks,
        parsed;

    // First, break path into command sequence
    path = path.slice().replace(re[0], '###$1').split(re[1]).slice(1);

    // Next, parse each command in turn
    for (var i=0, j, chunksParsed, len=path.length; i<len; i++) {
      currentPath = path[i];
      chunks = currentPath.slice(1).trim().replace(re[2],'$1###-').split(re[3]);
      chunksParsed = [currentPath.charAt(0)];

      for (var j = 0, jlen = chunks.length; j < jlen; j++) {
        parsed = parseFloat(chunks[j]);
        if (!isNaN(parsed)) {
          chunksParsed.push(parsed);
        }
      }

      var command = chunksParsed[0].toLowerCase(),
          commandLength = cmdLength[command];

      if (chunksParsed.length - 1 > commandLength) {
        for (var k = 1, klen = chunksParsed.length; k < klen; k += commandLength) {
          result.push([ chunksParsed[0] ].concat(chunksParsed.slice(k, k + commandLength)));
        }
      }
      else {
        result.push(chunksParsed);
      }
    }

    return result;
  }

  function drawArc(g, x, y, coords, bounds, l, t) {
    var rx = coords[0];
    var ry = coords[1];
    var rot = coords[2];
    var large = coords[3];
    var sweep = coords[4];
    var ex = coords[5];
    var ey = coords[6];
    var segs = arcToSegments(ex, ey, rx, ry, large, sweep, rot, x, y);
    for (var i=0; i<segs.length; i++) {
      var bez = segmentToBezier.apply(null, segs[i]);
      g.bezierCurveTo.apply(g, bez);
      bounds.add(bez[0]-l, bez[1]-t);
      bounds.add(bez[2]-l, bez[3]-t);
      bounds.add(bez[4]-l, bez[5]-t);
    }
  }

  var arcToSegmentsCache = { },
      segmentToBezierCache = { },
      join = Array.prototype.join,
      argsStr;

  // Copied from Inkscape svgtopdf, thanks!
  function arcToSegments(x, y, rx, ry, large, sweep, rotateX, ox, oy) {
    argsStr = join.call(arguments);
    if (arcToSegmentsCache[argsStr]) {
      return arcToSegmentsCache[argsStr];
    }

    var th = rotateX * (Math.PI/180);
    var sin_th = Math.sin(th);
    var cos_th = Math.cos(th);
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    var px = cos_th * (ox - x) * 0.5 + sin_th * (oy - y) * 0.5;
    var py = cos_th * (oy - y) * 0.5 - sin_th * (ox - x) * 0.5;
    var pl = (px*px) / (rx*rx) + (py*py) / (ry*ry);
    if (pl > 1) {
      pl = Math.sqrt(pl);
      rx *= pl;
      ry *= pl;
    }

    var a00 = cos_th / rx;
    var a01 = sin_th / rx;
    var a10 = (-sin_th) / ry;
    var a11 = (cos_th) / ry;
    var x0 = a00 * ox + a01 * oy;
    var y0 = a10 * ox + a11 * oy;
    var x1 = a00 * x + a01 * y;
    var y1 = a10 * x + a11 * y;

    var d = (x1-x0) * (x1-x0) + (y1-y0) * (y1-y0);
    var sfactor_sq = 1 / d - 0.25;
    if (sfactor_sq < 0) sfactor_sq = 0;
    var sfactor = Math.sqrt(sfactor_sq);
    if (sweep == large) sfactor = -sfactor;
    var xc = 0.5 * (x0 + x1) - sfactor * (y1-y0);
    var yc = 0.5 * (y0 + y1) + sfactor * (x1-x0);

    var th0 = Math.atan2(y0-yc, x0-xc);
    var th1 = Math.atan2(y1-yc, x1-xc);

    var th_arc = th1-th0;
    if (th_arc < 0 && sweep == 1){
      th_arc += 2*Math.PI;
    } else if (th_arc > 0 && sweep == 0) {
      th_arc -= 2 * Math.PI;
    }

    var segments = Math.ceil(Math.abs(th_arc / (Math.PI * 0.5 + 0.001)));
    var result = [];
    for (var i=0; i<segments; i++) {
      var th2 = th0 + i * th_arc / segments;
      var th3 = th0 + (i+1) * th_arc / segments;
      result[i] = [xc, yc, th2, th3, rx, ry, sin_th, cos_th];
    }

    return (arcToSegmentsCache[argsStr] = result);
  }

  function segmentToBezier(cx, cy, th0, th1, rx, ry, sin_th, cos_th) {
    argsStr = join.call(arguments);
    if (segmentToBezierCache[argsStr]) {
      return segmentToBezierCache[argsStr];
    }

    var a00 = cos_th * rx;
    var a01 = -sin_th * ry;
    var a10 = sin_th * rx;
    var a11 = cos_th * ry;

    var th_half = 0.5 * (th1 - th0);
    var t = (8/3) * Math.sin(th_half * 0.5) * Math.sin(th_half * 0.5) / Math.sin(th_half);
    var x1 = cx + Math.cos(th0) - t * Math.sin(th0);
    var y1 = cy + Math.sin(th0) + t * Math.cos(th0);
    var x3 = cx + Math.cos(th1);
    var y3 = cy + Math.sin(th1);
    var x2 = x3 + t * Math.sin(th1);
    var y2 = y3 - t * Math.cos(th1);

    return (segmentToBezierCache[argsStr] = [
      a00 * x1 + a01 * y1,  a10 * x1 + a11 * y1,
      a00 * x2 + a01 * y2,  a10 * x2 + a11 * y2,
      a00 * x3 + a01 * y3,  a10 * x3 + a11 * y3
    ]);
  }

  function render(g, path, l, t) {
    var current, // current instruction
        previous = null,
        x = 0, // current x
        y = 0, // current y
        controlX = 0, // current control point x
        controlY = 0, // current control point y
        tempX,
        tempY,
        tempControlX,
        tempControlY,
        bounds = new vg.Bounds();
    if (l == undefined) l = 0;
    if (t == undefined) t = 0;

    g.beginPath();
  
    for (var i=0, len=path.length; i<len; ++i) {
      current = path[i];

      switch (current[0]) { // first letter

        case 'l': // lineto, relative
          x += current[1];
          y += current[2];
          g.lineTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'L': // lineto, absolute
          x = current[1];
          y = current[2];
          g.lineTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'h': // horizontal lineto, relative
          x += current[1];
          g.lineTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'H': // horizontal lineto, absolute
          x = current[1];
          g.lineTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'v': // vertical lineto, relative
          y += current[1];
          g.lineTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'V': // verical lineto, absolute
          y = current[1];
          g.lineTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'm': // moveTo, relative
          x += current[1];
          y += current[2];
          g.moveTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'M': // moveTo, absolute
          x = current[1];
          y = current[2];
          g.moveTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'c': // bezierCurveTo, relative
          tempX = x + current[5];
          tempY = y + current[6];
          controlX = x + current[3];
          controlY = y + current[4];
          g.bezierCurveTo(
            x + current[1] + l, // x1
            y + current[2] + t, // y1
            controlX + l, // x2
            controlY + t, // y2
            tempX + l,
            tempY + t
          );
          bounds.add(x + current[1], y + current[2]);
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          x = tempX;
          y = tempY;
          break;

        case 'C': // bezierCurveTo, absolute
          x = current[5];
          y = current[6];
          controlX = current[3];
          controlY = current[4];
          g.bezierCurveTo(
            current[1] + l,
            current[2] + t,
            controlX + l,
            controlY + t,
            x + l,
            y + t
          );
          bounds.add(current[1], current[2]);
          bounds.add(controlX, controlY);
          bounds.add(x, y);
          break;

        case 's': // shorthand cubic bezierCurveTo, relative
          // transform to absolute x,y
          tempX = x + current[3];
          tempY = y + current[4];
          // calculate reflection of previous control points
          controlX = 2 * x - controlX;
          controlY = 2 * y - controlY;
          g.bezierCurveTo(
            controlX + l,
            controlY + t,
            x + current[1] + l,
            y + current[2] + t,
            tempX + l,
            tempY + t
          );
          bounds.add(controlX, controlY);
          bounds.add(x + current[1], y + current[2]);
          bounds.add(tempX, tempY);

          // set control point to 2nd one of this command
          // "... the first control point is assumed to be the reflection of the second control point on the previous command relative to the current point."
          controlX = x + current[1];
          controlY = y + current[2];

          x = tempX;
          y = tempY;
          break;

        case 'S': // shorthand cubic bezierCurveTo, absolute
          tempX = current[3];
          tempY = current[4];
          // calculate reflection of previous control points
          controlX = 2*x - controlX;
          controlY = 2*y - controlY;
          g.bezierCurveTo(
            controlX + l,
            controlY + t,
            current[1] + l,
            current[2] + t,
            tempX + l,
            tempY + t
          );
          x = tempX;
          y = tempY;
          bounds.add(current[1], current[2]);
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          // set control point to 2nd one of this command
          // "... the first control point is assumed to be the reflection of the second control point on the previous command relative to the current point."
          controlX = current[1];
          controlY = current[2];

          break;

        case 'q': // quadraticCurveTo, relative
          // transform to absolute x,y
          tempX = x + current[3];
          tempY = y + current[4];

          controlX = x + current[1];
          controlY = y + current[2];

          g.quadraticCurveTo(
            controlX + l,
            controlY + t,
            tempX + l,
            tempY + t
          );
          x = tempX;
          y = tempY;
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          break;

        case 'Q': // quadraticCurveTo, absolute
          tempX = current[3];
          tempY = current[4];

          g.quadraticCurveTo(
            current[1] + l,
            current[2] + t,
            tempX + l,
            tempY + t
          );
          x = tempX;
          y = tempY;
          controlX = current[1];
          controlY = current[2];
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          break;

        case 't': // shorthand quadraticCurveTo, relative

          // transform to absolute x,y
          tempX = x + current[1];
          tempY = y + current[2];

          if (previous[0].match(/[QqTt]/) === null) {
            // If there is no previous command or if the previous command was not a Q, q, T or t,
            // assume the control point is coincident with the current point
            controlX = x;
            controlY = y;
          }
          else if (previous[0] === 't') {
            // calculate reflection of previous control points for t
            controlX = 2 * x - tempControlX;
            controlY = 2 * y - tempControlY;
          }
          else if (previous[0] === 'q') {
            // calculate reflection of previous control points for q
            controlX = 2 * x - controlX;
            controlY = 2 * y - controlY;
          }

          tempControlX = controlX;
          tempControlY = controlY;

          g.quadraticCurveTo(
            controlX + l,
            controlY + t,
            tempX + l,
            tempY + t
          );
          x = tempX;
          y = tempY;
          controlX = x + current[1];
          controlY = y + current[2];
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          break;

        case 'T':
          tempX = current[1];
          tempY = current[2];

          // calculate reflection of previous control points
          controlX = 2 * x - controlX;
          controlY = 2 * y - controlY;
          g.quadraticCurveTo(
            controlX + l,
            controlY + t,
            tempX + l,
            tempY + t
          );
          x = tempX;
          y = tempY;
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          break;

        case 'a':
          drawArc(g, x + l, y + t, [
            current[1],
            current[2],
            current[3],
            current[4],
            current[5],
            current[6] + x + l,
            current[7] + y + t
          ], bounds, l, t);
          x += current[6];
          y += current[7];
          break;

        case 'A':
          drawArc(g, x + l, y + t, [
            current[1],
            current[2],
            current[3],
            current[4],
            current[5],
            current[6] + l,
            current[7] + t
          ], bounds, l, t);
          x = current[6];
          y = current[7];
          break;

        case 'z':
        case 'Z':
          g.closePath();
          break;
      }
      previous = current;
    }
    return bounds.translate(l, t);
  };
  
  return {
    parse: parse,
    render: render
  };
  
})();vg.canvas.marks = (function() {
  
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
        o, ob, fill, stroke, opac, lw, text, ta, tb, w, h;

    for (var i=0, len=items.length; i<len; ++i) {
      o = items[i];
      if (bounds && !bounds.intersects(o.bounds))
        continue; // bounds check

      g.font = fontString(o);
      g.textAlign = o.textAlign;
      g.textBaseline = o.textBaseline;
      w = g.measureText(o.text).width;
      h = 13;  // TODO get text height

      o.bounds = (o.bounds || new vg.Bounds())
        .set(o.x, o.y, o.x+o.width, o.y+o.height)
        .expand(2);

      if (fill = o.fill) {
        g.globalAlpha = (opac = o.fillOpacity) != undefined ? opac : 1;
        g.fillStyle = fill;
        g.fillText(o.text, o.x, o.y);
      }
      
      if (stroke = o.stroke) {
        g.globalAlpha = (opac = o.strokeOpacity) != undefined ? opac : 1;
        g.strokeStyle = stroke;
        g.lineWidth = (w = o.strokeWidth) != undefined ? w : 1;
        g.strokeText(o.text, o.x, o.y);
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
        if (subscene.pickable === false) continue;
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

    // return nearest point along x-dimension
    // (areas are by assumption horizontal)
    for (i=items.length, dd=1e20; --i >= 0;) {
      o = items[i];
      od = (dx = (o.x-x)) * dx;
      if (od < dd) { dd = od; di = i; }
    }
    return [items[di]];
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
  
})();vg.canvas.Renderer = (function() {  
  var renderer = function() {
    this._ctx = null;
    this._el = null;
  };
  
  var prototype = renderer.prototype;
  
  prototype.initialize = function(el, width, height, pad) {
    this._el = el;
    this._width = width;
    this._height = height;
    this._padding = pad;

    // select canvas element
    var canvas = d3.select(el)
      .selectAll("canvas")
      .data([1]);
    
    // create new canvas element if needed
    canvas.enter()
      .append("canvas");
    
    // initialize canvas attributes
    canvas
      .attr("width", width + pad.left + pad.right)
      .attr("height", height + pad.top + pad.bottom);
    
    // get the canvas graphics context
    this._ctx = canvas.node().getContext("2d");
    this._ctx.setTransform(1, 0, 0, 1, pad.left, pad.top);
    
    return this;
  };
  
  prototype.context = function() {
    return this._ctx;
  };
  
  prototype.element = function() {
    return this._el;
  };
  
  prototype.render = function(scene, bounds) {
    var t0 = Date.now();
    var g = this._ctx,
        pad = this._padding,
        w = this._width + pad.left + pad.right,
        h = this._width + pad.top + pad.bottom;
    
    // setup
    g.save();
    if (bounds) {
      g.beginPath();
      g.rect(bounds.x1, bounds.y1, bounds.width(), bounds.height());
      g.clip();
    }
    g.clearRect(-pad.left, -pad.top, w, h);
    
    // render
    this.draw(g, scene, bounds);
    
    // takedown
    g.restore();
    
    var t1 = Date.now();
    vg.log("RENDER TIME: " + (t1-t0));
  };
  
  prototype.draw = function(ctx, scene, bounds) {
    var marktype = scene.marktype,
        renderer = vg.canvas.marks.draw[marktype];
    renderer.call(this, ctx, scene, bounds);
  };
  
  return renderer;
})();vg.canvas.Handler = (function() {
  var handler = function(el, scene) {
    this._active = null;
    this._handlers = {};
    if (el) this.initialize(el);
    if (scene) this.scene(scene);
  };
  
  var prototype = handler.prototype;

  prototype.initialize = function(el, pad) {
    this._el = d3.select(el).node();
    this._canvas = d3.select(el).select("canvas").node();
    this._padding = pad;
    
    // add event listeners
    var canvas = this._canvas, that = this;
    events.forEach(function(type) {
      canvas.addEventListener(type, function(evt) {
        prototype[type].call(that, evt);
      });
    });
    
    return this;
  };
  
  prototype.scene = function(scene) {
    if (!arguments.length) return this._scene;
    this._scene = scene;
    return this;
  };

  // setup events
  var events = [
    "mousedown",
    "mouseup",
    "click",
    "dblclick",
    "wheel",
    "keydown",
    "keypress",
    "keyup",
    "mousewheel"
  ];
  events.forEach(function(type) {
    prototype[type] = function(evt) {
      this.fire(type, evt);
    };
  });
  events.push("mousemove");

  function eventName(name) {
    var i = name.indexOf(".");
    return i < 0 ? name : name.slice(0,i);
  }
  
  function arrayEquals(a, b) {
    if (a == null || b == null || a.length !== b.length)
      return false;
    for (var i=0, len=a.length; i<len; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  prototype.mousemove = function(evt) {
    var pad = this._padding,
        b = evt.target.getBoundingClientRect(),
        x = evt.clientX - b.left,
        y = evt.clientY - b.top,
        a = this._active,
        p = this.pick(this._scene.root(), x, y, x-pad.left, y-pad.top);

    if (arrayEquals(p, a)) {
      this.fire("mousemove", evt);
      return;
    } else if (a) {
      this.fire("mouseout", evt);
    }
    this._active = p;
    if (p) {
      this.fire("mouseover", evt);
    }
  };

  // to keep firefox happy
  prototype.DOMMouseScroll = function(evt) {
    this.fire("mousewheel", evt);
  };

  // fire an event
  prototype.fire = function(type, evt) {
    var a = this._active,
        h = this._handlers[type];
    if (a && h) {
      a = a ? {item: a[0], path: a} : a;
      for (var i=0, len=h.length; i<len; ++i) {
        h[i].handler.call(null, evt, a);
      }
    }
  };

  // add an event handler
  prototype.on = function(type, handler) {
    var name = eventName(type),
        h = this._handlers;
    h = h[name] || (h[name] = []);
    h.push({
      type: type,
      handler: handler
    });
    return this;
  };

  // remove an event handler
  prototype.off = function(type, handler) {
    var name = eventName(type),
        h = this._handlers[name];
    if (!h) return;
    for (var i=h.length; --i>=0;) {
      if (h[i].type !== type) continue;
      if (!handler || h[i].handler === handler) h.splice(i, 1);
    }
    return this;
  };
  
  // retrieve the current canvas context
  prototype.context = function() {
    return this._canvas.getContext("2d");
  };
  
  // find the scenegraph item at the current mouse position
  // returns an array of scenegraph items, from leaf node up to the root
  // x, y -- the absolute x, y mouse coordinates on the canvas element
  // gx, gy -- the relative coordinates within the current group
  prototype.pick = function(scene, x, y, gx, gy) {
    var g = this.context(),
        marktype = scene.marktype,
        picker = vg.canvas.marks.pick[marktype];
    return picker.call(this, g, scene, x, y, gx, gy);
  };

  return handler;
})();vg.data = {};

vg.data.ingest = function(datum, index) {
  return {
    data: datum,
    index: index
  };
};

vg.data.mapper = function(func) {
  return function(data) {
    data.forEach(func);
    return data;
  }
};vg.data.read = function(data, format) {
  // TODO read formats other than JSON
  return vg.data.json(data, format);
};

vg.data.json = function(data, format) {
  var d = JSON.parse(data);
  return (format && format.property) ? d[format.property] : d;
};vg.data.geo = (function() {
  var params = [
    "center",
    "scale",
    "translate",
    "rotate",
    "precision",
    "clipAngle"
  ];

  function geo() {
    var opt = {},
        projection = "mercator",
        func = d3.geo[projection](),
        lat = vg.identity,
        lon = vg.identity,
        x = "x",
        y = "y";
    
    var map = vg.data.mapper(function(d) {
      var ll = [lon(d), lat(d)],
          xy = func(ll);
      d[x] = xy[0];
      d[y] = xy[1];
      return d;
    });

    map.func = function() {
      return func;
    };
        
    map.projection = function(p) {
      if (projection !== p) {
        projection = p;
        func = d3.geo[projection]();
        for (var name in opt) {
          func[name](opt[name]);
        }
      }
      return map;
    };

    params.forEach(function(name) {
      map[name] = function(x) {
        opt[name] = x;
        func[name](x);
        return map;
      }
    });
    
    map.lon = function(field) {
      lon = vg.accessor(field);
      return map;
    };

    map.lat = function(field) {
      lat = vg.accessor(field);
      return map;
    };
    
    map.x = function(field) {
      x = field;
      return map;
    };

    map.y = function(field) {
      y = field;
      return map;
    };    
    
    return map;
  };
  
  geo.params = params;
  return geo;
})();vg.data.geopath = function() {
  var geopath = d3.geo.path(),
      projection = "mercator",
      geojson = vg.identity,
      opt = {},
      path = "path";

  var map = vg.data.mapper(function(d) {
    d[path] = geopath(geojson(d));
    return d;
  });
  
  map.projection = function(proj) {
    if (projection !== proj) {
      projection = proj;
      var p = d3.geo[projection]();
      for (var name in opt) {
        p[name](opt[name]);
      }
      geopath.projection(p);
    }
    return map;
  };
  
  vg.data.geo.params.forEach(function(name) {
    map[name] = function(x) {
      opt[name] = x;
      (geopath.projection())[name](x);
      return map;
    }
  });
   
  map.field = function(field) {
    geojson = vg.accessor(field);
    return map;
  };

  map.path = function(field) {
    path = field;
    return map;
  };

  return map;
};vg.data.pie = function() {
  var value = vg.identity,
      start = 0,
      end = 2 * Math.PI,
      sort = false,
      startAngle = "startAngle",
      endAngle = "endAngle";

  function pie(data) {
    var values = data.map(function(d, i) { return +value(d); }),
        a = start,
        k = (end - start) / d3.sum(values),
        index = d3.range(data.length);
    
    if (sort) {
      index.sort(function(a, b) {
        return values[a] - values[b];
      });
    }
    
    index.forEach(function(i) {
      var d;
      data[i].value = (d = values[i]);
      data[i][startAngle] = a;
      data[i][endAngle] = (a += d * k);
    });
    
    return data;
  }

  pie.sort = function(b) {
    sort = b;
    return pie;
  };
       
  pie.value = function(field) {
    value = vg.accessor(field);
    return pie;
  };

  pie.startAngle = function(field) {
    startAngle = field;
    return pie;
  };
  
  pie.endAngle = function(field) {
    endAngle = field;
    return pie;
  };

  return pie;
};vg.data.zip = function() {
  var z = null,
      as = "zip",
      keys = null;

  function zip(data) {
    var src = this[z], k, d, i, len, map;
    
    if (keys) {
      map = {};
      k = keys[1];
      src.forEach(function(s) { map[s.data[k]] = s; });
    }
    
    for (k=keys[0], i=0, len=data.length; i<len; ++i) {
      d = data[i];
      d[as] = map ? map[d.data[k]] : src[i];
    }
    
    return data;
  }

  zip["with"] = function(d) {
    z = d;
    return zip;
  };

  zip.as = function(name) {
    as = name;
    return zip;
  };
       
  zip.keys = function(k) {
    keys = k;//k ? k.map(vg.accessor) : null;
    return zip;
  };

  return zip;
};vg.parse = {};vg.parse.axes = (function() {
  var ORIENT = {
    "x":      "bottom",
    "y":      "left",
    "top":    "top",
    "bottom": "bottom",
    "left":   "left",
    "right":  "right"
  };

  function axes(spec, axes, scales) {
    (spec || []).forEach(function(def, index) {
      axes[index] = axes[index] || d3.svg.axis();
      axis(def, index, axes[index], scales);
    });
  };

  function axis(def, index, axis, scales) {
    // axis scale
    if (def.scale !== undefined) {
      axis.scale(scales[def.scale]);
      axis.scaleName = def.scale;  // cache scale name
    }

    // axis orientation
    var orient = def.orient || ORIENT[def.type];
    axis.orient(orient);

    // axis values
    if (def.values !== undefined) {
      axis.tickValues(def.values);
    }

    // axis label formatting
    if (def.format !== undefined) {
      axis.tickFormat(d3.format(def.format));
    }

    // axis tick subdivision
    if (def.subdivide !== undefined) {
      axis.tickSubdivide(def.subdivide);
    }

    // axis tick padding
    if (def.tickPadding !== undefined) {
      axis.tickPadding(def.tickPadding);
    }

    // axis tick size(s)
    var size = [];
    if (def.tickSize !== undefined) {
      for (var i=0; i<3; ++i) size.push(def.tickSize);
    } else {
      size = [6, 6, 6];
    }
    if (def.tickSizeMajor !== undefined) size[0] = def.tickSizeMajor;
    if (def.tickSizeMinor !== undefined) size[1] = def.tickSizeMinor;
    if (def.tickSizeEnd   !== undefined) size[2] = def.tickSizeEnd;
    if (size.length) {
      axis.tickSize.apply(axis, size);
    }

    // tick arguments
    if (def.ticks !== undefined) {
      var ticks = vg.isArray(def.ticks) ? def.ticks : [def.ticks];
      axis.ticks.apply(axis, ticks);
    }

    // axis offset
    if (def.offset) {
      axis.offset = def.offset;
    }
  }
  
  return axes;
})();vg.parse.data = function(spec, callback) {
  var model = {
    load: {},
    flow: {}
  };
  var count = 0;
  
  function load(d) {
    return function(error, resp) {
      if (error) {
        vg.error("LOADING ERROR: " + d.url);
      } else {
        model.load[d.name] = vg.data.read(resp.responseText, d.format);
      }
      if (--count === 0) callback();
    }
  }
  
  (spec || []).forEach(function(d) {
    if (d.url) {
      count += 1;
      vg.log("LOADING: " + d.url);
      d3.xhr(d.url, load(d)); 
    }
     
    if (d.values) {
      model.load[d.name] = d.values;
    }
    
    if (d.transform) {
      model.flow[d.name] = vg.parse.dataflow(d);
    }
  });
  
  if (count === 0) setTimeout(callback, 1);
  return model;
};vg.parse.dataflow = function(def) {
  var tx = (def.transform || []).map(vg.parse.transform);
  return !tx.length ? vg.identity :
    function(data) {
      var that = this;
      return tx.reduce(function(d,t) { return t.call(that, d); }, data);
    };
};vg.parse.marks = (function() {
  
  function parse(mark) {
    var props = mark.properties,
        group = mark.marks;
    
    // parse mark property definitions
    vg.keys(props).forEach(function(k) {
      props[k] = vg.parse.properties(props[k]);
    });
        
    // parse mark data definition
    var name = mark.from.data,
        tx = vg.parse.dataflow(mark.from);
    mark.from = function(db) {
      return tx(db[name]);
    };
    
    // recurse if group type
    if (group) {
      mark.marks = group.map(parse);
    }
        
    return mark;
  }
  
  return function(marks) {
    return {
      type: "group",
      marks: vg.duplicate(marks).map(parse)
    };
  };
})();vg.parse.properties = (function() {
  function compile(spec) {
    var code = "",
        names = vg.keys(spec),
        i, len, name, ref, vars = {};
    
    for (i=0, len=names.length; i<len; ++i) {
      ref = spec[name = names[i]];
      code += (i > 0) ? "\n  " : "  ";
      code += "item."+name+" = "+valueRef(ref)+";";
      vars[name] = true;
    }
    
    if (vars.x2) {
      code += "\n  if (item.x > item.x2) { "
            + "var t = item.x; item.x = item.x2; item.x2 = t; };"
      code += "\n  item.width = (item.x2 - item.x);"
    }
    
    if (vars.y2) {
      code += "\n  if (item.y > item.y2) { "
            + "var t = item.y; item.y = item.y2; item.y2 = t; };"
      code += "\n  item.height = (item.y2 - item.y);"
    }

    return Function("item", code);
  }

  // TODO security check for strings emitted into code
  function valueRef(ref) {
    if (ref == null) return null;

    var val = ref.value !== undefined
              ? vg.str(ref.value)
              : "item.datum['data']";

    // pull value from data field?
    if (ref.field !== undefined) {
      val = "item.datum["
          + vg.array(ref.field).map(vg.str).join("][")
          + "]";
    }
    
    // run through scale function?
    if (ref.scale !== undefined) {
      var scale = "this._scales['"+ref.scale+"']";
      if (ref.band) {
        val = scale + ".rangeBand()";
      } else {
        val = scale + "(" + val + ")";
      }
    }
    
    // add offset, return value
    return val + (ref.offset ? " + "+ref.offset : "");
  }
  
  return compile;
})();vg.parse.scales = (function() {
  var LINEAR = "linear",
      ORDINAL = "ordinal",
      KEYWORD = {width: 1, height: 1};

  function scales(spec, scales, db) {
    return (spec || []).reduce(function(o, def) {
      o[def.name] = scale(def, o[def.name], db);
      return o;
    }, scales || {});
  }

  function scale(def, scale, db) {
    var type = def.type || LINEAR,
        s = scale || d3.scale[type](),
        rng = range(def, s);
    (type===ORDINAL ? ordinal : quantitative)(def, s, rng, db);
    return s;
  }
  
  function ordinal(def, scale, rng, db) {
    var domain, data, get, str;
    
    // domain
    domain = def.domain;
    if (Array.isArray(domain)) {
      scale.domain(domain);
    } else if (vg.isObject(domain)) {
      data = db[domain.data];
      get = vg.accessor(domain.field);      
      scale.domain(vg.unique(data, get));
    }

    // range
    str = typeof range[0] === 'string';
    if (def.reverse) rng = rng.reverse();
    if (str) {
      scale.range(rng); // color or shape values
    } else if (def.round || def.round===undefined) {
      scale.rangeRoundBands(rng, def.padding||0);
    } else {
      scale.rangeBands(rng, def.padding||0);
    }
  }
  
  function quantitative(def, scale, rng, db) {
    var domain, data, get;
    
    // domain
    domain = [null, null];
    if (def.domain !== undefined) {
      if (Array.isArray(def.domain)) {
        domain = def.domain.slice();
      } else if (vg.isObject(def.domain)) {
        data = db[def.domain.data];
        get = vg.accessor(def.domain.field);
        domain[0] = d3.min(data, get);
        domain[1] = d3.max(data, get);
      } else {
        domain = def.domain;
      }
    }
    if (def.domainMin !== undefined) {
      if (vg.isObject(def.domainMin)) {
        data = db[def.domainMin.data];
        get = vg.accessor(def.domainMin.field);
        domain[0] = d3.min(data, get);
      } else {
        domain[0] = def.domainMin;
      }
    }
    if (def.domainMax !== undefined) {
      if (vg.isObject(def.domainMax)) {
        data = db[def.domainMax.data];
        get = vg.accessor(def.domainMax.field);
        domain[1] = d3.max(data, get);
      } else {
        domain[1] = def.domainMax;
      }
    }
    if (def.zero || def.zero===undefined) {
      domain[0] = Math.min(0, domain[0]);
      domain[1] = Math.max(0, domain[1]);
    }
    scale.domain(domain);

    // range
    // vertical scales should flip by default, so use XOR here
    rng = (!!def.reverse) != (def.range=='height') ? rng.reverse() : rng;
    scale[def.round ? "rangeRound" : "range"](rng);

    if (def.clamp) scale.clamp(true);
    if (def.nice) scale.nice();
    if (def.exponent && def.type==="pow") scale.exponent(def.exponent);
  }
  
  function range(def) {
    var rng = [null, null];

    if (def.range !== undefined) {
      if (typeof def.range === 'string') {
        if (KEYWORD[def.range]) {
          rng = [0, def.range]
        } else {
          vg.error("Unrecogized range: "+def.range);
          return rng;
        }
      } else if (Array.isArray(def.range)) {
        rng = def.range;
      } else {
        rng = [0, def.range];
      }
    }
    if (def.rangeMin !== undefined) {
      rng[0] = def.rangeMin;
    }
    if (def.rangeMax !== undefined) {
      rng[1] = def.rangeMax;
    }
    return rng;
  }
  
  return scales;
})();vg.parse.spec = function(spec, callback) {
  
  function parse(spec) {
    var model = {
      scales: spec.scales,
      axes: spec.axes,
      marks: vg.parse.marks(spec.marks),
      data: vg.parse.data(spec.data, function() { callback(chart); })
    };

    var chart = function(el, input) {
      return new vg.View()
        .width(spec.width || 500)
        .height(spec.height || 500)
        .padding(spec.padding || {top:20, left:20, right:20, bottom:20})
        .viewport(spec.viewport || null)
        .initialize(el)
        .model(model)
        .data(model.data.load)
        .data(input);
    };
  }
  
  vg.isObject(spec) ? parse(spec) :
    d3.json(spec, function(error, json) {
      error ? vg.error(error) : parse(json);
    });
};vg.parse.transform = function(def) {
  var tx = vg.data[def.type]();
      
  vg.keys(def).forEach(function(k) {
    if (k === 'type') return;
    (tx[k])(def[k]);
  });
  
  return tx;
};vg.scene = {};

vg.scene.GROUP  = "group",
vg.scene.ENTER  = 0,
vg.scene.UPDATE = 1,
vg.scene.EXIT   = 2;
vg.scene.build = (function() {
  var GROUP  = vg.scene.GROUP,
      ENTER  = vg.scene.ENTER,
      UPDATE = vg.scene.UPDATE,
      EXIT   = vg.scene.EXIT;
  
  function build(model, db, node, parentData) {
    var data = model.from ? model.from(db) : parentData || [1];
    
    // build node and items
    node = buildNode(model, node);
    node.items = buildItems(model, data, node);
    
    // recurse if group
    if (model.type === GROUP) {
      buildGroup(model, db, node);
    }
    
    return node;
  };
  
  function buildNode(model, node) {
    node = node || {};
    node.marktype = model.type;
    node.def = model;
    return node;
  }
  
  function buildItems(model, data, node) {
    var keyf = keyFunction(model.key),
        prev = node.items || [],
        next = [],
        map = {},
        i, key, len, item, datum;

    for (i=0, len=prev.length; i<len; ++i) {
      item = prev[i];
      item._status = EXIT;
      if (keyf) map[item.key] = item;
    }
    
    for (i=0, len=data.length; i<len; ++i) {
      datum = data[i];
      key = i;
      item = keyf ? map[key = keyf(datum)] : prev[i];
      enter = item ? false : (item = {}, true);
      item._status = enter ? ENTER : UPDATE;
      item.datum = datum;
      item.key = key;
      next.push(item);
    }
    
    for (i=0, len=prev.length; i<len; ++i) {
      item = prev[i];
      if (item._status === EXIT) {
        item.key = keyf ? item.key : next.length;
        next.push(item);
      }
    }
    
    return next;
  }
  
  function buildGroup(model, db, node) {
    var groups = node.items,
        marks = model.marks,
        i, len, m, mlen, group;

    for (i=0, len=groups.length; i<len; ++i) {
      group = groups[i];
      group.items = group.items || [];
      for (m=0, mlen=marks.length; m<mlen; ++m) {
        group.items[m] = build(marks[m], db, group.items[m], group.datum);
      }
    }
  }
  
  function keyFunction(key) {
    return key ? vg.accessor(key) : null;
  }
  
  return build;
})();vg.scene.encode = (function() {
  var GROUP  = vg.scene.GROUP,
      ENTER  = vg.scene.ENTER,
      UPDATE = vg.scene.UPDATE,
      EXIT   = vg.scene.EXIT;

  function main(scene, enc, trans, request, items) {
    request
      ? update.call(this, scene, enc, trans, request, items)
      : encode.call(this, scene, enc, trans);
    return scene;
  }
  
  function update(scene, enc, trans, request, items) {
    items = vg.array(items);
    var i, len, item, prop;
    for (i=0, len=items.length; i<len; ++i) {
      item = items[i];
      prop = item.path[1].def.properties[request];
      if (prop) prop.call(this, item.item, trans);
    }
  }
  
  function encode(scene, enc, trans) {
    encodeItems.call(this, scene.items, enc, trans);
    if (scene.marktype === GROUP) {
      encodeGroup.apply(this, arguments);
    }
  }
  
  function encodeGroup(scene, enc, trans) {
    var i, len, m, mlen, group;
    for (i=0, len=scene.items.length; i<len; ++i) {
      group = scene.items[i];
      for (m=0, mlen=group.items.length; m<mlen; ++m) {
        encode.call(this, group.items[m], enc.marks[m], trans);
      }
    }
  }
  
  function encodeItems(items, enc, trans) {
    if (enc.properties == null) return;
    
    var props  = enc.properties,
        enter  = props.enter,
        update = props.update,
        exit   = props.exit,
        i, len, item;
    
    if (enter) {
      for (i=0, len=items.length; i<len; ++i) {
        item = items[i];
        if (item._status !== ENTER) continue;
        enter.call(this, item, trans);
      }
    }
    
    if (update) {
      for (i=0, len=items.length; i<len; ++i) {
        item = items[i];
        if (item._status === EXIT) continue;
        update.call(this, item, trans);
      }
    }
    
    if (exit) {
      for (i=0, len=items.length; i<len; ++i) {
        item = items[i];
        if (item._status !== EXIT) continue;
        exit.call(this, item, trans);
      }
    }
  }
  
  return main;
})();vg.scene.visit = (function() {
  function visit(scene, pre, post) {
    var i, j, len, llen, mark, retval,
        items = scene.items,
        isGroup = scene.marktype === vg.scene.GROUP;

    for (i=0, len=items.length; i<len; ++i) {
      mark = items[i];
      
      if (pre) {
        retval = pre.call(this, mark);
        if (retval) return retval;
      }
      
      if (isGroup) {
        for (j=0, llen=mark.items.length; j<llen; ++j) {
          retval = visit.call(this, mark.items[j], pre, post);
          if (retval) return retval;
        }
      }
      
      if (post) {
        retval = post.call(this, mark);
        if (retval) return retval;
      }
    }
  }
  
  return visit;
})();vg.Bounds = (function() {
  var bounds = function(b) {
    this.clear();
    if (b) this.union(b);
  };
  
  var prototype = bounds.prototype;
  
  prototype.clear = function() {
    this.x1 = +Number.MAX_VALUE;
    this.y1 = +Number.MAX_VALUE;
    this.x2 = -Number.MAX_VALUE;
    this.y2 = -Number.MAX_VALUE;
    return this;
  };
  
  prototype.set = function(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    return this;
  };

  prototype.add = function(x, y) {
    if (x < this.x1) this.x1 = x;
    if (y < this.y1) this.y1 = y;
    if (x > this.x2) this.x2 = x;
    if (y > this.y2) this.y2 = y;
    return this;
  };

  prototype.expand = function(d) {
    this.x1 -= d;
    this.y1 -= d;
    this.x2 += d;
    this.y2 += d;
    return this;
  };
  
  prototype.translate = function(x, y) {
    this.x1 += x;
    this.x2 += x;
    this.y1 += y;
    this.y2 += y;
    return this;
  };

  prototype.union = function(b) {
    if (b.x1 < this.x1) this.x1 = b.x1;
    if (b.y1 < this.y1) this.y1 = b.y1;
    if (b.x2 > this.x2) this.x2 = b.x2;
    if (b.y2 > this.y2) this.y2 = b.y2;
    return this;
  };

  prototype.intersects = function(b) {
    return b && !(
      this.x2 < b.x1 ||
      this.x1 > b.x2 ||
      this.y2 < b.y1 ||
      this.y1 > b.y2
    );
  };

  prototype.contains = function(x, y) {
    return !(
      x < this.x1 ||
      x > this.x2 ||
      y < this.y1 ||
      y > this.y2
    );
  };

  prototype.width = function() {
    return this.x2 - this.x1;
  };

  prototype.height = function() {
    return this.y2 - this.y1;
  };

  return bounds;
})();vg.Axes = (function() {  
  var axes = function() {
    this._svg = null;
    this._el = null;
    this._init = false;
  };
  
  var prototype = axes.prototype;
  
  prototype.initialize = function(el, width, height, pad) {
    this._el = el;
    this._width = width;
    this._height = height;
    this._padding = pad;

    // select axis svg element
    var axes = d3.select(el)
      .selectAll("svg.axes")
      .data([1]);
    
    // create new svg element if needed
    axes.enter()
      .append("svg")
      .style("pointer-events", "none");
    
    // initialize svg attributes
    axes
      .attr("class", "axes")
      .attr("width", width + pad.left + pad.right)
      .attr("height", height + pad.top + pad.bottom)
      .style({position:"absolute", left:0, top:0});

    var g = axes.selectAll("g").data([1]);
    g.enter().append("g");
    g.attr("transform", "translate("+pad.left+","+pad.top+")");

    this._init = false;
    return this;
  };
    
  prototype.element = function() {
    return this._el;
  };
  
  prototype.update = function(axes, scales, duration) {
    duration = duration || 0;
    var init = this._init; this._init = true;
    var dom = d3.selectAll("svg.axes").select("g");
    
    if (!init) {
      dom.selectAll('g.axis')
        .data(axes)
       .enter().append('g')
        .attr('class', function(d, i) { return 'axis axis-'+i; });
    }
    
    var sel = duration && init ? dom.transition(duration) : dom,
        width = this._width,
        height = this._height;

    sel.selectAll('g.axis')
      .attr('transform', function(axis,i) {
        var offset = axis.offset || 0, xy;
        switch(axis.orient()) {
          case 'left':   xy = [     -offset,  0]; break;
          case 'right':  xy = [width+offset,  0]; break;
          case 'bottom': xy = [0, height+offset]; break;
          case 'top':    xy = [0,       -offset]; break;
          default: xy = [0,0];
        }
        return 'translate('+xy[0]+', '+xy[1]+')';
      })
      .each(function(axis) {
        axis.scale(scales[axis.scaleName]);
        var s = d3.select(this);
        (duration && init
          ? s.transition().duration(duration)
          : s).call(axis);
      });    
  };
  
  return axes;
})();vg.Scene = (function() {
  function scene() {
    this._model = null;
    this._scales = {};
    this._axes = [];
    this._data = {};
    this._root = null;
  }
  
  var prototype = scene.prototype;
  
  prototype.model = function(model) {
    if (!arguments.length) return this._model;
    this._model = model;
    return this;
  };
  
  prototype.data = function(data) {
    if (!arguments.length) return this._data;
    var dat = this._data,
        tx = this._model ? this._model.data.flow : {};
    vg.keys(data).forEach(function(k) {
      dat[k] = tx[k] ? tx[k].call(dat, data[k]) : data[k];
    });
    return this;
  };
  
  prototype.root = function(node) {
    if (!arguments.length) return this._root;
    this._root = node;
    return this;
  };
  
  prototype.build = function() {
    this._root = vg.scene.build.call(this,
      this._model.marks, this._data, this._root);
    vg.parse.scales(this._model.scales, this._scales, this._data);
    vg.parse.axes(this._model.axes, this._axes, this._scales);
    return this;
  };
  
  prototype.encode = function(request, item) {
    vg.scene.encode.call(this, this._root,
      this._model.marks, null, request, item);
    return this;
  };
  
  prototype.visit = function(pre, post) {
    return vg.scene.visit(this._root, pre, post);
  };
  
  return scene;
})();vg.View = (function() {
  var view = function(el, width, height) {
    this._el = null;
    this._build = false;
    this._scene = new vg.Scene();
    this._width = width || 500;
    this._height = height || 500;
    this._padding = {top:0, left:0, bottom:0, right:0};
    this._viewport = null;
    if (el) this.initialize(el);
  };
  
  var prototype = view.prototype;
  
  prototype.width = function(width) {
    if (!arguments.length) return this._width;
    if (this._width !== width) {
      this._width = width;
      if (this._el) this.initialize(this._el);
    }
    return this;
  };

  prototype.height = function(height) {
    if (!arguments.length) return this._height;
    if (this._height !== height) {
      this._height = height;
      if (this._el) this.initialize(this._el);
    }
    return this;
  };

  prototype.padding = function(pad) {
    if (!arguments.length) return this._padding;
    if (this._padding !== pad) {
      this._padding = pad;
      if (this._el) this.initialize(this._el);
    }
    return this;
  };

  prototype.viewport = function(size) {
    if (!arguments.length) return this._viewport;
    if (this._viewport !== size) {
      this._viewport = size;
      if (this._el) this.initialize(this._el);
    }
    return this;
  };

  prototype.model = function(model) {
    if (!arguments.length) return this._scene.model();
    this._scene.model(model);
    return this;
  };

  prototype.data = function(data) {
    if (!arguments.length) return this._scene.data();
    var ingest = vg.keys(data).reduce(function(d, k) {
      return (d[k] = data[k].map(vg.data.ingest), d);
    }, {});
    this._scene.data(ingest);
    return this;
  };

  prototype.scene = function(scene) {
    if (!arguments.length) return this._scene;
    if (this._scene !== scene) {
      this._scene = scene;
      if (this._handler) this._handler.scene(scene);
    }
    return this;
  };

  prototype.initialize = function(el) {
    // div container
    this._el = d3.select(el)
      .style("position", "relative")
      .node();
    if (this._viewport) {
      var vw = this._viewport[0] || this._width,
          vh = this._viewport[1] || this._height;
      d3.select(el)
        .style("width", vw+"px")
        .style("height", vh+"px")
        .style("overflow", "auto");
    }
    
    // axis container
    this._axes = (this._axes || new vg.Axes)
      .initialize(this._el, this._width, this._height, this._padding);
    
    // renderer
    this._renderer = (this._renderer || new vg.canvas.Renderer())
      .initialize(this._el, this._width, this._height, this._padding);
    
    // input handler
    if (!this._handler) {
      this._handler = new vg.canvas.Handler()
        .initialize(this._el, this._padding)
        .scene(this._scene);
    }
    
    return this;
  };
  
  prototype.render = function(bounds) {
    var s = this._scene;
    this._axes.update(s._axes, s._scales);
    this._renderer.render(s.root(), bounds);
    return this;
  };
  
  prototype.on = function() {
    this._handler.on.apply(this._handler, arguments);
    return this;
  };
  
  prototype.off = function() {
    this._handler.off.apply(this._handler, arguments);
    return this;
  };
  
  prototype.update = function(request, items) {
    this._build = this._build || (this._scene.build(), true);
    this._scene.encode(request, items);
    
    function bounds() {
      return !items ? null :
        vg.array(items).reduce(function(b, x) {
          return b.union(x.item.bounds);
        }, new vg.Bounds());  
    }
    
    this.render(bounds());
    return items ? this.render(bounds()) : this;
  };
  
  return view;
})();
})();
