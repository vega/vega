// Define module using Universal Module Definition pattern
// https://github.com/umdjs/umd/blob/master/amdWeb.js

(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // Support AMD. Register as an anonymous module.
    // NOTE: List all dependencies in AMD style
    define(['d3', 'topojson'], factory);
  } else {
    // No AMD. Set module as a global variable
    // NOTE: Pass dependencies to factory function
    // (assume that both d3 and topojson are also global.)
    var tj = (typeof topojson === 'undefined') ? null : topojson;
    vg = factory(d3, tj);
  }
}(
//NOTE: The dependencies are passed to this function
function (d3, topojson) {
//---------------------------------------------------
// BEGIN code for this module
//---------------------------------------------------

  var vg = {
    version:  "1.5.3", // semantic versioning
    d3:       d3,      // stash d3 for use in property functions
    topojson: topojson // stash topojson similarly
  };
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

vg.isTree = function(obj) {
  return obj && obj.__vgtree__;
};

vg.tree = function(obj, children) {
  var d = [obj];
  d.__vgtree__ = true;
  d.children = children || "children";
  return d;
};

vg.number = function(s) { return s === null ? null : +s; };

vg.boolean = function(s) { return s === null ? null :  !!s; };

vg.date = function(s) {return s === null ? null : Date.parse(s); };

// ES6 compatibility per https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#Polyfill
// We could have used the polyfill code, but lets wait until ES6 becomes a standard first
vg.startsWith = String.prototype.startsWith ?
  function(string, searchString) {
    return string.startsWith(searchString);
  } : function(string, searchString) {
    return string.lastIndexOf(searchString, 0) === 0;
  };

// utility functions

vg.identity = function(x) { return x; };

vg.true = function() { return true; };

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
};

vg.accessor = function(f) {
  var s;
  return (vg.isFunction(f) || f==null)
    ? f : vg.isString(f) && (s=vg.field(f)).length > 1
    ? function(x) { return s.reduce(function(x,f) {
          return x[f];
        }, x);
      }
    : function(x) { return x[f]; };
};

vg.mutator = function(f) {
  var s;
  return vg.isString(f) && (s=vg.field(f)).length > 1
    ? function(x, v) {
        for (var i=0; i<s.length-1; ++i) x = x[s[i]];
        x[s[i]] = v;
      }
    : function(x, v) { x[f] = v; };
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
      f = sort[i]; x = f(a); y = f(b);
      if (x < y) return -1 * sign[i];
      if (x > y) return sign[i];
    }
    return 0;
  };
};

vg.cmp = function(a, b) {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  } else if (a >= b) {
    return 0;
  } else if (a === null && b === null) {
    return 0;
  } else if (a === null) {
    return -1;
  } else if (b === null) {
    return 1;
  }
  return NaN;
};

vg.numcmp = function(a, b) { return a - b; };

vg.array = function(x) {
  return x != null ? (vg.isArray(x) ? x : [x]) : [];
};

vg.values = function(x) {
  return (vg.isObject(x) && !vg.isArray(x) && x.values) ? x.values : x;
};

vg.str = function(x) {
  return vg.isArray(x) ? "[" + x.map(vg.str) + "]"
    : vg.isObject(x) ? JSON.stringify(x)
    : vg.isString(x) ? ("'"+vg_escape_str(x)+"'") : x;
};

var escape_str_re = /(^|[^\\])'/g;

function vg_escape_str(x) {
  return x.replace(escape_str_re, "$1\\'");
}

vg.keystr = function(values) {
  // use to ensure consistent key generation across modules
  return values.join("|");
};

vg.keys = function(x) {
  var keys = [];
  for (var key in x) keys.push(key);
  return keys;
};

vg.toMap = function(list) {
  return list.reduce(function(obj, x) {
    return (obj[x] = 1, obj);
  }, {});
};

vg.unique = function(data, f, results) {
  if (!vg.isArray(data) || data.length===0) return [];
  f = f || vg.identity;
  results = results || [];
  var u = {};
  for (var v, idx, i=0, n=data.length; i<n; ++i) {
    v = f(data[i]);
    if (v in u) continue;
    u[v] = true;
    results.push(v);
  }
  return results;
};

vg.minIndex = function(data, f) {
  if (!vg.isArray(data) || data.length==0) return -1;
  f = f || vg.identity;
  var idx = 0, min = f(data[0]), v = min;
  for (var i=1, n=data.length; i<n; ++i) {
    v = f(data[i]);
    if (v < min) { min = v; idx = i; }
  }
  return idx;
};

vg.maxIndex = function(data, f) {
  if (!vg.isArray(data) || data.length==0) return -1;
  f = f || vg.identity;
  var idx = 0, max = f(data[0]), v = max;
  for (var i=1, n=data.length; i<n; ++i) {
    v = f(data[i]);
    if (v > max) { max = v; idx = i; }
  }
  return idx;
};

vg.bins = function(opt) {
  opt = opt || {};

  // determine range
  var maxb = opt.maxbins || 1024,
      base = opt.base || 10,
      div = opt.div || [5, 2],
      mins = opt.minstep || 0,
      logb = Math.log(base),
      level = Math.ceil(Math.log(maxb) / logb),
      min = opt.min,
      max = opt.max,
      span = max - min,
      step = Math.max(mins, Math.pow(base, Math.round(Math.log(span) / logb) - level)),
      nbins = Math.ceil(span / step),
      precision, v, i, eps;

  if (opt.step != null) {
    step = opt.step;
  } else if (opt.steps) {
    // if provided, limit choice to acceptable step sizes
    step = opt.steps[Math.min(
        opt.steps.length - 1,
        vg_bisectLeft(opt.steps, span / maxb, 0, opt.steps.length)
    )];
  } else {
    // increase step size if too many bins
    do {
      step *= base;
      nbins = Math.ceil(span / step);
    } while (nbins > maxb);

    // decrease step size if allowed
    for (i = 0; i < div.length; ++i) {
      v = step / div[i];
      if (v >= mins && span / v <= maxb) {
        step = v;
        nbins = Math.ceil(span / step);
      }
    }
  }

  // update precision, min and max
  v = Math.log(step);
  precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
  eps = (min<0 ? -1 : 1) * Math.pow(base, -precision - 1);
  min = Math.min(min, Math.floor(min / step + eps) * step);
  max = Math.ceil(max / step) * step;

  return {
    start: min,
    stop: max,
    step: step,
    unit: precision
  };
};

function vg_bisectLeft(a, x, lo, hi) {
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (vg.cmp(a[mid], x) < 0) { lo = mid + 1; }
    else { hi = mid; }
  }
  return lo;
}

vg.truncate = function(s, length, pos, word, ellipsis) {
  var len = s.length;
  if (len <= length) return s;
  ellipsis = ellipsis || "...";
  var l = Math.max(0, length - ellipsis.length);

  switch (pos) {
    case "left":
      return ellipsis + (word ? vg_truncateOnWord(s,l,1) : s.slice(len-l));
    case "middle":
    case "center":
      var l1 = Math.ceil(l/2), l2 = Math.floor(l/2);
      return (word ? vg_truncateOnWord(s,l1) : s.slice(0,l1)) + ellipsis
        + (word ? vg_truncateOnWord(s,l2,1) : s.slice(len-l2));
    default:
      return (word ? vg_truncateOnWord(s,l) : s.slice(0,l)) + ellipsis;
  }
};

function vg_truncateOnWord(s, len, rev) {
  var cnt = 0, tok = s.split(vg_truncate_word_re);
  if (rev) {
    s = (tok = tok.reverse())
      .filter(function(w) { cnt += w.length; return cnt <= len; })
      .reverse();
  } else {
    s = tok.filter(function(w) { cnt += w.length; return cnt <= len; });
  }
  return s.length ? s.join("").trim() : tok[0].slice(0, len);
}

var vg_truncate_word_re = /([\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u2028\u2029\u3000\uFEFF])/;

// Logging

function vg_write(msg) {
  vg.config.isNode
    ? process.stderr.write(msg + "\n")
    : console.log(msg);
}

function vg_error(msg) {
  vg.config.isNode
    ? process.stderr.write(msg + "\n")
    : console.error(msg);
}

vg.log = function(msg) {
  vg_write("[Vega Log] " + msg);
};

vg.error = function(msg) {
  vg_error("[Vega Err] " + msg);
};
vg.config = {};

// are we running in node.js?
// false by default, node wrapper should set true as needed
vg.config.isNode = false;

// Allows domain restriction when using data loading via XHR.
// To enable, set it to a list of allowed domains
// e.g., ['wikipedia.org', 'eff.org']
vg.config.domainWhiteList = false;

// Allows additional headers to be sent to the server
// when requesting data. This could be useful when
// the graph definition is not trusted, and the server
// needs to be notified of that, e.g. {'Treat-as-Untrusted': 1}
vg.config.dataHeaders = false;

// If true, disable potentially unsafe transforms (filter, formula)
// involving possible JavaScript injection attacks.
vg.config.safeMode = false;

// base url for loading external data files
// used only if data or image URL is relative
// For node.js, set this value to convert local URLs to absolute ones.
vg.config.baseURL = "";

// node.js only: which protocol to use for relative protocol URLs
// URLs such as  //example.com/...  will be prepended by this value
vg.config.defaultProtocol = "http:";

// version and namespace for exported svg
vg.config.svgNamespace =
  'version="1.1" xmlns="http://www.w3.org/2000/svg" ' +
  'xmlns:xlink="http://www.w3.org/1999/xlink"';

// inset padding for automatic padding calculation
vg.config.autopadInset = 5;

// extensible scale lookup table
// all d3.scale.* instances also supported
vg.config.scale = {
  time: d3.time.scale,
  utc:  d3.time.scale.utc
};

// default rendering settings
vg.config.render = {
  lineWidth: 1,
  lineCap:   "butt",
  font:      "sans-serif",
  fontSize:  11
};

// default axis properties
vg.config.axis = {
  orient: "bottom",
  ticks: 10,
  padding: 3,
  axisColor: "#000",
  gridColor: "#d8d8d8",
  tickColor: "#000",
  tickLabelColor: "#000",
  axisWidth: 1,
  tickWidth: 1,
  tickSize: 6,
  tickLabelFontSize: 11,
  tickLabelFont: "sans-serif",
  titleColor: "#000",
  titleFont: "sans-serif",
  titleFontSize: 11,
  titleFontWeight: "bold",
  titleOffset: 35
};

// default legend properties
vg.config.legend = {
  orient: "right",
  offset: 10,
  padding: 3,
  gradientStrokeColor: "#888",
  gradientStrokeWidth: 1,
  gradientHeight: 16,
  gradientWidth: 100,
  labelColor: "#000",
  labelFontSize: 10,
  labelFont: "sans-serif",
  labelAlign: "left",
  labelBaseline: "middle",
  labelOffset: 8,
  symbolShape: "circle",
  symbolSize: 50,
  symbolColor: "#888",
  symbolStrokeWidth: 1,
  titleColor: "#000",
  titleFont: "sans-serif",
  titleFontSize: 11,
  titleFontWeight: "bold"
};

// default color values
vg.config.color = {
  rgb: [128, 128, 128],
  lab: [50, 0, 0],
  hcl: [0, 0, 50],
  hsl: [0, 0, 0.5]
};

// default scale ranges
vg.config.range = {
  category10: [
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
  ],
  category20: [
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
  ],
  shapes: [
    "circle",
    "cross",
    "diamond",
    "square",
    "triangle-down",
    "triangle-up"
  ]
};
vg.Bounds = (function() {
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
  };

  prototype.union = function(b) {
    if (b.x1 < this.x1) this.x1 = b.x1;
    if (b.y1 < this.y1) this.y1 = b.y1;
    if (b.x2 > this.x2) this.x2 = b.x2;
    if (b.y2 > this.y2) this.y2 = b.y2;
    return this;
  };

  prototype.encloses = function(b) {
    return b && (
      this.x1 <= b.x1 &&
      this.x2 >= b.x2 &&
      this.y1 <= b.y1 &&
      this.y2 >= b.y2
    );
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
})();vg.Gradient = (function() {

  function gradient(type) {
    this.id = "grad_" + (vg_gradient_id++);
    this.type = type || "linear";
    this.stops = [];
    this.x1 = 0;
    this.x2 = 1;
    this.y1 = 0;
    this.y2 = 0;
  }

  var prototype = gradient.prototype;

  prototype.stop = function(offset, color) {
    this.stops.push({
      offset: offset,
      color: color
    });
    return this;
  };
  
  return gradient;
})();

var vg_gradient_id = 0;
vg.canvas = {};vg.canvas.path = (function() {

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

  function boundArc(x, y, coords, bounds) {
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
      bounds.add(bez[0], bez[1]);
      bounds.add(bez[2], bez[3]);
      bounds.add(bez[4], bez[5]);
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

    var cos_th0 = Math.cos(th0);
    var sin_th0 = Math.sin(th0);
    var cos_th1 = Math.cos(th1);
    var sin_th1 = Math.sin(th1);

    var th_half = 0.5 * (th1 - th0);
    var sin_th_h2 = Math.sin(th_half * 0.5);
    var t = (8/3) * sin_th_h2 * sin_th_h2 / Math.sin(th_half);
    var x1 = cx + cos_th0 - t * sin_th0;
    var y1 = cy + sin_th0 + t * cos_th0;
    var x3 = cx + cos_th1;
    var y3 = cy + sin_th1;
    var x2 = x3 + t * sin_th1;
    var y2 = y3 - t * cos_th1;

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
  }

  function bounds(path, bounds) {
    var current, // current instruction
        previous = null,
        x = 0, // current x
        y = 0, // current y
        controlX = 0, // current control point x
        controlY = 0, // current control point y
        tempX,
        tempY,
        tempControlX,
        tempControlY;

    for (var i=0, len=path.length; i<len; ++i) {
      current = path[i];

      switch (current[0]) { // first letter

        case 'l': // lineto, relative
          x += current[1];
          y += current[2];
          bounds.add(x, y);
          break;

        case 'L': // lineto, absolute
          x = current[1];
          y = current[2];
          bounds.add(x, y);
          break;

        case 'h': // horizontal lineto, relative
          x += current[1];
          bounds.add(x, y);
          break;

        case 'H': // horizontal lineto, absolute
          x = current[1];
          bounds.add(x, y);
          break;

        case 'v': // vertical lineto, relative
          y += current[1];
          bounds.add(x, y);
          break;

        case 'V': // verical lineto, absolute
          y = current[1];
          bounds.add(x, y);
          break;

        case 'm': // moveTo, relative
          x += current[1];
          y += current[2];
          bounds.add(x, y);
          break;

        case 'M': // moveTo, absolute
          x = current[1];
          y = current[2];
          bounds.add(x, y);
          break;

        case 'c': // bezierCurveTo, relative
          tempX = x + current[5];
          tempY = y + current[6];
          controlX = x + current[3];
          controlY = y + current[4];
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

          x = tempX;
          y = tempY;
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          break;

        case 'Q': // quadraticCurveTo, absolute
          tempX = current[3];
          tempY = current[4];

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

          x = tempX;
          y = tempY;
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          break;

        case 'a':
          boundArc(x, y, [
            current[1],
            current[2],
            current[3],
            current[4],
            current[5],
            current[6] + x,
            current[7] + y
          ], bounds);
          x += current[6];
          y += current[7];
          break;

        case 'A':
          boundArc(x, y, [
            current[1],
            current[2],
            current[3],
            current[4],
            current[5],
            current[6],
            current[7]
          ], bounds);
          x = current[6];
          y = current[7];
          break;

        case 'z':
        case 'Z':
          break;
      }
      previous = current;
    }
    return bounds;
  }
  
  function area(items) {
    var o = items[0];
    var area;
    
    if (o.orient === "horizontal") {
      area = d3.svg.area()
        .y(function(d) { return d.y; })
        .x0(function(d) { return d.x; })
        .x1(function(d) { return d.x + d.width; });
    } else {
      area = d3.svg.area()
        .x(function(d) { return d.x; })
        .y1(function(d) { return d.y; })
        .y0(function(d) { return d.y + d.height; });
    }

    if (o.interpolate) area.interpolate(o.interpolate);
    if (o.tension != null) area.tension(o.tension);
    return area(items);
  }

  function line(items) {
    var o = items[0];
    var line = d3.svg.line()
     .x(function(d) { return d.x; })
     .y(function(d) { return d.y; });
    if (o.interpolate) line.interpolate(o.interpolate);
    if (o.tension != null) line.tension(o.tension);
    return line(items);
  }
  
  return {
    parse:  parse,
    render: render,
    bounds: bounds,
    area:   area,
    line:   line
  };
  
})();vg.canvas.marks = (function() {

  var parsePath = vg.canvas.path.parse,
      renderPath = vg.canvas.path.render,
      halfpi = Math.PI / 2,
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
  }

  function areaPath(g, items) {
    var o = items[0],
        m = o.mark,
        p = m.pathCache || (m.pathCache = parsePath(vg.canvas.path.area(items)));
    renderPath(g, p);
  }

  function linePath(g, items) {
    var o = items[0],
        m = o.mark,
        p = m.pathCache || (m.pathCache = parsePath(vg.canvas.path.line(items)));
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
    g.lineWidth = lw != null ? lw : vg.config.render.lineWidth;
    g.lineCap   = lc != null ? lc : vg.config.render.lineCap;
    linePath(g, items);
  }

  function ruleStroke(g, o) {
    var x1 = o.x || 0,
        y1 = o.y || 0,
        x2 = o.x2 != null ? o.x2 : x1,
        y2 = o.y2 != null ? o.y2 : y1,
        lw = o.strokeWidth,
        lc = o.strokeCap;

    g.lineWidth = lw != null ? lw : vg.config.render.lineWidth;
    g.lineCap   = lc != null ? lc : vg.config.render.lineCap;
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
      lw = (lw = o.strokeWidth) != null ? lw : vg.config.render.lineWidth;
      if (lw > 0) {
        g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
        g.strokeStyle = color(g, o, stroke);
        g.lineWidth = lw;
        g.lineCap = (lc = o.strokeCap) != null ? lc : vg.config.render.lineCap;
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
        lw = (lw = o.strokeWidth) != null ? lw : vg.config.render.lineWidth;
        if (lw > 0) {
          g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
          g.strokeStyle = color(g, o, stroke);
          g.lineWidth = lw;
          g.lineCap = (lc = o.strokeCap) != null ? lc : vg.config.render.lineCap;
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
        lw = (lw = o.strokeWidth) != null ? lw : vg.config.render.lineWidth;
        if (lw > 0) {
          g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
          g.strokeStyle = color(g, o, stroke);
          g.lineWidth = lw;
          g.lineCap = (lc = o.strokeCap) != null ? lc : vg.config.render.lineCap;
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

      g.font = vg.scene.fontString(o);
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

    var b = vg.scene.bounds.text(o, tmpBounds, true),
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

  return {
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

})();vg.canvas.Renderer = (function() {
  var renderer = function() {
    this._ctx = null;
    this._el = null;
    this._bgcolor = null;
    this._imgload = 0;
  };

  var prototype = renderer.prototype;

  prototype.initialize = function(el, width, height, pad, bgcolor) {
    this._el = el;
    this.background(bgcolor);
  
    if (!el) return this; // early exit if no DOM element

    // select canvas element
    var canvas = d3.select(el)
      .selectAll("canvas.marks")
      .data([1]);

    // create new canvas element if needed
    canvas.enter()
      .append("canvas")
      .attr("class", "marks");

    // remove extraneous canvas if needed
    canvas.exit().remove();

    return this.resize(width, height, pad);
  };
  
  prototype.background = function(bgcolor) {
    this._bgcolor = bgcolor;
    return this;
  };

  prototype.resize = function(width, height, pad) {
    this._width = width;
    this._height = height;
    this._padding = pad;

    if (this._el) {
      var canvas = d3.select(this._el).select("canvas.marks");

      // initialize canvas attributes
      canvas
        .attr("width", width + pad.left + pad.right)
        .attr("height", height + pad.top + pad.bottom);

      // get the canvas graphics context
      var s;
      this._ctx = canvas.node().getContext("2d");
      this._ctx._ratio = (s = scaleCanvas(canvas.node(), this._ctx) || 1);
      this._ctx.setTransform(s, 0, 0, s, s*pad.left, s*pad.top);
    }

    initializeLineDash(this._ctx);
    return this;
  };

  function scaleCanvas(canvas, ctx) {
    // get canvas pixel data
    var devicePixelRatio = window.devicePixelRatio || 1,
        backingStoreRatio = (
          ctx.webkitBackingStorePixelRatio ||
          ctx.mozBackingStorePixelRatio ||
          ctx.msBackingStorePixelRatio ||
          ctx.oBackingStorePixelRatio ||
          ctx.backingStorePixelRatio) || 1,
        ratio = devicePixelRatio / backingStoreRatio;

    if (devicePixelRatio !== backingStoreRatio) {
      var w = canvas.width, h = canvas.height;
      // set actual and visible canvas size
      canvas.setAttribute("width", w * ratio);
      canvas.setAttribute("height", h * ratio);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    }
    return ratio;
  }

  function initializeLineDash(ctx) {
    if (ctx.vgLineDash) return; // already set

    var NODASH = [];
    if (ctx.setLineDash) {
      ctx.vgLineDash = function(dash) { this.setLineDash(dash || NODASH); };
      ctx.vgLineDashOffset = function(off) { this.lineDashOffset = off; };
    } else if (ctx.webkitLineDash !== undefined) {
    	ctx.vgLineDash = function(dash) { this.webkitLineDash = dash || NODASH; };
      ctx.vgLineDashOffset = function(off) { this.webkitLineDashOffset = off; };
    } else if (ctx.mozDash !== undefined) {
      ctx.vgLineDash = function(dash) { this.mozDash = dash; };
      ctx.vgLineDashOffset = function(off) { /* unsupported */ };
    } else {
      ctx.vgLineDash = function(dash) { /* unsupported */ };
      ctx.vgLineDashOffset = function(off) { /* unsupported */ };
    }
  }

  prototype.context = function(ctx) {
    if (ctx) { this._ctx = ctx; return this; }
    else return this._ctx;
  };

  prototype.element = function() {
    return this._el;
  };

  prototype.pendingImages = function() {
    return this._imgload;
  };

  function translatedBounds(item, bounds) {
    var b = new vg.Bounds(bounds);
    while ((item = item.mark.group) != null) {
      b.translate(item.x || 0, item.y || 0);
    }
    return b;
  }

  function getBounds(items) {
    return !items ? null :
      vg.array(items).reduce(function(b, item) {
        return b.union(translatedBounds(item, item.bounds))
                .union(translatedBounds(item, item['bounds:prev']));
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
    var g = this._ctx,
        pad = this._padding,
        w = this._width + pad.left + pad.right,
        h = this._height + pad.top + pad.bottom,
        bb = null, bb2;

    // setup
    this._scene = scene;
    g.save();
    bb = setBounds(g, getBounds(items));
    this.clear(-pad.left, -pad.top, w, h);

    // render
    this.draw(g, scene, bb);

    // render again to handle possible bounds change
    if (items) {
      g.restore();
      g.save();
      bb2 = setBounds(g, getBounds(items));
      if (!bb.encloses(bb2)) {
        this.clear(-pad.left, -pad.top, w, h);
        this.draw(g, scene, bb2);
      }
    }

    // takedown
    g.restore();
    this._scene = null;
  };

  prototype.draw = function(ctx, scene, bounds) {
    var marktype = scene.marktype,
        renderer = vg.canvas.marks.draw[marktype];
    renderer.call(this, ctx, scene, bounds);
  };

  prototype.clear = function(x, y, w, h) {
    var g = this._ctx;

    g.clearRect(x, y, w, h);
    if (this._bgcolor != null) {
      g.fillStyle = this._bgcolor;
      g.fillRect(x, y, w, h); 
    }
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
        scene = renderer._scene,
        image = null, url;

    if (vg.config.isNode) {
      renderer._imgload += 1;
      image = new (require("canvas").Image)();
      vg.data.load(uri, function(err, data) {
        renderer._imgload -= 1;
        if (err) { vg.error(err); return; }
        vg.log("LOAD IMAGE: " + uri);
        image.src = data;
        image.loaded = true;
      });
    } else {
      image = new Image();
      url = vg.data.load.sanitizeUrl(uri);
      if (!url) { return; }
      renderer._imgload += 1;
      image.onload = function() {
        vg.log("LOAD IMAGE: " + url);
        image.loaded = true;
        renderer._imgload -= 1;
        renderer.renderAsync(scene);
      };
      image.src = url;
    }

    return image;
  };

  return renderer;
})();
vg.canvas.Handler = (function() {
  var handler = function(el, model) {
    this._active = null;
    this._down = null;
    this._handlers = {};
    if (el) this.initialize(el);
    if (model) this.model(model);
  };
  
  var prototype = handler.prototype;

  prototype.initialize = function(el, pad, obj) {
    this._el = d3.select(el).node();
    this._canvas = d3.select(el).select("canvas.marks").node();
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
  
  prototype.padding = function(pad) {
    this._padding = pad;
    return this;
  };
  
  prototype.model = function(model) {
    if (!arguments.length) return this._model;
    this._model = model;
    return this;
  };

  prototype.handlers = function() {
    var h = this._handlers;
    return vg.keys(h).reduce(function(a, k) {
      return h[k].reduce(function(a, x) { return (a.push(x), a); }, a);
    }, []);
  };

  // setup events
  var events = [
    "mouseup",
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
  events.push("mousedown");
  events.push("mousemove");
  events.push("mouseout");
  events.push("click");

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

  prototype.mousedown = function(evt) {
    this._down = this._active;
    this.fire("mousedown", evt);
  };

  prototype.click = function(evt) {
    if (this._down === this._active) {
      this.fire("click", evt);
      this._down = null;
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
  function xw(o)    { return o.x + o.width || 0; }
  function yh(o)    { return o.y + o.height || 0; }
  function key(o)   { return o.key; }
  function size(o)  { return o.size==null ? 100 : o.size; }
  function shape(o) { return o.shape || "circle"; }
      
  var arc_path    = d3.svg.arc(),
      area_path_v = d3.svg.area().x(x).y1(y).y0(yh),
      area_path_h = d3.svg.area().y(y).x0(xw).x1(x),
      line_path   = d3.svg.line().x(x).y(y),
      symbol_path = d3.svg.symbol().type(shape).size(size);
  
  var mark_id = 0,
      clip_id = 0;
  
  var textAlign = {
    "left":   "start",
    "center": "middle",
    "right":  "end"
  };
  
  var styles = {
    "fill":             "fill",
    "fillOpacity":      "fill-opacity",
    "stroke":           "stroke",
    "strokeWidth":      "stroke-width",
    "strokeOpacity":    "stroke-opacity",
    "strokeCap":        "stroke-linecap",
    "strokeDash":       "stroke-dasharray",
    "strokeDashOffset": "stroke-dashoffset",
    "opacity":          "opacity"
  };
  var styleProps = vg.keys(styles);

  function style(d) {
    var i, n, prop, name, value,
        o = d.mark ? d : d.length ? d[0] : null;
    if (o === null) return;

    for (i=0, n=styleProps.length; i<n; ++i) {
      prop = styleProps[i];
      name = styles[prop];
      value = o[prop];

      if (value == null) {
        if (name === "fill") this.style.setProperty(name, "none", null);
        else this.style.removeProperty(name);
      } else {
        if (value.id) {
          // ensure definition is included
          vg.svg._cur._defs.gradient[value.id] = value;
          value = "url(" + window.location.href + "#" + value.id + ")";
        }
        this.style.setProperty(name, value+"", null);
      }
    }
  }
  
  function arc(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
    this.setAttribute("d", arc_path(o));
  }
  
  function area(items) {
    if (!items.length) return;
    var o = items[0],
        path = o.orient === "horizontal" ? area_path_h : area_path_v;
    path
      .interpolate(o.interpolate || "linear")
      .tension(o.tension == null ? 0.7 : o.tension);
    this.setAttribute("d", path(items));
  }
  
  function line(items) {
    if (!items.length) return;
    var o = items[0];
    line_path
      .interpolate(o.interpolate || "linear")
      .tension(o.tension == null ? 0.7 : o.tension);
    this.setAttribute("d", line_path(items));
  }
  
  function path(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
    if (o.path != null) this.setAttribute("d", o.path);
  }

  function rect(o) {
    this.setAttribute("x", o.x || 0);
    this.setAttribute("y", o.y || 0);
    this.setAttribute("width", o.width || 0);
    this.setAttribute("height", o.height || 0);
  }

  function rule(o) {
    var x1 = o.x || 0,
        y1 = o.y || 0;
    this.setAttribute("x1", x1);
    this.setAttribute("y1", y1);
    this.setAttribute("x2", o.x2 != null ? o.x2 : x1);
    this.setAttribute("y2", o.y2 != null ? o.y2 : y1);
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
          ? h/2 : (o.baseline === "bottom" ? h : 0)),
        url = vg.data.load.sanitizeUrl(o.url);
    if (url) {
      this.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
    }
    this.setAttribute("x", x);
    this.setAttribute("y", y);
    this.setAttribute("width", w);
    this.setAttribute("height", h);
  }
    
  function fontString(o) {
    var f = (o.fontStyle ? o.fontStyle + " " : "")
      + (o.fontVariant ? o.fontVariant + " " : "")
      + (o.fontWeight ? o.fontWeight + " " : "")
      + (o.fontSize != null ? o.fontSize : vg.config.render.fontSize) + "px "
      + (o.font || vg.config.render.font);
    return f;
  }
  
  function text(o) {
    var x = o.x || 0,
        y = o.y || 0,
        dx = o.dx || 0,
        dy = o.dy || 0,
        a = o.angle || 0,
        r = o.radius || 0,
        align = textAlign[o.align || "left"],
        base = o.baseline==="top" ? ".9em"
             : o.baseline==="middle" ? ".35em" : 0;

    if (r) {
      var t = (o.theta || 0) - Math.PI/2;
      x += r * Math.cos(t);
      y += r * Math.sin(t);
    }

    this.setAttribute("x", x + dx);
    this.setAttribute("y", y + dy);
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

    if (o.clip) {
      var c = {width: o.width || 0, height: o.height || 0},
          id = o.clip_id || (o.clip_id = "clip" + clip_id++);
      vg.svg._cur._defs.clipping[id] = c;
      this.setAttribute("clip-path", "url(#"+id+")");
    }
  }

  function group_bg(o) {
    var w = o.width || 0,
        h = o.height || 0;
    this.setAttribute("width", w);
    this.setAttribute("height", h);
  }

  function cssClass(def) {
    var cls = "type-" + def.type;
    if (def.name) cls += " " + def.name;
    return cls;
  }

  function draw(tag, attr, nest) {
    return function(g, scene, index) {
      drawMark(g, scene, index, tag, attr, nest);
    };
  }
  
  function drawMark(g, scene, index, tag, attr, nest) {
    var data = nest ? [scene.items] : scene.items,
        evts = scene.interactive===false ? "none" : null,
        grps = g.node().childNodes,
        notG = (tag !== "g"),
        p = (p = grps[index+1]) // +1 to skip group background rect
          ? d3.select(p)
          : g.append("g")
             .attr("id", "g"+(++mark_id))
             .attr("class", cssClass(scene.def));

    var id = p.attr("id"),
        s = "#" + id + " > " + tag,
        m = p.selectAll(s).data(data),
        e = m.enter().append(tag);

    if (notG) {
      p.style("pointer-events", evts);
      e.each(function(d) {
        if (d.mark) d._svg = this;
        else if (d.length) d[0]._svg = this;
      });
    } else {
      e.append("rect").attr("class","background").style("pointer-events",evts);
    }
    
    m.exit().remove();
    m.each(attr);
    if (notG) m.each(style);
    else p.selectAll(s+" > rect.background").each(group_bg).each(style);
    
    return p;
  }

  function drawGroup(g, scene, index) {
    var p = drawMark(g, scene, index, "g", group),
        c = p.node().childNodes, n = c.length, i, j, m;
    
    for (i=0; i<n; ++i) {
      var items = c[i].__data__.items,
          legends = c[i].__data__.legendItems || [],
          axes = c[i].__data__.axisItems || [],
          sel = d3.select(c[i]),
          idx = 0;

      for (j=0, m=axes.length; j<m; ++j) {
        if (axes[j].def.layer === "back") {
          drawGroup.call(this, sel, axes[j], idx++);
        }
      }
      for (j=0, m=items.length; j<m; ++j) {
        this.draw(sel, items[j], idx++);
      }
      for (j=0, m=axes.length; j<m; ++j) {
        if (axes[j].def.layer !== "back") {
          drawGroup.call(this, sel, axes[j], idx++);
        }
      }
      for (j=0, m=legends.length; j<m; ++j) {
        drawGroup.call(this, sel, legends[j], idx++);
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
      rule:    rule,
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
      rule:    draw("line", rule),
      text:    draw("text", text),
      image:   draw("image", image),
      draw:    draw // expose for extensibility
    }
  };
  
})();
vg.svg.Renderer = (function() {
  var renderer = function() {
    this._svg = null;
    this._ctx = null;
    this._el = null;
    this._defs = {
      gradient: {},
      clipping: {}
    };
  };
  
  var prototype = renderer.prototype;
  
  prototype.initialize = function(el, width, height, pad, bgcolor) {
    this._el = el;

    // remove any existing svg element
    d3.select(el).select("svg.marks").remove();

    // create svg element and initialize attributes
    this._svg = d3.select(el)
      .append("svg")
      .attr("class", "marks");

    if (bgcolor != null) {
      this._svg.style("background-color", bgcolor);
    }
    
    // set the svg root group
    this._ctx = this._svg.append("g");
    
    return this.resize(width, height, pad);
  };
  
  prototype.resize = function(width, height, pad) {
    this._width = width;
    this._height = height;
    this._padding = pad;
    
    this._svg
      .attr("width", width + pad.left + pad.right)
      .attr("height", height + pad.top + pad.bottom);
      
    this._ctx
      .attr("transform", "translate("+pad.left+","+pad.top+")");

    return this;
  };
  
  prototype.context = function() {
    return this._ctx;
  };
  
  prototype.element = function() {
    return this._el;
  };

  prototype.updateDefs = function() {
    var svg = this._svg,
        all = this._defs,
        dgrad = vg.keys(all.gradient),
        dclip = vg.keys(all.clipping),
        defs = svg.select("defs"), grad, clip;
  
    // get or create svg defs block
    if (dgrad.length===0 && dclip.length==0) { defs.remove(); return; }
    if (defs.empty()) defs = svg.insert("defs", ":first-child");
    
    grad = defs.selectAll("linearGradient").data(dgrad, vg.identity);
    grad.enter().append("linearGradient").attr("id", vg.identity);
    grad.exit().remove();
    grad.each(function(id) {
      var def = all.gradient[id],
          grd = d3.select(this);
  
      // set gradient coordinates
      grd.attr({x1: def.x1, x2: def.x2, y1: def.y1, y2: def.y2});
  
      // set gradient stops
      stop = grd.selectAll("stop").data(def.stops);
      stop.enter().append("stop");
      stop.exit().remove();
      stop.attr("offset", function(d) { return d.offset; })
          .attr("stop-color", function(d) { return d.color; });
    });
    
    clip = defs.selectAll("clipPath").data(dclip, vg.identity);
    clip.enter().append("clipPath").attr("id", vg.identity);
    clip.exit().remove();
    clip.each(function(id) {
      var def = all.clipping[id],
          cr = d3.select(this).selectAll("rect").data([1]);
      cr.enter().append("rect");
      cr.attr("x", 0)
        .attr("y", 0)
        .attr("width", def.width)
        .attr("height", def.height);
    });
  };
  
  prototype.render = function(scene, items) {
    vg.svg._cur = this;

    if (items) {
      this.renderItems(vg.array(items));
    } else {
      this.draw(this._ctx, scene, -1);
    }
    this.updateDefs();

   delete vg.svg._cur;
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
  };
  
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
    this._svg = d3.select(el).select("svg.marks").node();
    this._padding = pad;
    this._obj = obj || null;
    return this;
  };
  
  prototype.padding = function(pad) {
    this._padding = pad;
    return this;
  };
  
  prototype.model = function(model) {
    if (!arguments.length) return this._model;
    this._model = model;
    return this;
  };
  
  prototype.handlers = function() {
    var h = this._handlers;
    return vg.keys(h).reduce(function(a, k) {
      return h[k].reduce(function(a, x) { return (a.push(x), a); }, a);
    }, []);
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

vg.data.ingestAll = function(data) {
  return vg.isTree(data)
    ? vg_make_tree(vg.data.ingestTree(data[0], data.children))
    : data.map(vg.data.ingest);
};

vg.data.ingest = function(datum, index) {
  return {
    data: datum,
    index: index
  };
};

vg.data.ingestTree = function(node, children, index) {
  var d = vg.data.ingest(node, index || 0),
      c = node[children], n, i;
  if (c && (n = c.length)) {
    d.values = Array(n);
    for (i=0; i<n; ++i) {
      d.values[i] = vg.data.ingestTree(c[i], children, i);
    }
  }
  return d;
};

function vg_make_tree(d) {
  d.__vgtree__ = true;
  d.nodes = function() { return vg_tree_nodes(this, []); };
  return d;
}

function vg_tree_nodes(root, nodes) {
  var c = root.values,
      n = c ? c.length : 0, i;
  nodes.push(root);
  for (i=0; i<n; ++i) { vg_tree_nodes(c[i], nodes); }
  return nodes;
}

function vg_data_duplicate(d) {
  var x=d, i, n;
  if (vg.isArray(d)) {
    x = [];
    for (i=0, n=d.length; i<n; ++i) {
      x.push(vg_data_duplicate(d[i]));
    }
  } else if (vg.isObject(d)) {
    x = {};
    for (i in d) {
      x[i] = vg_data_duplicate(d[i]);
    }
  }
  return x;
}

vg.data.mapper = function(func) {
  return function(data) {
    data.forEach(func);
    return data;
  };
};

vg.data.size = function(size, group) {
  size = vg.isArray(size) ? size : [0, size];
  size = size.map(function(d) {
    return (typeof d === 'string') ? group[d] : d;
  });
  return size;
};vg.data.load = (function() {

  // Matches absolute URLs with optional protocol
  //   https://...    file://...    //...
  var protocolRE = /^([A-Za-z]+:)?\/\//;

  // Special treatment in node.js for the file: protocol
  var fileProtocol = 'file://';

  // Validate and cleanup URL to ensure that it is allowed to be accessed
  // Returns cleaned up URL, or false if access is not allowed
  function sanitizeUrl(url) {
    // In case this is a relative url (has no host), prepend config.baseURL
    if (vg.config.baseURL && !protocolRE.test(url)) {
      if (!vg.startsWith(url, '/') && vg.config.baseURL[vg.config.baseURL.length-1] !== '/') {
        url = '/' + url; // Ensure that there is a slash between the baseURL (e.g. hostname) and url
      }
      url = vg.config.baseURL + url;
    }
    // relative protocol, starts with '//'
    if (vg.config.isNode && vg.startsWith(url, '//')) {
      url = vg.config.defaultProtocol + url;
    }
    // If vg.config.domainWhiteList is set, only allows url, whose hostname
    // * Is the same as the origin (window.location.hostname)
    // * Equals one of the values in the whitelist
    // * Is a proper subdomain of one of the values in the whitelist
    if (vg.config.domainWhiteList) {
      var domain, origin;
      if (vg.config.isNode) {
        // relative protocol is broken: https://github.com/defunctzombie/node-url/issues/5
        var parts = require('url').parse(url);
        // In safe mode, make sure url begins with http:// or https://
        if (vg.config.safeMode && parts.protocol !== 'http:' && parts.protocol !== 'https:') {
          return false;
        }
        domain = parts.hostname;
        origin = null;
      } else {
        var a = document.createElement('a');
        a.href = url;
        // From http://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
        // IE doesn't populate all link properties when setting .href with a relative URL,
        // however .href will return an absolute URL which then can be used on itself
        // to populate these additional fields.
        if (a.host == "") {
          a.href = a.href;
        }
        domain = a.hostname.toLowerCase();
        origin = window.location.hostname;
      }

      if (origin !== domain) {
        var whiteListed = vg.config.domainWhiteList.some(function (d) {
          var idx = domain.length - d.length;
          return d === domain ||
            (idx > 1 && domain[idx-1] === '.' && domain.lastIndexOf(d) === idx);
        });
        if (!whiteListed) {
          vg.error('URL is not whitelisted: ' + url);
          url = false;
        }
      }
    }
    return url;
  }

  function load(uri, callback) {
    var url = vg.data.load.sanitizeUrl(uri); // allow sanitizer override
    if (!url) {
      callback('Bad URL', null);
    } else if (!vg.config.isNode) {
      // in browser, use xhr
      xhr(url, callback);
    } else if (vg.startsWith(url, fileProtocol)) {
      // in node.js, if url starts with 'file://', strip it and load from file
      file(url.slice(fileProtocol.length), callback);
    } else {
      // for regular URLs in node.js
      http(url, callback);
    }
  }

  function xhr(url, callback) {
    vg.log('LOAD XHR: ' + url);
    var xhrReq = d3.xhr(url);
    if (vg.config.dataHeaders) {
      vg.keys(vg.config.dataHeaders).forEach(function(k) {
        xhrReq.header(k, vg.config.dataHeaders[k]);
      });
    }
    xhrReq.get(function(err, resp) {
      if (resp) resp = resp.responseText;
      callback(err, resp);
    });
  }

  function file(file, callback) {
    vg.log('LOAD FILE: ' + file);
    require('fs').readFile(file, callback);
  }

  function http(url, callback) {
    vg.log('LOAD HTTP: ' + url);
    var options = {url: url, encoding: null, gzip: true};
    if (vg.config.dataHeaders) {
      options.headers = vg.config.dataHeaders;
    }
    require('request').get(options, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        callback(null, body);
      } else {
        callback(error, null);
      }
    });
  }

  load.sanitizeUrl = sanitizeUrl;
  return load;
})();
vg.data.read = (function() {
  var formats = {},
      parsers = {
        "number": vg.number,
        "boolean": vg.boolean,
        "date": vg.date
      };

  function read(data, format) {
    var type = (format && format.type) || "json";
    data = formats[type](data, format);
    if (format && format.parse) parseValues(data, format.parse);
    return data;
  }

  formats.json = function(data, format) {
    var d = vg.isObject(data) ? data : JSON.parse(data);
    if (format && format.property) {
      d = vg.accessor(format.property)(d);
    }
    return d;
  };

  formats.csv = function(data, format) {
    var d = d3.csv.parse(data);
    return d;
  };

  formats.tsv = function(data, format) {
    var d = d3.tsv.parse(data);
    return d;
  };
  
  formats.topojson = function(data, format) {
    if (topojson == null) {
      vg.error("TopoJSON library not loaded.");
      return [];
    }    
    var t = vg.isObject(data) ? data : JSON.parse(data),
        obj = [];

    if (format && format.feature) {
      obj = (obj = t.objects[format.feature])
        ? topojson.feature(t, obj).features
        : (vg.error("Invalid TopoJSON object: "+format.feature), []);
    } else if (format && format.mesh) {
      obj = (obj = t.objects[format.mesh])
        ? [topojson.mesh(t, t.objects[format.mesh])]
        : (vg.error("Invalid TopoJSON object: " + format.mesh), []);
    }
    else { vg.error("Missing TopoJSON feature or mesh parameter."); }

    return obj;
  };
  
  formats.treejson = function(data, format) {
    data = vg.isObject(data) ? data : JSON.parse(data);
    return vg.tree(data, format.children);
  };
  
  function parseValues(data, types) {
    var cols = vg.keys(types),
        p = cols.map(function(col) { return parsers[types[col]]; }),
        tree = vg.isTree(data);
    vg_parseArray(tree ? [data] : data, cols, p, tree);
  }
  
  function vg_parseArray(data, cols, p, tree) {
    var d, i, j, len, clen;
    for (i=0, len=data.length; i<len; ++i) {
      d = data[i];
      for (j=0, clen=cols.length; j<clen; ++j) {
        d[cols[j]] = p[j](d[cols[j]]);
      }
      if (tree && d.values) parseValues(d, cols, p, true);
    }
  }

  read.formats = formats;
  read.parse = parseValues;
  return read;
})();vg.data.aggregate = (function() {

  var SUM = 1,
      AVG = 2,
      DEV = 4,
      MIN = 8,
      MAX = 16,
      VAL = 32;

  function Monoid(field) {
    this.field = field;
    this.ops = [];
    this.flags = 0;
    this.count = 0;
  }

  Monoid.prototype.clone = function() {
    var clone = new Monoid(this.field), k, v;
    for (k in this) {
      v = this[k];
      clone[k] = vg.isArray(v) ? v.slice() : v;
    }
    return clone;
  };

  Monoid.prototype.init = function(op) {
    if (op === 'sum') {
      this.flags |= SUM;
      this.sum = 0;
    }
    else if (op === 'avg') {
      this.flags |= AVG;
      this.avg = 0;
    }
    else if (op === 'var' || op === 'std') {
      this.flags |= DEV | AVG;
      this.avg = 0;
      this.dev = 0;
    }
    else if (op === 'min') {
      this.flags |= MIN;
      this.min = +Infinity;
    }
    else if (op === 'max') {
      this.flags |= MAX;
      this.max = -Infinity;
    }
    else if (op === 'median') {
      this.flags |= VAL;
      this.vals = [];
    }
    this.ops.push(op);
  };

  Monoid.prototype.update = function(v) {
    var m = this, f = m.flags, d;
    m.count += 1;
    if (f & SUM) { m.sum += v; }
    if (f & AVG) { d = (v - m.avg); m.avg += d / m.count; }
    if (f & DEV) { m.dev += d * (v - m.avg); }
    if (f & MIN) { m.min = v < m.min ? v : m.min; }
    if (f & MAX) { m.max = v > m.max ? v : m.max; }
    if (f & VAL) { m.vals.push(v); }
  };

  Monoid.prototype.value = function(op) {
    switch (op) {
      case 'sum': return this.sum;
      case 'avg': return this.avg;
      case 'var': return this.dev / (this.count - 1);
      case 'std': return Math.sqrt(this.dev / (this.count - 1));
      case 'min': return this.min;
      case 'max': return this.max;
      case 'median':
        var v = this.vals, n = v.length, hn = ~~(n/2);
        return n ? (n % 2 ? v[hn] : 0.5 * (v[hn-1] + v[hn])) : 0;
    }
  };

  Monoid.prototype.done = function(o) {
    if (this.vals) this.vals.sort(vg.numcmp);
    var ops = this.ops;
    for (var i=0; i<ops.length; ++i) {
      if (ops[i] === 'count') {
        o.count = this.count;
      } else {
        o[ops[i] + "_" + this.field] = this.value(ops[i]);
      }
    }
    return o;
  };

  return function() {
    var groupby = [],
  	    cells = {},
  	    monoids, gaccess, faccess;

    function cell(x) {
      var k = vg.keystr(gaccess.map(function(f) { return f(x); }));
      return cells[k] || (cells[k] = new_cell(x));
    }
    
    function new_cell(x) {
      var c = monoids.map(function(m) { return m.clone(); });
      c.data = {};
      for (i=0; i<groupby.length; ++i) {
        c.data[groupby[i]] = gaccess[i](x);
      }
      return c;
    }

    function aggregate(input) {
      var k, i, j, x, c;

      // compute aggregates
      for (i=0; i<input.length; ++i) {
        x = input[i];
        c = cell(x);
        for (j=0; j<c.length; ++j) {
          c[j].update(faccess[j](x));
  			}
      }

      // collect output tuples
      var output = [], index = 0;
      for (k in cells) {
        c = cells[k];
        for (i=0; i<c.length; ++i) {
          c[i].done(c.data);
  			}
        output.push({index: index++, data: c.data});
      }

      cells = {}; // clear internal state
      return output;
    }

    aggregate.fields = function(f) {
      var map = {};
      faccess = [];
      monoids = vg.array(f).reduce(function(m, x) {
        var xf = x.field, f;
        if (!map[xf]) {
          faccess.push(vg.accessor(xf));
          f = xf.indexOf("data.") === 0 ? xf.slice(5) : xf;
          m.push(map[xf] = new Monoid(f));
        }
        map[xf].init(x.op);
        return m;
      }, []);
      return aggregate;
    };

    aggregate.groupby = function(f) {
      groupby = vg.array(f);
      gaccess = groupby.map(function(x,i) {
        if (x.indexOf("data.") === 0) {
          groupby[i] = x.slice(5);
        }
        return vg.accessor(x);
      });
      return aggregate;
    };

    return aggregate;
  };

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
};vg.data.bin = function() {

  var field,
      accessor,
      setter,
      min,
      max,
      step,
      maxbins = 20,
      output = "bin";

  function bin(input) {
    var opt = {
      min: min != null ? min : +Infinity,
      max: max != null ? max : -Infinity,
      step: step != null ? step : null,
      maxbins: maxbins
    };
    if (min == null || max == null) {
      input.forEach(function(d) {
        var v = accessor(d);
        if (min == null && v > opt.max) opt.max = v;
        if (max == null && v < opt.min) opt.min = v;
      });
    }
    var b = vg.bins(opt);
    input.forEach(function(d) {
      var v = accessor(d);
      setter(d, b.start + b.step * ~~((v - b.start) / b.step));
    });
    return input;
  }

  bin.min = function(x) {
    min = x;
    return bin;
  };

  bin.max = function(x) {
    max = x;
    return bin;
  };

  bin.step = function(x) {
    step = x;
    return bin;
  };

  bin.maxbins = function(x) {
    maxbins = x;
    return bin;
  };

  bin.field = function(f) {
    field = f;
    accessor = vg.accessor(f);
    return bin;
  };

  bin.output = function(f) {
    output = f;
    setter = vg.mutator(f);
    return bin;
  };

  return bin;
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
};vg.data.cross = function() {
  var other = null,
      nodiag = false,
      output = {left:"a", right:"b"};

  function cross(data) {
    var result = [],
        data2 = other || data,
        o, i, j, n = data.length;

    for (i=0; i<n; ++i) {
      for (j=0; j<n; ++j) {
        if (nodiag && i===j) continue;
        o = {};
        o[output.left] = data[i];
        o[output.right] = data2[j];
        result.push(o);
      }
    }
    return result;
  }

  cross["with"] = function(d) {
    other = d;
    return cross;
  };
  
  cross.diagonal = function(x) {
    nodiag = !x;
    return cross;
  };

  cross.output = function(map) {
    vg.keys(output).forEach(function(k) {
      if (map[k] !== undefined) { output[k] = map[k]; }
    });
    return cross;
  };

  return cross;
};
vg.data.facet = function() {

  var keys = [],
      sort = null;

  function facet(data) {
    var result = {
          key: "",
          keys: [],
          values: []
        },
        map = {},
        vals = result.values,
        obj, klist, kstr, len, i;

    if (keys.length === 0) {
      // if no keys, skip collation step
      vals.push(obj = {
        key: "",
        keys: [],
        index: 0,
        values: sort ? data.slice() : data
      });
      if (sort) sort(obj.values);
      return result;
    }

    for (i=0, len=data.length; i<len; ++i) {
      klist = keys.map(function(f) { return f(data[i]); });
      kstr = vg.keystr(klist);
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
        sort(vals[i].values);
      }
    }

    return result;
  }

  facet.keys = function(k) {
    keys = vg.array(k).map(vg.accessor);
    return facet;
  };

  facet.sort = function(s) {
    sort = vg.data.sort().by(s);
    return facet;
  };

  return facet;
};vg.data.filter = function() {

  var test = null;

  function filter(data) {
    return test ? data.filter(test) : data;
  }
  
  filter.test = function(func) {
    test = vg.isFunction(func) ? func : vg.parse.expr(func);
    return filter;
  };

  return filter;
};vg.data.flatten = function() {
    
  function flatten(data) {
    return flat(data, []);
  }
  
  function flat(data, list) {
    if (data.values) {
      for (var i=0, n=data.values.length; i<n; ++i) {
        flat(data.values[i], list);
      }
    } else {
      list.push(data);
    }
    return list;
  }
  
  return flatten;
};vg.data.fold = function() {
  var fields = [],
      accessors = [],
      output = {
        key: "key",
        value: "value"
      };

  function fold(data) {
    var values = [],
        item, i, j, n, m = fields.length;

    for (i=0, n=data.length; i<n; ++i) {
      item = data[i];
      for (j=0; j<m; ++j) {
        var o = {
          index: values.length,
          data: item.data
        };
        o[output.key] = fields[j];
        o[output.value] = accessors[j](item);
        values.push(o);
      }
    }

    return values;
  }  

  fold.fields = function(f) {
    fields = vg.array(f);
    accessors = fields.map(vg.accessor);
    return fold;
  };

  fold.output = function(map) {
    vg.keys(output).forEach(function(k) {
      if (map[k] !== undefined) {
        output[k] = map[k];
      }
    });
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
    };
  });

  return force;
};

vg.data.force.dependencies = ["links"];vg.data.formula = (function() {
  return function() {
    var field = null,
        expr = vg.identity,
        setter;

    var formula = vg.data.mapper(function(d, i, list) {
      if (field) {
        setter(d, expr.call(null, d, i, list));
      }
      return d;
    });

    formula.field = function(name) {
      field = name;
      setter = vg.mutator(field);
      return formula;
    };

    formula.expr = function(func) {
      expr = vg.isFunction(func) ? func : vg.parse.expr(func);
      return formula;
    };

    return formula;
  };
})();vg.data.geo = (function() {
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
      };
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
  }
  
  geo.params = params;
  return geo;
})();
vg.data.geopath = function() {
  var geopath = d3.geo.path().projection(d3.geo.mercator()),
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
    };
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
  var one = function() { return 1; },
      value = one,
      start = 0,
      end = 2 * Math.PI,
      sort = false,
      output = {
        "startAngle": "startAngle",
        "endAngle": "endAngle",
        "midAngle": "midAngle"
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
      data[i][output.midAngle] = (a + 0.5 * d * k);
      data[i][output.endAngle] = (a += d * k);
    });
    
    return data;
  }

  pie.sort = function(b) {
    sort = b;
    return pie;
  };
       
  pie.value = function(field) {
    value = field ? vg.accessor(field) : one;
    return pie;
  };
  
  pie.startAngle = function(startAngle) {
    start = Math.PI * startAngle / 180;
    return pie;
  };
  
  pie.endAngle = function(endAngle) {
    end = Math.PI * endAngle / 180;
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
};vg.data.slice = function() {
  var by = null,
      field = vg.accessor("data");

  function slice(data) {
    data = vg.values(data);
    
    if (by === "min") {
      data = [data[vg.minIndex(data, field)]];
    } else if (by === "max") {
      data = [data[vg.maxIndex(data, field)]];
    } else if (by === "median") {
      var list = data.slice().sort(function(a,b) {
        a = field(a); b = field(b);
        return a < b ? -1 : a > b ? 1 : 0;
      });
      data = [data[~~(list.length/2)]];
    } else {
      var idx = vg.array(by);
      data = data.slice(idx[0], idx[1]);
    }
    return data;
  }
  
  slice.by = function(x) {
    by = x;
    return slice;
  };
  
  slice.field = function(f) {
    field = vg.accessor(f);
    return slice;
  };

  return slice;
};vg.data.sort = function() {
  var by = null;

  function sort(data) {
    data = (vg.isArray(data) ? data : data.values || []);
    data.sort(by);
    for (var i=0, n=data.length; i<n; ++i) data[i].index = i; // re-index
    return data;
  }
  
  sort.by = function(s) {
    by = vg.comparator(s);
    return sort;
  };

  return sort;
};vg.data.stack = function() {
  var layout = d3.layout.stack(),
      point = vg.accessor("index"),
      height = vg.accessor("data"),
      params = ["offset", "order"],
      output = {
        "y0": "y2",
        "y1": "y",
        "cy": "cy"
      };

  function stack(data) {
    var out_y0 = output.y0,
        out_y1 = output.y1,
        out_cy = output.cy;
    
    var series = stacks(data);
    if (series.length === 0) return data;
    
    layout.out(function(d, y0, y) {
      if (d.datum) {
        d.datum[out_y0] = y0;
        d.datum[out_y1] = y + y0;
        d.datum[out_cy] = y0 + y/2;
      }
    })(series);
    
    return data;
  }
  
  function stacks(data) {
    var values = vg.values(data),
        points = [], series = [],
        a, i, n, j, m, k, p, v, x;

    // exit early if no data
    if (values.length === 0) return series;

    // collect and sort data points
    for (i=0, n=values.length; i<n; ++i) {
      a = vg.values(values[i]);
      for (j=0, m=a.length; j<m; ++j) {
        points.push({x:point(a[j]), y:height(a[j]), z:i, datum:a[j]});
      }
      series.push([]);
    }
    points.sort(function(a,b) {
      return a.x<b.x ? -1 : a.x>b.x ? 1 : (a.z<b.z ? -1 : a.z>b.z ? 1 : 0);
    });

    // emit data series for stack layout
    for (x=points[0].x, i=0, j=0, k=0, n=points.length; k<n; ++k) {
      p = points[k];    
      if (p.x !== x) {
        while (i < series.length) series[i++].push({x:j, y:0});
        x = p.x; i = 0; j += 1;
      }
      while (p.z > i) series[i++].push({x:j, y:0});
      p.x = j;
      series[i++].push(p);
    }
    while (i < series.length) series[i++].push({x:j, y:0});

    return series;
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
    };
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
      assign = false,
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

    if (assign) {
      list = (vg.isArray(data) ? data : data.values);
      v = {};
      v[output.count] = len;
      v[output.min] = min;
      v[output.max] = max;
      v[output.sum] = sum;
      v[output.mean] = mean;
      v[output.variance] = M2;
      v[output.stdev] = Math.sqrt(M2);
      if (median) v[output.median] = o[output.median];
      for (i=0, len=list.length; i<len; ++i) {
        list[i].stats = v;
      }
      if (vg.isArray(data)) o = list;
    }

    return o;
  }

  function stats(data) {
    if (vg.isArray(data)) {
      return reduce(data);
    } else {
      return (data.values || []).map(reduce);
    }
  }

  stats.median = function(bool) {
    median = bool || false;
    return stats;
  };

  stats.value = function(field) {
    value = vg.accessor(field);
    return stats;
  };

  stats.assign = function(b) {
    assign = b;
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
      .nodes(vg.isTree(data) ? data : {values: data});
    
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
    };
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
};vg.data.truncate = function() {
  var value = vg.accessor("data"),
      as = "truncate",
      position = "right",
      ellipsis = "...",
      wordBreak = true,
      limit = 100,
      setter;

  var truncate = vg.data.mapper(function(d) {
    var text = vg.truncate(value(d), limit, position, wordBreak, ellipsis);
    setter(d, text);
    return d;
  });

  truncate.value = function(field) {
    value = vg.accessor(field);
    return truncate;
  };

  truncate.output = function(field) {
    as = field;
    setter = vg.mutator(field);
    return truncate;
  };

  truncate.limit = function(len) {
    limit = +len;
    return truncate;
  };

  truncate.position = function(pos) {
    position = pos;
    return truncate;
  };

  truncate.ellipsis = function(str) {
    ellipsis = str+"";
    return truncate;
  };

  truncate.wordbreak = function(b) {
    wordBreak = !!b;
    return truncate;
  };

  return truncate;
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
};vg.data.window = function() {

  var size = 2,
      step = 1;
  
  function win(data) {
    data = vg.isArray(data) ? data : data.values || [];
    var runs = [], i, j, n=data.length-size, curr;
    for (i=0; i<=n; i+=step) {
      for (j=0, curr=[]; j<size; ++j) curr.push(data[i+j]);
      runs.push({key: i, values: curr});
    }
    return {values: runs};
  }
  
  win.size = function(n) {
    size = n;
    return win;
  };
  
  win.step = function(n) {
    step = n;
    return win;
  };

  return win;
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
          keys = vg.keys(output),
          key, d, i, n, k, m = keys.length;

      // sort data to match wordcloud order
      data.sort(function(a,b) {
        return fontSize(b) - fontSize(a);
      });

      for (i=0, n=tags.length; i<n; ++i) {
        d = data[i];
        for (k=0; k<m; ++k) {
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
    };
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
      defaultValue,
      withKey = null;

  function zip(data, db) {
    var zdata = db[z], zlen = zdata.length, v, d, i, len, map;
    
    if (withKey) {
      map = {};
      zdata.forEach(function(s) { map[withKey(s)] = s; });
    }
    
    for (i=0, len=data.length; i<len; ++i) {
      d = data[i];
      d[as] = map
        ? ((v=map[key(d)]) != null ? v : defaultValue)
        : zdata[i % zlen];
    }
    
    return data;
  }

  zip["with"] = function(d) {
    z = d;
    return zip;
  };
  
  zip["default"] = function(d) {
    defaultValue = d;
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
};

vg.data.zip.dependencies = ["with"];vg.expression = {};

vg.expression.parse = function(input, opt) {
  return vg_expression_parser.parse("("+input+")", opt);
};

vg.expression.code = function(opt) {
  return vg_expression_codegen(opt);
};var vg_expression_constants = {
  "NaN":     "NaN",
  "E":       "Math.E",
  "LN2":     "Math.LN2",
  "LN10":    "Math.LN10",
  "LOG2E":   "Math.LOG2E",
  "LOG10E":  "Math.LOG10E",
  "PI":      "Math.PI",
  "SQRT1_2": "Math.SQRT1_2",
  "SQRT2":   "Math.SQRT2"
};var vg_expression_functions = function(codegen) {

  function fncall(name, args, cast, type) {
    var obj = codegen(args[0]);
    if (cast) {
      obj = cast + "(" + obj + ")";
      if (vg.startsWith(cast, "new ")) obj = "(" + obj + ")";
    }
    return obj + "." + name + (type < 0 ? "" : type === 0
      ? "()"
      : "(" + args.slice(1).map(codegen).join(",") + ")");
  }
  
  var DATE = "new Date";
  var STRING = "String";
  var REGEXP = "RegExp";

  return {
    // MATH functions
    "isNaN":    "isNaN",
    "isFinite": "isFinite",
    "abs":      "Math.abs",
    "acos":     "Math.acos",
    "asin":     "Math.asin",
    "atan":     "Math.atan",
    "atan2":    "Math.atan2",
    "ceil":     "Math.ceil",
    "cos":      "Math.cos",
    "exp":      "Math.exp",
    "floor":    "Math.floor",
    "log":      "Math.log",
    "max":      "Math.max",
    "min":      "Math.min",
    "pow":      "Math.pow",
    "random":   "Math.random",
    "round":    "Math.round",
    "sin":      "Math.sin",
    "sqrt":     "Math.sqrt",
    "tan":      "Math.tan",

    // DATE functions
    "now":      "Date.now",
    "datetime": "new Date",
    "date": function(args) {
        return fncall("getDate", args, DATE, 0);
      },
    "day": function(args) {
        return fncall("getDay", args, DATE, 0);
      },
    "year": function(args) {
        return fncall("getFullYear", args, DATE, 0);
      },
    "month": function(args) {
        return fncall("getMonth", args, DATE, 0);
      },
    "hours": function(args) {
        return fncall("getHours", args, DATE, 0);
      },
    "minutes": function(args) {
        return fncall("getMinutes", args, DATE, 0);
      },
    "seconds": function(args) {
        return fncall("getSeconds", args, DATE, 0);
      },
    "milliseconds": function(args) {
        return fncall("getMilliseconds", args, DATE, 0);
      },
    "time": function(args) {
        return fncall("getTime", args, DATE, 0);
      },
    "timezoneoffset": function(args) {
        return fncall("getTimezoneOffset", args, DATE, 0);
      },
    "utcdate": function(args) {
        return fncall("getUTCDate", args, DATE, 0);
      },
    "utcday": function(args) {
        return fncall("getUTCDay", args, DATE, 0);
      },
    "utcyear": function(args) {
        return fncall("getUTCFullYear", args, DATE, 0);
      },
    "utcmonth": function(args) {
        return fncall("getUTCMonth", args, DATE, 0);
      },
    "utchours": function(args) {
        return fncall("getUTCHours", args, DATE, 0);
      },
    "utcminutes": function(args) {
        return fncall("getUTCMinutes", args, DATE, 0);
      },
    "utcseconds": function(args) {
        return fncall("getUTCSeconds", args, DATE, 0);
      },
    "utcmilliseconds": function(args) {
        return fncall("getUTCMilliseconds", args, DATE, 0);
      },

    // shared sequence functions
    "length": function(args) {
        return fncall("length", args, null, -1);
      },
    "indexof": function(args) {
        return fncall("indexOf", args, null);
      },
    "lastindexof": function(args) {
        return fncall("lastIndexOf", args, null);
      },

    // STRING functions
    "parseFloat": "parseFloat",
    "parseInt": "parseInt",
    "upper": function(args) {
        return fncall("toUpperCase", args, STRING, 0);
      },
    "lower": function(args) {
        return fncall("toLowerCase", args, STRING, 0);
      },
    "slice": function(args) {
        return fncall("slice", args, STRING);
      },
    "substring": function(args) {
        return fncall("substring", args, STRING);
      },

    // REGEXP functions
    "test": function(args) {
        return fncall("test", args, REGEXP);
      },
    
    // Control Flow functions
    "if": function(args) {
        if (args.length < 3)
          throw new Error("Missing arguments to if function.");
        if (args.length > 3)
        throw new Error("Too many arguments to if function.");
        var a = args.map(codegen);
        return a[0]+"?"+a[1]+":"+a[2];
      }
  };
};var vg_expression_codegen = function(opt) {
  opt = opt || {};
  var constants = opt.constants || vg_expression_constants;
  var functions = (opt.functions || vg_expression_functions)(codegen);
  var idWhiteList = opt.idWhiteList ? vg.toMap(opt.idWhiteList) : null;
  var idBlackList = opt.idBlackList ? vg.toMap(opt.idBlackList) : null;
  var memberDepth = 0;

  function codegen(ast) {
    if (ast instanceof String) return ast;
    var generator = CODEGEN_TYPES[ast.type];
    if (generator == null) {
      throw new Error("Unsupported type: " + ast.type);
    }
    return generator(ast);
  }

  var CODEGEN_TYPES = {
    "Literal": function(n) {
        return n.raw;
      },
    "Identifier": function(n) {
        var id = n.name;
        if (memberDepth > 0) {
          return id;
        }
        if (constants.hasOwnProperty(id)) {
          return constants[id];
        }
        if (idWhiteList) {
          if (idWhiteList.hasOwnProperty(id)) return id;
          throw new Error("Illegal identifier: " + id);
        }
        if (idBlackList && idBlackList.hasOwnProperty(id)) {
          throw new Error("Illegal identifier: " + id);
        }
        return id;
      },
    "Program": function(n) {
        return n.body.map(codegen).join("\n");
      },
    "MemberExpression": function(n) {
        var d = !n.computed;
        var o = codegen(n.object);
        if (d) memberDepth += 1;
        var p = codegen(n.property);
        if (d) memberDepth -= 1;
        return o + (d ? "."+p : "["+p+"]");
      },
    "CallExpression": function(n) {
        if (n.callee.type !== "Identifier") {
          throw new Error("Illegal callee type: " + n.callee.type);
        }
        var callee = n.callee.name;
        var args = n.arguments;
        var fn = functions.hasOwnProperty(callee) && functions[callee];
        if (!fn) throw new Error("Unrecognized function: " + callee);
        return fn instanceof Function
          ? fn(args)
          : fn + "(" + args.map(codegen).join(",") + ")";
      },
    "ArrayExpression": function(n) {
        return "[" + n.elements.map(codegen).join(",") + "]";
      },
    "BinaryExpression": function(n) {
        return "(" + codegen(n.left) + n.operator + codegen(n.right) + ")";
      },
    "UnaryExpression": function(n) {
        return "(" + n.operator + codegen(n.argument) + ")";
      },
    "UpdateExpression": function(n) {
        return "(" + (prefix
          ? n.operator + codegen(n.argument)
          : codegen(n.argument) + n.operator
        ) + ")";
      },
    "ConditionalExpression": function(n) {
        return "(" + codegen(n.test)
          + "?" + codegen(n.consequent)
          + ":" + codegen(n.alternate)
          + ")";
      },
    "LogicalExpression": function(n) {
        return "(" + codegen(n.left) + n.operator + codegen(n.right) + ")";
      },
    "ObjectExpression": function(n) {
        return "{" + n.properties.map(codegen).join(",") + "}";
      },
    "Property": function(n) {
        memberDepth += 1;
        var k = codegen(n.key);
        memberDepth -= 1;
        return k + ":" + codegen(n.value);
      },
    "ExpressionStatement": function(n) {
        return codegen(n.expression);
      }
  };
  
  return codegen;
};/*
  The following expression parser is based on Esprima (http://esprima.org/).
  Original header comment and license for Esprima is included here:

  Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2013 Thaddee Tyl <thaddee.tyl@gmail.com>
  Copyright (C) 2013 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
var vg_expression_parser = (function() {
  'use strict';

  var Token,
      TokenName,
      Syntax,
      PropertyKind,
      Messages,
      Regex,
      source,
      strict,
      index,
      lineNumber,
      lineStart,
      length,
      lookahead,
      state,
      extra;

  Token = {
      BooleanLiteral: 1,
      EOF: 2,
      Identifier: 3,
      Keyword: 4,
      NullLiteral: 5,
      NumericLiteral: 6,
      Punctuator: 7,
      StringLiteral: 8,
      RegularExpression: 9
  };

  TokenName = {};
  TokenName[Token.BooleanLiteral] = 'Boolean';
  TokenName[Token.EOF] = '<end>';
  TokenName[Token.Identifier] = 'Identifier';
  TokenName[Token.Keyword] = 'Keyword';
  TokenName[Token.NullLiteral] = 'Null';
  TokenName[Token.NumericLiteral] = 'Numeric';
  TokenName[Token.Punctuator] = 'Punctuator';
  TokenName[Token.StringLiteral] = 'String';
  TokenName[Token.RegularExpression] = 'RegularExpression';

  Syntax = {
      AssignmentExpression: 'AssignmentExpression',
      ArrayExpression: 'ArrayExpression',
      BinaryExpression: 'BinaryExpression',
      CallExpression: 'CallExpression',
      ConditionalExpression: 'ConditionalExpression',
      ExpressionStatement: 'ExpressionStatement',
      Identifier: 'Identifier',
      Literal: 'Literal',
      LogicalExpression: 'LogicalExpression',
      MemberExpression: 'MemberExpression',
      ObjectExpression: 'ObjectExpression',
      Program: 'Program',
      Property: 'Property',
      UnaryExpression: 'UnaryExpression',
      UpdateExpression: 'UpdateExpression'
  };

  PropertyKind = {
      Data: 1,
      Get: 2,
      Set: 4
  };

  // Error messages should be identical to V8.
  Messages = {
      UnexpectedToken:  'Unexpected token %0',
      UnexpectedNumber:  'Unexpected number',
      UnexpectedString:  'Unexpected string',
      UnexpectedIdentifier:  'Unexpected identifier',
      UnexpectedReserved:  'Unexpected reserved word',
      UnexpectedEOS:  'Unexpected end of input',
      NewlineAfterThrow:  'Illegal newline after throw',
      InvalidRegExp: 'Invalid regular expression',
      UnterminatedRegExp:  'Invalid regular expression: missing /',
      InvalidLHSInAssignment:  'Invalid left-hand side in assignment',
      InvalidLHSInForIn:  'Invalid left-hand side in for-in',
      MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
      NoCatchOrFinally:  'Missing catch or finally after try',
      UnknownLabel: 'Undefined label \'%0\'',
      Redeclaration: '%0 \'%1\' has already been declared',
      IllegalContinue: 'Illegal continue statement',
      IllegalBreak: 'Illegal break statement',
      IllegalReturn: 'Illegal return statement',
      StrictModeWith:  'Strict mode code may not include a with statement',
      StrictCatchVariable:  'Catch variable may not be eval or arguments in strict mode',
      StrictVarName:  'Variable name may not be eval or arguments in strict mode',
      StrictParamName:  'Parameter name eval or arguments is not allowed in strict mode',
      StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
      StrictFunctionName:  'Function name may not be eval or arguments in strict mode',
      StrictOctalLiteral:  'Octal literals are not allowed in strict mode.',
      StrictDelete:  'Delete of an unqualified identifier in strict mode.',
      StrictDuplicateProperty:  'Duplicate data property in object literal not allowed in strict mode',
      AccessorDataProperty:  'Object literal may not have data and accessor property with the same name',
      AccessorGetSet:  'Object literal may not have multiple get/set accessors with the same name',
      StrictLHSAssignment:  'Assignment to eval or arguments is not allowed in strict mode',
      StrictLHSPostfix:  'Postfix increment/decrement may not have eval or arguments operand in strict mode',
      StrictLHSPrefix:  'Prefix increment/decrement may not have eval or arguments operand in strict mode',
      StrictReservedWord:  'Use of future reserved word in strict mode'
  };

  // See also tools/generate-unicode-regex.py.
  Regex = {
      NonAsciiIdentifierStart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]'),
      NonAsciiIdentifierPart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]')
  };

  // Ensure the condition is true, otherwise throw an error.
  // This is only to have a better contract semantic, i.e. another safety net
  // to catch a logic error. The condition shall be fulfilled in normal case.
  // Do NOT use this to enforce a certain condition on any user input.

  function assert(condition, message) {
      if (!condition) {
          throw new Error('ASSERT: ' + message);
      }
  }

  function isDecimalDigit(ch) {
      return (ch >= 0x30 && ch <= 0x39);   // 0..9
  }

  function isHexDigit(ch) {
      return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
  }

  function isOctalDigit(ch) {
      return '01234567'.indexOf(ch) >= 0;
  }

  // 7.2 White Space

  function isWhiteSpace(ch) {
      return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
          (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
  }

  // 7.3 Line Terminators

  function isLineTerminator(ch) {
      return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
  }

  // 7.6 Identifier Names and Identifiers

  function isIdentifierStart(ch) {
      return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
          (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
          (ch >= 0x61 && ch <= 0x7A) ||         // a..z
          (ch === 0x5C) ||                      // \ (backslash)
          ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(String.fromCharCode(ch)));
  }

  function isIdentifierPart(ch) {
      return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
          (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
          (ch >= 0x61 && ch <= 0x7A) ||         // a..z
          (ch >= 0x30 && ch <= 0x39) ||         // 0..9
          (ch === 0x5C) ||                      // \ (backslash)
          ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(String.fromCharCode(ch)));
  }

  // 7.6.1.2 Future Reserved Words

  function isFutureReservedWord(id) {
      switch (id) {
      case 'class':
      case 'enum':
      case 'export':
      case 'extends':
      case 'import':
      case 'super':
          return true;
      default:
          return false;
      }
  }

  function isStrictModeReservedWord(id) {
      switch (id) {
      case 'implements':
      case 'interface':
      case 'package':
      case 'private':
      case 'protected':
      case 'public':
      case 'static':
      case 'yield':
      case 'let':
          return true;
      default:
          return false;
      }
  }

  // 7.6.1.1 Keywords

  function isKeyword(id) {
      if (strict && isStrictModeReservedWord(id)) {
          return true;
      }

      // 'const' is specialized as Keyword in V8.
      // 'yield' and 'let' are for compatiblity with SpiderMonkey and ES.next.
      // Some others are from future reserved words.

      switch (id.length) {
      case 2:
          return (id === 'if') || (id === 'in') || (id === 'do');
      case 3:
          return (id === 'var') || (id === 'for') || (id === 'new') ||
              (id === 'try') || (id === 'let');
      case 4:
          return (id === 'this') || (id === 'else') || (id === 'case') ||
              (id === 'void') || (id === 'with') || (id === 'enum');
      case 5:
          return (id === 'while') || (id === 'break') || (id === 'catch') ||
              (id === 'throw') || (id === 'const') || (id === 'yield') ||
              (id === 'class') || (id === 'super');
      case 6:
          return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
              (id === 'switch') || (id === 'export') || (id === 'import');
      case 7:
          return (id === 'default') || (id === 'finally') || (id === 'extends');
      case 8:
          return (id === 'function') || (id === 'continue') || (id === 'debugger');
      case 10:
          return (id === 'instanceof');
      default:
          return false;
      }
  }

  function skipComment() {
      var ch, start;

      start = (index === 0);
      while (index < length) {
          ch = source.charCodeAt(index);

          if (isWhiteSpace(ch)) {
              ++index;
          } else if (isLineTerminator(ch)) {
              ++index;
              if (ch === 0x0D && source.charCodeAt(index) === 0x0A) {
                  ++index;
              }
              ++lineNumber;
              lineStart = index;
              start = true;
          } else {
              break;
          }
      }
  }

  function scanHexEscape(prefix) {
      var i, len, ch, code = 0;

      len = (prefix === 'u') ? 4 : 2;
      for (i = 0; i < len; ++i) {
          if (index < length && isHexDigit(source[index])) {
              ch = source[index++];
              code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
          } else {
              return '';
          }
      }
      return String.fromCharCode(code);
  }

  function scanUnicodeCodePointEscape() {
      var ch, code, cu1, cu2;

      ch = source[index];
      code = 0;

      // At least, one hex digit is required.
      if (ch === '}') {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }

      while (index < length) {
          ch = source[index++];
          if (!isHexDigit(ch)) {
              break;
          }
          code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
      }

      if (code > 0x10FFFF || ch !== '}') {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }

      // UTF-16 Encoding
      if (code <= 0xFFFF) {
          return String.fromCharCode(code);
      }
      cu1 = ((code - 0x10000) >> 10) + 0xD800;
      cu2 = ((code - 0x10000) & 1023) + 0xDC00;
      return String.fromCharCode(cu1, cu2);
  }

  function getEscapedIdentifier() {
      var ch, id;

      ch = source.charCodeAt(index++);
      id = String.fromCharCode(ch);

      // '\u' (U+005C, U+0075) denotes an escaped character.
      if (ch === 0x5C) {
          if (source.charCodeAt(index) !== 0x75) {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
          }
          ++index;
          ch = scanHexEscape('u');
          if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
          }
          id = ch;
      }

      while (index < length) {
          ch = source.charCodeAt(index);
          if (!isIdentifierPart(ch)) {
              break;
          }
          ++index;
          id += String.fromCharCode(ch);

          // '\u' (U+005C, U+0075) denotes an escaped character.
          if (ch === 0x5C) {
              id = id.substr(0, id.length - 1);
              if (source.charCodeAt(index) !== 0x75) {
                  throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
              }
              ++index;
              ch = scanHexEscape('u');
              if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
                  throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
              }
              id += ch;
          }
      }

      return id;
  }

  function getIdentifier() {
      var start, ch;

      start = index++;
      while (index < length) {
          ch = source.charCodeAt(index);
          if (ch === 0x5C) {
              // Blackslash (U+005C) marks Unicode escape sequence.
              index = start;
              return getEscapedIdentifier();
          }
          if (isIdentifierPart(ch)) {
              ++index;
          } else {
              break;
          }
      }

      return source.slice(start, index);
  }

  function scanIdentifier() {
      var start, id, type;

      start = index;

      // Backslash (U+005C) starts an escaped character.
      id = (source.charCodeAt(index) === 0x5C) ? getEscapedIdentifier() : getIdentifier();

      // There is no keyword or literal with only one character.
      // Thus, it must be an identifier.
      if (id.length === 1) {
          type = Token.Identifier;
      } else if (isKeyword(id)) {
          type = Token.Keyword;
      } else if (id === 'null') {
          type = Token.NullLiteral;
      } else if (id === 'true' || id === 'false') {
          type = Token.BooleanLiteral;
      } else {
          type = Token.Identifier;
      }

      return {
          type: type,
          value: id,
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }

  // 7.7 Punctuators

  function scanPunctuator() {
      var start = index,
          code = source.charCodeAt(index),
          code2,
          ch1 = source[index],
          ch2,
          ch3,
          ch4;

      switch (code) {

      // Check for most common single-character punctuators.
      case 0x2E:  // . dot
      case 0x28:  // ( open bracket
      case 0x29:  // ) close bracket
      case 0x3B:  // ; semicolon
      case 0x2C:  // , comma
      case 0x7B:  // { open curly brace
      case 0x7D:  // } close curly brace
      case 0x5B:  // [
      case 0x5D:  // ]
      case 0x3A:  // :
      case 0x3F:  // ?
      case 0x7E:  // ~
          ++index;
          if (extra.tokenize) {
              if (code === 0x28) {
                  extra.openParenToken = extra.tokens.length;
              } else if (code === 0x7B) {
                  extra.openCurlyToken = extra.tokens.length;
              }
          }
          return {
              type: Token.Punctuator,
              value: String.fromCharCode(code),
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };

      default:
          code2 = source.charCodeAt(index + 1);

          // '=' (U+003D) marks an assignment or comparison operator.
          if (code2 === 0x3D) {
              switch (code) {
              case 0x2B:  // +
              case 0x2D:  // -
              case 0x2F:  // /
              case 0x3C:  // <
              case 0x3E:  // >
              case 0x5E:  // ^
              case 0x7C:  // |
              case 0x25:  // %
              case 0x26:  // &
              case 0x2A:  // *
                  index += 2;
                  return {
                      type: Token.Punctuator,
                      value: String.fromCharCode(code) + String.fromCharCode(code2),
                      lineNumber: lineNumber,
                      lineStart: lineStart,
                      start: start,
                      end: index
                  };

              case 0x21: // !
              case 0x3D: // =
                  index += 2;

                  // !== and ===
                  if (source.charCodeAt(index) === 0x3D) {
                      ++index;
                  }
                  return {
                      type: Token.Punctuator,
                      value: source.slice(start, index),
                      lineNumber: lineNumber,
                      lineStart: lineStart,
                      start: start,
                      end: index
                  };
              }
          }
      }

      // 4-character punctuator: >>>=

      ch4 = source.substr(index, 4);

      if (ch4 === '>>>=') {
          index += 4;
          return {
              type: Token.Punctuator,
              value: ch4,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }

      // 3-character punctuators: === !== >>> <<= >>=

      ch3 = ch4.substr(0, 3);

      if (ch3 === '>>>' || ch3 === '<<=' || ch3 === '>>=') {
          index += 3;
          return {
              type: Token.Punctuator,
              value: ch3,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }

      // Other 2-character punctuators: ++ -- << >> && ||
      ch2 = ch3.substr(0, 2);

      if ((ch1 === ch2[1] && ('+-<>&|'.indexOf(ch1) >= 0)) || ch2 === '=>') {
          index += 2;
          return {
              type: Token.Punctuator,
              value: ch2,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }

      // 1-character punctuators: < > = ! + - * % & | ^ /

      if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
          ++index;
          return {
              type: Token.Punctuator,
              value: ch1,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }

      throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
  }

  // 7.8.3 Numeric Literals

  function scanHexLiteral(start) {
      var number = '';

      while (index < length) {
          if (!isHexDigit(source[index])) {
              break;
          }
          number += source[index++];
      }

      if (number.length === 0) {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }

      if (isIdentifierStart(source.charCodeAt(index))) {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }

      return {
          type: Token.NumericLiteral,
          value: parseInt('0x' + number, 16),
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }

  function scanOctalLiteral(start) {
      var number = '0' + source[index++];
      while (index < length) {
          if (!isOctalDigit(source[index])) {
              break;
          }
          number += source[index++];
      }

      if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }

      return {
          type: Token.NumericLiteral,
          value: parseInt(number, 8),
          octal: true,
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }

  function scanNumericLiteral() {
      var number, start, ch;

      ch = source[index];
      assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
          'Numeric literal must start with a decimal digit or a decimal point');

      start = index;
      number = '';
      if (ch !== '.') {
          number = source[index++];
          ch = source[index];

          // Hex number starts with '0x'.
          // Octal number starts with '0'.
          if (number === '0') {
              if (ch === 'x' || ch === 'X') {
                  ++index;
                  return scanHexLiteral(start);
              }
              if (isOctalDigit(ch)) {
                  return scanOctalLiteral(start);
              }

              // decimal number starts with '0' such as '09' is illegal.
              if (ch && isDecimalDigit(ch.charCodeAt(0))) {
                  throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
              }
          }

          while (isDecimalDigit(source.charCodeAt(index))) {
              number += source[index++];
          }
          ch = source[index];
      }

      if (ch === '.') {
          number += source[index++];
          while (isDecimalDigit(source.charCodeAt(index))) {
              number += source[index++];
          }
          ch = source[index];
      }

      if (ch === 'e' || ch === 'E') {
          number += source[index++];

          ch = source[index];
          if (ch === '+' || ch === '-') {
              number += source[index++];
          }
          if (isDecimalDigit(source.charCodeAt(index))) {
              while (isDecimalDigit(source.charCodeAt(index))) {
                  number += source[index++];
              }
          } else {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
          }
      }

      if (isIdentifierStart(source.charCodeAt(index))) {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }

      return {
          type: Token.NumericLiteral,
          value: parseFloat(number),
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }

  // 7.8.4 String Literals

  function scanStringLiteral() {
      var str = '', quote, start, ch, code, unescaped, restore, octal = false, startLineNumber, startLineStart;
      startLineNumber = lineNumber;
      startLineStart = lineStart;

      quote = source[index];
      assert((quote === '\'' || quote === '"'),
          'String literal must starts with a quote');

      start = index;
      ++index;

      while (index < length) {
          ch = source[index++];

          if (ch === quote) {
              quote = '';
              break;
          } else if (ch === '\\') {
              ch = source[index++];
              if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                  switch (ch) {
                  case 'u':
                  case 'x':
                      if (source[index] === '{') {
                          ++index;
                          str += scanUnicodeCodePointEscape();
                      } else {
                          restore = index;
                          unescaped = scanHexEscape(ch);
                          if (unescaped) {
                              str += unescaped;
                          } else {
                              index = restore;
                              str += ch;
                          }
                      }
                      break;
                  case 'n':
                      str += '\n';
                      break;
                  case 'r':
                      str += '\r';
                      break;
                  case 't':
                      str += '\t';
                      break;
                  case 'b':
                      str += '\b';
                      break;
                  case 'f':
                      str += '\f';
                      break;
                  case 'v':
                      str += '\x0B';
                      break;

                  default:
                      if (isOctalDigit(ch)) {
                          code = '01234567'.indexOf(ch);

                          // \0 is not octal escape sequence
                          if (code !== 0) {
                              octal = true;
                          }

                          if (index < length && isOctalDigit(source[index])) {
                              octal = true;
                              code = code * 8 + '01234567'.indexOf(source[index++]);

                              // 3 digits are only allowed when string starts
                              // with 0, 1, 2, 3
                              if ('0123'.indexOf(ch) >= 0 &&
                                      index < length &&
                                      isOctalDigit(source[index])) {
                                  code = code * 8 + '01234567'.indexOf(source[index++]);
                              }
                          }
                          str += String.fromCharCode(code);
                      } else {
                          str += ch;
                      }
                      break;
                  }
              } else {
                  ++lineNumber;
                  if (ch ===  '\r' && source[index] === '\n') {
                      ++index;
                  }
                  lineStart = index;
              }
          } else if (isLineTerminator(ch.charCodeAt(0))) {
              break;
          } else {
              str += ch;
          }
      }

      if (quote !== '') {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }

      return {
          type: Token.StringLiteral,
          value: str,
          octal: octal,
          startLineNumber: startLineNumber,
          startLineStart: startLineStart,
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }

  function testRegExp(pattern, flags) {
      var tmp = pattern,
          value;

      if (flags.indexOf('u') >= 0) {
          // Replace each astral symbol and every Unicode code point
          // escape sequence with a single ASCII symbol to avoid throwing on
          // regular expressions that are only valid in combination with the
          // `/u` flag.
          // Note: replacing with the ASCII symbol `x` might cause false
          // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
          // perfectly valid pattern that is equivalent to `[a-b]`, but it
          // would be replaced by `[x-b]` which throws an error.
          tmp = tmp
              .replace(/\\u\{([0-9a-fA-F]+)\}/g, function ($0, $1) {
                  if (parseInt($1, 16) <= 0x10FFFF) {
                      return 'x';
                  }
                  throwError({}, Messages.InvalidRegExp);
              })
              .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, 'x');
      }

      // First, detect invalid regular expressions.
      try {
          value = new RegExp(tmp);
      } catch (e) {
          throwError({}, Messages.InvalidRegExp);
      }

      // Return a regular expression object for this pattern-flag pair, or
      // `null` in case the current environment doesn't support the flags it
      // uses.
      try {
          return new RegExp(pattern, flags);
      } catch (exception) {
          return null;
      }
  }

  function scanRegExpBody() {
      var ch, str, classMarker, terminated, body;

      ch = source[index];
      assert(ch === '/', 'Regular expression literal must start with a slash');
      str = source[index++];

      classMarker = false;
      terminated = false;
      while (index < length) {
          ch = source[index++];
          str += ch;
          if (ch === '\\') {
              ch = source[index++];
              // ECMA-262 7.8.5
              if (isLineTerminator(ch.charCodeAt(0))) {
                  throwError({}, Messages.UnterminatedRegExp);
              }
              str += ch;
          } else if (isLineTerminator(ch.charCodeAt(0))) {
              throwError({}, Messages.UnterminatedRegExp);
          } else if (classMarker) {
              if (ch === ']') {
                  classMarker = false;
              }
          } else {
              if (ch === '/') {
                  terminated = true;
                  break;
              } else if (ch === '[') {
                  classMarker = true;
              }
          }
      }

      if (!terminated) {
          throwError({}, Messages.UnterminatedRegExp);
      }

      // Exclude leading and trailing slash.
      body = str.substr(1, str.length - 2);
      return {
          value: body,
          literal: str
      };
  }

  function scanRegExpFlags() {
      var ch, str, flags, restore;

      str = '';
      flags = '';
      while (index < length) {
          ch = source[index];
          if (!isIdentifierPart(ch.charCodeAt(0))) {
              break;
          }

          ++index;
          if (ch === '\\' && index < length) {
              ch = source[index];
              if (ch === 'u') {
                  ++index;
                  restore = index;
                  ch = scanHexEscape('u');
                  if (ch) {
                      flags += ch;
                      for (str += '\\u'; restore < index; ++restore) {
                          str += source[restore];
                      }
                  } else {
                      index = restore;
                      flags += 'u';
                      str += '\\u';
                  }
                  throwErrorTolerant({}, Messages.UnexpectedToken, 'ILLEGAL');
              } else {
                  str += '\\';
                  throwErrorTolerant({}, Messages.UnexpectedToken, 'ILLEGAL');
              }
          } else {
              flags += ch;
              str += ch;
          }
      }

      return {
          value: flags,
          literal: str
      };
  }

  function scanRegExp() {
      var start, body, flags, value;

      lookahead = null;
      skipComment();
      start = index;

      body = scanRegExpBody();
      flags = scanRegExpFlags();
      value = testRegExp(body.value, flags.value);

      if (extra.tokenize) {
          return {
              type: Token.RegularExpression,
              value: value,
              regex: {
                  pattern: body.value,
                  flags: flags.value
              },
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }

      return {
          literal: body.literal + flags.literal,
          value: value,
          regex: {
              pattern: body.value,
              flags: flags.value
          },
          start: start,
          end: index
      };
  }

  function collectRegex() {
      var pos, loc, regex, token;

      skipComment();

      pos = index;
      loc = {
          start: {
              line: lineNumber,
              column: index - lineStart
          }
      };

      regex = scanRegExp();

      loc.end = {
          line: lineNumber,
          column: index - lineStart
      };

      if (!extra.tokenize) {
          // Pop the previous token, which is likely '/' or '/='
          if (extra.tokens.length > 0) {
              token = extra.tokens[extra.tokens.length - 1];
              if (token.range[0] === pos && token.type === 'Punctuator') {
                  if (token.value === '/' || token.value === '/=') {
                      extra.tokens.pop();
                  }
              }
          }

          extra.tokens.push({
              type: 'RegularExpression',
              value: regex.literal,
              regex: regex.regex,
              range: [pos, index],
              loc: loc
          });
      }

      return regex;
  }

  function isIdentifierName(token) {
      return token.type === Token.Identifier ||
          token.type === Token.Keyword ||
          token.type === Token.BooleanLiteral ||
          token.type === Token.NullLiteral;
  }

  function advanceSlash() {
      var prevToken,
          checkToken;
      // Using the following algorithm:
      // https://github.com/mozilla/sweet.js/wiki/design
      prevToken = extra.tokens[extra.tokens.length - 1];
      if (!prevToken) {
          // Nothing before that: it cannot be a division.
          return collectRegex();
      }
      if (prevToken.type === 'Punctuator') {
          if (prevToken.value === ']') {
              return scanPunctuator();
          }
          if (prevToken.value === ')') {
              checkToken = extra.tokens[extra.openParenToken - 1];
              if (checkToken &&
                      checkToken.type === 'Keyword' &&
                      (checkToken.value === 'if' ||
                       checkToken.value === 'while' ||
                       checkToken.value === 'for' ||
                       checkToken.value === 'with')) {
                  return collectRegex();
              }
              return scanPunctuator();
          }
          if (prevToken.value === '}') {
              // Dividing a function by anything makes little sense,
              // but we have to check for that.
              if (extra.tokens[extra.openCurlyToken - 3] &&
                      extra.tokens[extra.openCurlyToken - 3].type === 'Keyword') {
                  // Anonymous function.
                  checkToken = extra.tokens[extra.openCurlyToken - 4];
                  if (!checkToken) {
                      return scanPunctuator();
                  }
              } else if (extra.tokens[extra.openCurlyToken - 4] &&
                      extra.tokens[extra.openCurlyToken - 4].type === 'Keyword') {
                  // Named function.
                  checkToken = extra.tokens[extra.openCurlyToken - 5];
                  if (!checkToken) {
                      return collectRegex();
                  }
              } else {
                  return scanPunctuator();
              }
              return scanPunctuator();
          }
          return collectRegex();
      }
      if (prevToken.type === 'Keyword' && prevToken.value !== 'this') {
          return collectRegex();
      }
      return scanPunctuator();
  }

  function advance() {
      var ch;

      skipComment();

      if (index >= length) {
          return {
              type: Token.EOF,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: index,
              end: index
          };
      }

      ch = source.charCodeAt(index);

      if (isIdentifierStart(ch)) {
          return scanIdentifier();
      }

      // Very common: ( and ) and ;
      if (ch === 0x28 || ch === 0x29 || ch === 0x3B) {
          return scanPunctuator();
      }

      // String literal starts with single quote (U+0027) or double quote (U+0022).
      if (ch === 0x27 || ch === 0x22) {
          return scanStringLiteral();
      }


      // Dot (.) U+002E can also start a floating-point number, hence the need
      // to check the next character.
      if (ch === 0x2E) {
          if (isDecimalDigit(source.charCodeAt(index + 1))) {
              return scanNumericLiteral();
          }
          return scanPunctuator();
      }

      if (isDecimalDigit(ch)) {
          return scanNumericLiteral();
      }

      // Slash (/) U+002F can also start a regex.
      if (extra.tokenize && ch === 0x2F) {
          return advanceSlash();
      }

      return scanPunctuator();
  }

  function collectToken() {
      var loc, token, value, entry;

      skipComment();
      loc = {
          start: {
              line: lineNumber,
              column: index - lineStart
          }
      };

      token = advance();
      loc.end = {
          line: lineNumber,
          column: index - lineStart
      };

      if (token.type !== Token.EOF) {
          value = source.slice(token.start, token.end);
          entry = {
              type: TokenName[token.type],
              value: value,
              range: [token.start, token.end],
              loc: loc
          };
          if (token.regex) {
              entry.regex = {
                  pattern: token.regex.pattern,
                  flags: token.regex.flags
              };
          }
          extra.tokens.push(entry);
      }

      return token;
  }

  function lex() {
      var token;

      token = lookahead;
      index = token.end;
      lineNumber = token.lineNumber;
      lineStart = token.lineStart;

      lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();

      index = token.end;
      lineNumber = token.lineNumber;
      lineStart = token.lineStart;

      return token;
  }

  function peek() {
      var pos, line, start;

      pos = index;
      line = lineNumber;
      start = lineStart;
      lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
      index = pos;
      lineNumber = line;
      lineStart = start;
  }

  function Position() {
      this.line = lineNumber;
      this.column = index - lineStart;
  }

  function SourceLocation() {
      this.start = new Position();
      this.end = null;
  }

  function WrappingSourceLocation(startToken) {
      if (startToken.type === Token.StringLiteral) {
          this.start = {
              line: startToken.startLineNumber,
              column: startToken.start - startToken.startLineStart
          };
      } else {
          this.start = {
              line: startToken.lineNumber,
              column: startToken.start - startToken.lineStart
          };
      }
      this.end = null;
  }

  function Node() {
      // Skip comment.
      index = lookahead.start;
      if (lookahead.type === Token.StringLiteral) {
          lineNumber = lookahead.startLineNumber;
          lineStart = lookahead.startLineStart;
      } else {
          lineNumber = lookahead.lineNumber;
          lineStart = lookahead.lineStart;
      }
      if (extra.range) {
          this.range = [index, 0];
      }
      if (extra.loc) {
          this.loc = new SourceLocation();
      }
  }

  function WrappingNode(startToken) {
      if (extra.range) {
          this.range = [startToken.start, 0];
      }
      if (extra.loc) {
          this.loc = new WrappingSourceLocation(startToken);
      }
  }

  WrappingNode.prototype = Node.prototype = {

      finish: function () {
          if (extra.range) {
              this.range[1] = index;
          }
          if (extra.loc) {
              this.loc.end = new Position();
              if (extra.source) {
                  this.loc.source = extra.source;
              }
          }
      },

      finishArrayExpression: function (elements) {
          this.type = Syntax.ArrayExpression;
          this.elements = elements;
          this.finish();
          return this;
      },

      finishAssignmentExpression: function (operator, left, right) {
          this.type = Syntax.AssignmentExpression;
          this.operator = operator;
          this.left = left;
          this.right = right;
          this.finish();
          return this;
      },

      finishBinaryExpression: function (operator, left, right) {
          this.type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression : Syntax.BinaryExpression;
          this.operator = operator;
          this.left = left;
          this.right = right;
          this.finish();
          return this;
      },

      finishCallExpression: function (callee, args) {
          this.type = Syntax.CallExpression;
          this.callee = callee;
          this.arguments = args;
          this.finish();
          return this;
      },

      finishConditionalExpression: function (test, consequent, alternate) {
          this.type = Syntax.ConditionalExpression;
          this.test = test;
          this.consequent = consequent;
          this.alternate = alternate;
          this.finish();
          return this;
      },

      finishExpressionStatement: function (expression) {
          this.type = Syntax.ExpressionStatement;
          this.expression = expression;
          this.finish();
          return this;
      },

      finishIdentifier: function (name) {
          this.type = Syntax.Identifier;
          this.name = name;
          this.finish();
          return this;
      },

      finishLiteral: function (token) {
          this.type = Syntax.Literal;
          this.value = token.value;
          this.raw = source.slice(token.start, token.end);
          if (token.regex) {
              if (this.raw == '//') {
                this.raw = '/(?:)/';
              }
              this.regex = token.regex;
          }
          this.finish();
          return this;
      },

      finishMemberExpression: function (accessor, object, property) {
          this.type = Syntax.MemberExpression;
          this.computed = accessor === '[';
          this.object = object;
          this.property = property;
          this.finish();
          return this;
      },

      finishObjectExpression: function (properties) {
          this.type = Syntax.ObjectExpression;
          this.properties = properties;
          this.finish();
          return this;
      },

      finishProgram: function (body) {
          this.type = Syntax.Program;
          this.body = body;
          this.finish();
          return this;
      },

      finishProperty: function (kind, key, value) {
          this.type = Syntax.Property;
          this.key = key;
          this.value = value;
          this.kind = kind;
          this.finish();
          return this;
      },

      finishUnaryExpression: function (operator, argument) {
          this.type = (operator === '++' || operator === '--') ? Syntax.UpdateExpression : Syntax.UnaryExpression;
          this.operator = operator;
          this.argument = argument;
          this.prefix = true;
          this.finish();
          return this;
      }
  };

  // Return true if there is a line terminator before the next token.

  function peekLineTerminator() {
      var pos, line, start, found;

      pos = index;
      line = lineNumber;
      start = lineStart;
      skipComment();
      found = lineNumber !== line;
      index = pos;
      lineNumber = line;
      lineStart = start;

      return found;
  }

  // Throw an exception

  function throwError(token, messageFormat) {
      var error,
          args = Array.prototype.slice.call(arguments, 2),
          msg = messageFormat.replace(
              /%(\d)/g,
              function (whole, index) {
                  assert(index < args.length, 'Message reference must be in range');
                  return args[index];
              }
          );

      if (typeof token.lineNumber === 'number') {
          error = new Error('Line ' + token.lineNumber + ': ' + msg);
          error.index = token.start;
          error.lineNumber = token.lineNumber;
          error.column = token.start - lineStart + 1;
      } else {
          error = new Error('Line ' + lineNumber + ': ' + msg);
          error.index = index;
          error.lineNumber = lineNumber;
          error.column = index - lineStart + 1;
      }

      error.description = msg;
      throw error;
  }

  function throwErrorTolerant() {
      try {
          throwError.apply(null, arguments);
      } catch (e) {
          if (extra.errors) {
              extra.errors.push(e);
          } else {
              throw e;
          }
      }
  }


  // Throw an exception because of the token.

  function throwUnexpected(token) {
      if (token.type === Token.EOF) {
          throwError(token, Messages.UnexpectedEOS);
      }

      if (token.type === Token.NumericLiteral) {
          throwError(token, Messages.UnexpectedNumber);
      }

      if (token.type === Token.StringLiteral) {
          throwError(token, Messages.UnexpectedString);
      }

      if (token.type === Token.Identifier) {
          throwError(token, Messages.UnexpectedIdentifier);
      }

      if (token.type === Token.Keyword) {
          if (isFutureReservedWord(token.value)) {
              throwError(token, Messages.UnexpectedReserved);
          } else if (strict && isStrictModeReservedWord(token.value)) {
              throwErrorTolerant(token, Messages.StrictReservedWord);
              return;
          }
          throwError(token, Messages.UnexpectedToken, token.value);
      }

      // BooleanLiteral, NullLiteral, or Punctuator.
      throwError(token, Messages.UnexpectedToken, token.value);
  }

  // Expect the next token to match the specified punctuator.
  // If not, an exception will be thrown.

  function expect(value) {
      var token = lex();
      if (token.type !== Token.Punctuator || token.value !== value) {
          throwUnexpected(token);
      }
  }

  /**
   * @name expectTolerant
   * @description Quietly expect the given token value when in tolerant mode, otherwise delegates
   * to <code>expect(value)</code>
   * @param {String} value The value we are expecting the lookahead token to have
   * @since 2.0
   */
  function expectTolerant(value) {
      if (extra.errors) {
          var token = lookahead;
          if (token.type !== Token.Punctuator && token.value !== value) {
              throwErrorTolerant(token, Messages.UnexpectedToken, token.value);
          } else {
              lex();
          }
      } else {
          expect(value);
      }
  }

  // Expect the next token to match the specified keyword.
  // If not, an exception will be thrown.

  function expectKeyword(keyword) {
      var token = lex();
      if (token.type !== Token.Keyword || token.value !== keyword) {
          throwUnexpected(token);
      }
  }

  // Return true if the next token matches the specified punctuator.

  function match(value) {
      return lookahead.type === Token.Punctuator && lookahead.value === value;
  }

  // Return true if the next token matches the specified keyword

  function matchKeyword(keyword) {
      return lookahead.type === Token.Keyword && lookahead.value === keyword;
  }

  function consumeSemicolon() {
      var line;

      // Catch the very common case first: immediately a semicolon (U+003B).
      if (source.charCodeAt(index) === 0x3B || match(';')) {
          lex();
          return;
      }

      line = lineNumber;
      skipComment();
      if (lineNumber !== line) {
          return;
      }

      if (lookahead.type !== Token.EOF && !match('}')) {
          throwUnexpected(lookahead);
      }
  }

  // Return true if provided expression is LeftHandSideExpression

  function isLeftHandSide(expr) {
      return expr.type === Syntax.Identifier || expr.type === Syntax.MemberExpression;
  }

  // 11.1.4 Array Initialiser

  function parseArrayInitialiser() {
      var elements = [], node = new Node();

      expect('[');

      while (!match(']')) {
          if (match(',')) {
              lex();
              elements.push(null);
          } else {
              elements.push(parseAssignmentExpression());

              if (!match(']')) {
                  expect(',');
              }
          }
      }

      lex();

      return node.finishArrayExpression(elements);
  }

  // 11.1.5 Object Initialiser

  function parseObjectPropertyKey() {
      var token, node = new Node();

      token = lex();

      // Note: This function is called only from parseObjectProperty(), where
      // EOF and Punctuator tokens are already filtered out.

      if (token.type === Token.StringLiteral || token.type === Token.NumericLiteral) {
          if (strict && token.octal) {
              throwErrorTolerant(token, Messages.StrictOctalLiteral);
          }
          return node.finishLiteral(token);
      }

      return node.finishIdentifier(token.value);
  }

  function parseObjectProperty() {
      var token, key, id, value, param, node = new Node();

      token = lookahead;

      if (token.type === Token.Identifier) {
          id = parseObjectPropertyKey();
          expect(':');
          value = parseAssignmentExpression();
          return node.finishProperty('init', id, value);
      }
      if (token.type === Token.EOF || token.type === Token.Punctuator) {
          throwUnexpected(token);
      } else {
          key = parseObjectPropertyKey();
          expect(':');
          value = parseAssignmentExpression();
          return node.finishProperty('init', key, value);
      }
  }

  function parseObjectInitialiser() {
      var properties = [], token, property, name, key, kind, map = {}, toString = String, node = new Node();

      expect('{');

      while (!match('}')) {
          property = parseObjectProperty();

          if (property.key.type === Syntax.Identifier) {
              name = property.key.name;
          } else {
              name = toString(property.key.value);
          }
          kind = (property.kind === 'init') ? PropertyKind.Data : (property.kind === 'get') ? PropertyKind.Get : PropertyKind.Set;

          key = '$' + name;
          if (Object.prototype.hasOwnProperty.call(map, key)) {
              if (map[key] === PropertyKind.Data) {
                  if (strict && kind === PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.StrictDuplicateProperty);
                  } else if (kind !== PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.AccessorDataProperty);
                  }
              } else {
                  if (kind === PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.AccessorDataProperty);
                  } else if (map[key] & kind) {
                      throwErrorTolerant({}, Messages.AccessorGetSet);
                  }
              }
              map[key] |= kind;
          } else {
              map[key] = kind;
          }

          properties.push(property);

          if (!match('}')) {
              expectTolerant(',');
          }
      }

      expect('}');

      return node.finishObjectExpression(properties);
  }

  // 11.1.6 The Grouping Operator

  function parseGroupExpression() {
      var expr;

      expect('(');

      ++state.parenthesisCount;

      expr = parseExpression();

      expect(')');

      return expr;
  }


  // 11.1 Primary Expressions

  var legalKeywords = {"if":1, "this":1};

  function parsePrimaryExpression() {
      var type, token, expr, node;

      if (match('(')) {
          return parseGroupExpression();
      }

      if (match('[')) {
          return parseArrayInitialiser();
      }

      if (match('{')) {
          return parseObjectInitialiser();
      }

      type = lookahead.type;
      node = new Node();

      if (type === Token.Identifier || legalKeywords[lookahead.value]) {
          expr = node.finishIdentifier(lex().value);
      } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
          if (strict && lookahead.octal) {
              throwErrorTolerant(lookahead, Messages.StrictOctalLiteral);
          }
          expr = node.finishLiteral(lex());
      } else if (type === Token.Keyword) {
          throw new Error("Disabled.");
      } else if (type === Token.BooleanLiteral) {
          token = lex();
          token.value = (token.value === 'true');
          expr = node.finishLiteral(token);
      } else if (type === Token.NullLiteral) {
          token = lex();
          token.value = null;
          expr = node.finishLiteral(token);
      } else if (match('/') || match('/=')) {
          if (typeof extra.tokens !== 'undefined') {
              expr = node.finishLiteral(collectRegex());
          } else {
              expr = node.finishLiteral(scanRegExp());
          }
          peek();
      } else {
          throwUnexpected(lex());
      }

      return expr;
  }

  // 11.2 Left-Hand-Side Expressions

  function parseArguments() {
      var args = [];

      expect('(');

      if (!match(')')) {
          while (index < length) {
              args.push(parseAssignmentExpression());
              if (match(')')) {
                  break;
              }
              expectTolerant(',');
          }
      }

      expect(')');

      return args;
  }

  function parseNonComputedProperty() {
      var token, node = new Node();

      token = lex();

      if (!isIdentifierName(token)) {
          throwUnexpected(token);
      }

      return node.finishIdentifier(token.value);
  }

  function parseNonComputedMember() {
      expect('.');

      return parseNonComputedProperty();
  }

  function parseComputedMember() {
      var expr;

      expect('[');

      expr = parseExpression();

      expect(']');

      return expr;
  }

  function parseLeftHandSideExpressionAllowCall() {
      var expr, args, property, startToken, previousAllowIn = state.allowIn;

      startToken = lookahead;
      state.allowIn = true;
      expr = parsePrimaryExpression();

      for (;;) {
          if (match('.')) {
              property = parseNonComputedMember();
              expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
          } else if (match('(')) {
              args = parseArguments();
              expr = new WrappingNode(startToken).finishCallExpression(expr, args);
          } else if (match('[')) {
              property = parseComputedMember();
              expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
          } else {
              break;
          }
      }
      state.allowIn = previousAllowIn;

      return expr;
  }

  function parseLeftHandSideExpression() {
      var expr, property, startToken;
      assert(state.allowIn, 'callee of new expression always allow in keyword.');

      startToken = lookahead;
      expr = parsePrimaryExpression();

      for (;;) {
          if (match('[')) {
              property = parseComputedMember();
              expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
          } else if (match('.')) {
              property = parseNonComputedMember();
              expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
          } else {
              break;
          }
      }
      return expr;
  }

  // 11.3 Postfix Expressions

  function parsePostfixExpression() {
      var expr, token, startToken = lookahead;

      expr = parseLeftHandSideExpressionAllowCall();

      if (lookahead.type === Token.Punctuator) {
          if ((match('++') || match('--')) && !peekLineTerminator()) {
              throw new Error("Disabled.");
          }
      }

      return expr;
  }

  // 11.4 Unary Operators

  function parseUnaryExpression() {
      var token, expr, startToken;

      if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
          expr = parsePostfixExpression();
      } else if (match('++') || match('--')) {
          throw new Error("Disabled.");
      } else if (match('+') || match('-') || match('~') || match('!')) {
          startToken = lookahead;
          token = lex();
          expr = parseUnaryExpression();
          expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
      } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
          throw new Error("Disabled.");
      } else {
          expr = parsePostfixExpression();
      }

      return expr;
  }

  function binaryPrecedence(token, allowIn) {
      var prec = 0;

      if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
          return 0;
      }

      switch (token.value) {
      case '||':
          prec = 1;
          break;

      case '&&':
          prec = 2;
          break;

      case '|':
          prec = 3;
          break;

      case '^':
          prec = 4;
          break;

      case '&':
          prec = 5;
          break;

      case '==':
      case '!=':
      case '===':
      case '!==':
          prec = 6;
          break;

      case '<':
      case '>':
      case '<=':
      case '>=':
      case 'instanceof':
          prec = 7;
          break;

      case 'in':
          prec = allowIn ? 7 : 0;
          break;

      case '<<':
      case '>>':
      case '>>>':
          prec = 8;
          break;

      case '+':
      case '-':
          prec = 9;
          break;

      case '*':
      case '/':
      case '%':
          prec = 11;
          break;

      default:
          break;
      }

      return prec;
  }

  // 11.5 Multiplicative Operators
  // 11.6 Additive Operators
  // 11.7 Bitwise Shift Operators
  // 11.8 Relational Operators
  // 11.9 Equality Operators
  // 11.10 Binary Bitwise Operators
  // 11.11 Binary Logical Operators

  function parseBinaryExpression() {
      var marker, markers, expr, token, prec, stack, right, operator, left, i;

      marker = lookahead;
      left = parseUnaryExpression();

      token = lookahead;
      prec = binaryPrecedence(token, state.allowIn);
      if (prec === 0) {
          return left;
      }
      token.prec = prec;
      lex();

      markers = [marker, lookahead];
      right = parseUnaryExpression();

      stack = [left, token, right];

      while ((prec = binaryPrecedence(lookahead, state.allowIn)) > 0) {

          // Reduce: make a binary expression from the three topmost entries.
          while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
              right = stack.pop();
              operator = stack.pop().value;
              left = stack.pop();
              markers.pop();
              expr = new WrappingNode(markers[markers.length - 1]).finishBinaryExpression(operator, left, right);
              stack.push(expr);
          }

          // Shift.
          token = lex();
          token.prec = prec;
          stack.push(token);
          markers.push(lookahead);
          expr = parseUnaryExpression();
          stack.push(expr);
      }

      // Final reduce to clean-up the stack.
      i = stack.length - 1;
      expr = stack[i];
      markers.pop();
      while (i > 1) {
          expr = new WrappingNode(markers.pop()).finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
          i -= 2;
      }

      return expr;
  }

  // 11.12 Conditional Operator

  function parseConditionalExpression() {
      var expr, previousAllowIn, consequent, alternate, startToken;

      startToken = lookahead;

      expr = parseBinaryExpression();

      if (match('?')) {
          lex();
          previousAllowIn = state.allowIn;
          state.allowIn = true;
          consequent = parseAssignmentExpression();
          state.allowIn = previousAllowIn;
          expect(':');
          alternate = parseAssignmentExpression();

          expr = new WrappingNode(startToken).finishConditionalExpression(expr, consequent, alternate);
      }

      return expr;
  }

  // 11.13 Assignment Operators

  function parseAssignmentExpression() {
      var oldParenthesisCount, token, expr, right, list, startToken;

      oldParenthesisCount = state.parenthesisCount;

      startToken = lookahead;
      token = lookahead;

      expr = parseConditionalExpression();

      return expr;
  }

  // 11.14 Comma Operator

  function parseExpression() {
      var expr, startToken = lookahead, expressions;

      expr = parseAssignmentExpression();

      if (match(',')) {
          throw new Error("Disabled."); // no sequence expressions
      }

      return expr;
  }

  // 12.4 Expression Statement

  function parseExpressionStatement(node) {
      var expr = parseExpression();
      consumeSemicolon();
      return node.finishExpressionStatement(expr);
  }

  // 12 Statements

  function parseStatement() {
      var type = lookahead.type,
          expr,
          labeledBody,
          key,
          node;

      if (type === Token.EOF) {
          throwUnexpected(lookahead);
      }

      if (type === Token.Punctuator && lookahead.value === '{') {
          throw new Error("Disabled."); // block statement
      }

      node = new Node();

      if (type === Token.Punctuator) {
          switch (lookahead.value) {
          case ';':
              throw new Error("Disabled."); // empty statement
          case '(':
              return parseExpressionStatement(node);
          default:
              break;
          }
      } else if (type === Token.Keyword) {
          throw new Error("Disabled."); // keyword
      }

      expr = parseExpression();
      consumeSemicolon();
      return node.finishExpressionStatement(expr);
  }

  // 14 Program

  function parseSourceElement() {
      if (lookahead.type === Token.Keyword) {
          switch (lookahead.value) {
          case 'const':
          case 'let':
              throw new Error("Disabled.");
          case 'function':
              throw new Error("Disabled.");
          default:
              return parseStatement();
          }
      }

      if (lookahead.type !== Token.EOF) {
          return parseStatement();
      }
  }

  function parseSourceElements() {
      var sourceElement, sourceElements = [], token, directive, firstRestricted;

      while (index < length) {
          token = lookahead;
          if (token.type !== Token.StringLiteral) {
              break;
          }

          sourceElement = parseSourceElement();
          sourceElements.push(sourceElement);
          if (sourceElement.expression.type !== Syntax.Literal) {
              // this is not directive
              break;
          }
          directive = source.slice(token.start + 1, token.end - 1);
          if (directive === 'use strict') {
              strict = true;
              if (firstRestricted) {
                  throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
              }
          } else {
              if (!firstRestricted && token.octal) {
                  firstRestricted = token;
              }
          }
      }

      while (index < length) {
          sourceElement = parseSourceElement();
          if (typeof sourceElement === 'undefined') {
              break;
          }
          sourceElements.push(sourceElement);
      }
      return sourceElements;
  }

  function parseProgram() {
      var body, node;

      skipComment();
      peek();
      node = new Node();
      strict = true; // assume strict

      body = parseSourceElements();
      return node.finishProgram(body);
  }

  function filterTokenLocation() {
      var i, entry, token, tokens = [];

      for (i = 0; i < extra.tokens.length; ++i) {
          entry = extra.tokens[i];
          token = {
              type: entry.type,
              value: entry.value
          };
          if (entry.regex) {
              token.regex = {
                  pattern: entry.regex.pattern,
                  flags: entry.regex.flags
              };
          }
          if (extra.range) {
              token.range = entry.range;
          }
          if (extra.loc) {
              token.loc = entry.loc;
          }
          tokens.push(token);
      }

      extra.tokens = tokens;
  }

  function tokenize(code, options) {
      var toString,
          tokens;

      toString = String;
      if (typeof code !== 'string' && !(code instanceof String)) {
          code = toString(code);
      }

      source = code;
      index = 0;
      lineNumber = (source.length > 0) ? 1 : 0;
      lineStart = 0;
      length = source.length;
      lookahead = null;
      state = {
          allowIn: true,
          labelSet: {},
          inFunctionBody: false,
          inIteration: false,
          inSwitch: false,
          lastCommentStart: -1
      };

      extra = {};

      // Options matching.
      options = options || {};

      // Of course we collect tokens here.
      options.tokens = true;
      extra.tokens = [];
      extra.tokenize = true;
      // The following two fields are necessary to compute the Regex tokens.
      extra.openParenToken = -1;
      extra.openCurlyToken = -1;

      extra.range = (typeof options.range === 'boolean') && options.range;
      extra.loc = (typeof options.loc === 'boolean') && options.loc;

      if (typeof options.tolerant === 'boolean' && options.tolerant) {
          extra.errors = [];
      }

      try {
          peek();
          if (lookahead.type === Token.EOF) {
              return extra.tokens;
          }

          lex();
          while (lookahead.type !== Token.EOF) {
              try {
                  lex();
              } catch (lexError) {
                  if (extra.errors) {
                      extra.errors.push(lexError);
                      // We have to break on the first error
                      // to avoid infinite loops.
                      break;
                  } else {
                      throw lexError;
                  }
              }
          }

          filterTokenLocation();
          tokens = extra.tokens;
          if (typeof extra.errors !== 'undefined') {
              tokens.errors = extra.errors;
          }
      } catch (e) {
          throw e;
      } finally {
          extra = {};
      }
      return tokens;
  }

  function parse(code, options) {
      var program, toString;

      toString = String;
      if (typeof code !== 'string' && !(code instanceof String)) {
          code = toString(code);
      }

      source = code;
      index = 0;
      lineNumber = (source.length > 0) ? 1 : 0;
      lineStart = 0;
      length = source.length;
      lookahead = null;
      state = {
          allowIn: true,
          labelSet: {},
          parenthesisCount: 0,
          inFunctionBody: false,
          inIteration: false,
          inSwitch: false,
          lastCommentStart: -1
      };

      extra = {};
      if (typeof options !== 'undefined') {
          extra.range = (typeof options.range === 'boolean') && options.range;
          extra.loc = (typeof options.loc === 'boolean') && options.loc;

          if (extra.loc && options.source !== null && options.source !== undefined) {
              extra.source = toString(options.source);
          }

          if (typeof options.tokens === 'boolean' && options.tokens) {
              extra.tokens = [];
          }
          if (typeof options.tolerant === 'boolean' && options.tolerant) {
              extra.errors = [];
          }
      }

      try {
          program = parseProgram();
          if (typeof extra.tokens !== 'undefined') {
              filterTokenLocation();
              program.tokens = extra.tokens;
          }
          if (typeof extra.errors !== 'undefined') {
              program.errors = extra.errors;
          }
      } catch (e) {
          throw e;
      } finally {
          extra = {};
      }

      return program;
  }

  return {
    tokenize: tokenize,
    parse: parse
  };

})();
vg.parse = {};vg.parse.axes = (function() {
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
      axes[index] = axes[index] || vg.scene.axis();
      axis(def, index, axes[index], scales);
    });
  }

  function axis(def, index, axis, scales) {
    // axis scale
    if (def.scale !== undefined) {
      axis.scale(scales[def.scale]);
    }

    // axis orientation
    axis.orient(def.orient || ORIENT[def.type]);
    // axis offset
    axis.offset(def.offset || 0);
    // axis layer
    axis.layer(def.layer || "front");
    // axis grid lines
    axis.grid(def.grid || false);
    // axis title
    axis.title(def.title || null);
    // axis title offset
    axis.titleOffset(def.titleOffset != null
      ? def.titleOffset : vg.config.axis.titleOffset);
    // axis values
    axis.tickValues(def.values || null);
    // axis label formatting
    axis.tickFormat(def.format || null);
    // axis tick subdivision
    axis.tickSubdivide(def.subdivide || 0);
    // axis tick padding
    axis.tickPadding(def.tickPadding || vg.config.axis.padding);

    // axis tick size(s)
    var size = [];
    if (def.tickSize !== undefined) {
      for (var i=0; i<3; ++i) size.push(def.tickSize);
    } else {
      var ts = vg.config.axis.tickSize;
      size = [ts, ts, ts];
    }
    if (def.tickSizeMajor != null) size[0] = def.tickSizeMajor;
    if (def.tickSizeMinor != null) size[1] = def.tickSizeMinor;
    if (def.tickSizeEnd   != null) size[2] = def.tickSizeEnd;
    if (size.length) {
      axis.tickSize.apply(axis, size);
    }

    // axis tick count
    axis.tickCount(def.ticks || vg.config.axis.ticks);

    // style properties
    var p = def.properties;
    if (p && p.ticks) {
      axis.majorTickProperties(p.majorTicks
        ? vg.extend({}, p.ticks, p.majorTicks) : p.ticks);
      axis.minorTickProperties(p.minorTicks
        ? vg.extend({}, p.ticks, p.minorTicks) : p.ticks);
    } else {
      axis.majorTickProperties(p && p.majorTicks || {});
      axis.minorTickProperties(p && p.minorTicks || {});
    }
    axis.tickLabelProperties(p && p.labels || {});
    axis.titleProperties(p && p.title || {});
    axis.gridLineProperties(p && p.grid || {});
    axis.domainProperties(p && p.axis || {});
  }

  return axes;
})();
vg.parse.background = function(bg) {
  // return null if input is null or undefined
  if (bg == null) return null;
  // run through d3 rgb to sanity check
  return d3.rgb(bg) + "";
};
vg.parse.data = function(spec, callback) {
  var model = {
    defs: spec,
    load: {},
    flow: {},
    deps: {},
    source: {},
    sorted: null
  };

  var count = 0;
  
  function load(d) {
    return function(error, data) {
      if (error) {
        vg.error("LOADING FAILED: " + d.url);
      } else {
        try {
          model.load[d.name] = vg.data.read(data.toString(), d.format);
        } catch (err) {
          vg.error("UNABLE TO PARSE: " + d.url + ' ' + err.toString());
        }
      }
      if (--count === 0) callback();
    };
  }
  
  // process each data set definition
  (spec || []).forEach(function(d) {
    if (d.url) {
      count += 1;
      vg.data.load(d.url, load(d)); 
    } else if (d.values) {
      model.load[d.name] = vg.data.read(d.values, d.format);
    } else if (d.source) {
      (model.source[d.source] || (model.source[d.source] = [])).push(d.name);
    }
    
    if (d.transform) {
      var flow = vg.parse.dataflow(d);
      model.flow[d.name] = flow;
      flow.dependencies.forEach(function(dep) {
        (model.deps[dep] || (model.deps[dep] = [])).push(d.name);
      });
    }
  });
  
  // topological sort by dependencies
  var names = (spec || []).map(vg.accessor("name")),
      order = [], v = {}, n;
  function visit(n) {
    if (v[n] === 1) return; // not a DAG!
    if (!v[n]) {
      v[n] = 1;
      (model.source[n] || []).forEach(visit);
      (model.deps[n] || []).forEach(visit);
      v[n] = 2;
      order.push(n);
    }
  }
  while (names.length) { if (v[n=names.pop()] !== 2) visit(n); }
  model.sorted = order.reverse();
  
  if (count === 0) setTimeout(callback, 1);
  return model;
};vg.parse.dataflow = function(def) {
  var tx = (def.transform || []).map(vg.parse.transform),
      df = tx.length
        ? function(data, db, group) {
            return tx.reduce(function(d,t) { return t(d,db,group); }, data);
          }
        : vg.identity;
  df.transforms = tx;
  df.dependencies = vg.keys((def.transform || [])
    .reduce(function(map, tdef) {
      var deps = vg.data[tdef.type].dependencies;
      if (deps) deps.forEach(function(d) {
        if (tdef[d]) map[tdef[d]] = 1;
      });
      return map;
    }, {}));
  return df;
};vg.parse.expr = (function() {

  var parse = vg.expression.parse;
  var codegen = vg.expression.code({
    idWhiteList: ['d', 'index', 'data']
  });

  return function(expr) {
    var code = codegen(parse(expr));
    return Function('d', 'index', 'data',
      '"use strict"; return (' + code + ');');
  };

})();
vg.parse.legends = (function() {

  function legends(spec, legends, scales) {
    (spec || []).forEach(function(def, index) {
      legends[index] = legends[index] || vg.scene.legend();
      legend(def, index, legends[index], scales);
    });
  }

  function legend(def, index, legend, scales) {
    // legend scales
    legend.size  (def.size   ? scales[def.size]   : null);
    legend.shape (def.shape  ? scales[def.shape]  : null);
    legend.fill  (def.fill   ? scales[def.fill]   : null);
    legend.stroke(def.stroke ? scales[def.stroke] : null);

    // legend orientation
    if (def.orient) legend.orient(def.orient);

    // legend offset
    if (def.offset != null) legend.offset(def.offset);

    // legend title
    legend.title(def.title || null);

    // legend values
    legend.values(def.values || null);

    // legend label formatting
    legend.format(def.format !== undefined ? def.format : null);

    // style properties
    var p = def.properties;
    legend.titleProperties(p && p.title || {});
    legend.labelProperties(p && p.labels || {});
    legend.legendProperties(p && p.legend || {});
    legend.symbolProperties(p && p.symbols || {});
    legend.gradientProperties(p && p.gradient || {});
  }
  
  return legends;
})();
vg.parse.mark = function(mark) {
  var props = mark.properties,
      group = mark.marks;

  // parse mark property definitions
  vg.keys(props).forEach(function(k) {
    props[k] = vg.parse.properties(mark.type, props[k]);
  });

  // parse delay function
  if (mark.delay) {
    mark.delay = vg.parse.properties(mark.type, {delay: mark.delay});
  }

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
    mark.marks = group.map(vg.parse.mark);
  }
    
  return mark;
};vg.parse.marks = function(spec, width, height) {
  return {
    type: "group",
    width: width,
    height: height,
    scales: spec.scales || [],
    axes: spec.axes || [],
    legends: spec.legends || [],
    marks: (spec.marks || []).map(vg.parse.mark)
  };
};vg.parse.padding = function(pad) {
  if (pad == null) return "auto";
  else if (vg.isString(pad)) return pad==="strict" ? "strict" : "auto";
  else if (vg.isObject(pad)) return pad;
  var p = vg.isNumber(pad) ? pad : 20;
  return {top:p, left:p, right:p, bottom:p};
};
vg.parse.properties = (function() {
  function compile(mark, spec) {
    var code = "",
        names = vg.keys(spec),
        i, len, name, ref, vars = {};
        
    code += "var o = trans ? {} : item;\n";
    
    for (i=0, len=names.length; i<len; ++i) {
      ref = spec[name = names[i]];
      code += (i > 0) ? "\n  " : "  ";
      code += "o."+name+" = "+valueRef(name, ref)+";";
      vars[name] = true;
    }
    
    if (vars.x2) {
      if (vars.x) {
        code += "\n  if (o.x > o.x2) { "
              + "var t = o.x; o.x = o.x2; o.x2 = t; };";
        code += "\n  o.width = (o.x2 - o.x);";
      } else if (vars.width) {
        code += "\n  o.x = (o.x2 - o.width);";
      } else {
        code += "\n  o.x = o.x2;";
      }
    }
    if (vars.xc) {
      if (vars.width) {
        code += "\n  o.x = (o.xc - o.width/2);";
      } else {
        code += "\n  o.x = o.xc;";
      }
    }

    if (vars.y2) {
      if (vars.y) {
        code += "\n  if (o.y > o.y2) { "
              + "var t = o.y; o.y = o.y2; o.y2 = t; };";
        code += "\n  o.height = (o.y2 - o.y);";
      } else if (vars.height) {
        code += "\n  o.y = (o.y2 - o.height);";
      } else {
        code += "\n  o.y = o.y2;";
      }
    }
    if (vars.yc) {
      if (vars.height) {
        code += "\n  o.y = (o.yc - o.height/2);";
      } else {
        code += "\n  o.y = o.yc;";
      }
    }
    
    if (hasPath(mark, vars)) code += "\n  item.touch();";
    code += "\n  if (trans) trans.interpolate(item, o);";

    try {
      return Function("item", "group", "trans", code);
    } catch (e) {
      vg.error(e);
      vg.log(code);
    }
  }
  
  function hasPath(mark, vars) {
    return vars.path ||
      ((mark==="area" || mark==="line") &&
        (vars.x || vars.x2 || vars.width ||
         vars.y || vars.y2 || vars.height ||
         vars.tension || vars.interpolate));
  }
  
  var GROUP_VARS = {
    "width": 1,
    "height": 1,
    "mark.group.width": 1,
    "mark.group.height": 1
  };

  function valueRef(name, ref) {
    if (ref == null) return null;
    var isColor = name==="fill" || name==="stroke";

    if (isColor) {
      if (ref.c) {
        return colorRef("hcl", ref.h, ref.c, ref.l);
      } else if (ref.h || ref.s) {
        return colorRef("hsl", ref.h, ref.s, ref.l);
      } else if (ref.l || ref.a) {
        return colorRef("lab", ref.l, ref.a, ref.b);
      } else if (ref.r || ref.g || ref.b) {
        return colorRef("rgb", ref.r, ref.g, ref.b);
      }
    }

    if (ref.template) {
      return vg.parse.template.source(ref.template, "item.datum");
    }

    // initialize value
    var val = "item.datum.data";
    if (ref.value !== undefined) {
      val = vg.str(ref.value);
    }

    // get field reference for enclosing group
    if (ref.group != null) {
      var grp = "group.datum";
      if (vg.isString(ref.group)) {
        grp = GROUP_VARS[ref.group]
          ? "group." + ref.group
          : "group.datum["+vg.field(ref.group).map(vg.str).join("][")+"]";
      }
    }

    // get data field value
    if (ref.field != null) {
      if (vg.isString(ref.field)) {
        val = "item.datum["+vg.field(ref.field).map(vg.str).join("][")+"]";
        if (ref.group != null) { val = "this.accessor("+val+")("+grp+")"; }
      } else {
        val = "this.accessor(group.datum["
            + vg.field(ref.field.group).map(vg.str).join("][")
            + "])(item.datum.data)";
      }
    } else if (ref.group != null) {
      val = grp;
    }

    // run through scale function
    if (ref.scale != null) {
      var scale = vg.isString(ref.scale)
        ? vg.str(ref.scale)
        : (ref.scale.group ? "group" : "item")
          + ".datum[" + vg.str(ref.scale.group || ref.scale.field) + "]";
      scale = "group.scales[" + scale + "]";
      val = scale + (ref.band ? ".rangeBand()" : "("+val+")");
    }
    
    // multiply, offset, return value
    val = "("
      + (ref.mult != null ? (vg.number(ref.mult) + " * ") : "")
      + val
      + ")"
      + (ref.offset ? " + " + vg.number(ref.offset) : "");
    return val;
  }
  
  function colorRef(type, x, y, z) {
    var xx = x ? valueRef("", x) : vg.config.color[type][0],
        yy = y ? valueRef("", y) : vg.config.color[type][1],
        zz = z ? valueRef("", z) : vg.config.color[type][2];
    return "(this.d3." + type + "(" + [xx,yy,zz].join(",") + ') + "")';
  }
  
  return compile;
})();vg.parse.scales = (function() {
  var LINEAR = "linear",
      ORDINAL = "ordinal",
      LOG = "log",
      POWER = "pow",
      TIME = "time",
      QUANTILE = "quantile",
      GROUP_PROPERTY = {width: 1, height: 1};

  function scales(spec, scales, db, group) {
    return (spec || []).reduce(function(o, def) {
      var name = def.name, prev = name + ":prev";
      o[name] = scale(def, o[name], db, group);
      o[prev] = o[prev] || o[name];
      return o;
    }, scales || {});
  }

  function scale(def, scale, db, group) {
    var s = instance(def, scale),
        m = s.type===ORDINAL ? ordinal : quantitative,
        rng = range(def, group),
        data = vg.values(group.datum);

    m(def, s, rng, db, data);
    return s;
  }

  function instance(def, scale) {
    var type = def.type || LINEAR;
    if (!scale || type !== scale.type) {
      var ctor = vg.config.scale[type] || d3.scale[type];
      if (!ctor) vg.error("Unrecognized scale type: " + type);
      (scale = ctor()).type = scale.type || type;
      scale.scaleName = def.name;
    }
    return scale;
  }

  function ordinal(def, scale, rng, db, data) {
    var dataDrivenRange = false,
        pad = def.padding || 0,
        outer = def.outerPadding == null ? pad : def.outerPadding,
        domain, sort, str, refs;

    // range pre-processing for data-driven ranges
    if (vg.isObject(def.range) && !vg.isArray(def.range)) {
      dataDrivenRange = true;
      refs = def.range.fields || vg.array(def.range);
      rng = extract(refs, db, data);
    }

    // domain
    sort = def.sort && !dataDrivenRange;
    domain = domainValues(def, db, data, sort);
    if (domain) scale.domain(domain);

    // width-defined range
    if (def.bandWidth) {
      var bw = def.bandWidth,
          len = domain.length,
          start = rng[0] || 0,
          space = def.points ? (pad*bw) : (pad*bw*(len-1) + 2*outer);
      rng = [start, start + (bw * len + space)];
    }

    // range
    str = typeof rng[0] === 'string';
    if (str || rng.length > 2 || rng.length===1 || dataDrivenRange) {
      scale.range(rng); // color or shape values
    } else if (def.points && (def.round || def.round == null)) {
      scale.rangeRoundPoints(rng, pad);
    } else if (def.points) {
      scale.rangePoints(rng, pad);
    } else if (def.round || def.round == null) {
      scale.rangeRoundBands(rng, pad, outer);
    } else {
      scale.rangeBands(rng, pad, outer);
    }
  }

  function quantitative(def, scale, rng, db, data) {
    var domain, interval;

    // domain
    domain = (def.type === QUANTILE)
      ? domainValues(def, db, data, false)
      : domainMinMax(def, db, data);
    scale.domain(domain);

    // range
    // vertical scales should flip by default, so use XOR here
    if (def.range === "height") rng = rng.reverse();
    scale[def.round && scale.rangeRound ? "rangeRound" : "range"](rng);

    if (def.exponent && def.type===POWER) scale.exponent(def.exponent);
    if (def.clamp) scale.clamp(true);
    if (def.nice) {
      if (def.type === TIME) {
        interval = d3.time[def.nice];
        if (!interval) vg.error("Unrecognized interval: " + interval);
        scale.nice(interval);
      } else {
        scale.nice();
      }
    }
  }
  
  function extract(refs, db, data) {
    return refs.reduce(function(values, r) {        
      var dat = vg.values(db[r.data] || data),
          get = vg.accessor(vg.isString(r.field)
              ? r.field : "data." + vg.accessor(r.field.group)(data));
      return vg.unique(dat, get, values);
    }, []);
  }
  
  function domainValues(def, db, data, sort) {
    var domain = def.domain, values, refs;
    if (vg.isArray(domain)) {
      values = sort ? domain.slice() : domain;
    } else if (vg.isObject(domain)) {
      refs = domain.fields || vg.array(domain);
      values = extract(refs, db, data);
    }
    if (values && sort) values.sort(vg.cmp);
    return values;
  }
  
  function domainMinMax(def, db, data) {
    var domain = [null, null], refs, z;
    
    function extract(ref, min, max, z) {
      var dat = vg.values(db[ref.data] || data);
      var fields = vg.array(ref.field).map(function(f) {
        return vg.isString(f) ? f
          : "data." + vg.accessor(f.group)(data);
      });
      
      fields.forEach(function(f,i) {
        f = vg.accessor(f);
        if (min) domain[0] = d3.min([domain[0], d3.min(dat, f)]);
        if (max) domain[z] = d3.max([domain[z], d3.max(dat, f)]);
      });
    }

    if (def.domain !== undefined) {
      if (vg.isArray(def.domain)) {
        domain = def.domain.slice();
      } else if (vg.isObject(def.domain)) {
        refs = def.domain.fields || vg.array(def.domain);
        refs.forEach(function(r) { extract(r,1,1,1); });
      } else {
        domain = def.domain;
      }
    }
    z = domain.length - 1;
    if (def.domainMin !== undefined) {
      if (vg.isObject(def.domainMin)) {
        domain[0] = null;
        refs = def.domainMin.fields || vg.array(def.domainMin);
        refs.forEach(function(r) { extract(r,1,0,z); });
      } else {
        domain[0] = def.domainMin;
      }
    }
    if (def.domainMax !== undefined) {
      if (vg.isObject(def.domainMax)) {
        domain[z] = null;
        refs = def.domainMax.fields || vg.array(def.domainMax);
        refs.forEach(function(r) { extract(r,0,1,z); });
      } else {
        domain[z] = def.domainMax;
      }
    }
    if (def.type !== LOG && def.type !== TIME && (def.zero || def.zero===undefined)) {
      domain[0] = Math.min(0, domain[0]);
      domain[z] = Math.max(0, domain[z]);
    }
    return domain;
  }

  function range(def, group) {
    var rng = [null, null];

    if (def.range !== undefined) {
      if (typeof def.range === 'string') {
        if (GROUP_PROPERTY[def.range]) {
          rng = [0, group[def.range]];
        } else if (vg.config.range[def.range]) {
          rng = vg.config.range[def.range];
        } else {
          vg.error("Unrecogized range: "+def.range);
          return rng;
        }
      } else if (vg.isArray(def.range)) {
        rng = vg.duplicate(def.range);
      } else if (vg.isObject(def.range)) {
        return null; // early exit
      } else {
        rng = [0, def.range];
      }
    }
    if (def.rangeMin !== undefined) {
      rng[0] = def.rangeMin;
    }
    if (def.rangeMax !== undefined) {
      rng[rng.length-1] = def.rangeMax;
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
})();
vg.parse.spec = function(spec, callback, viewFactory) {

  viewFactory = viewFactory || vg.ViewFactory;

  function parse(spec) {
    // protect against subsequent spec modification
    spec = vg.duplicate(spec);

    var width = spec.width || 500,
        height = spec.height || 500,
        viewport = spec.viewport || null;

    var defs = {
      width: width,
      height: height,
      viewport: viewport,
      background: vg.parse.background(spec.background),
      padding: vg.parse.padding(spec.padding),
      marks: vg.parse.marks(spec, width, height),
      data: vg.parse.data(spec.data, function() { callback(viewConstructor); })
    };

    var viewConstructor = viewFactory(defs);
  }

  vg.isObject(spec) ? parse(spec) :
    d3.json(spec, function(error, json) {
      error ? vg.error(error) : parse(json);
    });
};vg.parse.template = function(text) {
  var source = vg.parse.template.source(text, "d");
  source = "var __t; return " + source + ";";

  try {
    return (new Function("d", source)).bind(vg);
  } catch (e) {
    e.source = source;
    throw e;
  }
};

vg.parse.template.source = function(text, variable) {
  variable = variable || "obj";
  var index = 0;
  var source = "'";
  var regex = vg_template_re;

  // Compile the template source, escaping string literals appropriately.
  text.replace(regex, function(match, interpolate, offset) {
    source += text
      .slice(index, offset)
      .replace(vg_template_escaper, vg_template_escapeChar);
    index = offset + match.length;

    if (interpolate) {
      source += "'\n+((__t=("
        + vg_template_var(interpolate, variable)
        + "))==null?'':__t)+\n'";
    }

    // Adobe VMs need the match returned to produce the correct offest.
    return match;
  });
  return source + "'";
};

var vg_template_var = function(text, variable) {
  var filters = text.split('|');
  var prop = filters.shift().trim();
  var format = [];
  var stringCast = true;
  
  function strcall(fn) {
    fn = fn || "";
    if (stringCast) {
      stringCast = false;
      source = "String(" + source + ")" + fn;
    } else {
      source += fn;
    }
    return source;
  }
  
  var source = vg.field(prop).map(vg.str).join("][");
  source = variable + "[" + source + "]";
  
  for (var i=0; i<filters.length; ++i) {
    var f = filters[i], args = null, pidx, a, b;

    if ((pidx=f.indexOf(':')) > 0) {
      f = f.slice(0, pidx);
      args = filters[i].slice(pidx+1).split(',')
        .map(function(s) { return s.trim(); });
    }
    f = f.trim();

    switch (f) {
      case 'length':
        strcall('.length');
        break;
      case 'lower':
        strcall('.toLowerCase()');
        break;
      case 'upper':
        strcall('.toUpperCase()');
        break;
      case 'lower-locale':
        strcall('.toLocaleLowerCase()');
        break;
      case 'upper-locale':
        strcall('.toLocaleUpperCase()');
        break;
      case 'trim':
        strcall('.trim()');
        break;
      case 'left':
        a = vg.number(args[0]);
        strcall('.slice(0,' + a + ')');
        break;
      case 'right':
        a = vg.number(args[0]);
        strcall('.slice(-' + a +')');
        break;
      case 'mid':
        a = vg.number(args[0]);
        b = a + vg.number(args[1]);
        strcall('.slice(+'+a+','+b+')');
        break;
      case 'slice':
        a = vg.number(args[0]);
        strcall('.slice('+ a
          + (args.length > 1 ? ',' + vg.number(args[1]) : '')
          + ')');
        break;
      case 'truncate':
        a = vg.number(args[0]);
        b = args[1];
        b = (b!=="left" && b!=="middle" && b!=="center") ? "right" : b;
        source = 'this.truncate(' + strcall() + ',' + a + ',"' + b + '")';
        break;
      case 'number':
        a = vg_template_format(args[0], d3.format);
        stringCast = false;
        source = 'this.__formats['+a+']('+source+')';
        break;
      case 'time':
        a = vg_template_format(args[0], d3.time.format);
        stringCast = false;
        source = 'this.__formats['+a+']('+source+')';
        break;
      default:
        throw Error("Unrecognized template filter: " + f);
    }
  }

  return source;
};

var vg_template_re = /\{\{(.+?)\}\}|$/g;

// Certain characters need to be escaped so that they can be put into a
// string literal.
var vg_template_escapes = {
  "'":      "'",
  '\\':     '\\',
  '\r':     'r',
  '\n':     'n',
  '\u2028': 'u2028',
  '\u2029': 'u2029'
};

var vg_template_escaper = /\\|'|\r|\n|\u2028|\u2029/g;

var vg_template_escapeChar = function(match) {
  return '\\' + vg_template_escapes[match];
};

var vg_template_formats = [];
var vg_template_format_map = {};

var vg_template_format = function(pattern, fmt) {
  if ((pattern[0] === "'" && pattern[pattern.length-1] === "'") ||
      (pattern[0] !== '"' && pattern[pattern.length-1] === '"')) {
    pattern = pattern.slice(1, -1);
  } else {
    throw Error("Format pattern must be quoted: " + pattern);
  }
  if (!vg_template_format_map[pattern]) {
    var f = fmt(pattern);
    var i = vg_template_formats.length;
    vg_template_formats.push(f);
    vg_template_format_map[pattern] = i;
  }
  return vg_template_format_map[pattern];
};

vg.__formats = vg_template_formats;vg.parse.transform = function(def) {
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

vg.scene.DEFAULT_DATA = {"sentinel":1};

vg.scene.data = function(data, parentData) {
  var DEFAULT = vg.scene.DEFAULT_DATA;

  // if data is undefined, inherit or use default
  data = vg.values(data || parentData || [DEFAULT]);

  // if inheriting default data, ensure its in an array
  if (data === DEFAULT) data = [DEFAULT];
  
  return data;
};

vg.scene.fontString = function(o) {
  return (o.fontStyle ? o.fontStyle + " " : "")
    + (o.fontVariant ? o.fontVariant + " " : "")
    + (o.fontWeight ? o.fontWeight + " " : "")
    + (o.fontSize != null ? o.fontSize : vg.config.render.fontSize) + "px "
    + (o.font || vg.config.render.font);
};vg.scene.Item = (function() {
  function item(mark) {
    this.mark = mark;
  }
  
  var prototype = item.prototype;

  prototype.hasPropertySet = function(name) {
    var props = this.mark.def.properties;
    return props && props[name] != null;
  };

  prototype.cousin = function(offset, index) {
    if (offset === 0) return this;
    offset = offset || -1;
    var mark = this.mark,
        group = mark.group,
        iidx = index==null ? mark.items.indexOf(this) : index,
        midx = group.items.indexOf(mark) + offset;
    return group.items[midx].items[iidx];
  };
  
  prototype.sibling = function(offset) {
    if (offset === 0) return this;
    offset = offset || -1;
    var mark = this.mark,
        iidx = mark.items.indexOf(this) + offset;
    return mark.items[iidx];
  };
  
  prototype.remove = function() {
    var item = this,
        list = item.mark.items,
        i = list.indexOf(item);
    if (i >= 0) (i===list.length-1) ? list.pop() : list.splice(i, 1);
    return item;
  };
  
  prototype.touch = function() {
    if (this.pathCache) this.pathCache = null;
    if (this.mark.pathCache) this.mark.pathCache = null;
  };
  
  return item;
})();

vg.scene.item = function(mark) {
  return new vg.scene.Item(mark);
};vg.scene.visit = function(node, func) {
  var i, n, s, m, items;
  if (func(node)) return true;

  var sets = ["items", "axisItems", "legendItems"];
  for (s=0, m=sets.length; s<m; ++s) {
    if (items = node[sets[s]]) {
      for (i=0, n=items.length; i<n; ++i) {
        if (vg.scene.visit(items[i], func)) return true;
      }
    }
  }
};vg.scene.build = (function() {
  var GROUP  = vg.scene.GROUP,
      ENTER  = vg.scene.ENTER,
      UPDATE = vg.scene.UPDATE,
      EXIT   = vg.scene.EXIT,
      DEFAULT= {"sentinel":1};
  
  function build(def, db, node, parentData, reentrant) {
    var data = vg.scene.data(
      def.from ? def.from(db, node, parentData) : null,
      parentData);
    
    // build node and items
    node = buildNode(def, node);
    node.items = buildItems(def, data, node);
    buildTrans(def, node);
    
    // recurse if group
    if (def.type === GROUP) {
      buildGroup(def, db, node, reentrant);
    }
    
    return node;
  }
  
  function buildNode(def, node) {
    node = node || {};
    node.def = def;
    node.marktype = def.type;
    node.interactive = (def.interactive !== false);
    return node;
  }
  
  function buildItems(def, data, node) {
    var keyf = keyFunction(def.key),
        prev = node.items || [],
        next = [],
        map = {},
        i, key, len, item, datum, enter;

    for (i=0, len=prev.length; i<len; ++i) {
      item = prev[i];
      item.status = EXIT;
      if (keyf) map[item.key] = item;
    }
    
    for (i=0, len=data.length; i<len; ++i) {
      datum = data[i];
      key = i;
      item = keyf ? map[key = keyf(datum)] : prev[i];
      enter = item ? false : (item = vg.scene.item(node), true);
      item.status = enter ? ENTER : UPDATE;
      item.datum = datum;
      item.key = key;
      next.push(item);
    }

    for (i=0, len=prev.length; i<len; ++i) {
      item = prev[i];
      if (item.status === EXIT) {
        item.key = keyf ? item.key : next.length;
        next.splice(item.index, 0, item);
      }
    }
    
    return next;
  }
  
  function buildGroup(def, db, node, reentrant) {
    var groups = node.items,
        marks = def.marks,
        i, len, m, mlen, name, group;

    for (i=0, len=groups.length; i<len; ++i) {
      group = groups[i];
      
      // update scales
      if (!reentrant && group.scales) for (name in group.scales) {
        if (name.indexOf(":prev") < 0) {
          group.scales[name+":prev"] = group.scales[name].copy();
        }
      }

      // build items
      group.items = group.items || [];
      for (m=0, mlen=marks.length; m<mlen; ++m) {
        group.items[m] = build(marks[m], db, group.items[m], group.datum);
        group.items[m].group = group;
      }
    }
  }

  function buildTrans(def, node) {
    if (def.duration) node.duration = def.duration;
    if (def.ease) node.ease = d3.ease(def.ease);
    if (def.delay) {
      var items = node.items, group = node.group, n = items.length, i;
      for (i=0; i<n; ++i) def.delay.call(this, items[i], group);
    }
  }
  
  function keyFunction(key) {
    if (key == null) return null;
    var f = vg.array(key).map(vg.accessor);
    return function(d) {
      for (var s="", i=0, n=f.length; i<n; ++i) {
        if (i>0) s += "|";
        s += String(f[i](d));
      }
      return s;
    };
  }
  
  return build;
})();
vg.scene.bounds = (function() {

  var parse = vg.canvas.path.parse,
      boundPath = vg.canvas.path.bounds,
      areaPath = vg.canvas.path.area,
      linePath = vg.canvas.path.line,
      halfpi = Math.PI / 2,
      sqrt3 = Math.sqrt(3),
      tan30 = Math.tan(30 * Math.PI / 180),
      gfx = null;

  function context() {
    return gfx || (gfx = (vg.config.isNode
      ? new (require("canvas"))(1,1)
      : d3.select("body").append("canvas")
          .attr("class", "vega_hidden")
          .attr("width", 1)
          .attr("height", 1)
          .style("display", "none")
          .node())
      .getContext("2d"));
  }

  function pathBounds(o, path, bounds) {
    if (path == null) {
      bounds.set(0, 0, 0, 0);
    } else {
      boundPath(path, bounds);
      if (o.stroke && o.opacity !== 0 && o.strokeWidth > 0) {
        bounds.expand(o.strokeWidth);
      }
    }
    return bounds;
  }

  function path(o, bounds) {
    var p = o.path
      ? o.pathCache || (o.pathCache = parse(o.path))
      : null;
    return pathBounds(o, p, bounds);
  }
  
  function area(o, bounds) {
    var items = o.mark.items, o = items[0];
    var p = o.pathCache || (o.pathCache = parse(areaPath(items)));
    return pathBounds(items[0], p, bounds);
  }

  function line(o, bounds) {
    var items = o.mark.items, o = items[0];
    var p = o.pathCache || (o.pathCache = parse(linePath(items)));
    return pathBounds(items[0], p, bounds);
  }

  function rect(o, bounds) {
    var x = o.x || 0,
        y = o.y || 0,
        w = (x + o.width) || 0,
        h = (y + o.height) || 0;
    bounds.set(x, y, w, h);
    if (o.stroke && o.opacity !== 0 && o.strokeWidth > 0) {
      bounds.expand(o.strokeWidth);
    }
    return bounds;
  }

  function image(o, bounds) {
    var w = o.width || 0,
        h = o.height || 0,
        x = (o.x||0) - (o.align === "center"
            ? w/2 : (o.align === "right" ? w : 0)),
        y = (o.y||0) - (o.baseline === "middle"
            ? h/2 : (o.baseline === "bottom" ? h : 0));
    return bounds.set(x, y, x+w, y+h);
  }

  function rule(o, bounds) {
    var x1, y1;
    bounds.set(
      x1 = o.x || 0,
      y1 = o.y || 0,
      o.x2 != null ? o.x2 : x1,
      o.y2 != null ? o.y2 : y1
    );
    if (o.stroke && o.opacity !== 0 && o.strokeWidth > 0) {
      bounds.expand(o.strokeWidth);
    }
    return bounds;
  }
  
  function arc(o, bounds) {
    var cx = o.x || 0,
        cy = o.y || 0,
        ir = o.innerRadius || 0,
        or = o.outerRadius || 0,
        sa = (o.startAngle || 0) - halfpi,
        ea = (o.endAngle || 0) - halfpi,
        xmin = Infinity, xmax = -Infinity,
        ymin = Infinity, ymax = -Infinity,
        a, i, n, x, y, ix, iy, ox, oy;

    var angles = [sa, ea],
        s = sa - (sa%halfpi);
    for (i=0; i<4 && s<ea; ++i, s+=halfpi) {
      angles.push(s);
    }

    for (i=0, n=angles.length; i<n; ++i) {
      a = angles[i];
      x = Math.cos(a); ix = ir*x; ox = or*x;
      y = Math.sin(a); iy = ir*y; oy = or*y;
      xmin = Math.min(xmin, ix, ox);
      xmax = Math.max(xmax, ix, ox);
      ymin = Math.min(ymin, iy, oy);
      ymax = Math.max(ymax, iy, oy);
    }

    bounds.set(cx+xmin, cy+ymin, cx+xmax, cy+ymax);
    if (o.stroke && o.opacity !== 0 && o.strokeWidth > 0) {
      bounds.expand(o.strokeWidth);
    }
    return bounds;
  }

  function symbol(o, bounds) {
    var size = o.size != null ? o.size : 100,
        x = o.x || 0,
        y = o.y || 0,
        r, t, rx, ry;

    switch (o.shape) {
      case "cross":
        r = Math.sqrt(size / 5) / 2;
        t = 3*r;
        bounds.set(x-t, y-r, x+t, y+r);
        break;

      case "diamond":
        ry = Math.sqrt(size / (2 * tan30));
        rx = ry * tan30;
        bounds.set(x-rx, y-ry, x+rx, y+ry);
        break;

      case "square":
        t = Math.sqrt(size);
        r = t / 2;
        bounds.set(x-r, y-r, x+r, y+r);
        break;

      case "triangle-down":
        rx = Math.sqrt(size / sqrt3);
        ry = rx * sqrt3 / 2;
        bounds.set(x-rx, y-ry, x+rx, y+ry);
        break;

      case "triangle-up":
        rx = Math.sqrt(size / sqrt3);
        ry = rx * sqrt3 / 2;
        bounds.set(x-rx, y-ry, x+rx, y+ry);
        break;

      default:
        r = Math.sqrt(size/Math.PI);
        bounds.set(x-r, y-r, x+r, y+r);
    }
    if (o.stroke && o.opacity !== 0 && o.strokeWidth > 0) {
      bounds.expand(o.strokeWidth);
    }
    return bounds;
  }

  function text(o, bounds, noRotate) {
    var x = (o.x || 0) + (o.dx || 0),
        y = (o.y || 0) + (o.dy || 0),
        h = o.fontSize || vg.config.render.fontSize,
        a = o.align,
        b = o.baseline,
        r = o.radius || 0,
        g = context(), w, t;

    g.font = vg.scene.fontString(o);
    g.textAlign = a || "left";
    g.textBaseline = b || "alphabetic";
    w = g.measureText(o.text || "").width;

    if (r) {
      t = (o.theta || 0) - Math.PI/2;
      x += r * Math.cos(t);
      y += r * Math.sin(t);
    }

    // horizontal
    if (a === "center") {
      x = x - (w / 2);
    } else if (a === "right") {
      x = x - w;
    } else {
      // left by default, do nothing
    }

    /// TODO find a robust solution for heights.
    /// These offsets work for some but not all fonts.

    // vertical
    if (b === "top") {
      y = y + (h/5);
    } else if (b === "bottom") {
      y = y - h;
    } else if (b === "middle") {
      y = y - (h/2) + (h/10);
    } else {
      y = y - 4*h/5; // alphabetic by default
    }
    
    bounds.set(x, y, x+w, y+h);
    if (o.angle && !noRotate) {
      bounds.rotate(o.angle*Math.PI/180, o.x||0, o.y||0);
    }
    return bounds.expand(noRotate ? 0 : 1);
  }

  function group(g, bounds, includeLegends) {
    var axes = g.axisItems || [],
        legends = g.legendItems || [], j, m;

    for (j=0, m=axes.length; j<m; ++j) {
      bounds.union(axes[j].bounds);
    }
    for (j=0, m=g.items.length; j<m; ++j) {
      bounds.union(g.items[j].bounds);
    }
    if (includeLegends) {
      for (j=0, m=legends.length; j<m; ++j) {
        bounds.union(legends[j].bounds);
      }
      if (g.width != null && g.height != null) {
        bounds.add(g.width, g.height);
      }
      if (g.x != null && g.y != null) {
        bounds.add(0, 0);
      }
    }
    bounds.translate(g.x||0, g.y||0);
    return bounds;
  }

  var methods = {
    group:  group,
    symbol: symbol,
    image:  image,
    rect:   rect,
    rule:   rule,
    arc:    arc,
    text:   text,
    path:   path,
    area:   area,
    line:   line
  };

  function itemBounds(item, func, opt) {
    func = func || methods[item.mark.marktype];
    if (!item.bounds_prev) item['bounds:prev'] = new vg.Bounds();
    var b = item.bounds, pb = item['bounds:prev'];
    if (b) pb.clear().union(b);
    item.bounds = func(item, b ? b.clear() : new vg.Bounds(), opt);
    if (!b) pb.clear().union(item.bounds);
    return item.bounds;
  }

  function markBounds(mark, bounds, opt) {
    bounds = bounds || mark.bounds && mark.bounds.clear() || new vg.Bounds();
    var type  = mark.marktype,
        func  = methods[type],
        items = mark.items,
        item, i, len;
        
    if (type==="area" || type==="line") {
      if (items.length) {
        items[0].bounds = func(items[0], bounds);
      }
    } else {
      for (i=0, len=items.length; i<len; ++i) {
        bounds.union(itemBounds(items[i], func, opt));
      }
    }
    mark.bounds = bounds;
  }
  
  return {
    mark:  markBounds,
    item:  itemBounds,
    text:  text,
    group: group
  };

})();vg.scene.encode = (function() {
  var GROUP  = vg.scene.GROUP,
      ENTER  = vg.scene.ENTER,
      UPDATE = vg.scene.UPDATE,
      EXIT   = vg.scene.EXIT,
      EMPTY  = {};

  function main(scene, def, trans, request, items) {
    (request && items)
      ? update.call(this, scene, def, trans, request, items)
      : encode.call(this, scene, scene, def, trans, request);
    return scene;
  }
  
  function update(scene, def, trans, request, items) {
    items = vg.array(items);
    var i, len, item, group, props, prop;
    for (i=0, len=items.length; i<len; ++i) {
      item = items[i];
      group = item.mark.group || null;
      props = item.mark.def.properties;
      prop = props && props[request];
      if (prop) {
        prop.call(vg, item, group, trans);
        vg.scene.bounds.item(item);
      }
    }
  }
  
  function encode(group, scene, def, trans, request) {
    encodeItems.call(this, group, scene.items, def, trans, request);
    if (scene.marktype === GROUP) {
      encodeGroup.call(this, scene, def, group, trans, request);
    } else {
      vg.scene.bounds.mark(scene);
    }
  }
  
  function encodeLegend(group, scene, def, trans, request) {
    encodeGroup.call(this, scene, def, group, trans, request);
    encodeItems.call(this, group, scene.items, def, trans, request);
    vg.scene.bounds.mark(scene, null, true);
  }
  
  function encodeGroup(scene, def, parent, trans, request) {
    var i, len, m, mlen, group, scales,
        axes, axisItems, axisDef, leg, legItems, legDef;

    for (i=0, len=scene.items.length; i<len; ++i) {
      group = scene.items[i];

      // cascade scales recursively
      // use parent scales if there are no group-level scale defs
      scales = group.scales || (group.scales =
        def.scales ? vg.extend({}, parent.scales) : parent.scales);
      
      // update group-level scales
      if (def.scales) {
        vg.parse.scales(def.scales, scales, this._data, group);
      }
      
      // update group-level axes
      if (def.axes) {
        axes = group.axes || (group.axes = []);
        axisItems = group.axisItems || (group.axisItems = []);
        vg.parse.axes(def.axes, axes, group.scales);
        axes.forEach(function(a, i) {
          axisDef = a.def();
          axisItems[i] = vg.scene.build(axisDef, this._data, axisItems[i], null, 1);
          axisItems[i].group = group;
          encode.call(this, group, group.axisItems[i], axisDef, trans);
        });
      }
      
      // encode children marks
      for (m=0, mlen=group.items.length; m<mlen; ++m) {
        encode.call(this, group, group.items[m], def.marks[m], trans, request);
      }
    }
    
    // compute bounds (without legend)
    vg.scene.bounds.mark(scene, null, !def.legends);
    
    // update legends
    if (def.legends) {
      for (i=0, len=scene.items.length; i<len; ++i) {
        group = scene.items[i];
        leg = group.legends || (group.legends = []);
        legItems = group.legendItems || (group.legendItems = []);
        vg.parse.legends(def.legends, leg, group.scales);
        leg.forEach(function(l, i) {
          legDef = l.def();
          legItems[i] = vg.scene.build(legDef, this._data, legItems[i], null, 1);
          legItems[i].group = group;
          encodeLegend.call(this, group, group.legendItems[i], legDef, trans);
        });
      }
      vg.scene.bounds.mark(scene, null, true);
    }
  }
  
  function encodeItems(group, items, def, trans, request) {    
    var props  = def.properties || EMPTY,
        enter  = props.enter,
        update = props.update,
        exit   = props.exit,
        i, len, item, prop;

    if (request) {
      if (prop = props[request]) {
        for (i=0, len=items.length; i<len; ++i) {
          prop.call(vg, items[i], group, trans);
        }
      }
      return; // exit early if given request
    }

    for (i=0; i<items.length; ++i) {
      item = items[i];

      // enter set
      if (item.status === ENTER) {
        if (enter) enter.call(vg, item, group);
        item.status = UPDATE;
      }

      // update set      
      if (item.status !== EXIT && update) {
        update.call(vg, item, group, trans);
      }
      
      // exit set
      if (item.status === EXIT) {
        if (exit) exit.call(vg, item, group, trans);
        if (trans && !exit) trans.interpolate(item, EMPTY);
        else if (!trans) items[i--].remove();
      }
    }
  }
  
  return main;
})();vg.scene.Transition = (function() {
  function trans(duration, ease) {
    this.duration = duration || 500;
    this.ease = ease && d3.ease(ease) || d3.ease("cubic-in-out");
    this.updates = {next: null};
  }
  
  var prototype = trans.prototype;
  
  var skip = {
    "text": 1,
    "url":  1
  };
  
  prototype.interpolate = function(item, values) {
    var key, curr, next, interp, list = null;

    for (key in values) {
      curr = item[key];
      next = values[key];      
      if (curr !== next) {
        if (skip[key] || curr === undefined) {
          // skip interpolation for specific keys or undefined start values
          item[key] = next;
        } else if (typeof curr === "number" && !isFinite(curr)) {
          // for NaN or infinite numeric values, skip to final value
          item[key] = next;
        } else {
          // otherwise lookup interpolator
          interp = d3.interpolate(curr, next);
          interp.property = key;
          (list || (list=[])).push(interp);
        }
      }
    }

    if (list === null && item.status === vg.scene.EXIT) {
      list = []; // ensure exiting items are included
    }

    if (list != null) {
      list.item = item;
      list.ease = item.mark.ease || this.ease;
      list.next = this.updates.next;
      this.updates.next = list;
    }
    return this;
  };
  
  prototype.start = function(callback) {
    var t = this, prev = t.updates, curr = prev.next;
    for (; curr!=null; prev=curr, curr=prev.next) {
      if (curr.item.status === vg.scene.EXIT) curr.remove = true;
    }
    t.callback = callback;
    d3.timer(function(elapsed) { return step.call(t, elapsed); });
  };

  function step(elapsed) {
    var list = this.updates, prev = list, curr = prev.next,
        duration = this.duration,
        item, delay, f, e, i, n, stop = true;

    for (; curr!=null; prev=curr, curr=prev.next) {
      item = curr.item;
      delay = item.delay || 0;

      f = (elapsed - delay) / duration;
      if (f < 0) { stop = false; continue; }
      if (f > 1) f = 1;
      e = curr.ease(f);

      for (i=0, n=curr.length; i<n; ++i) {
        item[curr[i].property] = curr[i](e);
      }
      item.touch();
      vg.scene.bounds.item(item);

      if (f === 1) {
        if (curr.remove) item.remove();
        prev.next = curr.next;
        curr = prev;
      } else {
        stop = false;
      }
    }

    this.callback();
    return stop;
  }
  
  return trans;
  
})();

vg.scene.transition = function(dur, ease) {
  return new vg.scene.Transition(dur, ease);
};
vg.scene.axis = function() {
  var scale,
      orient = vg.config.axis.orient,
      offset = 0,
      titleOffset = vg.config.axis.titleOffset,
      axisDef = null,
      layer = "front",
      grid = false,
      title = null,
      tickMajorSize = vg.config.axis.tickSize,
      tickMinorSize = vg.config.axis.tickSize,
      tickEndSize = vg.config.axis.tickSize,
      tickPadding = vg.config.axis.padding,
      tickValues = null,
      tickFormatString = null,
      tickSubdivide = 0,
      tickCount = vg.config.axis.ticks,
      gridLineStyle = {},
      tickLabelStyle = {},
      majorTickStyle = {},
      minorTickStyle = {},
      titleStyle = {},
      domainStyle = {};

  var axis = {};

  function reset() {
    axisDef = null;
  }

  function getTickFormatString() {
    return tickFormatString || (scale.type === 'log' ? ".1s" : null);
  }

  function buildTickFormat() {
    var fmtStr = getTickFormatString();
    if (scale.tickFormat) {
      return scale.tickFormat(tickCount, fmtStr);
    } else if (fmtStr) {
      return ((scale.type === 'time')
        ? d3.time.format(fmtStr)
        : d3.format(fmtStr));
    } else {
      return String;
    }
  }

  function buildTicks(fmt) {
    var ticks = {
      major: tickValues,
      minor: null
    };
    
    if (ticks.major == null) {
      ticks.major = scale.ticks
        ? scale.ticks(tickCount)
        : scale.domain();
    }

    ticks.minor = vg_axisSubdivide(scale, ticks.major, tickSubdivide)
      .map(vg.data.ingest);

    ticks.major = ticks.major.map(function(d) {
      return (d = vg.data.ingest(d), d.label = fmt(d.data), d);
    });
    
    return ticks;
  }

  axis.def = function() {
    var def = axisDef ? axisDef : (axisDef = axis_def(scale));
    var fmt = buildTickFormat();
    var ticks = buildTicks(fmt);
    var tdata = title ? [title].map(vg.data.ingest) : [];
    
    // update axis def
    def.marks[0].from = function() { return grid ? ticks.major : []; };
    def.marks[1].from = function() { return ticks.major; };
    def.marks[2].from = function() { return ticks.minor; };
    def.marks[3].from = def.marks[1].from;
    def.marks[4].from = function() { return [1]; };
    def.marks[5].from = function() { return tdata; };
    def.offset = offset;
    def.orient = orient;
    def.layer = layer;
    return def;
  };

  function axis_def(scale) {
    // setup scale mapping
    var newScale, oldScale, range;
    if (scale.type === "ordinal") {
      newScale = {scale: scale.scaleName, offset: 0.5 + scale.rangeBand()/2};
      oldScale = newScale;
    } else {
      newScale = {scale: scale.scaleName, offset: 0.5};
      oldScale = {scale: scale.scaleName+":prev", offset: 0.5};
    }
    range = vg_axisScaleRange(scale);

    // setup axis marks
    var gridLines = vg_axisTicks();
    var majorTicks = vg_axisTicks();
    var minorTicks = vg_axisTicks();
    var tickLabels = vg_axisTickLabels();
    var domain = vg_axisDomain();
    var title = vg_axisTitle();
    gridLines.properties.enter.stroke = {value: vg.config.axis.gridColor};

    // extend axis marks based on axis orientation
    vg_axisTicksExtend(orient, gridLines, oldScale, newScale, Infinity);
    vg_axisTicksExtend(orient, majorTicks, oldScale, newScale, tickMajorSize);
    vg_axisTicksExtend(orient, minorTicks, oldScale, newScale, tickMinorSize);
    vg_axisLabelExtend(orient, tickLabels, oldScale, newScale, tickMajorSize, tickPadding);

    vg_axisDomainExtend(orient, domain, range, tickEndSize);
    vg_axisTitleExtend(orient, title, range, titleOffset); // TODO get offset
    
    // add / override custom style properties
    vg.extend(gridLines.properties.update, gridLineStyle);
    vg.extend(majorTicks.properties.update, majorTickStyle);
    vg.extend(minorTicks.properties.update, minorTickStyle);
    vg.extend(tickLabels.properties.update, tickLabelStyle);
    vg.extend(domain.properties.update, domainStyle);
    vg.extend(title.properties.update, titleStyle);

    var marks = [gridLines, majorTicks, minorTicks, tickLabels, domain, title];
    return {
      type: "group",
      interactive: false,
      properties: { enter: vg_axisUpdate, update: vg_axisUpdate },
      marks: marks.map(vg.parse.mark)
    };
  }

  axis.scale = function(x) {
    if (!arguments.length) return scale;
    if (scale !== x) { scale = x; reset(); }
    return axis;
  };

  axis.orient = function(x) {
    if (!arguments.length) return orient;
    if (orient !== x) {
      orient = x in vg_axisOrients ? x + "" : vg.config.axis.orient;
      reset();
    }
    return axis;
  };

  axis.title = function(x) {
    if (!arguments.length) return title;
    if (title !== x) { title = x; reset(); }
    return axis;
  };

  axis.tickCount = function(x) {
    if (!arguments.length) return tickCount;
    tickCount = x;
    return axis;
  };

  axis.tickValues = function(x) {
    if (!arguments.length) return tickValues;
    tickValues = x;
    return axis;
  };

  axis.tickFormat = function(x) {
    if (!arguments.length) return tickFormatString;
    if (tickFormatString !== x) {
      tickFormatString = x;
      reset();
    }
    return axis;
  };
  
  axis.tickSize = function(x, y) {
    if (!arguments.length) return tickMajorSize;
    var n = arguments.length - 1,
        major = +x,
        minor = n > 1 ? +y : tickMajorSize,
        end   = n > 0 ? +arguments[n] : tickMajorSize;

    if (tickMajorSize !== major ||
        tickMinorSize !== minor ||
        tickEndSize !== end) {
      reset();
    }

    tickMajorSize = major;
    tickMinorSize = minor;
    tickEndSize = end;
    return axis;
  };

  axis.tickSubdivide = function(x) {
    if (!arguments.length) return tickSubdivide;
    tickSubdivide = +x;
    return axis;
  };
  
  axis.offset = function(x) {
    if (!arguments.length) return offset;
    offset = vg.isObject(x) ? x : +x;
    return axis;
  };

  axis.tickPadding = function(x) {
    if (!arguments.length) return tickPadding;
    if (tickPadding !== +x) { tickPadding = +x; reset(); }
    return axis;
  };

  axis.titleOffset = function(x) {
    if (!arguments.length) return titleOffset;
    if (titleOffset !== +x) { titleOffset = +x; reset(); }
    return axis;
  };

  axis.layer = function(x) {
    if (!arguments.length) return layer;
    if (layer !== x) { layer = x; reset(); }
    return axis;
  };

  axis.grid = function(x) {
    if (!arguments.length) return grid;
    if (grid !== x) { grid = x; reset(); }
    return axis;
  };

  axis.gridLineProperties = function(x) {
    if (!arguments.length) return gridLineStyle;
    if (gridLineStyle !== x) { gridLineStyle = x; }
    return axis;
  };

  axis.majorTickProperties = function(x) {
    if (!arguments.length) return majorTickStyle;
    if (majorTickStyle !== x) { majorTickStyle = x; }
    return axis;
  };

  axis.minorTickProperties = function(x) {
    if (!arguments.length) return minorTickStyle;
    if (minorTickStyle !== x) { minorTickStyle = x; }
    return axis;
  };

  axis.tickLabelProperties = function(x) {
    if (!arguments.length) return tickLabelStyle;
    if (tickLabelStyle !== x) { tickLabelStyle = x; }
    return axis;
  };

  axis.titleProperties = function(x) {
    if (!arguments.length) return titleStyle;
    if (titleStyle !== x) { titleStyle = x; }
    return axis;
  };

  axis.domainProperties = function(x) {
    if (!arguments.length) return domainStyle;
    if (domainStyle !== x) { domainStyle = x; }
    return axis;
  };
  
  axis.reset = function() { reset(); };

  return axis;
};

var vg_axisOrients = {top: 1, right: 1, bottom: 1, left: 1};

function vg_axisSubdivide(scale, ticks, m) {
  subticks = [];
  if (m && ticks.length > 1) {
    var extent = vg_axisScaleExtent(scale.domain()),
        subticks,
        i = -1,
        n = ticks.length,
        d = (ticks[1] - ticks[0]) / ++m,
        j,
        v;
    while (++i < n) {
      for (j = m; --j > 0;) {
        if ((v = +ticks[i] - j * d) >= extent[0]) {
          subticks.push(v);
        }
      }
    }
    for (--i, j = 0; ++j < m && (v = +ticks[i] + j * d) < extent[1];) {
      subticks.push(v);
    }
  }
  return subticks;
}

function vg_axisScaleExtent(domain) {
  var start = domain[0], stop = domain[domain.length - 1];
  return start < stop ? [start, stop] : [stop, start];
}

function vg_axisScaleRange(scale) {
  return scale.rangeExtent
    ? scale.rangeExtent()
    : vg_axisScaleExtent(scale.range());
}

var vg_axisAlign = {
  bottom: "center",
  top: "center",
  left: "right",
  right: "left"
};

var vg_axisBaseline = {
  bottom: "top",
  top: "bottom",
  left: "middle",
  right: "middle"
};

function vg_axisLabelExtend(orient, labels, oldScale, newScale, size, pad) {
  size = Math.max(size, 0) + pad;
  if (orient === "left" || orient === "top") {
    size *= -1;
  }  
  if (orient === "top" || orient === "bottom") {
    vg.extend(labels.properties.enter, {
      x: oldScale,
      y: {value: size},
    });
    vg.extend(labels.properties.update, {
      x: newScale,
      y: {value: size},
      align: {value: "center"},
      baseline: {value: vg_axisBaseline[orient]}
    });
  } else {
    vg.extend(labels.properties.enter, {
      x: {value: size},
      y: oldScale,
    });
    vg.extend(labels.properties.update, {
      x: {value: size},
      y: newScale,
      align: {value: vg_axisAlign[orient]},
      baseline: {value: "middle"}
    });
  }
}

function vg_axisTicksExtend(orient, ticks, oldScale, newScale, size) {
  var sign = (orient === "left" || orient === "top") ? -1 : 1;
  if (size === Infinity) {
    size = (orient === "top" || orient === "bottom")
      ? {group: "mark.group.height", mult: -sign}
      : {group: "mark.group.width", mult: -sign};
  } else {
    size = {value: sign * size};
  }
  if (orient === "top" || orient === "bottom") {
    vg.extend(ticks.properties.enter, {
      x:  oldScale,
      y:  {value: 0},
      y2: size
    });
    vg.extend(ticks.properties.update, {
      x:  newScale,
      y:  {value: 0},
      y2: size
    });
    vg.extend(ticks.properties.exit, {
      x:  newScale,
    });        
  } else {
    vg.extend(ticks.properties.enter, {
      x:  {value: 0},
      x2: size,
      y:  oldScale
    });
    vg.extend(ticks.properties.update, {
      x:  {value: 0},
      x2: size,
      y:  newScale
    });
    vg.extend(ticks.properties.exit, {
      y:  newScale,
    });
  }
}

function vg_axisTitleExtend(orient, title, range, offset) {
  var mid = ~~((range[0] + range[1]) / 2),
      sign = (orient === "top" || orient === "left") ? -1 : 1;
  
  if (orient === "bottom" || orient === "top") {
    vg.extend(title.properties.update, {
      x: {value: mid},
      y: {value: sign*offset},
      angle: {value: 0}
    });
  } else {
    vg.extend(title.properties.update, {
      x: {value: sign*offset},
      y: {value: mid},
      angle: {value: -90}
    });
  }
}

function vg_axisDomainExtend(orient, domain, range, size) {
  var path;
  if (orient === "top" || orient === "left") {
    size = -1 * size;
  }
  if (orient === "bottom" || orient === "top") {
    path = "M" + range[0] + "," + size + "V0H" + range[1] + "V" + size;
  } else {
    path = "M" + size + "," + range[0] + "H0V" + range[1] + "H" + size;
  }
  domain.properties.update.path = {value: path};
}

function vg_axisUpdate(item, group, trans) {
  var o = trans ? {} : item,
      offset = item.mark.def.offset,
      orient = item.mark.def.orient,
      width  = group.width,
      height = group.height; // TODO fallback to global w,h?

    if (vg.isArray(offset)) {
      var ofx = offset[0],
          ofy = offset[1];

      switch (orient) {
        case "left":   { o.x = -ofx; o.y = ofy; break; }
        case "right":  { o.x = width + ofx; o.y = ofy; break; }
        case "bottom": { o.x = ofx; o.y = height + ofy; break; }
        case "top":    { o.x = ofx; o.y = -ofy; break; }
        default:       { o.x = ofx; o.y = ofy; }
      }
    } else {
      if (vg.isObject(offset)) {
        offset = -group.scales[offset.scale](offset.value);
      }

      switch (orient) {
        case "left":   { o.x = -offset; o.y = 0; break; }
        case "right":  { o.x = width + offset; o.y = 0; break; }
        case "bottom": { o.x = 0; o.y = height + offset; break; }
        case "top":    { o.x = 0; o.y = -offset; break; }
        default:       { o.x = 0; o.y = 0; }
      }
    }

  if (trans) trans.interpolate(item, o);
}

function vg_axisTicks() {
  return {
    type: "rule",
    interactive: false,
    key: "data",
    properties: {
      enter: {
        stroke: {value: vg.config.axis.tickColor},
        strokeWidth: {value: vg.config.axis.tickWidth},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: { opacity: {value: 1} }
    }
  };
}

function vg_axisTickLabels() {
  return {
    type: "text",
    interactive: true,
    key: "data",
    properties: {
      enter: {
        fill: {value: vg.config.axis.tickLabelColor},
        font: {value: vg.config.axis.tickLabelFont},
        fontSize: {value: vg.config.axis.tickLabelFontSize},
        opacity: {value: 1e-6},
        text: {field: "label"}
      },
      exit: { opacity: {value: 1e-6} },
      update: { opacity: {value: 1} }
    }
  };
}

function vg_axisTitle() {
  return {
    type: "text",
    interactive: true,
    properties: {
      enter: {
        font: {value: vg.config.axis.titleFont},
        fontSize: {value: vg.config.axis.titleFontSize},
        fontWeight: {value: vg.config.axis.titleFontWeight},
        fill: {value: vg.config.axis.titleColor},
        align: {value: "center"},
        baseline: {value: "middle"},
        text: {field: "data"}
      },
      update: {}
    }
  };
}

function vg_axisDomain() {
  return {
    type: "path",
    interactive: false,
    properties: {
      enter: {
        x: {value: 0.5},
        y: {value: 0.5},
        stroke: {value: vg.config.axis.axisColor},
        strokeWidth: {value: vg.config.axis.axisWidth}
      },
      update: {}
    }
  };
}
vg.scene.legend = function() {
  var size = null,
      shape = null,
      fill = null,
      stroke = null,
      spacing = null,
      values = null,
      format = null,
      formatString = null,
      title,
      orient = "right",
      offset = vg.config.legend.offset,
      padding = vg.config.legend.padding,
      legendDef,
      tickArguments = [5],
      legendStyle = {},
      symbolStyle = {},
      gradientStyle = {},
      titleStyle = {},
      labelStyle = {};

  var legend = {},
      legendDef = null;

  function reset() { legendDef = null; }

  legend.def = function() {
    var scale = size || shape || fill || stroke;
    
    format = !formatString ? null : ((scale.type === 'time')
      ? d3.time.format(formatString)
      : d3.format(formatString));
    
    if (!legendDef) {
      legendDef = (scale===fill || scale===stroke) && !discrete(scale.type)
        ? quantDef(scale)
        : ordinalDef(scale);
    }
    legendDef.orient = orient;
    legendDef.offset = offset;
    legendDef.padding = padding;
    return legendDef;
  };

  function discrete(type) {
    return type==="ordinal" || type==="quantize"
      || type==="quantile" || type==="threshold";
  }

  function ordinalDef(scale) {
    var def = o_legend_def(size, shape, fill, stroke);

    // generate data
    var data = (values == null
      ? (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain())
      : values).map(vg.data.ingest);
    var fmt = format==null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : String) : format;
    
    // determine spacing between legend entries
    var fs, range, offset, pad=5, domain = d3.range(data.length);
    if (size) {
      range = data.map(function(x) { return Math.sqrt(size(x.data)); });
      offset = d3.max(range);
      range = range.reduce(function(a,b,i,z) {
          if (i > 0) a[i] = a[i-1] + z[i-1]/2 + pad;
          return (a[i] += b/2, a); }, [0]).map(Math.round);
    } else {
      offset = Math.round(Math.sqrt(vg.config.legend.symbolSize));
      range = spacing
        || (fs = labelStyle.fontSize) && (fs.value + pad)
        || (vg.config.legend.labelFontSize + pad);
      range = domain.map(function(d,i) {
        return Math.round(offset/2 + i*range);
      });
    }

    // account for padding and title size
    var sz = padding, ts;
    if (title) {
      ts = titleStyle.fontSize;
      sz += 5 + ((ts && ts.value) || vg.config.legend.titleFontSize);
    }
    for (var i=0, n=range.length; i<n; ++i) range[i] += sz;
    
    // build scale for label layout
    var scale = {
      name: "legend",
      type: "ordinal",
      points: true,
      domain: domain,
      range: range
    };
    
    // update legend def
    var tdata = (title ? [title] : []).map(vg.data.ingest);
    data.forEach(function(d) {
      d.label = fmt(d.data);
      d.offset = offset;
    });
    def.scales = [ scale ];
    def.marks[0].from = function() { return tdata; };
    def.marks[1].from = function() { return data; };
    def.marks[2].from = def.marks[1].from;
    return def;
  }

  function o_legend_def(size, shape, fill, stroke) {
    // setup legend marks
    var titles = vg_legendTitle(),
        symbols = vg_legendSymbols(),
        labels = vg_vLegendLabels();

    // extend legend marks
    vg_legendSymbolExtend(symbols, size, shape, fill, stroke);
    
    // add / override custom style properties
    vg.extend(titles.properties.update, titleStyle);
    vg.extend(symbols.properties.update, symbolStyle);
    vg.extend(labels.properties.update, labelStyle);

    // padding from legend border
    titles.properties.enter.x.value += padding;
    titles.properties.enter.y.value += padding;
    labels.properties.enter.x.offset += padding + 1;
    symbols.properties.enter.x.offset = padding + 1;
    labels.properties.update.x.offset += padding + 1;
    symbols.properties.update.x.offset = padding + 1;

    return {
      type: "group",
      interactive: false,
      properties: {
        enter: vg.parse.properties("group", legendStyle),
        update: vg_legendUpdate
      },
      marks: [titles, symbols, labels].map(vg.parse.mark)
    };
  }

  function quantDef(scale) {
    var def = q_legend_def(scale),
        dom = scale.domain(),
        data = dom.map(vg.data.ingest),
        width = (gradientStyle.width && gradientStyle.width.value) || vg.config.legend.gradientWidth,
        fmt = format==null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : String) : format;

    // build scale for label layout
    var layout = {
      name: "legend",
      type: scale.type,
      round: true,
      zero: false,
      domain: [dom[0], dom[dom.length-1]],
      range: [padding, width+padding]
    };
    if (scale.type==="pow") layout.exponent = scale.exponent();
    
    // update legend def
    var tdata = (title ? [title] : []).map(vg.data.ingest);
    data.forEach(function(d,i) {
      d.label = fmt(d.data);
      d.align = i==(data.length-1) ? "right" : i==0 ? "left" : "center";
    });
    def.scales = [ layout ];
    def.marks[0].from = function() { return tdata; };
    def.marks[1].from = function() { return [1]; };
    def.marks[2].from = function() { return data; };
    return def;
  }
  
  function q_legend_def(scale) {
    // setup legend marks
    var titles = vg_legendTitle(),
        gradient = vg_legendGradient(),
        labels = vg_hLegendLabels(),
        grad = new vg.Gradient();

    // setup color gradient
    var dom = scale.domain(),
        min = dom[0],
        max = dom[dom.length-1],
        f = scale.copy().domain([min, max]).range([0,1]);
        
    var stops = (scale.type !== "linear" && scale.ticks)
      ? scale.ticks.call(scale, 15) : dom;
    if (min !== stops[0]) stops.unshift(min);
    if (max !== stops[stops.length-1]) stops.push(max);

    for (var i=0, n=stops.length; i<n; ++i) {
      grad.stop(f(stops[i]), scale(stops[i]));
    }
    gradient.properties.enter.fill = {value: grad};

    // add / override custom style properties
    vg.extend(titles.properties.update, titleStyle);
    vg.extend(gradient.properties.update, gradientStyle);
    vg.extend(labels.properties.update, labelStyle);

    // account for gradient size
    var gp = gradient.properties, gh = gradientStyle.height,
        hh = (gh && gh.value) || gp.enter.height.value;
    labels.properties.enter.y.value = hh;
    labels.properties.update.y.value = hh;

    // account for title size as needed
    if (title) {
      var tp = titles.properties, fs = titleStyle.fontSize,
          sz = 4 + ((fs && fs.value) || tp.enter.fontSize.value);
      gradient.properties.enter.y.value += sz;
      labels.properties.enter.y.value += sz;
      gradient.properties.update.y.value += sz;
      labels.properties.update.y.value += sz;
    }
    
    // padding from legend border
    titles.properties.enter.x.value += padding;
    titles.properties.enter.y.value += padding;
    gradient.properties.enter.x.value += padding;
    gradient.properties.enter.y.value += padding;
    labels.properties.enter.y.value += padding;
    gradient.properties.update.x.value += padding;
    gradient.properties.update.y.value += padding;
    labels.properties.update.y.value += padding;

    return {
      type: "group",
      interactive: false,
      properties: {
        enter: vg.parse.properties("group", legendStyle),
        update: vg_legendUpdate
      },
      marks: [titles, gradient, labels].map(vg.parse.mark)
    };
  }

  legend.size = function(x) {
    if (!arguments.length) return size;
    if (size !== x) { size = x; reset(); }
    return legend;
  };

  legend.shape = function(x) {
    if (!arguments.length) return shape;
    if (shape !== x) { shape = x; reset(); }
    return legend;
  };

  legend.fill = function(x) {
    if (!arguments.length) return fill;
    if (fill !== x) { fill = x; reset(); }
    return legend;
  };
  
  legend.stroke = function(x) {
    if (!arguments.length) return stroke;
    if (stroke !== x) { stroke = x; reset(); }
    return legend;
  };

  legend.title = function(x) {
    if (!arguments.length) return title;
    if (title !== x) { title = x; reset(); }
    return legend;
  };

  legend.format = function(x) {
    if (!arguments.length) return formatString;
    if (formatString !== x) {
      formatString = x;
      reset();
    }
    return legend;
  };

  legend.spacing = function(x) {
    if (!arguments.length) return spacing;
    if (spacing !== +x) { spacing = +x; reset(); }
    return legend;
  };

  legend.orient = function(x) {
    if (!arguments.length) return orient;
    orient = x in vg_legendOrients ? x + "" : vg.config.legend.orient;
    return legend;
  };

  legend.offset = function(x) {
    if (!arguments.length) return offset;
    offset = +x;
    return legend;
  };

  legend.values = function(x) {
    if (!arguments.length) return values;
    values = x;
    return legend;
  };

  legend.legendProperties = function(x) {
    if (!arguments.length) return legendStyle;
    legendStyle = x;
    return legend;
  };

  legend.symbolProperties = function(x) {
    if (!arguments.length) return symbolStyle;
    symbolStyle = x;
    return legend;
  };

  legend.gradientProperties = function(x) {
    if (!arguments.length) return gradientStyle;
    gradientStyle = x;
    return legend;
  };

  legend.labelProperties = function(x) {
    if (!arguments.length) return labelStyle;
    labelStyle = x;
    return legend;
  };
  
  legend.titleProperties = function(x) {
    if (!arguments.length) return titleStyle;
    titleStyle = x;
    return legend;
  };

  legend.reset = function() { reset(); };

  return legend;
};

var vg_legendOrients = {right: 1, left: 1};

function vg_legendUpdate(item, group, trans) {
  var o = trans ? {} : item, gx,
      offset = item.mark.def.offset,
      orient = item.mark.def.orient,
      pad    = item.mark.def.padding * 2,
      lw     = ~~item.bounds.width() + (item.width ? 0 : pad),
      lh     = ~~item.bounds.height() + (item.height ? 0 : pad);

  o.x = 0.5;
  o.y = 0.5;
  o.width = lw;
  o.height = lh;

  // HACK: use to estimate group bounds during animated transition
  if (!trans && group.bounds) {
    group.bounds.delta = group.bounds.x2 - group.width;
  }

  switch (orient) {
    case "left":  {
      gx = group.bounds ? group.bounds.x1 : 0;
      o.x += gx - offset - lw;
      break;
    }
    case "right": {
      gx = group.width;
      if (group.bounds) gx = trans
        ? group.width + group.bounds.delta
        : group.bounds.x2;
      o.x += gx + offset;
      break;
    }
  }
  
  if (trans) trans.interpolate(item, o);
  item.mark.def.properties.enter(item, group, trans);
}

function vg_legendSymbolExtend(mark, size, shape, fill, stroke) {
  var e = mark.properties.enter,
      u = mark.properties.update;
  if (size)   e.size   = u.size   = {scale: size.scaleName,   field: "data"};
  if (shape)  e.shape  = u.shape  = {scale: shape.scaleName,  field: "data"};
  if (fill)   e.fill   = u.fill   = {scale: fill.scaleName,   field: "data"};
  if (stroke) e.stroke = u.stroke = {scale: stroke.scaleName, field: "data"};
}

function vg_legendTitle() {
  var cfg = vg.config.legend;
  return {
    type: "text",
    interactive: false,
    key: "data",
    properties: {
      enter: {
        x: {value: 0},
        y: {value: 0},
        fill: {value: cfg.titleColor},
        font: {value: cfg.titleFont},
        fontSize: {value: cfg.titleFontSize},
        fontWeight: {value: cfg.titleFontWeight},
        baseline: {value: "top"},
        text: {field: "data"},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: { opacity: {value: 1} }
    }
  };
}

function vg_legendSymbols() {
  var cfg = vg.config.legend;
  return {
    type: "symbol",
    interactive: false,
    key: "data",
    properties: {
      enter: {
        x: {field: "offset", mult: 0.5},
        y: {scale: "legend", field: "index"},
        shape: {value: cfg.symbolShape},
        size: {value: cfg.symbolSize},
        stroke: {value: cfg.symbolColor},
        strokeWidth: {value: cfg.symbolStrokeWidth},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: {
        x: {field: "offset", mult: 0.5},
        y: {scale: "legend", field: "index"},
        opacity: {value: 1}
      }
    }
  };
}

function vg_vLegendLabels() {
  var cfg = vg.config.legend;
  return {
    type: "text",
    interactive: false,
    key: "data",
    properties: {
      enter: {
        x: {field: "offset", offset: 5},
        y: {scale: "legend", field: "index"},
        fill: {value: cfg.labelColor},
        font: {value: cfg.labelFont},
        fontSize: {value: cfg.labelFontSize},
        align: {value: cfg.labelAlign},
        baseline: {value: cfg.labelBaseline},
        text: {field: "label"},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: {
        opacity: {value: 1},
        x: {field: "offset", offset: 5},
        y: {scale: "legend", field: "index"},
      }
    }
  };
}

function vg_legendGradient() {
  var cfg = vg.config.legend;
  return {
    type: "rect",
    interactive: false,
    properties: {
      enter: {
        x: {value: 0},
        y: {value: 0},
        width: {value: cfg.gradientWidth},
        height: {value: cfg.gradientHeight},
        stroke: {value: cfg.gradientStrokeColor},
        strokeWidth: {value: cfg.gradientStrokeWidth},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: {
        x: {value: 0},
        y: {value: 0},
        opacity: {value: 1}
      }
    }
  };
}

function vg_hLegendLabels() {
  var cfg = vg.config.legend;
  return {
    type: "text",
    interactive: false,
    key: "data",
    properties: {
      enter: {
        x: {scale: "legend", field: "data"},
        y: {value: 20},
        dy: {value: 2},
        fill: {value: cfg.labelColor},
        font: {value: cfg.labelFont},
        fontSize: {value: cfg.labelFontSize},
        align: {field: "align"},
        baseline: {value: "top"},
        text: {field: "label"},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: {
        x: {scale: "legend", field: "data"},
        y: {value: 20},
        opacity: {value: 1}
      }
    }
  };
}vg.Model = (function() {
  function model() {
    this._defs = null;
    this._data = {};
    this._scene = null;
    this._reset = {axes: false, legends: false};
  }

  var prototype = model.prototype;

  prototype.defs = function(defs) {
    if (!arguments.length) return this._defs;
    this._defs = defs;
    return this;
  };

  prototype.data = function(data) {
    if (!arguments.length) return this._data;

    var deps = {},
        defs = this._defs,
        src  = defs.data.source,
        tx   = defs.data.flow || {},
        keys = defs.data.sorted,
        len  = keys.length, i, k, x;

    // collect source data set dependencies
    function sources(k) {
      (src[k] || []).forEach(function(s) { deps[s] = k; sources(s); });
    }
    vg.keys(data).forEach(sources);
    
    // update data sets in dependency-aware order
    for (i=0; i<len; ++i) {
      if (data[k=keys[i]]) {
        x = data[k];
      } else if (deps[k]) {
        x = vg_data_duplicate(this._data[deps[k]]);
        if (vg.isTree(data)) vg_make_tree(x);
      } else continue;
      this._data[k] = tx[k] ? tx[k](x, this._data, defs.marks) : x;
    }

    this._reset.legends = true;
    return this;
  };

  prototype.width = function(width) {
    if (this._defs) this._defs.width = width;
    if (this._defs && this._defs.marks) this._defs.marks.width = width;
    if (this._scene) this._scene.items[0].width = width;
    this._reset.axes = true;
    return this;
  };

  prototype.height = function(height) {
    if (this._defs) this._defs.height = height;
    if (this._defs && this._defs.marks) this._defs.marks.height = height;
    if (this._scene) this._scene.items[0].height = height;
    this._reset.axes = true;
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

  prototype.encode = function(trans, request, item) {
    this.reset();
    var m = this, scene = m._scene, defs = m._defs;
    vg.scene.encode.call(m, scene, defs.marks, trans, request, item);
    return this;
  };

  prototype.reset = function() {
    if (this._scene && this._reset.axes) {
      vg.scene.visit(this._scene, function(item) {
        if (item.axes) item.axes.forEach(function(axis) { axis.reset(); });
      });
      this._reset.axes = false;
    }
    if (this._scene && this._reset.legends) {
      vg.scene.visit(this._scene, function(item) {
        if (item.legends) item.legends.forEach(function(l) { l.reset(); });
      });
      this._reset.legends = false;
    }
    return this;
  };

  return model;
})();vg.View = (function() {
  var view = function(el, width, height) {
    this._el = null;
    this._build = false;
    this._model = new vg.Model();
    this._width = this.__width = width || 500;
    this._height = this.__height = height || 500;
    this._bgcolor = null;
    this._autopad = 1;
    this._padding = {top:0, left:0, bottom:0, right:0};
    this._viewport = null;
    this._renderer = null;
    this._handler = null;
    this._io = vg.canvas;
    if (el) this.initialize(el);
  };
  
  var prototype = view.prototype;
  
  prototype.width = function(width) {
    if (!arguments.length) return this.__width;
    if (this.__width !== width) {
      this._width = this.__width = width;
      if (this._el) this.initialize(this._el.parentNode);
      this._model.width(width);
      if (this._strict) this._autopad = 1;
    }
    return this;
  };

  prototype.height = function(height) {
    if (!arguments.length) return this.__height;
    if (this.__height !== height) {
      this._height = this.__height = height;
      if (this._el) this.initialize(this._el.parentNode);
      this._model.height(this._height);
      if (this._strict) this._autopad = 1;
    }
    return this;
  };

  prototype.background = function(bgcolor) {
    if (!arguments.length) return this._bgcolor;
    if (this._bgcolor !== bgcolor) {
      this._bgcolor = bgcolor;
      if (this._el) this.initialize(this._el.parentNode);
    }
    return this;
  };

  prototype.padding = function(pad) {
    if (!arguments.length) return this._padding;
    if (this._padding !== pad) {
      if (vg.isString(pad)) {
        this._autopad = 1;
        this._padding = {top:0, left:0, bottom:0, right:0};
        this._strict = (pad === "strict");
      } else {
        this._autopad = 0;
        this._padding = pad;
        this._strict = false;
      }
      if (this._el) {
        this._renderer.resize(this._width, this._height, pad);
        this._handler.padding(pad);
      }
    }
    return this;
  };
  
  prototype.autopad = function(opt) {
    if (this._autopad < 1) return this;
    else this._autopad = 0;

    var pad = this._padding,
        b = this.model().scene().bounds,
        inset = vg.config.autopadInset,
        l = b.x1 < 0 ? Math.ceil(-b.x1) + inset : 0,
        t = b.y1 < 0 ? Math.ceil(-b.y1) + inset : 0,
        r = b.x2 > this._width  ? Math.ceil(+b.x2 - this._width) + inset : 0,
        b = b.y2 > this._height ? Math.ceil(+b.y2 - this._height) + inset : 0;
    pad = {left:l, top:t, right:r, bottom:b};

    if (this._strict) {
      this._autopad = 0;
      this._padding = pad;
      this._width = Math.max(0, this.__width - (l+r));
      this._height = Math.max(0, this.__height - (t+b));
      this._model.width(this._width);
      this._model.height(this._height);
      if (this._el) this.initialize(this._el.parentNode);
      this.update({props:"enter"}).update({props:"update"});
    } else {
      this.padding(pad).update(opt);
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
      this._renderer = null;
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
      return (d[k] = vg.data.ingestAll(data[k]), d);
    }, {});
    this._model.data(ingest);
    this._build = false;
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
    var v = this, prevHandler,
        w = v._width,
        h = v._height,
        bg = v._bgcolor,
        pad = v._padding;
    
    // clear pre-existing container
    d3.select(el).select("div.vega").remove();
    
    // add div container
    this._el = el = d3.select(el)
      .append("div")
      .attr("class", "vega")
      .style("position", "relative")
      .node();
    if (v._viewport) {
      d3.select(el)
        .style("width",  (v._viewport[0] || w)+"px")
        .style("height", (v._viewport[1] || h)+"px")
        .style("overflow", "auto");
    }
    
    // renderer
    v._renderer = (v._renderer || new this._io.Renderer())
      .initialize(el, w, h, pad, bg);
    
    // input handler
    prevHandler = v._handler;
    v._handler = new this._io.Handler()
      .initialize(el, pad, v)
      .model(v._model);

    if (prevHandler) {
      prevHandler.handlers().forEach(function(h) {
        v._handler.on(h.type, h.handler);
      });
    }
    
    return this;
  };
  
  prototype.render = function(items) {
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
  
  prototype.update = function(opt) {    
    opt = opt || {};
    var view = this,
        trans = opt.duration
          ? vg.scene.transition(opt.duration, opt.ease)
          : null;

    view._build = view._build || (view._model.build(), true);
    view._model.encode(trans, opt.props, opt.items);
    
    if (trans) {
      trans.start(function(items) {
        view._renderer.render(view._model.scene(), items);
      });
    }
    else view.render(opt.items);

    return view.autopad(opt);
  };
      
  return view;
})();

// view constructor factory
// takes definitions from parsed specification as input
// returns a view constructor
vg.ViewFactory = function(defs) {
  return function(opt) {
    opt = opt || {};
    var v = new vg.View()
      .width(defs.width)
      .height(defs.height)
      .background(defs.background)
      .padding(defs.padding)
      .viewport(defs.viewport)
      .renderer(opt.renderer || "canvas")
      .defs(defs);

    if (defs.data.load) v.data(defs.data.load);
    if (opt.data) v.data(opt.data);
    if (opt.el) v.initialize(opt.el);

    if (opt.hover !== false) {
      v.on("mouseover", function(evt, item) {
        if (item.hasPropertySet("hover")) {
          this.update({props:"hover", items:item});
        }
      })
      .on("mouseout", function(evt, item) {
        if (item.hasPropertySet("hover")) {
          this.update({props:"update", items:item});
        }
      });
    }
  
    return v;
  };
};
vg.Spec = (function() {
  var spec = function(s) {
    this.spec = {
      width: 500,
      height: 500,
      padding: 0,
      data: [],
      scales: [],
      axes: [],
      marks: []
    };
    if (s) vg.extend(this.spec, s);
  };
  
  var prototype = spec.prototype;

  prototype.width = function(w) {
    this.spec.width = w;
    return this;
  };
  
  prototype.height = function(h) {
    this.spec.height = h;
    return this;
  };
  
  prototype.padding = function(p) {
    this.spec.padding = p;
    return this;
  };
  
  prototype.viewport = function(v) {
    this.spec.viewport = v;
    return this;
  };

  prototype.data = function(name, params) {
    if (!params) params = vg.isString(name) ? {name: name} : name;
    else params.name = name;
    this.spec.data.push(params);
    return this;
  };
  
  prototype.scale = function(name, params) {
    if (!params) params = vg.isString(name) ? {name: name} : name;
    else params.name = name;
    this.spec.scales.push(params);
    return this;
  };
  
  prototype.axis = function(params) {
    this.spec.axes.push(params);
    return this;
  };
  
  prototype.mark = function(type, mark) {
    if (!mark) mark = {type: type};
    else mark.type = type;
    mark.properties = {};
    this.spec.marks.push(mark);
    
    var that = this;
    return {
      from: function(name, obj) {
              mark.from = obj
                ? (obj.data = name, obj)
                : vg.isString(name) ? {data: name} : name;
              return this;
            },
      prop: function(name, obj) {
              mark.properties[name] = vg.keys(obj).reduce(function(o,k) {
                var v = obj[k];
                return (o[k] = vg.isObject(v) ? v : {value: v}, o);
              }, {});
              return this;
            },
      done: function() { return that; }
    };
  };

  prototype.parse = function(callback) {
    vg.parse.spec(this.spec, callback);
  };

  prototype.json = function() {
    return this.spec;
  };

  return spec;
})();

vg.spec = function(s) {
  return new vg.Spec(s);
};
vg.headless = {};

vg.headless.canvas = vg.canvas.Renderer;vg.headless.svg = (function() {
  
  var renderer = function() {
    this._text = {
      head: "",
      root: "",
      foot: "",
      defs: "",
      body: ""
    };
    this._defs = {
      gradient: {},
      clipping: {}
    };
  };

  function open(tag, attr, raw) {
    var s = "<" + tag;
    if (attr) {
      for (var key in attr) {
        var val = attr[key];
        if (val != null) {
          s += " " + key + '="' + val + '"';
        }
      }
    }
    if (raw) s += " " + raw;
    return s + ">";
  }

  function close(tag) {
    return "</" + tag + ">";
  }

  var prototype = renderer.prototype;
  
  prototype.initialize = function(el, w, h, pad, bgcolor) {
    var t = this._text;

    var headAttr = {
      width: w,
      height: h
    };
    if (bgcolor != null) {
      headAttr.style = 'background-color:' + bgcolor + ';';
    }

    t.head = open('svg', headAttr, vg.config.svgNamespace);

    t.root = open('g', {
      transform: 'translate(' + pad.left + ',' + pad.top + ')'
    });

    t.foot = close('g') + close('svg');
  };
  
  prototype.svg = function() {
    var t = this._text;
    return t.head + t.defs + t.root + t.body + t.foot;
  };
  
  prototype.buildDefs = function() {
    var all = this._defs,
        dgrad = vg.keys(all.gradient),
        dclip = vg.keys(all.clipping),
        defs = "", grad, clip, i, j;

    for (i=0; i<dgrad.length; ++i) {
      var id = dgrad[i],
          def = all.gradient[id],
          stops = def.stops;

      defs += open("linearGradient", {
        id: id,
        x1: def.x1,
        x2: def.x2,
        y1: def.y1,
        y2: def.y2
      });
      
      for (j=0; j<stops.length; ++j) {
        defs += open("stop", {
          offset: stops[j].offset,
          "stop-color": stops[j].color
        }) + close("stop");
      }
      
      defs += close("linearGradient");
    }
    
    for (i=0; i<dclip.length; ++i) {
      var id = dclip[i],
          def = all.clipping[id];

      defs += open("clipPath", {id: id});

      defs += open("rect", {
        x: 0,
        y: 0,
        width: def.width,
        height: def.height
      }) + close("rect");

      defs += close("clipPath");
    }
    
    return defs;
  };
  
  prototype.render = function(scene) {
    this._text.body = this.draw(scene);
    this._text.defs = this.buildDefs();
  };

  prototype.draw = function(scene) {
    var meta = MARKS[scene.marktype],
        tag  = meta[0],
        attr = meta[1],
        nest = meta[2] || false,
        data = nest ? [scene.items] : scene.items,
        defs = this._defs,
        svg = "", i, sty;

    svg += open('g', {'class': cssClass(scene.def)});

    for (i=0; i<data.length; ++i) {
      sty = tag === 'g' ? null : style(data[i], tag, defs);
      svg += open(tag, attr(data[i], defs), sty);
      if (tag === 'text') svg += escape_text(data[i].text);
      if (tag === 'g') svg += this.drawGroup(data[i]);
      svg += close(tag);
    }

    return svg + close('g');
  };
  
  function escape_text(s) {
    s = (s == null ? "" : String(s));
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
  }
  
  function escape_font(s) {
    return String(s).replace(/\"/g, "'");
  }

  var MARKS = {
    group:  ['g', group],
    area:   ['path', area, true],
    line:   ['path', line, true],
    arc:    ['path', arc],
    path:   ['path', path],
    symbol: ['path', symbol],
    rect:   ['rect', rect],
    rule:   ['line', rule],
    text:   ['text', text],
    image:  ['image', image]
  };

  prototype.drawGroup = function(scene) {
    var svg = "",
        axes = scene.axisItems || [],
        items = scene.items,
        legends = scene.legendItems || [],
        i, j, m;

    svg += group_bg(scene);

    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].def.layer === "back") {
        svg += this.draw(axes[j]);
      }
    }
    for (j=0, m=items.length; j<m; ++j) {
      svg += this.draw(items[j]);
    }
    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].def.layer !== "back") {
        svg += this.draw(axes[j]);
      }
    }
    for (j=0, m=legends.length; j<m; ++j) {
      svg += this.draw(legends[j]);
    }

    return svg;
  };
  
  ///

  function group_bg(o) {
    var w = o.width || 0,
        h = o.height || 0;
    if (w === 0 && h === 0) return "";

    return open('rect', {
      'class': 'background',
      width: w,
      height: h
    }, style(o, 'rect')) + close('rect');
  }
  
  function group(o, defs) {
    var x = o.x || 0,
        y = o.y || 0,
        attr = {transform: "translate("+x+","+y+")"};

    if (o.clip) {
      var c = {width: o.width || 0, height: o.height || 0},
          id = o.clip_id || (o.clip_id = "clip" + clip_id++);
      defs.clipping[id] = c;
      attr["clip-path"] = "url(#"+id+")";
    }

    return attr;
  }
  
  function arc(o) {
    var x = o.x || 0,
        y = o.y || 0;
    return {
      transform: "translate("+x+","+y+")",
      d: arc_path(o)
    };
  }
  
  function area(items) {
    if (!items.length) return;
    var o = items[0],
        path = o.orient === "horizontal" ? area_path_h : area_path_v;
    path
      .interpolate(o.interpolate || "linear")
      .tension(o.tension == null ? 0.7 : o.tension);
    return {d: path(items)};
  }
  
  function line(items) {
    if (!items.length) return;
    var o = items[0];
    line_path
      .interpolate(o.interpolate || "linear")
      .tension(o.tension == null ? 0.7 : o.tension);
    return {d: line_path(items)};
  }
  
  function path(o) {
    var x = o.x || 0,
        y = o.y || 0;
    return {
      transform: "translate("+x+","+y+")",
      d: o.path
    };
  }

  function rect(o) {
    return {
      x: o.x || 0,
      y: o.y || 0,
      width: o.width || 0,
      height: o.height || 0
    };
  }

  function rule(o) {
    var x1 = o.x || 0,
        y1 = o.y || 0;
    return {
      x1: x1,
      y1: y1,
      x2: o.x2 != null ? o.x2 : x1,
      y2: o.y2 != null ? o.y2 : y1
    };
  }
  
  function symbol(o) {
    var x = o.x || 0,
        y = o.y || 0;
    return {
      transform: "translate("+x+","+y+")",
      d: symbol_path(o)
    };
  }
  
  function image(o) {
    var w = o.width || (o.image && o.image.width) || 0,
        h = o.height || (o.image && o.image.height) || 0,
        x = o.x - (o.align === "center"
          ? w/2 : (o.align === "right" ? w : 0)),
        y = o.y - (o.baseline === "middle"
          ? h/2 : (o.baseline === "bottom" ? h : 0)),
        url = vg.config.baseURL + o.url;
    
    return {
      "xlink:href": url,
      x: x,
      y: y,
      width: w,
      height: h
    };
  }
  
  function text(o) {
    var x = o.x || 0,
        y = o.y || 0,
        dx = o.dx || 0,
        dy = o.dy || 0,
        a = o.angle || 0,
        r = o.radius || 0,
        align = textAlign[o.align || "left"],
        base = o.baseline==="top" ? ".9em"
             : o.baseline==="middle" ? ".35em" : 0;

    if (r) {
      var t = (o.theta || 0) - Math.PI/2;
      x += r * Math.cos(t);
      y += r * Math.sin(t);
    }

    return {
      x: x + dx,
      y: y + dy,
      'text-anchor': align,
      transform: a ? "rotate("+a+" "+x+","+y+")" : null,
      dy: base ? base : null
    };
  }
  
  ///

  function cssClass(def) {
    var cls = "type-" + def.type;
    if (def.name) cls += " " + def.name;
    return cls;
  }

  function x(o)     { return o.x || 0; }
  function y(o)     { return o.y || 0; }
  function xw(o)    { return o.x + o.width || 0; }
  function yh(o)    { return o.y + o.height || 0; }
  function key(o)   { return o.key; }
  function size(o)  { return o.size==null ? 100 : o.size; }
  function shape(o) { return o.shape || "circle"; }

  var arc_path    = d3.svg.arc(),
      area_path_v = d3.svg.area().x(x).y1(y).y0(yh),
      area_path_h = d3.svg.area().y(y).x0(xw).x1(x),
      line_path   = d3.svg.line().x(x).y(y),
      symbol_path = d3.svg.symbol().type(shape).size(size);

  var mark_id = 0,
      clip_id = 0;

  var textAlign = {
    "left":   "start",
    "center": "middle",
    "right":  "end"
  };

  var styles = {
    "fill":             "fill",
    "fillOpacity":      "fill-opacity",
    "stroke":           "stroke",
    "strokeWidth":      "stroke-width",
    "strokeOpacity":    "stroke-opacity",
    "strokeCap":        "stroke-linecap",
    "strokeDash":       "stroke-dasharray",
    "strokeDashOffset": "stroke-dashoffset",
    "opacity":          "opacity"
  };

  var styleProps = vg.keys(styles);

  function style(d, tag, defs) {
    var i, n, prop, name, value,
        o = d.mark ? d : d.length ? d[0] : null;
    if (o === null) return null;

    var s = "";
    for (i=0, n=styleProps.length; i<n; ++i) {
      prop = styleProps[i];
      name = styles[prop];
      value = o[prop];

      if (value == null) {
        if (name === "fill") s += 'fill:none;';
      } else {
        if (value.id) {
          // ensure definition is included
          defs.gradient[value.id] = value;
          value = "url(" + window.location.href + "#" + value.id + ")";
        }
        s += name + ':' + value + ';';
      }
    }
    
    if (tag === 'text') {
      s += 'font:' + fontString(o); + ';';
    }
    
    return s.length ? 'style="'+s+'"' : null;
  }

  function fontString(o) {
    var f = (o.fontStyle ? o.fontStyle + " " : "")
      + (o.fontVariant ? o.fontVariant + " " : "")
      + (o.fontWeight ? o.fontWeight + " " : "")
      + (o.fontSize != null ? o.fontSize : vg.config.render.fontSize) + "px "
      + (o.font && escape_font(o.font) || vg.config.render.font);
    return f;
  }

  return renderer;

})();vg.headless.View = (function() {
  
  var view = function(width, height, pad, bgcolor, type, vp) {
    this._canvas = null;
    this._type = type;
    this._el = "body";
    this._build = false;
    this._model = new vg.Model();
    this._width = this.__width = width || 500;
    this._height = this.__height = height || 500;
    this._bgcolor = bgcolor || null;
    this._padding = pad || {top:0, left:0, bottom:0, right:0};
    this._autopad = vg.isString(this._padding) ? 1 : 0;
    this._renderer = new vg.headless[type]();
    this._viewport = vp || null;
    this.initialize();
  };
  
  var prototype = view.prototype;

  prototype.el = function(el) {
    if (!arguments.length) return this._el;
    if (this._el !== el) {
      this._el = el;
      this.initialize();
    }
    return this;
  };

  prototype.model = function() {
    return this._model;
  };

  prototype.width = function(width) {
    if (!arguments.length) return this._width;
    if (this._width !== width) {
      this._width = width;
      this.initialize();
      this._model.width(width);
    }
    return this;
  };

  prototype.height = function(height) {
    if (!arguments.length) return this._height;
    if (this._height !== height) {
      this._height = height;
      this.initialize();
      this._model.height(this._height);
    }
    return this;
  };

  prototype.background = function(bgcolor) {
    if (!arguments.length) return this._bgcolor;
    if (this._bgcolor !== bgcolor) {
      this._bgcolor = bgcolor;
      this.initialize();
    }
    return this;
  };

  prototype.padding = function(pad) {
    if (!arguments.length) return this._padding;
    if (this._padding !== pad) {
      if (vg.isString(pad)) {
        this._autopad = 1;
        this._padding = {top:0, left:0, bottom:0, right:0};
        this._strict = (pad === "strict");
      } else {
        this._autopad = 0;
        this._padding = pad;
        this._strict = false;
      }
      this.initialize();
    }
    return this;
  };

  prototype.autopad = function(opt) {
    if (this._autopad < 1) return this;
    else this._autopad = 0;

    var pad = this._padding,
        b = this._model.scene().bounds,
        inset = vg.config.autopadInset,
        l = b.x1 < 0 ? Math.ceil(-b.x1) + inset : 0,
        t = b.y1 < 0 ? Math.ceil(-b.y1) + inset : 0,
        r = b.x2 > this._width  ? Math.ceil(+b.x2 - this._width) + inset : 0,
        b = b.y2 > this._height ? Math.ceil(+b.y2 - this._height) + inset : 0;
    pad = {left:l, top:t, right:r, bottom:b};

    if (this._strict) {
      this._autopad = 0;
      this._padding = pad;
      this._width = Math.max(0, this.__width - (l+r));
      this._height = Math.max(0, this.__height - (t+b));
      this._model.width(this._width);
      this._model.height(this._height);
      if (this._el) this.initialize();
      this.update({props:"enter"}).update({props:"update"});
    } else {
      this.padding(pad).update(opt);
    }
    return this;
  };

  prototype.viewport = function(vp) {
    if (!arguments.length) return _viewport;
    this._viewport = vp;
    this.initialize();
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
      return (d[k] = vg.data.ingestAll(data[k]), d);
    }, {});
    this._model.data(ingest);
    this._build = false;
    return this;
  };

  prototype.renderer = function() {
    return this._renderer;
  };

  prototype.canvas = function() {
    return this._canvas;
  };
  
  prototype.canvasAsync = function(callback) {
    var r = this._renderer, view = this;
    
    function wait() {
      if (r.pendingImages() === 0) {
        view.render(); // re-render with all images
        callback(view._canvas);
      } else {
        setTimeout(wait, 10);
      }
    }

    // if images loading, poll until ready
    (r.pendingImages() > 0) ? wait() : callback(this._canvas);
  };
  
  prototype.svg = function() {
    return (this._type === "svg")
      ? this._renderer.svg()
      : null;
  };

  prototype.initialize = function() {    
    var w = this._width,
        h = this._height,
        bg = this._bgcolor,
        pad = this._padding;

    if (this._viewport) {
      w = this._viewport[0] - (pad ? pad.left + pad.right : 0);
      h = this._viewport[1] - (pad ? pad.top + pad.bottom : 0);
    }
    
    if (this._type === "svg") {
      this.initSVG(w, h, pad, bg);
    } else {
      this.initCanvas(w, h, pad, bg);
    }
    
    return this;
  };
  
  prototype.initCanvas = function(w, h, pad, bg) {
    var Canvas = require("canvas"),
        tw = w + (pad ? pad.left + pad.right : 0),
        th = h + (pad ? pad.top + pad.bottom : 0),
        canvas = this._canvas = new Canvas(tw, th),
        ctx = canvas.getContext("2d");
    
    // setup canvas context
    ctx.setTransform(1, 0, 0, 1, pad.left, pad.top);

    // configure renderer
    this._renderer.context(ctx);
    this._renderer.resize(w, h, pad);
    this._renderer.background(bg);
  };
  
  prototype.initSVG = function(w, h, pad, bg) {
    var tw = w + (pad ? pad.left + pad.right : 0),
        th = h + (pad ? pad.top + pad.bottom : 0);

    // configure renderer
    this._renderer.initialize(this._el, tw, th, pad, bg);
  };
  
  prototype.render = function(items) {
    this._renderer.render(this._model.scene(), items);
    return this;
  };
  
  prototype.update = function(opt) {
    opt = opt || {};
    var view = this;
    view._build = view._build || (view._model.build(), true);
    view._model.encode(null, opt.props, opt.items);
    view.render(opt.items);
    return view.autopad(opt);
  };
    
  return view;
})();

// headless view constructor factory
// takes definitions from parsed specification as input
// returns a view constructor
vg.headless.View.Factory = function(defs) {
  return function(opt) {
    opt = opt || {};
    var w = defs.width,
        h = defs.height,
        p = defs.padding,
        bg = defs.background,
        vp = defs.viewport,
        r = opt.renderer || "canvas",
        v = new vg.headless.View(w, h, p, bg, r, vp).defs(defs);
    if (defs.data.load) v.data(defs.data.load);
    if (opt.data) v.data(opt.data);
    return v;
  };
};vg.headless.render = function(opt, callback) {
  function draw(chart) {
    try {
      // create and render view
      var view = chart({
        data: opt.data,
        renderer: opt.renderer
      }).update();

      if (opt.renderer === "svg") {
        // extract rendered svg
        callback(null, {svg: view.svg(), view: view});
      } else {
        // extract rendered canvas, waiting for any images to load
        view.canvasAsync(function(canvas) {
          callback(null, {canvas: canvas, view: view});
        });
      }
    } catch (err) {
      callback(err, null);
    }
  }

  vg.parse.spec(opt.spec, draw, vg.headless.View.Factory);
};  // return module
  return vg;

//---------------------------------------------------
// END code for this module
//---------------------------------------------------
}));