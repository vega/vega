(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.vega = global.vega || {})));
}(this, (function (exports) { 'use strict';

var version = "3.0.0-rc4";

var bin$1 = function(_) {
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
    v = Math.floor(min / step + eps) * step;
    min = min < v ? v - step : v;
    max = Math.ceil(max / step) * step;
  }

  return {
    start: min,
    stop:  max,
    step:  step
  };
};

var numbers = function(array, f) {
  var numbers = [],
      n = array.length,
      i = -1, a;

  if (f == null) {
    while (++i < n) if (!isNaN(a = number(array[i]))) numbers.push(a);
  } else {
    while (++i < n) if (!isNaN(a = number(f(array[i], i, array)))) numbers.push(a);
  }
  return numbers;
};

function number(x) {
  return x === null ? NaN : +x;
}

var ascending = function(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
};

var bisector = function(compare) {
  if (compare.length === 1) compare = ascendingComparator(compare);
  return {
    left: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
};

function ascendingComparator(f) {
  return function(d, x) {
    return ascending(f(d), x);
  };
}

var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;
var bisectLeft = ascendingBisect.left;

function pair(a, b) {
  return [a, b];
}

var number$1 = function(x) {
  return x === null ? NaN : +x;
};

var variance = function(values, valueof) {
  var n = values.length,
      m = 0,
      i = -1,
      mean = 0,
      value,
      delta,
      sum = 0;

  if (valueof == null) {
    while (++i < n) {
      if (!isNaN(value = number$1(values[i]))) {
        delta = value - mean;
        mean += delta / ++m;
        sum += delta * (value - mean);
      }
    }
  }

  else {
    while (++i < n) {
      if (!isNaN(value = number$1(valueof(values[i], i, values)))) {
        delta = value - mean;
        mean += delta / ++m;
        sum += delta * (value - mean);
      }
    }
  }

  if (m > 1) return sum / (m - 1);
};

var extent = function(values, valueof) {
  var n = values.length,
      i = -1,
      value,
      min,
      max;

  if (valueof == null) {
    while (++i < n) { // Find the first comparable value.
      if ((value = values[i]) != null && value >= value) {
        min = max = value;
        while (++i < n) { // Compare the remaining values.
          if ((value = values[i]) != null) {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    }
  }

  else {
    while (++i < n) { // Find the first comparable value.
      if ((value = valueof(values[i], i, values)) != null && value >= value) {
        min = max = value;
        while (++i < n) { // Compare the remaining values.
          if ((value = valueof(values[i], i, values)) != null) {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    }
  }

  return [min, max];
};

var identity = function(x) {
  return x;
};

var sequence = function(start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
};

var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e2 = Math.sqrt(2);

var ticks = function(start, stop, count) {
  var reverse = stop < start,
      i = -1,
      n,
      ticks,
      step;

  if (reverse) n = start, start = stop, stop = n;

  if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

  if (step > 0) {
    start = Math.ceil(start / step);
    stop = Math.floor(stop / step);
    ticks = new Array(n = Math.ceil(stop - start + 1));
    while (++i < n) ticks[i] = (start + i) * step;
  } else {
    start = Math.floor(start * step);
    stop = Math.ceil(stop * step);
    ticks = new Array(n = Math.ceil(start - stop + 1));
    while (++i < n) ticks[i] = (start - i) / step;
  }

  if (reverse) ticks.reverse();

  return ticks;
};

function tickIncrement(start, stop, count) {
  var step = (stop - start) / Math.max(0, count),
      power = Math.floor(Math.log(step) / Math.LN10),
      error = step / Math.pow(10, power);
  return power >= 0
      ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
      : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
}

function tickStep(start, stop, count) {
  var step0 = Math.abs(stop - start) / Math.max(0, count),
      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
      error = step0 / step1;
  if (error >= e10) step1 *= 10;
  else if (error >= e5) step1 *= 5;
  else if (error >= e2) step1 *= 2;
  return stop < start ? -step1 : step1;
}

var thresholdSturges = function(values) {
  return Math.ceil(Math.log(values.length) / Math.LN2) + 1;
};

var threshold = function(values, p, valueof) {
  if (valueof == null) valueof = number$1;
  if (!(n = values.length)) return;
  if ((p = +p) <= 0 || n < 2) return +valueof(values[0], 0, values);
  if (p >= 1) return +valueof(values[n - 1], n - 1, values);
  var n,
      i = (n - 1) * p,
      i0 = Math.floor(i),
      value0 = +valueof(values[i0], i0, values),
      value1 = +valueof(values[i0 + 1], i0 + 1, values);
  return value0 + (value1 - value0) * (i - i0);
};

var max = function(values, valueof) {
  var n = values.length,
      i = -1,
      value,
      max;

  if (valueof == null) {
    while (++i < n) { // Find the first comparable value.
      if ((value = values[i]) != null && value >= value) {
        max = value;
        while (++i < n) { // Compare the remaining values.
          if ((value = values[i]) != null && value > max) {
            max = value;
          }
        }
      }
    }
  }

  else {
    while (++i < n) { // Find the first comparable value.
      if ((value = valueof(values[i], i, values)) != null && value >= value) {
        max = value;
        while (++i < n) { // Compare the remaining values.
          if ((value = valueof(values[i], i, values)) != null && value > max) {
            max = value;
          }
        }
      }
    }
  }

  return max;
};

var mean = function(values, valueof) {
  var n = values.length,
      m = n,
      i = -1,
      value,
      sum = 0;

  if (valueof == null) {
    while (++i < n) {
      if (!isNaN(value = number$1(values[i]))) sum += value;
      else --m;
    }
  }

  else {
    while (++i < n) {
      if (!isNaN(value = number$1(valueof(values[i], i, values)))) sum += value;
      else --m;
    }
  }

  if (m) return sum / m;
};

var median = function(values, valueof) {
  var n = values.length,
      i = -1,
      value,
      numbers = [];

  if (valueof == null) {
    while (++i < n) {
      if (!isNaN(value = number$1(values[i]))) {
        numbers.push(value);
      }
    }
  }

  else {
    while (++i < n) {
      if (!isNaN(value = number$1(valueof(values[i], i, values)))) {
        numbers.push(value);
      }
    }
  }

  return threshold(numbers.sort(ascending), 0.5);
};

var merge = function(arrays) {
  var n = arrays.length,
      m,
      i = -1,
      j = 0,
      merged,
      array;

  while (++i < n) j += arrays[i].length;
  merged = new Array(j);

  while (--n >= 0) {
    array = arrays[n];
    m = array.length;
    while (--m >= 0) {
      merged[--j] = array[m];
    }
  }

  return merged;
};

var min = function(values, valueof) {
  var n = values.length,
      i = -1,
      value,
      min;

  if (valueof == null) {
    while (++i < n) { // Find the first comparable value.
      if ((value = values[i]) != null && value >= value) {
        min = value;
        while (++i < n) { // Compare the remaining values.
          if ((value = values[i]) != null && min > value) {
            min = value;
          }
        }
      }
    }
  }

  else {
    while (++i < n) { // Find the first comparable value.
      if ((value = valueof(values[i], i, values)) != null && value >= value) {
        min = value;
        while (++i < n) { // Compare the remaining values.
          if ((value = valueof(values[i], i, values)) != null && min > value) {
            min = value;
          }
        }
      }
    }
  }

  return min;
};

var permute = function(array, indexes) {
  var i = indexes.length, permutes = new Array(i);
  while (i--) permutes[i] = array[indexes[i]];
  return permutes;
};

var sum = function(values, valueof) {
  var n = values.length,
      i = -1,
      value,
      sum = 0;

  if (valueof == null) {
    while (++i < n) {
      if (value = +values[i]) sum += value; // Note: zero and null are equivalent.
    }
  }

  else {
    while (++i < n) {
      if (value = +valueof(values[i], i, values)) sum += value;
    }
  }

  return sum;
};

function length(d) {
  return d.length;
}

var bootstrapCI = function(array, samples, alpha, f) {
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
    threshold(mu.sort(ascending), alpha/2),
    threshold(mu, 1-(alpha/2))
  ];
};

var integer = function(min, max) {
  if (max == null) {
    max = min;
    min = 0;
  }

  var dist = {},
      a, b, d;

  dist.min = function(_) {
    if (arguments.length) {
      a = _ || 0;
      d = b - a;
      return dist;
    } else {
      return a;
    }
  };

  dist.max = function(_) {
    if (arguments.length) {
      b = _ || 0;
      d = b - a;
      return dist;
    } else {
      return b;
    }
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
};

var randomNormal = function(mean, stdev) {
  var mu,
      sigma,
      next = NaN,
      dist = {};

  dist.mean = function(_) {
    if (arguments.length) {
      mu = _ || 0;
      next = NaN;
      return dist;
    } else {
      return mu;
    }
  };

  dist.stdev = function(_) {
    if (arguments.length) {
      sigma = _ == null ? 1 : _;
      next = NaN;
      return dist;
    } else {
      return sigma;
    }
  };

  dist.sample = function() {
    var x = 0, y = 0, rds, c;
    if (next === next) {
      x = next;
      next = NaN;
      return x;
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
};

var quartiles = function(array, f) {
  var values = numbers(array, f);

  return [
    threshold(values.sort(ascending), 0.25),
    threshold(values, 0.50),
    threshold(values, 0.75)
  ];
};

// TODO: support for additional kernels?
var randomKDE = function(support, bandwidth) {
  var kernel = randomNormal(),
      dist = {},
      n = 0;

  dist.data = function(_) {
    if (arguments.length) {
      support = _;
      n = _ ? _.length : 0;
      return dist.bandwidth(bandwidth);
    } else {
      return support;
    }
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
};

// Scott, D. W. (1992) Multivariate Density Estimation:
// Theory, Practice, and Visualization. Wiley.
function estimateBandwidth(array) {
  var n = array.length,
      q = quartiles(array),
      h = (q[2] - q[0]) / 1.34;
  return 1.06 * Math.min(Math.sqrt(variance(array)), h) * Math.pow(n, -0.2);
}

var randomMixture = function(dists, weights) {
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
};

var randomUniform = function(min, max) {
  if (max == null) {
    max = (min == null ? 1 : min);
    min = 0;
  }

  var dist = {},
      a, b, d;

  dist.min = function(_) {
    if (arguments.length) {
      a = _ || 0;
      d = b - a;
      return dist;
    } else {
      return a;
    }
  };

  dist.max = function(_) {
    if (arguments.length) {
      b = _ || 0;
      d = b - a;
      return dist;
    } else {
      return b;
    }
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
};

var accessor = function(fn, fields, name) {
  fn.fields = fields || [];
  fn.fname = name;
  return fn;
};

function accessorName(fn) {
  return fn == null ? null : fn.fname;
}

function accessorFields(fn) {
  return fn == null ? null : fn.fields;
}

var error$1 = function(message) {
  throw Error(message);
};

var splitAccessPath = function(p) {
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
    if (c === '\\') {
      s += p.substring(i, j);
      i = ++j;
    } else if (c === q) {
      push();
      q = null;
      b = -1;
    } else if (q) {
      continue;
    } else if (i === b && c === '"') {
      i = j + 1;
      q = c;
    } else if (i === b && c === "'") {
      i = j + 1;
      q = c;
    } else if (c === '.' && !b) {
      if (j > i) {
        push();
      } else {
        i = j + 1;
      }
    } else if (c === '[') {
      if (j > i) push();
      b = i = j + 1;
    } else if (c === ']') {
      if (!b) error$1('Access path missing open bracket: ' + p);
      if (b > 0) push();
      b = 0;
      i = j + 1;
    }
  }

  if (b) error$1('Access path missing closing bracket: ' + p);
  if (q) error$1('Access path missing closing quote: ' + p);

  if (j > i) {
    j++;
    push();
  }

  return path;
};

var isArray = Array.isArray;

var isObject = function(_) {
  return _ === Object(_);
};

var isString = function(_) {
  return typeof _ === 'string';
};

function $(x) {
  return isArray(x) ? '[' + x.map($) + ']'
    : isObject(x) || isString(x) ?
      // Output valid JSON and JS source strings.
      // See http://timelessrepo.com/json-isnt-a-javascript-subset
      JSON.stringify(x).replace('\u2028','\\u2028').replace('\u2029', '\\u2029')
    : x;
}

var field = function(field, name) {
  var path = splitAccessPath(field),
      code = 'return _[' + path.map($).join('][') + '];';

  return accessor(
    Function('_', code),
    [(field = path.length===1 ? path[0] : field)],
    name || field
  );
};

var empty = [];

var id = field('id');

var identity$1 = accessor(function(_) { return _; }, empty, 'identity');

var zero = accessor(function() { return 0; }, empty, 'zero');

var one = accessor(function() { return 1; }, empty, 'one');

var truthy = accessor(function() { return true; }, empty, 'true');

var falsy = accessor(function() { return false; }, empty, 'false');

function log(method, level, input) {
  var args = [level].concat([].slice.call(input));
  console[method].apply(console, args); // eslint-disable-line no-console
}

var None  = 0;
var Error$1 = 1;
var Warn  = 2;
var Info  = 3;
var Debug = 4;

var logger = function(_) {
  var level = _ || None;
  return {
    level: function(_) {
      if (arguments.length) {
        level = +_;
        return this;
      } else {
        return level;
      }
    },
    error: function() {
      if (level >= Error$1) log('error', 'ERROR', arguments);
      return this;
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
};

var array$1 = function(_) {
  return _ != null ? (isArray(_) ? _ : [_]) : [];
};

var compare = function(fields, orders) {
  var idx = [],
      cmp = (fields = array$1(fields)).map(function(f, i) {
        if (f == null) {
          return null;
        } else {
          idx.push(i);
          return splitAccessPath(f).map($).join('][');
        }
      }),
      n = idx.length - 1,
      ord = array$1(orders),
      code = 'var u,v;return ',
      i, j, f, u, v, d, lt, gt;

  if (n < 0) return null;

  for (j=0; j<=n; ++j) {
    i = idx[j];
    f = cmp[i];
    u = '(u=a['+f+'])';
    v = '(v=b['+f+'])';
    d = '((v=v instanceof Date?+v:v),(u=u instanceof Date?+u:u))';
    if (ord[i] !== 'descending') {
      gt = 1;
      lt = -1;
    } else {
      gt = -1;
      lt = 1;
    }
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
};

var isFunction = function(_) {
  return typeof _ === 'function';
};

var constant$1 = function(_) {
  return isFunction(_) ? _ : function() { return _; };
};

var debounce = function(delay, handler) {
  var tid, evt;

  function callback() {
    handler(evt);
    tid = evt = null;
  }

  return function(e) {
    evt = e;
    if (tid) clearTimeout(tid);
    tid = setTimeout(callback, delay);
  };
};

var extend = function(_) {
  for (var x, k, i=1, len=arguments.length; i<len; ++i) {
    x = arguments[i];
    for (k in x) { _[k] = x[k]; }
  }
  return _;
};

var extentIndex = function(array, f) {
  var i = -1,
      n = array.length,
      a, b, c, u, v;

  if (f == null) {
    while (++i < n) {
      b = array[i];
      if (b != null && b >= b) {
        a = c = b;
        break;
      }
    }
    u = v = i;
    while (++i < n) {
      b = array[i];
      if (b != null) {
        if (a > b) {
          a = b;
          u = i;
        }
        if (c < b) {
          c = b;
          v = i;
        }
      }
    }
  } else {
    while (++i < n) {
      b = f(array[i], i, array);
      if (b != null && b >= b) {
        a = c = b;
        break;
      }
    }
    u = v = i;
    while (++i < n) {
      b = f(array[i], i, array);
      if (b != null) {
        if (a > b) {
          a = b;
          u = i;
        }
        if (c < b) {
          c = b;
          v = i;
        }
      }
    }
  }

  return [u, v];
};

var NULL = {};

var fastmap = function(input) {
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
      if (arguments.length) {
        test = _;
        return map;
      } else {
        return test;
      }
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
};

var inherits = function(child, parent) {
  var proto = (child.prototype = Object.create(parent.prototype));
  proto.constructor = child;
  return proto;
};

var isBoolean = function(_) {
  return typeof _ === 'boolean';
};

var isDate = function(_) {
  return Object.prototype.toString.call(_) === '[object Date]';
};

var isNumber = function(_) {
  return typeof _ === 'number';
};

var isRegExp = function(_) {
  return Object.prototype.toString.call(_) === '[object RegExp]';
};

var key = function(fields) {
  fields = fields ? array$1(fields) : fields;
  var fn = !(fields && fields.length)
    ? function() { return ''; }
    : Function('_', 'return \'\'+' +
        fields.map(function(f) {
          return '_[' + splitAccessPath(f).map($).join('][') + ']';
        }).join('+\'|\'+') + ';');
  return accessor(fn, fields, 'key');
};

var merge$1 = function(compare, array0, array1, output) {
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
};

var repeat = function(str, reps) {
  var s = '';
  while (--reps >= 0) s += str;
  return s;
};

var pad = function(str, length, padchar, align) {
  var c = padchar || ' ',
      s = str + '',
      n = length - s.length;

  return n <= 0 ? s
    : align === 'left' ? repeat(c, n) + s
    : align === 'center' ? repeat(c, ~~(n/2)) + s + repeat(c, Math.ceil(n/2))
    : s + repeat(c, n);
};

var peek = function(array) {
  return array[array.length - 1];
};

var toBoolean = function(_) {
  return _ == null || _ === '' ? null : !_ || _ === 'false' || _ === '0' ? false : !!_;
};

function defaultParser(_) {
  return isNumber(_) ? _ : isDate(_) ? _ : Date.parse(_);
}

var toDate = function(_, parser) {
  parser = parser || defaultParser;
  return _ == null || _ === '' ? null : parser(_);
};

var toNumber = function(_) {
  return _ == null || _ === '' ? null : +_;
};

var toString = function(_) {
  return _ == null || _ === '' ? null : _ + '';
};

var toSet = function(_) {
  for (var s={}, i=0, n=_.length; i<n; ++i) s[_[i]] = 1;
  return s;
};

var truncate = function(str, length, align, ellipsis) {
  var e = ellipsis != null ? ellipsis : '\u2026',
      s = str + '',
      n = s.length,
      l = Math.max(0, length - e.length);

  return n <= length ? s
    : align === 'left' ? e + s.slice(n - l)
    : align === 'center' ? s.slice(0, Math.ceil(l/2)) + e + s.slice(n - ~~(l/2))
    : s.slice(0, l) + e;
};

var visitArray = function(array, filter, visitor) {
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
};

var prefix = "$";

function Map() {}

Map.prototype = map$1.prototype = {
  constructor: Map,
  has: function(key) {
    return (prefix + key) in this;
  },
  get: function(key) {
    return this[prefix + key];
  },
  set: function(key, value) {
    this[prefix + key] = value;
    return this;
  },
  remove: function(key) {
    var property = prefix + key;
    return property in this && delete this[property];
  },
  clear: function() {
    for (var property in this) if (property[0] === prefix) delete this[property];
  },
  keys: function() {
    var keys = [];
    for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
    return keys;
  },
  values: function() {
    var values = [];
    for (var property in this) if (property[0] === prefix) values.push(this[property]);
    return values;
  },
  entries: function() {
    var entries = [];
    for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
    return entries;
  },
  size: function() {
    var size = 0;
    for (var property in this) if (property[0] === prefix) ++size;
    return size;
  },
  empty: function() {
    for (var property in this) if (property[0] === prefix) return false;
    return true;
  },
  each: function(f) {
    for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
  }
};

function map$1(object, f) {
  var map = new Map;

  // Copy constructor.
  if (object instanceof Map) object.each(function(value, key) { map.set(key, value); });

  // Index array by numeric index or specified key function.
  else if (Array.isArray(object)) {
    var i = -1,
        n = object.length,
        o;

    if (f == null) while (++i < n) map.set(i, object[i]);
    else while (++i < n) map.set(f(o = object[i], i, object), o);
  }

  // Convert object to map.
  else if (object) for (var key in object) map.set(key, object[key]);

  return map;
}

var nest = function() {
  var keys = [],
      sortKeys = [],
      sortValues,
      rollup,
      nest;

  function apply(array, depth, createResult, setResult) {
    if (depth >= keys.length) {
      if (sortValues != null) array.sort(sortValues);
      return rollup != null ? rollup(array) : array;
    }

    var i = -1,
        n = array.length,
        key = keys[depth++],
        keyValue,
        value,
        valuesByKey = map$1(),
        values,
        result = createResult();

    while (++i < n) {
      if (values = valuesByKey.get(keyValue = key(value = array[i]) + "")) {
        values.push(value);
      } else {
        valuesByKey.set(keyValue, [value]);
      }
    }

    valuesByKey.each(function(values, key) {
      setResult(result, key, apply(values, depth, createResult, setResult));
    });

    return result;
  }

  function entries(map, depth) {
    if (++depth > keys.length) return map;
    var array, sortKey = sortKeys[depth - 1];
    if (rollup != null && depth >= keys.length) array = map.entries();
    else array = [], map.each(function(v, k) { array.push({key: k, values: entries(v, depth)}); });
    return sortKey != null ? array.sort(function(a, b) { return sortKey(a.key, b.key); }) : array;
  }

  return nest = {
    object: function(array) { return apply(array, 0, createObject, setObject); },
    map: function(array) { return apply(array, 0, createMap, setMap); },
    entries: function(array) { return entries(apply(array, 0, createMap, setMap), 0); },
    key: function(d) { keys.push(d); return nest; },
    sortKeys: function(order) { sortKeys[keys.length - 1] = order; return nest; },
    sortValues: function(order) { sortValues = order; return nest; },
    rollup: function(f) { rollup = f; return nest; }
  };
};

function createObject() {
  return {};
}

function setObject(object, key, value) {
  object[key] = value;
}

function createMap() {
  return map$1();
}

function setMap(map, key, value) {
  map.set(key, value);
}

function Set() {}

var proto = map$1.prototype;

Set.prototype = set.prototype = {
  constructor: Set,
  has: proto.has,
  add: function(value) {
    value += "";
    this[prefix + value] = value;
    return this;
  },
  remove: proto.remove,
  clear: proto.clear,
  values: proto.keys,
  size: proto.size,
  empty: proto.empty,
  each: proto.each
};

function set(object, f) {
  var set = new Set;

  // Copy constructor.
  if (object instanceof Set) object.each(function(value) { set.add(value); });

  // Otherwise, assume it’s an array.
  else if (object) {
    var i = -1, n = object.length;
    if (f == null) while (++i < n) set.add(object[i]);
    else while (++i < n) set.add(f(object[i], i, object));
  }

  return set;
}

var noop = {value: function() {}};

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || (t in _)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return {type: t, name: name};
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._,
        T = parseTypenames(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
      return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$2(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set$2(_[t], typename.name, null);
    }

    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};

function get(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$2(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({name: name, value: callback});
  return type;
}

var request = function(url, callback) {
  var request,
      event = dispatch("beforesend", "progress", "load", "error"),
      mimeType,
      headers = map$1(),
      xhr = new XMLHttpRequest,
      user = null,
      password = null,
      response,
      responseType,
      timeout = 0;

  // If IE does not support CORS, use XDomainRequest.
  if (typeof XDomainRequest !== "undefined"
      && !("withCredentials" in xhr)
      && /^(http(s)?:)?\/\//.test(url)) xhr = new XDomainRequest;

  "onload" in xhr
      ? xhr.onload = xhr.onerror = xhr.ontimeout = respond
      : xhr.onreadystatechange = function(o) { xhr.readyState > 3 && respond(o); };

  function respond(o) {
    var status = xhr.status, result;
    if (!status && hasResponse(xhr)
        || status >= 200 && status < 300
        || status === 304) {
      if (response) {
        try {
          result = response.call(request, xhr);
        } catch (e) {
          event.call("error", request, e);
          return;
        }
      } else {
        result = xhr;
      }
      event.call("load", request, result);
    } else {
      event.call("error", request, o);
    }
  }

  xhr.onprogress = function(e) {
    event.call("progress", request, e);
  };

  request = {
    header: function(name, value) {
      name = (name + "").toLowerCase();
      if (arguments.length < 2) return headers.get(name);
      if (value == null) headers.remove(name);
      else headers.set(name, value + "");
      return request;
    },

    // If mimeType is non-null and no Accept header is set, a default is used.
    mimeType: function(value) {
      if (!arguments.length) return mimeType;
      mimeType = value == null ? null : value + "";
      return request;
    },

    // Specifies what type the response value should take;
    // for instance, arraybuffer, blob, document, or text.
    responseType: function(value) {
      if (!arguments.length) return responseType;
      responseType = value;
      return request;
    },

    timeout: function(value) {
      if (!arguments.length) return timeout;
      timeout = +value;
      return request;
    },

    user: function(value) {
      return arguments.length < 1 ? user : (user = value == null ? null : value + "", request);
    },

    password: function(value) {
      return arguments.length < 1 ? password : (password = value == null ? null : value + "", request);
    },

    // Specify how to convert the response content to a specific type;
    // changes the callback value on "load" events.
    response: function(value) {
      response = value;
      return request;
    },

    // Alias for send("GET", …).
    get: function(data, callback) {
      return request.send("GET", data, callback);
    },

    // Alias for send("POST", …).
    post: function(data, callback) {
      return request.send("POST", data, callback);
    },

    // If callback is non-null, it will be used for error and load events.
    send: function(method, data, callback) {
      xhr.open(method, url, true, user, password);
      if (mimeType != null && !headers.has("accept")) headers.set("accept", mimeType + ",*/*");
      if (xhr.setRequestHeader) headers.each(function(value, name) { xhr.setRequestHeader(name, value); });
      if (mimeType != null && xhr.overrideMimeType) xhr.overrideMimeType(mimeType);
      if (responseType != null) xhr.responseType = responseType;
      if (timeout > 0) xhr.timeout = timeout;
      if (callback == null && typeof data === "function") callback = data, data = null;
      if (callback != null && callback.length === 1) callback = fixCallback(callback);
      if (callback != null) request.on("error", callback).on("load", function(xhr) { callback(null, xhr); });
      event.call("beforesend", request, xhr);
      xhr.send(data == null ? null : data);
      return request;
    },

    abort: function() {
      xhr.abort();
      return request;
    },

    on: function() {
      var value = event.on.apply(event, arguments);
      return value === event ? request : value;
    }
  };

  if (callback != null) {
    if (typeof callback !== "function") throw new Error("invalid callback: " + callback);
    return request.get(callback);
  }

  return request;
};

function fixCallback(callback) {
  return function(error, xhr) {
    callback(error == null ? xhr : null);
  };
}

function hasResponse(xhr) {
  var type = xhr.responseType;
  return type && type !== "text"
      ? xhr.response // null on error
      : xhr.responseText; // "" on error
}

function objectConverter(columns) {
  return new Function("d", "return {" + columns.map(function(name, i) {
    return JSON.stringify(name) + ": d[" + i + "]";
  }).join(",") + "}");
}

function customConverter(columns, f) {
  var object = objectConverter(columns);
  return function(row, i) {
    return f(object(row), i, columns);
  };
}

// Compute unique columns in order of discovery.
function inferColumns(rows) {
  var columnSet = Object.create(null),
      columns = [];

  rows.forEach(function(row) {
    for (var column in row) {
      if (!(column in columnSet)) {
        columns.push(columnSet[column] = column);
      }
    }
  });

  return columns;
}

var dsvFormat = function(delimiter) {
  var reFormat = new RegExp("[\"" + delimiter + "\n\r]"),
      delimiterCode = delimiter.charCodeAt(0);

  function parse(text, f) {
    var convert, columns, rows = parseRows(text, function(row, i) {
      if (convert) return convert(row, i - 1);
      columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
    });
    rows.columns = columns;
    return rows;
  }

  function parseRows(text, f) {
    var EOL = {}, // sentinel value for end-of-line
        EOF = {}, // sentinel value for end-of-file
        rows = [], // output rows
        N = text.length,
        I = 0, // current character index
        n = 0, // the current line number
        t, // the current token
        eol; // is the current token followed by EOL?

    function token() {
      if (I >= N) return EOF; // special case: end of file
      if (eol) return eol = false, EOL; // special case: end of line

      // special case: quotes
      var j = I, c;
      if (text.charCodeAt(j) === 34) {
        var i = j;
        while (i++ < N) {
          if (text.charCodeAt(i) === 34) {
            if (text.charCodeAt(i + 1) !== 34) break;
            ++i;
          }
        }
        I = i + 2;
        c = text.charCodeAt(i + 1);
        if (c === 13) {
          eol = true;
          if (text.charCodeAt(i + 2) === 10) ++I;
        } else if (c === 10) {
          eol = true;
        }
        return text.slice(j + 1, i).replace(/""/g, "\"");
      }

      // common case: find next delimiter or newline
      while (I < N) {
        var k = 1;
        c = text.charCodeAt(I++);
        if (c === 10) eol = true; // \n
        else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \r|\r\n
        else if (c !== delimiterCode) continue;
        return text.slice(j, I - k);
      }

      // special case: last token before EOF
      return text.slice(j);
    }

    while ((t = token()) !== EOF) {
      var a = [];
      while (t !== EOL && t !== EOF) {
        a.push(t);
        t = token();
      }
      if (f && (a = f(a, n++)) == null) continue;
      rows.push(a);
    }

    return rows;
  }

  function format(rows, columns) {
    if (columns == null) columns = inferColumns(rows);
    return [columns.map(formatValue).join(delimiter)].concat(rows.map(function(row) {
      return columns.map(function(column) {
        return formatValue(row[column]);
      }).join(delimiter);
    })).join("\n");
  }

  function formatRows(rows) {
    return rows.map(formatRow).join("\n");
  }

  function formatRow(row) {
    return row.map(formatValue).join(delimiter);
  }

  function formatValue(text) {
    return text == null ? ""
        : reFormat.test(text += "") ? "\"" + text.replace(/\"/g, "\"\"") + "\""
        : text;
  }

  return {
    parse: parse,
    parseRows: parseRows,
    format: format,
    formatRows: formatRows
  };
};

var csv$1 = dsvFormat(",");

var tsv = dsvFormat("\t");

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
var loader = function(options) {
  return {
    options: options || {},
    sanitize: sanitize,
    load: load,
    file: file,
    http: http
  };
};

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
      return opt.localFile
        ? loader.file(url)
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
    var result = {href: null},
        isFile, hasProtocol, loadFile, base;

    if (uri == null || typeof uri !== 'string') {
      reject('Sanitize failure, invalid URI: ' + $(uri));
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

    if (isFile) {
      // strip file protocol
      uri = uri.slice(fileProtocol.length);
    } else if (startsWith(uri, '//')) {
      if (options.defaultProtocol === 'file') {
        // if is file, strip protocol and set loadFile flag
        uri = uri.slice(2);
        loadFile = true;
      } else {
        // if relative protocol (starts with '//'), prepend default protocol
        uri = (options.defaultProtocol || 'http') + ':' + uri;
      }
    }

    // set non-enumerable mode flag to indicate local file load
    Object.defineProperty(result, 'localFile', {value: !!loadFile});

    // set uri and return
    result.href = uri;
    accept(result);
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
    var req = request(url),
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
        var text$$1 = result && result.responseText;
        (!result || result.status === 0)
          ? reject(text$$1 || 'Error')
          : accept(text$$1);
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

function inferType(values, field$$1) {
  var tests = typeTests.slice(),
      value, i, n, j;

  for (i=0, n=values.length; i<n; ++i) {
    value = field$$1 ? values[i][field$$1] : values[i];
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
  return fields.reduce(function(types, field$$1) {
    types[field$$1] = inferType(data, field$$1);
    return types;
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
    return dsv$1(data, format ? extend(format, delim) : delim);
  };
}

function dsv$1(data, format) {
  if (format.header) {
    data = format.header
      .map($)
      .join(format.delimiter) + '\n' + data;
  }
  return dsvFormat(format.delimiter).parse(data+'');
}

function isBuffer(_) {
  return (typeof Buffer === 'function' && isFunction(Buffer.isBuffer))
    ? Buffer.isBuffer(_) : false;
}

var json$1 = function(data, format) {
  var prop = (format && format.property) ? field(format.property) : identity$1;
  return isObject(data) && !isBuffer(data)
    ? parseJSON(prop(data))
    : prop(JSON.parse(data));
};

function parseJSON(data, format) {
  return (format && format.copy)
    ? JSON.parse(JSON.stringify(data))
    : data;
}

var noop$1 = function() {};

function absolute(transform) {
  if (!transform) return noop$1;
  var x0,
      y0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(point, i) {
    if (!i) x0 = y0 = 0;
    point[0] = (x0 += point[0]) * kx + dx;
    point[1] = (y0 += point[1]) * ky + dy;
  };
}

function reverse(array, n) {
  var t, j = array.length, i = j - n;
  while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
}

function bisect$1(a, x) {
  var lo = 0, hi = a.length;
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (a[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

var feature = function(topology, o) {
  return o.type === "GeometryCollection" ? {
    type: "FeatureCollection",
    features: o.geometries.map(function(o) { return feature$1(topology, o); })
  } : feature$1(topology, o);
};

function feature$1(topology, o) {
  var f = {
    type: "Feature",
    id: o.id,
    properties: o.properties || {},
    geometry: object(topology, o)
  };
  if (o.id == null) delete f.id;
  return f;
}

function object(topology, o) {
  var absolute$$1 = absolute(topology.transform),
      arcs = topology.arcs;

  function arc(i, points) {
    if (points.length) points.pop();
    for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length, p; k < n; ++k) {
      points.push(p = a[k].slice());
      absolute$$1(p, k);
    }
    if (i < 0) reverse(points, n);
  }

  function point(p) {
    p = p.slice();
    absolute$$1(p, 0);
    return p;
  }

  function line(arcs) {
    var points = [];
    for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
    if (points.length < 2) points.push(points[0].slice());
    return points;
  }

  function ring(arcs) {
    var points = line(arcs);
    while (points.length < 4) points.push(points[0].slice());
    return points;
  }

  function polygon(arcs) {
    return arcs.map(ring);
  }

  function geometry(o) {
    var t = o.type;
    return t === "GeometryCollection" ? {type: t, geometries: o.geometries.map(geometry)}
        : t in geometryType ? {type: t, coordinates: geometryType[t](o)}
        : null;
  }

  var geometryType = {
    Point: function(o) { return point(o.coordinates); },
    MultiPoint: function(o) { return o.coordinates.map(point); },
    LineString: function(o) { return line(o.arcs); },
    MultiLineString: function(o) { return o.arcs.map(line); },
    Polygon: function(o) { return polygon(o.arcs); },
    MultiPolygon: function(o) { return o.arcs.map(polygon); }
  };

  return geometry(o);
}

var stitchArcs = function(topology, arcs) {
  var stitchedArcs = {},
      fragmentByStart = {},
      fragmentByEnd = {},
      fragments = [],
      emptyIndex = -1;

  // Stitch empty arcs first, since they may be subsumed by other arcs.
  arcs.forEach(function(i, j) {
    var arc = topology.arcs[i < 0 ? ~i : i], t;
    if (arc.length < 3 && !arc[1][0] && !arc[1][1]) {
      t = arcs[++emptyIndex], arcs[emptyIndex] = i, arcs[j] = t;
    }
  });

  arcs.forEach(function(i) {
    var e = ends(i),
        start = e[0],
        end = e[1],
        f, g;

    if (f = fragmentByEnd[start]) {
      delete fragmentByEnd[f.end];
      f.push(i);
      f.end = end;
      if (g = fragmentByStart[end]) {
        delete fragmentByStart[g.start];
        var fg = g === f ? f : f.concat(g);
        fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
      } else {
        fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
      }
    } else if (f = fragmentByStart[end]) {
      delete fragmentByStart[f.start];
      f.unshift(i);
      f.start = start;
      if (g = fragmentByEnd[start]) {
        delete fragmentByEnd[g.end];
        var gf = g === f ? f : g.concat(f);
        fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
      } else {
        fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
      }
    } else {
      f = [i];
      fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;
    }
  });

  function ends(i) {
    var arc = topology.arcs[i < 0 ? ~i : i], p0 = arc[0], p1;
    if (topology.transform) p1 = [0, 0], arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; });
    else p1 = arc[arc.length - 1];
    return i < 0 ? [p1, p0] : [p0, p1];
  }

  function flush(fragmentByEnd, fragmentByStart) {
    for (var k in fragmentByEnd) {
      var f = fragmentByEnd[k];
      delete fragmentByStart[f.start];
      delete f.start;
      delete f.end;
      f.forEach(function(i) { stitchedArcs[i < 0 ? ~i : i] = 1; });
      fragments.push(f);
    }
  }

  flush(fragmentByEnd, fragmentByStart);
  flush(fragmentByStart, fragmentByEnd);
  arcs.forEach(function(i) { if (!stitchedArcs[i < 0 ? ~i : i]) fragments.push([i]); });

  return fragments;
};

var mesh = function(topology) {
  return object(topology, meshArcs.apply(this, arguments));
};

function meshArcs(topology, o, filter) {
  var arcs = [];

  function arc(i) {
    var j = i < 0 ? ~i : i;
    (geomsByArc[j] || (geomsByArc[j] = [])).push({i: i, g: geom});
  }

  function line(arcs) {
    arcs.forEach(arc);
  }

  function polygon(arcs) {
    arcs.forEach(line);
  }

  function geometry(o) {
    if (o.type === "GeometryCollection") o.geometries.forEach(geometry);
    else if (o.type in geometryType) geom = o, geometryType[o.type](o.arcs);
  }

  if (arguments.length > 1) {
    var geomsByArc = [],
        geom;

    var geometryType = {
      LineString: line,
      MultiLineString: polygon,
      Polygon: polygon,
      MultiPolygon: function(arcs) { arcs.forEach(polygon); }
    };

    geometry(o);

    geomsByArc.forEach(arguments.length < 3
        ? function(geoms) { arcs.push(geoms[0].i); }
        : function(geoms) { if (filter(geoms[0].g, geoms[geoms.length - 1].g)) arcs.push(geoms[0].i); });
  } else {
    for (var i = 0, n = topology.arcs.length; i < n; ++i) arcs.push(i);
  }

  return {type: "MultiLineString", arcs: stitchArcs(topology, arcs)};
}

var topojson = function(data, format) {
  var object, property;
  data = json$1(data, format);

  if (format && (property = format.feature)) {
    return (object = data.objects[property])
      ? feature(data, object).features
      : error$1('Invalid TopoJSON object: ' + property);
  }

  else if (format && (property = format.mesh)) {
    return (object = data.objects[property])
      ? [mesh(data, object)]
      : error$1('Invalid TopoJSON object: ' + property);
  }

  error$1('Missing TopoJSON feature or mesh parameter.');
};

var formats = {
  dsv: dsv$1,
  csv: delimitedFormat(','),
  tsv: delimitedFormat('\t'),
  json: json$1,
  topojson: topojson
};

var formats$1 = function(name, format) {
  if (arguments.length > 1) {
    formats[name] = format;
    return this;
  } else {
    return formats.hasOwnProperty(name) ? formats[name] : null;
  }
};

var t0 = new Date;
var t1 = new Date;

function newInterval(floori, offseti, count, field) {

  function interval(date) {
    return floori(date = new Date(+date)), date;
  }

  interval.floor = interval;

  interval.ceil = function(date) {
    return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
  };

  interval.round = function(date) {
    var d0 = interval(date),
        d1 = interval.ceil(date);
    return date - d0 < d1 - date ? d0 : d1;
  };

  interval.offset = function(date, step) {
    return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
  };

  interval.range = function(start, stop, step) {
    var range = [];
    start = interval.ceil(start);
    step = step == null ? 1 : Math.floor(step);
    if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
    do range.push(new Date(+start)); while (offseti(start, step), floori(start), start < stop)
    return range;
  };

  interval.filter = function(test) {
    return newInterval(function(date) {
      if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
    }, function(date, step) {
      if (date >= date) {
        if (step < 0) while (++step <= 0) {
          while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
        } else while (--step >= 0) {
          while (offseti(date, +1), !test(date)) {} // eslint-disable-line no-empty
        }
      }
    });
  };

  if (count) {
    interval.count = function(start, end) {
      t0.setTime(+start), t1.setTime(+end);
      floori(t0), floori(t1);
      return Math.floor(count(t0, t1));
    };

    interval.every = function(step) {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0) ? null
          : !(step > 1) ? interval
          : interval.filter(field
              ? function(d) { return field(d) % step === 0; }
              : function(d) { return interval.count(0, d) % step === 0; });
    };
  }

  return interval;
}

var millisecond = newInterval(function() {
  // noop
}, function(date, step) {
  date.setTime(+date + step);
}, function(start, end) {
  return end - start;
});

// An optimized implementation for this simple case.
millisecond.every = function(k) {
  k = Math.floor(k);
  if (!isFinite(k) || !(k > 0)) return null;
  if (!(k > 1)) return millisecond;
  return newInterval(function(date) {
    date.setTime(Math.floor(date / k) * k);
  }, function(date, step) {
    date.setTime(+date + step * k);
  }, function(start, end) {
    return (end - start) / k;
  });
};

var durationSecond = 1e3;
var durationMinute = 6e4;
var durationHour = 36e5;
var durationDay = 864e5;
var durationWeek = 6048e5;

var second = newInterval(function(date) {
  date.setTime(Math.floor(date / durationSecond) * durationSecond);
}, function(date, step) {
  date.setTime(+date + step * durationSecond);
}, function(start, end) {
  return (end - start) / durationSecond;
}, function(date) {
  return date.getUTCSeconds();
});

var minute = newInterval(function(date) {
  date.setTime(Math.floor(date / durationMinute) * durationMinute);
}, function(date, step) {
  date.setTime(+date + step * durationMinute);
}, function(start, end) {
  return (end - start) / durationMinute;
}, function(date) {
  return date.getMinutes();
});

var hour = newInterval(function(date) {
  var offset = date.getTimezoneOffset() * durationMinute % durationHour;
  if (offset < 0) offset += durationHour;
  date.setTime(Math.floor((+date - offset) / durationHour) * durationHour + offset);
}, function(date, step) {
  date.setTime(+date + step * durationHour);
}, function(start, end) {
  return (end - start) / durationHour;
}, function(date) {
  return date.getHours();
});

var day = newInterval(function(date) {
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setDate(date.getDate() + step);
}, function(start, end) {
  return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay;
}, function(date) {
  return date.getDate() - 1;
});

function weekday(i) {
  return newInterval(function(date) {
    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setDate(date.getDate() + step * 7);
  }, function(start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
  });
}

var sunday = weekday(0);
var monday = weekday(1);
var tuesday = weekday(2);
var wednesday = weekday(3);
var thursday = weekday(4);
var friday = weekday(5);
var saturday = weekday(6);

var month = newInterval(function(date) {
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setMonth(date.getMonth() + step);
}, function(start, end) {
  return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
}, function(date) {
  return date.getMonth();
});

var year = newInterval(function(date) {
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setFullYear(date.getFullYear() + step);
}, function(start, end) {
  return end.getFullYear() - start.getFullYear();
}, function(date) {
  return date.getFullYear();
});

// An optimized implementation for this simple case.
year.every = function(k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
    date.setFullYear(Math.floor(date.getFullYear() / k) * k);
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setFullYear(date.getFullYear() + step * k);
  });
};

var utcMinute = newInterval(function(date) {
  date.setUTCSeconds(0, 0);
}, function(date, step) {
  date.setTime(+date + step * durationMinute);
}, function(start, end) {
  return (end - start) / durationMinute;
}, function(date) {
  return date.getUTCMinutes();
});

var utcHour = newInterval(function(date) {
  date.setUTCMinutes(0, 0, 0);
}, function(date, step) {
  date.setTime(+date + step * durationHour);
}, function(start, end) {
  return (end - start) / durationHour;
}, function(date) {
  return date.getUTCHours();
});

var utcDay = newInterval(function(date) {
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCDate(date.getUTCDate() + step);
}, function(start, end) {
  return (end - start) / durationDay;
}, function(date) {
  return date.getUTCDate() - 1;
});

function utcWeekday(i) {
  return newInterval(function(date) {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCDate(date.getUTCDate() + step * 7);
  }, function(start, end) {
    return (end - start) / durationWeek;
  });
}

var utcSunday = utcWeekday(0);
var utcMonday = utcWeekday(1);
var utcTuesday = utcWeekday(2);
var utcWednesday = utcWeekday(3);
var utcThursday = utcWeekday(4);
var utcFriday = utcWeekday(5);
var utcSaturday = utcWeekday(6);

var utcMonth = newInterval(function(date) {
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCMonth(date.getUTCMonth() + step);
}, function(start, end) {
  return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
}, function(date) {
  return date.getUTCMonth();
});

var utcYear = newInterval(function(date) {
  date.setUTCMonth(0, 1);
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCFullYear(date.getUTCFullYear() + step);
}, function(start, end) {
  return end.getUTCFullYear() - start.getUTCFullYear();
}, function(date) {
  return date.getUTCFullYear();
});

// An optimized implementation for this simple case.
utcYear.every = function(k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
    date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step * k);
  });
};

function localDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
    date.setFullYear(d.y);
    return date;
  }
  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
}

function utcDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
}

function newYear(y) {
  return {y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0};
}

function formatLocale(locale) {
  var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_weekdays = locale.days,
      locale_shortWeekdays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

  var periodRe = formatRe(locale_periods),
      periodLookup = formatLookup(locale_periods),
      weekdayRe = formatRe(locale_weekdays),
      weekdayLookup = formatLookup(locale_weekdays),
      shortWeekdayRe = formatRe(locale_shortWeekdays),
      shortWeekdayLookup = formatLookup(locale_shortWeekdays),
      monthRe = formatRe(locale_months),
      monthLookup = formatLookup(locale_months),
      shortMonthRe = formatRe(locale_shortMonths),
      shortMonthLookup = formatLookup(locale_shortMonths);

  var formats = {
    "a": formatShortWeekday,
    "A": formatWeekday,
    "b": formatShortMonth,
    "B": formatMonth,
    "c": null,
    "d": formatDayOfMonth,
    "e": formatDayOfMonth,
    "H": formatHour24,
    "I": formatHour12,
    "j": formatDayOfYear,
    "L": formatMilliseconds,
    "m": formatMonthNumber,
    "M": formatMinutes,
    "p": formatPeriod,
    "S": formatSeconds,
    "U": formatWeekNumberSunday,
    "w": formatWeekdayNumber,
    "W": formatWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatYear,
    "Y": formatFullYear,
    "Z": formatZone,
    "%": formatLiteralPercent
  };

  var utcFormats = {
    "a": formatUTCShortWeekday,
    "A": formatUTCWeekday,
    "b": formatUTCShortMonth,
    "B": formatUTCMonth,
    "c": null,
    "d": formatUTCDayOfMonth,
    "e": formatUTCDayOfMonth,
    "H": formatUTCHour24,
    "I": formatUTCHour12,
    "j": formatUTCDayOfYear,
    "L": formatUTCMilliseconds,
    "m": formatUTCMonthNumber,
    "M": formatUTCMinutes,
    "p": formatUTCPeriod,
    "S": formatUTCSeconds,
    "U": formatUTCWeekNumberSunday,
    "w": formatUTCWeekdayNumber,
    "W": formatUTCWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatUTCYear,
    "Y": formatUTCFullYear,
    "Z": formatUTCZone,
    "%": formatLiteralPercent
  };

  var parses = {
    "a": parseShortWeekday,
    "A": parseWeekday,
    "b": parseShortMonth,
    "B": parseMonth,
    "c": parseLocaleDateTime,
    "d": parseDayOfMonth,
    "e": parseDayOfMonth,
    "H": parseHour24,
    "I": parseHour24,
    "j": parseDayOfYear,
    "L": parseMilliseconds,
    "m": parseMonthNumber,
    "M": parseMinutes,
    "p": parsePeriod,
    "S": parseSeconds,
    "U": parseWeekNumberSunday,
    "w": parseWeekdayNumber,
    "W": parseWeekNumberMonday,
    "x": parseLocaleDate,
    "X": parseLocaleTime,
    "y": parseYear,
    "Y": parseFullYear,
    "Z": parseZone,
    "%": parseLiteralPercent
  };

  // These recursive directive definitions must be deferred.
  formats.x = newFormat(locale_date, formats);
  formats.X = newFormat(locale_time, formats);
  formats.c = newFormat(locale_dateTime, formats);
  utcFormats.x = newFormat(locale_date, utcFormats);
  utcFormats.X = newFormat(locale_time, utcFormats);
  utcFormats.c = newFormat(locale_dateTime, utcFormats);

  function newFormat(specifier, formats) {
    return function(date) {
      var string = [],
          i = -1,
          j = 0,
          n = specifier.length,
          c,
          pad,
          format;

      if (!(date instanceof Date)) date = new Date(+date);

      while (++i < n) {
        if (specifier.charCodeAt(i) === 37) {
          string.push(specifier.slice(j, i));
          if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
          else pad = c === "e" ? " " : "0";
          if (format = formats[c]) c = format(date, pad);
          string.push(c);
          j = i + 1;
        }
      }

      string.push(specifier.slice(j, i));
      return string.join("");
    };
  }

  function newParse(specifier, newDate) {
    return function(string) {
      var d = newYear(1900),
          i = parseSpecifier(d, specifier, string += "", 0);
      if (i != string.length) return null;

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) d.H = d.H % 12 + d.p * 12;

      // Convert day-of-week and week-of-year to day-of-year.
      if ("W" in d || "U" in d) {
        if (!("w" in d)) d.w = "W" in d ? 1 : 0;
        var day$$1 = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
        d.m = 0;
        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day$$1 + 5) % 7 : d.w + d.U * 7 - (day$$1 + 6) % 7;
      }

      // If a time zone is specified, all fields are interpreted as UTC and then
      // offset according to the specified time zone.
      if ("Z" in d) {
        d.H += d.Z / 100 | 0;
        d.M += d.Z % 100;
        return utcDate(d);
      }

      // Otherwise, all fields are in local time.
      return newDate(d);
    };
  }

  function parseSpecifier(d, specifier, string, j) {
    var i = 0,
        n = specifier.length,
        m = string.length,
        c,
        parse;

    while (i < n) {
      if (j >= m) return -1;
      c = specifier.charCodeAt(i++);
      if (c === 37) {
        c = specifier.charAt(i++);
        parse = parses[c in pads ? specifier.charAt(i++) : c];
        if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }

    return j;
  }

  function parsePeriod(d, string, i) {
    var n = periodRe.exec(string.slice(i));
    return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortWeekday(d, string, i) {
    var n = shortWeekdayRe.exec(string.slice(i));
    return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseWeekday(d, string, i) {
    var n = weekdayRe.exec(string.slice(i));
    return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortMonth(d, string, i) {
    var n = shortMonthRe.exec(string.slice(i));
    return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseMonth(d, string, i) {
    var n = monthRe.exec(string.slice(i));
    return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseLocaleDateTime(d, string, i) {
    return parseSpecifier(d, locale_dateTime, string, i);
  }

  function parseLocaleDate(d, string, i) {
    return parseSpecifier(d, locale_date, string, i);
  }

  function parseLocaleTime(d, string, i) {
    return parseSpecifier(d, locale_time, string, i);
  }

  function formatShortWeekday(d) {
    return locale_shortWeekdays[d.getDay()];
  }

  function formatWeekday(d) {
    return locale_weekdays[d.getDay()];
  }

  function formatShortMonth(d) {
    return locale_shortMonths[d.getMonth()];
  }

  function formatMonth(d) {
    return locale_months[d.getMonth()];
  }

  function formatPeriod(d) {
    return locale_periods[+(d.getHours() >= 12)];
  }

  function formatUTCShortWeekday(d) {
    return locale_shortWeekdays[d.getUTCDay()];
  }

  function formatUTCWeekday(d) {
    return locale_weekdays[d.getUTCDay()];
  }

  function formatUTCShortMonth(d) {
    return locale_shortMonths[d.getUTCMonth()];
  }

  function formatUTCMonth(d) {
    return locale_months[d.getUTCMonth()];
  }

  function formatUTCPeriod(d) {
    return locale_periods[+(d.getUTCHours() >= 12)];
  }

  return {
    format: function(specifier) {
      var f = newFormat(specifier += "", formats);
      f.toString = function() { return specifier; };
      return f;
    },
    parse: function(specifier) {
      var p = newParse(specifier += "", localDate);
      p.toString = function() { return specifier; };
      return p;
    },
    utcFormat: function(specifier) {
      var f = newFormat(specifier += "", utcFormats);
      f.toString = function() { return specifier; };
      return f;
    },
    utcParse: function(specifier) {
      var p = newParse(specifier, utcDate);
      p.toString = function() { return specifier; };
      return p;
    }
  };
}

var pads = {"-": "", "_": " ", "0": "0"};
var numberRe = /^\s*\d+/;
var percentRe = /^%/;
var requoteRe = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;

function pad$1(value, fill, width) {
  var sign = value < 0 ? "-" : "",
      string = (sign ? -value : value) + "",
      length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}

function requote(s) {
  return s.replace(requoteRe, "\\$&");
}

function formatRe(names) {
  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
}

function formatLookup(names) {
  var map = {}, i = -1, n = names.length;
  while (++i < n) map[names[i].toLowerCase()] = i;
  return map;
}

function parseWeekdayNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.w = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.U = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.W = +n[0], i + n[0].length) : -1;
}

function parseFullYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 4));
  return n ? (d.y = +n[0], i + n[0].length) : -1;
}

function parseYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
}

function parseZone(d, string, i) {
  var n = /^(Z)|([+-]\d\d)(?:\:?(\d\d))?/.exec(string.slice(i, i + 6));
  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
}

function parseMonthNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
}

function parseDayOfMonth(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.d = +n[0], i + n[0].length) : -1;
}

function parseDayOfYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
}

function parseHour24(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.H = +n[0], i + n[0].length) : -1;
}

function parseMinutes(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.M = +n[0], i + n[0].length) : -1;
}

function parseSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.S = +n[0], i + n[0].length) : -1;
}

function parseMilliseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.L = +n[0], i + n[0].length) : -1;
}

function parseLiteralPercent(d, string, i) {
  var n = percentRe.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}

function formatDayOfMonth(d, p) {
  return pad$1(d.getDate(), p, 2);
}

function formatHour24(d, p) {
  return pad$1(d.getHours(), p, 2);
}

function formatHour12(d, p) {
  return pad$1(d.getHours() % 12 || 12, p, 2);
}

function formatDayOfYear(d, p) {
  return pad$1(1 + day.count(year(d), d), p, 3);
}

function formatMilliseconds(d, p) {
  return pad$1(d.getMilliseconds(), p, 3);
}

function formatMonthNumber(d, p) {
  return pad$1(d.getMonth() + 1, p, 2);
}

function formatMinutes(d, p) {
  return pad$1(d.getMinutes(), p, 2);
}

function formatSeconds(d, p) {
  return pad$1(d.getSeconds(), p, 2);
}

function formatWeekNumberSunday(d, p) {
  return pad$1(sunday.count(year(d), d), p, 2);
}

function formatWeekdayNumber(d) {
  return d.getDay();
}

function formatWeekNumberMonday(d, p) {
  return pad$1(monday.count(year(d), d), p, 2);
}

function formatYear(d, p) {
  return pad$1(d.getFullYear() % 100, p, 2);
}

function formatFullYear(d, p) {
  return pad$1(d.getFullYear() % 10000, p, 4);
}

function formatZone(d) {
  var z = d.getTimezoneOffset();
  return (z > 0 ? "-" : (z *= -1, "+"))
      + pad$1(z / 60 | 0, "0", 2)
      + pad$1(z % 60, "0", 2);
}

function formatUTCDayOfMonth(d, p) {
  return pad$1(d.getUTCDate(), p, 2);
}

function formatUTCHour24(d, p) {
  return pad$1(d.getUTCHours(), p, 2);
}

function formatUTCHour12(d, p) {
  return pad$1(d.getUTCHours() % 12 || 12, p, 2);
}

function formatUTCDayOfYear(d, p) {
  return pad$1(1 + utcDay.count(utcYear(d), d), p, 3);
}

function formatUTCMilliseconds(d, p) {
  return pad$1(d.getUTCMilliseconds(), p, 3);
}

function formatUTCMonthNumber(d, p) {
  return pad$1(d.getUTCMonth() + 1, p, 2);
}

function formatUTCMinutes(d, p) {
  return pad$1(d.getUTCMinutes(), p, 2);
}

function formatUTCSeconds(d, p) {
  return pad$1(d.getUTCSeconds(), p, 2);
}

function formatUTCWeekNumberSunday(d, p) {
  return pad$1(utcSunday.count(utcYear(d), d), p, 2);
}

function formatUTCWeekdayNumber(d) {
  return d.getUTCDay();
}

function formatUTCWeekNumberMonday(d, p) {
  return pad$1(utcMonday.count(utcYear(d), d), p, 2);
}

function formatUTCYear(d, p) {
  return pad$1(d.getUTCFullYear() % 100, p, 2);
}

function formatUTCFullYear(d, p) {
  return pad$1(d.getUTCFullYear() % 10000, p, 4);
}

function formatUTCZone() {
  return "+0000";
}

function formatLiteralPercent() {
  return "%";
}

var locale$1;
var timeFormat;
var timeParse;
var utcFormat;
var utcParse;

defaultLocale({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

function defaultLocale(definition) {
  locale$1 = formatLocale(definition);
  timeFormat = locale$1.format;
  timeParse = locale$1.parse;
  utcFormat = locale$1.utcFormat;
  utcParse = locale$1.utcParse;
  return locale$1;
}

var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

function formatIsoNative(date) {
  return date.toISOString();
}

var formatIso = Date.prototype.toISOString
    ? formatIsoNative
    : utcFormat(isoSpecifier);

function parseIsoNative(string) {
  var date = new Date(string);
  return isNaN(date) ? null : date;
}

var parseIso = +new Date("2000-01-01T00:00:00.000Z")
    ? parseIsoNative
    : utcParse(isoSpecifier);

var read = function(data, schema, dateParse) {
  schema = schema || {};

  var reader = formats$1(schema.type || 'json');
  if (!reader) error$1('Unknown data format type: ' + schema.type);

  data = reader(data, schema);
  if (schema.parse) parse(data, schema.parse, dateParse);

  if (data.hasOwnProperty('columns')) delete data.columns;
  return data;
};

function parse(data, types, dateParse) {
  dateParse = dateParse || timeParse;

  var fields = data.columns || Object.keys(data[0]),
      parsers, datum, field$$1, i, j, n, m;

  if (types === 'auto') types = inferTypes(data, fields);

  fields = Object.keys(types);
  parsers = fields.map(function(field$$1) {
    var type = types[field$$1],
        parts, pattern;

    if (type && (type.indexOf('date:') === 0 || type.indexOf('utc:') === 0)) {
      parts = type.split(/:(.+)?/, 2);  // split on first :
      pattern = parts[1];

      if ((pattern[0] === '\'' && pattern[pattern.length-1] === '\'') ||
          (pattern[0] === '"'  && pattern[pattern.length-1] === '"')) {
        pattern = pattern.slice(1, -1);
      }

      return parts[0] === 'utc' ? utcParse(pattern) : dateParse(pattern);
    }

    if (!typeParsers[type]) {
      throw Error('Illegal format pattern: ' + field$$1 + ':' + type);
    }

    return typeParsers[type];
  });

  for (i=0, n=data.length, m=fields.length; i<n; ++i) {
    datum = data[i];
    for (j=0; j<m; ++j) {
      field$$1 = fields[j];
      datum[field$$1] = parsers[j](datum[field$$1]);
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

prototype.empty = function() {
  return (
    this.x1 === +Number.MAX_VALUE &&
    this.y1 === +Number.MAX_VALUE &&
    this.x2 === -Number.MAX_VALUE &&
    this.y2 === -Number.MAX_VALUE
  );
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

var Gradient = function(p0, p1) {
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
};

function Item(mark) {
  this.mark = mark;
  this.bounds = (this.bounds || new Bounds());
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

var Canvas$1 = function(w, h) {
  var canvas = domCreate(null, 'canvas');
  if (canvas && canvas.getContext) {
    canvas.width = w;
    canvas.height = h;
  } else if (Canvas) {
    try {
      canvas = new Canvas(w, h);
    } catch (e) {
      canvas = null;
    }
  }
  return canvas;
};

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

function increment(loader$$1) {
  loader$$1._pending += 1;
}

function decrement(loader$$1) {
  loader$$1._pending -= 1;
}

prototype$1.sanitizeURL = function(uri) {
  var loader$$1 = this;
  increment(loader$$1);

  return loader$$1._loader.sanitize(uri, {context:'href'})
    .then(function(opt) {
      decrement(loader$$1);
      return opt;
    })
    .catch(function() {
      decrement(loader$$1);
      return null;
    });
};

prototype$1.loadImage = function(uri) {
  var loader$$1 = this;
  increment(loader$$1);

  return loader$$1._loader
    .sanitize(uri, {context:'image'})
    .then(function(opt) {
      var url = opt.href;
      if (!url || !Image$1) throw {url: url};

      var image = new Image$1();

      image.onload = function() {
        decrement(loader$$1);
        image.loaded = true;
      };

      image.onerror = function() {
        decrement(loader$$1);
        image.loaded = false;
      };

      image.src = url;
      return image;
    })
    .catch(function(e) {
      decrement(loader$$1);
      return {loaded: false, width: 0, height: 0, src: e && e.url || ''};
    });
};

prototype$1.ready = function() {
  var loader$$1 = this;
  return new Promise(function(accept) {
    function poll(value) {
      if (!loader$$1.pending()) accept(value);
      else setTimeout(function() { poll(true); }, 10);
    }
    poll(false);
  });
};

var pi = Math.PI;
var tau = 2 * pi;
var epsilon = 1e-6;
var tauEpsilon = tau - epsilon;

function Path() {
  this._x0 = this._y0 = // start of current subpath
  this._x1 = this._y1 = null; // end of current subpath
  this._ = "";
}

function path() {
  return new Path;
}

Path.prototype = path.prototype = {
  constructor: Path,
  moveTo: function(x, y) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
  },
  closePath: function() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._ += "Z";
    }
  },
  lineTo: function(x, y) {
    this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  quadraticCurveTo: function(x1, y1, x, y) {
    this._ += "Q" + (+x1) + "," + (+y1) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  bezierCurveTo: function(x1, y1, x2, y2, x, y) {
    this._ += "C" + (+x1) + "," + (+y1) + "," + (+x2) + "," + (+y2) + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  arcTo: function(x1, y1, x2, y2, r) {
    x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
    var x0 = this._x1,
        y0 = this._y1,
        x21 = x2 - x1,
        y21 = y2 - y1,
        x01 = x0 - x1,
        y01 = y0 - y1,
        l01_2 = x01 * x01 + y01 * y01;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x1,y1).
    if (this._x1 === null) {
      this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
    }

    // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
    else if (!(l01_2 > epsilon)) {}

    // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
    // Equivalently, is (x1,y1) coincident with (x2,y2)?
    // Or, is the radius zero? Line to (x1,y1).
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
      this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
    }

    // Otherwise, draw an arc!
    else {
      var x20 = x2 - x0,
          y20 = y2 - y0,
          l21_2 = x21 * x21 + y21 * y21,
          l20_2 = x20 * x20 + y20 * y20,
          l21 = Math.sqrt(l21_2),
          l01 = Math.sqrt(l01_2),
          l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
          t01 = l / l01,
          t21 = l / l21;

      // If the start tangent is not coincident with (x0,y0), line to.
      if (Math.abs(t01 - 1) > epsilon) {
        this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
      }

      this._ += "A" + r + "," + r + ",0,0," + (+(y01 * x20 > x01 * y20)) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
    }
  },
  arc: function(x, y, r, a0, a1, ccw) {
    x = +x, y = +y, r = +r;
    var dx = r * Math.cos(a0),
        dy = r * Math.sin(a0),
        x0 = x + dx,
        y0 = y + dy,
        cw = 1 ^ ccw,
        da = ccw ? a0 - a1 : a1 - a0;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x0,y0).
    if (this._x1 === null) {
      this._ += "M" + x0 + "," + y0;
    }

    // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
    else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
      this._ += "L" + x0 + "," + y0;
    }

    // Is this arc empty? We’re done.
    if (!r) return;

    // Does the angle go the wrong way? Flip the direction.
    if (da < 0) da = da % tau + tau;

    // Is this a complete circle? Draw two arcs to complete the circle.
    if (da > tauEpsilon) {
      this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
    }

    // Is this arc non-empty? Draw an arc!
    else if (da > epsilon) {
      this._ += "A" + r + "," + r + ",0," + (+(da >= pi)) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
    }
  },
  rect: function(x, y, w, h) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + (+w) + "v" + (+h) + "h" + (-w) + "Z";
  },
  toString: function() {
    return this._;
  }
};

var constant$2 = function(x) {
  return function constant() {
    return x;
  };
};

var abs = Math.abs;
var atan2 = Math.atan2;
var cos = Math.cos;
var max$1 = Math.max;
var min$1 = Math.min;
var sin = Math.sin;
var sqrt = Math.sqrt;

var epsilon$1 = 1e-12;
var pi$1 = Math.PI;
var halfPi = pi$1 / 2;
var tau$1 = 2 * pi$1;

function acos(x) {
  return x > 1 ? 0 : x < -1 ? pi$1 : Math.acos(x);
}

function asin(x) {
  return x >= 1 ? halfPi : x <= -1 ? -halfPi : Math.asin(x);
}

function arcInnerRadius(d) {
  return d.innerRadius;
}

function arcOuterRadius(d) {
  return d.outerRadius;
}

function arcStartAngle(d) {
  return d.startAngle;
}

function arcEndAngle(d) {
  return d.endAngle;
}

function arcPadAngle(d) {
  return d && d.padAngle; // Note: optional!
}

function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
  var x10 = x1 - x0, y10 = y1 - y0,
      x32 = x3 - x2, y32 = y3 - y2,
      t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / (y32 * x10 - x32 * y10);
  return [x0 + t * x10, y0 + t * y10];
}

// Compute perpendicular offset line of length rc.
// http://mathworld.wolfram.com/Circle-LineIntersection.html
function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
  var x01 = x0 - x1,
      y01 = y0 - y1,
      lo = (cw ? rc : -rc) / sqrt(x01 * x01 + y01 * y01),
      ox = lo * y01,
      oy = -lo * x01,
      x11 = x0 + ox,
      y11 = y0 + oy,
      x10 = x1 + ox,
      y10 = y1 + oy,
      x00 = (x11 + x10) / 2,
      y00 = (y11 + y10) / 2,
      dx = x10 - x11,
      dy = y10 - y11,
      d2 = dx * dx + dy * dy,
      r = r1 - rc,
      D = x11 * y10 - x10 * y11,
      d = (dy < 0 ? -1 : 1) * sqrt(max$1(0, r * r * d2 - D * D)),
      cx0 = (D * dy - dx * d) / d2,
      cy0 = (-D * dx - dy * d) / d2,
      cx1 = (D * dy + dx * d) / d2,
      cy1 = (-D * dx + dy * d) / d2,
      dx0 = cx0 - x00,
      dy0 = cy0 - y00,
      dx1 = cx1 - x00,
      dy1 = cy1 - y00;

  // Pick the closer of the two intersection points.
  // TODO Is there a faster way to determine which intersection to use?
  if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;

  return {
    cx: cx0,
    cy: cy0,
    x01: -ox,
    y01: -oy,
    x11: cx0 * (r1 / r - 1),
    y11: cy0 * (r1 / r - 1)
  };
}

var d3_arc = function() {
  var innerRadius = arcInnerRadius,
      outerRadius = arcOuterRadius,
      cornerRadius = constant$2(0),
      padRadius = null,
      startAngle = arcStartAngle,
      endAngle = arcEndAngle,
      padAngle = arcPadAngle,
      context = null;

  function arc() {
    var buffer,
        r,
        r0 = +innerRadius.apply(this, arguments),
        r1 = +outerRadius.apply(this, arguments),
        a0 = startAngle.apply(this, arguments) - halfPi,
        a1 = endAngle.apply(this, arguments) - halfPi,
        da = abs(a1 - a0),
        cw = a1 > a0;

    if (!context) context = buffer = path();

    // Ensure that the outer radius is always larger than the inner radius.
    if (r1 < r0) r = r1, r1 = r0, r0 = r;

    // Is it a point?
    if (!(r1 > epsilon$1)) context.moveTo(0, 0);

    // Or is it a circle or annulus?
    else if (da > tau$1 - epsilon$1) {
      context.moveTo(r1 * cos(a0), r1 * sin(a0));
      context.arc(0, 0, r1, a0, a1, !cw);
      if (r0 > epsilon$1) {
        context.moveTo(r0 * cos(a1), r0 * sin(a1));
        context.arc(0, 0, r0, a1, a0, cw);
      }
    }

    // Or is it a circular or annular sector?
    else {
      var a01 = a0,
          a11 = a1,
          a00 = a0,
          a10 = a1,
          da0 = da,
          da1 = da,
          ap = padAngle.apply(this, arguments) / 2,
          rp = (ap > epsilon$1) && (padRadius ? +padRadius.apply(this, arguments) : sqrt(r0 * r0 + r1 * r1)),
          rc = min$1(abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
          rc0 = rc,
          rc1 = rc,
          t0,
          t1;

      // Apply padding? Note that since r1 ≥ r0, da1 ≥ da0.
      if (rp > epsilon$1) {
        var p0 = asin(rp / r0 * sin(ap)),
            p1 = asin(rp / r1 * sin(ap));
        if ((da0 -= p0 * 2) > epsilon$1) p0 *= (cw ? 1 : -1), a00 += p0, a10 -= p0;
        else da0 = 0, a00 = a10 = (a0 + a1) / 2;
        if ((da1 -= p1 * 2) > epsilon$1) p1 *= (cw ? 1 : -1), a01 += p1, a11 -= p1;
        else da1 = 0, a01 = a11 = (a0 + a1) / 2;
      }

      var x01 = r1 * cos(a01),
          y01 = r1 * sin(a01),
          x10 = r0 * cos(a10),
          y10 = r0 * sin(a10);

      // Apply rounded corners?
      if (rc > epsilon$1) {
        var x11 = r1 * cos(a11),
            y11 = r1 * sin(a11),
            x00 = r0 * cos(a00),
            y00 = r0 * sin(a00);

        // Restrict the corner radius according to the sector angle.
        if (da < pi$1) {
          var oc = da0 > epsilon$1 ? intersect(x01, y01, x00, y00, x11, y11, x10, y10) : [x10, y10],
              ax = x01 - oc[0],
              ay = y01 - oc[1],
              bx = x11 - oc[0],
              by = y11 - oc[1],
              kc = 1 / sin(acos((ax * bx + ay * by) / (sqrt(ax * ax + ay * ay) * sqrt(bx * bx + by * by))) / 2),
              lc = sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
          rc0 = min$1(rc, (r0 - lc) / (kc - 1));
          rc1 = min$1(rc, (r1 - lc) / (kc + 1));
        }
      }

      // Is the sector collapsed to a line?
      if (!(da1 > epsilon$1)) context.moveTo(x01, y01);

      // Does the sector’s outer ring have rounded corners?
      else if (rc1 > epsilon$1) {
        t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
        t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);

        context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);

        // Have the corners merged?
        if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

        // Otherwise, draw the two corners and the ring.
        else {
          context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
          context.arc(0, 0, r1, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
          context.arc(t1.cx, t1.cy, rc1, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
        }
      }

      // Or is the outer ring just a circular arc?
      else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);

      // Is there no inner ring, and it’s a circular sector?
      // Or perhaps it’s an annular sector collapsed due to padding?
      if (!(r0 > epsilon$1) || !(da0 > epsilon$1)) context.lineTo(x10, y10);

      // Does the sector’s inner ring (or point) have rounded corners?
      else if (rc0 > epsilon$1) {
        t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
        t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);

        context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);

        // Have the corners merged?
        if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

        // Otherwise, draw the two corners and the ring.
        else {
          context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
          context.arc(0, 0, r0, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw);
          context.arc(t1.cx, t1.cy, rc0, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
        }
      }

      // Or is the inner ring just a circular arc?
      else context.arc(0, 0, r0, a10, a00, cw);
    }

    context.closePath();

    if (buffer) return context = null, buffer + "" || null;
  }

  arc.centroid = function() {
    var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
        a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi$1 / 2;
    return [cos(a) * r, sin(a) * r];
  };

  arc.innerRadius = function(_) {
    return arguments.length ? (innerRadius = typeof _ === "function" ? _ : constant$2(+_), arc) : innerRadius;
  };

  arc.outerRadius = function(_) {
    return arguments.length ? (outerRadius = typeof _ === "function" ? _ : constant$2(+_), arc) : outerRadius;
  };

  arc.cornerRadius = function(_) {
    return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : constant$2(+_), arc) : cornerRadius;
  };

  arc.padRadius = function(_) {
    return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : constant$2(+_), arc) : padRadius;
  };

  arc.startAngle = function(_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$2(+_), arc) : startAngle;
  };

  arc.endAngle = function(_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$2(+_), arc) : endAngle;
  };

  arc.padAngle = function(_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$2(+_), arc) : padAngle;
  };

  arc.context = function(_) {
    return arguments.length ? ((context = _ == null ? null : _), arc) : context;
  };

  return arc;
};

function Linear(context) {
  this._context = context;
}

Linear.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; // proceed
      default: this._context.lineTo(x, y); break;
    }
  }
};

var curveLinear = function(context) {
  return new Linear(context);
};

function x$1(p) {
  return p[0];
}

function y$1(p) {
  return p[1];
}

var line$1 = function() {
  var x = x$1,
      y = y$1,
      defined = constant$2(true),
      context = null,
      curve = curveLinear,
      output = null;

  function line(data) {
    var i,
        n = data.length,
        d,
        defined0 = false,
        buffer;

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) output.lineStart();
        else output.lineEnd();
      }
      if (defined0) output.point(+x(d, i, data), +y(d, i, data));
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  line.x = function(_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant$2(+_), line) : x;
  };

  line.y = function(_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant$2(+_), line) : y;
  };

  line.defined = function(_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant$2(!!_), line) : defined;
  };

  line.curve = function(_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
  };

  line.context = function(_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
  };

  return line;
};

var area$1 = function() {
  var x0 = x$1,
      x1 = null,
      y0 = constant$2(0),
      y1 = y$1,
      defined = constant$2(true),
      context = null,
      curve = curveLinear,
      output = null;

  function area(data) {
    var i,
        j,
        k,
        n = data.length,
        d,
        defined0 = false,
        buffer,
        x0z = new Array(n),
        y0z = new Array(n);

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) {
          j = i;
          output.areaStart();
          output.lineStart();
        } else {
          output.lineEnd();
          output.lineStart();
          for (k = i - 1; k >= j; --k) {
            output.point(x0z[k], y0z[k]);
          }
          output.lineEnd();
          output.areaEnd();
        }
      }
      if (defined0) {
        x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data);
        output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
      }
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  function arealine() {
    return line$1().defined(defined).curve(curve).context(context);
  }

  area.x = function(_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$2(+_), x1 = null, area) : x0;
  };

  area.x0 = function(_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$2(+_), area) : x0;
  };

  area.x1 = function(_) {
    return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : constant$2(+_), area) : x1;
  };

  area.y = function(_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$2(+_), y1 = null, area) : y0;
  };

  area.y0 = function(_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$2(+_), area) : y0;
  };

  area.y1 = function(_) {
    return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : constant$2(+_), area) : y1;
  };

  area.lineX0 =
  area.lineY0 = function() {
    return arealine().x(x0).y(y0);
  };

  area.lineY1 = function() {
    return arealine().x(x0).y(y1);
  };

  area.lineX1 = function() {
    return arealine().x(x1).y(y0);
  };

  area.defined = function(_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant$2(!!_), area) : defined;
  };

  area.curve = function(_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
  };

  area.context = function(_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
  };

  return area;
};

var circle = {
  draw: function(context, size) {
    var r = Math.sqrt(size / pi$1);
    context.moveTo(r, 0);
    context.arc(0, 0, r, 0, tau$1);
  }
};

var d3_symbol = function() {
  var type = constant$2(circle),
      size = constant$2(64),
      context = null;

  function symbol() {
    var buffer;
    if (!context) context = buffer = path();
    type.apply(this, arguments).draw(context, +size.apply(this, arguments));
    if (buffer) return context = null, buffer + "" || null;
  }

  symbol.type = function(_) {
    return arguments.length ? (type = typeof _ === "function" ? _ : constant$2(_), symbol) : type;
  };

  symbol.size = function(_) {
    return arguments.length ? (size = typeof _ === "function" ? _ : constant$2(+_), symbol) : size;
  };

  symbol.context = function(_) {
    return arguments.length ? (context = _ == null ? null : _, symbol) : context;
  };

  return symbol;
};

var noop$2 = function() {};

function point(that, x, y) {
  that._context.bezierCurveTo(
    (2 * that._x0 + that._x1) / 3,
    (2 * that._y0 + that._y1) / 3,
    (that._x0 + 2 * that._x1) / 3,
    (that._y0 + 2 * that._y1) / 3,
    (that._x0 + 4 * that._x1 + x) / 6,
    (that._y0 + 4 * that._y1 + y) / 6
  );
}

function Basis(context) {
  this._context = context;
}

Basis.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 =
    this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 3: point(this, this._x1, this._y1); // proceed
      case 2: this._context.lineTo(this._x1, this._y1); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6); // proceed
      default: point(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var curveBasis = function(context) {
  return new Basis(context);
};

function BasisClosed(context) {
  this._context = context;
}

BasisClosed.prototype = {
  areaStart: noop$2,
  areaEnd: noop$2,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 =
    this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x2, this._y2);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3);
        this._context.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x2, this._y2);
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        break;
      }
    }
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._x2 = x, this._y2 = y; break;
      case 1: this._point = 2; this._x3 = x, this._y3 = y; break;
      case 2: this._point = 3; this._x4 = x, this._y4 = y; this._context.moveTo((this._x0 + 4 * this._x1 + x) / 6, (this._y0 + 4 * this._y1 + y) / 6); break;
      default: point(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var curveBasisClosed = function(context) {
  return new BasisClosed(context);
};

function BasisOpen(context) {
  this._context = context;
}

BasisOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 =
    this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; var x0 = (this._x0 + 4 * this._x1 + x) / 6, y0 = (this._y0 + 4 * this._y1 + y) / 6; this._line ? this._context.lineTo(x0, y0) : this._context.moveTo(x0, y0); break;
      case 3: this._point = 4; // proceed
      default: point(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var curveBasisOpen = function(context) {
  return new BasisOpen(context);
};

function Bundle(context, beta) {
  this._basis = new Basis(context);
  this._beta = beta;
}

Bundle.prototype = {
  lineStart: function() {
    this._x = [];
    this._y = [];
    this._basis.lineStart();
  },
  lineEnd: function() {
    var x = this._x,
        y = this._y,
        j = x.length - 1;

    if (j > 0) {
      var x0 = x[0],
          y0 = y[0],
          dx = x[j] - x0,
          dy = y[j] - y0,
          i = -1,
          t;

      while (++i <= j) {
        t = i / j;
        this._basis.point(
          this._beta * x[i] + (1 - this._beta) * (x0 + t * dx),
          this._beta * y[i] + (1 - this._beta) * (y0 + t * dy)
        );
      }
    }

    this._x = this._y = null;
    this._basis.lineEnd();
  },
  point: function(x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};

var curveBundle = (function custom(beta) {

  function bundle(context) {
    return beta === 1 ? new Basis(context) : new Bundle(context, beta);
  }

  bundle.beta = function(beta) {
    return custom(+beta);
  };

  return bundle;
})(0.85);

function point$1(that, x, y) {
  that._context.bezierCurveTo(
    that._x1 + that._k * (that._x2 - that._x0),
    that._y1 + that._k * (that._y2 - that._y0),
    that._x2 + that._k * (that._x1 - x),
    that._y2 + that._k * (that._y1 - y),
    that._x2,
    that._y2
  );
}

function Cardinal(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

Cardinal.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 =
    this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2: this._context.lineTo(this._x2, this._y2); break;
      case 3: point$1(this, this._x1, this._y1); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; this._x1 = x, this._y1 = y; break;
      case 2: this._point = 3; // proceed
      default: point$1(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var curveCardinal = (function custom(tension) {

  function cardinal(context) {
    return new Cardinal(context, tension);
  }

  cardinal.tension = function(tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function CardinalClosed(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

CardinalClosed.prototype = {
  areaStart: noop$2,
  areaEnd: noop$2,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 =
    this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.lineTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        this.point(this._x5, this._y5);
        break;
      }
    }
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._x3 = x, this._y3 = y; break;
      case 1: this._point = 2; this._context.moveTo(this._x4 = x, this._y4 = y); break;
      case 2: this._point = 3; this._x5 = x, this._y5 = y; break;
      default: point$1(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var curveCardinalClosed = (function custom(tension) {

  function cardinal(context) {
    return new CardinalClosed(context, tension);
  }

  cardinal.tension = function(tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function CardinalOpen(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

CardinalOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 =
    this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2); break;
      case 3: this._point = 4; // proceed
      default: point$1(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var curveCardinalOpen = (function custom(tension) {

  function cardinal(context) {
    return new CardinalOpen(context, tension);
  }

  cardinal.tension = function(tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function point$2(that, x, y) {
  var x1 = that._x1,
      y1 = that._y1,
      x2 = that._x2,
      y2 = that._y2;

  if (that._l01_a > epsilon$1) {
    var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
        n = 3 * that._l01_a * (that._l01_a + that._l12_a);
    x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
    y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
  }

  if (that._l23_a > epsilon$1) {
    var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
        m = 3 * that._l23_a * (that._l23_a + that._l12_a);
    x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m;
    y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m;
  }

  that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2);
}

function CatmullRom(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRom.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 =
    this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a =
    this._l01_2a = this._l12_2a = this._l23_2a =
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2: this._context.lineTo(this._x2, this._y2); break;
      case 3: this.point(this._x2, this._y2); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; // proceed
      default: point$2(this, x, y); break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var curveCatmullRom = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0);
  }

  catmullRom.alpha = function(alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function CatmullRomClosed(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRomClosed.prototype = {
  areaStart: noop$2,
  areaEnd: noop$2,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 =
    this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._l01_a = this._l12_a = this._l23_a =
    this._l01_2a = this._l12_2a = this._l23_2a =
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.lineTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        this.point(this._x5, this._y5);
        break;
      }
    }
  },
  point: function(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0: this._point = 1; this._x3 = x, this._y3 = y; break;
      case 1: this._point = 2; this._context.moveTo(this._x4 = x, this._y4 = y); break;
      case 2: this._point = 3; this._x5 = x, this._y5 = y; break;
      default: point$2(this, x, y); break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var curveCatmullRomClosed = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRomClosed(context, alpha) : new CardinalClosed(context, 0);
  }

  catmullRom.alpha = function(alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function CatmullRomOpen(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRomOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 =
    this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a =
    this._l01_2a = this._l12_2a = this._l23_2a =
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0: this._point = 1; break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2); break;
      case 3: this._point = 4; // proceed
      default: point$2(this, x, y); break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var curveCatmullRomOpen = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRomOpen(context, alpha) : new CardinalOpen(context, 0);
  }

  catmullRom.alpha = function(alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function LinearClosed(context) {
  this._context = context;
}

LinearClosed.prototype = {
  areaStart: noop$2,
  areaEnd: noop$2,
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._point) this._context.closePath();
  },
  point: function(x, y) {
    x = +x, y = +y;
    if (this._point) this._context.lineTo(x, y);
    else this._point = 1, this._context.moveTo(x, y);
  }
};

var curveLinearClosed = function(context) {
  return new LinearClosed(context);
};

function sign(x) {
  return x < 0 ? -1 : 1;
}

// Calculate the slopes of the tangents (Hermite-type interpolation) based on
// the following paper: Steffen, M. 1990. A Simple Method for Monotonic
// Interpolation in One Dimension. Astronomy and Astrophysics, Vol. 239, NO.
// NOV(II), P. 443, 1990.
function slope3(that, x2, y2) {
  var h0 = that._x1 - that._x0,
      h1 = x2 - that._x1,
      s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0),
      s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0),
      p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}

// Calculate a one-sided slope.
function slope2(that, t) {
  var h = that._x1 - that._x0;
  return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
}

// According to https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Representations
// "you can express cubic Hermite interpolation in terms of cubic Bézier curves
// with respect to the four values p0, p0 + m0 / 3, p1 - m1 / 3, p1".
function point$3(that, t0, t1) {
  var x0 = that._x0,
      y0 = that._y0,
      x1 = that._x1,
      y1 = that._y1,
      dx = (x1 - x0) / 3;
  that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
}

function MonotoneX(context) {
  this._context = context;
}

MonotoneX.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 =
    this._y0 = this._y1 =
    this._t0 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2: this._context.lineTo(this._x1, this._y1); break;
      case 3: point$3(this, this._t0, slope2(this, this._t0)); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    var t1 = NaN;

    x = +x, y = +y;
    if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; point$3(this, slope2(this, t1 = slope3(this, x, y)), t1); break;
      default: point$3(this, this._t0, t1 = slope3(this, x, y)); break;
    }

    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
    this._t0 = t1;
  }
};

function MonotoneY(context) {
  this._context = new ReflectContext(context);
}

(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function(x, y) {
  MonotoneX.prototype.point.call(this, y, x);
};

function ReflectContext(context) {
  this._context = context;
}

ReflectContext.prototype = {
  moveTo: function(x, y) { this._context.moveTo(y, x); },
  closePath: function() { this._context.closePath(); },
  lineTo: function(x, y) { this._context.lineTo(y, x); },
  bezierCurveTo: function(x1, y1, x2, y2, x, y) { this._context.bezierCurveTo(y1, x1, y2, x2, y, x); }
};

function monotoneX(context) {
  return new MonotoneX(context);
}

function monotoneY(context) {
  return new MonotoneY(context);
}

function Natural(context) {
  this._context = context;
}

Natural.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x = [];
    this._y = [];
  },
  lineEnd: function() {
    var x = this._x,
        y = this._y,
        n = x.length;

    if (n) {
      this._line ? this._context.lineTo(x[0], y[0]) : this._context.moveTo(x[0], y[0]);
      if (n === 2) {
        this._context.lineTo(x[1], y[1]);
      } else {
        var px = controlPoints(x),
            py = controlPoints(y);
        for (var i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
          this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x[i1], y[i1]);
        }
      }
    }

    if (this._line || (this._line !== 0 && n === 1)) this._context.closePath();
    this._line = 1 - this._line;
    this._x = this._y = null;
  },
  point: function(x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};

// See https://www.particleincell.com/2012/bezier-splines/ for derivation.
function controlPoints(x) {
  var i,
      n = x.length - 1,
      m,
      a = new Array(n),
      b = new Array(n),
      r = new Array(n);
  a[0] = 0, b[0] = 2, r[0] = x[0] + 2 * x[1];
  for (i = 1; i < n - 1; ++i) a[i] = 1, b[i] = 4, r[i] = 4 * x[i] + 2 * x[i + 1];
  a[n - 1] = 2, b[n - 1] = 7, r[n - 1] = 8 * x[n - 1] + x[n];
  for (i = 1; i < n; ++i) m = a[i] / b[i - 1], b[i] -= m, r[i] -= m * r[i - 1];
  a[n - 1] = r[n - 1] / b[n - 1];
  for (i = n - 2; i >= 0; --i) a[i] = (r[i] - a[i + 1]) / b[i];
  b[n - 1] = (x[n] + a[n - 1]) / 2;
  for (i = 0; i < n - 1; ++i) b[i] = 2 * x[i + 1] - a[i + 1];
  return [a, b];
}

var curveNatural = function(context) {
  return new Natural(context);
};

function Step(context, t) {
  this._context = context;
  this._t = t;
}

Step.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x = this._y = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; // proceed
      default: {
        if (this._t <= 0) {
          this._context.lineTo(this._x, y);
          this._context.lineTo(x, y);
        } else {
          var x1 = this._x * (1 - this._t) + x * this._t;
          this._context.lineTo(x1, this._y);
          this._context.lineTo(x1, y);
        }
        break;
      }
    }
    this._x = x, this._y = y;
  }
};

var curveStep = function(context) {
  return new Step(context, 0.5);
};

function stepBefore(context) {
  return new Step(context, 0);
}

function stepAfter(context) {
  return new Step(context, 1);
}

var lookup = {
  'basis': {
    curve: curveBasis
  },
  'basis-closed': {
    curve: curveBasisClosed
  },
  'basis-open': {
    curve: curveBasisOpen
  },
  'bundle': {
    curve: curveBundle,
    tension: 'beta',
    value: 0.85
  },
  'cardinal': {
    curve: curveCardinal,
    tension: 'tension',
    value: 0
  },
  'cardinal-open': {
    curve: curveCardinalOpen,
    tension: 'tension',
    value: 0
  },
  'cardinal-closed': {
    curve: curveCardinalClosed,
    tension: 'tension',
    value: 0
  },
  'catmull-rom': {
    curve: curveCatmullRom,
    tension: 'alpha',
    value: 0.5
  },
  'catmull-rom-closed': {
    curve: curveCatmullRomClosed,
    tension: 'alpha',
    value: 0.5
  },
  'catmull-rom-open': {
    curve: curveCatmullRomOpen,
    tension: 'alpha',
    value: 0.5
  },
  'linear': {
    curve: curveLinear
  },
  'linear-closed': {
    curve: curveLinearClosed
  },
  'monotone': {
    horizontal: monotoneY,
    vertical:   monotoneX
  },
  'natural': {
    curve: curveNatural
  },
  'step': {
    curve: curveStep
  },
  'step-after': {
    curve: stepAfter
  },
  'step-before': {
    curve: stepBefore
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

var pathParse = function(pathstr) {
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
};

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

var pathRender = function(context, path, l, t, s) {
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
};

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

var tau$2 = 2 * Math.PI;
var halfSqrt3 = Math.sqrt(3) / 2;

var builtins = {
  'circle': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2;
      context.moveTo(r, 0);
      context.arc(0, 0, r, 0, tau$2);
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

function symbols$1(_) {
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

function constant$3(_) {
  return function() { return _; };
}

var vg_rect = function() {
  var x = rectangleX,
      y = rectangleY,
      width = rectangleWidth,
      height = rectangleHeight,
      cornerRadius = constant$3(0),
      context = null;

  function rectangle(_, x0, y0) {
    var buffer,
        x1 = x0 != null ? x0 : +x.call(this, _),
        y1 = y0 != null ? y0 : +y.call(this, _),
        w  = +width.call(this, _),
        h  = +height.call(this, _),
        cr = +cornerRadius.call(this, _);

    if (!context) context = buffer = path();

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

    if (buffer) {
      context = null;
      return buffer + '' || null;
    }
  }

  rectangle.x = function(_) {
    if (arguments.length) {
      x = typeof _ === 'function' ? _ : constant$3(+_);
      return rectangle;
    } else {
      return x;
    }
  };

  rectangle.y = function(_) {
    if (arguments.length) {
      y = typeof _ === 'function' ? _ : constant$3(+_);
      return rectangle;
    } else {
      return y;
    }
  };

  rectangle.width = function(_) {
    if (arguments.length) {
      width = typeof _ === 'function' ? _ : constant$3(+_);
      return rectangle;
    } else {
      return width;
    }
  };

  rectangle.height = function(_) {
    if (arguments.length) {
      height = typeof _ === 'function' ? _ : constant$3(+_);
      return rectangle;
    } else {
      return height;
    }
  };

  rectangle.cornerRadius = function(_) {
    if (arguments.length) {
      cornerRadius = typeof _ === 'function' ? _ : constant$3(+_);
      return rectangle;
    } else {
      return cornerRadius;
    }
  };

  rectangle.context = function(_) {
    if (arguments.length) {
      context = _ == null ? null : _;
      return rectangle;
    } else {
      return context;
    }
  };

  return rectangle;
};

var pi$2 = Math.PI;

var vg_trail = function() {
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
        context.arc(x2, y2, r2, t - pi$2, t);
        context.lineTo(x1 + rx, y1 + ry);
        context.arc(x1, y1, r1, t, t + pi$2);
      } else {
        context.arc(x2, y2, r2, 0, 2*pi$2);
      }
      context.closePath();
    } else {
      ready = 1;
    }
    x1 = x2;
    y1 = y2;
    r1 = r2;
  }

  function trail(data) {
    var i,
        n = data.length,
        d,
        defined0 = false,
        buffer;

    if (context == null) context = buffer = path();

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) ready = 0;
      }
      if (defined0) point(+x(d, i, data), +y(d, i, data), +size(d, i, data));
    }

    if (buffer) {
      context = null;
      return buffer + '' || null;
    }
  }

  trail.x = function(_) {
    if (arguments.length) {
      x = _;
      return trail;
    } else {
      return x;
    }
  };

  trail.y = function(_) {
    if (arguments.length) {
      y = _;
      return trail;
    } else {
      return y;
    }
  };

  trail.size = function(_) {
    if (arguments.length) {
      size = _;
      return trail;
    } else {
      return size;
    }
  };

  trail.defined = function(_) {
    if (arguments.length) {
      defined = _;
      return trail;
    } else {
      return defined;
    }
  };

  trail.context = function(_) {
    if (arguments.length) {
      if (_ == null) {
        context = null;
      } else {
        context = _;
      }
      return trail;
    } else {
      return context;
    }
  };

  return trail;
};

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
function type$1(item) { return symbols$1(item.shape || 'circle'); }

var arcShape    = d3_arc().cornerRadius(cr).padAngle(pa);
var areavShape  = area$1().x(x).y1(y).y0(yh).defined(def);
var areahShape  = area$1().y(y).x1(x).x0(xw).defined(def);
var lineShape   = line$1().x(x).y(y).defined(def);
var rectShape   = vg_rect().x(x).y(y).width(w).height(h).cornerRadius(cr);
var symbolShape = d3_symbol().type(type$1).size(size);
var trailShape  = vg_trail().x(x).y(y).defined(def).size(ts);

function arc$1(context, item) {
  return arcShape.context(context)(item);
}

function area(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear';
  return (item.orient === 'horizontal' ? areahShape : areavShape)
    .curve(curves(interp, item.orient, item.tension))
    .context(context)(items);
}

function line(context, items) {
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

function symbol(context, item) {
  return symbolShape.context(context)(item);
}

function trail(context, items) {
  return trailShape.context(context)(items);
}

var boundStroke = function(bounds, item) {
  if (item.stroke && item.opacity !== 0 && item.strokeOpacity !== 0) {
    bounds.expand(item.strokeWidth != null ? +item.strokeWidth : 1);
  }
  return bounds;
};

var bounds;
var tau$3 = Math.PI * 2;
var halfPi$1 = tau$3 / 4;
var circleThreshold = tau$3 - 1e-8;

function context(_) {
  bounds = _;
  return context;
}

function noop$3() {}

function add(x, y) { bounds.add(x, y); }

context.beginPath = noop$3;

context.closePath = noop$3;

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
    sa = sa % tau$3; if (sa < 0) sa += tau$3;
    ea = ea % tau$3; if (ea < 0) ea += tau$3;

    if (ea < sa) {
      ccw = !ccw; // flip direction
      s = sa; sa = ea; ea = s; // swap end-points
    }

    if (ccw) {
      ea -= tau$3;
      s = sa - (sa % halfPi$1);
      for (i=0; i<3 && s>ea; ++i, s-=halfPi$1) update(s);
    } else {
      s = sa - (sa % halfPi$1) + halfPi$1;
      for (i=0; i<3 && s<ea; ++i, s=s+halfPi$1) update(s);
    }
  }

  add(cx + xmin, cy + ymin);
  add(cx + xmax, cy + ymax);
};

var gradient = function(context, gradient, bounds) {
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
};

var color = function(context, item, value) {
  return (value.id) ?
    gradient(context, value, item.bounds) :
    value;
};

var fill = function(context, item, opacity) {
  opacity *= (item.fillOpacity==null ? 1 : item.fillOpacity);
  if (opacity > 0) {
    context.globalAlpha = opacity;
    context.fillStyle = color(context, item, item.fill);
    return true;
  } else {
    return false;
  }
};

var Empty = [];

var stroke = function(context, item, opacity) {
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
};

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

var translate = function(x, y) {
  return 'translate(' + x + ',' + y + ')';
};

var translateItem = function(item) {
  return translate(item.x || 0, item.y || 0);
};

var markItemPath = function(type, shape) {

  function attr(emit, item) {
    emit('transform', translateItem(item));
    emit('d', shape(null, item));
  }

  function bound(bounds, item) {
    shape(context(bounds), item);
    return boundStroke(bounds, item)
      .translate(item.x || 0, item.y || 0);
  }

  function draw(context$$1, item) {
    var x = item.x || 0,
        y = item.y || 0;
    context$$1.translate(x, y);
    context$$1.beginPath();
    shape(context$$1, item);
    context$$1.translate(-x, -y);
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

};

var arc = markItemPath('arc', arc$1);

var markMultiItemPath = function(type, shape) {

  function attr(emit, item) {
    var items = item.mark.items;
    if (items.length) emit('d', shape(null, items));
  }

  function bound(bounds, mark) {
    var items = mark.items;
    if (items.length === 0) {
      return bounds;
    } else {
      shape(context(bounds), items);
      return boundStroke(bounds, items[0]);
    }
  }

  function draw(context$$1, items) {
    context$$1.beginPath();
    shape(context$$1, items);
  }

  var hit = hitPath(draw);

  function pick$$1(context$$1, scene, x, y, gx, gy) {
    var items = scene.items,
        b = scene.bounds;

    if (!items || !items.length || b && !b.contains(gx, gy)) {
      return null;
    }

    if (context$$1.pixelRatio > 1) {
      x *= context$$1.pixelRatio;
      y *= context$$1.pixelRatio;
    }
    return hit(context$$1, items, x, y) ? items[0] : null;
  }

  return {
    type:   type,
    tag:    'path',
    nested: true,
    attr:   attr,
    bound:  bound,
    draw:   drawOne(draw),
    pick:   pick$$1
  };

};

var area$2 = markMultiItemPath('area', area);

var clip_id = 1;

function resetSVGClipId() {
  clip_id = 1;
}

var clip = function(renderer, item, size) {
  var defs = renderer._defs,
      id = item.clip_id || (item.clip_id = 'clip' + clip_id++),
      c = defs.clipping[id] || (defs.clipping[id] = {id: id});
  c.width = size.width || 0;
  c.height = size.height || 0;
  return 'url(#' + id + ')';
};

var StrokeOffset = 0.5;

function attr(emit, item) {
  emit('transform', translateItem(item));
}

function background(emit, item) {
  var offset = item.stroke ? StrokeOffset : 0;
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
        offset = group.stroke ? StrokeOffset : 0;
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

var line$2 = markMultiItemPath('line', line);

function attr$2(emit, item) {
  emit('transform', translateItem(item));
  emit('d', item.path);
}

function path$2(context$$1, item) {
  var path = item.path;
  if (path == null) return true;

  var cache = item.pathCache;
  if (!cache || cache.path !== path) {
    (item.pathCache = cache = pathParse(path)).path = path;
  }
  pathRender(context$$1, cache, item.x, item.y);
}

function bound$2(bounds, item) {
  return path$2(context(bounds), item)
    ? bounds.set(0, 0, 0, 0)
    : boundStroke(bounds, item);
}

var path$3 = {
  type:   'path',
  tag:    'path',
  nested: false,
  attr:   attr$2,
  bound:  bound$2,
  draw:   drawAll(path$2),
  pick:   pickPath(path$2)
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

function path$4(context, item, opacity) {
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
    if (opacity && path$4(context, item, opacity)) {
      context.stroke();
    }
  });
}

function hit(context, item, x, y) {
  if (!context.isPointInStroke) return false;
  return path$4(context, item, 1) && context.isPointInStroke(x, y);
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

var symbol$1 = markItemPath('symbol', symbol);

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
  fontHeight = height(item);
  return estimate(textValue(item));
}

function estimate(text) {
  return ~~(0.8 * text.length * fontHeight);
}

// measure text width if canvas is available
function measureWidth(item) {
  context$1.font = font(item);
  return measure(textValue(item));
}

function measure(text) {
  return context$1.measureText(text).width;
}

function height(item) {
  return item.fontSize != null ? item.fontSize : 11;
}

function canvas(use) {
  context$1 = use && (context$1 = Canvas$1(1,1)) ? context$1.getContext('2d') : null;
  textMetrics.width = context$1 ? measureWidth : estimateWidth;
}

function textValue(item) {
  var s = item.text;
  if (s == null) {
    return '';
  } else {
    return item.limit > 0 ? truncate$1(item) : s + '';
  }
}

function truncate$1(item) {
  var limit = +item.limit,
      text = item.text + '',
      width;

  if (context$1) {
    context$1.font = font(item);
    width = measure;
  } else {
    fontHeight = height(item);
    width = estimate;
  }

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
    font = String(font).replace(/"/g, '\'');
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
  return bounds.expand(noRotate || !w ? 0 : 1);
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

var text$1 = {
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
  arc:     arc,
  area:    area$2,
  group:   group,
  image:   image,
  line:    line$2,
  path:    path$3,
  rect:    rect,
  rule:    rule,
  shape:   shape$1,
  symbol:  symbol$1,
  text:    text$1,
  trail:   trail$1
};

var boundItem = function(item, func, opt) {
  var type = Marks[item.mark.marktype],
      bound = func || type.bound;
  if (type.nested) item = item.mark;

  return bound(item.bounds || (item.bounds = new Bounds()), item, opt);
};

var DUMMY = {mark: null};

var boundMark = function(mark, bounds, opt) {
  var type  = Marks[mark.marktype],
      bound = type.bound,
      items = mark.items,
      hasItems = items && items.length,
      i, n, item, b;

  if (type.nested) {
    if (hasItems) {
      item = items[0];
    } else {
      // no items, fake it
      DUMMY.mark = mark;
      item = DUMMY;
    }
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
};

var keys$1 = [
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
  return JSON.stringify(scene, keys$1, indent);
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
 * Report a dirty item whose bounds should be redrawn.
 * This base class method does nothing. Subclasses that perform
 * incremental should implement this method.
 * @param {Item} item - The dirty item whose bounds should be redrawn.
 */
prototype$4.dirty = function(/*item*/) {
};

/**
 * Render an input scenegraph, potentially with a set of dirty items.
 * This method will perform an immediate rendering with available resources.
 * The renderer may also need to perform image loading to perform a complete
 * render. This process can lead to asynchronous re-rendering of the scene
 * after this method returns. To receive notification when rendering is
 * complete, use the renderAsync method instead.
 * @param {object} scene - The root mark of a scenegraph to render.
 * @return {Renderer} - This renderer instance.
 */
prototype$4.render = function(scene) {
  var r = this;

  // bind arguments into a render call, and cache it
  // this function may be subsequently called for async redraw
  r._call = function() { r._render(scene); };

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
 */
prototype$4._render = function(/*scene*/) {
  // subclasses to override
};

/**
 * Asynchronous rendering method. Similar to render, but returns a Promise
 * that resolves when all rendering is completed. Sometimes a renderer must
 * perform image loading to get a complete rendering. The returned
 * Promise will not resolve until this process completes.
 * @param {object} scene - The root mark of a scenegraph to render.
 * @return {Promise} - A Promise that resolves when rendering is complete.
 */
prototype$4.renderAsync = function(scene) {
  var r = this.render(scene);
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

var point$4 = function(event, el) {
  var rect = el.getBoundingClientRect();
  return [
    event.clientX - rect.left - (el.clientLeft || 0),
    event.clientY - rect.top - (el.clientTop || 0)
  ];
};

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
  var p = point$4(evt, this._canvas),
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

var clip$1 = function(context, scene) {
  var group = scene.group;
  context.save();
  context.beginPath();
  context.rect(0, 0, group.width || 0, group.height || 0);
  context.clip();
};

var devicePixelRatio = typeof window !== 'undefined'
  ? window.devicePixelRatio || 1 : 1;

var resize = function(canvas, width, height, origin) {
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
};

function CanvasRenderer(loader) {
  Renderer.call(this, loader);
  this._redraw = false;
  this._dirty = new Bounds();
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
  this._redraw = true;
  return this;
};

prototype$6.canvas = function() {
  return this._canvas;
};

prototype$6.context = function() {
  return this._canvas ? this._canvas.getContext('2d') : null;
};

prototype$6.dirty = function(item) {
  var b = translate$1(item.bounds, item.mark.group);
  this._dirty.union(b);
};

function clipToBounds(g, b, origin) {
  // expand bounds by 1 pixel, then round to pixel boundaries
  b.expand(1).round();

  // to avoid artifacts translate if origin has fractional pixels
  b.translate(-(origin[0] % 1), -(origin[1] % 1));

  // set clipping path
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

prototype$6._render = function(scene) {
  var g = this.context(),
      o = this._origin,
      w = this._width,
      h = this._height,
      b = this._dirty;

  // setup
  g.save();
  if (this._redraw || b.empty()) {
    this._redraw = false;
    b = null;
  } else {
    b = clipToBounds(g, b, o);
  }

  this.clear(-o[0], -o[1], w, h);

  // render
  this.draw(g, scene, b);

  // takedown
  g.restore();

  this._dirty.clear();
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
  this._dirtyID = 1;
  this._dirty = [];
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

  this._dirty = [];

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
  for (var key$$1 in metadata) {
    attr[key$$1] = metadata[key$$1];
  }

  return openTag('svg', attr) + this._svg.innerHTML + closeTag('svg');
};


// -- Render entry point --

prototype$8._render = function(scene) {
  // perform spot updates and re-render markup
  if (this._dirtyCheck()) {
    if (this._dirtyAll) this._resetDefs();
    this.draw(this._root, scene);
    domClear(this._root, 1);
  }

  this.updateDefs();

  this._dirty = [];
  ++this._dirtyID;

  return this;
};

// -- Manage SVG definitions ('defs') block --

prototype$8.updateDefs = function() {
  var svg = this._svg,
      defs = this._defs,
      el = defs.el,
      index = 0, id$$1;

  for (id$$1 in defs.gradient) {
    if (!el) defs.el = (el = domChild(svg, 0, 'defs', ns));
    updateGradient(el, defs.gradient[id$$1], index++);
  }

  for (id$$1 in defs.clipping) {
    if (!el) defs.el = (el = domChild(svg, 0, 'defs', ns));
    updateClipping(el, defs.clipping[id$$1], index++);
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

function updateClipping(el, clip$$1, index) {
  var rect;

  el = domChild(el, index, 'clipPath', ns);
  el.setAttribute('id', clip$$1.id);
  rect = domChild(el, 0, 'rect', ns);
  rect.setAttribute('x', 0);
  rect.setAttribute('y', 0);
  rect.setAttribute('width', clip$$1.width);
  rect.setAttribute('height', clip$$1.height);
}

prototype$8._resetDefs = function() {
  var def = this._defs;
  def.gradient = {};
  def.clipping = {};
};


// -- Manage rendering of items marked as dirty --

prototype$8.dirty = function(item) {
  if (item.dirty !== this._dirtyID) {
    item.dirty = this._dirtyID;
    this._dirty.push(item);
  }
};

prototype$8.isDirty = function(item) {
  return this._dirtyAll
    || !item._svg
    || item.dirty === this._dirtyID;
};

prototype$8._dirtyCheck = function() {
  this._dirtyAll = true;
  var items = this._dirty;
  if (!items.length) return true;

  var id$$1 = ++this._dirtyID,
      item, mark, type, mdef, i, n, o;

  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = item.mark;

    if (mark.marktype !== type) {
      // memoize mark instance lookup
      type = mark.marktype;
      mdef = Marks[type];
    }

    if (mark.zdirty && mark.dirty !== id$$1) {
      this._dirtyAll = false;
      mark.dirty = id$$1;
      dirtyParents(mark.group, id$$1);
    }

    if (item.exit) { // EXIT
      if (mdef.nested && mark.items.length) {
        // if nested mark with remaining points, update instead
        o = mark.items[0];
        if (o._svg) this._update(mdef, o._svg, o);
      } else if (item._svg) {
        // otherwise remove from DOM
        o = item._svg.parentNode;
        if (o) o.removeChild(item._svg);
      }
      item._svg = null;
      continue;
    }

    item = (mdef.nested ? mark.items[0] : item);
    if (item._update === id$$1) continue; // already visited

    if (!item._svg || !item._svg.ownerSVGElement) {
      // ENTER
      this._dirtyAll = false;
      dirtyParents(item, id$$1);
    } else {
      // IN-PLACE UPDATE
      this._update(mdef, item._svg, item);
    }
    item._update = id$$1;
  }
  return !this._dirtyAll;
};

function dirtyParents(item, id$$1) {
  for (; item && item.dirty !== id$$1; item=item.mark.group) {
    item.dirty = id$$1;
    if (item.mark && item.mark.dirty !== id$$1) {
      item.mark.dirty = id$$1;
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

  if (doc || node.previousSibling !== sibling || !sibling) {
    el.insertBefore(node, sibling ? sibling.nextSibling : el.firstChild);
  }

  return node;
}


// -- Set attributes & styles on SVG elements ---

var element = null;
var values$1 = null;  // temp var for current values hash

// Extra configuration for certain mark types
var mark_extras = {
  group: function(mdef, el, item) {
    values$1 = el.__values__; // use parent's values hash

    element = el.childNodes[1];
    mdef.foreground(emit, item, this);

    element = el.childNodes[0];
    mdef.background(emit, item, this);

    var value = item.mark.interactive === false ? 'none' : null;
    if (value !== values$1.events) {
      element.style.setProperty('pointer-events', value);
      values$1.events = value;
    }
  },
  text: function(mdef, el, item) {
    var str = textValue(item);
    if (str !== values$1.text) {
      el.textContent = str;
      values$1.text = str;
    }
    str = font(item);
    if (str !== values$1.font) {
      el.style.setProperty('font', str);
      values$1.font = str;
    }
  }
};

prototype$8._update = function(mdef, el, item) {
  // set dom element and values cache
  // provides access to emit method
  element = el;
  values$1 = el.__values__;

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
  if (value === values$1[name]) return;

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
  values$1[name] = value;
}

prototype$8.style = function(el, o) {
  if (o == null) return;
  var i, n, prop, name, value;

  for (i=0, n=styleProperties.length; i<n; ++i) {
    prop = styleProperties[i];
    value = o[prop];
    if (value === values$1[prop]) continue;

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

    values$1[prop] = value;
  }
};

function href() {
  var loc;
  return typeof window === 'undefined' ? ''
    : (loc = window.location).hash ? loc.href.slice(0, -loc.hash.length)
    : loc.href;
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
  for (var key$$1 in metadata) {
    attr[key$$1] = metadata[key$$1];
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

prototype$9.buildDefs = function() {
  var all = this._defs,
      defs = '',
      i, id$$1, def, stops;

  for (id$$1 in all.gradient) {
    def = all.gradient[id$$1];
    stops = def.stops;

    defs += openTag('linearGradient', {
      id: id$$1,
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

  for (id$$1 in all.clipping) {
    def = all.clipping[id$$1];

    defs += openTag('clipPath', {id: id$$1});

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

var object$1;

function emit$1(name, value, ns, prefixed) {
  object$1[prefixed || name] = value;
}

prototype$9.attributes = function(attr, item) {
  object$1 = {};
  attr(emit$1, item, this);
  return object$1;
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
  if (arguments.length > 1) {
    modules[name] = _;
    return this;
  } else {
    return modules[name];
  }
}

var TOLERANCE = 1e-9;

function sceneEqual(a, b, key$$1) {
  return (a === b) ? true
    : (key$$1 === 'path') ? pathEqual(a, b)
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
      key$$1, i;

  if (ka.length !== kb.length) return false;

  ka.sort();
  kb.sort();

  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i]) return false;
  }

  for (i = ka.length - 1; i >= 0; i--) {
    key$$1 = ka[i];
    if (!sceneEqual(a[key$$1], b[key$$1], key$$1)) return false;
  }

  return typeof a === typeof b;
}

function UniqueList(idFunc) {
  var $$$1 = idFunc || identity$1,
      list = [],
      ids = {};

  list.add = function(_) {
    var id$$1 = $$$1(_);
    if (!ids[id$$1]) {
      ids[id$$1] = 1;
      list.push(_);
    }
    return list;
  };

  list.remove = function(_) {
    var id$$1 = $$$1(_), idx;
    if (ids[id$$1]) {
      ids[id$$1] = 0;
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
  return ingest(rederive(t, {}));
}

/**
 * Rederive a derived tuple by copying values from the source tuple.
 * @param {object} t - The source tuple.
 * @param {object} d - The derived tuple.
 * @return {object} The derived tuple.
 */
function rederive(t, d) {
  for (var k in t) {
    if (k !== '_id') d[k] = t[k];
  }
  return d;
}

/**
 * Replace an existing tuple with a new tuple.
 * The existing tuple will become the previous value of the new.
 * @param {object} t - The existing data tuple.
 * @param {object} d - The new tuple that replaces the old.
 * @return {object} The new tuple.
 */
function replace(t, d) {
  d._id = t._id;
  return d;
}

function isChangeSet(v) {
  return v && v.constructor === changeset;
}

function changeset() {
  var add = [],  // insert tuples
      rem = [],  // remove tuples
      mod = [],  // modify tuples
      remp = [], // remove by predicate
      modp = [], // modify by predicate
      reflow = false;

  return {
    constructor: changeset,
    insert: function(t) {
      var d = array$1(t), i = 0, n = d.length;
      for (; i<n; ++i) add.push(d[i]);
      return this;
    },
    remove: function(t) {
      var a = isFunction(t) ? remp : rem,
          d = array$1(t), i = 0, n = d.length;
      for (; i<n; ++i) a.push(d[i]);
      return this;
    },
    modify: function(t, field$$1, value) {
      var m = {field: field$$1, value: constant$1(value)};
      if (isFunction(t)) {
        m.filter = t;
        modp.push(m);
      } else {
        m.tuple = t;
        mod.push(m);
      }
      return this;
    },
    encode: function(t, set) {
      if (isFunction(t)) modp.push({filter: t, field: set});
      else mod.push({tuple: t, field: set});
      return this;
    },
    reflow: function() {
      reflow = true;
      return this;
    },
    pulse: function(pulse, tuples) {
      var out, i, n, m, f, t, id$$1;

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
      for (id$$1 in out) pulse.rem.push(out[id$$1]);

      // modify
      function modify(t, f, v) {
        if (v) t[f] = v(t); else pulse.encode = f;
        if (!reflow) out[t._id] = t;
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

      // reflow?
      if (reflow) {
        pulse.mod = rem.length || remp.length
          ? tuples.filter(function(t) { return out.hasOwnProperty(t._id); })
          : tuples.slice();
      } else {
        for (id$$1 in out) pulse.mod.push(out[id$$1]);
      }

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
    mod[name] = isArray(value) ? 1 + value.length : -1;
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
    ? (index + 1 < mod[name] || !!mod[index + ':' + name])
    : !!mod[name];
};

/**
 * Clears the modification records. After calling this method,
 * all parameters are considered unmodified.
 */
prototype$12.clear = function() {
  this[CACHE] = {};
  return this;
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
  if (this.value !== value) {
    this.value = value;
    return 1;
  } else {
    return 0;
  }
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
      array$1(value).forEach(function(op) {
        if (!(op instanceof Operator)) {
          error$1('Pulse parameters must be operator instances.');
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
  var rv;
  if (this.skip()) {
    this.skip(false);
    rv = 0;
  } else {
    rv = this.evaluate(pulse);
  }
  this.stamp = pulse.stamp;
  this.pulse = rv;
  return rv || pulse;
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
var add$1 = function(init, update, params, react) {
  var shift = 1,
    op;

  if (init instanceof Operator) {
    op = init;
  } else if (init && init.prototype instanceof Operator) {
    op = new init();
  } else if (isFunction(init)) {
    op = new Operator(null, init);
  } else {
    shift = 0;
    op = new Operator(init, update);
  }

  this.rank(op);
  if (shift) {
    react = params;
    params = update;
  }
  if (params) this.connect(op, op.parameters(params, react));
  this.touch(op);

  return op;
};

/**
 * Connect a target operator as a dependent of source operators.
 * If necessary, this method will rerank the target operator and its
 * dependents to ensure propagation proceeds in a topologically sorted order.
 * @param {Operator} target - The target operator.
 * @param {Array<Operator>} - The source operators that should propagate
 *   to the target operator.
 */
var connect = function(target, sources) {
  var targetRank = target.rank, i, n;

  for (i=0, n=sources.length; i<n; ++i) {
    if (targetRank < sources[i].rank) {
      this.rerank(target);
      return;
    }
  }
};

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

prototype$13._apply = identity$1;

prototype$13.targets = function() {
  return this._targets || (this._targets = UniqueList(id));
};

prototype$13.consume = function(_) {
  if (!arguments.length) return !!this._consume;
  this._consume = !!_;
  return this;
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
  this.targets().add(s);
  return s;
};

prototype$13.apply = function(apply) {
  var s = stream(null, apply);
  this.targets().add(s);
  return s;
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
    if ((now - t) > pause) {
      t = now;
      return 1;
    } else {
      return 0;
    }
  });
};

prototype$13.debounce = function(delay) {
  var s = stream();

  this.targets().add(stream(null, null,
    debounce(delay, function(e) {
      var df = e.dataflow;
      s.receive(e);
      if (df && df.run) df.run();
    })
  ));

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
var events = function(source, type, filter, apply) {
  var df = this,
      s = stream(filter, apply),
      send = function(e) {
        e.dataflow = df;
        try {
          s.receive(e);
        } catch (error) {
          df.error(error);
        } finally {
          df.run();
        }
      },
      sources;

  if (typeof source === 'string' && typeof document !== 'undefined') {
    sources = document.querySelectorAll(source);
  } else {
    sources = array$1(source);
  }

  for (var i=0, n=sources.length; i<n; ++i) {
    sources[i].addEventListener(type, send);
  }

  return s;
};

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
var on = function(source, target, update, params, options) {
  var fn = source instanceof Operator ? onOperator : onStream;
  fn(this, source, target, update, params, options);
  return this;
};

function onStream(df, stream, target, update, params, options) {
  var opt = extend({}, options, SKIP$1), func, op;

  if (!isFunction(target)) target = constant$1(target);

  if (update === undefined) {
    func = function(e) {
      df.touch(target(e));
    };
  } else if (isFunction(update)) {
    op = new Operator(null, update, params, false);
    func = function(e) {
      var v, t = target(e);
      op.evaluate(e);
      isChangeSet(v = op.value) ? df.pulse(t, v, options) : df.update(t, v, opt);
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
    func = isFunction(update) ? update : constant$1(update);
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
        queue.push(cur = list[i]);
        if (cur === op) this.error('Cycle detected in dataflow graph.');
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
  if (!this.source || this.source.length === this.add.length) {
    return p;
  } else {
    p = new Pulse(this.dataflow).init(this);
    p.add = p.source;
    return p;
  }
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

  if (flags & ADD) {
    p.addF = src.addF;
    p.add = src.add;
  } else {
    p.addF = null;
    p.add = [];
  }

  if (flags & REM) {
    p.remF = src.remF;
    p.rem = src.rem;
  } else {
    p.remF = null;
    p.rem = [];
  }

  if (flags & MOD) {
    p.modF = src.modF;
    p.mod = src.mod;
  } else {
    p.modF = null;
    p.mod = [];
  }

  if (flags & NO_SOURCE) {
    p.srcF = null;
    p.source = null;
  } else {
    p.srcF = src.srcF;
    p.source = src.source;
  }

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
  var fields = array$1(_),
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
    // if in midst of propagation, add to priority queue
    this._enqueue(op);
  } else {
    // otherwise, queue for next propagation
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
  this.touch(op, options || NO_OPT);

  var p = new Pulse(this, this._clock + (this._pulse ? 0 : 1)),
      t = op.pulse && op.pulse.source || [];
  p.target = op;
  this._pulses[op.id] = changeset.pulse(p, t);

  return this;
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
  };

  return (df._pending = pending);
}

function request$1(target, url, format) {
  var df = this,
      pending = df._pending || loadPending(df);

  pending.requests += 1;

  df.loader()
    .load(url, {context:'dataflow'})
    .then(
      function(data) { df.ingest(target, data, format); },
      function(error) { df.error('Loading failed', url, error); })
    .catch(
      function(error) { df.error('Data ingestion failed', url, error); })
    .then(pending.done, pending.done);
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
    error$1('MultiPulse fork does not support tuple change sets.');
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
  error$1('MultiPulse does not support filtering.');
};

prototype$15.materialize = function() {
  error$1('MultiPulse does not support materialization.');
};

prototype$15.visit = function(flags, visitor) {
  var p = this,
      pulses = p.pulses,
      n = pulses.length,
      i = 0;

  if (flags & p.SOURCE) {
    for (; i<n; ++i) {
      pulses[i].visit(flags, visitor);
    }
  } else {
    for (; i<n; ++i) {
      if (pulses[i].stamp === p.stamp) {
        pulses[i].visit(flags, visitor);
      }
    }
  }

  return p;
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
  var df = this,
      count = 0,
      level = df.logLevel(),
      op, next, dt, error;

  if (df._pending) {
    df.info('Awaiting requests, delaying dataflow run.');
    return 0;
  }

  if (df._pulse) {
    df.error('Dataflow invoked recursively. Use the runAfter method to queue invocation.');
    return 0;
  }

  if (!df._touched.length) {
    df.info('Dataflow invoked, but nothing to do.');
    return 0;
  }

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
    error = err;
  }

  // reset pulse map
  df._pulses = {};
  df._pulse = null;

  if (level >= Info) {
    dt = Date.now() - dt;
    df.info('> Pulse ' + df._clock + ': ' + count + ' operators; ' + dt + 'ms');
  }

  if (error) {
    df._postrun = [];
    df.error(error);
  }

  if (df._onrun) {
    try { df._onrun(df, count, error); } catch (err) { df.error(err); }
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
  this.nodes = [];
  return this;
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
  if (arguments.length) {
    this._loader = _;
    return this;
  } else {
    return this._loader;
  }
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
 * Logs an error message. By default, logged messages are written to console
 * output. The message will only be logged if the current log level is high
 * enough to permit error messages.
 */
prototype$10.error = logMethod('error');

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
 * Internally, this method calls {@link evaluate} to perform processing.
 * If {@link evaluate} returns a falsy value, the input pulse is returned.
 * This method should NOT be overridden, instead overrride {@link evaluate}.
 * @param {Pulse} pulse - the current dataflow pulse.
 * @return the output pulse for this operator (or StopPropagation)
 */
prototype$17.run = function(pulse) {
  if (pulse.stamp <= this.stamp) return pulse.StopPropagation;

  var rv;
  if (this.skip()) {
    this.skip(false);
  } else {
    rv = this.evaluate(pulse);
  }
  rv = rv || pulse;

  if (rv !== pulse.StopPropagation) this.pulse = rv;
  this.stamp = pulse.stamp;

  return rv;
};

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
  if (arguments.length > 1) {
    definitions[type] = def;
    return this;
  } else {
    return definitions.hasOwnProperty(type) ? definitions[type] : null;
  }
}

function transform(type, constructor) {
  if (arguments.length > 1) {
    transforms[type] = constructor;
    return this;
  } else {
    return transforms.hasOwnProperty(type) ? transforms[type] : null;
  }
}

function TupleStore(key$$1) {
  this._key = key$$1 || '_id';
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
    agg.reduce(function(m, a) {
      m[a.name] = a;
      return m;
    }, {})
  );
  var values = [], key$$1;
  for (key$$1 in map) values.push(map[key$$1]);
  return values.sort(compareIndex);
}

function compileMeasures(agg, field$$1) {
  var get = field$$1 || identity$1,
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
    var key$$1, i, t, v;
    for (key$$1 in cells) {
      t = cells[key$$1].tuple;
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
        k, key$$1;

    for (k in v) {
      tuple[name] = v[k];
      key$$1 = base ? base + '|' + k : k;
      if (index < n) generate(key$$1, tuple, index);
      else if (!curr[key$$1]) aggr.cell(key$$1, tuple);
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
  this._dims = array$1(_.groupby);
  this._dnames = this._dims.map(function(d) {
    var dname = accessorName(d);
    inputVisit(d);
    outputs.push(dname);
    return dname;
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
      field$$1, op, m, mname, outname, i;

  if (n !== ops.length) {
    error$1('Unmatched number of fields and aggregate ops.');
  }

  for (i=0; i<n; ++i) {
    field$$1 = fields[i];
    op = ops[i];

    if (field$$1 == null && op !== 'count') {
      error$1('Null aggregate field specified.');
    }
    mname = accessorName(field$$1);
    outname = measureName(op, mname, as[i]);
    outputs.push(outname);

    if (op === 'count') {
      this._counts.push(outname);
      continue;
    }

    m = map[mname];
    if (!m) {
      inputVisit(field$$1);
      m = (map[mname] = []);
      m.field = field$$1;
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

prototype$18.cell = function(key$$1, t) {
  var cell = this.value[key$$1];
  if (!cell) {
    cell = this.value[key$$1] = this.newcell(key$$1, t);
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

prototype$18.newcell = function(key$$1, t) {
  var cell = {
    key:   key$$1,
    num:   0,
    agg:   null,
    tuple: this.newtuple(t, this._prev && this._prev[key$$1]),
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
  var key$$1 = this.cellkey(t),
      cell = this.cell(key$$1, t),
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
  var key$$1 = this.cellkey(t),
      cell = this.cell(key$$1, t),
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
      cell, key$$1, i, n;

  if (prev) for (key$$1 in prev) {
    cell = prev[key$$1];
    if (!drop || cell.num) rem.push(cell.tuple);
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
      start = bins.start,
      step = bins.step,
      as = _.as || ['bin0', 'bin1'],
      b0 = as[0],
      b1 = as[1],
      flag;

  if (_.modified()) {
    pulse = pulse.reflow(true);
    flag = pulse.SOURCE;
  } else {
    flag = pulse.modified(accessorFields(_.field)) ? pulse.ADD_MOD : pulse.ADD;
  }

  pulse.visit(flag, function(t) {
    var v = bins(t);
    // minimum bin value (inclusive)
    t[b0] = v;
    // maximum bin value (exclusive)
    // use convoluted math for better floating point agreement
    // see https://github.com/vega/vega/issues/830
    t[b1] = v == null ? null : start + step * (1 + (v - start) / step);
  });

  return pulse.modifies(as);
};

prototype$20._bins = function(_) {
  if (this.value && !_.modified()) {
    return this.value;
  }

  var field$$1 = _.field,
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
    var v = field$$1(t);
    if (v == null) {
      return null;
    } else {
      v = Math.max(start, Math.min(+v, stop - step));
      return start + step * Math.floor((v - start) / step);
    }
  };

  f.start = start;
  f.stop = stop;
  f.step = step;

  return this.value = accessor(
    f,
    accessorFields(field$$1),
    _.name || 'bin_' + accessorName(field$$1)
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
      map;

  if (out.rem.length) { // build id map and filter data array
    map = {};
    out.visit(out.REM, function(t) { map[t._id] = 1; });
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
      data = merge$1(sort, data, out.add.sort(sort));
    }
  } else if (add) {
    // no sort, so simply add new tuples
    out.visit(out.ADD, function(t) { data.push(t); });
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
};

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
      reset$$1 = !data
          || pulse.changed(pulse.ADD_REM)
          || _.modified('as')
          || _.modified('filter');

  if (reset$$1) {
    if (data) out.rem = data;
    out.add = this.value = cross$2(pulse.source, a, b, _.filter || truthy);
  } else {
    out.mod = data;
  }

  out.source = this.value;
  return out.modifies(as);
};

function cross$2(input, a, b, filter) {
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
    error$1('Unknown distribution function: ' + func);
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
      error$1('Invalid density method: ' + method);
    }
    if (!_.extent && !dist.data) {
      error$1('Missing density extent parameter.');
    }
    method = dist[method];

    var as = _.as || ['value', 'density'],
        domain = _.extent || extent(dist.data()),
        step = (domain[1] - domain[0]) / (_.steps || 100),
        values = sequence(domain[0], domain[1] + step/2, step)
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
      field$$1 = _.field,
      min = extent[0],
      max = extent[1],
      flag = pulse.ADD,
      mod;

  mod = pulse.changed()
     || pulse.modified(field$$1.fields)
     || _.modified('field');

  if (mod) {
    flag = pulse.SOURCE;
    min = +Infinity;
    max = -Infinity;
  }

  pulse.visit(flag, function(t) {
    var v = field$$1(t);
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

prototype$26.subflow = function(key$$1, flow, pulse, parent) {
  var flows = this.value,
      sf = flows.hasOwnProperty(key$$1) && flows[key$$1],
      df, p;

  if (!sf) {
    p = parent || (p = this._group[key$$1]) && p.tuple;
    df = pulse.dataflow;
    sf = df.add(new Subflow(pulse.fork(pulse.NO_SOURCE), this))
      .connect(flow(df, key$$1, p));
    flows[key$$1] = sf;
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
      key$$1 = _.key,
      flow = _.subflow,
      cache = this._keys,
      rekey = _.modified('key');

  function subflow(key$$1) {
    return self.subflow(key$$1, flow, pulse);
  }

  this._group = _.group || {};
  this._targets.active = 0; // reset list of active subflows

  pulse.visit(pulse.REM, function(t) {
    var k = cache.get(t._id);
    if (k !== undefined) {
      cache.delete(t._id);
      subflow(k).rem(t);
    }
  });

  pulse.visit(pulse.ADD, function(t) {
    var k = key$$1(t);
    cache.set(t._id, k);
    subflow(k).add(t);
  });

  if (rekey || pulse.modified(key$$1.fields)) {
    pulse.visit(pulse.MOD, function(t) {
      var k0 = cache.get(t._id),
          k1 = key$$1(t);
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
          k1 = key$$1(t);
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
    : isArray(_.name) ? array$1(_.name).map(function(f) { return field(f); })
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
      reset$$1 = _.modified('fields'),
      fields = _.fields,
      as = _.as || ['key', 'value'],
      key$$1 = as[0],
      value = as[1],
      keys = fields.map(keyFunction),
      n = fields.length,
      stamp = pulse.stamp,
      out = pulse.fork(pulse.NO_SOURCE),
      i = 0, mask = 0, id$$1;

  function add(t) {
    var f = (cache[t._id] = Array(n)); // create cache of folded tuples
    for (var i=0, ft; i<n; ++i) { // for each key, derive folds
      ft = (f[i] = derive(t));
      ft[key$$1] = keys[i];
      ft[value] = fields[i](t);
      out.add.push(ft);
    }
  }

  function mod(t) {
    var f = cache[t._id]; // get cache of folded tuples
    for (var i=0, ft; i<n; ++i) { // for each key, rederive folds
      if (!(mask & (1 << i))) continue; // field is unchanged
      ft = rederive(t, f[i], stamp);
      ft[key$$1] = keys[i];
      ft[value] = fields[i](t);
      out.mod.push(ft);
    }
  }

  if (reset$$1) {
    // on reset, remove all folded tuples and clear cache
    for (id$$1 in cache) out.rem.push.apply(out.rem, cache[id$$1]);
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

  if (!_.initonly) {
    pulse.modifies(as);
  }

  return pulse.visit(flag, set);
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
  median: median,
  mean: mean,
  min: min,
  max: max
};

var Empty$1 = [];

/**
 * Impute missing values.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to impute.
 * @param {Array<function(object): *>} [params.groupby] - An array of
 *   accessors to determine series within which to perform imputation.
 * @param {function(object): *} params.key - An accessor for a key value.
 *   Each key value should be unique within a group. New tuples will be
 *   imputed for any key values that are not found within a group.
 * @param {Array<*>} [params.keyvals] - Optional array of required key
 *   values. New tuples will be imputed for any key values that are not
 *   found within a group. In addition, these values will be automatically
 *   augmented with the key values observed in the input data.
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
    error$1('Unrecognized imputation method: ' + m);
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
      field$$1 = getField(_),
      fName = accessorName(_.field),
      kName = accessorName(_.key),
      gNames = (_.groupby || []).map(accessorName),
      groups = partition(pulse.source, _.groupby, _.key, _.keyvals),
      curr = [],
      prev = this.value,
      m = groups.domain.length,
      group, value, gVals, kVal, g, i, j, l, n, t;

  for (g=0, l=groups.length; g<l; ++g) {
    group = groups[g];
    gVals = group.values;
    value = NaN;

    // add tuples for missing values
    for (j=0; j<m; ++j) {
      if (group[j] != null) continue;
      kVal = groups.domain[j];

      t = {_impute: true};
      for (i=0, n=gVals.length; i<n; ++i) t[gNames[i]] = gVals[i];
      t[kName] = kVal;
      t[fName] = isNaN(value) ? (value = impute(group, field$$1)) : value;

      curr.push(ingest(t));
    }
  }

  // update pulse with imputed tuples
  if (curr.length) out.add = out.materialize(out.ADD).add.concat(curr);
  if (prev.length) out.rem = out.materialize(out.REM).rem.concat(prev);
  this.value = curr;

  return out;
};

function partition(data, groupby, key$$1, keyvals) {
  var get = function(f) { return f(t); },
      groups = [],
      domain = keyvals ? keyvals.slice() : [],
      kMap = {},
      gMap = {}, gVals, gKey,
      group, i, j, k, n, t;

  domain.forEach(function(k, i) { kMap[k] = i + 1; });

  for (i=0, n=data.length; i<n; ++i) {
    t = data[i];
    k = key$$1(t);
    j = kMap[k] || (kMap[k] = domain.push(k));

    gKey = (gVals = groupby ? groupby.map(get) : Empty$1) + '';
    if (!(group = gMap[gKey])) {
      group = (gMap[gKey] = []);
      groups.push(group);
      group.values = gVals;
    }
    group[j-1] = t;
  }

  groups.domain = domain;
  return groups;
}

/**
 * Extend input tuples with aggregate values.
 * Calcuates aggregate values and joins them with the input stream.
 * @constructor
 */
function JoinAggregate(params) {
  Aggregate.call(this, params);
}

var prototype$33 = inherits(JoinAggregate, Aggregate);

prototype$33.transform = function(_, pulse) {
  var aggr = this,
      mod = _.modified(),
      cells;

  // process all input tuples to calculate aggregates
  if (aggr.value && (mod || pulse.modified(aggr._inputs))) {
    cells = aggr.value = mod ? aggr.init(_) : {};
    pulse.visit(pulse.SOURCE, function(t) { aggr.add(t); });
  } else {
    cells = aggr.value = aggr.value || this.init(_);
    pulse.visit(pulse.REM, function(t) { aggr.rem(t); });
    pulse.visit(pulse.ADD, function(t) { aggr.add(t); });
  }

  // update aggregation cells
  aggr.changes();

  // write aggregate values to input tuples
  pulse.visit(pulse.SOURCE, function(t) {
    rederive(cells[aggr.cellkey(t)].tuple, t);
  });

  return pulse.reflow(mod).modifies(this._outputs);
};

prototype$33.changes = function() {
  var adds = this._adds,
      mods = this._mods,
      i, n;

  for (i=0, n=this._alen; i<n; ++i) {
    this.celltuple(adds[i]);
    adds[i] = null; // for garbage collection
  }

  for (i=0, n=this._mlen; i<n; ++i) {
    this.celltuple(mods[i]);
    mods[i] = null; // for garbage collection
  }

  this._alen = this._mlen = 0; // reset list of active cells
};

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

var prototype$34 = inherits(Lookup, Transform);

prototype$34.transform = function(_, pulse) {
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
      error$1('Multi-field lookup requires explicit "as" parameter.');
    }
    if (as && as.length !== n * m) {
      error$1('The "as" parameter has too few output field names.');
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
      error$1('Missing output field names.');
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

var prototype$35 = inherits(PreFacet, Facet);

prototype$35.transform = function(_, pulse) {
  var self = this,
      flow = _.subflow,
      field$$1 = _.field;

  if (_.modified('field') || field$$1 && pulse.modified(accessorFields(field$$1))) {
    error$1('PreFacet does not support field modification.');
  }

  this._targets.active = 0; // reset list of active subflows

  pulse.visit(pulse.MOD, function(t) {
    var sf = self.subflow(t._id, flow, pulse, t);
    field$$1 ? field$$1(t).forEach(function(_) { sf.mod(_); }) : sf.mod(t);
  });

  pulse.visit(pulse.ADD, function(t) {
    var sf = self.subflow(t._id, flow, pulse, t);
    field$$1 ? field$$1(t).forEach(function(_) { sf.add(ingest(_)); }) : sf.add(t);
  });

  pulse.visit(pulse.REM, function(t) {
    var sf = self.subflow(t._id, flow, pulse, t);
    field$$1 ? field$$1(t).forEach(function(_) { sf.rem(_); }) : sf.rem(t);
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

var prototype$36 = inherits(Proxy, Transform);

prototype$36.transform = function(_, pulse) {
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

var prototype$37 = inherits(Rank, Transform);

prototype$37.transform = function(_, pulse) {
  if (!pulse.source) {
    error$1('Rank transform requires an upstream data source.');
  }

  var norm  = _.normalize,
      field$$1 = _.field,
      as = _.as || 'rank',
      ranks = {},
      n = -1, rank;

  if (field$$1) {
    // If we have a field accessor, first compile distinct keys.
    pulse.visit(pulse.SOURCE, function(t) {
      var v = field$$1(t);
      if (ranks[v] == null) ranks[v] = ++n;
    });
    pulse.visit(pulse.SOURCE, norm && --n
      ? function(t) { t[as] = ranks[field$$1(t)] / n; }
      : function(t) { t[as] = ranks[field$$1(t)]; }
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

var prototype$38 = inherits(Relay, Transform);

prototype$38.transform = function(_, pulse) {
  var out, lut;

  if (this.value) {
    lut = this.value;
  } else {
    out = pulse = pulse.addAll();
    lut = this.value = {};
  }

  if (_.derive) {
    out = pulse.fork();
    
    pulse.visit(pulse.REM, function(t) {
      out.rem.push(lut[t._id]);
      lut[t._id] = null;
    });
    
    pulse.visit(pulse.ADD, function(t) {
      var dt = derive(t);
      lut[t._id] = dt;
      out.add.push(dt);
    });

    pulse.visit(pulse.MOD, function(t) {
      out.mod.push(rederive(t, lut[t._id]));
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

var prototype$39 = inherits(Sample, Transform);

prototype$39.transform = function(_, pulse) {
  var out = pulse.fork(),
      mod = _.modified('size'),
      num = _.size,
      res = this.value,
      cnt = this.count,
      cap = 0,
      map = res.reduce(function(m, t) {
        m[t._id] = 1;
        return m;
      }, {});

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

var prototype$40 = inherits(Sequence, Transform);

prototype$40.transform = function(_, pulse) {
  if (this.value && !_.modified()) return;

  var out = pulse.materialize().fork(pulse.MOD);

  out.rem = this.value ? pulse.rem.concat(this.value) : pulse.rem;
  out.source = this.value = sequence(_.start, _.stop, _.step || 1).map(ingest);
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

var prototype$41 = inherits(Sieve, Transform);

prototype$41.transform = function(_, pulse) {
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

var prototype$42 = inherits(TupleIndex, Transform);

prototype$42.transform = function(_, pulse) {
  var df = pulse.dataflow,
      field$$1 = _.field,
      index = this.value,
      mod = true;

  function set(t) { index.set(field$$1(t), t); }

  if (_.modified('field') || pulse.modified(field$$1.fields)) {
    index.clear();
    pulse.visit(pulse.SOURCE, set);
  } else if (pulse.changed()) {
    pulse.visit(pulse.REM, function(t) { index.delete(field$$1(t)); });
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

var prototype$43 = inherits(Values, Transform);

prototype$43.transform = function(_, pulse) {
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
    { "name": "key", "type": "field", "required": true },
    { "name": "keyvals", "array": true },
    { "name": "groupby", "type": "field", "array": true },
    { "name": "method", "type": "enum", "default": "value",
      "values": ["value", "mean", "median", "max", "min"] },
    { "name": "value", "default": 0 }
  ]
};

var JoinAggregateDefinition = {
  "type": "JoinAggregate",
  "metadata": {"modifies": true},
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
    { "name": "key", "type": "field" }
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

// Utilities
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
register(JoinAggregateDefinition, JoinAggregate);
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

var invertRange = function(scale) {
  return function(_) {
    var lo = _[0],
        hi = _[1],
        t;

    if (hi < lo) {
      t = lo;
      lo = hi;
      hi = t;
    }

    return [
      scale.invert(lo),
      scale.invert(hi)
    ];
  }
};

var invertRangeExtent = function(scale) {
  return function(_) {
    var range = scale.range(),
        lo = _[0],
        hi = _[1],
        min = -1, max, t, i, n;

    if (hi < lo) {
      t = lo;
      lo = hi;
      hi = t;
    }

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
};

var bandSpace = function(count, paddingInner, paddingOuter) {
  var space = count - paddingInner + paddingOuter * 2;
  return count ? (space > 0 ? space : 1) : 0;
};

var array$2 = Array.prototype;

var map$3 = array$2.map;
var slice$2 = array$2.slice;

var implicit = {name: "implicit"};

function ordinal(range) {
  var index = map$1(),
      domain = [],
      unknown = implicit;

  range = range == null ? [] : slice$2.call(range);

  function scale(d) {
    var key = d + "", i = index.get(key);
    if (!i) {
      if (unknown !== implicit) return unknown;
      index.set(key, i = domain.push(d));
    }
    return range[(i - 1) % range.length];
  }

  scale.domain = function(_) {
    if (!arguments.length) return domain.slice();
    domain = [], index = map$1();
    var i = -1, n = _.length, d, key;
    while (++i < n) if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
    return scale;
  };

  scale.range = function(_) {
    return arguments.length ? (range = slice$2.call(_), scale) : range.slice();
  };

  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  scale.copy = function() {
    return ordinal()
        .domain(domain)
        .range(range)
        .unknown(unknown);
  };

  return scale;
}

var define = function(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
};

function extend$1(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color() {}

var darker = 0.7;
var brighter = 1 / darker;

var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex3 = /^#([0-9a-f]{3})$/;
var reHex6 = /^#([0-9a-f]{6})$/;
var reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$");
var reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$");
var reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$");
var reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$");
var reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$");
var reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color$1, {
  displayable: function() {
    return this.rgb().displayable();
  },
  toString: function() {
    return this.rgb() + "";
  }
});

function color$1(format) {
  var m;
  format = (format + "").trim().toLowerCase();
  return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1)) // #f00
      : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named.hasOwnProperty(format) ? rgbn(named[format])
      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
      : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color$1(o);
  if (!o) return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend$1(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function() {
    return this;
  },
  displayable: function() {
    return (0 <= this.r && this.r <= 255)
        && (0 <= this.g && this.g <= 255)
        && (0 <= this.b && this.b <= 255)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  toString: function() {
    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(")
        + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.b) || 0))
        + (a === 1 ? ")" : ", " + a + ")");
  }
}));

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color$1(o);
  if (!o) return new Hsl;
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend$1(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  displayable: function() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

var deg2rad = Math.PI / 180;
var rad2deg = 180 / Math.PI;

var Kn = 18;
var Xn = 0.950470;
var Yn = 1;
var Zn = 1.088830;
var t0$1 = 4 / 29;
var t1$1 = 6 / 29;
var t2 = 3 * t1$1 * t1$1;
var t3 = t1$1 * t1$1 * t1$1;

function labConvert(o) {
  if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl) {
    var h = o.h * deg2rad;
    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var b = rgb2xyz(o.r),
      a = rgb2xyz(o.g),
      l = rgb2xyz(o.b),
      x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
      y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
      z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
  return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
}

function lab(l, a, b, opacity) {
  return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
}

function Lab(l, a, b, opacity) {
  this.l = +l;
  this.a = +a;
  this.b = +b;
  this.opacity = +opacity;
}

define(Lab, lab, extend$1(Color, {
  brighter: function(k) {
    return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  darker: function(k) {
    return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  rgb: function() {
    var y = (this.l + 16) / 116,
        x = isNaN(this.a) ? y : y + this.a / 500,
        z = isNaN(this.b) ? y : y - this.b / 200;
    y = Yn * lab2xyz(y);
    x = Xn * lab2xyz(x);
    z = Zn * lab2xyz(z);
    return new Rgb(
      xyz2rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
      xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
      xyz2rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
      this.opacity
    );
  }
}));

function xyz2lab(t) {
  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0$1;
}

function lab2xyz(t) {
  return t > t1$1 ? t * t * t : t2 * (t - t0$1);
}

function xyz2rgb(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function hclConvert(o) {
  if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab)) o = labConvert(o);
  var h = Math.atan2(o.b, o.a) * rad2deg;
  return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}

function hcl(h, c, l, opacity) {
  return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
}

function Hcl(h, c, l, opacity) {
  this.h = +h;
  this.c = +c;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hcl, hcl, extend$1(Color, {
  brighter: function(k) {
    return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
  },
  darker: function(k) {
    return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
  },
  rgb: function() {
    return labConvert(this).rgb();
  }
}));

var A = -0.14861;
var B = +1.78277;
var C = -0.29227;
var D = -0.90649;
var E = +1.97294;
var ED = E * D;
var EB = E * B;
var BC_DA = B * C - D * A;

function cubehelixConvert(o) {
  if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
      bl = b - l,
      k = (E * (g - l) - C * bl) / D,
      s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
      h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
  return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
}

function cubehelix(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
}

function Cubehelix(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Cubehelix, cubehelix, extend$1(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
    return new Rgb(
      255 * (l + a * (A * cosh + B * sinh)),
      255 * (l + a * (C * cosh + D * sinh)),
      255 * (l + a * (E * cosh)),
      this.opacity
    );
  }
}));

function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0
      + (4 - 6 * t2 + 3 * t3) * v1
      + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
      + t3 * v3) / 6;
}

var basis$1 = function(values) {
  var n = values.length - 1;
  return function(t) {
    var i = t <= 0 ? (t = 0) : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
        v1 = values[i],
        v2 = values[i + 1],
        v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
        v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
};

var basisClosed = function(values) {
  var n = values.length;
  return function(t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n),
        v0 = values[(i + n - 1) % n],
        v1 = values[i % n],
        v2 = values[(i + 1) % n],
        v3 = values[(i + 2) % n];
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
};

var constant$4 = function(x) {
  return function() {
    return x;
  };
};

function linear$1(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}

function hue(a, b) {
  var d = b - a;
  return d ? linear$1(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$4(isNaN(a) ? b : a);
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant$4(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear$1(a, d) : constant$4(isNaN(a) ? b : a);
}

var rgb$1 = (function rgbGamma(y) {
  var color$$1 = gamma(y);

  function rgb$$1(start, end) {
    var r = color$$1((start = rgb(start)).r, (end = rgb(end)).r),
        g = color$$1(start.g, end.g),
        b = color$$1(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$$1.gamma = rgbGamma;

  return rgb$$1;
})(1);

function rgbSpline(spline) {
  return function(colors) {
    var n = colors.length,
        r = new Array(n),
        g = new Array(n),
        b = new Array(n),
        i, color$$1;
    for (i = 0; i < n; ++i) {
      color$$1 = rgb(colors[i]);
      r[i] = color$$1.r || 0;
      g[i] = color$$1.g || 0;
      b[i] = color$$1.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color$$1.opacity = 1;
    return function(t) {
      color$$1.r = r(t);
      color$$1.g = g(t);
      color$$1.b = b(t);
      return color$$1 + "";
    };
  };
}

var rgbBasis = rgbSpline(basis$1);
var rgbBasisClosed = rgbSpline(basisClosed);

var array$3 = function(a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(nb),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) x[i] = interpolate(a[i], b[i]);
  for (; i < nb; ++i) c[i] = b[i];

  return function(t) {
    for (i = 0; i < na; ++i) c[i] = x[i](t);
    return c;
  };
};

var date = function(a, b) {
  var d = new Date;
  return a = +a, b -= a, function(t) {
    return d.setTime(a + b * t), d;
  };
};

var reinterpolate = function(a, b) {
  return a = +a, b -= a, function(t) {
    return a + b * t;
  };
};

var object$2 = function(a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || typeof a !== "object") a = {};
  if (b === null || typeof b !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = interpolate(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
};

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");

function zero$1(b) {
  return function() {
    return b;
  };
}

function one$1(b) {
  return function(t) {
    return b(t) + "";
  };
}

var string = function(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a))
      && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: reinterpolate(am, bm)});
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? one$1(q[0].x)
      : zero$1(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
};

var interpolate = function(a, b) {
  var t = typeof b, c;
  return b == null || t === "boolean" ? constant$4(b)
      : (t === "number" ? reinterpolate
      : t === "string" ? ((c = color$1(b)) ? (b = c, rgb$1) : string)
      : b instanceof color$1 ? rgb$1
      : b instanceof Date ? date
      : Array.isArray(b) ? array$3
      : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object$2
      : reinterpolate)(a, b);
};

var interpolateRound = function(a, b) {
  return a = +a, b -= a, function(t) {
    return Math.round(a + b * t);
  };
};

var degrees = 180 / Math.PI;

var identity$4 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

var decompose = function(a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX: scaleX,
    scaleY: scaleY
  };
};

var cssNode;
var cssRoot;
var cssView;
var svgNode;

function parseCss(value) {
  if (value === "none") return identity$4;
  if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
  cssNode.style.transform = value;
  value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
  cssRoot.removeChild(cssNode);
  value = value.slice(7, -1).split(",");
  return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
}

function parseSvg(value) {
  if (value == null) return identity$4;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity$4;
  value = value.matrix;
  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({i: i - 4, x: reinterpolate(xa, xb)}, {i: i - 2, x: reinterpolate(ya, yb)});
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: reinterpolate(a, b)});
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: reinterpolate(a, b)});
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({i: i - 4, x: reinterpolate(xa, xb)}, {i: i - 2, x: reinterpolate(ya, yb)});
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function(a, b) {
    var s = [], // string constants and placeholders
        q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}

var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

var rho = Math.SQRT2;
var rho2 = 2;
var rho4 = 4;
var epsilon2 = 1e-12;

function cosh(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}

function sinh(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}

function tanh(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}

// p0 = [ux0, uy0, w0]
// p1 = [ux1, uy1, w1]
var zoom = function(p0, p1) {
  var ux0 = p0[0], uy0 = p0[1], w0 = p0[2],
      ux1 = p1[0], uy1 = p1[1], w1 = p1[2],
      dx = ux1 - ux0,
      dy = uy1 - uy0,
      d2 = dx * dx + dy * dy,
      i,
      S;

  // Special case for u0 ≅ u1.
  if (d2 < epsilon2) {
    S = Math.log(w1 / w0) / rho;
    i = function(t) {
      return [
        ux0 + t * dx,
        uy0 + t * dy,
        w0 * Math.exp(rho * t * S)
      ];
    };
  }

  // General case.
  else {
    var d1 = Math.sqrt(d2),
        b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
        b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
        r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
        r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    S = (r1 - r0) / rho;
    i = function(t) {
      var s = t * S,
          coshr0 = cosh(r0),
          u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
      return [
        ux0 + u * dx,
        uy0 + u * dy,
        w0 * coshr0 / cosh(rho * s + r0)
      ];
    };
  }

  i.duration = S * 1000;

  return i;
};

function hsl$1(hue$$1) {
  return function(start, end) {
    var h = hue$$1((start = hsl(start)).h, (end = hsl(end)).h),
        s = nogamma(start.s, end.s),
        l = nogamma(start.l, end.l),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.h = h(t);
      start.s = s(t);
      start.l = l(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }
}

var hsl$2 = hsl$1(hue);
var hslLong = hsl$1(nogamma);

function lab$1(start, end) {
  var l = nogamma((start = lab(start)).l, (end = lab(end)).l),
      a = nogamma(start.a, end.a),
      b = nogamma(start.b, end.b),
      opacity = nogamma(start.opacity, end.opacity);
  return function(t) {
    start.l = l(t);
    start.a = a(t);
    start.b = b(t);
    start.opacity = opacity(t);
    return start + "";
  };
}

function hcl$1(hue$$1) {
  return function(start, end) {
    var h = hue$$1((start = hcl(start)).h, (end = hcl(end)).h),
        c = nogamma(start.c, end.c),
        l = nogamma(start.l, end.l),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.h = h(t);
      start.c = c(t);
      start.l = l(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }
}

var hcl$2 = hcl$1(hue);
var hclLong = hcl$1(nogamma);

function cubehelix$1(hue$$1) {
  return (function cubehelixGamma(y) {
    y = +y;

    function cubehelix$$1(start, end) {
      var h = hue$$1((start = cubehelix(start)).h, (end = cubehelix(end)).h),
          s = nogamma(start.s, end.s),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix$$1.gamma = cubehelixGamma;

    return cubehelix$$1;
  })(1);
}

var cubehelix$2 = cubehelix$1(hue);
var cubehelixLong = cubehelix$1(nogamma);

var quantize = function(interpolator, n) {
  var samples = new Array(n);
  for (var i = 0; i < n; ++i) samples[i] = interpolator(i / (n - 1));
  return samples;
};



var $$1 = Object.freeze({
	interpolate: interpolate,
	interpolateArray: array$3,
	interpolateBasis: basis$1,
	interpolateBasisClosed: basisClosed,
	interpolateDate: date,
	interpolateNumber: reinterpolate,
	interpolateObject: object$2,
	interpolateRound: interpolateRound,
	interpolateString: string,
	interpolateTransformCss: interpolateTransformCss,
	interpolateTransformSvg: interpolateTransformSvg,
	interpolateZoom: zoom,
	interpolateRgb: rgb$1,
	interpolateRgbBasis: rgbBasis,
	interpolateRgbBasisClosed: rgbBasisClosed,
	interpolateHsl: hsl$2,
	interpolateHslLong: hslLong,
	interpolateLab: lab$1,
	interpolateHcl: hcl$2,
	interpolateHclLong: hclLong,
	interpolateCubehelix: cubehelix$2,
	interpolateCubehelixLong: cubehelixLong,
	quantize: quantize
});

var constant$5 = function(x) {
  return function() {
    return x;
  };
};

var number$2 = function(x) {
  return +x;
};

var unit = [0, 1];

function deinterpolateLinear(a, b) {
  return (b -= (a = +a))
      ? function(x) { return (x - a) / b; }
      : constant$5(b);
}

function deinterpolateClamp(deinterpolate) {
  return function(a, b) {
    var d = deinterpolate(a = +a, b = +b);
    return function(x) { return x <= a ? 0 : x >= b ? 1 : d(x); };
  };
}

function reinterpolateClamp(reinterpolate$$1) {
  return function(a, b) {
    var r = reinterpolate$$1(a = +a, b = +b);
    return function(t) { return t <= 0 ? a : t >= 1 ? b : r(t); };
  };
}

function bimap(domain, range, deinterpolate, reinterpolate$$1) {
  var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
  if (d1 < d0) d0 = deinterpolate(d1, d0), r0 = reinterpolate$$1(r1, r0);
  else d0 = deinterpolate(d0, d1), r0 = reinterpolate$$1(r0, r1);
  return function(x) { return r0(d0(x)); };
}

function polymap(domain, range, deinterpolate, reinterpolate$$1) {
  var j = Math.min(domain.length, range.length) - 1,
      d = new Array(j),
      r = new Array(j),
      i = -1;

  // Reverse descending domains.
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }

  while (++i < j) {
    d[i] = deinterpolate(domain[i], domain[i + 1]);
    r[i] = reinterpolate$$1(range[i], range[i + 1]);
  }

  return function(x) {
    var i = bisectRight(domain, x, 1, j) - 1;
    return r[i](d[i](x));
  };
}

function copy(source, target) {
  return target
      .domain(source.domain())
      .range(source.range())
      .interpolate(source.interpolate())
      .clamp(source.clamp());
}

// deinterpolate(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
// reinterpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding domain value x in [a,b].
function continuous(deinterpolate, reinterpolate$$1) {
  var domain = unit,
      range = unit,
      interpolate$$1 = interpolate,
      clamp = false,
      piecewise,
      output,
      input;

  function rescale() {
    piecewise = Math.min(domain.length, range.length) > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }

  function scale(x) {
    return (output || (output = piecewise(domain, range, clamp ? deinterpolateClamp(deinterpolate) : deinterpolate, interpolate$$1)))(+x);
  }

  scale.invert = function(y) {
    return (input || (input = piecewise(range, domain, deinterpolateLinear, clamp ? reinterpolateClamp(reinterpolate$$1) : reinterpolate$$1)))(+y);
  };

  scale.domain = function(_) {
    return arguments.length ? (domain = map$3.call(_, number$2), rescale()) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (range = slice$2.call(_), rescale()) : range.slice();
  };

  scale.rangeRound = function(_) {
    return range = slice$2.call(_), interpolate$$1 = interpolateRound, rescale();
  };

  scale.clamp = function(_) {
    return arguments.length ? (clamp = !!_, rescale()) : clamp;
  };

  scale.interpolate = function(_) {
    return arguments.length ? (interpolate$$1 = _, rescale()) : interpolate$$1;
  };

  return rescale();
}

// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimal(1.23) returns ["123", 0].
var formatDecimal = function(x, p) {
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
  var i, coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x.slice(i + 1)
  ];
};

var exponent = function(x) {
  return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
};

var formatGroup = function(grouping, thousands) {
  return function(value, width) {
    var i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0;

    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }

    return t.reverse().join(thousands);
  };
};

var formatNumerals = function(numerals) {
  return function(value) {
    return value.replace(/[0-9]/g, function(i) {
      return numerals[+i];
    });
  };
};

var formatDefault = function(x, p) {
  x = x.toPrecision(p);

  out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (x[i]) {
      case ".": i0 = i1 = i; break;
      case "0": if (i0 === 0) i0 = i; i1 = i; break;
      case "e": break out;
      default: if (i0 > 0) i0 = 0; break;
    }
  }

  return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
};

var prefixExponent;

var formatPrefixAuto = function(x, p) {
  var d = formatDecimal(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1],
      i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
      n = coefficient.length;
  return i === n ? coefficient
      : i > n ? coefficient + new Array(i - n + 1).join("0")
      : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
      : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
};

var formatRounded = function(x, p) {
  var d = formatDecimal(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
      : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
      : coefficient + new Array(exponent - coefficient.length + 2).join("0");
};

var formatTypes = {
  "": formatDefault,
  "%": function(x, p) { return (x * 100).toFixed(p); },
  "b": function(x) { return Math.round(x).toString(2); },
  "c": function(x) { return x + ""; },
  "d": function(x) { return Math.round(x).toString(10); },
  "e": function(x, p) { return x.toExponential(p); },
  "f": function(x, p) { return x.toFixed(p); },
  "g": function(x, p) { return x.toPrecision(p); },
  "o": function(x) { return Math.round(x).toString(8); },
  "p": function(x, p) { return formatRounded(x * 100, p); },
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
  "x": function(x) { return Math.round(x).toString(16); }
};

// [[fill]align][sign][symbol][0][width][,][.precision][type]
var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

function formatSpecifier(specifier) {
  return new FormatSpecifier(specifier);
}

formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

function FormatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);

  var match,
      fill = match[1] || " ",
      align = match[2] || ">",
      sign = match[3] || "-",
      symbol = match[4] || "",
      zero = !!match[5],
      width = match[6] && +match[6],
      comma = !!match[7],
      precision = match[8] && +match[8].slice(1),
      type = match[9] || "";

  // The "n" type is an alias for ",g".
  if (type === "n") comma = true, type = "g";

  // Map invalid types to the default format.
  else if (!formatTypes[type]) type = "";

  // If zero fill is specified, padding goes after sign and before digits.
  if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

  this.fill = fill;
  this.align = align;
  this.sign = sign;
  this.symbol = symbol;
  this.zero = zero;
  this.width = width;
  this.comma = comma;
  this.precision = precision;
  this.type = type;
}

FormatSpecifier.prototype.toString = function() {
  return this.fill
      + this.align
      + this.sign
      + this.symbol
      + (this.zero ? "0" : "")
      + (this.width == null ? "" : Math.max(1, this.width | 0))
      + (this.comma ? "," : "")
      + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0))
      + this.type;
};

var identity$5 = function(x) {
  return x;
};

var prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

var formatLocale$1 = function(locale) {
  var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity$5,
      currency = locale.currency,
      decimal = locale.decimal,
      numerals = locale.numerals ? formatNumerals(locale.numerals) : identity$5,
      percent = locale.percent || "%";

  function newFormat(specifier) {
    specifier = formatSpecifier(specifier);

    var fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        type = specifier.type;

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
        suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? percent : "";

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = formatTypes[type],
        maybeSuffix = !type || /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision == null ? (type ? 6 : 12)
        : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
        : Math.max(0, Math.min(20, precision));

    function format(value) {
      var valuePrefix = prefix,
          valueSuffix = suffix,
          i, n, c;

      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Perform the initial formatting.
        var valueNegative = value < 0;
        value = formatType(Math.abs(value), precision);

        // If a negative value rounds to zero during formatting, treat as positive.
        if (valueNegative && +value === 0) valueNegative = false;

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? (sign === "(" ? sign : "-") : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) value = group(value, Infinity);

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<": value = valuePrefix + value + valueSuffix + padding; break;
        case "=": value = valuePrefix + padding + value + valueSuffix; break;
        case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
        default: value = padding + valuePrefix + value + valueSuffix; break;
      }

      return numerals(value);
    }

    format.toString = function() {
      return specifier + "";
    };

    return format;
  }

  function formatPrefix(specifier, value) {
    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
        e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
        k = Math.pow(10, -e),
        prefix = prefixes[8 + e / 3];
    return function(value) {
      return f(k * value) + prefix;
    };
  }

  return {
    format: newFormat,
    formatPrefix: formatPrefix
  };
};

var locale$2;
var format;
var formatPrefix;

defaultLocale$1({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});

function defaultLocale$1(definition) {
  locale$2 = formatLocale$1(definition);
  format = locale$2.format;
  formatPrefix = locale$2.formatPrefix;
  return locale$2;
}

var precisionFixed = function(step) {
  return Math.max(0, -exponent(Math.abs(step)));
};

var precisionPrefix = function(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
};

var precisionRound = function(step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, exponent(max) - exponent(step)) + 1;
};

var tickFormat = function(domain, count, specifier) {
  var start = domain[0],
      stop = domain[domain.length - 1],
      step = tickStep(start, stop, count == null ? 10 : count),
      precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value = Math.max(Math.abs(start), Math.abs(stop));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
      return formatPrefix(specifier, value);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
      break;
    }
  }
  return format(specifier);
};

function linearish(scale) {
  var domain = scale.domain;

  scale.ticks = function(count) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
  };

  scale.tickFormat = function(count, specifier) {
    return tickFormat(domain(), count, specifier);
  };

  scale.nice = function(count) {
    if (count == null) count = 10;

    var d = domain(),
        i0 = 0,
        i1 = d.length - 1,
        start = d[i0],
        stop = d[i1],
        step;

    if (stop < start) {
      step = start, start = stop, stop = step;
      step = i0, i0 = i1, i1 = step;
    }

    step = tickIncrement(start, stop, count);

    if (step > 0) {
      start = Math.floor(start / step) * step;
      stop = Math.ceil(stop / step) * step;
      step = tickIncrement(start, stop, count);
    } else if (step < 0) {
      start = Math.ceil(start * step) / step;
      stop = Math.floor(stop * step) / step;
      step = tickIncrement(start, stop, count);
    }

    if (step > 0) {
      d[i0] = Math.floor(start / step) * step;
      d[i1] = Math.ceil(stop / step) * step;
      domain(d);
    } else if (step < 0) {
      d[i0] = Math.ceil(start * step) / step;
      d[i1] = Math.floor(stop * step) / step;
      domain(d);
    }

    return scale;
  };

  return scale;
}

function linear() {
  var scale = continuous(deinterpolateLinear, reinterpolate);

  scale.copy = function() {
    return copy(scale, linear());
  };

  return linearish(scale);
}

function identity$3() {
  var domain = [0, 1];

  function scale(x) {
    return +x;
  }

  scale.invert = scale;

  scale.domain = scale.range = function(_) {
    return arguments.length ? (domain = map$3.call(_, number$2), scale) : domain.slice();
  };

  scale.copy = function() {
    return identity$3().domain(domain);
  };

  return linearish(scale);
}

var nice = function(domain, interval) {
  domain = domain.slice();

  var i0 = 0,
      i1 = domain.length - 1,
      x0 = domain[i0],
      x1 = domain[i1],
      t;

  if (x1 < x0) {
    t = i0, i0 = i1, i1 = t;
    t = x0, x0 = x1, x1 = t;
  }

  domain[i0] = interval.floor(x0);
  domain[i1] = interval.ceil(x1);
  return domain;
};

function deinterpolate(a, b) {
  return (b = Math.log(b / a))
      ? function(x) { return Math.log(x / a) / b; }
      : constant$5(b);
}

function reinterpolate$1(a, b) {
  return a < 0
      ? function(t) { return -Math.pow(-b, t) * Math.pow(-a, 1 - t); }
      : function(t) { return Math.pow(b, t) * Math.pow(a, 1 - t); };
}

function pow10(x) {
  return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x;
}

function powp(base) {
  return base === 10 ? pow10
      : base === Math.E ? Math.exp
      : function(x) { return Math.pow(base, x); };
}

function logp(base) {
  return base === Math.E ? Math.log
      : base === 10 && Math.log10
      || base === 2 && Math.log2
      || (base = Math.log(base), function(x) { return Math.log(x) / base; });
}

function reflect(f) {
  return function(x) {
    return -f(-x);
  };
}

function log$1() {
  var scale = continuous(deinterpolate, reinterpolate$1).domain([1, 10]),
      domain = scale.domain,
      base = 10,
      logs = logp(10),
      pows = powp(10);

  function rescale() {
    logs = logp(base), pows = powp(base);
    if (domain()[0] < 0) logs = reflect(logs), pows = reflect(pows);
    return scale;
  }

  scale.base = function(_) {
    return arguments.length ? (base = +_, rescale()) : base;
  };

  scale.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.ticks = function(count) {
    var d = domain(),
        u = d[0],
        v = d[d.length - 1],
        r;

    if (r = v < u) i = u, u = v, v = i;

    var i = logs(u),
        j = logs(v),
        p,
        k,
        t,
        n = count == null ? 10 : +count,
        z = [];

    if (!(base % 1) && j - i < n) {
      i = Math.round(i) - 1, j = Math.round(j) + 1;
      if (u > 0) for (; i < j; ++i) {
        for (k = 1, p = pows(i); k < base; ++k) {
          t = p * k;
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      } else for (; i < j; ++i) {
        for (k = base - 1, p = pows(i); k >= 1; --k) {
          t = p * k;
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      }
    } else {
      z = ticks(i, j, Math.min(j - i, n)).map(pows);
    }

    return r ? z.reverse() : z;
  };

  scale.tickFormat = function(count, specifier) {
    if (specifier == null) specifier = base === 10 ? ".0e" : ",";
    if (typeof specifier !== "function") specifier = format(specifier);
    if (count === Infinity) return specifier;
    if (count == null) count = 10;
    var k = Math.max(1, base * count / scale.ticks().length); // TODO fast estimate?
    return function(d) {
      var i = d / pows(Math.round(logs(d)));
      if (i * base < base - 0.5) i *= base;
      return i <= k ? specifier(d) : "";
    };
  };

  scale.nice = function() {
    return domain(nice(domain(), {
      floor: function(x) { return pows(Math.floor(logs(x))); },
      ceil: function(x) { return pows(Math.ceil(logs(x))); }
    }));
  };

  scale.copy = function() {
    return copy(scale, log$1().base(base));
  };

  return scale;
}

function raise(x, exponent) {
  return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
}

function pow() {
  var exponent = 1,
      scale = continuous(deinterpolate, reinterpolate),
      domain = scale.domain;

  function deinterpolate(a, b) {
    return (b = raise(b, exponent) - (a = raise(a, exponent)))
        ? function(x) { return (raise(x, exponent) - a) / b; }
        : constant$5(b);
  }

  function reinterpolate(a, b) {
    b = raise(b, exponent) - (a = raise(a, exponent));
    return function(t) { return raise(a + b * t, 1 / exponent); };
  }

  scale.exponent = function(_) {
    return arguments.length ? (exponent = +_, domain(domain())) : exponent;
  };

  scale.copy = function() {
    return copy(scale, pow().exponent(exponent));
  };

  return linearish(scale);
}

function sqrt$1() {
  return pow().exponent(0.5);
}

function quantile() {
  var domain = [],
      range = [],
      thresholds = [];

  function rescale() {
    var i = 0, n = Math.max(1, range.length);
    thresholds = new Array(n - 1);
    while (++i < n) thresholds[i - 1] = threshold(domain, i / n);
    return scale;
  }

  function scale(x) {
    if (!isNaN(x = +x)) return range[bisectRight(thresholds, x)];
  }

  scale.invertExtent = function(y) {
    var i = range.indexOf(y);
    return i < 0 ? [NaN, NaN] : [
      i > 0 ? thresholds[i - 1] : domain[0],
      i < thresholds.length ? thresholds[i] : domain[domain.length - 1]
    ];
  };

  scale.domain = function(_) {
    if (!arguments.length) return domain.slice();
    domain = [];
    for (var i = 0, n = _.length, d; i < n; ++i) if (d = _[i], d != null && !isNaN(d = +d)) domain.push(d);
    domain.sort(ascending);
    return rescale();
  };

  scale.range = function(_) {
    return arguments.length ? (range = slice$2.call(_), rescale()) : range.slice();
  };

  scale.quantiles = function() {
    return thresholds.slice();
  };

  scale.copy = function() {
    return quantile()
        .domain(domain)
        .range(range);
  };

  return scale;
}

function quantize$1() {
  var x0 = 0,
      x1 = 1,
      n = 1,
      domain = [0.5],
      range = [0, 1];

  function scale(x) {
    if (x <= x) return range[bisectRight(domain, x, 0, n)];
  }

  function rescale() {
    var i = -1;
    domain = new Array(n);
    while (++i < n) domain[i] = ((i + 1) * x1 - (i - n) * x0) / (n + 1);
    return scale;
  }

  scale.domain = function(_) {
    return arguments.length ? (x0 = +_[0], x1 = +_[1], rescale()) : [x0, x1];
  };

  scale.range = function(_) {
    return arguments.length ? (n = (range = slice$2.call(_)).length - 1, rescale()) : range.slice();
  };

  scale.invertExtent = function(y) {
    var i = range.indexOf(y);
    return i < 0 ? [NaN, NaN]
        : i < 1 ? [x0, domain[0]]
        : i >= n ? [domain[n - 1], x1]
        : [domain[i - 1], domain[i]];
  };

  scale.copy = function() {
    return quantize$1()
        .domain([x0, x1])
        .range(range);
  };

  return linearish(scale);
}

function threshold$1() {
  var domain = [0.5],
      range = [0, 1],
      n = 1;

  function scale(x) {
    if (x <= x) return range[bisectRight(domain, x, 0, n)];
  }

  scale.domain = function(_) {
    return arguments.length ? (domain = slice$2.call(_), n = Math.min(domain.length, range.length - 1), scale) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (range = slice$2.call(_), n = Math.min(domain.length, range.length - 1), scale) : range.slice();
  };

  scale.invertExtent = function(y) {
    var i = range.indexOf(y);
    return [domain[i - 1], domain[i]];
  };

  scale.copy = function() {
    return threshold$1()
        .domain(domain)
        .range(range);
  };

  return scale;
}

var durationSecond$1 = 1000;
var durationMinute$1 = durationSecond$1 * 60;
var durationHour$1 = durationMinute$1 * 60;
var durationDay$1 = durationHour$1 * 24;
var durationWeek$1 = durationDay$1 * 7;
var durationMonth = durationDay$1 * 30;
var durationYear = durationDay$1 * 365;

function date$1(t) {
  return new Date(t);
}

function number$3(t) {
  return t instanceof Date ? +t : +new Date(+t);
}

function calendar(year$$1, month$$1, week, day$$1, hour$$1, minute$$1, second$$1, millisecond$$1, format) {
  var scale = continuous(deinterpolateLinear, reinterpolate),
      invert = scale.invert,
      domain = scale.domain;

  var formatMillisecond = format(".%L"),
      formatSecond = format(":%S"),
      formatMinute = format("%I:%M"),
      formatHour = format("%I %p"),
      formatDay = format("%a %d"),
      formatWeek = format("%b %d"),
      formatMonth = format("%B"),
      formatYear = format("%Y");

  var tickIntervals = [
    [second$$1,  1,      durationSecond$1],
    [second$$1,  5,  5 * durationSecond$1],
    [second$$1, 15, 15 * durationSecond$1],
    [second$$1, 30, 30 * durationSecond$1],
    [minute$$1,  1,      durationMinute$1],
    [minute$$1,  5,  5 * durationMinute$1],
    [minute$$1, 15, 15 * durationMinute$1],
    [minute$$1, 30, 30 * durationMinute$1],
    [  hour$$1,  1,      durationHour$1  ],
    [  hour$$1,  3,  3 * durationHour$1  ],
    [  hour$$1,  6,  6 * durationHour$1  ],
    [  hour$$1, 12, 12 * durationHour$1  ],
    [   day$$1,  1,      durationDay$1   ],
    [   day$$1,  2,  2 * durationDay$1   ],
    [  week,  1,      durationWeek$1  ],
    [ month$$1,  1,      durationMonth ],
    [ month$$1,  3,  3 * durationMonth ],
    [  year$$1,  1,      durationYear  ]
  ];

  function tickFormat(date$$1) {
    return (second$$1(date$$1) < date$$1 ? formatMillisecond
        : minute$$1(date$$1) < date$$1 ? formatSecond
        : hour$$1(date$$1) < date$$1 ? formatMinute
        : day$$1(date$$1) < date$$1 ? formatHour
        : month$$1(date$$1) < date$$1 ? (week(date$$1) < date$$1 ? formatDay : formatWeek)
        : year$$1(date$$1) < date$$1 ? formatMonth
        : formatYear)(date$$1);
  }

  function tickInterval(interval, start, stop, step) {
    if (interval == null) interval = 10;

    // If a desired tick count is specified, pick a reasonable tick interval
    // based on the extent of the domain and a rough estimate of tick size.
    // Otherwise, assume interval is already a time interval and use it.
    if (typeof interval === "number") {
      var target = Math.abs(stop - start) / interval,
          i = bisector(function(i) { return i[2]; }).right(tickIntervals, target);
      if (i === tickIntervals.length) {
        step = tickStep(start / durationYear, stop / durationYear, interval);
        interval = year$$1;
      } else if (i) {
        i = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
        step = i[1];
        interval = i[0];
      } else {
        step = tickStep(start, stop, interval);
        interval = millisecond$$1;
      }
    }

    return step == null ? interval : interval.every(step);
  }

  scale.invert = function(y) {
    return new Date(invert(y));
  };

  scale.domain = function(_) {
    return arguments.length ? domain(map$3.call(_, number$3)) : domain().map(date$1);
  };

  scale.ticks = function(interval, step) {
    var d = domain(),
        t0 = d[0],
        t1 = d[d.length - 1],
        r = t1 < t0,
        t;
    if (r) t = t0, t0 = t1, t1 = t;
    t = tickInterval(interval, t0, t1, step);
    t = t ? t.range(t0, t1 + 1) : []; // inclusive stop
    return r ? t.reverse() : t;
  };

  scale.tickFormat = function(count, specifier) {
    return specifier == null ? tickFormat : format(specifier);
  };

  scale.nice = function(interval, step) {
    var d = domain();
    return (interval = tickInterval(interval, d[0], d[d.length - 1], step))
        ? domain(nice(d, interval))
        : scale;
  };

  scale.copy = function() {
    return copy(scale, calendar(year$$1, month$$1, week, day$$1, hour$$1, minute$$1, second$$1, millisecond$$1, format));
  };

  return scale;
}

var time = function() {
  return calendar(year, month, sunday, day, hour, minute, second, millisecond, timeFormat).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]);
};

var utcTime = function() {
  return calendar(utcYear, utcMonth, utcSunday, utcDay, utcHour, utcMinute, second, millisecond, utcFormat).domain([Date.UTC(2000, 0, 1), Date.UTC(2000, 0, 2)]);
};

var colors = function(s) {
  return s.match(/.{6}/g).map(function(x) {
    return "#" + x;
  });
};

var category10 = colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

var category20b = colors("393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6");

var category20c = colors("3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9");

var category20 = colors("1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5");

cubehelixLong(cubehelix(300, 0.5, 0.0), cubehelix(-240, 0.5, 1.0));

var warm = cubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var cool = cubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var rainbow = cubehelix();

function ramp(range) {
  var n = range.length;
  return function(t) {
    return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
  };
}

var viridis = ramp(colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

var magma = ramp(colors("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

var inferno = ramp(colors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

var plasma = ramp(colors("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

function band$$1() {
  var scale = ordinal().unknown(undefined),
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
    if (round) {
      step = Math.floor(step);
    }
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) {
      start = Math.round(start);
      bandwidth = Math.round(bandwidth);
    }
    var values = sequence(n).map(function(i) { return start + step * i; });
    return ordinalRange(reverse ? values.reverse() : values);
  }

  scale.domain = function(_) {
    if (arguments.length) {
      domain(_);
      return rescale();
    } else {
      return domain();
    }
  };

  scale.range = function(_) {
    if (arguments.length) {
      range = [+_[0], +_[1]];
      return rescale();
    } else {
      return range.slice();
    }
  };

  scale.rangeRound = function(_) {
    range = [+_[0], +_[1]];
    round = true;
    return rescale();
  };

  scale.bandwidth = function() {
    return bandwidth;
  };

  scale.step = function() {
    return step;
  };

  scale.round = function(_) {
    if (arguments.length) {
      round = !!_;
      return rescale();
    } else {
      return round;
    }
  };

  scale.padding = function(_) {
    if (arguments.length) {
      paddingOuter = Math.max(0, Math.min(1, _));
      paddingInner = paddingOuter;
      return rescale();
    } else {
      return paddingInner;
    }
  };

  scale.paddingInner = function(_) {
    if (arguments.length) {
      paddingInner = Math.max(0, Math.min(1, _));
      return rescale();
    } else {
      return paddingInner;
    }
  };

  scale.paddingOuter = function(_) {
    if (arguments.length) {
      paddingOuter = Math.max(0, Math.min(1, _));
      return rescale();
    } else {
      return paddingOuter;
    }
  };

  scale.align = function(_) {
    if (arguments.length) {
      align = Math.max(0, Math.min(1, _));
      return rescale();
    } else {
      return align;
    }
  };

  scale.invertRange = function(_) {
    // bail if range has null or undefined values
    if (_[0] == null || _[1] == null) return;

    var lo = +_[0],
        hi = +_[1],
        reverse = range[1] < range[0],
        values = reverse ? ordinalRange().reverse() : ordinalRange(),
        n = values.length - 1, a, b, t;

    // bail if either range endpoint is invalid
    if (lo !== lo || hi !== hi) return;

    // order range inputs, bail if outside of scale range
    if (hi < lo) {
      t = lo;
      lo = hi;
      hi = t;
    }
    if (hi < values[0] || lo > range[1-reverse]) return;

    // binary search to index into scale range
    a = Math.max(0, bisectRight(values, lo) - 1);
    b = lo===hi ? a : bisectRight(values, hi) - 1;

    // increment index a if lo is within padding gap
    if (lo - values[a] > bandwidth + 1e-10) ++a;

    if (reverse) {
      // map + swap
      t = a;
      a = n - b;
      b = n - t;
    }
    return (a > b) ? undefined : domain().slice(a, b+1);
  };

  scale.invert = function(_) {
    var value = scale.invertRange([_, _]);
    return value ? value[0] : value;
  };

  scale.copy = function() {
    return band$$1()
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

function point$5() {
  return pointish(band$$1().paddingInner(1));
}

var map$4 = Array.prototype.map;
var slice$3 = Array.prototype.slice;

function numbers$1(_) {
  return map$4.call(_, function(x) { return +x; });
}

function binLinear() {
  var linear$$1 = linear(),
      domain = [];

  function scale(x) {
    return linear$$1(x);
  }

  function setDomain(_) {
    domain = numbers$1(_);
    linear$$1.domain([domain[0], peek(domain)]);
  }

  scale.domain = function(_) {
    return arguments.length ? (setDomain(_), scale) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (linear$$1.range(_), scale) : linear$$1.range();
  };

  scale.rangeRound = function(_) {
    return arguments.length ? (linear$$1.rangeRound(_), scale) : linear$$1.rangeRound();
  };

  scale.interpolate = function(_) {
    return arguments.length ? (linear$$1.interpolate(_), scale) : linear$$1.interpolate();
  };

  scale.invert = function(_) {
    return linear$$1.invert(_);
  };

  scale.ticks = function(count) {
    var n = domain.length,
        stride = ~~(n / (count || n));

    return stride < 2
      ? scale.domain()
      : domain.filter(function(x, i) { return !(i % stride); });
  };

  scale.tickFormat = function() {
    return linear$$1.tickFormat.apply(linear$$1, arguments);
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
      : range[(bisectRight(domain, x) - 1) % range.length];
  }

  scale.domain = function(_) {
    if (arguments.length) {
      domain = numbers$1(_);
      return scale;
    } else {
      return domain.slice();
    }
  };

  scale.range = function(_) {
    if (arguments.length) {
      range = slice$3.call(_);
      return scale;
    } else {
      return range.slice();
    }
  };

  scale.copy = function() {
    return binOrdinal().domain(scale.domain()).range(scale.range());
  };

  return scale;
}

function sequential$1(interpolator) {
  var linear$$1 = linear(),
      x0 = 0,
      dx = 1,
      clamp = false;

  function update() {
    var domain = linear$$1.domain();
    x0 = domain[0];
    dx = peek(domain) - x0;
  }

  function scale(x) {
    var t = (x - x0) / dx;
    return interpolator(clamp ? Math.max(0, Math.min(1, t)) : t);
  }

  scale.clamp = function(_) {
    if (arguments.length) {
      clamp = !!_;
      return scale;
    } else {
      return clamp;
    }
  };

  scale.domain = function(_) {
    return arguments.length ? (linear$$1.domain(_), update(), scale) : linear$$1.domain();
  };

  scale.interpolator = function(_) {
    if (arguments.length) {
      interpolator = _;
      return scale;
    } else {
      return interpolator;
    }
  };

  scale.copy = function() {
    return sequential$1().domain(linear$$1.domain()).clamp(clamp).interpolator(interpolator);
  };

  scale.ticks = function(count) {
    return linear$$1.ticks(count);
  };

  scale.tickFormat = function(count, specifier) {
    return linear$$1.tickFormat(count, specifier);
  };

  scale.nice = function(count) {
    return linear$$1.nice(count), update(), scale;
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

    s.type = type;
    return s;
  };
}

function scale$1(type, scale) {
  if (arguments.length > 1) {
    scales[type] = create(type, scale);
    return this;
  } else {
    return scales.hasOwnProperty(type) ? scales[type] : undefined;
  }
}

var scales = {
  // base scale types
  identity:      identity$3,
  linear:        linear,
  log:           log$1,
  ordinal:       ordinal,
  pow:           pow,
  sqrt:          sqrt$1,
  quantile:      quantile,
  quantize:      quantize$1,
  threshold:     threshold$1,
  time:          time,
  utc:           utcTime,

  // extended scale types
  band:          band$$1,
  point:         point$5,
  sequential:    sequential$1,
  'bin-linear':  binLinear,
  'bin-ordinal': binOrdinal
};

for (var key$1 in scales) {
  scale$1(key$1, scales[key$1]);
}

function colors$1(specifier) {
  var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
  while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
  return colors;
}

var tableau10 = colors$1(
  '4c78a8f58518e4575672b7b254a24beeca3bb279a2ff9da69d755dbab0ac'
);

var tableau20 = colors$1(
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
).map(colors$1);

var colors$2 = function(specifier) {
  var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
  while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
  return colors;
};

var Accent = colors$2("7fc97fbeaed4fdc086ffff99386cb0f0027fbf5b17666666");

var Dark2 = colors$2("1b9e77d95f027570b3e7298a66a61ee6ab02a6761d666666");

var Paired = colors$2("a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928");

var Pastel1 = colors$2("fbb4aeb3cde3ccebc5decbe4fed9a6ffffcce5d8bdfddaecf2f2f2");

var Pastel2 = colors$2("b3e2cdfdcdaccbd5e8f4cae4e6f5c9fff2aef1e2cccccccc");

var Set1 = colors$2("e41a1c377eb84daf4a984ea3ff7f00ffff33a65628f781bf999999");

var Set2 = colors$2("66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3");

var Set3 = colors$2("8dd3c7ffffb3bebadafb807280b1d3fdb462b3de69fccde5d9d9d9bc80bdccebc5ffed6f");

var ramp$1 = function(scheme) {
  return rgbBasis(scheme[scheme.length - 1]);
};

var scheme = new Array(3).concat(
  "d8b365f5f5f55ab4ac",
  "a6611adfc27d80cdc1018571",
  "a6611adfc27df5f5f580cdc1018571",
  "8c510ad8b365f6e8c3c7eae55ab4ac01665e",
  "8c510ad8b365f6e8c3f5f5f5c7eae55ab4ac01665e",
  "8c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e",
  "8c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e",
  "5430058c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e003c30",
  "5430058c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e003c30"
).map(colors$2);

var BrBG = ramp$1(scheme);

var scheme$1 = new Array(3).concat(
  "af8dc3f7f7f77fbf7b",
  "7b3294c2a5cfa6dba0008837",
  "7b3294c2a5cff7f7f7a6dba0008837",
  "762a83af8dc3e7d4e8d9f0d37fbf7b1b7837",
  "762a83af8dc3e7d4e8f7f7f7d9f0d37fbf7b1b7837",
  "762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b7837",
  "762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b7837",
  "40004b762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b783700441b",
  "40004b762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b783700441b"
).map(colors$2);

var PRGn = ramp$1(scheme$1);

var scheme$2 = new Array(3).concat(
  "e9a3c9f7f7f7a1d76a",
  "d01c8bf1b6dab8e1864dac26",
  "d01c8bf1b6daf7f7f7b8e1864dac26",
  "c51b7de9a3c9fde0efe6f5d0a1d76a4d9221",
  "c51b7de9a3c9fde0eff7f7f7e6f5d0a1d76a4d9221",
  "c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221",
  "c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221",
  "8e0152c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221276419",
  "8e0152c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221276419"
).map(colors$2);

var PiYG = ramp$1(scheme$2);

var scheme$3 = new Array(3).concat(
  "998ec3f7f7f7f1a340",
  "5e3c99b2abd2fdb863e66101",
  "5e3c99b2abd2f7f7f7fdb863e66101",
  "542788998ec3d8daebfee0b6f1a340b35806",
  "542788998ec3d8daebf7f7f7fee0b6f1a340b35806",
  "5427888073acb2abd2d8daebfee0b6fdb863e08214b35806",
  "5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b35806",
  "2d004b5427888073acb2abd2d8daebfee0b6fdb863e08214b358067f3b08",
  "2d004b5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b358067f3b08"
).map(colors$2);

var PuOr = ramp$1(scheme$3);

var scheme$4 = new Array(3).concat(
  "ef8a62f7f7f767a9cf",
  "ca0020f4a58292c5de0571b0",
  "ca0020f4a582f7f7f792c5de0571b0",
  "b2182bef8a62fddbc7d1e5f067a9cf2166ac",
  "b2182bef8a62fddbc7f7f7f7d1e5f067a9cf2166ac",
  "b2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac",
  "b2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac",
  "67001fb2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac053061",
  "67001fb2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac053061"
).map(colors$2);

var RdBu = ramp$1(scheme$4);

var scheme$5 = new Array(3).concat(
  "ef8a62ffffff999999",
  "ca0020f4a582bababa404040",
  "ca0020f4a582ffffffbababa404040",
  "b2182bef8a62fddbc7e0e0e09999994d4d4d",
  "b2182bef8a62fddbc7ffffffe0e0e09999994d4d4d",
  "b2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d",
  "b2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d",
  "67001fb2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d1a1a1a",
  "67001fb2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d1a1a1a"
).map(colors$2);

var RdGy = ramp$1(scheme$5);

var scheme$6 = new Array(3).concat(
  "fc8d59ffffbf91bfdb",
  "d7191cfdae61abd9e92c7bb6",
  "d7191cfdae61ffffbfabd9e92c7bb6",
  "d73027fc8d59fee090e0f3f891bfdb4575b4",
  "d73027fc8d59fee090ffffbfe0f3f891bfdb4575b4",
  "d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4",
  "d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4",
  "a50026d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4313695",
  "a50026d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4313695"
).map(colors$2);

var RdYlBu = ramp$1(scheme$6);

var scheme$7 = new Array(3).concat(
  "fc8d59ffffbf91cf60",
  "d7191cfdae61a6d96a1a9641",
  "d7191cfdae61ffffbfa6d96a1a9641",
  "d73027fc8d59fee08bd9ef8b91cf601a9850",
  "d73027fc8d59fee08bffffbfd9ef8b91cf601a9850",
  "d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850",
  "d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850",
  "a50026d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850006837",
  "a50026d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850006837"
).map(colors$2);

var RdYlGn = ramp$1(scheme$7);

var scheme$8 = new Array(3).concat(
  "fc8d59ffffbf99d594",
  "d7191cfdae61abdda42b83ba",
  "d7191cfdae61ffffbfabdda42b83ba",
  "d53e4ffc8d59fee08be6f59899d5943288bd",
  "d53e4ffc8d59fee08bffffbfe6f59899d5943288bd",
  "d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd",
  "d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd",
  "9e0142d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd5e4fa2",
  "9e0142d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd5e4fa2"
).map(colors$2);

var Spectral = ramp$1(scheme$8);

var scheme$9 = new Array(3).concat(
  "e5f5f999d8c92ca25f",
  "edf8fbb2e2e266c2a4238b45",
  "edf8fbb2e2e266c2a42ca25f006d2c",
  "edf8fbccece699d8c966c2a42ca25f006d2c",
  "edf8fbccece699d8c966c2a441ae76238b45005824",
  "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45005824",
  "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45006d2c00441b"
).map(colors$2);

var BuGn = ramp$1(scheme$9);

var scheme$10 = new Array(3).concat(
  "e0ecf49ebcda8856a7",
  "edf8fbb3cde38c96c688419d",
  "edf8fbb3cde38c96c68856a7810f7c",
  "edf8fbbfd3e69ebcda8c96c68856a7810f7c",
  "edf8fbbfd3e69ebcda8c96c68c6bb188419d6e016b",
  "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d6e016b",
  "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d810f7c4d004b"
).map(colors$2);

var BuPu = ramp$1(scheme$10);

var scheme$11 = new Array(3).concat(
  "e0f3dba8ddb543a2ca",
  "f0f9e8bae4bc7bccc42b8cbe",
  "f0f9e8bae4bc7bccc443a2ca0868ac",
  "f0f9e8ccebc5a8ddb57bccc443a2ca0868ac",
  "f0f9e8ccebc5a8ddb57bccc44eb3d32b8cbe08589e",
  "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe08589e",
  "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe0868ac084081"
).map(colors$2);

var GnBu = ramp$1(scheme$11);

var scheme$12 = new Array(3).concat(
  "fee8c8fdbb84e34a33",
  "fef0d9fdcc8afc8d59d7301f",
  "fef0d9fdcc8afc8d59e34a33b30000",
  "fef0d9fdd49efdbb84fc8d59e34a33b30000",
  "fef0d9fdd49efdbb84fc8d59ef6548d7301f990000",
  "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301f990000",
  "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301fb300007f0000"
).map(colors$2);

var OrRd = ramp$1(scheme$12);

var scheme$13 = new Array(3).concat(
  "ece2f0a6bddb1c9099",
  "f6eff7bdc9e167a9cf02818a",
  "f6eff7bdc9e167a9cf1c9099016c59",
  "f6eff7d0d1e6a6bddb67a9cf1c9099016c59",
  "f6eff7d0d1e6a6bddb67a9cf3690c002818a016450",
  "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016450",
  "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016c59014636"
).map(colors$2);

var PuBuGn = ramp$1(scheme$13);

var scheme$14 = new Array(3).concat(
  "ece7f2a6bddb2b8cbe",
  "f1eef6bdc9e174a9cf0570b0",
  "f1eef6bdc9e174a9cf2b8cbe045a8d",
  "f1eef6d0d1e6a6bddb74a9cf2b8cbe045a8d",
  "f1eef6d0d1e6a6bddb74a9cf3690c00570b0034e7b",
  "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0034e7b",
  "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0045a8d023858"
).map(colors$2);

var PuBu = ramp$1(scheme$14);

var scheme$15 = new Array(3).concat(
  "e7e1efc994c7dd1c77",
  "f1eef6d7b5d8df65b0ce1256",
  "f1eef6d7b5d8df65b0dd1c77980043",
  "f1eef6d4b9dac994c7df65b0dd1c77980043",
  "f1eef6d4b9dac994c7df65b0e7298ace125691003f",
  "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125691003f",
  "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125698004367001f"
).map(colors$2);

var PuRd = ramp$1(scheme$15);

var scheme$16 = new Array(3).concat(
  "fde0ddfa9fb5c51b8a",
  "feebe2fbb4b9f768a1ae017e",
  "feebe2fbb4b9f768a1c51b8a7a0177",
  "feebe2fcc5c0fa9fb5f768a1c51b8a7a0177",
  "feebe2fcc5c0fa9fb5f768a1dd3497ae017e7a0177",
  "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a0177",
  "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a017749006a"
).map(colors$2);

var RdPu = ramp$1(scheme$16);

var scheme$17 = new Array(3).concat(
  "edf8b17fcdbb2c7fb8",
  "ffffcca1dab441b6c4225ea8",
  "ffffcca1dab441b6c42c7fb8253494",
  "ffffccc7e9b47fcdbb41b6c42c7fb8253494",
  "ffffccc7e9b47fcdbb41b6c41d91c0225ea80c2c84",
  "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea80c2c84",
  "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58"
).map(colors$2);

var YlGnBu = ramp$1(scheme$17);

var scheme$18 = new Array(3).concat(
  "f7fcb9addd8e31a354",
  "ffffccc2e69978c679238443",
  "ffffccc2e69978c67931a354006837",
  "ffffccd9f0a3addd8e78c67931a354006837",
  "ffffccd9f0a3addd8e78c67941ab5d238443005a32",
  "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443005a32",
  "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443006837004529"
).map(colors$2);

var YlGn = ramp$1(scheme$18);

var scheme$19 = new Array(3).concat(
  "fff7bcfec44fd95f0e",
  "ffffd4fed98efe9929cc4c02",
  "ffffd4fed98efe9929d95f0e993404",
  "ffffd4fee391fec44ffe9929d95f0e993404",
  "ffffd4fee391fec44ffe9929ec7014cc4c028c2d04",
  "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c028c2d04",
  "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c02993404662506"
).map(colors$2);

var YlOrBr = ramp$1(scheme$19);

var scheme$20 = new Array(3).concat(
  "ffeda0feb24cf03b20",
  "ffffb2fecc5cfd8d3ce31a1c",
  "ffffb2fecc5cfd8d3cf03b20bd0026",
  "ffffb2fed976feb24cfd8d3cf03b20bd0026",
  "ffffb2fed976feb24cfd8d3cfc4e2ae31a1cb10026",
  "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cb10026",
  "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cbd0026800026"
).map(colors$2);

var YlOrRd = ramp$1(scheme$20);

var scheme$21 = new Array(3).concat(
  "deebf79ecae13182bd",
  "eff3ffbdd7e76baed62171b5",
  "eff3ffbdd7e76baed63182bd08519c",
  "eff3ffc6dbef9ecae16baed63182bd08519c",
  "eff3ffc6dbef9ecae16baed64292c62171b5084594",
  "f7fbffdeebf7c6dbef9ecae16baed64292c62171b5084594",
  "f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b"
).map(colors$2);

var Blues = ramp$1(scheme$21);

var scheme$22 = new Array(3).concat(
  "e5f5e0a1d99b31a354",
  "edf8e9bae4b374c476238b45",
  "edf8e9bae4b374c47631a354006d2c",
  "edf8e9c7e9c0a1d99b74c47631a354006d2c",
  "edf8e9c7e9c0a1d99b74c47641ab5d238b45005a32",
  "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45005a32",
  "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45006d2c00441b"
).map(colors$2);

var Greens = ramp$1(scheme$22);

var scheme$23 = new Array(3).concat(
  "f0f0f0bdbdbd636363",
  "f7f7f7cccccc969696525252",
  "f7f7f7cccccc969696636363252525",
  "f7f7f7d9d9d9bdbdbd969696636363252525",
  "f7f7f7d9d9d9bdbdbd969696737373525252252525",
  "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525",
  "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525000000"
).map(colors$2);

var Greys = ramp$1(scheme$23);

var scheme$24 = new Array(3).concat(
  "efedf5bcbddc756bb1",
  "f2f0f7cbc9e29e9ac86a51a3",
  "f2f0f7cbc9e29e9ac8756bb154278f",
  "f2f0f7dadaebbcbddc9e9ac8756bb154278f",
  "f2f0f7dadaebbcbddc9e9ac8807dba6a51a34a1486",
  "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a34a1486",
  "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a354278f3f007d"
).map(colors$2);

var Purples = ramp$1(scheme$24);

var scheme$25 = new Array(3).concat(
  "fee0d2fc9272de2d26",
  "fee5d9fcae91fb6a4acb181d",
  "fee5d9fcae91fb6a4ade2d26a50f15",
  "fee5d9fcbba1fc9272fb6a4ade2d26a50f15",
  "fee5d9fcbba1fc9272fb6a4aef3b2ccb181d99000d",
  "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181d99000d",
  "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181da50f1567000d"
).map(colors$2);

var Reds = ramp$1(scheme$25);

var scheme$26 = new Array(3).concat(
  "fee6cefdae6be6550d",
  "feeddefdbe85fd8d3cd94701",
  "feeddefdbe85fd8d3ce6550da63603",
  "feeddefdd0a2fdae6bfd8d3ce6550da63603",
  "feeddefdd0a2fdae6bfd8d3cf16913d948018c2d04",
  "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d948018c2d04",
  "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d94801a636037f2704"
).map(colors$2);

var Oranges = ramp$1(scheme$26);



var _ = Object.freeze({
	schemeAccent: Accent,
	schemeDark2: Dark2,
	schemePaired: Paired,
	schemePastel1: Pastel1,
	schemePastel2: Pastel2,
	schemeSet1: Set1,
	schemeSet2: Set2,
	schemeSet3: Set3,
	interpolateBrBG: BrBG,
	schemeBrBG: scheme,
	interpolatePRGn: PRGn,
	schemePRGn: scheme$1,
	interpolatePiYG: PiYG,
	schemePiYG: scheme$2,
	interpolatePuOr: PuOr,
	schemePuOr: scheme$3,
	interpolateRdBu: RdBu,
	schemeRdBu: scheme$4,
	interpolateRdGy: RdGy,
	schemeRdGy: scheme$5,
	interpolateRdYlBu: RdYlBu,
	schemeRdYlBu: scheme$6,
	interpolateRdYlGn: RdYlGn,
	schemeRdYlGn: scheme$7,
	interpolateSpectral: Spectral,
	schemeSpectral: scheme$8,
	interpolateBuGn: BuGn,
	schemeBuGn: scheme$9,
	interpolateBuPu: BuPu,
	schemeBuPu: scheme$10,
	interpolateGnBu: GnBu,
	schemeGnBu: scheme$11,
	interpolateOrRd: OrRd,
	schemeOrRd: scheme$12,
	interpolatePuBuGn: PuBuGn,
	schemePuBuGn: scheme$13,
	interpolatePuBu: PuBu,
	schemePuBu: scheme$14,
	interpolatePuRd: PuRd,
	schemePuRd: scheme$15,
	interpolateRdPu: RdPu,
	schemeRdPu: scheme$16,
	interpolateYlGnBu: YlGnBu,
	schemeYlGnBu: scheme$17,
	interpolateYlGn: YlGn,
	schemeYlGn: scheme$18,
	interpolateYlOrBr: YlOrBr,
	schemeYlOrBr: scheme$19,
	interpolateYlOrRd: YlOrRd,
	schemeYlOrRd: scheme$20,
	interpolateBlues: Blues,
	schemeBlues: scheme$21,
	interpolateGreens: Greens,
	schemeGreens: scheme$22,
	interpolateGreys: Greys,
	schemeGreys: scheme$23,
	interpolatePurples: Purples,
	schemePurples: scheme$24,
	interpolateReds: Reds,
	schemeReds: scheme$25,
	interpolateOranges: Oranges,
	schemeOranges: scheme$26
});

var discrete = {
  blueorange:  blueOrange
};

var schemes = {
  // d3 built-in categorical palettes
  category10:  category10,
  category20:  category20,
  category20b: category20b,
  category20c: category20c,

  // extended categorical palettes
  accent:      Accent,
  dark2:       Dark2,
  paired:      Paired,
  pastel1:     Pastel1,
  pastel2:     Pastel2,
  set1:        Set1,
  set2:        Set2,
  set3:        Set3,
  tableau10:   tableau10,
  tableau20:   tableau20,

  // d3 built-in interpolators
  viridis:     viridis,
  magma:       magma,
  inferno:     inferno,
  plasma:      plasma,

  // extended interpolators
  blueorange:  rgbBasis(peek(blueOrange))
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

var getScheme = function(name, scheme$$1) {
  if (arguments.length > 1) {
    schemes[name] = scheme$$1;
    return this;
  }

  var part = name.split('-');
  name = part[0];
  part = +part[1] + 1;

  return part && discrete.hasOwnProperty(name) ? discrete[name][part-1]
    : !part && schemes.hasOwnProperty(name) ? schemes[name]
    : undefined;
};

function interpolateRange(interpolator, range) {
  var start = range[0],
      span = peek(range) - start;
  return function(i) { return interpolator(start + i * span); };
}

function scaleFraction(scale, min, max) {
  var delta = max - min;
  return !delta ? constant$1(0)
    : scale.type === 'linear' || scale.type === 'sequential'
      ? function(_) { return (_ - min) / delta; }
      : scale.copy().domain([min, max]).range([0, 1]).interpolate(lerp);
}

function lerp(a, b) {
  var span = b - a;
  return function(i) { return a + i * span; }
}

function interpolate$1(type, gamma) {
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

var array$4 = Array.prototype;

var slice$4 = array$4.slice;

var ascending$2 = function(a, b) {
  return a - b;
};

var area$3 = function(ring) {
  var i = 0, n = ring.length, area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  return area;
};

var constant$6 = function(x) {
  return function() {
    return x;
  };
};

var contains = function(ring, hole) {
  var i = -1, n = hole.length, c;
  while (++i < n) if (c = ringContains(ring, hole[i])) return c;
  return 0;
};

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

var noop$4 = function() {};

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

var contours = function() {
  var dx = 1,
      dy = 1,
      threshold$$1 = thresholdSturges,
      smooth = smoothLinear;

  function contours(values) {
    var tz = threshold$$1(values);

    // Convert number of thresholds into uniform thresholds.
    if (!Array.isArray(tz)) {
      var domain = extent(values), start = domain[0], stop = domain[1];
      tz = tickStep(start, stop, tz);
      tz = sequence(Math.floor(start / tz) * tz, Math.floor(stop / tz) * tz, tz);
    } else {
      tz = tz.slice().sort(ascending$2);
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
          if (contains((polygon = polygons[i])[0], hole) !== -1) {
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
    return arguments.length ? (threshold$$1 = typeof _ === "function" ? _ : Array.isArray(_) ? constant$6(slice$4.call(_)) : constant$6(_), contours) : threshold$$1;
  };

  contours.smooth = function(_) {
    return arguments.length ? (smooth = _ ? smoothLinear : noop$4, contours) : smooth === smoothLinear;
  };

  return contours;
};

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

var contourDensity = function() {
  var x = defaultX,
      y = defaultY,
      dx = 960,
      dy = 500,
      r = 20, // blur radius
      k = 2, // log2(grid cell size)
      o = r * 3, // grid offset, to pad for blur
      n = (dx + o * 2) >> k, // grid width
      m = (dy + o * 2) >> k, // grid height
      threshold$$1 = constant$6(20);

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

    var tz = threshold$$1(values0);

    // Convert number of thresholds into uniform thresholds.
    if (!Array.isArray(tz)) {
      var stop = max(values0);
      tz = tickStep(0, stop, tz);
      tz = sequence(0, Math.floor(stop / tz) * tz, tz);
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
    return arguments.length ? (x = typeof _ === "function" ? _ : constant$6(+_), density) : x;
  };

  density.y = function(_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant$6(+_), density) : y;
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
    return arguments.length ? (threshold$$1 = typeof _ === "function" ? _ : Array.isArray(_) ? constant$6(slice$4.call(_)) : constant$6(_), density) : threshold$$1;
  };

  density.bandwidth = function(_) {
    if (!arguments.length) return Math.sqrt(r * (r + 1));
    if (!((_ = +_) >= 0)) throw new Error("invalid bandwidth");
    return r = Math.round((Math.sqrt(4 * _ * _ + 1) - 1) / 2), resize();
  };

  return density;
};

var CONTOUR_PARAMS = ['values', 'size'];
var DENSITY_PARAMS = ['x', 'y', 'size', 'cellSize', 'bandwidth'];

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
 * @param {Array<number>} [params.thresholds] - Contour threshold array. If
 *   this parameter is set, the count and nice parameters will be ignored.
 * @param {number} [params.count] - The desired number of contours.
 * @param {boolean} [params.nice] - Boolean flag indicating if the contour
 *   threshold values should be automatically aligned to "nice"
 *   human-friendly values. Setting this flag may cause the number of
 *   thresholds to deviate from the specified count.
 */
function Contour(params) {
  Transform.call(this, null, params);
}

var prototype$44 = inherits(Contour, Transform);

prototype$44.transform = function(_, pulse) {
  if (this.value && !pulse.changed() && !_.modified())
    return pulse.StopPropagation;

  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      count = _.count || 10,
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

  // set threshold parameter
  contour.thresholds(_.thresholds || (_.nice ? count : quantize$2(count)));

  // set all other parameters
  params.forEach(function(param) {
    if (_[param] != null) contour[param](_[param]);
  });

  if (this.value) out.rem = this.value;
  this.value = out.source = out.add = contour(values).map(ingest);

  return out;
};

function quantize$2(k) {
  return function(values) {
    var ex = extent(values), x0 = ex[0], dx = ex[1] - x0,
        t = [], i = 1;
    for (; i<=k; ++i) t.push(x0 + dx * i / (k + 1));
    return t;
  };
}

// Adds floating point numbers with twice the normal precision.
// Reference: J. R. Shewchuk, Adaptive Precision Floating-Point Arithmetic and
// Fast Robust Geometric Predicates, Discrete & Computational Geometry 18(3)
// 305–363 (1997).
// Code adapted from GeographicLib by Charles F. F. Karney,
// http://geographiclib.sourceforge.net/

var adder = function() {
  return new Adder;
};

function Adder() {
  this.reset();
}

Adder.prototype = {
  constructor: Adder,
  reset: function() {
    this.s = // rounded value
    this.t = 0; // exact error
  },
  add: function(y) {
    add$3(temp$1, y, this.t);
    add$3(this, temp$1.s, this.s);
    if (this.s) this.t += temp$1.t;
    else this.s = temp$1.t;
  },
  valueOf: function() {
    return this.s;
  }
};

var temp$1 = new Adder;

function add$3(adder, a, b) {
  var x = adder.s = a + b,
      bv = x - a,
      av = x - bv;
  adder.t = (a - av) + (b - bv);
}

var epsilon$2 = 1e-6;

var pi$3 = Math.PI;
var halfPi$2 = pi$3 / 2;
var quarterPi = pi$3 / 4;
var tau$4 = pi$3 * 2;

var degrees$1 = 180 / pi$3;
var radians = pi$3 / 180;

var abs$1 = Math.abs;
var atan = Math.atan;
var atan2$1 = Math.atan2;
var cos$1 = Math.cos;
var ceil = Math.ceil;
var exp = Math.exp;

var log$2 = Math.log;
var pow$1 = Math.pow;
var sin$1 = Math.sin;
var sign$1 = Math.sign || function(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; };
var sqrt$2 = Math.sqrt;
var tan = Math.tan;

function acos$1(x) {
  return x > 1 ? 0 : x < -1 ? pi$3 : Math.acos(x);
}

function asin$1(x) {
  return x > 1 ? halfPi$2 : x < -1 ? -halfPi$2 : Math.asin(x);
}

function noop$5() {}

function streamGeometry(geometry, stream) {
  if (geometry && streamGeometryType.hasOwnProperty(geometry.type)) {
    streamGeometryType[geometry.type](geometry, stream);
  }
}

var streamObjectType = {
  Feature: function(object, stream) {
    streamGeometry(object.geometry, stream);
  },
  FeatureCollection: function(object, stream) {
    var features = object.features, i = -1, n = features.length;
    while (++i < n) streamGeometry(features[i].geometry, stream);
  }
};

var streamGeometryType = {
  Sphere: function(object, stream) {
    stream.sphere();
  },
  Point: function(object, stream) {
    object = object.coordinates;
    stream.point(object[0], object[1], object[2]);
  },
  MultiPoint: function(object, stream) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) object = coordinates[i], stream.point(object[0], object[1], object[2]);
  },
  LineString: function(object, stream) {
    streamLine(object.coordinates, stream, 0);
  },
  MultiLineString: function(object, stream) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) streamLine(coordinates[i], stream, 0);
  },
  Polygon: function(object, stream) {
    streamPolygon(object.coordinates, stream);
  },
  MultiPolygon: function(object, stream) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) streamPolygon(coordinates[i], stream);
  },
  GeometryCollection: function(object, stream) {
    var geometries = object.geometries, i = -1, n = geometries.length;
    while (++i < n) streamGeometry(geometries[i], stream);
  }
};

function streamLine(coordinates, stream, closed) {
  var i = -1, n = coordinates.length - closed, coordinate;
  stream.lineStart();
  while (++i < n) coordinate = coordinates[i], stream.point(coordinate[0], coordinate[1], coordinate[2]);
  stream.lineEnd();
}

function streamPolygon(coordinates, stream) {
  var i = -1, n = coordinates.length;
  stream.polygonStart();
  while (++i < n) streamLine(coordinates[i], stream, 1);
  stream.polygonEnd();
}

var geoStream = function(object, stream) {
  if (object && streamObjectType.hasOwnProperty(object.type)) {
    streamObjectType[object.type](object, stream);
  } else {
    streamGeometry(object, stream);
  }
};

var areaRingSum = adder();

var areaSum = adder();
var lambda00;
var phi00;
var lambda0;
var cosPhi0;
var sinPhi0;

function spherical(cartesian) {
  return [atan2$1(cartesian[1], cartesian[0]), asin$1(cartesian[2])];
}

function cartesian(spherical) {
  var lambda = spherical[0], phi = spherical[1], cosPhi = cos$1(phi);
  return [cosPhi * cos$1(lambda), cosPhi * sin$1(lambda), sin$1(phi)];
}

function cartesianDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cartesianCross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

// TODO return a
function cartesianAddInPlace(a, b) {
  a[0] += b[0], a[1] += b[1], a[2] += b[2];
}

function cartesianScale(vector, k) {
  return [vector[0] * k, vector[1] * k, vector[2] * k];
}

// TODO return d
function cartesianNormalizeInPlace(d) {
  var l = sqrt$2(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
  d[0] /= l, d[1] /= l, d[2] /= l;
}

var lambda0$1;
var phi0;
var lambda1;
var phi1;
var lambda2;
var lambda00$1;
var phi00$1;
var p0;
var deltaSum = adder();
var ranges;
var range;

var W0;
var X0;
var Y0;
var Z0; // previous point

var compose = function(a, b) {

  function compose(x, y) {
    return x = a(x, y), b(x[0], x[1]);
  }

  if (a.invert && b.invert) compose.invert = function(x, y) {
    return x = b.invert(x, y), x && a.invert(x[0], x[1]);
  };

  return compose;
};

function rotationIdentity(lambda, phi) {
  return [lambda > pi$3 ? lambda - tau$4 : lambda < -pi$3 ? lambda + tau$4 : lambda, phi];
}

rotationIdentity.invert = rotationIdentity;

function rotateRadians(deltaLambda, deltaPhi, deltaGamma) {
  return (deltaLambda %= tau$4) ? (deltaPhi || deltaGamma ? compose(rotationLambda(deltaLambda), rotationPhiGamma(deltaPhi, deltaGamma))
    : rotationLambda(deltaLambda))
    : (deltaPhi || deltaGamma ? rotationPhiGamma(deltaPhi, deltaGamma)
    : rotationIdentity);
}

function forwardRotationLambda(deltaLambda) {
  return function(lambda, phi) {
    return lambda += deltaLambda, [lambda > pi$3 ? lambda - tau$4 : lambda < -pi$3 ? lambda + tau$4 : lambda, phi];
  };
}

function rotationLambda(deltaLambda) {
  var rotation = forwardRotationLambda(deltaLambda);
  rotation.invert = forwardRotationLambda(-deltaLambda);
  return rotation;
}

function rotationPhiGamma(deltaPhi, deltaGamma) {
  var cosDeltaPhi = cos$1(deltaPhi),
      sinDeltaPhi = sin$1(deltaPhi),
      cosDeltaGamma = cos$1(deltaGamma),
      sinDeltaGamma = sin$1(deltaGamma);

  function rotation(lambda, phi) {
    var cosPhi = cos$1(phi),
        x = cos$1(lambda) * cosPhi,
        y = sin$1(lambda) * cosPhi,
        z = sin$1(phi),
        k = z * cosDeltaPhi + x * sinDeltaPhi;
    return [
      atan2$1(y * cosDeltaGamma - k * sinDeltaGamma, x * cosDeltaPhi - z * sinDeltaPhi),
      asin$1(k * cosDeltaGamma + y * sinDeltaGamma)
    ];
  }

  rotation.invert = function(lambda, phi) {
    var cosPhi = cos$1(phi),
        x = cos$1(lambda) * cosPhi,
        y = sin$1(lambda) * cosPhi,
        z = sin$1(phi),
        k = z * cosDeltaGamma - y * sinDeltaGamma;
    return [
      atan2$1(y * cosDeltaGamma + z * sinDeltaGamma, x * cosDeltaPhi + k * sinDeltaPhi),
      asin$1(k * cosDeltaPhi - x * sinDeltaPhi)
    ];
  };

  return rotation;
}

var rotation = function(rotate) {
  rotate = rotateRadians(rotate[0] * radians, rotate[1] * radians, rotate.length > 2 ? rotate[2] * radians : 0);

  function forward(coordinates) {
    coordinates = rotate(coordinates[0] * radians, coordinates[1] * radians);
    return coordinates[0] *= degrees$1, coordinates[1] *= degrees$1, coordinates;
  }

  forward.invert = function(coordinates) {
    coordinates = rotate.invert(coordinates[0] * radians, coordinates[1] * radians);
    return coordinates[0] *= degrees$1, coordinates[1] *= degrees$1, coordinates;
  };

  return forward;
};

// Generates a circle centered at [0°, 0°], with a given radius and precision.
function circleStream(stream, radius, delta, direction, t0, t1) {
  if (!delta) return;
  var cosRadius = cos$1(radius),
      sinRadius = sin$1(radius),
      step = direction * delta;
  if (t0 == null) {
    t0 = radius + direction * tau$4;
    t1 = radius - step / 2;
  } else {
    t0 = circleRadius(cosRadius, t0);
    t1 = circleRadius(cosRadius, t1);
    if (direction > 0 ? t0 < t1 : t0 > t1) t0 += direction * tau$4;
  }
  for (var point, t = t0; direction > 0 ? t > t1 : t < t1; t -= step) {
    point = spherical([cosRadius, -sinRadius * cos$1(t), -sinRadius * sin$1(t)]);
    stream.point(point[0], point[1]);
  }
}

// Returns the signed angle of a cartesian point relative to [cosRadius, 0, 0].
function circleRadius(cosRadius, point) {
  point = cartesian(point), point[0] -= cosRadius;
  cartesianNormalizeInPlace(point);
  var radius = acos$1(-point[1]);
  return ((-point[2] < 0 ? -radius : radius) + tau$4 - epsilon$2) % tau$4;
}

var clipBuffer = function() {
  var lines = [],
      line;
  return {
    point: function(x, y) {
      line.push([x, y]);
    },
    lineStart: function() {
      lines.push(line = []);
    },
    lineEnd: noop$5,
    rejoin: function() {
      if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
    },
    result: function() {
      var result = lines;
      lines = [];
      line = null;
      return result;
    }
  };
};

var clipLine = function(a, b, x0, y0, x1, y1) {
  var ax = a[0],
      ay = a[1],
      bx = b[0],
      by = b[1],
      t0 = 0,
      t1 = 1,
      dx = bx - ax,
      dy = by - ay,
      r;

  r = x0 - ax;
  if (!dx && r > 0) return;
  r /= dx;
  if (dx < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dx > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = x1 - ax;
  if (!dx && r < 0) return;
  r /= dx;
  if (dx < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dx > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  r = y0 - ay;
  if (!dy && r > 0) return;
  r /= dy;
  if (dy < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dy > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = y1 - ay;
  if (!dy && r < 0) return;
  r /= dy;
  if (dy < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dy > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  if (t0 > 0) a[0] = ax + t0 * dx, a[1] = ay + t0 * dy;
  if (t1 < 1) b[0] = ax + t1 * dx, b[1] = ay + t1 * dy;
  return true;
};

var pointEqual = function(a, b) {
  return abs$1(a[0] - b[0]) < epsilon$2 && abs$1(a[1] - b[1]) < epsilon$2;
};

function Intersection(point, points, other, entry) {
  this.x = point;
  this.z = points;
  this.o = other; // another intersection
  this.e = entry; // is an entry?
  this.v = false; // visited
  this.n = this.p = null; // next & previous
}

// A generalized polygon clipping algorithm: given a polygon that has been cut
// into its visible line segments, and rejoins the segments by interpolating
// along the clip edge.
var clipPolygon = function(segments, compareIntersection, startInside, interpolate, stream) {
  var subject = [],
      clip = [],
      i,
      n;

  segments.forEach(function(segment) {
    if ((n = segment.length - 1) <= 0) return;
    var n, p0 = segment[0], p1 = segment[n], x;

    // If the first and last points of a segment are coincident, then treat as a
    // closed ring. TODO if all rings are closed, then the winding order of the
    // exterior ring should be checked.
    if (pointEqual(p0, p1)) {
      stream.lineStart();
      for (i = 0; i < n; ++i) stream.point((p0 = segment[i])[0], p0[1]);
      stream.lineEnd();
      return;
    }

    subject.push(x = new Intersection(p0, segment, null, true));
    clip.push(x.o = new Intersection(p0, null, x, false));
    subject.push(x = new Intersection(p1, segment, null, false));
    clip.push(x.o = new Intersection(p1, null, x, true));
  });

  if (!subject.length) return;

  clip.sort(compareIntersection);
  link$1(subject);
  link$1(clip);

  for (i = 0, n = clip.length; i < n; ++i) {
    clip[i].e = startInside = !startInside;
  }

  var start = subject[0],
      points,
      point;

  while (1) {
    // Find first unvisited intersection.
    var current = start,
        isSubject = true;
    while (current.v) if ((current = current.n) === start) return;
    points = current.z;
    stream.lineStart();
    do {
      current.v = current.o.v = true;
      if (current.e) {
        if (isSubject) {
          for (i = 0, n = points.length; i < n; ++i) stream.point((point = points[i])[0], point[1]);
        } else {
          interpolate(current.x, current.n.x, 1, stream);
        }
        current = current.n;
      } else {
        if (isSubject) {
          points = current.p.z;
          for (i = points.length - 1; i >= 0; --i) stream.point((point = points[i])[0], point[1]);
        } else {
          interpolate(current.x, current.p.x, -1, stream);
        }
        current = current.p;
      }
      current = current.o;
      points = current.z;
      isSubject = !isSubject;
    } while (!current.v);
    stream.lineEnd();
  }
};

function link$1(array) {
  if (!(n = array.length)) return;
  var n,
      i = 0,
      a = array[0],
      b;
  while (++i < n) {
    a.n = b = array[i];
    b.p = a;
    a = b;
  }
  a.n = b = array[0];
  b.p = a;
}

var clipMax = 1e9;
var clipMin = -clipMax;

// TODO Use d3-polygon’s polygonContains here for the ring check?
// TODO Eliminate duplicate buffering in clipBuffer and polygon.push?

function clipExtent(x0, y0, x1, y1) {

  function visible(x, y) {
    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
  }

  function interpolate(from, to, direction, stream) {
    var a = 0, a1 = 0;
    if (from == null
        || (a = corner(from, direction)) !== (a1 = corner(to, direction))
        || comparePoint(from, to) < 0 ^ direction > 0) {
      do stream.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
      while ((a = (a + direction + 4) % 4) !== a1);
    } else {
      stream.point(to[0], to[1]);
    }
  }

  function corner(p, direction) {
    return abs$1(p[0] - x0) < epsilon$2 ? direction > 0 ? 0 : 3
        : abs$1(p[0] - x1) < epsilon$2 ? direction > 0 ? 2 : 1
        : abs$1(p[1] - y0) < epsilon$2 ? direction > 0 ? 1 : 0
        : direction > 0 ? 3 : 2; // abs(p[1] - y1) < epsilon
  }

  function compareIntersection(a, b) {
    return comparePoint(a.x, b.x);
  }

  function comparePoint(a, b) {
    var ca = corner(a, 1),
        cb = corner(b, 1);
    return ca !== cb ? ca - cb
        : ca === 0 ? b[1] - a[1]
        : ca === 1 ? a[0] - b[0]
        : ca === 2 ? a[1] - b[1]
        : b[0] - a[0];
  }

  return function(stream) {
    var activeStream = stream,
        bufferStream = clipBuffer(),
        segments,
        polygon,
        ring,
        x__, y__, v__, // first point
        x_, y_, v_, // previous point
        first,
        clean;

    var clipStream = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: polygonStart,
      polygonEnd: polygonEnd
    };

    function point(x, y) {
      if (visible(x, y)) activeStream.point(x, y);
    }

    function polygonInside() {
      var winding = 0;

      for (var i = 0, n = polygon.length; i < n; ++i) {
        for (var ring = polygon[i], j = 1, m = ring.length, point = ring[0], a0, a1, b0 = point[0], b1 = point[1]; j < m; ++j) {
          a0 = b0, a1 = b1, point = ring[j], b0 = point[0], b1 = point[1];
          if (a1 <= y1) { if (b1 > y1 && (b0 - a0) * (y1 - a1) > (b1 - a1) * (x0 - a0)) ++winding; }
          else { if (b1 <= y1 && (b0 - a0) * (y1 - a1) < (b1 - a1) * (x0 - a0)) --winding; }
        }
      }

      return winding;
    }

    // Buffer geometry within a polygon and then clip it en masse.
    function polygonStart() {
      activeStream = bufferStream, segments = [], polygon = [], clean = true;
    }

    function polygonEnd() {
      var startInside = polygonInside(),
          cleanInside = clean && startInside,
          visible = (segments = merge(segments)).length;
      if (cleanInside || visible) {
        stream.polygonStart();
        if (cleanInside) {
          stream.lineStart();
          interpolate(null, null, 1, stream);
          stream.lineEnd();
        }
        if (visible) {
          clipPolygon(segments, compareIntersection, startInside, interpolate, stream);
        }
        stream.polygonEnd();
      }
      activeStream = stream, segments = polygon = ring = null;
    }

    function lineStart() {
      clipStream.point = linePoint;
      if (polygon) polygon.push(ring = []);
      first = true;
      v_ = false;
      x_ = y_ = NaN;
    }

    // TODO rather than special-case polygons, simply handle them separately.
    // Ideally, coincident intersection points should be jittered to avoid
    // clipping issues.
    function lineEnd() {
      if (segments) {
        linePoint(x__, y__);
        if (v__ && v_) bufferStream.rejoin();
        segments.push(bufferStream.result());
      }
      clipStream.point = point;
      if (v_) activeStream.lineEnd();
    }

    function linePoint(x, y) {
      var v = visible(x, y);
      if (polygon) ring.push([x, y]);
      if (first) {
        x__ = x, y__ = y, v__ = v;
        first = false;
        if (v) {
          activeStream.lineStart();
          activeStream.point(x, y);
        }
      } else {
        if (v && v_) activeStream.point(x, y);
        else {
          var a = [x_ = Math.max(clipMin, Math.min(clipMax, x_)), y_ = Math.max(clipMin, Math.min(clipMax, y_))],
              b = [x = Math.max(clipMin, Math.min(clipMax, x)), y = Math.max(clipMin, Math.min(clipMax, y))];
          if (clipLine(a, b, x0, y0, x1, y1)) {
            if (!v_) {
              activeStream.lineStart();
              activeStream.point(a[0], a[1]);
            }
            activeStream.point(b[0], b[1]);
            if (!v) activeStream.lineEnd();
            clean = false;
          } else if (v) {
            activeStream.lineStart();
            activeStream.point(x, y);
            clean = false;
          }
        }
      }
      x_ = x, y_ = y, v_ = v;
    }

    return clipStream;
  };
}

var sum$2 = adder();

var polygonContains = function(polygon, point) {
  var lambda = point[0],
      phi = point[1],
      normal = [sin$1(lambda), -cos$1(lambda), 0],
      angle = 0,
      winding = 0;

  sum$2.reset();

  for (var i = 0, n = polygon.length; i < n; ++i) {
    if (!(m = (ring = polygon[i]).length)) continue;
    var ring,
        m,
        point0 = ring[m - 1],
        lambda0 = point0[0],
        phi0 = point0[1] / 2 + quarterPi,
        sinPhi0 = sin$1(phi0),
        cosPhi0 = cos$1(phi0);

    for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
      var point1 = ring[j],
          lambda1 = point1[0],
          phi1 = point1[1] / 2 + quarterPi,
          sinPhi1 = sin$1(phi1),
          cosPhi1 = cos$1(phi1),
          delta = lambda1 - lambda0,
          sign = delta >= 0 ? 1 : -1,
          absDelta = sign * delta,
          antimeridian = absDelta > pi$3,
          k = sinPhi0 * sinPhi1;

      sum$2.add(atan2$1(k * sign * sin$1(absDelta), cosPhi0 * cosPhi1 + k * cos$1(absDelta)));
      angle += antimeridian ? delta + sign * tau$4 : delta;

      // Are the longitudes either side of the point’s meridian (lambda),
      // and are the latitudes smaller than the parallel (phi)?
      if (antimeridian ^ lambda0 >= lambda ^ lambda1 >= lambda) {
        var arc = cartesianCross(cartesian(point0), cartesian(point1));
        cartesianNormalizeInPlace(arc);
        var intersection = cartesianCross(normal, arc);
        cartesianNormalizeInPlace(intersection);
        var phiArc = (antimeridian ^ delta >= 0 ? -1 : 1) * asin$1(intersection[2]);
        if (phi > phiArc || phi === phiArc && (arc[0] || arc[1])) {
          winding += antimeridian ^ delta >= 0 ? 1 : -1;
        }
      }
    }
  }

  // First, determine whether the South pole is inside or outside:
  //
  // It is inside if:
  // * the polygon winds around it in a clockwise direction.
  // * the polygon does not (cumulatively) wind around it, but has a negative
  //   (counter-clockwise) area.
  //
  // Second, count the (signed) number of times a segment crosses a lambda
  // from the point to the South pole.  If it is zero, then the point is the
  // same side as the South pole.

  return (angle < -epsilon$2 || angle < epsilon$2 && sum$2 < -epsilon$2) ^ (winding & 1);
};

var lengthSum = adder();
var lambda0$2;
var sinPhi0$1;
var cosPhi0$1;

var lengthStream = {
  sphere: noop$5,
  point: noop$5,
  lineStart: lengthLineStart,
  lineEnd: noop$5,
  polygonStart: noop$5,
  polygonEnd: noop$5
};

function lengthLineStart() {
  lengthStream.point = lengthPointFirst;
  lengthStream.lineEnd = lengthLineEnd;
}

function lengthLineEnd() {
  lengthStream.point = lengthStream.lineEnd = noop$5;
}

function lengthPointFirst(lambda, phi) {
  lambda *= radians, phi *= radians;
  lambda0$2 = lambda, sinPhi0$1 = sin$1(phi), cosPhi0$1 = cos$1(phi);
  lengthStream.point = lengthPoint;
}

function lengthPoint(lambda, phi) {
  lambda *= radians, phi *= radians;
  var sinPhi = sin$1(phi),
      cosPhi = cos$1(phi),
      delta = abs$1(lambda - lambda0$2),
      cosDelta = cos$1(delta),
      sinDelta = sin$1(delta),
      x = cosPhi * sinDelta,
      y = cosPhi0$1 * sinPhi - sinPhi0$1 * cosPhi * cosDelta,
      z = sinPhi0$1 * sinPhi + cosPhi0$1 * cosPhi * cosDelta;
  lengthSum.add(atan2$1(sqrt$2(x * x + y * y), z));
  lambda0$2 = lambda, sinPhi0$1 = sinPhi, cosPhi0$1 = cosPhi;
}

var length$1 = function(object) {
  lengthSum.reset();
  geoStream(object, lengthStream);
  return +lengthSum;
};

var coordinates = [null, null];
var object$3 = {type: "LineString", coordinates: coordinates};

var distance = function(a, b) {
  coordinates[0] = a;
  coordinates[1] = b;
  return length$1(object$3);
};

var containsGeometryType = {
  Sphere: function() {
    return true;
  },
  Point: function(object, point) {
    return containsPoint(object.coordinates, point);
  },
  MultiPoint: function(object, point) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) if (containsPoint(coordinates[i], point)) return true;
    return false;
  },
  LineString: function(object, point) {
    return containsLine(object.coordinates, point);
  },
  MultiLineString: function(object, point) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) if (containsLine(coordinates[i], point)) return true;
    return false;
  },
  Polygon: function(object, point) {
    return containsPolygon(object.coordinates, point);
  },
  MultiPolygon: function(object, point) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) if (containsPolygon(coordinates[i], point)) return true;
    return false;
  },
  GeometryCollection: function(object, point) {
    var geometries = object.geometries, i = -1, n = geometries.length;
    while (++i < n) if (containsGeometry(geometries[i], point)) return true;
    return false;
  }
};

function containsGeometry(geometry, point) {
  return geometry && containsGeometryType.hasOwnProperty(geometry.type)
      ? containsGeometryType[geometry.type](geometry, point)
      : false;
}

function containsPoint(coordinates, point) {
  return distance(coordinates, point) === 0;
}

function containsLine(coordinates, point) {
  var ab = distance(coordinates[0], coordinates[1]),
      ao = distance(coordinates[0], point),
      ob = distance(point, coordinates[1]);
  return ao + ob <= ab + epsilon$2;
}

function containsPolygon(coordinates, point) {
  return !!polygonContains(coordinates.map(ringRadians), pointRadians(point));
}

function ringRadians(ring) {
  return ring = ring.map(pointRadians), ring.pop(), ring;
}

function pointRadians(point) {
  return [point[0] * radians, point[1] * radians];
}

function graticuleX(y0, y1, dy) {
  var y = sequence(y0, y1 - epsilon$2, dy).concat(y1);
  return function(x) { return y.map(function(y) { return [x, y]; }); };
}

function graticuleY(x0, x1, dx) {
  var x = sequence(x0, x1 - epsilon$2, dx).concat(x1);
  return function(y) { return x.map(function(x) { return [x, y]; }); };
}

function graticule() {
  var x1, x0, X1, X0,
      y1, y0, Y1, Y0,
      dx = 10, dy = dx, DX = 90, DY = 360,
      x, y, X, Y,
      precision = 2.5;

  function graticule() {
    return {type: "MultiLineString", coordinates: lines()};
  }

  function lines() {
    return sequence(ceil(X0 / DX) * DX, X1, DX).map(X)
        .concat(sequence(ceil(Y0 / DY) * DY, Y1, DY).map(Y))
        .concat(sequence(ceil(x0 / dx) * dx, x1, dx).filter(function(x) { return abs$1(x % DX) > epsilon$2; }).map(x))
        .concat(sequence(ceil(y0 / dy) * dy, y1, dy).filter(function(y) { return abs$1(y % DY) > epsilon$2; }).map(y));
  }

  graticule.lines = function() {
    return lines().map(function(coordinates) { return {type: "LineString", coordinates: coordinates}; });
  };

  graticule.outline = function() {
    return {
      type: "Polygon",
      coordinates: [
        X(X0).concat(
        Y(Y1).slice(1),
        X(X1).reverse().slice(1),
        Y(Y0).reverse().slice(1))
      ]
    };
  };

  graticule.extent = function(_) {
    if (!arguments.length) return graticule.extentMinor();
    return graticule.extentMajor(_).extentMinor(_);
  };

  graticule.extentMajor = function(_) {
    if (!arguments.length) return [[X0, Y0], [X1, Y1]];
    X0 = +_[0][0], X1 = +_[1][0];
    Y0 = +_[0][1], Y1 = +_[1][1];
    if (X0 > X1) _ = X0, X0 = X1, X1 = _;
    if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;
    return graticule.precision(precision);
  };

  graticule.extentMinor = function(_) {
    if (!arguments.length) return [[x0, y0], [x1, y1]];
    x0 = +_[0][0], x1 = +_[1][0];
    y0 = +_[0][1], y1 = +_[1][1];
    if (x0 > x1) _ = x0, x0 = x1, x1 = _;
    if (y0 > y1) _ = y0, y0 = y1, y1 = _;
    return graticule.precision(precision);
  };

  graticule.step = function(_) {
    if (!arguments.length) return graticule.stepMinor();
    return graticule.stepMajor(_).stepMinor(_);
  };

  graticule.stepMajor = function(_) {
    if (!arguments.length) return [DX, DY];
    DX = +_[0], DY = +_[1];
    return graticule;
  };

  graticule.stepMinor = function(_) {
    if (!arguments.length) return [dx, dy];
    dx = +_[0], dy = +_[1];
    return graticule;
  };

  graticule.precision = function(_) {
    if (!arguments.length) return precision;
    precision = +_;
    x = graticuleX(y0, y1, 90);
    y = graticuleY(x0, x1, precision);
    X = graticuleX(Y0, Y1, 90);
    Y = graticuleY(X0, X1, precision);
    return graticule;
  };

  return graticule
      .extentMajor([[-180, -90 + epsilon$2], [180, 90 - epsilon$2]])
      .extentMinor([[-180, -80 - epsilon$2], [180, 80 + epsilon$2]]);
}

var identity$6 = function(x) {
  return x;
};

var areaSum$1 = adder();
var areaRingSum$1 = adder();
var x00;
var y00;
var x0$1;
var y0$1;

var areaStream$1 = {
  point: noop$5,
  lineStart: noop$5,
  lineEnd: noop$5,
  polygonStart: function() {
    areaStream$1.lineStart = areaRingStart$1;
    areaStream$1.lineEnd = areaRingEnd$1;
  },
  polygonEnd: function() {
    areaStream$1.lineStart = areaStream$1.lineEnd = areaStream$1.point = noop$5;
    areaSum$1.add(abs$1(areaRingSum$1));
    areaRingSum$1.reset();
  },
  result: function() {
    var area = areaSum$1 / 2;
    areaSum$1.reset();
    return area;
  }
};

function areaRingStart$1() {
  areaStream$1.point = areaPointFirst$1;
}

function areaPointFirst$1(x, y) {
  areaStream$1.point = areaPoint$1;
  x00 = x0$1 = x, y00 = y0$1 = y;
}

function areaPoint$1(x, y) {
  areaRingSum$1.add(y0$1 * x - x0$1 * y);
  x0$1 = x, y0$1 = y;
}

function areaRingEnd$1() {
  areaPoint$1(x00, y00);
}

var x0$2 = Infinity;
var y0$2 = x0$2;
var x1 = -x0$2;
var y1 = x1;

var boundsStream$1 = {
  point: boundsPoint$1,
  lineStart: noop$5,
  lineEnd: noop$5,
  polygonStart: noop$5,
  polygonEnd: noop$5,
  result: function() {
    var bounds = [[x0$2, y0$2], [x1, y1]];
    x1 = y1 = -(y0$2 = x0$2 = Infinity);
    return bounds;
  }
};

function boundsPoint$1(x, y) {
  if (x < x0$2) x0$2 = x;
  if (x > x1) x1 = x;
  if (y < y0$2) y0$2 = y;
  if (y > y1) y1 = y;
}

// TODO Enforce positive area for exterior, negative area for interior?

var X0$1 = 0;
var Y0$1 = 0;
var Z0$1 = 0;
var X1$1 = 0;
var Y1$1 = 0;
var Z1$1 = 0;
var X2$1 = 0;
var Y2$1 = 0;
var Z2$1 = 0;
var x00$1;
var y00$1;
var x0$3;
var y0$3;

var centroidStream$1 = {
  point: centroidPoint$1,
  lineStart: centroidLineStart$1,
  lineEnd: centroidLineEnd$1,
  polygonStart: function() {
    centroidStream$1.lineStart = centroidRingStart$1;
    centroidStream$1.lineEnd = centroidRingEnd$1;
  },
  polygonEnd: function() {
    centroidStream$1.point = centroidPoint$1;
    centroidStream$1.lineStart = centroidLineStart$1;
    centroidStream$1.lineEnd = centroidLineEnd$1;
  },
  result: function() {
    var centroid = Z2$1 ? [X2$1 / Z2$1, Y2$1 / Z2$1]
        : Z1$1 ? [X1$1 / Z1$1, Y1$1 / Z1$1]
        : Z0$1 ? [X0$1 / Z0$1, Y0$1 / Z0$1]
        : [NaN, NaN];
    X0$1 = Y0$1 = Z0$1 =
    X1$1 = Y1$1 = Z1$1 =
    X2$1 = Y2$1 = Z2$1 = 0;
    return centroid;
  }
};

function centroidPoint$1(x, y) {
  X0$1 += x;
  Y0$1 += y;
  ++Z0$1;
}

function centroidLineStart$1() {
  centroidStream$1.point = centroidPointFirstLine;
}

function centroidPointFirstLine(x, y) {
  centroidStream$1.point = centroidPointLine;
  centroidPoint$1(x0$3 = x, y0$3 = y);
}

function centroidPointLine(x, y) {
  var dx = x - x0$3, dy = y - y0$3, z = sqrt$2(dx * dx + dy * dy);
  X1$1 += z * (x0$3 + x) / 2;
  Y1$1 += z * (y0$3 + y) / 2;
  Z1$1 += z;
  centroidPoint$1(x0$3 = x, y0$3 = y);
}

function centroidLineEnd$1() {
  centroidStream$1.point = centroidPoint$1;
}

function centroidRingStart$1() {
  centroidStream$1.point = centroidPointFirstRing;
}

function centroidRingEnd$1() {
  centroidPointRing(x00$1, y00$1);
}

function centroidPointFirstRing(x, y) {
  centroidStream$1.point = centroidPointRing;
  centroidPoint$1(x00$1 = x0$3 = x, y00$1 = y0$3 = y);
}

function centroidPointRing(x, y) {
  var dx = x - x0$3,
      dy = y - y0$3,
      z = sqrt$2(dx * dx + dy * dy);

  X1$1 += z * (x0$3 + x) / 2;
  Y1$1 += z * (y0$3 + y) / 2;
  Z1$1 += z;

  z = y0$3 * x - x0$3 * y;
  X2$1 += z * (x0$3 + x);
  Y2$1 += z * (y0$3 + y);
  Z2$1 += z * 3;
  centroidPoint$1(x0$3 = x, y0$3 = y);
}

function PathContext(context) {
  this._context = context;
}

PathContext.prototype = {
  _radius: 4.5,
  pointRadius: function(_) {
    return this._radius = _, this;
  },
  polygonStart: function() {
    this._line = 0;
  },
  polygonEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line === 0) this._context.closePath();
    this._point = NaN;
  },
  point: function(x, y) {
    switch (this._point) {
      case 0: {
        this._context.moveTo(x, y);
        this._point = 1;
        break;
      }
      case 1: {
        this._context.lineTo(x, y);
        break;
      }
      default: {
        this._context.moveTo(x + this._radius, y);
        this._context.arc(x, y, this._radius, 0, tau$4);
        break;
      }
    }
  },
  result: noop$5
};

var lengthSum$1 = adder();
var lengthRing;
var x00$2;
var y00$2;
var x0$4;
var y0$4;

var lengthStream$1 = {
  point: noop$5,
  lineStart: function() {
    lengthStream$1.point = lengthPointFirst$1;
  },
  lineEnd: function() {
    if (lengthRing) lengthPoint$1(x00$2, y00$2);
    lengthStream$1.point = noop$5;
  },
  polygonStart: function() {
    lengthRing = true;
  },
  polygonEnd: function() {
    lengthRing = null;
  },
  result: function() {
    var length = +lengthSum$1;
    lengthSum$1.reset();
    return length;
  }
};

function lengthPointFirst$1(x, y) {
  lengthStream$1.point = lengthPoint$1;
  x00$2 = x0$4 = x, y00$2 = y0$4 = y;
}

function lengthPoint$1(x, y) {
  x0$4 -= x, y0$4 -= y;
  lengthSum$1.add(sqrt$2(x0$4 * x0$4 + y0$4 * y0$4));
  x0$4 = x, y0$4 = y;
}

function PathString() {
  this._string = [];
}

PathString.prototype = {
  _radius: 4.5,
  _circle: circle$2(4.5),
  pointRadius: function(_) {
    if ((_ = +_) !== this._radius) this._radius = _, this._circle = null;
    return this;
  },
  polygonStart: function() {
    this._line = 0;
  },
  polygonEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line === 0) this._string.push("Z");
    this._point = NaN;
  },
  point: function(x, y) {
    switch (this._point) {
      case 0: {
        this._string.push("M", x, ",", y);
        this._point = 1;
        break;
      }
      case 1: {
        this._string.push("L", x, ",", y);
        break;
      }
      default: {
        if (this._circle == null) this._circle = circle$2(this._radius);
        this._string.push("M", x, ",", y, this._circle);
        break;
      }
    }
  },
  result: function() {
    if (this._string.length) {
      var result = this._string.join("");
      this._string = [];
      return result;
    } else {
      return null;
    }
  }
};

function circle$2(radius) {
  return "m0," + radius
      + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius
      + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius
      + "z";
}

var geoPath = function(projection, context) {
  var pointRadius = 4.5,
      projectionStream,
      contextStream;

  function path(object) {
    if (object) {
      if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
      geoStream(object, projectionStream(contextStream));
    }
    return contextStream.result();
  }

  path.area = function(object) {
    geoStream(object, projectionStream(areaStream$1));
    return areaStream$1.result();
  };

  path.measure = function(object) {
    geoStream(object, projectionStream(lengthStream$1));
    return lengthStream$1.result();
  };

  path.bounds = function(object) {
    geoStream(object, projectionStream(boundsStream$1));
    return boundsStream$1.result();
  };

  path.centroid = function(object) {
    geoStream(object, projectionStream(centroidStream$1));
    return centroidStream$1.result();
  };

  path.projection = function(_) {
    return arguments.length ? (projectionStream = _ == null ? (projection = null, identity$6) : (projection = _).stream, path) : projection;
  };

  path.context = function(_) {
    if (!arguments.length) return context;
    contextStream = _ == null ? (context = null, new PathString) : new PathContext(context = _);
    if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
    return path;
  };

  path.pointRadius = function(_) {
    if (!arguments.length) return pointRadius;
    pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
    return path;
  };

  return path.projection(projection).context(context);
};

var clip$2 = function(pointVisible, clipLine, interpolate, start) {
  return function(rotate, sink) {
    var line = clipLine(sink),
        rotatedStart = rotate.invert(start[0], start[1]),
        ringBuffer = clipBuffer(),
        ringSink = clipLine(ringBuffer),
        polygonStarted = false,
        polygon,
        segments,
        ring;

    var clip = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        clip.point = pointRing;
        clip.lineStart = ringStart;
        clip.lineEnd = ringEnd;
        segments = [];
        polygon = [];
      },
      polygonEnd: function() {
        clip.point = point;
        clip.lineStart = lineStart;
        clip.lineEnd = lineEnd;
        segments = merge(segments);
        var startInside = polygonContains(polygon, rotatedStart);
        if (segments.length) {
          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
          clipPolygon(segments, compareIntersection, startInside, interpolate, sink);
        } else if (startInside) {
          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
          sink.lineStart();
          interpolate(null, null, 1, sink);
          sink.lineEnd();
        }
        if (polygonStarted) sink.polygonEnd(), polygonStarted = false;
        segments = polygon = null;
      },
      sphere: function() {
        sink.polygonStart();
        sink.lineStart();
        interpolate(null, null, 1, sink);
        sink.lineEnd();
        sink.polygonEnd();
      }
    };

    function point(lambda, phi) {
      var point = rotate(lambda, phi);
      if (pointVisible(lambda = point[0], phi = point[1])) sink.point(lambda, phi);
    }

    function pointLine(lambda, phi) {
      var point = rotate(lambda, phi);
      line.point(point[0], point[1]);
    }

    function lineStart() {
      clip.point = pointLine;
      line.lineStart();
    }

    function lineEnd() {
      clip.point = point;
      line.lineEnd();
    }

    function pointRing(lambda, phi) {
      ring.push([lambda, phi]);
      var point = rotate(lambda, phi);
      ringSink.point(point[0], point[1]);
    }

    function ringStart() {
      ringSink.lineStart();
      ring = [];
    }

    function ringEnd() {
      pointRing(ring[0][0], ring[0][1]);
      ringSink.lineEnd();

      var clean = ringSink.clean(),
          ringSegments = ringBuffer.result(),
          i, n = ringSegments.length, m,
          segment,
          point;

      ring.pop();
      polygon.push(ring);
      ring = null;

      if (!n) return;

      // No intersections.
      if (clean & 1) {
        segment = ringSegments[0];
        if ((m = segment.length - 1) > 0) {
          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
          sink.lineStart();
          for (i = 0; i < m; ++i) sink.point((point = segment[i])[0], point[1]);
          sink.lineEnd();
        }
        return;
      }

      // Rejoin connected segments.
      // TODO reuse ringBuffer.rejoin()?
      if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));

      segments.push(ringSegments.filter(validSegment));
    }

    return clip;
  };
};

function validSegment(segment) {
  return segment.length > 1;
}

// Intersections are sorted along the clip edge. For both antimeridian cutting
// and circle clipping, the same comparison is used.
function compareIntersection(a, b) {
  return ((a = a.x)[0] < 0 ? a[1] - halfPi$2 - epsilon$2 : halfPi$2 - a[1])
       - ((b = b.x)[0] < 0 ? b[1] - halfPi$2 - epsilon$2 : halfPi$2 - b[1]);
}

var clipAntimeridian = clip$2(
  function() { return true; },
  clipAntimeridianLine,
  clipAntimeridianInterpolate,
  [-pi$3, -halfPi$2]
);

// Takes a line and cuts into visible segments. Return values: 0 - there were
// intersections or the line was empty; 1 - no intersections; 2 - there were
// intersections, and the first and last segments should be rejoined.
function clipAntimeridianLine(stream) {
  var lambda0 = NaN,
      phi0 = NaN,
      sign0 = NaN,
      clean; // no intersections

  return {
    lineStart: function() {
      stream.lineStart();
      clean = 1;
    },
    point: function(lambda1, phi1) {
      var sign1 = lambda1 > 0 ? pi$3 : -pi$3,
          delta = abs$1(lambda1 - lambda0);
      if (abs$1(delta - pi$3) < epsilon$2) { // line crosses a pole
        stream.point(lambda0, phi0 = (phi0 + phi1) / 2 > 0 ? halfPi$2 : -halfPi$2);
        stream.point(sign0, phi0);
        stream.lineEnd();
        stream.lineStart();
        stream.point(sign1, phi0);
        stream.point(lambda1, phi0);
        clean = 0;
      } else if (sign0 !== sign1 && delta >= pi$3) { // line crosses antimeridian
        if (abs$1(lambda0 - sign0) < epsilon$2) lambda0 -= sign0 * epsilon$2; // handle degeneracies
        if (abs$1(lambda1 - sign1) < epsilon$2) lambda1 -= sign1 * epsilon$2;
        phi0 = clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1);
        stream.point(sign0, phi0);
        stream.lineEnd();
        stream.lineStart();
        stream.point(sign1, phi0);
        clean = 0;
      }
      stream.point(lambda0 = lambda1, phi0 = phi1);
      sign0 = sign1;
    },
    lineEnd: function() {
      stream.lineEnd();
      lambda0 = phi0 = NaN;
    },
    clean: function() {
      return 2 - clean; // if intersections, rejoin first and last segments
    }
  };
}

function clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1) {
  var cosPhi0,
      cosPhi1,
      sinLambda0Lambda1 = sin$1(lambda0 - lambda1);
  return abs$1(sinLambda0Lambda1) > epsilon$2
      ? atan((sin$1(phi0) * (cosPhi1 = cos$1(phi1)) * sin$1(lambda1)
          - sin$1(phi1) * (cosPhi0 = cos$1(phi0)) * sin$1(lambda0))
          / (cosPhi0 * cosPhi1 * sinLambda0Lambda1))
      : (phi0 + phi1) / 2;
}

function clipAntimeridianInterpolate(from, to, direction, stream) {
  var phi;
  if (from == null) {
    phi = direction * halfPi$2;
    stream.point(-pi$3, phi);
    stream.point(0, phi);
    stream.point(pi$3, phi);
    stream.point(pi$3, 0);
    stream.point(pi$3, -phi);
    stream.point(0, -phi);
    stream.point(-pi$3, -phi);
    stream.point(-pi$3, 0);
    stream.point(-pi$3, phi);
  } else if (abs$1(from[0] - to[0]) > epsilon$2) {
    var lambda = from[0] < to[0] ? pi$3 : -pi$3;
    phi = direction * lambda / 2;
    stream.point(-lambda, phi);
    stream.point(0, phi);
    stream.point(lambda, phi);
  } else {
    stream.point(to[0], to[1]);
  }
}

var clipCircle = function(radius, delta) {
  var cr = cos$1(radius),
      smallRadius = cr > 0,
      notHemisphere = abs$1(cr) > epsilon$2; // TODO optimise for this common case

  function interpolate(from, to, direction, stream) {
    circleStream(stream, radius, delta, direction, from, to);
  }

  function visible(lambda, phi) {
    return cos$1(lambda) * cos$1(phi) > cr;
  }

  // Takes a line and cuts into visible segments. Return values used for polygon
  // clipping: 0 - there were intersections or the line was empty; 1 - no
  // intersections 2 - there were intersections, and the first and last segments
  // should be rejoined.
  function clipLine(stream) {
    var point0, // previous point
        c0, // code for previous point
        v0, // visibility of previous point
        v00, // visibility of first point
        clean; // no intersections
    return {
      lineStart: function() {
        v00 = v0 = false;
        clean = 1;
      },
      point: function(lambda, phi) {
        var point1 = [lambda, phi],
            point2,
            v = visible(lambda, phi),
            c = smallRadius
              ? v ? 0 : code(lambda, phi)
              : v ? code(lambda + (lambda < 0 ? pi$3 : -pi$3), phi) : 0;
        if (!point0 && (v00 = v0 = v)) stream.lineStart();
        // Handle degeneracies.
        // TODO ignore if not clipping polygons.
        if (v !== v0) {
          point2 = intersect(point0, point1);
          if (!point2 || pointEqual(point0, point2) || pointEqual(point1, point2)) {
            point1[0] += epsilon$2;
            point1[1] += epsilon$2;
            v = visible(point1[0], point1[1]);
          }
        }
        if (v !== v0) {
          clean = 0;
          if (v) {
            // outside going in
            stream.lineStart();
            point2 = intersect(point1, point0);
            stream.point(point2[0], point2[1]);
          } else {
            // inside going out
            point2 = intersect(point0, point1);
            stream.point(point2[0], point2[1]);
            stream.lineEnd();
          }
          point0 = point2;
        } else if (notHemisphere && point0 && smallRadius ^ v) {
          var t;
          // If the codes for two points are different, or are both zero,
          // and there this segment intersects with the small circle.
          if (!(c & c0) && (t = intersect(point1, point0, true))) {
            clean = 0;
            if (smallRadius) {
              stream.lineStart();
              stream.point(t[0][0], t[0][1]);
              stream.point(t[1][0], t[1][1]);
              stream.lineEnd();
            } else {
              stream.point(t[1][0], t[1][1]);
              stream.lineEnd();
              stream.lineStart();
              stream.point(t[0][0], t[0][1]);
            }
          }
        }
        if (v && (!point0 || !pointEqual(point0, point1))) {
          stream.point(point1[0], point1[1]);
        }
        point0 = point1, v0 = v, c0 = c;
      },
      lineEnd: function() {
        if (v0) stream.lineEnd();
        point0 = null;
      },
      // Rejoin first and last segments if there were intersections and the first
      // and last points were visible.
      clean: function() {
        return clean | ((v00 && v0) << 1);
      }
    };
  }

  // Intersects the great circle between a and b with the clip circle.
  function intersect(a, b, two) {
    var pa = cartesian(a),
        pb = cartesian(b);

    // We have two planes, n1.p = d1 and n2.p = d2.
    // Find intersection line p(t) = c1 n1 + c2 n2 + t (n1 ⨯ n2).
    var n1 = [1, 0, 0], // normal
        n2 = cartesianCross(pa, pb),
        n2n2 = cartesianDot(n2, n2),
        n1n2 = n2[0], // cartesianDot(n1, n2),
        determinant = n2n2 - n1n2 * n1n2;

    // Two polar points.
    if (!determinant) return !two && a;

    var c1 =  cr * n2n2 / determinant,
        c2 = -cr * n1n2 / determinant,
        n1xn2 = cartesianCross(n1, n2),
        A = cartesianScale(n1, c1),
        B = cartesianScale(n2, c2);
    cartesianAddInPlace(A, B);

    // Solve |p(t)|^2 = 1.
    var u = n1xn2,
        w = cartesianDot(A, u),
        uu = cartesianDot(u, u),
        t2 = w * w - uu * (cartesianDot(A, A) - 1);

    if (t2 < 0) return;

    var t = sqrt$2(t2),
        q = cartesianScale(u, (-w - t) / uu);
    cartesianAddInPlace(q, A);
    q = spherical(q);

    if (!two) return q;

    // Two intersection points.
    var lambda0 = a[0],
        lambda1 = b[0],
        phi0 = a[1],
        phi1 = b[1],
        z;

    if (lambda1 < lambda0) z = lambda0, lambda0 = lambda1, lambda1 = z;

    var delta = lambda1 - lambda0,
        polar = abs$1(delta - pi$3) < epsilon$2,
        meridian = polar || delta < epsilon$2;

    if (!polar && phi1 < phi0) z = phi0, phi0 = phi1, phi1 = z;

    // Check that the first point is between a and b.
    if (meridian
        ? polar
          ? phi0 + phi1 > 0 ^ q[1] < (abs$1(q[0] - lambda0) < epsilon$2 ? phi0 : phi1)
          : phi0 <= q[1] && q[1] <= phi1
        : delta > pi$3 ^ (lambda0 <= q[0] && q[0] <= lambda1)) {
      var q1 = cartesianScale(u, (-w + t) / uu);
      cartesianAddInPlace(q1, A);
      return [q, spherical(q1)];
    }
  }

  // Generates a 4-bit vector representing the location of a point relative to
  // the small circle's bounding box.
  function code(lambda, phi) {
    var r = smallRadius ? radius : pi$3 - radius,
        code = 0;
    if (lambda < -r) code |= 1; // left
    else if (lambda > r) code |= 2; // right
    if (phi < -r) code |= 4; // below
    else if (phi > r) code |= 8; // above
    return code;
  }

  return clip$2(visible, clipLine, interpolate, smallRadius ? [0, -radius] : [-pi$3, radius - pi$3]);
};

function transformer(methods) {
  return function(stream) {
    var s = new TransformStream;
    for (var key in methods) s[key] = methods[key];
    s.stream = stream;
    return s;
  };
}

function TransformStream() {}

TransformStream.prototype = {
  constructor: TransformStream,
  point: function(x, y) { this.stream.point(x, y); },
  sphere: function() { this.stream.sphere(); },
  lineStart: function() { this.stream.lineStart(); },
  lineEnd: function() { this.stream.lineEnd(); },
  polygonStart: function() { this.stream.polygonStart(); },
  polygonEnd: function() { this.stream.polygonEnd(); }
};

function fitExtent(projection, extent, object) {
  var w = extent[1][0] - extent[0][0],
      h = extent[1][1] - extent[0][1],
      clip = projection.clipExtent && projection.clipExtent();

  projection
      .scale(150)
      .translate([0, 0]);

  if (clip != null) projection.clipExtent(null);

  geoStream(object, projection.stream(boundsStream$1));

  var b = boundsStream$1.result(),
      k = Math.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1])),
      x = +extent[0][0] + (w - k * (b[1][0] + b[0][0])) / 2,
      y = +extent[0][1] + (h - k * (b[1][1] + b[0][1])) / 2;

  if (clip != null) projection.clipExtent(clip);

  return projection
      .scale(k * 150)
      .translate([x, y]);
}

function fitSize(projection, size, object) {
  return fitExtent(projection, [[0, 0], size], object);
}

var maxDepth = 16;
var cosMinDistance = cos$1(30 * radians); // cos(minimum angular distance)

var resample = function(project, delta2) {
  return +delta2 ? resample$1(project, delta2) : resampleNone(project);
};

function resampleNone(project) {
  return transformer({
    point: function(x, y) {
      x = project(x, y);
      this.stream.point(x[0], x[1]);
    }
  });
}

function resample$1(project, delta2) {

  function resampleLineTo(x0, y0, lambda0, a0, b0, c0, x1, y1, lambda1, a1, b1, c1, depth, stream) {
    var dx = x1 - x0,
        dy = y1 - y0,
        d2 = dx * dx + dy * dy;
    if (d2 > 4 * delta2 && depth--) {
      var a = a0 + a1,
          b = b0 + b1,
          c = c0 + c1,
          m = sqrt$2(a * a + b * b + c * c),
          phi2 = asin$1(c /= m),
          lambda2 = abs$1(abs$1(c) - 1) < epsilon$2 || abs$1(lambda0 - lambda1) < epsilon$2 ? (lambda0 + lambda1) / 2 : atan2$1(b, a),
          p = project(lambda2, phi2),
          x2 = p[0],
          y2 = p[1],
          dx2 = x2 - x0,
          dy2 = y2 - y0,
          dz = dy * dx2 - dx * dy2;
      if (dz * dz / d2 > delta2 // perpendicular projected distance
          || abs$1((dx * dx2 + dy * dy2) / d2 - 0.5) > 0.3 // midpoint close to an end
          || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) { // angular distance
        resampleLineTo(x0, y0, lambda0, a0, b0, c0, x2, y2, lambda2, a /= m, b /= m, c, depth, stream);
        stream.point(x2, y2);
        resampleLineTo(x2, y2, lambda2, a, b, c, x1, y1, lambda1, a1, b1, c1, depth, stream);
      }
    }
  }
  return function(stream) {
    var lambda00, x00, y00, a00, b00, c00, // first point
        lambda0, x0, y0, a0, b0, c0; // previous point

    var resampleStream = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() { stream.polygonStart(); resampleStream.lineStart = ringStart; },
      polygonEnd: function() { stream.polygonEnd(); resampleStream.lineStart = lineStart; }
    };

    function point(x, y) {
      x = project(x, y);
      stream.point(x[0], x[1]);
    }

    function lineStart() {
      x0 = NaN;
      resampleStream.point = linePoint;
      stream.lineStart();
    }

    function linePoint(lambda, phi) {
      var c = cartesian([lambda, phi]), p = project(lambda, phi);
      resampleLineTo(x0, y0, lambda0, a0, b0, c0, x0 = p[0], y0 = p[1], lambda0 = lambda, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
      stream.point(x0, y0);
    }

    function lineEnd() {
      resampleStream.point = point;
      stream.lineEnd();
    }

    function ringStart() {
      lineStart();
      resampleStream.point = ringPoint;
      resampleStream.lineEnd = ringEnd;
    }

    function ringPoint(lambda, phi) {
      linePoint(lambda00 = lambda, phi), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
      resampleStream.point = linePoint;
    }

    function ringEnd() {
      resampleLineTo(x0, y0, lambda0, a0, b0, c0, x00, y00, lambda00, a00, b00, c00, maxDepth, stream);
      resampleStream.lineEnd = lineEnd;
      lineEnd();
    }

    return resampleStream;
  };
}

var transformRadians = transformer({
  point: function(x, y) {
    this.stream.point(x * radians, y * radians);
  }
});

function projection$1(project) {
  return projectionMutator(function() { return project; })();
}

function projectionMutator(projectAt) {
  var project,
      k = 150, // scale
      x = 480, y = 250, // translate
      dx, dy, lambda = 0, phi = 0, // center
      deltaLambda = 0, deltaPhi = 0, deltaGamma = 0, rotate, projectRotate, // rotate
      theta = null, preclip = clipAntimeridian, // clip angle
      x0 = null, y0, x1, y1, postclip = identity$6, // clip extent
      delta2 = 0.5, projectResample = resample(projectTransform, delta2), // precision
      cache,
      cacheStream;

  function projection(point) {
    point = projectRotate(point[0] * radians, point[1] * radians);
    return [point[0] * k + dx, dy - point[1] * k];
  }

  function invert(point) {
    point = projectRotate.invert((point[0] - dx) / k, (dy - point[1]) / k);
    return point && [point[0] * degrees$1, point[1] * degrees$1];
  }

  function projectTransform(x, y) {
    return x = project(x, y), [x[0] * k + dx, dy - x[1] * k];
  }

  projection.stream = function(stream) {
    return cache && cacheStream === stream ? cache : cache = transformRadians(preclip(rotate, projectResample(postclip(cacheStream = stream))));
  };

  projection.clipAngle = function(_) {
    return arguments.length ? (preclip = +_ ? clipCircle(theta = _ * radians, 6 * radians) : (theta = null, clipAntimeridian), reset()) : theta * degrees$1;
  };

  projection.clipExtent = function(_) {
    return arguments.length ? (postclip = _ == null ? (x0 = y0 = x1 = y1 = null, identity$6) : clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reset()) : x0 == null ? null : [[x0, y0], [x1, y1]];
  };

  projection.scale = function(_) {
    return arguments.length ? (k = +_, recenter()) : k;
  };

  projection.translate = function(_) {
    return arguments.length ? (x = +_[0], y = +_[1], recenter()) : [x, y];
  };

  projection.center = function(_) {
    return arguments.length ? (lambda = _[0] % 360 * radians, phi = _[1] % 360 * radians, recenter()) : [lambda * degrees$1, phi * degrees$1];
  };

  projection.rotate = function(_) {
    return arguments.length ? (deltaLambda = _[0] % 360 * radians, deltaPhi = _[1] % 360 * radians, deltaGamma = _.length > 2 ? _[2] % 360 * radians : 0, recenter()) : [deltaLambda * degrees$1, deltaPhi * degrees$1, deltaGamma * degrees$1];
  };

  projection.precision = function(_) {
    return arguments.length ? (projectResample = resample(projectTransform, delta2 = _ * _), reset()) : sqrt$2(delta2);
  };

  projection.fitExtent = function(extent, object) {
    return fitExtent(projection, extent, object);
  };

  projection.fitSize = function(size, object) {
    return fitSize(projection, size, object);
  };

  function recenter() {
    projectRotate = compose(rotate = rotateRadians(deltaLambda, deltaPhi, deltaGamma), project);
    var center = project(lambda, phi);
    dx = x - center[0] * k;
    dy = y + center[1] * k;
    return reset();
  }

  function reset() {
    cache = cacheStream = null;
    return projection;
  }

  return function() {
    project = projectAt.apply(this, arguments);
    projection.invert = project.invert && invert;
    return recenter();
  };
}

function conicProjection(projectAt) {
  var phi0 = 0,
      phi1 = pi$3 / 3,
      m = projectionMutator(projectAt),
      p = m(phi0, phi1);

  p.parallels = function(_) {
    return arguments.length ? m(phi0 = _[0] * radians, phi1 = _[1] * radians) : [phi0 * degrees$1, phi1 * degrees$1];
  };

  return p;
}

function cylindricalEqualAreaRaw(phi0) {
  var cosPhi0 = cos$1(phi0);

  function forward(lambda, phi) {
    return [lambda * cosPhi0, sin$1(phi) / cosPhi0];
  }

  forward.invert = function(x, y) {
    return [x / cosPhi0, asin$1(y * cosPhi0)];
  };

  return forward;
}

function conicEqualAreaRaw(y0, y1) {
  var sy0 = sin$1(y0), n = (sy0 + sin$1(y1)) / 2;

  // Are the parallels symmetrical around the Equator?
  if (abs$1(n) < epsilon$2) return cylindricalEqualAreaRaw(y0);

  var c = 1 + sy0 * (2 * n - sy0), r0 = sqrt$2(c) / n;

  function project(x, y) {
    var r = sqrt$2(c - 2 * n * sin$1(y)) / n;
    return [r * sin$1(x *= n), r0 - r * cos$1(x)];
  }

  project.invert = function(x, y) {
    var r0y = r0 - y;
    return [atan2$1(x, abs$1(r0y)) / n * sign$1(r0y), asin$1((c - (x * x + r0y * r0y) * n * n) / (2 * n))];
  };

  return project;
}

var conicEqualArea = function() {
  return conicProjection(conicEqualAreaRaw)
      .scale(155.424)
      .center([0, 33.6442]);
};

var albers = function() {
  return conicEqualArea()
      .parallels([29.5, 45.5])
      .scale(1070)
      .translate([480, 250])
      .rotate([96, 0])
      .center([-0.6, 38.7]);
};

// The projections must have mutually exclusive clip regions on the sphere,
// as this will avoid emitting interleaving lines and polygons.
function multiplex(streams) {
  var n = streams.length;
  return {
    point: function(x, y) { var i = -1; while (++i < n) streams[i].point(x, y); },
    sphere: function() { var i = -1; while (++i < n) streams[i].sphere(); },
    lineStart: function() { var i = -1; while (++i < n) streams[i].lineStart(); },
    lineEnd: function() { var i = -1; while (++i < n) streams[i].lineEnd(); },
    polygonStart: function() { var i = -1; while (++i < n) streams[i].polygonStart(); },
    polygonEnd: function() { var i = -1; while (++i < n) streams[i].polygonEnd(); }
  };
}

// A composite projection for the United States, configured by default for
// 960×500. The projection also works quite well at 960×600 if you change the
// scale to 1285 and adjust the translate accordingly. The set of standard
// parallels for each region comes from USGS, which is published here:
// http://egsc.usgs.gov/isb/pubs/MapProjections/projections.html#albers
var geoAlbersUsa = function() {
  var cache,
      cacheStream,
      lower48 = albers(), lower48Point,
      alaska = conicEqualArea().rotate([154, 0]).center([-2, 58.5]).parallels([55, 65]), alaskaPoint, // EPSG:3338
      hawaii = conicEqualArea().rotate([157, 0]).center([-3, 19.9]).parallels([8, 18]), hawaiiPoint, // ESRI:102007
      point, pointStream = {point: function(x, y) { point = [x, y]; }};

  function albersUsa(coordinates) {
    var x = coordinates[0], y = coordinates[1];
    return point = null,
        (lower48Point.point(x, y), point)
        || (alaskaPoint.point(x, y), point)
        || (hawaiiPoint.point(x, y), point);
  }

  albersUsa.invert = function(coordinates) {
    var k = lower48.scale(),
        t = lower48.translate(),
        x = (coordinates[0] - t[0]) / k,
        y = (coordinates[1] - t[1]) / k;
    return (y >= 0.120 && y < 0.234 && x >= -0.425 && x < -0.214 ? alaska
        : y >= 0.166 && y < 0.234 && x >= -0.214 && x < -0.115 ? hawaii
        : lower48).invert(coordinates);
  };

  albersUsa.stream = function(stream) {
    return cache && cacheStream === stream ? cache : cache = multiplex([lower48.stream(cacheStream = stream), alaska.stream(stream), hawaii.stream(stream)]);
  };

  albersUsa.precision = function(_) {
    if (!arguments.length) return lower48.precision();
    lower48.precision(_), alaska.precision(_), hawaii.precision(_);
    return reset();
  };

  albersUsa.scale = function(_) {
    if (!arguments.length) return lower48.scale();
    lower48.scale(_), alaska.scale(_ * 0.35), hawaii.scale(_);
    return albersUsa.translate(lower48.translate());
  };

  albersUsa.translate = function(_) {
    if (!arguments.length) return lower48.translate();
    var k = lower48.scale(), x = +_[0], y = +_[1];

    lower48Point = lower48
        .translate(_)
        .clipExtent([[x - 0.455 * k, y - 0.238 * k], [x + 0.455 * k, y + 0.238 * k]])
        .stream(pointStream);

    alaskaPoint = alaska
        .translate([x - 0.307 * k, y + 0.201 * k])
        .clipExtent([[x - 0.425 * k + epsilon$2, y + 0.120 * k + epsilon$2], [x - 0.214 * k - epsilon$2, y + 0.234 * k - epsilon$2]])
        .stream(pointStream);

    hawaiiPoint = hawaii
        .translate([x - 0.205 * k, y + 0.212 * k])
        .clipExtent([[x - 0.214 * k + epsilon$2, y + 0.166 * k + epsilon$2], [x - 0.115 * k - epsilon$2, y + 0.234 * k - epsilon$2]])
        .stream(pointStream);

    return reset();
  };

  albersUsa.fitExtent = function(extent, object) {
    return fitExtent(albersUsa, extent, object);
  };

  albersUsa.fitSize = function(size, object) {
    return fitSize(albersUsa, size, object);
  };

  function reset() {
    cache = cacheStream = null;
    return albersUsa;
  }

  return albersUsa.scale(1070);
};

function azimuthalRaw(scale) {
  return function(x, y) {
    var cx = cos$1(x),
        cy = cos$1(y),
        k = scale(cx * cy);
    return [
      k * cy * sin$1(x),
      k * sin$1(y)
    ];
  }
}

function azimuthalInvert(angle) {
  return function(x, y) {
    var z = sqrt$2(x * x + y * y),
        c = angle(z),
        sc = sin$1(c),
        cc = cos$1(c);
    return [
      atan2$1(x * sc, z * cc),
      asin$1(z && y * sc / z)
    ];
  }
}

var azimuthalEqualAreaRaw = azimuthalRaw(function(cxcy) {
  return sqrt$2(2 / (1 + cxcy));
});

azimuthalEqualAreaRaw.invert = azimuthalInvert(function(z) {
  return 2 * asin$1(z / 2);
});

var geoAzimuthalEqualArea = function() {
  return projection$1(azimuthalEqualAreaRaw)
      .scale(124.75)
      .clipAngle(180 - 1e-3);
};

var azimuthalEquidistantRaw = azimuthalRaw(function(c) {
  return (c = acos$1(c)) && c / sin$1(c);
});

azimuthalEquidistantRaw.invert = azimuthalInvert(function(z) {
  return z;
});

var geoAzimuthalEquidistant = function() {
  return projection$1(azimuthalEquidistantRaw)
      .scale(79.4188)
      .clipAngle(180 - 1e-3);
};

function mercatorRaw(lambda, phi) {
  return [lambda, log$2(tan((halfPi$2 + phi) / 2))];
}

mercatorRaw.invert = function(x, y) {
  return [x, 2 * atan(exp(y)) - halfPi$2];
};

var geoMercator = function() {
  return mercatorProjection(mercatorRaw)
      .scale(961 / tau$4);
};

function mercatorProjection(project) {
  var m = projection$1(project),
      center = m.center,
      scale = m.scale,
      translate = m.translate,
      clipExtent = m.clipExtent,
      x0 = null, y0, x1, y1; // clip extent

  m.scale = function(_) {
    return arguments.length ? (scale(_), reclip()) : scale();
  };

  m.translate = function(_) {
    return arguments.length ? (translate(_), reclip()) : translate();
  };

  m.center = function(_) {
    return arguments.length ? (center(_), reclip()) : center();
  };

  m.clipExtent = function(_) {
    return arguments.length ? ((_ == null ? x0 = y0 = x1 = y1 = null : (x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1])), reclip()) : x0 == null ? null : [[x0, y0], [x1, y1]];
  };

  function reclip() {
    var k = pi$3 * scale(),
        t = m(rotation(m.rotate()).invert([0, 0]));
    return clipExtent(x0 == null
        ? [[t[0] - k, t[1] - k], [t[0] + k, t[1] + k]] : project === mercatorRaw
        ? [[Math.max(t[0] - k, x0), y0], [Math.min(t[0] + k, x1), y1]]
        : [[x0, Math.max(t[1] - k, y0)], [x1, Math.min(t[1] + k, y1)]]);
  }

  return reclip();
}

function tany(y) {
  return tan((halfPi$2 + y) / 2);
}

function conicConformalRaw(y0, y1) {
  var cy0 = cos$1(y0),
      n = y0 === y1 ? sin$1(y0) : log$2(cy0 / cos$1(y1)) / log$2(tany(y1) / tany(y0)),
      f = cy0 * pow$1(tany(y0), n) / n;

  if (!n) return mercatorRaw;

  function project(x, y) {
    if (f > 0) { if (y < -halfPi$2 + epsilon$2) y = -halfPi$2 + epsilon$2; }
    else { if (y > halfPi$2 - epsilon$2) y = halfPi$2 - epsilon$2; }
    var r = f / pow$1(tany(y), n);
    return [r * sin$1(n * x), f - r * cos$1(n * x)];
  }

  project.invert = function(x, y) {
    var fy = f - y, r = sign$1(n) * sqrt$2(x * x + fy * fy);
    return [atan2$1(x, abs$1(fy)) / n * sign$1(fy), 2 * atan(pow$1(f / r, 1 / n)) - halfPi$2];
  };

  return project;
}

var geoConicConformal = function() {
  return conicProjection(conicConformalRaw)
      .scale(109.5)
      .parallels([30, 30]);
};

function equirectangularRaw(lambda, phi) {
  return [lambda, phi];
}

equirectangularRaw.invert = equirectangularRaw;

var geoEquirectangular = function() {
  return projection$1(equirectangularRaw)
      .scale(152.63);
};

function conicEquidistantRaw(y0, y1) {
  var cy0 = cos$1(y0),
      n = y0 === y1 ? sin$1(y0) : (cy0 - cos$1(y1)) / (y1 - y0),
      g = cy0 / n + y0;

  if (abs$1(n) < epsilon$2) return equirectangularRaw;

  function project(x, y) {
    var gy = g - y, nx = n * x;
    return [gy * sin$1(nx), g - gy * cos$1(nx)];
  }

  project.invert = function(x, y) {
    var gy = g - y;
    return [atan2$1(x, abs$1(gy)) / n * sign$1(gy), g - sign$1(n) * sqrt$2(x * x + gy * gy)];
  };

  return project;
}

var geoConicEquidistant = function() {
  return conicProjection(conicEquidistantRaw)
      .scale(131.154)
      .center([0, 13.9389]);
};

function gnomonicRaw(x, y) {
  var cy = cos$1(y), k = cos$1(x) * cy;
  return [cy * sin$1(x) / k, sin$1(y) / k];
}

gnomonicRaw.invert = azimuthalInvert(atan);

var geoGnomonic = function() {
  return projection$1(gnomonicRaw)
      .scale(144.049)
      .clipAngle(60);
};

function orthographicRaw(x, y) {
  return [cos$1(y) * sin$1(x), sin$1(y)];
}

orthographicRaw.invert = azimuthalInvert(asin$1);

var geoOrthographic = function() {
  return projection$1(orthographicRaw)
      .scale(249.5)
      .clipAngle(90 + epsilon$2);
};

function stereographicRaw(x, y) {
  var cy = cos$1(y), k = 1 + cos$1(x) * cy;
  return [cy * sin$1(x) / k, sin$1(y) / k];
}

stereographicRaw.invert = azimuthalInvert(function(z) {
  return 2 * atan(z);
});

var geoStereographic = function() {
  return projection$1(stereographicRaw)
      .scale(250)
      .clipAngle(142);
};

function transverseMercatorRaw(lambda, phi) {
  return [log$2(tan((halfPi$2 + phi) / 2)), -lambda];
}

transverseMercatorRaw.invert = function(x, y) {
  return [-y, 2 * atan(exp(x)) - halfPi$2];
};

var geoTransverseMercator = function() {
  var m = mercatorProjection(transverseMercatorRaw),
      center = m.center,
      rotate = m.rotate;

  m.center = function(_) {
    return arguments.length ? center([-_[1], _[0]]) : (_ = center(), [_[1], -_[0]]);
  };

  m.rotate = function(_) {
    return arguments.length ? rotate([_[0], _[1], _.length > 2 ? _[2] + 90 : 90]) : (_ = rotate(), [_[0], _[1], _[2] - 90]);
  };

  return rotate([0, 0, 90])
      .scale(159.155);
};

var defaultPath = geoPath();

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
  return function projection$$1() {
    var p = constructor();

    p.type = type;

    p.path = geoPath().projection(p);

    p.copy = p.copy || function() {
      var c = projection$$1();
      properties.forEach(function(prop) {
        if (p.hasOwnProperty(prop)) c[prop](p[prop]());
      });
      c.path.pointRadius(p.path.pointRadius());
      return c;
    };

    return p;
  };
}

function projection$$1(type, proj) {
  if (arguments.length > 1) {
    projections[type] = create$1(type, proj);
    return this;
  } else {
    return projections.hasOwnProperty(type) ? projections[type] : null;
  }
}

function getPath(proj) {
  return (proj && proj.path) || defaultPath;
}

var projections = {
  // base d3-geo projection types
  albers:               albers,
  albersusa:            geoAlbersUsa,
  azimuthalequalarea:   geoAzimuthalEqualArea,
  azimuthalequidistant: geoAzimuthalEquidistant,
  conicconformal:       geoConicConformal,
  conicequalarea:       conicEqualArea,
  conicequidistant:     geoConicEquidistant,
  equirectangular:      geoEquirectangular,
  gnomonic:             geoGnomonic,
  mercator:             geoMercator,
  orthographic:         geoOrthographic,
  stereographic:        geoStereographic,
  transversemercator:   geoTransverseMercator
};

for (var key$2 in projections) {
  projection$$1(key$2, projections[key$2]);
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

var prototype$45 = inherits(GeoPath, Transform);

prototype$45.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ALL),
      path = this.value,
      field$$1 = _.field || identity$1,
      as = _.as || 'path',
      mod;

  function set(t) { t[as] = path(field$$1(t)); }

  if (!path || _.modified()) {
    // parameters updated, reset and reflow
    this.value = path = getPath(_.projection).context(null);
    out.materialize().reflow().visit(out.SOURCE, set);
  } else {
    path.context(null);
    mod = field$$1 === identity$1 || pulse.modified(field$$1.fields);
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

var prototype$46 = inherits(GeoPoint, Transform);

prototype$46.transform = function(_, pulse) {
  var proj = _.projection,
      lon = _.fields[0],
      lat = _.fields[1],
      as = _.as || ['x', 'y'],
      x = as[0],
      y = as[1],
      mod;

  function set(t) {
    var xy = proj([lon(t), lat(t)]);
    if (xy) {
      t[x] = xy[0];
      t[y] = xy[1];
    } else {
      t[x] = undefined;
      t[y] = undefined;
    }
  }

  if (_.modified()) {
    // parameters updated, reflow
    pulse = pulse.materialize().reflow(true).visit(pulse.SOURCE, set);
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

var prototype$47 = inherits(GeoShape, Transform);

prototype$47.transform = function(_, pulse) {
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

function shapeGenerator(path, field$$1) {
  var shape = function(_) {
    return path(field$$1(_));
  };
  shape.context = function(_) {
    path.context(_);
    return shape;
  };

  return shape;
}

/**
 * GeoJSON feature generator for creating graticules.
 * @constructor
 */
function Graticule(params) {
  Transform.call(this, [], params);
  this.generator = graticule();
}

var prototype$48 = inherits(Graticule, Transform);

prototype$48.transform = function(_, pulse) {
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
  out.source = src;

  return out;
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

var prototype$49 = inherits(Projection, Transform);

prototype$49.transform = function(_, pulse) {
  var proj = this.value;

  if (!proj || _.modified('type')) {
    this.value = (proj = create$2(_.type));
    properties.forEach(function(prop) {
      if (_[prop] != null) set$3(proj, prop, _[prop]);
    });
  } else {
    properties.forEach(function(prop) {
      if (_.modified(prop)) set$3(proj, prop, _[prop]);
    });
  }

  if (_.pointRadius != null) proj.path.pointRadius(_.pointRadius);
  if (_.fit) fit(proj, _);

  return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
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
  var constructor = projection$$1((type || 'mercator').toLowerCase());
  if (!constructor) error$1('Unrecognized projection type: ' + type);
  return constructor();
}

function set$3(proj, key$$1, value) {
   if (isFunction(proj[key$$1])) proj[key$$1](value);
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
    { "name": "count", "type": "number" },
    { "name": "nice", "type": "number", "default": false },
    { "name": "thresholds", "type": "number", "array": true }
  ]
};

var GeoPathDefinition = {
  "type": "GeoPath",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection" },
    { "name": "field", "type": "field" },
    { "name": "as", "type": "string", "default": "path" }
  ]
};

var GeoPointDefinition = {
  "type": "GeoPoint",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection", "required": true },
    { "name": "fields", "type": "field", "array": true, "required": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["x", "y"] }
  ]
};

var GeoShapeDefinition = {
  "type": "GeoShape",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection" },
    { "name": "field", "type": "field", "default": "datum" },
    { "name": "as", "type": "string", "default": "shape" }
  ]
};

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
};

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
var Linear$1 = 'linear';
var Ordinal = 'ordinal';
var Quantile = 'quantile';
var Quantize = 'quantize';
var Threshold = 'threshold';
var BinLinear = 'bin-linear';
var BinOrdinal = 'bin-ordinal';
var Sequential = 'sequential';

/**
 * Filter a set of candidate tick values, ensuring that only tick values
 * that lie within the scale range are included.
 * @param {Scale} scale - The scale for which to generate tick values.
 * @param {Array<*>} ticks - The candidate tick values.
 * @return {Array<*>} - The filtered tick values.
 */
function validTicks(scale, ticks) {
  var range = scale.range(),
      lo = range[0],
      hi = peek(range);
  if (lo > hi) {
    range = hi;
    hi = lo;
    lo = range;
  }

  return ticks.filter(function(v) {
    v = scale(v);
    return !(v < lo || v > hi)
  });
}

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
function tickFormat$1(scale, count, specifier) {
  var format$$1 = scale.tickFormat
    ? scale.tickFormat(count, specifier)
    : String;

  return (scale.type === Log)
    ? filter$1(format$$1, variablePrecision(specifier))
    : format$$1;
}

function filter$1(sourceFormat, targetFormat) {
  return function(_) {
    return sourceFormat(_) ? targetFormat(_) : '';
  };
}

function variablePrecision(specifier) {
  var s = formatSpecifier(specifier || ',');

  if (s.precision == null) {
    s.precision = 12;
    switch (s.type) {
      case '%': s.precision -= 2; break;
      case 'e': s.precision -= 1; break;
    }
    return trimZeroes(
      format(s),          // number format
      format('.1f')(1)[1] // decimal point character
    );
  } else {
    return format(s);
  }
}

function trimZeroes(format$$1, decimalChar) {
  return function(x) {
    var str = format$$1(x),
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

var prototype$50 = inherits(AxisTicks, Transform);

prototype$50.transform = function(_, pulse) {
  if (this.value && !_.modified()) {
    return pulse.StopPropagation;
  }

  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      ticks = this.value,
      scale = _.scale,
      count = _.values ? _.values.length : _.count,
      format = _.format || tickFormat$1(scale, count, _.formatSpecifier),
      values = _.values ? validTicks(scale, _.values) : tickValues(scale, count);

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

  out.source = ticks;
  out.add = ticks;
  this.value = ticks;

  return out;
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

var prototype$51 = inherits(DataJoin, Transform);

function defaultItemCreate() {
  return ingest({});
}

function isExit(t) {
  return t.exit;
}

prototype$51.transform = function(_, pulse) {
  var df = pulse.dataflow,
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      item = _.item || defaultItemCreate,
      key$$1 = _.key || tupleid,
      map = this.value;

  if (!map) {
    pulse = pulse.addAll();
    this.value = map = fastmap().test(isExit);
    map.lookup = function(t) { return map.get(key$$1(t)); };
  }

  if (_.modified('key') || pulse.modified(key$$1)) {
    error$1('DataJoin does not support modified key function or fields.');
  }

  pulse.visit(pulse.ADD, function(t) {
    var k = key$$1(t),
        x = map.get(k);

    if (x) {
      if (x.exit) {
        map.empty--;
        out.add.push(x);
      } else {
        out.mod.push(x);
      }
    } else {
      map.set(k, (x = item(t)));
      out.add.push(x);
    }

    x.datum = t;
    x.exit = false;
  });

  pulse.visit(pulse.MOD, function(t) {
    var k = key$$1(t),
        x = map.get(k);

    if (x) {
      x.datum = t;
      out.mod.push(x);
    }
  });

  pulse.visit(pulse.REM, function(t) {
    var k = key$$1(t),
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

var prototype$52 = inherits(Encode, Transform);

prototype$52.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ADD_REM),
      encoders = _.encoders,
      encode = pulse.encode;

  // if an array, the encode directive includes additional sets
  // that must be defined in order for the primary set to be invoked
  // e.g., only run the update set if the hover set is defined
  if (isArray(encode)) {
    if (out.changed() || encode.every(function(e) { return encoders[e]; })) {
      encode = encode[0];
    } else {
      return pulse.StopPropagation;
    }
  }

  // marshall encoder functions
  var reenter = encode === 'enter',
      update = encoders.update || falsy,
      enter = encoders.enter || falsy,
      exit = encoders.exit || falsy,
      set = (encode && !reenter ? encoders[encode] : update) || falsy;

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

  return out.changed() ? out : pulse.StopPropagation;
};

var discrete$1 = {};
discrete$1[Quantile] = quantile$1;
discrete$1[Quantize] = quantize$3;
discrete$1[Threshold] = threshold$2;
discrete$1[BinLinear] = bin$2;
discrete$1[BinOrdinal] = bin$2;

function labelValues(scale, count, gradient) {
  if (gradient) return scale.domain();
  var values = discrete$1[scale.type];
  return values ? values(scale) : tickValues(scale, count);
}

function quantize$3(scale) {
  var domain = scale.domain(),
      x0 = domain[0],
      x1 = peek(domain),
      n = scale.range().length,
      values = new Array(n),
      i = 0;

  values[0] = x0;
  while (++i < n) values[i] = (i * x1 - (i - n) * x0) / n;
  values.max = x1;

  return values;
}

function quantile$1(scale) {
  var domain = scale.domain(),
      values = [domain[0]].concat(scale.quantiles());
  values.max = peek(domain);

  return values;
}

function threshold$2(scale) {
  var values = [-Infinity].concat(scale.domain());
  values.max = +Infinity;

  return values;
}

function bin$2(scale) {
  var values = scale.domain();
  values.max = values.pop();

  return values;
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

var prototype$53 = inherits(LegendEntries, Transform);

prototype$53.transform = function(_, pulse) {
  if (this.value != null && !_.modified()) {
    return pulse.StopPropagation;
  }

  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      total = 0,
      items = this.value,
      grad  = _.type === 'gradient',
      scale = _.scale,
      count = _.count == null ? 5 : _.count,
      format = _.format || tickFormat$1(scale, count, _.formatSpecifier),
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
      size = constant$1(offset = size || 8);
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

  out.source = items;
  out.add = items;
  this.value = items;

  return out;
};

var Paths = fastmap({
  'line': line$3,
  'line-radial': lineR,
  'arc': arc$2,
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

var prototype$54 = inherits(LinkPath, Transform);

prototype$54.transform = function(_, pulse) {
  var sx = _.sourceX || sourceX,
      sy = _.sourceY || sourceY,
      tx = _.targetX || targetX,
      ty = _.targetY || targetY,
      as = _.as || 'path',
      orient = _.orient || 'vertical',
      shape = _.shape || 'line',
      path = Paths.get(shape + '-' + orient) || Paths.get(shape);

  if (!path) {
    error$1('LinkPath unsupported type: ' + _.shape
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

function arc$2(sx, sy, tx, ty) {
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
  return arc$2(
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

var prototype$55 = inherits(Pie, Transform);

prototype$55.transform = function(_, pulse) {
  var as = _.as || ['startAngle', 'endAngle'],
      startAngle = as[0],
      endAngle = as[1],
      field$$1 = _.field || one,
      start = _.startAngle || 0,
      stop = _.endAngle != null ? _.endAngle : 2 * Math.PI,
      data = pulse.source,
      values = data.map(field$$1),
      n = values.length,
      a = start,
      k = (stop - start) / sum(values),
      index = sequence(n),
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

var INCLUDE_ZERO = toSet([Linear$1, Pow, Sqrt]);

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

var prototype$56 = inherits(Scale, Transform);

prototype$56.transform = function(_, pulse) {
  var df = pulse.dataflow,
      scale = this.value,
      prop;

  if (!scale || _.modified('type')) {
    this.value = scale = scale$1((_.type || Linear$1).toLowerCase())();
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
      zero$$1 = _.zero || (_.zero === undefined && INCLUDE_ZERO[scale.type]),
      n, mid;

  if (!domain) return 0;

  // adjust domain based on zero, min, max settings
  if (zero$$1 || _.domainMin != null || _.domainMax != null || _.domainMid != null) {
    n = ((domain = domain.slice()).length - 1) || 1;
    if (zero$$1) {
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
  if (raw) {
    scale.domain(raw);
    return raw.length;
  } else {
    return -1;
  }
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
    return scale.interpolator(rgbBasis(flip(range, _.reverse)));
  }

  // configure rounding / interpolation
  if (range && _.interpolate && scale.interpolate) {
    scale.interpolate(interpolate$1(_.interpolate, _.interpolateGamma));
  } else if (isFunction(scale.round)) {
    scale.round(round);
  } else if (isFunction(scale.rangeRound)) {
    scale.interpolate(round ? interpolateRound : interpolate);
  }

  if (range) scale.range(flip(range, _.reverse));
}

function configureRangeStep(type, _, count) {
  if (type !== Band && type !== Point) {
    error$1('Only band and point scales support rangeStep.');
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
    error$1('Unrecognized scheme name: ' + _.scheme);
  }

  // determine size for potential discrete range
  count = (type === Threshold) ? count + 1
    : (type === BinOrdinal) ? count - 1
    : (type === Quantile || type === Quantize) ? (+_.schemeCount || DEFAULT_COUNT)
    : count;

  // adjust and/or quantize scheme as appropriate
  return type === Sequential ? adjustScheme(scheme, extent, _.reverse)
    : !extent && (discrete = getScheme(name + '-' + count)) ? discrete
    : isFunction(scheme) ? quantize$4(adjustScheme(scheme, extent), count)
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

function quantize$4(interpolator, count) {
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

var prototype$57 = inherits(SortItems, Transform);

prototype$57.transform = function(_, pulse) {
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

var prototype$58 = inherits(Stack, Transform);

prototype$58.transform = function(_, pulse) {
  var as = _.as || ['y0', 'y1'],
      y0 = as[0],
      y1 = as[1],
      field$$1 = _.field || one,
      stack = _.offset === Center ? stackCenter
            : _.offset === Normalize ? stackNormalize
            : stackZero,
      groups, i, n, max;

  // partition, sum, and sort the stack groups
  groups = partition$1(pulse.source, _.groupby, _.sort, field$$1);

  // compute stack layouts per group
  for (i=0, n=groups.length, max=groups.max; i<n; ++i) {
    stack(groups[i], max, field$$1, y0, y1);
  }

  return pulse.reflow(_.modified()).modifies(as);
};

function stackCenter(group, max, field$$1, y0, y1) {
  var last = (max - group.sum) / 2,
      m = group.length,
      j = 0, t;

  for (; j<m; ++j) {
    t = group[j];
    t[y0] = last;
    t[y1] = (last += Math.abs(field$$1(t)));
  }
}

function stackNormalize(group, max, field$$1, y0, y1) {
  var scale = 1 / group.sum,
      last = 0,
      m = group.length,
      j = 0, v = 0, t;

  for (; j<m; ++j) {
    t = group[j];
    t[y0] = last;
    t[y1] = last = scale * (v += Math.abs(field$$1(t)));
  }
}

function stackZero(group, max, field$$1, y0, y1) {
  var lastPos = 0,
      lastNeg = 0,
      m = group.length,
      j = 0, v, t;

  for (; j<m; ++j) {
    t = group[j];
    v = field$$1(t);
    if (v < 0) {
      t[y0] = lastNeg;
      t[y1] = (lastNeg += v);
    } else {
      t[y0] = lastPos;
      t[y1] = (lastPos += v);
    }
  }
}

function partition$1(data, groupby, sort, field$$1) {
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
      g = map[k];
      if (!g) {
        map[k] = (g = []);
        groups.push(g);
      }
      g.push(t);
    }
  }

  // compute sums of groups, sort groups as needed
  for (k=0, max=0, m=groups.length; k<m; ++k) {
    g = groups[k];
    for (i=0, s=0, n=g.length; i<n; ++i) {
      s += Math.abs(field$$1(g[i]));
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

var forceCenter = function(x, y) {
  var nodes;

  if (x == null) x = 0;
  if (y == null) y = 0;

  function force() {
    var i,
        n = nodes.length,
        node,
        sx = 0,
        sy = 0;

    for (i = 0; i < n; ++i) {
      node = nodes[i], sx += node.x, sy += node.y;
    }

    for (sx = sx / n - x, sy = sy / n - y, i = 0; i < n; ++i) {
      node = nodes[i], node.x -= sx, node.y -= sy;
    }
  }

  force.initialize = function(_) {
    nodes = _;
  };

  force.x = function(_) {
    return arguments.length ? (x = +_, force) : x;
  };

  force.y = function(_) {
    return arguments.length ? (y = +_, force) : y;
  };

  return force;
};

var constant$8 = function(x) {
  return function() {
    return x;
  };
};

var jiggle = function() {
  return (Math.random() - 0.5) * 1e-6;
};

var tree_add = function(d) {
  var x = +this._x.call(null, d),
      y = +this._y.call(null, d);
  return add$4(this.cover(x, y), x, y, d);
};

function add$4(tree, x, y, d) {
  if (isNaN(x) || isNaN(y)) return tree; // ignore invalid points

  var parent,
      node = tree._root,
      leaf = {data: d},
      x0 = tree._x0,
      y0 = tree._y0,
      x1 = tree._x1,
      y1 = tree._y1,
      xm,
      ym,
      xp,
      yp,
      right,
      bottom,
      i,
      j;

  // If the tree is empty, initialize the root as a leaf.
  if (!node) return tree._root = leaf, tree;

  // Find the existing leaf for the new point, or add it.
  while (node.length) {
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
    if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
  }

  // Is the new point is exactly coincident with the existing point?
  xp = +tree._x.call(null, node.data);
  yp = +tree._y.call(null, node.data);
  if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

  // Otherwise, split the leaf node until the old and new point are separated.
  do {
    parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
  } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | (xp >= xm)));
  return parent[j] = node, parent[i] = leaf, tree;
}

function addAll(data) {
  var d, i, n = data.length,
      x,
      y,
      xz = new Array(n),
      yz = new Array(n),
      x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;

  // Compute the points and their extent.
  for (i = 0; i < n; ++i) {
    if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d))) continue;
    xz[i] = x;
    yz[i] = y;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }

  // If there were no (valid) points, inherit the existing extent.
  if (x1 < x0) x0 = this._x0, x1 = this._x1;
  if (y1 < y0) y0 = this._y0, y1 = this._y1;

  // Expand the tree to cover the new points.
  this.cover(x0, y0).cover(x1, y1);

  // Add the new points.
  for (i = 0; i < n; ++i) {
    add$4(this, xz[i], yz[i], data[i]);
  }

  return this;
}

var tree_cover = function(x, y) {
  if (isNaN(x = +x) || isNaN(y = +y)) return this; // ignore invalid points

  var x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1;

  // If the quadtree has no extent, initialize them.
  // Integer extent are necessary so that if we later double the extent,
  // the existing quadrant boundaries don’t change due to floating point error!
  if (isNaN(x0)) {
    x1 = (x0 = Math.floor(x)) + 1;
    y1 = (y0 = Math.floor(y)) + 1;
  }

  // Otherwise, double repeatedly to cover.
  else if (x0 > x || x > x1 || y0 > y || y > y1) {
    var z = x1 - x0,
        node = this._root,
        parent,
        i;

    switch (i = (y < (y0 + y1) / 2) << 1 | (x < (x0 + x1) / 2)) {
      case 0: {
        do parent = new Array(4), parent[i] = node, node = parent;
        while (z *= 2, x1 = x0 + z, y1 = y0 + z, x > x1 || y > y1);
        break;
      }
      case 1: {
        do parent = new Array(4), parent[i] = node, node = parent;
        while (z *= 2, x0 = x1 - z, y1 = y0 + z, x0 > x || y > y1);
        break;
      }
      case 2: {
        do parent = new Array(4), parent[i] = node, node = parent;
        while (z *= 2, x1 = x0 + z, y0 = y1 - z, x > x1 || y0 > y);
        break;
      }
      case 3: {
        do parent = new Array(4), parent[i] = node, node = parent;
        while (z *= 2, x0 = x1 - z, y0 = y1 - z, x0 > x || y0 > y);
        break;
      }
    }

    if (this._root && this._root.length) this._root = node;
  }

  // If the quadtree covers the point already, just return.
  else return this;

  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  return this;
};

var tree_data = function() {
  var data = [];
  this.visit(function(node) {
    if (!node.length) do data.push(node.data); while (node = node.next)
  });
  return data;
};

var tree_extent = function(_) {
  return arguments.length
      ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1])
      : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
};

var Quad = function(node, x0, y0, x1, y1) {
  this.node = node;
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;
};

var tree_find = function(x, y, radius) {
  var data,
      x0 = this._x0,
      y0 = this._y0,
      x1,
      y1,
      x2,
      y2,
      x3 = this._x1,
      y3 = this._y1,
      quads = [],
      node = this._root,
      q,
      i;

  if (node) quads.push(new Quad(node, x0, y0, x3, y3));
  if (radius == null) radius = Infinity;
  else {
    x0 = x - radius, y0 = y - radius;
    x3 = x + radius, y3 = y + radius;
    radius *= radius;
  }

  while (q = quads.pop()) {

    // Stop searching if this quadrant can’t contain a closer node.
    if (!(node = q.node)
        || (x1 = q.x0) > x3
        || (y1 = q.y0) > y3
        || (x2 = q.x1) < x0
        || (y2 = q.y1) < y0) continue;

    // Bisect the current quadrant.
    if (node.length) {
      var xm = (x1 + x2) / 2,
          ym = (y1 + y2) / 2;

      quads.push(
        new Quad(node[3], xm, ym, x2, y2),
        new Quad(node[2], x1, ym, xm, y2),
        new Quad(node[1], xm, y1, x2, ym),
        new Quad(node[0], x1, y1, xm, ym)
      );

      // Visit the closest quadrant first.
      if (i = (y >= ym) << 1 | (x >= xm)) {
        q = quads[quads.length - 1];
        quads[quads.length - 1] = quads[quads.length - 1 - i];
        quads[quads.length - 1 - i] = q;
      }
    }

    // Visit this point. (Visiting coincident points isn’t necessary!)
    else {
      var dx = x - +this._x.call(null, node.data),
          dy = y - +this._y.call(null, node.data),
          d2 = dx * dx + dy * dy;
      if (d2 < radius) {
        var d = Math.sqrt(radius = d2);
        x0 = x - d, y0 = y - d;
        x3 = x + d, y3 = y + d;
        data = node.data;
      }
    }
  }

  return data;
};

var tree_remove = function(d) {
  if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d))) return this; // ignore invalid points

  var parent,
      node = this._root,
      retainer,
      previous,
      next,
      x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1,
      x,
      y,
      xm,
      ym,
      right,
      bottom,
      i,
      j;

  // If the tree is empty, initialize the root as a leaf.
  if (!node) return this;

  // Find the leaf node for the point.
  // While descending, also retain the deepest parent with a non-removed sibling.
  if (node.length) while (true) {
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
    if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
    if (!node.length) break;
    if (parent[(i + 1) & 3] || parent[(i + 2) & 3] || parent[(i + 3) & 3]) retainer = parent, j = i;
  }

  // Find the point to remove.
  while (node.data !== d) if (!(previous = node, node = node.next)) return this;
  if (next = node.next) delete node.next;

  // If there are multiple coincident points, remove just the point.
  if (previous) return (next ? previous.next = next : delete previous.next), this;

  // If this is the root point, remove it.
  if (!parent) return this._root = next, this;

  // Remove this leaf.
  next ? parent[i] = next : delete parent[i];

  // If the parent now contains exactly one leaf, collapse superfluous parents.
  if ((node = parent[0] || parent[1] || parent[2] || parent[3])
      && node === (parent[3] || parent[2] || parent[1] || parent[0])
      && !node.length) {
    if (retainer) retainer[j] = node;
    else this._root = node;
  }

  return this;
};

function removeAll(data) {
  for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
  return this;
}

var tree_root = function() {
  return this._root;
};

var tree_size = function() {
  var size = 0;
  this.visit(function(node) {
    if (!node.length) do ++size; while (node = node.next)
  });
  return size;
};

var tree_visit = function(callback) {
  var quads = [], q, node = this._root, child, x0, y0, x1, y1;
  if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
      var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
      if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
      if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
      if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
    }
  }
  return this;
};

var tree_visitAfter = function(callback) {
  var quads = [], next = [], q;
  if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    var node = q.node;
    if (node.length) {
      var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
      if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
      if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
      if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
    }
    next.push(q);
  }
  while (q = next.pop()) {
    callback(q.node, q.x0, q.y0, q.x1, q.y1);
  }
  return this;
};

function defaultX$1(d) {
  return d[0];
}

var tree_x = function(_) {
  return arguments.length ? (this._x = _, this) : this._x;
};

function defaultY$1(d) {
  return d[1];
}

var tree_y = function(_) {
  return arguments.length ? (this._y = _, this) : this._y;
};

function quadtree(nodes, x, y) {
  var tree = new Quadtree(x == null ? defaultX$1 : x, y == null ? defaultY$1 : y, NaN, NaN, NaN, NaN);
  return nodes == null ? tree : tree.addAll(nodes);
}

function Quadtree(x, y, x0, y0, x1, y1) {
  this._x = x;
  this._y = y;
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  this._root = undefined;
}

function leaf_copy(leaf) {
  var copy = {data: leaf.data}, next = copy;
  while (leaf = leaf.next) next = next.next = {data: leaf.data};
  return copy;
}

var treeProto = quadtree.prototype = Quadtree.prototype;

treeProto.copy = function() {
  var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
      node = this._root,
      nodes,
      child;

  if (!node) return copy;

  if (!node.length) return copy._root = leaf_copy(node), copy;

  nodes = [{source: node, target: copy._root = new Array(4)}];
  while (node = nodes.pop()) {
    for (var i = 0; i < 4; ++i) {
      if (child = node.source[i]) {
        if (child.length) nodes.push({source: child, target: node.target[i] = new Array(4)});
        else node.target[i] = leaf_copy(child);
      }
    }
  }

  return copy;
};

treeProto.add = tree_add;
treeProto.addAll = addAll;
treeProto.cover = tree_cover;
treeProto.data = tree_data;
treeProto.extent = tree_extent;
treeProto.find = tree_find;
treeProto.remove = tree_remove;
treeProto.removeAll = removeAll;
treeProto.root = tree_root;
treeProto.size = tree_size;
treeProto.visit = tree_visit;
treeProto.visitAfter = tree_visitAfter;
treeProto.x = tree_x;
treeProto.y = tree_y;

function x$2(d) {
  return d.x + d.vx;
}

function y$2(d) {
  return d.y + d.vy;
}

var forceCollide = function(radius) {
  var nodes,
      radii,
      strength = 1,
      iterations = 1;

  if (typeof radius !== "function") radius = constant$8(radius == null ? 1 : +radius);

  function force() {
    var i, n = nodes.length,
        tree,
        node,
        xi,
        yi,
        ri,
        ri2;

    for (var k = 0; k < iterations; ++k) {
      tree = quadtree(nodes, x$2, y$2).visitAfter(prepare);
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        ri = radii[node.index], ri2 = ri * ri;
        xi = node.x + node.vx;
        yi = node.y + node.vy;
        tree.visit(apply);
      }
    }

    function apply(quad, x0, y0, x1, y1) {
      var data = quad.data, rj = quad.r, r = ri + rj;
      if (data) {
        if (data.index > node.index) {
          var x = xi - data.x - data.vx,
              y = yi - data.y - data.vy,
              l = x * x + y * y;
          if (l < r * r) {
            if (x === 0) x = jiggle(), l += x * x;
            if (y === 0) y = jiggle(), l += y * y;
            l = (r - (l = Math.sqrt(l))) / l * strength;
            node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
            node.vy += (y *= l) * r;
            data.vx -= x * (r = 1 - r);
            data.vy -= y * r;
          }
        }
        return;
      }
      return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
    }
  }

  function prepare(quad) {
    if (quad.data) return quad.r = radii[quad.data.index];
    for (var i = quad.r = 0; i < 4; ++i) {
      if (quad[i] && quad[i].r > quad.r) {
        quad.r = quad[i].r;
      }
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length, node;
    radii = new Array(n);
    for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  force.strength = function(_) {
    return arguments.length ? (strength = +_, force) : strength;
  };

  force.radius = function(_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : constant$8(+_), initialize(), force) : radius;
  };

  return force;
};

function index(d) {
  return d.index;
}

function find(nodeById, nodeId) {
  var node = nodeById.get(nodeId);
  if (!node) throw new Error("missing: " + nodeId);
  return node;
}

var forceLink = function(links) {
  var id = index,
      strength = defaultStrength,
      strengths,
      distance = constant$8(30),
      distances,
      nodes,
      count,
      bias,
      iterations = 1;

  if (links == null) links = [];

  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index]);
  }

  function force(alpha) {
    for (var k = 0, n = links.length; k < iterations; ++k) {
      for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
        link = links[i], source = link.source, target = link.target;
        x = target.x + target.vx - source.x - source.vx || jiggle();
        y = target.y + target.vy - source.y - source.vy || jiggle();
        l = Math.sqrt(x * x + y * y);
        l = (l - distances[i]) / l * alpha * strengths[i];
        x *= l, y *= l;
        target.vx -= x * (b = bias[i]);
        target.vy -= y * b;
        source.vx += x * (b = 1 - b);
        source.vy += y * b;
      }
    }
  }

  function initialize() {
    if (!nodes) return;

    var i,
        n = nodes.length,
        m = links.length,
        nodeById = map$1(nodes, id),
        link;

    for (i = 0, count = new Array(n); i < m; ++i) {
      link = links[i], link.index = i;
      if (typeof link.source !== "object") link.source = find(nodeById, link.source);
      if (typeof link.target !== "object") link.target = find(nodeById, link.target);
      count[link.source.index] = (count[link.source.index] || 0) + 1;
      count[link.target.index] = (count[link.target.index] || 0) + 1;
    }

    for (i = 0, bias = new Array(m); i < m; ++i) {
      link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
    }

    strengths = new Array(m), initializeStrength();
    distances = new Array(m), initializeDistance();
  }

  function initializeStrength() {
    if (!nodes) return;

    for (var i = 0, n = links.length; i < n; ++i) {
      strengths[i] = +strength(links[i], i, links);
    }
  }

  function initializeDistance() {
    if (!nodes) return;

    for (var i = 0, n = links.length; i < n; ++i) {
      distances[i] = +distance(links[i], i, links);
    }
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.links = function(_) {
    return arguments.length ? (links = _, initialize(), force) : links;
  };

  force.id = function(_) {
    return arguments.length ? (id = _, force) : id;
  };

  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$8(+_), initializeStrength(), force) : strength;
  };

  force.distance = function(_) {
    return arguments.length ? (distance = typeof _ === "function" ? _ : constant$8(+_), initializeDistance(), force) : distance;
  };

  return force;
};

var frame = 0;
var timeout = 0;
var interval = 0;
var pokeDelay = 1000;
var taskHead;
var taskTail;
var clockLast = 0;
var clockNow = 0;
var clockSkew = 0;
var clock = typeof performance === "object" && performance.now ? performance : Date;
var setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}

function clearNow() {
  clockNow = 0;
}

function Timer() {
  this._call =
  this._time =
  this._next = null;
}

Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;
      else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};

function timer(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}

function timerFlush() {
  now(); // Get the current time, if not already set.
  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
    t = t._next;
  }
  --frame;
}

function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}

function poke() {
  var now = clock.now(), delay = now - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
}

function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}

function sleep(time) {
  if (frame) return; // Soonest alarm already set, or will be.
  if (timeout) timeout = clearTimeout(timeout);
  var delay = time - clockNow;
  if (delay > 24) {
    if (time < Infinity) timeout = setTimeout(wake, delay);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) clockLast = clockNow, interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}

function x$3(d) {
  return d.x;
}

function y$3(d) {
  return d.y;
}

var initialRadius = 10;
var initialAngle = Math.PI * (3 - Math.sqrt(5));

var forceSimulation = function(nodes) {
  var simulation,
      alpha = 1,
      alphaMin = 0.001,
      alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
      alphaTarget = 0,
      velocityDecay = 0.6,
      forces = map$1(),
      stepper = timer(step),
      event = dispatch("tick", "end");

  if (nodes == null) nodes = [];

  function step() {
    tick();
    event.call("tick", simulation);
    if (alpha < alphaMin) {
      stepper.stop();
      event.call("end", simulation);
    }
  }

  function tick() {
    var i, n = nodes.length, node;

    alpha += (alphaTarget - alpha) * alphaDecay;

    forces.each(function(force) {
      force(alpha);
    });

    for (i = 0; i < n; ++i) {
      node = nodes[i];
      if (node.fx == null) node.x += node.vx *= velocityDecay;
      else node.x = node.fx, node.vx = 0;
      if (node.fy == null) node.y += node.vy *= velocityDecay;
      else node.y = node.fy, node.vy = 0;
    }
  }

  function initializeNodes() {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.index = i;
      if (isNaN(node.x) || isNaN(node.y)) {
        var radius = initialRadius * Math.sqrt(i), angle = i * initialAngle;
        node.x = radius * Math.cos(angle);
        node.y = radius * Math.sin(angle);
      }
      if (isNaN(node.vx) || isNaN(node.vy)) {
        node.vx = node.vy = 0;
      }
    }
  }

  function initializeForce(force) {
    if (force.initialize) force.initialize(nodes);
    return force;
  }

  initializeNodes();

  return simulation = {
    tick: tick,

    restart: function() {
      return stepper.restart(step), simulation;
    },

    stop: function() {
      return stepper.stop(), simulation;
    },

    nodes: function(_) {
      return arguments.length ? (nodes = _, initializeNodes(), forces.each(initializeForce), simulation) : nodes;
    },

    alpha: function(_) {
      return arguments.length ? (alpha = +_, simulation) : alpha;
    },

    alphaMin: function(_) {
      return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
    },

    alphaDecay: function(_) {
      return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
    },

    alphaTarget: function(_) {
      return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
    },

    velocityDecay: function(_) {
      return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
    },

    force: function(name, _) {
      return arguments.length > 1 ? ((_ == null ? forces.remove(name) : forces.set(name, initializeForce(_))), simulation) : forces.get(name);
    },

    find: function(x, y, radius) {
      var i = 0,
          n = nodes.length,
          dx,
          dy,
          d2,
          node,
          closest;

      if (radius == null) radius = Infinity;
      else radius *= radius;

      for (i = 0; i < n; ++i) {
        node = nodes[i];
        dx = x - node.x;
        dy = y - node.y;
        d2 = dx * dx + dy * dy;
        if (d2 < radius) closest = node, radius = d2;
      }

      return closest;
    },

    on: function(name, _) {
      return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
    }
  };
};

var forceManyBody = function() {
  var nodes,
      node,
      alpha,
      strength = constant$8(-30),
      strengths,
      distanceMin2 = 1,
      distanceMax2 = Infinity,
      theta2 = 0.81;

  function force(_) {
    var i, n = nodes.length, tree = quadtree(nodes, x$3, y$3).visitAfter(accumulate);
    for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length, node;
    strengths = new Array(n);
    for (i = 0; i < n; ++i) node = nodes[i], strengths[node.index] = +strength(node, i, nodes);
  }

  function accumulate(quad) {
    var strength = 0, q, c, x, y, i;

    // For internal nodes, accumulate forces from child quadrants.
    if (quad.length) {
      for (x = y = i = 0; i < 4; ++i) {
        if ((q = quad[i]) && (c = q.value)) {
          strength += c, x += c * q.x, y += c * q.y;
        }
      }
      quad.x = x / strength;
      quad.y = y / strength;
    }

    // For leaf nodes, accumulate forces from coincident quadrants.
    else {
      q = quad;
      q.x = q.data.x;
      q.y = q.data.y;
      do strength += strengths[q.data.index];
      while (q = q.next);
    }

    quad.value = strength;
  }

  function apply(quad, x1, _, x2) {
    if (!quad.value) return true;

    var x = quad.x - node.x,
        y = quad.y - node.y,
        w = x2 - x1,
        l = x * x + y * y;

    // Apply the Barnes-Hut approximation if possible.
    // Limit forces for very close nodes; randomize direction if coincident.
    if (w * w / theta2 < l) {
      if (l < distanceMax2) {
        if (x === 0) x = jiggle(), l += x * x;
        if (y === 0) y = jiggle(), l += y * y;
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        node.vx += x * quad.value * alpha / l;
        node.vy += y * quad.value * alpha / l;
      }
      return true;
    }

    // Otherwise, process points directly.
    else if (quad.length || l >= distanceMax2) return;

    // Limit forces for very close nodes; randomize direction if coincident.
    if (quad.data !== node || quad.next) {
      if (x === 0) x = jiggle(), l += x * x;
      if (y === 0) y = jiggle(), l += y * y;
      if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
    }

    do if (quad.data !== node) {
      w = strengths[quad.data.index] * alpha / l;
      node.vx += x * w;
      node.vy += y * w;
    } while (quad = quad.next);
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$8(+_), initialize(), force) : strength;
  };

  force.distanceMin = function(_) {
    return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
  };

  force.distanceMax = function(_) {
    return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
  };

  force.theta = function(_) {
    return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
  };

  return force;
};

var forceX = function(x) {
  var strength = constant$8(0.1),
      nodes,
      strengths,
      xz;

  if (typeof x !== "function") x = constant$8(x == null ? 0 : +x);

  function force(alpha) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.vx += (xz[i] - node.x) * strengths[i] * alpha;
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    xz = new Array(n);
    for (i = 0; i < n; ++i) {
      strengths[i] = isNaN(xz[i] = +x(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$8(+_), initialize(), force) : strength;
  };

  force.x = function(_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant$8(+_), initialize(), force) : x;
  };

  return force;
};

var forceY = function(y) {
  var strength = constant$8(0.1),
      nodes,
      strengths,
      yz;

  if (typeof y !== "function") y = constant$8(y == null ? 0 : +y);

  function force(alpha) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.vy += (yz[i] - node.y) * strengths[i] * alpha;
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    yz = new Array(n);
    for (i = 0; i < n; ++i) {
      strengths[i] = isNaN(yz[i] = +y(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$8(+_), initialize(), force) : strength;
  };

  force.y = function(_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant$8(+_), initialize(), force) : y;
  };

  return force;
};

var ForceMap = {
  center: forceCenter,
  collide: forceCollide,
  nbody: forceManyBody,
  link: forceLink,
  x: forceX,
  y: forceY
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

var prototype$59 = inherits(Force, Transform);

prototype$59.transform = function(_, pulse) {
  var sim = this.value,
      change = pulse.changed(pulse.ADD_REM),
      params = _.modified(ForceParams),
      iters = _.iterations || 300;

  // configure simulation
  if (!sim) {
    this.value = sim = simulation(pulse.source, _);
    sim.on('tick', rerun(pulse.dataflow, this));
    if (!_.static) {
      change = true;
      sim.tick(); // ensure we run on init
    }
    pulse.modifies('index');
  } else {
    if (change) {
      pulse.modifies('index');
      sim.nodes(pulse.source);
    }
    if (params || pulse.changed(pulse.MOD)) {
      setup(sim, _, 0, pulse);
    }
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

prototype$59.finish = function(_, pulse) {
  var dataflow = pulse.dataflow;

  // inspect dependencies, touch link source data
  for (var args=this._argops, j=0, m=args.length, arg; j<m; ++j) {
    arg = args[j];
    if (arg.name !== Forces || arg.op._argval.force !== 'link') {
      continue;
    }
    for (var ops=arg.op._argops, i=0, n=ops.length, op; i<n; ++i) {
      if (ops[i].name === 'links' && (op = ops[i].op.source)) {
        dataflow.pulse(op, dataflow.changeset().reflow());
        break;
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
  var sim = forceSimulation(nodes),
      stopped = false,
      stop = sim.stop,
      restart = sim.restart;

  sim.stopped = function() {
    return stopped;
  };
  sim.restart = function() {
    stopped = false;
    return restart();
  };
  sim.stop = function() {
    stopped = true;
    return stop();
  };

  return setup(sim, _, true).on('end', function() { stopped = true; });
}

function setup(sim, _, init, pulse) {
  var f = array$1(_.forces), i, n, p, name;

  for (i=0, n=ForceParams.length; i<n; ++i) {
    p = ForceParams[i];
    if (p !== Forces && _.modified(p)) sim[p](_[p]);
  }

  for (i=0, n=f.length; i<n; ++i) {
    name = Forces + i;
    p = init || _.modified(Forces, i) ? getForce(f[i])
      : pulse && modified(f[i], pulse) ? sim.force(name)
      : null;
    if (p) sim.force(name, p);
  }

  for (n=(sim.numForces || 0); i<n; ++i) {
    sim.force(Forces + i, null); // remove
  }

  sim.numForces = f.length;
  return sim;
}

function modified(f, pulse) {
  var k, v;
  for (k in f) {
    if (isFunction(v = f[k]) && pulse.modified(accessorFields(v)))
      return 1;
  }
  return 0;
}

function getForce(_) {
  var f, p;

  if (!ForceMap.hasOwnProperty(_.force)) {
    error$1('Unrecognized force: ' + _.force);
  }
  f = ForceMap[_.force]();

  for (p in _) {
    if (isFunction(f[p])) {
      f[p](_[p]);
    }
  }

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

function defaultSeparation(a, b) {
  return a.parent === b.parent ? 1 : 2;
}

function meanX(children) {
  return children.reduce(meanXReduce, 0) / children.length;
}

function meanXReduce(x, c) {
  return x + c.x;
}

function maxY(children) {
  return 1 + children.reduce(maxYReduce, 0);
}

function maxYReduce(y, c) {
  return Math.max(y, c.y);
}

function leafLeft(node) {
  var children;
  while (children = node.children) node = children[0];
  return node;
}

function leafRight(node) {
  var children;
  while (children = node.children) node = children[children.length - 1];
  return node;
}

var cluster = function() {
  var separation = defaultSeparation,
      dx = 1,
      dy = 1,
      nodeSize = false;

  function cluster(root) {
    var previousNode,
        x = 0;

    // First walk, computing the initial x & y values.
    root.eachAfter(function(node) {
      var children = node.children;
      if (children) {
        node.x = meanX(children);
        node.y = maxY(children);
      } else {
        node.x = previousNode ? x += separation(node, previousNode) : 0;
        node.y = 0;
        previousNode = node;
      }
    });

    var left = leafLeft(root),
        right = leafRight(root),
        x0 = left.x - separation(left, right) / 2,
        x1 = right.x + separation(right, left) / 2;

    // Second walk, normalizing x & y to the desired size.
    return root.eachAfter(nodeSize ? function(node) {
      node.x = (node.x - root.x) * dx;
      node.y = (root.y - node.y) * dy;
    } : function(node) {
      node.x = (node.x - x0) / (x1 - x0) * dx;
      node.y = (1 - (root.y ? node.y / root.y : 1)) * dy;
    });
  }

  cluster.separation = function(x) {
    return arguments.length ? (separation = x, cluster) : separation;
  };

  cluster.size = function(x) {
    return arguments.length ? (nodeSize = false, dx = +x[0], dy = +x[1], cluster) : (nodeSize ? null : [dx, dy]);
  };

  cluster.nodeSize = function(x) {
    return arguments.length ? (nodeSize = true, dx = +x[0], dy = +x[1], cluster) : (nodeSize ? [dx, dy] : null);
  };

  return cluster;
};

function count(node) {
  var sum = 0,
      children = node.children,
      i = children && children.length;
  if (!i) sum = 1;
  else while (--i >= 0) sum += children[i].value;
  node.value = sum;
}

var node_count = function() {
  return this.eachAfter(count);
};

var node_each = function(callback) {
  var node = this, current, next = [node], children, i, n;
  do {
    current = next.reverse(), next = [];
    while (node = current.pop()) {
      callback(node), children = node.children;
      if (children) for (i = 0, n = children.length; i < n; ++i) {
        next.push(children[i]);
      }
    }
  } while (next.length);
  return this;
};

var node_eachBefore = function(callback) {
  var node = this, nodes = [node], children, i;
  while (node = nodes.pop()) {
    callback(node), children = node.children;
    if (children) for (i = children.length - 1; i >= 0; --i) {
      nodes.push(children[i]);
    }
  }
  return this;
};

var node_eachAfter = function(callback) {
  var node = this, nodes = [node], next = [], children, i, n;
  while (node = nodes.pop()) {
    next.push(node), children = node.children;
    if (children) for (i = 0, n = children.length; i < n; ++i) {
      nodes.push(children[i]);
    }
  }
  while (node = next.pop()) {
    callback(node);
  }
  return this;
};

var node_sum = function(value) {
  return this.eachAfter(function(node) {
    var sum = +value(node.data) || 0,
        children = node.children,
        i = children && children.length;
    while (--i >= 0) sum += children[i].value;
    node.value = sum;
  });
};

var node_sort = function(compare) {
  return this.eachBefore(function(node) {
    if (node.children) {
      node.children.sort(compare);
    }
  });
};

var node_path = function(end) {
  var start = this,
      ancestor = leastCommonAncestor(start, end),
      nodes = [start];
  while (start !== ancestor) {
    start = start.parent;
    nodes.push(start);
  }
  var k = nodes.length;
  while (end !== ancestor) {
    nodes.splice(k, 0, end);
    end = end.parent;
  }
  return nodes;
};

function leastCommonAncestor(a, b) {
  if (a === b) return a;
  var aNodes = a.ancestors(),
      bNodes = b.ancestors(),
      c = null;
  a = aNodes.pop();
  b = bNodes.pop();
  while (a === b) {
    c = a;
    a = aNodes.pop();
    b = bNodes.pop();
  }
  return c;
}

var node_ancestors = function() {
  var node = this, nodes = [node];
  while (node = node.parent) {
    nodes.push(node);
  }
  return nodes;
};

var node_descendants = function() {
  var nodes = [];
  this.each(function(node) {
    nodes.push(node);
  });
  return nodes;
};

var node_leaves = function() {
  var leaves = [];
  this.eachBefore(function(node) {
    if (!node.children) {
      leaves.push(node);
    }
  });
  return leaves;
};

var node_links = function() {
  var root = this, links = [];
  root.each(function(node) {
    if (node !== root) { // Don’t include the root’s parent, if any.
      links.push({source: node.parent, target: node});
    }
  });
  return links;
};

function hierarchy(data, children) {
  var root = new Node(data),
      valued = +data.value && (root.value = data.value),
      node,
      nodes = [root],
      child,
      childs,
      i,
      n;

  if (children == null) children = defaultChildren;

  while (node = nodes.pop()) {
    if (valued) node.value = +node.data.value;
    if ((childs = children(node.data)) && (n = childs.length)) {
      node.children = new Array(n);
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = node.children[i] = new Node(childs[i]));
        child.parent = node;
        child.depth = node.depth + 1;
      }
    }
  }

  return root.eachBefore(computeHeight);
}

function node_copy() {
  return hierarchy(this).eachBefore(copyData);
}

function defaultChildren(d) {
  return d.children;
}

function copyData(node) {
  node.data = node.data.data;
}

function computeHeight(node) {
  var height = 0;
  do node.height = height;
  while ((node = node.parent) && (node.height < ++height));
}

function Node(data) {
  this.data = data;
  this.depth =
  this.height = 0;
  this.parent = null;
}

Node.prototype = hierarchy.prototype = {
  constructor: Node,
  count: node_count,
  each: node_each,
  eachAfter: node_eachAfter,
  eachBefore: node_eachBefore,
  sum: node_sum,
  sort: node_sort,
  path: node_path,
  ancestors: node_ancestors,
  descendants: node_descendants,
  leaves: node_leaves,
  links: node_links,
  copy: node_copy
};

var slice$5 = Array.prototype.slice;

function shuffle$1(array) {
  var m = array.length,
      t,
      i;

  while (m) {
    i = Math.random() * m-- | 0;
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

var enclose = function(circles) {
  var i = 0, n = (circles = shuffle$1(slice$5.call(circles))).length, B = [], p, e;

  while (i < n) {
    p = circles[i];
    if (e && enclosesWeak(e, p)) ++i;
    else e = encloseBasis(B = extendBasis(B, p)), i = 0;
  }

  return e;
};

function extendBasis(B, p) {
  var i, j;

  if (enclosesWeakAll(p, B)) return [p];

  // If we get here then B must have at least one element.
  for (i = 0; i < B.length; ++i) {
    if (enclosesNot(p, B[i])
        && enclosesWeakAll(encloseBasis2(B[i], p), B)) {
      return [B[i], p];
    }
  }

  // If we get here then B must have at least two elements.
  for (i = 0; i < B.length - 1; ++i) {
    for (j = i + 1; j < B.length; ++j) {
      if (enclosesNot(encloseBasis2(B[i], B[j]), p)
          && enclosesNot(encloseBasis2(B[i], p), B[j])
          && enclosesNot(encloseBasis2(B[j], p), B[i])
          && enclosesWeakAll(encloseBasis3(B[i], B[j], p), B)) {
        return [B[i], B[j], p];
      }
    }
  }

  // If we get here then something is very wrong.
  throw new Error;
}

function enclosesNot(a, b) {
  var dr = a.r - b.r, dx = b.x - a.x, dy = b.y - a.y;
  return dr < 0 || dr * dr < dx * dx + dy * dy;
}

function enclosesWeak(a, b) {
  var dr = a.r - b.r + 1e-6, dx = b.x - a.x, dy = b.y - a.y;
  return dr > 0 && dr * dr > dx * dx + dy * dy;
}

function enclosesWeakAll(a, B) {
  for (var i = 0; i < B.length; ++i) {
    if (!enclosesWeak(a, B[i])) {
      return false;
    }
  }
  return true;
}

function encloseBasis(B) {
  switch (B.length) {
    case 1: return encloseBasis1(B[0]);
    case 2: return encloseBasis2(B[0], B[1]);
    case 3: return encloseBasis3(B[0], B[1], B[2]);
  }
}

function encloseBasis1(a) {
  return {
    x: a.x,
    y: a.y,
    r: a.r
  };
}

function encloseBasis2(a, b) {
  var x1 = a.x, y1 = a.y, r1 = a.r,
      x2 = b.x, y2 = b.y, r2 = b.r,
      x21 = x2 - x1, y21 = y2 - y1, r21 = r2 - r1,
      l = Math.sqrt(x21 * x21 + y21 * y21);
  return {
    x: (x1 + x2 + x21 / l * r21) / 2,
    y: (y1 + y2 + y21 / l * r21) / 2,
    r: (l + r1 + r2) / 2
  };
}

function encloseBasis3(a, b, c) {
  var x1 = a.x, y1 = a.y, r1 = a.r,
      x2 = b.x, y2 = b.y, r2 = b.r,
      x3 = c.x, y3 = c.y, r3 = c.r,
      a2 = x1 - x2,
      a3 = x1 - x3,
      b2 = y1 - y2,
      b3 = y1 - y3,
      c2 = r2 - r1,
      c3 = r3 - r1,
      d1 = x1 * x1 + y1 * y1 - r1 * r1,
      d2 = d1 - x2 * x2 - y2 * y2 + r2 * r2,
      d3 = d1 - x3 * x3 - y3 * y3 + r3 * r3,
      ab = a3 * b2 - a2 * b3,
      xa = (b2 * d3 - b3 * d2) / (ab * 2) - x1,
      xb = (b3 * c2 - b2 * c3) / ab,
      ya = (a3 * d2 - a2 * d3) / (ab * 2) - y1,
      yb = (a2 * c3 - a3 * c2) / ab,
      A = xb * xb + yb * yb - 1,
      B = 2 * (r1 + xa * xb + ya * yb),
      C = xa * xa + ya * ya - r1 * r1,
      r = -(A ? (B + Math.sqrt(B * B - 4 * A * C)) / (2 * A) : C / B);
  return {
    x: x1 + xa + xb * r,
    y: y1 + ya + yb * r,
    r: r
  };
}

function place(a, b, c) {
  var ax = a.x,
      ay = a.y,
      da = b.r + c.r,
      db = a.r + c.r,
      dx = b.x - ax,
      dy = b.y - ay,
      dc = dx * dx + dy * dy;
  if (dc) {
    var x = 0.5 + ((db *= db) - (da *= da)) / (2 * dc),
        y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);
    c.x = ax + x * dx + y * dy;
    c.y = ay + x * dy - y * dx;
  } else {
    c.x = ax + db;
    c.y = ay;
  }
}

function intersects(a, b) {
  var dx = b.x - a.x,
      dy = b.y - a.y,
      dr = a.r + b.r;
  return dr * dr - 1e-6 > dx * dx + dy * dy;
}

function score(node) {
  var a = node._,
      b = node.next._,
      ab = a.r + b.r,
      dx = (a.x * b.r + b.x * a.r) / ab,
      dy = (a.y * b.r + b.y * a.r) / ab;
  return dx * dx + dy * dy;
}

function Node$1(circle) {
  this._ = circle;
  this.next = null;
  this.previous = null;
}

function packEnclose(circles) {
  if (!(n = circles.length)) return 0;

  var a, b, c, n, aa, ca, i, j, k, sj, sk;

  // Place the first circle.
  a = circles[0], a.x = 0, a.y = 0;
  if (!(n > 1)) return a.r;

  // Place the second circle.
  b = circles[1], a.x = -b.r, b.x = a.r, b.y = 0;
  if (!(n > 2)) return a.r + b.r;

  // Place the third circle.
  place(b, a, c = circles[2]);

  // Initialize the front-chain using the first three circles a, b and c.
  a = new Node$1(a), b = new Node$1(b), c = new Node$1(c);
  a.next = c.previous = b;
  b.next = a.previous = c;
  c.next = b.previous = a;

  // Attempt to place each remaining circle…
  pack: for (i = 3; i < n; ++i) {
    place(a._, b._, c = circles[i]), c = new Node$1(c);

    // Find the closest intersecting circle on the front-chain, if any.
    // “Closeness” is determined by linear distance along the front-chain.
    // “Ahead” or “behind” is likewise determined by linear distance.
    j = b.next, k = a.previous, sj = b._.r, sk = a._.r;
    do {
      if (sj <= sk) {
        if (intersects(j._, c._)) {
          b = j, a.next = b, b.previous = a, --i;
          continue pack;
        }
        sj += j._.r, j = j.next;
      } else {
        if (intersects(k._, c._)) {
          a = k, a.next = b, b.previous = a, --i;
          continue pack;
        }
        sk += k._.r, k = k.previous;
      }
    } while (j !== k.next);

    // Success! Insert the new circle c between a and b.
    c.previous = a, c.next = b, a.next = b.previous = b = c;

    // Compute the new closest circle pair to the centroid.
    aa = score(a);
    while ((c = c.next) !== b) {
      if ((ca = score(c)) < aa) {
        a = c, aa = ca;
      }
    }
    b = a.next;
  }

  // Compute the enclosing circle of the front chain.
  a = [b._], c = b; while ((c = c.next) !== b) a.push(c._); c = enclose(a);

  // Translate the circles to put the enclosing circle around the origin.
  for (i = 0; i < n; ++i) a = circles[i], a.x -= c.x, a.y -= c.y;

  return c.r;
}

function optional(f) {
  return f == null ? null : required(f);
}

function required(f) {
  if (typeof f !== "function") throw new Error;
  return f;
}

function constantZero() {
  return 0;
}

var constant$9 = function(x) {
  return function() {
    return x;
  };
};

function defaultRadius(d) {
  return Math.sqrt(d.value);
}

var pack$1 = function() {
  var radius = null,
      dx = 1,
      dy = 1,
      padding = constantZero;

  function pack(root) {
    root.x = dx / 2, root.y = dy / 2;
    if (radius) {
      root.eachBefore(radiusLeaf(radius))
          .eachAfter(packChildren(padding, 0.5))
          .eachBefore(translateChild(1));
    } else {
      root.eachBefore(radiusLeaf(defaultRadius))
          .eachAfter(packChildren(constantZero, 1))
          .eachAfter(packChildren(padding, root.r / Math.min(dx, dy)))
          .eachBefore(translateChild(Math.min(dx, dy) / (2 * root.r)));
    }
    return root;
  }

  pack.radius = function(x) {
    return arguments.length ? (radius = optional(x), pack) : radius;
  };

  pack.size = function(x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], pack) : [dx, dy];
  };

  pack.padding = function(x) {
    return arguments.length ? (padding = typeof x === "function" ? x : constant$9(+x), pack) : padding;
  };

  return pack;
};

function radiusLeaf(radius) {
  return function(node) {
    if (!node.children) {
      node.r = Math.max(0, +radius(node) || 0);
    }
  };
}

function packChildren(padding, k) {
  return function(node) {
    if (children = node.children) {
      var children,
          i,
          n = children.length,
          r = padding(node) * k || 0,
          e;

      if (r) for (i = 0; i < n; ++i) children[i].r += r;
      e = packEnclose(children);
      if (r) for (i = 0; i < n; ++i) children[i].r -= r;
      node.r = e + r;
    }
  };
}

function translateChild(k) {
  return function(node) {
    var parent = node.parent;
    node.r *= k;
    if (parent) {
      node.x = parent.x + k * node.x;
      node.y = parent.y + k * node.y;
    }
  };
}

var roundNode = function(node) {
  node.x0 = Math.round(node.x0);
  node.y0 = Math.round(node.y0);
  node.x1 = Math.round(node.x1);
  node.y1 = Math.round(node.y1);
};

var treemapDice = function(parent, x0, y0, x1, y1) {
  var nodes = parent.children,
      node,
      i = -1,
      n = nodes.length,
      k = parent.value && (x1 - x0) / parent.value;

  while (++i < n) {
    node = nodes[i], node.y0 = y0, node.y1 = y1;
    node.x0 = x0, node.x1 = x0 += node.value * k;
  }
};

var partition$2 = function() {
  var dx = 1,
      dy = 1,
      padding = 0,
      round = false;

  function partition(root) {
    var n = root.height + 1;
    root.x0 =
    root.y0 = padding;
    root.x1 = dx;
    root.y1 = dy / n;
    root.eachBefore(positionNode(dy, n));
    if (round) root.eachBefore(roundNode);
    return root;
  }

  function positionNode(dy, n) {
    return function(node) {
      if (node.children) {
        treemapDice(node, node.x0, dy * (node.depth + 1) / n, node.x1, dy * (node.depth + 2) / n);
      }
      var x0 = node.x0,
          y0 = node.y0,
          x1 = node.x1 - padding,
          y1 = node.y1 - padding;
      if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
      if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
      node.x0 = x0;
      node.y0 = y0;
      node.x1 = x1;
      node.y1 = y1;
    };
  }

  partition.round = function(x) {
    return arguments.length ? (round = !!x, partition) : round;
  };

  partition.size = function(x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], partition) : [dx, dy];
  };

  partition.padding = function(x) {
    return arguments.length ? (padding = +x, partition) : padding;
  };

  return partition;
};

var keyPrefix = "$";
var preroot = {depth: -1};
var ambiguous = {};

function defaultId(d) {
  return d.id;
}

function defaultParentId(d) {
  return d.parentId;
}

var stratify = function() {
  var id = defaultId,
      parentId = defaultParentId;

  function stratify(data) {
    var d,
        i,
        n = data.length,
        root,
        parent,
        node,
        nodes = new Array(n),
        nodeId,
        nodeKey,
        nodeByKey = {};

    for (i = 0; i < n; ++i) {
      d = data[i], node = nodes[i] = new Node(d);
      if ((nodeId = id(d, i, data)) != null && (nodeId += "")) {
        nodeKey = keyPrefix + (node.id = nodeId);
        nodeByKey[nodeKey] = nodeKey in nodeByKey ? ambiguous : node;
      }
    }

    for (i = 0; i < n; ++i) {
      node = nodes[i], nodeId = parentId(data[i], i, data);
      if (nodeId == null || !(nodeId += "")) {
        if (root) throw new Error("multiple roots");
        root = node;
      } else {
        parent = nodeByKey[keyPrefix + nodeId];
        if (!parent) throw new Error("missing: " + nodeId);
        if (parent === ambiguous) throw new Error("ambiguous: " + nodeId);
        if (parent.children) parent.children.push(node);
        else parent.children = [node];
        node.parent = parent;
      }
    }

    if (!root) throw new Error("no root");
    root.parent = preroot;
    root.eachBefore(function(node) { node.depth = node.parent.depth + 1; --n; }).eachBefore(computeHeight);
    root.parent = null;
    if (n > 0) throw new Error("cycle");

    return root;
  }

  stratify.id = function(x) {
    return arguments.length ? (id = required(x), stratify) : id;
  };

  stratify.parentId = function(x) {
    return arguments.length ? (parentId = required(x), stratify) : parentId;
  };

  return stratify;
};

function defaultSeparation$1(a, b) {
  return a.parent === b.parent ? 1 : 2;
}

// function radialSeparation(a, b) {
//   return (a.parent === b.parent ? 1 : 2) / a.depth;
// }

// This function is used to traverse the left contour of a subtree (or
// subforest). It returns the successor of v on this contour. This successor is
// either given by the leftmost child of v or by the thread of v. The function
// returns null if and only if v is on the highest level of its subtree.
function nextLeft(v) {
  var children = v.children;
  return children ? children[0] : v.t;
}

// This function works analogously to nextLeft.
function nextRight(v) {
  var children = v.children;
  return children ? children[children.length - 1] : v.t;
}

// Shifts the current subtree rooted at w+. This is done by increasing
// prelim(w+) and mod(w+) by shift.
function moveSubtree(wm, wp, shift) {
  var change = shift / (wp.i - wm.i);
  wp.c -= change;
  wp.s += shift;
  wm.c += change;
  wp.z += shift;
  wp.m += shift;
}

// All other shifts, applied to the smaller subtrees between w- and w+, are
// performed by this function. To prepare the shifts, we have to adjust
// change(w+), shift(w+), and change(w-).
function executeShifts(v) {
  var shift = 0,
      change = 0,
      children = v.children,
      i = children.length,
      w;
  while (--i >= 0) {
    w = children[i];
    w.z += shift;
    w.m += shift;
    shift += w.s + (change += w.c);
  }
}

// If vi-’s ancestor is a sibling of v, returns vi-’s ancestor. Otherwise,
// returns the specified (default) ancestor.
function nextAncestor(vim, v, ancestor) {
  return vim.a.parent === v.parent ? vim.a : ancestor;
}

function TreeNode(node, i) {
  this._ = node;
  this.parent = null;
  this.children = null;
  this.A = null; // default ancestor
  this.a = this; // ancestor
  this.z = 0; // prelim
  this.m = 0; // mod
  this.c = 0; // change
  this.s = 0; // shift
  this.t = null; // thread
  this.i = i; // number
}

TreeNode.prototype = Object.create(Node.prototype);

function treeRoot(root) {
  var tree = new TreeNode(root, 0),
      node,
      nodes = [tree],
      child,
      children,
      i,
      n;

  while (node = nodes.pop()) {
    if (children = node._.children) {
      node.children = new Array(n = children.length);
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = node.children[i] = new TreeNode(children[i], i));
        child.parent = node;
      }
    }
  }

  (tree.parent = new TreeNode(null, 0)).children = [tree];
  return tree;
}

// Node-link tree diagram using the Reingold-Tilford "tidy" algorithm
var tree = function() {
  var separation = defaultSeparation$1,
      dx = 1,
      dy = 1,
      nodeSize = null;

  function tree(root) {
    var t = treeRoot(root);

    // Compute the layout using Buchheim et al.’s algorithm.
    t.eachAfter(firstWalk), t.parent.m = -t.z;
    t.eachBefore(secondWalk);

    // If a fixed node size is specified, scale x and y.
    if (nodeSize) root.eachBefore(sizeNode);

    // If a fixed tree size is specified, scale x and y based on the extent.
    // Compute the left-most, right-most, and depth-most nodes for extents.
    else {
      var left = root,
          right = root,
          bottom = root;
      root.eachBefore(function(node) {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
        if (node.depth > bottom.depth) bottom = node;
      });
      var s = left === right ? 1 : separation(left, right) / 2,
          tx = s - left.x,
          kx = dx / (right.x + s + tx),
          ky = dy / (bottom.depth || 1);
      root.eachBefore(function(node) {
        node.x = (node.x + tx) * kx;
        node.y = node.depth * ky;
      });
    }

    return root;
  }

  // Computes a preliminary x-coordinate for v. Before that, FIRST WALK is
  // applied recursively to the children of v, as well as the function
  // APPORTION. After spacing out the children by calling EXECUTE SHIFTS, the
  // node v is placed to the midpoint of its outermost children.
  function firstWalk(v) {
    var children = v.children,
        siblings = v.parent.children,
        w = v.i ? siblings[v.i - 1] : null;
    if (children) {
      executeShifts(v);
      var midpoint = (children[0].z + children[children.length - 1].z) / 2;
      if (w) {
        v.z = w.z + separation(v._, w._);
        v.m = v.z - midpoint;
      } else {
        v.z = midpoint;
      }
    } else if (w) {
      v.z = w.z + separation(v._, w._);
    }
    v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
  }

  // Computes all real x-coordinates by summing up the modifiers recursively.
  function secondWalk(v) {
    v._.x = v.z + v.parent.m;
    v.m += v.parent.m;
  }

  // The core of the algorithm. Here, a new subtree is combined with the
  // previous subtrees. Threads are used to traverse the inside and outside
  // contours of the left and right subtree up to the highest common level. The
  // vertices used for the traversals are vi+, vi-, vo-, and vo+, where the
  // superscript o means outside and i means inside, the subscript - means left
  // subtree and + means right subtree. For summing up the modifiers along the
  // contour, we use respective variables si+, si-, so-, and so+. Whenever two
  // nodes of the inside contours conflict, we compute the left one of the
  // greatest uncommon ancestors using the function ANCESTOR and call MOVE
  // SUBTREE to shift the subtree and prepare the shifts of smaller subtrees.
  // Finally, we add a new thread (if necessary).
  function apportion(v, w, ancestor) {
    if (w) {
      var vip = v,
          vop = v,
          vim = w,
          vom = vip.parent.children[0],
          sip = vip.m,
          sop = vop.m,
          sim = vim.m,
          som = vom.m,
          shift;
      while (vim = nextRight(vim), vip = nextLeft(vip), vim && vip) {
        vom = nextLeft(vom);
        vop = nextRight(vop);
        vop.a = v;
        shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
        if (shift > 0) {
          moveSubtree(nextAncestor(vim, v, ancestor), v, shift);
          sip += shift;
          sop += shift;
        }
        sim += vim.m;
        sip += vip.m;
        som += vom.m;
        sop += vop.m;
      }
      if (vim && !nextRight(vop)) {
        vop.t = vim;
        vop.m += sim - sop;
      }
      if (vip && !nextLeft(vom)) {
        vom.t = vip;
        vom.m += sip - som;
        ancestor = v;
      }
    }
    return ancestor;
  }

  function sizeNode(node) {
    node.x *= dx;
    node.y = node.depth * dy;
  }

  tree.separation = function(x) {
    return arguments.length ? (separation = x, tree) : separation;
  };

  tree.size = function(x) {
    return arguments.length ? (nodeSize = false, dx = +x[0], dy = +x[1], tree) : (nodeSize ? null : [dx, dy]);
  };

  tree.nodeSize = function(x) {
    return arguments.length ? (nodeSize = true, dx = +x[0], dy = +x[1], tree) : (nodeSize ? [dx, dy] : null);
  };

  return tree;
};

var treemapSlice = function(parent, x0, y0, x1, y1) {
  var nodes = parent.children,
      node,
      i = -1,
      n = nodes.length,
      k = parent.value && (y1 - y0) / parent.value;

  while (++i < n) {
    node = nodes[i], node.x0 = x0, node.x1 = x1;
    node.y0 = y0, node.y1 = y0 += node.value * k;
  }
};

var phi = (1 + Math.sqrt(5)) / 2;

function squarifyRatio(ratio, parent, x0, y0, x1, y1) {
  var rows = [],
      nodes = parent.children,
      row,
      nodeValue,
      i0 = 0,
      i1 = 0,
      n = nodes.length,
      dx, dy,
      value = parent.value,
      sumValue,
      minValue,
      maxValue,
      newRatio,
      minRatio,
      alpha,
      beta;

  while (i0 < n) {
    dx = x1 - x0, dy = y1 - y0;

    // Find the next non-empty node.
    do sumValue = nodes[i1++].value; while (!sumValue && i1 < n);
    minValue = maxValue = sumValue;
    alpha = Math.max(dy / dx, dx / dy) / (value * ratio);
    beta = sumValue * sumValue * alpha;
    minRatio = Math.max(maxValue / beta, beta / minValue);

    // Keep adding nodes while the aspect ratio maintains or improves.
    for (; i1 < n; ++i1) {
      sumValue += nodeValue = nodes[i1].value;
      if (nodeValue < minValue) minValue = nodeValue;
      if (nodeValue > maxValue) maxValue = nodeValue;
      beta = sumValue * sumValue * alpha;
      newRatio = Math.max(maxValue / beta, beta / minValue);
      if (newRatio > minRatio) { sumValue -= nodeValue; break; }
      minRatio = newRatio;
    }

    // Position and record the row orientation.
    rows.push(row = {value: sumValue, dice: dx < dy, children: nodes.slice(i0, i1)});
    if (row.dice) treemapDice(row, x0, y0, x1, value ? y0 += dy * sumValue / value : y1);
    else treemapSlice(row, x0, y0, value ? x0 += dx * sumValue / value : x1, y1);
    value -= sumValue, i0 = i1;
  }

  return rows;
}

var treemapSquarify = (function custom(ratio) {

  function squarify(parent, x0, y0, x1, y1) {
    squarifyRatio(ratio, parent, x0, y0, x1, y1);
  }

  squarify.ratio = function(x) {
    return custom((x = +x) > 1 ? x : 1);
  };

  return squarify;
})(phi);

var treemap = function() {
  var tile = treemapSquarify,
      round = false,
      dx = 1,
      dy = 1,
      paddingStack = [0],
      paddingInner = constantZero,
      paddingTop = constantZero,
      paddingRight = constantZero,
      paddingBottom = constantZero,
      paddingLeft = constantZero;

  function treemap(root) {
    root.x0 =
    root.y0 = 0;
    root.x1 = dx;
    root.y1 = dy;
    root.eachBefore(positionNode);
    paddingStack = [0];
    if (round) root.eachBefore(roundNode);
    return root;
  }

  function positionNode(node) {
    var p = paddingStack[node.depth],
        x0 = node.x0 + p,
        y0 = node.y0 + p,
        x1 = node.x1 - p,
        y1 = node.y1 - p;
    if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
    if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
    node.x0 = x0;
    node.y0 = y0;
    node.x1 = x1;
    node.y1 = y1;
    if (node.children) {
      p = paddingStack[node.depth + 1] = paddingInner(node) / 2;
      x0 += paddingLeft(node) - p;
      y0 += paddingTop(node) - p;
      x1 -= paddingRight(node) - p;
      y1 -= paddingBottom(node) - p;
      if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
      if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
      tile(node, x0, y0, x1, y1);
    }
  }

  treemap.round = function(x) {
    return arguments.length ? (round = !!x, treemap) : round;
  };

  treemap.size = function(x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], treemap) : [dx, dy];
  };

  treemap.tile = function(x) {
    return arguments.length ? (tile = required(x), treemap) : tile;
  };

  treemap.padding = function(x) {
    return arguments.length ? treemap.paddingInner(x).paddingOuter(x) : treemap.paddingInner();
  };

  treemap.paddingInner = function(x) {
    return arguments.length ? (paddingInner = typeof x === "function" ? x : constant$9(+x), treemap) : paddingInner;
  };

  treemap.paddingOuter = function(x) {
    return arguments.length ? treemap.paddingTop(x).paddingRight(x).paddingBottom(x).paddingLeft(x) : treemap.paddingTop();
  };

  treemap.paddingTop = function(x) {
    return arguments.length ? (paddingTop = typeof x === "function" ? x : constant$9(+x), treemap) : paddingTop;
  };

  treemap.paddingRight = function(x) {
    return arguments.length ? (paddingRight = typeof x === "function" ? x : constant$9(+x), treemap) : paddingRight;
  };

  treemap.paddingBottom = function(x) {
    return arguments.length ? (paddingBottom = typeof x === "function" ? x : constant$9(+x), treemap) : paddingBottom;
  };

  treemap.paddingLeft = function(x) {
    return arguments.length ? (paddingLeft = typeof x === "function" ? x : constant$9(+x), treemap) : paddingLeft;
  };

  return treemap;
};

var treemapBinary = function(parent, x0, y0, x1, y1) {
  var nodes = parent.children,
      i, n = nodes.length,
      sum, sums = new Array(n + 1);

  for (sums[0] = sum = i = 0; i < n; ++i) {
    sums[i + 1] = sum += nodes[i].value;
  }

  partition(0, n, parent.value, x0, y0, x1, y1);

  function partition(i, j, value, x0, y0, x1, y1) {
    if (i >= j - 1) {
      var node = nodes[i];
      node.x0 = x0, node.y0 = y0;
      node.x1 = x1, node.y1 = y1;
      return;
    }

    var valueOffset = sums[i],
        valueTarget = (value / 2) + valueOffset,
        k = i + 1,
        hi = j - 1;

    while (k < hi) {
      var mid = k + hi >>> 1;
      if (sums[mid] < valueTarget) k = mid + 1;
      else hi = mid;
    }

    if ((valueTarget - sums[k - 1]) < (sums[k] - valueTarget) && i + 1 < k) --k;

    var valueLeft = sums[k] - valueOffset,
        valueRight = value - valueLeft;

    if ((x1 - x0) > (y1 - y0)) {
      var xk = (x0 * valueRight + x1 * valueLeft) / value;
      partition(i, k, valueLeft, x0, y0, xk, y1);
      partition(k, j, valueRight, xk, y0, x1, y1);
    } else {
      var yk = (y0 * valueRight + y1 * valueLeft) / value;
      partition(i, k, valueLeft, x0, y0, x1, yk);
      partition(k, j, valueRight, x0, yk, x1, y1);
    }
  }
};

var treemapSliceDice = function(parent, x0, y0, x1, y1) {
  (parent.depth & 1 ? treemapSlice : treemapDice)(parent, x0, y0, x1, y1);
};

var treemapResquarify = (function custom(ratio) {

  function resquarify(parent, x0, y0, x1, y1) {
    if ((rows = parent._squarify) && (rows.ratio === ratio)) {
      var rows,
          row,
          nodes,
          i,
          j = -1,
          n,
          m = rows.length,
          value = parent.value;

      while (++j < m) {
        row = rows[j], nodes = row.children;
        for (i = row.value = 0, n = nodes.length; i < n; ++i) row.value += nodes[i].value;
        if (row.dice) treemapDice(row, x0, y0, x1, y0 += (y1 - y0) * row.value / value);
        else treemapSlice(row, x0, y0, x0 += (x1 - x0) * row.value / value, y1);
        value -= row.value;
      }
    } else {
      parent._squarify = rows = squarifyRatio(ratio, parent, x0, y0, x1, y1);
      rows.ratio = ratio;
    }
  }

  resquarify.ratio = function(x) {
    return custom((x = +x) > 1 ? x : 1);
  };

  return resquarify;
})(phi);

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

var prototype$60 = inherits(Nest, Transform);

function children(n) {
  return n.values;
}

prototype$60.transform = function(_, pulse) {
  if (!pulse.source) {
    error$1('Nest transform requires an upstream data source.');
  }

  var key$$1 = _.key || tupleid,
      root, tree$$1, map, mod;

  if (!this.value || (mod = _.modified()) || pulse.changed()) {
    root = array$1(_.keys)
      .reduce(function(n, k) {
        n.key(k);
        return n;
      }, nest())
      .entries(pulse.source);
    tree$$1 = hierarchy({values: root}, children);
    map = tree$$1.lookup = {};
    tree$$1.each(function(node) {
      if (tupleid(node.data) != null) {
        map[key$$1(node.data)] = node;
      }
    });
    this.value = tree$$1;
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

var prototype$61 = inherits(Stratify, Transform);

prototype$61.transform = function(_, pulse) {
  if (!pulse.source) {
    error$1('Stratify transform requires an upstream data source.');
  }

  var mod = _.modified(), tree$$1, map,
      run = !this.value
         || mod
         || pulse.changed(pulse.ADD_REM)
         || pulse.modified(_.key.fields)
         || pulse.modified(_.parentKey.fields);

  if (run) {
    tree$$1 = stratify().id(_.key).parentId(_.parentKey)(pulse.source);
    map = tree$$1.lookup = {};
    tree$$1.each(function(node) { map[_.key(node.data)] = node; });
    this.value = tree$$1;
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

var prototype$62 = inherits(TreeLinks, Transform);

function parentTuple(node) {
  var p;
  return node.parent
      && (p=node.parent.data)
      && (tupleid(p) != null) && p;
}

prototype$62.transform = function(_, pulse) {
  if (!pulse.source || !pulse.source.root) {
    error$1('TreeLinks transform requires a backing tree data source.');
  }

  var root = pulse.source.root,
      nodes = root.lookup,
      links = this.value,
      key$$1 = _.key || tupleid,
      mods = {},
      out = pulse.fork();

  function modify(id$$1) {
    var link = links[id$$1];
    if (link) {
      mods[id$$1] = 1;
      out.mod.push(link);
    }
  }

  // process removed tuples
  // assumes that if a parent node is removed the child will be, too.
  pulse.visit(pulse.REM, function(t) {
    var id$$1 = key$$1(t),
        link = links[id$$1];
    if (link) {
      delete links[id$$1];
      out.rem.push(link);
    }
  });

  // create new link instances for added nodes with valid parents
  pulse.visit(pulse.ADD, function(t) {
    var id$$1 = key$$1(t), p;
    if (p = parentTuple(nodes[id$$1])) {
      out.add.push(links[id$$1] = ingest({source: p, target: t}));
      mods[id$$1] = 1;
    }
  });

  // process modified nodes and their children
  pulse.visit(pulse.MOD, function(t) {
    var id$$1 = key$$1(t),
        node = nodes[id$$1],
        kids = node.children;

    modify(id$$1);
    if (kids) for (var i=0, n=kids.length; i<n; ++i) {
      if (!mods[(id$$1=key$$1(kids[i].data))]) modify(id$$1);
    }
  });

  return out;
};

var Tiles = {
  binary: treemapBinary,
  dice: treemapDice,
  slice: treemapSlice,
  slicedice: treemapSliceDice,
  squarify: treemapSquarify,
  resquarify: treemapResquarify
};

var Layouts = {
  tidy: tree,
  cluster: cluster
};

/**
 * Tree layout generator. Supports both 'tidy' and 'cluster' layouts.
 */
function treeLayout(method) {
  var m = method || 'tidy';
  if (Layouts.hasOwnProperty(m)) return Layouts[m]();
  else error$1('Unrecognized Tree layout method: ' + m);
}

/**
 * Treemap layout generator. Adds 'method' and 'ratio' parameters
 * to configure the underlying tile method.
 */
function treemapLayout() {
  var x = treemap();
  x.ratio = function(_) {
    var t = x.tile();
    if (t.ratio) x.tile(t.ratio(_));
  };
  x.method = function(_) {
    if (Tiles.hasOwnProperty(_)) x.tile(Tiles[_]);
    else error$1('Unrecognized Treemap layout method: ' + _);
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

var prototype$63 = inherits(HierarchyLayout, Transform);

prototype$63.transform = function(_, pulse) {
  if (!pulse.source || !pulse.source.root) {
    error$1(this.constructor.name
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
    error$1(err);
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
Partition.prototype.layout = partition$2;
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
Pack.prototype.layout = pack$1;
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
};

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

var constant$10 = function(x) {
  return function() {
    return x;
  };
};

function x$4(d) {
  return d[0];
}

function y$4(d) {
  return d[1];
}

function RedBlackTree() {
  this._ = null; // root node
}

function RedBlackNode(node) {
  node.U = // parent node
  node.C = // color - true for red, false for black
  node.L = // left node
  node.R = // right node
  node.P = // previous node
  node.N = null; // next node
}

RedBlackTree.prototype = {
  constructor: RedBlackTree,

  insert: function(after, node) {
    var parent, grandpa, uncle;

    if (after) {
      node.P = after;
      node.N = after.N;
      if (after.N) after.N.P = node;
      after.N = node;
      if (after.R) {
        after = after.R;
        while (after.L) after = after.L;
        after.L = node;
      } else {
        after.R = node;
      }
      parent = after;
    } else if (this._) {
      after = RedBlackFirst(this._);
      node.P = null;
      node.N = after;
      after.P = after.L = node;
      parent = after;
    } else {
      node.P = node.N = null;
      this._ = node;
      parent = null;
    }
    node.L = node.R = null;
    node.U = parent;
    node.C = true;

    after = node;
    while (parent && parent.C) {
      grandpa = parent.U;
      if (parent === grandpa.L) {
        uncle = grandpa.R;
        if (uncle && uncle.C) {
          parent.C = uncle.C = false;
          grandpa.C = true;
          after = grandpa;
        } else {
          if (after === parent.R) {
            RedBlackRotateLeft(this, parent);
            after = parent;
            parent = after.U;
          }
          parent.C = false;
          grandpa.C = true;
          RedBlackRotateRight(this, grandpa);
        }
      } else {
        uncle = grandpa.L;
        if (uncle && uncle.C) {
          parent.C = uncle.C = false;
          grandpa.C = true;
          after = grandpa;
        } else {
          if (after === parent.L) {
            RedBlackRotateRight(this, parent);
            after = parent;
            parent = after.U;
          }
          parent.C = false;
          grandpa.C = true;
          RedBlackRotateLeft(this, grandpa);
        }
      }
      parent = after.U;
    }
    this._.C = false;
  },

  remove: function(node) {
    if (node.N) node.N.P = node.P;
    if (node.P) node.P.N = node.N;
    node.N = node.P = null;

    var parent = node.U,
        sibling,
        left = node.L,
        right = node.R,
        next,
        red;

    if (!left) next = right;
    else if (!right) next = left;
    else next = RedBlackFirst(right);

    if (parent) {
      if (parent.L === node) parent.L = next;
      else parent.R = next;
    } else {
      this._ = next;
    }

    if (left && right) {
      red = next.C;
      next.C = node.C;
      next.L = left;
      left.U = next;
      if (next !== right) {
        parent = next.U;
        next.U = node.U;
        node = next.R;
        parent.L = node;
        next.R = right;
        right.U = next;
      } else {
        next.U = parent;
        parent = next;
        node = next.R;
      }
    } else {
      red = node.C;
      node = next;
    }

    if (node) node.U = parent;
    if (red) return;
    if (node && node.C) { node.C = false; return; }

    do {
      if (node === this._) break;
      if (node === parent.L) {
        sibling = parent.R;
        if (sibling.C) {
          sibling.C = false;
          parent.C = true;
          RedBlackRotateLeft(this, parent);
          sibling = parent.R;
        }
        if ((sibling.L && sibling.L.C)
            || (sibling.R && sibling.R.C)) {
          if (!sibling.R || !sibling.R.C) {
            sibling.L.C = false;
            sibling.C = true;
            RedBlackRotateRight(this, sibling);
            sibling = parent.R;
          }
          sibling.C = parent.C;
          parent.C = sibling.R.C = false;
          RedBlackRotateLeft(this, parent);
          node = this._;
          break;
        }
      } else {
        sibling = parent.L;
        if (sibling.C) {
          sibling.C = false;
          parent.C = true;
          RedBlackRotateRight(this, parent);
          sibling = parent.L;
        }
        if ((sibling.L && sibling.L.C)
          || (sibling.R && sibling.R.C)) {
          if (!sibling.L || !sibling.L.C) {
            sibling.R.C = false;
            sibling.C = true;
            RedBlackRotateLeft(this, sibling);
            sibling = parent.L;
          }
          sibling.C = parent.C;
          parent.C = sibling.L.C = false;
          RedBlackRotateRight(this, parent);
          node = this._;
          break;
        }
      }
      sibling.C = true;
      node = parent;
      parent = parent.U;
    } while (!node.C);

    if (node) node.C = false;
  }
};

function RedBlackRotateLeft(tree, node) {
  var p = node,
      q = node.R,
      parent = p.U;

  if (parent) {
    if (parent.L === p) parent.L = q;
    else parent.R = q;
  } else {
    tree._ = q;
  }

  q.U = parent;
  p.U = q;
  p.R = q.L;
  if (p.R) p.R.U = p;
  q.L = p;
}

function RedBlackRotateRight(tree, node) {
  var p = node,
      q = node.L,
      parent = p.U;

  if (parent) {
    if (parent.L === p) parent.L = q;
    else parent.R = q;
  } else {
    tree._ = q;
  }

  q.U = parent;
  p.U = q;
  p.L = q.R;
  if (p.L) p.L.U = p;
  q.R = p;
}

function RedBlackFirst(node) {
  while (node.L) node = node.L;
  return node;
}

function createEdge(left, right, v0, v1) {
  var edge = [null, null],
      index = edges.push(edge) - 1;
  edge.left = left;
  edge.right = right;
  if (v0) setEdgeEnd(edge, left, right, v0);
  if (v1) setEdgeEnd(edge, right, left, v1);
  cells[left.index].halfedges.push(index);
  cells[right.index].halfedges.push(index);
  return edge;
}

function createBorderEdge(left, v0, v1) {
  var edge = [v0, v1];
  edge.left = left;
  return edge;
}

function setEdgeEnd(edge, left, right, vertex) {
  if (!edge[0] && !edge[1]) {
    edge[0] = vertex;
    edge.left = left;
    edge.right = right;
  } else if (edge.left === right) {
    edge[1] = vertex;
  } else {
    edge[0] = vertex;
  }
}

// Liang–Barsky line clipping.
function clipEdge(edge, x0, y0, x1, y1) {
  var a = edge[0],
      b = edge[1],
      ax = a[0],
      ay = a[1],
      bx = b[0],
      by = b[1],
      t0 = 0,
      t1 = 1,
      dx = bx - ax,
      dy = by - ay,
      r;

  r = x0 - ax;
  if (!dx && r > 0) return;
  r /= dx;
  if (dx < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dx > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = x1 - ax;
  if (!dx && r < 0) return;
  r /= dx;
  if (dx < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dx > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  r = y0 - ay;
  if (!dy && r > 0) return;
  r /= dy;
  if (dy < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dy > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = y1 - ay;
  if (!dy && r < 0) return;
  r /= dy;
  if (dy < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dy > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  if (!(t0 > 0) && !(t1 < 1)) return true; // TODO Better check?

  if (t0 > 0) edge[0] = [ax + t0 * dx, ay + t0 * dy];
  if (t1 < 1) edge[1] = [ax + t1 * dx, ay + t1 * dy];
  return true;
}

function connectEdge(edge, x0, y0, x1, y1) {
  var v1 = edge[1];
  if (v1) return true;

  var v0 = edge[0],
      left = edge.left,
      right = edge.right,
      lx = left[0],
      ly = left[1],
      rx = right[0],
      ry = right[1],
      fx = (lx + rx) / 2,
      fy = (ly + ry) / 2,
      fm,
      fb;

  if (ry === ly) {
    if (fx < x0 || fx >= x1) return;
    if (lx > rx) {
      if (!v0) v0 = [fx, y0];
      else if (v0[1] >= y1) return;
      v1 = [fx, y1];
    } else {
      if (!v0) v0 = [fx, y1];
      else if (v0[1] < y0) return;
      v1 = [fx, y0];
    }
  } else {
    fm = (lx - rx) / (ry - ly);
    fb = fy - fm * fx;
    if (fm < -1 || fm > 1) {
      if (lx > rx) {
        if (!v0) v0 = [(y0 - fb) / fm, y0];
        else if (v0[1] >= y1) return;
        v1 = [(y1 - fb) / fm, y1];
      } else {
        if (!v0) v0 = [(y1 - fb) / fm, y1];
        else if (v0[1] < y0) return;
        v1 = [(y0 - fb) / fm, y0];
      }
    } else {
      if (ly < ry) {
        if (!v0) v0 = [x0, fm * x0 + fb];
        else if (v0[0] >= x1) return;
        v1 = [x1, fm * x1 + fb];
      } else {
        if (!v0) v0 = [x1, fm * x1 + fb];
        else if (v0[0] < x0) return;
        v1 = [x0, fm * x0 + fb];
      }
    }
  }

  edge[0] = v0;
  edge[1] = v1;
  return true;
}

function clipEdges(x0, y0, x1, y1) {
  var i = edges.length,
      edge;

  while (i--) {
    if (!connectEdge(edge = edges[i], x0, y0, x1, y1)
        || !clipEdge(edge, x0, y0, x1, y1)
        || !(Math.abs(edge[0][0] - edge[1][0]) > epsilon$3
            || Math.abs(edge[0][1] - edge[1][1]) > epsilon$3)) {
      delete edges[i];
    }
  }
}

function createCell(site) {
  return cells[site.index] = {
    site: site,
    halfedges: []
  };
}

function cellHalfedgeAngle(cell, edge) {
  var site = cell.site,
      va = edge.left,
      vb = edge.right;
  if (site === vb) vb = va, va = site;
  if (vb) return Math.atan2(vb[1] - va[1], vb[0] - va[0]);
  if (site === va) va = edge[1], vb = edge[0];
  else va = edge[0], vb = edge[1];
  return Math.atan2(va[0] - vb[0], vb[1] - va[1]);
}

function cellHalfedgeStart(cell, edge) {
  return edge[+(edge.left !== cell.site)];
}

function cellHalfedgeEnd(cell, edge) {
  return edge[+(edge.left === cell.site)];
}

function sortCellHalfedges() {
  for (var i = 0, n = cells.length, cell, halfedges, j, m; i < n; ++i) {
    if ((cell = cells[i]) && (m = (halfedges = cell.halfedges).length)) {
      var index = new Array(m),
          array = new Array(m);
      for (j = 0; j < m; ++j) index[j] = j, array[j] = cellHalfedgeAngle(cell, edges[halfedges[j]]);
      index.sort(function(i, j) { return array[j] - array[i]; });
      for (j = 0; j < m; ++j) array[j] = halfedges[index[j]];
      for (j = 0; j < m; ++j) halfedges[j] = array[j];
    }
  }
}

function clipCells(x0, y0, x1, y1) {
  var nCells = cells.length,
      iCell,
      cell,
      site,
      iHalfedge,
      halfedges,
      nHalfedges,
      start,
      startX,
      startY,
      end,
      endX,
      endY,
      cover = true;

  for (iCell = 0; iCell < nCells; ++iCell) {
    if (cell = cells[iCell]) {
      site = cell.site;
      halfedges = cell.halfedges;
      iHalfedge = halfedges.length;

      // Remove any dangling clipped edges.
      while (iHalfedge--) {
        if (!edges[halfedges[iHalfedge]]) {
          halfedges.splice(iHalfedge, 1);
        }
      }

      // Insert any border edges as necessary.
      iHalfedge = 0, nHalfedges = halfedges.length;
      while (iHalfedge < nHalfedges) {
        end = cellHalfedgeEnd(cell, edges[halfedges[iHalfedge]]), endX = end[0], endY = end[1];
        start = cellHalfedgeStart(cell, edges[halfedges[++iHalfedge % nHalfedges]]), startX = start[0], startY = start[1];
        if (Math.abs(endX - startX) > epsilon$3 || Math.abs(endY - startY) > epsilon$3) {
          halfedges.splice(iHalfedge, 0, edges.push(createBorderEdge(site, end,
              Math.abs(endX - x0) < epsilon$3 && y1 - endY > epsilon$3 ? [x0, Math.abs(startX - x0) < epsilon$3 ? startY : y1]
              : Math.abs(endY - y1) < epsilon$3 && x1 - endX > epsilon$3 ? [Math.abs(startY - y1) < epsilon$3 ? startX : x1, y1]
              : Math.abs(endX - x1) < epsilon$3 && endY - y0 > epsilon$3 ? [x1, Math.abs(startX - x1) < epsilon$3 ? startY : y0]
              : Math.abs(endY - y0) < epsilon$3 && endX - x0 > epsilon$3 ? [Math.abs(startY - y0) < epsilon$3 ? startX : x0, y0]
              : null)) - 1);
          ++nHalfedges;
        }
      }

      if (nHalfedges) cover = false;
    }
  }

  // If there weren’t any edges, have the closest site cover the extent.
  // It doesn’t matter which corner of the extent we measure!
  if (cover) {
    var dx, dy, d2, dc = Infinity;

    for (iCell = 0, cover = null; iCell < nCells; ++iCell) {
      if (cell = cells[iCell]) {
        site = cell.site;
        dx = site[0] - x0;
        dy = site[1] - y0;
        d2 = dx * dx + dy * dy;
        if (d2 < dc) dc = d2, cover = cell;
      }
    }

    if (cover) {
      var v00 = [x0, y0], v01 = [x0, y1], v11 = [x1, y1], v10 = [x1, y0];
      cover.halfedges.push(
        edges.push(createBorderEdge(site = cover.site, v00, v01)) - 1,
        edges.push(createBorderEdge(site, v01, v11)) - 1,
        edges.push(createBorderEdge(site, v11, v10)) - 1,
        edges.push(createBorderEdge(site, v10, v00)) - 1
      );
    }
  }

  // Lastly delete any cells with no edges; these were entirely clipped.
  for (iCell = 0; iCell < nCells; ++iCell) {
    if (cell = cells[iCell]) {
      if (!cell.halfedges.length) {
        delete cells[iCell];
      }
    }
  }
}

var circlePool = [];

var firstCircle;

function Circle() {
  RedBlackNode(this);
  this.x =
  this.y =
  this.arc =
  this.site =
  this.cy = null;
}

function attachCircle(arc) {
  var lArc = arc.P,
      rArc = arc.N;

  if (!lArc || !rArc) return;

  var lSite = lArc.site,
      cSite = arc.site,
      rSite = rArc.site;

  if (lSite === rSite) return;

  var bx = cSite[0],
      by = cSite[1],
      ax = lSite[0] - bx,
      ay = lSite[1] - by,
      cx = rSite[0] - bx,
      cy = rSite[1] - by;

  var d = 2 * (ax * cy - ay * cx);
  if (d >= -epsilon2$2) return;

  var ha = ax * ax + ay * ay,
      hc = cx * cx + cy * cy,
      x = (cy * ha - ay * hc) / d,
      y = (ax * hc - cx * ha) / d;

  var circle = circlePool.pop() || new Circle;
  circle.arc = arc;
  circle.site = cSite;
  circle.x = x + bx;
  circle.y = (circle.cy = y + by) + Math.sqrt(x * x + y * y); // y bottom

  arc.circle = circle;

  var before = null,
      node = circles._;

  while (node) {
    if (circle.y < node.y || (circle.y === node.y && circle.x <= node.x)) {
      if (node.L) node = node.L;
      else { before = node.P; break; }
    } else {
      if (node.R) node = node.R;
      else { before = node; break; }
    }
  }

  circles.insert(before, circle);
  if (!before) firstCircle = circle;
}

function detachCircle(arc) {
  var circle = arc.circle;
  if (circle) {
    if (!circle.P) firstCircle = circle.N;
    circles.remove(circle);
    circlePool.push(circle);
    RedBlackNode(circle);
    arc.circle = null;
  }
}

var beachPool = [];

function Beach() {
  RedBlackNode(this);
  this.edge =
  this.site =
  this.circle = null;
}

function createBeach(site) {
  var beach = beachPool.pop() || new Beach;
  beach.site = site;
  return beach;
}

function detachBeach(beach) {
  detachCircle(beach);
  beaches.remove(beach);
  beachPool.push(beach);
  RedBlackNode(beach);
}

function removeBeach(beach) {
  var circle = beach.circle,
      x = circle.x,
      y = circle.cy,
      vertex = [x, y],
      previous = beach.P,
      next = beach.N,
      disappearing = [beach];

  detachBeach(beach);

  var lArc = previous;
  while (lArc.circle
      && Math.abs(x - lArc.circle.x) < epsilon$3
      && Math.abs(y - lArc.circle.cy) < epsilon$3) {
    previous = lArc.P;
    disappearing.unshift(lArc);
    detachBeach(lArc);
    lArc = previous;
  }

  disappearing.unshift(lArc);
  detachCircle(lArc);

  var rArc = next;
  while (rArc.circle
      && Math.abs(x - rArc.circle.x) < epsilon$3
      && Math.abs(y - rArc.circle.cy) < epsilon$3) {
    next = rArc.N;
    disappearing.push(rArc);
    detachBeach(rArc);
    rArc = next;
  }

  disappearing.push(rArc);
  detachCircle(rArc);

  var nArcs = disappearing.length,
      iArc;
  for (iArc = 1; iArc < nArcs; ++iArc) {
    rArc = disappearing[iArc];
    lArc = disappearing[iArc - 1];
    setEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
  }

  lArc = disappearing[0];
  rArc = disappearing[nArcs - 1];
  rArc.edge = createEdge(lArc.site, rArc.site, null, vertex);

  attachCircle(lArc);
  attachCircle(rArc);
}

function addBeach(site) {
  var x = site[0],
      directrix = site[1],
      lArc,
      rArc,
      dxl,
      dxr,
      node = beaches._;

  while (node) {
    dxl = leftBreakPoint(node, directrix) - x;
    if (dxl > epsilon$3) node = node.L; else {
      dxr = x - rightBreakPoint(node, directrix);
      if (dxr > epsilon$3) {
        if (!node.R) {
          lArc = node;
          break;
        }
        node = node.R;
      } else {
        if (dxl > -epsilon$3) {
          lArc = node.P;
          rArc = node;
        } else if (dxr > -epsilon$3) {
          lArc = node;
          rArc = node.N;
        } else {
          lArc = rArc = node;
        }
        break;
      }
    }
  }

  createCell(site);
  var newArc = createBeach(site);
  beaches.insert(lArc, newArc);

  if (!lArc && !rArc) return;

  if (lArc === rArc) {
    detachCircle(lArc);
    rArc = createBeach(lArc.site);
    beaches.insert(newArc, rArc);
    newArc.edge = rArc.edge = createEdge(lArc.site, newArc.site);
    attachCircle(lArc);
    attachCircle(rArc);
    return;
  }

  if (!rArc) { // && lArc
    newArc.edge = createEdge(lArc.site, newArc.site);
    return;
  }

  // else lArc !== rArc
  detachCircle(lArc);
  detachCircle(rArc);

  var lSite = lArc.site,
      ax = lSite[0],
      ay = lSite[1],
      bx = site[0] - ax,
      by = site[1] - ay,
      rSite = rArc.site,
      cx = rSite[0] - ax,
      cy = rSite[1] - ay,
      d = 2 * (bx * cy - by * cx),
      hb = bx * bx + by * by,
      hc = cx * cx + cy * cy,
      vertex = [(cy * hb - by * hc) / d + ax, (bx * hc - cx * hb) / d + ay];

  setEdgeEnd(rArc.edge, lSite, rSite, vertex);
  newArc.edge = createEdge(lSite, site, null, vertex);
  rArc.edge = createEdge(site, rSite, null, vertex);
  attachCircle(lArc);
  attachCircle(rArc);
}

function leftBreakPoint(arc, directrix) {
  var site = arc.site,
      rfocx = site[0],
      rfocy = site[1],
      pby2 = rfocy - directrix;

  if (!pby2) return rfocx;

  var lArc = arc.P;
  if (!lArc) return -Infinity;

  site = lArc.site;
  var lfocx = site[0],
      lfocy = site[1],
      plby2 = lfocy - directrix;

  if (!plby2) return lfocx;

  var hl = lfocx - rfocx,
      aby2 = 1 / pby2 - 1 / plby2,
      b = hl / plby2;

  if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;

  return (rfocx + lfocx) / 2;
}

function rightBreakPoint(arc, directrix) {
  var rArc = arc.N;
  if (rArc) return leftBreakPoint(rArc, directrix);
  var site = arc.site;
  return site[1] === directrix ? site[0] : Infinity;
}

var epsilon$3 = 1e-6;
var epsilon2$2 = 1e-12;
var beaches;
var cells;
var circles;
var edges;

function triangleArea(a, b, c) {
  return (a[0] - c[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (c[1] - a[1]);
}

function lexicographic(a, b) {
  return b[1] - a[1]
      || b[0] - a[0];
}

function Diagram(sites, extent) {
  var site = sites.sort(lexicographic).pop(),
      x,
      y,
      circle;

  edges = [];
  cells = new Array(sites.length);
  beaches = new RedBlackTree;
  circles = new RedBlackTree;

  while (true) {
    circle = firstCircle;
    if (site && (!circle || site[1] < circle.y || (site[1] === circle.y && site[0] < circle.x))) {
      if (site[0] !== x || site[1] !== y) {
        addBeach(site);
        x = site[0], y = site[1];
      }
      site = sites.pop();
    } else if (circle) {
      removeBeach(circle.arc);
    } else {
      break;
    }
  }

  sortCellHalfedges();

  if (extent) {
    var x0 = +extent[0][0],
        y0 = +extent[0][1],
        x1 = +extent[1][0],
        y1 = +extent[1][1];
    clipEdges(x0, y0, x1, y1);
    clipCells(x0, y0, x1, y1);
  }

  this.edges = edges;
  this.cells = cells;

  beaches =
  circles =
  edges =
  cells = null;
}

Diagram.prototype = {
  constructor: Diagram,

  polygons: function() {
    var edges = this.edges;

    return this.cells.map(function(cell) {
      var polygon = cell.halfedges.map(function(i) { return cellHalfedgeStart(cell, edges[i]); });
      polygon.data = cell.site.data;
      return polygon;
    });
  },

  triangles: function() {
    var triangles = [],
        edges = this.edges;

    this.cells.forEach(function(cell, i) {
      if (!(m = (halfedges = cell.halfedges).length)) return;
      var site = cell.site,
          halfedges,
          j = -1,
          m,
          s0,
          e1 = edges[halfedges[m - 1]],
          s1 = e1.left === site ? e1.right : e1.left;

      while (++j < m) {
        s0 = s1;
        e1 = edges[halfedges[j]];
        s1 = e1.left === site ? e1.right : e1.left;
        if (s0 && s1 && i < s0.index && i < s1.index && triangleArea(site, s0, s1) < 0) {
          triangles.push([site.data, s0.data, s1.data]);
        }
      }
    });

    return triangles;
  },

  links: function() {
    return this.edges.filter(function(edge) {
      return edge.right;
    }).map(function(edge) {
      return {
        source: edge.left.data,
        target: edge.right.data
      };
    });
  },

  find: function(x, y, radius) {
    var that = this, i0, i1 = that._found || 0, n = that.cells.length, cell;

    // Use the previously-found cell, or start with an arbitrary one.
    while (!(cell = that.cells[i1])) if (++i1 >= n) return null;
    var dx = x - cell.site[0], dy = y - cell.site[1], d2 = dx * dx + dy * dy;

    // Traverse the half-edges to find a closer cell, if any.
    do {
      cell = that.cells[i0 = i1], i1 = null;
      cell.halfedges.forEach(function(e) {
        var edge = that.edges[e], v = edge.left;
        if ((v === cell.site || !v) && !(v = edge.right)) return;
        var vx = x - v[0], vy = y - v[1], v2 = vx * vx + vy * vy;
        if (v2 < d2) d2 = v2, i1 = v.index;
      });
    } while (i1 !== null);

    that._found = i0;

    return radius == null || d2 <= radius * radius ? cell.site : null;
  }
};

var voronoi = function() {
  var x = x$4,
      y = y$4,
      extent = null;

  function voronoi(data) {
    return new Diagram(data.map(function(d, i) {
      var s = [Math.round(x(d, i, data) / epsilon$3) * epsilon$3, Math.round(y(d, i, data) / epsilon$3) * epsilon$3];
      s.index = i;
      s.data = d;
      return s;
    }), extent);
  }

  voronoi.polygons = function(data) {
    return voronoi(data).polygons();
  };

  voronoi.links = function(data) {
    return voronoi(data).links();
  };

  voronoi.triangles = function(data) {
    return voronoi(data).triangles();
  };

  voronoi.x = function(_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant$10(+_), voronoi) : x;
  };

  voronoi.y = function(_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant$10(+_), voronoi) : y;
  };

  voronoi.extent = function(_) {
    return arguments.length ? (extent = _ == null ? null : [[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]], voronoi) : extent && [[extent[0][0], extent[0][1]], [extent[1][0], extent[1][1]]];
  };

  voronoi.size = function(_) {
    return arguments.length ? (extent = _ == null ? null : [[0, 0], [+_[0], +_[1]]], voronoi) : extent && [extent[1][0] - extent[0][0], extent[1][1] - extent[0][1]];
  };

  return voronoi;
};

function Voronoi(params) {
  Transform.call(this, null, params);
}

var prototype$64 = inherits(Voronoi, Transform);

var defaultExtent = [[-1e5, -1e5], [1e5, 1e5]];

prototype$64.transform = function(_, pulse) {
  var as = _.as || 'path',
      data = pulse.source,
      diagram, polygons, i, n;

  // configure and construct voronoi diagram
  diagram = voronoi().x(_.x).y(_.y);
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

/*
Copyright (c) 2013, Jason Davies.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.

  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

  * The name Jason Davies may not be used to endorse or promote products
    derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL JASON DAVIES BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// Word cloud layout by Jason Davies, https://www.jasondavies.com/wordcloud/
// Algorithm due to Jonathan Feinberg, http://static.mrfeinberg.com/bv_ch03.pdf

var cloudRadians = Math.PI / 180;
var cw = 1 << 11 >> 5;
var ch = 1 << 11;

var cloud = function() {
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
  };

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
    if (arguments.length) {
      words = _;
      return cloud;
    } else {
      return words;
    }
  };

  cloud.size = function(_) {
    if (arguments.length) {
      size = [+_[0], +_[1]];
      return cloud;
    } else {
      return size;
    }
  };

  cloud.font = function(_) {
    if (arguments.length) {
      font = functor(_);
      return cloud;
    } else {
      return font;
    }
  };

  cloud.fontStyle = function(_) {
    if (arguments.length) {
      fontStyle = functor(_);
      return cloud;
    } else {
      return fontStyle;
    }
  };

  cloud.fontWeight = function(_) {
    if (arguments.length) {
      fontWeight = functor(_);
      return cloud;
    } else {
      return fontWeight;
    }
  };

  cloud.rotate = function(_) {
    if (arguments.length) {
      rotate = functor(_);
      return cloud;
    } else {
      return rotate;
    }
  };

  cloud.text = function(_) {
    if (arguments.length) {
      text = functor(_);
      return cloud;
    } else {
      return text;
    }
  };

  cloud.spiral = function(_) {
    if (arguments.length) {
      spiral = spirals[_] || _;
      return cloud;
    } else {
      return spiral;
    }
  };

  cloud.fontSize = function(_) {
    if (arguments.length) {
      fontSize = functor(_);
      return cloud;
    } else {
      return fontSize;
    }
  };

  cloud.padding = function(_) {
    if (arguments.length) {
      padding = functor(_);
      return cloud;
    } else {
      return padding;
    }
  };

  cloud.random = function(_) {
    if (arguments.length) {
      random = _;
      return cloud;
    } else {
      return random;
    }
  };

  return cloud;
};

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
    if (d.padding) {
      c.lineWidth = 2 * d.padding;
      c.strokeText(d.text, 0, 0);
    }
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
    var canvas = typeof document !== 'undefined' && document.createElement
      ? document.createElement('canvas')
      : 0;
    return canvas && canvas.getContext ? canvas : new (require('canvas'))();
  } catch (e) {
    error$1('Canvas unavailable. Run in browser or install node-canvas.');
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

var prototype$65 = inherits(Wordcloud, Transform);

prototype$65.transform = function(_, pulse) {
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
    : (fontSize = constant$1(fontSize));

  // create font size scaling function as needed
  if (range) {
    var fsize = fontSize,
        sizeScale = scale$1('sqrt')()
          .domain(extent$2(fsize, pulse))
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

function extent$2(size, pulse) {
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
      curr = array$5(0, width),
      prev = array$5(0, width);

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

      data = copy;
      return reindex;
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
        curr = array$5(n, width, curr);
        prev = array$5(n, width);
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

function array$5(n, m, array) {
  var copy = (m < 0x101 ? array8 : m < 0x10001 ? array16 : array32)(n);
  if (array) copy.set(array);
  return copy;
}

var Dimension = function(index, i, query) {
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
};

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
      merge$3(base, oldv, oldi, n0, addv, addi, n1, value, index);
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
    var n;
    if (array) {
      n = array.length;
    } else {
      array = value;
      n = size;
    }
    return [
      bisectLeft(array, range[0], 0, n),
      bisectRight(array, range[1], 0, n)
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
  return permute(values, index);
}

function merge$3(base, value0, index0, n0, value1, index1, n1, value, index) {
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

var prototype$66 = inherits(CrossFilter, Transform);

prototype$66.transform = function(_, pulse) {
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

prototype$66.init = function(_, pulse) {
  var fields = _.fields,
      query = _.query,
      indices = this._indices = {},
      dims = this._dims = [],
      m = query.length,
      i = 0, key$$1, index;

  // instantiate indices and dimensions
  for (; i<m; ++i) {
    key$$1 = fields[i].fname;
    index = indices[key$$1] || (indices[key$$1] = SortedIndex());
    dims.push(Dimension(index, i, query[i]));
  }

  return this.eval(_, pulse);
};

prototype$66.reinit = function(_, pulse) {
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
      adds = {}, add, index, key$$1,
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
      key$$1 = f.fname;
      if (!(add = adds[key$$1])) {
        indices[key$$1] = index = SortedIndex();
        adds[key$$1] = add = index.insert(f, pulse.source, 0);
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

prototype$66.eval = function(_, pulse) {
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

prototype$66.insert = function(_, pulse, output) {
  var tuples = pulse.add,
      bits = this.value,
      dims = this._dims,
      indices = this._indices,
      fields = _.fields,
      adds = {},
      out = output.add,
      k = bits.size(),
      n = k + tuples.length,
      m = dims.length, j, key$$1, add;

  // resize bitmaps and add tuples as needed
  bits.resize(n, m);
  bits.add(tuples);

  var curr = bits.curr(),
      prev = bits.prev(),
      all  = bits.all();

  // add to dimensional indices
  for (j=0; j<m; ++j) {
    key$$1 = fields[j].fname;
    add = adds[key$$1] || (adds[key$$1] = indices[key$$1].insert(fields[j], tuples, k));
    dims[j].onAdd(add, curr);
  }

  // set previous filters, output if passes at least one filter
  for (; k<n; ++k) {
    prev[k] = all;
    if (curr[k] !== all) out.push(k);
  }
};

prototype$66.modify = function(pulse, output) {
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

prototype$66.remove = function(_, pulse, output) {
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

  this.reindex(pulse, n, map);
  return map;
};

// reindex filters and indices after propagation completes
prototype$66.reindex = function(pulse, num, map) {
  var indices = this._indices,
      bits = this.value;

  pulse.runAfter(function() {
    var indexMap = bits.remove(num, map);
    for (var key$$1 in indices) indices[key$$1].reindex(indexMap);
  });
};

prototype$66.update = function(_, pulse, output) {
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

prototype$66.incrementAll = function(dim, query, stamp, out) {
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
      one$$1 = dim.one,
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
      curr[k] ^= one$$1;
    }
  } else if (lo1 > lo0) {
    for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one$$1;
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
      curr[k] ^= one$$1;
    }
  } else if (hi1 < hi0) {
    for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one$$1;
    }
  }

  dim.range = query.slice();
};

prototype$66.incrementOne = function(dim, query, add, rem) {
  var bits = this.value,
      curr = bits.curr(),
      index = dim.index(),
      old = dim.bisect(dim.range),
      range = dim.bisect(query),
      lo1 = range[0],
      hi1 = range[1],
      lo0 = old[0],
      hi0 = old[1],
      one$$1 = dim.one,
      i, j, k;

  // Fast incremental update based on previous lo index.
  if (lo1 < lo0) {
    for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
      k = index[i];
      curr[k] ^= one$$1;
      add.push(k);
    }
  } else if (lo1 > lo0) {
    for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
      k = index[i];
      curr[k] ^= one$$1;
      rem.push(k);
    }
  }

  // Fast incremental update based on previous hi index.
  if (hi1 > hi0) {
    for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
      k = index[i];
      curr[k] ^= one$$1;
      add.push(k);
    }
  } else if (hi1 < hi0) {
    for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
      k = index[i];
      curr[k] ^= one$$1;
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

var prototype$67 = inherits(ResolveFilter, Transform);

prototype$67.transform = function(_, pulse) {
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

var prototype$68 = inherits(Bound, Transform);
var temp$2 = new Bounds();

prototype$68.transform = function(_, pulse) {
  var view = pulse.dataflow,
      mark = _.mark,
      type = mark.marktype,
      entry = Marks[type],
      bound = entry.bound,
      clip = mark.clip,
      markBounds = mark.bounds, rebound;

  if (entry.nested) {
    // multi-item marks have a single bounds instance
    if (mark.items.length) view.dirty(mark.items[0]);
    markBounds = boundItem$1(mark, bound);
    mark.items.forEach(function(item) {
      item.bounds.clear().union(markBounds);
    });
  }

  else if (type === 'group' || _.modified()) {
    // operator parameters modified -> re-bound all items
    // updates group bounds in response to modified group content
    pulse.visit(pulse.MOD, function(item) { view.dirty(item); });
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
      view.dirty(item);
      markBounds.union(boundItem$1(item, bound));
    });

    if (rebound && !clip) {
      markBounds.clear();
      mark.items.forEach(function(item) { markBounds.union(item.bounds); });
    }
  }

  if (clip) {
    markBounds.intersect(temp$2.set(0, 0, mark.group.width, mark.group.height));
  }

  return pulse.modifies('bounds');
};

function boundItem$1(item, bound, opt) {
  return bound(item.bounds.clear(), item, opt);
}

var COUNTER_NAME = ':vega_identifier:';

/**
 * Adds a unique identifier to all added tuples.
 * This transform creates a new signal that serves as an id counter.
 * As a result, the id counter is shared across all instances of this
 * transform, generating unique ids across multiple data streams. In
 * addition, this signal value can be included in a snapshot of the
 * dataflow state, enabling correct resumption of id allocation.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {string} params.as - The field name for the generated identifier.
 */
function Identifier(params) {
  Transform.call(this, 0, params);
}

var prototype$69 = inherits(Identifier, Transform);

prototype$69.transform = function(_, pulse) {
  var counter = getCounter(pulse.dataflow),
      id$$1 = counter.value,
      as = _.as;

  pulse.visit(pulse.ADD, function(t) {
    if (!t[as]) t[as] = ++id$$1;
  });

  counter.set(this.value = id$$1);
  return pulse;
};

function getCounter(view) {
  var counter = view._signals[COUNTER_NAME];
  if (!counter) {
    view._signals[COUNTER_NAME] = (counter = view.add(0));
  }
  return counter;
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

var prototype$70 = inherits(Mark, Transform);

prototype$70.transform = function(_, pulse) {
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
  mark.items = pulse.source;
  return pulse;
};

function lookup$1(_) {
  var g = _.groups, p = _.parent;
  return g && g.size === 1 ? g.get(Object.keys(g.object)[0])
    : g && p ? g.lookup(p)
    : null;
}

/**
 * Analyze items for overlap, changing opacity to hide items with
 * overlapping bounding boxes. This transform will preserve at least
 * two items (e.g., first and last) even if overlap persists.
 * @param {object} params - The parameters for this operator.
 * @param {object} params.method - The overlap removal method to apply.
 *   One of 'parity' (default, hide every other item until there is no
 *   more overlap) or 'greedy' (sequentially scan and hide and items that
 *   overlap with the last visible item).
 * @constructor
 */
function Overlap(params) {
  Transform.call(this, null, params);
}

var prototype$71 = inherits(Overlap, Transform);

var methods = {
  parity: function(items) {
    return items.filter(function(item, i) {
      return i % 2 ? (item.opacity = 0) : 1;
    });
  },
  greedy: function(items) {
    var a;
    return items.filter(function(b, i) {
      if (!i || !intersect$1(a.bounds, b.bounds)) {
        a = b;
        return 1;
      } else {
        return b.opacity = 0;
      }
    });
  }
};

// compute bounding box intersection
// allow 1 pixel of overlap tolerance
function intersect$1(a, b) {
  return !(
    a.x2 - 1 < b.x1 ||
    a.x1 + 1 > b.x2 ||
    a.y2 - 1 < b.y1 ||
    a.y1 + 1 > b.y2
  );
}

function hasOverlap(items) {
  for (var i=1, n=items.length, a=items[0].bounds, b; i<n; a=b, ++i) {
    if (intersect$1(a, b = items[i].bounds)) return true;
  }
}

function hasBounds(item) {
  var b = item.bounds;
  return b.width() > 1 && b.height() > 1;
}

prototype$71.transform = function(_, pulse) {
  var reduce = methods[_.method] || methods.parity,
      source = pulse.materialize(pulse.SOURCE).source,
      items  = source;

  if (!items) return;

  if (_.method === 'greedy') {
    items = source = source.filter(hasBounds);
  }

  if (items.length >= 3 && hasOverlap(items)) {
    pulse = pulse.reflow(_.modified()).modifies('opacity');
    do {
      items = reduce(items);
    } while (items.length >= 3 && hasOverlap(items));

    if (items.length < 3 && !peek(source).opacity) {
      if (items.length > 1) peek(items).opacity = 0;
      peek(source).opacity = 1;
    }
  }

  return pulse;
};

/**
 * Queue modified scenegraph items for rendering.
 * @constructor
 */
function Render(params) {
  Transform.call(this, null, params);
}

var prototype$72 = inherits(Render, Transform);

prototype$72.transform = function(_, pulse) {
  var view = pulse.dataflow;

  pulse.visit(pulse.ALL, function(item) { view.dirty(item); });

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
        case RowHeader$1: addAll$1(items, views.rowheaders); break;
        case RowFooter$1: addAll$1(items, views.rowfooters); break;
        case ColHeader$1: addAll$1(items, views.colheaders); break;
        case ColFooter$1: addAll$1(items, views.colfooters); break;
        case RowTitle:  views.rowtitle = items[0]; break;
        case ColTitle:  views.coltitle = items[0]; break;
        default:        addAll$1(items, views.marks);
      }
    }
  }

  return views;
}

function addAll$1(items, array) {
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

function boundFlush(item, field$$1) {
  var b = {x1: item.x, y1: item.y, x2: item.x + item.width, y2: item.y + item.height};
  return b[field$$1];
}

function boundFull(item, field$$1) {
  return item.bounds[field$$1];
}

function get$1(opt, key$$1, d) {
  var v = isObject(opt) ? opt[key$$1] : opt;
  return v != null ? v : (d !== undefined ? d : 0);
}

function gridLayout(view, group, opt) {
  var views = extractGroups(group, opt),
      groups = views.marks,
      flush = opt.bounds === 'flush',
      bbox = flush ? bboxFlush : bboxFull,
      bounds = new Bounds(0, 0, 0, 0),
      alignCol = get$1(opt.align, 'column'),
      alignRow = get$1(opt.align, 'row'),
      padCol = get$1(opt.padding, 'column'),
      padRow = get$1(opt.padding, 'row'),
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
    view.dirty(groups[i]);
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

  // update mark bounds, mark dirty
  for (i=0; i<n; ++i) groups[i].mark.bounds.clear();
  for (i=0; i<n; ++i) {
    g = groups[i];
    view.dirty(g);
    bounds.union(g.mark.bounds.union(g.bounds));
  }

  // -- layout grid headers and footers --

  // aggregation functions for grid margin determination
  function min(a, b) { return Math.floor(Math.min(a, b)); }
  function max(a, b) { return Math.ceil(Math.max(a, b)); }

  // bounding box calculation methods
  bbox = flush ? boundFlush : boundFull;

  // perform row header layout
  band = get$1(opt.headerBand, 'row', null);
  x = layoutHeaders(view, views.rowheaders, groups, ncols, nrows, -get$1(off, 'rowHeader'),    min, 0, bbox, 'x1', 0, ncols, 1, band);

  // perform column header layout
  band = get$1(opt.headerBand, 'column', null);
  y = layoutHeaders(view, views.colheaders, groups, ncols, ncols, -get$1(off, 'columnHeader'), min, 1, bbox, 'y1', 0, 1, ncols, band);

  // perform row footer layout
  band = get$1(opt.footerBand, 'row', null);
  layoutHeaders(    view, views.rowfooters, groups, ncols, nrows,  get$1(off, 'rowFooter'),    max, 0, bbox, 'x2', ncols-1, ncols, 1, band);

  // perform column footer layout
  band = get$1(opt.footerBand, 'column', null);
  layoutHeaders(    view, views.colfooters, groups, ncols, ncols,  get$1(off, 'columnFooter'), max, 1, bbox, 'y2', cells-ncols, 1, ncols, band);

  // perform row title layout
  if (views.rowtitle) {
    offset = x - get$1(off, 'rowTitle');
    band = get$1(opt.titleBand, 'row', 0.5);
    layoutTitle$1(view, views.rowtitle, offset, 0, bounds, band);
  }

  // perform column title layout
  if (views.coltitle) {
    offset = y - get$1(off, 'columnTitle');
    band = get$1(opt.titleBand, 'column', 0.5);
    layoutTitle$1(view, views.coltitle, offset, 1, bounds, band);
  }
}

function layoutHeaders(view, headers, groups, ncols, limit, offset, agg, isX, bound, bf, start, stride, back, band) {
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
    view.dirty(headers[j]);
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
    if (isX) {
      x = band == null ? g.x : Math.round(g.bounds.x1 + band * g.bounds.width());
      y = init;
    } else {
      x = init;
      y = band == null ? g.y : Math.round(g.bounds.y1 + band * g.bounds.height());
    }
    b.union(h.bounds.translate(x - (h.x || 0), y - (h.y || 0)));
    h.x = x;
    h.y = y;
    view.dirty(h);

    // update current edge of layout bounds
    edge = agg(edge, b[bf]);
  }

  return edge;
}

function layoutTitle$1(view, g, offset, isX, bounds, band) {
  if (!g) return;
  view.dirty(g);

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
  view.dirty(g);
}

var Fit = 'fit';
var Pad = 'pad';
var None$2 = 'none';
var Padding = 'padding';

var Top = 'top';
var Left = 'left';
var Right = 'right';
var Bottom = 'bottom';

var AxisRole = 'axis';
var TitleRole = 'title';
var FrameRole = 'frame';
var LegendRole = 'legend';
var ScopeRole = 'scope';
var RowHeader = 'row-header';
var RowFooter = 'row-footer';
var ColHeader = 'column-header';
var ColFooter = 'column-footer';

var AxisOffset = 0.5;
var tempBounds$2 = new Bounds();

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

var prototype$73 = inherits(ViewLayout, Transform);

prototype$73.transform = function(_, pulse) {
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
      xBounds = viewBounds.clone(),
      yBounds = viewBounds.clone(),
      legends = [], title,
      mark, flow, b, i, n;

  // layout axes, gather legends, collect bounds
  for (i=0, n=items.length; i<n; ++i) {
    mark = items[i];
    switch (mark.role) {
      case AxisRole:
        axisBounds.union(b = layoutAxis(view, mark, width, height));
        (isYAxis(mark) ? xBounds : yBounds).union(b);
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
        xBounds.union(mark.bounds);
        yBounds.union(mark.bounds);
        break;
      default:
        viewBounds.union(mark.bounds);
    }
  }

  // layout title, adjust bounds
  if (title) {
    axisBounds.union(b = layoutTitle(view, title, axisBounds));
    (isYAxis(title) ? xBounds : yBounds).union(b);
  }

  // layout legends, adjust viewBounds
  if (legends.length) {
    flow = {left: 0, right: 0, top: 0, bottom: 0, margin: _.legendMargin || 8};

    for (i=0, n=legends.length; i<n; ++i) {
      b = layoutLegend(view, legends[i], flow, xBounds, yBounds, width, height);
      if (_.autosize && _.autosize.type === Fit) {
        // for autosize fit, incorporate the orthogonal dimension only
        // legends that overrun the chart area will then be clipped
        // otherwise the chart area gets reduced to nothing!
        var orient = legends[i].items[0].datum.orient;
        if (orient === Left || orient === Right) {
          viewBounds.add(b.x1, 0).add(b.x2, 0);
        } else if (orient === Top || orient === Bottom) {
          viewBounds.add(0, b.y1).add(0, b.y2);
        }
      } else {
        viewBounds.union(b);
      }
    }
  }

  // perform size adjustment
  viewBounds.union(xBounds).union(yBounds).union(axisBounds);
  layoutSize(view, group, viewBounds, _);
}

function set$4(item, property, value) {
  if (item[property] === value) {
    return 0;
  } else {
    item[property] = value;
    return 1;
  }
}

function isYAxis(mark) {
  var orient = mark.items[0].datum.orient;
  return orient === Left || orient === Right;
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
      bounds = item.bounds,
      x = 0, y = 0, i, s;

  tempBounds$2.clear().union(bounds);
  bounds.clear();
  if ((i=indices[0]) > -1) bounds.union(item.items[i].bounds);
  if ((i=indices[1]) > -1) bounds.union(item.items[i].bounds);

  // position axis group and title
  switch (orient) {
    case Top:
      x = position || 0;
      y = -offset;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.y1));
      if (title) {
        if (title.auto) {
          s += titlePadding;
          title.y = -s;
          s += title.bounds.height();
        } else {
          bounds.union(title.bounds);
        }
      }
      bounds.add(0, -s).add(range, 0);
      break;
    case Left:
      x = -offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.x1));
      if (title) {
        if (title.auto) {
          s += titlePadding;
          title.x = -s;
          s += title.bounds.width();
        } else {
          bounds.union(title.bounds);
        }
      }
      bounds.add(-s, 0).add(0, range);
      break;
    case Right:
      x = width + offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.x2));
      if (title) {
        if (title.auto) {
          s += titlePadding;
          title.x = s;
          s += title.bounds.width();
        } else {
          bounds.union(title.bounds);
        }
      }
      bounds.add(0, 0).add(s, range);
      break;
    case Bottom:
      x = position || 0;
      y = height + offset;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.y2));
      if (title) if (title.auto) {
        s += titlePadding;
        title.y = s;
        s += title.bounds.height();
      } else {
        bounds.union(title.bounds);
      }
      bounds.add(0, 0).add(range, s);
      break;
    default:
      x = item.x;
      y = item.y;
  }

  // update bounds
  boundStroke(bounds.translate(x, y), item);

  if (set$4(item, 'x', x + AxisOffset) | set$4(item, 'y', y + AxisOffset)) {
    item.bounds = tempBounds$2;
    view.dirty(item);
    item.bounds = bounds;
    view.dirty(item);
  }

  return item.mark.bounds.clear().union(bounds);
}

function layoutTitle(view, title, axisBounds) {
  var item = title.items[0],
      datum = item.datum,
      orient = datum.orient,
      offset = item.offset,
      bounds = item.bounds,
      x = 0, y = 0;

  tempBounds$2.clear().union(bounds);

  // position axis group and title
  switch (orient) {
    case Top:
      x = item.x;
      y = axisBounds.y1 - offset;
      break;
    case Left:
      x = axisBounds.x1 - offset;
      y = item.y;
      break;
    case Right:
      x = axisBounds.x2 + offset;
      y = item.y;
      break;
    case Bottom:
      x = item.x;
      y = axisBounds.y2 + offset;
      break;
    default:
      x = item.x;
      y = item.y;
  }

  bounds.translate(x - item.x, y - item.y);
  if (set$4(item, 'x', x) | set$4(item, 'y', y)) {
    item.bounds = tempBounds$2;
    view.dirty(item);
    item.bounds = bounds;
    view.dirty(item);
  }

  // update bounds
  return title.bounds.clear().union(bounds);
}

function layoutLegend(view, legend, flow, xBounds, yBounds, width, height) {
  var item = legend.items[0],
      datum = item.datum,
      orient = datum.orient,
      offset = item.offset,
      bounds = item.bounds,
      x = 0,
      y = 0,
      w, h, axisBounds;

  if (orient === Top || orient === Bottom) {
    axisBounds = yBounds,
    x = flow[orient];
  } else if (orient === Left || orient === Right) {
    axisBounds = xBounds;
    y = flow[orient];
  }

  tempBounds$2.clear().union(bounds);
  bounds.clear();

  // aggregate bounds to determine size
  // shave off 1 pixel because it looks better...
  item.items.forEach(function(_) { bounds.union(_.bounds); });
  w = Math.round(bounds.width()) + 2 * item.padding - 1;
  h = Math.round(bounds.height()) + 2 * item.padding - 1;

  switch (orient) {
    case Left:
      x -= w + offset - Math.floor(axisBounds.x1);
      flow.left += h + flow.margin;
      break;
    case Right:
      x += offset + Math.ceil(axisBounds.x2);
      flow.right += h + flow.margin;
      break;
    case Top:
      y -= h + offset - Math.floor(axisBounds.y1);
      flow.top += w + flow.margin;
      break;
    case Bottom:
      y += offset + Math.ceil(axisBounds.y2);
      flow.bottom += w + flow.margin;
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

  // update bounds
  boundStroke(bounds.set(x, y, x + w, y + h), item);

  // update legend layout
  if (set$4(item, 'x', x) | set$4(item, 'width', w) |
      set$4(item, 'y', y) | set$4(item, 'height', h)) {
    item.bounds = tempBounds$2;
    view.dirty(item);
    item.bounds = bounds;
    view.dirty(item);
  }

  return item.mark.bounds.clear().union(bounds);
}

function layoutSize(view, group, viewBounds, _) {
  var auto = _.autosize || {},
      type = auto.type,
      viewWidth = view._width,
      viewHeight = view._height,
      padding = view.padding();

  if (view._autosize < 1 || !type) return;

  var width  = Math.max(0, group.width || 0),
      left   = Math.max(0, Math.ceil(-viewBounds.x1)),
      right  = Math.max(0, Math.ceil(viewBounds.x2 - width)),
      height = Math.max(0, group.height || 0),
      top    = Math.max(0, Math.ceil(-viewBounds.y1)),
      bottom = Math.max(0, Math.ceil(viewBounds.y2 - height));

  if (auto.contains === Padding) {
    viewWidth -= padding.left + padding.right;
    viewHeight -= padding.top + padding.bottom;
  }

  if (type === None$2) {
    left = 0;
    top = 0;
    width = viewWidth;
    height = viewHeight;
  }

  else if (type === Fit) {
    width = Math.max(0, viewWidth - left - right);
    height = Math.max(0, viewHeight - top - bottom);
  }

  else if (type === Pad) {
    viewWidth = width + left + right;
    viewHeight = height + top + bottom;
  }

  view._resizeView(
    viewWidth, viewHeight,
    width, height,
    [left, top],
    auto.resize
  );
}

var IdentifierDefinition = {
  "type": "Identifier",
  "metadata": {"modifies": true},
  "params": [
    { "name": "as", "type": "string", "required": true }
  ]
};

var Default = 'default';

var cursor = function(view) {
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
};

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
    error$1('Unrecognized data set: ' + name);
  }
  return data[name];
}

function data(name) {
  return dataref(this, name).values.value;
}

function change(name, changes) {
  if (!isChangeSet(changes)) {
    error$1('Second argument to changes must be a changeset.');
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
  return Math.max(0, view._viewWidth + padding.left + padding.right);
}

function height$1(view) {
  var padding = view.padding();
  return Math.max(0, view._viewHeight + padding.top + padding.bottom);
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
var eventExtend = function(view, event, item) {
  var el = view._renderer.scene(),
      p, e, translate;

  if (el) {
    translate = offset$1(view);
    e = event.changedTouches ? event.changedTouches[0] : event;
    p = point$4(e, el);
    p[0] -= translate[0];
    p[1] -= translate[1];
  }

  event.dataflow = view;
  event.vega = extension(view, item, p);
  event.item = item;
  return event;
};

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
    view:  constant$1(view),
    item:  constant$1(item || {}),
    group: group,
    xy:    xy,
    x:     function(item) { return xy(item)[0]; },
    y:     function(item) { return xy(item)[1]; }
  };
}

var VIEW = 'view';
var WINDOW = 'window';

/**
 * Initialize event handling configuration.
 * @param {object} config - The configuration settings.
 * @return {object}
 */
function initializeEventConfig(config) {
  config = extend({}, config);

  var def = config.defaults;
  if (def) {
    if (isArray(def.prevent)) {
      def.prevent = toSet(def.prevent);
    }
    if (isArray(def.allow)) {
      def.allow = toSet(def.allow);
    }
  }

  return config;
}

function prevent(view, type) {
  var def = view._eventConfig.defaults,
      prevent = def && def.prevent,
      allow = def && def.allow;

  return prevent === false || allow === true ? false
    : prevent === true || allow === false ? true
    : prevent ? prevent[type]
    : allow ? !allow[type]
    : view.preventDefault();
}

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
        if (source === VIEW && prevent(view, type)) {
          e.preventDefault();
        }
        try {
          s.receive(eventExtend(view, e, item));
        } catch (error) {
          view.error(error);
        } finally {
          view.run();
        }
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

var hover = function(hoverSet, leaveSet) {
  hoverSet = hoverSet || 'hover';
  leaveSet = [leaveSet || 'update', hoverSet];

  // invoke hover set upon mouseover
  this.on(
    this.events('view', 'mouseover', itemFilter),
    markTarget,
    invoke(hoverSet)
  );

  // invoke leave set upon mouseout
  this.on(
    this.events('view', 'mouseout', itemFilter),
    markTarget,
    invoke(leaveSet)
  );

  return this;
};

/**
 * Remove all external event listeners.
 */
var finalize = function() {
  var listeners = this._eventListeners,
      n = listeners.length, m, e;

  while (--n >= 0) {
    e = listeners[n];
    m = e.sources.length;
    while (--m >= 0) {
      e.sources[m].removeEventListener(e.type, e.handler);
    }
  }
};

var element$1 = function(tag, attr, text) {
  var el = document.createElement(tag);
  for (var key in attr) el.setAttribute(key, attr[key]);
  if (text != null) el.textContent = text;
  return el;
};

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
var bind$1 = function(view, el, binding) {
  if (!el) return;

  var param = binding.param,
      bind = binding.state;

  if (!bind) {
    bind = binding.state = {
      elements: null,
      active: false,
      set: null,
      update: function(value) {
        bind.source = true;
        view.signal(param.signal, value).run();
      }
    };
    if (param.debounce) {
      bind.update = debounce(param.debounce, bind.update);
    }
  }

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
};

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

  for (var key$$1 in param) {
    if (key$$1 !== 'signal' && key$$1 !== 'element') {
      node.setAttribute(key$$1 === 'input' ? 'type' : key$$1, param[key$$1]);
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
  bind.set = function(value) { node.checked = !!value || null; };
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
    var id$$1 = OptionClass + param.signal + '-' + option;

    var attr = {
      id:    id$$1,
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
    group.appendChild(element$1('label', {'for': id$$1}, option+''));

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

  var min$$1 = param.min || Math.min(0, +value) || 0,
      max$$1 = param.max || Math.max(100, +value) || 100,
      step = param.step || tickStep(min$$1, max$$1, 100);

  var node = element$1('input', {
    type:  'range',
    name:  param.signal,
    min:   min$$1,
    max:   max$$1,
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

var initializeRenderer = function(view, r, el, constructor) {
  r = r || new constructor(view.loader());
  return r
    .initialize(el, width(view), height$1(view), offset$1(view))
    .background(view._background);
};

var initializeHandler = function(view, prevHandler, el, constructor) {
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
};

var initialize$1 = function(el, elBind) {
  var view = this,
      type = view._renderType,
      module = renderModule(type),
      Handler$$1, Renderer$$1;

  // containing dom element
  el = view._el = el ? lookup$2(view, el) : null;

  // select appropriate renderer & handler
  if (!module) view.error('Unrecognized renderer type: ' + type);
  Handler$$1 = module.handler || CanvasHandler;
  Renderer$$1 = (el ? module.renderer : module.headless);

  // initialize renderer and input handler
  view._renderer = !Renderer$$1 ? null
    : initializeRenderer(view, view._renderer, el, Renderer$$1);
  view._handler = initializeHandler(view, view._handler, el, Handler$$1);
  view._redraw = true;

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
};

function lookup$2(view, el) {
  if (typeof el === 'string') {
    if (typeof document !== 'undefined') {
      el = document.querySelector(el);
    } else {
      view.error('DOM document instance not found.');
      return null;
    }
  }
  el.innerHTML = '';
  return el;
}

/**
 * Render the current scene in a headless fashion.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A Promise that resolves to a renderer.
 */
var renderHeadless = function(view, type) {
  var module = renderModule(type);
  return !(module && module.headless)
    ? Promise.reject('Unrecognized renderer type: ' + type)
    : view.runAsync().then(function() {
        return initializeRenderer(view, null, null, module.headless)
          .renderAsync(view._scenegraph.root);
      });
};

/**
 * Produce an image URL for the visualization. Depending on the type
 * parameter, the generated URL contains data for either a PNG or SVG image.
 * The URL can be used (for example) to download images of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @param {string} type - The image type. One of 'svg', 'png' or 'canvas'.
 *   The 'canvas' and 'png' types are synonyms for a PNG image.
 * @return {Promise} - A promise that resolves to an image URL.
 */
var renderToImageURL = function(type) {
  return (type !== RenderType.Canvas && type !== RenderType.SVG && type !== RenderType.PNG)
    ? Promise.reject('Unrecognized image type: ' + type)
    : renderHeadless(this, type).then(function(renderer) {
        return type === RenderType.SVG
          ? toBlobURL(renderer.svg(), 'image/svg+xml')
          : renderer.canvas().toDataURL('image/png');
      });
};

function toBlobURL(data, mime) {
  var blob = new Blob([data], {type: mime});
  return window.URL.createObjectURL(blob);
}

/**
 * Produce a Canvas instance containing a rendered visualization.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A promise that resolves to a Canvas instance.
 */
var renderToCanvas = function() {
  return renderHeadless(this, RenderType.Canvas)
    .then(function(renderer) { return renderer.canvas(); });
};

/**
 * Produce a rendered SVG string of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A promise that resolves to an SVG string.
 */
var renderToSVG = function() {
  return renderHeadless(this, RenderType.SVG)
    .then(function(renderer) { return renderer.svg(); });
};

var parseAutosize = function(spec, config) {
  spec = spec || config.autosize;
  if (isObject(spec)) {
    return spec;
  } else {
    spec = spec || 'pad';
    return {type: spec};
  }
};

var parsePadding = function(spec, config) {
  spec = spec || config.padding;
  if (isObject(spec)) {
    return spec;
  } else {
    spec = +spec || 0;
    return {top: spec, bottom: spec, left: spec, right: spec};
  }
};

var OUTER = 'outer';
var OUTER_INVALID = ['value', 'update', 'react', 'bind'];

function outerError(prefix, name) {
  error$1(prefix + ' for "outer" push: ' + $(name));
}

var parseSignal = function(signal, scope) {
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
};

function ASTNode(type) {
  this.type = type;
}

ASTNode.prototype.visit = function(visitor) {
  var node = this, c, i, n;

  if (visitor(node)) return 1;

  for (c=children$1(node), i=0, n=c.length; i<n; ++i) {
    if (c[i].visit(visitor)) return 1;
  }
};

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
var index$1;
var length$2;
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

// Error messages should be identical to V8.
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

// See also tools/generate-unicode-regex.py.
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

  while (index$1 < length$2) {
    ch = source$1.charCodeAt(index$1);

    if (isWhiteSpace(ch) || isLineTerminator(ch)) {
      ++index$1;
    } else {
      break;
    }
  }
}

function scanHexEscape(prefix) {
  var i, len, ch, code = 0;

  len = (prefix === 'u') ? 4 : 2;
  for (i = 0; i < len; ++i) {
    if (index$1 < length$2 && isHexDigit(source$1[index$1])) {
      ch = source$1[index$1++];
      code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
    } else {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
  }
  return String.fromCharCode(code);
}

function scanUnicodeCodePointEscape() {
  var ch, code, cu1, cu2;

  ch = source$1[index$1];
  code = 0;

  // At least, one hex digit is required.
  if (ch === '}') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  while (index$1 < length$2) {
    ch = source$1[index$1++];
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

  ch = source$1.charCodeAt(index$1++);
  id = String.fromCharCode(ch);

  // '\u' (U+005C, U+0075) denotes an escaped character.
  if (ch === 0x5C) {
    if (source$1.charCodeAt(index$1) !== 0x75) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
    ++index$1;
    ch = scanHexEscape('u');
    if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
    id = ch;
  }

  while (index$1 < length$2) {
    ch = source$1.charCodeAt(index$1);
    if (!isIdentifierPart(ch)) {
      break;
    }
    ++index$1;
    id += String.fromCharCode(ch);

    // '\u' (U+005C, U+0075) denotes an escaped character.
    if (ch === 0x5C) {
      id = id.substr(0, id.length - 1);
      if (source$1.charCodeAt(index$1) !== 0x75) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
      ++index$1;
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

  start = index$1++;
  while (index$1 < length$2) {
    ch = source$1.charCodeAt(index$1);
    if (ch === 0x5C) {
      // Blackslash (U+005C) marks Unicode escape sequence.
      index$1 = start;
      return getEscapedIdentifier();
    }
    if (isIdentifierPart(ch)) {
      ++index$1;
    } else {
      break;
    }
  }

  return source$1.slice(start, index$1);
}

function scanIdentifier() {
  var start, id, type;

  start = index$1;

  // Backslash (U+005C) starts an escaped character.
  id = (source$1.charCodeAt(index$1) === 0x5C) ? getEscapedIdentifier() : getIdentifier();

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
    end: index$1
  };
}

// 7.7 Punctuators

function scanPunctuator() {
  var start = index$1,
    code = source$1.charCodeAt(index$1),
    code2,
    ch1 = source$1[index$1],
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
      ++index$1;
      return {
        type: TokenPunctuator,
        value: String.fromCharCode(code),
        start: start,
        end: index$1
      };

    default:
      code2 = source$1.charCodeAt(index$1 + 1);

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
            index$1 += 2;
            return {
              type: TokenPunctuator,
              value: String.fromCharCode(code) + String.fromCharCode(code2),
              start: start,
              end: index$1
            };

          case 0x21: // !
          case 0x3D: // =
            index$1 += 2;

            // !== and ===
            if (source$1.charCodeAt(index$1) === 0x3D) {
              ++index$1;
            }
            return {
              type: TokenPunctuator,
              value: source$1.slice(start, index$1),
              start: start,
              end: index$1
            };
        }
      }
  }

  // 4-character punctuator: >>>=

  ch4 = source$1.substr(index$1, 4);

  if (ch4 === '>>>=') {
    index$1 += 4;
    return {
      type: TokenPunctuator,
      value: ch4,
      start: start,
      end: index$1
    };
  }

  // 3-character punctuators: === !== >>> <<= >>=

  ch3 = ch4.substr(0, 3);

  if (ch3 === '>>>' || ch3 === '<<=' || ch3 === '>>=') {
    index$1 += 3;
    return {
      type: TokenPunctuator,
      value: ch3,
      start: start,
      end: index$1
    };
  }

  // Other 2-character punctuators: ++ -- << >> && ||
  ch2 = ch3.substr(0, 2);

  if ((ch1 === ch2[1] && ('+-<>&|'.indexOf(ch1) >= 0)) || ch2 === '=>') {
    index$1 += 2;
    return {
      type: TokenPunctuator,
      value: ch2,
      start: start,
      end: index$1
    };
  }

  // 1-character punctuators: < > = ! + - * % & | ^ /

  if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
    ++index$1;
    return {
      type: TokenPunctuator,
      value: ch1,
      start: start,
      end: index$1
    };
  }

  throwError({}, MessageUnexpectedToken, ILLEGAL);
}

// 7.8.3 Numeric Literals

function scanHexLiteral(start) {
  var number = '';

  while (index$1 < length$2) {
    if (!isHexDigit(source$1[index$1])) {
      break;
    }
    number += source$1[index$1++];
  }

  if (number.length === 0) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  if (isIdentifierStart(source$1.charCodeAt(index$1))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenNumericLiteral,
    value: parseInt('0x' + number, 16),
    start: start,
    end: index$1
  };
}

function scanOctalLiteral(start) {
  var number = '0' + source$1[index$1++];
  while (index$1 < length$2) {
    if (!isOctalDigit(source$1[index$1])) {
      break;
    }
    number += source$1[index$1++];
  }

  if (isIdentifierStart(source$1.charCodeAt(index$1)) || isDecimalDigit(source$1.charCodeAt(index$1))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenNumericLiteral,
    value: parseInt(number, 8),
    octal: true,
    start: start,
    end: index$1
  };
}

function scanNumericLiteral() {
  var number, start, ch;

  ch = source$1[index$1];
  assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
    'Numeric literal must start with a decimal digit or a decimal point');

  start = index$1;
  number = '';
  if (ch !== '.') {
    number = source$1[index$1++];
    ch = source$1[index$1];

    // Hex number starts with '0x'.
    // Octal number starts with '0'.
    if (number === '0') {
      if (ch === 'x' || ch === 'X') {
        ++index$1;
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

    while (isDecimalDigit(source$1.charCodeAt(index$1))) {
      number += source$1[index$1++];
    }
    ch = source$1[index$1];
  }

  if (ch === '.') {
    number += source$1[index$1++];
    while (isDecimalDigit(source$1.charCodeAt(index$1))) {
      number += source$1[index$1++];
    }
    ch = source$1[index$1];
  }

  if (ch === 'e' || ch === 'E') {
    number += source$1[index$1++];

    ch = source$1[index$1];
    if (ch === '+' || ch === '-') {
      number += source$1[index$1++];
    }
    if (isDecimalDigit(source$1.charCodeAt(index$1))) {
      while (isDecimalDigit(source$1.charCodeAt(index$1))) {
        number += source$1[index$1++];
      }
    } else {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
  }

  if (isIdentifierStart(source$1.charCodeAt(index$1))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenNumericLiteral,
    value: parseFloat(number),
    start: start,
    end: index$1
  };
}

// 7.8.4 String Literals

function scanStringLiteral() {
  var str = '',
    quote, start, ch, code, octal = false;

  quote = source$1[index$1];
  assert((quote === '\'' || quote === '"'),
    'String literal must starts with a quote');

  start = index$1;
  ++index$1;

  while (index$1 < length$2) {
    ch = source$1[index$1++];

    if (ch === quote) {
      quote = '';
      break;
    } else if (ch === '\\') {
      ch = source$1[index$1++];
      if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
        switch (ch) {
          case 'u':
          case 'x':
            if (source$1[index$1] === '{') {
              ++index$1;
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

              if (index$1 < length$2 && isOctalDigit(source$1[index$1])) {
                octal = true;
                code = code * 8 + '01234567'.indexOf(source$1[index$1++]);

                // 3 digits are only allowed when string starts
                // with 0, 1, 2, 3
                if ('0123'.indexOf(ch) >= 0 &&
                  index$1 < length$2 &&
                  isOctalDigit(source$1[index$1])) {
                  code = code * 8 + '01234567'.indexOf(source$1[index$1++]);
                }
              }
              str += String.fromCharCode(code);
            } else {
              str += ch;
            }
            break;
        }
      } else {
        if (ch === '\r' && source$1[index$1] === '\n') {
          ++index$1;
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
    end: index$1
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

  ch = source$1[index$1];
  assert(ch === '/', 'Regular expression literal must start with a slash');
  str = source$1[index$1++];

  classMarker = false;
  terminated = false;
  while (index$1 < length$2) {
    ch = source$1[index$1++];
    str += ch;
    if (ch === '\\') {
      ch = source$1[index$1++];
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
  while (index$1 < length$2) {
    ch = source$1[index$1];
    if (!isIdentifierPart(ch.charCodeAt(0))) {
      break;
    }

    ++index$1;
    if (ch === '\\' && index$1 < length$2) {
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
  start = index$1;

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
    end: index$1
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

  if (index$1 >= length$2) {
    return {
      type: TokenEOF,
      start: index$1,
      end: index$1
    };
  }

  ch = source$1.charCodeAt(index$1);

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
    if (isDecimalDigit(source$1.charCodeAt(index$1 + 1))) {
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
  index$1 = token.end;

  lookahead = advance();

  index$1 = token.end;

  return token;
}

function peek$1() {
  var pos;

  pos = index$1;

  lookahead = advance();
  index$1 = pos;
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
  error.index = index$1;
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

  index$1 = lookahead.start;
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

  index$1 = lookahead.start;
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

  index$1 = lookahead.start;
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

  index$1 = lookahead.start;
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
  index$1 = lookahead.start;


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
    while (index$1 < length$2) {
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
  index$1 = lookahead.start;
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
    markers.pop();
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

var parse$3 = function(code) {
  source$1 = code;
  index$1 = 0;
  length$2 = source$1.length;
  lookahead = null;

  peek$1();

  var expr = parseExpression$1();

  if (lookahead.type !== TokenEOF) {
    throw new Error("Unexpect token after expression.");
  }
  return expr;
};

var Constants = {
  NaN:       'NaN',
  E:         'Math.E',
  LN2:       'Math.LN2',
  LN10:      'Math.LN10',
  LOG2E:     'Math.LOG2E',
  LOG10E:    'Math.LOG10E',
  PI:        'Math.PI',
  SQRT1_2:   'Math.SQRT1_2',
  SQRT2:     'Math.SQRT2',
  MIN_VALUE: 'Number.MIN_VALUE',
  MAX_VALUE: 'Number.MAX_VALUE'
};

var Functions = function(codegen) {

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
      if (args.length < 3) error$1('Missing arguments to clamp function.');
      if (args.length > 3) error$1('Too many arguments to clamp function.');
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
        if (args.length < 3) error$1('Missing arguments to if function.');
        if (args.length > 3) error$1('Too many arguments to if function.');
        var a = args.map(codegen);
        return '('+a[0]+'?'+a[1]+':'+a[2]+')';
      }
  };
};

var codegen = function(opt) {
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
    : function (id$$1) { return globalvar + '["' + id$$1 + '"]'; };

  function visit(ast) {
    if (isString(ast)) return ast;
    var generator = Generators[ast.type];
    if (generator == null) error$1('Unsupported type: ' + ast.type);
    return generator(ast);
  }

  var Generators = {
    Literal: function(n) {
        return n.raw;
      },

    Identifier: function(n) {
      var id$$1 = n.name;
      if (memberDepth > 0) {
        return id$$1;
      } else if (blacklist.hasOwnProperty(id$$1)) {
        return error$1('Illegal identifier: ' + id$$1);
      } else if (constants.hasOwnProperty(id$$1)) {
        return constants[id$$1];
      } else if (whitelist.hasOwnProperty(id$$1)) {
        return id$$1;
      } else {
        globals[id$$1] = 1;
        return outputGlobal(id$$1);
      }
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
          error$1('Illegal callee type: ' + n.callee.type);
        }
        var callee = n.callee.name;
        var args = n.arguments;
        var fn = functions.hasOwnProperty(callee) && functions[callee];
        if (!fn) error$1('Unrecognized function: ' + callee);
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
};

var formatCache = {};

function formatter(type, method, specifier) {
  var k = type + ':' + specifier,
      e = formatCache[k];
  if (!e || e[0] !== method) {
    formatCache[k] = (e = [method, method(specifier)]);
  }
  return e[1];
}

function format$1(_, specifier) {
  return formatter('format', format, specifier)(_);
}

function timeFormat$1(_, specifier) {
  return formatter('timeFormat', timeFormat, specifier)(_);
}

function utcFormat$1(_, specifier) {
  return formatter('utcFormat', utcFormat, specifier)(_);
}

function timeParse$1(_, specifier) {
  return formatter('timeParse', timeParse, specifier)(_);
}

function utcParse$1(_, specifier) {
  return formatter('utcParse', utcParse, specifier)(_);
}

var dateObj = new Date(2000, 0, 1);

function time$1(month, day, specifier) {
  dateObj.setMonth(month);
  dateObj.setDate(day);
  return timeFormat$1(dateObj, specifier);
}

function monthFormat(month) {
  return time$1(month, 1, '%B');
}

function monthAbbrevFormat(month) {
  return time$1(month, 1, '%b');
}

function dayFormat(day) {
  return time$1(0, 2 + day, '%A');
}

function dayAbbrevFormat(day) {
  return time$1(0, 2 + day, '%a');
}

function quarter(date) {
  return 1 + ~~(new Date(date).getMonth() / 3);
}

function utcquarter(date) {
  return 1 + ~~(new Date(date).getUTCMonth() / 3);
}

function log$3(df, method, args) {
  try {
    df[method].apply(df, ['EXPRESSION'].concat([].slice.call(args)));
  } catch (err) {
    df.warn(err);
  }
  return args[args.length-1];
}

function warn() {
  return log$3(this.context.dataflow, 'warn', arguments);
}

function info() {
  return log$3(this.context.dataflow, 'info', arguments);
}

function debug() {
  return log$3(this.context.dataflow, 'debug', arguments);
}

var inScope = function(item) {
  var group = this.context.group,
      value = false;

  if (group) while (item) {
    if (item === group) { value = true; break; }
    item = item.mark.group;
  }
  return value;
};

/**
 * Span-preserving range clamp. If the span of the input range is less
 * than (max - min) and an endpoint exceeds either the min or max value,
 * the range is translated such that the span is preserved and one
 * endpoint touches the boundary of the min/max range.
 * If the span exceeds (max - min), the range [min, max] is returned.
 */
var clampRange = function(range, min, max) {
  var lo = range[0],
      hi = range[1],
      span;

  if (hi < lo) {
    span = hi;
    hi = lo;
    lo = span;
  }
  span = hi - lo;

  return span >= (max - min)
    ? [min, max]
    : [
        Math.min(Math.max(lo, min), max - span),
        Math.min(Math.max(hi, span), max)
      ];
};

function pinchDistance(event) {
  var t = event.touches,
      dx = t[0].clientX - t[1].clientX,
      dy = t[0].clientY - t[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function pinchAngle(event) {
  var t = event.touches;
  return Math.atan2(
    t[0].clientY - t[1].clientY,
    t[0].clientX - t[1].clientX
  );
}

var _window = (typeof window !== 'undefined' && window) || null;

function screen() {
  return _window ? _window.screen : {};
}

function windowSize() {
  return _window
    ? [_window.innerWidth, _window.innerHeight]
    : [undefined, undefined];
}

function containerSize() {
  var view = this.context.dataflow,
      el = view.container && view.container();
  return el
    ? [el.clientWidth, el.clientHeight]
    : [undefined, undefined];
}

var span = function(array) {
  return (array[array.length-1] - array[0]) || 0;
};

var Literal = 'Literal';
var Identifier$1 = 'Identifier';

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
  else if (args[0].type === Identifier$1) {
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

var scaleGradient = function(scale, p0, p1, count) {
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
};

function exp$1(sign) {
  return function(x) { return sign * Math.exp(x); };
}

function log$4(sign) {
  return function(x) { return Math.log(sign * x); };
}

function pow$2(exponent) {
  return function(x) {
    return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
  };
}

function pan(domain, delta, lift, ground) {
  var d0 = lift(domain[0]),
      d1 = lift(peek(domain)),
      dd = (d1 - d0) * delta;

  return [
    ground(d0 - dd),
    ground(d1 - dd)
  ];
}

function panLinear(domain, delta) {
  return pan(domain, delta, toNumber, identity$1);
}

function panLog(domain, delta) {
  var sign = Math.sign(domain[0]);
  return pan(domain, delta, log$4(sign), exp$1(sign));
}

function panPow(domain, delta, exponent) {
  return pan(domain, delta, pow$2(exponent), pow$2(1/exponent));
}

function zoom$1(domain, anchor, scale, lift, ground) {
  var da = lift(anchor),
      d0 = lift(domain[0]),
      d1 = lift(peek(domain));

  return [
    ground(da + (d0 - da) * scale),
    ground(da + (d1 - da) * scale)
  ];
}

function zoomLinear(domain, anchor, scale) {
  return zoom$1(domain, anchor, scale, toNumber, identity$1);
}

function zoomLog(domain, anchor, scale) {
  var sign = Math.sign(domain[0]);
  return zoom$1(domain, anchor, scale, log$4(sign), exp$1(sign));
}

function zoomPow(domain, anchor, scale, exponent) {
  return zoom$1(domain, anchor, scale, pow$2(exponent), pow$2(1/exponent));
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
    error$1('First argument to data functions must be a string literal.');
  }

  var data = args[0].value,
      dataName = dataPrefix + data;

  if (!params.hasOwnProperty(dataName)) {
    params[dataName] = scope.getData(data).tuplesRef();
  }
}

function indata(name, field$$1, value) {
  var index = this.context.data[name]['index:' + field$$1],
      entry = index ? index.value.get(value) : undefined;
  return entry ? entry.count : entry;
}

function indataVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error$1('First argument to indata must be a string literal.');
  if (args[1].type !== Literal) error$1('Second argument to indata must be a string literal.');

  var data = args[0].value,
      field$$1 = args[1].value,
      indexName = indexPrefix + field$$1;

  if (!params.hasOwnProperty(indexName)) {
    params[indexName] = scope.getData(data).indataRef(scope, field$$1);
  }
}

function setdata(name, tuples) {
  var df = this.context.dataflow,
      data = this.context.data[name],
      input = data.input;

  df.pulse(input, df.changeset().remove(truthy).insert(tuples));
  return 1;
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

var inrange = function(value, range) {
  var r0 = range[0], r1 = range[range.length-1], t;
  if (r0 > r1) {
    t = r0;
    r0 = r1;
    r1 = t;
  }
  return r0 <= value && value <= r1;
};

var encode = function(item, name, retval) {
  if (item) {
    var df = this.context.dataflow,
        target = item.mark.source;
    df.pulse(target, df.changeset().encode(item, name));
  }
  return retval !== undefined ? retval : item;
};

function equal(a, b) {
  return a === b || a !== a && b !== b ? true
    : isArray(a) && isArray(b) && a.length === b.length ? equalArray(a, b)
    : false;
}

function equalArray(a, b) {
  for (var i=0, n=a.length; i<n; ++i) {
    if (!equal(a[i], b[i])) return false;
  }
  return true;
}

function removePredicate(props) {
  return function(_) {
    for (var key$$1 in props) {
      if (key$$1 !== '_id' && !equal(_[key$$1], props[key$$1])) return false;
    }
    return true;
  };
}

var modify = function(name, insert, remove, toggle, modify, values) {
  var df = this.context.dataflow,
      data = this.context.data[name],
      input = data.input,
      changes = data.changes,
      stamp = df.stamp(),
      predicate, key$$1;

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
    for (key$$1 in values) {
      changes.modify(modify, key$$1, values[key$$1]);
    }
  }

  return 1;
};

var UNION = 'union';
var UNIT = 'unit';
var OTHERS = 'others';

function testPoint(datum, entry) {
  var fields = entry.fields,
      values = entry.values,
      getter = entry.getter || (entry.getter = []),
      bins = entry.bins,
      n = fields.length,
      i = 0, dval;

  for (; i<n; ++i) {
    getter[i] = getter[i] || field(fields[i]);
    dval = getter[i](datum);
    if (isDate(dval)) dval = toNumber(dval);
    if (isDate(values[i])) values[i] = toNumber(values[i]);
    if (bins && bins[fields[i]]) {
      if (isDate(values[i][0])) values[i] = values[i].map(toNumber);
      if (!inrange(dval, values[i])) return false;
    } else if (dval !== values[i]) {
      return false;
    }
  }

  return true;
}

// TODO: revisit date coercion?
// have selections populate with consistent types upon write?

function testInterval(datum, entry) {
  var ivals = entry.intervals,
      n = ivals.length,
      i = 0,
      getter, extent, value;

  for (; i<n; ++i) {
    extent = ivals[i].extent;
    getter = ivals[i].getter || (ivals[i].getter = field(ivals[i].field));
    value = getter(datum);
    if (!extent || extent[0] === extent[1]) return false;
    if (isDate(value)) value = toNumber(value);
    if (isDate(extent[0])) extent = ivals[i].extent = extent.map(toNumber);
    if (isNumber(extent[0]) && !inrange(value, extent)) return false;
    else if (isString(extent[0]) && extent.indexOf(value) < 0) return false;
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
  // if no active selections, return false
  return n && intersect;
}

// Assumes point selection tuples are of the form:
// {unit: string, encodings: array<string>, fields: array<string>, values: array<*>, bins: object}
function vlPoint(name, unit, datum, op, scope) {
  return vlSelection.call(this, name, unit, datum, op, scope, testPoint);
}

// Assumes interval selection typles are of the form:
// {unit: string, intervals: array<{encoding: string, field:string, extent:array<number>}>}
function vlInterval(name, unit, datum, op, scope) {
  return vlSelection.call(this, name, unit, datum, op, scope, testInterval);
}

/**
 * Materializes a point selection as a scale domain.
 * @param {string} name - The name of the dataset representing the selection.
 * @param {string} [encoding] - A particular encoding channel to materialize.
 * @param {string} [field] - A particular field to materialize.
 * @param {string} [op='intersect'] - The set operation for combining selections.
 * One of 'intersect' (default) or 'union'.
 * @returns {array} An array of values to serve as a scale domain.
 */
function vlPointDomain(name, encoding, field$$1, op) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      entry = entries[0],
      i = 0, n, index, values, continuous;

  if (!entry) return undefined;

  for (n = encoding ? entry.encodings.length : entry.fields.length; i<n; ++i) {
    if ((encoding && entry.encodings[i] === encoding) ||
        (field$$1 && entry.fields[i] === field$$1)) {
      index = i;
      continuous = entry.bins && entry.bins[entry.fields[i]];
      break;
    }
  }

  values = entries.reduce(function(acc, entry) {
    acc.push({
      unit: entry.unit,
      value: entry.values[index]
    });
    return acc;
  }, []);

  return continuous ? continuousDomain(values, op) : discreteDomain(values, op);
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
function vlIntervalDomain(name, encoding, field$$1, op) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      entry = entries[0],
      i = 0, n, interval, index, values, discrete;

  if (!entry) return undefined;

  for (n = entry.intervals.length; i<n; ++i) {
    interval = entry.intervals[i];
    if ((encoding && interval.encoding === encoding) ||
        (field$$1 && interval.field === field$$1)) {
      if (!interval.extent) return undefined;
      index = i;
      discrete = interval.extent.length > 2;
      break;
    }
  }

  values = entries.reduce(function(acc, entry) {
  var extent = entry.intervals[index].extent,
      value = discrete
         ? extent.map(function (d) { return {unit: entry.unit, value: d}; })
         : {unit: entry.unit, value: extent};

     if (discrete) {
       acc.push.apply(acc, value);
       return acc;
     } else {
       acc.push(value);
       return acc;
     }
  }, []);


  return discrete ? discreteDomain(values, op) : continuousDomain(values, op);
}

function discreteDomain(entries, op) {
  var units = {}, count = 0,
      values = {}, domain = [],
      i = 0, n = entries.length,
      entry, unit, v, key$$1;

  for (; i<n; ++i) {
    entry = entries[i];
    unit  = entry.unit;
    key$$1   = entry.value;

    if (!units[unit]) units[unit] = ++count;
    if (!(v = values[key$$1])) {
      values[key$$1] = v = {value: key$$1, units: {}, count: 0};
    }
    if (!v.units[unit]) v.units[unit] = ++v.count;
  }

  for (key$$1 in values) {
    v = values[key$$1];
    if (op !== UNION && v.count !== count) continue;
    domain.push(v.value);
  }

  return domain.length ? domain : undefined;
}

function continuousDomain(entries, op) {
  var merge = op === UNION ? unionInterval : intersectInterval,
      i = 0, n = entries.length,
      extent, domain, lo, hi;

  for (; i<n; ++i) {
    extent = entries[i].value;
    if (isDate(extent[0])) extent = extent.map(toNumber);
    lo = extent[0];
    hi = extent[1];
    if (lo > hi) {
      hi = extent[0];
      lo = extent[1];
    }
    domain = domain ? merge(domain, lo, hi) : [lo, hi];
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
  rgb: rgb,
  lab: lab,
  hcl: hcl,
  hsl: hsl,
  sequence: sequence,
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
  screen: screen,
  containerSize: containerSize,
  windowSize: windowSize,
  span: span,
  bandspace: bandspace,
  inrange: inrange,
  setdata: setdata,
  panLinear: panLinear,
  panLog: panLog,
  panPow: panPow,
  zoomLinear: zoomLinear,
  zoomLog: zoomLog,
  zoomPow: zoomPow,
  encode: encode,
  modify: modify
};

var eventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'];
var eventPrefix = 'event.vega.';
var thisPrefix = 'this.';
var astVisitors = {}; // AST visitors for dependency analysis

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
function buildFunctions(codegen$$1) {
  var fn = Functions(codegen$$1);
  eventFunctions.forEach(function(name) { fn[name] = eventPrefix + name; });
  for (var name in functionContext) { fn[name] = thisPrefix + name; }
  return fn;
}

// Export code generator and parameters
var codegenParams = {
  blacklist:  ['_'],
  whitelist:  ['datum', 'event', 'item'],
  fieldvar:   'datum',
  globalvar:  function(id$$1) { return '_[' + $('$' + id$$1) + ']'; },
  functions:  buildFunctions,
  constants:  Constants,
  visitors:   astVisitors
};

var codeGenerator = codegen(codegenParams);

var signalPrefix = '$';

var parseExpression = function(expr, scope, preamble) {
  var params = {}, ast, gen;

  // parse the expression to an abstract syntax tree (ast)
  try {
    ast = parse$3(expr);
  } catch (err) {
    error$1('Expression parse error: ' + $(expr));
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
};

var VIEW$1 = 'view';
var SCOPE = 'scope';

var parseStream = function(stream, scope) {
  return stream.signal ? scope.getSignal(stream.signal).id
    : stream.scale ? scope.getScale(stream.scale).id
    : parseStream$1(stream, scope);
};

function eventSource(source) {
   return source === SCOPE ? VIEW$1 : (source || VIEW$1);
}

function parseStream$1(stream, scope) {
  var method = stream.merge ? mergeStream
    : stream.stream ? nestedStream
    : stream.type ? eventStream
    : error$1('Invalid stream specification: ' + $(stream));

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
  var id$$1 = parseStream$1(stream.stream, scope),
      entry = streamParameters({stream: id$$1}, stream, scope);
  return scope.addStream(entry).id;
}

function eventStream(stream, scope) {
  var id$$1 = scope.event(eventSource(stream.source), stream.type),
      entry = streamParameters({stream: id$$1}, stream, scope);
  return Object.keys(entry).length === 1 ? id$$1
    : scope.addStream(entry).id;
}

function streamParameters(entry, stream, scope) {
  var param = stream.between;

  if (param) {
    if (param.length !== 2) {
      error$1('Stream "between" parameter must have 2 entries: ' + $(stream));
    }
    entry.between = [
      parseStream$1(param[0], scope),
      parseStream$1(param[1], scope)
    ];
  }

  param = stream.filter ? array$1(stream.filter) : [];
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
var selector = function(selector, source, marks) {
  DEFAULT_SOURCE = source || VIEW$2;
  MARKS = marks || DEFAULT_MARKS;
  return parseMerge(selector.trim()).map(parseSelector);
};

var VIEW$2    = 'view';
var LBRACK  = '[';
var RBRACK  = ']';
var LBRACE  = '{';
var RBRACE  = '}';
var COLON   = ':';
var COMMA   = ',';
var NAME    = '@';
var GT      = '>';
var ILLEGAL$1 = /[[\]{}]/;
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

function find$1(s, i, endChar, pushChar, popChar) {
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
    i = find$1(s, i, COMMA, LBRACK + LBRACE, RBRACK + RBRACE);
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

  i = find$1(s, i, RBRACK, LBRACK, RBRACK);
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
  j = find$1(s, i, COLON);
  if (j < n) {
    source.push(s.substring(start, j).trim());
    start = i = ++j;
  }

  // extract remaining part of stream selector
  i = find$1(s, i, LBRACK);
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
    i = find$1(s, i, RBRACK);
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
    stream.type = stream.type.slice(0, -1);
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

var parseUpdate = function(spec, scope, target) {
  var events = spec.events,
      update = spec.update,
      encode = spec.encode,
      sources = [],
      value = '', entry;

  if (!events) {
    error$1('Signal update missing events specification.');
  }

  // interpret as an event selector string
  if (isString(events)) {
    events = selector(events);
  }

  // separate event streams from signal updates
  events = array$1(events).filter(function(stream) {
    if (stream.signal || stream.scale) {
      sources.push(stream);
      return 0;
    } else {
      return 1;
    }
  });

  // merge event streams, include as source
  if (events.length) {
    sources.push(events.length > 1 ? {merge: events} : events[0]);
  }

  if (encode != null) {
    if (update) error$1('Signal encode and update are mutually exclusive.');
    update = 'encode(item(),' + $(encode) + ')';
  }

  // resolve update value
  value = isString(update) ? parseExpression(update, scope, preamble)
    : update.expr != null ? parseExpression(update.expr, scope, preamble)
    : update.value != null ? update.value
    : update.signal != null ? {
        $expr:   '_.value',
        $params: {value: scope.signalRef(update.signal)}
      }
    : error$1('Invalid signal update specification.');

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
};

var parseSignalUpdates = function(signal, scope) {
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
};

function Entry(type, value, params, parent) {
  this.id = -1;
  this.type = type;
  this.value = value;
  this.params = params;
  if (parent) this.parent = parent;
}

function entry(type, value, params, parent) {
  return new Entry(type, value, params, parent);
}

function operator(value, params) {
  return entry('Operator', value, params);
}

// -----

function ref(op) {
  var ref = {$ref: op.id};
  // if operator not yet registered, cache ref to resolve later
  if (op.id < 0) (op.refs = op.refs || []).push(ref);
  return ref;
}

function fieldRef$1(field$$1, name) {
  return name ? {$field: field$$1, $name: name} : {$field: field$$1};
}

var keyFieldRef = fieldRef$1('key');

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

function aggrField(op, field$$1) {
  return (op && op.signal ? '$' + op.signal : op || '')
    + (op && field$$1 ? '_' : '')
    + (field$$1 && field$$1.signal ? '$' + field$$1.signal : field$$1 || '');
}

// -----

function isSignal(_) {
  return _ && _.signal;
}

function value(specValue, defaultValue) {
  return specValue != null ? specValue : defaultValue;
}

function transform$2(name) {
  return function(params, value$$1, parent) {
    return entry(name, value$$1, params || undefined, parent);
  };
}

var Aggregate$1 = transform$2('Aggregate');
var AxisTicks$1 = transform$2('AxisTicks');
var Bound$1 = transform$2('Bound');
var Collect$1 = transform$2('Collect');
var Compare$1 = transform$2('Compare');
var DataJoin$1 = transform$2('DataJoin');
var Encode$1 = transform$2('Encode');

var Facet$1 = transform$2('Facet');
var Field$1 = transform$2('Field');
var Key$1 = transform$2('Key');
var LegendEntries$1 = transform$2('LegendEntries');
var Mark$1 = transform$2('Mark');
var MultiExtent$1 = transform$2('MultiExtent');
var MultiValues$1 = transform$2('MultiValues');
var Overlap$1 = transform$2('Overlap');
var Params$1 = transform$2('Params');
var PreFacet$1 = transform$2('PreFacet');
var Projection$1 = transform$2('Projection');
var Proxy$1 = transform$2('Proxy');
var Relay$1 = transform$2('Relay');
var Render$1 = transform$2('Render');
var Scale$1 = transform$2('Scale');
var Sieve$1 = transform$2('Sieve');
var SortItems$1 = transform$2('SortItems');
var ViewLayout$1 = transform$2('ViewLayout');
var Values$1 = transform$2('Values');

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

function initScale(spec, scope) {
  var type = spec.type || 'linear';

  if (!allTypes.hasOwnProperty(type)) {
    error$1('Unrecognized scale type: ' + $(type));
  }

  scope.addScale(spec.name, {
    type:   type,
    domain: undefined
  });
}

function parseScale(spec, scope) {
  var params = scope.getScale(spec.name).params,
      key$$1;

  params.domain = parseScaleDomain(spec.domain, spec, scope);

  if (spec.range != null) {
    params.range = parseScaleRange(spec, scope, params);
  }

  if (spec.interpolate != null) {
    parseScaleInterpolate(spec.interpolate, params);
  }

  for (key$$1 in spec) {
    if (params.hasOwnProperty(key$$1) || key$$1 === 'name') continue;
    params[key$$1] = parseLiteral(spec[key$$1], scope);
  }
}

function parseLiteral(v, scope) {
  return !isObject(v) ? v
    : v.signal ? scope.signalRef(v.signal)
    : error$1('Unsupported object: ' + $(v));
}

function parseArray(v, scope) {
  return v.signal
    ? scope.signalRef(v.signal)
    : v.map(function(v) { return parseLiteral(v, scope); });
}

function dataLookupError(name) {
  error$1('Can not find data set: ' + $(name));
}

// -- SCALE DOMAIN ----

function parseScaleDomain(domain, spec, scope) {
  if (!domain) {
    if (spec.domainMin != null || spec.domainMax != null) {
      error$1('No scale domain defined for domainMin/domainMax to override.');
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
          : (isArray(d) || d.signal) ? fieldRef(d, scope)
          : d;
        dom.push(d);
        return dom;
      }, []);

  return (isOrdinal(spec.type) ? ordinalMultipleDomain
    : isQuantile(spec.type) ? quantileMultipleDomain
    : numericMultipleDomain)(domain, scope, fields);
}

function fieldRef(data, scope) {
  var name = '_:vega:_' + (FIELD_REF_ID++),
      coll = Collect$1({});

  if (isArray(data)) {
    coll.value = {$ingest: data};
  } else if (data.signal) {
    scope.signalRef('setdata(' + $(name) + ',' + data.signal + ')');
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
      error$1('No field provided for sort aggregate op: ' + sort.op);
    } else if (multidomain && sort.field) {
      error$1('Multiple domain scales can not sort by field.');
    } else if (multidomain && sort.op && sort.op !== 'count') {
      error$1('Multiple domain scales support op count only.');
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
      range = [0, {signal: 'width'}];
    } else if (range === 'height') {
      range = isOrdinal(spec.type)
        ? [0, {signal: 'height'}]
        : [{signal: 'height'}, 0];
    } else {
      error$1('Unrecognized scale range value: ' + $(range));
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
    error$1('Unsupported range type: ' + $(range));
  }

  return range.map(function(v) {
    return parseLiteral(v, scope);
  });
}

var parseProjection = function(proj, scope) {
  var params = {};

  for (var name in proj) {
    if (name === 'name') continue;
    params[name] = parseParameter(proj[name], scope);
  }

  scope.addProjection(proj.name, params);
};

function parseParameter(_, scope) {
  return isArray(_) ? _.map(function(_) { return parseParameter(_, scope); })
    : !isObject(_) ? _
    : _.signal ? scope.signalRef(_.signal)
    : error$1('Unsupported parameter object: ' + $(_));
}

var Top$1 = 'top';
var Left$1 = 'left';
var Right$1 = 'right';
var Bottom$1 = 'bottom';

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

var Skip = {
  name: 1,
  interactive: 1
};

var Skip$1 = toSet(['rule']);
var Swap = toSet(['group', 'image', 'rect']);

var adjustSpatial = function(encode, marktype) {
  var code = '';

  if (Skip$1[marktype]) return code;

  if (encode.x2) {
    if (encode.x) {
      if (Swap[marktype]) {
        code += 'if(o.x>o.x2)$=o.x,o.x=o.x2,o.x2=$;';
      }
      code += 'o.width=o.x2-o.x;';
    } else {
      code += 'o.x=o.x2-(o.width||0);';
    }
  }

  if (encode.xc) {
    code += 'o.x=o.xc-(o.width||0)/2;';
  }

  if (encode.y2) {
    if (encode.y) {
      if (Swap[marktype]) {
        code += 'if(o.y>o.y2)$=o.y,o.y=o.y2,o.y2=$;';
      }
      code += 'o.height=o.y2-o.y;';
    } else {
      code += 'o.y=o.y2-(o.height||0);';
    }
  }

  if (encode.yc) {
    code += 'o.y=o.yc-(o.height||0)/2;';
  }

  return code;
};

var color$2 = function(enc, scope, params, fields) {
  function color(type, x, y, z) {
    var a = entry$1(null, x, scope, params, fields),
        b = entry$1(null, y, scope, params, fields),
        c = entry$1(null, z, scope, params, fields);
    return 'this.' + type + '(' + [a, b, c].join(',') + ').toString()';
  }

  return (enc.c) ? color('hcl', enc.h, enc.c, enc.l)
    : (enc.h || enc.s) ? color('hsl', enc.h, enc.s, enc.l)
    : (enc.l || enc.a) ? color('lab', enc.l, enc.a, enc.b)
    : (enc.r || enc.g || enc.b) ? color('rgb', enc.r, enc.g, enc.b)
    : null;
};

var expression = function(code, scope, params, fields) {
  var expr = parseExpression(code, scope);
  expr.$fields.forEach(function(name) { fields[name] = 1; });
  extend(params, expr.$params);
  return expr.$expr;
};

var field$1 = function(ref, scope, params, fields) {
  return resolve$1(isObject(ref) ? ref : {datum: ref}, scope, params, fields);
};

function resolve$1(ref, scope, params, fields) {
  var object, level, field$$1;

  if (ref.signal) {
    object = 'datum';
    field$$1 = expression(ref.signal, scope, params, fields);
  } else if (ref.group || ref.parent) {
    level = Math.max(1, ref.level || 1);
    object = 'item';

    while (level-- > 0) {
      object += '.mark.group';
    }

    if (ref.parent) {
      field$$1 = ref.parent;
      object += '.datum';
    } else {
      field$$1 = ref.group;
    }
  } else if (ref.datum) {
    object = 'datum';
    field$$1 = ref.datum;
  } else {
    error$1('Invalid field reference: ' + $(ref));
  }

  if (!ref.signal) {
    if (isString(field$$1)) {
      fields[field$$1] = 1; // TODO review field tracking?
      field$$1 = splitAccessPath(field$$1).map($).join('][');
    } else {
      field$$1 = resolve$1(field$$1, scope, params, fields);
    }
  }

  return object + '[' + field$$1 + ']';
}

var scale$3 = function(enc, value, scope, params, fields) {
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
};

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
    scaleName = $(scaleName);
  } else {
    // indirect scale lookup; add all scales as parameters
    for (scaleName in scope.scales) {
      params[scalePrefix + scaleName] = scope.scaleRef(scaleName);
    }
    scaleName = $(scalePrefix) + '+'
      + (name.signal
        ? '(' + expression(name.signal, scope, params, fields) + ')'
        : field$1(name, scope, params, fields));
  }

  return '_[' + scaleName + ']';
}

var gradient$1 = function(enc, scope, params, fields) {
  return 'this.gradient('
    + getScale$1(enc.gradient, scope, params, fields)
    + ',' + $(enc.start)
    + ',' + $(enc.stop)
    + ',' + $(enc.count)
    + ')';
};

var property = function(property, scope, params, fields) {
  return isObject(property)
      ? '(' + entry$1(null, property, scope, params, fields) + ')'
      : property;
};

var entry$1 = function(channel, enc, scope, params, fields) {
  if (enc.gradient != null) {
    return gradient$1(enc, scope, params, fields);
  }

  var value = enc.signal ? expression(enc.signal, scope, params, fields)
    : enc.color ? color$2(enc.color, scope, params, fields)
    : enc.field != null ? field$1(enc.field, scope, params, fields)
    : enc.value !== undefined ? $(enc.value)
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
};

var set$5 = function(obj, key$$1, value) {
  return obj + '[' + $(key$$1) + ']=' + value + ';';
};

var rule$1 = function(channel, rules, scope, params, fields) {
  var code = '';

  rules.forEach(function(rule) {
    var value = entry$1(channel, rule, scope, params, fields);
    code += rule.test
      ? expression(rule.test, scope, params, fields) + '?' + value + ':'
      : value;
  });

  return set$5('o', channel, code);
};

function parseEncode(encode, marktype, params, scope) {
  var fields = {},
      code = 'var o=item,datum=o.datum,$;',
      channel, enc, value;

  for (channel in encode) {
    enc = encode[channel];
    if (isArray(enc)) { // rule
      code += rule$1(channel, enc, scope, params, fields);
    } else {
      value = entry$1(channel, enc, scope, params, fields);
      code += set$5('o', channel, value);
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
  if (value != null) {
    object[name] = {value: value};
    return 1;
  } else {
    return 0;
  }
}

function extendEncode(encode, extra, skip) {
  for (var name in extra) {
    if (skip && skip.hasOwnProperty(name)) continue;
    encode[name] = extend(encode[name] || {}, extra[name]);
  }
  return encode;
}

function encoders(encode, type, role, scope, params) {
  var enc, key$$1;
  params = params || {};
  params.encoders = {$encode: (enc = {})};

  encode = applyDefaults(encode, type, role, scope.config);

  for (key$$1 in encode) {
    enc[key$$1] = parseEncode(encode[key$$1], type, params, scope);
  }

  return params;
}

function applyDefaults(encode, type, role, config) {
  var enter, key$$1, skip;

  // ignore legend and axis
  if (role == 'legend' || String(role).indexOf('axis') === 0) {
    role = null;
  }

  config = role === FrameRole$1 ? config.group
    : (role === MarkRole || config[type = role]) ? extend({}, config.mark, config[type])
    : {};

  enter = {};
  for (key$$1 in config) {
    // do not apply defaults if relevant fields are defined
    skip = has(key$$1, encode)
      || (key$$1 === 'fill' || key$$1 === 'stroke')
      && (has('fill', encode) || has('stroke', encode));

    if (!skip) enter[key$$1] = {value: config[key$$1]};
  }

  encode = extend({}, encode); // defensive copy
  encode.enter = extend(enter, encode.enter);

  return encode;
}

function has(key$$1, encode) {
  return encode && (
    (encode.enter && encode.enter[key$$1]) ||
    (encode.update && encode.update[key$$1])
  );
}

var guideMark = function(type, role, key, dataRef, encode, extras) {
  return {
    type: type,
    name: extras ? extras.name : undefined,
    role: role,
    key:  key,
    from: dataRef,
    interactive: !!(extras && extras.interactive),
    encode: extendEncode(encode, extras, Skip)
  };
};

var GroupMark = 'group';
var RectMark = 'rect';
var RuleMark = 'rule';
var SymbolMark = 'symbol';
var TextMark = 'text';

var legendGradient = function(scale, config, userEncode) {
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
};

var alignExpr = 'datum.' + Perc + '<=0?"left"'
  + ':datum.' + Perc + '>=1?"right":"center"';

var legendGradientLabels = function(spec, config, userEncode, dataRef) {
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
};

var legendLabels = function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero
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
    opacity: {value: 1},
    text: {field: Label}
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
};

var legendSymbols = function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'shape', config.symbolType);
  addEncode(enter, 'size', config.symbolSize);
  addEncode(enter, 'strokeWidth', config.symbolStrokeWidth);
  if (!(spec.fill || has('fill', userEncode))) {
    addEncode(enter, 'stroke', config.symbolColor);
  }

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
};

var legendTitle = function(spec, config, userEncode, dataRef) {
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
};

var guideGroup = function(role, name, dataRef, interactive, encode, marks) {
  return {
    type: GroupMark,
    name: name,
    role: role,
    from: dataRef,
    interactive: interactive,
    encode: encode,
    marks: marks
  };
};

var role = function(spec) {
  var role = spec.role || '';
  return (!role.indexOf('axis') || !role.indexOf('legend'))
    ? role
    : spec.type === GroupMark ? ScopeRole$1 : (role || MarkRole);
};

var definition$1 = function(spec) {
  return {
    clip:        spec.clip || false,
    interactive: spec.interactive === false ? false : true,
    marktype:    spec.type,
    name:        spec.name || undefined,
    role:        spec.role || role(spec),
    zindex:      +spec.zindex || undefined
  };
};

var dataName = function(name) {
  return name;
};

/**
 * Parse a data transform specification.
 */
var parseTransform = function(spec, scope) {
  var def = definition(spec.type);
  if (!def) error$1('Unrecognized transform type: ' + $(spec.type));

  var t = entry(def.type, null, parseParameters(def, spec, scope));
  if (spec.signal) scope.addSignal(spec.signal, scope.proxy(t));
  t.metadata = def.metadata || {};

  return t;
};

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
      value$$1 = spec[def.name];

  if (type === 'index') {
    return parseIndexParameter(def, spec, scope);
  } else if (value$$1 === undefined) {
    if (def.required) {
      error$1('Missing required ' + $(spec.type)
          + ' parameter: ' + $(def.name));
    }
    return;
  } else if (type === 'param') {
    return parseSubParameters(def, spec, scope);
  } else if (type === 'projection') {
    return scope.projectionRef(spec[def.name]);
  }

  return def.array && !isSignal(value$$1)
    ? value$$1.map(function(v) { return parameterValue(def, v, scope); })
    : parameterValue(def, value$$1, scope);
}

/**
 * Parse a single parameter value.
 */
function parameterValue(def, value$$1, scope) {
  var type = def.type;

  if (isSignal(value$$1)) {
    return isExpr(type) ? error$1('Expression references can not be signals.')
         : isField(type) ? scope.fieldRef(value$$1)
         : isCompare(type) ? scope.compareRef(value$$1)
         : scope.signalRef(value$$1.signal);
  } else {
    var expr = def.expr || isField(type);
    return expr && outerExpr(value$$1) ? parseExpression(value$$1.expr, scope)
         : expr && outerField(value$$1) ? fieldRef$1(value$$1.field)
         : isExpr(type) ? parseExpression(value$$1, scope)
         : isData(type) ? ref(scope.getData(value$$1).values)
         : isField(type) ? fieldRef$1(value$$1)
         : isCompare(type) ? scope.compareRef(value$$1)
         : value$$1;
  }
}

/**
 * Parse parameter for accessing an index of another data set.
 */
function parseIndexParameter(def, spec, scope) {
  if (!isString(spec.from)) {
    error$1('Lookup "from" parameter must be a string literal.');
  }
  return scope.getData(spec.from).lookupRef(scope, spec.key);
}

/**
 * Parse a parameter that contains one or more sub-parameter objects.
 */
function parseSubParameters(def, spec, scope) {
  var value$$1 = spec[def.name];

  if (def.array) {
    if (!isArray(value$$1)) { // signals not allowed!
      error$1('Expected an array of sub-parameters. Instead: ' + $(value$$1));
    }
    return value$$1.map(function(v) {
      return parseSubParameter(def, v, scope);
    });
  } else {
    return parseSubParameter(def, value$$1, scope);
  }
}

/**
 * Parse a sub-parameter object.
 */
function parseSubParameter(def, value$$1, scope) {
  var params, pdef, k, i, n;

  // loop over defs to find matching key
  for (i=0, n=def.params.length; i<n; ++i) {
    pdef = def.params[i];
    for (k in pdef.key) {
      if (pdef.key[k] !== value$$1[k]) { pdef = null; break; }
    }
    if (pdef) break;
  }
  // raise error if matching key not found
  if (!pdef) error$1('Unsupported parameter: ' + $(value$$1));

  // parse params, create Params transform, return ref
  params = extend(parseParameters(pdef, value$$1, scope), pdef.key);
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

var parseData = function(from, group, scope) {
  var facet, key$$1, op, dataRef, parent;

  // if no source data, generate singleton datum
  if (!from) {
    dataRef = ref(scope.add(Collect$1(null, [{}])));
  }

  // if faceted, process facet specification
  else if (facet = from.facet) {
    if (!group) error$1('Only group marks can be faceted.');

    // use pre-faceted source data, if available
    if (facet.field != null) {
      dataRef = parent = ref(scope.getData(facet.data).output);
    } else {
      key$$1 = scope.keyRef(facet.groupby);

      // generate facet aggregates if no direct data specification
      if (!from.data) {
        op = parseTransform(extend({
          type:    'aggregate',
          groupby: array$1(facet.groupby)
        }, facet.aggregate));
        op.params.key = key$$1;
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
    key: key$$1,
    pulse: dataRef,
    parent: parent
  };
};

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

var prototype$75 = DataScope.prototype;

prototype$75.countsRef = function(scope, field$$1, sort) {
  var ds = this,
      cache = ds.counts || (ds.counts = {}),
      k = fieldKey(field$$1), v, a, p;

  if (k != null) {
    scope = ds.scope;
    v = cache[k];
  }

  if (!v) {
    p = {
      groupby: scope.fieldRef(field$$1, 'key'),
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

function fieldKey(field$$1) {
  return isString(field$$1) ? field$$1 : null;
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

function cache(scope, ds, name, optype, field$$1, counts, index) {
  var cache = ds[name] || (ds[name] = {}),
      sort = sortKey(counts),
      k = fieldKey(field$$1), v, op;

  if (k != null) {
    scope = ds.scope;
    k = k + (sort ? '|' + sort : '');
    v = cache[k];
  }

  if (!v) {
    var params = counts
      ? {field: keyFieldRef, pulse: ds.countsRef(scope, field$$1, counts)}
      : {field: scope.fieldRef(field$$1), pulse: ref(ds.output)};
    if (sort) params.sort = scope.sortRef(counts);
    op = scope.add(entry(optype, undefined, params));
    if (index) ds.index[field$$1] = op;
    v = ref(op);
    if (k != null) cache[k] = v;
  }
  return v;
}

prototype$75.tuplesRef = function() {
  return ref(this.values);
};

prototype$75.extentRef = function(scope, field$$1) {
  return cache(scope, this, 'extent', 'Extent', field$$1, false);
};

prototype$75.domainRef = function(scope, field$$1) {
  return cache(scope, this, 'domain', 'Values', field$$1, false);
};

prototype$75.valuesRef = function(scope, field$$1, sort) {
  return cache(scope, this, 'vals', 'Values', field$$1, sort || true);
};

prototype$75.lookupRef = function(scope, field$$1) {
  return cache(scope, this, 'lookup', 'TupleIndex', field$$1, false);
};

prototype$75.indataRef = function(scope, field$$1) {
  return cache(scope, this, 'indata', 'TupleIndex', field$$1, true, true);
};

var parseFacet = function(spec, scope, group) {
  var facet = spec.from.facet,
      name = facet.name,
      data = ref(scope.getData(facet.data).output),
      subscope, source, values, op;

  if (!facet.name) {
    error$1('Facet must have a name: ' + $(facet));
  }
  if (!facet.data) {
    error$1('Facet must reference a data set: ' + $(facet));
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
    error$1('Facet must specify groupby or field: ' + $(facet));
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
};

var parseSubflow = function(spec, scope, input) {
  var op = scope.add(PreFacet$1({pulse: input.pulse})),
      subscope = scope.fork();

  subscope.add(Sieve$1());
  subscope.addSignal('parent', null);

  // parse group mark subflow
  op.params.subflow = {
    $subflow: parseSpec(spec, subscope).toRuntime()
  };
};

var parseTrigger = function(spec, scope, name) {
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
};

var parseMark = function(spec, scope) {
  var role$$1 = role(spec),
      group = spec.type === GroupMark,
      facet = spec.from && spec.from.facet,
      layout = spec.layout || role$$1 === ScopeRole$1 || role$$1 === FrameRole$1,
      nested = role$$1 === MarkRole || layout || facet,
      ops, op, input, store, bound, render, sieve, name,
      joinRef, markRef, encodeRef, layoutRef, boundRef;

  // resolve input data
  input = parseData(spec.from, group, scope);

  // data join to map tuples to visual items
  op = scope.add(DataJoin$1({
    key:   input.key || (spec.key ? fieldRef$1(spec.key) : undefined),
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
    encoders(spec.encode, spec.type, role$$1, scope, {pulse: markRef})
  ));

  // monitor parent marks to propagate changes
  op.params.parent = scope.encode();

  // add post-encoding transforms, if defined
  if (spec.transform) {
    spec.transform.forEach(function(_) {
      var tx = parseTransform(_, scope);
      if (tx.metadata.generates || tx.metadata.changes) {
        error$1('Mark transforms should not generate new data.');
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

  if (spec.overlap) {
    boundRef = ref(scope.add(Overlap$1({
      method: spec.overlap === true ? 'parity' : spec.overlap,
      pulse:  boundRef
    })));
  }

  // render / sieve items
  render = scope.add(Render$1({pulse: boundRef}));
  sieve = scope.add(Sieve$1({pulse: ref(render)}, undefined, scope.parent()));

  // if mark is named, make accessible as reactive geometry
  // add trigger updates if defined
  if (spec.name != null) {
    name = dataName(spec.name);
    scope.addData(name, new DataScope(scope, store, render, sieve));
    if (spec.on) spec.on.forEach(function(on) {
      if (on.insert || on.remove || on.toggle) {
        error$1('Marks only support modify triggers.');
      }
      parseTrigger(on, scope, name);
    });
  }
};

var parseLegend = function(spec, scope) {
  var type = spec.type || 'symbol',
      config = scope.config.legend,
      encode = spec.encode || {},
      legendEncode = encode.legend || {},
      name = legendEncode.name || undefined,
      interactive = !!legendEncode.interactive,
      datum, dataRef, entryRef, group, title,
      entryEncode, children;

  // resolve 'canonical' scale name
  var scale = spec.size || spec.shape || spec.fill || spec.stroke
           || spec.strokeDash || spec.opacity;

  if (!scale) {
    error$1('Missing valid scale for legend.');
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
  }, legendEncode, Skip);

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
      values: scope.objectProperty(spec.values),
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
};

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
            + addEncode(enter, 'cornerRadius', config.cornerRadius);
  return count ? enter : undefined;
}

var parseTitle = function(spec, scope) {
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
};

function buildTitle(spec, config, userEncode, dataRef) {
  var title = spec.text,
      orient = spec.orient || config.orient,
      anchor = spec.anchor || config.anchor,
      sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
      horizontal = (orient === Top$1 || orient === Bottom$1),
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
    offset: encoder((spec.offset != null ? spec.offset : config.offset) || 0)
  };

  if (anchor === 'start') {
    mult = 0;
    align = 'left';
  } else {
    if (anchor === 'end') {
      mult = 1;
      align = 'right';
    } else {
      mult = 0.5;
      align = 'center';
    }
  }

  pos = {field: extent, mult: mult};

  opp = sign < 0 ? {value: 0}
    : horizontal ? {field: {group: 'height'}}
    : {field: {group: 'width'}};

  if (horizontal) {
    update.x = pos;
    update.y = opp;
    update.angle = {value: 0};
    update.baseline = {value: orient === Top$1 ? 'bottom' : 'top'};
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
  s.metadata = {source: true};
  return s;
}

var axisConfig = function(spec, scope) {
  var config = scope.config,
      orient = spec.orient,
      xy = (orient === Top$1 || orient === Bottom$1) ? config.axisX : config.axisY,
      or = config['axis' + orient[0].toUpperCase() + orient.slice(1)],
      band = scope.scaleType(spec.scale) === 'band' && config.axisBand;

  return (xy || or || band)
    ? extend({}, config.axis, xy, or, band)
    : config.axis;
};

var axisDomain = function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      zero = {value: 0},
      encode = {}, enter, update, u, u2, v;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'stroke', config.domainColor);
  addEncode(enter, 'strokeWidth', config.domainWidth);

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  if (orient === Top$1 || orient === Bottom$1) {
    u = 'x';
    v = 'y';
  } else {
    u = 'y';
    v = 'x';
  }
  u2 = u + '2';

  enter[v] = zero;
  update[u] = enter[u] = position(spec, 0);
  update[u2] = enter[u2] = position(spec, 1);

  return guideMark(RuleMark, AxisDomainRole, null, dataRef, encode, userEncode);
};

function position(spec, pos) {
  return {scale: spec.scale, range: pos};
}

var axisGrid = function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      vscale = spec.gridScale,
      sign = (orient === Left$1 || orient === Top$1) ? 1 : -1,
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
    extra:  config.tickExtra,
    offset: config.tickOffset
  };

  if (orient === Top$1 || orient === Bottom$1) {
    u = 'x';
    v = 'y';
    s = 'height';
  } else {
    u = 'y';
    v = 'x';
    s = 'width';
  }
  v2 = v + '2';

  update[u] = enter[u] = exit[u] = tickPos;

  if (vscale) {
    enter[v] = {scale: vscale, range: 0, mult: sign, offset: offset};
    update[v2] = enter[v2] = {scale: vscale, range: 1, mult: sign, offset: offset};
  } else {
    enter[v] = {value: offset};
    update[v2] = enter[v2] = {signal: s, mult: sign, offset: offset};
  }

  return guideMark(RuleMark, AxisGridRole, Value, dataRef, encode, userEncode);
};

var axisTicks = function(spec, config, userEncode, dataRef, size) {
  var orient = spec.orient,
      sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
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
    extra:  config.tickExtra,
    offset: config.tickOffset
  };

  if (orient === Top$1 || orient === Bottom$1) {
    update.y = enter.y = zero;
    update.y2 = enter.y2 = tickSize;
    update.x = enter.x = exit.x = tickPos;
  } else {
    update.x = enter.x = zero;
    update.x2 = enter.x2 = tickSize;
    update.y = enter.y = exit.y = tickPos;
  }

  return guideMark(RuleMark, AxisTickRole, Value, dataRef, encode, userEncode);
};

var axisLabels = function(spec, config, userEncode, dataRef, size) {
  var orient = spec.orient,
      overlap = spec.labelOverlap,
      sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
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
    scale:  spec.scale,
    field:  Value,
    band:   0.5,
    offset: config.tickOffset
  };

  if (orient === Top$1 || orient === Bottom$1) {
    update.y = enter.y = tickSize;
    update.x = enter.x = exit.x = tickPos;
    addEncode(update, 'align', 'center');
    addEncode(update, 'baseline', orient === Top$1 ? 'bottom' : 'top');
  } else {
    update.x = enter.x = tickSize;
    update.y = enter.y = exit.y = tickPos;
    addEncode(update, 'align', orient === Right$1 ? 'left' : 'right');
    addEncode(update, 'baseline', 'middle');
  }

  spec = guideMark(TextMark, AxisLabelRole, Value, dataRef, encode, userEncode);
  spec.overlap = overlap || config.labelOverlap;
  return spec;
};

var axisTitle = function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      title = spec.title,
      sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
      horizontal = (orient === Top$1 || orient === Bottom$1),
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
    update.baseline = {value: orient === Top$1 ? 'bottom' : 'top'};
  } else {
    update.y = titlePos;
    update.angle = {value: sign * 90};
    update.baseline = {value: 'bottom'};
  }

  addEncode(update, 'angle', config.titleAngle);
  addEncode(update, 'baseline', config.titleBaseline);

  !addEncode(update, 'x', config.titleX)
    && horizontal && !has('x', userEncode)
    && (encode.enter.auto = {value: true});

  !addEncode(update, 'y', config.titleY)
    && !horizontal && !has('y', userEncode)
    && (encode.enter.auto = {value: true});

  return guideMark(TextMark, AxisTitleRole, null, dataRef, encode, userEncode);
};

var parseAxis = function(spec, scope) {
  var config = axisConfig(spec, scope),
      encode = spec.encode || {},
      axisEncode = encode.axis || {},
      name = axisEncode.name || undefined,
      interactive = !!axisEncode.interactive,
      datum, dataRef, ticksRef, size, group, children;

  // single-element data source for axis group
  datum = {
    orient: spec.orient,
    ticks:  !!value(spec.ticks, config.ticks),
    labels: !!value(spec.labels, config.labels),
    grid:   !!value(spec.grid, config.grid),
    domain: !!value(spec.domain, config.domain),
    title:  !!value(spec.title, false)
  };
  dataRef = ref(scope.add(Collect$1({}, [datum])));

  // encoding properties for axis group item
  axisEncode = extendEncode({
    update: {
      range:        {signal: 'abs(span(range("' + spec.scale + '")))'},
      offset:       encoder(value(spec.offset, 0)),
      position:     encoder(value(spec.position, 0)),
      titlePadding: encoder(value(spec.titlePadding, config.titlePadding)),
      minExtent:    encoder(value(spec.minExtent, config.minExtent)),
      maxExtent:    encoder(value(spec.maxExtent, config.maxExtent))
    }
  }, encode.axis, Skip);

  // data source for axis ticks
  ticksRef = ref(scope.add(AxisTicks$1({
    scale:  scope.scaleRef(spec.scale),
    extra:  config.tickExtra,
    count:  scope.property(spec.tickCount),
    values: scope.objectProperty(spec.values),
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
    size = value(spec.tickSize, config.tickSize);
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
};

var parseSpec = function(spec, scope, preprocessed) {
  var signals = array$1(spec.signals),
      scales = array$1(spec.scales);

  if (!preprocessed) signals.forEach(function(_) {
    parseSignal(_, scope);
  });

  array$1(spec.projections).forEach(function(_) {
    parseProjection(_, scope);
  });

  scales.forEach(function(_) {
    initScale(_, scope);
  });

  array$1(spec.data).forEach(function(_) {
    parseData$1(_, scope);
  });

  scales.forEach(function(_) {
    parseScale(_, scope);
  });

  signals.forEach(function(_) {
    parseSignalUpdates(_, scope);
  });

  array$1(spec.axes).forEach(function(_) {
    parseAxis(_, scope);
  });

  array$1(spec.marks).forEach(function(_) {
    parseMark(_, scope);
  });

  array$1(spec.legends).forEach(function(_) {
    parseLegend(_, scope);
  });

  if (spec.title) {
    parseTitle(spec.title, scope);
  }

  scope.parseLambdas();
  return scope;
};

var defined = toSet(['width', 'height', 'padding', 'autosize']);

function parseView(spec, scope) {
  var config = scope.config,
      op, input, encode, parent, root;

  scope.background = spec.background || config.background;
  scope.eventConfig = config.events;
  root = ref(scope.root = scope.add(operator()));
  scope.addSignal('width', spec.width || -1);
  scope.addSignal('height', spec.height || -1);
  scope.addSignal('padding', parsePadding(spec.padding, config));
  scope.addSignal('autosize', parseAutosize(spec.autosize, config));

  array$1(spec.signals).forEach(function(_) {
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
    autosize:     scope.signalRef('autosize'),
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
  this.eventConfig = null;

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

var prototype$76 = Scope.prototype = Subscope.prototype;

// ----

prototype$76.fork = function() {
  return new Subscope(this);
};

prototype$76.toRuntime = function() {
  this.finish();
  return {
    background:  this.background,
    operators:   this.operators,
    streams:     this.streams,
    updates:     this.updates,
    bindings:    this.bindings,
    eventConfig: this.eventConfig
  };
};

prototype$76.id = function() {
  return (this._subid ? this._subid + ':' : 0) + this._id++;
};

prototype$76.add = function(op) {
  this.operators.push(op);
  op.id = this.id();
  // if pre-registration references exist, resolve them now
  if (op.refs) {
    op.refs.forEach(function(ref$$1) { ref$$1.$ref = op.id; });
    op.refs = null;
  }
  return op;
};

prototype$76.proxy = function(op) {
  var vref = op instanceof Entry ? ref(op) : op;
  return this.add(Proxy$1({value: vref}));
};

prototype$76.addStream = function(stream) {
  this.streams.push(stream);
  stream.id = this.id();
  return stream;
};

prototype$76.addUpdate = function(update) {
  this.updates.push(update);
  return update;
};

// Apply metadata
prototype$76.finish = function() {
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
    for (var field$$1 in ds.index) {
      annotate(ds.index[field$$1], name, 'index:' + field$$1);
    }
  }

  return this;
};

// ----

prototype$76.pushState = function(encode, parent, lookup) {
  this._encode.push(ref(this.add(Sieve$1({pulse: encode}))));
  this._parent.push(parent);
  this._lookup.push(lookup ? ref(this.proxy(lookup)) : null);
  this._markpath.push(-1);
};

prototype$76.popState = function() {
  this._encode.pop();
  this._parent.pop();
  this._lookup.pop();
  this._markpath.pop();
};

prototype$76.parent = function() {
  return peek(this._parent);
};

prototype$76.encode = function() {
  return peek(this._encode);
};

prototype$76.lookup = function() {
  return peek(this._lookup);
};

prototype$76.markpath = function() {
  var p = this._markpath;
  return ++p[p.length-1];
};

// ----

prototype$76.fieldRef = function(field$$1, name) {
  if (isString(field$$1)) return fieldRef$1(field$$1, name);
  if (!field$$1.signal) {
    error$1('Unsupported field reference: ' + $(field$$1));
  }

  var s = field$$1.signal,
      f = this.field[s],
      params;

  if (!f) { // TODO: replace with update signalRef?
    params = {name: this.signalRef(s)};
    if (name) params.as = name;
    this.field[s] = f = ref(this.add(Field$1(params)));
  }
  return f;
};

prototype$76.compareRef = function(cmp) {
  function check(_) {
    if (isSignal(_)) {
      signal = true;
      return ref(sig[_.signal]);
    } else {
      return _;
    }
  }

  var sig = this.signals,
      signal = false,
      fields = array$1(cmp.field).map(check),
      orders = array$1(cmp.order).map(check);

  return signal
    ? ref(this.add(Compare$1({fields: fields, orders: orders})))
    : compareRef(fields, orders);
};

prototype$76.keyRef = function(fields) {
  function check(_) {
    if (isSignal(_)) {
      signal = true;
      return ref(sig[_.signal]);
    } else {
      return _;
    }
  }

  var sig = this.signals,
      signal = false;
  fields = array$1(fields).map(check);

  return signal
    ? ref(this.add(Key$1({fields: fields})))
    : keyRef(fields);
};

prototype$76.sortRef = function(sort) {
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

prototype$76.event = function(source, type) {
  var key$$1 = source + ':' + type;
  if (!this.events[key$$1]) {
    var id$$1 = this.id();
    this.streams.push({
      id: id$$1,
      source: source,
      type: type
    });
    this.events[key$$1] = id$$1;
  }
  return this.events[key$$1];
};

// ----

prototype$76.addSignal = function(name, value$$1) {
  if (this.signals.hasOwnProperty(name)) {
    error$1('Duplicate signal name: ' + $(name));
  }
  var op = value$$1 instanceof Entry ? value$$1 : this.add(operator(value$$1));
  return this.signals[name] = op;
};

prototype$76.getSignal = function(name) {
  if (!this.signals[name]) {
    error$1('Unrecognized signal name: ' + $(name));
  }
  return this.signals[name];
};

prototype$76.signalRef = function(s) {
  if (this.signals[s]) {
    return ref(this.signals[s]);
  } else if (!this.lambdas.hasOwnProperty(s)) {
    this.lambdas[s] = this.add(operator(null));
  }
  return ref(this.lambdas[s]);
};

prototype$76.parseLambdas = function() {
  var code = Object.keys(this.lambdas);
  for (var i=0, n=code.length; i<n; ++i) {
    var s = code[i],
        e = parseExpression(s, this),
        op = this.lambdas[s];
    op.params = e.$params;
    op.update = e.$expr;
  }
};

prototype$76.property = function(spec) {
  return spec && spec.signal ? this.signalRef(spec.signal) : spec;
};

prototype$76.objectProperty = function(spec) {
  return (!spec || !isObject(spec)) ? spec
    : this.signalRef(spec.signal || propertyLambda(spec));
};

function propertyLambda(spec) {
  return (isArray(spec) ? arrayLambda : objectLambda)(spec);
}

function arrayLambda(array) {
  var code = '[',
      i = 0,
      n = array.length,
      value$$1;

  for (; i<n; ++i) {
    value$$1 = array[i];
    code += (i > 0 ? ',' : '')
      + (isObject(value$$1)
        ? (value$$1.signal || propertyLambda(value$$1))
        : $(value$$1));
  }
  return code + ']';
}

function objectLambda(obj) {
  var code = '{',
      i = 0,
      key$$1, value$$1;

  for (key$$1 in obj) {
    value$$1 = obj[key$$1];
    code += (++i > 1 ? ',' : '')
      + $(key$$1) + ':'
      + (isObject(value$$1)
        ? (value$$1.signal || propertyLambda(value$$1))
        : $(value$$1));
  }
  return code + '}';
}

prototype$76.addBinding = function(name, bind) {
  if (!this.bindings) {
    error$1('Nested signals do not support binding: ' + $(name));
  }
  this.bindings.push(extend({signal: name}, bind));
};

// ----

prototype$76.addScaleProj = function(name, transform) {
  if (this.scales.hasOwnProperty(name)) {
    error$1('Duplicate scale or projection name: ' + $(name));
  }
  this.scales[name] = this.add(transform);
};

prototype$76.addScale = function(name, params) {
  this.addScaleProj(name, Scale$1(params));
};

prototype$76.addProjection = function(name, params) {
  this.addScaleProj(name, Projection$1(params));
};

prototype$76.getScale = function(name) {
  if (!this.scales[name]) {
    error$1('Unrecognized scale name: ' + $(name));
  }
  return this.scales[name];
};

prototype$76.projectionRef =
prototype$76.scaleRef = function(name) {
  return ref(this.getScale(name));
};

prototype$76.projectionType =
prototype$76.scaleType = function(name) {
  return this.getScale(name).params.type;
};

// ----

prototype$76.addData = function(name, dataScope) {
  if (this.data.hasOwnProperty(name)) {
    error$1('Duplicate data set name: ' + $(name));
  }
  return (this.data[name] = dataScope);
};

prototype$76.getData = function(name) {
  if (!this.data[name]) {
    error$1('Undefined data set name: ' + $(name));
  }
  return this.data[name];
};

prototype$76.addDataPipeline = function(name, entries) {
  if (this.data.hasOwnProperty(name)) {
    error$1('Duplicate data set name: ' + $(name));
  }
  return this.addData(name, DataScope.fromEntries(this, entries));
};

var defaults = function(configs) {
  var output = defaults$1();
  (configs || []).forEach(function(config) {
    var key$$1;
    if (config) for (key$$1 in config) {
      output[key$$1] = isObject(output[key$$1])
        ? extend(output[key$$1], config[key$$1])
        : output[key$$1] = config[key$$1];
    }
  });
  return output;
};

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

    // default event handling configuration
    // preventDefault for view-sourced event types except 'wheel'
    events: {
      defaults: {allow: ['wheel']}
    },

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
      labelLimit: 180,
      labelPadding: 2,
      ticks: true,
      tickColor: black,
      tickOffset: 0,
      tickRound: true,
      tickSize: 5,
      tickWidth: 1,
      titleAlign: 'center',
      titlePadding: 2,
      titleColor: black,
      titleFont: 'sans-serif',
      titleFontSize: 11,
      titleFontWeight: 'bold'
    },

    // correction for centering bias
    axisBand: {
      tickOffset: -1
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

var parse$2 = function(spec, config) {
  if (!isObject(spec)) error$1('Input Vega specification must be an object.');
  return parseView(spec, new Scope(defaults([config, spec.config])))
    .toRuntime();
};

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
  var key$$1, value;

  for (key$$1 in spec) {
    value = spec[key$$1];

    if (value && value.$expr && value.$params) {
      // if expression, parse its parameters
      parseParameters$1(value.$params, ctx, params);
    }

    params[key$$1] = isArray(value)
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
  return ctx.get(_.$ref) || error$1('Operator not defined: ' + _.$ref);
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
  return function(dataflow, key$$1, parent) {
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
var parseOperator = function(spec, ctx) {
  if (spec.type === 'Operator' || !spec.type) {
    ctx.operator(spec,
      spec.update ? operatorExpression(spec.update, ctx) : null);
  } else {
    ctx.transform(spec, spec.type);
  }
};

/**
 * Parse and assign operator parameters.
 */
function parseOperatorParameters(spec, ctx) {
  var op, params;
  if (spec.params) {
    if (!(op = ctx.get(spec.id))) {
      error$1('Invalid operator id: ' + spec.id);
    }
    params = parseParameters$1(spec.params, ctx);
    ctx.dataflow.connect(op, op.parameters(params));
  }
}

/**
 * Parse an event stream specification.
 */
var parseStream$3 = function(spec, ctx) {
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
    error$1('Invalid stream definition: ' + JSON.stringify(spec));
  }

  if (spec.consume) stream.consume(true);

  ctx.stream(spec, stream);
};

/**
 * Parse an event-driven operator update.
 */
var parseUpdate$1 = function(spec, ctx) {
  var source = ctx.get(spec.source),
      target = null,
      update = spec.update,
      params = undefined;

  if (!source) error$1('Source not defined: ' + spec.source);

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
};

/**
 * Parse a serialized dataflow specification.
 */
var parseDataflow = function(spec, ctx) {
  var operators = spec.operators || [];

  // parse background
  if (spec.background) {
    ctx.background = spec.background;
  }

  // parse event configuration
  if (spec.eventConfig) {
    ctx.eventConfig = spec.eventConfig;
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
};

var SKIP$3 = {skip: true};

function getState(options) {
  var ctx = this,
      state = {};

  if (options.signals) {
    var signals = (state.signals = {});
    Object.keys(ctx.signals).forEach(function(key$$1) {
      var op = ctx.signals[key$$1];
      if (options.signals(key$$1, op)) {
        signals[key$$1] = op.value;
      }
    });
  }

  if (options.data) {
    var data = (state.data = {});
    Object.keys(ctx.data).forEach(function(key$$1) {
      var dataset = ctx.data[key$$1];
      if (options.data(key$$1, dataset)) {
        data[key$$1] = dataset.input.value;
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

  Object.keys(signals || {}).forEach(function(key$$1) {
    df.update(ctx.signals[key$$1], signals[key$$1], SKIP$3);
  });

  Object.keys(data || {}).forEach(function(key$$1) {
    df.pulse(
      ctx.data[key$$1].input,
      df.changeset().remove(truthy).insert(data[key$$1])
    );
  });

  (state.subcontext  || []).forEach(function(substate, i) {
    var subctx = ctx.subcontext[i];
    if (subctx) subctx.setState(substate);
  });
}

/**
 * Context objects store the current parse state.
 * Enables lookup of parsed operators, event streams, accessors, etc.
 * Provides a 'fork' method for creating child contexts for subflows.
 */
var context$2 = function(df, transforms, functions) {
  return new Context(df, transforms, functions);
};

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

var runtime = function(view, spec, functions) {
  var fn = functions || functionContext;
  return parseDataflow(spec, context$2(view, transforms, fn));
};

var Padding$1 = 'padding';

function viewWidth(view, width) {
  var a = view.autosize(),
      p = view.padding();
  return width - (a && a.contains === Padding$1 ? p.left + p.right : 0);
}

function viewHeight(view, height) {
  var a = view.autosize(),
      p = view.padding();
  return height - (a && a.contains === Padding$1 ? p.top + p.bottom : 0);
}

function initializeResize(view) {
  var s = view._signals,
      w = s.width,
      h = s.height,
      p = s.padding;

  function resetSize() {
    view._autosize = view._resize = 1;
  }

  // respond to width signal
  view._resizeWidth = view.add(null,
    function(_) {
      view._width = _.size;
      view._viewWidth = viewWidth(view, _.size);
      resetSize();
    },
    {size: w}
  );

  // respond to height signal
  view._resizeHeight = view.add(null,
    function(_) {
      view._height = _.size;
      view._viewHeight = viewHeight(view, _.size);
      resetSize();
    },
    {size: h}
  );

  // respond to padding signal
  var resizePadding = view.add(null, resetSize, {pad: p});

  // set rank to run immediately after source signal
  view._resizeWidth.rank = w.rank + 1;
  view._resizeHeight.rank = h.rank + 1;
  resizePadding.rank = p.rank + 1;
}

function resizeView(viewWidth, viewHeight, width, height, origin, auto) {
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
    if (view._viewWidth !== viewWidth) {
      view._resize = 1;
      view._viewWidth = viewWidth;
    }

    // view height changed: update view property, set resize flag
    if (view._viewHeight !== viewHeight) {
      view._resize = 1;
      view._viewHeight = viewHeight;
    }

    // origin changed: update view property, set resize flag
    if (view._origin[0] !== origin[0] || view._origin[1] !== origin[1]) {
      view._resize = 1;
      view._origin = origin;
    }

    // run dataflow on width/height signal change
    if (rerun) view.run('enter');
    if (auto) view.runAfter(function() { view.resize(); });
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
  var view = this;
  options = options || {};

  Dataflow.call(view);
  view.loader(options.loader || view._loader);
  view.logLevel(options.logLevel || 0);

  view._el = null;
  view._renderType = options.renderer || RenderType.Canvas;
  view._scenegraph = new Scenegraph();
  var root = view._scenegraph.root;

  // initialize renderer, handler and event management
  view._renderer = null;
  view._redraw = true;
  view._handler = new CanvasHandler().scene(root);
  view._eventListeners = [];
  view._preventDefault = false;

  // initialize dataflow graph
  var ctx = runtime(view, spec, options.functions);
  view._runtime = ctx;
  view._signals = ctx.signals;
  view._bind = (spec.bindings || []).map(function(_) {
    return {
      state: null,
      param: extend({}, _)
    };
  });

  // initialize scenegraph
  if (ctx.root) ctx.root.set(root);
  root.source = ctx.data.root.input;
  view.pulse(
    ctx.data.root.input,
    view.changeset().insert(root.items)
  );

  // initialize background color
  view._background = ctx.background || null;

  // initialize event configuration
  view._eventConfig = initializeEventConfig(ctx.eventConfig);

  // initialize view size
  view._width = view.width();
  view._height = view.height();
  view._viewWidth = viewWidth(view, view._width);
  view._viewHeight = viewHeight(view, view._height);
  view._origin = [0, 0];
  view._resize = 0;
  view._autosize = 1;
  initializeResize(view);

  // initialize cursor
  cursor(view);
}

var prototype$74 = inherits(View, Dataflow);

// -- DATAFLOW / RENDERING ----

prototype$74.run = function(encode) {
  Dataflow.prototype.run.call(this, encode);
  if (this._redraw || this._resize) {
    try {
      this.render();
    } catch (e) {
      this.error(e);
    }
  }
  return this;
};

prototype$74.render = function() {
  if (this._renderer) {
    if (this._resize) {
      this._resize = 0;
      resizeRenderer(this);
    }
    this._renderer.render(this._scenegraph.root);
  }
  this._redraw = false;
  return this;
};

prototype$74.dirty = function(item) {
  this._redraw = true;
  this._renderer && this._renderer.dirty(item);
};

// -- GET / SET ----

prototype$74.container = function() {
  return this._el;
};

prototype$74.scenegraph = function() {
  return this._scenegraph;
};

function lookupSignal(view, name) {
  return view._signals.hasOwnProperty(name)
    ? view._signals[name]
    : error$1('Unrecognized signal name: ' + $(name));
}

prototype$74.signal = function(name, value, options) {
  var op = lookupSignal(this, name);
  return arguments.length === 1
    ? op.value
    : this.update(op, value, options);
};

prototype$74.background = function(_) {
  if (arguments.length) {
    this._background = _;
    this._resize = 1;
    return this;
  } else {
    return this._background;
  }
};

prototype$74.width = function(_) {
  return arguments.length ? this.signal('width', _) : this.signal('width');
};

prototype$74.height = function(_) {
  return arguments.length ? this.signal('height', _) : this.signal('height');
};

prototype$74.padding = function(_) {
  return arguments.length ? this.signal('padding', _) : this.signal('padding');
};

prototype$74.autosize = function(_) {
  return arguments.length ? this.signal('autosize', _) : this.signal('autosize');
};

prototype$74.renderer = function(type) {
  if (!arguments.length) return this._renderType;
  if (!renderModule(type)) error$1('Unrecognized renderer type: ' + type);
  if (type !== this._renderType) {
    this._renderType = type;
    if (this._renderer) {
      this._renderer = null;
      this.initialize(this._el);
    }
  }
  return this;
};

prototype$74.loader = function(loader) {
  if (!arguments.length) return this._loader;
  if (loader !== this._loader) {
    Dataflow.prototype.loader.call(this, loader);
    if (this._renderer) {
      this._renderer = null;
      this.initialize(this._el);
    }
  }
  return this;
};

prototype$74.resize = function() {
  this._autosize = 1;
  return this;
};

// -- SIZING ----
prototype$74._resizeView = resizeView;

// -- EVENT HANDLING ----

prototype$74.addEventListener = function(type, handler) {
  this._handler.on(type, handler);
  return this;
};

prototype$74.removeEventListener = function(type, handler) {
  this._handler.off(type, handler);
  return this;
};

prototype$74.addSignalListener = function(name, handler) {
  var s = lookupSignal(this, name),
      h = function() { handler(name, s.value); };
  h.handler = handler;
  this.on(s, null, h);
  return this;
};

prototype$74.removeSignalListener = function(name, handler) {
  var s = lookupSignal(this, name),
      t = s._targets || [],
      h = t.filter(function(op) {
            var u = op._update;
            return u && u.handler === handler;
          });
  if (h.length) t.remove(h[0]);
  return this;
};

prototype$74.preventDefault = function(_) {
  if (arguments.length) {
    this._preventDefault = _;
    return this;
  } else {
    return this._preventDefault;
  }
};

prototype$74.tooltipHandler = function(_) {
  var h = this._handler;
  if (!arguments.length) {
    return h.handleTooltip;
  } else {
    h.handleTooltip = _ || Handler.prototype.handleTooltip;
    return this;
  }
};

prototype$74.events = events$1;
prototype$74.finalize = finalize;
prototype$74.hover = hover;

// -- DATA ----
prototype$74.data = data;
prototype$74.change = change;
prototype$74.insert = insert;
prototype$74.remove = remove;

// -- INITIALIZATION ----
prototype$74.initialize = initialize$1;

// -- HEADLESS RENDERING ----
prototype$74.toImageURL = renderToImageURL;
prototype$74.toCanvas = renderToCanvas;
prototype$74.toSVG = renderToSVG;

// -- SAVE / RESTORE STATE ----
prototype$74.getState = getState$1;
prototype$74.setState = setState$1;

register(IdentifierDefinition, Identifier);

transform('Bound', Bound);
transform('Mark', Mark);
transform('Overlap', Overlap);
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
exports.interpolate = interpolate$1;
exports.interpolateRange = interpolateRange;
exports.projection = projection$$1;
exports.View = View;
exports.parse = parse$2;
exports.expressionFunction = expressionFunction;
exports.formatLocale = defaultLocale$1;
exports.timeFormatLocale = defaultLocale;
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
exports.identity = identity$1;
exports.zero = zero;
exports.one = one;
exports.truthy = truthy;
exports.falsy = falsy;
exports.logger = logger;
exports.None = None;
exports.Error = Error$1;
exports.Warn = Warn;
exports.Info = Info;
exports.Debug = Debug;
exports.array = array$1;
exports.compare = compare;
exports.constant = constant$1;
exports.debounce = debounce;
exports.error = error$1;
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
exports.merge = merge$1;
exports.pad = pad;
exports.peek = peek;
exports.repeat = repeat;
exports.splitAccessPath = splitAccessPath;
exports.stringValue = $;
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
exports.pathSymbols = symbols$1;
exports.pathRectangle = vg_rect;
exports.pathTrail = vg_trail;
exports.pathParse = pathParse;
exports.pathRender = pathRender;
exports.point = point$4;
exports.canvas = Canvas$1;
exports.domCreate = domCreate;
exports.domFind = domFind;
exports.domChild = domChild;
exports.domClear = domClear;
exports.openTag = openTag;
exports.closeTag = closeTag;
exports.font = font;
exports.textMetrics = textMetrics;
exports.resetSVGClipId = resetSVGClipId;
exports.sceneEqual = sceneEqual;
exports.pathEqual = pathEqual;
exports.sceneToJSON = sceneToJSON;
exports.sceneFromJSON = sceneFromJSON;
exports.sceneZOrder = zorder;
exports.sceneVisit = visit;
exports.scenePickVisit = pickVisit;

Object.defineProperty(exports, '__esModule', { value: true });

})));
