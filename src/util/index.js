define(function(require, module, exports) {
  var config = require('./config'),
      util = {};

  // type checking functions
  var toString = Object.prototype.toString;

  util.isObject = function(obj) {
    return obj === Object(obj);
  };

  util.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  util.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };
    
  util.isArray = Array.isArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  util.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  util.isBoolean = function(obj) {
    return toString.call(obj) == '[object Boolean]';
  };

  util.isTree = function(obj) {
    return obj && obj.__vgtree__;
  };

  util.tree = function(obj, children) {
    var d = [obj];
    d.__vgtree__ = true;
    d.children = children || "children";
    return d;
  };

  util.number = function(s) { return +s; };

  util.boolean = function(s) { return !!s; };

  // utility functions

  util.identity = function(x) { return x; };

  util.true = function() { return true; };

  util.extend = function(obj) {
    for (var x, name, i=1, len=arguments.length; i<len; ++i) {
      x = arguments[i];
      for (name in x) { obj[name] = x[name]; }
    }
    return obj;
  };

  util.duplicate = function(obj) {
    return JSON.parse(JSON.stringify(obj));
  };

  util.field = function(f) {
    return f.split("\\.")
      .map(function(d) { return d.split("."); })
      .reduce(function(a, b) {
        if (a.length) { a[a.length-1] += "." + b.shift(); }
        a.push.apply(a, b);
        return a;
      }, []);
  };

  util.accessor = function(f) {
    var s;
    return (util.isFunction(f) || f==null)
      ? f : util.isString(f) && (s=util.field(f)).length > 1
      ? function(x) { return s.reduce(function(x,f) { return x[f]; }, x); }
      : function(x) { return x[f]; };
  };

  util.comparator = function(sort) {
    var sign = [];
    if (sort === undefined) sort = [];
    sort = util.array(sort).map(function(f) {
      var s = 1;
      if      (f[0] === "-") { s = -1; f = f.slice(1); }
      else if (f[0] === "+") { s = +1; f = f.slice(1); }
      sign.push(s);
      return util.accessor(f);
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

  util.cmp = function(a, b) { return a<b ? -1 : a>b ? 1 : 0; };

  util.numcmp = function(a, b) { return a - b; };

  util.array = function(x) {
    return x != null ? (util.isArray(x) ? x : [x]) : [];
  };

  util.values = function(x) {
    return (util.isObject(x) && !util.isArray(x) && x.values) ? 
      (util.isFunction(x.values) ? x.values() : x.values) : x;
  };

  util.str = function(x) {
    return util.isArray(x) ? "[" + x.map(util.str) + "]"
      : util.isObject(x) ? JSON.stringify(x)
      : util.isString(x) ? ("'"+vg_escape_str(x)+"'") : x;
  };

  var escape_str_re = /(^|[^\\])'/g;

  function vg_escape_str(x) {
    return x.replace(escape_str_re, "$1\\'");
  }

  util.keys = function(x) {
    var keys = [];
    for (var key in x) keys.push(key);
    return keys;
  };

  util.unique = function(data, f, results) {
    if (!util.isArray(data) || data.length==0) return [];
    f = f || util.identity;
    results = results || [];
    for (var v, i=0, n=data.length; i<n; ++i) {
      v = f(data[i]);
      if (results.indexOf(v) < 0) results.push(v);
    }
    return results;
  };

  util.minIndex = function(data, f) {
    if (!util.isArray(data) || data.length==0) return -1;
    f = f || util.identity;
    var idx = 0, min = f(data[0]), v = min;
    for (var i=1, n=data.length; i<n; ++i) {
      v = f(data[i]);
      if (v < min) { min = v; idx = i; }
    }
    return idx;
  };

  util.maxIndex = function(data, f) {
    if (!util.isArray(data) || data.length==0) return -1;
    f = f || util.identity;
    var idx = 0, max = f(data[0]), v = max;
    for (var i=1, n=data.length; i<n; ++i) {
      v = f(data[i]);
      if (v > max) { max = v; idx = i; }
    }
    return idx;
  };

  util.truncate = function(s, length, pos, word, ellipsis) {
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
  }

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

  util.fontString = function(o) {
    return (o.fontStyle ? o.fontStyle + " " : "")
      + (o.fontVariant ? o.fontVariant + " " : "")
      + (o.fontWeight ? o.fontWeight + " " : "")
      + (o.fontSize != null ? o.fontSize : config.render.fontSize) + "px "
      + (o.font || config.render.font);
  };

  // Logging

  function vg_write(msg) {
    config.isNode
      ? process.stderr.write(msg + "\n")
      : console.log(msg);
  }

  util.log = function(msg) {
    vg_write("[Vega Log] " + msg);
  };

  util.error = function(msg) {
    msg = "[Vega Err] " + msg;
    vg_write(msg);
    if (typeof alert !== "undefined") alert(msg);
  };

  return util;
});