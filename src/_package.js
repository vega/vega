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
