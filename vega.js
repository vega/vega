(function(){if (typeof vg === 'undefined') { vg = {}; }

// semantic versioning
vg.version = '1.0.0';

// type checking functions
var toString = Object.prototype.toString;

vg.isObject = function(obj) {
  return obj === Object(obj);
};

vg.isFunction = function(obj) {
  return toString.call(obj) == '[object Function]';
};

vg.isString = function(obj) {
  return toString.call(obj) == '[object String]';
};
  
vg.isArray = Array.isArray || function(obj) {
  return toString.call(obj) == '[object Array]';
};

vg.isNumber = function(obj) {
  return toString.call(obj) == '[object Number]';
};

vg.isBoolean = function(obj) {
  return toString.call(obj) == '[object Boolean]';
};

vg.number = function(s) { return +s; }

vg.boolean = function(s) { return !!s; }

// utility functions

vg.identity = function(x) { return x; };

vg.extend = function(obj) {
  for (var x, name, i=1, len=arguments.length; i<len; ++i) {
    x = arguments[i];
    for (name in x) { obj[name] = x[name]; }
  }
  return obj;
};

vg.duplicate = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

vg.field = function(f) {
  return f.split("\\.")
    .map(function(d) { return d.split("."); })
    .reduce(function(a, b) {
      if (a.length) { a[a.length-1] += "." + b.shift(); }
      a.push.apply(a, b);
      return a;
    }, []);
}

vg.accessor = function(f) {
  var s;
  return (vg.isFunction(f) || f==null)
    ? f : vg.isString(f) && (s=vg.field(f)).length > 1
    ? function(x) { return s.reduce(function(x,f) { return x[f]; }, x); }
    : function(x) { return x[f]; };
};

vg.comparator = function(sort) {
  var sign = [];
  if (sort === undefined) sort = [];
  sort = vg.array(sort).map(function(f) {
    var s = 1;
    if      (f[0] === "-") { s = -1; f = f.slice(1); }
    else if (f[0] === "+") { s = +1; f = f.slice(1); }
    sign.push(s);
    return vg.accessor(f);
  });
  return function(a,b) {
    var i, n, f, x, y;
    for (i=0, n=sort.length; i<n; ++i) {
      f = sort[i], x = f(a), y = f(b);
      if (x < y) return -1 * sign[i];
      if (x > y) return sign[i];
    }
    return 0;
  };
};

vg.numcmp = function(a, b) { return a - b; };

vg.array = function(x) {
  return x != null ? (vg.isArray(x) ? x : [x]) : [];
};

vg.values = function(x) {
  return (vg.isObject(x) && !vg.isArray(x) && x.values) ? x.values : x;
};

vg.str = function(str) {
  return vg.isArray(str)
    ? "[" + str.map(vg.str) + "]"
    : vg.isString(str) ? ("'"+str+"'") : str;
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

// Colors

vg.category10 = [
	"#1f77b4",
	"#ff7f0e",
	"#2ca02c",
	"#d62728",
	"#9467bd",
	"#8c564b",
	"#e377c2",
	"#7f7f7f",
	"#bcbd22",
	"#17becf"
];

vg.category20 = [
	"#1f77b4",
	"#aec7e8",
	"#ff7f0e",
	"#ffbb78",
	"#2ca02c",
	"#98df8a",
	"#d62728",
	"#ff9896",
	"#9467bd",
	"#c5b0d5",
	"#8c564b",
	"#c49c94",
	"#e377c2",
	"#f7b6d2",
	"#7f7f7f",
	"#c7c7c7",
	"#bcbd22",
	"#dbdb8d",
	"#17becf",
	"#9edae5"
];

vg.shapes = [
  "circle",
  "cross",
  "diamond",
  "square",
  "triangle-down",
  "triangle-up"
];

// Logging
vg.log = function(msg) {
  console.log(msg);
};

vg.error = function(msg) {
  console.log(msg);
  alert(msg);
};vg.Bounds = (function() {
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
  
  prototype.round = function() {
    this.x1 = Math.floor(this.x1);
    this.y1 = Math.floor(this.y1);
    this.x2 = Math.ceil(this.x2);
    this.y2 = Math.ceil(this.y2);
    return this;
  };

  prototype.translate = function(dx, dy) {
    this.x1 += dx;
    this.x2 += dx;
    this.y1 += dy;
    this.y2 += dy;
    return this;
  };
  
  prototype.rotate = function(angle, x, y) {
    var cos = Math.cos(angle),
        sin = Math.sin(angle),
        cx = x - x*cos + y*sin,
        cy = y - x*sin - y*cos,
        x1 = this.x1, x2 = this.x2,
        y1 = this.y1, y2 = this.y2;

    return this.clear()
      .add(cos*x1 - sin*y1 + cx,  sin*x1 + cos*y1 + cy)
      .add(cos*x1 - sin*y2 + cx,  sin*x1 + cos*y2 + cy)
      .add(cos*x2 - sin*y1 + cx,  sin*x2 + cos*y1 + cy)
      .add(cos*x2 - sin*y2 + cx,  sin*x2 + cos*y2 + cy);
  }

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
})();vg.canvas = {};vg.canvas.path = (function() {

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
      tan30 = Math.tan(30 * Math.PI / 180),
      tmpBounds = new vg.Bounds();

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
      lw = (lw = o.strokeWidth) != undefined ? lw : 1;
      if (lw > 0) {
        g.globalAlpha = (opac=o.strokeOpacity) != undefined ? opac : 1;
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

      if (fill = o.fill) {
        g.globalAlpha = (opac = o.fillOpacity) != undefined ? opac : 1;
        g.fillStyle = fill;
        g.fillRect(x, y, o.width, o.height);
      }

      if (stroke = o.stroke) {
        lw = (lw = o.strokeWidth) != undefined ? lw : 1;
        if (lw > 0) {
          g.globalAlpha = (opac = o.strokeOpacity) != undefined ? opac : 1;
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

      g.globalAlpha = (opac = o.fillOpacity) != undefined ? opac : 1;
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
        g.globalAlpha = (opac = o.fillOpacity) != undefined ? opac : 1;
        g.fillStyle = fill;
        g.fillText(o.text, x, y);
      }
      
      if (stroke = o.stroke) {
        lw = (lw = o.strokeWidth) != undefined ? lw : 1;
        if (lw > 0) {
          g.globalAlpha = (opac = o.strokeOpacity) != undefined ? opac : 1;
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
    if (!o.angle)
      return true; // bounds sufficient if no rotation

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
      .selectAll("canvas.vega")
      .data([1]);
    
    // create new canvas element if needed
    canvas.enter()
      .append("canvas")
      .attr("class", "vega");
    
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
    
  function getBounds(items) {
    return !items ? null :
      vg.array(items).reduce(function(b, item) {
        return b.union(vg.scene.bounds(item));
      }, new vg.Bounds());  
  }
  
  function setBounds(g, bounds) {
    var bbox = null;
    if (bounds) {
      bbox = (new vg.Bounds(bounds)).round();
      g.beginPath();
      g.rect(bbox.x1, bbox.y1, bbox.width(), bbox.height());
      g.clip();
    }
    return bbox;
  }
  
  prototype.render = function(scene, items) {
    var t0 = Date.now();
    var g = this._ctx,
        pad = this._padding,
        w = this._width + pad.left + pad.right,
        h = this._width + pad.top + pad.bottom,
        bb = null;

    // setup
    this._scene = scene;
    g.save();
    bb = setBounds(g, getBounds(items));
    g.clearRect(-pad.left, -pad.top, w, h);
    
    // render
    this.draw(g, scene, bb);

    // render again to handle possible bounds change
    if (items) {
      g.restore();
      g.save();
      bb = setBounds(g, getBounds(items));
      g.clearRect(-pad.left, -pad.top, w, h);
      this.draw(g, scene, bb);
    }
    
    // takedown
    g.restore();
    this._scene = null;
    
    var t1 = Date.now();
    vg.log("RENDER TIME: " + (t1-t0));
  };
  
  prototype.draw = function(ctx, scene, bounds) {
    var marktype = scene.marktype,
        renderer = vg.canvas.marks.draw[marktype];
    renderer.call(this, ctx, scene, bounds);
  };
  
  prototype.renderAsync = function(scene) {
    // TODO make safe for multiple scene rendering?
    var renderer = this;
    if (renderer._async_id) {
      clearTimeout(renderer._async_id);
    }
    renderer._async_id = setTimeout(function() {
      renderer.render(scene);
      delete renderer._async_id;
    }, 50);
  };
  
  prototype.loadImage = function(uri) {
    var renderer = this,
        scene = this._scene;
    
    var image = new Image();
    image.onload = function() {
      vg.log("LOAD IMAGE: "+this.src);
      renderer.renderAsync(scene);
    };
    image.src = uri;
    return image;
  };
  
  return renderer;
})();vg.canvas.Handler = (function() {
  var handler = function(el, model) {
    this._active = null;
    this._handlers = {};
    if (el) this.initialize(el);
    if (model) this.model(model);
  };
  
  var prototype = handler.prototype;

  prototype.initialize = function(el, pad, obj) {
    this._el = d3.select(el).node();
    this._canvas = d3.select(el).select("canvas.vega").node();
    this._padding = pad;
    this._obj = obj || null;
    
    // add event listeners
    var canvas = this._canvas, that = this;
    events.forEach(function(type) {
      canvas.addEventListener(type, function(evt) {
        prototype[type].call(that, evt);
      });
    });
    
    return this;
  };
  
  prototype.model = function(model) {
    if (!arguments.length) return this._model;
    this._model = model;
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
  events.push("mouseout");

  function eventName(name) {
    var i = name.indexOf(".");
    return i < 0 ? name : name.slice(0,i);
  }

  prototype.mousemove = function(evt) {
    var pad = this._padding,
        b = evt.target.getBoundingClientRect(),
        x = evt.clientX - b.left,
        y = evt.clientY - b.top,
        a = this._active,
        p = this.pick(this._model.scene(), x, y, x-pad.left, y-pad.top);

    if (p === a) {
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
  
  prototype.mouseout = function(evt) {
    if (this._active) {
      this.fire("mouseout", evt);
    }
    this._active = null;
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
      for (var i=0, len=h.length; i<len; ++i) {
        h[i].handler.call(this._obj, evt, a);
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
})();vg.svg = {};vg.svg.marks = (function() {

  function x(o)     { return o.x || 0; }
  function y(o)     { return o.y || 0; }
  function yh(o)    { return o.y + o.height || 0; }
  function key(o)   { return o.key; }
  function size(o)  { return o.size==null ? 100 : o.size; }
  function shape(o) { return o.shape || "circle"; }
      
  var arc_path    = d3.svg.arc(),
      area_path   = d3.svg.area().x(x).y1(y).y0(yh),
      line_path   = d3.svg.line().x(x).y(y),
      symbol_path = d3.svg.symbol().type(shape).size(size);
  
  var textAlign = {
    "left":   "start",
    "center": "middle",
    "right":  "end"
  };
  
  var styles = {
    "fill":          "fill",
    "fillOpacity":   "fill-opacity",
    "stroke":        "stroke",
    "strokeWidth":   "stroke-width",
    "strokeOpacity": "stroke-opacity",
    "opacity":       "opacity"
  };
  
  var styleProps = vg.keys(styles);
  
  function style(d) {
    var o = d.mark ? d : d[0],
        i, n, prop, name, value;
    for (i=0, n=styleProps.length; i<n; ++i) {
      prop = styleProps[i];
      name = styles[prop];
      value = o[prop];
      if (value == null) {
        if (name === "fill") this.style.setProperty(name, "none", null);
        else this.style.removeProperty(name);
      }
      else this.style.setProperty(name, value, null);
    }
  }
  
  function arc(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
    this.setAttribute("d", arc_path(o));
  }
  
  function area(items) {
    var o = items[0];
    area_path
      .interpolate(o.interpolate || "linear")
      .tension(o.tension == undefined ? 0.7 : o.tension);
    this.setAttribute("d", area_path(items));
  }
  
  function line(items) {
    var o = items[0];
    line_path
      .interpolate(o.interpolate || "linear")
      .tension(o.tension == undefined ? 0.7 : o.tension);
    this.setAttribute("d", line_path(items));
  }
  
  function path(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
    this.setAttribute("d", o.path);
  }

  function rect(o) {
    this.setAttribute("x", o.x || 0);
    this.setAttribute("y", o.y || 0);
    this.setAttribute("width", o.width || 0);
    this.setAttribute("height", o.height || 0);
  }
  
  function symbol(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
    this.setAttribute("d", symbol_path(o));
  }
  
  function image(o) {
    var w = o.width || (o.image && o.image.width) || 0,
        h = o.height || (o.image && o.image.height) || 0,
        x = o.x - (o.align === "center"
          ? w/2 : (o.align === "right" ? w : 0)),
        y = o.y - (o.baseline === "middle"
          ? h/2 : (o.baseline === "bottom" ? h : 0));
    
    this.setAttributeNS("http://www.w3.org/1999/xlink", "href", o.url);
    this.setAttribute("x", x);
    this.setAttribute("y", y);
    this.setAttribute("width", w);
    this.setAttribute("height", h);
  }
    
  function fontString(o) {
    return (o.fontStyle ? o.fontStyle + " " : "")
      + (o.fontVariant ? o.fontVariant + " " : "")
      + (o.fontWeight ? o.fontWeight + " " : "")
      + (o.fontSize != undefined ? o.fontSize + "px " : "11px ")
      + (o.font || "sans-serif");
  }
  
  function text(o) {
    var x = o.x || 0,
        y = o.y || 0,
        dx = o.dx || 0,
        dy = o.dy || 0,
        a = o.angle || 0,
        align = textAlign[o.align || "left"],
        base = o.baseline==="top" ? ".9em"
             : o.baseline==="middle" ? ".35em" : 0;
  
    this.setAttribute("x", x + dx);
    this.setAttribute("y", y + dy);
    this.setAttribute("dy", dy);
    this.setAttribute("text-anchor", align);
    
    if (a) this.setAttribute("transform", "rotate("+a+" "+x+","+y+")");
    else this.removeAttribute("transform");
    
    if (base) this.setAttribute("dy", base);
    else this.removeAttribute("dy");
    
    this.textContent = o.text;
    this.style.setProperty("font", fontString(o), null);
  }
  
  function group(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
  }

  function draw(tag, attr, nest) {
    return function(g, scene, index) {
      drawMark(g, scene, index, "mark_", tag, attr, nest);
    };
  }
  
  var mark_id = 0;
  
  function drawMark(g, scene, index, prefix, tag, attr, nest) {
    var className = prefix + index,
        data = nest ? [scene.items] : scene.items,
        p = g.select("."+className);

    if (p.empty()) p = g.append("g")
      .attr("id", "g"+(++mark_id))
      .attr("class", className);

    var id = "#" + p.attr("id");
    var m = p.selectAll(id+" > "+tag).data(data);  
    var e = m.enter().append(tag);
    if (tag !== "g") e.each(function(d) {
      (d.mark ? d : d[0])._svg = this;
    });
    
    m.exit().remove();
    m.each(attr);
    if (tag !== "g") m.each(style);
  }

  function drawGroup(g, scene, index) {
    var renderer = this;
        
    drawMark(g, scene, index, "mark_", "rect", rect);
    drawMark(g, scene, index, "group_", "g", group);

    var x = g.select(".group_"+index).node(), i, n, j, m;
    for (var i=0, n=x.childNodes.length; i<n; ++i) {
      var sel = d3.select(x.childNodes[i]),
          items = x.childNodes[i].__data__.items;
      for (var j=0, m=items.length; j<m; ++j) {
        renderer.draw(sel, items[j], j);
      }
    }
  }

  return {
    update: {
      group:   rect,
      area:    area,
      line:    line,
      arc:     arc,
      path:    path,
      symbol:  symbol,
      rect:    rect,
      text:    text,
      image:   image
    },
    nested: {
      "area": true,
      "line": true
    },
    style: style,
    draw: {
      group:   drawGroup,
      area:    draw("path", area, true),
      line:    draw("path", line, true),
      arc:     draw("path", arc),
      path:    draw("path", path),
      symbol:  draw("path", symbol),
      rect:    draw("rect", rect),
      text:    draw("text", text),
      image:   draw("image", image),
      draw:    draw // expose for extensibility
    }
  };
  
})();vg.svg.Renderer = (function() {  
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

    // remove any existing svg element
    d3.select(el).select("svg.vega").remove();

    // create svg element and initialize attributes
    var svg = d3.select(el)
      .append("svg")
      .attr("class", "vega")
      .attr("width", width + pad.left + pad.right)
      .attr("height", height + pad.top + pad.bottom);
    
    // set the svg root group
    this._ctx = svg.append("g")
      .attr("transform", "translate("+pad.left+","+pad.top+")");
    
    return this;
  };
  
  prototype.context = function() {
    return this._ctx;
  };
  
  prototype.element = function() {
    return this._el;
  };
  
  prototype.render = function(scene, items) {
    if (items) this.renderItems(vg.array(items));
    else this.draw(this._ctx, scene, 0);
  };
  
  prototype.renderItems = function(items) {
    var item, node, type, nest, i, n,
        marks = vg.svg.marks;

    for (i=0, n=items.length; i<n; ++i) {
      item = items[i];
      node = item._svg;
      type = item.mark.marktype;

      item = marks.nested[type] ? item.mark.items : item;
      marks.update[type].call(node, item);
      marks.style.call(node, item);
    }
  }
  
  prototype.draw = function(ctx, scene, index) {
    var marktype = scene.marktype,
        renderer = vg.svg.marks.draw[marktype];
    renderer.call(this, ctx, scene, index);
  };
  
  return renderer;
})();vg.svg.Handler = (function() {
  var handler = function(el, model) {
    this._active = null;
    this._handlers = {};
    if (el) this.initialize(el);
    if (model) this.model(model);
  };
  
  function svgHandler(handler) {
    var that = this;
    return function(evt) {
      var target = evt.target,
          item = target.__data__;
      if (item) {
        item = item.mark ? item : item[0];
        handler.call(that._obj, evt, item);
      }
    };
  }
  
  function eventName(name) {
    var i = name.indexOf(".");
    return i < 0 ? name : name.slice(0,i);
  }
  
  var prototype = handler.prototype;

  prototype.initialize = function(el, pad, obj) {
    this._el = d3.select(el).node();
    this._svg = d3.select(el).select("svg.vega").node();
    this._padding = pad;
    this._obj = obj || null;
    return this;
  };
  
  prototype.model = function(model) {
    if (!arguments.length) return this._model;
    this._model = model;
    return this;
  };

  // add an event handler
  prototype.on = function(type, handler) {
    var name = eventName(type),
        h = this._handlers,
        dom = d3.select(this._svg).node();
        
    var x = {
      type: type,
      handler: handler,
      svg: svgHandler.call(this, handler)
    };
    h = h[name] || (h[name] = []);
    h.push(x);

    dom.addEventListener(name, x.svg);
    return this;
  };

  // remove an event handler
  prototype.off = function(type, handler) {
    var name = eventName(type),
        h = this._handlers[name],
        dom = d3.select(this._svg).node();
    if (!h) return;
    for (var i=h.length; --i>=0;) {
      if (h[i].type !== type) continue;
      if (!handler || h[i].handler === handler) {
        dom.removeEventListener(name, h[i].svg);
        h.splice(i, 1);
      }
    }
    return this;
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
};

vg.data.size = function(size, group) {
  size = Array.isArray(size) ? size : [0, size];
  size = size.map(function(d) {
    return (typeof d === 'string') ? group[d] : d;
  });
  return size;
};vg.data.read = (function() {
  var formats = {},
      parsers = {
        "number": vg.number,
        "boolean": vg.boolean
      };

  function read(data, format) {
    var type = (format && format.type) || "json";
    return formats[type](data, format);
  }

  formats.json = function(data, format) {
    var d = JSON.parse(data);
    if (format && format.property) {
      d = vg.accessor(format.property)(d);
    }
    return d;
  };

  formats.csv = function(data, format) {
    var d = d3.csv.parse(data);
    if (format.parse) parseValues(d, format.parse);
    return d;
  };

  formats.tsv = function(data, format) {
    var d = d3.tsv.parse(data);
    if (format.parse) parseValues(d, format.parse);
    return d;
  };
  
  function parseValues(data, types) {
    var cols = vg.keys(types),
        p = cols.map(function(col) { return parsers[types[col]]; }),
        d, i, j, len, clen;

    for (i=0, len=data.length; i<len; ++i) {
      d = data[i];
      for (j=0, clen=cols.length; j<clen; ++j) {
        d[cols[j]] = p[j](d[cols[j]]);
      }
    }
  }

  read.formats = formats;
  return read;
})();vg.data.array = function() {
  var fields = [];
   
  function array(data) {
    return data.map(function(d) {      
      var list = [];
      for (var i=0, len=fields.length; i<len; ++i) {
        list.push(fields[i](d));
      }
      return list;
    });
  }
  
  array.fields = function(fieldList) {
    fields = vg.array(fieldList).map(vg.accessor);
    return array;
  };
  
  return array;
};vg.data.copy = function() {
  var from = vg.accessor("data"),
      fields = [],
      as = null;
  
  var copy = vg.data.mapper(function(d) {
    var src = from(d), i, len,
        source = fields,
        target = as || fields;
    for (i=0, len=fields.length; i<len; ++i) {
      d[target[i]] = src[fields[i]];
    }
    return d;
  });

  copy.from = function(field) {
    from = vg.accessor(field);
    return copy;
  };
  
  copy.fields = function(fieldList) {
    fields = vg.array(fieldList);
    return copy;
  };
  
  copy.as = function(fieldList) {
    as = vg.array(fieldList);
    return copy;
  };

  return copy;
};vg.data.facet = function() {

  var keys = [],
      sort = null;

  function facet(data) {
    var result = {
          key: "",
          keys: [],
          values: []
        },
        map = {"": result}, 
        vals = result.values,
        obj, klist, kstr, len, i, j, k, kv, cmp;

    for (i=0, len=data.length; i<len; ++i) {
      for (k=0, klist=[], kstr=""; k<keys.length; ++k) {
        kv = keys[k](data[i]);
        klist.push(kv);
        kstr += (k>0 ? "|" : "") + String(kv);
      }
      obj = map[kstr];
      if (obj === undefined) {
        vals.push(obj = map[kstr] = {
          key: kstr,
          keys: klist,
          index: vals.length,
          values: []
        });
      }
      obj.values.push(data[i]);
    }

    if (sort) {
      for (i=0, len=vals.length; i<len; ++i) {
        vals[i].values.sort(sort);
      }
    }

    return result;
  }
  
  facet.keys = function(k) {
    keys = vg.array(k).map(vg.accessor);
    return facet;
  };
  
  facet.sort = function(s) {
    sort = vg.comparator(s);
    return facet;
  };

  return facet;
};vg.data.filter = function() {

  var test = null;

  function filter(data) {
    return test ? data.filter(test) : data;
  }
  
  filter.test = function(t) {
    // TODO security check
    test = (typeof t === 'function')
      ? t
      : new Function("d", "return " + t);
    return filter;
  };

  return filter;
};vg.data.fold = function() {
  var folds = [],
      accessors = [],
      key_as = "key", value_as = "value";

  function fold(data) {
    var values = [];

    for(var i=0; i<data.length; ++i) {
      for(var j=0; j<folds.length; ++j) {
        var o = {
          index: values.length,
          data: data[i].data
        };
        o[key_as] = folds[j];
        o[value_as] = accessors[j](data[i]);
        values.push(o);
      }
    }

    return values;
  }  

  fold.folds = function(f) {
    folds = vg.array(f);
    accessors = folds.map(vg.accessor);
    return fold;
  };

  fold.key_as = function(x) {
    key_as = x;
    return fold;
  };

  fold.value_as = function(x) {
    value_as = x;
    return fold;
  };

  return fold;
};vg.data.force = function() {
  var layout = d3.layout.force(),
      links = null,
      linkDistance = 20,
      linkStrength = 1,
      charge = -30,
      iterations = 500,
      size = ["width", "height"],
      params = [
        "friction",
        "theta",
        "gravity",
        "alpha"
      ];

  function force(data, db, group) {    
    layout
      .size(vg.data.size(size, group))
      .nodes(data);
      
    if (links && db[links]) {
      layout.links(db[links]);
    }

    layout.start();      
    for (var i=0; i<iterations; ++i) {
      layout.tick();
    }
    layout.stop();
    
    return data;
  }

  force.links = function(dataSetName) {
    links = dataSetName;
    return force;
  };
  
  force.size = function(sz) {
    size = sz;
    return force;
  };
       
  force.linkDistance = function(field) {
    linkDistance = typeof field === 'number'
      ? field
      : vg.accessor(field);
    layout.linkDistance(linkDistance);
    return force;
  };

  force.linkStrength = function(field) {
    linkStrength = typeof field === 'number'
      ? field
      : vg.accessor(field);
    layout.linkStrength(linkStrength);
    return force;
  };
  
  force.charge = function(field) {
    charge = typeof field === 'number'
      ? field
      : vg.accessor(field);
    layout.charge(charge);
    return force;
  };
  
  force.iterations = function(iter) {
    iterations = iter;
    return force;
  };

  params.forEach(function(name) {
    force[name] = function(x) {
      layout[name](x);
      return force;
    }
  });

  return force;
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
        output = {
          "x": "x",
          "y": "y"
        };
    
    var map = vg.data.mapper(function(d) {
      var ll = [lon(d), lat(d)],
          xy = func(ll);
      d[output.x] = xy[0];
      d[output.y] = xy[1];
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
    
    map.output = function(map) {
      vg.keys(output).forEach(function(k) {
        if (map[k] !== undefined) {
          output[k] = map[k];
        }
      });
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
      output = {"path": "path"};

  var map = vg.data.mapper(function(d) {
    d[output.path] = geopath(geojson(d));
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
   
  map.value = function(field) {
    geojson = vg.accessor(field);
    return map;
  };

  map.output = function(map) {
    vg.keys(output).forEach(function(k) {
      if (map[k] !== undefined) {
        output[k] = map[k];
      }
    });
    return map;
  };

  return map;
};vg.data.link = function() {
  var shape = "line",
      source = vg.accessor("source"),
      target = vg.accessor("target"),
      tension = 0.2,
      output = {"path": "path"};
  
  function line(d) {
    var s = source(d),
        t = target(d);
    return "M" + s.x + "," + s.y 
         + "L" + t.x + "," + t.y;
  }

  function curve(d) {
    var s = source(d),
        t = target(d),
        dx = t.x - s.x,
        dy = t.y - s.y,
        ix = tension * (dx + dy),
        iy = tension * (dy - dx);
    return "M" + s.x + "," + s.y
         + "C" + (s.x+ix) + "," + (s.y+iy)
         + " " + (t.x+iy) + "," + (t.y-ix)
         + " " + t.x + "," + t.y;
  }
  
  function diagonalX(d) {
    var s = source(d),
        t = target(d),
        m = (s.x + t.x) / 2;
    return "M" + s.x + "," + s.y
         + "C" + m   + "," + s.y
         + " " + m   + "," + t.y
         + " " + t.x + "," + t.y;
  }

  function diagonalY(d) {
    var s = source(d),
        t = target(d),
        m = (s.y + t.y) / 2;
    return "M" + s.x + "," + s.y
         + "C" + s.x + "," + m
         + " " + t.x + "," + m
         + " " + t.x + "," + t.y;
  }

  var shapes = {
    line:      line,
    curve:     curve,
    diagonal:  diagonalX,
    diagonalX: diagonalX,
    diagonalY: diagonalY
  };
  
  function link(data) {
    var path = shapes[shape];
        
    data.forEach(function(d) {
      d[output.path] = path(d);
    });
    
    return data;
  }

  link.shape = function(val) {
    shape = val;
    return link;
  };

  link.tension = function(val) {
    tension = val;
    return link;
  };
  
  link.source = function(field) {
    source = vg.accessor(field);
    return link;
  };
  
  link.target = function(field) {
    target = vg.accessor(field);
    return link;
  };
  
  link.output = function(map) {
    vg.keys(output).forEach(function(k) {
      if (map[k] !== undefined) {
        output[k] = map[k];
      }
    });
    return link;
  };
  
  return link;
};vg.data.pie = function() {
  var value = vg.accessor("data"),
      start = 0,
      end = 2 * Math.PI,
      sort = false,
      output = {
        "startAngle": "startAngle",
        "endAngle": "endAngle"
      };

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
      data[i][output.startAngle] = a;
      data[i][output.endAngle] = (a += d * k);
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

  pie.output = function(map) {
    vg.keys(output).forEach(function(k) {
      if (map[k] !== undefined) {
        output[k] = map[k];
      }
    });
    return pie;
  };

  return pie;
};vg.data.sort = function() {
  var by = null;

  function sort(data) {
    (vg.isArray(data) ? data : data.values || []).sort(by);
    return data;
  }
  
  sort.by = function(s) {
    by = vg.comparator(s);
    return sort;
  };

  return sort;
};vg.data.stack = function() {
  var layout = d3.layout.stack()
                 .values(function(d) { return d.values; }),
      point = null,
      height = null,
      params = ["offset", "order"],
      output = {
        "y0": "y2",
        "y1": "y"
      };

  function stack(data) {
    var out_y0 = output["y0"],
        out_y1 = output["y1"];
    
    return layout
      .x(point)
      .y(height)
      .out(function(d, y0, y) {
        d[out_y0] = y0;
        d[out_y1] = y + y0;
      })
      (data.values);
  }
       
  stack.point = function(field) {
    point = vg.accessor(field);
    return stack;
  };
  
  stack.height = function(field) {
    height = vg.accessor(field);
    return stack;
  };

  params.forEach(function(name) {
    stack[name] = function(x) {
      layout[name](x);
      return stack;
    }
  });

  stack.output = function(map) {
    d3.keys(output).forEach(function(k) {
      if (map[k] !== undefined) {
        output[k] = map[k];
      }
    });
    return stack;
  };

  return stack;
};vg.data.stats = function() {
  var value = vg.accessor("data"),
      median = false,
      output = {
        "count":    "count",
        "min":      "min",
        "max":      "max",
        "sum":      "sum",
        "mean":     "mean",
        "variance": "variance",
        "stdev":    "stdev",
        "median":   "median"
      };
  
  function reduce(data) {
    var min = +Infinity,
        max = -Infinity,
        sum = 0,
        mean = 0,
        M2 = 0,
        i, len, v, delta;

    var list = (vg.isArray(data) ? data : data.values || []).map(value);
    
    // compute aggregates
    for (i=0, len=list.length; i<len; ++i) {
      v = list[i];
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
      delta = v - mean;
      mean = mean + delta / (i+1);
      M2 = M2 + delta * (v - mean);
    }
    M2 = M2 / (len - 1);
    
    var o = vg.isArray(data) ? {} : data;
    if (median) {
      list.sort(vg.numcmp);
      i = list.length >> 1;
      o[output.median] = list.length % 2
        ? list[i]
        : (list[i-1] + list[i])/2;
    }
    o[output.count] = len;
    o[output.min] = min;
    o[output.max] = max;
    o[output.sum] = sum;
    o[output.mean] = mean;
    o[output.variance] = M2;
    o[output.stdev] = Math.sqrt(M2);
    return o;
  }
  
  function stats(data) {
    return (Array.isArray(data) ? [data] : data.values || [])
      .map(reduce); // no pun intended
  }
  
  stats.median = function(bool) {
    median = bool || false;
    return stats;
  };
  
  stats.value = function(field) {
    value = vg.accessor(field);
    return stats;
  };
  
  stats.output = function(map) {
    vg.keys(output).forEach(function(k) {
      if (map[k] !== undefined) {
        output[k] = map[k];
      }
    });
    return stats;
  };
  
  return stats;
};vg.data.treemap = function() {
  var layout = d3.layout.treemap()
                 .children(function(d) { return d.values; }),
      value = vg.accessor("data"),
      size = ["width", "height"],
      params = ["round", "sticky", "ratio", "padding"],
      output = {
        "x": "x",
        "y": "y",
        "dx": "width",
        "dy": "height"
      };

  function treemap(data, db, group) {
    data = layout
      .size(vg.data.size(size, group))
      .value(value)
      .nodes(data);
    
    var keys = vg.keys(output),
        len = keys.length;
    data.forEach(function(d) {
      var key, val;
      for (var i=0; i<len; ++i) {
        key = keys[i];
        if (key !== output[key]) {
          val = d[key];
          delete d[key];
          d[output[key]] = val;
        }
      }
    });
    
    return data;
  }

  treemap.size = function(sz) {
    size = sz;
    return treemap;
  };

  treemap.value = function(field) {
    value = vg.accessor(field);
    return treemap;
  };

  params.forEach(function(name) {
    treemap[name] = function(x) {
      layout[name](x);
      return treemap;
    }
  });

  treemap.output = function(map) {
    vg.keys(output).forEach(function(k) {
      if (map[k] !== undefined) {
        output[k] = map[k];
      }
    });
    return treemap;
  };

  return treemap;
};vg.data.unique = function() {

  var field = null,
      as = "field";

  function unique(data) {
    return vg.unique(data, field)
      .map(function(x) {
        var o = {};
        o[as] = x;
        return o;
      });
  }
  
  unique.field = function(f) {
    field = vg.accessor(f);
    return unique;
  };
  
  unique.as = function(x) {
    as = x;
    return unique;
  };

  return unique;
};vg.data.wordcloud = function() {
  var layout = d3.layout.cloud().size([900, 500]),
      text = vg.accessor("data"),
      size = ["width", "height"],
      fontSize = function() { return 14; },
      rotate = function() { return 0; },
      params = ["font", "fontStyle", "fontWeight", "padding"];
  
  var output = {
    "x": "x",
    "y": "y",
    "size": "fontSize",
    "font": "font",
    "rotate": "angle"
  };
  
  function cloud(data, db, group) {
    function finish(tags, bounds) {
      var size = layout.size(),
          dx = size[0] / 2,
          dy = size[1] / 2,
          keys = vg.keys(output), key, d;

      // sort data to match wordcloud order
      data.sort(function(a,b) {
        return fontSize(b) - fontSize(a);
      });

      for (var i=0; i<tags.length; ++i) {
        d = data[i];
        for (var k=0; k<keys.length; ++k) {
          key = keys[k];
          d[output[key]] = tags[i][key];
          if (key === "x") d[output.x] += dx;
          if (key === "y") d[output.y] += dy;
        }
      }
    }
    
    layout
      .size(vg.data.size(size, group))
      .text(text)
      .fontSize(fontSize)
      .rotate(rotate)
      .words(data)
      .on("end", finish)
      .start();
    return data;
  }

  cloud.text = function(field) {
    text = vg.accessor(field);
    return cloud;
  };
  
  cloud.size = function(sz) {
    size = sz;
    return cloud;
  };
         
  cloud.fontSize = function(field) {
    fontSize = vg.accessor(field);
    return cloud;
  };
  
  cloud.rotate = function(x) {
    var v;
    if (vg.isObject(x) && !Array.isArray(x)) {
      if (x.random !== undefined) {
        v = (v = x.random) ? vg.array(v) : [0];
        rotate = function() {
          return v[~~(Math.random()*v.length-0.00001)];
        };
      } else if (x.alternate !== undefined) {
        v = (v = x.alternate) ? vg.array(v) : [0];
        rotate = function(d, i) {
          return v[i % v.length];
        };
      }
    } else {
      rotate = vg.accessor(field);
    }
    return cloud;
  };

  params.forEach(function(name) {
    cloud[name] = function(x) {
      layout[name](x);
      return cloud;
    }
  });

  cloud.output = function(map) {
    vg.keys(output).forEach(function(k) {
      if (map[k] !== undefined) {
        output[k] = map[k];
      }
    });
    return cloud;
  };
  
  return cloud;
};vg.data.zip = function() {
  var z = null,
      as = "zip",
      key = vg.accessor("data"),
      withKey = null;

  function zip(data, db) {
    var zdata = db[z], d, i, len, map;
    
    if (withKey) {
      map = {};
      zdata.forEach(function(s) { map[withKey(s)] = s; });
    }
    
    for (i=0, len=data.length; i<len; ++i) {
      d = data[i];
      d[as] = map ? map[key(d)] : zdata[i];
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

  zip.key = function(k) {
    key = vg.accessor(k);
    return zip;
  };

  zip.withKey = function(k) {
    withKey = vg.accessor(k);
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
      var ticks = Array.isArray(def.ticks) ? def.ticks : [def.ticks];
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
    defs: spec,
    load: {},
    flow: {},
    source: {}
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
    
    if (d.source) {
      var list = model.source[d.source] || (model.source[d.source] = []);
      list.push(d.name);
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
    function(data, db, group) {
      return tx.reduce(function(d,t) { return t(d, db, group); }, data);
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
    if (mark.from) {
      var name = mark.from.data,
          tx = vg.parse.dataflow(mark.from);
      mark.from = function(db, group, parentData) {
        var data = vg.scene.data(name ? db[name] : null, parentData);
        return tx(data, db, group);
      };
    }
    
    // recurse if group type
    if (group) {
      mark.marks = group.map(parse);
    }
        
    return mark;
  }
  
  return function(spec) {
    return {
      type: "group",
      width: spec.width,
      height: spec.height,
      axes: spec.axes,
      scales: spec.scales,
      marks: vg.duplicate(spec.marks).map(parse)
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

    return Function("item", "group", code);
  }

  // TODO security check for strings emitted into code
  function valueRef(ref) {
    if (ref == null) return null;

    var val = ref.value !== undefined
              ? vg.str(ref.value)
              : "item.datum.data";

    // get data field value
    if (ref.field !== undefined) {
      val = "item.datum["
          + vg.field(ref.field).map(vg.str).join("][")
          + "]";
    }
    
    // run through scale function
    if (ref.scale !== undefined) {
      var scale = "group.scales['"+ref.scale+"']";
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
      LOG = "log",
      POWER = "pow",
      VARIABLE = {width: 1, height: 1},
      PREDEFINED = {category10: 1, category20: 1, shapes: 1};

  function scales(spec, scales, db, group) {
    return (spec || []).reduce(function(o, def) {
      o[def.name] = scale(def, o[def.name], db, group);
      return o;
    }, scales || {});
  }

  function scale(def, scale, db, group) {
    var type = def.type || LINEAR,
        s = scale || d3.scale[type](),
        rng = range(def, group),
        m = (type===ORDINAL ? ordinal : quantitative),
        data = vg.values(group.datum);
    
    m(def, s, rng, db, data);
    return s;
  }
  
  function ordinal(def, scale, rng, db, data) {
    var domain, dat, get, str;
    
    // domain
    domain = def.domain;
    if (Array.isArray(domain)) {
      scale.domain(domain);
    } else if (vg.isObject(domain)) {
      dat = db[domain.data] || data;
      get = vg.accessor(domain.field);      
      scale.domain(vg.unique(dat, get));
    }

    // range
    str = typeof rng[0] === 'string';
    if (str || rng.length > 2) {
      scale.range(rng); // color or shape values
    } else if (def.points) {
      scale.rangePoints(rng, def.padding||0);
    } else if (def.round || def.round===undefined) {
      scale.rangeRoundBands(rng, def.padding||0);
    } else {
      scale.rangeBands(rng, def.padding||0);
    }
  }
  
  function quantitative(def, scale, rng, db, data) {
    var domain, dat, get;
    
    // domain
    domain = [null, null];
    if (def.domain !== undefined) {
      if (Array.isArray(def.domain)) {
        domain = def.domain.slice();
      } else if (vg.isObject(def.domain)) {
        dat = db[def.domain.data] || data;
        get = vg.accessor(def.domain.field);
        domain[0] = d3.min(dat, get);
        domain[1] = d3.max(dat, get);
      } else {
        domain = def.domain;
      }
    }
    if (def.domainMin !== undefined) {
      if (vg.isObject(def.domainMin)) {
        dat = db[def.domainMin.data] || data;
        get = vg.accessor(def.domainMin.field);
        domain[0] = d3.min(dat, get);
      } else {
        domain[0] = def.domainMin;
      }
    }
    if (def.domainMax !== undefined) {
      if (vg.isObject(def.domainMax)) {
        dat = db[def.domainMax.data] || data;
        get = vg.accessor(def.domainMax.field);
        domain[1] = d3.max(dat, get);
      } else {
        domain[1] = def.domainMax;
      }
    }
    if (def.type !== LOG && (def.zero || def.zero===undefined)) {
      domain[0] = Math.min(0, domain[0]);
      domain[1] = Math.max(0, domain[1]);
    }
    scale.domain(domain);

    // range
    // vertical scales should flip by default, so use XOR here
    if (def.range=='height') rng = rng.reverse();
    scale[def.round ? "rangeRound" : "range"](rng);

    if (def.clamp) scale.clamp(true);
    if (def.nice) scale.nice();
    if (def.exponent && def.type===POWER) scale.exponent(def.exponent);
  }
  
  function range(def, group) {
    var rng = [null, null];

    if (def.range !== undefined) {
      if (typeof def.range === 'string') {
        if (VARIABLE[def.range]) {
          rng = [0, group[def.range]];
        } else if (PREDEFINED[def.range]) {
          rng = vg[def.range];
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
    
    if (def.reverse !== undefined) {
      var rev = def.reverse;
      if (vg.isObject(rev)) {
        rev = vg.accessor(rev.field)(group.datum);
      }
      if (rev) rng = rng.reverse();
    }
    
    return rng;
  }
  
  return scales;
})();vg.parse.spec = function(spec, callback) {
  
  function parse(spec) {
    var defs = {
      marks: vg.parse.marks(spec),
      data: vg.parse.data(spec.data, function() { callback(chart); })
    };

    var chart = function(el, input, renderer) {
      return new vg.View()
        .width(spec.width || 500)
        .height(spec.height || 500)
        .padding(parsePadding(spec.padding))
        .viewport(spec.viewport || null)
        .renderer(renderer || "canvas")
        .initialize(el)
        .defs(defs)
        .data(defs.data.load)
        .data(input)
        .on("mouseover", function(evt, item) {
          this.update("hover", item);
        })
        .on("mouseout", function(evt, item) {
          this.update("update", item);
        });
    };
  }
  
  function parsePadding(pad) {
    if (vg.isObject(pad)) return pad;
    var p = vg.isNumber(pad) ? pad : 20;
    return {top:p, left:p, right:p, bottom:p};
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

vg.scene.DEFAULT_DATA = {"sentinel":1}

vg.scene.bounds = function(item) {
  var b = new vg.Bounds(item.bounds);
  for (item = item.mark.group; item != null; item = item.mark.group) {
    b.translate(item.x||0, item.y||0);
  }
  return b;
};

vg.scene.data = function(data, parentData) {
  var DEFAULT = vg.scene.DEFAULT_DATA;

  // if data is undefined, inherit or use default
  data = vg.values(data || parentData || [DEFAULT]);

  // if inheriting default data, ensure its in an array
  if (data === DEFAULT) data = [DEFAULT];
  
  return data;
};vg.scene.build = (function() {
  var GROUP  = vg.scene.GROUP,
      ENTER  = vg.scene.ENTER,
      UPDATE = vg.scene.UPDATE,
      EXIT   = vg.scene.EXIT,
      DEFAULT= {"sentinel":1}
  
  function build(model, db, node, parentData) {
    var data = vg.scene.data(
      model.from ? model.from(db, node, parentData) : null,
      parentData);
    
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
    node.def = model;
    node.marktype = model.type;
    node.interactive = !(model.interactive === false);
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
      item.status = EXIT;
      if (keyf) map[item.key] = item;
    }
    
    for (i=0, len=data.length; i<len; ++i) {
      datum = data[i];
      key = i;
      item = keyf ? map[key = keyf(datum)] : prev[i];
      enter = item ? false : (item = {mark:node}, true);
      item.status = enter ? ENTER : UPDATE;
      item.datum = datum;
      item.key = key;
      next.push(item);
    }
    
    for (i=0, len=prev.length; i<len; ++i) {
      item = prev[i];
      if (item.status === EXIT) {
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
        group.items[m].group = group;
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
      : encode.call(this, scene, scene, enc, trans);
    return scene;
  }
  
  function update(scene, enc, trans, request, items) {
    items = vg.array(items);
    var i, len, item, group, props, prop;
    for (i=0, len=items.length; i<len; ++i) {
      item = items[i];
      group = item.mark.group || null;
      props = item.mark.def.properties;
      prop = props && props[request];
      if (prop) prop.call(this, item, group, trans);
    }
  }
  
  function encode(group, scene, enc, trans) {
    encodeItems.call(this, group, scene.items, enc, trans);
    if (scene.marktype === GROUP) {
      encodeGroup.call(this, scene, enc, group, trans);
    }
  }
  
  function encodeGroup(scene, enc, parent, trans) {
    var i, len, m, mlen, group, scales, axes;

    for (i=0, len=scene.items.length; i<len; ++i) {
      group = scene.items[i];

      // cascade scales recursively
      scales = group.scales || (group.scales = vg.extend({}, parent.scales));    
      
      // update group-level scales
      if (enc.scales) {
        vg.parse.scales(enc.scales, scales, this._data, group);
      }
      
      // update group-level axes
      if (enc.axes) {
        axes = group.axes || (group.axes = []);
        vg.parse.axes(enc.axes, axes, group.scales);
      }
      
      // encode children marks
      for (m=0, mlen=group.items.length; m<mlen; ++m) {
        encode.call(this, group, group.items[m], enc.marks[m], trans);
      }
    }
  }
  
  function encodeItems(group, items, enc, trans) {
    if (enc.properties == null) return;
    
    var props  = enc.properties,
        enter  = props.enter,
        update = props.update,
        exit   = props.exit,
        i, len, item;
    
    if (enter) {
      for (i=0, len=items.length; i<len; ++i) {
        item = items[i];
        if (item.status !== ENTER) continue;
        enter.call(this, item, group, trans);
        item.status = UPDATE;
      }
    }
    
    if (update) {
      for (i=0, len=items.length; i<len; ++i) {
        item = items[i];
        if (item.status === EXIT) continue;
        update.call(this, item, group, trans);
      }
    }
    
    if (exit) {
      for (i=0, len=items.length; i<len; ++i) {
        item = items[i];
        if (item.status !== EXIT) continue;
        exit.call(this, item, group, trans);
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
  
  prototype.update = function(model, duration) {
    duration = duration || 0;
    var init = this._init; this._init = true;
    var dom = d3.selectAll("svg.axes").select("g");
    var axes = collectAxes(model.scene(), 0, 0, []);
    
    if (!init) {
      dom.selectAll('g.axis')
        .data(axes)
       .enter().append('g')
        .attr('class', function(d, i) { return 'axis axis-'+i; });
    }
    
    var sel = duration && init ? dom.transition(duration) : dom,
        w = this._width,
        h = this._height;

    sel.selectAll('g.axis')
      .attr('transform', function(a, i) {
        var offset = a.axis.offset || 0,
            width  = a.group.width || w,
            height = a.group.height || h,
            xy;

        switch(a.axis.orient()) {
          case 'left':   xy = [     -offset,  0]; break;
          case 'right':  xy = [width+offset,  0]; break;
          case 'bottom': xy = [0, height+offset]; break;
          case 'top':    xy = [0,       -offset]; break;
          default: xy = [0,0];
        }
        return 'translate('+(xy[0]+a.x)+', '+(xy[1]+a.y)+')';
      })
      .each(function(a) {
        a.axis.scale(a.group.scales[a.axis.scaleName]);
        var s = d3.select(this);
        (duration && init
          ? s.transition().duration(duration)
          : s).call(a.axis);
      });    
  };
  
  function collectAxes(scene, x, y, list) {
    var i, j, len, axes, group, items, xx, yy;

    for (i=0, len=scene.items.length; i<len; ++i) {
      group = scene.items[i];
      xx = x + (group.x || 0);
      yy = y + (group.y || 0);

      // collect axis
      if (axes = group.axes) {
        for (j=0; j<axes.length; ++j) {
          list.push({axis: axes[j], group: group, x: xx, y: yy});
        }
      }

      // recurse
      for (items=group.items, j=0; j<items.length; ++j) {
        if (items[j].marktype === vg.scene.GROUP) {
          collectAxes(items[j], xx, yy, list);
        }
      }
    }

    return list;
  }
  
  return axes;
})();vg.Model = (function() {
  function model() {
    this._defs = null;
    this._data = {};
    this._scene = null;
  }
  
  var prototype = model.prototype;
  
  prototype.defs = function(defs) {
    if (!arguments.length) return this._defs;
    this._defs = defs;
    return this;
  };
  
  prototype.data = function(data) {
    if (!arguments.length) return this._data;

    var tx = this._defs.data.flow || {},
        keys = this._defs.data.defs.map(vg.accessor("name")),
        i, j, len, k, src;
        
    for (i=0, len=keys.length; i<len; ++i) {
      if (!data[k=keys[i]]) continue;
      
      this._data[k] = tx[k]
        ? tx[k](data[k], this._data, this._defs.marks)
        : data[k];
      
      src = this._defs.data.source[k] || [];
      for (j=0; j<src.length; ++j) {
        this._data[src[j]] = tx[src[j]]
          ? tx[src[j]](data[k], this._data, this._defs.marks)
          : data[k]
      }
    }

    return this;
  };
  
  prototype.width = function(width) {
    if (this._defs && this._defs.marks) this._defs.marks.width = width;
    if (this._scene) this._scene.items[0].width = width;
    return this;
  };
  
  prototype.height = function(height) {
    if (this._defs && this._defs.marks) this._defs.marks.height = height;
    if (this._scene) this._scene.items[0].height = height;
    return this;
  };
  
  prototype.scene = function(node) {
    if (!arguments.length) return this._scene;
    this._scene = node;
    return this;
  };
  
  prototype.build = function() {
    var m = this, data = m._data, marks = m._defs.marks;
    m._scene = vg.scene.build.call(m, marks, data, m._scene);
    m._scene.items[0].width = marks.width;
    m._scene.items[0].height = marks.height;
    m._scene.interactive = false;
    return this;
  };
  
  prototype.encode = function(request, item) {
    var m = this,
        scene = m._scene,
        defs = m._defs;
    vg.scene.encode.call(m, scene, defs.marks, null, request, item);
    return this;
  };
  
  prototype.visit = function(pre, post) {
    return vg.scene.visit(this._scene, pre, post);
  };
  
  return model;
})();vg.View = (function() {
  var view = function(el, width, height) {
    this._el = null;
    this._build = false;
    this._model = new vg.Model();
    this._width = width || 500;
    this._height = height || 500;
    this._padding = {top:0, left:0, bottom:0, right:0};
    this._viewport = null;
    this._io = vg.canvas;
    if (el) this.initialize(el);
  };
  
  var prototype = view.prototype;
  
  prototype.width = function(width) {
    if (!arguments.length) return this._width;
    if (this._width !== width) {
      this._width = width;
      if (this._el) this.initialize(this._el.parentNode);
      this._model.width(width);
    }
    return this;
  };

  prototype.height = function(height) {
    if (!arguments.length) return this._height;
    if (this._height !== height) {
      this._height = height;
      if (this._el) this.initialize(this._el.parentNode);
      this._model.height(this._height);
    }
    return this;
  };

  prototype.padding = function(pad) {
    if (!arguments.length) return this._padding;
    if (this._padding !== pad) {
      this._padding = pad;
      if (this._el) this.initialize(this._el.parentNode);
    }
    return this;
  };

  prototype.viewport = function(size) {
    if (!arguments.length) return this._viewport;
    if (this._viewport !== size) {
      this._viewport = size;
      if (this._el) this.initialize(this._el.parentNode);
    }
    return this;
  };
  
  prototype.renderer = function(type) {
    if (!arguments.length) return this._io;
    if (type === "canvas") type = vg.canvas;
    if (type === "svg") type = vg.svg;
    if (this._io !== type) {
      this._io = type;
      if (this._el) this.initialize(this._el.parentNode);
      if (this._build) this.render();
    }
    return this;
  };

  prototype.defs = function(defs) {
    if (!arguments.length) return this._model.defs();
    this._model.defs(defs);
    return this;
  };

  prototype.data = function(data) {
    if (!arguments.length) return this._model.data();
    var ingest = vg.keys(data).reduce(function(d, k) {
      return (d[k] = data[k].map(vg.data.ingest), d);
    }, {});
    this._model.data(ingest);
    return this;
  };

  prototype.model = function(model) {
    if (!arguments.length) return this._model;
    if (this._model !== model) {
      this._model = model;
      if (this._handler) this._handler.model(model);
    }
    return this;
  };

  prototype.initialize = function(el) {
    // clear pre-existing container
    d3.select(el).select("div.vega-root").remove();
    
    // add div container
    this._el = d3.select(el)
      .append("div")
      .attr("class", "vega-root")
      .style("position", "relative")
      .node();
    if (this._viewport) {
      var vw = this._viewport[0] || this._width,
          vh = this._viewport[1] || this._height;
      d3.select(this._el)
        .style("width", vw+"px")
        .style("height", vh+"px")
        .style("overflow", "auto");
    }
    
    // axis container
    this._axes = (this._axes || new vg.Axes)
      .initialize(this._el, this._width, this._height, this._padding);
    
    // renderer
    this._renderer = (this._renderer || new this._io.Renderer())
      .initialize(this._el, this._width, this._height, this._padding);
    
    // input handler
    if (!this._handler) {
      // TODO preserve handlers across re-initialization
      this._handler = new this._io.Handler()
        .initialize(this._el, this._padding, this)
        .model(this._model);
    }
    
    return this;
  };
  
  prototype.render = function(items) {
    this._axes.update(this._model);
    this._renderer.render(this._model.scene(), items);
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
    this._build = this._build || (this._model.build(), true);
    this._model.encode(request, items);
    return this.render(items);
  };
    
  return view;
})();
})();
