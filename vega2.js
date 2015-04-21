(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.vg = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
  core: {
    View: require('./core/View')
  },
  dataflow: {
    changeset: require('./dataflow/changeset'),
    Datasource: require('./dataflow/Datasource'),
    Graph: require('./dataflow/Graph'),
    Node: require('./dataflow/Node')
  },
  parse: {
    spec: require('./parse/spec')
  },
  scene: {
    Builder: require('./scene/Builder'),
    GroupBuilder: require('./scene/GroupBuilder')
  },
  transforms: require('./transforms/index'),
  config: require('./util/config'),
  util: require('datalib')
};
},{"./core/View":28,"./dataflow/Datasource":30,"./dataflow/Graph":31,"./dataflow/Node":32,"./dataflow/changeset":34,"./parse/spec":53,"./scene/Builder":66,"./scene/GroupBuilder":68,"./transforms/index":90,"./util/config":93,"datalib":16}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
module.exports = function(opt) {
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
        bisectLeft(opt.steps, span / maxb, 0, opt.steps.length)
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

function bisectLeft(a, x, lo, hi) {
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (u.cmp(a[mid], x) < 0) { lo = mid + 1; }
    else { hi = mid; }
  }
  return lo;
}
},{}],5:[function(require,module,exports){
var gen = module.exports = {};

gen.repeat = function(val, n) {
  var a = Array(n), i;
  for (i=0; i<n; ++i) a[i] = val;
  return a;
};

gen.zeroes = function(n) {
  return gen.repeat(0, n);
};

gen.range = function(start, stop, step) {
  if (arguments.length < 3) {
    step = 1;
    if (arguments.length < 2) {
      stop = start;
      start = 0;
    }
  }
  if ((stop - start) / step == Infinity) throw new Error('Infinite range');
  var range = [], i = -1, j;
  if (step < 0) while ((j = start + step * ++i) > stop) range.push(j);
  else while ((j = start + step * ++i) < stop) range.push(j);
  return range;
};

gen.random = {};

gen.random.uniform = function(min, max) {
	min = min || 0;
	max = max || 1;
	var delta = max - min;
	var f = function() {
		return min + delta * Math.random();
	};
	f.samples = function(n) { return gen.zeroes(n).map(f); };
	return f;
};

gen.random.integer = function(a, b) {
	if (b === undefined) {
		b = a;
		a = 0;
	}
	var f = function() {
		return a + Math.max(0, Math.floor(b*(Math.random()-0.001)));
	};
	f.samples = function(n) { return gen.zeroes(n).map(f); };
	return f;
};

gen.random.normal = function(mean, stdev) {
	mean = mean || 0;
	stdev = stdev || 1;
	var next = undefined;
	var f = function() {
		var x = 0, y = 0, rds, c;
		if (next !== undefined) {
			x = next;
			next = undefined;
			return x;
		}
		do {
			x = Math.random()*2-1;
			y = Math.random()*2-1;
			rds = x*x + y*y;
		} while (rds == 0 || rds > 1);
		c = Math.sqrt(-2*Math.log(rds)/rds); // Box-Muller transform
		next = mean + y*c*stdev;
		return mean + x*c*stdev;
	};
	f.samples = function(n) { return gen.zeroes(n).map(f); };
	return f;
};
},{}],6:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null);

module.exports = function(data, format) {
  var d = d3.csv.parse(data ? data.toString() : data);
  return d;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],7:[function(require,module,exports){
module.exports = {
  json: require('./json'),
  csv: require('./csv'),
  tsv: require('./tsv'),
  topojson: require('./topojson'),
  treejson: require('./treejson')
};
},{"./csv":6,"./json":8,"./topojson":9,"./treejson":10,"./tsv":11}],8:[function(require,module,exports){
var util = require('../../util');

module.exports = function(data, format) {
  var d = util.isObject(data) ? data : JSON.parse(data);
  if (format && format.property) {
    d = util.accessor(format.property)(d);
  }
  return d;
};

},{"../../util":23}],9:[function(require,module,exports){
(function (global){
var json = require('./json');
var topojson = (typeof window !== "undefined" ? window.topojson : typeof global !== "undefined" ? global.topojson : null);

module.exports = function(data, format) {
  if (topojson == null) { throw Error("TopoJSON library not loaded."); }

  var t = json(data, format), obj;

  if (format && format.feature) {
    if (obj = t.objects[format.feature]) {
      return topojson.feature(t, obj).features
    } else {
      throw Error("Invalid TopoJSON object: "+format.feature);
    }
  } else if (format && format.mesh) {
    if (obj = t.objects[format.mesh]) {
      return [topojson.mesh(t, t.objects[format.mesh])];
    } else {
      throw Error("Invalid TopoJSON object: " + format.mesh);
    }
  } else {
    throw Error("Missing TopoJSON feature or mesh parameter.");
  }

  return [];
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./json":8}],10:[function(require,module,exports){
var tree = require('../../tree');
var json = require('./json');

module.exports = function(data, format) {
  data = json(data, format);
  return tree.toTable(data, (format && format.children));
};
},{"../../tree":21,"./json":8}],11:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null);

module.exports = function(data, format) {
  var d = d3.tsv.parse(data ? data.toString() : data);
  return d;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],12:[function(require,module,exports){
var util = require('../util');

var tests = {
  bool: function(x) { return x==="true" || x==="false" || util.isBoolean(x); },
  date: function(x) { return !isNaN(Date.parse(x)); },
  num: function(x) { return !isNaN(+x) && !util.isDate(x); }
};

module.exports = function(values, f) {
  var i, j, v;
  
  // types to test for
  var types = [
    {type: "boolean", test: tests.bool},
    {type: "number", test: tests.num},
    {type: "date", test: tests.date}
  ];
  
  for (i=0; i<values.length; ++i) {
    // get next value to test
    v = f ? f(values[i]) : values[i];
    // test value against remaining types
    for (j=0; j<types.length; ++j) {
      if (v != null && !types[j].test(v)) {
        types.splice(j, 1);
        j -= 1;
      }
    }
    // if no types left, return 'string'
    if (types.length === 0) return "string";
  }
  
  return types[0].type;
};
},{"../util":23}],13:[function(require,module,exports){
var util = require('../util');

// Matches absolute URLs with optional protocol
//   https://...    file://...    //...
var protocol_re = /^([A-Za-z]+:)?\/\//;

// Special treatment in node.js for the file: protocol
var fileProtocol = 'file://';

// Validate and cleanup URL to ensure that it is allowed to be accessed
// Returns cleaned up URL, or false if access is not allowed
function sanitizeUrl(opt) {
  var url = opt.url;
  if (!url && opt.file) { return fileProtocol + opt.file; }

  // In case this is a relative url (has no host), prepend opt.baseURL
  if (opt.baseURL && !protocol_re.test(url)) {
    if (!util.startsWith(url, '/') && opt.baseURL[opt.baseURL.length-1] !== '/') {
      url = '/' + url; // Ensure that there is a slash between the baseURL (e.g. hostname) and url
    }
    url = opt.baseURL + url;
  }
  // relative protocol, starts with '//'
  if (util.isNode && util.startsWith(url, '//')) {
    url = (opt.defaultProtocol || 'http') + ':' + url;
  }
  // If opt.domainWhiteList is set, only allows url, whose hostname
  // * Is the same as the origin (window.location.hostname)
  // * Equals one of the values in the whitelist
  // * Is a proper subdomain of one of the values in the whitelist
  if (opt.domainWhiteList) {
    var domain, origin;
    if (util.isNode) {
      // relative protocol is broken: https://github.com/defunctzombie/node-url/issues/5
      var parts = require('url').parse(url);
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
      var whiteListed = opt.domainWhiteList.some(function (d) {
        var idx = domain.length - d.length;
        return d === domain ||
          (idx > 1 && domain[idx-1] === '.' && domain.lastIndexOf(d) === idx);
      });
      if (!whiteListed) {
        throw 'URL is not whitelisted: ' + url;
      }
    }
  }
  return url;
}

function load(opt, callback) {
  var error = callback || function(e) { throw e; };
  
  try {
    var url = load.sanitizeUrl(opt); // enable override
  } catch (err) {
    error(err);
    return;
  }

  if (!url) {
    error('Invalid URL: ' + url);
  } else if (!util.isNode) {
    // in browser, use xhr
    return xhr(url, callback);
  } else if (util.startsWith(url, fileProtocol)) {
    // in node.js, if url starts with 'file://', strip it and load from file
    return file(url.slice(fileProtocol.length), callback);
  } else {
    // for regular URLs in node.js
    return http(url, callback);
  }
}

function xhrHasResponse(request) {
  var type = request.responseType;
  return type && type !== "text"
      ? request.response // null on error
      : request.responseText; // "" on error
}

function xhr(url, callback) {
  var async = !!callback;
  var request = new XMLHttpRequest;
  // If IE does not support CORS, use XDomainRequest (copied from d3.xhr)
  if (this.XDomainRequest
      && !("withCredentials" in request)
      && /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest;

  function respond() {
    var status = request.status;
    if (!status && xhrHasResponse(request) || status >= 200 && status < 300 || status === 304) {
      callback(null, request.responseText);
    } else {
      callback(request, null);
    }
  }

  if (async) {
    "onload" in request
      ? request.onload = request.onerror = respond
      : request.onreadystatechange = function() { request.readyState > 3 && respond(); };
  }
  
  request.open("GET", url, async);
  request.send();
  
  if (!async && xhrHasResponse(request)) {
    return request.responseText;
  }
}

function file(file, callback) {
  var fs = require('fs');
  if (!callback) {
    return fs.readFileSync(file, 'utf8');
  }
  require('fs').readFile(file, callback);
}

function http(url, callback) {
  if (!callback) {
    return require('sync-request')('GET', url).getBody();
  }
  require('request')(url, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      callback(null, body);
    } else {
      callback(error, null);
    }
  });
}

load.sanitizeUrl = sanitizeUrl;

module.exports = load;

},{"../util":23,"fs":2,"request":2,"sync-request":2,"url":2}],14:[function(require,module,exports){
var util = require('../util');
var load = require('./load');
var read = require('./read');

module.exports = util
  .keys(read.formats)
  .reduce(function(out, type) {
    out[type] = function(opt, format, callback) {
      // process arguments
      if (util.isString(opt)) opt = {url: opt};
      if (arguments.length === 2 && util.isFunction(format)) {
        callback = format;
        format = undefined;
      }

      // set up read format
      format = util.extend({parse: 'auto'}, format);
      format.type = type;

      // load data
      var data = load(opt, callback ? function(error, data) {
        if (error) callback(error, null);
        try {
          // data loaded, now parse it (async)
          data = read(data, format);
        } catch (e) {
          callback(e, null);
        }
        callback(null, data);
      } : undefined);
      
      // data loaded, now parse it (sync)
      if (data) return read(data, format);
    };
    return out;
  }, {});

},{"../util":23,"./load":13,"./read":15}],15:[function(require,module,exports){
var util = require('../util');
var formats = require('./formats');
var infer = require('./infer-types');

var PARSERS = {
  "number": util.number,
  "boolean": util.boolean,
  "date": util.date
};

function read(data, format) {
  var type = (format && format.type) || "json";
  data = formats[type](data, format);
  if (format && format.parse) parse(data, format.parse);
  return data;
}

function parse(data, types) {
  var cols, parsers, d, i, j, clen, len = data.length;

  if (types === 'auto') {
    // perform type inference
    types = util.keys(data[0]).reduce(function(types, c) {
      var type = infer(data, util.accessor(c));
      if (PARSERS[type]) types[c] = type;
      return types;
    }, {});
  }
  cols = util.keys(types);
  parsers = cols.map(function(c) { return PARSERS[types[c]]; });

  for (i=0, clen=cols.length; i<len; ++i) {
    d = data[i];
    for (j=0; j<clen; ++j) {
      d[cols[j]] = parsers[j](d[cols[j]]);
    }
  }
}

read.formats = formats;
read.parse = parse;
module.exports = read;
},{"../util":23,"./formats":7,"./infer-types":12}],16:[function(require,module,exports){
var dl = module.exports = {};
var util = require('./util');

util.extend(dl, util);
util.extend(dl, require('./generate'));
util.extend(dl, require('./stats'));
dl.bin = require('./bin');
dl.summary = require('./summary');
dl.template = require('./template');
dl.truncate = require('./truncate');

dl.load = require('./import/load');
dl.read = require('./import/read');
util.extend(dl, require('./import/loaders'));

var log = require('./log');
dl.log = function(msg) { log(msg, log.LOG); };
dl.log.silent = log.silent;
dl.error = function(msg) { log(msg, log.ERR); };

},{"./bin":4,"./generate":5,"./import/load":13,"./import/loaders":14,"./import/read":15,"./log":17,"./stats":18,"./summary":19,"./template":20,"./truncate":22,"./util":23}],17:[function(require,module,exports){
var LOG = "LOG";
var ERR = "ERR";
var silent = false;

function prepare(msg, type) {
  return '[' + [
    '"'+(type || LOG)+'"',
    Date.now(),
    '"'+msg+'"'
  ].join(", ") + ']';
}

function log(msg, type) {
  if (!silent) {
    msg = prepare(msg, type);
    console.error(msg);
  }
}

log.silent = function(val) { silent = !!val; };

log.LOG = LOG;
log.ERR = ERR;
module.exports = log;
},{}],18:[function(require,module,exports){
var util = require('./util');
var stats = {};

stats.unique = function(values, f, results) {
  if (!util.isArray(values) || values.length===0) return [];
  results = results || [];
  var u = {}, v, i;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v in u) {
      u[v] += 1;
    } else {
      u[v] = 1;
      results.push(v);
    }
  }
  results.counts = u;
  return results;
};

stats.count = function(values, f) {
  if (!util.isArray(values) || values.length===0) return 0;
  var v, i, count = 0;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v != null) count += 1;
  }
  return count;
};

stats.count.distinct = function(values, f) {
  if (!util.isArray(values) || values.length===0) return 0;
  var u = {}, v, i, count = 0;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v in u) continue;
    u[v] = 1;
    count += 1;
  }
  return count;
};

stats.count.nulls = function(values, f) {
  if (!util.isArray(values) || values.length===0) return 0;
  var v, i, count = 0;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v == null) count += 1;
  }
  return count;
};

stats.median = function(values, f) {
  if (!util.isArray(values) || values.length===0) return 0;
  if (f) values = values.map(f);
  values = values.filter(util.isNotNull).sort(util.cmp);
  var half = Math.floor(values.length/2);
  if (values.length % 2) {
    return values[half];
  } else {
    return (values[half-1] + values[half]) / 2.0;
  }
};

stats.mean = function(values, f) {
  if (!util.isArray(values) || values.length===0) return 0;
  var mean = 0, delta, i, c, v;
  for (i=0, c=0; i<values.length; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v != null) {
      delta = v - mean;
      mean = mean + delta / (++c);
    }
  }
  return mean;
};

stats.variance = function(values, f) {
  if (!util.isArray(values) || values.length===0) return 0;
  var mean = 0, M2 = 0, delta, i, c, v;
  for (i=0, c=0; i<values.length; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v != null) {
      delta = v - mean;
      mean = mean + delta / (++c);
      M2 = M2 + delta * (v - mean);
    }
  }
  M2 = M2 / (c - 1);
  return M2;
};

stats.stdev = function(values, f) {
  return Math.sqrt(stats.variance(values, f));
};

stats.skew = function(values, f) {
  var avg = stats.mean(values, f),
      med = stats.median(values, f),
      std = stats.stdev(values, f);
  return std === 0 ? 0 : (avg - med) / std;
};

stats.minmax = function(values, f) {
  var s = {min: +Infinity, max: -Infinity}, v, i, n;
  for (i=0; i<values.length; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v != null) {
      if (v > s.max) s.max = v;
      if (v < s.min) s.min = v;
    }
  }
  return s;
};

stats.minIndex = function(values, f) {
  if (!util.isArray(values) || values.length==0) return -1;
  var idx = 0, v, i, n, min = +Infinity;
  for (i=0; i<values.length; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v != null && v < min) { min = v; idx = i; }
  }
  return idx;
};

stats.maxIndex = function(values, f) {
  if (!util.isArray(values) || values.length==0) return -1;
  var idx = 0, v, i, n, max = -Infinity;
  for (i=0; i<values.length; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v != null && v > max) { max = v; idx = i; }
  }
  return idx;
};

stats.entropy = function(counts) {
  var i, p, s = 0, H = 0;
  for (i=0; i<counts.length; ++i) {
    s += counts[i];
  }
  if (s === 0) return 0;
  for (i=0; i<counts.length; ++i) {
    p = counts[i] / s;
    if (p > 0) H += p * Math.log(p) / Math.LN2;
  }
  return -H;
};

stats.entropy.normalized = function(counts) {
  var H = stats.entropy(counts);
  var max = -Math.log(1/counts.length) / Math.LN2;
  return H / max;
};

stats.profile = function(values, f) {
  if (!util.isArray(values) || values.length===0) return null;

  // init
  var p = {},
      mean = 0,
      count = 0,
      distinct = 0,
      min = f ? f(values[0]) : values[0],
      max = min,
      M2 = 0,
      median = null,
      vals = [],
      u = {}, delta, sd, i, v, x, half;

  // compute summary stats
  for (i=0, c=0; i<values.length; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v != null) {
      // update unique values
      u[v] = (v in u) ? u[v] + 1 : (distinct += 1, 1);
      // update min/max
      if (v < min) min = v;
      if (v > max) max = v;
      // update stats
      x = (typeof v === 'string') ? v.length : v;
      delta = x - mean;
      mean = mean + delta / (++count);
      M2 = M2 + delta * (x - mean);
      vals.push(x);
    }
  }
  M2 = M2 / (count - 1);
  sd = Math.sqrt(M2);

  // compute median
  vals.sort(util.cmp);
  half = Math.floor(vals.length/2);
  median = (vals.length % 2)
   ? vals[half]
   : (vals[half-1] + vals[half]) / 2.0;

  return {
    unique:   u,
    count:    count,
    nulls:    values.length - count,
    distinct: distinct,
    min:      min,
    max:      max,
    mean:     mean,
    median:   median,
    stdev:    sd,
    skew:     sd === 0 ? 0 : (mean - median) / sd
  };
};

module.exports = stats;
},{"./util":23}],19:[function(require,module,exports){
var util = require('./util');
var stats = require('./stats');

module.exports = function(data, fields) {
  if (data == null || data.length === 0) return null;
  fields = fields || util.keys(data[0]);

  var profiles = fields.map(function(f) {
    var p = stats.profile(data, util.accessor(f));
    return (p.field = f, p);
  });
  
  profiles.toString = printSummary;
  return profiles;
};

function printSummary() {
  var profiles = this;
  var str = [];
  profiles.forEach(function(p) {
    str.push("----- Field: '" + p.field + "' -----");
    if (typeof p.min === 'string' || p.distinct < 10) {
      str.push(printCategoricalProfile(p));
    } else {
      str.push(printQuantitativeProfile(p));
    }
    str.push("");
  });
  return str.join("\n");
}

function printQuantitativeProfile(p) {
  return [
    "distinct: " + p.distinct,
    "nulls:    " + p.nulls,
    "min:      " + p.min,
    "max:      " + p.max,
    "median:   " + p.median,
    "mean:     " + p.mean,
    "stdev:    " + p.stdev,
    "skew:     " + p.skew
  ].join("\n");
}

function printCategoricalProfile(p) {
  var list = [
    "distinct: " + p.distinct,
    "nulls:    " + p.nulls,
    "top values: "
  ];
  var u = p.unique;
  var top = util.keys(u)
    .sort(function(a,b) { return u[b] - u[a]; })
    .slice(0, 6)
    .map(function(v) { return " '" + v + "' (" + u[v] + ")"; });
  return list.concat(top).join("\n");
}
},{"./stats":18,"./util":23}],20:[function(require,module,exports){
(function (global){
var util = require('./util');
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null);

var context = {
  formats:    [],
  format_map: {},
  truncate:   require('./truncate')
};

function template(text) {
  var src = source(text, "d");
  src = "var __t; return " + src + ";";

  try {
    return (new Function("d", src)).bind(context);
  } catch (e) {
    e.source = src;
    throw e;
  }
}

module.exports = template;

// clear cache of format objects
// can *break* prior template functions, so invoke with care
template.clearFormatCache = function() {
  context.formats = [];
  context.format_map = {};
};

function source(text, variable) {
  variable = variable || "obj";
  var index = 0;
  var src = "'";
  var regex = template_re;

  // Compile the template source, escaping string literals appropriately.
  text.replace(regex, function(match, interpolate, offset) {
    src += text
      .slice(index, offset)
      .replace(template_escaper, template_escapeChar);
    index = offset + match.length;

    if (interpolate) {
      src += "'\n+((__t=("
        + template_var(interpolate, variable)
        + "))==null?'':__t)+\n'";
    }

    // Adobe VMs need the match returned to produce the correct offest.
    return match;
  });
  return src + "'";
}

function template_var(text, variable) {
  var filters = text.split('|');
  var prop = filters.shift().trim();
  var format = [];
  var stringCast = true;
  
  function strcall(fn) {
    fn = fn || "";
    if (stringCast) {
      stringCast = false;
      src = "String(" + src + ")" + fn;
    } else {
      src += fn;
    }
    return src;
  }
  
  var src = util.field(prop).map(util.str).join("][");
  src = variable + "[" + src + "]";
  
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
        a = util.number(args[0]);
        strcall('.slice(0,' + a + ')');
        break;
      case 'right':
        a = util.number(args[0]);
        strcall('.slice(-' + a +')');
        break;
      case 'mid':
        a = util.number(args[0]);
        b = a + util.number(args[1]);
        strcall('.slice(+'+a+','+b+')');
        break;
      case 'slice':
        a = util.number(args[0]);
        strcall('.slice('+ a
          + (args.length > 1 ? ',' + util.number(args[1]) : '')
          + ')');
        break;
      case 'truncate':
        a = util.number(args[0]);
        b = args[1];
        b = (b!=="left" && b!=="middle" && b!=="center") ? "right" : b;
        src = 'this.truncate(' + strcall() + ',' + a + ',"' + b + '")';
        break;
      case 'number':
        a = template_format(args[0], d3.format);
        stringCast = false;
        src = 'this.formats['+a+']('+src+')';
        break;
      case 'time':
        a = template_format(args[0], d3.time.format);
        stringCast = false;
        src = 'this.formats['+a+']('+src+')';
        break;
      default:
        throw Error("Unrecognized template filter: " + f);
    }
  }

  return src;
}

var template_re = /\{\{(.+?)\}\}|$/g;

// Certain characters need to be escaped so that they can be put into a
// string literal.
var template_escapes = {
  "'":      "'",
  '\\':     '\\',
  '\r':     'r',
  '\n':     'n',
  '\u2028': 'u2028',
  '\u2029': 'u2029'
};

var template_escaper = /\\|'|\r|\n|\u2028|\u2029/g;

function template_escapeChar(match) {
  return '\\' + template_escapes[match];
};

function template_format(pattern, fmt) {
  if ((pattern[0] === "'" && pattern[pattern.length-1] === "'") ||
      (pattern[0] !== '"' && pattern[pattern.length-1] === '"')) {
    pattern = pattern.slice(1, -1);
  } else {
    throw Error("Format pattern must be quoted: " + pattern);
  }
  if (!context.format_map[pattern]) {
    var f = fmt(pattern);
    var i = context.formats.length;
    context.formats.push(f);
    context.format_map[pattern] = i;
  }
  return context.format_map[pattern];
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./truncate":22,"./util":23}],21:[function(require,module,exports){
var FIELDS = {
  parent: "parent",
  children: "children"
};

function toTable(root, childrenField, parentField) {
  childrenField = childrenField || FIELDS.children;
  parentField = parentField || FIELDS.parent;
  var table = [];
  
  function visit(node, parent) {
    node[parentField] = parent;
    table.push(node);
    
    var children = node[childrenField];
    if (children) {
      for (var i=0; i<children.length; ++i) {
        visit(children[i], node);
      }
    }
  }
  
  visit(root, null);
  return (table.root = root, table);
}

module.exports = {
  toTable: toTable,
  fields: FIELDS
};
},{}],22:[function(require,module,exports){
module.exports = function(s, length, pos, word, ellipsis) {
  var len = s.length;
  if (len <= length) return s;
  ellipsis = ellipsis || "...";
  var l = Math.max(0, length - ellipsis.length);

  switch (pos) {
    case "left":
      return ellipsis + (word ? u_truncateOnWord(s,l,1) : s.slice(len-l));
    case "middle":
    case "center":
      var l1 = Math.ceil(l/2), l2 = Math.floor(l/2);
      return (word ? truncateOnWord(s,l1) : s.slice(0,l1)) + ellipsis
        + (word ? truncateOnWord(s,l2,1) : s.slice(len-l2));
    default:
      return (word ? truncateOnWord(s,l) : s.slice(0,l)) + ellipsis;
  }
};

function truncateOnWord(s, len, rev) {
  var cnt = 0, tok = s.split(truncate_word_re);
  if (rev) {
    s = (tok = tok.reverse())
      .filter(function(w) { cnt += w.length; return cnt <= len; })
      .reverse();
  } else {
    s = tok.filter(function(w) { cnt += w.length; return cnt <= len; });
  }
  return s.length ? s.join("").trim() : tok[0].slice(0, len);
}

var truncate_word_re = /([\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u2028\u2029\u3000\uFEFF])/;

},{}],23:[function(require,module,exports){
(function (process){
var u = module.exports = {};

// where are we?

u.isNode = typeof process !== 'undefined'
        && typeof process.stderr !== 'undefined';

// type checking functions

var toString = Object.prototype.toString;

u.isObject = function(obj) {
  return obj === Object(obj);
};

u.isFunction = function(obj) {
  return toString.call(obj) == '[object Function]';
};

u.isString = function(obj) {
  return toString.call(obj) == '[object String]';
};
  
u.isArray = Array.isArray || function(obj) {
  return toString.call(obj) == '[object Array]';
};

u.isNumber = function(obj) {
  return toString.call(obj) == '[object Number]';
};

u.isBoolean = function(obj) {
  return toString.call(obj) == '[object Boolean]';
};

u.isDate = function(obj) {
  return toString.call(obj) == '[object Date]';
};

u.isNotNull = function(obj) {
  return obj != null; // TODO include NaN here?
};

// type coercion functions

u.number = function(s) { return s == null ? null : +s; };

u.boolean = function(s) { return s == null ? null : s==='false' ? false : !!s; };

u.date = function(s) { return s == null ? null : Date.parse(s); }

u.array = function(x) { return x != null ? (u.isArray(x) ? x : [x]) : []; };

u.str = function(x) {
  return u.isArray(x) ? "[" + x.map(u.str) + "]"
    : u.isObject(x) ? JSON.stringify(x)
    : u.isString(x) ? ("'"+util_escape_str(x)+"'") : x;
};

var escape_str_re = /(^|[^\\])'/g;

function util_escape_str(x) {
  return x.replace(escape_str_re, "$1\\'");
}

// utility functions

u.identity = function(x) { return x; };

u.true = function() { return true; };

u.duplicate = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

u.equal = function(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
};

u.extend = function(obj) {
  for (var x, name, i=1, len=arguments.length; i<len; ++i) {
    x = arguments[i];
    for (name in x) { obj[name] = x[name]; }
  }
  return obj;
};

u.keys = function(x) {
  var keys = [], k;
  for (k in x) keys.push(k);
  return keys;
};

u.vals = function(x) {
  var vals = [], k;
  for (k in x) vals.push(x[k]);
  return vals;
};

u.toMap = function(list) {
  return list.reduce(function(obj, x) {
    return (obj[x] = 1, obj);
  }, {});
};

u.keystr = function(values) {
  // use to ensure consistent key generation across modules
  return values.join("|");
};

// data access functions

u.field = function(f) {
  return f.split("\\.")
    .map(function(d) { return d.split("."); })
    .reduce(function(a, b) {
      if (a.length) { a[a.length-1] += "." + b.shift(); }
      a.push.apply(a, b);
      return a;
    }, []);
};

u.accessor = function(f) {
  var s;
  return (u.isFunction(f) || f==null)
    ? f : u.isString(f) && (s=u.field(f)).length > 1
    ? function(x) { return s.reduce(function(x,f) {
          return x[f];
        }, x);
      }
    : function(x) { return x[f]; };
};

u.mutator = function(f) {
  var s;
  return u.isString(f) && (s=u.field(f)).length > 1
    ? function(x, v) {
        for (var i=0; i<s.length-1; ++i) x = x[s[i]];
        x[s[i]] = v;
      }
    : function(x, v) { x[f] = v; };
};


// comparison / sorting functions

u.comparator = function(sort) {
  var sign = [];
  if (sort === undefined) sort = [];
  sort = u.array(sort).map(function(f) {
    var s = 1;
    if      (f[0] === "-") { s = -1; f = f.slice(1); }
    else if (f[0] === "+") { s = +1; f = f.slice(1); }
    sign.push(s);
    return u.accessor(f);
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

u.cmp = function(a, b) {
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
}

u.numcmp = function(a, b) { return a - b; };

u.stablesort = function(array, sortBy, keyFn) {
  var indices = array.reduce(function(idx, v, i) {
    return (idx[keyFn(v)] = i, idx);
  }, {});

  array.sort(function(a, b) {
    var sa = sortBy(a),
        sb = sortBy(b);
    return sa < sb ? -1 : sa > sb ? 1
         : (indices[keyFn(a)] - indices[keyFn(b)]);
  });

  return array;
};

// string functions

// ES6 compatibility per https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#Polyfill
// We could have used the polyfill code, but lets wait until ES6 becomes a standard first
u.startsWith = String.prototype.startsWith
  ? function(string, searchString) {
    return string.startsWith(searchString);
  }
  : function(string, searchString) {
    return string.lastIndexOf(searchString, 0) === 0;
  };
}).call(this,require('_process'))

},{"_process":3}],24:[function(require,module,exports){
module.exports = require('./lib/heap');

},{"./lib/heap":25}],25:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
(function() {
  var Heap, defaultCmp, floor, heapify, heappop, heappush, heappushpop, heapreplace, insort, min, nlargest, nsmallest, updateItem, _siftdown, _siftup;

  floor = Math.floor, min = Math.min;


  /*
  Default comparison function to be used
   */

  defaultCmp = function(x, y) {
    if (x < y) {
      return -1;
    }
    if (x > y) {
      return 1;
    }
    return 0;
  };


  /*
  Insert item x in list a, and keep it sorted assuming a is sorted.
  
  If x is already in a, insert it to the right of the rightmost x.
  
  Optional args lo (default 0) and hi (default a.length) bound the slice
  of a to be searched.
   */

  insort = function(a, x, lo, hi, cmp) {
    var mid;
    if (lo == null) {
      lo = 0;
    }
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (lo < 0) {
      throw new Error('lo must be non-negative');
    }
    if (hi == null) {
      hi = a.length;
    }
    while (lo < hi) {
      mid = floor((lo + hi) / 2);
      if (cmp(x, a[mid]) < 0) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(x)), x);
  };


  /*
  Push item onto heap, maintaining the heap invariant.
   */

  heappush = function(array, item, cmp) {
    if (cmp == null) {
      cmp = defaultCmp;
    }
    array.push(item);
    return _siftdown(array, 0, array.length - 1, cmp);
  };


  /*
  Pop the smallest item off the heap, maintaining the heap invariant.
   */

  heappop = function(array, cmp) {
    var lastelt, returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    lastelt = array.pop();
    if (array.length) {
      returnitem = array[0];
      array[0] = lastelt;
      _siftup(array, 0, cmp);
    } else {
      returnitem = lastelt;
    }
    return returnitem;
  };


  /*
  Pop and return the current smallest value, and add the new item.
  
  This is more efficient than heappop() followed by heappush(), and can be
  more appropriate when using a fixed size heap. Note that the value
  returned may be larger than item! That constrains reasonable use of
  this routine unless written as part of a conditional replacement:
      if item > array[0]
        item = heapreplace(array, item)
   */

  heapreplace = function(array, item, cmp) {
    var returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    returnitem = array[0];
    array[0] = item;
    _siftup(array, 0, cmp);
    return returnitem;
  };


  /*
  Fast version of a heappush followed by a heappop.
   */

  heappushpop = function(array, item, cmp) {
    var _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (array.length && cmp(array[0], item) < 0) {
      _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
      _siftup(array, 0, cmp);
    }
    return item;
  };


  /*
  Transform list into a heap, in-place, in O(array.length) time.
   */

  heapify = function(array, cmp) {
    var i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    _ref1 = (function() {
      _results1 = [];
      for (var _j = 0, _ref = floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--){ _results1.push(_j); }
      return _results1;
    }).apply(this).reverse();
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      i = _ref1[_i];
      _results.push(_siftup(array, i, cmp));
    }
    return _results;
  };


  /*
  Update the position of the given item in the heap.
  This function should be called every time the item is being modified.
   */

  updateItem = function(array, item, cmp) {
    var pos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    pos = array.indexOf(item);
    if (pos === -1) {
      return;
    }
    _siftdown(array, 0, pos, cmp);
    return _siftup(array, pos, cmp);
  };


  /*
  Find the n largest elements in a dataset.
   */

  nlargest = function(array, n, cmp) {
    var elem, result, _i, _len, _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    result = array.slice(0, n);
    if (!result.length) {
      return result;
    }
    heapify(result, cmp);
    _ref = array.slice(n);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      heappushpop(result, elem, cmp);
    }
    return result.sort(cmp).reverse();
  };


  /*
  Find the n smallest elements in a dataset.
   */

  nsmallest = function(array, n, cmp) {
    var elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (n * 10 <= array.length) {
      result = array.slice(0, n).sort(cmp);
      if (!result.length) {
        return result;
      }
      los = result[result.length - 1];
      _ref = array.slice(n);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if (cmp(elem, los) < 0) {
          insort(result, elem, 0, null, cmp);
          result.pop();
          los = result[result.length - 1];
        }
      }
      return result;
    }
    heapify(array, cmp);
    _results = [];
    for (i = _j = 0, _ref1 = min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      _results.push(heappop(array, cmp));
    }
    return _results;
  };

  _siftdown = function(array, startpos, pos, cmp) {
    var newitem, parent, parentpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    newitem = array[pos];
    while (pos > startpos) {
      parentpos = (pos - 1) >> 1;
      parent = array[parentpos];
      if (cmp(newitem, parent) < 0) {
        array[pos] = parent;
        pos = parentpos;
        continue;
      }
      break;
    }
    return array[pos] = newitem;
  };

  _siftup = function(array, pos, cmp) {
    var childpos, endpos, newitem, rightpos, startpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    endpos = array.length;
    startpos = pos;
    newitem = array[pos];
    childpos = 2 * pos + 1;
    while (childpos < endpos) {
      rightpos = childpos + 1;
      if (rightpos < endpos && !(cmp(array[childpos], array[rightpos]) < 0)) {
        childpos = rightpos;
      }
      array[pos] = array[childpos];
      pos = childpos;
      childpos = 2 * pos + 1;
    }
    array[pos] = newitem;
    return _siftdown(array, startpos, pos, cmp);
  };

  Heap = (function() {
    Heap.push = heappush;

    Heap.pop = heappop;

    Heap.replace = heapreplace;

    Heap.pushpop = heappushpop;

    Heap.heapify = heapify;

    Heap.updateItem = updateItem;

    Heap.nlargest = nlargest;

    Heap.nsmallest = nsmallest;

    function Heap(cmp) {
      this.cmp = cmp != null ? cmp : defaultCmp;
      this.nodes = [];
    }

    Heap.prototype.push = function(x) {
      return heappush(this.nodes, x, this.cmp);
    };

    Heap.prototype.pop = function() {
      return heappop(this.nodes, this.cmp);
    };

    Heap.prototype.peek = function() {
      return this.nodes[0];
    };

    Heap.prototype.contains = function(x) {
      return this.nodes.indexOf(x) !== -1;
    };

    Heap.prototype.replace = function(x) {
      return heapreplace(this.nodes, x, this.cmp);
    };

    Heap.prototype.pushpop = function(x) {
      return heappushpop(this.nodes, x, this.cmp);
    };

    Heap.prototype.heapify = function() {
      return heapify(this.nodes, this.cmp);
    };

    Heap.prototype.updateItem = function(x) {
      return updateItem(this.nodes, x, this.cmp);
    };

    Heap.prototype.clear = function() {
      return this.nodes = [];
    };

    Heap.prototype.empty = function() {
      return this.nodes.length === 0;
    };

    Heap.prototype.size = function() {
      return this.nodes.length;
    };

    Heap.prototype.clone = function() {
      var heap;
      heap = new Heap();
      heap.nodes = this.nodes.slice(0);
      return heap;
    };

    Heap.prototype.toArray = function() {
      return this.nodes.slice(0);
    };

    Heap.prototype.insert = Heap.prototype.push;

    Heap.prototype.top = Heap.prototype.peek;

    Heap.prototype.front = Heap.prototype.peek;

    Heap.prototype.has = Heap.prototype.contains;

    Heap.prototype.copy = Heap.prototype.clone;

    return Heap;

  })();

  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      return define([], factory);
    } else if (typeof exports === 'object') {
      return module.exports = factory();
    } else {
      return root.Heap = factory();
    }
  })(this, function() {
    return Heap;
  });

}).call(this);

},{}],26:[function(require,module,exports){
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

module.exports = bounds;
},{}],27:[function(require,module,exports){
var Graph = require('../dataflow/Graph'), 
    Node  = require('../dataflow/Node'),
    GroupBuilder = require('../scene/GroupBuilder'),
    changeset = require('../dataflow/changeset'), 
    dl = require('datalib');

function Model() {
  this._defs = {};
  this._predicates = {};
  this._scene = null;

  this.graph = new Graph();

  this._node = new Node(this.graph);
  this._builder = null; // Top-level scenegraph builder
};

var proto = Model.prototype;

proto.defs = function(defs) {
  if (!arguments.length) return this._defs;
  this._defs = defs;
  return this;
};

proto.data = function() {
  var data = this.graph.data.apply(this.graph, arguments);
  if(arguments.length > 1) {  // new Datasource
    this._node.addListener(data.pipeline()[0]);
  }

  return data;
};

function predicates(name) {
  var m = this, predicates = {};
  if(!dl.isArray(name)) return this._predicates[name];
  name.forEach(function(n) { predicates[n] = m._predicates[n] });
  return predicates;
}

proto.predicate = function(name, predicate) {
  if(arguments.length === 1) return predicates.call(this, name);
  return (this._predicates[name] = predicate);
};

proto.predicates = function() { return this._predicates; };

proto.scene = function(renderer) {
  if(!arguments.length) return this._scene;
  if(this._builder) this._node.removeListener(this._builder.disconnect());
  this._builder = new GroupBuilder(this, this._defs.marks, this._scene={});
  this._node.addListener(this._builder.connect());
  var p = this._builder.pipeline();
  p[p.length-1].addListener(renderer);
  return this;
};

proto.addListener = function(l) { this._node.addListener(l); };
proto.removeListener = function(l) { this._node.removeListener(l); };

proto.fire = function(cs) {
  if(!cs) cs = changeset.create();
  this.graph.propagate(cs, this._node);
};

module.exports = Model;
},{"../dataflow/Graph":31,"../dataflow/Node":32,"../dataflow/changeset":34,"../scene/GroupBuilder":68,"datalib":16}],28:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    dl = require('datalib'),
    Node = require('../dataflow/Node'),
    parseStreams = require('../parse/streams'),
    canvas = require('../render/canvas/index'),
    svg = require('../render/svg/index'),
    Transition = require('../scene/Transition'),
    config = require('../util/config'),
    debug = require('../util/debug'),
    changeset = require('../dataflow/changeset');

var View = function(el, width, height, model) {
  this._el    = null;
  this._model = null;
  this._width = this.__width = width || 500;
  this._height = this.__height = height || 300;
  this._autopad = 1;
  this._padding = {top:0, left:0, bottom:0, right:0};
  this._viewport = null;
  this._renderer = null;
  this._handler = null;
  this._io = canvas;
  if (el) this.initialize(el);
};

var prototype = View.prototype;

prototype.model = function(model) {
  if (!arguments.length) return this._model;
  if (this._model !== model) {
    this._model = model;
    if (this._handler) this._handler.model(model);
  }
  return this;
};

prototype.data = function(data) {
  var m = this.model();
  if (!arguments.length) return m.data();
  dl.keys(data).forEach(function(d) { m.data(d).add(dl.duplicate(data[d])); });
  return this;
};

prototype.width = function(width) {
  if (!arguments.length) return this.__width;
  if (this.__width !== width) {
    this._width = this.__width = width;
    if (this._el) this.initialize(this._el.parentNode);
    if (this._strict) this._autopad = 1;
  }
  return this;
};

prototype.height = function(height) {
  if (!arguments.length) return this.__height;
  if (this.__height !== height) {
    this._height = this.__height = height;
    if (this._el) this.initialize(this._el.parentNode);
    if (this._strict) this._autopad = 1;
  }
  return this;
};

prototype.padding = function(pad) {
  if (!arguments.length) return this._padding;
  if (this._padding !== pad) {
    if (dl.isString(pad)) {
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
      inset = config.autopadInset,
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
    this.update();
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
  if (type === "canvas") type = canvas;
  if (type === "svg") type = svg;
  if (this._io !== type) {
    this._io = type;
    this._renderer = null;
    if (this._el) this.initialize(this._el.parentNode);
    if (this._build) this.render();
  }
  return this;
};

prototype.initialize = function(el) {
  var v = this, prevHandler,
      w = v._width, h = v._height, pad = v._padding;
  
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
    .initialize(el, w, h, pad);
  
  // input handler
  prevHandler = v._handler;
  v._handler = new this._io.Handler()
    .initialize(el, pad, v)
    .model(v._model);

  if (prevHandler) {
    prevHandler.handlers().forEach(function(h) {
      v._handler.on(h.type, h.handler);
    });
  } else {
    // Register event listeners for signal stream definitions.
    parseStreams(this);
  }
  
  return this;
};

prototype.update = function(opt) {    
  opt = opt || {};
  var v = this,
      trans = opt.duration
        ? new Transition(opt.duration, opt.ease)
        : null;

  // TODO: with streaming data API, adds should dl.duplicate just parseSpec
  // to prevent Vega from polluting the environment.

  var cs = changeset.create();
  if(trans) cs.trans = trans;
  if(opt.reflow !== undefined) cs.reflow = opt.reflow

  if(!v._build) {
    v._renderNode = new Node(v._model.graph)
      .router(true);

    v._renderNode.evaluate = function(input) {
      debug(input, ["rendering"]);

      var s = v._model.scene();
      if(input.trans) {
        input.trans.start(function(items) { v._renderer.render(s, items); });
      } else {
        v._renderer.render(s);
      }

      // For all updated datasources, finalize their changesets.
      var d, ds;
      for(d in input.data) {
        ds = v._model.data(d);
        if(!ds.revises()) continue;
        changeset.finalize(ds.last());
      }

      return input;
    };

    v._model.scene(v._renderNode);
    v._build = true;
  }

  // Pulse the entire model (Datasources + scene).
  v._model.fire(cs);

  return v.autopad(opt);
};

prototype.on = function() {
  this._handler.on.apply(this._handler, arguments);
  return this;
};

prototype.off = function() {
  this._handler.off.apply(this._handler, arguments);
  return this;
};

View.factory = function(model) {
  return function(opt) {
    opt = opt || {};
    var defs = model.defs();
    var v = new View()
      .model(model)
      .width(defs.width)
      .height(defs.height)
      .padding(defs.padding)
      .renderer(opt.renderer || "canvas");

    if (opt.el) v.initialize(opt.el);
    if (opt.data) v.data(opt.data);
  
    return v;
  };    
};

module.exports = View;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../dataflow/Node":32,"../dataflow/changeset":34,"../parse/streams":54,"../render/canvas/index":58,"../render/svg/index":63,"../scene/Transition":71,"../util/config":93,"../util/debug":95,"datalib":16}],29:[function(require,module,exports){
var Node = require('./Node'),
    changeset = require('./changeset'),
    debug = require('../util/debug'),
    C = require('../util/constants');

function Collector(graph) {
  Node.prototype.init.call(this, graph);
  this._data = [];
  return this.router(true)
    .collector(true);
}

var proto = (Collector.prototype = new Node());

proto.data = function() { return this._data; }

proto.evaluate = function(input) {
  debug(input, ["collecting"]);

  if (input.reflow) {
    input = changeset.create(input);
    input.mod = this._data.slice();
    return input;
  }

  if (input.rem.length) {
    var ids = input.rem.reduce(function(m,x) { return (m[x._id]=1, m); }, {});
    this._data = this._data.filter(function(x) { return ids[x._id] !== 1; });
  }

  if (input.add.length) {
    this._data = this._data.length ? this._data.concat(input.add) : input.add;
  }

  if (input.sort) {
    this._data.sort(input.sort);
  }

  return input;
};

module.exports = Collector;
},{"../util/constants":94,"../util/debug":95,"./Node":32,"./changeset":34}],30:[function(require,module,exports){
var dl = require('datalib'),
    changeset = require('./changeset'), 
    tuple = require('./tuple'), 
    Node = require('./Node'),
    Collector = require('./Collector'),
    debug = require('../util/debug'),
    C = require('../util/constants');

function Datasource(graph, name, facet) {
  this._graph = graph;
  this._name = name;
  this._data = [];
  this._source = null;
  this._facet = facet;
  this._input = changeset.create();
  this._output = null;    // Output changeset

  this._pipeline  = null; // Pipeline of transformations.
  this._collector = null; // Collector to materialize output of pipeline
  this._revises = false; // Does any pipeline operator need to track prev?
};

var proto = Datasource.prototype;

proto.name = function(name) {
  if(!arguments.length) return this._name;
  return (this._name = name, this);
};

proto.source = function(src) {
  if(!arguments.length) return this._source;
  return (this._source = this._graph.data(src));
};

proto.add = function(d) {
  var prev = this._revises ? null : undefined;

  this._input.add = this._input.add
    .concat(dl.array(d).map(function(d) { return tuple.ingest(d, prev); }));
  return this;
};

proto.remove = function(where) {
  var d = this._data.filter(where);
  this._input.rem = this._input.rem.concat(d);
  return this;
};

proto.update = function(where, field, func) {
  var mod = this._input.mod,
      ids = tuple.idMap(mod),
      prev = this._revises ? null : undefined; 

  this._input.fields[field] = 1;
  this._data.filter(where).forEach(function(x) {
    var prev = x[field],
        next = func(x);
    if (prev !== next) {
      tuple.set(x, field, next);
      if(ids[x._id] !== 1) {
        mod.push(x);
        ids[x._id] = 1;
      }
    }
  });
  return this;
};

proto.values = function(data) {
  if(!arguments.length)
    return this._collector ? this._collector.data() : this._data;

  // Replace backing data
  this._input.rem = this._data.slice();
  if (data) { this.add(data); }
  return this;
};

function set_prev(d) { if(d._prev === undefined) d._prev = C.SENTINEL; }

proto.revises = function(p) {
  if(!arguments.length) return this._revises;

  // If we've not needed prev in the past, but a new dataflow node needs it now
  // ensure existing tuples have prev set.
  if(!this._revises && p) {
    this._data.forEach(set_prev);
    this._input.add.forEach(set_prev); // New tuples that haven't yet been merged into _data
  }

  this._revises = this._revises || p;
  return this;
};

proto.last = function() { return this._output; };

proto.fire = function(input) {
  if(input) this._input = input;
  this._graph.propagate(this._input, this._pipeline[0]); 
};

proto.pipeline = function(pipeline) {
  var ds = this, n, c;
  if(!arguments.length) return this._pipeline;

  if(pipeline.length) {
    // If we have a pipeline, add a collector to the end to materialize
    // the output.
    ds._collector = new Collector(this._graph);
    pipeline.push(ds._collector);
    ds._revises = pipeline.some(function(p) { return p.revises(); });
  }

  // Input node applies the datasource's delta, and propagates it to 
  // the rest of the pipeline. It receives touches to reflow data.
  var input = new Node(this._graph)
    .router(true)
    .collector(true);

  input.evaluate = function(input) {
    debug(input, ["input", ds._name]);

    var delta = ds._input, 
        out = changeset.create(input),
        rem;

    // Delta might contain fields updated through API
    dl.keys(delta.fields).forEach(function(f) { out.fields[f] = 1 });

    if(input.reflow) {
      out.mod = ds._data.slice();
    } else {
      // update data
      if(delta.rem.length) {
        rem = tuple.idMap(delta.rem);
        ds._data = ds._data
          .filter(function(x) { return rem[x._id] !== 1 });
      }

      if(delta.add.length) ds._data = ds._data.concat(delta.add);

      // reset change list
      ds._input = changeset.create();

      out.add = delta.add; 
      out.mod = delta.mod;
      out.rem = delta.rem;
    }

    return (out.facet = ds._facet, out);
  };

  pipeline.unshift(input);

  // Output node captures the last changeset seen by this datasource
  // (needed for joins and builds) and materializes any nested data.
  // If this datasource is faceted, materializes the values in the facet.
  var output = new Node(this._graph)
    .router(true)
    .collector(true);

  output.evaluate = function(input) {
    debug(input, ["output", ds._name]);
    var output = changeset.create(input, true);

    if(ds._facet) {
      ds._facet.values = ds.values();
      input.facet = null;
    }

    ds._output = input;
    output.data[ds._name] = 1;
    return output;
  };

  pipeline.push(output);

  this._pipeline = pipeline;
  this._graph.connect(ds._pipeline);
  return this;
};

proto.listener = function() { 
  var l = new Node(this._graph).router(true),
      dest = this,
      prev = this._revises ? null : undefined;

  l.evaluate = function(input) {
    dest._srcMap = dest._srcMap || {};  // to propagate tuples correctly
    var map = dest._srcMap,
        output  = changeset.create(input);

    output.add = input.add.map(function(t) {
      return (map[t._id] = tuple.derive(t, t._prev !== undefined ? t._prev : prev));
    });
    output.mod = input.mod.map(function(t) { return map[t._id]; });
    output.rem = input.rem.map(function(t) { 
      var o = map[t._id];
      map[t._id] = null;
      return o;
    });

    return (dest._input = output);
  };

  l.addListener(this._pipeline[0]);
  return l;
};

proto.addListener = function(l) {
  if(l instanceof Datasource) {
    if(this._collector) this._collector.addListener(l.listener());
    else this._pipeline[0].addListener(l.listener());
  } else {
    this._pipeline[this._pipeline.length-1].addListener(l);      
  }

  return this;
};

proto.removeListener = function(l) {
  this._pipeline[this._pipeline.length-1].removeListener(l);
};

proto.listeners = function(ds) {
  return ds 
    ? this._collector ? this._collector.listeners() : this._pipeline[0].listeners()
    : this._pipeline[this._pipeline.length-1].listeners();
};

module.exports = Datasource;
},{"../util/constants":94,"../util/debug":95,"./Collector":29,"./Node":32,"./changeset":34,"./tuple":35,"datalib":16}],31:[function(require,module,exports){
var dl = require('datalib'),
    Heap = require('heap'),
    Datasource = require('./Datasource'),
    Signal = require('./Signal'),
    changeset = require('./changeset'),
    debug = require('../util/debug'),
    C = require('../util/constants');

function Graph() {
  this._stamp = 0;
  this._rank  = 0;

  this._data = {};
  this._signals = {};

  this.doNotPropagate = {};
}

var proto = Graph.prototype;

proto.data = function(name, pipeline, facet) {
  if(arguments.length === 1) return this._data[name];
  return (this._data[name] = new Datasource(this, name, facet)
    .pipeline(pipeline));
};

function signal(name) {
  var m = this, i, len;
  if(!dl.isArray(name)) return this._signals[name];
  return name.map(function(n) { m._signals[n]; });
}

proto.signal = function(name, init) {
  var m = this;
  if(arguments.length === 1) return signal.call(this, name);
  return (this._signals[name] = new Signal(this, name, init));
};

proto.signalValues = function(name) {
  var graph = this;
  if(!dl.isArray(name)) return this._signals[name].value();
  return name.reduce(function(sg, n) {
    return (sg[n] = graph._signals[n].value(), sg);
  }, {});
};

proto.signalRef = function(ref) {
  if(!dl.isArray(ref)) ref = dl.field(ref);
  var value = this.signal(ref.shift()).value();
  if(ref.length > 0) {
    var fn = Function("s", "return s["+ref.map(dl.str).join("][")+"]");
    value = fn.call(null, value);
  }

  return value;
};

var schedule = function(a, b) {
  // If the nodes are equal, propagate the non-reflow pulse first,
  // so that we can ignore subsequent reflow pulses. 
  if(a.rank == b.rank) return a.pulse.reflow ? 1 : -1;
  else return a.rank - b.rank; 
};

proto.propagate = function(pulse, node) {
  var v, l, n, p, r, i, len, reflowed;

  // new PQ with each propagation cycle so that we can pulse branches
  // of the dataflow graph during a propagation (e.g., when creating
  // a new inline datasource).
  var pq = new Heap(schedule); 

  if(pulse.stamp) throw "Pulse already has a non-zero stamp"

  pulse.stamp = ++this._stamp;
  pq.push({ node: node, pulse: pulse, rank: node.rank() });

  while (pq.size() > 0) {
    v = pq.pop(), n = v.node, p = v.pulse, r = v.rank, l = n._listeners;
    reflowed = p.reflow && n.last() >= p.stamp;

    if(reflowed) continue; // Don't needlessly reflow ops.

    // A node's rank might change during a propagation (e.g. instantiating
    // a group's dataflow branch). Re-queue if it has. T
    // TODO: use pq.replace or pq.poppush?
    if(r != n.rank()) {
      debug(p, ['Rank mismatch', r, n.rank()]);
      pq.push({ node: n, pulse: p, rank: n.rank() });
      continue;
    }

    p = this.evaluate(p, n);

    // Even if we didn't run the node, we still want to propagate 
    // the pulse. 
    if (p !== this.doNotPropagate) {
      for (i = 0, len = l.length; i < len; i++) {
        pq.push({ node: l[i], pulse: p, rank: l[i]._rank });
      }
    }
  }
};

// Connect a branch of dataflow nodes. 
// Dependencies get wired to the nearest collector. 
function forEachNode(branch, fn) {
  var node, collector, i, len;
  for(i=0, len=branch.length; i<len; ++i) {
    node = branch[i];
    if(node.collector()) collector = node;
    fn(node, collector, i);
  }
}

proto.connect = function(branch) {
  debug({}, ['connecting']);
  var graph = this;
  forEachNode(branch, function(n, c, i) {
    var data = n.dependency(C.DATA),
        signals = n.dependency(C.SIGNALS);

    if(data.length > 0) {
      data.forEach(function(d) { 
        graph.data(d)
          .revises(n.revises())
          .addListener(c);
      });
    }

    if(signals.length > 0) {
      signals.forEach(function(s) { graph.signal(s).addListener(c); });
    }

    if(i > 0) {
      branch[i-1].addListener(branch[i]);
    }
  });

  return branch;
};

proto.disconnect = function(branch) {
  debug({}, ['disconnecting']);
  var graph = this;

  forEachNode(branch, function(n, c, i) {
    var data = n.dependency(C.DATA),
        signals = n.dependency(C.SIGNALS);

    if(data.length > 0) {
      data.forEach(function(d) { graph.data(d).removeListener(c); });
    }

    if(signals.length > 0) {
      signals.forEach(function(s) { graph.signal(s).removeListener(c) });
    }

    n.disconnect();  
  });

  return branch;
};

proto.reevaluate = function(pulse, node) {
  var reflowed = !pulse.reflow || (pulse.reflow && node.last() >= pulse.stamp),
      run = !!pulse.add.length || !!pulse.rem.length || node.router();
  run = run || !reflowed;
  return run || node.reevaluate(pulse);
};

proto.evaluate = function(pulse, node) {
  if(!this.reevaluate(pulse, node)) return pulse;
  pulse = node.evaluate(pulse);
  node.last(pulse.stamp);
  return pulse
};

module.exports = Graph;
},{"../util/constants":94,"../util/debug":95,"./Datasource":30,"./Signal":33,"./changeset":34,"datalib":16,"heap":24}],32:[function(require,module,exports){
var dl = require('datalib'),
    C = require('../util/constants'),
    REEVAL = [C.DATA, C.FIELDS, C.SCALES, C.SIGNALS];

var node_id = 1;

function Node(graph) {
  if(graph) this.init(graph);
  return this;
}

var proto = Node.prototype;

proto.init = function(graph) {
  this._id = node_id++;
  this._graph = graph;
  this._rank = ++graph._rank; // For topologial sort
  this._stamp = 0;  // Last stamp seen

  this._listeners = [];
  this._registered = {}; // To prevent duplicate listeners

  this._deps = {
    data:    [],
    fields:  [],
    scales:  [],
    signals: [],
  };

  this._isRouter = false; // Responsible for propagating tuples, cannot ever be skipped
  this._isCollector = false;  // Holds a materialized dataset, pulse to reflow
  this._revises = false; // Does the operator require tuples' previous values? 
  return this;
};

proto.clone = function() {
  var n = new Node(this._graph);
  n.evaluate = this.evaluate;
  n._deps = this._deps;
  n._isRouter = this._isRouter;
  n._isCollector = this._isCollector;
  return n;
};

proto.rank = function() { return this._rank; };

proto.last = function(stamp) { 
  if(!arguments.length) return this._stamp;
  this._stamp = stamp;
  return this;
};

proto.dependency = function(type, deps) {
  var d = this._deps[type];
  if(arguments.length === 1) return d;
  if(deps === null) { // Clear dependencies of a certain type
    while(d.length > 0) d.pop();
  } else {
    if(!dl.isArray(deps) && d.indexOf(deps) < 0) d.push(deps);
    else d.push.apply(d, dl.array(deps));
  }
  return this;
};

proto.router = function(bool) {
  if(!arguments.length) return this._isRouter;
  this._isRouter = !!bool
  return this;
};

proto.collector = function(bool) {
  if(!arguments.length) return this._isCollector;
  this._isCollector = !!bool;
  return this;
};

proto.revises = function(bool) {
  if(!arguments.length) return this._revises;
  this._revises = !!bool;
  return this;
};

proto.listeners = function() {
  return this._listeners;
};

proto.addListener = function(l) {
  if(!(l instanceof Node)) throw "Listener is not a Node";
  if(this._registered[l._id]) return this;

  this._listeners.push(l);
  this._registered[l._id] = 1;
  if(this._rank > l._rank) {
    var q = [l];
    while(q.length) {
      var cur = q.splice(0,1)[0];
      cur._rank = ++this._graph._rank;
      q.push.apply(q, cur._listeners);
    }
  }

  return this;
};

proto.removeListener = function (l) {
  var foundSending = false;
  for (var i = 0, len = this._listeners.length; i < len && !foundSending; i++) {
    if (this._listeners[i] === l) {
      this._listeners.splice(i, 1);
      this._registered[l._id] = null;
      foundSending = true;
    }
  }
  
  return foundSending;
};

proto.disconnect = function() {
  this._listeners = [];
  this._registered = {};
};

proto.evaluate = function(pulse) { return pulse; }

proto.reevaluate = function(pulse) {
  var node = this, reeval = false;
  return REEVAL.some(function(prop) {
    reeval = reeval || node._deps[prop].some(function(k) { return !!pulse[prop][k] });
    return reeval;
  });

  return this;
};

module.exports = Node;
},{"../util/constants":94,"datalib":16}],33:[function(require,module,exports){
var Node = require('./Node'),
    changeset = require('./changeset');

function Signal(graph, name, init) {
  Node.prototype.init.call(this, graph);
  this._name  = name;
  this._value = init;
  return this;
};

var proto = (Signal.prototype = new Node());

proto.name = function() { return this._name; };

proto.value = function(val) {
  if(!arguments.length) return this._value;
  this._value = val;
  return this;
};

proto.fire = function(cs) {
  if(!cs) cs = changeset.create(null, true);
  cs.signals[this._name] = 1;
  this._graph.propagate(cs, this);
};

module.exports = Signal;
},{"./Node":32,"./changeset":34}],34:[function(require,module,exports){
var C = require('../util/constants');
var REEVAL = [C.DATA, C.FIELDS, C.SCALES, C.SIGNALS];

function create(cs, reflow) {
  var out = {};
  copy(cs, out);

  out.add = [];
  out.mod = [];
  out.rem = [];

  out.reflow = reflow;

  return out;
}

function reset_prev(x) {
  x._prev = (x._prev === undefined) ? undefined : C.SENTINEL;
}

function finalize(cs) {
  for(i=0, len=cs.add.length; i<len; ++i) reset_prev(cs.add[i]);
  for(i=0, len=cs.mod.length; i<len; ++i) reset_prev(cs.mod[i]);
}

function copy(a, b) {
  b.stamp = a ? a.stamp : 0;
  b.sort  = a ? a.sort  : null;
  b.facet = a ? a.facet : null;
  b.trans = a ? a.trans : null;
  REEVAL.forEach(function(d) { b[d] = a ? a[d] : {}; });
}

module.exports = {
  create: create,
  copy: copy,
  finalize: finalize,
};
},{"../util/constants":94}],35:[function(require,module,exports){
var dl = require('datalib'),
    C = require('../util/constants'),
    tuple_id = 1;

// Object.create is expensive. So, when ingesting, trust that the
// datum is an object that has been appropriately sandboxed from 
// the outside environment. 
function ingest(datum, prev) {
  datum = dl.isObject(datum) ? datum : {data: datum};
  datum._id = tuple_id++;
  datum._prev = (prev !== undefined) ? (prev || C.SENTINEL) : undefined;
  return datum;
}

function derive(datum, prev) {
  return ingest(Object.create(datum), prev);
}

// WARNING: operators should only call this once per timestamp!
function set(t, k, v) {
  var prev = t[k];
  if(prev === v) return;
  set_prev(t, k);
  t[k] = v;
}

function set_prev(t, k) {
  if(t._prev === undefined) return;
  t._prev = (t._prev === C.SENTINEL) ? {} : t._prev;
  t._prev[k] = t[k];
}

function reset() { tuple_id = 1; }

function idMap(a) {
  return a.reduce(function(m,x) {
    return (m[x._id] = 1, m);
  }, {});
};

module.exports = {
  ingest: ingest,
  derive: derive,
  set:    set,
  prev:   set_prev,
  reset:  reset,
  idMap:  idMap
};
},{"../util/constants":94,"datalib":16}],36:[function(require,module,exports){
var dl = require('datalib');

module.exports = function(opt) {
  opt = opt || {};
  var constants = opt.constants || require('./constants');
  var functions = (opt.functions || require('./functions'))(codegen);
  var idWhiteList = opt.idWhiteList ? dl.toMap(opt.idWhiteList) : null;
  var idBlackList = opt.idBlackList ? dl.toMap(opt.idBlackList) : null;
  var memberDepth = 0;

  // TODO generalize?
  var DATUM = 'd';
  var SIGNAL_PREFIX = 'sg.';
  var signals = {};
  var fields = {};

  function codegen_wrap(ast) {    
    var retval = {
      fn: codegen(ast),
      signals: dl.keys(signals),
      fields: dl.keys(fields)
    };
    signals = {};
    fields = {};
    return retval;
  }

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
          if (idWhiteList.hasOwnProperty(id)) {
            return id;
          } else {
            signals[id] = 1;
            return SIGNAL_PREFIX + id; // HACKish...
          }
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
        if (o === DATUM) { fields[p] = 1; } // HACKish...
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
  
  return codegen_wrap;
};
},{"./constants":37,"./functions":38,"datalib":16}],37:[function(require,module,exports){
module.exports = {
  "NaN":     "NaN",
  "E":       "Math.E",
  "LN2":     "Math.LN2",
  "LN10":    "Math.LN10",
  "LOG2E":   "Math.LOG2E",
  "LOG10E":  "Math.LOG10E",
  "PI":      "Math.PI",
  "SQRT1_2": "Math.SQRT1_2",
  "SQRT2":   "Math.SQRT2"
};
},{}],38:[function(require,module,exports){
var datalib = require('datalib');

module.exports = function(codegen) {

  function fncall(name, args, cast, type) {
    var obj = codegen(args[0]);
    if (cast) {
      obj = cast + "(" + obj + ")";
      if (dl.startsWith(cast, "new ")) obj = "(" + obj + ")";
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
};
},{"datalib":16}],39:[function(require,module,exports){
var parser = require('./parser'),
    codegen = require('./codegen');
    
module.exports = {
  parse: function(input, opt) { return parser.parse("("+input+")", opt); },
  code: function(opt) { return codegen(opt); }
};

},{"./codegen":36,"./parser":40}],40:[function(require,module,exports){
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
module.exports = (function() {
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
},{}],41:[function(require,module,exports){
var dl = require('datalib'),
    axs = require('../scene/axis'),
    config = require('../util/config');

var ORIENT = {
  "x":      "bottom",
  "y":      "left",
  "top":    "top",
  "bottom": "bottom",
  "left":   "left",
  "right":  "right"
};

function axes(model, spec, axes, group) {
  (spec || []).forEach(function(def, index) {
    axes[index] = axes[index] || axs(model);
    axis(def, index, axes[index], group);
  });
};

function axis(def, index, axis, group) {
  // axis scale
  if (def.scale !== undefined) {
    axis.scale(group.scale(def.scale));
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
    ? def.titleOffset : config.axis.titleOffset);
  // axis values
  axis.tickValues(def.values || null);
  // axis label formatting
  axis.tickFormat(def.format || null);
  // axis tick subdivision
  axis.tickSubdivide(def.subdivide || 0);
  // axis tick padding
  axis.tickPadding(def.tickPadding || config.axis.padding);

  // axis tick size(s)
  var size = [];
  if (def.tickSize !== undefined) {
    for (var i=0; i<3; ++i) size.push(def.tickSize);
  } else {
    var ts = config.axis.tickSize;
    size = [ts, ts, ts];
  }
  if (def.tickSizeMajor != null) size[0] = def.tickSizeMajor;
  if (def.tickSizeMinor != null) size[1] = def.tickSizeMinor;
  if (def.tickSizeEnd   != null) size[2] = def.tickSizeEnd;
  if (size.length) {
    axis.tickSize.apply(axis, size);
  }

  // tick arguments
  if (def.ticks != null) {
    var ticks = dl.isArray(def.ticks) ? def.ticks : [def.ticks];
    axis.ticks.apply(axis, ticks);
  } else {
    axis.ticks(config.axis.ticks);
  }

  // style properties
  var p = def.properties;
  if (p && p.ticks) {
    axis.majorTickProperties(p.majorTicks
      ? dl.extend({}, p.ticks, p.majorTicks) : p.ticks);
    axis.minorTickProperties(p.minorTicks
      ? dl.extend({}, p.ticks, p.minorTicks) : p.ticks);
  } else {
    axis.majorTickProperties(p && p.majorTicks || {});
    axis.minorTickProperties(p && p.minorTicks || {});
  }
  axis.tickLabelProperties(p && p.labels || {});
  axis.titleProperties(p && p.title || {});
  axis.gridLineProperties(p && p.grid || {});
  axis.domainProperties(p && p.axis || {});
}

module.exports = axes;
},{"../scene/axis":72,"../util/config":93,"datalib":16}],42:[function(require,module,exports){
var dl = require('datalib'),
    config = require('../util/config'),
    parseTransforms = require('./transforms'),
    parseModify = require('./modify');

var parseData = function(model, spec, callback) {
  var count = 0;

  function loaded(d) {
    return function(error, data) {
      if (error) {
        dl.error("LOADING FAILED: " + d.url);
      } else {
        model.data(d.name).values(dl.read(data, d.format));
      }
      if (--count === 0) callback();
    }
  }

  // process each data set definition
  (spec || []).forEach(function(d) {
    if (d.url) {
      count += 1;
      dl.load(dl.extend({url: d.url}, config.load), loaded(d));
    }
    parseData.datasource(model, d);
  });

  if (count === 0) setTimeout(callback, 1);
  return spec;
};

parseData.datasource = function(model, d) {
  var transform = (d.transform||[]).map(function(t) { return parseTransforms(model, t) }),
      mod = (d.modify||[]).map(function(m) { return parseModify(model, m, d) }),
      ds = model.data(d.name, mod.concat(transform));

  if (d.values) {
    ds.values(dl.read(d.values, d.format));
  } else if (d.source) {
    ds.source(d.source)
      .revises(ds.revises()) // If new ds revises, then it's origin must revise too.
      .addListener(ds);  // Derived ds will be pulsed by its src rather than the model.
    model.removeListener(ds.pipeline()[0]); 
  }

  return ds;    
};

module.exports = parseData;
},{"../util/config":93,"./modify":48,"./transforms":55,"datalib":16}],43:[function(require,module,exports){
/*
 * Generated by PEG.js 0.8.0.
 *
 * http://pegjs.majda.cz/
 */

function peg$subclass(child, parent) {
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
}

function SyntaxError(message, expected, found, offset, line, column) {
  this.message  = message;
  this.expected = expected;
  this.found    = found;
  this.offset   = offset;
  this.line     = line;
  this.column   = column;

  this.name     = "SyntaxError";
}

peg$subclass(SyntaxError, Error);

function parse(input) {
  var options = arguments.length > 1 ? arguments[1] : {},

      peg$FAILED = {},

      peg$startRuleFunctions = { start: peg$parsestart },
      peg$startRuleFunction  = peg$parsestart,

      peg$c0 = peg$FAILED,
      peg$c1 = ",",
      peg$c2 = { type: "literal", value: ",", description: "\",\"" },
      peg$c3 = function(o, m) { return [o].concat(m) },
      peg$c4 = function(o) { return [o] },
      peg$c5 = "[",
      peg$c6 = { type: "literal", value: "[", description: "\"[\"" },
      peg$c7 = "]",
      peg$c8 = { type: "literal", value: "]", description: "\"]\"" },
      peg$c9 = ">",
      peg$c10 = { type: "literal", value: ">", description: "\">\"" },
      peg$c11 = function(f1, f2, o) { return {start: f1, end: f2, middle: o}},
      peg$c12 = [],
      peg$c13 = function(s, f) { return (s.filters = f), s },
      peg$c14 = function(s) { return s },
      peg$c15 = null,
      peg$c16 = function(t, e) { return { event: e, target: t } },
      peg$c17 = /^[:a-zA-z0-9_\-]/,
      peg$c18 = { type: "class", value: "[:a-zA-z0-9_\\-]", description: "[:a-zA-z0-9_\\-]" },
      peg$c19 = function(s) { return { signal: s.join("") }},
      peg$c20 = "(",
      peg$c21 = { type: "literal", value: "(", description: "\"(\"" },
      peg$c22 = ")",
      peg$c23 = { type: "literal", value: ")", description: "\")\"" },
      peg$c24 = function(m) { return { stream: m }},
      peg$c25 = ".",
      peg$c26 = { type: "literal", value: ".", description: "\".\"" },
      peg$c27 = ":",
      peg$c28 = { type: "literal", value: ":", description: "\":\"" },
      peg$c29 = function(c) { return { type:'class', value: c } },
      peg$c30 = "#",
      peg$c31 = { type: "literal", value: "#", description: "\"#\"" },
      peg$c32 = function(id) { return { type:'id', value: id } },
      peg$c33 = "mousedown",
      peg$c34 = { type: "literal", value: "mousedown", description: "\"mousedown\"" },
      peg$c35 = "mouseup",
      peg$c36 = { type: "literal", value: "mouseup", description: "\"mouseup\"" },
      peg$c37 = "click",
      peg$c38 = { type: "literal", value: "click", description: "\"click\"" },
      peg$c39 = "dblclick",
      peg$c40 = { type: "literal", value: "dblclick", description: "\"dblclick\"" },
      peg$c41 = "wheel",
      peg$c42 = { type: "literal", value: "wheel", description: "\"wheel\"" },
      peg$c43 = "keydown",
      peg$c44 = { type: "literal", value: "keydown", description: "\"keydown\"" },
      peg$c45 = "keypress",
      peg$c46 = { type: "literal", value: "keypress", description: "\"keypress\"" },
      peg$c47 = "keyup",
      peg$c48 = { type: "literal", value: "keyup", description: "\"keyup\"" },
      peg$c49 = "mousewheel",
      peg$c50 = { type: "literal", value: "mousewheel", description: "\"mousewheel\"" },
      peg$c51 = "mousemove",
      peg$c52 = { type: "literal", value: "mousemove", description: "\"mousemove\"" },
      peg$c53 = "mouseout",
      peg$c54 = { type: "literal", value: "mouseout", description: "\"mouseout\"" },
      peg$c55 = "mouseover",
      peg$c56 = { type: "literal", value: "mouseover", description: "\"mouseover\"" },
      peg$c57 = "mouseenter",
      peg$c58 = { type: "literal", value: "mouseenter", description: "\"mouseenter\"" },
      peg$c59 = "touchstart",
      peg$c60 = { type: "literal", value: "touchstart", description: "\"touchstart\"" },
      peg$c61 = "touchmove",
      peg$c62 = { type: "literal", value: "touchmove", description: "\"touchmove\"" },
      peg$c63 = "touchend",
      peg$c64 = { type: "literal", value: "touchend", description: "\"touchend\"" },
      peg$c65 = function(field) { return field  },
      peg$c66 = /^['"a-zA-Z0-9_.><=! \t\-]/,
      peg$c67 = { type: "class", value: "['\"a-zA-Z0-9_.><=! \\t\\-]", description: "['\"a-zA-Z0-9_.><=! \\t\\-]" },
      peg$c68 = function(v) { return v.join("") },
      peg$c69 = /^[ \t\r\n]/,
      peg$c70 = { type: "class", value: "[ \\t\\r\\n]", description: "[ \\t\\r\\n]" },

      peg$currPos          = 0,
      peg$reportedPos      = 0,
      peg$cachedPos        = 0,
      peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
      peg$maxFailPos       = 0,
      peg$maxFailExpected  = [],
      peg$silentFails      = 0,

      peg$result;

  if ("startRule" in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
    }

    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }

  function text() {
    return input.substring(peg$reportedPos, peg$currPos);
  }

  function offset() {
    return peg$reportedPos;
  }

  function line() {
    return peg$computePosDetails(peg$reportedPos).line;
  }

  function column() {
    return peg$computePosDetails(peg$reportedPos).column;
  }

  function expected(description) {
    throw peg$buildException(
      null,
      [{ type: "other", description: description }],
      peg$reportedPos
    );
  }

  function error(message) {
    throw peg$buildException(message, null, peg$reportedPos);
  }

  function peg$computePosDetails(pos) {
    function advance(details, startPos, endPos) {
      var p, ch;

      for (p = startPos; p < endPos; p++) {
        ch = input.charAt(p);
        if (ch === "\n") {
          if (!details.seenCR) { details.line++; }
          details.column = 1;
          details.seenCR = false;
        } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
          details.line++;
          details.column = 1;
          details.seenCR = true;
        } else {
          details.column++;
          details.seenCR = false;
        }
      }
    }

    if (peg$cachedPos !== pos) {
      if (peg$cachedPos > pos) {
        peg$cachedPos = 0;
        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
      }
      advance(peg$cachedPosDetails, peg$cachedPos, pos);
      peg$cachedPos = pos;
    }

    return peg$cachedPosDetails;
  }

  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) { return; }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildException(message, expected, pos) {
    function cleanupExpected(expected) {
      var i = 1;

      expected.sort(function(a, b) {
        if (a.description < b.description) {
          return -1;
        } else if (a.description > b.description) {
          return 1;
        } else {
          return 0;
        }
      });

      while (i < expected.length) {
        if (expected[i - 1] === expected[i]) {
          expected.splice(i, 1);
        } else {
          i++;
        }
      }
    }

    function buildMessage(expected, found) {
      function stringEscape(s) {
        function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

        return s
          .replace(/\\/g,   '\\\\')
          .replace(/"/g,    '\\"')
          .replace(/\x08/g, '\\b')
          .replace(/\t/g,   '\\t')
          .replace(/\n/g,   '\\n')
          .replace(/\f/g,   '\\f')
          .replace(/\r/g,   '\\r')
          .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
          .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
          .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
          .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
      }

      var expectedDescs = new Array(expected.length),
          expectedDesc, foundDesc, i;

      for (i = 0; i < expected.length; i++) {
        expectedDescs[i] = expected[i].description;
      }

      expectedDesc = expected.length > 1
        ? expectedDescs.slice(0, -1).join(", ")
            + " or "
            + expectedDescs[expected.length - 1]
        : expectedDescs[0];

      foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

      return "Expected " + expectedDesc + " but " + foundDesc + " found.";
    }

    var posDetails = peg$computePosDetails(pos),
        found      = pos < input.length ? input.charAt(pos) : null;

    if (expected !== null) {
      cleanupExpected(expected);
    }

    return new SyntaxError(
      message !== null ? message : buildMessage(expected, found),
      expected,
      found,
      pos,
      posDetails.line,
      posDetails.column
    );
  }

  function peg$parsestart() {
    var s0;

    s0 = peg$parsemerged();

    return s0;
  }

  function peg$parsemerged() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$parseordered();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsesep();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 44) {
          s3 = peg$c1;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c2); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parsesep();
          if (s4 !== peg$FAILED) {
            s5 = peg$parsemerged();
            if (s5 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c3(s1, s5);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$c0;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseordered();
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c4(s1);
      }
      s0 = s1;
    }

    return s0;
  }

  function peg$parseordered() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 91) {
      s1 = peg$c5;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c6); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parsesep();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsefiltered();
        if (s3 !== peg$FAILED) {
          s4 = peg$parsesep();
          if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 44) {
              s5 = peg$c1;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c2); }
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsesep();
              if (s6 !== peg$FAILED) {
                s7 = peg$parsefiltered();
                if (s7 !== peg$FAILED) {
                  s8 = peg$parsesep();
                  if (s8 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 93) {
                      s9 = peg$c7;
                      peg$currPos++;
                    } else {
                      s9 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c8); }
                    }
                    if (s9 !== peg$FAILED) {
                      s10 = peg$parsesep();
                      if (s10 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 62) {
                          s11 = peg$c9;
                          peg$currPos++;
                        } else {
                          s11 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c10); }
                        }
                        if (s11 !== peg$FAILED) {
                          s12 = peg$parsesep();
                          if (s12 !== peg$FAILED) {
                            s13 = peg$parseordered();
                            if (s13 !== peg$FAILED) {
                              peg$reportedPos = s0;
                              s1 = peg$c11(s3, s7, s13);
                              s0 = s1;
                            } else {
                              peg$currPos = s0;
                              s0 = peg$c0;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$c0;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c0;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$c0;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parsefiltered();
    }

    return s0;
  }

  function peg$parsefiltered() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsestream();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parsefilter();
      if (s3 !== peg$FAILED) {
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsefilter();
        }
      } else {
        s2 = peg$c0;
      }
      if (s2 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c13(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$c0;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parsestream();
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c14(s1);
      }
      s0 = s1;
    }

    return s0;
  }

  function peg$parsestream() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parseclass();
    if (s1 === peg$FAILED) {
      s1 = peg$parseid();
    }
    if (s1 === peg$FAILED) {
      s1 = peg$c15;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseeventType();
      if (s2 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c16(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$c0;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = [];
      if (peg$c17.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c18); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c17.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c18); }
          }
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c19(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 40) {
          s1 = peg$c20;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c21); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsemerged();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 41) {
              s3 = peg$c22;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c23); }
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c24(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }
    }

    return s0;
  }

  function peg$parseclass() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 46) {
      s1 = peg$c25;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c26); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parsevalue();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 58) {
          s3 = peg$c27;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c28); }
        }
        if (s3 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c29(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$c0;
    }

    return s0;
  }

  function peg$parseid() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 35) {
      s1 = peg$c30;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c31); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parsevalue();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 58) {
          s3 = peg$c27;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c28); }
        }
        if (s3 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c32(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$c0;
    }

    return s0;
  }

  function peg$parseeventType() {
    var s0;

    if (input.substr(peg$currPos, 9) === peg$c33) {
      s0 = peg$c33;
      peg$currPos += 9;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c34); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 7) === peg$c35) {
        s0 = peg$c35;
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c36); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 5) === peg$c37) {
          s0 = peg$c37;
          peg$currPos += 5;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c38); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 8) === peg$c39) {
            s0 = peg$c39;
            peg$currPos += 8;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c40); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 5) === peg$c41) {
              s0 = peg$c41;
              peg$currPos += 5;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c42); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 7) === peg$c43) {
                s0 = peg$c43;
                peg$currPos += 7;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c44); }
              }
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 8) === peg$c45) {
                  s0 = peg$c45;
                  peg$currPos += 8;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c46); }
                }
                if (s0 === peg$FAILED) {
                  if (input.substr(peg$currPos, 5) === peg$c47) {
                    s0 = peg$c47;
                    peg$currPos += 5;
                  } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c48); }
                  }
                  if (s0 === peg$FAILED) {
                    if (input.substr(peg$currPos, 10) === peg$c49) {
                      s0 = peg$c49;
                      peg$currPos += 10;
                    } else {
                      s0 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c50); }
                    }
                    if (s0 === peg$FAILED) {
                      if (input.substr(peg$currPos, 9) === peg$c51) {
                        s0 = peg$c51;
                        peg$currPos += 9;
                      } else {
                        s0 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c52); }
                      }
                      if (s0 === peg$FAILED) {
                        if (input.substr(peg$currPos, 8) === peg$c53) {
                          s0 = peg$c53;
                          peg$currPos += 8;
                        } else {
                          s0 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c54); }
                        }
                        if (s0 === peg$FAILED) {
                          if (input.substr(peg$currPos, 9) === peg$c55) {
                            s0 = peg$c55;
                            peg$currPos += 9;
                          } else {
                            s0 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c56); }
                          }
                          if (s0 === peg$FAILED) {
                            if (input.substr(peg$currPos, 10) === peg$c57) {
                              s0 = peg$c57;
                              peg$currPos += 10;
                            } else {
                              s0 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c58); }
                            }
                            if (s0 === peg$FAILED) {
                              if (input.substr(peg$currPos, 10) === peg$c59) {
                                s0 = peg$c59;
                                peg$currPos += 10;
                              } else {
                                s0 = peg$FAILED;
                                if (peg$silentFails === 0) { peg$fail(peg$c60); }
                              }
                              if (s0 === peg$FAILED) {
                                if (input.substr(peg$currPos, 9) === peg$c61) {
                                  s0 = peg$c61;
                                  peg$currPos += 9;
                                } else {
                                  s0 = peg$FAILED;
                                  if (peg$silentFails === 0) { peg$fail(peg$c62); }
                                }
                                if (s0 === peg$FAILED) {
                                  if (input.substr(peg$currPos, 8) === peg$c63) {
                                    s0 = peg$c63;
                                    peg$currPos += 8;
                                  } else {
                                    s0 = peg$FAILED;
                                    if (peg$silentFails === 0) { peg$fail(peg$c64); }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parsefilter() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 91) {
      s1 = peg$c5;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c6); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parsevalue();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 93) {
          s3 = peg$c7;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c8); }
        }
        if (s3 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c65(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$c0;
    }

    return s0;
  }

  function peg$parsevalue() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = [];
    if (peg$c66.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c67); }
    }
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        if (peg$c66.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c67); }
        }
      }
    } else {
      s1 = peg$c0;
    }
    if (s1 !== peg$FAILED) {
      peg$reportedPos = s0;
      s1 = peg$c68(s1);
    }
    s0 = s1;

    return s0;
  }

  function peg$parsesep() {
    var s0, s1;

    s0 = [];
    if (peg$c69.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c70); }
    }
    while (s1 !== peg$FAILED) {
      s0.push(s1);
      if (peg$c69.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c70); }
      }
    }

    return s0;
  }

  peg$result = peg$startRuleFunction();

  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail({ type: "end", description: "end of input" });
    }

    throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
  }
}

module.exports = {
  SyntaxError: SyntaxError,
  parse:       parse
};
},{}],44:[function(require,module,exports){
var dl = require('datalib'),
    expression = require('../expression');

var expr = (function() {
  var parse = expression.parse;
  var codegen = expression.code({
    idWhiteList: ['d', 'e', 'i', 'p', 'sg']
  });

  return function(expr) {    
    var value = codegen(parse(expr));
    value.fn = Function('d', 'e', 'i', 'p', 'sg',
      '"use strict"; return (' + value.fn + ');');
    return value;
  };
})();

expr.eval = function(graph, fn, d, e, i, p, sg) {
  sg = graph.signalValues(dl.array(sg));
  return fn.call(null, d, e, i, p, sg);
};

module.exports = expr;
},{"../expression":39,"datalib":16}],45:[function(require,module,exports){
var dl = require('datalib'),
    config = require('../util/config'),
    C = require('../util/constants');

module.exports = function parseInteractors(model, spec, defFactory) {
  var count = 0,
      sg = {}, pd = {}, mk = {},
      signals = [], predicates = [];

  function loaded(i) {
    return function(error, data) {
      if (error) {
        dl.error("LOADING FAILED: " + i.url);
      } else {
        var def = dl.isObject(data) ? data : JSON.parse(data);
        interactor(i.name, def);
      }
      if (--count == 0) inject();
    }
  }

  function interactor(name, def) {
    sg = {}, pd = {};
    if (def.signals)    signals.push.apply(signals, nsSignals(name, def.signals));
    if (def.predicates) predicates.push.apply(predicates, nsPredicates(name, def.predicates));
    nsMarks(name, def.marks);
  }

  function inject() {
    if (dl.keys(mk).length > 0) injectMarks(spec.marks);
    spec.signals = dl.array(spec.signals);
    spec.predicates = dl.array(spec.predicates);
    spec.signals.unshift.apply(spec.signals, signals);
    spec.predicates.unshift.apply(spec.predicates, predicates);
    defFactory();
  }

  function injectMarks(marks) {
    var m, r, i, len;
    marks = dl.array(marks);

    for(i = 0, len = marks.length; i < len; i++) {
      m = marks[i];
      if (r = mk[m.type]) {
        marks[i] = dl.duplicate(r);
        if (m.from) marks[i].from = m.from;
        if (m.properties) {
          [C.ENTER, C.UPDATE, C.EXIT].forEach(function(p) {
            marks[i].properties[p] = dl.extend(r.properties[p], m.properties[p]);
          });
        }
      } else if (m.marks) {  // TODO how to override properties of nested marks?
        injectMarks(m.marks);
      }
    }    
  }

  function ns(n, s) { 
    if (dl.isString(s)) {
      return s + "_" + n;
    } else {
      dl.keys(s).forEach(function(x) { 
        var regex = new RegExp('\\b'+x+'\\b', "g");
        n = n.replace(regex, s[x]) 
      });
      return n;
    }
  }

  function nsSignals(name, signals) {
    signals = dl.array(signals);
    // Two passes to ns all signals, and then overwrite their definitions
    // in case signal order is important.
    signals.forEach(function(s) { s.name = sg[s.name] = ns(s.name, name); });
    signals.forEach(function(s) {
      (s.streams || []).forEach(function(t) {
        t.type = ns(t.type, sg);
        t.expr = ns(t.expr, sg);
      });
    });
    return signals;
  }

  function nsPredicates(name, predicates) {
    predicates = dl.array(predicates);
    predicates.forEach(function(p) {
      p.name = pd[p.name] = ns(p.name, name);

      [p.operands, p.range].forEach(function(x) {
        (x || []).forEach(function(o) {
          if (o.signal) o.signal = ns(o.signal, sg);
          else if (o.predicate) nsOperand(o);
        })
      });

    });  
    return predicates; 
  }

  function nsOperand(o) {
    o.predicate = pd[o.predicate];
    dl.keys(o.input).forEach(function(k) {
      var i = o.input[k];
      if (i.signal) i.signal = ns(i.signal, sg);
    });
  }

  function nsMarks(name, marks) {
    (marks || []).forEach(function(m) { 
      nsProperties(m.properties.enter);
      nsProperties(m.properties.update);
      nsProperties(m.properties.exit);
      mk[ns(m.name, name)] = m; 
    });
  }

  function nsProperties(propset) {
    dl.keys(propset).forEach(function(k) {
      var p = propset[k];
      if (p.signal) p.signal = ns(p.signal, sg);
      else if (p.rule) {
        p.rule.forEach(function(r) { 
          if (r.signal) r.signal = ns(r.signal, sg);
          if (r.predicate) nsOperand(r); 
        });
      }
    });
  }

  (spec.interactors || []).forEach(function(i) {
    if (i.url) {
      count += 1;
      dl.load(dl.extend({url: i.url}, config.load), loaded(i));
    }
  });

  if (count === 0) setTimeout(inject, 1);
  return spec;
}
},{"../util/config":93,"../util/constants":94,"datalib":16}],46:[function(require,module,exports){
var dl = require('datalib'),
    parseProperties = require('./properties');

module.exports = function parseMark(model, mark) {
  var props = mark.properties,
      group = mark.marks;

  // parse mark property definitions
  dl.keys(props).forEach(function(k) {
    props[k] = parseProperties(model, mark.type, props[k]);
  });

  // parse delay function
  if (mark.delay) {
    mark.delay = parseProperties(model, mark.type, {delay: mark.delay});
  }

  // recurse if group type
  if (group) {
    mark.marks = group.map(function(g) { return parseMark(model, g); });
  }
    
  return mark;
};
},{"./properties":51,"datalib":16}],47:[function(require,module,exports){
var parseMark = require('./mark');

module.exports = function(model, spec, width, height) {
  return {
    type: "group",
    width: width,
    height: height,
    scales: spec.scales || [],
    axes: spec.axes || [],
    // legends: spec.legends || [],
    marks: (spec.marks || []).map(function(m) { return parseMark(model, m); })
  };
};
},{"./mark":46}],48:[function(require,module,exports){
var dl = require('datalib'),
    Node = require('../dataflow/Node'),
    tuple = require('../dataflow/tuple'),
    debug = require('../util/debug'),
    C = require('../util/constants');

var filter = function(field, value, src, dest) {
  for(var i = src.length-1; i >= 0; --i) {
    if(src[i][field] == value)
      dest.push.apply(dest, src.splice(i, 1));
  }
};

module.exports = function parseModify(model, def, ds) {
  var graph = model.graph,
      signal = def.signal ? dl.field(def.signal) : null, 
      signalName = signal ? signal[0] : null,
      predicate = def.predicate ? model.predicate(def.predicate) : null,
      reeval = (predicate === null),
      node = new Node(graph);

  node.evaluate = function(input) {
    if(predicate !== null) {
      var db = {};
      (predicate.data||[]).forEach(function(d) { db[d] = model.data(d).values(); });

      // TODO: input
      reeval = predicate({}, db, graph.signalValues(predicate.signals||[]), model._predicates);
    }

    debug(input, [def.type+"ing", reeval]);
    if(!reeval) return input;

    var datum = {}, 
        value = signal ? graph.signalRef(def.signal) : null,
        d = model.data(ds.name),
        prev = d.revises() ? null : undefined,
        t = null;

    datum[def.field] = value;

    // We have to modify ds._data so that subsequent pulses contain
    // our dynamic data. W/o modifying ds._data, only the output
    // collector will contain dynamic tuples. 
    if(def.type == C.ADD) {
      t = tuple.ingest(datum, prev);
      input.add.push(t);
      d._data.push(t);
    } else if(def.type == C.REMOVE) {
      filter(def.field, value, input.add, input.rem);
      filter(def.field, value, input.mod, input.rem);
      d._data = d._data.filter(function(x) { return x[def.field] !== value });
    } else if(def.type == C.TOGGLE) {
      var add = [], rem = [];
      filter(def.field, value, input.rem, add);
      filter(def.field, value, input.add, rem);
      filter(def.field, value, input.mod, rem);
      if(add.length == 0 && rem.length == 0) add.push(tuple.ingest(datum));

      input.add.push.apply(input.add, add);
      d._data.push.apply(d._data, add);
      input.rem.push.apply(input.rem, rem);
      d._data = d._data.filter(function(x) { return rem.indexOf(x) === -1 });
    } else if(def.type == C.CLEAR) {
      input.rem.push.apply(input.rem, input.add);
      input.rem.push.apply(input.rem, input.mod);
      input.add = [];
      input.mod = [];
      d._data  = [];
    } 

    input.fields[def.field] = 1;
    return input;
  };

  if(signalName) node.dependency(C.SIGNALS, signalName);
  if(predicate)  node.dependency(C.SIGNALS, predicate.signals);
  
  return node;
}
},{"../dataflow/Node":32,"../dataflow/tuple":35,"../util/constants":94,"../util/debug":95,"datalib":16}],49:[function(require,module,exports){
var dl = require('datalib');

module.exports = function parsePadding(pad) {
  if (pad == null) return "auto";
  else if (dl.isString(pad)) return pad==="strict" ? "strict" : "auto";
  else if (dl.isObject(pad)) return pad;
  var p = dl.isNumber(pad) ? pad : 20;
  return {top:p, left:p, right:p, bottom:p};
}
},{"datalib":16}],50:[function(require,module,exports){
var dl = require('datalib');

module.exports = function parsePredicate(model, spec) {
  var types = {
    '=':  parseComparator,
    '==': parseComparator,
    '!=': parseComparator,
    '>':  parseComparator,
    '>=': parseComparator,
    '<':  parseComparator,
    '<=': parseComparator,
    'and': parseLogical,
    '&&':  parseLogical,
    'or':  parseLogical,
    '||':  parseLogical,
    'in': parseIn
  };

  function parseSignal(signal, signals) {
    var s = dl.field(signal),
        code = "signals["+s.map(dl.str).join("][")+"]";
    signals[s.shift()] = 1;
    return code;
  };

  function parseOperands(operands) {
    var decl = [], defs = [],
        signals = {}, db = {};

    dl.array(operands).forEach(function(o, i) {
      var signal, name = "o"+i, def = "";
      
      if(o.value !== undefined) def = dl.str(o.value);
      else if(o.arg)    def = "args["+dl.str(o.arg)+"]";
      else if(o.signal) def = parseSignal(o.signal, signals);
      else if(o.predicate) {
        var pred = model.predicate(o.predicate);
        pred.signals.forEach(function(s) { signals[s] = 1; });
        pred.data.forEach(function(d) { db[d] = 1 });

        dl.keys(o.input).forEach(function(k) {
          var i = o.input[k], signal;
          def += "args["+dl.str(k)+"] = ";
          if(i.signal)   def += parseSignal(i.signal, signals);
          else if(i.arg) def += "args["+dl.str(i.arg)+"]";
          def+=", ";
        });

        def+= "predicates["+dl.str(o.predicate)+"](args, db, signals, predicates)";
      }

      decl.push(name);
      defs.push(name+"=("+def+")");
    });

    return {
      code: "var " + decl.join(", ") + ";\n" + defs.join(";\n") + ";\n",
      signals: dl.keys(signals),
      data: dl.keys(db)
    }
  };

  function parseComparator(spec) {
    var ops = parseOperands(spec.operands);
    if(spec.type == '=') spec.type = '==';

    return {
      code: ops.code + "return " + ["o0", "o1"].join(spec.type) + ";",
      signals: ops.signals,
      data: ops.data
    };
  };

  function parseLogical(spec) {
    var ops = parseOperands(spec.operands),
        o = [], i = 0, len = spec.operands.length;

    while(o.push("o"+i++)<len);
    if(spec.type == 'and') spec.type = '&&';
    else if(spec.type == 'or') spec.type = '||';

    return {
      code: ops.code + "return " + o.join(spec.type) + ";",
      signals: ops.signals,
      data: ops.data
    };
  };

  function parseIn(spec) {
    var o = [spec.item];
    if(spec.range) o.push.apply(o, spec.range);
    if(spec.scale) o.push(spec.scale);

    var ops = parseOperands(o),
        code = ops.code;

    if(spec.data) {
      var field = dl.field(spec.field).map(dl.str);
      code += "var where = function(d) { return d["+field.join("][")+"] == o0 };\n";
      code += "return db["+dl.str(spec.data)+"].filter(where).length > 0;";
    } else if(spec.range) {
      // TODO: inclusive/exclusive range?
      // TODO: inverting ordinal scales
      if(spec.scale) code += "o1 = o3(o1);\no2 = o3(o2);\n";
      code += "return o1 < o2 ? o1 <= o0 && o0 <= o2 : o2 <= o0 && o0 <= o1";
    }

    return {
      code: code, 
      signals: ops.signals, 
      data: ops.data.concat(spec.data ? [spec.data] : [])
    };
  };

  (spec || []).forEach(function(s) {
    var parse = types[s.type](s);
    var pred = Function("args", "db", "signals", "predicates", parse.code);
    pred.signals = parse.signals;
    pred.data = parse.data;
    model.predicate(s.name, pred);
  });

  return spec;
}
},{"datalib":16}],51:[function(require,module,exports){
(function (global){
var dl = require('datalib'),
    d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    tuple = require('../dataflow/tuple'),
    config = require('../util/config');

function compile(model, mark, spec) {
  var code = "",
      names = dl.keys(spec),
      i, len, name, ref, vars = {}, 
      deps = {
        signals: {},
        scales: {},
        data: {}
      };
      
  code += "var o = trans ? {} : item;\n"
  
  for (i=0, len=names.length; i<len; ++i) {
    ref = spec[name = names[i]];
    code += (i > 0) ? "\n  " : "  ";
    if(ref.rule) {
      ref = rule(model, name, ref.rule);
      code += "\n  " + ref.code
    } else {
      ref = valueRef(name, ref);
      code += "this.tpl.set(o, "+dl.str(name)+", "+ref.val+");";
    }

    vars[name] = true;
    ['signals', 'scales', 'data'].forEach(function(p) {
      if(ref[p] != null) dl.array(ref[p]).forEach(function(k) { deps[p][k] = 1 });
    });
  }

  if (vars.x2) {
    if (vars.x) {
      code += "\n  if (o.x > o.x2) { "
            + "var t = o.x;"
            + "this.tpl.set(o, 'x', o.x2);"
            + "this.tpl.set(o, 'x2', t); "
            + "};";
      code += "\n  this.tpl.set(o, 'width', (o.x2 - o.x));";
    } else if (vars.width) {
      code += "\n  this.tpl.set(o, 'x', (o.x2 - o.width));";
    } else {
      code += "\n  this.tpl.set(o, 'x', o.x2);"
    }
  }

  if (vars.y2) {
    if (vars.y) {
      code += "\n  if (o.y > o.y2) { "
            + "var t = o.y;"
            + "this.tpl.set(o, 'y', o.y2);"
            + "this.tpl.set(o, 'y2', t);"
            + "};";
      code += "\n  this.tpl.set(o, 'height', (o.y2 - o.y));";
    } else if (vars.height) {
      code += "\n  this.tpl.set(o, 'y', (o.y2 - o.height));";
    } else {
      code += "\n  this.tpl.set(o, 'y', o.y2);"
    }
  }
  
  if (hasPath(mark, vars)) code += "\n  item.touch();";
  code += "\n  if (trans) trans.interpolate(item, o);";

  try {
    var encoder = Function("item", "group", "trans", "db", 
      "signals", "predicates", code);
    encoder.tpl  = tuple;
    encoder.util = dl;
    encoder.d3   = d3; // For color spaces
    return {
      encode: encoder,
      signals: dl.keys(deps.signals),
      scales: dl.keys(deps.scales),
      data: dl.keys(deps.data)
    }
  } catch (e) {
    dl.error(e);
    dl.log(code);
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

function rule(model, name, rules) {
  var signals = [], scales = [], db = [],
      inputs = [], code = "";

  (rules||[]).forEach(function(r, i) {
    var predName = r.predicate,
        pred = model.predicate(predName),
        input = [], args = name+"_arg"+i,
        ref;

    dl.keys(r.input).forEach(function(k) {
      var ref = valueRef(i, r.input[k]);
      input.push(dl.str(k)+": "+ref.val);
      if(ref.signals) signals.push.apply(signals, dl.array(ref.signals));
      if(ref.scales)  scales.push.apply(scales, dl.array(ref.scales));
    });

    ref = valueRef(name, r);
    if(ref.signals) signals.push.apply(signals, dl.array(ref.signals));
    if(ref.scales)  scales.push.apply(scales, dl.array(ref.scales));

    if(predName) {
      signals.push.apply(signals, pred.signals);
      db.push.apply(db, pred.data);
      inputs.push(args+" = {"+input.join(', ')+"}");
      code += "if(predicates["+dl.str(predName)+"]("+args+", db, signals, predicates)) {\n" +
        "    this.tpl.set(o, "+dl.str(name)+", "+ref.val+");\n";
      code += rules[i+1] ? "  } else " : "  }";
    } else {
      code += "{\n" + 
        "    this.tpl.set(o, "+dl.str(name)+", "+ref.val+");\n"+
        "  }";
    }
  });

  code = "var " + inputs.join(",\n      ") + ";\n  " + code;
  return {code: code, signals: signals, scales: scales, data: db};
}

function valueRef(name, ref) {
  if (ref == null) return null;
  var isColor = name==="fill" || name==="stroke";
  var signals = [];

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

  // initialize value
  var val = null, signalRef = null;
  if (ref.value !== undefined) {
    val = dl.str(ref.value);
  }

  if (ref.signal !== undefined) {
    signalRef = dl.field(ref.signal);
    val = "signals["+signalRef.map(dl.str).join("][")+"]"; 
    signals.push(signalRef.shift());
  }

  // get field reference for enclosing group
  if (ref.group != null) {
    var grp = "group.datum";
    if (dl.isString(ref.group)) {
      grp = GROUP_VARS[ref.group]
        ? "group." + ref.group
        : "group.datum["+dl.field(ref.group).map(dl.str).join("][")+"]";
    }
  }

  // get data field value
  if (ref.field != null) {
    if (dl.isString(ref.field)) {
      val = "item.datum["+dl.field(ref.field).map(dl.str).join("][")+"]";
      if (ref.group != null) { val = "this.util.accessor("+val+")("+grp+")"; }
    } else if(ref.field.signal) {
      signalRef = dl.field(ref.field.signal);
      val = "item.datum[signals["+signalRef.map(dl.str).join("][")+"]]";
      if (ref.group != null) { val = "this.util.accessor("+val+")("+grp+")"; }
      signals.push(signalRef.shift());
    } else {
      val = "this.util.accessor(group.datum["
          + dl.field(ref.field.group).map(dl.str).join("][")
          + "])(item.datum)";
    }
  } else if (ref.group != null) {
    val = grp;
  }

  if (ref.scale != null) {
    var scale = null;
    if(dl.isString(ref.scale)) {
      scale = dl.str(ref.scale);
    } else if(ref.scale.signal) {
      signalRef = dl.field(ref.scale.signal);
      scale = "signals["+signalRef.map(dl.str).join("][")+"]";
      signals.push(signalRef.shift());
    } else {
      scale = (ref.scale.group ? "group" : "item")
        + ".datum[" + dl.str(ref.scale.group || ref.scale.field) + "]";
    }

    scale = "group.scale(" + scale + ")";
    if(ref.invert) scale += ".invert";  // TODO: ordinal scales

    // run through scale function if val specified.
    // if no val, scale function is predicate arg.
    if(val !== null || ref.band || ref.mult || ref.offset) {
      val = scale + (ref.band ? ".rangeBand()" : 
        "("+(val !== null ? val : "item.datum.data")+")");
    } else {
      val = scale;
    }
  }
  
  // multiply, offset, return value
  val = "(" + (ref.mult?(dl.number(ref.mult)+" * "):"") + val + ")"
    + (ref.offset ? " + " + dl.number(ref.offset) : "");
  return {val: val, signals: signals, scales: ref.scale};
}

function colorRef(type, x, y, z) {
  var xx = x ? valueRef("", x) : config.color[type][0],
      yy = y ? valueRef("", y) : config.color[type][1],
      zz = z ? valueRef("", z) : config.color[type][2]
      signals = [], scales = [];

  [xx, yy, zz].forEach(function(v) {
    if(v.signals) signals.push.apply(signals, v.signals);
    if(v.scales)  scales.push(v.scales);
  });

  return {
    val: "(this.d3." + type + "(" + [xx.val, yy.val, zz.val].join(",") + ') + "")',
    signals: signals,
    scales: scales
  };
}

module.exports = compile;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../dataflow/tuple":35,"../util/config":93,"datalib":16}],52:[function(require,module,exports){
var expr = require('./expr'),
    C = require('../util/constants');

module.exports = function parseSignals(model, spec) {
  var graph = model.graph;

  // process each signal definition
  (spec || []).forEach(function(s) {
    var signal = graph.signal(s.name, s.init),
        exp;

    if(s.expr) {
      exp = expr(s.expr);
      signal.evaluate = function(input) {
        var value = expr.eval(graph, exp.fn, null, null, null, null, exp.signals);
        if(spec.scale) value = model.scale(spec, value);
        signal.value(value);
        input.signals[s.name] = 1;
        return input;
      };
      signal.dependency(C.SIGNALS, exp.signals);
      exp.signals.forEach(function(dep) { graph.signal(dep).addListener(signal); });
    }
  });

  return spec;
};
},{"../util/constants":94,"./expr":44}],53:[function(require,module,exports){
var dl = require('datalib'),
    Model = require('../core/Model'), 
    View = require('../core/View'), 
    parsePadding = require('../parse/padding'),
    parseMarks = require('../parse/marks'),
    parseSignals = require('../parse/signals'),
    parsePredicates = require('../parse/predicates'),
    parseData = require('../parse/data'),
    parseInteractors = require('../parse/interactors');

module.exports = function parseSpec(spec, callback, viewFactory) {
  // protect against subsequent spec modification
  spec = dl.duplicate(spec);

  viewFactory = viewFactory || View.factory;

  var width = spec.width || 500,
      height = spec.height || 500,
      viewport = spec.viewport || null,
      model = new Model();

  parseInteractors(model, spec, function() {
    model.defs({
      width: width,
      height: height,
      viewport: viewport,
      padding: parsePadding(spec.padding),
      signals: parseSignals(model, spec.signals),
      predicates: parsePredicates(model, spec.predicates),
      marks: parseMarks(model, spec, width, height),
      data: parseData(model, spec.data, function() { callback(viewFactory(model)); })
    });
  });
}
},{"../core/Model":27,"../core/View":28,"../parse/data":42,"../parse/interactors":45,"../parse/marks":47,"../parse/padding":49,"../parse/predicates":50,"../parse/signals":52,"datalib":16}],54:[function(require,module,exports){
(function (global){
var dl = require('datalib'),
    d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    Node = require('../dataflow/Node'),
    changset = require('../dataflow/changeset'),
    selector = require('./events'),
    expr = require('./expr'),
    C = require('../util/constants');

var START = "start", MIDDLE = "middle", END = "end";

module.exports = function(view) {
  var model = view.model(),
      graph = model.graph,
      spec  = model.defs().signals,
      register = {}, nodes = {};

  function scale(def, value, item) {
    if(!item || !item.scale) {
      item = (item && item.mark) ? item.mark.group : model.scene().items[0];
    }

    var scale = item.scale(def.scale.signal || def.scale);
    if(!scale) return value;
    return def.invert ? scale.invert(value) : scale(value);
  }

  function signal(sig, selector, exp, spec) {
    var n = new Node(graph),
        item = spec.item ? graph.signal(spec.item.signal) : null;
    n.evaluate = function(input) {
      if(!input.signals[selector.signal]) return graph.doNotPropagate;
      var val = expr.eval(graph, exp.fn, null, null, null, null, exp.signals);
      if(spec.scale) val = scale(spec, val, item ? item.value() : null);
      sig.value(val);
      input.signals[sig.name()] = 1;
      input.reflow = true;
      return input;  
    };
    n.dependency(C.SIGNALS, selector.signal);
    n.addListener(sig);
    graph.signal(selector.signal).addListener(n);
  };

  function event(sig, selector, exp, spec) {
    var filters = selector.filters || [],
        target = selector.target;

    if(target) filters.push("i."+target.type+"=="+dl.str(target.value));

    register[selector.event] = register[selector.event] || [];
    register[selector.event].push({
      signal: sig,
      exp: exp,
      filters: filters.map(function(f) { return expr(f); }),
      spec: spec
    });

    nodes[selector.event] = nodes[selector.event] || new Node(graph);
    nodes[selector.event].addListener(sig);
  };

  function orderedStream(sig, selector, exp, spec) {
    var name = sig.name(), 
        trueFn = expr("true"),
        s = {};

    s[START]  = graph.signal(name + START,  false);
    s[MIDDLE] = graph.signal(name + MIDDLE, false);
    s[END]    = graph.signal(name + END,    false);

    var router = new Node(graph);
    router.evaluate = function(input) {
      if(s[START].value() === true && s[END].value() === false) {
        // TODO: Expand selector syntax to allow start/end signals into stream.
        // Until then, prevent old middles entering stream on new start.
        if(input.signals[name+START]) return graph.doNotPropagate;

        sig.value(s[MIDDLE].value());
        input.signals[name] = 1;
        return input;
      }

      if(s[END].value() === true) {
        s[START].value(false);
        s[END].value(false);
      }

      return graph.doNotPropagate;
    };
    router.addListener(sig);

    [START, MIDDLE, END].forEach(function(x) {
      var val = (x == MIDDLE) ? exp : trueFn,
          sp = (x == MIDDLE) ? spec : {};

      if(selector[x].event) event(s[x], selector[x], val, sp);
      else if(selector[x].signal) signal(s[x], selector[x], val, sp);
      else if(selector[x].stream) mergedStream(s[x], selector[x].stream, val, sp);
      s[x].addListener(router);
    });
  };

  function mergedStream(sig, selector, exp, spec) {
    selector.forEach(function(s) {
      if(s.event)       event(sig, s, exp, spec);
      else if(s.signal) signal(sig, s, exp, spec);
      else if(s.start)  orderedStream(sig, s, exp, spec);
      else if(s.stream) mergedStream(sig, s.stream, exp, spec);
    });
  };

  (spec || []).forEach(function(sig) {
    var signal = graph.signal(sig.name);
    if(sig.expr) return;  // Cannot have an expr and stream definition.

    (sig.streams || []).forEach(function(stream) {
      var sel = selector.parse(stream.type),
          exp = expr(stream.expr);
      mergedStream(signal, sel, exp, stream);
    });
  });

  // We register the event listeners all together so that if multiple
  // signals are registered on the same event, they will receive the
  // new value on the same pulse. 

  // TODO: Filters, time intervals, target selectors
  dl.keys(register).forEach(function(r) {
    var handlers = register[r], 
        node = nodes[r];

    view.on(r, function(evt, item) {
      var cs = changset.create(null, true),
          pad = view.padding(),
          filtered = false,
          val, h, i, m, d;

      evt.preventDefault(); // Stop text selection
      m = d3.mouse((d3.event=evt, view._el)); // Relative position within container
      item = item||{};
      d = item.datum||{};
      var p = {x: m[0] - pad.left, y: m[1] - pad.top};

      for(i = 0; i < handlers.length; i++) {
        h = handlers[i];
        filtered = h.filters.some(function(f) {
          return !expr.eval(graph, f.fn, d, evt, item, p, f.signals);
        });
        if(filtered) continue;
        
        val = expr.eval(graph, h.exp.fn, d, evt, item, p, h.exp.signals); 
        if(h.spec.scale) val = scale(h.spec, val, item);
        h.signal.value(val);
        cs.signals[h.signal.name()] = 1;
      }

      graph.propagate(cs, node);
    });
  })
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../dataflow/Node":32,"../dataflow/changeset":34,"../util/constants":94,"./events":43,"./expr":44,"datalib":16}],55:[function(require,module,exports){
var dl = require('datalib'),
    transforms = require('../transforms/index');

module.exports = function parseTransforms(model, def) {
  var tx = new transforms[def.type](model.graph);
  if(def.type == 'facet') {
    var pipeline = (def.transform||[])
      .map(function(t) { return parseTransforms(model, t); });
    tx.pipeline(pipeline);
  }

  // We want to rename output fields before setting any other properties,
  // as subsequent properties may require output to be set (e.g. group by).
  if(def.output) tx.output(def.output);

  dl.keys(def).forEach(function(k) {
    if(k === 'type' || k === 'output') return;
    if(k === 'transform' && def.type === 'facet') return;
    (tx[k]).set(tx, def[k]);
  });

  return tx;
};
},{"../transforms/index":90,"datalib":16}],56:[function(require,module,exports){
(function (global){
var dl = require('datalib'),
    d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    marks = require('./marks');

var handler = function(el, model) {
  this._active = null;
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
  return dl.keys(h).reduce(function(a, k) {
    return h[k].reduce(function(a, x) { return (a.push(x), a); }, a);
  }, []);
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
  "mousewheel",
  "touchstart"
];
events.forEach(function(type) {
  prototype[type] = function(evt) {
    this.fire(type, evt);
  };
});
events.push("mousemove");
events.push("mouseout");
events.push("touchmove");
events.push("touchend");

function eventName(name) {
  var i = name.indexOf(".");
  return i < 0 ? name : name.slice(0,i);
}

prototype.touchmove = prototype.mousemove = function(evt) {
  var pad = this._padding,
      b = evt.target.getBoundingClientRect(),
      x = evt.clientX - b.left,
      y = evt.clientY - b.top,
      a = this._active,
      p = this.pick(this._model.scene(), x, y, x-pad.left, y-pad.top);

  if (p === a) {
    this.fire("mousemove", evt);
    if(evt.type == "touchmove") this.fire("touchmove", evt);
    return;
  } else if (a) {
    this.fire("mouseout", evt);
    if(evt.type == "touchend") this.fire("touchend", evt);
  }
  this._active = p;
  if (p) {
    this.fire("mouseover", evt);
    if(evt.type == "touchstart") this.fire("touchstart", evt);
  }
};

prototype.touchend = prototype.mouseout = function(evt) {
  if (this._active) {
    this.fire("mouseout", evt);
    this.fire("touchend", evt);
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
  if (h) {
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
      picker = marks.pick[marktype];
  return picker.call(this, g, scene, x, y, gx, gy);
};

module.exports = handler;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./marks":59,"datalib":16}],57:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    dl = require('datalib'),
    Bounds = require('../../core/Bounds'),
    config = require('../../util/config'),
    marks = require('./marks');

var renderer = function() {
  this._ctx = null;
  this._el = null;
  this._imgload = 0;
};

var prototype = renderer.prototype;

prototype.initialize = function(el, width, height, pad) {
  this._el = el;
  
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
  var b = new Bounds(bounds);
  while ((item = item.mark.group) != null) {
    b.translate(item.x || 0, item.y || 0);
  }
  return b;
}
  
function getBounds(items) {
  return !items ? null :
    dl.array(items).reduce(function(b, item) {
      return b.union(translatedBounds(item, item.bounds))
              .union(translatedBounds(item, item['bounds:prev']));
    }, new Bounds());  
}

function setBounds(g, bounds) {
  var bbox = null;
  if (bounds) {
    bbox = (new Bounds(bounds)).round();
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
  g.clearRect(-pad.left, -pad.top, w, h);

  // render
  this.draw(g, scene, bb);

  // render again to handle possible bounds change
  if (items) {
    g.restore();
    g.save();
    bb2 = setBounds(g, getBounds(items));
    if (!bb.encloses(bb2)) {
      g.clearRect(-pad.left, -pad.top, w, h);
      this.draw(g, scene, bb2);
    }
  }
  
  // takedown
  g.restore();
  this._scene = null;
};

prototype.draw = function(ctx, scene, bounds) {
  var marktype = scene.marktype,
      renderer = marks.draw[marktype];
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
      scene = renderer._scene,
      image = null, url;

  renderer._imgload += 1;
  if (dl.isNode) {
    image = new ((typeof window !== "undefined" ? window.canvas : typeof global !== "undefined" ? global.canvas : null).Image)();
    dl.load(dl.extend({url: uri}, config.load), function(err, data) {
      if (err) { dl.error(err); return; }
      image.src = data;
      image.loaded = true;
      renderer._imgload -= 1;
    });
  } else {
    image = new Image();
    url = config.baseURL + uri;
    image.onload = function() {
      image.loaded = true;
      renderer._imgload -= 1;
      renderer.renderAsync(scene);
    };
    image.src = url;
  }

  return image;
};

module.exports = renderer;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../core/Bounds":26,"../../util/config":93,"./marks":59,"datalib":16}],58:[function(require,module,exports){
module.exports = {
  Handler:  require('./Handler'),
  Renderer: require('./Renderer')
};
},{"./Handler":56,"./Renderer":57}],59:[function(require,module,exports){
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
},{"../../core/Bounds":26,"../../util/bounds":92,"../../util/config":93,"./path":60}],60:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    Bounds = require('../../core/Bounds');

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
      bounds = new Bounds();
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
  var area = d3.svg.area()
    .x(function(d) { return d.x; })
    .y1(function(d) { return d.y; })
    .y0(function(d) { return d.y + d.height; });
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

module.exports = {
  parse:  parse,
  render: render,
  bounds: bounds,
  area:   area,
  line:   line
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../core/Bounds":26}],61:[function(require,module,exports){
var dl = require('datalib');

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

    if (item) item = item.mark ? item : item[0];
    handler.call(that._obj, evt, item);
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
  return dl.keys(h).reduce(function(a, k) {
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

module.exports = handler;
},{"datalib":16}],62:[function(require,module,exports){
var dl = require('datalib'),
    marks = require('./marks');

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

prototype.initialize = function(el, width, height, pad) {
  this._el = el;

  // remove any existing svg element
  d3.select(el).select("svg.marks").remove();

  // create svg element and initialize attributes
  this._svg = d3.select(el)
    .append("svg")
    .attr("class", "marks");
  
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
      dgrad = dl.keys(all.gradient),
      dclip = dl.keys(all.clipping),
      defs = svg.select("defs"), grad, clip;

  // get or create svg defs block
  if (dgrad.length===0 && dclip.length==0) { defs.remove(); return; }
  if (defs.empty()) defs = svg.insert("defs", ":first-child");
  
  grad = defs.selectAll("linearGradient").data(dgrad, dl.identity);
  grad.enter().append("linearGradient").attr("id", dl.identity);
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
  
  clip = defs.selectAll("clipPath").data(dclip, dl.identity);
  clip.enter().append("clipPath").attr("id", dl.identity);
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
  marks.current = this;

  if (items) {
    this.renderItems(dl.array(items));
  } else {
    this.draw(this._ctx, scene, -1);
  }
  this.updateDefs();

 delete marks.current;
};

prototype.renderItems = function(items) {
  var item, node, type, nest, i, n;

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
      renderer = marks.draw[marktype];
  renderer.call(this, ctx, scene, index);
};

module.exports = renderer;
},{"./marks":64,"datalib":16}],63:[function(require,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"./Handler":61,"./Renderer":62,"dup":58}],64:[function(require,module,exports){
(function (global){
var dl = require('datalib'),
    d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    config = require('../../util/config');

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
var styleProps = dl.keys(styles);

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
        marks.current._defs.gradient[value.id] = value;
        value = "url(#" + value.id + ")";
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
  var o = items[0];
  area_path
    .interpolate(o.interpolate || "linear")
    .tension(o.tension == null ? 0.7 : o.tension);
  this.setAttribute("d", area_path(items));
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
      url = config.baseURL + o.url;
  
  this.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
  this.setAttribute("x", x);
  this.setAttribute("y", y);
  this.setAttribute("width", w);
  this.setAttribute("height", h);
}
  
function fontString(o) {
  return (o.fontStyle ? o.fontStyle + " " : "")
    + (o.fontVariant ? o.fontVariant + " " : "")
    + (o.fontWeight ? o.fontWeight + " " : "")
    + (o.fontSize != null ? o.fontSize : config.render.fontSize) + "px "
    + (o.font || config.render.font);
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
    marks.current._defs.clipping[id] = c;
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
    drawMark(g, scene, index, "mark_", tag, attr, nest);
  };
}

function drawMark(g, scene, index, prefix, tag, attr, nest) {
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

function drawGroup(g, scene, index, prefix) {    
  var p = drawMark(g, scene, index, prefix || "group_", "g", group),
      c = p.node().childNodes, n = c.length, i, j, m;
  
  for (i=0; i<n; ++i) {
    var items = c[i].__data__.items,
        legends = c[i].__data__.legendItems || [],
        axes = c[i].__data__.axisItems || [],
        sel = d3.select(c[i]),
        idx = 0;

    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].def.layer === "back") {
        drawGroup.call(this, sel, axes[j], idx++, "axis_");
      }
    }
    for (j=0, m=items.length; j<m; ++j) {
      this.draw(sel, items[j], idx++);
    }
    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].def.layer !== "back") {
        drawGroup.call(this, sel, axes[j], idx++, "axis_");
      }
    }
    for (j=0, m=legends.length; j<m; ++j) {
      drawGroup.call(this, sel, legends[j], idx++, "legend_");
    }
  }
}

var marks = module.exports = {
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
  },
  current: null
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../util/config":93,"datalib":16}],65:[function(require,module,exports){
var Node = require('../dataflow/Node'),
    bounds = require('../util/bounds'),
    C = require('../util/constants'),
    debug = require('../util/debug');

function Bounder(model, mark) {
  this._mark = mark;
  return Node.prototype.init.call(this, model.graph).router(true);
}

var proto = (Bounder.prototype = new Node());

proto.evaluate = function(input) {
  debug(input, ["bounds", this._mark.marktype]);

  bounds.mark(this._mark);
  if (this._mark.marktype === C.GROUP) 
    bounds.mark(this._mark, null, false);

  input.reflow = true;
  return input;
};

module.exports = Bounder;
},{"../dataflow/Node":32,"../util/bounds":92,"../util/constants":94,"../util/debug":95}],66:[function(require,module,exports){
var dl = require('datalib'),
    Node = require('../dataflow/Node'),
    Encoder  = require('./Encoder'),
    Bounder  = require('./Bounder'),
    Item  = require('./Item'),
    parseData = require('../parse/data'),
    tuple = require('../dataflow/tuple'),
    changeset = require('../dataflow/changeset'),
    debug = require('../util/debug'),
    C = require('../util/constants');

function Builder() {    
  return arguments.length ? this.init.apply(this, arguments) : this;
}

var proto = (Builder.prototype = new Node());

proto.init = function(model, def, mark, parent, parent_id, inheritFrom) {
  Node.prototype.init.call(this, model.graph)
    .router(true)
    .collector(true);

  this._model = model;
  this._def   = def;
  this._mark  = mark;
  this._from  = (def.from ? def.from.data : null) || inheritFrom;
  this._ds    = dl.isString(this._from) ? model.data(this._from) : null;
  this._map   = {};

  this._revises = false;  // Should scenegraph items track _prev?

  mark.def = def;
  mark.marktype = def.type;
  mark.interactive = !(def.interactive === false);
  mark.items = [];

  this._parent = parent;
  this._parent_id = parent_id;

  if(def.from && (def.from.mark || def.from.transform || def.from.modify)) {
    inlineDs.call(this);
  }

  // Non-group mark builders are super nodes. Encoder and Bounder remain 
  // separate operators but are embedded and called by Builder.evaluate.
  this._isSuper = (this._def.type !== C.GROUP); 
  this._encoder = new Encoder(this._model, this._mark);
  this._bounder = new Bounder(this._model, this._mark);

  if(this._ds) { this._encoder.dependency(C.DATA, this._from); }

  // Since Builders are super nodes, copy over encoder dependencies
  // (bounder has no registered dependencies).
  this.dependency(C.DATA, this._encoder.dependency(C.DATA));
  this.dependency(C.SCALES, this._encoder.dependency(C.SCALES));
  this.dependency(C.SIGNALS, this._encoder.dependency(C.SIGNALS));

  return this;
};

proto.revises = function(p) {
  if(!arguments.length) return this._revises;

  // If we've not needed prev in the past, but a new inline ds needs it now
  // ensure existing items have prev set.
  if(!this._revises && p) {
    this._items.forEach(function(d) { if(d._prev === undefined) d._prev = C.SENTINEL; });
  }

  this._revises = this._revises || p;
  return this;
};

// Reactive geometry and mark-level transformations are handled here 
// because they need their group's data-joined context. 
function inlineDs() {
  var from = this._def.from,
      geom = from.mark,
      src, name, spec, sibling, output;

  if(geom) {
    name = ["vg", this._parent_id, geom].join("_");
    spec = {
      name: name,
      transform: from.transform, 
      modify: from.modify
    };
  } else {
    src = this._model.data(this._from);
    name = ["vg", this._from, this._def.type, src.listeners(true).length].join("_");
    spec = {
      name: name,
      source: this._from,
      transform: from.transform,
      modify: from.modify
    };
  }

  this._from = name;
  this._ds = parseData.datasource(this._model, spec);
  var revises = this._ds.revises();

  if(geom) {
    sibling = this.sibling(geom).revises(revises);
    if(sibling._isSuper) sibling.addListener(this._ds.listener());
    else sibling._bounder.addListener(this._ds.listener());
  } else {
    // At this point, we have a new datasource but it is empty as
    // the propagation cycle has already crossed the datasources. 
    // So, we repulse just this datasource. This should be safe
    // as the ds isn't connected to the scenegraph yet.
    
    var output = this._ds.source().revises(revises).last();
        input  = changeset.create(output);

    input.add = output.add;
    input.mod = output.mod;
    input.rem = output.rem;
    input.stamp = null;
    this._graph.propagate(input, this._ds.listener());
  }
}

proto.pipeline = function() {
  return [this];
};

proto.connect = function() {
  var builder = this;

  this._model.graph.connect(this.pipeline());
  this._encoder.dependency(C.SCALES).forEach(function(s) {
    builder._parent.scale(s).addListener(builder);
  });

  if(this._parent) {
    if(this._isSuper) this.addListener(this._parent._collector);
    else this._bounder.addListener(this._parent._collector);
  }

  return this;
};

proto.disconnect = function() {
  var builder = this;
  if(!this._listeners.length) return this;

  Node.prototype.disconnect.call(this);
  this._model.graph.disconnect(this.pipeline());
  this._encoder.dependency(C.SCALES).forEach(function(s) {
    builder._parent.scale(s).removeListener(builder);
  });
  return this;
};

proto.sibling = function(name) {
  return this._parent.child(name, this._parent_id);
};

proto.evaluate = function(input) {
  debug(input, ["building", this._from, this._def.type]);

  var output, fullUpdate, fcs, data;

  if(this._ds) {
    output = changeset.create(input);

    // We need to determine if any encoder dependencies have been updated.
    // However, the encoder's data source will likely be updated, and shouldn't
    // trigger all items to mod.
    data = dl.duplicate(output.data);
    delete output.data[this._ds.name()];
    fullUpdate = this._encoder.reevaluate(output);
    output.data = data;

    // If a scale or signal in the update propset has been updated, 
    // send forward all items for reencoding if we do an early return.
    if(fullUpdate) output.mod = this._mark.items.slice();

    fcs = this._ds.last();
    if(!fcs) {
      output.reflow = true
    } else if(fcs.stamp > this._stamp) {
      output = joinDatasource.call(this, fcs, this._ds.values(), fullUpdate);
    }
  } else {
    fullUpdate = this._encoder.reevaluate(input);
    data = dl.isFunction(this._def.from) ? this._def.from() : [C.SENTINEL];
    output = joinValues.call(this, input, data, fullUpdate);
  }

  output = this._graph.evaluate(output, this._encoder);
  return this._isSuper ? this._graph.evaluate(output, this._bounder) : output;
};

function newItem() {
  var prev = this._revises ? null : undefined,
      item = tuple.ingest(new Item(this._mark), prev);

  // For the root node's item
  if(this._def.width)  tuple.set(item, "width",  this._def.width);
  if(this._def.height) tuple.set(item, "height", this._def.height);
  return item;
};

function join(data, keyf, next, output, prev, mod) {
  var i, key, len, item, datum, enter;

  for(i=0, len=data.length; i<len; ++i) {
    datum = data[i];
    item  = keyf ? this._map[key = keyf(datum)] : prev[i];
    enter = item ? false : (item = newItem.call(this), true);
    item.status = enter ? C.ENTER : C.UPDATE;
    item.datum = datum;
    tuple.set(item, "key", key);
    this._map[key] = item;
    next.push(item);
    if(enter) output.add.push(item);
    else if(!mod || (mod && mod[datum._id])) output.mod.push(item);
  }
}

function joinDatasource(input, data, fullUpdate) {
  var output = changeset.create(input),
      keyf = keyFunction(this._def.key || "_id"),
      add = input.add, 
      mod = input.mod, 
      rem = input.rem,
      next = [],
      i, key, len, item, datum, enter;

  // Build rems first, and put them at the head of the next items
  // Then build the rest of the data values (which won't contain rem).
  // This will preserve the sort order without needing anything extra.

  for(i=0, len=rem.length; i<len; ++i) {
    item = this._map[key = keyf(rem[i])];
    item.status = C.EXIT;
    next.push(item);
    output.rem.push(item);
    this._map[key] = null;
  }

  join.call(this, data, keyf, next, output, null, tuple.idMap(fullUpdate ? data : mod));

  return (this._mark.items = next, output);
}

function joinValues(input, data, fullUpdate) {
  var output = changeset.create(input),
      keyf = keyFunction(this._def.key),
      prev = this._mark.items || [],
      next = [],
      i, key, len, item, datum, enter;

  for (i=0, len=prev.length; i<len; ++i) {
    item = prev[i];
    item.status = C.EXIT;
    if (keyf) this._map[item.key] = item;
  }
  
  join.call(this, data, keyf, next, output, prev, fullUpdate ? tuple.idMap(data) : null);

  for (i=0, len=prev.length; i<len; ++i) {
    item = prev[i];
    if (item.status === C.EXIT) {
      tuple.set(item, "key", keyf ? item.key : this._items.length);
      next.splice(0, 0, item);  // Keep item around for "exit" transition.
      output.rem.push(item);
    }
  }
  
  return (this._mark.items = next, output);
};

function keyFunction(key) {
  if (key == null) return null;
  var f = dl.array(key).map(dl.accessor);
  return function(d) {
    for (var s="", i=0, n=f.length; i<n; ++i) {
      if (i>0) s += "|";
      s += String(f[i](d));
    }
    return s;
  }
};

module.exports = Builder;
},{"../dataflow/Node":32,"../dataflow/changeset":34,"../dataflow/tuple":35,"../parse/data":42,"../util/constants":94,"../util/debug":95,"./Bounder":65,"./Encoder":67,"./Item":69,"datalib":16}],67:[function(require,module,exports){
var Node = require('../dataflow/Node'),
    C = require('../util/constants'),
    debug = require('../util/debug'),
    EMPTY = {};

function Encoder(model, mark) {
  var props = mark.def.properties || {},
      update = props.update;

  Node.prototype.init.call(this, model.graph)

  this._model = model;
  this._mark  = mark;

  if(update) {
    this.dependency(C.DATA, update.data);
    this.dependency(C.SCALES, update.scales);
    this.dependency(C.SIGNALS, update.signals);
  }

  return this;
}

var proto = (Encoder.prototype = new Node());

proto.evaluate = function(input) {
  debug(input, ["encoding", this._mark.def.type]);
  var items = this._mark.items,
      props = this._mark.def.properties || {},
      enter  = props.enter,
      update = props.update,
      exit   = props.exit,
      i, len, item;

  // Items marked for removal are at the head of items. Process them first.
  for(i=0, len=input.rem.length; i<len; ++i) {
    item = input.rem[i];
    if(update) encode.call(this, update, item, input.trans);
    if(exit)   encode.call(this, exit,   item, input.trans); 
    if(input.trans && !exit) input.trans.interpolate(item, EMPTY);
    else if(!input.trans) item.remove();
  }

  for(i=0, len=input.add.length; i<len; ++i) {
    item = input.add[i];
    if(enter)  encode.call(this, enter,  item, input.trans);
    if(update) encode.call(this, update, item, input.trans);
    item.status = C.UPDATE;
  }

  if(update) {
    for(i=0, len=input.mod.length; i<len; ++i) {
      item = input.mod[i];
      encode.call(this, update, item, input.trans);
    }
  }

  return input;
};

function encode(prop, item, trans, stamp) {
  var model = this._model,
      enc = prop.encode,
      sg = this._graph.signalValues(prop.signals||[]),
      db = (prop.data||[]).reduce(function(db, ds) { 
        return db[ds] = model.data(ds).values(), db;
      }, {});

  enc.call(enc, item, item.mark.group||item, trans, db, sg, model.predicates());
}

module.exports = Encoder;
},{"../dataflow/Node":32,"../util/constants":94,"../util/debug":95}],68:[function(require,module,exports){
var dl = require('datalib'),
    Node = require('../dataflow/Node'),
    Collector = require('../dataflow/Collector'),
    Builder = require('./Builder'),
    Scale = require('./Scale'),
    parseAxes = require('../parse/axes'),
    debug = require('../util/debug'),
    C = require('../util/constants');

function GroupBuilder() {
  this._children = {};
  this._scaler = null;
  this._recursor = null;

  this._scales = {};
  this.scale = scale.bind(this);
  return arguments.length ? this.init.apply(this, arguments) : this;
}

var proto = (GroupBuilder.prototype = new Builder());

proto.init = function(model, def, mark, parent, parent_id, inheritFrom) {
  var builder = this;

  this._scaler = new Node(model.graph);

  (def.scales||[]).forEach(function(s) { 
    s = builder.scale(s.name, new Scale(model, s, builder));
    builder._scaler.addListener(s);  // Scales should be computed after group is encoded
  });

  this._recursor = new Node(model.graph);
  this._recursor.evaluate = recurse.bind(this);

  var scales = (def.axes||[]).reduce(function(acc, x) {
    return (acc[x.scale] = 1, acc);
  }, {});
  this._recursor.dependency(C.SCALES, dl.keys(scales));

  // We only need a collector for up-propagation of bounds calculation,
  // so only GroupBuilders, and not regular Builders, have collectors.
  this._collector = new Collector(model.graph);

  return Builder.prototype.init.apply(this, arguments);
};

proto.evaluate = function(input) {
  var output = Builder.prototype.evaluate.apply(this, arguments),
      builder = this;

  output.add.forEach(function(group) { buildGroup.call(builder, output, group); });
  return output;
};

proto.pipeline = function() {
  return [this, this._scaler, this._recursor, this._collector, this._bounder];
};

proto.disconnect = function() {
  var builder = this;
  dl.keys(builder._children).forEach(function(group_id) {
    builder._children[group_id].forEach(function(c) {
      builder._recursor.removeListener(c.builder);
      c.builder.disconnect();
    })
  });

  builder._children = {};
  return Builder.prototype.disconnect.call(this);
};

proto.child = function(name, group_id) {
  var children = this._children[group_id],
      i = 0, len = children.length,
      child;

  for(; i<len; ++i) {
    child = children[i];
    if(child.type == C.MARK && child.builder._def.name == name) break;
  }

  return child.builder;
};

function recurse(input) {
  var builder = this,
      hasMarks = this._def.marks && this._def.marks.length > 0,
      hasAxes = this._def.axes && this._def.axes.length > 0,
      i, len, group, pipeline, def, inline = false;

  for(i=0, len=input.add.length; i<len; ++i) {
    group = input.add[i];
    if(hasMarks) buildMarks.call(this, input, group);
    if(hasAxes)  buildAxes.call(this, input, group);
  }

  // Wire up new children builders in reverse to minimize graph rewrites.
  for (i=input.add.length-1; i>=0; --i) {
    group = input.add[i];
    for (j=this._children[group._id].length-1; j>=0; --j) {
      c = this._children[group._id][j];
      c.builder.connect();
      pipeline = c.builder.pipeline();
      def = c.builder._def;

      // This new child needs to be built during this propagation cycle.
      // We could add its builder as a listener off the _recursor node, 
      // but try to inline it if we can to minimize graph dispatches.
      inline = (def.type !== C.GROUP);
      inline = inline && (this._model.data(c.from) !== undefined); 
      inline = inline && (pipeline[pipeline.length-1].listeners().length == 1); // Reactive geom
      c.inline = inline;

      if(inline) c.builder.evaluate(input);
      else this._recursor.addListener(c.builder);
    }
  }

  for(i=0, len=input.mod.length; i<len; ++i) {
    group = input.mod[i];
    // Remove temporary connection for marks that draw from a source
    if(hasMarks) {
      builder._children[group._id].forEach(function(c) {
        if(c.type == C.MARK && !c.inline && builder._model.data(c.from) !== undefined ) {
          builder._recursor.removeListener(c.builder);
        }
      });
    }

    // Update axes data defs
    if(hasAxes) {
      parseAxes(builder._model, builder._def.axes, group.axes, group);
      group.axes.forEach(function(a, i) { a.def() });
    }      
  }

  for(i=0, len=input.rem.length; i<len; ++i) {
    group = input.rem[i];
    // For deleted groups, disconnect their children
    builder._children[group._id].forEach(function(c) { 
      builder._recursor.removeListener(c.builder);
      c.builder.disconnect(); 
    });
    delete builder._children[group._id];
  }

  return input;
};

function scale(name, scale) {
  var group = this;
  if(arguments.length === 2) return (group._scales[name] = scale, scale);
  while(scale == null) {
    scale = group._scales[name];
    group = group.mark ? group.mark.group : group._parent;
    if(!group) break;
  }
  return scale;
}

function buildGroup(input, group) {
  debug(input, ["building group", group._id]);

  group._scales = group._scales || {};    
  group.scale  = scale.bind(group);

  group.items = group.items || [];
  this._children[group._id] = this._children[group._id] || [];

  group.axes = group.axes || [];
  group.axisItems = group.axisItems || [];
}

function buildMarks(input, group) {
  debug(input, ["building marks", group._id]);
  var marks = this._def.marks,
      listeners = [],
      mark, from, inherit, i, len, m, b;

  for(i=0, len=marks.length; i<len; ++i) {
    mark = marks[i];
    from = mark.from || {};
    inherit = "vg_"+group.datum._id;
    group.items[i] = {group: group};
    b = (mark.type === C.GROUP) ? new GroupBuilder() : new Builder();
    b.init(this._model, mark, group.items[i], this, group._id, inherit);
    this._children[group._id].push({ 
      builder: b, 
      from: from.data || (from.mark ? ("vg_" + group._id + "_" + from.mark) : inherit), 
      type: C.MARK 
    });
  }
}

function buildAxes(input, group) {
  var axes = group.axes,
      axisItems = group.axisItems,
      builder = this;

  parseAxes(this._model, this._def.axes, axes, group);
  axes.forEach(function(a, i) {
    var scale = builder._def.axes[i].scale,
        def = a.def(),
        b = null;

    axisItems[i] = {group: group, axisDef: def};
    b = (def.type === C.GROUP) ? new GroupBuilder() : new Builder();
    b.init(builder._model, def, axisItems[i], builder)
      .dependency(C.SCALES, scale);
    builder._children[group._id].push({ builder: b, type: C.AXIS, scale: scale });
  });
}

module.exports = GroupBuilder;
},{"../dataflow/Collector":29,"../dataflow/Node":32,"../parse/axes":41,"../util/constants":94,"../util/debug":95,"./Builder":66,"./Scale":70,"datalib":16}],69:[function(require,module,exports){
function Item(mark) {
  this.mark = mark;
}

var prototype = Item.prototype;

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

module.exports = Item;
},{}],70:[function(require,module,exports){
(function (global){
var dl = require('datalib'),
    d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    Node = require('../dataflow/Node'),
    Aggregate = require('../transforms/Aggregate'),
    changeset = require('../dataflow/changeset'),
    debug = require('../util/debug'),
    config = require('../util/config'),
    C = require('../util/constants');

var GROUP_PROPERTY = {width: 1, height: 1};

function Scale(model, def, parent) {
  this._model   = model;
  this._def     = def;
  this._parent  = parent;
  this._updated = false;
  return Node.prototype.init.call(this, model.graph);
}

var proto = (Scale.prototype = new Node());

proto.evaluate = function(input) {
  var self = this,
      fn = function(group) { scale.call(self, group); };

  this._updated = false;
  input.add.forEach(fn);
  input.mod.forEach(fn);

  // Scales are at the end of an encoding pipeline, so they should forward a
  // reflow pulse. Thus, if multiple scales update in the parent group, we don't
  // reevaluate child marks multiple times. 
  if (this._updated) input.scales[this._def.name] = 1;
  return changeset.create(input, true);
};

// All of a scale's dependencies are registered during propagation as we parse
// dataRefs. So a scale must be responsible for connecting itself to dependents.
proto.dependency = function(type, deps) {
  if (arguments.length == 2) {
    deps = dl.array(deps);
    for(var i=0, len=deps.length; i<len; ++i) {
      this._graph[type == C.DATA ? C.DATA : C.SIGNAL](deps[i])
        .addListener(this._parent);
    }
  }

  return Node.prototype.dependency.call(this, type, deps);
};

function scale(group) {
  var name = this._def.name,
      prev = name + ":prev",
      s = instance.call(this, group.scale(name)),
      m = s.type===C.ORDINAL ? ordinal : quantitative,
      rng = range.call(this, group);

  m.call(this, s, rng, group);

  group.scale(name, s);
  group.scale(prev, group.scale(prev) || s);

  return s;
}

function instance(scale) {
  var type = this._def.type || C.LINEAR;
  if (!scale || type !== scale.type) {
    var ctor = config.scale[type] || d3.scale[type];
    if (!ctor) dl.error("Unrecognized scale type: " + type);
    (scale = ctor()).type = scale.type || type;
    scale.scaleName = this._def.name;
    scale._prev = {};
  }
  return scale;
}

function ordinal(scale, rng, group) {
  var def = this._def,
      prev = scale._prev,
      domain, sort, str, refs, dataDrivenRange = false;
  
  // range pre-processing for data-driven ranges
  if (dl.isObject(def.range) && !dl.isArray(def.range)) {
    dataDrivenRange = true;
    rng = dataRef.call(this, C.RANGE, def.range, scale, group);
  }
  
  // domain
  domain = dataRef.call(this, C.DOMAIN, def.domain, scale, group);
  if (domain && !dl.equal(prev.domain, domain)) {
    scale.domain(domain);
    prev.domain = domain;
    this._updated = true;
  } 

  // range
  if (dl.equal(prev.range, rng)) return;

  str = typeof rng[0] === 'string';
  if (str || rng.length > 2 || rng.length===1 || dataDrivenRange) {
    scale.range(rng); // color or shape values
  } else if (def.points) {
    scale.rangePoints(rng, def.padding||0);
  } else if (def.round || def.round===undefined) {
    scale.rangeRoundBands(rng, def.padding||0);
  } else {
    scale.rangeBands(rng, def.padding||0);
  }

  prev.range = rng;
  this._updated = true;
}

function quantitative(scale, rng, group) {
  var def = this._def,
      prev = scale._prev,
      domain, interval;

  // domain
  domain = (def.type === C.QUANTILE)
    ? dataRef.call(this, C.DOMAIN, def.domain, scale, group)
    : domainMinMax.call(this, scale, group);
  if (domain && !dl.equal(prev.domain, domain)) {
    scale.domain(domain);
    prev.domain = domain;
    this._updated = true;
  } 

  // range
  // vertical scales should flip by default, so use XOR here
  if (def.range === "height") rng = rng.reverse();
  if (dl.equal(prev.range, rng)) return;
  scale[def.round && scale.rangeRound ? "rangeRound" : "range"](rng);
  prev.range = rng;
  this._updated = true;

  // TODO: Support signals for these properties. Until then, only eval
  // them once.
  if (this._stamp > 0) return;
  if (def.exponent && def.type===C.POWER) scale.exponent(def.exponent);
  if (def.clamp) scale.clamp(true);
  if (def.nice) {
    if (def.type === C.TIME) {
      interval = d3.time[def.nice];
      if (!interval) dl.error("Unrecognized interval: " + interval);
      scale.nice(interval);
    } else {
      scale.nice();
    }
  }
}

function dataRef(which, def, scale, group) {
  if (def == null) { return []; } // JH-TODO: confirm with Arvind
  if (dl.isArray(def)) return def.map(signal.bind(this));

  var self = this, graph = this._graph,
      refs = def.fields || dl.array(def),
      uniques = scale.type === C.ORDINAL || scale.type === C.QUANTILE,
      ck = "_"+which,
      cache = scale[ck],
      cacheField = {ops: []},  // the field and measures in the aggregator
      sort = def.sort,
      i, rlen, j, flen, r, fields, from, data, keys;

  if (!cache) {
    cache = scale[ck] = new Aggregate(graph);
    cacheField.ops = [];
    cache.singleton(true);
    if (uniques && sort) cacheField.ops.push(sort.stat);
  }

  for(i=0, rlen=refs.length; i<rlen; ++i) {
    r = refs[i];
    from = r.data || "vg_"+group.datum._id;
    data = graph.data(from)
      .revises(true)
      .last();

    if (data.stamp <= this._stamp) continue;

    fields = dl.array(r.field).map(function(f) {
      if (f.group) return dl.accessor(f.group)(group.datum)
      return f; // String or {"signal"}
    });

    if (uniques) {
      cacheField.name = sort ? sort.field : "_id";
      cache.fields.set(cache, [cacheField]);
      for (j=0, flen=fields.length; j<flen; ++j) {
        cache.group_by.set(cache, fields[j])
          .evaluate(data);
      }
    } else {
      for (j=0, flen=fields.length; j<flen; ++j) {
        cacheField.name = fields[j];
        cacheField.ops  = [C.MIN, C.MAX];
        cache.fields.set(cache, [cacheField]) // Treat as flat datasource
          .evaluate(data);
      }
    }

    this.dependency(C.DATA, from);
    cache.dependency(C.SIGNALS).forEach(function(s) { self.dependency(C.SIGNALS, s) });
  }

  data = cache.data();
  if (uniques) {
    keys = dl.keys(data)
      .filter(function(k) { return data[k] != null; });

    if (sort) {
      sort = sort.order.signal ? graph.signalRef(sort.order.signal) : sort.order;
      sort = (sort == C.DESC ? "-" : "+") + "tpl." + cacheField.name;
      sort = dl.comparator(sort);
      keys = keys.map(function(k) { return { key: k, tpl: data[k].tpl }})
        .sort(sort)
        .map(function(k) { return k.key; });
    // } else {  // "First seen" order
    //   sort = dl.comparator("tpl._id");
    }

    return keys;
  } else {
    data = data[""]; // Unpack flat aggregation
    return (data === null) ? [] : [data[C.SINGLETON].min, data[C.SINGLETON].max];
  }
}

function signal(v) {
  var s = v.signal, ref;
  if (!s) return v;
  this.dependency(C.SIGNALS, (ref = dl.field(s))[0]);
  return this._graph.signalRef(ref);
}

function domainMinMax(scale, group) {
  var def = this._def,
      domain = [null, null], refs, z;

  if (def.domain !== undefined) {
    domain = (!dl.isObject(def.domain)) ? domain :
      dataRef.call(this, C.DOMAIN, def.domain, scale, group);
  }

  z = domain.length - 1;
  if (def.domainMin !== undefined) {
    if (dl.isObject(def.domainMin)) {
      if (def.domainMin.signal) {
        domain[0] = signal.call(this, def.domainMin);
      } else {
        domain[0] = dataRef.call(this, C.DOMAIN+C.MIN, def.domainMin, scale, group)[0];
      }
    } else {
      domain[0] = def.domainMin;
    }
  }
  if (def.domainMax !== undefined) {
    if (dl.isObject(def.domainMax)) {
      if (def.domainMax.signal) {
        domain[z] = signal.call(this, def.domainMax);
      } else {
        domain[z] = dataRef.call(this, C.DOMAIN+C.MAX, def.domainMax, scale, group)[1];
      }
    } else {
      domain[z] = def.domainMax;
    }
  }
  if (def.type !== C.LOG && def.type !== C.TIME && (def.zero || def.zero===undefined)) {
    domain[0] = Math.min(0, domain[0]);
    domain[z] = Math.max(0, domain[z]);
  }
  return domain;
}

function range(group) {
  var def = this._def,
      rng = [null, null];

  if (def.range !== undefined) {
    if (typeof def.range === 'string') {
      if (GROUP_PROPERTY[def.range]) {
        rng = [0, group[def.range]];
      } else if (config.range[def.range]) {
        rng = config.range[def.range];
      } else {
        dl.error("Unrecogized range: "+def.range);
        return rng;
      }
    } else if (dl.isArray(def.range)) {
      rng = def.range.map(signal.bind(this));
    } else if (dl.isObject(def.range)) {
      return null; // early exit
    } else {
      rng = [0, def.range];
    }
  }
  if (def.rangeMin !== undefined) {
    rng[0] = def.rangeMin.signal ? signal.call(this, def.rangeMin) : def.rangeMin;
  }
  if (def.rangeMax !== undefined) {
    rng[rng.length-1] = def.rangeMax.signal ? signal.call(this, def.rangeMax) : def.rangeMax;
  }
  
  if (def.reverse !== undefined) {
    var rev = def.reverse;
    if (dl.isObject(rev)) {
      rev = dl.accessor(rev.field)(group.datum);
    }
    if (rev) rng = rng.reverse();
  }
  
  return rng;
}

module.exports = Scale;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../dataflow/Node":32,"../dataflow/changeset":34,"../transforms/Aggregate":73,"../util/config":93,"../util/constants":94,"../util/debug":95,"datalib":16}],71:[function(require,module,exports){
var tuple = require('../dataflow/tuple'),
    calcBounds = require('../util/bounds'),
    C = require('../util/constants');

function Transition(duration, ease) {
  this.duration = duration || 500;
  this.ease = ease && d3.ease(ease) || d3.ease("cubic-in-out");
  this.updates = {next: null};
}

var prototype = Transition.prototype;

var skip = {
  "text": 1,
  "url":  1
};

prototype.interpolate = function(item, values, stamp) {
  var key, curr, next, interp, list = null;

  for (key in values) {
    curr = item[key];
    next = values[key];      
    if (curr !== next) {
      if (skip[key] || curr === undefined) {
        // skip interpolation for specific keys or undefined start values
        tuple.set(item, key, next);
      } else if (typeof curr === "number" && !isFinite(curr)) {
        // for NaN or infinite numeric values, skip to final value
        tuple.set(item, key, next);
      } else {
        // otherwise lookup interpolator
        interp = d3.interpolate(curr, next);
        interp.property = key;
        (list || (list=[])).push(interp);
      }
    }
  }

  if (list === null && item.status === C.EXIT) {
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
    if (curr.item.status === C.EXIT) curr.remove = true;
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
    calcBounds.item(item);

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
};

module.exports = Transition;
},{"../dataflow/tuple":35,"../util/bounds":92,"../util/constants":94}],72:[function(require,module,exports){
var dl = require('datalib'),
    config = require('../util/config'),
    tpl = require('../dataflow/tuple'),
    parseMark = require('../parse/mark');

function axs(model) {
  var scale,
      orient = config.axis.orient,
      offset = 0,
      titleOffset = config.axis.titleOffset,
      axisDef = {},
      layer = "front",
      grid = false,
      title = null,
      tickMajorSize = config.axis.tickSize,
      tickMinorSize = config.axis.tickSize,
      tickEndSize = config.axis.tickSize,
      tickPadding = config.axis.padding,
      tickValues = null,
      tickFormatString = null,
      tickFormat = null,
      tickSubdivide = 0,
      tickArguments = [config.axis.ticks],
      gridLineStyle = {},
      tickLabelStyle = {},
      majorTickStyle = {},
      minorTickStyle = {},
      titleStyle = {},
      domainStyle = {},
      m = { // Axis marks as references for updates
        gridLines: null,
        majorTicks: null,
        minorTicks: null,
        tickLabels: null,
        domain: null,
        title: null
      };

  var axis = {};

  function reset() {
    axisDef.type = null;
  };

  axis.def = function() {
    if(!axisDef.type) axis_def(scale);

    // tick format
    tickFormat = !tickFormatString ? null : ((scale.type === 'time')
      ? d3.time.format(tickFormatString)
      : d3.format(tickFormatString));

    // generate data
    // We don't _really_ need to model these as tuples as no further
    // data transformation is done. So we optimize for a high churn rate. 
    var injest = function(d) { return {data: d}; };
    var major = tickValues == null
      ? (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain())
      : tickValues;
    var minor = vg_axisSubdivide(scale, major, tickSubdivide).map(injest);
    major = major.map(injest);
    var fmt = tickFormat==null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : String) : tickFormat;
    major.forEach(function(d) { d.label = fmt(d.data); });
    var tdata = title ? [title].map(injest) : [];

    axisDef.marks[0].from = function() { return grid ? major : []; };
    axisDef.marks[1].from = function() { return major; };
    axisDef.marks[2].from = function() { return minor; };
    axisDef.marks[3].from = axisDef.marks[1].from;
    axisDef.marks[4].from = function() { return [1]; };
    axisDef.marks[5].from = function() { return tdata; };
    axisDef.offset = offset;
    axisDef.orient = orient;
    axisDef.layer = layer;
    return axisDef;
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
    if (!m.gridLines)  m.gridLines  = vg_axisTicks();
    if (!m.majorTicks) m.majorTicks = vg_axisTicks();
    if (!m.minorTicks) m.minorTicks = vg_axisTicks();
    if (!m.tickLabels) m.tickLabels = vg_axisTickLabels();
    if (!m.domain) m.domain = vg_axisDomain();
    if (!m.title)  m.title  = vg_axisTitle();
    m.gridLines.properties.enter.stroke = {value: config.axis.gridColor};

    // extend axis marks based on axis orientation
    vg_axisTicksExtend(orient, m.gridLines, oldScale, newScale, Infinity);
    vg_axisTicksExtend(orient, m.majorTicks, oldScale, newScale, tickMajorSize);
    vg_axisTicksExtend(orient, m.minorTicks, oldScale, newScale, tickMinorSize);
    vg_axisLabelExtend(orient, m.tickLabels, oldScale, newScale, tickMajorSize, tickPadding);

    vg_axisDomainExtend(orient, m.domain, range, tickEndSize);
    vg_axisTitleExtend(orient, m.title, range, titleOffset); // TODO get offset
    
    // add / override custom style properties
    dl.extend(m.gridLines.properties.update, gridLineStyle);
    dl.extend(m.majorTicks.properties.update, majorTickStyle);
    dl.extend(m.minorTicks.properties.update, minorTickStyle);
    dl.extend(m.tickLabels.properties.update, tickLabelStyle);
    dl.extend(m.domain.properties.update, domainStyle);
    dl.extend(m.title.properties.update, titleStyle);

    var marks = [m.gridLines, m.majorTicks, m.minorTicks, m.tickLabels, m.domain, m.title];
    dl.extend(axisDef, {
      type: "group",
      interactive: false,
      properties: { 
        enter: {
          encode: vg_axisUpdate,
          scales: [scale.scaleName],
          signals: [], data: []
        },
        update: {
          encode: vg_axisUpdate,
          scales: [scale.scaleName],
          signals: [], data: []
        }
      }
    });

    axisDef.marks = marks.map(function(m) { return parseMark(model, m); });
  };

  axis.scale = function(x) {
    if (!arguments.length) return scale;
    if (scale !== x) { scale = x; reset(); }
    return axis;
  };

  axis.orient = function(x) {
    if (!arguments.length) return orient;
    if (orient !== x) {
      orient = x in vg_axisOrients ? x + "" : config.axis.orient;
      reset();
    }
    return axis;
  };

  axis.title = function(x) {
    if (!arguments.length) return title;
    if (title !== x) { title = x; reset(); }
    return axis;
  };

  axis.ticks = function() {
    if (!arguments.length) return tickArguments;
    tickArguments = arguments;
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
    offset = dl.isObject(x) ? x : +x;
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
    dl.extend(labels.properties.enter, {
      x: oldScale,
      y: {value: size},
    });
    dl.extend(labels.properties.update, {
      x: newScale,
      y: {value: size},
      align: {value: "center"},
      baseline: {value: vg_axisBaseline[orient]}
    });
  } else {
    dl.extend(labels.properties.enter, {
      x: {value: size},
      y: oldScale,
    });
    dl.extend(labels.properties.update, {
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
    dl.extend(ticks.properties.enter, {
      x:  oldScale,
      y:  {value: 0},
      y2: size
    });
    dl.extend(ticks.properties.update, {
      x:  newScale,
      y:  {value: 0},
      y2: size
    });
    dl.extend(ticks.properties.exit, {
      x:  newScale,
    });        
  } else {
    dl.extend(ticks.properties.enter, {
      x:  {value: 0},
      x2: size,
      y:  oldScale
    });
    dl.extend(ticks.properties.update, {
      x:  {value: 0},
      x2: size,
      y:  newScale
    });
    dl.extend(ticks.properties.exit, {
      y:  newScale,
    });
  }
}

function vg_axisTitleExtend(orient, title, range, offset) {
  var mid = ~~((range[0] + range[1]) / 2),
      sign = (orient === "top" || orient === "left") ? -1 : 1;
  
  if (orient === "bottom" || orient === "top") {
    dl.extend(title.properties.update, {
      x: {value: mid},
      y: {value: sign*offset},
      angle: {value: 0}
    });
  } else {
    dl.extend(title.properties.update, {
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

function vg_axisUpdate(item, group, trans, db, signals, predicates) {
  var o = trans ? {} : item,
      offset = item.mark.def.offset,
      orient = item.mark.def.orient,
      width  = group.width,
      height = group.height; // TODO fallback to global w,h?

  if (dl.isObject(offset)) {
    offset = -group.scale(offset.scale)(offset.value);
  }

  switch (orient) {
    case "left":   { tpl.set(o, 'x', -offset); tpl.set(o, 'y', 0); break; }
    case "right":  { tpl.set(o, 'x', width + offset); tpl.set(o, 'y', 0); break; }
    case "bottom": { tpl.set(o, 'x', 0); tpl.set(o, 'y', height + offset); break; }
    case "top":    { tpl.set(o, 'x', 0); tpl.set(o, 'y', -offset); break; }
    default:       { tpl.set(o, 'x', 0); tpl.set(o, 'y', 0); }
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
        stroke: {value: config.axis.tickColor},
        strokeWidth: {value: config.axis.tickWidth},
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
        fill: {value: config.axis.tickLabelColor},
        font: {value: config.axis.tickLabelFont},
        fontSize: {value: config.axis.tickLabelFontSize},
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
        font: {value: config.axis.titleFont},
        fontSize: {value: config.axis.titleFontSize},
        fontWeight: {value: config.axis.titleFontWeight},
        fill: {value: config.axis.titleColor},
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
        stroke: {value: config.axis.axisColor},
        strokeWidth: {value: config.axis.axisWidth}
      },
      update: {}
    }
  };
}

module.exports = axs;
},{"../dataflow/tuple":35,"../parse/mark":46,"../util/config":93,"datalib":16}],73:[function(require,module,exports){
var dl = require('datalib'),
    Transform = require('./Transform'),
    GroupBy = require('./GroupBy'),
    tuple = require('../dataflow/tuple'), 
    changeset = require('../dataflow/changeset'), 
    meas = require('./measures'),
    debug = require('../util/debug'),
    C = require('../util/constants');

function Aggregate(graph) {
  GroupBy.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    group_by: {type: "array<field>"}
  });

  this._output = {
    "count":    "count",
    "avg":      "avg",
    "min":      "min",
    "max":      "max",
    "sum":      "sum",
    "mean":     "mean",
    "var":      "var",
    "stdev":    "stdev",
    "varp":     "varp",
    "stdevp":   "stdevp",
    "median":   "median"
  };

  // Aggregators parameter handled manually.
  this._fieldsDef   = null;
  this._Aggregators = null;
  this._singleton   = false;  // If true, all fields aggregated within a single monoid

  return this;
}

var proto = (Aggregate.prototype = new GroupBy());

proto.fields = {
  set: function(transform, fields) {
    var i, len, f, signals = {};
    for(i=0, len=fields.length; i<len; ++i) {
      f = fields[i];
      if(f.name.signal) signals[f.name.signal] = 1;
      dl.array(f.ops).forEach(function(o){ if(o.signal) signals[o.signal] = 1 });
    }

    transform._fieldsDef = fields;
    transform._Aggregators = null;
    transform.aggs();
    transform.dependency(C.SIGNALS, dl.keys(signals));
    return transform;
  }
};

proto.singleton = function(c) {
  if(!arguments.length) return this._singleton;
  this._singleton = c;
  return this;
};

proto.aggs = function() {
  var transform = this,
      graph = this._graph,
      fields = this._fieldsDef,
      aggs = this._Aggregators,
      f, i, k, name, ops, measures;

  if(aggs) return aggs;
  else aggs = this._Aggregators = []; 

  for (i = 0; i < fields.length; i++) {
    f = fields[i];
    if (f.ops.length === 0) continue;

    name = f.name.signal ? graph.signalRef(f.name.signal) : f.name;
    ops  = dl.array(f.ops.signal ? graph.signalRef(f.ops.signal) : f.ops);
    measures = ops.map(function(a) {
      a = a.signal ? graph.signalRef(a.signal) : a;
      return meas[a](name + '_' + transform._output[a]);
    });
    aggs.push({
      accessor: dl.accessor(name),
      field: this._singleton ? C.SINGLETON : name,
      measures: meas.create(measures)
    });
  }

  return aggs;
};

proto._reset = function(input, output) {
  this._Aggregators = null; // rebuild aggregators
  this.aggs();
  return GroupBy.prototype._reset.call(this, input, output);
};

proto._keys = function(x) {
  return this._gb.fields.length ? 
    GroupBy.prototype._keys.call(this, x) : {keys: [], key: ""};
};

proto._new_cell = function(x, k) {
  var cell = GroupBy.prototype._new_cell.call(this, x, k),
      aggs = this.aggs(),
      i = 0, len = aggs.length, 
      agg;

  for(; i<len; i++) {
    agg = aggs[i];
    cell[agg.field] = new agg.measures(cell, cell.tpl);
  }

  return cell;
};

proto._add = function(x) {
  var c = this._cell(x),
      aggs = this.aggs(),
      i = 0, len = aggs.length,
      agg;

  c.cnt++;
  for(; i<len; i++) {
    agg = aggs[i];
    c[agg.field].add(agg.accessor(x));
  }
  c.flg |= C.MOD_CELL;
};

proto._rem = function(x) {
  var c = this._cell(x),
      aggs = this.aggs(),
      i = 0, len = aggs.length,
      agg;

  c.cnt--;
  for(; i<len; i++) {
    agg = aggs[i];
    c[agg.field].rem(agg.accessor(x));
  }
  c.flg |= C.MOD_CELL;
};

proto.transform = function(input, reset) {
  debug(input, ["aggregate"]);

  this._gb = this.group_by.get(this._graph);

  var output = GroupBy.prototype.transform.call(this, input, reset),
      aggs = this.aggs(),
      len = aggs.length,
      i, k, c;

  for(k in this._cells) {
    c = this._cells[k];
    if(!c) continue;
    for(i=0; i<len; i++) {
      c[aggs[i].field].set();
    }
  }

  return output;
};

module.exports = Aggregate;
},{"../dataflow/changeset":34,"../dataflow/tuple":35,"../util/constants":94,"../util/debug":95,"./GroupBy":81,"./Transform":86,"./measures":91,"datalib":16}],74:[function(require,module,exports){
var dl = require('datalib'),
    Transform = require('./Transform'),
    tuple = require('../dataflow/tuple');

function Bin(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    field: {type: "field"},
    min: {type: "value"},
    max: {type: "value"},
    step: {type: "value"},
    maxbins: {type: "value", default: 20}
  });

  this._output = {"bin": "bin"};
  return this;
}

var proto = (Bin.prototype = new Transform());

proto.transform = function(input) {
  var transform = this,
      output = this._output.bin;
      
  var b = dl.bin({
    min: this.min.get(),
    max: this.max.get(),
    step: this.step.get(),
    maxbins: this.maxbins.get()
  });

  function update(d) {
    var v = transform.field.get().accessor(d);
    v = v == null ? null
      : b.start + b.step * ~~((v - b.start) / b.step);
    tuple.set(d, output, v, input.stamp);
  }
  input.add.forEach(update);
  input.mod.forEach(update);
  input.rem.forEach(update);

  return input;
};

module.exports = Bin;
},{"../dataflow/tuple":35,"./Transform":86,"datalib":16}],75:[function(require,module,exports){
var Transform = require('./Transform'),
    Collector = require('../dataflow/Collector'),
    debug = require('../util/debug'),
    tuple = require('../dataflow/tuple'),
    changeset = require('../dataflow/changeset');

function Cross(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    with: {type: "data"},
    diagonal: {type: "value", default: "true"}
  });

  this._output = {"left": "a", "right": "b"};
  this._collector = new Collector(graph);
  this._lastRem  = null; // Most recent stamp that rem occured. 
  this._lastWith = null; // Last time we crossed w/withds.
  this._ids   = {};
  this._cache = {};

  return this.router(true);
}

var proto = (Cross.prototype = new Transform());

// Each cached incoming tuple also has a stamp to track if we need to do
// lazy filtering of removed tuples.
function cache(x, t) {
  var c = this._cache[x._id] = this._cache[x._id] || {c: [], s: this._stamp};
  c.c.push(t);
}

function add(output, left, wdata, diag, x) {
  var data = left ? wdata : this._collector.data(), // Left tuples cross w/right.
      i = 0, len = data.length,
      prev  = x._prev !== undefined ? null : undefined, 
      t, y, id;

  for(; i<len; ++i) {
    y = data[i];
    id = left ? x._id+"_"+y._id : y._id+"_"+x._id;
    if(this._ids[id]) continue;
    if(x._id == y._id && !diag) continue;

    t = tuple.ingest({}, prev);
    t[this._output.left]  = left ? x : y;
    t[this._output.right] = left ? y : x;
    output.add.push(t);
    cache.call(this, x, t);
    cache.call(this, y, t);
    this._ids[id] = 1;
  }
}

function mod(output, left, x) {
  var cross = this,
      c = this._cache[x._id];

  if(this._lastRem > c.s) {  // Removed tuples haven't been filtered yet
    c.c = c.c.filter(function(y) {
      var t = y[cross._output[left ? "right" : "left"]];
      return cross._cache[t._id] !== null;
    });
    c.s = this._lastRem;
  }

  output.mod.push.apply(output.mod, c.c);
}

function rem(output, x) {
  output.rem.push.apply(output.rem, this._cache[x._id].c);
  this._cache[x._id] = null;
  this._lastRem = this._stamp;
}

function upFields(input, output) {
  if(input.add.length || input.rem.length) {
    output.fields[this._output.left]  = 1; 
    output.fields[this._output.right] = 1;
  }
}

proto.transform = function(input) {
  debug(input, ["crossing"]);

  // Materialize the current datasource. TODO: share collectors
  this._collector.evaluate(input);

  var w = this.with.get(this._graph),
      diag = this.diagonal.get(this._graph),
      selfCross = (!w.name),
      data = this._collector.data(),
      woutput = selfCross ? input : w.source.last(),
      wdata   = selfCross ? data : w.source.values(),
      output  = changeset.create(input),
      r = rem.bind(this, output); 

  input.rem.forEach(r);
  input.add.forEach(add.bind(this, output, true, wdata, diag));

  if(!selfCross && woutput.stamp > this._lastWith) {
    woutput.rem.forEach(r);
    woutput.add.forEach(add.bind(this, output, false, data, diag));
    woutput.mod.forEach(mod.bind(this, output, false));
    upFields.call(this, woutput, output);
    this._lastWith = woutput.stamp;
  }

  // Mods need to come after all removals have been run.
  input.mod.forEach(mod.bind(this, output, true));
  upFields.call(this, input, output);

  return output;
};

module.exports = Cross;
},{"../dataflow/Collector":29,"../dataflow/changeset":34,"../dataflow/tuple":35,"../util/debug":95,"./Transform":86}],76:[function(require,module,exports){
var Transform = require('./Transform'),
    GroupBy = require('./GroupBy'),
    tuple = require('../dataflow/tuple'), 
    changeset = require('../dataflow/changeset'),
    debug = require('../util/debug'),
    C = require('../util/constants');

function Facet(graph) {
  GroupBy.prototype.init.call(this, graph);
  Transform.addParameters(this, {keys: {type: "array<field>"} });

  this._pipeline = [];
  return this;
}

var proto = (Facet.prototype = new GroupBy());

proto.pipeline = function(pipeline) {
  if(!arguments.length) return this._pipeline;
  this._pipeline = pipeline;
  return this;
};

proto._reset = function(input, output) {
  var k, c;
  for(k in this._cells) {
    c = this._cells[k];
    if(!c) continue;
    output.rem.push(c.tpl);
    c.delete();
  }
  this._cells = {};
};

proto._new_tuple = function(x, k) {
  return tuple.ingest(k, null);
};

proto._new_cell = function(x, k) {
  // Rather than sharing the pipeline between all nodes,
  // give each cell its individual pipeline. This allows
  // dynamically added collectors to do the right thing
  // when wiring up the pipelines.
  var cell = GroupBy.prototype._new_cell.call(this, x, k),
      pipeline = this._pipeline.map(function(n) { return n.clone(); }),
      facet = this,
      t = cell.tpl;

  cell.ds = this._graph.data("vg_"+t._id, pipeline, t);
  cell.delete = function() {
    debug({}, ["deleting cell", k.key]);
    facet.removeListener(pipeline[0]);
    facet._graph.disconnect(pipeline);
  };

  this.addListener(pipeline[0]);

  return cell;
};

proto._add = function(x) {
  var cell = GroupBy.prototype._add.call(this, x);
  cell.ds._input.add.push(x);
  return cell;
};

proto._mod = function(x, reset) {
  var cell = GroupBy.prototype._mod.call(this, x, reset);
  if(!(cell.flg & C.ADD_CELL)) cell.ds._input.mod.push(x); // Propagate tuples
  cell.flg |= C.MOD_CELL;
  return cell;
};

proto._rem = function(x) {
  var cell = GroupBy.prototype._rem.call(this, x);
  cell.ds._input.rem.push(x);
  return cell;
};

proto.transform = function(input, reset) {
  debug(input, ["faceting"]);

  this._gb = this.keys.get(this._graph);

  var output = GroupBy.prototype.transform.call(this, input, reset),
      k, c;

  for(k in this._cells) {
    c = this._cells[k];
    if(c == null) continue;
    if(c.cnt === 0) {
      c.delete();
    } else {
      // propagate sort, signals, fields, etc.
      changeset.copy(input, c.ds._input);
    }
  }

  return output;
};

module.exports = Facet;
},{"../dataflow/changeset":34,"../dataflow/tuple":35,"../util/constants":94,"../util/debug":95,"./GroupBy":81,"./Transform":86}],77:[function(require,module,exports){
var Transform = require('./Transform'),
    changeset = require('../dataflow/changeset'), 
    expr = require('../parse/expr'),
    debug = require('../util/debug'),
    C = require('../util/constants');

function Filter(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {test: {type: "expr"} });

  this._skip = {};
  return this;
}

var proto = (Filter.prototype = new Transform());

function test(x) {
  return expr.eval(this._graph, this.test.get(this._graph), 
    x, null, null, null, this.dependency(C.SIGNALS));
};

proto.transform = function(input) {
  debug(input, ["filtering"]);
  var output = changeset.create(input),
      skip = this._skip,
      f = this;

  input.rem.forEach(function(x) {
    if (skip[x._id] !== 1) output.rem.push(x);
    else skip[x._id] = 0;
  });

  input.add.forEach(function(x) {
    if (test.call(f, x)) output.add.push(x);
    else skip[x._id] = 1;
  });

  input.mod.forEach(function(x) {
    var b = test.call(f, x),
        s = (skip[x._id] === 1);
    if (b && s) {
      skip[x._id] = 0;
      output.add.push(x);
    } else if (b && !s) {
      output.mod.push(x);
    } else if (!b && s) {
      // do nothing, keep skip true
    } else { // !b && !s
      output.rem.push(x);
      skip[x._id] = 1;
    }
  });

  return output;
};

module.exports = Filter;
},{"../dataflow/changeset":34,"../parse/expr":44,"../util/constants":94,"../util/debug":95,"./Transform":86}],78:[function(require,module,exports){
var Transform = require('./Transform'),
    debug = require('../util/debug'), 
    tuple = require('../dataflow/tuple'), 
    changeset = require('../dataflow/changeset');

function Fold(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    fields: {type: "array<field>"} 
  });

  this._output = {key: "key", value: "value"};
  this._cache = {};

  return this.router(true).revises(true);
}

var proto = (Fold.prototype = new Transform());

function rst(input, output) { 
  for(var id in this._cache) output.rem.push.apply(output.rem, this._cache[id]);
  this._cache = {};
};

function get_tuple(x, i, len) {
  var list = this._cache[x._id] || (this._cache[x._id] = Array(len));
  return list[i] || (list[i] = tuple.derive(x, x._prev));
};

function fn(data, fields, accessors, out, stamp) {
  var i = 0, dlen = data.length,
      j, flen = fields.length,
      d, t;

  for(; i<dlen; ++i) {
    d = data[i];
    for(j=0; j<flen; ++j) {
      t = get_tuple.call(this, d, j, flen);  
      tuple.set(t, this._output.key, fields[j]);
      tuple.set(t, this._output.value, accessors[j](d));
      out.push(t);
    }      
  }
};

proto.transform = function(input, reset) {
  debug(input, ["folding"]);

  var fold = this,
      on = this.fields.get(this._graph),
      fields = on.fields, accessors = on.accessors,
      output = changeset.create(input);

  if(reset) rst.call(this, input, output);

  fn.call(this, input.add, fields, accessors, output.add, input.stamp);
  fn.call(this, input.mod, fields, accessors, reset ? output.add : output.mod, input.stamp);
  input.rem.forEach(function(x) {
    output.rem.push.apply(output.rem, fold._cache[x._id]);
    fold._cache[x._id] = null;
  });

  // If we're only propagating values, don't mark key/value as updated.
  if(input.add.length || input.rem.length || 
    fields.some(function(f) { return !!input.fields[f]; }))
      output.fields[this._output.key] = 1, output.fields[this._output.value] = 1;
  return output;
};

module.exports = Fold;
},{"../dataflow/changeset":34,"../dataflow/tuple":35,"../util/debug":95,"./Transform":86}],79:[function(require,module,exports){
(function (global){
var Transform = require('./Transform'),
    Collector = require('../dataflow/Collector'),
    tuple = require('../dataflow/tuple'),
    changeset = require('../dataflow/changeset'),
    d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null);

function Force(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    size: {type: "array<value>", default: [500, 500]},
    links: {type: "data"},
    linkDistance: {type: "field", default: 20},
    linkStrength: {type: "field", default: 1},
    charge: {type: "field", default: 30},
    chargeDistance: {type: "field", default: Infinity},
    iterations: {type: "value", default: 500},
    friction: {type: "value", default: 0.9},
    theta: {type: "value", default: 0.8},
    gravity: {type: "value", default: 0.1},
    alpha: {type: "value", default: 0.1}
  });

  this._nodes = [];
  this._links = [];
  this._layout = d3.layout.force();

  this._output = {
    "x": "layout:x",
    "y": "layout:y",
    "source": "_source",
    "target": "_target"
  };

  return this;
}

var proto = (Force.prototype = new Transform());

function get(transform, name) {
  var v = transform[name].get(transform._graph);
  return v.accessor
    ? function(x) { return v.accessor(x.tuple); }
    : v.field;
}

proto.transform = function(nodeInput) {
  // get variables
  var g = this._graph,
      linkInput = this.links.get(g).source.last(),
      layout = this._layout,
      output = this._output,
      nodes = this._nodes,
      links = this._links,
      iter = this.iterations.get(g);

  // process added nodes
  nodeInput.add.forEach(function(n) {
    nodes.push({tuple: n});
  });

  // process added edges
  linkInput.add.forEach(function(l) {
    var link = {
      tuple: l,
      source: nodes[l.source],
      target: nodes[l.target]
    };
    tuple.set(l, output.source, link.source.tuple);
    tuple.set(l, output.target, link.target.tuple);
    links.push(link);
  });

  // TODO process "mod" of edge source or target?

  // configure layout
  layout
    .size(this.size.get(g))
    .linkDistance(get(this, "linkDistance"))
    .linkStrength(get(this, "linkStrength"))
    .charge(get(this, "charge"))
    .chargeDistance(get(this, "chargeDistance"))
    .friction(this.friction.get(g))
    .theta(this.theta.get(g))
    .gravity(this.gravity.get(g))
    .alpha(this.alpha.get(g))
    .nodes(nodes)
    .links(links);

  // run layout
  layout.start();
  for (var i=0; i<iter; ++i) {
    layout.tick();
  }
  layout.stop();

  // copy layout values to nodes
  nodes.forEach(function(n) {
    tuple.set(n.tuple, output.x, n.x);
    tuple.set(n.tuple, output.y, n.y);
  });

  // process removed nodes
  if (nodeInput.rem.length > 0) {
    var nodeIds = tuple.idMap(nodeInput.rem);
    this._nodes = nodes.filter(function(n) { return !nodeIds[n.tuple._id]; });
  }

  // process removed edges
  if (linkInput.rem.length > 0) {
    var linkIds = tuple.idMap(linkInput.rem);
    this._links = links.filter(function(l) { return !linkIds[l.tuple._id]; });
  }

  // return changeset
  nodeInput.fields[output.x] = 1;
  nodeInput.fields[output.y] = 1;
  return nodeInput;
};

module.exports = Force;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../dataflow/Collector":29,"../dataflow/changeset":34,"../dataflow/tuple":35,"./Transform":86}],80:[function(require,module,exports){
var Transform = require('./Transform'),
    tuple = require('../dataflow/tuple'), 
    expression = require('../parse/expr'),
    debug = require('../util/debug'),
    C = require('../util/constants');

function Formula(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    field: {type: "value"},
    expr:  {type: "expr"}
  });

  return this;
}

var proto = (Formula.prototype = new Transform());

proto.transform = function(input) {
  debug(input, ["formulating"]);
  var t = this, 
      g = this._graph,
      field = this.field.get(g),
      expr = this.expr.get(g),
      deps = this.dependency(C.SIGNALS);
  
  function set(x) {
    var val = expression.eval(g, expr, x, null, null, null, deps);
    tuple.set(x, field, val);
  }

  input.add.forEach(set);
  
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
  }

  input.fields[field] = 1;
  return input;
};

module.exports = Formula;
},{"../dataflow/tuple":35,"../parse/expr":44,"../util/constants":94,"../util/debug":95,"./Transform":86}],81:[function(require,module,exports){
var Transform = require('./Transform'),
    tuple = require('../dataflow/tuple'),
    changeset = require('../dataflow/changeset'),
    C = require('../util/constants');

function GroupBy(graph) {
  if(graph) this.init(graph);
  return this;
}

var proto = (GroupBy.prototype = new Transform());

proto.init = function(graph) {
  this._gb = null; // fields+accessors to groupby fields
  this._cells = {};
  return Transform.prototype.init.call(this, graph)
    .router(true).revises(true);
};

proto.data = function() { return this._cells; };

proto._reset = function(input, output) {
  var k, c;
  for(k in this._cells) {
    if(!(c = this._cells[k])) continue;
    output.rem.push(c.tpl);
  }
  this._cells = {};
};

proto._keys = function(x) {
  var acc = this._gb.accessors || [this._gb.accessor];
  var keys = acc.reduce(function(g, f) {
    return ((v = f(x)) !== undefined) ? (g.push(v), g) : g;
  }, []), k = keys.join("|"), v;
  return keys.length > 0 ? {keys: keys, key: k} : undefined;
};

proto._cell = function(x) {
  var k = this._keys(x);
  return this._cells[k.key] || (this._cells[k.key] = this._new_cell(x, k));
};

proto._new_cell = function(x, k) {
  return {
    cnt: 0,
    tpl: this._new_tuple(x, k),
    flg: C.ADD_CELL
  };
};

proto._new_tuple = function(x, k) {
  var gb = this._gb,
      fields = gb.fields || [gb.field],
      acc = gb.accessors || [gb.accessor],
      t = {}, i, len;

  for(i=0, len=fields.length; i<len; ++i) {
    t[fields[i]] = acc[i](x);
  } 

  return tuple.ingest(t, null);
};

proto._add = function(x) {
  var cell = this._cell(x);
  cell.cnt += 1;
  cell.flg |= C.MOD_CELL;
  return cell;
};

proto._rem = function(x) {
  var cell = this._cell(x);
  cell.cnt -= 1;
  cell.flg |= C.MOD_CELL;
  return cell;
};

proto._mod = function(x, reset) {
  if(x._prev && x._prev !== C.SENTINEL && this._keys(x._prev) !== undefined) {
    this._rem(x._prev);
    return this._add(x);
  } else if(reset) { // Signal change triggered reflow
    return this._add(x);
  }
  return this._cell(x);
};

proto.transform = function(input, reset) {
  var groupBy = this,
      output = changeset.create(input),
      k, c, f, t;

  if(reset) this._reset(input, output);

  input.add.forEach(function(x) { groupBy._add(x); });
  input.mod.forEach(function(x) { groupBy._mod(x, reset); });
  input.rem.forEach(function(x) {
    if(x._prev && x._prev !== C.SENTINEL && groupBy._keys(x._prev) !== undefined) {
      groupBy._rem(x._prev);
    } else {
      groupBy._rem(x);
    }
  });

  for(k in this._cells) {
    c = this._cells[k];
    if(!c) continue;
    f = c.flg;
    t = c.tpl;

    if(c.cnt === 0) {
      if(f === C.MOD_CELL) output.rem.push(t);
      this._cells[k] = null;
    } else if(f & C.ADD_CELL) {
      output.add.push(t);
    } else if(f & C.MOD_CELL) {
      output.mod.push(t);
    }
    c.flg = 0;
  }

  return output;
};

module.exports = GroupBy;
},{"../dataflow/changeset":34,"../dataflow/tuple":35,"../util/constants":94,"./Transform":86}],82:[function(require,module,exports){
var Transform = require('./Transform'),
    tuple = require('../dataflow/tuple');

function LinkPath(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    source:  {type: "field", default: "_source"},
    target:  {type: "field", default: "_target"},
    x:       {type: "field", default: "layout:x"},
    y:       {type: "field", default: "layout:y"},
    tension: {type: "value", default: 0.2},
    shape:   {type: "value", default: "line"}
  });

  this._output = {"path": "link:path"};
  return this;
}

var proto = (LinkPath.prototype = new Transform());

function line(d, source, target, x, y, tension) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t);
  return "M" + sx + "," + sy
       + "L" + tx + "," + ty;
}

function curve(d, source, target, x, y, tension) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t),
      dx = tx - sx,
      dy = ty - sy,
      ix = tension * (dx + dy),
      iy = tension * (dy - dx);
  return "M" + sx + "," + sy
       + "C" + (sx+ix) + "," + (sy+iy)
       + " " + (tx+iy) + "," + (ty-ix)
       + " " + tx + "," + ty;
}

function diagonalX(d, source, target, x, y, tension) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t),
      m = (sx + tx) / 2;
  return "M" + sx + "," + sy
       + "C" + m  + "," + sy
       + " " + m  + "," + ty
       + " " + tx + "," + ty;
}

function diagonalY(d, source, target, x, y, tension) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t),
      m = (sy + ty) / 2;
  return "M" + sx + "," + sy
       + "C" + sx + "," + m
       + " " + tx + "," + m
       + " " + tx + "," + ty;
}

var shapes = {
  line:      line,
  curve:     curve,
  diagonal:  diagonalX,
  diagonalX: diagonalX,
  diagonalY: diagonalY
};

proto.transform = function(input) {
  var g = this._graph,
      output = this._output,
      shape = shapes[this.shape.get(g)] || shapes.line,
      source = this.source.get(g).accessor,
      target = this.target.get(g).accessor,
      x = this.x.get(g).accessor,
      y = this.y.get(g).accessor,
      tension = this.tension.get(g);
  
  function set(t) {
    var path = shape(t, source, target, x, y, tension)
    tuple.set(t, output.path, path);
  }

  input.add.forEach(set);
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
  }

  input.fields[output.path] = 1;
  return input;
};

module.exports = LinkPath;
},{"../dataflow/tuple":35,"./Transform":86}],83:[function(require,module,exports){
var dl = require('datalib'),
    expr = require('../parse/expr'),
    C = require('../util/constants');

var arrayType = /array/i,
    dataType  = /data/i,
    fieldType = /field/i,
    exprType  = /expr/i;

function Parameter(name, type) {
  this._name = name;
  this._type = type;

  // If parameter is defined w/signals, it must be resolved
  // on every pulse.
  this._value = [];
  this._accessors = [];
  this._resolution = false;
  this._signals = {};
}

var proto = Parameter.prototype;

proto._get = function() {
  var isArray = arrayType.test(this._type),
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type);

  if (isData) {
    return isArray ? { names: this._value, sources: this._accessors } :
      { name: this._value[0], source: this._accessors[0] };
  } else if (isField) {
    return isArray ? { fields: this._value, accessors: this._accessors } :
      { field: this._value[0], accessor: this._accessors[0] };
  } else {
    return isArray ? this._value : this._value[0];
  }
};

proto.get = function(graph) {
  var isData  = dataType.test(this._type),
      isField = fieldType.test(this._type),
      s, idx, val;

  // If we don't require resolution, return the value immediately.
  if (!this._resolution) return this._get();

  if (isData) {
    this._accessors = this._value.map(function(v) { return graph.data(v); });
    return this._get(); // TODO: support signal as dataTypes
  }

  for(s in this._signals) {
    idx  = this._signals[s];
    val  = graph.signalRef(s);

    if (isField) {
      this._accessors[idx] = this._value[idx] != val ? 
        dl.accessor(val) : this._accessors[idx];
    }

    this._value[idx] = val;
  }

  return this._get();
};

proto.set = function(transform, value) {
  var param = this, 
      isExpr = exprType.test(this._type),
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type);

  this._value = dl.array(value).map(function(v, i) {
    if (dl.isString(v)) {
      if (isExpr) {
        var e = expr(v);
        transform.dependency(C.FIELDS,  e.fields);
        transform.dependency(C.SIGNALS, e.signals);
        return e.fn;
      } else if (isField) {  // Backwards compatibility
        param._accessors[i] = dl.accessor(v);
        transform.dependency(C.FIELDS, v);
      } else if (isData) {
        param._resolution = true;
        transform.dependency(C.DATA, v);
      }
      return v;
    } else if (v.value !== undefined) {
      return v.value;
    } else if (v.field !== undefined) {
      param._accessors[i] = dl.accessor(v.field);
      transform.dependency(C.FIELDS, v.field);
      return v.field;
    } else if (v.signal !== undefined) {
      param._resolution = true;
      param._signals[v.signal] = i;
      transform.dependency(C.SIGNALS, v.signal);
      return v.signal;
    }

    return v;
  });

  return transform;
};

module.exports = Parameter;
},{"../parse/expr":44,"../util/constants":94,"datalib":16}],84:[function(require,module,exports){
var dl = require('datalib'),
    Transform = require('./Transform'),
    expr = require('../parse/expr'),
    debug = require('../util/debug');

function Sort(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {by: {type: "array<field>"} });
  return this.router(true);
}

var proto = (Sort.prototype = new Transform());

proto.transform = function(input) {
  debug(input, ["sorting"]);

  if(input.add.length || input.mod.length || input.rem.length) {
    input.sort = dl.comparator(this.by.get(this._graph).fields);
  }

  return input;
};

module.exports = Sort;
},{"../parse/expr":44,"../util/debug":95,"./Transform":86,"datalib":16}],85:[function(require,module,exports){
var dl = require('datalib'),
    Transform = require('./Transform'),
    Collector = require('../dataflow/Collector'),
    tuple = require('../dataflow/tuple'),
    changeset = require('../dataflow/changeset');

function Stack(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    groupby: {type: "array<field>"},
    sortby: {type: "array<field>"},
    value: {type: "field"},
    offset: {type: "value", default: "zero"}
  });

  this._output = {
    "start": "layout:start",
    "stop":  "layout:stop",
    "mid":   "layout:mid"
  };
  this._collector = new Collector(graph);

  return this;
}

var proto = (Stack.prototype = new Transform());

proto.transform = function(input) {
  // Materialize the current datasource. TODO: share collectors
  this._collector.evaluate(input);
  var data = this._collector.data();

  var g = this._graph,
      groupby = this.groupby.get(g).accessors,
      sortby = dl.comparator(this.sortby.get(g).fields),
      value = this.value.get(g).accessor,
      offset = this.offset.get(g),
      output = this._output;

  // partition, sum, and sort the stack groups
  var groups = partition(data, groupby, sortby, value);

  // compute stack layouts per group
  for (var i=0, max=groups.max; i<groups.length; ++i) {
    var group = groups[i],
        sum = group.sum,
        off = offset==="center" ? (max - sum)/2 : 0,
        scale = offset==="normalize" ? (1/sum) : 1,
        i, x, a, b = off, v = 0;

    // set stack coordinates for each datum in group
    for (j=0; j<group.length; ++j) {
      x = group[j];
      a = b; // use previous value for start point
      v += value(x);
      b = scale * v + off; // compute end point
      tuple.set(x, output.start, a);
      tuple.set(x, output.stop, b);
      tuple.set(x, output.mid, 0.5 * (a + b));
    }
  }

  input.fields[output.start] = 1;
  input.fields[output.stop] = 1;
  input.fields[output.mid] = 1;
  return input;
};

function partition(data, groupby, sortby, value) {
  var groups = [],
      map, i, x, k, g, s, max;

  // partition data points into stack groups
  if (groupby == null) {
    groups.push(data.slice());
  } else {
    for (map={}, i=0; i<data.length; ++i) {
      x = data[i];
      k = (groupby.map(function(f) { return f(x); }));
      g = map[k] || (groups.push(map[k] = []), map[k]);
      g.push(x);
    }
  }

  // compute sums of groups, sort groups as needed
  for (k=0, max=0; k<groups.length; ++k) {
    g = groups[k];
    for (i=0, s=0; i<g.length; ++i) {
      s += value(g[i]);
    }
    g.sum = s;
    if (s > max) max = s;
    if (sortby != null) g.sort(sortby);
  }
  groups.max = max;

  return groups;
}

module.exports = Stack;
},{"../dataflow/Collector":29,"../dataflow/changeset":34,"../dataflow/tuple":35,"./Transform":86,"datalib":16}],86:[function(require,module,exports){
var Node = require('../dataflow/Node'),
    Parameter = require('./Parameter'),
    C = require('../util/constants');

function Transform(graph) {
  if(graph) Node.prototype.init.call(this, graph);
  return this;
}

Transform.addParameters = function(proto, params) {
  var p;
  for (var name in params) {
    p = params[name];
    proto[name] = new Parameter(name, p.type);
    if(p.default) proto[name].set(proto, p.default);
  }
  proto._parameters = params;
};

var proto = (Transform.prototype = new Node());

proto.clone = function() {
  var n = Node.prototype.clone.call(this);
  n.transform = this.transform;
  n._parameters = this._parameters;
  for(var k in this) { 
    if(n[k]) continue;
    n[k] = this[k]; 
  }
  return n;
};

proto.transform = function(input, reset) { return input; };
proto.evaluate = function(input) {
  // Many transforms store caches that must be invalidated if
  // a signal value has changed. 
  var reset = this._stamp < input.stamp && this.dependency(C.SIGNALS).some(function(s) { 
    return !!input.signals[s] 
  });

  return this.transform(input, reset);
};

proto.output = function(map) {
  for (var key in this._output) {
    if (map[key] !== undefined) {
      this._output[key] = map[key];
    }
  }
  return this;
};

module.exports = Transform;
},{"../dataflow/Node":32,"../util/constants":94,"./Parameter":83}],87:[function(require,module,exports){
(function (global){
var dl = require('datalib'),
    Transform = require('./Transform'),
    Collector = require('../dataflow/Collector'),
    tuple = require('../dataflow/tuple'),
    d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null);

function Treemap(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    // hierarchy parameters
    sort: {type: "array<field>", default: ["-value"]},
    children: {type: "field", default: "children"},
    value: {type: "field", default: "value"},
    // treemap parameters
    size: {type: "array<value>", default: [500, 500]},
    round: {type: "value", default: true},
    sticky: {type: "value", default: false},
    ratio: {type: "value", default: 0.5 * (1 + Math.sqrt(5))},
    padding: {type: "value", default: null},
    mode: {type: "value", default: "squarify"}
  });

  this._layout = d3.layout.treemap();

  this._output = {
    "x":      "layout:x",
    "y":      "layout:y",
    "width":  "layout:width",
    "height": "layout:height"
  };
  this._collector = new Collector(graph);

  return this;
}

var proto = (Treemap.prototype = new Transform());

proto.transform = function(input) {
  // Materialize the current datasource. TODO: share collectors
  this._collector.evaluate(input);
  var data = this._collector.data();

  // get variables
  var g = this._graph,
      layout = this._layout,
      output = this._output;

  // configure layout
  layout
    .sort(dl.comparator(this.sort.get(g).fields))
    .children(this.children.get(g).accessor)
    .value(this.value.get(g).accessor)
    .size(this.size.get(g))
    .round(this.round.get(g))
    .sticky(this.sticky.get(g))
    .ratio(this.ratio.get(g))
    .padding(this.padding.get(g))
    .mode(this.mode.get(g))
    .nodes(data[0]);

  // copy layout values to nodes
  data.forEach(function(n) {
    tuple.set(n, output.x, n.x);
    tuple.set(n, output.y, n.y);
    tuple.set(n, output.width, n.dx);
    tuple.set(n, output.height, n.dy);
  });

  // return changeset
  input.fields[output.x] = 1;
  input.fields[output.y] = 1;
  input.fields[output.width] = 1;
  input.fields[output.height] = 1;
  return input;
};

module.exports = Treemap;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../dataflow/Collector":29,"../dataflow/tuple":35,"./Transform":86,"datalib":16}],88:[function(require,module,exports){
var Transform = require('./Transform'),
    GroupBy = require('./GroupBy'),
    tuple = require('../dataflow/tuple'),
    debug = require('../util/debug');

function Unique(graph) {
  GroupBy.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    field: {type: "field"},
    as: {type: "value"}
  });

  return this;
}

var proto = (Unique.prototype = new GroupBy());

proto._new_tuple = function(x) {
  var o  = {},
      on = this.field.get(this._graph),
      as = this.as.get(this._graph);

  o[as] = on.accessor(x);
  return tuple.ingest(o, null);
};

proto.transform = function(input, reset) {
  debug(input, ["uniques"]);
  this._gb = this.field.get(this._graph);
  return GroupBy.prototype.transform.call(this, input, reset);
};

module.exports = Unique;
},{"../dataflow/tuple":35,"../util/debug":95,"./GroupBy":81,"./Transform":86}],89:[function(require,module,exports){
var dl = require('datalib'),
    Transform = require('./Transform'),
    Collector = require('../dataflow/Collector'),
    debug = require('../util/debug');

function Zip(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    with: {type: "data"},
    as:  {type: "value"},
    key: {type: "field", default: "data"},
    withKey: {type: "field", default: null},
    default: {type: "value"}
  });

  this._map = {};
  this._collector = new Collector(graph);
  this._lastJoin = 0;

  return this.revises(true);
}

var proto = (Zip.prototype = new Transform());

function mp(k) {
  return this._map[k] || (this._map[k] = []);
};

proto.transform = function(input) {
  var w = this.with.get(this._graph),
      wds = w.source,
      woutput = wds.last(),
      wdata = wds.values(),
      key = this.key.get(this._graph),
      withKey = this.withKey.get(this._graph),
      as = this.as.get(this._graph),
      dflt = this.default.get(this._graph),
      map = mp.bind(this),
      rem = {};

  debug(input, ["zipping", w.name]);

  if(withKey.field) {
    if(woutput && woutput.stamp > this._lastJoin) {
      woutput.rem.forEach(function(x) {
        var m = map(withKey.accessor(x));
        if(m[0]) m[0].forEach(function(d) { d[as] = dflt });
        m[1] = null;
      });

      woutput.add.forEach(function(x) { 
        var m = map(withKey.accessor(x));
        if(m[0]) m[0].forEach(function(d) { d[as] = x });
        m[1] = x;
      });
      
      // Only process woutput.mod tuples if the join key has changed.
      // Other field updates will auto-propagate via prototype.
      if(woutput.fields[withKey.field]) {
        woutput.mod.forEach(function(x) {
          var prev;
          if(!x._prev || (prev = withKey.accessor(x._prev)) === undefined) return;
          var prevm = map(prev);
          if(prevm[0]) prevm[0].forEach(function(d) { d[as] = dflt });
          prevm[1] = null;

          var m = map(withKey.accessor(x));
          if(m[0]) m[0].forEach(function(d) { d[as] = x });
          m[1] = x;
        });
      }

      this._lastJoin = woutput.stamp;
    }
  
    input.add.forEach(function(x) {
      var m = map(key.accessor(x));
      x[as] = m[1] || dflt;
      (m[0]=m[0]||[]).push(x);
    });

    input.rem.forEach(function(x) { 
      var k = key.accessor(x);
      (rem[k]=rem[k]||{})[x._id] = 1;
    });

    if(input.fields[key.field]) {
      input.mod.forEach(function(x) {
        var prev;
        if(!x._prev || (prev = key.accessor(x._prev)) === undefined) return;

        var m = map(key.accessor(x));
        x[as] = m[1] || dflt;
        (m[0]=m[0]||[]).push(x);
        (rem[prev]=rem[prev]||{})[x._id] = 1;
      });
    }

    dl.keys(rem).forEach(function(k) { 
      var m = map(k);
      if(!m[0]) return;
      m[0] = m[0].filter(function(x) { return rem[k][x._id] !== 1 });
    });
  } else {
    // We only need to run a non-key-join again if we've got any add/rem
    // on input or woutput
    if(input.add.length == 0 && input.rem.length == 0 && 
        woutput.add.length == 0 && woutput.rem.length == 0) return input;

    // If we don't have a key-join, then we need to materialize both
    // data sources to iterate through them. 
    this._collector.evaluate(input);

    var data = this._collector.data(), 
        wlen = wdata.length, i;

    for(i = 0; i < data.length; i++) { data[i][as] = wdata[i%wlen]; }
  }

  input.fields[as] = 1;
  return input;
};

module.exports = Zip;
},{"../dataflow/Collector":29,"../util/debug":95,"./Transform":86,"datalib":16}],90:[function(require,module,exports){
module.exports = {
  aggregate:  require('./Aggregate'),
  bin:        require('./Bin'),
  cross:      require('./Cross'),
  linkpath:   require('./LinkPath'),
  facet:      require('./Facet'),
  filter:     require('./Filter'),
  fold:       require('./Fold'),
  force:      require('./Force'),
  formula:    require('./Formula'),
  sort:       require('./Sort'),
  stack:      require('./Stack'),
  treemap:    require('./Treemap'),
  unique:     require('./Unique'),
  zip:        require('./Zip')
};
},{"./Aggregate":73,"./Bin":74,"./Cross":75,"./Facet":76,"./Filter":77,"./Fold":78,"./Force":79,"./Formula":80,"./LinkPath":82,"./Sort":84,"./Stack":85,"./Treemap":87,"./Unique":88,"./Zip":89}],91:[function(require,module,exports){
var dl = require('datalib'),
    tuple = require('../dataflow/tuple'),
    quickselect = require('../util/quickselect'),
    C = require('../util/constants');

var types = {
  "count": measure({
    name: "count",
    init: "",
    add:  "",
    rem:  "",
    set:  "this.cell.cnt"
  }),
  "_counts": measure({
    name: "_counts",
    init: "this.cnts = {};",
    add:  "this.cnts[v] = ++this.cnts[v] || 1;",
    rem:  "this.cnts[v] = --this.cnts[v] < 0 ? 0 : this.cnts[v];",
    set:  "",
    req:  ["count"]
  }),
  "sum": measure({
    name: "sum",
    init: "this.sum = 0;",
    add:  "this.sum += v;",
    rem:  "this.sum -= v;",
    set:  "this.sum"
  }),
  "avg": measure({
    name: "avg",
    init: "this.avg = 0;",
    add:  "var d = v - this.avg; this.avg += d / this.cell.cnt;",
    rem:  "var d = v - this.avg; this.avg -= d / this.cell.cnt;",
    set:  "this.avg",
    req:  ["count"], idx: 1
  }),
  "var": measure({
    name: "var",
    init: "this.dev = 0;",
    add:  "this.dev += d * (v - this.avg);",
    rem:  "this.dev -= d * (v - this.avg);",
    set:  "this.dev / (this.cell.cnt-1)",
    req:  ["avg"], idx: 2
  }),
  "varp": measure({
    name: "varp",
    init: "",
    add:  "",
    rem:  "",
    set:  "this.dev / this.cell.cnt",
    req:  ["var"], idx: 3
  }),
  "stdev": measure({
    name: "stdev",
    init: "",
    add:  "",
    rem:  "",
    set:  "Math.sqrt(this.dev / (this.cell.cnt-1))",
    req:  ["var"], idx: 4
  }),
  "stdevp": measure({
    name: "stdevp",
    init: "",
    add:  "",
    rem:  "",
    set:  "Math.sqrt(this.dev / this.cell.cnt)",
    req:  ["var"], idx: 5
  }),
  "min": measure({
    name: "min",
    init: "this.min = +Infinity;",
    add:  "this.min = v < this.min ? v : this.min;",
    rem:  "var self = this; this.min = v == this.min " +
          "? this.keys(this.cnts).reduce(function(m, v) { " +
          "   return self.cnts[(v = +v)] > 0 && v < m ? v : m }, +Infinity) " + 
          ": this.min;",
    set:  "this.min",
    req: ["_counts"], idx: 6
  }),
  "max": measure({
    name: "max",
    init: "this.max = -Infinity;",
    add:  "this.max = v > this.max ? v : this.max;",
    rem:  "var self = this; this.max = v == this.max " +
          "? this.keys(this.cnts).reduce(function(m, v) { " +
          "   return self.cnts[(v = +v)] > 0 && v > m ? v : m }, -Infinity) " + 
          ": this.max;",
    set:  "this.max",
    req: ["_counts"], idx: 7
  }),
  "median": measure({
    name: "median",
    init: "this.vals = []; ",
    add:  "if(this.vals) this.vals.push(v); ",
    rem:  "this.vals = null;",
    set:  "this.cell.cnt % 2 ? this.sel(~~(this.cell.cnt/2), this.vals, this.cnts) : "+
          "0.5 * (this.sel(~~(this.cell.cnt/2)-1, this.vals, this.cnts) + this.sel(~~(this.cell.cnt/2), this.vals, this.cnts))",
    req: ["_counts"], idx: 8
  })
};

function measure(base) {
  return function(out) {
    var m = Object.create(base);
    m.out = out || base.name;
    if (!m.idx) m.idx = 0;
    return m;
  };
}

function resolve(agg) {
  function collect(m, a) {
    (a.req || []).forEach(function(r) {
      if (!m[r]) collect(m, m[r] = types[r]());
    });
    return m;
  }
  var map = agg.reduce(collect,
    agg.reduce(function(m, a) { return (m[a.name] = a, m); }, {}));
  var all = [];
  for (var k in map) all.push(map[k]);
  all.sort(function(a,b) { return a.idx - b.idx; });
  return all;
}

function compile(agg) {
  var all = resolve(agg),
      ctr = "this.tpl = t; this.cell = c;",
      add = "",
      rem = "",
      set = "var t = this.tpl;";

  all.forEach(function(a) { ctr += a.init; add += a.add; rem += a.rem; });
  agg.forEach(function(a) { set += "this.tuple.set(t,'"+a.out+"',"+a.set+");"; });
  set += "return t;";

  ctr = Function("c", "t", ctr);
  ctr.prototype.add = Function("v", add);
  ctr.prototype.rem = Function("v", rem);
  ctr.prototype.set = Function("stamp", set);
  ctr.prototype.mod = mod;
  ctr.prototype.keys = dl.keys;
  ctr.prototype.sel = quickselect;
  ctr.prototype.tuple = tuple;
  return ctr;
}

function mod(v_new, v_old) {
  if (v_old === undefined || v_old === v_new) return;
  this.rem(v_old);
  this.add(v_new);
};

types.create   = compile;
module.exports = types;
},{"../dataflow/tuple":35,"../util/constants":94,"../util/quickselect":96,"datalib":16}],92:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    Bounds = require('../core/Bounds'),
    canvas = require('../render/canvas/path'),
    config = require('./config');

var parse = canvas.parse,
    boundPath = canvas.bounds,
    areaPath = canvas.area,
    linePath = canvas.line,
    halfpi = Math.PI / 2,
    sqrt3 = Math.sqrt(3),
    tan30 = Math.tan(30 * Math.PI / 180),
    gfx = null;

function fontString(o) {
  return (o.fontStyle ? o.fontStyle + " " : "")
    + (o.fontVariant ? o.fontVariant + " " : "")
    + (o.fontWeight ? o.fontWeight + " " : "")
    + (o.fontSize != null ? o.fontSize : config.render.fontSize) + "px "
    + (o.font || config.render.font);
}

function context() {
  // TODO: how to check if nodeJS in requireJS?
  return gfx || (gfx = (/*config.isNode
    ? new (require("canvas"))(1,1)
    : */d3.select("body").append("canvas")
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
      h = o.fontSize || config.render.fontSize,
      a = o.align,
      b = o.baseline,
      r = o.radius || 0,
      g = context(), w, t;

  g.font = fontString(o);
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
  if (!item.bounds_prev) item['bounds:prev'] = new Bounds();
  var b = item.bounds, pb = item['bounds:prev'];
  if (b) pb.clear().union(b);
  item.bounds = func(item, b ? b.clear() : new Bounds(), opt);
  if (!b) pb.clear().union(item.bounds);
  return item.bounds;
}

function markBounds(mark, bounds, opt) {
  bounds = bounds || mark.bounds && mark.bounds.clear() || new Bounds();
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

module.exports = {
  mark:  markBounds,
  item:  itemBounds,
  text:  text,
  group: group
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../core/Bounds":26,"../render/canvas/path":60,"./config":93}],93:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    config = {};

config.debug = false;

config.load = {
  // base url for loading external data files
  // used only for server-side operation
  baseURL: "",
  // Allows domain restriction when using data loading via XHR.
  // To enable, set it to a list of allowed domains
  // e.g., ['wikipedia.org', 'eff.org']
  domainWhiteList: false
};

// version and namepsaces for exported svg
config.svgNamespace =
  'version="1.1" xmlns="http://www.w3.org/2000/svg" ' +
  'xmlns:xlink="http://www.w3.org/1999/xlink"';

// inset padding for automatic padding calculation
config.autopadInset = 5;

// extensible scale lookup table
// all d3.scale.* instances also supported
config.scale = {
  time: d3.time.scale,
  utc:  d3.time.scale.utc
};

// default rendering settings
config.render = {
  lineWidth: 1,
  lineCap:   "butt",
  font:      "sans-serif",
  fontSize:  11
};

// default axis properties
config.axis = {
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
config.legend = {
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
config.color = {
  rgb: [128, 128, 128],
  lab: [50, 0, 0],
  hcl: [0, 0, 50],
  hsl: [0, 0, 0.5]
};

// default scale ranges
config.range = {
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

module.exports = config;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],94:[function(require,module,exports){
module.exports = {
  ADD_CELL: 1,
  MOD_CELL: 2,

  DATA: "data",
  FIELDS:  "fields",
  SCALES:  "scales",
  SIGNAL:  "signal",
  SIGNALS: "signals",

  GROUP: "group",

  ENTER: "enter",
  UPDATE: "update",
  EXIT: "exit",

  SENTINEL: {"sentinel": 1},
  SINGLETON: "_singleton",

  ADD: "add",
  REMOVE: "remove",
  TOGGLE: "toggle",
  CLEAR: "clear",

  LINEAR: "linear",
  ORDINAL: "ordinal",
  LOG: "log",
  POWER: "pow",
  TIME: "time",
  QUANTILE: "quantile",

  DOMAIN: "domain",
  RANGE: "range",

  MARK: "mark",
  AXIS: "axis",

  COUNT: "count",
  MIN: "min",
  MAX: "max",

  ASC: "asc",
  DESC: "desc"
};
},{}],95:[function(require,module,exports){
var config = require('./config');
var ts;

module.exports = function(input, args) {
  if (!config.debug) return;
  var log = Function.prototype.bind.call(console.log, console);
  args.unshift(input.stamp||-1);
  args.unshift(Date.now() - ts);
  if(input.add) args.push(input.add.length, input.mod.length, input.rem.length, !!input.reflow);
  log.apply(console, args);
  ts = Date.now();
};
},{"./config":93}],96:[function(require,module,exports){
var dl = require('datalib');

module.exports = function quickselect(k, x, c) {
  function swap(a, b) {
    var t = x[a];
    x[a] = x[b];
    x[b] = t;
  }

  // x may be null, in which case assemble an array from c (counts)
  if(x === null) {
    x = [];
    dl.keys(c).forEach(function(k) {
      var i = 0, len = c[k];
      k = +k || k;
      for(; i<len; ++i) x.push(k);
    });
  }
  
  var left = 0,
      right = x.length - 1,
      pos, i, pivot;
  
  while (left < right) {
    pivot = x[k];
    swap(k, right);
    for (i = pos = left; i < right; ++i) {
      if (x[i] < pivot) { swap(i, pos++); }
    }
    swap(right, pos);
    if (pos === k) break;
    if (pos < k) left = pos + 1;
    else right = pos - 1;
  }
  return x[k];
};
},{"datalib":16}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9iaW4uanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvZ2VuZXJhdGUuanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvaW1wb3J0L2Zvcm1hdHMvY3N2LmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL2ltcG9ydC9mb3JtYXRzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL2ltcG9ydC9mb3JtYXRzL2pzb24uanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvaW1wb3J0L2Zvcm1hdHMvdG9wb2pzb24uanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvaW1wb3J0L2Zvcm1hdHMvdHJlZWpzb24uanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvaW1wb3J0L2Zvcm1hdHMvdHN2LmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL2ltcG9ydC9pbmZlci10eXBlcy5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9pbXBvcnQvbG9hZC5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9pbXBvcnQvbG9hZGVycy5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9pbXBvcnQvcmVhZC5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9sb2cuanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvc3RhdHMuanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvc3VtbWFyeS5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy90ZW1wbGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy90cmVlLmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL3RydW5jYXRlLmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL3V0aWwuanMiLCJub2RlX21vZHVsZXMvaGVhcC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9oZWFwL2xpYi9oZWFwLmpzIiwic3JjL2NvcmUvQm91bmRzLmpzIiwic3JjL2NvcmUvTW9kZWwuanMiLCJzcmMvY29yZS9WaWV3LmpzIiwic3JjL2RhdGFmbG93L0NvbGxlY3Rvci5qcyIsInNyYy9kYXRhZmxvdy9EYXRhc291cmNlLmpzIiwic3JjL2RhdGFmbG93L0dyYXBoLmpzIiwic3JjL2RhdGFmbG93L05vZGUuanMiLCJzcmMvZGF0YWZsb3cvU2lnbmFsLmpzIiwic3JjL2RhdGFmbG93L2NoYW5nZXNldC5qcyIsInNyYy9kYXRhZmxvdy90dXBsZS5qcyIsInNyYy9leHByZXNzaW9uL2NvZGVnZW4uanMiLCJzcmMvZXhwcmVzc2lvbi9jb25zdGFudHMuanMiLCJzcmMvZXhwcmVzc2lvbi9mdW5jdGlvbnMuanMiLCJzcmMvZXhwcmVzc2lvbi9pbmRleC5qcyIsInNyYy9leHByZXNzaW9uL3BhcnNlci5qcyIsInNyYy9wYXJzZS9heGVzLmpzIiwic3JjL3BhcnNlL2RhdGEuanMiLCJzcmMvcGFyc2UvZXZlbnRzLmpzIiwic3JjL3BhcnNlL2V4cHIuanMiLCJzcmMvcGFyc2UvaW50ZXJhY3RvcnMuanMiLCJzcmMvcGFyc2UvbWFyay5qcyIsInNyYy9wYXJzZS9tYXJrcy5qcyIsInNyYy9wYXJzZS9tb2RpZnkuanMiLCJzcmMvcGFyc2UvcGFkZGluZy5qcyIsInNyYy9wYXJzZS9wcmVkaWNhdGVzLmpzIiwic3JjL3BhcnNlL3Byb3BlcnRpZXMuanMiLCJzcmMvcGFyc2Uvc2lnbmFscy5qcyIsInNyYy9wYXJzZS9zcGVjLmpzIiwic3JjL3BhcnNlL3N0cmVhbXMuanMiLCJzcmMvcGFyc2UvdHJhbnNmb3Jtcy5qcyIsInNyYy9yZW5kZXIvY2FudmFzL0hhbmRsZXIuanMiLCJzcmMvcmVuZGVyL2NhbnZhcy9SZW5kZXJlci5qcyIsInNyYy9yZW5kZXIvY2FudmFzL2luZGV4LmpzIiwic3JjL3JlbmRlci9jYW52YXMvbWFya3MuanMiLCJzcmMvcmVuZGVyL2NhbnZhcy9wYXRoLmpzIiwic3JjL3JlbmRlci9zdmcvSGFuZGxlci5qcyIsInNyYy9yZW5kZXIvc3ZnL1JlbmRlcmVyLmpzIiwic3JjL3JlbmRlci9zdmcvbWFya3MuanMiLCJzcmMvc2NlbmUvQm91bmRlci5qcyIsInNyYy9zY2VuZS9CdWlsZGVyLmpzIiwic3JjL3NjZW5lL0VuY29kZXIuanMiLCJzcmMvc2NlbmUvR3JvdXBCdWlsZGVyLmpzIiwic3JjL3NjZW5lL0l0ZW0uanMiLCJzcmMvc2NlbmUvU2NhbGUuanMiLCJzcmMvc2NlbmUvVHJhbnNpdGlvbi5qcyIsInNyYy9zY2VuZS9heGlzLmpzIiwic3JjL3RyYW5zZm9ybXMvQWdncmVnYXRlLmpzIiwic3JjL3RyYW5zZm9ybXMvQmluLmpzIiwic3JjL3RyYW5zZm9ybXMvQ3Jvc3MuanMiLCJzcmMvdHJhbnNmb3Jtcy9GYWNldC5qcyIsInNyYy90cmFuc2Zvcm1zL0ZpbHRlci5qcyIsInNyYy90cmFuc2Zvcm1zL0ZvbGQuanMiLCJzcmMvdHJhbnNmb3Jtcy9Gb3JjZS5qcyIsInNyYy90cmFuc2Zvcm1zL0Zvcm11bGEuanMiLCJzcmMvdHJhbnNmb3Jtcy9Hcm91cEJ5LmpzIiwic3JjL3RyYW5zZm9ybXMvTGlua1BhdGguanMiLCJzcmMvdHJhbnNmb3Jtcy9QYXJhbWV0ZXIuanMiLCJzcmMvdHJhbnNmb3Jtcy9Tb3J0LmpzIiwic3JjL3RyYW5zZm9ybXMvU3RhY2suanMiLCJzcmMvdHJhbnNmb3Jtcy9UcmFuc2Zvcm0uanMiLCJzcmMvdHJhbnNmb3Jtcy9UcmVlbWFwLmpzIiwic3JjL3RyYW5zZm9ybXMvVW5pcXVlLmpzIiwic3JjL3RyYW5zZm9ybXMvWmlwLmpzIiwic3JjL3RyYW5zZm9ybXMvaW5kZXguanMiLCJzcmMvdHJhbnNmb3Jtcy9tZWFzdXJlcy5qcyIsInNyYy91dGlsL2JvdW5kcy5qcyIsInNyYy91dGlsL2NvbmZpZy5qcyIsInNyYy91dGlsL2NvbnN0YW50cy5qcyIsInNyYy91dGlsL2RlYnVnLmpzIiwic3JjL3V0aWwvcXVpY2tzZWxlY3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNuTkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2WEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2owRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3Y2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3ZQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2xLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxTkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNya0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2p1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDck5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hnQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2pUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBjb3JlOiB7XG4gICAgVmlldzogcmVxdWlyZSgnLi9jb3JlL1ZpZXcnKVxuICB9LFxuICBkYXRhZmxvdzoge1xuICAgIGNoYW5nZXNldDogcmVxdWlyZSgnLi9kYXRhZmxvdy9jaGFuZ2VzZXQnKSxcbiAgICBEYXRhc291cmNlOiByZXF1aXJlKCcuL2RhdGFmbG93L0RhdGFzb3VyY2UnKSxcbiAgICBHcmFwaDogcmVxdWlyZSgnLi9kYXRhZmxvdy9HcmFwaCcpLFxuICAgIE5vZGU6IHJlcXVpcmUoJy4vZGF0YWZsb3cvTm9kZScpXG4gIH0sXG4gIHBhcnNlOiB7XG4gICAgc3BlYzogcmVxdWlyZSgnLi9wYXJzZS9zcGVjJylcbiAgfSxcbiAgc2NlbmU6IHtcbiAgICBCdWlsZGVyOiByZXF1aXJlKCcuL3NjZW5lL0J1aWxkZXInKSxcbiAgICBHcm91cEJ1aWxkZXI6IHJlcXVpcmUoJy4vc2NlbmUvR3JvdXBCdWlsZGVyJylcbiAgfSxcbiAgdHJhbnNmb3JtczogcmVxdWlyZSgnLi90cmFuc2Zvcm1zL2luZGV4JyksXG4gIGNvbmZpZzogcmVxdWlyZSgnLi91dGlsL2NvbmZpZycpLFxuICB1dGlsOiByZXF1aXJlKCdkYXRhbGliJylcbn07IixudWxsLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IHRydWU7XG4gICAgdmFyIGN1cnJlbnRRdWV1ZTtcbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgdmFyIGkgPSAtMTtcbiAgICAgICAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgICAgICAgICAgY3VycmVudFF1ZXVlW2ldKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xufVxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICBxdWV1ZS5wdXNoKGZ1bik7XG4gICAgaWYgKCFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHQpIHtcbiAgb3B0ID0gb3B0IHx8IHt9O1xuXG4gIC8vIGRldGVybWluZSByYW5nZVxuICB2YXIgbWF4YiA9IG9wdC5tYXhiaW5zIHx8IDEwMjQsXG4gICAgICBiYXNlID0gb3B0LmJhc2UgfHwgMTAsXG4gICAgICBkaXYgPSBvcHQuZGl2IHx8IFs1LCAyXSxcbiAgICAgIG1pbnMgPSBvcHQubWluc3RlcCB8fCAwLFxuICAgICAgbG9nYiA9IE1hdGgubG9nKGJhc2UpLFxuICAgICAgbGV2ZWwgPSBNYXRoLmNlaWwoTWF0aC5sb2cobWF4YikgLyBsb2diKSxcbiAgICAgIG1pbiA9IG9wdC5taW4sXG4gICAgICBtYXggPSBvcHQubWF4LFxuICAgICAgc3BhbiA9IG1heCAtIG1pbixcbiAgICAgIHN0ZXAgPSBNYXRoLm1heChtaW5zLCBNYXRoLnBvdyhiYXNlLCBNYXRoLnJvdW5kKE1hdGgubG9nKHNwYW4pIC8gbG9nYikgLSBsZXZlbCkpLFxuICAgICAgbmJpbnMgPSBNYXRoLmNlaWwoc3BhbiAvIHN0ZXApLFxuICAgICAgcHJlY2lzaW9uLCB2LCBpLCBlcHM7XG5cbiAgaWYgKG9wdC5zdGVwICE9IG51bGwpIHtcbiAgICBzdGVwID0gb3B0LnN0ZXA7XG4gIH0gZWxzZSBpZiAob3B0LnN0ZXBzKSB7XG4gICAgLy8gaWYgcHJvdmlkZWQsIGxpbWl0IGNob2ljZSB0byBhY2NlcHRhYmxlIHN0ZXAgc2l6ZXNcbiAgICBzdGVwID0gb3B0LnN0ZXBzW01hdGgubWluKFxuICAgICAgICBvcHQuc3RlcHMubGVuZ3RoIC0gMSxcbiAgICAgICAgYmlzZWN0TGVmdChvcHQuc3RlcHMsIHNwYW4gLyBtYXhiLCAwLCBvcHQuc3RlcHMubGVuZ3RoKVxuICAgICldO1xuICB9IGVsc2Uge1xuICAgIC8vIGluY3JlYXNlIHN0ZXAgc2l6ZSBpZiB0b28gbWFueSBiaW5zXG4gICAgZG8ge1xuICAgICAgc3RlcCAqPSBiYXNlO1xuICAgICAgbmJpbnMgPSBNYXRoLmNlaWwoc3BhbiAvIHN0ZXApO1xuICAgIH0gd2hpbGUgKG5iaW5zID4gbWF4Yik7XG5cbiAgICAvLyBkZWNyZWFzZSBzdGVwIHNpemUgaWYgYWxsb3dlZFxuICAgIGZvciAoaSA9IDA7IGkgPCBkaXYubGVuZ3RoOyArK2kpIHtcbiAgICAgIHYgPSBzdGVwIC8gZGl2W2ldO1xuICAgICAgaWYgKHYgPj0gbWlucyAmJiBzcGFuIC8gdiA8PSBtYXhiKSB7XG4gICAgICAgIHN0ZXAgPSB2O1xuICAgICAgICBuYmlucyA9IE1hdGguY2VpbChzcGFuIC8gc3RlcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gdXBkYXRlIHByZWNpc2lvbiwgbWluIGFuZCBtYXhcbiAgdiA9IE1hdGgubG9nKHN0ZXApO1xuICBwcmVjaXNpb24gPSB2ID49IDAgPyAwIDogfn4oLXYgLyBsb2diKSArIDE7XG4gIGVwcyA9IChtaW48MCA/IC0xIDogMSkgKiBNYXRoLnBvdyhiYXNlLCAtcHJlY2lzaW9uIC0gMSk7XG4gIG1pbiA9IE1hdGgubWluKG1pbiwgTWF0aC5mbG9vcihtaW4gLyBzdGVwICsgZXBzKSAqIHN0ZXApO1xuICBtYXggPSBNYXRoLmNlaWwobWF4IC8gc3RlcCkgKiBzdGVwO1xuXG4gIHJldHVybiB7XG4gICAgc3RhcnQ6IG1pbixcbiAgICBzdG9wOiBtYXgsXG4gICAgc3RlcDogc3RlcCxcbiAgICB1bml0OiBwcmVjaXNpb25cbiAgfTtcbn07XG5cbmZ1bmN0aW9uIGJpc2VjdExlZnQoYSwgeCwgbG8sIGhpKSB7XG4gIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgaWYgKHUuY21wKGFbbWlkXSwgeCkgPCAwKSB7IGxvID0gbWlkICsgMTsgfVxuICAgIGVsc2UgeyBoaSA9IG1pZDsgfVxuICB9XG4gIHJldHVybiBsbztcbn0iLCJ2YXIgZ2VuID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuZ2VuLnJlcGVhdCA9IGZ1bmN0aW9uKHZhbCwgbikge1xuICB2YXIgYSA9IEFycmF5KG4pLCBpO1xuICBmb3IgKGk9MDsgaTxuOyArK2kpIGFbaV0gPSB2YWw7XG4gIHJldHVybiBhO1xufTtcblxuZ2VuLnplcm9lcyA9IGZ1bmN0aW9uKG4pIHtcbiAgcmV0dXJuIGdlbi5yZXBlYXQoMCwgbik7XG59O1xuXG5nZW4ucmFuZ2UgPSBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICBzdGVwID0gMTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgIHN0b3AgPSBzdGFydDtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gIH1cbiAgaWYgKChzdG9wIC0gc3RhcnQpIC8gc3RlcCA9PSBJbmZpbml0eSkgdGhyb3cgbmV3IEVycm9yKCdJbmZpbml0ZSByYW5nZScpO1xuICB2YXIgcmFuZ2UgPSBbXSwgaSA9IC0xLCBqO1xuICBpZiAoc3RlcCA8IDApIHdoaWxlICgoaiA9IHN0YXJ0ICsgc3RlcCAqICsraSkgPiBzdG9wKSByYW5nZS5wdXNoKGopO1xuICBlbHNlIHdoaWxlICgoaiA9IHN0YXJ0ICsgc3RlcCAqICsraSkgPCBzdG9wKSByYW5nZS5wdXNoKGopO1xuICByZXR1cm4gcmFuZ2U7XG59O1xuXG5nZW4ucmFuZG9tID0ge307XG5cbmdlbi5yYW5kb20udW5pZm9ybSA9IGZ1bmN0aW9uKG1pbiwgbWF4KSB7XG5cdG1pbiA9IG1pbiB8fCAwO1xuXHRtYXggPSBtYXggfHwgMTtcblx0dmFyIGRlbHRhID0gbWF4IC0gbWluO1xuXHR2YXIgZiA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBtaW4gKyBkZWx0YSAqIE1hdGgucmFuZG9tKCk7XG5cdH07XG5cdGYuc2FtcGxlcyA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIGdlbi56ZXJvZXMobikubWFwKGYpOyB9O1xuXHRyZXR1cm4gZjtcbn07XG5cbmdlbi5yYW5kb20uaW50ZWdlciA9IGZ1bmN0aW9uKGEsIGIpIHtcblx0aWYgKGIgPT09IHVuZGVmaW5lZCkge1xuXHRcdGIgPSBhO1xuXHRcdGEgPSAwO1xuXHR9XG5cdHZhciBmID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGEgKyBNYXRoLm1heCgwLCBNYXRoLmZsb29yKGIqKE1hdGgucmFuZG9tKCktMC4wMDEpKSk7XG5cdH07XG5cdGYuc2FtcGxlcyA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIGdlbi56ZXJvZXMobikubWFwKGYpOyB9O1xuXHRyZXR1cm4gZjtcbn07XG5cbmdlbi5yYW5kb20ubm9ybWFsID0gZnVuY3Rpb24obWVhbiwgc3RkZXYpIHtcblx0bWVhbiA9IG1lYW4gfHwgMDtcblx0c3RkZXYgPSBzdGRldiB8fCAxO1xuXHR2YXIgbmV4dCA9IHVuZGVmaW5lZDtcblx0dmFyIGYgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgeCA9IDAsIHkgPSAwLCByZHMsIGM7XG5cdFx0aWYgKG5leHQgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0eCA9IG5leHQ7XG5cdFx0XHRuZXh0ID0gdW5kZWZpbmVkO1xuXHRcdFx0cmV0dXJuIHg7XG5cdFx0fVxuXHRcdGRvIHtcblx0XHRcdHggPSBNYXRoLnJhbmRvbSgpKjItMTtcblx0XHRcdHkgPSBNYXRoLnJhbmRvbSgpKjItMTtcblx0XHRcdHJkcyA9IHgqeCArIHkqeTtcblx0XHR9IHdoaWxlIChyZHMgPT0gMCB8fCByZHMgPiAxKTtcblx0XHRjID0gTWF0aC5zcXJ0KC0yKk1hdGgubG9nKHJkcykvcmRzKTsgLy8gQm94LU11bGxlciB0cmFuc2Zvcm1cblx0XHRuZXh0ID0gbWVhbiArIHkqYypzdGRldjtcblx0XHRyZXR1cm4gbWVhbiArIHgqYypzdGRldjtcblx0fTtcblx0Zi5zYW1wbGVzID0gZnVuY3Rpb24obikgeyByZXR1cm4gZ2VuLnplcm9lcyhuKS5tYXAoZik7IH07XG5cdHJldHVybiBmO1xufTsiLCJ2YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkYXRhLCBmb3JtYXQpIHtcbiAgdmFyIGQgPSBkMy5jc3YucGFyc2UoZGF0YSA/IGRhdGEudG9TdHJpbmcoKSA6IGRhdGEpO1xuICByZXR1cm4gZDtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAganNvbjogcmVxdWlyZSgnLi9qc29uJyksXG4gIGNzdjogcmVxdWlyZSgnLi9jc3YnKSxcbiAgdHN2OiByZXF1aXJlKCcuL3RzdicpLFxuICB0b3BvanNvbjogcmVxdWlyZSgnLi90b3BvanNvbicpLFxuICB0cmVlanNvbjogcmVxdWlyZSgnLi90cmVlanNvbicpXG59OyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vLi4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRhdGEsIGZvcm1hdCkge1xuICB2YXIgZCA9IHV0aWwuaXNPYmplY3QoZGF0YSkgPyBkYXRhIDogSlNPTi5wYXJzZShkYXRhKTtcbiAgaWYgKGZvcm1hdCAmJiBmb3JtYXQucHJvcGVydHkpIHtcbiAgICBkID0gdXRpbC5hY2Nlc3Nvcihmb3JtYXQucHJvcGVydHkpKGQpO1xuICB9XG4gIHJldHVybiBkO1xufTtcbiIsInZhciBqc29uID0gcmVxdWlyZSgnLi9qc29uJyk7XG52YXIgdG9wb2pzb24gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy50b3BvanNvbiA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwudG9wb2pzb24gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkYXRhLCBmb3JtYXQpIHtcbiAgaWYgKHRvcG9qc29uID09IG51bGwpIHsgdGhyb3cgRXJyb3IoXCJUb3BvSlNPTiBsaWJyYXJ5IG5vdCBsb2FkZWQuXCIpOyB9XG5cbiAgdmFyIHQgPSBqc29uKGRhdGEsIGZvcm1hdCksIG9iajtcblxuICBpZiAoZm9ybWF0ICYmIGZvcm1hdC5mZWF0dXJlKSB7XG4gICAgaWYgKG9iaiA9IHQub2JqZWN0c1tmb3JtYXQuZmVhdHVyZV0pIHtcbiAgICAgIHJldHVybiB0b3BvanNvbi5mZWF0dXJlKHQsIG9iaikuZmVhdHVyZXNcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoXCJJbnZhbGlkIFRvcG9KU09OIG9iamVjdDogXCIrZm9ybWF0LmZlYXR1cmUpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChmb3JtYXQgJiYgZm9ybWF0Lm1lc2gpIHtcbiAgICBpZiAob2JqID0gdC5vYmplY3RzW2Zvcm1hdC5tZXNoXSkge1xuICAgICAgcmV0dXJuIFt0b3BvanNvbi5tZXNoKHQsIHQub2JqZWN0c1tmb3JtYXQubWVzaF0pXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoXCJJbnZhbGlkIFRvcG9KU09OIG9iamVjdDogXCIgKyBmb3JtYXQubWVzaCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IEVycm9yKFwiTWlzc2luZyBUb3BvSlNPTiBmZWF0dXJlIG9yIG1lc2ggcGFyYW1ldGVyLlwiKTtcbiAgfVxuXG4gIHJldHVybiBbXTtcbn07XG4iLCJ2YXIgdHJlZSA9IHJlcXVpcmUoJy4uLy4uL3RyZWUnKTtcbnZhciBqc29uID0gcmVxdWlyZSgnLi9qc29uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGF0YSwgZm9ybWF0KSB7XG4gIGRhdGEgPSBqc29uKGRhdGEsIGZvcm1hdCk7XG4gIHJldHVybiB0cmVlLnRvVGFibGUoZGF0YSwgKGZvcm1hdCAmJiBmb3JtYXQuY2hpbGRyZW4pKTtcbn07IiwidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGF0YSwgZm9ybWF0KSB7XG4gIHZhciBkID0gZDMudHN2LnBhcnNlKGRhdGEgPyBkYXRhLnRvU3RyaW5nKCkgOiBkYXRhKTtcbiAgcmV0dXJuIGQ7XG59O1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbnZhciB0ZXN0cyA9IHtcbiAgYm9vbDogZnVuY3Rpb24oeCkgeyByZXR1cm4geD09PVwidHJ1ZVwiIHx8IHg9PT1cImZhbHNlXCIgfHwgdXRpbC5pc0Jvb2xlYW4oeCk7IH0sXG4gIGRhdGU6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuICFpc05hTihEYXRlLnBhcnNlKHgpKTsgfSxcbiAgbnVtOiBmdW5jdGlvbih4KSB7IHJldHVybiAhaXNOYU4oK3gpICYmICF1dGlsLmlzRGF0ZSh4KTsgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgdmFyIGksIGosIHY7XG4gIFxuICAvLyB0eXBlcyB0byB0ZXN0IGZvclxuICB2YXIgdHlwZXMgPSBbXG4gICAge3R5cGU6IFwiYm9vbGVhblwiLCB0ZXN0OiB0ZXN0cy5ib29sfSxcbiAgICB7dHlwZTogXCJudW1iZXJcIiwgdGVzdDogdGVzdHMubnVtfSxcbiAgICB7dHlwZTogXCJkYXRlXCIsIHRlc3Q6IHRlc3RzLmRhdGV9XG4gIF07XG4gIFxuICBmb3IgKGk9MDsgaTx2YWx1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAvLyBnZXQgbmV4dCB2YWx1ZSB0byB0ZXN0XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgLy8gdGVzdCB2YWx1ZSBhZ2FpbnN0IHJlbWFpbmluZyB0eXBlc1xuICAgIGZvciAoaj0wOyBqPHR5cGVzLmxlbmd0aDsgKytqKSB7XG4gICAgICBpZiAodiAhPSBudWxsICYmICF0eXBlc1tqXS50ZXN0KHYpKSB7XG4gICAgICAgIHR5cGVzLnNwbGljZShqLCAxKTtcbiAgICAgICAgaiAtPSAxO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBpZiBubyB0eXBlcyBsZWZ0LCByZXR1cm4gJ3N0cmluZydcbiAgICBpZiAodHlwZXMubGVuZ3RoID09PSAwKSByZXR1cm4gXCJzdHJpbmdcIjtcbiAgfVxuICBcbiAgcmV0dXJuIHR5cGVzWzBdLnR5cGU7XG59OyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG4vLyBNYXRjaGVzIGFic29sdXRlIFVSTHMgd2l0aCBvcHRpb25hbCBwcm90b2NvbFxuLy8gICBodHRwczovLy4uLiAgICBmaWxlOi8vLi4uICAgIC8vLi4uXG52YXIgcHJvdG9jb2xfcmUgPSAvXihbQS1aYS16XSs6KT9cXC9cXC8vO1xuXG4vLyBTcGVjaWFsIHRyZWF0bWVudCBpbiBub2RlLmpzIGZvciB0aGUgZmlsZTogcHJvdG9jb2xcbnZhciBmaWxlUHJvdG9jb2wgPSAnZmlsZTovLyc7XG5cbi8vIFZhbGlkYXRlIGFuZCBjbGVhbnVwIFVSTCB0byBlbnN1cmUgdGhhdCBpdCBpcyBhbGxvd2VkIHRvIGJlIGFjY2Vzc2VkXG4vLyBSZXR1cm5zIGNsZWFuZWQgdXAgVVJMLCBvciBmYWxzZSBpZiBhY2Nlc3MgaXMgbm90IGFsbG93ZWRcbmZ1bmN0aW9uIHNhbml0aXplVXJsKG9wdCkge1xuICB2YXIgdXJsID0gb3B0LnVybDtcbiAgaWYgKCF1cmwgJiYgb3B0LmZpbGUpIHsgcmV0dXJuIGZpbGVQcm90b2NvbCArIG9wdC5maWxlOyB9XG5cbiAgLy8gSW4gY2FzZSB0aGlzIGlzIGEgcmVsYXRpdmUgdXJsIChoYXMgbm8gaG9zdCksIHByZXBlbmQgb3B0LmJhc2VVUkxcbiAgaWYgKG9wdC5iYXNlVVJMICYmICFwcm90b2NvbF9yZS50ZXN0KHVybCkpIHtcbiAgICBpZiAoIXV0aWwuc3RhcnRzV2l0aCh1cmwsICcvJykgJiYgb3B0LmJhc2VVUkxbb3B0LmJhc2VVUkwubGVuZ3RoLTFdICE9PSAnLycpIHtcbiAgICAgIHVybCA9ICcvJyArIHVybDsgLy8gRW5zdXJlIHRoYXQgdGhlcmUgaXMgYSBzbGFzaCBiZXR3ZWVuIHRoZSBiYXNlVVJMIChlLmcuIGhvc3RuYW1lKSBhbmQgdXJsXG4gICAgfVxuICAgIHVybCA9IG9wdC5iYXNlVVJMICsgdXJsO1xuICB9XG4gIC8vIHJlbGF0aXZlIHByb3RvY29sLCBzdGFydHMgd2l0aCAnLy8nXG4gIGlmICh1dGlsLmlzTm9kZSAmJiB1dGlsLnN0YXJ0c1dpdGgodXJsLCAnLy8nKSkge1xuICAgIHVybCA9IChvcHQuZGVmYXVsdFByb3RvY29sIHx8ICdodHRwJykgKyAnOicgKyB1cmw7XG4gIH1cbiAgLy8gSWYgb3B0LmRvbWFpbldoaXRlTGlzdCBpcyBzZXQsIG9ubHkgYWxsb3dzIHVybCwgd2hvc2UgaG9zdG5hbWVcbiAgLy8gKiBJcyB0aGUgc2FtZSBhcyB0aGUgb3JpZ2luICh3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUpXG4gIC8vICogRXF1YWxzIG9uZSBvZiB0aGUgdmFsdWVzIGluIHRoZSB3aGl0ZWxpc3RcbiAgLy8gKiBJcyBhIHByb3BlciBzdWJkb21haW4gb2Ygb25lIG9mIHRoZSB2YWx1ZXMgaW4gdGhlIHdoaXRlbGlzdFxuICBpZiAob3B0LmRvbWFpbldoaXRlTGlzdCkge1xuICAgIHZhciBkb21haW4sIG9yaWdpbjtcbiAgICBpZiAodXRpbC5pc05vZGUpIHtcbiAgICAgIC8vIHJlbGF0aXZlIHByb3RvY29sIGlzIGJyb2tlbjogaHR0cHM6Ly9naXRodWIuY29tL2RlZnVuY3R6b21iaWUvbm9kZS11cmwvaXNzdWVzLzVcbiAgICAgIHZhciBwYXJ0cyA9IHJlcXVpcmUoJ3VybCcpLnBhcnNlKHVybCk7XG4gICAgICBkb21haW4gPSBwYXJ0cy5ob3N0bmFtZTtcbiAgICAgIG9yaWdpbiA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgYS5ocmVmID0gdXJsO1xuICAgICAgLy8gRnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzczNjUxMy9ob3ctZG8taS1wYXJzZS1hLXVybC1pbnRvLWhvc3RuYW1lLWFuZC1wYXRoLWluLWphdmFzY3JpcHRcbiAgICAgIC8vIElFIGRvZXNuJ3QgcG9wdWxhdGUgYWxsIGxpbmsgcHJvcGVydGllcyB3aGVuIHNldHRpbmcgLmhyZWYgd2l0aCBhIHJlbGF0aXZlIFVSTCxcbiAgICAgIC8vIGhvd2V2ZXIgLmhyZWYgd2lsbCByZXR1cm4gYW4gYWJzb2x1dGUgVVJMIHdoaWNoIHRoZW4gY2FuIGJlIHVzZWQgb24gaXRzZWxmXG4gICAgICAvLyB0byBwb3B1bGF0ZSB0aGVzZSBhZGRpdGlvbmFsIGZpZWxkcy5cbiAgICAgIGlmIChhLmhvc3QgPT0gXCJcIikge1xuICAgICAgICBhLmhyZWYgPSBhLmhyZWY7XG4gICAgICB9XG4gICAgICBkb21haW4gPSBhLmhvc3RuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICBvcmlnaW4gPSB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWU7XG4gICAgfVxuXG4gICAgaWYgKG9yaWdpbiAhPT0gZG9tYWluKSB7XG4gICAgICB2YXIgd2hpdGVMaXN0ZWQgPSBvcHQuZG9tYWluV2hpdGVMaXN0LnNvbWUoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgdmFyIGlkeCA9IGRvbWFpbi5sZW5ndGggLSBkLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGQgPT09IGRvbWFpbiB8fFxuICAgICAgICAgIChpZHggPiAxICYmIGRvbWFpbltpZHgtMV0gPT09ICcuJyAmJiBkb21haW4ubGFzdEluZGV4T2YoZCkgPT09IGlkeCk7XG4gICAgICB9KTtcbiAgICAgIGlmICghd2hpdGVMaXN0ZWQpIHtcbiAgICAgICAgdGhyb3cgJ1VSTCBpcyBub3Qgd2hpdGVsaXN0ZWQ6ICcgKyB1cmw7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB1cmw7XG59XG5cbmZ1bmN0aW9uIGxvYWQob3B0LCBjYWxsYmFjaykge1xuICB2YXIgZXJyb3IgPSBjYWxsYmFjayB8fCBmdW5jdGlvbihlKSB7IHRocm93IGU7IH07XG4gIFxuICB0cnkge1xuICAgIHZhciB1cmwgPSBsb2FkLnNhbml0aXplVXJsKG9wdCk7IC8vIGVuYWJsZSBvdmVycmlkZVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBlcnJvcihlcnIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICghdXJsKSB7XG4gICAgZXJyb3IoJ0ludmFsaWQgVVJMOiAnICsgdXJsKTtcbiAgfSBlbHNlIGlmICghdXRpbC5pc05vZGUpIHtcbiAgICAvLyBpbiBicm93c2VyLCB1c2UgeGhyXG4gICAgcmV0dXJuIHhocih1cmwsIGNhbGxiYWNrKTtcbiAgfSBlbHNlIGlmICh1dGlsLnN0YXJ0c1dpdGgodXJsLCBmaWxlUHJvdG9jb2wpKSB7XG4gICAgLy8gaW4gbm9kZS5qcywgaWYgdXJsIHN0YXJ0cyB3aXRoICdmaWxlOi8vJywgc3RyaXAgaXQgYW5kIGxvYWQgZnJvbSBmaWxlXG4gICAgcmV0dXJuIGZpbGUodXJsLnNsaWNlKGZpbGVQcm90b2NvbC5sZW5ndGgpLCBjYWxsYmFjayk7XG4gIH0gZWxzZSB7XG4gICAgLy8gZm9yIHJlZ3VsYXIgVVJMcyBpbiBub2RlLmpzXG4gICAgcmV0dXJuIGh0dHAodXJsLCBjYWxsYmFjayk7XG4gIH1cbn1cblxuZnVuY3Rpb24geGhySGFzUmVzcG9uc2UocmVxdWVzdCkge1xuICB2YXIgdHlwZSA9IHJlcXVlc3QucmVzcG9uc2VUeXBlO1xuICByZXR1cm4gdHlwZSAmJiB0eXBlICE9PSBcInRleHRcIlxuICAgICAgPyByZXF1ZXN0LnJlc3BvbnNlIC8vIG51bGwgb24gZXJyb3JcbiAgICAgIDogcmVxdWVzdC5yZXNwb25zZVRleHQ7IC8vIFwiXCIgb24gZXJyb3Jcbn1cblxuZnVuY3Rpb24geGhyKHVybCwgY2FsbGJhY2spIHtcbiAgdmFyIGFzeW5jID0gISFjYWxsYmFjaztcbiAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3Q7XG4gIC8vIElmIElFIGRvZXMgbm90IHN1cHBvcnQgQ09SUywgdXNlIFhEb21haW5SZXF1ZXN0IChjb3BpZWQgZnJvbSBkMy54aHIpXG4gIGlmICh0aGlzLlhEb21haW5SZXF1ZXN0XG4gICAgICAmJiAhKFwid2l0aENyZWRlbnRpYWxzXCIgaW4gcmVxdWVzdClcbiAgICAgICYmIC9eKGh0dHAocyk/Oik/XFwvXFwvLy50ZXN0KHVybCkpIHJlcXVlc3QgPSBuZXcgWERvbWFpblJlcXVlc3Q7XG5cbiAgZnVuY3Rpb24gcmVzcG9uZCgpIHtcbiAgICB2YXIgc3RhdHVzID0gcmVxdWVzdC5zdGF0dXM7XG4gICAgaWYgKCFzdGF0dXMgJiYgeGhySGFzUmVzcG9uc2UocmVxdWVzdCkgfHwgc3RhdHVzID49IDIwMCAmJiBzdGF0dXMgPCAzMDAgfHwgc3RhdHVzID09PSAzMDQpIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2socmVxdWVzdCwgbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGFzeW5jKSB7XG4gICAgXCJvbmxvYWRcIiBpbiByZXF1ZXN0XG4gICAgICA/IHJlcXVlc3Qub25sb2FkID0gcmVxdWVzdC5vbmVycm9yID0gcmVzcG9uZFxuICAgICAgOiByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkgeyByZXF1ZXN0LnJlYWR5U3RhdGUgPiAzICYmIHJlc3BvbmQoKTsgfTtcbiAgfVxuICBcbiAgcmVxdWVzdC5vcGVuKFwiR0VUXCIsIHVybCwgYXN5bmMpO1xuICByZXF1ZXN0LnNlbmQoKTtcbiAgXG4gIGlmICghYXN5bmMgJiYgeGhySGFzUmVzcG9uc2UocmVxdWVzdCkpIHtcbiAgICByZXR1cm4gcmVxdWVzdC5yZXNwb25zZVRleHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmlsZShmaWxlLCBjYWxsYmFjaykge1xuICB2YXIgZnMgPSByZXF1aXJlKCdmcycpO1xuICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhmaWxlLCAndXRmOCcpO1xuICB9XG4gIHJlcXVpcmUoJ2ZzJykucmVhZEZpbGUoZmlsZSwgY2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBodHRwKHVybCwgY2FsbGJhY2spIHtcbiAgaWYgKCFjYWxsYmFjaykge1xuICAgIHJldHVybiByZXF1aXJlKCdzeW5jLXJlcXVlc3QnKSgnR0VUJywgdXJsKS5nZXRCb2R5KCk7XG4gIH1cbiAgcmVxdWlyZSgncmVxdWVzdCcpKHVybCwgZnVuY3Rpb24oZXJyb3IsIHJlc3BvbnNlLCBib2R5KSB7XG4gICAgaWYgKCFlcnJvciAmJiByZXNwb25zZS5zdGF0dXNDb2RlID09PSAyMDApIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIGJvZHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfVxuICB9KTtcbn1cblxubG9hZC5zYW5pdGl6ZVVybCA9IHNhbml0aXplVXJsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxvYWQ7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcbnZhciBsb2FkID0gcmVxdWlyZSgnLi9sb2FkJyk7XG52YXIgcmVhZCA9IHJlcXVpcmUoJy4vcmVhZCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxcbiAgLmtleXMocmVhZC5mb3JtYXRzKVxuICAucmVkdWNlKGZ1bmN0aW9uKG91dCwgdHlwZSkge1xuICAgIG91dFt0eXBlXSA9IGZ1bmN0aW9uKG9wdCwgZm9ybWF0LCBjYWxsYmFjaykge1xuICAgICAgLy8gcHJvY2VzcyBhcmd1bWVudHNcbiAgICAgIGlmICh1dGlsLmlzU3RyaW5nKG9wdCkpIG9wdCA9IHt1cmw6IG9wdH07XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMiAmJiB1dGlsLmlzRnVuY3Rpb24oZm9ybWF0KSkge1xuICAgICAgICBjYWxsYmFjayA9IGZvcm1hdDtcbiAgICAgICAgZm9ybWF0ID0gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICAvLyBzZXQgdXAgcmVhZCBmb3JtYXRcbiAgICAgIGZvcm1hdCA9IHV0aWwuZXh0ZW5kKHtwYXJzZTogJ2F1dG8nfSwgZm9ybWF0KTtcbiAgICAgIGZvcm1hdC50eXBlID0gdHlwZTtcblxuICAgICAgLy8gbG9hZCBkYXRhXG4gICAgICB2YXIgZGF0YSA9IGxvYWQob3B0LCBjYWxsYmFjayA/IGZ1bmN0aW9uKGVycm9yLCBkYXRhKSB7XG4gICAgICAgIGlmIChlcnJvcikgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIGRhdGEgbG9hZGVkLCBub3cgcGFyc2UgaXQgKGFzeW5jKVxuICAgICAgICAgIGRhdGEgPSByZWFkKGRhdGEsIGZvcm1hdCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjYWxsYmFjayhlLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhudWxsLCBkYXRhKTtcbiAgICAgIH0gOiB1bmRlZmluZWQpO1xuICAgICAgXG4gICAgICAvLyBkYXRhIGxvYWRlZCwgbm93IHBhcnNlIGl0IChzeW5jKVxuICAgICAgaWYgKGRhdGEpIHJldHVybiByZWFkKGRhdGEsIGZvcm1hdCk7XG4gICAgfTtcbiAgICByZXR1cm4gb3V0O1xuICB9LCB7fSk7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJyk7XG52YXIgaW5mZXIgPSByZXF1aXJlKCcuL2luZmVyLXR5cGVzJyk7XG5cbnZhciBQQVJTRVJTID0ge1xuICBcIm51bWJlclwiOiB1dGlsLm51bWJlcixcbiAgXCJib29sZWFuXCI6IHV0aWwuYm9vbGVhbixcbiAgXCJkYXRlXCI6IHV0aWwuZGF0ZVxufTtcblxuZnVuY3Rpb24gcmVhZChkYXRhLCBmb3JtYXQpIHtcbiAgdmFyIHR5cGUgPSAoZm9ybWF0ICYmIGZvcm1hdC50eXBlKSB8fCBcImpzb25cIjtcbiAgZGF0YSA9IGZvcm1hdHNbdHlwZV0oZGF0YSwgZm9ybWF0KTtcbiAgaWYgKGZvcm1hdCAmJiBmb3JtYXQucGFyc2UpIHBhcnNlKGRhdGEsIGZvcm1hdC5wYXJzZSk7XG4gIHJldHVybiBkYXRhO1xufVxuXG5mdW5jdGlvbiBwYXJzZShkYXRhLCB0eXBlcykge1xuICB2YXIgY29scywgcGFyc2VycywgZCwgaSwgaiwgY2xlbiwgbGVuID0gZGF0YS5sZW5ndGg7XG5cbiAgaWYgKHR5cGVzID09PSAnYXV0bycpIHtcbiAgICAvLyBwZXJmb3JtIHR5cGUgaW5mZXJlbmNlXG4gICAgdHlwZXMgPSB1dGlsLmtleXMoZGF0YVswXSkucmVkdWNlKGZ1bmN0aW9uKHR5cGVzLCBjKSB7XG4gICAgICB2YXIgdHlwZSA9IGluZmVyKGRhdGEsIHV0aWwuYWNjZXNzb3IoYykpO1xuICAgICAgaWYgKFBBUlNFUlNbdHlwZV0pIHR5cGVzW2NdID0gdHlwZTtcbiAgICAgIHJldHVybiB0eXBlcztcbiAgICB9LCB7fSk7XG4gIH1cbiAgY29scyA9IHV0aWwua2V5cyh0eXBlcyk7XG4gIHBhcnNlcnMgPSBjb2xzLm1hcChmdW5jdGlvbihjKSB7IHJldHVybiBQQVJTRVJTW3R5cGVzW2NdXTsgfSk7XG5cbiAgZm9yIChpPTAsIGNsZW49Y29scy5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBkID0gZGF0YVtpXTtcbiAgICBmb3IgKGo9MDsgajxjbGVuOyArK2opIHtcbiAgICAgIGRbY29sc1tqXV0gPSBwYXJzZXJzW2pdKGRbY29sc1tqXV0pO1xuICAgIH1cbiAgfVxufVxuXG5yZWFkLmZvcm1hdHMgPSBmb3JtYXRzO1xucmVhZC5wYXJzZSA9IHBhcnNlO1xubW9kdWxlLmV4cG9ydHMgPSByZWFkOyIsInZhciBkbCA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG51dGlsLmV4dGVuZChkbCwgdXRpbCk7XG51dGlsLmV4dGVuZChkbCwgcmVxdWlyZSgnLi9nZW5lcmF0ZScpKTtcbnV0aWwuZXh0ZW5kKGRsLCByZXF1aXJlKCcuL3N0YXRzJykpO1xuZGwuYmluID0gcmVxdWlyZSgnLi9iaW4nKTtcbmRsLnN1bW1hcnkgPSByZXF1aXJlKCcuL3N1bW1hcnknKTtcbmRsLnRlbXBsYXRlID0gcmVxdWlyZSgnLi90ZW1wbGF0ZScpO1xuZGwudHJ1bmNhdGUgPSByZXF1aXJlKCcuL3RydW5jYXRlJyk7XG5cbmRsLmxvYWQgPSByZXF1aXJlKCcuL2ltcG9ydC9sb2FkJyk7XG5kbC5yZWFkID0gcmVxdWlyZSgnLi9pbXBvcnQvcmVhZCcpO1xudXRpbC5leHRlbmQoZGwsIHJlcXVpcmUoJy4vaW1wb3J0L2xvYWRlcnMnKSk7XG5cbnZhciBsb2cgPSByZXF1aXJlKCcuL2xvZycpO1xuZGwubG9nID0gZnVuY3Rpb24obXNnKSB7IGxvZyhtc2csIGxvZy5MT0cpOyB9O1xuZGwubG9nLnNpbGVudCA9IGxvZy5zaWxlbnQ7XG5kbC5lcnJvciA9IGZ1bmN0aW9uKG1zZykgeyBsb2cobXNnLCBsb2cuRVJSKTsgfTtcbiIsInZhciBMT0cgPSBcIkxPR1wiO1xudmFyIEVSUiA9IFwiRVJSXCI7XG52YXIgc2lsZW50ID0gZmFsc2U7XG5cbmZ1bmN0aW9uIHByZXBhcmUobXNnLCB0eXBlKSB7XG4gIHJldHVybiAnWycgKyBbXG4gICAgJ1wiJysodHlwZSB8fCBMT0cpKydcIicsXG4gICAgRGF0ZS5ub3coKSxcbiAgICAnXCInK21zZysnXCInXG4gIF0uam9pbihcIiwgXCIpICsgJ10nO1xufVxuXG5mdW5jdGlvbiBsb2cobXNnLCB0eXBlKSB7XG4gIGlmICghc2lsZW50KSB7XG4gICAgbXNnID0gcHJlcGFyZShtc2csIHR5cGUpO1xuICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgfVxufVxuXG5sb2cuc2lsZW50ID0gZnVuY3Rpb24odmFsKSB7IHNpbGVudCA9ICEhdmFsOyB9O1xuXG5sb2cuTE9HID0gTE9HO1xubG9nLkVSUiA9IEVSUjtcbm1vZHVsZS5leHBvcnRzID0gbG9nOyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgc3RhdHMgPSB7fTtcblxuc3RhdHMudW5pcXVlID0gZnVuY3Rpb24odmFsdWVzLCBmLCByZXN1bHRzKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09PTApIHJldHVybiBbXTtcbiAgcmVzdWx0cyA9IHJlc3VsdHMgfHwgW107XG4gIHZhciB1ID0ge30sIHYsIGk7XG4gIGZvciAoaT0wLCBuPXZhbHVlcy5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgaWYgKHYgaW4gdSkge1xuICAgICAgdVt2XSArPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB1W3ZdID0gMTtcbiAgICAgIHJlc3VsdHMucHVzaCh2KTtcbiAgICB9XG4gIH1cbiAgcmVzdWx0cy5jb3VudHMgPSB1O1xuICByZXR1cm4gcmVzdWx0cztcbn07XG5cbnN0YXRzLmNvdW50ID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09PTApIHJldHVybiAwO1xuICB2YXIgdiwgaSwgY291bnQgPSAwO1xuICBmb3IgKGk9MCwgbj12YWx1ZXMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh2ICE9IG51bGwpIGNvdW50ICs9IDE7XG4gIH1cbiAgcmV0dXJuIGNvdW50O1xufTtcblxuc3RhdHMuY291bnQuZGlzdGluY3QgPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgaWYgKCF1dGlsLmlzQXJyYXkodmFsdWVzKSB8fCB2YWx1ZXMubGVuZ3RoPT09MCkgcmV0dXJuIDA7XG4gIHZhciB1ID0ge30sIHYsIGksIGNvdW50ID0gMDtcbiAgZm9yIChpPTAsIG49dmFsdWVzLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodiBpbiB1KSBjb250aW51ZTtcbiAgICB1W3ZdID0gMTtcbiAgICBjb3VudCArPSAxO1xuICB9XG4gIHJldHVybiBjb3VudDtcbn07XG5cbnN0YXRzLmNvdW50Lm51bGxzID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09PTApIHJldHVybiAwO1xuICB2YXIgdiwgaSwgY291bnQgPSAwO1xuICBmb3IgKGk9MCwgbj12YWx1ZXMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh2ID09IG51bGwpIGNvdW50ICs9IDE7XG4gIH1cbiAgcmV0dXJuIGNvdW50O1xufTtcblxuc3RhdHMubWVkaWFuID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09PTApIHJldHVybiAwO1xuICBpZiAoZikgdmFsdWVzID0gdmFsdWVzLm1hcChmKTtcbiAgdmFsdWVzID0gdmFsdWVzLmZpbHRlcih1dGlsLmlzTm90TnVsbCkuc29ydCh1dGlsLmNtcCk7XG4gIHZhciBoYWxmID0gTWF0aC5mbG9vcih2YWx1ZXMubGVuZ3RoLzIpO1xuICBpZiAodmFsdWVzLmxlbmd0aCAlIDIpIHtcbiAgICByZXR1cm4gdmFsdWVzW2hhbGZdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAodmFsdWVzW2hhbGYtMV0gKyB2YWx1ZXNbaGFsZl0pIC8gMi4wO1xuICB9XG59O1xuXG5zdGF0cy5tZWFuID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09PTApIHJldHVybiAwO1xuICB2YXIgbWVhbiA9IDAsIGRlbHRhLCBpLCBjLCB2O1xuICBmb3IgKGk9MCwgYz0wOyBpPHZhbHVlcy5sZW5ndGg7ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh2ICE9IG51bGwpIHtcbiAgICAgIGRlbHRhID0gdiAtIG1lYW47XG4gICAgICBtZWFuID0gbWVhbiArIGRlbHRhIC8gKCsrYyk7XG4gICAgfVxuICB9XG4gIHJldHVybiBtZWFuO1xufTtcblxuc3RhdHMudmFyaWFuY2UgPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgaWYgKCF1dGlsLmlzQXJyYXkodmFsdWVzKSB8fCB2YWx1ZXMubGVuZ3RoPT09MCkgcmV0dXJuIDA7XG4gIHZhciBtZWFuID0gMCwgTTIgPSAwLCBkZWx0YSwgaSwgYywgdjtcbiAgZm9yIChpPTAsIGM9MDsgaTx2YWx1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodiAhPSBudWxsKSB7XG4gICAgICBkZWx0YSA9IHYgLSBtZWFuO1xuICAgICAgbWVhbiA9IG1lYW4gKyBkZWx0YSAvICgrK2MpO1xuICAgICAgTTIgPSBNMiArIGRlbHRhICogKHYgLSBtZWFuKTtcbiAgICB9XG4gIH1cbiAgTTIgPSBNMiAvIChjIC0gMSk7XG4gIHJldHVybiBNMjtcbn07XG5cbnN0YXRzLnN0ZGV2ID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIHJldHVybiBNYXRoLnNxcnQoc3RhdHMudmFyaWFuY2UodmFsdWVzLCBmKSk7XG59O1xuXG5zdGF0cy5za2V3ID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIHZhciBhdmcgPSBzdGF0cy5tZWFuKHZhbHVlcywgZiksXG4gICAgICBtZWQgPSBzdGF0cy5tZWRpYW4odmFsdWVzLCBmKSxcbiAgICAgIHN0ZCA9IHN0YXRzLnN0ZGV2KHZhbHVlcywgZik7XG4gIHJldHVybiBzdGQgPT09IDAgPyAwIDogKGF2ZyAtIG1lZCkgLyBzdGQ7XG59O1xuXG5zdGF0cy5taW5tYXggPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgdmFyIHMgPSB7bWluOiArSW5maW5pdHksIG1heDogLUluZmluaXR5fSwgdiwgaSwgbjtcbiAgZm9yIChpPTA7IGk8dmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgaWYgKHYgIT0gbnVsbCkge1xuICAgICAgaWYgKHYgPiBzLm1heCkgcy5tYXggPSB2O1xuICAgICAgaWYgKHYgPCBzLm1pbikgcy5taW4gPSB2O1xuICAgIH1cbiAgfVxuICByZXR1cm4gcztcbn07XG5cbnN0YXRzLm1pbkluZGV4ID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09MCkgcmV0dXJuIC0xO1xuICB2YXIgaWR4ID0gMCwgdiwgaSwgbiwgbWluID0gK0luZmluaXR5O1xuICBmb3IgKGk9MDsgaTx2YWx1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodiAhPSBudWxsICYmIHYgPCBtaW4pIHsgbWluID0gdjsgaWR4ID0gaTsgfVxuICB9XG4gIHJldHVybiBpZHg7XG59O1xuXG5zdGF0cy5tYXhJbmRleCA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICBpZiAoIXV0aWwuaXNBcnJheSh2YWx1ZXMpIHx8IHZhbHVlcy5sZW5ndGg9PTApIHJldHVybiAtMTtcbiAgdmFyIGlkeCA9IDAsIHYsIGksIG4sIG1heCA9IC1JbmZpbml0eTtcbiAgZm9yIChpPTA7IGk8dmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgaWYgKHYgIT0gbnVsbCAmJiB2ID4gbWF4KSB7IG1heCA9IHY7IGlkeCA9IGk7IH1cbiAgfVxuICByZXR1cm4gaWR4O1xufTtcblxuc3RhdHMuZW50cm9weSA9IGZ1bmN0aW9uKGNvdW50cykge1xuICB2YXIgaSwgcCwgcyA9IDAsIEggPSAwO1xuICBmb3IgKGk9MDsgaTxjb3VudHMubGVuZ3RoOyArK2kpIHtcbiAgICBzICs9IGNvdW50c1tpXTtcbiAgfVxuICBpZiAocyA9PT0gMCkgcmV0dXJuIDA7XG4gIGZvciAoaT0wOyBpPGNvdW50cy5sZW5ndGg7ICsraSkge1xuICAgIHAgPSBjb3VudHNbaV0gLyBzO1xuICAgIGlmIChwID4gMCkgSCArPSBwICogTWF0aC5sb2cocCkgLyBNYXRoLkxOMjtcbiAgfVxuICByZXR1cm4gLUg7XG59O1xuXG5zdGF0cy5lbnRyb3B5Lm5vcm1hbGl6ZWQgPSBmdW5jdGlvbihjb3VudHMpIHtcbiAgdmFyIEggPSBzdGF0cy5lbnRyb3B5KGNvdW50cyk7XG4gIHZhciBtYXggPSAtTWF0aC5sb2coMS9jb3VudHMubGVuZ3RoKSAvIE1hdGguTE4yO1xuICByZXR1cm4gSCAvIG1heDtcbn07XG5cbnN0YXRzLnByb2ZpbGUgPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgaWYgKCF1dGlsLmlzQXJyYXkodmFsdWVzKSB8fCB2YWx1ZXMubGVuZ3RoPT09MCkgcmV0dXJuIG51bGw7XG5cbiAgLy8gaW5pdFxuICB2YXIgcCA9IHt9LFxuICAgICAgbWVhbiA9IDAsXG4gICAgICBjb3VudCA9IDAsXG4gICAgICBkaXN0aW5jdCA9IDAsXG4gICAgICBtaW4gPSBmID8gZih2YWx1ZXNbMF0pIDogdmFsdWVzWzBdLFxuICAgICAgbWF4ID0gbWluLFxuICAgICAgTTIgPSAwLFxuICAgICAgbWVkaWFuID0gbnVsbCxcbiAgICAgIHZhbHMgPSBbXSxcbiAgICAgIHUgPSB7fSwgZGVsdGEsIHNkLCBpLCB2LCB4LCBoYWxmO1xuXG4gIC8vIGNvbXB1dGUgc3VtbWFyeSBzdGF0c1xuICBmb3IgKGk9MCwgYz0wOyBpPHZhbHVlcy5sZW5ndGg7ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh2ICE9IG51bGwpIHtcbiAgICAgIC8vIHVwZGF0ZSB1bmlxdWUgdmFsdWVzXG4gICAgICB1W3ZdID0gKHYgaW4gdSkgPyB1W3ZdICsgMSA6IChkaXN0aW5jdCArPSAxLCAxKTtcbiAgICAgIC8vIHVwZGF0ZSBtaW4vbWF4XG4gICAgICBpZiAodiA8IG1pbikgbWluID0gdjtcbiAgICAgIGlmICh2ID4gbWF4KSBtYXggPSB2O1xuICAgICAgLy8gdXBkYXRlIHN0YXRzXG4gICAgICB4ID0gKHR5cGVvZiB2ID09PSAnc3RyaW5nJykgPyB2Lmxlbmd0aCA6IHY7XG4gICAgICBkZWx0YSA9IHggLSBtZWFuO1xuICAgICAgbWVhbiA9IG1lYW4gKyBkZWx0YSAvICgrK2NvdW50KTtcbiAgICAgIE0yID0gTTIgKyBkZWx0YSAqICh4IC0gbWVhbik7XG4gICAgICB2YWxzLnB1c2goeCk7XG4gICAgfVxuICB9XG4gIE0yID0gTTIgLyAoY291bnQgLSAxKTtcbiAgc2QgPSBNYXRoLnNxcnQoTTIpO1xuXG4gIC8vIGNvbXB1dGUgbWVkaWFuXG4gIHZhbHMuc29ydCh1dGlsLmNtcCk7XG4gIGhhbGYgPSBNYXRoLmZsb29yKHZhbHMubGVuZ3RoLzIpO1xuICBtZWRpYW4gPSAodmFscy5sZW5ndGggJSAyKVxuICAgPyB2YWxzW2hhbGZdXG4gICA6ICh2YWxzW2hhbGYtMV0gKyB2YWxzW2hhbGZdKSAvIDIuMDtcblxuICByZXR1cm4ge1xuICAgIHVuaXF1ZTogICB1LFxuICAgIGNvdW50OiAgICBjb3VudCxcbiAgICBudWxsczogICAgdmFsdWVzLmxlbmd0aCAtIGNvdW50LFxuICAgIGRpc3RpbmN0OiBkaXN0aW5jdCxcbiAgICBtaW46ICAgICAgbWluLFxuICAgIG1heDogICAgICBtYXgsXG4gICAgbWVhbjogICAgIG1lYW4sXG4gICAgbWVkaWFuOiAgIG1lZGlhbixcbiAgICBzdGRldjogICAgc2QsXG4gICAgc2tldzogICAgIHNkID09PSAwID8gMCA6IChtZWFuIC0gbWVkaWFuKSAvIHNkXG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YXRzOyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgc3RhdHMgPSByZXF1aXJlKCcuL3N0YXRzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGF0YSwgZmllbGRzKSB7XG4gIGlmIChkYXRhID09IG51bGwgfHwgZGF0YS5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBmaWVsZHMgPSBmaWVsZHMgfHwgdXRpbC5rZXlzKGRhdGFbMF0pO1xuXG4gIHZhciBwcm9maWxlcyA9IGZpZWxkcy5tYXAoZnVuY3Rpb24oZikge1xuICAgIHZhciBwID0gc3RhdHMucHJvZmlsZShkYXRhLCB1dGlsLmFjY2Vzc29yKGYpKTtcbiAgICByZXR1cm4gKHAuZmllbGQgPSBmLCBwKTtcbiAgfSk7XG4gIFxuICBwcm9maWxlcy50b1N0cmluZyA9IHByaW50U3VtbWFyeTtcbiAgcmV0dXJuIHByb2ZpbGVzO1xufTtcblxuZnVuY3Rpb24gcHJpbnRTdW1tYXJ5KCkge1xuICB2YXIgcHJvZmlsZXMgPSB0aGlzO1xuICB2YXIgc3RyID0gW107XG4gIHByb2ZpbGVzLmZvckVhY2goZnVuY3Rpb24ocCkge1xuICAgIHN0ci5wdXNoKFwiLS0tLS0gRmllbGQ6ICdcIiArIHAuZmllbGQgKyBcIicgLS0tLS1cIik7XG4gICAgaWYgKHR5cGVvZiBwLm1pbiA9PT0gJ3N0cmluZycgfHwgcC5kaXN0aW5jdCA8IDEwKSB7XG4gICAgICBzdHIucHVzaChwcmludENhdGVnb3JpY2FsUHJvZmlsZShwKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ci5wdXNoKHByaW50UXVhbnRpdGF0aXZlUHJvZmlsZShwKSk7XG4gICAgfVxuICAgIHN0ci5wdXNoKFwiXCIpO1xuICB9KTtcbiAgcmV0dXJuIHN0ci5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwcmludFF1YW50aXRhdGl2ZVByb2ZpbGUocCkge1xuICByZXR1cm4gW1xuICAgIFwiZGlzdGluY3Q6IFwiICsgcC5kaXN0aW5jdCxcbiAgICBcIm51bGxzOiAgICBcIiArIHAubnVsbHMsXG4gICAgXCJtaW46ICAgICAgXCIgKyBwLm1pbixcbiAgICBcIm1heDogICAgICBcIiArIHAubWF4LFxuICAgIFwibWVkaWFuOiAgIFwiICsgcC5tZWRpYW4sXG4gICAgXCJtZWFuOiAgICAgXCIgKyBwLm1lYW4sXG4gICAgXCJzdGRldjogICAgXCIgKyBwLnN0ZGV2LFxuICAgIFwic2tldzogICAgIFwiICsgcC5za2V3XG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcHJpbnRDYXRlZ29yaWNhbFByb2ZpbGUocCkge1xuICB2YXIgbGlzdCA9IFtcbiAgICBcImRpc3RpbmN0OiBcIiArIHAuZGlzdGluY3QsXG4gICAgXCJudWxsczogICAgXCIgKyBwLm51bGxzLFxuICAgIFwidG9wIHZhbHVlczogXCJcbiAgXTtcbiAgdmFyIHUgPSBwLnVuaXF1ZTtcbiAgdmFyIHRvcCA9IHV0aWwua2V5cyh1KVxuICAgIC5zb3J0KGZ1bmN0aW9uKGEsYikgeyByZXR1cm4gdVtiXSAtIHVbYV07IH0pXG4gICAgLnNsaWNlKDAsIDYpXG4gICAgLm1hcChmdW5jdGlvbih2KSB7IHJldHVybiBcIiAnXCIgKyB2ICsgXCInIChcIiArIHVbdl0gKyBcIilcIjsgfSk7XG4gIHJldHVybiBsaXN0LmNvbmNhdCh0b3ApLmpvaW4oXCJcXG5cIik7XG59IiwidmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpO1xuXG52YXIgY29udGV4dCA9IHtcbiAgZm9ybWF0czogICAgW10sXG4gIGZvcm1hdF9tYXA6IHt9LFxuICB0cnVuY2F0ZTogICByZXF1aXJlKCcuL3RydW5jYXRlJylcbn07XG5cbmZ1bmN0aW9uIHRlbXBsYXRlKHRleHQpIHtcbiAgdmFyIHNyYyA9IHNvdXJjZSh0ZXh0LCBcImRcIik7XG4gIHNyYyA9IFwidmFyIF9fdDsgcmV0dXJuIFwiICsgc3JjICsgXCI7XCI7XG5cbiAgdHJ5IHtcbiAgICByZXR1cm4gKG5ldyBGdW5jdGlvbihcImRcIiwgc3JjKSkuYmluZChjb250ZXh0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGUuc291cmNlID0gc3JjO1xuICAgIHRocm93IGU7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0ZW1wbGF0ZTtcblxuLy8gY2xlYXIgY2FjaGUgb2YgZm9ybWF0IG9iamVjdHNcbi8vIGNhbiAqYnJlYWsqIHByaW9yIHRlbXBsYXRlIGZ1bmN0aW9ucywgc28gaW52b2tlIHdpdGggY2FyZVxudGVtcGxhdGUuY2xlYXJGb3JtYXRDYWNoZSA9IGZ1bmN0aW9uKCkge1xuICBjb250ZXh0LmZvcm1hdHMgPSBbXTtcbiAgY29udGV4dC5mb3JtYXRfbWFwID0ge307XG59O1xuXG5mdW5jdGlvbiBzb3VyY2UodGV4dCwgdmFyaWFibGUpIHtcbiAgdmFyaWFibGUgPSB2YXJpYWJsZSB8fCBcIm9ialwiO1xuICB2YXIgaW5kZXggPSAwO1xuICB2YXIgc3JjID0gXCInXCI7XG4gIHZhciByZWdleCA9IHRlbXBsYXRlX3JlO1xuXG4gIC8vIENvbXBpbGUgdGhlIHRlbXBsYXRlIHNvdXJjZSwgZXNjYXBpbmcgc3RyaW5nIGxpdGVyYWxzIGFwcHJvcHJpYXRlbHkuXG4gIHRleHQucmVwbGFjZShyZWdleCwgZnVuY3Rpb24obWF0Y2gsIGludGVycG9sYXRlLCBvZmZzZXQpIHtcbiAgICBzcmMgKz0gdGV4dFxuICAgICAgLnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgICAucmVwbGFjZSh0ZW1wbGF0ZV9lc2NhcGVyLCB0ZW1wbGF0ZV9lc2NhcGVDaGFyKTtcbiAgICBpbmRleCA9IG9mZnNldCArIG1hdGNoLmxlbmd0aDtcblxuICAgIGlmIChpbnRlcnBvbGF0ZSkge1xuICAgICAgc3JjICs9IFwiJ1xcbisoKF9fdD0oXCJcbiAgICAgICAgKyB0ZW1wbGF0ZV92YXIoaW50ZXJwb2xhdGUsIHZhcmlhYmxlKVxuICAgICAgICArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG4gICAgfVxuXG4gICAgLy8gQWRvYmUgVk1zIG5lZWQgdGhlIG1hdGNoIHJldHVybmVkIHRvIHByb2R1Y2UgdGhlIGNvcnJlY3Qgb2ZmZXN0LlxuICAgIHJldHVybiBtYXRjaDtcbiAgfSk7XG4gIHJldHVybiBzcmMgKyBcIidcIjtcbn1cblxuZnVuY3Rpb24gdGVtcGxhdGVfdmFyKHRleHQsIHZhcmlhYmxlKSB7XG4gIHZhciBmaWx0ZXJzID0gdGV4dC5zcGxpdCgnfCcpO1xuICB2YXIgcHJvcCA9IGZpbHRlcnMuc2hpZnQoKS50cmltKCk7XG4gIHZhciBmb3JtYXQgPSBbXTtcbiAgdmFyIHN0cmluZ0Nhc3QgPSB0cnVlO1xuICBcbiAgZnVuY3Rpb24gc3RyY2FsbChmbikge1xuICAgIGZuID0gZm4gfHwgXCJcIjtcbiAgICBpZiAoc3RyaW5nQ2FzdCkge1xuICAgICAgc3RyaW5nQ2FzdCA9IGZhbHNlO1xuICAgICAgc3JjID0gXCJTdHJpbmcoXCIgKyBzcmMgKyBcIilcIiArIGZuO1xuICAgIH0gZWxzZSB7XG4gICAgICBzcmMgKz0gZm47XG4gICAgfVxuICAgIHJldHVybiBzcmM7XG4gIH1cbiAgXG4gIHZhciBzcmMgPSB1dGlsLmZpZWxkKHByb3ApLm1hcCh1dGlsLnN0cikuam9pbihcIl1bXCIpO1xuICBzcmMgPSB2YXJpYWJsZSArIFwiW1wiICsgc3JjICsgXCJdXCI7XG4gIFxuICBmb3IgKHZhciBpPTA7IGk8ZmlsdGVycy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBmID0gZmlsdGVyc1tpXSwgYXJncyA9IG51bGwsIHBpZHgsIGEsIGI7XG5cbiAgICBpZiAoKHBpZHg9Zi5pbmRleE9mKCc6JykpID4gMCkge1xuICAgICAgZiA9IGYuc2xpY2UoMCwgcGlkeCk7XG4gICAgICBhcmdzID0gZmlsdGVyc1tpXS5zbGljZShwaWR4KzEpLnNwbGl0KCcsJylcbiAgICAgICAgLm1hcChmdW5jdGlvbihzKSB7IHJldHVybiBzLnRyaW0oKTsgfSk7XG4gICAgfVxuICAgIGYgPSBmLnRyaW0oKTtcblxuICAgIHN3aXRjaCAoZikge1xuICAgICAgY2FzZSAnbGVuZ3RoJzpcbiAgICAgICAgc3RyY2FsbCgnLmxlbmd0aCcpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xvd2VyJzpcbiAgICAgICAgc3RyY2FsbCgnLnRvTG93ZXJDYXNlKCknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd1cHBlcic6XG4gICAgICAgIHN0cmNhbGwoJy50b1VwcGVyQ2FzZSgpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbG93ZXItbG9jYWxlJzpcbiAgICAgICAgc3RyY2FsbCgnLnRvTG9jYWxlTG93ZXJDYXNlKCknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd1cHBlci1sb2NhbGUnOlxuICAgICAgICBzdHJjYWxsKCcudG9Mb2NhbGVVcHBlckNhc2UoKScpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3RyaW0nOlxuICAgICAgICBzdHJjYWxsKCcudHJpbSgpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgIGEgPSB1dGlsLm51bWJlcihhcmdzWzBdKTtcbiAgICAgICAgc3RyY2FsbCgnLnNsaWNlKDAsJyArIGEgKyAnKScpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgYSA9IHV0aWwubnVtYmVyKGFyZ3NbMF0pO1xuICAgICAgICBzdHJjYWxsKCcuc2xpY2UoLScgKyBhICsnKScpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21pZCc6XG4gICAgICAgIGEgPSB1dGlsLm51bWJlcihhcmdzWzBdKTtcbiAgICAgICAgYiA9IGEgKyB1dGlsLm51bWJlcihhcmdzWzFdKTtcbiAgICAgICAgc3RyY2FsbCgnLnNsaWNlKCsnK2ErJywnK2IrJyknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzbGljZSc6XG4gICAgICAgIGEgPSB1dGlsLm51bWJlcihhcmdzWzBdKTtcbiAgICAgICAgc3RyY2FsbCgnLnNsaWNlKCcrIGFcbiAgICAgICAgICArIChhcmdzLmxlbmd0aCA+IDEgPyAnLCcgKyB1dGlsLm51bWJlcihhcmdzWzFdKSA6ICcnKVxuICAgICAgICAgICsgJyknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0cnVuY2F0ZSc6XG4gICAgICAgIGEgPSB1dGlsLm51bWJlcihhcmdzWzBdKTtcbiAgICAgICAgYiA9IGFyZ3NbMV07XG4gICAgICAgIGIgPSAoYiE9PVwibGVmdFwiICYmIGIhPT1cIm1pZGRsZVwiICYmIGIhPT1cImNlbnRlclwiKSA/IFwicmlnaHRcIiA6IGI7XG4gICAgICAgIHNyYyA9ICd0aGlzLnRydW5jYXRlKCcgKyBzdHJjYWxsKCkgKyAnLCcgKyBhICsgJyxcIicgKyBiICsgJ1wiKSc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgYSA9IHRlbXBsYXRlX2Zvcm1hdChhcmdzWzBdLCBkMy5mb3JtYXQpO1xuICAgICAgICBzdHJpbmdDYXN0ID0gZmFsc2U7XG4gICAgICAgIHNyYyA9ICd0aGlzLmZvcm1hdHNbJythKyddKCcrc3JjKycpJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0aW1lJzpcbiAgICAgICAgYSA9IHRlbXBsYXRlX2Zvcm1hdChhcmdzWzBdLCBkMy50aW1lLmZvcm1hdCk7XG4gICAgICAgIHN0cmluZ0Nhc3QgPSBmYWxzZTtcbiAgICAgICAgc3JjID0gJ3RoaXMuZm9ybWF0c1snK2ErJ10oJytzcmMrJyknO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IEVycm9yKFwiVW5yZWNvZ25pemVkIHRlbXBsYXRlIGZpbHRlcjogXCIgKyBmKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gc3JjO1xufVxuXG52YXIgdGVtcGxhdGVfcmUgPSAvXFx7XFx7KC4rPylcXH1cXH18JC9nO1xuXG4vLyBDZXJ0YWluIGNoYXJhY3RlcnMgbmVlZCB0byBiZSBlc2NhcGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgcHV0IGludG8gYVxuLy8gc3RyaW5nIGxpdGVyYWwuXG52YXIgdGVtcGxhdGVfZXNjYXBlcyA9IHtcbiAgXCInXCI6ICAgICAgXCInXCIsXG4gICdcXFxcJzogICAgICdcXFxcJyxcbiAgJ1xccic6ICAgICAncicsXG4gICdcXG4nOiAgICAgJ24nLFxuICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICdcXHUyMDI5JzogJ3UyMDI5J1xufTtcblxudmFyIHRlbXBsYXRlX2VzY2FwZXIgPSAvXFxcXHwnfFxccnxcXG58XFx1MjAyOHxcXHUyMDI5L2c7XG5cbmZ1bmN0aW9uIHRlbXBsYXRlX2VzY2FwZUNoYXIobWF0Y2gpIHtcbiAgcmV0dXJuICdcXFxcJyArIHRlbXBsYXRlX2VzY2FwZXNbbWF0Y2hdO1xufTtcblxuZnVuY3Rpb24gdGVtcGxhdGVfZm9ybWF0KHBhdHRlcm4sIGZtdCkge1xuICBpZiAoKHBhdHRlcm5bMF0gPT09IFwiJ1wiICYmIHBhdHRlcm5bcGF0dGVybi5sZW5ndGgtMV0gPT09IFwiJ1wiKSB8fFxuICAgICAgKHBhdHRlcm5bMF0gIT09ICdcIicgJiYgcGF0dGVybltwYXR0ZXJuLmxlbmd0aC0xXSA9PT0gJ1wiJykpIHtcbiAgICBwYXR0ZXJuID0gcGF0dGVybi5zbGljZSgxLCAtMSk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgRXJyb3IoXCJGb3JtYXQgcGF0dGVybiBtdXN0IGJlIHF1b3RlZDogXCIgKyBwYXR0ZXJuKTtcbiAgfVxuICBpZiAoIWNvbnRleHQuZm9ybWF0X21hcFtwYXR0ZXJuXSkge1xuICAgIHZhciBmID0gZm10KHBhdHRlcm4pO1xuICAgIHZhciBpID0gY29udGV4dC5mb3JtYXRzLmxlbmd0aDtcbiAgICBjb250ZXh0LmZvcm1hdHMucHVzaChmKTtcbiAgICBjb250ZXh0LmZvcm1hdF9tYXBbcGF0dGVybl0gPSBpO1xuICB9XG4gIHJldHVybiBjb250ZXh0LmZvcm1hdF9tYXBbcGF0dGVybl07XG59O1xuIiwidmFyIEZJRUxEUyA9IHtcbiAgcGFyZW50OiBcInBhcmVudFwiLFxuICBjaGlsZHJlbjogXCJjaGlsZHJlblwiXG59O1xuXG5mdW5jdGlvbiB0b1RhYmxlKHJvb3QsIGNoaWxkcmVuRmllbGQsIHBhcmVudEZpZWxkKSB7XG4gIGNoaWxkcmVuRmllbGQgPSBjaGlsZHJlbkZpZWxkIHx8IEZJRUxEUy5jaGlsZHJlbjtcbiAgcGFyZW50RmllbGQgPSBwYXJlbnRGaWVsZCB8fCBGSUVMRFMucGFyZW50O1xuICB2YXIgdGFibGUgPSBbXTtcbiAgXG4gIGZ1bmN0aW9uIHZpc2l0KG5vZGUsIHBhcmVudCkge1xuICAgIG5vZGVbcGFyZW50RmllbGRdID0gcGFyZW50O1xuICAgIHRhYmxlLnB1c2gobm9kZSk7XG4gICAgXG4gICAgdmFyIGNoaWxkcmVuID0gbm9kZVtjaGlsZHJlbkZpZWxkXTtcbiAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgIGZvciAodmFyIGk9MDsgaTxjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICB2aXNpdChjaGlsZHJlbltpXSwgbm9kZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICB2aXNpdChyb290LCBudWxsKTtcbiAgcmV0dXJuICh0YWJsZS5yb290ID0gcm9vdCwgdGFibGUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgdG9UYWJsZTogdG9UYWJsZSxcbiAgZmllbGRzOiBGSUVMRFNcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzLCBsZW5ndGgsIHBvcywgd29yZCwgZWxsaXBzaXMpIHtcbiAgdmFyIGxlbiA9IHMubGVuZ3RoO1xuICBpZiAobGVuIDw9IGxlbmd0aCkgcmV0dXJuIHM7XG4gIGVsbGlwc2lzID0gZWxsaXBzaXMgfHwgXCIuLi5cIjtcbiAgdmFyIGwgPSBNYXRoLm1heCgwLCBsZW5ndGggLSBlbGxpcHNpcy5sZW5ndGgpO1xuXG4gIHN3aXRjaCAocG9zKSB7XG4gICAgY2FzZSBcImxlZnRcIjpcbiAgICAgIHJldHVybiBlbGxpcHNpcyArICh3b3JkID8gdV90cnVuY2F0ZU9uV29yZChzLGwsMSkgOiBzLnNsaWNlKGxlbi1sKSk7XG4gICAgY2FzZSBcIm1pZGRsZVwiOlxuICAgIGNhc2UgXCJjZW50ZXJcIjpcbiAgICAgIHZhciBsMSA9IE1hdGguY2VpbChsLzIpLCBsMiA9IE1hdGguZmxvb3IobC8yKTtcbiAgICAgIHJldHVybiAod29yZCA/IHRydW5jYXRlT25Xb3JkKHMsbDEpIDogcy5zbGljZSgwLGwxKSkgKyBlbGxpcHNpc1xuICAgICAgICArICh3b3JkID8gdHJ1bmNhdGVPbldvcmQocyxsMiwxKSA6IHMuc2xpY2UobGVuLWwyKSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAod29yZCA/IHRydW5jYXRlT25Xb3JkKHMsbCkgOiBzLnNsaWNlKDAsbCkpICsgZWxsaXBzaXM7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHRydW5jYXRlT25Xb3JkKHMsIGxlbiwgcmV2KSB7XG4gIHZhciBjbnQgPSAwLCB0b2sgPSBzLnNwbGl0KHRydW5jYXRlX3dvcmRfcmUpO1xuICBpZiAocmV2KSB7XG4gICAgcyA9ICh0b2sgPSB0b2sucmV2ZXJzZSgpKVxuICAgICAgLmZpbHRlcihmdW5jdGlvbih3KSB7IGNudCArPSB3Lmxlbmd0aDsgcmV0dXJuIGNudCA8PSBsZW47IH0pXG4gICAgICAucmV2ZXJzZSgpO1xuICB9IGVsc2Uge1xuICAgIHMgPSB0b2suZmlsdGVyKGZ1bmN0aW9uKHcpIHsgY250ICs9IHcubGVuZ3RoOyByZXR1cm4gY250IDw9IGxlbjsgfSk7XG4gIH1cbiAgcmV0dXJuIHMubGVuZ3RoID8gcy5qb2luKFwiXCIpLnRyaW0oKSA6IHRva1swXS5zbGljZSgwLCBsZW4pO1xufVxuXG52YXIgdHJ1bmNhdGVfd29yZF9yZSA9IC8oW1xcdTAwMDlcXHUwMDBBXFx1MDAwQlxcdTAwMENcXHUwMDBEXFx1MDAyMFxcdTAwQTBcXHUxNjgwXFx1MTgwRVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBBXFx1MjAyRlxcdTIwNUZcXHUyMDI4XFx1MjAyOVxcdTMwMDBcXHVGRUZGXSkvO1xuIiwidmFyIHUgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyB3aGVyZSBhcmUgd2U/XG5cbnUuaXNOb2RlID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICYmIHR5cGVvZiBwcm9jZXNzLnN0ZGVyciAhPT0gJ3VuZGVmaW5lZCc7XG5cbi8vIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbnUuaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG59O1xuXG51LmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBGdW5jdGlvbl0nO1xufTtcblxudS5pc1N0cmluZyA9IGZ1bmN0aW9uKG9iaikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IFN0cmluZ10nO1xufTtcbiAgXG51LmlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuXG51LmlzTnVtYmVyID0gZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgTnVtYmVyXSc7XG59O1xuXG51LmlzQm9vbGVhbiA9IGZ1bmN0aW9uKG9iaikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEJvb2xlYW5dJztcbn07XG5cbnUuaXNEYXRlID0gZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgRGF0ZV0nO1xufTtcblxudS5pc05vdE51bGwgPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIG9iaiAhPSBudWxsOyAvLyBUT0RPIGluY2x1ZGUgTmFOIGhlcmU/XG59O1xuXG4vLyB0eXBlIGNvZXJjaW9uIGZ1bmN0aW9uc1xuXG51Lm51bWJlciA9IGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMgPT0gbnVsbCA/IG51bGwgOiArczsgfTtcblxudS5ib29sZWFuID0gZnVuY3Rpb24ocykgeyByZXR1cm4gcyA9PSBudWxsID8gbnVsbCA6IHM9PT0nZmFsc2UnID8gZmFsc2UgOiAhIXM7IH07XG5cbnUuZGF0ZSA9IGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMgPT0gbnVsbCA/IG51bGwgOiBEYXRlLnBhcnNlKHMpOyB9XG5cbnUuYXJyYXkgPSBmdW5jdGlvbih4KSB7IHJldHVybiB4ICE9IG51bGwgPyAodS5pc0FycmF5KHgpID8geCA6IFt4XSkgOiBbXTsgfTtcblxudS5zdHIgPSBmdW5jdGlvbih4KSB7XG4gIHJldHVybiB1LmlzQXJyYXkoeCkgPyBcIltcIiArIHgubWFwKHUuc3RyKSArIFwiXVwiXG4gICAgOiB1LmlzT2JqZWN0KHgpID8gSlNPTi5zdHJpbmdpZnkoeClcbiAgICA6IHUuaXNTdHJpbmcoeCkgPyAoXCInXCIrdXRpbF9lc2NhcGVfc3RyKHgpK1wiJ1wiKSA6IHg7XG59O1xuXG52YXIgZXNjYXBlX3N0cl9yZSA9IC8oXnxbXlxcXFxdKScvZztcblxuZnVuY3Rpb24gdXRpbF9lc2NhcGVfc3RyKHgpIHtcbiAgcmV0dXJuIHgucmVwbGFjZShlc2NhcGVfc3RyX3JlLCBcIiQxXFxcXCdcIik7XG59XG5cbi8vIHV0aWxpdHkgZnVuY3Rpb25zXG5cbnUuaWRlbnRpdHkgPSBmdW5jdGlvbih4KSB7IHJldHVybiB4OyB9O1xuXG51LnRydWUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRydWU7IH07XG5cbnUuZHVwbGljYXRlID0gZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpO1xufTtcblxudS5lcXVhbCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGEpID09PSBKU09OLnN0cmluZ2lmeShiKTtcbn07XG5cbnUuZXh0ZW5kID0gZnVuY3Rpb24ob2JqKSB7XG4gIGZvciAodmFyIHgsIG5hbWUsIGk9MSwgbGVuPWFyZ3VtZW50cy5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICB4ID0gYXJndW1lbnRzW2ldO1xuICAgIGZvciAobmFtZSBpbiB4KSB7IG9ialtuYW1lXSA9IHhbbmFtZV07IH1cbiAgfVxuICByZXR1cm4gb2JqO1xufTtcblxudS5rZXlzID0gZnVuY3Rpb24oeCkge1xuICB2YXIga2V5cyA9IFtdLCBrO1xuICBmb3IgKGsgaW4geCkga2V5cy5wdXNoKGspO1xuICByZXR1cm4ga2V5cztcbn07XG5cbnUudmFscyA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIHZhbHMgPSBbXSwgaztcbiAgZm9yIChrIGluIHgpIHZhbHMucHVzaCh4W2tdKTtcbiAgcmV0dXJuIHZhbHM7XG59O1xuXG51LnRvTWFwID0gZnVuY3Rpb24obGlzdCkge1xuICByZXR1cm4gbGlzdC5yZWR1Y2UoZnVuY3Rpb24ob2JqLCB4KSB7XG4gICAgcmV0dXJuIChvYmpbeF0gPSAxLCBvYmopO1xuICB9LCB7fSk7XG59O1xuXG51LmtleXN0ciA9IGZ1bmN0aW9uKHZhbHVlcykge1xuICAvLyB1c2UgdG8gZW5zdXJlIGNvbnNpc3RlbnQga2V5IGdlbmVyYXRpb24gYWNyb3NzIG1vZHVsZXNcbiAgcmV0dXJuIHZhbHVlcy5qb2luKFwifFwiKTtcbn07XG5cbi8vIGRhdGEgYWNjZXNzIGZ1bmN0aW9uc1xuXG51LmZpZWxkID0gZnVuY3Rpb24oZikge1xuICByZXR1cm4gZi5zcGxpdChcIlxcXFwuXCIpXG4gICAgLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkLnNwbGl0KFwiLlwiKTsgfSlcbiAgICAucmVkdWNlKGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgIGlmIChhLmxlbmd0aCkgeyBhW2EubGVuZ3RoLTFdICs9IFwiLlwiICsgYi5zaGlmdCgpOyB9XG4gICAgICBhLnB1c2guYXBwbHkoYSwgYik7XG4gICAgICByZXR1cm4gYTtcbiAgICB9LCBbXSk7XG59O1xuXG51LmFjY2Vzc29yID0gZnVuY3Rpb24oZikge1xuICB2YXIgcztcbiAgcmV0dXJuICh1LmlzRnVuY3Rpb24oZikgfHwgZj09bnVsbClcbiAgICA/IGYgOiB1LmlzU3RyaW5nKGYpICYmIChzPXUuZmllbGQoZikpLmxlbmd0aCA+IDFcbiAgICA/IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHMucmVkdWNlKGZ1bmN0aW9uKHgsZikge1xuICAgICAgICAgIHJldHVybiB4W2ZdO1xuICAgICAgICB9LCB4KTtcbiAgICAgIH1cbiAgICA6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHhbZl07IH07XG59O1xuXG51Lm11dGF0b3IgPSBmdW5jdGlvbihmKSB7XG4gIHZhciBzO1xuICByZXR1cm4gdS5pc1N0cmluZyhmKSAmJiAocz11LmZpZWxkKGYpKS5sZW5ndGggPiAxXG4gICAgPyBmdW5jdGlvbih4LCB2KSB7XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxzLmxlbmd0aC0xOyArK2kpIHggPSB4W3NbaV1dO1xuICAgICAgICB4W3NbaV1dID0gdjtcbiAgICAgIH1cbiAgICA6IGZ1bmN0aW9uKHgsIHYpIHsgeFtmXSA9IHY7IH07XG59O1xuXG5cbi8vIGNvbXBhcmlzb24gLyBzb3J0aW5nIGZ1bmN0aW9uc1xuXG51LmNvbXBhcmF0b3IgPSBmdW5jdGlvbihzb3J0KSB7XG4gIHZhciBzaWduID0gW107XG4gIGlmIChzb3J0ID09PSB1bmRlZmluZWQpIHNvcnQgPSBbXTtcbiAgc29ydCA9IHUuYXJyYXkoc29ydCkubWFwKGZ1bmN0aW9uKGYpIHtcbiAgICB2YXIgcyA9IDE7XG4gICAgaWYgICAgICAoZlswXSA9PT0gXCItXCIpIHsgcyA9IC0xOyBmID0gZi5zbGljZSgxKTsgfVxuICAgIGVsc2UgaWYgKGZbMF0gPT09IFwiK1wiKSB7IHMgPSArMTsgZiA9IGYuc2xpY2UoMSk7IH1cbiAgICBzaWduLnB1c2gocyk7XG4gICAgcmV0dXJuIHUuYWNjZXNzb3IoZik7XG4gIH0pO1xuICByZXR1cm4gZnVuY3Rpb24oYSxiKSB7XG4gICAgdmFyIGksIG4sIGYsIHgsIHk7XG4gICAgZm9yIChpPTAsIG49c29ydC5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgICBmID0gc29ydFtpXTsgeCA9IGYoYSk7IHkgPSBmKGIpO1xuICAgICAgaWYgKHggPCB5KSByZXR1cm4gLTEgKiBzaWduW2ldO1xuICAgICAgaWYgKHggPiB5KSByZXR1cm4gc2lnbltpXTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH07XG59O1xuXG51LmNtcCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgaWYgKGEgPCBiKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2UgaWYgKGEgPiBiKSB7XG4gICAgcmV0dXJuIDE7XG4gIH0gZWxzZSBpZiAoYSA+PSBiKSB7XG4gICAgcmV0dXJuIDA7XG4gIH0gZWxzZSBpZiAoYSA9PT0gbnVsbCAmJiBiID09PSBudWxsKSB7XG4gICAgcmV0dXJuIDA7XG4gIH0gZWxzZSBpZiAoYSA9PT0gbnVsbCkge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIGlmIChiID09PSBudWxsKSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgcmV0dXJuIE5hTjtcbn1cblxudS5udW1jbXAgPSBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIC0gYjsgfTtcblxudS5zdGFibGVzb3J0ID0gZnVuY3Rpb24oYXJyYXksIHNvcnRCeSwga2V5Rm4pIHtcbiAgdmFyIGluZGljZXMgPSBhcnJheS5yZWR1Y2UoZnVuY3Rpb24oaWR4LCB2LCBpKSB7XG4gICAgcmV0dXJuIChpZHhba2V5Rm4odildID0gaSwgaWR4KTtcbiAgfSwge30pO1xuXG4gIGFycmF5LnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciBzYSA9IHNvcnRCeShhKSxcbiAgICAgICAgc2IgPSBzb3J0QnkoYik7XG4gICAgcmV0dXJuIHNhIDwgc2IgPyAtMSA6IHNhID4gc2IgPyAxXG4gICAgICAgICA6IChpbmRpY2VzW2tleUZuKGEpXSAtIGluZGljZXNba2V5Rm4oYildKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGFycmF5O1xufTtcblxuLy8gc3RyaW5nIGZ1bmN0aW9uc1xuXG4vLyBFUzYgY29tcGF0aWJpbGl0eSBwZXIgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvU3RyaW5nL3N0YXJ0c1dpdGgjUG9seWZpbGxcbi8vIFdlIGNvdWxkIGhhdmUgdXNlZCB0aGUgcG9seWZpbGwgY29kZSwgYnV0IGxldHMgd2FpdCB1bnRpbCBFUzYgYmVjb21lcyBhIHN0YW5kYXJkIGZpcnN0XG51LnN0YXJ0c1dpdGggPSBTdHJpbmcucHJvdG90eXBlLnN0YXJ0c1dpdGhcbiAgPyBmdW5jdGlvbihzdHJpbmcsIHNlYXJjaFN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcuc3RhcnRzV2l0aChzZWFyY2hTdHJpbmcpO1xuICB9XG4gIDogZnVuY3Rpb24oc3RyaW5nLCBzZWFyY2hTdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLmxhc3RJbmRleE9mKHNlYXJjaFN0cmluZywgMCkgPT09IDA7XG4gIH07IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYi9oZWFwJyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuOC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBIZWFwLCBkZWZhdWx0Q21wLCBmbG9vciwgaGVhcGlmeSwgaGVhcHBvcCwgaGVhcHB1c2gsIGhlYXBwdXNocG9wLCBoZWFwcmVwbGFjZSwgaW5zb3J0LCBtaW4sIG5sYXJnZXN0LCBuc21hbGxlc3QsIHVwZGF0ZUl0ZW0sIF9zaWZ0ZG93biwgX3NpZnR1cDtcblxuICBmbG9vciA9IE1hdGguZmxvb3IsIG1pbiA9IE1hdGgubWluO1xuXG5cbiAgLypcbiAgRGVmYXVsdCBjb21wYXJpc29uIGZ1bmN0aW9uIHRvIGJlIHVzZWRcbiAgICovXG5cbiAgZGVmYXVsdENtcCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICBpZiAoeCA8IHkpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgaWYgKHggPiB5KSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH07XG5cblxuICAvKlxuICBJbnNlcnQgaXRlbSB4IGluIGxpc3QgYSwgYW5kIGtlZXAgaXQgc29ydGVkIGFzc3VtaW5nIGEgaXMgc29ydGVkLlxuICBcbiAgSWYgeCBpcyBhbHJlYWR5IGluIGEsIGluc2VydCBpdCB0byB0aGUgcmlnaHQgb2YgdGhlIHJpZ2h0bW9zdCB4LlxuICBcbiAgT3B0aW9uYWwgYXJncyBsbyAoZGVmYXVsdCAwKSBhbmQgaGkgKGRlZmF1bHQgYS5sZW5ndGgpIGJvdW5kIHRoZSBzbGljZVxuICBvZiBhIHRvIGJlIHNlYXJjaGVkLlxuICAgKi9cblxuICBpbnNvcnQgPSBmdW5jdGlvbihhLCB4LCBsbywgaGksIGNtcCkge1xuICAgIHZhciBtaWQ7XG4gICAgaWYgKGxvID09IG51bGwpIHtcbiAgICAgIGxvID0gMDtcbiAgICB9XG4gICAgaWYgKGNtcCA9PSBudWxsKSB7XG4gICAgICBjbXAgPSBkZWZhdWx0Q21wO1xuICAgIH1cbiAgICBpZiAobG8gPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2xvIG11c3QgYmUgbm9uLW5lZ2F0aXZlJyk7XG4gICAgfVxuICAgIGlmIChoaSA9PSBudWxsKSB7XG4gICAgICBoaSA9IGEubGVuZ3RoO1xuICAgIH1cbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgbWlkID0gZmxvb3IoKGxvICsgaGkpIC8gMik7XG4gICAgICBpZiAoY21wKHgsIGFbbWlkXSkgPCAwKSB7XG4gICAgICAgIGhpID0gbWlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG8gPSBtaWQgKyAxO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gKFtdLnNwbGljZS5hcHBseShhLCBbbG8sIGxvIC0gbG9dLmNvbmNhdCh4KSksIHgpO1xuICB9O1xuXG5cbiAgLypcbiAgUHVzaCBpdGVtIG9udG8gaGVhcCwgbWFpbnRhaW5pbmcgdGhlIGhlYXAgaW52YXJpYW50LlxuICAgKi9cblxuICBoZWFwcHVzaCA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBjbXApIHtcbiAgICBpZiAoY21wID09IG51bGwpIHtcbiAgICAgIGNtcCA9IGRlZmF1bHRDbXA7XG4gICAgfVxuICAgIGFycmF5LnB1c2goaXRlbSk7XG4gICAgcmV0dXJuIF9zaWZ0ZG93bihhcnJheSwgMCwgYXJyYXkubGVuZ3RoIC0gMSwgY21wKTtcbiAgfTtcblxuXG4gIC8qXG4gIFBvcCB0aGUgc21hbGxlc3QgaXRlbSBvZmYgdGhlIGhlYXAsIG1haW50YWluaW5nIHRoZSBoZWFwIGludmFyaWFudC5cbiAgICovXG5cbiAgaGVhcHBvcCA9IGZ1bmN0aW9uKGFycmF5LCBjbXApIHtcbiAgICB2YXIgbGFzdGVsdCwgcmV0dXJuaXRlbTtcbiAgICBpZiAoY21wID09IG51bGwpIHtcbiAgICAgIGNtcCA9IGRlZmF1bHRDbXA7XG4gICAgfVxuICAgIGxhc3RlbHQgPSBhcnJheS5wb3AoKTtcbiAgICBpZiAoYXJyYXkubGVuZ3RoKSB7XG4gICAgICByZXR1cm5pdGVtID0gYXJyYXlbMF07XG4gICAgICBhcnJheVswXSA9IGxhc3RlbHQ7XG4gICAgICBfc2lmdHVwKGFycmF5LCAwLCBjbXApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm5pdGVtID0gbGFzdGVsdDtcbiAgICB9XG4gICAgcmV0dXJuIHJldHVybml0ZW07XG4gIH07XG5cblxuICAvKlxuICBQb3AgYW5kIHJldHVybiB0aGUgY3VycmVudCBzbWFsbGVzdCB2YWx1ZSwgYW5kIGFkZCB0aGUgbmV3IGl0ZW0uXG4gIFxuICBUaGlzIGlzIG1vcmUgZWZmaWNpZW50IHRoYW4gaGVhcHBvcCgpIGZvbGxvd2VkIGJ5IGhlYXBwdXNoKCksIGFuZCBjYW4gYmVcbiAgbW9yZSBhcHByb3ByaWF0ZSB3aGVuIHVzaW5nIGEgZml4ZWQgc2l6ZSBoZWFwLiBOb3RlIHRoYXQgdGhlIHZhbHVlXG4gIHJldHVybmVkIG1heSBiZSBsYXJnZXIgdGhhbiBpdGVtISBUaGF0IGNvbnN0cmFpbnMgcmVhc29uYWJsZSB1c2Ugb2ZcbiAgdGhpcyByb3V0aW5lIHVubGVzcyB3cml0dGVuIGFzIHBhcnQgb2YgYSBjb25kaXRpb25hbCByZXBsYWNlbWVudDpcbiAgICAgIGlmIGl0ZW0gPiBhcnJheVswXVxuICAgICAgICBpdGVtID0gaGVhcHJlcGxhY2UoYXJyYXksIGl0ZW0pXG4gICAqL1xuXG4gIGhlYXByZXBsYWNlID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGNtcCkge1xuICAgIHZhciByZXR1cm5pdGVtO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgcmV0dXJuaXRlbSA9IGFycmF5WzBdO1xuICAgIGFycmF5WzBdID0gaXRlbTtcbiAgICBfc2lmdHVwKGFycmF5LCAwLCBjbXApO1xuICAgIHJldHVybiByZXR1cm5pdGVtO1xuICB9O1xuXG5cbiAgLypcbiAgRmFzdCB2ZXJzaW9uIG9mIGEgaGVhcHB1c2ggZm9sbG93ZWQgYnkgYSBoZWFwcG9wLlxuICAgKi9cblxuICBoZWFwcHVzaHBvcCA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBjbXApIHtcbiAgICB2YXIgX3JlZjtcbiAgICBpZiAoY21wID09IG51bGwpIHtcbiAgICAgIGNtcCA9IGRlZmF1bHRDbXA7XG4gICAgfVxuICAgIGlmIChhcnJheS5sZW5ndGggJiYgY21wKGFycmF5WzBdLCBpdGVtKSA8IDApIHtcbiAgICAgIF9yZWYgPSBbYXJyYXlbMF0sIGl0ZW1dLCBpdGVtID0gX3JlZlswXSwgYXJyYXlbMF0gPSBfcmVmWzFdO1xuICAgICAgX3NpZnR1cChhcnJheSwgMCwgY21wKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZW07XG4gIH07XG5cblxuICAvKlxuICBUcmFuc2Zvcm0gbGlzdCBpbnRvIGEgaGVhcCwgaW4tcGxhY2UsIGluIE8oYXJyYXkubGVuZ3RoKSB0aW1lLlxuICAgKi9cblxuICBoZWFwaWZ5ID0gZnVuY3Rpb24oYXJyYXksIGNtcCkge1xuICAgIHZhciBpLCBfaSwgX2osIF9sZW4sIF9yZWYsIF9yZWYxLCBfcmVzdWx0cywgX3Jlc3VsdHMxO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgX3JlZjEgPSAoZnVuY3Rpb24oKSB7XG4gICAgICBfcmVzdWx0czEgPSBbXTtcbiAgICAgIGZvciAodmFyIF9qID0gMCwgX3JlZiA9IGZsb29yKGFycmF5Lmxlbmd0aCAvIDIpOyAwIDw9IF9yZWYgPyBfaiA8IF9yZWYgOiBfaiA+IF9yZWY7IDAgPD0gX3JlZiA/IF9qKysgOiBfai0tKXsgX3Jlc3VsdHMxLnB1c2goX2opOyB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHMxO1xuICAgIH0pLmFwcGx5KHRoaXMpLnJldmVyc2UoKTtcbiAgICBfcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjEubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGkgPSBfcmVmMVtfaV07XG4gICAgICBfcmVzdWx0cy5wdXNoKF9zaWZ0dXAoYXJyYXksIGksIGNtcCkpO1xuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH07XG5cblxuICAvKlxuICBVcGRhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZSBnaXZlbiBpdGVtIGluIHRoZSBoZWFwLlxuICBUaGlzIGZ1bmN0aW9uIHNob3VsZCBiZSBjYWxsZWQgZXZlcnkgdGltZSB0aGUgaXRlbSBpcyBiZWluZyBtb2RpZmllZC5cbiAgICovXG5cbiAgdXBkYXRlSXRlbSA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBjbXApIHtcbiAgICB2YXIgcG9zO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgcG9zID0gYXJyYXkuaW5kZXhPZihpdGVtKTtcbiAgICBpZiAocG9zID09PSAtMSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBfc2lmdGRvd24oYXJyYXksIDAsIHBvcywgY21wKTtcbiAgICByZXR1cm4gX3NpZnR1cChhcnJheSwgcG9zLCBjbXApO1xuICB9O1xuXG5cbiAgLypcbiAgRmluZCB0aGUgbiBsYXJnZXN0IGVsZW1lbnRzIGluIGEgZGF0YXNldC5cbiAgICovXG5cbiAgbmxhcmdlc3QgPSBmdW5jdGlvbihhcnJheSwgbiwgY21wKSB7XG4gICAgdmFyIGVsZW0sIHJlc3VsdCwgX2ksIF9sZW4sIF9yZWY7XG4gICAgaWYgKGNtcCA9PSBudWxsKSB7XG4gICAgICBjbXAgPSBkZWZhdWx0Q21wO1xuICAgIH1cbiAgICByZXN1bHQgPSBhcnJheS5zbGljZSgwLCBuKTtcbiAgICBpZiAoIXJlc3VsdC5sZW5ndGgpIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIGhlYXBpZnkocmVzdWx0LCBjbXApO1xuICAgIF9yZWYgPSBhcnJheS5zbGljZShuKTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGVsZW0gPSBfcmVmW19pXTtcbiAgICAgIGhlYXBwdXNocG9wKHJlc3VsdCwgZWxlbSwgY21wKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC5zb3J0KGNtcCkucmV2ZXJzZSgpO1xuICB9O1xuXG5cbiAgLypcbiAgRmluZCB0aGUgbiBzbWFsbGVzdCBlbGVtZW50cyBpbiBhIGRhdGFzZXQuXG4gICAqL1xuXG4gIG5zbWFsbGVzdCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBjbXApIHtcbiAgICB2YXIgZWxlbSwgaSwgbG9zLCByZXN1bHQsIF9pLCBfaiwgX2xlbiwgX3JlZiwgX3JlZjEsIF9yZXN1bHRzO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgaWYgKG4gKiAxMCA8PSBhcnJheS5sZW5ndGgpIHtcbiAgICAgIHJlc3VsdCA9IGFycmF5LnNsaWNlKDAsIG4pLnNvcnQoY21wKTtcbiAgICAgIGlmICghcmVzdWx0Lmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgbG9zID0gcmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXTtcbiAgICAgIF9yZWYgPSBhcnJheS5zbGljZShuKTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBlbGVtID0gX3JlZltfaV07XG4gICAgICAgIGlmIChjbXAoZWxlbSwgbG9zKSA8IDApIHtcbiAgICAgICAgICBpbnNvcnQocmVzdWx0LCBlbGVtLCAwLCBudWxsLCBjbXApO1xuICAgICAgICAgIHJlc3VsdC5wb3AoKTtcbiAgICAgICAgICBsb3MgPSByZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBoZWFwaWZ5KGFycmF5LCBjbXApO1xuICAgIF9yZXN1bHRzID0gW107XG4gICAgZm9yIChpID0gX2ogPSAwLCBfcmVmMSA9IG1pbihuLCBhcnJheS5sZW5ndGgpOyAwIDw9IF9yZWYxID8gX2ogPCBfcmVmMSA6IF9qID4gX3JlZjE7IGkgPSAwIDw9IF9yZWYxID8gKytfaiA6IC0tX2opIHtcbiAgICAgIF9yZXN1bHRzLnB1c2goaGVhcHBvcChhcnJheSwgY21wKSk7XG4gICAgfVxuICAgIHJldHVybiBfcmVzdWx0cztcbiAgfTtcblxuICBfc2lmdGRvd24gPSBmdW5jdGlvbihhcnJheSwgc3RhcnRwb3MsIHBvcywgY21wKSB7XG4gICAgdmFyIG5ld2l0ZW0sIHBhcmVudCwgcGFyZW50cG9zO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgbmV3aXRlbSA9IGFycmF5W3Bvc107XG4gICAgd2hpbGUgKHBvcyA+IHN0YXJ0cG9zKSB7XG4gICAgICBwYXJlbnRwb3MgPSAocG9zIC0gMSkgPj4gMTtcbiAgICAgIHBhcmVudCA9IGFycmF5W3BhcmVudHBvc107XG4gICAgICBpZiAoY21wKG5ld2l0ZW0sIHBhcmVudCkgPCAwKSB7XG4gICAgICAgIGFycmF5W3Bvc10gPSBwYXJlbnQ7XG4gICAgICAgIHBvcyA9IHBhcmVudHBvcztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5W3Bvc10gPSBuZXdpdGVtO1xuICB9O1xuXG4gIF9zaWZ0dXAgPSBmdW5jdGlvbihhcnJheSwgcG9zLCBjbXApIHtcbiAgICB2YXIgY2hpbGRwb3MsIGVuZHBvcywgbmV3aXRlbSwgcmlnaHRwb3MsIHN0YXJ0cG9zO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgZW5kcG9zID0gYXJyYXkubGVuZ3RoO1xuICAgIHN0YXJ0cG9zID0gcG9zO1xuICAgIG5ld2l0ZW0gPSBhcnJheVtwb3NdO1xuICAgIGNoaWxkcG9zID0gMiAqIHBvcyArIDE7XG4gICAgd2hpbGUgKGNoaWxkcG9zIDwgZW5kcG9zKSB7XG4gICAgICByaWdodHBvcyA9IGNoaWxkcG9zICsgMTtcbiAgICAgIGlmIChyaWdodHBvcyA8IGVuZHBvcyAmJiAhKGNtcChhcnJheVtjaGlsZHBvc10sIGFycmF5W3JpZ2h0cG9zXSkgPCAwKSkge1xuICAgICAgICBjaGlsZHBvcyA9IHJpZ2h0cG9zO1xuICAgICAgfVxuICAgICAgYXJyYXlbcG9zXSA9IGFycmF5W2NoaWxkcG9zXTtcbiAgICAgIHBvcyA9IGNoaWxkcG9zO1xuICAgICAgY2hpbGRwb3MgPSAyICogcG9zICsgMTtcbiAgICB9XG4gICAgYXJyYXlbcG9zXSA9IG5ld2l0ZW07XG4gICAgcmV0dXJuIF9zaWZ0ZG93bihhcnJheSwgc3RhcnRwb3MsIHBvcywgY21wKTtcbiAgfTtcblxuICBIZWFwID0gKGZ1bmN0aW9uKCkge1xuICAgIEhlYXAucHVzaCA9IGhlYXBwdXNoO1xuXG4gICAgSGVhcC5wb3AgPSBoZWFwcG9wO1xuXG4gICAgSGVhcC5yZXBsYWNlID0gaGVhcHJlcGxhY2U7XG5cbiAgICBIZWFwLnB1c2hwb3AgPSBoZWFwcHVzaHBvcDtcblxuICAgIEhlYXAuaGVhcGlmeSA9IGhlYXBpZnk7XG5cbiAgICBIZWFwLnVwZGF0ZUl0ZW0gPSB1cGRhdGVJdGVtO1xuXG4gICAgSGVhcC5ubGFyZ2VzdCA9IG5sYXJnZXN0O1xuXG4gICAgSGVhcC5uc21hbGxlc3QgPSBuc21hbGxlc3Q7XG5cbiAgICBmdW5jdGlvbiBIZWFwKGNtcCkge1xuICAgICAgdGhpcy5jbXAgPSBjbXAgIT0gbnVsbCA/IGNtcCA6IGRlZmF1bHRDbXA7XG4gICAgICB0aGlzLm5vZGVzID0gW107XG4gICAgfVxuXG4gICAgSGVhcC5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiBoZWFwcHVzaCh0aGlzLm5vZGVzLCB4LCB0aGlzLmNtcCk7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGhlYXBwb3AodGhpcy5ub2RlcywgdGhpcy5jbXApO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5wZWVrID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5ub2Rlc1swXTtcbiAgICB9O1xuXG4gICAgSGVhcC5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gdGhpcy5ub2Rlcy5pbmRleE9mKHgpICE9PSAtMTtcbiAgICB9O1xuXG4gICAgSGVhcC5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiBoZWFwcmVwbGFjZSh0aGlzLm5vZGVzLCB4LCB0aGlzLmNtcCk7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLnB1c2hwb3AgPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gaGVhcHB1c2hwb3AodGhpcy5ub2RlcywgeCwgdGhpcy5jbXApO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5oZWFwaWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gaGVhcGlmeSh0aGlzLm5vZGVzLCB0aGlzLmNtcCk7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLnVwZGF0ZUl0ZW0gPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gdXBkYXRlSXRlbSh0aGlzLm5vZGVzLCB4LCB0aGlzLmNtcCk7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5ub2RlcyA9IFtdO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5lbXB0eSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMubm9kZXMubGVuZ3RoID09PSAwO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5ub2Rlcy5sZW5ndGg7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaGVhcDtcbiAgICAgIGhlYXAgPSBuZXcgSGVhcCgpO1xuICAgICAgaGVhcC5ub2RlcyA9IHRoaXMubm9kZXMuc2xpY2UoMCk7XG4gICAgICByZXR1cm4gaGVhcDtcbiAgICB9O1xuXG4gICAgSGVhcC5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMubm9kZXMuc2xpY2UoMCk7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLmluc2VydCA9IEhlYXAucHJvdG90eXBlLnB1c2g7XG5cbiAgICBIZWFwLnByb3RvdHlwZS50b3AgPSBIZWFwLnByb3RvdHlwZS5wZWVrO1xuXG4gICAgSGVhcC5wcm90b3R5cGUuZnJvbnQgPSBIZWFwLnByb3RvdHlwZS5wZWVrO1xuXG4gICAgSGVhcC5wcm90b3R5cGUuaGFzID0gSGVhcC5wcm90b3R5cGUuY29udGFpbnM7XG5cbiAgICBIZWFwLnByb3RvdHlwZS5jb3B5ID0gSGVhcC5wcm90b3R5cGUuY2xvbmU7XG5cbiAgICByZXR1cm4gSGVhcDtcblxuICB9KSgpO1xuXG4gIChmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgcmV0dXJuIGRlZmluZShbXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybiBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHJvb3QuSGVhcCA9IGZhY3RvcnkoKTtcbiAgICB9XG4gIH0pKHRoaXMsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBIZWFwO1xuICB9KTtcblxufSkuY2FsbCh0aGlzKTtcbiIsInZhciBib3VuZHMgPSBmdW5jdGlvbihiKSB7XG4gIHRoaXMuY2xlYXIoKTtcbiAgaWYgKGIpIHRoaXMudW5pb24oYik7XG59O1xuXG52YXIgcHJvdG90eXBlID0gYm91bmRzLnByb3RvdHlwZTtcblxucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMueDEgPSArTnVtYmVyLk1BWF9WQUxVRTtcbiAgdGhpcy55MSA9ICtOdW1iZXIuTUFYX1ZBTFVFO1xuICB0aGlzLngyID0gLU51bWJlci5NQVhfVkFMVUU7XG4gIHRoaXMueTIgPSAtTnVtYmVyLk1BWF9WQUxVRTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIpIHtcbiAgdGhpcy54MSA9IHgxO1xuICB0aGlzLnkxID0geTE7XG4gIHRoaXMueDIgPSB4MjtcbiAgdGhpcy55MiA9IHkyO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmICh4IDwgdGhpcy54MSkgdGhpcy54MSA9IHg7XG4gIGlmICh5IDwgdGhpcy55MSkgdGhpcy55MSA9IHk7XG4gIGlmICh4ID4gdGhpcy54MikgdGhpcy54MiA9IHg7XG4gIGlmICh5ID4gdGhpcy55MikgdGhpcy55MiA9IHk7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLmV4cGFuZCA9IGZ1bmN0aW9uKGQpIHtcbiAgdGhpcy54MSAtPSBkO1xuICB0aGlzLnkxIC09IGQ7XG4gIHRoaXMueDIgKz0gZDtcbiAgdGhpcy55MiArPSBkO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5yb3VuZCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLngxID0gTWF0aC5mbG9vcih0aGlzLngxKTtcbiAgdGhpcy55MSA9IE1hdGguZmxvb3IodGhpcy55MSk7XG4gIHRoaXMueDIgPSBNYXRoLmNlaWwodGhpcy54Mik7XG4gIHRoaXMueTIgPSBNYXRoLmNlaWwodGhpcy55Mik7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGR4LCBkeSkge1xuICB0aGlzLngxICs9IGR4O1xuICB0aGlzLngyICs9IGR4O1xuICB0aGlzLnkxICs9IGR5O1xuICB0aGlzLnkyICs9IGR5O1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbihhbmdsZSwgeCwgeSkge1xuICB2YXIgY29zID0gTWF0aC5jb3MoYW5nbGUpLFxuICAgICAgc2luID0gTWF0aC5zaW4oYW5nbGUpLFxuICAgICAgY3ggPSB4IC0geCpjb3MgKyB5KnNpbixcbiAgICAgIGN5ID0geSAtIHgqc2luIC0geSpjb3MsXG4gICAgICB4MSA9IHRoaXMueDEsIHgyID0gdGhpcy54MixcbiAgICAgIHkxID0gdGhpcy55MSwgeTIgPSB0aGlzLnkyO1xuXG4gIHJldHVybiB0aGlzLmNsZWFyKClcbiAgICAuYWRkKGNvcyp4MSAtIHNpbip5MSArIGN4LCAgc2luKngxICsgY29zKnkxICsgY3kpXG4gICAgLmFkZChjb3MqeDEgLSBzaW4qeTIgKyBjeCwgIHNpbip4MSArIGNvcyp5MiArIGN5KVxuICAgIC5hZGQoY29zKngyIC0gc2luKnkxICsgY3gsICBzaW4qeDIgKyBjb3MqeTEgKyBjeSlcbiAgICAuYWRkKGNvcyp4MiAtIHNpbip5MiArIGN4LCAgc2luKngyICsgY29zKnkyICsgY3kpO1xufVxuXG5wcm90b3R5cGUudW5pb24gPSBmdW5jdGlvbihiKSB7XG4gIGlmIChiLngxIDwgdGhpcy54MSkgdGhpcy54MSA9IGIueDE7XG4gIGlmIChiLnkxIDwgdGhpcy55MSkgdGhpcy55MSA9IGIueTE7XG4gIGlmIChiLngyID4gdGhpcy54MikgdGhpcy54MiA9IGIueDI7XG4gIGlmIChiLnkyID4gdGhpcy55MikgdGhpcy55MiA9IGIueTI7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLmVuY2xvc2VzID0gZnVuY3Rpb24oYikge1xuICByZXR1cm4gYiAmJiAoXG4gICAgdGhpcy54MSA8PSBiLngxICYmXG4gICAgdGhpcy54MiA+PSBiLngyICYmXG4gICAgdGhpcy55MSA8PSBiLnkxICYmXG4gICAgdGhpcy55MiA+PSBiLnkyXG4gICk7XG59O1xuXG5wcm90b3R5cGUuaW50ZXJzZWN0cyA9IGZ1bmN0aW9uKGIpIHtcbiAgcmV0dXJuIGIgJiYgIShcbiAgICB0aGlzLngyIDwgYi54MSB8fFxuICAgIHRoaXMueDEgPiBiLngyIHx8XG4gICAgdGhpcy55MiA8IGIueTEgfHxcbiAgICB0aGlzLnkxID4gYi55MlxuICApO1xufTtcblxucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24oeCwgeSkge1xuICByZXR1cm4gIShcbiAgICB4IDwgdGhpcy54MSB8fFxuICAgIHggPiB0aGlzLngyIHx8XG4gICAgeSA8IHRoaXMueTEgfHxcbiAgICB5ID4gdGhpcy55MlxuICApO1xufTtcblxucHJvdG90eXBlLndpZHRoID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLngyIC0gdGhpcy54MTtcbn07XG5cbnByb3RvdHlwZS5oZWlnaHQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMueTIgLSB0aGlzLnkxO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBib3VuZHM7IiwidmFyIEdyYXBoID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvR3JhcGgnKSwgXG4gICAgTm9kZSAgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Ob2RlJyksXG4gICAgR3JvdXBCdWlsZGVyID0gcmVxdWlyZSgnLi4vc2NlbmUvR3JvdXBCdWlsZGVyJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0JyksIFxuICAgIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpO1xuXG5mdW5jdGlvbiBNb2RlbCgpIHtcbiAgdGhpcy5fZGVmcyA9IHt9O1xuICB0aGlzLl9wcmVkaWNhdGVzID0ge307XG4gIHRoaXMuX3NjZW5lID0gbnVsbDtcblxuICB0aGlzLmdyYXBoID0gbmV3IEdyYXBoKCk7XG5cbiAgdGhpcy5fbm9kZSA9IG5ldyBOb2RlKHRoaXMuZ3JhcGgpO1xuICB0aGlzLl9idWlsZGVyID0gbnVsbDsgLy8gVG9wLWxldmVsIHNjZW5lZ3JhcGggYnVpbGRlclxufTtcblxudmFyIHByb3RvID0gTW9kZWwucHJvdG90eXBlO1xuXG5wcm90by5kZWZzID0gZnVuY3Rpb24oZGVmcykge1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9kZWZzO1xuICB0aGlzLl9kZWZzID0gZGVmcztcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5kYXRhID0gZnVuY3Rpb24oKSB7XG4gIHZhciBkYXRhID0gdGhpcy5ncmFwaC5kYXRhLmFwcGx5KHRoaXMuZ3JhcGgsIGFyZ3VtZW50cyk7XG4gIGlmKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7ICAvLyBuZXcgRGF0YXNvdXJjZVxuICAgIHRoaXMuX25vZGUuYWRkTGlzdGVuZXIoZGF0YS5waXBlbGluZSgpWzBdKTtcbiAgfVxuXG4gIHJldHVybiBkYXRhO1xufTtcblxuZnVuY3Rpb24gcHJlZGljYXRlcyhuYW1lKSB7XG4gIHZhciBtID0gdGhpcywgcHJlZGljYXRlcyA9IHt9O1xuICBpZighZGwuaXNBcnJheShuYW1lKSkgcmV0dXJuIHRoaXMuX3ByZWRpY2F0ZXNbbmFtZV07XG4gIG5hbWUuZm9yRWFjaChmdW5jdGlvbihuKSB7IHByZWRpY2F0ZXNbbl0gPSBtLl9wcmVkaWNhdGVzW25dIH0pO1xuICByZXR1cm4gcHJlZGljYXRlcztcbn1cblxucHJvdG8ucHJlZGljYXRlID0gZnVuY3Rpb24obmFtZSwgcHJlZGljYXRlKSB7XG4gIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHJldHVybiBwcmVkaWNhdGVzLmNhbGwodGhpcywgbmFtZSk7XG4gIHJldHVybiAodGhpcy5fcHJlZGljYXRlc1tuYW1lXSA9IHByZWRpY2F0ZSk7XG59O1xuXG5wcm90by5wcmVkaWNhdGVzID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl9wcmVkaWNhdGVzOyB9O1xuXG5wcm90by5zY2VuZSA9IGZ1bmN0aW9uKHJlbmRlcmVyKSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fc2NlbmU7XG4gIGlmKHRoaXMuX2J1aWxkZXIpIHRoaXMuX25vZGUucmVtb3ZlTGlzdGVuZXIodGhpcy5fYnVpbGRlci5kaXNjb25uZWN0KCkpO1xuICB0aGlzLl9idWlsZGVyID0gbmV3IEdyb3VwQnVpbGRlcih0aGlzLCB0aGlzLl9kZWZzLm1hcmtzLCB0aGlzLl9zY2VuZT17fSk7XG4gIHRoaXMuX25vZGUuYWRkTGlzdGVuZXIodGhpcy5fYnVpbGRlci5jb25uZWN0KCkpO1xuICB2YXIgcCA9IHRoaXMuX2J1aWxkZXIucGlwZWxpbmUoKTtcbiAgcFtwLmxlbmd0aC0xXS5hZGRMaXN0ZW5lcihyZW5kZXJlcik7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8uYWRkTGlzdGVuZXIgPSBmdW5jdGlvbihsKSB7IHRoaXMuX25vZGUuYWRkTGlzdGVuZXIobCk7IH07XG5wcm90by5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKGwpIHsgdGhpcy5fbm9kZS5yZW1vdmVMaXN0ZW5lcihsKTsgfTtcblxucHJvdG8uZmlyZSA9IGZ1bmN0aW9uKGNzKSB7XG4gIGlmKCFjcykgY3MgPSBjaGFuZ2VzZXQuY3JlYXRlKCk7XG4gIHRoaXMuZ3JhcGgucHJvcGFnYXRlKGNzLCB0aGlzLl9ub2RlKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7IiwidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgTm9kZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L05vZGUnKSxcbiAgICBwYXJzZVN0cmVhbXMgPSByZXF1aXJlKCcuLi9wYXJzZS9zdHJlYW1zJyksXG4gICAgY2FudmFzID0gcmVxdWlyZSgnLi4vcmVuZGVyL2NhbnZhcy9pbmRleCcpLFxuICAgIHN2ZyA9IHJlcXVpcmUoJy4uL3JlbmRlci9zdmcvaW5kZXgnKSxcbiAgICBUcmFuc2l0aW9uID0gcmVxdWlyZSgnLi4vc2NlbmUvVHJhbnNpdGlvbicpLFxuICAgIGNvbmZpZyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uZmlnJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0Jyk7XG5cbnZhciBWaWV3ID0gZnVuY3Rpb24oZWwsIHdpZHRoLCBoZWlnaHQsIG1vZGVsKSB7XG4gIHRoaXMuX2VsICAgID0gbnVsbDtcbiAgdGhpcy5fbW9kZWwgPSBudWxsO1xuICB0aGlzLl93aWR0aCA9IHRoaXMuX193aWR0aCA9IHdpZHRoIHx8IDUwMDtcbiAgdGhpcy5faGVpZ2h0ID0gdGhpcy5fX2hlaWdodCA9IGhlaWdodCB8fCAzMDA7XG4gIHRoaXMuX2F1dG9wYWQgPSAxO1xuICB0aGlzLl9wYWRkaW5nID0ge3RvcDowLCBsZWZ0OjAsIGJvdHRvbTowLCByaWdodDowfTtcbiAgdGhpcy5fdmlld3BvcnQgPSBudWxsO1xuICB0aGlzLl9yZW5kZXJlciA9IG51bGw7XG4gIHRoaXMuX2hhbmRsZXIgPSBudWxsO1xuICB0aGlzLl9pbyA9IGNhbnZhcztcbiAgaWYgKGVsKSB0aGlzLmluaXRpYWxpemUoZWwpO1xufTtcblxudmFyIHByb3RvdHlwZSA9IFZpZXcucHJvdG90eXBlO1xuXG5wcm90b3R5cGUubW9kZWwgPSBmdW5jdGlvbihtb2RlbCkge1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9tb2RlbDtcbiAgaWYgKHRoaXMuX21vZGVsICE9PSBtb2RlbCkge1xuICAgIHRoaXMuX21vZGVsID0gbW9kZWw7XG4gICAgaWYgKHRoaXMuX2hhbmRsZXIpIHRoaXMuX2hhbmRsZXIubW9kZWwobW9kZWwpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLmRhdGEgPSBmdW5jdGlvbihkYXRhKSB7XG4gIHZhciBtID0gdGhpcy5tb2RlbCgpO1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBtLmRhdGEoKTtcbiAgZGwua2V5cyhkYXRhKS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgbS5kYXRhKGQpLmFkZChkbC5kdXBsaWNhdGUoZGF0YVtkXSkpOyB9KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUud2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9fd2lkdGg7XG4gIGlmICh0aGlzLl9fd2lkdGggIT09IHdpZHRoKSB7XG4gICAgdGhpcy5fd2lkdGggPSB0aGlzLl9fd2lkdGggPSB3aWR0aDtcbiAgICBpZiAodGhpcy5fZWwpIHRoaXMuaW5pdGlhbGl6ZSh0aGlzLl9lbC5wYXJlbnROb2RlKTtcbiAgICBpZiAodGhpcy5fc3RyaWN0KSB0aGlzLl9hdXRvcGFkID0gMTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5oZWlnaHQgPSBmdW5jdGlvbihoZWlnaHQpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fX2hlaWdodDtcbiAgaWYgKHRoaXMuX19oZWlnaHQgIT09IGhlaWdodCkge1xuICAgIHRoaXMuX2hlaWdodCA9IHRoaXMuX19oZWlnaHQgPSBoZWlnaHQ7XG4gICAgaWYgKHRoaXMuX2VsKSB0aGlzLmluaXRpYWxpemUodGhpcy5fZWwucGFyZW50Tm9kZSk7XG4gICAgaWYgKHRoaXMuX3N0cmljdCkgdGhpcy5fYXV0b3BhZCA9IDE7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUucGFkZGluZyA9IGZ1bmN0aW9uKHBhZCkge1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9wYWRkaW5nO1xuICBpZiAodGhpcy5fcGFkZGluZyAhPT0gcGFkKSB7XG4gICAgaWYgKGRsLmlzU3RyaW5nKHBhZCkpIHtcbiAgICAgIHRoaXMuX2F1dG9wYWQgPSAxO1xuICAgICAgdGhpcy5fcGFkZGluZyA9IHt0b3A6MCwgbGVmdDowLCBib3R0b206MCwgcmlnaHQ6MH07XG4gICAgICB0aGlzLl9zdHJpY3QgPSAocGFkID09PSBcInN0cmljdFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYXV0b3BhZCA9IDA7XG4gICAgICB0aGlzLl9wYWRkaW5nID0gcGFkO1xuICAgICAgdGhpcy5fc3RyaWN0ID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLl9lbCkge1xuICAgICAgdGhpcy5fcmVuZGVyZXIucmVzaXplKHRoaXMuX3dpZHRoLCB0aGlzLl9oZWlnaHQsIHBhZCk7XG4gICAgICB0aGlzLl9oYW5kbGVyLnBhZGRpbmcocGFkKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUuYXV0b3BhZCA9IGZ1bmN0aW9uKG9wdCkge1xuICBpZiAodGhpcy5fYXV0b3BhZCA8IDEpIHJldHVybiB0aGlzO1xuICBlbHNlIHRoaXMuX2F1dG9wYWQgPSAwO1xuXG4gIHZhciBwYWQgPSB0aGlzLl9wYWRkaW5nLFxuICAgICAgYiA9IHRoaXMubW9kZWwoKS5zY2VuZSgpLmJvdW5kcyxcbiAgICAgIGluc2V0ID0gY29uZmlnLmF1dG9wYWRJbnNldCxcbiAgICAgIGwgPSBiLngxIDwgMCA/IE1hdGguY2VpbCgtYi54MSkgKyBpbnNldCA6IDAsXG4gICAgICB0ID0gYi55MSA8IDAgPyBNYXRoLmNlaWwoLWIueTEpICsgaW5zZXQgOiAwLFxuICAgICAgciA9IGIueDIgPiB0aGlzLl93aWR0aCAgPyBNYXRoLmNlaWwoK2IueDIgLSB0aGlzLl93aWR0aCkgKyBpbnNldCA6IDAsXG4gICAgICBiID0gYi55MiA+IHRoaXMuX2hlaWdodCA/IE1hdGguY2VpbCgrYi55MiAtIHRoaXMuX2hlaWdodCkgKyBpbnNldCA6IDA7XG4gIHBhZCA9IHtsZWZ0OmwsIHRvcDp0LCByaWdodDpyLCBib3R0b206Yn07XG5cbiAgaWYgKHRoaXMuX3N0cmljdCkge1xuICAgIHRoaXMuX2F1dG9wYWQgPSAwO1xuICAgIHRoaXMuX3BhZGRpbmcgPSBwYWQ7XG4gICAgdGhpcy5fd2lkdGggPSBNYXRoLm1heCgwLCB0aGlzLl9fd2lkdGggLSAobCtyKSk7XG4gICAgdGhpcy5faGVpZ2h0ID0gTWF0aC5tYXgoMCwgdGhpcy5fX2hlaWdodCAtICh0K2IpKTtcbiAgICB0aGlzLl9tb2RlbC53aWR0aCh0aGlzLl93aWR0aCk7XG4gICAgdGhpcy5fbW9kZWwuaGVpZ2h0KHRoaXMuX2hlaWdodCk7XG4gICAgaWYgKHRoaXMuX2VsKSB0aGlzLmluaXRpYWxpemUodGhpcy5fZWwucGFyZW50Tm9kZSk7XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnBhZGRpbmcocGFkKS51cGRhdGUob3B0KTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS52aWV3cG9ydCA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fdmlld3BvcnQ7XG4gIGlmICh0aGlzLl92aWV3cG9ydCAhPT0gc2l6ZSkge1xuICAgIHRoaXMuX3ZpZXdwb3J0ID0gc2l6ZTtcbiAgICBpZiAodGhpcy5fZWwpIHRoaXMuaW5pdGlhbGl6ZSh0aGlzLl9lbC5wYXJlbnROb2RlKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5yZW5kZXJlciA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5faW87XG4gIGlmICh0eXBlID09PSBcImNhbnZhc1wiKSB0eXBlID0gY2FudmFzO1xuICBpZiAodHlwZSA9PT0gXCJzdmdcIikgdHlwZSA9IHN2ZztcbiAgaWYgKHRoaXMuX2lvICE9PSB0eXBlKSB7XG4gICAgdGhpcy5faW8gPSB0eXBlO1xuICAgIHRoaXMuX3JlbmRlcmVyID0gbnVsbDtcbiAgICBpZiAodGhpcy5fZWwpIHRoaXMuaW5pdGlhbGl6ZSh0aGlzLl9lbC5wYXJlbnROb2RlKTtcbiAgICBpZiAodGhpcy5fYnVpbGQpIHRoaXMucmVuZGVyKCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKGVsKSB7XG4gIHZhciB2ID0gdGhpcywgcHJldkhhbmRsZXIsXG4gICAgICB3ID0gdi5fd2lkdGgsIGggPSB2Ll9oZWlnaHQsIHBhZCA9IHYuX3BhZGRpbmc7XG4gIFxuICAvLyBjbGVhciBwcmUtZXhpc3RpbmcgY29udGFpbmVyXG4gIGQzLnNlbGVjdChlbCkuc2VsZWN0KFwiZGl2LnZlZ2FcIikucmVtb3ZlKCk7XG4gIFxuICAvLyBhZGQgZGl2IGNvbnRhaW5lclxuICB0aGlzLl9lbCA9IGVsID0gZDMuc2VsZWN0KGVsKVxuICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwidmVnYVwiKVxuICAgIC5zdHlsZShcInBvc2l0aW9uXCIsIFwicmVsYXRpdmVcIilcbiAgICAubm9kZSgpO1xuICBpZiAodi5fdmlld3BvcnQpIHtcbiAgICBkMy5zZWxlY3QoZWwpXG4gICAgICAuc3R5bGUoXCJ3aWR0aFwiLCAgKHYuX3ZpZXdwb3J0WzBdIHx8IHcpK1wicHhcIilcbiAgICAgIC5zdHlsZShcImhlaWdodFwiLCAodi5fdmlld3BvcnRbMV0gfHwgaCkrXCJweFwiKVxuICAgICAgLnN0eWxlKFwib3ZlcmZsb3dcIiwgXCJhdXRvXCIpO1xuICB9XG4gIFxuICAvLyByZW5kZXJlclxuICB2Ll9yZW5kZXJlciA9ICh2Ll9yZW5kZXJlciB8fCBuZXcgdGhpcy5faW8uUmVuZGVyZXIoKSlcbiAgICAuaW5pdGlhbGl6ZShlbCwgdywgaCwgcGFkKTtcbiAgXG4gIC8vIGlucHV0IGhhbmRsZXJcbiAgcHJldkhhbmRsZXIgPSB2Ll9oYW5kbGVyO1xuICB2Ll9oYW5kbGVyID0gbmV3IHRoaXMuX2lvLkhhbmRsZXIoKVxuICAgIC5pbml0aWFsaXplKGVsLCBwYWQsIHYpXG4gICAgLm1vZGVsKHYuX21vZGVsKTtcblxuICBpZiAocHJldkhhbmRsZXIpIHtcbiAgICBwcmV2SGFuZGxlci5oYW5kbGVycygpLmZvckVhY2goZnVuY3Rpb24oaCkge1xuICAgICAgdi5faGFuZGxlci5vbihoLnR5cGUsIGguaGFuZGxlcik7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gUmVnaXN0ZXIgZXZlbnQgbGlzdGVuZXJzIGZvciBzaWduYWwgc3RyZWFtIGRlZmluaXRpb25zLlxuICAgIHBhcnNlU3RyZWFtcyh0aGlzKTtcbiAgfVxuICBcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24ob3B0KSB7ICAgIFxuICBvcHQgPSBvcHQgfHwge307XG4gIHZhciB2ID0gdGhpcyxcbiAgICAgIHRyYW5zID0gb3B0LmR1cmF0aW9uXG4gICAgICAgID8gbmV3IFRyYW5zaXRpb24ob3B0LmR1cmF0aW9uLCBvcHQuZWFzZSlcbiAgICAgICAgOiBudWxsO1xuXG4gIC8vIFRPRE86IHdpdGggc3RyZWFtaW5nIGRhdGEgQVBJLCBhZGRzIHNob3VsZCBkbC5kdXBsaWNhdGUganVzdCBwYXJzZVNwZWNcbiAgLy8gdG8gcHJldmVudCBWZWdhIGZyb20gcG9sbHV0aW5nIHRoZSBlbnZpcm9ubWVudC5cblxuICB2YXIgY3MgPSBjaGFuZ2VzZXQuY3JlYXRlKCk7XG4gIGlmKHRyYW5zKSBjcy50cmFucyA9IHRyYW5zO1xuICBpZihvcHQucmVmbG93ICE9PSB1bmRlZmluZWQpIGNzLnJlZmxvdyA9IG9wdC5yZWZsb3dcblxuICBpZighdi5fYnVpbGQpIHtcbiAgICB2Ll9yZW5kZXJOb2RlID0gbmV3IE5vZGUodi5fbW9kZWwuZ3JhcGgpXG4gICAgICAucm91dGVyKHRydWUpO1xuXG4gICAgdi5fcmVuZGVyTm9kZS5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICBkZWJ1ZyhpbnB1dCwgW1wicmVuZGVyaW5nXCJdKTtcblxuICAgICAgdmFyIHMgPSB2Ll9tb2RlbC5zY2VuZSgpO1xuICAgICAgaWYoaW5wdXQudHJhbnMpIHtcbiAgICAgICAgaW5wdXQudHJhbnMuc3RhcnQoZnVuY3Rpb24oaXRlbXMpIHsgdi5fcmVuZGVyZXIucmVuZGVyKHMsIGl0ZW1zKTsgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2Ll9yZW5kZXJlci5yZW5kZXIocyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEZvciBhbGwgdXBkYXRlZCBkYXRhc291cmNlcywgZmluYWxpemUgdGhlaXIgY2hhbmdlc2V0cy5cbiAgICAgIHZhciBkLCBkcztcbiAgICAgIGZvcihkIGluIGlucHV0LmRhdGEpIHtcbiAgICAgICAgZHMgPSB2Ll9tb2RlbC5kYXRhKGQpO1xuICAgICAgICBpZighZHMucmV2aXNlcygpKSBjb250aW51ZTtcbiAgICAgICAgY2hhbmdlc2V0LmZpbmFsaXplKGRzLmxhc3QoKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9O1xuXG4gICAgdi5fbW9kZWwuc2NlbmUodi5fcmVuZGVyTm9kZSk7XG4gICAgdi5fYnVpbGQgPSB0cnVlO1xuICB9XG5cbiAgLy8gUHVsc2UgdGhlIGVudGlyZSBtb2RlbCAoRGF0YXNvdXJjZXMgKyBzY2VuZSkuXG4gIHYuX21vZGVsLmZpcmUoY3MpO1xuXG4gIHJldHVybiB2LmF1dG9wYWQob3B0KTtcbn07XG5cbnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9oYW5kbGVyLm9uLmFwcGx5KHRoaXMuX2hhbmRsZXIsIGFyZ3VtZW50cyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9oYW5kbGVyLm9mZi5hcHBseSh0aGlzLl9oYW5kbGVyLCBhcmd1bWVudHMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cblZpZXcuZmFjdG9yeSA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gIHJldHVybiBmdW5jdGlvbihvcHQpIHtcbiAgICBvcHQgPSBvcHQgfHwge307XG4gICAgdmFyIGRlZnMgPSBtb2RlbC5kZWZzKCk7XG4gICAgdmFyIHYgPSBuZXcgVmlldygpXG4gICAgICAubW9kZWwobW9kZWwpXG4gICAgICAud2lkdGgoZGVmcy53aWR0aClcbiAgICAgIC5oZWlnaHQoZGVmcy5oZWlnaHQpXG4gICAgICAucGFkZGluZyhkZWZzLnBhZGRpbmcpXG4gICAgICAucmVuZGVyZXIob3B0LnJlbmRlcmVyIHx8IFwiY2FudmFzXCIpO1xuXG4gICAgaWYgKG9wdC5lbCkgdi5pbml0aWFsaXplKG9wdC5lbCk7XG4gICAgaWYgKG9wdC5kYXRhKSB2LmRhdGEob3B0LmRhdGEpO1xuICBcbiAgICByZXR1cm4gdjtcbiAgfTsgICAgXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXc7IiwidmFyIE5vZGUgPSByZXF1aXJlKCcuL05vZGUnKSxcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCcuL2NoYW5nZXNldCcpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBDb2xsZWN0b3IoZ3JhcGgpIHtcbiAgTm9kZS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgdGhpcy5fZGF0YSA9IFtdO1xuICByZXR1cm4gdGhpcy5yb3V0ZXIodHJ1ZSlcbiAgICAuY29sbGVjdG9yKHRydWUpO1xufVxuXG52YXIgcHJvdG8gPSAoQ29sbGVjdG9yLnByb3RvdHlwZSA9IG5ldyBOb2RlKCkpO1xuXG5wcm90by5kYXRhID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl9kYXRhOyB9XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgZGVidWcoaW5wdXQsIFtcImNvbGxlY3RpbmdcIl0pO1xuXG4gIGlmIChpbnB1dC5yZWZsb3cpIHtcbiAgICBpbnB1dCA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpO1xuICAgIGlucHV0Lm1vZCA9IHRoaXMuX2RhdGEuc2xpY2UoKTtcbiAgICByZXR1cm4gaW5wdXQ7XG4gIH1cblxuICBpZiAoaW5wdXQucmVtLmxlbmd0aCkge1xuICAgIHZhciBpZHMgPSBpbnB1dC5yZW0ucmVkdWNlKGZ1bmN0aW9uKG0seCkgeyByZXR1cm4gKG1beC5faWRdPTEsIG0pOyB9LCB7fSk7XG4gICAgdGhpcy5fZGF0YSA9IHRoaXMuX2RhdGEuZmlsdGVyKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIGlkc1t4Ll9pZF0gIT09IDE7IH0pO1xuICB9XG5cbiAgaWYgKGlucHV0LmFkZC5sZW5ndGgpIHtcbiAgICB0aGlzLl9kYXRhID0gdGhpcy5fZGF0YS5sZW5ndGggPyB0aGlzLl9kYXRhLmNvbmNhdChpbnB1dC5hZGQpIDogaW5wdXQuYWRkO1xuICB9XG5cbiAgaWYgKGlucHV0LnNvcnQpIHtcbiAgICB0aGlzLl9kYXRhLnNvcnQoaW5wdXQuc29ydCk7XG4gIH1cblxuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbGxlY3RvcjsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi9jaGFuZ2VzZXQnKSwgXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuL3R1cGxlJyksIFxuICAgIE5vZGUgPSByZXF1aXJlKCcuL05vZGUnKSxcbiAgICBDb2xsZWN0b3IgPSByZXF1aXJlKCcuL0NvbGxlY3RvcicpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBEYXRhc291cmNlKGdyYXBoLCBuYW1lLCBmYWNldCkge1xuICB0aGlzLl9ncmFwaCA9IGdyYXBoO1xuICB0aGlzLl9uYW1lID0gbmFtZTtcbiAgdGhpcy5fZGF0YSA9IFtdO1xuICB0aGlzLl9zb3VyY2UgPSBudWxsO1xuICB0aGlzLl9mYWNldCA9IGZhY2V0O1xuICB0aGlzLl9pbnB1dCA9IGNoYW5nZXNldC5jcmVhdGUoKTtcbiAgdGhpcy5fb3V0cHV0ID0gbnVsbDsgICAgLy8gT3V0cHV0IGNoYW5nZXNldFxuXG4gIHRoaXMuX3BpcGVsaW5lICA9IG51bGw7IC8vIFBpcGVsaW5lIG9mIHRyYW5zZm9ybWF0aW9ucy5cbiAgdGhpcy5fY29sbGVjdG9yID0gbnVsbDsgLy8gQ29sbGVjdG9yIHRvIG1hdGVyaWFsaXplIG91dHB1dCBvZiBwaXBlbGluZVxuICB0aGlzLl9yZXZpc2VzID0gZmFsc2U7IC8vIERvZXMgYW55IHBpcGVsaW5lIG9wZXJhdG9yIG5lZWQgdG8gdHJhY2sgcHJldj9cbn07XG5cbnZhciBwcm90byA9IERhdGFzb3VyY2UucHJvdG90eXBlO1xuXG5wcm90by5uYW1lID0gZnVuY3Rpb24obmFtZSkge1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX25hbWU7XG4gIHJldHVybiAodGhpcy5fbmFtZSA9IG5hbWUsIHRoaXMpO1xufTtcblxucHJvdG8uc291cmNlID0gZnVuY3Rpb24oc3JjKSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fc291cmNlO1xuICByZXR1cm4gKHRoaXMuX3NvdXJjZSA9IHRoaXMuX2dyYXBoLmRhdGEoc3JjKSk7XG59O1xuXG5wcm90by5hZGQgPSBmdW5jdGlvbihkKSB7XG4gIHZhciBwcmV2ID0gdGhpcy5fcmV2aXNlcyA/IG51bGwgOiB1bmRlZmluZWQ7XG5cbiAgdGhpcy5faW5wdXQuYWRkID0gdGhpcy5faW5wdXQuYWRkXG4gICAgLmNvbmNhdChkbC5hcnJheShkKS5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gdHVwbGUuaW5nZXN0KGQsIHByZXYpOyB9KSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24od2hlcmUpIHtcbiAgdmFyIGQgPSB0aGlzLl9kYXRhLmZpbHRlcih3aGVyZSk7XG4gIHRoaXMuX2lucHV0LnJlbSA9IHRoaXMuX2lucHV0LnJlbS5jb25jYXQoZCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8udXBkYXRlID0gZnVuY3Rpb24od2hlcmUsIGZpZWxkLCBmdW5jKSB7XG4gIHZhciBtb2QgPSB0aGlzLl9pbnB1dC5tb2QsXG4gICAgICBpZHMgPSB0dXBsZS5pZE1hcChtb2QpLFxuICAgICAgcHJldiA9IHRoaXMuX3JldmlzZXMgPyBudWxsIDogdW5kZWZpbmVkOyBcblxuICB0aGlzLl9pbnB1dC5maWVsZHNbZmllbGRdID0gMTtcbiAgdGhpcy5fZGF0YS5maWx0ZXIod2hlcmUpLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgIHZhciBwcmV2ID0geFtmaWVsZF0sXG4gICAgICAgIG5leHQgPSBmdW5jKHgpO1xuICAgIGlmIChwcmV2ICE9PSBuZXh0KSB7XG4gICAgICB0dXBsZS5zZXQoeCwgZmllbGQsIG5leHQpO1xuICAgICAgaWYoaWRzW3guX2lkXSAhPT0gMSkge1xuICAgICAgICBtb2QucHVzaCh4KTtcbiAgICAgICAgaWRzW3guX2lkXSA9IDE7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by52YWx1ZXMgPSBmdW5jdGlvbihkYXRhKSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgIHJldHVybiB0aGlzLl9jb2xsZWN0b3IgPyB0aGlzLl9jb2xsZWN0b3IuZGF0YSgpIDogdGhpcy5fZGF0YTtcblxuICAvLyBSZXBsYWNlIGJhY2tpbmcgZGF0YVxuICB0aGlzLl9pbnB1dC5yZW0gPSB0aGlzLl9kYXRhLnNsaWNlKCk7XG4gIGlmIChkYXRhKSB7IHRoaXMuYWRkKGRhdGEpOyB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuZnVuY3Rpb24gc2V0X3ByZXYoZCkgeyBpZihkLl9wcmV2ID09PSB1bmRlZmluZWQpIGQuX3ByZXYgPSBDLlNFTlRJTkVMOyB9XG5cbnByb3RvLnJldmlzZXMgPSBmdW5jdGlvbihwKSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fcmV2aXNlcztcblxuICAvLyBJZiB3ZSd2ZSBub3QgbmVlZGVkIHByZXYgaW4gdGhlIHBhc3QsIGJ1dCBhIG5ldyBkYXRhZmxvdyBub2RlIG5lZWRzIGl0IG5vd1xuICAvLyBlbnN1cmUgZXhpc3RpbmcgdHVwbGVzIGhhdmUgcHJldiBzZXQuXG4gIGlmKCF0aGlzLl9yZXZpc2VzICYmIHApIHtcbiAgICB0aGlzLl9kYXRhLmZvckVhY2goc2V0X3ByZXYpO1xuICAgIHRoaXMuX2lucHV0LmFkZC5mb3JFYWNoKHNldF9wcmV2KTsgLy8gTmV3IHR1cGxlcyB0aGF0IGhhdmVuJ3QgeWV0IGJlZW4gbWVyZ2VkIGludG8gX2RhdGFcbiAgfVxuXG4gIHRoaXMuX3JldmlzZXMgPSB0aGlzLl9yZXZpc2VzIHx8IHA7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8ubGFzdCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fb3V0cHV0OyB9O1xuXG5wcm90by5maXJlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaWYoaW5wdXQpIHRoaXMuX2lucHV0ID0gaW5wdXQ7XG4gIHRoaXMuX2dyYXBoLnByb3BhZ2F0ZSh0aGlzLl9pbnB1dCwgdGhpcy5fcGlwZWxpbmVbMF0pOyBcbn07XG5cbnByb3RvLnBpcGVsaW5lID0gZnVuY3Rpb24ocGlwZWxpbmUpIHtcbiAgdmFyIGRzID0gdGhpcywgbiwgYztcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9waXBlbGluZTtcblxuICBpZihwaXBlbGluZS5sZW5ndGgpIHtcbiAgICAvLyBJZiB3ZSBoYXZlIGEgcGlwZWxpbmUsIGFkZCBhIGNvbGxlY3RvciB0byB0aGUgZW5kIHRvIG1hdGVyaWFsaXplXG4gICAgLy8gdGhlIG91dHB1dC5cbiAgICBkcy5fY29sbGVjdG9yID0gbmV3IENvbGxlY3Rvcih0aGlzLl9ncmFwaCk7XG4gICAgcGlwZWxpbmUucHVzaChkcy5fY29sbGVjdG9yKTtcbiAgICBkcy5fcmV2aXNlcyA9IHBpcGVsaW5lLnNvbWUoZnVuY3Rpb24ocCkgeyByZXR1cm4gcC5yZXZpc2VzKCk7IH0pO1xuICB9XG5cbiAgLy8gSW5wdXQgbm9kZSBhcHBsaWVzIHRoZSBkYXRhc291cmNlJ3MgZGVsdGEsIGFuZCBwcm9wYWdhdGVzIGl0IHRvIFxuICAvLyB0aGUgcmVzdCBvZiB0aGUgcGlwZWxpbmUuIEl0IHJlY2VpdmVzIHRvdWNoZXMgdG8gcmVmbG93IGRhdGEuXG4gIHZhciBpbnB1dCA9IG5ldyBOb2RlKHRoaXMuX2dyYXBoKVxuICAgIC5yb3V0ZXIodHJ1ZSlcbiAgICAuY29sbGVjdG9yKHRydWUpO1xuXG4gIGlucHV0LmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICBkZWJ1ZyhpbnB1dCwgW1wiaW5wdXRcIiwgZHMuX25hbWVdKTtcblxuICAgIHZhciBkZWx0YSA9IGRzLl9pbnB1dCwgXG4gICAgICAgIG91dCA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpLFxuICAgICAgICByZW07XG5cbiAgICAvLyBEZWx0YSBtaWdodCBjb250YWluIGZpZWxkcyB1cGRhdGVkIHRocm91Z2ggQVBJXG4gICAgZGwua2V5cyhkZWx0YS5maWVsZHMpLmZvckVhY2goZnVuY3Rpb24oZikgeyBvdXQuZmllbGRzW2ZdID0gMSB9KTtcblxuICAgIGlmKGlucHV0LnJlZmxvdykge1xuICAgICAgb3V0Lm1vZCA9IGRzLl9kYXRhLnNsaWNlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHVwZGF0ZSBkYXRhXG4gICAgICBpZihkZWx0YS5yZW0ubGVuZ3RoKSB7XG4gICAgICAgIHJlbSA9IHR1cGxlLmlkTWFwKGRlbHRhLnJlbSk7XG4gICAgICAgIGRzLl9kYXRhID0gZHMuX2RhdGFcbiAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHJlbVt4Ll9pZF0gIT09IDEgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKGRlbHRhLmFkZC5sZW5ndGgpIGRzLl9kYXRhID0gZHMuX2RhdGEuY29uY2F0KGRlbHRhLmFkZCk7XG5cbiAgICAgIC8vIHJlc2V0IGNoYW5nZSBsaXN0XG4gICAgICBkcy5faW5wdXQgPSBjaGFuZ2VzZXQuY3JlYXRlKCk7XG5cbiAgICAgIG91dC5hZGQgPSBkZWx0YS5hZGQ7IFxuICAgICAgb3V0Lm1vZCA9IGRlbHRhLm1vZDtcbiAgICAgIG91dC5yZW0gPSBkZWx0YS5yZW07XG4gICAgfVxuXG4gICAgcmV0dXJuIChvdXQuZmFjZXQgPSBkcy5fZmFjZXQsIG91dCk7XG4gIH07XG5cbiAgcGlwZWxpbmUudW5zaGlmdChpbnB1dCk7XG5cbiAgLy8gT3V0cHV0IG5vZGUgY2FwdHVyZXMgdGhlIGxhc3QgY2hhbmdlc2V0IHNlZW4gYnkgdGhpcyBkYXRhc291cmNlXG4gIC8vIChuZWVkZWQgZm9yIGpvaW5zIGFuZCBidWlsZHMpIGFuZCBtYXRlcmlhbGl6ZXMgYW55IG5lc3RlZCBkYXRhLlxuICAvLyBJZiB0aGlzIGRhdGFzb3VyY2UgaXMgZmFjZXRlZCwgbWF0ZXJpYWxpemVzIHRoZSB2YWx1ZXMgaW4gdGhlIGZhY2V0LlxuICB2YXIgb3V0cHV0ID0gbmV3IE5vZGUodGhpcy5fZ3JhcGgpXG4gICAgLnJvdXRlcih0cnVlKVxuICAgIC5jb2xsZWN0b3IodHJ1ZSk7XG5cbiAgb3V0cHV0LmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICBkZWJ1ZyhpbnB1dCwgW1wib3V0cHV0XCIsIGRzLl9uYW1lXSk7XG4gICAgdmFyIG91dHB1dCA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQsIHRydWUpO1xuXG4gICAgaWYoZHMuX2ZhY2V0KSB7XG4gICAgICBkcy5fZmFjZXQudmFsdWVzID0gZHMudmFsdWVzKCk7XG4gICAgICBpbnB1dC5mYWNldCA9IG51bGw7XG4gICAgfVxuXG4gICAgZHMuX291dHB1dCA9IGlucHV0O1xuICAgIG91dHB1dC5kYXRhW2RzLl9uYW1lXSA9IDE7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfTtcblxuICBwaXBlbGluZS5wdXNoKG91dHB1dCk7XG5cbiAgdGhpcy5fcGlwZWxpbmUgPSBwaXBlbGluZTtcbiAgdGhpcy5fZ3JhcGguY29ubmVjdChkcy5fcGlwZWxpbmUpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmxpc3RlbmVyID0gZnVuY3Rpb24oKSB7IFxuICB2YXIgbCA9IG5ldyBOb2RlKHRoaXMuX2dyYXBoKS5yb3V0ZXIodHJ1ZSksXG4gICAgICBkZXN0ID0gdGhpcyxcbiAgICAgIHByZXYgPSB0aGlzLl9yZXZpc2VzID8gbnVsbCA6IHVuZGVmaW5lZDtcblxuICBsLmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICBkZXN0Ll9zcmNNYXAgPSBkZXN0Ll9zcmNNYXAgfHwge307ICAvLyB0byBwcm9wYWdhdGUgdHVwbGVzIGNvcnJlY3RseVxuICAgIHZhciBtYXAgPSBkZXN0Ll9zcmNNYXAsXG4gICAgICAgIG91dHB1dCAgPSBjaGFuZ2VzZXQuY3JlYXRlKGlucHV0KTtcblxuICAgIG91dHB1dC5hZGQgPSBpbnB1dC5hZGQubWFwKGZ1bmN0aW9uKHQpIHtcbiAgICAgIHJldHVybiAobWFwW3QuX2lkXSA9IHR1cGxlLmRlcml2ZSh0LCB0Ll9wcmV2ICE9PSB1bmRlZmluZWQgPyB0Ll9wcmV2IDogcHJldikpO1xuICAgIH0pO1xuICAgIG91dHB1dC5tb2QgPSBpbnB1dC5tb2QubWFwKGZ1bmN0aW9uKHQpIHsgcmV0dXJuIG1hcFt0Ll9pZF07IH0pO1xuICAgIG91dHB1dC5yZW0gPSBpbnB1dC5yZW0ubWFwKGZ1bmN0aW9uKHQpIHsgXG4gICAgICB2YXIgbyA9IG1hcFt0Ll9pZF07XG4gICAgICBtYXBbdC5faWRdID0gbnVsbDtcbiAgICAgIHJldHVybiBvO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIChkZXN0Ll9pbnB1dCA9IG91dHB1dCk7XG4gIH07XG5cbiAgbC5hZGRMaXN0ZW5lcih0aGlzLl9waXBlbGluZVswXSk7XG4gIHJldHVybiBsO1xufTtcblxucHJvdG8uYWRkTGlzdGVuZXIgPSBmdW5jdGlvbihsKSB7XG4gIGlmKGwgaW5zdGFuY2VvZiBEYXRhc291cmNlKSB7XG4gICAgaWYodGhpcy5fY29sbGVjdG9yKSB0aGlzLl9jb2xsZWN0b3IuYWRkTGlzdGVuZXIobC5saXN0ZW5lcigpKTtcbiAgICBlbHNlIHRoaXMuX3BpcGVsaW5lWzBdLmFkZExpc3RlbmVyKGwubGlzdGVuZXIoKSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fcGlwZWxpbmVbdGhpcy5fcGlwZWxpbmUubGVuZ3RoLTFdLmFkZExpc3RlbmVyKGwpOyAgICAgIFxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKGwpIHtcbiAgdGhpcy5fcGlwZWxpbmVbdGhpcy5fcGlwZWxpbmUubGVuZ3RoLTFdLnJlbW92ZUxpc3RlbmVyKGwpO1xufTtcblxucHJvdG8ubGlzdGVuZXJzID0gZnVuY3Rpb24oZHMpIHtcbiAgcmV0dXJuIGRzIFxuICAgID8gdGhpcy5fY29sbGVjdG9yID8gdGhpcy5fY29sbGVjdG9yLmxpc3RlbmVycygpIDogdGhpcy5fcGlwZWxpbmVbMF0ubGlzdGVuZXJzKClcbiAgICA6IHRoaXMuX3BpcGVsaW5lW3RoaXMuX3BpcGVsaW5lLmxlbmd0aC0xXS5saXN0ZW5lcnMoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRGF0YXNvdXJjZTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgSGVhcCA9IHJlcXVpcmUoJ2hlYXAnKSxcbiAgICBEYXRhc291cmNlID0gcmVxdWlyZSgnLi9EYXRhc291cmNlJyksXG4gICAgU2lnbmFsID0gcmVxdWlyZSgnLi9TaWduYWwnKSxcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCcuL2NoYW5nZXNldCcpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBHcmFwaCgpIHtcbiAgdGhpcy5fc3RhbXAgPSAwO1xuICB0aGlzLl9yYW5rICA9IDA7XG5cbiAgdGhpcy5fZGF0YSA9IHt9O1xuICB0aGlzLl9zaWduYWxzID0ge307XG5cbiAgdGhpcy5kb05vdFByb3BhZ2F0ZSA9IHt9O1xufVxuXG52YXIgcHJvdG8gPSBHcmFwaC5wcm90b3R5cGU7XG5cbnByb3RvLmRhdGEgPSBmdW5jdGlvbihuYW1lLCBwaXBlbGluZSwgZmFjZXQpIHtcbiAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIHRoaXMuX2RhdGFbbmFtZV07XG4gIHJldHVybiAodGhpcy5fZGF0YVtuYW1lXSA9IG5ldyBEYXRhc291cmNlKHRoaXMsIG5hbWUsIGZhY2V0KVxuICAgIC5waXBlbGluZShwaXBlbGluZSkpO1xufTtcblxuZnVuY3Rpb24gc2lnbmFsKG5hbWUpIHtcbiAgdmFyIG0gPSB0aGlzLCBpLCBsZW47XG4gIGlmKCFkbC5pc0FycmF5KG5hbWUpKSByZXR1cm4gdGhpcy5fc2lnbmFsc1tuYW1lXTtcbiAgcmV0dXJuIG5hbWUubWFwKGZ1bmN0aW9uKG4pIHsgbS5fc2lnbmFsc1tuXTsgfSk7XG59XG5cbnByb3RvLnNpZ25hbCA9IGZ1bmN0aW9uKG5hbWUsIGluaXQpIHtcbiAgdmFyIG0gPSB0aGlzO1xuICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAxKSByZXR1cm4gc2lnbmFsLmNhbGwodGhpcywgbmFtZSk7XG4gIHJldHVybiAodGhpcy5fc2lnbmFsc1tuYW1lXSA9IG5ldyBTaWduYWwodGhpcywgbmFtZSwgaW5pdCkpO1xufTtcblxucHJvdG8uc2lnbmFsVmFsdWVzID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIgZ3JhcGggPSB0aGlzO1xuICBpZighZGwuaXNBcnJheShuYW1lKSkgcmV0dXJuIHRoaXMuX3NpZ25hbHNbbmFtZV0udmFsdWUoKTtcbiAgcmV0dXJuIG5hbWUucmVkdWNlKGZ1bmN0aW9uKHNnLCBuKSB7XG4gICAgcmV0dXJuIChzZ1tuXSA9IGdyYXBoLl9zaWduYWxzW25dLnZhbHVlKCksIHNnKTtcbiAgfSwge30pO1xufTtcblxucHJvdG8uc2lnbmFsUmVmID0gZnVuY3Rpb24ocmVmKSB7XG4gIGlmKCFkbC5pc0FycmF5KHJlZikpIHJlZiA9IGRsLmZpZWxkKHJlZik7XG4gIHZhciB2YWx1ZSA9IHRoaXMuc2lnbmFsKHJlZi5zaGlmdCgpKS52YWx1ZSgpO1xuICBpZihyZWYubGVuZ3RoID4gMCkge1xuICAgIHZhciBmbiA9IEZ1bmN0aW9uKFwic1wiLCBcInJldHVybiBzW1wiK3JlZi5tYXAoZGwuc3RyKS5qb2luKFwiXVtcIikrXCJdXCIpO1xuICAgIHZhbHVlID0gZm4uY2FsbChudWxsLCB2YWx1ZSk7XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59O1xuXG52YXIgc2NoZWR1bGUgPSBmdW5jdGlvbihhLCBiKSB7XG4gIC8vIElmIHRoZSBub2RlcyBhcmUgZXF1YWwsIHByb3BhZ2F0ZSB0aGUgbm9uLXJlZmxvdyBwdWxzZSBmaXJzdCxcbiAgLy8gc28gdGhhdCB3ZSBjYW4gaWdub3JlIHN1YnNlcXVlbnQgcmVmbG93IHB1bHNlcy4gXG4gIGlmKGEucmFuayA9PSBiLnJhbmspIHJldHVybiBhLnB1bHNlLnJlZmxvdyA/IDEgOiAtMTtcbiAgZWxzZSByZXR1cm4gYS5yYW5rIC0gYi5yYW5rOyBcbn07XG5cbnByb3RvLnByb3BhZ2F0ZSA9IGZ1bmN0aW9uKHB1bHNlLCBub2RlKSB7XG4gIHZhciB2LCBsLCBuLCBwLCByLCBpLCBsZW4sIHJlZmxvd2VkO1xuXG4gIC8vIG5ldyBQUSB3aXRoIGVhY2ggcHJvcGFnYXRpb24gY3ljbGUgc28gdGhhdCB3ZSBjYW4gcHVsc2UgYnJhbmNoZXNcbiAgLy8gb2YgdGhlIGRhdGFmbG93IGdyYXBoIGR1cmluZyBhIHByb3BhZ2F0aW9uIChlLmcuLCB3aGVuIGNyZWF0aW5nXG4gIC8vIGEgbmV3IGlubGluZSBkYXRhc291cmNlKS5cbiAgdmFyIHBxID0gbmV3IEhlYXAoc2NoZWR1bGUpOyBcblxuICBpZihwdWxzZS5zdGFtcCkgdGhyb3cgXCJQdWxzZSBhbHJlYWR5IGhhcyBhIG5vbi16ZXJvIHN0YW1wXCJcblxuICBwdWxzZS5zdGFtcCA9ICsrdGhpcy5fc3RhbXA7XG4gIHBxLnB1c2goeyBub2RlOiBub2RlLCBwdWxzZTogcHVsc2UsIHJhbms6IG5vZGUucmFuaygpIH0pO1xuXG4gIHdoaWxlIChwcS5zaXplKCkgPiAwKSB7XG4gICAgdiA9IHBxLnBvcCgpLCBuID0gdi5ub2RlLCBwID0gdi5wdWxzZSwgciA9IHYucmFuaywgbCA9IG4uX2xpc3RlbmVycztcbiAgICByZWZsb3dlZCA9IHAucmVmbG93ICYmIG4ubGFzdCgpID49IHAuc3RhbXA7XG5cbiAgICBpZihyZWZsb3dlZCkgY29udGludWU7IC8vIERvbid0IG5lZWRsZXNzbHkgcmVmbG93IG9wcy5cblxuICAgIC8vIEEgbm9kZSdzIHJhbmsgbWlnaHQgY2hhbmdlIGR1cmluZyBhIHByb3BhZ2F0aW9uIChlLmcuIGluc3RhbnRpYXRpbmdcbiAgICAvLyBhIGdyb3VwJ3MgZGF0YWZsb3cgYnJhbmNoKS4gUmUtcXVldWUgaWYgaXQgaGFzLiBUXG4gICAgLy8gVE9ETzogdXNlIHBxLnJlcGxhY2Ugb3IgcHEucG9wcHVzaD9cbiAgICBpZihyICE9IG4ucmFuaygpKSB7XG4gICAgICBkZWJ1ZyhwLCBbJ1JhbmsgbWlzbWF0Y2gnLCByLCBuLnJhbmsoKV0pO1xuICAgICAgcHEucHVzaCh7IG5vZGU6IG4sIHB1bHNlOiBwLCByYW5rOiBuLnJhbmsoKSB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHAgPSB0aGlzLmV2YWx1YXRlKHAsIG4pO1xuXG4gICAgLy8gRXZlbiBpZiB3ZSBkaWRuJ3QgcnVuIHRoZSBub2RlLCB3ZSBzdGlsbCB3YW50IHRvIHByb3BhZ2F0ZSBcbiAgICAvLyB0aGUgcHVsc2UuIFxuICAgIGlmIChwICE9PSB0aGlzLmRvTm90UHJvcGFnYXRlKSB7XG4gICAgICBmb3IgKGkgPSAwLCBsZW4gPSBsLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHBxLnB1c2goeyBub2RlOiBsW2ldLCBwdWxzZTogcCwgcmFuazogbFtpXS5fcmFuayB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8vIENvbm5lY3QgYSBicmFuY2ggb2YgZGF0YWZsb3cgbm9kZXMuIFxuLy8gRGVwZW5kZW5jaWVzIGdldCB3aXJlZCB0byB0aGUgbmVhcmVzdCBjb2xsZWN0b3IuIFxuZnVuY3Rpb24gZm9yRWFjaE5vZGUoYnJhbmNoLCBmbikge1xuICB2YXIgbm9kZSwgY29sbGVjdG9yLCBpLCBsZW47XG4gIGZvcihpPTAsIGxlbj1icmFuY2gubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgbm9kZSA9IGJyYW5jaFtpXTtcbiAgICBpZihub2RlLmNvbGxlY3RvcigpKSBjb2xsZWN0b3IgPSBub2RlO1xuICAgIGZuKG5vZGUsIGNvbGxlY3RvciwgaSk7XG4gIH1cbn1cblxucHJvdG8uY29ubmVjdCA9IGZ1bmN0aW9uKGJyYW5jaCkge1xuICBkZWJ1Zyh7fSwgWydjb25uZWN0aW5nJ10pO1xuICB2YXIgZ3JhcGggPSB0aGlzO1xuICBmb3JFYWNoTm9kZShicmFuY2gsIGZ1bmN0aW9uKG4sIGMsIGkpIHtcbiAgICB2YXIgZGF0YSA9IG4uZGVwZW5kZW5jeShDLkRBVEEpLFxuICAgICAgICBzaWduYWxzID0gbi5kZXBlbmRlbmN5KEMuU0lHTkFMUyk7XG5cbiAgICBpZihkYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihkKSB7IFxuICAgICAgICBncmFwaC5kYXRhKGQpXG4gICAgICAgICAgLnJldmlzZXMobi5yZXZpc2VzKCkpXG4gICAgICAgICAgLmFkZExpc3RlbmVyKGMpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYoc2lnbmFscy5sZW5ndGggPiAwKSB7XG4gICAgICBzaWduYWxzLmZvckVhY2goZnVuY3Rpb24ocykgeyBncmFwaC5zaWduYWwocykuYWRkTGlzdGVuZXIoYyk7IH0pO1xuICAgIH1cblxuICAgIGlmKGkgPiAwKSB7XG4gICAgICBicmFuY2hbaS0xXS5hZGRMaXN0ZW5lcihicmFuY2hbaV0pO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGJyYW5jaDtcbn07XG5cbnByb3RvLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbihicmFuY2gpIHtcbiAgZGVidWcoe30sIFsnZGlzY29ubmVjdGluZyddKTtcbiAgdmFyIGdyYXBoID0gdGhpcztcblxuICBmb3JFYWNoTm9kZShicmFuY2gsIGZ1bmN0aW9uKG4sIGMsIGkpIHtcbiAgICB2YXIgZGF0YSA9IG4uZGVwZW5kZW5jeShDLkRBVEEpLFxuICAgICAgICBzaWduYWxzID0gbi5kZXBlbmRlbmN5KEMuU0lHTkFMUyk7XG5cbiAgICBpZihkYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihkKSB7IGdyYXBoLmRhdGEoZCkucmVtb3ZlTGlzdGVuZXIoYyk7IH0pO1xuICAgIH1cblxuICAgIGlmKHNpZ25hbHMubGVuZ3RoID4gMCkge1xuICAgICAgc2lnbmFscy5mb3JFYWNoKGZ1bmN0aW9uKHMpIHsgZ3JhcGguc2lnbmFsKHMpLnJlbW92ZUxpc3RlbmVyKGMpIH0pO1xuICAgIH1cblxuICAgIG4uZGlzY29ubmVjdCgpOyAgXG4gIH0pO1xuXG4gIHJldHVybiBicmFuY2g7XG59O1xuXG5wcm90by5yZWV2YWx1YXRlID0gZnVuY3Rpb24ocHVsc2UsIG5vZGUpIHtcbiAgdmFyIHJlZmxvd2VkID0gIXB1bHNlLnJlZmxvdyB8fCAocHVsc2UucmVmbG93ICYmIG5vZGUubGFzdCgpID49IHB1bHNlLnN0YW1wKSxcbiAgICAgIHJ1biA9ICEhcHVsc2UuYWRkLmxlbmd0aCB8fCAhIXB1bHNlLnJlbS5sZW5ndGggfHwgbm9kZS5yb3V0ZXIoKTtcbiAgcnVuID0gcnVuIHx8ICFyZWZsb3dlZDtcbiAgcmV0dXJuIHJ1biB8fCBub2RlLnJlZXZhbHVhdGUocHVsc2UpO1xufTtcblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihwdWxzZSwgbm9kZSkge1xuICBpZighdGhpcy5yZWV2YWx1YXRlKHB1bHNlLCBub2RlKSkgcmV0dXJuIHB1bHNlO1xuICBwdWxzZSA9IG5vZGUuZXZhbHVhdGUocHVsc2UpO1xuICBub2RlLmxhc3QocHVsc2Uuc3RhbXApO1xuICByZXR1cm4gcHVsc2Vcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR3JhcGg7IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpLFxuICAgIFJFRVZBTCA9IFtDLkRBVEEsIEMuRklFTERTLCBDLlNDQUxFUywgQy5TSUdOQUxTXTtcblxudmFyIG5vZGVfaWQgPSAxO1xuXG5mdW5jdGlvbiBOb2RlKGdyYXBoKSB7XG4gIGlmKGdyYXBoKSB0aGlzLmluaXQoZ3JhcGgpO1xuICByZXR1cm4gdGhpcztcbn1cblxudmFyIHByb3RvID0gTm9kZS5wcm90b3R5cGU7XG5cbnByb3RvLmluaXQgPSBmdW5jdGlvbihncmFwaCkge1xuICB0aGlzLl9pZCA9IG5vZGVfaWQrKztcbiAgdGhpcy5fZ3JhcGggPSBncmFwaDtcbiAgdGhpcy5fcmFuayA9ICsrZ3JhcGguX3Jhbms7IC8vIEZvciB0b3BvbG9naWFsIHNvcnRcbiAgdGhpcy5fc3RhbXAgPSAwOyAgLy8gTGFzdCBzdGFtcCBzZWVuXG5cbiAgdGhpcy5fbGlzdGVuZXJzID0gW107XG4gIHRoaXMuX3JlZ2lzdGVyZWQgPSB7fTsgLy8gVG8gcHJldmVudCBkdXBsaWNhdGUgbGlzdGVuZXJzXG5cbiAgdGhpcy5fZGVwcyA9IHtcbiAgICBkYXRhOiAgICBbXSxcbiAgICBmaWVsZHM6ICBbXSxcbiAgICBzY2FsZXM6ICBbXSxcbiAgICBzaWduYWxzOiBbXSxcbiAgfTtcblxuICB0aGlzLl9pc1JvdXRlciA9IGZhbHNlOyAvLyBSZXNwb25zaWJsZSBmb3IgcHJvcGFnYXRpbmcgdHVwbGVzLCBjYW5ub3QgZXZlciBiZSBza2lwcGVkXG4gIHRoaXMuX2lzQ29sbGVjdG9yID0gZmFsc2U7ICAvLyBIb2xkcyBhIG1hdGVyaWFsaXplZCBkYXRhc2V0LCBwdWxzZSB0byByZWZsb3dcbiAgdGhpcy5fcmV2aXNlcyA9IGZhbHNlOyAvLyBEb2VzIHRoZSBvcGVyYXRvciByZXF1aXJlIHR1cGxlcycgcHJldmlvdXMgdmFsdWVzPyBcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbiA9IG5ldyBOb2RlKHRoaXMuX2dyYXBoKTtcbiAgbi5ldmFsdWF0ZSA9IHRoaXMuZXZhbHVhdGU7XG4gIG4uX2RlcHMgPSB0aGlzLl9kZXBzO1xuICBuLl9pc1JvdXRlciA9IHRoaXMuX2lzUm91dGVyO1xuICBuLl9pc0NvbGxlY3RvciA9IHRoaXMuX2lzQ29sbGVjdG9yO1xuICByZXR1cm4gbjtcbn07XG5cbnByb3RvLnJhbmsgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuX3Jhbms7IH07XG5cbnByb3RvLmxhc3QgPSBmdW5jdGlvbihzdGFtcCkgeyBcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9zdGFtcDtcbiAgdGhpcy5fc3RhbXAgPSBzdGFtcDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5kZXBlbmRlbmN5ID0gZnVuY3Rpb24odHlwZSwgZGVwcykge1xuICB2YXIgZCA9IHRoaXMuX2RlcHNbdHlwZV07XG4gIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHJldHVybiBkO1xuICBpZihkZXBzID09PSBudWxsKSB7IC8vIENsZWFyIGRlcGVuZGVuY2llcyBvZiBhIGNlcnRhaW4gdHlwZVxuICAgIHdoaWxlKGQubGVuZ3RoID4gMCkgZC5wb3AoKTtcbiAgfSBlbHNlIHtcbiAgICBpZighZGwuaXNBcnJheShkZXBzKSAmJiBkLmluZGV4T2YoZGVwcykgPCAwKSBkLnB1c2goZGVwcyk7XG4gICAgZWxzZSBkLnB1c2guYXBwbHkoZCwgZGwuYXJyYXkoZGVwcykpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8ucm91dGVyID0gZnVuY3Rpb24oYm9vbCkge1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX2lzUm91dGVyO1xuICB0aGlzLl9pc1JvdXRlciA9ICEhYm9vbFxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmNvbGxlY3RvciA9IGZ1bmN0aW9uKGJvb2wpIHtcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9pc0NvbGxlY3RvcjtcbiAgdGhpcy5faXNDb2xsZWN0b3IgPSAhIWJvb2w7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8ucmV2aXNlcyA9IGZ1bmN0aW9uKGJvb2wpIHtcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9yZXZpc2VzO1xuICB0aGlzLl9yZXZpc2VzID0gISFib29sO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmxpc3RlbmVycyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5fbGlzdGVuZXJzO1xufTtcblxucHJvdG8uYWRkTGlzdGVuZXIgPSBmdW5jdGlvbihsKSB7XG4gIGlmKCEobCBpbnN0YW5jZW9mIE5vZGUpKSB0aHJvdyBcIkxpc3RlbmVyIGlzIG5vdCBhIE5vZGVcIjtcbiAgaWYodGhpcy5fcmVnaXN0ZXJlZFtsLl9pZF0pIHJldHVybiB0aGlzO1xuXG4gIHRoaXMuX2xpc3RlbmVycy5wdXNoKGwpO1xuICB0aGlzLl9yZWdpc3RlcmVkW2wuX2lkXSA9IDE7XG4gIGlmKHRoaXMuX3JhbmsgPiBsLl9yYW5rKSB7XG4gICAgdmFyIHEgPSBbbF07XG4gICAgd2hpbGUocS5sZW5ndGgpIHtcbiAgICAgIHZhciBjdXIgPSBxLnNwbGljZSgwLDEpWzBdO1xuICAgICAgY3VyLl9yYW5rID0gKyt0aGlzLl9ncmFwaC5fcmFuaztcbiAgICAgIHEucHVzaC5hcHBseShxLCBjdXIuX2xpc3RlbmVycyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIChsKSB7XG4gIHZhciBmb3VuZFNlbmRpbmcgPSBmYWxzZTtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX2xpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW4gJiYgIWZvdW5kU2VuZGluZzsgaSsrKSB7XG4gICAgaWYgKHRoaXMuX2xpc3RlbmVyc1tpXSA9PT0gbCkge1xuICAgICAgdGhpcy5fbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIHRoaXMuX3JlZ2lzdGVyZWRbbC5faWRdID0gbnVsbDtcbiAgICAgIGZvdW5kU2VuZGluZyA9IHRydWU7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gZm91bmRTZW5kaW5nO1xufTtcblxucHJvdG8uZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9saXN0ZW5lcnMgPSBbXTtcbiAgdGhpcy5fcmVnaXN0ZXJlZCA9IHt9O1xufTtcblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihwdWxzZSkgeyByZXR1cm4gcHVsc2U7IH1cblxucHJvdG8ucmVldmFsdWF0ZSA9IGZ1bmN0aW9uKHB1bHNlKSB7XG4gIHZhciBub2RlID0gdGhpcywgcmVldmFsID0gZmFsc2U7XG4gIHJldHVybiBSRUVWQUwuc29tZShmdW5jdGlvbihwcm9wKSB7XG4gICAgcmVldmFsID0gcmVldmFsIHx8IG5vZGUuX2RlcHNbcHJvcF0uc29tZShmdW5jdGlvbihrKSB7IHJldHVybiAhIXB1bHNlW3Byb3BdW2tdIH0pO1xuICAgIHJldHVybiByZWV2YWw7XG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBOb2RlOyIsInZhciBOb2RlID0gcmVxdWlyZSgnLi9Ob2RlJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi9jaGFuZ2VzZXQnKTtcblxuZnVuY3Rpb24gU2lnbmFsKGdyYXBoLCBuYW1lLCBpbml0KSB7XG4gIE5vZGUucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIHRoaXMuX25hbWUgID0gbmFtZTtcbiAgdGhpcy5fdmFsdWUgPSBpbml0O1xuICByZXR1cm4gdGhpcztcbn07XG5cbnZhciBwcm90byA9IChTaWduYWwucHJvdG90eXBlID0gbmV3IE5vZGUoKSk7XG5cbnByb3RvLm5hbWUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuX25hbWU7IH07XG5cbnByb3RvLnZhbHVlID0gZnVuY3Rpb24odmFsKSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fdmFsdWU7XG4gIHRoaXMuX3ZhbHVlID0gdmFsO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmZpcmUgPSBmdW5jdGlvbihjcykge1xuICBpZighY3MpIGNzID0gY2hhbmdlc2V0LmNyZWF0ZShudWxsLCB0cnVlKTtcbiAgY3Muc2lnbmFsc1t0aGlzLl9uYW1lXSA9IDE7XG4gIHRoaXMuX2dyYXBoLnByb3BhZ2F0ZShjcywgdGhpcyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNpZ25hbDsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG52YXIgUkVFVkFMID0gW0MuREFUQSwgQy5GSUVMRFMsIEMuU0NBTEVTLCBDLlNJR05BTFNdO1xuXG5mdW5jdGlvbiBjcmVhdGUoY3MsIHJlZmxvdykge1xuICB2YXIgb3V0ID0ge307XG4gIGNvcHkoY3MsIG91dCk7XG5cbiAgb3V0LmFkZCA9IFtdO1xuICBvdXQubW9kID0gW107XG4gIG91dC5yZW0gPSBbXTtcblxuICBvdXQucmVmbG93ID0gcmVmbG93O1xuXG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIHJlc2V0X3ByZXYoeCkge1xuICB4Ll9wcmV2ID0gKHguX3ByZXYgPT09IHVuZGVmaW5lZCkgPyB1bmRlZmluZWQgOiBDLlNFTlRJTkVMO1xufVxuXG5mdW5jdGlvbiBmaW5hbGl6ZShjcykge1xuICBmb3IoaT0wLCBsZW49Y3MuYWRkLmxlbmd0aDsgaTxsZW47ICsraSkgcmVzZXRfcHJldihjcy5hZGRbaV0pO1xuICBmb3IoaT0wLCBsZW49Y3MubW9kLmxlbmd0aDsgaTxsZW47ICsraSkgcmVzZXRfcHJldihjcy5tb2RbaV0pO1xufVxuXG5mdW5jdGlvbiBjb3B5KGEsIGIpIHtcbiAgYi5zdGFtcCA9IGEgPyBhLnN0YW1wIDogMDtcbiAgYi5zb3J0ICA9IGEgPyBhLnNvcnQgIDogbnVsbDtcbiAgYi5mYWNldCA9IGEgPyBhLmZhY2V0IDogbnVsbDtcbiAgYi50cmFucyA9IGEgPyBhLnRyYW5zIDogbnVsbDtcbiAgUkVFVkFMLmZvckVhY2goZnVuY3Rpb24oZCkgeyBiW2RdID0gYSA/IGFbZF0gOiB7fTsgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGU6IGNyZWF0ZSxcbiAgY29weTogY29weSxcbiAgZmluYWxpemU6IGZpbmFsaXplLFxufTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyksXG4gICAgdHVwbGVfaWQgPSAxO1xuXG4vLyBPYmplY3QuY3JlYXRlIGlzIGV4cGVuc2l2ZS4gU28sIHdoZW4gaW5nZXN0aW5nLCB0cnVzdCB0aGF0IHRoZVxuLy8gZGF0dW0gaXMgYW4gb2JqZWN0IHRoYXQgaGFzIGJlZW4gYXBwcm9wcmlhdGVseSBzYW5kYm94ZWQgZnJvbSBcbi8vIHRoZSBvdXRzaWRlIGVudmlyb25tZW50LiBcbmZ1bmN0aW9uIGluZ2VzdChkYXR1bSwgcHJldikge1xuICBkYXR1bSA9IGRsLmlzT2JqZWN0KGRhdHVtKSA/IGRhdHVtIDoge2RhdGE6IGRhdHVtfTtcbiAgZGF0dW0uX2lkID0gdHVwbGVfaWQrKztcbiAgZGF0dW0uX3ByZXYgPSAocHJldiAhPT0gdW5kZWZpbmVkKSA/IChwcmV2IHx8IEMuU0VOVElORUwpIDogdW5kZWZpbmVkO1xuICByZXR1cm4gZGF0dW07XG59XG5cbmZ1bmN0aW9uIGRlcml2ZShkYXR1bSwgcHJldikge1xuICByZXR1cm4gaW5nZXN0KE9iamVjdC5jcmVhdGUoZGF0dW0pLCBwcmV2KTtcbn1cblxuLy8gV0FSTklORzogb3BlcmF0b3JzIHNob3VsZCBvbmx5IGNhbGwgdGhpcyBvbmNlIHBlciB0aW1lc3RhbXAhXG5mdW5jdGlvbiBzZXQodCwgaywgdikge1xuICB2YXIgcHJldiA9IHRba107XG4gIGlmKHByZXYgPT09IHYpIHJldHVybjtcbiAgc2V0X3ByZXYodCwgayk7XG4gIHRba10gPSB2O1xufVxuXG5mdW5jdGlvbiBzZXRfcHJldih0LCBrKSB7XG4gIGlmKHQuX3ByZXYgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICB0Ll9wcmV2ID0gKHQuX3ByZXYgPT09IEMuU0VOVElORUwpID8ge30gOiB0Ll9wcmV2O1xuICB0Ll9wcmV2W2tdID0gdFtrXTtcbn1cblxuZnVuY3Rpb24gcmVzZXQoKSB7IHR1cGxlX2lkID0gMTsgfVxuXG5mdW5jdGlvbiBpZE1hcChhKSB7XG4gIHJldHVybiBhLnJlZHVjZShmdW5jdGlvbihtLHgpIHtcbiAgICByZXR1cm4gKG1beC5faWRdID0gMSwgbSk7XG4gIH0sIHt9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBpbmdlc3Q6IGluZ2VzdCxcbiAgZGVyaXZlOiBkZXJpdmUsXG4gIHNldDogICAgc2V0LFxuICBwcmV2OiAgIHNldF9wcmV2LFxuICByZXNldDogIHJlc2V0LFxuICBpZE1hcDogIGlkTWFwXG59OyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHQpIHtcbiAgb3B0ID0gb3B0IHx8IHt9O1xuICB2YXIgY29uc3RhbnRzID0gb3B0LmNvbnN0YW50cyB8fCByZXF1aXJlKCcuL2NvbnN0YW50cycpO1xuICB2YXIgZnVuY3Rpb25zID0gKG9wdC5mdW5jdGlvbnMgfHwgcmVxdWlyZSgnLi9mdW5jdGlvbnMnKSkoY29kZWdlbik7XG4gIHZhciBpZFdoaXRlTGlzdCA9IG9wdC5pZFdoaXRlTGlzdCA/IGRsLnRvTWFwKG9wdC5pZFdoaXRlTGlzdCkgOiBudWxsO1xuICB2YXIgaWRCbGFja0xpc3QgPSBvcHQuaWRCbGFja0xpc3QgPyBkbC50b01hcChvcHQuaWRCbGFja0xpc3QpIDogbnVsbDtcbiAgdmFyIG1lbWJlckRlcHRoID0gMDtcblxuICAvLyBUT0RPIGdlbmVyYWxpemU/XG4gIHZhciBEQVRVTSA9ICdkJztcbiAgdmFyIFNJR05BTF9QUkVGSVggPSAnc2cuJztcbiAgdmFyIHNpZ25hbHMgPSB7fTtcbiAgdmFyIGZpZWxkcyA9IHt9O1xuXG4gIGZ1bmN0aW9uIGNvZGVnZW5fd3JhcChhc3QpIHsgICAgXG4gICAgdmFyIHJldHZhbCA9IHtcbiAgICAgIGZuOiBjb2RlZ2VuKGFzdCksXG4gICAgICBzaWduYWxzOiBkbC5rZXlzKHNpZ25hbHMpLFxuICAgICAgZmllbGRzOiBkbC5rZXlzKGZpZWxkcylcbiAgICB9O1xuICAgIHNpZ25hbHMgPSB7fTtcbiAgICBmaWVsZHMgPSB7fTtcbiAgICByZXR1cm4gcmV0dmFsO1xuICB9XG5cbiAgZnVuY3Rpb24gY29kZWdlbihhc3QpIHtcbiAgICBpZiAoYXN0IGluc3RhbmNlb2YgU3RyaW5nKSByZXR1cm4gYXN0O1xuICAgIHZhciBnZW5lcmF0b3IgPSBDT0RFR0VOX1RZUEVTW2FzdC50eXBlXTtcbiAgICBpZiAoZ2VuZXJhdG9yID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuc3VwcG9ydGVkIHR5cGU6IFwiICsgYXN0LnR5cGUpO1xuICAgIH1cbiAgICByZXR1cm4gZ2VuZXJhdG9yKGFzdCk7XG4gIH1cblxuICB2YXIgQ09ERUdFTl9UWVBFUyA9IHtcbiAgICBcIkxpdGVyYWxcIjogZnVuY3Rpb24obikge1xuICAgICAgICByZXR1cm4gbi5yYXc7XG4gICAgICB9LFxuICAgIFwiSWRlbnRpZmllclwiOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIHZhciBpZCA9IG4ubmFtZTtcbiAgICAgICAgaWYgKG1lbWJlckRlcHRoID4gMCkge1xuICAgICAgICAgIHJldHVybiBpZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29uc3RhbnRzLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgICAgIHJldHVybiBjb25zdGFudHNbaWRdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpZFdoaXRlTGlzdCkge1xuICAgICAgICAgIGlmIChpZFdoaXRlTGlzdC5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBpZDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2lnbmFsc1tpZF0gPSAxO1xuICAgICAgICAgICAgcmV0dXJuIFNJR05BTF9QUkVGSVggKyBpZDsgLy8gSEFDS2lzaC4uLlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaWRCbGFja0xpc3QgJiYgaWRCbGFja0xpc3QuaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSWxsZWdhbCBpZGVudGlmaWVyOiBcIiArIGlkKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaWQ7XG4gICAgICB9LFxuICAgIFwiUHJvZ3JhbVwiOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIHJldHVybiBuLmJvZHkubWFwKGNvZGVnZW4pLmpvaW4oXCJcXG5cIik7XG4gICAgICB9LFxuICAgIFwiTWVtYmVyRXhwcmVzc2lvblwiOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIHZhciBkID0gIW4uY29tcHV0ZWQ7XG4gICAgICAgIHZhciBvID0gY29kZWdlbihuLm9iamVjdCk7XG4gICAgICAgIGlmIChkKSBtZW1iZXJEZXB0aCArPSAxO1xuICAgICAgICB2YXIgcCA9IGNvZGVnZW4obi5wcm9wZXJ0eSk7XG4gICAgICAgIGlmIChvID09PSBEQVRVTSkgeyBmaWVsZHNbcF0gPSAxOyB9IC8vIEhBQ0tpc2guLi5cbiAgICAgICAgaWYgKGQpIG1lbWJlckRlcHRoIC09IDE7XG4gICAgICAgIHJldHVybiBvICsgKGQgPyBcIi5cIitwIDogXCJbXCIrcCtcIl1cIik7XG4gICAgICB9LFxuICAgIFwiQ2FsbEV4cHJlc3Npb25cIjogZnVuY3Rpb24obikge1xuICAgICAgICBpZiAobi5jYWxsZWUudHlwZSAhPT0gXCJJZGVudGlmaWVyXCIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbGxlZ2FsIGNhbGxlZSB0eXBlOiBcIiArIG4uY2FsbGVlLnR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjYWxsZWUgPSBuLmNhbGxlZS5uYW1lO1xuICAgICAgICB2YXIgYXJncyA9IG4uYXJndW1lbnRzO1xuICAgICAgICB2YXIgZm4gPSBmdW5jdGlvbnMuaGFzT3duUHJvcGVydHkoY2FsbGVlKSAmJiBmdW5jdGlvbnNbY2FsbGVlXTtcbiAgICAgICAgaWYgKCFmbikgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIGZ1bmN0aW9uOiBcIiArIGNhbGxlZSk7XG4gICAgICAgIHJldHVybiBmbiBpbnN0YW5jZW9mIEZ1bmN0aW9uXG4gICAgICAgICAgPyBmbihhcmdzKVxuICAgICAgICAgIDogZm4gKyBcIihcIiArIGFyZ3MubWFwKGNvZGVnZW4pLmpvaW4oXCIsXCIpICsgXCIpXCI7XG4gICAgICB9LFxuICAgIFwiQXJyYXlFeHByZXNzaW9uXCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgcmV0dXJuIFwiW1wiICsgbi5lbGVtZW50cy5tYXAoY29kZWdlbikuam9pbihcIixcIikgKyBcIl1cIjtcbiAgICAgIH0sXG4gICAgXCJCaW5hcnlFeHByZXNzaW9uXCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgcmV0dXJuIFwiKFwiICsgY29kZWdlbihuLmxlZnQpICsgbi5vcGVyYXRvciArIGNvZGVnZW4obi5yaWdodCkgKyBcIilcIjtcbiAgICAgIH0sXG4gICAgXCJVbmFyeUV4cHJlc3Npb25cIjogZnVuY3Rpb24obikge1xuICAgICAgICByZXR1cm4gXCIoXCIgKyBuLm9wZXJhdG9yICsgY29kZWdlbihuLmFyZ3VtZW50KSArIFwiKVwiO1xuICAgICAgfSxcbiAgICBcIlVwZGF0ZUV4cHJlc3Npb25cIjogZnVuY3Rpb24obikge1xuICAgICAgICByZXR1cm4gXCIoXCIgKyAocHJlZml4XG4gICAgICAgICAgPyBuLm9wZXJhdG9yICsgY29kZWdlbihuLmFyZ3VtZW50KVxuICAgICAgICAgIDogY29kZWdlbihuLmFyZ3VtZW50KSArIG4ub3BlcmF0b3JcbiAgICAgICAgKSArIFwiKVwiO1xuICAgICAgfSxcbiAgICBcIkNvbmRpdGlvbmFsRXhwcmVzc2lvblwiOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIHJldHVybiBcIihcIiArIGNvZGVnZW4obi50ZXN0KVxuICAgICAgICAgICsgXCI/XCIgKyBjb2RlZ2VuKG4uY29uc2VxdWVudClcbiAgICAgICAgICArIFwiOlwiICsgY29kZWdlbihuLmFsdGVybmF0ZSlcbiAgICAgICAgICArIFwiKVwiO1xuICAgICAgfSxcbiAgICBcIkxvZ2ljYWxFeHByZXNzaW9uXCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgcmV0dXJuIFwiKFwiICsgY29kZWdlbihuLmxlZnQpICsgbi5vcGVyYXRvciArIGNvZGVnZW4obi5yaWdodCkgKyBcIilcIjtcbiAgICAgIH0sXG4gICAgXCJPYmplY3RFeHByZXNzaW9uXCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgcmV0dXJuIFwie1wiICsgbi5wcm9wZXJ0aWVzLm1hcChjb2RlZ2VuKS5qb2luKFwiLFwiKSArIFwifVwiO1xuICAgICAgfSxcbiAgICBcIlByb3BlcnR5XCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgbWVtYmVyRGVwdGggKz0gMTtcbiAgICAgICAgdmFyIGsgPSBjb2RlZ2VuKG4ua2V5KTtcbiAgICAgICAgbWVtYmVyRGVwdGggLT0gMTtcbiAgICAgICAgcmV0dXJuIGsgKyBcIjpcIiArIGNvZGVnZW4obi52YWx1ZSk7XG4gICAgICB9LFxuICAgIFwiRXhwcmVzc2lvblN0YXRlbWVudFwiOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIHJldHVybiBjb2RlZ2VuKG4uZXhwcmVzc2lvbik7XG4gICAgICB9XG4gIH07XG4gIFxuICByZXR1cm4gY29kZWdlbl93cmFwO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgXCJOYU5cIjogICAgIFwiTmFOXCIsXG4gIFwiRVwiOiAgICAgICBcIk1hdGguRVwiLFxuICBcIkxOMlwiOiAgICAgXCJNYXRoLkxOMlwiLFxuICBcIkxOMTBcIjogICAgXCJNYXRoLkxOMTBcIixcbiAgXCJMT0cyRVwiOiAgIFwiTWF0aC5MT0cyRVwiLFxuICBcIkxPRzEwRVwiOiAgXCJNYXRoLkxPRzEwRVwiLFxuICBcIlBJXCI6ICAgICAgXCJNYXRoLlBJXCIsXG4gIFwiU1FSVDFfMlwiOiBcIk1hdGguU1FSVDFfMlwiLFxuICBcIlNRUlQyXCI6ICAgXCJNYXRoLlNRUlQyXCJcbn07IiwidmFyIGRhdGFsaWIgPSByZXF1aXJlKCdkYXRhbGliJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY29kZWdlbikge1xuXG4gIGZ1bmN0aW9uIGZuY2FsbChuYW1lLCBhcmdzLCBjYXN0LCB0eXBlKSB7XG4gICAgdmFyIG9iaiA9IGNvZGVnZW4oYXJnc1swXSk7XG4gICAgaWYgKGNhc3QpIHtcbiAgICAgIG9iaiA9IGNhc3QgKyBcIihcIiArIG9iaiArIFwiKVwiO1xuICAgICAgaWYgKGRsLnN0YXJ0c1dpdGgoY2FzdCwgXCJuZXcgXCIpKSBvYmogPSBcIihcIiArIG9iaiArIFwiKVwiO1xuICAgIH1cbiAgICByZXR1cm4gb2JqICsgXCIuXCIgKyBuYW1lICsgKHR5cGUgPCAwID8gXCJcIiA6IHR5cGUgPT09IDBcbiAgICAgID8gXCIoKVwiXG4gICAgICA6IFwiKFwiICsgYXJncy5zbGljZSgxKS5tYXAoY29kZWdlbikuam9pbihcIixcIikgKyBcIilcIik7XG4gIH1cbiAgXG4gIHZhciBEQVRFID0gXCJuZXcgRGF0ZVwiO1xuICB2YXIgU1RSSU5HID0gXCJTdHJpbmdcIjtcbiAgdmFyIFJFR0VYUCA9IFwiUmVnRXhwXCI7XG5cbiAgcmV0dXJuIHtcbiAgICAvLyBNQVRIIGZ1bmN0aW9uc1xuICAgIFwiaXNOYU5cIjogICAgXCJpc05hTlwiLFxuICAgIFwiaXNGaW5pdGVcIjogXCJpc0Zpbml0ZVwiLFxuICAgIFwiYWJzXCI6ICAgICAgXCJNYXRoLmFic1wiLFxuICAgIFwiYWNvc1wiOiAgICAgXCJNYXRoLmFjb3NcIixcbiAgICBcImFzaW5cIjogICAgIFwiTWF0aC5hc2luXCIsXG4gICAgXCJhdGFuXCI6ICAgICBcIk1hdGguYXRhblwiLFxuICAgIFwiYXRhbjJcIjogICAgXCJNYXRoLmF0YW4yXCIsXG4gICAgXCJjZWlsXCI6ICAgICBcIk1hdGguY2VpbFwiLFxuICAgIFwiY29zXCI6ICAgICAgXCJNYXRoLmNvc1wiLFxuICAgIFwiZXhwXCI6ICAgICAgXCJNYXRoLmV4cFwiLFxuICAgIFwiZmxvb3JcIjogICAgXCJNYXRoLmZsb29yXCIsXG4gICAgXCJsb2dcIjogICAgICBcIk1hdGgubG9nXCIsXG4gICAgXCJtYXhcIjogICAgICBcIk1hdGgubWF4XCIsXG4gICAgXCJtaW5cIjogICAgICBcIk1hdGgubWluXCIsXG4gICAgXCJwb3dcIjogICAgICBcIk1hdGgucG93XCIsXG4gICAgXCJyYW5kb21cIjogICBcIk1hdGgucmFuZG9tXCIsXG4gICAgXCJyb3VuZFwiOiAgICBcIk1hdGgucm91bmRcIixcbiAgICBcInNpblwiOiAgICAgIFwiTWF0aC5zaW5cIixcbiAgICBcInNxcnRcIjogICAgIFwiTWF0aC5zcXJ0XCIsXG4gICAgXCJ0YW5cIjogICAgICBcIk1hdGgudGFuXCIsXG5cbiAgICAvLyBEQVRFIGZ1bmN0aW9uc1xuICAgIFwibm93XCI6ICAgICAgXCJEYXRlLm5vd1wiLFxuICAgIFwiZGF0ZXRpbWVcIjogXCJuZXcgRGF0ZVwiLFxuICAgIFwiZGF0ZVwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXREYXRlXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcImRheVwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXREYXlcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwieWVhclwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRGdWxsWWVhclwiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJtb250aFwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRNb250aFwiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJob3Vyc1wiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRIb3Vyc1wiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJtaW51dGVzXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImdldE1pbnV0ZXNcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwic2Vjb25kc1wiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRTZWNvbmRzXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcIm1pbGxpc2Vjb25kc1wiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRNaWxsaXNlY29uZHNcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwidGltZVwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRUaW1lXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcInRpbWV6b25lb2Zmc2V0XCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImdldFRpbWV6b25lT2Zmc2V0XCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcInV0Y2RhdGVcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VVRDRGF0ZVwiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJ1dGNkYXlcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VVRDRGF5XCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcInV0Y3llYXJcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VVRDRnVsbFllYXJcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwidXRjbW9udGhcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VVRDTW9udGhcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwidXRjaG91cnNcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VVRDSG91cnNcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwidXRjbWludXRlc1wiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRVVENNaW51dGVzXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcInV0Y3NlY29uZHNcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VVRDU2Vjb25kc1wiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJ1dGNtaWxsaXNlY29uZHNcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VVRDTWlsbGlzZWNvbmRzXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcblxuICAgIC8vIHNoYXJlZCBzZXF1ZW5jZSBmdW5jdGlvbnNcbiAgICBcImxlbmd0aFwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJsZW5ndGhcIiwgYXJncywgbnVsbCwgLTEpO1xuICAgICAgfSxcbiAgICBcImluZGV4b2ZcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiaW5kZXhPZlwiLCBhcmdzLCBudWxsKTtcbiAgICAgIH0sXG4gICAgXCJsYXN0aW5kZXhvZlwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJsYXN0SW5kZXhPZlwiLCBhcmdzLCBudWxsKTtcbiAgICAgIH0sXG5cbiAgICAvLyBTVFJJTkcgZnVuY3Rpb25zXG4gICAgXCJwYXJzZUZsb2F0XCI6IFwicGFyc2VGbG9hdFwiLFxuICAgIFwicGFyc2VJbnRcIjogXCJwYXJzZUludFwiLFxuICAgIFwidXBwZXJcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwidG9VcHBlckNhc2VcIiwgYXJncywgU1RSSU5HLCAwKTtcbiAgICAgIH0sXG4gICAgXCJsb3dlclwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJ0b0xvd2VyQ2FzZVwiLCBhcmdzLCBTVFJJTkcsIDApO1xuICAgICAgfSxcbiAgICBcInNsaWNlXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcInNsaWNlXCIsIGFyZ3MsIFNUUklORyk7XG4gICAgICB9LFxuICAgIFwic3Vic3RyaW5nXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcInN1YnN0cmluZ1wiLCBhcmdzLCBTVFJJTkcpO1xuICAgICAgfSxcblxuICAgIC8vIFJFR0VYUCBmdW5jdGlvbnNcbiAgICBcInRlc3RcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwidGVzdFwiLCBhcmdzLCBSRUdFWFApO1xuICAgICAgfSxcbiAgICBcbiAgICAvLyBDb250cm9sIEZsb3cgZnVuY3Rpb25zXG4gICAgXCJpZlwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA8IDMpXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyBhcmd1bWVudHMgdG8gaWYgZnVuY3Rpb24uXCIpO1xuICAgICAgICBpZiAoYXJncy5sZW5ndGggPiAzKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUb28gbWFueSBhcmd1bWVudHMgdG8gaWYgZnVuY3Rpb24uXCIpO1xuICAgICAgICB2YXIgYSA9IGFyZ3MubWFwKGNvZGVnZW4pO1xuICAgICAgICByZXR1cm4gYVswXStcIj9cIithWzFdK1wiOlwiK2FbMl07XG4gICAgICB9XG4gIH07XG59OyIsInZhciBwYXJzZXIgPSByZXF1aXJlKCcuL3BhcnNlcicpLFxuICAgIGNvZGVnZW4gPSByZXF1aXJlKCcuL2NvZGVnZW4nKTtcbiAgICBcbm1vZHVsZS5leHBvcnRzID0ge1xuICBwYXJzZTogZnVuY3Rpb24oaW5wdXQsIG9wdCkgeyByZXR1cm4gcGFyc2VyLnBhcnNlKFwiKFwiK2lucHV0K1wiKVwiLCBvcHQpOyB9LFxuICBjb2RlOiBmdW5jdGlvbihvcHQpIHsgcmV0dXJuIGNvZGVnZW4ob3B0KTsgfVxufTtcbiIsIi8qXG4gIFRoZSBmb2xsb3dpbmcgZXhwcmVzc2lvbiBwYXJzZXIgaXMgYmFzZWQgb24gRXNwcmltYSAoaHR0cDovL2VzcHJpbWEub3JnLykuXG4gIE9yaWdpbmFsIGhlYWRlciBjb21tZW50IGFuZCBsaWNlbnNlIGZvciBFc3ByaW1hIGlzIGluY2x1ZGVkIGhlcmU6XG5cbiAgQ29weXJpZ2h0IChDKSAyMDEzIEFyaXlhIEhpZGF5YXQgPGFyaXlhLmhpZGF5YXRAZ21haWwuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTMgVGhhZGRlZSBUeWwgPHRoYWRkZWUudHlsQGdtYWlsLmNvbT5cbiAgQ29weXJpZ2h0IChDKSAyMDEzIE1hdGhpYXMgQnluZW5zIDxtYXRoaWFzQHFpd2kuYmU+XG4gIENvcHlyaWdodCAoQykgMjAxMiBBcml5YSBIaWRheWF0IDxhcml5YS5oaWRheWF0QGdtYWlsLmNvbT5cbiAgQ29weXJpZ2h0IChDKSAyMDEyIE1hdGhpYXMgQnluZW5zIDxtYXRoaWFzQHFpd2kuYmU+XG4gIENvcHlyaWdodCAoQykgMjAxMiBKb29zdC1XaW0gQm9la2VzdGVpam4gPGpvb3N0LXdpbUBib2VrZXN0ZWlqbi5ubD5cbiAgQ29weXJpZ2h0IChDKSAyMDEyIEtyaXMgS293YWwgPGtyaXMua293YWxAY2l4YXIuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTIgWXVzdWtlIFN1enVraSA8dXRhdGFuZS50ZWFAZ21haWwuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTIgQXJwYWQgQm9yc29zIDxhcnBhZC5ib3Jzb3NAZ29vZ2xlbWFpbC5jb20+XG4gIENvcHlyaWdodCAoQykgMjAxMSBBcml5YSBIaWRheWF0IDxhcml5YS5oaWRheWF0QGdtYWlsLmNvbT5cblxuICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCA8Q09QWVJJR0hUIEhPTERFUj4gQkUgTElBQkxFIEZPUiBBTllcbiAgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GXG4gIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4qL1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgVG9rZW4sXG4gICAgICBUb2tlbk5hbWUsXG4gICAgICBTeW50YXgsXG4gICAgICBQcm9wZXJ0eUtpbmQsXG4gICAgICBNZXNzYWdlcyxcbiAgICAgIFJlZ2V4LFxuICAgICAgc291cmNlLFxuICAgICAgc3RyaWN0LFxuICAgICAgaW5kZXgsXG4gICAgICBsaW5lTnVtYmVyLFxuICAgICAgbGluZVN0YXJ0LFxuICAgICAgbGVuZ3RoLFxuICAgICAgbG9va2FoZWFkLFxuICAgICAgc3RhdGUsXG4gICAgICBleHRyYTtcblxuICBUb2tlbiA9IHtcbiAgICAgIEJvb2xlYW5MaXRlcmFsOiAxLFxuICAgICAgRU9GOiAyLFxuICAgICAgSWRlbnRpZmllcjogMyxcbiAgICAgIEtleXdvcmQ6IDQsXG4gICAgICBOdWxsTGl0ZXJhbDogNSxcbiAgICAgIE51bWVyaWNMaXRlcmFsOiA2LFxuICAgICAgUHVuY3R1YXRvcjogNyxcbiAgICAgIFN0cmluZ0xpdGVyYWw6IDgsXG4gICAgICBSZWd1bGFyRXhwcmVzc2lvbjogOVxuICB9O1xuXG4gIFRva2VuTmFtZSA9IHt9O1xuICBUb2tlbk5hbWVbVG9rZW4uQm9vbGVhbkxpdGVyYWxdID0gJ0Jvb2xlYW4nO1xuICBUb2tlbk5hbWVbVG9rZW4uRU9GXSA9ICc8ZW5kPic7XG4gIFRva2VuTmFtZVtUb2tlbi5JZGVudGlmaWVyXSA9ICdJZGVudGlmaWVyJztcbiAgVG9rZW5OYW1lW1Rva2VuLktleXdvcmRdID0gJ0tleXdvcmQnO1xuICBUb2tlbk5hbWVbVG9rZW4uTnVsbExpdGVyYWxdID0gJ051bGwnO1xuICBUb2tlbk5hbWVbVG9rZW4uTnVtZXJpY0xpdGVyYWxdID0gJ051bWVyaWMnO1xuICBUb2tlbk5hbWVbVG9rZW4uUHVuY3R1YXRvcl0gPSAnUHVuY3R1YXRvcic7XG4gIFRva2VuTmFtZVtUb2tlbi5TdHJpbmdMaXRlcmFsXSA9ICdTdHJpbmcnO1xuICBUb2tlbk5hbWVbVG9rZW4uUmVndWxhckV4cHJlc3Npb25dID0gJ1JlZ3VsYXJFeHByZXNzaW9uJztcblxuICBTeW50YXggPSB7XG4gICAgICBBc3NpZ25tZW50RXhwcmVzc2lvbjogJ0Fzc2lnbm1lbnRFeHByZXNzaW9uJyxcbiAgICAgIEFycmF5RXhwcmVzc2lvbjogJ0FycmF5RXhwcmVzc2lvbicsXG4gICAgICBCaW5hcnlFeHByZXNzaW9uOiAnQmluYXJ5RXhwcmVzc2lvbicsXG4gICAgICBDYWxsRXhwcmVzc2lvbjogJ0NhbGxFeHByZXNzaW9uJyxcbiAgICAgIENvbmRpdGlvbmFsRXhwcmVzc2lvbjogJ0NvbmRpdGlvbmFsRXhwcmVzc2lvbicsXG4gICAgICBFeHByZXNzaW9uU3RhdGVtZW50OiAnRXhwcmVzc2lvblN0YXRlbWVudCcsXG4gICAgICBJZGVudGlmaWVyOiAnSWRlbnRpZmllcicsXG4gICAgICBMaXRlcmFsOiAnTGl0ZXJhbCcsXG4gICAgICBMb2dpY2FsRXhwcmVzc2lvbjogJ0xvZ2ljYWxFeHByZXNzaW9uJyxcbiAgICAgIE1lbWJlckV4cHJlc3Npb246ICdNZW1iZXJFeHByZXNzaW9uJyxcbiAgICAgIE9iamVjdEV4cHJlc3Npb246ICdPYmplY3RFeHByZXNzaW9uJyxcbiAgICAgIFByb2dyYW06ICdQcm9ncmFtJyxcbiAgICAgIFByb3BlcnR5OiAnUHJvcGVydHknLFxuICAgICAgVW5hcnlFeHByZXNzaW9uOiAnVW5hcnlFeHByZXNzaW9uJyxcbiAgICAgIFVwZGF0ZUV4cHJlc3Npb246ICdVcGRhdGVFeHByZXNzaW9uJ1xuICB9O1xuXG4gIFByb3BlcnR5S2luZCA9IHtcbiAgICAgIERhdGE6IDEsXG4gICAgICBHZXQ6IDIsXG4gICAgICBTZXQ6IDRcbiAgfTtcblxuICAvLyBFcnJvciBtZXNzYWdlcyBzaG91bGQgYmUgaWRlbnRpY2FsIHRvIFY4LlxuICBNZXNzYWdlcyA9IHtcbiAgICAgIFVuZXhwZWN0ZWRUb2tlbjogICdVbmV4cGVjdGVkIHRva2VuICUwJyxcbiAgICAgIFVuZXhwZWN0ZWROdW1iZXI6ICAnVW5leHBlY3RlZCBudW1iZXInLFxuICAgICAgVW5leHBlY3RlZFN0cmluZzogICdVbmV4cGVjdGVkIHN0cmluZycsXG4gICAgICBVbmV4cGVjdGVkSWRlbnRpZmllcjogICdVbmV4cGVjdGVkIGlkZW50aWZpZXInLFxuICAgICAgVW5leHBlY3RlZFJlc2VydmVkOiAgJ1VuZXhwZWN0ZWQgcmVzZXJ2ZWQgd29yZCcsXG4gICAgICBVbmV4cGVjdGVkRU9TOiAgJ1VuZXhwZWN0ZWQgZW5kIG9mIGlucHV0JyxcbiAgICAgIE5ld2xpbmVBZnRlclRocm93OiAgJ0lsbGVnYWwgbmV3bGluZSBhZnRlciB0aHJvdycsXG4gICAgICBJbnZhbGlkUmVnRXhwOiAnSW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb24nLFxuICAgICAgVW50ZXJtaW5hdGVkUmVnRXhwOiAgJ0ludmFsaWQgcmVndWxhciBleHByZXNzaW9uOiBtaXNzaW5nIC8nLFxuICAgICAgSW52YWxpZExIU0luQXNzaWdubWVudDogICdJbnZhbGlkIGxlZnQtaGFuZCBzaWRlIGluIGFzc2lnbm1lbnQnLFxuICAgICAgSW52YWxpZExIU0luRm9ySW46ICAnSW52YWxpZCBsZWZ0LWhhbmQgc2lkZSBpbiBmb3ItaW4nLFxuICAgICAgTXVsdGlwbGVEZWZhdWx0c0luU3dpdGNoOiAnTW9yZSB0aGFuIG9uZSBkZWZhdWx0IGNsYXVzZSBpbiBzd2l0Y2ggc3RhdGVtZW50JyxcbiAgICAgIE5vQ2F0Y2hPckZpbmFsbHk6ICAnTWlzc2luZyBjYXRjaCBvciBmaW5hbGx5IGFmdGVyIHRyeScsXG4gICAgICBVbmtub3duTGFiZWw6ICdVbmRlZmluZWQgbGFiZWwgXFwnJTBcXCcnLFxuICAgICAgUmVkZWNsYXJhdGlvbjogJyUwIFxcJyUxXFwnIGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWQnLFxuICAgICAgSWxsZWdhbENvbnRpbnVlOiAnSWxsZWdhbCBjb250aW51ZSBzdGF0ZW1lbnQnLFxuICAgICAgSWxsZWdhbEJyZWFrOiAnSWxsZWdhbCBicmVhayBzdGF0ZW1lbnQnLFxuICAgICAgSWxsZWdhbFJldHVybjogJ0lsbGVnYWwgcmV0dXJuIHN0YXRlbWVudCcsXG4gICAgICBTdHJpY3RNb2RlV2l0aDogICdTdHJpY3QgbW9kZSBjb2RlIG1heSBub3QgaW5jbHVkZSBhIHdpdGggc3RhdGVtZW50JyxcbiAgICAgIFN0cmljdENhdGNoVmFyaWFibGU6ICAnQ2F0Y2ggdmFyaWFibGUgbWF5IG5vdCBiZSBldmFsIG9yIGFyZ3VtZW50cyBpbiBzdHJpY3QgbW9kZScsXG4gICAgICBTdHJpY3RWYXJOYW1lOiAgJ1ZhcmlhYmxlIG5hbWUgbWF5IG5vdCBiZSBldmFsIG9yIGFyZ3VtZW50cyBpbiBzdHJpY3QgbW9kZScsXG4gICAgICBTdHJpY3RQYXJhbU5hbWU6ICAnUGFyYW1ldGVyIG5hbWUgZXZhbCBvciBhcmd1bWVudHMgaXMgbm90IGFsbG93ZWQgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgU3RyaWN0UGFyYW1EdXBlOiAnU3RyaWN0IG1vZGUgZnVuY3Rpb24gbWF5IG5vdCBoYXZlIGR1cGxpY2F0ZSBwYXJhbWV0ZXIgbmFtZXMnLFxuICAgICAgU3RyaWN0RnVuY3Rpb25OYW1lOiAgJ0Z1bmN0aW9uIG5hbWUgbWF5IG5vdCBiZSBldmFsIG9yIGFyZ3VtZW50cyBpbiBzdHJpY3QgbW9kZScsXG4gICAgICBTdHJpY3RPY3RhbExpdGVyYWw6ICAnT2N0YWwgbGl0ZXJhbHMgYXJlIG5vdCBhbGxvd2VkIGluIHN0cmljdCBtb2RlLicsXG4gICAgICBTdHJpY3REZWxldGU6ICAnRGVsZXRlIG9mIGFuIHVucXVhbGlmaWVkIGlkZW50aWZpZXIgaW4gc3RyaWN0IG1vZGUuJyxcbiAgICAgIFN0cmljdER1cGxpY2F0ZVByb3BlcnR5OiAgJ0R1cGxpY2F0ZSBkYXRhIHByb3BlcnR5IGluIG9iamVjdCBsaXRlcmFsIG5vdCBhbGxvd2VkIGluIHN0cmljdCBtb2RlJyxcbiAgICAgIEFjY2Vzc29yRGF0YVByb3BlcnR5OiAgJ09iamVjdCBsaXRlcmFsIG1heSBub3QgaGF2ZSBkYXRhIGFuZCBhY2Nlc3NvciBwcm9wZXJ0eSB3aXRoIHRoZSBzYW1lIG5hbWUnLFxuICAgICAgQWNjZXNzb3JHZXRTZXQ6ICAnT2JqZWN0IGxpdGVyYWwgbWF5IG5vdCBoYXZlIG11bHRpcGxlIGdldC9zZXQgYWNjZXNzb3JzIHdpdGggdGhlIHNhbWUgbmFtZScsXG4gICAgICBTdHJpY3RMSFNBc3NpZ25tZW50OiAgJ0Fzc2lnbm1lbnQgdG8gZXZhbCBvciBhcmd1bWVudHMgaXMgbm90IGFsbG93ZWQgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgU3RyaWN0TEhTUG9zdGZpeDogICdQb3N0Zml4IGluY3JlbWVudC9kZWNyZW1lbnQgbWF5IG5vdCBoYXZlIGV2YWwgb3IgYXJndW1lbnRzIG9wZXJhbmQgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgU3RyaWN0TEhTUHJlZml4OiAgJ1ByZWZpeCBpbmNyZW1lbnQvZGVjcmVtZW50IG1heSBub3QgaGF2ZSBldmFsIG9yIGFyZ3VtZW50cyBvcGVyYW5kIGluIHN0cmljdCBtb2RlJyxcbiAgICAgIFN0cmljdFJlc2VydmVkV29yZDogICdVc2Ugb2YgZnV0dXJlIHJlc2VydmVkIHdvcmQgaW4gc3RyaWN0IG1vZGUnXG4gIH07XG5cbiAgLy8gU2VlIGFsc28gdG9vbHMvZ2VuZXJhdGUtdW5pY29kZS1yZWdleC5weS5cbiAgUmVnZXggPSB7XG4gICAgICBOb25Bc2NpaUlkZW50aWZpZXJTdGFydDogbmV3IFJlZ0V4cCgnW1xceEFBXFx4QjVcXHhCQVxceEMwLVxceEQ2XFx4RDgtXFx4RjZcXHhGOC1cXHUwMkMxXFx1MDJDNi1cXHUwMkQxXFx1MDJFMC1cXHUwMkU0XFx1MDJFQ1xcdTAyRUVcXHUwMzcwLVxcdTAzNzRcXHUwMzc2XFx1MDM3N1xcdTAzN0EtXFx1MDM3RFxcdTAzN0ZcXHUwMzg2XFx1MDM4OC1cXHUwMzhBXFx1MDM4Q1xcdTAzOEUtXFx1MDNBMVxcdTAzQTMtXFx1MDNGNVxcdTAzRjctXFx1MDQ4MVxcdTA0OEEtXFx1MDUyRlxcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYxLVxcdTA1ODdcXHUwNUQwLVxcdTA1RUFcXHUwNUYwLVxcdTA1RjJcXHUwNjIwLVxcdTA2NEFcXHUwNjZFXFx1MDY2RlxcdTA2NzEtXFx1MDZEM1xcdTA2RDVcXHUwNkU1XFx1MDZFNlxcdTA2RUVcXHUwNkVGXFx1MDZGQS1cXHUwNkZDXFx1MDZGRlxcdTA3MTBcXHUwNzEyLVxcdTA3MkZcXHUwNzRELVxcdTA3QTVcXHUwN0IxXFx1MDdDQS1cXHUwN0VBXFx1MDdGNFxcdTA3RjVcXHUwN0ZBXFx1MDgwMC1cXHUwODE1XFx1MDgxQVxcdTA4MjRcXHUwODI4XFx1MDg0MC1cXHUwODU4XFx1MDhBMC1cXHUwOEIyXFx1MDkwNC1cXHUwOTM5XFx1MDkzRFxcdTA5NTBcXHUwOTU4LVxcdTA5NjFcXHUwOTcxLVxcdTA5ODBcXHUwOTg1LVxcdTA5OENcXHUwOThGXFx1MDk5MFxcdTA5OTMtXFx1MDlBOFxcdTA5QUEtXFx1MDlCMFxcdTA5QjJcXHUwOUI2LVxcdTA5QjlcXHUwOUJEXFx1MDlDRVxcdTA5RENcXHUwOUREXFx1MDlERi1cXHUwOUUxXFx1MDlGMFxcdTA5RjFcXHUwQTA1LVxcdTBBMEFcXHUwQTBGXFx1MEExMFxcdTBBMTMtXFx1MEEyOFxcdTBBMkEtXFx1MEEzMFxcdTBBMzJcXHUwQTMzXFx1MEEzNVxcdTBBMzZcXHUwQTM4XFx1MEEzOVxcdTBBNTktXFx1MEE1Q1xcdTBBNUVcXHUwQTcyLVxcdTBBNzRcXHUwQTg1LVxcdTBBOERcXHUwQThGLVxcdTBBOTFcXHUwQTkzLVxcdTBBQThcXHUwQUFBLVxcdTBBQjBcXHUwQUIyXFx1MEFCM1xcdTBBQjUtXFx1MEFCOVxcdTBBQkRcXHUwQUQwXFx1MEFFMFxcdTBBRTFcXHUwQjA1LVxcdTBCMENcXHUwQjBGXFx1MEIxMFxcdTBCMTMtXFx1MEIyOFxcdTBCMkEtXFx1MEIzMFxcdTBCMzJcXHUwQjMzXFx1MEIzNS1cXHUwQjM5XFx1MEIzRFxcdTBCNUNcXHUwQjVEXFx1MEI1Ri1cXHUwQjYxXFx1MEI3MVxcdTBCODNcXHUwQjg1LVxcdTBCOEFcXHUwQjhFLVxcdTBCOTBcXHUwQjkyLVxcdTBCOTVcXHUwQjk5XFx1MEI5QVxcdTBCOUNcXHUwQjlFXFx1MEI5RlxcdTBCQTNcXHUwQkE0XFx1MEJBOC1cXHUwQkFBXFx1MEJBRS1cXHUwQkI5XFx1MEJEMFxcdTBDMDUtXFx1MEMwQ1xcdTBDMEUtXFx1MEMxMFxcdTBDMTItXFx1MEMyOFxcdTBDMkEtXFx1MEMzOVxcdTBDM0RcXHUwQzU4XFx1MEM1OVxcdTBDNjBcXHUwQzYxXFx1MEM4NS1cXHUwQzhDXFx1MEM4RS1cXHUwQzkwXFx1MEM5Mi1cXHUwQ0E4XFx1MENBQS1cXHUwQ0IzXFx1MENCNS1cXHUwQ0I5XFx1MENCRFxcdTBDREVcXHUwQ0UwXFx1MENFMVxcdTBDRjFcXHUwQ0YyXFx1MEQwNS1cXHUwRDBDXFx1MEQwRS1cXHUwRDEwXFx1MEQxMi1cXHUwRDNBXFx1MEQzRFxcdTBENEVcXHUwRDYwXFx1MEQ2MVxcdTBEN0EtXFx1MEQ3RlxcdTBEODUtXFx1MEQ5NlxcdTBEOUEtXFx1MERCMVxcdTBEQjMtXFx1MERCQlxcdTBEQkRcXHUwREMwLVxcdTBEQzZcXHUwRTAxLVxcdTBFMzBcXHUwRTMyXFx1MEUzM1xcdTBFNDAtXFx1MEU0NlxcdTBFODFcXHUwRTgyXFx1MEU4NFxcdTBFODdcXHUwRTg4XFx1MEU4QVxcdTBFOERcXHUwRTk0LVxcdTBFOTdcXHUwRTk5LVxcdTBFOUZcXHUwRUExLVxcdTBFQTNcXHUwRUE1XFx1MEVBN1xcdTBFQUFcXHUwRUFCXFx1MEVBRC1cXHUwRUIwXFx1MEVCMlxcdTBFQjNcXHUwRUJEXFx1MEVDMC1cXHUwRUM0XFx1MEVDNlxcdTBFREMtXFx1MEVERlxcdTBGMDBcXHUwRjQwLVxcdTBGNDdcXHUwRjQ5LVxcdTBGNkNcXHUwRjg4LVxcdTBGOENcXHUxMDAwLVxcdTEwMkFcXHUxMDNGXFx1MTA1MC1cXHUxMDU1XFx1MTA1QS1cXHUxMDVEXFx1MTA2MVxcdTEwNjVcXHUxMDY2XFx1MTA2RS1cXHUxMDcwXFx1MTA3NS1cXHUxMDgxXFx1MTA4RVxcdTEwQTAtXFx1MTBDNVxcdTEwQzdcXHUxMENEXFx1MTBEMC1cXHUxMEZBXFx1MTBGQy1cXHUxMjQ4XFx1MTI0QS1cXHUxMjREXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNUEtXFx1MTI1RFxcdTEyNjAtXFx1MTI4OFxcdTEyOEEtXFx1MTI4RFxcdTEyOTAtXFx1MTJCMFxcdTEyQjItXFx1MTJCNVxcdTEyQjgtXFx1MTJCRVxcdTEyQzBcXHUxMkMyLVxcdTEyQzVcXHUxMkM4LVxcdTEyRDZcXHUxMkQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNUFcXHUxMzgwLVxcdTEzOEZcXHUxM0EwLVxcdTEzRjRcXHUxNDAxLVxcdTE2NkNcXHUxNjZGLVxcdTE2N0ZcXHUxNjgxLVxcdTE2OUFcXHUxNkEwLVxcdTE2RUFcXHUxNkVFLVxcdTE2RjhcXHUxNzAwLVxcdTE3MENcXHUxNzBFLVxcdTE3MTFcXHUxNzIwLVxcdTE3MzFcXHUxNzQwLVxcdTE3NTFcXHUxNzYwLVxcdTE3NkNcXHUxNzZFLVxcdTE3NzBcXHUxNzgwLVxcdTE3QjNcXHUxN0Q3XFx1MTdEQ1xcdTE4MjAtXFx1MTg3N1xcdTE4ODAtXFx1MThBOFxcdTE4QUFcXHUxOEIwLVxcdTE4RjVcXHUxOTAwLVxcdTE5MUVcXHUxOTUwLVxcdTE5NkRcXHUxOTcwLVxcdTE5NzRcXHUxOTgwLVxcdTE5QUJcXHUxOUMxLVxcdTE5QzdcXHUxQTAwLVxcdTFBMTZcXHUxQTIwLVxcdTFBNTRcXHUxQUE3XFx1MUIwNS1cXHUxQjMzXFx1MUI0NS1cXHUxQjRCXFx1MUI4My1cXHUxQkEwXFx1MUJBRVxcdTFCQUZcXHUxQkJBLVxcdTFCRTVcXHUxQzAwLVxcdTFDMjNcXHUxQzRELVxcdTFDNEZcXHUxQzVBLVxcdTFDN0RcXHUxQ0U5LVxcdTFDRUNcXHUxQ0VFLVxcdTFDRjFcXHUxQ0Y1XFx1MUNGNlxcdTFEMDAtXFx1MURCRlxcdTFFMDAtXFx1MUYxNVxcdTFGMTgtXFx1MUYxRFxcdTFGMjAtXFx1MUY0NVxcdTFGNDgtXFx1MUY0RFxcdTFGNTAtXFx1MUY1N1xcdTFGNTlcXHUxRjVCXFx1MUY1RFxcdTFGNUYtXFx1MUY3RFxcdTFGODAtXFx1MUZCNFxcdTFGQjYtXFx1MUZCQ1xcdTFGQkVcXHUxRkMyLVxcdTFGQzRcXHUxRkM2LVxcdTFGQ0NcXHUxRkQwLVxcdTFGRDNcXHUxRkQ2LVxcdTFGREJcXHUxRkUwLVxcdTFGRUNcXHUxRkYyLVxcdTFGRjRcXHUxRkY2LVxcdTFGRkNcXHUyMDcxXFx1MjA3RlxcdTIwOTAtXFx1MjA5Q1xcdTIxMDJcXHUyMTA3XFx1MjEwQS1cXHUyMTEzXFx1MjExNVxcdTIxMTktXFx1MjExRFxcdTIxMjRcXHUyMTI2XFx1MjEyOFxcdTIxMkEtXFx1MjEyRFxcdTIxMkYtXFx1MjEzOVxcdTIxM0MtXFx1MjEzRlxcdTIxNDUtXFx1MjE0OVxcdTIxNEVcXHUyMTYwLVxcdTIxODhcXHUyQzAwLVxcdTJDMkVcXHUyQzMwLVxcdTJDNUVcXHUyQzYwLVxcdTJDRTRcXHUyQ0VCLVxcdTJDRUVcXHUyQ0YyXFx1MkNGM1xcdTJEMDAtXFx1MkQyNVxcdTJEMjdcXHUyRDJEXFx1MkQzMC1cXHUyRDY3XFx1MkQ2RlxcdTJEODAtXFx1MkQ5NlxcdTJEQTAtXFx1MkRBNlxcdTJEQTgtXFx1MkRBRVxcdTJEQjAtXFx1MkRCNlxcdTJEQjgtXFx1MkRCRVxcdTJEQzAtXFx1MkRDNlxcdTJEQzgtXFx1MkRDRVxcdTJERDAtXFx1MkRENlxcdTJERDgtXFx1MkRERVxcdTJFMkZcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMjlcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM0NcXHUzMDQxLVxcdTMwOTZcXHUzMDlELVxcdTMwOUZcXHUzMEExLVxcdTMwRkFcXHUzMEZDLVxcdTMwRkZcXHUzMTA1LVxcdTMxMkRcXHUzMTMxLVxcdTMxOEVcXHUzMUEwLVxcdTMxQkFcXHUzMUYwLVxcdTMxRkZcXHUzNDAwLVxcdTREQjVcXHU0RTAwLVxcdTlGQ0NcXHVBMDAwLVxcdUE0OENcXHVBNEQwLVxcdUE0RkRcXHVBNTAwLVxcdUE2MENcXHVBNjEwLVxcdUE2MUZcXHVBNjJBXFx1QTYyQlxcdUE2NDAtXFx1QTY2RVxcdUE2N0YtXFx1QTY5RFxcdUE2QTAtXFx1QTZFRlxcdUE3MTctXFx1QTcxRlxcdUE3MjItXFx1QTc4OFxcdUE3OEItXFx1QTc4RVxcdUE3OTAtXFx1QTdBRFxcdUE3QjBcXHVBN0IxXFx1QTdGNy1cXHVBODAxXFx1QTgwMy1cXHVBODA1XFx1QTgwNy1cXHVBODBBXFx1QTgwQy1cXHVBODIyXFx1QTg0MC1cXHVBODczXFx1QTg4Mi1cXHVBOEIzXFx1QThGMi1cXHVBOEY3XFx1QThGQlxcdUE5MEEtXFx1QTkyNVxcdUE5MzAtXFx1QTk0NlxcdUE5NjAtXFx1QTk3Q1xcdUE5ODQtXFx1QTlCMlxcdUE5Q0ZcXHVBOUUwLVxcdUE5RTRcXHVBOUU2LVxcdUE5RUZcXHVBOUZBLVxcdUE5RkVcXHVBQTAwLVxcdUFBMjhcXHVBQTQwLVxcdUFBNDJcXHVBQTQ0LVxcdUFBNEJcXHVBQTYwLVxcdUFBNzZcXHVBQTdBXFx1QUE3RS1cXHVBQUFGXFx1QUFCMVxcdUFBQjVcXHVBQUI2XFx1QUFCOS1cXHVBQUJEXFx1QUFDMFxcdUFBQzJcXHVBQURCLVxcdUFBRERcXHVBQUUwLVxcdUFBRUFcXHVBQUYyLVxcdUFBRjRcXHVBQjAxLVxcdUFCMDZcXHVBQjA5LVxcdUFCMEVcXHVBQjExLVxcdUFCMTZcXHVBQjIwLVxcdUFCMjZcXHVBQjI4LVxcdUFCMkVcXHVBQjMwLVxcdUFCNUFcXHVBQjVDLVxcdUFCNUZcXHVBQjY0XFx1QUI2NVxcdUFCQzAtXFx1QUJFMlxcdUFDMDAtXFx1RDdBM1xcdUQ3QjAtXFx1RDdDNlxcdUQ3Q0ItXFx1RDdGQlxcdUY5MDAtXFx1RkE2RFxcdUZBNzAtXFx1RkFEOVxcdUZCMDAtXFx1RkIwNlxcdUZCMTMtXFx1RkIxN1xcdUZCMURcXHVGQjFGLVxcdUZCMjhcXHVGQjJBLVxcdUZCMzZcXHVGQjM4LVxcdUZCM0NcXHVGQjNFXFx1RkI0MFxcdUZCNDFcXHVGQjQzXFx1RkI0NFxcdUZCNDYtXFx1RkJCMVxcdUZCRDMtXFx1RkQzRFxcdUZENTAtXFx1RkQ4RlxcdUZEOTItXFx1RkRDN1xcdUZERjAtXFx1RkRGQlxcdUZFNzAtXFx1RkU3NFxcdUZFNzYtXFx1RkVGQ1xcdUZGMjEtXFx1RkYzQVxcdUZGNDEtXFx1RkY1QVxcdUZGNjYtXFx1RkZCRVxcdUZGQzItXFx1RkZDN1xcdUZGQ0EtXFx1RkZDRlxcdUZGRDItXFx1RkZEN1xcdUZGREEtXFx1RkZEQ10nKSxcbiAgICAgIE5vbkFzY2lpSWRlbnRpZmllclBhcnQ6IG5ldyBSZWdFeHAoJ1tcXHhBQVxceEI1XFx4QkFcXHhDMC1cXHhENlxceEQ4LVxceEY2XFx4RjgtXFx1MDJDMVxcdTAyQzYtXFx1MDJEMVxcdTAyRTAtXFx1MDJFNFxcdTAyRUNcXHUwMkVFXFx1MDMwMC1cXHUwMzc0XFx1MDM3NlxcdTAzNzdcXHUwMzdBLVxcdTAzN0RcXHUwMzdGXFx1MDM4NlxcdTAzODgtXFx1MDM4QVxcdTAzOENcXHUwMzhFLVxcdTAzQTFcXHUwM0EzLVxcdTAzRjVcXHUwM0Y3LVxcdTA0ODFcXHUwNDgzLVxcdTA0ODdcXHUwNDhBLVxcdTA1MkZcXHUwNTMxLVxcdTA1NTZcXHUwNTU5XFx1MDU2MS1cXHUwNTg3XFx1MDU5MS1cXHUwNUJEXFx1MDVCRlxcdTA1QzFcXHUwNUMyXFx1MDVDNFxcdTA1QzVcXHUwNUM3XFx1MDVEMC1cXHUwNUVBXFx1MDVGMC1cXHUwNUYyXFx1MDYxMC1cXHUwNjFBXFx1MDYyMC1cXHUwNjY5XFx1MDY2RS1cXHUwNkQzXFx1MDZENS1cXHUwNkRDXFx1MDZERi1cXHUwNkU4XFx1MDZFQS1cXHUwNkZDXFx1MDZGRlxcdTA3MTAtXFx1MDc0QVxcdTA3NEQtXFx1MDdCMVxcdTA3QzAtXFx1MDdGNVxcdTA3RkFcXHUwODAwLVxcdTA4MkRcXHUwODQwLVxcdTA4NUJcXHUwOEEwLVxcdTA4QjJcXHUwOEU0LVxcdTA5NjNcXHUwOTY2LVxcdTA5NkZcXHUwOTcxLVxcdTA5ODNcXHUwOTg1LVxcdTA5OENcXHUwOThGXFx1MDk5MFxcdTA5OTMtXFx1MDlBOFxcdTA5QUEtXFx1MDlCMFxcdTA5QjJcXHUwOUI2LVxcdTA5QjlcXHUwOUJDLVxcdTA5QzRcXHUwOUM3XFx1MDlDOFxcdTA5Q0ItXFx1MDlDRVxcdTA5RDdcXHUwOURDXFx1MDlERFxcdTA5REYtXFx1MDlFM1xcdTA5RTYtXFx1MDlGMVxcdTBBMDEtXFx1MEEwM1xcdTBBMDUtXFx1MEEwQVxcdTBBMEZcXHUwQTEwXFx1MEExMy1cXHUwQTI4XFx1MEEyQS1cXHUwQTMwXFx1MEEzMlxcdTBBMzNcXHUwQTM1XFx1MEEzNlxcdTBBMzhcXHUwQTM5XFx1MEEzQ1xcdTBBM0UtXFx1MEE0MlxcdTBBNDdcXHUwQTQ4XFx1MEE0Qi1cXHUwQTREXFx1MEE1MVxcdTBBNTktXFx1MEE1Q1xcdTBBNUVcXHUwQTY2LVxcdTBBNzVcXHUwQTgxLVxcdTBBODNcXHUwQTg1LVxcdTBBOERcXHUwQThGLVxcdTBBOTFcXHUwQTkzLVxcdTBBQThcXHUwQUFBLVxcdTBBQjBcXHUwQUIyXFx1MEFCM1xcdTBBQjUtXFx1MEFCOVxcdTBBQkMtXFx1MEFDNVxcdTBBQzctXFx1MEFDOVxcdTBBQ0ItXFx1MEFDRFxcdTBBRDBcXHUwQUUwLVxcdTBBRTNcXHUwQUU2LVxcdTBBRUZcXHUwQjAxLVxcdTBCMDNcXHUwQjA1LVxcdTBCMENcXHUwQjBGXFx1MEIxMFxcdTBCMTMtXFx1MEIyOFxcdTBCMkEtXFx1MEIzMFxcdTBCMzJcXHUwQjMzXFx1MEIzNS1cXHUwQjM5XFx1MEIzQy1cXHUwQjQ0XFx1MEI0N1xcdTBCNDhcXHUwQjRCLVxcdTBCNERcXHUwQjU2XFx1MEI1N1xcdTBCNUNcXHUwQjVEXFx1MEI1Ri1cXHUwQjYzXFx1MEI2Ni1cXHUwQjZGXFx1MEI3MVxcdTBCODJcXHUwQjgzXFx1MEI4NS1cXHUwQjhBXFx1MEI4RS1cXHUwQjkwXFx1MEI5Mi1cXHUwQjk1XFx1MEI5OVxcdTBCOUFcXHUwQjlDXFx1MEI5RVxcdTBCOUZcXHUwQkEzXFx1MEJBNFxcdTBCQTgtXFx1MEJBQVxcdTBCQUUtXFx1MEJCOVxcdTBCQkUtXFx1MEJDMlxcdTBCQzYtXFx1MEJDOFxcdTBCQ0EtXFx1MEJDRFxcdTBCRDBcXHUwQkQ3XFx1MEJFNi1cXHUwQkVGXFx1MEMwMC1cXHUwQzAzXFx1MEMwNS1cXHUwQzBDXFx1MEMwRS1cXHUwQzEwXFx1MEMxMi1cXHUwQzI4XFx1MEMyQS1cXHUwQzM5XFx1MEMzRC1cXHUwQzQ0XFx1MEM0Ni1cXHUwQzQ4XFx1MEM0QS1cXHUwQzREXFx1MEM1NVxcdTBDNTZcXHUwQzU4XFx1MEM1OVxcdTBDNjAtXFx1MEM2M1xcdTBDNjYtXFx1MEM2RlxcdTBDODEtXFx1MEM4M1xcdTBDODUtXFx1MEM4Q1xcdTBDOEUtXFx1MEM5MFxcdTBDOTItXFx1MENBOFxcdTBDQUEtXFx1MENCM1xcdTBDQjUtXFx1MENCOVxcdTBDQkMtXFx1MENDNFxcdTBDQzYtXFx1MENDOFxcdTBDQ0EtXFx1MENDRFxcdTBDRDVcXHUwQ0Q2XFx1MENERVxcdTBDRTAtXFx1MENFM1xcdTBDRTYtXFx1MENFRlxcdTBDRjFcXHUwQ0YyXFx1MEQwMS1cXHUwRDAzXFx1MEQwNS1cXHUwRDBDXFx1MEQwRS1cXHUwRDEwXFx1MEQxMi1cXHUwRDNBXFx1MEQzRC1cXHUwRDQ0XFx1MEQ0Ni1cXHUwRDQ4XFx1MEQ0QS1cXHUwRDRFXFx1MEQ1N1xcdTBENjAtXFx1MEQ2M1xcdTBENjYtXFx1MEQ2RlxcdTBEN0EtXFx1MEQ3RlxcdTBEODJcXHUwRDgzXFx1MEQ4NS1cXHUwRDk2XFx1MEQ5QS1cXHUwREIxXFx1MERCMy1cXHUwREJCXFx1MERCRFxcdTBEQzAtXFx1MERDNlxcdTBEQ0FcXHUwRENGLVxcdTBERDRcXHUwREQ2XFx1MEREOC1cXHUwRERGXFx1MERFNi1cXHUwREVGXFx1MERGMlxcdTBERjNcXHUwRTAxLVxcdTBFM0FcXHUwRTQwLVxcdTBFNEVcXHUwRTUwLVxcdTBFNTlcXHUwRTgxXFx1MEU4MlxcdTBFODRcXHUwRTg3XFx1MEU4OFxcdTBFOEFcXHUwRThEXFx1MEU5NC1cXHUwRTk3XFx1MEU5OS1cXHUwRTlGXFx1MEVBMS1cXHUwRUEzXFx1MEVBNVxcdTBFQTdcXHUwRUFBXFx1MEVBQlxcdTBFQUQtXFx1MEVCOVxcdTBFQkItXFx1MEVCRFxcdTBFQzAtXFx1MEVDNFxcdTBFQzZcXHUwRUM4LVxcdTBFQ0RcXHUwRUQwLVxcdTBFRDlcXHUwRURDLVxcdTBFREZcXHUwRjAwXFx1MEYxOFxcdTBGMTlcXHUwRjIwLVxcdTBGMjlcXHUwRjM1XFx1MEYzN1xcdTBGMzlcXHUwRjNFLVxcdTBGNDdcXHUwRjQ5LVxcdTBGNkNcXHUwRjcxLVxcdTBGODRcXHUwRjg2LVxcdTBGOTdcXHUwRjk5LVxcdTBGQkNcXHUwRkM2XFx1MTAwMC1cXHUxMDQ5XFx1MTA1MC1cXHUxMDlEXFx1MTBBMC1cXHUxMEM1XFx1MTBDN1xcdTEwQ0RcXHUxMEQwLVxcdTEwRkFcXHUxMEZDLVxcdTEyNDhcXHUxMjRBLVxcdTEyNERcXHUxMjUwLVxcdTEyNTZcXHUxMjU4XFx1MTI1QS1cXHUxMjVEXFx1MTI2MC1cXHUxMjg4XFx1MTI4QS1cXHUxMjhEXFx1MTI5MC1cXHUxMkIwXFx1MTJCMi1cXHUxMkI1XFx1MTJCOC1cXHUxMkJFXFx1MTJDMFxcdTEyQzItXFx1MTJDNVxcdTEyQzgtXFx1MTJENlxcdTEyRDgtXFx1MTMxMFxcdTEzMTItXFx1MTMxNVxcdTEzMTgtXFx1MTM1QVxcdTEzNUQtXFx1MTM1RlxcdTEzODAtXFx1MTM4RlxcdTEzQTAtXFx1MTNGNFxcdTE0MDEtXFx1MTY2Q1xcdTE2NkYtXFx1MTY3RlxcdTE2ODEtXFx1MTY5QVxcdTE2QTAtXFx1MTZFQVxcdTE2RUUtXFx1MTZGOFxcdTE3MDAtXFx1MTcwQ1xcdTE3MEUtXFx1MTcxNFxcdTE3MjAtXFx1MTczNFxcdTE3NDAtXFx1MTc1M1xcdTE3NjAtXFx1MTc2Q1xcdTE3NkUtXFx1MTc3MFxcdTE3NzJcXHUxNzczXFx1MTc4MC1cXHUxN0QzXFx1MTdEN1xcdTE3RENcXHUxN0REXFx1MTdFMC1cXHUxN0U5XFx1MTgwQi1cXHUxODBEXFx1MTgxMC1cXHUxODE5XFx1MTgyMC1cXHUxODc3XFx1MTg4MC1cXHUxOEFBXFx1MThCMC1cXHUxOEY1XFx1MTkwMC1cXHUxOTFFXFx1MTkyMC1cXHUxOTJCXFx1MTkzMC1cXHUxOTNCXFx1MTk0Ni1cXHUxOTZEXFx1MTk3MC1cXHUxOTc0XFx1MTk4MC1cXHUxOUFCXFx1MTlCMC1cXHUxOUM5XFx1MTlEMC1cXHUxOUQ5XFx1MUEwMC1cXHUxQTFCXFx1MUEyMC1cXHUxQTVFXFx1MUE2MC1cXHUxQTdDXFx1MUE3Ri1cXHUxQTg5XFx1MUE5MC1cXHUxQTk5XFx1MUFBN1xcdTFBQjAtXFx1MUFCRFxcdTFCMDAtXFx1MUI0QlxcdTFCNTAtXFx1MUI1OVxcdTFCNkItXFx1MUI3M1xcdTFCODAtXFx1MUJGM1xcdTFDMDAtXFx1MUMzN1xcdTFDNDAtXFx1MUM0OVxcdTFDNEQtXFx1MUM3RFxcdTFDRDAtXFx1MUNEMlxcdTFDRDQtXFx1MUNGNlxcdTFDRjhcXHUxQ0Y5XFx1MUQwMC1cXHUxREY1XFx1MURGQy1cXHUxRjE1XFx1MUYxOC1cXHUxRjFEXFx1MUYyMC1cXHUxRjQ1XFx1MUY0OC1cXHUxRjREXFx1MUY1MC1cXHUxRjU3XFx1MUY1OVxcdTFGNUJcXHUxRjVEXFx1MUY1Ri1cXHUxRjdEXFx1MUY4MC1cXHUxRkI0XFx1MUZCNi1cXHUxRkJDXFx1MUZCRVxcdTFGQzItXFx1MUZDNFxcdTFGQzYtXFx1MUZDQ1xcdTFGRDAtXFx1MUZEM1xcdTFGRDYtXFx1MUZEQlxcdTFGRTAtXFx1MUZFQ1xcdTFGRjItXFx1MUZGNFxcdTFGRjYtXFx1MUZGQ1xcdTIwMENcXHUyMDBEXFx1MjAzRlxcdTIwNDBcXHUyMDU0XFx1MjA3MVxcdTIwN0ZcXHUyMDkwLVxcdTIwOUNcXHUyMEQwLVxcdTIwRENcXHUyMEUxXFx1MjBFNS1cXHUyMEYwXFx1MjEwMlxcdTIxMDdcXHUyMTBBLVxcdTIxMTNcXHUyMTE1XFx1MjExOS1cXHUyMTFEXFx1MjEyNFxcdTIxMjZcXHUyMTI4XFx1MjEyQS1cXHUyMTJEXFx1MjEyRi1cXHUyMTM5XFx1MjEzQy1cXHUyMTNGXFx1MjE0NS1cXHUyMTQ5XFx1MjE0RVxcdTIxNjAtXFx1MjE4OFxcdTJDMDAtXFx1MkMyRVxcdTJDMzAtXFx1MkM1RVxcdTJDNjAtXFx1MkNFNFxcdTJDRUItXFx1MkNGM1xcdTJEMDAtXFx1MkQyNVxcdTJEMjdcXHUyRDJEXFx1MkQzMC1cXHUyRDY3XFx1MkQ2RlxcdTJEN0YtXFx1MkQ5NlxcdTJEQTAtXFx1MkRBNlxcdTJEQTgtXFx1MkRBRVxcdTJEQjAtXFx1MkRCNlxcdTJEQjgtXFx1MkRCRVxcdTJEQzAtXFx1MkRDNlxcdTJEQzgtXFx1MkRDRVxcdTJERDAtXFx1MkRENlxcdTJERDgtXFx1MkRERVxcdTJERTAtXFx1MkRGRlxcdTJFMkZcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMkZcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM0NcXHUzMDQxLVxcdTMwOTZcXHUzMDk5XFx1MzA5QVxcdTMwOUQtXFx1MzA5RlxcdTMwQTEtXFx1MzBGQVxcdTMwRkMtXFx1MzBGRlxcdTMxMDUtXFx1MzEyRFxcdTMxMzEtXFx1MzE4RVxcdTMxQTAtXFx1MzFCQVxcdTMxRjAtXFx1MzFGRlxcdTM0MDAtXFx1NERCNVxcdTRFMDAtXFx1OUZDQ1xcdUEwMDAtXFx1QTQ4Q1xcdUE0RDAtXFx1QTRGRFxcdUE1MDAtXFx1QTYwQ1xcdUE2MTAtXFx1QTYyQlxcdUE2NDAtXFx1QTY2RlxcdUE2NzQtXFx1QTY3RFxcdUE2N0YtXFx1QTY5RFxcdUE2OUYtXFx1QTZGMVxcdUE3MTctXFx1QTcxRlxcdUE3MjItXFx1QTc4OFxcdUE3OEItXFx1QTc4RVxcdUE3OTAtXFx1QTdBRFxcdUE3QjBcXHVBN0IxXFx1QTdGNy1cXHVBODI3XFx1QTg0MC1cXHVBODczXFx1QTg4MC1cXHVBOEM0XFx1QThEMC1cXHVBOEQ5XFx1QThFMC1cXHVBOEY3XFx1QThGQlxcdUE5MDAtXFx1QTkyRFxcdUE5MzAtXFx1QTk1M1xcdUE5NjAtXFx1QTk3Q1xcdUE5ODAtXFx1QTlDMFxcdUE5Q0YtXFx1QTlEOVxcdUE5RTAtXFx1QTlGRVxcdUFBMDAtXFx1QUEzNlxcdUFBNDAtXFx1QUE0RFxcdUFBNTAtXFx1QUE1OVxcdUFBNjAtXFx1QUE3NlxcdUFBN0EtXFx1QUFDMlxcdUFBREItXFx1QUFERFxcdUFBRTAtXFx1QUFFRlxcdUFBRjItXFx1QUFGNlxcdUFCMDEtXFx1QUIwNlxcdUFCMDktXFx1QUIwRVxcdUFCMTEtXFx1QUIxNlxcdUFCMjAtXFx1QUIyNlxcdUFCMjgtXFx1QUIyRVxcdUFCMzAtXFx1QUI1QVxcdUFCNUMtXFx1QUI1RlxcdUFCNjRcXHVBQjY1XFx1QUJDMC1cXHVBQkVBXFx1QUJFQ1xcdUFCRURcXHVBQkYwLVxcdUFCRjlcXHVBQzAwLVxcdUQ3QTNcXHVEN0IwLVxcdUQ3QzZcXHVEN0NCLVxcdUQ3RkJcXHVGOTAwLVxcdUZBNkRcXHVGQTcwLVxcdUZBRDlcXHVGQjAwLVxcdUZCMDZcXHVGQjEzLVxcdUZCMTdcXHVGQjFELVxcdUZCMjhcXHVGQjJBLVxcdUZCMzZcXHVGQjM4LVxcdUZCM0NcXHVGQjNFXFx1RkI0MFxcdUZCNDFcXHVGQjQzXFx1RkI0NFxcdUZCNDYtXFx1RkJCMVxcdUZCRDMtXFx1RkQzRFxcdUZENTAtXFx1RkQ4RlxcdUZEOTItXFx1RkRDN1xcdUZERjAtXFx1RkRGQlxcdUZFMDAtXFx1RkUwRlxcdUZFMjAtXFx1RkUyRFxcdUZFMzNcXHVGRTM0XFx1RkU0RC1cXHVGRTRGXFx1RkU3MC1cXHVGRTc0XFx1RkU3Ni1cXHVGRUZDXFx1RkYxMC1cXHVGRjE5XFx1RkYyMS1cXHVGRjNBXFx1RkYzRlxcdUZGNDEtXFx1RkY1QVxcdUZGNjYtXFx1RkZCRVxcdUZGQzItXFx1RkZDN1xcdUZGQ0EtXFx1RkZDRlxcdUZGRDItXFx1RkZEN1xcdUZGREEtXFx1RkZEQ10nKVxuICB9O1xuXG4gIC8vIEVuc3VyZSB0aGUgY29uZGl0aW9uIGlzIHRydWUsIG90aGVyd2lzZSB0aHJvdyBhbiBlcnJvci5cbiAgLy8gVGhpcyBpcyBvbmx5IHRvIGhhdmUgYSBiZXR0ZXIgY29udHJhY3Qgc2VtYW50aWMsIGkuZS4gYW5vdGhlciBzYWZldHkgbmV0XG4gIC8vIHRvIGNhdGNoIGEgbG9naWMgZXJyb3IuIFRoZSBjb25kaXRpb24gc2hhbGwgYmUgZnVsZmlsbGVkIGluIG5vcm1hbCBjYXNlLlxuICAvLyBEbyBOT1QgdXNlIHRoaXMgdG8gZW5mb3JjZSBhIGNlcnRhaW4gY29uZGl0aW9uIG9uIGFueSB1c2VyIGlucHV0LlxuXG4gIGZ1bmN0aW9uIGFzc2VydChjb25kaXRpb24sIG1lc3NhZ2UpIHtcbiAgICAgIGlmICghY29uZGl0aW9uKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBU1NFUlQ6ICcgKyBtZXNzYWdlKTtcbiAgICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlzRGVjaW1hbERpZ2l0KGNoKSB7XG4gICAgICByZXR1cm4gKGNoID49IDB4MzAgJiYgY2ggPD0gMHgzOSk7ICAgLy8gMC4uOVxuICB9XG5cbiAgZnVuY3Rpb24gaXNIZXhEaWdpdChjaCkge1xuICAgICAgcmV0dXJuICcwMTIzNDU2Nzg5YWJjZGVmQUJDREVGJy5pbmRleE9mKGNoKSA+PSAwO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNPY3RhbERpZ2l0KGNoKSB7XG4gICAgICByZXR1cm4gJzAxMjM0NTY3Jy5pbmRleE9mKGNoKSA+PSAwO1xuICB9XG5cbiAgLy8gNy4yIFdoaXRlIFNwYWNlXG5cbiAgZnVuY3Rpb24gaXNXaGl0ZVNwYWNlKGNoKSB7XG4gICAgICByZXR1cm4gKGNoID09PSAweDIwKSB8fCAoY2ggPT09IDB4MDkpIHx8IChjaCA9PT0gMHgwQikgfHwgKGNoID09PSAweDBDKSB8fCAoY2ggPT09IDB4QTApIHx8XG4gICAgICAgICAgKGNoID49IDB4MTY4MCAmJiBbMHgxNjgwLCAweDE4MEUsIDB4MjAwMCwgMHgyMDAxLCAweDIwMDIsIDB4MjAwMywgMHgyMDA0LCAweDIwMDUsIDB4MjAwNiwgMHgyMDA3LCAweDIwMDgsIDB4MjAwOSwgMHgyMDBBLCAweDIwMkYsIDB4MjA1RiwgMHgzMDAwLCAweEZFRkZdLmluZGV4T2YoY2gpID49IDApO1xuICB9XG5cbiAgLy8gNy4zIExpbmUgVGVybWluYXRvcnNcblxuICBmdW5jdGlvbiBpc0xpbmVUZXJtaW5hdG9yKGNoKSB7XG4gICAgICByZXR1cm4gKGNoID09PSAweDBBKSB8fCAoY2ggPT09IDB4MEQpIHx8IChjaCA9PT0gMHgyMDI4KSB8fCAoY2ggPT09IDB4MjAyOSk7XG4gIH1cblxuICAvLyA3LjYgSWRlbnRpZmllciBOYW1lcyBhbmQgSWRlbnRpZmllcnNcblxuICBmdW5jdGlvbiBpc0lkZW50aWZpZXJTdGFydChjaCkge1xuICAgICAgcmV0dXJuIChjaCA9PT0gMHgyNCkgfHwgKGNoID09PSAweDVGKSB8fCAgLy8gJCAoZG9sbGFyKSBhbmQgXyAodW5kZXJzY29yZSlcbiAgICAgICAgICAoY2ggPj0gMHg0MSAmJiBjaCA8PSAweDVBKSB8fCAgICAgICAgIC8vIEEuLlpcbiAgICAgICAgICAoY2ggPj0gMHg2MSAmJiBjaCA8PSAweDdBKSB8fCAgICAgICAgIC8vIGEuLnpcbiAgICAgICAgICAoY2ggPT09IDB4NUMpIHx8ICAgICAgICAgICAgICAgICAgICAgIC8vIFxcIChiYWNrc2xhc2gpXG4gICAgICAgICAgKChjaCA+PSAweDgwKSAmJiBSZWdleC5Ob25Bc2NpaUlkZW50aWZpZXJTdGFydC50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpKSk7XG4gIH1cblxuICBmdW5jdGlvbiBpc0lkZW50aWZpZXJQYXJ0KGNoKSB7XG4gICAgICByZXR1cm4gKGNoID09PSAweDI0KSB8fCAoY2ggPT09IDB4NUYpIHx8ICAvLyAkIChkb2xsYXIpIGFuZCBfICh1bmRlcnNjb3JlKVxuICAgICAgICAgIChjaCA+PSAweDQxICYmIGNoIDw9IDB4NUEpIHx8ICAgICAgICAgLy8gQS4uWlxuICAgICAgICAgIChjaCA+PSAweDYxICYmIGNoIDw9IDB4N0EpIHx8ICAgICAgICAgLy8gYS4uelxuICAgICAgICAgIChjaCA+PSAweDMwICYmIGNoIDw9IDB4MzkpIHx8ICAgICAgICAgLy8gMC4uOVxuICAgICAgICAgIChjaCA9PT0gMHg1QykgfHwgICAgICAgICAgICAgICAgICAgICAgLy8gXFwgKGJhY2tzbGFzaClcbiAgICAgICAgICAoKGNoID49IDB4ODApICYmIFJlZ2V4Lk5vbkFzY2lpSWRlbnRpZmllclBhcnQudGVzdChTdHJpbmcuZnJvbUNoYXJDb2RlKGNoKSkpO1xuICB9XG5cbiAgLy8gNy42LjEuMiBGdXR1cmUgUmVzZXJ2ZWQgV29yZHNcblxuICBmdW5jdGlvbiBpc0Z1dHVyZVJlc2VydmVkV29yZChpZCkge1xuICAgICAgc3dpdGNoIChpZCkge1xuICAgICAgY2FzZSAnY2xhc3MnOlxuICAgICAgY2FzZSAnZW51bSc6XG4gICAgICBjYXNlICdleHBvcnQnOlxuICAgICAgY2FzZSAnZXh0ZW5kcyc6XG4gICAgICBjYXNlICdpbXBvcnQnOlxuICAgICAgY2FzZSAnc3VwZXInOlxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoaWQpIHtcbiAgICAgIHN3aXRjaCAoaWQpIHtcbiAgICAgIGNhc2UgJ2ltcGxlbWVudHMnOlxuICAgICAgY2FzZSAnaW50ZXJmYWNlJzpcbiAgICAgIGNhc2UgJ3BhY2thZ2UnOlxuICAgICAgY2FzZSAncHJpdmF0ZSc6XG4gICAgICBjYXNlICdwcm90ZWN0ZWQnOlxuICAgICAgY2FzZSAncHVibGljJzpcbiAgICAgIGNhc2UgJ3N0YXRpYyc6XG4gICAgICBjYXNlICd5aWVsZCc6XG4gICAgICBjYXNlICdsZXQnOlxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gIH1cblxuICAvLyA3LjYuMS4xIEtleXdvcmRzXG5cbiAgZnVuY3Rpb24gaXNLZXl3b3JkKGlkKSB7XG4gICAgICBpZiAoc3RyaWN0ICYmIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZChpZCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gJ2NvbnN0JyBpcyBzcGVjaWFsaXplZCBhcyBLZXl3b3JkIGluIFY4LlxuICAgICAgLy8gJ3lpZWxkJyBhbmQgJ2xldCcgYXJlIGZvciBjb21wYXRpYmxpdHkgd2l0aCBTcGlkZXJNb25rZXkgYW5kIEVTLm5leHQuXG4gICAgICAvLyBTb21lIG90aGVycyBhcmUgZnJvbSBmdXR1cmUgcmVzZXJ2ZWQgd29yZHMuXG5cbiAgICAgIHN3aXRjaCAoaWQubGVuZ3RoKSB7XG4gICAgICBjYXNlIDI6XG4gICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ2lmJykgfHwgKGlkID09PSAnaW4nKSB8fCAoaWQgPT09ICdkbycpO1xuICAgICAgY2FzZSAzOlxuICAgICAgICAgIHJldHVybiAoaWQgPT09ICd2YXInKSB8fCAoaWQgPT09ICdmb3InKSB8fCAoaWQgPT09ICduZXcnKSB8fFxuICAgICAgICAgICAgICAoaWQgPT09ICd0cnknKSB8fCAoaWQgPT09ICdsZXQnKTtcbiAgICAgIGNhc2UgNDpcbiAgICAgICAgICByZXR1cm4gKGlkID09PSAndGhpcycpIHx8IChpZCA9PT0gJ2Vsc2UnKSB8fCAoaWQgPT09ICdjYXNlJykgfHxcbiAgICAgICAgICAgICAgKGlkID09PSAndm9pZCcpIHx8IChpZCA9PT0gJ3dpdGgnKSB8fCAoaWQgPT09ICdlbnVtJyk7XG4gICAgICBjYXNlIDU6XG4gICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ3doaWxlJykgfHwgKGlkID09PSAnYnJlYWsnKSB8fCAoaWQgPT09ICdjYXRjaCcpIHx8XG4gICAgICAgICAgICAgIChpZCA9PT0gJ3Rocm93JykgfHwgKGlkID09PSAnY29uc3QnKSB8fCAoaWQgPT09ICd5aWVsZCcpIHx8XG4gICAgICAgICAgICAgIChpZCA9PT0gJ2NsYXNzJykgfHwgKGlkID09PSAnc3VwZXInKTtcbiAgICAgIGNhc2UgNjpcbiAgICAgICAgICByZXR1cm4gKGlkID09PSAncmV0dXJuJykgfHwgKGlkID09PSAndHlwZW9mJykgfHwgKGlkID09PSAnZGVsZXRlJykgfHxcbiAgICAgICAgICAgICAgKGlkID09PSAnc3dpdGNoJykgfHwgKGlkID09PSAnZXhwb3J0JykgfHwgKGlkID09PSAnaW1wb3J0Jyk7XG4gICAgICBjYXNlIDc6XG4gICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ2RlZmF1bHQnKSB8fCAoaWQgPT09ICdmaW5hbGx5JykgfHwgKGlkID09PSAnZXh0ZW5kcycpO1xuICAgICAgY2FzZSA4OlxuICAgICAgICAgIHJldHVybiAoaWQgPT09ICdmdW5jdGlvbicpIHx8IChpZCA9PT0gJ2NvbnRpbnVlJykgfHwgKGlkID09PSAnZGVidWdnZXInKTtcbiAgICAgIGNhc2UgMTA6XG4gICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ2luc3RhbmNlb2YnKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2tpcENvbW1lbnQoKSB7XG4gICAgICB2YXIgY2gsIHN0YXJ0O1xuXG4gICAgICBzdGFydCA9IChpbmRleCA9PT0gMCk7XG4gICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBjaCA9IHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KTtcblxuICAgICAgICAgIGlmIChpc1doaXRlU3BhY2UoY2gpKSB7XG4gICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoKSkge1xuICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICBpZiAoY2ggPT09IDB4MEQgJiYgc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpID09PSAweDBBKSB7XG4gICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICsrbGluZU51bWJlcjtcbiAgICAgICAgICAgICAgbGluZVN0YXJ0ID0gaW5kZXg7XG4gICAgICAgICAgICAgIHN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzY2FuSGV4RXNjYXBlKHByZWZpeCkge1xuICAgICAgdmFyIGksIGxlbiwgY2gsIGNvZGUgPSAwO1xuXG4gICAgICBsZW4gPSAocHJlZml4ID09PSAndScpID8gNCA6IDI7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBsZW5ndGggJiYgaXNIZXhEaWdpdChzb3VyY2VbaW5kZXhdKSkge1xuICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgY29kZSA9IGNvZGUgKiAxNiArICcwMTIzNDU2Nzg5YWJjZGVmJy5pbmRleE9mKGNoLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNjYW5Vbmljb2RlQ29kZVBvaW50RXNjYXBlKCkge1xuICAgICAgdmFyIGNoLCBjb2RlLCBjdTEsIGN1MjtcblxuICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgY29kZSA9IDA7XG5cbiAgICAgIC8vIEF0IGxlYXN0LCBvbmUgaGV4IGRpZ2l0IGlzIHJlcXVpcmVkLlxuICAgICAgaWYgKGNoID09PSAnfScpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICB9XG5cbiAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGNoID0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgIGlmICghaXNIZXhEaWdpdChjaCkpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvZGUgPSBjb2RlICogMTYgKyAnMDEyMzQ1Njc4OWFiY2RlZicuaW5kZXhPZihjaC50b0xvd2VyQ2FzZSgpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvZGUgPiAweDEwRkZGRiB8fCBjaCAhPT0gJ30nKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgfVxuXG4gICAgICAvLyBVVEYtMTYgRW5jb2RpbmdcbiAgICAgIGlmIChjb2RlIDw9IDB4RkZGRikge1xuICAgICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpO1xuICAgICAgfVxuICAgICAgY3UxID0gKChjb2RlIC0gMHgxMDAwMCkgPj4gMTApICsgMHhEODAwO1xuICAgICAgY3UyID0gKChjb2RlIC0gMHgxMDAwMCkgJiAxMDIzKSArIDB4REMwMDtcbiAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGN1MSwgY3UyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEVzY2FwZWRJZGVudGlmaWVyKCkge1xuICAgICAgdmFyIGNoLCBpZDtcblxuICAgICAgY2ggPSBzb3VyY2UuY2hhckNvZGVBdChpbmRleCsrKTtcbiAgICAgIGlkID0gU3RyaW5nLmZyb21DaGFyQ29kZShjaCk7XG5cbiAgICAgIC8vICdcXHUnIChVKzAwNUMsIFUrMDA3NSkgZGVub3RlcyBhbiBlc2NhcGVkIGNoYXJhY3Rlci5cbiAgICAgIGlmIChjaCA9PT0gMHg1Qykge1xuICAgICAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkgIT09IDB4NzUpIHtcbiAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgIGNoID0gc2NhbkhleEVzY2FwZSgndScpO1xuICAgICAgICAgIGlmICghY2ggfHwgY2ggPT09ICdcXFxcJyB8fCAhaXNJZGVudGlmaWVyU3RhcnQoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZCA9IGNoO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBjaCA9IHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICAgICAgICBpZiAoIWlzSWRlbnRpZmllclBhcnQoY2gpKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgIGlkICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpO1xuXG4gICAgICAgICAgLy8gJ1xcdScgKFUrMDA1QywgVSswMDc1KSBkZW5vdGVzIGFuIGVzY2FwZWQgY2hhcmFjdGVyLlxuICAgICAgICAgIGlmIChjaCA9PT0gMHg1Qykge1xuICAgICAgICAgICAgICBpZCA9IGlkLnN1YnN0cigwLCBpZC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgICAgaWYgKHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSAhPT0gMHg3NSkge1xuICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgIGNoID0gc2NhbkhleEVzY2FwZSgndScpO1xuICAgICAgICAgICAgICBpZiAoIWNoIHx8IGNoID09PSAnXFxcXCcgfHwgIWlzSWRlbnRpZmllclBhcnQoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZCArPSBjaDtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBpZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldElkZW50aWZpZXIoKSB7XG4gICAgICB2YXIgc3RhcnQsIGNoO1xuXG4gICAgICBzdGFydCA9IGluZGV4Kys7XG4gICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBjaCA9IHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICAgICAgICBpZiAoY2ggPT09IDB4NUMpIHtcbiAgICAgICAgICAgICAgLy8gQmxhY2tzbGFzaCAoVSswMDVDKSBtYXJrcyBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZS5cbiAgICAgICAgICAgICAgaW5kZXggPSBzdGFydDtcbiAgICAgICAgICAgICAgcmV0dXJuIGdldEVzY2FwZWRJZGVudGlmaWVyKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpc0lkZW50aWZpZXJQYXJ0KGNoKSkge1xuICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNvdXJjZS5zbGljZShzdGFydCwgaW5kZXgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2NhbklkZW50aWZpZXIoKSB7XG4gICAgICB2YXIgc3RhcnQsIGlkLCB0eXBlO1xuXG4gICAgICBzdGFydCA9IGluZGV4O1xuXG4gICAgICAvLyBCYWNrc2xhc2ggKFUrMDA1Qykgc3RhcnRzIGFuIGVzY2FwZWQgY2hhcmFjdGVyLlxuICAgICAgaWQgPSAoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpID09PSAweDVDKSA/IGdldEVzY2FwZWRJZGVudGlmaWVyKCkgOiBnZXRJZGVudGlmaWVyKCk7XG5cbiAgICAgIC8vIFRoZXJlIGlzIG5vIGtleXdvcmQgb3IgbGl0ZXJhbCB3aXRoIG9ubHkgb25lIGNoYXJhY3Rlci5cbiAgICAgIC8vIFRodXMsIGl0IG11c3QgYmUgYW4gaWRlbnRpZmllci5cbiAgICAgIGlmIChpZC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICB0eXBlID0gVG9rZW4uSWRlbnRpZmllcjtcbiAgICAgIH0gZWxzZSBpZiAoaXNLZXl3b3JkKGlkKSkge1xuICAgICAgICAgIHR5cGUgPSBUb2tlbi5LZXl3b3JkO1xuICAgICAgfSBlbHNlIGlmIChpZCA9PT0gJ251bGwnKSB7XG4gICAgICAgICAgdHlwZSA9IFRva2VuLk51bGxMaXRlcmFsO1xuICAgICAgfSBlbHNlIGlmIChpZCA9PT0gJ3RydWUnIHx8IGlkID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgdHlwZSA9IFRva2VuLkJvb2xlYW5MaXRlcmFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0eXBlID0gVG9rZW4uSWRlbnRpZmllcjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgIHZhbHVlOiBpZCxcbiAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICB9O1xuICB9XG5cbiAgLy8gNy43IFB1bmN0dWF0b3JzXG5cbiAgZnVuY3Rpb24gc2NhblB1bmN0dWF0b3IoKSB7XG4gICAgICB2YXIgc3RhcnQgPSBpbmRleCxcbiAgICAgICAgICBjb2RlID0gc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpLFxuICAgICAgICAgIGNvZGUyLFxuICAgICAgICAgIGNoMSA9IHNvdXJjZVtpbmRleF0sXG4gICAgICAgICAgY2gyLFxuICAgICAgICAgIGNoMyxcbiAgICAgICAgICBjaDQ7XG5cbiAgICAgIHN3aXRjaCAoY29kZSkge1xuXG4gICAgICAvLyBDaGVjayBmb3IgbW9zdCBjb21tb24gc2luZ2xlLWNoYXJhY3RlciBwdW5jdHVhdG9ycy5cbiAgICAgIGNhc2UgMHgyRTogIC8vIC4gZG90XG4gICAgICBjYXNlIDB4Mjg6ICAvLyAoIG9wZW4gYnJhY2tldFxuICAgICAgY2FzZSAweDI5OiAgLy8gKSBjbG9zZSBicmFja2V0XG4gICAgICBjYXNlIDB4M0I6ICAvLyA7IHNlbWljb2xvblxuICAgICAgY2FzZSAweDJDOiAgLy8gLCBjb21tYVxuICAgICAgY2FzZSAweDdCOiAgLy8geyBvcGVuIGN1cmx5IGJyYWNlXG4gICAgICBjYXNlIDB4N0Q6ICAvLyB9IGNsb3NlIGN1cmx5IGJyYWNlXG4gICAgICBjYXNlIDB4NUI6ICAvLyBbXG4gICAgICBjYXNlIDB4NUQ6ICAvLyBdXG4gICAgICBjYXNlIDB4M0E6ICAvLyA6XG4gICAgICBjYXNlIDB4M0Y6ICAvLyA/XG4gICAgICBjYXNlIDB4N0U6ICAvLyB+XG4gICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICBpZiAoZXh0cmEudG9rZW5pemUpIHtcbiAgICAgICAgICAgICAgaWYgKGNvZGUgPT09IDB4MjgpIHtcbiAgICAgICAgICAgICAgICAgIGV4dHJhLm9wZW5QYXJlblRva2VuID0gZXh0cmEudG9rZW5zLmxlbmd0aDtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb2RlID09PSAweDdCKSB7XG4gICAgICAgICAgICAgICAgICBleHRyYS5vcGVuQ3VybHlUb2tlbiA9IGV4dHJhLnRva2Vucy5sZW5ndGg7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgdmFsdWU6IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSksXG4gICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgICAgICB9O1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICAgIGNvZGUyID0gc291cmNlLmNoYXJDb2RlQXQoaW5kZXggKyAxKTtcblxuICAgICAgICAgIC8vICc9JyAoVSswMDNEKSBtYXJrcyBhbiBhc3NpZ25tZW50IG9yIGNvbXBhcmlzb24gb3BlcmF0b3IuXG4gICAgICAgICAgaWYgKGNvZGUyID09PSAweDNEKSB7XG4gICAgICAgICAgICAgIHN3aXRjaCAoY29kZSkge1xuICAgICAgICAgICAgICBjYXNlIDB4MkI6ICAvLyArXG4gICAgICAgICAgICAgIGNhc2UgMHgyRDogIC8vIC1cbiAgICAgICAgICAgICAgY2FzZSAweDJGOiAgLy8gL1xuICAgICAgICAgICAgICBjYXNlIDB4M0M6ICAvLyA8XG4gICAgICAgICAgICAgIGNhc2UgMHgzRTogIC8vID5cbiAgICAgICAgICAgICAgY2FzZSAweDVFOiAgLy8gXlxuICAgICAgICAgICAgICBjYXNlIDB4N0M6ICAvLyB8XG4gICAgICAgICAgICAgIGNhc2UgMHgyNTogIC8vICVcbiAgICAgICAgICAgICAgY2FzZSAweDI2OiAgLy8gJlxuICAgICAgICAgICAgICBjYXNlIDB4MkE6ICAvLyAqXG4gICAgICAgICAgICAgICAgICBpbmRleCArPSAyO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpICsgU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlMiksXG4gICAgICAgICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICBjYXNlIDB4MjE6IC8vICFcbiAgICAgICAgICAgICAgY2FzZSAweDNEOiAvLyA9XG4gICAgICAgICAgICAgICAgICBpbmRleCArPSAyO1xuXG4gICAgICAgICAgICAgICAgICAvLyAhPT0gYW5kID09PVxuICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSA9PT0gMHgzRCkge1xuICAgICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLlB1bmN0dWF0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHNvdXJjZS5zbGljZShzdGFydCwgaW5kZXgpLFxuICAgICAgICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIDQtY2hhcmFjdGVyIHB1bmN0dWF0b3I6ID4+Pj1cblxuICAgICAgY2g0ID0gc291cmNlLnN1YnN0cihpbmRleCwgNCk7XG5cbiAgICAgIGlmIChjaDQgPT09ICc+Pj49Jykge1xuICAgICAgICAgIGluZGV4ICs9IDQ7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgdmFsdWU6IGNoNCxcbiAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIDMtY2hhcmFjdGVyIHB1bmN0dWF0b3JzOiA9PT0gIT09ID4+PiA8PD0gPj49XG5cbiAgICAgIGNoMyA9IGNoNC5zdWJzdHIoMCwgMyk7XG5cbiAgICAgIGlmIChjaDMgPT09ICc+Pj4nIHx8IGNoMyA9PT0gJzw8PScgfHwgY2gzID09PSAnPj49Jykge1xuICAgICAgICAgIGluZGV4ICs9IDM7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgdmFsdWU6IGNoMyxcbiAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIE90aGVyIDItY2hhcmFjdGVyIHB1bmN0dWF0b3JzOiArKyAtLSA8PCA+PiAmJiB8fFxuICAgICAgY2gyID0gY2gzLnN1YnN0cigwLCAyKTtcblxuICAgICAgaWYgKChjaDEgPT09IGNoMlsxXSAmJiAoJystPD4mfCcuaW5kZXhPZihjaDEpID49IDApKSB8fCBjaDIgPT09ICc9PicpIHtcbiAgICAgICAgICBpbmRleCArPSAyO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHR5cGU6IFRva2VuLlB1bmN0dWF0b3IsXG4gICAgICAgICAgICAgIHZhbHVlOiBjaDIsXG4gICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyAxLWNoYXJhY3RlciBwdW5jdHVhdG9yczogPCA+ID0gISArIC0gKiAlICYgfCBeIC9cblxuICAgICAgaWYgKCc8Pj0hKy0qJSZ8Xi8nLmluZGV4T2YoY2gxKSA+PSAwKSB7XG4gICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICB2YWx1ZTogY2gxLFxuICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICB9XG5cbiAgLy8gNy44LjMgTnVtZXJpYyBMaXRlcmFsc1xuXG4gIGZ1bmN0aW9uIHNjYW5IZXhMaXRlcmFsKHN0YXJ0KSB7XG4gICAgICB2YXIgbnVtYmVyID0gJyc7XG5cbiAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGlmICghaXNIZXhEaWdpdChzb3VyY2VbaW5kZXhdKSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgIH1cblxuICAgICAgaWYgKG51bWJlci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkpKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6IFRva2VuLk51bWVyaWNMaXRlcmFsLFxuICAgICAgICAgIHZhbHVlOiBwYXJzZUludCgnMHgnICsgbnVtYmVyLCAxNiksXG4gICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNjYW5PY3RhbExpdGVyYWwoc3RhcnQpIHtcbiAgICAgIHZhciBudW1iZXIgPSAnMCcgKyBzb3VyY2VbaW5kZXgrK107XG4gICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBpZiAoIWlzT2N0YWxEaWdpdChzb3VyY2VbaW5kZXhdKSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSkgfHwgaXNEZWNpbWFsRGlnaXQoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpKSkge1xuICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiBUb2tlbi5OdW1lcmljTGl0ZXJhbCxcbiAgICAgICAgICB2YWx1ZTogcGFyc2VJbnQobnVtYmVyLCA4KSxcbiAgICAgICAgICBvY3RhbDogdHJ1ZSxcbiAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gc2Nhbk51bWVyaWNMaXRlcmFsKCkge1xuICAgICAgdmFyIG51bWJlciwgc3RhcnQsIGNoO1xuXG4gICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICBhc3NlcnQoaXNEZWNpbWFsRGlnaXQoY2guY2hhckNvZGVBdCgwKSkgfHwgKGNoID09PSAnLicpLFxuICAgICAgICAgICdOdW1lcmljIGxpdGVyYWwgbXVzdCBzdGFydCB3aXRoIGEgZGVjaW1hbCBkaWdpdCBvciBhIGRlY2ltYWwgcG9pbnQnKTtcblxuICAgICAgc3RhcnQgPSBpbmRleDtcbiAgICAgIG51bWJlciA9ICcnO1xuICAgICAgaWYgKGNoICE9PSAnLicpIHtcbiAgICAgICAgICBudW1iZXIgPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuXG4gICAgICAgICAgLy8gSGV4IG51bWJlciBzdGFydHMgd2l0aCAnMHgnLlxuICAgICAgICAgIC8vIE9jdGFsIG51bWJlciBzdGFydHMgd2l0aCAnMCcuXG4gICAgICAgICAgaWYgKG51bWJlciA9PT0gJzAnKSB7XG4gICAgICAgICAgICAgIGlmIChjaCA9PT0gJ3gnIHx8IGNoID09PSAnWCcpIHtcbiAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gc2NhbkhleExpdGVyYWwoc3RhcnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpc09jdGFsRGlnaXQoY2gpKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gc2Nhbk9jdGFsTGl0ZXJhbChzdGFydCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBkZWNpbWFsIG51bWJlciBzdGFydHMgd2l0aCAnMCcgc3VjaCBhcyAnMDknIGlzIGlsbGVnYWwuXG4gICAgICAgICAgICAgIGlmIChjaCAmJiBpc0RlY2ltYWxEaWdpdChjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgd2hpbGUgKGlzRGVjaW1hbERpZ2l0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSkpIHtcbiAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2ggPT09ICcuJykge1xuICAgICAgICAgIG51bWJlciArPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgd2hpbGUgKGlzRGVjaW1hbERpZ2l0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSkpIHtcbiAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2ggPT09ICdlJyB8fCBjaCA9PT0gJ0UnKSB7XG4gICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcblxuICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgICBpZiAoY2ggPT09ICcrJyB8fCBjaCA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgIG51bWJlciArPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpc0RlY2ltYWxEaWdpdChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkpKSB7XG4gICAgICAgICAgICAgIHdoaWxlIChpc0RlY2ltYWxEaWdpdChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkpKSB7XG4gICAgICAgICAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSkpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogVG9rZW4uTnVtZXJpY0xpdGVyYWwsXG4gICAgICAgICAgdmFsdWU6IHBhcnNlRmxvYXQobnVtYmVyKSxcbiAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICB9O1xuICB9XG5cbiAgLy8gNy44LjQgU3RyaW5nIExpdGVyYWxzXG5cbiAgZnVuY3Rpb24gc2NhblN0cmluZ0xpdGVyYWwoKSB7XG4gICAgICB2YXIgc3RyID0gJycsIHF1b3RlLCBzdGFydCwgY2gsIGNvZGUsIHVuZXNjYXBlZCwgcmVzdG9yZSwgb2N0YWwgPSBmYWxzZSwgc3RhcnRMaW5lTnVtYmVyLCBzdGFydExpbmVTdGFydDtcbiAgICAgIHN0YXJ0TGluZU51bWJlciA9IGxpbmVOdW1iZXI7XG4gICAgICBzdGFydExpbmVTdGFydCA9IGxpbmVTdGFydDtcblxuICAgICAgcXVvdGUgPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgYXNzZXJ0KChxdW90ZSA9PT0gJ1xcJycgfHwgcXVvdGUgPT09ICdcIicpLFxuICAgICAgICAgICdTdHJpbmcgbGl0ZXJhbCBtdXN0IHN0YXJ0cyB3aXRoIGEgcXVvdGUnKTtcblxuICAgICAgc3RhcnQgPSBpbmRleDtcbiAgICAgICsraW5kZXg7XG5cbiAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGNoID0gc291cmNlW2luZGV4KytdO1xuXG4gICAgICAgICAgaWYgKGNoID09PSBxdW90ZSkge1xuICAgICAgICAgICAgICBxdW90ZSA9ICcnO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnXFxcXCcpIHtcbiAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICAgIGlmICghY2ggfHwgIWlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY2gpIHtcbiAgICAgICAgICAgICAgICAgIGNhc2UgJ3UnOlxuICAgICAgICAgICAgICAgICAgY2FzZSAneCc6XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZVtpbmRleF0gPT09ICd7Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gc2NhblVuaWNvZGVDb2RlUG9pbnRFc2NhcGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXN0b3JlID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHVuZXNjYXBlZCA9IHNjYW5IZXhFc2NhcGUoY2gpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodW5lc2NhcGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gdW5lc2NhcGVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSByZXN0b3JlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgY2FzZSAnbic6XG4gICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgY2FzZSAncic6XG4gICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXHInO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgY2FzZSAndCc6XG4gICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXHQnO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgY2FzZSAnYic6XG4gICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXGInO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgY2FzZSAnZic6XG4gICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXGYnO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgY2FzZSAndic6XG4gICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXHgwQic7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGlzT2N0YWxEaWdpdChjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9ICcwMTIzNDU2NycuaW5kZXhPZihjaCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gXFwwIGlzIG5vdCBvY3RhbCBlc2NhcGUgc2VxdWVuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvZGUgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9jdGFsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA8IGxlbmd0aCAmJiBpc09jdGFsRGlnaXQoc291cmNlW2luZGV4XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9jdGFsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUgPSBjb2RlICogOCArICcwMTIzNDU2NycuaW5kZXhPZihzb3VyY2VbaW5kZXgrK10pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAzIGRpZ2l0cyBhcmUgb25seSBhbGxvd2VkIHdoZW4gc3RyaW5nIHN0YXJ0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2l0aCAwLCAxLCAyLCAzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJzAxMjMnLmluZGV4T2YoY2gpID49IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPCBsZW5ndGggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNPY3RhbERpZ2l0KHNvdXJjZVtpbmRleF0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUgKiA4ICsgJzAxMjM0NTY3Jy5pbmRleE9mKHNvdXJjZVtpbmRleCsrXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICsrbGluZU51bWJlcjtcbiAgICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gICdcXHInICYmIHNvdXJjZVtpbmRleF0gPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGxpbmVTdGFydCA9IGluZGV4O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChxdW90ZSAhPT0gJycpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogVG9rZW4uU3RyaW5nTGl0ZXJhbCxcbiAgICAgICAgICB2YWx1ZTogc3RyLFxuICAgICAgICAgIG9jdGFsOiBvY3RhbCxcbiAgICAgICAgICBzdGFydExpbmVOdW1iZXI6IHN0YXJ0TGluZU51bWJlcixcbiAgICAgICAgICBzdGFydExpbmVTdGFydDogc3RhcnRMaW5lU3RhcnQsXG4gICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRlc3RSZWdFeHAocGF0dGVybiwgZmxhZ3MpIHtcbiAgICAgIHZhciB0bXAgPSBwYXR0ZXJuLFxuICAgICAgICAgIHZhbHVlO1xuXG4gICAgICBpZiAoZmxhZ3MuaW5kZXhPZigndScpID49IDApIHtcbiAgICAgICAgICAvLyBSZXBsYWNlIGVhY2ggYXN0cmFsIHN5bWJvbCBhbmQgZXZlcnkgVW5pY29kZSBjb2RlIHBvaW50XG4gICAgICAgICAgLy8gZXNjYXBlIHNlcXVlbmNlIHdpdGggYSBzaW5nbGUgQVNDSUkgc3ltYm9sIHRvIGF2b2lkIHRocm93aW5nIG9uXG4gICAgICAgICAgLy8gcmVndWxhciBleHByZXNzaW9ucyB0aGF0IGFyZSBvbmx5IHZhbGlkIGluIGNvbWJpbmF0aW9uIHdpdGggdGhlXG4gICAgICAgICAgLy8gYC91YCBmbGFnLlxuICAgICAgICAgIC8vIE5vdGU6IHJlcGxhY2luZyB3aXRoIHRoZSBBU0NJSSBzeW1ib2wgYHhgIG1pZ2h0IGNhdXNlIGZhbHNlXG4gICAgICAgICAgLy8gbmVnYXRpdmVzIGluIHVubGlrZWx5IHNjZW5hcmlvcy4gRm9yIGV4YW1wbGUsIGBbXFx1ezYxfS1iXWAgaXMgYVxuICAgICAgICAgIC8vIHBlcmZlY3RseSB2YWxpZCBwYXR0ZXJuIHRoYXQgaXMgZXF1aXZhbGVudCB0byBgW2EtYl1gLCBidXQgaXRcbiAgICAgICAgICAvLyB3b3VsZCBiZSByZXBsYWNlZCBieSBgW3gtYl1gIHdoaWNoIHRocm93cyBhbiBlcnJvci5cbiAgICAgICAgICB0bXAgPSB0bXBcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFx1XFx7KFswLTlhLWZBLUZdKylcXH0vZywgZnVuY3Rpb24gKCQwLCAkMSkge1xuICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlSW50KCQxLCAxNikgPD0gMHgxMEZGRkYpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3gnO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuSW52YWxpZFJlZ0V4cCk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9bXFx1RDgwMC1cXHVEQkZGXVtcXHVEQzAwLVxcdURGRkZdL2csICd4Jyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEZpcnN0LCBkZXRlY3QgaW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb25zLlxuICAgICAgdHJ5IHtcbiAgICAgICAgICB2YWx1ZSA9IG5ldyBSZWdFeHAodG1wKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5JbnZhbGlkUmVnRXhwKTtcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJuIGEgcmVndWxhciBleHByZXNzaW9uIG9iamVjdCBmb3IgdGhpcyBwYXR0ZXJuLWZsYWcgcGFpciwgb3JcbiAgICAgIC8vIGBudWxsYCBpbiBjYXNlIHRoZSBjdXJyZW50IGVudmlyb25tZW50IGRvZXNuJ3Qgc3VwcG9ydCB0aGUgZmxhZ3MgaXRcbiAgICAgIC8vIHVzZXMuXG4gICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHBhdHRlcm4sIGZsYWdzKTtcbiAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2NhblJlZ0V4cEJvZHkoKSB7XG4gICAgICB2YXIgY2gsIHN0ciwgY2xhc3NNYXJrZXIsIHRlcm1pbmF0ZWQsIGJvZHk7XG5cbiAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgIGFzc2VydChjaCA9PT0gJy8nLCAnUmVndWxhciBleHByZXNzaW9uIGxpdGVyYWwgbXVzdCBzdGFydCB3aXRoIGEgc2xhc2gnKTtcbiAgICAgIHN0ciA9IHNvdXJjZVtpbmRleCsrXTtcblxuICAgICAgY2xhc3NNYXJrZXIgPSBmYWxzZTtcbiAgICAgIHRlcm1pbmF0ZWQgPSBmYWxzZTtcbiAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGNoID0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICBpZiAoY2ggPT09ICdcXFxcJykge1xuICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgLy8gRUNNQS0yNjIgNy44LjVcbiAgICAgICAgICAgICAgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVudGVybWluYXRlZFJlZ0V4cCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbnRlcm1pbmF0ZWRSZWdFeHApO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NNYXJrZXIpIHtcbiAgICAgICAgICAgICAgaWYgKGNoID09PSAnXScpIHtcbiAgICAgICAgICAgICAgICAgIGNsYXNzTWFya2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoY2ggPT09ICcvJykge1xuICAgICAgICAgICAgICAgICAgdGVybWluYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ1snKSB7XG4gICAgICAgICAgICAgICAgICBjbGFzc01hcmtlciA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghdGVybWluYXRlZCkge1xuICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVudGVybWluYXRlZFJlZ0V4cCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEV4Y2x1ZGUgbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2guXG4gICAgICBib2R5ID0gc3RyLnN1YnN0cigxLCBzdHIubGVuZ3RoIC0gMik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAgIHZhbHVlOiBib2R5LFxuICAgICAgICAgIGxpdGVyYWw6IHN0clxuICAgICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNjYW5SZWdFeHBGbGFncygpIHtcbiAgICAgIHZhciBjaCwgc3RyLCBmbGFncywgcmVzdG9yZTtcblxuICAgICAgc3RyID0gJyc7XG4gICAgICBmbGFncyA9ICcnO1xuICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICAgIGlmICghaXNJZGVudGlmaWVyUGFydChjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgIGlmIChjaCA9PT0gJ1xcXFwnICYmIGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgICAgICAgaWYgKGNoID09PSAndScpIHtcbiAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICByZXN0b3JlID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICBjaCA9IHNjYW5IZXhFc2NhcGUoJ3UnKTtcbiAgICAgICAgICAgICAgICAgIGlmIChjaCkge1xuICAgICAgICAgICAgICAgICAgICAgIGZsYWdzICs9IGNoO1xuICAgICAgICAgICAgICAgICAgICAgIGZvciAoc3RyICs9ICdcXFxcdSc7IHJlc3RvcmUgPCBpbmRleDsgKytyZXN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSBzb3VyY2VbcmVzdG9yZV07XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IHJlc3RvcmU7XG4gICAgICAgICAgICAgICAgICAgICAgZmxhZ3MgKz0gJ3UnO1xuICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSAnXFxcXHUnO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcXFwnO1xuICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmbGFncyArPSBjaDtcbiAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB2YWx1ZTogZmxhZ3MsXG4gICAgICAgICAgbGl0ZXJhbDogc3RyXG4gICAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gc2NhblJlZ0V4cCgpIHtcbiAgICAgIHZhciBzdGFydCwgYm9keSwgZmxhZ3MsIHZhbHVlO1xuXG4gICAgICBsb29rYWhlYWQgPSBudWxsO1xuICAgICAgc2tpcENvbW1lbnQoKTtcbiAgICAgIHN0YXJ0ID0gaW5kZXg7XG5cbiAgICAgIGJvZHkgPSBzY2FuUmVnRXhwQm9keSgpO1xuICAgICAgZmxhZ3MgPSBzY2FuUmVnRXhwRmxhZ3MoKTtcbiAgICAgIHZhbHVlID0gdGVzdFJlZ0V4cChib2R5LnZhbHVlLCBmbGFncy52YWx1ZSk7XG5cbiAgICAgIGlmIChleHRyYS50b2tlbml6ZSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHR5cGU6IFRva2VuLlJlZ3VsYXJFeHByZXNzaW9uLFxuICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAgIHJlZ2V4OiB7XG4gICAgICAgICAgICAgICAgICBwYXR0ZXJuOiBib2R5LnZhbHVlLFxuICAgICAgICAgICAgICAgICAgZmxhZ3M6IGZsYWdzLnZhbHVlXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICAgIGxpdGVyYWw6IGJvZHkubGl0ZXJhbCArIGZsYWdzLmxpdGVyYWwsXG4gICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgIHJlZ2V4OiB7XG4gICAgICAgICAgICAgIHBhdHRlcm46IGJvZHkudmFsdWUsXG4gICAgICAgICAgICAgIGZsYWdzOiBmbGFncy52YWx1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBjb2xsZWN0UmVnZXgoKSB7XG4gICAgICB2YXIgcG9zLCBsb2MsIHJlZ2V4LCB0b2tlbjtcblxuICAgICAgc2tpcENvbW1lbnQoKTtcblxuICAgICAgcG9zID0gaW5kZXg7XG4gICAgICBsb2MgPSB7XG4gICAgICAgICAgc3RhcnQ6IHtcbiAgICAgICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydFxuICAgICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHJlZ2V4ID0gc2NhblJlZ0V4cCgpO1xuXG4gICAgICBsb2MuZW5kID0ge1xuICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydFxuICAgICAgfTtcblxuICAgICAgaWYgKCFleHRyYS50b2tlbml6ZSkge1xuICAgICAgICAgIC8vIFBvcCB0aGUgcHJldmlvdXMgdG9rZW4sIHdoaWNoIGlzIGxpa2VseSAnLycgb3IgJy89J1xuICAgICAgICAgIGlmIChleHRyYS50b2tlbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICB0b2tlbiA9IGV4dHJhLnRva2Vuc1tleHRyYS50b2tlbnMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgIGlmICh0b2tlbi5yYW5nZVswXSA9PT0gcG9zICYmIHRva2VuLnR5cGUgPT09ICdQdW5jdHVhdG9yJykge1xuICAgICAgICAgICAgICAgICAgaWYgKHRva2VuLnZhbHVlID09PSAnLycgfHwgdG9rZW4udmFsdWUgPT09ICcvPScpIHtcbiAgICAgICAgICAgICAgICAgICAgICBleHRyYS50b2tlbnMucG9wKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBleHRyYS50b2tlbnMucHVzaCh7XG4gICAgICAgICAgICAgIHR5cGU6ICdSZWd1bGFyRXhwcmVzc2lvbicsXG4gICAgICAgICAgICAgIHZhbHVlOiByZWdleC5saXRlcmFsLFxuICAgICAgICAgICAgICByZWdleDogcmVnZXgucmVnZXgsXG4gICAgICAgICAgICAgIHJhbmdlOiBbcG9zLCBpbmRleF0sXG4gICAgICAgICAgICAgIGxvYzogbG9jXG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZWdleDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzSWRlbnRpZmllck5hbWUodG9rZW4pIHtcbiAgICAgIHJldHVybiB0b2tlbi50eXBlID09PSBUb2tlbi5JZGVudGlmaWVyIHx8XG4gICAgICAgICAgdG9rZW4udHlwZSA9PT0gVG9rZW4uS2V5d29yZCB8fFxuICAgICAgICAgIHRva2VuLnR5cGUgPT09IFRva2VuLkJvb2xlYW5MaXRlcmFsIHx8XG4gICAgICAgICAgdG9rZW4udHlwZSA9PT0gVG9rZW4uTnVsbExpdGVyYWw7XG4gIH1cblxuICBmdW5jdGlvbiBhZHZhbmNlU2xhc2goKSB7XG4gICAgICB2YXIgcHJldlRva2VuLFxuICAgICAgICAgIGNoZWNrVG9rZW47XG4gICAgICAvLyBVc2luZyB0aGUgZm9sbG93aW5nIGFsZ29yaXRobTpcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhL3N3ZWV0LmpzL3dpa2kvZGVzaWduXG4gICAgICBwcmV2VG9rZW4gPSBleHRyYS50b2tlbnNbZXh0cmEudG9rZW5zLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKCFwcmV2VG9rZW4pIHtcbiAgICAgICAgICAvLyBOb3RoaW5nIGJlZm9yZSB0aGF0OiBpdCBjYW5ub3QgYmUgYSBkaXZpc2lvbi5cbiAgICAgICAgICByZXR1cm4gY29sbGVjdFJlZ2V4KCk7XG4gICAgICB9XG4gICAgICBpZiAocHJldlRva2VuLnR5cGUgPT09ICdQdW5jdHVhdG9yJykge1xuICAgICAgICAgIGlmIChwcmV2VG9rZW4udmFsdWUgPT09ICddJykge1xuICAgICAgICAgICAgICByZXR1cm4gc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHByZXZUb2tlbi52YWx1ZSA9PT0gJyknKSB7XG4gICAgICAgICAgICAgIGNoZWNrVG9rZW4gPSBleHRyYS50b2tlbnNbZXh0cmEub3BlblBhcmVuVG9rZW4gLSAxXTtcbiAgICAgICAgICAgICAgaWYgKGNoZWNrVG9rZW4gJiZcbiAgICAgICAgICAgICAgICAgICAgICBjaGVja1Rva2VuLnR5cGUgPT09ICdLZXl3b3JkJyAmJlxuICAgICAgICAgICAgICAgICAgICAgIChjaGVja1Rva2VuLnZhbHVlID09PSAnaWYnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIGNoZWNrVG9rZW4udmFsdWUgPT09ICd3aGlsZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tUb2tlbi52YWx1ZSA9PT0gJ2ZvcicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tUb2tlbi52YWx1ZSA9PT0gJ3dpdGgnKSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3RSZWdleCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBzY2FuUHVuY3R1YXRvcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocHJldlRva2VuLnZhbHVlID09PSAnfScpIHtcbiAgICAgICAgICAgICAgLy8gRGl2aWRpbmcgYSBmdW5jdGlvbiBieSBhbnl0aGluZyBtYWtlcyBsaXR0bGUgc2Vuc2UsXG4gICAgICAgICAgICAgIC8vIGJ1dCB3ZSBoYXZlIHRvIGNoZWNrIGZvciB0aGF0LlxuICAgICAgICAgICAgICBpZiAoZXh0cmEudG9rZW5zW2V4dHJhLm9wZW5DdXJseVRva2VuIC0gM10gJiZcbiAgICAgICAgICAgICAgICAgICAgICBleHRyYS50b2tlbnNbZXh0cmEub3BlbkN1cmx5VG9rZW4gLSAzXS50eXBlID09PSAnS2V5d29yZCcpIHtcbiAgICAgICAgICAgICAgICAgIC8vIEFub255bW91cyBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgIGNoZWNrVG9rZW4gPSBleHRyYS50b2tlbnNbZXh0cmEub3BlbkN1cmx5VG9rZW4gLSA0XTtcbiAgICAgICAgICAgICAgICAgIGlmICghY2hlY2tUb2tlbikge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzY2FuUHVuY3R1YXRvcigpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV4dHJhLnRva2Vuc1tleHRyYS5vcGVuQ3VybHlUb2tlbiAtIDRdICYmXG4gICAgICAgICAgICAgICAgICAgICAgZXh0cmEudG9rZW5zW2V4dHJhLm9wZW5DdXJseVRva2VuIC0gNF0udHlwZSA9PT0gJ0tleXdvcmQnKSB7XG4gICAgICAgICAgICAgICAgICAvLyBOYW1lZCBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgIGNoZWNrVG9rZW4gPSBleHRyYS50b2tlbnNbZXh0cmEub3BlbkN1cmx5VG9rZW4gLSA1XTtcbiAgICAgICAgICAgICAgICAgIGlmICghY2hlY2tUb2tlbikge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xsZWN0UmVnZXgoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBzY2FuUHVuY3R1YXRvcigpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBzY2FuUHVuY3R1YXRvcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY29sbGVjdFJlZ2V4KCk7XG4gICAgICB9XG4gICAgICBpZiAocHJldlRva2VuLnR5cGUgPT09ICdLZXl3b3JkJyAmJiBwcmV2VG9rZW4udmFsdWUgIT09ICd0aGlzJykge1xuICAgICAgICAgIHJldHVybiBjb2xsZWN0UmVnZXgoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzY2FuUHVuY3R1YXRvcigpO1xuICB9XG5cbiAgZnVuY3Rpb24gYWR2YW5jZSgpIHtcbiAgICAgIHZhciBjaDtcblxuICAgICAgc2tpcENvbW1lbnQoKTtcblxuICAgICAgaWYgKGluZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHR5cGU6IFRva2VuLkVPRixcbiAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgIHN0YXJ0OiBpbmRleCxcbiAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGNoID0gc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpO1xuXG4gICAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoY2gpKSB7XG4gICAgICAgICAgcmV0dXJuIHNjYW5JZGVudGlmaWVyKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFZlcnkgY29tbW9uOiAoIGFuZCApIGFuZCA7XG4gICAgICBpZiAoY2ggPT09IDB4MjggfHwgY2ggPT09IDB4MjkgfHwgY2ggPT09IDB4M0IpIHtcbiAgICAgICAgICByZXR1cm4gc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RyaW5nIGxpdGVyYWwgc3RhcnRzIHdpdGggc2luZ2xlIHF1b3RlIChVKzAwMjcpIG9yIGRvdWJsZSBxdW90ZSAoVSswMDIyKS5cbiAgICAgIGlmIChjaCA9PT0gMHgyNyB8fCBjaCA9PT0gMHgyMikge1xuICAgICAgICAgIHJldHVybiBzY2FuU3RyaW5nTGl0ZXJhbCgpO1xuICAgICAgfVxuXG5cbiAgICAgIC8vIERvdCAoLikgVSswMDJFIGNhbiBhbHNvIHN0YXJ0IGEgZmxvYXRpbmctcG9pbnQgbnVtYmVyLCBoZW5jZSB0aGUgbmVlZFxuICAgICAgLy8gdG8gY2hlY2sgdGhlIG5leHQgY2hhcmFjdGVyLlxuICAgICAgaWYgKGNoID09PSAweDJFKSB7XG4gICAgICAgICAgaWYgKGlzRGVjaW1hbERpZ2l0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4ICsgMSkpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzY2FuTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHNjYW5QdW5jdHVhdG9yKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc0RlY2ltYWxEaWdpdChjaCkpIHtcbiAgICAgICAgICByZXR1cm4gc2Nhbk51bWVyaWNMaXRlcmFsKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNsYXNoICgvKSBVKzAwMkYgY2FuIGFsc28gc3RhcnQgYSByZWdleC5cbiAgICAgIGlmIChleHRyYS50b2tlbml6ZSAmJiBjaCA9PT0gMHgyRikge1xuICAgICAgICAgIHJldHVybiBhZHZhbmNlU2xhc2goKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNjYW5QdW5jdHVhdG9yKCk7XG4gIH1cblxuICBmdW5jdGlvbiBjb2xsZWN0VG9rZW4oKSB7XG4gICAgICB2YXIgbG9jLCB0b2tlbiwgdmFsdWUsIGVudHJ5O1xuXG4gICAgICBza2lwQ29tbWVudCgpO1xuICAgICAgbG9jID0ge1xuICAgICAgICAgIHN0YXJ0OiB7XG4gICAgICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnRcbiAgICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB0b2tlbiA9IGFkdmFuY2UoKTtcbiAgICAgIGxvYy5lbmQgPSB7XG4gICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICBjb2x1bW46IGluZGV4IC0gbGluZVN0YXJ0XG4gICAgICB9O1xuXG4gICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uRU9GKSB7XG4gICAgICAgICAgdmFsdWUgPSBzb3VyY2Uuc2xpY2UodG9rZW4uc3RhcnQsIHRva2VuLmVuZCk7XG4gICAgICAgICAgZW50cnkgPSB7XG4gICAgICAgICAgICAgIHR5cGU6IFRva2VuTmFtZVt0b2tlbi50eXBlXSxcbiAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgICByYW5nZTogW3Rva2VuLnN0YXJ0LCB0b2tlbi5lbmRdLFxuICAgICAgICAgICAgICBsb2M6IGxvY1xuICAgICAgICAgIH07XG4gICAgICAgICAgaWYgKHRva2VuLnJlZ2V4KSB7XG4gICAgICAgICAgICAgIGVudHJ5LnJlZ2V4ID0ge1xuICAgICAgICAgICAgICAgICAgcGF0dGVybjogdG9rZW4ucmVnZXgucGF0dGVybixcbiAgICAgICAgICAgICAgICAgIGZsYWdzOiB0b2tlbi5yZWdleC5mbGFnc1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBleHRyYS50b2tlbnMucHVzaChlbnRyeSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0b2tlbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxleCgpIHtcbiAgICAgIHZhciB0b2tlbjtcblxuICAgICAgdG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICBpbmRleCA9IHRva2VuLmVuZDtcbiAgICAgIGxpbmVOdW1iZXIgPSB0b2tlbi5saW5lTnVtYmVyO1xuICAgICAgbGluZVN0YXJ0ID0gdG9rZW4ubGluZVN0YXJ0O1xuXG4gICAgICBsb29rYWhlYWQgPSAodHlwZW9mIGV4dHJhLnRva2VucyAhPT0gJ3VuZGVmaW5lZCcpID8gY29sbGVjdFRva2VuKCkgOiBhZHZhbmNlKCk7XG5cbiAgICAgIGluZGV4ID0gdG9rZW4uZW5kO1xuICAgICAgbGluZU51bWJlciA9IHRva2VuLmxpbmVOdW1iZXI7XG4gICAgICBsaW5lU3RhcnQgPSB0b2tlbi5saW5lU3RhcnQ7XG5cbiAgICAgIHJldHVybiB0b2tlbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZWsoKSB7XG4gICAgICB2YXIgcG9zLCBsaW5lLCBzdGFydDtcblxuICAgICAgcG9zID0gaW5kZXg7XG4gICAgICBsaW5lID0gbGluZU51bWJlcjtcbiAgICAgIHN0YXJ0ID0gbGluZVN0YXJ0O1xuICAgICAgbG9va2FoZWFkID0gKHR5cGVvZiBleHRyYS50b2tlbnMgIT09ICd1bmRlZmluZWQnKSA/IGNvbGxlY3RUb2tlbigpIDogYWR2YW5jZSgpO1xuICAgICAgaW5kZXggPSBwb3M7XG4gICAgICBsaW5lTnVtYmVyID0gbGluZTtcbiAgICAgIGxpbmVTdGFydCA9IHN0YXJ0O1xuICB9XG5cbiAgZnVuY3Rpb24gUG9zaXRpb24oKSB7XG4gICAgICB0aGlzLmxpbmUgPSBsaW5lTnVtYmVyO1xuICAgICAgdGhpcy5jb2x1bW4gPSBpbmRleCAtIGxpbmVTdGFydDtcbiAgfVxuXG4gIGZ1bmN0aW9uIFNvdXJjZUxvY2F0aW9uKCkge1xuICAgICAgdGhpcy5zdGFydCA9IG5ldyBQb3NpdGlvbigpO1xuICAgICAgdGhpcy5lbmQgPSBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gV3JhcHBpbmdTb3VyY2VMb2NhdGlvbihzdGFydFRva2VuKSB7XG4gICAgICBpZiAoc3RhcnRUb2tlbi50eXBlID09PSBUb2tlbi5TdHJpbmdMaXRlcmFsKSB7XG4gICAgICAgICAgdGhpcy5zdGFydCA9IHtcbiAgICAgICAgICAgICAgbGluZTogc3RhcnRUb2tlbi5zdGFydExpbmVOdW1iZXIsXG4gICAgICAgICAgICAgIGNvbHVtbjogc3RhcnRUb2tlbi5zdGFydCAtIHN0YXJ0VG9rZW4uc3RhcnRMaW5lU3RhcnRcbiAgICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnN0YXJ0ID0ge1xuICAgICAgICAgICAgICBsaW5lOiBzdGFydFRva2VuLmxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgIGNvbHVtbjogc3RhcnRUb2tlbi5zdGFydCAtIHN0YXJ0VG9rZW4ubGluZVN0YXJ0XG4gICAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZW5kID0gbnVsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIE5vZGUoKSB7XG4gICAgICAvLyBTa2lwIGNvbW1lbnQuXG4gICAgICBpbmRleCA9IGxvb2thaGVhZC5zdGFydDtcbiAgICAgIGlmIChsb29rYWhlYWQudHlwZSA9PT0gVG9rZW4uU3RyaW5nTGl0ZXJhbCkge1xuICAgICAgICAgIGxpbmVOdW1iZXIgPSBsb29rYWhlYWQuc3RhcnRMaW5lTnVtYmVyO1xuICAgICAgICAgIGxpbmVTdGFydCA9IGxvb2thaGVhZC5zdGFydExpbmVTdGFydDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGluZU51bWJlciA9IGxvb2thaGVhZC5saW5lTnVtYmVyO1xuICAgICAgICAgIGxpbmVTdGFydCA9IGxvb2thaGVhZC5saW5lU3RhcnQ7XG4gICAgICB9XG4gICAgICBpZiAoZXh0cmEucmFuZ2UpIHtcbiAgICAgICAgICB0aGlzLnJhbmdlID0gW2luZGV4LCAwXTtcbiAgICAgIH1cbiAgICAgIGlmIChleHRyYS5sb2MpIHtcbiAgICAgICAgICB0aGlzLmxvYyA9IG5ldyBTb3VyY2VMb2NhdGlvbigpO1xuICAgICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gV3JhcHBpbmdOb2RlKHN0YXJ0VG9rZW4pIHtcbiAgICAgIGlmIChleHRyYS5yYW5nZSkge1xuICAgICAgICAgIHRoaXMucmFuZ2UgPSBbc3RhcnRUb2tlbi5zdGFydCwgMF07XG4gICAgICB9XG4gICAgICBpZiAoZXh0cmEubG9jKSB7XG4gICAgICAgICAgdGhpcy5sb2MgPSBuZXcgV3JhcHBpbmdTb3VyY2VMb2NhdGlvbihzdGFydFRva2VuKTtcbiAgICAgIH1cbiAgfVxuXG4gIFdyYXBwaW5nTm9kZS5wcm90b3R5cGUgPSBOb2RlLnByb3RvdHlwZSA9IHtcblxuICAgICAgZmluaXNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWYgKGV4dHJhLnJhbmdlKSB7XG4gICAgICAgICAgICAgIHRoaXMucmFuZ2VbMV0gPSBpbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGV4dHJhLmxvYykge1xuICAgICAgICAgICAgICB0aGlzLmxvYy5lbmQgPSBuZXcgUG9zaXRpb24oKTtcbiAgICAgICAgICAgICAgaWYgKGV4dHJhLnNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5sb2Muc291cmNlID0gZXh0cmEuc291cmNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgZmluaXNoQXJyYXlFeHByZXNzaW9uOiBmdW5jdGlvbiAoZWxlbWVudHMpIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBTeW50YXguQXJyYXlFeHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMuZWxlbWVudHMgPSBlbGVtZW50cztcbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcblxuICAgICAgZmluaXNoQXNzaWdubWVudEV4cHJlc3Npb246IGZ1bmN0aW9uIChvcGVyYXRvciwgbGVmdCwgcmlnaHQpIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBTeW50YXguQXNzaWdubWVudEV4cHJlc3Npb247XG4gICAgICAgICAgdGhpcy5vcGVyYXRvciA9IG9wZXJhdG9yO1xuICAgICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XG4gICAgICAgICAgdGhpcy5yaWdodCA9IHJpZ2h0O1xuICAgICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuXG4gICAgICBmaW5pc2hCaW5hcnlFeHByZXNzaW9uOiBmdW5jdGlvbiAob3BlcmF0b3IsIGxlZnQsIHJpZ2h0KSB7XG4gICAgICAgICAgdGhpcy50eXBlID0gKG9wZXJhdG9yID09PSAnfHwnIHx8IG9wZXJhdG9yID09PSAnJiYnKSA/IFN5bnRheC5Mb2dpY2FsRXhwcmVzc2lvbiA6IFN5bnRheC5CaW5hcnlFeHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMub3BlcmF0b3IgPSBvcGVyYXRvcjtcbiAgICAgICAgICB0aGlzLmxlZnQgPSBsZWZ0O1xuICAgICAgICAgIHRoaXMucmlnaHQgPSByaWdodDtcbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcblxuICAgICAgZmluaXNoQ2FsbEV4cHJlc3Npb246IGZ1bmN0aW9uIChjYWxsZWUsIGFyZ3MpIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBTeW50YXguQ2FsbEV4cHJlc3Npb247XG4gICAgICAgICAgdGhpcy5jYWxsZWUgPSBjYWxsZWU7XG4gICAgICAgICAgdGhpcy5hcmd1bWVudHMgPSBhcmdzO1xuICAgICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuXG4gICAgICBmaW5pc2hDb25kaXRpb25hbEV4cHJlc3Npb246IGZ1bmN0aW9uICh0ZXN0LCBjb25zZXF1ZW50LCBhbHRlcm5hdGUpIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBTeW50YXguQ29uZGl0aW9uYWxFeHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMudGVzdCA9IHRlc3Q7XG4gICAgICAgICAgdGhpcy5jb25zZXF1ZW50ID0gY29uc2VxdWVudDtcbiAgICAgICAgICB0aGlzLmFsdGVybmF0ZSA9IGFsdGVybmF0ZTtcbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcblxuICAgICAgZmluaXNoRXhwcmVzc2lvblN0YXRlbWVudDogZnVuY3Rpb24gKGV4cHJlc3Npb24pIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBTeW50YXguRXhwcmVzc2lvblN0YXRlbWVudDtcbiAgICAgICAgICB0aGlzLmV4cHJlc3Npb24gPSBleHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuXG4gICAgICBmaW5pc2hJZGVudGlmaWVyOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5JZGVudGlmaWVyO1xuICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICAgdGhpcy5maW5pc2goKTtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG5cbiAgICAgIGZpbmlzaExpdGVyYWw6IGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5MaXRlcmFsO1xuICAgICAgICAgIHRoaXMudmFsdWUgPSB0b2tlbi52YWx1ZTtcbiAgICAgICAgICB0aGlzLnJhdyA9IHNvdXJjZS5zbGljZSh0b2tlbi5zdGFydCwgdG9rZW4uZW5kKTtcbiAgICAgICAgICBpZiAodG9rZW4ucmVnZXgpIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMucmF3ID09ICcvLycpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJhdyA9ICcvKD86KS8nO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMucmVnZXggPSB0b2tlbi5yZWdleDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5maW5pc2goKTtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG5cbiAgICAgIGZpbmlzaE1lbWJlckV4cHJlc3Npb246IGZ1bmN0aW9uIChhY2Nlc3Nvciwgb2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5NZW1iZXJFeHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMuY29tcHV0ZWQgPSBhY2Nlc3NvciA9PT0gJ1snO1xuICAgICAgICAgIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuICAgICAgICAgIHRoaXMucHJvcGVydHkgPSBwcm9wZXJ0eTtcbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcblxuICAgICAgZmluaXNoT2JqZWN0RXhwcmVzc2lvbjogZnVuY3Rpb24gKHByb3BlcnRpZXMpIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBTeW50YXguT2JqZWN0RXhwcmVzc2lvbjtcbiAgICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xuICAgICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuXG4gICAgICBmaW5pc2hQcm9ncmFtOiBmdW5jdGlvbiAoYm9keSkge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5Qcm9ncmFtO1xuICAgICAgICAgIHRoaXMuYm9keSA9IGJvZHk7XG4gICAgICAgICAgdGhpcy5maW5pc2goKTtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG5cbiAgICAgIGZpbmlzaFByb3BlcnR5OiBmdW5jdGlvbiAoa2luZCwga2V5LCB2YWx1ZSkge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5Qcm9wZXJ0eTtcbiAgICAgICAgICB0aGlzLmtleSA9IGtleTtcbiAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgdGhpcy5raW5kID0ga2luZDtcbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcblxuICAgICAgZmluaXNoVW5hcnlFeHByZXNzaW9uOiBmdW5jdGlvbiAob3BlcmF0b3IsIGFyZ3VtZW50KSB7XG4gICAgICAgICAgdGhpcy50eXBlID0gKG9wZXJhdG9yID09PSAnKysnIHx8IG9wZXJhdG9yID09PSAnLS0nKSA/IFN5bnRheC5VcGRhdGVFeHByZXNzaW9uIDogU3ludGF4LlVuYXJ5RXhwcmVzc2lvbjtcbiAgICAgICAgICB0aGlzLm9wZXJhdG9yID0gb3BlcmF0b3I7XG4gICAgICAgICAgdGhpcy5hcmd1bWVudCA9IGFyZ3VtZW50O1xuICAgICAgICAgIHRoaXMucHJlZml4ID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICB9O1xuXG4gIC8vIFJldHVybiB0cnVlIGlmIHRoZXJlIGlzIGEgbGluZSB0ZXJtaW5hdG9yIGJlZm9yZSB0aGUgbmV4dCB0b2tlbi5cblxuICBmdW5jdGlvbiBwZWVrTGluZVRlcm1pbmF0b3IoKSB7XG4gICAgICB2YXIgcG9zLCBsaW5lLCBzdGFydCwgZm91bmQ7XG5cbiAgICAgIHBvcyA9IGluZGV4O1xuICAgICAgbGluZSA9IGxpbmVOdW1iZXI7XG4gICAgICBzdGFydCA9IGxpbmVTdGFydDtcbiAgICAgIHNraXBDb21tZW50KCk7XG4gICAgICBmb3VuZCA9IGxpbmVOdW1iZXIgIT09IGxpbmU7XG4gICAgICBpbmRleCA9IHBvcztcbiAgICAgIGxpbmVOdW1iZXIgPSBsaW5lO1xuICAgICAgbGluZVN0YXJ0ID0gc3RhcnQ7XG5cbiAgICAgIHJldHVybiBmb3VuZDtcbiAgfVxuXG4gIC8vIFRocm93IGFuIGV4Y2VwdGlvblxuXG4gIGZ1bmN0aW9uIHRocm93RXJyb3IodG9rZW4sIG1lc3NhZ2VGb3JtYXQpIHtcbiAgICAgIHZhciBlcnJvcixcbiAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSxcbiAgICAgICAgICBtc2cgPSBtZXNzYWdlRm9ybWF0LnJlcGxhY2UoXG4gICAgICAgICAgICAgIC8lKFxcZCkvZyxcbiAgICAgICAgICAgICAgZnVuY3Rpb24gKHdob2xlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgYXNzZXJ0KGluZGV4IDwgYXJncy5sZW5ndGgsICdNZXNzYWdlIHJlZmVyZW5jZSBtdXN0IGJlIGluIHJhbmdlJyk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gYXJnc1tpbmRleF07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuXG4gICAgICBpZiAodHlwZW9mIHRva2VuLmxpbmVOdW1iZXIgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ0xpbmUgJyArIHRva2VuLmxpbmVOdW1iZXIgKyAnOiAnICsgbXNnKTtcbiAgICAgICAgICBlcnJvci5pbmRleCA9IHRva2VuLnN0YXJ0O1xuICAgICAgICAgIGVycm9yLmxpbmVOdW1iZXIgPSB0b2tlbi5saW5lTnVtYmVyO1xuICAgICAgICAgIGVycm9yLmNvbHVtbiA9IHRva2VuLnN0YXJ0IC0gbGluZVN0YXJ0ICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ0xpbmUgJyArIGxpbmVOdW1iZXIgKyAnOiAnICsgbXNnKTtcbiAgICAgICAgICBlcnJvci5pbmRleCA9IGluZGV4O1xuICAgICAgICAgIGVycm9yLmxpbmVOdW1iZXIgPSBsaW5lTnVtYmVyO1xuICAgICAgICAgIGVycm9yLmNvbHVtbiA9IGluZGV4IC0gbGluZVN0YXJ0ICsgMTtcbiAgICAgIH1cblxuICAgICAgZXJyb3IuZGVzY3JpcHRpb24gPSBtc2c7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRocm93RXJyb3JUb2xlcmFudCgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgICAgdGhyb3dFcnJvci5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGlmIChleHRyYS5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgZXh0cmEuZXJyb3JzLnB1c2goZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gIH1cblxuXG4gIC8vIFRocm93IGFuIGV4Y2VwdGlvbiBiZWNhdXNlIG9mIHRoZSB0b2tlbi5cblxuICBmdW5jdGlvbiB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pIHtcbiAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5FT0YpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHRva2VuLCBNZXNzYWdlcy5VbmV4cGVjdGVkRU9TKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLk51bWVyaWNMaXRlcmFsKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZE51bWJlcik7XG4gICAgICB9XG5cbiAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5TdHJpbmdMaXRlcmFsKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZFN0cmluZyk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5JZGVudGlmaWVyKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZElkZW50aWZpZXIpO1xuICAgICAgfVxuXG4gICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uS2V5d29yZCkge1xuICAgICAgICAgIGlmIChpc0Z1dHVyZVJlc2VydmVkV29yZCh0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZFJlc2VydmVkKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh0b2tlbiwgTWVzc2FnZXMuU3RyaWN0UmVzZXJ2ZWRXb3JkKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aHJvd0Vycm9yKHRva2VuLCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sIHRva2VuLnZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgLy8gQm9vbGVhbkxpdGVyYWwsIE51bGxMaXRlcmFsLCBvciBQdW5jdHVhdG9yLlxuICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCB0b2tlbi52YWx1ZSk7XG4gIH1cblxuICAvLyBFeHBlY3QgdGhlIG5leHQgdG9rZW4gdG8gbWF0Y2ggdGhlIHNwZWNpZmllZCBwdW5jdHVhdG9yLlxuICAvLyBJZiBub3QsIGFuIGV4Y2VwdGlvbiB3aWxsIGJlIHRocm93bi5cblxuICBmdW5jdGlvbiBleHBlY3QodmFsdWUpIHtcbiAgICAgIHZhciB0b2tlbiA9IGxleCgpO1xuICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLlB1bmN0dWF0b3IgfHwgdG9rZW4udmFsdWUgIT09IHZhbHVlKSB7XG4gICAgICAgICAgdGhyb3dVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAbmFtZSBleHBlY3RUb2xlcmFudFxuICAgKiBAZGVzY3JpcHRpb24gUXVpZXRseSBleHBlY3QgdGhlIGdpdmVuIHRva2VuIHZhbHVlIHdoZW4gaW4gdG9sZXJhbnQgbW9kZSwgb3RoZXJ3aXNlIGRlbGVnYXRlc1xuICAgKiB0byA8Y29kZT5leHBlY3QodmFsdWUpPC9jb2RlPlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgVGhlIHZhbHVlIHdlIGFyZSBleHBlY3RpbmcgdGhlIGxvb2thaGVhZCB0b2tlbiB0byBoYXZlXG4gICAqIEBzaW5jZSAyLjBcbiAgICovXG4gIGZ1bmN0aW9uIGV4cGVjdFRvbGVyYW50KHZhbHVlKSB7XG4gICAgICBpZiAoZXh0cmEuZXJyb3JzKSB7XG4gICAgICAgICAgdmFyIHRva2VuID0gbG9va2FoZWFkO1xuICAgICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5QdW5jdHVhdG9yICYmIHRva2VuLnZhbHVlICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQodG9rZW4sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgdG9rZW4udmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXhwZWN0KHZhbHVlKTtcbiAgICAgIH1cbiAgfVxuXG4gIC8vIEV4cGVjdCB0aGUgbmV4dCB0b2tlbiB0byBtYXRjaCB0aGUgc3BlY2lmaWVkIGtleXdvcmQuXG4gIC8vIElmIG5vdCwgYW4gZXhjZXB0aW9uIHdpbGwgYmUgdGhyb3duLlxuXG4gIGZ1bmN0aW9uIGV4cGVjdEtleXdvcmQoa2V5d29yZCkge1xuICAgICAgdmFyIHRva2VuID0gbGV4KCk7XG4gICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uS2V5d29yZCB8fCB0b2tlbi52YWx1ZSAhPT0ga2V5d29yZCkge1xuICAgICAgICAgIHRocm93VW5leHBlY3RlZCh0b2tlbik7XG4gICAgICB9XG4gIH1cblxuICAvLyBSZXR1cm4gdHJ1ZSBpZiB0aGUgbmV4dCB0b2tlbiBtYXRjaGVzIHRoZSBzcGVjaWZpZWQgcHVuY3R1YXRvci5cblxuICBmdW5jdGlvbiBtYXRjaCh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGxvb2thaGVhZC50eXBlID09PSBUb2tlbi5QdW5jdHVhdG9yICYmIGxvb2thaGVhZC52YWx1ZSA9PT0gdmFsdWU7XG4gIH1cblxuICAvLyBSZXR1cm4gdHJ1ZSBpZiB0aGUgbmV4dCB0b2tlbiBtYXRjaGVzIHRoZSBzcGVjaWZpZWQga2V5d29yZFxuXG4gIGZ1bmN0aW9uIG1hdGNoS2V5d29yZChrZXl3b3JkKSB7XG4gICAgICByZXR1cm4gbG9va2FoZWFkLnR5cGUgPT09IFRva2VuLktleXdvcmQgJiYgbG9va2FoZWFkLnZhbHVlID09PSBrZXl3b3JkO1xuICB9XG5cbiAgZnVuY3Rpb24gY29uc3VtZVNlbWljb2xvbigpIHtcbiAgICAgIHZhciBsaW5lO1xuXG4gICAgICAvLyBDYXRjaCB0aGUgdmVyeSBjb21tb24gY2FzZSBmaXJzdDogaW1tZWRpYXRlbHkgYSBzZW1pY29sb24gKFUrMDAzQikuXG4gICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpID09PSAweDNCIHx8IG1hdGNoKCc7JykpIHtcbiAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGxpbmUgPSBsaW5lTnVtYmVyO1xuICAgICAgc2tpcENvbW1lbnQoKTtcbiAgICAgIGlmIChsaW5lTnVtYmVyICE9PSBsaW5lKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAobG9va2FoZWFkLnR5cGUgIT09IFRva2VuLkVPRiAmJiAhbWF0Y2goJ30nKSkge1xuICAgICAgICAgIHRocm93VW5leHBlY3RlZChsb29rYWhlYWQpO1xuICAgICAgfVxuICB9XG5cbiAgLy8gUmV0dXJuIHRydWUgaWYgcHJvdmlkZWQgZXhwcmVzc2lvbiBpcyBMZWZ0SGFuZFNpZGVFeHByZXNzaW9uXG5cbiAgZnVuY3Rpb24gaXNMZWZ0SGFuZFNpZGUoZXhwcikge1xuICAgICAgcmV0dXJuIGV4cHIudHlwZSA9PT0gU3ludGF4LklkZW50aWZpZXIgfHwgZXhwci50eXBlID09PSBTeW50YXguTWVtYmVyRXhwcmVzc2lvbjtcbiAgfVxuXG4gIC8vIDExLjEuNCBBcnJheSBJbml0aWFsaXNlclxuXG4gIGZ1bmN0aW9uIHBhcnNlQXJyYXlJbml0aWFsaXNlcigpIHtcbiAgICAgIHZhciBlbGVtZW50cyA9IFtdLCBub2RlID0gbmV3IE5vZGUoKTtcblxuICAgICAgZXhwZWN0KCdbJyk7XG5cbiAgICAgIHdoaWxlICghbWF0Y2goJ10nKSkge1xuICAgICAgICAgIGlmIChtYXRjaCgnLCcpKSB7XG4gICAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKG51bGwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnRzLnB1c2gocGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpKTtcblxuICAgICAgICAgICAgICBpZiAoIW1hdGNoKCddJykpIHtcbiAgICAgICAgICAgICAgICAgIGV4cGVjdCgnLCcpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsZXgoKTtcblxuICAgICAgcmV0dXJuIG5vZGUuZmluaXNoQXJyYXlFeHByZXNzaW9uKGVsZW1lbnRzKTtcbiAgfVxuXG4gIC8vIDExLjEuNSBPYmplY3QgSW5pdGlhbGlzZXJcblxuICBmdW5jdGlvbiBwYXJzZU9iamVjdFByb3BlcnR5S2V5KCkge1xuICAgICAgdmFyIHRva2VuLCBub2RlID0gbmV3IE5vZGUoKTtcblxuICAgICAgdG9rZW4gPSBsZXgoKTtcblxuICAgICAgLy8gTm90ZTogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgb25seSBmcm9tIHBhcnNlT2JqZWN0UHJvcGVydHkoKSwgd2hlcmVcbiAgICAgIC8vIEVPRiBhbmQgUHVuY3R1YXRvciB0b2tlbnMgYXJlIGFscmVhZHkgZmlsdGVyZWQgb3V0LlxuXG4gICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uU3RyaW5nTGl0ZXJhbCB8fCB0b2tlbi50eXBlID09PSBUb2tlbi5OdW1lcmljTGl0ZXJhbCkge1xuICAgICAgICAgIGlmIChzdHJpY3QgJiYgdG9rZW4ub2N0YWwpIHtcbiAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHRva2VuLCBNZXNzYWdlcy5TdHJpY3RPY3RhbExpdGVyYWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbm9kZS5maW5pc2hMaXRlcmFsKHRva2VuKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5vZGUuZmluaXNoSWRlbnRpZmllcih0b2tlbi52YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZU9iamVjdFByb3BlcnR5KCkge1xuICAgICAgdmFyIHRva2VuLCBrZXksIGlkLCB2YWx1ZSwgcGFyYW0sIG5vZGUgPSBuZXcgTm9kZSgpO1xuXG4gICAgICB0b2tlbiA9IGxvb2thaGVhZDtcblxuICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLklkZW50aWZpZXIpIHtcbiAgICAgICAgICBpZCA9IHBhcnNlT2JqZWN0UHJvcGVydHlLZXkoKTtcbiAgICAgICAgICBleHBlY3QoJzonKTtcbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgICByZXR1cm4gbm9kZS5maW5pc2hQcm9wZXJ0eSgnaW5pdCcsIGlkLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uRU9GIHx8IHRva2VuLnR5cGUgPT09IFRva2VuLlB1bmN0dWF0b3IpIHtcbiAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBrZXkgPSBwYXJzZU9iamVjdFByb3BlcnR5S2V5KCk7XG4gICAgICAgICAgZXhwZWN0KCc6Jyk7XG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgICAgcmV0dXJuIG5vZGUuZmluaXNoUHJvcGVydHkoJ2luaXQnLCBrZXksIHZhbHVlKTtcbiAgICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlT2JqZWN0SW5pdGlhbGlzZXIoKSB7XG4gICAgICB2YXIgcHJvcGVydGllcyA9IFtdLCB0b2tlbiwgcHJvcGVydHksIG5hbWUsIGtleSwga2luZCwgbWFwID0ge30sIHRvU3RyaW5nID0gU3RyaW5nLCBub2RlID0gbmV3IE5vZGUoKTtcblxuICAgICAgZXhwZWN0KCd7Jyk7XG5cbiAgICAgIHdoaWxlICghbWF0Y2goJ30nKSkge1xuICAgICAgICAgIHByb3BlcnR5ID0gcGFyc2VPYmplY3RQcm9wZXJ0eSgpO1xuXG4gICAgICAgICAgaWYgKHByb3BlcnR5LmtleS50eXBlID09PSBTeW50YXguSWRlbnRpZmllcikge1xuICAgICAgICAgICAgICBuYW1lID0gcHJvcGVydHkua2V5Lm5hbWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbmFtZSA9IHRvU3RyaW5nKHByb3BlcnR5LmtleS52YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGtpbmQgPSAocHJvcGVydHkua2luZCA9PT0gJ2luaXQnKSA/IFByb3BlcnR5S2luZC5EYXRhIDogKHByb3BlcnR5LmtpbmQgPT09ICdnZXQnKSA/IFByb3BlcnR5S2luZC5HZXQgOiBQcm9wZXJ0eUtpbmQuU2V0O1xuXG4gICAgICAgICAga2V5ID0gJyQnICsgbmFtZTtcbiAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1hcCwga2V5KSkge1xuICAgICAgICAgICAgICBpZiAobWFwW2tleV0gPT09IFByb3BlcnR5S2luZC5EYXRhKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoc3RyaWN0ICYmIGtpbmQgPT09IFByb3BlcnR5S2luZC5EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5TdHJpY3REdXBsaWNhdGVQcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGtpbmQgIT09IFByb3BlcnR5S2luZC5EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5BY2Nlc3NvckRhdGFQcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBpZiAoa2luZCA9PT0gUHJvcGVydHlLaW5kLkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLkFjY2Vzc29yRGF0YVByb3BlcnR5KTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWFwW2tleV0gJiBraW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5BY2Nlc3NvckdldFNldCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbWFwW2tleV0gfD0ga2luZDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBtYXBba2V5XSA9IGtpbmQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcHJvcGVydGllcy5wdXNoKHByb3BlcnR5KTtcblxuICAgICAgICAgIGlmICghbWF0Y2goJ30nKSkge1xuICAgICAgICAgICAgICBleHBlY3RUb2xlcmFudCgnLCcpO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZXhwZWN0KCd9Jyk7XG5cbiAgICAgIHJldHVybiBub2RlLmZpbmlzaE9iamVjdEV4cHJlc3Npb24ocHJvcGVydGllcyk7XG4gIH1cblxuICAvLyAxMS4xLjYgVGhlIEdyb3VwaW5nIE9wZXJhdG9yXG5cbiAgZnVuY3Rpb24gcGFyc2VHcm91cEV4cHJlc3Npb24oKSB7XG4gICAgICB2YXIgZXhwcjtcblxuICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgICsrc3RhdGUucGFyZW50aGVzaXNDb3VudDtcblxuICAgICAgZXhwciA9IHBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICBleHBlY3QoJyknKTtcblxuICAgICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuXG4gIC8vIDExLjEgUHJpbWFyeSBFeHByZXNzaW9uc1xuXG4gIHZhciBsZWdhbEtleXdvcmRzID0ge1wiaWZcIjoxLCBcInRoaXNcIjoxfTtcblxuICBmdW5jdGlvbiBwYXJzZVByaW1hcnlFeHByZXNzaW9uKCkge1xuICAgICAgdmFyIHR5cGUsIHRva2VuLCBleHByLCBub2RlO1xuXG4gICAgICBpZiAobWF0Y2goJygnKSkge1xuICAgICAgICAgIHJldHVybiBwYXJzZUdyb3VwRXhwcmVzc2lvbigpO1xuICAgICAgfVxuXG4gICAgICBpZiAobWF0Y2goJ1snKSkge1xuICAgICAgICAgIHJldHVybiBwYXJzZUFycmF5SW5pdGlhbGlzZXIoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG1hdGNoKCd7JykpIHtcbiAgICAgICAgICByZXR1cm4gcGFyc2VPYmplY3RJbml0aWFsaXNlcigpO1xuICAgICAgfVxuXG4gICAgICB0eXBlID0gbG9va2FoZWFkLnR5cGU7XG4gICAgICBub2RlID0gbmV3IE5vZGUoKTtcblxuICAgICAgaWYgKHR5cGUgPT09IFRva2VuLklkZW50aWZpZXIgfHwgbGVnYWxLZXl3b3Jkc1tsb29rYWhlYWQudmFsdWVdKSB7XG4gICAgICAgICAgZXhwciA9IG5vZGUuZmluaXNoSWRlbnRpZmllcihsZXgoKS52YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFRva2VuLlN0cmluZ0xpdGVyYWwgfHwgdHlwZSA9PT0gVG9rZW4uTnVtZXJpY0xpdGVyYWwpIHtcbiAgICAgICAgICBpZiAoc3RyaWN0ICYmIGxvb2thaGVhZC5vY3RhbCkge1xuICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQobG9va2FoZWFkLCBNZXNzYWdlcy5TdHJpY3RPY3RhbExpdGVyYWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBleHByID0gbm9kZS5maW5pc2hMaXRlcmFsKGxleCgpKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gVG9rZW4uS2V5d29yZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpc2FibGVkLlwiKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gVG9rZW4uQm9vbGVhbkxpdGVyYWwpIHtcbiAgICAgICAgICB0b2tlbiA9IGxleCgpO1xuICAgICAgICAgIHRva2VuLnZhbHVlID0gKHRva2VuLnZhbHVlID09PSAndHJ1ZScpO1xuICAgICAgICAgIGV4cHIgPSBub2RlLmZpbmlzaExpdGVyYWwodG9rZW4pO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBUb2tlbi5OdWxsTGl0ZXJhbCkge1xuICAgICAgICAgIHRva2VuID0gbGV4KCk7XG4gICAgICAgICAgdG9rZW4udmFsdWUgPSBudWxsO1xuICAgICAgICAgIGV4cHIgPSBub2RlLmZpbmlzaExpdGVyYWwodG9rZW4pO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaCgnLycpIHx8IG1hdGNoKCcvPScpKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBleHRyYS50b2tlbnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIGV4cHIgPSBub2RlLmZpbmlzaExpdGVyYWwoY29sbGVjdFJlZ2V4KCkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGV4cHIgPSBub2RlLmZpbmlzaExpdGVyYWwoc2NhblJlZ0V4cCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGVlaygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQobGV4KCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIC8vIDExLjIgTGVmdC1IYW5kLVNpZGUgRXhwcmVzc2lvbnNcblxuICBmdW5jdGlvbiBwYXJzZUFyZ3VtZW50cygpIHtcbiAgICAgIHZhciBhcmdzID0gW107XG5cbiAgICAgIGV4cGVjdCgnKCcpO1xuXG4gICAgICBpZiAoIW1hdGNoKCcpJykpIHtcbiAgICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgYXJncy5wdXNoKHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSk7XG4gICAgICAgICAgICAgIGlmIChtYXRjaCgnKScpKSB7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBleHBlY3RUb2xlcmFudCgnLCcpO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgIHJldHVybiBhcmdzO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VOb25Db21wdXRlZFByb3BlcnR5KCkge1xuICAgICAgdmFyIHRva2VuLCBub2RlID0gbmV3IE5vZGUoKTtcblxuICAgICAgdG9rZW4gPSBsZXgoKTtcblxuICAgICAgaWYgKCFpc0lkZW50aWZpZXJOYW1lKHRva2VuKSkge1xuICAgICAgICAgIHRocm93VW5leHBlY3RlZCh0b2tlbik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBub2RlLmZpbmlzaElkZW50aWZpZXIodG9rZW4udmFsdWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VOb25Db21wdXRlZE1lbWJlcigpIHtcbiAgICAgIGV4cGVjdCgnLicpO1xuXG4gICAgICByZXR1cm4gcGFyc2VOb25Db21wdXRlZFByb3BlcnR5KCk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZUNvbXB1dGVkTWVtYmVyKCkge1xuICAgICAgdmFyIGV4cHI7XG5cbiAgICAgIGV4cGVjdCgnWycpO1xuXG4gICAgICBleHByID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgIGV4cGVjdCgnXScpO1xuXG4gICAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbkFsbG93Q2FsbCgpIHtcbiAgICAgIHZhciBleHByLCBhcmdzLCBwcm9wZXJ0eSwgc3RhcnRUb2tlbiwgcHJldmlvdXNBbGxvd0luID0gc3RhdGUuYWxsb3dJbjtcblxuICAgICAgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcbiAgICAgIHN0YXRlLmFsbG93SW4gPSB0cnVlO1xuICAgICAgZXhwciA9IHBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKTtcblxuICAgICAgZm9yICg7Oykge1xuICAgICAgICAgIGlmIChtYXRjaCgnLicpKSB7XG4gICAgICAgICAgICAgIHByb3BlcnR5ID0gcGFyc2VOb25Db21wdXRlZE1lbWJlcigpO1xuICAgICAgICAgICAgICBleHByID0gbmV3IFdyYXBwaW5nTm9kZShzdGFydFRva2VuKS5maW5pc2hNZW1iZXJFeHByZXNzaW9uKCcuJywgZXhwciwgcHJvcGVydHkpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2goJygnKSkge1xuICAgICAgICAgICAgICBhcmdzID0gcGFyc2VBcmd1bWVudHMoKTtcbiAgICAgICAgICAgICAgZXhwciA9IG5ldyBXcmFwcGluZ05vZGUoc3RhcnRUb2tlbikuZmluaXNoQ2FsbEV4cHJlc3Npb24oZXhwciwgYXJncyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCgnWycpKSB7XG4gICAgICAgICAgICAgIHByb3BlcnR5ID0gcGFyc2VDb21wdXRlZE1lbWJlcigpO1xuICAgICAgICAgICAgICBleHByID0gbmV3IFdyYXBwaW5nTm9kZShzdGFydFRva2VuKS5maW5pc2hNZW1iZXJFeHByZXNzaW9uKCdbJywgZXhwciwgcHJvcGVydHkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHN0YXRlLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKCkge1xuICAgICAgdmFyIGV4cHIsIHByb3BlcnR5LCBzdGFydFRva2VuO1xuICAgICAgYXNzZXJ0KHN0YXRlLmFsbG93SW4sICdjYWxsZWUgb2YgbmV3IGV4cHJlc3Npb24gYWx3YXlzIGFsbG93IGluIGtleXdvcmQuJyk7XG5cbiAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICBleHByID0gcGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgICBmb3IgKDs7KSB7XG4gICAgICAgICAgaWYgKG1hdGNoKCdbJykpIHtcbiAgICAgICAgICAgICAgcHJvcGVydHkgPSBwYXJzZUNvbXB1dGVkTWVtYmVyKCk7XG4gICAgICAgICAgICAgIGV4cHIgPSBuZXcgV3JhcHBpbmdOb2RlKHN0YXJ0VG9rZW4pLmZpbmlzaE1lbWJlckV4cHJlc3Npb24oJ1snLCBleHByLCBwcm9wZXJ0eSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCgnLicpKSB7XG4gICAgICAgICAgICAgIHByb3BlcnR5ID0gcGFyc2VOb25Db21wdXRlZE1lbWJlcigpO1xuICAgICAgICAgICAgICBleHByID0gbmV3IFdyYXBwaW5nTm9kZShzdGFydFRva2VuKS5maW5pc2hNZW1iZXJFeHByZXNzaW9uKCcuJywgZXhwciwgcHJvcGVydHkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgLy8gMTEuMyBQb3N0Zml4IEV4cHJlc3Npb25zXG5cbiAgZnVuY3Rpb24gcGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpIHtcbiAgICAgIHZhciBleHByLCB0b2tlbiwgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcblxuICAgICAgZXhwciA9IHBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbkFsbG93Q2FsbCgpO1xuXG4gICAgICBpZiAobG9va2FoZWFkLnR5cGUgPT09IFRva2VuLlB1bmN0dWF0b3IpIHtcbiAgICAgICAgICBpZiAoKG1hdGNoKCcrKycpIHx8IG1hdGNoKCctLScpKSAmJiAhcGVla0xpbmVUZXJtaW5hdG9yKCkpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGlzYWJsZWQuXCIpO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICAvLyAxMS40IFVuYXJ5IE9wZXJhdG9yc1xuXG4gIGZ1bmN0aW9uIHBhcnNlVW5hcnlFeHByZXNzaW9uKCkge1xuICAgICAgdmFyIHRva2VuLCBleHByLCBzdGFydFRva2VuO1xuXG4gICAgICBpZiAobG9va2FoZWFkLnR5cGUgIT09IFRva2VuLlB1bmN0dWF0b3IgJiYgbG9va2FoZWFkLnR5cGUgIT09IFRva2VuLktleXdvcmQpIHtcbiAgICAgICAgICBleHByID0gcGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaCgnKysnKSB8fCBtYXRjaCgnLS0nKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpc2FibGVkLlwiKTtcbiAgICAgIH0gZWxzZSBpZiAobWF0Y2goJysnKSB8fCBtYXRjaCgnLScpIHx8IG1hdGNoKCd+JykgfHwgbWF0Y2goJyEnKSkge1xuICAgICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgICAgdG9rZW4gPSBsZXgoKTtcbiAgICAgICAgICBleHByID0gcGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcbiAgICAgICAgICBleHByID0gbmV3IFdyYXBwaW5nTm9kZShzdGFydFRva2VuKS5maW5pc2hVbmFyeUV4cHJlc3Npb24odG9rZW4udmFsdWUsIGV4cHIpO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaEtleXdvcmQoJ2RlbGV0ZScpIHx8IG1hdGNoS2V5d29yZCgndm9pZCcpIHx8IG1hdGNoS2V5d29yZCgndHlwZW9mJykpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEaXNhYmxlZC5cIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV4cHIgPSBwYXJzZVBvc3RmaXhFeHByZXNzaW9uKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgZnVuY3Rpb24gYmluYXJ5UHJlY2VkZW5jZSh0b2tlbiwgYWxsb3dJbikge1xuICAgICAgdmFyIHByZWMgPSAwO1xuXG4gICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uUHVuY3R1YXRvciAmJiB0b2tlbi50eXBlICE9PSBUb2tlbi5LZXl3b3JkKSB7XG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG5cbiAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgIGNhc2UgJ3x8JzpcbiAgICAgICAgICBwcmVjID0gMTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnJiYnOlxuICAgICAgICAgIHByZWMgPSAyO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICd8JzpcbiAgICAgICAgICBwcmVjID0gMztcbiAgICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnXic6XG4gICAgICAgICAgcHJlYyA9IDQ7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJyYnOlxuICAgICAgICAgIHByZWMgPSA1O1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICc9PSc6XG4gICAgICBjYXNlICchPSc6XG4gICAgICBjYXNlICc9PT0nOlxuICAgICAgY2FzZSAnIT09JzpcbiAgICAgICAgICBwcmVjID0gNjtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnPCc6XG4gICAgICBjYXNlICc+JzpcbiAgICAgIGNhc2UgJzw9JzpcbiAgICAgIGNhc2UgJz49JzpcbiAgICAgIGNhc2UgJ2luc3RhbmNlb2YnOlxuICAgICAgICAgIHByZWMgPSA3O1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdpbic6XG4gICAgICAgICAgcHJlYyA9IGFsbG93SW4gPyA3IDogMDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnPDwnOlxuICAgICAgY2FzZSAnPj4nOlxuICAgICAgY2FzZSAnPj4+JzpcbiAgICAgICAgICBwcmVjID0gODtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnKyc6XG4gICAgICBjYXNlICctJzpcbiAgICAgICAgICBwcmVjID0gOTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnKic6XG4gICAgICBjYXNlICcvJzpcbiAgICAgIGNhc2UgJyUnOlxuICAgICAgICAgIHByZWMgPSAxMTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByZWM7XG4gIH1cblxuICAvLyAxMS41IE11bHRpcGxpY2F0aXZlIE9wZXJhdG9yc1xuICAvLyAxMS42IEFkZGl0aXZlIE9wZXJhdG9yc1xuICAvLyAxMS43IEJpdHdpc2UgU2hpZnQgT3BlcmF0b3JzXG4gIC8vIDExLjggUmVsYXRpb25hbCBPcGVyYXRvcnNcbiAgLy8gMTEuOSBFcXVhbGl0eSBPcGVyYXRvcnNcbiAgLy8gMTEuMTAgQmluYXJ5IEJpdHdpc2UgT3BlcmF0b3JzXG4gIC8vIDExLjExIEJpbmFyeSBMb2dpY2FsIE9wZXJhdG9yc1xuXG4gIGZ1bmN0aW9uIHBhcnNlQmluYXJ5RXhwcmVzc2lvbigpIHtcbiAgICAgIHZhciBtYXJrZXIsIG1hcmtlcnMsIGV4cHIsIHRva2VuLCBwcmVjLCBzdGFjaywgcmlnaHQsIG9wZXJhdG9yLCBsZWZ0LCBpO1xuXG4gICAgICBtYXJrZXIgPSBsb29rYWhlYWQ7XG4gICAgICBsZWZ0ID0gcGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcblxuICAgICAgdG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICBwcmVjID0gYmluYXJ5UHJlY2VkZW5jZSh0b2tlbiwgc3RhdGUuYWxsb3dJbik7XG4gICAgICBpZiAocHJlYyA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiBsZWZ0O1xuICAgICAgfVxuICAgICAgdG9rZW4ucHJlYyA9IHByZWM7XG4gICAgICBsZXgoKTtcblxuICAgICAgbWFya2VycyA9IFttYXJrZXIsIGxvb2thaGVhZF07XG4gICAgICByaWdodCA9IHBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG5cbiAgICAgIHN0YWNrID0gW2xlZnQsIHRva2VuLCByaWdodF07XG5cbiAgICAgIHdoaWxlICgocHJlYyA9IGJpbmFyeVByZWNlZGVuY2UobG9va2FoZWFkLCBzdGF0ZS5hbGxvd0luKSkgPiAwKSB7XG5cbiAgICAgICAgICAvLyBSZWR1Y2U6IG1ha2UgYSBiaW5hcnkgZXhwcmVzc2lvbiBmcm9tIHRoZSB0aHJlZSB0b3Btb3N0IGVudHJpZXMuXG4gICAgICAgICAgd2hpbGUgKChzdGFjay5sZW5ndGggPiAyKSAmJiAocHJlYyA8PSBzdGFja1tzdGFjay5sZW5ndGggLSAyXS5wcmVjKSkge1xuICAgICAgICAgICAgICByaWdodCA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICBvcGVyYXRvciA9IHN0YWNrLnBvcCgpLnZhbHVlO1xuICAgICAgICAgICAgICBsZWZ0ID0gc3RhY2sucG9wKCk7XG4gICAgICAgICAgICAgIG1hcmtlcnMucG9wKCk7XG4gICAgICAgICAgICAgIGV4cHIgPSBuZXcgV3JhcHBpbmdOb2RlKG1hcmtlcnNbbWFya2Vycy5sZW5ndGggLSAxXSkuZmluaXNoQmluYXJ5RXhwcmVzc2lvbihvcGVyYXRvciwgbGVmdCwgcmlnaHQpO1xuICAgICAgICAgICAgICBzdGFjay5wdXNoKGV4cHIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFNoaWZ0LlxuICAgICAgICAgIHRva2VuID0gbGV4KCk7XG4gICAgICAgICAgdG9rZW4ucHJlYyA9IHByZWM7XG4gICAgICAgICAgc3RhY2sucHVzaCh0b2tlbik7XG4gICAgICAgICAgbWFya2Vycy5wdXNoKGxvb2thaGVhZCk7XG4gICAgICAgICAgZXhwciA9IHBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG4gICAgICAgICAgc3RhY2sucHVzaChleHByKTtcbiAgICAgIH1cblxuICAgICAgLy8gRmluYWwgcmVkdWNlIHRvIGNsZWFuLXVwIHRoZSBzdGFjay5cbiAgICAgIGkgPSBzdGFjay5sZW5ndGggLSAxO1xuICAgICAgZXhwciA9IHN0YWNrW2ldO1xuICAgICAgbWFya2Vycy5wb3AoKTtcbiAgICAgIHdoaWxlIChpID4gMSkge1xuICAgICAgICAgIGV4cHIgPSBuZXcgV3JhcHBpbmdOb2RlKG1hcmtlcnMucG9wKCkpLmZpbmlzaEJpbmFyeUV4cHJlc3Npb24oc3RhY2tbaSAtIDFdLnZhbHVlLCBzdGFja1tpIC0gMl0sIGV4cHIpO1xuICAgICAgICAgIGkgLT0gMjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICAvLyAxMS4xMiBDb25kaXRpb25hbCBPcGVyYXRvclxuXG4gIGZ1bmN0aW9uIHBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKCkge1xuICAgICAgdmFyIGV4cHIsIHByZXZpb3VzQWxsb3dJbiwgY29uc2VxdWVudCwgYWx0ZXJuYXRlLCBzdGFydFRva2VuO1xuXG4gICAgICBzdGFydFRva2VuID0gbG9va2FoZWFkO1xuXG4gICAgICBleHByID0gcGFyc2VCaW5hcnlFeHByZXNzaW9uKCk7XG5cbiAgICAgIGlmIChtYXRjaCgnPycpKSB7XG4gICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgcHJldmlvdXNBbGxvd0luID0gc3RhdGUuYWxsb3dJbjtcbiAgICAgICAgICBzdGF0ZS5hbGxvd0luID0gdHJ1ZTtcbiAgICAgICAgICBjb25zZXF1ZW50ID0gcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICAgIHN0YXRlLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG4gICAgICAgICAgZXhwZWN0KCc6Jyk7XG4gICAgICAgICAgYWx0ZXJuYXRlID0gcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuXG4gICAgICAgICAgZXhwciA9IG5ldyBXcmFwcGluZ05vZGUoc3RhcnRUb2tlbikuZmluaXNoQ29uZGl0aW9uYWxFeHByZXNzaW9uKGV4cHIsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgLy8gMTEuMTMgQXNzaWdubWVudCBPcGVyYXRvcnNcblxuICBmdW5jdGlvbiBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkge1xuICAgICAgdmFyIG9sZFBhcmVudGhlc2lzQ291bnQsIHRva2VuLCBleHByLCByaWdodCwgbGlzdCwgc3RhcnRUb2tlbjtcblxuICAgICAgb2xkUGFyZW50aGVzaXNDb3VudCA9IHN0YXRlLnBhcmVudGhlc2lzQ291bnQ7XG5cbiAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICB0b2tlbiA9IGxvb2thaGVhZDtcblxuICAgICAgZXhwciA9IHBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKCk7XG5cbiAgICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgLy8gMTEuMTQgQ29tbWEgT3BlcmF0b3JcblxuICBmdW5jdGlvbiBwYXJzZUV4cHJlc3Npb24oKSB7XG4gICAgICB2YXIgZXhwciwgc3RhcnRUb2tlbiA9IGxvb2thaGVhZCwgZXhwcmVzc2lvbnM7XG5cbiAgICAgIGV4cHIgPSBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG5cbiAgICAgIGlmIChtYXRjaCgnLCcpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGlzYWJsZWQuXCIpOyAvLyBubyBzZXF1ZW5jZSBleHByZXNzaW9uc1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIC8vIDEyLjQgRXhwcmVzc2lvbiBTdGF0ZW1lbnRcblxuICBmdW5jdGlvbiBwYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSkge1xuICAgICAgdmFyIGV4cHIgPSBwYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIGNvbnN1bWVTZW1pY29sb24oKTtcbiAgICAgIHJldHVybiBub2RlLmZpbmlzaEV4cHJlc3Npb25TdGF0ZW1lbnQoZXhwcik7XG4gIH1cblxuICAvLyAxMiBTdGF0ZW1lbnRzXG5cbiAgZnVuY3Rpb24gcGFyc2VTdGF0ZW1lbnQoKSB7XG4gICAgICB2YXIgdHlwZSA9IGxvb2thaGVhZC50eXBlLFxuICAgICAgICAgIGV4cHIsXG4gICAgICAgICAgbGFiZWxlZEJvZHksXG4gICAgICAgICAga2V5LFxuICAgICAgICAgIG5vZGU7XG5cbiAgICAgIGlmICh0eXBlID09PSBUb2tlbi5FT0YpIHtcbiAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQobG9va2FoZWFkKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGUgPT09IFRva2VuLlB1bmN0dWF0b3IgJiYgbG9va2FoZWFkLnZhbHVlID09PSAneycpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEaXNhYmxlZC5cIik7IC8vIGJsb2NrIHN0YXRlbWVudFxuICAgICAgfVxuXG4gICAgICBub2RlID0gbmV3IE5vZGUoKTtcblxuICAgICAgaWYgKHR5cGUgPT09IFRva2VuLlB1bmN0dWF0b3IpIHtcbiAgICAgICAgICBzd2l0Y2ggKGxvb2thaGVhZC52YWx1ZSkge1xuICAgICAgICAgIGNhc2UgJzsnOlxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEaXNhYmxlZC5cIik7IC8vIGVtcHR5IHN0YXRlbWVudFxuICAgICAgICAgIGNhc2UgJygnOlxuICAgICAgICAgICAgICByZXR1cm4gcGFyc2VFeHByZXNzaW9uU3RhdGVtZW50KG5vZGUpO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gVG9rZW4uS2V5d29yZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpc2FibGVkLlwiKTsgLy8ga2V5d29yZFxuICAgICAgfVxuXG4gICAgICBleHByID0gcGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICBjb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgICByZXR1cm4gbm9kZS5maW5pc2hFeHByZXNzaW9uU3RhdGVtZW50KGV4cHIpO1xuICB9XG5cbiAgLy8gMTQgUHJvZ3JhbVxuXG4gIGZ1bmN0aW9uIHBhcnNlU291cmNlRWxlbWVudCgpIHtcbiAgICAgIGlmIChsb29rYWhlYWQudHlwZSA9PT0gVG9rZW4uS2V5d29yZCkge1xuICAgICAgICAgIHN3aXRjaCAobG9va2FoZWFkLnZhbHVlKSB7XG4gICAgICAgICAgY2FzZSAnY29uc3QnOlxuICAgICAgICAgIGNhc2UgJ2xldCc6XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpc2FibGVkLlwiKTtcbiAgICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpc2FibGVkLlwiKTtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICByZXR1cm4gcGFyc2VTdGF0ZW1lbnQoKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChsb29rYWhlYWQudHlwZSAhPT0gVG9rZW4uRU9GKSB7XG4gICAgICAgICAgcmV0dXJuIHBhcnNlU3RhdGVtZW50KCk7XG4gICAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZVNvdXJjZUVsZW1lbnRzKCkge1xuICAgICAgdmFyIHNvdXJjZUVsZW1lbnQsIHNvdXJjZUVsZW1lbnRzID0gW10sIHRva2VuLCBkaXJlY3RpdmUsIGZpcnN0UmVzdHJpY3RlZDtcblxuICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLlN0cmluZ0xpdGVyYWwpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc291cmNlRWxlbWVudCA9IHBhcnNlU291cmNlRWxlbWVudCgpO1xuICAgICAgICAgIHNvdXJjZUVsZW1lbnRzLnB1c2goc291cmNlRWxlbWVudCk7XG4gICAgICAgICAgaWYgKHNvdXJjZUVsZW1lbnQuZXhwcmVzc2lvbi50eXBlICE9PSBTeW50YXguTGl0ZXJhbCkge1xuICAgICAgICAgICAgICAvLyB0aGlzIGlzIG5vdCBkaXJlY3RpdmVcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRpcmVjdGl2ZSA9IHNvdXJjZS5zbGljZSh0b2tlbi5zdGFydCArIDEsIHRva2VuLmVuZCAtIDEpO1xuICAgICAgICAgIGlmIChkaXJlY3RpdmUgPT09ICd1c2Ugc3RyaWN0Jykge1xuICAgICAgICAgICAgICBzdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgICBpZiAoZmlyc3RSZXN0cmljdGVkKSB7XG4gICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoZmlyc3RSZXN0cmljdGVkLCBNZXNzYWdlcy5TdHJpY3RPY3RhbExpdGVyYWwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKCFmaXJzdFJlc3RyaWN0ZWQgJiYgdG9rZW4ub2N0YWwpIHtcbiAgICAgICAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBzb3VyY2VFbGVtZW50ID0gcGFyc2VTb3VyY2VFbGVtZW50KCk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2VFbGVtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgc291cmNlRWxlbWVudHMucHVzaChzb3VyY2VFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzb3VyY2VFbGVtZW50cztcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlUHJvZ3JhbSgpIHtcbiAgICAgIHZhciBib2R5LCBub2RlO1xuXG4gICAgICBza2lwQ29tbWVudCgpO1xuICAgICAgcGVlaygpO1xuICAgICAgbm9kZSA9IG5ldyBOb2RlKCk7XG4gICAgICBzdHJpY3QgPSB0cnVlOyAvLyBhc3N1bWUgc3RyaWN0XG5cbiAgICAgIGJvZHkgPSBwYXJzZVNvdXJjZUVsZW1lbnRzKCk7XG4gICAgICByZXR1cm4gbm9kZS5maW5pc2hQcm9ncmFtKGJvZHkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZmlsdGVyVG9rZW5Mb2NhdGlvbigpIHtcbiAgICAgIHZhciBpLCBlbnRyeSwgdG9rZW4sIHRva2VucyA9IFtdO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgZXh0cmEudG9rZW5zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgZW50cnkgPSBleHRyYS50b2tlbnNbaV07XG4gICAgICAgICAgdG9rZW4gPSB7XG4gICAgICAgICAgICAgIHR5cGU6IGVudHJ5LnR5cGUsXG4gICAgICAgICAgICAgIHZhbHVlOiBlbnRyeS52YWx1ZVxuICAgICAgICAgIH07XG4gICAgICAgICAgaWYgKGVudHJ5LnJlZ2V4KSB7XG4gICAgICAgICAgICAgIHRva2VuLnJlZ2V4ID0ge1xuICAgICAgICAgICAgICAgICAgcGF0dGVybjogZW50cnkucmVnZXgucGF0dGVybixcbiAgICAgICAgICAgICAgICAgIGZsYWdzOiBlbnRyeS5yZWdleC5mbGFnc1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZXh0cmEucmFuZ2UpIHtcbiAgICAgICAgICAgICAgdG9rZW4ucmFuZ2UgPSBlbnRyeS5yYW5nZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGV4dHJhLmxvYykge1xuICAgICAgICAgICAgICB0b2tlbi5sb2MgPSBlbnRyeS5sb2M7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgIH1cblxuICAgICAgZXh0cmEudG9rZW5zID0gdG9rZW5zO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9rZW5pemUoY29kZSwgb3B0aW9ucykge1xuICAgICAgdmFyIHRvU3RyaW5nLFxuICAgICAgICAgIHRva2VucztcblxuICAgICAgdG9TdHJpbmcgPSBTdHJpbmc7XG4gICAgICBpZiAodHlwZW9mIGNvZGUgIT09ICdzdHJpbmcnICYmICEoY29kZSBpbnN0YW5jZW9mIFN0cmluZykpIHtcbiAgICAgICAgICBjb2RlID0gdG9TdHJpbmcoY29kZSk7XG4gICAgICB9XG5cbiAgICAgIHNvdXJjZSA9IGNvZGU7XG4gICAgICBpbmRleCA9IDA7XG4gICAgICBsaW5lTnVtYmVyID0gKHNvdXJjZS5sZW5ndGggPiAwKSA/IDEgOiAwO1xuICAgICAgbGluZVN0YXJ0ID0gMDtcbiAgICAgIGxlbmd0aCA9IHNvdXJjZS5sZW5ndGg7XG4gICAgICBsb29rYWhlYWQgPSBudWxsO1xuICAgICAgc3RhdGUgPSB7XG4gICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICBsYWJlbFNldDoge30sXG4gICAgICAgICAgaW5GdW5jdGlvbkJvZHk6IGZhbHNlLFxuICAgICAgICAgIGluSXRlcmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICBpblN3aXRjaDogZmFsc2UsXG4gICAgICAgICAgbGFzdENvbW1lbnRTdGFydDogLTFcbiAgICAgIH07XG5cbiAgICAgIGV4dHJhID0ge307XG5cbiAgICAgIC8vIE9wdGlvbnMgbWF0Y2hpbmcuXG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgLy8gT2YgY291cnNlIHdlIGNvbGxlY3QgdG9rZW5zIGhlcmUuXG4gICAgICBvcHRpb25zLnRva2VucyA9IHRydWU7XG4gICAgICBleHRyYS50b2tlbnMgPSBbXTtcbiAgICAgIGV4dHJhLnRva2VuaXplID0gdHJ1ZTtcbiAgICAgIC8vIFRoZSBmb2xsb3dpbmcgdHdvIGZpZWxkcyBhcmUgbmVjZXNzYXJ5IHRvIGNvbXB1dGUgdGhlIFJlZ2V4IHRva2Vucy5cbiAgICAgIGV4dHJhLm9wZW5QYXJlblRva2VuID0gLTE7XG4gICAgICBleHRyYS5vcGVuQ3VybHlUb2tlbiA9IC0xO1xuXG4gICAgICBleHRyYS5yYW5nZSA9ICh0eXBlb2Ygb3B0aW9ucy5yYW5nZSA9PT0gJ2Jvb2xlYW4nKSAmJiBvcHRpb25zLnJhbmdlO1xuICAgICAgZXh0cmEubG9jID0gKHR5cGVvZiBvcHRpb25zLmxvYyA9PT0gJ2Jvb2xlYW4nKSAmJiBvcHRpb25zLmxvYztcblxuICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRvbGVyYW50ID09PSAnYm9vbGVhbicgJiYgb3B0aW9ucy50b2xlcmFudCkge1xuICAgICAgICAgIGV4dHJhLmVycm9ycyA9IFtdO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICAgIHBlZWsoKTtcbiAgICAgICAgICBpZiAobG9va2FoZWFkLnR5cGUgPT09IFRva2VuLkVPRikge1xuICAgICAgICAgICAgICByZXR1cm4gZXh0cmEudG9rZW5zO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxleCgpO1xuICAgICAgICAgIHdoaWxlIChsb29rYWhlYWQudHlwZSAhPT0gVG9rZW4uRU9GKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAobGV4RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChleHRyYS5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICBleHRyYS5lcnJvcnMucHVzaChsZXhFcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gV2UgaGF2ZSB0byBicmVhayBvbiB0aGUgZmlyc3QgZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAvLyB0byBhdm9pZCBpbmZpbml0ZSBsb29wcy5cbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbGV4RXJyb3I7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmaWx0ZXJUb2tlbkxvY2F0aW9uKCk7XG4gICAgICAgICAgdG9rZW5zID0gZXh0cmEudG9rZW5zO1xuICAgICAgICAgIGlmICh0eXBlb2YgZXh0cmEuZXJyb3JzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICB0b2tlbnMuZXJyb3JzID0gZXh0cmEuZXJyb3JzO1xuICAgICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBleHRyYSA9IHt9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRva2VucztcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlKGNvZGUsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBwcm9ncmFtLCB0b1N0cmluZztcblxuICAgICAgdG9TdHJpbmcgPSBTdHJpbmc7XG4gICAgICBpZiAodHlwZW9mIGNvZGUgIT09ICdzdHJpbmcnICYmICEoY29kZSBpbnN0YW5jZW9mIFN0cmluZykpIHtcbiAgICAgICAgICBjb2RlID0gdG9TdHJpbmcoY29kZSk7XG4gICAgICB9XG5cbiAgICAgIHNvdXJjZSA9IGNvZGU7XG4gICAgICBpbmRleCA9IDA7XG4gICAgICBsaW5lTnVtYmVyID0gKHNvdXJjZS5sZW5ndGggPiAwKSA/IDEgOiAwO1xuICAgICAgbGluZVN0YXJ0ID0gMDtcbiAgICAgIGxlbmd0aCA9IHNvdXJjZS5sZW5ndGg7XG4gICAgICBsb29rYWhlYWQgPSBudWxsO1xuICAgICAgc3RhdGUgPSB7XG4gICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICBsYWJlbFNldDoge30sXG4gICAgICAgICAgcGFyZW50aGVzaXNDb3VudDogMCxcbiAgICAgICAgICBpbkZ1bmN0aW9uQm9keTogZmFsc2UsXG4gICAgICAgICAgaW5JdGVyYXRpb246IGZhbHNlLFxuICAgICAgICAgIGluU3dpdGNoOiBmYWxzZSxcbiAgICAgICAgICBsYXN0Q29tbWVudFN0YXJ0OiAtMVxuICAgICAgfTtcblxuICAgICAgZXh0cmEgPSB7fTtcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBleHRyYS5yYW5nZSA9ICh0eXBlb2Ygb3B0aW9ucy5yYW5nZSA9PT0gJ2Jvb2xlYW4nKSAmJiBvcHRpb25zLnJhbmdlO1xuICAgICAgICAgIGV4dHJhLmxvYyA9ICh0eXBlb2Ygb3B0aW9ucy5sb2MgPT09ICdib29sZWFuJykgJiYgb3B0aW9ucy5sb2M7XG5cbiAgICAgICAgICBpZiAoZXh0cmEubG9jICYmIG9wdGlvbnMuc291cmNlICE9PSBudWxsICYmIG9wdGlvbnMuc291cmNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgZXh0cmEuc291cmNlID0gdG9TdHJpbmcob3B0aW9ucy5zb3VyY2UpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50b2tlbnMgPT09ICdib29sZWFuJyAmJiBvcHRpb25zLnRva2Vucykge1xuICAgICAgICAgICAgICBleHRyYS50b2tlbnMgPSBbXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRvbGVyYW50ID09PSAnYm9vbGVhbicgJiYgb3B0aW9ucy50b2xlcmFudCkge1xuICAgICAgICAgICAgICBleHRyYS5lcnJvcnMgPSBbXTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgICAgcHJvZ3JhbSA9IHBhcnNlUHJvZ3JhbSgpO1xuICAgICAgICAgIGlmICh0eXBlb2YgZXh0cmEudG9rZW5zICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBmaWx0ZXJUb2tlbkxvY2F0aW9uKCk7XG4gICAgICAgICAgICAgIHByb2dyYW0udG9rZW5zID0gZXh0cmEudG9rZW5zO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZW9mIGV4dHJhLmVycm9ycyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgcHJvZ3JhbS5lcnJvcnMgPSBleHRyYS5lcnJvcnM7XG4gICAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHRocm93IGU7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGV4dHJhID0ge307XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcm9ncmFtO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0b2tlbml6ZTogdG9rZW5pemUsXG4gICAgcGFyc2U6IHBhcnNlXG4gIH07XG5cbn0pKCk7IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIGF4cyA9IHJlcXVpcmUoJy4uL3NjZW5lL2F4aXMnKSxcbiAgICBjb25maWcgPSByZXF1aXJlKCcuLi91dGlsL2NvbmZpZycpO1xuXG52YXIgT1JJRU5UID0ge1xuICBcInhcIjogICAgICBcImJvdHRvbVwiLFxuICBcInlcIjogICAgICBcImxlZnRcIixcbiAgXCJ0b3BcIjogICAgXCJ0b3BcIixcbiAgXCJib3R0b21cIjogXCJib3R0b21cIixcbiAgXCJsZWZ0XCI6ICAgXCJsZWZ0XCIsXG4gIFwicmlnaHRcIjogIFwicmlnaHRcIlxufTtcblxuZnVuY3Rpb24gYXhlcyhtb2RlbCwgc3BlYywgYXhlcywgZ3JvdXApIHtcbiAgKHNwZWMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oZGVmLCBpbmRleCkge1xuICAgIGF4ZXNbaW5kZXhdID0gYXhlc1tpbmRleF0gfHwgYXhzKG1vZGVsKTtcbiAgICBheGlzKGRlZiwgaW5kZXgsIGF4ZXNbaW5kZXhdLCBncm91cCk7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gYXhpcyhkZWYsIGluZGV4LCBheGlzLCBncm91cCkge1xuICAvLyBheGlzIHNjYWxlXG4gIGlmIChkZWYuc2NhbGUgIT09IHVuZGVmaW5lZCkge1xuICAgIGF4aXMuc2NhbGUoZ3JvdXAuc2NhbGUoZGVmLnNjYWxlKSk7XG4gIH1cblxuICAvLyBheGlzIG9yaWVudGF0aW9uXG4gIGF4aXMub3JpZW50KGRlZi5vcmllbnQgfHwgT1JJRU5UW2RlZi50eXBlXSk7XG4gIC8vIGF4aXMgb2Zmc2V0XG4gIGF4aXMub2Zmc2V0KGRlZi5vZmZzZXQgfHwgMCk7XG4gIC8vIGF4aXMgbGF5ZXJcbiAgYXhpcy5sYXllcihkZWYubGF5ZXIgfHwgXCJmcm9udFwiKTtcbiAgLy8gYXhpcyBncmlkIGxpbmVzXG4gIGF4aXMuZ3JpZChkZWYuZ3JpZCB8fCBmYWxzZSk7XG4gIC8vIGF4aXMgdGl0bGVcbiAgYXhpcy50aXRsZShkZWYudGl0bGUgfHwgbnVsbCk7XG4gIC8vIGF4aXMgdGl0bGUgb2Zmc2V0XG4gIGF4aXMudGl0bGVPZmZzZXQoZGVmLnRpdGxlT2Zmc2V0ICE9IG51bGxcbiAgICA/IGRlZi50aXRsZU9mZnNldCA6IGNvbmZpZy5heGlzLnRpdGxlT2Zmc2V0KTtcbiAgLy8gYXhpcyB2YWx1ZXNcbiAgYXhpcy50aWNrVmFsdWVzKGRlZi52YWx1ZXMgfHwgbnVsbCk7XG4gIC8vIGF4aXMgbGFiZWwgZm9ybWF0dGluZ1xuICBheGlzLnRpY2tGb3JtYXQoZGVmLmZvcm1hdCB8fCBudWxsKTtcbiAgLy8gYXhpcyB0aWNrIHN1YmRpdmlzaW9uXG4gIGF4aXMudGlja1N1YmRpdmlkZShkZWYuc3ViZGl2aWRlIHx8IDApO1xuICAvLyBheGlzIHRpY2sgcGFkZGluZ1xuICBheGlzLnRpY2tQYWRkaW5nKGRlZi50aWNrUGFkZGluZyB8fCBjb25maWcuYXhpcy5wYWRkaW5nKTtcblxuICAvLyBheGlzIHRpY2sgc2l6ZShzKVxuICB2YXIgc2l6ZSA9IFtdO1xuICBpZiAoZGVmLnRpY2tTaXplICE9PSB1bmRlZmluZWQpIHtcbiAgICBmb3IgKHZhciBpPTA7IGk8MzsgKytpKSBzaXplLnB1c2goZGVmLnRpY2tTaXplKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgdHMgPSBjb25maWcuYXhpcy50aWNrU2l6ZTtcbiAgICBzaXplID0gW3RzLCB0cywgdHNdO1xuICB9XG4gIGlmIChkZWYudGlja1NpemVNYWpvciAhPSBudWxsKSBzaXplWzBdID0gZGVmLnRpY2tTaXplTWFqb3I7XG4gIGlmIChkZWYudGlja1NpemVNaW5vciAhPSBudWxsKSBzaXplWzFdID0gZGVmLnRpY2tTaXplTWlub3I7XG4gIGlmIChkZWYudGlja1NpemVFbmQgICAhPSBudWxsKSBzaXplWzJdID0gZGVmLnRpY2tTaXplRW5kO1xuICBpZiAoc2l6ZS5sZW5ndGgpIHtcbiAgICBheGlzLnRpY2tTaXplLmFwcGx5KGF4aXMsIHNpemUpO1xuICB9XG5cbiAgLy8gdGljayBhcmd1bWVudHNcbiAgaWYgKGRlZi50aWNrcyAhPSBudWxsKSB7XG4gICAgdmFyIHRpY2tzID0gZGwuaXNBcnJheShkZWYudGlja3MpID8gZGVmLnRpY2tzIDogW2RlZi50aWNrc107XG4gICAgYXhpcy50aWNrcy5hcHBseShheGlzLCB0aWNrcyk7XG4gIH0gZWxzZSB7XG4gICAgYXhpcy50aWNrcyhjb25maWcuYXhpcy50aWNrcyk7XG4gIH1cblxuICAvLyBzdHlsZSBwcm9wZXJ0aWVzXG4gIHZhciBwID0gZGVmLnByb3BlcnRpZXM7XG4gIGlmIChwICYmIHAudGlja3MpIHtcbiAgICBheGlzLm1ham9yVGlja1Byb3BlcnRpZXMocC5tYWpvclRpY2tzXG4gICAgICA/IGRsLmV4dGVuZCh7fSwgcC50aWNrcywgcC5tYWpvclRpY2tzKSA6IHAudGlja3MpO1xuICAgIGF4aXMubWlub3JUaWNrUHJvcGVydGllcyhwLm1pbm9yVGlja3NcbiAgICAgID8gZGwuZXh0ZW5kKHt9LCBwLnRpY2tzLCBwLm1pbm9yVGlja3MpIDogcC50aWNrcyk7XG4gIH0gZWxzZSB7XG4gICAgYXhpcy5tYWpvclRpY2tQcm9wZXJ0aWVzKHAgJiYgcC5tYWpvclRpY2tzIHx8IHt9KTtcbiAgICBheGlzLm1pbm9yVGlja1Byb3BlcnRpZXMocCAmJiBwLm1pbm9yVGlja3MgfHwge30pO1xuICB9XG4gIGF4aXMudGlja0xhYmVsUHJvcGVydGllcyhwICYmIHAubGFiZWxzIHx8IHt9KTtcbiAgYXhpcy50aXRsZVByb3BlcnRpZXMocCAmJiBwLnRpdGxlIHx8IHt9KTtcbiAgYXhpcy5ncmlkTGluZVByb3BlcnRpZXMocCAmJiBwLmdyaWQgfHwge30pO1xuICBheGlzLmRvbWFpblByb3BlcnRpZXMocCAmJiBwLmF4aXMgfHwge30pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGF4ZXM7IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIGNvbmZpZyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uZmlnJyksXG4gICAgcGFyc2VUcmFuc2Zvcm1zID0gcmVxdWlyZSgnLi90cmFuc2Zvcm1zJyksXG4gICAgcGFyc2VNb2RpZnkgPSByZXF1aXJlKCcuL21vZGlmeScpO1xuXG52YXIgcGFyc2VEYXRhID0gZnVuY3Rpb24obW9kZWwsIHNwZWMsIGNhbGxiYWNrKSB7XG4gIHZhciBjb3VudCA9IDA7XG5cbiAgZnVuY3Rpb24gbG9hZGVkKGQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXJyb3IsIGRhdGEpIHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBkbC5lcnJvcihcIkxPQURJTkcgRkFJTEVEOiBcIiArIGQudXJsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1vZGVsLmRhdGEoZC5uYW1lKS52YWx1ZXMoZGwucmVhZChkYXRhLCBkLmZvcm1hdCkpO1xuICAgICAgfVxuICAgICAgaWYgKC0tY291bnQgPT09IDApIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gcHJvY2VzcyBlYWNoIGRhdGEgc2V0IGRlZmluaXRpb25cbiAgKHNwZWMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgIGlmIChkLnVybCkge1xuICAgICAgY291bnQgKz0gMTtcbiAgICAgIGRsLmxvYWQoZGwuZXh0ZW5kKHt1cmw6IGQudXJsfSwgY29uZmlnLmxvYWQpLCBsb2FkZWQoZCkpO1xuICAgIH1cbiAgICBwYXJzZURhdGEuZGF0YXNvdXJjZShtb2RlbCwgZCk7XG4gIH0pO1xuXG4gIGlmIChjb3VudCA9PT0gMCkgc2V0VGltZW91dChjYWxsYmFjaywgMSk7XG4gIHJldHVybiBzcGVjO1xufTtcblxucGFyc2VEYXRhLmRhdGFzb3VyY2UgPSBmdW5jdGlvbihtb2RlbCwgZCkge1xuICB2YXIgdHJhbnNmb3JtID0gKGQudHJhbnNmb3JtfHxbXSkubWFwKGZ1bmN0aW9uKHQpIHsgcmV0dXJuIHBhcnNlVHJhbnNmb3Jtcyhtb2RlbCwgdCkgfSksXG4gICAgICBtb2QgPSAoZC5tb2RpZnl8fFtdKS5tYXAoZnVuY3Rpb24obSkgeyByZXR1cm4gcGFyc2VNb2RpZnkobW9kZWwsIG0sIGQpIH0pLFxuICAgICAgZHMgPSBtb2RlbC5kYXRhKGQubmFtZSwgbW9kLmNvbmNhdCh0cmFuc2Zvcm0pKTtcblxuICBpZiAoZC52YWx1ZXMpIHtcbiAgICBkcy52YWx1ZXMoZGwucmVhZChkLnZhbHVlcywgZC5mb3JtYXQpKTtcbiAgfSBlbHNlIGlmIChkLnNvdXJjZSkge1xuICAgIGRzLnNvdXJjZShkLnNvdXJjZSlcbiAgICAgIC5yZXZpc2VzKGRzLnJldmlzZXMoKSkgLy8gSWYgbmV3IGRzIHJldmlzZXMsIHRoZW4gaXQncyBvcmlnaW4gbXVzdCByZXZpc2UgdG9vLlxuICAgICAgLmFkZExpc3RlbmVyKGRzKTsgIC8vIERlcml2ZWQgZHMgd2lsbCBiZSBwdWxzZWQgYnkgaXRzIHNyYyByYXRoZXIgdGhhbiB0aGUgbW9kZWwuXG4gICAgbW9kZWwucmVtb3ZlTGlzdGVuZXIoZHMucGlwZWxpbmUoKVswXSk7IFxuICB9XG5cbiAgcmV0dXJuIGRzOyAgICBcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcGFyc2VEYXRhOyIsIi8qXG4gKiBHZW5lcmF0ZWQgYnkgUEVHLmpzIDAuOC4wLlxuICpcbiAqIGh0dHA6Ly9wZWdqcy5tYWpkYS5jei9cbiAqL1xuXG5mdW5jdGlvbiBwZWckc3ViY2xhc3MoY2hpbGQsIHBhcmVudCkge1xuICBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH1cbiAgY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlO1xuICBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpO1xufVxuXG5mdW5jdGlvbiBTeW50YXhFcnJvcihtZXNzYWdlLCBleHBlY3RlZCwgZm91bmQsIG9mZnNldCwgbGluZSwgY29sdW1uKSB7XG4gIHRoaXMubWVzc2FnZSAgPSBtZXNzYWdlO1xuICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWQ7XG4gIHRoaXMuZm91bmQgICAgPSBmb3VuZDtcbiAgdGhpcy5vZmZzZXQgICA9IG9mZnNldDtcbiAgdGhpcy5saW5lICAgICA9IGxpbmU7XG4gIHRoaXMuY29sdW1uICAgPSBjb2x1bW47XG5cbiAgdGhpcy5uYW1lICAgICA9IFwiU3ludGF4RXJyb3JcIjtcbn1cblxucGVnJHN1YmNsYXNzKFN5bnRheEVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHBhcnNlKGlucHV0KSB7XG4gIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiB7fSxcblxuICAgICAgcGVnJEZBSUxFRCA9IHt9LFxuXG4gICAgICBwZWckc3RhcnRSdWxlRnVuY3Rpb25zID0geyBzdGFydDogcGVnJHBhcnNlc3RhcnQgfSxcbiAgICAgIHBlZyRzdGFydFJ1bGVGdW5jdGlvbiAgPSBwZWckcGFyc2VzdGFydCxcblxuICAgICAgcGVnJGMwID0gcGVnJEZBSUxFRCxcbiAgICAgIHBlZyRjMSA9IFwiLFwiLFxuICAgICAgcGVnJGMyID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiLFwiLCBkZXNjcmlwdGlvbjogXCJcXFwiLFxcXCJcIiB9LFxuICAgICAgcGVnJGMzID0gZnVuY3Rpb24obywgbSkgeyByZXR1cm4gW29dLmNvbmNhdChtKSB9LFxuICAgICAgcGVnJGM0ID0gZnVuY3Rpb24obykgeyByZXR1cm4gW29dIH0sXG4gICAgICBwZWckYzUgPSBcIltcIixcbiAgICAgIHBlZyRjNiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIltcIiwgZGVzY3JpcHRpb246IFwiXFxcIltcXFwiXCIgfSxcbiAgICAgIHBlZyRjNyA9IFwiXVwiLFxuICAgICAgcGVnJGM4ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiXVwiLCBkZXNjcmlwdGlvbjogXCJcXFwiXVxcXCJcIiB9LFxuICAgICAgcGVnJGM5ID0gXCI+XCIsXG4gICAgICBwZWckYzEwID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiPlwiLCBkZXNjcmlwdGlvbjogXCJcXFwiPlxcXCJcIiB9LFxuICAgICAgcGVnJGMxMSA9IGZ1bmN0aW9uKGYxLCBmMiwgbykgeyByZXR1cm4ge3N0YXJ0OiBmMSwgZW5kOiBmMiwgbWlkZGxlOiBvfX0sXG4gICAgICBwZWckYzEyID0gW10sXG4gICAgICBwZWckYzEzID0gZnVuY3Rpb24ocywgZikgeyByZXR1cm4gKHMuZmlsdGVycyA9IGYpLCBzIH0sXG4gICAgICBwZWckYzE0ID0gZnVuY3Rpb24ocykgeyByZXR1cm4gcyB9LFxuICAgICAgcGVnJGMxNSA9IG51bGwsXG4gICAgICBwZWckYzE2ID0gZnVuY3Rpb24odCwgZSkgeyByZXR1cm4geyBldmVudDogZSwgdGFyZ2V0OiB0IH0gfSxcbiAgICAgIHBlZyRjMTcgPSAvXls6YS16QS16MC05X1xcLV0vLFxuICAgICAgcGVnJGMxOCA9IHsgdHlwZTogXCJjbGFzc1wiLCB2YWx1ZTogXCJbOmEtekEtejAtOV9cXFxcLV1cIiwgZGVzY3JpcHRpb246IFwiWzphLXpBLXowLTlfXFxcXC1dXCIgfSxcbiAgICAgIHBlZyRjMTkgPSBmdW5jdGlvbihzKSB7IHJldHVybiB7IHNpZ25hbDogcy5qb2luKFwiXCIpIH19LFxuICAgICAgcGVnJGMyMCA9IFwiKFwiLFxuICAgICAgcGVnJGMyMSA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIihcIiwgZGVzY3JpcHRpb246IFwiXFxcIihcXFwiXCIgfSxcbiAgICAgIHBlZyRjMjIgPSBcIilcIixcbiAgICAgIHBlZyRjMjMgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCIpXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCIpXFxcIlwiIH0sXG4gICAgICBwZWckYzI0ID0gZnVuY3Rpb24obSkgeyByZXR1cm4geyBzdHJlYW06IG0gfX0sXG4gICAgICBwZWckYzI1ID0gXCIuXCIsXG4gICAgICBwZWckYzI2ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiLlwiLCBkZXNjcmlwdGlvbjogXCJcXFwiLlxcXCJcIiB9LFxuICAgICAgcGVnJGMyNyA9IFwiOlwiLFxuICAgICAgcGVnJGMyOCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIjpcIiwgZGVzY3JpcHRpb246IFwiXFxcIjpcXFwiXCIgfSxcbiAgICAgIHBlZyRjMjkgPSBmdW5jdGlvbihjKSB7IHJldHVybiB7IHR5cGU6J2NsYXNzJywgdmFsdWU6IGMgfSB9LFxuICAgICAgcGVnJGMzMCA9IFwiI1wiLFxuICAgICAgcGVnJGMzMSA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIiNcIiwgZGVzY3JpcHRpb246IFwiXFxcIiNcXFwiXCIgfSxcbiAgICAgIHBlZyRjMzIgPSBmdW5jdGlvbihpZCkgeyByZXR1cm4geyB0eXBlOidpZCcsIHZhbHVlOiBpZCB9IH0sXG4gICAgICBwZWckYzMzID0gXCJtb3VzZWRvd25cIixcbiAgICAgIHBlZyRjMzQgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJtb3VzZWRvd25cIiwgZGVzY3JpcHRpb246IFwiXFxcIm1vdXNlZG93blxcXCJcIiB9LFxuICAgICAgcGVnJGMzNSA9IFwibW91c2V1cFwiLFxuICAgICAgcGVnJGMzNiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIm1vdXNldXBcIiwgZGVzY3JpcHRpb246IFwiXFxcIm1vdXNldXBcXFwiXCIgfSxcbiAgICAgIHBlZyRjMzcgPSBcImNsaWNrXCIsXG4gICAgICBwZWckYzM4ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiY2xpY2tcIiwgZGVzY3JpcHRpb246IFwiXFxcImNsaWNrXFxcIlwiIH0sXG4gICAgICBwZWckYzM5ID0gXCJkYmxjbGlja1wiLFxuICAgICAgcGVnJGM0MCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcImRibGNsaWNrXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJkYmxjbGlja1xcXCJcIiB9LFxuICAgICAgcGVnJGM0MSA9IFwid2hlZWxcIixcbiAgICAgIHBlZyRjNDIgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJ3aGVlbFwiLCBkZXNjcmlwdGlvbjogXCJcXFwid2hlZWxcXFwiXCIgfSxcbiAgICAgIHBlZyRjNDMgPSBcImtleWRvd25cIixcbiAgICAgIHBlZyRjNDQgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJrZXlkb3duXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJrZXlkb3duXFxcIlwiIH0sXG4gICAgICBwZWckYzQ1ID0gXCJrZXlwcmVzc1wiLFxuICAgICAgcGVnJGM0NiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcImtleXByZXNzXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJrZXlwcmVzc1xcXCJcIiB9LFxuICAgICAgcGVnJGM0NyA9IFwia2V5dXBcIixcbiAgICAgIHBlZyRjNDggPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJrZXl1cFwiLCBkZXNjcmlwdGlvbjogXCJcXFwia2V5dXBcXFwiXCIgfSxcbiAgICAgIHBlZyRjNDkgPSBcIm1vdXNld2hlZWxcIixcbiAgICAgIHBlZyRjNTAgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJtb3VzZXdoZWVsXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJtb3VzZXdoZWVsXFxcIlwiIH0sXG4gICAgICBwZWckYzUxID0gXCJtb3VzZW1vdmVcIixcbiAgICAgIHBlZyRjNTIgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJtb3VzZW1vdmVcIiwgZGVzY3JpcHRpb246IFwiXFxcIm1vdXNlbW92ZVxcXCJcIiB9LFxuICAgICAgcGVnJGM1MyA9IFwibW91c2VvdXRcIixcbiAgICAgIHBlZyRjNTQgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJtb3VzZW91dFwiLCBkZXNjcmlwdGlvbjogXCJcXFwibW91c2VvdXRcXFwiXCIgfSxcbiAgICAgIHBlZyRjNTUgPSBcIm1vdXNlb3ZlclwiLFxuICAgICAgcGVnJGM1NiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIm1vdXNlb3ZlclwiLCBkZXNjcmlwdGlvbjogXCJcXFwibW91c2VvdmVyXFxcIlwiIH0sXG4gICAgICBwZWckYzU3ID0gXCJtb3VzZWVudGVyXCIsXG4gICAgICBwZWckYzU4ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwibW91c2VlbnRlclwiLCBkZXNjcmlwdGlvbjogXCJcXFwibW91c2VlbnRlclxcXCJcIiB9LFxuICAgICAgcGVnJGM1OSA9IFwidG91Y2hzdGFydFwiLFxuICAgICAgcGVnJGM2MCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcInRvdWNoc3RhcnRcIiwgZGVzY3JpcHRpb246IFwiXFxcInRvdWNoc3RhcnRcXFwiXCIgfSxcbiAgICAgIHBlZyRjNjEgPSBcInRvdWNobW92ZVwiLFxuICAgICAgcGVnJGM2MiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcInRvdWNobW92ZVwiLCBkZXNjcmlwdGlvbjogXCJcXFwidG91Y2htb3ZlXFxcIlwiIH0sXG4gICAgICBwZWckYzYzID0gXCJ0b3VjaGVuZFwiLFxuICAgICAgcGVnJGM2NCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcInRvdWNoZW5kXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJ0b3VjaGVuZFxcXCJcIiB9LFxuICAgICAgcGVnJGM2NSA9IGZ1bmN0aW9uKGZpZWxkKSB7IHJldHVybiBmaWVsZCAgfSxcbiAgICAgIHBlZyRjNjYgPSAvXlsnXCJhLXpBLVowLTlfLj48PSEgXFx0XFwtXS8sXG4gICAgICBwZWckYzY3ID0geyB0eXBlOiBcImNsYXNzXCIsIHZhbHVlOiBcIlsnXFxcImEtekEtWjAtOV8uPjw9ISBcXFxcdFxcXFwtXVwiLCBkZXNjcmlwdGlvbjogXCJbJ1xcXCJhLXpBLVowLTlfLj48PSEgXFxcXHRcXFxcLV1cIiB9LFxuICAgICAgcGVnJGM2OCA9IGZ1bmN0aW9uKHYpIHsgcmV0dXJuIHYuam9pbihcIlwiKSB9LFxuICAgICAgcGVnJGM2OSA9IC9eWyBcXHRcXHJcXG5dLyxcbiAgICAgIHBlZyRjNzAgPSB7IHR5cGU6IFwiY2xhc3NcIiwgdmFsdWU6IFwiWyBcXFxcdFxcXFxyXFxcXG5dXCIsIGRlc2NyaXB0aW9uOiBcIlsgXFxcXHRcXFxcclxcXFxuXVwiIH0sXG5cbiAgICAgIHBlZyRjdXJyUG9zICAgICAgICAgID0gMCxcbiAgICAgIHBlZyRyZXBvcnRlZFBvcyAgICAgID0gMCxcbiAgICAgIHBlZyRjYWNoZWRQb3MgICAgICAgID0gMCxcbiAgICAgIHBlZyRjYWNoZWRQb3NEZXRhaWxzID0geyBsaW5lOiAxLCBjb2x1bW46IDEsIHNlZW5DUjogZmFsc2UgfSxcbiAgICAgIHBlZyRtYXhGYWlsUG9zICAgICAgID0gMCxcbiAgICAgIHBlZyRtYXhGYWlsRXhwZWN0ZWQgID0gW10sXG4gICAgICBwZWckc2lsZW50RmFpbHMgICAgICA9IDAsXG5cbiAgICAgIHBlZyRyZXN1bHQ7XG5cbiAgaWYgKFwic3RhcnRSdWxlXCIgaW4gb3B0aW9ucykge1xuICAgIGlmICghKG9wdGlvbnMuc3RhcnRSdWxlIGluIHBlZyRzdGFydFJ1bGVGdW5jdGlvbnMpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBzdGFydCBwYXJzaW5nIGZyb20gcnVsZSBcXFwiXCIgKyBvcHRpb25zLnN0YXJ0UnVsZSArIFwiXFxcIi5cIik7XG4gICAgfVxuXG4gICAgcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uID0gcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uc1tvcHRpb25zLnN0YXJ0UnVsZV07XG4gIH1cblxuICBmdW5jdGlvbiB0ZXh0KCkge1xuICAgIHJldHVybiBpbnB1dC5zdWJzdHJpbmcocGVnJHJlcG9ydGVkUG9zLCBwZWckY3VyclBvcyk7XG4gIH1cblxuICBmdW5jdGlvbiBvZmZzZXQoKSB7XG4gICAgcmV0dXJuIHBlZyRyZXBvcnRlZFBvcztcbiAgfVxuXG4gIGZ1bmN0aW9uIGxpbmUoKSB7XG4gICAgcmV0dXJuIHBlZyRjb21wdXRlUG9zRGV0YWlscyhwZWckcmVwb3J0ZWRQb3MpLmxpbmU7XG4gIH1cblxuICBmdW5jdGlvbiBjb2x1bW4oKSB7XG4gICAgcmV0dXJuIHBlZyRjb21wdXRlUG9zRGV0YWlscyhwZWckcmVwb3J0ZWRQb3MpLmNvbHVtbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4cGVjdGVkKGRlc2NyaXB0aW9uKSB7XG4gICAgdGhyb3cgcGVnJGJ1aWxkRXhjZXB0aW9uKFxuICAgICAgbnVsbCxcbiAgICAgIFt7IHR5cGU6IFwib3RoZXJcIiwgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uIH1dLFxuICAgICAgcGVnJHJlcG9ydGVkUG9zXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICB0aHJvdyBwZWckYnVpbGRFeGNlcHRpb24obWVzc2FnZSwgbnVsbCwgcGVnJHJlcG9ydGVkUG9zKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRjb21wdXRlUG9zRGV0YWlscyhwb3MpIHtcbiAgICBmdW5jdGlvbiBhZHZhbmNlKGRldGFpbHMsIHN0YXJ0UG9zLCBlbmRQb3MpIHtcbiAgICAgIHZhciBwLCBjaDtcblxuICAgICAgZm9yIChwID0gc3RhcnRQb3M7IHAgPCBlbmRQb3M7IHArKykge1xuICAgICAgICBjaCA9IGlucHV0LmNoYXJBdChwKTtcbiAgICAgICAgaWYgKGNoID09PSBcIlxcblwiKSB7XG4gICAgICAgICAgaWYgKCFkZXRhaWxzLnNlZW5DUikgeyBkZXRhaWxzLmxpbmUrKzsgfVxuICAgICAgICAgIGRldGFpbHMuY29sdW1uID0gMTtcbiAgICAgICAgICBkZXRhaWxzLnNlZW5DUiA9IGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBcIlxcclwiIHx8IGNoID09PSBcIlxcdTIwMjhcIiB8fCBjaCA9PT0gXCJcXHUyMDI5XCIpIHtcbiAgICAgICAgICBkZXRhaWxzLmxpbmUrKztcbiAgICAgICAgICBkZXRhaWxzLmNvbHVtbiA9IDE7XG4gICAgICAgICAgZGV0YWlscy5zZWVuQ1IgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRldGFpbHMuY29sdW1uKys7XG4gICAgICAgICAgZGV0YWlscy5zZWVuQ1IgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwZWckY2FjaGVkUG9zICE9PSBwb3MpIHtcbiAgICAgIGlmIChwZWckY2FjaGVkUG9zID4gcG9zKSB7XG4gICAgICAgIHBlZyRjYWNoZWRQb3MgPSAwO1xuICAgICAgICBwZWckY2FjaGVkUG9zRGV0YWlscyA9IHsgbGluZTogMSwgY29sdW1uOiAxLCBzZWVuQ1I6IGZhbHNlIH07XG4gICAgICB9XG4gICAgICBhZHZhbmNlKHBlZyRjYWNoZWRQb3NEZXRhaWxzLCBwZWckY2FjaGVkUG9zLCBwb3MpO1xuICAgICAgcGVnJGNhY2hlZFBvcyA9IHBvcztcbiAgICB9XG5cbiAgICByZXR1cm4gcGVnJGNhY2hlZFBvc0RldGFpbHM7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckZmFpbChleHBlY3RlZCkge1xuICAgIGlmIChwZWckY3VyclBvcyA8IHBlZyRtYXhGYWlsUG9zKSB7IHJldHVybjsgfVxuXG4gICAgaWYgKHBlZyRjdXJyUG9zID4gcGVnJG1heEZhaWxQb3MpIHtcbiAgICAgIHBlZyRtYXhGYWlsUG9zID0gcGVnJGN1cnJQb3M7XG4gICAgICBwZWckbWF4RmFpbEV4cGVjdGVkID0gW107XG4gICAgfVxuXG4gICAgcGVnJG1heEZhaWxFeHBlY3RlZC5wdXNoKGV4cGVjdGVkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRidWlsZEV4Y2VwdGlvbihtZXNzYWdlLCBleHBlY3RlZCwgcG9zKSB7XG4gICAgZnVuY3Rpb24gY2xlYW51cEV4cGVjdGVkKGV4cGVjdGVkKSB7XG4gICAgICB2YXIgaSA9IDE7XG5cbiAgICAgIGV4cGVjdGVkLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICBpZiAoYS5kZXNjcmlwdGlvbiA8IGIuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH0gZWxzZSBpZiAoYS5kZXNjcmlwdGlvbiA+IGIuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHdoaWxlIChpIDwgZXhwZWN0ZWQubGVuZ3RoKSB7XG4gICAgICAgIGlmIChleHBlY3RlZFtpIC0gMV0gPT09IGV4cGVjdGVkW2ldKSB7XG4gICAgICAgICAgZXhwZWN0ZWQuc3BsaWNlKGksIDEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJ1aWxkTWVzc2FnZShleHBlY3RlZCwgZm91bmQpIHtcbiAgICAgIGZ1bmN0aW9uIHN0cmluZ0VzY2FwZShzKSB7XG4gICAgICAgIGZ1bmN0aW9uIGhleChjaCkgeyByZXR1cm4gY2guY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTsgfVxuXG4gICAgICAgIHJldHVybiBzXG4gICAgICAgICAgLnJlcGxhY2UoL1xcXFwvZywgICAnXFxcXFxcXFwnKVxuICAgICAgICAgIC5yZXBsYWNlKC9cIi9nLCAgICAnXFxcXFwiJylcbiAgICAgICAgICAucmVwbGFjZSgvXFx4MDgvZywgJ1xcXFxiJylcbiAgICAgICAgICAucmVwbGFjZSgvXFx0L2csICAgJ1xcXFx0JylcbiAgICAgICAgICAucmVwbGFjZSgvXFxuL2csICAgJ1xcXFxuJylcbiAgICAgICAgICAucmVwbGFjZSgvXFxmL2csICAgJ1xcXFxmJylcbiAgICAgICAgICAucmVwbGFjZSgvXFxyL2csICAgJ1xcXFxyJylcbiAgICAgICAgICAucmVwbGFjZSgvW1xceDAwLVxceDA3XFx4MEJcXHgwRVxceDBGXS9nLCBmdW5jdGlvbihjaCkgeyByZXR1cm4gJ1xcXFx4MCcgKyBoZXgoY2gpOyB9KVxuICAgICAgICAgIC5yZXBsYWNlKC9bXFx4MTAtXFx4MUZcXHg4MC1cXHhGRl0vZywgICAgZnVuY3Rpb24oY2gpIHsgcmV0dXJuICdcXFxceCcgICsgaGV4KGNoKTsgfSlcbiAgICAgICAgICAucmVwbGFjZSgvW1xcdTAxODAtXFx1MEZGRl0vZywgICAgICAgICBmdW5jdGlvbihjaCkgeyByZXR1cm4gJ1xcXFx1MCcgKyBoZXgoY2gpOyB9KVxuICAgICAgICAgIC5yZXBsYWNlKC9bXFx1MTA4MC1cXHVGRkZGXS9nLCAgICAgICAgIGZ1bmN0aW9uKGNoKSB7IHJldHVybiAnXFxcXHUnICArIGhleChjaCk7IH0pO1xuICAgICAgfVxuXG4gICAgICB2YXIgZXhwZWN0ZWREZXNjcyA9IG5ldyBBcnJheShleHBlY3RlZC5sZW5ndGgpLFxuICAgICAgICAgIGV4cGVjdGVkRGVzYywgZm91bmREZXNjLCBpO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgZXhwZWN0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZXhwZWN0ZWREZXNjc1tpXSA9IGV4cGVjdGVkW2ldLmRlc2NyaXB0aW9uO1xuICAgICAgfVxuXG4gICAgICBleHBlY3RlZERlc2MgPSBleHBlY3RlZC5sZW5ndGggPiAxXG4gICAgICAgID8gZXhwZWN0ZWREZXNjcy5zbGljZSgwLCAtMSkuam9pbihcIiwgXCIpXG4gICAgICAgICAgICArIFwiIG9yIFwiXG4gICAgICAgICAgICArIGV4cGVjdGVkRGVzY3NbZXhwZWN0ZWQubGVuZ3RoIC0gMV1cbiAgICAgICAgOiBleHBlY3RlZERlc2NzWzBdO1xuXG4gICAgICBmb3VuZERlc2MgPSBmb3VuZCA/IFwiXFxcIlwiICsgc3RyaW5nRXNjYXBlKGZvdW5kKSArIFwiXFxcIlwiIDogXCJlbmQgb2YgaW5wdXRcIjtcblxuICAgICAgcmV0dXJuIFwiRXhwZWN0ZWQgXCIgKyBleHBlY3RlZERlc2MgKyBcIiBidXQgXCIgKyBmb3VuZERlc2MgKyBcIiBmb3VuZC5cIjtcbiAgICB9XG5cbiAgICB2YXIgcG9zRGV0YWlscyA9IHBlZyRjb21wdXRlUG9zRGV0YWlscyhwb3MpLFxuICAgICAgICBmb3VuZCAgICAgID0gcG9zIDwgaW5wdXQubGVuZ3RoID8gaW5wdXQuY2hhckF0KHBvcykgOiBudWxsO1xuXG4gICAgaWYgKGV4cGVjdGVkICE9PSBudWxsKSB7XG4gICAgICBjbGVhbnVwRXhwZWN0ZWQoZXhwZWN0ZWQpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgU3ludGF4RXJyb3IoXG4gICAgICBtZXNzYWdlICE9PSBudWxsID8gbWVzc2FnZSA6IGJ1aWxkTWVzc2FnZShleHBlY3RlZCwgZm91bmQpLFxuICAgICAgZXhwZWN0ZWQsXG4gICAgICBmb3VuZCxcbiAgICAgIHBvcyxcbiAgICAgIHBvc0RldGFpbHMubGluZSxcbiAgICAgIHBvc0RldGFpbHMuY29sdW1uXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZXN0YXJ0KCkge1xuICAgIHZhciBzMDtcblxuICAgIHMwID0gcGVnJHBhcnNlbWVyZ2VkKCk7XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VtZXJnZWQoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczU7XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIHMxID0gcGVnJHBhcnNlb3JkZXJlZCgpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VzZXAoKTtcbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ0KSB7XG4gICAgICAgICAgczMgPSBwZWckYzE7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzIpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczQgPSBwZWckcGFyc2VzZXAoKTtcbiAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM1ID0gcGVnJHBhcnNlbWVyZ2VkKCk7XG4gICAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgICAgIHMxID0gcGVnJGMzKHMxLCBzNSk7XG4gICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJGMwO1xuICAgIH1cbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZW9yZGVyZWQoKTtcbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgczEgPSBwZWckYzQoczEpO1xuICAgICAgfVxuICAgICAgczAgPSBzMTtcbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VvcmRlcmVkKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNiwgczcsIHM4LCBzOSwgczEwLCBzMTEsIHMxMiwgczEzO1xuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDkxKSB7XG4gICAgICBzMSA9IHBlZyRjNTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2KTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gcGVnJHBhcnNlc2VwKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2VmaWx0ZXJlZCgpO1xuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNCA9IHBlZyRwYXJzZXNlcCgpO1xuICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0NCkge1xuICAgICAgICAgICAgICBzNSA9IHBlZyRjMTtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzIpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczYgPSBwZWckcGFyc2VzZXAoKTtcbiAgICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczcgPSBwZWckcGFyc2VmaWx0ZXJlZCgpO1xuICAgICAgICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgczggPSBwZWckcGFyc2VzZXAoKTtcbiAgICAgICAgICAgICAgICAgIGlmIChzOCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDkzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgczkgPSBwZWckYzc7XG4gICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBzOSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzgpOyB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHM5ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgczEwID0gcGVnJHBhcnNlc2VwKCk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHMxMCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA2Mikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzMTEgPSBwZWckYzk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzMTEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTApOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczExICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHMxMiA9IHBlZyRwYXJzZXNlcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczEyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczEzID0gcGVnJHBhcnNlb3JkZXJlZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMTMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczEgPSBwZWckYzExKHMzLCBzNywgczEzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRjMDtcbiAgICB9XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRwYXJzZWZpbHRlcmVkKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlZmlsdGVyZWQoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRwYXJzZXN0cmVhbSgpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBbXTtcbiAgICAgIHMzID0gcGVnJHBhcnNlZmlsdGVyKCk7XG4gICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgd2hpbGUgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczIucHVzaChzMyk7XG4gICAgICAgICAgczMgPSBwZWckcGFyc2VmaWx0ZXIoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczIgPSBwZWckYzA7XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgIHMxID0gcGVnJGMxMyhzMSwgczIpO1xuICAgICAgICBzMCA9IHMxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRjMDtcbiAgICB9XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgczEgPSBwZWckcGFyc2VzdHJlYW0oKTtcbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgczEgPSBwZWckYzE0KHMxKTtcbiAgICAgIH1cbiAgICAgIHMwID0gczE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlc3RyZWFtKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2VjbGFzcygpO1xuICAgIGlmIChzMSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczEgPSBwZWckcGFyc2VpZCgpO1xuICAgIH1cbiAgICBpZiAoczEgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMxID0gcGVnJGMxNTtcbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZWV2ZW50VHlwZSgpO1xuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICBzMSA9IHBlZyRjMTYoczEsIHMyKTtcbiAgICAgICAgczAgPSBzMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckYzA7XG4gICAgfVxuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIHMxID0gW107XG4gICAgICBpZiAocGVnJGMxNy50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgIHMyID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzE4KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHdoaWxlIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMxLnB1c2goczIpO1xuICAgICAgICAgIGlmIChwZWckYzE3LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgIHMyID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxOCk7IH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMxID0gcGVnJGMwO1xuICAgICAgfVxuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICBzMSA9IHBlZyRjMTkoczEpO1xuICAgICAgfVxuICAgICAgczAgPSBzMTtcbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQwKSB7XG4gICAgICAgICAgczEgPSBwZWckYzIwO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMyMSk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMiA9IHBlZyRwYXJzZW1lcmdlZCgpO1xuICAgICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0MSkge1xuICAgICAgICAgICAgICBzMyA9IHBlZyRjMjI7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMyMyk7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczEgPSBwZWckYzI0KHMyKTtcbiAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VjbGFzcygpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDYpIHtcbiAgICAgIHMxID0gcGVnJGMyNTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMyNik7IH1cbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZXZhbHVlKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA1OCkge1xuICAgICAgICAgIHMzID0gcGVnJGMyNztcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMjgpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgczEgPSBwZWckYzI5KHMyKTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckYzA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlaWQoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM1KSB7XG4gICAgICBzMSA9IHBlZyRjMzA7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMzEpOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2V2YWx1ZSgpO1xuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNTgpIHtcbiAgICAgICAgICBzMyA9IHBlZyRjMjc7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzI4KTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgIHMxID0gcGVnJGMzMihzMik7XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJGMwO1xuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZWV2ZW50VHlwZSgpIHtcbiAgICB2YXIgczA7XG5cbiAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA5KSA9PT0gcGVnJGMzMykge1xuICAgICAgczAgPSBwZWckYzMzO1xuICAgICAgcGVnJGN1cnJQb3MgKz0gOTtcbiAgICB9IGVsc2Uge1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzM0KTsgfVxuICAgIH1cbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDcpID09PSBwZWckYzM1KSB7XG4gICAgICAgIHMwID0gcGVnJGMzNTtcbiAgICAgICAgcGVnJGN1cnJQb3MgKz0gNztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzM2KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDUpID09PSBwZWckYzM3KSB7XG4gICAgICAgICAgczAgPSBwZWckYzM3O1xuICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMzOCk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA4KSA9PT0gcGVnJGMzOSkge1xuICAgICAgICAgICAgczAgPSBwZWckYzM5O1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gODtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQwKTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDUpID09PSBwZWckYzQxKSB7XG4gICAgICAgICAgICAgIHMwID0gcGVnJGM0MTtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gNTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQyKTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDcpID09PSBwZWckYzQzKSB7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckYzQzO1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDc7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM0NCk7IH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA4KSA9PT0gcGVnJGM0NSkge1xuICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzQ1O1xuICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gODtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQ2KTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDUpID09PSBwZWckYzQ3KSB7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJGM0NztcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gNTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQ4KTsgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDEwKSA9PT0gcGVnJGM0OSkge1xuICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJGM0OTtcbiAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSAxMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzUwKTsgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDkpID09PSBwZWckYzUxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjNTE7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSA5O1xuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTIpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgOCkgPT09IHBlZyRjNTMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzUzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSA4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTQpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgOSkgPT09IHBlZyRjNTUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjNTU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gOTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzU2KTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDEwKSA9PT0gcGVnJGM1Nykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzU3O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gMTA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM1OCk7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAxMCkgPT09IHBlZyRjNTkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzU5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSAxMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzYwKTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDkpID09PSBwZWckYzYxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzYxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2Mik7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA4KSA9PT0gcGVnJGM2Mykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzYzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gODtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzY0KTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZWZpbHRlcigpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOTEpIHtcbiAgICAgIHMxID0gcGVnJGM1O1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzYpOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2V2YWx1ZSgpO1xuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOTMpIHtcbiAgICAgICAgICBzMyA9IHBlZyRjNztcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOCk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICBzMSA9IHBlZyRjNjUoczIpO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRjMDtcbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2V2YWx1ZSgpIHtcbiAgICB2YXIgczAsIHMxLCBzMjtcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBbXTtcbiAgICBpZiAocGVnJGM2Ni50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICBzMiA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNjcpOyB9XG4gICAgfVxuICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgd2hpbGUgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMxLnB1c2goczIpO1xuICAgICAgICBpZiAocGVnJGM2Ni50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgczIgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2Nyk7IH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRjMDtcbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgIHMxID0gcGVnJGM2OChzMSk7XG4gICAgfVxuICAgIHMwID0gczE7XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VzZXAoKSB7XG4gICAgdmFyIHMwLCBzMTtcblxuICAgIHMwID0gW107XG4gICAgaWYgKHBlZyRjNjkudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgczEgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzcwKTsgfVxuICAgIH1cbiAgICB3aGlsZSAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwLnB1c2goczEpO1xuICAgICAgaWYgKHBlZyRjNjkudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICBzMSA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM3MCk7IH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBwZWckcmVzdWx0ID0gcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uKCk7XG5cbiAgaWYgKHBlZyRyZXN1bHQgIT09IHBlZyRGQUlMRUQgJiYgcGVnJGN1cnJQb3MgPT09IGlucHV0Lmxlbmd0aCkge1xuICAgIHJldHVybiBwZWckcmVzdWx0O1xuICB9IGVsc2Uge1xuICAgIGlmIChwZWckcmVzdWx0ICE9PSBwZWckRkFJTEVEICYmIHBlZyRjdXJyUG9zIDwgaW5wdXQubGVuZ3RoKSB7XG4gICAgICBwZWckZmFpbCh7IHR5cGU6IFwiZW5kXCIsIGRlc2NyaXB0aW9uOiBcImVuZCBvZiBpbnB1dFwiIH0pO1xuICAgIH1cblxuICAgIHRocm93IHBlZyRidWlsZEV4Y2VwdGlvbihudWxsLCBwZWckbWF4RmFpbEV4cGVjdGVkLCBwZWckbWF4RmFpbFBvcyk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIFN5bnRheEVycm9yOiBTeW50YXhFcnJvcixcbiAgcGFyc2U6ICAgICAgIHBhcnNlXG59OyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBleHByZXNzaW9uID0gcmVxdWlyZSgnLi4vZXhwcmVzc2lvbicpO1xuXG52YXIgZXhwciA9IChmdW5jdGlvbigpIHtcbiAgdmFyIHBhcnNlID0gZXhwcmVzc2lvbi5wYXJzZTtcbiAgdmFyIGNvZGVnZW4gPSBleHByZXNzaW9uLmNvZGUoe1xuICAgIGlkV2hpdGVMaXN0OiBbJ2QnLCAnZScsICdpJywgJ3AnLCAnc2cnXVxuICB9KTtcblxuICByZXR1cm4gZnVuY3Rpb24oZXhwcikgeyAgICBcbiAgICB2YXIgdmFsdWUgPSBjb2RlZ2VuKHBhcnNlKGV4cHIpKTtcbiAgICB2YWx1ZS5mbiA9IEZ1bmN0aW9uKCdkJywgJ2UnLCAnaScsICdwJywgJ3NnJyxcbiAgICAgICdcInVzZSBzdHJpY3RcIjsgcmV0dXJuICgnICsgdmFsdWUuZm4gKyAnKTsnKTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG59KSgpO1xuXG5leHByLmV2YWwgPSBmdW5jdGlvbihncmFwaCwgZm4sIGQsIGUsIGksIHAsIHNnKSB7XG4gIHNnID0gZ3JhcGguc2lnbmFsVmFsdWVzKGRsLmFycmF5KHNnKSk7XG4gIHJldHVybiBmbi5jYWxsKG51bGwsIGQsIGUsIGksIHAsIHNnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwcjsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgY29uZmlnID0gcmVxdWlyZSgnLi4vdXRpbC9jb25maWcnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZUludGVyYWN0b3JzKG1vZGVsLCBzcGVjLCBkZWZGYWN0b3J5KSB7XG4gIHZhciBjb3VudCA9IDAsXG4gICAgICBzZyA9IHt9LCBwZCA9IHt9LCBtayA9IHt9LFxuICAgICAgc2lnbmFscyA9IFtdLCBwcmVkaWNhdGVzID0gW107XG5cbiAgZnVuY3Rpb24gbG9hZGVkKGkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXJyb3IsIGRhdGEpIHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBkbC5lcnJvcihcIkxPQURJTkcgRkFJTEVEOiBcIiArIGkudXJsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBkZWYgPSBkbC5pc09iamVjdChkYXRhKSA/IGRhdGEgOiBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICBpbnRlcmFjdG9yKGkubmFtZSwgZGVmKTtcbiAgICAgIH1cbiAgICAgIGlmICgtLWNvdW50ID09IDApIGluamVjdCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGludGVyYWN0b3IobmFtZSwgZGVmKSB7XG4gICAgc2cgPSB7fSwgcGQgPSB7fTtcbiAgICBpZiAoZGVmLnNpZ25hbHMpICAgIHNpZ25hbHMucHVzaC5hcHBseShzaWduYWxzLCBuc1NpZ25hbHMobmFtZSwgZGVmLnNpZ25hbHMpKTtcbiAgICBpZiAoZGVmLnByZWRpY2F0ZXMpIHByZWRpY2F0ZXMucHVzaC5hcHBseShwcmVkaWNhdGVzLCBuc1ByZWRpY2F0ZXMobmFtZSwgZGVmLnByZWRpY2F0ZXMpKTtcbiAgICBuc01hcmtzKG5hbWUsIGRlZi5tYXJrcyk7XG4gIH1cblxuICBmdW5jdGlvbiBpbmplY3QoKSB7XG4gICAgaWYgKGRsLmtleXMobWspLmxlbmd0aCA+IDApIGluamVjdE1hcmtzKHNwZWMubWFya3MpO1xuICAgIHNwZWMuc2lnbmFscyA9IGRsLmFycmF5KHNwZWMuc2lnbmFscyk7XG4gICAgc3BlYy5wcmVkaWNhdGVzID0gZGwuYXJyYXkoc3BlYy5wcmVkaWNhdGVzKTtcbiAgICBzcGVjLnNpZ25hbHMudW5zaGlmdC5hcHBseShzcGVjLnNpZ25hbHMsIHNpZ25hbHMpO1xuICAgIHNwZWMucHJlZGljYXRlcy51bnNoaWZ0LmFwcGx5KHNwZWMucHJlZGljYXRlcywgcHJlZGljYXRlcyk7XG4gICAgZGVmRmFjdG9yeSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5qZWN0TWFya3MobWFya3MpIHtcbiAgICB2YXIgbSwgciwgaSwgbGVuO1xuICAgIG1hcmtzID0gZGwuYXJyYXkobWFya3MpO1xuXG4gICAgZm9yKGkgPSAwLCBsZW4gPSBtYXJrcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgbSA9IG1hcmtzW2ldO1xuICAgICAgaWYgKHIgPSBta1ttLnR5cGVdKSB7XG4gICAgICAgIG1hcmtzW2ldID0gZGwuZHVwbGljYXRlKHIpO1xuICAgICAgICBpZiAobS5mcm9tKSBtYXJrc1tpXS5mcm9tID0gbS5mcm9tO1xuICAgICAgICBpZiAobS5wcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgW0MuRU5URVIsIEMuVVBEQVRFLCBDLkVYSVRdLmZvckVhY2goZnVuY3Rpb24ocCkge1xuICAgICAgICAgICAgbWFya3NbaV0ucHJvcGVydGllc1twXSA9IGRsLmV4dGVuZChyLnByb3BlcnRpZXNbcF0sIG0ucHJvcGVydGllc1twXSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobS5tYXJrcykgeyAgLy8gVE9ETyBob3cgdG8gb3ZlcnJpZGUgcHJvcGVydGllcyBvZiBuZXN0ZWQgbWFya3M/XG4gICAgICAgIGluamVjdE1hcmtzKG0ubWFya3MpO1xuICAgICAgfVxuICAgIH0gICAgXG4gIH1cblxuICBmdW5jdGlvbiBucyhuLCBzKSB7IFxuICAgIGlmIChkbC5pc1N0cmluZyhzKSkge1xuICAgICAgcmV0dXJuIHMgKyBcIl9cIiArIG47XG4gICAgfSBlbHNlIHtcbiAgICAgIGRsLmtleXMocykuZm9yRWFjaChmdW5jdGlvbih4KSB7IFxuICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKCdcXFxcYicreCsnXFxcXGInLCBcImdcIik7XG4gICAgICAgIG4gPSBuLnJlcGxhY2UocmVnZXgsIHNbeF0pIFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbjtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBuc1NpZ25hbHMobmFtZSwgc2lnbmFscykge1xuICAgIHNpZ25hbHMgPSBkbC5hcnJheShzaWduYWxzKTtcbiAgICAvLyBUd28gcGFzc2VzIHRvIG5zIGFsbCBzaWduYWxzLCBhbmQgdGhlbiBvdmVyd3JpdGUgdGhlaXIgZGVmaW5pdGlvbnNcbiAgICAvLyBpbiBjYXNlIHNpZ25hbCBvcmRlciBpcyBpbXBvcnRhbnQuXG4gICAgc2lnbmFscy5mb3JFYWNoKGZ1bmN0aW9uKHMpIHsgcy5uYW1lID0gc2dbcy5uYW1lXSA9IG5zKHMubmFtZSwgbmFtZSk7IH0pO1xuICAgIHNpZ25hbHMuZm9yRWFjaChmdW5jdGlvbihzKSB7XG4gICAgICAocy5zdHJlYW1zIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgdC50eXBlID0gbnModC50eXBlLCBzZyk7XG4gICAgICAgIHQuZXhwciA9IG5zKHQuZXhwciwgc2cpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNpZ25hbHM7XG4gIH1cblxuICBmdW5jdGlvbiBuc1ByZWRpY2F0ZXMobmFtZSwgcHJlZGljYXRlcykge1xuICAgIHByZWRpY2F0ZXMgPSBkbC5hcnJheShwcmVkaWNhdGVzKTtcbiAgICBwcmVkaWNhdGVzLmZvckVhY2goZnVuY3Rpb24ocCkge1xuICAgICAgcC5uYW1lID0gcGRbcC5uYW1lXSA9IG5zKHAubmFtZSwgbmFtZSk7XG5cbiAgICAgIFtwLm9wZXJhbmRzLCBwLnJhbmdlXS5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgKHggfHwgW10pLmZvckVhY2goZnVuY3Rpb24obykge1xuICAgICAgICAgIGlmIChvLnNpZ25hbCkgby5zaWduYWwgPSBucyhvLnNpZ25hbCwgc2cpO1xuICAgICAgICAgIGVsc2UgaWYgKG8ucHJlZGljYXRlKSBuc09wZXJhbmQobyk7XG4gICAgICAgIH0pXG4gICAgICB9KTtcblxuICAgIH0pOyAgXG4gICAgcmV0dXJuIHByZWRpY2F0ZXM7IFxuICB9XG5cbiAgZnVuY3Rpb24gbnNPcGVyYW5kKG8pIHtcbiAgICBvLnByZWRpY2F0ZSA9IHBkW28ucHJlZGljYXRlXTtcbiAgICBkbC5rZXlzKG8uaW5wdXQpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgdmFyIGkgPSBvLmlucHV0W2tdO1xuICAgICAgaWYgKGkuc2lnbmFsKSBpLnNpZ25hbCA9IG5zKGkuc2lnbmFsLCBzZyk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBuc01hcmtzKG5hbWUsIG1hcmtzKSB7XG4gICAgKG1hcmtzIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKG0pIHsgXG4gICAgICBuc1Byb3BlcnRpZXMobS5wcm9wZXJ0aWVzLmVudGVyKTtcbiAgICAgIG5zUHJvcGVydGllcyhtLnByb3BlcnRpZXMudXBkYXRlKTtcbiAgICAgIG5zUHJvcGVydGllcyhtLnByb3BlcnRpZXMuZXhpdCk7XG4gICAgICBta1tucyhtLm5hbWUsIG5hbWUpXSA9IG07IFxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gbnNQcm9wZXJ0aWVzKHByb3BzZXQpIHtcbiAgICBkbC5rZXlzKHByb3BzZXQpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgdmFyIHAgPSBwcm9wc2V0W2tdO1xuICAgICAgaWYgKHAuc2lnbmFsKSBwLnNpZ25hbCA9IG5zKHAuc2lnbmFsLCBzZyk7XG4gICAgICBlbHNlIGlmIChwLnJ1bGUpIHtcbiAgICAgICAgcC5ydWxlLmZvckVhY2goZnVuY3Rpb24ocikgeyBcbiAgICAgICAgICBpZiAoci5zaWduYWwpIHIuc2lnbmFsID0gbnMoci5zaWduYWwsIHNnKTtcbiAgICAgICAgICBpZiAoci5wcmVkaWNhdGUpIG5zT3BlcmFuZChyKTsgXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgKHNwZWMuaW50ZXJhY3RvcnMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oaSkge1xuICAgIGlmIChpLnVybCkge1xuICAgICAgY291bnQgKz0gMTtcbiAgICAgIGRsLmxvYWQoZGwuZXh0ZW5kKHt1cmw6IGkudXJsfSwgY29uZmlnLmxvYWQpLCBsb2FkZWQoaSkpO1xuICAgIH1cbiAgfSk7XG5cbiAgaWYgKGNvdW50ID09PSAwKSBzZXRUaW1lb3V0KGluamVjdCwgMSk7XG4gIHJldHVybiBzcGVjO1xufSIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBwYXJzZVByb3BlcnRpZXMgPSByZXF1aXJlKCcuL3Byb3BlcnRpZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZU1hcmsobW9kZWwsIG1hcmspIHtcbiAgdmFyIHByb3BzID0gbWFyay5wcm9wZXJ0aWVzLFxuICAgICAgZ3JvdXAgPSBtYXJrLm1hcmtzO1xuXG4gIC8vIHBhcnNlIG1hcmsgcHJvcGVydHkgZGVmaW5pdGlvbnNcbiAgZGwua2V5cyhwcm9wcykuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgcHJvcHNba10gPSBwYXJzZVByb3BlcnRpZXMobW9kZWwsIG1hcmsudHlwZSwgcHJvcHNba10pO1xuICB9KTtcblxuICAvLyBwYXJzZSBkZWxheSBmdW5jdGlvblxuICBpZiAobWFyay5kZWxheSkge1xuICAgIG1hcmsuZGVsYXkgPSBwYXJzZVByb3BlcnRpZXMobW9kZWwsIG1hcmsudHlwZSwge2RlbGF5OiBtYXJrLmRlbGF5fSk7XG4gIH1cblxuICAvLyByZWN1cnNlIGlmIGdyb3VwIHR5cGVcbiAgaWYgKGdyb3VwKSB7XG4gICAgbWFyay5tYXJrcyA9IGdyb3VwLm1hcChmdW5jdGlvbihnKSB7IHJldHVybiBwYXJzZU1hcmsobW9kZWwsIGcpOyB9KTtcbiAgfVxuICAgIFxuICByZXR1cm4gbWFyaztcbn07IiwidmFyIHBhcnNlTWFyayA9IHJlcXVpcmUoJy4vbWFyaycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1vZGVsLCBzcGVjLCB3aWR0aCwgaGVpZ2h0KSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJncm91cFwiLFxuICAgIHdpZHRoOiB3aWR0aCxcbiAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICBzY2FsZXM6IHNwZWMuc2NhbGVzIHx8IFtdLFxuICAgIGF4ZXM6IHNwZWMuYXhlcyB8fCBbXSxcbiAgICAvLyBsZWdlbmRzOiBzcGVjLmxlZ2VuZHMgfHwgW10sXG4gICAgbWFya3M6IChzcGVjLm1hcmtzIHx8IFtdKS5tYXAoZnVuY3Rpb24obSkgeyByZXR1cm4gcGFyc2VNYXJrKG1vZGVsLCBtKTsgfSlcbiAgfTtcbn07IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIE5vZGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Ob2RlJyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG52YXIgZmlsdGVyID0gZnVuY3Rpb24oZmllbGQsIHZhbHVlLCBzcmMsIGRlc3QpIHtcbiAgZm9yKHZhciBpID0gc3JjLmxlbmd0aC0xOyBpID49IDA7IC0taSkge1xuICAgIGlmKHNyY1tpXVtmaWVsZF0gPT0gdmFsdWUpXG4gICAgICBkZXN0LnB1c2guYXBwbHkoZGVzdCwgc3JjLnNwbGljZShpLCAxKSk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyc2VNb2RpZnkobW9kZWwsIGRlZiwgZHMpIHtcbiAgdmFyIGdyYXBoID0gbW9kZWwuZ3JhcGgsXG4gICAgICBzaWduYWwgPSBkZWYuc2lnbmFsID8gZGwuZmllbGQoZGVmLnNpZ25hbCkgOiBudWxsLCBcbiAgICAgIHNpZ25hbE5hbWUgPSBzaWduYWwgPyBzaWduYWxbMF0gOiBudWxsLFxuICAgICAgcHJlZGljYXRlID0gZGVmLnByZWRpY2F0ZSA/IG1vZGVsLnByZWRpY2F0ZShkZWYucHJlZGljYXRlKSA6IG51bGwsXG4gICAgICByZWV2YWwgPSAocHJlZGljYXRlID09PSBudWxsKSxcbiAgICAgIG5vZGUgPSBuZXcgTm9kZShncmFwaCk7XG5cbiAgbm9kZS5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgaWYocHJlZGljYXRlICE9PSBudWxsKSB7XG4gICAgICB2YXIgZGIgPSB7fTtcbiAgICAgIChwcmVkaWNhdGUuZGF0YXx8W10pLmZvckVhY2goZnVuY3Rpb24oZCkgeyBkYltkXSA9IG1vZGVsLmRhdGEoZCkudmFsdWVzKCk7IH0pO1xuXG4gICAgICAvLyBUT0RPOiBpbnB1dFxuICAgICAgcmVldmFsID0gcHJlZGljYXRlKHt9LCBkYiwgZ3JhcGguc2lnbmFsVmFsdWVzKHByZWRpY2F0ZS5zaWduYWxzfHxbXSksIG1vZGVsLl9wcmVkaWNhdGVzKTtcbiAgICB9XG5cbiAgICBkZWJ1ZyhpbnB1dCwgW2RlZi50eXBlK1wiaW5nXCIsIHJlZXZhbF0pO1xuICAgIGlmKCFyZWV2YWwpIHJldHVybiBpbnB1dDtcblxuICAgIHZhciBkYXR1bSA9IHt9LCBcbiAgICAgICAgdmFsdWUgPSBzaWduYWwgPyBncmFwaC5zaWduYWxSZWYoZGVmLnNpZ25hbCkgOiBudWxsLFxuICAgICAgICBkID0gbW9kZWwuZGF0YShkcy5uYW1lKSxcbiAgICAgICAgcHJldiA9IGQucmV2aXNlcygpID8gbnVsbCA6IHVuZGVmaW5lZCxcbiAgICAgICAgdCA9IG51bGw7XG5cbiAgICBkYXR1bVtkZWYuZmllbGRdID0gdmFsdWU7XG5cbiAgICAvLyBXZSBoYXZlIHRvIG1vZGlmeSBkcy5fZGF0YSBzbyB0aGF0IHN1YnNlcXVlbnQgcHVsc2VzIGNvbnRhaW5cbiAgICAvLyBvdXIgZHluYW1pYyBkYXRhLiBXL28gbW9kaWZ5aW5nIGRzLl9kYXRhLCBvbmx5IHRoZSBvdXRwdXRcbiAgICAvLyBjb2xsZWN0b3Igd2lsbCBjb250YWluIGR5bmFtaWMgdHVwbGVzLiBcbiAgICBpZihkZWYudHlwZSA9PSBDLkFERCkge1xuICAgICAgdCA9IHR1cGxlLmluZ2VzdChkYXR1bSwgcHJldik7XG4gICAgICBpbnB1dC5hZGQucHVzaCh0KTtcbiAgICAgIGQuX2RhdGEucHVzaCh0KTtcbiAgICB9IGVsc2UgaWYoZGVmLnR5cGUgPT0gQy5SRU1PVkUpIHtcbiAgICAgIGZpbHRlcihkZWYuZmllbGQsIHZhbHVlLCBpbnB1dC5hZGQsIGlucHV0LnJlbSk7XG4gICAgICBmaWx0ZXIoZGVmLmZpZWxkLCB2YWx1ZSwgaW5wdXQubW9kLCBpbnB1dC5yZW0pO1xuICAgICAgZC5fZGF0YSA9IGQuX2RhdGEuZmlsdGVyKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHhbZGVmLmZpZWxkXSAhPT0gdmFsdWUgfSk7XG4gICAgfSBlbHNlIGlmKGRlZi50eXBlID09IEMuVE9HR0xFKSB7XG4gICAgICB2YXIgYWRkID0gW10sIHJlbSA9IFtdO1xuICAgICAgZmlsdGVyKGRlZi5maWVsZCwgdmFsdWUsIGlucHV0LnJlbSwgYWRkKTtcbiAgICAgIGZpbHRlcihkZWYuZmllbGQsIHZhbHVlLCBpbnB1dC5hZGQsIHJlbSk7XG4gICAgICBmaWx0ZXIoZGVmLmZpZWxkLCB2YWx1ZSwgaW5wdXQubW9kLCByZW0pO1xuICAgICAgaWYoYWRkLmxlbmd0aCA9PSAwICYmIHJlbS5sZW5ndGggPT0gMCkgYWRkLnB1c2godHVwbGUuaW5nZXN0KGRhdHVtKSk7XG5cbiAgICAgIGlucHV0LmFkZC5wdXNoLmFwcGx5KGlucHV0LmFkZCwgYWRkKTtcbiAgICAgIGQuX2RhdGEucHVzaC5hcHBseShkLl9kYXRhLCBhZGQpO1xuICAgICAgaW5wdXQucmVtLnB1c2guYXBwbHkoaW5wdXQucmVtLCByZW0pO1xuICAgICAgZC5fZGF0YSA9IGQuX2RhdGEuZmlsdGVyKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHJlbS5pbmRleE9mKHgpID09PSAtMSB9KTtcbiAgICB9IGVsc2UgaWYoZGVmLnR5cGUgPT0gQy5DTEVBUikge1xuICAgICAgaW5wdXQucmVtLnB1c2guYXBwbHkoaW5wdXQucmVtLCBpbnB1dC5hZGQpO1xuICAgICAgaW5wdXQucmVtLnB1c2guYXBwbHkoaW5wdXQucmVtLCBpbnB1dC5tb2QpO1xuICAgICAgaW5wdXQuYWRkID0gW107XG4gICAgICBpbnB1dC5tb2QgPSBbXTtcbiAgICAgIGQuX2RhdGEgID0gW107XG4gICAgfSBcblxuICAgIGlucHV0LmZpZWxkc1tkZWYuZmllbGRdID0gMTtcbiAgICByZXR1cm4gaW5wdXQ7XG4gIH07XG5cbiAgaWYoc2lnbmFsTmFtZSkgbm9kZS5kZXBlbmRlbmN5KEMuU0lHTkFMUywgc2lnbmFsTmFtZSk7XG4gIGlmKHByZWRpY2F0ZSkgIG5vZGUuZGVwZW5kZW5jeShDLlNJR05BTFMsIHByZWRpY2F0ZS5zaWduYWxzKTtcbiAgXG4gIHJldHVybiBub2RlO1xufSIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZVBhZGRpbmcocGFkKSB7XG4gIGlmIChwYWQgPT0gbnVsbCkgcmV0dXJuIFwiYXV0b1wiO1xuICBlbHNlIGlmIChkbC5pc1N0cmluZyhwYWQpKSByZXR1cm4gcGFkPT09XCJzdHJpY3RcIiA/IFwic3RyaWN0XCIgOiBcImF1dG9cIjtcbiAgZWxzZSBpZiAoZGwuaXNPYmplY3QocGFkKSkgcmV0dXJuIHBhZDtcbiAgdmFyIHAgPSBkbC5pc051bWJlcihwYWQpID8gcGFkIDogMjA7XG4gIHJldHVybiB7dG9wOnAsIGxlZnQ6cCwgcmlnaHQ6cCwgYm90dG9tOnB9O1xufSIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZVByZWRpY2F0ZShtb2RlbCwgc3BlYykge1xuICB2YXIgdHlwZXMgPSB7XG4gICAgJz0nOiAgcGFyc2VDb21wYXJhdG9yLFxuICAgICc9PSc6IHBhcnNlQ29tcGFyYXRvcixcbiAgICAnIT0nOiBwYXJzZUNvbXBhcmF0b3IsXG4gICAgJz4nOiAgcGFyc2VDb21wYXJhdG9yLFxuICAgICc+PSc6IHBhcnNlQ29tcGFyYXRvcixcbiAgICAnPCc6ICBwYXJzZUNvbXBhcmF0b3IsXG4gICAgJzw9JzogcGFyc2VDb21wYXJhdG9yLFxuICAgICdhbmQnOiBwYXJzZUxvZ2ljYWwsXG4gICAgJyYmJzogIHBhcnNlTG9naWNhbCxcbiAgICAnb3InOiAgcGFyc2VMb2dpY2FsLFxuICAgICd8fCc6ICBwYXJzZUxvZ2ljYWwsXG4gICAgJ2luJzogcGFyc2VJblxuICB9O1xuXG4gIGZ1bmN0aW9uIHBhcnNlU2lnbmFsKHNpZ25hbCwgc2lnbmFscykge1xuICAgIHZhciBzID0gZGwuZmllbGQoc2lnbmFsKSxcbiAgICAgICAgY29kZSA9IFwic2lnbmFsc1tcIitzLm1hcChkbC5zdHIpLmpvaW4oXCJdW1wiKStcIl1cIjtcbiAgICBzaWduYWxzW3Muc2hpZnQoKV0gPSAxO1xuICAgIHJldHVybiBjb2RlO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHBhcnNlT3BlcmFuZHMob3BlcmFuZHMpIHtcbiAgICB2YXIgZGVjbCA9IFtdLCBkZWZzID0gW10sXG4gICAgICAgIHNpZ25hbHMgPSB7fSwgZGIgPSB7fTtcblxuICAgIGRsLmFycmF5KG9wZXJhbmRzKS5mb3JFYWNoKGZ1bmN0aW9uKG8sIGkpIHtcbiAgICAgIHZhciBzaWduYWwsIG5hbWUgPSBcIm9cIitpLCBkZWYgPSBcIlwiO1xuICAgICAgXG4gICAgICBpZihvLnZhbHVlICE9PSB1bmRlZmluZWQpIGRlZiA9IGRsLnN0cihvLnZhbHVlKTtcbiAgICAgIGVsc2UgaWYoby5hcmcpICAgIGRlZiA9IFwiYXJnc1tcIitkbC5zdHIoby5hcmcpK1wiXVwiO1xuICAgICAgZWxzZSBpZihvLnNpZ25hbCkgZGVmID0gcGFyc2VTaWduYWwoby5zaWduYWwsIHNpZ25hbHMpO1xuICAgICAgZWxzZSBpZihvLnByZWRpY2F0ZSkge1xuICAgICAgICB2YXIgcHJlZCA9IG1vZGVsLnByZWRpY2F0ZShvLnByZWRpY2F0ZSk7XG4gICAgICAgIHByZWQuc2lnbmFscy5mb3JFYWNoKGZ1bmN0aW9uKHMpIHsgc2lnbmFsc1tzXSA9IDE7IH0pO1xuICAgICAgICBwcmVkLmRhdGEuZm9yRWFjaChmdW5jdGlvbihkKSB7IGRiW2RdID0gMSB9KTtcblxuICAgICAgICBkbC5rZXlzKG8uaW5wdXQpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgICAgIHZhciBpID0gby5pbnB1dFtrXSwgc2lnbmFsO1xuICAgICAgICAgIGRlZiArPSBcImFyZ3NbXCIrZGwuc3RyKGspK1wiXSA9IFwiO1xuICAgICAgICAgIGlmKGkuc2lnbmFsKSAgIGRlZiArPSBwYXJzZVNpZ25hbChpLnNpZ25hbCwgc2lnbmFscyk7XG4gICAgICAgICAgZWxzZSBpZihpLmFyZykgZGVmICs9IFwiYXJnc1tcIitkbC5zdHIoaS5hcmcpK1wiXVwiO1xuICAgICAgICAgIGRlZis9XCIsIFwiO1xuICAgICAgICB9KTtcblxuICAgICAgICBkZWYrPSBcInByZWRpY2F0ZXNbXCIrZGwuc3RyKG8ucHJlZGljYXRlKStcIl0oYXJncywgZGIsIHNpZ25hbHMsIHByZWRpY2F0ZXMpXCI7XG4gICAgICB9XG5cbiAgICAgIGRlY2wucHVzaChuYW1lKTtcbiAgICAgIGRlZnMucHVzaChuYW1lK1wiPShcIitkZWYrXCIpXCIpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGU6IFwidmFyIFwiICsgZGVjbC5qb2luKFwiLCBcIikgKyBcIjtcXG5cIiArIGRlZnMuam9pbihcIjtcXG5cIikgKyBcIjtcXG5cIixcbiAgICAgIHNpZ25hbHM6IGRsLmtleXMoc2lnbmFscyksXG4gICAgICBkYXRhOiBkbC5rZXlzKGRiKVxuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBwYXJzZUNvbXBhcmF0b3Ioc3BlYykge1xuICAgIHZhciBvcHMgPSBwYXJzZU9wZXJhbmRzKHNwZWMub3BlcmFuZHMpO1xuICAgIGlmKHNwZWMudHlwZSA9PSAnPScpIHNwZWMudHlwZSA9ICc9PSc7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogb3BzLmNvZGUgKyBcInJldHVybiBcIiArIFtcIm8wXCIsIFwibzFcIl0uam9pbihzcGVjLnR5cGUpICsgXCI7XCIsXG4gICAgICBzaWduYWxzOiBvcHMuc2lnbmFscyxcbiAgICAgIGRhdGE6IG9wcy5kYXRhXG4gICAgfTtcbiAgfTtcblxuICBmdW5jdGlvbiBwYXJzZUxvZ2ljYWwoc3BlYykge1xuICAgIHZhciBvcHMgPSBwYXJzZU9wZXJhbmRzKHNwZWMub3BlcmFuZHMpLFxuICAgICAgICBvID0gW10sIGkgPSAwLCBsZW4gPSBzcGVjLm9wZXJhbmRzLmxlbmd0aDtcblxuICAgIHdoaWxlKG8ucHVzaChcIm9cIitpKyspPGxlbik7XG4gICAgaWYoc3BlYy50eXBlID09ICdhbmQnKSBzcGVjLnR5cGUgPSAnJiYnO1xuICAgIGVsc2UgaWYoc3BlYy50eXBlID09ICdvcicpIHNwZWMudHlwZSA9ICd8fCc7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogb3BzLmNvZGUgKyBcInJldHVybiBcIiArIG8uam9pbihzcGVjLnR5cGUpICsgXCI7XCIsXG4gICAgICBzaWduYWxzOiBvcHMuc2lnbmFscyxcbiAgICAgIGRhdGE6IG9wcy5kYXRhXG4gICAgfTtcbiAgfTtcblxuICBmdW5jdGlvbiBwYXJzZUluKHNwZWMpIHtcbiAgICB2YXIgbyA9IFtzcGVjLml0ZW1dO1xuICAgIGlmKHNwZWMucmFuZ2UpIG8ucHVzaC5hcHBseShvLCBzcGVjLnJhbmdlKTtcbiAgICBpZihzcGVjLnNjYWxlKSBvLnB1c2goc3BlYy5zY2FsZSk7XG5cbiAgICB2YXIgb3BzID0gcGFyc2VPcGVyYW5kcyhvKSxcbiAgICAgICAgY29kZSA9IG9wcy5jb2RlO1xuXG4gICAgaWYoc3BlYy5kYXRhKSB7XG4gICAgICB2YXIgZmllbGQgPSBkbC5maWVsZChzcGVjLmZpZWxkKS5tYXAoZGwuc3RyKTtcbiAgICAgIGNvZGUgKz0gXCJ2YXIgd2hlcmUgPSBmdW5jdGlvbihkKSB7IHJldHVybiBkW1wiK2ZpZWxkLmpvaW4oXCJdW1wiKStcIl0gPT0gbzAgfTtcXG5cIjtcbiAgICAgIGNvZGUgKz0gXCJyZXR1cm4gZGJbXCIrZGwuc3RyKHNwZWMuZGF0YSkrXCJdLmZpbHRlcih3aGVyZSkubGVuZ3RoID4gMDtcIjtcbiAgICB9IGVsc2UgaWYoc3BlYy5yYW5nZSkge1xuICAgICAgLy8gVE9ETzogaW5jbHVzaXZlL2V4Y2x1c2l2ZSByYW5nZT9cbiAgICAgIC8vIFRPRE86IGludmVydGluZyBvcmRpbmFsIHNjYWxlc1xuICAgICAgaWYoc3BlYy5zY2FsZSkgY29kZSArPSBcIm8xID0gbzMobzEpO1xcbm8yID0gbzMobzIpO1xcblwiO1xuICAgICAgY29kZSArPSBcInJldHVybiBvMSA8IG8yID8gbzEgPD0gbzAgJiYgbzAgPD0gbzIgOiBvMiA8PSBvMCAmJiBvMCA8PSBvMVwiO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiBjb2RlLCBcbiAgICAgIHNpZ25hbHM6IG9wcy5zaWduYWxzLCBcbiAgICAgIGRhdGE6IG9wcy5kYXRhLmNvbmNhdChzcGVjLmRhdGEgPyBbc3BlYy5kYXRhXSA6IFtdKVxuICAgIH07XG4gIH07XG5cbiAgKHNwZWMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24ocykge1xuICAgIHZhciBwYXJzZSA9IHR5cGVzW3MudHlwZV0ocyk7XG4gICAgdmFyIHByZWQgPSBGdW5jdGlvbihcImFyZ3NcIiwgXCJkYlwiLCBcInNpZ25hbHNcIiwgXCJwcmVkaWNhdGVzXCIsIHBhcnNlLmNvZGUpO1xuICAgIHByZWQuc2lnbmFscyA9IHBhcnNlLnNpZ25hbHM7XG4gICAgcHJlZC5kYXRhID0gcGFyc2UuZGF0YTtcbiAgICBtb2RlbC5wcmVkaWNhdGUocy5uYW1lLCBwcmVkKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHNwZWM7XG59IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGNvbmZpZyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uZmlnJyk7XG5cbmZ1bmN0aW9uIGNvbXBpbGUobW9kZWwsIG1hcmssIHNwZWMpIHtcbiAgdmFyIGNvZGUgPSBcIlwiLFxuICAgICAgbmFtZXMgPSBkbC5rZXlzKHNwZWMpLFxuICAgICAgaSwgbGVuLCBuYW1lLCByZWYsIHZhcnMgPSB7fSwgXG4gICAgICBkZXBzID0ge1xuICAgICAgICBzaWduYWxzOiB7fSxcbiAgICAgICAgc2NhbGVzOiB7fSxcbiAgICAgICAgZGF0YToge31cbiAgICAgIH07XG4gICAgICBcbiAgY29kZSArPSBcInZhciBvID0gdHJhbnMgPyB7fSA6IGl0ZW07XFxuXCJcbiAgXG4gIGZvciAoaT0wLCBsZW49bmFtZXMubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgcmVmID0gc3BlY1tuYW1lID0gbmFtZXNbaV1dO1xuICAgIGNvZGUgKz0gKGkgPiAwKSA/IFwiXFxuICBcIiA6IFwiICBcIjtcbiAgICBpZihyZWYucnVsZSkge1xuICAgICAgcmVmID0gcnVsZShtb2RlbCwgbmFtZSwgcmVmLnJ1bGUpO1xuICAgICAgY29kZSArPSBcIlxcbiAgXCIgKyByZWYuY29kZVxuICAgIH0gZWxzZSB7XG4gICAgICByZWYgPSB2YWx1ZVJlZihuYW1lLCByZWYpO1xuICAgICAgY29kZSArPSBcInRoaXMudHBsLnNldChvLCBcIitkbC5zdHIobmFtZSkrXCIsIFwiK3JlZi52YWwrXCIpO1wiO1xuICAgIH1cblxuICAgIHZhcnNbbmFtZV0gPSB0cnVlO1xuICAgIFsnc2lnbmFscycsICdzY2FsZXMnLCAnZGF0YSddLmZvckVhY2goZnVuY3Rpb24ocCkge1xuICAgICAgaWYocmVmW3BdICE9IG51bGwpIGRsLmFycmF5KHJlZltwXSkuZm9yRWFjaChmdW5jdGlvbihrKSB7IGRlcHNbcF1ba10gPSAxIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgaWYgKHZhcnMueDIpIHtcbiAgICBpZiAodmFycy54KSB7XG4gICAgICBjb2RlICs9IFwiXFxuICBpZiAoby54ID4gby54MikgeyBcIlxuICAgICAgICAgICAgKyBcInZhciB0ID0gby54O1wiXG4gICAgICAgICAgICArIFwidGhpcy50cGwuc2V0KG8sICd4Jywgby54Mik7XCJcbiAgICAgICAgICAgICsgXCJ0aGlzLnRwbC5zZXQobywgJ3gyJywgdCk7IFwiXG4gICAgICAgICAgICArIFwifTtcIjtcbiAgICAgIGNvZGUgKz0gXCJcXG4gIHRoaXMudHBsLnNldChvLCAnd2lkdGgnLCAoby54MiAtIG8ueCkpO1wiO1xuICAgIH0gZWxzZSBpZiAodmFycy53aWR0aCkge1xuICAgICAgY29kZSArPSBcIlxcbiAgdGhpcy50cGwuc2V0KG8sICd4JywgKG8ueDIgLSBvLndpZHRoKSk7XCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUgKz0gXCJcXG4gIHRoaXMudHBsLnNldChvLCAneCcsIG8ueDIpO1wiXG4gICAgfVxuICB9XG5cbiAgaWYgKHZhcnMueTIpIHtcbiAgICBpZiAodmFycy55KSB7XG4gICAgICBjb2RlICs9IFwiXFxuICBpZiAoby55ID4gby55MikgeyBcIlxuICAgICAgICAgICAgKyBcInZhciB0ID0gby55O1wiXG4gICAgICAgICAgICArIFwidGhpcy50cGwuc2V0KG8sICd5Jywgby55Mik7XCJcbiAgICAgICAgICAgICsgXCJ0aGlzLnRwbC5zZXQobywgJ3kyJywgdCk7XCJcbiAgICAgICAgICAgICsgXCJ9O1wiO1xuICAgICAgY29kZSArPSBcIlxcbiAgdGhpcy50cGwuc2V0KG8sICdoZWlnaHQnLCAoby55MiAtIG8ueSkpO1wiO1xuICAgIH0gZWxzZSBpZiAodmFycy5oZWlnaHQpIHtcbiAgICAgIGNvZGUgKz0gXCJcXG4gIHRoaXMudHBsLnNldChvLCAneScsIChvLnkyIC0gby5oZWlnaHQpKTtcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29kZSArPSBcIlxcbiAgdGhpcy50cGwuc2V0KG8sICd5Jywgby55Mik7XCJcbiAgICB9XG4gIH1cbiAgXG4gIGlmIChoYXNQYXRoKG1hcmssIHZhcnMpKSBjb2RlICs9IFwiXFxuICBpdGVtLnRvdWNoKCk7XCI7XG4gIGNvZGUgKz0gXCJcXG4gIGlmICh0cmFucykgdHJhbnMuaW50ZXJwb2xhdGUoaXRlbSwgbyk7XCI7XG5cbiAgdHJ5IHtcbiAgICB2YXIgZW5jb2RlciA9IEZ1bmN0aW9uKFwiaXRlbVwiLCBcImdyb3VwXCIsIFwidHJhbnNcIiwgXCJkYlwiLCBcbiAgICAgIFwic2lnbmFsc1wiLCBcInByZWRpY2F0ZXNcIiwgY29kZSk7XG4gICAgZW5jb2Rlci50cGwgID0gdHVwbGU7XG4gICAgZW5jb2Rlci51dGlsID0gZGw7XG4gICAgZW5jb2Rlci5kMyAgID0gZDM7IC8vIEZvciBjb2xvciBzcGFjZXNcbiAgICByZXR1cm4ge1xuICAgICAgZW5jb2RlOiBlbmNvZGVyLFxuICAgICAgc2lnbmFsczogZGwua2V5cyhkZXBzLnNpZ25hbHMpLFxuICAgICAgc2NhbGVzOiBkbC5rZXlzKGRlcHMuc2NhbGVzKSxcbiAgICAgIGRhdGE6IGRsLmtleXMoZGVwcy5kYXRhKVxuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGRsLmVycm9yKGUpO1xuICAgIGRsLmxvZyhjb2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoYXNQYXRoKG1hcmssIHZhcnMpIHtcbiAgcmV0dXJuIHZhcnMucGF0aCB8fFxuICAgICgobWFyaz09PVwiYXJlYVwiIHx8IG1hcms9PT1cImxpbmVcIikgJiZcbiAgICAgICh2YXJzLnggfHwgdmFycy54MiB8fCB2YXJzLndpZHRoIHx8XG4gICAgICAgdmFycy55IHx8IHZhcnMueTIgfHwgdmFycy5oZWlnaHQgfHxcbiAgICAgICB2YXJzLnRlbnNpb24gfHwgdmFycy5pbnRlcnBvbGF0ZSkpO1xufVxuXG52YXIgR1JPVVBfVkFSUyA9IHtcbiAgXCJ3aWR0aFwiOiAxLFxuICBcImhlaWdodFwiOiAxLFxuICBcIm1hcmsuZ3JvdXAud2lkdGhcIjogMSxcbiAgXCJtYXJrLmdyb3VwLmhlaWdodFwiOiAxXG59O1xuXG5mdW5jdGlvbiBydWxlKG1vZGVsLCBuYW1lLCBydWxlcykge1xuICB2YXIgc2lnbmFscyA9IFtdLCBzY2FsZXMgPSBbXSwgZGIgPSBbXSxcbiAgICAgIGlucHV0cyA9IFtdLCBjb2RlID0gXCJcIjtcblxuICAocnVsZXN8fFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHIsIGkpIHtcbiAgICB2YXIgcHJlZE5hbWUgPSByLnByZWRpY2F0ZSxcbiAgICAgICAgcHJlZCA9IG1vZGVsLnByZWRpY2F0ZShwcmVkTmFtZSksXG4gICAgICAgIGlucHV0ID0gW10sIGFyZ3MgPSBuYW1lK1wiX2FyZ1wiK2ksXG4gICAgICAgIHJlZjtcblxuICAgIGRsLmtleXMoci5pbnB1dCkuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICB2YXIgcmVmID0gdmFsdWVSZWYoaSwgci5pbnB1dFtrXSk7XG4gICAgICBpbnB1dC5wdXNoKGRsLnN0cihrKStcIjogXCIrcmVmLnZhbCk7XG4gICAgICBpZihyZWYuc2lnbmFscykgc2lnbmFscy5wdXNoLmFwcGx5KHNpZ25hbHMsIGRsLmFycmF5KHJlZi5zaWduYWxzKSk7XG4gICAgICBpZihyZWYuc2NhbGVzKSAgc2NhbGVzLnB1c2guYXBwbHkoc2NhbGVzLCBkbC5hcnJheShyZWYuc2NhbGVzKSk7XG4gICAgfSk7XG5cbiAgICByZWYgPSB2YWx1ZVJlZihuYW1lLCByKTtcbiAgICBpZihyZWYuc2lnbmFscykgc2lnbmFscy5wdXNoLmFwcGx5KHNpZ25hbHMsIGRsLmFycmF5KHJlZi5zaWduYWxzKSk7XG4gICAgaWYocmVmLnNjYWxlcykgIHNjYWxlcy5wdXNoLmFwcGx5KHNjYWxlcywgZGwuYXJyYXkocmVmLnNjYWxlcykpO1xuXG4gICAgaWYocHJlZE5hbWUpIHtcbiAgICAgIHNpZ25hbHMucHVzaC5hcHBseShzaWduYWxzLCBwcmVkLnNpZ25hbHMpO1xuICAgICAgZGIucHVzaC5hcHBseShkYiwgcHJlZC5kYXRhKTtcbiAgICAgIGlucHV0cy5wdXNoKGFyZ3MrXCIgPSB7XCIraW5wdXQuam9pbignLCAnKStcIn1cIik7XG4gICAgICBjb2RlICs9IFwiaWYocHJlZGljYXRlc1tcIitkbC5zdHIocHJlZE5hbWUpK1wiXShcIithcmdzK1wiLCBkYiwgc2lnbmFscywgcHJlZGljYXRlcykpIHtcXG5cIiArXG4gICAgICAgIFwiICAgIHRoaXMudHBsLnNldChvLCBcIitkbC5zdHIobmFtZSkrXCIsIFwiK3JlZi52YWwrXCIpO1xcblwiO1xuICAgICAgY29kZSArPSBydWxlc1tpKzFdID8gXCIgIH0gZWxzZSBcIiA6IFwiICB9XCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUgKz0gXCJ7XFxuXCIgKyBcbiAgICAgICAgXCIgICAgdGhpcy50cGwuc2V0KG8sIFwiK2RsLnN0cihuYW1lKStcIiwgXCIrcmVmLnZhbCtcIik7XFxuXCIrXG4gICAgICAgIFwiICB9XCI7XG4gICAgfVxuICB9KTtcblxuICBjb2RlID0gXCJ2YXIgXCIgKyBpbnB1dHMuam9pbihcIixcXG4gICAgICBcIikgKyBcIjtcXG4gIFwiICsgY29kZTtcbiAgcmV0dXJuIHtjb2RlOiBjb2RlLCBzaWduYWxzOiBzaWduYWxzLCBzY2FsZXM6IHNjYWxlcywgZGF0YTogZGJ9O1xufVxuXG5mdW5jdGlvbiB2YWx1ZVJlZihuYW1lLCByZWYpIHtcbiAgaWYgKHJlZiA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgdmFyIGlzQ29sb3IgPSBuYW1lPT09XCJmaWxsXCIgfHwgbmFtZT09PVwic3Ryb2tlXCI7XG4gIHZhciBzaWduYWxzID0gW107XG5cbiAgaWYgKGlzQ29sb3IpIHtcbiAgICBpZiAocmVmLmMpIHtcbiAgICAgIHJldHVybiBjb2xvclJlZihcImhjbFwiLCByZWYuaCwgcmVmLmMsIHJlZi5sKTtcbiAgICB9IGVsc2UgaWYgKHJlZi5oIHx8IHJlZi5zKSB7XG4gICAgICByZXR1cm4gY29sb3JSZWYoXCJoc2xcIiwgcmVmLmgsIHJlZi5zLCByZWYubCk7XG4gICAgfSBlbHNlIGlmIChyZWYubCB8fCByZWYuYSkge1xuICAgICAgcmV0dXJuIGNvbG9yUmVmKFwibGFiXCIsIHJlZi5sLCByZWYuYSwgcmVmLmIpO1xuICAgIH0gZWxzZSBpZiAocmVmLnIgfHwgcmVmLmcgfHwgcmVmLmIpIHtcbiAgICAgIHJldHVybiBjb2xvclJlZihcInJnYlwiLCByZWYuciwgcmVmLmcsIHJlZi5iKTtcbiAgICB9XG4gIH1cblxuICAvLyBpbml0aWFsaXplIHZhbHVlXG4gIHZhciB2YWwgPSBudWxsLCBzaWduYWxSZWYgPSBudWxsO1xuICBpZiAocmVmLnZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICB2YWwgPSBkbC5zdHIocmVmLnZhbHVlKTtcbiAgfVxuXG4gIGlmIChyZWYuc2lnbmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICBzaWduYWxSZWYgPSBkbC5maWVsZChyZWYuc2lnbmFsKTtcbiAgICB2YWwgPSBcInNpZ25hbHNbXCIrc2lnbmFsUmVmLm1hcChkbC5zdHIpLmpvaW4oXCJdW1wiKStcIl1cIjsgXG4gICAgc2lnbmFscy5wdXNoKHNpZ25hbFJlZi5zaGlmdCgpKTtcbiAgfVxuXG4gIC8vIGdldCBmaWVsZCByZWZlcmVuY2UgZm9yIGVuY2xvc2luZyBncm91cFxuICBpZiAocmVmLmdyb3VwICE9IG51bGwpIHtcbiAgICB2YXIgZ3JwID0gXCJncm91cC5kYXR1bVwiO1xuICAgIGlmIChkbC5pc1N0cmluZyhyZWYuZ3JvdXApKSB7XG4gICAgICBncnAgPSBHUk9VUF9WQVJTW3JlZi5ncm91cF1cbiAgICAgICAgPyBcImdyb3VwLlwiICsgcmVmLmdyb3VwXG4gICAgICAgIDogXCJncm91cC5kYXR1bVtcIitkbC5maWVsZChyZWYuZ3JvdXApLm1hcChkbC5zdHIpLmpvaW4oXCJdW1wiKStcIl1cIjtcbiAgICB9XG4gIH1cblxuICAvLyBnZXQgZGF0YSBmaWVsZCB2YWx1ZVxuICBpZiAocmVmLmZpZWxkICE9IG51bGwpIHtcbiAgICBpZiAoZGwuaXNTdHJpbmcocmVmLmZpZWxkKSkge1xuICAgICAgdmFsID0gXCJpdGVtLmRhdHVtW1wiK2RsLmZpZWxkKHJlZi5maWVsZCkubWFwKGRsLnN0cikuam9pbihcIl1bXCIpK1wiXVwiO1xuICAgICAgaWYgKHJlZi5ncm91cCAhPSBudWxsKSB7IHZhbCA9IFwidGhpcy51dGlsLmFjY2Vzc29yKFwiK3ZhbCtcIikoXCIrZ3JwK1wiKVwiOyB9XG4gICAgfSBlbHNlIGlmKHJlZi5maWVsZC5zaWduYWwpIHtcbiAgICAgIHNpZ25hbFJlZiA9IGRsLmZpZWxkKHJlZi5maWVsZC5zaWduYWwpO1xuICAgICAgdmFsID0gXCJpdGVtLmRhdHVtW3NpZ25hbHNbXCIrc2lnbmFsUmVmLm1hcChkbC5zdHIpLmpvaW4oXCJdW1wiKStcIl1dXCI7XG4gICAgICBpZiAocmVmLmdyb3VwICE9IG51bGwpIHsgdmFsID0gXCJ0aGlzLnV0aWwuYWNjZXNzb3IoXCIrdmFsK1wiKShcIitncnArXCIpXCI7IH1cbiAgICAgIHNpZ25hbHMucHVzaChzaWduYWxSZWYuc2hpZnQoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbCA9IFwidGhpcy51dGlsLmFjY2Vzc29yKGdyb3VwLmRhdHVtW1wiXG4gICAgICAgICAgKyBkbC5maWVsZChyZWYuZmllbGQuZ3JvdXApLm1hcChkbC5zdHIpLmpvaW4oXCJdW1wiKVxuICAgICAgICAgICsgXCJdKShpdGVtLmRhdHVtKVwiO1xuICAgIH1cbiAgfSBlbHNlIGlmIChyZWYuZ3JvdXAgIT0gbnVsbCkge1xuICAgIHZhbCA9IGdycDtcbiAgfVxuXG4gIGlmIChyZWYuc2NhbGUgIT0gbnVsbCkge1xuICAgIHZhciBzY2FsZSA9IG51bGw7XG4gICAgaWYoZGwuaXNTdHJpbmcocmVmLnNjYWxlKSkge1xuICAgICAgc2NhbGUgPSBkbC5zdHIocmVmLnNjYWxlKTtcbiAgICB9IGVsc2UgaWYocmVmLnNjYWxlLnNpZ25hbCkge1xuICAgICAgc2lnbmFsUmVmID0gZGwuZmllbGQocmVmLnNjYWxlLnNpZ25hbCk7XG4gICAgICBzY2FsZSA9IFwic2lnbmFsc1tcIitzaWduYWxSZWYubWFwKGRsLnN0cikuam9pbihcIl1bXCIpK1wiXVwiO1xuICAgICAgc2lnbmFscy5wdXNoKHNpZ25hbFJlZi5zaGlmdCgpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NhbGUgPSAocmVmLnNjYWxlLmdyb3VwID8gXCJncm91cFwiIDogXCJpdGVtXCIpXG4gICAgICAgICsgXCIuZGF0dW1bXCIgKyBkbC5zdHIocmVmLnNjYWxlLmdyb3VwIHx8IHJlZi5zY2FsZS5maWVsZCkgKyBcIl1cIjtcbiAgICB9XG5cbiAgICBzY2FsZSA9IFwiZ3JvdXAuc2NhbGUoXCIgKyBzY2FsZSArIFwiKVwiO1xuICAgIGlmKHJlZi5pbnZlcnQpIHNjYWxlICs9IFwiLmludmVydFwiOyAgLy8gVE9ETzogb3JkaW5hbCBzY2FsZXNcblxuICAgIC8vIHJ1biB0aHJvdWdoIHNjYWxlIGZ1bmN0aW9uIGlmIHZhbCBzcGVjaWZpZWQuXG4gICAgLy8gaWYgbm8gdmFsLCBzY2FsZSBmdW5jdGlvbiBpcyBwcmVkaWNhdGUgYXJnLlxuICAgIGlmKHZhbCAhPT0gbnVsbCB8fCByZWYuYmFuZCB8fCByZWYubXVsdCB8fCByZWYub2Zmc2V0KSB7XG4gICAgICB2YWwgPSBzY2FsZSArIChyZWYuYmFuZCA/IFwiLnJhbmdlQmFuZCgpXCIgOiBcbiAgICAgICAgXCIoXCIrKHZhbCAhPT0gbnVsbCA/IHZhbCA6IFwiaXRlbS5kYXR1bS5kYXRhXCIpK1wiKVwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsID0gc2NhbGU7XG4gICAgfVxuICB9XG4gIFxuICAvLyBtdWx0aXBseSwgb2Zmc2V0LCByZXR1cm4gdmFsdWVcbiAgdmFsID0gXCIoXCIgKyAocmVmLm11bHQ/KGRsLm51bWJlcihyZWYubXVsdCkrXCIgKiBcIik6XCJcIikgKyB2YWwgKyBcIilcIlxuICAgICsgKHJlZi5vZmZzZXQgPyBcIiArIFwiICsgZGwubnVtYmVyKHJlZi5vZmZzZXQpIDogXCJcIik7XG4gIHJldHVybiB7dmFsOiB2YWwsIHNpZ25hbHM6IHNpZ25hbHMsIHNjYWxlczogcmVmLnNjYWxlfTtcbn1cblxuZnVuY3Rpb24gY29sb3JSZWYodHlwZSwgeCwgeSwgeikge1xuICB2YXIgeHggPSB4ID8gdmFsdWVSZWYoXCJcIiwgeCkgOiBjb25maWcuY29sb3JbdHlwZV1bMF0sXG4gICAgICB5eSA9IHkgPyB2YWx1ZVJlZihcIlwiLCB5KSA6IGNvbmZpZy5jb2xvclt0eXBlXVsxXSxcbiAgICAgIHp6ID0geiA/IHZhbHVlUmVmKFwiXCIsIHopIDogY29uZmlnLmNvbG9yW3R5cGVdWzJdXG4gICAgICBzaWduYWxzID0gW10sIHNjYWxlcyA9IFtdO1xuXG4gIFt4eCwgeXksIHp6XS5mb3JFYWNoKGZ1bmN0aW9uKHYpIHtcbiAgICBpZih2LnNpZ25hbHMpIHNpZ25hbHMucHVzaC5hcHBseShzaWduYWxzLCB2LnNpZ25hbHMpO1xuICAgIGlmKHYuc2NhbGVzKSAgc2NhbGVzLnB1c2godi5zY2FsZXMpO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIHZhbDogXCIodGhpcy5kMy5cIiArIHR5cGUgKyBcIihcIiArIFt4eC52YWwsIHl5LnZhbCwgenoudmFsXS5qb2luKFwiLFwiKSArICcpICsgXCJcIiknLFxuICAgIHNpZ25hbHM6IHNpZ25hbHMsXG4gICAgc2NhbGVzOiBzY2FsZXNcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb21waWxlOyIsInZhciBleHByID0gcmVxdWlyZSgnLi9leHByJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyc2VTaWduYWxzKG1vZGVsLCBzcGVjKSB7XG4gIHZhciBncmFwaCA9IG1vZGVsLmdyYXBoO1xuXG4gIC8vIHByb2Nlc3MgZWFjaCBzaWduYWwgZGVmaW5pdGlvblxuICAoc3BlYyB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbihzKSB7XG4gICAgdmFyIHNpZ25hbCA9IGdyYXBoLnNpZ25hbChzLm5hbWUsIHMuaW5pdCksXG4gICAgICAgIGV4cDtcblxuICAgIGlmKHMuZXhwcikge1xuICAgICAgZXhwID0gZXhwcihzLmV4cHIpO1xuICAgICAgc2lnbmFsLmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gZXhwci5ldmFsKGdyYXBoLCBleHAuZm4sIG51bGwsIG51bGwsIG51bGwsIG51bGwsIGV4cC5zaWduYWxzKTtcbiAgICAgICAgaWYoc3BlYy5zY2FsZSkgdmFsdWUgPSBtb2RlbC5zY2FsZShzcGVjLCB2YWx1ZSk7XG4gICAgICAgIHNpZ25hbC52YWx1ZSh2YWx1ZSk7XG4gICAgICAgIGlucHV0LnNpZ25hbHNbcy5uYW1lXSA9IDE7XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgIH07XG4gICAgICBzaWduYWwuZGVwZW5kZW5jeShDLlNJR05BTFMsIGV4cC5zaWduYWxzKTtcbiAgICAgIGV4cC5zaWduYWxzLmZvckVhY2goZnVuY3Rpb24oZGVwKSB7IGdyYXBoLnNpZ25hbChkZXApLmFkZExpc3RlbmVyKHNpZ25hbCk7IH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHNwZWM7XG59OyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4uL2NvcmUvTW9kZWwnKSwgXG4gICAgVmlldyA9IHJlcXVpcmUoJy4uL2NvcmUvVmlldycpLCBcbiAgICBwYXJzZVBhZGRpbmcgPSByZXF1aXJlKCcuLi9wYXJzZS9wYWRkaW5nJyksXG4gICAgcGFyc2VNYXJrcyA9IHJlcXVpcmUoJy4uL3BhcnNlL21hcmtzJyksXG4gICAgcGFyc2VTaWduYWxzID0gcmVxdWlyZSgnLi4vcGFyc2Uvc2lnbmFscycpLFxuICAgIHBhcnNlUHJlZGljYXRlcyA9IHJlcXVpcmUoJy4uL3BhcnNlL3ByZWRpY2F0ZXMnKSxcbiAgICBwYXJzZURhdGEgPSByZXF1aXJlKCcuLi9wYXJzZS9kYXRhJyksXG4gICAgcGFyc2VJbnRlcmFjdG9ycyA9IHJlcXVpcmUoJy4uL3BhcnNlL2ludGVyYWN0b3JzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyc2VTcGVjKHNwZWMsIGNhbGxiYWNrLCB2aWV3RmFjdG9yeSkge1xuICAvLyBwcm90ZWN0IGFnYWluc3Qgc3Vic2VxdWVudCBzcGVjIG1vZGlmaWNhdGlvblxuICBzcGVjID0gZGwuZHVwbGljYXRlKHNwZWMpO1xuXG4gIHZpZXdGYWN0b3J5ID0gdmlld0ZhY3RvcnkgfHwgVmlldy5mYWN0b3J5O1xuXG4gIHZhciB3aWR0aCA9IHNwZWMud2lkdGggfHwgNTAwLFxuICAgICAgaGVpZ2h0ID0gc3BlYy5oZWlnaHQgfHwgNTAwLFxuICAgICAgdmlld3BvcnQgPSBzcGVjLnZpZXdwb3J0IHx8IG51bGwsXG4gICAgICBtb2RlbCA9IG5ldyBNb2RlbCgpO1xuXG4gIHBhcnNlSW50ZXJhY3RvcnMobW9kZWwsIHNwZWMsIGZ1bmN0aW9uKCkge1xuICAgIG1vZGVsLmRlZnMoe1xuICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICB2aWV3cG9ydDogdmlld3BvcnQsXG4gICAgICBwYWRkaW5nOiBwYXJzZVBhZGRpbmcoc3BlYy5wYWRkaW5nKSxcbiAgICAgIHNpZ25hbHM6IHBhcnNlU2lnbmFscyhtb2RlbCwgc3BlYy5zaWduYWxzKSxcbiAgICAgIHByZWRpY2F0ZXM6IHBhcnNlUHJlZGljYXRlcyhtb2RlbCwgc3BlYy5wcmVkaWNhdGVzKSxcbiAgICAgIG1hcmtzOiBwYXJzZU1hcmtzKG1vZGVsLCBzcGVjLCB3aWR0aCwgaGVpZ2h0KSxcbiAgICAgIGRhdGE6IHBhcnNlRGF0YShtb2RlbCwgc3BlYy5kYXRhLCBmdW5jdGlvbigpIHsgY2FsbGJhY2sodmlld0ZhY3RvcnkobW9kZWwpKTsgfSlcbiAgICB9KTtcbiAgfSk7XG59IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgTm9kZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L05vZGUnKSxcbiAgICBjaGFuZ3NldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpLFxuICAgIHNlbGVjdG9yID0gcmVxdWlyZSgnLi9ldmVudHMnKSxcbiAgICBleHByID0gcmVxdWlyZSgnLi9leHByJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbnZhciBTVEFSVCA9IFwic3RhcnRcIiwgTUlERExFID0gXCJtaWRkbGVcIiwgRU5EID0gXCJlbmRcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2aWV3KSB7XG4gIHZhciBtb2RlbCA9IHZpZXcubW9kZWwoKSxcbiAgICAgIGdyYXBoID0gbW9kZWwuZ3JhcGgsXG4gICAgICBzcGVjICA9IG1vZGVsLmRlZnMoKS5zaWduYWxzLFxuICAgICAgcmVnaXN0ZXIgPSB7fSwgbm9kZXMgPSB7fTtcblxuICBmdW5jdGlvbiBzY2FsZShkZWYsIHZhbHVlLCBpdGVtKSB7XG4gICAgaWYoIWl0ZW0gfHwgIWl0ZW0uc2NhbGUpIHtcbiAgICAgIGl0ZW0gPSAoaXRlbSAmJiBpdGVtLm1hcmspID8gaXRlbS5tYXJrLmdyb3VwIDogbW9kZWwuc2NlbmUoKS5pdGVtc1swXTtcbiAgICB9XG5cbiAgICB2YXIgc2NhbGUgPSBpdGVtLnNjYWxlKGRlZi5zY2FsZS5zaWduYWwgfHwgZGVmLnNjYWxlKTtcbiAgICBpZighc2NhbGUpIHJldHVybiB2YWx1ZTtcbiAgICByZXR1cm4gZGVmLmludmVydCA/IHNjYWxlLmludmVydCh2YWx1ZSkgOiBzY2FsZSh2YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaWduYWwoc2lnLCBzZWxlY3RvciwgZXhwLCBzcGVjKSB7XG4gICAgdmFyIG4gPSBuZXcgTm9kZShncmFwaCksXG4gICAgICAgIGl0ZW0gPSBzcGVjLml0ZW0gPyBncmFwaC5zaWduYWwoc3BlYy5pdGVtLnNpZ25hbCkgOiBudWxsO1xuICAgIG4uZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgaWYoIWlucHV0LnNpZ25hbHNbc2VsZWN0b3Iuc2lnbmFsXSkgcmV0dXJuIGdyYXBoLmRvTm90UHJvcGFnYXRlO1xuICAgICAgdmFyIHZhbCA9IGV4cHIuZXZhbChncmFwaCwgZXhwLmZuLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBleHAuc2lnbmFscyk7XG4gICAgICBpZihzcGVjLnNjYWxlKSB2YWwgPSBzY2FsZShzcGVjLCB2YWwsIGl0ZW0gPyBpdGVtLnZhbHVlKCkgOiBudWxsKTtcbiAgICAgIHNpZy52YWx1ZSh2YWwpO1xuICAgICAgaW5wdXQuc2lnbmFsc1tzaWcubmFtZSgpXSA9IDE7XG4gICAgICBpbnB1dC5yZWZsb3cgPSB0cnVlO1xuICAgICAgcmV0dXJuIGlucHV0OyAgXG4gICAgfTtcbiAgICBuLmRlcGVuZGVuY3koQy5TSUdOQUxTLCBzZWxlY3Rvci5zaWduYWwpO1xuICAgIG4uYWRkTGlzdGVuZXIoc2lnKTtcbiAgICBncmFwaC5zaWduYWwoc2VsZWN0b3Iuc2lnbmFsKS5hZGRMaXN0ZW5lcihuKTtcbiAgfTtcblxuICBmdW5jdGlvbiBldmVudChzaWcsIHNlbGVjdG9yLCBleHAsIHNwZWMpIHtcbiAgICB2YXIgZmlsdGVycyA9IHNlbGVjdG9yLmZpbHRlcnMgfHwgW10sXG4gICAgICAgIHRhcmdldCA9IHNlbGVjdG9yLnRhcmdldDtcblxuICAgIGlmKHRhcmdldCkgZmlsdGVycy5wdXNoKFwiaS5cIit0YXJnZXQudHlwZStcIj09XCIrZGwuc3RyKHRhcmdldC52YWx1ZSkpO1xuXG4gICAgcmVnaXN0ZXJbc2VsZWN0b3IuZXZlbnRdID0gcmVnaXN0ZXJbc2VsZWN0b3IuZXZlbnRdIHx8IFtdO1xuICAgIHJlZ2lzdGVyW3NlbGVjdG9yLmV2ZW50XS5wdXNoKHtcbiAgICAgIHNpZ25hbDogc2lnLFxuICAgICAgZXhwOiBleHAsXG4gICAgICBmaWx0ZXJzOiBmaWx0ZXJzLm1hcChmdW5jdGlvbihmKSB7IHJldHVybiBleHByKGYpOyB9KSxcbiAgICAgIHNwZWM6IHNwZWNcbiAgICB9KTtcblxuICAgIG5vZGVzW3NlbGVjdG9yLmV2ZW50XSA9IG5vZGVzW3NlbGVjdG9yLmV2ZW50XSB8fCBuZXcgTm9kZShncmFwaCk7XG4gICAgbm9kZXNbc2VsZWN0b3IuZXZlbnRdLmFkZExpc3RlbmVyKHNpZyk7XG4gIH07XG5cbiAgZnVuY3Rpb24gb3JkZXJlZFN0cmVhbShzaWcsIHNlbGVjdG9yLCBleHAsIHNwZWMpIHtcbiAgICB2YXIgbmFtZSA9IHNpZy5uYW1lKCksIFxuICAgICAgICB0cnVlRm4gPSBleHByKFwidHJ1ZVwiKSxcbiAgICAgICAgcyA9IHt9O1xuXG4gICAgc1tTVEFSVF0gID0gZ3JhcGguc2lnbmFsKG5hbWUgKyBTVEFSVCwgIGZhbHNlKTtcbiAgICBzW01JRERMRV0gPSBncmFwaC5zaWduYWwobmFtZSArIE1JRERMRSwgZmFsc2UpO1xuICAgIHNbRU5EXSAgICA9IGdyYXBoLnNpZ25hbChuYW1lICsgRU5ELCAgICBmYWxzZSk7XG5cbiAgICB2YXIgcm91dGVyID0gbmV3IE5vZGUoZ3JhcGgpO1xuICAgIHJvdXRlci5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICBpZihzW1NUQVJUXS52YWx1ZSgpID09PSB0cnVlICYmIHNbRU5EXS52YWx1ZSgpID09PSBmYWxzZSkge1xuICAgICAgICAvLyBUT0RPOiBFeHBhbmQgc2VsZWN0b3Igc3ludGF4IHRvIGFsbG93IHN0YXJ0L2VuZCBzaWduYWxzIGludG8gc3RyZWFtLlxuICAgICAgICAvLyBVbnRpbCB0aGVuLCBwcmV2ZW50IG9sZCBtaWRkbGVzIGVudGVyaW5nIHN0cmVhbSBvbiBuZXcgc3RhcnQuXG4gICAgICAgIGlmKGlucHV0LnNpZ25hbHNbbmFtZStTVEFSVF0pIHJldHVybiBncmFwaC5kb05vdFByb3BhZ2F0ZTtcblxuICAgICAgICBzaWcudmFsdWUoc1tNSURETEVdLnZhbHVlKCkpO1xuICAgICAgICBpbnB1dC5zaWduYWxzW25hbWVdID0gMTtcbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgfVxuXG4gICAgICBpZihzW0VORF0udmFsdWUoKSA9PT0gdHJ1ZSkge1xuICAgICAgICBzW1NUQVJUXS52YWx1ZShmYWxzZSk7XG4gICAgICAgIHNbRU5EXS52YWx1ZShmYWxzZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBncmFwaC5kb05vdFByb3BhZ2F0ZTtcbiAgICB9O1xuICAgIHJvdXRlci5hZGRMaXN0ZW5lcihzaWcpO1xuXG4gICAgW1NUQVJULCBNSURETEUsIEVORF0uZm9yRWFjaChmdW5jdGlvbih4KSB7XG4gICAgICB2YXIgdmFsID0gKHggPT0gTUlERExFKSA/IGV4cCA6IHRydWVGbixcbiAgICAgICAgICBzcCA9ICh4ID09IE1JRERMRSkgPyBzcGVjIDoge307XG5cbiAgICAgIGlmKHNlbGVjdG9yW3hdLmV2ZW50KSBldmVudChzW3hdLCBzZWxlY3Rvclt4XSwgdmFsLCBzcCk7XG4gICAgICBlbHNlIGlmKHNlbGVjdG9yW3hdLnNpZ25hbCkgc2lnbmFsKHNbeF0sIHNlbGVjdG9yW3hdLCB2YWwsIHNwKTtcbiAgICAgIGVsc2UgaWYoc2VsZWN0b3JbeF0uc3RyZWFtKSBtZXJnZWRTdHJlYW0oc1t4XSwgc2VsZWN0b3JbeF0uc3RyZWFtLCB2YWwsIHNwKTtcbiAgICAgIHNbeF0uYWRkTGlzdGVuZXIocm91dGVyKTtcbiAgICB9KTtcbiAgfTtcblxuICBmdW5jdGlvbiBtZXJnZWRTdHJlYW0oc2lnLCBzZWxlY3RvciwgZXhwLCBzcGVjKSB7XG4gICAgc2VsZWN0b3IuZm9yRWFjaChmdW5jdGlvbihzKSB7XG4gICAgICBpZihzLmV2ZW50KSAgICAgICBldmVudChzaWcsIHMsIGV4cCwgc3BlYyk7XG4gICAgICBlbHNlIGlmKHMuc2lnbmFsKSBzaWduYWwoc2lnLCBzLCBleHAsIHNwZWMpO1xuICAgICAgZWxzZSBpZihzLnN0YXJ0KSAgb3JkZXJlZFN0cmVhbShzaWcsIHMsIGV4cCwgc3BlYyk7XG4gICAgICBlbHNlIGlmKHMuc3RyZWFtKSBtZXJnZWRTdHJlYW0oc2lnLCBzLnN0cmVhbSwgZXhwLCBzcGVjKTtcbiAgICB9KTtcbiAgfTtcblxuICAoc3BlYyB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbihzaWcpIHtcbiAgICB2YXIgc2lnbmFsID0gZ3JhcGguc2lnbmFsKHNpZy5uYW1lKTtcbiAgICBpZihzaWcuZXhwcikgcmV0dXJuOyAgLy8gQ2Fubm90IGhhdmUgYW4gZXhwciBhbmQgc3RyZWFtIGRlZmluaXRpb24uXG5cbiAgICAoc2lnLnN0cmVhbXMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oc3RyZWFtKSB7XG4gICAgICB2YXIgc2VsID0gc2VsZWN0b3IucGFyc2Uoc3RyZWFtLnR5cGUpLFxuICAgICAgICAgIGV4cCA9IGV4cHIoc3RyZWFtLmV4cHIpO1xuICAgICAgbWVyZ2VkU3RyZWFtKHNpZ25hbCwgc2VsLCBleHAsIHN0cmVhbSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIFdlIHJlZ2lzdGVyIHRoZSBldmVudCBsaXN0ZW5lcnMgYWxsIHRvZ2V0aGVyIHNvIHRoYXQgaWYgbXVsdGlwbGVcbiAgLy8gc2lnbmFscyBhcmUgcmVnaXN0ZXJlZCBvbiB0aGUgc2FtZSBldmVudCwgdGhleSB3aWxsIHJlY2VpdmUgdGhlXG4gIC8vIG5ldyB2YWx1ZSBvbiB0aGUgc2FtZSBwdWxzZS4gXG5cbiAgLy8gVE9ETzogRmlsdGVycywgdGltZSBpbnRlcnZhbHMsIHRhcmdldCBzZWxlY3RvcnNcbiAgZGwua2V5cyhyZWdpc3RlcikuZm9yRWFjaChmdW5jdGlvbihyKSB7XG4gICAgdmFyIGhhbmRsZXJzID0gcmVnaXN0ZXJbcl0sIFxuICAgICAgICBub2RlID0gbm9kZXNbcl07XG5cbiAgICB2aWV3Lm9uKHIsIGZ1bmN0aW9uKGV2dCwgaXRlbSkge1xuICAgICAgdmFyIGNzID0gY2hhbmdzZXQuY3JlYXRlKG51bGwsIHRydWUpLFxuICAgICAgICAgIHBhZCA9IHZpZXcucGFkZGluZygpLFxuICAgICAgICAgIGZpbHRlcmVkID0gZmFsc2UsXG4gICAgICAgICAgdmFsLCBoLCBpLCBtLCBkO1xuXG4gICAgICBldnQucHJldmVudERlZmF1bHQoKTsgLy8gU3RvcCB0ZXh0IHNlbGVjdGlvblxuICAgICAgbSA9IGQzLm1vdXNlKChkMy5ldmVudD1ldnQsIHZpZXcuX2VsKSk7IC8vIFJlbGF0aXZlIHBvc2l0aW9uIHdpdGhpbiBjb250YWluZXJcbiAgICAgIGl0ZW0gPSBpdGVtfHx7fTtcbiAgICAgIGQgPSBpdGVtLmRhdHVtfHx7fTtcbiAgICAgIHZhciBwID0ge3g6IG1bMF0gLSBwYWQubGVmdCwgeTogbVsxXSAtIHBhZC50b3B9O1xuXG4gICAgICBmb3IoaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBoID0gaGFuZGxlcnNbaV07XG4gICAgICAgIGZpbHRlcmVkID0gaC5maWx0ZXJzLnNvbWUoZnVuY3Rpb24oZikge1xuICAgICAgICAgIHJldHVybiAhZXhwci5ldmFsKGdyYXBoLCBmLmZuLCBkLCBldnQsIGl0ZW0sIHAsIGYuc2lnbmFscyk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZihmaWx0ZXJlZCkgY29udGludWU7XG4gICAgICAgIFxuICAgICAgICB2YWwgPSBleHByLmV2YWwoZ3JhcGgsIGguZXhwLmZuLCBkLCBldnQsIGl0ZW0sIHAsIGguZXhwLnNpZ25hbHMpOyBcbiAgICAgICAgaWYoaC5zcGVjLnNjYWxlKSB2YWwgPSBzY2FsZShoLnNwZWMsIHZhbCwgaXRlbSk7XG4gICAgICAgIGguc2lnbmFsLnZhbHVlKHZhbCk7XG4gICAgICAgIGNzLnNpZ25hbHNbaC5zaWduYWwubmFtZSgpXSA9IDE7XG4gICAgICB9XG5cbiAgICAgIGdyYXBoLnByb3BhZ2F0ZShjcywgbm9kZSk7XG4gICAgfSk7XG4gIH0pXG59OyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICB0cmFuc2Zvcm1zID0gcmVxdWlyZSgnLi4vdHJhbnNmb3Jtcy9pbmRleCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhcnNlVHJhbnNmb3Jtcyhtb2RlbCwgZGVmKSB7XG4gIHZhciB0eCA9IG5ldyB0cmFuc2Zvcm1zW2RlZi50eXBlXShtb2RlbC5ncmFwaCk7XG4gIGlmKGRlZi50eXBlID09ICdmYWNldCcpIHtcbiAgICB2YXIgcGlwZWxpbmUgPSAoZGVmLnRyYW5zZm9ybXx8W10pXG4gICAgICAubWFwKGZ1bmN0aW9uKHQpIHsgcmV0dXJuIHBhcnNlVHJhbnNmb3Jtcyhtb2RlbCwgdCk7IH0pO1xuICAgIHR4LnBpcGVsaW5lKHBpcGVsaW5lKTtcbiAgfVxuXG4gIC8vIFdlIHdhbnQgdG8gcmVuYW1lIG91dHB1dCBmaWVsZHMgYmVmb3JlIHNldHRpbmcgYW55IG90aGVyIHByb3BlcnRpZXMsXG4gIC8vIGFzIHN1YnNlcXVlbnQgcHJvcGVydGllcyBtYXkgcmVxdWlyZSBvdXRwdXQgdG8gYmUgc2V0IChlLmcuIGdyb3VwIGJ5KS5cbiAgaWYoZGVmLm91dHB1dCkgdHgub3V0cHV0KGRlZi5vdXRwdXQpO1xuXG4gIGRsLmtleXMoZGVmKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICBpZihrID09PSAndHlwZScgfHwgayA9PT0gJ291dHB1dCcpIHJldHVybjtcbiAgICBpZihrID09PSAndHJhbnNmb3JtJyAmJiBkZWYudHlwZSA9PT0gJ2ZhY2V0JykgcmV0dXJuO1xuICAgICh0eFtrXSkuc2V0KHR4LCBkZWZba10pO1xuICB9KTtcblxuICByZXR1cm4gdHg7XG59OyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICAgIG1hcmtzID0gcmVxdWlyZSgnLi9tYXJrcycpO1xuXG52YXIgaGFuZGxlciA9IGZ1bmN0aW9uKGVsLCBtb2RlbCkge1xuICB0aGlzLl9hY3RpdmUgPSBudWxsO1xuICB0aGlzLl9oYW5kbGVycyA9IHt9O1xuICBpZiAoZWwpIHRoaXMuaW5pdGlhbGl6ZShlbCk7XG4gIGlmIChtb2RlbCkgdGhpcy5tb2RlbChtb2RlbCk7XG59O1xuXG52YXIgcHJvdG90eXBlID0gaGFuZGxlci5wcm90b3R5cGU7XG5cbnByb3RvdHlwZS5pbml0aWFsaXplID0gZnVuY3Rpb24oZWwsIHBhZCwgb2JqKSB7XG4gIHRoaXMuX2VsID0gZDMuc2VsZWN0KGVsKS5ub2RlKCk7XG4gIHRoaXMuX2NhbnZhcyA9IGQzLnNlbGVjdChlbCkuc2VsZWN0KFwiY2FudmFzLm1hcmtzXCIpLm5vZGUoKTtcbiAgdGhpcy5fcGFkZGluZyA9IHBhZDtcbiAgdGhpcy5fb2JqID0gb2JqIHx8IG51bGw7XG4gIFxuICAvLyBhZGQgZXZlbnQgbGlzdGVuZXJzXG4gIHZhciBjYW52YXMgPSB0aGlzLl9jYW52YXMsIHRoYXQgPSB0aGlzO1xuICBldmVudHMuZm9yRWFjaChmdW5jdGlvbih0eXBlKSB7XG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZnVuY3Rpb24oZXZ0KSB7XG4gICAgICBwcm90b3R5cGVbdHlwZV0uY2FsbCh0aGF0LCBldnQpO1xuICAgIH0pO1xuICB9KTtcbiAgXG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLnBhZGRpbmcgPSBmdW5jdGlvbihwYWQpIHtcbiAgdGhpcy5fcGFkZGluZyA9IHBhZDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUubW9kZWwgPSBmdW5jdGlvbihtb2RlbCkge1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9tb2RlbDtcbiAgdGhpcy5fbW9kZWwgPSBtb2RlbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUuaGFuZGxlcnMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGggPSB0aGlzLl9oYW5kbGVycztcbiAgcmV0dXJuIGRsLmtleXMoaCkucmVkdWNlKGZ1bmN0aW9uKGEsIGspIHtcbiAgICByZXR1cm4gaFtrXS5yZWR1Y2UoZnVuY3Rpb24oYSwgeCkgeyByZXR1cm4gKGEucHVzaCh4KSwgYSk7IH0sIGEpO1xuICB9LCBbXSk7XG59O1xuXG4vLyBzZXR1cCBldmVudHNcbnZhciBldmVudHMgPSBbXG4gIFwibW91c2Vkb3duXCIsXG4gIFwibW91c2V1cFwiLFxuICBcImNsaWNrXCIsXG4gIFwiZGJsY2xpY2tcIixcbiAgXCJ3aGVlbFwiLFxuICBcImtleWRvd25cIixcbiAgXCJrZXlwcmVzc1wiLFxuICBcImtleXVwXCIsXG4gIFwibW91c2V3aGVlbFwiLFxuICBcInRvdWNoc3RhcnRcIlxuXTtcbmV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHR5cGUpIHtcbiAgcHJvdG90eXBlW3R5cGVdID0gZnVuY3Rpb24oZXZ0KSB7XG4gICAgdGhpcy5maXJlKHR5cGUsIGV2dCk7XG4gIH07XG59KTtcbmV2ZW50cy5wdXNoKFwibW91c2Vtb3ZlXCIpO1xuZXZlbnRzLnB1c2goXCJtb3VzZW91dFwiKTtcbmV2ZW50cy5wdXNoKFwidG91Y2htb3ZlXCIpO1xuZXZlbnRzLnB1c2goXCJ0b3VjaGVuZFwiKTtcblxuZnVuY3Rpb24gZXZlbnROYW1lKG5hbWUpIHtcbiAgdmFyIGkgPSBuYW1lLmluZGV4T2YoXCIuXCIpO1xuICByZXR1cm4gaSA8IDAgPyBuYW1lIDogbmFtZS5zbGljZSgwLGkpO1xufVxuXG5wcm90b3R5cGUudG91Y2htb3ZlID0gcHJvdG90eXBlLm1vdXNlbW92ZSA9IGZ1bmN0aW9uKGV2dCkge1xuICB2YXIgcGFkID0gdGhpcy5fcGFkZGluZyxcbiAgICAgIGIgPSBldnQudGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgeCA9IGV2dC5jbGllbnRYIC0gYi5sZWZ0LFxuICAgICAgeSA9IGV2dC5jbGllbnRZIC0gYi50b3AsXG4gICAgICBhID0gdGhpcy5fYWN0aXZlLFxuICAgICAgcCA9IHRoaXMucGljayh0aGlzLl9tb2RlbC5zY2VuZSgpLCB4LCB5LCB4LXBhZC5sZWZ0LCB5LXBhZC50b3ApO1xuXG4gIGlmIChwID09PSBhKSB7XG4gICAgdGhpcy5maXJlKFwibW91c2Vtb3ZlXCIsIGV2dCk7XG4gICAgaWYoZXZ0LnR5cGUgPT0gXCJ0b3VjaG1vdmVcIikgdGhpcy5maXJlKFwidG91Y2htb3ZlXCIsIGV2dCk7XG4gICAgcmV0dXJuO1xuICB9IGVsc2UgaWYgKGEpIHtcbiAgICB0aGlzLmZpcmUoXCJtb3VzZW91dFwiLCBldnQpO1xuICAgIGlmKGV2dC50eXBlID09IFwidG91Y2hlbmRcIikgdGhpcy5maXJlKFwidG91Y2hlbmRcIiwgZXZ0KTtcbiAgfVxuICB0aGlzLl9hY3RpdmUgPSBwO1xuICBpZiAocCkge1xuICAgIHRoaXMuZmlyZShcIm1vdXNlb3ZlclwiLCBldnQpO1xuICAgIGlmKGV2dC50eXBlID09IFwidG91Y2hzdGFydFwiKSB0aGlzLmZpcmUoXCJ0b3VjaHN0YXJ0XCIsIGV2dCk7XG4gIH1cbn07XG5cbnByb3RvdHlwZS50b3VjaGVuZCA9IHByb3RvdHlwZS5tb3VzZW91dCA9IGZ1bmN0aW9uKGV2dCkge1xuICBpZiAodGhpcy5fYWN0aXZlKSB7XG4gICAgdGhpcy5maXJlKFwibW91c2VvdXRcIiwgZXZ0KTtcbiAgICB0aGlzLmZpcmUoXCJ0b3VjaGVuZFwiLCBldnQpO1xuICB9XG4gIHRoaXMuX2FjdGl2ZSA9IG51bGw7XG59O1xuXG4vLyB0byBrZWVwIGZpcmVmb3ggaGFwcHlcbnByb3RvdHlwZS5ET01Nb3VzZVNjcm9sbCA9IGZ1bmN0aW9uKGV2dCkge1xuICB0aGlzLmZpcmUoXCJtb3VzZXdoZWVsXCIsIGV2dCk7XG59O1xuXG4vLyBmaXJlIGFuIGV2ZW50XG5wcm90b3R5cGUuZmlyZSA9IGZ1bmN0aW9uKHR5cGUsIGV2dCkge1xuICB2YXIgYSA9IHRoaXMuX2FjdGl2ZSxcbiAgICAgIGggPSB0aGlzLl9oYW5kbGVyc1t0eXBlXTtcbiAgaWYgKGgpIHtcbiAgICBmb3IgKHZhciBpPTAsIGxlbj1oLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgICAgaFtpXS5oYW5kbGVyLmNhbGwodGhpcy5fb2JqLCBldnQsIGEpO1xuICAgIH1cbiAgfVxufTtcblxuLy8gYWRkIGFuIGV2ZW50IGhhbmRsZXJcbnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgdmFyIG5hbWUgPSBldmVudE5hbWUodHlwZSksXG4gICAgICBoID0gdGhpcy5faGFuZGxlcnM7XG4gIGggPSBoW25hbWVdIHx8IChoW25hbWVdID0gW10pO1xuICBoLnB1c2goe1xuICAgIHR5cGU6IHR5cGUsXG4gICAgaGFuZGxlcjogaGFuZGxlclxuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyByZW1vdmUgYW4gZXZlbnQgaGFuZGxlclxucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgdmFyIG5hbWUgPSBldmVudE5hbWUodHlwZSksXG4gICAgICBoID0gdGhpcy5faGFuZGxlcnNbbmFtZV07XG4gIGlmICghaCkgcmV0dXJuO1xuICBmb3IgKHZhciBpPWgubGVuZ3RoOyAtLWk+PTA7KSB7XG4gICAgaWYgKGhbaV0udHlwZSAhPT0gdHlwZSkgY29udGludWU7XG4gICAgaWYgKCFoYW5kbGVyIHx8IGhbaV0uaGFuZGxlciA9PT0gaGFuZGxlcikgaC5zcGxpY2UoaSwgMSk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyByZXRyaWV2ZSB0aGUgY3VycmVudCBjYW52YXMgY29udGV4dFxucHJvdG90eXBlLmNvbnRleHQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuX2NhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG59O1xuXG4vLyBmaW5kIHRoZSBzY2VuZWdyYXBoIGl0ZW0gYXQgdGhlIGN1cnJlbnQgbW91c2UgcG9zaXRpb25cbi8vIHgsIHkgLS0gdGhlIGFic29sdXRlIHgsIHkgbW91c2UgY29vcmRpbmF0ZXMgb24gdGhlIGNhbnZhcyBlbGVtZW50XG4vLyBneCwgZ3kgLS0gdGhlIHJlbGF0aXZlIGNvb3JkaW5hdGVzIHdpdGhpbiB0aGUgY3VycmVudCBncm91cFxucHJvdG90eXBlLnBpY2sgPSBmdW5jdGlvbihzY2VuZSwgeCwgeSwgZ3gsIGd5KSB7XG4gIHZhciBnID0gdGhpcy5jb250ZXh0KCksXG4gICAgICBtYXJrdHlwZSA9IHNjZW5lLm1hcmt0eXBlLFxuICAgICAgcGlja2VyID0gbWFya3MucGlja1ttYXJrdHlwZV07XG4gIHJldHVybiBwaWNrZXIuY2FsbCh0aGlzLCBnLCBzY2VuZSwgeCwgeSwgZ3gsIGd5KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaGFuZGxlcjsiLCJ2YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgICBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBCb3VuZHMgPSByZXF1aXJlKCcuLi8uLi9jb3JlL0JvdW5kcycpLFxuICAgIGNvbmZpZyA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvY29uZmlnJyksXG4gICAgbWFya3MgPSByZXF1aXJlKCcuL21hcmtzJyk7XG5cbnZhciByZW5kZXJlciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9jdHggPSBudWxsO1xuICB0aGlzLl9lbCA9IG51bGw7XG4gIHRoaXMuX2ltZ2xvYWQgPSAwO1xufTtcblxudmFyIHByb3RvdHlwZSA9IHJlbmRlcmVyLnByb3RvdHlwZTtcblxucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbihlbCwgd2lkdGgsIGhlaWdodCwgcGFkKSB7XG4gIHRoaXMuX2VsID0gZWw7XG4gIFxuICBpZiAoIWVsKSByZXR1cm4gdGhpczsgLy8gZWFybHkgZXhpdCBpZiBubyBET00gZWxlbWVudFxuXG4gIC8vIHNlbGVjdCBjYW52YXMgZWxlbWVudFxuICB2YXIgY2FudmFzID0gZDMuc2VsZWN0KGVsKVxuICAgIC5zZWxlY3RBbGwoXCJjYW52YXMubWFya3NcIilcbiAgICAuZGF0YShbMV0pO1xuICBcbiAgLy8gY3JlYXRlIG5ldyBjYW52YXMgZWxlbWVudCBpZiBuZWVkZWRcbiAgY2FudmFzLmVudGVyKClcbiAgICAuYXBwZW5kKFwiY2FudmFzXCIpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcIm1hcmtzXCIpO1xuICBcbiAgLy8gcmVtb3ZlIGV4dHJhbmVvdXMgY2FudmFzIGlmIG5lZWRlZFxuICBjYW52YXMuZXhpdCgpLnJlbW92ZSgpO1xuICBcbiAgcmV0dXJuIHRoaXMucmVzaXplKHdpZHRoLCBoZWlnaHQsIHBhZCk7XG59O1xuXG5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgcGFkKSB7XG4gIHRoaXMuX3dpZHRoID0gd2lkdGg7XG4gIHRoaXMuX2hlaWdodCA9IGhlaWdodDtcbiAgdGhpcy5fcGFkZGluZyA9IHBhZDtcbiAgXG4gIGlmICh0aGlzLl9lbCkge1xuICAgIHZhciBjYW52YXMgPSBkMy5zZWxlY3QodGhpcy5fZWwpLnNlbGVjdChcImNhbnZhcy5tYXJrc1wiKTtcblxuICAgIC8vIGluaXRpYWxpemUgY2FudmFzIGF0dHJpYnV0ZXNcbiAgICBjYW52YXNcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBwYWQubGVmdCArIHBhZC5yaWdodClcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIHBhZC50b3AgKyBwYWQuYm90dG9tKTtcblxuICAgIC8vIGdldCB0aGUgY2FudmFzIGdyYXBoaWNzIGNvbnRleHRcbiAgICB2YXIgcztcbiAgICB0aGlzLl9jdHggPSBjYW52YXMubm9kZSgpLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICB0aGlzLl9jdHguX3JhdGlvID0gKHMgPSBzY2FsZUNhbnZhcyhjYW52YXMubm9kZSgpLCB0aGlzLl9jdHgpIHx8IDEpO1xuICAgIHRoaXMuX2N0eC5zZXRUcmFuc2Zvcm0ocywgMCwgMCwgcywgcypwYWQubGVmdCwgcypwYWQudG9wKTtcbiAgfVxuICBcbiAgaW5pdGlhbGl6ZUxpbmVEYXNoKHRoaXMuX2N0eCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuZnVuY3Rpb24gc2NhbGVDYW52YXMoY2FudmFzLCBjdHgpIHtcbiAgLy8gZ2V0IGNhbnZhcyBwaXhlbCBkYXRhXG4gIHZhciBkZXZpY2VQaXhlbFJhdGlvID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMSxcbiAgICAgIGJhY2tpbmdTdG9yZVJhdGlvID0gKFxuICAgICAgICBjdHgud2Via2l0QmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fFxuICAgICAgICBjdHgubW96QmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fFxuICAgICAgICBjdHgubXNCYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XG4gICAgICAgIGN0eC5vQmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fFxuICAgICAgICBjdHguYmFja2luZ1N0b3JlUGl4ZWxSYXRpbykgfHwgMSxcbiAgICAgIHJhdGlvID0gZGV2aWNlUGl4ZWxSYXRpbyAvIGJhY2tpbmdTdG9yZVJhdGlvO1xuXG4gIGlmIChkZXZpY2VQaXhlbFJhdGlvICE9PSBiYWNraW5nU3RvcmVSYXRpbykge1xuICAgIHZhciB3ID0gY2FudmFzLndpZHRoLCBoID0gY2FudmFzLmhlaWdodDtcbiAgICAvLyBzZXQgYWN0dWFsIGFuZCB2aXNpYmxlIGNhbnZhcyBzaXplXG4gICAgY2FudmFzLnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIHcgKiByYXRpbyk7XG4gICAgY2FudmFzLnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCBoICogcmF0aW8pO1xuICAgIGNhbnZhcy5zdHlsZS53aWR0aCA9IHcgKyAncHgnO1xuICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBoICsgJ3B4JztcbiAgfVxuICByZXR1cm4gcmF0aW87XG59XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVMaW5lRGFzaChjdHgpIHtcbiAgaWYgKGN0eC52Z0xpbmVEYXNoKSByZXR1cm47IC8vIGFscmVhZHkgc2V0XG5cbiAgdmFyIE5PREFTSCA9IFtdO1xuICBpZiAoY3R4LnNldExpbmVEYXNoKSB7XG4gICAgY3R4LnZnTGluZURhc2ggPSBmdW5jdGlvbihkYXNoKSB7IHRoaXMuc2V0TGluZURhc2goZGFzaCB8fCBOT0RBU0gpOyB9O1xuICAgIGN0eC52Z0xpbmVEYXNoT2Zmc2V0ID0gZnVuY3Rpb24ob2ZmKSB7IHRoaXMubGluZURhc2hPZmZzZXQgPSBvZmY7IH07XG4gIH0gZWxzZSBpZiAoY3R4LndlYmtpdExpbmVEYXNoICE9PSB1bmRlZmluZWQpIHtcbiAgXHRjdHgudmdMaW5lRGFzaCA9IGZ1bmN0aW9uKGRhc2gpIHsgdGhpcy53ZWJraXRMaW5lRGFzaCA9IGRhc2ggfHwgTk9EQVNIOyB9O1xuICAgIGN0eC52Z0xpbmVEYXNoT2Zmc2V0ID0gZnVuY3Rpb24ob2ZmKSB7IHRoaXMud2Via2l0TGluZURhc2hPZmZzZXQgPSBvZmY7IH07XG4gIH0gZWxzZSBpZiAoY3R4Lm1vekRhc2ggIT09IHVuZGVmaW5lZCkge1xuICAgIGN0eC52Z0xpbmVEYXNoID0gZnVuY3Rpb24oZGFzaCkgeyB0aGlzLm1vekRhc2ggPSBkYXNoOyB9O1xuICAgIGN0eC52Z0xpbmVEYXNoT2Zmc2V0ID0gZnVuY3Rpb24ob2ZmKSB7IC8qIHVuc3VwcG9ydGVkICovIH07XG4gIH0gZWxzZSB7XG4gICAgY3R4LnZnTGluZURhc2ggPSBmdW5jdGlvbihkYXNoKSB7IC8qIHVuc3VwcG9ydGVkICovIH07XG4gICAgY3R4LnZnTGluZURhc2hPZmZzZXQgPSBmdW5jdGlvbihvZmYpIHsgLyogdW5zdXBwb3J0ZWQgKi8gfTtcbiAgfVxufVxuXG5wcm90b3R5cGUuY29udGV4dCA9IGZ1bmN0aW9uKGN0eCkge1xuICBpZiAoY3R4KSB7IHRoaXMuX2N0eCA9IGN0eDsgcmV0dXJuIHRoaXM7IH1cbiAgZWxzZSByZXR1cm4gdGhpcy5fY3R4O1xufTtcblxucHJvdG90eXBlLmVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuX2VsO1xufTtcblxucHJvdG90eXBlLnBlbmRpbmdJbWFnZXMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuX2ltZ2xvYWQ7XG59O1xuXG5mdW5jdGlvbiB0cmFuc2xhdGVkQm91bmRzKGl0ZW0sIGJvdW5kcykge1xuICB2YXIgYiA9IG5ldyBCb3VuZHMoYm91bmRzKTtcbiAgd2hpbGUgKChpdGVtID0gaXRlbS5tYXJrLmdyb3VwKSAhPSBudWxsKSB7XG4gICAgYi50cmFuc2xhdGUoaXRlbS54IHx8IDAsIGl0ZW0ueSB8fCAwKTtcbiAgfVxuICByZXR1cm4gYjtcbn1cbiAgXG5mdW5jdGlvbiBnZXRCb3VuZHMoaXRlbXMpIHtcbiAgcmV0dXJuICFpdGVtcyA/IG51bGwgOlxuICAgIGRsLmFycmF5KGl0ZW1zKS5yZWR1Y2UoZnVuY3Rpb24oYiwgaXRlbSkge1xuICAgICAgcmV0dXJuIGIudW5pb24odHJhbnNsYXRlZEJvdW5kcyhpdGVtLCBpdGVtLmJvdW5kcykpXG4gICAgICAgICAgICAgIC51bmlvbih0cmFuc2xhdGVkQm91bmRzKGl0ZW0sIGl0ZW1bJ2JvdW5kczpwcmV2J10pKTtcbiAgICB9LCBuZXcgQm91bmRzKCkpOyAgXG59XG5cbmZ1bmN0aW9uIHNldEJvdW5kcyhnLCBib3VuZHMpIHtcbiAgdmFyIGJib3ggPSBudWxsO1xuICBpZiAoYm91bmRzKSB7XG4gICAgYmJveCA9IChuZXcgQm91bmRzKGJvdW5kcykpLnJvdW5kKCk7XG4gICAgZy5iZWdpblBhdGgoKTtcbiAgICBnLnJlY3QoYmJveC54MSwgYmJveC55MSwgYmJveC53aWR0aCgpLCBiYm94LmhlaWdodCgpKTtcbiAgICBnLmNsaXAoKTtcbiAgfVxuICByZXR1cm4gYmJveDtcbn1cblxucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKHNjZW5lLCBpdGVtcykge1xuICB2YXIgZyA9IHRoaXMuX2N0eCxcbiAgICAgIHBhZCA9IHRoaXMuX3BhZGRpbmcsXG4gICAgICB3ID0gdGhpcy5fd2lkdGggKyBwYWQubGVmdCArIHBhZC5yaWdodCxcbiAgICAgIGggPSB0aGlzLl9oZWlnaHQgKyBwYWQudG9wICsgcGFkLmJvdHRvbSxcbiAgICAgIGJiID0gbnVsbCwgYmIyO1xuXG4gIC8vIHNldHVwXG4gIHRoaXMuX3NjZW5lID0gc2NlbmU7XG4gIGcuc2F2ZSgpO1xuICBiYiA9IHNldEJvdW5kcyhnLCBnZXRCb3VuZHMoaXRlbXMpKTtcbiAgZy5jbGVhclJlY3QoLXBhZC5sZWZ0LCAtcGFkLnRvcCwgdywgaCk7XG5cbiAgLy8gcmVuZGVyXG4gIHRoaXMuZHJhdyhnLCBzY2VuZSwgYmIpO1xuXG4gIC8vIHJlbmRlciBhZ2FpbiB0byBoYW5kbGUgcG9zc2libGUgYm91bmRzIGNoYW5nZVxuICBpZiAoaXRlbXMpIHtcbiAgICBnLnJlc3RvcmUoKTtcbiAgICBnLnNhdmUoKTtcbiAgICBiYjIgPSBzZXRCb3VuZHMoZywgZ2V0Qm91bmRzKGl0ZW1zKSk7XG4gICAgaWYgKCFiYi5lbmNsb3NlcyhiYjIpKSB7XG4gICAgICBnLmNsZWFyUmVjdCgtcGFkLmxlZnQsIC1wYWQudG9wLCB3LCBoKTtcbiAgICAgIHRoaXMuZHJhdyhnLCBzY2VuZSwgYmIyKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHRha2Vkb3duXG4gIGcucmVzdG9yZSgpO1xuICB0aGlzLl9zY2VuZSA9IG51bGw7XG59O1xuXG5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGN0eCwgc2NlbmUsIGJvdW5kcykge1xuICB2YXIgbWFya3R5cGUgPSBzY2VuZS5tYXJrdHlwZSxcbiAgICAgIHJlbmRlcmVyID0gbWFya3MuZHJhd1ttYXJrdHlwZV07XG4gIHJlbmRlcmVyLmNhbGwodGhpcywgY3R4LCBzY2VuZSwgYm91bmRzKTtcbn07XG5cbnByb3RvdHlwZS5yZW5kZXJBc3luYyA9IGZ1bmN0aW9uKHNjZW5lKSB7XG4gIC8vIFRPRE8gbWFrZSBzYWZlIGZvciBtdWx0aXBsZSBzY2VuZSByZW5kZXJpbmc/XG4gIHZhciByZW5kZXJlciA9IHRoaXM7XG4gIGlmIChyZW5kZXJlci5fYXN5bmNfaWQpIHtcbiAgICBjbGVhclRpbWVvdXQocmVuZGVyZXIuX2FzeW5jX2lkKTtcbiAgfVxuICByZW5kZXJlci5fYXN5bmNfaWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIHJlbmRlcmVyLnJlbmRlcihzY2VuZSk7XG4gICAgZGVsZXRlIHJlbmRlcmVyLl9hc3luY19pZDtcbiAgfSwgNTApO1xufTtcblxucHJvdG90eXBlLmxvYWRJbWFnZSA9IGZ1bmN0aW9uKHVyaSkge1xuICB2YXIgcmVuZGVyZXIgPSB0aGlzLFxuICAgICAgc2NlbmUgPSByZW5kZXJlci5fc2NlbmUsXG4gICAgICBpbWFnZSA9IG51bGwsIHVybDtcblxuICByZW5kZXJlci5faW1nbG9hZCArPSAxO1xuICBpZiAoZGwuaXNOb2RlKSB7XG4gICAgaW1hZ2UgPSBuZXcgKCh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmNhbnZhcyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuY2FudmFzIDogbnVsbCkuSW1hZ2UpKCk7XG4gICAgZGwubG9hZChkbC5leHRlbmQoe3VybDogdXJpfSwgY29uZmlnLmxvYWQpLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgIGlmIChlcnIpIHsgZGwuZXJyb3IoZXJyKTsgcmV0dXJuOyB9XG4gICAgICBpbWFnZS5zcmMgPSBkYXRhO1xuICAgICAgaW1hZ2UubG9hZGVkID0gdHJ1ZTtcbiAgICAgIHJlbmRlcmVyLl9pbWdsb2FkIC09IDE7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICB1cmwgPSBjb25maWcuYmFzZVVSTCArIHVyaTtcbiAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGltYWdlLmxvYWRlZCA9IHRydWU7XG4gICAgICByZW5kZXJlci5faW1nbG9hZCAtPSAxO1xuICAgICAgcmVuZGVyZXIucmVuZGVyQXN5bmMoc2NlbmUpO1xuICAgIH07XG4gICAgaW1hZ2Uuc3JjID0gdXJsO1xuICB9XG5cbiAgcmV0dXJuIGltYWdlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZW5kZXJlcjsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgSGFuZGxlcjogIHJlcXVpcmUoJy4vSGFuZGxlcicpLFxuICBSZW5kZXJlcjogcmVxdWlyZSgnLi9SZW5kZXJlcicpXG59OyIsInZhciBCb3VuZHMgPSByZXF1aXJlKCcuLi8uLi9jb3JlL0JvdW5kcycpLFxuICAgIGJvdW5kc0NhbGMgPSByZXF1aXJlKCcuLi8uLi91dGlsL2JvdW5kcycpLFxuICAgIGNvbmZpZyA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvY29uZmlnJyksXG4gICAgcGF0aCA9IHJlcXVpcmUoJy4vcGF0aCcpO1xuXG52YXIgcGFyc2VQYXRoID0gcGF0aC5wYXJzZSxcbiAgICByZW5kZXJQYXRoID0gcGF0aC5yZW5kZXIsXG4gICAgaGFsZnBpID0gTWF0aC5QSSAvIDIsXG4gICAgc3FydDMgPSBNYXRoLnNxcnQoMyksXG4gICAgdGFuMzAgPSBNYXRoLnRhbigzMCAqIE1hdGguUEkgLyAxODApLFxuICAgIHRtcEJvdW5kcyA9IG5ldyBCb3VuZHMoKTtcblxuZnVuY3Rpb24gZm9udFN0cmluZyhvKSB7XG4gIHJldHVybiAoby5mb250U3R5bGUgPyBvLmZvbnRTdHlsZSArIFwiIFwiIDogXCJcIilcbiAgICArIChvLmZvbnRWYXJpYW50ID8gby5mb250VmFyaWFudCArIFwiIFwiIDogXCJcIilcbiAgICArIChvLmZvbnRXZWlnaHQgPyBvLmZvbnRXZWlnaHQgKyBcIiBcIiA6IFwiXCIpXG4gICAgKyAoby5mb250U2l6ZSAhPSBudWxsID8gby5mb250U2l6ZSA6IGNvbmZpZy5yZW5kZXIuZm9udFNpemUpICsgXCJweCBcIlxuICAgICsgKG8uZm9udCB8fCBjb25maWcucmVuZGVyLmZvbnQpO1xufVxuXG4vLyBwYXRoIGdlbmVyYXRvcnNcblxuZnVuY3Rpb24gYXJjUGF0aChnLCBvKSB7XG4gIHZhciB4ID0gby54IHx8IDAsXG4gICAgICB5ID0gby55IHx8IDAsXG4gICAgICBpciA9IG8uaW5uZXJSYWRpdXMgfHwgMCxcbiAgICAgIG9yID0gby5vdXRlclJhZGl1cyB8fCAwLFxuICAgICAgc2EgPSAoby5zdGFydEFuZ2xlIHx8IDApIC0gTWF0aC5QSS8yLFxuICAgICAgZWEgPSAoby5lbmRBbmdsZSB8fCAwKSAtIE1hdGguUEkvMjtcbiAgZy5iZWdpblBhdGgoKTtcbiAgaWYgKGlyID09PSAwKSBnLm1vdmVUbyh4LCB5KTtcbiAgZWxzZSBnLmFyYyh4LCB5LCBpciwgc2EsIGVhLCAwKTtcbiAgZy5hcmMoeCwgeSwgb3IsIGVhLCBzYSwgMSk7XG4gIGcuY2xvc2VQYXRoKCk7XG59XG5cbmZ1bmN0aW9uIGFyZWFQYXRoKGcsIGl0ZW1zKSB7XG4gIHZhciBvID0gaXRlbXNbMF0sXG4gICAgICBtID0gby5tYXJrLFxuICAgICAgcCA9IG0ucGF0aENhY2hlIHx8IChtLnBhdGhDYWNoZSA9IHBhcnNlUGF0aChwYXRoLmFyZWEoaXRlbXMpKSk7XG4gIHJlbmRlclBhdGgoZywgcCk7XG59XG5cbmZ1bmN0aW9uIGxpbmVQYXRoKGcsIGl0ZW1zKSB7XG4gIHZhciBvID0gaXRlbXNbMF0sXG4gICAgICBtID0gby5tYXJrLFxuICAgICAgcCA9IG0ucGF0aENhY2hlIHx8IChtLnBhdGhDYWNoZSA9IHBhcnNlUGF0aChwYXRoLmxpbmUoaXRlbXMpKSk7XG4gIHJlbmRlclBhdGgoZywgcCk7XG59XG5cbmZ1bmN0aW9uIHBhdGhQYXRoKGcsIG8pIHtcbiAgaWYgKG8ucGF0aCA9PSBudWxsKSByZXR1cm47XG4gIHZhciBwID0gby5wYXRoQ2FjaGUgfHwgKG8ucGF0aENhY2hlID0gcGFyc2VQYXRoKG8ucGF0aCkpO1xuICByZXR1cm4gcmVuZGVyUGF0aChnLCBwLCBvLngsIG8ueSk7XG59XG5cbmZ1bmN0aW9uIHN5bWJvbFBhdGgoZywgbykge1xuICBnLmJlZ2luUGF0aCgpO1xuICB2YXIgc2l6ZSA9IG8uc2l6ZSAhPSBudWxsID8gby5zaXplIDogMTAwLFxuICAgICAgeCA9IG8ueCwgeSA9IG8ueSwgciwgdCwgcngsIHJ5O1xuXG4gIGlmIChvLnNoYXBlID09IG51bGwgfHwgby5zaGFwZSA9PT0gXCJjaXJjbGVcIikge1xuICAgIHIgPSBNYXRoLnNxcnQoc2l6ZS9NYXRoLlBJKTtcbiAgICBnLmFyYyh4LCB5LCByLCAwLCAyKk1hdGguUEksIDApO1xuICAgIGcuY2xvc2VQYXRoKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgc3dpdGNoIChvLnNoYXBlKSB7XG4gICAgY2FzZSBcImNyb3NzXCI6XG4gICAgICByID0gTWF0aC5zcXJ0KHNpemUgLyA1KSAvIDI7XG4gICAgICB0ID0gMypyO1xuICAgICAgZy5tb3ZlVG8oeC10LCB5LXIpO1xuICAgICAgZy5saW5lVG8oeC1yLCB5LXIpO1xuICAgICAgZy5saW5lVG8oeC1yLCB5LXQpO1xuICAgICAgZy5saW5lVG8oeCtyLCB5LXQpO1xuICAgICAgZy5saW5lVG8oeCtyLCB5LXIpO1xuICAgICAgZy5saW5lVG8oeCt0LCB5LXIpO1xuICAgICAgZy5saW5lVG8oeCt0LCB5K3IpO1xuICAgICAgZy5saW5lVG8oeCtyLCB5K3IpO1xuICAgICAgZy5saW5lVG8oeCtyLCB5K3QpO1xuICAgICAgZy5saW5lVG8oeC1yLCB5K3QpO1xuICAgICAgZy5saW5lVG8oeC1yLCB5K3IpO1xuICAgICAgZy5saW5lVG8oeC10LCB5K3IpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIFwiZGlhbW9uZFwiOlxuICAgICAgcnkgPSBNYXRoLnNxcnQoc2l6ZSAvICgyICogdGFuMzApKTtcbiAgICAgIHJ4ID0gcnkgKiB0YW4zMDtcbiAgICAgIGcubW92ZVRvKHgsIHktcnkpO1xuICAgICAgZy5saW5lVG8oeCtyeCwgeSk7XG4gICAgICBnLmxpbmVUbyh4LCB5K3J5KTtcbiAgICAgIGcubGluZVRvKHgtcngsIHkpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIFwic3F1YXJlXCI6XG4gICAgICB0ID0gTWF0aC5zcXJ0KHNpemUpO1xuICAgICAgciA9IHQgLyAyO1xuICAgICAgZy5yZWN0KHgtciwgeS1yLCB0LCB0KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBcInRyaWFuZ2xlLWRvd25cIjpcbiAgICAgIHJ4ID0gTWF0aC5zcXJ0KHNpemUgLyBzcXJ0Myk7XG4gICAgICByeSA9IHJ4ICogc3FydDMgLyAyO1xuICAgICAgZy5tb3ZlVG8oeCwgeStyeSk7XG4gICAgICBnLmxpbmVUbyh4K3J4LCB5LXJ5KTtcbiAgICAgIGcubGluZVRvKHgtcngsIHktcnkpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIFwidHJpYW5nbGUtdXBcIjpcbiAgICAgIHJ4ID0gTWF0aC5zcXJ0KHNpemUgLyBzcXJ0Myk7XG4gICAgICByeSA9IHJ4ICogc3FydDMgLyAyO1xuICAgICAgZy5tb3ZlVG8oeCwgeS1yeSk7XG4gICAgICBnLmxpbmVUbyh4K3J4LCB5K3J5KTtcbiAgICAgIGcubGluZVRvKHgtcngsIHkrcnkpO1xuICB9XG4gIGcuY2xvc2VQYXRoKCk7XG59XG5cbmZ1bmN0aW9uIGxpbmVTdHJva2UoZywgaXRlbXMpIHtcbiAgdmFyIG8gPSBpdGVtc1swXSxcbiAgICAgIGx3ID0gby5zdHJva2VXaWR0aCxcbiAgICAgIGxjID0gby5zdHJva2VDYXA7XG4gIGcubGluZVdpZHRoID0gbHcgIT0gbnVsbCA/IGx3IDogY29uZmlnLnJlbmRlci5saW5lV2lkdGg7XG4gIGcubGluZUNhcCAgID0gbGMgIT0gbnVsbCA/IGxjIDogY29uZmlnLnJlbmRlci5saW5lQ2FwO1xuICBsaW5lUGF0aChnLCBpdGVtcyk7XG59XG5cbmZ1bmN0aW9uIHJ1bGVTdHJva2UoZywgbykge1xuICB2YXIgeDEgPSBvLnggfHwgMCxcbiAgICAgIHkxID0gby55IHx8IDAsXG4gICAgICB4MiA9IG8ueDIgIT0gbnVsbCA/IG8ueDIgOiB4MSxcbiAgICAgIHkyID0gby55MiAhPSBudWxsID8gby55MiA6IHkxLFxuICAgICAgbHcgPSBvLnN0cm9rZVdpZHRoLFxuICAgICAgbGMgPSBvLnN0cm9rZUNhcDtcblxuICBnLmxpbmVXaWR0aCA9IGx3ICE9IG51bGwgPyBsdyA6IGNvbmZpZy5yZW5kZXIubGluZVdpZHRoO1xuICBnLmxpbmVDYXAgICA9IGxjICE9IG51bGwgPyBsYyA6IGNvbmZpZy5yZW5kZXIubGluZUNhcDtcbiAgZy5iZWdpblBhdGgoKTtcbiAgZy5tb3ZlVG8oeDEsIHkxKTtcbiAgZy5saW5lVG8oeDIsIHkyKTtcbn1cblxuLy8gZHJhd2luZyBmdW5jdGlvbnNcblxuZnVuY3Rpb24gZHJhd1BhdGhPbmUocGF0aCwgZywgbywgaXRlbXMpIHtcbiAgdmFyIGZpbGwgPSBvLmZpbGwsIHN0cm9rZSA9IG8uc3Ryb2tlLCBvcGFjLCBsYywgbHc7XG5cbiAgcGF0aChnLCBpdGVtcyk7XG5cbiAgb3BhYyA9IG8ub3BhY2l0eSA9PSBudWxsID8gMSA6IG8ub3BhY2l0eTtcbiAgaWYgKG9wYWMgPT0gMCB8fCAhZmlsbCAmJiAhc3Ryb2tlKSByZXR1cm47XG5cbiAgaWYgKGZpbGwpIHtcbiAgICBnLmdsb2JhbEFscGhhID0gb3BhYyAqIChvLmZpbGxPcGFjaXR5PT1udWxsID8gMSA6IG8uZmlsbE9wYWNpdHkpO1xuICAgIGcuZmlsbFN0eWxlID0gY29sb3IoZywgbywgZmlsbCk7XG4gICAgZy5maWxsKCk7XG4gIH1cblxuICBpZiAoc3Ryb2tlKSB7XG4gICAgbHcgPSAobHcgPSBvLnN0cm9rZVdpZHRoKSAhPSBudWxsID8gbHcgOiBjb25maWcucmVuZGVyLmxpbmVXaWR0aDtcbiAgICBpZiAobHcgPiAwKSB7XG4gICAgICBnLmdsb2JhbEFscGhhID0gb3BhYyAqIChvLnN0cm9rZU9wYWNpdHk9PW51bGwgPyAxIDogby5zdHJva2VPcGFjaXR5KTtcbiAgICAgIGcuc3Ryb2tlU3R5bGUgPSBjb2xvcihnLCBvLCBzdHJva2UpO1xuICAgICAgZy5saW5lV2lkdGggPSBsdztcbiAgICAgIGcubGluZUNhcCA9IChsYyA9IG8uc3Ryb2tlQ2FwKSAhPSBudWxsID8gbGMgOiBjb25maWcucmVuZGVyLmxpbmVDYXA7XG4gICAgICBnLnZnTGluZURhc2goby5zdHJva2VEYXNoIHx8IG51bGwpO1xuICAgICAgZy52Z0xpbmVEYXNoT2Zmc2V0KG8uc3Ryb2tlRGFzaE9mZnNldCB8fCAwKTtcbiAgICAgIGcuc3Ryb2tlKCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRyYXdQYXRoQWxsKHBhdGgsIGcsIHNjZW5lLCBib3VuZHMpIHtcbiAgdmFyIGksIGxlbiwgaXRlbTtcbiAgZm9yIChpPTAsIGxlbj1zY2VuZS5pdGVtcy5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBpdGVtID0gc2NlbmUuaXRlbXNbaV07XG4gICAgaWYgKGJvdW5kcyAmJiAhYm91bmRzLmludGVyc2VjdHMoaXRlbS5ib3VuZHMpKVxuICAgICAgY29udGludWU7IC8vIGJvdW5kcyBjaGVja1xuICAgIGRyYXdQYXRoT25lKHBhdGgsIGcsIGl0ZW0sIGl0ZW0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRyYXdSZWN0KGcsIHNjZW5lLCBib3VuZHMpIHtcbiAgaWYgKCFzY2VuZS5pdGVtcy5sZW5ndGgpIHJldHVybjtcbiAgdmFyIGl0ZW1zID0gc2NlbmUuaXRlbXMsXG4gICAgICBvLCBmaWxsLCBzdHJva2UsIG9wYWMsIGxjLCBsdywgeCwgeSwgdywgaDtcblxuICBmb3IgKHZhciBpPTAsIGxlbj1pdGVtcy5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBvID0gaXRlbXNbaV07XG4gICAgaWYgKGJvdW5kcyAmJiAhYm91bmRzLmludGVyc2VjdHMoby5ib3VuZHMpKVxuICAgICAgY29udGludWU7IC8vIGJvdW5kcyBjaGVja1xuXG4gICAgeCA9IG8ueCB8fCAwO1xuICAgIHkgPSBvLnkgfHwgMDtcbiAgICB3ID0gby53aWR0aCB8fCAwO1xuICAgIGggPSBvLmhlaWdodCB8fCAwO1xuXG4gICAgb3BhYyA9IG8ub3BhY2l0eSA9PSBudWxsID8gMSA6IG8ub3BhY2l0eTtcbiAgICBpZiAob3BhYyA9PSAwKSBjb250aW51ZTtcblxuICAgIGlmIChmaWxsID0gby5maWxsKSB7XG4gICAgICBnLmdsb2JhbEFscGhhID0gb3BhYyAqIChvLmZpbGxPcGFjaXR5PT1udWxsID8gMSA6IG8uZmlsbE9wYWNpdHkpO1xuICAgICAgZy5maWxsU3R5bGUgPSBjb2xvcihnLCBvLCBmaWxsKTtcbiAgICAgIGcuZmlsbFJlY3QoeCwgeSwgdywgaCk7XG4gICAgfVxuXG4gICAgaWYgKHN0cm9rZSA9IG8uc3Ryb2tlKSB7XG4gICAgICBsdyA9IChsdyA9IG8uc3Ryb2tlV2lkdGgpICE9IG51bGwgPyBsdyA6IGNvbmZpZy5yZW5kZXIubGluZVdpZHRoO1xuICAgICAgaWYgKGx3ID4gMCkge1xuICAgICAgICBnLmdsb2JhbEFscGhhID0gb3BhYyAqIChvLnN0cm9rZU9wYWNpdHk9PW51bGwgPyAxIDogby5zdHJva2VPcGFjaXR5KTtcbiAgICAgICAgZy5zdHJva2VTdHlsZSA9IGNvbG9yKGcsIG8sIHN0cm9rZSk7XG4gICAgICAgIGcubGluZVdpZHRoID0gbHc7XG4gICAgICAgIGcubGluZUNhcCA9IChsYyA9IG8uc3Ryb2tlQ2FwKSAhPSBudWxsID8gbGMgOiBjb25maWcucmVuZGVyLmxpbmVDYXA7XG4gICAgICAgIGcudmdMaW5lRGFzaChvLnN0cm9rZURhc2ggfHwgbnVsbCk7XG4gICAgICAgIGcudmdMaW5lRGFzaE9mZnNldChvLnN0cm9rZURhc2hPZmZzZXQgfHwgMCk7XG4gICAgICAgIGcuc3Ryb2tlUmVjdCh4LCB5LCB3LCBoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZHJhd1J1bGUoZywgc2NlbmUsIGJvdW5kcykge1xuICBpZiAoIXNjZW5lLml0ZW1zLmxlbmd0aCkgcmV0dXJuO1xuICB2YXIgaXRlbXMgPSBzY2VuZS5pdGVtcyxcbiAgICAgIG8sIHN0cm9rZSwgb3BhYywgbGMsIGx3LCB4MSwgeTEsIHgyLCB5MjtcblxuICBmb3IgKHZhciBpPTAsIGxlbj1pdGVtcy5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBvID0gaXRlbXNbaV07XG4gICAgaWYgKGJvdW5kcyAmJiAhYm91bmRzLmludGVyc2VjdHMoby5ib3VuZHMpKVxuICAgICAgY29udGludWU7IC8vIGJvdW5kcyBjaGVja1xuXG4gICAgeDEgPSBvLnggfHwgMDtcbiAgICB5MSA9IG8ueSB8fCAwO1xuICAgIHgyID0gby54MiAhPSBudWxsID8gby54MiA6IHgxO1xuICAgIHkyID0gby55MiAhPSBudWxsID8gby55MiA6IHkxO1xuXG4gICAgb3BhYyA9IG8ub3BhY2l0eSA9PSBudWxsID8gMSA6IG8ub3BhY2l0eTtcbiAgICBpZiAob3BhYyA9PSAwKSBjb250aW51ZTtcbiAgICBcbiAgICBpZiAoc3Ryb2tlID0gby5zdHJva2UpIHtcbiAgICAgIGx3ID0gKGx3ID0gby5zdHJva2VXaWR0aCkgIT0gbnVsbCA/IGx3IDogY29uZmlnLnJlbmRlci5saW5lV2lkdGg7XG4gICAgICBpZiAobHcgPiAwKSB7XG4gICAgICAgIGcuZ2xvYmFsQWxwaGEgPSBvcGFjICogKG8uc3Ryb2tlT3BhY2l0eT09bnVsbCA/IDEgOiBvLnN0cm9rZU9wYWNpdHkpO1xuICAgICAgICBnLnN0cm9rZVN0eWxlID0gY29sb3IoZywgbywgc3Ryb2tlKTtcbiAgICAgICAgZy5saW5lV2lkdGggPSBsdztcbiAgICAgICAgZy5saW5lQ2FwID0gKGxjID0gby5zdHJva2VDYXApICE9IG51bGwgPyBsYyA6IGNvbmZpZy5yZW5kZXIubGluZUNhcDtcbiAgICAgICAgZy52Z0xpbmVEYXNoKG8uc3Ryb2tlRGFzaCB8fCBudWxsKTtcbiAgICAgICAgZy52Z0xpbmVEYXNoT2Zmc2V0KG8uc3Ryb2tlRGFzaE9mZnNldCB8fCAwKTtcbiAgICAgICAgZy5iZWdpblBhdGgoKTtcbiAgICAgICAgZy5tb3ZlVG8oeDEsIHkxKTtcbiAgICAgICAgZy5saW5lVG8oeDIsIHkyKTtcbiAgICAgICAgZy5zdHJva2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZHJhd0ltYWdlKGcsIHNjZW5lLCBib3VuZHMpIHtcbiAgaWYgKCFzY2VuZS5pdGVtcy5sZW5ndGgpIHJldHVybjtcbiAgdmFyIHJlbmRlcmVyID0gdGhpcyxcbiAgICAgIGl0ZW1zID0gc2NlbmUuaXRlbXMsIG87XG5cbiAgZm9yICh2YXIgaT0wLCBsZW49aXRlbXMubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgbyA9IGl0ZW1zW2ldO1xuICAgIGlmIChib3VuZHMgJiYgIWJvdW5kcy5pbnRlcnNlY3RzKG8uYm91bmRzKSlcbiAgICAgIGNvbnRpbnVlOyAvLyBib3VuZHMgY2hlY2tcblxuICAgIGlmICghKG8uaW1hZ2UgJiYgby5pbWFnZS51cmwgPT09IG8udXJsKSkge1xuICAgICAgby5pbWFnZSA9IHJlbmRlcmVyLmxvYWRJbWFnZShvLnVybCk7XG4gICAgICBvLmltYWdlLnVybCA9IG8udXJsO1xuICAgIH1cblxuICAgIHZhciB4LCB5LCB3LCBoLCBvcGFjO1xuICAgIHcgPSBvLndpZHRoIHx8IChvLmltYWdlICYmIG8uaW1hZ2Uud2lkdGgpIHx8IDA7XG4gICAgaCA9IG8uaGVpZ2h0IHx8IChvLmltYWdlICYmIG8uaW1hZ2UuaGVpZ2h0KSB8fCAwO1xuICAgIHggPSAoby54fHwwKSAtIChvLmFsaWduID09PSBcImNlbnRlclwiXG4gICAgICA/IHcvMiA6IChvLmFsaWduID09PSBcInJpZ2h0XCIgPyB3IDogMCkpO1xuICAgIHkgPSAoby55fHwwKSAtIChvLmJhc2VsaW5lID09PSBcIm1pZGRsZVwiXG4gICAgICA/IGgvMiA6IChvLmJhc2VsaW5lID09PSBcImJvdHRvbVwiID8gaCA6IDApKTtcblxuICAgIGlmIChvLmltYWdlLmxvYWRlZCkge1xuICAgICAgZy5nbG9iYWxBbHBoYSA9IChvcGFjID0gby5vcGFjaXR5KSAhPSBudWxsID8gb3BhYyA6IDE7XG4gICAgICBnLmRyYXdJbWFnZShvLmltYWdlLCB4LCB5LCB3LCBoKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZHJhd1RleHQoZywgc2NlbmUsIGJvdW5kcykge1xuICBpZiAoIXNjZW5lLml0ZW1zLmxlbmd0aCkgcmV0dXJuO1xuICB2YXIgaXRlbXMgPSBzY2VuZS5pdGVtcyxcbiAgICAgIG8sIGZpbGwsIHN0cm9rZSwgb3BhYywgbHcsIHgsIHksIHIsIHQ7XG5cbiAgZm9yICh2YXIgaT0wLCBsZW49aXRlbXMubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgbyA9IGl0ZW1zW2ldO1xuICAgIGlmIChib3VuZHMgJiYgIWJvdW5kcy5pbnRlcnNlY3RzKG8uYm91bmRzKSlcbiAgICAgIGNvbnRpbnVlOyAvLyBib3VuZHMgY2hlY2tcblxuICAgIGcuZm9udCA9IGZvbnRTdHJpbmcobyk7XG4gICAgZy50ZXh0QWxpZ24gPSBvLmFsaWduIHx8IFwibGVmdFwiO1xuICAgIGcudGV4dEJhc2VsaW5lID0gby5iYXNlbGluZSB8fCBcImFscGhhYmV0aWNcIjtcblxuICAgIG9wYWMgPSBvLm9wYWNpdHkgPT0gbnVsbCA/IDEgOiBvLm9wYWNpdHk7XG4gICAgaWYgKG9wYWMgPT0gMCkgY29udGludWU7XG5cbiAgICB4ID0gby54IHx8IDA7XG4gICAgeSA9IG8ueSB8fCAwO1xuICAgIGlmIChyID0gby5yYWRpdXMpIHtcbiAgICAgIHQgPSAoby50aGV0YSB8fCAwKSAtIE1hdGguUEkvMjtcbiAgICAgIHggKz0gciAqIE1hdGguY29zKHQpO1xuICAgICAgeSArPSByICogTWF0aC5zaW4odCk7XG4gICAgfVxuXG4gICAgaWYgKG8uYW5nbGUpIHtcbiAgICAgIGcuc2F2ZSgpO1xuICAgICAgZy50cmFuc2xhdGUoeCwgeSk7XG4gICAgICBnLnJvdGF0ZShvLmFuZ2xlICogTWF0aC5QSS8xODApO1xuICAgICAgeCA9IG8uZHggfHwgMDtcbiAgICAgIHkgPSBvLmR5IHx8IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHggKz0gKG8uZHggfHwgMCk7XG4gICAgICB5ICs9IChvLmR5IHx8IDApO1xuICAgIH1cblxuICAgIGlmIChmaWxsID0gby5maWxsKSB7XG4gICAgICBnLmdsb2JhbEFscGhhID0gb3BhYyAqIChvLmZpbGxPcGFjaXR5PT1udWxsID8gMSA6IG8uZmlsbE9wYWNpdHkpO1xuICAgICAgZy5maWxsU3R5bGUgPSBjb2xvcihnLCBvLCBmaWxsKTtcbiAgICAgIGcuZmlsbFRleHQoby50ZXh0LCB4LCB5KTtcbiAgICB9XG5cbiAgICBpZiAoc3Ryb2tlID0gby5zdHJva2UpIHtcbiAgICAgIGx3ID0gKGx3ID0gby5zdHJva2VXaWR0aCkgIT0gbnVsbCA/IGx3IDogMTtcbiAgICAgIGlmIChsdyA+IDApIHtcbiAgICAgICAgZy5nbG9iYWxBbHBoYSA9IG9wYWMgKiAoby5zdHJva2VPcGFjaXR5PT1udWxsID8gMSA6IG8uc3Ryb2tlT3BhY2l0eSk7XG4gICAgICAgIGcuc3Ryb2tlU3R5bGUgPSBjb2xvcihvLCBzdHJva2UpO1xuICAgICAgICBnLmxpbmVXaWR0aCA9IGx3O1xuICAgICAgICBnLnN0cm9rZVRleHQoby50ZXh0LCB4LCB5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoby5hbmdsZSkgZy5yZXN0b3JlKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZHJhd0FsbChwYXRoRnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24oZywgc2NlbmUsIGJvdW5kcykge1xuICAgIGRyYXdQYXRoQWxsKHBhdGhGdW5jLCBnLCBzY2VuZSwgYm91bmRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkcmF3T25lKHBhdGhGdW5jKSB7XG4gIHJldHVybiBmdW5jdGlvbihnLCBzY2VuZSwgYm91bmRzKSB7XG4gICAgaWYgKCFzY2VuZS5pdGVtcy5sZW5ndGgpIHJldHVybjtcbiAgICBpZiAoYm91bmRzICYmICFib3VuZHMuaW50ZXJzZWN0cyhzY2VuZS5pdGVtc1swXS5ib3VuZHMpKVxuICAgICAgcmV0dXJuOyAvLyBib3VuZHMgY2hlY2tcbiAgICBkcmF3UGF0aE9uZShwYXRoRnVuYywgZywgc2NlbmUuaXRlbXNbMF0sIHNjZW5lLml0ZW1zKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkcmF3R3JvdXAoZywgc2NlbmUsIGJvdW5kcykge1xuICBpZiAoIXNjZW5lLml0ZW1zLmxlbmd0aCkgcmV0dXJuO1xuICB2YXIgaXRlbXMgPSBzY2VuZS5pdGVtcywgZ3JvdXAsIGF4ZXMsIGxlZ2VuZHMsXG4gICAgICByZW5kZXJlciA9IHRoaXMsIGd4LCBneSwgZ2IsIGksIG4sIGosIG07XG5cbiAgZHJhd1JlY3QoZywgc2NlbmUsIGJvdW5kcyk7XG5cbiAgZm9yIChpPTAsIG49aXRlbXMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIGdyb3VwID0gaXRlbXNbaV07XG4gICAgYXhlcyA9IGdyb3VwLmF4aXNJdGVtcyB8fCBbXTtcbiAgICBsZWdlbmRzID0gZ3JvdXAubGVnZW5kSXRlbXMgfHwgW107XG4gICAgZ3ggPSBncm91cC54IHx8IDA7XG4gICAgZ3kgPSBncm91cC55IHx8IDA7XG5cbiAgICAvLyByZW5kZXIgZ3JvdXAgY29udGVudHNcbiAgICBnLnNhdmUoKTtcbiAgICBnLnRyYW5zbGF0ZShneCwgZ3kpO1xuICAgIGlmIChncm91cC5jbGlwKSB7XG4gICAgICBnLmJlZ2luUGF0aCgpO1xuICAgICAgZy5yZWN0KDAsIDAsIGdyb3VwLndpZHRoIHx8IDAsIGdyb3VwLmhlaWdodCB8fCAwKTtcbiAgICAgIGcuY2xpcCgpO1xuICAgIH1cbiAgICBcbiAgICBpZiAoYm91bmRzKSBib3VuZHMudHJhbnNsYXRlKC1neCwgLWd5KTtcbiAgICBcbiAgICBmb3IgKGo9MCwgbT1heGVzLmxlbmd0aDsgajxtOyArK2opIHtcbiAgICAgIGlmIChheGVzW2pdLmRlZi5sYXllciA9PT0gXCJiYWNrXCIpIHtcbiAgICAgICAgcmVuZGVyZXIuZHJhdyhnLCBheGVzW2pdLCBib3VuZHMpO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGo9MCwgbT1ncm91cC5pdGVtcy5sZW5ndGg7IGo8bTsgKytqKSB7XG4gICAgICByZW5kZXJlci5kcmF3KGcsIGdyb3VwLml0ZW1zW2pdLCBib3VuZHMpO1xuICAgIH1cbiAgICBmb3IgKGo9MCwgbT1heGVzLmxlbmd0aDsgajxtOyArK2opIHtcbiAgICAgIGlmIChheGVzW2pdLmRlZi5sYXllciAhPT0gXCJiYWNrXCIpIHtcbiAgICAgICAgcmVuZGVyZXIuZHJhdyhnLCBheGVzW2pdLCBib3VuZHMpO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGo9MCwgbT1sZWdlbmRzLmxlbmd0aDsgajxtOyArK2opIHtcbiAgICAgIHJlbmRlcmVyLmRyYXcoZywgbGVnZW5kc1tqXSwgYm91bmRzKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKGJvdW5kcykgYm91bmRzLnRyYW5zbGF0ZShneCwgZ3kpO1xuICAgIGcucmVzdG9yZSgpO1xuICB9ICAgIFxufVxuXG5mdW5jdGlvbiBjb2xvcihnLCBvLCB2YWx1ZSkge1xuICByZXR1cm4gKHZhbHVlLmlkKVxuICAgID8gZ3JhZGllbnQoZywgdmFsdWUsIG8uYm91bmRzKVxuICAgIDogdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdyYWRpZW50KGcsIHAsIGIpIHtcbiAgdmFyIHcgPSBiLndpZHRoKCksXG4gICAgICBoID0gYi5oZWlnaHQoKSxcbiAgICAgIHgxID0gYi54MSArIHAueDEgKiB3LFxuICAgICAgeTEgPSBiLnkxICsgcC55MSAqIGgsXG4gICAgICB4MiA9IGIueDEgKyBwLngyICogdyxcbiAgICAgIHkyID0gYi55MSArIHAueTIgKiBoLFxuICAgICAgZ3JhZCA9IGcuY3JlYXRlTGluZWFyR3JhZGllbnQoeDEsIHkxLCB4MiwgeTIpLFxuICAgICAgc3RvcCA9IHAuc3RvcHMsXG4gICAgICBpLCBuO1xuXG4gIGZvciAoaT0wLCBuPXN0b3AubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIGdyYWQuYWRkQ29sb3JTdG9wKHN0b3BbaV0ub2Zmc2V0LCBzdG9wW2ldLmNvbG9yKTtcbiAgfVxuICByZXR1cm4gZ3JhZDtcbn1cblxuLy8gaGl0IHRlc3RpbmdcblxuZnVuY3Rpb24gcGlja0dyb3VwKGcsIHNjZW5lLCB4LCB5LCBneCwgZ3kpIHtcbiAgaWYgKHNjZW5lLml0ZW1zLmxlbmd0aCA9PT0gMCB8fFxuICAgICAgc2NlbmUuYm91bmRzICYmICFzY2VuZS5ib3VuZHMuY29udGFpbnMoZ3gsIGd5KSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgaXRlbXMgPSBzY2VuZS5pdGVtcywgc3Vic2NlbmUsIGdyb3VwLCBoaXQsIGR4LCBkeSxcbiAgICAgIGhhbmRsZXIgPSB0aGlzLCBpLCBqO1xuXG4gIGZvciAoaT1pdGVtcy5sZW5ndGg7IC0taT49MDspIHtcbiAgICBncm91cCA9IGl0ZW1zW2ldO1xuICAgIGR4ID0gZ3JvdXAueCB8fCAwO1xuICAgIGR5ID0gZ3JvdXAueSB8fCAwO1xuXG4gICAgZy5zYXZlKCk7XG4gICAgZy50cmFuc2xhdGUoZHgsIGR5KTtcbiAgICBmb3IgKGo9Z3JvdXAuaXRlbXMubGVuZ3RoOyAtLWogPj0gMDspIHtcbiAgICAgIHN1YnNjZW5lID0gZ3JvdXAuaXRlbXNbal07XG4gICAgICBpZiAoc3Vic2NlbmUuaW50ZXJhY3RpdmUgPT09IGZhbHNlKSBjb250aW51ZTtcbiAgICAgIGhpdCA9IGhhbmRsZXIucGljayhzdWJzY2VuZSwgeCwgeSwgZ3gtZHgsIGd5LWR5KTtcbiAgICAgIGlmIChoaXQpIHtcbiAgICAgICAgZy5yZXN0b3JlKCk7XG4gICAgICAgIHJldHVybiBoaXQ7XG4gICAgICB9XG4gICAgfVxuICAgIGcucmVzdG9yZSgpO1xuICB9XG5cbiAgcmV0dXJuIHNjZW5lLmludGVyYWN0aXZlXG4gICAgPyBwaWNrQWxsKGhpdFRlc3RzLmdyb3VwLCBnLCBzY2VuZSwgeCwgeSwgZ3gsIGd5KVxuICAgIDogZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHBpY2tBbGwodGVzdCwgZywgc2NlbmUsIHgsIHksIGd4LCBneSkge1xuICBpZiAoIXNjZW5lLml0ZW1zLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICB2YXIgbywgYiwgaTtcblxuICBpZiAoZy5fcmF0aW8gIT09IDEpIHtcbiAgICB4ICo9IGcuX3JhdGlvO1xuICAgIHkgKj0gZy5fcmF0aW87XG4gIH1cblxuICBmb3IgKGk9c2NlbmUuaXRlbXMubGVuZ3RoOyAtLWkgPj0gMDspIHtcbiAgICBvID0gc2NlbmUuaXRlbXNbaV07IGIgPSBvLmJvdW5kcztcbiAgICAvLyBmaXJzdCBoaXQgdGVzdCBhZ2FpbnN0IGJvdW5kaW5nIGJveFxuICAgIGlmICgoYiAmJiAhYi5jb250YWlucyhneCwgZ3kpKSB8fCAhYikgY29udGludWU7XG4gICAgLy8gaWYgaW4gYm91bmRpbmcgYm94LCBwZXJmb3JtIG1vcmUgY2FyZWZ1bCB0ZXN0XG4gICAgaWYgKHRlc3QoZywgbywgeCwgeSwgZ3gsIGd5KSkgcmV0dXJuIG87XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBwaWNrQXJlYShnLCBzY2VuZSwgeCwgeSwgZ3gsIGd5KSB7XG4gIGlmICghc2NlbmUuaXRlbXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gIHZhciBpdGVtcyA9IHNjZW5lLml0ZW1zLFxuICAgICAgbywgYiwgaSwgZGksIGRkLCBvZCwgZHgsIGR5O1xuXG4gIGIgPSBpdGVtc1swXS5ib3VuZHM7XG4gIGlmIChiICYmICFiLmNvbnRhaW5zKGd4LCBneSkpIHJldHVybiBmYWxzZTtcbiAgaWYgKGcuX3JhdGlvICE9PSAxKSB7XG4gICAgeCAqPSBnLl9yYXRpbztcbiAgICB5ICo9IGcuX3JhdGlvO1xuICB9XG4gIGlmICghaGl0VGVzdHMuYXJlYShnLCBpdGVtcywgeCwgeSkpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIGl0ZW1zWzBdO1xufVxuXG5mdW5jdGlvbiBwaWNrTGluZShnLCBzY2VuZSwgeCwgeSwgZ3gsIGd5KSB7XG4gIGlmICghc2NlbmUuaXRlbXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gIHZhciBpdGVtcyA9IHNjZW5lLml0ZW1zLFxuICAgICAgbywgYiwgaSwgZGksIGRkLCBvZCwgZHgsIGR5O1xuXG4gIGIgPSBpdGVtc1swXS5ib3VuZHM7XG4gIGlmIChiICYmICFiLmNvbnRhaW5zKGd4LCBneSkpIHJldHVybiBmYWxzZTtcbiAgaWYgKGcuX3JhdGlvICE9PSAxKSB7XG4gICAgeCAqPSBnLl9yYXRpbztcbiAgICB5ICo9IGcuX3JhdGlvO1xuICB9XG4gIGlmICghaGl0VGVzdHMubGluZShnLCBpdGVtcywgeCwgeSkpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIGl0ZW1zWzBdO1xufVxuXG5mdW5jdGlvbiBwaWNrKHRlc3QpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChnLCBzY2VuZSwgeCwgeSwgZ3gsIGd5KSB7XG4gICAgcmV0dXJuIHBpY2tBbGwodGVzdCwgZywgc2NlbmUsIHgsIHksIGd4LCBneSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHRleHRIaXQoZywgbywgeCwgeSwgZ3gsIGd5KSB7XG4gIGlmICghby5mb250U2l6ZSkgcmV0dXJuIGZhbHNlO1xuICBpZiAoIW8uYW5nbGUpIHJldHVybiB0cnVlOyAvLyBib3VuZHMgc3VmZmljaWVudCBpZiBubyByb3RhdGlvblxuXG4gIHZhciBiID0gYm91bmRzQ2FsYy50ZXh0KG8sIHRtcEJvdW5kcywgdHJ1ZSksXG4gICAgICBhID0gLW8uYW5nbGUgKiBNYXRoLlBJIC8gMTgwLFxuICAgICAgY29zID0gTWF0aC5jb3MoYSksXG4gICAgICBzaW4gPSBNYXRoLnNpbihhKSxcbiAgICAgIHggPSBvLngsXG4gICAgICB5ID0gby55LFxuICAgICAgcHggPSBjb3MqZ3ggLSBzaW4qZ3kgKyAoeCAtIHgqY29zICsgeSpzaW4pLFxuICAgICAgcHkgPSBzaW4qZ3ggKyBjb3MqZ3kgKyAoeSAtIHgqc2luIC0geSpjb3MpO1xuXG4gIHJldHVybiBiLmNvbnRhaW5zKHB4LCBweSk7XG59XG5cbnZhciBoaXRUZXN0cyA9IHtcbiAgdGV4dDogICB0ZXh0SGl0LFxuICByZWN0OiAgIGZ1bmN0aW9uKGcsbyx4LHkpIHsgcmV0dXJuIHRydWU7IH0sIC8vIGJvdW5kcyB0ZXN0IGlzIHN1ZmZpY2llbnRcbiAgaW1hZ2U6ICBmdW5jdGlvbihnLG8seCx5KSB7IHJldHVybiB0cnVlOyB9LCAvLyBib3VuZHMgdGVzdCBpcyBzdWZmaWNpZW50XG4gIGdyb3VwOiAgZnVuY3Rpb24oZyxvLHgseSkgeyByZXR1cm4gby5maWxsIHx8IG8uc3Ryb2tlOyB9LFxuICBydWxlOiAgIGZ1bmN0aW9uKGcsbyx4LHkpIHtcbiAgICAgICAgICAgIGlmICghZy5pc1BvaW50SW5TdHJva2UpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHJ1bGVTdHJva2UoZyxvKTsgcmV0dXJuIGcuaXNQb2ludEluU3Ryb2tlKHgseSk7XG4gICAgICAgICAgfSxcbiAgbGluZTogICBmdW5jdGlvbihnLHMseCx5KSB7XG4gICAgICAgICAgICBpZiAoIWcuaXNQb2ludEluU3Ryb2tlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBsaW5lU3Ryb2tlKGcscyk7IHJldHVybiBnLmlzUG9pbnRJblN0cm9rZSh4LHkpO1xuICAgICAgICAgIH0sXG4gIGFyYzogICAgZnVuY3Rpb24oZyxvLHgseSkgeyBhcmNQYXRoKGcsbyk7ICByZXR1cm4gZy5pc1BvaW50SW5QYXRoKHgseSk7IH0sXG4gIGFyZWE6ICAgZnVuY3Rpb24oZyxzLHgseSkgeyBhcmVhUGF0aChnLHMpOyByZXR1cm4gZy5pc1BvaW50SW5QYXRoKHgseSk7IH0sXG4gIHBhdGg6ICAgZnVuY3Rpb24oZyxvLHgseSkgeyBwYXRoUGF0aChnLG8pOyByZXR1cm4gZy5pc1BvaW50SW5QYXRoKHgseSk7IH0sXG4gIHN5bWJvbDogZnVuY3Rpb24oZyxvLHgseSkgeyBzeW1ib2xQYXRoKGcsbyk7IHJldHVybiBnLmlzUG9pbnRJblBhdGgoeCx5KTsgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGRyYXc6IHtcbiAgICBncm91cDogICBkcmF3R3JvdXAsXG4gICAgYXJlYTogICAgZHJhd09uZShhcmVhUGF0aCksXG4gICAgbGluZTogICAgZHJhd09uZShsaW5lUGF0aCksXG4gICAgYXJjOiAgICAgZHJhd0FsbChhcmNQYXRoKSxcbiAgICBwYXRoOiAgICBkcmF3QWxsKHBhdGhQYXRoKSxcbiAgICBzeW1ib2w6ICBkcmF3QWxsKHN5bWJvbFBhdGgpLFxuICAgIHJlY3Q6ICAgIGRyYXdSZWN0LFxuICAgIHJ1bGU6ICAgIGRyYXdSdWxlLFxuICAgIHRleHQ6ICAgIGRyYXdUZXh0LFxuICAgIGltYWdlOiAgIGRyYXdJbWFnZSxcbiAgICBkcmF3T25lOiBkcmF3T25lLCAvLyBleHBvc2UgZm9yIGV4dGVuc2liaWxpdHlcbiAgICBkcmF3QWxsOiBkcmF3QWxsICAvLyBleHBvc2UgZm9yIGV4dGVuc2liaWxpdHlcbiAgfSxcbiAgcGljazoge1xuICAgIGdyb3VwOiAgIHBpY2tHcm91cCxcbiAgICBhcmVhOiAgICBwaWNrQXJlYSxcbiAgICBsaW5lOiAgICBwaWNrTGluZSxcbiAgICBhcmM6ICAgICBwaWNrKGhpdFRlc3RzLmFyYyksXG4gICAgcGF0aDogICAgcGljayhoaXRUZXN0cy5wYXRoKSxcbiAgICBzeW1ib2w6ICBwaWNrKGhpdFRlc3RzLnN5bWJvbCksXG4gICAgcmVjdDogICAgcGljayhoaXRUZXN0cy5yZWN0KSxcbiAgICBydWxlOiAgICBwaWNrKGhpdFRlc3RzLnJ1bGUpLFxuICAgIHRleHQ6ICAgIHBpY2soaGl0VGVzdHMudGV4dCksXG4gICAgaW1hZ2U6ICAgcGljayhoaXRUZXN0cy5pbWFnZSksXG4gICAgcGlja0FsbDogcGlja0FsbCAgLy8gZXhwb3NlIGZvciBleHRlbnNpYmlsaXR5XG4gIH1cbn07IiwidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgQm91bmRzID0gcmVxdWlyZSgnLi4vLi4vY29yZS9Cb3VuZHMnKTtcblxuLy8gUGF0aCBwYXJzaW5nIGFuZCByZW5kZXJpbmcgY29kZSB0YWtlbiBmcm9tIGZhYnJpYy5qcyAtLSBUaGFua3MhXG52YXIgY21kTGVuZ3RoID0geyBtOjIsIGw6MiwgaDoxLCB2OjEsIGM6Niwgczo0LCBxOjQsIHQ6MiwgYTo3IH0sXG4gICAgcmUgPSBbLyhbTUxIVkNTUVRBWm1saHZjc3F0YXpdKS9nLCAvIyMjLywgLyhcXGQpLS9nLCAvXFxzfCx8IyMjL107XG5cbmZ1bmN0aW9uIHBhcnNlKHBhdGgpIHtcbiAgdmFyIHJlc3VsdCA9IFtdLFxuICAgICAgY3VycmVudFBhdGgsXG4gICAgICBjaHVua3MsXG4gICAgICBwYXJzZWQ7XG5cbiAgLy8gRmlyc3QsIGJyZWFrIHBhdGggaW50byBjb21tYW5kIHNlcXVlbmNlXG4gIHBhdGggPSBwYXRoLnNsaWNlKCkucmVwbGFjZShyZVswXSwgJyMjIyQxJykuc3BsaXQocmVbMV0pLnNsaWNlKDEpO1xuXG4gIC8vIE5leHQsIHBhcnNlIGVhY2ggY29tbWFuZCBpbiB0dXJuXG4gIGZvciAodmFyIGk9MCwgaiwgY2h1bmtzUGFyc2VkLCBsZW49cGF0aC5sZW5ndGg7IGk8bGVuOyBpKyspIHtcbiAgICBjdXJyZW50UGF0aCA9IHBhdGhbaV07XG4gICAgY2h1bmtzID0gY3VycmVudFBhdGguc2xpY2UoMSkudHJpbSgpLnJlcGxhY2UocmVbMl0sJyQxIyMjLScpLnNwbGl0KHJlWzNdKTtcbiAgICBjaHVua3NQYXJzZWQgPSBbY3VycmVudFBhdGguY2hhckF0KDApXTtcblxuICAgIGZvciAodmFyIGogPSAwLCBqbGVuID0gY2h1bmtzLmxlbmd0aDsgaiA8IGpsZW47IGorKykge1xuICAgICAgcGFyc2VkID0gcGFyc2VGbG9hdChjaHVua3Nbal0pO1xuICAgICAgaWYgKCFpc05hTihwYXJzZWQpKSB7XG4gICAgICAgIGNodW5rc1BhcnNlZC5wdXNoKHBhcnNlZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGNvbW1hbmQgPSBjaHVua3NQYXJzZWRbMF0udG9Mb3dlckNhc2UoKSxcbiAgICAgICAgY29tbWFuZExlbmd0aCA9IGNtZExlbmd0aFtjb21tYW5kXTtcblxuICAgIGlmIChjaHVua3NQYXJzZWQubGVuZ3RoIC0gMSA+IGNvbW1hbmRMZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIGsgPSAxLCBrbGVuID0gY2h1bmtzUGFyc2VkLmxlbmd0aDsgayA8IGtsZW47IGsgKz0gY29tbWFuZExlbmd0aCkge1xuICAgICAgICByZXN1bHQucHVzaChbIGNodW5rc1BhcnNlZFswXSBdLmNvbmNhdChjaHVua3NQYXJzZWQuc2xpY2UoaywgayArIGNvbW1hbmRMZW5ndGgpKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmVzdWx0LnB1c2goY2h1bmtzUGFyc2VkKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBkcmF3QXJjKGcsIHgsIHksIGNvb3JkcywgYm91bmRzLCBsLCB0KSB7XG4gIHZhciByeCA9IGNvb3Jkc1swXTtcbiAgdmFyIHJ5ID0gY29vcmRzWzFdO1xuICB2YXIgcm90ID0gY29vcmRzWzJdO1xuICB2YXIgbGFyZ2UgPSBjb29yZHNbM107XG4gIHZhciBzd2VlcCA9IGNvb3Jkc1s0XTtcbiAgdmFyIGV4ID0gY29vcmRzWzVdO1xuICB2YXIgZXkgPSBjb29yZHNbNl07XG4gIHZhciBzZWdzID0gYXJjVG9TZWdtZW50cyhleCwgZXksIHJ4LCByeSwgbGFyZ2UsIHN3ZWVwLCByb3QsIHgsIHkpO1xuICBmb3IgKHZhciBpPTA7IGk8c2Vncy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBiZXogPSBzZWdtZW50VG9CZXppZXIuYXBwbHkobnVsbCwgc2Vnc1tpXSk7XG4gICAgZy5iZXppZXJDdXJ2ZVRvLmFwcGx5KGcsIGJleik7XG4gICAgYm91bmRzLmFkZChiZXpbMF0tbCwgYmV6WzFdLXQpO1xuICAgIGJvdW5kcy5hZGQoYmV6WzJdLWwsIGJlelszXS10KTtcbiAgICBib3VuZHMuYWRkKGJlels0XS1sLCBiZXpbNV0tdCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYm91bmRBcmMoeCwgeSwgY29vcmRzLCBib3VuZHMpIHtcbiAgdmFyIHJ4ID0gY29vcmRzWzBdO1xuICB2YXIgcnkgPSBjb29yZHNbMV07XG4gIHZhciByb3QgPSBjb29yZHNbMl07XG4gIHZhciBsYXJnZSA9IGNvb3Jkc1szXTtcbiAgdmFyIHN3ZWVwID0gY29vcmRzWzRdO1xuICB2YXIgZXggPSBjb29yZHNbNV07XG4gIHZhciBleSA9IGNvb3Jkc1s2XTtcbiAgdmFyIHNlZ3MgPSBhcmNUb1NlZ21lbnRzKGV4LCBleSwgcngsIHJ5LCBsYXJnZSwgc3dlZXAsIHJvdCwgeCwgeSk7XG4gIGZvciAodmFyIGk9MDsgaTxzZWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGJleiA9IHNlZ21lbnRUb0Jlemllci5hcHBseShudWxsLCBzZWdzW2ldKTtcbiAgICBib3VuZHMuYWRkKGJlelswXSwgYmV6WzFdKTtcbiAgICBib3VuZHMuYWRkKGJlelsyXSwgYmV6WzNdKTtcbiAgICBib3VuZHMuYWRkKGJlels0XSwgYmV6WzVdKTtcbiAgfVxufVxuXG52YXIgYXJjVG9TZWdtZW50c0NhY2hlID0geyB9LFxuICAgIHNlZ21lbnRUb0JlemllckNhY2hlID0geyB9LFxuICAgIGpvaW4gPSBBcnJheS5wcm90b3R5cGUuam9pbixcbiAgICBhcmdzU3RyO1xuXG4vLyBDb3BpZWQgZnJvbSBJbmtzY2FwZSBzdmd0b3BkZiwgdGhhbmtzIVxuZnVuY3Rpb24gYXJjVG9TZWdtZW50cyh4LCB5LCByeCwgcnksIGxhcmdlLCBzd2VlcCwgcm90YXRlWCwgb3gsIG95KSB7XG4gIGFyZ3NTdHIgPSBqb2luLmNhbGwoYXJndW1lbnRzKTtcbiAgaWYgKGFyY1RvU2VnbWVudHNDYWNoZVthcmdzU3RyXSkge1xuICAgIHJldHVybiBhcmNUb1NlZ21lbnRzQ2FjaGVbYXJnc1N0cl07XG4gIH1cblxuICB2YXIgdGggPSByb3RhdGVYICogKE1hdGguUEkvMTgwKTtcbiAgdmFyIHNpbl90aCA9IE1hdGguc2luKHRoKTtcbiAgdmFyIGNvc190aCA9IE1hdGguY29zKHRoKTtcbiAgcnggPSBNYXRoLmFicyhyeCk7XG4gIHJ5ID0gTWF0aC5hYnMocnkpO1xuICB2YXIgcHggPSBjb3NfdGggKiAob3ggLSB4KSAqIDAuNSArIHNpbl90aCAqIChveSAtIHkpICogMC41O1xuICB2YXIgcHkgPSBjb3NfdGggKiAob3kgLSB5KSAqIDAuNSAtIHNpbl90aCAqIChveCAtIHgpICogMC41O1xuICB2YXIgcGwgPSAocHgqcHgpIC8gKHJ4KnJ4KSArIChweSpweSkgLyAocnkqcnkpO1xuICBpZiAocGwgPiAxKSB7XG4gICAgcGwgPSBNYXRoLnNxcnQocGwpO1xuICAgIHJ4ICo9IHBsO1xuICAgIHJ5ICo9IHBsO1xuICB9XG5cbiAgdmFyIGEwMCA9IGNvc190aCAvIHJ4O1xuICB2YXIgYTAxID0gc2luX3RoIC8gcng7XG4gIHZhciBhMTAgPSAoLXNpbl90aCkgLyByeTtcbiAgdmFyIGExMSA9IChjb3NfdGgpIC8gcnk7XG4gIHZhciB4MCA9IGEwMCAqIG94ICsgYTAxICogb3k7XG4gIHZhciB5MCA9IGExMCAqIG94ICsgYTExICogb3k7XG4gIHZhciB4MSA9IGEwMCAqIHggKyBhMDEgKiB5O1xuICB2YXIgeTEgPSBhMTAgKiB4ICsgYTExICogeTtcblxuICB2YXIgZCA9ICh4MS14MCkgKiAoeDEteDApICsgKHkxLXkwKSAqICh5MS15MCk7XG4gIHZhciBzZmFjdG9yX3NxID0gMSAvIGQgLSAwLjI1O1xuICBpZiAoc2ZhY3Rvcl9zcSA8IDApIHNmYWN0b3Jfc3EgPSAwO1xuICB2YXIgc2ZhY3RvciA9IE1hdGguc3FydChzZmFjdG9yX3NxKTtcbiAgaWYgKHN3ZWVwID09IGxhcmdlKSBzZmFjdG9yID0gLXNmYWN0b3I7XG4gIHZhciB4YyA9IDAuNSAqICh4MCArIHgxKSAtIHNmYWN0b3IgKiAoeTEteTApO1xuICB2YXIgeWMgPSAwLjUgKiAoeTAgKyB5MSkgKyBzZmFjdG9yICogKHgxLXgwKTtcblxuICB2YXIgdGgwID0gTWF0aC5hdGFuMih5MC15YywgeDAteGMpO1xuICB2YXIgdGgxID0gTWF0aC5hdGFuMih5MS15YywgeDEteGMpO1xuXG4gIHZhciB0aF9hcmMgPSB0aDEtdGgwO1xuICBpZiAodGhfYXJjIDwgMCAmJiBzd2VlcCA9PSAxKXtcbiAgICB0aF9hcmMgKz0gMipNYXRoLlBJO1xuICB9IGVsc2UgaWYgKHRoX2FyYyA+IDAgJiYgc3dlZXAgPT0gMCkge1xuICAgIHRoX2FyYyAtPSAyICogTWF0aC5QSTtcbiAgfVxuXG4gIHZhciBzZWdtZW50cyA9IE1hdGguY2VpbChNYXRoLmFicyh0aF9hcmMgLyAoTWF0aC5QSSAqIDAuNSArIDAuMDAxKSkpO1xuICB2YXIgcmVzdWx0ID0gW107XG4gIGZvciAodmFyIGk9MDsgaTxzZWdtZW50czsgaSsrKSB7XG4gICAgdmFyIHRoMiA9IHRoMCArIGkgKiB0aF9hcmMgLyBzZWdtZW50cztcbiAgICB2YXIgdGgzID0gdGgwICsgKGkrMSkgKiB0aF9hcmMgLyBzZWdtZW50cztcbiAgICByZXN1bHRbaV0gPSBbeGMsIHljLCB0aDIsIHRoMywgcngsIHJ5LCBzaW5fdGgsIGNvc190aF07XG4gIH1cblxuICByZXR1cm4gKGFyY1RvU2VnbWVudHNDYWNoZVthcmdzU3RyXSA9IHJlc3VsdCk7XG59XG5cbmZ1bmN0aW9uIHNlZ21lbnRUb0JlemllcihjeCwgY3ksIHRoMCwgdGgxLCByeCwgcnksIHNpbl90aCwgY29zX3RoKSB7XG4gIGFyZ3NTdHIgPSBqb2luLmNhbGwoYXJndW1lbnRzKTtcbiAgaWYgKHNlZ21lbnRUb0JlemllckNhY2hlW2FyZ3NTdHJdKSB7XG4gICAgcmV0dXJuIHNlZ21lbnRUb0JlemllckNhY2hlW2FyZ3NTdHJdO1xuICB9XG5cbiAgdmFyIGEwMCA9IGNvc190aCAqIHJ4O1xuICB2YXIgYTAxID0gLXNpbl90aCAqIHJ5O1xuICB2YXIgYTEwID0gc2luX3RoICogcng7XG4gIHZhciBhMTEgPSBjb3NfdGggKiByeTtcblxuICB2YXIgY29zX3RoMCA9IE1hdGguY29zKHRoMCk7XG4gIHZhciBzaW5fdGgwID0gTWF0aC5zaW4odGgwKTtcbiAgdmFyIGNvc190aDEgPSBNYXRoLmNvcyh0aDEpO1xuICB2YXIgc2luX3RoMSA9IE1hdGguc2luKHRoMSk7XG5cbiAgdmFyIHRoX2hhbGYgPSAwLjUgKiAodGgxIC0gdGgwKTtcbiAgdmFyIHNpbl90aF9oMiA9IE1hdGguc2luKHRoX2hhbGYgKiAwLjUpO1xuICB2YXIgdCA9ICg4LzMpICogc2luX3RoX2gyICogc2luX3RoX2gyIC8gTWF0aC5zaW4odGhfaGFsZik7XG4gIHZhciB4MSA9IGN4ICsgY29zX3RoMCAtIHQgKiBzaW5fdGgwO1xuICB2YXIgeTEgPSBjeSArIHNpbl90aDAgKyB0ICogY29zX3RoMDtcbiAgdmFyIHgzID0gY3ggKyBjb3NfdGgxO1xuICB2YXIgeTMgPSBjeSArIHNpbl90aDE7XG4gIHZhciB4MiA9IHgzICsgdCAqIHNpbl90aDE7XG4gIHZhciB5MiA9IHkzIC0gdCAqIGNvc190aDE7XG5cbiAgcmV0dXJuIChzZWdtZW50VG9CZXppZXJDYWNoZVthcmdzU3RyXSA9IFtcbiAgICBhMDAgKiB4MSArIGEwMSAqIHkxLCAgYTEwICogeDEgKyBhMTEgKiB5MSxcbiAgICBhMDAgKiB4MiArIGEwMSAqIHkyLCAgYTEwICogeDIgKyBhMTEgKiB5MixcbiAgICBhMDAgKiB4MyArIGEwMSAqIHkzLCAgYTEwICogeDMgKyBhMTEgKiB5M1xuICBdKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyKGcsIHBhdGgsIGwsIHQpIHtcbiAgdmFyIGN1cnJlbnQsIC8vIGN1cnJlbnQgaW5zdHJ1Y3Rpb25cbiAgICAgIHByZXZpb3VzID0gbnVsbCxcbiAgICAgIHggPSAwLCAvLyBjdXJyZW50IHhcbiAgICAgIHkgPSAwLCAvLyBjdXJyZW50IHlcbiAgICAgIGNvbnRyb2xYID0gMCwgLy8gY3VycmVudCBjb250cm9sIHBvaW50IHhcbiAgICAgIGNvbnRyb2xZID0gMCwgLy8gY3VycmVudCBjb250cm9sIHBvaW50IHlcbiAgICAgIHRlbXBYLFxuICAgICAgdGVtcFksXG4gICAgICB0ZW1wQ29udHJvbFgsXG4gICAgICB0ZW1wQ29udHJvbFksXG4gICAgICBib3VuZHMgPSBuZXcgQm91bmRzKCk7XG4gIGlmIChsID09IHVuZGVmaW5lZCkgbCA9IDA7XG4gIGlmICh0ID09IHVuZGVmaW5lZCkgdCA9IDA7XG5cbiAgZy5iZWdpblBhdGgoKTtcblxuICBmb3IgKHZhciBpPTAsIGxlbj1wYXRoLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIGN1cnJlbnQgPSBwYXRoW2ldO1xuXG4gICAgc3dpdGNoIChjdXJyZW50WzBdKSB7IC8vIGZpcnN0IGxldHRlclxuXG4gICAgICBjYXNlICdsJzogLy8gbGluZXRvLCByZWxhdGl2ZVxuICAgICAgICB4ICs9IGN1cnJlbnRbMV07XG4gICAgICAgIHkgKz0gY3VycmVudFsyXTtcbiAgICAgICAgZy5saW5lVG8oeCArIGwsIHkgKyB0KTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ0wnOiAvLyBsaW5ldG8sIGFic29sdXRlXG4gICAgICAgIHggPSBjdXJyZW50WzFdO1xuICAgICAgICB5ID0gY3VycmVudFsyXTtcbiAgICAgICAgZy5saW5lVG8oeCArIGwsIHkgKyB0KTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2gnOiAvLyBob3Jpem9udGFsIGxpbmV0bywgcmVsYXRpdmVcbiAgICAgICAgeCArPSBjdXJyZW50WzFdO1xuICAgICAgICBnLmxpbmVUbyh4ICsgbCwgeSArIHQpO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnSCc6IC8vIGhvcml6b250YWwgbGluZXRvLCBhYnNvbHV0ZVxuICAgICAgICB4ID0gY3VycmVudFsxXTtcbiAgICAgICAgZy5saW5lVG8oeCArIGwsIHkgKyB0KTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3YnOiAvLyB2ZXJ0aWNhbCBsaW5ldG8sIHJlbGF0aXZlXG4gICAgICAgIHkgKz0gY3VycmVudFsxXTtcbiAgICAgICAgZy5saW5lVG8oeCArIGwsIHkgKyB0KTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ1YnOiAvLyB2ZXJpY2FsIGxpbmV0bywgYWJzb2x1dGVcbiAgICAgICAgeSA9IGN1cnJlbnRbMV07XG4gICAgICAgIGcubGluZVRvKHggKyBsLCB5ICsgdCk7XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdtJzogLy8gbW92ZVRvLCByZWxhdGl2ZVxuICAgICAgICB4ICs9IGN1cnJlbnRbMV07XG4gICAgICAgIHkgKz0gY3VycmVudFsyXTtcbiAgICAgICAgZy5tb3ZlVG8oeCArIGwsIHkgKyB0KTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ00nOiAvLyBtb3ZlVG8sIGFic29sdXRlXG4gICAgICAgIHggPSBjdXJyZW50WzFdO1xuICAgICAgICB5ID0gY3VycmVudFsyXTtcbiAgICAgICAgZy5tb3ZlVG8oeCArIGwsIHkgKyB0KTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2MnOiAvLyBiZXppZXJDdXJ2ZVRvLCByZWxhdGl2ZVxuICAgICAgICB0ZW1wWCA9IHggKyBjdXJyZW50WzVdO1xuICAgICAgICB0ZW1wWSA9IHkgKyBjdXJyZW50WzZdO1xuICAgICAgICBjb250cm9sWCA9IHggKyBjdXJyZW50WzNdO1xuICAgICAgICBjb250cm9sWSA9IHkgKyBjdXJyZW50WzRdO1xuICAgICAgICBnLmJlemllckN1cnZlVG8oXG4gICAgICAgICAgeCArIGN1cnJlbnRbMV0gKyBsLCAvLyB4MVxuICAgICAgICAgIHkgKyBjdXJyZW50WzJdICsgdCwgLy8geTFcbiAgICAgICAgICBjb250cm9sWCArIGwsIC8vIHgyXG4gICAgICAgICAgY29udHJvbFkgKyB0LCAvLyB5MlxuICAgICAgICAgIHRlbXBYICsgbCxcbiAgICAgICAgICB0ZW1wWSArIHRcbiAgICAgICAgKTtcbiAgICAgICAgYm91bmRzLmFkZCh4ICsgY3VycmVudFsxXSwgeSArIGN1cnJlbnRbMl0pO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQodGVtcFgsIHRlbXBZKTtcbiAgICAgICAgeCA9IHRlbXBYO1xuICAgICAgICB5ID0gdGVtcFk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdDJzogLy8gYmV6aWVyQ3VydmVUbywgYWJzb2x1dGVcbiAgICAgICAgeCA9IGN1cnJlbnRbNV07XG4gICAgICAgIHkgPSBjdXJyZW50WzZdO1xuICAgICAgICBjb250cm9sWCA9IGN1cnJlbnRbM107XG4gICAgICAgIGNvbnRyb2xZID0gY3VycmVudFs0XTtcbiAgICAgICAgZy5iZXppZXJDdXJ2ZVRvKFxuICAgICAgICAgIGN1cnJlbnRbMV0gKyBsLFxuICAgICAgICAgIGN1cnJlbnRbMl0gKyB0LFxuICAgICAgICAgIGNvbnRyb2xYICsgbCxcbiAgICAgICAgICBjb250cm9sWSArIHQsXG4gICAgICAgICAgeCArIGwsXG4gICAgICAgICAgeSArIHRcbiAgICAgICAgKTtcbiAgICAgICAgYm91bmRzLmFkZChjdXJyZW50WzFdLCBjdXJyZW50WzJdKTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAncyc6IC8vIHNob3J0aGFuZCBjdWJpYyBiZXppZXJDdXJ2ZVRvLCByZWxhdGl2ZVxuICAgICAgICAvLyB0cmFuc2Zvcm0gdG8gYWJzb2x1dGUgeCx5XG4gICAgICAgIHRlbXBYID0geCArIGN1cnJlbnRbM107XG4gICAgICAgIHRlbXBZID0geSArIGN1cnJlbnRbNF07XG4gICAgICAgIC8vIGNhbGN1bGF0ZSByZWZsZWN0aW9uIG9mIHByZXZpb3VzIGNvbnRyb2wgcG9pbnRzXG4gICAgICAgIGNvbnRyb2xYID0gMiAqIHggLSBjb250cm9sWDtcbiAgICAgICAgY29udHJvbFkgPSAyICogeSAtIGNvbnRyb2xZO1xuICAgICAgICBnLmJlemllckN1cnZlVG8oXG4gICAgICAgICAgY29udHJvbFggKyBsLFxuICAgICAgICAgIGNvbnRyb2xZICsgdCxcbiAgICAgICAgICB4ICsgY3VycmVudFsxXSArIGwsXG4gICAgICAgICAgeSArIGN1cnJlbnRbMl0gKyB0LFxuICAgICAgICAgIHRlbXBYICsgbCxcbiAgICAgICAgICB0ZW1wWSArIHRcbiAgICAgICAgKTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHggKyBjdXJyZW50WzFdLCB5ICsgY3VycmVudFsyXSk7XG4gICAgICAgIGJvdW5kcy5hZGQodGVtcFgsIHRlbXBZKTtcblxuICAgICAgICAvLyBzZXQgY29udHJvbCBwb2ludCB0byAybmQgb25lIG9mIHRoaXMgY29tbWFuZFxuICAgICAgICAvLyBcIi4uLiB0aGUgZmlyc3QgY29udHJvbCBwb2ludCBpcyBhc3N1bWVkIHRvIGJlIHRoZSByZWZsZWN0aW9uIG9mIHRoZSBzZWNvbmQgY29udHJvbCBwb2ludCBvbiB0aGUgcHJldmlvdXMgY29tbWFuZCByZWxhdGl2ZSB0byB0aGUgY3VycmVudCBwb2ludC5cIlxuICAgICAgICBjb250cm9sWCA9IHggKyBjdXJyZW50WzFdO1xuICAgICAgICBjb250cm9sWSA9IHkgKyBjdXJyZW50WzJdO1xuXG4gICAgICAgIHggPSB0ZW1wWDtcbiAgICAgICAgeSA9IHRlbXBZO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnUyc6IC8vIHNob3J0aGFuZCBjdWJpYyBiZXppZXJDdXJ2ZVRvLCBhYnNvbHV0ZVxuICAgICAgICB0ZW1wWCA9IGN1cnJlbnRbM107XG4gICAgICAgIHRlbXBZID0gY3VycmVudFs0XTtcbiAgICAgICAgLy8gY2FsY3VsYXRlIHJlZmxlY3Rpb24gb2YgcHJldmlvdXMgY29udHJvbCBwb2ludHNcbiAgICAgICAgY29udHJvbFggPSAyKnggLSBjb250cm9sWDtcbiAgICAgICAgY29udHJvbFkgPSAyKnkgLSBjb250cm9sWTtcbiAgICAgICAgZy5iZXppZXJDdXJ2ZVRvKFxuICAgICAgICAgIGNvbnRyb2xYICsgbCxcbiAgICAgICAgICBjb250cm9sWSArIHQsXG4gICAgICAgICAgY3VycmVudFsxXSArIGwsXG4gICAgICAgICAgY3VycmVudFsyXSArIHQsXG4gICAgICAgICAgdGVtcFggKyBsLFxuICAgICAgICAgIHRlbXBZICsgdFxuICAgICAgICApO1xuICAgICAgICB4ID0gdGVtcFg7XG4gICAgICAgIHkgPSB0ZW1wWTtcbiAgICAgICAgYm91bmRzLmFkZChjdXJyZW50WzFdLCBjdXJyZW50WzJdKTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHRlbXBYLCB0ZW1wWSk7XG4gICAgICAgIC8vIHNldCBjb250cm9sIHBvaW50IHRvIDJuZCBvbmUgb2YgdGhpcyBjb21tYW5kXG4gICAgICAgIC8vIFwiLi4uIHRoZSBmaXJzdCBjb250cm9sIHBvaW50IGlzIGFzc3VtZWQgdG8gYmUgdGhlIHJlZmxlY3Rpb24gb2YgdGhlIHNlY29uZCBjb250cm9sIHBvaW50IG9uIHRoZSBwcmV2aW91cyBjb21tYW5kIHJlbGF0aXZlIHRvIHRoZSBjdXJyZW50IHBvaW50LlwiXG4gICAgICAgIGNvbnRyb2xYID0gY3VycmVudFsxXTtcbiAgICAgICAgY29udHJvbFkgPSBjdXJyZW50WzJdO1xuXG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdxJzogLy8gcXVhZHJhdGljQ3VydmVUbywgcmVsYXRpdmVcbiAgICAgICAgLy8gdHJhbnNmb3JtIHRvIGFic29sdXRlIHgseVxuICAgICAgICB0ZW1wWCA9IHggKyBjdXJyZW50WzNdO1xuICAgICAgICB0ZW1wWSA9IHkgKyBjdXJyZW50WzRdO1xuXG4gICAgICAgIGNvbnRyb2xYID0geCArIGN1cnJlbnRbMV07XG4gICAgICAgIGNvbnRyb2xZID0geSArIGN1cnJlbnRbMl07XG5cbiAgICAgICAgZy5xdWFkcmF0aWNDdXJ2ZVRvKFxuICAgICAgICAgIGNvbnRyb2xYICsgbCxcbiAgICAgICAgICBjb250cm9sWSArIHQsXG4gICAgICAgICAgdGVtcFggKyBsLFxuICAgICAgICAgIHRlbXBZICsgdFxuICAgICAgICApO1xuICAgICAgICB4ID0gdGVtcFg7XG4gICAgICAgIHkgPSB0ZW1wWTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHRlbXBYLCB0ZW1wWSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdRJzogLy8gcXVhZHJhdGljQ3VydmVUbywgYWJzb2x1dGVcbiAgICAgICAgdGVtcFggPSBjdXJyZW50WzNdO1xuICAgICAgICB0ZW1wWSA9IGN1cnJlbnRbNF07XG5cbiAgICAgICAgZy5xdWFkcmF0aWNDdXJ2ZVRvKFxuICAgICAgICAgIGN1cnJlbnRbMV0gKyBsLFxuICAgICAgICAgIGN1cnJlbnRbMl0gKyB0LFxuICAgICAgICAgIHRlbXBYICsgbCxcbiAgICAgICAgICB0ZW1wWSArIHRcbiAgICAgICAgKTtcbiAgICAgICAgeCA9IHRlbXBYO1xuICAgICAgICB5ID0gdGVtcFk7XG4gICAgICAgIGNvbnRyb2xYID0gY3VycmVudFsxXTtcbiAgICAgICAgY29udHJvbFkgPSBjdXJyZW50WzJdO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQodGVtcFgsIHRlbXBZKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3QnOiAvLyBzaG9ydGhhbmQgcXVhZHJhdGljQ3VydmVUbywgcmVsYXRpdmVcblxuICAgICAgICAvLyB0cmFuc2Zvcm0gdG8gYWJzb2x1dGUgeCx5XG4gICAgICAgIHRlbXBYID0geCArIGN1cnJlbnRbMV07XG4gICAgICAgIHRlbXBZID0geSArIGN1cnJlbnRbMl07XG5cbiAgICAgICAgaWYgKHByZXZpb3VzWzBdLm1hdGNoKC9bUXFUdF0vKSA9PT0gbnVsbCkge1xuICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIHByZXZpb3VzIGNvbW1hbmQgb3IgaWYgdGhlIHByZXZpb3VzIGNvbW1hbmQgd2FzIG5vdCBhIFEsIHEsIFQgb3IgdCxcbiAgICAgICAgICAvLyBhc3N1bWUgdGhlIGNvbnRyb2wgcG9pbnQgaXMgY29pbmNpZGVudCB3aXRoIHRoZSBjdXJyZW50IHBvaW50XG4gICAgICAgICAgY29udHJvbFggPSB4O1xuICAgICAgICAgIGNvbnRyb2xZID0geTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChwcmV2aW91c1swXSA9PT0gJ3QnKSB7XG4gICAgICAgICAgLy8gY2FsY3VsYXRlIHJlZmxlY3Rpb24gb2YgcHJldmlvdXMgY29udHJvbCBwb2ludHMgZm9yIHRcbiAgICAgICAgICBjb250cm9sWCA9IDIgKiB4IC0gdGVtcENvbnRyb2xYO1xuICAgICAgICAgIGNvbnRyb2xZID0gMiAqIHkgLSB0ZW1wQ29udHJvbFk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJldmlvdXNbMF0gPT09ICdxJykge1xuICAgICAgICAgIC8vIGNhbGN1bGF0ZSByZWZsZWN0aW9uIG9mIHByZXZpb3VzIGNvbnRyb2wgcG9pbnRzIGZvciBxXG4gICAgICAgICAgY29udHJvbFggPSAyICogeCAtIGNvbnRyb2xYO1xuICAgICAgICAgIGNvbnRyb2xZID0gMiAqIHkgLSBjb250cm9sWTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRlbXBDb250cm9sWCA9IGNvbnRyb2xYO1xuICAgICAgICB0ZW1wQ29udHJvbFkgPSBjb250cm9sWTtcblxuICAgICAgICBnLnF1YWRyYXRpY0N1cnZlVG8oXG4gICAgICAgICAgY29udHJvbFggKyBsLFxuICAgICAgICAgIGNvbnRyb2xZICsgdCxcbiAgICAgICAgICB0ZW1wWCArIGwsXG4gICAgICAgICAgdGVtcFkgKyB0XG4gICAgICAgICk7XG4gICAgICAgIHggPSB0ZW1wWDtcbiAgICAgICAgeSA9IHRlbXBZO1xuICAgICAgICBjb250cm9sWCA9IHggKyBjdXJyZW50WzFdO1xuICAgICAgICBjb250cm9sWSA9IHkgKyBjdXJyZW50WzJdO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQodGVtcFgsIHRlbXBZKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ1QnOlxuICAgICAgICB0ZW1wWCA9IGN1cnJlbnRbMV07XG4gICAgICAgIHRlbXBZID0gY3VycmVudFsyXTtcblxuICAgICAgICAvLyBjYWxjdWxhdGUgcmVmbGVjdGlvbiBvZiBwcmV2aW91cyBjb250cm9sIHBvaW50c1xuICAgICAgICBjb250cm9sWCA9IDIgKiB4IC0gY29udHJvbFg7XG4gICAgICAgIGNvbnRyb2xZID0gMiAqIHkgLSBjb250cm9sWTtcbiAgICAgICAgZy5xdWFkcmF0aWNDdXJ2ZVRvKFxuICAgICAgICAgIGNvbnRyb2xYICsgbCxcbiAgICAgICAgICBjb250cm9sWSArIHQsXG4gICAgICAgICAgdGVtcFggKyBsLFxuICAgICAgICAgIHRlbXBZICsgdFxuICAgICAgICApO1xuICAgICAgICB4ID0gdGVtcFg7XG4gICAgICAgIHkgPSB0ZW1wWTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHRlbXBYLCB0ZW1wWSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdhJzpcbiAgICAgICAgZHJhd0FyYyhnLCB4ICsgbCwgeSArIHQsIFtcbiAgICAgICAgICBjdXJyZW50WzFdLFxuICAgICAgICAgIGN1cnJlbnRbMl0sXG4gICAgICAgICAgY3VycmVudFszXSxcbiAgICAgICAgICBjdXJyZW50WzRdLFxuICAgICAgICAgIGN1cnJlbnRbNV0sXG4gICAgICAgICAgY3VycmVudFs2XSArIHggKyBsLFxuICAgICAgICAgIGN1cnJlbnRbN10gKyB5ICsgdFxuICAgICAgICBdLCBib3VuZHMsIGwsIHQpO1xuICAgICAgICB4ICs9IGN1cnJlbnRbNl07XG4gICAgICAgIHkgKz0gY3VycmVudFs3XTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ0EnOlxuICAgICAgICBkcmF3QXJjKGcsIHggKyBsLCB5ICsgdCwgW1xuICAgICAgICAgIGN1cnJlbnRbMV0sXG4gICAgICAgICAgY3VycmVudFsyXSxcbiAgICAgICAgICBjdXJyZW50WzNdLFxuICAgICAgICAgIGN1cnJlbnRbNF0sXG4gICAgICAgICAgY3VycmVudFs1XSxcbiAgICAgICAgICBjdXJyZW50WzZdICsgbCxcbiAgICAgICAgICBjdXJyZW50WzddICsgdFxuICAgICAgICBdLCBib3VuZHMsIGwsIHQpO1xuICAgICAgICB4ID0gY3VycmVudFs2XTtcbiAgICAgICAgeSA9IGN1cnJlbnRbN107XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICd6JzpcbiAgICAgIGNhc2UgJ1onOlxuICAgICAgICBnLmNsb3NlUGF0aCgpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcHJldmlvdXMgPSBjdXJyZW50O1xuICB9XG4gIHJldHVybiBib3VuZHMudHJhbnNsYXRlKGwsIHQpO1xufVxuXG5mdW5jdGlvbiBib3VuZHMocGF0aCwgYm91bmRzKSB7XG4gIHZhciBjdXJyZW50LCAvLyBjdXJyZW50IGluc3RydWN0aW9uXG4gICAgICBwcmV2aW91cyA9IG51bGwsXG4gICAgICB4ID0gMCwgLy8gY3VycmVudCB4XG4gICAgICB5ID0gMCwgLy8gY3VycmVudCB5XG4gICAgICBjb250cm9sWCA9IDAsIC8vIGN1cnJlbnQgY29udHJvbCBwb2ludCB4XG4gICAgICBjb250cm9sWSA9IDAsIC8vIGN1cnJlbnQgY29udHJvbCBwb2ludCB5XG4gICAgICB0ZW1wWCxcbiAgICAgIHRlbXBZLFxuICAgICAgdGVtcENvbnRyb2xYLFxuICAgICAgdGVtcENvbnRyb2xZO1xuXG4gIGZvciAodmFyIGk9MCwgbGVuPXBhdGgubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgY3VycmVudCA9IHBhdGhbaV07XG5cbiAgICBzd2l0Y2ggKGN1cnJlbnRbMF0pIHsgLy8gZmlyc3QgbGV0dGVyXG5cbiAgICAgIGNhc2UgJ2wnOiAvLyBsaW5ldG8sIHJlbGF0aXZlXG4gICAgICAgIHggKz0gY3VycmVudFsxXTtcbiAgICAgICAgeSArPSBjdXJyZW50WzJdO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnTCc6IC8vIGxpbmV0bywgYWJzb2x1dGVcbiAgICAgICAgeCA9IGN1cnJlbnRbMV07XG4gICAgICAgIHkgPSBjdXJyZW50WzJdO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnaCc6IC8vIGhvcml6b250YWwgbGluZXRvLCByZWxhdGl2ZVxuICAgICAgICB4ICs9IGN1cnJlbnRbMV07XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdIJzogLy8gaG9yaXpvbnRhbCBsaW5ldG8sIGFic29sdXRlXG4gICAgICAgIHggPSBjdXJyZW50WzFdO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAndic6IC8vIHZlcnRpY2FsIGxpbmV0bywgcmVsYXRpdmVcbiAgICAgICAgeSArPSBjdXJyZW50WzFdO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnVic6IC8vIHZlcmljYWwgbGluZXRvLCBhYnNvbHV0ZVxuICAgICAgICB5ID0gY3VycmVudFsxXTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ20nOiAvLyBtb3ZlVG8sIHJlbGF0aXZlXG4gICAgICAgIHggKz0gY3VycmVudFsxXTtcbiAgICAgICAgeSArPSBjdXJyZW50WzJdO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnTSc6IC8vIG1vdmVUbywgYWJzb2x1dGVcbiAgICAgICAgeCA9IGN1cnJlbnRbMV07XG4gICAgICAgIHkgPSBjdXJyZW50WzJdO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYyc6IC8vIGJlemllckN1cnZlVG8sIHJlbGF0aXZlXG4gICAgICAgIHRlbXBYID0geCArIGN1cnJlbnRbNV07XG4gICAgICAgIHRlbXBZID0geSArIGN1cnJlbnRbNl07XG4gICAgICAgIGNvbnRyb2xYID0geCArIGN1cnJlbnRbM107XG4gICAgICAgIGNvbnRyb2xZID0geSArIGN1cnJlbnRbNF07XG4gICAgICAgIGJvdW5kcy5hZGQoeCArIGN1cnJlbnRbMV0sIHkgKyBjdXJyZW50WzJdKTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHRlbXBYLCB0ZW1wWSk7XG4gICAgICAgIHggPSB0ZW1wWDtcbiAgICAgICAgeSA9IHRlbXBZO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnQyc6IC8vIGJlemllckN1cnZlVG8sIGFic29sdXRlXG4gICAgICAgIHggPSBjdXJyZW50WzVdO1xuICAgICAgICB5ID0gY3VycmVudFs2XTtcbiAgICAgICAgY29udHJvbFggPSBjdXJyZW50WzNdO1xuICAgICAgICBjb250cm9sWSA9IGN1cnJlbnRbNF07XG4gICAgICAgIGJvdW5kcy5hZGQoY3VycmVudFsxXSwgY3VycmVudFsyXSk7XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3MnOiAvLyBzaG9ydGhhbmQgY3ViaWMgYmV6aWVyQ3VydmVUbywgcmVsYXRpdmVcbiAgICAgICAgLy8gdHJhbnNmb3JtIHRvIGFic29sdXRlIHgseVxuICAgICAgICB0ZW1wWCA9IHggKyBjdXJyZW50WzNdO1xuICAgICAgICB0ZW1wWSA9IHkgKyBjdXJyZW50WzRdO1xuICAgICAgICAvLyBjYWxjdWxhdGUgcmVmbGVjdGlvbiBvZiBwcmV2aW91cyBjb250cm9sIHBvaW50c1xuICAgICAgICBjb250cm9sWCA9IDIgKiB4IC0gY29udHJvbFg7XG4gICAgICAgIGNvbnRyb2xZID0gMiAqIHkgLSBjb250cm9sWTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHggKyBjdXJyZW50WzFdLCB5ICsgY3VycmVudFsyXSk7XG4gICAgICAgIGJvdW5kcy5hZGQodGVtcFgsIHRlbXBZKTtcblxuICAgICAgICAvLyBzZXQgY29udHJvbCBwb2ludCB0byAybmQgb25lIG9mIHRoaXMgY29tbWFuZFxuICAgICAgICAvLyBcIi4uLiB0aGUgZmlyc3QgY29udHJvbCBwb2ludCBpcyBhc3N1bWVkIHRvIGJlIHRoZSByZWZsZWN0aW9uIG9mIHRoZSBzZWNvbmQgY29udHJvbCBwb2ludCBvbiB0aGUgcHJldmlvdXMgY29tbWFuZCByZWxhdGl2ZSB0byB0aGUgY3VycmVudCBwb2ludC5cIlxuICAgICAgICBjb250cm9sWCA9IHggKyBjdXJyZW50WzFdO1xuICAgICAgICBjb250cm9sWSA9IHkgKyBjdXJyZW50WzJdO1xuXG4gICAgICAgIHggPSB0ZW1wWDtcbiAgICAgICAgeSA9IHRlbXBZO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnUyc6IC8vIHNob3J0aGFuZCBjdWJpYyBiZXppZXJDdXJ2ZVRvLCBhYnNvbHV0ZVxuICAgICAgICB0ZW1wWCA9IGN1cnJlbnRbM107XG4gICAgICAgIHRlbXBZID0gY3VycmVudFs0XTtcbiAgICAgICAgLy8gY2FsY3VsYXRlIHJlZmxlY3Rpb24gb2YgcHJldmlvdXMgY29udHJvbCBwb2ludHNcbiAgICAgICAgY29udHJvbFggPSAyKnggLSBjb250cm9sWDtcbiAgICAgICAgY29udHJvbFkgPSAyKnkgLSBjb250cm9sWTtcbiAgICAgICAgeCA9IHRlbXBYO1xuICAgICAgICB5ID0gdGVtcFk7XG4gICAgICAgIGJvdW5kcy5hZGQoY3VycmVudFsxXSwgY3VycmVudFsyXSk7XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh0ZW1wWCwgdGVtcFkpO1xuICAgICAgICAvLyBzZXQgY29udHJvbCBwb2ludCB0byAybmQgb25lIG9mIHRoaXMgY29tbWFuZFxuICAgICAgICAvLyBcIi4uLiB0aGUgZmlyc3QgY29udHJvbCBwb2ludCBpcyBhc3N1bWVkIHRvIGJlIHRoZSByZWZsZWN0aW9uIG9mIHRoZSBzZWNvbmQgY29udHJvbCBwb2ludCBvbiB0aGUgcHJldmlvdXMgY29tbWFuZCByZWxhdGl2ZSB0byB0aGUgY3VycmVudCBwb2ludC5cIlxuICAgICAgICBjb250cm9sWCA9IGN1cnJlbnRbMV07XG4gICAgICAgIGNvbnRyb2xZID0gY3VycmVudFsyXTtcblxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAncSc6IC8vIHF1YWRyYXRpY0N1cnZlVG8sIHJlbGF0aXZlXG4gICAgICAgIC8vIHRyYW5zZm9ybSB0byBhYnNvbHV0ZSB4LHlcbiAgICAgICAgdGVtcFggPSB4ICsgY3VycmVudFszXTtcbiAgICAgICAgdGVtcFkgPSB5ICsgY3VycmVudFs0XTtcblxuICAgICAgICBjb250cm9sWCA9IHggKyBjdXJyZW50WzFdO1xuICAgICAgICBjb250cm9sWSA9IHkgKyBjdXJyZW50WzJdO1xuXG4gICAgICAgIHggPSB0ZW1wWDtcbiAgICAgICAgeSA9IHRlbXBZO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQodGVtcFgsIHRlbXBZKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ1EnOiAvLyBxdWFkcmF0aWNDdXJ2ZVRvLCBhYnNvbHV0ZVxuICAgICAgICB0ZW1wWCA9IGN1cnJlbnRbM107XG4gICAgICAgIHRlbXBZID0gY3VycmVudFs0XTtcblxuICAgICAgICB4ID0gdGVtcFg7XG4gICAgICAgIHkgPSB0ZW1wWTtcbiAgICAgICAgY29udHJvbFggPSBjdXJyZW50WzFdO1xuICAgICAgICBjb250cm9sWSA9IGN1cnJlbnRbMl07XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh0ZW1wWCwgdGVtcFkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAndCc6IC8vIHNob3J0aGFuZCBxdWFkcmF0aWNDdXJ2ZVRvLCByZWxhdGl2ZVxuXG4gICAgICAgIC8vIHRyYW5zZm9ybSB0byBhYnNvbHV0ZSB4LHlcbiAgICAgICAgdGVtcFggPSB4ICsgY3VycmVudFsxXTtcbiAgICAgICAgdGVtcFkgPSB5ICsgY3VycmVudFsyXTtcblxuICAgICAgICBpZiAocHJldmlvdXNbMF0ubWF0Y2goL1tRcVR0XS8pID09PSBudWxsKSB7XG4gICAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gcHJldmlvdXMgY29tbWFuZCBvciBpZiB0aGUgcHJldmlvdXMgY29tbWFuZCB3YXMgbm90IGEgUSwgcSwgVCBvciB0LFxuICAgICAgICAgIC8vIGFzc3VtZSB0aGUgY29udHJvbCBwb2ludCBpcyBjb2luY2lkZW50IHdpdGggdGhlIGN1cnJlbnQgcG9pbnRcbiAgICAgICAgICBjb250cm9sWCA9IHg7XG4gICAgICAgICAgY29udHJvbFkgPSB5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByZXZpb3VzWzBdID09PSAndCcpIHtcbiAgICAgICAgICAvLyBjYWxjdWxhdGUgcmVmbGVjdGlvbiBvZiBwcmV2aW91cyBjb250cm9sIHBvaW50cyBmb3IgdFxuICAgICAgICAgIGNvbnRyb2xYID0gMiAqIHggLSB0ZW1wQ29udHJvbFg7XG4gICAgICAgICAgY29udHJvbFkgPSAyICogeSAtIHRlbXBDb250cm9sWTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChwcmV2aW91c1swXSA9PT0gJ3EnKSB7XG4gICAgICAgICAgLy8gY2FsY3VsYXRlIHJlZmxlY3Rpb24gb2YgcHJldmlvdXMgY29udHJvbCBwb2ludHMgZm9yIHFcbiAgICAgICAgICBjb250cm9sWCA9IDIgKiB4IC0gY29udHJvbFg7XG4gICAgICAgICAgY29udHJvbFkgPSAyICogeSAtIGNvbnRyb2xZO1xuICAgICAgICB9XG5cbiAgICAgICAgdGVtcENvbnRyb2xYID0gY29udHJvbFg7XG4gICAgICAgIHRlbXBDb250cm9sWSA9IGNvbnRyb2xZO1xuXG4gICAgICAgIHggPSB0ZW1wWDtcbiAgICAgICAgeSA9IHRlbXBZO1xuICAgICAgICBjb250cm9sWCA9IHggKyBjdXJyZW50WzFdO1xuICAgICAgICBjb250cm9sWSA9IHkgKyBjdXJyZW50WzJdO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQodGVtcFgsIHRlbXBZKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ1QnOlxuICAgICAgICB0ZW1wWCA9IGN1cnJlbnRbMV07XG4gICAgICAgIHRlbXBZID0gY3VycmVudFsyXTtcblxuICAgICAgICAvLyBjYWxjdWxhdGUgcmVmbGVjdGlvbiBvZiBwcmV2aW91cyBjb250cm9sIHBvaW50c1xuICAgICAgICBjb250cm9sWCA9IDIgKiB4IC0gY29udHJvbFg7XG4gICAgICAgIGNvbnRyb2xZID0gMiAqIHkgLSBjb250cm9sWTtcblxuICAgICAgICB4ID0gdGVtcFg7XG4gICAgICAgIHkgPSB0ZW1wWTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHRlbXBYLCB0ZW1wWSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdhJzpcbiAgICAgICAgYm91bmRBcmMoeCwgeSwgW1xuICAgICAgICAgIGN1cnJlbnRbMV0sXG4gICAgICAgICAgY3VycmVudFsyXSxcbiAgICAgICAgICBjdXJyZW50WzNdLFxuICAgICAgICAgIGN1cnJlbnRbNF0sXG4gICAgICAgICAgY3VycmVudFs1XSxcbiAgICAgICAgICBjdXJyZW50WzZdICsgeCxcbiAgICAgICAgICBjdXJyZW50WzddICsgeVxuICAgICAgICBdLCBib3VuZHMpO1xuICAgICAgICB4ICs9IGN1cnJlbnRbNl07XG4gICAgICAgIHkgKz0gY3VycmVudFs3XTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ0EnOlxuICAgICAgICBib3VuZEFyYyh4LCB5LCBbXG4gICAgICAgICAgY3VycmVudFsxXSxcbiAgICAgICAgICBjdXJyZW50WzJdLFxuICAgICAgICAgIGN1cnJlbnRbM10sXG4gICAgICAgICAgY3VycmVudFs0XSxcbiAgICAgICAgICBjdXJyZW50WzVdLFxuICAgICAgICAgIGN1cnJlbnRbNl0sXG4gICAgICAgICAgY3VycmVudFs3XVxuICAgICAgICBdLCBib3VuZHMpO1xuICAgICAgICB4ID0gY3VycmVudFs2XTtcbiAgICAgICAgeSA9IGN1cnJlbnRbN107XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICd6JzpcbiAgICAgIGNhc2UgJ1onOlxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcHJldmlvdXMgPSBjdXJyZW50O1xuICB9XG4gIHJldHVybiBib3VuZHM7XG59XG5cbmZ1bmN0aW9uIGFyZWEoaXRlbXMpIHtcbiAgdmFyIG8gPSBpdGVtc1swXTtcbiAgdmFyIGFyZWEgPSBkMy5zdmcuYXJlYSgpXG4gICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuICAgIC55MShmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG4gICAgLnkwKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueSArIGQuaGVpZ2h0OyB9KTtcbiAgaWYgKG8uaW50ZXJwb2xhdGUpIGFyZWEuaW50ZXJwb2xhdGUoby5pbnRlcnBvbGF0ZSk7XG4gIGlmIChvLnRlbnNpb24gIT0gbnVsbCkgYXJlYS50ZW5zaW9uKG8udGVuc2lvbik7XG4gIHJldHVybiBhcmVhKGl0ZW1zKTtcbn1cblxuZnVuY3Rpb24gbGluZShpdGVtcykge1xuICB2YXIgbyA9IGl0ZW1zWzBdO1xuICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKClcbiAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcbiAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSk7XG4gIGlmIChvLmludGVycG9sYXRlKSBsaW5lLmludGVycG9sYXRlKG8uaW50ZXJwb2xhdGUpO1xuICBpZiAoby50ZW5zaW9uICE9IG51bGwpIGxpbmUudGVuc2lvbihvLnRlbnNpb24pO1xuICByZXR1cm4gbGluZShpdGVtcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBwYXJzZTogIHBhcnNlLFxuICByZW5kZXI6IHJlbmRlcixcbiAgYm91bmRzOiBib3VuZHMsXG4gIGFyZWE6ICAgYXJlYSxcbiAgbGluZTogICBsaW5lXG59OyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKTtcblxudmFyIGhhbmRsZXIgPSBmdW5jdGlvbihlbCwgbW9kZWwpIHtcbiAgdGhpcy5fYWN0aXZlID0gbnVsbDtcbiAgdGhpcy5faGFuZGxlcnMgPSB7fTtcbiAgaWYgKGVsKSB0aGlzLmluaXRpYWxpemUoZWwpO1xuICBpZiAobW9kZWwpIHRoaXMubW9kZWwobW9kZWwpO1xufTtcblxuZnVuY3Rpb24gc3ZnSGFuZGxlcihoYW5kbGVyKSB7XG4gIHZhciB0aGF0ID0gdGhpcztcbiAgcmV0dXJuIGZ1bmN0aW9uKGV2dCkge1xuICAgIHZhciB0YXJnZXQgPSBldnQudGFyZ2V0LFxuICAgICAgICBpdGVtID0gdGFyZ2V0Ll9fZGF0YV9fO1xuXG4gICAgaWYgKGl0ZW0pIGl0ZW0gPSBpdGVtLm1hcmsgPyBpdGVtIDogaXRlbVswXTtcbiAgICBoYW5kbGVyLmNhbGwodGhhdC5fb2JqLCBldnQsIGl0ZW0pO1xuICB9O1xufVxuXG5mdW5jdGlvbiBldmVudE5hbWUobmFtZSkge1xuICB2YXIgaSA9IG5hbWUuaW5kZXhPZihcIi5cIik7XG4gIHJldHVybiBpIDwgMCA/IG5hbWUgOiBuYW1lLnNsaWNlKDAsaSk7XG59XG5cbnZhciBwcm90b3R5cGUgPSBoYW5kbGVyLnByb3RvdHlwZTtcblxucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbihlbCwgcGFkLCBvYmopIHtcbiAgdGhpcy5fZWwgPSBkMy5zZWxlY3QoZWwpLm5vZGUoKTtcbiAgdGhpcy5fc3ZnID0gZDMuc2VsZWN0KGVsKS5zZWxlY3QoXCJzdmcubWFya3NcIikubm9kZSgpO1xuICB0aGlzLl9wYWRkaW5nID0gcGFkO1xuICB0aGlzLl9vYmogPSBvYmogfHwgbnVsbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUucGFkZGluZyA9IGZ1bmN0aW9uKHBhZCkge1xuICB0aGlzLl9wYWRkaW5nID0gcGFkO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5tb2RlbCA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX21vZGVsO1xuICB0aGlzLl9tb2RlbCA9IG1vZGVsO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5oYW5kbGVycyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaCA9IHRoaXMuX2hhbmRsZXJzO1xuICByZXR1cm4gZGwua2V5cyhoKS5yZWR1Y2UoZnVuY3Rpb24oYSwgaykge1xuICAgIHJldHVybiBoW2tdLnJlZHVjZShmdW5jdGlvbihhLCB4KSB7IHJldHVybiAoYS5wdXNoKHgpLCBhKTsgfSwgYSk7XG4gIH0sIFtdKTtcbn07XG5cbi8vIGFkZCBhbiBldmVudCBoYW5kbGVyXG5wcm90b3R5cGUub24gPSBmdW5jdGlvbih0eXBlLCBoYW5kbGVyKSB7XG4gIHZhciBuYW1lID0gZXZlbnROYW1lKHR5cGUpLFxuICAgICAgaCA9IHRoaXMuX2hhbmRsZXJzLFxuICAgICAgZG9tID0gZDMuc2VsZWN0KHRoaXMuX3N2Zykubm9kZSgpO1xuICAgICAgXG4gIHZhciB4ID0ge1xuICAgIHR5cGU6IHR5cGUsXG4gICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICBzdmc6IHN2Z0hhbmRsZXIuY2FsbCh0aGlzLCBoYW5kbGVyKVxuICB9O1xuICBoID0gaFtuYW1lXSB8fCAoaFtuYW1lXSA9IFtdKTtcbiAgaC5wdXNoKHgpO1xuXG4gIGRvbS5hZGRFdmVudExpc3RlbmVyKG5hbWUsIHguc3ZnKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyByZW1vdmUgYW4gZXZlbnQgaGFuZGxlclxucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgdmFyIG5hbWUgPSBldmVudE5hbWUodHlwZSksXG4gICAgICBoID0gdGhpcy5faGFuZGxlcnNbbmFtZV0sXG4gICAgICBkb20gPSBkMy5zZWxlY3QodGhpcy5fc3ZnKS5ub2RlKCk7XG4gIGlmICghaCkgcmV0dXJuO1xuICBmb3IgKHZhciBpPWgubGVuZ3RoOyAtLWk+PTA7KSB7XG4gICAgaWYgKGhbaV0udHlwZSAhPT0gdHlwZSkgY29udGludWU7XG4gICAgaWYgKCFoYW5kbGVyIHx8IGhbaV0uaGFuZGxlciA9PT0gaGFuZGxlcikge1xuICAgICAgZG9tLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgaFtpXS5zdmcpO1xuICAgICAgaC5zcGxpY2UoaSwgMSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBoYW5kbGVyOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBtYXJrcyA9IHJlcXVpcmUoJy4vbWFya3MnKTtcblxudmFyIHJlbmRlcmVyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX3N2ZyA9IG51bGw7XG4gIHRoaXMuX2N0eCA9IG51bGw7XG4gIHRoaXMuX2VsID0gbnVsbDtcbiAgdGhpcy5fZGVmcyA9IHtcbiAgICBncmFkaWVudDoge30sXG4gICAgY2xpcHBpbmc6IHt9XG4gIH07XG59O1xuXG52YXIgcHJvdG90eXBlID0gcmVuZGVyZXIucHJvdG90eXBlO1xuXG5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKGVsLCB3aWR0aCwgaGVpZ2h0LCBwYWQpIHtcbiAgdGhpcy5fZWwgPSBlbDtcblxuICAvLyByZW1vdmUgYW55IGV4aXN0aW5nIHN2ZyBlbGVtZW50XG4gIGQzLnNlbGVjdChlbCkuc2VsZWN0KFwic3ZnLm1hcmtzXCIpLnJlbW92ZSgpO1xuXG4gIC8vIGNyZWF0ZSBzdmcgZWxlbWVudCBhbmQgaW5pdGlhbGl6ZSBhdHRyaWJ1dGVzXG4gIHRoaXMuX3N2ZyA9IGQzLnNlbGVjdChlbClcbiAgICAuYXBwZW5kKFwic3ZnXCIpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcIm1hcmtzXCIpO1xuICBcbiAgLy8gc2V0IHRoZSBzdmcgcm9vdCBncm91cFxuICB0aGlzLl9jdHggPSB0aGlzLl9zdmcuYXBwZW5kKFwiZ1wiKTtcbiAgXG4gIHJldHVybiB0aGlzLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0LCBwYWQpO1xufTtcblxucHJvdG90eXBlLnJlc2l6ZSA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIHBhZCkge1xuICB0aGlzLl93aWR0aCA9IHdpZHRoO1xuICB0aGlzLl9oZWlnaHQgPSBoZWlnaHQ7XG4gIHRoaXMuX3BhZGRpbmcgPSBwYWQ7XG4gIFxuICB0aGlzLl9zdmdcbiAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgcGFkLmxlZnQgKyBwYWQucmlnaHQpXG4gICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0ICsgcGFkLnRvcCArIHBhZC5ib3R0b20pO1xuICAgIFxuICB0aGlzLl9jdHhcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIitwYWQubGVmdCtcIixcIitwYWQudG9wK1wiKVwiKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5jb250ZXh0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9jdHg7XG59O1xuXG5wcm90b3R5cGUuZWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5fZWw7XG59O1xuXG5wcm90b3R5cGUudXBkYXRlRGVmcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc3ZnID0gdGhpcy5fc3ZnLFxuICAgICAgYWxsID0gdGhpcy5fZGVmcyxcbiAgICAgIGRncmFkID0gZGwua2V5cyhhbGwuZ3JhZGllbnQpLFxuICAgICAgZGNsaXAgPSBkbC5rZXlzKGFsbC5jbGlwcGluZyksXG4gICAgICBkZWZzID0gc3ZnLnNlbGVjdChcImRlZnNcIiksIGdyYWQsIGNsaXA7XG5cbiAgLy8gZ2V0IG9yIGNyZWF0ZSBzdmcgZGVmcyBibG9ja1xuICBpZiAoZGdyYWQubGVuZ3RoPT09MCAmJiBkY2xpcC5sZW5ndGg9PTApIHsgZGVmcy5yZW1vdmUoKTsgcmV0dXJuOyB9XG4gIGlmIChkZWZzLmVtcHR5KCkpIGRlZnMgPSBzdmcuaW5zZXJ0KFwiZGVmc1wiLCBcIjpmaXJzdC1jaGlsZFwiKTtcbiAgXG4gIGdyYWQgPSBkZWZzLnNlbGVjdEFsbChcImxpbmVhckdyYWRpZW50XCIpLmRhdGEoZGdyYWQsIGRsLmlkZW50aXR5KTtcbiAgZ3JhZC5lbnRlcigpLmFwcGVuZChcImxpbmVhckdyYWRpZW50XCIpLmF0dHIoXCJpZFwiLCBkbC5pZGVudGl0eSk7XG4gIGdyYWQuZXhpdCgpLnJlbW92ZSgpO1xuICBncmFkLmVhY2goZnVuY3Rpb24oaWQpIHtcbiAgICB2YXIgZGVmID0gYWxsLmdyYWRpZW50W2lkXSxcbiAgICAgICAgZ3JkID0gZDMuc2VsZWN0KHRoaXMpO1xuXG4gICAgLy8gc2V0IGdyYWRpZW50IGNvb3JkaW5hdGVzXG4gICAgZ3JkLmF0dHIoe3gxOiBkZWYueDEsIHgyOiBkZWYueDIsIHkxOiBkZWYueTEsIHkyOiBkZWYueTJ9KTtcblxuICAgIC8vIHNldCBncmFkaWVudCBzdG9wc1xuICAgIHN0b3AgPSBncmQuc2VsZWN0QWxsKFwic3RvcFwiKS5kYXRhKGRlZi5zdG9wcyk7XG4gICAgc3RvcC5lbnRlcigpLmFwcGVuZChcInN0b3BcIik7XG4gICAgc3RvcC5leGl0KCkucmVtb3ZlKCk7XG4gICAgc3RvcC5hdHRyKFwib2Zmc2V0XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQub2Zmc2V0OyB9KVxuICAgICAgICAuYXR0cihcInN0b3AtY29sb3JcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSk7XG4gIH0pO1xuICBcbiAgY2xpcCA9IGRlZnMuc2VsZWN0QWxsKFwiY2xpcFBhdGhcIikuZGF0YShkY2xpcCwgZGwuaWRlbnRpdHkpO1xuICBjbGlwLmVudGVyKCkuYXBwZW5kKFwiY2xpcFBhdGhcIikuYXR0cihcImlkXCIsIGRsLmlkZW50aXR5KTtcbiAgY2xpcC5leGl0KCkucmVtb3ZlKCk7XG4gIGNsaXAuZWFjaChmdW5jdGlvbihpZCkge1xuICAgIHZhciBkZWYgPSBhbGwuY2xpcHBpbmdbaWRdLFxuICAgICAgICBjciA9IGQzLnNlbGVjdCh0aGlzKS5zZWxlY3RBbGwoXCJyZWN0XCIpLmRhdGEoWzFdKTtcbiAgICBjci5lbnRlcigpLmFwcGVuZChcInJlY3RcIik7XG4gICAgY3IuYXR0cihcInhcIiwgMClcbiAgICAgIC5hdHRyKFwieVwiLCAwKVxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBkZWYud2lkdGgpXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBkZWYuaGVpZ2h0KTtcbiAgfSk7XG59O1xuXG5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oc2NlbmUsIGl0ZW1zKSB7XG4gIG1hcmtzLmN1cnJlbnQgPSB0aGlzO1xuXG4gIGlmIChpdGVtcykge1xuICAgIHRoaXMucmVuZGVySXRlbXMoZGwuYXJyYXkoaXRlbXMpKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmRyYXcodGhpcy5fY3R4LCBzY2VuZSwgLTEpO1xuICB9XG4gIHRoaXMudXBkYXRlRGVmcygpO1xuXG4gZGVsZXRlIG1hcmtzLmN1cnJlbnQ7XG59O1xuXG5wcm90b3R5cGUucmVuZGVySXRlbXMgPSBmdW5jdGlvbihpdGVtcykge1xuICB2YXIgaXRlbSwgbm9kZSwgdHlwZSwgbmVzdCwgaSwgbjtcblxuICBmb3IgKGk9MCwgbj1pdGVtcy5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgaXRlbSA9IGl0ZW1zW2ldO1xuICAgIG5vZGUgPSBpdGVtLl9zdmc7XG4gICAgdHlwZSA9IGl0ZW0ubWFyay5tYXJrdHlwZTtcblxuICAgIGl0ZW0gPSBtYXJrcy5uZXN0ZWRbdHlwZV0gPyBpdGVtLm1hcmsuaXRlbXMgOiBpdGVtO1xuICAgIG1hcmtzLnVwZGF0ZVt0eXBlXS5jYWxsKG5vZGUsIGl0ZW0pO1xuICAgIG1hcmtzLnN0eWxlLmNhbGwobm9kZSwgaXRlbSk7XG4gIH1cbn1cblxucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjdHgsIHNjZW5lLCBpbmRleCkge1xuICB2YXIgbWFya3R5cGUgPSBzY2VuZS5tYXJrdHlwZSxcbiAgICAgIHJlbmRlcmVyID0gbWFya3MuZHJhd1ttYXJrdHlwZV07XG4gIHJlbmRlcmVyLmNhbGwodGhpcywgY3R4LCBzY2VuZSwgaW5kZXgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZW5kZXJlcjsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgICBjb25maWcgPSByZXF1aXJlKCcuLi8uLi91dGlsL2NvbmZpZycpO1xuXG5mdW5jdGlvbiB4KG8pICAgICB7IHJldHVybiBvLnggfHwgMDsgfVxuZnVuY3Rpb24geShvKSAgICAgeyByZXR1cm4gby55IHx8IDA7IH1cbmZ1bmN0aW9uIHloKG8pICAgIHsgcmV0dXJuIG8ueSArIG8uaGVpZ2h0IHx8IDA7IH1cbmZ1bmN0aW9uIGtleShvKSAgIHsgcmV0dXJuIG8ua2V5OyB9XG5mdW5jdGlvbiBzaXplKG8pICB7IHJldHVybiBvLnNpemU9PW51bGwgPyAxMDAgOiBvLnNpemU7IH1cbmZ1bmN0aW9uIHNoYXBlKG8pIHsgcmV0dXJuIG8uc2hhcGUgfHwgXCJjaXJjbGVcIjsgfVxuICAgIFxudmFyIGFyY19wYXRoICAgID0gZDMuc3ZnLmFyYygpLFxuICAgIGFyZWFfcGF0aCAgID0gZDMuc3ZnLmFyZWEoKS54KHgpLnkxKHkpLnkwKHloKSxcbiAgICBsaW5lX3BhdGggICA9IGQzLnN2Zy5saW5lKCkueCh4KS55KHkpLFxuICAgIHN5bWJvbF9wYXRoID0gZDMuc3ZnLnN5bWJvbCgpLnR5cGUoc2hhcGUpLnNpemUoc2l6ZSk7XG5cbnZhciBtYXJrX2lkID0gMCxcbiAgICBjbGlwX2lkID0gMDtcblxudmFyIHRleHRBbGlnbiA9IHtcbiAgXCJsZWZ0XCI6ICAgXCJzdGFydFwiLFxuICBcImNlbnRlclwiOiBcIm1pZGRsZVwiLFxuICBcInJpZ2h0XCI6ICBcImVuZFwiXG59O1xuXG52YXIgc3R5bGVzID0ge1xuICBcImZpbGxcIjogICAgICAgICAgICAgXCJmaWxsXCIsXG4gIFwiZmlsbE9wYWNpdHlcIjogICAgICBcImZpbGwtb3BhY2l0eVwiLFxuICBcInN0cm9rZVwiOiAgICAgICAgICAgXCJzdHJva2VcIixcbiAgXCJzdHJva2VXaWR0aFwiOiAgICAgIFwic3Ryb2tlLXdpZHRoXCIsXG4gIFwic3Ryb2tlT3BhY2l0eVwiOiAgICBcInN0cm9rZS1vcGFjaXR5XCIsXG4gIFwic3Ryb2tlQ2FwXCI6ICAgICAgICBcInN0cm9rZS1saW5lY2FwXCIsXG4gIFwic3Ryb2tlRGFzaFwiOiAgICAgICBcInN0cm9rZS1kYXNoYXJyYXlcIixcbiAgXCJzdHJva2VEYXNoT2Zmc2V0XCI6IFwic3Ryb2tlLWRhc2hvZmZzZXRcIixcbiAgXCJvcGFjaXR5XCI6ICAgICAgICAgIFwib3BhY2l0eVwiXG59O1xudmFyIHN0eWxlUHJvcHMgPSBkbC5rZXlzKHN0eWxlcyk7XG5cbmZ1bmN0aW9uIHN0eWxlKGQpIHtcbiAgdmFyIGksIG4sIHByb3AsIG5hbWUsIHZhbHVlLFxuICAgICAgbyA9IGQubWFyayA/IGQgOiBkLmxlbmd0aCA/IGRbMF0gOiBudWxsO1xuICBpZiAobyA9PT0gbnVsbCkgcmV0dXJuO1xuXG4gIGZvciAoaT0wLCBuPXN0eWxlUHJvcHMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIHByb3AgPSBzdHlsZVByb3BzW2ldO1xuICAgIG5hbWUgPSBzdHlsZXNbcHJvcF07XG4gICAgdmFsdWUgPSBvW3Byb3BdO1xuXG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIGlmIChuYW1lID09PSBcImZpbGxcIikgdGhpcy5zdHlsZS5zZXRQcm9wZXJ0eShuYW1lLCBcIm5vbmVcIiwgbnVsbCk7XG4gICAgICBlbHNlIHRoaXMuc3R5bGUucmVtb3ZlUHJvcGVydHkobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh2YWx1ZS5pZCkge1xuICAgICAgICAvLyBlbnN1cmUgZGVmaW5pdGlvbiBpcyBpbmNsdWRlZFxuICAgICAgICBtYXJrcy5jdXJyZW50Ll9kZWZzLmdyYWRpZW50W3ZhbHVlLmlkXSA9IHZhbHVlO1xuICAgICAgICB2YWx1ZSA9IFwidXJsKCNcIiArIHZhbHVlLmlkICsgXCIpXCI7XG4gICAgICB9XG4gICAgICB0aGlzLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIHZhbHVlK1wiXCIsIG51bGwpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhcmMobykge1xuICB2YXIgeCA9IG8ueCB8fCAwLFxuICAgICAgeSA9IG8ueSB8fCAwO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIit4K1wiLFwiK3krXCIpXCIpO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcImRcIiwgYXJjX3BhdGgobykpO1xufVxuXG5mdW5jdGlvbiBhcmVhKGl0ZW1zKSB7XG4gIGlmICghaXRlbXMubGVuZ3RoKSByZXR1cm47XG4gIHZhciBvID0gaXRlbXNbMF07XG4gIGFyZWFfcGF0aFxuICAgIC5pbnRlcnBvbGF0ZShvLmludGVycG9sYXRlIHx8IFwibGluZWFyXCIpXG4gICAgLnRlbnNpb24oby50ZW5zaW9uID09IG51bGwgPyAwLjcgOiBvLnRlbnNpb24pO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcImRcIiwgYXJlYV9wYXRoKGl0ZW1zKSk7XG59XG5cbmZ1bmN0aW9uIGxpbmUoaXRlbXMpIHtcbiAgaWYgKCFpdGVtcy5sZW5ndGgpIHJldHVybjtcbiAgdmFyIG8gPSBpdGVtc1swXTtcbiAgbGluZV9wYXRoXG4gICAgLmludGVycG9sYXRlKG8uaW50ZXJwb2xhdGUgfHwgXCJsaW5lYXJcIilcbiAgICAudGVuc2lvbihvLnRlbnNpb24gPT0gbnVsbCA/IDAuNyA6IG8udGVuc2lvbik7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwiZFwiLCBsaW5lX3BhdGgoaXRlbXMpKTtcbn1cblxuZnVuY3Rpb24gcGF0aChvKSB7XG4gIHZhciB4ID0gby54IHx8IDAsXG4gICAgICB5ID0gby55IHx8IDA7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiK3grXCIsXCIreStcIilcIik7XG4gIGlmIChvLnBhdGggIT0gbnVsbCkgdGhpcy5zZXRBdHRyaWJ1dGUoXCJkXCIsIG8ucGF0aCk7XG59XG5cbmZ1bmN0aW9uIHJlY3Qobykge1xuICB0aGlzLnNldEF0dHJpYnV0ZShcInhcIiwgby54IHx8IDApO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcInlcIiwgby55IHx8IDApO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIG8ud2lkdGggfHwgMCk7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIG8uaGVpZ2h0IHx8IDApO1xufVxuXG5mdW5jdGlvbiBydWxlKG8pIHtcbiAgdmFyIHgxID0gby54IHx8IDAsXG4gICAgICB5MSA9IG8ueSB8fCAwO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcIngxXCIsIHgxKTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ5MVwiLCB5MSk7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwieDJcIiwgby54MiAhPSBudWxsID8gby54MiA6IHgxKTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ5MlwiLCBvLnkyICE9IG51bGwgPyBvLnkyIDogeTEpO1xufVxuXG5mdW5jdGlvbiBzeW1ib2wobykge1xuICB2YXIgeCA9IG8ueCB8fCAwLFxuICAgICAgeSA9IG8ueSB8fCAwO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIit4K1wiLFwiK3krXCIpXCIpO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcImRcIiwgc3ltYm9sX3BhdGgobykpO1xufVxuXG5mdW5jdGlvbiBpbWFnZShvKSB7XG4gIHZhciB3ID0gby53aWR0aCB8fCAoby5pbWFnZSAmJiBvLmltYWdlLndpZHRoKSB8fCAwLFxuICAgICAgaCA9IG8uaGVpZ2h0IHx8IChvLmltYWdlICYmIG8uaW1hZ2UuaGVpZ2h0KSB8fCAwLFxuICAgICAgeCA9IG8ueCAtIChvLmFsaWduID09PSBcImNlbnRlclwiXG4gICAgICAgID8gdy8yIDogKG8uYWxpZ24gPT09IFwicmlnaHRcIiA/IHcgOiAwKSksXG4gICAgICB5ID0gby55IC0gKG8uYmFzZWxpbmUgPT09IFwibWlkZGxlXCJcbiAgICAgICAgPyBoLzIgOiAoby5iYXNlbGluZSA9PT0gXCJib3R0b21cIiA/IGggOiAwKSksXG4gICAgICB1cmwgPSBjb25maWcuYmFzZVVSTCArIG8udXJsO1xuICBcbiAgdGhpcy5zZXRBdHRyaWJ1dGVOUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiwgXCJocmVmXCIsIHVybCk7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwieFwiLCB4KTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ5XCIsIHkpO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIHcpO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCBoKTtcbn1cbiAgXG5mdW5jdGlvbiBmb250U3RyaW5nKG8pIHtcbiAgcmV0dXJuIChvLmZvbnRTdHlsZSA/IG8uZm9udFN0eWxlICsgXCIgXCIgOiBcIlwiKVxuICAgICsgKG8uZm9udFZhcmlhbnQgPyBvLmZvbnRWYXJpYW50ICsgXCIgXCIgOiBcIlwiKVxuICAgICsgKG8uZm9udFdlaWdodCA/IG8uZm9udFdlaWdodCArIFwiIFwiIDogXCJcIilcbiAgICArIChvLmZvbnRTaXplICE9IG51bGwgPyBvLmZvbnRTaXplIDogY29uZmlnLnJlbmRlci5mb250U2l6ZSkgKyBcInB4IFwiXG4gICAgKyAoby5mb250IHx8IGNvbmZpZy5yZW5kZXIuZm9udCk7XG59XG5cbmZ1bmN0aW9uIHRleHQobykge1xuICB2YXIgeCA9IG8ueCB8fCAwLFxuICAgICAgeSA9IG8ueSB8fCAwLFxuICAgICAgZHggPSBvLmR4IHx8IDAsXG4gICAgICBkeSA9IG8uZHkgfHwgMCxcbiAgICAgIGEgPSBvLmFuZ2xlIHx8IDAsXG4gICAgICByID0gby5yYWRpdXMgfHwgMCxcbiAgICAgIGFsaWduID0gdGV4dEFsaWduW28uYWxpZ24gfHwgXCJsZWZ0XCJdLFxuICAgICAgYmFzZSA9IG8uYmFzZWxpbmU9PT1cInRvcFwiID8gXCIuOWVtXCJcbiAgICAgICAgICAgOiBvLmJhc2VsaW5lPT09XCJtaWRkbGVcIiA/IFwiLjM1ZW1cIiA6IDA7XG5cbiAgaWYgKHIpIHtcbiAgICB2YXIgdCA9IChvLnRoZXRhIHx8IDApIC0gTWF0aC5QSS8yO1xuICAgIHggKz0gciAqIE1hdGguY29zKHQpO1xuICAgIHkgKz0gciAqIE1hdGguc2luKHQpO1xuICB9XG5cbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ4XCIsIHggKyBkeCk7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwieVwiLCB5ICsgZHkpO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcInRleHQtYW5jaG9yXCIsIGFsaWduKTtcbiAgXG4gIGlmIChhKSB0aGlzLnNldEF0dHJpYnV0ZShcInRyYW5zZm9ybVwiLCBcInJvdGF0ZShcIithK1wiIFwiK3grXCIsXCIreStcIilcIik7XG4gIGVsc2UgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoXCJ0cmFuc2Zvcm1cIik7XG4gIFxuICBpZiAoYmFzZSkgdGhpcy5zZXRBdHRyaWJ1dGUoXCJkeVwiLCBiYXNlKTtcbiAgZWxzZSB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcImR5XCIpO1xuICBcbiAgdGhpcy50ZXh0Q29udGVudCA9IG8udGV4dDtcbiAgdGhpcy5zdHlsZS5zZXRQcm9wZXJ0eShcImZvbnRcIiwgZm9udFN0cmluZyhvKSwgbnVsbCk7XG59XG5cbmZ1bmN0aW9uIGdyb3VwKG8pIHtcbiAgdmFyIHggPSBvLnggfHwgMCxcbiAgICAgIHkgPSBvLnkgfHwgMDtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIreCtcIixcIit5K1wiKVwiKTtcblxuICBpZiAoby5jbGlwKSB7XG4gICAgdmFyIGMgPSB7d2lkdGg6IG8ud2lkdGggfHwgMCwgaGVpZ2h0OiBvLmhlaWdodCB8fCAwfSxcbiAgICAgICAgaWQgPSBvLmNsaXBfaWQgfHwgKG8uY2xpcF9pZCA9IFwiY2xpcFwiICsgY2xpcF9pZCsrKTtcbiAgICBtYXJrcy5jdXJyZW50Ll9kZWZzLmNsaXBwaW5nW2lkXSA9IGM7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJjbGlwLXBhdGhcIiwgXCJ1cmwoI1wiK2lkK1wiKVwiKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBncm91cF9iZyhvKSB7XG4gIHZhciB3ID0gby53aWR0aCB8fCAwLFxuICAgICAgaCA9IG8uaGVpZ2h0IHx8IDA7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgdyk7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIGgpO1xufVxuXG5mdW5jdGlvbiBjc3NDbGFzcyhkZWYpIHtcbiAgdmFyIGNscyA9IFwidHlwZS1cIiArIGRlZi50eXBlO1xuICBpZiAoZGVmLm5hbWUpIGNscyArPSBcIiBcIiArIGRlZi5uYW1lO1xuICByZXR1cm4gY2xzO1xufVxuXG5mdW5jdGlvbiBkcmF3KHRhZywgYXR0ciwgbmVzdCkge1xuICByZXR1cm4gZnVuY3Rpb24oZywgc2NlbmUsIGluZGV4KSB7XG4gICAgZHJhd01hcmsoZywgc2NlbmUsIGluZGV4LCBcIm1hcmtfXCIsIHRhZywgYXR0ciwgbmVzdCk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGRyYXdNYXJrKGcsIHNjZW5lLCBpbmRleCwgcHJlZml4LCB0YWcsIGF0dHIsIG5lc3QpIHtcbiAgdmFyIGRhdGEgPSBuZXN0ID8gW3NjZW5lLml0ZW1zXSA6IHNjZW5lLml0ZW1zLFxuICAgICAgZXZ0cyA9IHNjZW5lLmludGVyYWN0aXZlPT09ZmFsc2UgPyBcIm5vbmVcIiA6IG51bGwsXG4gICAgICBncnBzID0gZy5ub2RlKCkuY2hpbGROb2RlcyxcbiAgICAgIG5vdEcgPSAodGFnICE9PSBcImdcIiksXG4gICAgICBwID0gKHAgPSBncnBzW2luZGV4KzFdKSAvLyArMSB0byBza2lwIGdyb3VwIGJhY2tncm91bmQgcmVjdFxuICAgICAgICA/IGQzLnNlbGVjdChwKVxuICAgICAgICA6IGcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAgICAuYXR0cihcImlkXCIsIFwiZ1wiKygrK21hcmtfaWQpKVxuICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIGNzc0NsYXNzKHNjZW5lLmRlZikpO1xuXG4gIHZhciBpZCA9IHAuYXR0cihcImlkXCIpLFxuICAgICAgcyA9IFwiI1wiICsgaWQgKyBcIiA+IFwiICsgdGFnLFxuICAgICAgbSA9IHAuc2VsZWN0QWxsKHMpLmRhdGEoZGF0YSksXG4gICAgICBlID0gbS5lbnRlcigpLmFwcGVuZCh0YWcpO1xuXG4gIGlmIChub3RHKSB7XG4gICAgcC5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsIGV2dHMpO1xuICAgIGUuZWFjaChmdW5jdGlvbihkKSB7XG4gICAgICBpZiAoZC5tYXJrKSBkLl9zdmcgPSB0aGlzO1xuICAgICAgZWxzZSBpZiAoZC5sZW5ndGgpIGRbMF0uX3N2ZyA9IHRoaXM7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgZS5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLFwiYmFja2dyb3VuZFwiKS5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsZXZ0cyk7XG4gIH1cbiAgXG4gIG0uZXhpdCgpLnJlbW92ZSgpO1xuICBtLmVhY2goYXR0cik7XG4gIGlmIChub3RHKSBtLmVhY2goc3R5bGUpO1xuICBlbHNlIHAuc2VsZWN0QWxsKHMrXCIgPiByZWN0LmJhY2tncm91bmRcIikuZWFjaChncm91cF9iZykuZWFjaChzdHlsZSk7XG4gIFxuICByZXR1cm4gcDtcbn1cblxuZnVuY3Rpb24gZHJhd0dyb3VwKGcsIHNjZW5lLCBpbmRleCwgcHJlZml4KSB7ICAgIFxuICB2YXIgcCA9IGRyYXdNYXJrKGcsIHNjZW5lLCBpbmRleCwgcHJlZml4IHx8IFwiZ3JvdXBfXCIsIFwiZ1wiLCBncm91cCksXG4gICAgICBjID0gcC5ub2RlKCkuY2hpbGROb2RlcywgbiA9IGMubGVuZ3RoLCBpLCBqLCBtO1xuICBcbiAgZm9yIChpPTA7IGk8bjsgKytpKSB7XG4gICAgdmFyIGl0ZW1zID0gY1tpXS5fX2RhdGFfXy5pdGVtcyxcbiAgICAgICAgbGVnZW5kcyA9IGNbaV0uX19kYXRhX18ubGVnZW5kSXRlbXMgfHwgW10sXG4gICAgICAgIGF4ZXMgPSBjW2ldLl9fZGF0YV9fLmF4aXNJdGVtcyB8fCBbXSxcbiAgICAgICAgc2VsID0gZDMuc2VsZWN0KGNbaV0pLFxuICAgICAgICBpZHggPSAwO1xuXG4gICAgZm9yIChqPTAsIG09YXhlcy5sZW5ndGg7IGo8bTsgKytqKSB7XG4gICAgICBpZiAoYXhlc1tqXS5kZWYubGF5ZXIgPT09IFwiYmFja1wiKSB7XG4gICAgICAgIGRyYXdHcm91cC5jYWxsKHRoaXMsIHNlbCwgYXhlc1tqXSwgaWR4KyssIFwiYXhpc19cIik7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoaj0wLCBtPWl0ZW1zLmxlbmd0aDsgajxtOyArK2opIHtcbiAgICAgIHRoaXMuZHJhdyhzZWwsIGl0ZW1zW2pdLCBpZHgrKyk7XG4gICAgfVxuICAgIGZvciAoaj0wLCBtPWF4ZXMubGVuZ3RoOyBqPG07ICsraikge1xuICAgICAgaWYgKGF4ZXNbal0uZGVmLmxheWVyICE9PSBcImJhY2tcIikge1xuICAgICAgICBkcmF3R3JvdXAuY2FsbCh0aGlzLCBzZWwsIGF4ZXNbal0sIGlkeCsrLCBcImF4aXNfXCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGo9MCwgbT1sZWdlbmRzLmxlbmd0aDsgajxtOyArK2opIHtcbiAgICAgIGRyYXdHcm91cC5jYWxsKHRoaXMsIHNlbCwgbGVnZW5kc1tqXSwgaWR4KyssIFwibGVnZW5kX1wiKTtcbiAgICB9XG4gIH1cbn1cblxudmFyIG1hcmtzID0gbW9kdWxlLmV4cG9ydHMgPSB7XG4gIHVwZGF0ZToge1xuICAgIGdyb3VwOiAgIHJlY3QsXG4gICAgYXJlYTogICAgYXJlYSxcbiAgICBsaW5lOiAgICBsaW5lLFxuICAgIGFyYzogICAgIGFyYyxcbiAgICBwYXRoOiAgICBwYXRoLFxuICAgIHN5bWJvbDogIHN5bWJvbCxcbiAgICByZWN0OiAgICByZWN0LFxuICAgIHJ1bGU6ICAgIHJ1bGUsXG4gICAgdGV4dDogICAgdGV4dCxcbiAgICBpbWFnZTogICBpbWFnZVxuICB9LFxuICBuZXN0ZWQ6IHtcbiAgICBcImFyZWFcIjogdHJ1ZSxcbiAgICBcImxpbmVcIjogdHJ1ZVxuICB9LFxuICBzdHlsZTogc3R5bGUsXG4gIGRyYXc6IHtcbiAgICBncm91cDogICBkcmF3R3JvdXAsXG4gICAgYXJlYTogICAgZHJhdyhcInBhdGhcIiwgYXJlYSwgdHJ1ZSksXG4gICAgbGluZTogICAgZHJhdyhcInBhdGhcIiwgbGluZSwgdHJ1ZSksXG4gICAgYXJjOiAgICAgZHJhdyhcInBhdGhcIiwgYXJjKSxcbiAgICBwYXRoOiAgICBkcmF3KFwicGF0aFwiLCBwYXRoKSxcbiAgICBzeW1ib2w6ICBkcmF3KFwicGF0aFwiLCBzeW1ib2wpLFxuICAgIHJlY3Q6ICAgIGRyYXcoXCJyZWN0XCIsIHJlY3QpLFxuICAgIHJ1bGU6ICAgIGRyYXcoXCJsaW5lXCIsIHJ1bGUpLFxuICAgIHRleHQ6ICAgIGRyYXcoXCJ0ZXh0XCIsIHRleHQpLFxuICAgIGltYWdlOiAgIGRyYXcoXCJpbWFnZVwiLCBpbWFnZSksXG4gICAgZHJhdzogICAgZHJhdyAvLyBleHBvc2UgZm9yIGV4dGVuc2liaWxpdHlcbiAgfSxcbiAgY3VycmVudDogbnVsbFxufTsiLCJ2YXIgTm9kZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L05vZGUnKSxcbiAgICBib3VuZHMgPSByZXF1aXJlKCcuLi91dGlsL2JvdW5kcycpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpO1xuXG5mdW5jdGlvbiBCb3VuZGVyKG1vZGVsLCBtYXJrKSB7XG4gIHRoaXMuX21hcmsgPSBtYXJrO1xuICByZXR1cm4gTm9kZS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIG1vZGVsLmdyYXBoKS5yb3V0ZXIodHJ1ZSk7XG59XG5cbnZhciBwcm90byA9IChCb3VuZGVyLnByb3RvdHlwZSA9IG5ldyBOb2RlKCkpO1xuXG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGRlYnVnKGlucHV0LCBbXCJib3VuZHNcIiwgdGhpcy5fbWFyay5tYXJrdHlwZV0pO1xuXG4gIGJvdW5kcy5tYXJrKHRoaXMuX21hcmspO1xuICBpZiAodGhpcy5fbWFyay5tYXJrdHlwZSA9PT0gQy5HUk9VUCkgXG4gICAgYm91bmRzLm1hcmsodGhpcy5fbWFyaywgbnVsbCwgZmFsc2UpO1xuXG4gIGlucHV0LnJlZmxvdyA9IHRydWU7XG4gIHJldHVybiBpbnB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQm91bmRlcjsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgTm9kZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L05vZGUnKSxcbiAgICBFbmNvZGVyICA9IHJlcXVpcmUoJy4vRW5jb2RlcicpLFxuICAgIEJvdW5kZXIgID0gcmVxdWlyZSgnLi9Cb3VuZGVyJyksXG4gICAgSXRlbSAgPSByZXF1aXJlKCcuL0l0ZW0nKSxcbiAgICBwYXJzZURhdGEgPSByZXF1aXJlKCcuLi9wYXJzZS9kYXRhJyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBCdWlsZGVyKCkgeyAgICBcbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPyB0aGlzLmluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKSA6IHRoaXM7XG59XG5cbnZhciBwcm90byA9IChCdWlsZGVyLnByb3RvdHlwZSA9IG5ldyBOb2RlKCkpO1xuXG5wcm90by5pbml0ID0gZnVuY3Rpb24obW9kZWwsIGRlZiwgbWFyaywgcGFyZW50LCBwYXJlbnRfaWQsIGluaGVyaXRGcm9tKSB7XG4gIE5vZGUucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBtb2RlbC5ncmFwaClcbiAgICAucm91dGVyKHRydWUpXG4gICAgLmNvbGxlY3Rvcih0cnVlKTtcblxuICB0aGlzLl9tb2RlbCA9IG1vZGVsO1xuICB0aGlzLl9kZWYgICA9IGRlZjtcbiAgdGhpcy5fbWFyayAgPSBtYXJrO1xuICB0aGlzLl9mcm9tICA9IChkZWYuZnJvbSA/IGRlZi5mcm9tLmRhdGEgOiBudWxsKSB8fCBpbmhlcml0RnJvbTtcbiAgdGhpcy5fZHMgICAgPSBkbC5pc1N0cmluZyh0aGlzLl9mcm9tKSA/IG1vZGVsLmRhdGEodGhpcy5fZnJvbSkgOiBudWxsO1xuICB0aGlzLl9tYXAgICA9IHt9O1xuXG4gIHRoaXMuX3JldmlzZXMgPSBmYWxzZTsgIC8vIFNob3VsZCBzY2VuZWdyYXBoIGl0ZW1zIHRyYWNrIF9wcmV2P1xuXG4gIG1hcmsuZGVmID0gZGVmO1xuICBtYXJrLm1hcmt0eXBlID0gZGVmLnR5cGU7XG4gIG1hcmsuaW50ZXJhY3RpdmUgPSAhKGRlZi5pbnRlcmFjdGl2ZSA9PT0gZmFsc2UpO1xuICBtYXJrLml0ZW1zID0gW107XG5cbiAgdGhpcy5fcGFyZW50ID0gcGFyZW50O1xuICB0aGlzLl9wYXJlbnRfaWQgPSBwYXJlbnRfaWQ7XG5cbiAgaWYoZGVmLmZyb20gJiYgKGRlZi5mcm9tLm1hcmsgfHwgZGVmLmZyb20udHJhbnNmb3JtIHx8IGRlZi5mcm9tLm1vZGlmeSkpIHtcbiAgICBpbmxpbmVEcy5jYWxsKHRoaXMpO1xuICB9XG5cbiAgLy8gTm9uLWdyb3VwIG1hcmsgYnVpbGRlcnMgYXJlIHN1cGVyIG5vZGVzLiBFbmNvZGVyIGFuZCBCb3VuZGVyIHJlbWFpbiBcbiAgLy8gc2VwYXJhdGUgb3BlcmF0b3JzIGJ1dCBhcmUgZW1iZWRkZWQgYW5kIGNhbGxlZCBieSBCdWlsZGVyLmV2YWx1YXRlLlxuICB0aGlzLl9pc1N1cGVyID0gKHRoaXMuX2RlZi50eXBlICE9PSBDLkdST1VQKTsgXG4gIHRoaXMuX2VuY29kZXIgPSBuZXcgRW5jb2Rlcih0aGlzLl9tb2RlbCwgdGhpcy5fbWFyayk7XG4gIHRoaXMuX2JvdW5kZXIgPSBuZXcgQm91bmRlcih0aGlzLl9tb2RlbCwgdGhpcy5fbWFyayk7XG5cbiAgaWYodGhpcy5fZHMpIHsgdGhpcy5fZW5jb2Rlci5kZXBlbmRlbmN5KEMuREFUQSwgdGhpcy5fZnJvbSk7IH1cblxuICAvLyBTaW5jZSBCdWlsZGVycyBhcmUgc3VwZXIgbm9kZXMsIGNvcHkgb3ZlciBlbmNvZGVyIGRlcGVuZGVuY2llc1xuICAvLyAoYm91bmRlciBoYXMgbm8gcmVnaXN0ZXJlZCBkZXBlbmRlbmNpZXMpLlxuICB0aGlzLmRlcGVuZGVuY3koQy5EQVRBLCB0aGlzLl9lbmNvZGVyLmRlcGVuZGVuY3koQy5EQVRBKSk7XG4gIHRoaXMuZGVwZW5kZW5jeShDLlNDQUxFUywgdGhpcy5fZW5jb2Rlci5kZXBlbmRlbmN5KEMuU0NBTEVTKSk7XG4gIHRoaXMuZGVwZW5kZW5jeShDLlNJR05BTFMsIHRoaXMuX2VuY29kZXIuZGVwZW5kZW5jeShDLlNJR05BTFMpKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLnJldmlzZXMgPSBmdW5jdGlvbihwKSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fcmV2aXNlcztcblxuICAvLyBJZiB3ZSd2ZSBub3QgbmVlZGVkIHByZXYgaW4gdGhlIHBhc3QsIGJ1dCBhIG5ldyBpbmxpbmUgZHMgbmVlZHMgaXQgbm93XG4gIC8vIGVuc3VyZSBleGlzdGluZyBpdGVtcyBoYXZlIHByZXYgc2V0LlxuICBpZighdGhpcy5fcmV2aXNlcyAmJiBwKSB7XG4gICAgdGhpcy5faXRlbXMuZm9yRWFjaChmdW5jdGlvbihkKSB7IGlmKGQuX3ByZXYgPT09IHVuZGVmaW5lZCkgZC5fcHJldiA9IEMuU0VOVElORUw7IH0pO1xuICB9XG5cbiAgdGhpcy5fcmV2aXNlcyA9IHRoaXMuX3JldmlzZXMgfHwgcDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBSZWFjdGl2ZSBnZW9tZXRyeSBhbmQgbWFyay1sZXZlbCB0cmFuc2Zvcm1hdGlvbnMgYXJlIGhhbmRsZWQgaGVyZSBcbi8vIGJlY2F1c2UgdGhleSBuZWVkIHRoZWlyIGdyb3VwJ3MgZGF0YS1qb2luZWQgY29udGV4dC4gXG5mdW5jdGlvbiBpbmxpbmVEcygpIHtcbiAgdmFyIGZyb20gPSB0aGlzLl9kZWYuZnJvbSxcbiAgICAgIGdlb20gPSBmcm9tLm1hcmssXG4gICAgICBzcmMsIG5hbWUsIHNwZWMsIHNpYmxpbmcsIG91dHB1dDtcblxuICBpZihnZW9tKSB7XG4gICAgbmFtZSA9IFtcInZnXCIsIHRoaXMuX3BhcmVudF9pZCwgZ2VvbV0uam9pbihcIl9cIik7XG4gICAgc3BlYyA9IHtcbiAgICAgIG5hbWU6IG5hbWUsXG4gICAgICB0cmFuc2Zvcm06IGZyb20udHJhbnNmb3JtLCBcbiAgICAgIG1vZGlmeTogZnJvbS5tb2RpZnlcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIHNyYyA9IHRoaXMuX21vZGVsLmRhdGEodGhpcy5fZnJvbSk7XG4gICAgbmFtZSA9IFtcInZnXCIsIHRoaXMuX2Zyb20sIHRoaXMuX2RlZi50eXBlLCBzcmMubGlzdGVuZXJzKHRydWUpLmxlbmd0aF0uam9pbihcIl9cIik7XG4gICAgc3BlYyA9IHtcbiAgICAgIG5hbWU6IG5hbWUsXG4gICAgICBzb3VyY2U6IHRoaXMuX2Zyb20sXG4gICAgICB0cmFuc2Zvcm06IGZyb20udHJhbnNmb3JtLFxuICAgICAgbW9kaWZ5OiBmcm9tLm1vZGlmeVxuICAgIH07XG4gIH1cblxuICB0aGlzLl9mcm9tID0gbmFtZTtcbiAgdGhpcy5fZHMgPSBwYXJzZURhdGEuZGF0YXNvdXJjZSh0aGlzLl9tb2RlbCwgc3BlYyk7XG4gIHZhciByZXZpc2VzID0gdGhpcy5fZHMucmV2aXNlcygpO1xuXG4gIGlmKGdlb20pIHtcbiAgICBzaWJsaW5nID0gdGhpcy5zaWJsaW5nKGdlb20pLnJldmlzZXMocmV2aXNlcyk7XG4gICAgaWYoc2libGluZy5faXNTdXBlcikgc2libGluZy5hZGRMaXN0ZW5lcih0aGlzLl9kcy5saXN0ZW5lcigpKTtcbiAgICBlbHNlIHNpYmxpbmcuX2JvdW5kZXIuYWRkTGlzdGVuZXIodGhpcy5fZHMubGlzdGVuZXIoKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gQXQgdGhpcyBwb2ludCwgd2UgaGF2ZSBhIG5ldyBkYXRhc291cmNlIGJ1dCBpdCBpcyBlbXB0eSBhc1xuICAgIC8vIHRoZSBwcm9wYWdhdGlvbiBjeWNsZSBoYXMgYWxyZWFkeSBjcm9zc2VkIHRoZSBkYXRhc291cmNlcy4gXG4gICAgLy8gU28sIHdlIHJlcHVsc2UganVzdCB0aGlzIGRhdGFzb3VyY2UuIFRoaXMgc2hvdWxkIGJlIHNhZmVcbiAgICAvLyBhcyB0aGUgZHMgaXNuJ3QgY29ubmVjdGVkIHRvIHRoZSBzY2VuZWdyYXBoIHlldC5cbiAgICBcbiAgICB2YXIgb3V0cHV0ID0gdGhpcy5fZHMuc291cmNlKCkucmV2aXNlcyhyZXZpc2VzKS5sYXN0KCk7XG4gICAgICAgIGlucHV0ICA9IGNoYW5nZXNldC5jcmVhdGUob3V0cHV0KTtcblxuICAgIGlucHV0LmFkZCA9IG91dHB1dC5hZGQ7XG4gICAgaW5wdXQubW9kID0gb3V0cHV0Lm1vZDtcbiAgICBpbnB1dC5yZW0gPSBvdXRwdXQucmVtO1xuICAgIGlucHV0LnN0YW1wID0gbnVsbDtcbiAgICB0aGlzLl9ncmFwaC5wcm9wYWdhdGUoaW5wdXQsIHRoaXMuX2RzLmxpc3RlbmVyKCkpO1xuICB9XG59XG5cbnByb3RvLnBpcGVsaW5lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBbdGhpc107XG59O1xuXG5wcm90by5jb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBidWlsZGVyID0gdGhpcztcblxuICB0aGlzLl9tb2RlbC5ncmFwaC5jb25uZWN0KHRoaXMucGlwZWxpbmUoKSk7XG4gIHRoaXMuX2VuY29kZXIuZGVwZW5kZW5jeShDLlNDQUxFUykuZm9yRWFjaChmdW5jdGlvbihzKSB7XG4gICAgYnVpbGRlci5fcGFyZW50LnNjYWxlKHMpLmFkZExpc3RlbmVyKGJ1aWxkZXIpO1xuICB9KTtcblxuICBpZih0aGlzLl9wYXJlbnQpIHtcbiAgICBpZih0aGlzLl9pc1N1cGVyKSB0aGlzLmFkZExpc3RlbmVyKHRoaXMuX3BhcmVudC5fY29sbGVjdG9yKTtcbiAgICBlbHNlIHRoaXMuX2JvdW5kZXIuYWRkTGlzdGVuZXIodGhpcy5fcGFyZW50Ll9jb2xsZWN0b3IpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5kaXNjb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBidWlsZGVyID0gdGhpcztcbiAgaWYoIXRoaXMuX2xpc3RlbmVycy5sZW5ndGgpIHJldHVybiB0aGlzO1xuXG4gIE5vZGUucHJvdG90eXBlLmRpc2Nvbm5lY3QuY2FsbCh0aGlzKTtcbiAgdGhpcy5fbW9kZWwuZ3JhcGguZGlzY29ubmVjdCh0aGlzLnBpcGVsaW5lKCkpO1xuICB0aGlzLl9lbmNvZGVyLmRlcGVuZGVuY3koQy5TQ0FMRVMpLmZvckVhY2goZnVuY3Rpb24ocykge1xuICAgIGJ1aWxkZXIuX3BhcmVudC5zY2FsZShzKS5yZW1vdmVMaXN0ZW5lcihidWlsZGVyKTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8uc2libGluZyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuIHRoaXMuX3BhcmVudC5jaGlsZChuYW1lLCB0aGlzLl9wYXJlbnRfaWQpO1xufTtcblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wiYnVpbGRpbmdcIiwgdGhpcy5fZnJvbSwgdGhpcy5fZGVmLnR5cGVdKTtcblxuICB2YXIgb3V0cHV0LCBmdWxsVXBkYXRlLCBmY3MsIGRhdGE7XG5cbiAgaWYodGhpcy5fZHMpIHtcbiAgICBvdXRwdXQgPSBjaGFuZ2VzZXQuY3JlYXRlKGlucHV0KTtcblxuICAgIC8vIFdlIG5lZWQgdG8gZGV0ZXJtaW5lIGlmIGFueSBlbmNvZGVyIGRlcGVuZGVuY2llcyBoYXZlIGJlZW4gdXBkYXRlZC5cbiAgICAvLyBIb3dldmVyLCB0aGUgZW5jb2RlcidzIGRhdGEgc291cmNlIHdpbGwgbGlrZWx5IGJlIHVwZGF0ZWQsIGFuZCBzaG91bGRuJ3RcbiAgICAvLyB0cmlnZ2VyIGFsbCBpdGVtcyB0byBtb2QuXG4gICAgZGF0YSA9IGRsLmR1cGxpY2F0ZShvdXRwdXQuZGF0YSk7XG4gICAgZGVsZXRlIG91dHB1dC5kYXRhW3RoaXMuX2RzLm5hbWUoKV07XG4gICAgZnVsbFVwZGF0ZSA9IHRoaXMuX2VuY29kZXIucmVldmFsdWF0ZShvdXRwdXQpO1xuICAgIG91dHB1dC5kYXRhID0gZGF0YTtcblxuICAgIC8vIElmIGEgc2NhbGUgb3Igc2lnbmFsIGluIHRoZSB1cGRhdGUgcHJvcHNldCBoYXMgYmVlbiB1cGRhdGVkLCBcbiAgICAvLyBzZW5kIGZvcndhcmQgYWxsIGl0ZW1zIGZvciByZWVuY29kaW5nIGlmIHdlIGRvIGFuIGVhcmx5IHJldHVybi5cbiAgICBpZihmdWxsVXBkYXRlKSBvdXRwdXQubW9kID0gdGhpcy5fbWFyay5pdGVtcy5zbGljZSgpO1xuXG4gICAgZmNzID0gdGhpcy5fZHMubGFzdCgpO1xuICAgIGlmKCFmY3MpIHtcbiAgICAgIG91dHB1dC5yZWZsb3cgPSB0cnVlXG4gICAgfSBlbHNlIGlmKGZjcy5zdGFtcCA+IHRoaXMuX3N0YW1wKSB7XG4gICAgICBvdXRwdXQgPSBqb2luRGF0YXNvdXJjZS5jYWxsKHRoaXMsIGZjcywgdGhpcy5fZHMudmFsdWVzKCksIGZ1bGxVcGRhdGUpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmdWxsVXBkYXRlID0gdGhpcy5fZW5jb2Rlci5yZWV2YWx1YXRlKGlucHV0KTtcbiAgICBkYXRhID0gZGwuaXNGdW5jdGlvbih0aGlzLl9kZWYuZnJvbSkgPyB0aGlzLl9kZWYuZnJvbSgpIDogW0MuU0VOVElORUxdO1xuICAgIG91dHB1dCA9IGpvaW5WYWx1ZXMuY2FsbCh0aGlzLCBpbnB1dCwgZGF0YSwgZnVsbFVwZGF0ZSk7XG4gIH1cblxuICBvdXRwdXQgPSB0aGlzLl9ncmFwaC5ldmFsdWF0ZShvdXRwdXQsIHRoaXMuX2VuY29kZXIpO1xuICByZXR1cm4gdGhpcy5faXNTdXBlciA/IHRoaXMuX2dyYXBoLmV2YWx1YXRlKG91dHB1dCwgdGhpcy5fYm91bmRlcikgOiBvdXRwdXQ7XG59O1xuXG5mdW5jdGlvbiBuZXdJdGVtKCkge1xuICB2YXIgcHJldiA9IHRoaXMuX3JldmlzZXMgPyBudWxsIDogdW5kZWZpbmVkLFxuICAgICAgaXRlbSA9IHR1cGxlLmluZ2VzdChuZXcgSXRlbSh0aGlzLl9tYXJrKSwgcHJldik7XG5cbiAgLy8gRm9yIHRoZSByb290IG5vZGUncyBpdGVtXG4gIGlmKHRoaXMuX2RlZi53aWR0aCkgIHR1cGxlLnNldChpdGVtLCBcIndpZHRoXCIsICB0aGlzLl9kZWYud2lkdGgpO1xuICBpZih0aGlzLl9kZWYuaGVpZ2h0KSB0dXBsZS5zZXQoaXRlbSwgXCJoZWlnaHRcIiwgdGhpcy5fZGVmLmhlaWdodCk7XG4gIHJldHVybiBpdGVtO1xufTtcblxuZnVuY3Rpb24gam9pbihkYXRhLCBrZXlmLCBuZXh0LCBvdXRwdXQsIHByZXYsIG1vZCkge1xuICB2YXIgaSwga2V5LCBsZW4sIGl0ZW0sIGRhdHVtLCBlbnRlcjtcblxuICBmb3IoaT0wLCBsZW49ZGF0YS5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBkYXR1bSA9IGRhdGFbaV07XG4gICAgaXRlbSAgPSBrZXlmID8gdGhpcy5fbWFwW2tleSA9IGtleWYoZGF0dW0pXSA6IHByZXZbaV07XG4gICAgZW50ZXIgPSBpdGVtID8gZmFsc2UgOiAoaXRlbSA9IG5ld0l0ZW0uY2FsbCh0aGlzKSwgdHJ1ZSk7XG4gICAgaXRlbS5zdGF0dXMgPSBlbnRlciA/IEMuRU5URVIgOiBDLlVQREFURTtcbiAgICBpdGVtLmRhdHVtID0gZGF0dW07XG4gICAgdHVwbGUuc2V0KGl0ZW0sIFwia2V5XCIsIGtleSk7XG4gICAgdGhpcy5fbWFwW2tleV0gPSBpdGVtO1xuICAgIG5leHQucHVzaChpdGVtKTtcbiAgICBpZihlbnRlcikgb3V0cHV0LmFkZC5wdXNoKGl0ZW0pO1xuICAgIGVsc2UgaWYoIW1vZCB8fCAobW9kICYmIG1vZFtkYXR1bS5faWRdKSkgb3V0cHV0Lm1vZC5wdXNoKGl0ZW0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGpvaW5EYXRhc291cmNlKGlucHV0LCBkYXRhLCBmdWxsVXBkYXRlKSB7XG4gIHZhciBvdXRwdXQgPSBjaGFuZ2VzZXQuY3JlYXRlKGlucHV0KSxcbiAgICAgIGtleWYgPSBrZXlGdW5jdGlvbih0aGlzLl9kZWYua2V5IHx8IFwiX2lkXCIpLFxuICAgICAgYWRkID0gaW5wdXQuYWRkLCBcbiAgICAgIG1vZCA9IGlucHV0Lm1vZCwgXG4gICAgICByZW0gPSBpbnB1dC5yZW0sXG4gICAgICBuZXh0ID0gW10sXG4gICAgICBpLCBrZXksIGxlbiwgaXRlbSwgZGF0dW0sIGVudGVyO1xuXG4gIC8vIEJ1aWxkIHJlbXMgZmlyc3QsIGFuZCBwdXQgdGhlbSBhdCB0aGUgaGVhZCBvZiB0aGUgbmV4dCBpdGVtc1xuICAvLyBUaGVuIGJ1aWxkIHRoZSByZXN0IG9mIHRoZSBkYXRhIHZhbHVlcyAod2hpY2ggd29uJ3QgY29udGFpbiByZW0pLlxuICAvLyBUaGlzIHdpbGwgcHJlc2VydmUgdGhlIHNvcnQgb3JkZXIgd2l0aG91dCBuZWVkaW5nIGFueXRoaW5nIGV4dHJhLlxuXG4gIGZvcihpPTAsIGxlbj1yZW0ubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgaXRlbSA9IHRoaXMuX21hcFtrZXkgPSBrZXlmKHJlbVtpXSldO1xuICAgIGl0ZW0uc3RhdHVzID0gQy5FWElUO1xuICAgIG5leHQucHVzaChpdGVtKTtcbiAgICBvdXRwdXQucmVtLnB1c2goaXRlbSk7XG4gICAgdGhpcy5fbWFwW2tleV0gPSBudWxsO1xuICB9XG5cbiAgam9pbi5jYWxsKHRoaXMsIGRhdGEsIGtleWYsIG5leHQsIG91dHB1dCwgbnVsbCwgdHVwbGUuaWRNYXAoZnVsbFVwZGF0ZSA/IGRhdGEgOiBtb2QpKTtcblxuICByZXR1cm4gKHRoaXMuX21hcmsuaXRlbXMgPSBuZXh0LCBvdXRwdXQpO1xufVxuXG5mdW5jdGlvbiBqb2luVmFsdWVzKGlucHV0LCBkYXRhLCBmdWxsVXBkYXRlKSB7XG4gIHZhciBvdXRwdXQgPSBjaGFuZ2VzZXQuY3JlYXRlKGlucHV0KSxcbiAgICAgIGtleWYgPSBrZXlGdW5jdGlvbih0aGlzLl9kZWYua2V5KSxcbiAgICAgIHByZXYgPSB0aGlzLl9tYXJrLml0ZW1zIHx8IFtdLFxuICAgICAgbmV4dCA9IFtdLFxuICAgICAgaSwga2V5LCBsZW4sIGl0ZW0sIGRhdHVtLCBlbnRlcjtcblxuICBmb3IgKGk9MCwgbGVuPXByZXYubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgaXRlbSA9IHByZXZbaV07XG4gICAgaXRlbS5zdGF0dXMgPSBDLkVYSVQ7XG4gICAgaWYgKGtleWYpIHRoaXMuX21hcFtpdGVtLmtleV0gPSBpdGVtO1xuICB9XG4gIFxuICBqb2luLmNhbGwodGhpcywgZGF0YSwga2V5ZiwgbmV4dCwgb3V0cHV0LCBwcmV2LCBmdWxsVXBkYXRlID8gdHVwbGUuaWRNYXAoZGF0YSkgOiBudWxsKTtcblxuICBmb3IgKGk9MCwgbGVuPXByZXYubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgaXRlbSA9IHByZXZbaV07XG4gICAgaWYgKGl0ZW0uc3RhdHVzID09PSBDLkVYSVQpIHtcbiAgICAgIHR1cGxlLnNldChpdGVtLCBcImtleVwiLCBrZXlmID8gaXRlbS5rZXkgOiB0aGlzLl9pdGVtcy5sZW5ndGgpO1xuICAgICAgbmV4dC5zcGxpY2UoMCwgMCwgaXRlbSk7ICAvLyBLZWVwIGl0ZW0gYXJvdW5kIGZvciBcImV4aXRcIiB0cmFuc2l0aW9uLlxuICAgICAgb3V0cHV0LnJlbS5wdXNoKGl0ZW0pO1xuICAgIH1cbiAgfVxuICBcbiAgcmV0dXJuICh0aGlzLl9tYXJrLml0ZW1zID0gbmV4dCwgb3V0cHV0KTtcbn07XG5cbmZ1bmN0aW9uIGtleUZ1bmN0aW9uKGtleSkge1xuICBpZiAoa2V5ID09IG51bGwpIHJldHVybiBudWxsO1xuICB2YXIgZiA9IGRsLmFycmF5KGtleSkubWFwKGRsLmFjY2Vzc29yKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKGQpIHtcbiAgICBmb3IgKHZhciBzPVwiXCIsIGk9MCwgbj1mLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICAgIGlmIChpPjApIHMgKz0gXCJ8XCI7XG4gICAgICBzICs9IFN0cmluZyhmW2ldKGQpKTtcbiAgICB9XG4gICAgcmV0dXJuIHM7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQnVpbGRlcjsiLCJ2YXIgTm9kZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L05vZGUnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKSxcbiAgICBFTVBUWSA9IHt9O1xuXG5mdW5jdGlvbiBFbmNvZGVyKG1vZGVsLCBtYXJrKSB7XG4gIHZhciBwcm9wcyA9IG1hcmsuZGVmLnByb3BlcnRpZXMgfHwge30sXG4gICAgICB1cGRhdGUgPSBwcm9wcy51cGRhdGU7XG5cbiAgTm9kZS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIG1vZGVsLmdyYXBoKVxuXG4gIHRoaXMuX21vZGVsID0gbW9kZWw7XG4gIHRoaXMuX21hcmsgID0gbWFyaztcblxuICBpZih1cGRhdGUpIHtcbiAgICB0aGlzLmRlcGVuZGVuY3koQy5EQVRBLCB1cGRhdGUuZGF0YSk7XG4gICAgdGhpcy5kZXBlbmRlbmN5KEMuU0NBTEVTLCB1cGRhdGUuc2NhbGVzKTtcbiAgICB0aGlzLmRlcGVuZGVuY3koQy5TSUdOQUxTLCB1cGRhdGUuc2lnbmFscyk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn1cblxudmFyIHByb3RvID0gKEVuY29kZXIucHJvdG90eXBlID0gbmV3IE5vZGUoKSk7XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgZGVidWcoaW5wdXQsIFtcImVuY29kaW5nXCIsIHRoaXMuX21hcmsuZGVmLnR5cGVdKTtcbiAgdmFyIGl0ZW1zID0gdGhpcy5fbWFyay5pdGVtcyxcbiAgICAgIHByb3BzID0gdGhpcy5fbWFyay5kZWYucHJvcGVydGllcyB8fCB7fSxcbiAgICAgIGVudGVyICA9IHByb3BzLmVudGVyLFxuICAgICAgdXBkYXRlID0gcHJvcHMudXBkYXRlLFxuICAgICAgZXhpdCAgID0gcHJvcHMuZXhpdCxcbiAgICAgIGksIGxlbiwgaXRlbTtcblxuICAvLyBJdGVtcyBtYXJrZWQgZm9yIHJlbW92YWwgYXJlIGF0IHRoZSBoZWFkIG9mIGl0ZW1zLiBQcm9jZXNzIHRoZW0gZmlyc3QuXG4gIGZvcihpPTAsIGxlbj1pbnB1dC5yZW0ubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgaXRlbSA9IGlucHV0LnJlbVtpXTtcbiAgICBpZih1cGRhdGUpIGVuY29kZS5jYWxsKHRoaXMsIHVwZGF0ZSwgaXRlbSwgaW5wdXQudHJhbnMpO1xuICAgIGlmKGV4aXQpICAgZW5jb2RlLmNhbGwodGhpcywgZXhpdCwgICBpdGVtLCBpbnB1dC50cmFucyk7IFxuICAgIGlmKGlucHV0LnRyYW5zICYmICFleGl0KSBpbnB1dC50cmFucy5pbnRlcnBvbGF0ZShpdGVtLCBFTVBUWSk7XG4gICAgZWxzZSBpZighaW5wdXQudHJhbnMpIGl0ZW0ucmVtb3ZlKCk7XG4gIH1cblxuICBmb3IoaT0wLCBsZW49aW5wdXQuYWRkLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIGl0ZW0gPSBpbnB1dC5hZGRbaV07XG4gICAgaWYoZW50ZXIpICBlbmNvZGUuY2FsbCh0aGlzLCBlbnRlciwgIGl0ZW0sIGlucHV0LnRyYW5zKTtcbiAgICBpZih1cGRhdGUpIGVuY29kZS5jYWxsKHRoaXMsIHVwZGF0ZSwgaXRlbSwgaW5wdXQudHJhbnMpO1xuICAgIGl0ZW0uc3RhdHVzID0gQy5VUERBVEU7XG4gIH1cblxuICBpZih1cGRhdGUpIHtcbiAgICBmb3IoaT0wLCBsZW49aW5wdXQubW9kLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgICAgaXRlbSA9IGlucHV0Lm1vZFtpXTtcbiAgICAgIGVuY29kZS5jYWxsKHRoaXMsIHVwZGF0ZSwgaXRlbSwgaW5wdXQudHJhbnMpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpbnB1dDtcbn07XG5cbmZ1bmN0aW9uIGVuY29kZShwcm9wLCBpdGVtLCB0cmFucywgc3RhbXApIHtcbiAgdmFyIG1vZGVsID0gdGhpcy5fbW9kZWwsXG4gICAgICBlbmMgPSBwcm9wLmVuY29kZSxcbiAgICAgIHNnID0gdGhpcy5fZ3JhcGguc2lnbmFsVmFsdWVzKHByb3Auc2lnbmFsc3x8W10pLFxuICAgICAgZGIgPSAocHJvcC5kYXRhfHxbXSkucmVkdWNlKGZ1bmN0aW9uKGRiLCBkcykgeyBcbiAgICAgICAgcmV0dXJuIGRiW2RzXSA9IG1vZGVsLmRhdGEoZHMpLnZhbHVlcygpLCBkYjtcbiAgICAgIH0sIHt9KTtcblxuICBlbmMuY2FsbChlbmMsIGl0ZW0sIGl0ZW0ubWFyay5ncm91cHx8aXRlbSwgdHJhbnMsIGRiLCBzZywgbW9kZWwucHJlZGljYXRlcygpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFbmNvZGVyOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBOb2RlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvTm9kZScpLFxuICAgIENvbGxlY3RvciA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L0NvbGxlY3RvcicpLFxuICAgIEJ1aWxkZXIgPSByZXF1aXJlKCcuL0J1aWxkZXInKSxcbiAgICBTY2FsZSA9IHJlcXVpcmUoJy4vU2NhbGUnKSxcbiAgICBwYXJzZUF4ZXMgPSByZXF1aXJlKCcuLi9wYXJzZS9heGVzJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIEdyb3VwQnVpbGRlcigpIHtcbiAgdGhpcy5fY2hpbGRyZW4gPSB7fTtcbiAgdGhpcy5fc2NhbGVyID0gbnVsbDtcbiAgdGhpcy5fcmVjdXJzb3IgPSBudWxsO1xuXG4gIHRoaXMuX3NjYWxlcyA9IHt9O1xuICB0aGlzLnNjYWxlID0gc2NhbGUuYmluZCh0aGlzKTtcbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPyB0aGlzLmluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKSA6IHRoaXM7XG59XG5cbnZhciBwcm90byA9IChHcm91cEJ1aWxkZXIucHJvdG90eXBlID0gbmV3IEJ1aWxkZXIoKSk7XG5cbnByb3RvLmluaXQgPSBmdW5jdGlvbihtb2RlbCwgZGVmLCBtYXJrLCBwYXJlbnQsIHBhcmVudF9pZCwgaW5oZXJpdEZyb20pIHtcbiAgdmFyIGJ1aWxkZXIgPSB0aGlzO1xuXG4gIHRoaXMuX3NjYWxlciA9IG5ldyBOb2RlKG1vZGVsLmdyYXBoKTtcblxuICAoZGVmLnNjYWxlc3x8W10pLmZvckVhY2goZnVuY3Rpb24ocykgeyBcbiAgICBzID0gYnVpbGRlci5zY2FsZShzLm5hbWUsIG5ldyBTY2FsZShtb2RlbCwgcywgYnVpbGRlcikpO1xuICAgIGJ1aWxkZXIuX3NjYWxlci5hZGRMaXN0ZW5lcihzKTsgIC8vIFNjYWxlcyBzaG91bGQgYmUgY29tcHV0ZWQgYWZ0ZXIgZ3JvdXAgaXMgZW5jb2RlZFxuICB9KTtcblxuICB0aGlzLl9yZWN1cnNvciA9IG5ldyBOb2RlKG1vZGVsLmdyYXBoKTtcbiAgdGhpcy5fcmVjdXJzb3IuZXZhbHVhdGUgPSByZWN1cnNlLmJpbmQodGhpcyk7XG5cbiAgdmFyIHNjYWxlcyA9IChkZWYuYXhlc3x8W10pLnJlZHVjZShmdW5jdGlvbihhY2MsIHgpIHtcbiAgICByZXR1cm4gKGFjY1t4LnNjYWxlXSA9IDEsIGFjYyk7XG4gIH0sIHt9KTtcbiAgdGhpcy5fcmVjdXJzb3IuZGVwZW5kZW5jeShDLlNDQUxFUywgZGwua2V5cyhzY2FsZXMpKTtcblxuICAvLyBXZSBvbmx5IG5lZWQgYSBjb2xsZWN0b3IgZm9yIHVwLXByb3BhZ2F0aW9uIG9mIGJvdW5kcyBjYWxjdWxhdGlvbixcbiAgLy8gc28gb25seSBHcm91cEJ1aWxkZXJzLCBhbmQgbm90IHJlZ3VsYXIgQnVpbGRlcnMsIGhhdmUgY29sbGVjdG9ycy5cbiAgdGhpcy5fY29sbGVjdG9yID0gbmV3IENvbGxlY3Rvcihtb2RlbC5ncmFwaCk7XG5cbiAgcmV0dXJuIEJ1aWxkZXIucHJvdG90eXBlLmluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIG91dHB1dCA9IEJ1aWxkZXIucHJvdG90eXBlLmV2YWx1YXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyksXG4gICAgICBidWlsZGVyID0gdGhpcztcblxuICBvdXRwdXQuYWRkLmZvckVhY2goZnVuY3Rpb24oZ3JvdXApIHsgYnVpbGRHcm91cC5jYWxsKGJ1aWxkZXIsIG91dHB1dCwgZ3JvdXApOyB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn07XG5cbnByb3RvLnBpcGVsaW5lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBbdGhpcywgdGhpcy5fc2NhbGVyLCB0aGlzLl9yZWN1cnNvciwgdGhpcy5fY29sbGVjdG9yLCB0aGlzLl9ib3VuZGVyXTtcbn07XG5cbnByb3RvLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJ1aWxkZXIgPSB0aGlzO1xuICBkbC5rZXlzKGJ1aWxkZXIuX2NoaWxkcmVuKS5mb3JFYWNoKGZ1bmN0aW9uKGdyb3VwX2lkKSB7XG4gICAgYnVpbGRlci5fY2hpbGRyZW5bZ3JvdXBfaWRdLmZvckVhY2goZnVuY3Rpb24oYykge1xuICAgICAgYnVpbGRlci5fcmVjdXJzb3IucmVtb3ZlTGlzdGVuZXIoYy5idWlsZGVyKTtcbiAgICAgIGMuYnVpbGRlci5kaXNjb25uZWN0KCk7XG4gICAgfSlcbiAgfSk7XG5cbiAgYnVpbGRlci5fY2hpbGRyZW4gPSB7fTtcbiAgcmV0dXJuIEJ1aWxkZXIucHJvdG90eXBlLmRpc2Nvbm5lY3QuY2FsbCh0aGlzKTtcbn07XG5cbnByb3RvLmNoaWxkID0gZnVuY3Rpb24obmFtZSwgZ3JvdXBfaWQpIHtcbiAgdmFyIGNoaWxkcmVuID0gdGhpcy5fY2hpbGRyZW5bZ3JvdXBfaWRdLFxuICAgICAgaSA9IDAsIGxlbiA9IGNoaWxkcmVuLmxlbmd0aCxcbiAgICAgIGNoaWxkO1xuXG4gIGZvcig7IGk8bGVuOyArK2kpIHtcbiAgICBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgIGlmKGNoaWxkLnR5cGUgPT0gQy5NQVJLICYmIGNoaWxkLmJ1aWxkZXIuX2RlZi5uYW1lID09IG5hbWUpIGJyZWFrO1xuICB9XG5cbiAgcmV0dXJuIGNoaWxkLmJ1aWxkZXI7XG59O1xuXG5mdW5jdGlvbiByZWN1cnNlKGlucHV0KSB7XG4gIHZhciBidWlsZGVyID0gdGhpcyxcbiAgICAgIGhhc01hcmtzID0gdGhpcy5fZGVmLm1hcmtzICYmIHRoaXMuX2RlZi5tYXJrcy5sZW5ndGggPiAwLFxuICAgICAgaGFzQXhlcyA9IHRoaXMuX2RlZi5heGVzICYmIHRoaXMuX2RlZi5heGVzLmxlbmd0aCA+IDAsXG4gICAgICBpLCBsZW4sIGdyb3VwLCBwaXBlbGluZSwgZGVmLCBpbmxpbmUgPSBmYWxzZTtcblxuICBmb3IoaT0wLCBsZW49aW5wdXQuYWRkLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIGdyb3VwID0gaW5wdXQuYWRkW2ldO1xuICAgIGlmKGhhc01hcmtzKSBidWlsZE1hcmtzLmNhbGwodGhpcywgaW5wdXQsIGdyb3VwKTtcbiAgICBpZihoYXNBeGVzKSAgYnVpbGRBeGVzLmNhbGwodGhpcywgaW5wdXQsIGdyb3VwKTtcbiAgfVxuXG4gIC8vIFdpcmUgdXAgbmV3IGNoaWxkcmVuIGJ1aWxkZXJzIGluIHJldmVyc2UgdG8gbWluaW1pemUgZ3JhcGggcmV3cml0ZXMuXG4gIGZvciAoaT1pbnB1dC5hZGQubGVuZ3RoLTE7IGk+PTA7IC0taSkge1xuICAgIGdyb3VwID0gaW5wdXQuYWRkW2ldO1xuICAgIGZvciAoaj10aGlzLl9jaGlsZHJlbltncm91cC5faWRdLmxlbmd0aC0xOyBqPj0wOyAtLWopIHtcbiAgICAgIGMgPSB0aGlzLl9jaGlsZHJlbltncm91cC5faWRdW2pdO1xuICAgICAgYy5idWlsZGVyLmNvbm5lY3QoKTtcbiAgICAgIHBpcGVsaW5lID0gYy5idWlsZGVyLnBpcGVsaW5lKCk7XG4gICAgICBkZWYgPSBjLmJ1aWxkZXIuX2RlZjtcblxuICAgICAgLy8gVGhpcyBuZXcgY2hpbGQgbmVlZHMgdG8gYmUgYnVpbHQgZHVyaW5nIHRoaXMgcHJvcGFnYXRpb24gY3ljbGUuXG4gICAgICAvLyBXZSBjb3VsZCBhZGQgaXRzIGJ1aWxkZXIgYXMgYSBsaXN0ZW5lciBvZmYgdGhlIF9yZWN1cnNvciBub2RlLCBcbiAgICAgIC8vIGJ1dCB0cnkgdG8gaW5saW5lIGl0IGlmIHdlIGNhbiB0byBtaW5pbWl6ZSBncmFwaCBkaXNwYXRjaGVzLlxuICAgICAgaW5saW5lID0gKGRlZi50eXBlICE9PSBDLkdST1VQKTtcbiAgICAgIGlubGluZSA9IGlubGluZSAmJiAodGhpcy5fbW9kZWwuZGF0YShjLmZyb20pICE9PSB1bmRlZmluZWQpOyBcbiAgICAgIGlubGluZSA9IGlubGluZSAmJiAocGlwZWxpbmVbcGlwZWxpbmUubGVuZ3RoLTFdLmxpc3RlbmVycygpLmxlbmd0aCA9PSAxKTsgLy8gUmVhY3RpdmUgZ2VvbVxuICAgICAgYy5pbmxpbmUgPSBpbmxpbmU7XG5cbiAgICAgIGlmKGlubGluZSkgYy5idWlsZGVyLmV2YWx1YXRlKGlucHV0KTtcbiAgICAgIGVsc2UgdGhpcy5fcmVjdXJzb3IuYWRkTGlzdGVuZXIoYy5idWlsZGVyKTtcbiAgICB9XG4gIH1cblxuICBmb3IoaT0wLCBsZW49aW5wdXQubW9kLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIGdyb3VwID0gaW5wdXQubW9kW2ldO1xuICAgIC8vIFJlbW92ZSB0ZW1wb3JhcnkgY29ubmVjdGlvbiBmb3IgbWFya3MgdGhhdCBkcmF3IGZyb20gYSBzb3VyY2VcbiAgICBpZihoYXNNYXJrcykge1xuICAgICAgYnVpbGRlci5fY2hpbGRyZW5bZ3JvdXAuX2lkXS5mb3JFYWNoKGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgaWYoYy50eXBlID09IEMuTUFSSyAmJiAhYy5pbmxpbmUgJiYgYnVpbGRlci5fbW9kZWwuZGF0YShjLmZyb20pICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgYnVpbGRlci5fcmVjdXJzb3IucmVtb3ZlTGlzdGVuZXIoYy5idWlsZGVyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIGF4ZXMgZGF0YSBkZWZzXG4gICAgaWYoaGFzQXhlcykge1xuICAgICAgcGFyc2VBeGVzKGJ1aWxkZXIuX21vZGVsLCBidWlsZGVyLl9kZWYuYXhlcywgZ3JvdXAuYXhlcywgZ3JvdXApO1xuICAgICAgZ3JvdXAuYXhlcy5mb3JFYWNoKGZ1bmN0aW9uKGEsIGkpIHsgYS5kZWYoKSB9KTtcbiAgICB9ICAgICAgXG4gIH1cblxuICBmb3IoaT0wLCBsZW49aW5wdXQucmVtLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIGdyb3VwID0gaW5wdXQucmVtW2ldO1xuICAgIC8vIEZvciBkZWxldGVkIGdyb3VwcywgZGlzY29ubmVjdCB0aGVpciBjaGlsZHJlblxuICAgIGJ1aWxkZXIuX2NoaWxkcmVuW2dyb3VwLl9pZF0uZm9yRWFjaChmdW5jdGlvbihjKSB7IFxuICAgICAgYnVpbGRlci5fcmVjdXJzb3IucmVtb3ZlTGlzdGVuZXIoYy5idWlsZGVyKTtcbiAgICAgIGMuYnVpbGRlci5kaXNjb25uZWN0KCk7IFxuICAgIH0pO1xuICAgIGRlbGV0ZSBidWlsZGVyLl9jaGlsZHJlbltncm91cC5faWRdO1xuICB9XG5cbiAgcmV0dXJuIGlucHV0O1xufTtcblxuZnVuY3Rpb24gc2NhbGUobmFtZSwgc2NhbGUpIHtcbiAgdmFyIGdyb3VwID0gdGhpcztcbiAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikgcmV0dXJuIChncm91cC5fc2NhbGVzW25hbWVdID0gc2NhbGUsIHNjYWxlKTtcbiAgd2hpbGUoc2NhbGUgPT0gbnVsbCkge1xuICAgIHNjYWxlID0gZ3JvdXAuX3NjYWxlc1tuYW1lXTtcbiAgICBncm91cCA9IGdyb3VwLm1hcmsgPyBncm91cC5tYXJrLmdyb3VwIDogZ3JvdXAuX3BhcmVudDtcbiAgICBpZighZ3JvdXApIGJyZWFrO1xuICB9XG4gIHJldHVybiBzY2FsZTtcbn1cblxuZnVuY3Rpb24gYnVpbGRHcm91cChpbnB1dCwgZ3JvdXApIHtcbiAgZGVidWcoaW5wdXQsIFtcImJ1aWxkaW5nIGdyb3VwXCIsIGdyb3VwLl9pZF0pO1xuXG4gIGdyb3VwLl9zY2FsZXMgPSBncm91cC5fc2NhbGVzIHx8IHt9OyAgICBcbiAgZ3JvdXAuc2NhbGUgID0gc2NhbGUuYmluZChncm91cCk7XG5cbiAgZ3JvdXAuaXRlbXMgPSBncm91cC5pdGVtcyB8fCBbXTtcbiAgdGhpcy5fY2hpbGRyZW5bZ3JvdXAuX2lkXSA9IHRoaXMuX2NoaWxkcmVuW2dyb3VwLl9pZF0gfHwgW107XG5cbiAgZ3JvdXAuYXhlcyA9IGdyb3VwLmF4ZXMgfHwgW107XG4gIGdyb3VwLmF4aXNJdGVtcyA9IGdyb3VwLmF4aXNJdGVtcyB8fCBbXTtcbn1cblxuZnVuY3Rpb24gYnVpbGRNYXJrcyhpbnB1dCwgZ3JvdXApIHtcbiAgZGVidWcoaW5wdXQsIFtcImJ1aWxkaW5nIG1hcmtzXCIsIGdyb3VwLl9pZF0pO1xuICB2YXIgbWFya3MgPSB0aGlzLl9kZWYubWFya3MsXG4gICAgICBsaXN0ZW5lcnMgPSBbXSxcbiAgICAgIG1hcmssIGZyb20sIGluaGVyaXQsIGksIGxlbiwgbSwgYjtcblxuICBmb3IoaT0wLCBsZW49bWFya3MubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgbWFyayA9IG1hcmtzW2ldO1xuICAgIGZyb20gPSBtYXJrLmZyb20gfHwge307XG4gICAgaW5oZXJpdCA9IFwidmdfXCIrZ3JvdXAuZGF0dW0uX2lkO1xuICAgIGdyb3VwLml0ZW1zW2ldID0ge2dyb3VwOiBncm91cH07XG4gICAgYiA9IChtYXJrLnR5cGUgPT09IEMuR1JPVVApID8gbmV3IEdyb3VwQnVpbGRlcigpIDogbmV3IEJ1aWxkZXIoKTtcbiAgICBiLmluaXQodGhpcy5fbW9kZWwsIG1hcmssIGdyb3VwLml0ZW1zW2ldLCB0aGlzLCBncm91cC5faWQsIGluaGVyaXQpO1xuICAgIHRoaXMuX2NoaWxkcmVuW2dyb3VwLl9pZF0ucHVzaCh7IFxuICAgICAgYnVpbGRlcjogYiwgXG4gICAgICBmcm9tOiBmcm9tLmRhdGEgfHwgKGZyb20ubWFyayA/IChcInZnX1wiICsgZ3JvdXAuX2lkICsgXCJfXCIgKyBmcm9tLm1hcmspIDogaW5oZXJpdCksIFxuICAgICAgdHlwZTogQy5NQVJLIFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkQXhlcyhpbnB1dCwgZ3JvdXApIHtcbiAgdmFyIGF4ZXMgPSBncm91cC5heGVzLFxuICAgICAgYXhpc0l0ZW1zID0gZ3JvdXAuYXhpc0l0ZW1zLFxuICAgICAgYnVpbGRlciA9IHRoaXM7XG5cbiAgcGFyc2VBeGVzKHRoaXMuX21vZGVsLCB0aGlzLl9kZWYuYXhlcywgYXhlcywgZ3JvdXApO1xuICBheGVzLmZvckVhY2goZnVuY3Rpb24oYSwgaSkge1xuICAgIHZhciBzY2FsZSA9IGJ1aWxkZXIuX2RlZi5heGVzW2ldLnNjYWxlLFxuICAgICAgICBkZWYgPSBhLmRlZigpLFxuICAgICAgICBiID0gbnVsbDtcblxuICAgIGF4aXNJdGVtc1tpXSA9IHtncm91cDogZ3JvdXAsIGF4aXNEZWY6IGRlZn07XG4gICAgYiA9IChkZWYudHlwZSA9PT0gQy5HUk9VUCkgPyBuZXcgR3JvdXBCdWlsZGVyKCkgOiBuZXcgQnVpbGRlcigpO1xuICAgIGIuaW5pdChidWlsZGVyLl9tb2RlbCwgZGVmLCBheGlzSXRlbXNbaV0sIGJ1aWxkZXIpXG4gICAgICAuZGVwZW5kZW5jeShDLlNDQUxFUywgc2NhbGUpO1xuICAgIGJ1aWxkZXIuX2NoaWxkcmVuW2dyb3VwLl9pZF0ucHVzaCh7IGJ1aWxkZXI6IGIsIHR5cGU6IEMuQVhJUywgc2NhbGU6IHNjYWxlIH0pO1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcm91cEJ1aWxkZXI7IiwiZnVuY3Rpb24gSXRlbShtYXJrKSB7XG4gIHRoaXMubWFyayA9IG1hcms7XG59XG5cbnZhciBwcm90b3R5cGUgPSBJdGVtLnByb3RvdHlwZTtcblxucHJvdG90eXBlLmhhc1Byb3BlcnR5U2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIgcHJvcHMgPSB0aGlzLm1hcmsuZGVmLnByb3BlcnRpZXM7XG4gIHJldHVybiBwcm9wcyAmJiBwcm9wc1tuYW1lXSAhPSBudWxsO1xufTtcblxucHJvdG90eXBlLmNvdXNpbiA9IGZ1bmN0aW9uKG9mZnNldCwgaW5kZXgpIHtcbiAgaWYgKG9mZnNldCA9PT0gMCkgcmV0dXJuIHRoaXM7XG4gIG9mZnNldCA9IG9mZnNldCB8fCAtMTtcbiAgdmFyIG1hcmsgPSB0aGlzLm1hcmssXG4gICAgICBncm91cCA9IG1hcmsuZ3JvdXAsXG4gICAgICBpaWR4ID0gaW5kZXg9PW51bGwgPyBtYXJrLml0ZW1zLmluZGV4T2YodGhpcykgOiBpbmRleCxcbiAgICAgIG1pZHggPSBncm91cC5pdGVtcy5pbmRleE9mKG1hcmspICsgb2Zmc2V0O1xuICByZXR1cm4gZ3JvdXAuaXRlbXNbbWlkeF0uaXRlbXNbaWlkeF07XG59O1xuXG5wcm90b3R5cGUuc2libGluZyA9IGZ1bmN0aW9uKG9mZnNldCkge1xuICBpZiAob2Zmc2V0ID09PSAwKSByZXR1cm4gdGhpcztcbiAgb2Zmc2V0ID0gb2Zmc2V0IHx8IC0xO1xuICB2YXIgbWFyayA9IHRoaXMubWFyayxcbiAgICAgIGlpZHggPSBtYXJrLml0ZW1zLmluZGV4T2YodGhpcykgKyBvZmZzZXQ7XG4gIHJldHVybiBtYXJrLml0ZW1zW2lpZHhdO1xufTtcblxucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaXRlbSA9IHRoaXMsXG4gICAgICBsaXN0ID0gaXRlbS5tYXJrLml0ZW1zLFxuICAgICAgaSA9IGxpc3QuaW5kZXhPZihpdGVtKTtcbiAgaWYgKGkgPj0gMCkgKGk9PT1saXN0Lmxlbmd0aC0xKSA/IGxpc3QucG9wKCkgOiBsaXN0LnNwbGljZShpLCAxKTtcbiAgcmV0dXJuIGl0ZW07XG59O1xuXG5wcm90b3R5cGUudG91Y2ggPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMucGF0aENhY2hlKSB0aGlzLnBhdGhDYWNoZSA9IG51bGw7XG4gIGlmICh0aGlzLm1hcmsucGF0aENhY2hlKSB0aGlzLm1hcmsucGF0aENhY2hlID0gbnVsbDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSXRlbTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgICBOb2RlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvTm9kZScpLFxuICAgIEFnZ3JlZ2F0ZSA9IHJlcXVpcmUoJy4uL3RyYW5zZm9ybXMvQWdncmVnYXRlJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0JyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgY29uZmlnID0gcmVxdWlyZSgnLi4vdXRpbC9jb25maWcnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxudmFyIEdST1VQX1BST1BFUlRZID0ge3dpZHRoOiAxLCBoZWlnaHQ6IDF9O1xuXG5mdW5jdGlvbiBTY2FsZShtb2RlbCwgZGVmLCBwYXJlbnQpIHtcbiAgdGhpcy5fbW9kZWwgICA9IG1vZGVsO1xuICB0aGlzLl9kZWYgICAgID0gZGVmO1xuICB0aGlzLl9wYXJlbnQgID0gcGFyZW50O1xuICB0aGlzLl91cGRhdGVkID0gZmFsc2U7XG4gIHJldHVybiBOb2RlLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgbW9kZWwuZ3JhcGgpO1xufVxuXG52YXIgcHJvdG8gPSAoU2NhbGUucHJvdG90eXBlID0gbmV3IE5vZGUoKSk7XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgZm4gPSBmdW5jdGlvbihncm91cCkgeyBzY2FsZS5jYWxsKHNlbGYsIGdyb3VwKTsgfTtcblxuICB0aGlzLl91cGRhdGVkID0gZmFsc2U7XG4gIGlucHV0LmFkZC5mb3JFYWNoKGZuKTtcbiAgaW5wdXQubW9kLmZvckVhY2goZm4pO1xuXG4gIC8vIFNjYWxlcyBhcmUgYXQgdGhlIGVuZCBvZiBhbiBlbmNvZGluZyBwaXBlbGluZSwgc28gdGhleSBzaG91bGQgZm9yd2FyZCBhXG4gIC8vIHJlZmxvdyBwdWxzZS4gVGh1cywgaWYgbXVsdGlwbGUgc2NhbGVzIHVwZGF0ZSBpbiB0aGUgcGFyZW50IGdyb3VwLCB3ZSBkb24ndFxuICAvLyByZWV2YWx1YXRlIGNoaWxkIG1hcmtzIG11bHRpcGxlIHRpbWVzLiBcbiAgaWYgKHRoaXMuX3VwZGF0ZWQpIGlucHV0LnNjYWxlc1t0aGlzLl9kZWYubmFtZV0gPSAxO1xuICByZXR1cm4gY2hhbmdlc2V0LmNyZWF0ZShpbnB1dCwgdHJ1ZSk7XG59O1xuXG4vLyBBbGwgb2YgYSBzY2FsZSdzIGRlcGVuZGVuY2llcyBhcmUgcmVnaXN0ZXJlZCBkdXJpbmcgcHJvcGFnYXRpb24gYXMgd2UgcGFyc2Vcbi8vIGRhdGFSZWZzLiBTbyBhIHNjYWxlIG11c3QgYmUgcmVzcG9uc2libGUgZm9yIGNvbm5lY3RpbmcgaXRzZWxmIHRvIGRlcGVuZGVudHMuXG5wcm90by5kZXBlbmRlbmN5ID0gZnVuY3Rpb24odHlwZSwgZGVwcykge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAyKSB7XG4gICAgZGVwcyA9IGRsLmFycmF5KGRlcHMpO1xuICAgIGZvcih2YXIgaT0wLCBsZW49ZGVwcy5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICAgIHRoaXMuX2dyYXBoW3R5cGUgPT0gQy5EQVRBID8gQy5EQVRBIDogQy5TSUdOQUxdKGRlcHNbaV0pXG4gICAgICAgIC5hZGRMaXN0ZW5lcih0aGlzLl9wYXJlbnQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBOb2RlLnByb3RvdHlwZS5kZXBlbmRlbmN5LmNhbGwodGhpcywgdHlwZSwgZGVwcyk7XG59O1xuXG5mdW5jdGlvbiBzY2FsZShncm91cCkge1xuICB2YXIgbmFtZSA9IHRoaXMuX2RlZi5uYW1lLFxuICAgICAgcHJldiA9IG5hbWUgKyBcIjpwcmV2XCIsXG4gICAgICBzID0gaW5zdGFuY2UuY2FsbCh0aGlzLCBncm91cC5zY2FsZShuYW1lKSksXG4gICAgICBtID0gcy50eXBlPT09Qy5PUkRJTkFMID8gb3JkaW5hbCA6IHF1YW50aXRhdGl2ZSxcbiAgICAgIHJuZyA9IHJhbmdlLmNhbGwodGhpcywgZ3JvdXApO1xuXG4gIG0uY2FsbCh0aGlzLCBzLCBybmcsIGdyb3VwKTtcblxuICBncm91cC5zY2FsZShuYW1lLCBzKTtcbiAgZ3JvdXAuc2NhbGUocHJldiwgZ3JvdXAuc2NhbGUocHJldikgfHwgcyk7XG5cbiAgcmV0dXJuIHM7XG59XG5cbmZ1bmN0aW9uIGluc3RhbmNlKHNjYWxlKSB7XG4gIHZhciB0eXBlID0gdGhpcy5fZGVmLnR5cGUgfHwgQy5MSU5FQVI7XG4gIGlmICghc2NhbGUgfHwgdHlwZSAhPT0gc2NhbGUudHlwZSkge1xuICAgIHZhciBjdG9yID0gY29uZmlnLnNjYWxlW3R5cGVdIHx8IGQzLnNjYWxlW3R5cGVdO1xuICAgIGlmICghY3RvcikgZGwuZXJyb3IoXCJVbnJlY29nbml6ZWQgc2NhbGUgdHlwZTogXCIgKyB0eXBlKTtcbiAgICAoc2NhbGUgPSBjdG9yKCkpLnR5cGUgPSBzY2FsZS50eXBlIHx8IHR5cGU7XG4gICAgc2NhbGUuc2NhbGVOYW1lID0gdGhpcy5fZGVmLm5hbWU7XG4gICAgc2NhbGUuX3ByZXYgPSB7fTtcbiAgfVxuICByZXR1cm4gc2NhbGU7XG59XG5cbmZ1bmN0aW9uIG9yZGluYWwoc2NhbGUsIHJuZywgZ3JvdXApIHtcbiAgdmFyIGRlZiA9IHRoaXMuX2RlZixcbiAgICAgIHByZXYgPSBzY2FsZS5fcHJldixcbiAgICAgIGRvbWFpbiwgc29ydCwgc3RyLCByZWZzLCBkYXRhRHJpdmVuUmFuZ2UgPSBmYWxzZTtcbiAgXG4gIC8vIHJhbmdlIHByZS1wcm9jZXNzaW5nIGZvciBkYXRhLWRyaXZlbiByYW5nZXNcbiAgaWYgKGRsLmlzT2JqZWN0KGRlZi5yYW5nZSkgJiYgIWRsLmlzQXJyYXkoZGVmLnJhbmdlKSkge1xuICAgIGRhdGFEcml2ZW5SYW5nZSA9IHRydWU7XG4gICAgcm5nID0gZGF0YVJlZi5jYWxsKHRoaXMsIEMuUkFOR0UsIGRlZi5yYW5nZSwgc2NhbGUsIGdyb3VwKTtcbiAgfVxuICBcbiAgLy8gZG9tYWluXG4gIGRvbWFpbiA9IGRhdGFSZWYuY2FsbCh0aGlzLCBDLkRPTUFJTiwgZGVmLmRvbWFpbiwgc2NhbGUsIGdyb3VwKTtcbiAgaWYgKGRvbWFpbiAmJiAhZGwuZXF1YWwocHJldi5kb21haW4sIGRvbWFpbikpIHtcbiAgICBzY2FsZS5kb21haW4oZG9tYWluKTtcbiAgICBwcmV2LmRvbWFpbiA9IGRvbWFpbjtcbiAgICB0aGlzLl91cGRhdGVkID0gdHJ1ZTtcbiAgfSBcblxuICAvLyByYW5nZVxuICBpZiAoZGwuZXF1YWwocHJldi5yYW5nZSwgcm5nKSkgcmV0dXJuO1xuXG4gIHN0ciA9IHR5cGVvZiBybmdbMF0gPT09ICdzdHJpbmcnO1xuICBpZiAoc3RyIHx8IHJuZy5sZW5ndGggPiAyIHx8IHJuZy5sZW5ndGg9PT0xIHx8IGRhdGFEcml2ZW5SYW5nZSkge1xuICAgIHNjYWxlLnJhbmdlKHJuZyk7IC8vIGNvbG9yIG9yIHNoYXBlIHZhbHVlc1xuICB9IGVsc2UgaWYgKGRlZi5wb2ludHMpIHtcbiAgICBzY2FsZS5yYW5nZVBvaW50cyhybmcsIGRlZi5wYWRkaW5nfHwwKTtcbiAgfSBlbHNlIGlmIChkZWYucm91bmQgfHwgZGVmLnJvdW5kPT09dW5kZWZpbmVkKSB7XG4gICAgc2NhbGUucmFuZ2VSb3VuZEJhbmRzKHJuZywgZGVmLnBhZGRpbmd8fDApO1xuICB9IGVsc2Uge1xuICAgIHNjYWxlLnJhbmdlQmFuZHMocm5nLCBkZWYucGFkZGluZ3x8MCk7XG4gIH1cblxuICBwcmV2LnJhbmdlID0gcm5nO1xuICB0aGlzLl91cGRhdGVkID0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gcXVhbnRpdGF0aXZlKHNjYWxlLCBybmcsIGdyb3VwKSB7XG4gIHZhciBkZWYgPSB0aGlzLl9kZWYsXG4gICAgICBwcmV2ID0gc2NhbGUuX3ByZXYsXG4gICAgICBkb21haW4sIGludGVydmFsO1xuXG4gIC8vIGRvbWFpblxuICBkb21haW4gPSAoZGVmLnR5cGUgPT09IEMuUVVBTlRJTEUpXG4gICAgPyBkYXRhUmVmLmNhbGwodGhpcywgQy5ET01BSU4sIGRlZi5kb21haW4sIHNjYWxlLCBncm91cClcbiAgICA6IGRvbWFpbk1pbk1heC5jYWxsKHRoaXMsIHNjYWxlLCBncm91cCk7XG4gIGlmIChkb21haW4gJiYgIWRsLmVxdWFsKHByZXYuZG9tYWluLCBkb21haW4pKSB7XG4gICAgc2NhbGUuZG9tYWluKGRvbWFpbik7XG4gICAgcHJldi5kb21haW4gPSBkb21haW47XG4gICAgdGhpcy5fdXBkYXRlZCA9IHRydWU7XG4gIH0gXG5cbiAgLy8gcmFuZ2VcbiAgLy8gdmVydGljYWwgc2NhbGVzIHNob3VsZCBmbGlwIGJ5IGRlZmF1bHQsIHNvIHVzZSBYT1IgaGVyZVxuICBpZiAoZGVmLnJhbmdlID09PSBcImhlaWdodFwiKSBybmcgPSBybmcucmV2ZXJzZSgpO1xuICBpZiAoZGwuZXF1YWwocHJldi5yYW5nZSwgcm5nKSkgcmV0dXJuO1xuICBzY2FsZVtkZWYucm91bmQgJiYgc2NhbGUucmFuZ2VSb3VuZCA/IFwicmFuZ2VSb3VuZFwiIDogXCJyYW5nZVwiXShybmcpO1xuICBwcmV2LnJhbmdlID0gcm5nO1xuICB0aGlzLl91cGRhdGVkID0gdHJ1ZTtcblxuICAvLyBUT0RPOiBTdXBwb3J0IHNpZ25hbHMgZm9yIHRoZXNlIHByb3BlcnRpZXMuIFVudGlsIHRoZW4sIG9ubHkgZXZhbFxuICAvLyB0aGVtIG9uY2UuXG4gIGlmICh0aGlzLl9zdGFtcCA+IDApIHJldHVybjtcbiAgaWYgKGRlZi5leHBvbmVudCAmJiBkZWYudHlwZT09PUMuUE9XRVIpIHNjYWxlLmV4cG9uZW50KGRlZi5leHBvbmVudCk7XG4gIGlmIChkZWYuY2xhbXApIHNjYWxlLmNsYW1wKHRydWUpO1xuICBpZiAoZGVmLm5pY2UpIHtcbiAgICBpZiAoZGVmLnR5cGUgPT09IEMuVElNRSkge1xuICAgICAgaW50ZXJ2YWwgPSBkMy50aW1lW2RlZi5uaWNlXTtcbiAgICAgIGlmICghaW50ZXJ2YWwpIGRsLmVycm9yKFwiVW5yZWNvZ25pemVkIGludGVydmFsOiBcIiArIGludGVydmFsKTtcbiAgICAgIHNjYWxlLm5pY2UoaW50ZXJ2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzY2FsZS5uaWNlKCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRhdGFSZWYod2hpY2gsIGRlZiwgc2NhbGUsIGdyb3VwKSB7XG4gIGlmIChkZWYgPT0gbnVsbCkgeyByZXR1cm4gW107IH0gLy8gSkgtVE9ETzogY29uZmlybSB3aXRoIEFydmluZFxuICBpZiAoZGwuaXNBcnJheShkZWYpKSByZXR1cm4gZGVmLm1hcChzaWduYWwuYmluZCh0aGlzKSk7XG5cbiAgdmFyIHNlbGYgPSB0aGlzLCBncmFwaCA9IHRoaXMuX2dyYXBoLFxuICAgICAgcmVmcyA9IGRlZi5maWVsZHMgfHwgZGwuYXJyYXkoZGVmKSxcbiAgICAgIHVuaXF1ZXMgPSBzY2FsZS50eXBlID09PSBDLk9SRElOQUwgfHwgc2NhbGUudHlwZSA9PT0gQy5RVUFOVElMRSxcbiAgICAgIGNrID0gXCJfXCIrd2hpY2gsXG4gICAgICBjYWNoZSA9IHNjYWxlW2NrXSxcbiAgICAgIGNhY2hlRmllbGQgPSB7b3BzOiBbXX0sICAvLyB0aGUgZmllbGQgYW5kIG1lYXN1cmVzIGluIHRoZSBhZ2dyZWdhdG9yXG4gICAgICBzb3J0ID0gZGVmLnNvcnQsXG4gICAgICBpLCBybGVuLCBqLCBmbGVuLCByLCBmaWVsZHMsIGZyb20sIGRhdGEsIGtleXM7XG5cbiAgaWYgKCFjYWNoZSkge1xuICAgIGNhY2hlID0gc2NhbGVbY2tdID0gbmV3IEFnZ3JlZ2F0ZShncmFwaCk7XG4gICAgY2FjaGVGaWVsZC5vcHMgPSBbXTtcbiAgICBjYWNoZS5zaW5nbGV0b24odHJ1ZSk7XG4gICAgaWYgKHVuaXF1ZXMgJiYgc29ydCkgY2FjaGVGaWVsZC5vcHMucHVzaChzb3J0LnN0YXQpO1xuICB9XG5cbiAgZm9yKGk9MCwgcmxlbj1yZWZzLmxlbmd0aDsgaTxybGVuOyArK2kpIHtcbiAgICByID0gcmVmc1tpXTtcbiAgICBmcm9tID0gci5kYXRhIHx8IFwidmdfXCIrZ3JvdXAuZGF0dW0uX2lkO1xuICAgIGRhdGEgPSBncmFwaC5kYXRhKGZyb20pXG4gICAgICAucmV2aXNlcyh0cnVlKVxuICAgICAgLmxhc3QoKTtcblxuICAgIGlmIChkYXRhLnN0YW1wIDw9IHRoaXMuX3N0YW1wKSBjb250aW51ZTtcblxuICAgIGZpZWxkcyA9IGRsLmFycmF5KHIuZmllbGQpLm1hcChmdW5jdGlvbihmKSB7XG4gICAgICBpZiAoZi5ncm91cCkgcmV0dXJuIGRsLmFjY2Vzc29yKGYuZ3JvdXApKGdyb3VwLmRhdHVtKVxuICAgICAgcmV0dXJuIGY7IC8vIFN0cmluZyBvciB7XCJzaWduYWxcIn1cbiAgICB9KTtcblxuICAgIGlmICh1bmlxdWVzKSB7XG4gICAgICBjYWNoZUZpZWxkLm5hbWUgPSBzb3J0ID8gc29ydC5maWVsZCA6IFwiX2lkXCI7XG4gICAgICBjYWNoZS5maWVsZHMuc2V0KGNhY2hlLCBbY2FjaGVGaWVsZF0pO1xuICAgICAgZm9yIChqPTAsIGZsZW49ZmllbGRzLmxlbmd0aDsgajxmbGVuOyArK2opIHtcbiAgICAgICAgY2FjaGUuZ3JvdXBfYnkuc2V0KGNhY2hlLCBmaWVsZHNbal0pXG4gICAgICAgICAgLmV2YWx1YXRlKGRhdGEpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGo9MCwgZmxlbj1maWVsZHMubGVuZ3RoOyBqPGZsZW47ICsraikge1xuICAgICAgICBjYWNoZUZpZWxkLm5hbWUgPSBmaWVsZHNbal07XG4gICAgICAgIGNhY2hlRmllbGQub3BzICA9IFtDLk1JTiwgQy5NQVhdO1xuICAgICAgICBjYWNoZS5maWVsZHMuc2V0KGNhY2hlLCBbY2FjaGVGaWVsZF0pIC8vIFRyZWF0IGFzIGZsYXQgZGF0YXNvdXJjZVxuICAgICAgICAgIC5ldmFsdWF0ZShkYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmRlcGVuZGVuY3koQy5EQVRBLCBmcm9tKTtcbiAgICBjYWNoZS5kZXBlbmRlbmN5KEMuU0lHTkFMUykuZm9yRWFjaChmdW5jdGlvbihzKSB7IHNlbGYuZGVwZW5kZW5jeShDLlNJR05BTFMsIHMpIH0pO1xuICB9XG5cbiAgZGF0YSA9IGNhY2hlLmRhdGEoKTtcbiAgaWYgKHVuaXF1ZXMpIHtcbiAgICBrZXlzID0gZGwua2V5cyhkYXRhKVxuICAgICAgLmZpbHRlcihmdW5jdGlvbihrKSB7IHJldHVybiBkYXRhW2tdICE9IG51bGw7IH0pO1xuXG4gICAgaWYgKHNvcnQpIHtcbiAgICAgIHNvcnQgPSBzb3J0Lm9yZGVyLnNpZ25hbCA/IGdyYXBoLnNpZ25hbFJlZihzb3J0Lm9yZGVyLnNpZ25hbCkgOiBzb3J0Lm9yZGVyO1xuICAgICAgc29ydCA9IChzb3J0ID09IEMuREVTQyA/IFwiLVwiIDogXCIrXCIpICsgXCJ0cGwuXCIgKyBjYWNoZUZpZWxkLm5hbWU7XG4gICAgICBzb3J0ID0gZGwuY29tcGFyYXRvcihzb3J0KTtcbiAgICAgIGtleXMgPSBrZXlzLm1hcChmdW5jdGlvbihrKSB7IHJldHVybiB7IGtleTogaywgdHBsOiBkYXRhW2tdLnRwbCB9fSlcbiAgICAgICAgLnNvcnQoc29ydClcbiAgICAgICAgLm1hcChmdW5jdGlvbihrKSB7IHJldHVybiBrLmtleTsgfSk7XG4gICAgLy8gfSBlbHNlIHsgIC8vIFwiRmlyc3Qgc2VlblwiIG9yZGVyXG4gICAgLy8gICBzb3J0ID0gZGwuY29tcGFyYXRvcihcInRwbC5faWRcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGtleXM7XG4gIH0gZWxzZSB7XG4gICAgZGF0YSA9IGRhdGFbXCJcIl07IC8vIFVucGFjayBmbGF0IGFnZ3JlZ2F0aW9uXG4gICAgcmV0dXJuIChkYXRhID09PSBudWxsKSA/IFtdIDogW2RhdGFbQy5TSU5HTEVUT05dLm1pbiwgZGF0YVtDLlNJTkdMRVRPTl0ubWF4XTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaWduYWwodikge1xuICB2YXIgcyA9IHYuc2lnbmFsLCByZWY7XG4gIGlmICghcykgcmV0dXJuIHY7XG4gIHRoaXMuZGVwZW5kZW5jeShDLlNJR05BTFMsIChyZWYgPSBkbC5maWVsZChzKSlbMF0pO1xuICByZXR1cm4gdGhpcy5fZ3JhcGguc2lnbmFsUmVmKHJlZik7XG59XG5cbmZ1bmN0aW9uIGRvbWFpbk1pbk1heChzY2FsZSwgZ3JvdXApIHtcbiAgdmFyIGRlZiA9IHRoaXMuX2RlZixcbiAgICAgIGRvbWFpbiA9IFtudWxsLCBudWxsXSwgcmVmcywgejtcblxuICBpZiAoZGVmLmRvbWFpbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZG9tYWluID0gKCFkbC5pc09iamVjdChkZWYuZG9tYWluKSkgPyBkb21haW4gOlxuICAgICAgZGF0YVJlZi5jYWxsKHRoaXMsIEMuRE9NQUlOLCBkZWYuZG9tYWluLCBzY2FsZSwgZ3JvdXApO1xuICB9XG5cbiAgeiA9IGRvbWFpbi5sZW5ndGggLSAxO1xuICBpZiAoZGVmLmRvbWFpbk1pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGRsLmlzT2JqZWN0KGRlZi5kb21haW5NaW4pKSB7XG4gICAgICBpZiAoZGVmLmRvbWFpbk1pbi5zaWduYWwpIHtcbiAgICAgICAgZG9tYWluWzBdID0gc2lnbmFsLmNhbGwodGhpcywgZGVmLmRvbWFpbk1pbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb21haW5bMF0gPSBkYXRhUmVmLmNhbGwodGhpcywgQy5ET01BSU4rQy5NSU4sIGRlZi5kb21haW5NaW4sIHNjYWxlLCBncm91cClbMF07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvbWFpblswXSA9IGRlZi5kb21haW5NaW47XG4gICAgfVxuICB9XG4gIGlmIChkZWYuZG9tYWluTWF4ICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoZGwuaXNPYmplY3QoZGVmLmRvbWFpbk1heCkpIHtcbiAgICAgIGlmIChkZWYuZG9tYWluTWF4LnNpZ25hbCkge1xuICAgICAgICBkb21haW5bel0gPSBzaWduYWwuY2FsbCh0aGlzLCBkZWYuZG9tYWluTWF4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvbWFpblt6XSA9IGRhdGFSZWYuY2FsbCh0aGlzLCBDLkRPTUFJTitDLk1BWCwgZGVmLmRvbWFpbk1heCwgc2NhbGUsIGdyb3VwKVsxXTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZG9tYWluW3pdID0gZGVmLmRvbWFpbk1heDtcbiAgICB9XG4gIH1cbiAgaWYgKGRlZi50eXBlICE9PSBDLkxPRyAmJiBkZWYudHlwZSAhPT0gQy5USU1FICYmIChkZWYuemVybyB8fCBkZWYuemVybz09PXVuZGVmaW5lZCkpIHtcbiAgICBkb21haW5bMF0gPSBNYXRoLm1pbigwLCBkb21haW5bMF0pO1xuICAgIGRvbWFpblt6XSA9IE1hdGgubWF4KDAsIGRvbWFpblt6XSk7XG4gIH1cbiAgcmV0dXJuIGRvbWFpbjtcbn1cblxuZnVuY3Rpb24gcmFuZ2UoZ3JvdXApIHtcbiAgdmFyIGRlZiA9IHRoaXMuX2RlZixcbiAgICAgIHJuZyA9IFtudWxsLCBudWxsXTtcblxuICBpZiAoZGVmLnJhbmdlICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIGRlZi5yYW5nZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChHUk9VUF9QUk9QRVJUWVtkZWYucmFuZ2VdKSB7XG4gICAgICAgIHJuZyA9IFswLCBncm91cFtkZWYucmFuZ2VdXTtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLnJhbmdlW2RlZi5yYW5nZV0pIHtcbiAgICAgICAgcm5nID0gY29uZmlnLnJhbmdlW2RlZi5yYW5nZV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkbC5lcnJvcihcIlVucmVjb2dpemVkIHJhbmdlOiBcIitkZWYucmFuZ2UpO1xuICAgICAgICByZXR1cm4gcm5nO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZGwuaXNBcnJheShkZWYucmFuZ2UpKSB7XG4gICAgICBybmcgPSBkZWYucmFuZ2UubWFwKHNpZ25hbC5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2UgaWYgKGRsLmlzT2JqZWN0KGRlZi5yYW5nZSkpIHtcbiAgICAgIHJldHVybiBudWxsOyAvLyBlYXJseSBleGl0XG4gICAgfSBlbHNlIHtcbiAgICAgIHJuZyA9IFswLCBkZWYucmFuZ2VdO1xuICAgIH1cbiAgfVxuICBpZiAoZGVmLnJhbmdlTWluICE9PSB1bmRlZmluZWQpIHtcbiAgICBybmdbMF0gPSBkZWYucmFuZ2VNaW4uc2lnbmFsID8gc2lnbmFsLmNhbGwodGhpcywgZGVmLnJhbmdlTWluKSA6IGRlZi5yYW5nZU1pbjtcbiAgfVxuICBpZiAoZGVmLnJhbmdlTWF4ICE9PSB1bmRlZmluZWQpIHtcbiAgICBybmdbcm5nLmxlbmd0aC0xXSA9IGRlZi5yYW5nZU1heC5zaWduYWwgPyBzaWduYWwuY2FsbCh0aGlzLCBkZWYucmFuZ2VNYXgpIDogZGVmLnJhbmdlTWF4O1xuICB9XG4gIFxuICBpZiAoZGVmLnJldmVyc2UgIT09IHVuZGVmaW5lZCkge1xuICAgIHZhciByZXYgPSBkZWYucmV2ZXJzZTtcbiAgICBpZiAoZGwuaXNPYmplY3QocmV2KSkge1xuICAgICAgcmV2ID0gZGwuYWNjZXNzb3IocmV2LmZpZWxkKShncm91cC5kYXR1bSk7XG4gICAgfVxuICAgIGlmIChyZXYpIHJuZyA9IHJuZy5yZXZlcnNlKCk7XG4gIH1cbiAgXG4gIHJldHVybiBybmc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2NhbGU7IiwidmFyIHR1cGxlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvdHVwbGUnKSxcbiAgICBjYWxjQm91bmRzID0gcmVxdWlyZSgnLi4vdXRpbC9ib3VuZHMnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gVHJhbnNpdGlvbihkdXJhdGlvbiwgZWFzZSkge1xuICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb24gfHwgNTAwO1xuICB0aGlzLmVhc2UgPSBlYXNlICYmIGQzLmVhc2UoZWFzZSkgfHwgZDMuZWFzZShcImN1YmljLWluLW91dFwiKTtcbiAgdGhpcy51cGRhdGVzID0ge25leHQ6IG51bGx9O1xufVxuXG52YXIgcHJvdG90eXBlID0gVHJhbnNpdGlvbi5wcm90b3R5cGU7XG5cbnZhciBza2lwID0ge1xuICBcInRleHRcIjogMSxcbiAgXCJ1cmxcIjogIDFcbn07XG5cbnByb3RvdHlwZS5pbnRlcnBvbGF0ZSA9IGZ1bmN0aW9uKGl0ZW0sIHZhbHVlcywgc3RhbXApIHtcbiAgdmFyIGtleSwgY3VyciwgbmV4dCwgaW50ZXJwLCBsaXN0ID0gbnVsbDtcblxuICBmb3IgKGtleSBpbiB2YWx1ZXMpIHtcbiAgICBjdXJyID0gaXRlbVtrZXldO1xuICAgIG5leHQgPSB2YWx1ZXNba2V5XTsgICAgICBcbiAgICBpZiAoY3VyciAhPT0gbmV4dCkge1xuICAgICAgaWYgKHNraXBba2V5XSB8fCBjdXJyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gc2tpcCBpbnRlcnBvbGF0aW9uIGZvciBzcGVjaWZpYyBrZXlzIG9yIHVuZGVmaW5lZCBzdGFydCB2YWx1ZXNcbiAgICAgICAgdHVwbGUuc2V0KGl0ZW0sIGtleSwgbmV4dCk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjdXJyID09PSBcIm51bWJlclwiICYmICFpc0Zpbml0ZShjdXJyKSkge1xuICAgICAgICAvLyBmb3IgTmFOIG9yIGluZmluaXRlIG51bWVyaWMgdmFsdWVzLCBza2lwIHRvIGZpbmFsIHZhbHVlXG4gICAgICAgIHR1cGxlLnNldChpdGVtLCBrZXksIG5leHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gb3RoZXJ3aXNlIGxvb2t1cCBpbnRlcnBvbGF0b3JcbiAgICAgICAgaW50ZXJwID0gZDMuaW50ZXJwb2xhdGUoY3VyciwgbmV4dCk7XG4gICAgICAgIGludGVycC5wcm9wZXJ0eSA9IGtleTtcbiAgICAgICAgKGxpc3QgfHwgKGxpc3Q9W10pKS5wdXNoKGludGVycCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGxpc3QgPT09IG51bGwgJiYgaXRlbS5zdGF0dXMgPT09IEMuRVhJVCkge1xuICAgIGxpc3QgPSBbXTsgLy8gZW5zdXJlIGV4aXRpbmcgaXRlbXMgYXJlIGluY2x1ZGVkXG4gIH1cblxuICBpZiAobGlzdCAhPSBudWxsKSB7XG4gICAgbGlzdC5pdGVtID0gaXRlbTtcbiAgICBsaXN0LmVhc2UgPSBpdGVtLm1hcmsuZWFzZSB8fCB0aGlzLmVhc2U7XG4gICAgbGlzdC5uZXh0ID0gdGhpcy51cGRhdGVzLm5leHQ7XG4gICAgdGhpcy51cGRhdGVzLm5leHQgPSBsaXN0O1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdmFyIHQgPSB0aGlzLCBwcmV2ID0gdC51cGRhdGVzLCBjdXJyID0gcHJldi5uZXh0O1xuICBmb3IgKDsgY3VyciE9bnVsbDsgcHJldj1jdXJyLCBjdXJyPXByZXYubmV4dCkge1xuICAgIGlmIChjdXJyLml0ZW0uc3RhdHVzID09PSBDLkVYSVQpIGN1cnIucmVtb3ZlID0gdHJ1ZTtcbiAgfVxuICB0LmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gIGQzLnRpbWVyKGZ1bmN0aW9uKGVsYXBzZWQpIHsgcmV0dXJuIHN0ZXAuY2FsbCh0LCBlbGFwc2VkKTsgfSk7XG59O1xuXG5mdW5jdGlvbiBzdGVwKGVsYXBzZWQpIHtcbiAgdmFyIGxpc3QgPSB0aGlzLnVwZGF0ZXMsIHByZXYgPSBsaXN0LCBjdXJyID0gcHJldi5uZXh0LFxuICAgICAgZHVyYXRpb24gPSB0aGlzLmR1cmF0aW9uLFxuICAgICAgaXRlbSwgZGVsYXksIGYsIGUsIGksIG4sIHN0b3AgPSB0cnVlO1xuXG4gIGZvciAoOyBjdXJyIT1udWxsOyBwcmV2PWN1cnIsIGN1cnI9cHJldi5uZXh0KSB7XG4gICAgaXRlbSA9IGN1cnIuaXRlbTtcbiAgICBkZWxheSA9IGl0ZW0uZGVsYXkgfHwgMDtcblxuICAgIGYgPSAoZWxhcHNlZCAtIGRlbGF5KSAvIGR1cmF0aW9uO1xuICAgIGlmIChmIDwgMCkgeyBzdG9wID0gZmFsc2U7IGNvbnRpbnVlOyB9XG4gICAgaWYgKGYgPiAxKSBmID0gMTtcbiAgICBlID0gY3Vyci5lYXNlKGYpO1xuXG4gICAgZm9yIChpPTAsIG49Y3Vyci5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgICBpdGVtW2N1cnJbaV0ucHJvcGVydHldID0gY3VycltpXShlKTtcbiAgICB9XG4gICAgaXRlbS50b3VjaCgpO1xuICAgIGNhbGNCb3VuZHMuaXRlbShpdGVtKTtcblxuICAgIGlmIChmID09PSAxKSB7XG4gICAgICBpZiAoY3Vyci5yZW1vdmUpIGl0ZW0ucmVtb3ZlKCk7XG4gICAgICBwcmV2Lm5leHQgPSBjdXJyLm5leHQ7XG4gICAgICBjdXJyID0gcHJldjtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RvcCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMuY2FsbGJhY2soKTtcbiAgcmV0dXJuIHN0b3A7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zaXRpb247IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIGNvbmZpZyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uZmlnJyksXG4gICAgdHBsID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvdHVwbGUnKSxcbiAgICBwYXJzZU1hcmsgPSByZXF1aXJlKCcuLi9wYXJzZS9tYXJrJyk7XG5cbmZ1bmN0aW9uIGF4cyhtb2RlbCkge1xuICB2YXIgc2NhbGUsXG4gICAgICBvcmllbnQgPSBjb25maWcuYXhpcy5vcmllbnQsXG4gICAgICBvZmZzZXQgPSAwLFxuICAgICAgdGl0bGVPZmZzZXQgPSBjb25maWcuYXhpcy50aXRsZU9mZnNldCxcbiAgICAgIGF4aXNEZWYgPSB7fSxcbiAgICAgIGxheWVyID0gXCJmcm9udFwiLFxuICAgICAgZ3JpZCA9IGZhbHNlLFxuICAgICAgdGl0bGUgPSBudWxsLFxuICAgICAgdGlja01ham9yU2l6ZSA9IGNvbmZpZy5heGlzLnRpY2tTaXplLFxuICAgICAgdGlja01pbm9yU2l6ZSA9IGNvbmZpZy5heGlzLnRpY2tTaXplLFxuICAgICAgdGlja0VuZFNpemUgPSBjb25maWcuYXhpcy50aWNrU2l6ZSxcbiAgICAgIHRpY2tQYWRkaW5nID0gY29uZmlnLmF4aXMucGFkZGluZyxcbiAgICAgIHRpY2tWYWx1ZXMgPSBudWxsLFxuICAgICAgdGlja0Zvcm1hdFN0cmluZyA9IG51bGwsXG4gICAgICB0aWNrRm9ybWF0ID0gbnVsbCxcbiAgICAgIHRpY2tTdWJkaXZpZGUgPSAwLFxuICAgICAgdGlja0FyZ3VtZW50cyA9IFtjb25maWcuYXhpcy50aWNrc10sXG4gICAgICBncmlkTGluZVN0eWxlID0ge30sXG4gICAgICB0aWNrTGFiZWxTdHlsZSA9IHt9LFxuICAgICAgbWFqb3JUaWNrU3R5bGUgPSB7fSxcbiAgICAgIG1pbm9yVGlja1N0eWxlID0ge30sXG4gICAgICB0aXRsZVN0eWxlID0ge30sXG4gICAgICBkb21haW5TdHlsZSA9IHt9LFxuICAgICAgbSA9IHsgLy8gQXhpcyBtYXJrcyBhcyByZWZlcmVuY2VzIGZvciB1cGRhdGVzXG4gICAgICAgIGdyaWRMaW5lczogbnVsbCxcbiAgICAgICAgbWFqb3JUaWNrczogbnVsbCxcbiAgICAgICAgbWlub3JUaWNrczogbnVsbCxcbiAgICAgICAgdGlja0xhYmVsczogbnVsbCxcbiAgICAgICAgZG9tYWluOiBudWxsLFxuICAgICAgICB0aXRsZTogbnVsbFxuICAgICAgfTtcblxuICB2YXIgYXhpcyA9IHt9O1xuXG4gIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgIGF4aXNEZWYudHlwZSA9IG51bGw7XG4gIH07XG5cbiAgYXhpcy5kZWYgPSBmdW5jdGlvbigpIHtcbiAgICBpZighYXhpc0RlZi50eXBlKSBheGlzX2RlZihzY2FsZSk7XG5cbiAgICAvLyB0aWNrIGZvcm1hdFxuICAgIHRpY2tGb3JtYXQgPSAhdGlja0Zvcm1hdFN0cmluZyA/IG51bGwgOiAoKHNjYWxlLnR5cGUgPT09ICd0aW1lJylcbiAgICAgID8gZDMudGltZS5mb3JtYXQodGlja0Zvcm1hdFN0cmluZylcbiAgICAgIDogZDMuZm9ybWF0KHRpY2tGb3JtYXRTdHJpbmcpKTtcblxuICAgIC8vIGdlbmVyYXRlIGRhdGFcbiAgICAvLyBXZSBkb24ndCBfcmVhbGx5XyBuZWVkIHRvIG1vZGVsIHRoZXNlIGFzIHR1cGxlcyBhcyBubyBmdXJ0aGVyXG4gICAgLy8gZGF0YSB0cmFuc2Zvcm1hdGlvbiBpcyBkb25lLiBTbyB3ZSBvcHRpbWl6ZSBmb3IgYSBoaWdoIGNodXJuIHJhdGUuIFxuICAgIHZhciBpbmplc3QgPSBmdW5jdGlvbihkKSB7IHJldHVybiB7ZGF0YTogZH07IH07XG4gICAgdmFyIG1ham9yID0gdGlja1ZhbHVlcyA9PSBudWxsXG4gICAgICA/IChzY2FsZS50aWNrcyA/IHNjYWxlLnRpY2tzLmFwcGx5KHNjYWxlLCB0aWNrQXJndW1lbnRzKSA6IHNjYWxlLmRvbWFpbigpKVxuICAgICAgOiB0aWNrVmFsdWVzO1xuICAgIHZhciBtaW5vciA9IHZnX2F4aXNTdWJkaXZpZGUoc2NhbGUsIG1ham9yLCB0aWNrU3ViZGl2aWRlKS5tYXAoaW5qZXN0KTtcbiAgICBtYWpvciA9IG1ham9yLm1hcChpbmplc3QpO1xuICAgIHZhciBmbXQgPSB0aWNrRm9ybWF0PT1udWxsID8gKHNjYWxlLnRpY2tGb3JtYXQgPyBzY2FsZS50aWNrRm9ybWF0LmFwcGx5KHNjYWxlLCB0aWNrQXJndW1lbnRzKSA6IFN0cmluZykgOiB0aWNrRm9ybWF0O1xuICAgIG1ham9yLmZvckVhY2goZnVuY3Rpb24oZCkgeyBkLmxhYmVsID0gZm10KGQuZGF0YSk7IH0pO1xuICAgIHZhciB0ZGF0YSA9IHRpdGxlID8gW3RpdGxlXS5tYXAoaW5qZXN0KSA6IFtdO1xuXG4gICAgYXhpc0RlZi5tYXJrc1swXS5mcm9tID0gZnVuY3Rpb24oKSB7IHJldHVybiBncmlkID8gbWFqb3IgOiBbXTsgfTtcbiAgICBheGlzRGVmLm1hcmtzWzFdLmZyb20gPSBmdW5jdGlvbigpIHsgcmV0dXJuIG1ham9yOyB9O1xuICAgIGF4aXNEZWYubWFya3NbMl0uZnJvbSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbWlub3I7IH07XG4gICAgYXhpc0RlZi5tYXJrc1szXS5mcm9tID0gYXhpc0RlZi5tYXJrc1sxXS5mcm9tO1xuICAgIGF4aXNEZWYubWFya3NbNF0uZnJvbSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gWzFdOyB9O1xuICAgIGF4aXNEZWYubWFya3NbNV0uZnJvbSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGRhdGE7IH07XG4gICAgYXhpc0RlZi5vZmZzZXQgPSBvZmZzZXQ7XG4gICAgYXhpc0RlZi5vcmllbnQgPSBvcmllbnQ7XG4gICAgYXhpc0RlZi5sYXllciA9IGxheWVyO1xuICAgIHJldHVybiBheGlzRGVmO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGF4aXNfZGVmKHNjYWxlKSB7XG4gICAgLy8gc2V0dXAgc2NhbGUgbWFwcGluZ1xuICAgIHZhciBuZXdTY2FsZSwgb2xkU2NhbGUsIHJhbmdlO1xuICAgIGlmIChzY2FsZS50eXBlID09PSBcIm9yZGluYWxcIikge1xuICAgICAgbmV3U2NhbGUgPSB7c2NhbGU6IHNjYWxlLnNjYWxlTmFtZSwgb2Zmc2V0OiAwLjUgKyBzY2FsZS5yYW5nZUJhbmQoKS8yfTtcbiAgICAgIG9sZFNjYWxlID0gbmV3U2NhbGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld1NjYWxlID0ge3NjYWxlOiBzY2FsZS5zY2FsZU5hbWUsIG9mZnNldDogMC41fTtcbiAgICAgIG9sZFNjYWxlID0ge3NjYWxlOiBzY2FsZS5zY2FsZU5hbWUrXCI6cHJldlwiLCBvZmZzZXQ6IDAuNX07XG4gICAgfVxuICAgIHJhbmdlID0gdmdfYXhpc1NjYWxlUmFuZ2Uoc2NhbGUpO1xuXG4gICAgLy8gc2V0dXAgYXhpcyBtYXJrc1xuICAgIGlmICghbS5ncmlkTGluZXMpICBtLmdyaWRMaW5lcyAgPSB2Z19heGlzVGlja3MoKTtcbiAgICBpZiAoIW0ubWFqb3JUaWNrcykgbS5tYWpvclRpY2tzID0gdmdfYXhpc1RpY2tzKCk7XG4gICAgaWYgKCFtLm1pbm9yVGlja3MpIG0ubWlub3JUaWNrcyA9IHZnX2F4aXNUaWNrcygpO1xuICAgIGlmICghbS50aWNrTGFiZWxzKSBtLnRpY2tMYWJlbHMgPSB2Z19heGlzVGlja0xhYmVscygpO1xuICAgIGlmICghbS5kb21haW4pIG0uZG9tYWluID0gdmdfYXhpc0RvbWFpbigpO1xuICAgIGlmICghbS50aXRsZSkgIG0udGl0bGUgID0gdmdfYXhpc1RpdGxlKCk7XG4gICAgbS5ncmlkTGluZXMucHJvcGVydGllcy5lbnRlci5zdHJva2UgPSB7dmFsdWU6IGNvbmZpZy5heGlzLmdyaWRDb2xvcn07XG5cbiAgICAvLyBleHRlbmQgYXhpcyBtYXJrcyBiYXNlZCBvbiBheGlzIG9yaWVudGF0aW9uXG4gICAgdmdfYXhpc1RpY2tzRXh0ZW5kKG9yaWVudCwgbS5ncmlkTGluZXMsIG9sZFNjYWxlLCBuZXdTY2FsZSwgSW5maW5pdHkpO1xuICAgIHZnX2F4aXNUaWNrc0V4dGVuZChvcmllbnQsIG0ubWFqb3JUaWNrcywgb2xkU2NhbGUsIG5ld1NjYWxlLCB0aWNrTWFqb3JTaXplKTtcbiAgICB2Z19heGlzVGlja3NFeHRlbmQob3JpZW50LCBtLm1pbm9yVGlja3MsIG9sZFNjYWxlLCBuZXdTY2FsZSwgdGlja01pbm9yU2l6ZSk7XG4gICAgdmdfYXhpc0xhYmVsRXh0ZW5kKG9yaWVudCwgbS50aWNrTGFiZWxzLCBvbGRTY2FsZSwgbmV3U2NhbGUsIHRpY2tNYWpvclNpemUsIHRpY2tQYWRkaW5nKTtcblxuICAgIHZnX2F4aXNEb21haW5FeHRlbmQob3JpZW50LCBtLmRvbWFpbiwgcmFuZ2UsIHRpY2tFbmRTaXplKTtcbiAgICB2Z19heGlzVGl0bGVFeHRlbmQob3JpZW50LCBtLnRpdGxlLCByYW5nZSwgdGl0bGVPZmZzZXQpOyAvLyBUT0RPIGdldCBvZmZzZXRcbiAgICBcbiAgICAvLyBhZGQgLyBvdmVycmlkZSBjdXN0b20gc3R5bGUgcHJvcGVydGllc1xuICAgIGRsLmV4dGVuZChtLmdyaWRMaW5lcy5wcm9wZXJ0aWVzLnVwZGF0ZSwgZ3JpZExpbmVTdHlsZSk7XG4gICAgZGwuZXh0ZW5kKG0ubWFqb3JUaWNrcy5wcm9wZXJ0aWVzLnVwZGF0ZSwgbWFqb3JUaWNrU3R5bGUpO1xuICAgIGRsLmV4dGVuZChtLm1pbm9yVGlja3MucHJvcGVydGllcy51cGRhdGUsIG1pbm9yVGlja1N0eWxlKTtcbiAgICBkbC5leHRlbmQobS50aWNrTGFiZWxzLnByb3BlcnRpZXMudXBkYXRlLCB0aWNrTGFiZWxTdHlsZSk7XG4gICAgZGwuZXh0ZW5kKG0uZG9tYWluLnByb3BlcnRpZXMudXBkYXRlLCBkb21haW5TdHlsZSk7XG4gICAgZGwuZXh0ZW5kKG0udGl0bGUucHJvcGVydGllcy51cGRhdGUsIHRpdGxlU3R5bGUpO1xuXG4gICAgdmFyIG1hcmtzID0gW20uZ3JpZExpbmVzLCBtLm1ham9yVGlja3MsIG0ubWlub3JUaWNrcywgbS50aWNrTGFiZWxzLCBtLmRvbWFpbiwgbS50aXRsZV07XG4gICAgZGwuZXh0ZW5kKGF4aXNEZWYsIHtcbiAgICAgIHR5cGU6IFwiZ3JvdXBcIixcbiAgICAgIGludGVyYWN0aXZlOiBmYWxzZSxcbiAgICAgIHByb3BlcnRpZXM6IHsgXG4gICAgICAgIGVudGVyOiB7XG4gICAgICAgICAgZW5jb2RlOiB2Z19heGlzVXBkYXRlLFxuICAgICAgICAgIHNjYWxlczogW3NjYWxlLnNjYWxlTmFtZV0sXG4gICAgICAgICAgc2lnbmFsczogW10sIGRhdGE6IFtdXG4gICAgICAgIH0sXG4gICAgICAgIHVwZGF0ZToge1xuICAgICAgICAgIGVuY29kZTogdmdfYXhpc1VwZGF0ZSxcbiAgICAgICAgICBzY2FsZXM6IFtzY2FsZS5zY2FsZU5hbWVdLFxuICAgICAgICAgIHNpZ25hbHM6IFtdLCBkYXRhOiBbXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBheGlzRGVmLm1hcmtzID0gbWFya3MubWFwKGZ1bmN0aW9uKG0pIHsgcmV0dXJuIHBhcnNlTWFyayhtb2RlbCwgbSk7IH0pO1xuICB9O1xuXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc2NhbGU7XG4gICAgaWYgKHNjYWxlICE9PSB4KSB7IHNjYWxlID0geDsgcmVzZXQoKTsgfVxuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMub3JpZW50ID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIG9yaWVudDtcbiAgICBpZiAob3JpZW50ICE9PSB4KSB7XG4gICAgICBvcmllbnQgPSB4IGluIHZnX2F4aXNPcmllbnRzID8geCArIFwiXCIgOiBjb25maWcuYXhpcy5vcmllbnQ7XG4gICAgICByZXNldCgpO1xuICAgIH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLnRpdGxlID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRpdGxlO1xuICAgIGlmICh0aXRsZSAhPT0geCkgeyB0aXRsZSA9IHg7IHJlc2V0KCk7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja0FyZ3VtZW50cztcbiAgICB0aWNrQXJndW1lbnRzID0gYXJndW1lbnRzO1xuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMudGlja1ZhbHVlcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aWNrVmFsdWVzO1xuICAgIHRpY2tWYWx1ZXMgPSB4O1xuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMudGlja0Zvcm1hdCA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aWNrRm9ybWF0U3RyaW5nO1xuICAgIGlmICh0aWNrRm9ybWF0U3RyaW5nICE9PSB4KSB7XG4gICAgICB0aWNrRm9ybWF0U3RyaW5nID0geDtcbiAgICAgIHJlc2V0KCk7XG4gICAgfVxuICAgIHJldHVybiBheGlzO1xuICB9O1xuICBcbiAgYXhpcy50aWNrU2l6ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aWNrTWFqb3JTaXplO1xuICAgIHZhciBuID0gYXJndW1lbnRzLmxlbmd0aCAtIDEsXG4gICAgICAgIG1ham9yID0gK3gsXG4gICAgICAgIG1pbm9yID0gbiA+IDEgPyAreSA6IHRpY2tNYWpvclNpemUsXG4gICAgICAgIGVuZCAgID0gbiA+IDAgPyArYXJndW1lbnRzW25dIDogdGlja01ham9yU2l6ZTtcblxuICAgIGlmICh0aWNrTWFqb3JTaXplICE9PSBtYWpvciB8fFxuICAgICAgICB0aWNrTWlub3JTaXplICE9PSBtaW5vciB8fFxuICAgICAgICB0aWNrRW5kU2l6ZSAhPT0gZW5kKSB7XG4gICAgICByZXNldCgpO1xuICAgIH1cblxuICAgIHRpY2tNYWpvclNpemUgPSBtYWpvcjtcbiAgICB0aWNrTWlub3JTaXplID0gbWlub3I7XG4gICAgdGlja0VuZFNpemUgPSBlbmQ7XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy50aWNrU3ViZGl2aWRlID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRpY2tTdWJkaXZpZGU7XG4gICAgdGlja1N1YmRpdmlkZSA9ICt4O1xuICAgIHJldHVybiBheGlzO1xuICB9O1xuICBcbiAgYXhpcy5vZmZzZXQgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gb2Zmc2V0O1xuICAgIG9mZnNldCA9IGRsLmlzT2JqZWN0KHgpID8geCA6ICt4O1xuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMudGlja1BhZGRpbmcgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja1BhZGRpbmc7XG4gICAgaWYgKHRpY2tQYWRkaW5nICE9PSAreCkgeyB0aWNrUGFkZGluZyA9ICt4OyByZXNldCgpOyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy50aXRsZU9mZnNldCA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aXRsZU9mZnNldDtcbiAgICBpZiAodGl0bGVPZmZzZXQgIT09ICt4KSB7IHRpdGxlT2Zmc2V0ID0gK3g7IHJlc2V0KCk7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLmxheWVyID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGxheWVyO1xuICAgIGlmIChsYXllciAhPT0geCkgeyBsYXllciA9IHg7IHJlc2V0KCk7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLmdyaWQgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZ3JpZDtcbiAgICBpZiAoZ3JpZCAhPT0geCkgeyBncmlkID0geDsgcmVzZXQoKTsgfVxuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMuZ3JpZExpbmVQcm9wZXJ0aWVzID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGdyaWRMaW5lU3R5bGU7XG4gICAgaWYgKGdyaWRMaW5lU3R5bGUgIT09IHgpIHsgZ3JpZExpbmVTdHlsZSA9IHg7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLm1ham9yVGlja1Byb3BlcnRpZXMgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gbWFqb3JUaWNrU3R5bGU7XG4gICAgaWYgKG1ham9yVGlja1N0eWxlICE9PSB4KSB7IG1ham9yVGlja1N0eWxlID0geDsgfVxuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMubWlub3JUaWNrUHJvcGVydGllcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBtaW5vclRpY2tTdHlsZTtcbiAgICBpZiAobWlub3JUaWNrU3R5bGUgIT09IHgpIHsgbWlub3JUaWNrU3R5bGUgPSB4OyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy50aWNrTGFiZWxQcm9wZXJ0aWVzID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRpY2tMYWJlbFN0eWxlO1xuICAgIGlmICh0aWNrTGFiZWxTdHlsZSAhPT0geCkgeyB0aWNrTGFiZWxTdHlsZSA9IHg7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLnRpdGxlUHJvcGVydGllcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aXRsZVN0eWxlO1xuICAgIGlmICh0aXRsZVN0eWxlICE9PSB4KSB7IHRpdGxlU3R5bGUgPSB4OyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy5kb21haW5Qcm9wZXJ0aWVzID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGRvbWFpblN0eWxlO1xuICAgIGlmIChkb21haW5TdHlsZSAhPT0geCkgeyBkb21haW5TdHlsZSA9IHg7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcbiAgXG4gIGF4aXMucmVzZXQgPSBmdW5jdGlvbigpIHsgcmVzZXQoKTsgfTtcblxuICByZXR1cm4gYXhpcztcbn07XG5cbnZhciB2Z19heGlzT3JpZW50cyA9IHt0b3A6IDEsIHJpZ2h0OiAxLCBib3R0b206IDEsIGxlZnQ6IDF9O1xuXG5mdW5jdGlvbiB2Z19heGlzU3ViZGl2aWRlKHNjYWxlLCB0aWNrcywgbSkge1xuICBzdWJ0aWNrcyA9IFtdO1xuICBpZiAobSAmJiB0aWNrcy5sZW5ndGggPiAxKSB7XG4gICAgdmFyIGV4dGVudCA9IHZnX2F4aXNTY2FsZUV4dGVudChzY2FsZS5kb21haW4oKSksXG4gICAgICAgIHN1YnRpY2tzLFxuICAgICAgICBpID0gLTEsXG4gICAgICAgIG4gPSB0aWNrcy5sZW5ndGgsXG4gICAgICAgIGQgPSAodGlja3NbMV0gLSB0aWNrc1swXSkgLyArK20sXG4gICAgICAgIGosXG4gICAgICAgIHY7XG4gICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgIGZvciAoaiA9IG07IC0taiA+IDA7KSB7XG4gICAgICAgIGlmICgodiA9ICt0aWNrc1tpXSAtIGogKiBkKSA+PSBleHRlbnRbMF0pIHtcbiAgICAgICAgICBzdWJ0aWNrcy5wdXNoKHYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoLS1pLCBqID0gMDsgKytqIDwgbSAmJiAodiA9ICt0aWNrc1tpXSArIGogKiBkKSA8IGV4dGVudFsxXTspIHtcbiAgICAgIHN1YnRpY2tzLnB1c2godik7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdWJ0aWNrcztcbn1cblxuZnVuY3Rpb24gdmdfYXhpc1NjYWxlRXh0ZW50KGRvbWFpbikge1xuICB2YXIgc3RhcnQgPSBkb21haW5bMF0sIHN0b3AgPSBkb21haW5bZG9tYWluLmxlbmd0aCAtIDFdO1xuICByZXR1cm4gc3RhcnQgPCBzdG9wID8gW3N0YXJ0LCBzdG9wXSA6IFtzdG9wLCBzdGFydF07XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNTY2FsZVJhbmdlKHNjYWxlKSB7XG4gIHJldHVybiBzY2FsZS5yYW5nZUV4dGVudFxuICAgID8gc2NhbGUucmFuZ2VFeHRlbnQoKVxuICAgIDogdmdfYXhpc1NjYWxlRXh0ZW50KHNjYWxlLnJhbmdlKCkpO1xufVxuXG52YXIgdmdfYXhpc0FsaWduID0ge1xuICBib3R0b206IFwiY2VudGVyXCIsXG4gIHRvcDogXCJjZW50ZXJcIixcbiAgbGVmdDogXCJyaWdodFwiLFxuICByaWdodDogXCJsZWZ0XCJcbn07XG5cbnZhciB2Z19heGlzQmFzZWxpbmUgPSB7XG4gIGJvdHRvbTogXCJ0b3BcIixcbiAgdG9wOiBcImJvdHRvbVwiLFxuICBsZWZ0OiBcIm1pZGRsZVwiLFxuICByaWdodDogXCJtaWRkbGVcIlxufTtcblxuZnVuY3Rpb24gdmdfYXhpc0xhYmVsRXh0ZW5kKG9yaWVudCwgbGFiZWxzLCBvbGRTY2FsZSwgbmV3U2NhbGUsIHNpemUsIHBhZCkge1xuICBzaXplID0gTWF0aC5tYXgoc2l6ZSwgMCkgKyBwYWQ7XG4gIGlmIChvcmllbnQgPT09IFwibGVmdFwiIHx8IG9yaWVudCA9PT0gXCJ0b3BcIikge1xuICAgIHNpemUgKj0gLTE7XG4gIH0gIFxuICBpZiAob3JpZW50ID09PSBcInRvcFwiIHx8IG9yaWVudCA9PT0gXCJib3R0b21cIikge1xuICAgIGRsLmV4dGVuZChsYWJlbHMucHJvcGVydGllcy5lbnRlciwge1xuICAgICAgeDogb2xkU2NhbGUsXG4gICAgICB5OiB7dmFsdWU6IHNpemV9LFxuICAgIH0pO1xuICAgIGRsLmV4dGVuZChsYWJlbHMucHJvcGVydGllcy51cGRhdGUsIHtcbiAgICAgIHg6IG5ld1NjYWxlLFxuICAgICAgeToge3ZhbHVlOiBzaXplfSxcbiAgICAgIGFsaWduOiB7dmFsdWU6IFwiY2VudGVyXCJ9LFxuICAgICAgYmFzZWxpbmU6IHt2YWx1ZTogdmdfYXhpc0Jhc2VsaW5lW29yaWVudF19XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgZGwuZXh0ZW5kKGxhYmVscy5wcm9wZXJ0aWVzLmVudGVyLCB7XG4gICAgICB4OiB7dmFsdWU6IHNpemV9LFxuICAgICAgeTogb2xkU2NhbGUsXG4gICAgfSk7XG4gICAgZGwuZXh0ZW5kKGxhYmVscy5wcm9wZXJ0aWVzLnVwZGF0ZSwge1xuICAgICAgeDoge3ZhbHVlOiBzaXplfSxcbiAgICAgIHk6IG5ld1NjYWxlLFxuICAgICAgYWxpZ246IHt2YWx1ZTogdmdfYXhpc0FsaWduW29yaWVudF19LFxuICAgICAgYmFzZWxpbmU6IHt2YWx1ZTogXCJtaWRkbGVcIn1cbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2Z19heGlzVGlja3NFeHRlbmQob3JpZW50LCB0aWNrcywgb2xkU2NhbGUsIG5ld1NjYWxlLCBzaXplKSB7XG4gIHZhciBzaWduID0gKG9yaWVudCA9PT0gXCJsZWZ0XCIgfHwgb3JpZW50ID09PSBcInRvcFwiKSA/IC0xIDogMTtcbiAgaWYgKHNpemUgPT09IEluZmluaXR5KSB7XG4gICAgc2l6ZSA9IChvcmllbnQgPT09IFwidG9wXCIgfHwgb3JpZW50ID09PSBcImJvdHRvbVwiKVxuICAgICAgPyB7Z3JvdXA6IFwibWFyay5ncm91cC5oZWlnaHRcIiwgbXVsdDogLXNpZ259XG4gICAgICA6IHtncm91cDogXCJtYXJrLmdyb3VwLndpZHRoXCIsIG11bHQ6IC1zaWdufTtcbiAgfSBlbHNlIHtcbiAgICBzaXplID0ge3ZhbHVlOiBzaWduICogc2l6ZX07XG4gIH1cbiAgaWYgKG9yaWVudCA9PT0gXCJ0b3BcIiB8fCBvcmllbnQgPT09IFwiYm90dG9tXCIpIHtcbiAgICBkbC5leHRlbmQodGlja3MucHJvcGVydGllcy5lbnRlciwge1xuICAgICAgeDogIG9sZFNjYWxlLFxuICAgICAgeTogIHt2YWx1ZTogMH0sXG4gICAgICB5Mjogc2l6ZVxuICAgIH0pO1xuICAgIGRsLmV4dGVuZCh0aWNrcy5wcm9wZXJ0aWVzLnVwZGF0ZSwge1xuICAgICAgeDogIG5ld1NjYWxlLFxuICAgICAgeTogIHt2YWx1ZTogMH0sXG4gICAgICB5Mjogc2l6ZVxuICAgIH0pO1xuICAgIGRsLmV4dGVuZCh0aWNrcy5wcm9wZXJ0aWVzLmV4aXQsIHtcbiAgICAgIHg6ICBuZXdTY2FsZSxcbiAgICB9KTsgICAgICAgIFxuICB9IGVsc2Uge1xuICAgIGRsLmV4dGVuZCh0aWNrcy5wcm9wZXJ0aWVzLmVudGVyLCB7XG4gICAgICB4OiAge3ZhbHVlOiAwfSxcbiAgICAgIHgyOiBzaXplLFxuICAgICAgeTogIG9sZFNjYWxlXG4gICAgfSk7XG4gICAgZGwuZXh0ZW5kKHRpY2tzLnByb3BlcnRpZXMudXBkYXRlLCB7XG4gICAgICB4OiAge3ZhbHVlOiAwfSxcbiAgICAgIHgyOiBzaXplLFxuICAgICAgeTogIG5ld1NjYWxlXG4gICAgfSk7XG4gICAgZGwuZXh0ZW5kKHRpY2tzLnByb3BlcnRpZXMuZXhpdCwge1xuICAgICAgeTogIG5ld1NjYWxlLFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNUaXRsZUV4dGVuZChvcmllbnQsIHRpdGxlLCByYW5nZSwgb2Zmc2V0KSB7XG4gIHZhciBtaWQgPSB+figocmFuZ2VbMF0gKyByYW5nZVsxXSkgLyAyKSxcbiAgICAgIHNpZ24gPSAob3JpZW50ID09PSBcInRvcFwiIHx8IG9yaWVudCA9PT0gXCJsZWZ0XCIpID8gLTEgOiAxO1xuICBcbiAgaWYgKG9yaWVudCA9PT0gXCJib3R0b21cIiB8fCBvcmllbnQgPT09IFwidG9wXCIpIHtcbiAgICBkbC5leHRlbmQodGl0bGUucHJvcGVydGllcy51cGRhdGUsIHtcbiAgICAgIHg6IHt2YWx1ZTogbWlkfSxcbiAgICAgIHk6IHt2YWx1ZTogc2lnbipvZmZzZXR9LFxuICAgICAgYW5nbGU6IHt2YWx1ZTogMH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBkbC5leHRlbmQodGl0bGUucHJvcGVydGllcy51cGRhdGUsIHtcbiAgICAgIHg6IHt2YWx1ZTogc2lnbipvZmZzZXR9LFxuICAgICAgeToge3ZhbHVlOiBtaWR9LFxuICAgICAgYW5nbGU6IHt2YWx1ZTogLTkwfVxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNEb21haW5FeHRlbmQob3JpZW50LCBkb21haW4sIHJhbmdlLCBzaXplKSB7XG4gIHZhciBwYXRoO1xuICBpZiAob3JpZW50ID09PSBcInRvcFwiIHx8IG9yaWVudCA9PT0gXCJsZWZ0XCIpIHtcbiAgICBzaXplID0gLTEgKiBzaXplO1xuICB9XG4gIGlmIChvcmllbnQgPT09IFwiYm90dG9tXCIgfHwgb3JpZW50ID09PSBcInRvcFwiKSB7XG4gICAgcGF0aCA9IFwiTVwiICsgcmFuZ2VbMF0gKyBcIixcIiArIHNpemUgKyBcIlYwSFwiICsgcmFuZ2VbMV0gKyBcIlZcIiArIHNpemU7XG4gIH0gZWxzZSB7XG4gICAgcGF0aCA9IFwiTVwiICsgc2l6ZSArIFwiLFwiICsgcmFuZ2VbMF0gKyBcIkgwVlwiICsgcmFuZ2VbMV0gKyBcIkhcIiArIHNpemU7XG4gIH1cbiAgZG9tYWluLnByb3BlcnRpZXMudXBkYXRlLnBhdGggPSB7dmFsdWU6IHBhdGh9O1xufVxuXG5mdW5jdGlvbiB2Z19heGlzVXBkYXRlKGl0ZW0sIGdyb3VwLCB0cmFucywgZGIsIHNpZ25hbHMsIHByZWRpY2F0ZXMpIHtcbiAgdmFyIG8gPSB0cmFucyA/IHt9IDogaXRlbSxcbiAgICAgIG9mZnNldCA9IGl0ZW0ubWFyay5kZWYub2Zmc2V0LFxuICAgICAgb3JpZW50ID0gaXRlbS5tYXJrLmRlZi5vcmllbnQsXG4gICAgICB3aWR0aCAgPSBncm91cC53aWR0aCxcbiAgICAgIGhlaWdodCA9IGdyb3VwLmhlaWdodDsgLy8gVE9ETyBmYWxsYmFjayB0byBnbG9iYWwgdyxoP1xuXG4gIGlmIChkbC5pc09iamVjdChvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gLWdyb3VwLnNjYWxlKG9mZnNldC5zY2FsZSkob2Zmc2V0LnZhbHVlKTtcbiAgfVxuXG4gIHN3aXRjaCAob3JpZW50KSB7XG4gICAgY2FzZSBcImxlZnRcIjogICB7IHRwbC5zZXQobywgJ3gnLCAtb2Zmc2V0KTsgdHBsLnNldChvLCAneScsIDApOyBicmVhazsgfVxuICAgIGNhc2UgXCJyaWdodFwiOiAgeyB0cGwuc2V0KG8sICd4Jywgd2lkdGggKyBvZmZzZXQpOyB0cGwuc2V0KG8sICd5JywgMCk7IGJyZWFrOyB9XG4gICAgY2FzZSBcImJvdHRvbVwiOiB7IHRwbC5zZXQobywgJ3gnLCAwKTsgdHBsLnNldChvLCAneScsIGhlaWdodCArIG9mZnNldCk7IGJyZWFrOyB9XG4gICAgY2FzZSBcInRvcFwiOiAgICB7IHRwbC5zZXQobywgJ3gnLCAwKTsgdHBsLnNldChvLCAneScsIC1vZmZzZXQpOyBicmVhazsgfVxuICAgIGRlZmF1bHQ6ICAgICAgIHsgdHBsLnNldChvLCAneCcsIDApOyB0cGwuc2V0KG8sICd5JywgMCk7IH1cbiAgfVxuXG4gIGlmICh0cmFucykgdHJhbnMuaW50ZXJwb2xhdGUoaXRlbSwgbyk7XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNUaWNrcygpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcInJ1bGVcIixcbiAgICBpbnRlcmFjdGl2ZTogZmFsc2UsXG4gICAga2V5OiBcImRhdGFcIixcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBlbnRlcjoge1xuICAgICAgICBzdHJva2U6IHt2YWx1ZTogY29uZmlnLmF4aXMudGlja0NvbG9yfSxcbiAgICAgICAgc3Ryb2tlV2lkdGg6IHt2YWx1ZTogY29uZmlnLmF4aXMudGlja1dpZHRofSxcbiAgICAgICAgb3BhY2l0eToge3ZhbHVlOiAxZS02fVxuICAgICAgfSxcbiAgICAgIGV4aXQ6IHsgb3BhY2l0eToge3ZhbHVlOiAxZS02fSB9LFxuICAgICAgdXBkYXRlOiB7IG9wYWNpdHk6IHt2YWx1ZTogMX0gfVxuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gdmdfYXhpc1RpY2tMYWJlbHMoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgaW50ZXJhY3RpdmU6IHRydWUsXG4gICAga2V5OiBcImRhdGFcIixcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBlbnRlcjoge1xuICAgICAgICBmaWxsOiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpY2tMYWJlbENvbG9yfSxcbiAgICAgICAgZm9udDoge3ZhbHVlOiBjb25maWcuYXhpcy50aWNrTGFiZWxGb250fSxcbiAgICAgICAgZm9udFNpemU6IHt2YWx1ZTogY29uZmlnLmF4aXMudGlja0xhYmVsRm9udFNpemV9LFxuICAgICAgICBvcGFjaXR5OiB7dmFsdWU6IDFlLTZ9LFxuICAgICAgICB0ZXh0OiB7ZmllbGQ6IFwibGFiZWxcIn1cbiAgICAgIH0sXG4gICAgICBleGl0OiB7IG9wYWNpdHk6IHt2YWx1ZTogMWUtNn0gfSxcbiAgICAgIHVwZGF0ZTogeyBvcGFjaXR5OiB7dmFsdWU6IDF9IH1cbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNUaXRsZSgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcInRleHRcIixcbiAgICBpbnRlcmFjdGl2ZTogdHJ1ZSxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBlbnRlcjoge1xuICAgICAgICBmb250OiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpdGxlRm9udH0sXG4gICAgICAgIGZvbnRTaXplOiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpdGxlRm9udFNpemV9LFxuICAgICAgICBmb250V2VpZ2h0OiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpdGxlRm9udFdlaWdodH0sXG4gICAgICAgIGZpbGw6IHt2YWx1ZTogY29uZmlnLmF4aXMudGl0bGVDb2xvcn0sXG4gICAgICAgIGFsaWduOiB7dmFsdWU6IFwiY2VudGVyXCJ9LFxuICAgICAgICBiYXNlbGluZToge3ZhbHVlOiBcIm1pZGRsZVwifSxcbiAgICAgICAgdGV4dDoge2ZpZWxkOiBcImRhdGFcIn1cbiAgICAgIH0sXG4gICAgICB1cGRhdGU6IHt9XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiB2Z19heGlzRG9tYWluKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwicGF0aFwiLFxuICAgIGludGVyYWN0aXZlOiBmYWxzZSxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBlbnRlcjoge1xuICAgICAgICB4OiB7dmFsdWU6IDAuNX0sXG4gICAgICAgIHk6IHt2YWx1ZTogMC41fSxcbiAgICAgICAgc3Ryb2tlOiB7dmFsdWU6IGNvbmZpZy5heGlzLmF4aXNDb2xvcn0sXG4gICAgICAgIHN0cm9rZVdpZHRoOiB7dmFsdWU6IGNvbmZpZy5heGlzLmF4aXNXaWR0aH1cbiAgICAgIH0sXG4gICAgICB1cGRhdGU6IHt9XG4gICAgfVxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGF4czsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICBHcm91cEJ5ID0gcmVxdWlyZSgnLi9Hcm91cEJ5JyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLCBcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9jaGFuZ2VzZXQnKSwgXG4gICAgbWVhcyA9IHJlcXVpcmUoJy4vbWVhc3VyZXMnKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gQWdncmVnYXRlKGdyYXBoKSB7XG4gIEdyb3VwQnkucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICBncm91cF9ieToge3R5cGU6IFwiYXJyYXk8ZmllbGQ+XCJ9XG4gIH0pO1xuXG4gIHRoaXMuX291dHB1dCA9IHtcbiAgICBcImNvdW50XCI6ICAgIFwiY291bnRcIixcbiAgICBcImF2Z1wiOiAgICAgIFwiYXZnXCIsXG4gICAgXCJtaW5cIjogICAgICBcIm1pblwiLFxuICAgIFwibWF4XCI6ICAgICAgXCJtYXhcIixcbiAgICBcInN1bVwiOiAgICAgIFwic3VtXCIsXG4gICAgXCJtZWFuXCI6ICAgICBcIm1lYW5cIixcbiAgICBcInZhclwiOiAgICAgIFwidmFyXCIsXG4gICAgXCJzdGRldlwiOiAgICBcInN0ZGV2XCIsXG4gICAgXCJ2YXJwXCI6ICAgICBcInZhcnBcIixcbiAgICBcInN0ZGV2cFwiOiAgIFwic3RkZXZwXCIsXG4gICAgXCJtZWRpYW5cIjogICBcIm1lZGlhblwiXG4gIH07XG5cbiAgLy8gQWdncmVnYXRvcnMgcGFyYW1ldGVyIGhhbmRsZWQgbWFudWFsbHkuXG4gIHRoaXMuX2ZpZWxkc0RlZiAgID0gbnVsbDtcbiAgdGhpcy5fQWdncmVnYXRvcnMgPSBudWxsO1xuICB0aGlzLl9zaW5nbGV0b24gICA9IGZhbHNlOyAgLy8gSWYgdHJ1ZSwgYWxsIGZpZWxkcyBhZ2dyZWdhdGVkIHdpdGhpbiBhIHNpbmdsZSBtb25vaWRcblxuICByZXR1cm4gdGhpcztcbn1cblxudmFyIHByb3RvID0gKEFnZ3JlZ2F0ZS5wcm90b3R5cGUgPSBuZXcgR3JvdXBCeSgpKTtcblxucHJvdG8uZmllbGRzID0ge1xuICBzZXQ6IGZ1bmN0aW9uKHRyYW5zZm9ybSwgZmllbGRzKSB7XG4gICAgdmFyIGksIGxlbiwgZiwgc2lnbmFscyA9IHt9O1xuICAgIGZvcihpPTAsIGxlbj1maWVsZHMubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgICBmID0gZmllbGRzW2ldO1xuICAgICAgaWYoZi5uYW1lLnNpZ25hbCkgc2lnbmFsc1tmLm5hbWUuc2lnbmFsXSA9IDE7XG4gICAgICBkbC5hcnJheShmLm9wcykuZm9yRWFjaChmdW5jdGlvbihvKXsgaWYoby5zaWduYWwpIHNpZ25hbHNbby5zaWduYWxdID0gMSB9KTtcbiAgICB9XG5cbiAgICB0cmFuc2Zvcm0uX2ZpZWxkc0RlZiA9IGZpZWxkcztcbiAgICB0cmFuc2Zvcm0uX0FnZ3JlZ2F0b3JzID0gbnVsbDtcbiAgICB0cmFuc2Zvcm0uYWdncygpO1xuICAgIHRyYW5zZm9ybS5kZXBlbmRlbmN5KEMuU0lHTkFMUywgZGwua2V5cyhzaWduYWxzKSk7XG4gICAgcmV0dXJuIHRyYW5zZm9ybTtcbiAgfVxufTtcblxucHJvdG8uc2luZ2xldG9uID0gZnVuY3Rpb24oYykge1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3NpbmdsZXRvbjtcbiAgdGhpcy5fc2luZ2xldG9uID0gYztcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5hZ2dzID0gZnVuY3Rpb24oKSB7XG4gIHZhciB0cmFuc2Zvcm0gPSB0aGlzLFxuICAgICAgZ3JhcGggPSB0aGlzLl9ncmFwaCxcbiAgICAgIGZpZWxkcyA9IHRoaXMuX2ZpZWxkc0RlZixcbiAgICAgIGFnZ3MgPSB0aGlzLl9BZ2dyZWdhdG9ycyxcbiAgICAgIGYsIGksIGssIG5hbWUsIG9wcywgbWVhc3VyZXM7XG5cbiAgaWYoYWdncykgcmV0dXJuIGFnZ3M7XG4gIGVsc2UgYWdncyA9IHRoaXMuX0FnZ3JlZ2F0b3JzID0gW107IFxuXG4gIGZvciAoaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcbiAgICBmID0gZmllbGRzW2ldO1xuICAgIGlmIChmLm9wcy5sZW5ndGggPT09IDApIGNvbnRpbnVlO1xuXG4gICAgbmFtZSA9IGYubmFtZS5zaWduYWwgPyBncmFwaC5zaWduYWxSZWYoZi5uYW1lLnNpZ25hbCkgOiBmLm5hbWU7XG4gICAgb3BzICA9IGRsLmFycmF5KGYub3BzLnNpZ25hbCA/IGdyYXBoLnNpZ25hbFJlZihmLm9wcy5zaWduYWwpIDogZi5vcHMpO1xuICAgIG1lYXN1cmVzID0gb3BzLm1hcChmdW5jdGlvbihhKSB7XG4gICAgICBhID0gYS5zaWduYWwgPyBncmFwaC5zaWduYWxSZWYoYS5zaWduYWwpIDogYTtcbiAgICAgIHJldHVybiBtZWFzW2FdKG5hbWUgKyAnXycgKyB0cmFuc2Zvcm0uX291dHB1dFthXSk7XG4gICAgfSk7XG4gICAgYWdncy5wdXNoKHtcbiAgICAgIGFjY2Vzc29yOiBkbC5hY2Nlc3NvcihuYW1lKSxcbiAgICAgIGZpZWxkOiB0aGlzLl9zaW5nbGV0b24gPyBDLlNJTkdMRVRPTiA6IG5hbWUsXG4gICAgICBtZWFzdXJlczogbWVhcy5jcmVhdGUobWVhc3VyZXMpXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gYWdncztcbn07XG5cbnByb3RvLl9yZXNldCA9IGZ1bmN0aW9uKGlucHV0LCBvdXRwdXQpIHtcbiAgdGhpcy5fQWdncmVnYXRvcnMgPSBudWxsOyAvLyByZWJ1aWxkIGFnZ3JlZ2F0b3JzXG4gIHRoaXMuYWdncygpO1xuICByZXR1cm4gR3JvdXBCeS5wcm90b3R5cGUuX3Jlc2V0LmNhbGwodGhpcywgaW5wdXQsIG91dHB1dCk7XG59O1xuXG5wcm90by5fa2V5cyA9IGZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHRoaXMuX2diLmZpZWxkcy5sZW5ndGggPyBcbiAgICBHcm91cEJ5LnByb3RvdHlwZS5fa2V5cy5jYWxsKHRoaXMsIHgpIDoge2tleXM6IFtdLCBrZXk6IFwiXCJ9O1xufTtcblxucHJvdG8uX25ld19jZWxsID0gZnVuY3Rpb24oeCwgaykge1xuICB2YXIgY2VsbCA9IEdyb3VwQnkucHJvdG90eXBlLl9uZXdfY2VsbC5jYWxsKHRoaXMsIHgsIGspLFxuICAgICAgYWdncyA9IHRoaXMuYWdncygpLFxuICAgICAgaSA9IDAsIGxlbiA9IGFnZ3MubGVuZ3RoLCBcbiAgICAgIGFnZztcblxuICBmb3IoOyBpPGxlbjsgaSsrKSB7XG4gICAgYWdnID0gYWdnc1tpXTtcbiAgICBjZWxsW2FnZy5maWVsZF0gPSBuZXcgYWdnLm1lYXN1cmVzKGNlbGwsIGNlbGwudHBsKTtcbiAgfVxuXG4gIHJldHVybiBjZWxsO1xufTtcblxucHJvdG8uX2FkZCA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGMgPSB0aGlzLl9jZWxsKHgpLFxuICAgICAgYWdncyA9IHRoaXMuYWdncygpLFxuICAgICAgaSA9IDAsIGxlbiA9IGFnZ3MubGVuZ3RoLFxuICAgICAgYWdnO1xuXG4gIGMuY250Kys7XG4gIGZvcig7IGk8bGVuOyBpKyspIHtcbiAgICBhZ2cgPSBhZ2dzW2ldO1xuICAgIGNbYWdnLmZpZWxkXS5hZGQoYWdnLmFjY2Vzc29yKHgpKTtcbiAgfVxuICBjLmZsZyB8PSBDLk1PRF9DRUxMO1xufTtcblxucHJvdG8uX3JlbSA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGMgPSB0aGlzLl9jZWxsKHgpLFxuICAgICAgYWdncyA9IHRoaXMuYWdncygpLFxuICAgICAgaSA9IDAsIGxlbiA9IGFnZ3MubGVuZ3RoLFxuICAgICAgYWdnO1xuXG4gIGMuY250LS07XG4gIGZvcig7IGk8bGVuOyBpKyspIHtcbiAgICBhZ2cgPSBhZ2dzW2ldO1xuICAgIGNbYWdnLmZpZWxkXS5yZW0oYWdnLmFjY2Vzc29yKHgpKTtcbiAgfVxuICBjLmZsZyB8PSBDLk1PRF9DRUxMO1xufTtcblxucHJvdG8udHJhbnNmb3JtID0gZnVuY3Rpb24oaW5wdXQsIHJlc2V0KSB7XG4gIGRlYnVnKGlucHV0LCBbXCJhZ2dyZWdhdGVcIl0pO1xuXG4gIHRoaXMuX2diID0gdGhpcy5ncm91cF9ieS5nZXQodGhpcy5fZ3JhcGgpO1xuXG4gIHZhciBvdXRwdXQgPSBHcm91cEJ5LnByb3RvdHlwZS50cmFuc2Zvcm0uY2FsbCh0aGlzLCBpbnB1dCwgcmVzZXQpLFxuICAgICAgYWdncyA9IHRoaXMuYWdncygpLFxuICAgICAgbGVuID0gYWdncy5sZW5ndGgsXG4gICAgICBpLCBrLCBjO1xuXG4gIGZvcihrIGluIHRoaXMuX2NlbGxzKSB7XG4gICAgYyA9IHRoaXMuX2NlbGxzW2tdO1xuICAgIGlmKCFjKSBjb250aW51ZTtcbiAgICBmb3IoaT0wOyBpPGxlbjsgaSsrKSB7XG4gICAgICBjW2FnZ3NbaV0uZmllbGRdLnNldCgpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXRwdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFnZ3JlZ2F0ZTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyk7XG5cbmZ1bmN0aW9uIEJpbihncmFwaCkge1xuICBUcmFuc2Zvcm0ucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICBmaWVsZDoge3R5cGU6IFwiZmllbGRcIn0sXG4gICAgbWluOiB7dHlwZTogXCJ2YWx1ZVwifSxcbiAgICBtYXg6IHt0eXBlOiBcInZhbHVlXCJ9LFxuICAgIHN0ZXA6IHt0eXBlOiBcInZhbHVlXCJ9LFxuICAgIG1heGJpbnM6IHt0eXBlOiBcInZhbHVlXCIsIGRlZmF1bHQ6IDIwfVxuICB9KTtcblxuICB0aGlzLl9vdXRwdXQgPSB7XCJiaW5cIjogXCJiaW5cIn07XG4gIHJldHVybiB0aGlzO1xufVxuXG52YXIgcHJvdG8gPSAoQmluLnByb3RvdHlwZSA9IG5ldyBUcmFuc2Zvcm0oKSk7XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciB0cmFuc2Zvcm0gPSB0aGlzLFxuICAgICAgb3V0cHV0ID0gdGhpcy5fb3V0cHV0LmJpbjtcbiAgICAgIFxuICB2YXIgYiA9IGRsLmJpbih7XG4gICAgbWluOiB0aGlzLm1pbi5nZXQoKSxcbiAgICBtYXg6IHRoaXMubWF4LmdldCgpLFxuICAgIHN0ZXA6IHRoaXMuc3RlcC5nZXQoKSxcbiAgICBtYXhiaW5zOiB0aGlzLm1heGJpbnMuZ2V0KClcbiAgfSk7XG5cbiAgZnVuY3Rpb24gdXBkYXRlKGQpIHtcbiAgICB2YXIgdiA9IHRyYW5zZm9ybS5maWVsZC5nZXQoKS5hY2Nlc3NvcihkKTtcbiAgICB2ID0gdiA9PSBudWxsID8gbnVsbFxuICAgICAgOiBiLnN0YXJ0ICsgYi5zdGVwICogfn4oKHYgLSBiLnN0YXJ0KSAvIGIuc3RlcCk7XG4gICAgdHVwbGUuc2V0KGQsIG91dHB1dCwgdiwgaW5wdXQuc3RhbXApO1xuICB9XG4gIGlucHV0LmFkZC5mb3JFYWNoKHVwZGF0ZSk7XG4gIGlucHV0Lm1vZC5mb3JFYWNoKHVwZGF0ZSk7XG4gIGlucHV0LnJlbS5mb3JFYWNoKHVwZGF0ZSk7XG5cbiAgcmV0dXJuIGlucHV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCaW47IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgQ29sbGVjdG9yID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvQ29sbGVjdG9yJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpO1xuXG5mdW5jdGlvbiBDcm9zcyhncmFwaCkge1xuICBUcmFuc2Zvcm0ucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICB3aXRoOiB7dHlwZTogXCJkYXRhXCJ9LFxuICAgIGRpYWdvbmFsOiB7dHlwZTogXCJ2YWx1ZVwiLCBkZWZhdWx0OiBcInRydWVcIn1cbiAgfSk7XG5cbiAgdGhpcy5fb3V0cHV0ID0ge1wibGVmdFwiOiBcImFcIiwgXCJyaWdodFwiOiBcImJcIn07XG4gIHRoaXMuX2NvbGxlY3RvciA9IG5ldyBDb2xsZWN0b3IoZ3JhcGgpO1xuICB0aGlzLl9sYXN0UmVtICA9IG51bGw7IC8vIE1vc3QgcmVjZW50IHN0YW1wIHRoYXQgcmVtIG9jY3VyZWQuIFxuICB0aGlzLl9sYXN0V2l0aCA9IG51bGw7IC8vIExhc3QgdGltZSB3ZSBjcm9zc2VkIHcvd2l0aGRzLlxuICB0aGlzLl9pZHMgICA9IHt9O1xuICB0aGlzLl9jYWNoZSA9IHt9O1xuXG4gIHJldHVybiB0aGlzLnJvdXRlcih0cnVlKTtcbn1cblxudmFyIHByb3RvID0gKENyb3NzLnByb3RvdHlwZSA9IG5ldyBUcmFuc2Zvcm0oKSk7XG5cbi8vIEVhY2ggY2FjaGVkIGluY29taW5nIHR1cGxlIGFsc28gaGFzIGEgc3RhbXAgdG8gdHJhY2sgaWYgd2UgbmVlZCB0byBkb1xuLy8gbGF6eSBmaWx0ZXJpbmcgb2YgcmVtb3ZlZCB0dXBsZXMuXG5mdW5jdGlvbiBjYWNoZSh4LCB0KSB7XG4gIHZhciBjID0gdGhpcy5fY2FjaGVbeC5faWRdID0gdGhpcy5fY2FjaGVbeC5faWRdIHx8IHtjOiBbXSwgczogdGhpcy5fc3RhbXB9O1xuICBjLmMucHVzaCh0KTtcbn1cblxuZnVuY3Rpb24gYWRkKG91dHB1dCwgbGVmdCwgd2RhdGEsIGRpYWcsIHgpIHtcbiAgdmFyIGRhdGEgPSBsZWZ0ID8gd2RhdGEgOiB0aGlzLl9jb2xsZWN0b3IuZGF0YSgpLCAvLyBMZWZ0IHR1cGxlcyBjcm9zcyB3L3JpZ2h0LlxuICAgICAgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoLFxuICAgICAgcHJldiAgPSB4Ll9wcmV2ICE9PSB1bmRlZmluZWQgPyBudWxsIDogdW5kZWZpbmVkLCBcbiAgICAgIHQsIHksIGlkO1xuXG4gIGZvcig7IGk8bGVuOyArK2kpIHtcbiAgICB5ID0gZGF0YVtpXTtcbiAgICBpZCA9IGxlZnQgPyB4Ll9pZCtcIl9cIit5Ll9pZCA6IHkuX2lkK1wiX1wiK3guX2lkO1xuICAgIGlmKHRoaXMuX2lkc1tpZF0pIGNvbnRpbnVlO1xuICAgIGlmKHguX2lkID09IHkuX2lkICYmICFkaWFnKSBjb250aW51ZTtcblxuICAgIHQgPSB0dXBsZS5pbmdlc3Qoe30sIHByZXYpO1xuICAgIHRbdGhpcy5fb3V0cHV0LmxlZnRdICA9IGxlZnQgPyB4IDogeTtcbiAgICB0W3RoaXMuX291dHB1dC5yaWdodF0gPSBsZWZ0ID8geSA6IHg7XG4gICAgb3V0cHV0LmFkZC5wdXNoKHQpO1xuICAgIGNhY2hlLmNhbGwodGhpcywgeCwgdCk7XG4gICAgY2FjaGUuY2FsbCh0aGlzLCB5LCB0KTtcbiAgICB0aGlzLl9pZHNbaWRdID0gMTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtb2Qob3V0cHV0LCBsZWZ0LCB4KSB7XG4gIHZhciBjcm9zcyA9IHRoaXMsXG4gICAgICBjID0gdGhpcy5fY2FjaGVbeC5faWRdO1xuXG4gIGlmKHRoaXMuX2xhc3RSZW0gPiBjLnMpIHsgIC8vIFJlbW92ZWQgdHVwbGVzIGhhdmVuJ3QgYmVlbiBmaWx0ZXJlZCB5ZXRcbiAgICBjLmMgPSBjLmMuZmlsdGVyKGZ1bmN0aW9uKHkpIHtcbiAgICAgIHZhciB0ID0geVtjcm9zcy5fb3V0cHV0W2xlZnQgPyBcInJpZ2h0XCIgOiBcImxlZnRcIl1dO1xuICAgICAgcmV0dXJuIGNyb3NzLl9jYWNoZVt0Ll9pZF0gIT09IG51bGw7XG4gICAgfSk7XG4gICAgYy5zID0gdGhpcy5fbGFzdFJlbTtcbiAgfVxuXG4gIG91dHB1dC5tb2QucHVzaC5hcHBseShvdXRwdXQubW9kLCBjLmMpO1xufVxuXG5mdW5jdGlvbiByZW0ob3V0cHV0LCB4KSB7XG4gIG91dHB1dC5yZW0ucHVzaC5hcHBseShvdXRwdXQucmVtLCB0aGlzLl9jYWNoZVt4Ll9pZF0uYyk7XG4gIHRoaXMuX2NhY2hlW3guX2lkXSA9IG51bGw7XG4gIHRoaXMuX2xhc3RSZW0gPSB0aGlzLl9zdGFtcDtcbn1cblxuZnVuY3Rpb24gdXBGaWVsZHMoaW5wdXQsIG91dHB1dCkge1xuICBpZihpbnB1dC5hZGQubGVuZ3RoIHx8IGlucHV0LnJlbS5sZW5ndGgpIHtcbiAgICBvdXRwdXQuZmllbGRzW3RoaXMuX291dHB1dC5sZWZ0XSAgPSAxOyBcbiAgICBvdXRwdXQuZmllbGRzW3RoaXMuX291dHB1dC5yaWdodF0gPSAxO1xuICB9XG59XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGRlYnVnKGlucHV0LCBbXCJjcm9zc2luZ1wiXSk7XG5cbiAgLy8gTWF0ZXJpYWxpemUgdGhlIGN1cnJlbnQgZGF0YXNvdXJjZS4gVE9ETzogc2hhcmUgY29sbGVjdG9yc1xuICB0aGlzLl9jb2xsZWN0b3IuZXZhbHVhdGUoaW5wdXQpO1xuXG4gIHZhciB3ID0gdGhpcy53aXRoLmdldCh0aGlzLl9ncmFwaCksXG4gICAgICBkaWFnID0gdGhpcy5kaWFnb25hbC5nZXQodGhpcy5fZ3JhcGgpLFxuICAgICAgc2VsZkNyb3NzID0gKCF3Lm5hbWUpLFxuICAgICAgZGF0YSA9IHRoaXMuX2NvbGxlY3Rvci5kYXRhKCksXG4gICAgICB3b3V0cHV0ID0gc2VsZkNyb3NzID8gaW5wdXQgOiB3LnNvdXJjZS5sYXN0KCksXG4gICAgICB3ZGF0YSAgID0gc2VsZkNyb3NzID8gZGF0YSA6IHcuc291cmNlLnZhbHVlcygpLFxuICAgICAgb3V0cHV0ICA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpLFxuICAgICAgciA9IHJlbS5iaW5kKHRoaXMsIG91dHB1dCk7IFxuXG4gIGlucHV0LnJlbS5mb3JFYWNoKHIpO1xuICBpbnB1dC5hZGQuZm9yRWFjaChhZGQuYmluZCh0aGlzLCBvdXRwdXQsIHRydWUsIHdkYXRhLCBkaWFnKSk7XG5cbiAgaWYoIXNlbGZDcm9zcyAmJiB3b3V0cHV0LnN0YW1wID4gdGhpcy5fbGFzdFdpdGgpIHtcbiAgICB3b3V0cHV0LnJlbS5mb3JFYWNoKHIpO1xuICAgIHdvdXRwdXQuYWRkLmZvckVhY2goYWRkLmJpbmQodGhpcywgb3V0cHV0LCBmYWxzZSwgZGF0YSwgZGlhZykpO1xuICAgIHdvdXRwdXQubW9kLmZvckVhY2gobW9kLmJpbmQodGhpcywgb3V0cHV0LCBmYWxzZSkpO1xuICAgIHVwRmllbGRzLmNhbGwodGhpcywgd291dHB1dCwgb3V0cHV0KTtcbiAgICB0aGlzLl9sYXN0V2l0aCA9IHdvdXRwdXQuc3RhbXA7XG4gIH1cblxuICAvLyBNb2RzIG5lZWQgdG8gY29tZSBhZnRlciBhbGwgcmVtb3ZhbHMgaGF2ZSBiZWVuIHJ1bi5cbiAgaW5wdXQubW9kLmZvckVhY2gobW9kLmJpbmQodGhpcywgb3V0cHV0LCB0cnVlKSk7XG4gIHVwRmllbGRzLmNhbGwodGhpcywgaW5wdXQsIG91dHB1dCk7XG5cbiAgcmV0dXJuIG91dHB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ3Jvc3M7IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgR3JvdXBCeSA9IHJlcXVpcmUoJy4vR3JvdXBCeScpLFxuICAgIHR1cGxlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvdHVwbGUnKSwgXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0JyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIEZhY2V0KGdyYXBoKSB7XG4gIEdyb3VwQnkucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtrZXlzOiB7dHlwZTogXCJhcnJheTxmaWVsZD5cIn0gfSk7XG5cbiAgdGhpcy5fcGlwZWxpbmUgPSBbXTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbnZhciBwcm90byA9IChGYWNldC5wcm90b3R5cGUgPSBuZXcgR3JvdXBCeSgpKTtcblxucHJvdG8ucGlwZWxpbmUgPSBmdW5jdGlvbihwaXBlbGluZSkge1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3BpcGVsaW5lO1xuICB0aGlzLl9waXBlbGluZSA9IHBpcGVsaW5lO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLl9yZXNldCA9IGZ1bmN0aW9uKGlucHV0LCBvdXRwdXQpIHtcbiAgdmFyIGssIGM7XG4gIGZvcihrIGluIHRoaXMuX2NlbGxzKSB7XG4gICAgYyA9IHRoaXMuX2NlbGxzW2tdO1xuICAgIGlmKCFjKSBjb250aW51ZTtcbiAgICBvdXRwdXQucmVtLnB1c2goYy50cGwpO1xuICAgIGMuZGVsZXRlKCk7XG4gIH1cbiAgdGhpcy5fY2VsbHMgPSB7fTtcbn07XG5cbnByb3RvLl9uZXdfdHVwbGUgPSBmdW5jdGlvbih4LCBrKSB7XG4gIHJldHVybiB0dXBsZS5pbmdlc3QoaywgbnVsbCk7XG59O1xuXG5wcm90by5fbmV3X2NlbGwgPSBmdW5jdGlvbih4LCBrKSB7XG4gIC8vIFJhdGhlciB0aGFuIHNoYXJpbmcgdGhlIHBpcGVsaW5lIGJldHdlZW4gYWxsIG5vZGVzLFxuICAvLyBnaXZlIGVhY2ggY2VsbCBpdHMgaW5kaXZpZHVhbCBwaXBlbGluZS4gVGhpcyBhbGxvd3NcbiAgLy8gZHluYW1pY2FsbHkgYWRkZWQgY29sbGVjdG9ycyB0byBkbyB0aGUgcmlnaHQgdGhpbmdcbiAgLy8gd2hlbiB3aXJpbmcgdXAgdGhlIHBpcGVsaW5lcy5cbiAgdmFyIGNlbGwgPSBHcm91cEJ5LnByb3RvdHlwZS5fbmV3X2NlbGwuY2FsbCh0aGlzLCB4LCBrKSxcbiAgICAgIHBpcGVsaW5lID0gdGhpcy5fcGlwZWxpbmUubWFwKGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG4uY2xvbmUoKTsgfSksXG4gICAgICBmYWNldCA9IHRoaXMsXG4gICAgICB0ID0gY2VsbC50cGw7XG5cbiAgY2VsbC5kcyA9IHRoaXMuX2dyYXBoLmRhdGEoXCJ2Z19cIit0Ll9pZCwgcGlwZWxpbmUsIHQpO1xuICBjZWxsLmRlbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGRlYnVnKHt9LCBbXCJkZWxldGluZyBjZWxsXCIsIGsua2V5XSk7XG4gICAgZmFjZXQucmVtb3ZlTGlzdGVuZXIocGlwZWxpbmVbMF0pO1xuICAgIGZhY2V0Ll9ncmFwaC5kaXNjb25uZWN0KHBpcGVsaW5lKTtcbiAgfTtcblxuICB0aGlzLmFkZExpc3RlbmVyKHBpcGVsaW5lWzBdKTtcblxuICByZXR1cm4gY2VsbDtcbn07XG5cbnByb3RvLl9hZGQgPSBmdW5jdGlvbih4KSB7XG4gIHZhciBjZWxsID0gR3JvdXBCeS5wcm90b3R5cGUuX2FkZC5jYWxsKHRoaXMsIHgpO1xuICBjZWxsLmRzLl9pbnB1dC5hZGQucHVzaCh4KTtcbiAgcmV0dXJuIGNlbGw7XG59O1xuXG5wcm90by5fbW9kID0gZnVuY3Rpb24oeCwgcmVzZXQpIHtcbiAgdmFyIGNlbGwgPSBHcm91cEJ5LnByb3RvdHlwZS5fbW9kLmNhbGwodGhpcywgeCwgcmVzZXQpO1xuICBpZighKGNlbGwuZmxnICYgQy5BRERfQ0VMTCkpIGNlbGwuZHMuX2lucHV0Lm1vZC5wdXNoKHgpOyAvLyBQcm9wYWdhdGUgdHVwbGVzXG4gIGNlbGwuZmxnIHw9IEMuTU9EX0NFTEw7XG4gIHJldHVybiBjZWxsO1xufTtcblxucHJvdG8uX3JlbSA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGNlbGwgPSBHcm91cEJ5LnByb3RvdHlwZS5fcmVtLmNhbGwodGhpcywgeCk7XG4gIGNlbGwuZHMuX2lucHV0LnJlbS5wdXNoKHgpO1xuICByZXR1cm4gY2VsbDtcbn07XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0LCByZXNldCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wiZmFjZXRpbmdcIl0pO1xuXG4gIHRoaXMuX2diID0gdGhpcy5rZXlzLmdldCh0aGlzLl9ncmFwaCk7XG5cbiAgdmFyIG91dHB1dCA9IEdyb3VwQnkucHJvdG90eXBlLnRyYW5zZm9ybS5jYWxsKHRoaXMsIGlucHV0LCByZXNldCksXG4gICAgICBrLCBjO1xuXG4gIGZvcihrIGluIHRoaXMuX2NlbGxzKSB7XG4gICAgYyA9IHRoaXMuX2NlbGxzW2tdO1xuICAgIGlmKGMgPT0gbnVsbCkgY29udGludWU7XG4gICAgaWYoYy5jbnQgPT09IDApIHtcbiAgICAgIGMuZGVsZXRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHByb3BhZ2F0ZSBzb3J0LCBzaWduYWxzLCBmaWVsZHMsIGV0Yy5cbiAgICAgIGNoYW5nZXNldC5jb3B5KGlucHV0LCBjLmRzLl9pbnB1dCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dHB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRmFjZXQ7IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0JyksIFxuICAgIGV4cHIgPSByZXF1aXJlKCcuLi9wYXJzZS9leHByJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIEZpbHRlcihncmFwaCkge1xuICBUcmFuc2Zvcm0ucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHt0ZXN0OiB7dHlwZTogXCJleHByXCJ9IH0pO1xuXG4gIHRoaXMuX3NraXAgPSB7fTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbnZhciBwcm90byA9IChGaWx0ZXIucHJvdG90eXBlID0gbmV3IFRyYW5zZm9ybSgpKTtcblxuZnVuY3Rpb24gdGVzdCh4KSB7XG4gIHJldHVybiBleHByLmV2YWwodGhpcy5fZ3JhcGgsIHRoaXMudGVzdC5nZXQodGhpcy5fZ3JhcGgpLCBcbiAgICB4LCBudWxsLCBudWxsLCBudWxsLCB0aGlzLmRlcGVuZGVuY3koQy5TSUdOQUxTKSk7XG59O1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wiZmlsdGVyaW5nXCJdKTtcbiAgdmFyIG91dHB1dCA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpLFxuICAgICAgc2tpcCA9IHRoaXMuX3NraXAsXG4gICAgICBmID0gdGhpcztcblxuICBpbnB1dC5yZW0uZm9yRWFjaChmdW5jdGlvbih4KSB7XG4gICAgaWYgKHNraXBbeC5faWRdICE9PSAxKSBvdXRwdXQucmVtLnB1c2goeCk7XG4gICAgZWxzZSBza2lwW3guX2lkXSA9IDA7XG4gIH0pO1xuXG4gIGlucHV0LmFkZC5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAodGVzdC5jYWxsKGYsIHgpKSBvdXRwdXQuYWRkLnB1c2goeCk7XG4gICAgZWxzZSBza2lwW3guX2lkXSA9IDE7XG4gIH0pO1xuXG4gIGlucHV0Lm1vZC5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcbiAgICB2YXIgYiA9IHRlc3QuY2FsbChmLCB4KSxcbiAgICAgICAgcyA9IChza2lwW3guX2lkXSA9PT0gMSk7XG4gICAgaWYgKGIgJiYgcykge1xuICAgICAgc2tpcFt4Ll9pZF0gPSAwO1xuICAgICAgb3V0cHV0LmFkZC5wdXNoKHgpO1xuICAgIH0gZWxzZSBpZiAoYiAmJiAhcykge1xuICAgICAgb3V0cHV0Lm1vZC5wdXNoKHgpO1xuICAgIH0gZWxzZSBpZiAoIWIgJiYgcykge1xuICAgICAgLy8gZG8gbm90aGluZywga2VlcCBza2lwIHRydWVcbiAgICB9IGVsc2UgeyAvLyAhYiAmJiAhc1xuICAgICAgb3V0cHV0LnJlbS5wdXNoKHgpO1xuICAgICAgc2tpcFt4Ll9pZF0gPSAxO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG91dHB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsdGVyOyIsInZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpLCBcbiAgICB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyksIFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpO1xuXG5mdW5jdGlvbiBGb2xkKGdyYXBoKSB7XG4gIFRyYW5zZm9ybS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgVHJhbnNmb3JtLmFkZFBhcmFtZXRlcnModGhpcywge1xuICAgIGZpZWxkczoge3R5cGU6IFwiYXJyYXk8ZmllbGQ+XCJ9IFxuICB9KTtcblxuICB0aGlzLl9vdXRwdXQgPSB7a2V5OiBcImtleVwiLCB2YWx1ZTogXCJ2YWx1ZVwifTtcbiAgdGhpcy5fY2FjaGUgPSB7fTtcblxuICByZXR1cm4gdGhpcy5yb3V0ZXIodHJ1ZSkucmV2aXNlcyh0cnVlKTtcbn1cblxudmFyIHByb3RvID0gKEZvbGQucHJvdG90eXBlID0gbmV3IFRyYW5zZm9ybSgpKTtcblxuZnVuY3Rpb24gcnN0KGlucHV0LCBvdXRwdXQpIHsgXG4gIGZvcih2YXIgaWQgaW4gdGhpcy5fY2FjaGUpIG91dHB1dC5yZW0ucHVzaC5hcHBseShvdXRwdXQucmVtLCB0aGlzLl9jYWNoZVtpZF0pO1xuICB0aGlzLl9jYWNoZSA9IHt9O1xufTtcblxuZnVuY3Rpb24gZ2V0X3R1cGxlKHgsIGksIGxlbikge1xuICB2YXIgbGlzdCA9IHRoaXMuX2NhY2hlW3guX2lkXSB8fCAodGhpcy5fY2FjaGVbeC5faWRdID0gQXJyYXkobGVuKSk7XG4gIHJldHVybiBsaXN0W2ldIHx8IChsaXN0W2ldID0gdHVwbGUuZGVyaXZlKHgsIHguX3ByZXYpKTtcbn07XG5cbmZ1bmN0aW9uIGZuKGRhdGEsIGZpZWxkcywgYWNjZXNzb3JzLCBvdXQsIHN0YW1wKSB7XG4gIHZhciBpID0gMCwgZGxlbiA9IGRhdGEubGVuZ3RoLFxuICAgICAgaiwgZmxlbiA9IGZpZWxkcy5sZW5ndGgsXG4gICAgICBkLCB0O1xuXG4gIGZvcig7IGk8ZGxlbjsgKytpKSB7XG4gICAgZCA9IGRhdGFbaV07XG4gICAgZm9yKGo9MDsgajxmbGVuOyArK2opIHtcbiAgICAgIHQgPSBnZXRfdHVwbGUuY2FsbCh0aGlzLCBkLCBqLCBmbGVuKTsgIFxuICAgICAgdHVwbGUuc2V0KHQsIHRoaXMuX291dHB1dC5rZXksIGZpZWxkc1tqXSk7XG4gICAgICB0dXBsZS5zZXQodCwgdGhpcy5fb3V0cHV0LnZhbHVlLCBhY2Nlc3NvcnNbal0oZCkpO1xuICAgICAgb3V0LnB1c2godCk7XG4gICAgfSAgICAgIFxuICB9XG59O1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCwgcmVzZXQpIHtcbiAgZGVidWcoaW5wdXQsIFtcImZvbGRpbmdcIl0pO1xuXG4gIHZhciBmb2xkID0gdGhpcyxcbiAgICAgIG9uID0gdGhpcy5maWVsZHMuZ2V0KHRoaXMuX2dyYXBoKSxcbiAgICAgIGZpZWxkcyA9IG9uLmZpZWxkcywgYWNjZXNzb3JzID0gb24uYWNjZXNzb3JzLFxuICAgICAgb3V0cHV0ID0gY2hhbmdlc2V0LmNyZWF0ZShpbnB1dCk7XG5cbiAgaWYocmVzZXQpIHJzdC5jYWxsKHRoaXMsIGlucHV0LCBvdXRwdXQpO1xuXG4gIGZuLmNhbGwodGhpcywgaW5wdXQuYWRkLCBmaWVsZHMsIGFjY2Vzc29ycywgb3V0cHV0LmFkZCwgaW5wdXQuc3RhbXApO1xuICBmbi5jYWxsKHRoaXMsIGlucHV0Lm1vZCwgZmllbGRzLCBhY2Nlc3NvcnMsIHJlc2V0ID8gb3V0cHV0LmFkZCA6IG91dHB1dC5tb2QsIGlucHV0LnN0YW1wKTtcbiAgaW5wdXQucmVtLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgIG91dHB1dC5yZW0ucHVzaC5hcHBseShvdXRwdXQucmVtLCBmb2xkLl9jYWNoZVt4Ll9pZF0pO1xuICAgIGZvbGQuX2NhY2hlW3guX2lkXSA9IG51bGw7XG4gIH0pO1xuXG4gIC8vIElmIHdlJ3JlIG9ubHkgcHJvcGFnYXRpbmcgdmFsdWVzLCBkb24ndCBtYXJrIGtleS92YWx1ZSBhcyB1cGRhdGVkLlxuICBpZihpbnB1dC5hZGQubGVuZ3RoIHx8IGlucHV0LnJlbS5sZW5ndGggfHwgXG4gICAgZmllbGRzLnNvbWUoZnVuY3Rpb24oZikgeyByZXR1cm4gISFpbnB1dC5maWVsZHNbZl07IH0pKVxuICAgICAgb3V0cHV0LmZpZWxkc1t0aGlzLl9vdXRwdXQua2V5XSA9IDEsIG91dHB1dC5maWVsZHNbdGhpcy5fb3V0cHV0LnZhbHVlXSA9IDE7XG4gIHJldHVybiBvdXRwdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvbGQ7IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgQ29sbGVjdG9yID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvQ29sbGVjdG9yJyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpLFxuICAgIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCk7XG5cbmZ1bmN0aW9uIEZvcmNlKGdyYXBoKSB7XG4gIFRyYW5zZm9ybS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgVHJhbnNmb3JtLmFkZFBhcmFtZXRlcnModGhpcywge1xuICAgIHNpemU6IHt0eXBlOiBcImFycmF5PHZhbHVlPlwiLCBkZWZhdWx0OiBbNTAwLCA1MDBdfSxcbiAgICBsaW5rczoge3R5cGU6IFwiZGF0YVwifSxcbiAgICBsaW5rRGlzdGFuY2U6IHt0eXBlOiBcImZpZWxkXCIsIGRlZmF1bHQ6IDIwfSxcbiAgICBsaW5rU3RyZW5ndGg6IHt0eXBlOiBcImZpZWxkXCIsIGRlZmF1bHQ6IDF9LFxuICAgIGNoYXJnZToge3R5cGU6IFwiZmllbGRcIiwgZGVmYXVsdDogMzB9LFxuICAgIGNoYXJnZURpc3RhbmNlOiB7dHlwZTogXCJmaWVsZFwiLCBkZWZhdWx0OiBJbmZpbml0eX0sXG4gICAgaXRlcmF0aW9uczoge3R5cGU6IFwidmFsdWVcIiwgZGVmYXVsdDogNTAwfSxcbiAgICBmcmljdGlvbjoge3R5cGU6IFwidmFsdWVcIiwgZGVmYXVsdDogMC45fSxcbiAgICB0aGV0YToge3R5cGU6IFwidmFsdWVcIiwgZGVmYXVsdDogMC44fSxcbiAgICBncmF2aXR5OiB7dHlwZTogXCJ2YWx1ZVwiLCBkZWZhdWx0OiAwLjF9LFxuICAgIGFscGhhOiB7dHlwZTogXCJ2YWx1ZVwiLCBkZWZhdWx0OiAwLjF9XG4gIH0pO1xuXG4gIHRoaXMuX25vZGVzID0gW107XG4gIHRoaXMuX2xpbmtzID0gW107XG4gIHRoaXMuX2xheW91dCA9IGQzLmxheW91dC5mb3JjZSgpO1xuXG4gIHRoaXMuX291dHB1dCA9IHtcbiAgICBcInhcIjogXCJsYXlvdXQ6eFwiLFxuICAgIFwieVwiOiBcImxheW91dDp5XCIsXG4gICAgXCJzb3VyY2VcIjogXCJfc291cmNlXCIsXG4gICAgXCJ0YXJnZXRcIjogXCJfdGFyZ2V0XCJcbiAgfTtcblxuICByZXR1cm4gdGhpcztcbn1cblxudmFyIHByb3RvID0gKEZvcmNlLnByb3RvdHlwZSA9IG5ldyBUcmFuc2Zvcm0oKSk7XG5cbmZ1bmN0aW9uIGdldCh0cmFuc2Zvcm0sIG5hbWUpIHtcbiAgdmFyIHYgPSB0cmFuc2Zvcm1bbmFtZV0uZ2V0KHRyYW5zZm9ybS5fZ3JhcGgpO1xuICByZXR1cm4gdi5hY2Nlc3NvclxuICAgID8gZnVuY3Rpb24oeCkgeyByZXR1cm4gdi5hY2Nlc3Nvcih4LnR1cGxlKTsgfVxuICAgIDogdi5maWVsZDtcbn1cblxucHJvdG8udHJhbnNmb3JtID0gZnVuY3Rpb24obm9kZUlucHV0KSB7XG4gIC8vIGdldCB2YXJpYWJsZXNcbiAgdmFyIGcgPSB0aGlzLl9ncmFwaCxcbiAgICAgIGxpbmtJbnB1dCA9IHRoaXMubGlua3MuZ2V0KGcpLnNvdXJjZS5sYXN0KCksXG4gICAgICBsYXlvdXQgPSB0aGlzLl9sYXlvdXQsXG4gICAgICBvdXRwdXQgPSB0aGlzLl9vdXRwdXQsXG4gICAgICBub2RlcyA9IHRoaXMuX25vZGVzLFxuICAgICAgbGlua3MgPSB0aGlzLl9saW5rcyxcbiAgICAgIGl0ZXIgPSB0aGlzLml0ZXJhdGlvbnMuZ2V0KGcpO1xuXG4gIC8vIHByb2Nlc3MgYWRkZWQgbm9kZXNcbiAgbm9kZUlucHV0LmFkZC5mb3JFYWNoKGZ1bmN0aW9uKG4pIHtcbiAgICBub2Rlcy5wdXNoKHt0dXBsZTogbn0pO1xuICB9KTtcblxuICAvLyBwcm9jZXNzIGFkZGVkIGVkZ2VzXG4gIGxpbmtJbnB1dC5hZGQuZm9yRWFjaChmdW5jdGlvbihsKSB7XG4gICAgdmFyIGxpbmsgPSB7XG4gICAgICB0dXBsZTogbCxcbiAgICAgIHNvdXJjZTogbm9kZXNbbC5zb3VyY2VdLFxuICAgICAgdGFyZ2V0OiBub2Rlc1tsLnRhcmdldF1cbiAgICB9O1xuICAgIHR1cGxlLnNldChsLCBvdXRwdXQuc291cmNlLCBsaW5rLnNvdXJjZS50dXBsZSk7XG4gICAgdHVwbGUuc2V0KGwsIG91dHB1dC50YXJnZXQsIGxpbmsudGFyZ2V0LnR1cGxlKTtcbiAgICBsaW5rcy5wdXNoKGxpbmspO1xuICB9KTtcblxuICAvLyBUT0RPIHByb2Nlc3MgXCJtb2RcIiBvZiBlZGdlIHNvdXJjZSBvciB0YXJnZXQ/XG5cbiAgLy8gY29uZmlndXJlIGxheW91dFxuICBsYXlvdXRcbiAgICAuc2l6ZSh0aGlzLnNpemUuZ2V0KGcpKVxuICAgIC5saW5rRGlzdGFuY2UoZ2V0KHRoaXMsIFwibGlua0Rpc3RhbmNlXCIpKVxuICAgIC5saW5rU3RyZW5ndGgoZ2V0KHRoaXMsIFwibGlua1N0cmVuZ3RoXCIpKVxuICAgIC5jaGFyZ2UoZ2V0KHRoaXMsIFwiY2hhcmdlXCIpKVxuICAgIC5jaGFyZ2VEaXN0YW5jZShnZXQodGhpcywgXCJjaGFyZ2VEaXN0YW5jZVwiKSlcbiAgICAuZnJpY3Rpb24odGhpcy5mcmljdGlvbi5nZXQoZykpXG4gICAgLnRoZXRhKHRoaXMudGhldGEuZ2V0KGcpKVxuICAgIC5ncmF2aXR5KHRoaXMuZ3Jhdml0eS5nZXQoZykpXG4gICAgLmFscGhhKHRoaXMuYWxwaGEuZ2V0KGcpKVxuICAgIC5ub2Rlcyhub2RlcylcbiAgICAubGlua3MobGlua3MpO1xuXG4gIC8vIHJ1biBsYXlvdXRcbiAgbGF5b3V0LnN0YXJ0KCk7XG4gIGZvciAodmFyIGk9MDsgaTxpdGVyOyArK2kpIHtcbiAgICBsYXlvdXQudGljaygpO1xuICB9XG4gIGxheW91dC5zdG9wKCk7XG5cbiAgLy8gY29weSBsYXlvdXQgdmFsdWVzIHRvIG5vZGVzXG4gIG5vZGVzLmZvckVhY2goZnVuY3Rpb24obikge1xuICAgIHR1cGxlLnNldChuLnR1cGxlLCBvdXRwdXQueCwgbi54KTtcbiAgICB0dXBsZS5zZXQobi50dXBsZSwgb3V0cHV0LnksIG4ueSk7XG4gIH0pO1xuXG4gIC8vIHByb2Nlc3MgcmVtb3ZlZCBub2Rlc1xuICBpZiAobm9kZUlucHV0LnJlbS5sZW5ndGggPiAwKSB7XG4gICAgdmFyIG5vZGVJZHMgPSB0dXBsZS5pZE1hcChub2RlSW5wdXQucmVtKTtcbiAgICB0aGlzLl9ub2RlcyA9IG5vZGVzLmZpbHRlcihmdW5jdGlvbihuKSB7IHJldHVybiAhbm9kZUlkc1tuLnR1cGxlLl9pZF07IH0pO1xuICB9XG5cbiAgLy8gcHJvY2VzcyByZW1vdmVkIGVkZ2VzXG4gIGlmIChsaW5rSW5wdXQucmVtLmxlbmd0aCA+IDApIHtcbiAgICB2YXIgbGlua0lkcyA9IHR1cGxlLmlkTWFwKGxpbmtJbnB1dC5yZW0pO1xuICAgIHRoaXMuX2xpbmtzID0gbGlua3MuZmlsdGVyKGZ1bmN0aW9uKGwpIHsgcmV0dXJuICFsaW5rSWRzW2wudHVwbGUuX2lkXTsgfSk7XG4gIH1cblxuICAvLyByZXR1cm4gY2hhbmdlc2V0XG4gIG5vZGVJbnB1dC5maWVsZHNbb3V0cHV0LnhdID0gMTtcbiAgbm9kZUlucHV0LmZpZWxkc1tvdXRwdXQueV0gPSAxO1xuICByZXR1cm4gbm9kZUlucHV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb3JjZTsiLCJ2YXIgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyksIFxuICAgIGV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi9wYXJzZS9leHByJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIEZvcm11bGEoZ3JhcGgpIHtcbiAgVHJhbnNmb3JtLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgZ3JhcGgpO1xuICBUcmFuc2Zvcm0uYWRkUGFyYW1ldGVycyh0aGlzLCB7XG4gICAgZmllbGQ6IHt0eXBlOiBcInZhbHVlXCJ9LFxuICAgIGV4cHI6ICB7dHlwZTogXCJleHByXCJ9XG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufVxuXG52YXIgcHJvdG8gPSAoRm9ybXVsYS5wcm90b3R5cGUgPSBuZXcgVHJhbnNmb3JtKCkpO1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wiZm9ybXVsYXRpbmdcIl0pO1xuICB2YXIgdCA9IHRoaXMsIFxuICAgICAgZyA9IHRoaXMuX2dyYXBoLFxuICAgICAgZmllbGQgPSB0aGlzLmZpZWxkLmdldChnKSxcbiAgICAgIGV4cHIgPSB0aGlzLmV4cHIuZ2V0KGcpLFxuICAgICAgZGVwcyA9IHRoaXMuZGVwZW5kZW5jeShDLlNJR05BTFMpO1xuICBcbiAgZnVuY3Rpb24gc2V0KHgpIHtcbiAgICB2YXIgdmFsID0gZXhwcmVzc2lvbi5ldmFsKGcsIGV4cHIsIHgsIG51bGwsIG51bGwsIG51bGwsIGRlcHMpO1xuICAgIHR1cGxlLnNldCh4LCBmaWVsZCwgdmFsKTtcbiAgfVxuXG4gIGlucHV0LmFkZC5mb3JFYWNoKHNldCk7XG4gIFxuICBpZiAodGhpcy5yZWV2YWx1YXRlKGlucHV0KSkge1xuICAgIGlucHV0Lm1vZC5mb3JFYWNoKHNldCk7XG4gIH1cblxuICBpbnB1dC5maWVsZHNbZmllbGRdID0gMTtcbiAgcmV0dXJuIGlucHV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb3JtdWxhOyIsInZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxuICAgIHR1cGxlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvdHVwbGUnKSxcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9jaGFuZ2VzZXQnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gR3JvdXBCeShncmFwaCkge1xuICBpZihncmFwaCkgdGhpcy5pbml0KGdyYXBoKTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbnZhciBwcm90byA9IChHcm91cEJ5LnByb3RvdHlwZSA9IG5ldyBUcmFuc2Zvcm0oKSk7XG5cbnByb3RvLmluaXQgPSBmdW5jdGlvbihncmFwaCkge1xuICB0aGlzLl9nYiA9IG51bGw7IC8vIGZpZWxkcythY2Nlc3NvcnMgdG8gZ3JvdXBieSBmaWVsZHNcbiAgdGhpcy5fY2VsbHMgPSB7fTtcbiAgcmV0dXJuIFRyYW5zZm9ybS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKVxuICAgIC5yb3V0ZXIodHJ1ZSkucmV2aXNlcyh0cnVlKTtcbn07XG5cbnByb3RvLmRhdGEgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuX2NlbGxzOyB9O1xuXG5wcm90by5fcmVzZXQgPSBmdW5jdGlvbihpbnB1dCwgb3V0cHV0KSB7XG4gIHZhciBrLCBjO1xuICBmb3IoayBpbiB0aGlzLl9jZWxscykge1xuICAgIGlmKCEoYyA9IHRoaXMuX2NlbGxzW2tdKSkgY29udGludWU7XG4gICAgb3V0cHV0LnJlbS5wdXNoKGMudHBsKTtcbiAgfVxuICB0aGlzLl9jZWxscyA9IHt9O1xufTtcblxucHJvdG8uX2tleXMgPSBmdW5jdGlvbih4KSB7XG4gIHZhciBhY2MgPSB0aGlzLl9nYi5hY2Nlc3NvcnMgfHwgW3RoaXMuX2diLmFjY2Vzc29yXTtcbiAgdmFyIGtleXMgPSBhY2MucmVkdWNlKGZ1bmN0aW9uKGcsIGYpIHtcbiAgICByZXR1cm4gKCh2ID0gZih4KSkgIT09IHVuZGVmaW5lZCkgPyAoZy5wdXNoKHYpLCBnKSA6IGc7XG4gIH0sIFtdKSwgayA9IGtleXMuam9pbihcInxcIiksIHY7XG4gIHJldHVybiBrZXlzLmxlbmd0aCA+IDAgPyB7a2V5czoga2V5cywga2V5OiBrfSA6IHVuZGVmaW5lZDtcbn07XG5cbnByb3RvLl9jZWxsID0gZnVuY3Rpb24oeCkge1xuICB2YXIgayA9IHRoaXMuX2tleXMoeCk7XG4gIHJldHVybiB0aGlzLl9jZWxsc1trLmtleV0gfHwgKHRoaXMuX2NlbGxzW2sua2V5XSA9IHRoaXMuX25ld19jZWxsKHgsIGspKTtcbn07XG5cbnByb3RvLl9uZXdfY2VsbCA9IGZ1bmN0aW9uKHgsIGspIHtcbiAgcmV0dXJuIHtcbiAgICBjbnQ6IDAsXG4gICAgdHBsOiB0aGlzLl9uZXdfdHVwbGUoeCwgayksXG4gICAgZmxnOiBDLkFERF9DRUxMXG4gIH07XG59O1xuXG5wcm90by5fbmV3X3R1cGxlID0gZnVuY3Rpb24oeCwgaykge1xuICB2YXIgZ2IgPSB0aGlzLl9nYixcbiAgICAgIGZpZWxkcyA9IGdiLmZpZWxkcyB8fCBbZ2IuZmllbGRdLFxuICAgICAgYWNjID0gZ2IuYWNjZXNzb3JzIHx8IFtnYi5hY2Nlc3Nvcl0sXG4gICAgICB0ID0ge30sIGksIGxlbjtcblxuICBmb3IoaT0wLCBsZW49ZmllbGRzLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIHRbZmllbGRzW2ldXSA9IGFjY1tpXSh4KTtcbiAgfSBcblxuICByZXR1cm4gdHVwbGUuaW5nZXN0KHQsIG51bGwpO1xufTtcblxucHJvdG8uX2FkZCA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGNlbGwgPSB0aGlzLl9jZWxsKHgpO1xuICBjZWxsLmNudCArPSAxO1xuICBjZWxsLmZsZyB8PSBDLk1PRF9DRUxMO1xuICByZXR1cm4gY2VsbDtcbn07XG5cbnByb3RvLl9yZW0gPSBmdW5jdGlvbih4KSB7XG4gIHZhciBjZWxsID0gdGhpcy5fY2VsbCh4KTtcbiAgY2VsbC5jbnQgLT0gMTtcbiAgY2VsbC5mbGcgfD0gQy5NT0RfQ0VMTDtcbiAgcmV0dXJuIGNlbGw7XG59O1xuXG5wcm90by5fbW9kID0gZnVuY3Rpb24oeCwgcmVzZXQpIHtcbiAgaWYoeC5fcHJldiAmJiB4Ll9wcmV2ICE9PSBDLlNFTlRJTkVMICYmIHRoaXMuX2tleXMoeC5fcHJldikgIT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuX3JlbSh4Ll9wcmV2KTtcbiAgICByZXR1cm4gdGhpcy5fYWRkKHgpO1xuICB9IGVsc2UgaWYocmVzZXQpIHsgLy8gU2lnbmFsIGNoYW5nZSB0cmlnZ2VyZWQgcmVmbG93XG4gICAgcmV0dXJuIHRoaXMuX2FkZCh4KTtcbiAgfVxuICByZXR1cm4gdGhpcy5fY2VsbCh4KTtcbn07XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0LCByZXNldCkge1xuICB2YXIgZ3JvdXBCeSA9IHRoaXMsXG4gICAgICBvdXRwdXQgPSBjaGFuZ2VzZXQuY3JlYXRlKGlucHV0KSxcbiAgICAgIGssIGMsIGYsIHQ7XG5cbiAgaWYocmVzZXQpIHRoaXMuX3Jlc2V0KGlucHV0LCBvdXRwdXQpO1xuXG4gIGlucHV0LmFkZC5mb3JFYWNoKGZ1bmN0aW9uKHgpIHsgZ3JvdXBCeS5fYWRkKHgpOyB9KTtcbiAgaW5wdXQubW9kLmZvckVhY2goZnVuY3Rpb24oeCkgeyBncm91cEJ5Ll9tb2QoeCwgcmVzZXQpOyB9KTtcbiAgaW5wdXQucmVtLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgIGlmKHguX3ByZXYgJiYgeC5fcHJldiAhPT0gQy5TRU5USU5FTCAmJiBncm91cEJ5Ll9rZXlzKHguX3ByZXYpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGdyb3VwQnkuX3JlbSh4Ll9wcmV2KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ3JvdXBCeS5fcmVtKHgpO1xuICAgIH1cbiAgfSk7XG5cbiAgZm9yKGsgaW4gdGhpcy5fY2VsbHMpIHtcbiAgICBjID0gdGhpcy5fY2VsbHNba107XG4gICAgaWYoIWMpIGNvbnRpbnVlO1xuICAgIGYgPSBjLmZsZztcbiAgICB0ID0gYy50cGw7XG5cbiAgICBpZihjLmNudCA9PT0gMCkge1xuICAgICAgaWYoZiA9PT0gQy5NT0RfQ0VMTCkgb3V0cHV0LnJlbS5wdXNoKHQpO1xuICAgICAgdGhpcy5fY2VsbHNba10gPSBudWxsO1xuICAgIH0gZWxzZSBpZihmICYgQy5BRERfQ0VMTCkge1xuICAgICAgb3V0cHV0LmFkZC5wdXNoKHQpO1xuICAgIH0gZWxzZSBpZihmICYgQy5NT0RfQ0VMTCkge1xuICAgICAgb3V0cHV0Lm1vZC5wdXNoKHQpO1xuICAgIH1cbiAgICBjLmZsZyA9IDA7XG4gIH1cblxuICByZXR1cm4gb3V0cHV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHcm91cEJ5OyIsInZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxuICAgIHR1cGxlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvdHVwbGUnKTtcblxuZnVuY3Rpb24gTGlua1BhdGgoZ3JhcGgpIHtcbiAgVHJhbnNmb3JtLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgZ3JhcGgpO1xuICBUcmFuc2Zvcm0uYWRkUGFyYW1ldGVycyh0aGlzLCB7XG4gICAgc291cmNlOiAge3R5cGU6IFwiZmllbGRcIiwgZGVmYXVsdDogXCJfc291cmNlXCJ9LFxuICAgIHRhcmdldDogIHt0eXBlOiBcImZpZWxkXCIsIGRlZmF1bHQ6IFwiX3RhcmdldFwifSxcbiAgICB4OiAgICAgICB7dHlwZTogXCJmaWVsZFwiLCBkZWZhdWx0OiBcImxheW91dDp4XCJ9LFxuICAgIHk6ICAgICAgIHt0eXBlOiBcImZpZWxkXCIsIGRlZmF1bHQ6IFwibGF5b3V0OnlcIn0sXG4gICAgdGVuc2lvbjoge3R5cGU6IFwidmFsdWVcIiwgZGVmYXVsdDogMC4yfSxcbiAgICBzaGFwZTogICB7dHlwZTogXCJ2YWx1ZVwiLCBkZWZhdWx0OiBcImxpbmVcIn1cbiAgfSk7XG5cbiAgdGhpcy5fb3V0cHV0ID0ge1wicGF0aFwiOiBcImxpbms6cGF0aFwifTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbnZhciBwcm90byA9IChMaW5rUGF0aC5wcm90b3R5cGUgPSBuZXcgVHJhbnNmb3JtKCkpO1xuXG5mdW5jdGlvbiBsaW5lKGQsIHNvdXJjZSwgdGFyZ2V0LCB4LCB5LCB0ZW5zaW9uKSB7XG4gIHZhciBzID0gc291cmNlKGQpLCBzeCA9IHgocyksIHN5ID0geShzKSxcbiAgICAgIHQgPSB0YXJnZXQoZCksIHR4ID0geCh0KSwgdHkgPSB5KHQpO1xuICByZXR1cm4gXCJNXCIgKyBzeCArIFwiLFwiICsgc3lcbiAgICAgICArIFwiTFwiICsgdHggKyBcIixcIiArIHR5O1xufVxuXG5mdW5jdGlvbiBjdXJ2ZShkLCBzb3VyY2UsIHRhcmdldCwgeCwgeSwgdGVuc2lvbikge1xuICB2YXIgcyA9IHNvdXJjZShkKSwgc3ggPSB4KHMpLCBzeSA9IHkocyksXG4gICAgICB0ID0gdGFyZ2V0KGQpLCB0eCA9IHgodCksIHR5ID0geSh0KSxcbiAgICAgIGR4ID0gdHggLSBzeCxcbiAgICAgIGR5ID0gdHkgLSBzeSxcbiAgICAgIGl4ID0gdGVuc2lvbiAqIChkeCArIGR5KSxcbiAgICAgIGl5ID0gdGVuc2lvbiAqIChkeSAtIGR4KTtcbiAgcmV0dXJuIFwiTVwiICsgc3ggKyBcIixcIiArIHN5XG4gICAgICAgKyBcIkNcIiArIChzeCtpeCkgKyBcIixcIiArIChzeStpeSlcbiAgICAgICArIFwiIFwiICsgKHR4K2l5KSArIFwiLFwiICsgKHR5LWl4KVxuICAgICAgICsgXCIgXCIgKyB0eCArIFwiLFwiICsgdHk7XG59XG5cbmZ1bmN0aW9uIGRpYWdvbmFsWChkLCBzb3VyY2UsIHRhcmdldCwgeCwgeSwgdGVuc2lvbikge1xuICB2YXIgcyA9IHNvdXJjZShkKSwgc3ggPSB4KHMpLCBzeSA9IHkocyksXG4gICAgICB0ID0gdGFyZ2V0KGQpLCB0eCA9IHgodCksIHR5ID0geSh0KSxcbiAgICAgIG0gPSAoc3ggKyB0eCkgLyAyO1xuICByZXR1cm4gXCJNXCIgKyBzeCArIFwiLFwiICsgc3lcbiAgICAgICArIFwiQ1wiICsgbSAgKyBcIixcIiArIHN5XG4gICAgICAgKyBcIiBcIiArIG0gICsgXCIsXCIgKyB0eVxuICAgICAgICsgXCIgXCIgKyB0eCArIFwiLFwiICsgdHk7XG59XG5cbmZ1bmN0aW9uIGRpYWdvbmFsWShkLCBzb3VyY2UsIHRhcmdldCwgeCwgeSwgdGVuc2lvbikge1xuICB2YXIgcyA9IHNvdXJjZShkKSwgc3ggPSB4KHMpLCBzeSA9IHkocyksXG4gICAgICB0ID0gdGFyZ2V0KGQpLCB0eCA9IHgodCksIHR5ID0geSh0KSxcbiAgICAgIG0gPSAoc3kgKyB0eSkgLyAyO1xuICByZXR1cm4gXCJNXCIgKyBzeCArIFwiLFwiICsgc3lcbiAgICAgICArIFwiQ1wiICsgc3ggKyBcIixcIiArIG1cbiAgICAgICArIFwiIFwiICsgdHggKyBcIixcIiArIG1cbiAgICAgICArIFwiIFwiICsgdHggKyBcIixcIiArIHR5O1xufVxuXG52YXIgc2hhcGVzID0ge1xuICBsaW5lOiAgICAgIGxpbmUsXG4gIGN1cnZlOiAgICAgY3VydmUsXG4gIGRpYWdvbmFsOiAgZGlhZ29uYWxYLFxuICBkaWFnb25hbFg6IGRpYWdvbmFsWCxcbiAgZGlhZ29uYWxZOiBkaWFnb25hbFlcbn07XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBnID0gdGhpcy5fZ3JhcGgsXG4gICAgICBvdXRwdXQgPSB0aGlzLl9vdXRwdXQsXG4gICAgICBzaGFwZSA9IHNoYXBlc1t0aGlzLnNoYXBlLmdldChnKV0gfHwgc2hhcGVzLmxpbmUsXG4gICAgICBzb3VyY2UgPSB0aGlzLnNvdXJjZS5nZXQoZykuYWNjZXNzb3IsXG4gICAgICB0YXJnZXQgPSB0aGlzLnRhcmdldC5nZXQoZykuYWNjZXNzb3IsXG4gICAgICB4ID0gdGhpcy54LmdldChnKS5hY2Nlc3NvcixcbiAgICAgIHkgPSB0aGlzLnkuZ2V0KGcpLmFjY2Vzc29yLFxuICAgICAgdGVuc2lvbiA9IHRoaXMudGVuc2lvbi5nZXQoZyk7XG4gIFxuICBmdW5jdGlvbiBzZXQodCkge1xuICAgIHZhciBwYXRoID0gc2hhcGUodCwgc291cmNlLCB0YXJnZXQsIHgsIHksIHRlbnNpb24pXG4gICAgdHVwbGUuc2V0KHQsIG91dHB1dC5wYXRoLCBwYXRoKTtcbiAgfVxuXG4gIGlucHV0LmFkZC5mb3JFYWNoKHNldCk7XG4gIGlmICh0aGlzLnJlZXZhbHVhdGUoaW5wdXQpKSB7XG4gICAgaW5wdXQubW9kLmZvckVhY2goc2V0KTtcbiAgfVxuXG4gIGlucHV0LmZpZWxkc1tvdXRwdXQucGF0aF0gPSAxO1xuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpbmtQYXRoOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBleHByID0gcmVxdWlyZSgnLi4vcGFyc2UvZXhwcicpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG52YXIgYXJyYXlUeXBlID0gL2FycmF5L2ksXG4gICAgZGF0YVR5cGUgID0gL2RhdGEvaSxcbiAgICBmaWVsZFR5cGUgPSAvZmllbGQvaSxcbiAgICBleHByVHlwZSAgPSAvZXhwci9pO1xuXG5mdW5jdGlvbiBQYXJhbWV0ZXIobmFtZSwgdHlwZSkge1xuICB0aGlzLl9uYW1lID0gbmFtZTtcbiAgdGhpcy5fdHlwZSA9IHR5cGU7XG5cbiAgLy8gSWYgcGFyYW1ldGVyIGlzIGRlZmluZWQgdy9zaWduYWxzLCBpdCBtdXN0IGJlIHJlc29sdmVkXG4gIC8vIG9uIGV2ZXJ5IHB1bHNlLlxuICB0aGlzLl92YWx1ZSA9IFtdO1xuICB0aGlzLl9hY2Nlc3NvcnMgPSBbXTtcbiAgdGhpcy5fcmVzb2x1dGlvbiA9IGZhbHNlO1xuICB0aGlzLl9zaWduYWxzID0ge307XG59XG5cbnZhciBwcm90byA9IFBhcmFtZXRlci5wcm90b3R5cGU7XG5cbnByb3RvLl9nZXQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGlzQXJyYXkgPSBhcnJheVR5cGUudGVzdCh0aGlzLl90eXBlKSxcbiAgICAgIGlzRGF0YSAgPSBkYXRhVHlwZS50ZXN0KHRoaXMuX3R5cGUpLFxuICAgICAgaXNGaWVsZCA9IGZpZWxkVHlwZS50ZXN0KHRoaXMuX3R5cGUpO1xuXG4gIGlmIChpc0RhdGEpIHtcbiAgICByZXR1cm4gaXNBcnJheSA/IHsgbmFtZXM6IHRoaXMuX3ZhbHVlLCBzb3VyY2VzOiB0aGlzLl9hY2Nlc3NvcnMgfSA6XG4gICAgICB7IG5hbWU6IHRoaXMuX3ZhbHVlWzBdLCBzb3VyY2U6IHRoaXMuX2FjY2Vzc29yc1swXSB9O1xuICB9IGVsc2UgaWYgKGlzRmllbGQpIHtcbiAgICByZXR1cm4gaXNBcnJheSA/IHsgZmllbGRzOiB0aGlzLl92YWx1ZSwgYWNjZXNzb3JzOiB0aGlzLl9hY2Nlc3NvcnMgfSA6XG4gICAgICB7IGZpZWxkOiB0aGlzLl92YWx1ZVswXSwgYWNjZXNzb3I6IHRoaXMuX2FjY2Vzc29yc1swXSB9O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBpc0FycmF5ID8gdGhpcy5fdmFsdWUgOiB0aGlzLl92YWx1ZVswXTtcbiAgfVxufTtcblxucHJvdG8uZ2V0ID0gZnVuY3Rpb24oZ3JhcGgpIHtcbiAgdmFyIGlzRGF0YSAgPSBkYXRhVHlwZS50ZXN0KHRoaXMuX3R5cGUpLFxuICAgICAgaXNGaWVsZCA9IGZpZWxkVHlwZS50ZXN0KHRoaXMuX3R5cGUpLFxuICAgICAgcywgaWR4LCB2YWw7XG5cbiAgLy8gSWYgd2UgZG9uJ3QgcmVxdWlyZSByZXNvbHV0aW9uLCByZXR1cm4gdGhlIHZhbHVlIGltbWVkaWF0ZWx5LlxuICBpZiAoIXRoaXMuX3Jlc29sdXRpb24pIHJldHVybiB0aGlzLl9nZXQoKTtcblxuICBpZiAoaXNEYXRhKSB7XG4gICAgdGhpcy5fYWNjZXNzb3JzID0gdGhpcy5fdmFsdWUubWFwKGZ1bmN0aW9uKHYpIHsgcmV0dXJuIGdyYXBoLmRhdGEodik7IH0pO1xuICAgIHJldHVybiB0aGlzLl9nZXQoKTsgLy8gVE9ETzogc3VwcG9ydCBzaWduYWwgYXMgZGF0YVR5cGVzXG4gIH1cblxuICBmb3IocyBpbiB0aGlzLl9zaWduYWxzKSB7XG4gICAgaWR4ICA9IHRoaXMuX3NpZ25hbHNbc107XG4gICAgdmFsICA9IGdyYXBoLnNpZ25hbFJlZihzKTtcblxuICAgIGlmIChpc0ZpZWxkKSB7XG4gICAgICB0aGlzLl9hY2Nlc3NvcnNbaWR4XSA9IHRoaXMuX3ZhbHVlW2lkeF0gIT0gdmFsID8gXG4gICAgICAgIGRsLmFjY2Vzc29yKHZhbCkgOiB0aGlzLl9hY2Nlc3NvcnNbaWR4XTtcbiAgICB9XG5cbiAgICB0aGlzLl92YWx1ZVtpZHhdID0gdmFsO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMuX2dldCgpO1xufTtcblxucHJvdG8uc2V0ID0gZnVuY3Rpb24odHJhbnNmb3JtLCB2YWx1ZSkge1xuICB2YXIgcGFyYW0gPSB0aGlzLCBcbiAgICAgIGlzRXhwciA9IGV4cHJUeXBlLnRlc3QodGhpcy5fdHlwZSksXG4gICAgICBpc0RhdGEgID0gZGF0YVR5cGUudGVzdCh0aGlzLl90eXBlKSxcbiAgICAgIGlzRmllbGQgPSBmaWVsZFR5cGUudGVzdCh0aGlzLl90eXBlKTtcblxuICB0aGlzLl92YWx1ZSA9IGRsLmFycmF5KHZhbHVlKS5tYXAoZnVuY3Rpb24odiwgaSkge1xuICAgIGlmIChkbC5pc1N0cmluZyh2KSkge1xuICAgICAgaWYgKGlzRXhwcikge1xuICAgICAgICB2YXIgZSA9IGV4cHIodik7XG4gICAgICAgIHRyYW5zZm9ybS5kZXBlbmRlbmN5KEMuRklFTERTLCAgZS5maWVsZHMpO1xuICAgICAgICB0cmFuc2Zvcm0uZGVwZW5kZW5jeShDLlNJR05BTFMsIGUuc2lnbmFscyk7XG4gICAgICAgIHJldHVybiBlLmZuO1xuICAgICAgfSBlbHNlIGlmIChpc0ZpZWxkKSB7ICAvLyBCYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgICAgICBwYXJhbS5fYWNjZXNzb3JzW2ldID0gZGwuYWNjZXNzb3Iodik7XG4gICAgICAgIHRyYW5zZm9ybS5kZXBlbmRlbmN5KEMuRklFTERTLCB2KTtcbiAgICAgIH0gZWxzZSBpZiAoaXNEYXRhKSB7XG4gICAgICAgIHBhcmFtLl9yZXNvbHV0aW9uID0gdHJ1ZTtcbiAgICAgICAgdHJhbnNmb3JtLmRlcGVuZGVuY3koQy5EQVRBLCB2KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2O1xuICAgIH0gZWxzZSBpZiAodi52YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdi52YWx1ZTtcbiAgICB9IGVsc2UgaWYgKHYuZmllbGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcGFyYW0uX2FjY2Vzc29yc1tpXSA9IGRsLmFjY2Vzc29yKHYuZmllbGQpO1xuICAgICAgdHJhbnNmb3JtLmRlcGVuZGVuY3koQy5GSUVMRFMsIHYuZmllbGQpO1xuICAgICAgcmV0dXJuIHYuZmllbGQ7XG4gICAgfSBlbHNlIGlmICh2LnNpZ25hbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBwYXJhbS5fcmVzb2x1dGlvbiA9IHRydWU7XG4gICAgICBwYXJhbS5fc2lnbmFsc1t2LnNpZ25hbF0gPSBpO1xuICAgICAgdHJhbnNmb3JtLmRlcGVuZGVuY3koQy5TSUdOQUxTLCB2LnNpZ25hbCk7XG4gICAgICByZXR1cm4gdi5zaWduYWw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHY7XG4gIH0pO1xuXG4gIHJldHVybiB0cmFuc2Zvcm07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhcmFtZXRlcjsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICBleHByID0gcmVxdWlyZSgnLi4vcGFyc2UvZXhwcicpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpO1xuXG5mdW5jdGlvbiBTb3J0KGdyYXBoKSB7XG4gIFRyYW5zZm9ybS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgVHJhbnNmb3JtLmFkZFBhcmFtZXRlcnModGhpcywge2J5OiB7dHlwZTogXCJhcnJheTxmaWVsZD5cIn0gfSk7XG4gIHJldHVybiB0aGlzLnJvdXRlcih0cnVlKTtcbn1cblxudmFyIHByb3RvID0gKFNvcnQucHJvdG90eXBlID0gbmV3IFRyYW5zZm9ybSgpKTtcblxucHJvdG8udHJhbnNmb3JtID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgZGVidWcoaW5wdXQsIFtcInNvcnRpbmdcIl0pO1xuXG4gIGlmKGlucHV0LmFkZC5sZW5ndGggfHwgaW5wdXQubW9kLmxlbmd0aCB8fCBpbnB1dC5yZW0ubGVuZ3RoKSB7XG4gICAgaW5wdXQuc29ydCA9IGRsLmNvbXBhcmF0b3IodGhpcy5ieS5nZXQodGhpcy5fZ3JhcGgpLmZpZWxkcyk7XG4gIH1cblxuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNvcnQ7IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgQ29sbGVjdG9yID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvQ29sbGVjdG9yJyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpO1xuXG5mdW5jdGlvbiBTdGFjayhncmFwaCkge1xuICBUcmFuc2Zvcm0ucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICBncm91cGJ5OiB7dHlwZTogXCJhcnJheTxmaWVsZD5cIn0sXG4gICAgc29ydGJ5OiB7dHlwZTogXCJhcnJheTxmaWVsZD5cIn0sXG4gICAgdmFsdWU6IHt0eXBlOiBcImZpZWxkXCJ9LFxuICAgIG9mZnNldDoge3R5cGU6IFwidmFsdWVcIiwgZGVmYXVsdDogXCJ6ZXJvXCJ9XG4gIH0pO1xuXG4gIHRoaXMuX291dHB1dCA9IHtcbiAgICBcInN0YXJ0XCI6IFwibGF5b3V0OnN0YXJ0XCIsXG4gICAgXCJzdG9wXCI6ICBcImxheW91dDpzdG9wXCIsXG4gICAgXCJtaWRcIjogICBcImxheW91dDptaWRcIlxuICB9O1xuICB0aGlzLl9jb2xsZWN0b3IgPSBuZXcgQ29sbGVjdG9yKGdyYXBoKTtcblxuICByZXR1cm4gdGhpcztcbn1cblxudmFyIHByb3RvID0gKFN0YWNrLnByb3RvdHlwZSA9IG5ldyBUcmFuc2Zvcm0oKSk7XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIC8vIE1hdGVyaWFsaXplIHRoZSBjdXJyZW50IGRhdGFzb3VyY2UuIFRPRE86IHNoYXJlIGNvbGxlY3RvcnNcbiAgdGhpcy5fY29sbGVjdG9yLmV2YWx1YXRlKGlucHV0KTtcbiAgdmFyIGRhdGEgPSB0aGlzLl9jb2xsZWN0b3IuZGF0YSgpO1xuXG4gIHZhciBnID0gdGhpcy5fZ3JhcGgsXG4gICAgICBncm91cGJ5ID0gdGhpcy5ncm91cGJ5LmdldChnKS5hY2Nlc3NvcnMsXG4gICAgICBzb3J0YnkgPSBkbC5jb21wYXJhdG9yKHRoaXMuc29ydGJ5LmdldChnKS5maWVsZHMpLFxuICAgICAgdmFsdWUgPSB0aGlzLnZhbHVlLmdldChnKS5hY2Nlc3NvcixcbiAgICAgIG9mZnNldCA9IHRoaXMub2Zmc2V0LmdldChnKSxcbiAgICAgIG91dHB1dCA9IHRoaXMuX291dHB1dDtcblxuICAvLyBwYXJ0aXRpb24sIHN1bSwgYW5kIHNvcnQgdGhlIHN0YWNrIGdyb3Vwc1xuICB2YXIgZ3JvdXBzID0gcGFydGl0aW9uKGRhdGEsIGdyb3VwYnksIHNvcnRieSwgdmFsdWUpO1xuXG4gIC8vIGNvbXB1dGUgc3RhY2sgbGF5b3V0cyBwZXIgZ3JvdXBcbiAgZm9yICh2YXIgaT0wLCBtYXg9Z3JvdXBzLm1heDsgaTxncm91cHMubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgZ3JvdXAgPSBncm91cHNbaV0sXG4gICAgICAgIHN1bSA9IGdyb3VwLnN1bSxcbiAgICAgICAgb2ZmID0gb2Zmc2V0PT09XCJjZW50ZXJcIiA/IChtYXggLSBzdW0pLzIgOiAwLFxuICAgICAgICBzY2FsZSA9IG9mZnNldD09PVwibm9ybWFsaXplXCIgPyAoMS9zdW0pIDogMSxcbiAgICAgICAgaSwgeCwgYSwgYiA9IG9mZiwgdiA9IDA7XG5cbiAgICAvLyBzZXQgc3RhY2sgY29vcmRpbmF0ZXMgZm9yIGVhY2ggZGF0dW0gaW4gZ3JvdXBcbiAgICBmb3IgKGo9MDsgajxncm91cC5sZW5ndGg7ICsraikge1xuICAgICAgeCA9IGdyb3VwW2pdO1xuICAgICAgYSA9IGI7IC8vIHVzZSBwcmV2aW91cyB2YWx1ZSBmb3Igc3RhcnQgcG9pbnRcbiAgICAgIHYgKz0gdmFsdWUoeCk7XG4gICAgICBiID0gc2NhbGUgKiB2ICsgb2ZmOyAvLyBjb21wdXRlIGVuZCBwb2ludFxuICAgICAgdHVwbGUuc2V0KHgsIG91dHB1dC5zdGFydCwgYSk7XG4gICAgICB0dXBsZS5zZXQoeCwgb3V0cHV0LnN0b3AsIGIpO1xuICAgICAgdHVwbGUuc2V0KHgsIG91dHB1dC5taWQsIDAuNSAqIChhICsgYikpO1xuICAgIH1cbiAgfVxuXG4gIGlucHV0LmZpZWxkc1tvdXRwdXQuc3RhcnRdID0gMTtcbiAgaW5wdXQuZmllbGRzW291dHB1dC5zdG9wXSA9IDE7XG4gIGlucHV0LmZpZWxkc1tvdXRwdXQubWlkXSA9IDE7XG4gIHJldHVybiBpbnB1dDtcbn07XG5cbmZ1bmN0aW9uIHBhcnRpdGlvbihkYXRhLCBncm91cGJ5LCBzb3J0YnksIHZhbHVlKSB7XG4gIHZhciBncm91cHMgPSBbXSxcbiAgICAgIG1hcCwgaSwgeCwgaywgZywgcywgbWF4O1xuXG4gIC8vIHBhcnRpdGlvbiBkYXRhIHBvaW50cyBpbnRvIHN0YWNrIGdyb3Vwc1xuICBpZiAoZ3JvdXBieSA9PSBudWxsKSB7XG4gICAgZ3JvdXBzLnB1c2goZGF0YS5zbGljZSgpKTtcbiAgfSBlbHNlIHtcbiAgICBmb3IgKG1hcD17fSwgaT0wOyBpPGRhdGEubGVuZ3RoOyArK2kpIHtcbiAgICAgIHggPSBkYXRhW2ldO1xuICAgICAgayA9IChncm91cGJ5Lm1hcChmdW5jdGlvbihmKSB7IHJldHVybiBmKHgpOyB9KSk7XG4gICAgICBnID0gbWFwW2tdIHx8IChncm91cHMucHVzaChtYXBba10gPSBbXSksIG1hcFtrXSk7XG4gICAgICBnLnB1c2goeCk7XG4gICAgfVxuICB9XG5cbiAgLy8gY29tcHV0ZSBzdW1zIG9mIGdyb3Vwcywgc29ydCBncm91cHMgYXMgbmVlZGVkXG4gIGZvciAoaz0wLCBtYXg9MDsgazxncm91cHMubGVuZ3RoOyArK2spIHtcbiAgICBnID0gZ3JvdXBzW2tdO1xuICAgIGZvciAoaT0wLCBzPTA7IGk8Zy5sZW5ndGg7ICsraSkge1xuICAgICAgcyArPSB2YWx1ZShnW2ldKTtcbiAgICB9XG4gICAgZy5zdW0gPSBzO1xuICAgIGlmIChzID4gbWF4KSBtYXggPSBzO1xuICAgIGlmIChzb3J0YnkgIT0gbnVsbCkgZy5zb3J0KHNvcnRieSk7XG4gIH1cbiAgZ3JvdXBzLm1heCA9IG1heDtcblxuICByZXR1cm4gZ3JvdXBzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YWNrOyIsInZhciBOb2RlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvTm9kZScpLFxuICAgIFBhcmFtZXRlciA9IHJlcXVpcmUoJy4vUGFyYW1ldGVyJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIFRyYW5zZm9ybShncmFwaCkge1xuICBpZihncmFwaCkgTm9kZS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cblRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzID0gZnVuY3Rpb24ocHJvdG8sIHBhcmFtcykge1xuICB2YXIgcDtcbiAgZm9yICh2YXIgbmFtZSBpbiBwYXJhbXMpIHtcbiAgICBwID0gcGFyYW1zW25hbWVdO1xuICAgIHByb3RvW25hbWVdID0gbmV3IFBhcmFtZXRlcihuYW1lLCBwLnR5cGUpO1xuICAgIGlmKHAuZGVmYXVsdCkgcHJvdG9bbmFtZV0uc2V0KHByb3RvLCBwLmRlZmF1bHQpO1xuICB9XG4gIHByb3RvLl9wYXJhbWV0ZXJzID0gcGFyYW1zO1xufTtcblxudmFyIHByb3RvID0gKFRyYW5zZm9ybS5wcm90b3R5cGUgPSBuZXcgTm9kZSgpKTtcblxucHJvdG8uY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG4gPSBOb2RlLnByb3RvdHlwZS5jbG9uZS5jYWxsKHRoaXMpO1xuICBuLnRyYW5zZm9ybSA9IHRoaXMudHJhbnNmb3JtO1xuICBuLl9wYXJhbWV0ZXJzID0gdGhpcy5fcGFyYW1ldGVycztcbiAgZm9yKHZhciBrIGluIHRoaXMpIHsgXG4gICAgaWYobltrXSkgY29udGludWU7XG4gICAgbltrXSA9IHRoaXNba107IFxuICB9XG4gIHJldHVybiBuO1xufTtcblxucHJvdG8udHJhbnNmb3JtID0gZnVuY3Rpb24oaW5wdXQsIHJlc2V0KSB7IHJldHVybiBpbnB1dDsgfTtcbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgLy8gTWFueSB0cmFuc2Zvcm1zIHN0b3JlIGNhY2hlcyB0aGF0IG11c3QgYmUgaW52YWxpZGF0ZWQgaWZcbiAgLy8gYSBzaWduYWwgdmFsdWUgaGFzIGNoYW5nZWQuIFxuICB2YXIgcmVzZXQgPSB0aGlzLl9zdGFtcCA8IGlucHV0LnN0YW1wICYmIHRoaXMuZGVwZW5kZW5jeShDLlNJR05BTFMpLnNvbWUoZnVuY3Rpb24ocykgeyBcbiAgICByZXR1cm4gISFpbnB1dC5zaWduYWxzW3NdIFxuICB9KTtcblxuICByZXR1cm4gdGhpcy50cmFuc2Zvcm0oaW5wdXQsIHJlc2V0KTtcbn07XG5cbnByb3RvLm91dHB1dCA9IGZ1bmN0aW9uKG1hcCkge1xuICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fb3V0cHV0KSB7XG4gICAgaWYgKG1hcFtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX291dHB1dFtrZXldID0gbWFwW2tleV07XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2Zvcm07IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgQ29sbGVjdG9yID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvQ29sbGVjdG9yJyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCk7XG5cbmZ1bmN0aW9uIFRyZWVtYXAoZ3JhcGgpIHtcbiAgVHJhbnNmb3JtLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgZ3JhcGgpO1xuICBUcmFuc2Zvcm0uYWRkUGFyYW1ldGVycyh0aGlzLCB7XG4gICAgLy8gaGllcmFyY2h5IHBhcmFtZXRlcnNcbiAgICBzb3J0OiB7dHlwZTogXCJhcnJheTxmaWVsZD5cIiwgZGVmYXVsdDogW1wiLXZhbHVlXCJdfSxcbiAgICBjaGlsZHJlbjoge3R5cGU6IFwiZmllbGRcIiwgZGVmYXVsdDogXCJjaGlsZHJlblwifSxcbiAgICB2YWx1ZToge3R5cGU6IFwiZmllbGRcIiwgZGVmYXVsdDogXCJ2YWx1ZVwifSxcbiAgICAvLyB0cmVlbWFwIHBhcmFtZXRlcnNcbiAgICBzaXplOiB7dHlwZTogXCJhcnJheTx2YWx1ZT5cIiwgZGVmYXVsdDogWzUwMCwgNTAwXX0sXG4gICAgcm91bmQ6IHt0eXBlOiBcInZhbHVlXCIsIGRlZmF1bHQ6IHRydWV9LFxuICAgIHN0aWNreToge3R5cGU6IFwidmFsdWVcIiwgZGVmYXVsdDogZmFsc2V9LFxuICAgIHJhdGlvOiB7dHlwZTogXCJ2YWx1ZVwiLCBkZWZhdWx0OiAwLjUgKiAoMSArIE1hdGguc3FydCg1KSl9LFxuICAgIHBhZGRpbmc6IHt0eXBlOiBcInZhbHVlXCIsIGRlZmF1bHQ6IG51bGx9LFxuICAgIG1vZGU6IHt0eXBlOiBcInZhbHVlXCIsIGRlZmF1bHQ6IFwic3F1YXJpZnlcIn1cbiAgfSk7XG5cbiAgdGhpcy5fbGF5b3V0ID0gZDMubGF5b3V0LnRyZWVtYXAoKTtcblxuICB0aGlzLl9vdXRwdXQgPSB7XG4gICAgXCJ4XCI6ICAgICAgXCJsYXlvdXQ6eFwiLFxuICAgIFwieVwiOiAgICAgIFwibGF5b3V0OnlcIixcbiAgICBcIndpZHRoXCI6ICBcImxheW91dDp3aWR0aFwiLFxuICAgIFwiaGVpZ2h0XCI6IFwibGF5b3V0OmhlaWdodFwiXG4gIH07XG4gIHRoaXMuX2NvbGxlY3RvciA9IG5ldyBDb2xsZWN0b3IoZ3JhcGgpO1xuXG4gIHJldHVybiB0aGlzO1xufVxuXG52YXIgcHJvdG8gPSAoVHJlZW1hcC5wcm90b3R5cGUgPSBuZXcgVHJhbnNmb3JtKCkpO1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCkge1xuICAvLyBNYXRlcmlhbGl6ZSB0aGUgY3VycmVudCBkYXRhc291cmNlLiBUT0RPOiBzaGFyZSBjb2xsZWN0b3JzXG4gIHRoaXMuX2NvbGxlY3Rvci5ldmFsdWF0ZShpbnB1dCk7XG4gIHZhciBkYXRhID0gdGhpcy5fY29sbGVjdG9yLmRhdGEoKTtcblxuICAvLyBnZXQgdmFyaWFibGVzXG4gIHZhciBnID0gdGhpcy5fZ3JhcGgsXG4gICAgICBsYXlvdXQgPSB0aGlzLl9sYXlvdXQsXG4gICAgICBvdXRwdXQgPSB0aGlzLl9vdXRwdXQ7XG5cbiAgLy8gY29uZmlndXJlIGxheW91dFxuICBsYXlvdXRcbiAgICAuc29ydChkbC5jb21wYXJhdG9yKHRoaXMuc29ydC5nZXQoZykuZmllbGRzKSlcbiAgICAuY2hpbGRyZW4odGhpcy5jaGlsZHJlbi5nZXQoZykuYWNjZXNzb3IpXG4gICAgLnZhbHVlKHRoaXMudmFsdWUuZ2V0KGcpLmFjY2Vzc29yKVxuICAgIC5zaXplKHRoaXMuc2l6ZS5nZXQoZykpXG4gICAgLnJvdW5kKHRoaXMucm91bmQuZ2V0KGcpKVxuICAgIC5zdGlja3kodGhpcy5zdGlja3kuZ2V0KGcpKVxuICAgIC5yYXRpbyh0aGlzLnJhdGlvLmdldChnKSlcbiAgICAucGFkZGluZyh0aGlzLnBhZGRpbmcuZ2V0KGcpKVxuICAgIC5tb2RlKHRoaXMubW9kZS5nZXQoZykpXG4gICAgLm5vZGVzKGRhdGFbMF0pO1xuXG4gIC8vIGNvcHkgbGF5b3V0IHZhbHVlcyB0byBub2Rlc1xuICBkYXRhLmZvckVhY2goZnVuY3Rpb24obikge1xuICAgIHR1cGxlLnNldChuLCBvdXRwdXQueCwgbi54KTtcbiAgICB0dXBsZS5zZXQobiwgb3V0cHV0LnksIG4ueSk7XG4gICAgdHVwbGUuc2V0KG4sIG91dHB1dC53aWR0aCwgbi5keCk7XG4gICAgdHVwbGUuc2V0KG4sIG91dHB1dC5oZWlnaHQsIG4uZHkpO1xuICB9KTtcblxuICAvLyByZXR1cm4gY2hhbmdlc2V0XG4gIGlucHV0LmZpZWxkc1tvdXRwdXQueF0gPSAxO1xuICBpbnB1dC5maWVsZHNbb3V0cHV0LnldID0gMTtcbiAgaW5wdXQuZmllbGRzW291dHB1dC53aWR0aF0gPSAxO1xuICBpbnB1dC5maWVsZHNbb3V0cHV0LmhlaWdodF0gPSAxO1xuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVtYXA7IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgR3JvdXBCeSA9IHJlcXVpcmUoJy4vR3JvdXBCeScpLFxuICAgIHR1cGxlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvdHVwbGUnKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKTtcblxuZnVuY3Rpb24gVW5pcXVlKGdyYXBoKSB7XG4gIEdyb3VwQnkucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICBmaWVsZDoge3R5cGU6IFwiZmllbGRcIn0sXG4gICAgYXM6IHt0eXBlOiBcInZhbHVlXCJ9XG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufVxuXG52YXIgcHJvdG8gPSAoVW5pcXVlLnByb3RvdHlwZSA9IG5ldyBHcm91cEJ5KCkpO1xuXG5wcm90by5fbmV3X3R1cGxlID0gZnVuY3Rpb24oeCkge1xuICB2YXIgbyAgPSB7fSxcbiAgICAgIG9uID0gdGhpcy5maWVsZC5nZXQodGhpcy5fZ3JhcGgpLFxuICAgICAgYXMgPSB0aGlzLmFzLmdldCh0aGlzLl9ncmFwaCk7XG5cbiAgb1thc10gPSBvbi5hY2Nlc3Nvcih4KTtcbiAgcmV0dXJuIHR1cGxlLmluZ2VzdChvLCBudWxsKTtcbn07XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0LCByZXNldCkge1xuICBkZWJ1ZyhpbnB1dCwgW1widW5pcXVlc1wiXSk7XG4gIHRoaXMuX2diID0gdGhpcy5maWVsZC5nZXQodGhpcy5fZ3JhcGgpO1xuICByZXR1cm4gR3JvdXBCeS5wcm90b3R5cGUudHJhbnNmb3JtLmNhbGwodGhpcywgaW5wdXQsIHJlc2V0KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVW5pcXVlOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxuICAgIENvbGxlY3RvciA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L0NvbGxlY3RvcicpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpO1xuXG5mdW5jdGlvbiBaaXAoZ3JhcGgpIHtcbiAgVHJhbnNmb3JtLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgZ3JhcGgpO1xuICBUcmFuc2Zvcm0uYWRkUGFyYW1ldGVycyh0aGlzLCB7XG4gICAgd2l0aDoge3R5cGU6IFwiZGF0YVwifSxcbiAgICBhczogIHt0eXBlOiBcInZhbHVlXCJ9LFxuICAgIGtleToge3R5cGU6IFwiZmllbGRcIiwgZGVmYXVsdDogXCJkYXRhXCJ9LFxuICAgIHdpdGhLZXk6IHt0eXBlOiBcImZpZWxkXCIsIGRlZmF1bHQ6IG51bGx9LFxuICAgIGRlZmF1bHQ6IHt0eXBlOiBcInZhbHVlXCJ9XG4gIH0pO1xuXG4gIHRoaXMuX21hcCA9IHt9O1xuICB0aGlzLl9jb2xsZWN0b3IgPSBuZXcgQ29sbGVjdG9yKGdyYXBoKTtcbiAgdGhpcy5fbGFzdEpvaW4gPSAwO1xuXG4gIHJldHVybiB0aGlzLnJldmlzZXModHJ1ZSk7XG59XG5cbnZhciBwcm90byA9IChaaXAucHJvdG90eXBlID0gbmV3IFRyYW5zZm9ybSgpKTtcblxuZnVuY3Rpb24gbXAoaykge1xuICByZXR1cm4gdGhpcy5fbWFwW2tdIHx8ICh0aGlzLl9tYXBba10gPSBbXSk7XG59O1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgdyA9IHRoaXMud2l0aC5nZXQodGhpcy5fZ3JhcGgpLFxuICAgICAgd2RzID0gdy5zb3VyY2UsXG4gICAgICB3b3V0cHV0ID0gd2RzLmxhc3QoKSxcbiAgICAgIHdkYXRhID0gd2RzLnZhbHVlcygpLFxuICAgICAga2V5ID0gdGhpcy5rZXkuZ2V0KHRoaXMuX2dyYXBoKSxcbiAgICAgIHdpdGhLZXkgPSB0aGlzLndpdGhLZXkuZ2V0KHRoaXMuX2dyYXBoKSxcbiAgICAgIGFzID0gdGhpcy5hcy5nZXQodGhpcy5fZ3JhcGgpLFxuICAgICAgZGZsdCA9IHRoaXMuZGVmYXVsdC5nZXQodGhpcy5fZ3JhcGgpLFxuICAgICAgbWFwID0gbXAuYmluZCh0aGlzKSxcbiAgICAgIHJlbSA9IHt9O1xuXG4gIGRlYnVnKGlucHV0LCBbXCJ6aXBwaW5nXCIsIHcubmFtZV0pO1xuXG4gIGlmKHdpdGhLZXkuZmllbGQpIHtcbiAgICBpZih3b3V0cHV0ICYmIHdvdXRwdXQuc3RhbXAgPiB0aGlzLl9sYXN0Sm9pbikge1xuICAgICAgd291dHB1dC5yZW0uZm9yRWFjaChmdW5jdGlvbih4KSB7XG4gICAgICAgIHZhciBtID0gbWFwKHdpdGhLZXkuYWNjZXNzb3IoeCkpO1xuICAgICAgICBpZihtWzBdKSBtWzBdLmZvckVhY2goZnVuY3Rpb24oZCkgeyBkW2FzXSA9IGRmbHQgfSk7XG4gICAgICAgIG1bMV0gPSBudWxsO1xuICAgICAgfSk7XG5cbiAgICAgIHdvdXRwdXQuYWRkLmZvckVhY2goZnVuY3Rpb24oeCkgeyBcbiAgICAgICAgdmFyIG0gPSBtYXAod2l0aEtleS5hY2Nlc3Nvcih4KSk7XG4gICAgICAgIGlmKG1bMF0pIG1bMF0uZm9yRWFjaChmdW5jdGlvbihkKSB7IGRbYXNdID0geCB9KTtcbiAgICAgICAgbVsxXSA9IHg7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gT25seSBwcm9jZXNzIHdvdXRwdXQubW9kIHR1cGxlcyBpZiB0aGUgam9pbiBrZXkgaGFzIGNoYW5nZWQuXG4gICAgICAvLyBPdGhlciBmaWVsZCB1cGRhdGVzIHdpbGwgYXV0by1wcm9wYWdhdGUgdmlhIHByb3RvdHlwZS5cbiAgICAgIGlmKHdvdXRwdXQuZmllbGRzW3dpdGhLZXkuZmllbGRdKSB7XG4gICAgICAgIHdvdXRwdXQubW9kLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgICAgICAgIHZhciBwcmV2O1xuICAgICAgICAgIGlmKCF4Ll9wcmV2IHx8IChwcmV2ID0gd2l0aEtleS5hY2Nlc3Nvcih4Ll9wcmV2KSkgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICAgICAgICAgIHZhciBwcmV2bSA9IG1hcChwcmV2KTtcbiAgICAgICAgICBpZihwcmV2bVswXSkgcHJldm1bMF0uZm9yRWFjaChmdW5jdGlvbihkKSB7IGRbYXNdID0gZGZsdCB9KTtcbiAgICAgICAgICBwcmV2bVsxXSA9IG51bGw7XG5cbiAgICAgICAgICB2YXIgbSA9IG1hcCh3aXRoS2V5LmFjY2Vzc29yKHgpKTtcbiAgICAgICAgICBpZihtWzBdKSBtWzBdLmZvckVhY2goZnVuY3Rpb24oZCkgeyBkW2FzXSA9IHggfSk7XG4gICAgICAgICAgbVsxXSA9IHg7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9sYXN0Sm9pbiA9IHdvdXRwdXQuc3RhbXA7XG4gICAgfVxuICBcbiAgICBpbnB1dC5hZGQuZm9yRWFjaChmdW5jdGlvbih4KSB7XG4gICAgICB2YXIgbSA9IG1hcChrZXkuYWNjZXNzb3IoeCkpO1xuICAgICAgeFthc10gPSBtWzFdIHx8IGRmbHQ7XG4gICAgICAobVswXT1tWzBdfHxbXSkucHVzaCh4KTtcbiAgICB9KTtcblxuICAgIGlucHV0LnJlbS5mb3JFYWNoKGZ1bmN0aW9uKHgpIHsgXG4gICAgICB2YXIgayA9IGtleS5hY2Nlc3Nvcih4KTtcbiAgICAgIChyZW1ba109cmVtW2tdfHx7fSlbeC5faWRdID0gMTtcbiAgICB9KTtcblxuICAgIGlmKGlucHV0LmZpZWxkc1trZXkuZmllbGRdKSB7XG4gICAgICBpbnB1dC5tb2QuZm9yRWFjaChmdW5jdGlvbih4KSB7XG4gICAgICAgIHZhciBwcmV2O1xuICAgICAgICBpZigheC5fcHJldiB8fCAocHJldiA9IGtleS5hY2Nlc3Nvcih4Ll9wcmV2KSkgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBtID0gbWFwKGtleS5hY2Nlc3Nvcih4KSk7XG4gICAgICAgIHhbYXNdID0gbVsxXSB8fCBkZmx0O1xuICAgICAgICAobVswXT1tWzBdfHxbXSkucHVzaCh4KTtcbiAgICAgICAgKHJlbVtwcmV2XT1yZW1bcHJldl18fHt9KVt4Ll9pZF0gPSAxO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZGwua2V5cyhyZW0pLmZvckVhY2goZnVuY3Rpb24oaykgeyBcbiAgICAgIHZhciBtID0gbWFwKGspO1xuICAgICAgaWYoIW1bMF0pIHJldHVybjtcbiAgICAgIG1bMF0gPSBtWzBdLmZpbHRlcihmdW5jdGlvbih4KSB7IHJldHVybiByZW1ba11beC5faWRdICE9PSAxIH0pO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIC8vIFdlIG9ubHkgbmVlZCB0byBydW4gYSBub24ta2V5LWpvaW4gYWdhaW4gaWYgd2UndmUgZ290IGFueSBhZGQvcmVtXG4gICAgLy8gb24gaW5wdXQgb3Igd291dHB1dFxuICAgIGlmKGlucHV0LmFkZC5sZW5ndGggPT0gMCAmJiBpbnB1dC5yZW0ubGVuZ3RoID09IDAgJiYgXG4gICAgICAgIHdvdXRwdXQuYWRkLmxlbmd0aCA9PSAwICYmIHdvdXRwdXQucmVtLmxlbmd0aCA9PSAwKSByZXR1cm4gaW5wdXQ7XG5cbiAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIGEga2V5LWpvaW4sIHRoZW4gd2UgbmVlZCB0byBtYXRlcmlhbGl6ZSBib3RoXG4gICAgLy8gZGF0YSBzb3VyY2VzIHRvIGl0ZXJhdGUgdGhyb3VnaCB0aGVtLiBcbiAgICB0aGlzLl9jb2xsZWN0b3IuZXZhbHVhdGUoaW5wdXQpO1xuXG4gICAgdmFyIGRhdGEgPSB0aGlzLl9jb2xsZWN0b3IuZGF0YSgpLCBcbiAgICAgICAgd2xlbiA9IHdkYXRhLmxlbmd0aCwgaTtcblxuICAgIGZvcihpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHsgZGF0YVtpXVthc10gPSB3ZGF0YVtpJXdsZW5dOyB9XG4gIH1cblxuICBpbnB1dC5maWVsZHNbYXNdID0gMTtcbiAgcmV0dXJuIGlucHV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBaaXA7IiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFnZ3JlZ2F0ZTogIHJlcXVpcmUoJy4vQWdncmVnYXRlJyksXG4gIGJpbjogICAgICAgIHJlcXVpcmUoJy4vQmluJyksXG4gIGNyb3NzOiAgICAgIHJlcXVpcmUoJy4vQ3Jvc3MnKSxcbiAgbGlua3BhdGg6ICAgcmVxdWlyZSgnLi9MaW5rUGF0aCcpLFxuICBmYWNldDogICAgICByZXF1aXJlKCcuL0ZhY2V0JyksXG4gIGZpbHRlcjogICAgIHJlcXVpcmUoJy4vRmlsdGVyJyksXG4gIGZvbGQ6ICAgICAgIHJlcXVpcmUoJy4vRm9sZCcpLFxuICBmb3JjZTogICAgICByZXF1aXJlKCcuL0ZvcmNlJyksXG4gIGZvcm11bGE6ICAgIHJlcXVpcmUoJy4vRm9ybXVsYScpLFxuICBzb3J0OiAgICAgICByZXF1aXJlKCcuL1NvcnQnKSxcbiAgc3RhY2s6ICAgICAgcmVxdWlyZSgnLi9TdGFjaycpLFxuICB0cmVlbWFwOiAgICByZXF1aXJlKCcuL1RyZWVtYXAnKSxcbiAgdW5pcXVlOiAgICAgcmVxdWlyZSgnLi9VbmlxdWUnKSxcbiAgemlwOiAgICAgICAgcmVxdWlyZSgnLi9aaXAnKVxufTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIHF1aWNrc2VsZWN0ID0gcmVxdWlyZSgnLi4vdXRpbC9xdWlja3NlbGVjdCcpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG52YXIgdHlwZXMgPSB7XG4gIFwiY291bnRcIjogbWVhc3VyZSh7XG4gICAgbmFtZTogXCJjb3VudFwiLFxuICAgIGluaXQ6IFwiXCIsXG4gICAgYWRkOiAgXCJcIixcbiAgICByZW06ICBcIlwiLFxuICAgIHNldDogIFwidGhpcy5jZWxsLmNudFwiXG4gIH0pLFxuICBcIl9jb3VudHNcIjogbWVhc3VyZSh7XG4gICAgbmFtZTogXCJfY291bnRzXCIsXG4gICAgaW5pdDogXCJ0aGlzLmNudHMgPSB7fTtcIixcbiAgICBhZGQ6ICBcInRoaXMuY250c1t2XSA9ICsrdGhpcy5jbnRzW3ZdIHx8IDE7XCIsXG4gICAgcmVtOiAgXCJ0aGlzLmNudHNbdl0gPSAtLXRoaXMuY250c1t2XSA8IDAgPyAwIDogdGhpcy5jbnRzW3ZdO1wiLFxuICAgIHNldDogIFwiXCIsXG4gICAgcmVxOiAgW1wiY291bnRcIl1cbiAgfSksXG4gIFwic3VtXCI6IG1lYXN1cmUoe1xuICAgIG5hbWU6IFwic3VtXCIsXG4gICAgaW5pdDogXCJ0aGlzLnN1bSA9IDA7XCIsXG4gICAgYWRkOiAgXCJ0aGlzLnN1bSArPSB2O1wiLFxuICAgIHJlbTogIFwidGhpcy5zdW0gLT0gdjtcIixcbiAgICBzZXQ6ICBcInRoaXMuc3VtXCJcbiAgfSksXG4gIFwiYXZnXCI6IG1lYXN1cmUoe1xuICAgIG5hbWU6IFwiYXZnXCIsXG4gICAgaW5pdDogXCJ0aGlzLmF2ZyA9IDA7XCIsXG4gICAgYWRkOiAgXCJ2YXIgZCA9IHYgLSB0aGlzLmF2ZzsgdGhpcy5hdmcgKz0gZCAvIHRoaXMuY2VsbC5jbnQ7XCIsXG4gICAgcmVtOiAgXCJ2YXIgZCA9IHYgLSB0aGlzLmF2ZzsgdGhpcy5hdmcgLT0gZCAvIHRoaXMuY2VsbC5jbnQ7XCIsXG4gICAgc2V0OiAgXCJ0aGlzLmF2Z1wiLFxuICAgIHJlcTogIFtcImNvdW50XCJdLCBpZHg6IDFcbiAgfSksXG4gIFwidmFyXCI6IG1lYXN1cmUoe1xuICAgIG5hbWU6IFwidmFyXCIsXG4gICAgaW5pdDogXCJ0aGlzLmRldiA9IDA7XCIsXG4gICAgYWRkOiAgXCJ0aGlzLmRldiArPSBkICogKHYgLSB0aGlzLmF2Zyk7XCIsXG4gICAgcmVtOiAgXCJ0aGlzLmRldiAtPSBkICogKHYgLSB0aGlzLmF2Zyk7XCIsXG4gICAgc2V0OiAgXCJ0aGlzLmRldiAvICh0aGlzLmNlbGwuY250LTEpXCIsXG4gICAgcmVxOiAgW1wiYXZnXCJdLCBpZHg6IDJcbiAgfSksXG4gIFwidmFycFwiOiBtZWFzdXJlKHtcbiAgICBuYW1lOiBcInZhcnBcIixcbiAgICBpbml0OiBcIlwiLFxuICAgIGFkZDogIFwiXCIsXG4gICAgcmVtOiAgXCJcIixcbiAgICBzZXQ6ICBcInRoaXMuZGV2IC8gdGhpcy5jZWxsLmNudFwiLFxuICAgIHJlcTogIFtcInZhclwiXSwgaWR4OiAzXG4gIH0pLFxuICBcInN0ZGV2XCI6IG1lYXN1cmUoe1xuICAgIG5hbWU6IFwic3RkZXZcIixcbiAgICBpbml0OiBcIlwiLFxuICAgIGFkZDogIFwiXCIsXG4gICAgcmVtOiAgXCJcIixcbiAgICBzZXQ6ICBcIk1hdGguc3FydCh0aGlzLmRldiAvICh0aGlzLmNlbGwuY250LTEpKVwiLFxuICAgIHJlcTogIFtcInZhclwiXSwgaWR4OiA0XG4gIH0pLFxuICBcInN0ZGV2cFwiOiBtZWFzdXJlKHtcbiAgICBuYW1lOiBcInN0ZGV2cFwiLFxuICAgIGluaXQ6IFwiXCIsXG4gICAgYWRkOiAgXCJcIixcbiAgICByZW06ICBcIlwiLFxuICAgIHNldDogIFwiTWF0aC5zcXJ0KHRoaXMuZGV2IC8gdGhpcy5jZWxsLmNudClcIixcbiAgICByZXE6ICBbXCJ2YXJcIl0sIGlkeDogNVxuICB9KSxcbiAgXCJtaW5cIjogbWVhc3VyZSh7XG4gICAgbmFtZTogXCJtaW5cIixcbiAgICBpbml0OiBcInRoaXMubWluID0gK0luZmluaXR5O1wiLFxuICAgIGFkZDogIFwidGhpcy5taW4gPSB2IDwgdGhpcy5taW4gPyB2IDogdGhpcy5taW47XCIsXG4gICAgcmVtOiAgXCJ2YXIgc2VsZiA9IHRoaXM7IHRoaXMubWluID0gdiA9PSB0aGlzLm1pbiBcIiArXG4gICAgICAgICAgXCI/IHRoaXMua2V5cyh0aGlzLmNudHMpLnJlZHVjZShmdW5jdGlvbihtLCB2KSB7IFwiICtcbiAgICAgICAgICBcIiAgIHJldHVybiBzZWxmLmNudHNbKHYgPSArdildID4gMCAmJiB2IDwgbSA/IHYgOiBtIH0sICtJbmZpbml0eSkgXCIgKyBcbiAgICAgICAgICBcIjogdGhpcy5taW47XCIsXG4gICAgc2V0OiAgXCJ0aGlzLm1pblwiLFxuICAgIHJlcTogW1wiX2NvdW50c1wiXSwgaWR4OiA2XG4gIH0pLFxuICBcIm1heFwiOiBtZWFzdXJlKHtcbiAgICBuYW1lOiBcIm1heFwiLFxuICAgIGluaXQ6IFwidGhpcy5tYXggPSAtSW5maW5pdHk7XCIsXG4gICAgYWRkOiAgXCJ0aGlzLm1heCA9IHYgPiB0aGlzLm1heCA/IHYgOiB0aGlzLm1heDtcIixcbiAgICByZW06ICBcInZhciBzZWxmID0gdGhpczsgdGhpcy5tYXggPSB2ID09IHRoaXMubWF4IFwiICtcbiAgICAgICAgICBcIj8gdGhpcy5rZXlzKHRoaXMuY250cykucmVkdWNlKGZ1bmN0aW9uKG0sIHYpIHsgXCIgK1xuICAgICAgICAgIFwiICAgcmV0dXJuIHNlbGYuY250c1sodiA9ICt2KV0gPiAwICYmIHYgPiBtID8gdiA6IG0gfSwgLUluZmluaXR5KSBcIiArIFxuICAgICAgICAgIFwiOiB0aGlzLm1heDtcIixcbiAgICBzZXQ6ICBcInRoaXMubWF4XCIsXG4gICAgcmVxOiBbXCJfY291bnRzXCJdLCBpZHg6IDdcbiAgfSksXG4gIFwibWVkaWFuXCI6IG1lYXN1cmUoe1xuICAgIG5hbWU6IFwibWVkaWFuXCIsXG4gICAgaW5pdDogXCJ0aGlzLnZhbHMgPSBbXTsgXCIsXG4gICAgYWRkOiAgXCJpZih0aGlzLnZhbHMpIHRoaXMudmFscy5wdXNoKHYpOyBcIixcbiAgICByZW06ICBcInRoaXMudmFscyA9IG51bGw7XCIsXG4gICAgc2V0OiAgXCJ0aGlzLmNlbGwuY250ICUgMiA/IHRoaXMuc2VsKH5+KHRoaXMuY2VsbC5jbnQvMiksIHRoaXMudmFscywgdGhpcy5jbnRzKSA6IFwiK1xuICAgICAgICAgIFwiMC41ICogKHRoaXMuc2VsKH5+KHRoaXMuY2VsbC5jbnQvMiktMSwgdGhpcy52YWxzLCB0aGlzLmNudHMpICsgdGhpcy5zZWwofn4odGhpcy5jZWxsLmNudC8yKSwgdGhpcy52YWxzLCB0aGlzLmNudHMpKVwiLFxuICAgIHJlcTogW1wiX2NvdW50c1wiXSwgaWR4OiA4XG4gIH0pXG59O1xuXG5mdW5jdGlvbiBtZWFzdXJlKGJhc2UpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG91dCkge1xuICAgIHZhciBtID0gT2JqZWN0LmNyZWF0ZShiYXNlKTtcbiAgICBtLm91dCA9IG91dCB8fCBiYXNlLm5hbWU7XG4gICAgaWYgKCFtLmlkeCkgbS5pZHggPSAwO1xuICAgIHJldHVybiBtO1xuICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlKGFnZykge1xuICBmdW5jdGlvbiBjb2xsZWN0KG0sIGEpIHtcbiAgICAoYS5yZXEgfHwgW10pLmZvckVhY2goZnVuY3Rpb24ocikge1xuICAgICAgaWYgKCFtW3JdKSBjb2xsZWN0KG0sIG1bcl0gPSB0eXBlc1tyXSgpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gbTtcbiAgfVxuICB2YXIgbWFwID0gYWdnLnJlZHVjZShjb2xsZWN0LFxuICAgIGFnZy5yZWR1Y2UoZnVuY3Rpb24obSwgYSkgeyByZXR1cm4gKG1bYS5uYW1lXSA9IGEsIG0pOyB9LCB7fSkpO1xuICB2YXIgYWxsID0gW107XG4gIGZvciAodmFyIGsgaW4gbWFwKSBhbGwucHVzaChtYXBba10pO1xuICBhbGwuc29ydChmdW5jdGlvbihhLGIpIHsgcmV0dXJuIGEuaWR4IC0gYi5pZHg7IH0pO1xuICByZXR1cm4gYWxsO1xufVxuXG5mdW5jdGlvbiBjb21waWxlKGFnZykge1xuICB2YXIgYWxsID0gcmVzb2x2ZShhZ2cpLFxuICAgICAgY3RyID0gXCJ0aGlzLnRwbCA9IHQ7IHRoaXMuY2VsbCA9IGM7XCIsXG4gICAgICBhZGQgPSBcIlwiLFxuICAgICAgcmVtID0gXCJcIixcbiAgICAgIHNldCA9IFwidmFyIHQgPSB0aGlzLnRwbDtcIjtcblxuICBhbGwuZm9yRWFjaChmdW5jdGlvbihhKSB7IGN0ciArPSBhLmluaXQ7IGFkZCArPSBhLmFkZDsgcmVtICs9IGEucmVtOyB9KTtcbiAgYWdnLmZvckVhY2goZnVuY3Rpb24oYSkgeyBzZXQgKz0gXCJ0aGlzLnR1cGxlLnNldCh0LCdcIithLm91dCtcIicsXCIrYS5zZXQrXCIpO1wiOyB9KTtcbiAgc2V0ICs9IFwicmV0dXJuIHQ7XCI7XG5cbiAgY3RyID0gRnVuY3Rpb24oXCJjXCIsIFwidFwiLCBjdHIpO1xuICBjdHIucHJvdG90eXBlLmFkZCA9IEZ1bmN0aW9uKFwidlwiLCBhZGQpO1xuICBjdHIucHJvdG90eXBlLnJlbSA9IEZ1bmN0aW9uKFwidlwiLCByZW0pO1xuICBjdHIucHJvdG90eXBlLnNldCA9IEZ1bmN0aW9uKFwic3RhbXBcIiwgc2V0KTtcbiAgY3RyLnByb3RvdHlwZS5tb2QgPSBtb2Q7XG4gIGN0ci5wcm90b3R5cGUua2V5cyA9IGRsLmtleXM7XG4gIGN0ci5wcm90b3R5cGUuc2VsID0gcXVpY2tzZWxlY3Q7XG4gIGN0ci5wcm90b3R5cGUudHVwbGUgPSB0dXBsZTtcbiAgcmV0dXJuIGN0cjtcbn1cblxuZnVuY3Rpb24gbW9kKHZfbmV3LCB2X29sZCkge1xuICBpZiAodl9vbGQgPT09IHVuZGVmaW5lZCB8fCB2X29sZCA9PT0gdl9uZXcpIHJldHVybjtcbiAgdGhpcy5yZW0odl9vbGQpO1xuICB0aGlzLmFkZCh2X25ldyk7XG59O1xuXG50eXBlcy5jcmVhdGUgICA9IGNvbXBpbGU7XG5tb2R1bGUuZXhwb3J0cyA9IHR5cGVzOyIsInZhciBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICAgIEJvdW5kcyA9IHJlcXVpcmUoJy4uL2NvcmUvQm91bmRzJyksXG4gICAgY2FudmFzID0gcmVxdWlyZSgnLi4vcmVuZGVyL2NhbnZhcy9wYXRoJyksXG4gICAgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcblxudmFyIHBhcnNlID0gY2FudmFzLnBhcnNlLFxuICAgIGJvdW5kUGF0aCA9IGNhbnZhcy5ib3VuZHMsXG4gICAgYXJlYVBhdGggPSBjYW52YXMuYXJlYSxcbiAgICBsaW5lUGF0aCA9IGNhbnZhcy5saW5lLFxuICAgIGhhbGZwaSA9IE1hdGguUEkgLyAyLFxuICAgIHNxcnQzID0gTWF0aC5zcXJ0KDMpLFxuICAgIHRhbjMwID0gTWF0aC50YW4oMzAgKiBNYXRoLlBJIC8gMTgwKSxcbiAgICBnZnggPSBudWxsO1xuXG5mdW5jdGlvbiBmb250U3RyaW5nKG8pIHtcbiAgcmV0dXJuIChvLmZvbnRTdHlsZSA/IG8uZm9udFN0eWxlICsgXCIgXCIgOiBcIlwiKVxuICAgICsgKG8uZm9udFZhcmlhbnQgPyBvLmZvbnRWYXJpYW50ICsgXCIgXCIgOiBcIlwiKVxuICAgICsgKG8uZm9udFdlaWdodCA/IG8uZm9udFdlaWdodCArIFwiIFwiIDogXCJcIilcbiAgICArIChvLmZvbnRTaXplICE9IG51bGwgPyBvLmZvbnRTaXplIDogY29uZmlnLnJlbmRlci5mb250U2l6ZSkgKyBcInB4IFwiXG4gICAgKyAoby5mb250IHx8IGNvbmZpZy5yZW5kZXIuZm9udCk7XG59XG5cbmZ1bmN0aW9uIGNvbnRleHQoKSB7XG4gIC8vIFRPRE86IGhvdyB0byBjaGVjayBpZiBub2RlSlMgaW4gcmVxdWlyZUpTP1xuICByZXR1cm4gZ2Z4IHx8IChnZnggPSAoLypjb25maWcuaXNOb2RlXG4gICAgPyBuZXcgKHJlcXVpcmUoXCJjYW52YXNcIikpKDEsMSlcbiAgICA6ICovZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJjYW52YXNcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInZlZ2FfaGlkZGVuXCIpXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgMSlcbiAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgMSlcbiAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIilcbiAgICAgICAgLm5vZGUoKSlcbiAgICAuZ2V0Q29udGV4dChcIjJkXCIpKTtcbn1cblxuZnVuY3Rpb24gcGF0aEJvdW5kcyhvLCBwYXRoLCBib3VuZHMpIHtcbiAgaWYgKHBhdGggPT0gbnVsbCkge1xuICAgIGJvdW5kcy5zZXQoMCwgMCwgMCwgMCk7XG4gIH0gZWxzZSB7XG4gICAgYm91bmRQYXRoKHBhdGgsIGJvdW5kcyk7XG4gICAgaWYgKG8uc3Ryb2tlICYmIG8ub3BhY2l0eSAhPT0gMCAmJiBvLnN0cm9rZVdpZHRoID4gMCkge1xuICAgICAgYm91bmRzLmV4cGFuZChvLnN0cm9rZVdpZHRoKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJvdW5kcztcbn1cblxuZnVuY3Rpb24gcGF0aChvLCBib3VuZHMpIHtcbiAgdmFyIHAgPSBvLnBhdGhcbiAgICA/IG8ucGF0aENhY2hlIHx8IChvLnBhdGhDYWNoZSA9IHBhcnNlKG8ucGF0aCkpXG4gICAgOiBudWxsO1xuICByZXR1cm4gcGF0aEJvdW5kcyhvLCBwLCBib3VuZHMpO1xufVxuXG5mdW5jdGlvbiBhcmVhKG8sIGJvdW5kcykge1xuICB2YXIgaXRlbXMgPSBvLm1hcmsuaXRlbXMsIG8gPSBpdGVtc1swXTtcbiAgdmFyIHAgPSBvLnBhdGhDYWNoZSB8fCAoby5wYXRoQ2FjaGUgPSBwYXJzZShhcmVhUGF0aChpdGVtcykpKTtcbiAgcmV0dXJuIHBhdGhCb3VuZHMoaXRlbXNbMF0sIHAsIGJvdW5kcyk7XG59XG5cbmZ1bmN0aW9uIGxpbmUobywgYm91bmRzKSB7XG4gIHZhciBpdGVtcyA9IG8ubWFyay5pdGVtcywgbyA9IGl0ZW1zWzBdO1xuICB2YXIgcCA9IG8ucGF0aENhY2hlIHx8IChvLnBhdGhDYWNoZSA9IHBhcnNlKGxpbmVQYXRoKGl0ZW1zKSkpO1xuICByZXR1cm4gcGF0aEJvdW5kcyhpdGVtc1swXSwgcCwgYm91bmRzKTtcbn1cblxuZnVuY3Rpb24gcmVjdChvLCBib3VuZHMpIHtcbiAgdmFyIHggPSBvLnggfHwgMCxcbiAgICAgIHkgPSBvLnkgfHwgMCxcbiAgICAgIHcgPSAoeCArIG8ud2lkdGgpIHx8IDAsXG4gICAgICBoID0gKHkgKyBvLmhlaWdodCkgfHwgMDtcbiAgYm91bmRzLnNldCh4LCB5LCB3LCBoKTtcbiAgaWYgKG8uc3Ryb2tlICYmIG8ub3BhY2l0eSAhPT0gMCAmJiBvLnN0cm9rZVdpZHRoID4gMCkge1xuICAgIGJvdW5kcy5leHBhbmQoby5zdHJva2VXaWR0aCk7XG4gIH1cbiAgcmV0dXJuIGJvdW5kcztcbn1cblxuZnVuY3Rpb24gaW1hZ2UobywgYm91bmRzKSB7XG4gIHZhciB3ID0gby53aWR0aCB8fCAwLFxuICAgICAgaCA9IG8uaGVpZ2h0IHx8IDAsXG4gICAgICB4ID0gKG8ueHx8MCkgLSAoby5hbGlnbiA9PT0gXCJjZW50ZXJcIlxuICAgICAgICAgID8gdy8yIDogKG8uYWxpZ24gPT09IFwicmlnaHRcIiA/IHcgOiAwKSksXG4gICAgICB5ID0gKG8ueXx8MCkgLSAoby5iYXNlbGluZSA9PT0gXCJtaWRkbGVcIlxuICAgICAgICAgID8gaC8yIDogKG8uYmFzZWxpbmUgPT09IFwiYm90dG9tXCIgPyBoIDogMCkpO1xuICByZXR1cm4gYm91bmRzLnNldCh4LCB5LCB4K3csIHkraCk7XG59XG5cbmZ1bmN0aW9uIHJ1bGUobywgYm91bmRzKSB7XG4gIHZhciB4MSwgeTE7XG4gIGJvdW5kcy5zZXQoXG4gICAgeDEgPSBvLnggfHwgMCxcbiAgICB5MSA9IG8ueSB8fCAwLFxuICAgIG8ueDIgIT0gbnVsbCA/IG8ueDIgOiB4MSxcbiAgICBvLnkyICE9IG51bGwgPyBvLnkyIDogeTFcbiAgKTtcbiAgaWYgKG8uc3Ryb2tlICYmIG8ub3BhY2l0eSAhPT0gMCAmJiBvLnN0cm9rZVdpZHRoID4gMCkge1xuICAgIGJvdW5kcy5leHBhbmQoby5zdHJva2VXaWR0aCk7XG4gIH1cbiAgcmV0dXJuIGJvdW5kcztcbn1cblxuZnVuY3Rpb24gYXJjKG8sIGJvdW5kcykge1xuICB2YXIgY3ggPSBvLnggfHwgMCxcbiAgICAgIGN5ID0gby55IHx8IDAsXG4gICAgICBpciA9IG8uaW5uZXJSYWRpdXMgfHwgMCxcbiAgICAgIG9yID0gby5vdXRlclJhZGl1cyB8fCAwLFxuICAgICAgc2EgPSAoby5zdGFydEFuZ2xlIHx8IDApIC0gaGFsZnBpLFxuICAgICAgZWEgPSAoby5lbmRBbmdsZSB8fCAwKSAtIGhhbGZwaSxcbiAgICAgIHhtaW4gPSBJbmZpbml0eSwgeG1heCA9IC1JbmZpbml0eSxcbiAgICAgIHltaW4gPSBJbmZpbml0eSwgeW1heCA9IC1JbmZpbml0eSxcbiAgICAgIGEsIGksIG4sIHgsIHksIGl4LCBpeSwgb3gsIG95O1xuXG4gIHZhciBhbmdsZXMgPSBbc2EsIGVhXSxcbiAgICAgIHMgPSBzYSAtIChzYSVoYWxmcGkpO1xuICBmb3IgKGk9MDsgaTw0ICYmIHM8ZWE7ICsraSwgcys9aGFsZnBpKSB7XG4gICAgYW5nbGVzLnB1c2gocyk7XG4gIH1cblxuICBmb3IgKGk9MCwgbj1hbmdsZXMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIGEgPSBhbmdsZXNbaV07XG4gICAgeCA9IE1hdGguY29zKGEpOyBpeCA9IGlyKng7IG94ID0gb3IqeDtcbiAgICB5ID0gTWF0aC5zaW4oYSk7IGl5ID0gaXIqeTsgb3kgPSBvcip5O1xuICAgIHhtaW4gPSBNYXRoLm1pbih4bWluLCBpeCwgb3gpO1xuICAgIHhtYXggPSBNYXRoLm1heCh4bWF4LCBpeCwgb3gpO1xuICAgIHltaW4gPSBNYXRoLm1pbih5bWluLCBpeSwgb3kpO1xuICAgIHltYXggPSBNYXRoLm1heCh5bWF4LCBpeSwgb3kpO1xuICB9XG5cbiAgYm91bmRzLnNldChjeCt4bWluLCBjeSt5bWluLCBjeCt4bWF4LCBjeSt5bWF4KTtcbiAgaWYgKG8uc3Ryb2tlICYmIG8ub3BhY2l0eSAhPT0gMCAmJiBvLnN0cm9rZVdpZHRoID4gMCkge1xuICAgIGJvdW5kcy5leHBhbmQoby5zdHJva2VXaWR0aCk7XG4gIH1cbiAgcmV0dXJuIGJvdW5kcztcbn1cblxuZnVuY3Rpb24gc3ltYm9sKG8sIGJvdW5kcykge1xuICB2YXIgc2l6ZSA9IG8uc2l6ZSAhPSBudWxsID8gby5zaXplIDogMTAwLFxuICAgICAgeCA9IG8ueCB8fCAwLFxuICAgICAgeSA9IG8ueSB8fCAwLFxuICAgICAgciwgdCwgcngsIHJ5O1xuXG4gIHN3aXRjaCAoby5zaGFwZSkge1xuICAgIGNhc2UgXCJjcm9zc1wiOlxuICAgICAgciA9IE1hdGguc3FydChzaXplIC8gNSkgLyAyO1xuICAgICAgdCA9IDMqcjtcbiAgICAgIGJvdW5kcy5zZXQoeC10LCB5LXIsIHgrdCwgeStyKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBcImRpYW1vbmRcIjpcbiAgICAgIHJ5ID0gTWF0aC5zcXJ0KHNpemUgLyAoMiAqIHRhbjMwKSk7XG4gICAgICByeCA9IHJ5ICogdGFuMzA7XG4gICAgICBib3VuZHMuc2V0KHgtcngsIHktcnksIHgrcngsIHkrcnkpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIFwic3F1YXJlXCI6XG4gICAgICB0ID0gTWF0aC5zcXJ0KHNpemUpO1xuICAgICAgciA9IHQgLyAyO1xuICAgICAgYm91bmRzLnNldCh4LXIsIHktciwgeCtyLCB5K3IpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIFwidHJpYW5nbGUtZG93blwiOlxuICAgICAgcnggPSBNYXRoLnNxcnQoc2l6ZSAvIHNxcnQzKTtcbiAgICAgIHJ5ID0gcnggKiBzcXJ0MyAvIDI7XG4gICAgICBib3VuZHMuc2V0KHgtcngsIHktcnksIHgrcngsIHkrcnkpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIFwidHJpYW5nbGUtdXBcIjpcbiAgICAgIHJ4ID0gTWF0aC5zcXJ0KHNpemUgLyBzcXJ0Myk7XG4gICAgICByeSA9IHJ4ICogc3FydDMgLyAyO1xuICAgICAgYm91bmRzLnNldCh4LXJ4LCB5LXJ5LCB4K3J4LCB5K3J5KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHIgPSBNYXRoLnNxcnQoc2l6ZS9NYXRoLlBJKTtcbiAgICAgIGJvdW5kcy5zZXQoeC1yLCB5LXIsIHgrciwgeStyKTtcbiAgfVxuICBpZiAoby5zdHJva2UgJiYgby5vcGFjaXR5ICE9PSAwICYmIG8uc3Ryb2tlV2lkdGggPiAwKSB7XG4gICAgYm91bmRzLmV4cGFuZChvLnN0cm9rZVdpZHRoKTtcbiAgfVxuICByZXR1cm4gYm91bmRzO1xufVxuXG5mdW5jdGlvbiB0ZXh0KG8sIGJvdW5kcywgbm9Sb3RhdGUpIHtcbiAgdmFyIHggPSAoby54IHx8IDApICsgKG8uZHggfHwgMCksXG4gICAgICB5ID0gKG8ueSB8fCAwKSArIChvLmR5IHx8IDApLFxuICAgICAgaCA9IG8uZm9udFNpemUgfHwgY29uZmlnLnJlbmRlci5mb250U2l6ZSxcbiAgICAgIGEgPSBvLmFsaWduLFxuICAgICAgYiA9IG8uYmFzZWxpbmUsXG4gICAgICByID0gby5yYWRpdXMgfHwgMCxcbiAgICAgIGcgPSBjb250ZXh0KCksIHcsIHQ7XG5cbiAgZy5mb250ID0gZm9udFN0cmluZyhvKTtcbiAgZy50ZXh0QWxpZ24gPSBhIHx8IFwibGVmdFwiO1xuICBnLnRleHRCYXNlbGluZSA9IGIgfHwgXCJhbHBoYWJldGljXCI7XG4gIHcgPSBnLm1lYXN1cmVUZXh0KG8udGV4dCB8fCBcIlwiKS53aWR0aDtcblxuICBpZiAocikge1xuICAgIHQgPSAoby50aGV0YSB8fCAwKSAtIE1hdGguUEkvMjtcbiAgICB4ICs9IHIgKiBNYXRoLmNvcyh0KTtcbiAgICB5ICs9IHIgKiBNYXRoLnNpbih0KTtcbiAgfVxuXG4gIC8vIGhvcml6b250YWxcbiAgaWYgKGEgPT09IFwiY2VudGVyXCIpIHtcbiAgICB4ID0geCAtICh3IC8gMik7XG4gIH0gZWxzZSBpZiAoYSA9PT0gXCJyaWdodFwiKSB7XG4gICAgeCA9IHggLSB3O1xuICB9IGVsc2Uge1xuICAgIC8vIGxlZnQgYnkgZGVmYXVsdCwgZG8gbm90aGluZ1xuICB9XG5cbiAgLy8vIFRPRE8gZmluZCBhIHJvYnVzdCBzb2x1dGlvbiBmb3IgaGVpZ2h0cy5cbiAgLy8vIFRoZXNlIG9mZnNldHMgd29yayBmb3Igc29tZSBidXQgbm90IGFsbCBmb250cy5cblxuICAvLyB2ZXJ0aWNhbFxuICBpZiAoYiA9PT0gXCJ0b3BcIikge1xuICAgIHkgPSB5ICsgKGgvNSk7XG4gIH0gZWxzZSBpZiAoYiA9PT0gXCJib3R0b21cIikge1xuICAgIHkgPSB5IC0gaDtcbiAgfSBlbHNlIGlmIChiID09PSBcIm1pZGRsZVwiKSB7XG4gICAgeSA9IHkgLSAoaC8yKSArIChoLzEwKTtcbiAgfSBlbHNlIHtcbiAgICB5ID0geSAtIDQqaC81OyAvLyBhbHBoYWJldGljIGJ5IGRlZmF1bHRcbiAgfVxuICBcbiAgYm91bmRzLnNldCh4LCB5LCB4K3csIHkraCk7XG4gIGlmIChvLmFuZ2xlICYmICFub1JvdGF0ZSkge1xuICAgIGJvdW5kcy5yb3RhdGUoby5hbmdsZSpNYXRoLlBJLzE4MCwgby54fHwwLCBvLnl8fDApO1xuICB9XG4gIHJldHVybiBib3VuZHMuZXhwYW5kKG5vUm90YXRlID8gMCA6IDEpO1xufVxuXG5mdW5jdGlvbiBncm91cChnLCBib3VuZHMsIGluY2x1ZGVMZWdlbmRzKSB7XG4gIHZhciBheGVzID0gZy5heGlzSXRlbXMgfHwgW10sXG4gICAgICBsZWdlbmRzID0gZy5sZWdlbmRJdGVtcyB8fCBbXSwgaiwgbTtcblxuICBmb3IgKGo9MCwgbT1heGVzLmxlbmd0aDsgajxtOyArK2opIHtcbiAgICBib3VuZHMudW5pb24oYXhlc1tqXS5ib3VuZHMpO1xuICB9XG4gIGZvciAoaj0wLCBtPWcuaXRlbXMubGVuZ3RoOyBqPG07ICsraikge1xuICAgIGJvdW5kcy51bmlvbihnLml0ZW1zW2pdLmJvdW5kcyk7XG4gIH1cbiAgaWYgKGluY2x1ZGVMZWdlbmRzKSB7XG4gICAgZm9yIChqPTAsIG09bGVnZW5kcy5sZW5ndGg7IGo8bTsgKytqKSB7XG4gICAgICBib3VuZHMudW5pb24obGVnZW5kc1tqXS5ib3VuZHMpO1xuICAgIH1cbiAgICBpZiAoZy53aWR0aCAhPSBudWxsICYmIGcuaGVpZ2h0ICE9IG51bGwpIHtcbiAgICAgIGJvdW5kcy5hZGQoZy53aWR0aCwgZy5oZWlnaHQpO1xuICAgIH1cbiAgICBpZiAoZy54ICE9IG51bGwgJiYgZy55ICE9IG51bGwpIHtcbiAgICAgIGJvdW5kcy5hZGQoMCwgMCk7XG4gICAgfVxuICB9XG4gIGJvdW5kcy50cmFuc2xhdGUoZy54fHwwLCBnLnl8fDApO1xuICByZXR1cm4gYm91bmRzO1xufVxuXG52YXIgbWV0aG9kcyA9IHtcbiAgZ3JvdXA6ICBncm91cCxcbiAgc3ltYm9sOiBzeW1ib2wsXG4gIGltYWdlOiAgaW1hZ2UsXG4gIHJlY3Q6ICAgcmVjdCxcbiAgcnVsZTogICBydWxlLFxuICBhcmM6ICAgIGFyYyxcbiAgdGV4dDogICB0ZXh0LFxuICBwYXRoOiAgIHBhdGgsXG4gIGFyZWE6ICAgYXJlYSxcbiAgbGluZTogICBsaW5lXG59O1xuXG5mdW5jdGlvbiBpdGVtQm91bmRzKGl0ZW0sIGZ1bmMsIG9wdCkge1xuICBmdW5jID0gZnVuYyB8fCBtZXRob2RzW2l0ZW0ubWFyay5tYXJrdHlwZV07XG4gIGlmICghaXRlbS5ib3VuZHNfcHJldikgaXRlbVsnYm91bmRzOnByZXYnXSA9IG5ldyBCb3VuZHMoKTtcbiAgdmFyIGIgPSBpdGVtLmJvdW5kcywgcGIgPSBpdGVtWydib3VuZHM6cHJldiddO1xuICBpZiAoYikgcGIuY2xlYXIoKS51bmlvbihiKTtcbiAgaXRlbS5ib3VuZHMgPSBmdW5jKGl0ZW0sIGIgPyBiLmNsZWFyKCkgOiBuZXcgQm91bmRzKCksIG9wdCk7XG4gIGlmICghYikgcGIuY2xlYXIoKS51bmlvbihpdGVtLmJvdW5kcyk7XG4gIHJldHVybiBpdGVtLmJvdW5kcztcbn1cblxuZnVuY3Rpb24gbWFya0JvdW5kcyhtYXJrLCBib3VuZHMsIG9wdCkge1xuICBib3VuZHMgPSBib3VuZHMgfHwgbWFyay5ib3VuZHMgJiYgbWFyay5ib3VuZHMuY2xlYXIoKSB8fCBuZXcgQm91bmRzKCk7XG4gIHZhciB0eXBlICA9IG1hcmsubWFya3R5cGUsXG4gICAgICBmdW5jICA9IG1ldGhvZHNbdHlwZV0sXG4gICAgICBpdGVtcyA9IG1hcmsuaXRlbXMsXG4gICAgICBpdGVtLCBpLCBsZW47XG4gICAgICBcbiAgaWYgKHR5cGU9PT1cImFyZWFcIiB8fCB0eXBlPT09XCJsaW5lXCIpIHtcbiAgICBpZiAoaXRlbXMubGVuZ3RoKSB7XG4gICAgICBpdGVtc1swXS5ib3VuZHMgPSBmdW5jKGl0ZW1zWzBdLCBib3VuZHMpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKGk9MCwgbGVuPWl0ZW1zLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgICAgYm91bmRzLnVuaW9uKGl0ZW1Cb3VuZHMoaXRlbXNbaV0sIGZ1bmMsIG9wdCkpO1xuICAgIH1cbiAgfVxuICBtYXJrLmJvdW5kcyA9IGJvdW5kcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1hcms6ICBtYXJrQm91bmRzLFxuICBpdGVtOiAgaXRlbUJvdW5kcyxcbiAgdGV4dDogIHRleHQsXG4gIGdyb3VwOiBncm91cFxufTsiLCJ2YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgICBjb25maWcgPSB7fTtcblxuY29uZmlnLmRlYnVnID0gZmFsc2U7XG5cbmNvbmZpZy5sb2FkID0ge1xuICAvLyBiYXNlIHVybCBmb3IgbG9hZGluZyBleHRlcm5hbCBkYXRhIGZpbGVzXG4gIC8vIHVzZWQgb25seSBmb3Igc2VydmVyLXNpZGUgb3BlcmF0aW9uXG4gIGJhc2VVUkw6IFwiXCIsXG4gIC8vIEFsbG93cyBkb21haW4gcmVzdHJpY3Rpb24gd2hlbiB1c2luZyBkYXRhIGxvYWRpbmcgdmlhIFhIUi5cbiAgLy8gVG8gZW5hYmxlLCBzZXQgaXQgdG8gYSBsaXN0IG9mIGFsbG93ZWQgZG9tYWluc1xuICAvLyBlLmcuLCBbJ3dpa2lwZWRpYS5vcmcnLCAnZWZmLm9yZyddXG4gIGRvbWFpbldoaXRlTGlzdDogZmFsc2Vcbn07XG5cbi8vIHZlcnNpb24gYW5kIG5hbWVwc2FjZXMgZm9yIGV4cG9ydGVkIHN2Z1xuY29uZmlnLnN2Z05hbWVzcGFjZSA9XG4gICd2ZXJzaW9uPVwiMS4xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiICcgK1xuICAneG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCInO1xuXG4vLyBpbnNldCBwYWRkaW5nIGZvciBhdXRvbWF0aWMgcGFkZGluZyBjYWxjdWxhdGlvblxuY29uZmlnLmF1dG9wYWRJbnNldCA9IDU7XG5cbi8vIGV4dGVuc2libGUgc2NhbGUgbG9va3VwIHRhYmxlXG4vLyBhbGwgZDMuc2NhbGUuKiBpbnN0YW5jZXMgYWxzbyBzdXBwb3J0ZWRcbmNvbmZpZy5zY2FsZSA9IHtcbiAgdGltZTogZDMudGltZS5zY2FsZSxcbiAgdXRjOiAgZDMudGltZS5zY2FsZS51dGNcbn07XG5cbi8vIGRlZmF1bHQgcmVuZGVyaW5nIHNldHRpbmdzXG5jb25maWcucmVuZGVyID0ge1xuICBsaW5lV2lkdGg6IDEsXG4gIGxpbmVDYXA6ICAgXCJidXR0XCIsXG4gIGZvbnQ6ICAgICAgXCJzYW5zLXNlcmlmXCIsXG4gIGZvbnRTaXplOiAgMTFcbn07XG5cbi8vIGRlZmF1bHQgYXhpcyBwcm9wZXJ0aWVzXG5jb25maWcuYXhpcyA9IHtcbiAgb3JpZW50OiBcImJvdHRvbVwiLFxuICB0aWNrczogMTAsXG4gIHBhZGRpbmc6IDMsXG4gIGF4aXNDb2xvcjogXCIjMDAwXCIsXG4gIGdyaWRDb2xvcjogXCIjZDhkOGQ4XCIsXG4gIHRpY2tDb2xvcjogXCIjMDAwXCIsXG4gIHRpY2tMYWJlbENvbG9yOiBcIiMwMDBcIixcbiAgYXhpc1dpZHRoOiAxLFxuICB0aWNrV2lkdGg6IDEsXG4gIHRpY2tTaXplOiA2LFxuICB0aWNrTGFiZWxGb250U2l6ZTogMTEsXG4gIHRpY2tMYWJlbEZvbnQ6IFwic2Fucy1zZXJpZlwiLFxuICB0aXRsZUNvbG9yOiBcIiMwMDBcIixcbiAgdGl0bGVGb250OiBcInNhbnMtc2VyaWZcIixcbiAgdGl0bGVGb250U2l6ZTogMTEsXG4gIHRpdGxlRm9udFdlaWdodDogXCJib2xkXCIsXG4gIHRpdGxlT2Zmc2V0OiAzNVxufTtcblxuLy8gZGVmYXVsdCBsZWdlbmQgcHJvcGVydGllc1xuY29uZmlnLmxlZ2VuZCA9IHtcbiAgb3JpZW50OiBcInJpZ2h0XCIsXG4gIG9mZnNldDogMTAsXG4gIHBhZGRpbmc6IDMsXG4gIGdyYWRpZW50U3Ryb2tlQ29sb3I6IFwiIzg4OFwiLFxuICBncmFkaWVudFN0cm9rZVdpZHRoOiAxLFxuICBncmFkaWVudEhlaWdodDogMTYsXG4gIGdyYWRpZW50V2lkdGg6IDEwMCxcbiAgbGFiZWxDb2xvcjogXCIjMDAwXCIsXG4gIGxhYmVsRm9udFNpemU6IDEwLFxuICBsYWJlbEZvbnQ6IFwic2Fucy1zZXJpZlwiLFxuICBsYWJlbEFsaWduOiBcImxlZnRcIixcbiAgbGFiZWxCYXNlbGluZTogXCJtaWRkbGVcIixcbiAgbGFiZWxPZmZzZXQ6IDgsXG4gIHN5bWJvbFNoYXBlOiBcImNpcmNsZVwiLFxuICBzeW1ib2xTaXplOiA1MCxcbiAgc3ltYm9sQ29sb3I6IFwiIzg4OFwiLFxuICBzeW1ib2xTdHJva2VXaWR0aDogMSxcbiAgdGl0bGVDb2xvcjogXCIjMDAwXCIsXG4gIHRpdGxlRm9udDogXCJzYW5zLXNlcmlmXCIsXG4gIHRpdGxlRm9udFNpemU6IDExLFxuICB0aXRsZUZvbnRXZWlnaHQ6IFwiYm9sZFwiXG59O1xuXG4vLyBkZWZhdWx0IGNvbG9yIHZhbHVlc1xuY29uZmlnLmNvbG9yID0ge1xuICByZ2I6IFsxMjgsIDEyOCwgMTI4XSxcbiAgbGFiOiBbNTAsIDAsIDBdLFxuICBoY2w6IFswLCAwLCA1MF0sXG4gIGhzbDogWzAsIDAsIDAuNV1cbn07XG5cbi8vIGRlZmF1bHQgc2NhbGUgcmFuZ2VzXG5jb25maWcucmFuZ2UgPSB7XG4gIGNhdGVnb3J5MTA6IFtcbiAgICBcIiMxZjc3YjRcIixcbiAgICBcIiNmZjdmMGVcIixcbiAgICBcIiMyY2EwMmNcIixcbiAgICBcIiNkNjI3MjhcIixcbiAgICBcIiM5NDY3YmRcIixcbiAgICBcIiM4YzU2NGJcIixcbiAgICBcIiNlMzc3YzJcIixcbiAgICBcIiM3ZjdmN2ZcIixcbiAgICBcIiNiY2JkMjJcIixcbiAgICBcIiMxN2JlY2ZcIlxuICBdLFxuICBjYXRlZ29yeTIwOiBbXG4gICAgXCIjMWY3N2I0XCIsXG4gICAgXCIjYWVjN2U4XCIsXG4gICAgXCIjZmY3ZjBlXCIsXG4gICAgXCIjZmZiYjc4XCIsXG4gICAgXCIjMmNhMDJjXCIsXG4gICAgXCIjOThkZjhhXCIsXG4gICAgXCIjZDYyNzI4XCIsXG4gICAgXCIjZmY5ODk2XCIsXG4gICAgXCIjOTQ2N2JkXCIsXG4gICAgXCIjYzViMGQ1XCIsXG4gICAgXCIjOGM1NjRiXCIsXG4gICAgXCIjYzQ5Yzk0XCIsXG4gICAgXCIjZTM3N2MyXCIsXG4gICAgXCIjZjdiNmQyXCIsXG4gICAgXCIjN2Y3ZjdmXCIsXG4gICAgXCIjYzdjN2M3XCIsXG4gICAgXCIjYmNiZDIyXCIsXG4gICAgXCIjZGJkYjhkXCIsXG4gICAgXCIjMTdiZWNmXCIsXG4gICAgXCIjOWVkYWU1XCJcbiAgXSxcbiAgc2hhcGVzOiBbXG4gICAgXCJjaXJjbGVcIixcbiAgICBcImNyb3NzXCIsXG4gICAgXCJkaWFtb25kXCIsXG4gICAgXCJzcXVhcmVcIixcbiAgICBcInRyaWFuZ2xlLWRvd25cIixcbiAgICBcInRyaWFuZ2xlLXVwXCJcbiAgXVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjb25maWc7IiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIEFERF9DRUxMOiAxLFxuICBNT0RfQ0VMTDogMixcblxuICBEQVRBOiBcImRhdGFcIixcbiAgRklFTERTOiAgXCJmaWVsZHNcIixcbiAgU0NBTEVTOiAgXCJzY2FsZXNcIixcbiAgU0lHTkFMOiAgXCJzaWduYWxcIixcbiAgU0lHTkFMUzogXCJzaWduYWxzXCIsXG5cbiAgR1JPVVA6IFwiZ3JvdXBcIixcblxuICBFTlRFUjogXCJlbnRlclwiLFxuICBVUERBVEU6IFwidXBkYXRlXCIsXG4gIEVYSVQ6IFwiZXhpdFwiLFxuXG4gIFNFTlRJTkVMOiB7XCJzZW50aW5lbFwiOiAxfSxcbiAgU0lOR0xFVE9OOiBcIl9zaW5nbGV0b25cIixcblxuICBBREQ6IFwiYWRkXCIsXG4gIFJFTU9WRTogXCJyZW1vdmVcIixcbiAgVE9HR0xFOiBcInRvZ2dsZVwiLFxuICBDTEVBUjogXCJjbGVhclwiLFxuXG4gIExJTkVBUjogXCJsaW5lYXJcIixcbiAgT1JESU5BTDogXCJvcmRpbmFsXCIsXG4gIExPRzogXCJsb2dcIixcbiAgUE9XRVI6IFwicG93XCIsXG4gIFRJTUU6IFwidGltZVwiLFxuICBRVUFOVElMRTogXCJxdWFudGlsZVwiLFxuXG4gIERPTUFJTjogXCJkb21haW5cIixcbiAgUkFOR0U6IFwicmFuZ2VcIixcblxuICBNQVJLOiBcIm1hcmtcIixcbiAgQVhJUzogXCJheGlzXCIsXG5cbiAgQ09VTlQ6IFwiY291bnRcIixcbiAgTUlOOiBcIm1pblwiLFxuICBNQVg6IFwibWF4XCIsXG5cbiAgQVNDOiBcImFzY1wiLFxuICBERVNDOiBcImRlc2NcIlxufTsiLCJ2YXIgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcbnZhciB0cztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgYXJncykge1xuICBpZiAoIWNvbmZpZy5kZWJ1ZykgcmV0dXJuO1xuICB2YXIgbG9nID0gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQuY2FsbChjb25zb2xlLmxvZywgY29uc29sZSk7XG4gIGFyZ3MudW5zaGlmdChpbnB1dC5zdGFtcHx8LTEpO1xuICBhcmdzLnVuc2hpZnQoRGF0ZS5ub3coKSAtIHRzKTtcbiAgaWYoaW5wdXQuYWRkKSBhcmdzLnB1c2goaW5wdXQuYWRkLmxlbmd0aCwgaW5wdXQubW9kLmxlbmd0aCwgaW5wdXQucmVtLmxlbmd0aCwgISFpbnB1dC5yZWZsb3cpO1xuICBsb2cuYXBwbHkoY29uc29sZSwgYXJncyk7XG4gIHRzID0gRGF0ZS5ub3coKTtcbn07IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHF1aWNrc2VsZWN0KGssIHgsIGMpIHtcbiAgZnVuY3Rpb24gc3dhcChhLCBiKSB7XG4gICAgdmFyIHQgPSB4W2FdO1xuICAgIHhbYV0gPSB4W2JdO1xuICAgIHhbYl0gPSB0O1xuICB9XG5cbiAgLy8geCBtYXkgYmUgbnVsbCwgaW4gd2hpY2ggY2FzZSBhc3NlbWJsZSBhbiBhcnJheSBmcm9tIGMgKGNvdW50cylcbiAgaWYoeCA9PT0gbnVsbCkge1xuICAgIHggPSBbXTtcbiAgICBkbC5rZXlzKGMpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgdmFyIGkgPSAwLCBsZW4gPSBjW2tdO1xuICAgICAgayA9ICtrIHx8IGs7XG4gICAgICBmb3IoOyBpPGxlbjsgKytpKSB4LnB1c2goayk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIHZhciBsZWZ0ID0gMCxcbiAgICAgIHJpZ2h0ID0geC5sZW5ndGggLSAxLFxuICAgICAgcG9zLCBpLCBwaXZvdDtcbiAgXG4gIHdoaWxlIChsZWZ0IDwgcmlnaHQpIHtcbiAgICBwaXZvdCA9IHhba107XG4gICAgc3dhcChrLCByaWdodCk7XG4gICAgZm9yIChpID0gcG9zID0gbGVmdDsgaSA8IHJpZ2h0OyArK2kpIHtcbiAgICAgIGlmICh4W2ldIDwgcGl2b3QpIHsgc3dhcChpLCBwb3MrKyk7IH1cbiAgICB9XG4gICAgc3dhcChyaWdodCwgcG9zKTtcbiAgICBpZiAocG9zID09PSBrKSBicmVhaztcbiAgICBpZiAocG9zIDwgaykgbGVmdCA9IHBvcyArIDE7XG4gICAgZWxzZSByaWdodCA9IHBvcyAtIDE7XG4gIH1cbiAgcmV0dXJuIHhba107XG59OyJdfQ==
