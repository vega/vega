(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-array'), require('d3-request'), require('d3-dsv'), require('topojson'), require('d3-time-format'), require('d3-shape'), require('d3-path'), require('d3-scale'), require('d3-scale-chromatic'), require('d3-interpolate'), require('d3-geo'), require('d3-format'), require('d3-force'), require('d3-collection'), require('d3-hierarchy'), require('d3-voronoi'), require('d3-color')) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3-array', 'd3-request', 'd3-dsv', 'topojson', 'd3-time-format', 'd3-shape', 'd3-path', 'd3-scale', 'd3-scale-chromatic', 'd3-interpolate', 'd3-geo', 'd3-format', 'd3-force', 'd3-collection', 'd3-hierarchy', 'd3-voronoi', 'd3-color'], factory) :
  (factory((global.vega = global.vega || {}),global.d3,global.d3,global.d3,global.topojson,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3Array,d3Request,d3Dsv,topojson,d3TimeFormat,d3Shape,d3Path,$,_,$$1,d3Geo,d3Format,d3Force,d3Collection,d3Hierarchy,d3Voronoi,d3Color) { 'use strict';

var version = "3.0.0-beta.31";

function bin$1(_) {
  // determine range
  var maxb = _.maxbins || 20,
      base = _.base || 10,
      logb = Math.log(base),
      div  = _.divide || [5, 2],
      min  = _.extent[0],
      max  = _.extent[1],
      span = max - min,
      step, level, minstep, precision, v, i, n, eps;

  if (_.step) {
    // if step size is explicitly given, use that
    step = _.step;
  } else if (_.steps) {
    // if provided, limit choice to acceptable step sizes
    v = span / maxb;
    for (i=0, n=_.steps.length; i < n && _.steps[i] < v; ++i);
    step = _.steps[Math.max(0, i-1)];
  } else {
    // else use span to determine step size
    level = Math.ceil(Math.log(maxb) / logb);
    minstep = _.minstep || 0;
    step = Math.max(
      minstep,
      Math.pow(base, Math.round(Math.log(span) / logb) - level)
    );

    // increase step size if too many bins
    while (Math.ceil(span/step) > maxb) { step *= base; }

    // decrease step size if allowed
    for (i=0, n=div.length; i<n; ++i) {
      v = step / div[i];
      if (v >= minstep && span / v <= maxb) step = v;
    }
  }

  // update precision, min and max
  v = Math.log(step);
  precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
  eps = Math.pow(base, -precision - 1);
  if (_.nice || _.nice === undefined) {
    min = Math.min(min, Math.floor(min / step + eps) * step);
    max = Math.ceil(max / step) * step;
  }

  return {
    start: min,
    stop:  max,
    step:  step
  };
}

function numbers(array, f) {
  var numbers = [],
      n = array.length,
      i = -1, a;

  if (f == null) {
    while (++i < n) if (!isNaN(a = number(array[i]))) numbers.push(a);
  } else {
    while (++i < n) if (!isNaN(a = number(f(array[i], i, array)))) numbers.push(a);
  }
  return numbers;
}

function number(x) {
  return x === null ? NaN : +x;
}

function bootstrapCI(array, samples, alpha, f) {
  var values = numbers(array, f),
      n = values.length,
      m = samples,
      a, i, j, mu;

  for (j=0, mu=Array(m); j<m; ++j) {
    for (a=0, i=0; i<n; ++i) {
      a += values[~~(Math.random() * n)];
    }
    mu[j] = a / n;
  }

  return [
    d3Array.quantile(mu.sort(d3Array.ascending), alpha/2),
    d3Array.quantile(mu, 1-(alpha/2))
  ];
}

function integer(min, max) {
  if (max == null) {
    max = min;
    min = 0;
  }

  var dist = {},
      a, b, d;

  dist.min = function(_) {
    return arguments.length
      ? (a = _ || 0, d = b - a, dist)
      : a;
  };

  dist.max = function(_) {
    return arguments.length
      ? (b = _ || 0, d = b - a, dist)
      : b;
  };

  dist.sample = function() {
    return a + Math.floor(d * Math.random());
  };

  dist.pdf = function(x) {
    return (x === Math.floor(x) && x >= a && x < b) ? 1 / d : 0;
  };

  dist.cdf = function(x) {
    var v = Math.floor(x);
    return v < a ? 0 : v >= b ? 1 : (v - a + 1) / d;
  };

  dist.icdf = function(p) {
    return (p >= 0 && p <= 1) ? a - 1 + Math.floor(p * d) : NaN;
  };

  return dist.min(min).max(max);
}

function randomNormal(mean, stdev) {
  var mu,
      sigma,
      next = NaN,
      dist = {};

  dist.mean = function(_) {
    return arguments.length
      ? (mu = _ || 0, next = NaN, dist)
      : mu;
  };

  dist.stdev = function(_) {
    return arguments.length
      ? (sigma = (_==null ? 1 : _), next = NaN, dist)
      : sigma;
  };

  dist.sample = function() {
    var x = 0, y = 0, rds, c;
    if (next === next) {
      return x = next, next = NaN, x;
    }
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      rds = x * x + y * y;
    } while (rds === 0 || rds > 1);
    c = Math.sqrt(-2 * Math.log(rds) / rds); // Box-Muller transform
    next = mu + y * c * sigma;
    return mu + x * c * sigma;
  };

  dist.pdf = function(x) {
    var exp = Math.exp(Math.pow(x-mu, 2) / (-2 * Math.pow(sigma, 2)));
    return (1 / (sigma * Math.sqrt(2*Math.PI))) * exp;
  };

  // Approximation from West (2009)
  // Better Approximations to Cumulative Normal Functions
  dist.cdf = function(x) {
    var cd,
        z = (x - mu) / sigma,
        Z = Math.abs(z);
    if (Z > 37) {
      cd = 0;
    } else {
      var sum, exp = Math.exp(-Z*Z/2);
      if (Z < 7.07106781186547) {
        sum = 3.52624965998911e-02 * Z + 0.700383064443688;
        sum = sum * Z + 6.37396220353165;
        sum = sum * Z + 33.912866078383;
        sum = sum * Z + 112.079291497871;
        sum = sum * Z + 221.213596169931;
        sum = sum * Z + 220.206867912376;
        cd = exp * sum;
        sum = 8.83883476483184e-02 * Z + 1.75566716318264;
        sum = sum * Z + 16.064177579207;
        sum = sum * Z + 86.7807322029461;
        sum = sum * Z + 296.564248779674;
        sum = sum * Z + 637.333633378831;
        sum = sum * Z + 793.826512519948;
        sum = sum * Z + 440.413735824752;
        cd = cd / sum;
      } else {
        sum = Z + 0.65;
        sum = Z + 4 / sum;
        sum = Z + 3 / sum;
        sum = Z + 2 / sum;
        sum = Z + 1 / sum;
        cd = exp / sum / 2.506628274631;
      }
    }
    return z > 0 ? 1 - cd : cd;
  };

  // Approximation of Probit function using inverse error function.
  dist.icdf = function(p) {
    if (p <= 0 || p >= 1) return NaN;
    var x = 2*p - 1,
        v = (8 * (Math.PI - 3)) / (3 * Math.PI * (4-Math.PI)),
        a = (2 / (Math.PI*v)) + (Math.log(1 - Math.pow(x,2)) / 2),
        b = Math.log(1 - (x*x)) / v,
        s = (x > 0 ? 1 : -1) * Math.sqrt(Math.sqrt((a*a) - b) - a);
    return mu + sigma * Math.SQRT2 * s;
  };

  return dist.mean(mean).stdev(stdev);
}

function quartiles(array, f) {
  var values = numbers(array, f);

  return [
    d3Array.quantile(values.sort(d3Array.ascending), 0.25),
    d3Array.quantile(values, 0.50),
    d3Array.quantile(values, 0.75)
  ];
}

// TODO: support for additional kernels?
function randomKDE(support, bandwidth) {
  var kernel = randomNormal(),
      dist = {},
      n = 0;

  dist.data = function(_) {
    return arguments.length
      ? (support = _, (n = _?_.length:0), dist.bandwidth(bandwidth))
      : support;
  };

  dist.bandwidth = function(_) {
    if (!arguments.length) return bandwidth;
    bandwidth = _;
    if (!bandwidth && support) bandwidth = estimateBandwidth(support);
    return dist;
  };

  dist.sample = function() {
    return support[~~(Math.random() * n)] + bandwidth * kernel.sample();
  };

  dist.pdf = function(x) {
    for (var y=0, i=0; i<n; ++i) {
      y += kernel.pdf((x - support[i]) / bandwidth);
    }
    return y / bandwidth / n;
  };

  dist.cdf = function(x) {
    for (var y=0, i=0; i<n; ++i) {
      y += kernel.cdf((x - support[i]) / bandwidth);
    }
    return y / n;
  };

  dist.icdf = function() {
    throw Error('KDE icdf not supported.');
  };

  return dist.data(support);
}

// Scott, D. W. (1992) Multivariate Density Estimation:
// Theory, Practice, and Visualization. Wiley.
function estimateBandwidth(array) {
  var n = array.length,
      q = quartiles(array),
      h = (q[2] - q[0]) / 1.34;
  return 1.06 * Math.min(Math.sqrt(d3Array.variance(array)), h) * Math.pow(n, -0.2);
}

function randomMixture(dists, weights) {
  var dist = {}, m = 0, w;

  function normalize(x) {
    var w = [], sum = 0, i;
    for (i=0; i<m; ++i) { sum += (w[i] = (x[i]==null ? 1 : +x[i])); }
    for (i=0; i<m; ++i) { w[i] /= sum; }
    return w;
  }

  dist.weights = function(_) {
    if (arguments.length) {
      w = normalize(weights = (_ || []));
      return dist;
    }
    return weights;
  };

  dist.distributions = function(_) {
    if (arguments.length) {
      if (_) {
        m = _.length;
        dists = _;
      } else {
        m = 0;
        dists = [];
      }
      return dist.weights(weights);
    }
    return dists;
  };

  dist.sample = function() {
    var r = Math.random(),
        d = dists[m-1],
        v = w[0],
        i = 0;

    // first select distribution
    for (; i<m-1; v += w[++i]) {
      if (r < v) { d = dists[i]; break; }
    }
    // then sample from it
    return d.sample();
  };

  dist.pdf = function(x) {
    for (var p=0, i=0; i<m; ++i) {
      p += w[i] * dists[i].pdf(x);
    }
    return p;
  };

  dist.cdf = function(x) {
    for (var p=0, i=0; i<m; ++i) {
      p += w[i] * dists[i].cdf(x);
    }
    return p;
  };

  dist.icdf = function() {
    throw Error('Mixture icdf not supported.');
  };

  return dist.distributions(dists).weights(weights);
}

function randomUniform(min, max) {
  if (max == null) {
    max = (min == null ? 1 : min);
    min = 0;
  }

  var dist = {},
      a, b, d;

  dist.min = function(_) {
    return arguments.length
      ? (a = _ || 0, d = b - a, dist)
      : a;
  };

  dist.max = function(_) {
    return arguments.length
      ? (b = _ || 0, d = b - a, dist)
      : b;
  };

  dist.sample = function() {
    return a + d * Math.random();
  };

  dist.pdf = function(x) {
    return (x >= a && x <= b) ? 1 / d : 0;
  };

  dist.cdf = function(x) {
    return x < a ? 0 : x > b ? 1 : (x - a) / d;
  };

  dist.icdf = function(p) {
    return (p >= 0 && p <= 1) ? a + p * d : NaN;
  };

  return dist.min(min).max(max);
}

function accessor(fn, fields, name) {
  return (
    fn.fields = fields || [],
    fn.fname = name,
    fn
  );
}

function accessorName(fn) {
  return fn == null ? null : fn.fname;
}

function accessorFields(fn) {
  return fn == null ? null : fn.fields;
}

function error(message) {
  throw Error(message);
}

function splitAccessPath(p) {
  var path = [],
      q = null,
      b = 0,
      n = p.length,
      s = '',
      i, j, c;

  p = p + '';

  function push() {
    path.push(s + p.substring(i, j));
    s = '';
    i = j + 1;
  }

  for (i=j=0; j<n; ++j) {
    c = p[j];
    if (c === '\\') s += p.substring(i, j), i = ++j;
    else if (c === q) push(), q = null, b = -1;
    else if (q) continue;
    else if (i === b && c === '"') i = j + 1, q = c;
    else if (i === b && c === "'") i = j + 1, q = c;
    else if (c === '.' && !b) (j > i) ? push() : (i = j + 1);
    else if (c === '[') {
      if (j > i) push();
      b = i = j + 1;
    }
    else if (c === ']') {
      if (!b) error('Access path missing open bracket: ' + p);
      if (b > 0) push();
      b = 0;
      i = j + 1;
    }
  }

  if (b) error('Access path missing closing bracket: ' + p);
  if (q) error('Access path missing closing quote: ' + p);
  if (j > i) ++j, push();
  return path;
}

var isArray = Array.isArray;

function isObject(_) {
  return _ === Object(_);
}

function isString(_) {
  return typeof _ === 'string';
}

function $$2(x) {
  return isArray(x) ? '[' + x.map($$2) + ']'
    : isObject(x) || isString(x) ?
      // Output valid JSON and JS source strings.
      // See http://timelessrepo.com/json-isnt-a-javascript-subset
      JSON.stringify(x).replace('\u2028','\\u2028').replace('\u2029', '\\u2029')
    : x;
}

function field(field, name) {
  var path = splitAccessPath(field),
      code = 'return _[' + path.map($$2).join('][') + '];';

  return accessor(
    Function('_', code),
    [(field = path.length===1 ? path[0] : field)],
    name || field
  );
}

var empty = [];

var id = field('id');

var identity = accessor(function(_) { return _; }, empty, 'identity');

var zero = accessor(function() { return 0; }, empty, 'zero');

var one = accessor(function() { return 1; }, empty, 'one');

var truthy = accessor(function() { return true; }, empty, 'true');

var falsy = accessor(function() { return false; }, empty, 'false');

function log(method, level, input) {
  var args = [level].concat([].slice.call(input));
  console[method].apply(console, args); // eslint-disable-line no-console
}

var None  = 0;
var Warn  = 1;
var Info  = 2;
var Debug = 3;

function logger(_) {
  var level = _ || None;
  return {
    level: function(_) {
      return arguments.length ? (level = +_, this) : level;
    },
    warn: function() {
      if (level >= Warn) log('warn', 'WARN', arguments);
      return this;
    },
    info: function() {
      if (level >= Info) log('log', 'INFO', arguments);
      return this;
    },
    debug: function() {
      if (level >= Debug) log('log', 'DEBUG', arguments);
      return this;
    }
  }
}

function array(_) {
  return _ != null ? (isArray(_) ? _ : [_]) : [];
}

function compare(fields, orders) {
  var idx = [],
      cmp = (fields = array(fields)).map(function(f, i) {
        return f == null ? null
          : (idx.push(i), splitAccessPath(f).map($$2).join(']['));
      }),
      n = idx.length - 1,
      ord = array(orders),
      code = 'var u,v;return ',
      i, j, f, u, v, d, lt, gt;

  if (n < 0) return null;

  for (j=0; j<=n; ++j) {
    i = idx[j];
    f = cmp[i];
    u = '(u=a['+f+'])';
    v = '(v=b['+f+'])';
    d = '((v=v instanceof Date?+v:v),(u=u instanceof Date?+u:u))';
    lt = ord[i] !== 'descending' ? (gt=1, -1) : (gt=-1, 1);
    code += '(' + u+'<'+v+'||u==null)&&v!=null?' + lt
      + ':(u>v||v==null)&&u!=null?' + gt
      + ':'+d+'!==u&&v===v?' + lt
      + ':v!==v&&u===u?' + gt
      + (i < n ? ':' : ':0');
  }

  return accessor(
    Function('a', 'b', code + ';'),
    fields.filter(function(_) { return _ != null; })
  );
}

function isFunction(_) {
  return typeof _ === 'function';
}

function constant(_) {
  return isFunction(_) ? _ : function() { return _; };
}

function extend(_) {
  for (var x, k, i=1, len=arguments.length; i<len; ++i) {
    x = arguments[i];
    for (k in x) { _[k] = x[k]; }
  }
  return _;
}

function extentIndex(array, f) {
  var i = -1,
      n = array.length,
      a, b, c, u, v;

  if (f == null) {
    while (++i < n) if ((b = array[i]) != null && b >= b) { a = c = b; break; }
    u = v = i;
    while (++i < n) if ((b = array[i]) != null) {
      if (a > b) a = b, u = i;
      if (c < b) c = b, v = i;
    }
  } else {
    while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = c = b; break; }
    u = v = i;
    while (++i < n) if ((b = f(array[i], i, array)) != null) {
      if (a > b) a = b, u = i;
      if (c < b) c = b, v = i;
    }
  }

  return [u, v];
}

var NULL = {};

function fastmap(input) {
  var obj = {},
      map,
      test;

  function has(key) {
    return obj.hasOwnProperty(key) && obj[key] !== NULL;
  }

  map = {
    size: 0,
    empty: 0,
    object: obj,
    has: has,
    get: function(key) {
      return has(key) ? obj[key] : undefined;
    },
    set: function(key, value) {
      if (!has(key)) {
        ++map.size;
        if (obj[key] === NULL) --map.empty;
      }
      obj[key] = value;
      return this;
    },
    delete: function(key) {
      if (has(key)) {
        --map.size;
        ++map.empty;
        obj[key] = NULL;
      }
      return this;
    },
    clear: function() {
      map.size = map.empty = 0;
      map.object = obj = {};
    },
    test: function(_) {
      return arguments.length ? (test = _, map) : test;
    },
    clean: function() {
      var next = {},
          size = 0,
          key, value;
      for (key in obj) {
        value = obj[key];
        if (value !== NULL && (!test || !test(value))) {
          next[key] = value;
          ++size;
        }
      }
      map.size = size;
      map.empty = 0;
      map.object = (obj = next);
    }
  };

  if (input) Object.keys(input).forEach(function(key) {
    map.set(key, input[key]);
  });

  return map;
}

function inherits(child, parent) {
  var proto = (child.prototype = Object.create(parent.prototype));
  proto.constructor = child;
  return proto;
}

function isBoolean(_) {
  return typeof _ === 'boolean';
}

function isDate(_) {
  return Object.prototype.toString.call(_) === '[object Date]';
}

function isNumber(_) {
  return typeof _ === 'number';
}

function isRegExp(_) {
  return Object.prototype.toString.call(_) === '[object RegExp]';
}

function key(fields) {
  fields = fields ? array(fields) : fields;
  var fn = !(fields && fields.length)
    ? function() { return ''; }
    : Function('_', 'return \'\'+' +
        fields.map(function(f) {
          return '_[' + splitAccessPath(f).map($$2).join('][') + ']';
        }).join('+\'|\'+') + ';');
  return accessor(fn, fields, 'key');
}

function merge(compare, array0, array1, output) {
  var n0 = array0.length,
      n1 = array1.length;

  if (!n1) return array0;
  if (!n0) return array1;

  var merged = output || new array0.constructor(n0 + n1),
      i0 = 0, i1 = 0, i = 0;

  for (; i0<n0 && i1<n1; ++i) {
    merged[i] = compare(array0[i0], array1[i1]) > 0
       ? array1[i1++]
       : array0[i0++];
  }

  for (; i0<n0; ++i0, ++i) {
    merged[i] = array0[i0];
  }

  for (; i1<n1; ++i1, ++i) {
    merged[i] = array1[i1];
  }

  return merged;
}

function repeat(str, reps) {
  var s = '';
  while (--reps >= 0) s += str;
  return s;
}

function pad(str, length, padchar, align) {
  var c = padchar || ' ',
      s = str + '',
      n = length - s.length;

  return n <= 0 ? s
    : align === 'left' ? repeat(c, n) + s
    : align === 'center' ? repeat(c, ~~(n/2)) + s + repeat(c, Math.ceil(n/2))
    : s + repeat(c, n);
}

function peek(array) {
  return array[array.length - 1];
}

function toBoolean(_) {
  return _ == null || _ === '' ? null : !_ || _ === 'false' ? false : !!_;
}

function toDate(_, parser) {
  return _ == null || _ === '' ? null : (parser ? parser(_) : Date.parse(_));
}

function toNumber(_) {
  return _ == null || _ === '' ? null : +_;
}

function toString(_) {
  return _ == null || _ === '' ? null : _ + '';
}

function toSet(_) {
  for (var s={}, i=0, n=_.length; i<n; ++i) s[_[i]] = 1;
  return s;
}

function truncate(str, length, align, ellipsis) {
  var e = ellipsis != null ? ellipsis : '\u2026',
      s = str + '',
      n = s.length,
      l = Math.max(0, length - e.length);

  return n <= length ? s
    : align === 'left' ? e + s.slice(n - l)
    : align === 'center' ? s.slice(0, Math.ceil(l/2)) + e + s.slice(n - ~~(l/2))
    : s.slice(0, l) + e;
}

function visitArray(array, filter, visitor) {
  if (array) {
    var i = 0, n = array.length, t;
    if (filter) {
      for (; i<n; ++i) {
        if (t = filter(array[i])) visitor(t, i, array);
      }
    } else {
      array.forEach(visitor);
    }
  }
}

// Matches absolute URLs with optional protocol
//   https://...    file://...    //...
var protocol_re = /^([A-Za-z]+:)?\/\//;

// Special treatment in node.js for the file: protocol
var fileProtocol = 'file://';

// Request options to check for d3-request
var requestOptions = [
  'mimeType',
  'responseType',
  'user',
  'password'
];

/**
 * Creates a new loader instance that provides methods for requesting files
 * from either the network or disk, and for sanitizing request URIs.
 * @param {object} [options] - Optional default loading options to use.
 * @return {object} - A new loader instance.
 */
function loader(options) {
  return {
    options: options || {},
    sanitize: sanitize,
    load: load,
    file: file,
    http: http
  };
}

function marshall(loader, options) {
  return extend({}, loader.options, options);
}

/**
 * Load an external resource, typically either from the web or from the local
 * filesystem. This function uses {@link sanitize} to first sanitize the uri,
 * then calls either {@link http} (for web requests) or {@link file} (for
 * filesystem loading).
 * @param {string} uri - The resource indicator (e.g., URL or filename).
 * @param {object} [options] - Optional loading options. These options will
 *   override any existing default options.
 * @return {Promise} - A promise that resolves to the loaded content.
 */
function load(uri, options) {
  var loader = this;
  return loader.sanitize(uri, options)
    .then(function(opt) {
      var url = opt.href;
      return (startsWith(url, fileProtocol))
        ? loader.file(url.slice(fileProtocol.length))
        : loader.http(url, options);
    });
}

/**
 * URI sanitizer function.
 * @param {string} uri - The uri (url or filename) to sanity check.
 * @param {object} options - An options hash.
 * @return {Promise} - A promise that resolves to an object containing
 *  sanitized uri data, or rejects it the input uri is deemed invalid.
 *  The properties of the resolved object are assumed to be
 *  valid attributes for an HTML 'a' tag. The sanitized uri *must* be
 *  provided by the 'href' property of the returned object.
 */
function sanitize(uri, options) {
  options = marshall(this, options);
  return new Promise(function(accept, reject) {
    var isFile, hasProtocol, loadFile, base;

    if (uri == null || typeof uri !== 'string') {
      reject('Sanitize failure, invalid URI: ' + $$2(uri));
      return;
    }

    hasProtocol = protocol_re.test(uri);

    // if relative url (no protocol/host), prepend baseURL
    if ((base = options.baseURL) && !hasProtocol) {
      // Ensure that there is a slash between the baseURL (e.g. hostname) and url
      if (!startsWith(uri, '/') && base[base.length-1] !== '/') {
        uri = '/' + uri;
      }
      uri = base + uri;
    }

    // should we load from file system?
    loadFile = (isFile = startsWith(uri, fileProtocol))
      || options.mode === 'file'
      || options.mode !== 'http' && !hasProtocol && fs();

    if (loadFile) {
      // prepend file protocol, if not already present
      uri = (isFile ? '' : fileProtocol) + uri;
    } else if (startsWith(uri, '//')) {
      // if relative protocol (starts with '//'), prepend default protocol
      uri = (options.defaultProtocol || 'http') + ':' + uri;
    }

    accept({href: uri});
  });
}

/**
 * HTTP request loader.
 * @param {string} url - The url to request.
 * @param {object} options - An options hash.
 * @return {Promise} - A promise that resolves to the file contents.
 */
function http(url, options) {
  options = marshall(this, options);
  return new Promise(function(accept, reject) {
    var req = d3Request.request(url),
        name;

    for (name in options.headers) {
      req.header(name, options.headers[name]);
    }

    requestOptions.forEach(function(name) {
      if (options[name]) req[name](options[name]);
    });

    req.on('error', function(error) {
        reject(error || 'Error loading URL: ' + url);
      })
      .on('load', function(result) {
        var text = result && result.responseText;
        (!result || result.status === 0)
          ? reject(text || 'Error')
          : accept(text);
      })
      .get();
  });
}

/**
 * File system loader.
 * @param {string} filename - The file system path to load.
 * @return {Promise} - A promise that resolves to the file contents.
 */
function file(filename) {
  return new Promise(function(accept, reject) {
    var f = fs();
    f ? f.readFile(filename, function(error, data) {
          if (error) reject(error);
          else accept(data);
        })
      : reject('No file system access for ' + filename);
  });
}

function fs() {
  var fs = typeof require === 'function' && require('fs');
  return fs && isFunction(fs.readFile) ? fs : null;
}

function startsWith(string, query) {
  return string == null ? false : string.lastIndexOf(query, 0) === 0;
}

var typeParsers = {
  boolean: toBoolean,
  integer: toNumber,
  number:  toNumber,
  date:    toDate,
  string:  toString
};

var typeTests = [
  isBoolean$1,
  isInteger,
  isNumber$1,
  isDate$1
];

var typeList = [
  'boolean',
  'integer',
  'number',
  'date'
];

function inferType(values, field) {
  var tests = typeTests.slice(),
      value, i, n, j;

  for (i=0, n=values.length; i<n; ++i) {
    value = field ? values[i][field] : values[i];
    for (j=0; j<tests.length; ++j) {
      if (isValid(value) && !tests[j](value)) {
        tests.splice(j, 1); --j;
      }
    }
    if (tests.length === 0) return 'string';
  }
  return typeList[typeTests.indexOf(tests[0])];
}

function inferTypes(data, fields) {
  return fields.reduce(function(types, field) {
    return types[field] = inferType(data, field), types;
  }, {});
}

// -- Type Checks ----

function isValid(_) {
  return _ != null && _ === _;
}

function isBoolean$1(_) {
  return _ === 'true' || _ === 'false' || _ === true || _ === false;
}

function isDate$1(_) {
  return !isNaN(Date.parse(_));
}

function isNumber$1(_) {
  return !isNaN(+_) && !(_ instanceof Date);
}

function isInteger(_) {
  return isNumber$1(_) && (_=+_) === ~~_;
}

function delimitedFormat(delimiter) {
  return function(data, format) {
    var delim = {delimiter: delimiter};
    return dsv(data, format ? extend(format, delim) : delim);
  };
}

function dsv(data, format) {
  if (format.header) {
    data = format.header
      .map($$2)
      .join(format.delimiter) + '\n' + data;
  }
  return d3Dsv.dsvFormat(format.delimiter).parse(data+'');
}

function isBuffer(_) {
  return (typeof Buffer === 'function' && isFunction(Buffer.isBuffer))
    ? Buffer.isBuffer(_) : false;
}

function json(data, format) {
  var prop = (format && format.property) ? field(format.property) : identity;
  return isObject(data) && !isBuffer(data)
    ? parseJSON(prop(data))
    : prop(JSON.parse(data));
}

function parseJSON(data, format) {
  return (format && format.copy)
    ? JSON.parse(JSON.stringify(data))
    : data;
}

function topojson$1(data, format) {
  var object, property;
  data = json(data, format);

  if (format && (property = format.feature)) {
    return (object = data.objects[property])
      ? topojson.feature(data, object).features
      : error('Invalid TopoJSON object: ' + property);
  }

  else if (format && (property = format.mesh)) {
    return (object = data.objects[property])
      ? [topojson.mesh(data, object)]
      : error('Invalid TopoJSON object: ' + property);
  }

  error('Missing TopoJSON feature or mesh parameter.');
}

var formats = {
  dsv: dsv,
  csv: delimitedFormat(','),
  tsv: delimitedFormat('\t'),
  json: json,
  topojson: topojson$1
};

function formats$1(name, format) {
  return arguments.length > 1 ? (formats[name] = format, this)
    : formats.hasOwnProperty(name) ? formats[name] : null;
}

function read(data, schema, dateParse) {
  schema = schema || {};

  var reader = formats$1(schema.type || 'json');
  if (!reader) error('Unknown data format type: ' + schema.type);

  data = reader(data, schema);
  if (schema.parse) parse(data, schema.parse, dateParse);

  if (data.hasOwnProperty('columns')) delete data.columns;
  return data;
}

function parse(data, types, dateParse) {
  dateParse = dateParse || d3TimeFormat.timeParse;

  var fields = data.columns || Object.keys(data[0]),
      parsers, datum, field, i, j, n, m;

  if (types === 'auto') types = inferTypes(data, fields);

  fields = Object.keys(types);
  parsers = fields.map(function(field) {
    var type = types[field],
        parts, pattern;

    if (type && (type.indexOf('date:') === 0 || type.indexOf('utc:') === 0)) {
      parts = type.split(/:(.+)?/, 2);  // split on first :
      pattern = parts[1];

      if ((pattern[0] === '\'' && pattern[pattern.length-1] === '\'') ||
          (pattern[0] === '"'  && pattern[pattern.length-1] === '"')) {
        pattern = pattern.slice(1, -1);
      }

      return parts[0] === 'utc' ? d3TimeFormat.utcParse(pattern) : dateParse(pattern);
    }

    if (!typeParsers[type]) {
      throw Error('Illegal format pattern: ' + field + ':' + type);
    }

    return typeParsers[type];
  });

  for (i=0, n=data.length, m=fields.length; i<n; ++i) {
    datum = data[i];
    for (j=0; j<m; ++j) {
      field = fields[j];
      datum[field] = parsers[j](datum[field]);
    }
  }
}

function Bounds(b) {
  this.clear();
  if (b) this.union(b);
}

var prototype = Bounds.prototype;

prototype.clone = function() {
  return new Bounds(this);
};

prototype.clear = function() {
  this.x1 = +Number.MAX_VALUE;
  this.y1 = +Number.MAX_VALUE;
  this.x2 = -Number.MAX_VALUE;
  this.y2 = -Number.MAX_VALUE;
  return this;
};

prototype.set = function(x1, y1, x2, y2) {
  if (x2 < x1) {
    this.x2 = x1;
    this.x1 = x2;
  } else {
    this.x1 = x1;
    this.x2 = x2;
  }
  if (y2 < y1) {
    this.y2 = y1;
    this.y1 = y2;
  } else {
    this.y1 = y1;
    this.y2 = y2;
  }
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

prototype.intersect = function(b) {
  if (b.x1 > this.x1) this.x1 = b.x1;
  if (b.y1 > this.y1) this.y1 = b.y1;
  if (b.x2 < this.x2) this.x2 = b.x2;
  if (b.y2 < this.y2) this.y2 = b.y2;
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

prototype.alignsWith = function(b) {
  return b && (
    this.x1 == b.x1 ||
    this.x2 == b.x2 ||
    this.y1 == b.y1 ||
    this.y2 == b.y2
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

var gradient_id = 0;

function Gradient(p0, p1) {
  var stops = [], gradient;
  return gradient = {
    id: 'gradient_' + (gradient_id++),
    x1: p0 ? p0[0] : 0,
    y1: p0 ? p0[1] : 0,
    x2: p1 ? p1[0] : 1,
    y2: p1 ? p1[1] : 0,
    stops: stops,
    stop: function(offset, color) {
      stops.push({offset: offset, color: color});
      return gradient;
    }
  };
}

function Item(mark) {
  this.mark = mark;
  this.bounds = (this.bounds || new Bounds());
  this.bounds_prev = (this.bounds_prev || new Bounds());
}

function GroupItem(mark) {
  Item.call(this, mark);
  this.items = (this.items || []);
}

inherits(GroupItem, Item);

// create a new DOM element
function domCreate(doc, tag, ns) {
  if (!doc && typeof document !== 'undefined' && document.createElement) {
    doc = document;
  }
  return doc
    ? (ns ? doc.createElementNS(ns, tag) : doc.createElement(tag))
    : null;
}

// find first child element with matching tag
function domFind(el, tag) {
  tag = tag.toLowerCase();
  var nodes = el.childNodes, i = 0, n = nodes.length;
  for (; i<n; ++i) if (nodes[i].tagName.toLowerCase() === tag) {
    return nodes[i];
  }
}

// retrieve child element at given index
// create & insert if doesn't exist or if tags do not match
function domChild(el, index, tag, ns) {
  var a = el.childNodes[index], b;
  if (!a || a.tagName.toLowerCase() !== tag.toLowerCase()) {
    b = a || null;
    a = domCreate(el.ownerDocument, tag, ns);
    el.insertBefore(a, b);
  }
  return a;
}

// remove all child elements at or above the given index
function domClear(el, index) {
  var nodes = el.childNodes,
      curr = nodes.length;
  while (curr > index) el.removeChild(nodes[--curr]);
  return el;
}

// generate css class name for mark
function cssClass(mark) {
  return 'mark-' + mark.marktype
    + (mark.role ? ' role-' + mark.role : '')
    + (mark.name ? ' ' + mark.name : '');
}

var Canvas;

try { Canvas = require('canvas'); } catch (e) { Canvas = null; }

function Canvas$1(w, h) {
  var canvas = domCreate(null, 'canvas');
  if (canvas) {
    canvas.width = w;
    canvas.height = h;
  } else if (Canvas) {
    canvas = new Canvas(w, h);
  }
  return canvas;
}

var Image$1 = typeof Image !== 'undefined' ? Image
  : (Canvas && Canvas.Image || null);

function ResourceLoader(customLoader) {
  this._pending = 0;
  this._loader = customLoader || loader();
}

var prototype$1 = ResourceLoader.prototype;

prototype$1.pending = function() {
  return this._pending;
};

function increment(loader) {
  loader._pending += 1;
}

function decrement(loader) {
  loader._pending -= 1;
}

prototype$1.sanitizeURL = function(uri) {
  var loader = this;
  increment(loader);

  return loader._loader.sanitize(uri, {context:'href'})
    .then(function(opt) {
      decrement(loader);
      return opt;
    })
    .catch(function() {
      decrement(loader);
      return null;
    });
};

prototype$1.loadImage = function(uri) {
  var loader = this;
  increment(loader);

  return loader._loader.sanitize(uri, {context:'image'})
    .then(function(opt) {
      var url = opt.href;
      if (!url || !Image$1) throw 'Image unsupported.';

      var image = new Image$1();

      image.onload = function() {
        decrement(loader);
        image.loaded = true;
      };

      image.onerror = function() {
        decrement(loader);
        image.loaded = false;
      }

      image.src = url;
      return image;
    })
    .catch(function() {
      decrement(loader);
      return {loaded: false, width: 0, height: 0};
    });
};

prototype$1.ready = function() {
  var loader = this;
  return new Promise(function(accept) {
    function poll(value) {
      if (!loader.pending()) accept(value);
      else setTimeout(function() { poll(true); }, 10);
    }
    poll(false);
  });
};

var lookup = {
  'basis': {
    curve: d3Shape.curveBasis
  },
  'basis-closed': {
    curve: d3Shape.curveBasisClosed
  },
  'basis-open': {
    curve: d3Shape.curveBasisOpen
  },
  'bundle': {
    curve: d3Shape.curveBundle,
    tension: 'beta',
    value: 0.85
  },
  'cardinal': {
    curve: d3Shape.curveCardinal,
    tension: 'tension',
    value: 0
  },
  'cardinal-open': {
    curve: d3Shape.curveCardinalOpen,
    tension: 'tension',
    value: 0
  },
  'cardinal-closed': {
    curve: d3Shape.curveCardinalClosed,
    tension: 'tension',
    value: 0
  },
  'catmull-rom': {
    curve: d3Shape.curveCatmullRom,
    tension: 'alpha',
    value: 0.5
  },
  'catmull-rom-closed': {
    curve: d3Shape.curveCatmullRomClosed,
    tension: 'alpha',
    value: 0.5
  },
  'catmull-rom-open': {
    curve: d3Shape.curveCatmullRomOpen,
    tension: 'alpha',
    value: 0.5
  },
  'linear': {
    curve: d3Shape.curveLinear
  },
  'linear-closed': {
    curve: d3Shape.curveLinearClosed
  },
  'monotone': {
    horizontal: d3Shape.curveMonotoneY,
    vertical:   d3Shape.curveMonotoneX
  },
  'natural': {
    curve: d3Shape.curveNatural
  },
  'step': {
    curve: d3Shape.curveStep
  },
  'step-after': {
    curve: d3Shape.curveStepAfter
  },
  'step-before': {
    curve: d3Shape.curveStepBefore
  }
};

function curves(type, orientation, tension) {
  var entry = lookup.hasOwnProperty(type) && lookup[type],
      curve = null;

  if (entry) {
    curve = entry.curve || entry[orientation || 'vertical'];
    if (entry.tension && tension != null) {
      curve = curve[entry.tension](tension);
    }
  }

  return curve;
}

// Path parsing and rendering code adapted from fabric.js -- Thanks!
var cmdlen = { m:2, l:2, h:1, v:1, c:6, s:4, q:4, t:2, a:7 };
var regexp = [/([MLHVCSQTAZmlhvcsqtaz])/g, /###/, /(\d)([-+])/g, /\s|,|###/];
function pathParse(pathstr) {
  var result = [],
      path,
      curr,
      chunks,
      parsed, param,
      cmd, len, i, j, n, m;

  // First, break path into command sequence
  path = pathstr
    .slice()
    .replace(regexp[0], '###$1')
    .split(regexp[1])
    .slice(1);

  // Next, parse each command in turn
  for (i=0, n=path.length; i<n; ++i) {
    curr = path[i];
    chunks = curr
      .slice(1)
      .trim()
      .replace(regexp[2],'$1###$2')
      .split(regexp[3]);
    cmd = curr.charAt(0);

    parsed = [cmd];
    for (j=0, m=chunks.length; j<m; ++j) {
      if ((param = +chunks[j]) === param) { // not NaN
        parsed.push(param);
      }
    }

    len = cmdlen[cmd.toLowerCase()];
    if (parsed.length-1 > len) {
      for (j=1, m=parsed.length; j<m; j+=len) {
        result.push([cmd].concat(parsed.slice(j, j+len)));
      }
    }
    else {
      result.push(parsed);
    }
  }

  return result;
}

var segmentCache = {};
var bezierCache = {};

var join = [].join;

// Copied from Inkscape svgtopdf, thanks!
function segments(x, y, rx, ry, large, sweep, rotateX, ox, oy) {
  var key = join.call(arguments);
  if (segmentCache[key]) {
    return segmentCache[key];
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
  if (th_arc < 0 && sweep === 1){
    th_arc += 2 * Math.PI;
  } else if (th_arc > 0 && sweep === 0) {
    th_arc -= 2 * Math.PI;
  }

  var segs = Math.ceil(Math.abs(th_arc / (Math.PI * 0.5 + 0.001)));
  var result = [];
  for (var i=0; i<segs; ++i) {
    var th2 = th0 + i * th_arc / segs;
    var th3 = th0 + (i+1) * th_arc / segs;
    result[i] = [xc, yc, th2, th3, rx, ry, sin_th, cos_th];
  }

  return (segmentCache[key] = result);
}

function bezier(params) {
  var key = join.call(params);
  if (bezierCache[key]) {
    return bezierCache[key];
  }

  var cx = params[0],
      cy = params[1],
      th0 = params[2],
      th1 = params[3],
      rx = params[4],
      ry = params[5],
      sin_th = params[6],
      cos_th = params[7];

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

  return (bezierCache[key] = [
    a00 * x1 + a01 * y1,  a10 * x1 + a11 * y1,
    a00 * x2 + a01 * y2,  a10 * x2 + a11 * y2,
    a00 * x3 + a01 * y3,  a10 * x3 + a11 * y3
  ]);
}

var temp = ['l', 0, 0, 0, 0, 0, 0, 0];

function scale(current, s) {
  var c = (temp[0] = current[0]);
  if (c === 'a' || c === 'A') {
    temp[1] = s * current[1];
    temp[2] = s * current[2];
    temp[6] = s * current[6];
    temp[7] = s * current[7];
  } else {
    for (var i=1, n=current.length; i<n; ++i) {
      temp[i] = s * current[i];
    }
  }
  return temp;
}

function pathRender(context, path, l, t, s) {
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

  if (l == null) l = 0;
  if (t == null) t = 0;
  if (s == null) s = 1;

  if (context.beginPath) context.beginPath();

  for (var i=0, len=path.length; i<len; ++i) {
    current = path[i];
    if (s !== 1) current = scale(current, s);

    switch (current[0]) { // first letter

      case 'l': // lineto, relative
        x += current[1];
        y += current[2];
        context.lineTo(x + l, y + t);
        break;

      case 'L': // lineto, absolute
        x = current[1];
        y = current[2];
        context.lineTo(x + l, y + t);
        break;

      case 'h': // horizontal lineto, relative
        x += current[1];
        context.lineTo(x + l, y + t);
        break;

      case 'H': // horizontal lineto, absolute
        x = current[1];
        context.lineTo(x + l, y + t);
        break;

      case 'v': // vertical lineto, relative
        y += current[1];
        context.lineTo(x + l, y + t);
        break;

      case 'V': // verical lineto, absolute
        y = current[1];
        context.lineTo(x + l, y + t);
        break;

      case 'm': // moveTo, relative
        x += current[1];
        y += current[2];
        context.moveTo(x + l, y + t);
        break;

      case 'M': // moveTo, absolute
        x = current[1];
        y = current[2];
        context.moveTo(x + l, y + t);
        break;

      case 'c': // bezierCurveTo, relative
        tempX = x + current[5];
        tempY = y + current[6];
        controlX = x + current[3];
        controlY = y + current[4];
        context.bezierCurveTo(
          x + current[1] + l, // x1
          y + current[2] + t, // y1
          controlX + l, // x2
          controlY + t, // y2
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        break;

      case 'C': // bezierCurveTo, absolute
        x = current[5];
        y = current[6];
        controlX = current[3];
        controlY = current[4];
        context.bezierCurveTo(
          current[1] + l,
          current[2] + t,
          controlX + l,
          controlY + t,
          x + l,
          y + t
        );
        break;

      case 's': // shorthand cubic bezierCurveTo, relative
        // transform to absolute x,y
        tempX = x + current[3];
        tempY = y + current[4];
        // calculate reflection of previous control points
        controlX = 2 * x - controlX;
        controlY = 2 * y - controlY;
        context.bezierCurveTo(
          controlX + l,
          controlY + t,
          x + current[1] + l,
          y + current[2] + t,
          tempX + l,
          tempY + t
        );

        // set control point to 2nd one of this command
        // the first control point is assumed to be the reflection of
        // the second control point on the previous command relative
        // to the current point.
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
        context.bezierCurveTo(
          controlX + l,
          controlY + t,
          current[1] + l,
          current[2] + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        // set control point to 2nd one of this command
        // the first control point is assumed to be the reflection of
        // the second control point on the previous command relative
        // to the current point.
        controlX = current[1];
        controlY = current[2];

        break;

      case 'q': // quadraticCurveTo, relative
        // transform to absolute x,y
        tempX = x + current[3];
        tempY = y + current[4];

        controlX = x + current[1];
        controlY = y + current[2];

        context.quadraticCurveTo(
          controlX + l,
          controlY + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        break;

      case 'Q': // quadraticCurveTo, absolute
        tempX = current[3];
        tempY = current[4];

        context.quadraticCurveTo(
          current[1] + l,
          current[2] + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        controlX = current[1];
        controlY = current[2];
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

        context.quadraticCurveTo(
          controlX + l,
          controlY + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        controlX = x + current[1];
        controlY = y + current[2];
        break;

      case 'T':
        tempX = current[1];
        tempY = current[2];

        // calculate reflection of previous control points
        controlX = 2 * x - controlX;
        controlY = 2 * y - controlY;
        context.quadraticCurveTo(
          controlX + l,
          controlY + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        break;

      case 'a':
        drawArc(context, x + l, y + t, [
          current[1],
          current[2],
          current[3],
          current[4],
          current[5],
          current[6] + x + l,
          current[7] + y + t
        ]);
        x += current[6];
        y += current[7];
        break;

      case 'A':
        drawArc(context, x + l, y + t, [
          current[1],
          current[2],
          current[3],
          current[4],
          current[5],
          current[6] + l,
          current[7] + t
        ]);
        x = current[6];
        y = current[7];
        break;

      case 'z':
      case 'Z':
        context.closePath();
        break;
    }
    previous = current;
  }
}

function drawArc(context, x, y, coords) {
  var seg = segments(
    coords[5], // end x
    coords[6], // end y
    coords[0], // radius x
    coords[1], // radius y
    coords[3], // large flag
    coords[4], // sweep flag
    coords[2], // rotation
    x, y
  );
  for (var i=0; i<seg.length; ++i) {
    var bez = bezier(seg[i]);
    context.bezierCurveTo(bez[0], bez[1], bez[2], bez[3], bez[4], bez[5]);
  }
}

var tau = 2 * Math.PI;
var halfSqrt3 = Math.sqrt(3) / 2;
var builtins = {
  'circle': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2;
      context.moveTo(r, 0);
      context.arc(0, 0, r, 0, tau);
    }
  },
  'cross': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          s = r / 2.5;
      context.moveTo(-r, -s);
      context.lineTo(-r, s);
      context.lineTo(-s, s);
      context.lineTo(-s, r);
      context.lineTo(s, r);
      context.lineTo(s, s);
      context.lineTo(r, s);
      context.lineTo(r, -s);
      context.lineTo(s, -s);
      context.lineTo(s, -r);
      context.lineTo(-s, -r);
      context.lineTo(-s, -s);
      context.closePath();
    }
  },
  'diamond': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2;
      context.moveTo(-r, 0);
      context.lineTo(0, -r);
      context.lineTo(r, 0);
      context.lineTo(0, r);
      context.closePath();
    }
  },
  'square': {
    draw: function(context, size) {
      var w = Math.sqrt(size),
          x = -w / 2;
      context.rect(x, x, w, w);
    }
  },
  'triangle-up': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(0, -h);
      context.lineTo(-r, h);
      context.lineTo(r, h);
      context.closePath();
    }
  },
  'triangle-down': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(0, h);
      context.lineTo(-r, -h);
      context.lineTo(r, -h);
      context.closePath();
    }
  },
  'triangle-right': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(h, 0);
      context.lineTo(-h, -r);
      context.lineTo(-h, r);
      context.closePath();
    }
  },
  'triangle-left': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(-h, 0);
      context.lineTo(h, -r);
      context.lineTo(h, r);
      context.closePath();
    }
  }
};

function symbols(_) {
  return builtins.hasOwnProperty(_) ? builtins[_] : customSymbol(_);
}

var custom = {};

function customSymbol(path) {
  if (!custom.hasOwnProperty(path)) {
    var parsed = pathParse(path);
    custom[path] = {
      draw: function(context, size) {
        pathRender(context, parsed, 0, 0, Math.sqrt(size) / 2);
      }
    };
  }
  return custom[path];
}

function rectangleX(d) {
  return d.x;
}

function rectangleY(d) {
  return d.y;
}

function rectangleWidth(d) {
  return d.width;
}

function rectangleHeight(d) {
  return d.height;
}

function constant$1(_) {
  return function() { return _; };
}

function vg_rect() {
  var x = rectangleX,
      y = rectangleY,
      width = rectangleWidth,
      height = rectangleHeight,
      cornerRadius = constant$1(0),
      context = null;

  function rectangle(_, x0, y0) {
    var buffer,
        x1 = x0 != null ? x0 : +x.call(this, _),
        y1 = y0 != null ? y0 : +y.call(this, _),
        w  = +width.call(this, _),
        h  = +height.call(this, _),
        cr = +cornerRadius.call(this, _);

    if (!context) context = buffer = d3Path.path();

    if (cr <= 0) {
      context.rect(x1, y1, w, h);
    } else {
      var x2 = x1 + w,
          y2 = y1 + h;
      context.moveTo(x1 + cr, y1);
      context.lineTo(x2 - cr, y1);
      context.quadraticCurveTo(x2, y1, x2, y1 + cr);
      context.lineTo(x2, y2 - cr);
      context.quadraticCurveTo(x2, y2, x2 - cr, y2);
      context.lineTo(x1 + cr, y2);
      context.quadraticCurveTo(x1, y2, x1, y2 - cr);
      context.lineTo(x1, y1 + cr);
      context.quadraticCurveTo(x1, y1, x1 + cr, y1);
      context.closePath();
    }

    if (buffer) return context = null, buffer + '' || null;
  }

  rectangle.x = function(_) {
    return arguments.length ? (x = typeof _ === 'function' ? _ : constant$1(+_), rectangle) : x;
  };

  rectangle.y = function(_) {
    return arguments.length ? (y = typeof _ === 'function' ? _ : constant$1(+_), rectangle) : y;
  };

  rectangle.width = function(_) {
    return arguments.length ? (width = typeof _ === 'function' ? _ : constant$1(+_), rectangle) : width;
  };

  rectangle.height = function(_) {
    return arguments.length ? (height = typeof _ === 'function' ? _ : constant$1(+_), rectangle) : height;
  };

  rectangle.cornerRadius = function(_) {
    return arguments.length ? (cornerRadius = typeof _ === 'function' ? _ : constant$1(+_), rectangle) : cornerRadius;
  };

  rectangle.context = function(_) {
    return arguments.length ? (context = _ == null ? null : _, rectangle) : context;
  };

  return rectangle;
}

var pi = Math.PI;

function vg_trail() {
  var x,
      y,
      size,
      defined,
      context = null,
      ready, x1, y1, r1;

  function point(x2, y2, w2) {
    var r2 = w2 / 2;

    if (ready) {
      var ux = y1 - y2,
          uy = x2 - x1;

      if (ux || uy) {
        // get normal vector
        var ud = Math.sqrt(ux * ux + uy * uy),
            rx = (ux /= ud) * r1,
            ry = (uy /= ud) * r1,
            t = Math.atan2(uy, ux);

        // draw segment
        context.moveTo(x1 - rx, y1 - ry);
        context.lineTo(x2 - ux * r2, y2 - uy * r2);
        context.arc(x2, y2, r2, t - pi, t);
        context.lineTo(x1 + rx, y1 + ry);
        context.arc(x1, y1, r1, t, t + pi);
      } else {
        context.arc(x2, y2, r2, 0, 2*pi);
      }
      context.closePath();
    } else {
      ready = 1;
    }
    x1 = x2, y1 = y2, r1 = r2;
  }

  function trail(data) {
    var i,
        n = data.length,
        d,
        defined0 = false,
        buffer;

    if (context == null) context = buffer = d3Path.path();

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) ready = 0;
      }
      if (defined0) point(+x(d, i, data), +y(d, i, data), +size(d, i, data));
    }

    if (buffer) return context = null, buffer + '' || null;
  }

  trail.x = function(_) {
    return arguments.length ? (x = _, trail) : x;
  };

  trail.y = function(_) {
    return arguments.length ? (y = _, trail) : y;
  };

  trail.size = function(_) {
    return arguments.length ? (size = _, trail) : size;
  };

  trail.defined = function(_) {
    return arguments.length ? (defined = _, trail) : defined;
  };

  trail.context = function(_) {
    return arguments.length ? (_ == null ? context = null : context = _, trail) : context;
  };

  return trail;
}

function x(item)    { return item.x || 0; }
function y(item)    { return item.y || 0; }
function w(item)    { return item.width || 0; }
function ts(item)   { return item.size || 1; }
function h(item)    { return item.height || 0; }
function xw(item)   { return (item.x || 0) + (item.width || 0); }
function yh(item)   { return (item.y || 0) + (item.height || 0); }
function cr(item)   { return item.cornerRadius || 0; }
function pa(item)   { return item.padAngle || 0; }
function def(item)  { return !(item.defined === false); }
function size(item) { return item.size == null ? 64 : item.size; }
function type(item) { return symbols(item.shape || 'circle'); }

var arcShape    = d3Shape.arc().cornerRadius(cr).padAngle(pa);
var areavShape  = d3Shape.area().x(x).y1(y).y0(yh).defined(def);
var areahShape  = d3Shape.area().y(y).x1(x).x0(xw).defined(def);
var lineShape   = d3Shape.line().x(x).y(y).defined(def);
var rectShape   = vg_rect().x(x).y(y).width(w).height(h).cornerRadius(cr);
var symbolShape = d3Shape.symbol().type(type).size(size);
var trailShape  = vg_trail().x(x).y(y).defined(def).size(ts);
function arc$2(context, item) {
  return arcShape.context(context)(item);
}

function area$1(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear';
  return (item.orient === 'horizontal' ? areahShape : areavShape)
    .curve(curves(interp, item.orient, item.tension))
    .context(context)(items);
}

function line$1(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear';
  return lineShape.curve(curves(interp, item.orient, item.tension))
    .context(context)(items);
}

function rectangle(context, item, x, y) {
  return rectShape.context(context)(item, x, y);
}

function shape(context, item) {
  return (item.mark.shape || item.shape)
    .context(context)(item);
}

function symbol$1(context, item) {
  return symbolShape.context(context)(item);
}

function trail(context, items) {
  return trailShape.context(context)(items);
}

function boundStroke(bounds, item) {
  if (item.stroke && item.opacity !== 0 && item.strokeOpacity !== 0) {
    bounds.expand(item.strokeWidth != null ? +item.strokeWidth : 1);
  }
  return bounds;
}

var bounds;
var tau$1 = Math.PI * 2;
var halfPi = tau$1 / 4;
var circleThreshold = tau$1 - 1e-8;
function context(_) {
  return bounds = _, context;
}

function noop() {}

function add(x, y) { bounds.add(x, y); }

context.beginPath = noop;

context.closePath = noop;

context.moveTo = add;

context.lineTo = add;

context.rect = function(x, y, w, h) {
  add(x, y);
  add(x + w, y + h);
};

context.quadraticCurveTo = function(x1, y1, x2, y2) {
  add(x1, y1);
  add(x2, y2);
};

context.bezierCurveTo = function(x1, y1, x2, y2, x3, y3) {
  add(x1, y1);
  add(x2, y2);
  add(x3, y3);
};

context.arc = function(cx, cy, r, sa, ea, ccw) {
  if (Math.abs(ea - sa) > circleThreshold) {
    add(cx - r, cy - r);
    add(cx + r, cy + r);
    return;
  }

  var xmin = Infinity, xmax = -Infinity,
      ymin = Infinity, ymax = -Infinity,
      s, i, x, y;

  function update(a) {
    x = r * Math.cos(a);
    y = r * Math.sin(a);
    if (x < xmin) xmin = x;
    if (x > xmax) xmax = x;
    if (y < ymin) ymin = y;
    if (y > ymax) ymax = y;
  }

  // Sample end points and interior points aligned with 90 degrees
  update(sa);
  update(ea);

  if (ea !== sa) {
    sa = sa % tau$1; if (sa < 0) sa += tau$1;
    ea = ea % tau$1; if (ea < 0) ea += tau$1;

    if (ea < sa) {
      ccw = !ccw; // flip direction
      s = sa; sa = ea; ea = s; // swap end-points
    }

    if (ccw) {
      ea -= tau$1;
      s = sa - (sa % halfPi);
      for (i=0; i<3 && s>ea; ++i, s-=halfPi) update(s);
    } else {
      s = sa - (sa % halfPi) + halfPi;
      for (i=0; i<3 && s<ea; ++i, s=s+halfPi) update(s);
    }
  }

  add(cx + xmin, cy + ymin);
  add(cx + xmax, cy + ymax);
};

function gradient(context, gradient, bounds) {
  var w = bounds.width(),
      h = bounds.height(),
      x1 = bounds.x1 + gradient.x1 * w,
      y1 = bounds.y1 + gradient.y1 * h,
      x2 = bounds.x1 + gradient.x2 * w,
      y2 = bounds.y1 + gradient.y2 * h,
      stop = gradient.stops,
      i = 0,
      n = stop.length,
      linearGradient = context.createLinearGradient(x1, y1, x2, y2);

  for (; i<n; ++i) {
    linearGradient.addColorStop(stop[i].offset, stop[i].color);
  }

  return linearGradient;
}

function color(context, item, value) {
  return (value.id) ?
    gradient(context, value, item.bounds) :
    value;
}

function fill(context, item, opacity) {
  opacity *= (item.fillOpacity==null ? 1 : item.fillOpacity);
  if (opacity > 0) {
    context.globalAlpha = opacity;
    context.fillStyle = color(context, item, item.fill);
    return true;
  } else {
    return false;
  }
}

var Empty = [];

function stroke(context, item, opacity) {
  var lw = (lw = item.strokeWidth) != null ? lw : 1;

  if (lw <= 0) return false;

  opacity *= (item.strokeOpacity==null ? 1 : item.strokeOpacity);
  if (opacity > 0) {
    context.globalAlpha = opacity;
    context.strokeStyle = color(context, item, item.stroke);

    context.lineWidth = lw;
    context.lineCap = item.strokeCap || 'butt';
    context.lineJoin = item.strokeJoin || 'miter';
    context.miterLimit = item.strokeMiterLimit || 10;

    if (context.setLineDash) {
      context.setLineDash(item.strokeDash || Empty);
      context.lineDashOffset = item.strokeDashOffset || 0;
    }
    return true;
  } else {
    return false;
  }
}

function compare$1(a, b) {
  return a.zindex - b.zindex || a.index - b.index;
}

function zorder(scene) {
  if (!scene.zdirty) return scene.zitems;

  var items = scene.items,
      output = [], item, i, n;

  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    item.index = i;
    if (item.zindex) output.push(item);
  }

  scene.zdirty = false;
  return scene.zitems = output.sort(compare$1);
}

function visit(scene, visitor) {
  var items = scene.items, i, n;
  if (!items || !items.length) return;

  var zitems = zorder(scene);

  if (zitems && zitems.length) {
    for (i=0, n=items.length; i<n; ++i) {
      if (!items[i].zindex) visitor(items[i]);
    }
    items = zitems;
  }

  for (i=0, n=items.length; i<n; ++i) {
    visitor(items[i]);
  }
}

function pickVisit(scene, visitor) {
  var items = scene.items, hit, i;
  if (!items || !items.length) return null;

  var zitems = zorder(scene);
  if (zitems && zitems.length) items = zitems;

  for (i=items.length; --i >= 0;) {
    if (hit = visitor(items[i])) return hit;
  }

  if (items === zitems) {
    for (items=scene.items, i=items.length; --i >= 0;) {
      if (!items[i].zindex) {
        if (hit = visitor(items[i])) return hit;
      }
    }
  }

  return null;
}

function drawAll(path) {
  return function(context, scene, bounds) {
    visit(scene, function(item) {
      if (!bounds || bounds.intersects(item.bounds)) {
        drawPath(path, context, item, item);
      }
    });
  };
}

function drawOne(path) {
  return function(context, scene, bounds) {
    if (scene.items.length && (!bounds || bounds.intersects(scene.bounds))) {
      drawPath(path, context, scene.items[0], scene.items);
    }
  };
}

function drawPath(path, context, item, items) {
  var opacity = item.opacity == null ? 1 : item.opacity;
  if (opacity === 0) return;

  if (path(context, items)) return;

  if (item.fill && fill(context, item, opacity)) {
    context.fill();
  }

  if (item.stroke && stroke(context, item, opacity)) {
    context.stroke();
  }
}

var trueFunc = function() { return true; };

function pick(test) {
  if (!test) test = trueFunc;

  return function(context, scene, x, y, gx, gy) {
    if (context.pixelRatio > 1) {
      x *= context.pixelRatio;
      y *= context.pixelRatio;
    }

    return pickVisit(scene, function(item) {
      var b = item.bounds;
      // first hit test against bounding box
      if ((b && !b.contains(gx, gy)) || !b) return;
      // if in bounding box, perform more careful test
      if (test(context, item, x, y, gx, gy)) return item;
    });
  };
}

function hitPath(path, filled) {
  return function(context, o, x, y) {
    var item = Array.isArray(o) ? o[0] : o,
        fill = (filled == null) ? item.fill : filled,
        stroke = item.stroke && context.isPointInStroke, lw, lc;

    if (stroke) {
      lw = item.strokeWidth;
      lc = item.strokeCap;
      context.lineWidth = lw != null ? lw : 1;
      context.lineCap   = lc != null ? lc : 'butt';
    }

    return path(context, o) ? false :
      (fill && context.isPointInPath(x, y)) ||
      (stroke && context.isPointInStroke(x, y));
  };
}

function pickPath(path) {
  return pick(hitPath(path));
}

function translate(x, y) {
  return 'translate(' + x + ',' + y + ')';
}

function translateItem(item) {
  return translate(item.x || 0, item.y || 0);
}

function markItemPath(type, shape) {

  function attr(emit, item) {
    emit('transform', translateItem(item));
    emit('d', shape(null, item));
  }

  function bound(bounds, item) {
    shape(context(bounds), item);
    return boundStroke(bounds, item)
      .translate(item.x || 0, item.y || 0);
  }

  function draw(context, item) {
    var x = item.x || 0,
        y = item.y || 0;
    context.translate(x, y);
    context.beginPath();
    shape(context, item);
    context.translate(-x, -y);
  }

  return {
    type:   type,
    tag:    'path',
    nested: false,
    attr:   attr,
    bound:  bound,
    draw:   drawAll(draw),
    pick:   pickPath(draw)
  };

}

var arc$1 = markItemPath('arc', arc$2);

function markMultiItemPath(type, shape) {

  function attr(emit, item) {
    var items = item.mark.items;
    if (items.length) emit('d', shape(null, items));
  }

  function bound(bounds, mark) {
    var items = mark.items;
    return items.length === 0 ? bounds
      : (shape(context(bounds), items), boundStroke(bounds, items[0]));
  }

  function draw(context, items) {
    context.beginPath();
    shape(context, items);
  }

  var hit = hitPath(draw);

  function pick(context, scene, x, y, gx, gy) {
    var items = scene.items,
        b = scene.bounds;

    if (!items || !items.length || b && !b.contains(gx, gy)) {
      return null;
    }

    if (context.pixelRatio > 1) {
      x *= context.pixelRatio;
      y *= context.pixelRatio;
    }
    return hit(context, items, x, y) ? items[0] : null;
  }

  return {
    type:   type,
    tag:    'path',
    nested: true,
    attr:   attr,
    bound:  bound,
    draw:   drawOne(draw),
    pick:   pick
  };

}

var area$2 = markMultiItemPath('area', area$1);

function clip(renderer, item, size) {
  var defs = renderer._defs,
      id = item.clip_id || (item.clip_id = 'clip' + defs.clip_id++),
      c = defs.clipping[id] || (defs.clipping[id] = {id: id});
  c.width = size.width || 0;
  c.height = size.height || 0;
  return 'url(#' + id + ')';
}

function attr(emit, item) {
  emit('transform', translateItem(item));
}

function background(emit, item) {
  var offset = item.stroke ? 0.5 : 0;
  emit('class', 'background');
  emit('d', rectangle(null, item, offset, offset));
}

function foreground(emit, item, renderer) {
  var url = item.clip ? clip(renderer, item, item) : null;
  emit('clip-path', url);
}

function bound(bounds, group) {
  if (!group.clip && group.items) {
    var items = group.items;
    for (var j=0, m=items.length; j<m; ++j) {
      bounds.union(items[j].bounds);
    }
  }

  if (group.clip || group.width || group.height) {
    boundStroke(
      bounds.add(0, 0).add(group.width || 0, group.height || 0),
      group
    );
  }

  return bounds.translate(group.x || 0, group.y || 0);
}

function draw(context, scene, bounds) {
  var renderer = this;

  visit(scene, function(group) {
    var gx = group.x || 0,
        gy = group.y || 0,
        w = group.width || 0,
        h = group.height || 0,
        offset, opacity;

    // setup graphics context
    context.save();
    context.translate(gx, gy);

    // draw group background
    if (group.stroke || group.fill) {
      opacity = group.opacity == null ? 1 : group.opacity;
      if (opacity > 0) {
        context.beginPath();
        offset = group.stroke ? 0.5 : 0;
        rectangle(context, group, offset, offset);
        if (group.fill && fill(context, group, opacity)) {
          context.fill();
        }
        if (group.stroke && stroke(context, group, opacity)) {
          context.stroke();
        }
      }
    }

    // set clip and bounds
    if (group.clip) {
      context.beginPath();
      context.rect(0, 0, w, h);
      context.clip();
    }
    if (bounds) bounds.translate(-gx, -gy);

    // draw group contents
    visit(group, function(item) {
      renderer.draw(context, item, bounds);
    });

    // restore graphics context
    if (bounds) bounds.translate(gx, gy);
    context.restore();
  });
}

function pick$1(context, scene, x, y, gx, gy) {
  if (scene.bounds && !scene.bounds.contains(gx, gy) || !scene.items) {
    return null;
  }

  var handler = this;

  return pickVisit(scene, function(group) {
    var hit, dx, dy, b;

    // first hit test against bounding box
    // if a group is clipped, that should be handled by the bounds check.
    b = group.bounds;
    if (b && !b.contains(gx, gy)) return;

    // passed bounds check, so test sub-groups
    dx = (group.x || 0);
    dy = (group.y || 0);

    context.save();
    context.translate(dx, dy);

    dx = gx - dx;
    dy = gy - dy;

    hit = pickVisit(group, function(mark) {
      return pickMark(mark, dx, dy)
        ? handler.pick(mark, x, y, dx, dy)
        : null;
    });

    context.restore();
    if (hit) return hit;

    hit = scene.interactive !== false
      && (group.fill || group.stroke)
      && dx >= 0
      && dx <= group.width
      && dy >= 0
      && dy <= group.height;

    return hit ? group : null;
  });
}

function pickMark(mark, x, y) {
  return (mark.interactive !== false || mark.marktype === 'group')
    && mark.bounds && mark.bounds.contains(x, y);
}

var group = {
  type:       'group',
  tag:        'g',
  nested:     false,
  attr:       attr,
  bound:      bound,
  draw:       draw,
  pick:       pick$1,
  background: background,
  foreground: foreground
};

function getImage(item, renderer) {
  var image = item.image;
  if (!image || image.url !== item.url) {
    image = {loaded: false, width: 0, height: 0};
    renderer.loadImage(item.url).then(function(image) {
      item.image = image;
      item.image.url = item.url;
    });
  }
  return image;
}

function imageXOffset(align, w) {
  return align === 'center' ? w / 2 : align === 'right' ? w : 0;
}

function imageYOffset(baseline, h) {
  return baseline === 'middle' ? h / 2 : baseline === 'bottom' ? h : 0;
}

function attr$1(emit, item, renderer) {
  var image = getImage(item, renderer),
      x = item.x || 0,
      y = item.y || 0,
      w = (item.width != null ? item.width : image.width) || 0,
      h = (item.height != null ? item.height : image.height) || 0,
      a = item.aspect === false ? 'none' : 'xMidYMid';

  x -= imageXOffset(item.align, w);
  y -= imageYOffset(item.baseline, h);

  emit('href', image.src || '', 'http://www.w3.org/1999/xlink', 'xlink:href');
  emit('transform', translate(x, y));
  emit('width', w);
  emit('height', h);
  emit('preserveAspectRatio', a);
}

function bound$1(bounds, item) {
  var image = item.image,
      x = item.x || 0,
      y = item.y || 0,
      w = (item.width != null ? item.width : (image && image.width)) || 0,
      h = (item.height != null ? item.height : (image && image.height)) || 0;

  x -= imageXOffset(item.align, w);
  y -= imageYOffset(item.baseline, h);

  return bounds.set(x, y, x + w, y + h);
}

function draw$1(context, scene, bounds) {
  var renderer = this;

  visit(scene, function(item) {
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check

    var image = getImage(item, renderer),
        x = item.x || 0,
        y = item.y || 0,
        w = (item.width != null ? item.width : image.width) || 0,
        h = (item.height != null ? item.height : image.height) || 0,
        opacity, ar0, ar1, t;

    x -= imageXOffset(item.align, w);
    y -= imageYOffset(item.baseline, h);

    if (item.aspect !== false) {
      ar0 = image.width / image.height;
      ar1 = item.width / item.height;
      if (ar0 === ar0 && ar1 === ar1 && ar0 !== ar1) {
        if (ar1 < ar0) {
          t = w / ar0;
          y += (h - t) / 2;
          h = t;
        } else {
          t = h * ar0;
          x += (w - t) / 2;
          w = t;
        }
      }
    }

    if (image.loaded) {
      context.globalAlpha = (opacity = item.opacity) != null ? opacity : 1;
      context.drawImage(image, x, y, w, h);
    }
  });
}

var image = {
  type:     'image',
  tag:      'image',
  nested:   false,
  attr:     attr$1,
  bound:    bound$1,
  draw:     draw$1,
  pick:     pick(),
  get:      getImage,
  xOffset:  imageXOffset,
  yOffset:  imageYOffset
};

var line$2 = markMultiItemPath('line', line$1);

function attr$2(emit, item) {
  emit('transform', translateItem(item));
  emit('d', item.path);
}

function path$1(context, item) {
  var path = item.path;
  if (path == null) return true;

  var cache = item.pathCache;
  if (!cache || cache.path !== path) {
    (item.pathCache = cache = pathParse(path)).path = path;
  }
  pathRender(context, cache, item.x, item.y);
}

function bound$2(bounds, item) {
  return path$1(context(bounds), item)
    ? bounds.set(0, 0, 0, 0)
    : boundStroke(bounds, item);
}

var path$2 = {
  type:   'path',
  tag:    'path',
  nested: false,
  attr:   attr$2,
  bound:  bound$2,
  draw:   drawAll(path$1),
  pick:   pickPath(path$1)
};

function attr$3(emit, item) {
  emit('d', rectangle(null, item));
}

function bound$3(bounds, item) {
  var x, y;
  return boundStroke(bounds.set(
    x = item.x || 0,
    y = item.y || 0,
    (x + item.width) || 0,
    (y + item.height) || 0
  ), item);
}

function draw$2(context, item) {
  context.beginPath();
  rectangle(context, item);
}

var rect = {
  type:   'rect',
  tag:    'path',
  nested: false,
  attr:   attr$3,
  bound:  bound$3,
  draw:   drawAll(draw$2),
  pick:   pickPath(draw$2)
};

function attr$4(emit, item) {
  emit('transform', translateItem(item));
  emit('x2', item.x2 != null ? item.x2 - (item.x||0) : 0);
  emit('y2', item.y2 != null ? item.y2 - (item.y||0) : 0);
}

function bound$4(bounds, item) {
  var x1, y1;
  return boundStroke(bounds.set(
    x1 = item.x || 0,
    y1 = item.y || 0,
    item.x2 != null ? item.x2 : x1,
    item.y2 != null ? item.y2 : y1
  ), item);
}

function path$3(context, item, opacity) {
  var x1, y1, x2, y2;

  if (item.stroke && stroke(context, item, opacity)) {
    x1 = item.x || 0;
    y1 = item.y || 0;
    x2 = item.x2 != null ? item.x2 : x1;
    y2 = item.y2 != null ? item.y2 : y1;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    return true;
  }
  return false;
}

function draw$3(context, scene, bounds) {
  visit(scene, function(item) {
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check
    var opacity = item.opacity == null ? 1 : item.opacity;
    if (opacity && path$3(context, item, opacity)) {
      context.stroke();
    }
  });
}

function hit(context, item, x, y) {
  if (!context.isPointInStroke) return false;
  return path$3(context, item, 1) && context.isPointInStroke(x, y);
}

var rule = {
  type:   'rule',
  tag:    'line',
  nested: false,
  attr:   attr$4,
  bound:  bound$4,
  draw:   draw$3,
  pick:   pick(hit)
};

var shape$1 = markItemPath('shape', shape);

var symbol$2 = markItemPath('symbol', symbol$1);

var context$1;
var fontHeight;
var textMetrics = {
  height: height,
  measureWidth: measureWidth,
  estimateWidth: estimateWidth,
  width: estimateWidth,
  canvas: canvas
};

canvas(true);

// make dumb, simple estimate if no canvas is available
function estimateWidth(item) {
  return fontHeight = height(item), estimate(textValue(item));
}

function estimate(text) {
  return ~~(0.8 * text.length * fontHeight);
}

// measure text width if canvas is available
function measureWidth(item) {
  return context$1.font = font(item), measure(textValue(item));
}

function measure(text) {
  return context$1.measureText(text).width;
}

function height(item) {
  return item.fontSize != null ? item.fontSize : 11;
}

function canvas(_) {
  context$1 = _
    ? (context$1 = Canvas$1(1,1)) ? context$1.getContext('2d') : null
    : null;
  textMetrics.width = context$1 ? measureWidth : estimateWidth
}

function textValue(item) {
  var s = item.text;
  return s == null ? '' : item.limit > 0 ? truncate$1(item) : s + '';
}

function truncate$1(item) {
  var limit = +item.limit,
      text = item.text + '',
      width = context$1
        ? (context$1.font = font(item), measure)
        : (fontHeight = height(item), estimate);

  if (width(text) < limit) return text;

  var ellipsis = item.ellipsis || '\u2026',
      rtl = item.dir === 'rtl',
      lo = 0,
      hi = text.length, mid;

  limit -= width(ellipsis);

  if (rtl) {
    while (lo < hi) {
      mid = (lo + hi >>> 1);
      if (width(text.slice(mid)) > limit) lo = mid + 1;
      else hi = mid;
    }
    return ellipsis + text.slice(lo);
  } else {
    while (lo < hi) {
      mid = 1 + (lo + hi >>> 1);
      if (width(text.slice(0, mid)) < limit) lo = mid;
      else hi = mid - 1;
    }
    return text.slice(0, lo) + ellipsis;
  }
}


function font(item, quote) {
  var font = item.font;
  if (quote && font) {
    font = String(font).replace(/\"/g, '\'');
  }
  return '' +
    (item.fontStyle ? item.fontStyle + ' ' : '') +
    (item.fontVariant ? item.fontVariant + ' ' : '') +
    (item.fontWeight ? item.fontWeight + ' ' : '') +
    height(item) + 'px ' +
    (font || 'sans-serif');
}

function offset(item) {
  // perform our own font baseline calculation
  // why? not all browsers support SVG 1.1 'alignment-baseline' :(
  var baseline = item.baseline,
      h = height(item);
  return Math.round(
    baseline === 'top'    ?  0.93*h :
    baseline === 'middle' ?  0.30*h :
    baseline === 'bottom' ? -0.21*h : 0
  );
}

var textAlign = {
  'left':   'start',
  'center': 'middle',
  'right':  'end'
};

var tempBounds = new Bounds();

function attr$5(emit, item) {
  var dx = item.dx || 0,
      dy = (item.dy || 0) + offset(item),
      x = item.x || 0,
      y = item.y || 0,
      a = item.angle || 0,
      r = item.radius || 0, t;

  if (r) {
    t = (item.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  emit('text-anchor', textAlign[item.align] || 'start');

  if (a) {
    t = translate(x, y) + ' rotate('+a+')';
    if (dx || dy) t += ' ' + translate(dx, dy);
  } else {
    t = translate(x + dx, y + dy);
  }
  emit('transform', t);
}

function bound$5(bounds, item, noRotate) {
  var h = textMetrics.height(item),
      a = item.align,
      r = item.radius || 0,
      x = item.x || 0,
      y = item.y || 0,
      dx = item.dx || 0,
      dy = (item.dy || 0) + offset(item) - Math.round(0.8*h), // use 4/5 offset
      w, t;

  if (r) {
    t = (item.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  // horizontal alignment
  w = textMetrics.width(item);
  if (a === 'center') {
    dx -= (w / 2);
  } else if (a === 'right') {
    dx -= w;
  } else {
    // left by default, do nothing
  }

  bounds.set(dx+=x, dy+=y, dx+w, dy+h);
  if (item.angle && !noRotate) {
    bounds.rotate(item.angle*Math.PI/180, x, y);
  }
  return bounds.expand(noRotate ? 0 : 1);
}

function draw$4(context, scene, bounds) {
  visit(scene, function(item) {
    var opacity, x, y, r, t, str;
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check
    if (!(str = textValue(item))) return; // get text string

    opacity = item.opacity == null ? 1 : item.opacity;
    if (opacity === 0) return;

    context.font = font(item);
    context.textAlign = item.align || 'left';

    x = item.x || 0;
    y = item.y || 0;
    if ((r = item.radius)) {
      t = (item.theta || 0) - Math.PI/2;
      x += r * Math.cos(t);
      y += r * Math.sin(t);
    }

    if (item.angle) {
      context.save();
      context.translate(x, y);
      context.rotate(item.angle * Math.PI/180);
      x = y = 0; // reset x, y
    }
    x += (item.dx || 0);
    y += (item.dy || 0) + offset(item);

    if (item.fill && fill(context, item, opacity)) {
      context.fillText(str, x, y);
    }
    if (item.stroke && stroke(context, item, opacity)) {
      context.strokeText(str, x, y);
    }
    if (item.angle) context.restore();
  });
}

function hit$1(context, item, x, y, gx, gy) {
  if (item.fontSize <= 0) return false;
  if (!item.angle) return true; // bounds sufficient if no rotation

  // project point into space of unrotated bounds
  var b = bound$5(tempBounds, item, true),
      a = -item.angle * Math.PI / 180,
      cos = Math.cos(a),
      sin = Math.sin(a),
      ix = item.x,
      iy = item.y,
      px = cos*gx - sin*gy + (ix - ix*cos + iy*sin),
      py = sin*gx + cos*gy + (iy - ix*sin - iy*cos);

  return b.contains(px, py);
}

var text = {
  type:   'text',
  tag:    'text',
  nested: false,
  attr:   attr$5,
  bound:  bound$5,
  draw:   draw$4,
  pick:   pick(hit$1)
};

var trail$1 = markMultiItemPath('trail', trail);

var Marks = {
  arc:     arc$1,
  area:    area$2,
  group:   group,
  image:   image,
  line:    line$2,
  path:    path$2,
  rect:    rect,
  rule:    rule,
  shape:   shape$1,
  symbol:  symbol$2,
  text:    text,
  trail:   trail$1
};

function boundItem(item, func, opt) {
  var type = Marks[item.mark.marktype],
      bound = func || type.bound;
  if (type.nested) item = item.mark;

  var curr = item.bounds,
      prev = item.bounds_prev || (item.bounds_prev = new Bounds());

  if (curr) {
    prev.clear().union(curr);
    curr.clear();
  } else {
    item.bounds = new Bounds();
  }

  bound(item.bounds, item, opt);
  if (!curr) prev.clear().union(item.bounds);

  return item.bounds;
}

var DUMMY = {mark: null};

function boundMark(mark, bounds, opt) {
  var type  = Marks[mark.marktype],
      bound = type.bound,
      items = mark.items,
      hasItems = items && items.length,
      i, n, item, b;

  if (type.nested) {
    item = hasItems ? items[0] : (DUMMY.mark = mark, DUMMY); // no items, fake it
    b = boundItem(item, bound, opt);
    bounds = bounds && bounds.union(b) || b;
    return bounds;
  }

  bounds = bounds
    || mark.bounds && mark.bounds.clear()
    || new Bounds();

  if (hasItems) {
    for (i=0, n=items.length; i<n; ++i) {
      bounds.union(boundItem(items[i], bound, opt));
    }
  }

  return mark.bounds = bounds;
}

var keys = [
  'marktype', 'name', 'role', 'interactive', 'clip', 'items', 'zindex',
  'x', 'y', 'width', 'height', 'align', 'baseline',             // layout
  'fill', 'fillOpacity', 'opacity',                             // fill
  'stroke', 'strokeOpacity', 'strokeWidth', 'strokeCap',        // stroke
  'strokeDash', 'strokeDashOffset',                             // stroke dash
  'startAngle', 'endAngle', 'innerRadius', 'outerRadius',       // arc
  'cornerRadius', 'padAngle',                                   // arc, rect
  'interpolate', 'tension', 'orient', 'defined',                // area, line
  'url',                                                        // image
  'path',                                                       // path
  'x2', 'y2',                                                   // rule
  'size', 'shape',                                              // symbol
  'text', 'angle', 'theta', 'radius', 'dx', 'dy',               // text
  'font', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant'  // font
];

function sceneToJSON(scene, indent) {
  return JSON.stringify(scene, keys, indent);
}

function sceneFromJSON(json) {
  var scene = (typeof json === 'string' ? JSON.parse(json) : json);
  return initialize(scene);
}

function initialize(scene) {
  var type = scene.marktype,
      items = scene.items,
      parent, i, n;

  if (items) {
    for (i=0, n=items.length; i<n; ++i) {
      parent = type ? 'mark' : 'group';
      items[i][parent] = scene;
      if (items[i].zindex) items[i][parent].zdirty = true;
      if ('group' === (type || parent)) initialize(items[i]);
    }
  }

  if (type) boundMark(scene);
  return scene;
}

function Scenegraph(scene) {
  if (arguments.length) {
    this.root = sceneFromJSON(scene);
  } else {
    this.root = createMark({
      marktype: 'group',
      name: 'root',
      role: 'frame'
    });
    this.root.items = [new GroupItem(this.root)];
  }
}

var prototype$2 = Scenegraph.prototype;

prototype$2.toJSON = function(indent) {
  return sceneToJSON(this.root, indent || 0);
};

prototype$2.mark = function(markdef, group, index) {
  group = group || this.root.items[0];
  var mark = createMark(markdef, group);
  group.items[index] = mark;
  if (mark.zindex) mark.group.zdirty = true;
  return mark;
};

function createMark(def, group) {
  return {
    bounds:      new Bounds(),
    bounds_prev: new Bounds(),
    clip:        !!def.clip,
    group:       group,
    interactive: def.interactive === false ? false : true,
    items:       [],
    marktype:    def.marktype,
    name:        def.name || undefined,
    role:        def.role || undefined,
    zindex:      def.zindex || 0
  };
}

function Handler(customLoader) {
  this._active = null;
  this._handlers = {};
  this._loader = customLoader || loader();
}

var prototype$3 = Handler.prototype;

prototype$3.initialize = function(el, origin, obj) {
  this._el = el;
  this._obj = obj || null;
  return this.origin(origin);
};

prototype$3.element = function() {
  return this._el;
};

prototype$3.origin = function(origin) {
  this._origin = origin || [0, 0];
  return this;
};

prototype$3.scene = function(scene) {
  if (!arguments.length) return this._scene;
  this._scene = scene;
  return this;
};

// add an event handler
// subclasses should override
prototype$3.on = function(/*type, handler*/) {};

// remove an event handler
// subclasses should override
prototype$3.off = function(/*type, handler*/) {};

// return an array with all registered event handlers
prototype$3.handlers = function() {
  var h = this._handlers, a = [], k;
  for (k in h) { a.push.apply(a, h[k]); }
  return a;
};

prototype$3.eventName = function(name) {
  var i = name.indexOf('.');
  return i < 0 ? name : name.slice(0,i);
};

prototype$3.handleHref = function(event, item, href) {
  this._loader
    .sanitize(href, {context:'href'})
    .then(function(opt) {
      var e = new MouseEvent(event.type, event),
          a = domCreate(null, 'a');
      for (var name in opt) a.setAttribute(name, opt[name]);
      a.dispatchEvent(e);
    })
    .catch(function() { /* do nothing */ });
};

prototype$3.handleTooltip = function(event, item, tooltipText) {
  this._el.setAttribute('title', tooltipText || '');
};

/**
 * Create a new Renderer instance.
 * @param {object} [loader] - Optional loader instance for
 *   image and href URL sanitization. If not specified, a
 *   standard loader instance will be generated.
 * @constructor
 */
function Renderer(loader) {
  this._el = null;
  this._bgcolor = null;
  this._loader = new ResourceLoader(loader);
}

var prototype$4 = Renderer.prototype;

/**
 * Initialize a new Renderer instance.
 * @param {DOMElement} el - The containing DOM element for the display.
 * @param {number} width - The width of the display, in pixels.
 * @param {number} height - The height of the display, in pixels.
 * @param {Array<number>} origin - The origin of the display, in pixels.
 *   The coordinate system will be translated to this point.
 * @return {Renderer} - This renderer instance;
 */
prototype$4.initialize = function(el, width, height, origin) {
  this._el = el;
  return this.resize(width, height, origin);
};

/**
 * Returns the parent container element for a visualization.
 * @return {DOMElement} - The containing DOM element.
 */
prototype$4.element = function() {
  return this._el;
};

/**
 * Returns the scene element (e.g., canvas or SVG) of the visualization
 * Subclasses must override if the first child is not the scene element.
 * @return {DOMElement} - The scene (e.g., canvas or SVG) element.
 */
prototype$4.scene = function() {
  return this._el && this._el.firstChild;
};

/**
 * Get / set the background color.
 */
prototype$4.background = function(bgcolor) {
  if (arguments.length === 0) return this._bgcolor;
  this._bgcolor = bgcolor;
  return this;
};

/**
 * Resize the display.
 * @param {number} width - The new width of the display, in pixels.
 * @param {number} height - The new height of the display, in pixels.
 * @param {Array<number>} origin - The new origin of the display, in pixels.
 *   The coordinate system will be translated to this point.
 * @return {Renderer} - This renderer instance;
 */
prototype$4.resize = function(width, height, origin) {
  this._width = width;
  this._height = height;
  this._origin = origin || [0, 0];
  return this;
};

/**
 * Render an input scenegraph, potentially with a set of dirty items.
 * This method will perform an immediate rendering with available resources.
 * The renderer may also need to perform image loading to perform a complete
 * render. This process can lead to asynchronous re-rendering of the scene
 * after this method returns. To receive notification when rendering is
 * complete, use the renderAsync method instead.
 * @param {object} scene - The root mark of a scenegraph to render.
 * @param {Array<object>} [items] - An optional array of dirty items.
 *   If provided, the renderer may optimize the redraw of these items.
 * @return {Renderer} - This renderer instance.
 */
prototype$4.render = function(scene, items) {
  var r = this;

  // bind arguments into a render call, and cache it
  // this function may be subsequently called for async redraw
  r._call = function() { r._render(scene, items); };

  // invoke the renderer
  r._call();

  // clear the cached call for garbage collection
  // async redraws will stash their own copy
  r._call = null;

  return r;
};

/**
 * Internal rendering method. Renderer subclasses should override this
 * method to actually perform rendering.
 * @param {object} scene - The root mark of a scenegraph to render.
 * @param {Array<object>} [items] - An optional array of dirty items.
 *   If provided, the renderer may optimize the redraw of these items.
 */
prototype$4._render = function(/*scene, items*/) {
  // subclasses to override
};

/**
 * Asynchronous rendering method. Similar to render, but returns a Promise
 * that resolves when all rendering is completed. Sometimes a renderer must
 * perform image loading to get a complete rendering. The returned
 * Promise will not resolve until this process completes.
 * @param {object} scene - The root mark of a scenegraph to render.
 * @param {Array<object>} [items] - An optional array of dirty items.
 *   If provided, the renderer may optimize the redraw of these items.
 * @return {Promise} - A Promise that resolves when rendering is complete.
 */
prototype$4.renderAsync = function(scene, items) {
  var r = this.render(scene, items);
  return this._ready
    ? this._ready.then(function() { return r; })
    : Promise.resolve(r);
};

/**
 * Internal method for asynchronous resource loading.
 * Proxies method calls to the ImageLoader, and tracks loading
 * progress to invoke a re-render once complete.
 * @param {string} method - The method name to invoke on the ImageLoader.
 * @param {string} uri - The URI for the requested resource.
 * @return {Promise} - A Promise that resolves to the requested resource.
 */
prototype$4._load = function(method, uri) {
  var r = this,
      p = r._loader[method](uri);

  if (!r._ready) {
    // re-render the scene when loading completes
    var call = r._call;
    r._ready = r._loader.ready()
      .then(function(redraw) {
        if (redraw) call();
        r._ready = null;
      });
  }

  return p;
};

/**
 * Sanitize a URL to include as a hyperlink in the rendered scene.
 * This method proxies a call to ImageLoader.sanitizeURL, but also tracks
 * image loading progress and invokes a re-render once complete.
 * @param {string} uri - The URI string to sanitize.
 * @return {Promise} - A Promise that resolves to the sanitized URL.
 */
prototype$4.sanitizeURL = function(uri) {
  return this._load('sanitizeURL', uri);
};

/**
 * Requests an image to include in the rendered scene.
 * This method proxies a call to ImageLoader.loadImage, but also tracks
 * image loading progress and invokes a re-render once complete.
 * @param {string} uri - The URI string of the image.
 * @return {Promise} - A Promise that resolves to the loaded Image.
 */
prototype$4.loadImage = function(uri) {
  return this._load('loadImage', uri);
};

function point(event, el) {
  var rect = el.getBoundingClientRect();
  return [
    event.clientX - rect.left - (el.clientLeft || 0),
    event.clientY - rect.top - (el.clientTop || 0)
  ];
}

function CanvasHandler(loader) {
  Handler.call(this, loader);
  this._down = null;
  this._touch = null;
  this._first = true;
}

var prototype$5 = inherits(CanvasHandler, Handler);

prototype$5.initialize = function(el, origin, obj) {
  // add event listeners
  var canvas = this._canvas = el && domFind(el, 'canvas');
  if (canvas) {
    var that = this;
    this.events.forEach(function(type) {
      canvas.addEventListener(type, function(evt) {
        if (prototype$5[type]) {
          prototype$5[type].call(that, evt);
        } else {
          that.fire(type, evt);
        }
      });
    });
  }

  return Handler.prototype.initialize.call(this, el, origin, obj);
};

prototype$5.canvas = function() {
  return this._canvas;
};

// retrieve the current canvas context
prototype$5.context = function() {
  return this._canvas.getContext('2d');
};

// supported events
prototype$5.events = [
  'keydown',
  'keypress',
  'keyup',
  'dragenter',
  'dragleave',
  'dragover',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseout',
  'mouseover',
  'click',
  'dblclick',
  'wheel',
  'mousewheel',
  'touchstart',
  'touchmove',
  'touchend'
];

// to keep old versions of firefox happy
prototype$5.DOMMouseScroll = function(evt) {
  this.fire('mousewheel', evt);
};

function move(moveEvent, overEvent, outEvent) {
  return function(evt) {
    var a = this._active,
        p = this.pickEvent(evt);

    if (p === a) {
      // active item and picked item are the same
      this.fire(moveEvent, evt); // fire move
    } else {
      // active item and picked item are different
      if (!a || !a.exit) {
        // fire out for prior active item
        // suppress if active item was removed from scene
        this.fire(outEvent, evt);
      }
      this._active = p;          // set new active item
      this.fire(overEvent, evt); // fire over for new active item
      this.fire(moveEvent, evt); // fire move for new active item
    }
  };
}

function inactive(type) {
  return function(evt) {
    this.fire(type, evt);
    this._active = null;
  };
}

prototype$5.mousemove = move('mousemove', 'mouseover', 'mouseout');
prototype$5.dragover  = move('dragover', 'dragenter', 'dragleave');

prototype$5.mouseout  = inactive('mouseout');
prototype$5.dragleave = inactive('dragleave');

prototype$5.mousedown = function(evt) {
  this._down = this._active;
  this.fire('mousedown', evt);
};

prototype$5.click = function(evt) {
  if (this._down === this._active) {
    this.fire('click', evt);
    this._down = null;
  }
};

prototype$5.touchstart = function(evt) {
  this._touch = this.pickEvent(evt.changedTouches[0]);

  if (this._first) {
    this._active = this._touch;
    this._first = false;
  }

  this.fire('touchstart', evt, true);
};

prototype$5.touchmove = function(evt) {
  this.fire('touchmove', evt, true);
};

prototype$5.touchend = function(evt) {
  this.fire('touchend', evt, true);
  this._touch = null;
};

// fire an event
prototype$5.fire = function(type, evt, touch) {
  var a = touch ? this._touch : this._active,
      h = this._handlers[type], i, len;

  // if hyperlinked, handle link first
  if (type === 'click' && a && a.href) {
    this.handleHref(evt, a, a.href);
  } else if ((type === 'mouseover' || type === 'mouseout') && a && a.tooltip) {
    this.handleTooltip(evt, a, type === 'mouseover' ? a.tooltip : null);
  }

  // invoke all registered handlers
  if (h) {
    evt.vegaType = type;
    for (i=0, len=h.length; i<len; ++i) {
      h[i].handler.call(this._obj, evt, a);
    }
  }
};

// add an event handler
prototype$5.on = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers;
  (h[name] || (h[name] = [])).push({
    type: type,
    handler: handler
  });
  return this;
};

// remove an event handler
prototype$5.off = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers[name], i;
  if (!h) return;
  for (i=h.length; --i>=0;) {
    if (h[i].type !== type) continue;
    if (!handler || h[i].handler === handler) h.splice(i, 1);
  }
  return this;
};

prototype$5.pickEvent = function(evt) {
  var p = point(evt, this._canvas),
      o = this._origin;
  return this.pick(this._scene, p[0], p[1], p[0] - o[0], p[1] - o[1]);
};

// find the scenegraph item at the current mouse position
// x, y -- the absolute x, y mouse coordinates on the canvas element
// gx, gy -- the relative coordinates within the current group
prototype$5.pick = function(scene, x, y, gx, gy) {
  var g = this.context(),
      mark = Marks[scene.marktype];
  return mark.pick.call(this, g, scene, x, y, gx, gy);
};

function clip$1(context, scene) {
  var group = scene.group;
  context.save();
  context.beginPath();
  context.rect(0, 0, group.width || 0, group.height || 0);
  context.clip();
}

var devicePixelRatio = typeof window !== 'undefined'
  ? window.devicePixelRatio || 1 : 1;

function resize(canvas, width, height, origin) {
  var scale = typeof HTMLElement !== 'undefined'
    && canvas instanceof HTMLElement
    && canvas.parentNode != null;

  var context = canvas.getContext('2d'),
      ratio = scale ? devicePixelRatio : 1;

  canvas.width = width * ratio;
  canvas.height = height * ratio;

  if (ratio !== 1) {
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }

  context.pixelRatio = ratio;
  context.setTransform(
    ratio, 0, 0, ratio,
    ratio * origin[0],
    ratio * origin[1]
  );

  return canvas;
}

function CanvasRenderer(loader) {
  Renderer.call(this, loader);
  this._redraw = false;
}

var prototype$6 = inherits(CanvasRenderer, Renderer);
var base = Renderer.prototype;
var tempBounds$1 = new Bounds();
prototype$6.initialize = function(el, width, height, origin) {
  this._canvas = Canvas$1(1, 1); // instantiate a small canvas
  if (el) {
    domClear(el, 0).appendChild(this._canvas);
    this._canvas.setAttribute('class', 'marks');
  }
  // this method will invoke resize to size the canvas appropriately
  return base.initialize.call(this, el, width, height, origin);
};

prototype$6.resize = function(width, height, origin) {
  base.resize.call(this, width, height, origin);
  resize(this._canvas, this._width, this._height, this._origin);
  return this._redraw = true, this;
};

prototype$6.canvas = function() {
  return this._canvas;
};

prototype$6.context = function() {
  return this._canvas ? this._canvas.getContext('2d') : null;
};

function clipToBounds(g, items) {
  var b = new Bounds(), i, n, item, mark, group;
  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = item.mark;
    group = mark.group;
    item = Marks[mark.marktype].nested ? mark : item;
    b.union(translate$1(item.bounds, group));
    if (item.bounds_prev) {
      b.union(translate$1(item.bounds_prev, group));
    }
  }
  b.expand(1).round();

  g.beginPath();
  g.rect(b.x1, b.y1, b.width(), b.height());
  g.clip();

  return b;
}

function translate$1(bounds, group) {
  if (group == null) return bounds;
  var b = tempBounds$1.clear().union(bounds);
  for (; group != null; group = group.mark.group) {
    b.translate(group.x || 0, group.y || 0);
  }
  return b;
}

prototype$6._render = function(scene, items) {
  var g = this.context(),
      o = this._origin,
      w = this._width,
      h = this._height,
      b;

  // setup
  g.save();
  b = (!items || this._redraw)
    ? (this._redraw = false, null)
    : clipToBounds(g, items);
  this.clear(-o[0], -o[1], w, h);

  // render
  this.draw(g, scene, b);

  // takedown
  g.restore();

  return this;
};

prototype$6.draw = function(ctx, scene, bounds) {
  var mark = Marks[scene.marktype];
  if (scene.clip) clip$1(ctx, scene);
  mark.draw.call(this, ctx, scene, bounds);
  if (scene.clip) ctx.restore();
};

prototype$6.clear = function(x, y, w, h) {
  var g = this.context();
  g.clearRect(x, y, w, h);
  if (this._bgcolor != null) {
    g.fillStyle = this._bgcolor;
    g.fillRect(x, y, w, h);
  }
};

function SVGHandler(loader) {
  Handler.call(this, loader);
  var h = this;
  h._hrefHandler = listener(h, function(evt, item) {
    if (item && item.href) h.handleHref(evt, item, item.href);
  });
  h._tooltipHandler = listener(h, function(evt, item) {
    if (item && item.tooltip) {
      h.handleTooltip(evt, item, evt.type === 'mouseover' ? item.tooltip : null);
    }
  });
}

var prototype$7 = inherits(SVGHandler, Handler);

prototype$7.initialize = function(el, origin, obj) {
  var svg = this._svg;
  if (svg) {
    svg.removeEventListener('click', this._hrefHandler);
    svg.removeEventListener('mouseover', this._tooltipHandler);
    svg.removeEventListener('mouseout', this._tooltipHandler);
  }
  this._svg = svg = el && domFind(el, 'svg');
  if (svg) {
    svg.addEventListener('click', this._hrefHandler);
    svg.addEventListener('mouseover', this._tooltipHandler);
    svg.addEventListener('mouseout', this._tooltipHandler);
  }
  return Handler.prototype.initialize.call(this, el, origin, obj);
};

prototype$7.svg = function() {
  return this._svg;
};

// wrap an event listener for the SVG DOM
function listener(context, handler) {
  return function(evt) {
    var target = evt.target,
        item = target.__data__;
    evt.vegaType = evt.type;
    item = Array.isArray(item) ? item[0] : item;
    handler.call(context._obj, evt, item);
  };
}

// add an event handler
prototype$7.on = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers,
      x = {
        type:     type,
        handler:  handler,
        listener: listener(this, handler)
      };

  (h[name] || (h[name] = [])).push(x);

  if (this._svg) {
    this._svg.addEventListener(name, x.listener);
  }

  return this;
};

// remove an event handler
prototype$7.off = function(type, handler) {
  var name = this.eventName(type),
      svg = this._svg,
      h = this._handlers[name], i;

  if (!h) return;

  for (i=h.length; --i>=0;) {
    if (h[i].type === type && !handler || h[i].handler === handler) {
      if (this._svg) {
        svg.removeEventListener(name, h[i].listener);
      }
      h.splice(i, 1);
    }
  }

  return this;
};

// generate string for an opening xml tag
// tag: the name of the xml tag
// attr: hash of attribute name-value pairs to include
// raw: additional raw string to include in tag markup
function openTag(tag, attr, raw) {
  var s = '<' + tag, key, val;
  if (attr) {
    for (key in attr) {
      val = attr[key];
      if (val != null) {
        s += ' ' + key + '="' + val + '"';
      }
    }
  }
  if (raw) s += ' ' + raw;
  return s + '>';
}

// generate string for closing xml tag
// tag: the name of the xml tag
function closeTag(tag) {
  return '</' + tag + '>';
}

var metadata = {
  'version': '1.1',
  'xmlns': 'http://www.w3.org/2000/svg',
  'xmlns:xlink': 'http://www.w3.org/1999/xlink'
};

var styles = {
  'fill':             'fill',
  'fillOpacity':      'fill-opacity',
  'stroke':           'stroke',
  'strokeWidth':      'stroke-width',
  'strokeOpacity':    'stroke-opacity',
  'strokeCap':        'stroke-linecap',
  'strokeJoin':       'stroke-linejoin',
  'strokeDash':       'stroke-dasharray',
  'strokeDashOffset': 'stroke-dashoffset',
  'strokeMiterLimit': 'stroke-miterlimit',
  'opacity':          'opacity'
};

var styleProperties = Object.keys(styles);

var ns = metadata.xmlns;

function SVGRenderer(loader) {
  Renderer.call(this, loader);
  this._dirtyID = 0;
  this._svg = null;
  this._root = null;
  this._defs = null;
}

var prototype$8 = inherits(SVGRenderer, Renderer);
var base$1 = Renderer.prototype;

prototype$8.initialize = function(el, width, height, padding) {
  if (el) {
    this._svg = domChild(el, 0, 'svg', ns);
    this._svg.setAttribute('class', 'marks');
    domClear(el, 1);
    // set the svg root group
    this._root = domChild(this._svg, 0, 'g', ns);
    domClear(this._svg, 1);
  }

  // create the svg definitions cache
  this._defs = {
    clip_id:  1,
    gradient: {},
    clipping: {}
  };

  // set background color if defined
  this.background(this._bgcolor);

  return base$1.initialize.call(this, el, width, height, padding);
};

prototype$8.background = function(bgcolor) {
  if (arguments.length && this._svg) {
    this._svg.style.setProperty('background-color', bgcolor);
  }
  return base$1.background.apply(this, arguments);
};

prototype$8.resize = function(width, height, origin) {
  base$1.resize.call(this, width, height, origin);

  if (this._svg) {
    this._svg.setAttribute('width', this._width);
    this._svg.setAttribute('height', this._height);
    this._svg.setAttribute('viewBox', '0 0 ' + this._width + ' ' + this._height);
    this._root.setAttribute('transform', 'translate(' + this._origin + ')');
  }

  return this;
};

prototype$8.svg = function() {
  if (!this._svg) return null;

  var attr = {
    'class':  'marks',
    'width':  this._width,
    'height': this._height,
    'viewBox': '0 0 ' + this._width + ' ' + this._height
  };
  for (var key in metadata) {
    attr[key] = metadata[key];
  }

  return openTag('svg', attr) + this._svg.innerHTML + closeTag('svg');
};


// -- Render entry point --

prototype$8._render = function(scene, items) {
  // perform spot updates and re-render markup
  if (this._dirtyCheck(items)) {
    if (this._dirtyAll) this._resetDefs();
    this.draw(this._root, scene);
    domClear(this._root, 1);
  }

  this.updateDefs();
  return this;
};

// -- Manage SVG definitions ('defs') block --

prototype$8.updateDefs = function() {
  var svg = this._svg,
      defs = this._defs,
      el = defs.el,
      index = 0, id;

  for (id in defs.gradient) {
    if (!el) defs.el = (el = domChild(svg, 0, 'defs', ns));
    updateGradient(el, defs.gradient[id], index++);
  }

  for (id in defs.clipping) {
    if (!el) defs.el = (el = domChild(svg, 0, 'defs', ns));
    updateClipping(el, defs.clipping[id], index++);
  }

  // clean-up
  if (el) {
    if (index === 0) {
      svg.removeChild(el);
      defs.el = null;
    } else {
      domClear(el, index);
    }
  }
};

function updateGradient(el, grad, index) {
  var i, n, stop;

  el = domChild(el, index, 'linearGradient', ns);
  el.setAttribute('id', grad.id);
  el.setAttribute('x1', grad.x1);
  el.setAttribute('x2', grad.x2);
  el.setAttribute('y1', grad.y1);
  el.setAttribute('y2', grad.y2);

  for (i=0, n=grad.stops.length; i<n; ++i) {
    stop = domChild(el, i, 'stop', ns);
    stop.setAttribute('offset', grad.stops[i].offset);
    stop.setAttribute('stop-color', grad.stops[i].color);
  }
  domClear(el, i);
}

function updateClipping(el, clip, index) {
  var rect;

  el = domChild(el, index, 'clipPath', ns);
  el.setAttribute('id', clip.id);
  rect = domChild(el, 0, 'rect', ns);
  rect.setAttribute('x', 0);
  rect.setAttribute('y', 0);
  rect.setAttribute('width', clip.width);
  rect.setAttribute('height', clip.height);
}

prototype$8._resetDefs = function() {
  var def = this._defs;
  def.clip_id = 1;
  def.gradient = {};
  def.clipping = {};
};


// -- Manage rendering of items marked as dirty --

prototype$8.isDirty = function(item) {
  return this._dirtyAll
    || !item._svg
    || item.dirty === this._dirtyID;
};

prototype$8._dirtyCheck = function(items) {
  this._dirtyAll = true;
  if (!items) return true;

  var id = ++this._dirtyID,
      item, mark, type, mdef, i, n, o;

  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = item.mark;

    if (mark.marktype !== type) {
      // memoize mark instance lookup
      type = mark.marktype;
      mdef = Marks[type];
    }

    if (mark.zdirty && mark.dirty !== id) {
      this._dirtyAll = false;
      mark.dirty = id;
      dirtyParents(mark.group, id);
    }

    if (item.exit) { // EXIT
      if (mdef.nested && mark.items.length) {
        // if nested mark with remaining points, update instead
        o = mark.items[0];
        if (o._svg) this._update(mdef, o._svg, o);
      } else if (item._svg) {
        // otherwise remove from DOM
        item._svg.parentNode.removeChild(item._svg);
      }
      item._svg = null;
      continue;
    }

    item = (mdef.nested ? mark.items[0] : item);
    if (item._update === id) continue; // already visited

    if (!item._svg || !item._svg.ownerSVGElement) {
      // ENTER
      this._dirtyAll = false;
      dirtyParents(item, id);
    } else {
      // IN-PLACE UPDATE
      this._update(mdef, item._svg, item);
    }
    item._update = id;
  }
  return !this._dirtyAll;
};

function dirtyParents(item, id) {
  for (; item && item.dirty !== id; item=item.mark.group) {
    item.dirty = id;
    if (item.mark && item.mark.dirty !== id) {
      item.mark.dirty = id;
    } else return;
  }
}


// -- Construct & maintain scenegraph to SVG mapping ---

// Draw a mark container.
prototype$8.draw = function(el, scene, prev) {
  if (!this.isDirty(scene)) return scene._svg;

  var renderer = this,
      mdef = Marks[scene.marktype],
      events = scene.interactive === false ? 'none' : null,
      isGroup = mdef.tag === 'g',
      sibling = null,
      i = 0,
      parent;

  parent = bind(scene, el, prev, 'g');
  parent.setAttribute('class', cssClass(scene));
  if (!isGroup && events) {
    parent.style.setProperty('pointer-events', events);
  }
  if (scene.clip) {
    parent.setAttribute('clip-path', clip(renderer, scene, scene.group));
  }

  function process(item) {
    var dirty = renderer.isDirty(item),
        node = bind(item, parent, sibling, mdef.tag);

    if (dirty) {
      renderer._update(mdef, node, item);
      if (isGroup) recurse(renderer, node, item);
    }

    sibling = node;
    ++i;
  }

  if (mdef.nested) {
    if (scene.items.length) process(scene.items[0]);
  } else {
    visit(scene, process);
  }

  domClear(parent, i);
  return parent;
};

// Recursively process group contents.
function recurse(renderer, el, group) {
  el = el.lastChild;
  var prev, idx = 0;

  visit(group, function(item) {
    prev = renderer.draw(el, item, prev);
    ++idx;
  });

  // remove any extraneous DOM elements
  domClear(el, 1 + idx);
}

// Bind a scenegraph item to an SVG DOM element.
// Create new SVG elements as needed.
function bind(item, el, sibling, tag) {
  var node = item._svg, doc;

  // create a new dom node if needed
  if (!node) {
    doc = el.ownerDocument;
    node = domCreate(doc, tag, ns);
    item._svg = node;

    if (item.mark) {
      node.__data__ = item;
      node.__values__ = {fill: 'default'};

      // if group, create background and foreground elements
      if (tag === 'g') {
        var bg = domCreate(doc, 'path', ns);
        bg.setAttribute('class', 'background');
        node.appendChild(bg);
        bg.__data__ = item;

        var fg = domCreate(doc, 'g', ns);
        node.appendChild(fg);
        fg.__data__ = item;
      }
    }
  }

  if (doc || node.previousSibling !== sibling) {
    el.insertBefore(node, sibling ? sibling.nextSibling : el.firstChild);
  }

  return node;
}


// -- Set attributes & styles on SVG elements ---

var element = null;
var values = null;
// temp var for current values hash

// Extra configuration for certain mark types
var mark_extras = {
  group: function(mdef, el, item) {
    values = el.__values__; // use parent's values hash

    element = el.childNodes[1];
    mdef.foreground(emit, item, this);

    element = el.childNodes[0];
    mdef.background(emit, item, this);

    var value = item.mark.interactive === false ? 'none' : null;
    if (value !== values.events) {
      element.style.setProperty('pointer-events', value);
      values.events = value;
    }
  },
  text: function(mdef, el, item) {
    var str = textValue(item);
    if (str !== values.text) {
      el.textContent = str;
      values.text = str;
    }
    str = font(item);
    if (str !== values.font) {
      el.style.setProperty('font', str);
      values.font = str;
    }
  }
};

prototype$8._update = function(mdef, el, item) {
  // set dom element and values cache
  // provides access to emit method
  element = el;
  values = el.__values__;

  // apply svg attributes
  mdef.attr(emit, item, this);

  // some marks need special treatment
  var extra = mark_extras[mdef.type];
  if (extra) extra.call(this, mdef, el, item);

  // apply svg css styles
  // note: element may be modified by 'extra' method
  this.style(element, item);
};

function emit(name, value, ns) {
  // early exit if value is unchanged
  if (value === values[name]) return;

  if (value != null) {
    // if value is provided, update DOM attribute
    if (ns) {
      element.setAttributeNS(ns, name, value);
    } else {
      element.setAttribute(name, value);
    }
  } else {
    // else remove DOM attribute
    if (ns) {
      element.removeAttributeNS(ns, name);
    } else {
      element.removeAttribute(name);
    }
  }

  // note current value for future comparison
  values[name] = value;
}

prototype$8.style = function(el, o) {
  if (o == null) return;
  var i, n, prop, name, value;

  for (i=0, n=styleProperties.length; i<n; ++i) {
    prop = styleProperties[i];
    value = o[prop];
    if (value === values[prop]) continue;

    name = styles[prop];
    if (value == null) {
      if (name === 'fill') {
        el.style.setProperty(name, 'none');
      } else {
        el.style.removeProperty(name);
      }
    } else {
      if (value.id) {
        // ensure definition is included
        this._defs.gradient[value.id] = value;
        value = 'url(' + href() + '#' + value.id + ')';
      }
      el.style.setProperty(name, value+'');
    }

    values[prop] = value;
  }
};

function href() {
  return typeof window !== 'undefined' ? window.location.href : '';
}

function SVGStringRenderer(loader) {
  Renderer.call(this, loader);

  this._text = {
    head: '',
    root: '',
    foot: '',
    defs: '',
    body: ''
  };

  this._defs = {
    clip_id:  1,
    gradient: {},
    clipping: {}
  };
}

var prototype$9 = inherits(SVGStringRenderer, Renderer);
var base$2 = Renderer.prototype;

prototype$9.resize = function(width, height, origin) {
  base$2.resize.call(this, width, height, origin);
  var o = this._origin,
      t = this._text;

  var attr = {
    'class':  'marks',
    'width':  this._width,
    'height': this._height,
    'viewBox': '0 0 ' + this._width + ' ' + this._height
  };
  for (var key in metadata) {
    attr[key] = metadata[key];
  }

  t.head = openTag('svg', attr);
  t.root = openTag('g', {
    transform: 'translate(' + o + ')'
  });
  t.foot = closeTag('g') + closeTag('svg');

  return this;
};

prototype$9.svg = function() {
  var t = this._text;
  return t.head + t.defs + t.root + t.body + t.foot;
};

prototype$9._render = function(scene) {
  this._text.body = this.mark(scene);
  this._text.defs = this.buildDefs();
  return this;
};

prototype$9.reset = function() {
  this._defs.clip_id = 0;
  return this;
};

prototype$9.buildDefs = function() {
  var all = this._defs,
      defs = '',
      i, id, def, stops;

  for (id in all.gradient) {
    def = all.gradient[id];
    stops = def.stops;

    defs += openTag('linearGradient', {
      id: id,
      x1: def.x1,
      x2: def.x2,
      y1: def.y1,
      y2: def.y2
    });

    for (i=0; i<stops.length; ++i) {
      defs += openTag('stop', {
        offset: stops[i].offset,
        'stop-color': stops[i].color
      }) + closeTag('stop');
    }

    defs += closeTag('linearGradient');
  }

  for (id in all.clipping) {
    def = all.clipping[id];

    defs += openTag('clipPath', {id: id});

    defs += openTag('rect', {
      x: 0,
      y: 0,
      width: def.width,
      height: def.height
    }) + closeTag('rect');

    defs += closeTag('clipPath');
  }

  return (defs.length > 0) ? openTag('defs') + defs + closeTag('defs') : '';
};

var object;

function emit$1(name, value, ns, prefixed) {
  object[prefixed || name] = value;
}

prototype$9.attributes = function(attr, item) {
  object = {};
  attr(emit$1, item, this);
  return object;
};

prototype$9.href = function(item) {
  var that = this,
      href = item.href,
      attr;

  if (href) {
    if (attr = that._hrefs && that._hrefs[href]) {
      return attr;
    } else {
      that.sanitizeURL(href).then(function(attr) {
        // rewrite to use xlink namespace
        // note that this will be deprecated in SVG 2.0
        attr['xlink:href'] = attr.href;
        attr.href = null;
        (that._hrefs || (that._hrefs = {}))[href] = attr;
      });
    }
  }
  return null;
};

prototype$9.mark = function(scene) {
  var renderer = this,
      mdef = Marks[scene.marktype],
      tag  = mdef.tag,
      defs = this._defs,
      str = '',
      style;

  if (tag !== 'g' && scene.interactive === false) {
    style = 'style="pointer-events: none;"';
  }

  // render opening group tag
  str += openTag('g', {
    'class': cssClass(scene),
    'clip-path': scene.clip ? clip(renderer, scene, scene.group) : null
  }, style);

  // render contained elements
  function process(item) {
    var href = renderer.href(item);
    if (href) str += openTag('a', href);

    style = (tag !== 'g') ? applyStyles(item, scene, tag, defs) : null;
    str += openTag(tag, renderer.attributes(mdef.attr, item), style);

    if (tag === 'text') {
      str += escape_text(textValue(item));
    } else if (tag === 'g') {
      str += openTag('path', renderer.attributes(mdef.background, item),
        applyStyles(item, scene, 'bgrect', defs)) + closeTag('path');

      str += openTag('g', renderer.attributes(mdef.foreground, item))
        + renderer.markGroup(item)
        + closeTag('g');
    }

    str += closeTag(tag);
    if (href) str += closeTag('a');
  }

  if (mdef.nested) {
    if (scene.items && scene.items.length) process(scene.items[0]);
  } else {
    visit(scene, process);
  }

  // render closing group tag
  return str + closeTag('g');
};

prototype$9.markGroup = function(scene) {
  var renderer = this,
      str = '';

  visit(scene, function(item) {
    str += renderer.mark(item);
  });

  return str;
};

function applyStyles(o, mark, tag, defs) {
  if (o == null) return '';
  var i, n, prop, name, value, s = '';

  if (tag === 'bgrect' && mark.interactive === false) {
    s += 'pointer-events: none;';
  }

  if (tag === 'text') {
    s += 'font: ' + font(o) + ';';
  }

  for (i=0, n=styleProperties.length; i<n; ++i) {
    prop = styleProperties[i];
    name = styles[prop];
    value = o[prop];

    if (value == null) {
      if (name === 'fill') {
        s += (s.length ? ' ' : '') + 'fill: none;';
      }
    } else {
      if (value.id) {
        // ensure definition is included
        defs.gradient[value.id] = value;
        value = 'url(#' + value.id + ')';
      }
      s += (s.length ? ' ' : '') + name + ': ' + value + ';';
    }
  }

  return s ? 'style="' + s + '"' : null;
}

function escape_text(s) {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

var Canvas$2 = 'canvas';
var PNG = 'png';
var SVG = 'svg';
var None$1 = 'none';

var RenderType = {
  Canvas: Canvas$2,
  PNG:    PNG,
  SVG:    SVG,
  None:   None$1
};

var modules = {};

modules[Canvas$2] = modules[PNG] = {
  renderer: CanvasRenderer,
  headless: CanvasRenderer,
  handler:  CanvasHandler
};

modules[SVG] = {
  renderer: SVGRenderer,
  headless: SVGStringRenderer,
  handler:  SVGHandler
};

modules[None$1] = {};

function renderModule(name, _) {
  name = String(name || '').toLowerCase();
  return arguments.length > 1 ? (modules[name] = _, this) : modules[name];
}

var TOLERANCE = 1e-9;

function sceneEqual(a, b, key) {
  return (a === b) ? true
    : (key === 'path') ? pathEqual(a, b)
    : (a instanceof Date && b instanceof Date) ? +a === +b
    : (isNumber(a) && isNumber(b)) ? Math.abs(a - b) <= TOLERANCE
    : (!a || !b || !isObject(a) && !isObject(b)) ? a == b
    : (a == null || b == null) ? false
    : objectEqual(a, b);
}

function pathEqual(a, b) {
  return sceneEqual(pathParse(a), pathParse(b));
}

function objectEqual(a, b) {
  var ka = Object.keys(a),
      kb = Object.keys(b),
      key, i;

  if (ka.length !== kb.length) return false;

  ka.sort();
  kb.sort();

  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i]) return false;
  }

  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!sceneEqual(a[key], b[key], key)) return false;
  }

  return typeof a === typeof b;
}

function UniqueList(idFunc) {
  var $ = idFunc || identity,
      list = [],
      ids = {};

  list.add = function(_) {
    var id = $(_);
    if (!ids[id]) {
      ids[id] = 1;
      list.push(_);
    }
    return list;
  };

  list.remove = function(_) {
    var id = $(_), idx;
    if (ids[id]) {
      ids[id] = 0;
      if ((idx = list.indexOf(_)) >= 0) {
        list.splice(idx, 1);
      }
    }
    return list;
  };

  return list;
}

var TUPLE_ID = 1;

/**
 * Returns the id of a tuple.
 * @param {Tuple} t - The input tuple.
 * @return the tuple id.
 */
function tupleid(t) {
  return t._id;
}

/**
 * Copy the values of one tuple to another (ignoring id and prev fields).
 * @param {Tuple} t - The tuple to copy from.
 * @param {Tuple} c - The tuple to write to.
 * @return The re-written tuple, same as the argument 'c'.
 */
function copy(t, c) {
  for (var k in t) {
    if (k !== '_id') c[k] = t[k];
  }
  return c;
}

/**
 * Ingest an object or value as a data tuple.
 * If the input value is an object, an id field will be added to it. For
 * efficiency, the input object is modified directly. A copy is not made.
 * If the input value is a literal, it will be wrapped in a new object
 * instance, with the value accessible as the 'data' property.
 * @param datum - The value to ingest.
 * @return {Tuple} The ingested data tuple.
 */
function ingest(datum) {
  var tuple = (datum === Object(datum)) ? datum : {data: datum};
  if (!tuple._id) tuple._id = ++TUPLE_ID;
  return tuple;
}

/**
 * Given a source tuple, return a derived copy.
 * @param {object} t - The source tuple.
 * @return {object} The derived tuple.
 */
function derive(t) {
  return ingest(copy(t, {}));
}

/**
 * Rederive a derived tuple by copying values from the source tuple.
 * @param {object} t - The source tuple.
 * @param {object} d - The derived tuple.
 * @return {object} The derived tuple.
 */
function rederive(t, d) {
  return copy(t, d);
}

/**
 * Replace an existing tuple with a new tuple.
 * The existing tuple will become the previous value of the new.
 * @param {object} t - The existing data tuple.
 * @param {object} d - The new tuple that replaces the old.
 * @return {object} The new tuple.
 */
function replace(t, d) {
  return d._id = t._id, d;
}

function isChangeSet(v) {
  return v && v.constructor === changeset;
}

function changeset() {
  var add = [],  // insert tuples
      rem = [],  // remove tuples
      mod = [],  // modify tuples
      remp = [], // remove by predicate
      modp = []; // modify by predicate

  return {
    constructor: changeset,
    insert: function(t) {
      var d = array(t), i = 0, n = d.length;
      for (; i<n; ++i) add.push(d[i]);
      return this;
    },
    remove: function(t) {
      var a = isFunction(t) ? remp : rem,
          d = array(t), i = 0, n = d.length;
      for (; i<n; ++i) a.push(d[i]);
      return this;
    },
    modify: function(t, field, value) {
      var m = {field: field, value: constant(value)};
      if (isFunction(t)) m.filter = t, modp.push(m);
      else m.tuple = t, mod.push(m);
      return this;
    },
    encode: function(t, set) {
      mod.push({tuple: t, field: set});
      return this;
    },
    pulse: function(pulse, tuples) {
      var out, i, n, m, f, t, id;

      // add
      for (i=0, n=add.length; i<n; ++i) {
        pulse.add.push(ingest(add[i]));
      }

      // remove
      for (out={}, i=0, n=rem.length; i<n; ++i) {
        t = rem[i];
        out[t._id] = t;
      }
      for (i=0, n=remp.length; i<n; ++i) {
        f = remp[i];
        tuples.forEach(function(t) {
          if (f(t)) out[t._id] = t;
        });
      }
      for (id in out) pulse.rem.push(out[id]);

      // modify
      function modify(t, f, v) {
        if (v) t[f] = v(t); else pulse.encode = f;
        out[t._id] = t;
      }
      for (out={}, i=0, n=mod.length; i<n; ++i) {
        m = mod[i];
        modify(m.tuple, m.field, m.value);
        pulse.modifies(m.field);
      }
      for (i=0, n=modp.length; i<n; ++i) {
        m = modp[i];
        f = m.filter;
        tuples.forEach(function(t) {
          if (f(t)) modify(t, m.field, m.value);
        });
        pulse.modifies(m.field);
      }
      for (id in out) pulse.mod.push(out[id]);

      return pulse;
    }
  };
}

var CACHE = '_:mod:_';

/**
 * Hash that tracks modifications to assigned values.
 * Callers *must* use the set method to update values.
 */
function Parameters() {
  Object.defineProperty(this, CACHE, {writable:true, value: {}});
}

var prototype$12 = Parameters.prototype;

/**
 * Set a parameter value. If the parameter value changes, the parameter
 * will be recorded as modified.
 * @param {string} name - The parameter name.
 * @param {number} index - The index into an array-value parameter. Ignored if
 *   the argument is undefined, null or less than zero.
 * @param {*} value - The parameter value to set.
 * @param {boolean} [force=false] - If true, records the parameter as modified
 *   even if the value is unchanged.
 * @return {Parameters} - This parameter object.
 */
prototype$12.set = function(name, index, value, force) {
  var o = this,
      v = o[name],
      mod = o[CACHE];

  if (index != null && index >= 0) {
    if (v[index] !== value || force) {
      v[index] = value;
      mod[index + ':' + name] = -1;
      mod[name] = -1;
    }
  } else if (v !== value || force) {
    o[name] = value;
    mod[name] = isArray(value) ? value.length : -1;
  }

  return o;
};

/**
 * Tests if one or more parameters has been modified. If invoked with no
 * arguments, returns true if any parameter value has changed. If the first
 * argument is array, returns trues if any parameter name in the array has
 * changed. Otherwise, tests if the given name and optional array index has
 * changed.
 * @param {string} name - The parameter name to test.
 * @param {number} [index=undefined] - The parameter array index to test.
 * @return {boolean} - Returns true if a queried parameter was modified.
 */
prototype$12.modified = function(name, index) {
  var mod = this[CACHE], k;
  if (!arguments.length) {
    for (k in mod) { if (mod[k]) return true; }
    return false;
  } else if (isArray(name)) {
    for (k=0; k<name.length; ++k) {
      if (mod[name[k]]) return true;
    }
    return false;
  }
  return (index != null && index >= 0)
    ? (index < mod[name] || !!mod[index + ':' + name])
    : !!mod[name];
};

/**
 * Clears the modification records. After calling this method,
 * all parameters are considered unmodified.
 */
prototype$12.clear = function() {
  return this[CACHE] = {}, this;
};

var OP_ID = 0;
var PULSE = 'pulse';
var NO_PARAMS = new Parameters();

// Boolean Flags
var SKIP     = 1;
var MODIFIED = 2;
/**
 * An Operator is a processing node in a dataflow graph.
 * Each operator stores a value and an optional value update function.
 * Operators can accept a hash of named parameters. Parameter values can
 * either be direct (JavaScript literals, arrays, objects) or indirect
 * (other operators whose values will be pulled dynamically). Operators
 * included as parameters will have this operator added as a dependency.
 * @constructor
 * @param {*} [init] - The initial value for this operator.
 * @param {function(object, Pulse)} [update] - An update function. Upon
 *   evaluation of this operator, the update function will be invoked and the
 *   return value will be used as the new value of this operator.
 * @param {object} [params] - The parameters for this operator.
 * @param {boolean} [react=true] - Flag indicating if this operator should
 *   listen for changes to upstream operators included as parameters.
 * @see parameters
 */
function Operator(init, update, params, react) {
  this.id = ++OP_ID;
  this.value = init;
  this.stamp = -1;
  this.rank = -1;
  this.qrank = -1;
  this.flags = 0;

  if (update) {
    this._update = update;
  }
  if (params) this.parameters(params, react);
}

var prototype$11 = Operator.prototype;

/**
 * Returns a list of target operators dependent on this operator.
 * If this list does not exist, it is created and then returned.
 * @return {UniqueList}
 */
prototype$11.targets = function() {
  return this._targets || (this._targets = UniqueList(id));
};

/**
 * Sets the value of this operator.
 * @param {*} value - the value to set.
 * @return {Number} Returns 1 if the operator value has changed
 *   according to strict equality, returns 0 otherwise.
 */
prototype$11.set = function(value) {
  return this.value !== value ? (this.value = value, 1) : 0;
};

function flag(bit) {
  return function(state) {
    var f = this.flags;
    if (arguments.length === 0) return !!(f & bit);
    this.flags = state ? (f | bit) : (f & ~bit);
    return this;
  };
}

/**
 * Indicates that operator evaluation should be skipped on the next pulse.
 * This operator will still propagate incoming pulses, but its update function
 * will not be invoked. The skip flag is reset after every pulse, so calling
 * this method will affect processing of the next pulse only.
 */
prototype$11.skip = flag(SKIP);

/**
 * Indicates that this operator's value has been modified on its most recent
 * pulse. Normally modification is checked via strict equality; however, in
 * some cases it is more efficient to update the internal state of an object.
 * In those cases, the modified flag can be used to trigger propagation. Once
 * set, the modification flag persists across pulses until unset. The flag can
 * be used with the last timestamp to test if a modification is recent.
 */
prototype$11.modified = flag(MODIFIED);

/**
 * Sets the parameters for this operator. The parameter values are analyzed for
 * operator instances. If found, this operator will be added as a dependency
 * of the parameterizing operator. Operator values are dynamically marshalled
 * from each operator parameter prior to evaluation. If a parameter value is
 * an array, the array will also be searched for Operator instances. However,
 * the search does not recurse into sub-arrays or object properties.
 * @param {object} params - A hash of operator parameters.
 * @param {boolean} [react=true] - A flag indicating if this operator should
 *   automatically update (react) when parameter values change. In other words,
 *   this flag determines if the operator registers itself as a listener on
 *   any upstream operators included in the parameters.
 * @return {Operator[]} - An array of upstream dependencies.
 */
prototype$11.parameters = function(params, react) {
  react = react !== false;
  var self = this,
      argval = (self._argval = self._argval || new Parameters()),
      argops = (self._argops = self._argops || []),
      deps = [],
      name, value, n, i;

  function add(name, index, value) {
    if (value instanceof Operator) {
      if (value !== self) {
        if (react) value.targets().add(self);
        deps.push(value);
      }
      argops.push({op:value, name:name, index:index});
    } else {
      argval.set(name, index, value);
    }
  }

  for (name in params) {
    value = params[name];

    if (name === PULSE) {
      array(value).forEach(function(op) {
        if (!(op instanceof Operator)) {
          error('Pulse parameters must be operator instances.');
        } else if (op !== self) {
          op.targets().add(self);
          deps.push(op);
        }
      });
      self.source = value;
    } else if (isArray(value)) {
      argval.set(name, -1, Array(n = value.length));
      for (i=0; i<n; ++i) add(name, i, value[i]);
    } else {
      add(name, -1, value);
    }
  }

  this.marshall().clear(); // initialize values
  return deps;
};

/**
 * Internal method for marshalling parameter values.
 * Visits each operator dependency to pull the latest value.
 * @return {Parameters} A Parameters object to pass to the update function.
 */
prototype$11.marshall = function(stamp) {
  var argval = this._argval || NO_PARAMS,
      argops = this._argops, item, i, n, op, mod;

  if (argops && (n = argops.length)) {
    for (i=0; i<n; ++i) {
      item = argops[i];
      op = item.op;
      mod = op.modified() && op.stamp === stamp;
      argval.set(item.name, item.index, op.value, mod);
    }
  }
  return argval;
};

/**
 * Delegate method to perform operator processing.
 * Subclasses can override this method to perform custom processing.
 * By default, it marshalls parameters and calls the update function
 * if that function is defined. If the update function does not
 * change the operator value then StopPropagation is returned.
 * If no update function is defined, this method does nothing.
 * @param {Pulse} pulse - the current dataflow pulse.
 * @return The output pulse or StopPropagation. A falsy return value
 *   (including undefined) will let the input pulse pass through.
 */
prototype$11.evaluate = function(pulse) {
  if (this._update) {
    var params = this.marshall(pulse.stamp),
        v = this._update(params, pulse);

    params.clear();
    if (v !== this.value) {
      this.value = v;
    } else if (!this.modified()) {
      return pulse.StopPropagation;
    }
  }
};

/**
 * Run this operator for the current pulse. If this operator has already
 * been run at (or after) the pulse timestamp, returns StopPropagation.
 * Internally, this method calls {@link evaluate} to perform processing.
 * If {@link evaluate} returns a falsy value, the input pulse is returned.
 * This method should NOT be overridden, instead overrride {@link evaluate}.
 * @param {Pulse} pulse - the current dataflow pulse.
 * @return the output pulse for this operator (or StopPropagation)
 */
prototype$11.run = function(pulse) {
  if (pulse.stamp <= this.stamp) return pulse.StopPropagation;
  var rv = this.skip() ? (this.skip(false), 0) : this.evaluate(pulse);
  return this.stamp = pulse.stamp, this.pulse = rv || pulse;
};

/**
 * Add an operator to the dataflow graph. This function accepts a
 * variety of input argument types. The basic signature supports an
 * initial value, update function and parameters. If the first parameter
 * is an Operator instance, it will be added directly. If it is a
 * constructor for an Operator subclass, a new instance will be instantiated.
 * Otherwise, if the first parameter is a function instance, it will be used
 * as the update function and a null initial value is assumed.
 * @param {*} init - One of: the operator to add, the initial value of
 *   the operator, an operator class to instantiate, or an update function.
 * @param {function} [update] - The operator update function.
 * @param {object} [params] - The operator parameters.
 * @param {boolean} [react=true] - Flag indicating if this operator should
 *   listen for changes to upstream operators included as parameters.
 * @return {Operator} - The added operator.
 */
function add$1(init, update, params, react) {
  var shift = 1,
      op = (init instanceof Operator) ? init
        : init && init.prototype instanceof Operator ? new init()
        : isFunction(init) ? new Operator(null, init)
        : (shift = 0, new Operator(init, update));

  this.rank(op);
  if (shift) react = params, params = update;
  if (params) this.connect(op, op.parameters(params, react));
  this.touch(op);

  return op;
}

/**
 * Connect a target operator as a dependent of source operators.
 * If necessary, this method will rerank the target operator and its
 * dependents to ensure propagation proceeds in a topologically sorted order.
 * @param {Operator} target - The target operator.
 * @param {Array<Operator>} - The source operators that should propagate
 *   to the target operator.
 */
function connect(target, sources) {
  var targetRank = target.rank, i, n;

  for (i=0, n=sources.length; i<n; ++i) {
    if (targetRank < sources[i].rank) {
      this.rerank(target);
      return;
    }
  }
}

var STREAM_ID = 0;

/**
 * Models an event stream.
 * @constructor
 * @param {function(Object, number): boolean} [filter] - Filter predicate.
 *   Events pass through when truthy, events are suppressed when falsy.
 * @param {function(Object): *} [apply] - Applied to input events to produce
 *   new event values.
 * @param {function(Object)} [receive] - Event callback function to invoke
 *   upon receipt of a new event. Use to override standard event processing.
 */
function EventStream(filter, apply, receive) {
  this.id = ++STREAM_ID;
  this.value = null;
  if (receive) this.receive = receive;
  if (filter) this._filter = filter;
  if (apply) this._apply = apply;
}

/**
 * Creates a new event stream instance with the provided
 * (optional) filter, apply and receive functions.
 * @param {function(Object, number): boolean} [filter] - Filter predicate.
 *   Events pass through when truthy, events are suppressed when falsy.
 * @param {function(Object): *} [apply] - Applied to input events to produce
 *   new event values.
 * @see EventStream
 */
function stream(filter, apply, receive) {
  return new EventStream(filter, apply, receive);
}

var prototype$13 = EventStream.prototype;

prototype$13._filter = truthy;

prototype$13._apply = identity;

prototype$13.targets = function() {
  return this._targets || (this._targets = UniqueList(id));
};

prototype$13.consume = function(_) {
  if (!arguments.length) return !!this._consume;
  return (this._consume = !!_, this);
};

prototype$13.receive = function(evt) {
  if (this._filter(evt)) {
    var val = (this.value = this._apply(evt)),
        trg = this._targets,
        n = trg ? trg.length : 0,
        i = 0;

    for (; i<n; ++i) trg[i].receive(val);

    if (this._consume) {
      evt.preventDefault();
      evt.stopPropagation();
    }
  }
};

prototype$13.filter = function(filter) {
  var s = stream(filter);
  return (this.targets().add(s), s);
};

prototype$13.apply = function(apply) {
  var s = stream(null, apply);
  return (this.targets().add(s), s);
};

prototype$13.merge = function() {
  var s = stream();

  this.targets().add(s);
  for (var i=0, n=arguments.length; i<n; ++i) {
    arguments[i].targets().add(s);
  }

  return s;
};

prototype$13.throttle = function(pause) {
  var t = -1;
  return this.filter(function() {
    var now = Date.now();
    return (now - t) > pause ? (t = now, 1) : 0;
  });
};

prototype$13.debounce = function(delay) {
  var s = stream(), evt = null, tid = null;

  function callback() {
    var df = evt.dataflow;
    s.receive(evt);
    evt = null; tid = null;
    if (df && df.run) df.run();
  }

  this.targets().add(stream(null, null, function(e) {
    evt = e;
    if (tid) clearTimeout(tid);
    tid = setTimeout(callback, delay);
  }));

  return s;
};

prototype$13.between = function(a, b) {
  var active = false;
  a.targets().add(stream(null, null, function() { active = true; }));
  b.targets().add(stream(null, null, function() { active = false; }));
  return this.filter(function() { return active; });
};

/**
 * Create a new event stream from an event source.
 * @param {object} source - The event source to monitor. The input must
 *  support the addEventListener method.
 * @param {string} type - The event type.
 * @param {function(object): boolean} [filter] - Event filter function.
 * @param {function(object): *} [apply] - Event application function.
 *   If provided, this function will be invoked and the result will be
 *   used as the downstream event value.
 * @return {EventStream}
 */
function events(source, type, filter, apply) {
  var df = this,
      s = stream(filter, apply),
      send = function(e) {
        e.dataflow = df;
        s.receive(e);
        df.run();
      },
      sources;

  if (typeof source === 'string' && typeof document !== 'undefined') {
    sources = document.querySelectorAll(source);
  } else {
    sources = array(source);
  }

  for (var i=0, n=sources.length; i<n; ++i) {
    sources[i].addEventListener(type, send);
  }

  return s;
}

var SKIP$1 = {skip: true};

/**
 * Perform operator updates in response to events. Applies an
 * update function to compute a new operator value. If the update function
 * returns a {@link ChangeSet}, the operator will be pulsed with those tuple
 * changes. Otherwise, the operator value will be updated to the return value.
 * @param {EventStream|Operator} source - The event source to react to.
 *   This argument can be either an EventStream or an Operator.
 * @param {Operator|function(object):Operator} target - The operator to update.
 *   This argument can either be an Operator instance or (if the source
 *   argument is an EventStream), a function that accepts an event object as
 *   input and returns an Operator to target.
 * @param {function(Parameters,Event): *} [update] - Optional update function
 *   to compute the new operator value, or a literal value to set. Update
 *   functions expect to receive a parameter object and event as arguments.
 *   This function can either return a new operator value or (if the source
 *   argument is an EventStream) a {@link ChangeSet} instance to pulse
 *   the target operator with tuple changes.
 * @param {object} [params] - The update function parameters.
 * @param {object} [options] - Additional options hash. If not overridden,
 *   updated operators will be skipped by default.
 * @param {boolean} [options.skip] - If true, the operator will
 *  be skipped: it will not be evaluated, but its dependents will be.
 * @param {boolean} [options.force] - If true, the operator will
 *   be re-evaluated even if its value has not changed.
 * @return {Dataflow}
 */
function on(source, target, update, params, options) {
  var fn = source instanceof Operator ? onOperator : onStream;
  return fn(this, source, target, update, params, options), this;
}

function onStream(df, stream, target, update, params, options) {
  var opt = extend({}, options, SKIP$1), func, op;

  if (!isFunction(target)) target = constant(target);

  if (update === undefined) {
    func = function(e) {
      df.touch(target(e));
    };
  } else if (isFunction(update)) {
    op = new Operator(null, update, params, false);
    func = function(e) {
      var t = target(e),
          v = (op.evaluate(e), op.value);
      isChangeSet(v) ? df.pulse(t, v, options) : df.update(t, v, opt);
    };
  } else {
    func = function(e) {
      df.update(target(e), update, opt);
    };
  }

  stream.apply(func);
}

function onOperator(df, source, target, update, params, options) {
  var func, op;

  if (update === undefined) {
    op = target;
  } else {
    func = isFunction(update) ? update : constant(update);
    update = !target ? func : function(_, pulse) {
      var value = func(_, pulse);
      return target.skip()
        ? value
        : (target.skip(true).value = value);
    };

    op = new Operator(null, update, params, false);
    op.modified(options && options.force);
    op.rank = 0;

    if (target) {
      op.skip(true); // skip first invocation
      op.value = target.value;
      op.targets().add(target);
    }
  }

  source.targets().add(op);
}

/**
 * Assigns a rank to an operator. Ranks are assigned in increasing order
 * by incrementing an internal rank counter.
 * @param {Operator} op - The operator to assign a rank.
 */
function rank(op) {
  op.rank = ++this._rank;
}

/**
 * Re-ranks an operator and all downstream target dependencies. This
 * is necessary when upstream depencies of higher rank are added to
 * a target operator.
 * @param {Operator} op - The operator to re-rank.
 */
function rerank(op) {
  var queue = [op],
      cur, list, i;

  while (queue.length) {
    this.rank(cur = queue.pop());
    if (list = cur._targets) {
      for (i=list.length; --i >= 0;) {
        queue.push(list[i]);
      }
    }
  }
}

/**
 * Sentinel value indicating pulse propagation should stop.
 */
var StopPropagation = {};

// Pulse visit type flags
var ADD       = (1 << 0);
var REM       = (1 << 1);
var MOD       = (1 << 2);
var ADD_REM   = ADD | REM;
var ADD_MOD   = ADD | MOD;
var ALL       = ADD | REM | MOD;
var REFLOW    = (1 << 3);
var SOURCE    = (1 << 4);
var NO_SOURCE = (1 << 5);
var NO_FIELDS = (1 << 6);
/**
 * A Pulse enables inter-operator communication during a run of the
 * dataflow graph. In addition to the current timestamp, a pulse may also
 * contain a change-set of added, removed or modified data tuples, as well as
 * a pointer to a full backing data source. Tuple change sets may not
 * be fully materialized; for example, to prevent needless array creation
 * a change set may include larger arrays and corresponding filter functions.
 * The pulse provides a {@link visit} method to enable proper and efficient
 * iteration over requested data tuples.
 *
 * In addition, each pulse can track modification flags for data tuple fields.
 * Responsible transform operators should call the {@link modifies} method to
 * indicate changes to data fields. The {@link modified} method enables
 * querying of this modification state.
 *
 * @constructor
 * @param {Dataflow} dataflow - The backing dataflow instance.
 * @param {number} stamp - The current propagation timestamp.
 * @param {string} [encode] - An optional encoding set name, which is then
 *   accessible as Pulse.encode. Operators can respond to (or ignore) this
 *   setting as appropriate. This parameter can be used in conjunction with
 *   the Encode transform in the vega-encode module.
 */
function Pulse(dataflow, stamp, encode) {
  this.dataflow = dataflow;
  this.stamp = stamp == null ? -1 : stamp;
  this.add = [];
  this.rem = [];
  this.mod = [];
  this.fields = null;
  this.encode = encode || null;
}

var prototype$14 = Pulse.prototype;

/**
 * Sentinel value indicating pulse propagation should stop.
 */
prototype$14.StopPropagation = StopPropagation;

/**
 * Boolean flag indicating ADD (added) tuples.
 */
prototype$14.ADD = ADD;

/**
 * Boolean flag indicating REM (removed) tuples.
 */
prototype$14.REM = REM;

/**
 * Boolean flag indicating MOD (modified) tuples.
 */
prototype$14.MOD = MOD;

/**
 * Boolean flag indicating ADD (added) and REM (removed) tuples.
 */
prototype$14.ADD_REM = ADD_REM;

/**
 * Boolean flag indicating ADD (added) and MOD (modified) tuples.
 */
prototype$14.ADD_MOD = ADD_MOD;

/**
 * Boolean flag indicating ADD, REM and MOD tuples.
 */
prototype$14.ALL = ALL;

/**
 * Boolean flag indicating all tuples in a data source
 * except for the ADD, REM and MOD tuples.
 */
prototype$14.REFLOW = REFLOW;

/**
 * Boolean flag indicating a 'pass-through' to a
 * backing data source, ignoring ADD, REM and MOD tuples.
 */
prototype$14.SOURCE = SOURCE;

/**
 * Boolean flag indicating that source data should be
 * suppressed when creating a forked pulse.
 */
prototype$14.NO_SOURCE = NO_SOURCE;

/**
 * Boolean flag indicating that field modifications should be
 * suppressed when creating a forked pulse.
 */
prototype$14.NO_FIELDS = NO_FIELDS;

/**
 * Creates a new pulse based on the values of this pulse.
 * The dataflow, time stamp and field modification values are copied over.
 * By default, new empty ADD, REM and MOD arrays are created.
 * @param {number} flags - Integer of boolean flags indicating which (if any)
 *   tuple arrays should be copied to the new pulse. The supported flag values
 *   are ADD, REM and MOD. Array references are copied directly: new array
 *   instances are not created.
 * @return {Pulse} - The forked pulse instance.
 * @see init
 */
prototype$14.fork = function(flags) {
  return new Pulse(this.dataflow).init(this, flags);
};

/**
 * Returns a pulse that adds all tuples from a backing source. This is
 * useful for cases where operators are added to a dataflow after an
 * upstream data pipeline has already been processed, ensuring that
 * new operators can observe all tuples within a stream.
 * @return {Pulse} - A pulse instance with all source tuples included
 *   in the add array. If the current pulse already has all source
 *   tuples in its add array, it is returned directly. If the current
 *   pulse does not have a backing source, it is returned directly.
 */
prototype$14.addAll = function() {
  var p = this;
  return (!this.source || this.source.length === this.add.length) ? p
    : (p = new Pulse(this.dataflow).init(this), p.add = p.source, p);
};

/**
 * Initialize this pulse based on the values of another pulse. This method
 * is used internally by {@link fork} to initialize a new forked tuple.
 * The dataflow, time stamp and field modification values are copied over.
 * By default, new empty ADD, REM and MOD arrays are created.
 * @param {Pulse} src - The source pulse to copy from.
 * @param {number} flags - Integer of boolean flags indicating which (if any)
 *   tuple arrays should be copied to the new pulse. The supported flag values
 *   are ADD, REM and MOD. Array references are copied directly: new array
 *   instances are not created. By default, source data arrays are copied
 *   to the new pulse. Use the NO_SOURCE flag to enforce a null source.
 * @return {Pulse} - Returns this Pulse instance.
 */
prototype$14.init = function(src, flags) {
  var p = this;
  p.stamp = src.stamp;
  p.encode = src.encode;
  if (src.fields && !(flags & NO_FIELDS)) p.fields = src.fields;
  p.add = (flags & ADD) ? (p.addF = src.addF, src.add) : (p.addF = null, []);
  p.rem = (flags & REM) ? (p.remF = src.remF, src.rem) : (p.remF = null, []);
  p.mod = (flags & MOD) ? (p.modF = src.modF, src.mod) : (p.modF = null, []);
  p.source = (flags & NO_SOURCE)
    ? (p.srcF = null, null)
    : (p.srcF = src.srcF, src.source);
  return p;
};

/**
 * Schedules a function to run after pulse propagation completes.
 * @param {function} func - The function to run.
 */
prototype$14.runAfter = function(func) {
  this.dataflow.runAfter(func);
};

/**
 * Indicates if tuples have been added, removed or modified.
 * @param {number} [flags] - The tuple types (ADD, REM or MOD) to query.
 *   Defaults to ALL, returning true if any tuple type has changed.
 * @return {boolean} - Returns true if one or more queried tuple types have
 *   changed, false otherwise.
 */
prototype$14.changed = function(flags) {
  var f = flags || ALL;
  return ((f & ADD) && this.add.length)
      || ((f & REM) && this.rem.length)
      || ((f & MOD) && this.mod.length);
};

/**
 * Forces a "reflow" of tuple values, such that all tuples in the backing
 * source are added to the MOD set, unless already present in the ADD set.
 * @param {boolean} [fork=false] - If true, returns a forked copy of this
 *   pulse, and invokes reflow on that derived pulse.
 * @return {Pulse} - The reflowed pulse instance.
 */
prototype$14.reflow = function(fork) {
  if (fork) return this.fork(ALL).reflow();

  var len = this.add.length,
      src = this.source && this.source.length;
  if (src && src !== len) {
    this.mod = this.source;
    if (len) this.filter(MOD, filter(this, ADD));
  }
  return this;
};

/**
 * Marks one or more data field names as modified to assist dependency
 * tracking and incremental processing by transform operators.
 * @param {string|Array<string>} _ - The field(s) to mark as modified.
 * @return {Pulse} - This pulse instance.
 */
prototype$14.modifies = function(_) {
  var fields = array(_),
      hash = this.fields || (this.fields = {});
  fields.forEach(function(f) { hash[f] = true; });
  return this;
};

/**
 * Checks if one or more data fields have been modified during this pulse
 * propagation timestamp.
 * @param {string|Array<string>} _ - The field(s) to check for modified.
 * @return {boolean} - Returns true if any of the provided fields has been
 *   marked as modified, false otherwise.
 */
prototype$14.modified = function(_) {
  var fields = this.fields;
  return !(this.mod.length && fields) ? false
    : !arguments.length ? !!fields
    : isArray(_) ? _.some(function(f) { return fields[f]; })
    : fields[_];
};

/**
 * Adds a filter function to one more tuple sets. Filters are applied to
 * backing tuple arrays, to determine the actual set of tuples considered
 * added, removed or modified. They can be used to delay materialization of
 * a tuple set in order to avoid expensive array copies. In addition, the
 * filter functions can serve as value transformers: unlike standard predicate
 * function (which return boolean values), Pulse filters should return the
 * actual tuple value to process. If a tuple set is already filtered, the
 * new filter value will be appended into a conjuntive ('and') query.
 * @param {number} flags - Flags indicating the tuple set(s) to filter.
 * @param {function(*):object} filter - Filter function that will be applied
 *   to the tuple set array, and should return a data tuple if the value
 *   should be included in the tuple set, and falsy (or null) otherwise.
 * @return {Pulse} - Returns this pulse instance.
 */
prototype$14.filter = function(flags, filter) {
  var p = this;
  if (flags & ADD) p.addF = addFilter(p.addF, filter);
  if (flags & REM) p.remF = addFilter(p.remF, filter);
  if (flags & MOD) p.modF = addFilter(p.modF, filter);
  if (flags & SOURCE) p.srcF = addFilter(p.srcF, filter);
  return p;
};

function addFilter(a, b) {
  return a ? function(t,i) { return a(t,i) && b(t,i); } : b;
}

/**
 * Materialize one or more tuple sets in this pulse. If the tuple set(s) have
 * a registered filter function, it will be applied and the tuple set(s) will
 * be replaced with materialized tuple arrays.
 * @param {number} flags - Flags indicating the tuple set(s) to materialize.
 * @return {Pulse} - Returns this pulse instance.
 */
prototype$14.materialize = function(flags) {
  flags = flags || ALL;
  var p = this;
  if ((flags & ADD) && p.addF) { p.add = p.add.filter(p.addF); p.addF = null; }
  if ((flags & REM) && p.remF) { p.rem = p.rem.filter(p.remF); p.remF = null; }
  if ((flags & MOD) && p.modF) { p.mod = p.mod.filter(p.modF); p.modF = null; }
  if ((flags & SOURCE) && p.srcF) {
    p.source = p.source.filter(p.srcF); p.srcF = null;
  }
  return p;
};

function filter(pulse, flags) {
  var map = {};
  pulse.visit(flags, function(t) { map[t._id] = 1; });
  return function(t) { return map[t._id] ? null : t; };
}

/**
 * Visit one or more tuple sets in this pulse.
 * @param {number} flags - Flags indicating the tuple set(s) to visit.
 *   Legal values are ADD, REM, MOD and SOURCE (if a backing data source
 *   has been set).
 * @param {function(object):*} - Visitor function invoked per-tuple.
 * @return {Pulse} - Returns this pulse instance.
 */
prototype$14.visit = function(flags, visitor) {
  var v = visitor, src, sum;

  if (flags & SOURCE) {
    visitArray(this.source, this.srcF, v);
    return this;
  }

  if (flags & ADD) visitArray(this.add, this.addF, v);
  if (flags & REM) visitArray(this.rem, this.remF, v);
  if (flags & MOD) visitArray(this.mod, this.modF, v);

  if ((flags & REFLOW) && (src = this.source)) {
    sum = this.add.length + this.mod.length;
    if (sum === src.length) {
      // do nothing
    } else if (sum) {
      visitArray(src, filter(this, ADD_MOD), v);
    } else {
      // if no add/rem/mod tuples, visit source
      visitArray(src, this.srcF, v);
    }
  }

  return this;
};

var NO_OPT = {skip: false, force: false};

/**
 * Touches an operator, scheduling it to be evaluated. If invoked outside of
 * a pulse propagation, the operator will be evaluated the next time this
 * dataflow is run. If invoked in the midst of pulse propagation, the operator
 * will be queued for evaluation if and only if the operator has not yet been
 * evaluated on the current propagation timestamp.
 * @param {Operator} op - The operator to touch.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
function touch(op, options) {
  var opt = options || NO_OPT;
  if (this._pulse) {
    this._enqueue(op);
  } else {
    this._touched.add(op);
  }
  if (opt.skip) op.skip(true);
  return this;
}

/**
 * Updates the value of the given operator.
 * @param {Operator} op - The operator to update.
 * @param {*} value - The value to set.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.force] - If true, the operator will
 *   be re-evaluated even if its value has not changed.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
function update(op, value, options) {
  var opt = options || NO_OPT;
  if (op.set(value) || opt.force) {
    this.touch(op, opt);
  }
  return this;
}

/**
 * Pulses an operator with a changeset of tuples. If invoked outside of
 * a pulse propagation, the pulse will be applied the next time this
 * dataflow is run. If invoked in the midst of pulse propagation, the pulse
 * will be added to the set of active pulses and will be applied if and
 * only if the target operator has not yet been evaluated on the current
 * propagation timestamp.
 * @param {Operator} op - The operator to pulse.
 * @param {ChangeSet} value - The tuple changeset to apply.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
function pulse(op, changeset, options) {
  var p = new Pulse(this, this._clock + (this._pulse ? 0 : 1));
  p.target = op;
  this._pulses[op.id] = changeset.pulse(p, op.value);
  return this.touch(op, options || NO_OPT);
}

function ingest$1(target, data, format) {
  return this.pulse(target, this.changeset().insert(read(data, format)));
}

function loadPending(df) {
  var accept, reject,
      pending = new Promise(function(a, r) {
        accept = a;
        reject = r;
      });

  pending.requests = 0;

  pending.done = function() {
    if (--pending.requests === 0) {
      df.runAfter(function() {
        df._pending = null;
        try {
          df.run();
          accept(df);
        } catch (err) {
          reject(err);
        }
      });
    }
  }

  return (df._pending = pending);
}

function request$1(target, url, format) {
  var df = this,
      pending = df._pending || loadPending(df);

  pending.requests += 1;

  df.loader()
    .load(url, {context:'dataflow'})
    .then(
      function(data) {
        df.ingest(target, data, format);
      },
      function(error) {
        df.warn('Loading failed: ' + url, error);
        pending.done();
      })
    .then(pending.done)
    .catch(function(error) { df.warn(error); });
}

/**
 * Represents a set of multiple pulses. Used as input for operators
 * that accept multiple pulses at a time. Contained pulses are
 * accessible via the public "pulses" array property. This pulse doe
 * not carry added, removed or modified tuples directly. However,
 * the visit method can be used to traverse all such tuples contained
 * in sub-pulses with a timestamp matching this parent multi-pulse.
 * @constructor
 * @param {Dataflow} dataflow - The backing dataflow instance.
 * @param {number} stamp - The timestamp.
 * @param {Array<Pulse>} pulses - The sub-pulses for this multi-pulse.
 */
function MultiPulse(dataflow, stamp, pulses, encode) {
  var p = this,
      c = 0,
      pulse, hash, i, n, f;

  this.dataflow = dataflow;
  this.stamp = stamp;
  this.fields = null;
  this.encode = encode || null;
  this.pulses = pulses;

  for (i=0, n=pulses.length; i<n; ++i) {
    pulse = pulses[i];
    if (pulse.stamp !== stamp) continue;

    if (pulse.fields) {
      hash = p.fields || (p.fields = {});
      for (f in pulse.fields) { hash[f] = 1; }
    }

    if (pulse.changed(p.ADD)) c |= p.ADD;
    if (pulse.changed(p.REM)) c |= p.REM;
    if (pulse.changed(p.MOD)) c |= p.MOD;
  }

  this.changes = c;
}

var prototype$15 = inherits(MultiPulse, Pulse);

/**
 * Creates a new pulse based on the values of this pulse.
 * The dataflow, time stamp and field modification values are copied over.
 * @return {Pulse}
 */
prototype$15.fork = function() {
  if (arguments.length && (arguments[0] & Pulse.prototype.ALL)) {
    error('MultiPulse fork does not support tuple change sets.');
  }
  return new Pulse(this.dataflow).init(this, 0);
};

prototype$15.changed = function(flags) {
  return this.changes & flags;
};

prototype$15.modified = function(_) {
  var p = this, fields = p.fields;
  return !(fields && (p.changes & p.MOD)) ? 0
    : isArray(_) ? _.some(function(f) { return fields[f]; })
    : fields[_];
};

prototype$15.filter = function() {
  error('MultiPulse does not support filtering.');
};

prototype$15.materialize = function() {
  error('MultiPulse does not support materialization.');
};

prototype$15.visit = function(flags, visitor) {
  var pulses = this.pulses, i, n;

  for (i=0, n=pulses.length; i<n; ++i) {
    if (pulses[i].stamp === this.stamp) {
      pulses[i].visit(flags, visitor);
    }
  }

  return this;
};

/**
 * Runs the dataflow. This method will increment the current timestamp
 * and process all updated, pulsed and touched operators. When run for
 * the first time, all registered operators will be processed. If there
 * are pending data loading operations, this method will return immediately
 * without evaluating the dataflow. Instead, the dataflow will be
 * asynchronously invoked when data loading completes. To track when dataflow
 * evaluation completes, use the {@link runAsync} method instead.
 * @param {string} [encode] - The name of an encoding set to invoke during
 *   propagation. This value is added to generated Pulse instances;
 *   operators can then respond to (or ignore) this setting as appropriate.
 *   This parameter can be used in conjunction with the Encode transform in
 *   the vega-encode module.
 */
function run(encode) {
  if (!this._touched.length) {
    return 0; // nothing to do!
  }

  if (this._pending) {
    this.info('Awaiting requests, delaying dataflow run.');
    return 0;
  }

  var df = this,
      count = 0,
      level = df.logLevel(),
      op, next, dt;

  df._pulse = new Pulse(df, ++df._clock, encode);

  if (level >= Info) {
    dt = Date.now();
    df.debug('-- START PROPAGATION (' + df._clock + ') -----');
  }

  // initialize queue, reset touched operators
  df._touched.forEach(function(op) { df._enqueue(op, true); });
  df._touched = UniqueList(id);

  try {
    while (df._heap.size() > 0) {
      op = df._heap.pop();

      // re-queue if rank changes
      if (op.rank !== op.qrank) { df._enqueue(op, true); continue; }

      // otherwise, evaluate the operator
      next = op.run(df._getPulse(op, encode));

      if (level >= Debug) {
        df.debug(op.id, next === StopPropagation ? 'STOP' : next, op);
      }

      // propagate the pulse
      if (next !== StopPropagation) {
        df._pulse = next;
        if (op._targets) op._targets.forEach(function(op) { df._enqueue(op); });
      }

      // increment visit counter
      ++count;
    }
  } catch (err) {
    df.error(err);
  }

  // reset pulse map
  df._pulses = {};
  df._pulse = null;

  if (level >= Info) {
    dt = Date.now() - dt;
    df.info('> Pulse ' + df._clock + ': ' + count + ' operators; ' + dt + 'ms');
  }

  // invoke callbacks queued via runAfter
  if (df._postrun.length) {
    var postrun = df._postrun;
    df._postrun = [];
    postrun.forEach(function(f) {
      try { f(df); } catch (err) { df.error(err); }
    });
  }

  return count;
}

/**
 * Runs the dataflow and returns a Promise that resolves when the
 * propagation cycle completes. The standard run method may exit early
 * if there are pending data loading operations. In contrast, this
 * method returns a Promise to allow callers to receive notification
 * when dataflow evaluation completes.
 * @return {Promise} - A promise that resolves to this dataflow.
 */
function runAsync() {
  return this._pending || Promise.resolve(this.run());
}

/**
 * Schedules a callback function to be invoked after the current pulse
 * propagation completes. If no propagation is currently occurring,
 * the function is invoked immediately.
 * @param {function(Dataflow)} callback - The callback function to run.
 *   The callback will be invoked with this Dataflow instance as its
 *   sole argument.
 */
function runAfter(callback) {
  if (this._pulse) {
    // pulse propagation is currently running, queue to run after
    this._postrun.push(callback);
  } else {
    // pulse propagation already complete, invoke immediately
    try { callback(this); } catch (err) { this.error(err); }
  }
}

/**
 * Enqueue an operator into the priority queue for evaluation. The operator
 * will be enqueued if it has no registered pulse for the current cycle, or if
 * the force argument is true. Upon enqueue, this method also sets the
 * operator's qrank to the current rank value.
 * @param {Operator} op - The operator to enqueue.
 * @param {boolean} [force] - A flag indicating if the operator should be
 *   forceably added to the queue, even if it has already been previously
 *   enqueued during the current pulse propagation. This is useful when the
 *   dataflow graph is dynamically modified and the operator rank changes.
 */
function enqueue(op, force) {
  var p = !this._pulses[op.id];
  if (p) this._pulses[op.id] = this._pulse;
  if (p || force) {
    op.qrank = op.rank;
    this._heap.push(op);
  }
}

/**
 * Provide a correct pulse for evaluating an operator. If the operator has an
 * explicit source operator, we will try to pull the pulse(s) from it.
 * If there is an array of source operators, we build a multi-pulse.
 * Otherwise, we return a current pulse with correct source data.
 * If the pulse is the pulse map has an explicit target set, we use that.
 * Else if the pulse on the upstream source operator is current, we use that.
 * Else we use the pulse from the pulse map, but copy the source tuple array.
 * @param {Operator} op - The operator for which to get an input pulse.
 * @param {string} [encode] - An (optional) encoding set name with which to
 *   annotate the returned pulse. See {@link run} for more information.
 */
function getPulse(op, encode) {
  var s = op.source,
      stamp = this._clock,
      p;

  if (s && isArray(s)) {
    p = s.map(function(_) { return _.pulse; });
    return new MultiPulse(this, stamp, p, encode);
  } else {
    s = s && s.pulse;
    p = this._pulses[op.id];
    if (s && s !== StopPropagation) {
      if (s.stamp === stamp && p.target !== op) p = s;
      else p.source = s.source;
    }
    return p;
  }
}

function Heap(comparator) {
  this.cmp = comparator;
  this.nodes = [];
}

var prototype$16 = Heap.prototype;

prototype$16.size = function() {
  return this.nodes.length;
};

prototype$16.clear = function() {
  return (this.nodes = [], this);
};

prototype$16.peek = function() {
  return this.nodes[0];
};

prototype$16.push = function(x) {
  var array = this.nodes;
  array.push(x);
  return siftdown(array, 0, array.length-1, this.cmp);
};

prototype$16.pop = function() {
  var array = this.nodes,
      last = array.pop(),
      item;

  if (array.length) {
    item = array[0];
    array[0] = last;
    siftup(array, 0, this.cmp);
  } else {
    item = last;
  }
  return item;
};

prototype$16.replace = function(item) {
  var array = this.nodes,
      retval = array[0];
  array[0] = item;
  siftup(array, 0, this.cmp);
  return retval;
};

prototype$16.pushpop = function(item) {
  var array = this.nodes, ref = array[0];
  if (array.length && this.cmp(ref, item) < 0) {
    array[0] = item;
    item = ref;
    siftup(array, 0, this.cmp);
  }
  return item;
};

function siftdown(array, start, idx, cmp) {
  var item, parent, pidx;

  item = array[idx];
  while (idx > start) {
    pidx = (idx - 1) >> 1;
    parent = array[pidx];
    if (cmp(item, parent) < 0) {
      array[idx] = parent;
      idx = pidx;
      continue;
    }
    break;
  }
  return (array[idx] = item);
}

function siftup(array, idx, cmp) {
  var start = idx,
      end = array.length,
      item = array[idx],
      cidx = 2 * idx + 1, ridx;

  while (cidx < end) {
    ridx = cidx + 1;
    if (ridx < end && cmp(array[cidx], array[ridx]) >= 0) {
      cidx = ridx;
    }
    array[idx] = array[cidx];
    idx = cidx;
    cidx = 2 * idx + 1;
  }
  array[idx] = item;
  return siftdown(array, start, idx, cmp);
}

/**
 * A dataflow graph for reactive processing of data streams.
 * @constructor
 */
function Dataflow() {
  this._log = logger();

  this._clock = 0;
  this._rank = 0;
  this._loader = loader();

  this._touched = UniqueList(id);
  this._pulses = {};
  this._pulse = null;

  this._heap = new Heap(function(a, b) { return a.qrank - b.qrank; });
  this._postrun = [];
}

var prototype$10 = Dataflow.prototype;

/**
 * The current timestamp of this dataflow. This value reflects the
 * timestamp of the previous dataflow run. The dataflow is initialized
 * with a stamp value of 0. The initial run of the dataflow will have
 * a timestap of 1, and so on. This value will match the
 * {@link Pulse.stamp} property.
 * @return {number} - The current timestamp value.
 */
prototype$10.stamp = function() {
  return this._clock;
};

/**
 * Gets or sets the loader instance to use for data file loading. A
 * loader object must provide a "load" method for loading files and a
 * "sanitize" method for checking URL/filename validity. Both methods
 * should accept a URI and options hash as arguments, and return a Promise
 * that resolves to the loaded file contents (load) or a hash containing
 * sanitized URI data with the sanitized url assigned to the "href" property
 * (sanitize).
 * @param {object} _ - The loader instance to use.
 * @return {object|Dataflow} - If no arguments are provided, returns
 *   the current loader instance. Otherwise returns this Dataflow instance.
 */
prototype$10.loader = function(_) {
  return arguments.length ? (this._loader = _, this) : this._loader;
};

/**
 * Empty entry threshold for garbage cleaning. Map data structures will
 * perform cleaning once the number of empty entries exceeds this value.
 */
prototype$10.cleanThreshold = 1e4;

// OPERATOR REGISTRATION
prototype$10.add = add$1;
prototype$10.connect = connect;
prototype$10.rank = rank;
prototype$10.rerank = rerank;

// OPERATOR UPDATES
prototype$10.pulse = pulse;
prototype$10.touch = touch;
prototype$10.update = update;
prototype$10.changeset = changeset;

// DATA LOADING
prototype$10.ingest = ingest$1;
prototype$10.request = request$1;

// EVENT HANDLING
prototype$10.events = events;
prototype$10.on = on;

// PULSE PROPAGATION
prototype$10.run = run;
prototype$10.runAsync = runAsync;
prototype$10.runAfter = runAfter;
prototype$10._enqueue = enqueue;
prototype$10._getPulse = getPulse;

// LOGGING AND ERROR HANDLING

function logMethod(method) {
  return function() {
    return this._log[method].apply(this, arguments);
  };
}

/**
 * Logs a warning message. By default, logged messages are written to console
 * output. The message will only be logged if the current log level is high
 * enough to permit warning messages.
 */
prototype$10.warn = logMethod('warn');

/**
 * Logs a information message. By default, logged messages are written to
 * console output. The message will only be logged if the current log level is
 * high enough to permit information messages.
 */
prototype$10.info = logMethod('info');

/**
 * Logs a debug message. By default, logged messages are written to console
 * output. The message will only be logged if the current log level is high
 * enough to permit debug messages.
 */
prototype$10.debug = logMethod('debug');

/**
 * Get or set the current log level. If an argument is provided, it
 * will be used as the new log level.
 * @param {number} [level] - Should be one of None, Warn, Info
 * @return {number} - The current log level.
 */
prototype$10.logLevel = logMethod('level');

/**
 * Handle an error. By default, this method re-throws the input error.
 * This method can be overridden for custom error handling.
 */
prototype$10.error = function(err) {
  throw err;
};

/**
 * Abstract class for operators that process data tuples.
 * Subclasses must provide a {@link transform} method for operator processing.
 * @constructor
 * @param {*} [init] - The initial value for this operator.
 * @param {object} [params] - The parameters for this operator.
 * @param {Operator} [source] - The operator from which to receive pulses.
 */
function Transform(init, params) {
  Operator.call(this, init, null, params);
}

var prototype$17 = inherits(Transform, Operator);

/**
 * Overrides {@link Operator.evaluate} for transform operators.
 * Marshalls parameter values and then invokes {@link transform}.
 * @param {Pulse} pulse - the current dataflow pulse.
 * @return {Pulse} The output pulse (or StopPropagation). A falsy return
     value (including undefined) will let the input pulse pass through.
 */
prototype$17.evaluate = function(pulse) {
  var params = this.marshall(pulse.stamp),
      out = this.transform(params, pulse);
  params.clear();
  return out;
};

/**
 * Process incoming pulses.
 * Subclasses should override this method to implement transforms.
 * @param {Parameters} _ - The operator parameter values.
 * @param {Pulse} pulse - The current dataflow pulse.
 * @return {Pulse} The output pulse (or StopPropagation). A falsy return
 *   value (including undefined) will let the input pulse pass through.
 */
prototype$17.transform = function() {};

var transforms = {};

var definitions = {};

function register(def, constructor) {
  var type = def.type;
  definition(type, def);
  transform(type, constructor);
}

function definition(type, def) {
  type = type && type.toLowerCase();
  return arguments.length > 1 ? (definitions[type] = def, this)
    : definitions.hasOwnProperty(type) ? definitions[type] : null;
}

function transform(type, constructor) {
  return arguments.length > 1 ? (transforms[type] = constructor, this)
    : transforms.hasOwnProperty(type) ? transforms[type] : null;
}

function TupleStore(key) {
  this._key = key || '_id';
  this._add = [];
  this._rem = [];
  this._ext = null;
  this._get = null;
  this._q = null;
}

var prototype$19 = TupleStore.prototype;

prototype$19.add = function(v) {
  this._add.push(v);
};

prototype$19.rem = function(v) {
  this._rem.push(v);
};

prototype$19.values = function() {
  this._get = null;
  if (this._rem.length === 0) return this._add;

  var a = this._add,
      r = this._rem,
      k = this._key,
      n = a.length,
      m = r.length,
      x = Array(n - m),
      map = {}, i, j, v;

  // use unique key field to clear removed values
  for (i=0; i<m; ++i) {
    map[r[i][k]] = 1;
  }
  for (i=0, j=0; i<n; ++i) {
    if (map[(v = a[i])[k]]) {
      map[v[k]] = 0;
    } else {
      x[j++] = v;
    }
  }

  this._rem = [];
  return (this._add = x);
};

// memoizing statistics methods

prototype$19.distinct = function(get) {
  var v = this.values(),
      n = v.length,
      map = {},
      count = 0, s;

  while (--n >= 0) {
    s = get(v[n]) + '';
    if (!map.hasOwnProperty(s)) {
      map[s] = 1;
      ++count;
    }
  }

  return count;
};

prototype$19.extent = function(get) {
  if (this._get !== get || !this._ext) {
    var v = this.values(),
        i = extentIndex(v, get);
    this._ext = [v[i[0]], v[i[1]]];
    this._get = get;
  }
  return this._ext;
};

prototype$19.argmin = function(get) {
  return this.extent(get)[0] || {};
};

prototype$19.argmax = function(get) {
  return this.extent(get)[1] || {};
};

prototype$19.min = function(get) {
  var m = this.extent(get)[0];
  return m != null ? get(m) : +Infinity;
};

prototype$19.max = function(get) {
  var m = this.extent(get)[1];
  return m != null ? get(m) : -Infinity;
};

prototype$19.quartile = function(get) {
  if (this._get !== get || !this._q) {
    this._q = quartiles(this.values(), get);
    this._get = get;
  }
  return this._q;
};

prototype$19.q1 = function(get) {
  return this.quartile(get)[0];
};

prototype$19.q2 = function(get) {
  return this.quartile(get)[1];
};

prototype$19.q3 = function(get) {
  return this.quartile(get)[2];
};

prototype$19.ci = function(get) {
  if (this._get !== get || !this._ci) {
    this._ci = bootstrapCI(this.values(), 1000, 0.05, get);
    this._get = get;
  }
  return this._ci;
};

prototype$19.ci0 = function(get) {
  return this.ci(get)[0];
};

prototype$19.ci1 = function(get) {
  return this.ci(get)[1];
};

var Aggregates = {
  'values': measure$1({
    name: 'values',
    init: 'cell.store = true;',
    set:  'cell.data.values()', idx: -1
  }),
  'count': measure$1({
    name: 'count',
    set:  'cell.num'
  }),
  'missing': measure$1({
    name: 'missing',
    set:  'this.missing'
  }),
  'valid': measure$1({
    name: 'valid',
    set:  'this.valid'
  }),
  'sum': measure$1({
    name: 'sum',
    init: 'this.sum = 0;',
    add:  'this.sum += v;',
    rem:  'this.sum -= v;',
    set:  'this.sum'
  }),
  'mean': measure$1({
    name: 'mean',
    init: 'this.mean = 0;',
    add:  'var d = v - this.mean; this.mean += d / this.valid;',
    rem:  'var d = v - this.mean; this.mean -= this.valid ? d / this.valid : this.mean;',
    set:  'this.mean'
  }),
  'average': measure$1({
    name: 'average',
    set:  'this.mean',
    req:  ['mean'], idx: 1
  }),
  'variance': measure$1({
    name: 'variance',
    init: 'this.dev = 0;',
    add:  'this.dev += d * (v - this.mean);',
    rem:  'this.dev -= d * (v - this.mean);',
    set:  'this.valid > 1 ? this.dev / (this.valid-1) : 0',
    req:  ['mean'], idx: 1
  }),
  'variancep': measure$1({
    name: 'variancep',
    set:  'this.valid > 1 ? this.dev / this.valid : 0',
    req:  ['variance'], idx: 2
  }),
  'stdev': measure$1({
    name: 'stdev',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid-1)) : 0',
    req:  ['variance'], idx: 2
  }),
  'stdevp': measure$1({
    name: 'stdevp',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / this.valid) : 0',
    req:  ['variance'], idx: 2
  }),
  'stderr': measure$1({
    name: 'stderr',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid * (this.valid-1))) : 0',
    req:  ['variance'], idx: 2
  }),
  'distinct': measure$1({
    name: 'distinct',
    set:  'cell.data.distinct(this.get)',
    req:  ['values'], idx: 3
  }),
  'ci0': measure$1({
    name: 'ci0',
    set:  'cell.data.ci0(this.get)',
    req:  ['values'], idx: 3
  }),
  'ci1': measure$1({
    name: 'ci1',
    set:  'cell.data.ci1(this.get)',
    req:  ['values'], idx: 3
  }),
  'median': measure$1({
    name: 'median',
    set:  'cell.data.q2(this.get)',
    req:  ['values'], idx: 3
  }),
  'q1': measure$1({
    name: 'q1',
    set:  'cell.data.q1(this.get)',
    req:  ['values'], idx: 3
  }),
  'q3': measure$1({
    name: 'q3',
    set:  'cell.data.q3(this.get)',
    req:  ['values'], idx: 3
  }),
  'argmin': measure$1({
    name: 'argmin',
    add:  'if (v < this.min) this.argmin = t;',
    rem:  'if (v <= this.min) this.argmin = null;',
    set:  'this.argmin || cell.data.argmin(this.get)',
    req:  ['min'], str: ['values'], idx: 3
  }),
  'argmax': measure$1({
    name: 'argmax',
    add:  'if (v > this.max) this.argmax = t;',
    rem:  'if (v >= this.max) this.argmax = null;',
    set:  'this.argmax || cell.data.argmax(this.get)',
    req:  ['max'], str: ['values'], idx: 3
  }),
  'min': measure$1({
    name: 'min',
    init: 'this.min = null;',
    add:  'if (v < this.min || this.min === null) this.min = v;',
    rem:  'if (v <= this.min) this.min = NaN;',
    set:  'this.min = (isNaN(this.min) ? cell.data.min(this.get) : this.min)',
    str:  ['values'], idx: 4
  }),
  'max': measure$1({
    name: 'max',
    init: 'this.max = null;',
    add:  'if (v > this.max || this.max === null) this.max = v;',
    rem:  'if (v >= this.max) this.max = NaN;',
    set:  'this.max = (isNaN(this.max) ? cell.data.max(this.get) : this.max)',
    str:  ['values'], idx: 4
  })
};

function createMeasure(op, name) {
  return Aggregates[op](name);
}

function measure$1(base) {
  return function(out) {
    var m = extend({init:'', add:'', rem:'', idx:0}, base);
    m.out = out || base.name;
    return m;
  };
}

function compareIndex(a, b) {
  return a.idx - b.idx;
}

function resolve(agg, stream) {
  function collect(m, a) {
    function helper(r) { if (!m[r]) collect(m, m[r] = Aggregates[r]()); }
    if (a.req) a.req.forEach(helper);
    if (stream && a.str) a.str.forEach(helper);
    return m;
  }
  var map = agg.reduce(
    collect,
    agg.reduce(function(m, a) { return (m[a.name] = a, m); }, {})
  );
  var values = [], key;
  for (key in map) values.push(map[key]);
  return values.sort(compareIndex);
}

function compileMeasures(agg, field) {
  var get = field || identity,
      all = resolve(agg, true), // assume streaming removes may occur
      ctr = 'this.cell = cell; this.tuple = t; this.valid = 0; this.missing = 0;',
      add = 'if(v==null){++this.missing; return;} if(v!==v) return; ++this.valid;',
      rem = 'if(v==null){--this.missing; return;} if(v!==v) return; --this.valid;',
      set = 'var t = this.tuple; var cell = this.cell;';

  all.forEach(function(a) {
    if (a.idx < 0) {
      ctr = a.init + ctr;
      add = a.add + add;
      rem = a.rem + rem;
    } else {
      ctr += a.init;
      add += a.add;
      rem += a.rem;
    }
  });
  agg.slice().sort(compareIndex).forEach(function(a) {
    set += 't[\'' + a.out + '\']=' + a.set + ';';
  });
  set += 'return t;';

  ctr = Function('cell', 't', ctr);
  ctr.prototype.add = Function('v', 't', add);
  ctr.prototype.rem = Function('v', 't', rem);
  ctr.prototype.set = Function(set);
  ctr.prototype.get = get;
  ctr.fields = agg.map(function(_) { return _.out; });
  return ctr;
}

/**
 * Group-by aggregation operator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} params.groupby - An array of accessors to groupby.
 * @param {Array<function(object): *>} params.fields - An array of accessors to aggregate.
 * @param {Array<string>} params.ops - An array of strings indicating aggregation operations.
 * @param {Array<string>} [params.as] - An array of output field names for aggregated values.
 * @param {boolean} [params.drop=true] - A flag indicating if empty cells should be removed.
 */
function Aggregate(params) {
  Transform.call(this, null, params);

  this._adds = []; // array of added output tuples
  this._mods = []; // array of modified output tuples
  this._alen = 0;  // number of active added tuples
  this._mlen = 0;  // number of active modified tuples
  this._drop = true;   // should empty aggregation cells be removed
  this._cross = false; // produce full cross-product of group-by values

  this._dims = [];   // group-by dimension accessors
  this._dnames = []; // group-by dimension names

  this._measures = []; // collection of aggregation monoids
  this._countOnly = false; // flag indicating only count aggregation
  this._counts = null; // collection of count fields
  this._prev = null;   // previous aggregation cells

  this._inputs = null;  // array of dependent input tuple field names
  this._outputs = null; // array of output tuple field names
}

var prototype$18 = inherits(Aggregate, Transform);

prototype$18.transform = function(_, pulse) {
  var aggr = this,
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      mod;

  this.stamp = out.stamp;

  if (this.value && ((mod = _.modified()) || pulse.modified(this._inputs))) {
    this._prev = this.value;
    this.value = mod ? this.init(_) : {};
    pulse.visit(pulse.SOURCE, function(t) { aggr.add(t); });
  } else {
    this.value = this.value || this.init(_);
    pulse.visit(pulse.REM, function(t) { aggr.rem(t); });
    pulse.visit(pulse.ADD, function(t) { aggr.add(t); });
  }

  // Indicate output fields and return aggregate tuples.
  out.modifies(this._outputs);

  // Should empty cells be dropped?
  aggr._drop = _.drop !== false;

  // If domain cross-product requested, generate empty cells as needed
  // and ensure that empty cells are not dropped
  if (_.cross && aggr._dims.length > 1) {
    aggr._drop = false;
    this.cross();
  }

  return aggr.changes(out);
};

prototype$18.cross = function() {
  var aggr = this,
      curr = aggr.value,
      dims = aggr._dnames,
      vals = dims.map(function() { return {}; }),
      n = dims.length;

  // collect all group-by domain values
  function collect(cells) {
    var key, i, t, v;
    for (key in cells) {
      t = cells[key].tuple;
      for (i=0; i<n; ++i) {
        vals[i][(v = t[dims[i]])] = v;
      }
    }
  }
  collect(aggr._prev);
  collect(curr);

  // iterate over key cross-product, create cells as needed
  function generate(base, tuple, index) {
    var name = dims[index],
        v = vals[index++],
        k, key;

    for (k in v) {
      tuple[name] = v[k];
      key = base ? base + '|' + k : k;
      if (index < n) generate(key, tuple, index);
      else if (!curr[key]) aggr.cell(key, tuple);
    }
  }
  generate('', {}, 0);
};

prototype$18.init = function(_) {
  // initialize input and output fields
  var inputs = (this._inputs = []),
      outputs = (this._outputs = []),
      inputMap = {};

  function inputVisit(get) {
    var fields = get.fields, i = 0, n = fields.length, f;
    for (; i<n; ++i) {
      if (!inputMap[f=fields[i]]) {
        inputMap[f] = 1;
        inputs.push(f);
      }
    }
  }

  // initialize group-by dimensions
  this._dims = array(_.groupby);
  this._dnames = this._dims.map(function(d) {
    var dname = accessorName(d)
    return (inputVisit(d), outputs.push(dname), dname);
  });
  this.cellkey = _.key ? _.key
    : this._dims.length === 0 ? function() { return ''; }
    : this._dims.length === 1 ? this._dims[0]
    : cellkey;

  // initialize aggregate measures
  this._countOnly = true;
  this._counts = [];
  this._measures = [];

  var fields = _.fields || [null],
      ops = _.ops || ['count'],
      as = _.as || [],
      n = fields.length,
      map = {},
      field, op, m, mname, outname, i;

  if (n !== ops.length) {
    error('Unmatched number of fields and aggregate ops.');
  }

  for (i=0; i<n; ++i) {
    field = fields[i];
    op = ops[i];

    if (field == null && op !== 'count') {
      error('Null aggregate field specified.');
    }
    mname = accessorName(field);
    outname = measureName(op, mname, as[i]);
    outputs.push(outname);

    if (op === 'count') {
      this._counts.push(outname);
      continue;
    }

    m = map[mname];
    if (!m) {
      inputVisit(field);
      m = (map[mname] = []);
      m.field = field;
      this._measures.push(m);
    }

    if (op !== 'count') this._countOnly = false;
    m.push(createMeasure(op, outname));
  }

  this._measures = this._measures.map(function(m) {
    return compileMeasures(m, m.field);
  });

  return {}; // aggregation cells (this.value)
};

function measureName(op, mname, as) {
  return as || (op + (!mname ? '' : '_' + mname));
}

// -- Cell Management -----

function cellkey(x) {
  var d = this._dims,
      n = d.length, i,
      k = String(d[0](x));

  for (i=1; i<n; ++i) {
    k += '|' + d[i](x);
  }

  return k;
}

prototype$18.cellkey = cellkey;

prototype$18.cell = function(key, t) {
  var cell = this.value[key];
  if (!cell) {
    cell = this.value[key] = this.newcell(key, t);
    this._adds[this._alen++] = cell;
  } else if (cell.num === 0 && this._drop && cell.stamp < this.stamp) {
    cell.stamp = this.stamp;
    this._adds[this._alen++] = cell;
  } else if (cell.stamp < this.stamp) {
    cell.stamp = this.stamp;
    this._mods[this._mlen++] = cell;
  }
  return cell;
};

prototype$18.newcell = function(key, t) {
  var cell = {
    key:   key,
    num:   0,
    agg:   null,
    tuple: this.newtuple(t, this._prev && this._prev[key]),
    stamp: this.stamp,
    store: false
  };

  if (!this._countOnly) {
    var measures = this._measures,
        n = measures.length, i;

    cell.agg = Array(n);
    for (i=0; i<n; ++i) {
      cell.agg[i] = new measures[i](cell, cell.tuple);
    }
  }

  if (cell.store) {
    cell.data = new TupleStore();
  }

  return cell;
};

prototype$18.newtuple = function(t, p) {
  var names = this._dnames,
      dims = this._dims,
      x = {}, i, n;

  for (i=0, n=dims.length; i<n; ++i) {
    x[names[i]] = dims[i](t);
  }

  return p ? replace(p.tuple, x) : ingest(x);
};

// -- Process Tuples -----

prototype$18.add = function(t) {
  var key = this.cellkey(t),
      cell = this.cell(key, t),
      agg, i, n;

  cell.num += 1;
  if (this._countOnly) return;

  if (cell.store) cell.data.add(t);

  agg = cell.agg;
  for (i=0, n=agg.length; i<n; ++i) {
    agg[i].add(agg[i].get(t), t);
  }
};

prototype$18.rem = function(t) {
  var key = this.cellkey(t),
      cell = this.cell(key, t),
      agg, i, n;

  cell.num -= 1;
  if (this._countOnly) return;

  if (cell.store) cell.data.rem(t);

  agg = cell.agg;
  for (i=0, n=agg.length; i<n; ++i) {
    agg[i].rem(agg[i].get(t), t);
  }
};

prototype$18.celltuple = function(cell) {
  var tuple = cell.tuple,
      counts = this._counts,
      agg, i, n;

  // consolidate stored values
  if (cell.store) {
    cell.data.values();
  }

  // update tuple properties
  for (i=0, n=counts.length; i<n; ++i) {
    tuple[counts[i]] = cell.num;
  }
  if (!this._countOnly) {
    agg = cell.agg;
    for (i=0, n=agg.length; i<n; ++i) {
      agg[i].set();
    }
  }

  return tuple;
};

prototype$18.changes = function(out) {
  var adds = this._adds,
      mods = this._mods,
      prev = this._prev,
      drop = this._drop,
      add = out.add,
      rem = out.rem,
      mod = out.mod,
      cell, key, i, n;

  if (prev) for (key in prev) {
    rem.push(prev[key].tuple);
  }

  for (i=0, n=this._alen; i<n; ++i) {
    add.push(this.celltuple(adds[i]));
    adds[i] = null; // for garbage collection
  }

  for (i=0, n=this._mlen; i<n; ++i) {
    cell = mods[i];
    (cell.num === 0 && drop ? rem : mod).push(this.celltuple(cell));
    mods[i] = null; // for garbage collection
  }

  this._alen = this._mlen = 0; // reset list of active cells
  this._prev = null;
  return out;
};

/**
 * Generates a binning function for discretizing data.
 * @constructor
 * @param {object} params - The parameters for this operator. The
 *   provided values should be valid options for the {@link bin} function.
 * @param {function(object): *} params.field - The data field to bin.
 */
function Bin(params) {
  Transform.call(this, null, params);
}

var prototype$20 = inherits(Bin, Transform);

prototype$20.transform = function(_, pulse) {
  var bins = this._bins(_),
      step = bins.step,
      as = _.as || ['bin0', 'bin1'],
      b0 = as[0],
      b1 = as[1],
      flag = _.modified() ? (pulse = pulse.reflow(true), pulse.SOURCE)
        : pulse.modified(accessorFields(_.field)) ? pulse.ADD_MOD
        : pulse.ADD;

  pulse.visit(flag, function(t) {
    var v = bins(t);
    t[b0] = v;
    t[b1] = v != null ? v + step : null;
  });

  return pulse.modifies(as);
};

prototype$20._bins = function(_) {
  if (this.value && !_.modified()) {
    return this.value;
  }

  var field = _.field,
      bins  = bin$1(_),
      start = bins.start,
      stop  = bins.stop,
      step  = bins.step,
      a, d;

  if ((a = _.anchor) != null) {
    d = a - (start + step * Math.floor((a - start) / step));
    start += d;
    stop += d;
  }

  var f = function(t) {
    var v = field(t);
    return v == null ? null
      : (v = Math.max(start, Math.min(+v, stop - step)),
         start + step * Math.floor((v - start) / step));
  };

  f.start = start;
  f.stop = stop;
  f.step = step;

  return this.value = accessor(
    f,
    accessorFields(field),
    _.name || 'bin_' + accessorName(field)
  );
};

/**
 * Collects all data tuples that pass through this operator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(*,*): number} [params.sort] - An optional
 *   comparator function for additionally sorting the collected tuples.
 */
function Collect(params) {
  Transform.call(this, [], params);
}

var prototype$21 = inherits(Collect, Transform);

prototype$21.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ALL),
      add = pulse.changed(pulse.ADD),
      mod = pulse.changed(),
      sort = _.sort,
      data = this.value,
      push = function(t) { data.push(t); },
      n = 0, map;

  if (out.rem.length) { // build id map and filter data array
    map = {};
    out.visit(out.REM, function(t) { map[t._id] = 1; ++n; });
    data = data.filter(function(t) { return !map[t._id]; });
  }

  if (sort) {
    // if sort criteria change, re-sort the full data array
    if (_.modified('sort') || pulse.modified(sort.fields)) {
      data.sort(sort);
      mod = true;
    }
    // if added tuples, sort them in place and then merge
    if (add) {
      data = merge(sort, data, out.add.sort(sort));
    }
  } else if (add) {
    // no sort, so simply add new tuples
    out.visit(out.ADD, push);
  }

  this.modified(mod);
  this.value = out.source = data;
  return out;
};

/**
 * Generates a comparator function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<string>} params.fields - The fields to compare.
 * @param {Array<string>} [params.orders] - The sort orders.
 *   Each entry should be one of "ascending" (default) or "descending".
 */
function Compare(params) {
  Operator.call(this, null, update$1, params);
}

inherits(Compare, Operator);

function update$1(_) {
  return (this.value && !_.modified())
    ? this.value
    : compare(_.fields, _.orders);
}

/**
 * Count regexp-defined pattern occurrences in a text field.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - An accessor for the text field.
 * @param {string} [params.pattern] - RegExp string defining the text pattern.
 * @param {string} [params.case] - One of 'lower', 'upper' or null (mixed) case.
 * @param {string} [params.stopwords] - RegExp string of words to ignore.
 */
function CountPattern(params) {
  Transform.call(this, null, params);
}

function tokenize(text, tcase, match) {
  switch (tcase) {
    case 'upper': text = text.toUpperCase(); break;
    case 'lower': text = text.toLowerCase(); break;
  }
  return text.match(match);
}

var prototype$22 = inherits(CountPattern, Transform);

prototype$22.transform = function(_, pulse) {
  function process(update) {
    return function(tuple) {
      var tokens = tokenize(get(tuple), _.case, match) || [], t;
      for (var i=0, n=tokens.length; i<n; ++i) {
        if (!stop.test(t = tokens[i])) update(t);
      }
    };
  }

  var init = this._parameterCheck(_, pulse),
      counts = this._counts,
      match = this._match,
      stop = this._stop,
      get = _.field,
      as = _.as || ['text', 'count'],
      add = process(function(t) { counts[t] = 1 + (counts[t] || 0); }),
      rem = process(function(t) { counts[t] -= 1; });

  if (init) {
    pulse.visit(pulse.SOURCE, add);
  } else {
    pulse.visit(pulse.ADD, add);
    pulse.visit(pulse.REM, rem);
  }

  return this._finish(pulse, as); // generate output tuples
};

prototype$22._parameterCheck = function(_, pulse) {
  var init = false;

  if (_.modified('stopwords') || !this._stop) {
    this._stop = new RegExp('^' + (_.stopwords || '') + '$', 'i');
    init = true;
  }

  if (_.modified('pattern') || !this._match) {
    this._match = new RegExp((_.pattern || '[\\w\']+'), 'g');
    init = true;
  }

  if (_.modified('field') || pulse.modified(_.field.fields)) {
    init = true;
  }

  if (init) this._counts = {};
  return init;
}

prototype$22._finish = function(pulse, as) {
  var counts = this._counts,
      tuples = this._tuples || (this._tuples = {}),
      text = as[0],
      count = as[1],
      out = pulse.fork(),
      w, t, c;

  for (w in counts) {
    t = tuples[w];
    c = counts[w] || 0;
    if (!t && c) {
      tuples[w] = (t = ingest({}));
      t[text] = w;
      t[count] = c;
      out.add.push(t);
    } else if (c === 0) {
      if (t) out.rem.push(t);
      counts[w] = null;
      tuples[w] = null;
    } else if (t[count] !== c) {
      t[count] = c;
      out.mod.push(t);
    }
  }

  return out.modifies(as);
};

/**
 * Perform a cross-product of a tuple stream with itself.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object):boolean} [params.filter] - An optional filter
 *   function for selectively including tuples in the cross product.
 * @param {Array<string>} [params.as] - The names of the output fields.
 */
function Cross(params) {
  Transform.call(this, null, params);
}

var prototype$23 = inherits(Cross, Transform);

prototype$23.transform = function(_, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE),
      data = this.value,
      as = _.as || ['a', 'b'],
      a = as[0], b = as[1],
      reset = !data
          || pulse.changed(pulse.ADD_REM)
          || _.modified('as')
          || _.modified('filter');

  if (reset) {
    if (data) out.rem = data;
    out.add = this.value = cross(pulse.source, a, b, _.filter || truthy);
  } else {
    out.mod = data;
  }

  return out.source = this.value, out.modifies(as);
};

function cross(input, a, b, filter) {
  var data = [],
      t = {},
      n = input.length,
      i = 0,
      j, left;

  for (; i<n; ++i) {
    t[a] = left = input[i];
    for (j=0; j<n; ++j) {
      t[b] = input[j];
      if (filter(t)) {
        data.push(ingest(t));
        t = {};
        t[a] = left;
      }
    }
  }

  return data;
}

var Distributions = {
  kde:     randomKDE,
  mixture: randomMixture,
  normal:  randomNormal,
  uniform: randomUniform
};

var DISTRIBUTIONS = 'distributions';
var FUNCTION = 'function';
var FIELD = 'field';
/**
 * Parse a parameter object for a probability distribution.
 * @param {object} def - The distribution parameter object.
 * @param {function():Array<object>} - A method for requesting
 *   source data. Used for distributions (such as KDE) that
 *   require sample data points. This method will only be
 *   invoked if the 'from' parameter for a target data source
 *   is not provided. Typically this method returns backing
 *   source data for a Pulse object.
 * @return {object} - The output distribution object.
 */
function parse$1(def, data) {
  var func = def[FUNCTION];
  if (!Distributions.hasOwnProperty(func)) {
    error('Unknown distribution function: ' + func);
  }

  var d = Distributions[func]();

  for (var name in def) {
    // if data field, extract values
    if (name === FIELD) {
      d.data((def.from || data()).map(def[name]));
    }

    // if distribution mixture, recurse to parse each definition
    else if (name === DISTRIBUTIONS) {
      d[name](def[name].map(function(_) { return parse$1(_, data); }));
    }

    // otherwise, simply set the parameter
    else if (typeof d[name] === FUNCTION) {
      d[name](def[name]);
    }
  }

  return d;
}

/**
 * Grid sample points for a probability density. Given a distribution and
 * a sampling extent, will generate points suitable for plotting either
 * PDF (probability density function) or CDF (cumulative distribution
 * function) curves.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.distribution - The probability distribution. This
 *   is an object parameter dependent on the distribution type.
 * @param {string} [params.method='pdf'] - The distribution method to sample.
 *   One of 'pdf' or 'cdf'.
 * @param {Array<number>} [params.extent] - The [min, max] extent over which
 *   to sample the distribution. This argument is required in most cases, but
 *   can be omitted if the distribution (e.g., 'kde') supports a 'data' method
 *   that returns numerical sample points from which the extent can be deduced.
 * @param {number} [params.steps=100] - The number of sampling steps.
 */
function Density(params) {
  Transform.call(this, null, params);
}

var prototype$24 = inherits(Density, Transform);

prototype$24.transform = function(_, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);

  if (!this.value || pulse.changed() || _.modified()) {
    var dist = parse$1(_.distribution, source(pulse)),
        method = _.method || 'pdf';

    if (method !== 'pdf' && method !== 'cdf') {
      error('Invalid density method: ' + method);
    }
    if (!_.extent && !dist.data) {
      error('Missing density extent parameter.');
    }
    method = dist[method];

    var as = _.as || ['value', 'density'],
        domain = _.extent || d3Array.extent(dist.data()),
        step = (domain[1] - domain[0]) / (_.steps || 100),
        values = d3Array.range(domain[0], domain[1] + step/2, step)
          .map(function(v) {
            var tuple = {};
            tuple[as[0]] = v;
            tuple[as[1]] = method(v);
            return ingest(tuple);
          });

    if (this.value) out.rem = this.value;
    this.value = out.add = out.source = values;
  }

  return out;
};

function source(pulse) {
  return function() { return pulse.materialize(pulse.SOURCE).source; };
}

/**
 * Computes extents (min/max) for a data field.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field over which to compute extends.
 */
function Extent(params) {
  Transform.call(this, [+Infinity, -Infinity], params);
}

var prototype$25 = inherits(Extent, Transform);

prototype$25.transform = function(_, pulse) {
  var extent = this.value,
      field = _.field,
      min = extent[0],
      max = extent[1],
      flag = pulse.ADD,
      mod;

  mod = pulse.changed()
     || pulse.modified(field.fields)
     || _.modified('field');

  if (mod) {
    flag = pulse.SOURCE;
    min = +Infinity;
    max = -Infinity;
  }

  pulse.visit(flag, function(t) {
    var v = field(t);
    if (v < min) min = v;
    if (v > max) max = v;
  });

  this.value = [min, max];
};

/**
 * Provides a bridge between a parent transform and a target subflow that
 * consumes only a subset of the tuples that pass through the parent.
 * @constructor
 * @param {Pulse} pulse - A pulse to use as the value of this operator.
 * @param {Transform} parent - The parent transform (typically a Facet instance).
 * @param {Transform} target - A transform that receives the subflow of tuples.
 */
function Subflow(pulse, parent) {
  Operator.call(this, pulse);
  this.parent = parent;
}

var prototype$27 = inherits(Subflow, Operator);

prototype$27.connect = function(target) {
  this.targets().add(target);
  return (target.source = this);
};

/**
 * Add an 'add' tuple to the subflow pulse.
 * @param {Tuple} t - The tuple being added.
 */
prototype$27.add = function(t) {
  this.value.add.push(t);
};

/**
 * Add a 'rem' tuple to the subflow pulse.
 * @param {Tuple} t - The tuple being removed.
 */
prototype$27.rem = function(t) {
  this.value.rem.push(t);
};

/**
 * Add a 'mod' tuple to the subflow pulse.
 * @param {Tuple} t - The tuple being modified.
 */
prototype$27.mod = function(t) {
  this.value.mod.push(t);
};

/**
 * Re-initialize this operator's pulse value.
 * @param {Pulse} pulse - The pulse to copy from.
 * @see Pulse.init
 */
prototype$27.init = function(pulse) {
  this.value.init(pulse, pulse.NO_SOURCE);
};

/**
 * Evaluate this operator. This method overrides the
 * default behavior to simply return the contained pulse value.
 * @return {Pulse}
 */
prototype$27.evaluate = function() {
  // assert: this.value.stamp === pulse.stamp
  return this.value;
};

/**
 * Facets a dataflow into a set of subflows based on a key.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(Dataflow, string): Operator} params.subflow - A function
 *   that generates a subflow of operators and returns its root operator.
 * @param {function(object): *} params.key - The key field to facet by.
 */
function Facet(params) {
  Transform.call(this, {}, params);
  this._keys = fastmap(); // cache previously calculated key values

  // keep track of active subflows, use as targets array for listeners
  // this allows us to limit propagation to only updated subflows
  var a = this._targets = [];
  a.active = 0;
  a.forEach = function(f) {
    for (var i=0, n=a.active; i<n; ++i) f(a[i], i, a);
  };
}

var prototype$26 = inherits(Facet, Transform);

prototype$26.activate = function(flow) {
  this._targets[this._targets.active++] = flow;
};

prototype$26.subflow = function(key, flow, pulse, parent) {
  var flows = this.value,
      sf = flows.hasOwnProperty(key) && flows[key],
      df, p;

  if (!sf) {
    p = parent || (p = this._group[key]) && p.tuple;
    df = pulse.dataflow;
    sf = df.add(new Subflow(pulse.fork(pulse.NO_SOURCE), this))
      .connect(flow(df, key, p));
    flows[key] = sf;
    this.activate(sf);
  } else if (sf.value.stamp < pulse.stamp) {
    sf.init(pulse);
    this.activate(sf);
  }

  return sf;
};

prototype$26.transform = function(_, pulse) {
  var df = pulse.dataflow,
      self = this,
      key = _.key,
      flow = _.subflow,
      cache = this._keys,
      rekey = _.modified('key');

  function subflow(key) {
    return self.subflow(key, flow, pulse);
  }

  this._group = _.group || {};
  this._targets.active = 0; // reset list of active subflows

  pulse.visit(pulse.ADD, function(t) {
    var k = key(t);
    cache.set(t._id, k);
    subflow(k).add(t);
  });

  pulse.visit(pulse.REM, function(t) {
    var k = cache.get(t._id);
    cache.delete(t._id);
    subflow(k).rem(t);
  });

  if (rekey || pulse.modified(key.fields)) {
    pulse.visit(pulse.MOD, function(t) {
      var k0 = cache.get(t._id),
          k1 = key(t);
      if (k0 === k1) {
        subflow(k1).mod(t);
      } else {
        cache.set(t._id, k1);
        subflow(k0).rem(t);
        subflow(k1).add(t);
      }
    });
  } else if (pulse.changed(pulse.MOD)) {
    pulse.visit(pulse.MOD, function(t) {
      subflow(cache.get(t._id)).mod(t);
    });
  }

  if (rekey) {
    pulse.visit(pulse.REFLOW, function(t) {
      var k0 = cache.get(t._id),
          k1 = key(t);
      if (k0 !== k1) {
        cache.set(t._id, k1);
        subflow(k0).rem(t);
        subflow(k1).add(t);
      }
    });
  }

  if (cache.empty > df.cleanThreshold) df.runAfter(cache.clean);
  return pulse;
};

/**
 * Generates one or more field accessor functions.
 * If the 'name' parameter is an array, an array of field accessors
 * will be created and the 'as' parameter will be ignored.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {string} params.name - The field name(s) to access.
 * @param {string} params.as - The accessor function name.
 */
function Field(params) {
  Operator.call(this, null, update$2, params);
}

inherits(Field, Operator);

function update$2(_) {
  return (this.value && !_.modified()) ? this.value
    : isArray(_.name) ? array(_.name).map(function(f) { return field(f); })
    : field(_.name, _.as);
}

/**
 * Filters data tuples according to a predicate function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.expr - The predicate expression function
 *   that determines a tuple's filter status. Truthy values pass the filter.
 */
function Filter(params) {
  Transform.call(this, fastmap(), params);
}

var prototype$28 = inherits(Filter, Transform);

prototype$28.transform = function(_, pulse) {
  var df = pulse.dataflow,
      cache = this.value, // cache ids of filtered tuples
      output = pulse.fork(),
      add = output.add,
      rem = output.rem,
      mod = output.mod,
      test = _.expr,
      isMod = true;

  pulse.visit(pulse.REM, function(t) {
    if (!cache.has(t._id)) rem.push(t);
    else cache.delete(t._id);
  });

  pulse.visit(pulse.ADD, function(t) {
    if (test(t, _)) add.push(t);
    else cache.set(t._id, 1);
  });

  function revisit(t) {
    var b = test(t, _),
        s = cache.get(t._id);
    if (b && s) {
      cache.delete(t._id);
      add.push(t);
    } else if (!b && !s) {
      cache.set(t._id, 1);
      rem.push(t);
    } else if (isMod && b && !s) {
      mod.push(t);
    }
  }

  pulse.visit(pulse.MOD, revisit);

  if (_.modified()) {
    isMod = false;
    pulse.visit(pulse.REFLOW, revisit);
  }

  if (cache.empty > df.cleanThreshold) df.runAfter(cache.clean);
  return output;
};

/**
 * Folds one more tuple fields into multiple tuples in which the field
 * name and values are available under new 'key' and 'value' fields.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.fields - An array of field accessors
 *   for the tuple fields that should be folded.
 */
function Fold(params) {
  Transform.call(this, {}, params);
}

var prototype$29 = inherits(Fold, Transform);

function keyFunction(f) {
  return f.fields.join('|');
}

prototype$29.transform = function(_, pulse) {
  var cache = this.value,
      reset = _.modified('fields'),
      fields = _.fields,
      as = _.as || ['key', 'value'],
      key = as[0],
      value = as[1],
      keys = fields.map(keyFunction),
      n = fields.length,
      stamp = pulse.stamp,
      out = pulse.fork(pulse.NO_SOURCE),
      i = 0, mask = 0, id;

  function add(t) {
    var f = (cache[t._id] = Array(n)); // create cache of folded tuples
    for (var i=0, ft; i<n; ++i) { // for each key, derive folds
      ft = (f[i] = derive(t));
      ft[key] = keys[i];
      ft[value] = fields[i](t);
      out.add.push(ft);
    }
  }

  function mod(t) {
    var f = cache[t._id]; // get cache of folded tuples
    for (var i=0, ft; i<n; ++i) { // for each key, rederive folds
      if (!(mask & (1 << i))) continue; // field is unchanged
      ft = rederive(t, f[i], stamp);
      ft[key] = keys[i];
      ft[value] = fields[i](t);
      out.mod.push(ft);
    }
  }

  if (reset) {
    // on reset, remove all folded tuples and clear cache
    for (id in cache) out.rem.push.apply(out.rem, cache[id]);
    cache = this.value = {};
    pulse.visit(pulse.SOURCE, add);
  } else {
    pulse.visit(pulse.ADD, add);

    for (; i<n; ++i) {
      if (pulse.modified(fields[i].fields)) mask |= (1 << i);
    }
    if (mask) pulse.visit(pulse.MOD, mod);

    pulse.visit(pulse.REM, function(t) {
      out.rem.push.apply(out.rem, cache[t._id]);
      cache[t._id] = null;
    });
  }

  return out.modifies(as);
};

/**
 * Invokes a function for each data tuple and saves the results as a new field.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.expr - The formula function to invoke for each tuple.
 * @param {string} params.as - The field name under which to save the result.
 * @param {boolean} [params.initonly=false] - If true, the formula is applied to
 *   added tuples only, and does not update in response to modifications.
 */
function Formula(params) {
  Transform.call(this, null, params);
}

var prototype$30 = inherits(Formula, Transform);

prototype$30.transform = function(_, pulse) {
  var func = _.expr,
      as = _.as,
      mod = _.modified(),
      flag = _.initonly ? pulse.ADD
      : mod ? pulse.SOURCE
      : pulse.modified(func.fields) ? pulse.ADD_MOD
      : pulse.ADD;

  function set(t) {
    t[as] = func(t, _);
  }

  if (mod) {
    // parameters updated, need to reflow
    pulse = pulse.materialize().reflow(true);
  }

  return pulse.visit(flag, set).modifies(as);
};

/**
 * Generates data tuples using a provided generator function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(Parameters): object} params.generator - A tuple generator
 *   function. This function is given the operator parameters as input.
 *   Changes to any additional parameters will not trigger re-calculation
 *   of previously generated tuples. Only future tuples are affected.
 * @param {number} params.size - The number of tuples to produce.
 */
function Generate(params) {
  Transform.call(this, [], params);
}

var prototype$31 = inherits(Generate, Transform);

prototype$31.transform = function(_, pulse) {
  var data = this.value,
      out = pulse.fork(pulse.ALL),
      num = _.size - data.length,
      gen = _.generator,
      add, rem, t;

  if (num > 0) {
    // need more tuples, generate and add
    for (add=[]; --num >= 0;) {
      add.push(t = ingest(gen(_)));
      data.push(t);
    }
    out.add = out.add.length
      ? out.materialize(out.ADD).add.concat(add)
      : add;
  } else {
    // need fewer tuples, remove
    rem = data.slice(0, -num);
    out.rem = out.rem.length
      ? out.materialize(out.REM).rem.concat(rem)
      : rem;
    data = data.slice(-num);
  }

  out.source = this.value = data;
  return out;
};

var Methods = {
  value: 'value',
  median: d3Array.median,
  mean: d3Array.mean,
  min: d3Array.min,
  max: d3Array.max
};

var Empty$1 = [];

/**
 * Impute missing values.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to impute.
 * @param {Array<function(object): *>} [params.groupby] - An array of
 *   accessors to determine series within which to perform imputation.
 * @param {Array<function(object): *>} [params.orderby] - An array of
 *   accessors to determine the ordering within a series.
 * @param {string} [method='value'] - The imputation method to use. One of
 *   'value', 'mean', 'median', 'max', 'min'.
 * @param {*} [value=0] - The constant value to use for imputation
 *   when using method 'value'.
 */
function Impute(params) {
  Transform.call(this, [], params);
}

var prototype$32 = inherits(Impute, Transform);

function getValue(_) {
  var m = _.method || Methods.value, v;

  if (Methods[m] == null) {
    error('Unrecognized imputation method: ' + m);
  } else if (m === Methods.value) {
    v = _.value !== undefined ? _.value : 0;
    return function() { return v; };
  } else {
    return Methods[m];
  }
}

function getField(_) {
  var f = _.field;
  return function(t) { return t ? f(t) : NaN; };
}

prototype$32.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ALL),
      impute = getValue(_),
      field = getField(_),
      fName = accessorName(_.field),
      gNames = _.groupby.map(accessorName),
      oNames = _.orderby.map(accessorName),
      groups = partition$1(pulse.source, _.groupby, _.orderby),
      curr = [],
      prev = this.value,
      m = groups.domain.length,
      group, value, gVals, oVals, g, i, j, l, n, t;

  for (g=0, l=groups.length; g<l; ++g) {
    group = groups[g];
    gVals = group.values;
    value = NaN;

    // add tuples for missing values
    for (j=0; j<m; ++j) {
      if (group[j] != null) continue;
      oVals = groups.domain[j];

      t = {_impute: true};
      for (i=0, n=gVals.length; i<n; ++i) t[gNames[i]] = gVals[i];
      for (i=0, n=oVals.length; i<n; ++i) t[oNames[i]] = oVals[i];
      t[fName] = isNaN(value) ? (value = impute(group, field)) : value;

      curr.push(ingest(t));
    }
  }

  // update pulse with imputed tuples
  if (curr.length) out.add = out.materialize(out.ADD).add.concat(curr);
  if (prev.length) out.rem = out.materialize(out.REM).rem.concat(prev);
  this.value = curr;

  return out;
};

function partition$1(data, groupby, orderby) {
  var get = function(f) { return f(t); },
      groups = [],
      domain = [],
      oMap = {}, oVals, oKey,
      gMap = {}, gVals, gKey,
      group, i, j, n, t;

  for (i=0, n=data.length; i<n; ++i) {
    t = data[i];

    oKey = (oVals = orderby.map(get)) + '';
    j = oMap[oKey] || (oMap[oKey] = domain.push(oVals));

    gKey = (gVals = groupby ? groupby.map(get) : Empty$1) + '';
    if (!(group = gMap[gKey])) {
      group = (gMap[gKey] = []);
      groups.push(group);
      group.values = gVals;
    }
    group[j-1] = t;
  }

  return (groups.domain = domain, groups);
}

/**
 * Generates a key function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<string>} params.fields - The field name(s) for the key function.
 */
function Key(params) {
  Operator.call(this, null, update$3, params);
}

inherits(Key, Operator);

function update$3(_) {
  return (this.value && !_.modified()) ? this.value : key(_.fields);
}

/**
 * Extend tuples by joining them with values from a lookup table.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Map} params.index - The lookup table map.
 * @param {Array<function(object): *} params.fields - The fields to lookup.
 * @param {Array<string>} params.as - Output field names for each lookup value.
 * @param {*} [params.default] - A default value to use if lookup fails.
 */
function Lookup(params) {
  Transform.call(this, {}, params);
}

var prototype$33 = inherits(Lookup, Transform);

prototype$33.transform = function(_, pulse) {
  var out = pulse,
      as = _.as,
      keys = _.fields,
      index = _.index,
      values = _.values,
      defaultValue = _.default==null ? null : _.default,
      reset = _.modified(),
      flag = reset ? pulse.SOURCE : pulse.ADD,
      n = keys.length,
      set, m, mods;

  if (values) {
    m = values.length;

    if (n > 1 && !as) {
      error('Multi-field lookup requires explicit "as" parameter.');
    }
    if (as && as.length !== n * m) {
      error('The "as" parameter has too few output field names.');
    }
    as = as || values.map(accessorName);

    set = function(t) {
      for (var i=0, k=0, j, v; i<n; ++i) {
        v = index.get(keys[i](t));
        if (v == null) for (j=0; j<m; ++j, ++k) t[as[k]] = defaultValue;
        else for (j=0; j<m; ++j, ++k) t[as[k]] = values[j](v);
      }
    };
  } else {
    if (!as) {
      error('Missing output field names.');
    }

    set = function(t) {
      for (var i=0, v; i<n; ++i) {
        v = index.get(keys[i](t));
        t[as[i]] = v==null ? defaultValue : v;
      }
    };
  }

  if (reset) {
    out = pulse.reflow(true);
  } else {
    mods = keys.some(function(k) { return pulse.modified(k.fields); });
    flag |= (mods ? pulse.MOD : 0);
  }
  pulse.visit(flag, set);

  return out.modifies(as);
};

/**
 * Computes global min/max extents over a collection of extents.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<Array<number>>} params.extents - The input extents.
 */
function MultiExtent(params) {
  Operator.call(this, null, update$4, params);
}

inherits(MultiExtent, Operator);

function update$4(_) {
  if (this.value && !_.modified()) {
    return this.value;
  }

  var min = +Infinity,
      max = -Infinity,
      ext = _.extents,
      i, n, e;

  for (i=0, n=ext.length; i<n; ++i) {
    e = ext[i];
    if (e[0] < min) min = e[0];
    if (e[1] > max) max = e[1];
  }
  return [min, max];
}

/**
 * Merge a collection of value arrays.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<Array<*>>} params.values - The input value arrrays.
 */
function MultiValues(params) {
  Operator.call(this, null, update$5, params);
}

inherits(MultiValues, Operator);

function update$5(_) {
  return (this.value && !_.modified())
    ? this.value
    : _.values.reduce(function(data, _) { return data.concat(_); }, []);
}

/**
 * Operator whose value is simply its parameter hash. This operator is
 * useful for enabling reactive updates to values of nested objects.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function Params(params) {
  Transform.call(this, null, params);
}

inherits(Params, Transform);

Params.prototype.transform = function(_, pulse) {
  this.modified(_.modified());
  this.value = _;
  return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS); // do not pass tuples
};

/**
 * Partitions pre-faceted data into tuple subflows.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(Dataflow, string): Operator} params.subflow - A function
 *   that generates a subflow of operators and returns its root operator.
 * @param {function(object): Array<object>} params.field - The field
 *   accessor for an array of subflow tuple objects.
 */
function PreFacet(params) {
  Facet.call(this, params);
}

var prototype$34 = inherits(PreFacet, Facet);

prototype$34.transform = function(_, pulse) {
  var self = this,
      flow = _.subflow,
      field = _.field;

  if (_.modified('field')) {
    error('PreFacet does not support field modification.');
  }

  this._targets.active = 0; // reset list of active subflows

  pulse.visit(pulse.MOD, function(t) {
    var sf = self.subflow(t._id, flow, pulse, t);
    field ? field(t).forEach(function(_) { sf.mod(_); }) : sf.mod(t);
  });

  pulse.visit(pulse.ADD, function(t) {
    var sf = self.subflow(t._id, flow, pulse, t);
    field ? field(t).forEach(function(_) { sf.add(ingest(_)); }) : sf.add(t);
  });

  pulse.visit(pulse.REM, function(t) {
    var sf = self.subflow(t._id, flow, pulse, t);
    field ? field(t).forEach(function(_) { sf.rem(_); }) : sf.rem(t);
  });

  return pulse;
};

/**
 * Proxy the value of another operator as a pure signal value.
 * Ensures no tuples are propagated.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {*} params.value - The value to proxy, becomes the value of this operator.
 */
function Proxy(params) {
  Transform.call(this, null, params);
}

var prototype$35 = inherits(Proxy, Transform);

prototype$35.transform = function(_, pulse) {
  this.value = _.value;
  return _.modified('value')
    ? pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS)
    : pulse.StopPropagation;
};

/**
 * Compute rank order scores for tuples. The tuples are assumed to have been
 * sorted in the desired rank order by an upstream data source.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - An accessor for the field to rank.
 * @param {boolean} params.normalize - Boolean flag for normalizing rank values.
 *   If true, the integer rank scores are normalized to range [0, 1].
 */
function Rank(params) {
  Transform.call(this, null, params);
}

var prototype$36 = inherits(Rank, Transform);

prototype$36.transform = function(_, pulse) {
  if (!pulse.source) {
    error('Rank transform requires an upstream data source.');
  }

  var norm  = _.normalize,
      field = _.field,
      as = _.as || 'rank',
      ranks = {},
      n = -1, rank;

  if (field) {
    // If we have a field accessor, first compile distinct keys.
    pulse.visit(pulse.SOURCE, function(t) {
      var v = field(t);
      if (ranks[v] == null) ranks[v] = ++n;
    });
    pulse.visit(pulse.SOURCE, norm && --n
      ? function(t) { t[as] = ranks[field(t)] / n; }
      : function(t) { t[as] = ranks[field(t)]; }
    );
  } else {
    n += pulse.source.length;
    rank = -1;
    // Otherwise rank all the tuples together.
    pulse.visit(pulse.SOURCE, norm && n
      ? function(t) { t[as] = ++rank / n; }
      : function(t) { t[as] = ++rank; }
    );
  }

  return pulse.reflow(_.modified()).modifies(as);
};

/**
 * Relays a data stream between data processing pipelines.
 * If the derive parameter is set, this transform will create derived
 * copies of observed tuples. This provides derived data streams in which
 * modifications to the tuples do not pollute an upstream data source.
 * @param {object} params - The parameters for this operator.
 * @param {number} [params.derive=false] - Boolean flag indicating if
 *   the transform should make derived copies of incoming tuples.
 * @constructor
 */
function Relay(params) {
  Transform.call(this, null, params);
}

var prototype$37 = inherits(Relay, Transform);

prototype$37.transform = function(_, pulse) {
  var out,
      lut = this.value || (out = pulse = pulse.addAll(), this.value = {});

  if (_.derive) {
    out = pulse.fork();

    pulse.visit(pulse.ADD, function(t) {
      var dt = derive(t);
      lut[t._id] = dt;
      out.add.push(dt);
    });

    pulse.visit(pulse.MOD, function(t) {
      out.mod.push(rederive(t, lut[t._id]));
    });

    pulse.visit(pulse.REM, function(t) {
      out.rem.push(lut[t._id]);
      lut[t._id] = null;
    });
  }

  return out;
};

/**
 * Samples tuples passing through this operator.
 * Uses reservoir sampling to maintain a representative sample.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {number} [params.size=1000] - The maximum number of samples.
 */
function Sample(params) {
  Transform.call(this, [], params);
  this.count = 0;
}

var prototype$38 = inherits(Sample, Transform);

prototype$38.transform = function(_, pulse) {
  var out = pulse.fork(),
      mod = _.modified('size'),
      num = _.size,
      res = this.value,
      cnt = this.count,
      cap = 0,
      map = res.reduce(function(m, t) { return (m[t._id] = 1, m); }, {});

  // sample reservoir update function
  function update(t) {
    var p, idx;

    if (res.length < num) {
      res.push(t);
    } else {
      idx = ~~(cnt * Math.random());
      if (idx < res.length && idx >= cap) {
        p = res[idx];
        if (map[p._id]) out.rem.push(p); // eviction
        res[idx] = t;
      }
    }
    ++cnt;
  }

  if (pulse.rem.length) {
    // find all tuples that should be removed, add to output
    pulse.visit(pulse.REM, function(t) {
      if (map[t._id]) {
        map[t._id] = -1;
        out.rem.push(t);
      }
      --cnt;
    });

    // filter removed tuples out of the sample reservoir
    res = res.filter(function(t) { return map[t._id] !== -1; });
  }

  if ((pulse.rem.length || mod) && res.length < num && pulse.source) {
    // replenish sample if backing data source is available
    cap = cnt = res.length;
    pulse.visit(pulse.SOURCE, function(t) {
      // update, but skip previously sampled tuples
      if (!map[t._id]) update(t);
    });
    cap = -1;
  }

  if (mod && res.length > num) {
    for (var i=0, n=res.length-num; i<n; ++i) {
      map[res[i]._id] = -1;
      out.rem.push(res[i]);
    }
    res = res.slice(n);
  }

  if (pulse.mod.length) {
    // propagate modified tuples in the sample reservoir
    pulse.visit(pulse.MOD, function(t) {
      if (map[t._id]) out.mod.push(t);
    });
  }

  if (pulse.add.length) {
    // update sample reservoir
    pulse.visit(pulse.ADD, update);
  }

  if (pulse.add.length || cap < 0) {
    // output newly added tuples
    out.add = res.filter(function(t) { return !map[t._id]; });
  }

  this.count = cnt;
  this.value = out.source = res;
  return out;
};

/**
 * Generates data tuples for a specified sequence range of numbers.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {number} params.start - The first number in the sequence.
 * @param {number} params.stop - The last number (exclusive) in the sequence.
 * @param {number} [params.step=1] - The step size between numbers in the sequence.
 */
function Sequence(params) {
  Transform.call(this, null, params);
}

var prototype$39 = inherits(Sequence, Transform);

prototype$39.transform = function(_, pulse) {
  if (this.value && !_.modified()) return;

  var out = pulse.materialize().fork(pulse.MOD);

  out.rem = this.value ? pulse.rem.concat(this.value) : pulse.rem;
  out.source = this.value = d3Array.range(_.start, _.stop, _.step || 1).map(ingest);
  out.add = pulse.add.concat(this.value);
  return out;
};

/**
 * Propagates a new pulse without any tuples so long as the input
 * pulse contains some added, removed or modified tuples.
 * @param {object} params - The parameters for this operator.
 * @constructor
 */
function Sieve(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

var prototype$40 = inherits(Sieve, Transform);

prototype$40.transform = function(_, pulse) {
  this.value = pulse.source;
  return pulse.changed()
    ? pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS)
    : pulse.StopPropagation;
};

/**
 * An index that maps from unique, string-coerced, field values to tuples.
 * Assumes that the field serves as a unique key with no duplicate values.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field accessor to index.
 */
function TupleIndex(params) {
  Transform.call(this, fastmap(), params);
}

var prototype$41 = inherits(TupleIndex, Transform);

prototype$41.transform = function(_, pulse) {
  var df = pulse.dataflow,
      field = _.field,
      index = this.value,
      mod = true;

  function set(t) { index.set(field(t), t); }

  if (_.modified('field') || pulse.modified(field.fields)) {
    index.clear();
    pulse.visit(pulse.SOURCE, set);
  } else if (pulse.changed()) {
    pulse.visit(pulse.REM, function(t) { index.delete(field(t)); });
    pulse.visit(pulse.ADD, set);
  } else {
    mod = false;
  }

  this.modified(mod);
  if (index.empty > df.cleanThreshold) df.runAfter(index.clean);
  return pulse.fork();
};

/**
 * Extracts an array of values. Assumes the source data has already been
 * reduced as needed (e.g., by an upstream Aggregate transform).
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The domain field to extract.
 * @param {function(*,*): number} [params.sort] - An optional
 *   comparator function for sorting the values. The comparator will be
 *   applied to backing tuples prior to value extraction.
 */
function Values(params) {
  Transform.call(this, null, params);
}

var prototype$42 = inherits(Values, Transform);

prototype$42.transform = function(_, pulse) {
  var run = !this.value
    || _.modified('field')
    || _.modified('sort')
    || pulse.changed()
    || (_.sort && pulse.modified(_.sort.fields));

  if (run) {
    this.value = (_.sort
      ? pulse.source.slice().sort(_.sort)
      : pulse.source).map(_.field);
  }
};

var AggregateDefinition = {
  "type": "Aggregate",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "groupby", "type": "field", "array": true },
    { "name": "fields", "type": "field", "array": true },
    { "name": "ops", "type": "enum", "array": true,
      "values": [
        "count", "valid", "missing", "distinct",
        "sum", "mean", "average",
        "variance", "variancep", "stdev", "stdevp", "stderr",
        "median", "q1", "q3", "ci0", "ci1",
        "min", "max", "argmin", "argmax" ] },
    { "name": "as", "type": "string", "array": true },
    { "name": "drop", "type": "boolean", "default": true },
    { "name": "cross", "type": "boolean", "default": false },
    { "name": "key", "type": "field" }
  ]
};

var BinDefinition = {
  "type": "Bin",
  "metadata": {"modifies": true},
  "params": [
    { "name": "field", "type": "field", "required": true },
    { "name": "anchor", "type": "number" },
    { "name": "maxbins", "type": "number", "default": 20 },
    { "name": "base", "type": "number", "default": 10 },
    { "name": "divide", "type": "number", "array": true, "default": [5, 2] },
    { "name": "extent", "type": "number", "array": true, "length": 2, "required": true },
    { "name": "step", "type": "number" },
    { "name": "steps", "type": "number", "array": true },
    { "name": "minstep", "type": "number", "default": 0 },
    { "name": "nice", "type": "boolean", "default": true },
    { "name": "name", "type": "string" },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["bin0", "bin1"] }
  ]
};

var CollectDefinition = {
  "type": "Collect",
  "metadata": {"source": true},
  "params": [
    { "name": "sort", "type": "compare" }
  ]
};

var CountPatternDefinition = {
  "type": "CountPattern",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "field", "type": "field", "required": true },
    { "name": "case", "type": "enum", "values": ["upper", "lower", "mixed"], "default": "mixed" },
    { "name": "pattern", "type": "string", "default": "[\\w\"]+" },
    { "name": "stopwords", "type": "string", "default": "" },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["text", "count"] }
  ]
};

var CrossDefinition = {
  "type": "Cross",
  "metadata": {"source": true, "generates": true, "changes": true},
  "params": [
    { "name": "filter", "type": "expr" },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["a", "b"] }
  ]
};

var distributions = [
  {
    "key": {"function": "normal"},
    "params": [
      { "name": "mean", "type": "number", "default": 0 },
      { "name": "stdev", "type": "number", "default": 1 }
    ]
  },
  {
    "key": {"function": "uniform"},
    "params": [
      { "name": "min", "type": "number", "default": 0 },
      { "name": "max", "type": "number", "default": 1 }
    ]
  },
  {
    "key": {"function": "kde"},
    "params": [
      { "name": "field", "type": "field", "required": true },
      { "name": "from", "type": "data" },
      { "name": "bandwidth", "type": "number", "default": 0 }
    ]
  }
];

var mixture = {
  "key": {"function": "mixture"},
  "params": [
    { "name": "distributions", "type": "param", "array": true,
      "params": distributions },
    { "name": "weights", "type": "number", "array": true }
  ]
};

var DensityDefinition = {
  "type": "Density",
  "metadata": {"generates": true, "source": true},
  "params": [
    { "name": "extent", "type": "number", "array": true, "length": 2 },
    { "name": "steps", "type": "number", "default": 100 },
    { "name": "method", "type": "string", "default": "pdf",
      "values": ["pdf", "cdf"] },
    { "name": "distribution", "type": "param",
      "params": distributions.concat(mixture) },
    { "name": "as", "type": "string", "array": true,
      "default": ["value", "density"] }
  ]
};

var ExtentDefinition = {
  "type": "Extent",
  "metadata": {},
  "params": [
    { "name": "field", "type": "field", "required": true }
  ]
};

var FilterDefinition = {
  "type": "Filter",
  "metadata": {"changes": true},
  "params": [
    { "name": "expr", "type": "expr", "required": true }
  ]
};

var FoldDefinition = {
  "type": "Fold",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["key", "value"] }
  ]
};

var FormulaDefinition = {
  "type": "Formula",
  "metadata": {"modifies": true},
  "params": [
    { "name": "expr", "type": "expr", "required": true },
    { "name": "as", "type": "string", "required": true },
    { "name": "initonly", "type": "boolean" }
  ]
};

var ImputeDefinition = {
  "type": "Impute",
  "metadata": {"changes": true},
  "params": [
    { "name": "field", "type": "field", "required": true },
    { "name": "groupby", "type": "field", "array": true },
    { "name": "orderby", "type": "field", "array": true },
    { "name": "method", "type": "enum", "default": "value",
      "values": ["value", "mean", "median", "max", "min"] },
    { "name": "value", "default": 0 }
  ]
};

var LookupDefinition = {
  "type": "Lookup",
  "metadata": {"modifies": true},
  "params": [
    { "name": "index", "type": "index", "params": [
        {"name": "from", "type": "data", "required": true },
        {"name": "key", "type": "field", "required": true }
      ] },
    { "name": "values", "type": "field", "array": true },
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "as", "type": "string", "array": true },
    { "name": "default", "default": null }
  ]
};

var RankDefinition = {
  "type": "Rank",
  "metadata": {"modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "normalize", "type": "boolean", "default": false },
    { "name": "as", "type": "string", "default": "rank" }
  ]
};

var SampleDefinition = {
  "type": "Sample",
  "metadata": {"source": true, "changes": true},
  "params": [
    { "name": "size", "type": "number", "default": 1000 }
  ]
};

var SequenceDefinition = {
  "type": "Sequence",
  "metadata": {"generates": true, "source": true},
  "params": [
    { "name": "start", "type": "number", "required": true },
    { "name": "stop", "type": "number", "required": true },
    { "name": "step", "type": "number", "default": 1 }
  ],
  "output": ["value"]
};

// Data Transforms
register(AggregateDefinition, Aggregate);
register(BinDefinition, Bin);
register(CollectDefinition, Collect);
register(CountPatternDefinition, CountPattern);
register(CrossDefinition, Cross);
register(DensityDefinition, Density);
register(ExtentDefinition, Extent);
register(FilterDefinition, Filter);
register(FoldDefinition, Fold);
register(FormulaDefinition, Formula);
register(ImputeDefinition, Impute);
register(LookupDefinition, Lookup);
register(RankDefinition, Rank);
register(SampleDefinition, Sample);
register(SequenceDefinition, Sequence);

transform('Compare', Compare);
transform('Facet', Facet);
transform('Field', Field);
transform('Generate', Generate);
transform('Key', Key);
transform('MultiExtent', MultiExtent);
transform('MultiValues', MultiValues);
transform('Params', Params);
transform('PreFacet', PreFacet);
transform('Proxy', Proxy);
transform('Relay', Relay);
transform('Sieve', Sieve);
transform('Subflow', Subflow);
transform('TupleIndex', TupleIndex);
transform('Values', Values);

function invertRange(scale) {
  return function(_) {
    var lo = _[0],
        hi = _[1],
        t;

    if (hi < lo) t = lo, lo = hi, hi = t;

    return [
      scale.invert(lo),
      scale.invert(hi)
    ];
  }
}

function invertRangeExtent(scale) {
  return function(_) {
    var range = scale.range(),
        lo = _[0],
        hi = _[1],
        min = -1, max, t, i, n;

    if (hi < lo) t = lo, lo = hi, hi = t;

    for (i=0, n=range.length; i<n; ++i) {
      if (range[i] >= lo && range[i] <= hi) {
        if (min < 0) min = i;
        max = i;
      }
    }

    if (min < 0) return undefined;

    lo = scale.invertExtent(range[min]);
    hi = scale.invertExtent(range[max]);

    return [
      lo[0] === undefined ? lo[1] : lo[0],
      hi[1] === undefined ? hi[0] : hi[1]
    ];
  }
}

function bandSpace(count, paddingInner, paddingOuter) {
  var space = count - paddingInner + paddingOuter * 2;
  return count ? (space > 0 ? space : 1) : 0;
}

function band() {
  var scale = $.scaleOrdinal().unknown(undefined),
      domain = scale.domain,
      ordinalRange = scale.range,
      range = [0, 1],
      step,
      bandwidth,
      round = false,
      paddingInner = 0,
      paddingOuter = 0,
      align = 0.5;

  delete scale.unknown;

  function rescale() {
    var n = domain().length,
        reverse = range[1] < range[0],
        start = range[reverse - 0],
        stop = range[1 - reverse],
        space = bandSpace(n, paddingInner, paddingOuter);
    step = (stop - start) / (space || 1);
    if (round) step = Math.floor(step);
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
    var values = d3Array.range(n).map(function(i) { return start + step * i; });
    return ordinalRange(reverse ? values.reverse() : values);
  }

  scale.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.range = function(_) {
    return arguments.length ? (range = [+_[0], +_[1]], rescale()) : range.slice();
  };

  scale.rangeRound = function(_) {
    return range = [+_[0], +_[1]], round = true, rescale();
  };

  scale.bandwidth = function() {
    return bandwidth;
  };

  scale.step = function() {
    return step;
  };

  scale.round = function(_) {
    return arguments.length ? (round = !!_, rescale()) : round;
  };

  scale.padding = function(_) {
    return arguments.length ? (paddingInner = paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingInner = function(_) {
    return arguments.length ? (paddingInner = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingOuter = function(_) {
    return arguments.length ? (paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingOuter;
  };

  scale.align = function(_) {
    return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
  };

  scale.invertRange = function(_) {
    var lo = +_[0],
        hi = +_[1],
        reverse = range[1] < range[0],
        values = reverse ? ordinalRange().reverse() : ordinalRange(),
        n = values.length - 1, a, b, t;

    // order range inputs, bail if outside of scale range
    if (hi < lo) t = lo, lo = hi, hi = t;
    if (hi < values[0] || lo > range[1-reverse]) return undefined;

    // binary search to index into scale range
    a = Math.max(0, d3Array.bisectRight(values, lo) - 1);
    b = lo===hi ? a : d3Array.bisectRight(values, hi) - 1;

    // increment index a if lo is within padding gap
    if (lo - values[a] > bandwidth + 1e-10) ++a;

    if (reverse) t = a, a = n - b, b = n - t; // map + swap
    return (a > b) ? undefined : domain().slice(a, b+1);
  };

  scale.invert = function(_) {
    var value = scale.invertRange([_, _]);
    return value ? value[0] : value;
  };

  scale.copy = function() {
    return band()
        .domain(domain())
        .range(range)
        .round(round)
        .paddingInner(paddingInner)
        .paddingOuter(paddingOuter)
        .align(align);
  };

  return rescale();
}

function pointish(scale) {
  var copy = scale.copy;

  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;

  scale.copy = function() {
    return pointish(copy());
  };

  return scale;
}

function point$1() {
  return pointish(band().paddingInner(1));
}

var map = Array.prototype.map;
var slice = Array.prototype.slice;
function numbers$1(_) {
  return map.call(_, function(x) { return +x; });
}

function binLinear() {
  var linear = $.scaleLinear(),
      domain = [];

  function scale(x) {
    return x == null || x !== x
      ? undefined
      : linear(domain[Math.max(d3Array.bisect(domain, x), 1)-1]);
  }

  function setDomain(_) {
    domain = numbers$1(_);
    linear.domain([domain[0], peek(domain)]);
  }

  scale.domain = function(_) {
    return arguments.length ? (setDomain(_), scale) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (linear.range(_), scale) : linear.range();
  };

  scale.rangeRound = function(_) {
    return arguments.length ? (linear.rangeRound(_), scale) : linear.rangeRound();
  };

  scale.interpolate = function(_) {
    return arguments.length ? (linear.interpolate(_), scale) : linear.interpolate();
  };

  scale.invert = function(_) {
    return linear.invert(_);
  };

  scale.ticks = function(count) {
    var n = domain.length,
        stride = ~~(n / (count || n));

    return stride < 2
      ? scale.domain()
      : domain.filter(function(x, i) { return !(i % stride); });
  };

  scale.tickFormat = function() {
    return linear.tickFormat.apply(linear, arguments);
  };

  scale.copy = function() {
    return binLinear().domain(scale.domain()).range(scale.range());
  };

  return scale;
}

function binOrdinal() {
  var domain = [],
      range = [];

  function scale(x) {
    return x == null || x !== x
      ? undefined
      : range[(d3Array.bisect(domain, x) - 1) % range.length];
  }

  scale.domain = function(_) {
    return arguments.length ? (domain = numbers$1(_), scale) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (range = slice.call(_), scale) : range.slice();
  };

  scale.copy = function() {
    return binOrdinal().domain(scale.domain()).range(scale.range());
  };

  return scale;
}

function sequential(interpolator) {
  var linear = $.scaleLinear(),
      x0 = 0,
      dx = 1,
      clamp = false;

  function update() {
    var domain = linear.domain();
    x0 = domain[0];
    dx = peek(domain) - x0;
  }

  function scale(x) {
    var t = (x - x0) / dx;
    return interpolator(clamp ? Math.max(0, Math.min(1, t)) : t);
  }

  scale.clamp = function(_) {
    return arguments.length ? (clamp = !!_, scale) : clamp;
  };

  scale.domain = function(_) {
    return arguments.length ? (linear.domain(_), update(), scale) : linear.domain();
  };

  scale.interpolator = function(_) {
    return arguments.length ? (interpolator = _, scale) : interpolator;
  };

  scale.copy = function() {
    return sequential().domain(linear.domain()).clamp(clamp).interpolator(interpolator);
  };

  scale.ticks = function(count) {
    return linear.ticks(count);
  };

  scale.tickFormat = function(count, specifier) {
    return linear.tickFormat(count, specifier);
  };

  scale.nice = function(count) {
    return linear.nice(count), update(), scale;
  };

  return scale;
}

/**
 * Augment scales with their type and needed inverse methods.
 */
function create(type, constructor) {
  return function scale() {
    var s = constructor();

    if (!s.invertRange) {
      s.invertRange = s.invert ? invertRange(s)
        : s.invertExtent ? invertRangeExtent(s)
        : undefined;
    }

    return s.type = type, s;
  };
}

function scale$1(type, scale) {
  return arguments.length > 1 ? (scales[type] = create(type, scale), this)
    : scales.hasOwnProperty(type) ? scales[type] : undefined;
}

var scales = {
  // base scale types
  identity:      $.scaleIdentity,
  linear:        $.scaleLinear,
  log:           $.scaleLog,
  ordinal:       $.scaleOrdinal,
  pow:           $.scalePow,
  sqrt:          $.scaleSqrt,
  quantile:      $.scaleQuantile,
  quantize:      $.scaleQuantize,
  threshold:     $.scaleThreshold,
  time:          $.scaleTime,
  utc:           $.scaleUtc,

  // extended scale types
  band:          band,
  point:         point$1,
  sequential:    sequential,
  'bin-linear':  binLinear,
  'bin-ordinal': binOrdinal
};

for (var key$1 in scales) {
  scale$1(key$1, scales[key$1]);
}

function colors(specifier) {
  var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
  while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
  return colors;
}

var tableau10 = colors(
  '4c78a8f58518e4575672b7b254a24beeca3bb279a2ff9da69d755dbab0ac'
);

var tableau20 = colors(
  '4c78a89ecae9f58518ffbf7954a24b88d27ab79a20f2cf5b43989483bcb6e45756ff9d9879706ebab0acd67195fcbfd2b279a2d6a5c99e765fd8b5a5'
);

var blueOrange = new Array(3).concat(
  "67a9cff7f7f7f1a340",
  "0571b092c5defdb863e66101",
  "0571b092c5def7f7f7fdb863e66101",
  "2166ac67a9cfd1e5f0fee0b6f1a340b35806",
  "2166ac67a9cfd1e5f0f7f7f7fee0b6f1a340b35806",
  "2166ac4393c392c5ded1e5f0fee0b6fdb863e08214b35806",
  "2166ac4393c392c5ded1e5f0f7f7f7fee0b6fdb863e08214b35806",
  "0530612166ac4393c392c5ded1e5f0fee0b6fdb863e08214b358067f3b08",
  "0530612166ac4393c392c5ded1e5f0f7f7f7fee0b6fdb863e08214b358067f3b08"
).map(colors);

var discrete = {
  blueorange:  blueOrange
};

var schemes = {
  // d3 built-in categorical palettes
  category10:  $.schemeCategory10,
  category20:  $.schemeCategory20,
  category20b: $.schemeCategory20b,
  category20c: $.schemeCategory20c,

  // extended categorical palettes
  accent:      _.schemeAccent,
  dark2:       _.schemeDark2,
  paired:      _.schemePaired,
  pastel1:     _.schemePastel1,
  pastel2:     _.schemePastel2,
  set1:        _.schemeSet1,
  set2:        _.schemeSet2,
  set3:        _.schemeSet3,
  tableau10:   tableau10,
  tableau20:   tableau20,

  // d3 built-in interpolators
  viridis:     $.interpolateViridis,
  magma:       $.interpolateMagma,
  inferno:     $.interpolateInferno,
  plasma:      $.interpolatePlasma,

  // extended interpolators
  blueorange:  $$1.interpolateRgbBasis(peek(blueOrange))
};

function add$2(name, suffix) {
  schemes[name] = _['interpolate' + suffix];
  discrete[name] = _['scheme' + suffix];
}

// sequential single-hue
add$2('blues',    'Blues');
add$2('greens',   'Greens');
add$2('greys',    'Greys');
add$2('purples',  'Purples');
add$2('reds',     'Reds');
add$2('oranges',  'Oranges');

// diverging
add$2('brownbluegreen',    'BrBG');
add$2('purplegreen',       'PRGn');
add$2('pinkyellowgreen',   'PiYG');
add$2('purpleorange',      'PuOr');
add$2('redblue',           'RdBu');
add$2('redgrey',           'RdGy');
add$2('redyellowblue',     'RdYlBu');
add$2('redyellowgreen',    'RdYlGn');
add$2('spectral',          'Spectral');

// sequential multi-hue
add$2('bluegreen',         'BuGn');
add$2('bluepurple',        'BuPu');
add$2('greenblue',         'GnBu');
add$2('orangered',         'OrRd');
add$2('purplebluegreen',   'PuBuGn');
add$2('purpleblue',        'PuBu');
add$2('purplered',         'PuRd');
add$2('redpurple',         'RdPu');
add$2('yellowgreenblue',   'YlGnBu');
add$2('yellowgreen',       'YlGn');
add$2('yelloworangebrown', 'YlOrBr');
add$2('yelloworangered',   'YlOrRd');

function getScheme(name, scheme) {
  if (arguments.length > 1) return (schemes[name] = scheme, this);

  var part = name.split('-');
  name = part[0];
  part = +part[1] + 1;

  return part && discrete.hasOwnProperty(name) ? discrete[name][part-1]
    : !part && schemes.hasOwnProperty(name) ? schemes[name]
    : undefined;
}

function interpolateRange(interpolator, range) {
  var start = range[0],
      span = peek(range) - start;
  return function(i) { return interpolator(start + i * span); };
}

function scaleFraction(scale, min, max) {
  return scale.type === 'linear' || scale.type === 'sequential'
    ? function(_) { return (_ - min) / (max - min); }
    : scale.copy().domain([min, max]).range([0, 1]).interpolate(lerp);
}

function lerp(a, b) {
  var span = b - a;
  return function(i) { return a + i * span; }
}

function getInterpolate(type, gamma) {
  var interp = $$1[method(type)];
  return (gamma != null && interp && interp.gamma)
    ? interp.gamma(gamma)
    : interp;
}

function method(type) {
  return 'interpolate' + type.toLowerCase()
    .split('-')
    .map(function(s) { return s[0].toUpperCase() + s.slice(1); })
    .join('');
}

var array$1 = Array.prototype;

var slice$1 = array$1.slice;

function ascending$1(a, b) {
  return a - b;
}

function area$3(ring) {
  var i = 0, n = ring.length, area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  return area;
}

function constant$2(x) {
  return function() {
    return x;
  };
}

function contains(ring, hole) {
  var i = -1, n = hole.length, c;
  while (++i < n) if (c = ringContains(ring, hole[i])) return c;
  return 0;
}

function ringContains(ring, point) {
  var x = point[0], y = point[1], contains = -1;
  for (var i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
    var pi = ring[i], xi = pi[0], yi = pi[1], pj = ring[j], xj = pj[0], yj = pj[1];
    if (segmentContains(pi, pj, point)) return 0;
    if (((yi > y) !== (yj > y)) && ((x < (xj - xi) * (y - yi) / (yj - yi) + xi))) contains = -contains;
  }
  return contains;
}

function segmentContains(a, b, c) {
  var i; return collinear(a, b, c) && within(a[i = +(a[0] === b[0])], c[i], b[i]);
}

function collinear(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) === (c[0] - a[0]) * (b[1] - a[1]);
}

function within(p, q, r) {
  return p <= q && q <= r || r <= q && q <= p;
}

function noop$1() {}

var cases = [
  [],
  [[[1,1.5],[0.5,1]]],
  [[[1.5,1],[1,1.5]]],
  [[[1.5,1],[0.5,1]]],
  [[[1,0.5],[1.5,1]]],
  [[[1,0.5],[0.5,1]],[[1,1.5],[1.5,1]]],
  [[[1,0.5],[1,1.5]]],
  [[[1,0.5],[0.5,1]]],
  [[[0.5,1],[1,0.5]]],
  [[[1,1.5],[1,0.5]]],
  [[[0.5,1],[1,1.5]],[[1.5,1],[1,0.5]]],
  [[[1.5,1],[1,0.5]]],
  [[[0.5,1],[1.5,1]]],
  [[[1,1.5],[1.5,1]]],
  [[[0.5,1],[1,1.5]]],
  []
];

function contours() {
  var dx = 1,
      dy = 1,
      threshold = d3Array.thresholdSturges,
      smooth = smoothLinear;

  function contours(values) {
    var tz = threshold(values);

    // Convert number of thresholds into uniform thresholds.
    if (!Array.isArray(tz)) {
      var domain = d3Array.extent(values), start = domain[0], stop = domain[1];
      tz = d3Array.tickStep(start, stop, tz);
      tz = d3Array.range(Math.floor(start / tz) * tz, Math.floor(stop / tz) * tz, tz);
    } else {
      tz = tz.slice().sort(ascending$1);
    }

    // Accumulate, smooth contour rings, assign holes to exterior rings.
    // Based on https://github.com/mbostock/shapefile/blob/v0.6.2/shp/polygon.js
    var layers = tz.map(function(value) {
      var polygons = [],
          holes = [];

      isorings(values, value, function(ring) {
        smooth(ring, values, value);
        if (area$3(ring) > 0) polygons.push([ring]);
        else holes.push(ring);
      });

      holes.forEach(function(hole) {
        for (var i = 0, n = polygons.length, polygon; i < n; ++i) {
          if (contains((polygon = polygons[i])[0], hole)) {
            polygon.push(hole);
            return;
          }
        }
      });

      return polygons;
    });

    return layers.map(function(polygons, i) {
      return {
        type: "MultiPolygon",
        value: tz[i],
        coordinates: polygons
      };
    });
  }

  // Marching squares with isolines stitched into rings.
  // Based on https://github.com/topojson/topojson-client/blob/v3.0.0/src/stitch.js
  function isorings(values, value, callback) {
    var fragmentByStart = new Array,
        fragmentByEnd = new Array,
        x, y, t0, t1, t2, t3;

    // Special case for the first row (y = -1, t2 = t3 = 0).
    x = y = -1;
    t1 = values[0] >= value;
    cases[t1 << 1].forEach(stitch);
    while (++x < dx - 1) {
      t0 = t1, t1 = values[x + 1] >= value;
      cases[t0 | t1 << 1].forEach(stitch);
    }
    cases[t1 << 0].forEach(stitch);

    // General case for the intermediate rows.
    while (++y < dy - 1) {
      x = -1;
      t1 = values[y * dx + dx] >= value;
      t2 = values[y * dx] >= value;
      cases[t1 << 1 | t2 << 2].forEach(stitch);
      while (++x < dx - 1) {
        t0 = t1, t1 = values[y * dx + dx + x + 1] >= value;
        t3 = t2, t2 = values[y * dx + x + 1] >= value;
        cases[t0 | t1 << 1 | t2 << 2 | t3 << 3].forEach(stitch);
      }
      cases[t1 | t2 << 3].forEach(stitch);
    }

    // Special case for the last row (y = dy - 1, t0 = t1 = 0).
    x = -1;
    t2 = values[y * dx] >= value;
    cases[t2 << 2].forEach(stitch);
    while (++x < dx - 1) {
      t3 = t2, t2 = values[y * dx + x + 1] >= value;
      cases[t2 << 2 | t3 << 3].forEach(stitch);
    }
    cases[t2 << 3].forEach(stitch);

    function stitch(line) {
      var start = [line[0][0] + x, line[0][1] + y],
          end = [line[1][0] + x, line[1][1] + y],
          startIndex = index(start),
          endIndex = index(end),
          f, g;
      if (f = fragmentByEnd[startIndex]) {
        if (g = fragmentByStart[endIndex]) {
          delete fragmentByEnd[f.end];
          delete fragmentByStart[g.start];
          if (f === g) {
            f.ring.push(end);
            callback(f.ring);
          } else {
            fragmentByStart[f.start] = fragmentByEnd[g.end] = {start: f.start, end: g.end, ring: f.ring.concat(g.ring)};
          }
        } else {
          delete fragmentByEnd[f.end];
          f.ring.push(end);
          fragmentByEnd[f.end = endIndex] = f;
        }
      } else if (f = fragmentByStart[endIndex]) {
        if (g = fragmentByEnd[startIndex]) {
          delete fragmentByStart[f.start];
          delete fragmentByEnd[g.end];
          if (f === g) {
            f.ring.push(end);
            callback(f.ring);
          } else {
            fragmentByStart[g.start] = fragmentByEnd[f.end] = {start: g.start, end: f.end, ring: g.ring.concat(f.ring)};
          }
        } else {
          delete fragmentByStart[f.start];
          f.ring.unshift(start);
          fragmentByStart[f.start = startIndex] = f;
        }
      } else {
        fragmentByStart[startIndex] = fragmentByEnd[endIndex] = {start: startIndex, end: endIndex, ring: [start, end]};
      }
    }
  }

  function index(point) {
    return point[0] * 2 + point[1] * (dx + 1) * 4;
  }

  function smoothLinear(ring, values, value) {
    ring.forEach(function(point) {
      var x = point[0],
          y = point[1],
          xt = x | 0,
          yt = y | 0,
          v0,
          v1 = values[yt * dx + xt];
      if (x > 0 && x < dx && xt === x) {
        v0 = values[yt * dx + xt - 1];
        point[0] = x + (value - v0) / (v1 - v0) - 0.5;
      }
      if (y > 0 && y < dy && yt === y) {
        v0 = values[(yt - 1) * dx + xt];
        point[1] = y + (value - v0) / (v1 - v0) - 0.5;
      }
    });
  }

  contours.size = function(_) {
    if (!arguments.length) return [dx, dy];
    var _0 = Math.ceil(_[0]), _1 = Math.ceil(_[1]);
    if (!(_0 > 0) || !(_1 > 0)) throw new Error("invalid size");
    return dx = _0, dy = _1, contours;
  };

  contours.thresholds = function(_) {
    return arguments.length ? (threshold = typeof _ === "function" ? _ : Array.isArray(_) ? constant$2(slice$1.call(_)) : constant$2(_), contours) : threshold;
  };

  contours.smooth = function(_) {
    return arguments.length ? (smooth = _ ? smoothLinear : noop$1, contours) : smooth === smoothLinear;
  };

  return contours;
}

// TODO Optimize edge cases.
// TODO Optimize index calculation.
// TODO Optimize arguments.
function blurX(source, target, r) {
  var n = source.width,
      m = source.height,
      w = (r << 1) + 1;
  for (var j = 0; j < m; ++j) {
    for (var i = 0, sr = 0; i < n + r; ++i) {
      if (i < n) {
        sr += source.data[i + j * n];
      }
      if (i >= r) {
        if (i >= w) {
          sr -= source.data[i - w + j * n];
        }
        target.data[i - r + j * n] = sr / Math.min(i + 1, n - 1 + w - i, w);
      }
    }
  }
}

// TODO Optimize edge cases.
// TODO Optimize index calculation.
// TODO Optimize arguments.
function blurY(source, target, r) {
  var n = source.width,
      m = source.height,
      w = (r << 1) + 1;
  for (var i = 0; i < n; ++i) {
    for (var j = 0, sr = 0; j < m + r; ++j) {
      if (j < m) {
        sr += source.data[i + j * n];
      }
      if (j >= r) {
        if (j >= w) {
          sr -= source.data[i + (j - w) * n];
        }
        target.data[i + (j - r) * n] = sr / Math.min(j + 1, m - 1 + w - j, w);
      }
    }
  }
}

function defaultX(d) {
  return d[0];
}

function defaultY(d) {
  return d[1];
}

function contourDensity() {
  var x = defaultX,
      y = defaultY,
      dx = 960,
      dy = 500,
      r = 20, // blur radius
      k = 2, // log2(grid cell size)
      o = r * 3, // grid offset, to pad for blur
      n = (dx + o * 2) >> k, // grid width
      m = (dy + o * 2) >> k, // grid height
      threshold = constant$2(20);

  function density(data) {
    var values0 = new Float32Array(n * m),
        values1 = new Float32Array(n * m);

    data.forEach(function(d, i, data) {
      var xi = (x(d, i, data) + o) >> k,
          yi = (y(d, i, data) + o) >> k;
      if (xi >= 0 && xi < n && yi >= 0 && yi < m) {
        ++values0[xi + yi * n];
      }
    });

    // TODO Optimize.
    blurX({width: n, height: m, data: values0}, {width: n, height: m, data: values1}, r >> k);
    blurY({width: n, height: m, data: values1}, {width: n, height: m, data: values0}, r >> k);
    blurX({width: n, height: m, data: values0}, {width: n, height: m, data: values1}, r >> k);
    blurY({width: n, height: m, data: values1}, {width: n, height: m, data: values0}, r >> k);
    blurX({width: n, height: m, data: values0}, {width: n, height: m, data: values1}, r >> k);
    blurY({width: n, height: m, data: values1}, {width: n, height: m, data: values0}, r >> k);

    var tz = threshold(values0);

    // Convert number of thresholds into uniform thresholds.
    if (!Array.isArray(tz)) {
      var stop = d3Array.max(values0);
      tz = d3Array.tickStep(0, stop, tz);
      tz = d3Array.range(0, Math.floor(stop / tz) * tz, tz);
      tz.shift();
    }

    return contours()
        .thresholds(tz)
        .size([n, m])
      (values0)
        .map(transform);
  }

  function transform(geometry) {
    geometry.value *= Math.pow(2, -2 * k); // Density in points per square pixel.
    geometry.coordinates.forEach(transformPolygon);
    return geometry;
  }

  function transformPolygon(coordinates) {
    coordinates.forEach(transformRing);
  }

  function transformRing(coordinates) {
    coordinates.forEach(transformPoint);
  }

  // TODO Optimize.
  function transformPoint(coordinates) {
    coordinates[0] = coordinates[0] * Math.pow(2, k) - o;
    coordinates[1] = coordinates[1] * Math.pow(2, k) - o;
  }

  function resize() {
    o = r * 3;
    n = (dx + o * 2) >> k;
    m = (dy + o * 2) >> k;
    return density;
  }

  density.x = function(_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant$2(+_), density) : x;
  };

  density.y = function(_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant$2(+_), density) : y;
  };

  density.size = function(_) {
    if (!arguments.length) return [dx, dy];
    var _0 = Math.ceil(_[0]), _1 = Math.ceil(_[1]);
    if (!(_0 >= 0) && !(_0 >= 0)) throw new Error("invalid size");
    return dx = _0, dy = _1, resize();
  };

  density.cellSize = function(_) {
    if (!arguments.length) return 1 << k;
    if (!((_ = +_) >= 1)) throw new Error("invalid cell size");
    return k = Math.floor(Math.log(_) / Math.LN2), resize();
  };

  density.thresholds = function(_) {
    return arguments.length ? (threshold = typeof _ === "function" ? _ : Array.isArray(_) ? constant$2(slice$1.call(_)) : constant$2(_), density) : threshold;
  };

  density.bandwidth = function(_) {
    if (!arguments.length) return Math.sqrt(r * (r + 1));
    if (!((_ = +_) >= 0)) throw new Error("invalid bandwidth");
    return r = Math.round((Math.sqrt(4 * _ * _ + 1) - 1) / 2), resize();
  };

  return density;
}

var CONTOUR_PARAMS = ['values', 'size', 'thresholds'];
var DENSITY_PARAMS = ['x', 'y', 'size', 'cellSize', 'bandwidth', 'thresholds'];

/**
 * Generate contours based on kernel-density estimation of point data.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<number>} params.size - The dimensions [width, height] over which to compute contours.
 *  If the values parameter is provided, this must be the dimensions of the input data.
 *  If density estimation is performed, this is the output view dimensions in pixels.
 * @param {Array<number>} [params.values] - An array of numeric values representing an
 *  width x height grid of values over which to compute contours. If unspecified, this
 *  transform will instead attempt to compute contours for the kernel density estimate
 *  using values drawn from data tuples in the input pulse.
 * @param {function(object): number} [params.x] - The pixel x-coordinate accessor for density estimation.
 * @param {function(object): number} [params.y] - The pixel y-coordinate accessor for density estimation.
 * @param {number} [params.cellSize] - Contour density calculation cell size.
 * @param {number} [params.bandwidth] - Kernel density estimation bandwidth.
 * @param {number} [params.thresholds] - Contour threshold array or desired number of contours.
 */
function Contour(params) {
  Transform.call(this, null, params);
}

var prototype$43 = inherits(Contour, Transform);

prototype$43.transform = function(_, pulse) {
  if (this.value && !pulse.changed() && !_.modified())
    return pulse.StopPropagation;

  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      contour, params, values;

  if (_.values) {
    contour = contours();
    params = CONTOUR_PARAMS;
    values = _.values;
  } else {
    contour = contourDensity();
    params = DENSITY_PARAMS;
    values = pulse.materialize(pulse.SOURCE).source;
  }

  params.forEach(function(param) {
    if (_[param] != null) contour[param](_[param]);
  });

  if (this.value) out.rem = this.value;
  this.value = out.source = out.add = contour(values).map(ingest);

  return out;
};

var defaultPath = d3Geo.geoPath();

var properties = [
  // standard properties in d3-geo
  'clipAngle',
  'clipExtent',
  'scale',
  'translate',
  'center',
  'rotate',
  'parallels',
  'precision',

  // extended properties in d3-geo-projections
  'coefficient',
  'distance',
  'fraction',
  'lobes',
  'parallel',
  'radius',
  'ratio',
  'spacing',
  'tilt'
];

/**
 * Augment projections with their type and a copy method.
 */
function create$1(type, constructor) {
  return function projection() {
    var p = constructor();

    p.type = type;

    p.path = d3Geo.geoPath().projection(p);

    p.copy = p.copy || function() {
      var c = projection();
      properties.forEach(function(prop) {
        if (p.hasOwnProperty(prop)) c[prop](p[prop]());
      });
      c.path.pointRadius(p.path.pointRadius());
      return c;
    };

    return p;
  };
}

function projection(type, proj) {
  return arguments.length > 1 ? (projections[type] = create$1(type, proj), this)
    : projections.hasOwnProperty(type) ? projections[type] : null;
}

function getPath(proj) {
  return (proj && proj.path) || defaultPath;
}

var projections = {
  // base d3-geo projection types
  albers:               d3Geo.geoAlbers,
  albersusa:            d3Geo.geoAlbersUsa,
  azimuthalequalarea:   d3Geo.geoAzimuthalEqualArea,
  azimuthalequidistant: d3Geo.geoAzimuthalEquidistant,
  conicconformal:       d3Geo.geoConicConformal,
  conicequalarea:       d3Geo.geoConicEqualArea,
  conicequidistant:     d3Geo.geoConicEquidistant,
  equirectangular:      d3Geo.geoEquirectangular,
  gnomonic:             d3Geo.geoGnomonic,
  mercator:             d3Geo.geoMercator,
  orthographic:         d3Geo.geoOrthographic,
  stereographic:        d3Geo.geoStereographic,
  transversemercator:   d3Geo.geoTransverseMercator
};

for (var key$2 in projections) {
  projection(key$2, projections[key$2]);
}

/**
 * Map GeoJSON data to an SVG path string.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {function(object): *} [params.field] - The field with GeoJSON data,
 *   or null if the tuple itself is a GeoJSON feature.
 * @param {string} [params.as='path'] - The output field in which to store
 *   the generated path data (default 'path').
 */
function GeoPath(params) {
  Transform.call(this, null, params);
}

var prototype$44 = inherits(GeoPath, Transform);

prototype$44.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ALL),
      path = this.value,
      field = _.field || identity,
      as = _.as || 'path',
      mod;

  function set(t) { t[as] = path(field(t)); }

  if (!path || _.modified()) {
    // parameters updated, reset and reflow
    this.value = path = getPath(_.projection);
    out.materialize().reflow().visit(out.SOURCE, set);
  } else {
    mod = field === identity || pulse.modified(field.fields);
    out.visit(mod ? out.ADD_MOD : out.ADD, set);
  }

  return out.modifies(as);
};

/**
 * Geo-code a longitude/latitude point to an x/y coordinate.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {Array<function(object): *>} params.fields - A two-element array of
 *   field accessors for the longitude and latitude values.
 * @param {Array<string>} [params.as] - A two-element array of field names
 *   under which to store the result. Defaults to ['x','y'].
 */
function GeoPoint(params) {
  Transform.call(this, null, params);
}

var prototype$45 = inherits(GeoPoint, Transform);

prototype$45.transform = function(_, pulse) {
  var proj = _.projection,
      lon = _.fields[0],
      lat = _.fields[1],
      as = _.as || ['x', 'y'],
      x = as[0],
      y = as[1],
      mod;

  function set(t) {
    var xy = proj([lon(t), lat(t)]);
    if (xy) t[x] = xy[0], t[y] = xy[1];
    else t[x] = undefined, t[y] = undefined;
  }

  if (_.modified()) {
    // parameters updated, reflow
    pulse.materialize().reflow(true).visit(pulse.SOURCE, set);
  } else {
    mod = pulse.modified(lon.fields) || pulse.modified(lat.fields);
    pulse.visit(mod ? pulse.ADD_MOD : pulse.ADD, set);
  }

  return pulse.modifies(as);
};

/**
 * Annotate items with a geopath shape generator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {function(object): *} [params.field] - The field with GeoJSON data,
 *   or null if the tuple itself is a GeoJSON feature.
 * @param {string} [params.as='shape'] - The output field in which to store
 *   the generated path data (default 'shape').
 */
function GeoShape(params) {
  Transform.call(this, null, params);
}

var prototype$46 = inherits(GeoShape, Transform);

prototype$46.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ALL),
      shape = this.value,
      datum = _.field || field('datum'),
      as = _.as || 'shape',
      flag = out.ADD_MOD;

  if (!shape || _.modified()) {
    // parameters updated, reset and reflow
    this.value = shape = shapeGenerator(getPath(_.projection), datum);
    out.materialize().reflow();
    flag = out.SOURCE;
  }

  out.visit(flag, function(t) { t[as] = shape; });

  return out.modifies(as);
};

function shapeGenerator(path, field) {
  var shape = function(_) { return path(field(_)); };
  shape.context = function(_) { return path.context(_), shape; };
  return shape;
}

/**
 * GeoJSON feature generator for creating graticules.
 * @constructor
 */
function Graticule(params) {
  Transform.call(this, [], params);
  this.generator = d3Geo.geoGraticule();
}

var prototype$47 = inherits(Graticule, Transform);

prototype$47.transform = function(_, pulse) {
  var out = pulse.fork(),
      src = this.value,
      gen = this.generator, t;

  if (!src.length || _.modified()) {
    for (var prop in _) {
      if (isFunction(gen[prop])) {
        gen[prop](_[prop]);
      }
    }
  }

  t = gen();
  if (src.length) {
    t._id = src[0]._id;
    out.mod.push(t);
  } else {
    out.add.push(ingest(t));
  }
  src[0] = t;

  return out.source = src, out;
};

/**
 * Maintains a cartographic projection.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function Projection(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

var prototype$48 = inherits(Projection, Transform);

prototype$48.transform = function(_) {
  var proj = this.value;

  if (!proj || _.modified('type')) {
    this.value = (proj = create$2(_.type));
    properties.forEach(function(prop) {
      if (_[prop] != null) set(proj, prop, _[prop]);
    });
  } else {
    properties.forEach(function(prop) {
      if (_.modified(prop)) set(proj, prop, _[prop]);
    });
  }

  if (_.pointRadius != null) proj.path.pointRadius(_.pointRadius);
  if (_.fit) fit(proj, _);
};

function fit(proj, _) {
  var data = geoJSON(_.fit);
  _.extent ? proj.fitExtent(_.extent, data)
    : _.size ? proj.fitSize(_.size, data) : 0;
}

function geoJSON(data) {
  return !isArray(data) ? data
    : data.length > 1 ? {type: 'FeatureCollection', features: data}
    : data[0];
}

function create$2(type) {
  var constructor = projection((type || 'mercator').toLowerCase());
  if (!constructor) error('Unrecognized projection type: ' + type);
  return constructor();
}

function set(proj, key, value) {
   if (isFunction(proj[key])) proj[key](value);
}

var ContourDefinition = {
  "type": "Contour",
  "metadata": {"generates": true, "source": true},
  "params": [
    { "name": "size", "type": "number", "array": true, "length": 2, "required": true },
    { "name": "values", "type": "number", "array": true },
    { "name": "x", "type": "field" },
    { "name": "y", "type": "field" },
    { "name": "cellSize", "type": "number" },
    { "name": "bandwidth", "type": "number" },
    { "name": "thresholds", "type": "number" }
  ]
}

var GeoPathDefinition = {
  "type": "GeoPath",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection" },
    { "name": "field", "type": "field" },
    { "name": "as", "type": "string", "default": "path" }
  ]
}

var GeoPointDefinition = {
  "type": "GeoPoint",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection", "required": true },
    { "name": "fields", "type": "field", "array": true, "required": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["x", "y"] }
  ]
}

var GeoShapeDefinition = {
  "type": "GeoShape",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection" },
    { "name": "field", "type": "field", "default": "datum" },
    { "name": "as", "type": "string", "default": "shape" }
  ]
}

var GraticuleDefinition = {
  "type": "Graticule",
  "metadata": {"source": true, "generates": true, "changes": true},
  "params": [
    { "name": "extent", "type": "array", "array": true, "length": 2,
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "extentMajor", "type": "array", "array": true, "length": 2,
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "extentMinor", "type": "array", "array": true, "length": 2,
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "step", "type": "number", "array": true, "length": 2 },
    { "name": "stepMajor", "type": "number", "array": true, "length": 2, "default": [90, 360] },
    { "name": "stepMinor", "type": "number", "array": true, "length": 2, "default": [10, 10] },
    { "name": "precision", "type": "number", "default": 2.5 }
  ]
}

register(ContourDefinition, Contour);
register(GeoPathDefinition, GeoPath);
register(GeoPointDefinition, GeoPoint);
register(GeoShapeDefinition, GeoShape);
register(GraticuleDefinition, Graticule);

transform('Projection', Projection);

var Log = 'log';
var Pow = 'pow';
var Sqrt = 'sqrt';
var Band = 'band';
var Point = 'point';
var Linear = 'linear';
var Ordinal = 'ordinal';
var Quantile = 'quantile';
var Quantize = 'quantize';
var Threshold = 'threshold';
var BinLinear = 'bin-linear';
var BinOrdinal = 'bin-ordinal';
var Sequential = 'sequential';

/**
 * Generate tick values for the given scale and approximate tick count or
 * interval value. If the scale has a 'ticks' method, it will be used to
 * generate the ticks, with the count argument passed as a parameter. If the
 * scale lacks a 'ticks' method, the full scale domain will be returned.
 * @param {Scale} scale - The scale for which to generate tick values.
 * @param {*} [count] - The approximate number of desired ticks.
 * @return {Array<*>} - The generated tick values.
 */
function tickValues(scale, count) {
  return scale.ticks ? scale.ticks(count) : scale.domain();
}

/**
 * Generate a label format function for a scale. If the scale has a
 * 'tickFormat' method, it will be used to generate the formatter, with the
 * count and specifier arguments passed as parameters. If the scale lacks a
 * 'tickFormat' method, the returned formatter performs simple string coercion.
 * If the input scale is a logarithmic scale and the format specifier does not
 * indicate a desired decimal precision, a special variable precision formatter
 * that automatically trims trailing zeroes will be generated.
 * @param {Scale} scale - The scale for which to generate the label formatter.
 * @param {*} [count] - The approximate number of desired ticks.
 * @param {string} [specifier] - The format specifier. Must be a legal d3 4.0
 *   specifier string (see https://github.com/d3/d3-format#formatSpecifier).
 * @return {function(*):string} - The generated label formatter.
 */
function tickFormat(scale, count, specifier) {
  var format = scale.tickFormat
    ? scale.tickFormat(count, specifier)
    : String;

  return (scale.type === Log)
    ? filter$1(format, variablePrecision(specifier))
    : format;
}

function filter$1(sourceFormat, targetFormat) {
  return function(_) {
    return sourceFormat(_) ? targetFormat(_) : '';
  };
}

function variablePrecision(specifier) {
  var s = d3Format.formatSpecifier(specifier || ',');

  if (s.precision == null) {
    s.precision = 12;
    switch (s.type) {
      case '%': s.precision -= 2; break;
      case 'e': s.precision -= 1; break;
    }
    return trimZeroes(
      d3Format.format(s),          // number format
      d3Format.format('.1f')(1)[1] // decimal point character
    );
  } else {
    return d3Format.format(s);
  }
}

function trimZeroes(format, decimalChar) {
  return function(x) {
    var str = format(x),
        dec = str.indexOf(decimalChar),
        idx, end;

    if (dec < 0) return str;

    idx = rightmostDigit(str, dec);
    end = idx < str.length ? str.slice(idx) : '';
    while (--idx > dec) if (str[idx] !== '0') { ++idx; break; }

    return str.slice(0, idx) + end;
  };
}

function rightmostDigit(str, dec) {
  var i = str.lastIndexOf('e'), c;
  if (i > 0) return i;
  for (i=str.length; --i > dec;) {
    c = str.charCodeAt(i);
    if (c >= 48 && c <= 57) return i + 1; // is digit
  }
}

/**
 * Generates axis ticks for visualizing a spatial scale.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Scale} params.scale - The scale to generate ticks for.
 * @param {*} [params.count=10] - The approximate number of ticks, or
 *   desired tick interval, to use.
 * @param {Array<*>} [params.values] - The exact tick values to use.
 *   These must be legal domain values for the provided scale.
 *   If provided, the count argument is ignored.
 * @param {function(*):string} [params.formatSpecifier] - A format specifier
 *   to use in conjunction with scale.tickFormat. Legal values are
 *   any valid d3 4.0 format specifier.
 * @param {function(*):string} [params.format] - The format function to use.
 *   If provided, the formatSpecifier argument is ignored.
 */
function AxisTicks(params) {
  Transform.call(this, null, params);
}

var prototype$49 = inherits(AxisTicks, Transform);

prototype$49.transform = function(_, pulse) {
  if (this.value && !_.modified()) {
    return pulse.StopPropagation;
  }

  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      ticks = this.value,
      scale = _.scale,
      count = _.count,
      format = _.format || tickFormat(scale, count, _.formatSpecifier),
      values = _.values || tickValues(scale, count);

  if (ticks) out.rem = ticks;

  ticks = values.map(function(value) {
    return ingest({value: value, label: format(value)})
  });

  if (_.extra) {
    // add an extra tick pegged to the initial domain value
    // this is used to generate axes with 'binned' domains
    ticks.push(ingest({
      extra: {value: ticks[0].value},
      label: ''
    }));
  }

  return (out.source = out.add = this.value = ticks), out;
};

/**
 * Joins a set of data elements against a set of visual items.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): object} [params.item] - An item generator function.
 * @param {function(object): *} [params.key] - The key field associating data and visual items.
 */
function DataJoin(params) {
  Transform.call(this, null, params);
}

var prototype$50 = inherits(DataJoin, Transform);

function defaultItemCreate() {
  return ingest({});
}

function isExit(t) {
  return t.exit;
}

prototype$50.transform = function(_, pulse) {
  var df = pulse.dataflow,
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      item = _.item || defaultItemCreate,
      key = _.key || tupleid,
      map = this.value;

  if (!map) {
    pulse = pulse.addAll();
    this.value = map = fastmap().test(isExit);
    map.lookup = function(t) { return map.get(key(t)); };
  }

  if (_.modified('key') || pulse.modified(key)) {
    error('DataJoin does not support modified key function or fields.');
  }

  pulse.visit(pulse.ADD, function(t) {
    var k = key(t),
        x = map.get(k);

    if (x) {
      (x.exit ? (--map.empty, out.add) : out.mod).push(x);
    } else {
      map.set(k, (x = item(t)));
      out.add.push(x);
    }

    x.datum = t;
    x.exit = false;
  });

  pulse.visit(pulse.MOD, function(t) {
    var k = key(t),
        x = map.get(k);

    if (x) {
      x.datum = t;
      out.mod.push(x);
    }
  });

  pulse.visit(pulse.REM, function(t) {
    var k = key(t),
        x = map.get(k);

    if (t === x.datum && !x.exit) {
      out.rem.push(x);
      x.exit = true;
      ++map.empty;
    }
  });

  if (pulse.changed(pulse.ADD_MOD)) out.modifies('datum');

  if (_.clean && map.empty > df.cleanThreshold) df.runAfter(map.clean);

  return out;
};

/**
 * Invokes encoding functions for visual items.
 * @constructor
 * @param {object} params - The parameters to the encoding functions. This
 *   parameter object will be passed through to all invoked encoding functions.
 * @param {object} param.encoders - The encoding functions
 * @param {function(object, object): boolean} [param.encoders.update] - Update encoding set
 * @param {function(object, object): boolean} [param.encoders.enter] - Enter encoding set
 * @param {function(object, object): boolean} [param.encoders.exit] - Exit encoding set
 */
function Encode(params) {
  Transform.call(this, null, params);
}

var prototype$51 = inherits(Encode, Transform);

prototype$51.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ADD_REM),
      encode = pulse.encode,
      reenter = encode === 'enter',
      update = _.encoders.update || falsy,
      enter = _.encoders.enter || falsy,
      exit = _.encoders.exit || falsy,
      set = (encode && !reenter ? _.encoders[encode] : update) || falsy;

  if (pulse.changed(pulse.ADD)) {
    pulse.visit(pulse.ADD, function(t) {
      enter(t, _);
      update(t, _);
      if (set !== falsy && set !== update) set(t, _);
    });
    out.modifies(enter.output);
    out.modifies(update.output);
    if (set !== falsy && set !== update) out.modifies(set.output);
  }

  if (pulse.changed(pulse.REM) && exit !== falsy) {
    pulse.visit(pulse.REM, function(t) { exit(t, _); });
    out.modifies(exit.output);
  }

  if (reenter || set !== falsy) {
    var flag = pulse.MOD | (_.modified() ? pulse.REFLOW : 0);
    if (reenter) {
      pulse.visit(flag, function(t) {
        var mod = enter(t, _);
        if (set(t, _) || mod) out.mod.push(t);
      });
      if (out.mod.length) out.modifies(enter.output);
    } else {
      pulse.visit(flag, function(t) {
        if (set(t, _)) out.mod.push(t);
      });
    }
    if (out.mod.length) out.modifies(set.output);
  }

  return out;
};

var discrete$1 = {}
discrete$1[Quantile] = quantile$1;
discrete$1[Quantize] = quantize;
discrete$1[Threshold] = threshold;
discrete$1[BinLinear] = bin$2;
discrete$1[BinOrdinal] = bin$2;

function labelValues(scale, count, gradient) {
  if (gradient) return scale.domain();
  var values = discrete$1[scale.type];
  return values ? values(scale) : tickValues(scale, count);
}

function quantize(scale) {
  var domain = scale.domain(),
      x0 = domain[0],
      x1 = peek(domain),
      n = scale.range().length,
      values = new Array(n),
      i = 0;

  values[0] = x0;
  while (++i < n) values[i] = (i * x1 - (i - n) * x0) / n;
  return values.max = x1, values;
}

function quantile$1(scale) {
  var domain = scale.domain(),
      values = [domain[0]].concat(scale.quantiles());
  return values.max = peek(domain), values;
}

function threshold(scale) {
  var values = [-Infinity].concat(scale.domain());
  return values.max = +Infinity, values;
}

function bin$2(scale) {
  var values = scale.domain();
  return values.max = values.pop(), values;
}

function labelFormat(scale, format) {
  return discrete$1[scale.type] ? formatRange(format) : formatPoint(format);
}

function formatRange(format) {
  return function(value, index, array) {
    var limit = array[index + 1] || array.max || +Infinity,
        lo = formatValue(value, format),
        hi = formatValue(limit, format);
    return lo && hi ? lo + '\u2013' + hi : hi ? '< ' + hi : '\u2265 ' + lo;
  };
}

function formatValue(value, format) {
  return isFinite(value) ? format(value) : null;
}

function formatPoint(format) {
  return function(value) {
    return format(value);
  };
}

/**
 * Generates legend entries for visualizing a scale.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Scale} params.scale - The scale to generate items for.
 * @param {*} [params.count=10] - The approximate number of items, or
 *   desired tick interval, to use.
 * @param {Array<*>} [params.values] - The exact tick values to use.
 *   These must be legal domain values for the provided scale.
 *   If provided, the count argument is ignored.
 * @param {function(*):string} [params.formatSpecifier] - A format specifier
 *   to use in conjunction with scale.tickFormat. Legal values are
 *   any valid d3 4.0 format specifier.
 * @param {function(*):string} [params.format] - The format function to use.
 *   If provided, the formatSpecifier argument is ignored.
 */
function LegendEntries(params) {
  Transform.call(this, [], params);
}

var prototype$52 = inherits(LegendEntries, Transform);

prototype$52.transform = function(_, pulse) {
  if (this.value != null && !_.modified()) {
    return pulse.StopPropagation;
  }

  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      total = 0,
      items = this.value,
      grad  = _.type === 'gradient',
      scale = _.scale,
      count = _.count == null ? 5 : _.count,
      format = _.format || tickFormat(scale, count, _.formatSpecifier),
      values = _.values || labelValues(scale, count, grad);

  format = labelFormat(scale, format);
  if (items) out.rem = items;

  if (grad) {
    var domain = _.values ? scale.domain() : values,
        fraction = scaleFraction(scale, domain[0], peek(domain));
  } else {
    var size = _.size,
        offset;
    if (isFunction(size)) {
      // if first value maps to size zero, remove from list (vega#717)
      if (!_.values && scale(values[0]) === 0) {
        values = values.slice(1);
      }
      // compute size offset for legend entries
      offset = values.reduce(function(max, value) {
        return Math.max(max, size(value, _));
      }, 0);
    } else {
      size = constant(offset = size || 8);
    }
  }

  items = values.map(function(value, index) {
    var t = ingest({
      index: index,
      label: format(value, index, values),
      value: value
    });

    if (grad) {
      t.perc = fraction(value);
    } else {
      t.offset = offset;
      t.size = size(value, _);
      t.total = Math.round(total);
      total += t.size;
    }
    return t;
  });

  return (out.source = out.add = this.value = items), out;
};

var Paths = fastmap({
  'line': line$3,
  'line-radial': lineR,
  'arc': arc$3,
  'arc-radial': arcR,
  'curve': curve,
  'curve-radial': curveR,
  'orthogonal-horizontal': orthoX,
  'orthogonal-vertical': orthoY,
  'orthogonal-radial': orthoR,
  'diagonal-horizontal': diagonalX,
  'diagonal-vertical': diagonalY,
  'diagonal-radial': diagonalR
});

function sourceX(t) { return t.source.x; }
function sourceY(t) { return t.source.y; }
function targetX(t) { return t.target.x; }
function targetY(t) { return t.target.y; }

 /**
  * Layout paths linking source and target elements.
  * @constructor
  * @param {object} params - The parameters for this operator.
  */
function LinkPath(params) {
  Transform.call(this, {}, params);
}

var prototype$53 = inherits(LinkPath, Transform);

prototype$53.transform = function(_, pulse) {
  var sx = _.sourceX || sourceX,
      sy = _.sourceY || sourceY,
      tx = _.targetX || targetX,
      ty = _.targetY || targetY,
      as = _.as || 'path',
      orient = _.orient || 'vertical',
      shape = _.shape || 'line',
      path = Paths.get(shape + '-' + orient) || Paths.get(shape);

  if (!path) {
    error('LinkPath unsupported type: ' + _.shape
      + (_.orient ? '-' + _.orient : ''));
  }

  pulse.visit(pulse.SOURCE, function(t) {
    t[as] = path(sx(t), sy(t), tx(t), ty(t));
  });

  return pulse.reflow(_.modified()).modifies(as);
};

// -- Link Path Generation Methods -----

function line$3(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'L' + tx + ',' + ty;
}

function lineR(sa, sr, ta, tr) {
  return line$3(
    sr * Math.cos(sa), sr * Math.sin(sa),
    tr * Math.cos(ta), tr * Math.sin(ta)
  );
}

function arc$3(sx, sy, tx, ty) {
  var dx = tx - sx,
      dy = ty - sy,
      rr = Math.sqrt(dx * dx + dy * dy) / 2,
      ra = 180 * Math.atan2(dy, dx) / Math.PI;
  return 'M' + sx + ',' + sy +
         'A' + rr + ',' + rr +
         ' ' + ra + ' 0 1' +
         ' ' + tx + ',' + ty;
}

function arcR(sa, sr, ta, tr) {
  return arc$3(
    sr * Math.cos(sa), sr * Math.sin(sa),
    tr * Math.cos(ta), tr * Math.sin(ta)
  );
}

function curve(sx, sy, tx, ty) {
  var dx = tx - sx,
      dy = ty - sy,
      ix = 0.2 * (dx + dy),
      iy = 0.2 * (dy - dx);
  return 'M' + sx + ',' + sy +
         'C' + (sx+ix) + ',' + (sy+iy) +
         ' ' + (tx+iy) + ',' + (ty-ix) +
         ' ' + tx + ',' + ty;
}

function curveR(sa, sr, ta, tr) {
  return curve(
    sr * Math.cos(sa), sr * Math.sin(sa),
    tr * Math.cos(ta), tr * Math.sin(ta)
  );
}

function orthoX(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'V' + ty + 'H' + tx;
}

function orthoY(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'H' + tx + 'V' + ty;
}

function orthoR(sa, sr, ta, tr) {
  var sc = Math.cos(sa),
      ss = Math.sin(sa),
      tc = Math.cos(ta),
      ts = Math.sin(ta),
      sf = Math.abs(ta - sa) > Math.PI ? ta <= sa : ta > sa;
  return 'M' + (sr*sc) + ',' + (sr*ss) +
         'A' + sr + ',' + sr + ' 0 0,' + (sf?1:0) +
         ' ' + (sr*tc) + ',' + (sr*ts) +
         'L' + (tr*tc) + ',' + (tr*ts);
}

function diagonalX(sx, sy, tx, ty) {
  var m = (sx + tx) / 2;
  return 'M' + sx + ',' + sy +
         'C' + m  + ',' + sy +
         ' ' + m  + ',' + ty +
         ' ' + tx + ',' + ty;
}

function diagonalY(sx, sy, tx, ty) {
  var m = (sy + ty) / 2;
  return 'M' + sx + ',' + sy +
         'C' + sx + ',' + m +
         ' ' + tx + ',' + m +
         ' ' + tx + ',' + ty;
}

function diagonalR(sa, sr, ta, tr) {
  var sc = Math.cos(sa),
      ss = Math.sin(sa),
      tc = Math.cos(ta),
      ts = Math.sin(ta),
      mr = (sr + tr) / 2;
  return 'M' + (sr*sc) + ',' + (sr*ss) +
         'C' + (mr*sc) + ',' + (mr*ss) +
         ' ' + (mr*tc) + ',' + (mr*ts) +
         ' ' + (tr*tc) + ',' + (tr*ts);
}

/**
 * Pie and donut chart layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size pie segments.
 * @param {number} [params.startAngle=0] - The start angle (in radians) of the layout.
 * @param {number} [params.endAngle=2π] - The end angle (in radians) of the layout.
 * @param {boolean} [params.sort] - Boolean flag for sorting sectors by value.
 */
function Pie(params) {
  Transform.call(this, null, params);
}

var prototype$54 = inherits(Pie, Transform);

prototype$54.transform = function(_, pulse) {
  var as = _.as || ['startAngle', 'endAngle'],
      startAngle = as[0],
      endAngle = as[1],
      field = _.field || one,
      start = _.startAngle || 0,
      stop = _.endAngle != null ? _.endAngle : 2 * Math.PI,
      data = pulse.source,
      values = data.map(field),
      n = values.length,
      a = start,
      k = (stop - start) / d3Array.sum(values),
      index = d3Array.range(n),
      i, t, v;

  if (_.sort) {
    index.sort(function(a, b) {
      return values[a] - values[b];
    });
  }

  for (i=0; i<n; ++i) {
    v = values[index[i]];
    t = data[index[i]];
    t[startAngle] = a;
    t[endAngle] = (a += v * k);
  }

  this.value = values;
  return pulse.reflow(_.modified()).modifies(as);
};

var DEFAULT_COUNT = 5;

var INCLUDE_ZERO = toSet([Linear, Pow, Sqrt]);

var SKIP$2 = toSet([
  'set', 'modified', 'clear', 'type', 'scheme', 'schemeExtent', 'schemeCount',
  'domain', 'domainMin', 'domainMid', 'domainMax', 'domainRaw', 'nice', 'zero',
  'range', 'rangeStep', 'round', 'reverse', 'interpolate', 'interpolateGamma'
]);

/**
 * Maintains a scale function mapping data values to visual channels.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function Scale(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

var prototype$55 = inherits(Scale, Transform);

prototype$55.transform = function(_, pulse) {
  var df = pulse.dataflow,
      scale = this.value,
      prop;

  if (!scale || _.modified('type')) {
    this.value = scale = scale$1((_.type || Linear).toLowerCase())();
  }

  for (prop in _) if (!SKIP$2[prop]) {
    isFunction(scale[prop])
      ? scale[prop](_[prop])
      : df.warn('Unsupported scale property: ' + prop);
  }

  configureRange(scale, _, configureDomain(scale, _), df);

  return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
};

function configureDomain(scale, _, df) {
  // check raw domain, if provided use that and exit early
  var raw = rawDomain(scale, _.domainRaw);
  if (raw > -1) return raw;

  var domain = _.domain,
      zero = _.zero || (_.zero === undefined && INCLUDE_ZERO[scale.type]),
      n, mid;

  if (!domain) return 0;

  // adjust domain based on zero, min, max settings
  if (zero || _.domainMin != null || _.domainMax != null || _.domainMid != null) {
    n = ((domain = domain.slice()).length - 1) || 1;
    if (zero) {
      if (domain[0] > 0) domain[0] = 0;
      if (domain[n] < 0) domain[n] = 0;
    }
    if (_.domainMin != null) domain[0] = _.domainMin;
    if (_.domainMax != null) domain[n] = _.domainMax;

    if (_.domainMid != null) {
      mid = _.domainMid;
      if (mid < domain[0] || mid > domain[n]) {
        df.warn('Scale domainMid exceeds domain min or max.', mid);
      }
      domain.splice(n, 0, mid);
    }
  }

  // set the scale domain
  scale.domain(domain);

  // perform 'nice' adjustment as requested
  if (_.nice && scale.nice) scale.nice((_.nice !== true && +_.nice) || null);

  // return the cardinality of the domain
  return domain.length;
}

function rawDomain(scale, raw) {
  return raw ? (scale.domain(raw), raw.length) : -1;
}

function configureRange(scale, _, count) {
  var round = _.round || false,
      range = _.range;

  // if range step specified, calculate full range extent
  if (_.rangeStep != null) {
    range = configureRangeStep(scale.type, _, count);
  }

  // else if a range scheme is defined, use that
  else if (_.scheme) {
    range = configureScheme(scale.type, _, count);
    if (isFunction(range)) return scale.interpolator(range);
  }

  // given a range array for a sequential scale, convert to interpolator
  else if (range && scale.type === Sequential) {
    return scale.interpolator($$1.interpolateRgbBasis(flip(range, _.reverse)));
  }

  // configure rounding / interpolation
  if (range && _.interpolate && scale.interpolate) {
    scale.interpolate(getInterpolate(_.interpolate, _.interpolateGamma));
  } else if (isFunction(scale.round)) {
    scale.round(round);
  } else if (isFunction(scale.rangeRound)) {
    scale.interpolate(round ? $$1.interpolateRound : $$1.interpolate);
  }

  if (range) scale.range(flip(range, _.reverse));
}

function configureRangeStep(type, _, count) {
  if (type !== Band && type !== Point) {
    error('Only band and point scales support rangeStep.');
  }

  // calculate full range based on requested step size and padding
  var outer = (_.paddingOuter != null ? _.paddingOuter : _.padding) || 0,
      inner = type === Point ? 1
            : ((_.paddingInner != null ? _.paddingInner : _.padding) || 0);
  return [0, _.rangeStep * bandSpace(count, inner, outer)];
}

function configureScheme(type, _, count) {
  var name = _.scheme.toLowerCase(),
      scheme = getScheme(name),
      extent = _.schemeExtent,
      discrete;

  if (!scheme) {
    error('Unrecognized scheme name: ' + _.scheme);
  }

  // determine size for potential discrete range
  count = (type === Threshold) ? count + 1
    : (type === BinOrdinal) ? count - 1
    : (type === Quantile || type === Quantize) ? (+_.schemeCount || DEFAULT_COUNT)
    : count;

  // adjust and/or quantize scheme as appropriate
  return type === Sequential ? adjustScheme(scheme, extent, _.reverse)
    : !extent && (discrete = getScheme(name + '-' + count)) ? discrete
    : isFunction(scheme) ? quantize$1(adjustScheme(scheme, extent), count)
    : type === Ordinal ? scheme : scheme.slice(0, count);
}

function adjustScheme(scheme, extent, reverse) {
  return (isFunction(scheme) && (extent || reverse))
    ? interpolateRange(scheme, flip(extent || [0, 1], reverse))
    : scheme;
}

function flip(array, reverse) {
  return reverse ? array.slice().reverse() : array;
}

function quantize$1(interpolator, count) {
  var samples = new Array(count),
      n = (count - 1) || 1;
  for (var i = 0; i < count; ++i) samples[i] = interpolator(i / n);
  return samples;
}

/**
 * Sorts scenegraph items in the pulse source array.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(*,*): number} [params.sort] - A comparator
 *   function for sorting tuples.
 */
function SortItems(params) {
  Transform.call(this, null, params);
}

var prototype$56 = inherits(SortItems, Transform);

prototype$56.transform = function(_, pulse) {
  var mod = _.modified('sort')
         || pulse.changed(pulse.ADD)
         || pulse.modified(_.sort.fields)
         || pulse.modified('datum');

  if (mod) pulse.source.sort(_.sort);

  this.modified(mod);
  return pulse;
};

var Center = 'center';
var Normalize = 'normalize';
/**
 * Stack layout for visualization elements.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to stack.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
 * @param {function(object,object): number} [params.sort] - A comparator for stack sorting.
 * @param {string} [offset='zero'] - One of 'zero', 'center', 'normalize'.
 */
function Stack(params) {
  Transform.call(this, null, params);
}

var prototype$57 = inherits(Stack, Transform);

prototype$57.transform = function(_, pulse) {
  var as = _.as || ['y0', 'y1'],
      y0 = as[0],
      y1 = as[1],
      field = _.field || one,
      stack = _.offset === Center ? stackCenter
            : _.offset === Normalize ? stackNormalize
            : stackZero,
      groups, i, n, max;

  // partition, sum, and sort the stack groups
  groups = partition$2(pulse.source, _.groupby, _.sort, field);

  // compute stack layouts per group
  for (i=0, n=groups.length, max=groups.max; i<n; ++i) {
    stack(groups[i], max, field, y0, y1);
  }

  return pulse.reflow(_.modified()).modifies(as);
};

function stackCenter(group, max, field, y0, y1) {
  var last = (max - group.sum) / 2,
      m = group.length,
      j = 0, t;

  for (; j<m; ++j) {
    t = group[j];
    t[y0] = last;
    t[y1] = (last += Math.abs(field(t)));
  }
}

function stackNormalize(group, max, field, y0, y1) {
  var scale = 1 / group.sum,
      last = 0,
      m = group.length,
      j = 0, v = 0, t;

  for (; j<m; ++j) {
    t = group[j];
    t[y0] = last;
    t[y1] = last = scale * (v += Math.abs(field(t)));
  }
}

function stackZero(group, max, field, y0, y1) {
  var lastPos = 0,
      lastNeg = 0,
      m = group.length,
      j = 0, v, t;

  for (; j<m; ++j) {
    t = group[j];
    v = field(t);
    if (v < 0) {
      t[y0] = lastNeg;
      t[y1] = (lastNeg += v);
    } else {
      t[y0] = lastPos;
      t[y1] = (lastPos += v);
    }
  }
}

function partition$2(data, groupby, sort, field) {
  var groups = [],
      get = function(f) { return f(t); },
      map, i, n, m, t, k, g, s, max;

  // partition data points into stack groups
  if (groupby == null) {
    groups.push(data.slice());
  } else {
    for (map={}, i=0, n=data.length; i<n; ++i) {
      t = data[i];
      k = groupby.map(get);
      g = map[k] || (groups.push(map[k] = []), map[k]);
      g.push(t);
    }
  }

  // compute sums of groups, sort groups as needed
  for (k=0, max=0, m=groups.length; k<m; ++k) {
    g = groups[k];
    for (i=0, s=0, n=g.length; i<n; ++i) {
      s += Math.abs(field(g[i]));
    }
    g.sum = s;
    if (s > max) max = s;
    if (sort) g.sort(sort);
  }
  groups.max = max;

  return groups;
}

var LinkPathDefinition = {
  "type": "LinkPath",
  "metadata": {"modifies": true},
  "params": [
    { "name": "sourceX", "type": "field", "default": "source.x" },
    { "name": "sourceY", "type": "field", "default": "source.y" },
    { "name": "targetX", "type": "field", "default": "target.x" },
    { "name": "targetY", "type": "field", "default": "target.y" },
    { "name": "orient", "type": "enum", "default": "vertical",
      "values": ["horizontal", "vertical", "radial"] },
    { "name": "shape", "type": "enum", "default": "line",
      "values": ["line", "arc", "curve", "diagonal", "orthogonal"] },
    { "name": "as", "type": "string", "default": "path" }
  ]
};

var PieDefinition = {
  "type": "Pie",
  "metadata": {"modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "startAngle", "type": "number", "default": 0 },
    { "name": "endAngle", "type": "number", "default": 6.283185307179586 },
    { "name": "sort", "type": "boolean", "default": false },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["startAngle", "endAngle"] }
  ]
};

var StackDefinition = {
  "type": "Stack",
  "metadata": {"modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "groupby", "type": "field", "array": true },
    { "name": "sort", "type": "compare" },
    { "name": "offset", "type": "enum", "default": "zero", "values": ["zero", "center", "normalize"] },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["y0", "y1"] }
  ]
};

register(LinkPathDefinition, LinkPath);
register(PieDefinition, Pie);
register(StackDefinition, Stack);

transform('AxisTicks', AxisTicks);
transform('DataJoin', DataJoin);
transform('Encode', Encode);
transform('LegendEntries', LegendEntries);
transform('Scale', Scale);
transform('SortItems', SortItems);

var ForceMap = {
  center: d3Force.forceCenter,
  collide: d3Force.forceCollide,
  nbody: d3Force.forceManyBody,
  link: d3Force.forceLink,
  x: d3Force.forceX,
  y: d3Force.forceY
};

var Forces = 'forces';
var ForceParams = [
      'alpha', 'alphaMin', 'alphaTarget',
      'velocityDecay', 'forces'
    ];
var ForceConfig = ['static', 'iterations'];
var ForceOutput = ['x', 'y', 'vx', 'vy'];
/**
 * Force simulation layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<object>} params.forces - The forces to apply.
 */
function Force(params) {
  Transform.call(this, null, params);
}

var prototype$58 = inherits(Force, Transform);

prototype$58.transform = function(_, pulse) {
  var sim = this.value,
      change = pulse.changed(pulse.ADD_REM),
      params = _.modified(ForceParams),
      iters = _.iterations || 300;

  // configure simulation
  if (!sim) {
    this.value = sim = simulation(pulse.source, _);
    sim.on('tick', rerun(pulse.dataflow, this));
    if (!_.static) change = true, sim.tick(); // ensure we run on init
    pulse.modifies('index');
  } else {
    if (change) pulse.modifies('index'), sim.nodes(pulse.source);
    if (params) setup(sim, _);
  }

  // run simulation
  if (params || change || _.modified(ForceConfig)
      || (pulse.changed() && _.restart))
  {
    sim.alpha(Math.max(sim.alpha(), _.alpha || 1))
       .alphaDecay(1 - Math.pow(sim.alphaMin(), 1 / iters));

    if (_.static) {
      for (sim.stop(); --iters >= 0;) sim.tick();
    } else {
      if (sim.stopped()) sim.restart();
      if (!change) return pulse.StopPropagation; // defer to sim ticks
    }
  }

  return this.finish(_, pulse);
};

prototype$58.finish = function(_, pulse) {
  var dataflow = pulse.dataflow;

  // inspect dependencies, touch link source data
  for (var args=this._argops, j=0, m=args.length, arg; j<m; ++j) {
    arg = args[j];
    if (arg.name !== Forces || arg.op._argval.force !== 'link') {
      continue;
    }
    for (var ops=arg.op._argops, i=0, n=ops.length, op; i<n; ++i) {
      if (ops[i].name === 'links' && (op = ops[i].op.source)) {
        dataflow.touch(op); break;
      }
    }
  }

  // reflow all nodes
  return pulse.reflow(_.modified()).modifies(ForceOutput);
};

function rerun(df, op) {
  return function() { df.touch(op).run(); }
}

function simulation(nodes, _) {
  var sim = d3Force.forceSimulation(nodes),
      stopped = false,
      stop = sim.stop,
      restart = sim.restart;

  sim.stopped = function() { return stopped; };
  sim.restart = function() { return stopped = false, restart(); };
  sim.stop = function() { return stopped = true, stop(); };

  return setup(sim, _, true).on('end', function() { stopped = true; });
}

function setup(sim, _, init) {
  var f = array(_.forces), i, n, p;

  for (i=0, n=ForceParams.length; i<n; ++i) {
    p = ForceParams[i];
    if (p !== Forces && _.modified(p)) sim[p](_[p]);
  }

  for (i=0, n=f.length; i<n; ++i) {
    if (init || _.modified(Forces, i)) {
      sim.force(Forces + i, getForce(f[i]));
    }
  }
  for (n=(sim.numForces || 0); i<n; ++i) {
    sim.force(Forces + i, null); // remove
  }

  return sim.numForces = f.length, sim;
}

function getForce(_) {
  var f, p;
  if (!ForceMap.hasOwnProperty(_.force)) {
    error('Unrecognized force: ' + _.force);
  }
  f = ForceMap[_.force]();
  for (p in _) if (isFunction(f[p])) f[p](_[p]);
  return f;
}

var ForceDefinition = {
  "type": "Force",
  "metadata": {"modifies": true},
  "params": [
    { "name": "static", "type": "boolean", "default": false },
    { "name": "restart", "type": "boolean", "default": false },
    { "name": "iterations", "type": "number", "default": 300 },
    { "name": "alpha", "type": "number", "default": 1 },
    { "name": "alphaMin", "type": "number", "default": 0.001 },
    { "name": "alphaTarget", "type": "number", "default": 0 },
    { "name": "velocityDecay", "type": "number", "default": 0.4 },
    { "name": "forces", "type": "param", "array": true,
      "params": [
        {
          "key": {"force": "center"},
          "params": [
            { "name": "x", "type": "number", "default": 0 },
            { "name": "y", "type": "number", "default": 0 }
          ]
        },
        {
          "key": {"force": "collide"},
          "params": [
            { "name": "radius", "type": "number", "expr": true },
            { "name": "strength", "type": "number", "default": 0.7 },
            { "name": "iterations", "type": "number", "default": 1 }
          ]
        },
        {
          "key": {"force": "nbody"},
          "params": [
            { "name": "strength", "type": "number", "default": -30 },
            { "name": "theta", "type": "number", "default": 0.9 },
            { "name": "distanceMin", "type": "number", "default": 1 },
            { "name": "distanceMax", "type": "number" }
          ]
        },
        {
          "key": {"force": "link"},
          "params": [
            { "name": "links", "type": "data" },
            { "name": "id", "type": "field" },
            { "name": "distance", "type": "number", "default": 30, "expr": true },
            { "name": "strength", "type": "number", "expr": true },
            { "name": "iterations", "type": "number", "default": 1 }
          ]
        },
        {
          "key": {"force": "x"},
          "params": [
            { "name": "strength", "type": "number", "default": 0.1 },
            { "name": "x", "type": "field" }
          ]
        },
        {
          "key": {"force": "y"},
          "params": [
            { "name": "strength", "type": "number", "default": 0.1 },
            { "name": "y", "type": "field" }
          ]
        }
      ] },
    {
      "name": "as", "type": "string", "array": true, "modify": false,
      "default": ["x", "y", "vx", "vy"]
    }
  ]
};

register(ForceDefinition, Force);

/**
  * Nest tuples into a tree structure, grouped by key values.
  * @constructor
  * @param {object} params - The parameters for this operator.
  * @param {Array<function(object): *>} params.keys - The key fields to nest by, in order.
  * @param {function(object): *} [params.key] - Unique key field for each tuple.
  *   If not provided, the tuple id field is used.
  */
function Nest(params) {
  Transform.call(this, null, params);
}

var prototype$59 = inherits(Nest, Transform);

function children(n) {
  return n.values;
}

prototype$59.transform = function(_, pulse) {
  if (!pulse.source) {
    error('Nest transform requires an upstream data source.');
  }

  var key = _.key || tupleid,
      root, tree, map, mod;

  if (!this.value || (mod = _.modified()) || pulse.changed()) {
    root = array(_.keys)
      .reduce(function(n, k) { return (n.key(k), n)}, d3Collection.nest())
      .entries(pulse.source);
    tree = d3Hierarchy.hierarchy({values: root}, children);
    map = tree.lookup = {};
    tree.each(function(node) {
      if (tupleid(node.data) != null) map[key(node.data)] = node;
    });
    this.value = tree;
  }

  pulse.source.root = this.value;
  return mod ? pulse.fork(pulse.ALL) : pulse;
};

/**
  * Stratify a collection of tuples into a tree structure based on
  * id and parent id fields.
  * @constructor
  * @param {object} params - The parameters for this operator.
  * @param {function(object): *} params.key - Unique key field for each tuple.
  * @param {function(object): *} params.parentKey - Field with key for parent tuple.
  */
function Stratify(params) {
  Transform.call(this, null, params);
}

var prototype$60 = inherits(Stratify, Transform);

prototype$60.transform = function(_, pulse) {
  if (!pulse.source) {
    error('Stratify transform requires an upstream data source.');
  }

  var mod = _.modified(), tree, map,
      run = !this.value
         || mod
         || pulse.changed(pulse.ADD_REM)
         || pulse.modified(_.key.fields)
         || pulse.modified(_.parentKey.fields);

  if (run) {
    tree = d3Hierarchy.stratify().id(_.key).parentId(_.parentKey)(pulse.source);
    map = tree.lookup = {};
    tree.each(function(node) { map[_.key(node.data)] = node; });
    this.value = tree;
  }

  pulse.source.root = this.value;
  return mod ? pulse.fork(pulse.ALL) : pulse;
};

/**
  * Generate tuples representing links between tree nodes.
  * The resulting tuples will contain 'source' and 'target' fields,
  * which point to parent and child node tuples, respectively.
  * @constructor
  * @param {object} params - The parameters for this operator.
  * @param {function(object): *} [params.key] - Unique key field for each tuple.
  *   If not provided, the tuple id field is used.
  */
function TreeLinks(params) {
  Transform.call(this, {}, params);
}

var prototype$61 = inherits(TreeLinks, Transform);

function parentTuple(node) {
  var p;
  return node.parent
      && (p=node.parent.data)
      && (tupleid(p) != null) && p;
}

prototype$61.transform = function(_, pulse) {
  if (!pulse.source || !pulse.source.root) {
    error('TreeLinks transform requires a backing tree data source.');
  }

  var root = pulse.source.root,
      nodes = root.lookup,
      links = this.value,
      key = _.key || tupleid,
      mods = {},
      out = pulse.fork();

  function modify(id) {
    var link = links[id];
    if (link) mods[id] = 1, out.mod.push(link);
  }

  // process removed tuples
  // assumes that if a parent node is removed the child will be, too.
  pulse.visit(pulse.REM, function(t) {
    var id = key(t),
        link = links[id];
    if (link) delete links[id], out.rem.push(link);
  });

  // create new link instances for added nodes with valid parents
  pulse.visit(pulse.ADD, function(t) {
    var id = key(t), p;
    if (p = parentTuple(nodes[id])) {
      out.add.push(links[id] = ingest({source: p, target: t}));
      mods[id] = 1;
    }
  });

  // process modified nodes and their children
  pulse.visit(pulse.MOD, function(t) {
    var id = key(t),
        node = nodes[id],
        kids = node.children;

    modify(id);
    if (kids) for (var i=0, n=kids.length; i<n; ++i) {
      if (!mods[(id=key(kids[i].data))]) modify(id);
    }
  });

  return out;
};

var Tiles = {
  binary: d3Hierarchy.treemapBinary,
  dice: d3Hierarchy.treemapDice,
  slice: d3Hierarchy.treemapSlice,
  slicedice: d3Hierarchy.treemapSliceDice,
  squarify: d3Hierarchy.treemapSquarify,
  resquarify: d3Hierarchy.treemapResquarify
};

var Layouts = {
  tidy: d3Hierarchy.tree,
  cluster: d3Hierarchy.cluster
};

/**
 * Tree layout generator. Supports both 'tidy' and 'cluster' layouts.
 */
function treeLayout(method) {
  var m = method || 'tidy';
  if (Layouts.hasOwnProperty(m)) return Layouts[m]();
  else error('Unrecognized Tree layout method: ' + m);
}

/**
 * Treemap layout generator. Adds 'method' and 'ratio' parameters
 * to configure the underlying tile method.
 */
function treemapLayout() {
  var x = d3Hierarchy.treemap();
  x.ratio = function(_) {
    var t = x.tile();
    if (t.ratio) x.tile(t.ratio(_));
  };
  x.method = function(_) {
    if (Tiles.hasOwnProperty(_)) x.tile(Tiles[_]);
    else error('Unrecognized Treemap layout method: ' + _);
  };
  return x;
}

 /**
  * Abstract class for tree layout.
  * @constructor
  * @param {object} params - The parameters for this operator.
  */
function HierarchyLayout(params) {
  Transform.call(this, null, params);
}

var prototype$62 = inherits(HierarchyLayout, Transform);

prototype$62.transform = function(_, pulse) {
  if (!pulse.source || !pulse.source.root) {
    error(this.constructor.name
      + ' transform requires a backing tree data source.');
  }

  var layout = this.layout(_.method),
      fields = this.fields,
      root = pulse.source.root,
      as = _.as || fields;

  if (_.field) root.sum(_.field);
  if (_.sort) root.sort(_.sort);

  setParams(layout, this.params, _);
  try {
    this.value = layout(root);
  } catch (err) {
    error(err);
  }
  root.each(function(node) { setFields(node, fields, as); });

  return pulse.reflow(_.modified()).modifies(as).modifies('leaf');
};

function setParams(layout, params, _) {
  for (var p, i=0, n=params.length; i<n; ++i) {
    p = params[i];
    if (p in _) layout[p](_[p]);
  }
}

function setFields(node, fields, as) {
  var t = node.data;
  for (var i=0, n=fields.length-1; i<n; ++i) {
    t[as[i]] = node[fields[i]];
  }
  t[as[n]] = node.children ? node.children.length : 0;
}

/**
 * Tree layout. Depending on the method parameter, performs either
 * Reingold-Tilford 'tidy' layout or dendrogram 'cluster' layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function Tree(params) {
  HierarchyLayout.call(this, params);
}
inherits(Tree, HierarchyLayout);
Tree.prototype.layout = treeLayout;
Tree.prototype.params = ['size', 'nodeSize', 'separation'];
Tree.prototype.fields = ['x', 'y', 'depth', 'children'];

/**
 * Treemap layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size nodes.
 */
function Treemap(params) {
  HierarchyLayout.call(this, params);
}
inherits(Treemap, HierarchyLayout);
Treemap.prototype.layout = treemapLayout;
Treemap.prototype.params = [
  'method', 'ratio', 'size', 'round',
  'padding', 'paddingInner', 'paddingOuter',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'
];
Treemap.prototype.fields = ['x0', 'y0', 'x1', 'y1', 'depth', 'children'];

/**
 * Partition tree layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size nodes.
 */
function Partition(params) {
  HierarchyLayout.call(this, params);
}
inherits(Partition, HierarchyLayout);
Partition.prototype.layout = d3Hierarchy.partition;
Partition.prototype.params = ['size', 'round', 'padding'];
Partition.prototype.fields = Treemap.prototype.fields;

/**
 * Packed circle tree layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size nodes.
 */
function Pack(params) {
  HierarchyLayout.call(this, params);
}
inherits(Pack, HierarchyLayout);
Pack.prototype.layout = d3Hierarchy.pack;
Pack.prototype.params = ['size', 'padding'];
Pack.prototype.fields = ['x', 'y', 'r', 'depth', 'children'];

var NestDefinition = {
  "type": "Nest",
  "metadata": {"treesource": true},
  "params": [
    { "name": "keys", "type": "field", "array": true },
    { "name": "key", "type": "field" }
  ]
};

var StratifyDefinition = {
  "type": "Stratify",
  "metadata": {"treesource": true},
  "params": [
    { "name": "key", "type": "field", "required": true },
    { "name": "parentKey", "type": "field", "required": true  }
  ]
};

var TreeLinksDefinition = {
  "type": "TreeLinks",
  "metadata": {"tree": true, "generates": true, "changes": true},
  "params": [
    { "name": "key", "type": "field" }
  ]
}

var PackDefinition = {
  "type": "Pack",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "padding", "type": "number", "default": 0 },
    { "name": "radius", "type": "field", "default": null },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 3, "default": ["x", "y", "r", "depth", "children"] }
  ]
};

var PartitionDefinition = {
  "type": "Partition",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "padding", "type": "number", "default": 0 },
    { "name": "round", "type": "boolean", "default": false },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 4, "default": ["x0", "y0", "x1", "y1", "depth", "children"] }
  ]
};

var TreeDefinition = {
  "type": "Tree",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "method", "type": "enum", "default": "tidy", "values": ["tidy", "cluster"] },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "nodeSize", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 4, "default": ["x", "y", "depth", "children"] }
  ]
};

var TreemapDefinition = {
  "type": "Treemap",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "method", "type": "enum", "default": "squarify",
      "values": ["squarify", "resquarify", "binary", "dice", "slice", "slicedice"] },
    { "name": "padding", "type": "number", "default": 0 },
    { "name": "paddingInner", "type": "number", "default": 0 },
    { "name": "paddingOuter", "type": "number", "default": 0 },
    { "name": "paddingTop", "type": "number", "default": 0 },
    { "name": "paddingRight", "type": "number", "default": 0 },
    { "name": "paddingBottom", "type": "number", "default": 0 },
    { "name": "paddingLeft", "type": "number", "default": 0 },
    { "name": "ratio", "type": "number", "default": 1.618033988749895 },
    { "name": "round", "type": "boolean", "default": false },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 4, "default": ["x0", "y0", "x1", "y1", "depth", "children"] }
  ]
};

register(NestDefinition, Nest);
register(StratifyDefinition, Stratify);
register(TreeLinksDefinition, TreeLinks);
register(PackDefinition, Pack);
register(PartitionDefinition, Partition);
register(TreeDefinition, Tree);
register(TreemapDefinition, Treemap);

function Voronoi(params) {
  Transform.call(this, null, params);
}

var prototype$63 = inherits(Voronoi, Transform);

var defaultExtent = [[-1e5, -1e5], [1e5, 1e5]];

prototype$63.transform = function(_, pulse) {
  var as = _.as || 'path',
      data = pulse.source,
      diagram, polygons, i, n;

  // configure and construct voronoi diagram
  diagram = d3Voronoi.voronoi().x(_.x).y(_.y);
  if (_.size) diagram.size(_.size);
  else diagram.extent(_.extent || defaultExtent);

  this.value = (diagram = diagram(data));

  // map polygons to paths
  polygons = diagram.polygons();
  for (i=0, n=data.length; i<n; ++i) {
    data[i][as] = polygons[i]
      ? 'M' + polygons[i].join('L') + 'Z'
      : null;
  }

  return pulse.reflow(_.modified()).modifies(as);
};

var VoronoiDefinition = {
  "type": "Voronoi",
  "metadata": {"modifies": true},
  "params": [
    { "name": "x", "type": "field", "required": true },
    { "name": "y", "type": "field", "required": true },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "extent", "type": "array", "array": true, "length": 2,
      "default": [[-1e5, -1e5], [1e5, 1e5]],
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "as", "type": "string", "default": "path" }
  ]
};

register(VoronoiDefinition, Voronoi);

var cloudRadians = Math.PI / 180;
var cw = 1 << 11 >> 5;
var ch = 1 << 11;
function cloud() {
  var size = [256, 256],
      text,
      font,
      fontSize,
      fontStyle,
      fontWeight,
      rotate,
      padding,
      spiral = archimedeanSpiral,
      words = [],
      random = Math.random,
      cloud = {},
      canvas = cloudCanvas;

  cloud.layout = function() {
    var contextAndRatio = getContext(canvas()),
        board = zeroArray((size[0] >> 5) * size[1]),
        bounds = null,
        n = words.length,
        i = -1,
        tags = [],
        data = words.map(function(d) {
          return {
            text: text(d),
            font: font(d),
            style: fontStyle(d),
            weight: fontWeight(d),
            rotate: rotate(d),
            size: ~~fontSize(d),
            padding: padding(d),
            xoff: 0,
            yoff: 0,
            x1: 0,
            y1: 0,
            x0: 0,
            y0: 0,
            hasText: false,
            sprite: null,
            datum: d
          };
        }).sort(function(a, b) { return b.size - a.size; });

    while (++i < n) {
      var d = data[i];
      d.x = (size[0] * (random() + .5)) >> 1;
      d.y = (size[1] * (random() + .5)) >> 1;
      cloudSprite(contextAndRatio, d, data, i);
      if (d.hasText && place(board, d, bounds)) {
        tags.push(d);
        if (bounds) cloudBounds(bounds, d);
        else bounds = [{x: d.x + d.x0, y: d.y + d.y0}, {x: d.x + d.x1, y: d.y + d.y1}];
        // Temporary hack
        d.x -= size[0] >> 1;
        d.y -= size[1] >> 1;
      }
    }

    return tags;
  }

  function getContext(canvas) {
    canvas.width = canvas.height = 1;
    var ratio = Math.sqrt(canvas.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);
    canvas.width = (cw << 5) / ratio;
    canvas.height = ch / ratio;

    var context = canvas.getContext("2d");
    context.fillStyle = context.strokeStyle = "red";
    context.textAlign = "center";

    return {context: context, ratio: ratio};
  }

  function place(board, tag, bounds) {
    var startX = tag.x,
        startY = tag.y,
        maxDelta = Math.sqrt(size[0] * size[0] + size[1] * size[1]),
        s = spiral(size),
        dt = random() < .5 ? 1 : -1,
        t = -dt,
        dxdy,
        dx,
        dy;

    while (dxdy = s(t += dt)) {
      dx = ~~dxdy[0];
      dy = ~~dxdy[1];

      if (Math.min(Math.abs(dx), Math.abs(dy)) >= maxDelta) break;

      tag.x = startX + dx;
      tag.y = startY + dy;

      if (tag.x + tag.x0 < 0 || tag.y + tag.y0 < 0 ||
          tag.x + tag.x1 > size[0] || tag.y + tag.y1 > size[1]) continue;
      // TODO only check for collisions within current bounds.
      if (!bounds || !cloudCollide(tag, board, size[0])) {
        if (!bounds || collideRects(tag, bounds)) {
          var sprite = tag.sprite,
              w = tag.width >> 5,
              sw = size[0] >> 5,
              lx = tag.x - (w << 4),
              sx = lx & 0x7f,
              msx = 32 - sx,
              h = tag.y1 - tag.y0,
              x = (tag.y + tag.y0) * sw + (lx >> 5),
              last;
          for (var j = 0; j < h; j++) {
            last = 0;
            for (var i = 0; i <= w; i++) {
              board[x + i] |= (last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0);
            }
            x += sw;
          }
          tag.sprite = null;
          return true;
        }
      }
    }
    return false;
  }

  cloud.words = function(_) {
    return arguments.length ? (words = _, cloud) : words;
  };

  cloud.size = function(_) {
    return arguments.length ? (size = [+_[0], +_[1]], cloud) : size;
  };

  cloud.font = function(_) {
    return arguments.length ? (font = functor(_), cloud) : font;
  };

  cloud.fontStyle = function(_) {
    return arguments.length ? (fontStyle = functor(_), cloud) : fontStyle;
  };

  cloud.fontWeight = function(_) {
    return arguments.length ? (fontWeight = functor(_), cloud) : fontWeight;
  };

  cloud.rotate = function(_) {
    return arguments.length ? (rotate = functor(_), cloud) : rotate;
  };

  cloud.text = function(_) {
    return arguments.length ? (text = functor(_), cloud) : text;
  };

  cloud.spiral = function(_) {
    return arguments.length ? (spiral = spirals[_] || _, cloud) : spiral;
  };

  cloud.fontSize = function(_) {
    return arguments.length ? (fontSize = functor(_), cloud) : fontSize;
  };

  cloud.padding = function(_) {
    return arguments.length ? (padding = functor(_), cloud) : padding;
  };

  cloud.random = function(_) {
    return arguments.length ? (random = _, cloud) : random;
  };

  return cloud;
}

// Fetches a monochrome sprite bitmap for the specified text.
// Load in batches for speed.
function cloudSprite(contextAndRatio, d, data, di) {
  if (d.sprite) return;
  var c = contextAndRatio.context,
      ratio = contextAndRatio.ratio;

  c.clearRect(0, 0, (cw << 5) / ratio, ch / ratio);
  var x = 0,
      y = 0,
      maxh = 0,
      n = data.length,
      w, w32, h, i, j;
  --di;
  while (++di < n) {
    d = data[di];
    c.save();
    c.font = d.style + " " + d.weight + " " + ~~((d.size + 1) / ratio) + "px " + d.font;
    w = c.measureText(d.text + "m").width * ratio;
    h = d.size << 1;
    if (d.rotate) {
      var sr = Math.sin(d.rotate * cloudRadians),
          cr = Math.cos(d.rotate * cloudRadians),
          wcr = w * cr,
          wsr = w * sr,
          hcr = h * cr,
          hsr = h * sr;
      w = (Math.max(Math.abs(wcr + hsr), Math.abs(wcr - hsr)) + 0x1f) >> 5 << 5;
      h = ~~Math.max(Math.abs(wsr + hcr), Math.abs(wsr - hcr));
    } else {
      w = (w + 0x1f) >> 5 << 5;
    }
    if (h > maxh) maxh = h;
    if (x + w >= (cw << 5)) {
      x = 0;
      y += maxh;
      maxh = 0;
    }
    if (y + h >= ch) break;
    c.translate((x + (w >> 1)) / ratio, (y + (h >> 1)) / ratio);
    if (d.rotate) c.rotate(d.rotate * cloudRadians);
    c.fillText(d.text, 0, 0);
    if (d.padding) c.lineWidth = 2 * d.padding, c.strokeText(d.text, 0, 0);
    c.restore();
    d.width = w;
    d.height = h;
    d.xoff = x;
    d.yoff = y;
    d.x1 = w >> 1;
    d.y1 = h >> 1;
    d.x0 = -d.x1;
    d.y0 = -d.y1;
    d.hasText = true;
    x += w;
  }
  var pixels = c.getImageData(0, 0, (cw << 5) / ratio, ch / ratio).data,
      sprite = [];
  while (--di >= 0) {
    d = data[di];
    if (!d.hasText) continue;
    w = d.width;
    w32 = w >> 5;
    h = d.y1 - d.y0;
    // Zero the buffer
    for (i = 0; i < h * w32; i++) sprite[i] = 0;
    x = d.xoff;
    if (x == null) return;
    y = d.yoff;
    var seen = 0,
        seenRow = -1;
    for (j = 0; j < h; j++) {
      for (i = 0; i < w; i++) {
        var k = w32 * j + (i >> 5),
            m = pixels[((y + j) * (cw << 5) + (x + i)) << 2] ? 1 << (31 - (i % 32)) : 0;
        sprite[k] |= m;
        seen |= m;
      }
      if (seen) seenRow = j;
      else {
        d.y0++;
        h--;
        j--;
        y++;
      }
    }
    d.y1 = d.y0 + seenRow;
    d.sprite = sprite.slice(0, (d.y1 - d.y0) * w32);
  }
}

// Use mask-based collision detection.
function cloudCollide(tag, board, sw) {
  sw >>= 5;
  var sprite = tag.sprite,
      w = tag.width >> 5,
      lx = tag.x - (w << 4),
      sx = lx & 0x7f,
      msx = 32 - sx,
      h = tag.y1 - tag.y0,
      x = (tag.y + tag.y0) * sw + (lx >> 5),
      last;
  for (var j = 0; j < h; j++) {
    last = 0;
    for (var i = 0; i <= w; i++) {
      if (((last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0))
          & board[x + i]) return true;
    }
    x += sw;
  }
  return false;
}

function cloudBounds(bounds, d) {
  var b0 = bounds[0],
      b1 = bounds[1];
  if (d.x + d.x0 < b0.x) b0.x = d.x + d.x0;
  if (d.y + d.y0 < b0.y) b0.y = d.y + d.y0;
  if (d.x + d.x1 > b1.x) b1.x = d.x + d.x1;
  if (d.y + d.y1 > b1.y) b1.y = d.y + d.y1;
}

function collideRects(a, b) {
  return a.x + a.x1 > b[0].x && a.x + a.x0 < b[1].x && a.y + a.y1 > b[0].y && a.y + a.y0 < b[1].y;
}

function archimedeanSpiral(size) {
  var e = size[0] / size[1];
  return function(t) {
    return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)];
  };
}

function rectangularSpiral(size) {
  var dy = 4,
      dx = dy * size[0] / size[1],
      x = 0,
      y = 0;
  return function(t) {
    var sign = t < 0 ? -1 : 1;
    // See triangular numbers: T_n = n * (n + 1) / 2.
    switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
      case 0:  x += dx; break;
      case 1:  y += dy; break;
      case 2:  x -= dx; break;
      default: y -= dy; break;
    }
    return [x, y];
  };
}

// TODO reuse arrays?
function zeroArray(n) {
  var a = [],
      i = -1;
  while (++i < n) a[i] = 0;
  return a;
}

function cloudCanvas() {
  try {
    return typeof document !== 'undefined' && document.createElement
      ? document.createElement('canvas')
      : new (require('canvas'))();
  } catch (e) {
    error('Canvas unavailable. Run in browser or install node-canvas.');
  }
}

function functor(d) {
  return typeof d === "function" ? d : function() { return d; };
}

var spirals = {
  archimedean: archimedeanSpiral,
  rectangular: rectangularSpiral
};

var output = ['x', 'y', 'font', 'fontSize', 'fontStyle', 'fontWeight', 'angle'];
var params = ['text', 'font', 'rotate', 'fontSize', 'fontStyle', 'fontWeight'];

function Wordcloud(params) {
  Transform.call(this, cloud(), params);
}

var prototype$64 = inherits(Wordcloud, Transform);

prototype$64.transform = function(_, pulse) {
  function modp(param) {
    var p = _[param];
    return isFunction(p) && pulse.modified(p.fields);
  }

  var mod = _.modified();
  if (!(mod || pulse.changed(pulse.ADD_REM) || params.some(modp))) return;

  var layout = this.value,
      as = _.as || output,
      fontSize = _.fontSize || 14,
      range;

  isFunction(fontSize)
    ? (range = _.fontSizeRange)
    : (fontSize = constant(fontSize));

  // create font size scaling function as needed
  if (range) {
    var fsize = fontSize,
        sizeScale = scale$1('sqrt')()
          .domain(extent$1(fsize, pulse))
          .range(range);
    fontSize = function(x) { return sizeScale(fsize(x)); };
  }

  var data = pulse.materialize(pulse.SOURCE).source;
  data.forEach(function(t) {
    t[as[0]] = NaN;
    t[as[1]] = NaN;
    t[as[3]] = 0;
  });

  // configure layout
  var words = layout
    .words(data)
    .text(_.text)
    .size(_.size || [500, 500])
    .padding(_.padding || 1)
    .spiral(_.spiral || 'archimedean')
    .rotate(_.rotate || 0)
    .font(_.font || 'sans-serif')
    .fontStyle(_.fontStyle || 'normal')
    .fontWeight(_.fontWeight || 'normal')
    .fontSize(fontSize)
    .layout();

  var size = layout.size(),
      dx = size[0] >> 1,
      dy = size[1] >> 1,
      i = 0,
      n = words.length,
      w, t;

  for (; i<n; ++i) {
    w = words[i];
    t = w.datum;
    t[as[0]] = w.x + dx;
    t[as[1]] = w.y + dy;
    t[as[2]] = w.font;
    t[as[3]] = w.size;
    t[as[4]] = w.style;
    t[as[5]] = w.weight;
    t[as[6]] = w.rotate;
  }

  return pulse.reflow(mod).modifies(as);
};

function extent$1(size, pulse) {
  var e = new transforms.Extent();
  e.transform({field: size, modified: truthy}, pulse);
  return e.value;
}

var WordcloudDefinition = {
  "type": "Wordcloud",
  "metadata": {"modifies": true},
  "params": [
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "font", "type": "string", "expr": true, "default": "sans-serif" },
    { "name": "fontStyle", "type": "string", "expr": true, "default": "normal" },
    { "name": "fontWeight", "type": "string", "expr": true, "default": "normal" },
    { "name": "fontSize", "type": "number", "expr": true, "default": 14 },
    { "name": "fontSizeRange", "type": "number", "array": true, "null": true, "default": [10, 50] },
    { "name": "rotate", "type": "number", "expr": true, "default": 0 },
    { "name": "text", "type": "field" },
    { "name": "spiral", "type": "string", "values": ["archimedean", "rectangular"] },
    { "name": "padding", "type": "number", "expr": true },
    { "name": "as", "type": "string", "array": true, "length": 7,
      "default": ["x", "y", "font", "fontSize", "fontStyle", "fontWeight", "angle"] }
  ]
};

register(WordcloudDefinition, Wordcloud);

function array8(n) { return new Uint8Array(n); }

function array16(n) { return new Uint16Array(n); }

function array32(n) { return new Uint32Array(n); }

/**
 * Maintains CrossFilter state.
 */
function Bitmaps() {

  var width = 8,
      data = [],
      seen = array32(0),
      curr = array$2(0, width),
      prev = array$2(0, width);

  return {

    data: function() { return data; },

    seen: function() {
      return (seen = lengthen(seen, data.length));
    },

    add: function(array) {
      for (var i=0, j=data.length, n=array.length, t; i<n; ++i) {
        t = array[i];
        t._index = j++;
        data.push(t);
      }
    },

    remove: function(num, map) { // map: index -> boolean (true => remove)
      var n = data.length,
          copy = Array(n - num),
          reindex = data, // reuse old data array for index map
          t, i, j;

      // seek forward to first removal
      for (i=0; !map[i] && i<n; ++i) {
        copy[i] = data[i];
        reindex[i] = i;
      }

      // condense arrays
      for (j=i; i<n; ++i) {
        t = data[i];
        if (!map[i]) {
          reindex[i] = j;
          curr[j] = curr[i];
          prev[j] = prev[i];
          copy[j] = t;
          t._index = j++;
        } else {
          reindex[i] = -1;
        }
        curr[i] = 0; // clear unused bits
      }

      return (data = copy, reindex);
    },

    size: function() { return data.length; },

    curr: function() { return curr; },

    prev: function() { return prev; },

    reset: function(k) { prev[k] = curr[k]; },

    all: function() {
      return width < 0x101 ? 0xff : width < 0x10001 ? 0xffff : 0xffffffff;
    },

    set: function(k, one) { curr[k] |= one; },

    clear: function(k, one) { curr[k] &= ~one; },

    resize: function(n, m) {
      var k = curr.length;
      if (n > k || m > width) {
        width = Math.max(m, width);
        curr = array$2(n, width, curr);
        prev = array$2(n, width);
      }
    }
  };
}

function lengthen(array, length, copy) {
  if (array.length >= length) return array;
  copy = copy || new array.constructor(length);
  copy.set(array);
  return copy;
}

function array$2(n, m, array) {
  var copy = (m < 0x101 ? array8 : m < 0x10001 ? array16 : array32)(n);
  if (array) copy.set(array);
  return copy;
}

function Dimension(index, i, query) {
  var bit = (1 << i);

  return {
    one:     bit,
    zero:    ~bit,
    range:   query.slice(),
    bisect:  index.bisect,
    index:   index.index,
    size:    index.size,

    onAdd: function(added, curr) {
      var dim = this,
          range = dim.bisect(dim.range, added.value),
          idx = added.index,
          lo = range[0],
          hi = range[1],
          n1 = idx.length, i;

      for (i=0;  i<lo; ++i) curr[idx[i]] |= bit;
      for (i=hi; i<n1; ++i) curr[idx[i]] |= bit;
      return dim;
    }
  };
}

/**
 * Maintains a list of values, sorted by key.
 */
function SortedIndex() {
  var index = array32(0),
      value = [],
      size = 0;

  function insert(key, data, base) {
    if (!data.length) return [];

    var n0 = size,
        n1 = data.length,
        addv = Array(n1),
        addi = array32(n1),
        oldv, oldi, i;

    for (i=0; i<n1; ++i) {
      addv[i] = key(data[i]);
      addi[i] = i;
    }
    addv = sort(addv, addi);

    if (n0) {
      oldv = value;
      oldi = index;
      value = Array(n0 + n1);
      index = array32(n0 + n1);
      merge$1(base, oldv, oldi, n0, addv, addi, n1, value, index);
    } else {
      if (base > 0) for (i=0; i<n1; ++i) {
        addi[i] += base;
      }
      value = addv;
      index = addi;
    }
    size = n0 + n1;

    return {index: addi, value: addv};
  }

  function remove(num, map) {
    // map: index -> remove
    var n = size,
        idx, i, j;

    // seek forward to first removal
    for (i=0; !map[index[i]] && i<n; ++i);

    // condense index and value arrays
    for (j=i; i<n; ++i) {
      if (!map[idx=index[i]]) {
        index[j] = idx;
        value[j] = value[i];
        ++j;
      }
    }

    size = n - num;
  }

  function reindex(map) {
    for (var i=0, n=size; i<n; ++i) {
      index[i] = map[index[i]];
    }
  }

  function bisect(range, array) {
    var n = array ? array.length : (array = value, size);
    return [
      d3Array.bisectLeft(array, range[0], 0, n),
      d3Array.bisectRight(array, range[1], 0, n)
    ];
  }

  return {
    insert:  insert,
    remove:  remove,
    bisect:  bisect,
    reindex: reindex,
    index:   function() { return index; },
    size:    function() { return size; }
  };
}

function sort(values, index) {
  values.sort.call(index, function(a, b) {
    var x = values[a],
        y = values[b];
    return x < y ? -1 : x > y ? 1 : 0;
  });
  return d3Array.permute(values, index);
}

function merge$1(base, value0, index0, n0, value1, index1, n1, value, index) {
  var i0 = 0, i1 = 0, i;

  for (i=0; i0 < n0 && i1 < n1; ++i) {
    if (value0[i0] < value1[i1]) {
      value[i] = value0[i0];
      index[i] = index0[i0++];
    } else {
      value[i] = value1[i1];
      index[i] = index1[i1++] + base;
    }
  }

  for (; i0 < n0; ++i0, ++i) {
    value[i] = value0[i0];
    index[i] = index0[i0];
  }

  for (; i1 < n1; ++i1, ++i) {
    value[i] = value1[i1];
    index[i] = index1[i1] + base;
  }
}

/**
 * An indexed multi-dimensional filter.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} params.fields - An array of dimension accessors to filter.
 * @param {Array} params.query - An array of per-dimension range queries.
 */
function CrossFilter(params) {
  Transform.call(this, Bitmaps(), params);
  this._indices = null;
  this._dims = null;
}

var prototype$65 = inherits(CrossFilter, Transform);

prototype$65.transform = function(_, pulse) {
  if (!this._dims) {
    return this.init(_, pulse);
  } else {
    var init = _.modified('fields')
          || _.fields.some(function(f) { return pulse.modified(f.fields); });

    return init
      ? this.reinit(_, pulse)
      : this.eval(_, pulse);
  }
};

prototype$65.init = function(_, pulse) {
  var fields = _.fields,
      query = _.query,
      indices = this._indices = {},
      dims = this._dims = [],
      m = query.length,
      i = 0, key, index;

  // instantiate indices and dimensions
  for (; i<m; ++i) {
    key = fields[i].fname;
    index = indices[key] || (indices[key] = SortedIndex());
    dims.push(Dimension(index, i, query[i]));
  }

  return this.eval(_, pulse);
};

prototype$65.reinit = function(_, pulse) {
  var output = pulse.materialize().fork(),
      fields = _.fields,
      query = _.query,
      indices = this._indices,
      dims = this._dims,
      bits = this.value,
      curr = bits.curr(),
      prev = bits.prev(),
      all = bits.all(),
      out = (output.rem = output.add),
      mod = output.mod,
      m = query.length,
      adds = {}, add, index, key,
      mods, remMap, modMap, i, n, f;

  // set prev to current state
  prev.set(curr);

  // if pulse has remove tuples, process them first
  if (pulse.rem.length) {
    remMap = this.remove(_, pulse, output);
  }

  // if pulse has added tuples, add them to state
  if (pulse.add.length) {
    bits.add(pulse.add);
  }

  // if pulse has modified tuples, create an index map
  if (pulse.mod.length) {
    modMap = {};
    for (mods=pulse.mod, i=0, n=mods.length; i<n; ++i) {
      modMap[mods[i]._index] = 1;
    }
  }

  // re-initialize indices as needed, update curr bitmap
  for (i=0; i<m; ++i) {
    f = fields[i];
    if (!dims[i] || _.modified('fields', i) || pulse.modified(f.fields)) {
      key = f.fname;
      if (!(add = adds[key])) {
        indices[key] = index = SortedIndex();
        adds[key] = add = index.insert(f, pulse.source, 0);
      }
      dims[i] = Dimension(index, i, query[i]).onAdd(add, curr);
    }
  }

  // visit each tuple
  // if filter state changed, push index to add/rem
  // else if in mod and passes a filter, push index to mod
  for (i=0, n=bits.data().length; i<n; ++i) {
    if (remMap[i]) { // skip if removed tuple
      continue;
    } else if (prev[i] !== curr[i]) { // add if state changed
      out.push(i);
    } else if (modMap[i] && curr[i] !== all) { // otherwise, pass mods through
      mod.push(i);
    }
  }

  bits.mask = (1 << m) - 1;
  return output;
};

prototype$65.eval = function(_, pulse) {
  var output = pulse.materialize().fork(),
      m = this._dims.length,
      mask = 0;

  if (pulse.rem.length) {
    this.remove(_, pulse, output);
    mask |= (1 << m) - 1;
  }

  if (_.modified('query') && !_.modified('fields')) {
    mask |= this.update(_, pulse, output);
  }

  if (pulse.add.length) {
    this.insert(_, pulse, output);
    mask |= (1 << m) - 1;
  }

  if (pulse.mod.length) {
    this.modify(pulse, output);
    mask |= (1 << m) - 1;
  }

  this.value.mask = mask;
  return output;
};

prototype$65.insert = function(_, pulse, output) {
  var tuples = pulse.add,
      bits = this.value,
      dims = this._dims,
      indices = this._indices,
      fields = _.fields,
      adds = {},
      out = output.add,
      k = bits.size(),
      n = k + tuples.length,
      m = dims.length, j, key, add;

  // resize bitmaps and add tuples as needed
  bits.resize(n, m);
  bits.add(tuples);

  var curr = bits.curr(),
      prev = bits.prev(),
      all  = bits.all();

  // add to dimensional indices
  for (j=0; j<m; ++j) {
    key = fields[j].fname;
    add = adds[key] || (adds[key] = indices[key].insert(fields[j], tuples, k));
    dims[j].onAdd(add, curr);
  }

  // set previous filters, output if passes at least one filter
  for (; k<n; ++k) {
    prev[k] = all;
    if (curr[k] !== all) out.push(k);
  }
};

prototype$65.modify = function(pulse, output) {
  var out = output.mod,
      bits = this.value,
      curr = bits.curr(),
      all  = bits.all(),
      tuples = pulse.mod,
      i, n, k;

  for (i=0, n=tuples.length; i<n; ++i) {
    k = tuples[i]._index;
    if (curr[k] !== all) out.push(k);
  }
};

prototype$65.remove = function(_, pulse, output) {
  var indices = this._indices,
      bits = this.value,
      curr = bits.curr(),
      prev = bits.prev(),
      all  = bits.all(),
      map = {},
      out = output.rem,
      tuples = pulse.rem,
      i, n, k, f;

  // process tuples, output if passes at least one filter
  for (i=0, n=tuples.length; i<n; ++i) {
    k = tuples[i]._index;
    map[k] = 1; // build index map
    prev[k] = (f = curr[k]);
    curr[k] = all;
    if (f !== all) out.push(k);
  }

  // remove from dimensional indices
  for (k in indices) {
    indices[k].remove(n, map);
  }

  return (this.reindex(pulse, n, map), map);
};

// reindex filters and indices after propagation completes
prototype$65.reindex = function(pulse, num, map) {
  var indices = this._indices,
      bits = this.value;

  pulse.runAfter(function() {
    var indexMap = bits.remove(num, map);
    for (var key in indices) indices[key].reindex(indexMap);
  });
};

prototype$65.update = function(_, pulse, output) {
  var dims = this._dims,
      query = _.query,
      stamp = pulse.stamp,
      m = dims.length,
      mask = 0, i, q;

  // survey how many queries have changed
  output.filters = 0;
  for (q=0; q<m; ++q) {
    if (_.modified('query', q)) { i = q; ++mask; }
  }

  if (mask === 1) {
    // only one query changed, use more efficient update
    mask = dims[i].one;
    this.incrementOne(dims[i], query[i], output.add, output.rem);
  } else {
    // multiple queries changed, perform full record keeping
    for (q=0, mask=0; q<m; ++q) {
      if (!_.modified('query', q)) continue;
      mask |= dims[q].one;
      this.incrementAll(dims[q], query[q], stamp, output.add);
      output.rem = output.add; // duplicate add/rem for downstream resolve
    }
  }

  return mask;
};

prototype$65.incrementAll = function(dim, query, stamp, out) {
  var bits = this.value,
      seen = bits.seen(),
      curr = bits.curr(),
      prev = bits.prev(),
      index = dim.index(),
      old = dim.bisect(dim.range),
      range = dim.bisect(query),
      lo1 = range[0],
      hi1 = range[1],
      lo0 = old[0],
      hi0 = old[1],
      one = dim.one,
      i, j, k;

  // Fast incremental update based on previous lo index.
  if (lo1 < lo0) {
    for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one;
    }
  } else if (lo1 > lo0) {
    for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one;
    }
  }

  // Fast incremental update based on previous hi index.
  if (hi1 > hi0) {
    for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one;
    }
  } else if (hi1 < hi0) {
    for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one;
    }
  }

  dim.range = query.slice();
};

prototype$65.incrementOne = function(dim, query, add, rem) {
  var bits = this.value,
      curr = bits.curr(),
      index = dim.index(),
      old = dim.bisect(dim.range),
      range = dim.bisect(query),
      lo1 = range[0],
      hi1 = range[1],
      lo0 = old[0],
      hi0 = old[1],
      one = dim.one,
      i, j, k;

  // Fast incremental update based on previous lo index.
  if (lo1 < lo0) {
    for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
      k = index[i];
      curr[k] ^= one;
      add.push(k);
    }
  } else if (lo1 > lo0) {
    for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
      k = index[i];
      curr[k] ^= one;
      rem.push(k);
    }
  }

  // Fast incremental update based on previous hi index.
  if (hi1 > hi0) {
    for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
      k = index[i];
      curr[k] ^= one;
      add.push(k);
    }
  } else if (hi1 < hi0) {
    for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
      k = index[i];
      curr[k] ^= one;
      rem.push(k);
    }
  }

  dim.range = query.slice();
};

var CrossFilterDefinition = {
  "type": "CrossFilter",
  "metadata": {},
  "params": [
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "query", "type": "array", "array": true, "required": true,
      "content": {"type": "number", "array": true, "length": 2} }
  ]
};

/**
 * Selectively filters tuples by resolving against a filter bitmap.
 * Useful for processing the output of a cross-filter transform.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.ignore - A bit mask indicating which filters to ignore.
 * @param {object} params.filter - The per-tuple filter bitmaps. Typically this
 *   parameter value is a reference to a {@link CrossFilter} transform.
 */
function ResolveFilter(params) {
  Transform.call(this, null, params);
}

var prototype$66 = inherits(ResolveFilter, Transform);

prototype$66.transform = function(_, pulse) {
  var ignore = ~(_.ignore || 0), // bit mask where zeros -> dims to ignore
      bitmap = _.filter,
      mask = bitmap.mask;

  // exit early if no relevant filter changes
  if ((mask & ignore) === 0) return pulse.StopPropagation;

  var output = pulse.fork(pulse.ALL),
      data = bitmap.data(),
      curr = bitmap.curr(),
      prev = bitmap.prev(),
      pass = function(k) {
        return !(curr[k] & ignore) ? data[k] : null;
      };

  // propagate all mod tuples that pass the filter
  output.filter(output.MOD, pass);

  // determine add & rem tuples via filter functions
  // for efficiency, we do *not* populate new arrays,
  // instead we add filter functions applied downstream

  if (!(mask & (mask-1))) { // only one filter changed
    output.filter(output.ADD, pass);
    output.filter(output.REM, function(k) {
      return (curr[k] & ignore) === mask ? data[k] : null;
    });

  } else { // multiple filters changed
    output.filter(output.ADD, function(k) {
      var c = curr[k] & ignore,
          f = !c && (c ^ (prev[k] & ignore));
      return f ? data[k] : null;
    });
    output.filter(output.REM, function(k) {
      var c = curr[k] & ignore,
          f = c && !(c ^ (c ^ (prev[k] & ignore)));
      return f ? data[k] : null;
    });
  }

  // add filter to source data in case of reflow...
  return output.filter(output.SOURCE, function(t) { return pass(t._index); });
};

var ResolveFilterDefinition = {
  "type": "ResolveFilter",
  "metadata": {},
  "params": [
    { "name": "ignore", "type": "number", "required": true,
      "description": "A bit mask indicating which filters to ignore." },
    { "name": "filter", "type": "object", "required": true,
      "description": "Per-tuple filter bitmaps from a CrossFilter transform." }
  ]
};

register(CrossFilterDefinition, CrossFilter);

register(ResolveFilterDefinition, ResolveFilter);

/**
 * Calculate bounding boxes for scenegraph items.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.mark - The scenegraph mark instance to bound.
 */
function Bound(params) {
  Transform.call(this, null, params);
}

var prototype$67 = inherits(Bound, Transform);
var temp$1 = new Bounds();
prototype$67.transform = function(_, pulse) {
  var mark = _.mark,
      type = mark.marktype,
      entry = Marks[type],
      bound = entry.bound,
      clip = mark.clip,
      markBounds = mark.bounds, rebound;

  mark.bounds_prev.clear().union(markBounds);

  if (entry.nested) {
    // multi-item marks have a single bounds instance
    markBounds = boundItem$1(mark, bound);
    mark.items.forEach(function(item) {
      item.bounds_prev.clear().union(item.bounds);
      item.bounds.clear().union(markBounds);
    });
  }

  else if (type === 'group' || _.modified()) {
    // operator parameters modified -> re-bound all items
    // updates group bounds in response to modified group content
    markBounds.clear();
    mark.items.forEach(function(item) {
      markBounds.union(boundItem$1(item, bound));
    });
  }

  else {
    // incrementally update bounds, re-bound mark as needed
    rebound = pulse.changed(pulse.REM);

    pulse.visit(pulse.ADD, function(item) {
      markBounds.union(boundItem$1(item, bound));
    });

    pulse.visit(pulse.MOD, function(item) {
      rebound = rebound || markBounds.alignsWith(item.bounds);
      markBounds.union(boundItem$1(item, bound));
    });

    if (rebound && !clip) {
      markBounds.clear();
      mark.items.forEach(function(item) { markBounds.union(item.bounds); });
    }
  }

  if (clip) {
    markBounds.intersect(temp$1.set(0, 0, mark.group.width, mark.group.height));
  }

  return pulse.modifies('bounds');
};

function boundItem$1(item, bound, opt) {
  item.bounds_prev.clear().union(item.bounds);
  return bound(item.bounds.clear(), item, opt);
}

/**
 * Bind scenegraph items to a scenegraph mark instance.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.markdef - The mark definition for creating the mark.
 *   This is an object of legal scenegraph mark properties which *must* include
 *   the 'marktype' property.
 * @param {Array<number>} params.scenepath - Scenegraph tree coordinates for the mark.
 *   The path is an array of integers, each indicating the index into
 *   a successive chain of items arrays.
 */
function Mark(params) {
  Transform.call(this, null, params);
}

var prototype$68 = inherits(Mark, Transform);

prototype$68.transform = function(_, pulse) {
  var mark = this.value;

  // acquire mark on first invocation, bind context and group
  if (!mark) {
    mark = pulse.dataflow.scenegraph().mark(_.markdef, lookup$1(_), _.index);
    mark.group.context = _.context;
    if (!_.context.group) _.context.group = mark.group;
    mark.source = this;
    this.value = mark;
  }

  // initialize entering items
  var Init = mark.marktype === 'group' ? GroupItem : Item;
  pulse.visit(pulse.ADD, function(item) { Init.call(item, mark); });

  // bind items array to scenegraph mark
  return (mark.items = pulse.source, pulse);
};

function lookup$1(_) {
  var g = _.groups, p = _.parent;
  return g && g.size === 1 ? g.get(Object.keys(g.object)[0])
    : g && p ? g.lookup(p)
    : null;
}

/**
 * Queue modified scenegraph items for rendering.
 * @constructor
 */
function Render(params) {
  Transform.call(this, null, params);
}

var prototype$69 = inherits(Render, Transform);

prototype$69.transform = function(_, pulse) {
  var view = pulse.dataflow;

  if (pulse.changed(pulse.REM)) {
    view.enqueue(pulse.materialize(pulse.REM).rem);
  }

  if (pulse.changed(pulse.ADD)) {
    view.enqueue(pulse.materialize(pulse.ADD).add);
  }

  if (pulse.changed(pulse.MOD)) {
    view.enqueue(pulse.materialize(pulse.MOD).mod);
  }

  // set z-index dirty flag as needed
  if (pulse.fields && pulse.fields['zindex']) {
    var item = pulse.source && pulse.source[0];
    if (item) item.mark.zdirty = true;
  }
};

var AxisRole$1 = 'axis';
var LegendRole$1 = 'legend';
var RowHeader$1 = 'row-header';
var RowFooter$1 = 'row-footer';
var RowTitle  = 'row-title';
var ColHeader$1 = 'column-header';
var ColFooter$1 = 'column-footer';
var ColTitle  = 'column-title';
function extractGroups(group) {
  var groups = group.items,
      n = groups.length,
      i = 0, mark, items;

  var views = {
    marks:      [],
    rowheaders: [],
    rowfooters: [],
    colheaders: [],
    colfooters: [],
    rowtitle: null,
    coltitle: null
  };

  // layout axes, gather legends, collect bounds
  for (; i<n; ++i) {
    mark = groups[i];
    items = mark.items;
    if (mark.marktype === 'group') {
      switch (mark.role) {
        case AxisRole$1:
        case LegendRole$1:
          break;
        case RowHeader$1: addAll(items, views.rowheaders); break;
        case RowFooter$1: addAll(items, views.rowfooters); break;
        case ColHeader$1: addAll(items, views.colheaders); break;
        case ColFooter$1: addAll(items, views.colfooters); break;
        case RowTitle:  views.rowtitle = items[0]; break;
        case ColTitle:  views.coltitle = items[0]; break;
        default:        addAll(items, views.marks);
      }
    }
  }

  return views;
}

function addAll(items, array) {
  for (var i=0, n=items.length; i<n; ++i) {
    array.push(items[i]);
  }
}

function bboxFlush(item) {
  return {x1: 0, y1: 0, x2: item.width || 0, y2: item.height || 0};
}

function bboxFull(item) {
  return item.bounds.clone().translate(-(item.x||0), -(item.y||0));
}

function boundFlush(item, field) {
  var b = {x1: item.x, y1: item.y, x2: item.x + item.width, y2: item.y + item.height};
  return b[field];
}

function boundFull(item, field) {
  return item.bounds[field];
}

function get(opt, key, d) {
  return (isObject(opt) ? opt[key] : opt) || d || 0;
}

function gridLayout(view, group, opt) {
  var views = extractGroups(group, opt),
      groups = views.marks,
      flush = opt.bounds === 'flush',
      bbox = flush ? bboxFlush : bboxFull,
      bounds = new Bounds(0, 0, 0, 0),
      alignCol = get(opt.align, 'column'),
      alignRow = get(opt.align, 'row'),
      padCol = get(opt.padding, 'column'),
      padRow = get(opt.padding, 'row'),
      off = opt.offset,
      ncols = opt.columns || groups.length,
      nrows = ncols < 0 ? 1 : Math.ceil(groups.length / ncols),
      cells = nrows * ncols,
      xOffset = [], xInit = 0,
      yOffset = [], yInit = 0,
      n = groups.length,
      m, i, j, b, g, px, py, x, y, band, offset;

  // determine offsets for each group
  for (i=0; i<n; ++i) {
    b = bbox(groups[i]);
    px = i % ncols === 0 ? 0 : Math.ceil(bbox(groups[i-1]).x2);
    py = i < ncols ? 0 : Math.ceil(bbox(groups[i-ncols]).y2);
    x = (b.x1 < 0 ? Math.ceil(-b.x1) : 0) + px;
    y = (b.y1 < 0 ? Math.ceil(-b.y1) : 0) + py;
    xOffset.push(x + padCol);
    yOffset.push(y + padRow);
  }

  // set initial alignment offsets
  for (i=0; i<n; ++i) {
    if (i % ncols === 0) xOffset[i] = xInit;
    if (i < ncols) yOffset[i] = yInit;
  }

  // enforce column alignment constraints
  if (alignCol === 'each') {
    for (j=1; j<ncols; ++j) {
      for (offset=0, i=j; i<n; i += ncols) {
        if (offset < xOffset[i]) offset = xOffset[i];
      }
      for (i=j; i<n; i += ncols) {
        xOffset[i] = offset;
      }
    }
  } else if (alignCol === 'all') {
    for (offset=0, i=0; i<n; ++i) {
      if (i % ncols && offset < xOffset[i]) offset = xOffset[i];
    }
    for (i=0; i<n; ++i) {
      if (i % ncols) xOffset[i] = offset;
    }
  }

  // enforce row alignment constraints
  if (alignRow === 'each') {
    for (j=1; j<nrows; ++j) {
      for (offset=0, i=j*ncols, m=i+ncols; i<m; ++i) {
        if (offset < yOffset[i]) offset = yOffset[i];
      }
      for (i=j*ncols; i<m; ++i) {
        yOffset[i] = offset;
      }
    }
  } else if (alignRow === 'all') {
    for (offset=0, i=ncols; i<n; ++i) {
      if (offset < yOffset[i]) offset = yOffset[i];
    }
    for (i=ncols; i<n; ++i) {
      yOffset[i] = offset;
    }
  }

  // perform horizontal grid layout
  for (x=0, i=0; i<n; ++i) {
    g = groups[i];
    px = g.x || 0;
    g.x = (x = xOffset[i] + (i % ncols ? x : 0));
    g.bounds.translate(x - px, 0);
  }

  // perform vertical grid layout
  for (j=0; j<ncols; ++j) {
    for (y=0, i=j; i<n; i += ncols) {
      g = groups[i];
      py = g.y || 0;
      g.y = (y += yOffset[i]);
      g.bounds.translate(0, y - py);
    }
  }

  // queue groups for redraw
  view.enqueue(groups);

  // update mark bounds
  for (i=0; i<n; ++i) groups[i].mark.bounds.clear();
  for (i=0; i<n; ++i) {
    g = groups[i];
    bounds.union(g.mark.bounds.union(g.bounds));
  }

  // -- layout grid headers and footers --

  // aggregation functions for grid margin determination
  function min(a, b) { return Math.floor(Math.min(a, b)); }
  function max(a, b) { return Math.ceil(Math.max(a, b)); }

  // bounding box calculation methods
  bbox = flush ? boundFlush : boundFull;

  // perform header layout
  x = layoutHeaders(view, views.rowheaders, groups, ncols, nrows, -get(off, 'rowHeader'),    min, 0, bbox, 'x1', 0, ncols, 1);
  y = layoutHeaders(view, views.colheaders, groups, ncols, ncols, -get(off, 'columnHeader'), min, 1, bbox, 'y1', 0, 1, ncols);

  // perform footer layout
  layoutHeaders(    view, views.rowfooters, groups, ncols, nrows,  get(off, 'rowFooter'),    max, 0, bbox, 'x2', ncols-1, ncols, 1);
  layoutHeaders(    view, views.colfooters, groups, ncols, ncols,  get(off, 'columnFooter'), max, 1, bbox, 'y2', cells-ncols, 1, ncols);

  // perform row title layout
  if (views.rowtitle) {
    offset = x - get(off, 'rowTitle');
    band = get(opt.titleBand, 'row', 0.5);
    layoutTitle$1(view, views.rowtitle, offset, 0, bounds, band);
  }

  // perform column title layout
  if (views.coltitle) {
    offset = y - get(off, 'columnTitle');
    band = get(opt.titleBand, 'column', 0.5);
    layoutTitle$1(view, views.coltitle, offset, 1, bounds, band);
  }
}

function layoutHeaders(view, headers, groups, ncols, limit, offset, agg, isX, bound, bf, start, stride, back) {
  var n = groups.length,
      init = 0,
      edge = 0,
      i, j, k, m, b, h, g, x, y;

  // compute margin
  for (i=start; i<n; i+=stride) {
    if (groups[i]) init = agg(init, bound(groups[i], bf));
  }

  // if no headers, return margin calculation
  if (!headers.length) return init;

  // check if number of headers exceeds number of rows or columns
  if (headers.length > limit) {
    view.warn('Grid headers exceed limit: ' + limit);
    headers = headers.slice(0, limit);
  }

  // apply offset
  init += offset;

  // clear mark bounds for all headers
  for (j=0, m=headers.length; j<m; ++j) {
    headers[j].mark.bounds.clear();
  }

  // layout each header
  for (i=start, j=0, m=headers.length; j<m; ++j, i+=stride) {
    h = headers[j];
    b = h.mark.bounds;

    // search for nearest group to align to
    // necessary if table has empty cells
    for (k=i; (g = groups[k]) == null; k-=back);

    // assign coordinates and update bounds
    isX ? (x = g.x, y = init) : (x = init, y = g.y);
    b.union(h.bounds.translate(x - (h.x || 0), y - (h.y || 0)));
    h.x = x;
    h.y = y;

    // update current edge of layout bounds
    edge = agg(edge, b[bf]);
  }

  // queue headers for redraw
  view.enqueue(headers);
  return edge;
}

function layoutTitle$1(view, g, offset, isX, bounds, band) {
  if (!g) return;

  // compute title coordinates
  var x = offset, y = offset;
  isX
    ? (x = Math.round(bounds.x1 + band * bounds.width()))
    : (y = Math.round(bounds.y1 + band * bounds.height()));

  // assign coordinates and update bounds
  g.bounds.translate(x - (g.x || 0), y - (g.y || 0));
  g.mark.bounds.clear().union(g.bounds);
  g.x = x;
  g.y = y;

  // queue title for redraw
  view.enqueue(g.mark.items);
}

var Fit = 'fit';
var Pad = 'pad';
var None$2 = 'none';
var AxisRole = 'axis';
var TitleRole = 'title';
var FrameRole = 'frame';
var LegendRole = 'legend';
var ScopeRole = 'scope';
var RowHeader = 'row-header';
var RowFooter = 'row-footer';
var ColHeader = 'column-header';
var ColFooter = 'column-footer';
/**
 * Layout view elements such as axes and legends.
 * Also performs size adjustments.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.mark - Scenegraph mark of groups to layout.
 */
function ViewLayout(params) {
  Transform.call(this, null, params);
}

var prototype$70 = inherits(ViewLayout, Transform);

prototype$70.transform = function(_, pulse) {
  // TODO incremental update, output?
  var view = pulse.dataflow;
  _.mark.items.forEach(function(group) {
    if (_.layout) gridLayout(view, group, _.layout);
    layoutGroup(view, group, _);
  });
  return pulse;
};

function layoutGroup(view, group, _) {
  var items = group.items,
      width = Math.max(0, group.width || 0),
      height = Math.max(0, group.height || 0),
      viewBounds = new Bounds().set(0, 0, width, height),
      axisBounds = viewBounds.clone(),
      legendBounds = viewBounds.clone(),
      legends = [], title,
      mark, flow, b, i, n;

  // layout axes, gather legends, collect bounds
  for (i=0, n=items.length; i<n; ++i) {
    mark = items[i];
    switch (mark.role) {
      case AxisRole:
        axisBounds.union(b = layoutAxis(view, mark, width, height));
        if (isYAxis(mark)) legendBounds.union(b);
        break;
      case TitleRole:
        title = mark; break;
      case LegendRole:
        legends.push(mark); break;
      case FrameRole:
      case ScopeRole:
      case RowHeader:
      case RowFooter:
      case ColHeader:
      case ColFooter:
        legendBounds.union(mark.bounds);
        break;
      default:
        viewBounds.union(mark.bounds);
    }
  }

  // layout title, adjust bounds
  if (title) {
    axisBounds.union(b = layoutTitle(view, title, axisBounds));
    if (isYAxis(title)) legendBounds.union(b);
  }

  // layout legends, adjust viewBounds
  if (legends.length) {
    flow = {left: 0, right: 0, margin: _.legendMargin || 8};

    for (i=0, n=legends.length; i<n; ++i) {
      b = layoutLegend(view, legends[i], flow, legendBounds, width, height);
      (_.autosize && _.autosize.type === Fit)
        ? viewBounds.add(b.x1, 0).add(b.x2, 0)
        : viewBounds.union(b);
    }
  }

  // perform size adjustment
  layoutSize(view, group, viewBounds.union(legendBounds).union(axisBounds), _);
}

function set$1(item, property, value) {
  return item[property] === value ? 0
    : (item[property] = value, 1);
}

function isYAxis(mark) {
  var orient = mark.items[0].datum.orient;
  return orient === 'left' || orient === 'right';
}

function axisIndices(datum) {
  var index = +datum.grid;
  return [
    datum.ticks  ? index++ : -1, // ticks index
    datum.labels ? index++ : -1, // labels index
    index + (+datum.domain)      // title index
  ];
}

function layoutAxis(view, axis, width, height) {
  var item = axis.items[0],
      datum = item.datum,
      orient = datum.orient,
      indices = axisIndices(datum),
      range = item.range,
      offset = item.offset,
      position = item.position,
      minExtent = item.minExtent,
      maxExtent = item.maxExtent,
      title = datum.title && item.items[indices[2]].items[0],
      titlePadding = item.titlePadding,
      titleSize = title ? title.fontSize + titlePadding : 0,
      bounds = item.bounds,
      x = 0, y = 0, i, s;

  bounds.clear();
  if ((i=indices[0]) > -1) bounds.union(item.items[i].bounds);
  if ((i=indices[1]) > -1) bounds.union(item.items[i].bounds);

  // position axis group and title
  switch (orient) {
    case 'top':
      x = position || 0;
      y = -offset;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.y1));
      if (title) title.auto
        ? (title.y = -(titlePadding + s), s += titleSize)
        : bounds.union(title.bounds);
      bounds.add(0, -s).add(range, 0);
      break;
    case 'left':
      x = -offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.x1));
      if (title) title.auto
        ? (title.x = -(titlePadding + s), s += titleSize)
        : bounds.union(title.bounds);
      bounds.add(-s, 0).add(0, range);
      break;
    case 'right':
      x = width + offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.x2));
      if (title) title.auto
        ? (title.x = titlePadding + s, s += titleSize)
        : bounds.union(title.bounds);
      bounds.add(0, 0).add(s, range);
      break;
    case 'bottom':
      x = position || 0;
      y = height + offset;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.y2));
      if (title) title.auto
        ? (title.y = titlePadding + s, s += titleSize)
        : bounds.union(title.bounds);
      bounds.add(0, 0).add(range, s);
      break;
    default:
      x = item.x;
      y = item.y;
  }

  if (set$1(item, 'x', x + 0.5) | set$1(item, 'y', y + 0.5)) {
    view.enqueue([item]);
  }

  // update bounds
  boundStroke(bounds.translate(x, y), item);
  return item.mark.bounds.clear().union(bounds);
}

function layoutTitle(view, title, axisBounds) {
  var item = title.items[0],
      datum = item.datum,
      orient = datum.orient,
      offset = item.offset,
      bounds = item.bounds,
      x = 0, y = 0;

  // position axis group and title
  switch (orient) {
    case 'top':
      x = item.x;
      y = axisBounds.y1 - offset;
      break;
    case 'left':
      x = axisBounds.x1 - offset;
      y = item.y;
      break;
    case 'right':
      x = axisBounds.x2 + offset;
      y = item.y;
      break;
    case 'bottom':
      x = item.x;
      y = axisBounds.y2 + offset;
      break;
    default:
      x = item.x;
      y = item.y;
  }

  bounds.translate(x - item.x, y - item.y);
  if (set$1(item, 'x', x) | set$1(item, 'y', y)) {
    view.enqueue([item]);
  }

  // update bounds
  return title.bounds.clear().union(bounds);
}

function layoutLegend(view, legend, flow, axisBounds, width, height) {
  var item = legend.items[0],
      datum = item.datum,
      orient = datum.orient,
      offset = item.offset,
      bounds = item.bounds.clear(),
      x = 0,
      y = (flow[orient] || 0),
      w, h;

  // aggregate bounds to determine size
  // shave off 1 pixel because it looks better...
  item.items.forEach(function(_) { bounds.union(_.bounds); });
  w = Math.round(bounds.width()) + 2 * item.padding - 1;
  h = Math.round(bounds.height()) + 2 * item.padding - 1;

  switch (orient) {
    case 'left':
      x -= w + offset - Math.floor(axisBounds.x1);
      flow.left += h + flow.margin;
      break;
    case 'right':
      x += offset + Math.ceil(axisBounds.x2);
      flow.right += h + flow.margin;
      break;
    case 'top-left':
      x += offset;
      y += offset;
      break;
    case 'top-right':
      x += width - w - offset;
      y += offset;
      break;
    case 'bottom-left':
      x += offset;
      y += height - h - offset;
      break;
    case 'bottom-right':
      x += width - w - offset;
      y += height - h - offset;
      break;
    default:
      x = item.x;
      y = item.y;
  }

  // update legend layout
  if (set$1(item, 'x', x) | set$1(item, 'width', w) |
      set$1(item, 'y', y) | set$1(item, 'height', h)) {
    view.enqueue([item]);
  }

  // update bounds
  boundStroke(bounds.set(x, y, x + w, y + h), item);
  return item.mark.bounds.clear().union(bounds);
}

function layoutSize(view, group, viewBounds, _) {
  var type = _.autosize && _.autosize.type,
      auto = _.autosize && _.autosize.resize,
      viewWidth = view._width,
      viewHeight = view._height;

  if (view._autosize < 1 || !type) return;

  var width  = Math.max(0, group.width || 0),
      left   = Math.max(0, Math.ceil(-viewBounds.x1)),
      right  = Math.max(0, Math.ceil(viewBounds.x2 - width)),
      height = Math.max(0, group.height || 0),
      top    = Math.max(0, Math.ceil(-viewBounds.y1)),
      bottom = Math.max(0, Math.ceil(viewBounds.y2 - height));

  if (type === None$2) {
    viewWidth = width;
    viewHeight = height;
    left = 0;
    top = 0;
  }

  else if (type === Fit) {
    width = Math.max(0, viewWidth - left - right);
    height = Math.max(0, viewHeight - top - bottom);
  }

  else if (type === Pad) {
    viewWidth = width + left + right;
    viewHeight = height + top + bottom;
  }

  view.autosize(viewWidth, viewHeight, width, height, [left, top], auto);
}

var Default = 'default';

function cursor(view) {
  var cursor = view._signals.cursor;

  // add cursor signal to dataflow, if needed
  if (!cursor) {
    view._signals.cursor = (cursor = view.add({user: Default, item: null}));
  }

  // evaluate cursor on each mousemove event
  view.on(view.events('view', 'mousemove'), cursor,
    function(_, event) {
      var value = cursor.value,
          user = value ? (isString(value) ? value : value.user) : Default,
          item = event.item && event.item.cursor || null;

      return (value && user === value.user && item == value.item) ? value
        : {user: user, item: item};
    }
  );

  // when cursor signal updates, set visible cursor
  view.add(null, function(_) {
    var user = _.cursor,
        item = this.value;

    if (!isString(user)) {
      item = user.item;
      user = user.user;
    }

    setCursor(user && user !== Default ? user : (item || user));

    return item;
  }, {cursor: cursor});
}

function setCursor(cursor) {
  // set cursor on document body
  // this ensures cursor applies even if dragging out of view
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.cursor = cursor;
  }
}

function dataref(view, name) {
  var data = view._runtime.data;
  if (!data.hasOwnProperty(name)) {
    view.error('Unrecognized data set: ' + name);
  }
  return data[name];
}

function data(name) {
  return dataref(this, name).values.value;
}

function change(name, changes) {
  if (!isChangeSet(changes)) {
    this.error('Second argument to changes must be a changeset.');
  }
  var dataset = dataref(this, name);
  dataset.modified = true;
  return this.pulse(dataset.input, changes);
}

function insert(name, _) {
  return change.call(this, name, changeset().insert(_));
}

function remove(name, _) {
  return change.call(this, name, changeset().remove(_));
}

function width(view) {
  var padding = view.padding();
  return Math.max(0, view._width + padding.left + padding.right);
}

function height$1(view) {
  var padding = view.padding();
  return Math.max(0, view._height + padding.top + padding.bottom);
}

function offset$1(view) {
  var padding = view.padding(),
      origin = view._origin;
  return [
    padding.left + origin[0],
    padding.top + origin[1]
  ];
}

function resizeRenderer(view) {
  var origin = offset$1(view);
  view._renderer.background(view._background);
  view._renderer.resize(width(view), height$1(view), origin);
  view._handler.origin(origin);
}

/**
 * Extend an event with additional view-specific methods.
 * Adds a new property ('vega') to an event that provides a number
 * of methods for querying information about the current interaction.
 * The vega object provides the following methods:
 *   view - Returns the backing View instance.
 *   item - Returns the currently active scenegraph item (if any).
 *   group - Returns the currently active scenegraph group (if any).
 *     This method accepts a single string-typed argument indicating the name
 *     of the desired parent group. The scenegraph will be traversed from
 *     the item up towards the root to search for a matching group. If no
 *     argument is provided the enclosing group for the active item is
 *     returned, unless the item it itself a group, in which case it is
 *     returned directly.
 *   xy - Returns a two-element array containing the x and y coordinates for
 *     mouse or touch events. For touch events, this is based on the first
 *     elements in the changedTouches array. This method accepts a single
 *     argument: either an item instance or mark name that should serve as
 *     the reference coordinate system. If no argument is provided the
 *     top-level view coordinate system is assumed.
 *   x - Returns the current x-coordinate, accepts the same arguments as xy.
 *   y - Returns the current y-coordinate, accepts the same arguments as xy.
 * @param {Event} event - The input event to extend.
 * @param {Item} item - The currently active scenegraph item (if any).
 * @return {Event} - The extended input event.
 */
function eventExtend(view, event, item) {
  var el = view._renderer.element(),
      p, e, translate;

  if (el) {
    translate = offset$1(view);
    e = event.changedTouches ? event.changedTouches[0] : event;
    p = point(e, el);
    p[0] -= translate[0];
    p[1] -= translate[1];
  }

  return event.vega = extension(view, item, p), event.item = item, event;
}

function extension(view, item, point) {
  var itemGroup = item
    ? item.mark.marktype === 'group' ? item : item.mark.group
    : null;

  function group(name) {
    var g = itemGroup, i;
    if (name) for (i = item; i; i = i.mark.group) {
      if (i.mark.name === name) { g = i; break; }
    }
    return g && g.mark && g.mark.interactive ? g : {};
  }

  function xy(item) {
    if (!item) return point;
    if (isString(item)) item = group(item);

    var p = point.slice();
    while (item) {
      p[0] -= item.x || 0;
      p[1] -= item.y || 0;
      item = item.mark && item.mark.group;
    }
    return p;
  }

  return {
    view:  constant(view),
    item:  constant(item || {}),
    group: group,
    xy:    xy,
    x:     function(item) { return xy(item)[0]; },
    y:     function(item) { return xy(item)[1]; }
  };
}

var VIEW = 'view';
var WINDOW = 'window';
/**
 * Create a new event stream from an event source.
 * @param {object} source - The event source to monitor.
 * @param {string} type - The event type.
 * @param {function(object): boolean} [filter] - Event filter function.
 * @return {EventStream}
 */
function events$1(source, type, filter) {
  var view = this,
      s = new EventStream(filter),
      send = function(e, item) {
        if (view.preventDefault() && source === VIEW) {
          e.preventDefault();
        }
        s.receive(eventExtend(view, e, item));
        view.run();
      },
      sources;

  if (source === VIEW) {
    view.addEventListener(type, send);
    return s;
  }

  if (source === WINDOW) {
    if (typeof window !== 'undefined') sources = [window];
  } else if (typeof document !== 'undefined') {
    sources = document.querySelectorAll(source);
  }

  if (!sources) {
    view.warn('Can not resolve event source: ' + source);
    return s;
  }

  for (var i=0, n=sources.length; i<n; ++i) {
    sources[i].addEventListener(type, send);
  }

  view._eventListeners.push({
    type:    type,
    sources: sources,
    handler: send
  });

  return s;
}

function itemFilter(event) {
  return event.item;
}

function markTarget(event) {
  // grab upstream collector feeding the mark operator
  var source = event.item.mark.source;
  return source.source || source;
}

function invoke(name) {
  return function(_, event) {
    return event.vega.view()
      .changeset()
      .encode(event.item, name);
  };
}

function hover(hoverSet, leaveSet) {
  // invoke hover set upon mouseover
  this.on(
    this.events('view', 'mouseover', itemFilter),
    markTarget,
    invoke(hoverSet || 'hover')
  );

  // invoke leave set upon mouseout
  this.on(
    this.events('view', 'mouseout', itemFilter),
    markTarget,
    invoke(leaveSet || 'update')
  );

  return this;
}

/**
 * Remove all external event listeners.
 */
function finalize() {
  var listeners = this._eventListeners,
      n = listeners.length, m, e;

  while (--n >= 0) {
    e = listeners[n];
    m = e.sources.length;
    while (--m >= 0) {
      e.sources[m].removeEventListener(e.type, e.handler);
    }
  }
}

function element$1(tag, attr, text) {
  var el = document.createElement(tag);
  for (var key in attr) el.setAttribute(key, attr[key]);
  if (text != null) el.textContent = text;
  return el;
}

var BindClass = 'vega-bind';
var NameClass = 'vega-bind-name';
var RadioClass = 'vega-bind-radio';
var OptionClass = 'vega-option-';
/**
 * Bind a signal to an external HTML input element. The resulting two-way
 * binding will propagate input changes to signals, and propagate signal
 * changes to the input element state. If this view instance has no parent
 * element, we assume the view is headless and no bindings are created.
 * @param {Element|string} el - The parent DOM element to which the input
 *   element should be appended as a child. If string-valued, this argument
 *   will be treated as a CSS selector. If null or undefined, the parent
 *   element of this view will be used as the element.
 * @param {object} param - The binding parameters which specify the signal
 *   to bind to, the input element type, and type-specific configuration.
 * @return {View} - This view instance.
 */
function bind$1(view, el, binding) {
  var param = binding.param;
  var bind = binding.state || (binding.state = {
    elements: null,
    set: null,
    update: function(value) {
      bind.source = true;
      view.signal(param.signal, value).run();
    },
    active: false
  });

  if (isString(el)) el = document.querySelector(el);
  generate(bind, el, param, view.signal(param.signal));

  if (!bind.active) {
    view.on(view._signals[param.signal], null, function() {
      bind.source
        ? (bind.source = false)
        : bind.set(view.signal(param.signal));
    });
    bind.active = true;
  }

  return bind;
}

/**
 * Generate an HTML input form element and bind it to a signal.
 */
function generate(bind, el, param, value) {
  var div = element$1('div', {'class': BindClass});

  div.appendChild(element$1('span',
    {'class': NameClass},
    (param.name || param.signal)
  ));

  el.appendChild(div);

  var input = form;
  switch (param.input) {
    case 'checkbox': input = checkbox; break;
    case 'select':   input = select; break;
    case 'radio':    input = radio; break;
    case 'range':    input = range$1; break;
  }

  input(bind, div, param, value);
}

/**
 * Generates an arbitrary input form element.
 * The input type is controlled via user-provided parameters.
 */
function form(bind, el, param, value) {
  var node = element$1('input');

  for (var key in param) {
    if (key !== 'signal' && key !== 'element') {
      node.setAttribute(key === 'input' ? 'type' : key, param[key]);
    }
  }
  node.setAttribute('name', param.signal);
  node.value = value;

  el.appendChild(node);

  node.addEventListener('input', function() {
    bind.update(node.value);
  });

  bind.elements = [node];
  bind.set = function(value) { node.value = value; };
}

/**
 * Generates a checkbox input element.
 */
function checkbox(bind, el, param, value) {
  var attr = {type: 'checkbox', name: param.signal};
  if (value) attr.checked = true;
  var node = element$1('input', attr);

  el.appendChild(node);

  node.addEventListener('change', function() {
    bind.update(node.checked);
  });

  bind.elements = [node];
  bind.set = function(value) { node.checked = !!value || null; }
}

/**
 * Generates a selection list input element.
 */
function select(bind, el, param, value) {
  var node = element$1('select', {name: param.signal});

  param.options.forEach(function(option) {
    var attr = {value: option};
    if (valuesEqual(option, value)) attr.selected = true;
    node.appendChild(element$1('option', attr, option+''));
  });

  el.appendChild(node);

  node.addEventListener('change', function() {
    bind.update(param.options[node.selectedIndex]);
  });

  bind.elements = [node];
  bind.set = function(value) {
    for (var i=0, n=param.options.length; i<n; ++i) {
      if (valuesEqual(param.options[i], value)) {
        node.selectedIndex = i; return;
      }
    }
  };
}

/**
 * Generates a radio button group.
 */
function radio(bind, el, param, value) {
  var group = element$1('span', {'class': RadioClass});

  el.appendChild(group);

  bind.elements = param.options.map(function(option) {
    var id = OptionClass + param.signal + '-' + option;

    var attr = {
      id:    id,
      type:  'radio',
      name:  param.signal,
      value: option
    };
    if (valuesEqual(option, value)) attr.checked = true;

    var input = element$1('input', attr);

    input.addEventListener('change', function() {
      bind.update(option);
    });

    group.appendChild(input);
    group.appendChild(element$1('label', {'for': id}, option+''));

    return input;
  });

  bind.set = function(value) {
    var nodes = bind.elements,
        i = 0,
        n = nodes.length;
    for (; i<n; ++i) {
      if (valuesEqual(nodes[i].value, value)) nodes[i].checked = true;
    }
  };
}

/**
 * Generates a slider input element.
 */
function range$1(bind, el, param, value) {
  value = value !== undefined ? value : ((+param.max) + (+param.min)) / 2;

  var min = param.min || Math.min(0, +value) || 0,
      max = param.max || Math.max(100, +value) || 100,
      step = param.step || d3Array.tickStep(min, max, 100);

  var node = element$1('input', {
    type:  'range',
    name:  param.signal,
    min:   min,
    max:   max,
    step:  step
  });
  node.value = value;

  var label = element$1('label', {}, +value);

  el.appendChild(node);
  el.appendChild(label);

  function update() {
    label.textContent = node.value;
    bind.update(+node.value);
  }

  // subscribe to both input and change
  // signal updates halt redundant values, maintaining performance
  node.addEventListener('input', update);
  node.addEventListener('change', update);

  bind.elements = [node];
  bind.set = function(value) {
    node.value = value;
    label.textContent = value;
  };
}

function valuesEqual(a, b) {
  return a === b || (a+'' === b+'');
}

function initializeRenderer(view, r, el, constructor) {
  r = r || new constructor(view.loader());
  return r
    .initialize(el, width(view), height$1(view), offset$1(view))
    .background(view._background);
}

function initializeHandler(view, prevHandler, el, constructor) {
  var handler = new constructor()
    .scene(view.scenegraph().root)
    .initialize(el, offset$1(view), view);

  if (prevHandler) {
    handler.handleTooltip = prevHandler.handleTooltip;
    prevHandler.handlers().forEach(function(h) {
      handler.on(h.type, h.handler);
    });
  }

  return handler;
}

function initialize$1(el, elBind) {
  var view = this,
      type = view._renderType,
      module = renderModule(type),
      Handler, Renderer;

  // containing dom element
  el = view._el = el ? lookup$2(view, el) : null;

  // select appropriate renderer & handler
  if (!module) view.error('Unrecognized renderer type: ' + type);
  Handler = module.handler || CanvasHandler;
  Renderer = (el ? module.renderer : module.headless);

  // initialize renderer and input handler
  view._renderer = !Renderer ? null
    : initializeRenderer(view, view._renderer, el, Renderer);
  view._handler = initializeHandler(view, view._handler, el, Handler);

  // initialize signal bindings
  if (el) {
    elBind = elBind ? lookup$2(view, elBind)
      : el.appendChild(element$1('div', {'class': 'vega-bindings'}));

    view._bind.forEach(function(_) {
      if (_.param.element) lookup$2(view, _.param.element);
    });

    view._bind.forEach(function(_) {
      bind$1(view, _.param.element || elBind, _);
    });
  }

  return view;
}

function lookup$2(view, el) {
  if (typeof el === 'string') {
    el = typeof document !== 'undefined'
      ? document.querySelector(el)
      : view.error('DOM document instance not found.');
  }
  return el.innerHTML = '', el;
}

/**
 * Render the current scene in a headless fashion.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A Promise that resolves to a renderer.
 */
function renderHeadless(view, type) {
  var module = renderModule(type);
  return !(module && module.headless)
    ? Promise.reject('Unrecognized renderer type: ' + type)
    : view.runAsync().then(function() {
        return initializeRenderer(view, null, null, module.headless)
          .renderAsync(view._scenegraph.root);
      });
}

/**
 * Produce an image URL for the visualization. Depending on the type
 * parameter, the generated URL contains data for either a PNG or SVG image.
 * The URL can be used (for example) to download images of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @param {string} type - The image type. One of 'svg', 'png' or 'canvas'.
 *   The 'canvas' and 'png' types are synonyms for a PNG image.
 * @return {Promise} - A promise that resolves to an image URL.
 */
function renderToImageURL(type) {
  return (type !== RenderType.Canvas && type !== RenderType.SVG && type !== RenderType.PNG)
    ? Promise.reject('Unrecognized image type: ' + type)
    : renderHeadless(this, type).then(function(renderer) {
        return type === RenderType.SVG
          ? toBlobURL(renderer.svg(), 'image/svg+xml')
          : renderer.canvas().toDataURL('image/png');

      });
}

function toBlobURL(data, mime) {
  var blob = new Blob([data], {type: mime});
  return window.URL.createObjectURL(blob);
}

/**
 * Produce a Canvas instance containing a rendered visualization.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A promise that resolves to a Canvas instance.
 */
function renderToCanvas() {
  return renderHeadless(this, RenderType.Canvas)
    .then(function(renderer) { return renderer.canvas(); });
}

/**
 * Produce a rendered SVG string of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A promise that resolves to an SVG string.
 */
function renderToSVG() {
  return renderHeadless(this, RenderType.SVG)
    .then(function(renderer) { return renderer.svg(); });
}

function parseAutosize(spec, config) {
  spec = spec || config.autosize;
  return isObject(spec) ? spec
    : (spec = spec || 'pad', {type: spec});
}

function parsePadding(spec, config) {
  spec = spec || config.padding;
  return isObject(spec) ? spec
    : (spec = +spec || 0, {top:spec, bottom:spec, left:spec, right:spec});
}

var OUTER = 'outer';
var OUTER_INVALID = ['value', 'update', 'react', 'bind'];
function outerError(prefix, name) {
  error(prefix + ' for "outer" push: ' + $$2(name));
}

function parseSignal(signal, scope) {
  var name = signal.name;

  if (signal.push === OUTER) {
    // signal must already be defined, raise error if not
    if (!scope.signals[name]) outerError('No prior signal definition', name);
    // signal push must not use properties reserved for standard definition
    OUTER_INVALID.forEach(function(prop) {
      if (signal[prop] !== undefined) outerError('Invalid property ', prop);
    });
  } else {
    // define a new signal in the current scope
    var op = scope.addSignal(name, signal.value);
    if (signal.react === false) op.react = false;
    if (signal.bind) scope.addBinding(name, signal.bind);
  }
}

function ASTNode(type) {
  this.type = type;
}

ASTNode.prototype.visit = function(visitor) {
  var node = this, c, i, n;

  if (visitor(node)) return 1;

  for (c=children$1(node), i=0, n=c.length; i<n; ++i) {
    if (c[i].visit(visitor)) return 1;
  }
}

function children$1(node) {
  switch (node.type) {
    case 'ArrayExpression':
      return node.elements;
    case 'BinaryExpression':
    case 'LogicalExpression':
      return [node.left, node.right];
    case 'CallExpression':
      var args = node.arguments.slice();
      args.unshift(node.callee);
      return args;
    case 'ConditionalExpression':
      return [node.test, node.consequent, node.alternate];
    case 'MemberExpression':
      return [node.object, node.property];
    case 'ObjectExpression':
      return node.properties;
    case 'Property':
      return [node.key, node.value];
    case 'UnaryExpression':
      return [node.argument];
    case 'Identifier':
    case 'Literal':
    case 'RawCode':
    default:
      return [];
  }
}

/*
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
var source$1;
var index;
var length;
var lookahead;
var TokenBooleanLiteral = 1;
var TokenEOF = 2;
var TokenIdentifier = 3;
var TokenKeyword = 4;
var TokenNullLiteral = 5;
var TokenNumericLiteral = 6;
var TokenPunctuator = 7;
var TokenStringLiteral = 8;
var SyntaxArrayExpression = 'ArrayExpression';
var SyntaxBinaryExpression = 'BinaryExpression';
var SyntaxCallExpression = 'CallExpression';
var SyntaxConditionalExpression = 'ConditionalExpression';
var SyntaxIdentifier = 'Identifier';
var SyntaxLiteral = 'Literal';
var SyntaxLogicalExpression = 'LogicalExpression';
var SyntaxMemberExpression = 'MemberExpression';
var SyntaxObjectExpression = 'ObjectExpression';
var SyntaxProperty = 'Property';
var SyntaxUnaryExpression = 'UnaryExpression';
var MessageUnexpectedToken = 'Unexpected token %0';
var MessageUnexpectedNumber = 'Unexpected number';
var MessageUnexpectedString = 'Unexpected string';
var MessageUnexpectedIdentifier = 'Unexpected identifier';
var MessageUnexpectedReserved = 'Unexpected reserved word';
var MessageUnexpectedEOS = 'Unexpected end of input';
var MessageInvalidRegExp = 'Invalid regular expression';
var MessageUnterminatedRegExp = 'Invalid regular expression: missing /';
var MessageStrictOctalLiteral = 'Octal literals are not allowed in strict mode.';
var MessageStrictDuplicateProperty = 'Duplicate data property in object literal not allowed in strict mode';
var ILLEGAL = 'ILLEGAL';
var DISABLED = 'Disabled.';
var RegexNonAsciiIdentifierStart = new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]');
var RegexNonAsciiIdentifierPart = new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]');
// Ensure the condition is true, otherwise throw an error.
// This is only to have a better contract semantic, i.e. another safety net
// to catch a logic error. The condition shall be fulfilled in normal case.
// Do NOT use this to enforce a certain condition on any user input.

function assert(condition, message) {
  /* istanbul ignore next */
  if (!condition) {
    throw new Error('ASSERT: ' + message);
  }
}

function isDecimalDigit(ch) {
  return (ch >= 0x30 && ch <= 0x39); // 0..9
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
  return (ch === 0x24) || (ch === 0x5F) || // $ (dollar) and _ (underscore)
    (ch >= 0x41 && ch <= 0x5A) || // A..Z
    (ch >= 0x61 && ch <= 0x7A) || // a..z
    (ch === 0x5C) || // \ (backslash)
    ((ch >= 0x80) && RegexNonAsciiIdentifierStart.test(String.fromCharCode(ch)));
}

function isIdentifierPart(ch) {
  return (ch === 0x24) || (ch === 0x5F) || // $ (dollar) and _ (underscore)
    (ch >= 0x41 && ch <= 0x5A) || // A..Z
    (ch >= 0x61 && ch <= 0x7A) || // a..z
    (ch >= 0x30 && ch <= 0x39) || // 0..9
    (ch === 0x5C) || // \ (backslash)
    ((ch >= 0x80) && RegexNonAsciiIdentifierPart.test(String.fromCharCode(ch)));
}

// 7.6.1.1 Keywords

var keywords$1 = {
  'if':1, 'in':1, 'do':1,
  'var':1, 'for':1, 'new':1, 'try':1, 'let':1,
  'this':1, 'else':1, 'case':1, 'void':1, 'with':1, 'enum':1,
  'while':1, 'break':1, 'catch':1, 'throw':1, 'const':1, 'yield':1, 'class':1, 'super':1,
  'return':1, 'typeof':1, 'delete':1, 'switch':1, 'export':1, 'import':1, 'public':1, 'static':1,
  'default':1, 'finally':1, 'extends':1, 'package':1, 'private':1,
  'function':1, 'continue':1, 'debugger':1,
  'interface':1, 'protected':1,
  'instanceof':1, 'implements':1
};

function skipComment() {
  var ch;

  while (index < length) {
    ch = source$1.charCodeAt(index);

    if (isWhiteSpace(ch) || isLineTerminator(ch)) {
      ++index;
    } else {
      break;
    }
  }
}

function scanHexEscape(prefix) {
  var i, len, ch, code = 0;

  len = (prefix === 'u') ? 4 : 2;
  for (i = 0; i < len; ++i) {
    if (index < length && isHexDigit(source$1[index])) {
      ch = source$1[index++];
      code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
    } else {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
  }
  return String.fromCharCode(code);
}

function scanUnicodeCodePointEscape() {
  var ch, code, cu1, cu2;

  ch = source$1[index];
  code = 0;

  // At least, one hex digit is required.
  if (ch === '}') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  while (index < length) {
    ch = source$1[index++];
    if (!isHexDigit(ch)) {
      break;
    }
    code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
  }

  if (code > 0x10FFFF || ch !== '}') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
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

  ch = source$1.charCodeAt(index++);
  id = String.fromCharCode(ch);

  // '\u' (U+005C, U+0075) denotes an escaped character.
  if (ch === 0x5C) {
    if (source$1.charCodeAt(index) !== 0x75) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
    ++index;
    ch = scanHexEscape('u');
    if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
    id = ch;
  }

  while (index < length) {
    ch = source$1.charCodeAt(index);
    if (!isIdentifierPart(ch)) {
      break;
    }
    ++index;
    id += String.fromCharCode(ch);

    // '\u' (U+005C, U+0075) denotes an escaped character.
    if (ch === 0x5C) {
      id = id.substr(0, id.length - 1);
      if (source$1.charCodeAt(index) !== 0x75) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
      ++index;
      ch = scanHexEscape('u');
      if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
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
    ch = source$1.charCodeAt(index);
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

  return source$1.slice(start, index);
}

function scanIdentifier() {
  var start, id, type;

  start = index;

  // Backslash (U+005C) starts an escaped character.
  id = (source$1.charCodeAt(index) === 0x5C) ? getEscapedIdentifier() : getIdentifier();

  // There is no keyword or literal with only one character.
  // Thus, it must be an identifier.
  if (id.length === 1) {
    type = TokenIdentifier;
  } else if (keywords$1.hasOwnProperty(id)) {
    type = TokenKeyword;
  } else if (id === 'null') {
    type = TokenNullLiteral;
  } else if (id === 'true' || id === 'false') {
    type = TokenBooleanLiteral;
  } else {
    type = TokenIdentifier;
  }

  return {
    type: type,
    value: id,
    start: start,
    end: index
  };
}

// 7.7 Punctuators

function scanPunctuator() {
  var start = index,
    code = source$1.charCodeAt(index),
    code2,
    ch1 = source$1[index],
    ch2,
    ch3,
    ch4;

  switch (code) {

    // Check for most common single-character punctuators.
    case 0x2E: // . dot
    case 0x28: // ( open bracket
    case 0x29: // ) close bracket
    case 0x3B: // ; semicolon
    case 0x2C: // , comma
    case 0x7B: // { open curly brace
    case 0x7D: // } close curly brace
    case 0x5B: // [
    case 0x5D: // ]
    case 0x3A: // :
    case 0x3F: // ?
    case 0x7E: // ~
      ++index;
      return {
        type: TokenPunctuator,
        value: String.fromCharCode(code),
        start: start,
        end: index
      };

    default:
      code2 = source$1.charCodeAt(index + 1);

      // '=' (U+003D) marks an assignment or comparison operator.
      if (code2 === 0x3D) {
        switch (code) {
          case 0x2B: // +
          case 0x2D: // -
          case 0x2F: // /
          case 0x3C: // <
          case 0x3E: // >
          case 0x5E: // ^
          case 0x7C: // |
          case 0x25: // %
          case 0x26: // &
          case 0x2A: // *
            index += 2;
            return {
              type: TokenPunctuator,
              value: String.fromCharCode(code) + String.fromCharCode(code2),
              start: start,
              end: index
            };

          case 0x21: // !
          case 0x3D: // =
            index += 2;

            // !== and ===
            if (source$1.charCodeAt(index) === 0x3D) {
              ++index;
            }
            return {
              type: TokenPunctuator,
              value: source$1.slice(start, index),
              start: start,
              end: index
            };
        }
      }
  }

  // 4-character punctuator: >>>=

  ch4 = source$1.substr(index, 4);

  if (ch4 === '>>>=') {
    index += 4;
    return {
      type: TokenPunctuator,
      value: ch4,
      start: start,
      end: index
    };
  }

  // 3-character punctuators: === !== >>> <<= >>=

  ch3 = ch4.substr(0, 3);

  if (ch3 === '>>>' || ch3 === '<<=' || ch3 === '>>=') {
    index += 3;
    return {
      type: TokenPunctuator,
      value: ch3,
      start: start,
      end: index
    };
  }

  // Other 2-character punctuators: ++ -- << >> && ||
  ch2 = ch3.substr(0, 2);

  if ((ch1 === ch2[1] && ('+-<>&|'.indexOf(ch1) >= 0)) || ch2 === '=>') {
    index += 2;
    return {
      type: TokenPunctuator,
      value: ch2,
      start: start,
      end: index
    };
  }

  // 1-character punctuators: < > = ! + - * % & | ^ /

  if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
    ++index;
    return {
      type: TokenPunctuator,
      value: ch1,
      start: start,
      end: index
    };
  }

  throwError({}, MessageUnexpectedToken, ILLEGAL);
}

// 7.8.3 Numeric Literals

function scanHexLiteral(start) {
  var number = '';

  while (index < length) {
    if (!isHexDigit(source$1[index])) {
      break;
    }
    number += source$1[index++];
  }

  if (number.length === 0) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  if (isIdentifierStart(source$1.charCodeAt(index))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenNumericLiteral,
    value: parseInt('0x' + number, 16),
    start: start,
    end: index
  };
}

function scanOctalLiteral(start) {
  var number = '0' + source$1[index++];
  while (index < length) {
    if (!isOctalDigit(source$1[index])) {
      break;
    }
    number += source$1[index++];
  }

  if (isIdentifierStart(source$1.charCodeAt(index)) || isDecimalDigit(source$1.charCodeAt(index))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenNumericLiteral,
    value: parseInt(number, 8),
    octal: true,
    start: start,
    end: index
  };
}

function scanNumericLiteral() {
  var number, start, ch;

  ch = source$1[index];
  assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
    'Numeric literal must start with a decimal digit or a decimal point');

  start = index;
  number = '';
  if (ch !== '.') {
    number = source$1[index++];
    ch = source$1[index];

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
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
    }

    while (isDecimalDigit(source$1.charCodeAt(index))) {
      number += source$1[index++];
    }
    ch = source$1[index];
  }

  if (ch === '.') {
    number += source$1[index++];
    while (isDecimalDigit(source$1.charCodeAt(index))) {
      number += source$1[index++];
    }
    ch = source$1[index];
  }

  if (ch === 'e' || ch === 'E') {
    number += source$1[index++];

    ch = source$1[index];
    if (ch === '+' || ch === '-') {
      number += source$1[index++];
    }
    if (isDecimalDigit(source$1.charCodeAt(index))) {
      while (isDecimalDigit(source$1.charCodeAt(index))) {
        number += source$1[index++];
      }
    } else {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
  }

  if (isIdentifierStart(source$1.charCodeAt(index))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenNumericLiteral,
    value: parseFloat(number),
    start: start,
    end: index
  };
}

// 7.8.4 String Literals

function scanStringLiteral() {
  var str = '',
    quote, start, ch, code, octal = false;

  quote = source$1[index];
  assert((quote === '\'' || quote === '"'),
    'String literal must starts with a quote');

  start = index;
  ++index;

  while (index < length) {
    ch = source$1[index++];

    if (ch === quote) {
      quote = '';
      break;
    } else if (ch === '\\') {
      ch = source$1[index++];
      if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
        switch (ch) {
          case 'u':
          case 'x':
            if (source$1[index] === '{') {
              ++index;
              str += scanUnicodeCodePointEscape();
            } else {
              str += scanHexEscape(ch);
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

              if (index < length && isOctalDigit(source$1[index])) {
                octal = true;
                code = code * 8 + '01234567'.indexOf(source$1[index++]);

                // 3 digits are only allowed when string starts
                // with 0, 1, 2, 3
                if ('0123'.indexOf(ch) >= 0 &&
                  index < length &&
                  isOctalDigit(source$1[index])) {
                  code = code * 8 + '01234567'.indexOf(source$1[index++]);
                }
              }
              str += String.fromCharCode(code);
            } else {
              str += ch;
            }
            break;
        }
      } else {
        if (ch === '\r' && source$1[index] === '\n') {
          ++index;
        }
      }
    } else if (isLineTerminator(ch.charCodeAt(0))) {
      break;
    } else {
      str += ch;
    }
  }

  if (quote !== '') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenStringLiteral,
    value: str,
    octal: octal,
    start: start,
    end: index
  };
}

function testRegExp(pattern, flags) {
  var tmp = pattern;

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
      .replace(/\\u\{([0-9a-fA-F]+)\}/g, function($0, $1) {
        if (parseInt($1, 16) <= 0x10FFFF) {
          return 'x';
        }
        throwError({}, MessageInvalidRegExp);
      })
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, 'x');
  }

  // First, detect invalid regular expressions.
  try {
    new RegExp(tmp);
  } catch (e) {
    throwError({}, MessageInvalidRegExp);
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

  ch = source$1[index];
  assert(ch === '/', 'Regular expression literal must start with a slash');
  str = source$1[index++];

  classMarker = false;
  terminated = false;
  while (index < length) {
    ch = source$1[index++];
    str += ch;
    if (ch === '\\') {
      ch = source$1[index++];
      // ECMA-262 7.8.5
      if (isLineTerminator(ch.charCodeAt(0))) {
        throwError({}, MessageUnterminatedRegExp);
      }
      str += ch;
    } else if (isLineTerminator(ch.charCodeAt(0))) {
      throwError({}, MessageUnterminatedRegExp);
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
    throwError({}, MessageUnterminatedRegExp);
  }

  // Exclude leading and trailing slash.
  body = str.substr(1, str.length - 2);
  return {
    value: body,
    literal: str
  };
}

function scanRegExpFlags() {
  var ch, str, flags;

  str = '';
  flags = '';
  while (index < length) {
    ch = source$1[index];
    if (!isIdentifierPart(ch.charCodeAt(0))) {
      break;
    }

    ++index;
    if (ch === '\\' && index < length) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    } else {
      flags += ch;
      str += ch;
    }
  }

  if (flags.search(/[^gimuy]/g) >= 0) {
    throwError({}, MessageInvalidRegExp, flags);
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

function isIdentifierName(token) {
  return token.type === TokenIdentifier ||
    token.type === TokenKeyword ||
    token.type === TokenBooleanLiteral ||
    token.type === TokenNullLiteral;
}

function advance() {
  var ch;

  skipComment();

  if (index >= length) {
    return {
      type: TokenEOF,
      start: index,
      end: index
    };
  }

  ch = source$1.charCodeAt(index);

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
    if (isDecimalDigit(source$1.charCodeAt(index + 1))) {
      return scanNumericLiteral();
    }
    return scanPunctuator();
  }

  if (isDecimalDigit(ch)) {
    return scanNumericLiteral();
  }

  return scanPunctuator();
}

function lex() {
  var token;

  token = lookahead;
  index = token.end;

  lookahead = advance();

  index = token.end;

  return token;
}

function peek$1() {
  var pos;

  pos = index;

  lookahead = advance();
  index = pos;
}

function finishArrayExpression(elements) {
  var node = new ASTNode(SyntaxArrayExpression);
  node.elements = elements;
  return node;
}

function finishBinaryExpression(operator, left, right) {
  var node = new ASTNode((operator === '||' || operator === '&&') ? SyntaxLogicalExpression : SyntaxBinaryExpression);
  node.operator = operator;
  node.left = left;
  node.right = right;
  return node;
}

function finishCallExpression(callee, args) {
  var node = new ASTNode(SyntaxCallExpression);
  node.callee = callee;
  node.arguments = args;
  return node;
}

function finishConditionalExpression(test, consequent, alternate) {
  var node = new ASTNode(SyntaxConditionalExpression);
  node.test = test;
  node.consequent = consequent;
  node.alternate = alternate;
  return node;
}

function finishIdentifier(name) {
  var node = new ASTNode(SyntaxIdentifier);
  node.name = name;
  return node;
}

function finishLiteral(token) {
  var node = new ASTNode(SyntaxLiteral);
  node.value = token.value;
  node.raw = source$1.slice(token.start, token.end);
  if (token.regex) {
    if (node.raw === '//') {
      node.raw = '/(?:)/';
    }
    node.regex = token.regex;
  }
  return node;
}

function finishMemberExpression(accessor, object, property) {
  var node = new ASTNode(SyntaxMemberExpression);
  node.computed = accessor === '[';
  node.object = object;
  node.property = property;
  if (!node.computed) property.member = true;
  return node;
}

function finishObjectExpression(properties) {
  var node = new ASTNode(SyntaxObjectExpression);
  node.properties = properties;
  return node;
}

function finishProperty(kind, key, value) {
  var node = new ASTNode(SyntaxProperty);
  node.key = key;
  node.value = value;
  node.kind = kind;
  return node;
}

function finishUnaryExpression(operator, argument) {
  var node = new ASTNode(SyntaxUnaryExpression);
  node.operator = operator;
  node.argument = argument;
  node.prefix = true;
  return node;
}

// Throw an exception

function throwError(token, messageFormat) {
  var error,
    args = Array.prototype.slice.call(arguments, 2),
    msg = messageFormat.replace(
      /%(\d)/g,
      function(whole, index) {
        assert(index < args.length, 'Message reference must be in range');
        return args[index];
      }
    );


  error = new Error(msg);
  error.index = index;
  error.description = msg;
  throw error;
}

// Throw an exception because of the token.

function throwUnexpected(token) {
  if (token.type === TokenEOF) {
    throwError(token, MessageUnexpectedEOS);
  }

  if (token.type === TokenNumericLiteral) {
    throwError(token, MessageUnexpectedNumber);
  }

  if (token.type === TokenStringLiteral) {
    throwError(token, MessageUnexpectedString);
  }

  if (token.type === TokenIdentifier) {
    throwError(token, MessageUnexpectedIdentifier);
  }

  if (token.type === TokenKeyword) {
    throwError(token, MessageUnexpectedReserved);
  }

  // BooleanLiteral, NullLiteral, or Punctuator.
  throwError(token, MessageUnexpectedToken, token.value);
}

// Expect the next token to match the specified punctuator.
// If not, an exception will be thrown.

function expect(value) {
  var token = lex();
  if (token.type !== TokenPunctuator || token.value !== value) {
    throwUnexpected(token);
  }
}

// Return true if the next token matches the specified punctuator.

function match(value) {
  return lookahead.type === TokenPunctuator && lookahead.value === value;
}

// Return true if the next token matches the specified keyword

function matchKeyword(keyword) {
  return lookahead.type === TokenKeyword && lookahead.value === keyword;
}

// 11.1.4 Array Initialiser

function parseArrayInitialiser() {
  var elements = [];

  index = lookahead.start;
  expect('[');

  while (!match(']')) {
    if (match(',')) {
      lex();
      elements.push(null);
    } else {
      elements.push(parseConditionalExpression());

      if (!match(']')) {
        expect(',');
      }
    }
  }

  lex();

  return finishArrayExpression(elements);
}

// 11.1.5 Object Initialiser

function parseObjectPropertyKey() {
  var token;

  index = lookahead.start;
  token = lex();

  // Note: This function is called only from parseObjectProperty(), where
  // EOF and Punctuator tokens are already filtered out.

  if (token.type === TokenStringLiteral || token.type === TokenNumericLiteral) {
    if (token.octal) {
      throwError(token, MessageStrictOctalLiteral);
    }
    return finishLiteral(token);
  }

  return finishIdentifier(token.value);
}

function parseObjectProperty() {
  var token, key, id, value;

  index = lookahead.start;
  token = lookahead;

  if (token.type === TokenIdentifier) {
    id = parseObjectPropertyKey();
    expect(':');
    value = parseConditionalExpression();
    return finishProperty('init', id, value);
  }
  if (token.type === TokenEOF || token.type === TokenPunctuator) {
    throwUnexpected(token);
  } else {
    key = parseObjectPropertyKey();
    expect(':');
    value = parseConditionalExpression();
    return finishProperty('init', key, value);
  }
}

function parseObjectInitialiser() {
  var properties = [],
    property, name, key, map = {},
    toString = String;

  index = lookahead.start;
  expect('{');

  while (!match('}')) {
    property = parseObjectProperty();

    if (property.key.type === SyntaxIdentifier) {
      name = property.key.name;
    } else {
      name = toString(property.key.value);
    }

    key = '$' + name;
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      throwError({}, MessageStrictDuplicateProperty);
    } else {
      map[key] = true;
    }

    properties.push(property);

    if (!match('}')) {
      expect(',');
    }
  }

  expect('}');

  return finishObjectExpression(properties);
}

// 11.1.6 The Grouping Operator

function parseGroupExpression() {
  var expr;

  expect('(');

  expr = parseExpression$1();

  expect(')');

  return expr;
}


// 11.1 Primary Expressions

var legalKeywords = {
  "if": 1,
  "this": 1
};

function parsePrimaryExpression() {
  var type, token, expr;

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
  index = lookahead.start;


  if (type === TokenIdentifier || legalKeywords[lookahead.value]) {
    expr = finishIdentifier(lex().value);
  } else if (type === TokenStringLiteral || type === TokenNumericLiteral) {
    if (lookahead.octal) {
      throwError(lookahead, MessageStrictOctalLiteral);
    }
    expr = finishLiteral(lex());
  } else if (type === TokenKeyword) {
    throw new Error(DISABLED);
  } else if (type === TokenBooleanLiteral) {
    token = lex();
    token.value = (token.value === 'true');
    expr = finishLiteral(token);
  } else if (type === TokenNullLiteral) {
    token = lex();
    token.value = null;
    expr = finishLiteral(token);
  } else if (match('/') || match('/=')) {
    expr = finishLiteral(scanRegExp());
    peek$1();
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
      args.push(parseConditionalExpression());
      if (match(')')) {
        break;
      }
      expect(',');
    }
  }

  expect(')');

  return args;
}

function parseNonComputedProperty() {
  var token;
  index = lookahead.start;
  token = lex();

  if (!isIdentifierName(token)) {
    throwUnexpected(token);
  }

  return finishIdentifier(token.value);
}

function parseNonComputedMember() {
  expect('.');

  return parseNonComputedProperty();
}

function parseComputedMember() {
  var expr;

  expect('[');

  expr = parseExpression$1();

  expect(']');

  return expr;
}

function parseLeftHandSideExpressionAllowCall() {
  var expr, args, property;

  expr = parsePrimaryExpression();

  for (;;) {
    if (match('.')) {
      property = parseNonComputedMember();
      expr = finishMemberExpression('.', expr, property);
    } else if (match('(')) {
      args = parseArguments();
      expr = finishCallExpression(expr, args);
    } else if (match('[')) {
      property = parseComputedMember();
      expr = finishMemberExpression('[', expr, property);
    } else {
      break;
    }
  }

  return expr;
}

// 11.3 Postfix Expressions

function parsePostfixExpression() {
  var expr = parseLeftHandSideExpressionAllowCall();

  if (lookahead.type === TokenPunctuator) {
    if ((match('++') || match('--'))) {
      throw new Error(DISABLED);
    }
  }

  return expr;
}

// 11.4 Unary Operators

function parseUnaryExpression() {
  var token, expr;

  if (lookahead.type !== TokenPunctuator && lookahead.type !== TokenKeyword) {
    expr = parsePostfixExpression();
  } else if (match('++') || match('--')) {
    throw new Error(DISABLED);
  } else if (match('+') || match('-') || match('~') || match('!')) {
    token = lex();
    expr = parseUnaryExpression();
    expr = finishUnaryExpression(token.value, expr);
  } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
    throw new Error(DISABLED);
  } else {
    expr = parsePostfixExpression();
  }

  return expr;
}

function binaryPrecedence(token) {
  var prec = 0;

  if (token.type !== TokenPunctuator && token.type !== TokenKeyword) {
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
    case 'in':
      prec = 7;
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
  prec = binaryPrecedence(token);
  if (prec === 0) {
    return left;
  }
  token.prec = prec;
  lex();

  markers = [marker, lookahead];
  right = parseUnaryExpression();

  stack = [left, token, right];

  while ((prec = binaryPrecedence(lookahead)) > 0) {

    // Reduce: make a binary expression from the three topmost entries.
    while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
      right = stack.pop();
      operator = stack.pop().value;
      left = stack.pop();
      markers.pop();
      expr = finishBinaryExpression(operator, left, right);
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
    markers.pop()
    expr = finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
    i -= 2;
  }

  return expr;
}

// 11.12 Conditional Operator

function parseConditionalExpression() {
  var expr, consequent, alternate;

  expr = parseBinaryExpression();

  if (match('?')) {
    lex();
    consequent = parseConditionalExpression();
    expect(':');
    alternate = parseConditionalExpression();

    expr = finishConditionalExpression(expr, consequent, alternate);
  }

  return expr;
}

// 11.14 Comma Operator

function parseExpression$1() {
  var expr = parseConditionalExpression();

  if (match(',')) {
    throw new Error(DISABLED); // no sequence expressions
  }

  return expr;
}

function parse$3(code) {
  source$1 = code;
  index = 0;
  length = source$1.length;
  lookahead = null;

  peek$1();

  var expr = parseExpression$1();

  if (lookahead.type !== TokenEOF) {
    throw new Error("Unexpect token after expression.");
  }
  return expr;
}

var Constants = {
  NaN:     'NaN',
  E:       'Math.E',
  LN2:     'Math.LN2',
  LN10:    'Math.LN10',
  LOG2E:   'Math.LOG2E',
  LOG10E:  'Math.LOG10E',
  PI:      'Math.PI',
  SQRT1_2: 'Math.SQRT1_2',
  SQRT2:   'Math.SQRT2'
};

function Functions(codegen) {

  function fncall(name, args, cast, type) {
    var obj = codegen(args[0]);
    if (cast) {
      obj = cast + '(' + obj + ')';
      if (cast.lastIndexOf('new ', 0) === 0) obj = '(' + obj + ')';
    }
    return obj + '.' + name + (type < 0 ? '' : type === 0 ?
      '()' :
      '(' + args.slice(1).map(codegen).join(',') + ')');
  }

  function fn(name, cast, type) {
    return function(args) {
      return fncall(name, args, cast, type);
    };
  }

  var DATE = 'new Date',
      STRING = 'String',
      REGEXP = 'RegExp';

  return {
    // MATH functions
    isNaN:    'isNaN',
    isFinite: 'isFinite',
    abs:      'Math.abs',
    acos:     'Math.acos',
    asin:     'Math.asin',
    atan:     'Math.atan',
    atan2:    'Math.atan2',
    ceil:     'Math.ceil',
    cos:      'Math.cos',
    exp:      'Math.exp',
    floor:    'Math.floor',
    log:      'Math.log',
    max:      'Math.max',
    min:      'Math.min',
    pow:      'Math.pow',
    random:   'Math.random',
    round:    'Math.round',
    sin:      'Math.sin',
    sqrt:     'Math.sqrt',
    tan:      'Math.tan',

    clamp: function(args) {
      if (args.length < 3) error('Missing arguments to clamp function.');
      if (args.length > 3) error('Too many arguments to clamp function.');
      var a = args.map(codegen);
      return 'Math.max('+a[1]+', Math.min('+a[2]+','+a[0]+'))';
    },

    // DATE functions
    now:             'Date.now',
    utc:             'Date.UTC',
    datetime:        DATE,
    date:            fn('getDate', DATE, 0),
    day:             fn('getDay', DATE, 0),
    year:            fn('getFullYear', DATE, 0),
    month:           fn('getMonth', DATE, 0),
    hours:           fn('getHours', DATE, 0),
    minutes:         fn('getMinutes', DATE, 0),
    seconds:         fn('getSeconds', DATE, 0),
    milliseconds:    fn('getMilliseconds', DATE, 0),
    time:            fn('getTime', DATE, 0),
    timezoneoffset:  fn('getTimezoneOffset', DATE, 0),
    utcdate:         fn('getUTCDate', DATE, 0),
    utcday:          fn('getUTCDay', DATE, 0),
    utcyear:         fn('getUTCFullYear', DATE, 0),
    utcmonth:        fn('getUTCMonth', DATE, 0),
    utchours:        fn('getUTCHours', DATE, 0),
    utcminutes:      fn('getUTCMinutes', DATE, 0),
    utcseconds:      fn('getUTCSeconds', DATE, 0),
    utcmilliseconds: fn('getUTCMilliseconds', DATE, 0),

    // shared sequence functions
    length:      fn('length', null, -1),
    indexof:     fn('indexOf', null),
    lastindexof: fn('lastIndexOf', null),
    slice:       fn('slice', null),

    // STRING functions
    parseFloat:  'parseFloat',
    parseInt:    'parseInt',
    upper:       fn('toUpperCase', STRING, 0),
    lower:       fn('toLowerCase', STRING, 0),
    substring:   fn('substring', STRING),
    replace:     fn('replace', STRING),

    // REGEXP functions
    regexp:  REGEXP,
    test:    fn('test', REGEXP),

    // Control Flow functions
    if: function(args) {
        if (args.length < 3) error('Missing arguments to if function.');
        if (args.length > 3) error('Too many arguments to if function.');
        var a = args.map(codegen);
        return '('+a[0]+'?'+a[1]+':'+a[2]+')';
      }
  };
}

function codegen(opt) {
  opt = opt || {};

  var whitelist = opt.whitelist ? toSet(opt.whitelist) : {},
      blacklist = opt.blacklist ? toSet(opt.blacklist) : {},
      constants = opt.constants || Constants,
      functions = (opt.functions || Functions)(visit),
      globalvar = opt.globalvar,
      fieldvar = opt.fieldvar,
      globals = {},
      fields = {},
      memberDepth = 0;

  var outputGlobal = isFunction(globalvar)
    ? globalvar
    : function (id) { return globalvar + '["' + id + '"]'; };

  function visit(ast) {
    if (isString(ast)) return ast;
    var generator = Generators[ast.type];
    if (generator == null) error('Unsupported type: ' + ast.type);
    return generator(ast);
  }

  var Generators = {
    Literal: function(n) {
        return n.raw;
      },

    Identifier: function(n) {
        var id = n.name;
        return memberDepth > 0 ? id
          : blacklist.hasOwnProperty(id) ? error('Illegal identifier: ' + id)
          : constants.hasOwnProperty(id) ? constants[id]
          : whitelist.hasOwnProperty(id) ? id
          : (globals[id] = 1, outputGlobal(id));
      },

    MemberExpression: function(n) {
        var d = !n.computed;
        var o = visit(n.object);
        if (d) memberDepth += 1;
        var p = visit(n.property);
        if (o === fieldvar) { fields[p] = 1; } // HACKish...
        if (d) memberDepth -= 1;
        return o + (d ? '.'+p : '['+p+']');
      },

    CallExpression: function(n) {
        if (n.callee.type !== 'Identifier') {
          error('Illegal callee type: ' + n.callee.type);
        }
        var callee = n.callee.name;
        var args = n.arguments;
        var fn = functions.hasOwnProperty(callee) && functions[callee];
        if (!fn) error('Unrecognized function: ' + callee);
        return isFunction(fn)
          ? fn(args)
          : fn + '(' + args.map(visit).join(',') + ')';
      },

    ArrayExpression: function(n) {
        return '[' + n.elements.map(visit).join(',') + ']';
      },

    BinaryExpression: function(n) {
        return '(' + visit(n.left) + n.operator + visit(n.right) + ')';
      },

    UnaryExpression: function(n) {
        return '(' + n.operator + visit(n.argument) + ')';
      },

    ConditionalExpression: function(n) {
        return '(' + visit(n.test) +
          '?' + visit(n.consequent) +
          ':' + visit(n.alternate) +
          ')';
      },

    LogicalExpression: function(n) {
        return '(' + visit(n.left) + n.operator + visit(n.right) + ')';
      },

    ObjectExpression: function(n) {
        return '{' + n.properties.map(visit).join(',') + '}';
      },

    Property: function(n) {
        memberDepth += 1;
        var k = visit(n.key);
        memberDepth -= 1;
        return k + ':' + visit(n.value);
      }
  };

  function codegen(ast) {
    var result = {
      code:    visit(ast),
      globals: Object.keys(globals),
      fields:  Object.keys(fields)
    };
    globals = {};
    fields = {};
    return result;
  }

  codegen.functions = functions;
  codegen.constants = constants;

  return codegen;
}

function formatter(method) {
  var cache = {};
  return function(_, specifier) {
    var f = cache[specifier] || (cache[specifier] = method(specifier));
    return f(_);
  };
}

var format$1 = formatter(d3Format.format);
var utcFormat$1 = formatter(d3TimeFormat.utcFormat);
var timeFormat$1 = formatter(d3TimeFormat.timeFormat);

var utcParse$1 = formatter(d3TimeFormat.utcParse);
var timeParse$1 = formatter(d3TimeFormat.timeParse);

var dateObj = new Date(2000, 0, 1);

function time(month, day, specifier) {
  dateObj.setMonth(month);
  dateObj.setDate(day);
  return timeFormat$1(dateObj, specifier);
}

function monthFormat(month) {
  return time(month, 1, '%B');
}

function monthAbbrevFormat(month) {
  return time(month, 1, '%b');
}

function dayFormat(day) {
  return time(0, 2 + day, '%A');
}

function dayAbbrevFormat(day) {
  return time(0, 2 + day, '%a');
}

function quarter(date) {
  return 1 + ~~(new Date(date).getMonth() / 3);
}

function utcquarter(date) {
  return 1 + ~~(new Date(date).getUTCMonth() / 3);
}

function log$1(df, method, args) {
  try {
    df[method].apply(df, ['EXPRESSION'].concat([].slice.call(args)));
  } catch (err) {
    df.warn(err);
  }
  return args[args.length-1];
}

function warn() {
  return log$1(this.context.dataflow, 'warn', arguments);
}

function info() {
  return log$1(this.context.dataflow, 'info', arguments);
}

function debug() {
  return log$1(this.context.dataflow, 'debug', arguments);
}

function inScope(item) {
  var group = this.context.group,
      value = false;

  if (group) while (item) {
    if (item === group) { value = true; break; }
    item = item.mark.group;
  }
  return value;
}

/**
 * Span-preserving range clamp. If the span of the input range is less
 * than (max - min) and an endpoint exceeds either the min or max value,
 * the range is translated such that the span is preserved and one
 * endpoint touches the boundary of the min/max range.
 * If the span exceeds (max - min), the range [min, max] is returned.
 */
function clampRange(range, min, max) {
  var lo = range[0],
      hi = range[1],
      span;

  if (hi < lo) span = hi, hi = lo, lo = span;
  span = hi - lo;

  return span >= (max - min)
    ? [min, max]
    : [
        Math.min(Math.max(lo, min), max - span),
        Math.min(Math.max(hi, span), max)
      ];
}

function pinchDistance() {
  return 'Math.sqrt('
    + 'Math.pow(event.touches[0].clientX - event.touches[1].clientX, 2) + '
    + 'Math.pow(event.touches[0].clientY - event.touches[1].clientY, 2)'
    + ')';
}

function pinchAngle() {
  return 'Math.atan2('
    + 'event.touches[1].clientY - event.touches[0].clientY,'
    + 'event.touches[1].clientX - event.touches[0].clientX'
    + ')';
}

var _window = (typeof window !== 'undefined' && window) || null;

function open(uri, name) {
  var df = this.context.dataflow;
  if (_window && _window.open) {
    df.loader().sanitize(uri, {context:'open', name:name})
      .then(function(url) { _window.open(url, name); })
      .catch(function(e) { df.warn('Open url failed: ' + e); });
  } else {
    df.warn('Open function can only be invoked in a browser.');
  }
}

function screen() {
  return _window ? _window.screen : {};
}

function windowsize() {
  return _window
    ? [_window.innerWidth, _window.innerHeight]
    : [undefined, undefined];
}

function span(array) {
  return (array[array.length-1] - array[0]) || 0;
}

var Literal = 'Literal';
var Identifier = 'Identifier';

var indexPrefix  = '@';
var scalePrefix  = '%';
var dataPrefix   = ':';

function getScale(name, ctx) {
  var s;
  return isFunction(name) ? name
    : isString(name) ? (s = ctx.scales[name]) && s.value
    : undefined;
}

function addScaleDependency(scope, params, name) {
  var scaleName = scalePrefix + name;
  if (!params.hasOwnProperty(scaleName)) {
    try {
      params[scaleName] = scope.scaleRef(name);
    } catch (err) {
      // TODO: error handling? warning?
    }
  }
}

function scaleVisitor(name, args, scope, params) {
  if (args[0].type === Literal) {
    // add scale dependency
    addScaleDependency(scope, params, args[0].value);
  }
  else if (args[0].type === Identifier) {
    // indirect scale lookup; add all scales as parameters
    for (name in scope.scales) {
      addScaleDependency(scope, params, name);
    }
  }
}

function range$2(name, group) {
  var s = getScale(name, (group || this).context);
  return s && s.range ? s.range() : [];
}

function domain(name, group) {
  var s = getScale(name, (group || this).context);
  return s ? s.domain() : [];
}

function bandwidth(name, group) {
  var s = getScale(name, (group || this).context);
  return s && s.bandwidth ? s.bandwidth() : 0;
}

function bandspace(count, paddingInner, paddingOuter) {
  return bandSpace(count || 0, paddingInner || 0, paddingOuter || 0);
}

function copy$1(name, group) {
  var s = getScale(name, (group || this).context);
  return s ? s.copy() : undefined;
}

function scale$2(name, value, group) {
  var s = getScale(name, (group || this).context);
  return s ? s(value) : undefined;
}

function invert(name, range, group) {
  var s = getScale(name, (group || this).context);
  return !s ? undefined
    : isArray(range) ? (s.invertRange || s.invert)(range)
    : (s.invert || s.invertExtent)(range);
}

function scaleGradient(scale, p0, p1, count) {
  var gradient = Gradient(p0, p1),
      stops = scale.domain(),
      min = stops[0],
      max = stops[stops.length-1],
      fraction = scaleFraction(scale, min, max);

  if (scale.ticks) {
    stops = scale.ticks(+count || 15);
    if (min !== stops[0]) stops.unshift(min);
    if (max !== stops[stops.length-1]) stops.push(max);
  }

  for (var i=0, n=stops.length; i<n; ++i) {
    gradient.stop(fraction(stops[i]), scale(stops[i]));
  }

  return gradient;
}

function geoMethod(method) {
  return function(projection, geojson, group) {
    var p = getScale(projection, (group || this).context);
    return p && p.path[method](geojson);
  };
}

var geoArea = geoMethod('area');
var geoBounds = geoMethod('bounds');
var geoCentroid = geoMethod('centroid');

function data$1(name) {
  var data = this.context.data[name];
  return data ? data.values.value : [];
}

function dataVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) {
    error('First argument to data functions must be a string literal.');
  }

  var data = args[0].value,
      dataName = dataPrefix + data;

  if (!params.hasOwnProperty(dataName)) {
    params[dataName] = scope.getData(data).tuplesRef();
  }
}

function indata(name, field, value) {
  var index = this.context.data[name]['index:' + field],
      entry = index ? index.value.get(value) : undefined;
  return entry ? entry.count : entry;
}

function indataVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error('First argument to indata must be a string literal.');
  if (args[1].type !== Literal) error('Second argument to indata must be a string literal.');

  var data = args[0].value,
      field = args[1].value,
      indexName = indexPrefix + field;

  if (!params.hasOwnProperty(indexName)) {
    params[indexName] = scope.getData(data).indataRef(scope, field);
  }
}

var EMPTY = {};

function datum(d) { return d.data; }

function treeNodes(name, context) {
  var tree = data$1.call(context, name);
  return tree.root && tree.root.lookup || EMPTY;
}

function treePath(name, source, target) {
  var nodes = treeNodes(name, this),
      s = nodes[source],
      t = nodes[target];
  return s && t ? s.path(t).map(datum) : undefined;
}

function treeAncestors(name, node) {
  var n = treeNodes(name, this)[node];
  return n ? n.ancestors().map(datum) : undefined;
}

function inrange(value, range) {
  var r0 = range[0], r1 = range[range.length-1], t;
  if (r0 > r1) t = r0, r0 = r1, r1 = t;
  return r0 <= value && value <= r1;
}

function encode(item, name, retval) {
  if (item) {
    var df = this.context.dataflow,
        target = item.mark.source;
    df.pulse(target, df.changeset().encode(item, name));
  }
  return retval !== undefined ? retval : item;
}

function removePredicate(props) {
  return function(_) {
    for (var key in props) {
      if (key !== '_id' && _[key] !== props[key]) return false;
    }
    return true;
  };
}

function modify(name, insert, remove, toggle, modify, values) {
  var df = this.context.dataflow,
      data = this.context.data[name],
      input = data.input,
      changes = data.changes,
      stamp = df.stamp(),
      predicate, key;

  if (df._trigger === false || !(input.value.length || insert || toggle)) {
    // nothing to do!
    return 0;
  }

  if (!changes || changes.stamp < stamp) {
    data.changes = (changes = df.changeset());
    changes.stamp = stamp;
    df.runAfter(function() {
      data.modified = true;
      df.pulse(input, changes).run();
    });
  }

  if (remove) {
    predicate = remove === true ? truthy
      : (isArray(remove) || remove._id != null) ? remove
      : removePredicate(remove);
    changes.remove(predicate);
  }

  if (insert) {
    changes.insert(insert);
  }

  if (toggle) {
    predicate = removePredicate(toggle);
    if (input.value.some(predicate)) {
      changes.remove(predicate);
    } else {
      changes.insert(toggle);
    }
  }

  if (modify) {
    for (key in values) {
      changes.modify(modify, key, values[key]);
    }
  }

  return 1;
}

var UNION = 'union';
var UNIT = 'unit';
var OTHERS = 'others';
function testPoint(datum, entry) {
  var fields = entry.fields,
      values = entry.values,
      getter = entry.getter || (entry.getter = []),
      n = fields.length,
      i = 0;

  for (; i<n; ++i) {
    getter[i] = getter[i] || field(fields[i]);
    if (getter[i](datum) !== values[i]) return false;
  }

  return true;
}

function testInterval(datum, entry) {
  var ivals = entry.intervals,
      n = ivals.length,
      i = 0,
      getter;

  for (; i<n; ++i) {
    getter = ivals[i].getter || (ivals[i].getter = field(ivals[i].field));
    if (ivals[i].extent[0] === ivals[i].extent[1]) return true;
    if (!inrange(getter(datum), ivals[i].extent)) return false;
  }
  return true;
}

/**
 * Tests if a tuple is contained within an interactive selection.
 * @param {string} name - The name of the data set representing the selection.
 * @param {*} unit - A unique key value indicating the current unit chart.
 * @param {object} datum - The tuple to test for inclusion.
 * @param {string} op - The set operation for combining selections.
 *   One of 'intersect' (default) or 'union'.
 * @param {string} scope - The scope within which to resolve the selection.
 *   One of 'all' (default, resolve against active selections across all unit charts),
 *   'unit' (consider only selections in the current unit chart),
 *   'others' (resolve against all units *except* the current unit).
 * @param {function(object,object):boolean} test - A boolean-valued test
 *   predicate for determining selection status within a single unit chart.
 * @return {boolean} - True if the datum is in the selection, false otherwise.
 */
function vlSelection(name, unit, datum, op, scope, test) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      intersect = op !== UNION,
      n = entries.length,
      i = 0,
      entry, b;

  for (; i<n; ++i) {
    entry = entries[i];

    // is the selection entry from the current unit?
    b = unit === entry.unit;

    // perform test if source unit is a valid selection source
    if (!(scope === OTHERS && b || scope === UNIT && !b)) {
      b = test(datum, entry);

      // if we find a match and we don't require intersection return true
      // if we find a miss and we do require intersection return false
      if (intersect ^ b) return b;
    }
  }

  // if intersecting and we made it here, then we saw no misses
  // if not intersecting, then we saw no matches
  // if no active selections, return true
  return !n || intersect;
}

// Assumes point selection tuples are of the form:
// {unit: string, encodings: array<string>, fields: array<string>, values: array<*>, }
function vlPoint(name, unit, datum, op, scope) {
  return vlSelection.call(this, name, unit, datum, op, scope, testPoint);
}

// Assumes interval selection typles are of the form:
// {unit: string, intervals: array<{encoding: string, field:string, extent:array<number>}>}
function vlInterval(name, unit, datum, op, scope) {
  return vlSelection.call(this, name, unit, datum, op, scope, testInterval);
}

/**
 * Materializes a point selection as a scale domain. With point selections,
 * we assume that they are projected over a single field or encoding channel.
 * @param {string} name - The name of the dataset representing the selection.
 * @param {string} [encoding] - A particular encoding channel to materialize.
 * @param {string} [field] - A particular field to materialize.
 * @param {string} [op='intersect'] - The set operation for combining selections.
 * One of 'intersect' (default) or 'union'.
 * @returns {array} An array of values to serve as a scale domain.
 */
function vlPointDomain(name, encoding, field, op) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      units = {}, count = 0,
      values = {}, domain = [],
      i = 0, n = entries.length,
      entry, unit, v, key;

  for (; i<n; ++i) {
    entry = entries[i];
    unit  = entry.unit;
    key   = entry.values[0];

    if (!units[unit]) units[unit] = ++count;

    if ((encoding && entry.encodings[0] === encoding) ||
        (field && entry.fields[0] === field))
    {
      if (!(v = values[key])) {
        values[key] = v = {value: key, units: {}, count: 0};
      }
      if (!v.units[unit]) v.units[unit] = ++v.count;
    }
  }

  for (key in values) {
    if (op !== UNION && (v = values[key]).count !== count) continue;
    domain.push(v.value);
  }

  return domain.length ? domain : undefined;
}

/**
 * Materializes an interval selection as a scale domain.
 * @param {string} name - The name of the dataset representing the selection.
 * @param {string} [encoding] - A particular encoding channel to materialize.
 * @param {string} [field] - A particular field to materialize.
 * @param {string} [op='intersect'] - The set operation for combining selections.
 * One of 'intersect' (default) or 'union'.
 * @returns {array} An array of values to serve as a scale domain.
 */
function vlIntervalDomain(name, encoding, field, op) {
  var merge = op === UNION ? unionInterval : intersectInterval,
      data = this.context.data[name],
      entries = data ? data.values.value : [],
      i = 0, n = entries.length,
      entry, m, j, interval, extent, domain, lo, hi;

  for (; i<n; ++i) {
    entry = entries[i].intervals;

    for (j=0, m=entry.length; j<m; ++j) {
      interval = entry[j];
      if ((encoding && interval.encoding === encoding) ||
          (field && interval.field === field))
      {
        extent = interval.extent, lo = extent[0], hi = extent[1];
        if (lo > hi) hi = extent[1], lo = extent[0];
        domain = domain ? merge(domain, lo, hi) : [lo, hi];
      }
    }
  }

  return domain && domain.length && (+domain[0] !== +domain[1])
    ? domain
    : undefined;
}

function unionInterval(domain, lo, hi) {
  if (domain[0] > lo) domain[0] = lo;
  if (domain[1] < hi) domain[1] = hi;
  return domain;
}

function intersectInterval(domain, lo, hi) {
  if (hi < domain[0] || domain[1] < lo) {
    return [];
  } else {
    if (domain[0] < lo) domain[0] = lo;
    if (domain[1] > hi) domain[1] = hi;
  }
  return domain;
}

// Expression function context object
var functionContext = {
  isArray: isArray,
  isBoolean: isBoolean,
  isDate: isDate,
  isNumber: isNumber,
  isObject: isObject,
  isRegExp: isRegExp,
  isString: isString,
  toBoolean: toBoolean,
  toDate: toDate,
  toNumber: toNumber,
  toString: toString,
  pad: pad,
  truncate: truncate,
  rgb: d3Color.rgb,
  lab: d3Color.lab,
  hcl: d3Color.hcl,
  hsl: d3Color.hsl,
  sequence: d3Array.range,
  format: format$1,
  utcFormat: utcFormat$1,
  utcParse: utcParse$1,
  timeFormat: timeFormat$1,
  timeParse: timeParse$1,
  monthFormat: monthFormat,
  monthAbbrevFormat: monthAbbrevFormat,
  dayFormat: dayFormat,
  dayAbbrevFormat: dayAbbrevFormat,
  quarter: quarter,
  utcquarter: utcquarter,
  warn: warn,
  info: info,
  debug: debug,
  inScope: inScope,
  clampRange: clampRange,
  pinchDistance: pinchDistance,
  pinchAngle: pinchAngle,
  open: open,
  screen: screen,
  windowsize: windowsize,
  span: span,
  bandspace: bandspace,
  inrange: inrange,
  encode: encode,
  modify: modify
};

var eventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'];
var eventPrefix = 'event.vega.';
var thisPrefix = 'this.';
var astVisitors = {};
// AST visitors for dependency analysis

function expressionFunction(name, fn, visitor) {
  if (arguments.length === 1) {
    return functionContext[name];
  }

  // register with the functionContext
  functionContext[name] = fn;

  // if there is an astVisitor register that, too
  if (visitor) astVisitors[name] = visitor;

  // if the code generator has already been initialized,
  // we need to also register the function with it
  if (codeGenerator) codeGenerator.functions[name] = thisPrefix + name;
  return this;
}

// register expression functions with ast visitors
expressionFunction('bandwidth', bandwidth, scaleVisitor);
expressionFunction('copy', copy$1, scaleVisitor);
expressionFunction('domain', domain, scaleVisitor);
expressionFunction('range', range$2, scaleVisitor);
expressionFunction('invert', invert, scaleVisitor);
expressionFunction('scale', scale$2, scaleVisitor);
expressionFunction('gradient', scaleGradient, scaleVisitor);
expressionFunction('geoArea', geoArea, scaleVisitor);
expressionFunction('geoBounds', geoBounds, scaleVisitor);
expressionFunction('geoCentroid', geoCentroid, scaleVisitor);
expressionFunction('indata', indata, indataVisitor);
expressionFunction('data', data$1, dataVisitor);
expressionFunction('vlPoint', vlPoint, dataVisitor);
expressionFunction('vlInterval', vlInterval, dataVisitor);
expressionFunction('vlPointDomain', vlPointDomain, dataVisitor);
expressionFunction('vlIntervalDomain', vlIntervalDomain, dataVisitor);
expressionFunction('treePath', treePath, dataVisitor);
expressionFunction('treeAncestors', treeAncestors, dataVisitor);

// Build expression function registry
function buildFunctions(codegen) {
  var fn = Functions(codegen);
  eventFunctions.forEach(function(name) { fn[name] = eventPrefix + name; });
  for (var name in functionContext) { fn[name] = thisPrefix + name; }
  return fn;
}

// Export code generator and parameters
var codegenParams = {
  blacklist:  ['_'],
  whitelist:  ['datum', 'event', 'item'],
  fieldvar:   'datum',
  globalvar:  function(id) { return '_[' + $$2('$' + id) + ']'; },
  functions:  buildFunctions,
  constants:  Constants,
  visitors:   astVisitors
};

var codeGenerator = codegen(codegenParams);

var signalPrefix = '$';

function parseExpression(expr, scope, preamble) {
  var params = {}, ast, gen;

  // parse the expression to an abstract syntax tree (ast)
  try {
    ast = parse$3(expr);
  } catch (err) {
    error('Expression parse error: ' + $$2(expr));
  }

  // analyze ast function calls for dependencies
  ast.visit(function visitor(node) {
    if (node.type !== 'CallExpression') return;
    var name = node.callee.name,
        visit = codegenParams.visitors[name];
    if (visit) visit(name, node.arguments, scope, params);
  });

  // perform code generation
  gen = codeGenerator(ast);

  // collect signal dependencies
  gen.globals.forEach(function(name) {
    var signalName = signalPrefix + name;
    if (!params.hasOwnProperty(signalName) && scope.getSignal(name)) {
      params[signalName] = scope.signalRef(name);
    }
  });

  // return generated expression code and dependencies
  return {
    $expr:   preamble ? preamble + 'return(' + gen.code + ');' : gen.code,
    $fields: gen.fields,
    $params: params
  };
}

var VIEW$1 = 'view';
var SCOPE = 'scope';
function parseStream(stream, scope) {
  return stream.signal
    ? scope.getSignal(stream.signal).id
    : parseStream$1(stream, scope);
}

function eventSource(source) {
   return source === SCOPE ? VIEW$1 : (source || VIEW$1);
}

function parseStream$1(stream, scope) {
  var method = stream.merge ? mergeStream
    : stream.stream ? nestedStream
    : stream.type ? eventStream
    : error('Invalid stream specification: ' + $$2(stream));

  return method(stream, scope);
}

function mergeStream(stream, scope) {
  var list = stream.merge.map(function(s) {
    return parseStream$1(s, scope);
  });

  var entry = streamParameters({merge: list}, stream, scope);
  return scope.addStream(entry).id;
}

function nestedStream(stream, scope) {
  var id = parseStream$1(stream.stream, scope),
      entry = streamParameters({stream: id}, stream, scope);
  return scope.addStream(entry).id;
}

function eventStream(stream, scope) {
  var id = scope.event(eventSource(stream.source), stream.type),
      entry = streamParameters({stream: id}, stream, scope);
  return Object.keys(entry).length === 1 ? id
    : scope.addStream(entry).id;
}

function streamParameters(entry, stream, scope) {
  var param = stream.between;

  if (param) {
    if (param.length !== 2) {
      error('Stream "between" parameter must have 2 entries: ' + $$2(stream));
    }
    entry.between = [
      parseStream$1(param[0], scope),
      parseStream$1(param[1], scope)
    ];
  }

  param = stream.filter ? array(stream.filter) : [];
  if (stream.marktype || stream.markname || stream.markrole) {
    // add filter for mark type, name and/or role
    param.push(filterMark(stream.marktype, stream.markname, stream.markrole));
  }
  if (stream.source === SCOPE) {
    // add filter to limit events from sub-scope only
    param.push('inScope(event.item)');
  }
  if (param.length) {
    entry.filter = parseExpression('(' + param.join(')&&(') + ')').$expr;
  }

  if ((param = stream.throttle) != null) {
    entry.throttle = +param;
  }

  if ((param = stream.debounce) != null) {
    entry.debounce = +param;
  }

  if (stream.consume) {
    entry.consume = true;
  }

  return entry;
}

function filterMark(type, name, role) {
  var item = 'event.item';
  return item
    + (type && type !== '*' ? '&&' + item + '.mark.marktype===\'' + type + '\'' : '')
    + (role ? '&&' + item + '.mark.role===\'' + role + '\'' : '')
    + (name ? '&&' + item + '.mark.name===\'' + name + '\'' : '');
}

/**
 * Parse an event selector string.
 * Returns an array of event stream definitions.
 */
function selector(selector, source, marks) {
  DEFAULT_SOURCE = source || VIEW$2;
  MARKS = marks || DEFAULT_MARKS;
  return parseMerge(selector.trim()).map(parseSelector);
}

var VIEW$2    = 'view';
var LBRACK  = '[';
var RBRACK  = ']';
var LBRACE  = '{';
var RBRACE  = '}';
var COLON   = ':';
var COMMA   = ',';
var NAME    = '@';
var GT      = '>';
var ILLEGAL$1 = /[\[\]\{\}]/;
var DEFAULT_SOURCE;
var MARKS;
var DEFAULT_MARKS = {
      '*': 1,
      arc: 1,
      area: 1,
      group: 1,
      image: 1,
      line: 1,
      path: 1,
      rect: 1,
      rule: 1,
      shape: 1,
      symbol: 1,
      text: 1,
      trail: 1
    };
function isMarkType(type) {
  return MARKS.hasOwnProperty(type);
}

function find(s, i, endChar, pushChar, popChar) {
  var count = 0,
      n = s.length,
      c;
  for (; i<n; ++i) {
    c = s[i];
    if (!count && c === endChar) return i;
    else if (popChar && popChar.indexOf(c) >= 0) --count;
    else if (pushChar && pushChar.indexOf(c) >= 0) ++count;
  }
  return i;
}

function parseMerge(s) {
  var output = [],
      start = 0,
      n = s.length,
      i = 0;

  while (i < n) {
    i = find(s, i, COMMA, LBRACK + LBRACE, RBRACK + RBRACE);
    output.push(s.substring(start, i).trim());
    start = ++i;
  }

  if (output.length === 0) {
    throw 'Empty event selector: ' + s;
  }
  return output;
}

function parseSelector(s) {
  return s[0] === '['
    ? parseBetween(s)
    : parseStream$2(s);
}

function parseBetween(s) {
  var n = s.length,
      i = 1,
      b, stream;

  i = find(s, i, RBRACK, LBRACK, RBRACK);
  if (i === n) {
    throw 'Empty between selector: ' + s;
  }

  b = parseMerge(s.substring(1, i));
  if (b.length !== 2) {
    throw 'Between selector must have two elements: ' + s;
  }

  s = s.slice(i + 1).trim();
  if (s[0] !== GT) {
    throw 'Expected \'>\' after between selector: ' + s;
  }

  b = b.map(parseSelector);

  stream = parseSelector(s.slice(1).trim());
  if (stream.between) {
    return {
      between: b,
      stream: stream
    };
  } else {
    stream.between = b;
  }

  return stream;
}

function parseStream$2(s) {
  var stream = {source: DEFAULT_SOURCE},
      source = [],
      throttle = [0, 0],
      markname = 0,
      start = 0,
      n = s.length,
      i = 0, j,
      filter;

  // extract throttle from end
  if (s[n-1] === RBRACE) {
    i = s.lastIndexOf(LBRACE);
    if (i >= 0) {
      try {
        throttle = parseThrottle(s.substring(i+1, n-1));
      } catch (e) {
        throw 'Invalid throttle specification: ' + s;
      }
      s = s.slice(0, i).trim();
      n = s.length;
    } else throw 'Unmatched right brace: ' + s;
    i = 0;
  }

  if (!n) throw s;

  // set name flag based on first char
  if (s[0] === NAME) markname = ++i;

  // extract first part of multi-part stream selector
  j = find(s, i, COLON);
  if (j < n) {
    source.push(s.substring(start, j).trim());
    start = i = ++j;
  }

  // extract remaining part of stream selector
  i = find(s, i, LBRACK);
  if (i === n) {
    source.push(s.substring(start, n).trim());
  } else {
    source.push(s.substring(start, i).trim());
    filter = [];
    start = ++i;
    if (start === n) throw 'Unmatched left bracket: ' + s;
  }

  // extract filters
  while (i < n) {
    i = find(s, i, RBRACK);
    if (i === n) throw 'Unmatched left bracket: ' + s;
    filter.push(s.substring(start, i).trim());
    if (i < n-1 && s[++i] !== LBRACK) throw 'Expected left bracket: ' + s;
    start = ++i;
  }

  // marshall event stream specification
  if (!(n = source.length) || ILLEGAL$1.test(source[n-1])) {
    throw 'Invalid event selector: ' + s;
  }

  if (n > 1) {
    stream.type = source[1];
    if (markname) {
      stream.markname = source[0].slice(1);
    } else if (isMarkType(source[0])) {
      stream.marktype = source[0];
    } else {
      stream.source = source[0];
    }
  } else {
    stream.type = source[0];
  }
  if (stream.type.slice(-1) === '!') {
    stream.consume = true;
    stream.type = stream.type.slice(0, -1)
  }
  if (filter != null) stream.filter = filter;
  if (throttle[0]) stream.throttle = throttle[0];
  if (throttle[1]) stream.debounce = throttle[1];

  return stream;
}

function parseThrottle(s) {
  var a = s.split(COMMA);
  if (!s.length || a.length > 2) throw s;
  return a.map(function(_) {
    var x = +_;
    if (x !== x) throw s;
    return x;
  });
}

var preamble = 'var datum=event.item&&event.item.datum;';

function parseUpdate(spec, scope, target) {
  var events = spec.events,
      update = spec.update,
      encode = spec.encode,
      sources = [],
      value = '', entry;

  if (!events) {
    error('Signal update missing events specification.');
  }

  // interpret as an event selector string
  if (isString(events)) {
    events = selector(events);
  }

  // separate event streams from signal updates
  events = array(events).filter(function(stream) {
    return stream.signal ? (sources.push(stream), 0) : 1;
  });

  // merge event streams, include as source
  if (events.length) {
    sources.push(events.length > 1 ? {merge: events} : events[0]);
  }

  if (encode != null) {
    if (update) error('Signal encode and update are mutually exclusive.');
    update = 'encode(item(),' + $$2(encode) + ')';
  }

  // resolve update value
  value = isString(update) ? parseExpression(update, scope, preamble)
    : update.expr != null ? parseExpression(update.expr, scope, preamble)
    : update.value != null ? update.value
    : update.signal != null ? {
        $expr:   '_.value',
        $params: {value: scope.signalRef(update.signal)}
      }
    : error('Invalid signal update specification.');

  entry = {
    target: target,
    update: value
  };

  if (spec.force) {
    entry.options = {force: true};
  }

  sources.forEach(function(source) {
    source = {source: parseStream(source, scope)};
    scope.addUpdate(extend(source, entry));
  });
}

function parseSignalUpdates(signal, scope) {
  var op = scope.getSignal(signal.name);

  if (signal.update) {
    var expr = parseExpression(signal.update, scope);
    op.update = expr.$expr;
    op.params = expr.$params;
  }

  if (signal.on) {
    signal.on.forEach(function(_) {
      parseUpdate(_, scope, op.id);
    });
  }
}

function parseProjection(proj, scope) {
  var params = {};

  for (var name in proj) {
    if (name === 'name') continue;
    params[name] = parseParameter(proj[name], scope);
  }

  scope.addProjection(proj.name, params);
}

function parseParameter(_, scope) {
  return isArray(_) ? _.map(function(_) { return parseParameter(_, scope); })
    : !isObject(_) ? _
    : _.signal ? scope.signalRef(_.signal)
    : error('Unsupported parameter object: ' + $$2(_));
}

var Skip = toSet(['rule']);
var Swap = toSet(['group', 'image', 'rect']);
function adjustSpatial(encode, marktype) {
  var code = '';

  if (Skip[marktype]) return code;

  if (encode.x2) {
    if (encode.x) {
      if (Swap[marktype]) {
        code += 'if(o.x>o.x2)$=o.x,o.x=o.x2,o.x2=$;';
      }
      code += 'o.width=o.x2-o.x;';
    } else if (encode.width) {
      code += 'o.x=o.x2-o.width;';
    } else {
      code += 'o.x=o.x2;';
    }
  }

  if (encode.xc) {
    if (encode.width) {
      code += 'o.x=o.xc-o.width/2;';
    } else {
      code += 'o.x=o.xc;';
    }
  }

  if (encode.y2) {
    if (encode.y) {
      if (Swap[marktype]) {
        code += 'if(o.y>o.y2)$=o.y,o.y=o.y2,o.y2=$;';
      }
      code += 'o.height=o.y2-o.y;';
    } else if (encode.height) {
      code += 'o.y=o.y2-o.height;';
    } else {
      code += 'o.y=o.y2;';
    }
  }

  if (encode.yc) {
    if (encode.height) {
      code += 'o.y=o.yc-o.height/2;';
    } else {
      code += 'o.y=o.yc;';
    }
  }

  return code;
}

function color$1(enc, scope, params, fields) {
  function color(type, x, y, z) {
    var a = entry(null, x, scope, params, fields),
        b = entry(null, y, scope, params, fields),
        c = entry(null, z, scope, params, fields);
    return 'this.' + type + '(' + [a, b, c].join(',') + ').toString()';
  }

  return (enc.c) ? color('hcl', enc.h, enc.c, enc.l)
    : (enc.h || enc.s) ? color('hsl', enc.h, enc.s, enc.l)
    : (enc.l || enc.a) ? color('lab', enc.l, enc.a, enc.b)
    : (enc.r || enc.g || enc.b) ? color('rgb', enc.r, enc.g, enc.b)
    : null;
}

function expression(code, scope, params, fields) {
  var expr = parseExpression(code, scope);
  expr.$fields.forEach(function(name) { fields[name] = 1; });
  extend(params, expr.$params);
  return expr.$expr;
}

function field$1(ref, scope, params, fields) {
  return resolve$1(isObject(ref) ? ref : {datum: ref}, scope, params, fields);
}

function resolve$1(ref, scope, params, fields) {
  var object, level, field;

  if (ref.signal) {
    object = 'datum';
    field = expression(ref.signal, scope, params, fields);
  } else if (ref.group || ref.parent) {
    level = Math.max(1, ref.level || 1);
    object = 'item';

    while (level-- > 0) {
      object += '.mark.group';
    }

    if (ref.parent) {
      field = ref.parent;
      object += '.datum';
    } else {
      field = ref.group;
    }
  } else if (ref.datum) {
    object = 'datum';
    field = ref.datum;
  } else {
    error('Invalid field reference: ' + $$2(ref));
  }

  if (!ref.signal) {
    if (isString(field)) {
      fields[field] = 1; // TODO review field tracking?
      field = splitAccessPath(field).map($$2).join('][');
    } else {
      field = resolve$1(field, scope, params, fields);
    }
  }

  return object + '[' + field + ']';
}

function scale$3(enc, value, scope, params, fields) {
  var scale = getScale$1(enc.scale, scope, params, fields),
      interp, func, flag;

  if (enc.range != null) {
    // pull value from scale range
    interp = +enc.range;
    func = scale + '.range()';
    value = (interp === 0) ? (func + '[0]')
      : '($=' + func + ',' + ((interp === 1) ? '$[$.length-1]'
      : '$[0]+' + interp + '*($[$.length-1]-$[0])') + ')';
  } else {
    // run value through scale and/or pull scale bandwidth
    if (value !== undefined) value = scale + '(' + value + ')';

    if (enc.band && (flag = hasBandwidth(enc.scale, scope))) {
      func = scale + '.bandwidth';
      interp = +enc.band;
      interp = func + '()' + (interp===1 ? '' : '*' + interp);

      // if we don't know the scale type, check for bandwidth
      if (flag < 0) interp = '(' + func + '?' + interp + ':0)';

      value = (value ? value + '+' : '') + interp;

      if (enc.extra) {
        // include logic to handle extraneous elements
        value = '(datum.extra?' + scale + '(datum.extra.value):' + value + ')';
      }
    }

    if (value == null) value = '0';
  }

  return value;
}

function hasBandwidth(name, scope) {
  if (!isString(name)) return -1;
  var type = scope.scaleType(name);
  return type === 'band' || type === 'point' ? 1 : 0;
}

function getScale$1(name, scope, params, fields) {
  var scaleName;

  if (isString(name)) {
    // direct scale lookup; add scale as parameter
    scaleName = scalePrefix + name;
    if (!params.hasOwnProperty(scaleName)) {
      params[scaleName] = scope.scaleRef(name);
    }
    scaleName = $$2(scaleName);
  } else {
    // indirect scale lookup; add all scales as parameters
    for (scaleName in scope.scales) {
      params[scalePrefix + scaleName] = scope.scaleRef(scaleName);
    }
    scaleName = $$2(scalePrefix) + '+'
      + (name.signal
        ? '(' + expression(name.signal, scope, params, fields) + ')'
        : field$1(name, scope, params, fields));
  }

  return '_[' + scaleName + ']';
}

function gradient$1(enc, scope, params, fields) {
  return 'this.gradient('
    + getScale$1(enc.gradient, scope, params, fields)
    + ',' + $$2(enc.start)
    + ',' + $$2(enc.stop)
    + ',' + $$2(enc.count)
    + ')';
}

function property(property, scope, params, fields) {
  return isObject(property)
      ? '(' + entry(null, property, scope, params, fields) + ')'
      : property;
}

function entry(channel, enc, scope, params, fields) {
  if (enc.gradient != null) {
    return gradient$1(enc, scope, params, fields);
  }

  var value = enc.signal ? expression(enc.signal, scope, params, fields)
    : enc.color ? color$1(enc.color, scope, params, fields)
    : enc.field != null ? field$1(enc.field, scope, params, fields)
    : enc.value !== undefined ? $$2(enc.value)
    : undefined;

  if (enc.scale != null) {
    value = scale$3(enc, value, scope, params, fields);
  }

  if (value === undefined) {
    value = null;
  }

  if (enc.exponent != null) {
    value = 'Math.pow(' + value + ','
      + property(enc.exponent, scope, params, fields) + ')';
  }

  if (enc.mult != null) {
    value += '*' + property(enc.mult, scope, params, fields);
  }

  if (enc.offset != null) {
    value += '+' + property(enc.offset, scope, params, fields);
  }

  if (enc.round) {
    value = 'Math.round(' + value + ')';
  }

  return value;
}

function set$2(obj, key, value) {
  return obj + '[' + $$2(key) + ']=' + value + ';';
}

function rule$1(channel, rules, scope, params, fields) {
  var code = '';

  rules.forEach(function(rule) {
    var value = entry(channel, rule, scope, params, fields);
    code += rule.test
      ? expression(rule.test, scope, params, fields) + '?' + value + ':'
      : value;
  });

  return set$2('o', channel, code);
}

function parseEncode(encode, marktype, params, scope) {
  var fields = {},
      code = 'var o=item,datum=o.datum,$;',
      channel, enc, value;

  for (channel in encode) {
    enc = encode[channel];
    if (isArray(enc)) { // rule
      code += rule$1(channel, enc, scope, params, fields);
    } else {
      value = entry(channel, enc, scope, params, fields);
      code += set$2('o', channel, value);
    }
  }

  code += adjustSpatial(encode, marktype);
  code += 'return 1;';

  return {
    $expr:   code,
    $fields: Object.keys(fields),
    $output: Object.keys(encode)
  };
}

var MarkRole = 'mark';
var FrameRole$1 = 'frame';
var ScopeRole$1 = 'scope';

var AxisRole$2 = 'axis';
var AxisDomainRole = 'axis-domain';
var AxisGridRole = 'axis-grid';
var AxisLabelRole = 'axis-label';
var AxisTickRole = 'axis-tick';
var AxisTitleRole = 'axis-title';

var LegendRole$2 = 'legend';
var LegendEntryRole = 'legend-entry';
var LegendGradientRole = 'legend-gradient';
var LegendLabelRole = 'legend-label';
var LegendSymbolRole = 'legend-symbol';
var LegendTitleRole = 'legend-title';

var TitleRole$1 = 'title';

function encoder(_) {
  return isObject(_) ? _ : {value: _};
}

function addEncode(object, name, value) {
  return value != null ? (object[name] = {value: value}, 1) : 0;
}

function extendEncode(encode, extra, skip) {
  for (var name in extra) {
    if (skip && skip.hasOwnProperty(name)) continue;
    encode[name] = extend(encode[name] || {}, extra[name]);
  }
  return encode;
}

function encoders(encode, type, role, scope, params) {
  var enc, key;
  params = params || {};
  params.encoders = {$encode: (enc = {})};

  encode = applyDefaults(encode, type, role, scope.config);

  for (key in encode) {
    enc[key] = parseEncode(encode[key], type, params, scope);
  }

  return params;
}

function applyDefaults(encode, type, role, config) {
  var enter, key, skip;

  // ignore legend and axis
  if (role == 'legend' || String(role).indexOf('axis') === 0) {
    role = null;
  }

  config = role === FrameRole$1 ? config.group
    : (role === MarkRole || config[type = role]) ? extend({}, config.mark, config[type])
    : {};

  enter = {};
  for (key in config) {
    // do not apply defaults if relevant fields are defined
    skip = has(key, encode)
      || (key === 'fill' || key === 'stroke')
      && (has('fill', encode) || has('stroke', encode));

    if (!skip) enter[key] = {value: config[key]};
  }

  encode = extend({}, encode); // defensive copy
  encode.enter = extend(enter, encode.enter);

  return encode;
}

function has(key, encode) {
  return (encode.enter && encode.enter[key])
    || (encode.update && encode.update[key]);
}

var skip = {name: 1, interactive: 1};

function guideMark(type, role, key, dataRef, encode, extras) {
  return {
    type: type,
    name: extras ? extras.name : undefined,
    role: role,
    key:  key,
    from: dataRef,
    interactive: !!(extras && extras.interactive),
    encode: extendEncode(encode, extras, skip)
  };
}

var GroupMark = 'group';
var RectMark = 'rect';
var RuleMark = 'rule';
var SymbolMark = 'symbol';
var TextMark = 'text';

function legendGradient(scale, config, userEncode) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    x: zero,
    y: zero
  };
  addEncode(enter, 'width', config.gradientWidth);
  addEncode(enter, 'height', config.gradientHeight);
  addEncode(enter, 'stroke', config.gradientStrokeColor);
  addEncode(enter, 'strokeWidth', config.gradientStrokeWidth);

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    x: zero,
    y: zero,
    fill: {gradient: scale},
    opacity: {value: 1}
  };
  addEncode(update, 'width', config.gradientWidth);
  addEncode(update, 'height', config.gradientHeight);

  return guideMark(RectMark, LegendGradientRole, undefined, undefined, encode, userEncode);
}

var Top = 'top';
var Left = 'left';
var Right = 'right';
var Bottom = 'bottom';

var Index  = 'index';
var Label  = 'label';
var Offset = 'offset';
var Perc   = 'perc';
var Size   = 'size';
var Total  = 'total';
var Value  = 'value';

var LegendScales = [
  'shape',
  'size',
  'fill',
  'stroke',
  'strokeDash',
  'opacity'
];

var alignExpr = 'datum.' + Perc + '<=0?"left"'
  + ':datum.' + Perc + '>=1?"right":"center"';

function legendGradientLabels(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    text: {field: Label}
  };
  addEncode(enter, 'fill', config.labelColor);
  addEncode(enter, 'font', config.labelFont);
  addEncode(enter, 'fontSize', config.labelFontSize);
  addEncode(enter, 'baseline', config.gradientLabelBaseline);
  addEncode(enter, 'limit', config.gradientLabelLimit);

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  enter.x = update.x = {
    field: Perc,
    mult: config.gradientWidth
  };

  enter.y = update.y = {
    value: config.gradientHeight,
    offset: config.gradientLabelOffset
  };

  enter.align = update.align = {signal: alignExpr};

  return guideMark(TextMark, LegendLabelRole, Perc, dataRef, encode, userEncode);
}

function legendLabels(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    text: {field: Label}
  };
  addEncode(enter, 'align', config.labelAlign);
  addEncode(enter, 'baseline', config.labelBaseline);
  addEncode(enter, 'fill', config.labelColor);
  addEncode(enter, 'font', config.labelFont);
  addEncode(enter, 'fontSize', config.labelFontSize);
  addEncode(enter, 'limit', config.labelLimit);

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  enter.x = update.x = {
    field:  Offset,
    offset: config.labelOffset
  };

  enter.y = update.y = {
    field:  Size,
    mult:   0.5,
    offset: {
      field: Total,
      offset: {
        field: {group: 'entryPadding'},
        mult: {field: Index}
      }
    }
  };

  return guideMark(TextMark, LegendLabelRole, Value, dataRef, encode, userEncode);
}

function legendSymbols(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'shape', config.symbolType);
  addEncode(enter, 'size', config.symbolSize);
  addEncode(enter, 'strokeWidth', config.symbolStrokeWidth);
  if (!spec.fill) addEncode(enter, 'stroke', config.symbolColor);

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  enter.x = update.x = {
    field: Offset,
    mult:  0.5
  };

  enter.y = update.y = {
    field: Size,
    mult:  0.5,
    offset: {
      field: Total,
      offset: {
        field: {group: 'entryPadding'},
        mult: {field: Index}
      }
    }
  };

  LegendScales.forEach(function(scale) {
    if (spec[scale]) {
      update[scale] = enter[scale] = {scale: spec[scale], field: Value};
    }
  });

  return guideMark(SymbolMark, LegendSymbolRole, Value, dataRef, encode, userEncode);
}

function legendTitle(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      title = spec.title,
      encode = {}, enter;

  encode.enter = enter = {
    x: {field: {group: 'padding'}},
    y: {field: {group: 'padding'}},
    opacity: zero
  };
  addEncode(enter, 'align', config.titleAlign);
  addEncode(enter, 'baseline', config.titleBaseline);
  addEncode(enter, 'fill', config.titleColor);
  addEncode(enter, 'font', config.titleFont);
  addEncode(enter, 'fontSize', config.titleFontSize);
  addEncode(enter, 'fontWeight', config.titleFontWeight);
  addEncode(enter, 'limit', config.titleLimit);

  encode.exit = {
    opacity: zero
  };

  encode.update = {
    opacity: {value: 1},
    text: title && title.signal ? {signal: title.signal} : {value: title + ''}
  };

  return guideMark(TextMark, LegendTitleRole, null, dataRef, encode, userEncode);
}

function guideGroup(role, name, dataRef, interactive, encode, marks) {
  return {
    type: GroupMark,
    name: name,
    role: role,
    from: dataRef,
    interactive: interactive,
    encode: encode,
    marks: marks
  };
}

function role(spec) {
  var role = spec.role || '';
  return (!role.indexOf('axis') || !role.indexOf('legend'))
    ? role
    : spec.type === GroupMark ? ScopeRole$1 : (role || MarkRole);
}

function definition$1(spec) {
  return {
    clip:        spec.clip || false,
    interactive: spec.interactive === false ? false : true,
    marktype:    spec.type,
    name:        spec.name || undefined,
    role:        spec.role || role(spec),
    zindex:      +spec.zindex || undefined
  };
}

function dataName(name) {
  return name;
}

function Entry(type, value, params, parent) {
  this.id = -1,
  this.type = type;
  this.value = value;
  this.params = params;
  if (parent) this.parent = parent;
}

function entry$1(type, value, params, parent) {
  return new Entry(type, value, params, parent);
}

function operator(value, params) {
  return entry$1('Operator', value, params);
}

// -----

function ref(op) {
  var ref = {$ref: op.id};
  // if operator not yet registered, cache ref to resolve later
  if (op.id < 0) (op.refs = op.refs || []).push(ref);
  return ref;
}

function fieldRef(field, name) {
  return name ? {$field: field, $name: name} : {$field: field};
}

var keyFieldRef = fieldRef('key');

function compareRef(fields, orders) {
  return {$compare: fields, $order: orders};
}

function keyRef(fields) {
  return {$key: fields};
}

// -----

var Ascending  = 'ascending';

var Descending = 'descending';

function sortKey(sort) {
  return !isObject(sort) ? ''
    : (sort.order === Descending ? '-' : '+')
      + aggrField(sort.op, sort.field);
}

function aggrField(op, field) {
  return (op && op.signal ? '$' + op.signal : op || '')
    + (op && field ? '_' : '')
    + (field && field.signal ? '$' + field.signal : field || '');
}

// -----

function isSignal(_) {
  return _ && _.signal;
}

function transform$1(name) {
  return function(params, value, parent) {
    return entry$1(name, value, params || undefined, parent);
  };
}

var Aggregate$1 = transform$1('Aggregate');
var AxisTicks$1 = transform$1('AxisTicks');
var Bound$1 = transform$1('Bound');
var Collect$1 = transform$1('Collect');
var Compare$1 = transform$1('Compare');
var DataJoin$1 = transform$1('DataJoin');
var Encode$1 = transform$1('Encode');
var Facet$1 = transform$1('Facet');
var Field$1 = transform$1('Field');
var Key$1 = transform$1('Key');
var LegendEntries$1 = transform$1('LegendEntries');
var Mark$1 = transform$1('Mark');
var MultiExtent$1 = transform$1('MultiExtent');
var MultiValues$1 = transform$1('MultiValues');
var Params$1 = transform$1('Params');
var PreFacet$1 = transform$1('PreFacet');
var Projection$1 = transform$1('Projection');
var Proxy$1 = transform$1('Proxy');
var Relay$1 = transform$1('Relay');
var Render$1 = transform$1('Render');
var Scale$1 = transform$1('Scale');
var Sieve$1 = transform$1('Sieve');
var SortItems$1 = transform$1('SortItems');
var ViewLayout$1 = transform$1('ViewLayout');
var Values$1 = transform$1('Values');

/**
 * Parse a data transform specification.
 */
function parseTransform(spec, scope) {
  var def = definition(spec.type);
  if (!def) error('Unrecognized transform type: ' + $$2(spec.type));

  var t = entry$1(def.type, null, parseParameters(def, spec, scope));
  if (spec.signal) scope.addSignal(spec.signal, scope.proxy(t));
  return t.metadata = def.metadata || {}, t;
}

/**
 * Parse all parameters of a data transform.
 */
function parseParameters(def, spec, scope) {
  var params = {}, pdef, i, n;
  for (i=0, n=def.params.length; i<n; ++i) {
    pdef = def.params[i];
    params[pdef.name] = parseParameter$1(pdef, spec, scope);
  }
  return params;
}

/**
 * Parse a data transform parameter.
 */
function parseParameter$1(def, spec, scope) {
  var type = def.type,
      value = spec[def.name];

  if (type === 'index') {
    return parseIndexParameter(def, spec, scope);
  } else if (value === undefined) {
    if (def.required) {
      error('Missing required ' + $$2(spec.type)
          + ' parameter: ' + $$2(def.name));
    }
    return;
  } else if (type === 'param') {
    return parseSubParameters(def, spec, scope);
  } else if (type === 'projection') {
    return scope.projectionRef(spec[def.name]);
  }

  return def.array && !isSignal(value)
    ? value.map(function(v) { return parameterValue(def, v, scope); })
    : parameterValue(def, value, scope);
}

/**
 * Parse a single parameter value.
 */
function parameterValue(def, value, scope) {
  var type = def.type;

  if (isSignal(value)) {
    return isExpr(type) ? error('Expression references can not be signals.')
         : isField(type) ? scope.fieldRef(value)
         : isCompare(type) ? scope.compareRef(value)
         : scope.signalRef(value.signal);
  } else {
    var expr = def.expr || isField(type);
    return expr && outerExpr(value) ? parseExpression(value.expr, scope)
         : expr && outerField(value) ? fieldRef(value.field)
         : isExpr(type) ? parseExpression(value, scope)
         : isData(type) ? ref(scope.getData(value).values)
         : isField(type) ? fieldRef(value)
         : isCompare(type) ? scope.compareRef(value)
         : value;
  }
}

/**
 * Parse parameter for accessing an index of another data set.
 */
function parseIndexParameter(def, spec, scope) {
  if (!isString(spec.from)) {
    error('Lookup "from" parameter must be a string literal.');
  }
  return scope.getData(spec.from).lookupRef(scope, spec.key);
}

/**
 * Parse a parameter that contains one or more sub-parameter objects.
 */
function parseSubParameters(def, spec, scope) {
  var value = spec[def.name];

  if (def.array) {
    if (!isArray(value)) { // signals not allowed!
      error('Expected an array of sub-parameters. Instead: ' + $$2(value));
    }
    return value.map(function(v) {
      return parseSubParameter(def, v, scope);
    });
  } else {
    return parseSubParameter(def, value, scope);
  }
}

/**
 * Parse a sub-parameter object.
 */
function parseSubParameter(def, value, scope) {
  var params, pdef, k, i, n;

  // loop over defs to find matching key
  for (i=0, n=def.params.length; i<n; ++i) {
    pdef = def.params[i];
    for (k in pdef.key) {
      if (pdef.key[k] !== value[k]) { pdef = null; break; }
    }
    if (pdef) break;
  }
  // raise error if matching key not found
  if (!pdef) error('Unsupported parameter: ' + $$2(value));

  // parse params, create Params transform, return ref
  params = extend(parseParameters(pdef, value, scope), pdef.key);
  return ref(scope.add(Params$1(params)));
}

// -- Utilities -----

function outerExpr(_) {
  return _ && _.expr;
}

function outerField(_) {
  return _ && _.field;
}

function isData(_) {
  return _ === 'data';
}

function isExpr(_) {
  return _ === 'expr';
}

function isField(_) {
  return _ === 'field';
}

function isCompare(_) {
  return _ === 'compare'
}

function parseData(from, group, scope) {
  var facet, key, op, dataRef, parent;

  // if no source data, generate singleton datum
  if (!from) {
    dataRef = ref(scope.add(Collect$1(null, [{}])));
  }

  // if faceted, process facet specification
  else if (facet = from.facet) {
    if (!group) error('Only group marks can be faceted.');

    // use pre-faceted source data, if available
    if (facet.field != null) {
      dataRef = parent = ref(scope.getData(facet.data).output);
    } else {
      key = scope.keyRef(facet.groupby);

      // generate facet aggregates if no direct data specification
      if (!from.data) {
        op = parseTransform(extend({
          type:    'aggregate',
          groupby: array(facet.groupby)
        }, facet.aggregate));
        op.params.key = key;
        op.params.pulse = ref(scope.getData(facet.data).output);
        dataRef = parent = ref(scope.add(op));
      } else {
        parent = ref(scope.getData(from.data).aggregate);
      }
    }
  }

  // if not yet defined, get source data reference
  if (!dataRef) {
    dataRef = from.$ref ? from
      : from.mark ? ref(scope.getData(dataName(from.mark)).output)
      : ref(scope.getData(from.data).output);
  }

  return {
    key: key,
    pulse: dataRef,
    parent: parent
  };
}

function DataScope(scope, input, output, values, aggr) {
  this.scope = scope;   // parent scope object
  this.input = input;   // first operator in pipeline (tuple input)
  this.output = output; // last operator in pipeline (tuple output)
  this.values = values; // operator for accessing tuples (but not tuple flow)

  // last aggregate in transform pipeline
  this.aggregate = aggr;

  // lookup table of field indices
  this.index = {};
}

DataScope.fromEntries = function(scope, entries) {
  var n = entries.length,
      i = 1,
      input  = entries[0],
      values = entries[n-1],
      output = entries[n-2],
      aggr = null;

  // add operator entries to this scope, wire up pulse chain
  scope.add(entries[0]);
  for (; i<n; ++i) {
    entries[i].params.pulse = ref(entries[i-1]);
    scope.add(entries[i]);
    if (entries[i].type === 'Aggregate') aggr = entries[i];
  }

  return new DataScope(scope, input, output, values, aggr);
};

var prototype$72 = DataScope.prototype;

prototype$72.countsRef = function(scope, field, sort) {
  var ds = this,
      cache = ds.counts || (ds.counts = {}),
      k = fieldKey(field), v, a, p;

  if (k != null) {
    scope = ds.scope;
    v = cache[k];
  }

  if (!v) {
    p = {
      groupby: scope.fieldRef(field, 'key'),
      pulse: ref(ds.output)
    };
    if (sort && sort.field) addSortField(scope, p, sort);
    a = scope.add(Aggregate$1(p));
    v = scope.add(Collect$1({pulse: ref(a)}));
    v = {agg: a, ref: ref(v)};
    if (k != null) cache[k] = v;
  } else if (sort && sort.field) {
    addSortField(scope, v.agg.params, sort);
  }

  return v.ref;
};

function fieldKey(field) {
  return isString(field) ? field : null;
}

function addSortField(scope, p, sort) {
  var as = aggrField(sort.op, sort.field), s;

  if (p.ops) {
    for (var i=0, n=p.as.length; i<n; ++i) {
      if (p.as[i] === as) return;
    }
  } else {
    p.ops = ['count'];
    p.fields = [null];
    p.as = ['count'];
  }
  if (sort.op) {
    p.ops.push((s=sort.op.signal) ? scope.signalRef(s) : sort.op);
    p.fields.push(scope.fieldRef(sort.field));
    p.as.push(as);
  }
}

function cache(scope, ds, name, optype, field, counts, index) {
  var cache = ds[name] || (ds[name] = {}),
      sort = sortKey(counts),
      k = fieldKey(field), v, op;

  if (k != null) {
    scope = ds.scope;
    k = k + (sort ? '|' + sort : '');
    v = cache[k];
  }

  if (!v) {
    var params = counts
      ? {field: keyFieldRef, pulse: ds.countsRef(scope, field, counts)}
      : {field: scope.fieldRef(field), pulse: ref(ds.output)};
    if (sort) params.sort = scope.sortRef(counts);
    op = scope.add(entry$1(optype, undefined, params));
    if (index) ds.index[field] = op;
    v = ref(op);
    if (k != null) cache[k] = v;
  }
  return v;
}

prototype$72.tuplesRef = function() {
  return ref(this.values);
};

prototype$72.extentRef = function(scope, field) {
  return cache(scope, this, 'extent', 'Extent', field, false);
};

prototype$72.domainRef = function(scope, field) {
  return cache(scope, this, 'domain', 'Values', field, false);
};

prototype$72.valuesRef = function(scope, field, sort) {
  return cache(scope, this, 'vals', 'Values', field, sort || true);
};

prototype$72.lookupRef = function(scope, field) {
  return cache(scope, this, 'lookup', 'TupleIndex', field, false);
};

prototype$72.indataRef = function(scope, field) {
  return cache(scope, this, 'indata', 'TupleIndex', field, true, true);
};

function parseFacet(spec, scope, group) {
  var facet = spec.from.facet,
      name = facet.name,
      data = ref(scope.getData(facet.data).output),
      subscope, source, values, op;

  if (!facet.name) {
    error('Facet must have a name: ' + $$2(facet));
  }
  if (!facet.data) {
    error('Facet must reference a data set: ' + $$2(facet));
  }

  if (facet.field) {
    op = scope.add(PreFacet$1({
      field: scope.fieldRef(facet.field),
      pulse: data
    }));
  } else if (facet.groupby) {
    op = scope.add(Facet$1({
      key:   scope.keyRef(facet.groupby),
      group: ref(scope.proxy(group.parent)),
      pulse: data
    }));
  } else {
    error('Facet must specify groupby or field: ' + $$2(facet));
  }

  // initialize facet subscope
  subscope = scope.fork();
  source = subscope.add(Collect$1());
  values = subscope.add(Sieve$1({pulse: ref(source)}));
  subscope.addData(name, new DataScope(subscope, source, source, values));
  subscope.addSignal('parent', null);

  // parse faceted subflow
  op.params.subflow = {
    $subflow: parseSpec(spec, subscope).toRuntime()
  };
}

function parseSubflow(spec, scope, input) {
  var op = scope.add(PreFacet$1({pulse: input.pulse})),
      subscope = scope.fork();

  subscope.add(Sieve$1());
  subscope.addSignal('parent', null);

  // parse group mark subflow
  op.params.subflow = {
    $subflow: parseSpec(spec, subscope).toRuntime()
  };
}

function parseTrigger(spec, scope, name) {
  var remove = spec.remove,
      insert = spec.insert,
      toggle = spec.toggle,
      modify = spec.modify,
      values = spec.values,
      op = scope.add(operator()),
      update, expr;

  update = 'if(' + spec.trigger + ',modify("'
    + name + '",'
    + [insert, remove, toggle, modify, values]
        .map(function(_) { return _ == null ? 'null' : _; })
        .join(',')
    + '),0)';

  expr = parseExpression(update, scope);
  op.update = expr.$expr;
  op.params = expr.$params;
}

function parseMark(spec, scope) {
  var role$$ = role(spec),
      group = spec.type === GroupMark,
      facet = spec.from && spec.from.facet,
      layout = spec.layout || role$$ === ScopeRole$1 || role$$ === FrameRole$1,
      nested = role$$ === MarkRole || layout || facet,
      ops, op, input, store, bound, render, sieve, name,
      joinRef, markRef, encodeRef, layoutRef, boundRef;

  // resolve input data
  input = parseData(spec.from, group, scope);

  // data join to map tuples to visual items
  op = scope.add(DataJoin$1({
    key:   input.key || (spec.key ? fieldRef(spec.key) : undefined),
    pulse: input.pulse,
    clean: !group
  }));
  joinRef = ref(op);

  // collect visual items
  op = store = scope.add(Collect$1({pulse: joinRef}));

  // connect visual items to scenegraph
  op = scope.add(Mark$1({
    markdef:   definition$1(spec),
    context:   {$context: true},
    groups:    scope.lookup(),
    parent:    scope.signals.parent ? scope.signalRef('parent') : null,
    index:     scope.markpath(),
    pulse:     ref(op)
  }));
  markRef = ref(op);

  // add visual encoders
  op = scope.add(Encode$1(
    encoders(spec.encode, spec.type, role$$, scope, {pulse: markRef})
  ));

  // monitor parent marks to propagate changes
  op.params.parent = scope.encode();

  // add post-encoding transforms, if defined
  if (spec.transform) {
    spec.transform.forEach(function(_) {
      var tx = parseTransform(_, scope);
      if (tx.metadata.generates || tx.metadata.changes) {
        error('Mark transforms should not generate new data.');
      }
      tx.params.pulse = ref(op);
      scope.add(op = tx);
    });
  }

  // if item sort specified, perform post-encoding
  if (spec.sort) {
    op = scope.add(SortItems$1({
      sort:  scope.compareRef(spec.sort),
      pulse: ref(op)
    }));
  }

  encodeRef = ref(op);

  // add view layout operator if needed
  if (facet || layout) {
    layout = scope.add(ViewLayout$1({
      layout:       scope.objectProperty(spec.layout),
      legendMargin: scope.config.legendMargin,
      mark:         markRef,
      pulse:        encodeRef
    }));
    layoutRef = ref(layout);
  }

  // compute bounding boxes
  bound = scope.add(Bound$1({mark: markRef, pulse: layoutRef || encodeRef}));
  boundRef = ref(bound);

  // if group mark, recurse to parse nested content
  if (group) {
    // juggle layout & bounds to ensure they run *after* any faceting transforms
    if (nested) { ops = scope.operators; ops.pop(); if (layout) ops.pop(); }

    scope.pushState(encodeRef, layoutRef || boundRef, joinRef);
    facet ? parseFacet(spec, scope, input)          // explicit facet
        : nested ? parseSubflow(spec, scope, input) // standard mark group
        : parseSpec(spec, scope); // guide group, we can avoid nested scopes
    scope.popState();

    if (nested) { if (layout) ops.push(layout); ops.push(bound); }
  }

  // render / sieve items
  render = scope.add(Render$1({pulse: boundRef}));
  sieve = scope.add(Sieve$1({pulse: boundRef}, undefined, scope.parent()));

  // if mark is named, make accessible as reactive geometry
  // add trigger updates if defined
  if (spec.name != null) {
    name = dataName(spec.name);
    scope.addData(name, new DataScope(scope, store, render, sieve));
    if (spec.on) spec.on.forEach(function(on) {
      if (on.insert || on.remove || on.toggle) {
        error('Marks only support modify triggers.');
      }
      parseTrigger(on, scope, name);
    });
  }
}

function parseLegend(spec, scope) {
  var type = spec.type || 'symbol',
      config = scope.config.legend,
      name = spec.name || undefined,
      encode = spec.encode || {},
      interactive = !!spec.interactive,
      datum, dataRef, entryRef, group, title,
      legendEncode, entryEncode, children;

  // resolve 'canonical' scale name
  var scale = spec.size || spec.shape || spec.fill || spec.stroke
           || spec.strokeDash || spec.opacity;

  if (!scale) {
    error('Missing valid scale for legend.');
  }

  // single-element data source for axis group
  datum = {
    orient: value(spec.orient, config.orient),
    title:  spec.title != null
  };
  dataRef = ref(scope.add(Collect$1(null, [datum])));

  // encoding properties for legend group

  legendEncode = extendEncode({
    enter: legendEnter(config),
    update: {
      offset:        encoder(value(spec.offset, config.offset)),
      padding:       encoder(value(spec.padding, config.padding)),
      titlePadding:  encoder(value(spec.titlePadding, config.titlePadding))
    }
  }, encode.legend);

  // encoding properties for legend entry sub-group
  entryEncode = {
    update: {
      x: {field: {group: 'padding'}},
      y: {field: {group: 'padding'}},
      entryPadding: encoder(value(spec.entryPadding, config.entryPadding))
    }
  };

  if (type === 'gradient') {
    // data source for gradient labels
    entryRef = ref(scope.add(LegendEntries$1({
      type:   'gradient',
      scale:  scope.scaleRef(scale),
      count:  scope.property(spec.tickCount),
      values: scope.property(spec.values),
      formatSpecifier: scope.property(spec.format)
    })));

    children = [
      legendGradient(scale, config, encode.gradient),
      legendGradientLabels(spec, config, encode.labels, entryRef)
    ];
  }

  else {
    // data source for legend entries
    entryRef = ref(scope.add(LegendEntries$1({
      size:   sizeExpression(spec, config, encode.labels),
      scale:  scope.scaleRef(scale),
      count:  scope.property(spec.tickCount),
      values: scope.property(spec.values),
      formatSpecifier: scope.property(spec.format)
    })));

    children = [
      legendSymbols(spec, config, encode.symbols, entryRef),
      legendLabels(spec, config, encode.labels, entryRef)
    ];
  }

  // generate legend marks
  children = [
    guideGroup(LegendEntryRole, null, dataRef, interactive, entryEncode, children)
  ];

  // include legend title if defined
  if (datum.title) {
    title = legendTitle(spec, config, encode.title, dataRef);
    entryEncode.update.y.offset = {
      field: {group: 'titlePadding'},
      offset: title.encode.update.fontSize || title.encode.enter.fontSize
    };
    children.push(title);
  }

  // build legend specification
  group = guideGroup(LegendRole$2, name, dataRef, interactive, legendEncode, children);
  if (spec.zindex) group.zindex = spec.zindex;

  // parse legend specification
  return parseMark(group, scope);
}

function value(value, defaultValue) {
  return value != null ? value : defaultValue;
}

function sizeExpression(spec, config, encode) {
  // TODO get override for symbolSize?
  var symbolSize = +config.symbolSize, fontSize;
  fontSize = encode && encode.update && encode.update.fontSize;
  if (!fontSize) fontSize = encode && encode.enter && encode.enter.fontSize;
  if (fontSize) fontSize = fontSize.value; // TODO support signal?
  if (!fontSize) fontSize = +config.labelFontSize;

  return spec.size
    ? {$expr: 'Math.max(Math.ceil(Math.sqrt(_.scale(datum))),' + fontSize + ')'}
    : Math.max(Math.ceil(Math.sqrt(symbolSize)), fontSize);
}

function legendEnter(config) {
  var enter = {},
      count = addEncode(enter, 'fill', config.fillColor)
            + addEncode(enter, 'stroke', config.strokeColor)
            + addEncode(enter, 'strokeWidth', config.strokeWidth)
            + addEncode(enter, 'strokeDash', config.strokeDash)
            + addEncode(enter, 'cornerRadius', config.cornerRadius)
  return count ? enter : undefined;
}

var FIELD_REF_ID = 0;

var types = [
  'identity',
  'ordinal', 'band', 'point',
  'bin-linear', 'bin-ordinal',
  'linear', 'pow', 'sqrt', 'log', 'sequential',
  'time', 'utc',
  'quantize', 'quantile', 'threshold'
];

var allTypes = toSet(types);
var ordinalTypes = toSet(types.slice(1, 6));
function isOrdinal(type) {
  return ordinalTypes.hasOwnProperty(type);
}

function isQuantile(type) {
  return type === 'quantile';
}

function parseScale(spec, scope) {
  var type = spec.type || 'linear',
      params, key;

  if (!allTypes.hasOwnProperty(type)) {
    error('Unrecognized scale type: ' + $$2(type));
  }

  params = {
    type:   type,
    domain: parseScaleDomain(spec.domain, spec, scope)
  };

  if (spec.range != null) {
    params.range = parseScaleRange(spec, scope, params);
  }

  if (spec.interpolate != null) {
    parseScaleInterpolate(spec.interpolate, params);
  }

  for (key in spec) {
    if (params.hasOwnProperty(key) || key === 'name') continue;
    params[key] = parseLiteral(spec[key], scope);
  }

  scope.addScale(spec.name, params);
}

function parseLiteral(v, scope) {
  return !isObject(v) ? v
    : v.signal ? scope.signalRef(v.signal)
    : error('Unsupported object: ' + $$2(v));
}

function parseArray(v, scope) {
  return v.signal
    ? scope.signalRef(v.signal)
    : v.map(function(v) { return parseLiteral(v, scope); });
}

function dataLookupError(name) {
  error('Can not find data set: ' + $$2(name));
}

// -- SCALE DOMAIN ----

function parseScaleDomain(domain, spec, scope) {
  if (!domain) {
    if (spec.domainMin != null || spec.domainMax != null) {
      error('No scale domain defined for domainMin/domainMax to override.');
    }
    return; // default domain
  }

  return domain.signal ? scope.signalRef(domain.signal)
    : (isArray(domain) ? explicitDomain
    : domain.fields ? multipleDomain
    : singularDomain)(domain, spec, scope);
}

function explicitDomain(domain, spec, scope) {
  return domain.map(function(v) {
    return parseLiteral(v, scope);
  });
}

function singularDomain(domain, spec, scope) {
  var data = scope.getData(domain.data);
  if (!data) dataLookupError(domain.data);

  return isOrdinal(spec.type)
      ? data.valuesRef(scope, domain.field, parseSort(domain.sort, false))
      : isQuantile(spec.type) ? data.domainRef(scope, domain.field)
      : data.extentRef(scope, domain.field);
}

function multipleDomain(domain, spec, scope) {
  var data = domain.data,
      fields = domain.fields.reduce(function(dom, d) {
        d = isString(d) ? {data: data, field: d}
          : (isArray(d) || d.signal) ? fieldRef$1(d, scope)
          : d;
        return dom.push(d), dom;
      }, []);

  return (isOrdinal(spec.type) ? ordinalMultipleDomain
    : isQuantile(spec.type) ? quantileMultipleDomain
    : numericMultipleDomain)(domain, scope, fields);
}

function fieldRef$1(data, scope) {
  var name = '_:vega:_' + (FIELD_REF_ID++),
      coll = Collect$1({});

  if (isArray(data)) {
    coll.value = {$ingest: data};
  } else if (data.signal) {
    scope.signalRef('modify(' + $$2(name)
      + ',' + data.signal + ', true)');
  }
  scope.addDataPipeline(name, [coll, Sieve$1({})]);
  return {data: name, field: 'data'};
}

function ordinalMultipleDomain(domain, scope, fields) {
  var counts, a, c, v;

  // get value counts for each domain field
  counts = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.countsRef(scope, f.field);
  });

  // sum counts from all fields
  a = scope.add(Aggregate$1({
    groupby: keyFieldRef,
    ops:['sum'], fields: [scope.fieldRef('count')], as:['count'],
    pulse: counts
  }));

  // collect aggregate output
  c = scope.add(Collect$1({pulse: ref(a)}));

  // extract values for combined domain
  v = scope.add(Values$1({
    field: keyFieldRef,
    sort:  scope.sortRef(parseSort(domain.sort, true)),
    pulse: ref(c)
  }));

  return ref(v);
}

function parseSort(sort, multidomain) {
  if (sort) {
    if (!sort.field && !sort.op) {
      if (isObject(sort)) sort.field = 'key';
      else sort = {field: 'key'};
    } else if (!sort.field && sort.op !== 'count') {
      error('No field provided for sort aggregate op: ' + sort.op);
    } else if (multidomain && sort.field) {
      error('Multiple domain scales can not sort by field.');
    } else if (multidomain && sort.op && sort.op !== 'count') {
      error('Multiple domain scales support op count only.');
    }
  }
  return sort;
}

function quantileMultipleDomain(domain, scope, fields) {
  // get value arrays for each domain field
  var values = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.domainRef(scope, f.field);
  });

  // combine value arrays
  return ref(scope.add(MultiValues$1({values: values})));
}

function numericMultipleDomain(domain, scope, fields) {
  // get extents for each domain field
  var extents = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.extentRef(scope, f.field);
  });

  // combine extents
  return ref(scope.add(MultiExtent$1({extents: extents})));
}

// -- SCALE INTERPOLATION -----

function parseScaleInterpolate(interpolate, params) {
  params.interpolate = parseLiteral(interpolate.type || interpolate);
  if (interpolate.gamma != null) {
    params.interpolateGamma = parseLiteral(interpolate.gamma);
  }
}

// -- SCALE RANGE -----

function parseScaleRange(spec, scope, params) {
  var range = spec.range,
      config = scope.config.range;

  if (range.signal) {
    return scope.signalRef(range.signal);
  } else if (isString(range)) {
    if (config && config.hasOwnProperty(range)) {
      spec = extend({}, spec, {range: config[range]});
      return parseScaleRange(spec, scope, params);
    } else if (range === 'width') {
      range = [0, {signal: 'width'}]
    } else if (range === 'height') {
      range = isOrdinal(spec.type)
        ? [0, {signal: 'height'}]
        : [{signal: 'height'}, 0]
    } else {
      error('Unrecognized scale range value: ' + $$2(range));
    }
  } else if (range.scheme) {
    params.scheme = parseLiteral(range.scheme, scope);
    if (range.extent) params.schemeExtent = parseArray(range.extent, scope);
    if (range.count) params.schemeCount = parseLiteral(range.count, scope);
    return;
  } else if (range.step) {
    params.rangeStep = parseLiteral(range.step, scope);
    return;
  } else if (isOrdinal(spec.type) && !isArray(range)) {
    return parseScaleDomain(range, spec, scope);
  } else if (!isArray(range)) {
    error('Unsupported range type: ' + $$2(range));
  }

  return range.map(function(v) {
    return parseLiteral(v, scope);
  });
}

function parseTitle(spec, scope) {
  spec = isString(spec) ? {text: spec} : spec;

  var config = scope.config.title,
      encode = extend({}, spec.encode),
      datum, dataRef, title;

  // single-element data source for group title
  datum = {
    orient: spec.orient != null ? spec.orient : config.orient
  };
  dataRef = ref(scope.add(Collect$1(null, [datum])));

  // build title specification
  encode.name = spec.name;
  encode.interactive = spec.interactive;
  title = buildTitle(spec, config, encode, dataRef);
  if (spec.zindex) title.zindex = spec.zindex;

  // parse title specification
  return parseMark(title, scope);
}

function buildTitle(spec, config, userEncode, dataRef) {
  var title = spec.text,
      orient = spec.orient || config.orient,
      anchor = spec.anchor || config.anchor,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      horizontal = (orient === Top || orient === Bottom),
      extent = {group: (horizontal ? 'width' : 'height')},
      encode = {}, enter, update, pos, opp, mult, align;

  encode.enter = enter = {
    opacity: {value: 0}
  };
  addEncode(enter, 'fill', config.color);
  addEncode(enter, 'font', config.font);
  addEncode(enter, 'fontSize', config.fontSize);
  addEncode(enter, 'fontWeight', config.fontWeight);

  encode.exit = {
    opacity: {value: 0}
  };

  encode.update = update = {
    opacity: {value: 1},
    text: isObject(title) ? title : {value: title + ''},
    offset: encoder(spec.offset || 0)
  };

  (anchor === 'start') ? (mult = 0, align = 'left')
    : (anchor === 'end') ? (mult = 1, align = 'right')
    : (mult = 0.5, align = 'center');

  pos = {field: extent, mult: mult};

  opp = sign < 0 ? {value: 0}
    : horizontal ? {field: {group: 'height'}}
    : {field: {group: 'width'}};

  if (horizontal) {
    update.x = pos;
    update.y = opp;
    update.angle = {value: 0};
    update.baseline = {value: orient === Top ? 'bottom' : 'top'};
  } else {
    update.x = opp;
    update.y = pos;
    update.angle = {value: sign * 90};
    update.baseline = {value: 'bottom'};
  }
  update.align = {value: align};
  update.limit = {field: extent};

  addEncode(update, 'angle', config.angle);
  addEncode(update, 'baseline', config.baseline);
  addEncode(update, 'limit', config.limit);

  return guideMark(TextMark, TitleRole$1, null, dataRef, encode, userEncode);
}

function parseData$1(data, scope) {
  var transforms = [];

  if (data.transform) {
    data.transform.forEach(function(tx) {
      transforms.push(parseTransform(tx, scope));
    });
  }

  if (data.on) {
    data.on.forEach(function(on) {
      parseTrigger(on, scope, data.name);
    });
  }

  scope.addDataPipeline(data.name, analyze(data, scope, transforms));
}

/**
 * Analyze a data pipeline, add needed operators.
 */
function analyze(data, scope, ops) {
  // POSSIBLE TODOs:
  // - error checking for treesource on tree operators (BUT what if tree is upstream?)
  // - this is local analysis, perhaps some tasks better for global analysis...

  var output = [],
      source = null,
      modify = false,
      generate = false,
      upstream, i, n, t, m;

  if (data.values) {
    // hard-wired input data set
    output.push(source = collect({$ingest: data.values, $format: data.format}));
  } else if (data.url) {
    // load data from external source
    output.push(source = collect({$request: data.url, $format: data.format}));
  } else if (data.source) {
    // derives from another data set
    upstream = scope.getData(data.source);
    source = upstream.output;
    output.push(null); // populate later
  }

  // scan data transforms, add collectors as needed
  for (i=0, n=ops.length; i<n; ++i) {
    t = ops[i];
    m = t.metadata;

    if (!source && !m.source) {
      output.push(source = collect());
    }
    output.push(t);

    if (m.generates) generate = true;
    if (m.modifies && !generate) modify = true;

    if (m.source) source = t;
    else if (m.changes) source = null;
  }

  if (upstream) {
    output[0] = Relay$1({derive: modify, pulse: ref(upstream.output)});
    if (modify) output.splice(1, 0, collect()); // collect derived tuples
  }

  if (!source) output.push(collect());
  output.push(Sieve$1({}));
  return output;
}

function collect(values) {
  var s = Collect$1({}, values);
  return s.metadata = {source: true}, s;
}

function axisConfig(spec, scope) {
  var config = scope.config,
      orient = spec.orient,
      xy = (orient === Top || orient === Bottom) ? config.axisX : config.axisY,
      or = config['axis' + orient[0].toUpperCase() + orient.slice(1)],
      band = scope.scaleType(spec.scale) === 'band' && config.axisBand;

  return (xy || or || band)
    ? extend({}, config.axis, xy, or, band)
    : config.axis;
}

function axisDomain(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      zero = {value: 0},
      encode = {}, enter, update, u, u2, v;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'stroke', config.tickColor);
  addEncode(enter, 'strokeWidth', config.tickWidth);

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  (orient === Top || orient === Bottom)
    ? (u = 'x', v = 'y')
    : (u = 'y', v = 'x');
  u2 = u + '2',

  enter[v] = zero;
  update[u] = enter[u] = position(spec, 0);
  update[u2] = enter[u2] = position(spec, 1);

  return guideMark(RuleMark, AxisDomainRole, null, dataRef, encode, userEncode);
}

function position(spec, pos) {
  return {scale: spec.scale, range: pos};
}

function axisGrid(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      vscale = spec.gridScale,
      sign = (orient === Left || orient === Top) ? 1 : -1,
      offset = sign * spec.offset || 0,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickPos, u, v, v2, s;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'stroke', config.gridColor);
  addEncode(enter, 'strokeWidth', config.gridWidth);
  addEncode(enter, 'strokeDash', config.gridDash);

  encode.exit = exit = {
    opacity: zero
  };

  encode.update = update = {};
  addEncode(update, 'opacity', config.gridOpacity);

  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   config.bandPosition,
    round:  config.tickRound,
    extra:  config.tickExtra
  };

  (orient === Top || orient === Bottom)
    ? (u = 'x', v = 'y', s = 'height')
    : (u = 'y', v = 'x', s = 'width');
  v2 = v + '2',

  update[u] = enter[u] = exit[u] = tickPos;

  if (vscale) {
    enter[v] = {scale: vscale, range: 0, mult: sign, offset: offset};
    update[v2] = enter[v2] = {scale: vscale, range: 1, mult: sign, offset: offset};
  } else {
    enter[v] = {value: offset};
    update[v2] = enter[v2] = {signal: s, mult: sign, offset: offset};
  }

  return guideMark(RuleMark, AxisGridRole, Value, dataRef, encode, userEncode);
}

function axisTicks(spec, config, userEncode, dataRef, size) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickSize, tickPos;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'stroke', config.tickColor);
  addEncode(enter, 'strokeWidth', config.tickWidth);

  encode.exit = exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  tickSize = encoder(size);
  tickSize.mult = sign;

  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   config.bandPosition,
    round:  config.tickRound,
    extra:  config.tickExtra
  };

  if (orient === Top || orient === Bottom) {
    update.y = enter.y = zero;
    update.y2 = enter.y2 = tickSize;
    update.x = enter.x = exit.x = tickPos;
  } else {
    update.x = enter.x = zero;
    update.x2 = enter.x2 = tickSize;
    update.y = enter.y = exit.y = tickPos;
  }

  return guideMark(RuleMark, AxisTickRole, Value, dataRef, encode, userEncode);
}

function axisLabels(spec, config, userEncode, dataRef, size) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      pad = spec.labelPadding != null ? spec.labelPadding : config.labelPadding,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickSize, tickPos;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'angle', config.labelAngle);
  addEncode(enter, 'fill', config.labelColor);
  addEncode(enter, 'font', config.labelFont);
  addEncode(enter, 'fontSize', config.labelFontSize);
  addEncode(enter, 'limit', config.labelLimit);

  encode.exit = exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1},
    text: {field: Label}
  };

  tickSize = encoder(size);
  tickSize.mult = sign;
  tickSize.offset = encoder(pad);
  tickSize.offset.mult = sign;

  tickPos = {
    scale: spec.scale,
    field: Value,
    band: 0.5
  };

  if (orient === Top || orient === Bottom) {
    update.y = enter.y = tickSize;
    update.x = enter.x = exit.x = tickPos;
    addEncode(update, 'align', 'center');
    addEncode(update, 'baseline', orient === Top ? 'bottom' : 'top');
  } else {
    update.x = enter.x = tickSize;
    update.y = enter.y = exit.y = tickPos;
    addEncode(update, 'align', orient === Right ? 'left' : 'right');
    addEncode(update, 'baseline', 'middle');
  }

  return guideMark(TextMark, AxisLabelRole, Value, dataRef, encode, userEncode);
}

function axisTitle(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      title = spec.title,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      horizontal = (orient === Top || orient === Bottom),
      encode = {}, enter, update, titlePos;

  encode.enter = enter = {
    opacity: {value: 0}
  };
  addEncode(enter, 'align', config.titleAlign);
  addEncode(enter, 'fill', config.titleColor);
  addEncode(enter, 'font', config.titleFont);
  addEncode(enter, 'fontSize', config.titleFontSize);
  addEncode(enter, 'fontWeight', config.titleFontWeight);
  addEncode(enter, 'limit', config.titleLimit);

  encode.exit = {
    opacity: {value: 0}
  };

  encode.update = update = {
    opacity: {value: 1},
    text: title && title.signal ? {signal: title.signal} : {value: title + ''}
  };

  titlePos = {
    scale: spec.scale,
    range: 0.5
  };

  if (horizontal) {
    update.x = titlePos;
    update.angle = {value: 0};
    update.baseline = {value: orient === Top ? 'bottom' : 'top'};
  } else {
    update.y = titlePos;
    update.angle = {value: sign * 90};
    update.baseline = {value: 'bottom'};
  }

  addEncode(update, 'angle', config.titleAngle);
  addEncode(update, 'baseline', config.titleBaseline);

  !addEncode(update, 'x', config.titleX)
    && horizontal && !has(userEncode, 'x')
    && (encode.enter.auto = {value: true});

  !addEncode(update, 'y', config.titleY)
    && !horizontal && !has(userEncode, 'y')
    && (encode.enter.auto = {value: true});

  return guideMark(TextMark, AxisTitleRole, null, dataRef, encode, userEncode);
}

function parseAxis(spec, scope) {
  var config = axisConfig(spec, scope),
      name = spec.name || undefined,
      encode = spec.encode || {},
      interactive = !!spec.interactive,
      datum, dataRef, ticksRef, size, group, axisEncode, children;

  // single-element data source for axis group
  datum = {
    orient: spec.orient,
    ticks:  spec.ticks  != null ? !!spec.ticks  : config.ticks,
    labels: spec.labels != null ? !!spec.labels : config.labels,
    grid:   spec.grid   != null ? !!spec.grid   : config.grid,
    domain: spec.domain != null ? !!spec.domain : config.domain,
    title:  spec.title  != null
  };
  dataRef = ref(scope.add(Collect$1({}, [datum])));

  // encoding properties for axis group item
  axisEncode = extendEncode({
    update: {
      range:        {signal: 'abs(span(range("' + spec.scale + '")))'},
      offset:       encoder(spec.offset || 0),
      position:     encoder(spec.position || 0),
      titlePadding: encoder(spec.titlePadding || config.titlePadding),
      minExtent:    encoder(spec.minExtent || config.minExtent),
      maxExtent:    encoder(spec.maxExtent || config.maxExtent)
    }
  }, encode.axis);

  // data source for axis ticks
  ticksRef = ref(scope.add(AxisTicks$1({
    scale:  scope.scaleRef(spec.scale),
    extra:  config.tickExtra,
    count:  scope.property(spec.tickCount),
    values: scope.property(spec.values),
    formatSpecifier: scope.property(spec.format)
  })));

  // generate axis marks
  children = [];

  // include axis gridlines if requested
  if (datum.grid) {
    children.push(axisGrid(spec, config, encode.grid, ticksRef));
  }

  // include axis ticks if requested
  if (datum.ticks) {
    size = spec.tickSize != null ? spec.tickSize : config.tickSize;
    children.push(axisTicks(spec, config, encode.ticks, ticksRef, size));
  }

  // include axis labels if requested
  if (datum.labels) {
    size = datum.ticks ? size : 0;
    children.push(axisLabels(spec, config, encode.labels, ticksRef, size));
  }

  // include axis domain path if requested
  if (datum.domain) {
    children.push(axisDomain(spec, config, encode.domain, dataRef));
  }

  // include axis title if defined
  if (datum.title) {
    children.push(axisTitle(spec, config, encode.title, dataRef));
  }

  // build axis specification
  group = guideGroup(AxisRole$2, name, dataRef, interactive, axisEncode, children);
  if (spec.zindex) group.zindex = spec.zindex;

  // parse axis specification
  return parseMark(group, scope);
}

function parseSpec(spec, scope, preprocessed) {
  var signals = array(spec.signals);

  if (!preprocessed) signals.forEach(function(_) {
    parseSignal(_, scope);
  });

  array(spec.projections).forEach(function(_) {
    parseProjection(_, scope);
  });

  array(spec.data).forEach(function(_) {
    parseData$1(_, scope);
  });

  array(spec.scales).forEach(function(_) {
    parseScale(_, scope);
  });

  signals.forEach(function(_) {
    parseSignalUpdates(_, scope);
  });

  array(spec.axes).forEach(function(_) {
    parseAxis(_, scope);
  });

  array(spec.marks).forEach(function(_) {
    parseMark(_, scope);
  });

  array(spec.legends).forEach(function(_) {
    parseLegend(_, scope);
  });

  if (spec.title) {
    parseTitle(spec.title, scope);
  }

  return scope.parseLambdas(), scope;
}

var defined = toSet(['width', 'height', 'padding']);

function parseView(spec, scope) {
  var config = scope.config,
      op, input, encode, parent, root;

  scope.background = spec.background || config.background;
  root = ref(scope.root = scope.add(operator()));
  scope.addSignal('width', spec.width || -1);
  scope.addSignal('height', spec.height || -1);
  scope.addSignal('padding', parsePadding(spec.padding, config));

  array(spec.signals).forEach(function(_) {
    if (!defined[_.name]) parseSignal(_, scope);
  });

  // Store root group item
  input = scope.add(Collect$1());

  // Encode root group item
  encode = extendEncode({
    enter: { x: {value: 0}, y: {value: 0} },
    update: { width: {signal: 'width'}, height: {signal: 'height'} }
  }, spec.encode);

  encode = scope.add(Encode$1(
    encoders(encode, GroupMark, FrameRole$1, scope, {pulse: ref(input)}))
  );

  // Perform view layout
  parent = scope.add(ViewLayout$1({
    layout:       scope.objectProperty(spec.layout),
    legendMargin: config.legendMargin,
    autosize:     parseAutosize(spec.autosize, config),
    mark:         root,
    pulse:        ref(encode)
  }));
  scope.operators.pop();

  // Parse remainder of specification
  scope.pushState(ref(encode), ref(parent), null);
  parseSpec(spec, scope, true);
  scope.operators.push(parent);

  // Bound / render / sieve root item
  op = scope.add(Bound$1({mark: root, pulse: ref(parent)}));
  op = scope.add(Render$1({pulse: ref(op)}));
  op = scope.add(Sieve$1({pulse: ref(op)}));

  // Track metadata for root item
  scope.addData('root', new DataScope(scope, input, input, op));

  return scope;
}

function Scope(config) {
  this.config = config;

  this.bindings = [];
  this.field = {};
  this.signals = {};
  this.lambdas = {};
  this.scales = {};
  this.events = {};
  this.data = {};

  this.streams = [];
  this.updates = [];
  this.operators = [];
  this.background = null;

  this._id = 0;
  this._subid = 0;
  this._nextsub = [0];

  this._parent = [];
  this._encode = [];
  this._lookup = [];
  this._markpath = [];
}

function Subscope(scope) {
  this.config = scope.config;

  this.field = Object.create(scope.field);
  this.signals = Object.create(scope.signals);
  this.lambdas = Object.create(scope.lambdas);
  this.scales = Object.create(scope.scales);
  this.events = Object.create(scope.events);
  this.data = Object.create(scope.data);

  this.streams = [];
  this.updates = [];
  this.operators = [];

  this._id = 0;
  this._subid = ++scope._nextsub[0];
  this._nextsub = scope._nextsub;

  this._parent = scope._parent.slice();
  this._encode = scope._encode.slice();
  this._lookup = scope._lookup.slice();
  this._markpath = scope._markpath;
}

var prototype$73 = Scope.prototype = Subscope.prototype;

// ----

prototype$73.fork = function() {
  return new Subscope(this);
};

prototype$73.toRuntime = function() {
  return this.finish(), {
    background: this.background,
    operators:  this.operators,
    streams:    this.streams,
    updates:    this.updates,
    bindings:   this.bindings
  };
};

prototype$73.id = function() {
  return (this._subid ? this._subid + ':' : 0) + this._id++;
};

prototype$73.add = function(op) {
  this.operators.push(op);
  op.id = this.id();
  // if pre-registration references exist, resolve them now
  if (op.refs) {
    op.refs.forEach(function(ref) { ref.$ref = op.id; });
    op.refs = null;
  }
  return op;
};

prototype$73.proxy = function(op) {
  var vref = op instanceof Entry ? ref(op) : op;
  return this.add(Proxy$1({value: vref}));
};

prototype$73.addStream = function(stream) {
  return this.streams.push(stream), stream.id = this.id(), stream;
};

prototype$73.addUpdate = function(update) {
  return this.updates.push(update), update;
};

// Apply metadata
prototype$73.finish = function() {
  var name, ds;

  // annotate root
  if (this.root) this.root.root = true;

  // annotate signals
  for (name in this.signals) {
    this.signals[name].signal = name;
  }

  // annotate scales
  for (name in this.scales) {
    this.scales[name].scale = name;
  }

  // annotate data sets
  function annotate(op, name, type) {
    var data, list;
    if (op) {
      data = op.data || (op.data = {});
      list = data[name] || (data[name] = []);
      list.push(type);
    }
  }
  for (name in this.data) {
    ds = this.data[name];
    annotate(ds.input,  name, 'input');
    annotate(ds.output, name, 'output');
    annotate(ds.values, name, 'values');
    for (var field in ds.index) {
      annotate(ds.index[field], name, 'index:' + field);
    }
  }

  return this;
};

// ----

prototype$73.pushState = function(encode, parent, lookup) {
  this._encode.push(ref(this.add(Sieve$1({pulse: encode}))));
  this._parent.push(parent);
  this._lookup.push(lookup ? ref(this.proxy(lookup)) : null);
  this._markpath.push(-1);
};

prototype$73.popState = function() {
  this._encode.pop();
  this._parent.pop();
  this._lookup.pop();
  this._markpath.pop();
};

prototype$73.parent = function() {
  return peek(this._parent);
};

prototype$73.encode = function() {
  return peek(this._encode);
};

prototype$73.lookup = function() {
  return peek(this._lookup);
};

prototype$73.markpath = function() {
  var p = this._markpath;
  return ++p[p.length-1];
};

// ----

prototype$73.fieldRef = function(field, name) {
  if (isString(field)) return fieldRef(field, name);
  if (!field.signal) {
    error('Unsupported field reference: ' + $$2(field));
  }

  var s = field.signal,
      f = this.field[s],
      params;

  if (!f) { // TODO: replace with update signalRef?
    params = {name: this.signalRef(s)}
    if (name) params.as = name;
    this.field[s] = f = ref(this.add(Field$1(params)));
  }
  return f;
};

prototype$73.compareRef = function(cmp) {
  function check(_) {
    return isSignal(_) ? (signal = true, ref(sig[_.signal])) : _;
  }

  var sig = this.signals,
      signal = false,
      fields = array(cmp.field).map(check),
      orders = array(cmp.order).map(check);

  return signal
    ? ref(this.add(Compare$1({fields: fields, orders: orders})))
    : compareRef(fields, orders);
};

prototype$73.keyRef = function(fields) {
  function check(_) {
    return isSignal(_) ? (signal = true, ref(sig[_.signal])) : _;
  }

  var sig = this.signals,
      signal = false;
  fields = array(fields).map(check);

  return signal
    ? ref(this.add(Key$1({fields: fields})))
    : keyRef(fields);
};

prototype$73.sortRef = function(sort) {
  if (!sort) return sort;

  // including id ensures stable sorting
  // TODO review? enable multi-field sorts?
  var a = [aggrField(sort.op, sort.field), '_id'],
      o = sort.order || Ascending;

  return o.signal
    ? ref(this.add(Compare$1({
        fields: a,
        orders: [o = this.signalRef(o.signal), o]
      })))
    : compareRef(a, [o, o]);
};

// ----

prototype$73.event = function(source, type) {
  var key = source + ':' + type;
  if (!this.events[key]) {
    var id = this.id();
    this.streams.push({
      id: id,
      source: source,
      type: type
    });
    this.events[key] = id;
  }
  return this.events[key];
};

// ----

prototype$73.addSignal = function(name, value) {
  if (this.signals.hasOwnProperty(name)) {
    error('Duplicate signal name: ' + $$2(name));
  }
  var op = value instanceof Entry ? value : this.add(operator(value));
  return this.signals[name] = op;
};

prototype$73.getSignal = function(name) {
  if (!this.signals[name]) {
    error('Unrecognized signal name: ' + $$2(name));
  }
  return this.signals[name];
};

prototype$73.signalRef = function(s) {
  if (this.signals[s]) {
    return ref(this.signals[s]);
  } else if (!this.lambdas[s]) {
    this.lambdas[s] = this.add(operator(null));
  }
  return ref(this.lambdas[s]);
};

prototype$73.parseLambdas = function() {
  var code = Object.keys(this.lambdas);
  for (var i=0, n=code.length; i<n; ++i) {
    var s = code[i],
        e = parseExpression(s, this),
        op = this.lambdas[s];
    op.params = e.$params;
    op.update = e.$expr;
  }
};

prototype$73.property = function(spec) {
  return spec && spec.signal ? this.signalRef(spec.signal) : spec;
};

prototype$73.objectProperty = function(spec) {
  return (!spec || !isObject(spec)) ? spec
    : this.signalRef(spec.signal || objectLambda(spec));
};

function objectLambda(obj) {
  var code = '{',
      i = 0,
      key, value;

  for (key in obj) {
    value = obj[key];
    code += (++i > 1 ? ',' : '')
      + $$2(key) + ':'
      + (isObject(value)
        ? (value.signal || objectLambda(value))
        : $$2(value));
  }
  return code + '}';
}

prototype$73.addBinding = function(name, bind) {
  if (!this.bindings) {
    error('Nested signals do not support binding: ' + $$2(name));
  }
  this.bindings.push(extend({signal: name}, bind));
};

// ----

prototype$73.addScaleProj = function(name, transform) {
  if (this.scales.hasOwnProperty(name)) {
    error('Duplicate scale or projection name: ' + $$2(name));
  }
  this.scales[name] = this.add(transform);
}

prototype$73.addScale = function(name, params) {
  this.addScaleProj(name, Scale$1(params));
};

prototype$73.addProjection = function(name, params) {
  this.addScaleProj(name, Projection$1(params));
};

prototype$73.getScale = function(name) {
  if (!this.scales[name]) {
    error('Unrecognized scale name: ' + $$2(name));
  }
  return this.scales[name];
};

prototype$73.projectionRef =
prototype$73.scaleRef = function(name) {
  return ref(this.getScale(name));
};

prototype$73.projectionType =
prototype$73.scaleType = function(name) {
  return this.getScale(name).params.type;
};

// ----

prototype$73.addData = function(name, dataScope) {
  if (this.data.hasOwnProperty(name)) {
    error('Duplicate data set name: ' + $$2(name));
  }
  return (this.data[name] = dataScope);
};

prototype$73.getData = function(name) {
  if (!this.data[name]) {
    error('Undefined data set name: ' + $$2(name));
  }
  return this.data[name];
};

prototype$73.addDataPipeline = function(name, entries) {
  if (this.data.hasOwnProperty(name)) {
    error('Duplicate data set name: ' + $$2(name));
  }
  return this.addData(name, DataScope.fromEntries(this, entries));
};

function defaults(userConfig) {
  var config = defaults$1(), key;
  for (key in userConfig) {
    config[key] = isObject(config[key])
      ? extend(config[key], userConfig[key])
      : config[key] = userConfig[key];
  }
  return config;
}

var defaultSymbolSize = 30;
var defaultStrokeWidth = 2;
var defaultColor = '#4c78a8';
var black = "#000";
var gray = '#888';
var lightGray = '#ddd';
/**
 * Standard configuration defaults for Vega specification parsing.
 * Users can provide their own (sub-)set of these default values
 * by passing in a config object to the top-level parse method.
 */
function defaults$1() {
  return {
    // default padding around visualization
    padding: 0,

    // default for automatic sizing; options: "none", "pad", "fit"
    // or provide an object (e.g., {"type": "pad", "resize": true})
    autosize: 'pad',

    // default view background color
    // covers the entire view component
    background: null,

    // defaults for top-level group marks
    // accepts mark properties (fill, stroke, etc)
    // covers the data rectangle within group width/height
    group: null,

    // defaults for basic mark types
    // each subset accepts mark properties (fill, stroke, etc)
    mark: null,
    arc: { fill: defaultColor },
    area: { fill: defaultColor },
    image: null,
    line: {
      stroke: defaultColor,
      strokeWidth: defaultStrokeWidth
    },
    path: { stroke: defaultColor },
    rect: { fill: defaultColor },
    rule: { stroke: black },
    shape: { stroke: defaultColor },
    symbol: {
      fill: defaultColor,
      size: 64
    },
    text: {
      fill: black,
      font: 'sans-serif',
      fontSize: 11
    },

    // defaults for marks using special roles
    point: {
      size: defaultSymbolSize,
      strokeWidth: defaultStrokeWidth,
      shape: 'circle'
    },
    circle: {
      size: defaultSymbolSize,
      strokeWidth: defaultStrokeWidth
    },
    square: {
      size: defaultSymbolSize,
      strokeWidth: defaultStrokeWidth
    },

    // defaults for axes
    axis: {
      minExtent: 0,
      maxExtent: 200,
      bandPosition: 0.5,
      domain: true,
      domainWidth: 1,
      domainColor: black,
      grid: false,
      gridWidth: 1,
      gridColor: lightGray,
      gridDash: [],
      gridOpacity: 1,
      labels: true,
      labelAngle: 0,
      labelColor: black,
      labelFont: 'sans-serif',
      labelFontSize: 10,
      labelPadding: 2,
      labelLimit: 180,
      ticks: true,
      tickRound: true,
      tickSize: 5,
      tickWidth: 1,
      tickColor: black,
      titleAlign: 'center',
      titlePadding: 2,
      titleColor: black,
      titleFont: 'sans-serif',
      titleFontSize: 11,
      titleFontWeight: 'bold'
    },

    // defaults for legends
    legend: {
      orient: 'right',
      offset: 18,
      padding: 0,
      entryPadding: 5,
      titlePadding: 5,
      gradientWidth: 100,
      gradientHeight: 20,
      gradientStrokeColor: lightGray,
      gradientStrokeWidth: 0,
      gradientLabelBaseline: 'top',
      gradientLabelOffset: 2,
      labelColor: black,
      labelFontSize: 10,
      labelFont: 'sans-serif',
      labelAlign: 'left',
      labelBaseline: 'middle',
      labelOffset: 8,
      labelLimit: 160,
      symbolType: 'circle',
      symbolSize: 100,
      symbolColor: gray,
      symbolStrokeWidth: 1.5,
      titleColor: black,
      titleFont: 'sans-serif',
      titleFontSize: 11,
      titleFontWeight: 'bold',
      titleAlign: 'left',
      titleBaseline: 'top',
      titleLimit: 180
    },

    // defaults for group title
    title: {
      orient: 'top',
      anchor: 'middle',
      offset: 2,
      color: black,
      font: 'sans-serif',
      fontSize: 13,
      fontWeight: 'bold'
    },

    // defaults for scale ranges
    range: {
      category: {
        scheme: 'tableau10'
      },
      ordinal: {
        scheme: 'blues',
        extent: [0.2, 1]
      },
      heatmap: {
        scheme: 'viridis'
      },
      ramp: {
        scheme: 'blues',
        extent: [0.2, 1]
      },
      diverging: {
        scheme: 'blueorange'
      },
      symbol: [
        'circle',
        'square',
        'triangle-up',
        'cross',
        'diamond',
        'triangle-right',
        'triangle-down',
        'triangle-left'
      ]
    }
  };
}

function parse$2(spec, config) {
  return parseView(spec, new Scope(defaults(config || spec.config)))
    .toRuntime();
}

/**
 * Parse an expression given the argument signature and body code.
 */
function expression$1(args, code, ctx) {
  // wrap code in return statement if expression does not terminate
  if (code[code.length-1] !== ';') {
    code = 'return(' + code + ');';
  }
  var fn = Function.apply(null, args.concat(code));
  return ctx && ctx.functions ? fn.bind(ctx.functions) : fn;
}

/**
 * Parse an expression used to update an operator value.
 */
function operatorExpression(code, ctx) {
  return expression$1(['_'], code, ctx);
}

/**
 * Parse an expression provided as an operator parameter value.
 */
function parameterExpression(code, ctx) {
  return expression$1(['datum', '_'], code, ctx);
}

/**
 * Parse an expression applied to an event stream.
 */
function eventExpression(code, ctx) {
  return expression$1(['event'], code, ctx);
}

/**
 * Parse an expression used to handle an event-driven operator update.
 */
function handlerExpression(code, ctx) {
  return expression$1(['_', 'event'], code, ctx);
}

/**
 * Parse an expression that performs visual encoding.
 */
function encodeExpression(code, ctx) {
  return expression$1(['item', '_'], code, ctx);
}

/**
 * Parse a set of operator parameters.
 */
function parseParameters$1(spec, ctx, params) {
  params = params || {};
  var key, value;

  for (key in spec) {
    value = spec[key];

    if (value && value.$expr && value.$params) {
      // if expression, parse its parameters
      parseParameters$1(value.$params, ctx, params);
    }

    params[key] = isArray(value)
      ? value.map(function(v) { return parseParameter$2(v, ctx); })
      : parseParameter$2(value, ctx);
  }
  return params;
}

/**
 * Parse a single parameter.
 */
function parseParameter$2(spec, ctx) {
  if (!spec || !isObject(spec)) return spec;

  for (var i=0, n=PARSERS.length, p; i<n; ++i) {
    p = PARSERS[i];
    if (spec.hasOwnProperty(p.key)) {
      return p.parse(spec, ctx);
    }
  }
  return spec;
}

/** Reference parsers. */
var PARSERS = [
  {key: '$ref',      parse: getOperator},
  {key: '$key',      parse: getKey},
  {key: '$expr',     parse: getExpression},
  {key: '$field',    parse: getField$1},
  {key: '$encode',   parse: getEncode},
  {key: '$compare',  parse: getCompare},
  {key: '$context',  parse: getContext},
  {key: '$subflow',  parse: getSubflow}
];

/**
 * Resolve an operator reference.
 */
function getOperator(_, ctx) {
  return ctx.get(_.$ref) || error('Operator not defined: ' + _.$ref);
}

/**
 * Resolve an expression reference.
 */
function getExpression(_, ctx) {
  var k = 'e:' + _.$expr;
  return ctx.fn[k]
    || (ctx.fn[k] = accessor(parameterExpression(_.$expr, ctx), _.$fields, _.$name));
}

/**
 * Resolve a key accessor reference.
 */
function getKey(_, ctx) {
  var k = 'k:' + _.$key;
  return ctx.fn[k] || (ctx.fn[k] = key(_.$key));
}

/**
 * Resolve a field accessor reference.
 */
function getField$1(_, ctx) {
  var k = 'f:' + _.$field + '_' + _.$name;
  return ctx.fn[k] || (ctx.fn[k] = field(_.$field, _.$name));
}

/**
 * Resolve a comparator function reference.
 */
function getCompare(_, ctx) {
  var k = 'c:' + _.$compare + '_' + _.$order;
  return ctx.fn[k] || (ctx.fn[k] = compare(_.$compare, _.$order));
}

/**
 * Resolve an encode operator reference.
 */
function getEncode(_, ctx) {
  var spec = _.$encode,
      encode = {}, name, enc;

  for (name in spec) {
    enc = spec[name];
    encode[name] = accessor(encodeExpression(enc.$expr, ctx), enc.$fields);
    encode[name].output = enc.$output;
  }
  return encode;
}

/**
 * Resolve an context reference.
 */
function getContext(_, ctx) {
  return ctx;
}

/**
 * Resolve a recursive subflow specification.
 */
function getSubflow(_, ctx) {
  var spec = _.$subflow;
  return function(dataflow, key, parent) {
    var subctx = parseDataflow(spec, ctx.fork()),
        op = subctx.get(spec.operators[0].id),
        p = subctx.signals.parent;
    if (p) p.set(parent);
    return op;
  };
}

/**
 * Parse a dataflow operator.
 */
function parseOperator(spec, ctx) {
  if (spec.type === 'Operator' || !spec.type) {
    ctx.operator(spec,
      spec.update ? operatorExpression(spec.update, ctx) : null);
  } else {
    ctx.transform(spec, spec.type);
  }
}

/**
 * Parse and assign operator parameters.
 */
function parseOperatorParameters(spec, ctx) {
  var op, params;
  if (spec.params) {
    if (!(op = ctx.get(spec.id))) {
      error('Invalid operator id: ' + spec.id);
    }
    params = parseParameters$1(spec.params, ctx);
    ctx.dataflow.connect(op, op.parameters(params));
  }
}

/**
 * Parse an event stream specification.
 */
function parseStream$3(spec, ctx) {
  var filter = spec.filter != null ? eventExpression(spec.filter, ctx) : undefined,
      stream = spec.stream != null ? ctx.get(spec.stream) : undefined,
      args;

  if (spec.source) {
    stream = ctx.events(spec.source, spec.type, filter);
  }
  else if (spec.merge) {
    args = spec.merge.map(ctx.get.bind(ctx));
    stream = args[0].merge.apply(args[0], args.slice(1));
  }

  if (spec.between) {
    args = spec.between.map(ctx.get.bind(ctx));
    stream = stream.between(args[0], args[1]);
  }

  if (spec.filter) {
    stream = stream.filter(filter);
  }

  if (spec.throttle != null) {
    stream = stream.throttle(+spec.throttle);
  }

  if (spec.debounce != null) {
    stream = stream.debounce(+spec.debounce);
  }

  if (stream == null) {
    error('Invalid stream definition: ' + JSON.stringify(spec));
  }

  if (spec.consume) stream.consume(true);

  ctx.stream(spec, stream);
}

/**
 * Parse an event-driven operator update.
 */
function parseUpdate$1(spec, ctx) {
  var source = ctx.get(spec.source),
      target = null,
      update = spec.update,
      params = undefined;

  if (!source) error('Source not defined: ' + spec.source);

  if (spec.target && spec.target.$expr) {
    target = eventExpression(spec.target.$expr, ctx);
  } else {
    target = ctx.get(spec.target);
  }

  if (update && update.$expr) {
    if (update.$params) {
      params = parseParameters$1(update.$params, ctx);
    }
    update = handlerExpression(update.$expr, ctx);
  }

  ctx.update(spec, source, target, update, params);
}

/**
 * Parse a serialized dataflow specification.
 */
function parseDataflow(spec, ctx) {
  var operators = spec.operators || [];

  // parse background
  if (spec.background) {
    ctx.background = spec.background;
  }

  // parse operators
  operators.forEach(function(entry) {
    parseOperator(entry, ctx);
  });

  // parse operator parameters
  operators.forEach(function(entry) {
    parseOperatorParameters(entry, ctx);
  });

  // parse streams
  (spec.streams || []).forEach(function(entry) {
    parseStream$3(entry, ctx);
  });

  // parse updates
  (spec.updates || []).forEach(function(entry) {
    parseUpdate$1(entry, ctx);
  });

  return ctx.resolve();
}

var SKIP$3 = {skip: true};

function getState(options) {
  var ctx = this,
      state = {};

  if (options.signals) {
    var signals = (state.signals = {});
    Object.keys(ctx.signals).forEach(function(key) {
      var op = ctx.signals[key];
      if (options.signals(key, op)) {
        signals[key] = op.value;
      }
    });
  }

  if (options.data) {
    var data = (state.data = {});
    Object.keys(ctx.data).forEach(function(key) {
      var dataset = ctx.data[key];
      if (options.data(key, dataset)) {
        data[key] = dataset.input.value;
      }
    });
  }

  if (ctx.subcontext && options.recurse !== false) {
    state.subcontext = ctx.subcontext.map(function(ctx) {
      return ctx.getState(options);
    });
  }

  return state;
}

function setState(state) {
  var ctx = this,
      df = ctx.dataflow,
      data = state.data,
      signals = state.signals;

  Object.keys(signals || {}).forEach(function(key) {
    df.update(ctx.signals[key], signals[key], SKIP$3);
  });

  Object.keys(data || {}).forEach(function(key) {
    df.pulse(
      ctx.data[key].input,
      df.changeset().remove(truthy).insert(data[key])
    );
  });

  (state.subcontext  || []).forEach(function(substate, i) {
    var ctx = ctx.subcontext[i];
    if (ctx) ctx.setState(substate);
  });
}

/**
 * Context objects store the current parse state.
 * Enables lookup of parsed operators, event streams, accessors, etc.
 * Provides a 'fork' method for creating child contexts for subflows.
 */
function context$2(df, transforms, functions) {
  return new Context(df, transforms, functions);
}

function Context(df, transforms, functions) {
  this.dataflow = df;
  this.transforms = transforms;
  this.events = df.events.bind(df);
  this.signals = {};
  this.scales = {};
  this.nodes = {};
  this.data = {};
  this.fn = {};
  if (functions) {
    this.functions = Object.create(functions);
    this.functions.context = this;
  }
}

function ContextFork(ctx) {
  this.dataflow = ctx.dataflow;
  this.transforms = ctx.transforms;
  this.functions = ctx.functions;
  this.events = ctx.events;
  this.signals = Object.create(ctx.signals);
  this.scales = Object.create(ctx.scales);
  this.nodes = Object.create(ctx.nodes);
  this.data = Object.create(ctx.data);
  this.fn = Object.create(ctx.fn);
  if (ctx.functions) {
    this.functions = Object.create(ctx.functions);
    this.functions.context = this;
  }
}

Context.prototype = ContextFork.prototype = {
  fork: function() {
    var ctx = new ContextFork(this);
    (this.subcontext || (this.subcontext = [])).push(ctx);
    return ctx;
  },
  get: function(id) {
    return this.nodes[id];
  },
  set: function(id, node) {
    return this.nodes[id] = node;
  },
  add: function(spec, op) {
    var ctx = this,
        df = ctx.dataflow,
        data;

    ctx.set(spec.id, op);

    if (spec.type === 'Collect' && (data = spec.value)) {
      if (data.$ingest) {
        df.ingest(op, data.$ingest, data.$format);
      } else if (data.$request) {
        df.request(op, data.$request, data.$format);
      } else {
        df.pulse(op, df.changeset().insert(data));
      }
    }

    if (spec.root) {
      ctx.root = op;
    }

    if (spec.parent) {
      var p = ctx.get(spec.parent.$ref);
      if (p) {
        df.connect(p, [op]);
        op.targets().add(p);
      } else {
        (ctx.unresolved = ctx.unresolved || []).push(function() {
          p = ctx.get(spec.parent.$ref);
          df.connect(p, [op]);
          op.targets().add(p);
        });
      }
    }

    if (spec.signal) {
      ctx.signals[spec.signal] = op;
    }

    if (spec.scale) {
      ctx.scales[spec.scale] = op;
    }

    if (spec.data) {
      for (var name in spec.data) {
        data = ctx.data[name] || (ctx.data[name] = {});
        spec.data[name].forEach(function(role) { data[role] = op; });
      }
    }
  },
  resolve: function() {
    (this.unresolved || []).forEach(function(fn) { fn(); });
    delete this.unresolved;
    return this;
  },
  operator: function(spec, update, params) {
    this.add(spec, this.dataflow.add(spec.value, update, params, spec.react));
  },
  transform: function(spec, type, params) {
    this.add(spec, this.dataflow.add(this.transforms[type], params));
  },
  stream: function(spec, stream) {
    this.set(spec.id, stream);
  },
  update: function(spec, stream, target, update, params) {
    this.dataflow.on(stream, target, update, params, spec.options);
  },
  getState: getState,
  setState: setState
};

function runtime(view, spec, functions) {
  var fn = functions || functionContext;
  return parseDataflow(spec, context$2(view, transforms, fn));
}

function resizer(view, field) {
  var op = view.add(null,
    function(_) {
      view['_' + field] = _.size;
      view._autosize = view._resize = 1;
    },
    {size: view._signals[field]}
  );
  // set rank to ensure operator runs as soon as possible
  // size parameters should be reset prior to view layout
  return op.rank = 0, op;
}

function autosize(viewWidth, viewHeight, width, height, origin, auto) {
  this.runAfter(function(view) {
    var rerun = 0;

    // reset autosize flag
    view._autosize = 0;

    // width value changed: update signal, skip resize op
    if (view.width() !== width) {
      rerun = 1;
      view.width(width);
      view._resizeWidth.skip(true);
    }

    // height value changed: update signal, skip resize op
    if (view.height() !== height) {
      rerun = 1;
      view.height(height);
      view._resizeHeight.skip(true);
    }

    // view width changed: update view property, set resize flag
    if (view._width !== viewWidth) {
      view._resize = 1;
      view._width = viewWidth;
    }

    // view height changed: update view property, set resize flag
    if (view._height !== viewHeight) {
      view._resize = 1;
      view._height = viewHeight;
    }

    // origin changed: update view property, set resize flag
    if (view._origin[0] !== origin[0] || view._origin[1] !== origin[1]) {
      view._resize = 1;
      view._origin = origin;
    }

    // run dataflow on width/height signal change
    if (rerun) view.run('enter');
    if (auto) view.runAfter(function() { view._autosize = 1; });
  });
}

/**
 * Get the current view state, consisting of signal values and/or data sets.
 * @param {object} [options] - Options flags indicating which state to export.
 *   If unspecified, all signals and data sets will be exported.
 * @param {function(string, Operator):boolean} [options.signals] - Optional
 *   predicate function for testing if a signal should be included in the
 *   exported state. If unspecified, all signals will be included, except for
 *   those named 'parent' or those which refer to a Transform value.
 * @param {function(string, object):boolean} [options.data] - Optional
 *   predicate function for testing if a data set's input should be included
 *   in the exported state. If unspecified, all data sets that have been
 *   explicitly modified will be included.
 * @param {boolean} [options.recurse=true] - Flag indicating if the exported
 *   state should recursively include state from group mark sub-contexts.
 * @return {object} - An object containing the exported state values.
 */
function getState$1(options) {
  return this._runtime.getState(options || {
    data:    dataTest,
    signals: signalTest,
    recurse: true
  });
}

function dataTest(name, data) {
  return data.modified
      && isArray(data.input.value)
      && name.indexOf('_:vega:_');
}

function signalTest(name, op) {
  return !(name === 'parent' || op instanceof transforms.Proxy);
}

/**
 * Sets the current view state and updates the view by invoking run.
 * @param {object} state - A state object containing signal and/or
 *   data set values, following the format used by the getState method.
 * @return {View} - This view instance.
 */
function setState$1(state) {
  var view = this;
  view._trigger = false;
  view._runtime.setState(state);
  view.run().runAfter(function() { view._trigger = true; });
  return this;
}

/**
 * Create a new View instance from a Vega dataflow runtime specification.
 * The generated View will not immediately be ready for display. Callers
 * should also invoke the initialize method (e.g., to set the parent
 * DOM element in browser-based deployment) and then invoke the run
 * method to evaluate the dataflow graph. Rendering will automatically
 * be peformed upon dataflow runs.
 * @constructor
 * @param {object} spec - The Vega dataflow runtime specification.
 */
function View(spec, options) {
  options = options || {};

  Dataflow.call(this);
  this.loader(options.loader || this._loader);
  this.logLevel(options.logLevel || 0);

  this._el = null;
  this._renderType = options.renderer || RenderType.Canvas;
  this._scenegraph = new Scenegraph();
  var root = this._scenegraph.root;

  // initialize renderer and render queue
  this._renderer = null;
  this._queue = null;

  // initialize handler and event management
  this._handler = new CanvasHandler().scene(root);
  this._eventListeners = [];
  this._preventDefault = true;

  // initialize dataflow graph
  var ctx = runtime(this, spec, options.functions);
  this._runtime = ctx;
  this._signals = ctx.signals;
  this._bind = (spec.bindings || []).map(function(_) {
    return {
      state: null,
      param: extend({}, _)
    };
  });

  // initialize scenegraph
  if (ctx.root) ctx.root.set(root);
  root.source = ctx.data.root.input;
  this.pulse(
    ctx.data.root.input,
    this.changeset().insert(root.items)
  );

  // initialize background color
  this._background = ctx.background || null;

  // initialize view size
  this._width = this.width();
  this._height = this.height();
  this._origin = [0, 0];
  this._resize = 0;
  this._autosize = 1;

  // initialize resize operators
  this._resizeWidth = resizer(this, 'width');
  this._resizeHeight = resizer(this, 'height');

  // initialize cursor
  cursor(this);
}

var prototype$71 = inherits(View, Dataflow);

// -- DATAFLOW / RENDERING ----

prototype$71.run = function(encode) {
  Dataflow.prototype.run.call(this, encode);

  var q = this._queue;
  if (this._resize || !q || q.length) {
    this.render(q);
    this._queue = [];
  }

  return this;
};

prototype$71.render = function(update) {
  if (this._renderer) {
    if (this._resize) this._resize = 0, resizeRenderer(this);
    this._renderer.render(this._scenegraph.root, update);
  }
  return this;
};

prototype$71.enqueue = function(items) {
  if (this._queue && items && items.length) {
    this._queue = this._queue.concat(items);
  }
};

// -- GET / SET ----

function lookupSignal(view, name) {
  return view._signals.hasOwnProperty(name)
    ? view._signals[name]
    : view.error('Unrecognized signal name: ' + $$2(name));
}

prototype$71.signal = function(name, value, options) {
  var op = lookupSignal(this, name);
  return arguments.length === 1
    ? op.value
    : this.update(op, value, options);
};

prototype$71.scenegraph = function() {
  return this._scenegraph;
};

prototype$71.background = function(_) {
  return arguments.length ? (this._background = _, this._resize = 1, this) : this._background;
};

prototype$71.width = function(_) {
  return arguments.length ? this.signal('width', _) : this.signal('width');
};

prototype$71.height = function(_) {
  return arguments.length ? this.signal('height', _) : this.signal('height');
};

prototype$71.padding = function(_) {
  return arguments.length ? this.signal('padding', _) : this.signal('padding');
};

prototype$71.renderer = function(type) {
  if (!arguments.length) return this._renderType;
  if (!renderModule(type)) this.error('Unrecognized renderer type: ' + type);
  if (type !== this._renderType) {
    this._renderType = type;
    if (this._renderer) {
      this._renderer = this._queue = null;
      this.initialize(this._el);
    }
  }
  return this;
};

prototype$71.loader = function(loader) {
  if (!arguments.length) return this._loader;
  if (loader !== this._loader) {
    Dataflow.prototype.loader.call(this, loader);
    if (this._renderer) {
      this._renderer = this._queue = null;
      this.initialize(this._el);
    }
  }
  return this;
};

// -- EVENT HANDLING ----

prototype$71.addEventListener = function(type, handler) {
  this._handler.on(type, handler);
};

prototype$71.removeEventListener = function(type, handler) {
  this._handler.off(type, handler);
};

prototype$71.addSignalListener = function(name, handler) {
  var s = lookupSignal(this, name),
      h = function() { handler(name, s.value); };
  this.on(s, null, (h.handler = handler, h));
};

prototype$71.removeSignalListener = function(name, handler) {
  var s = lookupSignal(this, name),
      t = s._targets || [],
      h = t.filter(function(op) {
            var u = op._update;
            return u && u.handler === handler;
          });
  if (h.length) t.remove(h[0]);
};

prototype$71.preventDefault = function(_) {
  return arguments.length ? (this._preventDefault = _, this) : this._preventDefault;
};

prototype$71.tooltipHandler = function(_) {
  var h = this._handler;
  return !arguments.length ? h.handleTooltip
    : (h.handleTooltip = (_ || Handler.prototype.handleTooltip), this);
};

prototype$71.events = events$1;
prototype$71.finalize = finalize;
prototype$71.hover = hover;

// -- SIZING ----
prototype$71.autosize = autosize;

// -- DATA ----
prototype$71.data = data;
prototype$71.change = change;
prototype$71.insert = insert;
prototype$71.remove = remove;

// -- INITIALIZATION ----
prototype$71.initialize = initialize$1;

// -- HEADLESS RENDERING ----
prototype$71.toImageURL = renderToImageURL;
prototype$71.toCanvas = renderToCanvas;
prototype$71.toSVG = renderToSVG;

// -- SAVE / RESTORE STATE ----
prototype$71.getState = getState$1;
prototype$71.setState = setState$1;

transform('Bound', Bound);
transform('Mark', Mark);
transform('Render', Render);
transform('ViewLayout', ViewLayout);

/* eslint-disable no-unused-vars */

exports.version = version;
exports.Dataflow = Dataflow;
exports.EventStream = EventStream;
exports.Parameters = Parameters;
exports.Pulse = Pulse;
exports.MultiPulse = MultiPulse;
exports.Operator = Operator;
exports.Transform = Transform;
exports.changeset = changeset;
exports.ingest = ingest;
exports.register = register;
exports.definition = definition;
exports.definitions = definitions;
exports.transform = transform;
exports.transforms = transforms;
exports.tupleid = tupleid;
exports.scale = scale$1;
exports.scheme = getScheme;
exports.interpolate = getInterpolate;
exports.interpolateRange = interpolateRange;
exports.projection = projection;
exports.View = View;
exports.parse = parse$2;
exports.expressionFunction = expressionFunction;
exports.formatLocale = d3Format.formatDefaultLocale;
exports.timeFormatLocale = d3TimeFormat.timeFormatDefaultLocale;
exports.runtime = parseDataflow;
exports.runtimeContext = context$2;
exports.bin = bin$1;
exports.bootstrapCI = bootstrapCI;
exports.randomInteger = integer;
exports.randomKDE = randomKDE;
exports.randomMixture = randomMixture;
exports.randomNormal = randomNormal;
exports.randomUniform = randomUniform;
exports.quartiles = quartiles;
exports.accessor = accessor;
exports.accessorName = accessorName;
exports.accessorFields = accessorFields;
exports.id = id;
exports.identity = identity;
exports.zero = zero;
exports.one = one;
exports.truthy = truthy;
exports.falsy = falsy;
exports.logger = logger;
exports.None = None;
exports.Warn = Warn;
exports.Info = Info;
exports.Debug = Debug;
exports.array = array;
exports.compare = compare;
exports.constant = constant;
exports.error = error;
exports.extend = extend;
exports.extentIndex = extentIndex;
exports.fastmap = fastmap;
exports.field = field;
exports.inherits = inherits;
exports.isArray = isArray;
exports.isBoolean = isBoolean;
exports.isDate = isDate;
exports.isFunction = isFunction;
exports.isNumber = isNumber;
exports.isObject = isObject;
exports.isRegExp = isRegExp;
exports.isString = isString;
exports.key = key;
exports.merge = merge;
exports.pad = pad;
exports.peek = peek;
exports.repeat = repeat;
exports.splitAccessPath = splitAccessPath;
exports.stringValue = $$2;
exports.toBoolean = toBoolean;
exports.toDate = toDate;
exports.toNumber = toNumber;
exports.toString = toString;
exports.toSet = toSet;
exports.truncate = truncate;
exports.visitArray = visitArray;
exports.loader = loader;
exports.read = read;
exports.inferType = inferType;
exports.inferTypes = inferTypes;
exports.typeParsers = typeParsers;
exports.formats = formats$1;
exports.Bounds = Bounds;
exports.Gradient = Gradient;
exports.GroupItem = GroupItem;
exports.ResourceLoader = ResourceLoader;
exports.Item = Item;
exports.Scenegraph = Scenegraph;
exports.Handler = Handler;
exports.Renderer = Renderer;
exports.CanvasHandler = CanvasHandler;
exports.CanvasRenderer = CanvasRenderer;
exports.SVGHandler = SVGHandler;
exports.SVGRenderer = SVGRenderer;
exports.SVGStringRenderer = SVGStringRenderer;
exports.RenderType = RenderType;
exports.renderModule = renderModule;
exports.Marks = Marks;
exports.boundContext = context;
exports.boundStroke = boundStroke;
exports.boundItem = boundItem;
exports.boundMark = boundMark;
exports.pathCurves = curves;
exports.pathSymbols = symbols;
exports.pathRectangle = vg_rect;
exports.pathTrail = vg_trail;
exports.pathParse = pathParse;
exports.pathRender = pathRender;
exports.point = point;
exports.canvas = Canvas$1;
exports.domCreate = domCreate;
exports.domFind = domFind;
exports.domChild = domChild;
exports.domClear = domClear;
exports.openTag = openTag;
exports.closeTag = closeTag;
exports.font = font;
exports.textMetrics = textMetrics;
exports.sceneEqual = sceneEqual;
exports.pathEqual = pathEqual;
exports.sceneToJSON = sceneToJSON;
exports.sceneFromJSON = sceneFromJSON;
exports.sceneZOrder = zorder;
exports.sceneVisit = visit;
exports.scenePickVisit = pickVisit;

Object.defineProperty(exports, '__esModule', { value: true });

})));