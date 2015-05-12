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
},{"./core/View":28,"./dataflow/Datasource":30,"./dataflow/Graph":31,"./dataflow/Node":32,"./dataflow/changeset":34,"./parse/spec":53,"./scene/Builder":66,"./scene/GroupBuilder":68,"./transforms/index":88,"./util/config":91,"datalib":16}],2:[function(require,module,exports){

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

read.infer = infer;
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
  return !isNaN(parseFloat(obj)) && isFinite(obj);
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
};

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

},{"../dataflow/Node":32,"../dataflow/changeset":34,"../parse/streams":54,"../render/canvas/index":58,"../render/svg/index":63,"../scene/Transition":71,"../util/config":91,"../util/debug":93,"datalib":16}],29:[function(require,module,exports){
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

  if(input.reflow) {
    input = changeset.create(input);
    input.mod = this._data.slice();
    return input;
  }

  if(input.rem.length) {
    var ids = input.rem.reduce(function(m,x) { return (m[x._id]=1, m); }, {});
    this._data = this._data.filter(function(x) { return ids[x._id] !== 1; });
  }

  if(input.add.length) {
    this._data = this._data.length ? this._data.concat(input.add) : input.add;
  }

  if(input.sort) {
    this._data.sort(input.sort);
  }

  return input;
};

module.exports = Collector;
},{"../util/constants":92,"../util/debug":93,"./Node":32,"./changeset":34}],30:[function(require,module,exports){
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
},{"../util/constants":92,"../util/debug":93,"./Collector":29,"./Node":32,"./changeset":34,"./tuple":35,"datalib":16}],31:[function(require,module,exports){
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
  var db = this._data;
  if(!arguments.length) return dl.keys(db).map(function(d) { return db[d]; });
  if(arguments.length === 1) return db[name];
  return (db[name] = new Datasource(this, name, facet).pipeline(pipeline));
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
  if(!arguments.length) name = dl.keys(this._signals);
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
},{"../util/constants":92,"../util/debug":93,"./Datasource":30,"./Signal":33,"./changeset":34,"datalib":16,"heap":24}],32:[function(require,module,exports){
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
},{"../util/constants":92,"datalib":16}],33:[function(require,module,exports){
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
},{"../util/constants":92}],35:[function(require,module,exports){
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
},{"../util/constants":92,"datalib":16}],36:[function(require,module,exports){
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
},{"../scene/axis":72,"../util/config":91,"datalib":16}],42:[function(require,module,exports){
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
},{"../util/config":91,"./modify":48,"./transforms":55,"datalib":16}],43:[function(require,module,exports){
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
},{"../util/config":91,"../util/constants":92,"datalib":16}],46:[function(require,module,exports){
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
},{"../dataflow/Node":32,"../dataflow/tuple":35,"../util/constants":92,"../util/debug":93,"datalib":16}],49:[function(require,module,exports){
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
        var pred = model.predicate(o.predicate),
            p = "predicates["+dl.str(o.predicate)+"]";

        pred.signals.forEach(function(s) { signals[s] = 1; });
        pred.data.forEach(function(d) { db[d] = 1 });

        dl.keys(o.input).forEach(function(k) {
          var i = o.input[k], signal;
          def += "args["+dl.str(k)+"] = ";
          if(i.signal)   def += parseSignal(i.signal, signals);
          else if(i.arg) def += "args["+dl.str(i.arg)+"]";
          def+=", ";
        });

        def+= p+".call("+p+", args, db, signals, predicates)";
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
    var o = [spec.item], code = "";
    if(spec.range) o.push.apply(o, spec.range);
    if(spec.scale) {
      code = parseScale(spec.scale, o);
    }

    var ops = parseOperands(o);
    code = ops.code + code;

    if(spec.data) {
      var field = dl.field(spec.field).map(dl.str);
      code += "var where = function(d) { return d["+field.join("][")+"] == o0 };\n";
      code += "return db["+dl.str(spec.data)+"].filter(where).length > 0;";
    } else if(spec.range) {
      // TODO: inclusive/exclusive range?
      // TODO: inverting ordinal scales
      if(spec.scale) code += "o1 = scale(o1);\no2 = scale(o2);\n";
      code += "return o1 < o2 ? o1 <= o0 && o0 <= o2 : o2 <= o0 && o0 <= o1";
    }

    return {
      code: code, 
      signals: ops.signals, 
      data: ops.data.concat(spec.data ? [spec.data] : [])
    };
  };

  // Populate ops such that ultimate scale/inversion function will be in `scale` var. 
  function parseScale(spec, ops) {
    var code = "var scale = ", 
        idx  = ops.length;

    if(dl.isString(spec)) {
      ops.push({ value: spec });
      code += "this.root().scale(o"+idx+")";
    } else if(spec.arg) {  // Scale function is being passed as an arg
      ops.push(spec);
      code += "o"+idx;
    } else if(spec.name) { // Full scale parameter {name: ..}
      ops.push(dl.isString(spec.name) ? {value: spec.name} : spec.name);
      code += "(this.isFunction(o"+idx+") ? o"+idx+" : ";
      if(spec.scope) {
        ops.push(spec.scope);
        code += "(o"+(idx+1)+".scale || this.root().scale)(o"+idx+")";
      } else {
        code += "this.root().scale(o"+idx+")";
      }
      code += ")"
    }

    if(spec.invert === true) {  // Allow spec.invert.arg?
      code += ".invert"
    }

    return code+";\n";
  }

  (spec || []).forEach(function(s) {
    var parse = types[s.type](s),
        pred  = Function("args", "db", "signals", "predicates", parse.code);
    pred.root = function() { return model.scene().items[0] }; // For global scales
    pred.isFunction = dl.isFunction;
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

var DEPS = ["signals", "scales", "data", "fields"];

function compile(model, mark, spec) {
  var code = "",
      names = dl.keys(spec),
      i, len, name, ref, vars = {}, 
      deps = {
        signals: {},
        scales:  {},
        data:    {},
        fields:  {}
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
    DEPS.forEach(function(p) {
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
      encode:  encoder,
      signals: dl.keys(deps.signals),
      scales:  dl.keys(deps.scales),
      data:    dl.keys(deps.data),
      fields:  dl.keys(deps.fields)
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

function rule(model, name, rules) {
  var signals = [], scales = [], db = [],
      inputs = [], code = "";

  (rules||[]).forEach(function(r, i) {
    var predName = r.predicate,
        pred = model.predicate(predName),
        p = "predicates["+dl.str(predName)+"]",
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
      code += "if("+p+".call("+p+","+args+", db, signals, predicates)) {\n" +
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

  if (name==="fill" || name==="stroke") {
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
  var val = null, scale = null, 
      sgRef = {}, fRef = {}, sRef = {},
      signals = [], fields = [], group = false;

  if (ref.value !== undefined) {
    val = dl.str(ref.value);
  }

  if (ref.signal !== undefined) {
    sgRef = dl.field(ref.signal);
    val = "signals["+sgRef.map(dl.str).join("][")+"]"; 
    signals.push(sgRef.shift());
  }

  if(ref.field !== undefined) {
    ref.field = dl.isString(ref.field) ? {datum: ref.field} : ref.field;
    fRef  = fieldRef(ref.field);
    val = fRef.val;
  }

  if (ref.scale !== undefined) {
    sRef = scaleRef(ref.scale);
    scale = sRef.val;

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

  // Collate dependencies
  return {
    val: val,
    signals: signals.concat(dl.array(fRef.signals)).concat(dl.array(sRef.signals)),
    fields:  fields.concat(dl.array(fRef.fields)).concat(dl.array(sRef.fields)),
    scales:  ref.scale ? (ref.scale.name || ref.scale) : null, // TODO: connect sRef'd scale?
    group:   group || fRef.group || sRef.group
  };
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

// {field: {datum: "foo"} }  -> item.datum.foo
// {field: {group: "foo"} }  -> group.foo
// {field: {parent: "foo"} } -> group.datum.foo
function fieldRef(ref) {
  if(dl.isString(ref)) {
    return {val: dl.field(ref).map(dl.str).join("][")};
  } 

  // Resolve nesting/parent lookups
  var l = ref.level,
      nested = (ref.group || ref.parent) && l,
      scope = nested ? Array(l).join("group.mark.") : "",
      r = fieldRef(ref.datum || ref.group || ref.parent || ref.signal),
      val = r.val,
      fields  = r.fields  || [],
      signals = r.signals || [],
      group   = r.group   || false;

  if(ref.datum) {
    fields.push(val);
    val = "item.datum["+val+"]";
  } else if(ref.group) {
    group = true;
    val = scope+"group["+val+"]";
  } else if(ref.parent) {
    group = true;
    val = scope+"group.datum["+val+"]";
  } else if(ref.signal) {
    val = "signals["+val+"]";
    signals.push(dl.field(ref.signal)[0]);
  }

  return {val: val, fields: fields, signals: signals, group: group};
}

// {scale: "x"}
// {scale: {name: "x"}},
// {scale: fieldRef}
function scaleRef(ref) {
  var scale = null,
      fr = null;

  if(dl.isString(ref)) {
    scale = dl.str(ref);
  } else if(ref.name) {
    scale = dl.isString(ref.name) ? dl.str(ref.name) : (fr = fieldRef(ref.name)).val;
  } else {
    scale = (fr = fieldRef(ref)).val;
  }

  scale = "group.scale("+scale+")";
  if(ref.invert) scale += ".invert";  // TODO: ordinal scales

  return fr ? (fr.val = scale, fr) : {val: scale};
}

module.exports = compile;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../dataflow/tuple":35,"../util/config":91,"datalib":16}],52:[function(require,module,exports){
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
},{"../util/constants":92,"./expr":44}],53:[function(require,module,exports){
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

  function scale(spec, value) {
    var def = spec.scale,
        name  = def.name || def.signal || def,
        scope = def.scope ? graph.signalRef(def.scope.signal) : null;

    if(!scope || !scope.scale) {
      scope = (scope && scope.mark) ? scope.mark.group : model.scene().items[0];
    }

    var scale = scope.scale(name);
    if(!scale) return value;
    return def.invert ? scale.invert(value) : scale(value);
  }

  function signal(sig, selector, exp, spec) {
    var n = new Node(graph);
    n.evaluate = function(input) {
      if(!input.signals[selector.signal]) return graph.doNotPropagate;
      var val = expr.eval(graph, exp.fn, null, null, null, null, exp.signals);
      if(spec.scale) val = scale(spec, val);
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

},{"../dataflow/Node":32,"../dataflow/changeset":34,"../util/constants":92,"./events":43,"./expr":44,"datalib":16}],55:[function(require,module,exports){
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
},{"../transforms/index":88,"datalib":16}],56:[function(require,module,exports){
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

},{"../../core/Bounds":26,"../../util/config":91,"./marks":59,"datalib":16}],58:[function(require,module,exports){
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
},{"../../core/Bounds":26,"../../util/bounds":90,"../../util/config":91,"./path":60}],60:[function(require,module,exports){
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

},{"../../util/config":91,"datalib":16}],65:[function(require,module,exports){
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
},{"../dataflow/Node":32,"../util/bounds":90,"../util/constants":92,"../util/debug":93}],66:[function(require,module,exports){
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
},{"../dataflow/Node":32,"../dataflow/changeset":34,"../dataflow/tuple":35,"../parse/data":42,"../util/constants":92,"../util/debug":93,"./Bounder":65,"./Encoder":67,"./Item":69,"datalib":16}],67:[function(require,module,exports){
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
    this.dependency(C.FIELDS, update.fields);
  }

  return this;
}

var proto = (Encoder.prototype = new Node());

proto.evaluate = function(input) {
  debug(input, ["encoding", this._mark.def.type]);
  var graph = this._graph,
      items = this._mark.items,
      props = this._mark.def.properties || {},
      enter  = props.enter,
      update = props.update,
      exit   = props.exit,
      sg = graph.signalValues(),  // For expediency, get all signal values
      db, i, len, item;

  db = graph.data().reduce(function(db, ds) { 
    return (db[ds.name()] = ds.values(), db);
  }, {});

  // Items marked for removal are at the head of items. Process them first.
  for(i=0, len=input.rem.length; i<len; ++i) {
    item = input.rem[i];
    if(update) encode.call(this, update, item, input.trans, db, sg);
    if(exit)   encode.call(this, exit,   item, input.trans), db, sg; 
    if(input.trans && !exit) input.trans.interpolate(item, EMPTY);
    else if(!input.trans) item.remove();
  }

  for(i=0, len=input.add.length; i<len; ++i) {
    item = input.add[i];
    if(enter)  encode.call(this, enter,  item, input.trans, db, sg);
    if(update) encode.call(this, update, item, input.trans, db, sg);
    item.status = C.UPDATE;
  }

  if(update) {
    for(i=0, len=input.mod.length; i<len; ++i) {
      item = input.mod[i];
      encode.call(this, update, item, input.trans, db, sg);
    }
  }

  return input;
};

function encode(prop, item, trans, db, sg) {
  var enc = prop.encode;
  enc.call(enc, item, item.mark.group||item, trans, db, sg, this._model.predicates());
}

// If update property set uses a group property, reevaluate all items.
proto.reevaluate = function(pulse) {
  var props = this._mark.def.properties || {},
      update = props.update;
  return Node.prototype.reevaluate.call(this, pulse) || (update ? update.group : false);
};

module.exports = Encoder;
},{"../dataflow/Node":32,"../util/constants":92,"../util/debug":93}],68:[function(require,module,exports){
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
},{"../dataflow/Collector":29,"../dataflow/Node":32,"../parse/axes":41,"../util/constants":92,"../util/debug":93,"./Builder":66,"./Scale":70,"datalib":16}],69:[function(require,module,exports){
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
  if (dl.isArray(def)) return def.map(signal.bind(this));

  var self = this, graph = this._graph,
      refs = def.fields || dl.array(def),
      uniques = scale.type === C.ORDINAL || scale.type === C.QUANTILE,
      ck = "_"+which,
      cache = scale[ck],
      cacheField = {ops: []},  // the field and measures in the aggregator
      sort = def.sort,
      i, rlen, j, flen, r, fields, from, data, keys;

  if(!cache) {
    cache = scale[ck] = new Aggregate(graph);
    cacheField.ops = [];
    cache.singleton(true);
    if(uniques && sort) cacheField.ops.push(sort.stat);
  }

  for(i=0, rlen=refs.length; i<rlen; ++i) {
    r = refs[i];
    from = r.data || "vg_"+group.datum._id;
    data = graph.data(from)
      .revises(true)
      .last();

    if (data.stamp <= this._stamp) continue;

    fields = dl.array(r.field).map(function(f) {
      if (f.parent) return dl.accessor(f.parent)(group.datum)
      return f; // String or {"signal"}
    });

    if(uniques) {
      cacheField.name = sort ? sort.field : "_id";
      cache.fields.set(cache, [cacheField]);
      for(j=0, flen=fields.length; j<flen; ++j) {
        cache.group_by.set(cache, fields[j])
          .evaluate(data);
      }
    } else {
      for(j=0, flen=fields.length; j<flen; ++j) {
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

},{"../dataflow/Node":32,"../dataflow/changeset":34,"../transforms/Aggregate":73,"../util/config":91,"../util/constants":92,"../util/debug":93,"datalib":16}],71:[function(require,module,exports){
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
},{"../dataflow/tuple":35,"../util/bounds":90,"../util/constants":92}],72:[function(require,module,exports){
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
      ? {field: {group: "height", level: 2}, mult: -sign}
      : {field: {group: "width",  level: 2}, mult: -sign};
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
},{"../dataflow/tuple":35,"../parse/mark":46,"../util/config":91,"datalib":16}],73:[function(require,module,exports){
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
},{"../dataflow/changeset":34,"../dataflow/tuple":35,"../util/constants":92,"../util/debug":93,"./GroupBy":81,"./Transform":85,"./measures":89,"datalib":16}],74:[function(require,module,exports){
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
},{"../dataflow/tuple":35,"./Transform":85,"datalib":16}],75:[function(require,module,exports){
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
},{"../dataflow/Collector":29,"../dataflow/changeset":34,"../dataflow/tuple":35,"../util/debug":93,"./Transform":85}],76:[function(require,module,exports){
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
},{"../dataflow/changeset":34,"../dataflow/tuple":35,"../util/constants":92,"../util/debug":93,"./GroupBy":81,"./Transform":85}],77:[function(require,module,exports){
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
},{"../dataflow/changeset":34,"../parse/expr":44,"../util/constants":92,"../util/debug":93,"./Transform":85}],78:[function(require,module,exports){
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
},{"../dataflow/changeset":34,"../dataflow/tuple":35,"../util/debug":93,"./Transform":85}],79:[function(require,module,exports){
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
    "x": "force:x",
    "y": "force:y",
    "source": "force:source",
    "target": "force:target"
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

},{"../dataflow/Collector":29,"../dataflow/changeset":34,"../dataflow/tuple":35,"./Transform":85}],80:[function(require,module,exports){
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
},{"../dataflow/tuple":35,"../parse/expr":44,"../util/constants":92,"../util/debug":93,"./Transform":85}],81:[function(require,module,exports){
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
},{"../dataflow/changeset":34,"../dataflow/tuple":35,"../util/constants":92,"./Transform":85}],82:[function(require,module,exports){
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
},{"../parse/expr":44,"../util/constants":92,"datalib":16}],83:[function(require,module,exports){
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
},{"../parse/expr":44,"../util/debug":93,"./Transform":85,"datalib":16}],84:[function(require,module,exports){
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
    "start": "y2",
    "stop": "y",
    "mid": "cy"
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
},{"../dataflow/Collector":29,"../dataflow/changeset":34,"../dataflow/tuple":35,"./Transform":85,"datalib":16}],85:[function(require,module,exports){
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
},{"../dataflow/Node":32,"../util/constants":92,"./Parameter":82}],86:[function(require,module,exports){
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
},{"../dataflow/tuple":35,"../util/debug":93,"./GroupBy":81,"./Transform":85}],87:[function(require,module,exports){
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
},{"../dataflow/Collector":29,"../util/debug":93,"./Transform":85,"datalib":16}],88:[function(require,module,exports){
module.exports = {
  aggregate:  require('./Aggregate'),
  bin:        require('./Bin'),
  cross:      require('./Cross'),
  facet:      require('./Facet'),
  filter:     require('./Filter'),
  fold:       require('./Fold'),
  force:      require('./Force'),
  formula:    require('./Formula'),
  sort:       require('./Sort'),
  stack:      require('./Stack'),
  unique:     require('./Unique'),
  zip:        require('./Zip')
};
},{"./Aggregate":73,"./Bin":74,"./Cross":75,"./Facet":76,"./Filter":77,"./Fold":78,"./Force":79,"./Formula":80,"./Sort":83,"./Stack":84,"./Unique":86,"./Zip":87}],89:[function(require,module,exports){
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
},{"../dataflow/tuple":35,"../util/constants":92,"../util/quickselect":94,"datalib":16}],90:[function(require,module,exports){
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

},{"../core/Bounds":26,"../render/canvas/path":60,"./config":91}],91:[function(require,module,exports){
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

},{}],92:[function(require,module,exports){
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
},{}],93:[function(require,module,exports){
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
},{"./config":91}],94:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9iaW4uanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvZ2VuZXJhdGUuanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvaW1wb3J0L2Zvcm1hdHMvY3N2LmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL2ltcG9ydC9mb3JtYXRzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL2ltcG9ydC9mb3JtYXRzL2pzb24uanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvaW1wb3J0L2Zvcm1hdHMvdG9wb2pzb24uanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvaW1wb3J0L2Zvcm1hdHMvdHJlZWpzb24uanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvaW1wb3J0L2Zvcm1hdHMvdHN2LmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL2ltcG9ydC9pbmZlci10eXBlcy5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9pbXBvcnQvbG9hZC5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9pbXBvcnQvbG9hZGVycy5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9pbXBvcnQvcmVhZC5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9sb2cuanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvc3RhdHMuanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvc3VtbWFyeS5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy90ZW1wbGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy90cmVlLmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL3RydW5jYXRlLmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL3V0aWwuanMiLCJub2RlX21vZHVsZXMvaGVhcC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9oZWFwL2xpYi9oZWFwLmpzIiwic3JjL2NvcmUvQm91bmRzLmpzIiwic3JjL2NvcmUvTW9kZWwuanMiLCJzcmMvY29yZS9WaWV3LmpzIiwic3JjL2RhdGFmbG93L0NvbGxlY3Rvci5qcyIsInNyYy9kYXRhZmxvdy9EYXRhc291cmNlLmpzIiwic3JjL2RhdGFmbG93L0dyYXBoLmpzIiwic3JjL2RhdGFmbG93L05vZGUuanMiLCJzcmMvZGF0YWZsb3cvU2lnbmFsLmpzIiwic3JjL2RhdGFmbG93L2NoYW5nZXNldC5qcyIsInNyYy9kYXRhZmxvdy90dXBsZS5qcyIsInNyYy9leHByZXNzaW9uL2NvZGVnZW4uanMiLCJzcmMvZXhwcmVzc2lvbi9jb25zdGFudHMuanMiLCJzcmMvZXhwcmVzc2lvbi9mdW5jdGlvbnMuanMiLCJzcmMvZXhwcmVzc2lvbi9pbmRleC5qcyIsInNyYy9leHByZXNzaW9uL3BhcnNlci5qcyIsInNyYy9wYXJzZS9heGVzLmpzIiwic3JjL3BhcnNlL2RhdGEuanMiLCJzcmMvcGFyc2UvZXZlbnRzLmpzIiwic3JjL3BhcnNlL2V4cHIuanMiLCJzcmMvcGFyc2UvaW50ZXJhY3RvcnMuanMiLCJzcmMvcGFyc2UvbWFyay5qcyIsInNyYy9wYXJzZS9tYXJrcy5qcyIsInNyYy9wYXJzZS9tb2RpZnkuanMiLCJzcmMvcGFyc2UvcGFkZGluZy5qcyIsInNyYy9wYXJzZS9wcmVkaWNhdGVzLmpzIiwic3JjL3BhcnNlL3Byb3BlcnRpZXMuanMiLCJzcmMvcGFyc2Uvc2lnbmFscy5qcyIsInNyYy9wYXJzZS9zcGVjLmpzIiwic3JjL3BhcnNlL3N0cmVhbXMuanMiLCJzcmMvcGFyc2UvdHJhbnNmb3Jtcy5qcyIsInNyYy9yZW5kZXIvY2FudmFzL0hhbmRsZXIuanMiLCJzcmMvcmVuZGVyL2NhbnZhcy9SZW5kZXJlci5qcyIsInNyYy9yZW5kZXIvY2FudmFzL2luZGV4LmpzIiwic3JjL3JlbmRlci9jYW52YXMvbWFya3MuanMiLCJzcmMvcmVuZGVyL2NhbnZhcy9wYXRoLmpzIiwic3JjL3JlbmRlci9zdmcvSGFuZGxlci5qcyIsInNyYy9yZW5kZXIvc3ZnL1JlbmRlcmVyLmpzIiwic3JjL3JlbmRlci9zdmcvbWFya3MuanMiLCJzcmMvc2NlbmUvQm91bmRlci5qcyIsInNyYy9zY2VuZS9CdWlsZGVyLmpzIiwic3JjL3NjZW5lL0VuY29kZXIuanMiLCJzcmMvc2NlbmUvR3JvdXBCdWlsZGVyLmpzIiwic3JjL3NjZW5lL0l0ZW0uanMiLCJzcmMvc2NlbmUvU2NhbGUuanMiLCJzcmMvc2NlbmUvVHJhbnNpdGlvbi5qcyIsInNyYy9zY2VuZS9heGlzLmpzIiwic3JjL3RyYW5zZm9ybXMvQWdncmVnYXRlLmpzIiwic3JjL3RyYW5zZm9ybXMvQmluLmpzIiwic3JjL3RyYW5zZm9ybXMvQ3Jvc3MuanMiLCJzcmMvdHJhbnNmb3Jtcy9GYWNldC5qcyIsInNyYy90cmFuc2Zvcm1zL0ZpbHRlci5qcyIsInNyYy90cmFuc2Zvcm1zL0ZvbGQuanMiLCJzcmMvdHJhbnNmb3Jtcy9Gb3JjZS5qcyIsInNyYy90cmFuc2Zvcm1zL0Zvcm11bGEuanMiLCJzcmMvdHJhbnNmb3Jtcy9Hcm91cEJ5LmpzIiwic3JjL3RyYW5zZm9ybXMvUGFyYW1ldGVyLmpzIiwic3JjL3RyYW5zZm9ybXMvU29ydC5qcyIsInNyYy90cmFuc2Zvcm1zL1N0YWNrLmpzIiwic3JjL3RyYW5zZm9ybXMvVHJhbnNmb3JtLmpzIiwic3JjL3RyYW5zZm9ybXMvVW5pcXVlLmpzIiwic3JjL3RyYW5zZm9ybXMvWmlwLmpzIiwic3JjL3RyYW5zZm9ybXMvaW5kZXguanMiLCJzcmMvdHJhbnNmb3Jtcy9tZWFzdXJlcy5qcyIsInNyYy91dGlsL2JvdW5kcy5qcyIsInNyYy91dGlsL2NvbmZpZy5qcyIsInNyYy91dGlsL2NvbnN0YW50cy5qcyIsInNyYy91dGlsL2RlYnVnLmpzIiwic3JjL3V0aWwvcXVpY2tzZWxlY3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25OQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2owRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3Y2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMvSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDblJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDbEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFOQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDanVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDck5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Z0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNqVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgY29yZToge1xuICAgIFZpZXc6IHJlcXVpcmUoJy4vY29yZS9WaWV3JylcbiAgfSxcbiAgZGF0YWZsb3c6IHtcbiAgICBjaGFuZ2VzZXQ6IHJlcXVpcmUoJy4vZGF0YWZsb3cvY2hhbmdlc2V0JyksXG4gICAgRGF0YXNvdXJjZTogcmVxdWlyZSgnLi9kYXRhZmxvdy9EYXRhc291cmNlJyksXG4gICAgR3JhcGg6IHJlcXVpcmUoJy4vZGF0YWZsb3cvR3JhcGgnKSxcbiAgICBOb2RlOiByZXF1aXJlKCcuL2RhdGFmbG93L05vZGUnKVxuICB9LFxuICBwYXJzZToge1xuICAgIHNwZWM6IHJlcXVpcmUoJy4vcGFyc2Uvc3BlYycpXG4gIH0sXG4gIHNjZW5lOiB7XG4gICAgQnVpbGRlcjogcmVxdWlyZSgnLi9zY2VuZS9CdWlsZGVyJyksXG4gICAgR3JvdXBCdWlsZGVyOiByZXF1aXJlKCcuL3NjZW5lL0dyb3VwQnVpbGRlcicpXG4gIH0sXG4gIHRyYW5zZm9ybXM6IHJlcXVpcmUoJy4vdHJhbnNmb3Jtcy9pbmRleCcpLFxuICBjb25maWc6IHJlcXVpcmUoJy4vdXRpbC9jb25maWcnKSxcbiAgdXRpbDogcmVxdWlyZSgnZGF0YWxpYicpXG59OyIsbnVsbCwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuICAgIHZhciBjdXJyZW50UXVldWU7XG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHZhciBpID0gLTE7XG4gICAgICAgIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtpXSgpO1xuICAgICAgICB9XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbn1cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgcXVldWUucHVzaChmdW4pO1xuICAgIGlmICghZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0KSB7XG4gIG9wdCA9IG9wdCB8fCB7fTtcblxuICAvLyBkZXRlcm1pbmUgcmFuZ2VcbiAgdmFyIG1heGIgPSBvcHQubWF4YmlucyB8fCAxMDI0LFxuICAgICAgYmFzZSA9IG9wdC5iYXNlIHx8IDEwLFxuICAgICAgZGl2ID0gb3B0LmRpdiB8fCBbNSwgMl0sXG4gICAgICBtaW5zID0gb3B0Lm1pbnN0ZXAgfHwgMCxcbiAgICAgIGxvZ2IgPSBNYXRoLmxvZyhiYXNlKSxcbiAgICAgIGxldmVsID0gTWF0aC5jZWlsKE1hdGgubG9nKG1heGIpIC8gbG9nYiksXG4gICAgICBtaW4gPSBvcHQubWluLFxuICAgICAgbWF4ID0gb3B0Lm1heCxcbiAgICAgIHNwYW4gPSBtYXggLSBtaW4sXG4gICAgICBzdGVwID0gTWF0aC5tYXgobWlucywgTWF0aC5wb3coYmFzZSwgTWF0aC5yb3VuZChNYXRoLmxvZyhzcGFuKSAvIGxvZ2IpIC0gbGV2ZWwpKSxcbiAgICAgIG5iaW5zID0gTWF0aC5jZWlsKHNwYW4gLyBzdGVwKSxcbiAgICAgIHByZWNpc2lvbiwgdiwgaSwgZXBzO1xuXG4gIGlmIChvcHQuc3RlcCAhPSBudWxsKSB7XG4gICAgc3RlcCA9IG9wdC5zdGVwO1xuICB9IGVsc2UgaWYgKG9wdC5zdGVwcykge1xuICAgIC8vIGlmIHByb3ZpZGVkLCBsaW1pdCBjaG9pY2UgdG8gYWNjZXB0YWJsZSBzdGVwIHNpemVzXG4gICAgc3RlcCA9IG9wdC5zdGVwc1tNYXRoLm1pbihcbiAgICAgICAgb3B0LnN0ZXBzLmxlbmd0aCAtIDEsXG4gICAgICAgIGJpc2VjdExlZnQob3B0LnN0ZXBzLCBzcGFuIC8gbWF4YiwgMCwgb3B0LnN0ZXBzLmxlbmd0aClcbiAgICApXTtcbiAgfSBlbHNlIHtcbiAgICAvLyBpbmNyZWFzZSBzdGVwIHNpemUgaWYgdG9vIG1hbnkgYmluc1xuICAgIGRvIHtcbiAgICAgIHN0ZXAgKj0gYmFzZTtcbiAgICAgIG5iaW5zID0gTWF0aC5jZWlsKHNwYW4gLyBzdGVwKTtcbiAgICB9IHdoaWxlIChuYmlucyA+IG1heGIpO1xuXG4gICAgLy8gZGVjcmVhc2Ugc3RlcCBzaXplIGlmIGFsbG93ZWRcbiAgICBmb3IgKGkgPSAwOyBpIDwgZGl2Lmxlbmd0aDsgKytpKSB7XG4gICAgICB2ID0gc3RlcCAvIGRpdltpXTtcbiAgICAgIGlmICh2ID49IG1pbnMgJiYgc3BhbiAvIHYgPD0gbWF4Yikge1xuICAgICAgICBzdGVwID0gdjtcbiAgICAgICAgbmJpbnMgPSBNYXRoLmNlaWwoc3BhbiAvIHN0ZXApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIHVwZGF0ZSBwcmVjaXNpb24sIG1pbiBhbmQgbWF4XG4gIHYgPSBNYXRoLmxvZyhzdGVwKTtcbiAgcHJlY2lzaW9uID0gdiA+PSAwID8gMCA6IH5+KC12IC8gbG9nYikgKyAxO1xuICBlcHMgPSAobWluPDAgPyAtMSA6IDEpICogTWF0aC5wb3coYmFzZSwgLXByZWNpc2lvbiAtIDEpO1xuICBtaW4gPSBNYXRoLm1pbihtaW4sIE1hdGguZmxvb3IobWluIC8gc3RlcCArIGVwcykgKiBzdGVwKTtcbiAgbWF4ID0gTWF0aC5jZWlsKG1heCAvIHN0ZXApICogc3RlcDtcblxuICByZXR1cm4ge1xuICAgIHN0YXJ0OiBtaW4sXG4gICAgc3RvcDogbWF4LFxuICAgIHN0ZXA6IHN0ZXAsXG4gICAgdW5pdDogcHJlY2lzaW9uXG4gIH07XG59O1xuXG5mdW5jdGlvbiBiaXNlY3RMZWZ0KGEsIHgsIGxvLCBoaSkge1xuICB3aGlsZSAobG8gPCBoaSkge1xuICAgIHZhciBtaWQgPSBsbyArIGhpID4+PiAxO1xuICAgIGlmICh1LmNtcChhW21pZF0sIHgpIDwgMCkgeyBsbyA9IG1pZCArIDE7IH1cbiAgICBlbHNlIHsgaGkgPSBtaWQ7IH1cbiAgfVxuICByZXR1cm4gbG87XG59IiwidmFyIGdlbiA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbmdlbi5yZXBlYXQgPSBmdW5jdGlvbih2YWwsIG4pIHtcbiAgdmFyIGEgPSBBcnJheShuKSwgaTtcbiAgZm9yIChpPTA7IGk8bjsgKytpKSBhW2ldID0gdmFsO1xuICByZXR1cm4gYTtcbn07XG5cbmdlbi56ZXJvZXMgPSBmdW5jdGlvbihuKSB7XG4gIHJldHVybiBnZW4ucmVwZWF0KDAsIG4pO1xufTtcblxuZ2VuLnJhbmdlID0gZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgc3RlcCA9IDE7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG4gICAgICBzdG9wID0gc3RhcnQ7XG4gICAgICBzdGFydCA9IDA7XG4gICAgfVxuICB9XG4gIGlmICgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXAgPT0gSW5maW5pdHkpIHRocm93IG5ldyBFcnJvcignSW5maW5pdGUgcmFuZ2UnKTtcbiAgdmFyIHJhbmdlID0gW10sIGkgPSAtMSwgajtcbiAgaWYgKHN0ZXAgPCAwKSB3aGlsZSAoKGogPSBzdGFydCArIHN0ZXAgKiArK2kpID4gc3RvcCkgcmFuZ2UucHVzaChqKTtcbiAgZWxzZSB3aGlsZSAoKGogPSBzdGFydCArIHN0ZXAgKiArK2kpIDwgc3RvcCkgcmFuZ2UucHVzaChqKTtcbiAgcmV0dXJuIHJhbmdlO1xufTtcblxuZ2VuLnJhbmRvbSA9IHt9O1xuXG5nZW4ucmFuZG9tLnVuaWZvcm0gPSBmdW5jdGlvbihtaW4sIG1heCkge1xuXHRtaW4gPSBtaW4gfHwgMDtcblx0bWF4ID0gbWF4IHx8IDE7XG5cdHZhciBkZWx0YSA9IG1heCAtIG1pbjtcblx0dmFyIGYgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gbWluICsgZGVsdGEgKiBNYXRoLnJhbmRvbSgpO1xuXHR9O1xuXHRmLnNhbXBsZXMgPSBmdW5jdGlvbihuKSB7IHJldHVybiBnZW4uemVyb2VzKG4pLm1hcChmKTsgfTtcblx0cmV0dXJuIGY7XG59O1xuXG5nZW4ucmFuZG9tLmludGVnZXIgPSBmdW5jdGlvbihhLCBiKSB7XG5cdGlmIChiID09PSB1bmRlZmluZWQpIHtcblx0XHRiID0gYTtcblx0XHRhID0gMDtcblx0fVxuXHR2YXIgZiA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBhICsgTWF0aC5tYXgoMCwgTWF0aC5mbG9vcihiKihNYXRoLnJhbmRvbSgpLTAuMDAxKSkpO1xuXHR9O1xuXHRmLnNhbXBsZXMgPSBmdW5jdGlvbihuKSB7IHJldHVybiBnZW4uemVyb2VzKG4pLm1hcChmKTsgfTtcblx0cmV0dXJuIGY7XG59O1xuXG5nZW4ucmFuZG9tLm5vcm1hbCA9IGZ1bmN0aW9uKG1lYW4sIHN0ZGV2KSB7XG5cdG1lYW4gPSBtZWFuIHx8IDA7XG5cdHN0ZGV2ID0gc3RkZXYgfHwgMTtcblx0dmFyIG5leHQgPSB1bmRlZmluZWQ7XG5cdHZhciBmID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHggPSAwLCB5ID0gMCwgcmRzLCBjO1xuXHRcdGlmIChuZXh0ICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHggPSBuZXh0O1xuXHRcdFx0bmV4dCA9IHVuZGVmaW5lZDtcblx0XHRcdHJldHVybiB4O1xuXHRcdH1cblx0XHRkbyB7XG5cdFx0XHR4ID0gTWF0aC5yYW5kb20oKSoyLTE7XG5cdFx0XHR5ID0gTWF0aC5yYW5kb20oKSoyLTE7XG5cdFx0XHRyZHMgPSB4KnggKyB5Knk7XG5cdFx0fSB3aGlsZSAocmRzID09IDAgfHwgcmRzID4gMSk7XG5cdFx0YyA9IE1hdGguc3FydCgtMipNYXRoLmxvZyhyZHMpL3Jkcyk7IC8vIEJveC1NdWxsZXIgdHJhbnNmb3JtXG5cdFx0bmV4dCA9IG1lYW4gKyB5KmMqc3RkZXY7XG5cdFx0cmV0dXJuIG1lYW4gKyB4KmMqc3RkZXY7XG5cdH07XG5cdGYuc2FtcGxlcyA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIGdlbi56ZXJvZXMobikubWFwKGYpOyB9O1xuXHRyZXR1cm4gZjtcbn07IiwidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGF0YSwgZm9ybWF0KSB7XG4gIHZhciBkID0gZDMuY3N2LnBhcnNlKGRhdGEgPyBkYXRhLnRvU3RyaW5nKCkgOiBkYXRhKTtcbiAgcmV0dXJuIGQ7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGpzb246IHJlcXVpcmUoJy4vanNvbicpLFxuICBjc3Y6IHJlcXVpcmUoJy4vY3N2JyksXG4gIHRzdjogcmVxdWlyZSgnLi90c3YnKSxcbiAgdG9wb2pzb246IHJlcXVpcmUoJy4vdG9wb2pzb24nKSxcbiAgdHJlZWpzb246IHJlcXVpcmUoJy4vdHJlZWpzb24nKVxufTsiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkYXRhLCBmb3JtYXQpIHtcbiAgdmFyIGQgPSB1dGlsLmlzT2JqZWN0KGRhdGEpID8gZGF0YSA6IEpTT04ucGFyc2UoZGF0YSk7XG4gIGlmIChmb3JtYXQgJiYgZm9ybWF0LnByb3BlcnR5KSB7XG4gICAgZCA9IHV0aWwuYWNjZXNzb3IoZm9ybWF0LnByb3BlcnR5KShkKTtcbiAgfVxuICByZXR1cm4gZDtcbn07XG4iLCJ2YXIganNvbiA9IHJlcXVpcmUoJy4vanNvbicpO1xudmFyIHRvcG9qc29uID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cudG9wb2pzb24gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLnRvcG9qc29uIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGF0YSwgZm9ybWF0KSB7XG4gIGlmICh0b3BvanNvbiA9PSBudWxsKSB7IHRocm93IEVycm9yKFwiVG9wb0pTT04gbGlicmFyeSBub3QgbG9hZGVkLlwiKTsgfVxuXG4gIHZhciB0ID0ganNvbihkYXRhLCBmb3JtYXQpLCBvYmo7XG5cbiAgaWYgKGZvcm1hdCAmJiBmb3JtYXQuZmVhdHVyZSkge1xuICAgIGlmIChvYmogPSB0Lm9iamVjdHNbZm9ybWF0LmZlYXR1cmVdKSB7XG4gICAgICByZXR1cm4gdG9wb2pzb24uZmVhdHVyZSh0LCBvYmopLmZlYXR1cmVzXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IEVycm9yKFwiSW52YWxpZCBUb3BvSlNPTiBvYmplY3Q6IFwiK2Zvcm1hdC5mZWF0dXJlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZm9ybWF0ICYmIGZvcm1hdC5tZXNoKSB7XG4gICAgaWYgKG9iaiA9IHQub2JqZWN0c1tmb3JtYXQubWVzaF0pIHtcbiAgICAgIHJldHVybiBbdG9wb2pzb24ubWVzaCh0LCB0Lm9iamVjdHNbZm9ybWF0Lm1lc2hdKV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IEVycm9yKFwiSW52YWxpZCBUb3BvSlNPTiBvYmplY3Q6IFwiICsgZm9ybWF0Lm1lc2gpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBFcnJvcihcIk1pc3NpbmcgVG9wb0pTT04gZmVhdHVyZSBvciBtZXNoIHBhcmFtZXRlci5cIik7XG4gIH1cblxuICByZXR1cm4gW107XG59O1xuIiwidmFyIHRyZWUgPSByZXF1aXJlKCcuLi8uLi90cmVlJyk7XG52YXIganNvbiA9IHJlcXVpcmUoJy4vanNvbicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRhdGEsIGZvcm1hdCkge1xuICBkYXRhID0ganNvbihkYXRhLCBmb3JtYXQpO1xuICByZXR1cm4gdHJlZS50b1RhYmxlKGRhdGEsIChmb3JtYXQgJiYgZm9ybWF0LmNoaWxkcmVuKSk7XG59OyIsInZhciBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRhdGEsIGZvcm1hdCkge1xuICB2YXIgZCA9IGQzLnRzdi5wYXJzZShkYXRhID8gZGF0YS50b1N0cmluZygpIDogZGF0YSk7XG4gIHJldHVybiBkO1xufTtcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG52YXIgdGVzdHMgPSB7XG4gIGJvb2w6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHg9PT1cInRydWVcIiB8fCB4PT09XCJmYWxzZVwiIHx8IHV0aWwuaXNCb29sZWFuKHgpOyB9LFxuICBkYXRlOiBmdW5jdGlvbih4KSB7IHJldHVybiAhaXNOYU4oRGF0ZS5wYXJzZSh4KSk7IH0sXG4gIG51bTogZnVuY3Rpb24oeCkgeyByZXR1cm4gIWlzTmFOKCt4KSAmJiAhdXRpbC5pc0RhdGUoeCk7IH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIHZhciBpLCBqLCB2O1xuICBcbiAgLy8gdHlwZXMgdG8gdGVzdCBmb3JcbiAgdmFyIHR5cGVzID0gW1xuICAgIHt0eXBlOiBcImJvb2xlYW5cIiwgdGVzdDogdGVzdHMuYm9vbH0sXG4gICAge3R5cGU6IFwibnVtYmVyXCIsIHRlc3Q6IHRlc3RzLm51bX0sXG4gICAge3R5cGU6IFwiZGF0ZVwiLCB0ZXN0OiB0ZXN0cy5kYXRlfVxuICBdO1xuICBcbiAgZm9yIChpPTA7IGk8dmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgLy8gZ2V0IG5leHQgdmFsdWUgdG8gdGVzdFxuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIC8vIHRlc3QgdmFsdWUgYWdhaW5zdCByZW1haW5pbmcgdHlwZXNcbiAgICBmb3IgKGo9MDsgajx0eXBlcy5sZW5ndGg7ICsraikge1xuICAgICAgaWYgKHYgIT0gbnVsbCAmJiAhdHlwZXNbal0udGVzdCh2KSkge1xuICAgICAgICB0eXBlcy5zcGxpY2UoaiwgMSk7XG4gICAgICAgIGogLT0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gaWYgbm8gdHlwZXMgbGVmdCwgcmV0dXJuICdzdHJpbmcnXG4gICAgaWYgKHR5cGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFwic3RyaW5nXCI7XG4gIH1cbiAgXG4gIHJldHVybiB0eXBlc1swXS50eXBlO1xufTsiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuLy8gTWF0Y2hlcyBhYnNvbHV0ZSBVUkxzIHdpdGggb3B0aW9uYWwgcHJvdG9jb2xcbi8vICAgaHR0cHM6Ly8uLi4gICAgZmlsZTovLy4uLiAgICAvLy4uLlxudmFyIHByb3RvY29sX3JlID0gL14oW0EtWmEtel0rOik/XFwvXFwvLztcblxuLy8gU3BlY2lhbCB0cmVhdG1lbnQgaW4gbm9kZS5qcyBmb3IgdGhlIGZpbGU6IHByb3RvY29sXG52YXIgZmlsZVByb3RvY29sID0gJ2ZpbGU6Ly8nO1xuXG4vLyBWYWxpZGF0ZSBhbmQgY2xlYW51cCBVUkwgdG8gZW5zdXJlIHRoYXQgaXQgaXMgYWxsb3dlZCB0byBiZSBhY2Nlc3NlZFxuLy8gUmV0dXJucyBjbGVhbmVkIHVwIFVSTCwgb3IgZmFsc2UgaWYgYWNjZXNzIGlzIG5vdCBhbGxvd2VkXG5mdW5jdGlvbiBzYW5pdGl6ZVVybChvcHQpIHtcbiAgdmFyIHVybCA9IG9wdC51cmw7XG4gIGlmICghdXJsICYmIG9wdC5maWxlKSB7IHJldHVybiBmaWxlUHJvdG9jb2wgKyBvcHQuZmlsZTsgfVxuXG4gIC8vIEluIGNhc2UgdGhpcyBpcyBhIHJlbGF0aXZlIHVybCAoaGFzIG5vIGhvc3QpLCBwcmVwZW5kIG9wdC5iYXNlVVJMXG4gIGlmIChvcHQuYmFzZVVSTCAmJiAhcHJvdG9jb2xfcmUudGVzdCh1cmwpKSB7XG4gICAgaWYgKCF1dGlsLnN0YXJ0c1dpdGgodXJsLCAnLycpICYmIG9wdC5iYXNlVVJMW29wdC5iYXNlVVJMLmxlbmd0aC0xXSAhPT0gJy8nKSB7XG4gICAgICB1cmwgPSAnLycgKyB1cmw7IC8vIEVuc3VyZSB0aGF0IHRoZXJlIGlzIGEgc2xhc2ggYmV0d2VlbiB0aGUgYmFzZVVSTCAoZS5nLiBob3N0bmFtZSkgYW5kIHVybFxuICAgIH1cbiAgICB1cmwgPSBvcHQuYmFzZVVSTCArIHVybDtcbiAgfVxuICAvLyByZWxhdGl2ZSBwcm90b2NvbCwgc3RhcnRzIHdpdGggJy8vJ1xuICBpZiAodXRpbC5pc05vZGUgJiYgdXRpbC5zdGFydHNXaXRoKHVybCwgJy8vJykpIHtcbiAgICB1cmwgPSAob3B0LmRlZmF1bHRQcm90b2NvbCB8fCAnaHR0cCcpICsgJzonICsgdXJsO1xuICB9XG4gIC8vIElmIG9wdC5kb21haW5XaGl0ZUxpc3QgaXMgc2V0LCBvbmx5IGFsbG93cyB1cmwsIHdob3NlIGhvc3RuYW1lXG4gIC8vICogSXMgdGhlIHNhbWUgYXMgdGhlIG9yaWdpbiAod2luZG93LmxvY2F0aW9uLmhvc3RuYW1lKVxuICAvLyAqIEVxdWFscyBvbmUgb2YgdGhlIHZhbHVlcyBpbiB0aGUgd2hpdGVsaXN0XG4gIC8vICogSXMgYSBwcm9wZXIgc3ViZG9tYWluIG9mIG9uZSBvZiB0aGUgdmFsdWVzIGluIHRoZSB3aGl0ZWxpc3RcbiAgaWYgKG9wdC5kb21haW5XaGl0ZUxpc3QpIHtcbiAgICB2YXIgZG9tYWluLCBvcmlnaW47XG4gICAgaWYgKHV0aWwuaXNOb2RlKSB7XG4gICAgICAvLyByZWxhdGl2ZSBwcm90b2NvbCBpcyBicm9rZW46IGh0dHBzOi8vZ2l0aHViLmNvbS9kZWZ1bmN0em9tYmllL25vZGUtdXJsL2lzc3Vlcy81XG4gICAgICB2YXIgcGFydHMgPSByZXF1aXJlKCd1cmwnKS5wYXJzZSh1cmwpO1xuICAgICAgZG9tYWluID0gcGFydHMuaG9zdG5hbWU7XG4gICAgICBvcmlnaW4gPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgIGEuaHJlZiA9IHVybDtcbiAgICAgIC8vIEZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy83MzY1MTMvaG93LWRvLWktcGFyc2UtYS11cmwtaW50by1ob3N0bmFtZS1hbmQtcGF0aC1pbi1qYXZhc2NyaXB0XG4gICAgICAvLyBJRSBkb2Vzbid0IHBvcHVsYXRlIGFsbCBsaW5rIHByb3BlcnRpZXMgd2hlbiBzZXR0aW5nIC5ocmVmIHdpdGggYSByZWxhdGl2ZSBVUkwsXG4gICAgICAvLyBob3dldmVyIC5ocmVmIHdpbGwgcmV0dXJuIGFuIGFic29sdXRlIFVSTCB3aGljaCB0aGVuIGNhbiBiZSB1c2VkIG9uIGl0c2VsZlxuICAgICAgLy8gdG8gcG9wdWxhdGUgdGhlc2UgYWRkaXRpb25hbCBmaWVsZHMuXG4gICAgICBpZiAoYS5ob3N0ID09IFwiXCIpIHtcbiAgICAgICAgYS5ocmVmID0gYS5ocmVmO1xuICAgICAgfVxuICAgICAgZG9tYWluID0gYS5ob3N0bmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgb3JpZ2luID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lO1xuICAgIH1cblxuICAgIGlmIChvcmlnaW4gIT09IGRvbWFpbikge1xuICAgICAgdmFyIHdoaXRlTGlzdGVkID0gb3B0LmRvbWFpbldoaXRlTGlzdC5zb21lKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHZhciBpZHggPSBkb21haW4ubGVuZ3RoIC0gZC5sZW5ndGg7XG4gICAgICAgIHJldHVybiBkID09PSBkb21haW4gfHxcbiAgICAgICAgICAoaWR4ID4gMSAmJiBkb21haW5baWR4LTFdID09PSAnLicgJiYgZG9tYWluLmxhc3RJbmRleE9mKGQpID09PSBpZHgpO1xuICAgICAgfSk7XG4gICAgICBpZiAoIXdoaXRlTGlzdGVkKSB7XG4gICAgICAgIHRocm93ICdVUkwgaXMgbm90IHdoaXRlbGlzdGVkOiAnICsgdXJsO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdXJsO1xufVxuXG5mdW5jdGlvbiBsb2FkKG9wdCwgY2FsbGJhY2spIHtcbiAgdmFyIGVycm9yID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24oZSkgeyB0aHJvdyBlOyB9O1xuICBcbiAgdHJ5IHtcbiAgICB2YXIgdXJsID0gbG9hZC5zYW5pdGl6ZVVybChvcHQpOyAvLyBlbmFibGUgb3ZlcnJpZGVcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgZXJyb3IoZXJyKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoIXVybCkge1xuICAgIGVycm9yKCdJbnZhbGlkIFVSTDogJyArIHVybCk7XG4gIH0gZWxzZSBpZiAoIXV0aWwuaXNOb2RlKSB7XG4gICAgLy8gaW4gYnJvd3NlciwgdXNlIHhoclxuICAgIHJldHVybiB4aHIodXJsLCBjYWxsYmFjayk7XG4gIH0gZWxzZSBpZiAodXRpbC5zdGFydHNXaXRoKHVybCwgZmlsZVByb3RvY29sKSkge1xuICAgIC8vIGluIG5vZGUuanMsIGlmIHVybCBzdGFydHMgd2l0aCAnZmlsZTovLycsIHN0cmlwIGl0IGFuZCBsb2FkIGZyb20gZmlsZVxuICAgIHJldHVybiBmaWxlKHVybC5zbGljZShmaWxlUHJvdG9jb2wubGVuZ3RoKSwgY2FsbGJhY2spO1xuICB9IGVsc2Uge1xuICAgIC8vIGZvciByZWd1bGFyIFVSTHMgaW4gbm9kZS5qc1xuICAgIHJldHVybiBodHRwKHVybCwgY2FsbGJhY2spO1xuICB9XG59XG5cbmZ1bmN0aW9uIHhockhhc1Jlc3BvbnNlKHJlcXVlc3QpIHtcbiAgdmFyIHR5cGUgPSByZXF1ZXN0LnJlc3BvbnNlVHlwZTtcbiAgcmV0dXJuIHR5cGUgJiYgdHlwZSAhPT0gXCJ0ZXh0XCJcbiAgICAgID8gcmVxdWVzdC5yZXNwb25zZSAvLyBudWxsIG9uIGVycm9yXG4gICAgICA6IHJlcXVlc3QucmVzcG9uc2VUZXh0OyAvLyBcIlwiIG9uIGVycm9yXG59XG5cbmZ1bmN0aW9uIHhocih1cmwsIGNhbGxiYWNrKSB7XG4gIHZhciBhc3luYyA9ICEhY2FsbGJhY2s7XG4gIHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0O1xuICAvLyBJZiBJRSBkb2VzIG5vdCBzdXBwb3J0IENPUlMsIHVzZSBYRG9tYWluUmVxdWVzdCAoY29waWVkIGZyb20gZDMueGhyKVxuICBpZiAodGhpcy5YRG9tYWluUmVxdWVzdFxuICAgICAgJiYgIShcIndpdGhDcmVkZW50aWFsc1wiIGluIHJlcXVlc3QpXG4gICAgICAmJiAvXihodHRwKHMpPzopP1xcL1xcLy8udGVzdCh1cmwpKSByZXF1ZXN0ID0gbmV3IFhEb21haW5SZXF1ZXN0O1xuXG4gIGZ1bmN0aW9uIHJlc3BvbmQoKSB7XG4gICAgdmFyIHN0YXR1cyA9IHJlcXVlc3Quc3RhdHVzO1xuICAgIGlmICghc3RhdHVzICYmIHhockhhc1Jlc3BvbnNlKHJlcXVlc3QpIHx8IHN0YXR1cyA+PSAyMDAgJiYgc3RhdHVzIDwgMzAwIHx8IHN0YXR1cyA9PT0gMzA0KSB7XG4gICAgICBjYWxsYmFjayhudWxsLCByZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrKHJlcXVlc3QsIG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChhc3luYykge1xuICAgIFwib25sb2FkXCIgaW4gcmVxdWVzdFxuICAgICAgPyByZXF1ZXN0Lm9ubG9hZCA9IHJlcXVlc3Qub25lcnJvciA9IHJlc3BvbmRcbiAgICAgIDogcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHsgcmVxdWVzdC5yZWFkeVN0YXRlID4gMyAmJiByZXNwb25kKCk7IH07XG4gIH1cbiAgXG4gIHJlcXVlc3Qub3BlbihcIkdFVFwiLCB1cmwsIGFzeW5jKTtcbiAgcmVxdWVzdC5zZW5kKCk7XG4gIFxuICBpZiAoIWFzeW5jICYmIHhockhhc1Jlc3BvbnNlKHJlcXVlc3QpKSB7XG4gICAgcmV0dXJuIHJlcXVlc3QucmVzcG9uc2VUZXh0O1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbGUoZmlsZSwgY2FsbGJhY2spIHtcbiAgdmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcbiAgaWYgKCFjYWxsYmFjaykge1xuICAgIHJldHVybiBmcy5yZWFkRmlsZVN5bmMoZmlsZSwgJ3V0ZjgnKTtcbiAgfVxuICByZXF1aXJlKCdmcycpLnJlYWRGaWxlKGZpbGUsIGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gaHR0cCh1cmwsIGNhbGxiYWNrKSB7XG4gIGlmICghY2FsbGJhY2spIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnc3luYy1yZXF1ZXN0JykoJ0dFVCcsIHVybCkuZ2V0Qm9keSgpO1xuICB9XG4gIHJlcXVpcmUoJ3JlcXVlc3QnKSh1cmwsIGZ1bmN0aW9uKGVycm9yLCByZXNwb25zZSwgYm9keSkge1xuICAgIGlmICghZXJyb3IgJiYgcmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XG4gICAgICBjYWxsYmFjayhudWxsLCBib2R5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgIH1cbiAgfSk7XG59XG5cbmxvYWQuc2FuaXRpemVVcmwgPSBzYW5pdGl6ZVVybDtcblxubW9kdWxlLmV4cG9ydHMgPSBsb2FkO1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG52YXIgbG9hZCA9IHJlcXVpcmUoJy4vbG9hZCcpO1xudmFyIHJlYWQgPSByZXF1aXJlKCcuL3JlYWQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsXG4gIC5rZXlzKHJlYWQuZm9ybWF0cylcbiAgLnJlZHVjZShmdW5jdGlvbihvdXQsIHR5cGUpIHtcbiAgICBvdXRbdHlwZV0gPSBmdW5jdGlvbihvcHQsIGZvcm1hdCwgY2FsbGJhY2spIHtcbiAgICAgIC8vIHByb2Nlc3MgYXJndW1lbnRzXG4gICAgICBpZiAodXRpbC5pc1N0cmluZyhvcHQpKSBvcHQgPSB7dXJsOiBvcHR9O1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIgJiYgdXRpbC5pc0Z1bmN0aW9uKGZvcm1hdCkpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBmb3JtYXQ7XG4gICAgICAgIGZvcm1hdCA9IHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgLy8gc2V0IHVwIHJlYWQgZm9ybWF0XG4gICAgICBmb3JtYXQgPSB1dGlsLmV4dGVuZCh7cGFyc2U6ICdhdXRvJ30sIGZvcm1hdCk7XG4gICAgICBmb3JtYXQudHlwZSA9IHR5cGU7XG5cbiAgICAgIC8vIGxvYWQgZGF0YVxuICAgICAgdmFyIGRhdGEgPSBsb2FkKG9wdCwgY2FsbGJhY2sgPyBmdW5jdGlvbihlcnJvciwgZGF0YSkge1xuICAgICAgICBpZiAoZXJyb3IpIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBkYXRhIGxvYWRlZCwgbm93IHBhcnNlIGl0IChhc3luYylcbiAgICAgICAgICBkYXRhID0gcmVhZChkYXRhLCBmb3JtYXQpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY2FsbGJhY2soZSwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2sobnVsbCwgZGF0YSk7XG4gICAgICB9IDogdW5kZWZpbmVkKTtcbiAgICAgIFxuICAgICAgLy8gZGF0YSBsb2FkZWQsIG5vdyBwYXJzZSBpdCAoc3luYylcbiAgICAgIGlmIChkYXRhKSByZXR1cm4gcmVhZChkYXRhLCBmb3JtYXQpO1xuICAgIH07XG4gICAgcmV0dXJuIG91dDtcbiAgfSwge30pO1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG52YXIgZm9ybWF0cyA9IHJlcXVpcmUoJy4vZm9ybWF0cycpO1xudmFyIGluZmVyID0gcmVxdWlyZSgnLi9pbmZlci10eXBlcycpO1xuXG52YXIgUEFSU0VSUyA9IHtcbiAgXCJudW1iZXJcIjogdXRpbC5udW1iZXIsXG4gIFwiYm9vbGVhblwiOiB1dGlsLmJvb2xlYW4sXG4gIFwiZGF0ZVwiOiB1dGlsLmRhdGVcbn07XG5cbmZ1bmN0aW9uIHJlYWQoZGF0YSwgZm9ybWF0KSB7XG4gIHZhciB0eXBlID0gKGZvcm1hdCAmJiBmb3JtYXQudHlwZSkgfHwgXCJqc29uXCI7XG4gIGRhdGEgPSBmb3JtYXRzW3R5cGVdKGRhdGEsIGZvcm1hdCk7XG4gIGlmIChmb3JtYXQgJiYgZm9ybWF0LnBhcnNlKSBwYXJzZShkYXRhLCBmb3JtYXQucGFyc2UpO1xuICByZXR1cm4gZGF0YTtcbn1cblxuZnVuY3Rpb24gcGFyc2UoZGF0YSwgdHlwZXMpIHtcbiAgdmFyIGNvbHMsIHBhcnNlcnMsIGQsIGksIGosIGNsZW4sIGxlbiA9IGRhdGEubGVuZ3RoO1xuXG4gIGlmICh0eXBlcyA9PT0gJ2F1dG8nKSB7XG4gICAgLy8gcGVyZm9ybSB0eXBlIGluZmVyZW5jZVxuICAgIHR5cGVzID0gdXRpbC5rZXlzKGRhdGFbMF0pLnJlZHVjZShmdW5jdGlvbih0eXBlcywgYykge1xuICAgICAgdmFyIHR5cGUgPSBpbmZlcihkYXRhLCB1dGlsLmFjY2Vzc29yKGMpKTtcbiAgICAgIGlmIChQQVJTRVJTW3R5cGVdKSB0eXBlc1tjXSA9IHR5cGU7XG4gICAgICByZXR1cm4gdHlwZXM7XG4gICAgfSwge30pO1xuICB9XG4gIGNvbHMgPSB1dGlsLmtleXModHlwZXMpO1xuICBwYXJzZXJzID0gY29scy5tYXAoZnVuY3Rpb24oYykgeyByZXR1cm4gUEFSU0VSU1t0eXBlc1tjXV07IH0pO1xuXG4gIGZvciAoaT0wLCBjbGVuPWNvbHMubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgZCA9IGRhdGFbaV07XG4gICAgZm9yIChqPTA7IGo8Y2xlbjsgKytqKSB7XG4gICAgICBkW2NvbHNbal1dID0gcGFyc2Vyc1tqXShkW2NvbHNbal1dKTtcbiAgICB9XG4gIH1cbn1cblxucmVhZC5pbmZlciA9IGluZmVyO1xucmVhZC5mb3JtYXRzID0gZm9ybWF0cztcbnJlYWQucGFyc2UgPSBwYXJzZTtcbm1vZHVsZS5leHBvcnRzID0gcmVhZDsiLCJ2YXIgZGwgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxudXRpbC5leHRlbmQoZGwsIHV0aWwpO1xudXRpbC5leHRlbmQoZGwsIHJlcXVpcmUoJy4vZ2VuZXJhdGUnKSk7XG51dGlsLmV4dGVuZChkbCwgcmVxdWlyZSgnLi9zdGF0cycpKTtcbmRsLmJpbiA9IHJlcXVpcmUoJy4vYmluJyk7XG5kbC5zdW1tYXJ5ID0gcmVxdWlyZSgnLi9zdW1tYXJ5Jyk7XG5kbC50ZW1wbGF0ZSA9IHJlcXVpcmUoJy4vdGVtcGxhdGUnKTtcbmRsLnRydW5jYXRlID0gcmVxdWlyZSgnLi90cnVuY2F0ZScpO1xuXG5kbC5sb2FkID0gcmVxdWlyZSgnLi9pbXBvcnQvbG9hZCcpO1xuZGwucmVhZCA9IHJlcXVpcmUoJy4vaW1wb3J0L3JlYWQnKTtcbnV0aWwuZXh0ZW5kKGRsLCByZXF1aXJlKCcuL2ltcG9ydC9sb2FkZXJzJykpO1xuXG52YXIgbG9nID0gcmVxdWlyZSgnLi9sb2cnKTtcbmRsLmxvZyA9IGZ1bmN0aW9uKG1zZykgeyBsb2cobXNnLCBsb2cuTE9HKTsgfTtcbmRsLmxvZy5zaWxlbnQgPSBsb2cuc2lsZW50O1xuZGwuZXJyb3IgPSBmdW5jdGlvbihtc2cpIHsgbG9nKG1zZywgbG9nLkVSUik7IH07XG4iLCJ2YXIgTE9HID0gXCJMT0dcIjtcbnZhciBFUlIgPSBcIkVSUlwiO1xudmFyIHNpbGVudCA9IGZhbHNlO1xuXG5mdW5jdGlvbiBwcmVwYXJlKG1zZywgdHlwZSkge1xuICByZXR1cm4gJ1snICsgW1xuICAgICdcIicrKHR5cGUgfHwgTE9HKSsnXCInLFxuICAgIERhdGUubm93KCksXG4gICAgJ1wiJyttc2crJ1wiJ1xuICBdLmpvaW4oXCIsIFwiKSArICddJztcbn1cblxuZnVuY3Rpb24gbG9nKG1zZywgdHlwZSkge1xuICBpZiAoIXNpbGVudCkge1xuICAgIG1zZyA9IHByZXBhcmUobXNnLCB0eXBlKTtcbiAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gIH1cbn1cblxubG9nLnNpbGVudCA9IGZ1bmN0aW9uKHZhbCkgeyBzaWxlbnQgPSAhIXZhbDsgfTtcblxubG9nLkxPRyA9IExPRztcbmxvZy5FUlIgPSBFUlI7XG5tb2R1bGUuZXhwb3J0cyA9IGxvZzsiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIHN0YXRzID0ge307XG5cbnN0YXRzLnVuaXF1ZSA9IGZ1bmN0aW9uKHZhbHVlcywgZiwgcmVzdWx0cykge1xuICBpZiAoIXV0aWwuaXNBcnJheSh2YWx1ZXMpIHx8IHZhbHVlcy5sZW5ndGg9PT0wKSByZXR1cm4gW107XG4gIHJlc3VsdHMgPSByZXN1bHRzIHx8IFtdO1xuICB2YXIgdSA9IHt9LCB2LCBpO1xuICBmb3IgKGk9MCwgbj12YWx1ZXMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh2IGluIHUpIHtcbiAgICAgIHVbdl0gKz0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgdVt2XSA9IDE7XG4gICAgICByZXN1bHRzLnB1c2godik7XG4gICAgfVxuICB9XG4gIHJlc3VsdHMuY291bnRzID0gdTtcbiAgcmV0dXJuIHJlc3VsdHM7XG59O1xuXG5zdGF0cy5jb3VudCA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICBpZiAoIXV0aWwuaXNBcnJheSh2YWx1ZXMpIHx8IHZhbHVlcy5sZW5ndGg9PT0wKSByZXR1cm4gMDtcbiAgdmFyIHYsIGksIGNvdW50ID0gMDtcbiAgZm9yIChpPTAsIG49dmFsdWVzLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodiAhPSBudWxsKSBjb3VudCArPSAxO1xuICB9XG4gIHJldHVybiBjb3VudDtcbn07XG5cbnN0YXRzLmNvdW50LmRpc3RpbmN0ID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09PTApIHJldHVybiAwO1xuICB2YXIgdSA9IHt9LCB2LCBpLCBjb3VudCA9IDA7XG4gIGZvciAoaT0wLCBuPXZhbHVlcy5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgaWYgKHYgaW4gdSkgY29udGludWU7XG4gICAgdVt2XSA9IDE7XG4gICAgY291bnQgKz0gMTtcbiAgfVxuICByZXR1cm4gY291bnQ7XG59O1xuXG5zdGF0cy5jb3VudC5udWxscyA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICBpZiAoIXV0aWwuaXNBcnJheSh2YWx1ZXMpIHx8IHZhbHVlcy5sZW5ndGg9PT0wKSByZXR1cm4gMDtcbiAgdmFyIHYsIGksIGNvdW50ID0gMDtcbiAgZm9yIChpPTAsIG49dmFsdWVzLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodiA9PSBudWxsKSBjb3VudCArPSAxO1xuICB9XG4gIHJldHVybiBjb3VudDtcbn07XG5cbnN0YXRzLm1lZGlhbiA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICBpZiAoIXV0aWwuaXNBcnJheSh2YWx1ZXMpIHx8IHZhbHVlcy5sZW5ndGg9PT0wKSByZXR1cm4gMDtcbiAgaWYgKGYpIHZhbHVlcyA9IHZhbHVlcy5tYXAoZik7XG4gIHZhbHVlcyA9IHZhbHVlcy5maWx0ZXIodXRpbC5pc05vdE51bGwpLnNvcnQodXRpbC5jbXApO1xuICB2YXIgaGFsZiA9IE1hdGguZmxvb3IodmFsdWVzLmxlbmd0aC8yKTtcbiAgaWYgKHZhbHVlcy5sZW5ndGggJSAyKSB7XG4gICAgcmV0dXJuIHZhbHVlc1toYWxmXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gKHZhbHVlc1toYWxmLTFdICsgdmFsdWVzW2hhbGZdKSAvIDIuMDtcbiAgfVxufTtcblxuc3RhdHMubWVhbiA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICBpZiAoIXV0aWwuaXNBcnJheSh2YWx1ZXMpIHx8IHZhbHVlcy5sZW5ndGg9PT0wKSByZXR1cm4gMDtcbiAgdmFyIG1lYW4gPSAwLCBkZWx0YSwgaSwgYywgdjtcbiAgZm9yIChpPTAsIGM9MDsgaTx2YWx1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodiAhPSBudWxsKSB7XG4gICAgICBkZWx0YSA9IHYgLSBtZWFuO1xuICAgICAgbWVhbiA9IG1lYW4gKyBkZWx0YSAvICgrK2MpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWVhbjtcbn07XG5cbnN0YXRzLnZhcmlhbmNlID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09PTApIHJldHVybiAwO1xuICB2YXIgbWVhbiA9IDAsIE0yID0gMCwgZGVsdGEsIGksIGMsIHY7XG4gIGZvciAoaT0wLCBjPTA7IGk8dmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgaWYgKHYgIT0gbnVsbCkge1xuICAgICAgZGVsdGEgPSB2IC0gbWVhbjtcbiAgICAgIG1lYW4gPSBtZWFuICsgZGVsdGEgLyAoKytjKTtcbiAgICAgIE0yID0gTTIgKyBkZWx0YSAqICh2IC0gbWVhbik7XG4gICAgfVxuICB9XG4gIE0yID0gTTIgLyAoYyAtIDEpO1xuICByZXR1cm4gTTI7XG59O1xuXG5zdGF0cy5zdGRldiA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICByZXR1cm4gTWF0aC5zcXJ0KHN0YXRzLnZhcmlhbmNlKHZhbHVlcywgZikpO1xufTtcblxuc3RhdHMuc2tldyA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICB2YXIgYXZnID0gc3RhdHMubWVhbih2YWx1ZXMsIGYpLFxuICAgICAgbWVkID0gc3RhdHMubWVkaWFuKHZhbHVlcywgZiksXG4gICAgICBzdGQgPSBzdGF0cy5zdGRldih2YWx1ZXMsIGYpO1xuICByZXR1cm4gc3RkID09PSAwID8gMCA6IChhdmcgLSBtZWQpIC8gc3RkO1xufTtcblxuc3RhdHMubWlubWF4ID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIHZhciBzID0ge21pbjogK0luZmluaXR5LCBtYXg6IC1JbmZpbml0eX0sIHYsIGksIG47XG4gIGZvciAoaT0wOyBpPHZhbHVlcy5sZW5ndGg7ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh2ICE9IG51bGwpIHtcbiAgICAgIGlmICh2ID4gcy5tYXgpIHMubWF4ID0gdjtcbiAgICAgIGlmICh2IDwgcy5taW4pIHMubWluID0gdjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHM7XG59O1xuXG5zdGF0cy5taW5JbmRleCA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICBpZiAoIXV0aWwuaXNBcnJheSh2YWx1ZXMpIHx8IHZhbHVlcy5sZW5ndGg9PTApIHJldHVybiAtMTtcbiAgdmFyIGlkeCA9IDAsIHYsIGksIG4sIG1pbiA9ICtJbmZpbml0eTtcbiAgZm9yIChpPTA7IGk8dmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgaWYgKHYgIT0gbnVsbCAmJiB2IDwgbWluKSB7IG1pbiA9IHY7IGlkeCA9IGk7IH1cbiAgfVxuICByZXR1cm4gaWR4O1xufTtcblxuc3RhdHMubWF4SW5kZXggPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgaWYgKCF1dGlsLmlzQXJyYXkodmFsdWVzKSB8fCB2YWx1ZXMubGVuZ3RoPT0wKSByZXR1cm4gLTE7XG4gIHZhciBpZHggPSAwLCB2LCBpLCBuLCBtYXggPSAtSW5maW5pdHk7XG4gIGZvciAoaT0wOyBpPHZhbHVlcy5sZW5ndGg7ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh2ICE9IG51bGwgJiYgdiA+IG1heCkgeyBtYXggPSB2OyBpZHggPSBpOyB9XG4gIH1cbiAgcmV0dXJuIGlkeDtcbn07XG5cbnN0YXRzLmVudHJvcHkgPSBmdW5jdGlvbihjb3VudHMpIHtcbiAgdmFyIGksIHAsIHMgPSAwLCBIID0gMDtcbiAgZm9yIChpPTA7IGk8Y291bnRzLmxlbmd0aDsgKytpKSB7XG4gICAgcyArPSBjb3VudHNbaV07XG4gIH1cbiAgaWYgKHMgPT09IDApIHJldHVybiAwO1xuICBmb3IgKGk9MDsgaTxjb3VudHMubGVuZ3RoOyArK2kpIHtcbiAgICBwID0gY291bnRzW2ldIC8gcztcbiAgICBpZiAocCA+IDApIEggKz0gcCAqIE1hdGgubG9nKHApIC8gTWF0aC5MTjI7XG4gIH1cbiAgcmV0dXJuIC1IO1xufTtcblxuc3RhdHMuZW50cm9weS5ub3JtYWxpemVkID0gZnVuY3Rpb24oY291bnRzKSB7XG4gIHZhciBIID0gc3RhdHMuZW50cm9weShjb3VudHMpO1xuICB2YXIgbWF4ID0gLU1hdGgubG9nKDEvY291bnRzLmxlbmd0aCkgLyBNYXRoLkxOMjtcbiAgcmV0dXJuIEggLyBtYXg7XG59O1xuXG5zdGF0cy5wcm9maWxlID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09PTApIHJldHVybiBudWxsO1xuXG4gIC8vIGluaXRcbiAgdmFyIHAgPSB7fSxcbiAgICAgIG1lYW4gPSAwLFxuICAgICAgY291bnQgPSAwLFxuICAgICAgZGlzdGluY3QgPSAwLFxuICAgICAgbWluID0gZiA/IGYodmFsdWVzWzBdKSA6IHZhbHVlc1swXSxcbiAgICAgIG1heCA9IG1pbixcbiAgICAgIE0yID0gMCxcbiAgICAgIG1lZGlhbiA9IG51bGwsXG4gICAgICB2YWxzID0gW10sXG4gICAgICB1ID0ge30sIGRlbHRhLCBzZCwgaSwgdiwgeCwgaGFsZjtcblxuICAvLyBjb21wdXRlIHN1bW1hcnkgc3RhdHNcbiAgZm9yIChpPTAsIGM9MDsgaTx2YWx1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodiAhPSBudWxsKSB7XG4gICAgICAvLyB1cGRhdGUgdW5pcXVlIHZhbHVlc1xuICAgICAgdVt2XSA9ICh2IGluIHUpID8gdVt2XSArIDEgOiAoZGlzdGluY3QgKz0gMSwgMSk7XG4gICAgICAvLyB1cGRhdGUgbWluL21heFxuICAgICAgaWYgKHYgPCBtaW4pIG1pbiA9IHY7XG4gICAgICBpZiAodiA+IG1heCkgbWF4ID0gdjtcbiAgICAgIC8vIHVwZGF0ZSBzdGF0c1xuICAgICAgeCA9ICh0eXBlb2YgdiA9PT0gJ3N0cmluZycpID8gdi5sZW5ndGggOiB2O1xuICAgICAgZGVsdGEgPSB4IC0gbWVhbjtcbiAgICAgIG1lYW4gPSBtZWFuICsgZGVsdGEgLyAoKytjb3VudCk7XG4gICAgICBNMiA9IE0yICsgZGVsdGEgKiAoeCAtIG1lYW4pO1xuICAgICAgdmFscy5wdXNoKHgpO1xuICAgIH1cbiAgfVxuICBNMiA9IE0yIC8gKGNvdW50IC0gMSk7XG4gIHNkID0gTWF0aC5zcXJ0KE0yKTtcblxuICAvLyBjb21wdXRlIG1lZGlhblxuICB2YWxzLnNvcnQodXRpbC5jbXApO1xuICBoYWxmID0gTWF0aC5mbG9vcih2YWxzLmxlbmd0aC8yKTtcbiAgbWVkaWFuID0gKHZhbHMubGVuZ3RoICUgMilcbiAgID8gdmFsc1toYWxmXVxuICAgOiAodmFsc1toYWxmLTFdICsgdmFsc1toYWxmXSkgLyAyLjA7XG5cbiAgcmV0dXJuIHtcbiAgICB1bmlxdWU6ICAgdSxcbiAgICBjb3VudDogICAgY291bnQsXG4gICAgbnVsbHM6ICAgIHZhbHVlcy5sZW5ndGggLSBjb3VudCxcbiAgICBkaXN0aW5jdDogZGlzdGluY3QsXG4gICAgbWluOiAgICAgIG1pbixcbiAgICBtYXg6ICAgICAgbWF4LFxuICAgIG1lYW46ICAgICBtZWFuLFxuICAgIG1lZGlhbjogICBtZWRpYW4sXG4gICAgc3RkZXY6ICAgIHNkLFxuICAgIHNrZXc6ICAgICBzZCA9PT0gMCA/IDAgOiAobWVhbiAtIG1lZGlhbikgLyBzZFxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzdGF0czsiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xudmFyIHN0YXRzID0gcmVxdWlyZSgnLi9zdGF0cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRhdGEsIGZpZWxkcykge1xuICBpZiAoZGF0YSA9PSBudWxsIHx8IGRhdGEubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcbiAgZmllbGRzID0gZmllbGRzIHx8IHV0aWwua2V5cyhkYXRhWzBdKTtcblxuICB2YXIgcHJvZmlsZXMgPSBmaWVsZHMubWFwKGZ1bmN0aW9uKGYpIHtcbiAgICB2YXIgcCA9IHN0YXRzLnByb2ZpbGUoZGF0YSwgdXRpbC5hY2Nlc3NvcihmKSk7XG4gICAgcmV0dXJuIChwLmZpZWxkID0gZiwgcCk7XG4gIH0pO1xuICBcbiAgcHJvZmlsZXMudG9TdHJpbmcgPSBwcmludFN1bW1hcnk7XG4gIHJldHVybiBwcm9maWxlcztcbn07XG5cbmZ1bmN0aW9uIHByaW50U3VtbWFyeSgpIHtcbiAgdmFyIHByb2ZpbGVzID0gdGhpcztcbiAgdmFyIHN0ciA9IFtdO1xuICBwcm9maWxlcy5mb3JFYWNoKGZ1bmN0aW9uKHApIHtcbiAgICBzdHIucHVzaChcIi0tLS0tIEZpZWxkOiAnXCIgKyBwLmZpZWxkICsgXCInIC0tLS0tXCIpO1xuICAgIGlmICh0eXBlb2YgcC5taW4gPT09ICdzdHJpbmcnIHx8IHAuZGlzdGluY3QgPCAxMCkge1xuICAgICAgc3RyLnB1c2gocHJpbnRDYXRlZ29yaWNhbFByb2ZpbGUocCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIucHVzaChwcmludFF1YW50aXRhdGl2ZVByb2ZpbGUocCkpO1xuICAgIH1cbiAgICBzdHIucHVzaChcIlwiKTtcbiAgfSk7XG4gIHJldHVybiBzdHIuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcHJpbnRRdWFudGl0YXRpdmVQcm9maWxlKHApIHtcbiAgcmV0dXJuIFtcbiAgICBcImRpc3RpbmN0OiBcIiArIHAuZGlzdGluY3QsXG4gICAgXCJudWxsczogICAgXCIgKyBwLm51bGxzLFxuICAgIFwibWluOiAgICAgIFwiICsgcC5taW4sXG4gICAgXCJtYXg6ICAgICAgXCIgKyBwLm1heCxcbiAgICBcIm1lZGlhbjogICBcIiArIHAubWVkaWFuLFxuICAgIFwibWVhbjogICAgIFwiICsgcC5tZWFuLFxuICAgIFwic3RkZXY6ICAgIFwiICsgcC5zdGRldixcbiAgICBcInNrZXc6ICAgICBcIiArIHAuc2tld1xuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHByaW50Q2F0ZWdvcmljYWxQcm9maWxlKHApIHtcbiAgdmFyIGxpc3QgPSBbXG4gICAgXCJkaXN0aW5jdDogXCIgKyBwLmRpc3RpbmN0LFxuICAgIFwibnVsbHM6ICAgIFwiICsgcC5udWxscyxcbiAgICBcInRvcCB2YWx1ZXM6IFwiXG4gIF07XG4gIHZhciB1ID0gcC51bmlxdWU7XG4gIHZhciB0b3AgPSB1dGlsLmtleXModSlcbiAgICAuc29ydChmdW5jdGlvbihhLGIpIHsgcmV0dXJuIHVbYl0gLSB1W2FdOyB9KVxuICAgIC5zbGljZSgwLCA2KVxuICAgIC5tYXAoZnVuY3Rpb24odikgeyByZXR1cm4gXCIgJ1wiICsgdiArIFwiJyAoXCIgKyB1W3ZdICsgXCIpXCI7IH0pO1xuICByZXR1cm4gbGlzdC5jb25jYXQodG9wKS5qb2luKFwiXFxuXCIpO1xufSIsInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKTtcblxudmFyIGNvbnRleHQgPSB7XG4gIGZvcm1hdHM6ICAgIFtdLFxuICBmb3JtYXRfbWFwOiB7fSxcbiAgdHJ1bmNhdGU6ICAgcmVxdWlyZSgnLi90cnVuY2F0ZScpXG59O1xuXG5mdW5jdGlvbiB0ZW1wbGF0ZSh0ZXh0KSB7XG4gIHZhciBzcmMgPSBzb3VyY2UodGV4dCwgXCJkXCIpO1xuICBzcmMgPSBcInZhciBfX3Q7IHJldHVybiBcIiArIHNyYyArIFwiO1wiO1xuXG4gIHRyeSB7XG4gICAgcmV0dXJuIChuZXcgRnVuY3Rpb24oXCJkXCIsIHNyYykpLmJpbmQoY29udGV4dCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBlLnNvdXJjZSA9IHNyYztcbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGVtcGxhdGU7XG5cbi8vIGNsZWFyIGNhY2hlIG9mIGZvcm1hdCBvYmplY3RzXG4vLyBjYW4gKmJyZWFrKiBwcmlvciB0ZW1wbGF0ZSBmdW5jdGlvbnMsIHNvIGludm9rZSB3aXRoIGNhcmVcbnRlbXBsYXRlLmNsZWFyRm9ybWF0Q2FjaGUgPSBmdW5jdGlvbigpIHtcbiAgY29udGV4dC5mb3JtYXRzID0gW107XG4gIGNvbnRleHQuZm9ybWF0X21hcCA9IHt9O1xufTtcblxuZnVuY3Rpb24gc291cmNlKHRleHQsIHZhcmlhYmxlKSB7XG4gIHZhcmlhYmxlID0gdmFyaWFibGUgfHwgXCJvYmpcIjtcbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIHNyYyA9IFwiJ1wiO1xuICB2YXIgcmVnZXggPSB0ZW1wbGF0ZV9yZTtcblxuICAvLyBDb21waWxlIHRoZSB0ZW1wbGF0ZSBzb3VyY2UsIGVzY2FwaW5nIHN0cmluZyBsaXRlcmFscyBhcHByb3ByaWF0ZWx5LlxuICB0ZXh0LnJlcGxhY2UocmVnZXgsIGZ1bmN0aW9uKG1hdGNoLCBpbnRlcnBvbGF0ZSwgb2Zmc2V0KSB7XG4gICAgc3JjICs9IHRleHRcbiAgICAgIC5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgICAgLnJlcGxhY2UodGVtcGxhdGVfZXNjYXBlciwgdGVtcGxhdGVfZXNjYXBlQ2hhcik7XG4gICAgaW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG5cbiAgICBpZiAoaW50ZXJwb2xhdGUpIHtcbiAgICAgIHNyYyArPSBcIidcXG4rKChfX3Q9KFwiXG4gICAgICAgICsgdGVtcGxhdGVfdmFyKGludGVycG9sYXRlLCB2YXJpYWJsZSlcbiAgICAgICAgKyBcIikpPT1udWxsPycnOl9fdCkrXFxuJ1wiO1xuICAgIH1cblxuICAgIC8vIEFkb2JlIFZNcyBuZWVkIHRoZSBtYXRjaCByZXR1cm5lZCB0byBwcm9kdWNlIHRoZSBjb3JyZWN0IG9mZmVzdC5cbiAgICByZXR1cm4gbWF0Y2g7XG4gIH0pO1xuICByZXR1cm4gc3JjICsgXCInXCI7XG59XG5cbmZ1bmN0aW9uIHRlbXBsYXRlX3Zhcih0ZXh0LCB2YXJpYWJsZSkge1xuICB2YXIgZmlsdGVycyA9IHRleHQuc3BsaXQoJ3wnKTtcbiAgdmFyIHByb3AgPSBmaWx0ZXJzLnNoaWZ0KCkudHJpbSgpO1xuICB2YXIgZm9ybWF0ID0gW107XG4gIHZhciBzdHJpbmdDYXN0ID0gdHJ1ZTtcbiAgXG4gIGZ1bmN0aW9uIHN0cmNhbGwoZm4pIHtcbiAgICBmbiA9IGZuIHx8IFwiXCI7XG4gICAgaWYgKHN0cmluZ0Nhc3QpIHtcbiAgICAgIHN0cmluZ0Nhc3QgPSBmYWxzZTtcbiAgICAgIHNyYyA9IFwiU3RyaW5nKFwiICsgc3JjICsgXCIpXCIgKyBmbjtcbiAgICB9IGVsc2Uge1xuICAgICAgc3JjICs9IGZuO1xuICAgIH1cbiAgICByZXR1cm4gc3JjO1xuICB9XG4gIFxuICB2YXIgc3JjID0gdXRpbC5maWVsZChwcm9wKS5tYXAodXRpbC5zdHIpLmpvaW4oXCJdW1wiKTtcbiAgc3JjID0gdmFyaWFibGUgKyBcIltcIiArIHNyYyArIFwiXVwiO1xuICBcbiAgZm9yICh2YXIgaT0wOyBpPGZpbHRlcnMubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgZiA9IGZpbHRlcnNbaV0sIGFyZ3MgPSBudWxsLCBwaWR4LCBhLCBiO1xuXG4gICAgaWYgKChwaWR4PWYuaW5kZXhPZignOicpKSA+IDApIHtcbiAgICAgIGYgPSBmLnNsaWNlKDAsIHBpZHgpO1xuICAgICAgYXJncyA9IGZpbHRlcnNbaV0uc2xpY2UocGlkeCsxKS5zcGxpdCgnLCcpXG4gICAgICAgIC5tYXAoZnVuY3Rpb24ocykgeyByZXR1cm4gcy50cmltKCk7IH0pO1xuICAgIH1cbiAgICBmID0gZi50cmltKCk7XG5cbiAgICBzd2l0Y2ggKGYpIHtcbiAgICAgIGNhc2UgJ2xlbmd0aCc6XG4gICAgICAgIHN0cmNhbGwoJy5sZW5ndGgnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdsb3dlcic6XG4gICAgICAgIHN0cmNhbGwoJy50b0xvd2VyQ2FzZSgpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndXBwZXInOlxuICAgICAgICBzdHJjYWxsKCcudG9VcHBlckNhc2UoKScpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xvd2VyLWxvY2FsZSc6XG4gICAgICAgIHN0cmNhbGwoJy50b0xvY2FsZUxvd2VyQ2FzZSgpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndXBwZXItbG9jYWxlJzpcbiAgICAgICAgc3RyY2FsbCgnLnRvTG9jYWxlVXBwZXJDYXNlKCknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0cmltJzpcbiAgICAgICAgc3RyY2FsbCgnLnRyaW0oKScpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICBhID0gdXRpbC5udW1iZXIoYXJnc1swXSk7XG4gICAgICAgIHN0cmNhbGwoJy5zbGljZSgwLCcgKyBhICsgJyknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgIGEgPSB1dGlsLm51bWJlcihhcmdzWzBdKTtcbiAgICAgICAgc3RyY2FsbCgnLnNsaWNlKC0nICsgYSArJyknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtaWQnOlxuICAgICAgICBhID0gdXRpbC5udW1iZXIoYXJnc1swXSk7XG4gICAgICAgIGIgPSBhICsgdXRpbC5udW1iZXIoYXJnc1sxXSk7XG4gICAgICAgIHN0cmNhbGwoJy5zbGljZSgrJythKycsJytiKycpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc2xpY2UnOlxuICAgICAgICBhID0gdXRpbC5udW1iZXIoYXJnc1swXSk7XG4gICAgICAgIHN0cmNhbGwoJy5zbGljZSgnKyBhXG4gICAgICAgICAgKyAoYXJncy5sZW5ndGggPiAxID8gJywnICsgdXRpbC5udW1iZXIoYXJnc1sxXSkgOiAnJylcbiAgICAgICAgICArICcpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndHJ1bmNhdGUnOlxuICAgICAgICBhID0gdXRpbC5udW1iZXIoYXJnc1swXSk7XG4gICAgICAgIGIgPSBhcmdzWzFdO1xuICAgICAgICBiID0gKGIhPT1cImxlZnRcIiAmJiBiIT09XCJtaWRkbGVcIiAmJiBiIT09XCJjZW50ZXJcIikgPyBcInJpZ2h0XCIgOiBiO1xuICAgICAgICBzcmMgPSAndGhpcy50cnVuY2F0ZSgnICsgc3RyY2FsbCgpICsgJywnICsgYSArICcsXCInICsgYiArICdcIiknO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgIGEgPSB0ZW1wbGF0ZV9mb3JtYXQoYXJnc1swXSwgZDMuZm9ybWF0KTtcbiAgICAgICAgc3RyaW5nQ2FzdCA9IGZhbHNlO1xuICAgICAgICBzcmMgPSAndGhpcy5mb3JtYXRzWycrYSsnXSgnK3NyYysnKSc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndGltZSc6XG4gICAgICAgIGEgPSB0ZW1wbGF0ZV9mb3JtYXQoYXJnc1swXSwgZDMudGltZS5mb3JtYXQpO1xuICAgICAgICBzdHJpbmdDYXN0ID0gZmFsc2U7XG4gICAgICAgIHNyYyA9ICd0aGlzLmZvcm1hdHNbJythKyddKCcrc3JjKycpJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBFcnJvcihcIlVucmVjb2duaXplZCB0ZW1wbGF0ZSBmaWx0ZXI6IFwiICsgZik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHNyYztcbn1cblxudmFyIHRlbXBsYXRlX3JlID0gL1xce1xceyguKz8pXFx9XFx9fCQvZztcblxuLy8gQ2VydGFpbiBjaGFyYWN0ZXJzIG5lZWQgdG8gYmUgZXNjYXBlZCBzbyB0aGF0IHRoZXkgY2FuIGJlIHB1dCBpbnRvIGFcbi8vIHN0cmluZyBsaXRlcmFsLlxudmFyIHRlbXBsYXRlX2VzY2FwZXMgPSB7XG4gIFwiJ1wiOiAgICAgIFwiJ1wiLFxuICAnXFxcXCc6ICAgICAnXFxcXCcsXG4gICdcXHInOiAgICAgJ3InLFxuICAnXFxuJzogICAgICduJyxcbiAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAnXFx1MjAyOSc6ICd1MjAyOSdcbn07XG5cbnZhciB0ZW1wbGF0ZV9lc2NhcGVyID0gL1xcXFx8J3xcXHJ8XFxufFxcdTIwMjh8XFx1MjAyOS9nO1xuXG5mdW5jdGlvbiB0ZW1wbGF0ZV9lc2NhcGVDaGFyKG1hdGNoKSB7XG4gIHJldHVybiAnXFxcXCcgKyB0ZW1wbGF0ZV9lc2NhcGVzW21hdGNoXTtcbn07XG5cbmZ1bmN0aW9uIHRlbXBsYXRlX2Zvcm1hdChwYXR0ZXJuLCBmbXQpIHtcbiAgaWYgKChwYXR0ZXJuWzBdID09PSBcIidcIiAmJiBwYXR0ZXJuW3BhdHRlcm4ubGVuZ3RoLTFdID09PSBcIidcIikgfHxcbiAgICAgIChwYXR0ZXJuWzBdICE9PSAnXCInICYmIHBhdHRlcm5bcGF0dGVybi5sZW5ndGgtMV0gPT09ICdcIicpKSB7XG4gICAgcGF0dGVybiA9IHBhdHRlcm4uc2xpY2UoMSwgLTEpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IEVycm9yKFwiRm9ybWF0IHBhdHRlcm4gbXVzdCBiZSBxdW90ZWQ6IFwiICsgcGF0dGVybik7XG4gIH1cbiAgaWYgKCFjb250ZXh0LmZvcm1hdF9tYXBbcGF0dGVybl0pIHtcbiAgICB2YXIgZiA9IGZtdChwYXR0ZXJuKTtcbiAgICB2YXIgaSA9IGNvbnRleHQuZm9ybWF0cy5sZW5ndGg7XG4gICAgY29udGV4dC5mb3JtYXRzLnB1c2goZik7XG4gICAgY29udGV4dC5mb3JtYXRfbWFwW3BhdHRlcm5dID0gaTtcbiAgfVxuICByZXR1cm4gY29udGV4dC5mb3JtYXRfbWFwW3BhdHRlcm5dO1xufTtcbiIsInZhciBGSUVMRFMgPSB7XG4gIHBhcmVudDogXCJwYXJlbnRcIixcbiAgY2hpbGRyZW46IFwiY2hpbGRyZW5cIlxufTtcblxuZnVuY3Rpb24gdG9UYWJsZShyb290LCBjaGlsZHJlbkZpZWxkLCBwYXJlbnRGaWVsZCkge1xuICBjaGlsZHJlbkZpZWxkID0gY2hpbGRyZW5GaWVsZCB8fCBGSUVMRFMuY2hpbGRyZW47XG4gIHBhcmVudEZpZWxkID0gcGFyZW50RmllbGQgfHwgRklFTERTLnBhcmVudDtcbiAgdmFyIHRhYmxlID0gW107XG4gIFxuICBmdW5jdGlvbiB2aXNpdChub2RlLCBwYXJlbnQpIHtcbiAgICBub2RlW3BhcmVudEZpZWxkXSA9IHBhcmVudDtcbiAgICB0YWJsZS5wdXNoKG5vZGUpO1xuICAgIFxuICAgIHZhciBjaGlsZHJlbiA9IG5vZGVbY2hpbGRyZW5GaWVsZF07XG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICBmb3IgKHZhciBpPTA7IGk8Y2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmlzaXQoY2hpbGRyZW5baV0sIG5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgdmlzaXQocm9vdCwgbnVsbCk7XG4gIHJldHVybiAodGFibGUucm9vdCA9IHJvb3QsIHRhYmxlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHRvVGFibGU6IHRvVGFibGUsXG4gIGZpZWxkczogRklFTERTXG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocywgbGVuZ3RoLCBwb3MsIHdvcmQsIGVsbGlwc2lzKSB7XG4gIHZhciBsZW4gPSBzLmxlbmd0aDtcbiAgaWYgKGxlbiA8PSBsZW5ndGgpIHJldHVybiBzO1xuICBlbGxpcHNpcyA9IGVsbGlwc2lzIHx8IFwiLi4uXCI7XG4gIHZhciBsID0gTWF0aC5tYXgoMCwgbGVuZ3RoIC0gZWxsaXBzaXMubGVuZ3RoKTtcblxuICBzd2l0Y2ggKHBvcykge1xuICAgIGNhc2UgXCJsZWZ0XCI6XG4gICAgICByZXR1cm4gZWxsaXBzaXMgKyAod29yZCA/IHVfdHJ1bmNhdGVPbldvcmQocyxsLDEpIDogcy5zbGljZShsZW4tbCkpO1xuICAgIGNhc2UgXCJtaWRkbGVcIjpcbiAgICBjYXNlIFwiY2VudGVyXCI6XG4gICAgICB2YXIgbDEgPSBNYXRoLmNlaWwobC8yKSwgbDIgPSBNYXRoLmZsb29yKGwvMik7XG4gICAgICByZXR1cm4gKHdvcmQgPyB0cnVuY2F0ZU9uV29yZChzLGwxKSA6IHMuc2xpY2UoMCxsMSkpICsgZWxsaXBzaXNcbiAgICAgICAgKyAod29yZCA/IHRydW5jYXRlT25Xb3JkKHMsbDIsMSkgOiBzLnNsaWNlKGxlbi1sMikpO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gKHdvcmQgPyB0cnVuY2F0ZU9uV29yZChzLGwpIDogcy5zbGljZSgwLGwpKSArIGVsbGlwc2lzO1xuICB9XG59O1xuXG5mdW5jdGlvbiB0cnVuY2F0ZU9uV29yZChzLCBsZW4sIHJldikge1xuICB2YXIgY250ID0gMCwgdG9rID0gcy5zcGxpdCh0cnVuY2F0ZV93b3JkX3JlKTtcbiAgaWYgKHJldikge1xuICAgIHMgPSAodG9rID0gdG9rLnJldmVyc2UoKSlcbiAgICAgIC5maWx0ZXIoZnVuY3Rpb24odykgeyBjbnQgKz0gdy5sZW5ndGg7IHJldHVybiBjbnQgPD0gbGVuOyB9KVxuICAgICAgLnJldmVyc2UoKTtcbiAgfSBlbHNlIHtcbiAgICBzID0gdG9rLmZpbHRlcihmdW5jdGlvbih3KSB7IGNudCArPSB3Lmxlbmd0aDsgcmV0dXJuIGNudCA8PSBsZW47IH0pO1xuICB9XG4gIHJldHVybiBzLmxlbmd0aCA/IHMuam9pbihcIlwiKS50cmltKCkgOiB0b2tbMF0uc2xpY2UoMCwgbGVuKTtcbn1cblxudmFyIHRydW5jYXRlX3dvcmRfcmUgPSAvKFtcXHUwMDA5XFx1MDAwQVxcdTAwMEJcXHUwMDBDXFx1MDAwRFxcdTAwMjBcXHUwMEEwXFx1MTY4MFxcdTE4MEVcXHUyMDAwXFx1MjAwMVxcdTIwMDJcXHUyMDAzXFx1MjAwNFxcdTIwMDVcXHUyMDA2XFx1MjAwN1xcdTIwMDhcXHUyMDA5XFx1MjAwQVxcdTIwMkZcXHUyMDVGXFx1MjAyOFxcdTIwMjlcXHUzMDAwXFx1RkVGRl0pLztcbiIsInZhciB1ID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gd2hlcmUgYXJlIHdlP1xuXG51LmlzTm9kZSA9IHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICAmJiB0eXBlb2YgcHJvY2Vzcy5zdGRlcnIgIT09ICd1bmRlZmluZWQnO1xuXG4vLyB0eXBlIGNoZWNraW5nIGZ1bmN0aW9uc1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG51LmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiBvYmogPT09IE9iamVjdChvYmopO1xufTtcblxudS5pc0Z1bmN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbn07XG5cbnUuaXNTdHJpbmcgPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBTdHJpbmddJztcbn07XG5cbnUuaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbnUuaXNOdW1iZXIgPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG9iaikpICYmIGlzRmluaXRlKG9iaik7XG59O1xuXG51LmlzQm9vbGVhbiA9IGZ1bmN0aW9uKG9iaikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEJvb2xlYW5dJztcbn07XG5cbnUuaXNEYXRlID0gZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgRGF0ZV0nO1xufTtcblxudS5pc05vdE51bGwgPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIG9iaiAhPSBudWxsOyAvLyBUT0RPIGluY2x1ZGUgTmFOIGhlcmU/XG59O1xuXG4vLyB0eXBlIGNvZXJjaW9uIGZ1bmN0aW9uc1xuXG51Lm51bWJlciA9IGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMgPT0gbnVsbCA/IG51bGwgOiArczsgfTtcblxudS5ib29sZWFuID0gZnVuY3Rpb24ocykgeyByZXR1cm4gcyA9PSBudWxsID8gbnVsbCA6IHM9PT0nZmFsc2UnID8gZmFsc2UgOiAhIXM7IH07XG5cbnUuZGF0ZSA9IGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMgPT0gbnVsbCA/IG51bGwgOiBEYXRlLnBhcnNlKHMpOyB9XG5cbnUuYXJyYXkgPSBmdW5jdGlvbih4KSB7IHJldHVybiB4ICE9IG51bGwgPyAodS5pc0FycmF5KHgpID8geCA6IFt4XSkgOiBbXTsgfTtcblxudS5zdHIgPSBmdW5jdGlvbih4KSB7XG4gIHJldHVybiB1LmlzQXJyYXkoeCkgPyBcIltcIiArIHgubWFwKHUuc3RyKSArIFwiXVwiXG4gICAgOiB1LmlzT2JqZWN0KHgpID8gSlNPTi5zdHJpbmdpZnkoeClcbiAgICA6IHUuaXNTdHJpbmcoeCkgPyAoXCInXCIrdXRpbF9lc2NhcGVfc3RyKHgpK1wiJ1wiKSA6IHg7XG59O1xuXG52YXIgZXNjYXBlX3N0cl9yZSA9IC8oXnxbXlxcXFxdKScvZztcblxuZnVuY3Rpb24gdXRpbF9lc2NhcGVfc3RyKHgpIHtcbiAgcmV0dXJuIHgucmVwbGFjZShlc2NhcGVfc3RyX3JlLCBcIiQxXFxcXCdcIik7XG59XG5cbi8vIHV0aWxpdHkgZnVuY3Rpb25zXG5cbnUuaWRlbnRpdHkgPSBmdW5jdGlvbih4KSB7IHJldHVybiB4OyB9O1xuXG51LnRydWUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRydWU7IH07XG5cbnUuZHVwbGljYXRlID0gZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpO1xufTtcblxudS5lcXVhbCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGEpID09PSBKU09OLnN0cmluZ2lmeShiKTtcbn07XG5cbnUuZXh0ZW5kID0gZnVuY3Rpb24ob2JqKSB7XG4gIGZvciAodmFyIHgsIG5hbWUsIGk9MSwgbGVuPWFyZ3VtZW50cy5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICB4ID0gYXJndW1lbnRzW2ldO1xuICAgIGZvciAobmFtZSBpbiB4KSB7IG9ialtuYW1lXSA9IHhbbmFtZV07IH1cbiAgfVxuICByZXR1cm4gb2JqO1xufTtcblxudS5rZXlzID0gZnVuY3Rpb24oeCkge1xuICB2YXIga2V5cyA9IFtdLCBrO1xuICBmb3IgKGsgaW4geCkga2V5cy5wdXNoKGspO1xuICByZXR1cm4ga2V5cztcbn07XG5cbnUudmFscyA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIHZhbHMgPSBbXSwgaztcbiAgZm9yIChrIGluIHgpIHZhbHMucHVzaCh4W2tdKTtcbiAgcmV0dXJuIHZhbHM7XG59O1xuXG51LnRvTWFwID0gZnVuY3Rpb24obGlzdCkge1xuICByZXR1cm4gbGlzdC5yZWR1Y2UoZnVuY3Rpb24ob2JqLCB4KSB7XG4gICAgcmV0dXJuIChvYmpbeF0gPSAxLCBvYmopO1xuICB9LCB7fSk7XG59O1xuXG51LmtleXN0ciA9IGZ1bmN0aW9uKHZhbHVlcykge1xuICAvLyB1c2UgdG8gZW5zdXJlIGNvbnNpc3RlbnQga2V5IGdlbmVyYXRpb24gYWNyb3NzIG1vZHVsZXNcbiAgcmV0dXJuIHZhbHVlcy5qb2luKFwifFwiKTtcbn07XG5cbi8vIGRhdGEgYWNjZXNzIGZ1bmN0aW9uc1xuXG51LmZpZWxkID0gZnVuY3Rpb24oZikge1xuICByZXR1cm4gZi5zcGxpdChcIlxcXFwuXCIpXG4gICAgLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkLnNwbGl0KFwiLlwiKTsgfSlcbiAgICAucmVkdWNlKGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgIGlmIChhLmxlbmd0aCkgeyBhW2EubGVuZ3RoLTFdICs9IFwiLlwiICsgYi5zaGlmdCgpOyB9XG4gICAgICBhLnB1c2guYXBwbHkoYSwgYik7XG4gICAgICByZXR1cm4gYTtcbiAgICB9LCBbXSk7XG59O1xuXG51LmFjY2Vzc29yID0gZnVuY3Rpb24oZikge1xuICB2YXIgcztcbiAgcmV0dXJuICh1LmlzRnVuY3Rpb24oZikgfHwgZj09bnVsbClcbiAgICA/IGYgOiB1LmlzU3RyaW5nKGYpICYmIChzPXUuZmllbGQoZikpLmxlbmd0aCA+IDFcbiAgICA/IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHMucmVkdWNlKGZ1bmN0aW9uKHgsZikge1xuICAgICAgICAgIHJldHVybiB4W2ZdO1xuICAgICAgICB9LCB4KTtcbiAgICAgIH1cbiAgICA6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHhbZl07IH07XG59O1xuXG51Lm11dGF0b3IgPSBmdW5jdGlvbihmKSB7XG4gIHZhciBzO1xuICByZXR1cm4gdS5pc1N0cmluZyhmKSAmJiAocz11LmZpZWxkKGYpKS5sZW5ndGggPiAxXG4gICAgPyBmdW5jdGlvbih4LCB2KSB7XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxzLmxlbmd0aC0xOyArK2kpIHggPSB4W3NbaV1dO1xuICAgICAgICB4W3NbaV1dID0gdjtcbiAgICAgIH1cbiAgICA6IGZ1bmN0aW9uKHgsIHYpIHsgeFtmXSA9IHY7IH07XG59O1xuXG5cbi8vIGNvbXBhcmlzb24gLyBzb3J0aW5nIGZ1bmN0aW9uc1xuXG51LmNvbXBhcmF0b3IgPSBmdW5jdGlvbihzb3J0KSB7XG4gIHZhciBzaWduID0gW107XG4gIGlmIChzb3J0ID09PSB1bmRlZmluZWQpIHNvcnQgPSBbXTtcbiAgc29ydCA9IHUuYXJyYXkoc29ydCkubWFwKGZ1bmN0aW9uKGYpIHtcbiAgICB2YXIgcyA9IDE7XG4gICAgaWYgICAgICAoZlswXSA9PT0gXCItXCIpIHsgcyA9IC0xOyBmID0gZi5zbGljZSgxKTsgfVxuICAgIGVsc2UgaWYgKGZbMF0gPT09IFwiK1wiKSB7IHMgPSArMTsgZiA9IGYuc2xpY2UoMSk7IH1cbiAgICBzaWduLnB1c2gocyk7XG4gICAgcmV0dXJuIHUuYWNjZXNzb3IoZik7XG4gIH0pO1xuICByZXR1cm4gZnVuY3Rpb24oYSxiKSB7XG4gICAgdmFyIGksIG4sIGYsIHgsIHk7XG4gICAgZm9yIChpPTAsIG49c29ydC5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgICBmID0gc29ydFtpXTsgeCA9IGYoYSk7IHkgPSBmKGIpO1xuICAgICAgaWYgKHggPCB5KSByZXR1cm4gLTEgKiBzaWduW2ldO1xuICAgICAgaWYgKHggPiB5KSByZXR1cm4gc2lnbltpXTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH07XG59O1xuXG51LmNtcCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgaWYgKGEgPCBiKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2UgaWYgKGEgPiBiKSB7XG4gICAgcmV0dXJuIDE7XG4gIH0gZWxzZSBpZiAoYSA+PSBiKSB7XG4gICAgcmV0dXJuIDA7XG4gIH0gZWxzZSBpZiAoYSA9PT0gbnVsbCAmJiBiID09PSBudWxsKSB7XG4gICAgcmV0dXJuIDA7XG4gIH0gZWxzZSBpZiAoYSA9PT0gbnVsbCkge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIGlmIChiID09PSBudWxsKSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgcmV0dXJuIE5hTjtcbn07XG5cbnUubnVtY21wID0gZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGI7IH07XG5cbnUuc3RhYmxlc29ydCA9IGZ1bmN0aW9uKGFycmF5LCBzb3J0QnksIGtleUZuKSB7XG4gIHZhciBpbmRpY2VzID0gYXJyYXkucmVkdWNlKGZ1bmN0aW9uKGlkeCwgdiwgaSkge1xuICAgIHJldHVybiAoaWR4W2tleUZuKHYpXSA9IGksIGlkeCk7XG4gIH0sIHt9KTtcblxuICBhcnJheS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgc2EgPSBzb3J0QnkoYSksXG4gICAgICAgIHNiID0gc29ydEJ5KGIpO1xuICAgIHJldHVybiBzYSA8IHNiID8gLTEgOiBzYSA+IHNiID8gMVxuICAgICAgICAgOiAoaW5kaWNlc1trZXlGbihhKV0gLSBpbmRpY2VzW2tleUZuKGIpXSk7XG4gIH0pO1xuXG4gIHJldHVybiBhcnJheTtcbn07XG5cbi8vIHN0cmluZyBmdW5jdGlvbnNcblxuLy8gRVM2IGNvbXBhdGliaWxpdHkgcGVyIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL1N0cmluZy9zdGFydHNXaXRoI1BvbHlmaWxsXG4vLyBXZSBjb3VsZCBoYXZlIHVzZWQgdGhlIHBvbHlmaWxsIGNvZGUsIGJ1dCBsZXRzIHdhaXQgdW50aWwgRVM2IGJlY29tZXMgYSBzdGFuZGFyZCBmaXJzdFxudS5zdGFydHNXaXRoID0gU3RyaW5nLnByb3RvdHlwZS5zdGFydHNXaXRoXG4gID8gZnVuY3Rpb24oc3RyaW5nLCBzZWFyY2hTdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnN0YXJ0c1dpdGgoc2VhcmNoU3RyaW5nKTtcbiAgfVxuICA6IGZ1bmN0aW9uKHN0cmluZywgc2VhcmNoU3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sYXN0SW5kZXhPZihzZWFyY2hTdHJpbmcsIDApID09PSAwO1xuICB9OyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvaGVhcCcpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjguMFxuKGZ1bmN0aW9uKCkge1xuICB2YXIgSGVhcCwgZGVmYXVsdENtcCwgZmxvb3IsIGhlYXBpZnksIGhlYXBwb3AsIGhlYXBwdXNoLCBoZWFwcHVzaHBvcCwgaGVhcHJlcGxhY2UsIGluc29ydCwgbWluLCBubGFyZ2VzdCwgbnNtYWxsZXN0LCB1cGRhdGVJdGVtLCBfc2lmdGRvd24sIF9zaWZ0dXA7XG5cbiAgZmxvb3IgPSBNYXRoLmZsb29yLCBtaW4gPSBNYXRoLm1pbjtcblxuXG4gIC8qXG4gIERlZmF1bHQgY29tcGFyaXNvbiBmdW5jdGlvbiB0byBiZSB1c2VkXG4gICAqL1xuXG4gIGRlZmF1bHRDbXAgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgaWYgKHggPCB5KSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGlmICh4ID4geSkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHJldHVybiAwO1xuICB9O1xuXG5cbiAgLypcbiAgSW5zZXJ0IGl0ZW0geCBpbiBsaXN0IGEsIGFuZCBrZWVwIGl0IHNvcnRlZCBhc3N1bWluZyBhIGlzIHNvcnRlZC5cbiAgXG4gIElmIHggaXMgYWxyZWFkeSBpbiBhLCBpbnNlcnQgaXQgdG8gdGhlIHJpZ2h0IG9mIHRoZSByaWdodG1vc3QgeC5cbiAgXG4gIE9wdGlvbmFsIGFyZ3MgbG8gKGRlZmF1bHQgMCkgYW5kIGhpIChkZWZhdWx0IGEubGVuZ3RoKSBib3VuZCB0aGUgc2xpY2VcbiAgb2YgYSB0byBiZSBzZWFyY2hlZC5cbiAgICovXG5cbiAgaW5zb3J0ID0gZnVuY3Rpb24oYSwgeCwgbG8sIGhpLCBjbXApIHtcbiAgICB2YXIgbWlkO1xuICAgIGlmIChsbyA9PSBudWxsKSB7XG4gICAgICBsbyA9IDA7XG4gICAgfVxuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgaWYgKGxvIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdsbyBtdXN0IGJlIG5vbi1uZWdhdGl2ZScpO1xuICAgIH1cbiAgICBpZiAoaGkgPT0gbnVsbCkge1xuICAgICAgaGkgPSBhLmxlbmd0aDtcbiAgICB9XG4gICAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICAgIG1pZCA9IGZsb29yKChsbyArIGhpKSAvIDIpO1xuICAgICAgaWYgKGNtcCh4LCBhW21pZF0pIDwgMCkge1xuICAgICAgICBoaSA9IG1pZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvID0gbWlkICsgMTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIChbXS5zcGxpY2UuYXBwbHkoYSwgW2xvLCBsbyAtIGxvXS5jb25jYXQoeCkpLCB4KTtcbiAgfTtcblxuXG4gIC8qXG4gIFB1c2ggaXRlbSBvbnRvIGhlYXAsIG1haW50YWluaW5nIHRoZSBoZWFwIGludmFyaWFudC5cbiAgICovXG5cbiAgaGVhcHB1c2ggPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgY21wKSB7XG4gICAgaWYgKGNtcCA9PSBudWxsKSB7XG4gICAgICBjbXAgPSBkZWZhdWx0Q21wO1xuICAgIH1cbiAgICBhcnJheS5wdXNoKGl0ZW0pO1xuICAgIHJldHVybiBfc2lmdGRvd24oYXJyYXksIDAsIGFycmF5Lmxlbmd0aCAtIDEsIGNtcCk7XG4gIH07XG5cblxuICAvKlxuICBQb3AgdGhlIHNtYWxsZXN0IGl0ZW0gb2ZmIHRoZSBoZWFwLCBtYWludGFpbmluZyB0aGUgaGVhcCBpbnZhcmlhbnQuXG4gICAqL1xuXG4gIGhlYXBwb3AgPSBmdW5jdGlvbihhcnJheSwgY21wKSB7XG4gICAgdmFyIGxhc3RlbHQsIHJldHVybml0ZW07XG4gICAgaWYgKGNtcCA9PSBudWxsKSB7XG4gICAgICBjbXAgPSBkZWZhdWx0Q21wO1xuICAgIH1cbiAgICBsYXN0ZWx0ID0gYXJyYXkucG9wKCk7XG4gICAgaWYgKGFycmF5Lmxlbmd0aCkge1xuICAgICAgcmV0dXJuaXRlbSA9IGFycmF5WzBdO1xuICAgICAgYXJyYXlbMF0gPSBsYXN0ZWx0O1xuICAgICAgX3NpZnR1cChhcnJheSwgMCwgY21wKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuaXRlbSA9IGxhc3RlbHQ7XG4gICAgfVxuICAgIHJldHVybiByZXR1cm5pdGVtO1xuICB9O1xuXG5cbiAgLypcbiAgUG9wIGFuZCByZXR1cm4gdGhlIGN1cnJlbnQgc21hbGxlc3QgdmFsdWUsIGFuZCBhZGQgdGhlIG5ldyBpdGVtLlxuICBcbiAgVGhpcyBpcyBtb3JlIGVmZmljaWVudCB0aGFuIGhlYXBwb3AoKSBmb2xsb3dlZCBieSBoZWFwcHVzaCgpLCBhbmQgY2FuIGJlXG4gIG1vcmUgYXBwcm9wcmlhdGUgd2hlbiB1c2luZyBhIGZpeGVkIHNpemUgaGVhcC4gTm90ZSB0aGF0IHRoZSB2YWx1ZVxuICByZXR1cm5lZCBtYXkgYmUgbGFyZ2VyIHRoYW4gaXRlbSEgVGhhdCBjb25zdHJhaW5zIHJlYXNvbmFibGUgdXNlIG9mXG4gIHRoaXMgcm91dGluZSB1bmxlc3Mgd3JpdHRlbiBhcyBwYXJ0IG9mIGEgY29uZGl0aW9uYWwgcmVwbGFjZW1lbnQ6XG4gICAgICBpZiBpdGVtID4gYXJyYXlbMF1cbiAgICAgICAgaXRlbSA9IGhlYXByZXBsYWNlKGFycmF5LCBpdGVtKVxuICAgKi9cblxuICBoZWFwcmVwbGFjZSA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBjbXApIHtcbiAgICB2YXIgcmV0dXJuaXRlbTtcbiAgICBpZiAoY21wID09IG51bGwpIHtcbiAgICAgIGNtcCA9IGRlZmF1bHRDbXA7XG4gICAgfVxuICAgIHJldHVybml0ZW0gPSBhcnJheVswXTtcbiAgICBhcnJheVswXSA9IGl0ZW07XG4gICAgX3NpZnR1cChhcnJheSwgMCwgY21wKTtcbiAgICByZXR1cm4gcmV0dXJuaXRlbTtcbiAgfTtcblxuXG4gIC8qXG4gIEZhc3QgdmVyc2lvbiBvZiBhIGhlYXBwdXNoIGZvbGxvd2VkIGJ5IGEgaGVhcHBvcC5cbiAgICovXG5cbiAgaGVhcHB1c2hwb3AgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgY21wKSB7XG4gICAgdmFyIF9yZWY7XG4gICAgaWYgKGNtcCA9PSBudWxsKSB7XG4gICAgICBjbXAgPSBkZWZhdWx0Q21wO1xuICAgIH1cbiAgICBpZiAoYXJyYXkubGVuZ3RoICYmIGNtcChhcnJheVswXSwgaXRlbSkgPCAwKSB7XG4gICAgICBfcmVmID0gW2FycmF5WzBdLCBpdGVtXSwgaXRlbSA9IF9yZWZbMF0sIGFycmF5WzBdID0gX3JlZlsxXTtcbiAgICAgIF9zaWZ0dXAoYXJyYXksIDAsIGNtcCk7XG4gICAgfVxuICAgIHJldHVybiBpdGVtO1xuICB9O1xuXG5cbiAgLypcbiAgVHJhbnNmb3JtIGxpc3QgaW50byBhIGhlYXAsIGluLXBsYWNlLCBpbiBPKGFycmF5Lmxlbmd0aCkgdGltZS5cbiAgICovXG5cbiAgaGVhcGlmeSA9IGZ1bmN0aW9uKGFycmF5LCBjbXApIHtcbiAgICB2YXIgaSwgX2ksIF9qLCBfbGVuLCBfcmVmLCBfcmVmMSwgX3Jlc3VsdHMsIF9yZXN1bHRzMTtcbiAgICBpZiAoY21wID09IG51bGwpIHtcbiAgICAgIGNtcCA9IGRlZmF1bHRDbXA7XG4gICAgfVxuICAgIF9yZWYxID0gKGZ1bmN0aW9uKCkge1xuICAgICAgX3Jlc3VsdHMxID0gW107XG4gICAgICBmb3IgKHZhciBfaiA9IDAsIF9yZWYgPSBmbG9vcihhcnJheS5sZW5ndGggLyAyKTsgMCA8PSBfcmVmID8gX2ogPCBfcmVmIDogX2ogPiBfcmVmOyAwIDw9IF9yZWYgPyBfaisrIDogX2otLSl7IF9yZXN1bHRzMS5wdXNoKF9qKTsgfVxuICAgICAgcmV0dXJuIF9yZXN1bHRzMTtcbiAgICB9KS5hcHBseSh0aGlzKS5yZXZlcnNlKCk7XG4gICAgX3Jlc3VsdHMgPSBbXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBpID0gX3JlZjFbX2ldO1xuICAgICAgX3Jlc3VsdHMucHVzaChfc2lmdHVwKGFycmF5LCBpLCBjbXApKTtcbiAgICB9XG4gICAgcmV0dXJuIF9yZXN1bHRzO1xuICB9O1xuXG5cbiAgLypcbiAgVXBkYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGUgZ2l2ZW4gaXRlbSBpbiB0aGUgaGVhcC5cbiAgVGhpcyBmdW5jdGlvbiBzaG91bGQgYmUgY2FsbGVkIGV2ZXJ5IHRpbWUgdGhlIGl0ZW0gaXMgYmVpbmcgbW9kaWZpZWQuXG4gICAqL1xuXG4gIHVwZGF0ZUl0ZW0gPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgY21wKSB7XG4gICAgdmFyIHBvcztcbiAgICBpZiAoY21wID09IG51bGwpIHtcbiAgICAgIGNtcCA9IGRlZmF1bHRDbXA7XG4gICAgfVxuICAgIHBvcyA9IGFycmF5LmluZGV4T2YoaXRlbSk7XG4gICAgaWYgKHBvcyA9PT0gLTEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgX3NpZnRkb3duKGFycmF5LCAwLCBwb3MsIGNtcCk7XG4gICAgcmV0dXJuIF9zaWZ0dXAoYXJyYXksIHBvcywgY21wKTtcbiAgfTtcblxuXG4gIC8qXG4gIEZpbmQgdGhlIG4gbGFyZ2VzdCBlbGVtZW50cyBpbiBhIGRhdGFzZXQuXG4gICAqL1xuXG4gIG5sYXJnZXN0ID0gZnVuY3Rpb24oYXJyYXksIG4sIGNtcCkge1xuICAgIHZhciBlbGVtLCByZXN1bHQsIF9pLCBfbGVuLCBfcmVmO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgcmVzdWx0ID0gYXJyYXkuc2xpY2UoMCwgbik7XG4gICAgaWYgKCFyZXN1bHQubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBoZWFwaWZ5KHJlc3VsdCwgY21wKTtcbiAgICBfcmVmID0gYXJyYXkuc2xpY2Uobik7XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBlbGVtID0gX3JlZltfaV07XG4gICAgICBoZWFwcHVzaHBvcChyZXN1bHQsIGVsZW0sIGNtcCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQuc29ydChjbXApLnJldmVyc2UoKTtcbiAgfTtcblxuXG4gIC8qXG4gIEZpbmQgdGhlIG4gc21hbGxlc3QgZWxlbWVudHMgaW4gYSBkYXRhc2V0LlxuICAgKi9cblxuICBuc21hbGxlc3QgPSBmdW5jdGlvbihhcnJheSwgbiwgY21wKSB7XG4gICAgdmFyIGVsZW0sIGksIGxvcywgcmVzdWx0LCBfaSwgX2osIF9sZW4sIF9yZWYsIF9yZWYxLCBfcmVzdWx0cztcbiAgICBpZiAoY21wID09IG51bGwpIHtcbiAgICAgIGNtcCA9IGRlZmF1bHRDbXA7XG4gICAgfVxuICAgIGlmIChuICogMTAgPD0gYXJyYXkubGVuZ3RoKSB7XG4gICAgICByZXN1bHQgPSBhcnJheS5zbGljZSgwLCBuKS5zb3J0KGNtcCk7XG4gICAgICBpZiAoIXJlc3VsdC5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICAgIGxvcyA9IHJlc3VsdFtyZXN1bHQubGVuZ3RoIC0gMV07XG4gICAgICBfcmVmID0gYXJyYXkuc2xpY2Uobik7XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgZWxlbSA9IF9yZWZbX2ldO1xuICAgICAgICBpZiAoY21wKGVsZW0sIGxvcykgPCAwKSB7XG4gICAgICAgICAgaW5zb3J0KHJlc3VsdCwgZWxlbSwgMCwgbnVsbCwgY21wKTtcbiAgICAgICAgICByZXN1bHQucG9wKCk7XG4gICAgICAgICAgbG9zID0gcmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgaGVhcGlmeShhcnJheSwgY21wKTtcbiAgICBfcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoaSA9IF9qID0gMCwgX3JlZjEgPSBtaW4obiwgYXJyYXkubGVuZ3RoKTsgMCA8PSBfcmVmMSA/IF9qIDwgX3JlZjEgOiBfaiA+IF9yZWYxOyBpID0gMCA8PSBfcmVmMSA/ICsrX2ogOiAtLV9qKSB7XG4gICAgICBfcmVzdWx0cy5wdXNoKGhlYXBwb3AoYXJyYXksIGNtcCkpO1xuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH07XG5cbiAgX3NpZnRkb3duID0gZnVuY3Rpb24oYXJyYXksIHN0YXJ0cG9zLCBwb3MsIGNtcCkge1xuICAgIHZhciBuZXdpdGVtLCBwYXJlbnQsIHBhcmVudHBvcztcbiAgICBpZiAoY21wID09IG51bGwpIHtcbiAgICAgIGNtcCA9IGRlZmF1bHRDbXA7XG4gICAgfVxuICAgIG5ld2l0ZW0gPSBhcnJheVtwb3NdO1xuICAgIHdoaWxlIChwb3MgPiBzdGFydHBvcykge1xuICAgICAgcGFyZW50cG9zID0gKHBvcyAtIDEpID4+IDE7XG4gICAgICBwYXJlbnQgPSBhcnJheVtwYXJlbnRwb3NdO1xuICAgICAgaWYgKGNtcChuZXdpdGVtLCBwYXJlbnQpIDwgMCkge1xuICAgICAgICBhcnJheVtwb3NdID0gcGFyZW50O1xuICAgICAgICBwb3MgPSBwYXJlbnRwb3M7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBhcnJheVtwb3NdID0gbmV3aXRlbTtcbiAgfTtcblxuICBfc2lmdHVwID0gZnVuY3Rpb24oYXJyYXksIHBvcywgY21wKSB7XG4gICAgdmFyIGNoaWxkcG9zLCBlbmRwb3MsIG5ld2l0ZW0sIHJpZ2h0cG9zLCBzdGFydHBvcztcbiAgICBpZiAoY21wID09IG51bGwpIHtcbiAgICAgIGNtcCA9IGRlZmF1bHRDbXA7XG4gICAgfVxuICAgIGVuZHBvcyA9IGFycmF5Lmxlbmd0aDtcbiAgICBzdGFydHBvcyA9IHBvcztcbiAgICBuZXdpdGVtID0gYXJyYXlbcG9zXTtcbiAgICBjaGlsZHBvcyA9IDIgKiBwb3MgKyAxO1xuICAgIHdoaWxlIChjaGlsZHBvcyA8IGVuZHBvcykge1xuICAgICAgcmlnaHRwb3MgPSBjaGlsZHBvcyArIDE7XG4gICAgICBpZiAocmlnaHRwb3MgPCBlbmRwb3MgJiYgIShjbXAoYXJyYXlbY2hpbGRwb3NdLCBhcnJheVtyaWdodHBvc10pIDwgMCkpIHtcbiAgICAgICAgY2hpbGRwb3MgPSByaWdodHBvcztcbiAgICAgIH1cbiAgICAgIGFycmF5W3Bvc10gPSBhcnJheVtjaGlsZHBvc107XG4gICAgICBwb3MgPSBjaGlsZHBvcztcbiAgICAgIGNoaWxkcG9zID0gMiAqIHBvcyArIDE7XG4gICAgfVxuICAgIGFycmF5W3Bvc10gPSBuZXdpdGVtO1xuICAgIHJldHVybiBfc2lmdGRvd24oYXJyYXksIHN0YXJ0cG9zLCBwb3MsIGNtcCk7XG4gIH07XG5cbiAgSGVhcCA9IChmdW5jdGlvbigpIHtcbiAgICBIZWFwLnB1c2ggPSBoZWFwcHVzaDtcblxuICAgIEhlYXAucG9wID0gaGVhcHBvcDtcblxuICAgIEhlYXAucmVwbGFjZSA9IGhlYXByZXBsYWNlO1xuXG4gICAgSGVhcC5wdXNocG9wID0gaGVhcHB1c2hwb3A7XG5cbiAgICBIZWFwLmhlYXBpZnkgPSBoZWFwaWZ5O1xuXG4gICAgSGVhcC51cGRhdGVJdGVtID0gdXBkYXRlSXRlbTtcblxuICAgIEhlYXAubmxhcmdlc3QgPSBubGFyZ2VzdDtcblxuICAgIEhlYXAubnNtYWxsZXN0ID0gbnNtYWxsZXN0O1xuXG4gICAgZnVuY3Rpb24gSGVhcChjbXApIHtcbiAgICAgIHRoaXMuY21wID0gY21wICE9IG51bGwgPyBjbXAgOiBkZWZhdWx0Q21wO1xuICAgICAgdGhpcy5ub2RlcyA9IFtdO1xuICAgIH1cblxuICAgIEhlYXAucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gaGVhcHB1c2godGhpcy5ub2RlcywgeCwgdGhpcy5jbXApO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBoZWFwcG9wKHRoaXMubm9kZXMsIHRoaXMuY21wKTtcbiAgICB9O1xuXG4gICAgSGVhcC5wcm90b3R5cGUucGVlayA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMubm9kZXNbMF07XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHRoaXMubm9kZXMuaW5kZXhPZih4KSAhPT0gLTE7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gaGVhcHJlcGxhY2UodGhpcy5ub2RlcywgeCwgdGhpcy5jbXApO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5wdXNocG9wID0gZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIGhlYXBwdXNocG9wKHRoaXMubm9kZXMsIHgsIHRoaXMuY21wKTtcbiAgICB9O1xuXG4gICAgSGVhcC5wcm90b3R5cGUuaGVhcGlmeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGhlYXBpZnkodGhpcy5ub2RlcywgdGhpcy5jbXApO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS51cGRhdGVJdGVtID0gZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHVwZGF0ZUl0ZW0odGhpcy5ub2RlcywgeCwgdGhpcy5jbXApO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMubm9kZXMgPSBbXTtcbiAgICB9O1xuXG4gICAgSGVhcC5wcm90b3R5cGUuZW1wdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLm5vZGVzLmxlbmd0aCA9PT0gMDtcbiAgICB9O1xuXG4gICAgSGVhcC5wcm90b3R5cGUuc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMubm9kZXMubGVuZ3RoO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGhlYXA7XG4gICAgICBoZWFwID0gbmV3IEhlYXAoKTtcbiAgICAgIGhlYXAubm9kZXMgPSB0aGlzLm5vZGVzLnNsaWNlKDApO1xuICAgICAgcmV0dXJuIGhlYXA7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLnRvQXJyYXkgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLm5vZGVzLnNsaWNlKDApO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5pbnNlcnQgPSBIZWFwLnByb3RvdHlwZS5wdXNoO1xuXG4gICAgSGVhcC5wcm90b3R5cGUudG9wID0gSGVhcC5wcm90b3R5cGUucGVlaztcblxuICAgIEhlYXAucHJvdG90eXBlLmZyb250ID0gSGVhcC5wcm90b3R5cGUucGVlaztcblxuICAgIEhlYXAucHJvdG90eXBlLmhhcyA9IEhlYXAucHJvdG90eXBlLmNvbnRhaW5zO1xuXG4gICAgSGVhcC5wcm90b3R5cGUuY29weSA9IEhlYXAucHJvdG90eXBlLmNsb25lO1xuXG4gICAgcmV0dXJuIEhlYXA7XG5cbiAgfSkoKTtcblxuICAoZnVuY3Rpb24ocm9vdCwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgIHJldHVybiBkZWZpbmUoW10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByb290LkhlYXAgPSBmYWN0b3J5KCk7XG4gICAgfVxuICB9KSh0aGlzLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gSGVhcDtcbiAgfSk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCJ2YXIgYm91bmRzID0gZnVuY3Rpb24oYikge1xuICB0aGlzLmNsZWFyKCk7XG4gIGlmIChiKSB0aGlzLnVuaW9uKGIpO1xufTtcblxudmFyIHByb3RvdHlwZSA9IGJvdW5kcy5wcm90b3R5cGU7XG5cbnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLngxID0gK051bWJlci5NQVhfVkFMVUU7XG4gIHRoaXMueTEgPSArTnVtYmVyLk1BWF9WQUxVRTtcbiAgdGhpcy54MiA9IC1OdW1iZXIuTUFYX1ZBTFVFO1xuICB0aGlzLnkyID0gLU51bWJlci5NQVhfVkFMVUU7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyKSB7XG4gIHRoaXMueDEgPSB4MTtcbiAgdGhpcy55MSA9IHkxO1xuICB0aGlzLngyID0geDI7XG4gIHRoaXMueTIgPSB5MjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oeCwgeSkge1xuICBpZiAoeCA8IHRoaXMueDEpIHRoaXMueDEgPSB4O1xuICBpZiAoeSA8IHRoaXMueTEpIHRoaXMueTEgPSB5O1xuICBpZiAoeCA+IHRoaXMueDIpIHRoaXMueDIgPSB4O1xuICBpZiAoeSA+IHRoaXMueTIpIHRoaXMueTIgPSB5O1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5leHBhbmQgPSBmdW5jdGlvbihkKSB7XG4gIHRoaXMueDEgLT0gZDtcbiAgdGhpcy55MSAtPSBkO1xuICB0aGlzLngyICs9IGQ7XG4gIHRoaXMueTIgKz0gZDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUucm91bmQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy54MSA9IE1hdGguZmxvb3IodGhpcy54MSk7XG4gIHRoaXMueTEgPSBNYXRoLmZsb29yKHRoaXMueTEpO1xuICB0aGlzLngyID0gTWF0aC5jZWlsKHRoaXMueDIpO1xuICB0aGlzLnkyID0gTWF0aC5jZWlsKHRoaXMueTIpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihkeCwgZHkpIHtcbiAgdGhpcy54MSArPSBkeDtcbiAgdGhpcy54MiArPSBkeDtcbiAgdGhpcy55MSArPSBkeTtcbiAgdGhpcy55MiArPSBkeTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24oYW5nbGUsIHgsIHkpIHtcbiAgdmFyIGNvcyA9IE1hdGguY29zKGFuZ2xlKSxcbiAgICAgIHNpbiA9IE1hdGguc2luKGFuZ2xlKSxcbiAgICAgIGN4ID0geCAtIHgqY29zICsgeSpzaW4sXG4gICAgICBjeSA9IHkgLSB4KnNpbiAtIHkqY29zLFxuICAgICAgeDEgPSB0aGlzLngxLCB4MiA9IHRoaXMueDIsXG4gICAgICB5MSA9IHRoaXMueTEsIHkyID0gdGhpcy55MjtcblxuICByZXR1cm4gdGhpcy5jbGVhcigpXG4gICAgLmFkZChjb3MqeDEgLSBzaW4qeTEgKyBjeCwgIHNpbip4MSArIGNvcyp5MSArIGN5KVxuICAgIC5hZGQoY29zKngxIC0gc2luKnkyICsgY3gsICBzaW4qeDEgKyBjb3MqeTIgKyBjeSlcbiAgICAuYWRkKGNvcyp4MiAtIHNpbip5MSArIGN4LCAgc2luKngyICsgY29zKnkxICsgY3kpXG4gICAgLmFkZChjb3MqeDIgLSBzaW4qeTIgKyBjeCwgIHNpbip4MiArIGNvcyp5MiArIGN5KTtcbn1cblxucHJvdG90eXBlLnVuaW9uID0gZnVuY3Rpb24oYikge1xuICBpZiAoYi54MSA8IHRoaXMueDEpIHRoaXMueDEgPSBiLngxO1xuICBpZiAoYi55MSA8IHRoaXMueTEpIHRoaXMueTEgPSBiLnkxO1xuICBpZiAoYi54MiA+IHRoaXMueDIpIHRoaXMueDIgPSBiLngyO1xuICBpZiAoYi55MiA+IHRoaXMueTIpIHRoaXMueTIgPSBiLnkyO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5lbmNsb3NlcyA9IGZ1bmN0aW9uKGIpIHtcbiAgcmV0dXJuIGIgJiYgKFxuICAgIHRoaXMueDEgPD0gYi54MSAmJlxuICAgIHRoaXMueDIgPj0gYi54MiAmJlxuICAgIHRoaXMueTEgPD0gYi55MSAmJlxuICAgIHRoaXMueTIgPj0gYi55MlxuICApO1xufTtcblxucHJvdG90eXBlLmludGVyc2VjdHMgPSBmdW5jdGlvbihiKSB7XG4gIHJldHVybiBiICYmICEoXG4gICAgdGhpcy54MiA8IGIueDEgfHxcbiAgICB0aGlzLngxID4gYi54MiB8fFxuICAgIHRoaXMueTIgPCBiLnkxIHx8XG4gICAgdGhpcy55MSA+IGIueTJcbiAgKTtcbn07XG5cbnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgcmV0dXJuICEoXG4gICAgeCA8IHRoaXMueDEgfHxcbiAgICB4ID4gdGhpcy54MiB8fFxuICAgIHkgPCB0aGlzLnkxIHx8XG4gICAgeSA+IHRoaXMueTJcbiAgKTtcbn07XG5cbnByb3RvdHlwZS53aWR0aCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy54MiAtIHRoaXMueDE7XG59O1xuXG5wcm90b3R5cGUuaGVpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnkyIC0gdGhpcy55MTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYm91bmRzOyIsInZhciBHcmFwaCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L0dyYXBoJyksIFxuICAgIE5vZGUgID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvTm9kZScpLFxuICAgIEdyb3VwQnVpbGRlciA9IHJlcXVpcmUoJy4uL3NjZW5lL0dyb3VwQnVpbGRlcicpLFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpLCBcbiAgICBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKTtcblxuZnVuY3Rpb24gTW9kZWwoKSB7XG4gIHRoaXMuX2RlZnMgPSB7fTtcbiAgdGhpcy5fcHJlZGljYXRlcyA9IHt9O1xuICB0aGlzLl9zY2VuZSA9IG51bGw7XG5cbiAgdGhpcy5ncmFwaCA9IG5ldyBHcmFwaCgpO1xuXG4gIHRoaXMuX25vZGUgPSBuZXcgTm9kZSh0aGlzLmdyYXBoKTtcbiAgdGhpcy5fYnVpbGRlciA9IG51bGw7IC8vIFRvcC1sZXZlbCBzY2VuZWdyYXBoIGJ1aWxkZXJcbn07XG5cbnZhciBwcm90byA9IE1vZGVsLnByb3RvdHlwZTtcblxucHJvdG8uZGVmcyA9IGZ1bmN0aW9uKGRlZnMpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fZGVmcztcbiAgdGhpcy5fZGVmcyA9IGRlZnM7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8uZGF0YSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZGF0YSA9IHRoaXMuZ3JhcGguZGF0YS5hcHBseSh0aGlzLmdyYXBoLCBhcmd1bWVudHMpO1xuICBpZihhcmd1bWVudHMubGVuZ3RoID4gMSkgeyAgLy8gbmV3IERhdGFzb3VyY2VcbiAgICB0aGlzLl9ub2RlLmFkZExpc3RlbmVyKGRhdGEucGlwZWxpbmUoKVswXSk7XG4gIH1cblxuICByZXR1cm4gZGF0YTtcbn07XG5cbmZ1bmN0aW9uIHByZWRpY2F0ZXMobmFtZSkge1xuICB2YXIgbSA9IHRoaXMsIHByZWRpY2F0ZXMgPSB7fTtcbiAgaWYoIWRsLmlzQXJyYXkobmFtZSkpIHJldHVybiB0aGlzLl9wcmVkaWNhdGVzW25hbWVdO1xuICBuYW1lLmZvckVhY2goZnVuY3Rpb24obikgeyBwcmVkaWNhdGVzW25dID0gbS5fcHJlZGljYXRlc1tuXSB9KTtcbiAgcmV0dXJuIHByZWRpY2F0ZXM7XG59XG5cbnByb3RvLnByZWRpY2F0ZSA9IGZ1bmN0aW9uKG5hbWUsIHByZWRpY2F0ZSkge1xuICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAxKSByZXR1cm4gcHJlZGljYXRlcy5jYWxsKHRoaXMsIG5hbWUpO1xuICByZXR1cm4gKHRoaXMuX3ByZWRpY2F0ZXNbbmFtZV0gPSBwcmVkaWNhdGUpO1xufTtcblxucHJvdG8ucHJlZGljYXRlcyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fcHJlZGljYXRlczsgfTtcblxucHJvdG8uc2NlbmUgPSBmdW5jdGlvbihyZW5kZXJlcikge1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3NjZW5lO1xuICBpZih0aGlzLl9idWlsZGVyKSB0aGlzLl9ub2RlLnJlbW92ZUxpc3RlbmVyKHRoaXMuX2J1aWxkZXIuZGlzY29ubmVjdCgpKTtcbiAgdGhpcy5fYnVpbGRlciA9IG5ldyBHcm91cEJ1aWxkZXIodGhpcywgdGhpcy5fZGVmcy5tYXJrcywgdGhpcy5fc2NlbmU9e30pO1xuICB0aGlzLl9ub2RlLmFkZExpc3RlbmVyKHRoaXMuX2J1aWxkZXIuY29ubmVjdCgpKTtcbiAgdmFyIHAgPSB0aGlzLl9idWlsZGVyLnBpcGVsaW5lKCk7XG4gIHBbcC5sZW5ndGgtMV0uYWRkTGlzdGVuZXIocmVuZGVyZXIpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmFkZExpc3RlbmVyID0gZnVuY3Rpb24obCkgeyB0aGlzLl9ub2RlLmFkZExpc3RlbmVyKGwpOyB9O1xucHJvdG8ucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbihsKSB7IHRoaXMuX25vZGUucmVtb3ZlTGlzdGVuZXIobCk7IH07XG5cbnByb3RvLmZpcmUgPSBmdW5jdGlvbihjcykge1xuICBpZighY3MpIGNzID0gY2hhbmdlc2V0LmNyZWF0ZSgpO1xuICB0aGlzLmdyYXBoLnByb3BhZ2F0ZShjcywgdGhpcy5fbm9kZSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsOyIsInZhciBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICAgIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIE5vZGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Ob2RlJyksXG4gICAgcGFyc2VTdHJlYW1zID0gcmVxdWlyZSgnLi4vcGFyc2Uvc3RyZWFtcycpLFxuICAgIGNhbnZhcyA9IHJlcXVpcmUoJy4uL3JlbmRlci9jYW52YXMvaW5kZXgnKSxcbiAgICBzdmcgPSByZXF1aXJlKCcuLi9yZW5kZXIvc3ZnL2luZGV4JyksXG4gICAgVHJhbnNpdGlvbiA9IHJlcXVpcmUoJy4uL3NjZW5lL1RyYW5zaXRpb24nKSxcbiAgICBjb25maWcgPSByZXF1aXJlKCcuLi91dGlsL2NvbmZpZycpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpLFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpO1xuXG52YXIgVmlldyA9IGZ1bmN0aW9uKGVsLCB3aWR0aCwgaGVpZ2h0LCBtb2RlbCkge1xuICB0aGlzLl9lbCAgICA9IG51bGw7XG4gIHRoaXMuX21vZGVsID0gbnVsbDtcbiAgdGhpcy5fd2lkdGggPSB0aGlzLl9fd2lkdGggPSB3aWR0aCB8fCA1MDA7XG4gIHRoaXMuX2hlaWdodCA9IHRoaXMuX19oZWlnaHQgPSBoZWlnaHQgfHwgMzAwO1xuICB0aGlzLl9hdXRvcGFkID0gMTtcbiAgdGhpcy5fcGFkZGluZyA9IHt0b3A6MCwgbGVmdDowLCBib3R0b206MCwgcmlnaHQ6MH07XG4gIHRoaXMuX3ZpZXdwb3J0ID0gbnVsbDtcbiAgdGhpcy5fcmVuZGVyZXIgPSBudWxsO1xuICB0aGlzLl9oYW5kbGVyID0gbnVsbDtcbiAgdGhpcy5faW8gPSBjYW52YXM7XG4gIGlmIChlbCkgdGhpcy5pbml0aWFsaXplKGVsKTtcbn07XG5cbnZhciBwcm90b3R5cGUgPSBWaWV3LnByb3RvdHlwZTtcblxucHJvdG90eXBlLm1vZGVsID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fbW9kZWw7XG4gIGlmICh0aGlzLl9tb2RlbCAhPT0gbW9kZWwpIHtcbiAgICB0aGlzLl9tb2RlbCA9IG1vZGVsO1xuICAgIGlmICh0aGlzLl9oYW5kbGVyKSB0aGlzLl9oYW5kbGVyLm1vZGVsKG1vZGVsKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5kYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuICB2YXIgbSA9IHRoaXMubW9kZWwoKTtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gbS5kYXRhKCk7XG4gIGRsLmtleXMoZGF0YSkuZm9yRWFjaChmdW5jdGlvbihkKSB7IG0uZGF0YShkKS5hZGQoZGwuZHVwbGljYXRlKGRhdGFbZF0pKTsgfSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fX3dpZHRoO1xuICBpZiAodGhpcy5fX3dpZHRoICE9PSB3aWR0aCkge1xuICAgIHRoaXMuX3dpZHRoID0gdGhpcy5fX3dpZHRoID0gd2lkdGg7XG4gICAgaWYgKHRoaXMuX2VsKSB0aGlzLmluaXRpYWxpemUodGhpcy5fZWwucGFyZW50Tm9kZSk7XG4gICAgaWYgKHRoaXMuX3N0cmljdCkgdGhpcy5fYXV0b3BhZCA9IDE7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUuaGVpZ2h0ID0gZnVuY3Rpb24oaGVpZ2h0KSB7XG4gIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX19oZWlnaHQ7XG4gIGlmICh0aGlzLl9faGVpZ2h0ICE9PSBoZWlnaHQpIHtcbiAgICB0aGlzLl9oZWlnaHQgPSB0aGlzLl9faGVpZ2h0ID0gaGVpZ2h0O1xuICAgIGlmICh0aGlzLl9lbCkgdGhpcy5pbml0aWFsaXplKHRoaXMuX2VsLnBhcmVudE5vZGUpO1xuICAgIGlmICh0aGlzLl9zdHJpY3QpIHRoaXMuX2F1dG9wYWQgPSAxO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLnBhZGRpbmcgPSBmdW5jdGlvbihwYWQpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fcGFkZGluZztcbiAgaWYgKHRoaXMuX3BhZGRpbmcgIT09IHBhZCkge1xuICAgIGlmIChkbC5pc1N0cmluZyhwYWQpKSB7XG4gICAgICB0aGlzLl9hdXRvcGFkID0gMTtcbiAgICAgIHRoaXMuX3BhZGRpbmcgPSB7dG9wOjAsIGxlZnQ6MCwgYm90dG9tOjAsIHJpZ2h0OjB9O1xuICAgICAgdGhpcy5fc3RyaWN0ID0gKHBhZCA9PT0gXCJzdHJpY3RcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2F1dG9wYWQgPSAwO1xuICAgICAgdGhpcy5fcGFkZGluZyA9IHBhZDtcbiAgICAgIHRoaXMuX3N0cmljdCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5fZWwpIHtcbiAgICAgIHRoaXMuX3JlbmRlcmVyLnJlc2l6ZSh0aGlzLl93aWR0aCwgdGhpcy5faGVpZ2h0LCBwYWQpO1xuICAgICAgdGhpcy5faGFuZGxlci5wYWRkaW5nKHBhZCk7XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLmF1dG9wYWQgPSBmdW5jdGlvbihvcHQpIHtcbiAgaWYgKHRoaXMuX2F1dG9wYWQgPCAxKSByZXR1cm4gdGhpcztcbiAgZWxzZSB0aGlzLl9hdXRvcGFkID0gMDtcblxuICB2YXIgcGFkID0gdGhpcy5fcGFkZGluZyxcbiAgICAgIGIgPSB0aGlzLm1vZGVsKCkuc2NlbmUoKS5ib3VuZHMsXG4gICAgICBpbnNldCA9IGNvbmZpZy5hdXRvcGFkSW5zZXQsXG4gICAgICBsID0gYi54MSA8IDAgPyBNYXRoLmNlaWwoLWIueDEpICsgaW5zZXQgOiAwLFxuICAgICAgdCA9IGIueTEgPCAwID8gTWF0aC5jZWlsKC1iLnkxKSArIGluc2V0IDogMCxcbiAgICAgIHIgPSBiLngyID4gdGhpcy5fd2lkdGggID8gTWF0aC5jZWlsKCtiLngyIC0gdGhpcy5fd2lkdGgpICsgaW5zZXQgOiAwLFxuICAgICAgYiA9IGIueTIgPiB0aGlzLl9oZWlnaHQgPyBNYXRoLmNlaWwoK2IueTIgLSB0aGlzLl9oZWlnaHQpICsgaW5zZXQgOiAwO1xuICBwYWQgPSB7bGVmdDpsLCB0b3A6dCwgcmlnaHQ6ciwgYm90dG9tOmJ9O1xuXG4gIGlmICh0aGlzLl9zdHJpY3QpIHtcbiAgICB0aGlzLl9hdXRvcGFkID0gMDtcbiAgICB0aGlzLl9wYWRkaW5nID0gcGFkO1xuICAgIHRoaXMuX3dpZHRoID0gTWF0aC5tYXgoMCwgdGhpcy5fX3dpZHRoIC0gKGwrcikpO1xuICAgIHRoaXMuX2hlaWdodCA9IE1hdGgubWF4KDAsIHRoaXMuX19oZWlnaHQgLSAodCtiKSk7XG4gICAgdGhpcy5fbW9kZWwud2lkdGgodGhpcy5fd2lkdGgpO1xuICAgIHRoaXMuX21vZGVsLmhlaWdodCh0aGlzLl9oZWlnaHQpO1xuICAgIGlmICh0aGlzLl9lbCkgdGhpcy5pbml0aWFsaXplKHRoaXMuX2VsLnBhcmVudE5vZGUpO1xuICAgIHRoaXMudXBkYXRlKCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5wYWRkaW5nKHBhZCkudXBkYXRlKG9wdCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUudmlld3BvcnQgPSBmdW5jdGlvbihzaXplKSB7XG4gIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3ZpZXdwb3J0O1xuICBpZiAodGhpcy5fdmlld3BvcnQgIT09IHNpemUpIHtcbiAgICB0aGlzLl92aWV3cG9ydCA9IHNpemU7XG4gICAgaWYgKHRoaXMuX2VsKSB0aGlzLmluaXRpYWxpemUodGhpcy5fZWwucGFyZW50Tm9kZSk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUucmVuZGVyZXIgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX2lvO1xuICBpZiAodHlwZSA9PT0gXCJjYW52YXNcIikgdHlwZSA9IGNhbnZhcztcbiAgaWYgKHR5cGUgPT09IFwic3ZnXCIpIHR5cGUgPSBzdmc7XG4gIGlmICh0aGlzLl9pbyAhPT0gdHlwZSkge1xuICAgIHRoaXMuX2lvID0gdHlwZTtcbiAgICB0aGlzLl9yZW5kZXJlciA9IG51bGw7XG4gICAgaWYgKHRoaXMuX2VsKSB0aGlzLmluaXRpYWxpemUodGhpcy5fZWwucGFyZW50Tm9kZSk7XG4gICAgaWYgKHRoaXMuX2J1aWxkKSB0aGlzLnJlbmRlcigpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbihlbCkge1xuICB2YXIgdiA9IHRoaXMsIHByZXZIYW5kbGVyLFxuICAgICAgdyA9IHYuX3dpZHRoLCBoID0gdi5faGVpZ2h0LCBwYWQgPSB2Ll9wYWRkaW5nO1xuICBcbiAgLy8gY2xlYXIgcHJlLWV4aXN0aW5nIGNvbnRhaW5lclxuICBkMy5zZWxlY3QoZWwpLnNlbGVjdChcImRpdi52ZWdhXCIpLnJlbW92ZSgpO1xuICBcbiAgLy8gYWRkIGRpdiBjb250YWluZXJcbiAgdGhpcy5fZWwgPSBlbCA9IGQzLnNlbGVjdChlbClcbiAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInZlZ2FcIilcbiAgICAuc3R5bGUoXCJwb3NpdGlvblwiLCBcInJlbGF0aXZlXCIpXG4gICAgLm5vZGUoKTtcbiAgaWYgKHYuX3ZpZXdwb3J0KSB7XG4gICAgZDMuc2VsZWN0KGVsKVxuICAgICAgLnN0eWxlKFwid2lkdGhcIiwgICh2Ll92aWV3cG9ydFswXSB8fCB3KStcInB4XCIpXG4gICAgICAuc3R5bGUoXCJoZWlnaHRcIiwgKHYuX3ZpZXdwb3J0WzFdIHx8IGgpK1wicHhcIilcbiAgICAgIC5zdHlsZShcIm92ZXJmbG93XCIsIFwiYXV0b1wiKTtcbiAgfVxuICBcbiAgLy8gcmVuZGVyZXJcbiAgdi5fcmVuZGVyZXIgPSAodi5fcmVuZGVyZXIgfHwgbmV3IHRoaXMuX2lvLlJlbmRlcmVyKCkpXG4gICAgLmluaXRpYWxpemUoZWwsIHcsIGgsIHBhZCk7XG4gIFxuICAvLyBpbnB1dCBoYW5kbGVyXG4gIHByZXZIYW5kbGVyID0gdi5faGFuZGxlcjtcbiAgdi5faGFuZGxlciA9IG5ldyB0aGlzLl9pby5IYW5kbGVyKClcbiAgICAuaW5pdGlhbGl6ZShlbCwgcGFkLCB2KVxuICAgIC5tb2RlbCh2Ll9tb2RlbCk7XG5cbiAgaWYgKHByZXZIYW5kbGVyKSB7XG4gICAgcHJldkhhbmRsZXIuaGFuZGxlcnMoKS5mb3JFYWNoKGZ1bmN0aW9uKGgpIHtcbiAgICAgIHYuX2hhbmRsZXIub24oaC50eXBlLCBoLmhhbmRsZXIpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIC8vIFJlZ2lzdGVyIGV2ZW50IGxpc3RlbmVycyBmb3Igc2lnbmFsIHN0cmVhbSBkZWZpbml0aW9ucy5cbiAgICBwYXJzZVN0cmVhbXModGhpcyk7XG4gIH1cbiAgXG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKG9wdCkgeyAgICBcbiAgb3B0ID0gb3B0IHx8IHt9O1xuICB2YXIgdiA9IHRoaXMsXG4gICAgICB0cmFucyA9IG9wdC5kdXJhdGlvblxuICAgICAgICA/IG5ldyBUcmFuc2l0aW9uKG9wdC5kdXJhdGlvbiwgb3B0LmVhc2UpXG4gICAgICAgIDogbnVsbDtcblxuICAvLyBUT0RPOiB3aXRoIHN0cmVhbWluZyBkYXRhIEFQSSwgYWRkcyBzaG91bGQgZGwuZHVwbGljYXRlIGp1c3QgcGFyc2VTcGVjXG4gIC8vIHRvIHByZXZlbnQgVmVnYSBmcm9tIHBvbGx1dGluZyB0aGUgZW52aXJvbm1lbnQuXG5cbiAgdmFyIGNzID0gY2hhbmdlc2V0LmNyZWF0ZSgpO1xuICBpZih0cmFucykgY3MudHJhbnMgPSB0cmFucztcbiAgaWYob3B0LnJlZmxvdyAhPT0gdW5kZWZpbmVkKSBjcy5yZWZsb3cgPSBvcHQucmVmbG93XG5cbiAgaWYoIXYuX2J1aWxkKSB7XG4gICAgdi5fcmVuZGVyTm9kZSA9IG5ldyBOb2RlKHYuX21vZGVsLmdyYXBoKVxuICAgICAgLnJvdXRlcih0cnVlKTtcblxuICAgIHYuX3JlbmRlck5vZGUuZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgZGVidWcoaW5wdXQsIFtcInJlbmRlcmluZ1wiXSk7XG5cbiAgICAgIHZhciBzID0gdi5fbW9kZWwuc2NlbmUoKTtcbiAgICAgIGlmKGlucHV0LnRyYW5zKSB7XG4gICAgICAgIGlucHV0LnRyYW5zLnN0YXJ0KGZ1bmN0aW9uKGl0ZW1zKSB7IHYuX3JlbmRlcmVyLnJlbmRlcihzLCBpdGVtcyk7IH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdi5fcmVuZGVyZXIucmVuZGVyKHMpO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3IgYWxsIHVwZGF0ZWQgZGF0YXNvdXJjZXMsIGZpbmFsaXplIHRoZWlyIGNoYW5nZXNldHMuXG4gICAgICB2YXIgZCwgZHM7XG4gICAgICBmb3IoZCBpbiBpbnB1dC5kYXRhKSB7XG4gICAgICAgIGRzID0gdi5fbW9kZWwuZGF0YShkKTtcbiAgICAgICAgaWYoIWRzLnJldmlzZXMoKSkgY29udGludWU7XG4gICAgICAgIGNoYW5nZXNldC5maW5hbGl6ZShkcy5sYXN0KCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfTtcblxuICAgIHYuX21vZGVsLnNjZW5lKHYuX3JlbmRlck5vZGUpO1xuICAgIHYuX2J1aWxkID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIFB1bHNlIHRoZSBlbnRpcmUgbW9kZWwgKERhdGFzb3VyY2VzICsgc2NlbmUpLlxuICB2Ll9tb2RlbC5maXJlKGNzKTtcblxuICByZXR1cm4gdi5hdXRvcGFkKG9wdCk7XG59O1xuXG5wcm90b3R5cGUub24gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5faGFuZGxlci5vbi5hcHBseSh0aGlzLl9oYW5kbGVyLCBhcmd1bWVudHMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5faGFuZGxlci5vZmYuYXBwbHkodGhpcy5faGFuZGxlciwgYXJndW1lbnRzKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5WaWV3LmZhY3RvcnkgPSBmdW5jdGlvbihtb2RlbCkge1xuICByZXR1cm4gZnVuY3Rpb24ob3B0KSB7XG4gICAgb3B0ID0gb3B0IHx8IHt9O1xuICAgIHZhciBkZWZzID0gbW9kZWwuZGVmcygpO1xuICAgIHZhciB2ID0gbmV3IFZpZXcoKVxuICAgICAgLm1vZGVsKG1vZGVsKVxuICAgICAgLndpZHRoKGRlZnMud2lkdGgpXG4gICAgICAuaGVpZ2h0KGRlZnMuaGVpZ2h0KVxuICAgICAgLnBhZGRpbmcoZGVmcy5wYWRkaW5nKVxuICAgICAgLnJlbmRlcmVyKG9wdC5yZW5kZXJlciB8fCBcImNhbnZhc1wiKTtcblxuICAgIGlmIChvcHQuZWwpIHYuaW5pdGlhbGl6ZShvcHQuZWwpO1xuICAgIGlmIChvcHQuZGF0YSkgdi5kYXRhKG9wdC5kYXRhKTtcbiAgXG4gICAgcmV0dXJuIHY7XG4gIH07ICAgIFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3OyIsInZhciBOb2RlID0gcmVxdWlyZSgnLi9Ob2RlJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi9jaGFuZ2VzZXQnKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gQ29sbGVjdG9yKGdyYXBoKSB7XG4gIE5vZGUucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIHRoaXMuX2RhdGEgPSBbXTtcbiAgcmV0dXJuIHRoaXMucm91dGVyKHRydWUpXG4gICAgLmNvbGxlY3Rvcih0cnVlKTtcbn1cblxudmFyIHByb3RvID0gKENvbGxlY3Rvci5wcm90b3R5cGUgPSBuZXcgTm9kZSgpKTtcblxucHJvdG8uZGF0YSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fZGF0YTsgfVxuXG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGRlYnVnKGlucHV0LCBbXCJjb2xsZWN0aW5nXCJdKTtcblxuICBpZihpbnB1dC5yZWZsb3cpIHtcbiAgICBpbnB1dCA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpO1xuICAgIGlucHV0Lm1vZCA9IHRoaXMuX2RhdGEuc2xpY2UoKTtcbiAgICByZXR1cm4gaW5wdXQ7XG4gIH1cblxuICBpZihpbnB1dC5yZW0ubGVuZ3RoKSB7XG4gICAgdmFyIGlkcyA9IGlucHV0LnJlbS5yZWR1Y2UoZnVuY3Rpb24obSx4KSB7IHJldHVybiAobVt4Ll9pZF09MSwgbSk7IH0sIHt9KTtcbiAgICB0aGlzLl9kYXRhID0gdGhpcy5fZGF0YS5maWx0ZXIoZnVuY3Rpb24oeCkgeyByZXR1cm4gaWRzW3guX2lkXSAhPT0gMTsgfSk7XG4gIH1cblxuICBpZihpbnB1dC5hZGQubGVuZ3RoKSB7XG4gICAgdGhpcy5fZGF0YSA9IHRoaXMuX2RhdGEubGVuZ3RoID8gdGhpcy5fZGF0YS5jb25jYXQoaW5wdXQuYWRkKSA6IGlucHV0LmFkZDtcbiAgfVxuXG4gIGlmKGlucHV0LnNvcnQpIHtcbiAgICB0aGlzLl9kYXRhLnNvcnQoaW5wdXQuc29ydCk7XG4gIH1cblxuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbGxlY3RvcjsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi9jaGFuZ2VzZXQnKSwgXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuL3R1cGxlJyksIFxuICAgIE5vZGUgPSByZXF1aXJlKCcuL05vZGUnKSxcbiAgICBDb2xsZWN0b3IgPSByZXF1aXJlKCcuL0NvbGxlY3RvcicpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBEYXRhc291cmNlKGdyYXBoLCBuYW1lLCBmYWNldCkge1xuICB0aGlzLl9ncmFwaCA9IGdyYXBoO1xuICB0aGlzLl9uYW1lID0gbmFtZTtcbiAgdGhpcy5fZGF0YSA9IFtdO1xuICB0aGlzLl9zb3VyY2UgPSBudWxsO1xuICB0aGlzLl9mYWNldCA9IGZhY2V0O1xuICB0aGlzLl9pbnB1dCA9IGNoYW5nZXNldC5jcmVhdGUoKTtcbiAgdGhpcy5fb3V0cHV0ID0gbnVsbDsgICAgLy8gT3V0cHV0IGNoYW5nZXNldFxuXG4gIHRoaXMuX3BpcGVsaW5lICA9IG51bGw7IC8vIFBpcGVsaW5lIG9mIHRyYW5zZm9ybWF0aW9ucy5cbiAgdGhpcy5fY29sbGVjdG9yID0gbnVsbDsgLy8gQ29sbGVjdG9yIHRvIG1hdGVyaWFsaXplIG91dHB1dCBvZiBwaXBlbGluZVxuICB0aGlzLl9yZXZpc2VzID0gZmFsc2U7IC8vIERvZXMgYW55IHBpcGVsaW5lIG9wZXJhdG9yIG5lZWQgdG8gdHJhY2sgcHJldj9cbn07XG5cbnZhciBwcm90byA9IERhdGFzb3VyY2UucHJvdG90eXBlO1xuXG5wcm90by5uYW1lID0gZnVuY3Rpb24obmFtZSkge1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX25hbWU7XG4gIHJldHVybiAodGhpcy5fbmFtZSA9IG5hbWUsIHRoaXMpO1xufTtcblxucHJvdG8uc291cmNlID0gZnVuY3Rpb24oc3JjKSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fc291cmNlO1xuICByZXR1cm4gKHRoaXMuX3NvdXJjZSA9IHRoaXMuX2dyYXBoLmRhdGEoc3JjKSk7XG59O1xuXG5wcm90by5hZGQgPSBmdW5jdGlvbihkKSB7XG4gIHZhciBwcmV2ID0gdGhpcy5fcmV2aXNlcyA/IG51bGwgOiB1bmRlZmluZWQ7XG5cbiAgdGhpcy5faW5wdXQuYWRkID0gdGhpcy5faW5wdXQuYWRkXG4gICAgLmNvbmNhdChkbC5hcnJheShkKS5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gdHVwbGUuaW5nZXN0KGQsIHByZXYpOyB9KSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24od2hlcmUpIHtcbiAgdmFyIGQgPSB0aGlzLl9kYXRhLmZpbHRlcih3aGVyZSk7XG4gIHRoaXMuX2lucHV0LnJlbSA9IHRoaXMuX2lucHV0LnJlbS5jb25jYXQoZCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8udXBkYXRlID0gZnVuY3Rpb24od2hlcmUsIGZpZWxkLCBmdW5jKSB7XG4gIHZhciBtb2QgPSB0aGlzLl9pbnB1dC5tb2QsXG4gICAgICBpZHMgPSB0dXBsZS5pZE1hcChtb2QpLFxuICAgICAgcHJldiA9IHRoaXMuX3JldmlzZXMgPyBudWxsIDogdW5kZWZpbmVkOyBcblxuICB0aGlzLl9pbnB1dC5maWVsZHNbZmllbGRdID0gMTtcbiAgdGhpcy5fZGF0YS5maWx0ZXIod2hlcmUpLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgIHZhciBwcmV2ID0geFtmaWVsZF0sXG4gICAgICAgIG5leHQgPSBmdW5jKHgpO1xuICAgIGlmIChwcmV2ICE9PSBuZXh0KSB7XG4gICAgICB0dXBsZS5zZXQoeCwgZmllbGQsIG5leHQpO1xuICAgICAgaWYoaWRzW3guX2lkXSAhPT0gMSkge1xuICAgICAgICBtb2QucHVzaCh4KTtcbiAgICAgICAgaWRzW3guX2lkXSA9IDE7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by52YWx1ZXMgPSBmdW5jdGlvbihkYXRhKSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgIHJldHVybiB0aGlzLl9jb2xsZWN0b3IgPyB0aGlzLl9jb2xsZWN0b3IuZGF0YSgpIDogdGhpcy5fZGF0YTtcblxuICAvLyBSZXBsYWNlIGJhY2tpbmcgZGF0YVxuICB0aGlzLl9pbnB1dC5yZW0gPSB0aGlzLl9kYXRhLnNsaWNlKCk7XG4gIGlmIChkYXRhKSB7IHRoaXMuYWRkKGRhdGEpOyB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuZnVuY3Rpb24gc2V0X3ByZXYoZCkgeyBpZihkLl9wcmV2ID09PSB1bmRlZmluZWQpIGQuX3ByZXYgPSBDLlNFTlRJTkVMOyB9XG5cbnByb3RvLnJldmlzZXMgPSBmdW5jdGlvbihwKSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fcmV2aXNlcztcblxuICAvLyBJZiB3ZSd2ZSBub3QgbmVlZGVkIHByZXYgaW4gdGhlIHBhc3QsIGJ1dCBhIG5ldyBkYXRhZmxvdyBub2RlIG5lZWRzIGl0IG5vd1xuICAvLyBlbnN1cmUgZXhpc3RpbmcgdHVwbGVzIGhhdmUgcHJldiBzZXQuXG4gIGlmKCF0aGlzLl9yZXZpc2VzICYmIHApIHtcbiAgICB0aGlzLl9kYXRhLmZvckVhY2goc2V0X3ByZXYpO1xuICAgIHRoaXMuX2lucHV0LmFkZC5mb3JFYWNoKHNldF9wcmV2KTsgLy8gTmV3IHR1cGxlcyB0aGF0IGhhdmVuJ3QgeWV0IGJlZW4gbWVyZ2VkIGludG8gX2RhdGFcbiAgfVxuXG4gIHRoaXMuX3JldmlzZXMgPSB0aGlzLl9yZXZpc2VzIHx8IHA7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8ubGFzdCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fb3V0cHV0OyB9O1xuXG5wcm90by5maXJlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaWYoaW5wdXQpIHRoaXMuX2lucHV0ID0gaW5wdXQ7XG4gIHRoaXMuX2dyYXBoLnByb3BhZ2F0ZSh0aGlzLl9pbnB1dCwgdGhpcy5fcGlwZWxpbmVbMF0pOyBcbn07XG5cbnByb3RvLnBpcGVsaW5lID0gZnVuY3Rpb24ocGlwZWxpbmUpIHtcbiAgdmFyIGRzID0gdGhpcywgbiwgYztcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9waXBlbGluZTtcblxuICBpZihwaXBlbGluZS5sZW5ndGgpIHtcbiAgICAvLyBJZiB3ZSBoYXZlIGEgcGlwZWxpbmUsIGFkZCBhIGNvbGxlY3RvciB0byB0aGUgZW5kIHRvIG1hdGVyaWFsaXplXG4gICAgLy8gdGhlIG91dHB1dC5cbiAgICBkcy5fY29sbGVjdG9yID0gbmV3IENvbGxlY3Rvcih0aGlzLl9ncmFwaCk7XG4gICAgcGlwZWxpbmUucHVzaChkcy5fY29sbGVjdG9yKTtcbiAgICBkcy5fcmV2aXNlcyA9IHBpcGVsaW5lLnNvbWUoZnVuY3Rpb24ocCkgeyByZXR1cm4gcC5yZXZpc2VzKCk7IH0pO1xuICB9XG5cbiAgLy8gSW5wdXQgbm9kZSBhcHBsaWVzIHRoZSBkYXRhc291cmNlJ3MgZGVsdGEsIGFuZCBwcm9wYWdhdGVzIGl0IHRvIFxuICAvLyB0aGUgcmVzdCBvZiB0aGUgcGlwZWxpbmUuIEl0IHJlY2VpdmVzIHRvdWNoZXMgdG8gcmVmbG93IGRhdGEuXG4gIHZhciBpbnB1dCA9IG5ldyBOb2RlKHRoaXMuX2dyYXBoKVxuICAgIC5yb3V0ZXIodHJ1ZSlcbiAgICAuY29sbGVjdG9yKHRydWUpO1xuXG4gIGlucHV0LmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICBkZWJ1ZyhpbnB1dCwgW1wiaW5wdXRcIiwgZHMuX25hbWVdKTtcblxuICAgIHZhciBkZWx0YSA9IGRzLl9pbnB1dCwgXG4gICAgICAgIG91dCA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpLFxuICAgICAgICByZW07XG5cbiAgICAvLyBEZWx0YSBtaWdodCBjb250YWluIGZpZWxkcyB1cGRhdGVkIHRocm91Z2ggQVBJXG4gICAgZGwua2V5cyhkZWx0YS5maWVsZHMpLmZvckVhY2goZnVuY3Rpb24oZikgeyBvdXQuZmllbGRzW2ZdID0gMSB9KTtcblxuICAgIGlmKGlucHV0LnJlZmxvdykge1xuICAgICAgb3V0Lm1vZCA9IGRzLl9kYXRhLnNsaWNlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHVwZGF0ZSBkYXRhXG4gICAgICBpZihkZWx0YS5yZW0ubGVuZ3RoKSB7XG4gICAgICAgIHJlbSA9IHR1cGxlLmlkTWFwKGRlbHRhLnJlbSk7XG4gICAgICAgIGRzLl9kYXRhID0gZHMuX2RhdGFcbiAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHJlbVt4Ll9pZF0gIT09IDEgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmKGRlbHRhLmFkZC5sZW5ndGgpIGRzLl9kYXRhID0gZHMuX2RhdGEuY29uY2F0KGRlbHRhLmFkZCk7XG5cbiAgICAgIC8vIHJlc2V0IGNoYW5nZSBsaXN0XG4gICAgICBkcy5faW5wdXQgPSBjaGFuZ2VzZXQuY3JlYXRlKCk7XG5cbiAgICAgIG91dC5hZGQgPSBkZWx0YS5hZGQ7IFxuICAgICAgb3V0Lm1vZCA9IGRlbHRhLm1vZDtcbiAgICAgIG91dC5yZW0gPSBkZWx0YS5yZW07XG4gICAgfVxuXG4gICAgcmV0dXJuIChvdXQuZmFjZXQgPSBkcy5fZmFjZXQsIG91dCk7XG4gIH07XG5cbiAgcGlwZWxpbmUudW5zaGlmdChpbnB1dCk7XG5cbiAgLy8gT3V0cHV0IG5vZGUgY2FwdHVyZXMgdGhlIGxhc3QgY2hhbmdlc2V0IHNlZW4gYnkgdGhpcyBkYXRhc291cmNlXG4gIC8vIChuZWVkZWQgZm9yIGpvaW5zIGFuZCBidWlsZHMpIGFuZCBtYXRlcmlhbGl6ZXMgYW55IG5lc3RlZCBkYXRhLlxuICAvLyBJZiB0aGlzIGRhdGFzb3VyY2UgaXMgZmFjZXRlZCwgbWF0ZXJpYWxpemVzIHRoZSB2YWx1ZXMgaW4gdGhlIGZhY2V0LlxuICB2YXIgb3V0cHV0ID0gbmV3IE5vZGUodGhpcy5fZ3JhcGgpXG4gICAgLnJvdXRlcih0cnVlKVxuICAgIC5jb2xsZWN0b3IodHJ1ZSk7XG5cbiAgb3V0cHV0LmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICBkZWJ1ZyhpbnB1dCwgW1wib3V0cHV0XCIsIGRzLl9uYW1lXSk7XG4gICAgdmFyIG91dHB1dCA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQsIHRydWUpO1xuXG4gICAgaWYoZHMuX2ZhY2V0KSB7XG4gICAgICBkcy5fZmFjZXQudmFsdWVzID0gZHMudmFsdWVzKCk7XG4gICAgICBpbnB1dC5mYWNldCA9IG51bGw7XG4gICAgfVxuXG4gICAgZHMuX291dHB1dCA9IGlucHV0O1xuICAgIG91dHB1dC5kYXRhW2RzLl9uYW1lXSA9IDE7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfTtcblxuICBwaXBlbGluZS5wdXNoKG91dHB1dCk7XG5cbiAgdGhpcy5fcGlwZWxpbmUgPSBwaXBlbGluZTtcbiAgdGhpcy5fZ3JhcGguY29ubmVjdChkcy5fcGlwZWxpbmUpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmxpc3RlbmVyID0gZnVuY3Rpb24oKSB7IFxuICB2YXIgbCA9IG5ldyBOb2RlKHRoaXMuX2dyYXBoKS5yb3V0ZXIodHJ1ZSksXG4gICAgICBkZXN0ID0gdGhpcyxcbiAgICAgIHByZXYgPSB0aGlzLl9yZXZpc2VzID8gbnVsbCA6IHVuZGVmaW5lZDtcblxuICBsLmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICBkZXN0Ll9zcmNNYXAgPSBkZXN0Ll9zcmNNYXAgfHwge307ICAvLyB0byBwcm9wYWdhdGUgdHVwbGVzIGNvcnJlY3RseVxuICAgIHZhciBtYXAgPSBkZXN0Ll9zcmNNYXAsXG4gICAgICAgIG91dHB1dCAgPSBjaGFuZ2VzZXQuY3JlYXRlKGlucHV0KTtcblxuICAgIG91dHB1dC5hZGQgPSBpbnB1dC5hZGQubWFwKGZ1bmN0aW9uKHQpIHtcbiAgICAgIHJldHVybiAobWFwW3QuX2lkXSA9IHR1cGxlLmRlcml2ZSh0LCB0Ll9wcmV2ICE9PSB1bmRlZmluZWQgPyB0Ll9wcmV2IDogcHJldikpO1xuICAgIH0pO1xuICAgIG91dHB1dC5tb2QgPSBpbnB1dC5tb2QubWFwKGZ1bmN0aW9uKHQpIHsgcmV0dXJuIG1hcFt0Ll9pZF07IH0pO1xuICAgIG91dHB1dC5yZW0gPSBpbnB1dC5yZW0ubWFwKGZ1bmN0aW9uKHQpIHsgXG4gICAgICB2YXIgbyA9IG1hcFt0Ll9pZF07XG4gICAgICBtYXBbdC5faWRdID0gbnVsbDtcbiAgICAgIHJldHVybiBvO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIChkZXN0Ll9pbnB1dCA9IG91dHB1dCk7XG4gIH07XG5cbiAgbC5hZGRMaXN0ZW5lcih0aGlzLl9waXBlbGluZVswXSk7XG4gIHJldHVybiBsO1xufTtcblxucHJvdG8uYWRkTGlzdGVuZXIgPSBmdW5jdGlvbihsKSB7XG4gIGlmKGwgaW5zdGFuY2VvZiBEYXRhc291cmNlKSB7XG4gICAgaWYodGhpcy5fY29sbGVjdG9yKSB0aGlzLl9jb2xsZWN0b3IuYWRkTGlzdGVuZXIobC5saXN0ZW5lcigpKTtcbiAgICBlbHNlIHRoaXMuX3BpcGVsaW5lWzBdLmFkZExpc3RlbmVyKGwubGlzdGVuZXIoKSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fcGlwZWxpbmVbdGhpcy5fcGlwZWxpbmUubGVuZ3RoLTFdLmFkZExpc3RlbmVyKGwpOyAgICAgIFxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKGwpIHtcbiAgdGhpcy5fcGlwZWxpbmVbdGhpcy5fcGlwZWxpbmUubGVuZ3RoLTFdLnJlbW92ZUxpc3RlbmVyKGwpO1xufTtcblxucHJvdG8ubGlzdGVuZXJzID0gZnVuY3Rpb24oZHMpIHtcbiAgcmV0dXJuIGRzIFxuICAgID8gdGhpcy5fY29sbGVjdG9yID8gdGhpcy5fY29sbGVjdG9yLmxpc3RlbmVycygpIDogdGhpcy5fcGlwZWxpbmVbMF0ubGlzdGVuZXJzKClcbiAgICA6IHRoaXMuX3BpcGVsaW5lW3RoaXMuX3BpcGVsaW5lLmxlbmd0aC0xXS5saXN0ZW5lcnMoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRGF0YXNvdXJjZTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgSGVhcCA9IHJlcXVpcmUoJ2hlYXAnKSxcbiAgICBEYXRhc291cmNlID0gcmVxdWlyZSgnLi9EYXRhc291cmNlJyksXG4gICAgU2lnbmFsID0gcmVxdWlyZSgnLi9TaWduYWwnKSxcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCcuL2NoYW5nZXNldCcpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBHcmFwaCgpIHtcbiAgdGhpcy5fc3RhbXAgPSAwO1xuICB0aGlzLl9yYW5rICA9IDA7XG5cbiAgdGhpcy5fZGF0YSA9IHt9O1xuICB0aGlzLl9zaWduYWxzID0ge307XG5cbiAgdGhpcy5kb05vdFByb3BhZ2F0ZSA9IHt9O1xufVxuXG52YXIgcHJvdG8gPSBHcmFwaC5wcm90b3R5cGU7XG5cbnByb3RvLmRhdGEgPSBmdW5jdGlvbihuYW1lLCBwaXBlbGluZSwgZmFjZXQpIHtcbiAgdmFyIGRiID0gdGhpcy5fZGF0YTtcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBkbC5rZXlzKGRiKS5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZGJbZF07IH0pO1xuICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAxKSByZXR1cm4gZGJbbmFtZV07XG4gIHJldHVybiAoZGJbbmFtZV0gPSBuZXcgRGF0YXNvdXJjZSh0aGlzLCBuYW1lLCBmYWNldCkucGlwZWxpbmUocGlwZWxpbmUpKTtcbn07XG5cbmZ1bmN0aW9uIHNpZ25hbChuYW1lKSB7XG4gIHZhciBtID0gdGhpcywgaSwgbGVuO1xuICBpZighZGwuaXNBcnJheShuYW1lKSkgcmV0dXJuIHRoaXMuX3NpZ25hbHNbbmFtZV07XG4gIHJldHVybiBuYW1lLm1hcChmdW5jdGlvbihuKSB7IG0uX3NpZ25hbHNbbl07IH0pO1xufVxuXG5wcm90by5zaWduYWwgPSBmdW5jdGlvbihuYW1lLCBpbml0KSB7XG4gIHZhciBtID0gdGhpcztcbiAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIHNpZ25hbC5jYWxsKHRoaXMsIG5hbWUpO1xuICByZXR1cm4gKHRoaXMuX3NpZ25hbHNbbmFtZV0gPSBuZXcgU2lnbmFsKHRoaXMsIG5hbWUsIGluaXQpKTtcbn07XG5cbnByb3RvLnNpZ25hbFZhbHVlcyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIGdyYXBoID0gdGhpcztcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIG5hbWUgPSBkbC5rZXlzKHRoaXMuX3NpZ25hbHMpO1xuICBpZighZGwuaXNBcnJheShuYW1lKSkgcmV0dXJuIHRoaXMuX3NpZ25hbHNbbmFtZV0udmFsdWUoKTtcbiAgcmV0dXJuIG5hbWUucmVkdWNlKGZ1bmN0aW9uKHNnLCBuKSB7XG4gICAgcmV0dXJuIChzZ1tuXSA9IGdyYXBoLl9zaWduYWxzW25dLnZhbHVlKCksIHNnKTtcbiAgfSwge30pO1xufTtcblxucHJvdG8uc2lnbmFsUmVmID0gZnVuY3Rpb24ocmVmKSB7XG4gIGlmKCFkbC5pc0FycmF5KHJlZikpIHJlZiA9IGRsLmZpZWxkKHJlZik7XG4gIHZhciB2YWx1ZSA9IHRoaXMuc2lnbmFsKHJlZi5zaGlmdCgpKS52YWx1ZSgpO1xuICBpZihyZWYubGVuZ3RoID4gMCkge1xuICAgIHZhciBmbiA9IEZ1bmN0aW9uKFwic1wiLCBcInJldHVybiBzW1wiK3JlZi5tYXAoZGwuc3RyKS5qb2luKFwiXVtcIikrXCJdXCIpO1xuICAgIHZhbHVlID0gZm4uY2FsbChudWxsLCB2YWx1ZSk7XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59O1xuXG52YXIgc2NoZWR1bGUgPSBmdW5jdGlvbihhLCBiKSB7XG4gIC8vIElmIHRoZSBub2RlcyBhcmUgZXF1YWwsIHByb3BhZ2F0ZSB0aGUgbm9uLXJlZmxvdyBwdWxzZSBmaXJzdCxcbiAgLy8gc28gdGhhdCB3ZSBjYW4gaWdub3JlIHN1YnNlcXVlbnQgcmVmbG93IHB1bHNlcy4gXG4gIGlmKGEucmFuayA9PSBiLnJhbmspIHJldHVybiBhLnB1bHNlLnJlZmxvdyA/IDEgOiAtMTtcbiAgZWxzZSByZXR1cm4gYS5yYW5rIC0gYi5yYW5rOyBcbn07XG5cbnByb3RvLnByb3BhZ2F0ZSA9IGZ1bmN0aW9uKHB1bHNlLCBub2RlKSB7XG4gIHZhciB2LCBsLCBuLCBwLCByLCBpLCBsZW4sIHJlZmxvd2VkO1xuXG4gIC8vIG5ldyBQUSB3aXRoIGVhY2ggcHJvcGFnYXRpb24gY3ljbGUgc28gdGhhdCB3ZSBjYW4gcHVsc2UgYnJhbmNoZXNcbiAgLy8gb2YgdGhlIGRhdGFmbG93IGdyYXBoIGR1cmluZyBhIHByb3BhZ2F0aW9uIChlLmcuLCB3aGVuIGNyZWF0aW5nXG4gIC8vIGEgbmV3IGlubGluZSBkYXRhc291cmNlKS5cbiAgdmFyIHBxID0gbmV3IEhlYXAoc2NoZWR1bGUpOyBcblxuICBpZihwdWxzZS5zdGFtcCkgdGhyb3cgXCJQdWxzZSBhbHJlYWR5IGhhcyBhIG5vbi16ZXJvIHN0YW1wXCJcblxuICBwdWxzZS5zdGFtcCA9ICsrdGhpcy5fc3RhbXA7XG4gIHBxLnB1c2goeyBub2RlOiBub2RlLCBwdWxzZTogcHVsc2UsIHJhbms6IG5vZGUucmFuaygpIH0pO1xuXG4gIHdoaWxlIChwcS5zaXplKCkgPiAwKSB7XG4gICAgdiA9IHBxLnBvcCgpLCBuID0gdi5ub2RlLCBwID0gdi5wdWxzZSwgciA9IHYucmFuaywgbCA9IG4uX2xpc3RlbmVycztcbiAgICByZWZsb3dlZCA9IHAucmVmbG93ICYmIG4ubGFzdCgpID49IHAuc3RhbXA7XG5cbiAgICBpZihyZWZsb3dlZCkgY29udGludWU7IC8vIERvbid0IG5lZWRsZXNzbHkgcmVmbG93IG9wcy5cblxuICAgIC8vIEEgbm9kZSdzIHJhbmsgbWlnaHQgY2hhbmdlIGR1cmluZyBhIHByb3BhZ2F0aW9uIChlLmcuIGluc3RhbnRpYXRpbmdcbiAgICAvLyBhIGdyb3VwJ3MgZGF0YWZsb3cgYnJhbmNoKS4gUmUtcXVldWUgaWYgaXQgaGFzLiBUXG4gICAgLy8gVE9ETzogdXNlIHBxLnJlcGxhY2Ugb3IgcHEucG9wcHVzaD9cbiAgICBpZihyICE9IG4ucmFuaygpKSB7XG4gICAgICBkZWJ1ZyhwLCBbJ1JhbmsgbWlzbWF0Y2gnLCByLCBuLnJhbmsoKV0pO1xuICAgICAgcHEucHVzaCh7IG5vZGU6IG4sIHB1bHNlOiBwLCByYW5rOiBuLnJhbmsoKSB9KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHAgPSB0aGlzLmV2YWx1YXRlKHAsIG4pO1xuXG4gICAgLy8gRXZlbiBpZiB3ZSBkaWRuJ3QgcnVuIHRoZSBub2RlLCB3ZSBzdGlsbCB3YW50IHRvIHByb3BhZ2F0ZSBcbiAgICAvLyB0aGUgcHVsc2UuIFxuICAgIGlmIChwICE9PSB0aGlzLmRvTm90UHJvcGFnYXRlKSB7XG4gICAgICBmb3IgKGkgPSAwLCBsZW4gPSBsLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHBxLnB1c2goeyBub2RlOiBsW2ldLCBwdWxzZTogcCwgcmFuazogbFtpXS5fcmFuayB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8vIENvbm5lY3QgYSBicmFuY2ggb2YgZGF0YWZsb3cgbm9kZXMuIFxuLy8gRGVwZW5kZW5jaWVzIGdldCB3aXJlZCB0byB0aGUgbmVhcmVzdCBjb2xsZWN0b3IuIFxuZnVuY3Rpb24gZm9yRWFjaE5vZGUoYnJhbmNoLCBmbikge1xuICB2YXIgbm9kZSwgY29sbGVjdG9yLCBpLCBsZW47XG4gIGZvcihpPTAsIGxlbj1icmFuY2gubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgbm9kZSA9IGJyYW5jaFtpXTtcbiAgICBpZihub2RlLmNvbGxlY3RvcigpKSBjb2xsZWN0b3IgPSBub2RlO1xuICAgIGZuKG5vZGUsIGNvbGxlY3RvciwgaSk7XG4gIH1cbn1cblxucHJvdG8uY29ubmVjdCA9IGZ1bmN0aW9uKGJyYW5jaCkge1xuICBkZWJ1Zyh7fSwgWydjb25uZWN0aW5nJ10pO1xuICB2YXIgZ3JhcGggPSB0aGlzO1xuICBmb3JFYWNoTm9kZShicmFuY2gsIGZ1bmN0aW9uKG4sIGMsIGkpIHtcbiAgICB2YXIgZGF0YSA9IG4uZGVwZW5kZW5jeShDLkRBVEEpLFxuICAgICAgICBzaWduYWxzID0gbi5kZXBlbmRlbmN5KEMuU0lHTkFMUyk7XG5cbiAgICBpZihkYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihkKSB7IFxuICAgICAgICBncmFwaC5kYXRhKGQpXG4gICAgICAgICAgLnJldmlzZXMobi5yZXZpc2VzKCkpXG4gICAgICAgICAgLmFkZExpc3RlbmVyKGMpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYoc2lnbmFscy5sZW5ndGggPiAwKSB7XG4gICAgICBzaWduYWxzLmZvckVhY2goZnVuY3Rpb24ocykgeyBncmFwaC5zaWduYWwocykuYWRkTGlzdGVuZXIoYyk7IH0pO1xuICAgIH1cblxuICAgIGlmKGkgPiAwKSB7XG4gICAgICBicmFuY2hbaS0xXS5hZGRMaXN0ZW5lcihicmFuY2hbaV0pO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGJyYW5jaDtcbn07XG5cbnByb3RvLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbihicmFuY2gpIHtcbiAgZGVidWcoe30sIFsnZGlzY29ubmVjdGluZyddKTtcbiAgdmFyIGdyYXBoID0gdGhpcztcblxuICBmb3JFYWNoTm9kZShicmFuY2gsIGZ1bmN0aW9uKG4sIGMsIGkpIHtcbiAgICB2YXIgZGF0YSA9IG4uZGVwZW5kZW5jeShDLkRBVEEpLFxuICAgICAgICBzaWduYWxzID0gbi5kZXBlbmRlbmN5KEMuU0lHTkFMUyk7XG5cbiAgICBpZihkYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihkKSB7IGdyYXBoLmRhdGEoZCkucmVtb3ZlTGlzdGVuZXIoYyk7IH0pO1xuICAgIH1cblxuICAgIGlmKHNpZ25hbHMubGVuZ3RoID4gMCkge1xuICAgICAgc2lnbmFscy5mb3JFYWNoKGZ1bmN0aW9uKHMpIHsgZ3JhcGguc2lnbmFsKHMpLnJlbW92ZUxpc3RlbmVyKGMpIH0pO1xuICAgIH1cblxuICAgIG4uZGlzY29ubmVjdCgpOyAgXG4gIH0pO1xuXG4gIHJldHVybiBicmFuY2g7XG59O1xuXG5wcm90by5yZWV2YWx1YXRlID0gZnVuY3Rpb24ocHVsc2UsIG5vZGUpIHtcbiAgdmFyIHJlZmxvd2VkID0gIXB1bHNlLnJlZmxvdyB8fCAocHVsc2UucmVmbG93ICYmIG5vZGUubGFzdCgpID49IHB1bHNlLnN0YW1wKSxcbiAgICAgIHJ1biA9ICEhcHVsc2UuYWRkLmxlbmd0aCB8fCAhIXB1bHNlLnJlbS5sZW5ndGggfHwgbm9kZS5yb3V0ZXIoKTtcbiAgcnVuID0gcnVuIHx8ICFyZWZsb3dlZDtcbiAgcmV0dXJuIHJ1biB8fCBub2RlLnJlZXZhbHVhdGUocHVsc2UpO1xufTtcblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihwdWxzZSwgbm9kZSkge1xuICBpZighdGhpcy5yZWV2YWx1YXRlKHB1bHNlLCBub2RlKSkgcmV0dXJuIHB1bHNlO1xuICBwdWxzZSA9IG5vZGUuZXZhbHVhdGUocHVsc2UpO1xuICBub2RlLmxhc3QocHVsc2Uuc3RhbXApO1xuICByZXR1cm4gcHVsc2Vcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR3JhcGg7IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpLFxuICAgIFJFRVZBTCA9IFtDLkRBVEEsIEMuRklFTERTLCBDLlNDQUxFUywgQy5TSUdOQUxTXTtcblxudmFyIG5vZGVfaWQgPSAxO1xuXG5mdW5jdGlvbiBOb2RlKGdyYXBoKSB7XG4gIGlmKGdyYXBoKSB0aGlzLmluaXQoZ3JhcGgpO1xuICByZXR1cm4gdGhpcztcbn1cblxudmFyIHByb3RvID0gTm9kZS5wcm90b3R5cGU7XG5cbnByb3RvLmluaXQgPSBmdW5jdGlvbihncmFwaCkge1xuICB0aGlzLl9pZCA9IG5vZGVfaWQrKztcbiAgdGhpcy5fZ3JhcGggPSBncmFwaDtcbiAgdGhpcy5fcmFuayA9ICsrZ3JhcGguX3Jhbms7IC8vIEZvciB0b3BvbG9naWFsIHNvcnRcbiAgdGhpcy5fc3RhbXAgPSAwOyAgLy8gTGFzdCBzdGFtcCBzZWVuXG5cbiAgdGhpcy5fbGlzdGVuZXJzID0gW107XG4gIHRoaXMuX3JlZ2lzdGVyZWQgPSB7fTsgLy8gVG8gcHJldmVudCBkdXBsaWNhdGUgbGlzdGVuZXJzXG5cbiAgdGhpcy5fZGVwcyA9IHtcbiAgICBkYXRhOiAgICBbXSxcbiAgICBmaWVsZHM6ICBbXSxcbiAgICBzY2FsZXM6ICBbXSxcbiAgICBzaWduYWxzOiBbXSxcbiAgfTtcblxuICB0aGlzLl9pc1JvdXRlciA9IGZhbHNlOyAvLyBSZXNwb25zaWJsZSBmb3IgcHJvcGFnYXRpbmcgdHVwbGVzLCBjYW5ub3QgZXZlciBiZSBza2lwcGVkXG4gIHRoaXMuX2lzQ29sbGVjdG9yID0gZmFsc2U7ICAvLyBIb2xkcyBhIG1hdGVyaWFsaXplZCBkYXRhc2V0LCBwdWxzZSB0byByZWZsb3dcbiAgdGhpcy5fcmV2aXNlcyA9IGZhbHNlOyAvLyBEb2VzIHRoZSBvcGVyYXRvciByZXF1aXJlIHR1cGxlcycgcHJldmlvdXMgdmFsdWVzPyBcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbiA9IG5ldyBOb2RlKHRoaXMuX2dyYXBoKTtcbiAgbi5ldmFsdWF0ZSA9IHRoaXMuZXZhbHVhdGU7XG4gIG4uX2RlcHMgPSB0aGlzLl9kZXBzO1xuICBuLl9pc1JvdXRlciA9IHRoaXMuX2lzUm91dGVyO1xuICBuLl9pc0NvbGxlY3RvciA9IHRoaXMuX2lzQ29sbGVjdG9yO1xuICByZXR1cm4gbjtcbn07XG5cbnByb3RvLnJhbmsgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuX3Jhbms7IH07XG5cbnByb3RvLmxhc3QgPSBmdW5jdGlvbihzdGFtcCkgeyBcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9zdGFtcDtcbiAgdGhpcy5fc3RhbXAgPSBzdGFtcDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5kZXBlbmRlbmN5ID0gZnVuY3Rpb24odHlwZSwgZGVwcykge1xuICB2YXIgZCA9IHRoaXMuX2RlcHNbdHlwZV07XG4gIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHJldHVybiBkO1xuICBpZihkZXBzID09PSBudWxsKSB7IC8vIENsZWFyIGRlcGVuZGVuY2llcyBvZiBhIGNlcnRhaW4gdHlwZVxuICAgIHdoaWxlKGQubGVuZ3RoID4gMCkgZC5wb3AoKTtcbiAgfSBlbHNlIHtcbiAgICBpZighZGwuaXNBcnJheShkZXBzKSAmJiBkLmluZGV4T2YoZGVwcykgPCAwKSBkLnB1c2goZGVwcyk7XG4gICAgZWxzZSBkLnB1c2guYXBwbHkoZCwgZGwuYXJyYXkoZGVwcykpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8ucm91dGVyID0gZnVuY3Rpb24oYm9vbCkge1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX2lzUm91dGVyO1xuICB0aGlzLl9pc1JvdXRlciA9ICEhYm9vbFxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmNvbGxlY3RvciA9IGZ1bmN0aW9uKGJvb2wpIHtcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9pc0NvbGxlY3RvcjtcbiAgdGhpcy5faXNDb2xsZWN0b3IgPSAhIWJvb2w7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8ucmV2aXNlcyA9IGZ1bmN0aW9uKGJvb2wpIHtcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9yZXZpc2VzO1xuICB0aGlzLl9yZXZpc2VzID0gISFib29sO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmxpc3RlbmVycyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5fbGlzdGVuZXJzO1xufTtcblxucHJvdG8uYWRkTGlzdGVuZXIgPSBmdW5jdGlvbihsKSB7XG4gIGlmKCEobCBpbnN0YW5jZW9mIE5vZGUpKSB0aHJvdyBcIkxpc3RlbmVyIGlzIG5vdCBhIE5vZGVcIjtcbiAgaWYodGhpcy5fcmVnaXN0ZXJlZFtsLl9pZF0pIHJldHVybiB0aGlzO1xuXG4gIHRoaXMuX2xpc3RlbmVycy5wdXNoKGwpO1xuICB0aGlzLl9yZWdpc3RlcmVkW2wuX2lkXSA9IDE7XG4gIGlmKHRoaXMuX3JhbmsgPiBsLl9yYW5rKSB7XG4gICAgdmFyIHEgPSBbbF07XG4gICAgd2hpbGUocS5sZW5ndGgpIHtcbiAgICAgIHZhciBjdXIgPSBxLnNwbGljZSgwLDEpWzBdO1xuICAgICAgY3VyLl9yYW5rID0gKyt0aGlzLl9ncmFwaC5fcmFuaztcbiAgICAgIHEucHVzaC5hcHBseShxLCBjdXIuX2xpc3RlbmVycyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIChsKSB7XG4gIHZhciBmb3VuZFNlbmRpbmcgPSBmYWxzZTtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX2xpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW4gJiYgIWZvdW5kU2VuZGluZzsgaSsrKSB7XG4gICAgaWYgKHRoaXMuX2xpc3RlbmVyc1tpXSA9PT0gbCkge1xuICAgICAgdGhpcy5fbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIHRoaXMuX3JlZ2lzdGVyZWRbbC5faWRdID0gbnVsbDtcbiAgICAgIGZvdW5kU2VuZGluZyA9IHRydWU7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gZm91bmRTZW5kaW5nO1xufTtcblxucHJvdG8uZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9saXN0ZW5lcnMgPSBbXTtcbiAgdGhpcy5fcmVnaXN0ZXJlZCA9IHt9O1xufTtcblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihwdWxzZSkgeyByZXR1cm4gcHVsc2U7IH1cblxucHJvdG8ucmVldmFsdWF0ZSA9IGZ1bmN0aW9uKHB1bHNlKSB7XG4gIHZhciBub2RlID0gdGhpcywgcmVldmFsID0gZmFsc2U7XG4gIHJldHVybiBSRUVWQUwuc29tZShmdW5jdGlvbihwcm9wKSB7XG4gICAgcmVldmFsID0gcmVldmFsIHx8IG5vZGUuX2RlcHNbcHJvcF0uc29tZShmdW5jdGlvbihrKSB7IHJldHVybiAhIXB1bHNlW3Byb3BdW2tdIH0pO1xuICAgIHJldHVybiByZWV2YWw7XG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBOb2RlOyIsInZhciBOb2RlID0gcmVxdWlyZSgnLi9Ob2RlJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi9jaGFuZ2VzZXQnKTtcblxuZnVuY3Rpb24gU2lnbmFsKGdyYXBoLCBuYW1lLCBpbml0KSB7XG4gIE5vZGUucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIHRoaXMuX25hbWUgID0gbmFtZTtcbiAgdGhpcy5fdmFsdWUgPSBpbml0O1xuICByZXR1cm4gdGhpcztcbn07XG5cbnZhciBwcm90byA9IChTaWduYWwucHJvdG90eXBlID0gbmV3IE5vZGUoKSk7XG5cbnByb3RvLm5hbWUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuX25hbWU7IH07XG5cbnByb3RvLnZhbHVlID0gZnVuY3Rpb24odmFsKSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fdmFsdWU7XG4gIHRoaXMuX3ZhbHVlID0gdmFsO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmZpcmUgPSBmdW5jdGlvbihjcykge1xuICBpZighY3MpIGNzID0gY2hhbmdlc2V0LmNyZWF0ZShudWxsLCB0cnVlKTtcbiAgY3Muc2lnbmFsc1t0aGlzLl9uYW1lXSA9IDE7XG4gIHRoaXMuX2dyYXBoLnByb3BhZ2F0ZShjcywgdGhpcyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNpZ25hbDsiLCJ2YXIgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG52YXIgUkVFVkFMID0gW0MuREFUQSwgQy5GSUVMRFMsIEMuU0NBTEVTLCBDLlNJR05BTFNdO1xuXG5mdW5jdGlvbiBjcmVhdGUoY3MsIHJlZmxvdykge1xuICB2YXIgb3V0ID0ge307XG4gIGNvcHkoY3MsIG91dCk7XG5cbiAgb3V0LmFkZCA9IFtdO1xuICBvdXQubW9kID0gW107XG4gIG91dC5yZW0gPSBbXTtcblxuICBvdXQucmVmbG93ID0gcmVmbG93O1xuXG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIHJlc2V0X3ByZXYoeCkge1xuICB4Ll9wcmV2ID0gKHguX3ByZXYgPT09IHVuZGVmaW5lZCkgPyB1bmRlZmluZWQgOiBDLlNFTlRJTkVMO1xufVxuXG5mdW5jdGlvbiBmaW5hbGl6ZShjcykge1xuICBmb3IoaT0wLCBsZW49Y3MuYWRkLmxlbmd0aDsgaTxsZW47ICsraSkgcmVzZXRfcHJldihjcy5hZGRbaV0pO1xuICBmb3IoaT0wLCBsZW49Y3MubW9kLmxlbmd0aDsgaTxsZW47ICsraSkgcmVzZXRfcHJldihjcy5tb2RbaV0pO1xufVxuXG5mdW5jdGlvbiBjb3B5KGEsIGIpIHtcbiAgYi5zdGFtcCA9IGEgPyBhLnN0YW1wIDogMDtcbiAgYi5zb3J0ICA9IGEgPyBhLnNvcnQgIDogbnVsbDtcbiAgYi5mYWNldCA9IGEgPyBhLmZhY2V0IDogbnVsbDtcbiAgYi50cmFucyA9IGEgPyBhLnRyYW5zIDogbnVsbDtcbiAgUkVFVkFMLmZvckVhY2goZnVuY3Rpb24oZCkgeyBiW2RdID0gYSA/IGFbZF0gOiB7fTsgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGU6IGNyZWF0ZSxcbiAgY29weTogY29weSxcbiAgZmluYWxpemU6IGZpbmFsaXplLFxufTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyksXG4gICAgdHVwbGVfaWQgPSAxO1xuXG4vLyBPYmplY3QuY3JlYXRlIGlzIGV4cGVuc2l2ZS4gU28sIHdoZW4gaW5nZXN0aW5nLCB0cnVzdCB0aGF0IHRoZVxuLy8gZGF0dW0gaXMgYW4gb2JqZWN0IHRoYXQgaGFzIGJlZW4gYXBwcm9wcmlhdGVseSBzYW5kYm94ZWQgZnJvbSBcbi8vIHRoZSBvdXRzaWRlIGVudmlyb25tZW50LiBcbmZ1bmN0aW9uIGluZ2VzdChkYXR1bSwgcHJldikge1xuICBkYXR1bSA9IGRsLmlzT2JqZWN0KGRhdHVtKSA/IGRhdHVtIDoge2RhdGE6IGRhdHVtfTtcbiAgZGF0dW0uX2lkID0gdHVwbGVfaWQrKztcbiAgZGF0dW0uX3ByZXYgPSAocHJldiAhPT0gdW5kZWZpbmVkKSA/IChwcmV2IHx8IEMuU0VOVElORUwpIDogdW5kZWZpbmVkO1xuICByZXR1cm4gZGF0dW07XG59XG5cbmZ1bmN0aW9uIGRlcml2ZShkYXR1bSwgcHJldikge1xuICByZXR1cm4gaW5nZXN0KE9iamVjdC5jcmVhdGUoZGF0dW0pLCBwcmV2KTtcbn1cblxuLy8gV0FSTklORzogb3BlcmF0b3JzIHNob3VsZCBvbmx5IGNhbGwgdGhpcyBvbmNlIHBlciB0aW1lc3RhbXAhXG5mdW5jdGlvbiBzZXQodCwgaywgdikge1xuICB2YXIgcHJldiA9IHRba107XG4gIGlmKHByZXYgPT09IHYpIHJldHVybjtcbiAgc2V0X3ByZXYodCwgayk7XG4gIHRba10gPSB2O1xufVxuXG5mdW5jdGlvbiBzZXRfcHJldih0LCBrKSB7XG4gIGlmKHQuX3ByZXYgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICB0Ll9wcmV2ID0gKHQuX3ByZXYgPT09IEMuU0VOVElORUwpID8ge30gOiB0Ll9wcmV2O1xuICB0Ll9wcmV2W2tdID0gdFtrXTtcbn1cblxuZnVuY3Rpb24gcmVzZXQoKSB7IHR1cGxlX2lkID0gMTsgfVxuXG5mdW5jdGlvbiBpZE1hcChhKSB7XG4gIHJldHVybiBhLnJlZHVjZShmdW5jdGlvbihtLHgpIHtcbiAgICByZXR1cm4gKG1beC5faWRdID0gMSwgbSk7XG4gIH0sIHt9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBpbmdlc3Q6IGluZ2VzdCxcbiAgZGVyaXZlOiBkZXJpdmUsXG4gIHNldDogICAgc2V0LFxuICBwcmV2OiAgIHNldF9wcmV2LFxuICByZXNldDogIHJlc2V0LFxuICBpZE1hcDogIGlkTWFwXG59OyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHQpIHtcbiAgb3B0ID0gb3B0IHx8IHt9O1xuICB2YXIgY29uc3RhbnRzID0gb3B0LmNvbnN0YW50cyB8fCByZXF1aXJlKCcuL2NvbnN0YW50cycpO1xuICB2YXIgZnVuY3Rpb25zID0gKG9wdC5mdW5jdGlvbnMgfHwgcmVxdWlyZSgnLi9mdW5jdGlvbnMnKSkoY29kZWdlbik7XG4gIHZhciBpZFdoaXRlTGlzdCA9IG9wdC5pZFdoaXRlTGlzdCA/IGRsLnRvTWFwKG9wdC5pZFdoaXRlTGlzdCkgOiBudWxsO1xuICB2YXIgaWRCbGFja0xpc3QgPSBvcHQuaWRCbGFja0xpc3QgPyBkbC50b01hcChvcHQuaWRCbGFja0xpc3QpIDogbnVsbDtcbiAgdmFyIG1lbWJlckRlcHRoID0gMDtcblxuICAvLyBUT0RPIGdlbmVyYWxpemU/XG4gIHZhciBEQVRVTSA9ICdkJztcbiAgdmFyIFNJR05BTF9QUkVGSVggPSAnc2cuJztcbiAgdmFyIHNpZ25hbHMgPSB7fTtcbiAgdmFyIGZpZWxkcyA9IHt9O1xuXG4gIGZ1bmN0aW9uIGNvZGVnZW5fd3JhcChhc3QpIHsgICAgXG4gICAgdmFyIHJldHZhbCA9IHtcbiAgICAgIGZuOiBjb2RlZ2VuKGFzdCksXG4gICAgICBzaWduYWxzOiBkbC5rZXlzKHNpZ25hbHMpLFxuICAgICAgZmllbGRzOiBkbC5rZXlzKGZpZWxkcylcbiAgICB9O1xuICAgIHNpZ25hbHMgPSB7fTtcbiAgICBmaWVsZHMgPSB7fTtcbiAgICByZXR1cm4gcmV0dmFsO1xuICB9XG5cbiAgZnVuY3Rpb24gY29kZWdlbihhc3QpIHtcbiAgICBpZiAoYXN0IGluc3RhbmNlb2YgU3RyaW5nKSByZXR1cm4gYXN0O1xuICAgIHZhciBnZW5lcmF0b3IgPSBDT0RFR0VOX1RZUEVTW2FzdC50eXBlXTtcbiAgICBpZiAoZ2VuZXJhdG9yID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuc3VwcG9ydGVkIHR5cGU6IFwiICsgYXN0LnR5cGUpO1xuICAgIH1cbiAgICByZXR1cm4gZ2VuZXJhdG9yKGFzdCk7XG4gIH1cblxuICB2YXIgQ09ERUdFTl9UWVBFUyA9IHtcbiAgICBcIkxpdGVyYWxcIjogZnVuY3Rpb24obikge1xuICAgICAgICByZXR1cm4gbi5yYXc7XG4gICAgICB9LFxuICAgIFwiSWRlbnRpZmllclwiOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIHZhciBpZCA9IG4ubmFtZTtcbiAgICAgICAgaWYgKG1lbWJlckRlcHRoID4gMCkge1xuICAgICAgICAgIHJldHVybiBpZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29uc3RhbnRzLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgICAgIHJldHVybiBjb25zdGFudHNbaWRdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpZFdoaXRlTGlzdCkge1xuICAgICAgICAgIGlmIChpZFdoaXRlTGlzdC5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBpZDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2lnbmFsc1tpZF0gPSAxO1xuICAgICAgICAgICAgcmV0dXJuIFNJR05BTF9QUkVGSVggKyBpZDsgLy8gSEFDS2lzaC4uLlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaWRCbGFja0xpc3QgJiYgaWRCbGFja0xpc3QuaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSWxsZWdhbCBpZGVudGlmaWVyOiBcIiArIGlkKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaWQ7XG4gICAgICB9LFxuICAgIFwiUHJvZ3JhbVwiOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIHJldHVybiBuLmJvZHkubWFwKGNvZGVnZW4pLmpvaW4oXCJcXG5cIik7XG4gICAgICB9LFxuICAgIFwiTWVtYmVyRXhwcmVzc2lvblwiOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIHZhciBkID0gIW4uY29tcHV0ZWQ7XG4gICAgICAgIHZhciBvID0gY29kZWdlbihuLm9iamVjdCk7XG4gICAgICAgIGlmIChkKSBtZW1iZXJEZXB0aCArPSAxO1xuICAgICAgICB2YXIgcCA9IGNvZGVnZW4obi5wcm9wZXJ0eSk7XG4gICAgICAgIGlmIChvID09PSBEQVRVTSkgeyBmaWVsZHNbcF0gPSAxOyB9IC8vIEhBQ0tpc2guLi5cbiAgICAgICAgaWYgKGQpIG1lbWJlckRlcHRoIC09IDE7XG4gICAgICAgIHJldHVybiBvICsgKGQgPyBcIi5cIitwIDogXCJbXCIrcCtcIl1cIik7XG4gICAgICB9LFxuICAgIFwiQ2FsbEV4cHJlc3Npb25cIjogZnVuY3Rpb24obikge1xuICAgICAgICBpZiAobi5jYWxsZWUudHlwZSAhPT0gXCJJZGVudGlmaWVyXCIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbGxlZ2FsIGNhbGxlZSB0eXBlOiBcIiArIG4uY2FsbGVlLnR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjYWxsZWUgPSBuLmNhbGxlZS5uYW1lO1xuICAgICAgICB2YXIgYXJncyA9IG4uYXJndW1lbnRzO1xuICAgICAgICB2YXIgZm4gPSBmdW5jdGlvbnMuaGFzT3duUHJvcGVydHkoY2FsbGVlKSAmJiBmdW5jdGlvbnNbY2FsbGVlXTtcbiAgICAgICAgaWYgKCFmbikgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIGZ1bmN0aW9uOiBcIiArIGNhbGxlZSk7XG4gICAgICAgIHJldHVybiBmbiBpbnN0YW5jZW9mIEZ1bmN0aW9uXG4gICAgICAgICAgPyBmbihhcmdzKVxuICAgICAgICAgIDogZm4gKyBcIihcIiArIGFyZ3MubWFwKGNvZGVnZW4pLmpvaW4oXCIsXCIpICsgXCIpXCI7XG4gICAgICB9LFxuICAgIFwiQXJyYXlFeHByZXNzaW9uXCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgcmV0dXJuIFwiW1wiICsgbi5lbGVtZW50cy5tYXAoY29kZWdlbikuam9pbihcIixcIikgKyBcIl1cIjtcbiAgICAgIH0sXG4gICAgXCJCaW5hcnlFeHByZXNzaW9uXCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgcmV0dXJuIFwiKFwiICsgY29kZWdlbihuLmxlZnQpICsgbi5vcGVyYXRvciArIGNvZGVnZW4obi5yaWdodCkgKyBcIilcIjtcbiAgICAgIH0sXG4gICAgXCJVbmFyeUV4cHJlc3Npb25cIjogZnVuY3Rpb24obikge1xuICAgICAgICByZXR1cm4gXCIoXCIgKyBuLm9wZXJhdG9yICsgY29kZWdlbihuLmFyZ3VtZW50KSArIFwiKVwiO1xuICAgICAgfSxcbiAgICBcIlVwZGF0ZUV4cHJlc3Npb25cIjogZnVuY3Rpb24obikge1xuICAgICAgICByZXR1cm4gXCIoXCIgKyAocHJlZml4XG4gICAgICAgICAgPyBuLm9wZXJhdG9yICsgY29kZWdlbihuLmFyZ3VtZW50KVxuICAgICAgICAgIDogY29kZWdlbihuLmFyZ3VtZW50KSArIG4ub3BlcmF0b3JcbiAgICAgICAgKSArIFwiKVwiO1xuICAgICAgfSxcbiAgICBcIkNvbmRpdGlvbmFsRXhwcmVzc2lvblwiOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIHJldHVybiBcIihcIiArIGNvZGVnZW4obi50ZXN0KVxuICAgICAgICAgICsgXCI/XCIgKyBjb2RlZ2VuKG4uY29uc2VxdWVudClcbiAgICAgICAgICArIFwiOlwiICsgY29kZWdlbihuLmFsdGVybmF0ZSlcbiAgICAgICAgICArIFwiKVwiO1xuICAgICAgfSxcbiAgICBcIkxvZ2ljYWxFeHByZXNzaW9uXCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgcmV0dXJuIFwiKFwiICsgY29kZWdlbihuLmxlZnQpICsgbi5vcGVyYXRvciArIGNvZGVnZW4obi5yaWdodCkgKyBcIilcIjtcbiAgICAgIH0sXG4gICAgXCJPYmplY3RFeHByZXNzaW9uXCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgcmV0dXJuIFwie1wiICsgbi5wcm9wZXJ0aWVzLm1hcChjb2RlZ2VuKS5qb2luKFwiLFwiKSArIFwifVwiO1xuICAgICAgfSxcbiAgICBcIlByb3BlcnR5XCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgbWVtYmVyRGVwdGggKz0gMTtcbiAgICAgICAgdmFyIGsgPSBjb2RlZ2VuKG4ua2V5KTtcbiAgICAgICAgbWVtYmVyRGVwdGggLT0gMTtcbiAgICAgICAgcmV0dXJuIGsgKyBcIjpcIiArIGNvZGVnZW4obi52YWx1ZSk7XG4gICAgICB9LFxuICAgIFwiRXhwcmVzc2lvblN0YXRlbWVudFwiOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIHJldHVybiBjb2RlZ2VuKG4uZXhwcmVzc2lvbik7XG4gICAgICB9XG4gIH07XG4gIFxuICByZXR1cm4gY29kZWdlbl93cmFwO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgXCJOYU5cIjogICAgIFwiTmFOXCIsXG4gIFwiRVwiOiAgICAgICBcIk1hdGguRVwiLFxuICBcIkxOMlwiOiAgICAgXCJNYXRoLkxOMlwiLFxuICBcIkxOMTBcIjogICAgXCJNYXRoLkxOMTBcIixcbiAgXCJMT0cyRVwiOiAgIFwiTWF0aC5MT0cyRVwiLFxuICBcIkxPRzEwRVwiOiAgXCJNYXRoLkxPRzEwRVwiLFxuICBcIlBJXCI6ICAgICAgXCJNYXRoLlBJXCIsXG4gIFwiU1FSVDFfMlwiOiBcIk1hdGguU1FSVDFfMlwiLFxuICBcIlNRUlQyXCI6ICAgXCJNYXRoLlNRUlQyXCJcbn07IiwidmFyIGRhdGFsaWIgPSByZXF1aXJlKCdkYXRhbGliJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY29kZWdlbikge1xuXG4gIGZ1bmN0aW9uIGZuY2FsbChuYW1lLCBhcmdzLCBjYXN0LCB0eXBlKSB7XG4gICAgdmFyIG9iaiA9IGNvZGVnZW4oYXJnc1swXSk7XG4gICAgaWYgKGNhc3QpIHtcbiAgICAgIG9iaiA9IGNhc3QgKyBcIihcIiArIG9iaiArIFwiKVwiO1xuICAgICAgaWYgKGRsLnN0YXJ0c1dpdGgoY2FzdCwgXCJuZXcgXCIpKSBvYmogPSBcIihcIiArIG9iaiArIFwiKVwiO1xuICAgIH1cbiAgICByZXR1cm4gb2JqICsgXCIuXCIgKyBuYW1lICsgKHR5cGUgPCAwID8gXCJcIiA6IHR5cGUgPT09IDBcbiAgICAgID8gXCIoKVwiXG4gICAgICA6IFwiKFwiICsgYXJncy5zbGljZSgxKS5tYXAoY29kZWdlbikuam9pbihcIixcIikgKyBcIilcIik7XG4gIH1cbiAgXG4gIHZhciBEQVRFID0gXCJuZXcgRGF0ZVwiO1xuICB2YXIgU1RSSU5HID0gXCJTdHJpbmdcIjtcbiAgdmFyIFJFR0VYUCA9IFwiUmVnRXhwXCI7XG5cbiAgcmV0dXJuIHtcbiAgICAvLyBNQVRIIGZ1bmN0aW9uc1xuICAgIFwiaXNOYU5cIjogICAgXCJpc05hTlwiLFxuICAgIFwiaXNGaW5pdGVcIjogXCJpc0Zpbml0ZVwiLFxuICAgIFwiYWJzXCI6ICAgICAgXCJNYXRoLmFic1wiLFxuICAgIFwiYWNvc1wiOiAgICAgXCJNYXRoLmFjb3NcIixcbiAgICBcImFzaW5cIjogICAgIFwiTWF0aC5hc2luXCIsXG4gICAgXCJhdGFuXCI6ICAgICBcIk1hdGguYXRhblwiLFxuICAgIFwiYXRhbjJcIjogICAgXCJNYXRoLmF0YW4yXCIsXG4gICAgXCJjZWlsXCI6ICAgICBcIk1hdGguY2VpbFwiLFxuICAgIFwiY29zXCI6ICAgICAgXCJNYXRoLmNvc1wiLFxuICAgIFwiZXhwXCI6ICAgICAgXCJNYXRoLmV4cFwiLFxuICAgIFwiZmxvb3JcIjogICAgXCJNYXRoLmZsb29yXCIsXG4gICAgXCJsb2dcIjogICAgICBcIk1hdGgubG9nXCIsXG4gICAgXCJtYXhcIjogICAgICBcIk1hdGgubWF4XCIsXG4gICAgXCJtaW5cIjogICAgICBcIk1hdGgubWluXCIsXG4gICAgXCJwb3dcIjogICAgICBcIk1hdGgucG93XCIsXG4gICAgXCJyYW5kb21cIjogICBcIk1hdGgucmFuZG9tXCIsXG4gICAgXCJyb3VuZFwiOiAgICBcIk1hdGgucm91bmRcIixcbiAgICBcInNpblwiOiAgICAgIFwiTWF0aC5zaW5cIixcbiAgICBcInNxcnRcIjogICAgIFwiTWF0aC5zcXJ0XCIsXG4gICAgXCJ0YW5cIjogICAgICBcIk1hdGgudGFuXCIsXG5cbiAgICAvLyBEQVRFIGZ1bmN0aW9uc1xuICAgIFwibm93XCI6ICAgICAgXCJEYXRlLm5vd1wiLFxuICAgIFwiZGF0ZXRpbWVcIjogXCJuZXcgRGF0ZVwiLFxuICAgIFwiZGF0ZVwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXREYXRlXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcImRheVwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXREYXlcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwieWVhclwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRGdWxsWWVhclwiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJtb250aFwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRNb250aFwiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJob3Vyc1wiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRIb3Vyc1wiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJtaW51dGVzXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImdldE1pbnV0ZXNcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwic2Vjb25kc1wiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRTZWNvbmRzXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcIm1pbGxpc2Vjb25kc1wiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRNaWxsaXNlY29uZHNcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwidGltZVwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRUaW1lXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcInRpbWV6b25lb2Zmc2V0XCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImdldFRpbWV6b25lT2Zmc2V0XCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcInV0Y2RhdGVcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VVRDRGF0ZVwiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJ1dGNkYXlcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VVRDRGF5XCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcInV0Y3llYXJcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VVRDRnVsbFllYXJcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwidXRjbW9udGhcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VVRDTW9udGhcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwidXRjaG91cnNcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VVRDSG91cnNcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwidXRjbWludXRlc1wiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRVVENNaW51dGVzXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcInV0Y3NlY29uZHNcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VVRDU2Vjb25kc1wiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJ1dGNtaWxsaXNlY29uZHNcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VVRDTWlsbGlzZWNvbmRzXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcblxuICAgIC8vIHNoYXJlZCBzZXF1ZW5jZSBmdW5jdGlvbnNcbiAgICBcImxlbmd0aFwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJsZW5ndGhcIiwgYXJncywgbnVsbCwgLTEpO1xuICAgICAgfSxcbiAgICBcImluZGV4b2ZcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiaW5kZXhPZlwiLCBhcmdzLCBudWxsKTtcbiAgICAgIH0sXG4gICAgXCJsYXN0aW5kZXhvZlwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJsYXN0SW5kZXhPZlwiLCBhcmdzLCBudWxsKTtcbiAgICAgIH0sXG5cbiAgICAvLyBTVFJJTkcgZnVuY3Rpb25zXG4gICAgXCJwYXJzZUZsb2F0XCI6IFwicGFyc2VGbG9hdFwiLFxuICAgIFwicGFyc2VJbnRcIjogXCJwYXJzZUludFwiLFxuICAgIFwidXBwZXJcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwidG9VcHBlckNhc2VcIiwgYXJncywgU1RSSU5HLCAwKTtcbiAgICAgIH0sXG4gICAgXCJsb3dlclwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJ0b0xvd2VyQ2FzZVwiLCBhcmdzLCBTVFJJTkcsIDApO1xuICAgICAgfSxcbiAgICBcInNsaWNlXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcInNsaWNlXCIsIGFyZ3MsIFNUUklORyk7XG4gICAgICB9LFxuICAgIFwic3Vic3RyaW5nXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcInN1YnN0cmluZ1wiLCBhcmdzLCBTVFJJTkcpO1xuICAgICAgfSxcblxuICAgIC8vIFJFR0VYUCBmdW5jdGlvbnNcbiAgICBcInRlc3RcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwidGVzdFwiLCBhcmdzLCBSRUdFWFApO1xuICAgICAgfSxcbiAgICBcbiAgICAvLyBDb250cm9sIEZsb3cgZnVuY3Rpb25zXG4gICAgXCJpZlwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA8IDMpXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyBhcmd1bWVudHMgdG8gaWYgZnVuY3Rpb24uXCIpO1xuICAgICAgICBpZiAoYXJncy5sZW5ndGggPiAzKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUb28gbWFueSBhcmd1bWVudHMgdG8gaWYgZnVuY3Rpb24uXCIpO1xuICAgICAgICB2YXIgYSA9IGFyZ3MubWFwKGNvZGVnZW4pO1xuICAgICAgICByZXR1cm4gYVswXStcIj9cIithWzFdK1wiOlwiK2FbMl07XG4gICAgICB9XG4gIH07XG59OyIsInZhciBwYXJzZXIgPSByZXF1aXJlKCcuL3BhcnNlcicpLFxuICAgIGNvZGVnZW4gPSByZXF1aXJlKCcuL2NvZGVnZW4nKTtcbiAgICBcbm1vZHVsZS5leHBvcnRzID0ge1xuICBwYXJzZTogZnVuY3Rpb24oaW5wdXQsIG9wdCkgeyByZXR1cm4gcGFyc2VyLnBhcnNlKFwiKFwiK2lucHV0K1wiKVwiLCBvcHQpOyB9LFxuICBjb2RlOiBmdW5jdGlvbihvcHQpIHsgcmV0dXJuIGNvZGVnZW4ob3B0KTsgfVxufTtcbiIsIi8qXG4gIFRoZSBmb2xsb3dpbmcgZXhwcmVzc2lvbiBwYXJzZXIgaXMgYmFzZWQgb24gRXNwcmltYSAoaHR0cDovL2VzcHJpbWEub3JnLykuXG4gIE9yaWdpbmFsIGhlYWRlciBjb21tZW50IGFuZCBsaWNlbnNlIGZvciBFc3ByaW1hIGlzIGluY2x1ZGVkIGhlcmU6XG5cbiAgQ29weXJpZ2h0IChDKSAyMDEzIEFyaXlhIEhpZGF5YXQgPGFyaXlhLmhpZGF5YXRAZ21haWwuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTMgVGhhZGRlZSBUeWwgPHRoYWRkZWUudHlsQGdtYWlsLmNvbT5cbiAgQ29weXJpZ2h0IChDKSAyMDEzIE1hdGhpYXMgQnluZW5zIDxtYXRoaWFzQHFpd2kuYmU+XG4gIENvcHlyaWdodCAoQykgMjAxMiBBcml5YSBIaWRheWF0IDxhcml5YS5oaWRheWF0QGdtYWlsLmNvbT5cbiAgQ29weXJpZ2h0IChDKSAyMDEyIE1hdGhpYXMgQnluZW5zIDxtYXRoaWFzQHFpd2kuYmU+XG4gIENvcHlyaWdodCAoQykgMjAxMiBKb29zdC1XaW0gQm9la2VzdGVpam4gPGpvb3N0LXdpbUBib2VrZXN0ZWlqbi5ubD5cbiAgQ29weXJpZ2h0IChDKSAyMDEyIEtyaXMgS293YWwgPGtyaXMua293YWxAY2l4YXIuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTIgWXVzdWtlIFN1enVraSA8dXRhdGFuZS50ZWFAZ21haWwuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTIgQXJwYWQgQm9yc29zIDxhcnBhZC5ib3Jzb3NAZ29vZ2xlbWFpbC5jb20+XG4gIENvcHlyaWdodCAoQykgMjAxMSBBcml5YSBIaWRheWF0IDxhcml5YS5oaWRheWF0QGdtYWlsLmNvbT5cblxuICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gICAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICAgICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCA8Q09QWVJJR0hUIEhPTERFUj4gQkUgTElBQkxFIEZPUiBBTllcbiAgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbiAgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuICBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkRcbiAgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbiAgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GXG4gIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4qL1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgVG9rZW4sXG4gICAgICBUb2tlbk5hbWUsXG4gICAgICBTeW50YXgsXG4gICAgICBQcm9wZXJ0eUtpbmQsXG4gICAgICBNZXNzYWdlcyxcbiAgICAgIFJlZ2V4LFxuICAgICAgc291cmNlLFxuICAgICAgc3RyaWN0LFxuICAgICAgaW5kZXgsXG4gICAgICBsaW5lTnVtYmVyLFxuICAgICAgbGluZVN0YXJ0LFxuICAgICAgbGVuZ3RoLFxuICAgICAgbG9va2FoZWFkLFxuICAgICAgc3RhdGUsXG4gICAgICBleHRyYTtcblxuICBUb2tlbiA9IHtcbiAgICAgIEJvb2xlYW5MaXRlcmFsOiAxLFxuICAgICAgRU9GOiAyLFxuICAgICAgSWRlbnRpZmllcjogMyxcbiAgICAgIEtleXdvcmQ6IDQsXG4gICAgICBOdWxsTGl0ZXJhbDogNSxcbiAgICAgIE51bWVyaWNMaXRlcmFsOiA2LFxuICAgICAgUHVuY3R1YXRvcjogNyxcbiAgICAgIFN0cmluZ0xpdGVyYWw6IDgsXG4gICAgICBSZWd1bGFyRXhwcmVzc2lvbjogOVxuICB9O1xuXG4gIFRva2VuTmFtZSA9IHt9O1xuICBUb2tlbk5hbWVbVG9rZW4uQm9vbGVhbkxpdGVyYWxdID0gJ0Jvb2xlYW4nO1xuICBUb2tlbk5hbWVbVG9rZW4uRU9GXSA9ICc8ZW5kPic7XG4gIFRva2VuTmFtZVtUb2tlbi5JZGVudGlmaWVyXSA9ICdJZGVudGlmaWVyJztcbiAgVG9rZW5OYW1lW1Rva2VuLktleXdvcmRdID0gJ0tleXdvcmQnO1xuICBUb2tlbk5hbWVbVG9rZW4uTnVsbExpdGVyYWxdID0gJ051bGwnO1xuICBUb2tlbk5hbWVbVG9rZW4uTnVtZXJpY0xpdGVyYWxdID0gJ051bWVyaWMnO1xuICBUb2tlbk5hbWVbVG9rZW4uUHVuY3R1YXRvcl0gPSAnUHVuY3R1YXRvcic7XG4gIFRva2VuTmFtZVtUb2tlbi5TdHJpbmdMaXRlcmFsXSA9ICdTdHJpbmcnO1xuICBUb2tlbk5hbWVbVG9rZW4uUmVndWxhckV4cHJlc3Npb25dID0gJ1JlZ3VsYXJFeHByZXNzaW9uJztcblxuICBTeW50YXggPSB7XG4gICAgICBBc3NpZ25tZW50RXhwcmVzc2lvbjogJ0Fzc2lnbm1lbnRFeHByZXNzaW9uJyxcbiAgICAgIEFycmF5RXhwcmVzc2lvbjogJ0FycmF5RXhwcmVzc2lvbicsXG4gICAgICBCaW5hcnlFeHByZXNzaW9uOiAnQmluYXJ5RXhwcmVzc2lvbicsXG4gICAgICBDYWxsRXhwcmVzc2lvbjogJ0NhbGxFeHByZXNzaW9uJyxcbiAgICAgIENvbmRpdGlvbmFsRXhwcmVzc2lvbjogJ0NvbmRpdGlvbmFsRXhwcmVzc2lvbicsXG4gICAgICBFeHByZXNzaW9uU3RhdGVtZW50OiAnRXhwcmVzc2lvblN0YXRlbWVudCcsXG4gICAgICBJZGVudGlmaWVyOiAnSWRlbnRpZmllcicsXG4gICAgICBMaXRlcmFsOiAnTGl0ZXJhbCcsXG4gICAgICBMb2dpY2FsRXhwcmVzc2lvbjogJ0xvZ2ljYWxFeHByZXNzaW9uJyxcbiAgICAgIE1lbWJlckV4cHJlc3Npb246ICdNZW1iZXJFeHByZXNzaW9uJyxcbiAgICAgIE9iamVjdEV4cHJlc3Npb246ICdPYmplY3RFeHByZXNzaW9uJyxcbiAgICAgIFByb2dyYW06ICdQcm9ncmFtJyxcbiAgICAgIFByb3BlcnR5OiAnUHJvcGVydHknLFxuICAgICAgVW5hcnlFeHByZXNzaW9uOiAnVW5hcnlFeHByZXNzaW9uJyxcbiAgICAgIFVwZGF0ZUV4cHJlc3Npb246ICdVcGRhdGVFeHByZXNzaW9uJ1xuICB9O1xuXG4gIFByb3BlcnR5S2luZCA9IHtcbiAgICAgIERhdGE6IDEsXG4gICAgICBHZXQ6IDIsXG4gICAgICBTZXQ6IDRcbiAgfTtcblxuICAvLyBFcnJvciBtZXNzYWdlcyBzaG91bGQgYmUgaWRlbnRpY2FsIHRvIFY4LlxuICBNZXNzYWdlcyA9IHtcbiAgICAgIFVuZXhwZWN0ZWRUb2tlbjogICdVbmV4cGVjdGVkIHRva2VuICUwJyxcbiAgICAgIFVuZXhwZWN0ZWROdW1iZXI6ICAnVW5leHBlY3RlZCBudW1iZXInLFxuICAgICAgVW5leHBlY3RlZFN0cmluZzogICdVbmV4cGVjdGVkIHN0cmluZycsXG4gICAgICBVbmV4cGVjdGVkSWRlbnRpZmllcjogICdVbmV4cGVjdGVkIGlkZW50aWZpZXInLFxuICAgICAgVW5leHBlY3RlZFJlc2VydmVkOiAgJ1VuZXhwZWN0ZWQgcmVzZXJ2ZWQgd29yZCcsXG4gICAgICBVbmV4cGVjdGVkRU9TOiAgJ1VuZXhwZWN0ZWQgZW5kIG9mIGlucHV0JyxcbiAgICAgIE5ld2xpbmVBZnRlclRocm93OiAgJ0lsbGVnYWwgbmV3bGluZSBhZnRlciB0aHJvdycsXG4gICAgICBJbnZhbGlkUmVnRXhwOiAnSW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb24nLFxuICAgICAgVW50ZXJtaW5hdGVkUmVnRXhwOiAgJ0ludmFsaWQgcmVndWxhciBleHByZXNzaW9uOiBtaXNzaW5nIC8nLFxuICAgICAgSW52YWxpZExIU0luQXNzaWdubWVudDogICdJbnZhbGlkIGxlZnQtaGFuZCBzaWRlIGluIGFzc2lnbm1lbnQnLFxuICAgICAgSW52YWxpZExIU0luRm9ySW46ICAnSW52YWxpZCBsZWZ0LWhhbmQgc2lkZSBpbiBmb3ItaW4nLFxuICAgICAgTXVsdGlwbGVEZWZhdWx0c0luU3dpdGNoOiAnTW9yZSB0aGFuIG9uZSBkZWZhdWx0IGNsYXVzZSBpbiBzd2l0Y2ggc3RhdGVtZW50JyxcbiAgICAgIE5vQ2F0Y2hPckZpbmFsbHk6ICAnTWlzc2luZyBjYXRjaCBvciBmaW5hbGx5IGFmdGVyIHRyeScsXG4gICAgICBVbmtub3duTGFiZWw6ICdVbmRlZmluZWQgbGFiZWwgXFwnJTBcXCcnLFxuICAgICAgUmVkZWNsYXJhdGlvbjogJyUwIFxcJyUxXFwnIGhhcyBhbHJlYWR5IGJlZW4gZGVjbGFyZWQnLFxuICAgICAgSWxsZWdhbENvbnRpbnVlOiAnSWxsZWdhbCBjb250aW51ZSBzdGF0ZW1lbnQnLFxuICAgICAgSWxsZWdhbEJyZWFrOiAnSWxsZWdhbCBicmVhayBzdGF0ZW1lbnQnLFxuICAgICAgSWxsZWdhbFJldHVybjogJ0lsbGVnYWwgcmV0dXJuIHN0YXRlbWVudCcsXG4gICAgICBTdHJpY3RNb2RlV2l0aDogICdTdHJpY3QgbW9kZSBjb2RlIG1heSBub3QgaW5jbHVkZSBhIHdpdGggc3RhdGVtZW50JyxcbiAgICAgIFN0cmljdENhdGNoVmFyaWFibGU6ICAnQ2F0Y2ggdmFyaWFibGUgbWF5IG5vdCBiZSBldmFsIG9yIGFyZ3VtZW50cyBpbiBzdHJpY3QgbW9kZScsXG4gICAgICBTdHJpY3RWYXJOYW1lOiAgJ1ZhcmlhYmxlIG5hbWUgbWF5IG5vdCBiZSBldmFsIG9yIGFyZ3VtZW50cyBpbiBzdHJpY3QgbW9kZScsXG4gICAgICBTdHJpY3RQYXJhbU5hbWU6ICAnUGFyYW1ldGVyIG5hbWUgZXZhbCBvciBhcmd1bWVudHMgaXMgbm90IGFsbG93ZWQgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgU3RyaWN0UGFyYW1EdXBlOiAnU3RyaWN0IG1vZGUgZnVuY3Rpb24gbWF5IG5vdCBoYXZlIGR1cGxpY2F0ZSBwYXJhbWV0ZXIgbmFtZXMnLFxuICAgICAgU3RyaWN0RnVuY3Rpb25OYW1lOiAgJ0Z1bmN0aW9uIG5hbWUgbWF5IG5vdCBiZSBldmFsIG9yIGFyZ3VtZW50cyBpbiBzdHJpY3QgbW9kZScsXG4gICAgICBTdHJpY3RPY3RhbExpdGVyYWw6ICAnT2N0YWwgbGl0ZXJhbHMgYXJlIG5vdCBhbGxvd2VkIGluIHN0cmljdCBtb2RlLicsXG4gICAgICBTdHJpY3REZWxldGU6ICAnRGVsZXRlIG9mIGFuIHVucXVhbGlmaWVkIGlkZW50aWZpZXIgaW4gc3RyaWN0IG1vZGUuJyxcbiAgICAgIFN0cmljdER1cGxpY2F0ZVByb3BlcnR5OiAgJ0R1cGxpY2F0ZSBkYXRhIHByb3BlcnR5IGluIG9iamVjdCBsaXRlcmFsIG5vdCBhbGxvd2VkIGluIHN0cmljdCBtb2RlJyxcbiAgICAgIEFjY2Vzc29yRGF0YVByb3BlcnR5OiAgJ09iamVjdCBsaXRlcmFsIG1heSBub3QgaGF2ZSBkYXRhIGFuZCBhY2Nlc3NvciBwcm9wZXJ0eSB3aXRoIHRoZSBzYW1lIG5hbWUnLFxuICAgICAgQWNjZXNzb3JHZXRTZXQ6ICAnT2JqZWN0IGxpdGVyYWwgbWF5IG5vdCBoYXZlIG11bHRpcGxlIGdldC9zZXQgYWNjZXNzb3JzIHdpdGggdGhlIHNhbWUgbmFtZScsXG4gICAgICBTdHJpY3RMSFNBc3NpZ25tZW50OiAgJ0Fzc2lnbm1lbnQgdG8gZXZhbCBvciBhcmd1bWVudHMgaXMgbm90IGFsbG93ZWQgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgU3RyaWN0TEhTUG9zdGZpeDogICdQb3N0Zml4IGluY3JlbWVudC9kZWNyZW1lbnQgbWF5IG5vdCBoYXZlIGV2YWwgb3IgYXJndW1lbnRzIG9wZXJhbmQgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgU3RyaWN0TEhTUHJlZml4OiAgJ1ByZWZpeCBpbmNyZW1lbnQvZGVjcmVtZW50IG1heSBub3QgaGF2ZSBldmFsIG9yIGFyZ3VtZW50cyBvcGVyYW5kIGluIHN0cmljdCBtb2RlJyxcbiAgICAgIFN0cmljdFJlc2VydmVkV29yZDogICdVc2Ugb2YgZnV0dXJlIHJlc2VydmVkIHdvcmQgaW4gc3RyaWN0IG1vZGUnXG4gIH07XG5cbiAgLy8gU2VlIGFsc28gdG9vbHMvZ2VuZXJhdGUtdW5pY29kZS1yZWdleC5weS5cbiAgUmVnZXggPSB7XG4gICAgICBOb25Bc2NpaUlkZW50aWZpZXJTdGFydDogbmV3IFJlZ0V4cCgnW1xceEFBXFx4QjVcXHhCQVxceEMwLVxceEQ2XFx4RDgtXFx4RjZcXHhGOC1cXHUwMkMxXFx1MDJDNi1cXHUwMkQxXFx1MDJFMC1cXHUwMkU0XFx1MDJFQ1xcdTAyRUVcXHUwMzcwLVxcdTAzNzRcXHUwMzc2XFx1MDM3N1xcdTAzN0EtXFx1MDM3RFxcdTAzN0ZcXHUwMzg2XFx1MDM4OC1cXHUwMzhBXFx1MDM4Q1xcdTAzOEUtXFx1MDNBMVxcdTAzQTMtXFx1MDNGNVxcdTAzRjctXFx1MDQ4MVxcdTA0OEEtXFx1MDUyRlxcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYxLVxcdTA1ODdcXHUwNUQwLVxcdTA1RUFcXHUwNUYwLVxcdTA1RjJcXHUwNjIwLVxcdTA2NEFcXHUwNjZFXFx1MDY2RlxcdTA2NzEtXFx1MDZEM1xcdTA2RDVcXHUwNkU1XFx1MDZFNlxcdTA2RUVcXHUwNkVGXFx1MDZGQS1cXHUwNkZDXFx1MDZGRlxcdTA3MTBcXHUwNzEyLVxcdTA3MkZcXHUwNzRELVxcdTA3QTVcXHUwN0IxXFx1MDdDQS1cXHUwN0VBXFx1MDdGNFxcdTA3RjVcXHUwN0ZBXFx1MDgwMC1cXHUwODE1XFx1MDgxQVxcdTA4MjRcXHUwODI4XFx1MDg0MC1cXHUwODU4XFx1MDhBMC1cXHUwOEIyXFx1MDkwNC1cXHUwOTM5XFx1MDkzRFxcdTA5NTBcXHUwOTU4LVxcdTA5NjFcXHUwOTcxLVxcdTA5ODBcXHUwOTg1LVxcdTA5OENcXHUwOThGXFx1MDk5MFxcdTA5OTMtXFx1MDlBOFxcdTA5QUEtXFx1MDlCMFxcdTA5QjJcXHUwOUI2LVxcdTA5QjlcXHUwOUJEXFx1MDlDRVxcdTA5RENcXHUwOUREXFx1MDlERi1cXHUwOUUxXFx1MDlGMFxcdTA5RjFcXHUwQTA1LVxcdTBBMEFcXHUwQTBGXFx1MEExMFxcdTBBMTMtXFx1MEEyOFxcdTBBMkEtXFx1MEEzMFxcdTBBMzJcXHUwQTMzXFx1MEEzNVxcdTBBMzZcXHUwQTM4XFx1MEEzOVxcdTBBNTktXFx1MEE1Q1xcdTBBNUVcXHUwQTcyLVxcdTBBNzRcXHUwQTg1LVxcdTBBOERcXHUwQThGLVxcdTBBOTFcXHUwQTkzLVxcdTBBQThcXHUwQUFBLVxcdTBBQjBcXHUwQUIyXFx1MEFCM1xcdTBBQjUtXFx1MEFCOVxcdTBBQkRcXHUwQUQwXFx1MEFFMFxcdTBBRTFcXHUwQjA1LVxcdTBCMENcXHUwQjBGXFx1MEIxMFxcdTBCMTMtXFx1MEIyOFxcdTBCMkEtXFx1MEIzMFxcdTBCMzJcXHUwQjMzXFx1MEIzNS1cXHUwQjM5XFx1MEIzRFxcdTBCNUNcXHUwQjVEXFx1MEI1Ri1cXHUwQjYxXFx1MEI3MVxcdTBCODNcXHUwQjg1LVxcdTBCOEFcXHUwQjhFLVxcdTBCOTBcXHUwQjkyLVxcdTBCOTVcXHUwQjk5XFx1MEI5QVxcdTBCOUNcXHUwQjlFXFx1MEI5RlxcdTBCQTNcXHUwQkE0XFx1MEJBOC1cXHUwQkFBXFx1MEJBRS1cXHUwQkI5XFx1MEJEMFxcdTBDMDUtXFx1MEMwQ1xcdTBDMEUtXFx1MEMxMFxcdTBDMTItXFx1MEMyOFxcdTBDMkEtXFx1MEMzOVxcdTBDM0RcXHUwQzU4XFx1MEM1OVxcdTBDNjBcXHUwQzYxXFx1MEM4NS1cXHUwQzhDXFx1MEM4RS1cXHUwQzkwXFx1MEM5Mi1cXHUwQ0E4XFx1MENBQS1cXHUwQ0IzXFx1MENCNS1cXHUwQ0I5XFx1MENCRFxcdTBDREVcXHUwQ0UwXFx1MENFMVxcdTBDRjFcXHUwQ0YyXFx1MEQwNS1cXHUwRDBDXFx1MEQwRS1cXHUwRDEwXFx1MEQxMi1cXHUwRDNBXFx1MEQzRFxcdTBENEVcXHUwRDYwXFx1MEQ2MVxcdTBEN0EtXFx1MEQ3RlxcdTBEODUtXFx1MEQ5NlxcdTBEOUEtXFx1MERCMVxcdTBEQjMtXFx1MERCQlxcdTBEQkRcXHUwREMwLVxcdTBEQzZcXHUwRTAxLVxcdTBFMzBcXHUwRTMyXFx1MEUzM1xcdTBFNDAtXFx1MEU0NlxcdTBFODFcXHUwRTgyXFx1MEU4NFxcdTBFODdcXHUwRTg4XFx1MEU4QVxcdTBFOERcXHUwRTk0LVxcdTBFOTdcXHUwRTk5LVxcdTBFOUZcXHUwRUExLVxcdTBFQTNcXHUwRUE1XFx1MEVBN1xcdTBFQUFcXHUwRUFCXFx1MEVBRC1cXHUwRUIwXFx1MEVCMlxcdTBFQjNcXHUwRUJEXFx1MEVDMC1cXHUwRUM0XFx1MEVDNlxcdTBFREMtXFx1MEVERlxcdTBGMDBcXHUwRjQwLVxcdTBGNDdcXHUwRjQ5LVxcdTBGNkNcXHUwRjg4LVxcdTBGOENcXHUxMDAwLVxcdTEwMkFcXHUxMDNGXFx1MTA1MC1cXHUxMDU1XFx1MTA1QS1cXHUxMDVEXFx1MTA2MVxcdTEwNjVcXHUxMDY2XFx1MTA2RS1cXHUxMDcwXFx1MTA3NS1cXHUxMDgxXFx1MTA4RVxcdTEwQTAtXFx1MTBDNVxcdTEwQzdcXHUxMENEXFx1MTBEMC1cXHUxMEZBXFx1MTBGQy1cXHUxMjQ4XFx1MTI0QS1cXHUxMjREXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNUEtXFx1MTI1RFxcdTEyNjAtXFx1MTI4OFxcdTEyOEEtXFx1MTI4RFxcdTEyOTAtXFx1MTJCMFxcdTEyQjItXFx1MTJCNVxcdTEyQjgtXFx1MTJCRVxcdTEyQzBcXHUxMkMyLVxcdTEyQzVcXHUxMkM4LVxcdTEyRDZcXHUxMkQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNUFcXHUxMzgwLVxcdTEzOEZcXHUxM0EwLVxcdTEzRjRcXHUxNDAxLVxcdTE2NkNcXHUxNjZGLVxcdTE2N0ZcXHUxNjgxLVxcdTE2OUFcXHUxNkEwLVxcdTE2RUFcXHUxNkVFLVxcdTE2RjhcXHUxNzAwLVxcdTE3MENcXHUxNzBFLVxcdTE3MTFcXHUxNzIwLVxcdTE3MzFcXHUxNzQwLVxcdTE3NTFcXHUxNzYwLVxcdTE3NkNcXHUxNzZFLVxcdTE3NzBcXHUxNzgwLVxcdTE3QjNcXHUxN0Q3XFx1MTdEQ1xcdTE4MjAtXFx1MTg3N1xcdTE4ODAtXFx1MThBOFxcdTE4QUFcXHUxOEIwLVxcdTE4RjVcXHUxOTAwLVxcdTE5MUVcXHUxOTUwLVxcdTE5NkRcXHUxOTcwLVxcdTE5NzRcXHUxOTgwLVxcdTE5QUJcXHUxOUMxLVxcdTE5QzdcXHUxQTAwLVxcdTFBMTZcXHUxQTIwLVxcdTFBNTRcXHUxQUE3XFx1MUIwNS1cXHUxQjMzXFx1MUI0NS1cXHUxQjRCXFx1MUI4My1cXHUxQkEwXFx1MUJBRVxcdTFCQUZcXHUxQkJBLVxcdTFCRTVcXHUxQzAwLVxcdTFDMjNcXHUxQzRELVxcdTFDNEZcXHUxQzVBLVxcdTFDN0RcXHUxQ0U5LVxcdTFDRUNcXHUxQ0VFLVxcdTFDRjFcXHUxQ0Y1XFx1MUNGNlxcdTFEMDAtXFx1MURCRlxcdTFFMDAtXFx1MUYxNVxcdTFGMTgtXFx1MUYxRFxcdTFGMjAtXFx1MUY0NVxcdTFGNDgtXFx1MUY0RFxcdTFGNTAtXFx1MUY1N1xcdTFGNTlcXHUxRjVCXFx1MUY1RFxcdTFGNUYtXFx1MUY3RFxcdTFGODAtXFx1MUZCNFxcdTFGQjYtXFx1MUZCQ1xcdTFGQkVcXHUxRkMyLVxcdTFGQzRcXHUxRkM2LVxcdTFGQ0NcXHUxRkQwLVxcdTFGRDNcXHUxRkQ2LVxcdTFGREJcXHUxRkUwLVxcdTFGRUNcXHUxRkYyLVxcdTFGRjRcXHUxRkY2LVxcdTFGRkNcXHUyMDcxXFx1MjA3RlxcdTIwOTAtXFx1MjA5Q1xcdTIxMDJcXHUyMTA3XFx1MjEwQS1cXHUyMTEzXFx1MjExNVxcdTIxMTktXFx1MjExRFxcdTIxMjRcXHUyMTI2XFx1MjEyOFxcdTIxMkEtXFx1MjEyRFxcdTIxMkYtXFx1MjEzOVxcdTIxM0MtXFx1MjEzRlxcdTIxNDUtXFx1MjE0OVxcdTIxNEVcXHUyMTYwLVxcdTIxODhcXHUyQzAwLVxcdTJDMkVcXHUyQzMwLVxcdTJDNUVcXHUyQzYwLVxcdTJDRTRcXHUyQ0VCLVxcdTJDRUVcXHUyQ0YyXFx1MkNGM1xcdTJEMDAtXFx1MkQyNVxcdTJEMjdcXHUyRDJEXFx1MkQzMC1cXHUyRDY3XFx1MkQ2RlxcdTJEODAtXFx1MkQ5NlxcdTJEQTAtXFx1MkRBNlxcdTJEQTgtXFx1MkRBRVxcdTJEQjAtXFx1MkRCNlxcdTJEQjgtXFx1MkRCRVxcdTJEQzAtXFx1MkRDNlxcdTJEQzgtXFx1MkRDRVxcdTJERDAtXFx1MkRENlxcdTJERDgtXFx1MkRERVxcdTJFMkZcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMjlcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM0NcXHUzMDQxLVxcdTMwOTZcXHUzMDlELVxcdTMwOUZcXHUzMEExLVxcdTMwRkFcXHUzMEZDLVxcdTMwRkZcXHUzMTA1LVxcdTMxMkRcXHUzMTMxLVxcdTMxOEVcXHUzMUEwLVxcdTMxQkFcXHUzMUYwLVxcdTMxRkZcXHUzNDAwLVxcdTREQjVcXHU0RTAwLVxcdTlGQ0NcXHVBMDAwLVxcdUE0OENcXHVBNEQwLVxcdUE0RkRcXHVBNTAwLVxcdUE2MENcXHVBNjEwLVxcdUE2MUZcXHVBNjJBXFx1QTYyQlxcdUE2NDAtXFx1QTY2RVxcdUE2N0YtXFx1QTY5RFxcdUE2QTAtXFx1QTZFRlxcdUE3MTctXFx1QTcxRlxcdUE3MjItXFx1QTc4OFxcdUE3OEItXFx1QTc4RVxcdUE3OTAtXFx1QTdBRFxcdUE3QjBcXHVBN0IxXFx1QTdGNy1cXHVBODAxXFx1QTgwMy1cXHVBODA1XFx1QTgwNy1cXHVBODBBXFx1QTgwQy1cXHVBODIyXFx1QTg0MC1cXHVBODczXFx1QTg4Mi1cXHVBOEIzXFx1QThGMi1cXHVBOEY3XFx1QThGQlxcdUE5MEEtXFx1QTkyNVxcdUE5MzAtXFx1QTk0NlxcdUE5NjAtXFx1QTk3Q1xcdUE5ODQtXFx1QTlCMlxcdUE5Q0ZcXHVBOUUwLVxcdUE5RTRcXHVBOUU2LVxcdUE5RUZcXHVBOUZBLVxcdUE5RkVcXHVBQTAwLVxcdUFBMjhcXHVBQTQwLVxcdUFBNDJcXHVBQTQ0LVxcdUFBNEJcXHVBQTYwLVxcdUFBNzZcXHVBQTdBXFx1QUE3RS1cXHVBQUFGXFx1QUFCMVxcdUFBQjVcXHVBQUI2XFx1QUFCOS1cXHVBQUJEXFx1QUFDMFxcdUFBQzJcXHVBQURCLVxcdUFBRERcXHVBQUUwLVxcdUFBRUFcXHVBQUYyLVxcdUFBRjRcXHVBQjAxLVxcdUFCMDZcXHVBQjA5LVxcdUFCMEVcXHVBQjExLVxcdUFCMTZcXHVBQjIwLVxcdUFCMjZcXHVBQjI4LVxcdUFCMkVcXHVBQjMwLVxcdUFCNUFcXHVBQjVDLVxcdUFCNUZcXHVBQjY0XFx1QUI2NVxcdUFCQzAtXFx1QUJFMlxcdUFDMDAtXFx1RDdBM1xcdUQ3QjAtXFx1RDdDNlxcdUQ3Q0ItXFx1RDdGQlxcdUY5MDAtXFx1RkE2RFxcdUZBNzAtXFx1RkFEOVxcdUZCMDAtXFx1RkIwNlxcdUZCMTMtXFx1RkIxN1xcdUZCMURcXHVGQjFGLVxcdUZCMjhcXHVGQjJBLVxcdUZCMzZcXHVGQjM4LVxcdUZCM0NcXHVGQjNFXFx1RkI0MFxcdUZCNDFcXHVGQjQzXFx1RkI0NFxcdUZCNDYtXFx1RkJCMVxcdUZCRDMtXFx1RkQzRFxcdUZENTAtXFx1RkQ4RlxcdUZEOTItXFx1RkRDN1xcdUZERjAtXFx1RkRGQlxcdUZFNzAtXFx1RkU3NFxcdUZFNzYtXFx1RkVGQ1xcdUZGMjEtXFx1RkYzQVxcdUZGNDEtXFx1RkY1QVxcdUZGNjYtXFx1RkZCRVxcdUZGQzItXFx1RkZDN1xcdUZGQ0EtXFx1RkZDRlxcdUZGRDItXFx1RkZEN1xcdUZGREEtXFx1RkZEQ10nKSxcbiAgICAgIE5vbkFzY2lpSWRlbnRpZmllclBhcnQ6IG5ldyBSZWdFeHAoJ1tcXHhBQVxceEI1XFx4QkFcXHhDMC1cXHhENlxceEQ4LVxceEY2XFx4RjgtXFx1MDJDMVxcdTAyQzYtXFx1MDJEMVxcdTAyRTAtXFx1MDJFNFxcdTAyRUNcXHUwMkVFXFx1MDMwMC1cXHUwMzc0XFx1MDM3NlxcdTAzNzdcXHUwMzdBLVxcdTAzN0RcXHUwMzdGXFx1MDM4NlxcdTAzODgtXFx1MDM4QVxcdTAzOENcXHUwMzhFLVxcdTAzQTFcXHUwM0EzLVxcdTAzRjVcXHUwM0Y3LVxcdTA0ODFcXHUwNDgzLVxcdTA0ODdcXHUwNDhBLVxcdTA1MkZcXHUwNTMxLVxcdTA1NTZcXHUwNTU5XFx1MDU2MS1cXHUwNTg3XFx1MDU5MS1cXHUwNUJEXFx1MDVCRlxcdTA1QzFcXHUwNUMyXFx1MDVDNFxcdTA1QzVcXHUwNUM3XFx1MDVEMC1cXHUwNUVBXFx1MDVGMC1cXHUwNUYyXFx1MDYxMC1cXHUwNjFBXFx1MDYyMC1cXHUwNjY5XFx1MDY2RS1cXHUwNkQzXFx1MDZENS1cXHUwNkRDXFx1MDZERi1cXHUwNkU4XFx1MDZFQS1cXHUwNkZDXFx1MDZGRlxcdTA3MTAtXFx1MDc0QVxcdTA3NEQtXFx1MDdCMVxcdTA3QzAtXFx1MDdGNVxcdTA3RkFcXHUwODAwLVxcdTA4MkRcXHUwODQwLVxcdTA4NUJcXHUwOEEwLVxcdTA4QjJcXHUwOEU0LVxcdTA5NjNcXHUwOTY2LVxcdTA5NkZcXHUwOTcxLVxcdTA5ODNcXHUwOTg1LVxcdTA5OENcXHUwOThGXFx1MDk5MFxcdTA5OTMtXFx1MDlBOFxcdTA5QUEtXFx1MDlCMFxcdTA5QjJcXHUwOUI2LVxcdTA5QjlcXHUwOUJDLVxcdTA5QzRcXHUwOUM3XFx1MDlDOFxcdTA5Q0ItXFx1MDlDRVxcdTA5RDdcXHUwOURDXFx1MDlERFxcdTA5REYtXFx1MDlFM1xcdTA5RTYtXFx1MDlGMVxcdTBBMDEtXFx1MEEwM1xcdTBBMDUtXFx1MEEwQVxcdTBBMEZcXHUwQTEwXFx1MEExMy1cXHUwQTI4XFx1MEEyQS1cXHUwQTMwXFx1MEEzMlxcdTBBMzNcXHUwQTM1XFx1MEEzNlxcdTBBMzhcXHUwQTM5XFx1MEEzQ1xcdTBBM0UtXFx1MEE0MlxcdTBBNDdcXHUwQTQ4XFx1MEE0Qi1cXHUwQTREXFx1MEE1MVxcdTBBNTktXFx1MEE1Q1xcdTBBNUVcXHUwQTY2LVxcdTBBNzVcXHUwQTgxLVxcdTBBODNcXHUwQTg1LVxcdTBBOERcXHUwQThGLVxcdTBBOTFcXHUwQTkzLVxcdTBBQThcXHUwQUFBLVxcdTBBQjBcXHUwQUIyXFx1MEFCM1xcdTBBQjUtXFx1MEFCOVxcdTBBQkMtXFx1MEFDNVxcdTBBQzctXFx1MEFDOVxcdTBBQ0ItXFx1MEFDRFxcdTBBRDBcXHUwQUUwLVxcdTBBRTNcXHUwQUU2LVxcdTBBRUZcXHUwQjAxLVxcdTBCMDNcXHUwQjA1LVxcdTBCMENcXHUwQjBGXFx1MEIxMFxcdTBCMTMtXFx1MEIyOFxcdTBCMkEtXFx1MEIzMFxcdTBCMzJcXHUwQjMzXFx1MEIzNS1cXHUwQjM5XFx1MEIzQy1cXHUwQjQ0XFx1MEI0N1xcdTBCNDhcXHUwQjRCLVxcdTBCNERcXHUwQjU2XFx1MEI1N1xcdTBCNUNcXHUwQjVEXFx1MEI1Ri1cXHUwQjYzXFx1MEI2Ni1cXHUwQjZGXFx1MEI3MVxcdTBCODJcXHUwQjgzXFx1MEI4NS1cXHUwQjhBXFx1MEI4RS1cXHUwQjkwXFx1MEI5Mi1cXHUwQjk1XFx1MEI5OVxcdTBCOUFcXHUwQjlDXFx1MEI5RVxcdTBCOUZcXHUwQkEzXFx1MEJBNFxcdTBCQTgtXFx1MEJBQVxcdTBCQUUtXFx1MEJCOVxcdTBCQkUtXFx1MEJDMlxcdTBCQzYtXFx1MEJDOFxcdTBCQ0EtXFx1MEJDRFxcdTBCRDBcXHUwQkQ3XFx1MEJFNi1cXHUwQkVGXFx1MEMwMC1cXHUwQzAzXFx1MEMwNS1cXHUwQzBDXFx1MEMwRS1cXHUwQzEwXFx1MEMxMi1cXHUwQzI4XFx1MEMyQS1cXHUwQzM5XFx1MEMzRC1cXHUwQzQ0XFx1MEM0Ni1cXHUwQzQ4XFx1MEM0QS1cXHUwQzREXFx1MEM1NVxcdTBDNTZcXHUwQzU4XFx1MEM1OVxcdTBDNjAtXFx1MEM2M1xcdTBDNjYtXFx1MEM2RlxcdTBDODEtXFx1MEM4M1xcdTBDODUtXFx1MEM4Q1xcdTBDOEUtXFx1MEM5MFxcdTBDOTItXFx1MENBOFxcdTBDQUEtXFx1MENCM1xcdTBDQjUtXFx1MENCOVxcdTBDQkMtXFx1MENDNFxcdTBDQzYtXFx1MENDOFxcdTBDQ0EtXFx1MENDRFxcdTBDRDVcXHUwQ0Q2XFx1MENERVxcdTBDRTAtXFx1MENFM1xcdTBDRTYtXFx1MENFRlxcdTBDRjFcXHUwQ0YyXFx1MEQwMS1cXHUwRDAzXFx1MEQwNS1cXHUwRDBDXFx1MEQwRS1cXHUwRDEwXFx1MEQxMi1cXHUwRDNBXFx1MEQzRC1cXHUwRDQ0XFx1MEQ0Ni1cXHUwRDQ4XFx1MEQ0QS1cXHUwRDRFXFx1MEQ1N1xcdTBENjAtXFx1MEQ2M1xcdTBENjYtXFx1MEQ2RlxcdTBEN0EtXFx1MEQ3RlxcdTBEODJcXHUwRDgzXFx1MEQ4NS1cXHUwRDk2XFx1MEQ5QS1cXHUwREIxXFx1MERCMy1cXHUwREJCXFx1MERCRFxcdTBEQzAtXFx1MERDNlxcdTBEQ0FcXHUwRENGLVxcdTBERDRcXHUwREQ2XFx1MEREOC1cXHUwRERGXFx1MERFNi1cXHUwREVGXFx1MERGMlxcdTBERjNcXHUwRTAxLVxcdTBFM0FcXHUwRTQwLVxcdTBFNEVcXHUwRTUwLVxcdTBFNTlcXHUwRTgxXFx1MEU4MlxcdTBFODRcXHUwRTg3XFx1MEU4OFxcdTBFOEFcXHUwRThEXFx1MEU5NC1cXHUwRTk3XFx1MEU5OS1cXHUwRTlGXFx1MEVBMS1cXHUwRUEzXFx1MEVBNVxcdTBFQTdcXHUwRUFBXFx1MEVBQlxcdTBFQUQtXFx1MEVCOVxcdTBFQkItXFx1MEVCRFxcdTBFQzAtXFx1MEVDNFxcdTBFQzZcXHUwRUM4LVxcdTBFQ0RcXHUwRUQwLVxcdTBFRDlcXHUwRURDLVxcdTBFREZcXHUwRjAwXFx1MEYxOFxcdTBGMTlcXHUwRjIwLVxcdTBGMjlcXHUwRjM1XFx1MEYzN1xcdTBGMzlcXHUwRjNFLVxcdTBGNDdcXHUwRjQ5LVxcdTBGNkNcXHUwRjcxLVxcdTBGODRcXHUwRjg2LVxcdTBGOTdcXHUwRjk5LVxcdTBGQkNcXHUwRkM2XFx1MTAwMC1cXHUxMDQ5XFx1MTA1MC1cXHUxMDlEXFx1MTBBMC1cXHUxMEM1XFx1MTBDN1xcdTEwQ0RcXHUxMEQwLVxcdTEwRkFcXHUxMEZDLVxcdTEyNDhcXHUxMjRBLVxcdTEyNERcXHUxMjUwLVxcdTEyNTZcXHUxMjU4XFx1MTI1QS1cXHUxMjVEXFx1MTI2MC1cXHUxMjg4XFx1MTI4QS1cXHUxMjhEXFx1MTI5MC1cXHUxMkIwXFx1MTJCMi1cXHUxMkI1XFx1MTJCOC1cXHUxMkJFXFx1MTJDMFxcdTEyQzItXFx1MTJDNVxcdTEyQzgtXFx1MTJENlxcdTEyRDgtXFx1MTMxMFxcdTEzMTItXFx1MTMxNVxcdTEzMTgtXFx1MTM1QVxcdTEzNUQtXFx1MTM1RlxcdTEzODAtXFx1MTM4RlxcdTEzQTAtXFx1MTNGNFxcdTE0MDEtXFx1MTY2Q1xcdTE2NkYtXFx1MTY3RlxcdTE2ODEtXFx1MTY5QVxcdTE2QTAtXFx1MTZFQVxcdTE2RUUtXFx1MTZGOFxcdTE3MDAtXFx1MTcwQ1xcdTE3MEUtXFx1MTcxNFxcdTE3MjAtXFx1MTczNFxcdTE3NDAtXFx1MTc1M1xcdTE3NjAtXFx1MTc2Q1xcdTE3NkUtXFx1MTc3MFxcdTE3NzJcXHUxNzczXFx1MTc4MC1cXHUxN0QzXFx1MTdEN1xcdTE3RENcXHUxN0REXFx1MTdFMC1cXHUxN0U5XFx1MTgwQi1cXHUxODBEXFx1MTgxMC1cXHUxODE5XFx1MTgyMC1cXHUxODc3XFx1MTg4MC1cXHUxOEFBXFx1MThCMC1cXHUxOEY1XFx1MTkwMC1cXHUxOTFFXFx1MTkyMC1cXHUxOTJCXFx1MTkzMC1cXHUxOTNCXFx1MTk0Ni1cXHUxOTZEXFx1MTk3MC1cXHUxOTc0XFx1MTk4MC1cXHUxOUFCXFx1MTlCMC1cXHUxOUM5XFx1MTlEMC1cXHUxOUQ5XFx1MUEwMC1cXHUxQTFCXFx1MUEyMC1cXHUxQTVFXFx1MUE2MC1cXHUxQTdDXFx1MUE3Ri1cXHUxQTg5XFx1MUE5MC1cXHUxQTk5XFx1MUFBN1xcdTFBQjAtXFx1MUFCRFxcdTFCMDAtXFx1MUI0QlxcdTFCNTAtXFx1MUI1OVxcdTFCNkItXFx1MUI3M1xcdTFCODAtXFx1MUJGM1xcdTFDMDAtXFx1MUMzN1xcdTFDNDAtXFx1MUM0OVxcdTFDNEQtXFx1MUM3RFxcdTFDRDAtXFx1MUNEMlxcdTFDRDQtXFx1MUNGNlxcdTFDRjhcXHUxQ0Y5XFx1MUQwMC1cXHUxREY1XFx1MURGQy1cXHUxRjE1XFx1MUYxOC1cXHUxRjFEXFx1MUYyMC1cXHUxRjQ1XFx1MUY0OC1cXHUxRjREXFx1MUY1MC1cXHUxRjU3XFx1MUY1OVxcdTFGNUJcXHUxRjVEXFx1MUY1Ri1cXHUxRjdEXFx1MUY4MC1cXHUxRkI0XFx1MUZCNi1cXHUxRkJDXFx1MUZCRVxcdTFGQzItXFx1MUZDNFxcdTFGQzYtXFx1MUZDQ1xcdTFGRDAtXFx1MUZEM1xcdTFGRDYtXFx1MUZEQlxcdTFGRTAtXFx1MUZFQ1xcdTFGRjItXFx1MUZGNFxcdTFGRjYtXFx1MUZGQ1xcdTIwMENcXHUyMDBEXFx1MjAzRlxcdTIwNDBcXHUyMDU0XFx1MjA3MVxcdTIwN0ZcXHUyMDkwLVxcdTIwOUNcXHUyMEQwLVxcdTIwRENcXHUyMEUxXFx1MjBFNS1cXHUyMEYwXFx1MjEwMlxcdTIxMDdcXHUyMTBBLVxcdTIxMTNcXHUyMTE1XFx1MjExOS1cXHUyMTFEXFx1MjEyNFxcdTIxMjZcXHUyMTI4XFx1MjEyQS1cXHUyMTJEXFx1MjEyRi1cXHUyMTM5XFx1MjEzQy1cXHUyMTNGXFx1MjE0NS1cXHUyMTQ5XFx1MjE0RVxcdTIxNjAtXFx1MjE4OFxcdTJDMDAtXFx1MkMyRVxcdTJDMzAtXFx1MkM1RVxcdTJDNjAtXFx1MkNFNFxcdTJDRUItXFx1MkNGM1xcdTJEMDAtXFx1MkQyNVxcdTJEMjdcXHUyRDJEXFx1MkQzMC1cXHUyRDY3XFx1MkQ2RlxcdTJEN0YtXFx1MkQ5NlxcdTJEQTAtXFx1MkRBNlxcdTJEQTgtXFx1MkRBRVxcdTJEQjAtXFx1MkRCNlxcdTJEQjgtXFx1MkRCRVxcdTJEQzAtXFx1MkRDNlxcdTJEQzgtXFx1MkRDRVxcdTJERDAtXFx1MkRENlxcdTJERDgtXFx1MkRERVxcdTJERTAtXFx1MkRGRlxcdTJFMkZcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMkZcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM0NcXHUzMDQxLVxcdTMwOTZcXHUzMDk5XFx1MzA5QVxcdTMwOUQtXFx1MzA5RlxcdTMwQTEtXFx1MzBGQVxcdTMwRkMtXFx1MzBGRlxcdTMxMDUtXFx1MzEyRFxcdTMxMzEtXFx1MzE4RVxcdTMxQTAtXFx1MzFCQVxcdTMxRjAtXFx1MzFGRlxcdTM0MDAtXFx1NERCNVxcdTRFMDAtXFx1OUZDQ1xcdUEwMDAtXFx1QTQ4Q1xcdUE0RDAtXFx1QTRGRFxcdUE1MDAtXFx1QTYwQ1xcdUE2MTAtXFx1QTYyQlxcdUE2NDAtXFx1QTY2RlxcdUE2NzQtXFx1QTY3RFxcdUE2N0YtXFx1QTY5RFxcdUE2OUYtXFx1QTZGMVxcdUE3MTctXFx1QTcxRlxcdUE3MjItXFx1QTc4OFxcdUE3OEItXFx1QTc4RVxcdUE3OTAtXFx1QTdBRFxcdUE3QjBcXHVBN0IxXFx1QTdGNy1cXHVBODI3XFx1QTg0MC1cXHVBODczXFx1QTg4MC1cXHVBOEM0XFx1QThEMC1cXHVBOEQ5XFx1QThFMC1cXHVBOEY3XFx1QThGQlxcdUE5MDAtXFx1QTkyRFxcdUE5MzAtXFx1QTk1M1xcdUE5NjAtXFx1QTk3Q1xcdUE5ODAtXFx1QTlDMFxcdUE5Q0YtXFx1QTlEOVxcdUE5RTAtXFx1QTlGRVxcdUFBMDAtXFx1QUEzNlxcdUFBNDAtXFx1QUE0RFxcdUFBNTAtXFx1QUE1OVxcdUFBNjAtXFx1QUE3NlxcdUFBN0EtXFx1QUFDMlxcdUFBREItXFx1QUFERFxcdUFBRTAtXFx1QUFFRlxcdUFBRjItXFx1QUFGNlxcdUFCMDEtXFx1QUIwNlxcdUFCMDktXFx1QUIwRVxcdUFCMTEtXFx1QUIxNlxcdUFCMjAtXFx1QUIyNlxcdUFCMjgtXFx1QUIyRVxcdUFCMzAtXFx1QUI1QVxcdUFCNUMtXFx1QUI1RlxcdUFCNjRcXHVBQjY1XFx1QUJDMC1cXHVBQkVBXFx1QUJFQ1xcdUFCRURcXHVBQkYwLVxcdUFCRjlcXHVBQzAwLVxcdUQ3QTNcXHVEN0IwLVxcdUQ3QzZcXHVEN0NCLVxcdUQ3RkJcXHVGOTAwLVxcdUZBNkRcXHVGQTcwLVxcdUZBRDlcXHVGQjAwLVxcdUZCMDZcXHVGQjEzLVxcdUZCMTdcXHVGQjFELVxcdUZCMjhcXHVGQjJBLVxcdUZCMzZcXHVGQjM4LVxcdUZCM0NcXHVGQjNFXFx1RkI0MFxcdUZCNDFcXHVGQjQzXFx1RkI0NFxcdUZCNDYtXFx1RkJCMVxcdUZCRDMtXFx1RkQzRFxcdUZENTAtXFx1RkQ4RlxcdUZEOTItXFx1RkRDN1xcdUZERjAtXFx1RkRGQlxcdUZFMDAtXFx1RkUwRlxcdUZFMjAtXFx1RkUyRFxcdUZFMzNcXHVGRTM0XFx1RkU0RC1cXHVGRTRGXFx1RkU3MC1cXHVGRTc0XFx1RkU3Ni1cXHVGRUZDXFx1RkYxMC1cXHVGRjE5XFx1RkYyMS1cXHVGRjNBXFx1RkYzRlxcdUZGNDEtXFx1RkY1QVxcdUZGNjYtXFx1RkZCRVxcdUZGQzItXFx1RkZDN1xcdUZGQ0EtXFx1RkZDRlxcdUZGRDItXFx1RkZEN1xcdUZGREEtXFx1RkZEQ10nKVxuICB9O1xuXG4gIC8vIEVuc3VyZSB0aGUgY29uZGl0aW9uIGlzIHRydWUsIG90aGVyd2lzZSB0aHJvdyBhbiBlcnJvci5cbiAgLy8gVGhpcyBpcyBvbmx5IHRvIGhhdmUgYSBiZXR0ZXIgY29udHJhY3Qgc2VtYW50aWMsIGkuZS4gYW5vdGhlciBzYWZldHkgbmV0XG4gIC8vIHRvIGNhdGNoIGEgbG9naWMgZXJyb3IuIFRoZSBjb25kaXRpb24gc2hhbGwgYmUgZnVsZmlsbGVkIGluIG5vcm1hbCBjYXNlLlxuICAvLyBEbyBOT1QgdXNlIHRoaXMgdG8gZW5mb3JjZSBhIGNlcnRhaW4gY29uZGl0aW9uIG9uIGFueSB1c2VyIGlucHV0LlxuXG4gIGZ1bmN0aW9uIGFzc2VydChjb25kaXRpb24sIG1lc3NhZ2UpIHtcbiAgICAgIGlmICghY29uZGl0aW9uKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBU1NFUlQ6ICcgKyBtZXNzYWdlKTtcbiAgICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlzRGVjaW1hbERpZ2l0KGNoKSB7XG4gICAgICByZXR1cm4gKGNoID49IDB4MzAgJiYgY2ggPD0gMHgzOSk7ICAgLy8gMC4uOVxuICB9XG5cbiAgZnVuY3Rpb24gaXNIZXhEaWdpdChjaCkge1xuICAgICAgcmV0dXJuICcwMTIzNDU2Nzg5YWJjZGVmQUJDREVGJy5pbmRleE9mKGNoKSA+PSAwO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNPY3RhbERpZ2l0KGNoKSB7XG4gICAgICByZXR1cm4gJzAxMjM0NTY3Jy5pbmRleE9mKGNoKSA+PSAwO1xuICB9XG5cbiAgLy8gNy4yIFdoaXRlIFNwYWNlXG5cbiAgZnVuY3Rpb24gaXNXaGl0ZVNwYWNlKGNoKSB7XG4gICAgICByZXR1cm4gKGNoID09PSAweDIwKSB8fCAoY2ggPT09IDB4MDkpIHx8IChjaCA9PT0gMHgwQikgfHwgKGNoID09PSAweDBDKSB8fCAoY2ggPT09IDB4QTApIHx8XG4gICAgICAgICAgKGNoID49IDB4MTY4MCAmJiBbMHgxNjgwLCAweDE4MEUsIDB4MjAwMCwgMHgyMDAxLCAweDIwMDIsIDB4MjAwMywgMHgyMDA0LCAweDIwMDUsIDB4MjAwNiwgMHgyMDA3LCAweDIwMDgsIDB4MjAwOSwgMHgyMDBBLCAweDIwMkYsIDB4MjA1RiwgMHgzMDAwLCAweEZFRkZdLmluZGV4T2YoY2gpID49IDApO1xuICB9XG5cbiAgLy8gNy4zIExpbmUgVGVybWluYXRvcnNcblxuICBmdW5jdGlvbiBpc0xpbmVUZXJtaW5hdG9yKGNoKSB7XG4gICAgICByZXR1cm4gKGNoID09PSAweDBBKSB8fCAoY2ggPT09IDB4MEQpIHx8IChjaCA9PT0gMHgyMDI4KSB8fCAoY2ggPT09IDB4MjAyOSk7XG4gIH1cblxuICAvLyA3LjYgSWRlbnRpZmllciBOYW1lcyBhbmQgSWRlbnRpZmllcnNcblxuICBmdW5jdGlvbiBpc0lkZW50aWZpZXJTdGFydChjaCkge1xuICAgICAgcmV0dXJuIChjaCA9PT0gMHgyNCkgfHwgKGNoID09PSAweDVGKSB8fCAgLy8gJCAoZG9sbGFyKSBhbmQgXyAodW5kZXJzY29yZSlcbiAgICAgICAgICAoY2ggPj0gMHg0MSAmJiBjaCA8PSAweDVBKSB8fCAgICAgICAgIC8vIEEuLlpcbiAgICAgICAgICAoY2ggPj0gMHg2MSAmJiBjaCA8PSAweDdBKSB8fCAgICAgICAgIC8vIGEuLnpcbiAgICAgICAgICAoY2ggPT09IDB4NUMpIHx8ICAgICAgICAgICAgICAgICAgICAgIC8vIFxcIChiYWNrc2xhc2gpXG4gICAgICAgICAgKChjaCA+PSAweDgwKSAmJiBSZWdleC5Ob25Bc2NpaUlkZW50aWZpZXJTdGFydC50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpKSk7XG4gIH1cblxuICBmdW5jdGlvbiBpc0lkZW50aWZpZXJQYXJ0KGNoKSB7XG4gICAgICByZXR1cm4gKGNoID09PSAweDI0KSB8fCAoY2ggPT09IDB4NUYpIHx8ICAvLyAkIChkb2xsYXIpIGFuZCBfICh1bmRlcnNjb3JlKVxuICAgICAgICAgIChjaCA+PSAweDQxICYmIGNoIDw9IDB4NUEpIHx8ICAgICAgICAgLy8gQS4uWlxuICAgICAgICAgIChjaCA+PSAweDYxICYmIGNoIDw9IDB4N0EpIHx8ICAgICAgICAgLy8gYS4uelxuICAgICAgICAgIChjaCA+PSAweDMwICYmIGNoIDw9IDB4MzkpIHx8ICAgICAgICAgLy8gMC4uOVxuICAgICAgICAgIChjaCA9PT0gMHg1QykgfHwgICAgICAgICAgICAgICAgICAgICAgLy8gXFwgKGJhY2tzbGFzaClcbiAgICAgICAgICAoKGNoID49IDB4ODApICYmIFJlZ2V4Lk5vbkFzY2lpSWRlbnRpZmllclBhcnQudGVzdChTdHJpbmcuZnJvbUNoYXJDb2RlKGNoKSkpO1xuICB9XG5cbiAgLy8gNy42LjEuMiBGdXR1cmUgUmVzZXJ2ZWQgV29yZHNcblxuICBmdW5jdGlvbiBpc0Z1dHVyZVJlc2VydmVkV29yZChpZCkge1xuICAgICAgc3dpdGNoIChpZCkge1xuICAgICAgY2FzZSAnY2xhc3MnOlxuICAgICAgY2FzZSAnZW51bSc6XG4gICAgICBjYXNlICdleHBvcnQnOlxuICAgICAgY2FzZSAnZXh0ZW5kcyc6XG4gICAgICBjYXNlICdpbXBvcnQnOlxuICAgICAgY2FzZSAnc3VwZXInOlxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoaWQpIHtcbiAgICAgIHN3aXRjaCAoaWQpIHtcbiAgICAgIGNhc2UgJ2ltcGxlbWVudHMnOlxuICAgICAgY2FzZSAnaW50ZXJmYWNlJzpcbiAgICAgIGNhc2UgJ3BhY2thZ2UnOlxuICAgICAgY2FzZSAncHJpdmF0ZSc6XG4gICAgICBjYXNlICdwcm90ZWN0ZWQnOlxuICAgICAgY2FzZSAncHVibGljJzpcbiAgICAgIGNhc2UgJ3N0YXRpYyc6XG4gICAgICBjYXNlICd5aWVsZCc6XG4gICAgICBjYXNlICdsZXQnOlxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gIH1cblxuICAvLyA3LjYuMS4xIEtleXdvcmRzXG5cbiAgZnVuY3Rpb24gaXNLZXl3b3JkKGlkKSB7XG4gICAgICBpZiAoc3RyaWN0ICYmIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZChpZCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gJ2NvbnN0JyBpcyBzcGVjaWFsaXplZCBhcyBLZXl3b3JkIGluIFY4LlxuICAgICAgLy8gJ3lpZWxkJyBhbmQgJ2xldCcgYXJlIGZvciBjb21wYXRpYmxpdHkgd2l0aCBTcGlkZXJNb25rZXkgYW5kIEVTLm5leHQuXG4gICAgICAvLyBTb21lIG90aGVycyBhcmUgZnJvbSBmdXR1cmUgcmVzZXJ2ZWQgd29yZHMuXG5cbiAgICAgIHN3aXRjaCAoaWQubGVuZ3RoKSB7XG4gICAgICBjYXNlIDI6XG4gICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ2lmJykgfHwgKGlkID09PSAnaW4nKSB8fCAoaWQgPT09ICdkbycpO1xuICAgICAgY2FzZSAzOlxuICAgICAgICAgIHJldHVybiAoaWQgPT09ICd2YXInKSB8fCAoaWQgPT09ICdmb3InKSB8fCAoaWQgPT09ICduZXcnKSB8fFxuICAgICAgICAgICAgICAoaWQgPT09ICd0cnknKSB8fCAoaWQgPT09ICdsZXQnKTtcbiAgICAgIGNhc2UgNDpcbiAgICAgICAgICByZXR1cm4gKGlkID09PSAndGhpcycpIHx8IChpZCA9PT0gJ2Vsc2UnKSB8fCAoaWQgPT09ICdjYXNlJykgfHxcbiAgICAgICAgICAgICAgKGlkID09PSAndm9pZCcpIHx8IChpZCA9PT0gJ3dpdGgnKSB8fCAoaWQgPT09ICdlbnVtJyk7XG4gICAgICBjYXNlIDU6XG4gICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ3doaWxlJykgfHwgKGlkID09PSAnYnJlYWsnKSB8fCAoaWQgPT09ICdjYXRjaCcpIHx8XG4gICAgICAgICAgICAgIChpZCA9PT0gJ3Rocm93JykgfHwgKGlkID09PSAnY29uc3QnKSB8fCAoaWQgPT09ICd5aWVsZCcpIHx8XG4gICAgICAgICAgICAgIChpZCA9PT0gJ2NsYXNzJykgfHwgKGlkID09PSAnc3VwZXInKTtcbiAgICAgIGNhc2UgNjpcbiAgICAgICAgICByZXR1cm4gKGlkID09PSAncmV0dXJuJykgfHwgKGlkID09PSAndHlwZW9mJykgfHwgKGlkID09PSAnZGVsZXRlJykgfHxcbiAgICAgICAgICAgICAgKGlkID09PSAnc3dpdGNoJykgfHwgKGlkID09PSAnZXhwb3J0JykgfHwgKGlkID09PSAnaW1wb3J0Jyk7XG4gICAgICBjYXNlIDc6XG4gICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ2RlZmF1bHQnKSB8fCAoaWQgPT09ICdmaW5hbGx5JykgfHwgKGlkID09PSAnZXh0ZW5kcycpO1xuICAgICAgY2FzZSA4OlxuICAgICAgICAgIHJldHVybiAoaWQgPT09ICdmdW5jdGlvbicpIHx8IChpZCA9PT0gJ2NvbnRpbnVlJykgfHwgKGlkID09PSAnZGVidWdnZXInKTtcbiAgICAgIGNhc2UgMTA6XG4gICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ2luc3RhbmNlb2YnKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2tpcENvbW1lbnQoKSB7XG4gICAgICB2YXIgY2gsIHN0YXJ0O1xuXG4gICAgICBzdGFydCA9IChpbmRleCA9PT0gMCk7XG4gICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBjaCA9IHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KTtcblxuICAgICAgICAgIGlmIChpc1doaXRlU3BhY2UoY2gpKSB7XG4gICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoKSkge1xuICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICBpZiAoY2ggPT09IDB4MEQgJiYgc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpID09PSAweDBBKSB7XG4gICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICsrbGluZU51bWJlcjtcbiAgICAgICAgICAgICAgbGluZVN0YXJ0ID0gaW5kZXg7XG4gICAgICAgICAgICAgIHN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzY2FuSGV4RXNjYXBlKHByZWZpeCkge1xuICAgICAgdmFyIGksIGxlbiwgY2gsIGNvZGUgPSAwO1xuXG4gICAgICBsZW4gPSAocHJlZml4ID09PSAndScpID8gNCA6IDI7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICBpZiAoaW5kZXggPCBsZW5ndGggJiYgaXNIZXhEaWdpdChzb3VyY2VbaW5kZXhdKSkge1xuICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgY29kZSA9IGNvZGUgKiAxNiArICcwMTIzNDU2Nzg5YWJjZGVmJy5pbmRleE9mKGNoLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNjYW5Vbmljb2RlQ29kZVBvaW50RXNjYXBlKCkge1xuICAgICAgdmFyIGNoLCBjb2RlLCBjdTEsIGN1MjtcblxuICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgY29kZSA9IDA7XG5cbiAgICAgIC8vIEF0IGxlYXN0LCBvbmUgaGV4IGRpZ2l0IGlzIHJlcXVpcmVkLlxuICAgICAgaWYgKGNoID09PSAnfScpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICB9XG5cbiAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGNoID0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgIGlmICghaXNIZXhEaWdpdChjaCkpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvZGUgPSBjb2RlICogMTYgKyAnMDEyMzQ1Njc4OWFiY2RlZicuaW5kZXhPZihjaC50b0xvd2VyQ2FzZSgpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvZGUgPiAweDEwRkZGRiB8fCBjaCAhPT0gJ30nKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgfVxuXG4gICAgICAvLyBVVEYtMTYgRW5jb2RpbmdcbiAgICAgIGlmIChjb2RlIDw9IDB4RkZGRikge1xuICAgICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpO1xuICAgICAgfVxuICAgICAgY3UxID0gKChjb2RlIC0gMHgxMDAwMCkgPj4gMTApICsgMHhEODAwO1xuICAgICAgY3UyID0gKChjb2RlIC0gMHgxMDAwMCkgJiAxMDIzKSArIDB4REMwMDtcbiAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGN1MSwgY3UyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEVzY2FwZWRJZGVudGlmaWVyKCkge1xuICAgICAgdmFyIGNoLCBpZDtcblxuICAgICAgY2ggPSBzb3VyY2UuY2hhckNvZGVBdChpbmRleCsrKTtcbiAgICAgIGlkID0gU3RyaW5nLmZyb21DaGFyQ29kZShjaCk7XG5cbiAgICAgIC8vICdcXHUnIChVKzAwNUMsIFUrMDA3NSkgZGVub3RlcyBhbiBlc2NhcGVkIGNoYXJhY3Rlci5cbiAgICAgIGlmIChjaCA9PT0gMHg1Qykge1xuICAgICAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkgIT09IDB4NzUpIHtcbiAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgIGNoID0gc2NhbkhleEVzY2FwZSgndScpO1xuICAgICAgICAgIGlmICghY2ggfHwgY2ggPT09ICdcXFxcJyB8fCAhaXNJZGVudGlmaWVyU3RhcnQoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZCA9IGNoO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBjaCA9IHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICAgICAgICBpZiAoIWlzSWRlbnRpZmllclBhcnQoY2gpKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgIGlkICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpO1xuXG4gICAgICAgICAgLy8gJ1xcdScgKFUrMDA1QywgVSswMDc1KSBkZW5vdGVzIGFuIGVzY2FwZWQgY2hhcmFjdGVyLlxuICAgICAgICAgIGlmIChjaCA9PT0gMHg1Qykge1xuICAgICAgICAgICAgICBpZCA9IGlkLnN1YnN0cigwLCBpZC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgICAgaWYgKHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSAhPT0gMHg3NSkge1xuICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgIGNoID0gc2NhbkhleEVzY2FwZSgndScpO1xuICAgICAgICAgICAgICBpZiAoIWNoIHx8IGNoID09PSAnXFxcXCcgfHwgIWlzSWRlbnRpZmllclBhcnQoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZCArPSBjaDtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBpZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldElkZW50aWZpZXIoKSB7XG4gICAgICB2YXIgc3RhcnQsIGNoO1xuXG4gICAgICBzdGFydCA9IGluZGV4Kys7XG4gICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBjaCA9IHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICAgICAgICBpZiAoY2ggPT09IDB4NUMpIHtcbiAgICAgICAgICAgICAgLy8gQmxhY2tzbGFzaCAoVSswMDVDKSBtYXJrcyBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZS5cbiAgICAgICAgICAgICAgaW5kZXggPSBzdGFydDtcbiAgICAgICAgICAgICAgcmV0dXJuIGdldEVzY2FwZWRJZGVudGlmaWVyKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpc0lkZW50aWZpZXJQYXJ0KGNoKSkge1xuICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNvdXJjZS5zbGljZShzdGFydCwgaW5kZXgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2NhbklkZW50aWZpZXIoKSB7XG4gICAgICB2YXIgc3RhcnQsIGlkLCB0eXBlO1xuXG4gICAgICBzdGFydCA9IGluZGV4O1xuXG4gICAgICAvLyBCYWNrc2xhc2ggKFUrMDA1Qykgc3RhcnRzIGFuIGVzY2FwZWQgY2hhcmFjdGVyLlxuICAgICAgaWQgPSAoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpID09PSAweDVDKSA/IGdldEVzY2FwZWRJZGVudGlmaWVyKCkgOiBnZXRJZGVudGlmaWVyKCk7XG5cbiAgICAgIC8vIFRoZXJlIGlzIG5vIGtleXdvcmQgb3IgbGl0ZXJhbCB3aXRoIG9ubHkgb25lIGNoYXJhY3Rlci5cbiAgICAgIC8vIFRodXMsIGl0IG11c3QgYmUgYW4gaWRlbnRpZmllci5cbiAgICAgIGlmIChpZC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICB0eXBlID0gVG9rZW4uSWRlbnRpZmllcjtcbiAgICAgIH0gZWxzZSBpZiAoaXNLZXl3b3JkKGlkKSkge1xuICAgICAgICAgIHR5cGUgPSBUb2tlbi5LZXl3b3JkO1xuICAgICAgfSBlbHNlIGlmIChpZCA9PT0gJ251bGwnKSB7XG4gICAgICAgICAgdHlwZSA9IFRva2VuLk51bGxMaXRlcmFsO1xuICAgICAgfSBlbHNlIGlmIChpZCA9PT0gJ3RydWUnIHx8IGlkID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgdHlwZSA9IFRva2VuLkJvb2xlYW5MaXRlcmFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0eXBlID0gVG9rZW4uSWRlbnRpZmllcjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgIHZhbHVlOiBpZCxcbiAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICB9O1xuICB9XG5cbiAgLy8gNy43IFB1bmN0dWF0b3JzXG5cbiAgZnVuY3Rpb24gc2NhblB1bmN0dWF0b3IoKSB7XG4gICAgICB2YXIgc3RhcnQgPSBpbmRleCxcbiAgICAgICAgICBjb2RlID0gc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpLFxuICAgICAgICAgIGNvZGUyLFxuICAgICAgICAgIGNoMSA9IHNvdXJjZVtpbmRleF0sXG4gICAgICAgICAgY2gyLFxuICAgICAgICAgIGNoMyxcbiAgICAgICAgICBjaDQ7XG5cbiAgICAgIHN3aXRjaCAoY29kZSkge1xuXG4gICAgICAvLyBDaGVjayBmb3IgbW9zdCBjb21tb24gc2luZ2xlLWNoYXJhY3RlciBwdW5jdHVhdG9ycy5cbiAgICAgIGNhc2UgMHgyRTogIC8vIC4gZG90XG4gICAgICBjYXNlIDB4Mjg6ICAvLyAoIG9wZW4gYnJhY2tldFxuICAgICAgY2FzZSAweDI5OiAgLy8gKSBjbG9zZSBicmFja2V0XG4gICAgICBjYXNlIDB4M0I6ICAvLyA7IHNlbWljb2xvblxuICAgICAgY2FzZSAweDJDOiAgLy8gLCBjb21tYVxuICAgICAgY2FzZSAweDdCOiAgLy8geyBvcGVuIGN1cmx5IGJyYWNlXG4gICAgICBjYXNlIDB4N0Q6ICAvLyB9IGNsb3NlIGN1cmx5IGJyYWNlXG4gICAgICBjYXNlIDB4NUI6ICAvLyBbXG4gICAgICBjYXNlIDB4NUQ6ICAvLyBdXG4gICAgICBjYXNlIDB4M0E6ICAvLyA6XG4gICAgICBjYXNlIDB4M0Y6ICAvLyA/XG4gICAgICBjYXNlIDB4N0U6ICAvLyB+XG4gICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICBpZiAoZXh0cmEudG9rZW5pemUpIHtcbiAgICAgICAgICAgICAgaWYgKGNvZGUgPT09IDB4MjgpIHtcbiAgICAgICAgICAgICAgICAgIGV4dHJhLm9wZW5QYXJlblRva2VuID0gZXh0cmEudG9rZW5zLmxlbmd0aDtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb2RlID09PSAweDdCKSB7XG4gICAgICAgICAgICAgICAgICBleHRyYS5vcGVuQ3VybHlUb2tlbiA9IGV4dHJhLnRva2Vucy5sZW5ndGg7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgdmFsdWU6IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSksXG4gICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgICAgICB9O1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICAgIGNvZGUyID0gc291cmNlLmNoYXJDb2RlQXQoaW5kZXggKyAxKTtcblxuICAgICAgICAgIC8vICc9JyAoVSswMDNEKSBtYXJrcyBhbiBhc3NpZ25tZW50IG9yIGNvbXBhcmlzb24gb3BlcmF0b3IuXG4gICAgICAgICAgaWYgKGNvZGUyID09PSAweDNEKSB7XG4gICAgICAgICAgICAgIHN3aXRjaCAoY29kZSkge1xuICAgICAgICAgICAgICBjYXNlIDB4MkI6ICAvLyArXG4gICAgICAgICAgICAgIGNhc2UgMHgyRDogIC8vIC1cbiAgICAgICAgICAgICAgY2FzZSAweDJGOiAgLy8gL1xuICAgICAgICAgICAgICBjYXNlIDB4M0M6ICAvLyA8XG4gICAgICAgICAgICAgIGNhc2UgMHgzRTogIC8vID5cbiAgICAgICAgICAgICAgY2FzZSAweDVFOiAgLy8gXlxuICAgICAgICAgICAgICBjYXNlIDB4N0M6ICAvLyB8XG4gICAgICAgICAgICAgIGNhc2UgMHgyNTogIC8vICVcbiAgICAgICAgICAgICAgY2FzZSAweDI2OiAgLy8gJlxuICAgICAgICAgICAgICBjYXNlIDB4MkE6ICAvLyAqXG4gICAgICAgICAgICAgICAgICBpbmRleCArPSAyO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpICsgU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlMiksXG4gICAgICAgICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICBjYXNlIDB4MjE6IC8vICFcbiAgICAgICAgICAgICAgY2FzZSAweDNEOiAvLyA9XG4gICAgICAgICAgICAgICAgICBpbmRleCArPSAyO1xuXG4gICAgICAgICAgICAgICAgICAvLyAhPT0gYW5kID09PVxuICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSA9PT0gMHgzRCkge1xuICAgICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLlB1bmN0dWF0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHNvdXJjZS5zbGljZShzdGFydCwgaW5kZXgpLFxuICAgICAgICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIDQtY2hhcmFjdGVyIHB1bmN0dWF0b3I6ID4+Pj1cblxuICAgICAgY2g0ID0gc291cmNlLnN1YnN0cihpbmRleCwgNCk7XG5cbiAgICAgIGlmIChjaDQgPT09ICc+Pj49Jykge1xuICAgICAgICAgIGluZGV4ICs9IDQ7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgdmFsdWU6IGNoNCxcbiAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIDMtY2hhcmFjdGVyIHB1bmN0dWF0b3JzOiA9PT0gIT09ID4+PiA8PD0gPj49XG5cbiAgICAgIGNoMyA9IGNoNC5zdWJzdHIoMCwgMyk7XG5cbiAgICAgIGlmIChjaDMgPT09ICc+Pj4nIHx8IGNoMyA9PT0gJzw8PScgfHwgY2gzID09PSAnPj49Jykge1xuICAgICAgICAgIGluZGV4ICs9IDM7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgdmFsdWU6IGNoMyxcbiAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIE90aGVyIDItY2hhcmFjdGVyIHB1bmN0dWF0b3JzOiArKyAtLSA8PCA+PiAmJiB8fFxuICAgICAgY2gyID0gY2gzLnN1YnN0cigwLCAyKTtcblxuICAgICAgaWYgKChjaDEgPT09IGNoMlsxXSAmJiAoJystPD4mfCcuaW5kZXhPZihjaDEpID49IDApKSB8fCBjaDIgPT09ICc9PicpIHtcbiAgICAgICAgICBpbmRleCArPSAyO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHR5cGU6IFRva2VuLlB1bmN0dWF0b3IsXG4gICAgICAgICAgICAgIHZhbHVlOiBjaDIsXG4gICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyAxLWNoYXJhY3RlciBwdW5jdHVhdG9yczogPCA+ID0gISArIC0gKiAlICYgfCBeIC9cblxuICAgICAgaWYgKCc8Pj0hKy0qJSZ8Xi8nLmluZGV4T2YoY2gxKSA+PSAwKSB7XG4gICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICB2YWx1ZTogY2gxLFxuICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICB9XG5cbiAgLy8gNy44LjMgTnVtZXJpYyBMaXRlcmFsc1xuXG4gIGZ1bmN0aW9uIHNjYW5IZXhMaXRlcmFsKHN0YXJ0KSB7XG4gICAgICB2YXIgbnVtYmVyID0gJyc7XG5cbiAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGlmICghaXNIZXhEaWdpdChzb3VyY2VbaW5kZXhdKSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgIH1cblxuICAgICAgaWYgKG51bWJlci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkpKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6IFRva2VuLk51bWVyaWNMaXRlcmFsLFxuICAgICAgICAgIHZhbHVlOiBwYXJzZUludCgnMHgnICsgbnVtYmVyLCAxNiksXG4gICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNjYW5PY3RhbExpdGVyYWwoc3RhcnQpIHtcbiAgICAgIHZhciBudW1iZXIgPSAnMCcgKyBzb3VyY2VbaW5kZXgrK107XG4gICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBpZiAoIWlzT2N0YWxEaWdpdChzb3VyY2VbaW5kZXhdKSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSkgfHwgaXNEZWNpbWFsRGlnaXQoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpKSkge1xuICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiBUb2tlbi5OdW1lcmljTGl0ZXJhbCxcbiAgICAgICAgICB2YWx1ZTogcGFyc2VJbnQobnVtYmVyLCA4KSxcbiAgICAgICAgICBvY3RhbDogdHJ1ZSxcbiAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gc2Nhbk51bWVyaWNMaXRlcmFsKCkge1xuICAgICAgdmFyIG51bWJlciwgc3RhcnQsIGNoO1xuXG4gICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICBhc3NlcnQoaXNEZWNpbWFsRGlnaXQoY2guY2hhckNvZGVBdCgwKSkgfHwgKGNoID09PSAnLicpLFxuICAgICAgICAgICdOdW1lcmljIGxpdGVyYWwgbXVzdCBzdGFydCB3aXRoIGEgZGVjaW1hbCBkaWdpdCBvciBhIGRlY2ltYWwgcG9pbnQnKTtcblxuICAgICAgc3RhcnQgPSBpbmRleDtcbiAgICAgIG51bWJlciA9ICcnO1xuICAgICAgaWYgKGNoICE9PSAnLicpIHtcbiAgICAgICAgICBudW1iZXIgPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuXG4gICAgICAgICAgLy8gSGV4IG51bWJlciBzdGFydHMgd2l0aCAnMHgnLlxuICAgICAgICAgIC8vIE9jdGFsIG51bWJlciBzdGFydHMgd2l0aCAnMCcuXG4gICAgICAgICAgaWYgKG51bWJlciA9PT0gJzAnKSB7XG4gICAgICAgICAgICAgIGlmIChjaCA9PT0gJ3gnIHx8IGNoID09PSAnWCcpIHtcbiAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gc2NhbkhleExpdGVyYWwoc3RhcnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpc09jdGFsRGlnaXQoY2gpKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gc2Nhbk9jdGFsTGl0ZXJhbChzdGFydCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBkZWNpbWFsIG51bWJlciBzdGFydHMgd2l0aCAnMCcgc3VjaCBhcyAnMDknIGlzIGlsbGVnYWwuXG4gICAgICAgICAgICAgIGlmIChjaCAmJiBpc0RlY2ltYWxEaWdpdChjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgd2hpbGUgKGlzRGVjaW1hbERpZ2l0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSkpIHtcbiAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2ggPT09ICcuJykge1xuICAgICAgICAgIG51bWJlciArPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgd2hpbGUgKGlzRGVjaW1hbERpZ2l0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSkpIHtcbiAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2ggPT09ICdlJyB8fCBjaCA9PT0gJ0UnKSB7XG4gICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcblxuICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgICBpZiAoY2ggPT09ICcrJyB8fCBjaCA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgIG51bWJlciArPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpc0RlY2ltYWxEaWdpdChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkpKSB7XG4gICAgICAgICAgICAgIHdoaWxlIChpc0RlY2ltYWxEaWdpdChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkpKSB7XG4gICAgICAgICAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSkpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogVG9rZW4uTnVtZXJpY0xpdGVyYWwsXG4gICAgICAgICAgdmFsdWU6IHBhcnNlRmxvYXQobnVtYmVyKSxcbiAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICB9O1xuICB9XG5cbiAgLy8gNy44LjQgU3RyaW5nIExpdGVyYWxzXG5cbiAgZnVuY3Rpb24gc2NhblN0cmluZ0xpdGVyYWwoKSB7XG4gICAgICB2YXIgc3RyID0gJycsIHF1b3RlLCBzdGFydCwgY2gsIGNvZGUsIHVuZXNjYXBlZCwgcmVzdG9yZSwgb2N0YWwgPSBmYWxzZSwgc3RhcnRMaW5lTnVtYmVyLCBzdGFydExpbmVTdGFydDtcbiAgICAgIHN0YXJ0TGluZU51bWJlciA9IGxpbmVOdW1iZXI7XG4gICAgICBzdGFydExpbmVTdGFydCA9IGxpbmVTdGFydDtcblxuICAgICAgcXVvdGUgPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgYXNzZXJ0KChxdW90ZSA9PT0gJ1xcJycgfHwgcXVvdGUgPT09ICdcIicpLFxuICAgICAgICAgICdTdHJpbmcgbGl0ZXJhbCBtdXN0IHN0YXJ0cyB3aXRoIGEgcXVvdGUnKTtcblxuICAgICAgc3RhcnQgPSBpbmRleDtcbiAgICAgICsraW5kZXg7XG5cbiAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGNoID0gc291cmNlW2luZGV4KytdO1xuXG4gICAgICAgICAgaWYgKGNoID09PSBxdW90ZSkge1xuICAgICAgICAgICAgICBxdW90ZSA9ICcnO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnXFxcXCcpIHtcbiAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICAgIGlmICghY2ggfHwgIWlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY2gpIHtcbiAgICAgICAgICAgICAgICAgIGNhc2UgJ3UnOlxuICAgICAgICAgICAgICAgICAgY2FzZSAneCc6XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZVtpbmRleF0gPT09ICd7Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gc2NhblVuaWNvZGVDb2RlUG9pbnRFc2NhcGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXN0b3JlID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHVuZXNjYXBlZCA9IHNjYW5IZXhFc2NhcGUoY2gpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodW5lc2NhcGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gdW5lc2NhcGVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSByZXN0b3JlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgY2FzZSAnbic6XG4gICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgY2FzZSAncic6XG4gICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXHInO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgY2FzZSAndCc6XG4gICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXHQnO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgY2FzZSAnYic6XG4gICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXGInO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgY2FzZSAnZic6XG4gICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXGYnO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgY2FzZSAndic6XG4gICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXHgwQic7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGlzT2N0YWxEaWdpdChjaCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9ICcwMTIzNDU2NycuaW5kZXhPZihjaCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gXFwwIGlzIG5vdCBvY3RhbCBlc2NhcGUgc2VxdWVuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvZGUgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9jdGFsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA8IGxlbmd0aCAmJiBpc09jdGFsRGlnaXQoc291cmNlW2luZGV4XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9jdGFsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUgPSBjb2RlICogOCArICcwMTIzNDU2NycuaW5kZXhPZihzb3VyY2VbaW5kZXgrK10pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAzIGRpZ2l0cyBhcmUgb25seSBhbGxvd2VkIHdoZW4gc3RyaW5nIHN0YXJ0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2l0aCAwLCAxLCAyLCAzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJzAxMjMnLmluZGV4T2YoY2gpID49IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPCBsZW5ndGggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNPY3RhbERpZ2l0KHNvdXJjZVtpbmRleF0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUgKiA4ICsgJzAxMjM0NTY3Jy5pbmRleE9mKHNvdXJjZVtpbmRleCsrXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICsrbGluZU51bWJlcjtcbiAgICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gICdcXHInICYmIHNvdXJjZVtpbmRleF0gPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGxpbmVTdGFydCA9IGluZGV4O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChxdW90ZSAhPT0gJycpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogVG9rZW4uU3RyaW5nTGl0ZXJhbCxcbiAgICAgICAgICB2YWx1ZTogc3RyLFxuICAgICAgICAgIG9jdGFsOiBvY3RhbCxcbiAgICAgICAgICBzdGFydExpbmVOdW1iZXI6IHN0YXJ0TGluZU51bWJlcixcbiAgICAgICAgICBzdGFydExpbmVTdGFydDogc3RhcnRMaW5lU3RhcnQsXG4gICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRlc3RSZWdFeHAocGF0dGVybiwgZmxhZ3MpIHtcbiAgICAgIHZhciB0bXAgPSBwYXR0ZXJuLFxuICAgICAgICAgIHZhbHVlO1xuXG4gICAgICBpZiAoZmxhZ3MuaW5kZXhPZigndScpID49IDApIHtcbiAgICAgICAgICAvLyBSZXBsYWNlIGVhY2ggYXN0cmFsIHN5bWJvbCBhbmQgZXZlcnkgVW5pY29kZSBjb2RlIHBvaW50XG4gICAgICAgICAgLy8gZXNjYXBlIHNlcXVlbmNlIHdpdGggYSBzaW5nbGUgQVNDSUkgc3ltYm9sIHRvIGF2b2lkIHRocm93aW5nIG9uXG4gICAgICAgICAgLy8gcmVndWxhciBleHByZXNzaW9ucyB0aGF0IGFyZSBvbmx5IHZhbGlkIGluIGNvbWJpbmF0aW9uIHdpdGggdGhlXG4gICAgICAgICAgLy8gYC91YCBmbGFnLlxuICAgICAgICAgIC8vIE5vdGU6IHJlcGxhY2luZyB3aXRoIHRoZSBBU0NJSSBzeW1ib2wgYHhgIG1pZ2h0IGNhdXNlIGZhbHNlXG4gICAgICAgICAgLy8gbmVnYXRpdmVzIGluIHVubGlrZWx5IHNjZW5hcmlvcy4gRm9yIGV4YW1wbGUsIGBbXFx1ezYxfS1iXWAgaXMgYVxuICAgICAgICAgIC8vIHBlcmZlY3RseSB2YWxpZCBwYXR0ZXJuIHRoYXQgaXMgZXF1aXZhbGVudCB0byBgW2EtYl1gLCBidXQgaXRcbiAgICAgICAgICAvLyB3b3VsZCBiZSByZXBsYWNlZCBieSBgW3gtYl1gIHdoaWNoIHRocm93cyBhbiBlcnJvci5cbiAgICAgICAgICB0bXAgPSB0bXBcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFx1XFx7KFswLTlhLWZBLUZdKylcXH0vZywgZnVuY3Rpb24gKCQwLCAkMSkge1xuICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlSW50KCQxLCAxNikgPD0gMHgxMEZGRkYpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3gnO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuSW52YWxpZFJlZ0V4cCk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9bXFx1RDgwMC1cXHVEQkZGXVtcXHVEQzAwLVxcdURGRkZdL2csICd4Jyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEZpcnN0LCBkZXRlY3QgaW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb25zLlxuICAgICAgdHJ5IHtcbiAgICAgICAgICB2YWx1ZSA9IG5ldyBSZWdFeHAodG1wKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5JbnZhbGlkUmVnRXhwKTtcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJuIGEgcmVndWxhciBleHByZXNzaW9uIG9iamVjdCBmb3IgdGhpcyBwYXR0ZXJuLWZsYWcgcGFpciwgb3JcbiAgICAgIC8vIGBudWxsYCBpbiBjYXNlIHRoZSBjdXJyZW50IGVudmlyb25tZW50IGRvZXNuJ3Qgc3VwcG9ydCB0aGUgZmxhZ3MgaXRcbiAgICAgIC8vIHVzZXMuXG4gICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHBhdHRlcm4sIGZsYWdzKTtcbiAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2NhblJlZ0V4cEJvZHkoKSB7XG4gICAgICB2YXIgY2gsIHN0ciwgY2xhc3NNYXJrZXIsIHRlcm1pbmF0ZWQsIGJvZHk7XG5cbiAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgIGFzc2VydChjaCA9PT0gJy8nLCAnUmVndWxhciBleHByZXNzaW9uIGxpdGVyYWwgbXVzdCBzdGFydCB3aXRoIGEgc2xhc2gnKTtcbiAgICAgIHN0ciA9IHNvdXJjZVtpbmRleCsrXTtcblxuICAgICAgY2xhc3NNYXJrZXIgPSBmYWxzZTtcbiAgICAgIHRlcm1pbmF0ZWQgPSBmYWxzZTtcbiAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGNoID0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICBpZiAoY2ggPT09ICdcXFxcJykge1xuICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgLy8gRUNNQS0yNjIgNy44LjVcbiAgICAgICAgICAgICAgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVudGVybWluYXRlZFJlZ0V4cCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbnRlcm1pbmF0ZWRSZWdFeHApO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NNYXJrZXIpIHtcbiAgICAgICAgICAgICAgaWYgKGNoID09PSAnXScpIHtcbiAgICAgICAgICAgICAgICAgIGNsYXNzTWFya2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoY2ggPT09ICcvJykge1xuICAgICAgICAgICAgICAgICAgdGVybWluYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ1snKSB7XG4gICAgICAgICAgICAgICAgICBjbGFzc01hcmtlciA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghdGVybWluYXRlZCkge1xuICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVudGVybWluYXRlZFJlZ0V4cCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEV4Y2x1ZGUgbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2guXG4gICAgICBib2R5ID0gc3RyLnN1YnN0cigxLCBzdHIubGVuZ3RoIC0gMik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAgIHZhbHVlOiBib2R5LFxuICAgICAgICAgIGxpdGVyYWw6IHN0clxuICAgICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNjYW5SZWdFeHBGbGFncygpIHtcbiAgICAgIHZhciBjaCwgc3RyLCBmbGFncywgcmVzdG9yZTtcblxuICAgICAgc3RyID0gJyc7XG4gICAgICBmbGFncyA9ICcnO1xuICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICAgIGlmICghaXNJZGVudGlmaWVyUGFydChjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgIGlmIChjaCA9PT0gJ1xcXFwnICYmIGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgICAgICAgICAgaWYgKGNoID09PSAndScpIHtcbiAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICByZXN0b3JlID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICBjaCA9IHNjYW5IZXhFc2NhcGUoJ3UnKTtcbiAgICAgICAgICAgICAgICAgIGlmIChjaCkge1xuICAgICAgICAgICAgICAgICAgICAgIGZsYWdzICs9IGNoO1xuICAgICAgICAgICAgICAgICAgICAgIGZvciAoc3RyICs9ICdcXFxcdSc7IHJlc3RvcmUgPCBpbmRleDsgKytyZXN0b3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSBzb3VyY2VbcmVzdG9yZV07XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IHJlc3RvcmU7XG4gICAgICAgICAgICAgICAgICAgICAgZmxhZ3MgKz0gJ3UnO1xuICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSAnXFxcXHUnO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcXFwnO1xuICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmbGFncyArPSBjaDtcbiAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB2YWx1ZTogZmxhZ3MsXG4gICAgICAgICAgbGl0ZXJhbDogc3RyXG4gICAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gc2NhblJlZ0V4cCgpIHtcbiAgICAgIHZhciBzdGFydCwgYm9keSwgZmxhZ3MsIHZhbHVlO1xuXG4gICAgICBsb29rYWhlYWQgPSBudWxsO1xuICAgICAgc2tpcENvbW1lbnQoKTtcbiAgICAgIHN0YXJ0ID0gaW5kZXg7XG5cbiAgICAgIGJvZHkgPSBzY2FuUmVnRXhwQm9keSgpO1xuICAgICAgZmxhZ3MgPSBzY2FuUmVnRXhwRmxhZ3MoKTtcbiAgICAgIHZhbHVlID0gdGVzdFJlZ0V4cChib2R5LnZhbHVlLCBmbGFncy52YWx1ZSk7XG5cbiAgICAgIGlmIChleHRyYS50b2tlbml6ZSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHR5cGU6IFRva2VuLlJlZ3VsYXJFeHByZXNzaW9uLFxuICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAgIHJlZ2V4OiB7XG4gICAgICAgICAgICAgICAgICBwYXR0ZXJuOiBib2R5LnZhbHVlLFxuICAgICAgICAgICAgICAgICAgZmxhZ3M6IGZsYWdzLnZhbHVlXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICAgIGxpdGVyYWw6IGJvZHkubGl0ZXJhbCArIGZsYWdzLmxpdGVyYWwsXG4gICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgIHJlZ2V4OiB7XG4gICAgICAgICAgICAgIHBhdHRlcm46IGJvZHkudmFsdWUsXG4gICAgICAgICAgICAgIGZsYWdzOiBmbGFncy52YWx1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBjb2xsZWN0UmVnZXgoKSB7XG4gICAgICB2YXIgcG9zLCBsb2MsIHJlZ2V4LCB0b2tlbjtcblxuICAgICAgc2tpcENvbW1lbnQoKTtcblxuICAgICAgcG9zID0gaW5kZXg7XG4gICAgICBsb2MgPSB7XG4gICAgICAgICAgc3RhcnQ6IHtcbiAgICAgICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydFxuICAgICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHJlZ2V4ID0gc2NhblJlZ0V4cCgpO1xuXG4gICAgICBsb2MuZW5kID0ge1xuICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydFxuICAgICAgfTtcblxuICAgICAgaWYgKCFleHRyYS50b2tlbml6ZSkge1xuICAgICAgICAgIC8vIFBvcCB0aGUgcHJldmlvdXMgdG9rZW4sIHdoaWNoIGlzIGxpa2VseSAnLycgb3IgJy89J1xuICAgICAgICAgIGlmIChleHRyYS50b2tlbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICB0b2tlbiA9IGV4dHJhLnRva2Vuc1tleHRyYS50b2tlbnMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgIGlmICh0b2tlbi5yYW5nZVswXSA9PT0gcG9zICYmIHRva2VuLnR5cGUgPT09ICdQdW5jdHVhdG9yJykge1xuICAgICAgICAgICAgICAgICAgaWYgKHRva2VuLnZhbHVlID09PSAnLycgfHwgdG9rZW4udmFsdWUgPT09ICcvPScpIHtcbiAgICAgICAgICAgICAgICAgICAgICBleHRyYS50b2tlbnMucG9wKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBleHRyYS50b2tlbnMucHVzaCh7XG4gICAgICAgICAgICAgIHR5cGU6ICdSZWd1bGFyRXhwcmVzc2lvbicsXG4gICAgICAgICAgICAgIHZhbHVlOiByZWdleC5saXRlcmFsLFxuICAgICAgICAgICAgICByZWdleDogcmVnZXgucmVnZXgsXG4gICAgICAgICAgICAgIHJhbmdlOiBbcG9zLCBpbmRleF0sXG4gICAgICAgICAgICAgIGxvYzogbG9jXG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZWdleDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzSWRlbnRpZmllck5hbWUodG9rZW4pIHtcbiAgICAgIHJldHVybiB0b2tlbi50eXBlID09PSBUb2tlbi5JZGVudGlmaWVyIHx8XG4gICAgICAgICAgdG9rZW4udHlwZSA9PT0gVG9rZW4uS2V5d29yZCB8fFxuICAgICAgICAgIHRva2VuLnR5cGUgPT09IFRva2VuLkJvb2xlYW5MaXRlcmFsIHx8XG4gICAgICAgICAgdG9rZW4udHlwZSA9PT0gVG9rZW4uTnVsbExpdGVyYWw7XG4gIH1cblxuICBmdW5jdGlvbiBhZHZhbmNlU2xhc2goKSB7XG4gICAgICB2YXIgcHJldlRva2VuLFxuICAgICAgICAgIGNoZWNrVG9rZW47XG4gICAgICAvLyBVc2luZyB0aGUgZm9sbG93aW5nIGFsZ29yaXRobTpcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhL3N3ZWV0LmpzL3dpa2kvZGVzaWduXG4gICAgICBwcmV2VG9rZW4gPSBleHRyYS50b2tlbnNbZXh0cmEudG9rZW5zLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKCFwcmV2VG9rZW4pIHtcbiAgICAgICAgICAvLyBOb3RoaW5nIGJlZm9yZSB0aGF0OiBpdCBjYW5ub3QgYmUgYSBkaXZpc2lvbi5cbiAgICAgICAgICByZXR1cm4gY29sbGVjdFJlZ2V4KCk7XG4gICAgICB9XG4gICAgICBpZiAocHJldlRva2VuLnR5cGUgPT09ICdQdW5jdHVhdG9yJykge1xuICAgICAgICAgIGlmIChwcmV2VG9rZW4udmFsdWUgPT09ICddJykge1xuICAgICAgICAgICAgICByZXR1cm4gc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHByZXZUb2tlbi52YWx1ZSA9PT0gJyknKSB7XG4gICAgICAgICAgICAgIGNoZWNrVG9rZW4gPSBleHRyYS50b2tlbnNbZXh0cmEub3BlblBhcmVuVG9rZW4gLSAxXTtcbiAgICAgICAgICAgICAgaWYgKGNoZWNrVG9rZW4gJiZcbiAgICAgICAgICAgICAgICAgICAgICBjaGVja1Rva2VuLnR5cGUgPT09ICdLZXl3b3JkJyAmJlxuICAgICAgICAgICAgICAgICAgICAgIChjaGVja1Rva2VuLnZhbHVlID09PSAnaWYnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIGNoZWNrVG9rZW4udmFsdWUgPT09ICd3aGlsZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tUb2tlbi52YWx1ZSA9PT0gJ2ZvcicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tUb2tlbi52YWx1ZSA9PT0gJ3dpdGgnKSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3RSZWdleCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBzY2FuUHVuY3R1YXRvcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocHJldlRva2VuLnZhbHVlID09PSAnfScpIHtcbiAgICAgICAgICAgICAgLy8gRGl2aWRpbmcgYSBmdW5jdGlvbiBieSBhbnl0aGluZyBtYWtlcyBsaXR0bGUgc2Vuc2UsXG4gICAgICAgICAgICAgIC8vIGJ1dCB3ZSBoYXZlIHRvIGNoZWNrIGZvciB0aGF0LlxuICAgICAgICAgICAgICBpZiAoZXh0cmEudG9rZW5zW2V4dHJhLm9wZW5DdXJseVRva2VuIC0gM10gJiZcbiAgICAgICAgICAgICAgICAgICAgICBleHRyYS50b2tlbnNbZXh0cmEub3BlbkN1cmx5VG9rZW4gLSAzXS50eXBlID09PSAnS2V5d29yZCcpIHtcbiAgICAgICAgICAgICAgICAgIC8vIEFub255bW91cyBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgIGNoZWNrVG9rZW4gPSBleHRyYS50b2tlbnNbZXh0cmEub3BlbkN1cmx5VG9rZW4gLSA0XTtcbiAgICAgICAgICAgICAgICAgIGlmICghY2hlY2tUb2tlbikge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzY2FuUHVuY3R1YXRvcigpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV4dHJhLnRva2Vuc1tleHRyYS5vcGVuQ3VybHlUb2tlbiAtIDRdICYmXG4gICAgICAgICAgICAgICAgICAgICAgZXh0cmEudG9rZW5zW2V4dHJhLm9wZW5DdXJseVRva2VuIC0gNF0udHlwZSA9PT0gJ0tleXdvcmQnKSB7XG4gICAgICAgICAgICAgICAgICAvLyBOYW1lZCBmdW5jdGlvbi5cbiAgICAgICAgICAgICAgICAgIGNoZWNrVG9rZW4gPSBleHRyYS50b2tlbnNbZXh0cmEub3BlbkN1cmx5VG9rZW4gLSA1XTtcbiAgICAgICAgICAgICAgICAgIGlmICghY2hlY2tUb2tlbikge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xsZWN0UmVnZXgoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBzY2FuUHVuY3R1YXRvcigpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBzY2FuUHVuY3R1YXRvcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY29sbGVjdFJlZ2V4KCk7XG4gICAgICB9XG4gICAgICBpZiAocHJldlRva2VuLnR5cGUgPT09ICdLZXl3b3JkJyAmJiBwcmV2VG9rZW4udmFsdWUgIT09ICd0aGlzJykge1xuICAgICAgICAgIHJldHVybiBjb2xsZWN0UmVnZXgoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzY2FuUHVuY3R1YXRvcigpO1xuICB9XG5cbiAgZnVuY3Rpb24gYWR2YW5jZSgpIHtcbiAgICAgIHZhciBjaDtcblxuICAgICAgc2tpcENvbW1lbnQoKTtcblxuICAgICAgaWYgKGluZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHR5cGU6IFRva2VuLkVPRixcbiAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgIHN0YXJ0OiBpbmRleCxcbiAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGNoID0gc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpO1xuXG4gICAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoY2gpKSB7XG4gICAgICAgICAgcmV0dXJuIHNjYW5JZGVudGlmaWVyKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFZlcnkgY29tbW9uOiAoIGFuZCApIGFuZCA7XG4gICAgICBpZiAoY2ggPT09IDB4MjggfHwgY2ggPT09IDB4MjkgfHwgY2ggPT09IDB4M0IpIHtcbiAgICAgICAgICByZXR1cm4gc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RyaW5nIGxpdGVyYWwgc3RhcnRzIHdpdGggc2luZ2xlIHF1b3RlIChVKzAwMjcpIG9yIGRvdWJsZSBxdW90ZSAoVSswMDIyKS5cbiAgICAgIGlmIChjaCA9PT0gMHgyNyB8fCBjaCA9PT0gMHgyMikge1xuICAgICAgICAgIHJldHVybiBzY2FuU3RyaW5nTGl0ZXJhbCgpO1xuICAgICAgfVxuXG5cbiAgICAgIC8vIERvdCAoLikgVSswMDJFIGNhbiBhbHNvIHN0YXJ0IGEgZmxvYXRpbmctcG9pbnQgbnVtYmVyLCBoZW5jZSB0aGUgbmVlZFxuICAgICAgLy8gdG8gY2hlY2sgdGhlIG5leHQgY2hhcmFjdGVyLlxuICAgICAgaWYgKGNoID09PSAweDJFKSB7XG4gICAgICAgICAgaWYgKGlzRGVjaW1hbERpZ2l0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4ICsgMSkpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzY2FuTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHNjYW5QdW5jdHVhdG9yKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc0RlY2ltYWxEaWdpdChjaCkpIHtcbiAgICAgICAgICByZXR1cm4gc2Nhbk51bWVyaWNMaXRlcmFsKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNsYXNoICgvKSBVKzAwMkYgY2FuIGFsc28gc3RhcnQgYSByZWdleC5cbiAgICAgIGlmIChleHRyYS50b2tlbml6ZSAmJiBjaCA9PT0gMHgyRikge1xuICAgICAgICAgIHJldHVybiBhZHZhbmNlU2xhc2goKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNjYW5QdW5jdHVhdG9yKCk7XG4gIH1cblxuICBmdW5jdGlvbiBjb2xsZWN0VG9rZW4oKSB7XG4gICAgICB2YXIgbG9jLCB0b2tlbiwgdmFsdWUsIGVudHJ5O1xuXG4gICAgICBza2lwQ29tbWVudCgpO1xuICAgICAgbG9jID0ge1xuICAgICAgICAgIHN0YXJ0OiB7XG4gICAgICAgICAgICAgIGxpbmU6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnRcbiAgICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB0b2tlbiA9IGFkdmFuY2UoKTtcbiAgICAgIGxvYy5lbmQgPSB7XG4gICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICBjb2x1bW46IGluZGV4IC0gbGluZVN0YXJ0XG4gICAgICB9O1xuXG4gICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uRU9GKSB7XG4gICAgICAgICAgdmFsdWUgPSBzb3VyY2Uuc2xpY2UodG9rZW4uc3RhcnQsIHRva2VuLmVuZCk7XG4gICAgICAgICAgZW50cnkgPSB7XG4gICAgICAgICAgICAgIHR5cGU6IFRva2VuTmFtZVt0b2tlbi50eXBlXSxcbiAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgICByYW5nZTogW3Rva2VuLnN0YXJ0LCB0b2tlbi5lbmRdLFxuICAgICAgICAgICAgICBsb2M6IGxvY1xuICAgICAgICAgIH07XG4gICAgICAgICAgaWYgKHRva2VuLnJlZ2V4KSB7XG4gICAgICAgICAgICAgIGVudHJ5LnJlZ2V4ID0ge1xuICAgICAgICAgICAgICAgICAgcGF0dGVybjogdG9rZW4ucmVnZXgucGF0dGVybixcbiAgICAgICAgICAgICAgICAgIGZsYWdzOiB0b2tlbi5yZWdleC5mbGFnc1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBleHRyYS50b2tlbnMucHVzaChlbnRyeSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0b2tlbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxleCgpIHtcbiAgICAgIHZhciB0b2tlbjtcblxuICAgICAgdG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICBpbmRleCA9IHRva2VuLmVuZDtcbiAgICAgIGxpbmVOdW1iZXIgPSB0b2tlbi5saW5lTnVtYmVyO1xuICAgICAgbGluZVN0YXJ0ID0gdG9rZW4ubGluZVN0YXJ0O1xuXG4gICAgICBsb29rYWhlYWQgPSAodHlwZW9mIGV4dHJhLnRva2VucyAhPT0gJ3VuZGVmaW5lZCcpID8gY29sbGVjdFRva2VuKCkgOiBhZHZhbmNlKCk7XG5cbiAgICAgIGluZGV4ID0gdG9rZW4uZW5kO1xuICAgICAgbGluZU51bWJlciA9IHRva2VuLmxpbmVOdW1iZXI7XG4gICAgICBsaW5lU3RhcnQgPSB0b2tlbi5saW5lU3RhcnQ7XG5cbiAgICAgIHJldHVybiB0b2tlbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZWsoKSB7XG4gICAgICB2YXIgcG9zLCBsaW5lLCBzdGFydDtcblxuICAgICAgcG9zID0gaW5kZXg7XG4gICAgICBsaW5lID0gbGluZU51bWJlcjtcbiAgICAgIHN0YXJ0ID0gbGluZVN0YXJ0O1xuICAgICAgbG9va2FoZWFkID0gKHR5cGVvZiBleHRyYS50b2tlbnMgIT09ICd1bmRlZmluZWQnKSA/IGNvbGxlY3RUb2tlbigpIDogYWR2YW5jZSgpO1xuICAgICAgaW5kZXggPSBwb3M7XG4gICAgICBsaW5lTnVtYmVyID0gbGluZTtcbiAgICAgIGxpbmVTdGFydCA9IHN0YXJ0O1xuICB9XG5cbiAgZnVuY3Rpb24gUG9zaXRpb24oKSB7XG4gICAgICB0aGlzLmxpbmUgPSBsaW5lTnVtYmVyO1xuICAgICAgdGhpcy5jb2x1bW4gPSBpbmRleCAtIGxpbmVTdGFydDtcbiAgfVxuXG4gIGZ1bmN0aW9uIFNvdXJjZUxvY2F0aW9uKCkge1xuICAgICAgdGhpcy5zdGFydCA9IG5ldyBQb3NpdGlvbigpO1xuICAgICAgdGhpcy5lbmQgPSBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gV3JhcHBpbmdTb3VyY2VMb2NhdGlvbihzdGFydFRva2VuKSB7XG4gICAgICBpZiAoc3RhcnRUb2tlbi50eXBlID09PSBUb2tlbi5TdHJpbmdMaXRlcmFsKSB7XG4gICAgICAgICAgdGhpcy5zdGFydCA9IHtcbiAgICAgICAgICAgICAgbGluZTogc3RhcnRUb2tlbi5zdGFydExpbmVOdW1iZXIsXG4gICAgICAgICAgICAgIGNvbHVtbjogc3RhcnRUb2tlbi5zdGFydCAtIHN0YXJ0VG9rZW4uc3RhcnRMaW5lU3RhcnRcbiAgICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnN0YXJ0ID0ge1xuICAgICAgICAgICAgICBsaW5lOiBzdGFydFRva2VuLmxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgIGNvbHVtbjogc3RhcnRUb2tlbi5zdGFydCAtIHN0YXJ0VG9rZW4ubGluZVN0YXJ0XG4gICAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZW5kID0gbnVsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIE5vZGUoKSB7XG4gICAgICAvLyBTa2lwIGNvbW1lbnQuXG4gICAgICBpbmRleCA9IGxvb2thaGVhZC5zdGFydDtcbiAgICAgIGlmIChsb29rYWhlYWQudHlwZSA9PT0gVG9rZW4uU3RyaW5nTGl0ZXJhbCkge1xuICAgICAgICAgIGxpbmVOdW1iZXIgPSBsb29rYWhlYWQuc3RhcnRMaW5lTnVtYmVyO1xuICAgICAgICAgIGxpbmVTdGFydCA9IGxvb2thaGVhZC5zdGFydExpbmVTdGFydDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGluZU51bWJlciA9IGxvb2thaGVhZC5saW5lTnVtYmVyO1xuICAgICAgICAgIGxpbmVTdGFydCA9IGxvb2thaGVhZC5saW5lU3RhcnQ7XG4gICAgICB9XG4gICAgICBpZiAoZXh0cmEucmFuZ2UpIHtcbiAgICAgICAgICB0aGlzLnJhbmdlID0gW2luZGV4LCAwXTtcbiAgICAgIH1cbiAgICAgIGlmIChleHRyYS5sb2MpIHtcbiAgICAgICAgICB0aGlzLmxvYyA9IG5ldyBTb3VyY2VMb2NhdGlvbigpO1xuICAgICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gV3JhcHBpbmdOb2RlKHN0YXJ0VG9rZW4pIHtcbiAgICAgIGlmIChleHRyYS5yYW5nZSkge1xuICAgICAgICAgIHRoaXMucmFuZ2UgPSBbc3RhcnRUb2tlbi5zdGFydCwgMF07XG4gICAgICB9XG4gICAgICBpZiAoZXh0cmEubG9jKSB7XG4gICAgICAgICAgdGhpcy5sb2MgPSBuZXcgV3JhcHBpbmdTb3VyY2VMb2NhdGlvbihzdGFydFRva2VuKTtcbiAgICAgIH1cbiAgfVxuXG4gIFdyYXBwaW5nTm9kZS5wcm90b3R5cGUgPSBOb2RlLnByb3RvdHlwZSA9IHtcblxuICAgICAgZmluaXNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWYgKGV4dHJhLnJhbmdlKSB7XG4gICAgICAgICAgICAgIHRoaXMucmFuZ2VbMV0gPSBpbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGV4dHJhLmxvYykge1xuICAgICAgICAgICAgICB0aGlzLmxvYy5lbmQgPSBuZXcgUG9zaXRpb24oKTtcbiAgICAgICAgICAgICAgaWYgKGV4dHJhLnNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5sb2Muc291cmNlID0gZXh0cmEuc291cmNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgZmluaXNoQXJyYXlFeHByZXNzaW9uOiBmdW5jdGlvbiAoZWxlbWVudHMpIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBTeW50YXguQXJyYXlFeHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMuZWxlbWVudHMgPSBlbGVtZW50cztcbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcblxuICAgICAgZmluaXNoQXNzaWdubWVudEV4cHJlc3Npb246IGZ1bmN0aW9uIChvcGVyYXRvciwgbGVmdCwgcmlnaHQpIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBTeW50YXguQXNzaWdubWVudEV4cHJlc3Npb247XG4gICAgICAgICAgdGhpcy5vcGVyYXRvciA9IG9wZXJhdG9yO1xuICAgICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XG4gICAgICAgICAgdGhpcy5yaWdodCA9IHJpZ2h0O1xuICAgICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuXG4gICAgICBmaW5pc2hCaW5hcnlFeHByZXNzaW9uOiBmdW5jdGlvbiAob3BlcmF0b3IsIGxlZnQsIHJpZ2h0KSB7XG4gICAgICAgICAgdGhpcy50eXBlID0gKG9wZXJhdG9yID09PSAnfHwnIHx8IG9wZXJhdG9yID09PSAnJiYnKSA/IFN5bnRheC5Mb2dpY2FsRXhwcmVzc2lvbiA6IFN5bnRheC5CaW5hcnlFeHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMub3BlcmF0b3IgPSBvcGVyYXRvcjtcbiAgICAgICAgICB0aGlzLmxlZnQgPSBsZWZ0O1xuICAgICAgICAgIHRoaXMucmlnaHQgPSByaWdodDtcbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcblxuICAgICAgZmluaXNoQ2FsbEV4cHJlc3Npb246IGZ1bmN0aW9uIChjYWxsZWUsIGFyZ3MpIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBTeW50YXguQ2FsbEV4cHJlc3Npb247XG4gICAgICAgICAgdGhpcy5jYWxsZWUgPSBjYWxsZWU7XG4gICAgICAgICAgdGhpcy5hcmd1bWVudHMgPSBhcmdzO1xuICAgICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuXG4gICAgICBmaW5pc2hDb25kaXRpb25hbEV4cHJlc3Npb246IGZ1bmN0aW9uICh0ZXN0LCBjb25zZXF1ZW50LCBhbHRlcm5hdGUpIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBTeW50YXguQ29uZGl0aW9uYWxFeHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMudGVzdCA9IHRlc3Q7XG4gICAgICAgICAgdGhpcy5jb25zZXF1ZW50ID0gY29uc2VxdWVudDtcbiAgICAgICAgICB0aGlzLmFsdGVybmF0ZSA9IGFsdGVybmF0ZTtcbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcblxuICAgICAgZmluaXNoRXhwcmVzc2lvblN0YXRlbWVudDogZnVuY3Rpb24gKGV4cHJlc3Npb24pIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBTeW50YXguRXhwcmVzc2lvblN0YXRlbWVudDtcbiAgICAgICAgICB0aGlzLmV4cHJlc3Npb24gPSBleHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuXG4gICAgICBmaW5pc2hJZGVudGlmaWVyOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5JZGVudGlmaWVyO1xuICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICAgdGhpcy5maW5pc2goKTtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG5cbiAgICAgIGZpbmlzaExpdGVyYWw6IGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5MaXRlcmFsO1xuICAgICAgICAgIHRoaXMudmFsdWUgPSB0b2tlbi52YWx1ZTtcbiAgICAgICAgICB0aGlzLnJhdyA9IHNvdXJjZS5zbGljZSh0b2tlbi5zdGFydCwgdG9rZW4uZW5kKTtcbiAgICAgICAgICBpZiAodG9rZW4ucmVnZXgpIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMucmF3ID09ICcvLycpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJhdyA9ICcvKD86KS8nO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMucmVnZXggPSB0b2tlbi5yZWdleDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5maW5pc2goKTtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG5cbiAgICAgIGZpbmlzaE1lbWJlckV4cHJlc3Npb246IGZ1bmN0aW9uIChhY2Nlc3Nvciwgb2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5NZW1iZXJFeHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMuY29tcHV0ZWQgPSBhY2Nlc3NvciA9PT0gJ1snO1xuICAgICAgICAgIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuICAgICAgICAgIHRoaXMucHJvcGVydHkgPSBwcm9wZXJ0eTtcbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcblxuICAgICAgZmluaXNoT2JqZWN0RXhwcmVzc2lvbjogZnVuY3Rpb24gKHByb3BlcnRpZXMpIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBTeW50YXguT2JqZWN0RXhwcmVzc2lvbjtcbiAgICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xuICAgICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuXG4gICAgICBmaW5pc2hQcm9ncmFtOiBmdW5jdGlvbiAoYm9keSkge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5Qcm9ncmFtO1xuICAgICAgICAgIHRoaXMuYm9keSA9IGJvZHk7XG4gICAgICAgICAgdGhpcy5maW5pc2goKTtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG5cbiAgICAgIGZpbmlzaFByb3BlcnR5OiBmdW5jdGlvbiAoa2luZCwga2V5LCB2YWx1ZSkge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5Qcm9wZXJ0eTtcbiAgICAgICAgICB0aGlzLmtleSA9IGtleTtcbiAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgdGhpcy5raW5kID0ga2luZDtcbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcblxuICAgICAgZmluaXNoVW5hcnlFeHByZXNzaW9uOiBmdW5jdGlvbiAob3BlcmF0b3IsIGFyZ3VtZW50KSB7XG4gICAgICAgICAgdGhpcy50eXBlID0gKG9wZXJhdG9yID09PSAnKysnIHx8IG9wZXJhdG9yID09PSAnLS0nKSA/IFN5bnRheC5VcGRhdGVFeHByZXNzaW9uIDogU3ludGF4LlVuYXJ5RXhwcmVzc2lvbjtcbiAgICAgICAgICB0aGlzLm9wZXJhdG9yID0gb3BlcmF0b3I7XG4gICAgICAgICAgdGhpcy5hcmd1bWVudCA9IGFyZ3VtZW50O1xuICAgICAgICAgIHRoaXMucHJlZml4ID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICB9O1xuXG4gIC8vIFJldHVybiB0cnVlIGlmIHRoZXJlIGlzIGEgbGluZSB0ZXJtaW5hdG9yIGJlZm9yZSB0aGUgbmV4dCB0b2tlbi5cblxuICBmdW5jdGlvbiBwZWVrTGluZVRlcm1pbmF0b3IoKSB7XG4gICAgICB2YXIgcG9zLCBsaW5lLCBzdGFydCwgZm91bmQ7XG5cbiAgICAgIHBvcyA9IGluZGV4O1xuICAgICAgbGluZSA9IGxpbmVOdW1iZXI7XG4gICAgICBzdGFydCA9IGxpbmVTdGFydDtcbiAgICAgIHNraXBDb21tZW50KCk7XG4gICAgICBmb3VuZCA9IGxpbmVOdW1iZXIgIT09IGxpbmU7XG4gICAgICBpbmRleCA9IHBvcztcbiAgICAgIGxpbmVOdW1iZXIgPSBsaW5lO1xuICAgICAgbGluZVN0YXJ0ID0gc3RhcnQ7XG5cbiAgICAgIHJldHVybiBmb3VuZDtcbiAgfVxuXG4gIC8vIFRocm93IGFuIGV4Y2VwdGlvblxuXG4gIGZ1bmN0aW9uIHRocm93RXJyb3IodG9rZW4sIG1lc3NhZ2VGb3JtYXQpIHtcbiAgICAgIHZhciBlcnJvcixcbiAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSxcbiAgICAgICAgICBtc2cgPSBtZXNzYWdlRm9ybWF0LnJlcGxhY2UoXG4gICAgICAgICAgICAgIC8lKFxcZCkvZyxcbiAgICAgICAgICAgICAgZnVuY3Rpb24gKHdob2xlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgYXNzZXJ0KGluZGV4IDwgYXJncy5sZW5ndGgsICdNZXNzYWdlIHJlZmVyZW5jZSBtdXN0IGJlIGluIHJhbmdlJyk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gYXJnc1tpbmRleF07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuXG4gICAgICBpZiAodHlwZW9mIHRva2VuLmxpbmVOdW1iZXIgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ0xpbmUgJyArIHRva2VuLmxpbmVOdW1iZXIgKyAnOiAnICsgbXNnKTtcbiAgICAgICAgICBlcnJvci5pbmRleCA9IHRva2VuLnN0YXJ0O1xuICAgICAgICAgIGVycm9yLmxpbmVOdW1iZXIgPSB0b2tlbi5saW5lTnVtYmVyO1xuICAgICAgICAgIGVycm9yLmNvbHVtbiA9IHRva2VuLnN0YXJ0IC0gbGluZVN0YXJ0ICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ0xpbmUgJyArIGxpbmVOdW1iZXIgKyAnOiAnICsgbXNnKTtcbiAgICAgICAgICBlcnJvci5pbmRleCA9IGluZGV4O1xuICAgICAgICAgIGVycm9yLmxpbmVOdW1iZXIgPSBsaW5lTnVtYmVyO1xuICAgICAgICAgIGVycm9yLmNvbHVtbiA9IGluZGV4IC0gbGluZVN0YXJ0ICsgMTtcbiAgICAgIH1cblxuICAgICAgZXJyb3IuZGVzY3JpcHRpb24gPSBtc2c7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRocm93RXJyb3JUb2xlcmFudCgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgICAgdGhyb3dFcnJvci5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGlmIChleHRyYS5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgZXh0cmEuZXJyb3JzLnB1c2goZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gIH1cblxuXG4gIC8vIFRocm93IGFuIGV4Y2VwdGlvbiBiZWNhdXNlIG9mIHRoZSB0b2tlbi5cblxuICBmdW5jdGlvbiB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pIHtcbiAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5FT0YpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHRva2VuLCBNZXNzYWdlcy5VbmV4cGVjdGVkRU9TKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLk51bWVyaWNMaXRlcmFsKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZE51bWJlcik7XG4gICAgICB9XG5cbiAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5TdHJpbmdMaXRlcmFsKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZFN0cmluZyk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5JZGVudGlmaWVyKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZElkZW50aWZpZXIpO1xuICAgICAgfVxuXG4gICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uS2V5d29yZCkge1xuICAgICAgICAgIGlmIChpc0Z1dHVyZVJlc2VydmVkV29yZCh0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZFJlc2VydmVkKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQodG9rZW4udmFsdWUpKSB7XG4gICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh0b2tlbiwgTWVzc2FnZXMuU3RyaWN0UmVzZXJ2ZWRXb3JkKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aHJvd0Vycm9yKHRva2VuLCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sIHRva2VuLnZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgLy8gQm9vbGVhbkxpdGVyYWwsIE51bGxMaXRlcmFsLCBvciBQdW5jdHVhdG9yLlxuICAgICAgdGhyb3dFcnJvcih0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCB0b2tlbi52YWx1ZSk7XG4gIH1cblxuICAvLyBFeHBlY3QgdGhlIG5leHQgdG9rZW4gdG8gbWF0Y2ggdGhlIHNwZWNpZmllZCBwdW5jdHVhdG9yLlxuICAvLyBJZiBub3QsIGFuIGV4Y2VwdGlvbiB3aWxsIGJlIHRocm93bi5cblxuICBmdW5jdGlvbiBleHBlY3QodmFsdWUpIHtcbiAgICAgIHZhciB0b2tlbiA9IGxleCgpO1xuICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLlB1bmN0dWF0b3IgfHwgdG9rZW4udmFsdWUgIT09IHZhbHVlKSB7XG4gICAgICAgICAgdGhyb3dVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAbmFtZSBleHBlY3RUb2xlcmFudFxuICAgKiBAZGVzY3JpcHRpb24gUXVpZXRseSBleHBlY3QgdGhlIGdpdmVuIHRva2VuIHZhbHVlIHdoZW4gaW4gdG9sZXJhbnQgbW9kZSwgb3RoZXJ3aXNlIGRlbGVnYXRlc1xuICAgKiB0byA8Y29kZT5leHBlY3QodmFsdWUpPC9jb2RlPlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgVGhlIHZhbHVlIHdlIGFyZSBleHBlY3RpbmcgdGhlIGxvb2thaGVhZCB0b2tlbiB0byBoYXZlXG4gICAqIEBzaW5jZSAyLjBcbiAgICovXG4gIGZ1bmN0aW9uIGV4cGVjdFRvbGVyYW50KHZhbHVlKSB7XG4gICAgICBpZiAoZXh0cmEuZXJyb3JzKSB7XG4gICAgICAgICAgdmFyIHRva2VuID0gbG9va2FoZWFkO1xuICAgICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5QdW5jdHVhdG9yICYmIHRva2VuLnZhbHVlICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQodG9rZW4sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgdG9rZW4udmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXhwZWN0KHZhbHVlKTtcbiAgICAgIH1cbiAgfVxuXG4gIC8vIEV4cGVjdCB0aGUgbmV4dCB0b2tlbiB0byBtYXRjaCB0aGUgc3BlY2lmaWVkIGtleXdvcmQuXG4gIC8vIElmIG5vdCwgYW4gZXhjZXB0aW9uIHdpbGwgYmUgdGhyb3duLlxuXG4gIGZ1bmN0aW9uIGV4cGVjdEtleXdvcmQoa2V5d29yZCkge1xuICAgICAgdmFyIHRva2VuID0gbGV4KCk7XG4gICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uS2V5d29yZCB8fCB0b2tlbi52YWx1ZSAhPT0ga2V5d29yZCkge1xuICAgICAgICAgIHRocm93VW5leHBlY3RlZCh0b2tlbik7XG4gICAgICB9XG4gIH1cblxuICAvLyBSZXR1cm4gdHJ1ZSBpZiB0aGUgbmV4dCB0b2tlbiBtYXRjaGVzIHRoZSBzcGVjaWZpZWQgcHVuY3R1YXRvci5cblxuICBmdW5jdGlvbiBtYXRjaCh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGxvb2thaGVhZC50eXBlID09PSBUb2tlbi5QdW5jdHVhdG9yICYmIGxvb2thaGVhZC52YWx1ZSA9PT0gdmFsdWU7XG4gIH1cblxuICAvLyBSZXR1cm4gdHJ1ZSBpZiB0aGUgbmV4dCB0b2tlbiBtYXRjaGVzIHRoZSBzcGVjaWZpZWQga2V5d29yZFxuXG4gIGZ1bmN0aW9uIG1hdGNoS2V5d29yZChrZXl3b3JkKSB7XG4gICAgICByZXR1cm4gbG9va2FoZWFkLnR5cGUgPT09IFRva2VuLktleXdvcmQgJiYgbG9va2FoZWFkLnZhbHVlID09PSBrZXl3b3JkO1xuICB9XG5cbiAgZnVuY3Rpb24gY29uc3VtZVNlbWljb2xvbigpIHtcbiAgICAgIHZhciBsaW5lO1xuXG4gICAgICAvLyBDYXRjaCB0aGUgdmVyeSBjb21tb24gY2FzZSBmaXJzdDogaW1tZWRpYXRlbHkgYSBzZW1pY29sb24gKFUrMDAzQikuXG4gICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpID09PSAweDNCIHx8IG1hdGNoKCc7JykpIHtcbiAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGxpbmUgPSBsaW5lTnVtYmVyO1xuICAgICAgc2tpcENvbW1lbnQoKTtcbiAgICAgIGlmIChsaW5lTnVtYmVyICE9PSBsaW5lKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAobG9va2FoZWFkLnR5cGUgIT09IFRva2VuLkVPRiAmJiAhbWF0Y2goJ30nKSkge1xuICAgICAgICAgIHRocm93VW5leHBlY3RlZChsb29rYWhlYWQpO1xuICAgICAgfVxuICB9XG5cbiAgLy8gUmV0dXJuIHRydWUgaWYgcHJvdmlkZWQgZXhwcmVzc2lvbiBpcyBMZWZ0SGFuZFNpZGVFeHByZXNzaW9uXG5cbiAgZnVuY3Rpb24gaXNMZWZ0SGFuZFNpZGUoZXhwcikge1xuICAgICAgcmV0dXJuIGV4cHIudHlwZSA9PT0gU3ludGF4LklkZW50aWZpZXIgfHwgZXhwci50eXBlID09PSBTeW50YXguTWVtYmVyRXhwcmVzc2lvbjtcbiAgfVxuXG4gIC8vIDExLjEuNCBBcnJheSBJbml0aWFsaXNlclxuXG4gIGZ1bmN0aW9uIHBhcnNlQXJyYXlJbml0aWFsaXNlcigpIHtcbiAgICAgIHZhciBlbGVtZW50cyA9IFtdLCBub2RlID0gbmV3IE5vZGUoKTtcblxuICAgICAgZXhwZWN0KCdbJyk7XG5cbiAgICAgIHdoaWxlICghbWF0Y2goJ10nKSkge1xuICAgICAgICAgIGlmIChtYXRjaCgnLCcpKSB7XG4gICAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKG51bGwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnRzLnB1c2gocGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpKTtcblxuICAgICAgICAgICAgICBpZiAoIW1hdGNoKCddJykpIHtcbiAgICAgICAgICAgICAgICAgIGV4cGVjdCgnLCcpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsZXgoKTtcblxuICAgICAgcmV0dXJuIG5vZGUuZmluaXNoQXJyYXlFeHByZXNzaW9uKGVsZW1lbnRzKTtcbiAgfVxuXG4gIC8vIDExLjEuNSBPYmplY3QgSW5pdGlhbGlzZXJcblxuICBmdW5jdGlvbiBwYXJzZU9iamVjdFByb3BlcnR5S2V5KCkge1xuICAgICAgdmFyIHRva2VuLCBub2RlID0gbmV3IE5vZGUoKTtcblxuICAgICAgdG9rZW4gPSBsZXgoKTtcblxuICAgICAgLy8gTm90ZTogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgb25seSBmcm9tIHBhcnNlT2JqZWN0UHJvcGVydHkoKSwgd2hlcmVcbiAgICAgIC8vIEVPRiBhbmQgUHVuY3R1YXRvciB0b2tlbnMgYXJlIGFscmVhZHkgZmlsdGVyZWQgb3V0LlxuXG4gICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uU3RyaW5nTGl0ZXJhbCB8fCB0b2tlbi50eXBlID09PSBUb2tlbi5OdW1lcmljTGl0ZXJhbCkge1xuICAgICAgICAgIGlmIChzdHJpY3QgJiYgdG9rZW4ub2N0YWwpIHtcbiAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHRva2VuLCBNZXNzYWdlcy5TdHJpY3RPY3RhbExpdGVyYWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbm9kZS5maW5pc2hMaXRlcmFsKHRva2VuKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5vZGUuZmluaXNoSWRlbnRpZmllcih0b2tlbi52YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZU9iamVjdFByb3BlcnR5KCkge1xuICAgICAgdmFyIHRva2VuLCBrZXksIGlkLCB2YWx1ZSwgcGFyYW0sIG5vZGUgPSBuZXcgTm9kZSgpO1xuXG4gICAgICB0b2tlbiA9IGxvb2thaGVhZDtcblxuICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLklkZW50aWZpZXIpIHtcbiAgICAgICAgICBpZCA9IHBhcnNlT2JqZWN0UHJvcGVydHlLZXkoKTtcbiAgICAgICAgICBleHBlY3QoJzonKTtcbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgICByZXR1cm4gbm9kZS5maW5pc2hQcm9wZXJ0eSgnaW5pdCcsIGlkLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uRU9GIHx8IHRva2VuLnR5cGUgPT09IFRva2VuLlB1bmN0dWF0b3IpIHtcbiAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBrZXkgPSBwYXJzZU9iamVjdFByb3BlcnR5S2V5KCk7XG4gICAgICAgICAgZXhwZWN0KCc6Jyk7XG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgICAgcmV0dXJuIG5vZGUuZmluaXNoUHJvcGVydHkoJ2luaXQnLCBrZXksIHZhbHVlKTtcbiAgICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlT2JqZWN0SW5pdGlhbGlzZXIoKSB7XG4gICAgICB2YXIgcHJvcGVydGllcyA9IFtdLCB0b2tlbiwgcHJvcGVydHksIG5hbWUsIGtleSwga2luZCwgbWFwID0ge30sIHRvU3RyaW5nID0gU3RyaW5nLCBub2RlID0gbmV3IE5vZGUoKTtcblxuICAgICAgZXhwZWN0KCd7Jyk7XG5cbiAgICAgIHdoaWxlICghbWF0Y2goJ30nKSkge1xuICAgICAgICAgIHByb3BlcnR5ID0gcGFyc2VPYmplY3RQcm9wZXJ0eSgpO1xuXG4gICAgICAgICAgaWYgKHByb3BlcnR5LmtleS50eXBlID09PSBTeW50YXguSWRlbnRpZmllcikge1xuICAgICAgICAgICAgICBuYW1lID0gcHJvcGVydHkua2V5Lm5hbWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbmFtZSA9IHRvU3RyaW5nKHByb3BlcnR5LmtleS52YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGtpbmQgPSAocHJvcGVydHkua2luZCA9PT0gJ2luaXQnKSA/IFByb3BlcnR5S2luZC5EYXRhIDogKHByb3BlcnR5LmtpbmQgPT09ICdnZXQnKSA/IFByb3BlcnR5S2luZC5HZXQgOiBQcm9wZXJ0eUtpbmQuU2V0O1xuXG4gICAgICAgICAga2V5ID0gJyQnICsgbmFtZTtcbiAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1hcCwga2V5KSkge1xuICAgICAgICAgICAgICBpZiAobWFwW2tleV0gPT09IFByb3BlcnR5S2luZC5EYXRhKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoc3RyaWN0ICYmIGtpbmQgPT09IFByb3BlcnR5S2luZC5EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5TdHJpY3REdXBsaWNhdGVQcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGtpbmQgIT09IFByb3BlcnR5S2luZC5EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5BY2Nlc3NvckRhdGFQcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBpZiAoa2luZCA9PT0gUHJvcGVydHlLaW5kLkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLkFjY2Vzc29yRGF0YVByb3BlcnR5KTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWFwW2tleV0gJiBraW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHt9LCBNZXNzYWdlcy5BY2Nlc3NvckdldFNldCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbWFwW2tleV0gfD0ga2luZDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBtYXBba2V5XSA9IGtpbmQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcHJvcGVydGllcy5wdXNoKHByb3BlcnR5KTtcblxuICAgICAgICAgIGlmICghbWF0Y2goJ30nKSkge1xuICAgICAgICAgICAgICBleHBlY3RUb2xlcmFudCgnLCcpO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZXhwZWN0KCd9Jyk7XG5cbiAgICAgIHJldHVybiBub2RlLmZpbmlzaE9iamVjdEV4cHJlc3Npb24ocHJvcGVydGllcyk7XG4gIH1cblxuICAvLyAxMS4xLjYgVGhlIEdyb3VwaW5nIE9wZXJhdG9yXG5cbiAgZnVuY3Rpb24gcGFyc2VHcm91cEV4cHJlc3Npb24oKSB7XG4gICAgICB2YXIgZXhwcjtcblxuICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgICsrc3RhdGUucGFyZW50aGVzaXNDb3VudDtcblxuICAgICAgZXhwciA9IHBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICBleHBlY3QoJyknKTtcblxuICAgICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuXG4gIC8vIDExLjEgUHJpbWFyeSBFeHByZXNzaW9uc1xuXG4gIHZhciBsZWdhbEtleXdvcmRzID0ge1wiaWZcIjoxLCBcInRoaXNcIjoxfTtcblxuICBmdW5jdGlvbiBwYXJzZVByaW1hcnlFeHByZXNzaW9uKCkge1xuICAgICAgdmFyIHR5cGUsIHRva2VuLCBleHByLCBub2RlO1xuXG4gICAgICBpZiAobWF0Y2goJygnKSkge1xuICAgICAgICAgIHJldHVybiBwYXJzZUdyb3VwRXhwcmVzc2lvbigpO1xuICAgICAgfVxuXG4gICAgICBpZiAobWF0Y2goJ1snKSkge1xuICAgICAgICAgIHJldHVybiBwYXJzZUFycmF5SW5pdGlhbGlzZXIoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG1hdGNoKCd7JykpIHtcbiAgICAgICAgICByZXR1cm4gcGFyc2VPYmplY3RJbml0aWFsaXNlcigpO1xuICAgICAgfVxuXG4gICAgICB0eXBlID0gbG9va2FoZWFkLnR5cGU7XG4gICAgICBub2RlID0gbmV3IE5vZGUoKTtcblxuICAgICAgaWYgKHR5cGUgPT09IFRva2VuLklkZW50aWZpZXIgfHwgbGVnYWxLZXl3b3Jkc1tsb29rYWhlYWQudmFsdWVdKSB7XG4gICAgICAgICAgZXhwciA9IG5vZGUuZmluaXNoSWRlbnRpZmllcihsZXgoKS52YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFRva2VuLlN0cmluZ0xpdGVyYWwgfHwgdHlwZSA9PT0gVG9rZW4uTnVtZXJpY0xpdGVyYWwpIHtcbiAgICAgICAgICBpZiAoc3RyaWN0ICYmIGxvb2thaGVhZC5vY3RhbCkge1xuICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQobG9va2FoZWFkLCBNZXNzYWdlcy5TdHJpY3RPY3RhbExpdGVyYWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBleHByID0gbm9kZS5maW5pc2hMaXRlcmFsKGxleCgpKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gVG9rZW4uS2V5d29yZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpc2FibGVkLlwiKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gVG9rZW4uQm9vbGVhbkxpdGVyYWwpIHtcbiAgICAgICAgICB0b2tlbiA9IGxleCgpO1xuICAgICAgICAgIHRva2VuLnZhbHVlID0gKHRva2VuLnZhbHVlID09PSAndHJ1ZScpO1xuICAgICAgICAgIGV4cHIgPSBub2RlLmZpbmlzaExpdGVyYWwodG9rZW4pO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBUb2tlbi5OdWxsTGl0ZXJhbCkge1xuICAgICAgICAgIHRva2VuID0gbGV4KCk7XG4gICAgICAgICAgdG9rZW4udmFsdWUgPSBudWxsO1xuICAgICAgICAgIGV4cHIgPSBub2RlLmZpbmlzaExpdGVyYWwodG9rZW4pO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaCgnLycpIHx8IG1hdGNoKCcvPScpKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBleHRyYS50b2tlbnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIGV4cHIgPSBub2RlLmZpbmlzaExpdGVyYWwoY29sbGVjdFJlZ2V4KCkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGV4cHIgPSBub2RlLmZpbmlzaExpdGVyYWwoc2NhblJlZ0V4cCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGVlaygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQobGV4KCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIC8vIDExLjIgTGVmdC1IYW5kLVNpZGUgRXhwcmVzc2lvbnNcblxuICBmdW5jdGlvbiBwYXJzZUFyZ3VtZW50cygpIHtcbiAgICAgIHZhciBhcmdzID0gW107XG5cbiAgICAgIGV4cGVjdCgnKCcpO1xuXG4gICAgICBpZiAoIW1hdGNoKCcpJykpIHtcbiAgICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgYXJncy5wdXNoKHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSk7XG4gICAgICAgICAgICAgIGlmIChtYXRjaCgnKScpKSB7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBleHBlY3RUb2xlcmFudCgnLCcpO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZXhwZWN0KCcpJyk7XG5cbiAgICAgIHJldHVybiBhcmdzO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VOb25Db21wdXRlZFByb3BlcnR5KCkge1xuICAgICAgdmFyIHRva2VuLCBub2RlID0gbmV3IE5vZGUoKTtcblxuICAgICAgdG9rZW4gPSBsZXgoKTtcblxuICAgICAgaWYgKCFpc0lkZW50aWZpZXJOYW1lKHRva2VuKSkge1xuICAgICAgICAgIHRocm93VW5leHBlY3RlZCh0b2tlbik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBub2RlLmZpbmlzaElkZW50aWZpZXIodG9rZW4udmFsdWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VOb25Db21wdXRlZE1lbWJlcigpIHtcbiAgICAgIGV4cGVjdCgnLicpO1xuXG4gICAgICByZXR1cm4gcGFyc2VOb25Db21wdXRlZFByb3BlcnR5KCk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZUNvbXB1dGVkTWVtYmVyKCkge1xuICAgICAgdmFyIGV4cHI7XG5cbiAgICAgIGV4cGVjdCgnWycpO1xuXG4gICAgICBleHByID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgIGV4cGVjdCgnXScpO1xuXG4gICAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbkFsbG93Q2FsbCgpIHtcbiAgICAgIHZhciBleHByLCBhcmdzLCBwcm9wZXJ0eSwgc3RhcnRUb2tlbiwgcHJldmlvdXNBbGxvd0luID0gc3RhdGUuYWxsb3dJbjtcblxuICAgICAgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcbiAgICAgIHN0YXRlLmFsbG93SW4gPSB0cnVlO1xuICAgICAgZXhwciA9IHBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKTtcblxuICAgICAgZm9yICg7Oykge1xuICAgICAgICAgIGlmIChtYXRjaCgnLicpKSB7XG4gICAgICAgICAgICAgIHByb3BlcnR5ID0gcGFyc2VOb25Db21wdXRlZE1lbWJlcigpO1xuICAgICAgICAgICAgICBleHByID0gbmV3IFdyYXBwaW5nTm9kZShzdGFydFRva2VuKS5maW5pc2hNZW1iZXJFeHByZXNzaW9uKCcuJywgZXhwciwgcHJvcGVydHkpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2goJygnKSkge1xuICAgICAgICAgICAgICBhcmdzID0gcGFyc2VBcmd1bWVudHMoKTtcbiAgICAgICAgICAgICAgZXhwciA9IG5ldyBXcmFwcGluZ05vZGUoc3RhcnRUb2tlbikuZmluaXNoQ2FsbEV4cHJlc3Npb24oZXhwciwgYXJncyk7XG4gICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCgnWycpKSB7XG4gICAgICAgICAgICAgIHByb3BlcnR5ID0gcGFyc2VDb21wdXRlZE1lbWJlcigpO1xuICAgICAgICAgICAgICBleHByID0gbmV3IFdyYXBwaW5nTm9kZShzdGFydFRva2VuKS5maW5pc2hNZW1iZXJFeHByZXNzaW9uKCdbJywgZXhwciwgcHJvcGVydHkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHN0YXRlLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKCkge1xuICAgICAgdmFyIGV4cHIsIHByb3BlcnR5LCBzdGFydFRva2VuO1xuICAgICAgYXNzZXJ0KHN0YXRlLmFsbG93SW4sICdjYWxsZWUgb2YgbmV3IGV4cHJlc3Npb24gYWx3YXlzIGFsbG93IGluIGtleXdvcmQuJyk7XG5cbiAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICBleHByID0gcGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgICBmb3IgKDs7KSB7XG4gICAgICAgICAgaWYgKG1hdGNoKCdbJykpIHtcbiAgICAgICAgICAgICAgcHJvcGVydHkgPSBwYXJzZUNvbXB1dGVkTWVtYmVyKCk7XG4gICAgICAgICAgICAgIGV4cHIgPSBuZXcgV3JhcHBpbmdOb2RlKHN0YXJ0VG9rZW4pLmZpbmlzaE1lbWJlckV4cHJlc3Npb24oJ1snLCBleHByLCBwcm9wZXJ0eSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCgnLicpKSB7XG4gICAgICAgICAgICAgIHByb3BlcnR5ID0gcGFyc2VOb25Db21wdXRlZE1lbWJlcigpO1xuICAgICAgICAgICAgICBleHByID0gbmV3IFdyYXBwaW5nTm9kZShzdGFydFRva2VuKS5maW5pc2hNZW1iZXJFeHByZXNzaW9uKCcuJywgZXhwciwgcHJvcGVydHkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgLy8gMTEuMyBQb3N0Zml4IEV4cHJlc3Npb25zXG5cbiAgZnVuY3Rpb24gcGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpIHtcbiAgICAgIHZhciBleHByLCB0b2tlbiwgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcblxuICAgICAgZXhwciA9IHBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbkFsbG93Q2FsbCgpO1xuXG4gICAgICBpZiAobG9va2FoZWFkLnR5cGUgPT09IFRva2VuLlB1bmN0dWF0b3IpIHtcbiAgICAgICAgICBpZiAoKG1hdGNoKCcrKycpIHx8IG1hdGNoKCctLScpKSAmJiAhcGVla0xpbmVUZXJtaW5hdG9yKCkpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGlzYWJsZWQuXCIpO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICAvLyAxMS40IFVuYXJ5IE9wZXJhdG9yc1xuXG4gIGZ1bmN0aW9uIHBhcnNlVW5hcnlFeHByZXNzaW9uKCkge1xuICAgICAgdmFyIHRva2VuLCBleHByLCBzdGFydFRva2VuO1xuXG4gICAgICBpZiAobG9va2FoZWFkLnR5cGUgIT09IFRva2VuLlB1bmN0dWF0b3IgJiYgbG9va2FoZWFkLnR5cGUgIT09IFRva2VuLktleXdvcmQpIHtcbiAgICAgICAgICBleHByID0gcGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaCgnKysnKSB8fCBtYXRjaCgnLS0nKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpc2FibGVkLlwiKTtcbiAgICAgIH0gZWxzZSBpZiAobWF0Y2goJysnKSB8fCBtYXRjaCgnLScpIHx8IG1hdGNoKCd+JykgfHwgbWF0Y2goJyEnKSkge1xuICAgICAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgICAgdG9rZW4gPSBsZXgoKTtcbiAgICAgICAgICBleHByID0gcGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcbiAgICAgICAgICBleHByID0gbmV3IFdyYXBwaW5nTm9kZShzdGFydFRva2VuKS5maW5pc2hVbmFyeUV4cHJlc3Npb24odG9rZW4udmFsdWUsIGV4cHIpO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaEtleXdvcmQoJ2RlbGV0ZScpIHx8IG1hdGNoS2V5d29yZCgndm9pZCcpIHx8IG1hdGNoS2V5d29yZCgndHlwZW9mJykpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEaXNhYmxlZC5cIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV4cHIgPSBwYXJzZVBvc3RmaXhFeHByZXNzaW9uKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgZnVuY3Rpb24gYmluYXJ5UHJlY2VkZW5jZSh0b2tlbiwgYWxsb3dJbikge1xuICAgICAgdmFyIHByZWMgPSAwO1xuXG4gICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uUHVuY3R1YXRvciAmJiB0b2tlbi50eXBlICE9PSBUb2tlbi5LZXl3b3JkKSB7XG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG5cbiAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgIGNhc2UgJ3x8JzpcbiAgICAgICAgICBwcmVjID0gMTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnJiYnOlxuICAgICAgICAgIHByZWMgPSAyO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICd8JzpcbiAgICAgICAgICBwcmVjID0gMztcbiAgICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnXic6XG4gICAgICAgICAgcHJlYyA9IDQ7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJyYnOlxuICAgICAgICAgIHByZWMgPSA1O1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICc9PSc6XG4gICAgICBjYXNlICchPSc6XG4gICAgICBjYXNlICc9PT0nOlxuICAgICAgY2FzZSAnIT09JzpcbiAgICAgICAgICBwcmVjID0gNjtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnPCc6XG4gICAgICBjYXNlICc+JzpcbiAgICAgIGNhc2UgJzw9JzpcbiAgICAgIGNhc2UgJz49JzpcbiAgICAgIGNhc2UgJ2luc3RhbmNlb2YnOlxuICAgICAgICAgIHByZWMgPSA3O1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdpbic6XG4gICAgICAgICAgcHJlYyA9IGFsbG93SW4gPyA3IDogMDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnPDwnOlxuICAgICAgY2FzZSAnPj4nOlxuICAgICAgY2FzZSAnPj4+JzpcbiAgICAgICAgICBwcmVjID0gODtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnKyc6XG4gICAgICBjYXNlICctJzpcbiAgICAgICAgICBwcmVjID0gOTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnKic6XG4gICAgICBjYXNlICcvJzpcbiAgICAgIGNhc2UgJyUnOlxuICAgICAgICAgIHByZWMgPSAxMTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByZWM7XG4gIH1cblxuICAvLyAxMS41IE11bHRpcGxpY2F0aXZlIE9wZXJhdG9yc1xuICAvLyAxMS42IEFkZGl0aXZlIE9wZXJhdG9yc1xuICAvLyAxMS43IEJpdHdpc2UgU2hpZnQgT3BlcmF0b3JzXG4gIC8vIDExLjggUmVsYXRpb25hbCBPcGVyYXRvcnNcbiAgLy8gMTEuOSBFcXVhbGl0eSBPcGVyYXRvcnNcbiAgLy8gMTEuMTAgQmluYXJ5IEJpdHdpc2UgT3BlcmF0b3JzXG4gIC8vIDExLjExIEJpbmFyeSBMb2dpY2FsIE9wZXJhdG9yc1xuXG4gIGZ1bmN0aW9uIHBhcnNlQmluYXJ5RXhwcmVzc2lvbigpIHtcbiAgICAgIHZhciBtYXJrZXIsIG1hcmtlcnMsIGV4cHIsIHRva2VuLCBwcmVjLCBzdGFjaywgcmlnaHQsIG9wZXJhdG9yLCBsZWZ0LCBpO1xuXG4gICAgICBtYXJrZXIgPSBsb29rYWhlYWQ7XG4gICAgICBsZWZ0ID0gcGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcblxuICAgICAgdG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICBwcmVjID0gYmluYXJ5UHJlY2VkZW5jZSh0b2tlbiwgc3RhdGUuYWxsb3dJbik7XG4gICAgICBpZiAocHJlYyA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiBsZWZ0O1xuICAgICAgfVxuICAgICAgdG9rZW4ucHJlYyA9IHByZWM7XG4gICAgICBsZXgoKTtcblxuICAgICAgbWFya2VycyA9IFttYXJrZXIsIGxvb2thaGVhZF07XG4gICAgICByaWdodCA9IHBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG5cbiAgICAgIHN0YWNrID0gW2xlZnQsIHRva2VuLCByaWdodF07XG5cbiAgICAgIHdoaWxlICgocHJlYyA9IGJpbmFyeVByZWNlZGVuY2UobG9va2FoZWFkLCBzdGF0ZS5hbGxvd0luKSkgPiAwKSB7XG5cbiAgICAgICAgICAvLyBSZWR1Y2U6IG1ha2UgYSBiaW5hcnkgZXhwcmVzc2lvbiBmcm9tIHRoZSB0aHJlZSB0b3Btb3N0IGVudHJpZXMuXG4gICAgICAgICAgd2hpbGUgKChzdGFjay5sZW5ndGggPiAyKSAmJiAocHJlYyA8PSBzdGFja1tzdGFjay5sZW5ndGggLSAyXS5wcmVjKSkge1xuICAgICAgICAgICAgICByaWdodCA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICBvcGVyYXRvciA9IHN0YWNrLnBvcCgpLnZhbHVlO1xuICAgICAgICAgICAgICBsZWZ0ID0gc3RhY2sucG9wKCk7XG4gICAgICAgICAgICAgIG1hcmtlcnMucG9wKCk7XG4gICAgICAgICAgICAgIGV4cHIgPSBuZXcgV3JhcHBpbmdOb2RlKG1hcmtlcnNbbWFya2Vycy5sZW5ndGggLSAxXSkuZmluaXNoQmluYXJ5RXhwcmVzc2lvbihvcGVyYXRvciwgbGVmdCwgcmlnaHQpO1xuICAgICAgICAgICAgICBzdGFjay5wdXNoKGV4cHIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFNoaWZ0LlxuICAgICAgICAgIHRva2VuID0gbGV4KCk7XG4gICAgICAgICAgdG9rZW4ucHJlYyA9IHByZWM7XG4gICAgICAgICAgc3RhY2sucHVzaCh0b2tlbik7XG4gICAgICAgICAgbWFya2Vycy5wdXNoKGxvb2thaGVhZCk7XG4gICAgICAgICAgZXhwciA9IHBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG4gICAgICAgICAgc3RhY2sucHVzaChleHByKTtcbiAgICAgIH1cblxuICAgICAgLy8gRmluYWwgcmVkdWNlIHRvIGNsZWFuLXVwIHRoZSBzdGFjay5cbiAgICAgIGkgPSBzdGFjay5sZW5ndGggLSAxO1xuICAgICAgZXhwciA9IHN0YWNrW2ldO1xuICAgICAgbWFya2Vycy5wb3AoKTtcbiAgICAgIHdoaWxlIChpID4gMSkge1xuICAgICAgICAgIGV4cHIgPSBuZXcgV3JhcHBpbmdOb2RlKG1hcmtlcnMucG9wKCkpLmZpbmlzaEJpbmFyeUV4cHJlc3Npb24oc3RhY2tbaSAtIDFdLnZhbHVlLCBzdGFja1tpIC0gMl0sIGV4cHIpO1xuICAgICAgICAgIGkgLT0gMjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICAvLyAxMS4xMiBDb25kaXRpb25hbCBPcGVyYXRvclxuXG4gIGZ1bmN0aW9uIHBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKCkge1xuICAgICAgdmFyIGV4cHIsIHByZXZpb3VzQWxsb3dJbiwgY29uc2VxdWVudCwgYWx0ZXJuYXRlLCBzdGFydFRva2VuO1xuXG4gICAgICBzdGFydFRva2VuID0gbG9va2FoZWFkO1xuXG4gICAgICBleHByID0gcGFyc2VCaW5hcnlFeHByZXNzaW9uKCk7XG5cbiAgICAgIGlmIChtYXRjaCgnPycpKSB7XG4gICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgcHJldmlvdXNBbGxvd0luID0gc3RhdGUuYWxsb3dJbjtcbiAgICAgICAgICBzdGF0ZS5hbGxvd0luID0gdHJ1ZTtcbiAgICAgICAgICBjb25zZXF1ZW50ID0gcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICAgIHN0YXRlLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG4gICAgICAgICAgZXhwZWN0KCc6Jyk7XG4gICAgICAgICAgYWx0ZXJuYXRlID0gcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuXG4gICAgICAgICAgZXhwciA9IG5ldyBXcmFwcGluZ05vZGUoc3RhcnRUb2tlbikuZmluaXNoQ29uZGl0aW9uYWxFeHByZXNzaW9uKGV4cHIsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgLy8gMTEuMTMgQXNzaWdubWVudCBPcGVyYXRvcnNcblxuICBmdW5jdGlvbiBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkge1xuICAgICAgdmFyIG9sZFBhcmVudGhlc2lzQ291bnQsIHRva2VuLCBleHByLCByaWdodCwgbGlzdCwgc3RhcnRUb2tlbjtcblxuICAgICAgb2xkUGFyZW50aGVzaXNDb3VudCA9IHN0YXRlLnBhcmVudGhlc2lzQ291bnQ7XG5cbiAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICB0b2tlbiA9IGxvb2thaGVhZDtcblxuICAgICAgZXhwciA9IHBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKCk7XG5cbiAgICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgLy8gMTEuMTQgQ29tbWEgT3BlcmF0b3JcblxuICBmdW5jdGlvbiBwYXJzZUV4cHJlc3Npb24oKSB7XG4gICAgICB2YXIgZXhwciwgc3RhcnRUb2tlbiA9IGxvb2thaGVhZCwgZXhwcmVzc2lvbnM7XG5cbiAgICAgIGV4cHIgPSBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG5cbiAgICAgIGlmIChtYXRjaCgnLCcpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGlzYWJsZWQuXCIpOyAvLyBubyBzZXF1ZW5jZSBleHByZXNzaW9uc1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIC8vIDEyLjQgRXhwcmVzc2lvbiBTdGF0ZW1lbnRcblxuICBmdW5jdGlvbiBwYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSkge1xuICAgICAgdmFyIGV4cHIgPSBwYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIGNvbnN1bWVTZW1pY29sb24oKTtcbiAgICAgIHJldHVybiBub2RlLmZpbmlzaEV4cHJlc3Npb25TdGF0ZW1lbnQoZXhwcik7XG4gIH1cblxuICAvLyAxMiBTdGF0ZW1lbnRzXG5cbiAgZnVuY3Rpb24gcGFyc2VTdGF0ZW1lbnQoKSB7XG4gICAgICB2YXIgdHlwZSA9IGxvb2thaGVhZC50eXBlLFxuICAgICAgICAgIGV4cHIsXG4gICAgICAgICAgbGFiZWxlZEJvZHksXG4gICAgICAgICAga2V5LFxuICAgICAgICAgIG5vZGU7XG5cbiAgICAgIGlmICh0eXBlID09PSBUb2tlbi5FT0YpIHtcbiAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQobG9va2FoZWFkKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGUgPT09IFRva2VuLlB1bmN0dWF0b3IgJiYgbG9va2FoZWFkLnZhbHVlID09PSAneycpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEaXNhYmxlZC5cIik7IC8vIGJsb2NrIHN0YXRlbWVudFxuICAgICAgfVxuXG4gICAgICBub2RlID0gbmV3IE5vZGUoKTtcblxuICAgICAgaWYgKHR5cGUgPT09IFRva2VuLlB1bmN0dWF0b3IpIHtcbiAgICAgICAgICBzd2l0Y2ggKGxvb2thaGVhZC52YWx1ZSkge1xuICAgICAgICAgIGNhc2UgJzsnOlxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEaXNhYmxlZC5cIik7IC8vIGVtcHR5IHN0YXRlbWVudFxuICAgICAgICAgIGNhc2UgJygnOlxuICAgICAgICAgICAgICByZXR1cm4gcGFyc2VFeHByZXNzaW9uU3RhdGVtZW50KG5vZGUpO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gVG9rZW4uS2V5d29yZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpc2FibGVkLlwiKTsgLy8ga2V5d29yZFxuICAgICAgfVxuXG4gICAgICBleHByID0gcGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICBjb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgICByZXR1cm4gbm9kZS5maW5pc2hFeHByZXNzaW9uU3RhdGVtZW50KGV4cHIpO1xuICB9XG5cbiAgLy8gMTQgUHJvZ3JhbVxuXG4gIGZ1bmN0aW9uIHBhcnNlU291cmNlRWxlbWVudCgpIHtcbiAgICAgIGlmIChsb29rYWhlYWQudHlwZSA9PT0gVG9rZW4uS2V5d29yZCkge1xuICAgICAgICAgIHN3aXRjaCAobG9va2FoZWFkLnZhbHVlKSB7XG4gICAgICAgICAgY2FzZSAnY29uc3QnOlxuICAgICAgICAgIGNhc2UgJ2xldCc6XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpc2FibGVkLlwiKTtcbiAgICAgICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpc2FibGVkLlwiKTtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICByZXR1cm4gcGFyc2VTdGF0ZW1lbnQoKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChsb29rYWhlYWQudHlwZSAhPT0gVG9rZW4uRU9GKSB7XG4gICAgICAgICAgcmV0dXJuIHBhcnNlU3RhdGVtZW50KCk7XG4gICAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZVNvdXJjZUVsZW1lbnRzKCkge1xuICAgICAgdmFyIHNvdXJjZUVsZW1lbnQsIHNvdXJjZUVsZW1lbnRzID0gW10sIHRva2VuLCBkaXJlY3RpdmUsIGZpcnN0UmVzdHJpY3RlZDtcblxuICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgdG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLlN0cmluZ0xpdGVyYWwpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc291cmNlRWxlbWVudCA9IHBhcnNlU291cmNlRWxlbWVudCgpO1xuICAgICAgICAgIHNvdXJjZUVsZW1lbnRzLnB1c2goc291cmNlRWxlbWVudCk7XG4gICAgICAgICAgaWYgKHNvdXJjZUVsZW1lbnQuZXhwcmVzc2lvbi50eXBlICE9PSBTeW50YXguTGl0ZXJhbCkge1xuICAgICAgICAgICAgICAvLyB0aGlzIGlzIG5vdCBkaXJlY3RpdmVcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRpcmVjdGl2ZSA9IHNvdXJjZS5zbGljZSh0b2tlbi5zdGFydCArIDEsIHRva2VuLmVuZCAtIDEpO1xuICAgICAgICAgIGlmIChkaXJlY3RpdmUgPT09ICd1c2Ugc3RyaWN0Jykge1xuICAgICAgICAgICAgICBzdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgICBpZiAoZmlyc3RSZXN0cmljdGVkKSB7XG4gICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoZmlyc3RSZXN0cmljdGVkLCBNZXNzYWdlcy5TdHJpY3RPY3RhbExpdGVyYWwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKCFmaXJzdFJlc3RyaWN0ZWQgJiYgdG9rZW4ub2N0YWwpIHtcbiAgICAgICAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBzb3VyY2VFbGVtZW50ID0gcGFyc2VTb3VyY2VFbGVtZW50KCk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2VFbGVtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgc291cmNlRWxlbWVudHMucHVzaChzb3VyY2VFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzb3VyY2VFbGVtZW50cztcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlUHJvZ3JhbSgpIHtcbiAgICAgIHZhciBib2R5LCBub2RlO1xuXG4gICAgICBza2lwQ29tbWVudCgpO1xuICAgICAgcGVlaygpO1xuICAgICAgbm9kZSA9IG5ldyBOb2RlKCk7XG4gICAgICBzdHJpY3QgPSB0cnVlOyAvLyBhc3N1bWUgc3RyaWN0XG5cbiAgICAgIGJvZHkgPSBwYXJzZVNvdXJjZUVsZW1lbnRzKCk7XG4gICAgICByZXR1cm4gbm9kZS5maW5pc2hQcm9ncmFtKGJvZHkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZmlsdGVyVG9rZW5Mb2NhdGlvbigpIHtcbiAgICAgIHZhciBpLCBlbnRyeSwgdG9rZW4sIHRva2VucyA9IFtdO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgZXh0cmEudG9rZW5zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgZW50cnkgPSBleHRyYS50b2tlbnNbaV07XG4gICAgICAgICAgdG9rZW4gPSB7XG4gICAgICAgICAgICAgIHR5cGU6IGVudHJ5LnR5cGUsXG4gICAgICAgICAgICAgIHZhbHVlOiBlbnRyeS52YWx1ZVxuICAgICAgICAgIH07XG4gICAgICAgICAgaWYgKGVudHJ5LnJlZ2V4KSB7XG4gICAgICAgICAgICAgIHRva2VuLnJlZ2V4ID0ge1xuICAgICAgICAgICAgICAgICAgcGF0dGVybjogZW50cnkucmVnZXgucGF0dGVybixcbiAgICAgICAgICAgICAgICAgIGZsYWdzOiBlbnRyeS5yZWdleC5mbGFnc1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZXh0cmEucmFuZ2UpIHtcbiAgICAgICAgICAgICAgdG9rZW4ucmFuZ2UgPSBlbnRyeS5yYW5nZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGV4dHJhLmxvYykge1xuICAgICAgICAgICAgICB0b2tlbi5sb2MgPSBlbnRyeS5sb2M7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgIH1cblxuICAgICAgZXh0cmEudG9rZW5zID0gdG9rZW5zO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9rZW5pemUoY29kZSwgb3B0aW9ucykge1xuICAgICAgdmFyIHRvU3RyaW5nLFxuICAgICAgICAgIHRva2VucztcblxuICAgICAgdG9TdHJpbmcgPSBTdHJpbmc7XG4gICAgICBpZiAodHlwZW9mIGNvZGUgIT09ICdzdHJpbmcnICYmICEoY29kZSBpbnN0YW5jZW9mIFN0cmluZykpIHtcbiAgICAgICAgICBjb2RlID0gdG9TdHJpbmcoY29kZSk7XG4gICAgICB9XG5cbiAgICAgIHNvdXJjZSA9IGNvZGU7XG4gICAgICBpbmRleCA9IDA7XG4gICAgICBsaW5lTnVtYmVyID0gKHNvdXJjZS5sZW5ndGggPiAwKSA/IDEgOiAwO1xuICAgICAgbGluZVN0YXJ0ID0gMDtcbiAgICAgIGxlbmd0aCA9IHNvdXJjZS5sZW5ndGg7XG4gICAgICBsb29rYWhlYWQgPSBudWxsO1xuICAgICAgc3RhdGUgPSB7XG4gICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICBsYWJlbFNldDoge30sXG4gICAgICAgICAgaW5GdW5jdGlvbkJvZHk6IGZhbHNlLFxuICAgICAgICAgIGluSXRlcmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICBpblN3aXRjaDogZmFsc2UsXG4gICAgICAgICAgbGFzdENvbW1lbnRTdGFydDogLTFcbiAgICAgIH07XG5cbiAgICAgIGV4dHJhID0ge307XG5cbiAgICAgIC8vIE9wdGlvbnMgbWF0Y2hpbmcuXG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgLy8gT2YgY291cnNlIHdlIGNvbGxlY3QgdG9rZW5zIGhlcmUuXG4gICAgICBvcHRpb25zLnRva2VucyA9IHRydWU7XG4gICAgICBleHRyYS50b2tlbnMgPSBbXTtcbiAgICAgIGV4dHJhLnRva2VuaXplID0gdHJ1ZTtcbiAgICAgIC8vIFRoZSBmb2xsb3dpbmcgdHdvIGZpZWxkcyBhcmUgbmVjZXNzYXJ5IHRvIGNvbXB1dGUgdGhlIFJlZ2V4IHRva2Vucy5cbiAgICAgIGV4dHJhLm9wZW5QYXJlblRva2VuID0gLTE7XG4gICAgICBleHRyYS5vcGVuQ3VybHlUb2tlbiA9IC0xO1xuXG4gICAgICBleHRyYS5yYW5nZSA9ICh0eXBlb2Ygb3B0aW9ucy5yYW5nZSA9PT0gJ2Jvb2xlYW4nKSAmJiBvcHRpb25zLnJhbmdlO1xuICAgICAgZXh0cmEubG9jID0gKHR5cGVvZiBvcHRpb25zLmxvYyA9PT0gJ2Jvb2xlYW4nKSAmJiBvcHRpb25zLmxvYztcblxuICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRvbGVyYW50ID09PSAnYm9vbGVhbicgJiYgb3B0aW9ucy50b2xlcmFudCkge1xuICAgICAgICAgIGV4dHJhLmVycm9ycyA9IFtdO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICAgIHBlZWsoKTtcbiAgICAgICAgICBpZiAobG9va2FoZWFkLnR5cGUgPT09IFRva2VuLkVPRikge1xuICAgICAgICAgICAgICByZXR1cm4gZXh0cmEudG9rZW5zO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxleCgpO1xuICAgICAgICAgIHdoaWxlIChsb29rYWhlYWQudHlwZSAhPT0gVG9rZW4uRU9GKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAobGV4RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChleHRyYS5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICBleHRyYS5lcnJvcnMucHVzaChsZXhFcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gV2UgaGF2ZSB0byBicmVhayBvbiB0aGUgZmlyc3QgZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAvLyB0byBhdm9pZCBpbmZpbml0ZSBsb29wcy5cbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbGV4RXJyb3I7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmaWx0ZXJUb2tlbkxvY2F0aW9uKCk7XG4gICAgICAgICAgdG9rZW5zID0gZXh0cmEudG9rZW5zO1xuICAgICAgICAgIGlmICh0eXBlb2YgZXh0cmEuZXJyb3JzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICB0b2tlbnMuZXJyb3JzID0gZXh0cmEuZXJyb3JzO1xuICAgICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBleHRyYSA9IHt9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRva2VucztcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlKGNvZGUsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBwcm9ncmFtLCB0b1N0cmluZztcblxuICAgICAgdG9TdHJpbmcgPSBTdHJpbmc7XG4gICAgICBpZiAodHlwZW9mIGNvZGUgIT09ICdzdHJpbmcnICYmICEoY29kZSBpbnN0YW5jZW9mIFN0cmluZykpIHtcbiAgICAgICAgICBjb2RlID0gdG9TdHJpbmcoY29kZSk7XG4gICAgICB9XG5cbiAgICAgIHNvdXJjZSA9IGNvZGU7XG4gICAgICBpbmRleCA9IDA7XG4gICAgICBsaW5lTnVtYmVyID0gKHNvdXJjZS5sZW5ndGggPiAwKSA/IDEgOiAwO1xuICAgICAgbGluZVN0YXJ0ID0gMDtcbiAgICAgIGxlbmd0aCA9IHNvdXJjZS5sZW5ndGg7XG4gICAgICBsb29rYWhlYWQgPSBudWxsO1xuICAgICAgc3RhdGUgPSB7XG4gICAgICAgICAgYWxsb3dJbjogdHJ1ZSxcbiAgICAgICAgICBsYWJlbFNldDoge30sXG4gICAgICAgICAgcGFyZW50aGVzaXNDb3VudDogMCxcbiAgICAgICAgICBpbkZ1bmN0aW9uQm9keTogZmFsc2UsXG4gICAgICAgICAgaW5JdGVyYXRpb246IGZhbHNlLFxuICAgICAgICAgIGluU3dpdGNoOiBmYWxzZSxcbiAgICAgICAgICBsYXN0Q29tbWVudFN0YXJ0OiAtMVxuICAgICAgfTtcblxuICAgICAgZXh0cmEgPSB7fTtcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBleHRyYS5yYW5nZSA9ICh0eXBlb2Ygb3B0aW9ucy5yYW5nZSA9PT0gJ2Jvb2xlYW4nKSAmJiBvcHRpb25zLnJhbmdlO1xuICAgICAgICAgIGV4dHJhLmxvYyA9ICh0eXBlb2Ygb3B0aW9ucy5sb2MgPT09ICdib29sZWFuJykgJiYgb3B0aW9ucy5sb2M7XG5cbiAgICAgICAgICBpZiAoZXh0cmEubG9jICYmIG9wdGlvbnMuc291cmNlICE9PSBudWxsICYmIG9wdGlvbnMuc291cmNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgZXh0cmEuc291cmNlID0gdG9TdHJpbmcob3B0aW9ucy5zb3VyY2UpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50b2tlbnMgPT09ICdib29sZWFuJyAmJiBvcHRpb25zLnRva2Vucykge1xuICAgICAgICAgICAgICBleHRyYS50b2tlbnMgPSBbXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRvbGVyYW50ID09PSAnYm9vbGVhbicgJiYgb3B0aW9ucy50b2xlcmFudCkge1xuICAgICAgICAgICAgICBleHRyYS5lcnJvcnMgPSBbXTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgICAgcHJvZ3JhbSA9IHBhcnNlUHJvZ3JhbSgpO1xuICAgICAgICAgIGlmICh0eXBlb2YgZXh0cmEudG9rZW5zICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBmaWx0ZXJUb2tlbkxvY2F0aW9uKCk7XG4gICAgICAgICAgICAgIHByb2dyYW0udG9rZW5zID0gZXh0cmEudG9rZW5zO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZW9mIGV4dHJhLmVycm9ycyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgcHJvZ3JhbS5lcnJvcnMgPSBleHRyYS5lcnJvcnM7XG4gICAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHRocm93IGU7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGV4dHJhID0ge307XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcm9ncmFtO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0b2tlbml6ZTogdG9rZW5pemUsXG4gICAgcGFyc2U6IHBhcnNlXG4gIH07XG5cbn0pKCk7IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIGF4cyA9IHJlcXVpcmUoJy4uL3NjZW5lL2F4aXMnKSxcbiAgICBjb25maWcgPSByZXF1aXJlKCcuLi91dGlsL2NvbmZpZycpO1xuXG52YXIgT1JJRU5UID0ge1xuICBcInhcIjogICAgICBcImJvdHRvbVwiLFxuICBcInlcIjogICAgICBcImxlZnRcIixcbiAgXCJ0b3BcIjogICAgXCJ0b3BcIixcbiAgXCJib3R0b21cIjogXCJib3R0b21cIixcbiAgXCJsZWZ0XCI6ICAgXCJsZWZ0XCIsXG4gIFwicmlnaHRcIjogIFwicmlnaHRcIlxufTtcblxuZnVuY3Rpb24gYXhlcyhtb2RlbCwgc3BlYywgYXhlcywgZ3JvdXApIHtcbiAgKHNwZWMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oZGVmLCBpbmRleCkge1xuICAgIGF4ZXNbaW5kZXhdID0gYXhlc1tpbmRleF0gfHwgYXhzKG1vZGVsKTtcbiAgICBheGlzKGRlZiwgaW5kZXgsIGF4ZXNbaW5kZXhdLCBncm91cCk7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gYXhpcyhkZWYsIGluZGV4LCBheGlzLCBncm91cCkge1xuICAvLyBheGlzIHNjYWxlXG4gIGlmIChkZWYuc2NhbGUgIT09IHVuZGVmaW5lZCkge1xuICAgIGF4aXMuc2NhbGUoZ3JvdXAuc2NhbGUoZGVmLnNjYWxlKSk7XG4gIH1cblxuICAvLyBheGlzIG9yaWVudGF0aW9uXG4gIGF4aXMub3JpZW50KGRlZi5vcmllbnQgfHwgT1JJRU5UW2RlZi50eXBlXSk7XG4gIC8vIGF4aXMgb2Zmc2V0XG4gIGF4aXMub2Zmc2V0KGRlZi5vZmZzZXQgfHwgMCk7XG4gIC8vIGF4aXMgbGF5ZXJcbiAgYXhpcy5sYXllcihkZWYubGF5ZXIgfHwgXCJmcm9udFwiKTtcbiAgLy8gYXhpcyBncmlkIGxpbmVzXG4gIGF4aXMuZ3JpZChkZWYuZ3JpZCB8fCBmYWxzZSk7XG4gIC8vIGF4aXMgdGl0bGVcbiAgYXhpcy50aXRsZShkZWYudGl0bGUgfHwgbnVsbCk7XG4gIC8vIGF4aXMgdGl0bGUgb2Zmc2V0XG4gIGF4aXMudGl0bGVPZmZzZXQoZGVmLnRpdGxlT2Zmc2V0ICE9IG51bGxcbiAgICA/IGRlZi50aXRsZU9mZnNldCA6IGNvbmZpZy5heGlzLnRpdGxlT2Zmc2V0KTtcbiAgLy8gYXhpcyB2YWx1ZXNcbiAgYXhpcy50aWNrVmFsdWVzKGRlZi52YWx1ZXMgfHwgbnVsbCk7XG4gIC8vIGF4aXMgbGFiZWwgZm9ybWF0dGluZ1xuICBheGlzLnRpY2tGb3JtYXQoZGVmLmZvcm1hdCB8fCBudWxsKTtcbiAgLy8gYXhpcyB0aWNrIHN1YmRpdmlzaW9uXG4gIGF4aXMudGlja1N1YmRpdmlkZShkZWYuc3ViZGl2aWRlIHx8IDApO1xuICAvLyBheGlzIHRpY2sgcGFkZGluZ1xuICBheGlzLnRpY2tQYWRkaW5nKGRlZi50aWNrUGFkZGluZyB8fCBjb25maWcuYXhpcy5wYWRkaW5nKTtcblxuICAvLyBheGlzIHRpY2sgc2l6ZShzKVxuICB2YXIgc2l6ZSA9IFtdO1xuICBpZiAoZGVmLnRpY2tTaXplICE9PSB1bmRlZmluZWQpIHtcbiAgICBmb3IgKHZhciBpPTA7IGk8MzsgKytpKSBzaXplLnB1c2goZGVmLnRpY2tTaXplKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgdHMgPSBjb25maWcuYXhpcy50aWNrU2l6ZTtcbiAgICBzaXplID0gW3RzLCB0cywgdHNdO1xuICB9XG4gIGlmIChkZWYudGlja1NpemVNYWpvciAhPSBudWxsKSBzaXplWzBdID0gZGVmLnRpY2tTaXplTWFqb3I7XG4gIGlmIChkZWYudGlja1NpemVNaW5vciAhPSBudWxsKSBzaXplWzFdID0gZGVmLnRpY2tTaXplTWlub3I7XG4gIGlmIChkZWYudGlja1NpemVFbmQgICAhPSBudWxsKSBzaXplWzJdID0gZGVmLnRpY2tTaXplRW5kO1xuICBpZiAoc2l6ZS5sZW5ndGgpIHtcbiAgICBheGlzLnRpY2tTaXplLmFwcGx5KGF4aXMsIHNpemUpO1xuICB9XG5cbiAgLy8gdGljayBhcmd1bWVudHNcbiAgaWYgKGRlZi50aWNrcyAhPSBudWxsKSB7XG4gICAgdmFyIHRpY2tzID0gZGwuaXNBcnJheShkZWYudGlja3MpID8gZGVmLnRpY2tzIDogW2RlZi50aWNrc107XG4gICAgYXhpcy50aWNrcy5hcHBseShheGlzLCB0aWNrcyk7XG4gIH0gZWxzZSB7XG4gICAgYXhpcy50aWNrcyhjb25maWcuYXhpcy50aWNrcyk7XG4gIH1cblxuICAvLyBzdHlsZSBwcm9wZXJ0aWVzXG4gIHZhciBwID0gZGVmLnByb3BlcnRpZXM7XG4gIGlmIChwICYmIHAudGlja3MpIHtcbiAgICBheGlzLm1ham9yVGlja1Byb3BlcnRpZXMocC5tYWpvclRpY2tzXG4gICAgICA/IGRsLmV4dGVuZCh7fSwgcC50aWNrcywgcC5tYWpvclRpY2tzKSA6IHAudGlja3MpO1xuICAgIGF4aXMubWlub3JUaWNrUHJvcGVydGllcyhwLm1pbm9yVGlja3NcbiAgICAgID8gZGwuZXh0ZW5kKHt9LCBwLnRpY2tzLCBwLm1pbm9yVGlja3MpIDogcC50aWNrcyk7XG4gIH0gZWxzZSB7XG4gICAgYXhpcy5tYWpvclRpY2tQcm9wZXJ0aWVzKHAgJiYgcC5tYWpvclRpY2tzIHx8IHt9KTtcbiAgICBheGlzLm1pbm9yVGlja1Byb3BlcnRpZXMocCAmJiBwLm1pbm9yVGlja3MgfHwge30pO1xuICB9XG4gIGF4aXMudGlja0xhYmVsUHJvcGVydGllcyhwICYmIHAubGFiZWxzIHx8IHt9KTtcbiAgYXhpcy50aXRsZVByb3BlcnRpZXMocCAmJiBwLnRpdGxlIHx8IHt9KTtcbiAgYXhpcy5ncmlkTGluZVByb3BlcnRpZXMocCAmJiBwLmdyaWQgfHwge30pO1xuICBheGlzLmRvbWFpblByb3BlcnRpZXMocCAmJiBwLmF4aXMgfHwge30pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGF4ZXM7IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIGNvbmZpZyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uZmlnJyksXG4gICAgcGFyc2VUcmFuc2Zvcm1zID0gcmVxdWlyZSgnLi90cmFuc2Zvcm1zJyksXG4gICAgcGFyc2VNb2RpZnkgPSByZXF1aXJlKCcuL21vZGlmeScpO1xuXG52YXIgcGFyc2VEYXRhID0gZnVuY3Rpb24obW9kZWwsIHNwZWMsIGNhbGxiYWNrKSB7XG4gIHZhciBjb3VudCA9IDA7XG5cbiAgZnVuY3Rpb24gbG9hZGVkKGQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXJyb3IsIGRhdGEpIHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBkbC5lcnJvcihcIkxPQURJTkcgRkFJTEVEOiBcIiArIGQudXJsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1vZGVsLmRhdGEoZC5uYW1lKS52YWx1ZXMoZGwucmVhZChkYXRhLCBkLmZvcm1hdCkpO1xuICAgICAgfVxuICAgICAgaWYgKC0tY291bnQgPT09IDApIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gcHJvY2VzcyBlYWNoIGRhdGEgc2V0IGRlZmluaXRpb25cbiAgKHNwZWMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgIGlmIChkLnVybCkge1xuICAgICAgY291bnQgKz0gMTtcbiAgICAgIGRsLmxvYWQoZGwuZXh0ZW5kKHt1cmw6IGQudXJsfSwgY29uZmlnLmxvYWQpLCBsb2FkZWQoZCkpO1xuICAgIH1cbiAgICBwYXJzZURhdGEuZGF0YXNvdXJjZShtb2RlbCwgZCk7XG4gIH0pO1xuXG4gIGlmIChjb3VudCA9PT0gMCkgc2V0VGltZW91dChjYWxsYmFjaywgMSk7XG4gIHJldHVybiBzcGVjO1xufTtcblxucGFyc2VEYXRhLmRhdGFzb3VyY2UgPSBmdW5jdGlvbihtb2RlbCwgZCkge1xuICB2YXIgdHJhbnNmb3JtID0gKGQudHJhbnNmb3JtfHxbXSkubWFwKGZ1bmN0aW9uKHQpIHsgcmV0dXJuIHBhcnNlVHJhbnNmb3Jtcyhtb2RlbCwgdCkgfSksXG4gICAgICBtb2QgPSAoZC5tb2RpZnl8fFtdKS5tYXAoZnVuY3Rpb24obSkgeyByZXR1cm4gcGFyc2VNb2RpZnkobW9kZWwsIG0sIGQpIH0pLFxuICAgICAgZHMgPSBtb2RlbC5kYXRhKGQubmFtZSwgbW9kLmNvbmNhdCh0cmFuc2Zvcm0pKTtcblxuICBpZiAoZC52YWx1ZXMpIHtcbiAgICBkcy52YWx1ZXMoZGwucmVhZChkLnZhbHVlcywgZC5mb3JtYXQpKTtcbiAgfSBlbHNlIGlmIChkLnNvdXJjZSkge1xuICAgIGRzLnNvdXJjZShkLnNvdXJjZSlcbiAgICAgIC5yZXZpc2VzKGRzLnJldmlzZXMoKSkgLy8gSWYgbmV3IGRzIHJldmlzZXMsIHRoZW4gaXQncyBvcmlnaW4gbXVzdCByZXZpc2UgdG9vLlxuICAgICAgLmFkZExpc3RlbmVyKGRzKTsgIC8vIERlcml2ZWQgZHMgd2lsbCBiZSBwdWxzZWQgYnkgaXRzIHNyYyByYXRoZXIgdGhhbiB0aGUgbW9kZWwuXG4gICAgbW9kZWwucmVtb3ZlTGlzdGVuZXIoZHMucGlwZWxpbmUoKVswXSk7IFxuICB9XG5cbiAgcmV0dXJuIGRzOyAgICBcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcGFyc2VEYXRhOyIsIi8qXG4gKiBHZW5lcmF0ZWQgYnkgUEVHLmpzIDAuOC4wLlxuICpcbiAqIGh0dHA6Ly9wZWdqcy5tYWpkYS5jei9cbiAqL1xuXG5mdW5jdGlvbiBwZWckc3ViY2xhc3MoY2hpbGQsIHBhcmVudCkge1xuICBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH1cbiAgY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlO1xuICBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpO1xufVxuXG5mdW5jdGlvbiBTeW50YXhFcnJvcihtZXNzYWdlLCBleHBlY3RlZCwgZm91bmQsIG9mZnNldCwgbGluZSwgY29sdW1uKSB7XG4gIHRoaXMubWVzc2FnZSAgPSBtZXNzYWdlO1xuICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWQ7XG4gIHRoaXMuZm91bmQgICAgPSBmb3VuZDtcbiAgdGhpcy5vZmZzZXQgICA9IG9mZnNldDtcbiAgdGhpcy5saW5lICAgICA9IGxpbmU7XG4gIHRoaXMuY29sdW1uICAgPSBjb2x1bW47XG5cbiAgdGhpcy5uYW1lICAgICA9IFwiU3ludGF4RXJyb3JcIjtcbn1cblxucGVnJHN1YmNsYXNzKFN5bnRheEVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHBhcnNlKGlucHV0KSB7XG4gIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiB7fSxcblxuICAgICAgcGVnJEZBSUxFRCA9IHt9LFxuXG4gICAgICBwZWckc3RhcnRSdWxlRnVuY3Rpb25zID0geyBzdGFydDogcGVnJHBhcnNlc3RhcnQgfSxcbiAgICAgIHBlZyRzdGFydFJ1bGVGdW5jdGlvbiAgPSBwZWckcGFyc2VzdGFydCxcblxuICAgICAgcGVnJGMwID0gcGVnJEZBSUxFRCxcbiAgICAgIHBlZyRjMSA9IFwiLFwiLFxuICAgICAgcGVnJGMyID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiLFwiLCBkZXNjcmlwdGlvbjogXCJcXFwiLFxcXCJcIiB9LFxuICAgICAgcGVnJGMzID0gZnVuY3Rpb24obywgbSkgeyByZXR1cm4gW29dLmNvbmNhdChtKSB9LFxuICAgICAgcGVnJGM0ID0gZnVuY3Rpb24obykgeyByZXR1cm4gW29dIH0sXG4gICAgICBwZWckYzUgPSBcIltcIixcbiAgICAgIHBlZyRjNiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIltcIiwgZGVzY3JpcHRpb246IFwiXFxcIltcXFwiXCIgfSxcbiAgICAgIHBlZyRjNyA9IFwiXVwiLFxuICAgICAgcGVnJGM4ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiXVwiLCBkZXNjcmlwdGlvbjogXCJcXFwiXVxcXCJcIiB9LFxuICAgICAgcGVnJGM5ID0gXCI+XCIsXG4gICAgICBwZWckYzEwID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiPlwiLCBkZXNjcmlwdGlvbjogXCJcXFwiPlxcXCJcIiB9LFxuICAgICAgcGVnJGMxMSA9IGZ1bmN0aW9uKGYxLCBmMiwgbykgeyByZXR1cm4ge3N0YXJ0OiBmMSwgZW5kOiBmMiwgbWlkZGxlOiBvfX0sXG4gICAgICBwZWckYzEyID0gW10sXG4gICAgICBwZWckYzEzID0gZnVuY3Rpb24ocywgZikgeyByZXR1cm4gKHMuZmlsdGVycyA9IGYpLCBzIH0sXG4gICAgICBwZWckYzE0ID0gZnVuY3Rpb24ocykgeyByZXR1cm4gcyB9LFxuICAgICAgcGVnJGMxNSA9IG51bGwsXG4gICAgICBwZWckYzE2ID0gZnVuY3Rpb24odCwgZSkgeyByZXR1cm4geyBldmVudDogZSwgdGFyZ2V0OiB0IH0gfSxcbiAgICAgIHBlZyRjMTcgPSAvXls6YS16QS16MC05X1xcLV0vLFxuICAgICAgcGVnJGMxOCA9IHsgdHlwZTogXCJjbGFzc1wiLCB2YWx1ZTogXCJbOmEtekEtejAtOV9cXFxcLV1cIiwgZGVzY3JpcHRpb246IFwiWzphLXpBLXowLTlfXFxcXC1dXCIgfSxcbiAgICAgIHBlZyRjMTkgPSBmdW5jdGlvbihzKSB7IHJldHVybiB7IHNpZ25hbDogcy5qb2luKFwiXCIpIH19LFxuICAgICAgcGVnJGMyMCA9IFwiKFwiLFxuICAgICAgcGVnJGMyMSA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIihcIiwgZGVzY3JpcHRpb246IFwiXFxcIihcXFwiXCIgfSxcbiAgICAgIHBlZyRjMjIgPSBcIilcIixcbiAgICAgIHBlZyRjMjMgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCIpXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCIpXFxcIlwiIH0sXG4gICAgICBwZWckYzI0ID0gZnVuY3Rpb24obSkgeyByZXR1cm4geyBzdHJlYW06IG0gfX0sXG4gICAgICBwZWckYzI1ID0gXCIuXCIsXG4gICAgICBwZWckYzI2ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiLlwiLCBkZXNjcmlwdGlvbjogXCJcXFwiLlxcXCJcIiB9LFxuICAgICAgcGVnJGMyNyA9IFwiOlwiLFxuICAgICAgcGVnJGMyOCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIjpcIiwgZGVzY3JpcHRpb246IFwiXFxcIjpcXFwiXCIgfSxcbiAgICAgIHBlZyRjMjkgPSBmdW5jdGlvbihjKSB7IHJldHVybiB7IHR5cGU6J2NsYXNzJywgdmFsdWU6IGMgfSB9LFxuICAgICAgcGVnJGMzMCA9IFwiI1wiLFxuICAgICAgcGVnJGMzMSA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIiNcIiwgZGVzY3JpcHRpb246IFwiXFxcIiNcXFwiXCIgfSxcbiAgICAgIHBlZyRjMzIgPSBmdW5jdGlvbihpZCkgeyByZXR1cm4geyB0eXBlOidpZCcsIHZhbHVlOiBpZCB9IH0sXG4gICAgICBwZWckYzMzID0gXCJtb3VzZWRvd25cIixcbiAgICAgIHBlZyRjMzQgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJtb3VzZWRvd25cIiwgZGVzY3JpcHRpb246IFwiXFxcIm1vdXNlZG93blxcXCJcIiB9LFxuICAgICAgcGVnJGMzNSA9IFwibW91c2V1cFwiLFxuICAgICAgcGVnJGMzNiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIm1vdXNldXBcIiwgZGVzY3JpcHRpb246IFwiXFxcIm1vdXNldXBcXFwiXCIgfSxcbiAgICAgIHBlZyRjMzcgPSBcImNsaWNrXCIsXG4gICAgICBwZWckYzM4ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiY2xpY2tcIiwgZGVzY3JpcHRpb246IFwiXFxcImNsaWNrXFxcIlwiIH0sXG4gICAgICBwZWckYzM5ID0gXCJkYmxjbGlja1wiLFxuICAgICAgcGVnJGM0MCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcImRibGNsaWNrXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJkYmxjbGlja1xcXCJcIiB9LFxuICAgICAgcGVnJGM0MSA9IFwid2hlZWxcIixcbiAgICAgIHBlZyRjNDIgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJ3aGVlbFwiLCBkZXNjcmlwdGlvbjogXCJcXFwid2hlZWxcXFwiXCIgfSxcbiAgICAgIHBlZyRjNDMgPSBcImtleWRvd25cIixcbiAgICAgIHBlZyRjNDQgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJrZXlkb3duXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJrZXlkb3duXFxcIlwiIH0sXG4gICAgICBwZWckYzQ1ID0gXCJrZXlwcmVzc1wiLFxuICAgICAgcGVnJGM0NiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcImtleXByZXNzXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJrZXlwcmVzc1xcXCJcIiB9LFxuICAgICAgcGVnJGM0NyA9IFwia2V5dXBcIixcbiAgICAgIHBlZyRjNDggPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJrZXl1cFwiLCBkZXNjcmlwdGlvbjogXCJcXFwia2V5dXBcXFwiXCIgfSxcbiAgICAgIHBlZyRjNDkgPSBcIm1vdXNld2hlZWxcIixcbiAgICAgIHBlZyRjNTAgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJtb3VzZXdoZWVsXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJtb3VzZXdoZWVsXFxcIlwiIH0sXG4gICAgICBwZWckYzUxID0gXCJtb3VzZW1vdmVcIixcbiAgICAgIHBlZyRjNTIgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJtb3VzZW1vdmVcIiwgZGVzY3JpcHRpb246IFwiXFxcIm1vdXNlbW92ZVxcXCJcIiB9LFxuICAgICAgcGVnJGM1MyA9IFwibW91c2VvdXRcIixcbiAgICAgIHBlZyRjNTQgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJtb3VzZW91dFwiLCBkZXNjcmlwdGlvbjogXCJcXFwibW91c2VvdXRcXFwiXCIgfSxcbiAgICAgIHBlZyRjNTUgPSBcIm1vdXNlb3ZlclwiLFxuICAgICAgcGVnJGM1NiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIm1vdXNlb3ZlclwiLCBkZXNjcmlwdGlvbjogXCJcXFwibW91c2VvdmVyXFxcIlwiIH0sXG4gICAgICBwZWckYzU3ID0gXCJtb3VzZWVudGVyXCIsXG4gICAgICBwZWckYzU4ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwibW91c2VlbnRlclwiLCBkZXNjcmlwdGlvbjogXCJcXFwibW91c2VlbnRlclxcXCJcIiB9LFxuICAgICAgcGVnJGM1OSA9IFwidG91Y2hzdGFydFwiLFxuICAgICAgcGVnJGM2MCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcInRvdWNoc3RhcnRcIiwgZGVzY3JpcHRpb246IFwiXFxcInRvdWNoc3RhcnRcXFwiXCIgfSxcbiAgICAgIHBlZyRjNjEgPSBcInRvdWNobW92ZVwiLFxuICAgICAgcGVnJGM2MiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcInRvdWNobW92ZVwiLCBkZXNjcmlwdGlvbjogXCJcXFwidG91Y2htb3ZlXFxcIlwiIH0sXG4gICAgICBwZWckYzYzID0gXCJ0b3VjaGVuZFwiLFxuICAgICAgcGVnJGM2NCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcInRvdWNoZW5kXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJ0b3VjaGVuZFxcXCJcIiB9LFxuICAgICAgcGVnJGM2NSA9IGZ1bmN0aW9uKGZpZWxkKSB7IHJldHVybiBmaWVsZCAgfSxcbiAgICAgIHBlZyRjNjYgPSAvXlsnXCJhLXpBLVowLTlfLj48PSEgXFx0XFwtXS8sXG4gICAgICBwZWckYzY3ID0geyB0eXBlOiBcImNsYXNzXCIsIHZhbHVlOiBcIlsnXFxcImEtekEtWjAtOV8uPjw9ISBcXFxcdFxcXFwtXVwiLCBkZXNjcmlwdGlvbjogXCJbJ1xcXCJhLXpBLVowLTlfLj48PSEgXFxcXHRcXFxcLV1cIiB9LFxuICAgICAgcGVnJGM2OCA9IGZ1bmN0aW9uKHYpIHsgcmV0dXJuIHYuam9pbihcIlwiKSB9LFxuICAgICAgcGVnJGM2OSA9IC9eWyBcXHRcXHJcXG5dLyxcbiAgICAgIHBlZyRjNzAgPSB7IHR5cGU6IFwiY2xhc3NcIiwgdmFsdWU6IFwiWyBcXFxcdFxcXFxyXFxcXG5dXCIsIGRlc2NyaXB0aW9uOiBcIlsgXFxcXHRcXFxcclxcXFxuXVwiIH0sXG5cbiAgICAgIHBlZyRjdXJyUG9zICAgICAgICAgID0gMCxcbiAgICAgIHBlZyRyZXBvcnRlZFBvcyAgICAgID0gMCxcbiAgICAgIHBlZyRjYWNoZWRQb3MgICAgICAgID0gMCxcbiAgICAgIHBlZyRjYWNoZWRQb3NEZXRhaWxzID0geyBsaW5lOiAxLCBjb2x1bW46IDEsIHNlZW5DUjogZmFsc2UgfSxcbiAgICAgIHBlZyRtYXhGYWlsUG9zICAgICAgID0gMCxcbiAgICAgIHBlZyRtYXhGYWlsRXhwZWN0ZWQgID0gW10sXG4gICAgICBwZWckc2lsZW50RmFpbHMgICAgICA9IDAsXG5cbiAgICAgIHBlZyRyZXN1bHQ7XG5cbiAgaWYgKFwic3RhcnRSdWxlXCIgaW4gb3B0aW9ucykge1xuICAgIGlmICghKG9wdGlvbnMuc3RhcnRSdWxlIGluIHBlZyRzdGFydFJ1bGVGdW5jdGlvbnMpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBzdGFydCBwYXJzaW5nIGZyb20gcnVsZSBcXFwiXCIgKyBvcHRpb25zLnN0YXJ0UnVsZSArIFwiXFxcIi5cIik7XG4gICAgfVxuXG4gICAgcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uID0gcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uc1tvcHRpb25zLnN0YXJ0UnVsZV07XG4gIH1cblxuICBmdW5jdGlvbiB0ZXh0KCkge1xuICAgIHJldHVybiBpbnB1dC5zdWJzdHJpbmcocGVnJHJlcG9ydGVkUG9zLCBwZWckY3VyclBvcyk7XG4gIH1cblxuICBmdW5jdGlvbiBvZmZzZXQoKSB7XG4gICAgcmV0dXJuIHBlZyRyZXBvcnRlZFBvcztcbiAgfVxuXG4gIGZ1bmN0aW9uIGxpbmUoKSB7XG4gICAgcmV0dXJuIHBlZyRjb21wdXRlUG9zRGV0YWlscyhwZWckcmVwb3J0ZWRQb3MpLmxpbmU7XG4gIH1cblxuICBmdW5jdGlvbiBjb2x1bW4oKSB7XG4gICAgcmV0dXJuIHBlZyRjb21wdXRlUG9zRGV0YWlscyhwZWckcmVwb3J0ZWRQb3MpLmNvbHVtbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4cGVjdGVkKGRlc2NyaXB0aW9uKSB7XG4gICAgdGhyb3cgcGVnJGJ1aWxkRXhjZXB0aW9uKFxuICAgICAgbnVsbCxcbiAgICAgIFt7IHR5cGU6IFwib3RoZXJcIiwgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uIH1dLFxuICAgICAgcGVnJHJlcG9ydGVkUG9zXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICB0aHJvdyBwZWckYnVpbGRFeGNlcHRpb24obWVzc2FnZSwgbnVsbCwgcGVnJHJlcG9ydGVkUG9zKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRjb21wdXRlUG9zRGV0YWlscyhwb3MpIHtcbiAgICBmdW5jdGlvbiBhZHZhbmNlKGRldGFpbHMsIHN0YXJ0UG9zLCBlbmRQb3MpIHtcbiAgICAgIHZhciBwLCBjaDtcblxuICAgICAgZm9yIChwID0gc3RhcnRQb3M7IHAgPCBlbmRQb3M7IHArKykge1xuICAgICAgICBjaCA9IGlucHV0LmNoYXJBdChwKTtcbiAgICAgICAgaWYgKGNoID09PSBcIlxcblwiKSB7XG4gICAgICAgICAgaWYgKCFkZXRhaWxzLnNlZW5DUikgeyBkZXRhaWxzLmxpbmUrKzsgfVxuICAgICAgICAgIGRldGFpbHMuY29sdW1uID0gMTtcbiAgICAgICAgICBkZXRhaWxzLnNlZW5DUiA9IGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBcIlxcclwiIHx8IGNoID09PSBcIlxcdTIwMjhcIiB8fCBjaCA9PT0gXCJcXHUyMDI5XCIpIHtcbiAgICAgICAgICBkZXRhaWxzLmxpbmUrKztcbiAgICAgICAgICBkZXRhaWxzLmNvbHVtbiA9IDE7XG4gICAgICAgICAgZGV0YWlscy5zZWVuQ1IgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRldGFpbHMuY29sdW1uKys7XG4gICAgICAgICAgZGV0YWlscy5zZWVuQ1IgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwZWckY2FjaGVkUG9zICE9PSBwb3MpIHtcbiAgICAgIGlmIChwZWckY2FjaGVkUG9zID4gcG9zKSB7XG4gICAgICAgIHBlZyRjYWNoZWRQb3MgPSAwO1xuICAgICAgICBwZWckY2FjaGVkUG9zRGV0YWlscyA9IHsgbGluZTogMSwgY29sdW1uOiAxLCBzZWVuQ1I6IGZhbHNlIH07XG4gICAgICB9XG4gICAgICBhZHZhbmNlKHBlZyRjYWNoZWRQb3NEZXRhaWxzLCBwZWckY2FjaGVkUG9zLCBwb3MpO1xuICAgICAgcGVnJGNhY2hlZFBvcyA9IHBvcztcbiAgICB9XG5cbiAgICByZXR1cm4gcGVnJGNhY2hlZFBvc0RldGFpbHM7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckZmFpbChleHBlY3RlZCkge1xuICAgIGlmIChwZWckY3VyclBvcyA8IHBlZyRtYXhGYWlsUG9zKSB7IHJldHVybjsgfVxuXG4gICAgaWYgKHBlZyRjdXJyUG9zID4gcGVnJG1heEZhaWxQb3MpIHtcbiAgICAgIHBlZyRtYXhGYWlsUG9zID0gcGVnJGN1cnJQb3M7XG4gICAgICBwZWckbWF4RmFpbEV4cGVjdGVkID0gW107XG4gICAgfVxuXG4gICAgcGVnJG1heEZhaWxFeHBlY3RlZC5wdXNoKGV4cGVjdGVkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRidWlsZEV4Y2VwdGlvbihtZXNzYWdlLCBleHBlY3RlZCwgcG9zKSB7XG4gICAgZnVuY3Rpb24gY2xlYW51cEV4cGVjdGVkKGV4cGVjdGVkKSB7XG4gICAgICB2YXIgaSA9IDE7XG5cbiAgICAgIGV4cGVjdGVkLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICBpZiAoYS5kZXNjcmlwdGlvbiA8IGIuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH0gZWxzZSBpZiAoYS5kZXNjcmlwdGlvbiA+IGIuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHdoaWxlIChpIDwgZXhwZWN0ZWQubGVuZ3RoKSB7XG4gICAgICAgIGlmIChleHBlY3RlZFtpIC0gMV0gPT09IGV4cGVjdGVkW2ldKSB7XG4gICAgICAgICAgZXhwZWN0ZWQuc3BsaWNlKGksIDEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJ1aWxkTWVzc2FnZShleHBlY3RlZCwgZm91bmQpIHtcbiAgICAgIGZ1bmN0aW9uIHN0cmluZ0VzY2FwZShzKSB7XG4gICAgICAgIGZ1bmN0aW9uIGhleChjaCkgeyByZXR1cm4gY2guY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTsgfVxuXG4gICAgICAgIHJldHVybiBzXG4gICAgICAgICAgLnJlcGxhY2UoL1xcXFwvZywgICAnXFxcXFxcXFwnKVxuICAgICAgICAgIC5yZXBsYWNlKC9cIi9nLCAgICAnXFxcXFwiJylcbiAgICAgICAgICAucmVwbGFjZSgvXFx4MDgvZywgJ1xcXFxiJylcbiAgICAgICAgICAucmVwbGFjZSgvXFx0L2csICAgJ1xcXFx0JylcbiAgICAgICAgICAucmVwbGFjZSgvXFxuL2csICAgJ1xcXFxuJylcbiAgICAgICAgICAucmVwbGFjZSgvXFxmL2csICAgJ1xcXFxmJylcbiAgICAgICAgICAucmVwbGFjZSgvXFxyL2csICAgJ1xcXFxyJylcbiAgICAgICAgICAucmVwbGFjZSgvW1xceDAwLVxceDA3XFx4MEJcXHgwRVxceDBGXS9nLCBmdW5jdGlvbihjaCkgeyByZXR1cm4gJ1xcXFx4MCcgKyBoZXgoY2gpOyB9KVxuICAgICAgICAgIC5yZXBsYWNlKC9bXFx4MTAtXFx4MUZcXHg4MC1cXHhGRl0vZywgICAgZnVuY3Rpb24oY2gpIHsgcmV0dXJuICdcXFxceCcgICsgaGV4KGNoKTsgfSlcbiAgICAgICAgICAucmVwbGFjZSgvW1xcdTAxODAtXFx1MEZGRl0vZywgICAgICAgICBmdW5jdGlvbihjaCkgeyByZXR1cm4gJ1xcXFx1MCcgKyBoZXgoY2gpOyB9KVxuICAgICAgICAgIC5yZXBsYWNlKC9bXFx1MTA4MC1cXHVGRkZGXS9nLCAgICAgICAgIGZ1bmN0aW9uKGNoKSB7IHJldHVybiAnXFxcXHUnICArIGhleChjaCk7IH0pO1xuICAgICAgfVxuXG4gICAgICB2YXIgZXhwZWN0ZWREZXNjcyA9IG5ldyBBcnJheShleHBlY3RlZC5sZW5ndGgpLFxuICAgICAgICAgIGV4cGVjdGVkRGVzYywgZm91bmREZXNjLCBpO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgZXhwZWN0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZXhwZWN0ZWREZXNjc1tpXSA9IGV4cGVjdGVkW2ldLmRlc2NyaXB0aW9uO1xuICAgICAgfVxuXG4gICAgICBleHBlY3RlZERlc2MgPSBleHBlY3RlZC5sZW5ndGggPiAxXG4gICAgICAgID8gZXhwZWN0ZWREZXNjcy5zbGljZSgwLCAtMSkuam9pbihcIiwgXCIpXG4gICAgICAgICAgICArIFwiIG9yIFwiXG4gICAgICAgICAgICArIGV4cGVjdGVkRGVzY3NbZXhwZWN0ZWQubGVuZ3RoIC0gMV1cbiAgICAgICAgOiBleHBlY3RlZERlc2NzWzBdO1xuXG4gICAgICBmb3VuZERlc2MgPSBmb3VuZCA/IFwiXFxcIlwiICsgc3RyaW5nRXNjYXBlKGZvdW5kKSArIFwiXFxcIlwiIDogXCJlbmQgb2YgaW5wdXRcIjtcblxuICAgICAgcmV0dXJuIFwiRXhwZWN0ZWQgXCIgKyBleHBlY3RlZERlc2MgKyBcIiBidXQgXCIgKyBmb3VuZERlc2MgKyBcIiBmb3VuZC5cIjtcbiAgICB9XG5cbiAgICB2YXIgcG9zRGV0YWlscyA9IHBlZyRjb21wdXRlUG9zRGV0YWlscyhwb3MpLFxuICAgICAgICBmb3VuZCAgICAgID0gcG9zIDwgaW5wdXQubGVuZ3RoID8gaW5wdXQuY2hhckF0KHBvcykgOiBudWxsO1xuXG4gICAgaWYgKGV4cGVjdGVkICE9PSBudWxsKSB7XG4gICAgICBjbGVhbnVwRXhwZWN0ZWQoZXhwZWN0ZWQpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgU3ludGF4RXJyb3IoXG4gICAgICBtZXNzYWdlICE9PSBudWxsID8gbWVzc2FnZSA6IGJ1aWxkTWVzc2FnZShleHBlY3RlZCwgZm91bmQpLFxuICAgICAgZXhwZWN0ZWQsXG4gICAgICBmb3VuZCxcbiAgICAgIHBvcyxcbiAgICAgIHBvc0RldGFpbHMubGluZSxcbiAgICAgIHBvc0RldGFpbHMuY29sdW1uXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZXN0YXJ0KCkge1xuICAgIHZhciBzMDtcblxuICAgIHMwID0gcGVnJHBhcnNlbWVyZ2VkKCk7XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VtZXJnZWQoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczU7XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIHMxID0gcGVnJHBhcnNlb3JkZXJlZCgpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VzZXAoKTtcbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ0KSB7XG4gICAgICAgICAgczMgPSBwZWckYzE7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzIpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczQgPSBwZWckcGFyc2VzZXAoKTtcbiAgICAgICAgICBpZiAoczQgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIHM1ID0gcGVnJHBhcnNlbWVyZ2VkKCk7XG4gICAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgICAgIHMxID0gcGVnJGMzKHMxLCBzNSk7XG4gICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJGMwO1xuICAgIH1cbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZW9yZGVyZWQoKTtcbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgczEgPSBwZWckYzQoczEpO1xuICAgICAgfVxuICAgICAgczAgPSBzMTtcbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VvcmRlcmVkKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMywgczQsIHM1LCBzNiwgczcsIHM4LCBzOSwgczEwLCBzMTEsIHMxMiwgczEzO1xuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDkxKSB7XG4gICAgICBzMSA9IHBlZyRjNTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2KTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gcGVnJHBhcnNlc2VwKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczMgPSBwZWckcGFyc2VmaWx0ZXJlZCgpO1xuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNCA9IHBlZyRwYXJzZXNlcCgpO1xuICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0NCkge1xuICAgICAgICAgICAgICBzNSA9IHBlZyRjMTtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHM1ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzIpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczUgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgczYgPSBwZWckcGFyc2VzZXAoKTtcbiAgICAgICAgICAgICAgaWYgKHM2ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgczcgPSBwZWckcGFyc2VmaWx0ZXJlZCgpO1xuICAgICAgICAgICAgICAgIGlmIChzNyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgczggPSBwZWckcGFyc2VzZXAoKTtcbiAgICAgICAgICAgICAgICAgIGlmIChzOCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDkzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgczkgPSBwZWckYzc7XG4gICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBzOSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzgpOyB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHM5ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgczEwID0gcGVnJHBhcnNlc2VwKCk7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHMxMCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA2Mikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzMTEgPSBwZWckYzk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzMTEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTApOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczExICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHMxMiA9IHBlZyRwYXJzZXNlcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczEyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgczEzID0gcGVnJHBhcnNlb3JkZXJlZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMTMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczEgPSBwZWckYzExKHMzLCBzNywgczEzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gczE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRjMDtcbiAgICB9XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRwYXJzZWZpbHRlcmVkKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlZmlsdGVyZWQoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRwYXJzZXN0cmVhbSgpO1xuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBbXTtcbiAgICAgIHMzID0gcGVnJHBhcnNlZmlsdGVyKCk7XG4gICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgd2hpbGUgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczIucHVzaChzMyk7XG4gICAgICAgICAgczMgPSBwZWckcGFyc2VmaWx0ZXIoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczIgPSBwZWckYzA7XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgIHMxID0gcGVnJGMxMyhzMSwgczIpO1xuICAgICAgICBzMCA9IHMxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRjMDtcbiAgICB9XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgczEgPSBwZWckcGFyc2VzdHJlYW0oKTtcbiAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgczEgPSBwZWckYzE0KHMxKTtcbiAgICAgIH1cbiAgICAgIHMwID0gczE7XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlc3RyZWFtKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2VjbGFzcygpO1xuICAgIGlmIChzMSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczEgPSBwZWckcGFyc2VpZCgpO1xuICAgIH1cbiAgICBpZiAoczEgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMxID0gcGVnJGMxNTtcbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZWV2ZW50VHlwZSgpO1xuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICBzMSA9IHBlZyRjMTYoczEsIHMyKTtcbiAgICAgICAgczAgPSBzMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckYzA7XG4gICAgfVxuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIHMxID0gW107XG4gICAgICBpZiAocGVnJGMxNy50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgIHMyID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzE4KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHdoaWxlIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMxLnB1c2goczIpO1xuICAgICAgICAgIGlmIChwZWckYzE3LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICAgIHMyID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxOCk7IH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMxID0gcGVnJGMwO1xuICAgICAgfVxuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICBzMSA9IHBlZyRjMTkoczEpO1xuICAgICAgfVxuICAgICAgczAgPSBzMTtcbiAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQwKSB7XG4gICAgICAgICAgczEgPSBwZWckYzIwO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMyMSk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMiA9IHBlZyRwYXJzZW1lcmdlZCgpO1xuICAgICAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0MSkge1xuICAgICAgICAgICAgICBzMyA9IHBlZyRjMjI7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMyMyk7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczEgPSBwZWckYzI0KHMyKTtcbiAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VjbGFzcygpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDYpIHtcbiAgICAgIHMxID0gcGVnJGMyNTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMyNik7IH1cbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZXZhbHVlKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA1OCkge1xuICAgICAgICAgIHMzID0gcGVnJGMyNztcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMjgpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgczEgPSBwZWckYzI5KHMyKTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckYzA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlaWQoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDM1KSB7XG4gICAgICBzMSA9IHBlZyRjMzA7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMzEpOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2V2YWx1ZSgpO1xuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNTgpIHtcbiAgICAgICAgICBzMyA9IHBlZyRjMjc7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMyA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzI4KTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgIHMxID0gcGVnJGMzMihzMik7XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJGMwO1xuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZWV2ZW50VHlwZSgpIHtcbiAgICB2YXIgczA7XG5cbiAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA5KSA9PT0gcGVnJGMzMykge1xuICAgICAgczAgPSBwZWckYzMzO1xuICAgICAgcGVnJGN1cnJQb3MgKz0gOTtcbiAgICB9IGVsc2Uge1xuICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzM0KTsgfVxuICAgIH1cbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDcpID09PSBwZWckYzM1KSB7XG4gICAgICAgIHMwID0gcGVnJGMzNTtcbiAgICAgICAgcGVnJGN1cnJQb3MgKz0gNztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzM2KTsgfVxuICAgICAgfVxuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDUpID09PSBwZWckYzM3KSB7XG4gICAgICAgICAgczAgPSBwZWckYzM3O1xuICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMzOCk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA4KSA9PT0gcGVnJGMzOSkge1xuICAgICAgICAgICAgczAgPSBwZWckYzM5O1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gODtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQwKTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDUpID09PSBwZWckYzQxKSB7XG4gICAgICAgICAgICAgIHMwID0gcGVnJGM0MTtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gNTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQyKTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDcpID09PSBwZWckYzQzKSB7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckYzQzO1xuICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDc7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM0NCk7IH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA4KSA9PT0gcGVnJGM0NSkge1xuICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzQ1O1xuICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gODtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQ2KTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDUpID09PSBwZWckYzQ3KSB7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJGM0NztcbiAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gNTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQ4KTsgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDEwKSA9PT0gcGVnJGM0OSkge1xuICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJGM0OTtcbiAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSAxMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzUwKTsgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDkpID09PSBwZWckYzUxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjNTE7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSA5O1xuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTIpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgOCkgPT09IHBlZyRjNTMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzUzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSA4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTQpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgOSkgPT09IHBlZyRjNTUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjNTU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gOTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzU2KTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDEwKSA9PT0gcGVnJGM1Nykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzU3O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gMTA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM1OCk7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCAxMCkgPT09IHBlZyRjNTkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzU5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSAxMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzYwKTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDkpID09PSBwZWckYzYxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzYxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2Mik7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA4KSA9PT0gcGVnJGM2Mykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzYzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gODtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzY0KTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZWZpbHRlcigpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOTEpIHtcbiAgICAgIHMxID0gcGVnJGM1O1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzYpOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2V2YWx1ZSgpO1xuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOTMpIHtcbiAgICAgICAgICBzMyA9IHBlZyRjNztcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOCk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICBzMSA9IHBlZyRjNjUoczIpO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRjMDtcbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2V2YWx1ZSgpIHtcbiAgICB2YXIgczAsIHMxLCBzMjtcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBbXTtcbiAgICBpZiAocGVnJGM2Ni50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICBzMiA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNjcpOyB9XG4gICAgfVxuICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgd2hpbGUgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMxLnB1c2goczIpO1xuICAgICAgICBpZiAocGVnJGM2Ni50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgICAgczIgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2Nyk7IH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRjMDtcbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgIHMxID0gcGVnJGM2OChzMSk7XG4gICAgfVxuICAgIHMwID0gczE7XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VzZXAoKSB7XG4gICAgdmFyIHMwLCBzMTtcblxuICAgIHMwID0gW107XG4gICAgaWYgKHBlZyRjNjkudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgczEgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzcwKTsgfVxuICAgIH1cbiAgICB3aGlsZSAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwLnB1c2goczEpO1xuICAgICAgaWYgKHBlZyRjNjkudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICBzMSA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM3MCk7IH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBwZWckcmVzdWx0ID0gcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uKCk7XG5cbiAgaWYgKHBlZyRyZXN1bHQgIT09IHBlZyRGQUlMRUQgJiYgcGVnJGN1cnJQb3MgPT09IGlucHV0Lmxlbmd0aCkge1xuICAgIHJldHVybiBwZWckcmVzdWx0O1xuICB9IGVsc2Uge1xuICAgIGlmIChwZWckcmVzdWx0ICE9PSBwZWckRkFJTEVEICYmIHBlZyRjdXJyUG9zIDwgaW5wdXQubGVuZ3RoKSB7XG4gICAgICBwZWckZmFpbCh7IHR5cGU6IFwiZW5kXCIsIGRlc2NyaXB0aW9uOiBcImVuZCBvZiBpbnB1dFwiIH0pO1xuICAgIH1cblxuICAgIHRocm93IHBlZyRidWlsZEV4Y2VwdGlvbihudWxsLCBwZWckbWF4RmFpbEV4cGVjdGVkLCBwZWckbWF4RmFpbFBvcyk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIFN5bnRheEVycm9yOiBTeW50YXhFcnJvcixcbiAgcGFyc2U6ICAgICAgIHBhcnNlXG59OyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBleHByZXNzaW9uID0gcmVxdWlyZSgnLi4vZXhwcmVzc2lvbicpO1xuXG52YXIgZXhwciA9IChmdW5jdGlvbigpIHtcbiAgdmFyIHBhcnNlID0gZXhwcmVzc2lvbi5wYXJzZTtcbiAgdmFyIGNvZGVnZW4gPSBleHByZXNzaW9uLmNvZGUoe1xuICAgIGlkV2hpdGVMaXN0OiBbJ2QnLCAnZScsICdpJywgJ3AnLCAnc2cnXVxuICB9KTtcblxuICByZXR1cm4gZnVuY3Rpb24oZXhwcikgeyAgICBcbiAgICB2YXIgdmFsdWUgPSBjb2RlZ2VuKHBhcnNlKGV4cHIpKTtcbiAgICB2YWx1ZS5mbiA9IEZ1bmN0aW9uKCdkJywgJ2UnLCAnaScsICdwJywgJ3NnJyxcbiAgICAgICdcInVzZSBzdHJpY3RcIjsgcmV0dXJuICgnICsgdmFsdWUuZm4gKyAnKTsnKTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG59KSgpO1xuXG5leHByLmV2YWwgPSBmdW5jdGlvbihncmFwaCwgZm4sIGQsIGUsIGksIHAsIHNnKSB7XG4gIHNnID0gZ3JhcGguc2lnbmFsVmFsdWVzKGRsLmFycmF5KHNnKSk7XG4gIHJldHVybiBmbi5jYWxsKG51bGwsIGQsIGUsIGksIHAsIHNnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwcjsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgY29uZmlnID0gcmVxdWlyZSgnLi4vdXRpbC9jb25maWcnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZUludGVyYWN0b3JzKG1vZGVsLCBzcGVjLCBkZWZGYWN0b3J5KSB7XG4gIHZhciBjb3VudCA9IDAsXG4gICAgICBzZyA9IHt9LCBwZCA9IHt9LCBtayA9IHt9LFxuICAgICAgc2lnbmFscyA9IFtdLCBwcmVkaWNhdGVzID0gW107XG5cbiAgZnVuY3Rpb24gbG9hZGVkKGkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXJyb3IsIGRhdGEpIHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBkbC5lcnJvcihcIkxPQURJTkcgRkFJTEVEOiBcIiArIGkudXJsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBkZWYgPSBkbC5pc09iamVjdChkYXRhKSA/IGRhdGEgOiBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICBpbnRlcmFjdG9yKGkubmFtZSwgZGVmKTtcbiAgICAgIH1cbiAgICAgIGlmICgtLWNvdW50ID09IDApIGluamVjdCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGludGVyYWN0b3IobmFtZSwgZGVmKSB7XG4gICAgc2cgPSB7fSwgcGQgPSB7fTtcbiAgICBpZiAoZGVmLnNpZ25hbHMpICAgIHNpZ25hbHMucHVzaC5hcHBseShzaWduYWxzLCBuc1NpZ25hbHMobmFtZSwgZGVmLnNpZ25hbHMpKTtcbiAgICBpZiAoZGVmLnByZWRpY2F0ZXMpIHByZWRpY2F0ZXMucHVzaC5hcHBseShwcmVkaWNhdGVzLCBuc1ByZWRpY2F0ZXMobmFtZSwgZGVmLnByZWRpY2F0ZXMpKTtcbiAgICBuc01hcmtzKG5hbWUsIGRlZi5tYXJrcyk7XG4gIH1cblxuICBmdW5jdGlvbiBpbmplY3QoKSB7XG4gICAgaWYgKGRsLmtleXMobWspLmxlbmd0aCA+IDApIGluamVjdE1hcmtzKHNwZWMubWFya3MpO1xuICAgIHNwZWMuc2lnbmFscyA9IGRsLmFycmF5KHNwZWMuc2lnbmFscyk7XG4gICAgc3BlYy5wcmVkaWNhdGVzID0gZGwuYXJyYXkoc3BlYy5wcmVkaWNhdGVzKTtcbiAgICBzcGVjLnNpZ25hbHMudW5zaGlmdC5hcHBseShzcGVjLnNpZ25hbHMsIHNpZ25hbHMpO1xuICAgIHNwZWMucHJlZGljYXRlcy51bnNoaWZ0LmFwcGx5KHNwZWMucHJlZGljYXRlcywgcHJlZGljYXRlcyk7XG4gICAgZGVmRmFjdG9yeSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5qZWN0TWFya3MobWFya3MpIHtcbiAgICB2YXIgbSwgciwgaSwgbGVuO1xuICAgIG1hcmtzID0gZGwuYXJyYXkobWFya3MpO1xuXG4gICAgZm9yKGkgPSAwLCBsZW4gPSBtYXJrcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgbSA9IG1hcmtzW2ldO1xuICAgICAgaWYgKHIgPSBta1ttLnR5cGVdKSB7XG4gICAgICAgIG1hcmtzW2ldID0gZGwuZHVwbGljYXRlKHIpO1xuICAgICAgICBpZiAobS5mcm9tKSBtYXJrc1tpXS5mcm9tID0gbS5mcm9tO1xuICAgICAgICBpZiAobS5wcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgW0MuRU5URVIsIEMuVVBEQVRFLCBDLkVYSVRdLmZvckVhY2goZnVuY3Rpb24ocCkge1xuICAgICAgICAgICAgbWFya3NbaV0ucHJvcGVydGllc1twXSA9IGRsLmV4dGVuZChyLnByb3BlcnRpZXNbcF0sIG0ucHJvcGVydGllc1twXSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobS5tYXJrcykgeyAgLy8gVE9ETyBob3cgdG8gb3ZlcnJpZGUgcHJvcGVydGllcyBvZiBuZXN0ZWQgbWFya3M/XG4gICAgICAgIGluamVjdE1hcmtzKG0ubWFya3MpO1xuICAgICAgfVxuICAgIH0gICAgXG4gIH1cblxuICBmdW5jdGlvbiBucyhuLCBzKSB7IFxuICAgIGlmIChkbC5pc1N0cmluZyhzKSkge1xuICAgICAgcmV0dXJuIHMgKyBcIl9cIiArIG47XG4gICAgfSBlbHNlIHtcbiAgICAgIGRsLmtleXMocykuZm9yRWFjaChmdW5jdGlvbih4KSB7IFxuICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKCdcXFxcYicreCsnXFxcXGInLCBcImdcIik7XG4gICAgICAgIG4gPSBuLnJlcGxhY2UocmVnZXgsIHNbeF0pIFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbjtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBuc1NpZ25hbHMobmFtZSwgc2lnbmFscykge1xuICAgIHNpZ25hbHMgPSBkbC5hcnJheShzaWduYWxzKTtcbiAgICAvLyBUd28gcGFzc2VzIHRvIG5zIGFsbCBzaWduYWxzLCBhbmQgdGhlbiBvdmVyd3JpdGUgdGhlaXIgZGVmaW5pdGlvbnNcbiAgICAvLyBpbiBjYXNlIHNpZ25hbCBvcmRlciBpcyBpbXBvcnRhbnQuXG4gICAgc2lnbmFscy5mb3JFYWNoKGZ1bmN0aW9uKHMpIHsgcy5uYW1lID0gc2dbcy5uYW1lXSA9IG5zKHMubmFtZSwgbmFtZSk7IH0pO1xuICAgIHNpZ25hbHMuZm9yRWFjaChmdW5jdGlvbihzKSB7XG4gICAgICAocy5zdHJlYW1zIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgdC50eXBlID0gbnModC50eXBlLCBzZyk7XG4gICAgICAgIHQuZXhwciA9IG5zKHQuZXhwciwgc2cpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNpZ25hbHM7XG4gIH1cblxuICBmdW5jdGlvbiBuc1ByZWRpY2F0ZXMobmFtZSwgcHJlZGljYXRlcykge1xuICAgIHByZWRpY2F0ZXMgPSBkbC5hcnJheShwcmVkaWNhdGVzKTtcbiAgICBwcmVkaWNhdGVzLmZvckVhY2goZnVuY3Rpb24ocCkge1xuICAgICAgcC5uYW1lID0gcGRbcC5uYW1lXSA9IG5zKHAubmFtZSwgbmFtZSk7XG5cbiAgICAgIFtwLm9wZXJhbmRzLCBwLnJhbmdlXS5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgKHggfHwgW10pLmZvckVhY2goZnVuY3Rpb24obykge1xuICAgICAgICAgIGlmIChvLnNpZ25hbCkgby5zaWduYWwgPSBucyhvLnNpZ25hbCwgc2cpO1xuICAgICAgICAgIGVsc2UgaWYgKG8ucHJlZGljYXRlKSBuc09wZXJhbmQobyk7XG4gICAgICAgIH0pXG4gICAgICB9KTtcblxuICAgIH0pOyAgXG4gICAgcmV0dXJuIHByZWRpY2F0ZXM7IFxuICB9XG5cbiAgZnVuY3Rpb24gbnNPcGVyYW5kKG8pIHtcbiAgICBvLnByZWRpY2F0ZSA9IHBkW28ucHJlZGljYXRlXTtcbiAgICBkbC5rZXlzKG8uaW5wdXQpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgdmFyIGkgPSBvLmlucHV0W2tdO1xuICAgICAgaWYgKGkuc2lnbmFsKSBpLnNpZ25hbCA9IG5zKGkuc2lnbmFsLCBzZyk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBuc01hcmtzKG5hbWUsIG1hcmtzKSB7XG4gICAgKG1hcmtzIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKG0pIHsgXG4gICAgICBuc1Byb3BlcnRpZXMobS5wcm9wZXJ0aWVzLmVudGVyKTtcbiAgICAgIG5zUHJvcGVydGllcyhtLnByb3BlcnRpZXMudXBkYXRlKTtcbiAgICAgIG5zUHJvcGVydGllcyhtLnByb3BlcnRpZXMuZXhpdCk7XG4gICAgICBta1tucyhtLm5hbWUsIG5hbWUpXSA9IG07IFxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gbnNQcm9wZXJ0aWVzKHByb3BzZXQpIHtcbiAgICBkbC5rZXlzKHByb3BzZXQpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgdmFyIHAgPSBwcm9wc2V0W2tdO1xuICAgICAgaWYgKHAuc2lnbmFsKSBwLnNpZ25hbCA9IG5zKHAuc2lnbmFsLCBzZyk7XG4gICAgICBlbHNlIGlmIChwLnJ1bGUpIHtcbiAgICAgICAgcC5ydWxlLmZvckVhY2goZnVuY3Rpb24ocikgeyBcbiAgICAgICAgICBpZiAoci5zaWduYWwpIHIuc2lnbmFsID0gbnMoci5zaWduYWwsIHNnKTtcbiAgICAgICAgICBpZiAoci5wcmVkaWNhdGUpIG5zT3BlcmFuZChyKTsgXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgKHNwZWMuaW50ZXJhY3RvcnMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oaSkge1xuICAgIGlmIChpLnVybCkge1xuICAgICAgY291bnQgKz0gMTtcbiAgICAgIGRsLmxvYWQoZGwuZXh0ZW5kKHt1cmw6IGkudXJsfSwgY29uZmlnLmxvYWQpLCBsb2FkZWQoaSkpO1xuICAgIH1cbiAgfSk7XG5cbiAgaWYgKGNvdW50ID09PSAwKSBzZXRUaW1lb3V0KGluamVjdCwgMSk7XG4gIHJldHVybiBzcGVjO1xufSIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBwYXJzZVByb3BlcnRpZXMgPSByZXF1aXJlKCcuL3Byb3BlcnRpZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZU1hcmsobW9kZWwsIG1hcmspIHtcbiAgdmFyIHByb3BzID0gbWFyay5wcm9wZXJ0aWVzLFxuICAgICAgZ3JvdXAgPSBtYXJrLm1hcmtzO1xuXG4gIC8vIHBhcnNlIG1hcmsgcHJvcGVydHkgZGVmaW5pdGlvbnNcbiAgZGwua2V5cyhwcm9wcykuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgcHJvcHNba10gPSBwYXJzZVByb3BlcnRpZXMobW9kZWwsIG1hcmsudHlwZSwgcHJvcHNba10pO1xuICB9KTtcblxuICAvLyBwYXJzZSBkZWxheSBmdW5jdGlvblxuICBpZiAobWFyay5kZWxheSkge1xuICAgIG1hcmsuZGVsYXkgPSBwYXJzZVByb3BlcnRpZXMobW9kZWwsIG1hcmsudHlwZSwge2RlbGF5OiBtYXJrLmRlbGF5fSk7XG4gIH1cblxuICAvLyByZWN1cnNlIGlmIGdyb3VwIHR5cGVcbiAgaWYgKGdyb3VwKSB7XG4gICAgbWFyay5tYXJrcyA9IGdyb3VwLm1hcChmdW5jdGlvbihnKSB7IHJldHVybiBwYXJzZU1hcmsobW9kZWwsIGcpOyB9KTtcbiAgfVxuICAgIFxuICByZXR1cm4gbWFyaztcbn07IiwidmFyIHBhcnNlTWFyayA9IHJlcXVpcmUoJy4vbWFyaycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1vZGVsLCBzcGVjLCB3aWR0aCwgaGVpZ2h0KSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJncm91cFwiLFxuICAgIHdpZHRoOiB3aWR0aCxcbiAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICBzY2FsZXM6IHNwZWMuc2NhbGVzIHx8IFtdLFxuICAgIGF4ZXM6IHNwZWMuYXhlcyB8fCBbXSxcbiAgICAvLyBsZWdlbmRzOiBzcGVjLmxlZ2VuZHMgfHwgW10sXG4gICAgbWFya3M6IChzcGVjLm1hcmtzIHx8IFtdKS5tYXAoZnVuY3Rpb24obSkgeyByZXR1cm4gcGFyc2VNYXJrKG1vZGVsLCBtKTsgfSlcbiAgfTtcbn07IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIE5vZGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Ob2RlJyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG52YXIgZmlsdGVyID0gZnVuY3Rpb24oZmllbGQsIHZhbHVlLCBzcmMsIGRlc3QpIHtcbiAgZm9yKHZhciBpID0gc3JjLmxlbmd0aC0xOyBpID49IDA7IC0taSkge1xuICAgIGlmKHNyY1tpXVtmaWVsZF0gPT0gdmFsdWUpXG4gICAgICBkZXN0LnB1c2guYXBwbHkoZGVzdCwgc3JjLnNwbGljZShpLCAxKSk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyc2VNb2RpZnkobW9kZWwsIGRlZiwgZHMpIHtcbiAgdmFyIGdyYXBoID0gbW9kZWwuZ3JhcGgsXG4gICAgICBzaWduYWwgPSBkZWYuc2lnbmFsID8gZGwuZmllbGQoZGVmLnNpZ25hbCkgOiBudWxsLCBcbiAgICAgIHNpZ25hbE5hbWUgPSBzaWduYWwgPyBzaWduYWxbMF0gOiBudWxsLFxuICAgICAgcHJlZGljYXRlID0gZGVmLnByZWRpY2F0ZSA/IG1vZGVsLnByZWRpY2F0ZShkZWYucHJlZGljYXRlKSA6IG51bGwsXG4gICAgICByZWV2YWwgPSAocHJlZGljYXRlID09PSBudWxsKSxcbiAgICAgIG5vZGUgPSBuZXcgTm9kZShncmFwaCk7XG5cbiAgbm9kZS5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgaWYocHJlZGljYXRlICE9PSBudWxsKSB7XG4gICAgICB2YXIgZGIgPSB7fTtcbiAgICAgIChwcmVkaWNhdGUuZGF0YXx8W10pLmZvckVhY2goZnVuY3Rpb24oZCkgeyBkYltkXSA9IG1vZGVsLmRhdGEoZCkudmFsdWVzKCk7IH0pO1xuXG4gICAgICAvLyBUT0RPOiBpbnB1dFxuICAgICAgcmVldmFsID0gcHJlZGljYXRlKHt9LCBkYiwgZ3JhcGguc2lnbmFsVmFsdWVzKHByZWRpY2F0ZS5zaWduYWxzfHxbXSksIG1vZGVsLl9wcmVkaWNhdGVzKTtcbiAgICB9XG5cbiAgICBkZWJ1ZyhpbnB1dCwgW2RlZi50eXBlK1wiaW5nXCIsIHJlZXZhbF0pO1xuICAgIGlmKCFyZWV2YWwpIHJldHVybiBpbnB1dDtcblxuICAgIHZhciBkYXR1bSA9IHt9LCBcbiAgICAgICAgdmFsdWUgPSBzaWduYWwgPyBncmFwaC5zaWduYWxSZWYoZGVmLnNpZ25hbCkgOiBudWxsLFxuICAgICAgICBkID0gbW9kZWwuZGF0YShkcy5uYW1lKSxcbiAgICAgICAgcHJldiA9IGQucmV2aXNlcygpID8gbnVsbCA6IHVuZGVmaW5lZCxcbiAgICAgICAgdCA9IG51bGw7XG5cbiAgICBkYXR1bVtkZWYuZmllbGRdID0gdmFsdWU7XG5cbiAgICAvLyBXZSBoYXZlIHRvIG1vZGlmeSBkcy5fZGF0YSBzbyB0aGF0IHN1YnNlcXVlbnQgcHVsc2VzIGNvbnRhaW5cbiAgICAvLyBvdXIgZHluYW1pYyBkYXRhLiBXL28gbW9kaWZ5aW5nIGRzLl9kYXRhLCBvbmx5IHRoZSBvdXRwdXRcbiAgICAvLyBjb2xsZWN0b3Igd2lsbCBjb250YWluIGR5bmFtaWMgdHVwbGVzLiBcbiAgICBpZihkZWYudHlwZSA9PSBDLkFERCkge1xuICAgICAgdCA9IHR1cGxlLmluZ2VzdChkYXR1bSwgcHJldik7XG4gICAgICBpbnB1dC5hZGQucHVzaCh0KTtcbiAgICAgIGQuX2RhdGEucHVzaCh0KTtcbiAgICB9IGVsc2UgaWYoZGVmLnR5cGUgPT0gQy5SRU1PVkUpIHtcbiAgICAgIGZpbHRlcihkZWYuZmllbGQsIHZhbHVlLCBpbnB1dC5hZGQsIGlucHV0LnJlbSk7XG4gICAgICBmaWx0ZXIoZGVmLmZpZWxkLCB2YWx1ZSwgaW5wdXQubW9kLCBpbnB1dC5yZW0pO1xuICAgICAgZC5fZGF0YSA9IGQuX2RhdGEuZmlsdGVyKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHhbZGVmLmZpZWxkXSAhPT0gdmFsdWUgfSk7XG4gICAgfSBlbHNlIGlmKGRlZi50eXBlID09IEMuVE9HR0xFKSB7XG4gICAgICB2YXIgYWRkID0gW10sIHJlbSA9IFtdO1xuICAgICAgZmlsdGVyKGRlZi5maWVsZCwgdmFsdWUsIGlucHV0LnJlbSwgYWRkKTtcbiAgICAgIGZpbHRlcihkZWYuZmllbGQsIHZhbHVlLCBpbnB1dC5hZGQsIHJlbSk7XG4gICAgICBmaWx0ZXIoZGVmLmZpZWxkLCB2YWx1ZSwgaW5wdXQubW9kLCByZW0pO1xuICAgICAgaWYoYWRkLmxlbmd0aCA9PSAwICYmIHJlbS5sZW5ndGggPT0gMCkgYWRkLnB1c2godHVwbGUuaW5nZXN0KGRhdHVtKSk7XG5cbiAgICAgIGlucHV0LmFkZC5wdXNoLmFwcGx5KGlucHV0LmFkZCwgYWRkKTtcbiAgICAgIGQuX2RhdGEucHVzaC5hcHBseShkLl9kYXRhLCBhZGQpO1xuICAgICAgaW5wdXQucmVtLnB1c2guYXBwbHkoaW5wdXQucmVtLCByZW0pO1xuICAgICAgZC5fZGF0YSA9IGQuX2RhdGEuZmlsdGVyKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHJlbS5pbmRleE9mKHgpID09PSAtMSB9KTtcbiAgICB9IGVsc2UgaWYoZGVmLnR5cGUgPT0gQy5DTEVBUikge1xuICAgICAgaW5wdXQucmVtLnB1c2guYXBwbHkoaW5wdXQucmVtLCBpbnB1dC5hZGQpO1xuICAgICAgaW5wdXQucmVtLnB1c2guYXBwbHkoaW5wdXQucmVtLCBpbnB1dC5tb2QpO1xuICAgICAgaW5wdXQuYWRkID0gW107XG4gICAgICBpbnB1dC5tb2QgPSBbXTtcbiAgICAgIGQuX2RhdGEgID0gW107XG4gICAgfSBcblxuICAgIGlucHV0LmZpZWxkc1tkZWYuZmllbGRdID0gMTtcbiAgICByZXR1cm4gaW5wdXQ7XG4gIH07XG5cbiAgaWYoc2lnbmFsTmFtZSkgbm9kZS5kZXBlbmRlbmN5KEMuU0lHTkFMUywgc2lnbmFsTmFtZSk7XG4gIGlmKHByZWRpY2F0ZSkgIG5vZGUuZGVwZW5kZW5jeShDLlNJR05BTFMsIHByZWRpY2F0ZS5zaWduYWxzKTtcbiAgXG4gIHJldHVybiBub2RlO1xufSIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZVBhZGRpbmcocGFkKSB7XG4gIGlmIChwYWQgPT0gbnVsbCkgcmV0dXJuIFwiYXV0b1wiO1xuICBlbHNlIGlmIChkbC5pc1N0cmluZyhwYWQpKSByZXR1cm4gcGFkPT09XCJzdHJpY3RcIiA/IFwic3RyaWN0XCIgOiBcImF1dG9cIjtcbiAgZWxzZSBpZiAoZGwuaXNPYmplY3QocGFkKSkgcmV0dXJuIHBhZDtcbiAgdmFyIHAgPSBkbC5pc051bWJlcihwYWQpID8gcGFkIDogMjA7XG4gIHJldHVybiB7dG9wOnAsIGxlZnQ6cCwgcmlnaHQ6cCwgYm90dG9tOnB9O1xufSIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZVByZWRpY2F0ZShtb2RlbCwgc3BlYykge1xuICB2YXIgdHlwZXMgPSB7XG4gICAgJz0nOiAgcGFyc2VDb21wYXJhdG9yLFxuICAgICc9PSc6IHBhcnNlQ29tcGFyYXRvcixcbiAgICAnIT0nOiBwYXJzZUNvbXBhcmF0b3IsXG4gICAgJz4nOiAgcGFyc2VDb21wYXJhdG9yLFxuICAgICc+PSc6IHBhcnNlQ29tcGFyYXRvcixcbiAgICAnPCc6ICBwYXJzZUNvbXBhcmF0b3IsXG4gICAgJzw9JzogcGFyc2VDb21wYXJhdG9yLFxuICAgICdhbmQnOiBwYXJzZUxvZ2ljYWwsXG4gICAgJyYmJzogIHBhcnNlTG9naWNhbCxcbiAgICAnb3InOiAgcGFyc2VMb2dpY2FsLFxuICAgICd8fCc6ICBwYXJzZUxvZ2ljYWwsXG4gICAgJ2luJzogcGFyc2VJblxuICB9O1xuXG4gIGZ1bmN0aW9uIHBhcnNlU2lnbmFsKHNpZ25hbCwgc2lnbmFscykge1xuICAgIHZhciBzID0gZGwuZmllbGQoc2lnbmFsKSxcbiAgICAgICAgY29kZSA9IFwic2lnbmFsc1tcIitzLm1hcChkbC5zdHIpLmpvaW4oXCJdW1wiKStcIl1cIjtcbiAgICBzaWduYWxzW3Muc2hpZnQoKV0gPSAxO1xuICAgIHJldHVybiBjb2RlO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHBhcnNlT3BlcmFuZHMob3BlcmFuZHMpIHtcbiAgICB2YXIgZGVjbCA9IFtdLCBkZWZzID0gW10sXG4gICAgICAgIHNpZ25hbHMgPSB7fSwgZGIgPSB7fTtcblxuICAgIGRsLmFycmF5KG9wZXJhbmRzKS5mb3JFYWNoKGZ1bmN0aW9uKG8sIGkpIHtcbiAgICAgIHZhciBzaWduYWwsIG5hbWUgPSBcIm9cIitpLCBkZWYgPSBcIlwiO1xuICAgICAgXG4gICAgICBpZihvLnZhbHVlICE9PSB1bmRlZmluZWQpIGRlZiA9IGRsLnN0cihvLnZhbHVlKTtcbiAgICAgIGVsc2UgaWYoby5hcmcpICAgIGRlZiA9IFwiYXJnc1tcIitkbC5zdHIoby5hcmcpK1wiXVwiO1xuICAgICAgZWxzZSBpZihvLnNpZ25hbCkgZGVmID0gcGFyc2VTaWduYWwoby5zaWduYWwsIHNpZ25hbHMpO1xuICAgICAgZWxzZSBpZihvLnByZWRpY2F0ZSkge1xuICAgICAgICB2YXIgcHJlZCA9IG1vZGVsLnByZWRpY2F0ZShvLnByZWRpY2F0ZSksXG4gICAgICAgICAgICBwID0gXCJwcmVkaWNhdGVzW1wiK2RsLnN0cihvLnByZWRpY2F0ZSkrXCJdXCI7XG5cbiAgICAgICAgcHJlZC5zaWduYWxzLmZvckVhY2goZnVuY3Rpb24ocykgeyBzaWduYWxzW3NdID0gMTsgfSk7XG4gICAgICAgIHByZWQuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgZGJbZF0gPSAxIH0pO1xuXG4gICAgICAgIGRsLmtleXMoby5pbnB1dCkuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICAgICAgdmFyIGkgPSBvLmlucHV0W2tdLCBzaWduYWw7XG4gICAgICAgICAgZGVmICs9IFwiYXJnc1tcIitkbC5zdHIoaykrXCJdID0gXCI7XG4gICAgICAgICAgaWYoaS5zaWduYWwpICAgZGVmICs9IHBhcnNlU2lnbmFsKGkuc2lnbmFsLCBzaWduYWxzKTtcbiAgICAgICAgICBlbHNlIGlmKGkuYXJnKSBkZWYgKz0gXCJhcmdzW1wiK2RsLnN0cihpLmFyZykrXCJdXCI7XG4gICAgICAgICAgZGVmKz1cIiwgXCI7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRlZis9IHArXCIuY2FsbChcIitwK1wiLCBhcmdzLCBkYiwgc2lnbmFscywgcHJlZGljYXRlcylcIjtcbiAgICAgIH1cblxuICAgICAgZGVjbC5wdXNoKG5hbWUpO1xuICAgICAgZGVmcy5wdXNoKG5hbWUrXCI9KFwiK2RlZitcIilcIik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogXCJ2YXIgXCIgKyBkZWNsLmpvaW4oXCIsIFwiKSArIFwiO1xcblwiICsgZGVmcy5qb2luKFwiO1xcblwiKSArIFwiO1xcblwiLFxuICAgICAgc2lnbmFsczogZGwua2V5cyhzaWduYWxzKSxcbiAgICAgIGRhdGE6IGRsLmtleXMoZGIpXG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIHBhcnNlQ29tcGFyYXRvcihzcGVjKSB7XG4gICAgdmFyIG9wcyA9IHBhcnNlT3BlcmFuZHMoc3BlYy5vcGVyYW5kcyk7XG4gICAgaWYoc3BlYy50eXBlID09ICc9Jykgc3BlYy50eXBlID0gJz09JztcblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiBvcHMuY29kZSArIFwicmV0dXJuIFwiICsgW1wibzBcIiwgXCJvMVwiXS5qb2luKHNwZWMudHlwZSkgKyBcIjtcIixcbiAgICAgIHNpZ25hbHM6IG9wcy5zaWduYWxzLFxuICAgICAgZGF0YTogb3BzLmRhdGFcbiAgICB9O1xuICB9O1xuXG4gIGZ1bmN0aW9uIHBhcnNlTG9naWNhbChzcGVjKSB7XG4gICAgdmFyIG9wcyA9IHBhcnNlT3BlcmFuZHMoc3BlYy5vcGVyYW5kcyksXG4gICAgICAgIG8gPSBbXSwgaSA9IDAsIGxlbiA9IHNwZWMub3BlcmFuZHMubGVuZ3RoO1xuXG4gICAgd2hpbGUoby5wdXNoKFwib1wiK2krKyk8bGVuKTtcbiAgICBpZihzcGVjLnR5cGUgPT0gJ2FuZCcpIHNwZWMudHlwZSA9ICcmJic7XG4gICAgZWxzZSBpZihzcGVjLnR5cGUgPT0gJ29yJykgc3BlYy50eXBlID0gJ3x8JztcblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiBvcHMuY29kZSArIFwicmV0dXJuIFwiICsgby5qb2luKHNwZWMudHlwZSkgKyBcIjtcIixcbiAgICAgIHNpZ25hbHM6IG9wcy5zaWduYWxzLFxuICAgICAgZGF0YTogb3BzLmRhdGFcbiAgICB9O1xuICB9O1xuXG4gIGZ1bmN0aW9uIHBhcnNlSW4oc3BlYykge1xuICAgIHZhciBvID0gW3NwZWMuaXRlbV0sIGNvZGUgPSBcIlwiO1xuICAgIGlmKHNwZWMucmFuZ2UpIG8ucHVzaC5hcHBseShvLCBzcGVjLnJhbmdlKTtcbiAgICBpZihzcGVjLnNjYWxlKSB7XG4gICAgICBjb2RlID0gcGFyc2VTY2FsZShzcGVjLnNjYWxlLCBvKTtcbiAgICB9XG5cbiAgICB2YXIgb3BzID0gcGFyc2VPcGVyYW5kcyhvKTtcbiAgICBjb2RlID0gb3BzLmNvZGUgKyBjb2RlO1xuXG4gICAgaWYoc3BlYy5kYXRhKSB7XG4gICAgICB2YXIgZmllbGQgPSBkbC5maWVsZChzcGVjLmZpZWxkKS5tYXAoZGwuc3RyKTtcbiAgICAgIGNvZGUgKz0gXCJ2YXIgd2hlcmUgPSBmdW5jdGlvbihkKSB7IHJldHVybiBkW1wiK2ZpZWxkLmpvaW4oXCJdW1wiKStcIl0gPT0gbzAgfTtcXG5cIjtcbiAgICAgIGNvZGUgKz0gXCJyZXR1cm4gZGJbXCIrZGwuc3RyKHNwZWMuZGF0YSkrXCJdLmZpbHRlcih3aGVyZSkubGVuZ3RoID4gMDtcIjtcbiAgICB9IGVsc2UgaWYoc3BlYy5yYW5nZSkge1xuICAgICAgLy8gVE9ETzogaW5jbHVzaXZlL2V4Y2x1c2l2ZSByYW5nZT9cbiAgICAgIC8vIFRPRE86IGludmVydGluZyBvcmRpbmFsIHNjYWxlc1xuICAgICAgaWYoc3BlYy5zY2FsZSkgY29kZSArPSBcIm8xID0gc2NhbGUobzEpO1xcbm8yID0gc2NhbGUobzIpO1xcblwiO1xuICAgICAgY29kZSArPSBcInJldHVybiBvMSA8IG8yID8gbzEgPD0gbzAgJiYgbzAgPD0gbzIgOiBvMiA8PSBvMCAmJiBvMCA8PSBvMVwiO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiBjb2RlLCBcbiAgICAgIHNpZ25hbHM6IG9wcy5zaWduYWxzLCBcbiAgICAgIGRhdGE6IG9wcy5kYXRhLmNvbmNhdChzcGVjLmRhdGEgPyBbc3BlYy5kYXRhXSA6IFtdKVxuICAgIH07XG4gIH07XG5cbiAgLy8gUG9wdWxhdGUgb3BzIHN1Y2ggdGhhdCB1bHRpbWF0ZSBzY2FsZS9pbnZlcnNpb24gZnVuY3Rpb24gd2lsbCBiZSBpbiBgc2NhbGVgIHZhci4gXG4gIGZ1bmN0aW9uIHBhcnNlU2NhbGUoc3BlYywgb3BzKSB7XG4gICAgdmFyIGNvZGUgPSBcInZhciBzY2FsZSA9IFwiLCBcbiAgICAgICAgaWR4ICA9IG9wcy5sZW5ndGg7XG5cbiAgICBpZihkbC5pc1N0cmluZyhzcGVjKSkge1xuICAgICAgb3BzLnB1c2goeyB2YWx1ZTogc3BlYyB9KTtcbiAgICAgIGNvZGUgKz0gXCJ0aGlzLnJvb3QoKS5zY2FsZShvXCIraWR4K1wiKVwiO1xuICAgIH0gZWxzZSBpZihzcGVjLmFyZykgeyAgLy8gU2NhbGUgZnVuY3Rpb24gaXMgYmVpbmcgcGFzc2VkIGFzIGFuIGFyZ1xuICAgICAgb3BzLnB1c2goc3BlYyk7XG4gICAgICBjb2RlICs9IFwib1wiK2lkeDtcbiAgICB9IGVsc2UgaWYoc3BlYy5uYW1lKSB7IC8vIEZ1bGwgc2NhbGUgcGFyYW1ldGVyIHtuYW1lOiAuLn1cbiAgICAgIG9wcy5wdXNoKGRsLmlzU3RyaW5nKHNwZWMubmFtZSkgPyB7dmFsdWU6IHNwZWMubmFtZX0gOiBzcGVjLm5hbWUpO1xuICAgICAgY29kZSArPSBcIih0aGlzLmlzRnVuY3Rpb24ob1wiK2lkeCtcIikgPyBvXCIraWR4K1wiIDogXCI7XG4gICAgICBpZihzcGVjLnNjb3BlKSB7XG4gICAgICAgIG9wcy5wdXNoKHNwZWMuc2NvcGUpO1xuICAgICAgICBjb2RlICs9IFwiKG9cIisoaWR4KzEpK1wiLnNjYWxlIHx8IHRoaXMucm9vdCgpLnNjYWxlKShvXCIraWR4K1wiKVwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29kZSArPSBcInRoaXMucm9vdCgpLnNjYWxlKG9cIitpZHgrXCIpXCI7XG4gICAgICB9XG4gICAgICBjb2RlICs9IFwiKVwiXG4gICAgfVxuXG4gICAgaWYoc3BlYy5pbnZlcnQgPT09IHRydWUpIHsgIC8vIEFsbG93IHNwZWMuaW52ZXJ0LmFyZz9cbiAgICAgIGNvZGUgKz0gXCIuaW52ZXJ0XCJcbiAgICB9XG5cbiAgICByZXR1cm4gY29kZStcIjtcXG5cIjtcbiAgfVxuXG4gIChzcGVjIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHMpIHtcbiAgICB2YXIgcGFyc2UgPSB0eXBlc1tzLnR5cGVdKHMpLFxuICAgICAgICBwcmVkICA9IEZ1bmN0aW9uKFwiYXJnc1wiLCBcImRiXCIsIFwic2lnbmFsc1wiLCBcInByZWRpY2F0ZXNcIiwgcGFyc2UuY29kZSk7XG4gICAgcHJlZC5yb290ID0gZnVuY3Rpb24oKSB7IHJldHVybiBtb2RlbC5zY2VuZSgpLml0ZW1zWzBdIH07IC8vIEZvciBnbG9iYWwgc2NhbGVzXG4gICAgcHJlZC5pc0Z1bmN0aW9uID0gZGwuaXNGdW5jdGlvbjtcbiAgICBwcmVkLnNpZ25hbHMgPSBwYXJzZS5zaWduYWxzO1xuICAgIHByZWQuZGF0YSA9IHBhcnNlLmRhdGE7XG4gICAgbW9kZWwucHJlZGljYXRlKHMubmFtZSwgcHJlZCk7XG4gIH0pO1xuXG4gIHJldHVybiBzcGVjO1xufSIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICAgIHR1cGxlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvdHVwbGUnKSxcbiAgICBjb25maWcgPSByZXF1aXJlKCcuLi91dGlsL2NvbmZpZycpO1xuXG52YXIgREVQUyA9IFtcInNpZ25hbHNcIiwgXCJzY2FsZXNcIiwgXCJkYXRhXCIsIFwiZmllbGRzXCJdO1xuXG5mdW5jdGlvbiBjb21waWxlKG1vZGVsLCBtYXJrLCBzcGVjKSB7XG4gIHZhciBjb2RlID0gXCJcIixcbiAgICAgIG5hbWVzID0gZGwua2V5cyhzcGVjKSxcbiAgICAgIGksIGxlbiwgbmFtZSwgcmVmLCB2YXJzID0ge30sIFxuICAgICAgZGVwcyA9IHtcbiAgICAgICAgc2lnbmFsczoge30sXG4gICAgICAgIHNjYWxlczogIHt9LFxuICAgICAgICBkYXRhOiAgICB7fSxcbiAgICAgICAgZmllbGRzOiAge31cbiAgICAgIH07XG4gICAgICBcbiAgY29kZSArPSBcInZhciBvID0gdHJhbnMgPyB7fSA6IGl0ZW07XFxuXCJcbiAgXG4gIGZvciAoaT0wLCBsZW49bmFtZXMubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgcmVmID0gc3BlY1tuYW1lID0gbmFtZXNbaV1dO1xuICAgIGNvZGUgKz0gKGkgPiAwKSA/IFwiXFxuICBcIiA6IFwiICBcIjtcbiAgICBpZihyZWYucnVsZSkge1xuICAgICAgcmVmID0gcnVsZShtb2RlbCwgbmFtZSwgcmVmLnJ1bGUpO1xuICAgICAgY29kZSArPSBcIlxcbiAgXCIgKyByZWYuY29kZVxuICAgIH0gZWxzZSB7XG4gICAgICByZWYgPSB2YWx1ZVJlZihuYW1lLCByZWYpO1xuICAgICAgY29kZSArPSBcInRoaXMudHBsLnNldChvLCBcIitkbC5zdHIobmFtZSkrXCIsIFwiK3JlZi52YWwrXCIpO1wiO1xuICAgIH1cblxuICAgIHZhcnNbbmFtZV0gPSB0cnVlO1xuICAgIERFUFMuZm9yRWFjaChmdW5jdGlvbihwKSB7XG4gICAgICBpZihyZWZbcF0gIT0gbnVsbCkgZGwuYXJyYXkocmVmW3BdKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHsgZGVwc1twXVtrXSA9IDEgfSk7XG4gICAgfSk7XG4gIH1cblxuICBpZiAodmFycy54Mikge1xuICAgIGlmICh2YXJzLngpIHtcbiAgICAgIGNvZGUgKz0gXCJcXG4gIGlmIChvLnggPiBvLngyKSB7IFwiXG4gICAgICAgICAgICArIFwidmFyIHQgPSBvLng7XCJcbiAgICAgICAgICAgICsgXCJ0aGlzLnRwbC5zZXQobywgJ3gnLCBvLngyKTtcIlxuICAgICAgICAgICAgKyBcInRoaXMudHBsLnNldChvLCAneDInLCB0KTsgXCJcbiAgICAgICAgICAgICsgXCJ9O1wiO1xuICAgICAgY29kZSArPSBcIlxcbiAgdGhpcy50cGwuc2V0KG8sICd3aWR0aCcsIChvLngyIC0gby54KSk7XCI7XG4gICAgfSBlbHNlIGlmICh2YXJzLndpZHRoKSB7XG4gICAgICBjb2RlICs9IFwiXFxuICB0aGlzLnRwbC5zZXQobywgJ3gnLCAoby54MiAtIG8ud2lkdGgpKTtcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29kZSArPSBcIlxcbiAgdGhpcy50cGwuc2V0KG8sICd4Jywgby54Mik7XCJcbiAgICB9XG4gIH1cblxuICBpZiAodmFycy55Mikge1xuICAgIGlmICh2YXJzLnkpIHtcbiAgICAgIGNvZGUgKz0gXCJcXG4gIGlmIChvLnkgPiBvLnkyKSB7IFwiXG4gICAgICAgICAgICArIFwidmFyIHQgPSBvLnk7XCJcbiAgICAgICAgICAgICsgXCJ0aGlzLnRwbC5zZXQobywgJ3knLCBvLnkyKTtcIlxuICAgICAgICAgICAgKyBcInRoaXMudHBsLnNldChvLCAneTInLCB0KTtcIlxuICAgICAgICAgICAgKyBcIn07XCI7XG4gICAgICBjb2RlICs9IFwiXFxuICB0aGlzLnRwbC5zZXQobywgJ2hlaWdodCcsIChvLnkyIC0gby55KSk7XCI7XG4gICAgfSBlbHNlIGlmICh2YXJzLmhlaWdodCkge1xuICAgICAgY29kZSArPSBcIlxcbiAgdGhpcy50cGwuc2V0KG8sICd5JywgKG8ueTIgLSBvLmhlaWdodCkpO1wiO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2RlICs9IFwiXFxuICB0aGlzLnRwbC5zZXQobywgJ3knLCBvLnkyKTtcIlxuICAgIH1cbiAgfVxuICBcbiAgaWYgKGhhc1BhdGgobWFyaywgdmFycykpIGNvZGUgKz0gXCJcXG4gIGl0ZW0udG91Y2goKTtcIjtcbiAgY29kZSArPSBcIlxcbiAgaWYgKHRyYW5zKSB0cmFucy5pbnRlcnBvbGF0ZShpdGVtLCBvKTtcIjtcblxuICB0cnkge1xuICAgIHZhciBlbmNvZGVyID0gRnVuY3Rpb24oXCJpdGVtXCIsIFwiZ3JvdXBcIiwgXCJ0cmFuc1wiLCBcImRiXCIsIFxuICAgICAgXCJzaWduYWxzXCIsIFwicHJlZGljYXRlc1wiLCBjb2RlKTtcbiAgICBlbmNvZGVyLnRwbCAgPSB0dXBsZTtcbiAgICBlbmNvZGVyLnV0aWwgPSBkbDtcbiAgICBlbmNvZGVyLmQzICAgPSBkMzsgLy8gRm9yIGNvbG9yIHNwYWNlc1xuICAgIHJldHVybiB7XG4gICAgICBlbmNvZGU6ICBlbmNvZGVyLFxuICAgICAgc2lnbmFsczogZGwua2V5cyhkZXBzLnNpZ25hbHMpLFxuICAgICAgc2NhbGVzOiAgZGwua2V5cyhkZXBzLnNjYWxlcyksXG4gICAgICBkYXRhOiAgICBkbC5rZXlzKGRlcHMuZGF0YSksXG4gICAgICBmaWVsZHM6ICBkbC5rZXlzKGRlcHMuZmllbGRzKVxuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGRsLmVycm9yKGUpO1xuICAgIGRsLmxvZyhjb2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoYXNQYXRoKG1hcmssIHZhcnMpIHtcbiAgcmV0dXJuIHZhcnMucGF0aCB8fFxuICAgICgobWFyaz09PVwiYXJlYVwiIHx8IG1hcms9PT1cImxpbmVcIikgJiZcbiAgICAgICh2YXJzLnggfHwgdmFycy54MiB8fCB2YXJzLndpZHRoIHx8XG4gICAgICAgdmFycy55IHx8IHZhcnMueTIgfHwgdmFycy5oZWlnaHQgfHxcbiAgICAgICB2YXJzLnRlbnNpb24gfHwgdmFycy5pbnRlcnBvbGF0ZSkpO1xufVxuXG5mdW5jdGlvbiBydWxlKG1vZGVsLCBuYW1lLCBydWxlcykge1xuICB2YXIgc2lnbmFscyA9IFtdLCBzY2FsZXMgPSBbXSwgZGIgPSBbXSxcbiAgICAgIGlucHV0cyA9IFtdLCBjb2RlID0gXCJcIjtcblxuICAocnVsZXN8fFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHIsIGkpIHtcbiAgICB2YXIgcHJlZE5hbWUgPSByLnByZWRpY2F0ZSxcbiAgICAgICAgcHJlZCA9IG1vZGVsLnByZWRpY2F0ZShwcmVkTmFtZSksXG4gICAgICAgIHAgPSBcInByZWRpY2F0ZXNbXCIrZGwuc3RyKHByZWROYW1lKStcIl1cIixcbiAgICAgICAgaW5wdXQgPSBbXSwgYXJncyA9IG5hbWUrXCJfYXJnXCIraSxcbiAgICAgICAgcmVmO1xuXG4gICAgZGwua2V5cyhyLmlucHV0KS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgIHZhciByZWYgPSB2YWx1ZVJlZihpLCByLmlucHV0W2tdKTtcbiAgICAgIGlucHV0LnB1c2goZGwuc3RyKGspK1wiOiBcIityZWYudmFsKTtcbiAgICAgIGlmKHJlZi5zaWduYWxzKSBzaWduYWxzLnB1c2guYXBwbHkoc2lnbmFscywgZGwuYXJyYXkocmVmLnNpZ25hbHMpKTtcbiAgICAgIGlmKHJlZi5zY2FsZXMpICBzY2FsZXMucHVzaC5hcHBseShzY2FsZXMsIGRsLmFycmF5KHJlZi5zY2FsZXMpKTtcbiAgICB9KTtcblxuICAgIHJlZiA9IHZhbHVlUmVmKG5hbWUsIHIpO1xuICAgIGlmKHJlZi5zaWduYWxzKSBzaWduYWxzLnB1c2guYXBwbHkoc2lnbmFscywgZGwuYXJyYXkocmVmLnNpZ25hbHMpKTtcbiAgICBpZihyZWYuc2NhbGVzKSAgc2NhbGVzLnB1c2guYXBwbHkoc2NhbGVzLCBkbC5hcnJheShyZWYuc2NhbGVzKSk7XG5cbiAgICBpZihwcmVkTmFtZSkge1xuICAgICAgc2lnbmFscy5wdXNoLmFwcGx5KHNpZ25hbHMsIHByZWQuc2lnbmFscyk7XG4gICAgICBkYi5wdXNoLmFwcGx5KGRiLCBwcmVkLmRhdGEpO1xuICAgICAgaW5wdXRzLnB1c2goYXJncytcIiA9IHtcIitpbnB1dC5qb2luKCcsICcpK1wifVwiKTtcbiAgICAgIGNvZGUgKz0gXCJpZihcIitwK1wiLmNhbGwoXCIrcCtcIixcIithcmdzK1wiLCBkYiwgc2lnbmFscywgcHJlZGljYXRlcykpIHtcXG5cIiArXG4gICAgICAgIFwiICAgIHRoaXMudHBsLnNldChvLCBcIitkbC5zdHIobmFtZSkrXCIsIFwiK3JlZi52YWwrXCIpO1xcblwiO1xuICAgICAgY29kZSArPSBydWxlc1tpKzFdID8gXCIgIH0gZWxzZSBcIiA6IFwiICB9XCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUgKz0gXCJ7XFxuXCIgKyBcbiAgICAgICAgXCIgICAgdGhpcy50cGwuc2V0KG8sIFwiK2RsLnN0cihuYW1lKStcIiwgXCIrcmVmLnZhbCtcIik7XFxuXCIrXG4gICAgICAgIFwiICB9XCI7XG4gICAgfVxuICB9KTtcblxuICBjb2RlID0gXCJ2YXIgXCIgKyBpbnB1dHMuam9pbihcIixcXG4gICAgICBcIikgKyBcIjtcXG4gIFwiICsgY29kZTtcbiAgcmV0dXJuIHtjb2RlOiBjb2RlLCBzaWduYWxzOiBzaWduYWxzLCBzY2FsZXM6IHNjYWxlcywgZGF0YTogZGJ9O1xufVxuXG5mdW5jdGlvbiB2YWx1ZVJlZihuYW1lLCByZWYpIHtcbiAgaWYgKHJlZiA9PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICBpZiAobmFtZT09PVwiZmlsbFwiIHx8IG5hbWU9PT1cInN0cm9rZVwiKSB7XG4gICAgaWYgKHJlZi5jKSB7XG4gICAgICByZXR1cm4gY29sb3JSZWYoXCJoY2xcIiwgcmVmLmgsIHJlZi5jLCByZWYubCk7XG4gICAgfSBlbHNlIGlmIChyZWYuaCB8fCByZWYucykge1xuICAgICAgcmV0dXJuIGNvbG9yUmVmKFwiaHNsXCIsIHJlZi5oLCByZWYucywgcmVmLmwpO1xuICAgIH0gZWxzZSBpZiAocmVmLmwgfHwgcmVmLmEpIHtcbiAgICAgIHJldHVybiBjb2xvclJlZihcImxhYlwiLCByZWYubCwgcmVmLmEsIHJlZi5iKTtcbiAgICB9IGVsc2UgaWYgKHJlZi5yIHx8IHJlZi5nIHx8IHJlZi5iKSB7XG4gICAgICByZXR1cm4gY29sb3JSZWYoXCJyZ2JcIiwgcmVmLnIsIHJlZi5nLCByZWYuYik7XG4gICAgfVxuICB9XG5cbiAgLy8gaW5pdGlhbGl6ZSB2YWx1ZVxuICB2YXIgdmFsID0gbnVsbCwgc2NhbGUgPSBudWxsLCBcbiAgICAgIHNnUmVmID0ge30sIGZSZWYgPSB7fSwgc1JlZiA9IHt9LFxuICAgICAgc2lnbmFscyA9IFtdLCBmaWVsZHMgPSBbXSwgZ3JvdXAgPSBmYWxzZTtcblxuICBpZiAocmVmLnZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICB2YWwgPSBkbC5zdHIocmVmLnZhbHVlKTtcbiAgfVxuXG4gIGlmIChyZWYuc2lnbmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICBzZ1JlZiA9IGRsLmZpZWxkKHJlZi5zaWduYWwpO1xuICAgIHZhbCA9IFwic2lnbmFsc1tcIitzZ1JlZi5tYXAoZGwuc3RyKS5qb2luKFwiXVtcIikrXCJdXCI7IFxuICAgIHNpZ25hbHMucHVzaChzZ1JlZi5zaGlmdCgpKTtcbiAgfVxuXG4gIGlmKHJlZi5maWVsZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmVmLmZpZWxkID0gZGwuaXNTdHJpbmcocmVmLmZpZWxkKSA/IHtkYXR1bTogcmVmLmZpZWxkfSA6IHJlZi5maWVsZDtcbiAgICBmUmVmICA9IGZpZWxkUmVmKHJlZi5maWVsZCk7XG4gICAgdmFsID0gZlJlZi52YWw7XG4gIH1cblxuICBpZiAocmVmLnNjYWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICBzUmVmID0gc2NhbGVSZWYocmVmLnNjYWxlKTtcbiAgICBzY2FsZSA9IHNSZWYudmFsO1xuXG4gICAgLy8gcnVuIHRocm91Z2ggc2NhbGUgZnVuY3Rpb24gaWYgdmFsIHNwZWNpZmllZC5cbiAgICAvLyBpZiBubyB2YWwsIHNjYWxlIGZ1bmN0aW9uIGlzIHByZWRpY2F0ZSBhcmcuXG4gICAgaWYodmFsICE9PSBudWxsIHx8IHJlZi5iYW5kIHx8IHJlZi5tdWx0IHx8IHJlZi5vZmZzZXQpIHtcbiAgICAgIHZhbCA9IHNjYWxlICsgKHJlZi5iYW5kID8gXCIucmFuZ2VCYW5kKClcIiA6IFxuICAgICAgICBcIihcIisodmFsICE9PSBudWxsID8gdmFsIDogXCJpdGVtLmRhdHVtLmRhdGFcIikrXCIpXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWwgPSBzY2FsZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIG11bHRpcGx5LCBvZmZzZXQsIHJldHVybiB2YWx1ZVxuICB2YWwgPSBcIihcIiArIChyZWYubXVsdD8oZGwubnVtYmVyKHJlZi5tdWx0KStcIiAqIFwiKTpcIlwiKSArIHZhbCArIFwiKVwiXG4gICAgKyAocmVmLm9mZnNldCA/IFwiICsgXCIgKyBkbC5udW1iZXIocmVmLm9mZnNldCkgOiBcIlwiKTtcblxuICAvLyBDb2xsYXRlIGRlcGVuZGVuY2llc1xuICByZXR1cm4ge1xuICAgIHZhbDogdmFsLFxuICAgIHNpZ25hbHM6IHNpZ25hbHMuY29uY2F0KGRsLmFycmF5KGZSZWYuc2lnbmFscykpLmNvbmNhdChkbC5hcnJheShzUmVmLnNpZ25hbHMpKSxcbiAgICBmaWVsZHM6ICBmaWVsZHMuY29uY2F0KGRsLmFycmF5KGZSZWYuZmllbGRzKSkuY29uY2F0KGRsLmFycmF5KHNSZWYuZmllbGRzKSksXG4gICAgc2NhbGVzOiAgcmVmLnNjYWxlID8gKHJlZi5zY2FsZS5uYW1lIHx8IHJlZi5zY2FsZSkgOiBudWxsLCAvLyBUT0RPOiBjb25uZWN0IHNSZWYnZCBzY2FsZT9cbiAgICBncm91cDogICBncm91cCB8fCBmUmVmLmdyb3VwIHx8IHNSZWYuZ3JvdXBcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29sb3JSZWYodHlwZSwgeCwgeSwgeikge1xuICB2YXIgeHggPSB4ID8gdmFsdWVSZWYoXCJcIiwgeCkgOiBjb25maWcuY29sb3JbdHlwZV1bMF0sXG4gICAgICB5eSA9IHkgPyB2YWx1ZVJlZihcIlwiLCB5KSA6IGNvbmZpZy5jb2xvclt0eXBlXVsxXSxcbiAgICAgIHp6ID0geiA/IHZhbHVlUmVmKFwiXCIsIHopIDogY29uZmlnLmNvbG9yW3R5cGVdWzJdXG4gICAgICBzaWduYWxzID0gW10sIHNjYWxlcyA9IFtdO1xuXG4gIFt4eCwgeXksIHp6XS5mb3JFYWNoKGZ1bmN0aW9uKHYpIHtcbiAgICBpZih2LnNpZ25hbHMpIHNpZ25hbHMucHVzaC5hcHBseShzaWduYWxzLCB2LnNpZ25hbHMpO1xuICAgIGlmKHYuc2NhbGVzKSAgc2NhbGVzLnB1c2godi5zY2FsZXMpO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIHZhbDogXCIodGhpcy5kMy5cIiArIHR5cGUgKyBcIihcIiArIFt4eC52YWwsIHl5LnZhbCwgenoudmFsXS5qb2luKFwiLFwiKSArICcpICsgXCJcIiknLFxuICAgIHNpZ25hbHM6IHNpZ25hbHMsXG4gICAgc2NhbGVzOiBzY2FsZXNcbiAgfTtcbn1cblxuLy8ge2ZpZWxkOiB7ZGF0dW06IFwiZm9vXCJ9IH0gIC0+IGl0ZW0uZGF0dW0uZm9vXG4vLyB7ZmllbGQ6IHtncm91cDogXCJmb29cIn0gfSAgLT4gZ3JvdXAuZm9vXG4vLyB7ZmllbGQ6IHtwYXJlbnQ6IFwiZm9vXCJ9IH0gLT4gZ3JvdXAuZGF0dW0uZm9vXG5mdW5jdGlvbiBmaWVsZFJlZihyZWYpIHtcbiAgaWYoZGwuaXNTdHJpbmcocmVmKSkge1xuICAgIHJldHVybiB7dmFsOiBkbC5maWVsZChyZWYpLm1hcChkbC5zdHIpLmpvaW4oXCJdW1wiKX07XG4gIH0gXG5cbiAgLy8gUmVzb2x2ZSBuZXN0aW5nL3BhcmVudCBsb29rdXBzXG4gIHZhciBsID0gcmVmLmxldmVsLFxuICAgICAgbmVzdGVkID0gKHJlZi5ncm91cCB8fCByZWYucGFyZW50KSAmJiBsLFxuICAgICAgc2NvcGUgPSBuZXN0ZWQgPyBBcnJheShsKS5qb2luKFwiZ3JvdXAubWFyay5cIikgOiBcIlwiLFxuICAgICAgciA9IGZpZWxkUmVmKHJlZi5kYXR1bSB8fCByZWYuZ3JvdXAgfHwgcmVmLnBhcmVudCB8fCByZWYuc2lnbmFsKSxcbiAgICAgIHZhbCA9IHIudmFsLFxuICAgICAgZmllbGRzICA9IHIuZmllbGRzICB8fCBbXSxcbiAgICAgIHNpZ25hbHMgPSByLnNpZ25hbHMgfHwgW10sXG4gICAgICBncm91cCAgID0gci5ncm91cCAgIHx8IGZhbHNlO1xuXG4gIGlmKHJlZi5kYXR1bSkge1xuICAgIGZpZWxkcy5wdXNoKHZhbCk7XG4gICAgdmFsID0gXCJpdGVtLmRhdHVtW1wiK3ZhbCtcIl1cIjtcbiAgfSBlbHNlIGlmKHJlZi5ncm91cCkge1xuICAgIGdyb3VwID0gdHJ1ZTtcbiAgICB2YWwgPSBzY29wZStcImdyb3VwW1wiK3ZhbCtcIl1cIjtcbiAgfSBlbHNlIGlmKHJlZi5wYXJlbnQpIHtcbiAgICBncm91cCA9IHRydWU7XG4gICAgdmFsID0gc2NvcGUrXCJncm91cC5kYXR1bVtcIit2YWwrXCJdXCI7XG4gIH0gZWxzZSBpZihyZWYuc2lnbmFsKSB7XG4gICAgdmFsID0gXCJzaWduYWxzW1wiK3ZhbCtcIl1cIjtcbiAgICBzaWduYWxzLnB1c2goZGwuZmllbGQocmVmLnNpZ25hbClbMF0pO1xuICB9XG5cbiAgcmV0dXJuIHt2YWw6IHZhbCwgZmllbGRzOiBmaWVsZHMsIHNpZ25hbHM6IHNpZ25hbHMsIGdyb3VwOiBncm91cH07XG59XG5cbi8vIHtzY2FsZTogXCJ4XCJ9XG4vLyB7c2NhbGU6IHtuYW1lOiBcInhcIn19LFxuLy8ge3NjYWxlOiBmaWVsZFJlZn1cbmZ1bmN0aW9uIHNjYWxlUmVmKHJlZikge1xuICB2YXIgc2NhbGUgPSBudWxsLFxuICAgICAgZnIgPSBudWxsO1xuXG4gIGlmKGRsLmlzU3RyaW5nKHJlZikpIHtcbiAgICBzY2FsZSA9IGRsLnN0cihyZWYpO1xuICB9IGVsc2UgaWYocmVmLm5hbWUpIHtcbiAgICBzY2FsZSA9IGRsLmlzU3RyaW5nKHJlZi5uYW1lKSA/IGRsLnN0cihyZWYubmFtZSkgOiAoZnIgPSBmaWVsZFJlZihyZWYubmFtZSkpLnZhbDtcbiAgfSBlbHNlIHtcbiAgICBzY2FsZSA9IChmciA9IGZpZWxkUmVmKHJlZikpLnZhbDtcbiAgfVxuXG4gIHNjYWxlID0gXCJncm91cC5zY2FsZShcIitzY2FsZStcIilcIjtcbiAgaWYocmVmLmludmVydCkgc2NhbGUgKz0gXCIuaW52ZXJ0XCI7ICAvLyBUT0RPOiBvcmRpbmFsIHNjYWxlc1xuXG4gIHJldHVybiBmciA/IChmci52YWwgPSBzY2FsZSwgZnIpIDoge3ZhbDogc2NhbGV9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbXBpbGU7IiwidmFyIGV4cHIgPSByZXF1aXJlKCcuL2V4cHInKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZVNpZ25hbHMobW9kZWwsIHNwZWMpIHtcbiAgdmFyIGdyYXBoID0gbW9kZWwuZ3JhcGg7XG5cbiAgLy8gcHJvY2VzcyBlYWNoIHNpZ25hbCBkZWZpbml0aW9uXG4gIChzcGVjIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHMpIHtcbiAgICB2YXIgc2lnbmFsID0gZ3JhcGguc2lnbmFsKHMubmFtZSwgcy5pbml0KSxcbiAgICAgICAgZXhwO1xuXG4gICAgaWYocy5leHByKSB7XG4gICAgICBleHAgPSBleHByKHMuZXhwcik7XG4gICAgICBzaWduYWwuZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgdmFsdWUgPSBleHByLmV2YWwoZ3JhcGgsIGV4cC5mbiwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgZXhwLnNpZ25hbHMpO1xuICAgICAgICBpZihzcGVjLnNjYWxlKSB2YWx1ZSA9IG1vZGVsLnNjYWxlKHNwZWMsIHZhbHVlKTtcbiAgICAgICAgc2lnbmFsLnZhbHVlKHZhbHVlKTtcbiAgICAgICAgaW5wdXQuc2lnbmFsc1tzLm5hbWVdID0gMTtcbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgfTtcbiAgICAgIHNpZ25hbC5kZXBlbmRlbmN5KEMuU0lHTkFMUywgZXhwLnNpZ25hbHMpO1xuICAgICAgZXhwLnNpZ25hbHMuZm9yRWFjaChmdW5jdGlvbihkZXApIHsgZ3JhcGguc2lnbmFsKGRlcCkuYWRkTGlzdGVuZXIoc2lnbmFsKTsgfSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gc3BlYztcbn07IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi4vY29yZS9Nb2RlbCcpLCBcbiAgICBWaWV3ID0gcmVxdWlyZSgnLi4vY29yZS9WaWV3JyksIFxuICAgIHBhcnNlUGFkZGluZyA9IHJlcXVpcmUoJy4uL3BhcnNlL3BhZGRpbmcnKSxcbiAgICBwYXJzZU1hcmtzID0gcmVxdWlyZSgnLi4vcGFyc2UvbWFya3MnKSxcbiAgICBwYXJzZVNpZ25hbHMgPSByZXF1aXJlKCcuLi9wYXJzZS9zaWduYWxzJyksXG4gICAgcGFyc2VQcmVkaWNhdGVzID0gcmVxdWlyZSgnLi4vcGFyc2UvcHJlZGljYXRlcycpLFxuICAgIHBhcnNlRGF0YSA9IHJlcXVpcmUoJy4uL3BhcnNlL2RhdGEnKSxcbiAgICBwYXJzZUludGVyYWN0b3JzID0gcmVxdWlyZSgnLi4vcGFyc2UvaW50ZXJhY3RvcnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZVNwZWMoc3BlYywgY2FsbGJhY2ssIHZpZXdGYWN0b3J5KSB7XG4gIC8vIHByb3RlY3QgYWdhaW5zdCBzdWJzZXF1ZW50IHNwZWMgbW9kaWZpY2F0aW9uXG4gIHNwZWMgPSBkbC5kdXBsaWNhdGUoc3BlYyk7XG5cbiAgdmlld0ZhY3RvcnkgPSB2aWV3RmFjdG9yeSB8fCBWaWV3LmZhY3Rvcnk7XG5cbiAgdmFyIHdpZHRoID0gc3BlYy53aWR0aCB8fCA1MDAsXG4gICAgICBoZWlnaHQgPSBzcGVjLmhlaWdodCB8fCA1MDAsXG4gICAgICB2aWV3cG9ydCA9IHNwZWMudmlld3BvcnQgfHwgbnVsbCxcbiAgICAgIG1vZGVsID0gbmV3IE1vZGVsKCk7XG5cbiAgcGFyc2VJbnRlcmFjdG9ycyhtb2RlbCwgc3BlYywgZnVuY3Rpb24oKSB7XG4gICAgbW9kZWwuZGVmcyh7XG4gICAgICB3aWR0aDogd2lkdGgsXG4gICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydCxcbiAgICAgIHBhZGRpbmc6IHBhcnNlUGFkZGluZyhzcGVjLnBhZGRpbmcpLFxuICAgICAgc2lnbmFsczogcGFyc2VTaWduYWxzKG1vZGVsLCBzcGVjLnNpZ25hbHMpLFxuICAgICAgcHJlZGljYXRlczogcGFyc2VQcmVkaWNhdGVzKG1vZGVsLCBzcGVjLnByZWRpY2F0ZXMpLFxuICAgICAgbWFya3M6IHBhcnNlTWFya3MobW9kZWwsIHNwZWMsIHdpZHRoLCBoZWlnaHQpLFxuICAgICAgZGF0YTogcGFyc2VEYXRhKG1vZGVsLCBzcGVjLmRhdGEsIGZ1bmN0aW9uKCkgeyBjYWxsYmFjayh2aWV3RmFjdG9yeShtb2RlbCkpOyB9KVxuICAgIH0pO1xuICB9KTtcbn0iLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgICBOb2RlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvTm9kZScpLFxuICAgIGNoYW5nc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0JyksXG4gICAgc2VsZWN0b3IgPSByZXF1aXJlKCcuL2V2ZW50cycpLFxuICAgIGV4cHIgPSByZXF1aXJlKCcuL2V4cHInKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxudmFyIFNUQVJUID0gXCJzdGFydFwiLCBNSURETEUgPSBcIm1pZGRsZVwiLCBFTkQgPSBcImVuZFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZpZXcpIHtcbiAgdmFyIG1vZGVsID0gdmlldy5tb2RlbCgpLFxuICAgICAgZ3JhcGggPSBtb2RlbC5ncmFwaCxcbiAgICAgIHNwZWMgID0gbW9kZWwuZGVmcygpLnNpZ25hbHMsXG4gICAgICByZWdpc3RlciA9IHt9LCBub2RlcyA9IHt9O1xuXG4gIGZ1bmN0aW9uIHNjYWxlKHNwZWMsIHZhbHVlKSB7XG4gICAgdmFyIGRlZiA9IHNwZWMuc2NhbGUsXG4gICAgICAgIG5hbWUgID0gZGVmLm5hbWUgfHwgZGVmLnNpZ25hbCB8fCBkZWYsXG4gICAgICAgIHNjb3BlID0gZGVmLnNjb3BlID8gZ3JhcGguc2lnbmFsUmVmKGRlZi5zY29wZS5zaWduYWwpIDogbnVsbDtcblxuICAgIGlmKCFzY29wZSB8fCAhc2NvcGUuc2NhbGUpIHtcbiAgICAgIHNjb3BlID0gKHNjb3BlICYmIHNjb3BlLm1hcmspID8gc2NvcGUubWFyay5ncm91cCA6IG1vZGVsLnNjZW5lKCkuaXRlbXNbMF07XG4gICAgfVxuXG4gICAgdmFyIHNjYWxlID0gc2NvcGUuc2NhbGUobmFtZSk7XG4gICAgaWYoIXNjYWxlKSByZXR1cm4gdmFsdWU7XG4gICAgcmV0dXJuIGRlZi5pbnZlcnQgPyBzY2FsZS5pbnZlcnQodmFsdWUpIDogc2NhbGUodmFsdWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2lnbmFsKHNpZywgc2VsZWN0b3IsIGV4cCwgc3BlYykge1xuICAgIHZhciBuID0gbmV3IE5vZGUoZ3JhcGgpO1xuICAgIG4uZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgaWYoIWlucHV0LnNpZ25hbHNbc2VsZWN0b3Iuc2lnbmFsXSkgcmV0dXJuIGdyYXBoLmRvTm90UHJvcGFnYXRlO1xuICAgICAgdmFyIHZhbCA9IGV4cHIuZXZhbChncmFwaCwgZXhwLmZuLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBleHAuc2lnbmFscyk7XG4gICAgICBpZihzcGVjLnNjYWxlKSB2YWwgPSBzY2FsZShzcGVjLCB2YWwpO1xuICAgICAgc2lnLnZhbHVlKHZhbCk7XG4gICAgICBpbnB1dC5zaWduYWxzW3NpZy5uYW1lKCldID0gMTtcbiAgICAgIGlucHV0LnJlZmxvdyA9IHRydWU7XG4gICAgICByZXR1cm4gaW5wdXQ7ICBcbiAgICB9O1xuICAgIG4uZGVwZW5kZW5jeShDLlNJR05BTFMsIHNlbGVjdG9yLnNpZ25hbCk7XG4gICAgbi5hZGRMaXN0ZW5lcihzaWcpO1xuICAgIGdyYXBoLnNpZ25hbChzZWxlY3Rvci5zaWduYWwpLmFkZExpc3RlbmVyKG4pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGV2ZW50KHNpZywgc2VsZWN0b3IsIGV4cCwgc3BlYykge1xuICAgIHZhciBmaWx0ZXJzID0gc2VsZWN0b3IuZmlsdGVycyB8fCBbXSxcbiAgICAgICAgdGFyZ2V0ID0gc2VsZWN0b3IudGFyZ2V0O1xuXG4gICAgaWYodGFyZ2V0KSBmaWx0ZXJzLnB1c2goXCJpLlwiK3RhcmdldC50eXBlK1wiPT1cIitkbC5zdHIodGFyZ2V0LnZhbHVlKSk7XG5cbiAgICByZWdpc3RlcltzZWxlY3Rvci5ldmVudF0gPSByZWdpc3RlcltzZWxlY3Rvci5ldmVudF0gfHwgW107XG4gICAgcmVnaXN0ZXJbc2VsZWN0b3IuZXZlbnRdLnB1c2goe1xuICAgICAgc2lnbmFsOiBzaWcsXG4gICAgICBleHA6IGV4cCxcbiAgICAgIGZpbHRlcnM6IGZpbHRlcnMubWFwKGZ1bmN0aW9uKGYpIHsgcmV0dXJuIGV4cHIoZik7IH0pLFxuICAgICAgc3BlYzogc3BlY1xuICAgIH0pO1xuXG4gICAgbm9kZXNbc2VsZWN0b3IuZXZlbnRdID0gbm9kZXNbc2VsZWN0b3IuZXZlbnRdIHx8IG5ldyBOb2RlKGdyYXBoKTtcbiAgICBub2Rlc1tzZWxlY3Rvci5ldmVudF0uYWRkTGlzdGVuZXIoc2lnKTtcbiAgfTtcblxuICBmdW5jdGlvbiBvcmRlcmVkU3RyZWFtKHNpZywgc2VsZWN0b3IsIGV4cCwgc3BlYykge1xuICAgIHZhciBuYW1lID0gc2lnLm5hbWUoKSwgXG4gICAgICAgIHRydWVGbiA9IGV4cHIoXCJ0cnVlXCIpLFxuICAgICAgICBzID0ge307XG5cbiAgICBzW1NUQVJUXSAgPSBncmFwaC5zaWduYWwobmFtZSArIFNUQVJULCAgZmFsc2UpO1xuICAgIHNbTUlERExFXSA9IGdyYXBoLnNpZ25hbChuYW1lICsgTUlERExFLCBmYWxzZSk7XG4gICAgc1tFTkRdICAgID0gZ3JhcGguc2lnbmFsKG5hbWUgKyBFTkQsICAgIGZhbHNlKTtcblxuICAgIHZhciByb3V0ZXIgPSBuZXcgTm9kZShncmFwaCk7XG4gICAgcm91dGVyLmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIGlmKHNbU1RBUlRdLnZhbHVlKCkgPT09IHRydWUgJiYgc1tFTkRdLnZhbHVlKCkgPT09IGZhbHNlKSB7XG4gICAgICAgIC8vIFRPRE86IEV4cGFuZCBzZWxlY3RvciBzeW50YXggdG8gYWxsb3cgc3RhcnQvZW5kIHNpZ25hbHMgaW50byBzdHJlYW0uXG4gICAgICAgIC8vIFVudGlsIHRoZW4sIHByZXZlbnQgb2xkIG1pZGRsZXMgZW50ZXJpbmcgc3RyZWFtIG9uIG5ldyBzdGFydC5cbiAgICAgICAgaWYoaW5wdXQuc2lnbmFsc1tuYW1lK1NUQVJUXSkgcmV0dXJuIGdyYXBoLmRvTm90UHJvcGFnYXRlO1xuXG4gICAgICAgIHNpZy52YWx1ZShzW01JRERMRV0udmFsdWUoKSk7XG4gICAgICAgIGlucHV0LnNpZ25hbHNbbmFtZV0gPSAxO1xuICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICB9XG5cbiAgICAgIGlmKHNbRU5EXS52YWx1ZSgpID09PSB0cnVlKSB7XG4gICAgICAgIHNbU1RBUlRdLnZhbHVlKGZhbHNlKTtcbiAgICAgICAgc1tFTkRdLnZhbHVlKGZhbHNlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGdyYXBoLmRvTm90UHJvcGFnYXRlO1xuICAgIH07XG4gICAgcm91dGVyLmFkZExpc3RlbmVyKHNpZyk7XG5cbiAgICBbU1RBUlQsIE1JRERMRSwgRU5EXS5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcbiAgICAgIHZhciB2YWwgPSAoeCA9PSBNSURETEUpID8gZXhwIDogdHJ1ZUZuLFxuICAgICAgICAgIHNwID0gKHggPT0gTUlERExFKSA/IHNwZWMgOiB7fTtcblxuICAgICAgaWYoc2VsZWN0b3JbeF0uZXZlbnQpIGV2ZW50KHNbeF0sIHNlbGVjdG9yW3hdLCB2YWwsIHNwKTtcbiAgICAgIGVsc2UgaWYoc2VsZWN0b3JbeF0uc2lnbmFsKSBzaWduYWwoc1t4XSwgc2VsZWN0b3JbeF0sIHZhbCwgc3ApO1xuICAgICAgZWxzZSBpZihzZWxlY3Rvclt4XS5zdHJlYW0pIG1lcmdlZFN0cmVhbShzW3hdLCBzZWxlY3Rvclt4XS5zdHJlYW0sIHZhbCwgc3ApO1xuICAgICAgc1t4XS5hZGRMaXN0ZW5lcihyb3V0ZXIpO1xuICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIG1lcmdlZFN0cmVhbShzaWcsIHNlbGVjdG9yLCBleHAsIHNwZWMpIHtcbiAgICBzZWxlY3Rvci5mb3JFYWNoKGZ1bmN0aW9uKHMpIHtcbiAgICAgIGlmKHMuZXZlbnQpICAgICAgIGV2ZW50KHNpZywgcywgZXhwLCBzcGVjKTtcbiAgICAgIGVsc2UgaWYocy5zaWduYWwpIHNpZ25hbChzaWcsIHMsIGV4cCwgc3BlYyk7XG4gICAgICBlbHNlIGlmKHMuc3RhcnQpICBvcmRlcmVkU3RyZWFtKHNpZywgcywgZXhwLCBzcGVjKTtcbiAgICAgIGVsc2UgaWYocy5zdHJlYW0pIG1lcmdlZFN0cmVhbShzaWcsIHMuc3RyZWFtLCBleHAsIHNwZWMpO1xuICAgIH0pO1xuICB9O1xuXG4gIChzcGVjIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHNpZykge1xuICAgIHZhciBzaWduYWwgPSBncmFwaC5zaWduYWwoc2lnLm5hbWUpO1xuICAgIGlmKHNpZy5leHByKSByZXR1cm47ICAvLyBDYW5ub3QgaGF2ZSBhbiBleHByIGFuZCBzdHJlYW0gZGVmaW5pdGlvbi5cblxuICAgIChzaWcuc3RyZWFtcyB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbihzdHJlYW0pIHtcbiAgICAgIHZhciBzZWwgPSBzZWxlY3Rvci5wYXJzZShzdHJlYW0udHlwZSksXG4gICAgICAgICAgZXhwID0gZXhwcihzdHJlYW0uZXhwcik7XG4gICAgICBtZXJnZWRTdHJlYW0oc2lnbmFsLCBzZWwsIGV4cCwgc3RyZWFtKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gV2UgcmVnaXN0ZXIgdGhlIGV2ZW50IGxpc3RlbmVycyBhbGwgdG9nZXRoZXIgc28gdGhhdCBpZiBtdWx0aXBsZVxuICAvLyBzaWduYWxzIGFyZSByZWdpc3RlcmVkIG9uIHRoZSBzYW1lIGV2ZW50LCB0aGV5IHdpbGwgcmVjZWl2ZSB0aGVcbiAgLy8gbmV3IHZhbHVlIG9uIHRoZSBzYW1lIHB1bHNlLiBcblxuICAvLyBUT0RPOiBGaWx0ZXJzLCB0aW1lIGludGVydmFscywgdGFyZ2V0IHNlbGVjdG9yc1xuICBkbC5rZXlzKHJlZ2lzdGVyKS5mb3JFYWNoKGZ1bmN0aW9uKHIpIHtcbiAgICB2YXIgaGFuZGxlcnMgPSByZWdpc3RlcltyXSwgXG4gICAgICAgIG5vZGUgPSBub2Rlc1tyXTtcblxuICAgIHZpZXcub24ociwgZnVuY3Rpb24oZXZ0LCBpdGVtKSB7XG4gICAgICB2YXIgY3MgPSBjaGFuZ3NldC5jcmVhdGUobnVsbCwgdHJ1ZSksXG4gICAgICAgICAgcGFkID0gdmlldy5wYWRkaW5nKCksXG4gICAgICAgICAgZmlsdGVyZWQgPSBmYWxzZSxcbiAgICAgICAgICB2YWwsIGgsIGksIG0sIGQ7XG5cbiAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpOyAvLyBTdG9wIHRleHQgc2VsZWN0aW9uXG4gICAgICBtID0gZDMubW91c2UoKGQzLmV2ZW50PWV2dCwgdmlldy5fZWwpKTsgLy8gUmVsYXRpdmUgcG9zaXRpb24gd2l0aGluIGNvbnRhaW5lclxuICAgICAgaXRlbSA9IGl0ZW18fHt9O1xuICAgICAgZCA9IGl0ZW0uZGF0dW18fHt9O1xuICAgICAgdmFyIHAgPSB7eDogbVswXSAtIHBhZC5sZWZ0LCB5OiBtWzFdIC0gcGFkLnRvcH07XG5cbiAgICAgIGZvcihpID0gMDsgaSA8IGhhbmRsZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGggPSBoYW5kbGVyc1tpXTtcbiAgICAgICAgZmlsdGVyZWQgPSBoLmZpbHRlcnMuc29tZShmdW5jdGlvbihmKSB7XG4gICAgICAgICAgcmV0dXJuICFleHByLmV2YWwoZ3JhcGgsIGYuZm4sIGQsIGV2dCwgaXRlbSwgcCwgZi5zaWduYWxzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmKGZpbHRlcmVkKSBjb250aW51ZTtcbiAgICAgICAgXG4gICAgICAgIHZhbCA9IGV4cHIuZXZhbChncmFwaCwgaC5leHAuZm4sIGQsIGV2dCwgaXRlbSwgcCwgaC5leHAuc2lnbmFscyk7IFxuICAgICAgICBpZihoLnNwZWMuc2NhbGUpIHZhbCA9IHNjYWxlKGguc3BlYywgdmFsLCBpdGVtKTtcbiAgICAgICAgaC5zaWduYWwudmFsdWUodmFsKTtcbiAgICAgICAgY3Muc2lnbmFsc1toLnNpZ25hbC5uYW1lKCldID0gMTtcbiAgICAgIH1cblxuICAgICAgZ3JhcGgucHJvcGFnYXRlKGNzLCBub2RlKTtcbiAgICB9KTtcbiAgfSlcbn07IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIHRyYW5zZm9ybXMgPSByZXF1aXJlKCcuLi90cmFuc2Zvcm1zL2luZGV4Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyc2VUcmFuc2Zvcm1zKG1vZGVsLCBkZWYpIHtcbiAgdmFyIHR4ID0gbmV3IHRyYW5zZm9ybXNbZGVmLnR5cGVdKG1vZGVsLmdyYXBoKTtcbiAgaWYoZGVmLnR5cGUgPT0gJ2ZhY2V0Jykge1xuICAgIHZhciBwaXBlbGluZSA9IChkZWYudHJhbnNmb3JtfHxbXSlcbiAgICAgIC5tYXAoZnVuY3Rpb24odCkgeyByZXR1cm4gcGFyc2VUcmFuc2Zvcm1zKG1vZGVsLCB0KTsgfSk7XG4gICAgdHgucGlwZWxpbmUocGlwZWxpbmUpO1xuICB9XG5cbiAgLy8gV2Ugd2FudCB0byByZW5hbWUgb3V0cHV0IGZpZWxkcyBiZWZvcmUgc2V0dGluZyBhbnkgb3RoZXIgcHJvcGVydGllcyxcbiAgLy8gYXMgc3Vic2VxdWVudCBwcm9wZXJ0aWVzIG1heSByZXF1aXJlIG91dHB1dCB0byBiZSBzZXQgKGUuZy4gZ3JvdXAgYnkpLlxuICBpZihkZWYub3V0cHV0KSB0eC5vdXRwdXQoZGVmLm91dHB1dCk7XG5cbiAgZGwua2V5cyhkZWYpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgIGlmKGsgPT09ICd0eXBlJyB8fCBrID09PSAnb3V0cHV0JykgcmV0dXJuO1xuICAgIGlmKGsgPT09ICd0cmFuc2Zvcm0nICYmIGRlZi50eXBlID09PSAnZmFjZXQnKSByZXR1cm47XG4gICAgKHR4W2tdKS5zZXQodHgsIGRlZltrXSk7XG4gIH0pO1xuXG4gIHJldHVybiB0eDtcbn07IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgbWFya3MgPSByZXF1aXJlKCcuL21hcmtzJyk7XG5cbnZhciBoYW5kbGVyID0gZnVuY3Rpb24oZWwsIG1vZGVsKSB7XG4gIHRoaXMuX2FjdGl2ZSA9IG51bGw7XG4gIHRoaXMuX2hhbmRsZXJzID0ge307XG4gIGlmIChlbCkgdGhpcy5pbml0aWFsaXplKGVsKTtcbiAgaWYgKG1vZGVsKSB0aGlzLm1vZGVsKG1vZGVsKTtcbn07XG5cbnZhciBwcm90b3R5cGUgPSBoYW5kbGVyLnByb3RvdHlwZTtcblxucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbihlbCwgcGFkLCBvYmopIHtcbiAgdGhpcy5fZWwgPSBkMy5zZWxlY3QoZWwpLm5vZGUoKTtcbiAgdGhpcy5fY2FudmFzID0gZDMuc2VsZWN0KGVsKS5zZWxlY3QoXCJjYW52YXMubWFya3NcIikubm9kZSgpO1xuICB0aGlzLl9wYWRkaW5nID0gcGFkO1xuICB0aGlzLl9vYmogPSBvYmogfHwgbnVsbDtcbiAgXG4gIC8vIGFkZCBldmVudCBsaXN0ZW5lcnNcbiAgdmFyIGNhbnZhcyA9IHRoaXMuX2NhbnZhcywgdGhhdCA9IHRoaXM7XG4gIGV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHR5cGUpIHtcbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmdW5jdGlvbihldnQpIHtcbiAgICAgIHByb3RvdHlwZVt0eXBlXS5jYWxsKHRoYXQsIGV2dCk7XG4gICAgfSk7XG4gIH0pO1xuICBcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUucGFkZGluZyA9IGZ1bmN0aW9uKHBhZCkge1xuICB0aGlzLl9wYWRkaW5nID0gcGFkO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5tb2RlbCA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX21vZGVsO1xuICB0aGlzLl9tb2RlbCA9IG1vZGVsO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5oYW5kbGVycyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaCA9IHRoaXMuX2hhbmRsZXJzO1xuICByZXR1cm4gZGwua2V5cyhoKS5yZWR1Y2UoZnVuY3Rpb24oYSwgaykge1xuICAgIHJldHVybiBoW2tdLnJlZHVjZShmdW5jdGlvbihhLCB4KSB7IHJldHVybiAoYS5wdXNoKHgpLCBhKTsgfSwgYSk7XG4gIH0sIFtdKTtcbn07XG5cbi8vIHNldHVwIGV2ZW50c1xudmFyIGV2ZW50cyA9IFtcbiAgXCJtb3VzZWRvd25cIixcbiAgXCJtb3VzZXVwXCIsXG4gIFwiY2xpY2tcIixcbiAgXCJkYmxjbGlja1wiLFxuICBcIndoZWVsXCIsXG4gIFwia2V5ZG93blwiLFxuICBcImtleXByZXNzXCIsXG4gIFwia2V5dXBcIixcbiAgXCJtb3VzZXdoZWVsXCIsXG4gIFwidG91Y2hzdGFydFwiXG5dO1xuZXZlbnRzLmZvckVhY2goZnVuY3Rpb24odHlwZSkge1xuICBwcm90b3R5cGVbdHlwZV0gPSBmdW5jdGlvbihldnQpIHtcbiAgICB0aGlzLmZpcmUodHlwZSwgZXZ0KTtcbiAgfTtcbn0pO1xuZXZlbnRzLnB1c2goXCJtb3VzZW1vdmVcIik7XG5ldmVudHMucHVzaChcIm1vdXNlb3V0XCIpO1xuZXZlbnRzLnB1c2goXCJ0b3VjaG1vdmVcIik7XG5ldmVudHMucHVzaChcInRvdWNoZW5kXCIpO1xuXG5mdW5jdGlvbiBldmVudE5hbWUobmFtZSkge1xuICB2YXIgaSA9IG5hbWUuaW5kZXhPZihcIi5cIik7XG4gIHJldHVybiBpIDwgMCA/IG5hbWUgOiBuYW1lLnNsaWNlKDAsaSk7XG59XG5cbnByb3RvdHlwZS50b3VjaG1vdmUgPSBwcm90b3R5cGUubW91c2Vtb3ZlID0gZnVuY3Rpb24oZXZ0KSB7XG4gIHZhciBwYWQgPSB0aGlzLl9wYWRkaW5nLFxuICAgICAgYiA9IGV2dC50YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICB4ID0gZXZ0LmNsaWVudFggLSBiLmxlZnQsXG4gICAgICB5ID0gZXZ0LmNsaWVudFkgLSBiLnRvcCxcbiAgICAgIGEgPSB0aGlzLl9hY3RpdmUsXG4gICAgICBwID0gdGhpcy5waWNrKHRoaXMuX21vZGVsLnNjZW5lKCksIHgsIHksIHgtcGFkLmxlZnQsIHktcGFkLnRvcCk7XG5cbiAgaWYgKHAgPT09IGEpIHtcbiAgICB0aGlzLmZpcmUoXCJtb3VzZW1vdmVcIiwgZXZ0KTtcbiAgICBpZihldnQudHlwZSA9PSBcInRvdWNobW92ZVwiKSB0aGlzLmZpcmUoXCJ0b3VjaG1vdmVcIiwgZXZ0KTtcbiAgICByZXR1cm47XG4gIH0gZWxzZSBpZiAoYSkge1xuICAgIHRoaXMuZmlyZShcIm1vdXNlb3V0XCIsIGV2dCk7XG4gICAgaWYoZXZ0LnR5cGUgPT0gXCJ0b3VjaGVuZFwiKSB0aGlzLmZpcmUoXCJ0b3VjaGVuZFwiLCBldnQpO1xuICB9XG4gIHRoaXMuX2FjdGl2ZSA9IHA7XG4gIGlmIChwKSB7XG4gICAgdGhpcy5maXJlKFwibW91c2VvdmVyXCIsIGV2dCk7XG4gICAgaWYoZXZ0LnR5cGUgPT0gXCJ0b3VjaHN0YXJ0XCIpIHRoaXMuZmlyZShcInRvdWNoc3RhcnRcIiwgZXZ0KTtcbiAgfVxufTtcblxucHJvdG90eXBlLnRvdWNoZW5kID0gcHJvdG90eXBlLm1vdXNlb3V0ID0gZnVuY3Rpb24oZXZ0KSB7XG4gIGlmICh0aGlzLl9hY3RpdmUpIHtcbiAgICB0aGlzLmZpcmUoXCJtb3VzZW91dFwiLCBldnQpO1xuICAgIHRoaXMuZmlyZShcInRvdWNoZW5kXCIsIGV2dCk7XG4gIH1cbiAgdGhpcy5fYWN0aXZlID0gbnVsbDtcbn07XG5cbi8vIHRvIGtlZXAgZmlyZWZveCBoYXBweVxucHJvdG90eXBlLkRPTU1vdXNlU2Nyb2xsID0gZnVuY3Rpb24oZXZ0KSB7XG4gIHRoaXMuZmlyZShcIm1vdXNld2hlZWxcIiwgZXZ0KTtcbn07XG5cbi8vIGZpcmUgYW4gZXZlbnRcbnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24odHlwZSwgZXZ0KSB7XG4gIHZhciBhID0gdGhpcy5fYWN0aXZlLFxuICAgICAgaCA9IHRoaXMuX2hhbmRsZXJzW3R5cGVdO1xuICBpZiAoaCkge1xuICAgIGZvciAodmFyIGk9MCwgbGVuPWgubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgICBoW2ldLmhhbmRsZXIuY2FsbCh0aGlzLl9vYmosIGV2dCwgYSk7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhZGQgYW4gZXZlbnQgaGFuZGxlclxucHJvdG90eXBlLm9uID0gZnVuY3Rpb24odHlwZSwgaGFuZGxlcikge1xuICB2YXIgbmFtZSA9IGV2ZW50TmFtZSh0eXBlKSxcbiAgICAgIGggPSB0aGlzLl9oYW5kbGVycztcbiAgaCA9IGhbbmFtZV0gfHwgKGhbbmFtZV0gPSBbXSk7XG4gIGgucHVzaCh7XG4gICAgdHlwZTogdHlwZSxcbiAgICBoYW5kbGVyOiBoYW5kbGVyXG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIHJlbW92ZSBhbiBldmVudCBoYW5kbGVyXG5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24odHlwZSwgaGFuZGxlcikge1xuICB2YXIgbmFtZSA9IGV2ZW50TmFtZSh0eXBlKSxcbiAgICAgIGggPSB0aGlzLl9oYW5kbGVyc1tuYW1lXTtcbiAgaWYgKCFoKSByZXR1cm47XG4gIGZvciAodmFyIGk9aC5sZW5ndGg7IC0taT49MDspIHtcbiAgICBpZiAoaFtpXS50eXBlICE9PSB0eXBlKSBjb250aW51ZTtcbiAgICBpZiAoIWhhbmRsZXIgfHwgaFtpXS5oYW5kbGVyID09PSBoYW5kbGVyKSBoLnNwbGljZShpLCAxKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIHJldHJpZXZlIHRoZSBjdXJyZW50IGNhbnZhcyBjb250ZXh0XG5wcm90b3R5cGUuY29udGV4dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5fY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbn07XG5cbi8vIGZpbmQgdGhlIHNjZW5lZ3JhcGggaXRlbSBhdCB0aGUgY3VycmVudCBtb3VzZSBwb3NpdGlvblxuLy8geCwgeSAtLSB0aGUgYWJzb2x1dGUgeCwgeSBtb3VzZSBjb29yZGluYXRlcyBvbiB0aGUgY2FudmFzIGVsZW1lbnRcbi8vIGd4LCBneSAtLSB0aGUgcmVsYXRpdmUgY29vcmRpbmF0ZXMgd2l0aGluIHRoZSBjdXJyZW50IGdyb3VwXG5wcm90b3R5cGUucGljayA9IGZ1bmN0aW9uKHNjZW5lLCB4LCB5LCBneCwgZ3kpIHtcbiAgdmFyIGcgPSB0aGlzLmNvbnRleHQoKSxcbiAgICAgIG1hcmt0eXBlID0gc2NlbmUubWFya3R5cGUsXG4gICAgICBwaWNrZXIgPSBtYXJrcy5waWNrW21hcmt0eXBlXTtcbiAgcmV0dXJuIHBpY2tlci5jYWxsKHRoaXMsIGcsIHNjZW5lLCB4LCB5LCBneCwgZ3kpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBoYW5kbGVyOyIsInZhciBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICAgIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIEJvdW5kcyA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvQm91bmRzJyksXG4gICAgY29uZmlnID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9jb25maWcnKSxcbiAgICBtYXJrcyA9IHJlcXVpcmUoJy4vbWFya3MnKTtcblxudmFyIHJlbmRlcmVyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2N0eCA9IG51bGw7XG4gIHRoaXMuX2VsID0gbnVsbDtcbiAgdGhpcy5faW1nbG9hZCA9IDA7XG59O1xuXG52YXIgcHJvdG90eXBlID0gcmVuZGVyZXIucHJvdG90eXBlO1xuXG5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKGVsLCB3aWR0aCwgaGVpZ2h0LCBwYWQpIHtcbiAgdGhpcy5fZWwgPSBlbDtcbiAgXG4gIGlmICghZWwpIHJldHVybiB0aGlzOyAvLyBlYXJseSBleGl0IGlmIG5vIERPTSBlbGVtZW50XG5cbiAgLy8gc2VsZWN0IGNhbnZhcyBlbGVtZW50XG4gIHZhciBjYW52YXMgPSBkMy5zZWxlY3QoZWwpXG4gICAgLnNlbGVjdEFsbChcImNhbnZhcy5tYXJrc1wiKVxuICAgIC5kYXRhKFsxXSk7XG4gIFxuICAvLyBjcmVhdGUgbmV3IGNhbnZhcyBlbGVtZW50IGlmIG5lZWRlZFxuICBjYW52YXMuZW50ZXIoKVxuICAgIC5hcHBlbmQoXCJjYW52YXNcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwibWFya3NcIik7XG4gIFxuICAvLyByZW1vdmUgZXh0cmFuZW91cyBjYW52YXMgaWYgbmVlZGVkXG4gIGNhbnZhcy5leGl0KCkucmVtb3ZlKCk7XG4gIFxuICByZXR1cm4gdGhpcy5yZXNpemUod2lkdGgsIGhlaWdodCwgcGFkKTtcbn07XG5cbnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBwYWQpIHtcbiAgdGhpcy5fd2lkdGggPSB3aWR0aDtcbiAgdGhpcy5faGVpZ2h0ID0gaGVpZ2h0O1xuICB0aGlzLl9wYWRkaW5nID0gcGFkO1xuICBcbiAgaWYgKHRoaXMuX2VsKSB7XG4gICAgdmFyIGNhbnZhcyA9IGQzLnNlbGVjdCh0aGlzLl9lbCkuc2VsZWN0KFwiY2FudmFzLm1hcmtzXCIpO1xuXG4gICAgLy8gaW5pdGlhbGl6ZSBjYW52YXMgYXR0cmlidXRlc1xuICAgIGNhbnZhc1xuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIHBhZC5sZWZ0ICsgcGFkLnJpZ2h0KVxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0ICsgcGFkLnRvcCArIHBhZC5ib3R0b20pO1xuXG4gICAgLy8gZ2V0IHRoZSBjYW52YXMgZ3JhcGhpY3MgY29udGV4dFxuICAgIHZhciBzO1xuICAgIHRoaXMuX2N0eCA9IGNhbnZhcy5ub2RlKCkuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgIHRoaXMuX2N0eC5fcmF0aW8gPSAocyA9IHNjYWxlQ2FudmFzKGNhbnZhcy5ub2RlKCksIHRoaXMuX2N0eCkgfHwgMSk7XG4gICAgdGhpcy5fY3R4LnNldFRyYW5zZm9ybShzLCAwLCAwLCBzLCBzKnBhZC5sZWZ0LCBzKnBhZC50b3ApO1xuICB9XG4gIFxuICBpbml0aWFsaXplTGluZURhc2godGhpcy5fY3R4KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiBzY2FsZUNhbnZhcyhjYW52YXMsIGN0eCkge1xuICAvLyBnZXQgY2FudmFzIHBpeGVsIGRhdGFcbiAgdmFyIGRldmljZVBpeGVsUmF0aW8gPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxLFxuICAgICAgYmFja2luZ1N0b3JlUmF0aW8gPSAoXG4gICAgICAgIGN0eC53ZWJraXRCYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XG4gICAgICAgIGN0eC5tb3pCYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XG4gICAgICAgIGN0eC5tc0JhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHxcbiAgICAgICAgY3R4Lm9CYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XG4gICAgICAgIGN0eC5iYWNraW5nU3RvcmVQaXhlbFJhdGlvKSB8fCAxLFxuICAgICAgcmF0aW8gPSBkZXZpY2VQaXhlbFJhdGlvIC8gYmFja2luZ1N0b3JlUmF0aW87XG5cbiAgaWYgKGRldmljZVBpeGVsUmF0aW8gIT09IGJhY2tpbmdTdG9yZVJhdGlvKSB7XG4gICAgdmFyIHcgPSBjYW52YXMud2lkdGgsIGggPSBjYW52YXMuaGVpZ2h0O1xuICAgIC8vIHNldCBhY3R1YWwgYW5kIHZpc2libGUgY2FudmFzIHNpemVcbiAgICBjYW52YXMuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgdyAqIHJhdGlvKTtcbiAgICBjYW52YXMuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIGggKiByYXRpbyk7XG4gICAgY2FudmFzLnN0eWxlLndpZHRoID0gdyArICdweCc7XG4gICAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGggKyAncHgnO1xuICB9XG4gIHJldHVybiByYXRpbztcbn1cblxuZnVuY3Rpb24gaW5pdGlhbGl6ZUxpbmVEYXNoKGN0eCkge1xuICBpZiAoY3R4LnZnTGluZURhc2gpIHJldHVybjsgLy8gYWxyZWFkeSBzZXRcblxuICB2YXIgTk9EQVNIID0gW107XG4gIGlmIChjdHguc2V0TGluZURhc2gpIHtcbiAgICBjdHgudmdMaW5lRGFzaCA9IGZ1bmN0aW9uKGRhc2gpIHsgdGhpcy5zZXRMaW5lRGFzaChkYXNoIHx8IE5PREFTSCk7IH07XG4gICAgY3R4LnZnTGluZURhc2hPZmZzZXQgPSBmdW5jdGlvbihvZmYpIHsgdGhpcy5saW5lRGFzaE9mZnNldCA9IG9mZjsgfTtcbiAgfSBlbHNlIGlmIChjdHgud2Via2l0TGluZURhc2ggIT09IHVuZGVmaW5lZCkge1xuICBcdGN0eC52Z0xpbmVEYXNoID0gZnVuY3Rpb24oZGFzaCkgeyB0aGlzLndlYmtpdExpbmVEYXNoID0gZGFzaCB8fCBOT0RBU0g7IH07XG4gICAgY3R4LnZnTGluZURhc2hPZmZzZXQgPSBmdW5jdGlvbihvZmYpIHsgdGhpcy53ZWJraXRMaW5lRGFzaE9mZnNldCA9IG9mZjsgfTtcbiAgfSBlbHNlIGlmIChjdHgubW96RGFzaCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY3R4LnZnTGluZURhc2ggPSBmdW5jdGlvbihkYXNoKSB7IHRoaXMubW96RGFzaCA9IGRhc2g7IH07XG4gICAgY3R4LnZnTGluZURhc2hPZmZzZXQgPSBmdW5jdGlvbihvZmYpIHsgLyogdW5zdXBwb3J0ZWQgKi8gfTtcbiAgfSBlbHNlIHtcbiAgICBjdHgudmdMaW5lRGFzaCA9IGZ1bmN0aW9uKGRhc2gpIHsgLyogdW5zdXBwb3J0ZWQgKi8gfTtcbiAgICBjdHgudmdMaW5lRGFzaE9mZnNldCA9IGZ1bmN0aW9uKG9mZikgeyAvKiB1bnN1cHBvcnRlZCAqLyB9O1xuICB9XG59XG5cbnByb3RvdHlwZS5jb250ZXh0ID0gZnVuY3Rpb24oY3R4KSB7XG4gIGlmIChjdHgpIHsgdGhpcy5fY3R4ID0gY3R4OyByZXR1cm4gdGhpczsgfVxuICBlbHNlIHJldHVybiB0aGlzLl9jdHg7XG59O1xuXG5wcm90b3R5cGUuZWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5fZWw7XG59O1xuXG5wcm90b3R5cGUucGVuZGluZ0ltYWdlcyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5faW1nbG9hZDtcbn07XG5cbmZ1bmN0aW9uIHRyYW5zbGF0ZWRCb3VuZHMoaXRlbSwgYm91bmRzKSB7XG4gIHZhciBiID0gbmV3IEJvdW5kcyhib3VuZHMpO1xuICB3aGlsZSAoKGl0ZW0gPSBpdGVtLm1hcmsuZ3JvdXApICE9IG51bGwpIHtcbiAgICBiLnRyYW5zbGF0ZShpdGVtLnggfHwgMCwgaXRlbS55IHx8IDApO1xuICB9XG4gIHJldHVybiBiO1xufVxuICBcbmZ1bmN0aW9uIGdldEJvdW5kcyhpdGVtcykge1xuICByZXR1cm4gIWl0ZW1zID8gbnVsbCA6XG4gICAgZGwuYXJyYXkoaXRlbXMpLnJlZHVjZShmdW5jdGlvbihiLCBpdGVtKSB7XG4gICAgICByZXR1cm4gYi51bmlvbih0cmFuc2xhdGVkQm91bmRzKGl0ZW0sIGl0ZW0uYm91bmRzKSlcbiAgICAgICAgICAgICAgLnVuaW9uKHRyYW5zbGF0ZWRCb3VuZHMoaXRlbSwgaXRlbVsnYm91bmRzOnByZXYnXSkpO1xuICAgIH0sIG5ldyBCb3VuZHMoKSk7ICBcbn1cblxuZnVuY3Rpb24gc2V0Qm91bmRzKGcsIGJvdW5kcykge1xuICB2YXIgYmJveCA9IG51bGw7XG4gIGlmIChib3VuZHMpIHtcbiAgICBiYm94ID0gKG5ldyBCb3VuZHMoYm91bmRzKSkucm91bmQoKTtcbiAgICBnLmJlZ2luUGF0aCgpO1xuICAgIGcucmVjdChiYm94LngxLCBiYm94LnkxLCBiYm94LndpZHRoKCksIGJib3guaGVpZ2h0KCkpO1xuICAgIGcuY2xpcCgpO1xuICB9XG4gIHJldHVybiBiYm94O1xufVxuXG5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oc2NlbmUsIGl0ZW1zKSB7XG4gIHZhciBnID0gdGhpcy5fY3R4LFxuICAgICAgcGFkID0gdGhpcy5fcGFkZGluZyxcbiAgICAgIHcgPSB0aGlzLl93aWR0aCArIHBhZC5sZWZ0ICsgcGFkLnJpZ2h0LFxuICAgICAgaCA9IHRoaXMuX2hlaWdodCArIHBhZC50b3AgKyBwYWQuYm90dG9tLFxuICAgICAgYmIgPSBudWxsLCBiYjI7XG5cbiAgLy8gc2V0dXBcbiAgdGhpcy5fc2NlbmUgPSBzY2VuZTtcbiAgZy5zYXZlKCk7XG4gIGJiID0gc2V0Qm91bmRzKGcsIGdldEJvdW5kcyhpdGVtcykpO1xuICBnLmNsZWFyUmVjdCgtcGFkLmxlZnQsIC1wYWQudG9wLCB3LCBoKTtcblxuICAvLyByZW5kZXJcbiAgdGhpcy5kcmF3KGcsIHNjZW5lLCBiYik7XG5cbiAgLy8gcmVuZGVyIGFnYWluIHRvIGhhbmRsZSBwb3NzaWJsZSBib3VuZHMgY2hhbmdlXG4gIGlmIChpdGVtcykge1xuICAgIGcucmVzdG9yZSgpO1xuICAgIGcuc2F2ZSgpO1xuICAgIGJiMiA9IHNldEJvdW5kcyhnLCBnZXRCb3VuZHMoaXRlbXMpKTtcbiAgICBpZiAoIWJiLmVuY2xvc2VzKGJiMikpIHtcbiAgICAgIGcuY2xlYXJSZWN0KC1wYWQubGVmdCwgLXBhZC50b3AsIHcsIGgpO1xuICAgICAgdGhpcy5kcmF3KGcsIHNjZW5lLCBiYjIpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gdGFrZWRvd25cbiAgZy5yZXN0b3JlKCk7XG4gIHRoaXMuX3NjZW5lID0gbnVsbDtcbn07XG5cbnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY3R4LCBzY2VuZSwgYm91bmRzKSB7XG4gIHZhciBtYXJrdHlwZSA9IHNjZW5lLm1hcmt0eXBlLFxuICAgICAgcmVuZGVyZXIgPSBtYXJrcy5kcmF3W21hcmt0eXBlXTtcbiAgcmVuZGVyZXIuY2FsbCh0aGlzLCBjdHgsIHNjZW5lLCBib3VuZHMpO1xufTtcblxucHJvdG90eXBlLnJlbmRlckFzeW5jID0gZnVuY3Rpb24oc2NlbmUpIHtcbiAgLy8gVE9ETyBtYWtlIHNhZmUgZm9yIG11bHRpcGxlIHNjZW5lIHJlbmRlcmluZz9cbiAgdmFyIHJlbmRlcmVyID0gdGhpcztcbiAgaWYgKHJlbmRlcmVyLl9hc3luY19pZCkge1xuICAgIGNsZWFyVGltZW91dChyZW5kZXJlci5fYXN5bmNfaWQpO1xuICB9XG4gIHJlbmRlcmVyLl9hc3luY19pZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lKTtcbiAgICBkZWxldGUgcmVuZGVyZXIuX2FzeW5jX2lkO1xuICB9LCA1MCk7XG59O1xuXG5wcm90b3R5cGUubG9hZEltYWdlID0gZnVuY3Rpb24odXJpKSB7XG4gIHZhciByZW5kZXJlciA9IHRoaXMsXG4gICAgICBzY2VuZSA9IHJlbmRlcmVyLl9zY2VuZSxcbiAgICAgIGltYWdlID0gbnVsbCwgdXJsO1xuXG4gIHJlbmRlcmVyLl9pbWdsb2FkICs9IDE7XG4gIGlmIChkbC5pc05vZGUpIHtcbiAgICBpbWFnZSA9IG5ldyAoKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuY2FudmFzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5jYW52YXMgOiBudWxsKS5JbWFnZSkoKTtcbiAgICBkbC5sb2FkKGRsLmV4dGVuZCh7dXJsOiB1cml9LCBjb25maWcubG9hZCksIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgaWYgKGVycikgeyBkbC5lcnJvcihlcnIpOyByZXR1cm47IH1cbiAgICAgIGltYWdlLnNyYyA9IGRhdGE7XG4gICAgICBpbWFnZS5sb2FkZWQgPSB0cnVlO1xuICAgICAgcmVuZGVyZXIuX2ltZ2xvYWQgLT0gMTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgIHVybCA9IGNvbmZpZy5iYXNlVVJMICsgdXJpO1xuICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaW1hZ2UubG9hZGVkID0gdHJ1ZTtcbiAgICAgIHJlbmRlcmVyLl9pbWdsb2FkIC09IDE7XG4gICAgICByZW5kZXJlci5yZW5kZXJBc3luYyhzY2VuZSk7XG4gICAgfTtcbiAgICBpbWFnZS5zcmMgPSB1cmw7XG4gIH1cblxuICByZXR1cm4gaW1hZ2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlbmRlcmVyOyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBIYW5kbGVyOiAgcmVxdWlyZSgnLi9IYW5kbGVyJyksXG4gIFJlbmRlcmVyOiByZXF1aXJlKCcuL1JlbmRlcmVyJylcbn07IiwidmFyIEJvdW5kcyA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvQm91bmRzJyksXG4gICAgYm91bmRzQ2FsYyA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvYm91bmRzJyksXG4gICAgY29uZmlnID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9jb25maWcnKSxcbiAgICBwYXRoID0gcmVxdWlyZSgnLi9wYXRoJyk7XG5cbnZhciBwYXJzZVBhdGggPSBwYXRoLnBhcnNlLFxuICAgIHJlbmRlclBhdGggPSBwYXRoLnJlbmRlcixcbiAgICBoYWxmcGkgPSBNYXRoLlBJIC8gMixcbiAgICBzcXJ0MyA9IE1hdGguc3FydCgzKSxcbiAgICB0YW4zMCA9IE1hdGgudGFuKDMwICogTWF0aC5QSSAvIDE4MCksXG4gICAgdG1wQm91bmRzID0gbmV3IEJvdW5kcygpO1xuXG5mdW5jdGlvbiBmb250U3RyaW5nKG8pIHtcbiAgcmV0dXJuIChvLmZvbnRTdHlsZSA/IG8uZm9udFN0eWxlICsgXCIgXCIgOiBcIlwiKVxuICAgICsgKG8uZm9udFZhcmlhbnQgPyBvLmZvbnRWYXJpYW50ICsgXCIgXCIgOiBcIlwiKVxuICAgICsgKG8uZm9udFdlaWdodCA/IG8uZm9udFdlaWdodCArIFwiIFwiIDogXCJcIilcbiAgICArIChvLmZvbnRTaXplICE9IG51bGwgPyBvLmZvbnRTaXplIDogY29uZmlnLnJlbmRlci5mb250U2l6ZSkgKyBcInB4IFwiXG4gICAgKyAoby5mb250IHx8IGNvbmZpZy5yZW5kZXIuZm9udCk7XG59XG5cbi8vIHBhdGggZ2VuZXJhdG9yc1xuXG5mdW5jdGlvbiBhcmNQYXRoKGcsIG8pIHtcbiAgdmFyIHggPSBvLnggfHwgMCxcbiAgICAgIHkgPSBvLnkgfHwgMCxcbiAgICAgIGlyID0gby5pbm5lclJhZGl1cyB8fCAwLFxuICAgICAgb3IgPSBvLm91dGVyUmFkaXVzIHx8IDAsXG4gICAgICBzYSA9IChvLnN0YXJ0QW5nbGUgfHwgMCkgLSBNYXRoLlBJLzIsXG4gICAgICBlYSA9IChvLmVuZEFuZ2xlIHx8IDApIC0gTWF0aC5QSS8yO1xuICBnLmJlZ2luUGF0aCgpO1xuICBpZiAoaXIgPT09IDApIGcubW92ZVRvKHgsIHkpO1xuICBlbHNlIGcuYXJjKHgsIHksIGlyLCBzYSwgZWEsIDApO1xuICBnLmFyYyh4LCB5LCBvciwgZWEsIHNhLCAxKTtcbiAgZy5jbG9zZVBhdGgoKTtcbn1cblxuZnVuY3Rpb24gYXJlYVBhdGgoZywgaXRlbXMpIHtcbiAgdmFyIG8gPSBpdGVtc1swXSxcbiAgICAgIG0gPSBvLm1hcmssXG4gICAgICBwID0gbS5wYXRoQ2FjaGUgfHwgKG0ucGF0aENhY2hlID0gcGFyc2VQYXRoKHBhdGguYXJlYShpdGVtcykpKTtcbiAgcmVuZGVyUGF0aChnLCBwKTtcbn1cblxuZnVuY3Rpb24gbGluZVBhdGgoZywgaXRlbXMpIHtcbiAgdmFyIG8gPSBpdGVtc1swXSxcbiAgICAgIG0gPSBvLm1hcmssXG4gICAgICBwID0gbS5wYXRoQ2FjaGUgfHwgKG0ucGF0aENhY2hlID0gcGFyc2VQYXRoKHBhdGgubGluZShpdGVtcykpKTtcbiAgcmVuZGVyUGF0aChnLCBwKTtcbn1cblxuZnVuY3Rpb24gcGF0aFBhdGgoZywgbykge1xuICBpZiAoby5wYXRoID09IG51bGwpIHJldHVybjtcbiAgdmFyIHAgPSBvLnBhdGhDYWNoZSB8fCAoby5wYXRoQ2FjaGUgPSBwYXJzZVBhdGgoby5wYXRoKSk7XG4gIHJldHVybiByZW5kZXJQYXRoKGcsIHAsIG8ueCwgby55KTtcbn1cblxuZnVuY3Rpb24gc3ltYm9sUGF0aChnLCBvKSB7XG4gIGcuYmVnaW5QYXRoKCk7XG4gIHZhciBzaXplID0gby5zaXplICE9IG51bGwgPyBvLnNpemUgOiAxMDAsXG4gICAgICB4ID0gby54LCB5ID0gby55LCByLCB0LCByeCwgcnk7XG5cbiAgaWYgKG8uc2hhcGUgPT0gbnVsbCB8fCBvLnNoYXBlID09PSBcImNpcmNsZVwiKSB7XG4gICAgciA9IE1hdGguc3FydChzaXplL01hdGguUEkpO1xuICAgIGcuYXJjKHgsIHksIHIsIDAsIDIqTWF0aC5QSSwgMCk7XG4gICAgZy5jbG9zZVBhdGgoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBzd2l0Y2ggKG8uc2hhcGUpIHtcbiAgICBjYXNlIFwiY3Jvc3NcIjpcbiAgICAgIHIgPSBNYXRoLnNxcnQoc2l6ZSAvIDUpIC8gMjtcbiAgICAgIHQgPSAzKnI7XG4gICAgICBnLm1vdmVUbyh4LXQsIHktcik7XG4gICAgICBnLmxpbmVUbyh4LXIsIHktcik7XG4gICAgICBnLmxpbmVUbyh4LXIsIHktdCk7XG4gICAgICBnLmxpbmVUbyh4K3IsIHktdCk7XG4gICAgICBnLmxpbmVUbyh4K3IsIHktcik7XG4gICAgICBnLmxpbmVUbyh4K3QsIHktcik7XG4gICAgICBnLmxpbmVUbyh4K3QsIHkrcik7XG4gICAgICBnLmxpbmVUbyh4K3IsIHkrcik7XG4gICAgICBnLmxpbmVUbyh4K3IsIHkrdCk7XG4gICAgICBnLmxpbmVUbyh4LXIsIHkrdCk7XG4gICAgICBnLmxpbmVUbyh4LXIsIHkrcik7XG4gICAgICBnLmxpbmVUbyh4LXQsIHkrcik7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgXCJkaWFtb25kXCI6XG4gICAgICByeSA9IE1hdGguc3FydChzaXplIC8gKDIgKiB0YW4zMCkpO1xuICAgICAgcnggPSByeSAqIHRhbjMwO1xuICAgICAgZy5tb3ZlVG8oeCwgeS1yeSk7XG4gICAgICBnLmxpbmVUbyh4K3J4LCB5KTtcbiAgICAgIGcubGluZVRvKHgsIHkrcnkpO1xuICAgICAgZy5saW5lVG8oeC1yeCwgeSk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgXCJzcXVhcmVcIjpcbiAgICAgIHQgPSBNYXRoLnNxcnQoc2l6ZSk7XG4gICAgICByID0gdCAvIDI7XG4gICAgICBnLnJlY3QoeC1yLCB5LXIsIHQsIHQpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIFwidHJpYW5nbGUtZG93blwiOlxuICAgICAgcnggPSBNYXRoLnNxcnQoc2l6ZSAvIHNxcnQzKTtcbiAgICAgIHJ5ID0gcnggKiBzcXJ0MyAvIDI7XG4gICAgICBnLm1vdmVUbyh4LCB5K3J5KTtcbiAgICAgIGcubGluZVRvKHgrcngsIHktcnkpO1xuICAgICAgZy5saW5lVG8oeC1yeCwgeS1yeSk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgXCJ0cmlhbmdsZS11cFwiOlxuICAgICAgcnggPSBNYXRoLnNxcnQoc2l6ZSAvIHNxcnQzKTtcbiAgICAgIHJ5ID0gcnggKiBzcXJ0MyAvIDI7XG4gICAgICBnLm1vdmVUbyh4LCB5LXJ5KTtcbiAgICAgIGcubGluZVRvKHgrcngsIHkrcnkpO1xuICAgICAgZy5saW5lVG8oeC1yeCwgeStyeSk7XG4gIH1cbiAgZy5jbG9zZVBhdGgoKTtcbn1cblxuZnVuY3Rpb24gbGluZVN0cm9rZShnLCBpdGVtcykge1xuICB2YXIgbyA9IGl0ZW1zWzBdLFxuICAgICAgbHcgPSBvLnN0cm9rZVdpZHRoLFxuICAgICAgbGMgPSBvLnN0cm9rZUNhcDtcbiAgZy5saW5lV2lkdGggPSBsdyAhPSBudWxsID8gbHcgOiBjb25maWcucmVuZGVyLmxpbmVXaWR0aDtcbiAgZy5saW5lQ2FwICAgPSBsYyAhPSBudWxsID8gbGMgOiBjb25maWcucmVuZGVyLmxpbmVDYXA7XG4gIGxpbmVQYXRoKGcsIGl0ZW1zKTtcbn1cblxuZnVuY3Rpb24gcnVsZVN0cm9rZShnLCBvKSB7XG4gIHZhciB4MSA9IG8ueCB8fCAwLFxuICAgICAgeTEgPSBvLnkgfHwgMCxcbiAgICAgIHgyID0gby54MiAhPSBudWxsID8gby54MiA6IHgxLFxuICAgICAgeTIgPSBvLnkyICE9IG51bGwgPyBvLnkyIDogeTEsXG4gICAgICBsdyA9IG8uc3Ryb2tlV2lkdGgsXG4gICAgICBsYyA9IG8uc3Ryb2tlQ2FwO1xuXG4gIGcubGluZVdpZHRoID0gbHcgIT0gbnVsbCA/IGx3IDogY29uZmlnLnJlbmRlci5saW5lV2lkdGg7XG4gIGcubGluZUNhcCAgID0gbGMgIT0gbnVsbCA/IGxjIDogY29uZmlnLnJlbmRlci5saW5lQ2FwO1xuICBnLmJlZ2luUGF0aCgpO1xuICBnLm1vdmVUbyh4MSwgeTEpO1xuICBnLmxpbmVUbyh4MiwgeTIpO1xufVxuXG4vLyBkcmF3aW5nIGZ1bmN0aW9uc1xuXG5mdW5jdGlvbiBkcmF3UGF0aE9uZShwYXRoLCBnLCBvLCBpdGVtcykge1xuICB2YXIgZmlsbCA9IG8uZmlsbCwgc3Ryb2tlID0gby5zdHJva2UsIG9wYWMsIGxjLCBsdztcblxuICBwYXRoKGcsIGl0ZW1zKTtcblxuICBvcGFjID0gby5vcGFjaXR5ID09IG51bGwgPyAxIDogby5vcGFjaXR5O1xuICBpZiAob3BhYyA9PSAwIHx8ICFmaWxsICYmICFzdHJva2UpIHJldHVybjtcblxuICBpZiAoZmlsbCkge1xuICAgIGcuZ2xvYmFsQWxwaGEgPSBvcGFjICogKG8uZmlsbE9wYWNpdHk9PW51bGwgPyAxIDogby5maWxsT3BhY2l0eSk7XG4gICAgZy5maWxsU3R5bGUgPSBjb2xvcihnLCBvLCBmaWxsKTtcbiAgICBnLmZpbGwoKTtcbiAgfVxuXG4gIGlmIChzdHJva2UpIHtcbiAgICBsdyA9IChsdyA9IG8uc3Ryb2tlV2lkdGgpICE9IG51bGwgPyBsdyA6IGNvbmZpZy5yZW5kZXIubGluZVdpZHRoO1xuICAgIGlmIChsdyA+IDApIHtcbiAgICAgIGcuZ2xvYmFsQWxwaGEgPSBvcGFjICogKG8uc3Ryb2tlT3BhY2l0eT09bnVsbCA/IDEgOiBvLnN0cm9rZU9wYWNpdHkpO1xuICAgICAgZy5zdHJva2VTdHlsZSA9IGNvbG9yKGcsIG8sIHN0cm9rZSk7XG4gICAgICBnLmxpbmVXaWR0aCA9IGx3O1xuICAgICAgZy5saW5lQ2FwID0gKGxjID0gby5zdHJva2VDYXApICE9IG51bGwgPyBsYyA6IGNvbmZpZy5yZW5kZXIubGluZUNhcDtcbiAgICAgIGcudmdMaW5lRGFzaChvLnN0cm9rZURhc2ggfHwgbnVsbCk7XG4gICAgICBnLnZnTGluZURhc2hPZmZzZXQoby5zdHJva2VEYXNoT2Zmc2V0IHx8IDApO1xuICAgICAgZy5zdHJva2UoKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZHJhd1BhdGhBbGwocGF0aCwgZywgc2NlbmUsIGJvdW5kcykge1xuICB2YXIgaSwgbGVuLCBpdGVtO1xuICBmb3IgKGk9MCwgbGVuPXNjZW5lLml0ZW1zLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIGl0ZW0gPSBzY2VuZS5pdGVtc1tpXTtcbiAgICBpZiAoYm91bmRzICYmICFib3VuZHMuaW50ZXJzZWN0cyhpdGVtLmJvdW5kcykpXG4gICAgICBjb250aW51ZTsgLy8gYm91bmRzIGNoZWNrXG4gICAgZHJhd1BhdGhPbmUocGF0aCwgZywgaXRlbSwgaXRlbSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZHJhd1JlY3QoZywgc2NlbmUsIGJvdW5kcykge1xuICBpZiAoIXNjZW5lLml0ZW1zLmxlbmd0aCkgcmV0dXJuO1xuICB2YXIgaXRlbXMgPSBzY2VuZS5pdGVtcyxcbiAgICAgIG8sIGZpbGwsIHN0cm9rZSwgb3BhYywgbGMsIGx3LCB4LCB5LCB3LCBoO1xuXG4gIGZvciAodmFyIGk9MCwgbGVuPWl0ZW1zLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIG8gPSBpdGVtc1tpXTtcbiAgICBpZiAoYm91bmRzICYmICFib3VuZHMuaW50ZXJzZWN0cyhvLmJvdW5kcykpXG4gICAgICBjb250aW51ZTsgLy8gYm91bmRzIGNoZWNrXG5cbiAgICB4ID0gby54IHx8IDA7XG4gICAgeSA9IG8ueSB8fCAwO1xuICAgIHcgPSBvLndpZHRoIHx8IDA7XG4gICAgaCA9IG8uaGVpZ2h0IHx8IDA7XG5cbiAgICBvcGFjID0gby5vcGFjaXR5ID09IG51bGwgPyAxIDogby5vcGFjaXR5O1xuICAgIGlmIChvcGFjID09IDApIGNvbnRpbnVlO1xuXG4gICAgaWYgKGZpbGwgPSBvLmZpbGwpIHtcbiAgICAgIGcuZ2xvYmFsQWxwaGEgPSBvcGFjICogKG8uZmlsbE9wYWNpdHk9PW51bGwgPyAxIDogby5maWxsT3BhY2l0eSk7XG4gICAgICBnLmZpbGxTdHlsZSA9IGNvbG9yKGcsIG8sIGZpbGwpO1xuICAgICAgZy5maWxsUmVjdCh4LCB5LCB3LCBoKTtcbiAgICB9XG5cbiAgICBpZiAoc3Ryb2tlID0gby5zdHJva2UpIHtcbiAgICAgIGx3ID0gKGx3ID0gby5zdHJva2VXaWR0aCkgIT0gbnVsbCA/IGx3IDogY29uZmlnLnJlbmRlci5saW5lV2lkdGg7XG4gICAgICBpZiAobHcgPiAwKSB7XG4gICAgICAgIGcuZ2xvYmFsQWxwaGEgPSBvcGFjICogKG8uc3Ryb2tlT3BhY2l0eT09bnVsbCA/IDEgOiBvLnN0cm9rZU9wYWNpdHkpO1xuICAgICAgICBnLnN0cm9rZVN0eWxlID0gY29sb3IoZywgbywgc3Ryb2tlKTtcbiAgICAgICAgZy5saW5lV2lkdGggPSBsdztcbiAgICAgICAgZy5saW5lQ2FwID0gKGxjID0gby5zdHJva2VDYXApICE9IG51bGwgPyBsYyA6IGNvbmZpZy5yZW5kZXIubGluZUNhcDtcbiAgICAgICAgZy52Z0xpbmVEYXNoKG8uc3Ryb2tlRGFzaCB8fCBudWxsKTtcbiAgICAgICAgZy52Z0xpbmVEYXNoT2Zmc2V0KG8uc3Ryb2tlRGFzaE9mZnNldCB8fCAwKTtcbiAgICAgICAgZy5zdHJva2VSZWN0KHgsIHksIHcsIGgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkcmF3UnVsZShnLCBzY2VuZSwgYm91bmRzKSB7XG4gIGlmICghc2NlbmUuaXRlbXMubGVuZ3RoKSByZXR1cm47XG4gIHZhciBpdGVtcyA9IHNjZW5lLml0ZW1zLFxuICAgICAgbywgc3Ryb2tlLCBvcGFjLCBsYywgbHcsIHgxLCB5MSwgeDIsIHkyO1xuXG4gIGZvciAodmFyIGk9MCwgbGVuPWl0ZW1zLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIG8gPSBpdGVtc1tpXTtcbiAgICBpZiAoYm91bmRzICYmICFib3VuZHMuaW50ZXJzZWN0cyhvLmJvdW5kcykpXG4gICAgICBjb250aW51ZTsgLy8gYm91bmRzIGNoZWNrXG5cbiAgICB4MSA9IG8ueCB8fCAwO1xuICAgIHkxID0gby55IHx8IDA7XG4gICAgeDIgPSBvLngyICE9IG51bGwgPyBvLngyIDogeDE7XG4gICAgeTIgPSBvLnkyICE9IG51bGwgPyBvLnkyIDogeTE7XG5cbiAgICBvcGFjID0gby5vcGFjaXR5ID09IG51bGwgPyAxIDogby5vcGFjaXR5O1xuICAgIGlmIChvcGFjID09IDApIGNvbnRpbnVlO1xuICAgIFxuICAgIGlmIChzdHJva2UgPSBvLnN0cm9rZSkge1xuICAgICAgbHcgPSAobHcgPSBvLnN0cm9rZVdpZHRoKSAhPSBudWxsID8gbHcgOiBjb25maWcucmVuZGVyLmxpbmVXaWR0aDtcbiAgICAgIGlmIChsdyA+IDApIHtcbiAgICAgICAgZy5nbG9iYWxBbHBoYSA9IG9wYWMgKiAoby5zdHJva2VPcGFjaXR5PT1udWxsID8gMSA6IG8uc3Ryb2tlT3BhY2l0eSk7XG4gICAgICAgIGcuc3Ryb2tlU3R5bGUgPSBjb2xvcihnLCBvLCBzdHJva2UpO1xuICAgICAgICBnLmxpbmVXaWR0aCA9IGx3O1xuICAgICAgICBnLmxpbmVDYXAgPSAobGMgPSBvLnN0cm9rZUNhcCkgIT0gbnVsbCA/IGxjIDogY29uZmlnLnJlbmRlci5saW5lQ2FwO1xuICAgICAgICBnLnZnTGluZURhc2goby5zdHJva2VEYXNoIHx8IG51bGwpO1xuICAgICAgICBnLnZnTGluZURhc2hPZmZzZXQoby5zdHJva2VEYXNoT2Zmc2V0IHx8IDApO1xuICAgICAgICBnLmJlZ2luUGF0aCgpO1xuICAgICAgICBnLm1vdmVUbyh4MSwgeTEpO1xuICAgICAgICBnLmxpbmVUbyh4MiwgeTIpO1xuICAgICAgICBnLnN0cm9rZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkcmF3SW1hZ2UoZywgc2NlbmUsIGJvdW5kcykge1xuICBpZiAoIXNjZW5lLml0ZW1zLmxlbmd0aCkgcmV0dXJuO1xuICB2YXIgcmVuZGVyZXIgPSB0aGlzLFxuICAgICAgaXRlbXMgPSBzY2VuZS5pdGVtcywgbztcblxuICBmb3IgKHZhciBpPTAsIGxlbj1pdGVtcy5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBvID0gaXRlbXNbaV07XG4gICAgaWYgKGJvdW5kcyAmJiAhYm91bmRzLmludGVyc2VjdHMoby5ib3VuZHMpKVxuICAgICAgY29udGludWU7IC8vIGJvdW5kcyBjaGVja1xuXG4gICAgaWYgKCEoby5pbWFnZSAmJiBvLmltYWdlLnVybCA9PT0gby51cmwpKSB7XG4gICAgICBvLmltYWdlID0gcmVuZGVyZXIubG9hZEltYWdlKG8udXJsKTtcbiAgICAgIG8uaW1hZ2UudXJsID0gby51cmw7XG4gICAgfVxuXG4gICAgdmFyIHgsIHksIHcsIGgsIG9wYWM7XG4gICAgdyA9IG8ud2lkdGggfHwgKG8uaW1hZ2UgJiYgby5pbWFnZS53aWR0aCkgfHwgMDtcbiAgICBoID0gby5oZWlnaHQgfHwgKG8uaW1hZ2UgJiYgby5pbWFnZS5oZWlnaHQpIHx8IDA7XG4gICAgeCA9IChvLnh8fDApIC0gKG8uYWxpZ24gPT09IFwiY2VudGVyXCJcbiAgICAgID8gdy8yIDogKG8uYWxpZ24gPT09IFwicmlnaHRcIiA/IHcgOiAwKSk7XG4gICAgeSA9IChvLnl8fDApIC0gKG8uYmFzZWxpbmUgPT09IFwibWlkZGxlXCJcbiAgICAgID8gaC8yIDogKG8uYmFzZWxpbmUgPT09IFwiYm90dG9tXCIgPyBoIDogMCkpO1xuXG4gICAgaWYgKG8uaW1hZ2UubG9hZGVkKSB7XG4gICAgICBnLmdsb2JhbEFscGhhID0gKG9wYWMgPSBvLm9wYWNpdHkpICE9IG51bGwgPyBvcGFjIDogMTtcbiAgICAgIGcuZHJhd0ltYWdlKG8uaW1hZ2UsIHgsIHksIHcsIGgpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkcmF3VGV4dChnLCBzY2VuZSwgYm91bmRzKSB7XG4gIGlmICghc2NlbmUuaXRlbXMubGVuZ3RoKSByZXR1cm47XG4gIHZhciBpdGVtcyA9IHNjZW5lLml0ZW1zLFxuICAgICAgbywgZmlsbCwgc3Ryb2tlLCBvcGFjLCBsdywgeCwgeSwgciwgdDtcblxuICBmb3IgKHZhciBpPTAsIGxlbj1pdGVtcy5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBvID0gaXRlbXNbaV07XG4gICAgaWYgKGJvdW5kcyAmJiAhYm91bmRzLmludGVyc2VjdHMoby5ib3VuZHMpKVxuICAgICAgY29udGludWU7IC8vIGJvdW5kcyBjaGVja1xuXG4gICAgZy5mb250ID0gZm9udFN0cmluZyhvKTtcbiAgICBnLnRleHRBbGlnbiA9IG8uYWxpZ24gfHwgXCJsZWZ0XCI7XG4gICAgZy50ZXh0QmFzZWxpbmUgPSBvLmJhc2VsaW5lIHx8IFwiYWxwaGFiZXRpY1wiO1xuXG4gICAgb3BhYyA9IG8ub3BhY2l0eSA9PSBudWxsID8gMSA6IG8ub3BhY2l0eTtcbiAgICBpZiAob3BhYyA9PSAwKSBjb250aW51ZTtcblxuICAgIHggPSBvLnggfHwgMDtcbiAgICB5ID0gby55IHx8IDA7XG4gICAgaWYgKHIgPSBvLnJhZGl1cykge1xuICAgICAgdCA9IChvLnRoZXRhIHx8IDApIC0gTWF0aC5QSS8yO1xuICAgICAgeCArPSByICogTWF0aC5jb3ModCk7XG4gICAgICB5ICs9IHIgKiBNYXRoLnNpbih0KTtcbiAgICB9XG5cbiAgICBpZiAoby5hbmdsZSkge1xuICAgICAgZy5zYXZlKCk7XG4gICAgICBnLnRyYW5zbGF0ZSh4LCB5KTtcbiAgICAgIGcucm90YXRlKG8uYW5nbGUgKiBNYXRoLlBJLzE4MCk7XG4gICAgICB4ID0gby5keCB8fCAwO1xuICAgICAgeSA9IG8uZHkgfHwgMDtcbiAgICB9IGVsc2Uge1xuICAgICAgeCArPSAoby5keCB8fCAwKTtcbiAgICAgIHkgKz0gKG8uZHkgfHwgMCk7XG4gICAgfVxuXG4gICAgaWYgKGZpbGwgPSBvLmZpbGwpIHtcbiAgICAgIGcuZ2xvYmFsQWxwaGEgPSBvcGFjICogKG8uZmlsbE9wYWNpdHk9PW51bGwgPyAxIDogby5maWxsT3BhY2l0eSk7XG4gICAgICBnLmZpbGxTdHlsZSA9IGNvbG9yKGcsIG8sIGZpbGwpO1xuICAgICAgZy5maWxsVGV4dChvLnRleHQsIHgsIHkpO1xuICAgIH1cblxuICAgIGlmIChzdHJva2UgPSBvLnN0cm9rZSkge1xuICAgICAgbHcgPSAobHcgPSBvLnN0cm9rZVdpZHRoKSAhPSBudWxsID8gbHcgOiAxO1xuICAgICAgaWYgKGx3ID4gMCkge1xuICAgICAgICBnLmdsb2JhbEFscGhhID0gb3BhYyAqIChvLnN0cm9rZU9wYWNpdHk9PW51bGwgPyAxIDogby5zdHJva2VPcGFjaXR5KTtcbiAgICAgICAgZy5zdHJva2VTdHlsZSA9IGNvbG9yKG8sIHN0cm9rZSk7XG4gICAgICAgIGcubGluZVdpZHRoID0gbHc7XG4gICAgICAgIGcuc3Ryb2tlVGV4dChvLnRleHQsIHgsIHkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvLmFuZ2xlKSBnLnJlc3RvcmUoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkcmF3QWxsKHBhdGhGdW5jKSB7XG4gIHJldHVybiBmdW5jdGlvbihnLCBzY2VuZSwgYm91bmRzKSB7XG4gICAgZHJhd1BhdGhBbGwocGF0aEZ1bmMsIGcsIHNjZW5lLCBib3VuZHMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRyYXdPbmUocGF0aEZ1bmMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGcsIHNjZW5lLCBib3VuZHMpIHtcbiAgICBpZiAoIXNjZW5lLml0ZW1zLmxlbmd0aCkgcmV0dXJuO1xuICAgIGlmIChib3VuZHMgJiYgIWJvdW5kcy5pbnRlcnNlY3RzKHNjZW5lLml0ZW1zWzBdLmJvdW5kcykpXG4gICAgICByZXR1cm47IC8vIGJvdW5kcyBjaGVja1xuICAgIGRyYXdQYXRoT25lKHBhdGhGdW5jLCBnLCBzY2VuZS5pdGVtc1swXSwgc2NlbmUuaXRlbXMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRyYXdHcm91cChnLCBzY2VuZSwgYm91bmRzKSB7XG4gIGlmICghc2NlbmUuaXRlbXMubGVuZ3RoKSByZXR1cm47XG4gIHZhciBpdGVtcyA9IHNjZW5lLml0ZW1zLCBncm91cCwgYXhlcywgbGVnZW5kcyxcbiAgICAgIHJlbmRlcmVyID0gdGhpcywgZ3gsIGd5LCBnYiwgaSwgbiwgaiwgbTtcblxuICBkcmF3UmVjdChnLCBzY2VuZSwgYm91bmRzKTtcblxuICBmb3IgKGk9MCwgbj1pdGVtcy5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgZ3JvdXAgPSBpdGVtc1tpXTtcbiAgICBheGVzID0gZ3JvdXAuYXhpc0l0ZW1zIHx8IFtdO1xuICAgIGxlZ2VuZHMgPSBncm91cC5sZWdlbmRJdGVtcyB8fCBbXTtcbiAgICBneCA9IGdyb3VwLnggfHwgMDtcbiAgICBneSA9IGdyb3VwLnkgfHwgMDtcblxuICAgIC8vIHJlbmRlciBncm91cCBjb250ZW50c1xuICAgIGcuc2F2ZSgpO1xuICAgIGcudHJhbnNsYXRlKGd4LCBneSk7XG4gICAgaWYgKGdyb3VwLmNsaXApIHtcbiAgICAgIGcuYmVnaW5QYXRoKCk7XG4gICAgICBnLnJlY3QoMCwgMCwgZ3JvdXAud2lkdGggfHwgMCwgZ3JvdXAuaGVpZ2h0IHx8IDApO1xuICAgICAgZy5jbGlwKCk7XG4gICAgfVxuICAgIFxuICAgIGlmIChib3VuZHMpIGJvdW5kcy50cmFuc2xhdGUoLWd4LCAtZ3kpO1xuICAgIFxuICAgIGZvciAoaj0wLCBtPWF4ZXMubGVuZ3RoOyBqPG07ICsraikge1xuICAgICAgaWYgKGF4ZXNbal0uZGVmLmxheWVyID09PSBcImJhY2tcIikge1xuICAgICAgICByZW5kZXJlci5kcmF3KGcsIGF4ZXNbal0sIGJvdW5kcyk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoaj0wLCBtPWdyb3VwLml0ZW1zLmxlbmd0aDsgajxtOyArK2opIHtcbiAgICAgIHJlbmRlcmVyLmRyYXcoZywgZ3JvdXAuaXRlbXNbal0sIGJvdW5kcyk7XG4gICAgfVxuICAgIGZvciAoaj0wLCBtPWF4ZXMubGVuZ3RoOyBqPG07ICsraikge1xuICAgICAgaWYgKGF4ZXNbal0uZGVmLmxheWVyICE9PSBcImJhY2tcIikge1xuICAgICAgICByZW5kZXJlci5kcmF3KGcsIGF4ZXNbal0sIGJvdW5kcyk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoaj0wLCBtPWxlZ2VuZHMubGVuZ3RoOyBqPG07ICsraikge1xuICAgICAgcmVuZGVyZXIuZHJhdyhnLCBsZWdlbmRzW2pdLCBib3VuZHMpO1xuICAgIH1cbiAgICBcbiAgICBpZiAoYm91bmRzKSBib3VuZHMudHJhbnNsYXRlKGd4LCBneSk7XG4gICAgZy5yZXN0b3JlKCk7XG4gIH0gICAgXG59XG5cbmZ1bmN0aW9uIGNvbG9yKGcsIG8sIHZhbHVlKSB7XG4gIHJldHVybiAodmFsdWUuaWQpXG4gICAgPyBncmFkaWVudChnLCB2YWx1ZSwgby5ib3VuZHMpXG4gICAgOiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ3JhZGllbnQoZywgcCwgYikge1xuICB2YXIgdyA9IGIud2lkdGgoKSxcbiAgICAgIGggPSBiLmhlaWdodCgpLFxuICAgICAgeDEgPSBiLngxICsgcC54MSAqIHcsXG4gICAgICB5MSA9IGIueTEgKyBwLnkxICogaCxcbiAgICAgIHgyID0gYi54MSArIHAueDIgKiB3LFxuICAgICAgeTIgPSBiLnkxICsgcC55MiAqIGgsXG4gICAgICBncmFkID0gZy5jcmVhdGVMaW5lYXJHcmFkaWVudCh4MSwgeTEsIHgyLCB5MiksXG4gICAgICBzdG9wID0gcC5zdG9wcyxcbiAgICAgIGksIG47XG5cbiAgZm9yIChpPTAsIG49c3RvcC5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgZ3JhZC5hZGRDb2xvclN0b3Aoc3RvcFtpXS5vZmZzZXQsIHN0b3BbaV0uY29sb3IpO1xuICB9XG4gIHJldHVybiBncmFkO1xufVxuXG4vLyBoaXQgdGVzdGluZ1xuXG5mdW5jdGlvbiBwaWNrR3JvdXAoZywgc2NlbmUsIHgsIHksIGd4LCBneSkge1xuICBpZiAoc2NlbmUuaXRlbXMubGVuZ3RoID09PSAwIHx8XG4gICAgICBzY2VuZS5ib3VuZHMgJiYgIXNjZW5lLmJvdW5kcy5jb250YWlucyhneCwgZ3kpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciBpdGVtcyA9IHNjZW5lLml0ZW1zLCBzdWJzY2VuZSwgZ3JvdXAsIGhpdCwgZHgsIGR5LFxuICAgICAgaGFuZGxlciA9IHRoaXMsIGksIGo7XG5cbiAgZm9yIChpPWl0ZW1zLmxlbmd0aDsgLS1pPj0wOykge1xuICAgIGdyb3VwID0gaXRlbXNbaV07XG4gICAgZHggPSBncm91cC54IHx8IDA7XG4gICAgZHkgPSBncm91cC55IHx8IDA7XG5cbiAgICBnLnNhdmUoKTtcbiAgICBnLnRyYW5zbGF0ZShkeCwgZHkpO1xuICAgIGZvciAoaj1ncm91cC5pdGVtcy5sZW5ndGg7IC0taiA+PSAwOykge1xuICAgICAgc3Vic2NlbmUgPSBncm91cC5pdGVtc1tqXTtcbiAgICAgIGlmIChzdWJzY2VuZS5pbnRlcmFjdGl2ZSA9PT0gZmFsc2UpIGNvbnRpbnVlO1xuICAgICAgaGl0ID0gaGFuZGxlci5waWNrKHN1YnNjZW5lLCB4LCB5LCBneC1keCwgZ3ktZHkpO1xuICAgICAgaWYgKGhpdCkge1xuICAgICAgICBnLnJlc3RvcmUoKTtcbiAgICAgICAgcmV0dXJuIGhpdDtcbiAgICAgIH1cbiAgICB9XG4gICAgZy5yZXN0b3JlKCk7XG4gIH1cblxuICByZXR1cm4gc2NlbmUuaW50ZXJhY3RpdmVcbiAgICA/IHBpY2tBbGwoaGl0VGVzdHMuZ3JvdXAsIGcsIHNjZW5lLCB4LCB5LCBneCwgZ3kpXG4gICAgOiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gcGlja0FsbCh0ZXN0LCBnLCBzY2VuZSwgeCwgeSwgZ3gsIGd5KSB7XG4gIGlmICghc2NlbmUuaXRlbXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gIHZhciBvLCBiLCBpO1xuXG4gIGlmIChnLl9yYXRpbyAhPT0gMSkge1xuICAgIHggKj0gZy5fcmF0aW87XG4gICAgeSAqPSBnLl9yYXRpbztcbiAgfVxuXG4gIGZvciAoaT1zY2VuZS5pdGVtcy5sZW5ndGg7IC0taSA+PSAwOykge1xuICAgIG8gPSBzY2VuZS5pdGVtc1tpXTsgYiA9IG8uYm91bmRzO1xuICAgIC8vIGZpcnN0IGhpdCB0ZXN0IGFnYWluc3QgYm91bmRpbmcgYm94XG4gICAgaWYgKChiICYmICFiLmNvbnRhaW5zKGd4LCBneSkpIHx8ICFiKSBjb250aW51ZTtcbiAgICAvLyBpZiBpbiBib3VuZGluZyBib3gsIHBlcmZvcm0gbW9yZSBjYXJlZnVsIHRlc3RcbiAgICBpZiAodGVzdChnLCBvLCB4LCB5LCBneCwgZ3kpKSByZXR1cm4gbztcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHBpY2tBcmVhKGcsIHNjZW5lLCB4LCB5LCBneCwgZ3kpIHtcbiAgaWYgKCFzY2VuZS5pdGVtcy5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgdmFyIGl0ZW1zID0gc2NlbmUuaXRlbXMsXG4gICAgICBvLCBiLCBpLCBkaSwgZGQsIG9kLCBkeCwgZHk7XG5cbiAgYiA9IGl0ZW1zWzBdLmJvdW5kcztcbiAgaWYgKGIgJiYgIWIuY29udGFpbnMoZ3gsIGd5KSkgcmV0dXJuIGZhbHNlO1xuICBpZiAoZy5fcmF0aW8gIT09IDEpIHtcbiAgICB4ICo9IGcuX3JhdGlvO1xuICAgIHkgKj0gZy5fcmF0aW87XG4gIH1cbiAgaWYgKCFoaXRUZXN0cy5hcmVhKGcsIGl0ZW1zLCB4LCB5KSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gaXRlbXNbMF07XG59XG5cbmZ1bmN0aW9uIHBpY2tMaW5lKGcsIHNjZW5lLCB4LCB5LCBneCwgZ3kpIHtcbiAgaWYgKCFzY2VuZS5pdGVtcy5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgdmFyIGl0ZW1zID0gc2NlbmUuaXRlbXMsXG4gICAgICBvLCBiLCBpLCBkaSwgZGQsIG9kLCBkeCwgZHk7XG5cbiAgYiA9IGl0ZW1zWzBdLmJvdW5kcztcbiAgaWYgKGIgJiYgIWIuY29udGFpbnMoZ3gsIGd5KSkgcmV0dXJuIGZhbHNlO1xuICBpZiAoZy5fcmF0aW8gIT09IDEpIHtcbiAgICB4ICo9IGcuX3JhdGlvO1xuICAgIHkgKj0gZy5fcmF0aW87XG4gIH1cbiAgaWYgKCFoaXRUZXN0cy5saW5lKGcsIGl0ZW1zLCB4LCB5KSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gaXRlbXNbMF07XG59XG5cbmZ1bmN0aW9uIHBpY2sodGVzdCkge1xuICByZXR1cm4gZnVuY3Rpb24gKGcsIHNjZW5lLCB4LCB5LCBneCwgZ3kpIHtcbiAgICByZXR1cm4gcGlja0FsbCh0ZXN0LCBnLCBzY2VuZSwgeCwgeSwgZ3gsIGd5KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gdGV4dEhpdChnLCBvLCB4LCB5LCBneCwgZ3kpIHtcbiAgaWYgKCFvLmZvbnRTaXplKSByZXR1cm4gZmFsc2U7XG4gIGlmICghby5hbmdsZSkgcmV0dXJuIHRydWU7IC8vIGJvdW5kcyBzdWZmaWNpZW50IGlmIG5vIHJvdGF0aW9uXG5cbiAgdmFyIGIgPSBib3VuZHNDYWxjLnRleHQobywgdG1wQm91bmRzLCB0cnVlKSxcbiAgICAgIGEgPSAtby5hbmdsZSAqIE1hdGguUEkgLyAxODAsXG4gICAgICBjb3MgPSBNYXRoLmNvcyhhKSxcbiAgICAgIHNpbiA9IE1hdGguc2luKGEpLFxuICAgICAgeCA9IG8ueCxcbiAgICAgIHkgPSBvLnksXG4gICAgICBweCA9IGNvcypneCAtIHNpbipneSArICh4IC0geCpjb3MgKyB5KnNpbiksXG4gICAgICBweSA9IHNpbipneCArIGNvcypneSArICh5IC0geCpzaW4gLSB5KmNvcyk7XG5cbiAgcmV0dXJuIGIuY29udGFpbnMocHgsIHB5KTtcbn1cblxudmFyIGhpdFRlc3RzID0ge1xuICB0ZXh0OiAgIHRleHRIaXQsXG4gIHJlY3Q6ICAgZnVuY3Rpb24oZyxvLHgseSkgeyByZXR1cm4gdHJ1ZTsgfSwgLy8gYm91bmRzIHRlc3QgaXMgc3VmZmljaWVudFxuICBpbWFnZTogIGZ1bmN0aW9uKGcsbyx4LHkpIHsgcmV0dXJuIHRydWU7IH0sIC8vIGJvdW5kcyB0ZXN0IGlzIHN1ZmZpY2llbnRcbiAgZ3JvdXA6ICBmdW5jdGlvbihnLG8seCx5KSB7IHJldHVybiBvLmZpbGwgfHwgby5zdHJva2U7IH0sXG4gIHJ1bGU6ICAgZnVuY3Rpb24oZyxvLHgseSkge1xuICAgICAgICAgICAgaWYgKCFnLmlzUG9pbnRJblN0cm9rZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcnVsZVN0cm9rZShnLG8pOyByZXR1cm4gZy5pc1BvaW50SW5TdHJva2UoeCx5KTtcbiAgICAgICAgICB9LFxuICBsaW5lOiAgIGZ1bmN0aW9uKGcscyx4LHkpIHtcbiAgICAgICAgICAgIGlmICghZy5pc1BvaW50SW5TdHJva2UpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGxpbmVTdHJva2UoZyxzKTsgcmV0dXJuIGcuaXNQb2ludEluU3Ryb2tlKHgseSk7XG4gICAgICAgICAgfSxcbiAgYXJjOiAgICBmdW5jdGlvbihnLG8seCx5KSB7IGFyY1BhdGgoZyxvKTsgIHJldHVybiBnLmlzUG9pbnRJblBhdGgoeCx5KTsgfSxcbiAgYXJlYTogICBmdW5jdGlvbihnLHMseCx5KSB7IGFyZWFQYXRoKGcscyk7IHJldHVybiBnLmlzUG9pbnRJblBhdGgoeCx5KTsgfSxcbiAgcGF0aDogICBmdW5jdGlvbihnLG8seCx5KSB7IHBhdGhQYXRoKGcsbyk7IHJldHVybiBnLmlzUG9pbnRJblBhdGgoeCx5KTsgfSxcbiAgc3ltYm9sOiBmdW5jdGlvbihnLG8seCx5KSB7IHN5bWJvbFBhdGgoZyxvKTsgcmV0dXJuIGcuaXNQb2ludEluUGF0aCh4LHkpOyB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZHJhdzoge1xuICAgIGdyb3VwOiAgIGRyYXdHcm91cCxcbiAgICBhcmVhOiAgICBkcmF3T25lKGFyZWFQYXRoKSxcbiAgICBsaW5lOiAgICBkcmF3T25lKGxpbmVQYXRoKSxcbiAgICBhcmM6ICAgICBkcmF3QWxsKGFyY1BhdGgpLFxuICAgIHBhdGg6ICAgIGRyYXdBbGwocGF0aFBhdGgpLFxuICAgIHN5bWJvbDogIGRyYXdBbGwoc3ltYm9sUGF0aCksXG4gICAgcmVjdDogICAgZHJhd1JlY3QsXG4gICAgcnVsZTogICAgZHJhd1J1bGUsXG4gICAgdGV4dDogICAgZHJhd1RleHQsXG4gICAgaW1hZ2U6ICAgZHJhd0ltYWdlLFxuICAgIGRyYXdPbmU6IGRyYXdPbmUsIC8vIGV4cG9zZSBmb3IgZXh0ZW5zaWJpbGl0eVxuICAgIGRyYXdBbGw6IGRyYXdBbGwgIC8vIGV4cG9zZSBmb3IgZXh0ZW5zaWJpbGl0eVxuICB9LFxuICBwaWNrOiB7XG4gICAgZ3JvdXA6ICAgcGlja0dyb3VwLFxuICAgIGFyZWE6ICAgIHBpY2tBcmVhLFxuICAgIGxpbmU6ICAgIHBpY2tMaW5lLFxuICAgIGFyYzogICAgIHBpY2soaGl0VGVzdHMuYXJjKSxcbiAgICBwYXRoOiAgICBwaWNrKGhpdFRlc3RzLnBhdGgpLFxuICAgIHN5bWJvbDogIHBpY2soaGl0VGVzdHMuc3ltYm9sKSxcbiAgICByZWN0OiAgICBwaWNrKGhpdFRlc3RzLnJlY3QpLFxuICAgIHJ1bGU6ICAgIHBpY2soaGl0VGVzdHMucnVsZSksXG4gICAgdGV4dDogICAgcGljayhoaXRUZXN0cy50ZXh0KSxcbiAgICBpbWFnZTogICBwaWNrKGhpdFRlc3RzLmltYWdlKSxcbiAgICBwaWNrQWxsOiBwaWNrQWxsICAvLyBleHBvc2UgZm9yIGV4dGVuc2liaWxpdHlcbiAgfVxufTsiLCJ2YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgICBCb3VuZHMgPSByZXF1aXJlKCcuLi8uLi9jb3JlL0JvdW5kcycpO1xuXG4vLyBQYXRoIHBhcnNpbmcgYW5kIHJlbmRlcmluZyBjb2RlIHRha2VuIGZyb20gZmFicmljLmpzIC0tIFRoYW5rcyFcbnZhciBjbWRMZW5ndGggPSB7IG06MiwgbDoyLCBoOjEsIHY6MSwgYzo2LCBzOjQsIHE6NCwgdDoyLCBhOjcgfSxcbiAgICByZSA9IFsvKFtNTEhWQ1NRVEFabWxodmNzcXRhel0pL2csIC8jIyMvLCAvKFxcZCktL2csIC9cXHN8LHwjIyMvXTtcblxuZnVuY3Rpb24gcGFyc2UocGF0aCkge1xuICB2YXIgcmVzdWx0ID0gW10sXG4gICAgICBjdXJyZW50UGF0aCxcbiAgICAgIGNodW5rcyxcbiAgICAgIHBhcnNlZDtcblxuICAvLyBGaXJzdCwgYnJlYWsgcGF0aCBpbnRvIGNvbW1hbmQgc2VxdWVuY2VcbiAgcGF0aCA9IHBhdGguc2xpY2UoKS5yZXBsYWNlKHJlWzBdLCAnIyMjJDEnKS5zcGxpdChyZVsxXSkuc2xpY2UoMSk7XG5cbiAgLy8gTmV4dCwgcGFyc2UgZWFjaCBjb21tYW5kIGluIHR1cm5cbiAgZm9yICh2YXIgaT0wLCBqLCBjaHVua3NQYXJzZWQsIGxlbj1wYXRoLmxlbmd0aDsgaTxsZW47IGkrKykge1xuICAgIGN1cnJlbnRQYXRoID0gcGF0aFtpXTtcbiAgICBjaHVua3MgPSBjdXJyZW50UGF0aC5zbGljZSgxKS50cmltKCkucmVwbGFjZShyZVsyXSwnJDEjIyMtJykuc3BsaXQocmVbM10pO1xuICAgIGNodW5rc1BhcnNlZCA9IFtjdXJyZW50UGF0aC5jaGFyQXQoMCldO1xuXG4gICAgZm9yICh2YXIgaiA9IDAsIGpsZW4gPSBjaHVua3MubGVuZ3RoOyBqIDwgamxlbjsgaisrKSB7XG4gICAgICBwYXJzZWQgPSBwYXJzZUZsb2F0KGNodW5rc1tqXSk7XG4gICAgICBpZiAoIWlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgY2h1bmtzUGFyc2VkLnB1c2gocGFyc2VkKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgY29tbWFuZCA9IGNodW5rc1BhcnNlZFswXS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICBjb21tYW5kTGVuZ3RoID0gY21kTGVuZ3RoW2NvbW1hbmRdO1xuXG4gICAgaWYgKGNodW5rc1BhcnNlZC5sZW5ndGggLSAxID4gY29tbWFuZExlbmd0aCkge1xuICAgICAgZm9yICh2YXIgayA9IDEsIGtsZW4gPSBjaHVua3NQYXJzZWQubGVuZ3RoOyBrIDwga2xlbjsgayArPSBjb21tYW5kTGVuZ3RoKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKFsgY2h1bmtzUGFyc2VkWzBdIF0uY29uY2F0KGNodW5rc1BhcnNlZC5zbGljZShrLCBrICsgY29tbWFuZExlbmd0aCkpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXN1bHQucHVzaChjaHVua3NQYXJzZWQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGRyYXdBcmMoZywgeCwgeSwgY29vcmRzLCBib3VuZHMsIGwsIHQpIHtcbiAgdmFyIHJ4ID0gY29vcmRzWzBdO1xuICB2YXIgcnkgPSBjb29yZHNbMV07XG4gIHZhciByb3QgPSBjb29yZHNbMl07XG4gIHZhciBsYXJnZSA9IGNvb3Jkc1szXTtcbiAgdmFyIHN3ZWVwID0gY29vcmRzWzRdO1xuICB2YXIgZXggPSBjb29yZHNbNV07XG4gIHZhciBleSA9IGNvb3Jkc1s2XTtcbiAgdmFyIHNlZ3MgPSBhcmNUb1NlZ21lbnRzKGV4LCBleSwgcngsIHJ5LCBsYXJnZSwgc3dlZXAsIHJvdCwgeCwgeSk7XG4gIGZvciAodmFyIGk9MDsgaTxzZWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGJleiA9IHNlZ21lbnRUb0Jlemllci5hcHBseShudWxsLCBzZWdzW2ldKTtcbiAgICBnLmJlemllckN1cnZlVG8uYXBwbHkoZywgYmV6KTtcbiAgICBib3VuZHMuYWRkKGJlelswXS1sLCBiZXpbMV0tdCk7XG4gICAgYm91bmRzLmFkZChiZXpbMl0tbCwgYmV6WzNdLXQpO1xuICAgIGJvdW5kcy5hZGQoYmV6WzRdLWwsIGJlels1XS10KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBib3VuZEFyYyh4LCB5LCBjb29yZHMsIGJvdW5kcykge1xuICB2YXIgcnggPSBjb29yZHNbMF07XG4gIHZhciByeSA9IGNvb3Jkc1sxXTtcbiAgdmFyIHJvdCA9IGNvb3Jkc1syXTtcbiAgdmFyIGxhcmdlID0gY29vcmRzWzNdO1xuICB2YXIgc3dlZXAgPSBjb29yZHNbNF07XG4gIHZhciBleCA9IGNvb3Jkc1s1XTtcbiAgdmFyIGV5ID0gY29vcmRzWzZdO1xuICB2YXIgc2VncyA9IGFyY1RvU2VnbWVudHMoZXgsIGV5LCByeCwgcnksIGxhcmdlLCBzd2VlcCwgcm90LCB4LCB5KTtcbiAgZm9yICh2YXIgaT0wOyBpPHNlZ3MubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYmV6ID0gc2VnbWVudFRvQmV6aWVyLmFwcGx5KG51bGwsIHNlZ3NbaV0pO1xuICAgIGJvdW5kcy5hZGQoYmV6WzBdLCBiZXpbMV0pO1xuICAgIGJvdW5kcy5hZGQoYmV6WzJdLCBiZXpbM10pO1xuICAgIGJvdW5kcy5hZGQoYmV6WzRdLCBiZXpbNV0pO1xuICB9XG59XG5cbnZhciBhcmNUb1NlZ21lbnRzQ2FjaGUgPSB7IH0sXG4gICAgc2VnbWVudFRvQmV6aWVyQ2FjaGUgPSB7IH0sXG4gICAgam9pbiA9IEFycmF5LnByb3RvdHlwZS5qb2luLFxuICAgIGFyZ3NTdHI7XG5cbi8vIENvcGllZCBmcm9tIElua3NjYXBlIHN2Z3RvcGRmLCB0aGFua3MhXG5mdW5jdGlvbiBhcmNUb1NlZ21lbnRzKHgsIHksIHJ4LCByeSwgbGFyZ2UsIHN3ZWVwLCByb3RhdGVYLCBveCwgb3kpIHtcbiAgYXJnc1N0ciA9IGpvaW4uY2FsbChhcmd1bWVudHMpO1xuICBpZiAoYXJjVG9TZWdtZW50c0NhY2hlW2FyZ3NTdHJdKSB7XG4gICAgcmV0dXJuIGFyY1RvU2VnbWVudHNDYWNoZVthcmdzU3RyXTtcbiAgfVxuXG4gIHZhciB0aCA9IHJvdGF0ZVggKiAoTWF0aC5QSS8xODApO1xuICB2YXIgc2luX3RoID0gTWF0aC5zaW4odGgpO1xuICB2YXIgY29zX3RoID0gTWF0aC5jb3ModGgpO1xuICByeCA9IE1hdGguYWJzKHJ4KTtcbiAgcnkgPSBNYXRoLmFicyhyeSk7XG4gIHZhciBweCA9IGNvc190aCAqIChveCAtIHgpICogMC41ICsgc2luX3RoICogKG95IC0geSkgKiAwLjU7XG4gIHZhciBweSA9IGNvc190aCAqIChveSAtIHkpICogMC41IC0gc2luX3RoICogKG94IC0geCkgKiAwLjU7XG4gIHZhciBwbCA9IChweCpweCkgLyAocngqcngpICsgKHB5KnB5KSAvIChyeSpyeSk7XG4gIGlmIChwbCA+IDEpIHtcbiAgICBwbCA9IE1hdGguc3FydChwbCk7XG4gICAgcnggKj0gcGw7XG4gICAgcnkgKj0gcGw7XG4gIH1cblxuICB2YXIgYTAwID0gY29zX3RoIC8gcng7XG4gIHZhciBhMDEgPSBzaW5fdGggLyByeDtcbiAgdmFyIGExMCA9ICgtc2luX3RoKSAvIHJ5O1xuICB2YXIgYTExID0gKGNvc190aCkgLyByeTtcbiAgdmFyIHgwID0gYTAwICogb3ggKyBhMDEgKiBveTtcbiAgdmFyIHkwID0gYTEwICogb3ggKyBhMTEgKiBveTtcbiAgdmFyIHgxID0gYTAwICogeCArIGEwMSAqIHk7XG4gIHZhciB5MSA9IGExMCAqIHggKyBhMTEgKiB5O1xuXG4gIHZhciBkID0gKHgxLXgwKSAqICh4MS14MCkgKyAoeTEteTApICogKHkxLXkwKTtcbiAgdmFyIHNmYWN0b3Jfc3EgPSAxIC8gZCAtIDAuMjU7XG4gIGlmIChzZmFjdG9yX3NxIDwgMCkgc2ZhY3Rvcl9zcSA9IDA7XG4gIHZhciBzZmFjdG9yID0gTWF0aC5zcXJ0KHNmYWN0b3Jfc3EpO1xuICBpZiAoc3dlZXAgPT0gbGFyZ2UpIHNmYWN0b3IgPSAtc2ZhY3RvcjtcbiAgdmFyIHhjID0gMC41ICogKHgwICsgeDEpIC0gc2ZhY3RvciAqICh5MS15MCk7XG4gIHZhciB5YyA9IDAuNSAqICh5MCArIHkxKSArIHNmYWN0b3IgKiAoeDEteDApO1xuXG4gIHZhciB0aDAgPSBNYXRoLmF0YW4yKHkwLXljLCB4MC14Yyk7XG4gIHZhciB0aDEgPSBNYXRoLmF0YW4yKHkxLXljLCB4MS14Yyk7XG5cbiAgdmFyIHRoX2FyYyA9IHRoMS10aDA7XG4gIGlmICh0aF9hcmMgPCAwICYmIHN3ZWVwID09IDEpe1xuICAgIHRoX2FyYyArPSAyKk1hdGguUEk7XG4gIH0gZWxzZSBpZiAodGhfYXJjID4gMCAmJiBzd2VlcCA9PSAwKSB7XG4gICAgdGhfYXJjIC09IDIgKiBNYXRoLlBJO1xuICB9XG5cbiAgdmFyIHNlZ21lbnRzID0gTWF0aC5jZWlsKE1hdGguYWJzKHRoX2FyYyAvIChNYXRoLlBJICogMC41ICsgMC4wMDEpKSk7XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgZm9yICh2YXIgaT0wOyBpPHNlZ21lbnRzOyBpKyspIHtcbiAgICB2YXIgdGgyID0gdGgwICsgaSAqIHRoX2FyYyAvIHNlZ21lbnRzO1xuICAgIHZhciB0aDMgPSB0aDAgKyAoaSsxKSAqIHRoX2FyYyAvIHNlZ21lbnRzO1xuICAgIHJlc3VsdFtpXSA9IFt4YywgeWMsIHRoMiwgdGgzLCByeCwgcnksIHNpbl90aCwgY29zX3RoXTtcbiAgfVxuXG4gIHJldHVybiAoYXJjVG9TZWdtZW50c0NhY2hlW2FyZ3NTdHJdID0gcmVzdWx0KTtcbn1cblxuZnVuY3Rpb24gc2VnbWVudFRvQmV6aWVyKGN4LCBjeSwgdGgwLCB0aDEsIHJ4LCByeSwgc2luX3RoLCBjb3NfdGgpIHtcbiAgYXJnc1N0ciA9IGpvaW4uY2FsbChhcmd1bWVudHMpO1xuICBpZiAoc2VnbWVudFRvQmV6aWVyQ2FjaGVbYXJnc1N0cl0pIHtcbiAgICByZXR1cm4gc2VnbWVudFRvQmV6aWVyQ2FjaGVbYXJnc1N0cl07XG4gIH1cblxuICB2YXIgYTAwID0gY29zX3RoICogcng7XG4gIHZhciBhMDEgPSAtc2luX3RoICogcnk7XG4gIHZhciBhMTAgPSBzaW5fdGggKiByeDtcbiAgdmFyIGExMSA9IGNvc190aCAqIHJ5O1xuXG4gIHZhciBjb3NfdGgwID0gTWF0aC5jb3ModGgwKTtcbiAgdmFyIHNpbl90aDAgPSBNYXRoLnNpbih0aDApO1xuICB2YXIgY29zX3RoMSA9IE1hdGguY29zKHRoMSk7XG4gIHZhciBzaW5fdGgxID0gTWF0aC5zaW4odGgxKTtcblxuICB2YXIgdGhfaGFsZiA9IDAuNSAqICh0aDEgLSB0aDApO1xuICB2YXIgc2luX3RoX2gyID0gTWF0aC5zaW4odGhfaGFsZiAqIDAuNSk7XG4gIHZhciB0ID0gKDgvMykgKiBzaW5fdGhfaDIgKiBzaW5fdGhfaDIgLyBNYXRoLnNpbih0aF9oYWxmKTtcbiAgdmFyIHgxID0gY3ggKyBjb3NfdGgwIC0gdCAqIHNpbl90aDA7XG4gIHZhciB5MSA9IGN5ICsgc2luX3RoMCArIHQgKiBjb3NfdGgwO1xuICB2YXIgeDMgPSBjeCArIGNvc190aDE7XG4gIHZhciB5MyA9IGN5ICsgc2luX3RoMTtcbiAgdmFyIHgyID0geDMgKyB0ICogc2luX3RoMTtcbiAgdmFyIHkyID0geTMgLSB0ICogY29zX3RoMTtcblxuICByZXR1cm4gKHNlZ21lbnRUb0JlemllckNhY2hlW2FyZ3NTdHJdID0gW1xuICAgIGEwMCAqIHgxICsgYTAxICogeTEsICBhMTAgKiB4MSArIGExMSAqIHkxLFxuICAgIGEwMCAqIHgyICsgYTAxICogeTIsICBhMTAgKiB4MiArIGExMSAqIHkyLFxuICAgIGEwMCAqIHgzICsgYTAxICogeTMsICBhMTAgKiB4MyArIGExMSAqIHkzXG4gIF0pO1xufVxuXG5mdW5jdGlvbiByZW5kZXIoZywgcGF0aCwgbCwgdCkge1xuICB2YXIgY3VycmVudCwgLy8gY3VycmVudCBpbnN0cnVjdGlvblxuICAgICAgcHJldmlvdXMgPSBudWxsLFxuICAgICAgeCA9IDAsIC8vIGN1cnJlbnQgeFxuICAgICAgeSA9IDAsIC8vIGN1cnJlbnQgeVxuICAgICAgY29udHJvbFggPSAwLCAvLyBjdXJyZW50IGNvbnRyb2wgcG9pbnQgeFxuICAgICAgY29udHJvbFkgPSAwLCAvLyBjdXJyZW50IGNvbnRyb2wgcG9pbnQgeVxuICAgICAgdGVtcFgsXG4gICAgICB0ZW1wWSxcbiAgICAgIHRlbXBDb250cm9sWCxcbiAgICAgIHRlbXBDb250cm9sWSxcbiAgICAgIGJvdW5kcyA9IG5ldyBCb3VuZHMoKTtcbiAgaWYgKGwgPT0gdW5kZWZpbmVkKSBsID0gMDtcbiAgaWYgKHQgPT0gdW5kZWZpbmVkKSB0ID0gMDtcblxuICBnLmJlZ2luUGF0aCgpO1xuXG4gIGZvciAodmFyIGk9MCwgbGVuPXBhdGgubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgY3VycmVudCA9IHBhdGhbaV07XG5cbiAgICBzd2l0Y2ggKGN1cnJlbnRbMF0pIHsgLy8gZmlyc3QgbGV0dGVyXG5cbiAgICAgIGNhc2UgJ2wnOiAvLyBsaW5ldG8sIHJlbGF0aXZlXG4gICAgICAgIHggKz0gY3VycmVudFsxXTtcbiAgICAgICAgeSArPSBjdXJyZW50WzJdO1xuICAgICAgICBnLmxpbmVUbyh4ICsgbCwgeSArIHQpO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnTCc6IC8vIGxpbmV0bywgYWJzb2x1dGVcbiAgICAgICAgeCA9IGN1cnJlbnRbMV07XG4gICAgICAgIHkgPSBjdXJyZW50WzJdO1xuICAgICAgICBnLmxpbmVUbyh4ICsgbCwgeSArIHQpO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnaCc6IC8vIGhvcml6b250YWwgbGluZXRvLCByZWxhdGl2ZVxuICAgICAgICB4ICs9IGN1cnJlbnRbMV07XG4gICAgICAgIGcubGluZVRvKHggKyBsLCB5ICsgdCk7XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdIJzogLy8gaG9yaXpvbnRhbCBsaW5ldG8sIGFic29sdXRlXG4gICAgICAgIHggPSBjdXJyZW50WzFdO1xuICAgICAgICBnLmxpbmVUbyh4ICsgbCwgeSArIHQpO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAndic6IC8vIHZlcnRpY2FsIGxpbmV0bywgcmVsYXRpdmVcbiAgICAgICAgeSArPSBjdXJyZW50WzFdO1xuICAgICAgICBnLmxpbmVUbyh4ICsgbCwgeSArIHQpO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnVic6IC8vIHZlcmljYWwgbGluZXRvLCBhYnNvbHV0ZVxuICAgICAgICB5ID0gY3VycmVudFsxXTtcbiAgICAgICAgZy5saW5lVG8oeCArIGwsIHkgKyB0KTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ20nOiAvLyBtb3ZlVG8sIHJlbGF0aXZlXG4gICAgICAgIHggKz0gY3VycmVudFsxXTtcbiAgICAgICAgeSArPSBjdXJyZW50WzJdO1xuICAgICAgICBnLm1vdmVUbyh4ICsgbCwgeSArIHQpO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnTSc6IC8vIG1vdmVUbywgYWJzb2x1dGVcbiAgICAgICAgeCA9IGN1cnJlbnRbMV07XG4gICAgICAgIHkgPSBjdXJyZW50WzJdO1xuICAgICAgICBnLm1vdmVUbyh4ICsgbCwgeSArIHQpO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYyc6IC8vIGJlemllckN1cnZlVG8sIHJlbGF0aXZlXG4gICAgICAgIHRlbXBYID0geCArIGN1cnJlbnRbNV07XG4gICAgICAgIHRlbXBZID0geSArIGN1cnJlbnRbNl07XG4gICAgICAgIGNvbnRyb2xYID0geCArIGN1cnJlbnRbM107XG4gICAgICAgIGNvbnRyb2xZID0geSArIGN1cnJlbnRbNF07XG4gICAgICAgIGcuYmV6aWVyQ3VydmVUbyhcbiAgICAgICAgICB4ICsgY3VycmVudFsxXSArIGwsIC8vIHgxXG4gICAgICAgICAgeSArIGN1cnJlbnRbMl0gKyB0LCAvLyB5MVxuICAgICAgICAgIGNvbnRyb2xYICsgbCwgLy8geDJcbiAgICAgICAgICBjb250cm9sWSArIHQsIC8vIHkyXG4gICAgICAgICAgdGVtcFggKyBsLFxuICAgICAgICAgIHRlbXBZICsgdFxuICAgICAgICApO1xuICAgICAgICBib3VuZHMuYWRkKHggKyBjdXJyZW50WzFdLCB5ICsgY3VycmVudFsyXSk7XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh0ZW1wWCwgdGVtcFkpO1xuICAgICAgICB4ID0gdGVtcFg7XG4gICAgICAgIHkgPSB0ZW1wWTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ0MnOiAvLyBiZXppZXJDdXJ2ZVRvLCBhYnNvbHV0ZVxuICAgICAgICB4ID0gY3VycmVudFs1XTtcbiAgICAgICAgeSA9IGN1cnJlbnRbNl07XG4gICAgICAgIGNvbnRyb2xYID0gY3VycmVudFszXTtcbiAgICAgICAgY29udHJvbFkgPSBjdXJyZW50WzRdO1xuICAgICAgICBnLmJlemllckN1cnZlVG8oXG4gICAgICAgICAgY3VycmVudFsxXSArIGwsXG4gICAgICAgICAgY3VycmVudFsyXSArIHQsXG4gICAgICAgICAgY29udHJvbFggKyBsLFxuICAgICAgICAgIGNvbnRyb2xZICsgdCxcbiAgICAgICAgICB4ICsgbCxcbiAgICAgICAgICB5ICsgdFxuICAgICAgICApO1xuICAgICAgICBib3VuZHMuYWRkKGN1cnJlbnRbMV0sIGN1cnJlbnRbMl0pO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdzJzogLy8gc2hvcnRoYW5kIGN1YmljIGJlemllckN1cnZlVG8sIHJlbGF0aXZlXG4gICAgICAgIC8vIHRyYW5zZm9ybSB0byBhYnNvbHV0ZSB4LHlcbiAgICAgICAgdGVtcFggPSB4ICsgY3VycmVudFszXTtcbiAgICAgICAgdGVtcFkgPSB5ICsgY3VycmVudFs0XTtcbiAgICAgICAgLy8gY2FsY3VsYXRlIHJlZmxlY3Rpb24gb2YgcHJldmlvdXMgY29udHJvbCBwb2ludHNcbiAgICAgICAgY29udHJvbFggPSAyICogeCAtIGNvbnRyb2xYO1xuICAgICAgICBjb250cm9sWSA9IDIgKiB5IC0gY29udHJvbFk7XG4gICAgICAgIGcuYmV6aWVyQ3VydmVUbyhcbiAgICAgICAgICBjb250cm9sWCArIGwsXG4gICAgICAgICAgY29udHJvbFkgKyB0LFxuICAgICAgICAgIHggKyBjdXJyZW50WzFdICsgbCxcbiAgICAgICAgICB5ICsgY3VycmVudFsyXSArIHQsXG4gICAgICAgICAgdGVtcFggKyBsLFxuICAgICAgICAgIHRlbXBZICsgdFxuICAgICAgICApO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQoeCArIGN1cnJlbnRbMV0sIHkgKyBjdXJyZW50WzJdKTtcbiAgICAgICAgYm91bmRzLmFkZCh0ZW1wWCwgdGVtcFkpO1xuXG4gICAgICAgIC8vIHNldCBjb250cm9sIHBvaW50IHRvIDJuZCBvbmUgb2YgdGhpcyBjb21tYW5kXG4gICAgICAgIC8vIFwiLi4uIHRoZSBmaXJzdCBjb250cm9sIHBvaW50IGlzIGFzc3VtZWQgdG8gYmUgdGhlIHJlZmxlY3Rpb24gb2YgdGhlIHNlY29uZCBjb250cm9sIHBvaW50IG9uIHRoZSBwcmV2aW91cyBjb21tYW5kIHJlbGF0aXZlIHRvIHRoZSBjdXJyZW50IHBvaW50LlwiXG4gICAgICAgIGNvbnRyb2xYID0geCArIGN1cnJlbnRbMV07XG4gICAgICAgIGNvbnRyb2xZID0geSArIGN1cnJlbnRbMl07XG5cbiAgICAgICAgeCA9IHRlbXBYO1xuICAgICAgICB5ID0gdGVtcFk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdTJzogLy8gc2hvcnRoYW5kIGN1YmljIGJlemllckN1cnZlVG8sIGFic29sdXRlXG4gICAgICAgIHRlbXBYID0gY3VycmVudFszXTtcbiAgICAgICAgdGVtcFkgPSBjdXJyZW50WzRdO1xuICAgICAgICAvLyBjYWxjdWxhdGUgcmVmbGVjdGlvbiBvZiBwcmV2aW91cyBjb250cm9sIHBvaW50c1xuICAgICAgICBjb250cm9sWCA9IDIqeCAtIGNvbnRyb2xYO1xuICAgICAgICBjb250cm9sWSA9IDIqeSAtIGNvbnRyb2xZO1xuICAgICAgICBnLmJlemllckN1cnZlVG8oXG4gICAgICAgICAgY29udHJvbFggKyBsLFxuICAgICAgICAgIGNvbnRyb2xZICsgdCxcbiAgICAgICAgICBjdXJyZW50WzFdICsgbCxcbiAgICAgICAgICBjdXJyZW50WzJdICsgdCxcbiAgICAgICAgICB0ZW1wWCArIGwsXG4gICAgICAgICAgdGVtcFkgKyB0XG4gICAgICAgICk7XG4gICAgICAgIHggPSB0ZW1wWDtcbiAgICAgICAgeSA9IHRlbXBZO1xuICAgICAgICBib3VuZHMuYWRkKGN1cnJlbnRbMV0sIGN1cnJlbnRbMl0pO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQodGVtcFgsIHRlbXBZKTtcbiAgICAgICAgLy8gc2V0IGNvbnRyb2wgcG9pbnQgdG8gMm5kIG9uZSBvZiB0aGlzIGNvbW1hbmRcbiAgICAgICAgLy8gXCIuLi4gdGhlIGZpcnN0IGNvbnRyb2wgcG9pbnQgaXMgYXNzdW1lZCB0byBiZSB0aGUgcmVmbGVjdGlvbiBvZiB0aGUgc2Vjb25kIGNvbnRyb2wgcG9pbnQgb24gdGhlIHByZXZpb3VzIGNvbW1hbmQgcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgcG9pbnQuXCJcbiAgICAgICAgY29udHJvbFggPSBjdXJyZW50WzFdO1xuICAgICAgICBjb250cm9sWSA9IGN1cnJlbnRbMl07XG5cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3EnOiAvLyBxdWFkcmF0aWNDdXJ2ZVRvLCByZWxhdGl2ZVxuICAgICAgICAvLyB0cmFuc2Zvcm0gdG8gYWJzb2x1dGUgeCx5XG4gICAgICAgIHRlbXBYID0geCArIGN1cnJlbnRbM107XG4gICAgICAgIHRlbXBZID0geSArIGN1cnJlbnRbNF07XG5cbiAgICAgICAgY29udHJvbFggPSB4ICsgY3VycmVudFsxXTtcbiAgICAgICAgY29udHJvbFkgPSB5ICsgY3VycmVudFsyXTtcblxuICAgICAgICBnLnF1YWRyYXRpY0N1cnZlVG8oXG4gICAgICAgICAgY29udHJvbFggKyBsLFxuICAgICAgICAgIGNvbnRyb2xZICsgdCxcbiAgICAgICAgICB0ZW1wWCArIGwsXG4gICAgICAgICAgdGVtcFkgKyB0XG4gICAgICAgICk7XG4gICAgICAgIHggPSB0ZW1wWDtcbiAgICAgICAgeSA9IHRlbXBZO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQodGVtcFgsIHRlbXBZKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ1EnOiAvLyBxdWFkcmF0aWNDdXJ2ZVRvLCBhYnNvbHV0ZVxuICAgICAgICB0ZW1wWCA9IGN1cnJlbnRbM107XG4gICAgICAgIHRlbXBZID0gY3VycmVudFs0XTtcblxuICAgICAgICBnLnF1YWRyYXRpY0N1cnZlVG8oXG4gICAgICAgICAgY3VycmVudFsxXSArIGwsXG4gICAgICAgICAgY3VycmVudFsyXSArIHQsXG4gICAgICAgICAgdGVtcFggKyBsLFxuICAgICAgICAgIHRlbXBZICsgdFxuICAgICAgICApO1xuICAgICAgICB4ID0gdGVtcFg7XG4gICAgICAgIHkgPSB0ZW1wWTtcbiAgICAgICAgY29udHJvbFggPSBjdXJyZW50WzFdO1xuICAgICAgICBjb250cm9sWSA9IGN1cnJlbnRbMl07XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh0ZW1wWCwgdGVtcFkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAndCc6IC8vIHNob3J0aGFuZCBxdWFkcmF0aWNDdXJ2ZVRvLCByZWxhdGl2ZVxuXG4gICAgICAgIC8vIHRyYW5zZm9ybSB0byBhYnNvbHV0ZSB4LHlcbiAgICAgICAgdGVtcFggPSB4ICsgY3VycmVudFsxXTtcbiAgICAgICAgdGVtcFkgPSB5ICsgY3VycmVudFsyXTtcblxuICAgICAgICBpZiAocHJldmlvdXNbMF0ubWF0Y2goL1tRcVR0XS8pID09PSBudWxsKSB7XG4gICAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gcHJldmlvdXMgY29tbWFuZCBvciBpZiB0aGUgcHJldmlvdXMgY29tbWFuZCB3YXMgbm90IGEgUSwgcSwgVCBvciB0LFxuICAgICAgICAgIC8vIGFzc3VtZSB0aGUgY29udHJvbCBwb2ludCBpcyBjb2luY2lkZW50IHdpdGggdGhlIGN1cnJlbnQgcG9pbnRcbiAgICAgICAgICBjb250cm9sWCA9IHg7XG4gICAgICAgICAgY29udHJvbFkgPSB5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByZXZpb3VzWzBdID09PSAndCcpIHtcbiAgICAgICAgICAvLyBjYWxjdWxhdGUgcmVmbGVjdGlvbiBvZiBwcmV2aW91cyBjb250cm9sIHBvaW50cyBmb3IgdFxuICAgICAgICAgIGNvbnRyb2xYID0gMiAqIHggLSB0ZW1wQ29udHJvbFg7XG4gICAgICAgICAgY29udHJvbFkgPSAyICogeSAtIHRlbXBDb250cm9sWTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChwcmV2aW91c1swXSA9PT0gJ3EnKSB7XG4gICAgICAgICAgLy8gY2FsY3VsYXRlIHJlZmxlY3Rpb24gb2YgcHJldmlvdXMgY29udHJvbCBwb2ludHMgZm9yIHFcbiAgICAgICAgICBjb250cm9sWCA9IDIgKiB4IC0gY29udHJvbFg7XG4gICAgICAgICAgY29udHJvbFkgPSAyICogeSAtIGNvbnRyb2xZO1xuICAgICAgICB9XG5cbiAgICAgICAgdGVtcENvbnRyb2xYID0gY29udHJvbFg7XG4gICAgICAgIHRlbXBDb250cm9sWSA9IGNvbnRyb2xZO1xuXG4gICAgICAgIGcucXVhZHJhdGljQ3VydmVUbyhcbiAgICAgICAgICBjb250cm9sWCArIGwsXG4gICAgICAgICAgY29udHJvbFkgKyB0LFxuICAgICAgICAgIHRlbXBYICsgbCxcbiAgICAgICAgICB0ZW1wWSArIHRcbiAgICAgICAgKTtcbiAgICAgICAgeCA9IHRlbXBYO1xuICAgICAgICB5ID0gdGVtcFk7XG4gICAgICAgIGNvbnRyb2xYID0geCArIGN1cnJlbnRbMV07XG4gICAgICAgIGNvbnRyb2xZID0geSArIGN1cnJlbnRbMl07XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh0ZW1wWCwgdGVtcFkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnVCc6XG4gICAgICAgIHRlbXBYID0gY3VycmVudFsxXTtcbiAgICAgICAgdGVtcFkgPSBjdXJyZW50WzJdO1xuXG4gICAgICAgIC8vIGNhbGN1bGF0ZSByZWZsZWN0aW9uIG9mIHByZXZpb3VzIGNvbnRyb2wgcG9pbnRzXG4gICAgICAgIGNvbnRyb2xYID0gMiAqIHggLSBjb250cm9sWDtcbiAgICAgICAgY29udHJvbFkgPSAyICogeSAtIGNvbnRyb2xZO1xuICAgICAgICBnLnF1YWRyYXRpY0N1cnZlVG8oXG4gICAgICAgICAgY29udHJvbFggKyBsLFxuICAgICAgICAgIGNvbnRyb2xZICsgdCxcbiAgICAgICAgICB0ZW1wWCArIGwsXG4gICAgICAgICAgdGVtcFkgKyB0XG4gICAgICAgICk7XG4gICAgICAgIHggPSB0ZW1wWDtcbiAgICAgICAgeSA9IHRlbXBZO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQodGVtcFgsIHRlbXBZKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2EnOlxuICAgICAgICBkcmF3QXJjKGcsIHggKyBsLCB5ICsgdCwgW1xuICAgICAgICAgIGN1cnJlbnRbMV0sXG4gICAgICAgICAgY3VycmVudFsyXSxcbiAgICAgICAgICBjdXJyZW50WzNdLFxuICAgICAgICAgIGN1cnJlbnRbNF0sXG4gICAgICAgICAgY3VycmVudFs1XSxcbiAgICAgICAgICBjdXJyZW50WzZdICsgeCArIGwsXG4gICAgICAgICAgY3VycmVudFs3XSArIHkgKyB0XG4gICAgICAgIF0sIGJvdW5kcywgbCwgdCk7XG4gICAgICAgIHggKz0gY3VycmVudFs2XTtcbiAgICAgICAgeSArPSBjdXJyZW50WzddO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnQSc6XG4gICAgICAgIGRyYXdBcmMoZywgeCArIGwsIHkgKyB0LCBbXG4gICAgICAgICAgY3VycmVudFsxXSxcbiAgICAgICAgICBjdXJyZW50WzJdLFxuICAgICAgICAgIGN1cnJlbnRbM10sXG4gICAgICAgICAgY3VycmVudFs0XSxcbiAgICAgICAgICBjdXJyZW50WzVdLFxuICAgICAgICAgIGN1cnJlbnRbNl0gKyBsLFxuICAgICAgICAgIGN1cnJlbnRbN10gKyB0XG4gICAgICAgIF0sIGJvdW5kcywgbCwgdCk7XG4gICAgICAgIHggPSBjdXJyZW50WzZdO1xuICAgICAgICB5ID0gY3VycmVudFs3XTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3onOlxuICAgICAgY2FzZSAnWic6XG4gICAgICAgIGcuY2xvc2VQYXRoKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBwcmV2aW91cyA9IGN1cnJlbnQ7XG4gIH1cbiAgcmV0dXJuIGJvdW5kcy50cmFuc2xhdGUobCwgdCk7XG59XG5cbmZ1bmN0aW9uIGJvdW5kcyhwYXRoLCBib3VuZHMpIHtcbiAgdmFyIGN1cnJlbnQsIC8vIGN1cnJlbnQgaW5zdHJ1Y3Rpb25cbiAgICAgIHByZXZpb3VzID0gbnVsbCxcbiAgICAgIHggPSAwLCAvLyBjdXJyZW50IHhcbiAgICAgIHkgPSAwLCAvLyBjdXJyZW50IHlcbiAgICAgIGNvbnRyb2xYID0gMCwgLy8gY3VycmVudCBjb250cm9sIHBvaW50IHhcbiAgICAgIGNvbnRyb2xZID0gMCwgLy8gY3VycmVudCBjb250cm9sIHBvaW50IHlcbiAgICAgIHRlbXBYLFxuICAgICAgdGVtcFksXG4gICAgICB0ZW1wQ29udHJvbFgsXG4gICAgICB0ZW1wQ29udHJvbFk7XG5cbiAgZm9yICh2YXIgaT0wLCBsZW49cGF0aC5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBjdXJyZW50ID0gcGF0aFtpXTtcblxuICAgIHN3aXRjaCAoY3VycmVudFswXSkgeyAvLyBmaXJzdCBsZXR0ZXJcblxuICAgICAgY2FzZSAnbCc6IC8vIGxpbmV0bywgcmVsYXRpdmVcbiAgICAgICAgeCArPSBjdXJyZW50WzFdO1xuICAgICAgICB5ICs9IGN1cnJlbnRbMl07XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdMJzogLy8gbGluZXRvLCBhYnNvbHV0ZVxuICAgICAgICB4ID0gY3VycmVudFsxXTtcbiAgICAgICAgeSA9IGN1cnJlbnRbMl07XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdoJzogLy8gaG9yaXpvbnRhbCBsaW5ldG8sIHJlbGF0aXZlXG4gICAgICAgIHggKz0gY3VycmVudFsxXTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ0gnOiAvLyBob3Jpem9udGFsIGxpbmV0bywgYWJzb2x1dGVcbiAgICAgICAgeCA9IGN1cnJlbnRbMV07XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICd2JzogLy8gdmVydGljYWwgbGluZXRvLCByZWxhdGl2ZVxuICAgICAgICB5ICs9IGN1cnJlbnRbMV07XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdWJzogLy8gdmVyaWNhbCBsaW5ldG8sIGFic29sdXRlXG4gICAgICAgIHkgPSBjdXJyZW50WzFdO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnbSc6IC8vIG1vdmVUbywgcmVsYXRpdmVcbiAgICAgICAgeCArPSBjdXJyZW50WzFdO1xuICAgICAgICB5ICs9IGN1cnJlbnRbMl07XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdNJzogLy8gbW92ZVRvLCBhYnNvbHV0ZVxuICAgICAgICB4ID0gY3VycmVudFsxXTtcbiAgICAgICAgeSA9IGN1cnJlbnRbMl07XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjJzogLy8gYmV6aWVyQ3VydmVUbywgcmVsYXRpdmVcbiAgICAgICAgdGVtcFggPSB4ICsgY3VycmVudFs1XTtcbiAgICAgICAgdGVtcFkgPSB5ICsgY3VycmVudFs2XTtcbiAgICAgICAgY29udHJvbFggPSB4ICsgY3VycmVudFszXTtcbiAgICAgICAgY29udHJvbFkgPSB5ICsgY3VycmVudFs0XTtcbiAgICAgICAgYm91bmRzLmFkZCh4ICsgY3VycmVudFsxXSwgeSArIGN1cnJlbnRbMl0pO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQodGVtcFgsIHRlbXBZKTtcbiAgICAgICAgeCA9IHRlbXBYO1xuICAgICAgICB5ID0gdGVtcFk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdDJzogLy8gYmV6aWVyQ3VydmVUbywgYWJzb2x1dGVcbiAgICAgICAgeCA9IGN1cnJlbnRbNV07XG4gICAgICAgIHkgPSBjdXJyZW50WzZdO1xuICAgICAgICBjb250cm9sWCA9IGN1cnJlbnRbM107XG4gICAgICAgIGNvbnRyb2xZID0gY3VycmVudFs0XTtcbiAgICAgICAgYm91bmRzLmFkZChjdXJyZW50WzFdLCBjdXJyZW50WzJdKTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAncyc6IC8vIHNob3J0aGFuZCBjdWJpYyBiZXppZXJDdXJ2ZVRvLCByZWxhdGl2ZVxuICAgICAgICAvLyB0cmFuc2Zvcm0gdG8gYWJzb2x1dGUgeCx5XG4gICAgICAgIHRlbXBYID0geCArIGN1cnJlbnRbM107XG4gICAgICAgIHRlbXBZID0geSArIGN1cnJlbnRbNF07XG4gICAgICAgIC8vIGNhbGN1bGF0ZSByZWZsZWN0aW9uIG9mIHByZXZpb3VzIGNvbnRyb2wgcG9pbnRzXG4gICAgICAgIGNvbnRyb2xYID0gMiAqIHggLSBjb250cm9sWDtcbiAgICAgICAgY29udHJvbFkgPSAyICogeSAtIGNvbnRyb2xZO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQoeCArIGN1cnJlbnRbMV0sIHkgKyBjdXJyZW50WzJdKTtcbiAgICAgICAgYm91bmRzLmFkZCh0ZW1wWCwgdGVtcFkpO1xuXG4gICAgICAgIC8vIHNldCBjb250cm9sIHBvaW50IHRvIDJuZCBvbmUgb2YgdGhpcyBjb21tYW5kXG4gICAgICAgIC8vIFwiLi4uIHRoZSBmaXJzdCBjb250cm9sIHBvaW50IGlzIGFzc3VtZWQgdG8gYmUgdGhlIHJlZmxlY3Rpb24gb2YgdGhlIHNlY29uZCBjb250cm9sIHBvaW50IG9uIHRoZSBwcmV2aW91cyBjb21tYW5kIHJlbGF0aXZlIHRvIHRoZSBjdXJyZW50IHBvaW50LlwiXG4gICAgICAgIGNvbnRyb2xYID0geCArIGN1cnJlbnRbMV07XG4gICAgICAgIGNvbnRyb2xZID0geSArIGN1cnJlbnRbMl07XG5cbiAgICAgICAgeCA9IHRlbXBYO1xuICAgICAgICB5ID0gdGVtcFk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdTJzogLy8gc2hvcnRoYW5kIGN1YmljIGJlemllckN1cnZlVG8sIGFic29sdXRlXG4gICAgICAgIHRlbXBYID0gY3VycmVudFszXTtcbiAgICAgICAgdGVtcFkgPSBjdXJyZW50WzRdO1xuICAgICAgICAvLyBjYWxjdWxhdGUgcmVmbGVjdGlvbiBvZiBwcmV2aW91cyBjb250cm9sIHBvaW50c1xuICAgICAgICBjb250cm9sWCA9IDIqeCAtIGNvbnRyb2xYO1xuICAgICAgICBjb250cm9sWSA9IDIqeSAtIGNvbnRyb2xZO1xuICAgICAgICB4ID0gdGVtcFg7XG4gICAgICAgIHkgPSB0ZW1wWTtcbiAgICAgICAgYm91bmRzLmFkZChjdXJyZW50WzFdLCBjdXJyZW50WzJdKTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHRlbXBYLCB0ZW1wWSk7XG4gICAgICAgIC8vIHNldCBjb250cm9sIHBvaW50IHRvIDJuZCBvbmUgb2YgdGhpcyBjb21tYW5kXG4gICAgICAgIC8vIFwiLi4uIHRoZSBmaXJzdCBjb250cm9sIHBvaW50IGlzIGFzc3VtZWQgdG8gYmUgdGhlIHJlZmxlY3Rpb24gb2YgdGhlIHNlY29uZCBjb250cm9sIHBvaW50IG9uIHRoZSBwcmV2aW91cyBjb21tYW5kIHJlbGF0aXZlIHRvIHRoZSBjdXJyZW50IHBvaW50LlwiXG4gICAgICAgIGNvbnRyb2xYID0gY3VycmVudFsxXTtcbiAgICAgICAgY29udHJvbFkgPSBjdXJyZW50WzJdO1xuXG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdxJzogLy8gcXVhZHJhdGljQ3VydmVUbywgcmVsYXRpdmVcbiAgICAgICAgLy8gdHJhbnNmb3JtIHRvIGFic29sdXRlIHgseVxuICAgICAgICB0ZW1wWCA9IHggKyBjdXJyZW50WzNdO1xuICAgICAgICB0ZW1wWSA9IHkgKyBjdXJyZW50WzRdO1xuXG4gICAgICAgIGNvbnRyb2xYID0geCArIGN1cnJlbnRbMV07XG4gICAgICAgIGNvbnRyb2xZID0geSArIGN1cnJlbnRbMl07XG5cbiAgICAgICAgeCA9IHRlbXBYO1xuICAgICAgICB5ID0gdGVtcFk7XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh0ZW1wWCwgdGVtcFkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnUSc6IC8vIHF1YWRyYXRpY0N1cnZlVG8sIGFic29sdXRlXG4gICAgICAgIHRlbXBYID0gY3VycmVudFszXTtcbiAgICAgICAgdGVtcFkgPSBjdXJyZW50WzRdO1xuXG4gICAgICAgIHggPSB0ZW1wWDtcbiAgICAgICAgeSA9IHRlbXBZO1xuICAgICAgICBjb250cm9sWCA9IGN1cnJlbnRbMV07XG4gICAgICAgIGNvbnRyb2xZID0gY3VycmVudFsyXTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHRlbXBYLCB0ZW1wWSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICd0JzogLy8gc2hvcnRoYW5kIHF1YWRyYXRpY0N1cnZlVG8sIHJlbGF0aXZlXG5cbiAgICAgICAgLy8gdHJhbnNmb3JtIHRvIGFic29sdXRlIHgseVxuICAgICAgICB0ZW1wWCA9IHggKyBjdXJyZW50WzFdO1xuICAgICAgICB0ZW1wWSA9IHkgKyBjdXJyZW50WzJdO1xuXG4gICAgICAgIGlmIChwcmV2aW91c1swXS5tYXRjaCgvW1FxVHRdLykgPT09IG51bGwpIHtcbiAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBubyBwcmV2aW91cyBjb21tYW5kIG9yIGlmIHRoZSBwcmV2aW91cyBjb21tYW5kIHdhcyBub3QgYSBRLCBxLCBUIG9yIHQsXG4gICAgICAgICAgLy8gYXNzdW1lIHRoZSBjb250cm9sIHBvaW50IGlzIGNvaW5jaWRlbnQgd2l0aCB0aGUgY3VycmVudCBwb2ludFxuICAgICAgICAgIGNvbnRyb2xYID0geDtcbiAgICAgICAgICBjb250cm9sWSA9IHk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJldmlvdXNbMF0gPT09ICd0Jykge1xuICAgICAgICAgIC8vIGNhbGN1bGF0ZSByZWZsZWN0aW9uIG9mIHByZXZpb3VzIGNvbnRyb2wgcG9pbnRzIGZvciB0XG4gICAgICAgICAgY29udHJvbFggPSAyICogeCAtIHRlbXBDb250cm9sWDtcbiAgICAgICAgICBjb250cm9sWSA9IDIgKiB5IC0gdGVtcENvbnRyb2xZO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByZXZpb3VzWzBdID09PSAncScpIHtcbiAgICAgICAgICAvLyBjYWxjdWxhdGUgcmVmbGVjdGlvbiBvZiBwcmV2aW91cyBjb250cm9sIHBvaW50cyBmb3IgcVxuICAgICAgICAgIGNvbnRyb2xYID0gMiAqIHggLSBjb250cm9sWDtcbiAgICAgICAgICBjb250cm9sWSA9IDIgKiB5IC0gY29udHJvbFk7XG4gICAgICAgIH1cblxuICAgICAgICB0ZW1wQ29udHJvbFggPSBjb250cm9sWDtcbiAgICAgICAgdGVtcENvbnRyb2xZID0gY29udHJvbFk7XG5cbiAgICAgICAgeCA9IHRlbXBYO1xuICAgICAgICB5ID0gdGVtcFk7XG4gICAgICAgIGNvbnRyb2xYID0geCArIGN1cnJlbnRbMV07XG4gICAgICAgIGNvbnRyb2xZID0geSArIGN1cnJlbnRbMl07XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh0ZW1wWCwgdGVtcFkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnVCc6XG4gICAgICAgIHRlbXBYID0gY3VycmVudFsxXTtcbiAgICAgICAgdGVtcFkgPSBjdXJyZW50WzJdO1xuXG4gICAgICAgIC8vIGNhbGN1bGF0ZSByZWZsZWN0aW9uIG9mIHByZXZpb3VzIGNvbnRyb2wgcG9pbnRzXG4gICAgICAgIGNvbnRyb2xYID0gMiAqIHggLSBjb250cm9sWDtcbiAgICAgICAgY29udHJvbFkgPSAyICogeSAtIGNvbnRyb2xZO1xuXG4gICAgICAgIHggPSB0ZW1wWDtcbiAgICAgICAgeSA9IHRlbXBZO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQodGVtcFgsIHRlbXBZKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2EnOlxuICAgICAgICBib3VuZEFyYyh4LCB5LCBbXG4gICAgICAgICAgY3VycmVudFsxXSxcbiAgICAgICAgICBjdXJyZW50WzJdLFxuICAgICAgICAgIGN1cnJlbnRbM10sXG4gICAgICAgICAgY3VycmVudFs0XSxcbiAgICAgICAgICBjdXJyZW50WzVdLFxuICAgICAgICAgIGN1cnJlbnRbNl0gKyB4LFxuICAgICAgICAgIGN1cnJlbnRbN10gKyB5XG4gICAgICAgIF0sIGJvdW5kcyk7XG4gICAgICAgIHggKz0gY3VycmVudFs2XTtcbiAgICAgICAgeSArPSBjdXJyZW50WzddO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnQSc6XG4gICAgICAgIGJvdW5kQXJjKHgsIHksIFtcbiAgICAgICAgICBjdXJyZW50WzFdLFxuICAgICAgICAgIGN1cnJlbnRbMl0sXG4gICAgICAgICAgY3VycmVudFszXSxcbiAgICAgICAgICBjdXJyZW50WzRdLFxuICAgICAgICAgIGN1cnJlbnRbNV0sXG4gICAgICAgICAgY3VycmVudFs2XSxcbiAgICAgICAgICBjdXJyZW50WzddXG4gICAgICAgIF0sIGJvdW5kcyk7XG4gICAgICAgIHggPSBjdXJyZW50WzZdO1xuICAgICAgICB5ID0gY3VycmVudFs3XTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3onOlxuICAgICAgY2FzZSAnWic6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBwcmV2aW91cyA9IGN1cnJlbnQ7XG4gIH1cbiAgcmV0dXJuIGJvdW5kcztcbn1cblxuZnVuY3Rpb24gYXJlYShpdGVtcykge1xuICB2YXIgbyA9IGl0ZW1zWzBdO1xuICB2YXIgYXJlYSA9IGQzLnN2Zy5hcmVhKClcbiAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG4gICAgLnkxKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSlcbiAgICAueTAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55ICsgZC5oZWlnaHQ7IH0pO1xuICBpZiAoby5pbnRlcnBvbGF0ZSkgYXJlYS5pbnRlcnBvbGF0ZShvLmludGVycG9sYXRlKTtcbiAgaWYgKG8udGVuc2lvbiAhPSBudWxsKSBhcmVhLnRlbnNpb24oby50ZW5zaW9uKTtcbiAgcmV0dXJuIGFyZWEoaXRlbXMpO1xufVxuXG5mdW5jdGlvbiBsaW5lKGl0ZW1zKSB7XG4gIHZhciBvID0gaXRlbXNbMF07XG4gIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KTtcbiAgaWYgKG8uaW50ZXJwb2xhdGUpIGxpbmUuaW50ZXJwb2xhdGUoby5pbnRlcnBvbGF0ZSk7XG4gIGlmIChvLnRlbnNpb24gIT0gbnVsbCkgbGluZS50ZW5zaW9uKG8udGVuc2lvbik7XG4gIHJldHVybiBsaW5lKGl0ZW1zKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHBhcnNlOiAgcGFyc2UsXG4gIHJlbmRlcjogcmVuZGVyLFxuICBib3VuZHM6IGJvdW5kcyxcbiAgYXJlYTogICBhcmVhLFxuICBsaW5lOiAgIGxpbmVcbn07IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpO1xuXG52YXIgaGFuZGxlciA9IGZ1bmN0aW9uKGVsLCBtb2RlbCkge1xuICB0aGlzLl9hY3RpdmUgPSBudWxsO1xuICB0aGlzLl9oYW5kbGVycyA9IHt9O1xuICBpZiAoZWwpIHRoaXMuaW5pdGlhbGl6ZShlbCk7XG4gIGlmIChtb2RlbCkgdGhpcy5tb2RlbChtb2RlbCk7XG59O1xuXG5mdW5jdGlvbiBzdmdIYW5kbGVyKGhhbmRsZXIpIHtcbiAgdmFyIHRoYXQgPSB0aGlzO1xuICByZXR1cm4gZnVuY3Rpb24oZXZ0KSB7XG4gICAgdmFyIHRhcmdldCA9IGV2dC50YXJnZXQsXG4gICAgICAgIGl0ZW0gPSB0YXJnZXQuX19kYXRhX187XG5cbiAgICBpZiAoaXRlbSkgaXRlbSA9IGl0ZW0ubWFyayA/IGl0ZW0gOiBpdGVtWzBdO1xuICAgIGhhbmRsZXIuY2FsbCh0aGF0Ll9vYmosIGV2dCwgaXRlbSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGV2ZW50TmFtZShuYW1lKSB7XG4gIHZhciBpID0gbmFtZS5pbmRleE9mKFwiLlwiKTtcbiAgcmV0dXJuIGkgPCAwID8gbmFtZSA6IG5hbWUuc2xpY2UoMCxpKTtcbn1cblxudmFyIHByb3RvdHlwZSA9IGhhbmRsZXIucHJvdG90eXBlO1xuXG5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKGVsLCBwYWQsIG9iaikge1xuICB0aGlzLl9lbCA9IGQzLnNlbGVjdChlbCkubm9kZSgpO1xuICB0aGlzLl9zdmcgPSBkMy5zZWxlY3QoZWwpLnNlbGVjdChcInN2Zy5tYXJrc1wiKS5ub2RlKCk7XG4gIHRoaXMuX3BhZGRpbmcgPSBwYWQ7XG4gIHRoaXMuX29iaiA9IG9iaiB8fCBudWxsO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5wYWRkaW5nID0gZnVuY3Rpb24ocGFkKSB7XG4gIHRoaXMuX3BhZGRpbmcgPSBwYWQ7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLm1vZGVsID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fbW9kZWw7XG4gIHRoaXMuX21vZGVsID0gbW9kZWw7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLmhhbmRsZXJzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBoID0gdGhpcy5faGFuZGxlcnM7XG4gIHJldHVybiBkbC5rZXlzKGgpLnJlZHVjZShmdW5jdGlvbihhLCBrKSB7XG4gICAgcmV0dXJuIGhba10ucmVkdWNlKGZ1bmN0aW9uKGEsIHgpIHsgcmV0dXJuIChhLnB1c2goeCksIGEpOyB9LCBhKTtcbiAgfSwgW10pO1xufTtcblxuLy8gYWRkIGFuIGV2ZW50IGhhbmRsZXJcbnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgdmFyIG5hbWUgPSBldmVudE5hbWUodHlwZSksXG4gICAgICBoID0gdGhpcy5faGFuZGxlcnMsXG4gICAgICBkb20gPSBkMy5zZWxlY3QodGhpcy5fc3ZnKS5ub2RlKCk7XG4gICAgICBcbiAgdmFyIHggPSB7XG4gICAgdHlwZTogdHlwZSxcbiAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgIHN2Zzogc3ZnSGFuZGxlci5jYWxsKHRoaXMsIGhhbmRsZXIpXG4gIH07XG4gIGggPSBoW25hbWVdIHx8IChoW25hbWVdID0gW10pO1xuICBoLnB1c2goeCk7XG5cbiAgZG9tLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgeC5zdmcpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIHJlbW92ZSBhbiBldmVudCBoYW5kbGVyXG5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24odHlwZSwgaGFuZGxlcikge1xuICB2YXIgbmFtZSA9IGV2ZW50TmFtZSh0eXBlKSxcbiAgICAgIGggPSB0aGlzLl9oYW5kbGVyc1tuYW1lXSxcbiAgICAgIGRvbSA9IGQzLnNlbGVjdCh0aGlzLl9zdmcpLm5vZGUoKTtcbiAgaWYgKCFoKSByZXR1cm47XG4gIGZvciAodmFyIGk9aC5sZW5ndGg7IC0taT49MDspIHtcbiAgICBpZiAoaFtpXS50eXBlICE9PSB0eXBlKSBjb250aW51ZTtcbiAgICBpZiAoIWhhbmRsZXIgfHwgaFtpXS5oYW5kbGVyID09PSBoYW5kbGVyKSB7XG4gICAgICBkb20ucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBoW2ldLnN2Zyk7XG4gICAgICBoLnNwbGljZShpLCAxKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGhhbmRsZXI7IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIG1hcmtzID0gcmVxdWlyZSgnLi9tYXJrcycpO1xuXG52YXIgcmVuZGVyZXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fc3ZnID0gbnVsbDtcbiAgdGhpcy5fY3R4ID0gbnVsbDtcbiAgdGhpcy5fZWwgPSBudWxsO1xuICB0aGlzLl9kZWZzID0ge1xuICAgIGdyYWRpZW50OiB7fSxcbiAgICBjbGlwcGluZzoge31cbiAgfTtcbn07XG5cbnZhciBwcm90b3R5cGUgPSByZW5kZXJlci5wcm90b3R5cGU7XG5cbnByb3RvdHlwZS5pbml0aWFsaXplID0gZnVuY3Rpb24oZWwsIHdpZHRoLCBoZWlnaHQsIHBhZCkge1xuICB0aGlzLl9lbCA9IGVsO1xuXG4gIC8vIHJlbW92ZSBhbnkgZXhpc3Rpbmcgc3ZnIGVsZW1lbnRcbiAgZDMuc2VsZWN0KGVsKS5zZWxlY3QoXCJzdmcubWFya3NcIikucmVtb3ZlKCk7XG5cbiAgLy8gY3JlYXRlIHN2ZyBlbGVtZW50IGFuZCBpbml0aWFsaXplIGF0dHJpYnV0ZXNcbiAgdGhpcy5fc3ZnID0gZDMuc2VsZWN0KGVsKVxuICAgIC5hcHBlbmQoXCJzdmdcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwibWFya3NcIik7XG4gIFxuICAvLyBzZXQgdGhlIHN2ZyByb290IGdyb3VwXG4gIHRoaXMuX2N0eCA9IHRoaXMuX3N2Zy5hcHBlbmQoXCJnXCIpO1xuICBcbiAgcmV0dXJuIHRoaXMucmVzaXplKHdpZHRoLCBoZWlnaHQsIHBhZCk7XG59O1xuXG5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgcGFkKSB7XG4gIHRoaXMuX3dpZHRoID0gd2lkdGg7XG4gIHRoaXMuX2hlaWdodCA9IGhlaWdodDtcbiAgdGhpcy5fcGFkZGluZyA9IHBhZDtcbiAgXG4gIHRoaXMuX3N2Z1xuICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBwYWQubGVmdCArIHBhZC5yaWdodClcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBwYWQudG9wICsgcGFkLmJvdHRvbSk7XG4gICAgXG4gIHRoaXMuX2N0eFxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiK3BhZC5sZWZ0K1wiLFwiK3BhZC50b3ArXCIpXCIpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLmNvbnRleHQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuX2N0eDtcbn07XG5cbnByb3RvdHlwZS5lbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9lbDtcbn07XG5cbnByb3RvdHlwZS51cGRhdGVEZWZzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzdmcgPSB0aGlzLl9zdmcsXG4gICAgICBhbGwgPSB0aGlzLl9kZWZzLFxuICAgICAgZGdyYWQgPSBkbC5rZXlzKGFsbC5ncmFkaWVudCksXG4gICAgICBkY2xpcCA9IGRsLmtleXMoYWxsLmNsaXBwaW5nKSxcbiAgICAgIGRlZnMgPSBzdmcuc2VsZWN0KFwiZGVmc1wiKSwgZ3JhZCwgY2xpcDtcblxuICAvLyBnZXQgb3IgY3JlYXRlIHN2ZyBkZWZzIGJsb2NrXG4gIGlmIChkZ3JhZC5sZW5ndGg9PT0wICYmIGRjbGlwLmxlbmd0aD09MCkgeyBkZWZzLnJlbW92ZSgpOyByZXR1cm47IH1cbiAgaWYgKGRlZnMuZW1wdHkoKSkgZGVmcyA9IHN2Zy5pbnNlcnQoXCJkZWZzXCIsIFwiOmZpcnN0LWNoaWxkXCIpO1xuICBcbiAgZ3JhZCA9IGRlZnMuc2VsZWN0QWxsKFwibGluZWFyR3JhZGllbnRcIikuZGF0YShkZ3JhZCwgZGwuaWRlbnRpdHkpO1xuICBncmFkLmVudGVyKCkuYXBwZW5kKFwibGluZWFyR3JhZGllbnRcIikuYXR0cihcImlkXCIsIGRsLmlkZW50aXR5KTtcbiAgZ3JhZC5leGl0KCkucmVtb3ZlKCk7XG4gIGdyYWQuZWFjaChmdW5jdGlvbihpZCkge1xuICAgIHZhciBkZWYgPSBhbGwuZ3JhZGllbnRbaWRdLFxuICAgICAgICBncmQgPSBkMy5zZWxlY3QodGhpcyk7XG5cbiAgICAvLyBzZXQgZ3JhZGllbnQgY29vcmRpbmF0ZXNcbiAgICBncmQuYXR0cih7eDE6IGRlZi54MSwgeDI6IGRlZi54MiwgeTE6IGRlZi55MSwgeTI6IGRlZi55Mn0pO1xuXG4gICAgLy8gc2V0IGdyYWRpZW50IHN0b3BzXG4gICAgc3RvcCA9IGdyZC5zZWxlY3RBbGwoXCJzdG9wXCIpLmRhdGEoZGVmLnN0b3BzKTtcbiAgICBzdG9wLmVudGVyKCkuYXBwZW5kKFwic3RvcFwiKTtcbiAgICBzdG9wLmV4aXQoKS5yZW1vdmUoKTtcbiAgICBzdG9wLmF0dHIoXCJvZmZzZXRcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5vZmZzZXQ7IH0pXG4gICAgICAgIC5hdHRyKFwic3RvcC1jb2xvclwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbG9yOyB9KTtcbiAgfSk7XG4gIFxuICBjbGlwID0gZGVmcy5zZWxlY3RBbGwoXCJjbGlwUGF0aFwiKS5kYXRhKGRjbGlwLCBkbC5pZGVudGl0eSk7XG4gIGNsaXAuZW50ZXIoKS5hcHBlbmQoXCJjbGlwUGF0aFwiKS5hdHRyKFwiaWRcIiwgZGwuaWRlbnRpdHkpO1xuICBjbGlwLmV4aXQoKS5yZW1vdmUoKTtcbiAgY2xpcC5lYWNoKGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGRlZiA9IGFsbC5jbGlwcGluZ1tpZF0sXG4gICAgICAgIGNyID0gZDMuc2VsZWN0KHRoaXMpLnNlbGVjdEFsbChcInJlY3RcIikuZGF0YShbMV0pO1xuICAgIGNyLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKTtcbiAgICBjci5hdHRyKFwieFwiLCAwKVxuICAgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgICAuYXR0cihcIndpZHRoXCIsIGRlZi53aWR0aClcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGRlZi5oZWlnaHQpO1xuICB9KTtcbn07XG5cbnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihzY2VuZSwgaXRlbXMpIHtcbiAgbWFya3MuY3VycmVudCA9IHRoaXM7XG5cbiAgaWYgKGl0ZW1zKSB7XG4gICAgdGhpcy5yZW5kZXJJdGVtcyhkbC5hcnJheShpdGVtcykpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuZHJhdyh0aGlzLl9jdHgsIHNjZW5lLCAtMSk7XG4gIH1cbiAgdGhpcy51cGRhdGVEZWZzKCk7XG5cbiBkZWxldGUgbWFya3MuY3VycmVudDtcbn07XG5cbnByb3RvdHlwZS5yZW5kZXJJdGVtcyA9IGZ1bmN0aW9uKGl0ZW1zKSB7XG4gIHZhciBpdGVtLCBub2RlLCB0eXBlLCBuZXN0LCBpLCBuO1xuXG4gIGZvciAoaT0wLCBuPWl0ZW1zLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICBpdGVtID0gaXRlbXNbaV07XG4gICAgbm9kZSA9IGl0ZW0uX3N2ZztcbiAgICB0eXBlID0gaXRlbS5tYXJrLm1hcmt0eXBlO1xuXG4gICAgaXRlbSA9IG1hcmtzLm5lc3RlZFt0eXBlXSA/IGl0ZW0ubWFyay5pdGVtcyA6IGl0ZW07XG4gICAgbWFya3MudXBkYXRlW3R5cGVdLmNhbGwobm9kZSwgaXRlbSk7XG4gICAgbWFya3Muc3R5bGUuY2FsbChub2RlLCBpdGVtKTtcbiAgfVxufVxuXG5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGN0eCwgc2NlbmUsIGluZGV4KSB7XG4gIHZhciBtYXJrdHlwZSA9IHNjZW5lLm1hcmt0eXBlLFxuICAgICAgcmVuZGVyZXIgPSBtYXJrcy5kcmF3W21hcmt0eXBlXTtcbiAgcmVuZGVyZXIuY2FsbCh0aGlzLCBjdHgsIHNjZW5lLCBpbmRleCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlbmRlcmVyOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICAgIGNvbmZpZyA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvY29uZmlnJyk7XG5cbmZ1bmN0aW9uIHgobykgICAgIHsgcmV0dXJuIG8ueCB8fCAwOyB9XG5mdW5jdGlvbiB5KG8pICAgICB7IHJldHVybiBvLnkgfHwgMDsgfVxuZnVuY3Rpb24geWgobykgICAgeyByZXR1cm4gby55ICsgby5oZWlnaHQgfHwgMDsgfVxuZnVuY3Rpb24ga2V5KG8pICAgeyByZXR1cm4gby5rZXk7IH1cbmZ1bmN0aW9uIHNpemUobykgIHsgcmV0dXJuIG8uc2l6ZT09bnVsbCA/IDEwMCA6IG8uc2l6ZTsgfVxuZnVuY3Rpb24gc2hhcGUobykgeyByZXR1cm4gby5zaGFwZSB8fCBcImNpcmNsZVwiOyB9XG4gICAgXG52YXIgYXJjX3BhdGggICAgPSBkMy5zdmcuYXJjKCksXG4gICAgYXJlYV9wYXRoICAgPSBkMy5zdmcuYXJlYSgpLngoeCkueTEoeSkueTAoeWgpLFxuICAgIGxpbmVfcGF0aCAgID0gZDMuc3ZnLmxpbmUoKS54KHgpLnkoeSksXG4gICAgc3ltYm9sX3BhdGggPSBkMy5zdmcuc3ltYm9sKCkudHlwZShzaGFwZSkuc2l6ZShzaXplKTtcblxudmFyIG1hcmtfaWQgPSAwLFxuICAgIGNsaXBfaWQgPSAwO1xuXG52YXIgdGV4dEFsaWduID0ge1xuICBcImxlZnRcIjogICBcInN0YXJ0XCIsXG4gIFwiY2VudGVyXCI6IFwibWlkZGxlXCIsXG4gIFwicmlnaHRcIjogIFwiZW5kXCJcbn07XG5cbnZhciBzdHlsZXMgPSB7XG4gIFwiZmlsbFwiOiAgICAgICAgICAgICBcImZpbGxcIixcbiAgXCJmaWxsT3BhY2l0eVwiOiAgICAgIFwiZmlsbC1vcGFjaXR5XCIsXG4gIFwic3Ryb2tlXCI6ICAgICAgICAgICBcInN0cm9rZVwiLFxuICBcInN0cm9rZVdpZHRoXCI6ICAgICAgXCJzdHJva2Utd2lkdGhcIixcbiAgXCJzdHJva2VPcGFjaXR5XCI6ICAgIFwic3Ryb2tlLW9wYWNpdHlcIixcbiAgXCJzdHJva2VDYXBcIjogICAgICAgIFwic3Ryb2tlLWxpbmVjYXBcIixcbiAgXCJzdHJva2VEYXNoXCI6ICAgICAgIFwic3Ryb2tlLWRhc2hhcnJheVwiLFxuICBcInN0cm9rZURhc2hPZmZzZXRcIjogXCJzdHJva2UtZGFzaG9mZnNldFwiLFxuICBcIm9wYWNpdHlcIjogICAgICAgICAgXCJvcGFjaXR5XCJcbn07XG52YXIgc3R5bGVQcm9wcyA9IGRsLmtleXMoc3R5bGVzKTtcblxuZnVuY3Rpb24gc3R5bGUoZCkge1xuICB2YXIgaSwgbiwgcHJvcCwgbmFtZSwgdmFsdWUsXG4gICAgICBvID0gZC5tYXJrID8gZCA6IGQubGVuZ3RoID8gZFswXSA6IG51bGw7XG4gIGlmIChvID09PSBudWxsKSByZXR1cm47XG5cbiAgZm9yIChpPTAsIG49c3R5bGVQcm9wcy5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgcHJvcCA9IHN0eWxlUHJvcHNbaV07XG4gICAgbmFtZSA9IHN0eWxlc1twcm9wXTtcbiAgICB2YWx1ZSA9IG9bcHJvcF07XG5cbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgaWYgKG5hbWUgPT09IFwiZmlsbFwiKSB0aGlzLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIFwibm9uZVwiLCBudWxsKTtcbiAgICAgIGVsc2UgdGhpcy5zdHlsZS5yZW1vdmVQcm9wZXJ0eShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHZhbHVlLmlkKSB7XG4gICAgICAgIC8vIGVuc3VyZSBkZWZpbml0aW9uIGlzIGluY2x1ZGVkXG4gICAgICAgIG1hcmtzLmN1cnJlbnQuX2RlZnMuZ3JhZGllbnRbdmFsdWUuaWRdID0gdmFsdWU7XG4gICAgICAgIHZhbHVlID0gXCJ1cmwoI1wiICsgdmFsdWUuaWQgKyBcIilcIjtcbiAgICAgIH1cbiAgICAgIHRoaXMuc3R5bGUuc2V0UHJvcGVydHkobmFtZSwgdmFsdWUrXCJcIiwgbnVsbCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGFyYyhvKSB7XG4gIHZhciB4ID0gby54IHx8IDAsXG4gICAgICB5ID0gby55IHx8IDA7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiK3grXCIsXCIreStcIilcIik7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwiZFwiLCBhcmNfcGF0aChvKSk7XG59XG5cbmZ1bmN0aW9uIGFyZWEoaXRlbXMpIHtcbiAgaWYgKCFpdGVtcy5sZW5ndGgpIHJldHVybjtcbiAgdmFyIG8gPSBpdGVtc1swXTtcbiAgYXJlYV9wYXRoXG4gICAgLmludGVycG9sYXRlKG8uaW50ZXJwb2xhdGUgfHwgXCJsaW5lYXJcIilcbiAgICAudGVuc2lvbihvLnRlbnNpb24gPT0gbnVsbCA/IDAuNyA6IG8udGVuc2lvbik7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwiZFwiLCBhcmVhX3BhdGgoaXRlbXMpKTtcbn1cblxuZnVuY3Rpb24gbGluZShpdGVtcykge1xuICBpZiAoIWl0ZW1zLmxlbmd0aCkgcmV0dXJuO1xuICB2YXIgbyA9IGl0ZW1zWzBdO1xuICBsaW5lX3BhdGhcbiAgICAuaW50ZXJwb2xhdGUoby5pbnRlcnBvbGF0ZSB8fCBcImxpbmVhclwiKVxuICAgIC50ZW5zaW9uKG8udGVuc2lvbiA9PSBudWxsID8gMC43IDogby50ZW5zaW9uKTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJkXCIsIGxpbmVfcGF0aChpdGVtcykpO1xufVxuXG5mdW5jdGlvbiBwYXRoKG8pIHtcbiAgdmFyIHggPSBvLnggfHwgMCxcbiAgICAgIHkgPSBvLnkgfHwgMDtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIreCtcIixcIit5K1wiKVwiKTtcbiAgaWYgKG8ucGF0aCAhPSBudWxsKSB0aGlzLnNldEF0dHJpYnV0ZShcImRcIiwgby5wYXRoKTtcbn1cblxuZnVuY3Rpb24gcmVjdChvKSB7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwieFwiLCBvLnggfHwgMCk7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwieVwiLCBvLnkgfHwgMCk7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgby53aWR0aCB8fCAwKTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgby5oZWlnaHQgfHwgMCk7XG59XG5cbmZ1bmN0aW9uIHJ1bGUobykge1xuICB2YXIgeDEgPSBvLnggfHwgMCxcbiAgICAgIHkxID0gby55IHx8IDA7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwieDFcIiwgeDEpO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcInkxXCIsIHkxKTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ4MlwiLCBvLngyICE9IG51bGwgPyBvLngyIDogeDEpO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcInkyXCIsIG8ueTIgIT0gbnVsbCA/IG8ueTIgOiB5MSk7XG59XG5cbmZ1bmN0aW9uIHN5bWJvbChvKSB7XG4gIHZhciB4ID0gby54IHx8IDAsXG4gICAgICB5ID0gby55IHx8IDA7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiK3grXCIsXCIreStcIilcIik7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwiZFwiLCBzeW1ib2xfcGF0aChvKSk7XG59XG5cbmZ1bmN0aW9uIGltYWdlKG8pIHtcbiAgdmFyIHcgPSBvLndpZHRoIHx8IChvLmltYWdlICYmIG8uaW1hZ2Uud2lkdGgpIHx8IDAsXG4gICAgICBoID0gby5oZWlnaHQgfHwgKG8uaW1hZ2UgJiYgby5pbWFnZS5oZWlnaHQpIHx8IDAsXG4gICAgICB4ID0gby54IC0gKG8uYWxpZ24gPT09IFwiY2VudGVyXCJcbiAgICAgICAgPyB3LzIgOiAoby5hbGlnbiA9PT0gXCJyaWdodFwiID8gdyA6IDApKSxcbiAgICAgIHkgPSBvLnkgLSAoby5iYXNlbGluZSA9PT0gXCJtaWRkbGVcIlxuICAgICAgICA/IGgvMiA6IChvLmJhc2VsaW5lID09PSBcImJvdHRvbVwiID8gaCA6IDApKSxcbiAgICAgIHVybCA9IGNvbmZpZy5iYXNlVVJMICsgby51cmw7XG4gIFxuICB0aGlzLnNldEF0dHJpYnV0ZU5TKFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLCBcImhyZWZcIiwgdXJsKTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ4XCIsIHgpO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcInlcIiwgeSk7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgdyk7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIGgpO1xufVxuICBcbmZ1bmN0aW9uIGZvbnRTdHJpbmcobykge1xuICByZXR1cm4gKG8uZm9udFN0eWxlID8gby5mb250U3R5bGUgKyBcIiBcIiA6IFwiXCIpXG4gICAgKyAoby5mb250VmFyaWFudCA/IG8uZm9udFZhcmlhbnQgKyBcIiBcIiA6IFwiXCIpXG4gICAgKyAoby5mb250V2VpZ2h0ID8gby5mb250V2VpZ2h0ICsgXCIgXCIgOiBcIlwiKVxuICAgICsgKG8uZm9udFNpemUgIT0gbnVsbCA/IG8uZm9udFNpemUgOiBjb25maWcucmVuZGVyLmZvbnRTaXplKSArIFwicHggXCJcbiAgICArIChvLmZvbnQgfHwgY29uZmlnLnJlbmRlci5mb250KTtcbn1cblxuZnVuY3Rpb24gdGV4dChvKSB7XG4gIHZhciB4ID0gby54IHx8IDAsXG4gICAgICB5ID0gby55IHx8IDAsXG4gICAgICBkeCA9IG8uZHggfHwgMCxcbiAgICAgIGR5ID0gby5keSB8fCAwLFxuICAgICAgYSA9IG8uYW5nbGUgfHwgMCxcbiAgICAgIHIgPSBvLnJhZGl1cyB8fCAwLFxuICAgICAgYWxpZ24gPSB0ZXh0QWxpZ25bby5hbGlnbiB8fCBcImxlZnRcIl0sXG4gICAgICBiYXNlID0gby5iYXNlbGluZT09PVwidG9wXCIgPyBcIi45ZW1cIlxuICAgICAgICAgICA6IG8uYmFzZWxpbmU9PT1cIm1pZGRsZVwiID8gXCIuMzVlbVwiIDogMDtcblxuICBpZiAocikge1xuICAgIHZhciB0ID0gKG8udGhldGEgfHwgMCkgLSBNYXRoLlBJLzI7XG4gICAgeCArPSByICogTWF0aC5jb3ModCk7XG4gICAgeSArPSByICogTWF0aC5zaW4odCk7XG4gIH1cblxuICB0aGlzLnNldEF0dHJpYnV0ZShcInhcIiwgeCArIGR4KTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ5XCIsIHkgKyBkeSk7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwidGV4dC1hbmNob3JcIiwgYWxpZ24pO1xuICBcbiAgaWYgKGEpIHRoaXMuc2V0QXR0cmlidXRlKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKFwiK2ErXCIgXCIreCtcIixcIit5K1wiKVwiKTtcbiAgZWxzZSB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcInRyYW5zZm9ybVwiKTtcbiAgXG4gIGlmIChiYXNlKSB0aGlzLnNldEF0dHJpYnV0ZShcImR5XCIsIGJhc2UpO1xuICBlbHNlIHRoaXMucmVtb3ZlQXR0cmlidXRlKFwiZHlcIik7XG4gIFxuICB0aGlzLnRleHRDb250ZW50ID0gby50ZXh0O1xuICB0aGlzLnN0eWxlLnNldFByb3BlcnR5KFwiZm9udFwiLCBmb250U3RyaW5nKG8pLCBudWxsKTtcbn1cblxuZnVuY3Rpb24gZ3JvdXAobykge1xuICB2YXIgeCA9IG8ueCB8fCAwLFxuICAgICAgeSA9IG8ueSB8fCAwO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIit4K1wiLFwiK3krXCIpXCIpO1xuXG4gIGlmIChvLmNsaXApIHtcbiAgICB2YXIgYyA9IHt3aWR0aDogby53aWR0aCB8fCAwLCBoZWlnaHQ6IG8uaGVpZ2h0IHx8IDB9LFxuICAgICAgICBpZCA9IG8uY2xpcF9pZCB8fCAoby5jbGlwX2lkID0gXCJjbGlwXCIgKyBjbGlwX2lkKyspO1xuICAgIG1hcmtzLmN1cnJlbnQuX2RlZnMuY2xpcHBpbmdbaWRdID0gYztcbiAgICB0aGlzLnNldEF0dHJpYnV0ZShcImNsaXAtcGF0aFwiLCBcInVybCgjXCIraWQrXCIpXCIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdyb3VwX2JnKG8pIHtcbiAgdmFyIHcgPSBvLndpZHRoIHx8IDAsXG4gICAgICBoID0gby5oZWlnaHQgfHwgMDtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCB3KTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgaCk7XG59XG5cbmZ1bmN0aW9uIGNzc0NsYXNzKGRlZikge1xuICB2YXIgY2xzID0gXCJ0eXBlLVwiICsgZGVmLnR5cGU7XG4gIGlmIChkZWYubmFtZSkgY2xzICs9IFwiIFwiICsgZGVmLm5hbWU7XG4gIHJldHVybiBjbHM7XG59XG5cbmZ1bmN0aW9uIGRyYXcodGFnLCBhdHRyLCBuZXN0KSB7XG4gIHJldHVybiBmdW5jdGlvbihnLCBzY2VuZSwgaW5kZXgpIHtcbiAgICBkcmF3TWFyayhnLCBzY2VuZSwgaW5kZXgsIFwibWFya19cIiwgdGFnLCBhdHRyLCBuZXN0KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gZHJhd01hcmsoZywgc2NlbmUsIGluZGV4LCBwcmVmaXgsIHRhZywgYXR0ciwgbmVzdCkge1xuICB2YXIgZGF0YSA9IG5lc3QgPyBbc2NlbmUuaXRlbXNdIDogc2NlbmUuaXRlbXMsXG4gICAgICBldnRzID0gc2NlbmUuaW50ZXJhY3RpdmU9PT1mYWxzZSA/IFwibm9uZVwiIDogbnVsbCxcbiAgICAgIGdycHMgPSBnLm5vZGUoKS5jaGlsZE5vZGVzLFxuICAgICAgbm90RyA9ICh0YWcgIT09IFwiZ1wiKSxcbiAgICAgIHAgPSAocCA9IGdycHNbaW5kZXgrMV0pIC8vICsxIHRvIHNraXAgZ3JvdXAgYmFja2dyb3VuZCByZWN0XG4gICAgICAgID8gZDMuc2VsZWN0KHApXG4gICAgICAgIDogZy5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgIC5hdHRyKFwiaWRcIiwgXCJnXCIrKCsrbWFya19pZCkpXG4gICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgY3NzQ2xhc3Moc2NlbmUuZGVmKSk7XG5cbiAgdmFyIGlkID0gcC5hdHRyKFwiaWRcIiksXG4gICAgICBzID0gXCIjXCIgKyBpZCArIFwiID4gXCIgKyB0YWcsXG4gICAgICBtID0gcC5zZWxlY3RBbGwocykuZGF0YShkYXRhKSxcbiAgICAgIGUgPSBtLmVudGVyKCkuYXBwZW5kKHRhZyk7XG5cbiAgaWYgKG5vdEcpIHtcbiAgICBwLnN0eWxlKFwicG9pbnRlci1ldmVudHNcIiwgZXZ0cyk7XG4gICAgZS5lYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgIGlmIChkLm1hcmspIGQuX3N2ZyA9IHRoaXM7XG4gICAgICBlbHNlIGlmIChkLmxlbmd0aCkgZFswXS5fc3ZnID0gdGhpcztcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBlLmFwcGVuZChcInJlY3RcIikuYXR0cihcImNsYXNzXCIsXCJiYWNrZ3JvdW5kXCIpLnN0eWxlKFwicG9pbnRlci1ldmVudHNcIixldnRzKTtcbiAgfVxuICBcbiAgbS5leGl0KCkucmVtb3ZlKCk7XG4gIG0uZWFjaChhdHRyKTtcbiAgaWYgKG5vdEcpIG0uZWFjaChzdHlsZSk7XG4gIGVsc2UgcC5zZWxlY3RBbGwocytcIiA+IHJlY3QuYmFja2dyb3VuZFwiKS5lYWNoKGdyb3VwX2JnKS5lYWNoKHN0eWxlKTtcbiAgXG4gIHJldHVybiBwO1xufVxuXG5mdW5jdGlvbiBkcmF3R3JvdXAoZywgc2NlbmUsIGluZGV4LCBwcmVmaXgpIHsgICAgXG4gIHZhciBwID0gZHJhd01hcmsoZywgc2NlbmUsIGluZGV4LCBwcmVmaXggfHwgXCJncm91cF9cIiwgXCJnXCIsIGdyb3VwKSxcbiAgICAgIGMgPSBwLm5vZGUoKS5jaGlsZE5vZGVzLCBuID0gYy5sZW5ndGgsIGksIGosIG07XG4gIFxuICBmb3IgKGk9MDsgaTxuOyArK2kpIHtcbiAgICB2YXIgaXRlbXMgPSBjW2ldLl9fZGF0YV9fLml0ZW1zLFxuICAgICAgICBsZWdlbmRzID0gY1tpXS5fX2RhdGFfXy5sZWdlbmRJdGVtcyB8fCBbXSxcbiAgICAgICAgYXhlcyA9IGNbaV0uX19kYXRhX18uYXhpc0l0ZW1zIHx8IFtdLFxuICAgICAgICBzZWwgPSBkMy5zZWxlY3QoY1tpXSksXG4gICAgICAgIGlkeCA9IDA7XG5cbiAgICBmb3IgKGo9MCwgbT1heGVzLmxlbmd0aDsgajxtOyArK2opIHtcbiAgICAgIGlmIChheGVzW2pdLmRlZi5sYXllciA9PT0gXCJiYWNrXCIpIHtcbiAgICAgICAgZHJhd0dyb3VwLmNhbGwodGhpcywgc2VsLCBheGVzW2pdLCBpZHgrKywgXCJheGlzX1wiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChqPTAsIG09aXRlbXMubGVuZ3RoOyBqPG07ICsraikge1xuICAgICAgdGhpcy5kcmF3KHNlbCwgaXRlbXNbal0sIGlkeCsrKTtcbiAgICB9XG4gICAgZm9yIChqPTAsIG09YXhlcy5sZW5ndGg7IGo8bTsgKytqKSB7XG4gICAgICBpZiAoYXhlc1tqXS5kZWYubGF5ZXIgIT09IFwiYmFja1wiKSB7XG4gICAgICAgIGRyYXdHcm91cC5jYWxsKHRoaXMsIHNlbCwgYXhlc1tqXSwgaWR4KyssIFwiYXhpc19cIik7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoaj0wLCBtPWxlZ2VuZHMubGVuZ3RoOyBqPG07ICsraikge1xuICAgICAgZHJhd0dyb3VwLmNhbGwodGhpcywgc2VsLCBsZWdlbmRzW2pdLCBpZHgrKywgXCJsZWdlbmRfXCIpO1xuICAgIH1cbiAgfVxufVxuXG52YXIgbWFya3MgPSBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgdXBkYXRlOiB7XG4gICAgZ3JvdXA6ICAgcmVjdCxcbiAgICBhcmVhOiAgICBhcmVhLFxuICAgIGxpbmU6ICAgIGxpbmUsXG4gICAgYXJjOiAgICAgYXJjLFxuICAgIHBhdGg6ICAgIHBhdGgsXG4gICAgc3ltYm9sOiAgc3ltYm9sLFxuICAgIHJlY3Q6ICAgIHJlY3QsXG4gICAgcnVsZTogICAgcnVsZSxcbiAgICB0ZXh0OiAgICB0ZXh0LFxuICAgIGltYWdlOiAgIGltYWdlXG4gIH0sXG4gIG5lc3RlZDoge1xuICAgIFwiYXJlYVwiOiB0cnVlLFxuICAgIFwibGluZVwiOiB0cnVlXG4gIH0sXG4gIHN0eWxlOiBzdHlsZSxcbiAgZHJhdzoge1xuICAgIGdyb3VwOiAgIGRyYXdHcm91cCxcbiAgICBhcmVhOiAgICBkcmF3KFwicGF0aFwiLCBhcmVhLCB0cnVlKSxcbiAgICBsaW5lOiAgICBkcmF3KFwicGF0aFwiLCBsaW5lLCB0cnVlKSxcbiAgICBhcmM6ICAgICBkcmF3KFwicGF0aFwiLCBhcmMpLFxuICAgIHBhdGg6ICAgIGRyYXcoXCJwYXRoXCIsIHBhdGgpLFxuICAgIHN5bWJvbDogIGRyYXcoXCJwYXRoXCIsIHN5bWJvbCksXG4gICAgcmVjdDogICAgZHJhdyhcInJlY3RcIiwgcmVjdCksXG4gICAgcnVsZTogICAgZHJhdyhcImxpbmVcIiwgcnVsZSksXG4gICAgdGV4dDogICAgZHJhdyhcInRleHRcIiwgdGV4dCksXG4gICAgaW1hZ2U6ICAgZHJhdyhcImltYWdlXCIsIGltYWdlKSxcbiAgICBkcmF3OiAgICBkcmF3IC8vIGV4cG9zZSBmb3IgZXh0ZW5zaWJpbGl0eVxuICB9LFxuICBjdXJyZW50OiBudWxsXG59OyIsInZhciBOb2RlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvTm9kZScpLFxuICAgIGJvdW5kcyA9IHJlcXVpcmUoJy4uL3V0aWwvYm91bmRzJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyk7XG5cbmZ1bmN0aW9uIEJvdW5kZXIobW9kZWwsIG1hcmspIHtcbiAgdGhpcy5fbWFyayA9IG1hcms7XG4gIHJldHVybiBOb2RlLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgbW9kZWwuZ3JhcGgpLnJvdXRlcih0cnVlKTtcbn1cblxudmFyIHByb3RvID0gKEJvdW5kZXIucHJvdG90eXBlID0gbmV3IE5vZGUoKSk7XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgZGVidWcoaW5wdXQsIFtcImJvdW5kc1wiLCB0aGlzLl9tYXJrLm1hcmt0eXBlXSk7XG5cbiAgYm91bmRzLm1hcmsodGhpcy5fbWFyayk7XG4gIGlmICh0aGlzLl9tYXJrLm1hcmt0eXBlID09PSBDLkdST1VQKSBcbiAgICBib3VuZHMubWFyayh0aGlzLl9tYXJrLCBudWxsLCBmYWxzZSk7XG5cbiAgaW5wdXQucmVmbG93ID0gdHJ1ZTtcbiAgcmV0dXJuIGlucHV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCb3VuZGVyOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBOb2RlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvTm9kZScpLFxuICAgIEVuY29kZXIgID0gcmVxdWlyZSgnLi9FbmNvZGVyJyksXG4gICAgQm91bmRlciAgPSByZXF1aXJlKCcuL0JvdW5kZXInKSxcbiAgICBJdGVtICA9IHJlcXVpcmUoJy4vSXRlbScpLFxuICAgIHBhcnNlRGF0YSA9IHJlcXVpcmUoJy4uL3BhcnNlL2RhdGEnKSxcbiAgICB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0JyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIEJ1aWxkZXIoKSB7ICAgIFxuICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/IHRoaXMuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDogdGhpcztcbn1cblxudmFyIHByb3RvID0gKEJ1aWxkZXIucHJvdG90eXBlID0gbmV3IE5vZGUoKSk7XG5cbnByb3RvLmluaXQgPSBmdW5jdGlvbihtb2RlbCwgZGVmLCBtYXJrLCBwYXJlbnQsIHBhcmVudF9pZCwgaW5oZXJpdEZyb20pIHtcbiAgTm9kZS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIG1vZGVsLmdyYXBoKVxuICAgIC5yb3V0ZXIodHJ1ZSlcbiAgICAuY29sbGVjdG9yKHRydWUpO1xuXG4gIHRoaXMuX21vZGVsID0gbW9kZWw7XG4gIHRoaXMuX2RlZiAgID0gZGVmO1xuICB0aGlzLl9tYXJrICA9IG1hcms7XG4gIHRoaXMuX2Zyb20gID0gKGRlZi5mcm9tID8gZGVmLmZyb20uZGF0YSA6IG51bGwpIHx8IGluaGVyaXRGcm9tO1xuICB0aGlzLl9kcyAgICA9IGRsLmlzU3RyaW5nKHRoaXMuX2Zyb20pID8gbW9kZWwuZGF0YSh0aGlzLl9mcm9tKSA6IG51bGw7XG4gIHRoaXMuX21hcCAgID0ge307XG5cbiAgdGhpcy5fcmV2aXNlcyA9IGZhbHNlOyAgLy8gU2hvdWxkIHNjZW5lZ3JhcGggaXRlbXMgdHJhY2sgX3ByZXY/XG5cbiAgbWFyay5kZWYgPSBkZWY7XG4gIG1hcmsubWFya3R5cGUgPSBkZWYudHlwZTtcbiAgbWFyay5pbnRlcmFjdGl2ZSA9ICEoZGVmLmludGVyYWN0aXZlID09PSBmYWxzZSk7XG4gIG1hcmsuaXRlbXMgPSBbXTtcblxuICB0aGlzLl9wYXJlbnQgPSBwYXJlbnQ7XG4gIHRoaXMuX3BhcmVudF9pZCA9IHBhcmVudF9pZDtcblxuICBpZihkZWYuZnJvbSAmJiAoZGVmLmZyb20ubWFyayB8fCBkZWYuZnJvbS50cmFuc2Zvcm0gfHwgZGVmLmZyb20ubW9kaWZ5KSkge1xuICAgIGlubGluZURzLmNhbGwodGhpcyk7XG4gIH1cblxuICAvLyBOb24tZ3JvdXAgbWFyayBidWlsZGVycyBhcmUgc3VwZXIgbm9kZXMuIEVuY29kZXIgYW5kIEJvdW5kZXIgcmVtYWluIFxuICAvLyBzZXBhcmF0ZSBvcGVyYXRvcnMgYnV0IGFyZSBlbWJlZGRlZCBhbmQgY2FsbGVkIGJ5IEJ1aWxkZXIuZXZhbHVhdGUuXG4gIHRoaXMuX2lzU3VwZXIgPSAodGhpcy5fZGVmLnR5cGUgIT09IEMuR1JPVVApOyBcbiAgdGhpcy5fZW5jb2RlciA9IG5ldyBFbmNvZGVyKHRoaXMuX21vZGVsLCB0aGlzLl9tYXJrKTtcbiAgdGhpcy5fYm91bmRlciA9IG5ldyBCb3VuZGVyKHRoaXMuX21vZGVsLCB0aGlzLl9tYXJrKTtcblxuICBpZih0aGlzLl9kcykgeyB0aGlzLl9lbmNvZGVyLmRlcGVuZGVuY3koQy5EQVRBLCB0aGlzLl9mcm9tKTsgfVxuXG4gIC8vIFNpbmNlIEJ1aWxkZXJzIGFyZSBzdXBlciBub2RlcywgY29weSBvdmVyIGVuY29kZXIgZGVwZW5kZW5jaWVzXG4gIC8vIChib3VuZGVyIGhhcyBubyByZWdpc3RlcmVkIGRlcGVuZGVuY2llcykuXG4gIHRoaXMuZGVwZW5kZW5jeShDLkRBVEEsIHRoaXMuX2VuY29kZXIuZGVwZW5kZW5jeShDLkRBVEEpKTtcbiAgdGhpcy5kZXBlbmRlbmN5KEMuU0NBTEVTLCB0aGlzLl9lbmNvZGVyLmRlcGVuZGVuY3koQy5TQ0FMRVMpKTtcbiAgdGhpcy5kZXBlbmRlbmN5KEMuU0lHTkFMUywgdGhpcy5fZW5jb2Rlci5kZXBlbmRlbmN5KEMuU0lHTkFMUykpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8ucmV2aXNlcyA9IGZ1bmN0aW9uKHApIHtcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9yZXZpc2VzO1xuXG4gIC8vIElmIHdlJ3ZlIG5vdCBuZWVkZWQgcHJldiBpbiB0aGUgcGFzdCwgYnV0IGEgbmV3IGlubGluZSBkcyBuZWVkcyBpdCBub3dcbiAgLy8gZW5zdXJlIGV4aXN0aW5nIGl0ZW1zIGhhdmUgcHJldiBzZXQuXG4gIGlmKCF0aGlzLl9yZXZpc2VzICYmIHApIHtcbiAgICB0aGlzLl9pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgaWYoZC5fcHJldiA9PT0gdW5kZWZpbmVkKSBkLl9wcmV2ID0gQy5TRU5USU5FTDsgfSk7XG4gIH1cblxuICB0aGlzLl9yZXZpc2VzID0gdGhpcy5fcmV2aXNlcyB8fCBwO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIFJlYWN0aXZlIGdlb21ldHJ5IGFuZCBtYXJrLWxldmVsIHRyYW5zZm9ybWF0aW9ucyBhcmUgaGFuZGxlZCBoZXJlIFxuLy8gYmVjYXVzZSB0aGV5IG5lZWQgdGhlaXIgZ3JvdXAncyBkYXRhLWpvaW5lZCBjb250ZXh0LiBcbmZ1bmN0aW9uIGlubGluZURzKCkge1xuICB2YXIgZnJvbSA9IHRoaXMuX2RlZi5mcm9tLFxuICAgICAgZ2VvbSA9IGZyb20ubWFyayxcbiAgICAgIHNyYywgbmFtZSwgc3BlYywgc2libGluZywgb3V0cHV0O1xuXG4gIGlmKGdlb20pIHtcbiAgICBuYW1lID0gW1widmdcIiwgdGhpcy5fcGFyZW50X2lkLCBnZW9tXS5qb2luKFwiX1wiKTtcbiAgICBzcGVjID0ge1xuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIHRyYW5zZm9ybTogZnJvbS50cmFuc2Zvcm0sIFxuICAgICAgbW9kaWZ5OiBmcm9tLm1vZGlmeVxuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgc3JjID0gdGhpcy5fbW9kZWwuZGF0YSh0aGlzLl9mcm9tKTtcbiAgICBuYW1lID0gW1widmdcIiwgdGhpcy5fZnJvbSwgdGhpcy5fZGVmLnR5cGUsIHNyYy5saXN0ZW5lcnModHJ1ZSkubGVuZ3RoXS5qb2luKFwiX1wiKTtcbiAgICBzcGVjID0ge1xuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIHNvdXJjZTogdGhpcy5fZnJvbSxcbiAgICAgIHRyYW5zZm9ybTogZnJvbS50cmFuc2Zvcm0sXG4gICAgICBtb2RpZnk6IGZyb20ubW9kaWZ5XG4gICAgfTtcbiAgfVxuXG4gIHRoaXMuX2Zyb20gPSBuYW1lO1xuICB0aGlzLl9kcyA9IHBhcnNlRGF0YS5kYXRhc291cmNlKHRoaXMuX21vZGVsLCBzcGVjKTtcbiAgdmFyIHJldmlzZXMgPSB0aGlzLl9kcy5yZXZpc2VzKCk7XG5cbiAgaWYoZ2VvbSkge1xuICAgIHNpYmxpbmcgPSB0aGlzLnNpYmxpbmcoZ2VvbSkucmV2aXNlcyhyZXZpc2VzKTtcbiAgICBpZihzaWJsaW5nLl9pc1N1cGVyKSBzaWJsaW5nLmFkZExpc3RlbmVyKHRoaXMuX2RzLmxpc3RlbmVyKCkpO1xuICAgIGVsc2Ugc2libGluZy5fYm91bmRlci5hZGRMaXN0ZW5lcih0aGlzLl9kcy5saXN0ZW5lcigpKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBoYXZlIGEgbmV3IGRhdGFzb3VyY2UgYnV0IGl0IGlzIGVtcHR5IGFzXG4gICAgLy8gdGhlIHByb3BhZ2F0aW9uIGN5Y2xlIGhhcyBhbHJlYWR5IGNyb3NzZWQgdGhlIGRhdGFzb3VyY2VzLiBcbiAgICAvLyBTbywgd2UgcmVwdWxzZSBqdXN0IHRoaXMgZGF0YXNvdXJjZS4gVGhpcyBzaG91bGQgYmUgc2FmZVxuICAgIC8vIGFzIHRoZSBkcyBpc24ndCBjb25uZWN0ZWQgdG8gdGhlIHNjZW5lZ3JhcGggeWV0LlxuICAgIFxuICAgIHZhciBvdXRwdXQgPSB0aGlzLl9kcy5zb3VyY2UoKS5yZXZpc2VzKHJldmlzZXMpLmxhc3QoKTtcbiAgICAgICAgaW5wdXQgID0gY2hhbmdlc2V0LmNyZWF0ZShvdXRwdXQpO1xuXG4gICAgaW5wdXQuYWRkID0gb3V0cHV0LmFkZDtcbiAgICBpbnB1dC5tb2QgPSBvdXRwdXQubW9kO1xuICAgIGlucHV0LnJlbSA9IG91dHB1dC5yZW07XG4gICAgaW5wdXQuc3RhbXAgPSBudWxsO1xuICAgIHRoaXMuX2dyYXBoLnByb3BhZ2F0ZShpbnB1dCwgdGhpcy5fZHMubGlzdGVuZXIoKSk7XG4gIH1cbn1cblxucHJvdG8ucGlwZWxpbmUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFt0aGlzXTtcbn07XG5cbnByb3RvLmNvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJ1aWxkZXIgPSB0aGlzO1xuXG4gIHRoaXMuX21vZGVsLmdyYXBoLmNvbm5lY3QodGhpcy5waXBlbGluZSgpKTtcbiAgdGhpcy5fZW5jb2Rlci5kZXBlbmRlbmN5KEMuU0NBTEVTKS5mb3JFYWNoKGZ1bmN0aW9uKHMpIHtcbiAgICBidWlsZGVyLl9wYXJlbnQuc2NhbGUocykuYWRkTGlzdGVuZXIoYnVpbGRlcik7XG4gIH0pO1xuXG4gIGlmKHRoaXMuX3BhcmVudCkge1xuICAgIGlmKHRoaXMuX2lzU3VwZXIpIHRoaXMuYWRkTGlzdGVuZXIodGhpcy5fcGFyZW50Ll9jb2xsZWN0b3IpO1xuICAgIGVsc2UgdGhpcy5fYm91bmRlci5hZGRMaXN0ZW5lcih0aGlzLl9wYXJlbnQuX2NvbGxlY3Rvcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJ1aWxkZXIgPSB0aGlzO1xuICBpZighdGhpcy5fbGlzdGVuZXJzLmxlbmd0aCkgcmV0dXJuIHRoaXM7XG5cbiAgTm9kZS5wcm90b3R5cGUuZGlzY29ubmVjdC5jYWxsKHRoaXMpO1xuICB0aGlzLl9tb2RlbC5ncmFwaC5kaXNjb25uZWN0KHRoaXMucGlwZWxpbmUoKSk7XG4gIHRoaXMuX2VuY29kZXIuZGVwZW5kZW5jeShDLlNDQUxFUykuZm9yRWFjaChmdW5jdGlvbihzKSB7XG4gICAgYnVpbGRlci5fcGFyZW50LnNjYWxlKHMpLnJlbW92ZUxpc3RlbmVyKGJ1aWxkZXIpO1xuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5zaWJsaW5nID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gdGhpcy5fcGFyZW50LmNoaWxkKG5hbWUsIHRoaXMuX3BhcmVudF9pZCk7XG59O1xuXG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGRlYnVnKGlucHV0LCBbXCJidWlsZGluZ1wiLCB0aGlzLl9mcm9tLCB0aGlzLl9kZWYudHlwZV0pO1xuXG4gIHZhciBvdXRwdXQsIGZ1bGxVcGRhdGUsIGZjcywgZGF0YTtcblxuICBpZih0aGlzLl9kcykge1xuICAgIG91dHB1dCA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpO1xuXG4gICAgLy8gV2UgbmVlZCB0byBkZXRlcm1pbmUgaWYgYW55IGVuY29kZXIgZGVwZW5kZW5jaWVzIGhhdmUgYmVlbiB1cGRhdGVkLlxuICAgIC8vIEhvd2V2ZXIsIHRoZSBlbmNvZGVyJ3MgZGF0YSBzb3VyY2Ugd2lsbCBsaWtlbHkgYmUgdXBkYXRlZCwgYW5kIHNob3VsZG4ndFxuICAgIC8vIHRyaWdnZXIgYWxsIGl0ZW1zIHRvIG1vZC5cbiAgICBkYXRhID0gZGwuZHVwbGljYXRlKG91dHB1dC5kYXRhKTtcbiAgICBkZWxldGUgb3V0cHV0LmRhdGFbdGhpcy5fZHMubmFtZSgpXTtcbiAgICBmdWxsVXBkYXRlID0gdGhpcy5fZW5jb2Rlci5yZWV2YWx1YXRlKG91dHB1dCk7XG4gICAgb3V0cHV0LmRhdGEgPSBkYXRhO1xuXG4gICAgLy8gSWYgYSBzY2FsZSBvciBzaWduYWwgaW4gdGhlIHVwZGF0ZSBwcm9wc2V0IGhhcyBiZWVuIHVwZGF0ZWQsIFxuICAgIC8vIHNlbmQgZm9yd2FyZCBhbGwgaXRlbXMgZm9yIHJlZW5jb2RpbmcgaWYgd2UgZG8gYW4gZWFybHkgcmV0dXJuLlxuICAgIGlmKGZ1bGxVcGRhdGUpIG91dHB1dC5tb2QgPSB0aGlzLl9tYXJrLml0ZW1zLnNsaWNlKCk7XG5cbiAgICBmY3MgPSB0aGlzLl9kcy5sYXN0KCk7XG4gICAgaWYoIWZjcykge1xuICAgICAgb3V0cHV0LnJlZmxvdyA9IHRydWVcbiAgICB9IGVsc2UgaWYoZmNzLnN0YW1wID4gdGhpcy5fc3RhbXApIHtcbiAgICAgIG91dHB1dCA9IGpvaW5EYXRhc291cmNlLmNhbGwodGhpcywgZmNzLCB0aGlzLl9kcy52YWx1ZXMoKSwgZnVsbFVwZGF0ZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZ1bGxVcGRhdGUgPSB0aGlzLl9lbmNvZGVyLnJlZXZhbHVhdGUoaW5wdXQpO1xuICAgIGRhdGEgPSBkbC5pc0Z1bmN0aW9uKHRoaXMuX2RlZi5mcm9tKSA/IHRoaXMuX2RlZi5mcm9tKCkgOiBbQy5TRU5USU5FTF07XG4gICAgb3V0cHV0ID0gam9pblZhbHVlcy5jYWxsKHRoaXMsIGlucHV0LCBkYXRhLCBmdWxsVXBkYXRlKTtcbiAgfVxuXG4gIG91dHB1dCA9IHRoaXMuX2dyYXBoLmV2YWx1YXRlKG91dHB1dCwgdGhpcy5fZW5jb2Rlcik7XG4gIHJldHVybiB0aGlzLl9pc1N1cGVyID8gdGhpcy5fZ3JhcGguZXZhbHVhdGUob3V0cHV0LCB0aGlzLl9ib3VuZGVyKSA6IG91dHB1dDtcbn07XG5cbmZ1bmN0aW9uIG5ld0l0ZW0oKSB7XG4gIHZhciBwcmV2ID0gdGhpcy5fcmV2aXNlcyA/IG51bGwgOiB1bmRlZmluZWQsXG4gICAgICBpdGVtID0gdHVwbGUuaW5nZXN0KG5ldyBJdGVtKHRoaXMuX21hcmspLCBwcmV2KTtcblxuICAvLyBGb3IgdGhlIHJvb3Qgbm9kZSdzIGl0ZW1cbiAgaWYodGhpcy5fZGVmLndpZHRoKSAgdHVwbGUuc2V0KGl0ZW0sIFwid2lkdGhcIiwgIHRoaXMuX2RlZi53aWR0aCk7XG4gIGlmKHRoaXMuX2RlZi5oZWlnaHQpIHR1cGxlLnNldChpdGVtLCBcImhlaWdodFwiLCB0aGlzLl9kZWYuaGVpZ2h0KTtcbiAgcmV0dXJuIGl0ZW07XG59O1xuXG5mdW5jdGlvbiBqb2luKGRhdGEsIGtleWYsIG5leHQsIG91dHB1dCwgcHJldiwgbW9kKSB7XG4gIHZhciBpLCBrZXksIGxlbiwgaXRlbSwgZGF0dW0sIGVudGVyO1xuXG4gIGZvcihpPTAsIGxlbj1kYXRhLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIGRhdHVtID0gZGF0YVtpXTtcbiAgICBpdGVtICA9IGtleWYgPyB0aGlzLl9tYXBba2V5ID0ga2V5ZihkYXR1bSldIDogcHJldltpXTtcbiAgICBlbnRlciA9IGl0ZW0gPyBmYWxzZSA6IChpdGVtID0gbmV3SXRlbS5jYWxsKHRoaXMpLCB0cnVlKTtcbiAgICBpdGVtLnN0YXR1cyA9IGVudGVyID8gQy5FTlRFUiA6IEMuVVBEQVRFO1xuICAgIGl0ZW0uZGF0dW0gPSBkYXR1bTtcbiAgICB0dXBsZS5zZXQoaXRlbSwgXCJrZXlcIiwga2V5KTtcbiAgICB0aGlzLl9tYXBba2V5XSA9IGl0ZW07XG4gICAgbmV4dC5wdXNoKGl0ZW0pO1xuICAgIGlmKGVudGVyKSBvdXRwdXQuYWRkLnB1c2goaXRlbSk7XG4gICAgZWxzZSBpZighbW9kIHx8IChtb2QgJiYgbW9kW2RhdHVtLl9pZF0pKSBvdXRwdXQubW9kLnB1c2goaXRlbSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gam9pbkRhdGFzb3VyY2UoaW5wdXQsIGRhdGEsIGZ1bGxVcGRhdGUpIHtcbiAgdmFyIG91dHB1dCA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpLFxuICAgICAga2V5ZiA9IGtleUZ1bmN0aW9uKHRoaXMuX2RlZi5rZXkgfHwgXCJfaWRcIiksXG4gICAgICBhZGQgPSBpbnB1dC5hZGQsIFxuICAgICAgbW9kID0gaW5wdXQubW9kLCBcbiAgICAgIHJlbSA9IGlucHV0LnJlbSxcbiAgICAgIG5leHQgPSBbXSxcbiAgICAgIGksIGtleSwgbGVuLCBpdGVtLCBkYXR1bSwgZW50ZXI7XG5cbiAgLy8gQnVpbGQgcmVtcyBmaXJzdCwgYW5kIHB1dCB0aGVtIGF0IHRoZSBoZWFkIG9mIHRoZSBuZXh0IGl0ZW1zXG4gIC8vIFRoZW4gYnVpbGQgdGhlIHJlc3Qgb2YgdGhlIGRhdGEgdmFsdWVzICh3aGljaCB3b24ndCBjb250YWluIHJlbSkuXG4gIC8vIFRoaXMgd2lsbCBwcmVzZXJ2ZSB0aGUgc29ydCBvcmRlciB3aXRob3V0IG5lZWRpbmcgYW55dGhpbmcgZXh0cmEuXG5cbiAgZm9yKGk9MCwgbGVuPXJlbS5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBpdGVtID0gdGhpcy5fbWFwW2tleSA9IGtleWYocmVtW2ldKV07XG4gICAgaXRlbS5zdGF0dXMgPSBDLkVYSVQ7XG4gICAgbmV4dC5wdXNoKGl0ZW0pO1xuICAgIG91dHB1dC5yZW0ucHVzaChpdGVtKTtcbiAgICB0aGlzLl9tYXBba2V5XSA9IG51bGw7XG4gIH1cblxuICBqb2luLmNhbGwodGhpcywgZGF0YSwga2V5ZiwgbmV4dCwgb3V0cHV0LCBudWxsLCB0dXBsZS5pZE1hcChmdWxsVXBkYXRlID8gZGF0YSA6IG1vZCkpO1xuXG4gIHJldHVybiAodGhpcy5fbWFyay5pdGVtcyA9IG5leHQsIG91dHB1dCk7XG59XG5cbmZ1bmN0aW9uIGpvaW5WYWx1ZXMoaW5wdXQsIGRhdGEsIGZ1bGxVcGRhdGUpIHtcbiAgdmFyIG91dHB1dCA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpLFxuICAgICAga2V5ZiA9IGtleUZ1bmN0aW9uKHRoaXMuX2RlZi5rZXkpLFxuICAgICAgcHJldiA9IHRoaXMuX21hcmsuaXRlbXMgfHwgW10sXG4gICAgICBuZXh0ID0gW10sXG4gICAgICBpLCBrZXksIGxlbiwgaXRlbSwgZGF0dW0sIGVudGVyO1xuXG4gIGZvciAoaT0wLCBsZW49cHJldi5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBpdGVtID0gcHJldltpXTtcbiAgICBpdGVtLnN0YXR1cyA9IEMuRVhJVDtcbiAgICBpZiAoa2V5ZikgdGhpcy5fbWFwW2l0ZW0ua2V5XSA9IGl0ZW07XG4gIH1cbiAgXG4gIGpvaW4uY2FsbCh0aGlzLCBkYXRhLCBrZXlmLCBuZXh0LCBvdXRwdXQsIHByZXYsIGZ1bGxVcGRhdGUgPyB0dXBsZS5pZE1hcChkYXRhKSA6IG51bGwpO1xuXG4gIGZvciAoaT0wLCBsZW49cHJldi5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBpdGVtID0gcHJldltpXTtcbiAgICBpZiAoaXRlbS5zdGF0dXMgPT09IEMuRVhJVCkge1xuICAgICAgdHVwbGUuc2V0KGl0ZW0sIFwia2V5XCIsIGtleWYgPyBpdGVtLmtleSA6IHRoaXMuX2l0ZW1zLmxlbmd0aCk7XG4gICAgICBuZXh0LnNwbGljZSgwLCAwLCBpdGVtKTsgIC8vIEtlZXAgaXRlbSBhcm91bmQgZm9yIFwiZXhpdFwiIHRyYW5zaXRpb24uXG4gICAgICBvdXRwdXQucmVtLnB1c2goaXRlbSk7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gKHRoaXMuX21hcmsuaXRlbXMgPSBuZXh0LCBvdXRwdXQpO1xufTtcblxuZnVuY3Rpb24ga2V5RnVuY3Rpb24oa2V5KSB7XG4gIGlmIChrZXkgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIHZhciBmID0gZGwuYXJyYXkoa2V5KS5tYXAoZGwuYWNjZXNzb3IpO1xuICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgIGZvciAodmFyIHM9XCJcIiwgaT0wLCBuPWYubGVuZ3RoOyBpPG47ICsraSkge1xuICAgICAgaWYgKGk+MCkgcyArPSBcInxcIjtcbiAgICAgIHMgKz0gU3RyaW5nKGZbaV0oZCkpO1xuICAgIH1cbiAgICByZXR1cm4gcztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdWlsZGVyOyIsInZhciBOb2RlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvTm9kZScpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpLFxuICAgIEVNUFRZID0ge307XG5cbmZ1bmN0aW9uIEVuY29kZXIobW9kZWwsIG1hcmspIHtcbiAgdmFyIHByb3BzID0gbWFyay5kZWYucHJvcGVydGllcyB8fCB7fSxcbiAgICAgIHVwZGF0ZSA9IHByb3BzLnVwZGF0ZTtcblxuICBOb2RlLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgbW9kZWwuZ3JhcGgpXG5cbiAgdGhpcy5fbW9kZWwgPSBtb2RlbDtcbiAgdGhpcy5fbWFyayAgPSBtYXJrO1xuXG4gIGlmKHVwZGF0ZSkge1xuICAgIHRoaXMuZGVwZW5kZW5jeShDLkRBVEEsIHVwZGF0ZS5kYXRhKTtcbiAgICB0aGlzLmRlcGVuZGVuY3koQy5TQ0FMRVMsIHVwZGF0ZS5zY2FsZXMpO1xuICAgIHRoaXMuZGVwZW5kZW5jeShDLlNJR05BTFMsIHVwZGF0ZS5zaWduYWxzKTtcbiAgICB0aGlzLmRlcGVuZGVuY3koQy5GSUVMRFMsIHVwZGF0ZS5maWVsZHMpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cbnZhciBwcm90byA9IChFbmNvZGVyLnByb3RvdHlwZSA9IG5ldyBOb2RlKCkpO1xuXG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGRlYnVnKGlucHV0LCBbXCJlbmNvZGluZ1wiLCB0aGlzLl9tYXJrLmRlZi50eXBlXSk7XG4gIHZhciBncmFwaCA9IHRoaXMuX2dyYXBoLFxuICAgICAgaXRlbXMgPSB0aGlzLl9tYXJrLml0ZW1zLFxuICAgICAgcHJvcHMgPSB0aGlzLl9tYXJrLmRlZi5wcm9wZXJ0aWVzIHx8IHt9LFxuICAgICAgZW50ZXIgID0gcHJvcHMuZW50ZXIsXG4gICAgICB1cGRhdGUgPSBwcm9wcy51cGRhdGUsXG4gICAgICBleGl0ICAgPSBwcm9wcy5leGl0LFxuICAgICAgc2cgPSBncmFwaC5zaWduYWxWYWx1ZXMoKSwgIC8vIEZvciBleHBlZGllbmN5LCBnZXQgYWxsIHNpZ25hbCB2YWx1ZXNcbiAgICAgIGRiLCBpLCBsZW4sIGl0ZW07XG5cbiAgZGIgPSBncmFwaC5kYXRhKCkucmVkdWNlKGZ1bmN0aW9uKGRiLCBkcykgeyBcbiAgICByZXR1cm4gKGRiW2RzLm5hbWUoKV0gPSBkcy52YWx1ZXMoKSwgZGIpO1xuICB9LCB7fSk7XG5cbiAgLy8gSXRlbXMgbWFya2VkIGZvciByZW1vdmFsIGFyZSBhdCB0aGUgaGVhZCBvZiBpdGVtcy4gUHJvY2VzcyB0aGVtIGZpcnN0LlxuICBmb3IoaT0wLCBsZW49aW5wdXQucmVtLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIGl0ZW0gPSBpbnB1dC5yZW1baV07XG4gICAgaWYodXBkYXRlKSBlbmNvZGUuY2FsbCh0aGlzLCB1cGRhdGUsIGl0ZW0sIGlucHV0LnRyYW5zLCBkYiwgc2cpO1xuICAgIGlmKGV4aXQpICAgZW5jb2RlLmNhbGwodGhpcywgZXhpdCwgICBpdGVtLCBpbnB1dC50cmFucyksIGRiLCBzZzsgXG4gICAgaWYoaW5wdXQudHJhbnMgJiYgIWV4aXQpIGlucHV0LnRyYW5zLmludGVycG9sYXRlKGl0ZW0sIEVNUFRZKTtcbiAgICBlbHNlIGlmKCFpbnB1dC50cmFucykgaXRlbS5yZW1vdmUoKTtcbiAgfVxuXG4gIGZvcihpPTAsIGxlbj1pbnB1dC5hZGQubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgaXRlbSA9IGlucHV0LmFkZFtpXTtcbiAgICBpZihlbnRlcikgIGVuY29kZS5jYWxsKHRoaXMsIGVudGVyLCAgaXRlbSwgaW5wdXQudHJhbnMsIGRiLCBzZyk7XG4gICAgaWYodXBkYXRlKSBlbmNvZGUuY2FsbCh0aGlzLCB1cGRhdGUsIGl0ZW0sIGlucHV0LnRyYW5zLCBkYiwgc2cpO1xuICAgIGl0ZW0uc3RhdHVzID0gQy5VUERBVEU7XG4gIH1cblxuICBpZih1cGRhdGUpIHtcbiAgICBmb3IoaT0wLCBsZW49aW5wdXQubW9kLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgICAgaXRlbSA9IGlucHV0Lm1vZFtpXTtcbiAgICAgIGVuY29kZS5jYWxsKHRoaXMsIHVwZGF0ZSwgaXRlbSwgaW5wdXQudHJhbnMsIGRiLCBzZyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGlucHV0O1xufTtcblxuZnVuY3Rpb24gZW5jb2RlKHByb3AsIGl0ZW0sIHRyYW5zLCBkYiwgc2cpIHtcbiAgdmFyIGVuYyA9IHByb3AuZW5jb2RlO1xuICBlbmMuY2FsbChlbmMsIGl0ZW0sIGl0ZW0ubWFyay5ncm91cHx8aXRlbSwgdHJhbnMsIGRiLCBzZywgdGhpcy5fbW9kZWwucHJlZGljYXRlcygpKTtcbn1cblxuLy8gSWYgdXBkYXRlIHByb3BlcnR5IHNldCB1c2VzIGEgZ3JvdXAgcHJvcGVydHksIHJlZXZhbHVhdGUgYWxsIGl0ZW1zLlxucHJvdG8ucmVldmFsdWF0ZSA9IGZ1bmN0aW9uKHB1bHNlKSB7XG4gIHZhciBwcm9wcyA9IHRoaXMuX21hcmsuZGVmLnByb3BlcnRpZXMgfHwge30sXG4gICAgICB1cGRhdGUgPSBwcm9wcy51cGRhdGU7XG4gIHJldHVybiBOb2RlLnByb3RvdHlwZS5yZWV2YWx1YXRlLmNhbGwodGhpcywgcHVsc2UpIHx8ICh1cGRhdGUgPyB1cGRhdGUuZ3JvdXAgOiBmYWxzZSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVuY29kZXI7IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIE5vZGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Ob2RlJyksXG4gICAgQ29sbGVjdG9yID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvQ29sbGVjdG9yJyksXG4gICAgQnVpbGRlciA9IHJlcXVpcmUoJy4vQnVpbGRlcicpLFxuICAgIFNjYWxlID0gcmVxdWlyZSgnLi9TY2FsZScpLFxuICAgIHBhcnNlQXhlcyA9IHJlcXVpcmUoJy4uL3BhcnNlL2F4ZXMnKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gR3JvdXBCdWlsZGVyKCkge1xuICB0aGlzLl9jaGlsZHJlbiA9IHt9O1xuICB0aGlzLl9zY2FsZXIgPSBudWxsO1xuICB0aGlzLl9yZWN1cnNvciA9IG51bGw7XG5cbiAgdGhpcy5fc2NhbGVzID0ge307XG4gIHRoaXMuc2NhbGUgPSBzY2FsZS5iaW5kKHRoaXMpO1xuICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/IHRoaXMuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDogdGhpcztcbn1cblxudmFyIHByb3RvID0gKEdyb3VwQnVpbGRlci5wcm90b3R5cGUgPSBuZXcgQnVpbGRlcigpKTtcblxucHJvdG8uaW5pdCA9IGZ1bmN0aW9uKG1vZGVsLCBkZWYsIG1hcmssIHBhcmVudCwgcGFyZW50X2lkLCBpbmhlcml0RnJvbSkge1xuICB2YXIgYnVpbGRlciA9IHRoaXM7XG5cbiAgdGhpcy5fc2NhbGVyID0gbmV3IE5vZGUobW9kZWwuZ3JhcGgpO1xuXG4gIChkZWYuc2NhbGVzfHxbXSkuZm9yRWFjaChmdW5jdGlvbihzKSB7IFxuICAgIHMgPSBidWlsZGVyLnNjYWxlKHMubmFtZSwgbmV3IFNjYWxlKG1vZGVsLCBzLCBidWlsZGVyKSk7XG4gICAgYnVpbGRlci5fc2NhbGVyLmFkZExpc3RlbmVyKHMpOyAgLy8gU2NhbGVzIHNob3VsZCBiZSBjb21wdXRlZCBhZnRlciBncm91cCBpcyBlbmNvZGVkXG4gIH0pO1xuXG4gIHRoaXMuX3JlY3Vyc29yID0gbmV3IE5vZGUobW9kZWwuZ3JhcGgpO1xuICB0aGlzLl9yZWN1cnNvci5ldmFsdWF0ZSA9IHJlY3Vyc2UuYmluZCh0aGlzKTtcblxuICB2YXIgc2NhbGVzID0gKGRlZi5heGVzfHxbXSkucmVkdWNlKGZ1bmN0aW9uKGFjYywgeCkge1xuICAgIHJldHVybiAoYWNjW3guc2NhbGVdID0gMSwgYWNjKTtcbiAgfSwge30pO1xuICB0aGlzLl9yZWN1cnNvci5kZXBlbmRlbmN5KEMuU0NBTEVTLCBkbC5rZXlzKHNjYWxlcykpO1xuXG4gIC8vIFdlIG9ubHkgbmVlZCBhIGNvbGxlY3RvciBmb3IgdXAtcHJvcGFnYXRpb24gb2YgYm91bmRzIGNhbGN1bGF0aW9uLFxuICAvLyBzbyBvbmx5IEdyb3VwQnVpbGRlcnMsIGFuZCBub3QgcmVndWxhciBCdWlsZGVycywgaGF2ZSBjb2xsZWN0b3JzLlxuICB0aGlzLl9jb2xsZWN0b3IgPSBuZXcgQ29sbGVjdG9yKG1vZGVsLmdyYXBoKTtcblxuICByZXR1cm4gQnVpbGRlci5wcm90b3R5cGUuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgb3V0cHV0ID0gQnVpbGRlci5wcm90b3R5cGUuZXZhbHVhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKSxcbiAgICAgIGJ1aWxkZXIgPSB0aGlzO1xuXG4gIG91dHB1dC5hZGQuZm9yRWFjaChmdW5jdGlvbihncm91cCkgeyBidWlsZEdyb3VwLmNhbGwoYnVpbGRlciwgb3V0cHV0LCBncm91cCk7IH0pO1xuICByZXR1cm4gb3V0cHV0O1xufTtcblxucHJvdG8ucGlwZWxpbmUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFt0aGlzLCB0aGlzLl9zY2FsZXIsIHRoaXMuX3JlY3Vyc29yLCB0aGlzLl9jb2xsZWN0b3IsIHRoaXMuX2JvdW5kZXJdO1xufTtcblxucHJvdG8uZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYnVpbGRlciA9IHRoaXM7XG4gIGRsLmtleXMoYnVpbGRlci5fY2hpbGRyZW4pLmZvckVhY2goZnVuY3Rpb24oZ3JvdXBfaWQpIHtcbiAgICBidWlsZGVyLl9jaGlsZHJlbltncm91cF9pZF0uZm9yRWFjaChmdW5jdGlvbihjKSB7XG4gICAgICBidWlsZGVyLl9yZWN1cnNvci5yZW1vdmVMaXN0ZW5lcihjLmJ1aWxkZXIpO1xuICAgICAgYy5idWlsZGVyLmRpc2Nvbm5lY3QoKTtcbiAgICB9KVxuICB9KTtcblxuICBidWlsZGVyLl9jaGlsZHJlbiA9IHt9O1xuICByZXR1cm4gQnVpbGRlci5wcm90b3R5cGUuZGlzY29ubmVjdC5jYWxsKHRoaXMpO1xufTtcblxucHJvdG8uY2hpbGQgPSBmdW5jdGlvbihuYW1lLCBncm91cF9pZCkge1xuICB2YXIgY2hpbGRyZW4gPSB0aGlzLl9jaGlsZHJlbltncm91cF9pZF0sXG4gICAgICBpID0gMCwgbGVuID0gY2hpbGRyZW4ubGVuZ3RoLFxuICAgICAgY2hpbGQ7XG5cbiAgZm9yKDsgaTxsZW47ICsraSkge1xuICAgIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgaWYoY2hpbGQudHlwZSA9PSBDLk1BUksgJiYgY2hpbGQuYnVpbGRlci5fZGVmLm5hbWUgPT0gbmFtZSkgYnJlYWs7XG4gIH1cblxuICByZXR1cm4gY2hpbGQuYnVpbGRlcjtcbn07XG5cbmZ1bmN0aW9uIHJlY3Vyc2UoaW5wdXQpIHtcbiAgdmFyIGJ1aWxkZXIgPSB0aGlzLFxuICAgICAgaGFzTWFya3MgPSB0aGlzLl9kZWYubWFya3MgJiYgdGhpcy5fZGVmLm1hcmtzLmxlbmd0aCA+IDAsXG4gICAgICBoYXNBeGVzID0gdGhpcy5fZGVmLmF4ZXMgJiYgdGhpcy5fZGVmLmF4ZXMubGVuZ3RoID4gMCxcbiAgICAgIGksIGxlbiwgZ3JvdXAsIHBpcGVsaW5lLCBkZWYsIGlubGluZSA9IGZhbHNlO1xuXG4gIGZvcihpPTAsIGxlbj1pbnB1dC5hZGQubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgZ3JvdXAgPSBpbnB1dC5hZGRbaV07XG4gICAgaWYoaGFzTWFya3MpIGJ1aWxkTWFya3MuY2FsbCh0aGlzLCBpbnB1dCwgZ3JvdXApO1xuICAgIGlmKGhhc0F4ZXMpICBidWlsZEF4ZXMuY2FsbCh0aGlzLCBpbnB1dCwgZ3JvdXApO1xuICB9XG5cbiAgLy8gV2lyZSB1cCBuZXcgY2hpbGRyZW4gYnVpbGRlcnMgaW4gcmV2ZXJzZSB0byBtaW5pbWl6ZSBncmFwaCByZXdyaXRlcy5cbiAgZm9yIChpPWlucHV0LmFkZC5sZW5ndGgtMTsgaT49MDsgLS1pKSB7XG4gICAgZ3JvdXAgPSBpbnB1dC5hZGRbaV07XG4gICAgZm9yIChqPXRoaXMuX2NoaWxkcmVuW2dyb3VwLl9pZF0ubGVuZ3RoLTE7IGo+PTA7IC0taikge1xuICAgICAgYyA9IHRoaXMuX2NoaWxkcmVuW2dyb3VwLl9pZF1bal07XG4gICAgICBjLmJ1aWxkZXIuY29ubmVjdCgpO1xuICAgICAgcGlwZWxpbmUgPSBjLmJ1aWxkZXIucGlwZWxpbmUoKTtcbiAgICAgIGRlZiA9IGMuYnVpbGRlci5fZGVmO1xuXG4gICAgICAvLyBUaGlzIG5ldyBjaGlsZCBuZWVkcyB0byBiZSBidWlsdCBkdXJpbmcgdGhpcyBwcm9wYWdhdGlvbiBjeWNsZS5cbiAgICAgIC8vIFdlIGNvdWxkIGFkZCBpdHMgYnVpbGRlciBhcyBhIGxpc3RlbmVyIG9mZiB0aGUgX3JlY3Vyc29yIG5vZGUsIFxuICAgICAgLy8gYnV0IHRyeSB0byBpbmxpbmUgaXQgaWYgd2UgY2FuIHRvIG1pbmltaXplIGdyYXBoIGRpc3BhdGNoZXMuXG4gICAgICBpbmxpbmUgPSAoZGVmLnR5cGUgIT09IEMuR1JPVVApO1xuICAgICAgaW5saW5lID0gaW5saW5lICYmICh0aGlzLl9tb2RlbC5kYXRhKGMuZnJvbSkgIT09IHVuZGVmaW5lZCk7IFxuICAgICAgaW5saW5lID0gaW5saW5lICYmIChwaXBlbGluZVtwaXBlbGluZS5sZW5ndGgtMV0ubGlzdGVuZXJzKCkubGVuZ3RoID09IDEpOyAvLyBSZWFjdGl2ZSBnZW9tXG4gICAgICBjLmlubGluZSA9IGlubGluZTtcblxuICAgICAgaWYoaW5saW5lKSBjLmJ1aWxkZXIuZXZhbHVhdGUoaW5wdXQpO1xuICAgICAgZWxzZSB0aGlzLl9yZWN1cnNvci5hZGRMaXN0ZW5lcihjLmJ1aWxkZXIpO1xuICAgIH1cbiAgfVxuXG4gIGZvcihpPTAsIGxlbj1pbnB1dC5tb2QubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgZ3JvdXAgPSBpbnB1dC5tb2RbaV07XG4gICAgLy8gUmVtb3ZlIHRlbXBvcmFyeSBjb25uZWN0aW9uIGZvciBtYXJrcyB0aGF0IGRyYXcgZnJvbSBhIHNvdXJjZVxuICAgIGlmKGhhc01hcmtzKSB7XG4gICAgICBidWlsZGVyLl9jaGlsZHJlbltncm91cC5faWRdLmZvckVhY2goZnVuY3Rpb24oYykge1xuICAgICAgICBpZihjLnR5cGUgPT0gQy5NQVJLICYmICFjLmlubGluZSAmJiBidWlsZGVyLl9tb2RlbC5kYXRhKGMuZnJvbSkgIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICBidWlsZGVyLl9yZWN1cnNvci5yZW1vdmVMaXN0ZW5lcihjLmJ1aWxkZXIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgYXhlcyBkYXRhIGRlZnNcbiAgICBpZihoYXNBeGVzKSB7XG4gICAgICBwYXJzZUF4ZXMoYnVpbGRlci5fbW9kZWwsIGJ1aWxkZXIuX2RlZi5heGVzLCBncm91cC5heGVzLCBncm91cCk7XG4gICAgICBncm91cC5heGVzLmZvckVhY2goZnVuY3Rpb24oYSwgaSkgeyBhLmRlZigpIH0pO1xuICAgIH0gICAgICBcbiAgfVxuXG4gIGZvcihpPTAsIGxlbj1pbnB1dC5yZW0ubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgZ3JvdXAgPSBpbnB1dC5yZW1baV07XG4gICAgLy8gRm9yIGRlbGV0ZWQgZ3JvdXBzLCBkaXNjb25uZWN0IHRoZWlyIGNoaWxkcmVuXG4gICAgYnVpbGRlci5fY2hpbGRyZW5bZ3JvdXAuX2lkXS5mb3JFYWNoKGZ1bmN0aW9uKGMpIHsgXG4gICAgICBidWlsZGVyLl9yZWN1cnNvci5yZW1vdmVMaXN0ZW5lcihjLmJ1aWxkZXIpO1xuICAgICAgYy5idWlsZGVyLmRpc2Nvbm5lY3QoKTsgXG4gICAgfSk7XG4gICAgZGVsZXRlIGJ1aWxkZXIuX2NoaWxkcmVuW2dyb3VwLl9pZF07XG4gIH1cblxuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5mdW5jdGlvbiBzY2FsZShuYW1lLCBzY2FsZSkge1xuICB2YXIgZ3JvdXAgPSB0aGlzO1xuICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAyKSByZXR1cm4gKGdyb3VwLl9zY2FsZXNbbmFtZV0gPSBzY2FsZSwgc2NhbGUpO1xuICB3aGlsZShzY2FsZSA9PSBudWxsKSB7XG4gICAgc2NhbGUgPSBncm91cC5fc2NhbGVzW25hbWVdO1xuICAgIGdyb3VwID0gZ3JvdXAubWFyayA/IGdyb3VwLm1hcmsuZ3JvdXAgOiBncm91cC5fcGFyZW50O1xuICAgIGlmKCFncm91cCkgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIHNjYWxlO1xufVxuXG5mdW5jdGlvbiBidWlsZEdyb3VwKGlucHV0LCBncm91cCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wiYnVpbGRpbmcgZ3JvdXBcIiwgZ3JvdXAuX2lkXSk7XG5cbiAgZ3JvdXAuX3NjYWxlcyA9IGdyb3VwLl9zY2FsZXMgfHwge307ICAgIFxuICBncm91cC5zY2FsZSAgPSBzY2FsZS5iaW5kKGdyb3VwKTtcblxuICBncm91cC5pdGVtcyA9IGdyb3VwLml0ZW1zIHx8IFtdO1xuICB0aGlzLl9jaGlsZHJlbltncm91cC5faWRdID0gdGhpcy5fY2hpbGRyZW5bZ3JvdXAuX2lkXSB8fCBbXTtcblxuICBncm91cC5heGVzID0gZ3JvdXAuYXhlcyB8fCBbXTtcbiAgZ3JvdXAuYXhpc0l0ZW1zID0gZ3JvdXAuYXhpc0l0ZW1zIHx8IFtdO1xufVxuXG5mdW5jdGlvbiBidWlsZE1hcmtzKGlucHV0LCBncm91cCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wiYnVpbGRpbmcgbWFya3NcIiwgZ3JvdXAuX2lkXSk7XG4gIHZhciBtYXJrcyA9IHRoaXMuX2RlZi5tYXJrcyxcbiAgICAgIGxpc3RlbmVycyA9IFtdLFxuICAgICAgbWFyaywgZnJvbSwgaW5oZXJpdCwgaSwgbGVuLCBtLCBiO1xuXG4gIGZvcihpPTAsIGxlbj1tYXJrcy5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBtYXJrID0gbWFya3NbaV07XG4gICAgZnJvbSA9IG1hcmsuZnJvbSB8fCB7fTtcbiAgICBpbmhlcml0ID0gXCJ2Z19cIitncm91cC5kYXR1bS5faWQ7XG4gICAgZ3JvdXAuaXRlbXNbaV0gPSB7Z3JvdXA6IGdyb3VwfTtcbiAgICBiID0gKG1hcmsudHlwZSA9PT0gQy5HUk9VUCkgPyBuZXcgR3JvdXBCdWlsZGVyKCkgOiBuZXcgQnVpbGRlcigpO1xuICAgIGIuaW5pdCh0aGlzLl9tb2RlbCwgbWFyaywgZ3JvdXAuaXRlbXNbaV0sIHRoaXMsIGdyb3VwLl9pZCwgaW5oZXJpdCk7XG4gICAgdGhpcy5fY2hpbGRyZW5bZ3JvdXAuX2lkXS5wdXNoKHsgXG4gICAgICBidWlsZGVyOiBiLCBcbiAgICAgIGZyb206IGZyb20uZGF0YSB8fCAoZnJvbS5tYXJrID8gKFwidmdfXCIgKyBncm91cC5faWQgKyBcIl9cIiArIGZyb20ubWFyaykgOiBpbmhlcml0KSwgXG4gICAgICB0eXBlOiBDLk1BUksgXG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGRBeGVzKGlucHV0LCBncm91cCkge1xuICB2YXIgYXhlcyA9IGdyb3VwLmF4ZXMsXG4gICAgICBheGlzSXRlbXMgPSBncm91cC5heGlzSXRlbXMsXG4gICAgICBidWlsZGVyID0gdGhpcztcblxuICBwYXJzZUF4ZXModGhpcy5fbW9kZWwsIHRoaXMuX2RlZi5heGVzLCBheGVzLCBncm91cCk7XG4gIGF4ZXMuZm9yRWFjaChmdW5jdGlvbihhLCBpKSB7XG4gICAgdmFyIHNjYWxlID0gYnVpbGRlci5fZGVmLmF4ZXNbaV0uc2NhbGUsXG4gICAgICAgIGRlZiA9IGEuZGVmKCksXG4gICAgICAgIGIgPSBudWxsO1xuXG4gICAgYXhpc0l0ZW1zW2ldID0ge2dyb3VwOiBncm91cCwgYXhpc0RlZjogZGVmfTtcbiAgICBiID0gKGRlZi50eXBlID09PSBDLkdST1VQKSA/IG5ldyBHcm91cEJ1aWxkZXIoKSA6IG5ldyBCdWlsZGVyKCk7XG4gICAgYi5pbml0KGJ1aWxkZXIuX21vZGVsLCBkZWYsIGF4aXNJdGVtc1tpXSwgYnVpbGRlcilcbiAgICAgIC5kZXBlbmRlbmN5KEMuU0NBTEVTLCBzY2FsZSk7XG4gICAgYnVpbGRlci5fY2hpbGRyZW5bZ3JvdXAuX2lkXS5wdXNoKHsgYnVpbGRlcjogYiwgdHlwZTogQy5BWElTLCBzY2FsZTogc2NhbGUgfSk7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwQnVpbGRlcjsiLCJmdW5jdGlvbiBJdGVtKG1hcmspIHtcbiAgdGhpcy5tYXJrID0gbWFyaztcbn1cblxudmFyIHByb3RvdHlwZSA9IEl0ZW0ucHJvdG90eXBlO1xuXG5wcm90b3R5cGUuaGFzUHJvcGVydHlTZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBwcm9wcyA9IHRoaXMubWFyay5kZWYucHJvcGVydGllcztcbiAgcmV0dXJuIHByb3BzICYmIHByb3BzW25hbWVdICE9IG51bGw7XG59O1xuXG5wcm90b3R5cGUuY291c2luID0gZnVuY3Rpb24ob2Zmc2V0LCBpbmRleCkge1xuICBpZiAob2Zmc2V0ID09PSAwKSByZXR1cm4gdGhpcztcbiAgb2Zmc2V0ID0gb2Zmc2V0IHx8IC0xO1xuICB2YXIgbWFyayA9IHRoaXMubWFyayxcbiAgICAgIGdyb3VwID0gbWFyay5ncm91cCxcbiAgICAgIGlpZHggPSBpbmRleD09bnVsbCA/IG1hcmsuaXRlbXMuaW5kZXhPZih0aGlzKSA6IGluZGV4LFxuICAgICAgbWlkeCA9IGdyb3VwLml0ZW1zLmluZGV4T2YobWFyaykgKyBvZmZzZXQ7XG4gIHJldHVybiBncm91cC5pdGVtc1ttaWR4XS5pdGVtc1tpaWR4XTtcbn07XG5cbnByb3RvdHlwZS5zaWJsaW5nID0gZnVuY3Rpb24ob2Zmc2V0KSB7XG4gIGlmIChvZmZzZXQgPT09IDApIHJldHVybiB0aGlzO1xuICBvZmZzZXQgPSBvZmZzZXQgfHwgLTE7XG4gIHZhciBtYXJrID0gdGhpcy5tYXJrLFxuICAgICAgaWlkeCA9IG1hcmsuaXRlbXMuaW5kZXhPZih0aGlzKSArIG9mZnNldDtcbiAgcmV0dXJuIG1hcmsuaXRlbXNbaWlkeF07XG59O1xuXG5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpdGVtID0gdGhpcyxcbiAgICAgIGxpc3QgPSBpdGVtLm1hcmsuaXRlbXMsXG4gICAgICBpID0gbGlzdC5pbmRleE9mKGl0ZW0pO1xuICBpZiAoaSA+PSAwKSAoaT09PWxpc3QubGVuZ3RoLTEpID8gbGlzdC5wb3AoKSA6IGxpc3Quc3BsaWNlKGksIDEpO1xuICByZXR1cm4gaXRlbTtcbn07XG5cbnByb3RvdHlwZS50b3VjaCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5wYXRoQ2FjaGUpIHRoaXMucGF0aENhY2hlID0gbnVsbDtcbiAgaWYgKHRoaXMubWFyay5wYXRoQ2FjaGUpIHRoaXMubWFyay5wYXRoQ2FjaGUgPSBudWxsO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBJdGVtOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICAgIE5vZGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Ob2RlJyksXG4gICAgQWdncmVnYXRlID0gcmVxdWlyZSgnLi4vdHJhbnNmb3Jtcy9BZ2dyZWdhdGUnKSxcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9jaGFuZ2VzZXQnKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKSxcbiAgICBjb25maWcgPSByZXF1aXJlKCcuLi91dGlsL2NvbmZpZycpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG52YXIgR1JPVVBfUFJPUEVSVFkgPSB7d2lkdGg6IDEsIGhlaWdodDogMX07XG5cbmZ1bmN0aW9uIFNjYWxlKG1vZGVsLCBkZWYsIHBhcmVudCkge1xuICB0aGlzLl9tb2RlbCAgID0gbW9kZWw7XG4gIHRoaXMuX2RlZiAgICAgPSBkZWY7XG4gIHRoaXMuX3BhcmVudCAgPSBwYXJlbnQ7XG4gIHRoaXMuX3VwZGF0ZWQgPSBmYWxzZTtcbiAgcmV0dXJuIE5vZGUucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBtb2RlbC5ncmFwaCk7XG59XG5cbnZhciBwcm90byA9IChTY2FsZS5wcm90b3R5cGUgPSBuZXcgTm9kZSgpKTtcblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICBmbiA9IGZ1bmN0aW9uKGdyb3VwKSB7IHNjYWxlLmNhbGwoc2VsZiwgZ3JvdXApOyB9O1xuXG4gIHRoaXMuX3VwZGF0ZWQgPSBmYWxzZTtcbiAgaW5wdXQuYWRkLmZvckVhY2goZm4pO1xuICBpbnB1dC5tb2QuZm9yRWFjaChmbik7XG5cbiAgLy8gU2NhbGVzIGFyZSBhdCB0aGUgZW5kIG9mIGFuIGVuY29kaW5nIHBpcGVsaW5lLCBzbyB0aGV5IHNob3VsZCBmb3J3YXJkIGFcbiAgLy8gcmVmbG93IHB1bHNlLiBUaHVzLCBpZiBtdWx0aXBsZSBzY2FsZXMgdXBkYXRlIGluIHRoZSBwYXJlbnQgZ3JvdXAsIHdlIGRvbid0XG4gIC8vIHJlZXZhbHVhdGUgY2hpbGQgbWFya3MgbXVsdGlwbGUgdGltZXMuIFxuICBpZiAodGhpcy5fdXBkYXRlZCkgaW5wdXQuc2NhbGVzW3RoaXMuX2RlZi5uYW1lXSA9IDE7XG4gIHJldHVybiBjaGFuZ2VzZXQuY3JlYXRlKGlucHV0LCB0cnVlKTtcbn07XG5cbi8vIEFsbCBvZiBhIHNjYWxlJ3MgZGVwZW5kZW5jaWVzIGFyZSByZWdpc3RlcmVkIGR1cmluZyBwcm9wYWdhdGlvbiBhcyB3ZSBwYXJzZVxuLy8gZGF0YVJlZnMuIFNvIGEgc2NhbGUgbXVzdCBiZSByZXNwb25zaWJsZSBmb3IgY29ubmVjdGluZyBpdHNlbGYgdG8gZGVwZW5kZW50cy5cbnByb3RvLmRlcGVuZGVuY3kgPSBmdW5jdGlvbih0eXBlLCBkZXBzKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDIpIHtcbiAgICBkZXBzID0gZGwuYXJyYXkoZGVwcyk7XG4gICAgZm9yKHZhciBpPTAsIGxlbj1kZXBzLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgICAgdGhpcy5fZ3JhcGhbdHlwZSA9PSBDLkRBVEEgPyBDLkRBVEEgOiBDLlNJR05BTF0oZGVwc1tpXSlcbiAgICAgICAgLmFkZExpc3RlbmVyKHRoaXMuX3BhcmVudCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE5vZGUucHJvdG90eXBlLmRlcGVuZGVuY3kuY2FsbCh0aGlzLCB0eXBlLCBkZXBzKTtcbn07XG5cbmZ1bmN0aW9uIHNjYWxlKGdyb3VwKSB7XG4gIHZhciBuYW1lID0gdGhpcy5fZGVmLm5hbWUsXG4gICAgICBwcmV2ID0gbmFtZSArIFwiOnByZXZcIixcbiAgICAgIHMgPSBpbnN0YW5jZS5jYWxsKHRoaXMsIGdyb3VwLnNjYWxlKG5hbWUpKSxcbiAgICAgIG0gPSBzLnR5cGU9PT1DLk9SRElOQUwgPyBvcmRpbmFsIDogcXVhbnRpdGF0aXZlLFxuICAgICAgcm5nID0gcmFuZ2UuY2FsbCh0aGlzLCBncm91cCk7XG5cbiAgbS5jYWxsKHRoaXMsIHMsIHJuZywgZ3JvdXApO1xuXG4gIGdyb3VwLnNjYWxlKG5hbWUsIHMpO1xuICBncm91cC5zY2FsZShwcmV2LCBncm91cC5zY2FsZShwcmV2KSB8fCBzKTtcblxuICByZXR1cm4gcztcbn1cblxuZnVuY3Rpb24gaW5zdGFuY2Uoc2NhbGUpIHtcbiAgdmFyIHR5cGUgPSB0aGlzLl9kZWYudHlwZSB8fCBDLkxJTkVBUjtcbiAgaWYgKCFzY2FsZSB8fCB0eXBlICE9PSBzY2FsZS50eXBlKSB7XG4gICAgdmFyIGN0b3IgPSBjb25maWcuc2NhbGVbdHlwZV0gfHwgZDMuc2NhbGVbdHlwZV07XG4gICAgaWYgKCFjdG9yKSBkbC5lcnJvcihcIlVucmVjb2duaXplZCBzY2FsZSB0eXBlOiBcIiArIHR5cGUpO1xuICAgIChzY2FsZSA9IGN0b3IoKSkudHlwZSA9IHNjYWxlLnR5cGUgfHwgdHlwZTtcbiAgICBzY2FsZS5zY2FsZU5hbWUgPSB0aGlzLl9kZWYubmFtZTtcbiAgICBzY2FsZS5fcHJldiA9IHt9O1xuICB9XG4gIHJldHVybiBzY2FsZTtcbn1cblxuZnVuY3Rpb24gb3JkaW5hbChzY2FsZSwgcm5nLCBncm91cCkge1xuICB2YXIgZGVmID0gdGhpcy5fZGVmLFxuICAgICAgcHJldiA9IHNjYWxlLl9wcmV2LFxuICAgICAgZG9tYWluLCBzb3J0LCBzdHIsIHJlZnMsIGRhdGFEcml2ZW5SYW5nZSA9IGZhbHNlO1xuICBcbiAgLy8gcmFuZ2UgcHJlLXByb2Nlc3NpbmcgZm9yIGRhdGEtZHJpdmVuIHJhbmdlc1xuICBpZiAoZGwuaXNPYmplY3QoZGVmLnJhbmdlKSAmJiAhZGwuaXNBcnJheShkZWYucmFuZ2UpKSB7XG4gICAgZGF0YURyaXZlblJhbmdlID0gdHJ1ZTtcbiAgICBybmcgPSBkYXRhUmVmLmNhbGwodGhpcywgQy5SQU5HRSwgZGVmLnJhbmdlLCBzY2FsZSwgZ3JvdXApO1xuICB9XG4gIFxuICAvLyBkb21haW5cbiAgZG9tYWluID0gZGF0YVJlZi5jYWxsKHRoaXMsIEMuRE9NQUlOLCBkZWYuZG9tYWluLCBzY2FsZSwgZ3JvdXApO1xuICBpZiAoZG9tYWluICYmICFkbC5lcXVhbChwcmV2LmRvbWFpbiwgZG9tYWluKSkge1xuICAgIHNjYWxlLmRvbWFpbihkb21haW4pO1xuICAgIHByZXYuZG9tYWluID0gZG9tYWluO1xuICAgIHRoaXMuX3VwZGF0ZWQgPSB0cnVlO1xuICB9IFxuXG4gIC8vIHJhbmdlXG4gIGlmIChkbC5lcXVhbChwcmV2LnJhbmdlLCBybmcpKSByZXR1cm47XG5cbiAgc3RyID0gdHlwZW9mIHJuZ1swXSA9PT0gJ3N0cmluZyc7XG4gIGlmIChzdHIgfHwgcm5nLmxlbmd0aCA+IDIgfHwgcm5nLmxlbmd0aD09PTEgfHwgZGF0YURyaXZlblJhbmdlKSB7XG4gICAgc2NhbGUucmFuZ2Uocm5nKTsgLy8gY29sb3Igb3Igc2hhcGUgdmFsdWVzXG4gIH0gZWxzZSBpZiAoZGVmLnBvaW50cykge1xuICAgIHNjYWxlLnJhbmdlUG9pbnRzKHJuZywgZGVmLnBhZGRpbmd8fDApO1xuICB9IGVsc2UgaWYgKGRlZi5yb3VuZCB8fCBkZWYucm91bmQ9PT11bmRlZmluZWQpIHtcbiAgICBzY2FsZS5yYW5nZVJvdW5kQmFuZHMocm5nLCBkZWYucGFkZGluZ3x8MCk7XG4gIH0gZWxzZSB7XG4gICAgc2NhbGUucmFuZ2VCYW5kcyhybmcsIGRlZi5wYWRkaW5nfHwwKTtcbiAgfVxuXG4gIHByZXYucmFuZ2UgPSBybmc7XG4gIHRoaXMuX3VwZGF0ZWQgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBxdWFudGl0YXRpdmUoc2NhbGUsIHJuZywgZ3JvdXApIHtcbiAgdmFyIGRlZiA9IHRoaXMuX2RlZixcbiAgICAgIHByZXYgPSBzY2FsZS5fcHJldixcbiAgICAgIGRvbWFpbiwgaW50ZXJ2YWw7XG5cbiAgLy8gZG9tYWluXG4gIGRvbWFpbiA9IChkZWYudHlwZSA9PT0gQy5RVUFOVElMRSlcbiAgICA/IGRhdGFSZWYuY2FsbCh0aGlzLCBDLkRPTUFJTiwgZGVmLmRvbWFpbiwgc2NhbGUsIGdyb3VwKVxuICAgIDogZG9tYWluTWluTWF4LmNhbGwodGhpcywgc2NhbGUsIGdyb3VwKTtcbiAgaWYgKGRvbWFpbiAmJiAhZGwuZXF1YWwocHJldi5kb21haW4sIGRvbWFpbikpIHtcbiAgICBzY2FsZS5kb21haW4oZG9tYWluKTtcbiAgICBwcmV2LmRvbWFpbiA9IGRvbWFpbjtcbiAgICB0aGlzLl91cGRhdGVkID0gdHJ1ZTtcbiAgfSBcblxuICAvLyByYW5nZVxuICAvLyB2ZXJ0aWNhbCBzY2FsZXMgc2hvdWxkIGZsaXAgYnkgZGVmYXVsdCwgc28gdXNlIFhPUiBoZXJlXG4gIGlmIChkZWYucmFuZ2UgPT09IFwiaGVpZ2h0XCIpIHJuZyA9IHJuZy5yZXZlcnNlKCk7XG4gIGlmIChkbC5lcXVhbChwcmV2LnJhbmdlLCBybmcpKSByZXR1cm47XG4gIHNjYWxlW2RlZi5yb3VuZCAmJiBzY2FsZS5yYW5nZVJvdW5kID8gXCJyYW5nZVJvdW5kXCIgOiBcInJhbmdlXCJdKHJuZyk7XG4gIHByZXYucmFuZ2UgPSBybmc7XG4gIHRoaXMuX3VwZGF0ZWQgPSB0cnVlO1xuXG4gIC8vIFRPRE86IFN1cHBvcnQgc2lnbmFscyBmb3IgdGhlc2UgcHJvcGVydGllcy4gVW50aWwgdGhlbiwgb25seSBldmFsXG4gIC8vIHRoZW0gb25jZS5cbiAgaWYgKHRoaXMuX3N0YW1wID4gMCkgcmV0dXJuO1xuICBpZiAoZGVmLmV4cG9uZW50ICYmIGRlZi50eXBlPT09Qy5QT1dFUikgc2NhbGUuZXhwb25lbnQoZGVmLmV4cG9uZW50KTtcbiAgaWYgKGRlZi5jbGFtcCkgc2NhbGUuY2xhbXAodHJ1ZSk7XG4gIGlmIChkZWYubmljZSkge1xuICAgIGlmIChkZWYudHlwZSA9PT0gQy5USU1FKSB7XG4gICAgICBpbnRlcnZhbCA9IGQzLnRpbWVbZGVmLm5pY2VdO1xuICAgICAgaWYgKCFpbnRlcnZhbCkgZGwuZXJyb3IoXCJVbnJlY29nbml6ZWQgaW50ZXJ2YWw6IFwiICsgaW50ZXJ2YWwpO1xuICAgICAgc2NhbGUubmljZShpbnRlcnZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjYWxlLm5pY2UoKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZGF0YVJlZih3aGljaCwgZGVmLCBzY2FsZSwgZ3JvdXApIHtcbiAgaWYgKGRsLmlzQXJyYXkoZGVmKSkgcmV0dXJuIGRlZi5tYXAoc2lnbmFsLmJpbmQodGhpcykpO1xuXG4gIHZhciBzZWxmID0gdGhpcywgZ3JhcGggPSB0aGlzLl9ncmFwaCxcbiAgICAgIHJlZnMgPSBkZWYuZmllbGRzIHx8IGRsLmFycmF5KGRlZiksXG4gICAgICB1bmlxdWVzID0gc2NhbGUudHlwZSA9PT0gQy5PUkRJTkFMIHx8IHNjYWxlLnR5cGUgPT09IEMuUVVBTlRJTEUsXG4gICAgICBjayA9IFwiX1wiK3doaWNoLFxuICAgICAgY2FjaGUgPSBzY2FsZVtja10sXG4gICAgICBjYWNoZUZpZWxkID0ge29wczogW119LCAgLy8gdGhlIGZpZWxkIGFuZCBtZWFzdXJlcyBpbiB0aGUgYWdncmVnYXRvclxuICAgICAgc29ydCA9IGRlZi5zb3J0LFxuICAgICAgaSwgcmxlbiwgaiwgZmxlbiwgciwgZmllbGRzLCBmcm9tLCBkYXRhLCBrZXlzO1xuXG4gIGlmKCFjYWNoZSkge1xuICAgIGNhY2hlID0gc2NhbGVbY2tdID0gbmV3IEFnZ3JlZ2F0ZShncmFwaCk7XG4gICAgY2FjaGVGaWVsZC5vcHMgPSBbXTtcbiAgICBjYWNoZS5zaW5nbGV0b24odHJ1ZSk7XG4gICAgaWYodW5pcXVlcyAmJiBzb3J0KSBjYWNoZUZpZWxkLm9wcy5wdXNoKHNvcnQuc3RhdCk7XG4gIH1cblxuICBmb3IoaT0wLCBybGVuPXJlZnMubGVuZ3RoOyBpPHJsZW47ICsraSkge1xuICAgIHIgPSByZWZzW2ldO1xuICAgIGZyb20gPSByLmRhdGEgfHwgXCJ2Z19cIitncm91cC5kYXR1bS5faWQ7XG4gICAgZGF0YSA9IGdyYXBoLmRhdGEoZnJvbSlcbiAgICAgIC5yZXZpc2VzKHRydWUpXG4gICAgICAubGFzdCgpO1xuXG4gICAgaWYgKGRhdGEuc3RhbXAgPD0gdGhpcy5fc3RhbXApIGNvbnRpbnVlO1xuXG4gICAgZmllbGRzID0gZGwuYXJyYXkoci5maWVsZCkubWFwKGZ1bmN0aW9uKGYpIHtcbiAgICAgIGlmIChmLnBhcmVudCkgcmV0dXJuIGRsLmFjY2Vzc29yKGYucGFyZW50KShncm91cC5kYXR1bSlcbiAgICAgIHJldHVybiBmOyAvLyBTdHJpbmcgb3Ige1wic2lnbmFsXCJ9XG4gICAgfSk7XG5cbiAgICBpZih1bmlxdWVzKSB7XG4gICAgICBjYWNoZUZpZWxkLm5hbWUgPSBzb3J0ID8gc29ydC5maWVsZCA6IFwiX2lkXCI7XG4gICAgICBjYWNoZS5maWVsZHMuc2V0KGNhY2hlLCBbY2FjaGVGaWVsZF0pO1xuICAgICAgZm9yKGo9MCwgZmxlbj1maWVsZHMubGVuZ3RoOyBqPGZsZW47ICsraikge1xuICAgICAgICBjYWNoZS5ncm91cF9ieS5zZXQoY2FjaGUsIGZpZWxkc1tqXSlcbiAgICAgICAgICAuZXZhbHVhdGUoZGF0YSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvcihqPTAsIGZsZW49ZmllbGRzLmxlbmd0aDsgajxmbGVuOyArK2opIHtcbiAgICAgICAgY2FjaGVGaWVsZC5uYW1lID0gZmllbGRzW2pdO1xuICAgICAgICBjYWNoZUZpZWxkLm9wcyAgPSBbQy5NSU4sIEMuTUFYXTtcbiAgICAgICAgY2FjaGUuZmllbGRzLnNldChjYWNoZSwgW2NhY2hlRmllbGRdKSAvLyBUcmVhdCBhcyBmbGF0IGRhdGFzb3VyY2VcbiAgICAgICAgICAuZXZhbHVhdGUoZGF0YSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5kZXBlbmRlbmN5KEMuREFUQSwgZnJvbSk7XG4gICAgY2FjaGUuZGVwZW5kZW5jeShDLlNJR05BTFMpLmZvckVhY2goZnVuY3Rpb24ocykgeyBzZWxmLmRlcGVuZGVuY3koQy5TSUdOQUxTLCBzKSB9KTtcbiAgfVxuXG4gIGRhdGEgPSBjYWNoZS5kYXRhKCk7XG4gIGlmICh1bmlxdWVzKSB7XG4gICAga2V5cyA9IGRsLmtleXMoZGF0YSlcbiAgICAgIC5maWx0ZXIoZnVuY3Rpb24oaykgeyByZXR1cm4gZGF0YVtrXSAhPSBudWxsOyB9KTtcblxuICAgIGlmIChzb3J0KSB7XG4gICAgICBzb3J0ID0gc29ydC5vcmRlci5zaWduYWwgPyBncmFwaC5zaWduYWxSZWYoc29ydC5vcmRlci5zaWduYWwpIDogc29ydC5vcmRlcjtcbiAgICAgIHNvcnQgPSAoc29ydCA9PSBDLkRFU0MgPyBcIi1cIiA6IFwiK1wiKSArIFwidHBsLlwiICsgY2FjaGVGaWVsZC5uYW1lO1xuICAgICAgc29ydCA9IGRsLmNvbXBhcmF0b3Ioc29ydCk7XG4gICAgICBrZXlzID0ga2V5cy5tYXAoZnVuY3Rpb24oaykgeyByZXR1cm4geyBrZXk6IGssIHRwbDogZGF0YVtrXS50cGwgfX0pXG4gICAgICAgIC5zb3J0KHNvcnQpXG4gICAgICAgIC5tYXAoZnVuY3Rpb24oaykgeyByZXR1cm4gay5rZXk7IH0pO1xuICAgIC8vIH0gZWxzZSB7ICAvLyBcIkZpcnN0IHNlZW5cIiBvcmRlclxuICAgIC8vICAgc29ydCA9IGRsLmNvbXBhcmF0b3IoXCJ0cGwuX2lkXCIpO1xuICAgIH1cblxuICAgIHJldHVybiBrZXlzO1xuICB9IGVsc2Uge1xuICAgIGRhdGEgPSBkYXRhW1wiXCJdOyAvLyBVbnBhY2sgZmxhdCBhZ2dyZWdhdGlvblxuICAgIHJldHVybiAoZGF0YSA9PT0gbnVsbCkgPyBbXSA6IFtkYXRhW0MuU0lOR0xFVE9OXS5taW4sIGRhdGFbQy5TSU5HTEVUT05dLm1heF07XG4gIH1cbn1cblxuZnVuY3Rpb24gc2lnbmFsKHYpIHtcbiAgdmFyIHMgPSB2LnNpZ25hbCwgcmVmO1xuICBpZiAoIXMpIHJldHVybiB2O1xuICB0aGlzLmRlcGVuZGVuY3koQy5TSUdOQUxTLCAocmVmID0gZGwuZmllbGQocykpWzBdKTtcbiAgcmV0dXJuIHRoaXMuX2dyYXBoLnNpZ25hbFJlZihyZWYpO1xufVxuXG5mdW5jdGlvbiBkb21haW5NaW5NYXgoc2NhbGUsIGdyb3VwKSB7XG4gIHZhciBkZWYgPSB0aGlzLl9kZWYsXG4gICAgICBkb21haW4gPSBbbnVsbCwgbnVsbF0sIHJlZnMsIHo7XG5cbiAgaWYgKGRlZi5kb21haW4gIT09IHVuZGVmaW5lZCkge1xuICAgIGRvbWFpbiA9ICghZGwuaXNPYmplY3QoZGVmLmRvbWFpbikpID8gZG9tYWluIDpcbiAgICAgIGRhdGFSZWYuY2FsbCh0aGlzLCBDLkRPTUFJTiwgZGVmLmRvbWFpbiwgc2NhbGUsIGdyb3VwKTtcbiAgfVxuXG4gIHogPSBkb21haW4ubGVuZ3RoIC0gMTtcbiAgaWYgKGRlZi5kb21haW5NaW4gIT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChkbC5pc09iamVjdChkZWYuZG9tYWluTWluKSkge1xuICAgICAgaWYgKGRlZi5kb21haW5NaW4uc2lnbmFsKSB7XG4gICAgICAgIGRvbWFpblswXSA9IHNpZ25hbC5jYWxsKHRoaXMsIGRlZi5kb21haW5NaW4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9tYWluWzBdID0gZGF0YVJlZi5jYWxsKHRoaXMsIEMuRE9NQUlOK0MuTUlOLCBkZWYuZG9tYWluTWluLCBzY2FsZSwgZ3JvdXApWzBdO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBkb21haW5bMF0gPSBkZWYuZG9tYWluTWluO1xuICAgIH1cbiAgfVxuICBpZiAoZGVmLmRvbWFpbk1heCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGRsLmlzT2JqZWN0KGRlZi5kb21haW5NYXgpKSB7XG4gICAgICBpZiAoZGVmLmRvbWFpbk1heC5zaWduYWwpIHtcbiAgICAgICAgZG9tYWluW3pdID0gc2lnbmFsLmNhbGwodGhpcywgZGVmLmRvbWFpbk1heCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb21haW5bel0gPSBkYXRhUmVmLmNhbGwodGhpcywgQy5ET01BSU4rQy5NQVgsIGRlZi5kb21haW5NYXgsIHNjYWxlLCBncm91cClbMV07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvbWFpblt6XSA9IGRlZi5kb21haW5NYXg7XG4gICAgfVxuICB9XG4gIGlmIChkZWYudHlwZSAhPT0gQy5MT0cgJiYgZGVmLnR5cGUgIT09IEMuVElNRSAmJiAoZGVmLnplcm8gfHwgZGVmLnplcm89PT11bmRlZmluZWQpKSB7XG4gICAgZG9tYWluWzBdID0gTWF0aC5taW4oMCwgZG9tYWluWzBdKTtcbiAgICBkb21haW5bel0gPSBNYXRoLm1heCgwLCBkb21haW5bel0pO1xuICB9XG4gIHJldHVybiBkb21haW47XG59XG5cbmZ1bmN0aW9uIHJhbmdlKGdyb3VwKSB7XG4gIHZhciBkZWYgPSB0aGlzLl9kZWYsXG4gICAgICBybmcgPSBbbnVsbCwgbnVsbF07XG5cbiAgaWYgKGRlZi5yYW5nZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiBkZWYucmFuZ2UgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAoR1JPVVBfUFJPUEVSVFlbZGVmLnJhbmdlXSkge1xuICAgICAgICBybmcgPSBbMCwgZ3JvdXBbZGVmLnJhbmdlXV07XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5yYW5nZVtkZWYucmFuZ2VdKSB7XG4gICAgICAgIHJuZyA9IGNvbmZpZy5yYW5nZVtkZWYucmFuZ2VdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGwuZXJyb3IoXCJVbnJlY29naXplZCByYW5nZTogXCIrZGVmLnJhbmdlKTtcbiAgICAgICAgcmV0dXJuIHJuZztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGRsLmlzQXJyYXkoZGVmLnJhbmdlKSkge1xuICAgICAgcm5nID0gZGVmLnJhbmdlLm1hcChzaWduYWwuYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIGlmIChkbC5pc09iamVjdChkZWYucmFuZ2UpKSB7XG4gICAgICByZXR1cm4gbnVsbDsgLy8gZWFybHkgZXhpdFxuICAgIH0gZWxzZSB7XG4gICAgICBybmcgPSBbMCwgZGVmLnJhbmdlXTtcbiAgICB9XG4gIH1cbiAgaWYgKGRlZi5yYW5nZU1pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcm5nWzBdID0gZGVmLnJhbmdlTWluLnNpZ25hbCA/IHNpZ25hbC5jYWxsKHRoaXMsIGRlZi5yYW5nZU1pbikgOiBkZWYucmFuZ2VNaW47XG4gIH1cbiAgaWYgKGRlZi5yYW5nZU1heCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcm5nW3JuZy5sZW5ndGgtMV0gPSBkZWYucmFuZ2VNYXguc2lnbmFsID8gc2lnbmFsLmNhbGwodGhpcywgZGVmLnJhbmdlTWF4KSA6IGRlZi5yYW5nZU1heDtcbiAgfVxuICBcbiAgaWYgKGRlZi5yZXZlcnNlICE9PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgcmV2ID0gZGVmLnJldmVyc2U7XG4gICAgaWYgKGRsLmlzT2JqZWN0KHJldikpIHtcbiAgICAgIHJldiA9IGRsLmFjY2Vzc29yKHJldi5maWVsZCkoZ3JvdXAuZGF0dW0pO1xuICAgIH1cbiAgICBpZiAocmV2KSBybmcgPSBybmcucmV2ZXJzZSgpO1xuICB9XG4gIFxuICByZXR1cm4gcm5nO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNjYWxlOyIsInZhciB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyksXG4gICAgY2FsY0JvdW5kcyA9IHJlcXVpcmUoJy4uL3V0aWwvYm91bmRzJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIFRyYW5zaXRpb24oZHVyYXRpb24sIGVhc2UpIHtcbiAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uIHx8IDUwMDtcbiAgdGhpcy5lYXNlID0gZWFzZSAmJiBkMy5lYXNlKGVhc2UpIHx8IGQzLmVhc2UoXCJjdWJpYy1pbi1vdXRcIik7XG4gIHRoaXMudXBkYXRlcyA9IHtuZXh0OiBudWxsfTtcbn1cblxudmFyIHByb3RvdHlwZSA9IFRyYW5zaXRpb24ucHJvdG90eXBlO1xuXG52YXIgc2tpcCA9IHtcbiAgXCJ0ZXh0XCI6IDEsXG4gIFwidXJsXCI6ICAxXG59O1xuXG5wcm90b3R5cGUuaW50ZXJwb2xhdGUgPSBmdW5jdGlvbihpdGVtLCB2YWx1ZXMsIHN0YW1wKSB7XG4gIHZhciBrZXksIGN1cnIsIG5leHQsIGludGVycCwgbGlzdCA9IG51bGw7XG5cbiAgZm9yIChrZXkgaW4gdmFsdWVzKSB7XG4gICAgY3VyciA9IGl0ZW1ba2V5XTtcbiAgICBuZXh0ID0gdmFsdWVzW2tleV07ICAgICAgXG4gICAgaWYgKGN1cnIgIT09IG5leHQpIHtcbiAgICAgIGlmIChza2lwW2tleV0gfHwgY3VyciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIHNraXAgaW50ZXJwb2xhdGlvbiBmb3Igc3BlY2lmaWMga2V5cyBvciB1bmRlZmluZWQgc3RhcnQgdmFsdWVzXG4gICAgICAgIHR1cGxlLnNldChpdGVtLCBrZXksIG5leHQpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY3VyciA9PT0gXCJudW1iZXJcIiAmJiAhaXNGaW5pdGUoY3VycikpIHtcbiAgICAgICAgLy8gZm9yIE5hTiBvciBpbmZpbml0ZSBudW1lcmljIHZhbHVlcywgc2tpcCB0byBmaW5hbCB2YWx1ZVxuICAgICAgICB0dXBsZS5zZXQoaXRlbSwga2V5LCBuZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG90aGVyd2lzZSBsb29rdXAgaW50ZXJwb2xhdG9yXG4gICAgICAgIGludGVycCA9IGQzLmludGVycG9sYXRlKGN1cnIsIG5leHQpO1xuICAgICAgICBpbnRlcnAucHJvcGVydHkgPSBrZXk7XG4gICAgICAgIChsaXN0IHx8IChsaXN0PVtdKSkucHVzaChpbnRlcnApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChsaXN0ID09PSBudWxsICYmIGl0ZW0uc3RhdHVzID09PSBDLkVYSVQpIHtcbiAgICBsaXN0ID0gW107IC8vIGVuc3VyZSBleGl0aW5nIGl0ZW1zIGFyZSBpbmNsdWRlZFxuICB9XG5cbiAgaWYgKGxpc3QgIT0gbnVsbCkge1xuICAgIGxpc3QuaXRlbSA9IGl0ZW07XG4gICAgbGlzdC5lYXNlID0gaXRlbS5tYXJrLmVhc2UgfHwgdGhpcy5lYXNlO1xuICAgIGxpc3QubmV4dCA9IHRoaXMudXBkYXRlcy5uZXh0O1xuICAgIHRoaXMudXBkYXRlcy5uZXh0ID0gbGlzdDtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHZhciB0ID0gdGhpcywgcHJldiA9IHQudXBkYXRlcywgY3VyciA9IHByZXYubmV4dDtcbiAgZm9yICg7IGN1cnIhPW51bGw7IHByZXY9Y3VyciwgY3Vycj1wcmV2Lm5leHQpIHtcbiAgICBpZiAoY3Vyci5pdGVtLnN0YXR1cyA9PT0gQy5FWElUKSBjdXJyLnJlbW92ZSA9IHRydWU7XG4gIH1cbiAgdC5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICBkMy50aW1lcihmdW5jdGlvbihlbGFwc2VkKSB7IHJldHVybiBzdGVwLmNhbGwodCwgZWxhcHNlZCk7IH0pO1xufTtcblxuZnVuY3Rpb24gc3RlcChlbGFwc2VkKSB7XG4gIHZhciBsaXN0ID0gdGhpcy51cGRhdGVzLCBwcmV2ID0gbGlzdCwgY3VyciA9IHByZXYubmV4dCxcbiAgICAgIGR1cmF0aW9uID0gdGhpcy5kdXJhdGlvbixcbiAgICAgIGl0ZW0sIGRlbGF5LCBmLCBlLCBpLCBuLCBzdG9wID0gdHJ1ZTtcblxuICBmb3IgKDsgY3VyciE9bnVsbDsgcHJldj1jdXJyLCBjdXJyPXByZXYubmV4dCkge1xuICAgIGl0ZW0gPSBjdXJyLml0ZW07XG4gICAgZGVsYXkgPSBpdGVtLmRlbGF5IHx8IDA7XG5cbiAgICBmID0gKGVsYXBzZWQgLSBkZWxheSkgLyBkdXJhdGlvbjtcbiAgICBpZiAoZiA8IDApIHsgc3RvcCA9IGZhbHNlOyBjb250aW51ZTsgfVxuICAgIGlmIChmID4gMSkgZiA9IDE7XG4gICAgZSA9IGN1cnIuZWFzZShmKTtcblxuICAgIGZvciAoaT0wLCBuPWN1cnIubGVuZ3RoOyBpPG47ICsraSkge1xuICAgICAgaXRlbVtjdXJyW2ldLnByb3BlcnR5XSA9IGN1cnJbaV0oZSk7XG4gICAgfVxuICAgIGl0ZW0udG91Y2goKTtcbiAgICBjYWxjQm91bmRzLml0ZW0oaXRlbSk7XG5cbiAgICBpZiAoZiA9PT0gMSkge1xuICAgICAgaWYgKGN1cnIucmVtb3ZlKSBpdGVtLnJlbW92ZSgpO1xuICAgICAgcHJldi5uZXh0ID0gY3Vyci5uZXh0O1xuICAgICAgY3VyciA9IHByZXY7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0b3AgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICB0aGlzLmNhbGxiYWNrKCk7XG4gIHJldHVybiBzdG9wO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2l0aW9uOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBjb25maWcgPSByZXF1aXJlKCcuLi91dGlsL2NvbmZpZycpLFxuICAgIHRwbCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyksXG4gICAgcGFyc2VNYXJrID0gcmVxdWlyZSgnLi4vcGFyc2UvbWFyaycpO1xuXG5mdW5jdGlvbiBheHMobW9kZWwpIHtcbiAgdmFyIHNjYWxlLFxuICAgICAgb3JpZW50ID0gY29uZmlnLmF4aXMub3JpZW50LFxuICAgICAgb2Zmc2V0ID0gMCxcbiAgICAgIHRpdGxlT2Zmc2V0ID0gY29uZmlnLmF4aXMudGl0bGVPZmZzZXQsXG4gICAgICBheGlzRGVmID0ge30sXG4gICAgICBsYXllciA9IFwiZnJvbnRcIixcbiAgICAgIGdyaWQgPSBmYWxzZSxcbiAgICAgIHRpdGxlID0gbnVsbCxcbiAgICAgIHRpY2tNYWpvclNpemUgPSBjb25maWcuYXhpcy50aWNrU2l6ZSxcbiAgICAgIHRpY2tNaW5vclNpemUgPSBjb25maWcuYXhpcy50aWNrU2l6ZSxcbiAgICAgIHRpY2tFbmRTaXplID0gY29uZmlnLmF4aXMudGlja1NpemUsXG4gICAgICB0aWNrUGFkZGluZyA9IGNvbmZpZy5heGlzLnBhZGRpbmcsXG4gICAgICB0aWNrVmFsdWVzID0gbnVsbCxcbiAgICAgIHRpY2tGb3JtYXRTdHJpbmcgPSBudWxsLFxuICAgICAgdGlja0Zvcm1hdCA9IG51bGwsXG4gICAgICB0aWNrU3ViZGl2aWRlID0gMCxcbiAgICAgIHRpY2tBcmd1bWVudHMgPSBbY29uZmlnLmF4aXMudGlja3NdLFxuICAgICAgZ3JpZExpbmVTdHlsZSA9IHt9LFxuICAgICAgdGlja0xhYmVsU3R5bGUgPSB7fSxcbiAgICAgIG1ham9yVGlja1N0eWxlID0ge30sXG4gICAgICBtaW5vclRpY2tTdHlsZSA9IHt9LFxuICAgICAgdGl0bGVTdHlsZSA9IHt9LFxuICAgICAgZG9tYWluU3R5bGUgPSB7fSxcbiAgICAgIG0gPSB7IC8vIEF4aXMgbWFya3MgYXMgcmVmZXJlbmNlcyBmb3IgdXBkYXRlc1xuICAgICAgICBncmlkTGluZXM6IG51bGwsXG4gICAgICAgIG1ham9yVGlja3M6IG51bGwsXG4gICAgICAgIG1pbm9yVGlja3M6IG51bGwsXG4gICAgICAgIHRpY2tMYWJlbHM6IG51bGwsXG4gICAgICAgIGRvbWFpbjogbnVsbCxcbiAgICAgICAgdGl0bGU6IG51bGxcbiAgICAgIH07XG5cbiAgdmFyIGF4aXMgPSB7fTtcblxuICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICBheGlzRGVmLnR5cGUgPSBudWxsO1xuICB9O1xuXG4gIGF4aXMuZGVmID0gZnVuY3Rpb24oKSB7XG4gICAgaWYoIWF4aXNEZWYudHlwZSkgYXhpc19kZWYoc2NhbGUpO1xuXG4gICAgLy8gdGljayBmb3JtYXRcbiAgICB0aWNrRm9ybWF0ID0gIXRpY2tGb3JtYXRTdHJpbmcgPyBudWxsIDogKChzY2FsZS50eXBlID09PSAndGltZScpXG4gICAgICA/IGQzLnRpbWUuZm9ybWF0KHRpY2tGb3JtYXRTdHJpbmcpXG4gICAgICA6IGQzLmZvcm1hdCh0aWNrRm9ybWF0U3RyaW5nKSk7XG5cbiAgICAvLyBnZW5lcmF0ZSBkYXRhXG4gICAgLy8gV2UgZG9uJ3QgX3JlYWxseV8gbmVlZCB0byBtb2RlbCB0aGVzZSBhcyB0dXBsZXMgYXMgbm8gZnVydGhlclxuICAgIC8vIGRhdGEgdHJhbnNmb3JtYXRpb24gaXMgZG9uZS4gU28gd2Ugb3B0aW1pemUgZm9yIGEgaGlnaCBjaHVybiByYXRlLiBcbiAgICB2YXIgaW5qZXN0ID0gZnVuY3Rpb24oZCkgeyByZXR1cm4ge2RhdGE6IGR9OyB9O1xuICAgIHZhciBtYWpvciA9IHRpY2tWYWx1ZXMgPT0gbnVsbFxuICAgICAgPyAoc2NhbGUudGlja3MgPyBzY2FsZS50aWNrcy5hcHBseShzY2FsZSwgdGlja0FyZ3VtZW50cykgOiBzY2FsZS5kb21haW4oKSlcbiAgICAgIDogdGlja1ZhbHVlcztcbiAgICB2YXIgbWlub3IgPSB2Z19heGlzU3ViZGl2aWRlKHNjYWxlLCBtYWpvciwgdGlja1N1YmRpdmlkZSkubWFwKGluamVzdCk7XG4gICAgbWFqb3IgPSBtYWpvci5tYXAoaW5qZXN0KTtcbiAgICB2YXIgZm10ID0gdGlja0Zvcm1hdD09bnVsbCA/IChzY2FsZS50aWNrRm9ybWF0ID8gc2NhbGUudGlja0Zvcm1hdC5hcHBseShzY2FsZSwgdGlja0FyZ3VtZW50cykgOiBTdHJpbmcpIDogdGlja0Zvcm1hdDtcbiAgICBtYWpvci5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgZC5sYWJlbCA9IGZtdChkLmRhdGEpOyB9KTtcbiAgICB2YXIgdGRhdGEgPSB0aXRsZSA/IFt0aXRsZV0ubWFwKGluamVzdCkgOiBbXTtcblxuICAgIGF4aXNEZWYubWFya3NbMF0uZnJvbSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gZ3JpZCA/IG1ham9yIDogW107IH07XG4gICAgYXhpc0RlZi5tYXJrc1sxXS5mcm9tID0gZnVuY3Rpb24oKSB7IHJldHVybiBtYWpvcjsgfTtcbiAgICBheGlzRGVmLm1hcmtzWzJdLmZyb20gPSBmdW5jdGlvbigpIHsgcmV0dXJuIG1pbm9yOyB9O1xuICAgIGF4aXNEZWYubWFya3NbM10uZnJvbSA9IGF4aXNEZWYubWFya3NbMV0uZnJvbTtcbiAgICBheGlzRGVmLm1hcmtzWzRdLmZyb20gPSBmdW5jdGlvbigpIHsgcmV0dXJuIFsxXTsgfTtcbiAgICBheGlzRGVmLm1hcmtzWzVdLmZyb20gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRkYXRhOyB9O1xuICAgIGF4aXNEZWYub2Zmc2V0ID0gb2Zmc2V0O1xuICAgIGF4aXNEZWYub3JpZW50ID0gb3JpZW50O1xuICAgIGF4aXNEZWYubGF5ZXIgPSBsYXllcjtcbiAgICByZXR1cm4gYXhpc0RlZjtcbiAgfTtcblxuICBmdW5jdGlvbiBheGlzX2RlZihzY2FsZSkge1xuICAgIC8vIHNldHVwIHNjYWxlIG1hcHBpbmdcbiAgICB2YXIgbmV3U2NhbGUsIG9sZFNjYWxlLCByYW5nZTtcbiAgICBpZiAoc2NhbGUudHlwZSA9PT0gXCJvcmRpbmFsXCIpIHtcbiAgICAgIG5ld1NjYWxlID0ge3NjYWxlOiBzY2FsZS5zY2FsZU5hbWUsIG9mZnNldDogMC41ICsgc2NhbGUucmFuZ2VCYW5kKCkvMn07XG4gICAgICBvbGRTY2FsZSA9IG5ld1NjYWxlO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdTY2FsZSA9IHtzY2FsZTogc2NhbGUuc2NhbGVOYW1lLCBvZmZzZXQ6IDAuNX07XG4gICAgICBvbGRTY2FsZSA9IHtzY2FsZTogc2NhbGUuc2NhbGVOYW1lK1wiOnByZXZcIiwgb2Zmc2V0OiAwLjV9O1xuICAgIH1cbiAgICByYW5nZSA9IHZnX2F4aXNTY2FsZVJhbmdlKHNjYWxlKTtcblxuICAgIC8vIHNldHVwIGF4aXMgbWFya3NcbiAgICBpZiAoIW0uZ3JpZExpbmVzKSAgbS5ncmlkTGluZXMgID0gdmdfYXhpc1RpY2tzKCk7XG4gICAgaWYgKCFtLm1ham9yVGlja3MpIG0ubWFqb3JUaWNrcyA9IHZnX2F4aXNUaWNrcygpO1xuICAgIGlmICghbS5taW5vclRpY2tzKSBtLm1pbm9yVGlja3MgPSB2Z19heGlzVGlja3MoKTtcbiAgICBpZiAoIW0udGlja0xhYmVscykgbS50aWNrTGFiZWxzID0gdmdfYXhpc1RpY2tMYWJlbHMoKTtcbiAgICBpZiAoIW0uZG9tYWluKSBtLmRvbWFpbiA9IHZnX2F4aXNEb21haW4oKTtcbiAgICBpZiAoIW0udGl0bGUpICBtLnRpdGxlICA9IHZnX2F4aXNUaXRsZSgpO1xuICAgIG0uZ3JpZExpbmVzLnByb3BlcnRpZXMuZW50ZXIuc3Ryb2tlID0ge3ZhbHVlOiBjb25maWcuYXhpcy5ncmlkQ29sb3J9O1xuXG4gICAgLy8gZXh0ZW5kIGF4aXMgbWFya3MgYmFzZWQgb24gYXhpcyBvcmllbnRhdGlvblxuICAgIHZnX2F4aXNUaWNrc0V4dGVuZChvcmllbnQsIG0uZ3JpZExpbmVzLCBvbGRTY2FsZSwgbmV3U2NhbGUsIEluZmluaXR5KTtcbiAgICB2Z19heGlzVGlja3NFeHRlbmQob3JpZW50LCBtLm1ham9yVGlja3MsIG9sZFNjYWxlLCBuZXdTY2FsZSwgdGlja01ham9yU2l6ZSk7XG4gICAgdmdfYXhpc1RpY2tzRXh0ZW5kKG9yaWVudCwgbS5taW5vclRpY2tzLCBvbGRTY2FsZSwgbmV3U2NhbGUsIHRpY2tNaW5vclNpemUpO1xuICAgIHZnX2F4aXNMYWJlbEV4dGVuZChvcmllbnQsIG0udGlja0xhYmVscywgb2xkU2NhbGUsIG5ld1NjYWxlLCB0aWNrTWFqb3JTaXplLCB0aWNrUGFkZGluZyk7XG5cbiAgICB2Z19heGlzRG9tYWluRXh0ZW5kKG9yaWVudCwgbS5kb21haW4sIHJhbmdlLCB0aWNrRW5kU2l6ZSk7XG4gICAgdmdfYXhpc1RpdGxlRXh0ZW5kKG9yaWVudCwgbS50aXRsZSwgcmFuZ2UsIHRpdGxlT2Zmc2V0KTsgLy8gVE9ETyBnZXQgb2Zmc2V0XG4gICAgXG4gICAgLy8gYWRkIC8gb3ZlcnJpZGUgY3VzdG9tIHN0eWxlIHByb3BlcnRpZXNcbiAgICBkbC5leHRlbmQobS5ncmlkTGluZXMucHJvcGVydGllcy51cGRhdGUsIGdyaWRMaW5lU3R5bGUpO1xuICAgIGRsLmV4dGVuZChtLm1ham9yVGlja3MucHJvcGVydGllcy51cGRhdGUsIG1ham9yVGlja1N0eWxlKTtcbiAgICBkbC5leHRlbmQobS5taW5vclRpY2tzLnByb3BlcnRpZXMudXBkYXRlLCBtaW5vclRpY2tTdHlsZSk7XG4gICAgZGwuZXh0ZW5kKG0udGlja0xhYmVscy5wcm9wZXJ0aWVzLnVwZGF0ZSwgdGlja0xhYmVsU3R5bGUpO1xuICAgIGRsLmV4dGVuZChtLmRvbWFpbi5wcm9wZXJ0aWVzLnVwZGF0ZSwgZG9tYWluU3R5bGUpO1xuICAgIGRsLmV4dGVuZChtLnRpdGxlLnByb3BlcnRpZXMudXBkYXRlLCB0aXRsZVN0eWxlKTtcblxuICAgIHZhciBtYXJrcyA9IFttLmdyaWRMaW5lcywgbS5tYWpvclRpY2tzLCBtLm1pbm9yVGlja3MsIG0udGlja0xhYmVscywgbS5kb21haW4sIG0udGl0bGVdO1xuICAgIGRsLmV4dGVuZChheGlzRGVmLCB7XG4gICAgICB0eXBlOiBcImdyb3VwXCIsXG4gICAgICBpbnRlcmFjdGl2ZTogZmFsc2UsXG4gICAgICBwcm9wZXJ0aWVzOiB7IFxuICAgICAgICBlbnRlcjoge1xuICAgICAgICAgIGVuY29kZTogdmdfYXhpc1VwZGF0ZSxcbiAgICAgICAgICBzY2FsZXM6IFtzY2FsZS5zY2FsZU5hbWVdLFxuICAgICAgICAgIHNpZ25hbHM6IFtdLCBkYXRhOiBbXVxuICAgICAgICB9LFxuICAgICAgICB1cGRhdGU6IHtcbiAgICAgICAgICBlbmNvZGU6IHZnX2F4aXNVcGRhdGUsXG4gICAgICAgICAgc2NhbGVzOiBbc2NhbGUuc2NhbGVOYW1lXSxcbiAgICAgICAgICBzaWduYWxzOiBbXSwgZGF0YTogW11cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXhpc0RlZi5tYXJrcyA9IG1hcmtzLm1hcChmdW5jdGlvbihtKSB7IHJldHVybiBwYXJzZU1hcmsobW9kZWwsIG0pOyB9KTtcbiAgfTtcblxuICBheGlzLnNjYWxlID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHNjYWxlO1xuICAgIGlmIChzY2FsZSAhPT0geCkgeyBzY2FsZSA9IHg7IHJlc2V0KCk7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLm9yaWVudCA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBvcmllbnQ7XG4gICAgaWYgKG9yaWVudCAhPT0geCkge1xuICAgICAgb3JpZW50ID0geCBpbiB2Z19heGlzT3JpZW50cyA/IHggKyBcIlwiIDogY29uZmlnLmF4aXMub3JpZW50O1xuICAgICAgcmVzZXQoKTtcbiAgICB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy50aXRsZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aXRsZTtcbiAgICBpZiAodGl0bGUgIT09IHgpIHsgdGl0bGUgPSB4OyByZXNldCgpOyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRpY2tBcmd1bWVudHM7XG4gICAgdGlja0FyZ3VtZW50cyA9IGFyZ3VtZW50cztcbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLnRpY2tWYWx1ZXMgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja1ZhbHVlcztcbiAgICB0aWNrVmFsdWVzID0geDtcbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLnRpY2tGb3JtYXQgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja0Zvcm1hdFN0cmluZztcbiAgICBpZiAodGlja0Zvcm1hdFN0cmluZyAhPT0geCkge1xuICAgICAgdGlja0Zvcm1hdFN0cmluZyA9IHg7XG4gICAgICByZXNldCgpO1xuICAgIH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcbiAgXG4gIGF4aXMudGlja1NpemUgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja01ham9yU2l6ZTtcbiAgICB2YXIgbiA9IGFyZ3VtZW50cy5sZW5ndGggLSAxLFxuICAgICAgICBtYWpvciA9ICt4LFxuICAgICAgICBtaW5vciA9IG4gPiAxID8gK3kgOiB0aWNrTWFqb3JTaXplLFxuICAgICAgICBlbmQgICA9IG4gPiAwID8gK2FyZ3VtZW50c1tuXSA6IHRpY2tNYWpvclNpemU7XG5cbiAgICBpZiAodGlja01ham9yU2l6ZSAhPT0gbWFqb3IgfHxcbiAgICAgICAgdGlja01pbm9yU2l6ZSAhPT0gbWlub3IgfHxcbiAgICAgICAgdGlja0VuZFNpemUgIT09IGVuZCkge1xuICAgICAgcmVzZXQoKTtcbiAgICB9XG5cbiAgICB0aWNrTWFqb3JTaXplID0gbWFqb3I7XG4gICAgdGlja01pbm9yU2l6ZSA9IG1pbm9yO1xuICAgIHRpY2tFbmRTaXplID0gZW5kO1xuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMudGlja1N1YmRpdmlkZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aWNrU3ViZGl2aWRlO1xuICAgIHRpY2tTdWJkaXZpZGUgPSAreDtcbiAgICByZXR1cm4gYXhpcztcbiAgfTtcbiAgXG4gIGF4aXMub2Zmc2V0ID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIG9mZnNldDtcbiAgICBvZmZzZXQgPSBkbC5pc09iamVjdCh4KSA/IHggOiAreDtcbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLnRpY2tQYWRkaW5nID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRpY2tQYWRkaW5nO1xuICAgIGlmICh0aWNrUGFkZGluZyAhPT0gK3gpIHsgdGlja1BhZGRpbmcgPSAreDsgcmVzZXQoKTsgfVxuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMudGl0bGVPZmZzZXQgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGl0bGVPZmZzZXQ7XG4gICAgaWYgKHRpdGxlT2Zmc2V0ICE9PSAreCkgeyB0aXRsZU9mZnNldCA9ICt4OyByZXNldCgpOyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy5sYXllciA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBsYXllcjtcbiAgICBpZiAobGF5ZXIgIT09IHgpIHsgbGF5ZXIgPSB4OyByZXNldCgpOyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy5ncmlkID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGdyaWQ7XG4gICAgaWYgKGdyaWQgIT09IHgpIHsgZ3JpZCA9IHg7IHJlc2V0KCk7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLmdyaWRMaW5lUHJvcGVydGllcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBncmlkTGluZVN0eWxlO1xuICAgIGlmIChncmlkTGluZVN0eWxlICE9PSB4KSB7IGdyaWRMaW5lU3R5bGUgPSB4OyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy5tYWpvclRpY2tQcm9wZXJ0aWVzID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIG1ham9yVGlja1N0eWxlO1xuICAgIGlmIChtYWpvclRpY2tTdHlsZSAhPT0geCkgeyBtYWpvclRpY2tTdHlsZSA9IHg7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLm1pbm9yVGlja1Byb3BlcnRpZXMgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gbWlub3JUaWNrU3R5bGU7XG4gICAgaWYgKG1pbm9yVGlja1N0eWxlICE9PSB4KSB7IG1pbm9yVGlja1N0eWxlID0geDsgfVxuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMudGlja0xhYmVsUHJvcGVydGllcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aWNrTGFiZWxTdHlsZTtcbiAgICBpZiAodGlja0xhYmVsU3R5bGUgIT09IHgpIHsgdGlja0xhYmVsU3R5bGUgPSB4OyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy50aXRsZVByb3BlcnRpZXMgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGl0bGVTdHlsZTtcbiAgICBpZiAodGl0bGVTdHlsZSAhPT0geCkgeyB0aXRsZVN0eWxlID0geDsgfVxuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMuZG9tYWluUHJvcGVydGllcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBkb21haW5TdHlsZTtcbiAgICBpZiAoZG9tYWluU3R5bGUgIT09IHgpIHsgZG9tYWluU3R5bGUgPSB4OyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG4gIFxuICBheGlzLnJlc2V0ID0gZnVuY3Rpb24oKSB7IHJlc2V0KCk7IH07XG5cbiAgcmV0dXJuIGF4aXM7XG59O1xuXG52YXIgdmdfYXhpc09yaWVudHMgPSB7dG9wOiAxLCByaWdodDogMSwgYm90dG9tOiAxLCBsZWZ0OiAxfTtcblxuZnVuY3Rpb24gdmdfYXhpc1N1YmRpdmlkZShzY2FsZSwgdGlja3MsIG0pIHtcbiAgc3VidGlja3MgPSBbXTtcbiAgaWYgKG0gJiYgdGlja3MubGVuZ3RoID4gMSkge1xuICAgIHZhciBleHRlbnQgPSB2Z19heGlzU2NhbGVFeHRlbnQoc2NhbGUuZG9tYWluKCkpLFxuICAgICAgICBzdWJ0aWNrcyxcbiAgICAgICAgaSA9IC0xLFxuICAgICAgICBuID0gdGlja3MubGVuZ3RoLFxuICAgICAgICBkID0gKHRpY2tzWzFdIC0gdGlja3NbMF0pIC8gKyttLFxuICAgICAgICBqLFxuICAgICAgICB2O1xuICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICBmb3IgKGogPSBtOyAtLWogPiAwOykge1xuICAgICAgICBpZiAoKHYgPSArdGlja3NbaV0gLSBqICogZCkgPj0gZXh0ZW50WzBdKSB7XG4gICAgICAgICAgc3VidGlja3MucHVzaCh2KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKC0taSwgaiA9IDA7ICsraiA8IG0gJiYgKHYgPSArdGlja3NbaV0gKyBqICogZCkgPCBleHRlbnRbMV07KSB7XG4gICAgICBzdWJ0aWNrcy5wdXNoKHYpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3VidGlja3M7XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNTY2FsZUV4dGVudChkb21haW4pIHtcbiAgdmFyIHN0YXJ0ID0gZG9tYWluWzBdLCBzdG9wID0gZG9tYWluW2RvbWFpbi5sZW5ndGggLSAxXTtcbiAgcmV0dXJuIHN0YXJ0IDwgc3RvcCA/IFtzdGFydCwgc3RvcF0gOiBbc3RvcCwgc3RhcnRdO1xufVxuXG5mdW5jdGlvbiB2Z19heGlzU2NhbGVSYW5nZShzY2FsZSkge1xuICByZXR1cm4gc2NhbGUucmFuZ2VFeHRlbnRcbiAgICA/IHNjYWxlLnJhbmdlRXh0ZW50KClcbiAgICA6IHZnX2F4aXNTY2FsZUV4dGVudChzY2FsZS5yYW5nZSgpKTtcbn1cblxudmFyIHZnX2F4aXNBbGlnbiA9IHtcbiAgYm90dG9tOiBcImNlbnRlclwiLFxuICB0b3A6IFwiY2VudGVyXCIsXG4gIGxlZnQ6IFwicmlnaHRcIixcbiAgcmlnaHQ6IFwibGVmdFwiXG59O1xuXG52YXIgdmdfYXhpc0Jhc2VsaW5lID0ge1xuICBib3R0b206IFwidG9wXCIsXG4gIHRvcDogXCJib3R0b21cIixcbiAgbGVmdDogXCJtaWRkbGVcIixcbiAgcmlnaHQ6IFwibWlkZGxlXCJcbn07XG5cbmZ1bmN0aW9uIHZnX2F4aXNMYWJlbEV4dGVuZChvcmllbnQsIGxhYmVscywgb2xkU2NhbGUsIG5ld1NjYWxlLCBzaXplLCBwYWQpIHtcbiAgc2l6ZSA9IE1hdGgubWF4KHNpemUsIDApICsgcGFkO1xuICBpZiAob3JpZW50ID09PSBcImxlZnRcIiB8fCBvcmllbnQgPT09IFwidG9wXCIpIHtcbiAgICBzaXplICo9IC0xO1xuICB9ICBcbiAgaWYgKG9yaWVudCA9PT0gXCJ0b3BcIiB8fCBvcmllbnQgPT09IFwiYm90dG9tXCIpIHtcbiAgICBkbC5leHRlbmQobGFiZWxzLnByb3BlcnRpZXMuZW50ZXIsIHtcbiAgICAgIHg6IG9sZFNjYWxlLFxuICAgICAgeToge3ZhbHVlOiBzaXplfSxcbiAgICB9KTtcbiAgICBkbC5leHRlbmQobGFiZWxzLnByb3BlcnRpZXMudXBkYXRlLCB7XG4gICAgICB4OiBuZXdTY2FsZSxcbiAgICAgIHk6IHt2YWx1ZTogc2l6ZX0sXG4gICAgICBhbGlnbjoge3ZhbHVlOiBcImNlbnRlclwifSxcbiAgICAgIGJhc2VsaW5lOiB7dmFsdWU6IHZnX2F4aXNCYXNlbGluZVtvcmllbnRdfVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGRsLmV4dGVuZChsYWJlbHMucHJvcGVydGllcy5lbnRlciwge1xuICAgICAgeDoge3ZhbHVlOiBzaXplfSxcbiAgICAgIHk6IG9sZFNjYWxlLFxuICAgIH0pO1xuICAgIGRsLmV4dGVuZChsYWJlbHMucHJvcGVydGllcy51cGRhdGUsIHtcbiAgICAgIHg6IHt2YWx1ZTogc2l6ZX0sXG4gICAgICB5OiBuZXdTY2FsZSxcbiAgICAgIGFsaWduOiB7dmFsdWU6IHZnX2F4aXNBbGlnbltvcmllbnRdfSxcbiAgICAgIGJhc2VsaW5lOiB7dmFsdWU6IFwibWlkZGxlXCJ9XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmdfYXhpc1RpY2tzRXh0ZW5kKG9yaWVudCwgdGlja3MsIG9sZFNjYWxlLCBuZXdTY2FsZSwgc2l6ZSkge1xuICB2YXIgc2lnbiA9IChvcmllbnQgPT09IFwibGVmdFwiIHx8IG9yaWVudCA9PT0gXCJ0b3BcIikgPyAtMSA6IDE7XG4gIGlmIChzaXplID09PSBJbmZpbml0eSkge1xuICAgIHNpemUgPSAob3JpZW50ID09PSBcInRvcFwiIHx8IG9yaWVudCA9PT0gXCJib3R0b21cIilcbiAgICAgID8ge2ZpZWxkOiB7Z3JvdXA6IFwiaGVpZ2h0XCIsIGxldmVsOiAyfSwgbXVsdDogLXNpZ259XG4gICAgICA6IHtmaWVsZDoge2dyb3VwOiBcIndpZHRoXCIsICBsZXZlbDogMn0sIG11bHQ6IC1zaWdufTtcbiAgfSBlbHNlIHtcbiAgICBzaXplID0ge3ZhbHVlOiBzaWduICogc2l6ZX07XG4gIH1cbiAgaWYgKG9yaWVudCA9PT0gXCJ0b3BcIiB8fCBvcmllbnQgPT09IFwiYm90dG9tXCIpIHtcbiAgICBkbC5leHRlbmQodGlja3MucHJvcGVydGllcy5lbnRlciwge1xuICAgICAgeDogIG9sZFNjYWxlLFxuICAgICAgeTogIHt2YWx1ZTogMH0sXG4gICAgICB5Mjogc2l6ZVxuICAgIH0pO1xuICAgIGRsLmV4dGVuZCh0aWNrcy5wcm9wZXJ0aWVzLnVwZGF0ZSwge1xuICAgICAgeDogIG5ld1NjYWxlLFxuICAgICAgeTogIHt2YWx1ZTogMH0sXG4gICAgICB5Mjogc2l6ZVxuICAgIH0pO1xuICAgIGRsLmV4dGVuZCh0aWNrcy5wcm9wZXJ0aWVzLmV4aXQsIHtcbiAgICAgIHg6ICBuZXdTY2FsZSxcbiAgICB9KTsgICAgICAgIFxuICB9IGVsc2Uge1xuICAgIGRsLmV4dGVuZCh0aWNrcy5wcm9wZXJ0aWVzLmVudGVyLCB7XG4gICAgICB4OiAge3ZhbHVlOiAwfSxcbiAgICAgIHgyOiBzaXplLFxuICAgICAgeTogIG9sZFNjYWxlXG4gICAgfSk7XG4gICAgZGwuZXh0ZW5kKHRpY2tzLnByb3BlcnRpZXMudXBkYXRlLCB7XG4gICAgICB4OiAge3ZhbHVlOiAwfSxcbiAgICAgIHgyOiBzaXplLFxuICAgICAgeTogIG5ld1NjYWxlXG4gICAgfSk7XG4gICAgZGwuZXh0ZW5kKHRpY2tzLnByb3BlcnRpZXMuZXhpdCwge1xuICAgICAgeTogIG5ld1NjYWxlLFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNUaXRsZUV4dGVuZChvcmllbnQsIHRpdGxlLCByYW5nZSwgb2Zmc2V0KSB7XG4gIHZhciBtaWQgPSB+figocmFuZ2VbMF0gKyByYW5nZVsxXSkgLyAyKSxcbiAgICAgIHNpZ24gPSAob3JpZW50ID09PSBcInRvcFwiIHx8IG9yaWVudCA9PT0gXCJsZWZ0XCIpID8gLTEgOiAxO1xuICBcbiAgaWYgKG9yaWVudCA9PT0gXCJib3R0b21cIiB8fCBvcmllbnQgPT09IFwidG9wXCIpIHtcbiAgICBkbC5leHRlbmQodGl0bGUucHJvcGVydGllcy51cGRhdGUsIHtcbiAgICAgIHg6IHt2YWx1ZTogbWlkfSxcbiAgICAgIHk6IHt2YWx1ZTogc2lnbipvZmZzZXR9LFxuICAgICAgYW5nbGU6IHt2YWx1ZTogMH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBkbC5leHRlbmQodGl0bGUucHJvcGVydGllcy51cGRhdGUsIHtcbiAgICAgIHg6IHt2YWx1ZTogc2lnbipvZmZzZXR9LFxuICAgICAgeToge3ZhbHVlOiBtaWR9LFxuICAgICAgYW5nbGU6IHt2YWx1ZTogLTkwfVxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNEb21haW5FeHRlbmQob3JpZW50LCBkb21haW4sIHJhbmdlLCBzaXplKSB7XG4gIHZhciBwYXRoO1xuICBpZiAob3JpZW50ID09PSBcInRvcFwiIHx8IG9yaWVudCA9PT0gXCJsZWZ0XCIpIHtcbiAgICBzaXplID0gLTEgKiBzaXplO1xuICB9XG4gIGlmIChvcmllbnQgPT09IFwiYm90dG9tXCIgfHwgb3JpZW50ID09PSBcInRvcFwiKSB7XG4gICAgcGF0aCA9IFwiTVwiICsgcmFuZ2VbMF0gKyBcIixcIiArIHNpemUgKyBcIlYwSFwiICsgcmFuZ2VbMV0gKyBcIlZcIiArIHNpemU7XG4gIH0gZWxzZSB7XG4gICAgcGF0aCA9IFwiTVwiICsgc2l6ZSArIFwiLFwiICsgcmFuZ2VbMF0gKyBcIkgwVlwiICsgcmFuZ2VbMV0gKyBcIkhcIiArIHNpemU7XG4gIH1cbiAgZG9tYWluLnByb3BlcnRpZXMudXBkYXRlLnBhdGggPSB7dmFsdWU6IHBhdGh9O1xufVxuXG5mdW5jdGlvbiB2Z19heGlzVXBkYXRlKGl0ZW0sIGdyb3VwLCB0cmFucywgZGIsIHNpZ25hbHMsIHByZWRpY2F0ZXMpIHtcbiAgdmFyIG8gPSB0cmFucyA/IHt9IDogaXRlbSxcbiAgICAgIG9mZnNldCA9IGl0ZW0ubWFyay5kZWYub2Zmc2V0LFxuICAgICAgb3JpZW50ID0gaXRlbS5tYXJrLmRlZi5vcmllbnQsXG4gICAgICB3aWR0aCAgPSBncm91cC53aWR0aCxcbiAgICAgIGhlaWdodCA9IGdyb3VwLmhlaWdodDsgLy8gVE9ETyBmYWxsYmFjayB0byBnbG9iYWwgdyxoP1xuXG4gIGlmIChkbC5pc09iamVjdChvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gLWdyb3VwLnNjYWxlKG9mZnNldC5zY2FsZSkob2Zmc2V0LnZhbHVlKTtcbiAgfVxuXG4gIHN3aXRjaCAob3JpZW50KSB7XG4gICAgY2FzZSBcImxlZnRcIjogICB7IHRwbC5zZXQobywgJ3gnLCAtb2Zmc2V0KTsgdHBsLnNldChvLCAneScsIDApOyBicmVhazsgfVxuICAgIGNhc2UgXCJyaWdodFwiOiAgeyB0cGwuc2V0KG8sICd4Jywgd2lkdGggKyBvZmZzZXQpOyB0cGwuc2V0KG8sICd5JywgMCk7IGJyZWFrOyB9XG4gICAgY2FzZSBcImJvdHRvbVwiOiB7IHRwbC5zZXQobywgJ3gnLCAwKTsgdHBsLnNldChvLCAneScsIGhlaWdodCArIG9mZnNldCk7IGJyZWFrOyB9XG4gICAgY2FzZSBcInRvcFwiOiAgICB7IHRwbC5zZXQobywgJ3gnLCAwKTsgdHBsLnNldChvLCAneScsIC1vZmZzZXQpOyBicmVhazsgfVxuICAgIGRlZmF1bHQ6ICAgICAgIHsgdHBsLnNldChvLCAneCcsIDApOyB0cGwuc2V0KG8sICd5JywgMCk7IH1cbiAgfVxuXG4gIGlmICh0cmFucykgdHJhbnMuaW50ZXJwb2xhdGUoaXRlbSwgbyk7XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNUaWNrcygpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcInJ1bGVcIixcbiAgICBpbnRlcmFjdGl2ZTogZmFsc2UsXG4gICAga2V5OiBcImRhdGFcIixcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBlbnRlcjoge1xuICAgICAgICBzdHJva2U6IHt2YWx1ZTogY29uZmlnLmF4aXMudGlja0NvbG9yfSxcbiAgICAgICAgc3Ryb2tlV2lkdGg6IHt2YWx1ZTogY29uZmlnLmF4aXMudGlja1dpZHRofSxcbiAgICAgICAgb3BhY2l0eToge3ZhbHVlOiAxZS02fVxuICAgICAgfSxcbiAgICAgIGV4aXQ6IHsgb3BhY2l0eToge3ZhbHVlOiAxZS02fSB9LFxuICAgICAgdXBkYXRlOiB7IG9wYWNpdHk6IHt2YWx1ZTogMX0gfVxuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gdmdfYXhpc1RpY2tMYWJlbHMoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgaW50ZXJhY3RpdmU6IHRydWUsXG4gICAga2V5OiBcImRhdGFcIixcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBlbnRlcjoge1xuICAgICAgICBmaWxsOiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpY2tMYWJlbENvbG9yfSxcbiAgICAgICAgZm9udDoge3ZhbHVlOiBjb25maWcuYXhpcy50aWNrTGFiZWxGb250fSxcbiAgICAgICAgZm9udFNpemU6IHt2YWx1ZTogY29uZmlnLmF4aXMudGlja0xhYmVsRm9udFNpemV9LFxuICAgICAgICBvcGFjaXR5OiB7dmFsdWU6IDFlLTZ9LFxuICAgICAgICB0ZXh0OiB7ZmllbGQ6IFwibGFiZWxcIn1cbiAgICAgIH0sXG4gICAgICBleGl0OiB7IG9wYWNpdHk6IHt2YWx1ZTogMWUtNn0gfSxcbiAgICAgIHVwZGF0ZTogeyBvcGFjaXR5OiB7dmFsdWU6IDF9IH1cbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNUaXRsZSgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcInRleHRcIixcbiAgICBpbnRlcmFjdGl2ZTogdHJ1ZSxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBlbnRlcjoge1xuICAgICAgICBmb250OiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpdGxlRm9udH0sXG4gICAgICAgIGZvbnRTaXplOiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpdGxlRm9udFNpemV9LFxuICAgICAgICBmb250V2VpZ2h0OiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpdGxlRm9udFdlaWdodH0sXG4gICAgICAgIGZpbGw6IHt2YWx1ZTogY29uZmlnLmF4aXMudGl0bGVDb2xvcn0sXG4gICAgICAgIGFsaWduOiB7dmFsdWU6IFwiY2VudGVyXCJ9LFxuICAgICAgICBiYXNlbGluZToge3ZhbHVlOiBcIm1pZGRsZVwifSxcbiAgICAgICAgdGV4dDoge2ZpZWxkOiBcImRhdGFcIn1cbiAgICAgIH0sXG4gICAgICB1cGRhdGU6IHt9XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiB2Z19heGlzRG9tYWluKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwicGF0aFwiLFxuICAgIGludGVyYWN0aXZlOiBmYWxzZSxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBlbnRlcjoge1xuICAgICAgICB4OiB7dmFsdWU6IDAuNX0sXG4gICAgICAgIHk6IHt2YWx1ZTogMC41fSxcbiAgICAgICAgc3Ryb2tlOiB7dmFsdWU6IGNvbmZpZy5heGlzLmF4aXNDb2xvcn0sXG4gICAgICAgIHN0cm9rZVdpZHRoOiB7dmFsdWU6IGNvbmZpZy5heGlzLmF4aXNXaWR0aH1cbiAgICAgIH0sXG4gICAgICB1cGRhdGU6IHt9XG4gICAgfVxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGF4czsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICBHcm91cEJ5ID0gcmVxdWlyZSgnLi9Hcm91cEJ5JyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLCBcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9jaGFuZ2VzZXQnKSwgXG4gICAgbWVhcyA9IHJlcXVpcmUoJy4vbWVhc3VyZXMnKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gQWdncmVnYXRlKGdyYXBoKSB7XG4gIEdyb3VwQnkucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICBncm91cF9ieToge3R5cGU6IFwiYXJyYXk8ZmllbGQ+XCJ9XG4gIH0pO1xuXG4gIHRoaXMuX291dHB1dCA9IHtcbiAgICBcImNvdW50XCI6ICAgIFwiY291bnRcIixcbiAgICBcImF2Z1wiOiAgICAgIFwiYXZnXCIsXG4gICAgXCJtaW5cIjogICAgICBcIm1pblwiLFxuICAgIFwibWF4XCI6ICAgICAgXCJtYXhcIixcbiAgICBcInN1bVwiOiAgICAgIFwic3VtXCIsXG4gICAgXCJtZWFuXCI6ICAgICBcIm1lYW5cIixcbiAgICBcInZhclwiOiAgICAgIFwidmFyXCIsXG4gICAgXCJzdGRldlwiOiAgICBcInN0ZGV2XCIsXG4gICAgXCJ2YXJwXCI6ICAgICBcInZhcnBcIixcbiAgICBcInN0ZGV2cFwiOiAgIFwic3RkZXZwXCIsXG4gICAgXCJtZWRpYW5cIjogICBcIm1lZGlhblwiXG4gIH07XG5cbiAgLy8gQWdncmVnYXRvcnMgcGFyYW1ldGVyIGhhbmRsZWQgbWFudWFsbHkuXG4gIHRoaXMuX2ZpZWxkc0RlZiAgID0gbnVsbDtcbiAgdGhpcy5fQWdncmVnYXRvcnMgPSBudWxsO1xuICB0aGlzLl9zaW5nbGV0b24gICA9IGZhbHNlOyAgLy8gSWYgdHJ1ZSwgYWxsIGZpZWxkcyBhZ2dyZWdhdGVkIHdpdGhpbiBhIHNpbmdsZSBtb25vaWRcblxuICByZXR1cm4gdGhpcztcbn1cblxudmFyIHByb3RvID0gKEFnZ3JlZ2F0ZS5wcm90b3R5cGUgPSBuZXcgR3JvdXBCeSgpKTtcblxucHJvdG8uZmllbGRzID0ge1xuICBzZXQ6IGZ1bmN0aW9uKHRyYW5zZm9ybSwgZmllbGRzKSB7XG4gICAgdmFyIGksIGxlbiwgZiwgc2lnbmFscyA9IHt9O1xuICAgIGZvcihpPTAsIGxlbj1maWVsZHMubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgICBmID0gZmllbGRzW2ldO1xuICAgICAgaWYoZi5uYW1lLnNpZ25hbCkgc2lnbmFsc1tmLm5hbWUuc2lnbmFsXSA9IDE7XG4gICAgICBkbC5hcnJheShmLm9wcykuZm9yRWFjaChmdW5jdGlvbihvKXsgaWYoby5zaWduYWwpIHNpZ25hbHNbby5zaWduYWxdID0gMSB9KTtcbiAgICB9XG5cbiAgICB0cmFuc2Zvcm0uX2ZpZWxkc0RlZiA9IGZpZWxkcztcbiAgICB0cmFuc2Zvcm0uX0FnZ3JlZ2F0b3JzID0gbnVsbDtcbiAgICB0cmFuc2Zvcm0uYWdncygpO1xuICAgIHRyYW5zZm9ybS5kZXBlbmRlbmN5KEMuU0lHTkFMUywgZGwua2V5cyhzaWduYWxzKSk7XG4gICAgcmV0dXJuIHRyYW5zZm9ybTtcbiAgfVxufTtcblxucHJvdG8uc2luZ2xldG9uID0gZnVuY3Rpb24oYykge1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3NpbmdsZXRvbjtcbiAgdGhpcy5fc2luZ2xldG9uID0gYztcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5hZ2dzID0gZnVuY3Rpb24oKSB7XG4gIHZhciB0cmFuc2Zvcm0gPSB0aGlzLFxuICAgICAgZ3JhcGggPSB0aGlzLl9ncmFwaCxcbiAgICAgIGZpZWxkcyA9IHRoaXMuX2ZpZWxkc0RlZixcbiAgICAgIGFnZ3MgPSB0aGlzLl9BZ2dyZWdhdG9ycyxcbiAgICAgIGYsIGksIGssIG5hbWUsIG9wcywgbWVhc3VyZXM7XG5cbiAgaWYoYWdncykgcmV0dXJuIGFnZ3M7XG4gIGVsc2UgYWdncyA9IHRoaXMuX0FnZ3JlZ2F0b3JzID0gW107IFxuXG4gIGZvciAoaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcbiAgICBmID0gZmllbGRzW2ldO1xuICAgIGlmIChmLm9wcy5sZW5ndGggPT09IDApIGNvbnRpbnVlO1xuXG4gICAgbmFtZSA9IGYubmFtZS5zaWduYWwgPyBncmFwaC5zaWduYWxSZWYoZi5uYW1lLnNpZ25hbCkgOiBmLm5hbWU7XG4gICAgb3BzICA9IGRsLmFycmF5KGYub3BzLnNpZ25hbCA/IGdyYXBoLnNpZ25hbFJlZihmLm9wcy5zaWduYWwpIDogZi5vcHMpO1xuICAgIG1lYXN1cmVzID0gb3BzLm1hcChmdW5jdGlvbihhKSB7XG4gICAgICBhID0gYS5zaWduYWwgPyBncmFwaC5zaWduYWxSZWYoYS5zaWduYWwpIDogYTtcbiAgICAgIHJldHVybiBtZWFzW2FdKG5hbWUgKyAnXycgKyB0cmFuc2Zvcm0uX291dHB1dFthXSk7XG4gICAgfSk7XG4gICAgYWdncy5wdXNoKHtcbiAgICAgIGFjY2Vzc29yOiBkbC5hY2Nlc3NvcihuYW1lKSxcbiAgICAgIGZpZWxkOiB0aGlzLl9zaW5nbGV0b24gPyBDLlNJTkdMRVRPTiA6IG5hbWUsXG4gICAgICBtZWFzdXJlczogbWVhcy5jcmVhdGUobWVhc3VyZXMpXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gYWdncztcbn07XG5cbnByb3RvLl9yZXNldCA9IGZ1bmN0aW9uKGlucHV0LCBvdXRwdXQpIHtcbiAgdGhpcy5fQWdncmVnYXRvcnMgPSBudWxsOyAvLyByZWJ1aWxkIGFnZ3JlZ2F0b3JzXG4gIHRoaXMuYWdncygpO1xuICByZXR1cm4gR3JvdXBCeS5wcm90b3R5cGUuX3Jlc2V0LmNhbGwodGhpcywgaW5wdXQsIG91dHB1dCk7XG59O1xuXG5wcm90by5fa2V5cyA9IGZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHRoaXMuX2diLmZpZWxkcy5sZW5ndGggPyBcbiAgICBHcm91cEJ5LnByb3RvdHlwZS5fa2V5cy5jYWxsKHRoaXMsIHgpIDoge2tleXM6IFtdLCBrZXk6IFwiXCJ9O1xufTtcblxucHJvdG8uX25ld19jZWxsID0gZnVuY3Rpb24oeCwgaykge1xuICB2YXIgY2VsbCA9IEdyb3VwQnkucHJvdG90eXBlLl9uZXdfY2VsbC5jYWxsKHRoaXMsIHgsIGspLFxuICAgICAgYWdncyA9IHRoaXMuYWdncygpLFxuICAgICAgaSA9IDAsIGxlbiA9IGFnZ3MubGVuZ3RoLCBcbiAgICAgIGFnZztcblxuICBmb3IoOyBpPGxlbjsgaSsrKSB7XG4gICAgYWdnID0gYWdnc1tpXTtcbiAgICBjZWxsW2FnZy5maWVsZF0gPSBuZXcgYWdnLm1lYXN1cmVzKGNlbGwsIGNlbGwudHBsKTtcbiAgfVxuXG4gIHJldHVybiBjZWxsO1xufTtcblxucHJvdG8uX2FkZCA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGMgPSB0aGlzLl9jZWxsKHgpLFxuICAgICAgYWdncyA9IHRoaXMuYWdncygpLFxuICAgICAgaSA9IDAsIGxlbiA9IGFnZ3MubGVuZ3RoLFxuICAgICAgYWdnO1xuXG4gIGMuY250Kys7XG4gIGZvcig7IGk8bGVuOyBpKyspIHtcbiAgICBhZ2cgPSBhZ2dzW2ldO1xuICAgIGNbYWdnLmZpZWxkXS5hZGQoYWdnLmFjY2Vzc29yKHgpKTtcbiAgfVxuICBjLmZsZyB8PSBDLk1PRF9DRUxMO1xufTtcblxucHJvdG8uX3JlbSA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGMgPSB0aGlzLl9jZWxsKHgpLFxuICAgICAgYWdncyA9IHRoaXMuYWdncygpLFxuICAgICAgaSA9IDAsIGxlbiA9IGFnZ3MubGVuZ3RoLFxuICAgICAgYWdnO1xuXG4gIGMuY250LS07XG4gIGZvcig7IGk8bGVuOyBpKyspIHtcbiAgICBhZ2cgPSBhZ2dzW2ldO1xuICAgIGNbYWdnLmZpZWxkXS5yZW0oYWdnLmFjY2Vzc29yKHgpKTtcbiAgfVxuICBjLmZsZyB8PSBDLk1PRF9DRUxMO1xufTtcblxucHJvdG8udHJhbnNmb3JtID0gZnVuY3Rpb24oaW5wdXQsIHJlc2V0KSB7XG4gIGRlYnVnKGlucHV0LCBbXCJhZ2dyZWdhdGVcIl0pO1xuXG4gIHRoaXMuX2diID0gdGhpcy5ncm91cF9ieS5nZXQodGhpcy5fZ3JhcGgpO1xuXG4gIHZhciBvdXRwdXQgPSBHcm91cEJ5LnByb3RvdHlwZS50cmFuc2Zvcm0uY2FsbCh0aGlzLCBpbnB1dCwgcmVzZXQpLFxuICAgICAgYWdncyA9IHRoaXMuYWdncygpLFxuICAgICAgbGVuID0gYWdncy5sZW5ndGgsXG4gICAgICBpLCBrLCBjO1xuXG4gIGZvcihrIGluIHRoaXMuX2NlbGxzKSB7XG4gICAgYyA9IHRoaXMuX2NlbGxzW2tdO1xuICAgIGlmKCFjKSBjb250aW51ZTtcbiAgICBmb3IoaT0wOyBpPGxlbjsgaSsrKSB7XG4gICAgICBjW2FnZ3NbaV0uZmllbGRdLnNldCgpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXRwdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFnZ3JlZ2F0ZTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyk7XG5cbmZ1bmN0aW9uIEJpbihncmFwaCkge1xuICBUcmFuc2Zvcm0ucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICBmaWVsZDoge3R5cGU6IFwiZmllbGRcIn0sXG4gICAgbWluOiB7dHlwZTogXCJ2YWx1ZVwifSxcbiAgICBtYXg6IHt0eXBlOiBcInZhbHVlXCJ9LFxuICAgIHN0ZXA6IHt0eXBlOiBcInZhbHVlXCJ9LFxuICAgIG1heGJpbnM6IHt0eXBlOiBcInZhbHVlXCIsIGRlZmF1bHQ6IDIwfVxuICB9KTtcblxuICB0aGlzLl9vdXRwdXQgPSB7XCJiaW5cIjogXCJiaW5cIn07XG4gIHJldHVybiB0aGlzO1xufVxuXG52YXIgcHJvdG8gPSAoQmluLnByb3RvdHlwZSA9IG5ldyBUcmFuc2Zvcm0oKSk7XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciB0cmFuc2Zvcm0gPSB0aGlzLFxuICAgICAgb3V0cHV0ID0gdGhpcy5fb3V0cHV0LmJpbjtcbiAgICAgIFxuICB2YXIgYiA9IGRsLmJpbih7XG4gICAgbWluOiB0aGlzLm1pbi5nZXQoKSxcbiAgICBtYXg6IHRoaXMubWF4LmdldCgpLFxuICAgIHN0ZXA6IHRoaXMuc3RlcC5nZXQoKSxcbiAgICBtYXhiaW5zOiB0aGlzLm1heGJpbnMuZ2V0KClcbiAgfSk7XG5cbiAgZnVuY3Rpb24gdXBkYXRlKGQpIHtcbiAgICB2YXIgdiA9IHRyYW5zZm9ybS5maWVsZC5nZXQoKS5hY2Nlc3NvcihkKTtcbiAgICB2ID0gdiA9PSBudWxsID8gbnVsbFxuICAgICAgOiBiLnN0YXJ0ICsgYi5zdGVwICogfn4oKHYgLSBiLnN0YXJ0KSAvIGIuc3RlcCk7XG4gICAgdHVwbGUuc2V0KGQsIG91dHB1dCwgdiwgaW5wdXQuc3RhbXApO1xuICB9XG4gIGlucHV0LmFkZC5mb3JFYWNoKHVwZGF0ZSk7XG4gIGlucHV0Lm1vZC5mb3JFYWNoKHVwZGF0ZSk7XG4gIGlucHV0LnJlbS5mb3JFYWNoKHVwZGF0ZSk7XG5cbiAgcmV0dXJuIGlucHV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCaW47IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgQ29sbGVjdG9yID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvQ29sbGVjdG9yJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpO1xuXG5mdW5jdGlvbiBDcm9zcyhncmFwaCkge1xuICBUcmFuc2Zvcm0ucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICB3aXRoOiB7dHlwZTogXCJkYXRhXCJ9LFxuICAgIGRpYWdvbmFsOiB7dHlwZTogXCJ2YWx1ZVwiLCBkZWZhdWx0OiBcInRydWVcIn1cbiAgfSk7XG5cbiAgdGhpcy5fb3V0cHV0ID0ge1wibGVmdFwiOiBcImFcIiwgXCJyaWdodFwiOiBcImJcIn07XG4gIHRoaXMuX2NvbGxlY3RvciA9IG5ldyBDb2xsZWN0b3IoZ3JhcGgpO1xuICB0aGlzLl9sYXN0UmVtICA9IG51bGw7IC8vIE1vc3QgcmVjZW50IHN0YW1wIHRoYXQgcmVtIG9jY3VyZWQuIFxuICB0aGlzLl9sYXN0V2l0aCA9IG51bGw7IC8vIExhc3QgdGltZSB3ZSBjcm9zc2VkIHcvd2l0aGRzLlxuICB0aGlzLl9pZHMgICA9IHt9O1xuICB0aGlzLl9jYWNoZSA9IHt9O1xuXG4gIHJldHVybiB0aGlzLnJvdXRlcih0cnVlKTtcbn1cblxudmFyIHByb3RvID0gKENyb3NzLnByb3RvdHlwZSA9IG5ldyBUcmFuc2Zvcm0oKSk7XG5cbi8vIEVhY2ggY2FjaGVkIGluY29taW5nIHR1cGxlIGFsc28gaGFzIGEgc3RhbXAgdG8gdHJhY2sgaWYgd2UgbmVlZCB0byBkb1xuLy8gbGF6eSBmaWx0ZXJpbmcgb2YgcmVtb3ZlZCB0dXBsZXMuXG5mdW5jdGlvbiBjYWNoZSh4LCB0KSB7XG4gIHZhciBjID0gdGhpcy5fY2FjaGVbeC5faWRdID0gdGhpcy5fY2FjaGVbeC5faWRdIHx8IHtjOiBbXSwgczogdGhpcy5fc3RhbXB9O1xuICBjLmMucHVzaCh0KTtcbn1cblxuZnVuY3Rpb24gYWRkKG91dHB1dCwgbGVmdCwgd2RhdGEsIGRpYWcsIHgpIHtcbiAgdmFyIGRhdGEgPSBsZWZ0ID8gd2RhdGEgOiB0aGlzLl9jb2xsZWN0b3IuZGF0YSgpLCAvLyBMZWZ0IHR1cGxlcyBjcm9zcyB3L3JpZ2h0LlxuICAgICAgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoLFxuICAgICAgcHJldiAgPSB4Ll9wcmV2ICE9PSB1bmRlZmluZWQgPyBudWxsIDogdW5kZWZpbmVkLCBcbiAgICAgIHQsIHksIGlkO1xuXG4gIGZvcig7IGk8bGVuOyArK2kpIHtcbiAgICB5ID0gZGF0YVtpXTtcbiAgICBpZCA9IGxlZnQgPyB4Ll9pZCtcIl9cIit5Ll9pZCA6IHkuX2lkK1wiX1wiK3guX2lkO1xuICAgIGlmKHRoaXMuX2lkc1tpZF0pIGNvbnRpbnVlO1xuICAgIGlmKHguX2lkID09IHkuX2lkICYmICFkaWFnKSBjb250aW51ZTtcblxuICAgIHQgPSB0dXBsZS5pbmdlc3Qoe30sIHByZXYpO1xuICAgIHRbdGhpcy5fb3V0cHV0LmxlZnRdICA9IGxlZnQgPyB4IDogeTtcbiAgICB0W3RoaXMuX291dHB1dC5yaWdodF0gPSBsZWZ0ID8geSA6IHg7XG4gICAgb3V0cHV0LmFkZC5wdXNoKHQpO1xuICAgIGNhY2hlLmNhbGwodGhpcywgeCwgdCk7XG4gICAgY2FjaGUuY2FsbCh0aGlzLCB5LCB0KTtcbiAgICB0aGlzLl9pZHNbaWRdID0gMTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtb2Qob3V0cHV0LCBsZWZ0LCB4KSB7XG4gIHZhciBjcm9zcyA9IHRoaXMsXG4gICAgICBjID0gdGhpcy5fY2FjaGVbeC5faWRdO1xuXG4gIGlmKHRoaXMuX2xhc3RSZW0gPiBjLnMpIHsgIC8vIFJlbW92ZWQgdHVwbGVzIGhhdmVuJ3QgYmVlbiBmaWx0ZXJlZCB5ZXRcbiAgICBjLmMgPSBjLmMuZmlsdGVyKGZ1bmN0aW9uKHkpIHtcbiAgICAgIHZhciB0ID0geVtjcm9zcy5fb3V0cHV0W2xlZnQgPyBcInJpZ2h0XCIgOiBcImxlZnRcIl1dO1xuICAgICAgcmV0dXJuIGNyb3NzLl9jYWNoZVt0Ll9pZF0gIT09IG51bGw7XG4gICAgfSk7XG4gICAgYy5zID0gdGhpcy5fbGFzdFJlbTtcbiAgfVxuXG4gIG91dHB1dC5tb2QucHVzaC5hcHBseShvdXRwdXQubW9kLCBjLmMpO1xufVxuXG5mdW5jdGlvbiByZW0ob3V0cHV0LCB4KSB7XG4gIG91dHB1dC5yZW0ucHVzaC5hcHBseShvdXRwdXQucmVtLCB0aGlzLl9jYWNoZVt4Ll9pZF0uYyk7XG4gIHRoaXMuX2NhY2hlW3guX2lkXSA9IG51bGw7XG4gIHRoaXMuX2xhc3RSZW0gPSB0aGlzLl9zdGFtcDtcbn1cblxuZnVuY3Rpb24gdXBGaWVsZHMoaW5wdXQsIG91dHB1dCkge1xuICBpZihpbnB1dC5hZGQubGVuZ3RoIHx8IGlucHV0LnJlbS5sZW5ndGgpIHtcbiAgICBvdXRwdXQuZmllbGRzW3RoaXMuX291dHB1dC5sZWZ0XSAgPSAxOyBcbiAgICBvdXRwdXQuZmllbGRzW3RoaXMuX291dHB1dC5yaWdodF0gPSAxO1xuICB9XG59XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGRlYnVnKGlucHV0LCBbXCJjcm9zc2luZ1wiXSk7XG5cbiAgLy8gTWF0ZXJpYWxpemUgdGhlIGN1cnJlbnQgZGF0YXNvdXJjZS4gVE9ETzogc2hhcmUgY29sbGVjdG9yc1xuICB0aGlzLl9jb2xsZWN0b3IuZXZhbHVhdGUoaW5wdXQpO1xuXG4gIHZhciB3ID0gdGhpcy53aXRoLmdldCh0aGlzLl9ncmFwaCksXG4gICAgICBkaWFnID0gdGhpcy5kaWFnb25hbC5nZXQodGhpcy5fZ3JhcGgpLFxuICAgICAgc2VsZkNyb3NzID0gKCF3Lm5hbWUpLFxuICAgICAgZGF0YSA9IHRoaXMuX2NvbGxlY3Rvci5kYXRhKCksXG4gICAgICB3b3V0cHV0ID0gc2VsZkNyb3NzID8gaW5wdXQgOiB3LnNvdXJjZS5sYXN0KCksXG4gICAgICB3ZGF0YSAgID0gc2VsZkNyb3NzID8gZGF0YSA6IHcuc291cmNlLnZhbHVlcygpLFxuICAgICAgb3V0cHV0ICA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpLFxuICAgICAgciA9IHJlbS5iaW5kKHRoaXMsIG91dHB1dCk7IFxuXG4gIGlucHV0LnJlbS5mb3JFYWNoKHIpO1xuICBpbnB1dC5hZGQuZm9yRWFjaChhZGQuYmluZCh0aGlzLCBvdXRwdXQsIHRydWUsIHdkYXRhLCBkaWFnKSk7XG5cbiAgaWYoIXNlbGZDcm9zcyAmJiB3b3V0cHV0LnN0YW1wID4gdGhpcy5fbGFzdFdpdGgpIHtcbiAgICB3b3V0cHV0LnJlbS5mb3JFYWNoKHIpO1xuICAgIHdvdXRwdXQuYWRkLmZvckVhY2goYWRkLmJpbmQodGhpcywgb3V0cHV0LCBmYWxzZSwgZGF0YSwgZGlhZykpO1xuICAgIHdvdXRwdXQubW9kLmZvckVhY2gobW9kLmJpbmQodGhpcywgb3V0cHV0LCBmYWxzZSkpO1xuICAgIHVwRmllbGRzLmNhbGwodGhpcywgd291dHB1dCwgb3V0cHV0KTtcbiAgICB0aGlzLl9sYXN0V2l0aCA9IHdvdXRwdXQuc3RhbXA7XG4gIH1cblxuICAvLyBNb2RzIG5lZWQgdG8gY29tZSBhZnRlciBhbGwgcmVtb3ZhbHMgaGF2ZSBiZWVuIHJ1bi5cbiAgaW5wdXQubW9kLmZvckVhY2gobW9kLmJpbmQodGhpcywgb3V0cHV0LCB0cnVlKSk7XG4gIHVwRmllbGRzLmNhbGwodGhpcywgaW5wdXQsIG91dHB1dCk7XG5cbiAgcmV0dXJuIG91dHB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ3Jvc3M7IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgR3JvdXBCeSA9IHJlcXVpcmUoJy4vR3JvdXBCeScpLFxuICAgIHR1cGxlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvdHVwbGUnKSwgXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0JyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIEZhY2V0KGdyYXBoKSB7XG4gIEdyb3VwQnkucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtrZXlzOiB7dHlwZTogXCJhcnJheTxmaWVsZD5cIn0gfSk7XG5cbiAgdGhpcy5fcGlwZWxpbmUgPSBbXTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbnZhciBwcm90byA9IChGYWNldC5wcm90b3R5cGUgPSBuZXcgR3JvdXBCeSgpKTtcblxucHJvdG8ucGlwZWxpbmUgPSBmdW5jdGlvbihwaXBlbGluZSkge1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3BpcGVsaW5lO1xuICB0aGlzLl9waXBlbGluZSA9IHBpcGVsaW5lO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLl9yZXNldCA9IGZ1bmN0aW9uKGlucHV0LCBvdXRwdXQpIHtcbiAgdmFyIGssIGM7XG4gIGZvcihrIGluIHRoaXMuX2NlbGxzKSB7XG4gICAgYyA9IHRoaXMuX2NlbGxzW2tdO1xuICAgIGlmKCFjKSBjb250aW51ZTtcbiAgICBvdXRwdXQucmVtLnB1c2goYy50cGwpO1xuICAgIGMuZGVsZXRlKCk7XG4gIH1cbiAgdGhpcy5fY2VsbHMgPSB7fTtcbn07XG5cbnByb3RvLl9uZXdfdHVwbGUgPSBmdW5jdGlvbih4LCBrKSB7XG4gIHJldHVybiB0dXBsZS5pbmdlc3QoaywgbnVsbCk7XG59O1xuXG5wcm90by5fbmV3X2NlbGwgPSBmdW5jdGlvbih4LCBrKSB7XG4gIC8vIFJhdGhlciB0aGFuIHNoYXJpbmcgdGhlIHBpcGVsaW5lIGJldHdlZW4gYWxsIG5vZGVzLFxuICAvLyBnaXZlIGVhY2ggY2VsbCBpdHMgaW5kaXZpZHVhbCBwaXBlbGluZS4gVGhpcyBhbGxvd3NcbiAgLy8gZHluYW1pY2FsbHkgYWRkZWQgY29sbGVjdG9ycyB0byBkbyB0aGUgcmlnaHQgdGhpbmdcbiAgLy8gd2hlbiB3aXJpbmcgdXAgdGhlIHBpcGVsaW5lcy5cbiAgdmFyIGNlbGwgPSBHcm91cEJ5LnByb3RvdHlwZS5fbmV3X2NlbGwuY2FsbCh0aGlzLCB4LCBrKSxcbiAgICAgIHBpcGVsaW5lID0gdGhpcy5fcGlwZWxpbmUubWFwKGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG4uY2xvbmUoKTsgfSksXG4gICAgICBmYWNldCA9IHRoaXMsXG4gICAgICB0ID0gY2VsbC50cGw7XG5cbiAgY2VsbC5kcyA9IHRoaXMuX2dyYXBoLmRhdGEoXCJ2Z19cIit0Ll9pZCwgcGlwZWxpbmUsIHQpO1xuICBjZWxsLmRlbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGRlYnVnKHt9LCBbXCJkZWxldGluZyBjZWxsXCIsIGsua2V5XSk7XG4gICAgZmFjZXQucmVtb3ZlTGlzdGVuZXIocGlwZWxpbmVbMF0pO1xuICAgIGZhY2V0Ll9ncmFwaC5kaXNjb25uZWN0KHBpcGVsaW5lKTtcbiAgfTtcblxuICB0aGlzLmFkZExpc3RlbmVyKHBpcGVsaW5lWzBdKTtcblxuICByZXR1cm4gY2VsbDtcbn07XG5cbnByb3RvLl9hZGQgPSBmdW5jdGlvbih4KSB7XG4gIHZhciBjZWxsID0gR3JvdXBCeS5wcm90b3R5cGUuX2FkZC5jYWxsKHRoaXMsIHgpO1xuICBjZWxsLmRzLl9pbnB1dC5hZGQucHVzaCh4KTtcbiAgcmV0dXJuIGNlbGw7XG59O1xuXG5wcm90by5fbW9kID0gZnVuY3Rpb24oeCwgcmVzZXQpIHtcbiAgdmFyIGNlbGwgPSBHcm91cEJ5LnByb3RvdHlwZS5fbW9kLmNhbGwodGhpcywgeCwgcmVzZXQpO1xuICBpZighKGNlbGwuZmxnICYgQy5BRERfQ0VMTCkpIGNlbGwuZHMuX2lucHV0Lm1vZC5wdXNoKHgpOyAvLyBQcm9wYWdhdGUgdHVwbGVzXG4gIGNlbGwuZmxnIHw9IEMuTU9EX0NFTEw7XG4gIHJldHVybiBjZWxsO1xufTtcblxucHJvdG8uX3JlbSA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGNlbGwgPSBHcm91cEJ5LnByb3RvdHlwZS5fcmVtLmNhbGwodGhpcywgeCk7XG4gIGNlbGwuZHMuX2lucHV0LnJlbS5wdXNoKHgpO1xuICByZXR1cm4gY2VsbDtcbn07XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0LCByZXNldCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wiZmFjZXRpbmdcIl0pO1xuXG4gIHRoaXMuX2diID0gdGhpcy5rZXlzLmdldCh0aGlzLl9ncmFwaCk7XG5cbiAgdmFyIG91dHB1dCA9IEdyb3VwQnkucHJvdG90eXBlLnRyYW5zZm9ybS5jYWxsKHRoaXMsIGlucHV0LCByZXNldCksXG4gICAgICBrLCBjO1xuXG4gIGZvcihrIGluIHRoaXMuX2NlbGxzKSB7XG4gICAgYyA9IHRoaXMuX2NlbGxzW2tdO1xuICAgIGlmKGMgPT0gbnVsbCkgY29udGludWU7XG4gICAgaWYoYy5jbnQgPT09IDApIHtcbiAgICAgIGMuZGVsZXRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHByb3BhZ2F0ZSBzb3J0LCBzaWduYWxzLCBmaWVsZHMsIGV0Yy5cbiAgICAgIGNoYW5nZXNldC5jb3B5KGlucHV0LCBjLmRzLl9pbnB1dCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dHB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRmFjZXQ7IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0JyksIFxuICAgIGV4cHIgPSByZXF1aXJlKCcuLi9wYXJzZS9leHByJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIEZpbHRlcihncmFwaCkge1xuICBUcmFuc2Zvcm0ucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHt0ZXN0OiB7dHlwZTogXCJleHByXCJ9IH0pO1xuXG4gIHRoaXMuX3NraXAgPSB7fTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbnZhciBwcm90byA9IChGaWx0ZXIucHJvdG90eXBlID0gbmV3IFRyYW5zZm9ybSgpKTtcblxuZnVuY3Rpb24gdGVzdCh4KSB7XG4gIHJldHVybiBleHByLmV2YWwodGhpcy5fZ3JhcGgsIHRoaXMudGVzdC5nZXQodGhpcy5fZ3JhcGgpLCBcbiAgICB4LCBudWxsLCBudWxsLCBudWxsLCB0aGlzLmRlcGVuZGVuY3koQy5TSUdOQUxTKSk7XG59O1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wiZmlsdGVyaW5nXCJdKTtcbiAgdmFyIG91dHB1dCA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpLFxuICAgICAgc2tpcCA9IHRoaXMuX3NraXAsXG4gICAgICBmID0gdGhpcztcblxuICBpbnB1dC5yZW0uZm9yRWFjaChmdW5jdGlvbih4KSB7XG4gICAgaWYgKHNraXBbeC5faWRdICE9PSAxKSBvdXRwdXQucmVtLnB1c2goeCk7XG4gICAgZWxzZSBza2lwW3guX2lkXSA9IDA7XG4gIH0pO1xuXG4gIGlucHV0LmFkZC5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAodGVzdC5jYWxsKGYsIHgpKSBvdXRwdXQuYWRkLnB1c2goeCk7XG4gICAgZWxzZSBza2lwW3guX2lkXSA9IDE7XG4gIH0pO1xuXG4gIGlucHV0Lm1vZC5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcbiAgICB2YXIgYiA9IHRlc3QuY2FsbChmLCB4KSxcbiAgICAgICAgcyA9IChza2lwW3guX2lkXSA9PT0gMSk7XG4gICAgaWYgKGIgJiYgcykge1xuICAgICAgc2tpcFt4Ll9pZF0gPSAwO1xuICAgICAgb3V0cHV0LmFkZC5wdXNoKHgpO1xuICAgIH0gZWxzZSBpZiAoYiAmJiAhcykge1xuICAgICAgb3V0cHV0Lm1vZC5wdXNoKHgpO1xuICAgIH0gZWxzZSBpZiAoIWIgJiYgcykge1xuICAgICAgLy8gZG8gbm90aGluZywga2VlcCBza2lwIHRydWVcbiAgICB9IGVsc2UgeyAvLyAhYiAmJiAhc1xuICAgICAgb3V0cHV0LnJlbS5wdXNoKHgpO1xuICAgICAgc2tpcFt4Ll9pZF0gPSAxO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG91dHB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsdGVyOyIsInZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpLCBcbiAgICB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyksIFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpO1xuXG5mdW5jdGlvbiBGb2xkKGdyYXBoKSB7XG4gIFRyYW5zZm9ybS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgVHJhbnNmb3JtLmFkZFBhcmFtZXRlcnModGhpcywge1xuICAgIGZpZWxkczoge3R5cGU6IFwiYXJyYXk8ZmllbGQ+XCJ9IFxuICB9KTtcblxuICB0aGlzLl9vdXRwdXQgPSB7a2V5OiBcImtleVwiLCB2YWx1ZTogXCJ2YWx1ZVwifTtcbiAgdGhpcy5fY2FjaGUgPSB7fTtcblxuICByZXR1cm4gdGhpcy5yb3V0ZXIodHJ1ZSkucmV2aXNlcyh0cnVlKTtcbn1cblxudmFyIHByb3RvID0gKEZvbGQucHJvdG90eXBlID0gbmV3IFRyYW5zZm9ybSgpKTtcblxuZnVuY3Rpb24gcnN0KGlucHV0LCBvdXRwdXQpIHsgXG4gIGZvcih2YXIgaWQgaW4gdGhpcy5fY2FjaGUpIG91dHB1dC5yZW0ucHVzaC5hcHBseShvdXRwdXQucmVtLCB0aGlzLl9jYWNoZVtpZF0pO1xuICB0aGlzLl9jYWNoZSA9IHt9O1xufTtcblxuZnVuY3Rpb24gZ2V0X3R1cGxlKHgsIGksIGxlbikge1xuICB2YXIgbGlzdCA9IHRoaXMuX2NhY2hlW3guX2lkXSB8fCAodGhpcy5fY2FjaGVbeC5faWRdID0gQXJyYXkobGVuKSk7XG4gIHJldHVybiBsaXN0W2ldIHx8IChsaXN0W2ldID0gdHVwbGUuZGVyaXZlKHgsIHguX3ByZXYpKTtcbn07XG5cbmZ1bmN0aW9uIGZuKGRhdGEsIGZpZWxkcywgYWNjZXNzb3JzLCBvdXQsIHN0YW1wKSB7XG4gIHZhciBpID0gMCwgZGxlbiA9IGRhdGEubGVuZ3RoLFxuICAgICAgaiwgZmxlbiA9IGZpZWxkcy5sZW5ndGgsXG4gICAgICBkLCB0O1xuXG4gIGZvcig7IGk8ZGxlbjsgKytpKSB7XG4gICAgZCA9IGRhdGFbaV07XG4gICAgZm9yKGo9MDsgajxmbGVuOyArK2opIHtcbiAgICAgIHQgPSBnZXRfdHVwbGUuY2FsbCh0aGlzLCBkLCBqLCBmbGVuKTsgIFxuICAgICAgdHVwbGUuc2V0KHQsIHRoaXMuX291dHB1dC5rZXksIGZpZWxkc1tqXSk7XG4gICAgICB0dXBsZS5zZXQodCwgdGhpcy5fb3V0cHV0LnZhbHVlLCBhY2Nlc3NvcnNbal0oZCkpO1xuICAgICAgb3V0LnB1c2godCk7XG4gICAgfSAgICAgIFxuICB9XG59O1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCwgcmVzZXQpIHtcbiAgZGVidWcoaW5wdXQsIFtcImZvbGRpbmdcIl0pO1xuXG4gIHZhciBmb2xkID0gdGhpcyxcbiAgICAgIG9uID0gdGhpcy5maWVsZHMuZ2V0KHRoaXMuX2dyYXBoKSxcbiAgICAgIGZpZWxkcyA9IG9uLmZpZWxkcywgYWNjZXNzb3JzID0gb24uYWNjZXNzb3JzLFxuICAgICAgb3V0cHV0ID0gY2hhbmdlc2V0LmNyZWF0ZShpbnB1dCk7XG5cbiAgaWYocmVzZXQpIHJzdC5jYWxsKHRoaXMsIGlucHV0LCBvdXRwdXQpO1xuXG4gIGZuLmNhbGwodGhpcywgaW5wdXQuYWRkLCBmaWVsZHMsIGFjY2Vzc29ycywgb3V0cHV0LmFkZCwgaW5wdXQuc3RhbXApO1xuICBmbi5jYWxsKHRoaXMsIGlucHV0Lm1vZCwgZmllbGRzLCBhY2Nlc3NvcnMsIHJlc2V0ID8gb3V0cHV0LmFkZCA6IG91dHB1dC5tb2QsIGlucHV0LnN0YW1wKTtcbiAgaW5wdXQucmVtLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgIG91dHB1dC5yZW0ucHVzaC5hcHBseShvdXRwdXQucmVtLCBmb2xkLl9jYWNoZVt4Ll9pZF0pO1xuICAgIGZvbGQuX2NhY2hlW3guX2lkXSA9IG51bGw7XG4gIH0pO1xuXG4gIC8vIElmIHdlJ3JlIG9ubHkgcHJvcGFnYXRpbmcgdmFsdWVzLCBkb24ndCBtYXJrIGtleS92YWx1ZSBhcyB1cGRhdGVkLlxuICBpZihpbnB1dC5hZGQubGVuZ3RoIHx8IGlucHV0LnJlbS5sZW5ndGggfHwgXG4gICAgZmllbGRzLnNvbWUoZnVuY3Rpb24oZikgeyByZXR1cm4gISFpbnB1dC5maWVsZHNbZl07IH0pKVxuICAgICAgb3V0cHV0LmZpZWxkc1t0aGlzLl9vdXRwdXQua2V5XSA9IDEsIG91dHB1dC5maWVsZHNbdGhpcy5fb3V0cHV0LnZhbHVlXSA9IDE7XG4gIHJldHVybiBvdXRwdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvbGQ7IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgQ29sbGVjdG9yID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvQ29sbGVjdG9yJyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpLFxuICAgIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCk7XG5cbmZ1bmN0aW9uIEZvcmNlKGdyYXBoKSB7XG4gIFRyYW5zZm9ybS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgVHJhbnNmb3JtLmFkZFBhcmFtZXRlcnModGhpcywge1xuICAgIHNpemU6IHt0eXBlOiBcImFycmF5PHZhbHVlPlwiLCBkZWZhdWx0OiBbNTAwLCA1MDBdfSxcbiAgICBsaW5rczoge3R5cGU6IFwiZGF0YVwifSxcbiAgICBsaW5rRGlzdGFuY2U6IHt0eXBlOiBcImZpZWxkXCIsIGRlZmF1bHQ6IDIwfSxcbiAgICBsaW5rU3RyZW5ndGg6IHt0eXBlOiBcImZpZWxkXCIsIGRlZmF1bHQ6IDF9LFxuICAgIGNoYXJnZToge3R5cGU6IFwiZmllbGRcIiwgZGVmYXVsdDogMzB9LFxuICAgIGNoYXJnZURpc3RhbmNlOiB7dHlwZTogXCJmaWVsZFwiLCBkZWZhdWx0OiBJbmZpbml0eX0sXG4gICAgaXRlcmF0aW9uczoge3R5cGU6IFwidmFsdWVcIiwgZGVmYXVsdDogNTAwfSxcbiAgICBmcmljdGlvbjoge3R5cGU6IFwidmFsdWVcIiwgZGVmYXVsdDogMC45fSxcbiAgICB0aGV0YToge3R5cGU6IFwidmFsdWVcIiwgZGVmYXVsdDogMC44fSxcbiAgICBncmF2aXR5OiB7dHlwZTogXCJ2YWx1ZVwiLCBkZWZhdWx0OiAwLjF9LFxuICAgIGFscGhhOiB7dHlwZTogXCJ2YWx1ZVwiLCBkZWZhdWx0OiAwLjF9XG4gIH0pO1xuXG4gIHRoaXMuX25vZGVzID0gW107XG4gIHRoaXMuX2xpbmtzID0gW107XG4gIHRoaXMuX2xheW91dCA9IGQzLmxheW91dC5mb3JjZSgpO1xuXG4gIHRoaXMuX291dHB1dCA9IHtcbiAgICBcInhcIjogXCJmb3JjZTp4XCIsXG4gICAgXCJ5XCI6IFwiZm9yY2U6eVwiLFxuICAgIFwic291cmNlXCI6IFwiZm9yY2U6c291cmNlXCIsXG4gICAgXCJ0YXJnZXRcIjogXCJmb3JjZTp0YXJnZXRcIlxuICB9O1xuXG4gIHJldHVybiB0aGlzO1xufVxuXG52YXIgcHJvdG8gPSAoRm9yY2UucHJvdG90eXBlID0gbmV3IFRyYW5zZm9ybSgpKTtcblxuZnVuY3Rpb24gZ2V0KHRyYW5zZm9ybSwgbmFtZSkge1xuICB2YXIgdiA9IHRyYW5zZm9ybVtuYW1lXS5nZXQodHJhbnNmb3JtLl9ncmFwaCk7XG4gIHJldHVybiB2LmFjY2Vzc29yXG4gICAgPyBmdW5jdGlvbih4KSB7IHJldHVybiB2LmFjY2Vzc29yKHgudHVwbGUpOyB9XG4gICAgOiB2LmZpZWxkO1xufVxuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihub2RlSW5wdXQpIHtcbiAgLy8gZ2V0IHZhcmlhYmxlc1xuICB2YXIgZyA9IHRoaXMuX2dyYXBoLFxuICAgICAgbGlua0lucHV0ID0gdGhpcy5saW5rcy5nZXQoZykuc291cmNlLmxhc3QoKSxcbiAgICAgIGxheW91dCA9IHRoaXMuX2xheW91dCxcbiAgICAgIG91dHB1dCA9IHRoaXMuX291dHB1dCxcbiAgICAgIG5vZGVzID0gdGhpcy5fbm9kZXMsXG4gICAgICBsaW5rcyA9IHRoaXMuX2xpbmtzLFxuICAgICAgaXRlciA9IHRoaXMuaXRlcmF0aW9ucy5nZXQoZyk7XG5cbiAgLy8gcHJvY2VzcyBhZGRlZCBub2Rlc1xuICBub2RlSW5wdXQuYWRkLmZvckVhY2goZnVuY3Rpb24obikge1xuICAgIG5vZGVzLnB1c2goe3R1cGxlOiBufSk7XG4gIH0pO1xuXG4gIC8vIHByb2Nlc3MgYWRkZWQgZWRnZXNcbiAgbGlua0lucHV0LmFkZC5mb3JFYWNoKGZ1bmN0aW9uKGwpIHtcbiAgICB2YXIgbGluayA9IHtcbiAgICAgIHR1cGxlOiBsLFxuICAgICAgc291cmNlOiBub2Rlc1tsLnNvdXJjZV0sXG4gICAgICB0YXJnZXQ6IG5vZGVzW2wudGFyZ2V0XVxuICAgIH07XG4gICAgdHVwbGUuc2V0KGwsIG91dHB1dC5zb3VyY2UsIGxpbmsuc291cmNlLnR1cGxlKTtcbiAgICB0dXBsZS5zZXQobCwgb3V0cHV0LnRhcmdldCwgbGluay50YXJnZXQudHVwbGUpO1xuICAgIGxpbmtzLnB1c2gobGluayk7XG4gIH0pO1xuXG4gIC8vIFRPRE8gcHJvY2VzcyBcIm1vZFwiIG9mIGVkZ2Ugc291cmNlIG9yIHRhcmdldD9cblxuICAvLyBjb25maWd1cmUgbGF5b3V0XG4gIGxheW91dFxuICAgIC5zaXplKHRoaXMuc2l6ZS5nZXQoZykpXG4gICAgLmxpbmtEaXN0YW5jZShnZXQodGhpcywgXCJsaW5rRGlzdGFuY2VcIikpXG4gICAgLmxpbmtTdHJlbmd0aChnZXQodGhpcywgXCJsaW5rU3RyZW5ndGhcIikpXG4gICAgLmNoYXJnZShnZXQodGhpcywgXCJjaGFyZ2VcIikpXG4gICAgLmNoYXJnZURpc3RhbmNlKGdldCh0aGlzLCBcImNoYXJnZURpc3RhbmNlXCIpKVxuICAgIC5mcmljdGlvbih0aGlzLmZyaWN0aW9uLmdldChnKSlcbiAgICAudGhldGEodGhpcy50aGV0YS5nZXQoZykpXG4gICAgLmdyYXZpdHkodGhpcy5ncmF2aXR5LmdldChnKSlcbiAgICAuYWxwaGEodGhpcy5hbHBoYS5nZXQoZykpXG4gICAgLm5vZGVzKG5vZGVzKVxuICAgIC5saW5rcyhsaW5rcyk7XG5cbiAgLy8gcnVuIGxheW91dFxuICBsYXlvdXQuc3RhcnQoKTtcbiAgZm9yICh2YXIgaT0wOyBpPGl0ZXI7ICsraSkge1xuICAgIGxheW91dC50aWNrKCk7XG4gIH1cbiAgbGF5b3V0LnN0b3AoKTtcblxuICAvLyBjb3B5IGxheW91dCB2YWx1ZXMgdG8gbm9kZXNcbiAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbihuKSB7XG4gICAgdHVwbGUuc2V0KG4udHVwbGUsIG91dHB1dC54LCBuLngpO1xuICAgIHR1cGxlLnNldChuLnR1cGxlLCBvdXRwdXQueSwgbi55KTtcbiAgfSk7XG5cbiAgLy8gcHJvY2VzcyByZW1vdmVkIG5vZGVzXG4gIGlmIChub2RlSW5wdXQucmVtLmxlbmd0aCA+IDApIHtcbiAgICB2YXIgbm9kZUlkcyA9IHR1cGxlLmlkTWFwKG5vZGVJbnB1dC5yZW0pO1xuICAgIHRoaXMuX25vZGVzID0gbm9kZXMuZmlsdGVyKGZ1bmN0aW9uKG4pIHsgcmV0dXJuICFub2RlSWRzW24udHVwbGUuX2lkXTsgfSk7XG4gIH1cblxuICAvLyBwcm9jZXNzIHJlbW92ZWQgZWRnZXNcbiAgaWYgKGxpbmtJbnB1dC5yZW0ubGVuZ3RoID4gMCkge1xuICAgIHZhciBsaW5rSWRzID0gdHVwbGUuaWRNYXAobGlua0lucHV0LnJlbSk7XG4gICAgdGhpcy5fbGlua3MgPSBsaW5rcy5maWx0ZXIoZnVuY3Rpb24obCkgeyByZXR1cm4gIWxpbmtJZHNbbC50dXBsZS5faWRdOyB9KTtcbiAgfVxuXG4gIC8vIHJldHVybiBjaGFuZ2VzZXRcbiAgbm9kZUlucHV0LmZpZWxkc1tvdXRwdXQueF0gPSAxO1xuICBub2RlSW5wdXQuZmllbGRzW291dHB1dC55XSA9IDE7XG4gIHJldHVybiBub2RlSW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvcmNlOyIsInZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxuICAgIHR1cGxlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvdHVwbGUnKSwgXG4gICAgZXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uL3BhcnNlL2V4cHInKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gRm9ybXVsYShncmFwaCkge1xuICBUcmFuc2Zvcm0ucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICBmaWVsZDoge3R5cGU6IFwidmFsdWVcIn0sXG4gICAgZXhwcjogIHt0eXBlOiBcImV4cHJcIn1cbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cbnZhciBwcm90byA9IChGb3JtdWxhLnByb3RvdHlwZSA9IG5ldyBUcmFuc2Zvcm0oKSk7XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGRlYnVnKGlucHV0LCBbXCJmb3JtdWxhdGluZ1wiXSk7XG4gIHZhciB0ID0gdGhpcywgXG4gICAgICBnID0gdGhpcy5fZ3JhcGgsXG4gICAgICBmaWVsZCA9IHRoaXMuZmllbGQuZ2V0KGcpLFxuICAgICAgZXhwciA9IHRoaXMuZXhwci5nZXQoZyksXG4gICAgICBkZXBzID0gdGhpcy5kZXBlbmRlbmN5KEMuU0lHTkFMUyk7XG4gIFxuICBmdW5jdGlvbiBzZXQoeCkge1xuICAgIHZhciB2YWwgPSBleHByZXNzaW9uLmV2YWwoZywgZXhwciwgeCwgbnVsbCwgbnVsbCwgbnVsbCwgZGVwcyk7XG4gICAgdHVwbGUuc2V0KHgsIGZpZWxkLCB2YWwpO1xuICB9XG5cbiAgaW5wdXQuYWRkLmZvckVhY2goc2V0KTtcbiAgXG4gIGlmICh0aGlzLnJlZXZhbHVhdGUoaW5wdXQpKSB7XG4gICAgaW5wdXQubW9kLmZvckVhY2goc2V0KTtcbiAgfVxuXG4gIGlucHV0LmZpZWxkc1tmaWVsZF0gPSAxO1xuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm11bGE7IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBHcm91cEJ5KGdyYXBoKSB7XG4gIGlmKGdyYXBoKSB0aGlzLmluaXQoZ3JhcGgpO1xuICByZXR1cm4gdGhpcztcbn1cblxudmFyIHByb3RvID0gKEdyb3VwQnkucHJvdG90eXBlID0gbmV3IFRyYW5zZm9ybSgpKTtcblxucHJvdG8uaW5pdCA9IGZ1bmN0aW9uKGdyYXBoKSB7XG4gIHRoaXMuX2diID0gbnVsbDsgLy8gZmllbGRzK2FjY2Vzc29ycyB0byBncm91cGJ5IGZpZWxkc1xuICB0aGlzLl9jZWxscyA9IHt9O1xuICByZXR1cm4gVHJhbnNmb3JtLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgZ3JhcGgpXG4gICAgLnJvdXRlcih0cnVlKS5yZXZpc2VzKHRydWUpO1xufTtcblxucHJvdG8uZGF0YSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fY2VsbHM7IH07XG5cbnByb3RvLl9yZXNldCA9IGZ1bmN0aW9uKGlucHV0LCBvdXRwdXQpIHtcbiAgdmFyIGssIGM7XG4gIGZvcihrIGluIHRoaXMuX2NlbGxzKSB7XG4gICAgaWYoIShjID0gdGhpcy5fY2VsbHNba10pKSBjb250aW51ZTtcbiAgICBvdXRwdXQucmVtLnB1c2goYy50cGwpO1xuICB9XG4gIHRoaXMuX2NlbGxzID0ge307XG59O1xuXG5wcm90by5fa2V5cyA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGFjYyA9IHRoaXMuX2diLmFjY2Vzc29ycyB8fCBbdGhpcy5fZ2IuYWNjZXNzb3JdO1xuICB2YXIga2V5cyA9IGFjYy5yZWR1Y2UoZnVuY3Rpb24oZywgZikge1xuICAgIHJldHVybiAoKHYgPSBmKHgpKSAhPT0gdW5kZWZpbmVkKSA/IChnLnB1c2godiksIGcpIDogZztcbiAgfSwgW10pLCBrID0ga2V5cy5qb2luKFwifFwiKSwgdjtcbiAgcmV0dXJuIGtleXMubGVuZ3RoID4gMCA/IHtrZXlzOiBrZXlzLCBrZXk6IGt9IDogdW5kZWZpbmVkO1xufTtcblxucHJvdG8uX2NlbGwgPSBmdW5jdGlvbih4KSB7XG4gIHZhciBrID0gdGhpcy5fa2V5cyh4KTtcbiAgcmV0dXJuIHRoaXMuX2NlbGxzW2sua2V5XSB8fCAodGhpcy5fY2VsbHNbay5rZXldID0gdGhpcy5fbmV3X2NlbGwoeCwgaykpO1xufTtcblxucHJvdG8uX25ld19jZWxsID0gZnVuY3Rpb24oeCwgaykge1xuICByZXR1cm4ge1xuICAgIGNudDogMCxcbiAgICB0cGw6IHRoaXMuX25ld190dXBsZSh4LCBrKSxcbiAgICBmbGc6IEMuQUREX0NFTExcbiAgfTtcbn07XG5cbnByb3RvLl9uZXdfdHVwbGUgPSBmdW5jdGlvbih4LCBrKSB7XG4gIHZhciBnYiA9IHRoaXMuX2diLFxuICAgICAgZmllbGRzID0gZ2IuZmllbGRzIHx8IFtnYi5maWVsZF0sXG4gICAgICBhY2MgPSBnYi5hY2Nlc3NvcnMgfHwgW2diLmFjY2Vzc29yXSxcbiAgICAgIHQgPSB7fSwgaSwgbGVuO1xuXG4gIGZvcihpPTAsIGxlbj1maWVsZHMubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgdFtmaWVsZHNbaV1dID0gYWNjW2ldKHgpO1xuICB9IFxuXG4gIHJldHVybiB0dXBsZS5pbmdlc3QodCwgbnVsbCk7XG59O1xuXG5wcm90by5fYWRkID0gZnVuY3Rpb24oeCkge1xuICB2YXIgY2VsbCA9IHRoaXMuX2NlbGwoeCk7XG4gIGNlbGwuY250ICs9IDE7XG4gIGNlbGwuZmxnIHw9IEMuTU9EX0NFTEw7XG4gIHJldHVybiBjZWxsO1xufTtcblxucHJvdG8uX3JlbSA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGNlbGwgPSB0aGlzLl9jZWxsKHgpO1xuICBjZWxsLmNudCAtPSAxO1xuICBjZWxsLmZsZyB8PSBDLk1PRF9DRUxMO1xuICByZXR1cm4gY2VsbDtcbn07XG5cbnByb3RvLl9tb2QgPSBmdW5jdGlvbih4LCByZXNldCkge1xuICBpZih4Ll9wcmV2ICYmIHguX3ByZXYgIT09IEMuU0VOVElORUwgJiYgdGhpcy5fa2V5cyh4Ll9wcmV2KSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fcmVtKHguX3ByZXYpO1xuICAgIHJldHVybiB0aGlzLl9hZGQoeCk7XG4gIH0gZWxzZSBpZihyZXNldCkgeyAvLyBTaWduYWwgY2hhbmdlIHRyaWdnZXJlZCByZWZsb3dcbiAgICByZXR1cm4gdGhpcy5fYWRkKHgpO1xuICB9XG4gIHJldHVybiB0aGlzLl9jZWxsKHgpO1xufTtcblxucHJvdG8udHJhbnNmb3JtID0gZnVuY3Rpb24oaW5wdXQsIHJlc2V0KSB7XG4gIHZhciBncm91cEJ5ID0gdGhpcyxcbiAgICAgIG91dHB1dCA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpLFxuICAgICAgaywgYywgZiwgdDtcblxuICBpZihyZXNldCkgdGhpcy5fcmVzZXQoaW5wdXQsIG91dHB1dCk7XG5cbiAgaW5wdXQuYWRkLmZvckVhY2goZnVuY3Rpb24oeCkgeyBncm91cEJ5Ll9hZGQoeCk7IH0pO1xuICBpbnB1dC5tb2QuZm9yRWFjaChmdW5jdGlvbih4KSB7IGdyb3VwQnkuX21vZCh4LCByZXNldCk7IH0pO1xuICBpbnB1dC5yZW0uZm9yRWFjaChmdW5jdGlvbih4KSB7XG4gICAgaWYoeC5fcHJldiAmJiB4Ll9wcmV2ICE9PSBDLlNFTlRJTkVMICYmIGdyb3VwQnkuX2tleXMoeC5fcHJldikgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZ3JvdXBCeS5fcmVtKHguX3ByZXYpO1xuICAgIH0gZWxzZSB7XG4gICAgICBncm91cEJ5Ll9yZW0oeCk7XG4gICAgfVxuICB9KTtcblxuICBmb3IoayBpbiB0aGlzLl9jZWxscykge1xuICAgIGMgPSB0aGlzLl9jZWxsc1trXTtcbiAgICBpZighYykgY29udGludWU7XG4gICAgZiA9IGMuZmxnO1xuICAgIHQgPSBjLnRwbDtcblxuICAgIGlmKGMuY250ID09PSAwKSB7XG4gICAgICBpZihmID09PSBDLk1PRF9DRUxMKSBvdXRwdXQucmVtLnB1c2godCk7XG4gICAgICB0aGlzLl9jZWxsc1trXSA9IG51bGw7XG4gICAgfSBlbHNlIGlmKGYgJiBDLkFERF9DRUxMKSB7XG4gICAgICBvdXRwdXQuYWRkLnB1c2godCk7XG4gICAgfSBlbHNlIGlmKGYgJiBDLk1PRF9DRUxMKSB7XG4gICAgICBvdXRwdXQubW9kLnB1c2godCk7XG4gICAgfVxuICAgIGMuZmxnID0gMDtcbiAgfVxuXG4gIHJldHVybiBvdXRwdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwQnk7IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIGV4cHIgPSByZXF1aXJlKCcuLi9wYXJzZS9leHByJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbnZhciBhcnJheVR5cGUgPSAvYXJyYXkvaSxcbiAgICBkYXRhVHlwZSAgPSAvZGF0YS9pLFxuICAgIGZpZWxkVHlwZSA9IC9maWVsZC9pLFxuICAgIGV4cHJUeXBlICA9IC9leHByL2k7XG5cbmZ1bmN0aW9uIFBhcmFtZXRlcihuYW1lLCB0eXBlKSB7XG4gIHRoaXMuX25hbWUgPSBuYW1lO1xuICB0aGlzLl90eXBlID0gdHlwZTtcblxuICAvLyBJZiBwYXJhbWV0ZXIgaXMgZGVmaW5lZCB3L3NpZ25hbHMsIGl0IG11c3QgYmUgcmVzb2x2ZWRcbiAgLy8gb24gZXZlcnkgcHVsc2UuXG4gIHRoaXMuX3ZhbHVlID0gW107XG4gIHRoaXMuX2FjY2Vzc29ycyA9IFtdO1xuICB0aGlzLl9yZXNvbHV0aW9uID0gZmFsc2U7XG4gIHRoaXMuX3NpZ25hbHMgPSB7fTtcbn1cblxudmFyIHByb3RvID0gUGFyYW1ldGVyLnByb3RvdHlwZTtcblxucHJvdG8uX2dldCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaXNBcnJheSA9IGFycmF5VHlwZS50ZXN0KHRoaXMuX3R5cGUpLFxuICAgICAgaXNEYXRhICA9IGRhdGFUeXBlLnRlc3QodGhpcy5fdHlwZSksXG4gICAgICBpc0ZpZWxkID0gZmllbGRUeXBlLnRlc3QodGhpcy5fdHlwZSk7XG5cbiAgaWYgKGlzRGF0YSkge1xuICAgIHJldHVybiBpc0FycmF5ID8geyBuYW1lczogdGhpcy5fdmFsdWUsIHNvdXJjZXM6IHRoaXMuX2FjY2Vzc29ycyB9IDpcbiAgICAgIHsgbmFtZTogdGhpcy5fdmFsdWVbMF0sIHNvdXJjZTogdGhpcy5fYWNjZXNzb3JzWzBdIH07XG4gIH0gZWxzZSBpZiAoaXNGaWVsZCkge1xuICAgIHJldHVybiBpc0FycmF5ID8geyBmaWVsZHM6IHRoaXMuX3ZhbHVlLCBhY2Nlc3NvcnM6IHRoaXMuX2FjY2Vzc29ycyB9IDpcbiAgICAgIHsgZmllbGQ6IHRoaXMuX3ZhbHVlWzBdLCBhY2Nlc3NvcjogdGhpcy5fYWNjZXNzb3JzWzBdIH07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGlzQXJyYXkgPyB0aGlzLl92YWx1ZSA6IHRoaXMuX3ZhbHVlWzBdO1xuICB9XG59O1xuXG5wcm90by5nZXQgPSBmdW5jdGlvbihncmFwaCkge1xuICB2YXIgaXNEYXRhICA9IGRhdGFUeXBlLnRlc3QodGhpcy5fdHlwZSksXG4gICAgICBpc0ZpZWxkID0gZmllbGRUeXBlLnRlc3QodGhpcy5fdHlwZSksXG4gICAgICBzLCBpZHgsIHZhbDtcblxuICAvLyBJZiB3ZSBkb24ndCByZXF1aXJlIHJlc29sdXRpb24sIHJldHVybiB0aGUgdmFsdWUgaW1tZWRpYXRlbHkuXG4gIGlmICghdGhpcy5fcmVzb2x1dGlvbikgcmV0dXJuIHRoaXMuX2dldCgpO1xuXG4gIGlmIChpc0RhdGEpIHtcbiAgICB0aGlzLl9hY2Nlc3NvcnMgPSB0aGlzLl92YWx1ZS5tYXAoZnVuY3Rpb24odikgeyByZXR1cm4gZ3JhcGguZGF0YSh2KTsgfSk7XG4gICAgcmV0dXJuIHRoaXMuX2dldCgpOyAvLyBUT0RPOiBzdXBwb3J0IHNpZ25hbCBhcyBkYXRhVHlwZXNcbiAgfVxuXG4gIGZvcihzIGluIHRoaXMuX3NpZ25hbHMpIHtcbiAgICBpZHggID0gdGhpcy5fc2lnbmFsc1tzXTtcbiAgICB2YWwgID0gZ3JhcGguc2lnbmFsUmVmKHMpO1xuXG4gICAgaWYgKGlzRmllbGQpIHtcbiAgICAgIHRoaXMuX2FjY2Vzc29yc1tpZHhdID0gdGhpcy5fdmFsdWVbaWR4XSAhPSB2YWwgPyBcbiAgICAgICAgZGwuYWNjZXNzb3IodmFsKSA6IHRoaXMuX2FjY2Vzc29yc1tpZHhdO1xuICAgIH1cblxuICAgIHRoaXMuX3ZhbHVlW2lkeF0gPSB2YWw7XG4gIH1cblxuICByZXR1cm4gdGhpcy5fZ2V0KCk7XG59O1xuXG5wcm90by5zZXQgPSBmdW5jdGlvbih0cmFuc2Zvcm0sIHZhbHVlKSB7XG4gIHZhciBwYXJhbSA9IHRoaXMsIFxuICAgICAgaXNFeHByID0gZXhwclR5cGUudGVzdCh0aGlzLl90eXBlKSxcbiAgICAgIGlzRGF0YSAgPSBkYXRhVHlwZS50ZXN0KHRoaXMuX3R5cGUpLFxuICAgICAgaXNGaWVsZCA9IGZpZWxkVHlwZS50ZXN0KHRoaXMuX3R5cGUpO1xuXG4gIHRoaXMuX3ZhbHVlID0gZGwuYXJyYXkodmFsdWUpLm1hcChmdW5jdGlvbih2LCBpKSB7XG4gICAgaWYgKGRsLmlzU3RyaW5nKHYpKSB7XG4gICAgICBpZiAoaXNFeHByKSB7XG4gICAgICAgIHZhciBlID0gZXhwcih2KTtcbiAgICAgICAgdHJhbnNmb3JtLmRlcGVuZGVuY3koQy5GSUVMRFMsICBlLmZpZWxkcyk7XG4gICAgICAgIHRyYW5zZm9ybS5kZXBlbmRlbmN5KEMuU0lHTkFMUywgZS5zaWduYWxzKTtcbiAgICAgICAgcmV0dXJuIGUuZm47XG4gICAgICB9IGVsc2UgaWYgKGlzRmllbGQpIHsgIC8vIEJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgICAgIHBhcmFtLl9hY2Nlc3NvcnNbaV0gPSBkbC5hY2Nlc3Nvcih2KTtcbiAgICAgICAgdHJhbnNmb3JtLmRlcGVuZGVuY3koQy5GSUVMRFMsIHYpO1xuICAgICAgfSBlbHNlIGlmIChpc0RhdGEpIHtcbiAgICAgICAgcGFyYW0uX3Jlc29sdXRpb24gPSB0cnVlO1xuICAgICAgICB0cmFuc2Zvcm0uZGVwZW5kZW5jeShDLkRBVEEsIHYpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHY7XG4gICAgfSBlbHNlIGlmICh2LnZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB2LnZhbHVlO1xuICAgIH0gZWxzZSBpZiAodi5maWVsZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBwYXJhbS5fYWNjZXNzb3JzW2ldID0gZGwuYWNjZXNzb3Iodi5maWVsZCk7XG4gICAgICB0cmFuc2Zvcm0uZGVwZW5kZW5jeShDLkZJRUxEUywgdi5maWVsZCk7XG4gICAgICByZXR1cm4gdi5maWVsZDtcbiAgICB9IGVsc2UgaWYgKHYuc2lnbmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHBhcmFtLl9yZXNvbHV0aW9uID0gdHJ1ZTtcbiAgICAgIHBhcmFtLl9zaWduYWxzW3Yuc2lnbmFsXSA9IGk7XG4gICAgICB0cmFuc2Zvcm0uZGVwZW5kZW5jeShDLlNJR05BTFMsIHYuc2lnbmFsKTtcbiAgICAgIHJldHVybiB2LnNpZ25hbDtcbiAgICB9XG5cbiAgICByZXR1cm4gdjtcbiAgfSk7XG5cbiAgcmV0dXJuIHRyYW5zZm9ybTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGFyYW1ldGVyOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxuICAgIGV4cHIgPSByZXF1aXJlKCcuLi9wYXJzZS9leHByJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyk7XG5cbmZ1bmN0aW9uIFNvcnQoZ3JhcGgpIHtcbiAgVHJhbnNmb3JtLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgZ3JhcGgpO1xuICBUcmFuc2Zvcm0uYWRkUGFyYW1ldGVycyh0aGlzLCB7Ynk6IHt0eXBlOiBcImFycmF5PGZpZWxkPlwifSB9KTtcbiAgcmV0dXJuIHRoaXMucm91dGVyKHRydWUpO1xufVxuXG52YXIgcHJvdG8gPSAoU29ydC5wcm90b3R5cGUgPSBuZXcgVHJhbnNmb3JtKCkpO1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wic29ydGluZ1wiXSk7XG5cbiAgaWYoaW5wdXQuYWRkLmxlbmd0aCB8fCBpbnB1dC5tb2QubGVuZ3RoIHx8IGlucHV0LnJlbS5sZW5ndGgpIHtcbiAgICBpbnB1dC5zb3J0ID0gZGwuY29tcGFyYXRvcih0aGlzLmJ5LmdldCh0aGlzLl9ncmFwaCkuZmllbGRzKTtcbiAgfVxuXG4gIHJldHVybiBpbnB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU29ydDsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICBDb2xsZWN0b3IgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Db2xsZWN0b3InKSxcbiAgICB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0Jyk7XG5cbmZ1bmN0aW9uIFN0YWNrKGdyYXBoKSB7XG4gIFRyYW5zZm9ybS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgVHJhbnNmb3JtLmFkZFBhcmFtZXRlcnModGhpcywge1xuICAgIGdyb3VwYnk6IHt0eXBlOiBcImFycmF5PGZpZWxkPlwifSxcbiAgICBzb3J0Ynk6IHt0eXBlOiBcImFycmF5PGZpZWxkPlwifSxcbiAgICB2YWx1ZToge3R5cGU6IFwiZmllbGRcIn0sXG4gICAgb2Zmc2V0OiB7dHlwZTogXCJ2YWx1ZVwiLCBkZWZhdWx0OiBcInplcm9cIn1cbiAgfSk7XG5cbiAgdGhpcy5fb3V0cHV0ID0ge1xuICAgIFwic3RhcnRcIjogXCJ5MlwiLFxuICAgIFwic3RvcFwiOiBcInlcIixcbiAgICBcIm1pZFwiOiBcImN5XCJcbiAgfTtcbiAgdGhpcy5fY29sbGVjdG9yID0gbmV3IENvbGxlY3RvcihncmFwaCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cbnZhciBwcm90byA9IChTdGFjay5wcm90b3R5cGUgPSBuZXcgVHJhbnNmb3JtKCkpO1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCkge1xuICAvLyBNYXRlcmlhbGl6ZSB0aGUgY3VycmVudCBkYXRhc291cmNlLiBUT0RPOiBzaGFyZSBjb2xsZWN0b3JzXG4gIHRoaXMuX2NvbGxlY3Rvci5ldmFsdWF0ZShpbnB1dCk7XG4gIHZhciBkYXRhID0gdGhpcy5fY29sbGVjdG9yLmRhdGEoKTtcblxuICB2YXIgZyA9IHRoaXMuX2dyYXBoLFxuICAgICAgZ3JvdXBieSA9IHRoaXMuZ3JvdXBieS5nZXQoZykuYWNjZXNzb3JzLFxuICAgICAgc29ydGJ5ID0gZGwuY29tcGFyYXRvcih0aGlzLnNvcnRieS5nZXQoZykuZmllbGRzKSxcbiAgICAgIHZhbHVlID0gdGhpcy52YWx1ZS5nZXQoZykuYWNjZXNzb3IsXG4gICAgICBvZmZzZXQgPSB0aGlzLm9mZnNldC5nZXQoZyksXG4gICAgICBvdXRwdXQgPSB0aGlzLl9vdXRwdXQ7XG5cbiAgLy8gcGFydGl0aW9uLCBzdW0sIGFuZCBzb3J0IHRoZSBzdGFjayBncm91cHNcbiAgdmFyIGdyb3VwcyA9IHBhcnRpdGlvbihkYXRhLCBncm91cGJ5LCBzb3J0YnksIHZhbHVlKTtcblxuICAvLyBjb21wdXRlIHN0YWNrIGxheW91dHMgcGVyIGdyb3VwXG4gIGZvciAodmFyIGk9MCwgbWF4PWdyb3Vwcy5tYXg7IGk8Z3JvdXBzLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGdyb3VwID0gZ3JvdXBzW2ldLFxuICAgICAgICBzdW0gPSBncm91cC5zdW0sXG4gICAgICAgIG9mZiA9IG9mZnNldD09PVwiY2VudGVyXCIgPyAobWF4IC0gc3VtKS8yIDogMCxcbiAgICAgICAgc2NhbGUgPSBvZmZzZXQ9PT1cIm5vcm1hbGl6ZVwiID8gKDEvc3VtKSA6IDEsXG4gICAgICAgIGksIHgsIGEsIGIgPSBvZmYsIHYgPSAwO1xuXG4gICAgLy8gc2V0IHN0YWNrIGNvb3JkaW5hdGVzIGZvciBlYWNoIGRhdHVtIGluIGdyb3VwXG4gICAgZm9yIChqPTA7IGo8Z3JvdXAubGVuZ3RoOyArK2opIHtcbiAgICAgIHggPSBncm91cFtqXTtcbiAgICAgIGEgPSBiOyAvLyB1c2UgcHJldmlvdXMgdmFsdWUgZm9yIHN0YXJ0IHBvaW50XG4gICAgICB2ICs9IHZhbHVlKHgpO1xuICAgICAgYiA9IHNjYWxlICogdiArIG9mZjsgLy8gY29tcHV0ZSBlbmQgcG9pbnRcbiAgICAgIHR1cGxlLnNldCh4LCBvdXRwdXQuc3RhcnQsIGEpO1xuICAgICAgdHVwbGUuc2V0KHgsIG91dHB1dC5zdG9wLCBiKTtcbiAgICAgIHR1cGxlLnNldCh4LCBvdXRwdXQubWlkLCAwLjUgKiAoYSArIGIpKTtcbiAgICB9XG4gIH1cblxuICBpbnB1dC5maWVsZHNbb3V0cHV0LnN0YXJ0XSA9IDE7XG4gIGlucHV0LmZpZWxkc1tvdXRwdXQuc3RvcF0gPSAxO1xuICBpbnB1dC5maWVsZHNbb3V0cHV0Lm1pZF0gPSAxO1xuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5mdW5jdGlvbiBwYXJ0aXRpb24oZGF0YSwgZ3JvdXBieSwgc29ydGJ5LCB2YWx1ZSkge1xuICB2YXIgZ3JvdXBzID0gW10sXG4gICAgICBtYXAsIGksIHgsIGssIGcsIHMsIG1heDtcblxuICAvLyBwYXJ0aXRpb24gZGF0YSBwb2ludHMgaW50byBzdGFjayBncm91cHNcbiAgaWYgKGdyb3VwYnkgPT0gbnVsbCkge1xuICAgIGdyb3Vwcy5wdXNoKGRhdGEuc2xpY2UoKSk7XG4gIH0gZWxzZSB7XG4gICAgZm9yIChtYXA9e30sIGk9MDsgaTxkYXRhLmxlbmd0aDsgKytpKSB7XG4gICAgICB4ID0gZGF0YVtpXTtcbiAgICAgIGsgPSAoZ3JvdXBieS5tYXAoZnVuY3Rpb24oZikgeyByZXR1cm4gZih4KTsgfSkpO1xuICAgICAgZyA9IG1hcFtrXSB8fCAoZ3JvdXBzLnB1c2gobWFwW2tdID0gW10pLCBtYXBba10pO1xuICAgICAgZy5wdXNoKHgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGNvbXB1dGUgc3VtcyBvZiBncm91cHMsIHNvcnQgZ3JvdXBzIGFzIG5lZWRlZFxuICBmb3IgKGs9MCwgbWF4PTA7IGs8Z3JvdXBzLmxlbmd0aDsgKytrKSB7XG4gICAgZyA9IGdyb3Vwc1trXTtcbiAgICBmb3IgKGk9MCwgcz0wOyBpPGcubGVuZ3RoOyArK2kpIHtcbiAgICAgIHMgKz0gdmFsdWUoZ1tpXSk7XG4gICAgfVxuICAgIGcuc3VtID0gcztcbiAgICBpZiAocyA+IG1heCkgbWF4ID0gcztcbiAgICBpZiAoc29ydGJ5ICE9IG51bGwpIGcuc29ydChzb3J0YnkpO1xuICB9XG4gIGdyb3Vwcy5tYXggPSBtYXg7XG5cbiAgcmV0dXJuIGdyb3Vwcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGFjazsiLCJ2YXIgTm9kZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L05vZGUnKSxcbiAgICBQYXJhbWV0ZXIgPSByZXF1aXJlKCcuL1BhcmFtZXRlcicpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBUcmFuc2Zvcm0oZ3JhcGgpIHtcbiAgaWYoZ3JhcGgpIE5vZGUucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIHJldHVybiB0aGlzO1xufVxuXG5UcmFuc2Zvcm0uYWRkUGFyYW1ldGVycyA9IGZ1bmN0aW9uKHByb3RvLCBwYXJhbXMpIHtcbiAgdmFyIHA7XG4gIGZvciAodmFyIG5hbWUgaW4gcGFyYW1zKSB7XG4gICAgcCA9IHBhcmFtc1tuYW1lXTtcbiAgICBwcm90b1tuYW1lXSA9IG5ldyBQYXJhbWV0ZXIobmFtZSwgcC50eXBlKTtcbiAgICBpZihwLmRlZmF1bHQpIHByb3RvW25hbWVdLnNldChwcm90bywgcC5kZWZhdWx0KTtcbiAgfVxuICBwcm90by5fcGFyYW1ldGVycyA9IHBhcmFtcztcbn07XG5cbnZhciBwcm90byA9IChUcmFuc2Zvcm0ucHJvdG90eXBlID0gbmV3IE5vZGUoKSk7XG5cbnByb3RvLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gIHZhciBuID0gTm9kZS5wcm90b3R5cGUuY2xvbmUuY2FsbCh0aGlzKTtcbiAgbi50cmFuc2Zvcm0gPSB0aGlzLnRyYW5zZm9ybTtcbiAgbi5fcGFyYW1ldGVycyA9IHRoaXMuX3BhcmFtZXRlcnM7XG4gIGZvcih2YXIgayBpbiB0aGlzKSB7IFxuICAgIGlmKG5ba10pIGNvbnRpbnVlO1xuICAgIG5ba10gPSB0aGlzW2tdOyBcbiAgfVxuICByZXR1cm4gbjtcbn07XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0LCByZXNldCkgeyByZXR1cm4gaW5wdXQ7IH07XG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIC8vIE1hbnkgdHJhbnNmb3JtcyBzdG9yZSBjYWNoZXMgdGhhdCBtdXN0IGJlIGludmFsaWRhdGVkIGlmXG4gIC8vIGEgc2lnbmFsIHZhbHVlIGhhcyBjaGFuZ2VkLiBcbiAgdmFyIHJlc2V0ID0gdGhpcy5fc3RhbXAgPCBpbnB1dC5zdGFtcCAmJiB0aGlzLmRlcGVuZGVuY3koQy5TSUdOQUxTKS5zb21lKGZ1bmN0aW9uKHMpIHsgXG4gICAgcmV0dXJuICEhaW5wdXQuc2lnbmFsc1tzXSBcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXMudHJhbnNmb3JtKGlucHV0LCByZXNldCk7XG59O1xuXG5wcm90by5vdXRwdXQgPSBmdW5jdGlvbihtYXApIHtcbiAgZm9yICh2YXIga2V5IGluIHRoaXMuX291dHB1dCkge1xuICAgIGlmIChtYXBba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9vdXRwdXRba2V5XSA9IG1hcFtrZXldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmb3JtOyIsInZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxuICAgIEdyb3VwQnkgPSByZXF1aXJlKCcuL0dyb3VwQnknKSxcbiAgICB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyk7XG5cbmZ1bmN0aW9uIFVuaXF1ZShncmFwaCkge1xuICBHcm91cEJ5LnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgZ3JhcGgpO1xuICBUcmFuc2Zvcm0uYWRkUGFyYW1ldGVycyh0aGlzLCB7XG4gICAgZmllbGQ6IHt0eXBlOiBcImZpZWxkXCJ9LFxuICAgIGFzOiB7dHlwZTogXCJ2YWx1ZVwifVxuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn1cblxudmFyIHByb3RvID0gKFVuaXF1ZS5wcm90b3R5cGUgPSBuZXcgR3JvdXBCeSgpKTtcblxucHJvdG8uX25ld190dXBsZSA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIG8gID0ge30sXG4gICAgICBvbiA9IHRoaXMuZmllbGQuZ2V0KHRoaXMuX2dyYXBoKSxcbiAgICAgIGFzID0gdGhpcy5hcy5nZXQodGhpcy5fZ3JhcGgpO1xuXG4gIG9bYXNdID0gb24uYWNjZXNzb3IoeCk7XG4gIHJldHVybiB0dXBsZS5pbmdlc3QobywgbnVsbCk7XG59O1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCwgcmVzZXQpIHtcbiAgZGVidWcoaW5wdXQsIFtcInVuaXF1ZXNcIl0pO1xuICB0aGlzLl9nYiA9IHRoaXMuZmllbGQuZ2V0KHRoaXMuX2dyYXBoKTtcbiAgcmV0dXJuIEdyb3VwQnkucHJvdG90eXBlLnRyYW5zZm9ybS5jYWxsKHRoaXMsIGlucHV0LCByZXNldCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVuaXF1ZTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICBDb2xsZWN0b3IgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Db2xsZWN0b3InKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKTtcblxuZnVuY3Rpb24gWmlwKGdyYXBoKSB7XG4gIFRyYW5zZm9ybS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgVHJhbnNmb3JtLmFkZFBhcmFtZXRlcnModGhpcywge1xuICAgIHdpdGg6IHt0eXBlOiBcImRhdGFcIn0sXG4gICAgYXM6ICB7dHlwZTogXCJ2YWx1ZVwifSxcbiAgICBrZXk6IHt0eXBlOiBcImZpZWxkXCIsIGRlZmF1bHQ6IFwiZGF0YVwifSxcbiAgICB3aXRoS2V5OiB7dHlwZTogXCJmaWVsZFwiLCBkZWZhdWx0OiBudWxsfSxcbiAgICBkZWZhdWx0OiB7dHlwZTogXCJ2YWx1ZVwifVxuICB9KTtcblxuICB0aGlzLl9tYXAgPSB7fTtcbiAgdGhpcy5fY29sbGVjdG9yID0gbmV3IENvbGxlY3RvcihncmFwaCk7XG4gIHRoaXMuX2xhc3RKb2luID0gMDtcblxuICByZXR1cm4gdGhpcy5yZXZpc2VzKHRydWUpO1xufVxuXG52YXIgcHJvdG8gPSAoWmlwLnByb3RvdHlwZSA9IG5ldyBUcmFuc2Zvcm0oKSk7XG5cbmZ1bmN0aW9uIG1wKGspIHtcbiAgcmV0dXJuIHRoaXMuX21hcFtrXSB8fCAodGhpcy5fbWFwW2tdID0gW10pO1xufTtcblxucHJvdG8udHJhbnNmb3JtID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHcgPSB0aGlzLndpdGguZ2V0KHRoaXMuX2dyYXBoKSxcbiAgICAgIHdkcyA9IHcuc291cmNlLFxuICAgICAgd291dHB1dCA9IHdkcy5sYXN0KCksXG4gICAgICB3ZGF0YSA9IHdkcy52YWx1ZXMoKSxcbiAgICAgIGtleSA9IHRoaXMua2V5LmdldCh0aGlzLl9ncmFwaCksXG4gICAgICB3aXRoS2V5ID0gdGhpcy53aXRoS2V5LmdldCh0aGlzLl9ncmFwaCksXG4gICAgICBhcyA9IHRoaXMuYXMuZ2V0KHRoaXMuX2dyYXBoKSxcbiAgICAgIGRmbHQgPSB0aGlzLmRlZmF1bHQuZ2V0KHRoaXMuX2dyYXBoKSxcbiAgICAgIG1hcCA9IG1wLmJpbmQodGhpcyksXG4gICAgICByZW0gPSB7fTtcblxuICBkZWJ1ZyhpbnB1dCwgW1wiemlwcGluZ1wiLCB3Lm5hbWVdKTtcblxuICBpZih3aXRoS2V5LmZpZWxkKSB7XG4gICAgaWYod291dHB1dCAmJiB3b3V0cHV0LnN0YW1wID4gdGhpcy5fbGFzdEpvaW4pIHtcbiAgICAgIHdvdXRwdXQucmVtLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgICAgICB2YXIgbSA9IG1hcCh3aXRoS2V5LmFjY2Vzc29yKHgpKTtcbiAgICAgICAgaWYobVswXSkgbVswXS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgZFthc10gPSBkZmx0IH0pO1xuICAgICAgICBtWzFdID0gbnVsbDtcbiAgICAgIH0pO1xuXG4gICAgICB3b3V0cHV0LmFkZC5mb3JFYWNoKGZ1bmN0aW9uKHgpIHsgXG4gICAgICAgIHZhciBtID0gbWFwKHdpdGhLZXkuYWNjZXNzb3IoeCkpO1xuICAgICAgICBpZihtWzBdKSBtWzBdLmZvckVhY2goZnVuY3Rpb24oZCkgeyBkW2FzXSA9IHggfSk7XG4gICAgICAgIG1bMV0gPSB4O1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIE9ubHkgcHJvY2VzcyB3b3V0cHV0Lm1vZCB0dXBsZXMgaWYgdGhlIGpvaW4ga2V5IGhhcyBjaGFuZ2VkLlxuICAgICAgLy8gT3RoZXIgZmllbGQgdXBkYXRlcyB3aWxsIGF1dG8tcHJvcGFnYXRlIHZpYSBwcm90b3R5cGUuXG4gICAgICBpZih3b3V0cHV0LmZpZWxkc1t3aXRoS2V5LmZpZWxkXSkge1xuICAgICAgICB3b3V0cHV0Lm1vZC5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICB2YXIgcHJldjtcbiAgICAgICAgICBpZigheC5fcHJldiB8fCAocHJldiA9IHdpdGhLZXkuYWNjZXNzb3IoeC5fcHJldikpID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICAgICAgICB2YXIgcHJldm0gPSBtYXAocHJldik7XG4gICAgICAgICAgaWYocHJldm1bMF0pIHByZXZtWzBdLmZvckVhY2goZnVuY3Rpb24oZCkgeyBkW2FzXSA9IGRmbHQgfSk7XG4gICAgICAgICAgcHJldm1bMV0gPSBudWxsO1xuXG4gICAgICAgICAgdmFyIG0gPSBtYXAod2l0aEtleS5hY2Nlc3Nvcih4KSk7XG4gICAgICAgICAgaWYobVswXSkgbVswXS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgZFthc10gPSB4IH0pO1xuICAgICAgICAgIG1bMV0gPSB4O1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fbGFzdEpvaW4gPSB3b3V0cHV0LnN0YW1wO1xuICAgIH1cbiAgXG4gICAgaW5wdXQuYWRkLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgICAgdmFyIG0gPSBtYXAoa2V5LmFjY2Vzc29yKHgpKTtcbiAgICAgIHhbYXNdID0gbVsxXSB8fCBkZmx0O1xuICAgICAgKG1bMF09bVswXXx8W10pLnB1c2goeCk7XG4gICAgfSk7XG5cbiAgICBpbnB1dC5yZW0uZm9yRWFjaChmdW5jdGlvbih4KSB7IFxuICAgICAgdmFyIGsgPSBrZXkuYWNjZXNzb3IoeCk7XG4gICAgICAocmVtW2tdPXJlbVtrXXx8e30pW3guX2lkXSA9IDE7XG4gICAgfSk7XG5cbiAgICBpZihpbnB1dC5maWVsZHNba2V5LmZpZWxkXSkge1xuICAgICAgaW5wdXQubW9kLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgICAgICB2YXIgcHJldjtcbiAgICAgICAgaWYoIXguX3ByZXYgfHwgKHByZXYgPSBrZXkuYWNjZXNzb3IoeC5fcHJldikpID09PSB1bmRlZmluZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgbSA9IG1hcChrZXkuYWNjZXNzb3IoeCkpO1xuICAgICAgICB4W2FzXSA9IG1bMV0gfHwgZGZsdDtcbiAgICAgICAgKG1bMF09bVswXXx8W10pLnB1c2goeCk7XG4gICAgICAgIChyZW1bcHJldl09cmVtW3ByZXZdfHx7fSlbeC5faWRdID0gMTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGRsLmtleXMocmVtKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHsgXG4gICAgICB2YXIgbSA9IG1hcChrKTtcbiAgICAgIGlmKCFtWzBdKSByZXR1cm47XG4gICAgICBtWzBdID0gbVswXS5maWx0ZXIoZnVuY3Rpb24oeCkgeyByZXR1cm4gcmVtW2tdW3guX2lkXSAhPT0gMSB9KTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXZSBvbmx5IG5lZWQgdG8gcnVuIGEgbm9uLWtleS1qb2luIGFnYWluIGlmIHdlJ3ZlIGdvdCBhbnkgYWRkL3JlbVxuICAgIC8vIG9uIGlucHV0IG9yIHdvdXRwdXRcbiAgICBpZihpbnB1dC5hZGQubGVuZ3RoID09IDAgJiYgaW5wdXQucmVtLmxlbmd0aCA9PSAwICYmIFxuICAgICAgICB3b3V0cHV0LmFkZC5sZW5ndGggPT0gMCAmJiB3b3V0cHV0LnJlbS5sZW5ndGggPT0gMCkgcmV0dXJuIGlucHV0O1xuXG4gICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhIGtleS1qb2luLCB0aGVuIHdlIG5lZWQgdG8gbWF0ZXJpYWxpemUgYm90aFxuICAgIC8vIGRhdGEgc291cmNlcyB0byBpdGVyYXRlIHRocm91Z2ggdGhlbS4gXG4gICAgdGhpcy5fY29sbGVjdG9yLmV2YWx1YXRlKGlucHV0KTtcblxuICAgIHZhciBkYXRhID0gdGhpcy5fY29sbGVjdG9yLmRhdGEoKSwgXG4gICAgICAgIHdsZW4gPSB3ZGF0YS5sZW5ndGgsIGk7XG5cbiAgICBmb3IoaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7IGRhdGFbaV1bYXNdID0gd2RhdGFbaSV3bGVuXTsgfVxuICB9XG5cbiAgaW5wdXQuZmllbGRzW2FzXSA9IDE7XG4gIHJldHVybiBpbnB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gWmlwOyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBhZ2dyZWdhdGU6ICByZXF1aXJlKCcuL0FnZ3JlZ2F0ZScpLFxuICBiaW46ICAgICAgICByZXF1aXJlKCcuL0JpbicpLFxuICBjcm9zczogICAgICByZXF1aXJlKCcuL0Nyb3NzJyksXG4gIGZhY2V0OiAgICAgIHJlcXVpcmUoJy4vRmFjZXQnKSxcbiAgZmlsdGVyOiAgICAgcmVxdWlyZSgnLi9GaWx0ZXInKSxcbiAgZm9sZDogICAgICAgcmVxdWlyZSgnLi9Gb2xkJyksXG4gIGZvcmNlOiAgICAgIHJlcXVpcmUoJy4vRm9yY2UnKSxcbiAgZm9ybXVsYTogICAgcmVxdWlyZSgnLi9Gb3JtdWxhJyksXG4gIHNvcnQ6ICAgICAgIHJlcXVpcmUoJy4vU29ydCcpLFxuICBzdGFjazogICAgICByZXF1aXJlKCcuL1N0YWNrJyksXG4gIHVuaXF1ZTogICAgIHJlcXVpcmUoJy4vVW5pcXVlJyksXG4gIHppcDogICAgICAgIHJlcXVpcmUoJy4vWmlwJylcbn07IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIHR1cGxlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvdHVwbGUnKSxcbiAgICBxdWlja3NlbGVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVpY2tzZWxlY3QnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxudmFyIHR5cGVzID0ge1xuICBcImNvdW50XCI6IG1lYXN1cmUoe1xuICAgIG5hbWU6IFwiY291bnRcIixcbiAgICBpbml0OiBcIlwiLFxuICAgIGFkZDogIFwiXCIsXG4gICAgcmVtOiAgXCJcIixcbiAgICBzZXQ6ICBcInRoaXMuY2VsbC5jbnRcIlxuICB9KSxcbiAgXCJfY291bnRzXCI6IG1lYXN1cmUoe1xuICAgIG5hbWU6IFwiX2NvdW50c1wiLFxuICAgIGluaXQ6IFwidGhpcy5jbnRzID0ge307XCIsXG4gICAgYWRkOiAgXCJ0aGlzLmNudHNbdl0gPSArK3RoaXMuY250c1t2XSB8fCAxO1wiLFxuICAgIHJlbTogIFwidGhpcy5jbnRzW3ZdID0gLS10aGlzLmNudHNbdl0gPCAwID8gMCA6IHRoaXMuY250c1t2XTtcIixcbiAgICBzZXQ6ICBcIlwiLFxuICAgIHJlcTogIFtcImNvdW50XCJdXG4gIH0pLFxuICBcInN1bVwiOiBtZWFzdXJlKHtcbiAgICBuYW1lOiBcInN1bVwiLFxuICAgIGluaXQ6IFwidGhpcy5zdW0gPSAwO1wiLFxuICAgIGFkZDogIFwidGhpcy5zdW0gKz0gdjtcIixcbiAgICByZW06ICBcInRoaXMuc3VtIC09IHY7XCIsXG4gICAgc2V0OiAgXCJ0aGlzLnN1bVwiXG4gIH0pLFxuICBcImF2Z1wiOiBtZWFzdXJlKHtcbiAgICBuYW1lOiBcImF2Z1wiLFxuICAgIGluaXQ6IFwidGhpcy5hdmcgPSAwO1wiLFxuICAgIGFkZDogIFwidmFyIGQgPSB2IC0gdGhpcy5hdmc7IHRoaXMuYXZnICs9IGQgLyB0aGlzLmNlbGwuY250O1wiLFxuICAgIHJlbTogIFwidmFyIGQgPSB2IC0gdGhpcy5hdmc7IHRoaXMuYXZnIC09IGQgLyB0aGlzLmNlbGwuY250O1wiLFxuICAgIHNldDogIFwidGhpcy5hdmdcIixcbiAgICByZXE6ICBbXCJjb3VudFwiXSwgaWR4OiAxXG4gIH0pLFxuICBcInZhclwiOiBtZWFzdXJlKHtcbiAgICBuYW1lOiBcInZhclwiLFxuICAgIGluaXQ6IFwidGhpcy5kZXYgPSAwO1wiLFxuICAgIGFkZDogIFwidGhpcy5kZXYgKz0gZCAqICh2IC0gdGhpcy5hdmcpO1wiLFxuICAgIHJlbTogIFwidGhpcy5kZXYgLT0gZCAqICh2IC0gdGhpcy5hdmcpO1wiLFxuICAgIHNldDogIFwidGhpcy5kZXYgLyAodGhpcy5jZWxsLmNudC0xKVwiLFxuICAgIHJlcTogIFtcImF2Z1wiXSwgaWR4OiAyXG4gIH0pLFxuICBcInZhcnBcIjogbWVhc3VyZSh7XG4gICAgbmFtZTogXCJ2YXJwXCIsXG4gICAgaW5pdDogXCJcIixcbiAgICBhZGQ6ICBcIlwiLFxuICAgIHJlbTogIFwiXCIsXG4gICAgc2V0OiAgXCJ0aGlzLmRldiAvIHRoaXMuY2VsbC5jbnRcIixcbiAgICByZXE6ICBbXCJ2YXJcIl0sIGlkeDogM1xuICB9KSxcbiAgXCJzdGRldlwiOiBtZWFzdXJlKHtcbiAgICBuYW1lOiBcInN0ZGV2XCIsXG4gICAgaW5pdDogXCJcIixcbiAgICBhZGQ6ICBcIlwiLFxuICAgIHJlbTogIFwiXCIsXG4gICAgc2V0OiAgXCJNYXRoLnNxcnQodGhpcy5kZXYgLyAodGhpcy5jZWxsLmNudC0xKSlcIixcbiAgICByZXE6ICBbXCJ2YXJcIl0sIGlkeDogNFxuICB9KSxcbiAgXCJzdGRldnBcIjogbWVhc3VyZSh7XG4gICAgbmFtZTogXCJzdGRldnBcIixcbiAgICBpbml0OiBcIlwiLFxuICAgIGFkZDogIFwiXCIsXG4gICAgcmVtOiAgXCJcIixcbiAgICBzZXQ6ICBcIk1hdGguc3FydCh0aGlzLmRldiAvIHRoaXMuY2VsbC5jbnQpXCIsXG4gICAgcmVxOiAgW1widmFyXCJdLCBpZHg6IDVcbiAgfSksXG4gIFwibWluXCI6IG1lYXN1cmUoe1xuICAgIG5hbWU6IFwibWluXCIsXG4gICAgaW5pdDogXCJ0aGlzLm1pbiA9ICtJbmZpbml0eTtcIixcbiAgICBhZGQ6ICBcInRoaXMubWluID0gdiA8IHRoaXMubWluID8gdiA6IHRoaXMubWluO1wiLFxuICAgIHJlbTogIFwidmFyIHNlbGYgPSB0aGlzOyB0aGlzLm1pbiA9IHYgPT0gdGhpcy5taW4gXCIgK1xuICAgICAgICAgIFwiPyB0aGlzLmtleXModGhpcy5jbnRzKS5yZWR1Y2UoZnVuY3Rpb24obSwgdikgeyBcIiArXG4gICAgICAgICAgXCIgICByZXR1cm4gc2VsZi5jbnRzWyh2ID0gK3YpXSA+IDAgJiYgdiA8IG0gPyB2IDogbSB9LCArSW5maW5pdHkpIFwiICsgXG4gICAgICAgICAgXCI6IHRoaXMubWluO1wiLFxuICAgIHNldDogIFwidGhpcy5taW5cIixcbiAgICByZXE6IFtcIl9jb3VudHNcIl0sIGlkeDogNlxuICB9KSxcbiAgXCJtYXhcIjogbWVhc3VyZSh7XG4gICAgbmFtZTogXCJtYXhcIixcbiAgICBpbml0OiBcInRoaXMubWF4ID0gLUluZmluaXR5O1wiLFxuICAgIGFkZDogIFwidGhpcy5tYXggPSB2ID4gdGhpcy5tYXggPyB2IDogdGhpcy5tYXg7XCIsXG4gICAgcmVtOiAgXCJ2YXIgc2VsZiA9IHRoaXM7IHRoaXMubWF4ID0gdiA9PSB0aGlzLm1heCBcIiArXG4gICAgICAgICAgXCI/IHRoaXMua2V5cyh0aGlzLmNudHMpLnJlZHVjZShmdW5jdGlvbihtLCB2KSB7IFwiICtcbiAgICAgICAgICBcIiAgIHJldHVybiBzZWxmLmNudHNbKHYgPSArdildID4gMCAmJiB2ID4gbSA/IHYgOiBtIH0sIC1JbmZpbml0eSkgXCIgKyBcbiAgICAgICAgICBcIjogdGhpcy5tYXg7XCIsXG4gICAgc2V0OiAgXCJ0aGlzLm1heFwiLFxuICAgIHJlcTogW1wiX2NvdW50c1wiXSwgaWR4OiA3XG4gIH0pLFxuICBcIm1lZGlhblwiOiBtZWFzdXJlKHtcbiAgICBuYW1lOiBcIm1lZGlhblwiLFxuICAgIGluaXQ6IFwidGhpcy52YWxzID0gW107IFwiLFxuICAgIGFkZDogIFwiaWYodGhpcy52YWxzKSB0aGlzLnZhbHMucHVzaCh2KTsgXCIsXG4gICAgcmVtOiAgXCJ0aGlzLnZhbHMgPSBudWxsO1wiLFxuICAgIHNldDogIFwidGhpcy5jZWxsLmNudCAlIDIgPyB0aGlzLnNlbCh+fih0aGlzLmNlbGwuY250LzIpLCB0aGlzLnZhbHMsIHRoaXMuY250cykgOiBcIitcbiAgICAgICAgICBcIjAuNSAqICh0aGlzLnNlbCh+fih0aGlzLmNlbGwuY250LzIpLTEsIHRoaXMudmFscywgdGhpcy5jbnRzKSArIHRoaXMuc2VsKH5+KHRoaXMuY2VsbC5jbnQvMiksIHRoaXMudmFscywgdGhpcy5jbnRzKSlcIixcbiAgICByZXE6IFtcIl9jb3VudHNcIl0sIGlkeDogOFxuICB9KVxufTtcblxuZnVuY3Rpb24gbWVhc3VyZShiYXNlKSB7XG4gIHJldHVybiBmdW5jdGlvbihvdXQpIHtcbiAgICB2YXIgbSA9IE9iamVjdC5jcmVhdGUoYmFzZSk7XG4gICAgbS5vdXQgPSBvdXQgfHwgYmFzZS5uYW1lO1xuICAgIGlmICghbS5pZHgpIG0uaWR4ID0gMDtcbiAgICByZXR1cm4gbTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZShhZ2cpIHtcbiAgZnVuY3Rpb24gY29sbGVjdChtLCBhKSB7XG4gICAgKGEucmVxIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHIpIHtcbiAgICAgIGlmICghbVtyXSkgY29sbGVjdChtLCBtW3JdID0gdHlwZXNbcl0oKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG07XG4gIH1cbiAgdmFyIG1hcCA9IGFnZy5yZWR1Y2UoY29sbGVjdCxcbiAgICBhZ2cucmVkdWNlKGZ1bmN0aW9uKG0sIGEpIHsgcmV0dXJuIChtW2EubmFtZV0gPSBhLCBtKTsgfSwge30pKTtcbiAgdmFyIGFsbCA9IFtdO1xuICBmb3IgKHZhciBrIGluIG1hcCkgYWxsLnB1c2gobWFwW2tdKTtcbiAgYWxsLnNvcnQoZnVuY3Rpb24oYSxiKSB7IHJldHVybiBhLmlkeCAtIGIuaWR4OyB9KTtcbiAgcmV0dXJuIGFsbDtcbn1cblxuZnVuY3Rpb24gY29tcGlsZShhZ2cpIHtcbiAgdmFyIGFsbCA9IHJlc29sdmUoYWdnKSxcbiAgICAgIGN0ciA9IFwidGhpcy50cGwgPSB0OyB0aGlzLmNlbGwgPSBjO1wiLFxuICAgICAgYWRkID0gXCJcIixcbiAgICAgIHJlbSA9IFwiXCIsXG4gICAgICBzZXQgPSBcInZhciB0ID0gdGhpcy50cGw7XCI7XG5cbiAgYWxsLmZvckVhY2goZnVuY3Rpb24oYSkgeyBjdHIgKz0gYS5pbml0OyBhZGQgKz0gYS5hZGQ7IHJlbSArPSBhLnJlbTsgfSk7XG4gIGFnZy5mb3JFYWNoKGZ1bmN0aW9uKGEpIHsgc2V0ICs9IFwidGhpcy50dXBsZS5zZXQodCwnXCIrYS5vdXQrXCInLFwiK2Euc2V0K1wiKTtcIjsgfSk7XG4gIHNldCArPSBcInJldHVybiB0O1wiO1xuXG4gIGN0ciA9IEZ1bmN0aW9uKFwiY1wiLCBcInRcIiwgY3RyKTtcbiAgY3RyLnByb3RvdHlwZS5hZGQgPSBGdW5jdGlvbihcInZcIiwgYWRkKTtcbiAgY3RyLnByb3RvdHlwZS5yZW0gPSBGdW5jdGlvbihcInZcIiwgcmVtKTtcbiAgY3RyLnByb3RvdHlwZS5zZXQgPSBGdW5jdGlvbihcInN0YW1wXCIsIHNldCk7XG4gIGN0ci5wcm90b3R5cGUubW9kID0gbW9kO1xuICBjdHIucHJvdG90eXBlLmtleXMgPSBkbC5rZXlzO1xuICBjdHIucHJvdG90eXBlLnNlbCA9IHF1aWNrc2VsZWN0O1xuICBjdHIucHJvdG90eXBlLnR1cGxlID0gdHVwbGU7XG4gIHJldHVybiBjdHI7XG59XG5cbmZ1bmN0aW9uIG1vZCh2X25ldywgdl9vbGQpIHtcbiAgaWYgKHZfb2xkID09PSB1bmRlZmluZWQgfHwgdl9vbGQgPT09IHZfbmV3KSByZXR1cm47XG4gIHRoaXMucmVtKHZfb2xkKTtcbiAgdGhpcy5hZGQodl9uZXcpO1xufTtcblxudHlwZXMuY3JlYXRlICAgPSBjb21waWxlO1xubW9kdWxlLmV4cG9ydHMgPSB0eXBlczsiLCJ2YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgICBCb3VuZHMgPSByZXF1aXJlKCcuLi9jb3JlL0JvdW5kcycpLFxuICAgIGNhbnZhcyA9IHJlcXVpcmUoJy4uL3JlbmRlci9jYW52YXMvcGF0aCcpLFxuICAgIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG5cbnZhciBwYXJzZSA9IGNhbnZhcy5wYXJzZSxcbiAgICBib3VuZFBhdGggPSBjYW52YXMuYm91bmRzLFxuICAgIGFyZWFQYXRoID0gY2FudmFzLmFyZWEsXG4gICAgbGluZVBhdGggPSBjYW52YXMubGluZSxcbiAgICBoYWxmcGkgPSBNYXRoLlBJIC8gMixcbiAgICBzcXJ0MyA9IE1hdGguc3FydCgzKSxcbiAgICB0YW4zMCA9IE1hdGgudGFuKDMwICogTWF0aC5QSSAvIDE4MCksXG4gICAgZ2Z4ID0gbnVsbDtcblxuZnVuY3Rpb24gZm9udFN0cmluZyhvKSB7XG4gIHJldHVybiAoby5mb250U3R5bGUgPyBvLmZvbnRTdHlsZSArIFwiIFwiIDogXCJcIilcbiAgICArIChvLmZvbnRWYXJpYW50ID8gby5mb250VmFyaWFudCArIFwiIFwiIDogXCJcIilcbiAgICArIChvLmZvbnRXZWlnaHQgPyBvLmZvbnRXZWlnaHQgKyBcIiBcIiA6IFwiXCIpXG4gICAgKyAoby5mb250U2l6ZSAhPSBudWxsID8gby5mb250U2l6ZSA6IGNvbmZpZy5yZW5kZXIuZm9udFNpemUpICsgXCJweCBcIlxuICAgICsgKG8uZm9udCB8fCBjb25maWcucmVuZGVyLmZvbnQpO1xufVxuXG5mdW5jdGlvbiBjb250ZXh0KCkge1xuICAvLyBUT0RPOiBob3cgdG8gY2hlY2sgaWYgbm9kZUpTIGluIHJlcXVpcmVKUz9cbiAgcmV0dXJuIGdmeCB8fCAoZ2Z4ID0gKC8qY29uZmlnLmlzTm9kZVxuICAgID8gbmV3IChyZXF1aXJlKFwiY2FudmFzXCIpKSgxLDEpXG4gICAgOiAqL2QzLnNlbGVjdChcImJvZHlcIikuYXBwZW5kKFwiY2FudmFzXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ2ZWdhX2hpZGRlblwiKVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIDEpXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIDEpXG4gICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpXG4gICAgICAgIC5ub2RlKCkpXG4gICAgLmdldENvbnRleHQoXCIyZFwiKSk7XG59XG5cbmZ1bmN0aW9uIHBhdGhCb3VuZHMobywgcGF0aCwgYm91bmRzKSB7XG4gIGlmIChwYXRoID09IG51bGwpIHtcbiAgICBib3VuZHMuc2V0KDAsIDAsIDAsIDApO1xuICB9IGVsc2Uge1xuICAgIGJvdW5kUGF0aChwYXRoLCBib3VuZHMpO1xuICAgIGlmIChvLnN0cm9rZSAmJiBvLm9wYWNpdHkgIT09IDAgJiYgby5zdHJva2VXaWR0aCA+IDApIHtcbiAgICAgIGJvdW5kcy5leHBhbmQoby5zdHJva2VXaWR0aCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBib3VuZHM7XG59XG5cbmZ1bmN0aW9uIHBhdGgobywgYm91bmRzKSB7XG4gIHZhciBwID0gby5wYXRoXG4gICAgPyBvLnBhdGhDYWNoZSB8fCAoby5wYXRoQ2FjaGUgPSBwYXJzZShvLnBhdGgpKVxuICAgIDogbnVsbDtcbiAgcmV0dXJuIHBhdGhCb3VuZHMobywgcCwgYm91bmRzKTtcbn1cblxuZnVuY3Rpb24gYXJlYShvLCBib3VuZHMpIHtcbiAgdmFyIGl0ZW1zID0gby5tYXJrLml0ZW1zLCBvID0gaXRlbXNbMF07XG4gIHZhciBwID0gby5wYXRoQ2FjaGUgfHwgKG8ucGF0aENhY2hlID0gcGFyc2UoYXJlYVBhdGgoaXRlbXMpKSk7XG4gIHJldHVybiBwYXRoQm91bmRzKGl0ZW1zWzBdLCBwLCBib3VuZHMpO1xufVxuXG5mdW5jdGlvbiBsaW5lKG8sIGJvdW5kcykge1xuICB2YXIgaXRlbXMgPSBvLm1hcmsuaXRlbXMsIG8gPSBpdGVtc1swXTtcbiAgdmFyIHAgPSBvLnBhdGhDYWNoZSB8fCAoby5wYXRoQ2FjaGUgPSBwYXJzZShsaW5lUGF0aChpdGVtcykpKTtcbiAgcmV0dXJuIHBhdGhCb3VuZHMoaXRlbXNbMF0sIHAsIGJvdW5kcyk7XG59XG5cbmZ1bmN0aW9uIHJlY3QobywgYm91bmRzKSB7XG4gIHZhciB4ID0gby54IHx8IDAsXG4gICAgICB5ID0gby55IHx8IDAsXG4gICAgICB3ID0gKHggKyBvLndpZHRoKSB8fCAwLFxuICAgICAgaCA9ICh5ICsgby5oZWlnaHQpIHx8IDA7XG4gIGJvdW5kcy5zZXQoeCwgeSwgdywgaCk7XG4gIGlmIChvLnN0cm9rZSAmJiBvLm9wYWNpdHkgIT09IDAgJiYgby5zdHJva2VXaWR0aCA+IDApIHtcbiAgICBib3VuZHMuZXhwYW5kKG8uc3Ryb2tlV2lkdGgpO1xuICB9XG4gIHJldHVybiBib3VuZHM7XG59XG5cbmZ1bmN0aW9uIGltYWdlKG8sIGJvdW5kcykge1xuICB2YXIgdyA9IG8ud2lkdGggfHwgMCxcbiAgICAgIGggPSBvLmhlaWdodCB8fCAwLFxuICAgICAgeCA9IChvLnh8fDApIC0gKG8uYWxpZ24gPT09IFwiY2VudGVyXCJcbiAgICAgICAgICA/IHcvMiA6IChvLmFsaWduID09PSBcInJpZ2h0XCIgPyB3IDogMCkpLFxuICAgICAgeSA9IChvLnl8fDApIC0gKG8uYmFzZWxpbmUgPT09IFwibWlkZGxlXCJcbiAgICAgICAgICA/IGgvMiA6IChvLmJhc2VsaW5lID09PSBcImJvdHRvbVwiID8gaCA6IDApKTtcbiAgcmV0dXJuIGJvdW5kcy5zZXQoeCwgeSwgeCt3LCB5K2gpO1xufVxuXG5mdW5jdGlvbiBydWxlKG8sIGJvdW5kcykge1xuICB2YXIgeDEsIHkxO1xuICBib3VuZHMuc2V0KFxuICAgIHgxID0gby54IHx8IDAsXG4gICAgeTEgPSBvLnkgfHwgMCxcbiAgICBvLngyICE9IG51bGwgPyBvLngyIDogeDEsXG4gICAgby55MiAhPSBudWxsID8gby55MiA6IHkxXG4gICk7XG4gIGlmIChvLnN0cm9rZSAmJiBvLm9wYWNpdHkgIT09IDAgJiYgby5zdHJva2VXaWR0aCA+IDApIHtcbiAgICBib3VuZHMuZXhwYW5kKG8uc3Ryb2tlV2lkdGgpO1xuICB9XG4gIHJldHVybiBib3VuZHM7XG59XG5cbmZ1bmN0aW9uIGFyYyhvLCBib3VuZHMpIHtcbiAgdmFyIGN4ID0gby54IHx8IDAsXG4gICAgICBjeSA9IG8ueSB8fCAwLFxuICAgICAgaXIgPSBvLmlubmVyUmFkaXVzIHx8IDAsXG4gICAgICBvciA9IG8ub3V0ZXJSYWRpdXMgfHwgMCxcbiAgICAgIHNhID0gKG8uc3RhcnRBbmdsZSB8fCAwKSAtIGhhbGZwaSxcbiAgICAgIGVhID0gKG8uZW5kQW5nbGUgfHwgMCkgLSBoYWxmcGksXG4gICAgICB4bWluID0gSW5maW5pdHksIHhtYXggPSAtSW5maW5pdHksXG4gICAgICB5bWluID0gSW5maW5pdHksIHltYXggPSAtSW5maW5pdHksXG4gICAgICBhLCBpLCBuLCB4LCB5LCBpeCwgaXksIG94LCBveTtcblxuICB2YXIgYW5nbGVzID0gW3NhLCBlYV0sXG4gICAgICBzID0gc2EgLSAoc2ElaGFsZnBpKTtcbiAgZm9yIChpPTA7IGk8NCAmJiBzPGVhOyArK2ksIHMrPWhhbGZwaSkge1xuICAgIGFuZ2xlcy5wdXNoKHMpO1xuICB9XG5cbiAgZm9yIChpPTAsIG49YW5nbGVzLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICBhID0gYW5nbGVzW2ldO1xuICAgIHggPSBNYXRoLmNvcyhhKTsgaXggPSBpcip4OyBveCA9IG9yKng7XG4gICAgeSA9IE1hdGguc2luKGEpOyBpeSA9IGlyKnk7IG95ID0gb3IqeTtcbiAgICB4bWluID0gTWF0aC5taW4oeG1pbiwgaXgsIG94KTtcbiAgICB4bWF4ID0gTWF0aC5tYXgoeG1heCwgaXgsIG94KTtcbiAgICB5bWluID0gTWF0aC5taW4oeW1pbiwgaXksIG95KTtcbiAgICB5bWF4ID0gTWF0aC5tYXgoeW1heCwgaXksIG95KTtcbiAgfVxuXG4gIGJvdW5kcy5zZXQoY3greG1pbiwgY3kreW1pbiwgY3greG1heCwgY3kreW1heCk7XG4gIGlmIChvLnN0cm9rZSAmJiBvLm9wYWNpdHkgIT09IDAgJiYgby5zdHJva2VXaWR0aCA+IDApIHtcbiAgICBib3VuZHMuZXhwYW5kKG8uc3Ryb2tlV2lkdGgpO1xuICB9XG4gIHJldHVybiBib3VuZHM7XG59XG5cbmZ1bmN0aW9uIHN5bWJvbChvLCBib3VuZHMpIHtcbiAgdmFyIHNpemUgPSBvLnNpemUgIT0gbnVsbCA/IG8uc2l6ZSA6IDEwMCxcbiAgICAgIHggPSBvLnggfHwgMCxcbiAgICAgIHkgPSBvLnkgfHwgMCxcbiAgICAgIHIsIHQsIHJ4LCByeTtcblxuICBzd2l0Y2ggKG8uc2hhcGUpIHtcbiAgICBjYXNlIFwiY3Jvc3NcIjpcbiAgICAgIHIgPSBNYXRoLnNxcnQoc2l6ZSAvIDUpIC8gMjtcbiAgICAgIHQgPSAzKnI7XG4gICAgICBib3VuZHMuc2V0KHgtdCwgeS1yLCB4K3QsIHkrcik7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgXCJkaWFtb25kXCI6XG4gICAgICByeSA9IE1hdGguc3FydChzaXplIC8gKDIgKiB0YW4zMCkpO1xuICAgICAgcnggPSByeSAqIHRhbjMwO1xuICAgICAgYm91bmRzLnNldCh4LXJ4LCB5LXJ5LCB4K3J4LCB5K3J5KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBcInNxdWFyZVwiOlxuICAgICAgdCA9IE1hdGguc3FydChzaXplKTtcbiAgICAgIHIgPSB0IC8gMjtcbiAgICAgIGJvdW5kcy5zZXQoeC1yLCB5LXIsIHgrciwgeStyKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBcInRyaWFuZ2xlLWRvd25cIjpcbiAgICAgIHJ4ID0gTWF0aC5zcXJ0KHNpemUgLyBzcXJ0Myk7XG4gICAgICByeSA9IHJ4ICogc3FydDMgLyAyO1xuICAgICAgYm91bmRzLnNldCh4LXJ4LCB5LXJ5LCB4K3J4LCB5K3J5KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBcInRyaWFuZ2xlLXVwXCI6XG4gICAgICByeCA9IE1hdGguc3FydChzaXplIC8gc3FydDMpO1xuICAgICAgcnkgPSByeCAqIHNxcnQzIC8gMjtcbiAgICAgIGJvdW5kcy5zZXQoeC1yeCwgeS1yeSwgeCtyeCwgeStyeSk7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gICAgICByID0gTWF0aC5zcXJ0KHNpemUvTWF0aC5QSSk7XG4gICAgICBib3VuZHMuc2V0KHgtciwgeS1yLCB4K3IsIHkrcik7XG4gIH1cbiAgaWYgKG8uc3Ryb2tlICYmIG8ub3BhY2l0eSAhPT0gMCAmJiBvLnN0cm9rZVdpZHRoID4gMCkge1xuICAgIGJvdW5kcy5leHBhbmQoby5zdHJva2VXaWR0aCk7XG4gIH1cbiAgcmV0dXJuIGJvdW5kcztcbn1cblxuZnVuY3Rpb24gdGV4dChvLCBib3VuZHMsIG5vUm90YXRlKSB7XG4gIHZhciB4ID0gKG8ueCB8fCAwKSArIChvLmR4IHx8IDApLFxuICAgICAgeSA9IChvLnkgfHwgMCkgKyAoby5keSB8fCAwKSxcbiAgICAgIGggPSBvLmZvbnRTaXplIHx8IGNvbmZpZy5yZW5kZXIuZm9udFNpemUsXG4gICAgICBhID0gby5hbGlnbixcbiAgICAgIGIgPSBvLmJhc2VsaW5lLFxuICAgICAgciA9IG8ucmFkaXVzIHx8IDAsXG4gICAgICBnID0gY29udGV4dCgpLCB3LCB0O1xuXG4gIGcuZm9udCA9IGZvbnRTdHJpbmcobyk7XG4gIGcudGV4dEFsaWduID0gYSB8fCBcImxlZnRcIjtcbiAgZy50ZXh0QmFzZWxpbmUgPSBiIHx8IFwiYWxwaGFiZXRpY1wiO1xuICB3ID0gZy5tZWFzdXJlVGV4dChvLnRleHQgfHwgXCJcIikud2lkdGg7XG5cbiAgaWYgKHIpIHtcbiAgICB0ID0gKG8udGhldGEgfHwgMCkgLSBNYXRoLlBJLzI7XG4gICAgeCArPSByICogTWF0aC5jb3ModCk7XG4gICAgeSArPSByICogTWF0aC5zaW4odCk7XG4gIH1cblxuICAvLyBob3Jpem9udGFsXG4gIGlmIChhID09PSBcImNlbnRlclwiKSB7XG4gICAgeCA9IHggLSAodyAvIDIpO1xuICB9IGVsc2UgaWYgKGEgPT09IFwicmlnaHRcIikge1xuICAgIHggPSB4IC0gdztcbiAgfSBlbHNlIHtcbiAgICAvLyBsZWZ0IGJ5IGRlZmF1bHQsIGRvIG5vdGhpbmdcbiAgfVxuXG4gIC8vLyBUT0RPIGZpbmQgYSByb2J1c3Qgc29sdXRpb24gZm9yIGhlaWdodHMuXG4gIC8vLyBUaGVzZSBvZmZzZXRzIHdvcmsgZm9yIHNvbWUgYnV0IG5vdCBhbGwgZm9udHMuXG5cbiAgLy8gdmVydGljYWxcbiAgaWYgKGIgPT09IFwidG9wXCIpIHtcbiAgICB5ID0geSArIChoLzUpO1xuICB9IGVsc2UgaWYgKGIgPT09IFwiYm90dG9tXCIpIHtcbiAgICB5ID0geSAtIGg7XG4gIH0gZWxzZSBpZiAoYiA9PT0gXCJtaWRkbGVcIikge1xuICAgIHkgPSB5IC0gKGgvMikgKyAoaC8xMCk7XG4gIH0gZWxzZSB7XG4gICAgeSA9IHkgLSA0KmgvNTsgLy8gYWxwaGFiZXRpYyBieSBkZWZhdWx0XG4gIH1cbiAgXG4gIGJvdW5kcy5zZXQoeCwgeSwgeCt3LCB5K2gpO1xuICBpZiAoby5hbmdsZSAmJiAhbm9Sb3RhdGUpIHtcbiAgICBib3VuZHMucm90YXRlKG8uYW5nbGUqTWF0aC5QSS8xODAsIG8ueHx8MCwgby55fHwwKTtcbiAgfVxuICByZXR1cm4gYm91bmRzLmV4cGFuZChub1JvdGF0ZSA/IDAgOiAxKTtcbn1cblxuZnVuY3Rpb24gZ3JvdXAoZywgYm91bmRzLCBpbmNsdWRlTGVnZW5kcykge1xuICB2YXIgYXhlcyA9IGcuYXhpc0l0ZW1zIHx8IFtdLFxuICAgICAgbGVnZW5kcyA9IGcubGVnZW5kSXRlbXMgfHwgW10sIGosIG07XG5cbiAgZm9yIChqPTAsIG09YXhlcy5sZW5ndGg7IGo8bTsgKytqKSB7XG4gICAgYm91bmRzLnVuaW9uKGF4ZXNbal0uYm91bmRzKTtcbiAgfVxuICBmb3IgKGo9MCwgbT1nLml0ZW1zLmxlbmd0aDsgajxtOyArK2opIHtcbiAgICBib3VuZHMudW5pb24oZy5pdGVtc1tqXS5ib3VuZHMpO1xuICB9XG4gIGlmIChpbmNsdWRlTGVnZW5kcykge1xuICAgIGZvciAoaj0wLCBtPWxlZ2VuZHMubGVuZ3RoOyBqPG07ICsraikge1xuICAgICAgYm91bmRzLnVuaW9uKGxlZ2VuZHNbal0uYm91bmRzKTtcbiAgICB9XG4gICAgaWYgKGcud2lkdGggIT0gbnVsbCAmJiBnLmhlaWdodCAhPSBudWxsKSB7XG4gICAgICBib3VuZHMuYWRkKGcud2lkdGgsIGcuaGVpZ2h0KTtcbiAgICB9XG4gICAgaWYgKGcueCAhPSBudWxsICYmIGcueSAhPSBudWxsKSB7XG4gICAgICBib3VuZHMuYWRkKDAsIDApO1xuICAgIH1cbiAgfVxuICBib3VuZHMudHJhbnNsYXRlKGcueHx8MCwgZy55fHwwKTtcbiAgcmV0dXJuIGJvdW5kcztcbn1cblxudmFyIG1ldGhvZHMgPSB7XG4gIGdyb3VwOiAgZ3JvdXAsXG4gIHN5bWJvbDogc3ltYm9sLFxuICBpbWFnZTogIGltYWdlLFxuICByZWN0OiAgIHJlY3QsXG4gIHJ1bGU6ICAgcnVsZSxcbiAgYXJjOiAgICBhcmMsXG4gIHRleHQ6ICAgdGV4dCxcbiAgcGF0aDogICBwYXRoLFxuICBhcmVhOiAgIGFyZWEsXG4gIGxpbmU6ICAgbGluZVxufTtcblxuZnVuY3Rpb24gaXRlbUJvdW5kcyhpdGVtLCBmdW5jLCBvcHQpIHtcbiAgZnVuYyA9IGZ1bmMgfHwgbWV0aG9kc1tpdGVtLm1hcmsubWFya3R5cGVdO1xuICBpZiAoIWl0ZW0uYm91bmRzX3ByZXYpIGl0ZW1bJ2JvdW5kczpwcmV2J10gPSBuZXcgQm91bmRzKCk7XG4gIHZhciBiID0gaXRlbS5ib3VuZHMsIHBiID0gaXRlbVsnYm91bmRzOnByZXYnXTtcbiAgaWYgKGIpIHBiLmNsZWFyKCkudW5pb24oYik7XG4gIGl0ZW0uYm91bmRzID0gZnVuYyhpdGVtLCBiID8gYi5jbGVhcigpIDogbmV3IEJvdW5kcygpLCBvcHQpO1xuICBpZiAoIWIpIHBiLmNsZWFyKCkudW5pb24oaXRlbS5ib3VuZHMpO1xuICByZXR1cm4gaXRlbS5ib3VuZHM7XG59XG5cbmZ1bmN0aW9uIG1hcmtCb3VuZHMobWFyaywgYm91bmRzLCBvcHQpIHtcbiAgYm91bmRzID0gYm91bmRzIHx8IG1hcmsuYm91bmRzICYmIG1hcmsuYm91bmRzLmNsZWFyKCkgfHwgbmV3IEJvdW5kcygpO1xuICB2YXIgdHlwZSAgPSBtYXJrLm1hcmt0eXBlLFxuICAgICAgZnVuYyAgPSBtZXRob2RzW3R5cGVdLFxuICAgICAgaXRlbXMgPSBtYXJrLml0ZW1zLFxuICAgICAgaXRlbSwgaSwgbGVuO1xuICAgICAgXG4gIGlmICh0eXBlPT09XCJhcmVhXCIgfHwgdHlwZT09PVwibGluZVwiKSB7XG4gICAgaWYgKGl0ZW1zLmxlbmd0aCkge1xuICAgICAgaXRlbXNbMF0uYm91bmRzID0gZnVuYyhpdGVtc1swXSwgYm91bmRzKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yIChpPTAsIGxlbj1pdGVtcy5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICAgIGJvdW5kcy51bmlvbihpdGVtQm91bmRzKGl0ZW1zW2ldLCBmdW5jLCBvcHQpKTtcbiAgICB9XG4gIH1cbiAgbWFyay5ib3VuZHMgPSBib3VuZHM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtYXJrOiAgbWFya0JvdW5kcyxcbiAgaXRlbTogIGl0ZW1Cb3VuZHMsXG4gIHRleHQ6ICB0ZXh0LFxuICBncm91cDogZ3JvdXBcbn07IiwidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgY29uZmlnID0ge307XG5cbmNvbmZpZy5kZWJ1ZyA9IGZhbHNlO1xuXG5jb25maWcubG9hZCA9IHtcbiAgLy8gYmFzZSB1cmwgZm9yIGxvYWRpbmcgZXh0ZXJuYWwgZGF0YSBmaWxlc1xuICAvLyB1c2VkIG9ubHkgZm9yIHNlcnZlci1zaWRlIG9wZXJhdGlvblxuICBiYXNlVVJMOiBcIlwiLFxuICAvLyBBbGxvd3MgZG9tYWluIHJlc3RyaWN0aW9uIHdoZW4gdXNpbmcgZGF0YSBsb2FkaW5nIHZpYSBYSFIuXG4gIC8vIFRvIGVuYWJsZSwgc2V0IGl0IHRvIGEgbGlzdCBvZiBhbGxvd2VkIGRvbWFpbnNcbiAgLy8gZS5nLiwgWyd3aWtpcGVkaWEub3JnJywgJ2VmZi5vcmcnXVxuICBkb21haW5XaGl0ZUxpc3Q6IGZhbHNlXG59O1xuXG4vLyB2ZXJzaW9uIGFuZCBuYW1lcHNhY2VzIGZvciBleHBvcnRlZCBzdmdcbmNvbmZpZy5zdmdOYW1lc3BhY2UgPVxuICAndmVyc2lvbj1cIjEuMVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiAnICtcbiAgJ3htbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiJztcblxuLy8gaW5zZXQgcGFkZGluZyBmb3IgYXV0b21hdGljIHBhZGRpbmcgY2FsY3VsYXRpb25cbmNvbmZpZy5hdXRvcGFkSW5zZXQgPSA1O1xuXG4vLyBleHRlbnNpYmxlIHNjYWxlIGxvb2t1cCB0YWJsZVxuLy8gYWxsIGQzLnNjYWxlLiogaW5zdGFuY2VzIGFsc28gc3VwcG9ydGVkXG5jb25maWcuc2NhbGUgPSB7XG4gIHRpbWU6IGQzLnRpbWUuc2NhbGUsXG4gIHV0YzogIGQzLnRpbWUuc2NhbGUudXRjXG59O1xuXG4vLyBkZWZhdWx0IHJlbmRlcmluZyBzZXR0aW5nc1xuY29uZmlnLnJlbmRlciA9IHtcbiAgbGluZVdpZHRoOiAxLFxuICBsaW5lQ2FwOiAgIFwiYnV0dFwiLFxuICBmb250OiAgICAgIFwic2Fucy1zZXJpZlwiLFxuICBmb250U2l6ZTogIDExXG59O1xuXG4vLyBkZWZhdWx0IGF4aXMgcHJvcGVydGllc1xuY29uZmlnLmF4aXMgPSB7XG4gIG9yaWVudDogXCJib3R0b21cIixcbiAgdGlja3M6IDEwLFxuICBwYWRkaW5nOiAzLFxuICBheGlzQ29sb3I6IFwiIzAwMFwiLFxuICBncmlkQ29sb3I6IFwiI2Q4ZDhkOFwiLFxuICB0aWNrQ29sb3I6IFwiIzAwMFwiLFxuICB0aWNrTGFiZWxDb2xvcjogXCIjMDAwXCIsXG4gIGF4aXNXaWR0aDogMSxcbiAgdGlja1dpZHRoOiAxLFxuICB0aWNrU2l6ZTogNixcbiAgdGlja0xhYmVsRm9udFNpemU6IDExLFxuICB0aWNrTGFiZWxGb250OiBcInNhbnMtc2VyaWZcIixcbiAgdGl0bGVDb2xvcjogXCIjMDAwXCIsXG4gIHRpdGxlRm9udDogXCJzYW5zLXNlcmlmXCIsXG4gIHRpdGxlRm9udFNpemU6IDExLFxuICB0aXRsZUZvbnRXZWlnaHQ6IFwiYm9sZFwiLFxuICB0aXRsZU9mZnNldDogMzVcbn07XG5cbi8vIGRlZmF1bHQgbGVnZW5kIHByb3BlcnRpZXNcbmNvbmZpZy5sZWdlbmQgPSB7XG4gIG9yaWVudDogXCJyaWdodFwiLFxuICBvZmZzZXQ6IDEwLFxuICBwYWRkaW5nOiAzLFxuICBncmFkaWVudFN0cm9rZUNvbG9yOiBcIiM4ODhcIixcbiAgZ3JhZGllbnRTdHJva2VXaWR0aDogMSxcbiAgZ3JhZGllbnRIZWlnaHQ6IDE2LFxuICBncmFkaWVudFdpZHRoOiAxMDAsXG4gIGxhYmVsQ29sb3I6IFwiIzAwMFwiLFxuICBsYWJlbEZvbnRTaXplOiAxMCxcbiAgbGFiZWxGb250OiBcInNhbnMtc2VyaWZcIixcbiAgbGFiZWxBbGlnbjogXCJsZWZ0XCIsXG4gIGxhYmVsQmFzZWxpbmU6IFwibWlkZGxlXCIsXG4gIGxhYmVsT2Zmc2V0OiA4LFxuICBzeW1ib2xTaGFwZTogXCJjaXJjbGVcIixcbiAgc3ltYm9sU2l6ZTogNTAsXG4gIHN5bWJvbENvbG9yOiBcIiM4ODhcIixcbiAgc3ltYm9sU3Ryb2tlV2lkdGg6IDEsXG4gIHRpdGxlQ29sb3I6IFwiIzAwMFwiLFxuICB0aXRsZUZvbnQ6IFwic2Fucy1zZXJpZlwiLFxuICB0aXRsZUZvbnRTaXplOiAxMSxcbiAgdGl0bGVGb250V2VpZ2h0OiBcImJvbGRcIlxufTtcblxuLy8gZGVmYXVsdCBjb2xvciB2YWx1ZXNcbmNvbmZpZy5jb2xvciA9IHtcbiAgcmdiOiBbMTI4LCAxMjgsIDEyOF0sXG4gIGxhYjogWzUwLCAwLCAwXSxcbiAgaGNsOiBbMCwgMCwgNTBdLFxuICBoc2w6IFswLCAwLCAwLjVdXG59O1xuXG4vLyBkZWZhdWx0IHNjYWxlIHJhbmdlc1xuY29uZmlnLnJhbmdlID0ge1xuICBjYXRlZ29yeTEwOiBbXG4gICAgXCIjMWY3N2I0XCIsXG4gICAgXCIjZmY3ZjBlXCIsXG4gICAgXCIjMmNhMDJjXCIsXG4gICAgXCIjZDYyNzI4XCIsXG4gICAgXCIjOTQ2N2JkXCIsXG4gICAgXCIjOGM1NjRiXCIsXG4gICAgXCIjZTM3N2MyXCIsXG4gICAgXCIjN2Y3ZjdmXCIsXG4gICAgXCIjYmNiZDIyXCIsXG4gICAgXCIjMTdiZWNmXCJcbiAgXSxcbiAgY2F0ZWdvcnkyMDogW1xuICAgIFwiIzFmNzdiNFwiLFxuICAgIFwiI2FlYzdlOFwiLFxuICAgIFwiI2ZmN2YwZVwiLFxuICAgIFwiI2ZmYmI3OFwiLFxuICAgIFwiIzJjYTAyY1wiLFxuICAgIFwiIzk4ZGY4YVwiLFxuICAgIFwiI2Q2MjcyOFwiLFxuICAgIFwiI2ZmOTg5NlwiLFxuICAgIFwiIzk0NjdiZFwiLFxuICAgIFwiI2M1YjBkNVwiLFxuICAgIFwiIzhjNTY0YlwiLFxuICAgIFwiI2M0OWM5NFwiLFxuICAgIFwiI2UzNzdjMlwiLFxuICAgIFwiI2Y3YjZkMlwiLFxuICAgIFwiIzdmN2Y3ZlwiLFxuICAgIFwiI2M3YzdjN1wiLFxuICAgIFwiI2JjYmQyMlwiLFxuICAgIFwiI2RiZGI4ZFwiLFxuICAgIFwiIzE3YmVjZlwiLFxuICAgIFwiIzllZGFlNVwiXG4gIF0sXG4gIHNoYXBlczogW1xuICAgIFwiY2lyY2xlXCIsXG4gICAgXCJjcm9zc1wiLFxuICAgIFwiZGlhbW9uZFwiLFxuICAgIFwic3F1YXJlXCIsXG4gICAgXCJ0cmlhbmdsZS1kb3duXCIsXG4gICAgXCJ0cmlhbmdsZS11cFwiXG4gIF1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY29uZmlnOyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBBRERfQ0VMTDogMSxcbiAgTU9EX0NFTEw6IDIsXG5cbiAgREFUQTogXCJkYXRhXCIsXG4gIEZJRUxEUzogIFwiZmllbGRzXCIsXG4gIFNDQUxFUzogIFwic2NhbGVzXCIsXG4gIFNJR05BTDogIFwic2lnbmFsXCIsXG4gIFNJR05BTFM6IFwic2lnbmFsc1wiLFxuXG4gIEdST1VQOiBcImdyb3VwXCIsXG5cbiAgRU5URVI6IFwiZW50ZXJcIixcbiAgVVBEQVRFOiBcInVwZGF0ZVwiLFxuICBFWElUOiBcImV4aXRcIixcblxuICBTRU5USU5FTDoge1wic2VudGluZWxcIjogMX0sXG4gIFNJTkdMRVRPTjogXCJfc2luZ2xldG9uXCIsXG5cbiAgQUREOiBcImFkZFwiLFxuICBSRU1PVkU6IFwicmVtb3ZlXCIsXG4gIFRPR0dMRTogXCJ0b2dnbGVcIixcbiAgQ0xFQVI6IFwiY2xlYXJcIixcblxuICBMSU5FQVI6IFwibGluZWFyXCIsXG4gIE9SRElOQUw6IFwib3JkaW5hbFwiLFxuICBMT0c6IFwibG9nXCIsXG4gIFBPV0VSOiBcInBvd1wiLFxuICBUSU1FOiBcInRpbWVcIixcbiAgUVVBTlRJTEU6IFwicXVhbnRpbGVcIixcblxuICBET01BSU46IFwiZG9tYWluXCIsXG4gIFJBTkdFOiBcInJhbmdlXCIsXG5cbiAgTUFSSzogXCJtYXJrXCIsXG4gIEFYSVM6IFwiYXhpc1wiLFxuXG4gIENPVU5UOiBcImNvdW50XCIsXG4gIE1JTjogXCJtaW5cIixcbiAgTUFYOiBcIm1heFwiLFxuXG4gIEFTQzogXCJhc2NcIixcbiAgREVTQzogXCJkZXNjXCJcbn07IiwidmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG52YXIgdHM7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGFyZ3MpIHtcbiAgaWYgKCFjb25maWcuZGVidWcpIHJldHVybjtcbiAgdmFyIGxvZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLmNhbGwoY29uc29sZS5sb2csIGNvbnNvbGUpO1xuICBhcmdzLnVuc2hpZnQoaW5wdXQuc3RhbXB8fC0xKTtcbiAgYXJncy51bnNoaWZ0KERhdGUubm93KCkgLSB0cyk7XG4gIGlmKGlucHV0LmFkZCkgYXJncy5wdXNoKGlucHV0LmFkZC5sZW5ndGgsIGlucHV0Lm1vZC5sZW5ndGgsIGlucHV0LnJlbS5sZW5ndGgsICEhaW5wdXQucmVmbG93KTtcbiAgbG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xuICB0cyA9IERhdGUubm93KCk7XG59OyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBxdWlja3NlbGVjdChrLCB4LCBjKSB7XG4gIGZ1bmN0aW9uIHN3YXAoYSwgYikge1xuICAgIHZhciB0ID0geFthXTtcbiAgICB4W2FdID0geFtiXTtcbiAgICB4W2JdID0gdDtcbiAgfVxuXG4gIC8vIHggbWF5IGJlIG51bGwsIGluIHdoaWNoIGNhc2UgYXNzZW1ibGUgYW4gYXJyYXkgZnJvbSBjIChjb3VudHMpXG4gIGlmKHggPT09IG51bGwpIHtcbiAgICB4ID0gW107XG4gICAgZGwua2V5cyhjKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgIHZhciBpID0gMCwgbGVuID0gY1trXTtcbiAgICAgIGsgPSArayB8fCBrO1xuICAgICAgZm9yKDsgaTxsZW47ICsraSkgeC5wdXNoKGspO1xuICAgIH0pO1xuICB9XG4gIFxuICB2YXIgbGVmdCA9IDAsXG4gICAgICByaWdodCA9IHgubGVuZ3RoIC0gMSxcbiAgICAgIHBvcywgaSwgcGl2b3Q7XG4gIFxuICB3aGlsZSAobGVmdCA8IHJpZ2h0KSB7XG4gICAgcGl2b3QgPSB4W2tdO1xuICAgIHN3YXAoaywgcmlnaHQpO1xuICAgIGZvciAoaSA9IHBvcyA9IGxlZnQ7IGkgPCByaWdodDsgKytpKSB7XG4gICAgICBpZiAoeFtpXSA8IHBpdm90KSB7IHN3YXAoaSwgcG9zKyspOyB9XG4gICAgfVxuICAgIHN3YXAocmlnaHQsIHBvcyk7XG4gICAgaWYgKHBvcyA9PT0gaykgYnJlYWs7XG4gICAgaWYgKHBvcyA8IGspIGxlZnQgPSBwb3MgKyAxO1xuICAgIGVsc2UgcmlnaHQgPSBwb3MgLSAxO1xuICB9XG4gIHJldHVybiB4W2tdO1xufTsiXX0=
