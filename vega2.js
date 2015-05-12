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
        fields:  {},
        reflow:  false
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
    deps.reflow = deps.reflow || ref.reflow;
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
      fields:  dl.keys(deps.fields),
      reflow:  deps.reflow
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
      signals = [], fields = [], reflow = false;

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
    reflow:  reflow || fRef.reflow || sRef.reflow
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
      reflow  = r.reflow  || false; // Nested fieldrefs trigger full reeval of Encoder.

  if(ref.datum) {
    val = "item.datum["+val+"]";
    fields.push(ref.datum);
  } else if(ref.group) {
    val = scope+"group["+val+"]";
    reflow = true;
  } else if(ref.parent) {
    val = scope+"group.datum["+val+"]";
    reflow = true;
  } else if(ref.signal) {
    val = "signals["+val+"]";
    signals.push(dl.field(ref.signal)[0]);
    reflow = true;
  }

  return {val: val, fields: fields, signals: signals, reflow: reflow};
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

// If update property set uses nested fieldrefs, reevaluate all items.
proto.reevaluate = function(pulse) {
  var props = this._mark.def.properties || {},
      update = props.update;
  return Node.prototype.reevaluate.call(this, pulse) || (update ? update.reflow : false);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9iaW4uanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvZ2VuZXJhdGUuanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvaW1wb3J0L2Zvcm1hdHMvY3N2LmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL2ltcG9ydC9mb3JtYXRzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL2ltcG9ydC9mb3JtYXRzL2pzb24uanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvaW1wb3J0L2Zvcm1hdHMvdG9wb2pzb24uanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvaW1wb3J0L2Zvcm1hdHMvdHJlZWpzb24uanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvaW1wb3J0L2Zvcm1hdHMvdHN2LmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL2ltcG9ydC9pbmZlci10eXBlcy5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9pbXBvcnQvbG9hZC5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9pbXBvcnQvbG9hZGVycy5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9pbXBvcnQvcmVhZC5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9sb2cuanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvc3RhdHMuanMiLCJub2RlX21vZHVsZXMvZGF0YWxpYi9zcmMvc3VtbWFyeS5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy90ZW1wbGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy90cmVlLmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL3RydW5jYXRlLmpzIiwibm9kZV9tb2R1bGVzL2RhdGFsaWIvc3JjL3V0aWwuanMiLCJub2RlX21vZHVsZXMvaGVhcC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9oZWFwL2xpYi9oZWFwLmpzIiwic3JjL2NvcmUvQm91bmRzLmpzIiwic3JjL2NvcmUvTW9kZWwuanMiLCJzcmMvY29yZS9WaWV3LmpzIiwic3JjL2RhdGFmbG93L0NvbGxlY3Rvci5qcyIsInNyYy9kYXRhZmxvdy9EYXRhc291cmNlLmpzIiwic3JjL2RhdGFmbG93L0dyYXBoLmpzIiwic3JjL2RhdGFmbG93L05vZGUuanMiLCJzcmMvZGF0YWZsb3cvU2lnbmFsLmpzIiwic3JjL2RhdGFmbG93L2NoYW5nZXNldC5qcyIsInNyYy9kYXRhZmxvdy90dXBsZS5qcyIsInNyYy9leHByZXNzaW9uL2NvZGVnZW4uanMiLCJzcmMvZXhwcmVzc2lvbi9jb25zdGFudHMuanMiLCJzcmMvZXhwcmVzc2lvbi9mdW5jdGlvbnMuanMiLCJzcmMvZXhwcmVzc2lvbi9pbmRleC5qcyIsInNyYy9leHByZXNzaW9uL3BhcnNlci5qcyIsInNyYy9wYXJzZS9heGVzLmpzIiwic3JjL3BhcnNlL2RhdGEuanMiLCJzcmMvcGFyc2UvZXZlbnRzLmpzIiwic3JjL3BhcnNlL2V4cHIuanMiLCJzcmMvcGFyc2UvaW50ZXJhY3RvcnMuanMiLCJzcmMvcGFyc2UvbWFyay5qcyIsInNyYy9wYXJzZS9tYXJrcy5qcyIsInNyYy9wYXJzZS9tb2RpZnkuanMiLCJzcmMvcGFyc2UvcGFkZGluZy5qcyIsInNyYy9wYXJzZS9wcmVkaWNhdGVzLmpzIiwic3JjL3BhcnNlL3Byb3BlcnRpZXMuanMiLCJzcmMvcGFyc2Uvc2lnbmFscy5qcyIsInNyYy9wYXJzZS9zcGVjLmpzIiwic3JjL3BhcnNlL3N0cmVhbXMuanMiLCJzcmMvcGFyc2UvdHJhbnNmb3Jtcy5qcyIsInNyYy9yZW5kZXIvY2FudmFzL0hhbmRsZXIuanMiLCJzcmMvcmVuZGVyL2NhbnZhcy9SZW5kZXJlci5qcyIsInNyYy9yZW5kZXIvY2FudmFzL2luZGV4LmpzIiwic3JjL3JlbmRlci9jYW52YXMvbWFya3MuanMiLCJzcmMvcmVuZGVyL2NhbnZhcy9wYXRoLmpzIiwic3JjL3JlbmRlci9zdmcvSGFuZGxlci5qcyIsInNyYy9yZW5kZXIvc3ZnL1JlbmRlcmVyLmpzIiwic3JjL3JlbmRlci9zdmcvbWFya3MuanMiLCJzcmMvc2NlbmUvQm91bmRlci5qcyIsInNyYy9zY2VuZS9CdWlsZGVyLmpzIiwic3JjL3NjZW5lL0VuY29kZXIuanMiLCJzcmMvc2NlbmUvR3JvdXBCdWlsZGVyLmpzIiwic3JjL3NjZW5lL0l0ZW0uanMiLCJzcmMvc2NlbmUvU2NhbGUuanMiLCJzcmMvc2NlbmUvVHJhbnNpdGlvbi5qcyIsInNyYy9zY2VuZS9heGlzLmpzIiwic3JjL3RyYW5zZm9ybXMvQWdncmVnYXRlLmpzIiwic3JjL3RyYW5zZm9ybXMvQmluLmpzIiwic3JjL3RyYW5zZm9ybXMvQ3Jvc3MuanMiLCJzcmMvdHJhbnNmb3Jtcy9GYWNldC5qcyIsInNyYy90cmFuc2Zvcm1zL0ZpbHRlci5qcyIsInNyYy90cmFuc2Zvcm1zL0ZvbGQuanMiLCJzcmMvdHJhbnNmb3Jtcy9Gb3JjZS5qcyIsInNyYy90cmFuc2Zvcm1zL0Zvcm11bGEuanMiLCJzcmMvdHJhbnNmb3Jtcy9Hcm91cEJ5LmpzIiwic3JjL3RyYW5zZm9ybXMvUGFyYW1ldGVyLmpzIiwic3JjL3RyYW5zZm9ybXMvU29ydC5qcyIsInNyYy90cmFuc2Zvcm1zL1N0YWNrLmpzIiwic3JjL3RyYW5zZm9ybXMvVHJhbnNmb3JtLmpzIiwic3JjL3RyYW5zZm9ybXMvVW5pcXVlLmpzIiwic3JjL3RyYW5zZm9ybXMvWmlwLmpzIiwic3JjL3RyYW5zZm9ybXMvaW5kZXguanMiLCJzcmMvdHJhbnNmb3Jtcy9tZWFzdXJlcy5qcyIsInNyYy91dGlsL2JvdW5kcy5qcyIsInNyYy91dGlsL2NvbmZpZy5qcyIsInNyYy91dGlsL2NvbnN0YW50cy5qcyIsInNyYy91dGlsL2RlYnVnLmpzIiwic3JjL3V0aWwvcXVpY2tzZWxlY3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25OQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2owRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3Y2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMvSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN2UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMU5BO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcmtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqdUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9SQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hnQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2pUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBjb3JlOiB7XG4gICAgVmlldzogcmVxdWlyZSgnLi9jb3JlL1ZpZXcnKVxuICB9LFxuICBkYXRhZmxvdzoge1xuICAgIGNoYW5nZXNldDogcmVxdWlyZSgnLi9kYXRhZmxvdy9jaGFuZ2VzZXQnKSxcbiAgICBEYXRhc291cmNlOiByZXF1aXJlKCcuL2RhdGFmbG93L0RhdGFzb3VyY2UnKSxcbiAgICBHcmFwaDogcmVxdWlyZSgnLi9kYXRhZmxvdy9HcmFwaCcpLFxuICAgIE5vZGU6IHJlcXVpcmUoJy4vZGF0YWZsb3cvTm9kZScpXG4gIH0sXG4gIHBhcnNlOiB7XG4gICAgc3BlYzogcmVxdWlyZSgnLi9wYXJzZS9zcGVjJylcbiAgfSxcbiAgc2NlbmU6IHtcbiAgICBCdWlsZGVyOiByZXF1aXJlKCcuL3NjZW5lL0J1aWxkZXInKSxcbiAgICBHcm91cEJ1aWxkZXI6IHJlcXVpcmUoJy4vc2NlbmUvR3JvdXBCdWlsZGVyJylcbiAgfSxcbiAgdHJhbnNmb3JtczogcmVxdWlyZSgnLi90cmFuc2Zvcm1zL2luZGV4JyksXG4gIGNvbmZpZzogcmVxdWlyZSgnLi91dGlsL2NvbmZpZycpLFxuICB1dGlsOiByZXF1aXJlKCdkYXRhbGliJylcbn07IixudWxsLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IHRydWU7XG4gICAgdmFyIGN1cnJlbnRRdWV1ZTtcbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgdmFyIGkgPSAtMTtcbiAgICAgICAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgICAgICAgICAgY3VycmVudFF1ZXVlW2ldKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xufVxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICBxdWV1ZS5wdXNoKGZ1bik7XG4gICAgaWYgKCFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHQpIHtcbiAgb3B0ID0gb3B0IHx8IHt9O1xuXG4gIC8vIGRldGVybWluZSByYW5nZVxuICB2YXIgbWF4YiA9IG9wdC5tYXhiaW5zIHx8IDEwMjQsXG4gICAgICBiYXNlID0gb3B0LmJhc2UgfHwgMTAsXG4gICAgICBkaXYgPSBvcHQuZGl2IHx8IFs1LCAyXSxcbiAgICAgIG1pbnMgPSBvcHQubWluc3RlcCB8fCAwLFxuICAgICAgbG9nYiA9IE1hdGgubG9nKGJhc2UpLFxuICAgICAgbGV2ZWwgPSBNYXRoLmNlaWwoTWF0aC5sb2cobWF4YikgLyBsb2diKSxcbiAgICAgIG1pbiA9IG9wdC5taW4sXG4gICAgICBtYXggPSBvcHQubWF4LFxuICAgICAgc3BhbiA9IG1heCAtIG1pbixcbiAgICAgIHN0ZXAgPSBNYXRoLm1heChtaW5zLCBNYXRoLnBvdyhiYXNlLCBNYXRoLnJvdW5kKE1hdGgubG9nKHNwYW4pIC8gbG9nYikgLSBsZXZlbCkpLFxuICAgICAgbmJpbnMgPSBNYXRoLmNlaWwoc3BhbiAvIHN0ZXApLFxuICAgICAgcHJlY2lzaW9uLCB2LCBpLCBlcHM7XG5cbiAgaWYgKG9wdC5zdGVwICE9IG51bGwpIHtcbiAgICBzdGVwID0gb3B0LnN0ZXA7XG4gIH0gZWxzZSBpZiAob3B0LnN0ZXBzKSB7XG4gICAgLy8gaWYgcHJvdmlkZWQsIGxpbWl0IGNob2ljZSB0byBhY2NlcHRhYmxlIHN0ZXAgc2l6ZXNcbiAgICBzdGVwID0gb3B0LnN0ZXBzW01hdGgubWluKFxuICAgICAgICBvcHQuc3RlcHMubGVuZ3RoIC0gMSxcbiAgICAgICAgYmlzZWN0TGVmdChvcHQuc3RlcHMsIHNwYW4gLyBtYXhiLCAwLCBvcHQuc3RlcHMubGVuZ3RoKVxuICAgICldO1xuICB9IGVsc2Uge1xuICAgIC8vIGluY3JlYXNlIHN0ZXAgc2l6ZSBpZiB0b28gbWFueSBiaW5zXG4gICAgZG8ge1xuICAgICAgc3RlcCAqPSBiYXNlO1xuICAgICAgbmJpbnMgPSBNYXRoLmNlaWwoc3BhbiAvIHN0ZXApO1xuICAgIH0gd2hpbGUgKG5iaW5zID4gbWF4Yik7XG5cbiAgICAvLyBkZWNyZWFzZSBzdGVwIHNpemUgaWYgYWxsb3dlZFxuICAgIGZvciAoaSA9IDA7IGkgPCBkaXYubGVuZ3RoOyArK2kpIHtcbiAgICAgIHYgPSBzdGVwIC8gZGl2W2ldO1xuICAgICAgaWYgKHYgPj0gbWlucyAmJiBzcGFuIC8gdiA8PSBtYXhiKSB7XG4gICAgICAgIHN0ZXAgPSB2O1xuICAgICAgICBuYmlucyA9IE1hdGguY2VpbChzcGFuIC8gc3RlcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gdXBkYXRlIHByZWNpc2lvbiwgbWluIGFuZCBtYXhcbiAgdiA9IE1hdGgubG9nKHN0ZXApO1xuICBwcmVjaXNpb24gPSB2ID49IDAgPyAwIDogfn4oLXYgLyBsb2diKSArIDE7XG4gIGVwcyA9IChtaW48MCA/IC0xIDogMSkgKiBNYXRoLnBvdyhiYXNlLCAtcHJlY2lzaW9uIC0gMSk7XG4gIG1pbiA9IE1hdGgubWluKG1pbiwgTWF0aC5mbG9vcihtaW4gLyBzdGVwICsgZXBzKSAqIHN0ZXApO1xuICBtYXggPSBNYXRoLmNlaWwobWF4IC8gc3RlcCkgKiBzdGVwO1xuXG4gIHJldHVybiB7XG4gICAgc3RhcnQ6IG1pbixcbiAgICBzdG9wOiBtYXgsXG4gICAgc3RlcDogc3RlcCxcbiAgICB1bml0OiBwcmVjaXNpb25cbiAgfTtcbn07XG5cbmZ1bmN0aW9uIGJpc2VjdExlZnQoYSwgeCwgbG8sIGhpKSB7XG4gIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgaWYgKHUuY21wKGFbbWlkXSwgeCkgPCAwKSB7IGxvID0gbWlkICsgMTsgfVxuICAgIGVsc2UgeyBoaSA9IG1pZDsgfVxuICB9XG4gIHJldHVybiBsbztcbn0iLCJ2YXIgZ2VuID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuZ2VuLnJlcGVhdCA9IGZ1bmN0aW9uKHZhbCwgbikge1xuICB2YXIgYSA9IEFycmF5KG4pLCBpO1xuICBmb3IgKGk9MDsgaTxuOyArK2kpIGFbaV0gPSB2YWw7XG4gIHJldHVybiBhO1xufTtcblxuZ2VuLnplcm9lcyA9IGZ1bmN0aW9uKG4pIHtcbiAgcmV0dXJuIGdlbi5yZXBlYXQoMCwgbik7XG59O1xuXG5nZW4ucmFuZ2UgPSBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICBzdGVwID0gMTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgIHN0b3AgPSBzdGFydDtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gIH1cbiAgaWYgKChzdG9wIC0gc3RhcnQpIC8gc3RlcCA9PSBJbmZpbml0eSkgdGhyb3cgbmV3IEVycm9yKCdJbmZpbml0ZSByYW5nZScpO1xuICB2YXIgcmFuZ2UgPSBbXSwgaSA9IC0xLCBqO1xuICBpZiAoc3RlcCA8IDApIHdoaWxlICgoaiA9IHN0YXJ0ICsgc3RlcCAqICsraSkgPiBzdG9wKSByYW5nZS5wdXNoKGopO1xuICBlbHNlIHdoaWxlICgoaiA9IHN0YXJ0ICsgc3RlcCAqICsraSkgPCBzdG9wKSByYW5nZS5wdXNoKGopO1xuICByZXR1cm4gcmFuZ2U7XG59O1xuXG5nZW4ucmFuZG9tID0ge307XG5cbmdlbi5yYW5kb20udW5pZm9ybSA9IGZ1bmN0aW9uKG1pbiwgbWF4KSB7XG5cdG1pbiA9IG1pbiB8fCAwO1xuXHRtYXggPSBtYXggfHwgMTtcblx0dmFyIGRlbHRhID0gbWF4IC0gbWluO1xuXHR2YXIgZiA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBtaW4gKyBkZWx0YSAqIE1hdGgucmFuZG9tKCk7XG5cdH07XG5cdGYuc2FtcGxlcyA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIGdlbi56ZXJvZXMobikubWFwKGYpOyB9O1xuXHRyZXR1cm4gZjtcbn07XG5cbmdlbi5yYW5kb20uaW50ZWdlciA9IGZ1bmN0aW9uKGEsIGIpIHtcblx0aWYgKGIgPT09IHVuZGVmaW5lZCkge1xuXHRcdGIgPSBhO1xuXHRcdGEgPSAwO1xuXHR9XG5cdHZhciBmID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGEgKyBNYXRoLm1heCgwLCBNYXRoLmZsb29yKGIqKE1hdGgucmFuZG9tKCktMC4wMDEpKSk7XG5cdH07XG5cdGYuc2FtcGxlcyA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIGdlbi56ZXJvZXMobikubWFwKGYpOyB9O1xuXHRyZXR1cm4gZjtcbn07XG5cbmdlbi5yYW5kb20ubm9ybWFsID0gZnVuY3Rpb24obWVhbiwgc3RkZXYpIHtcblx0bWVhbiA9IG1lYW4gfHwgMDtcblx0c3RkZXYgPSBzdGRldiB8fCAxO1xuXHR2YXIgbmV4dCA9IHVuZGVmaW5lZDtcblx0dmFyIGYgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgeCA9IDAsIHkgPSAwLCByZHMsIGM7XG5cdFx0aWYgKG5leHQgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0eCA9IG5leHQ7XG5cdFx0XHRuZXh0ID0gdW5kZWZpbmVkO1xuXHRcdFx0cmV0dXJuIHg7XG5cdFx0fVxuXHRcdGRvIHtcblx0XHRcdHggPSBNYXRoLnJhbmRvbSgpKjItMTtcblx0XHRcdHkgPSBNYXRoLnJhbmRvbSgpKjItMTtcblx0XHRcdHJkcyA9IHgqeCArIHkqeTtcblx0XHR9IHdoaWxlIChyZHMgPT0gMCB8fCByZHMgPiAxKTtcblx0XHRjID0gTWF0aC5zcXJ0KC0yKk1hdGgubG9nKHJkcykvcmRzKTsgLy8gQm94LU11bGxlciB0cmFuc2Zvcm1cblx0XHRuZXh0ID0gbWVhbiArIHkqYypzdGRldjtcblx0XHRyZXR1cm4gbWVhbiArIHgqYypzdGRldjtcblx0fTtcblx0Zi5zYW1wbGVzID0gZnVuY3Rpb24obikgeyByZXR1cm4gZ2VuLnplcm9lcyhuKS5tYXAoZik7IH07XG5cdHJldHVybiBmO1xufTsiLCJ2YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkYXRhLCBmb3JtYXQpIHtcbiAgdmFyIGQgPSBkMy5jc3YucGFyc2UoZGF0YSA/IGRhdGEudG9TdHJpbmcoKSA6IGRhdGEpO1xuICByZXR1cm4gZDtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAganNvbjogcmVxdWlyZSgnLi9qc29uJyksXG4gIGNzdjogcmVxdWlyZSgnLi9jc3YnKSxcbiAgdHN2OiByZXF1aXJlKCcuL3RzdicpLFxuICB0b3BvanNvbjogcmVxdWlyZSgnLi90b3BvanNvbicpLFxuICB0cmVlanNvbjogcmVxdWlyZSgnLi90cmVlanNvbicpXG59OyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vLi4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRhdGEsIGZvcm1hdCkge1xuICB2YXIgZCA9IHV0aWwuaXNPYmplY3QoZGF0YSkgPyBkYXRhIDogSlNPTi5wYXJzZShkYXRhKTtcbiAgaWYgKGZvcm1hdCAmJiBmb3JtYXQucHJvcGVydHkpIHtcbiAgICBkID0gdXRpbC5hY2Nlc3Nvcihmb3JtYXQucHJvcGVydHkpKGQpO1xuICB9XG4gIHJldHVybiBkO1xufTtcbiIsInZhciBqc29uID0gcmVxdWlyZSgnLi9qc29uJyk7XG52YXIgdG9wb2pzb24gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy50b3BvanNvbiA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwudG9wb2pzb24gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkYXRhLCBmb3JtYXQpIHtcbiAgaWYgKHRvcG9qc29uID09IG51bGwpIHsgdGhyb3cgRXJyb3IoXCJUb3BvSlNPTiBsaWJyYXJ5IG5vdCBsb2FkZWQuXCIpOyB9XG5cbiAgdmFyIHQgPSBqc29uKGRhdGEsIGZvcm1hdCksIG9iajtcblxuICBpZiAoZm9ybWF0ICYmIGZvcm1hdC5mZWF0dXJlKSB7XG4gICAgaWYgKG9iaiA9IHQub2JqZWN0c1tmb3JtYXQuZmVhdHVyZV0pIHtcbiAgICAgIHJldHVybiB0b3BvanNvbi5mZWF0dXJlKHQsIG9iaikuZmVhdHVyZXNcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoXCJJbnZhbGlkIFRvcG9KU09OIG9iamVjdDogXCIrZm9ybWF0LmZlYXR1cmUpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChmb3JtYXQgJiYgZm9ybWF0Lm1lc2gpIHtcbiAgICBpZiAob2JqID0gdC5vYmplY3RzW2Zvcm1hdC5tZXNoXSkge1xuICAgICAgcmV0dXJuIFt0b3BvanNvbi5tZXNoKHQsIHQub2JqZWN0c1tmb3JtYXQubWVzaF0pXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoXCJJbnZhbGlkIFRvcG9KU09OIG9iamVjdDogXCIgKyBmb3JtYXQubWVzaCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IEVycm9yKFwiTWlzc2luZyBUb3BvSlNPTiBmZWF0dXJlIG9yIG1lc2ggcGFyYW1ldGVyLlwiKTtcbiAgfVxuXG4gIHJldHVybiBbXTtcbn07XG4iLCJ2YXIgdHJlZSA9IHJlcXVpcmUoJy4uLy4uL3RyZWUnKTtcbnZhciBqc29uID0gcmVxdWlyZSgnLi9qc29uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGF0YSwgZm9ybWF0KSB7XG4gIGRhdGEgPSBqc29uKGRhdGEsIGZvcm1hdCk7XG4gIHJldHVybiB0cmVlLnRvVGFibGUoZGF0YSwgKGZvcm1hdCAmJiBmb3JtYXQuY2hpbGRyZW4pKTtcbn07IiwidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGF0YSwgZm9ybWF0KSB7XG4gIHZhciBkID0gZDMudHN2LnBhcnNlKGRhdGEgPyBkYXRhLnRvU3RyaW5nKCkgOiBkYXRhKTtcbiAgcmV0dXJuIGQ7XG59O1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbnZhciB0ZXN0cyA9IHtcbiAgYm9vbDogZnVuY3Rpb24oeCkgeyByZXR1cm4geD09PVwidHJ1ZVwiIHx8IHg9PT1cImZhbHNlXCIgfHwgdXRpbC5pc0Jvb2xlYW4oeCk7IH0sXG4gIGRhdGU6IGZ1bmN0aW9uKHgpIHsgcmV0dXJuICFpc05hTihEYXRlLnBhcnNlKHgpKTsgfSxcbiAgbnVtOiBmdW5jdGlvbih4KSB7IHJldHVybiAhaXNOYU4oK3gpICYmICF1dGlsLmlzRGF0ZSh4KTsgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgdmFyIGksIGosIHY7XG4gIFxuICAvLyB0eXBlcyB0byB0ZXN0IGZvclxuICB2YXIgdHlwZXMgPSBbXG4gICAge3R5cGU6IFwiYm9vbGVhblwiLCB0ZXN0OiB0ZXN0cy5ib29sfSxcbiAgICB7dHlwZTogXCJudW1iZXJcIiwgdGVzdDogdGVzdHMubnVtfSxcbiAgICB7dHlwZTogXCJkYXRlXCIsIHRlc3Q6IHRlc3RzLmRhdGV9XG4gIF07XG4gIFxuICBmb3IgKGk9MDsgaTx2YWx1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAvLyBnZXQgbmV4dCB2YWx1ZSB0byB0ZXN0XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgLy8gdGVzdCB2YWx1ZSBhZ2FpbnN0IHJlbWFpbmluZyB0eXBlc1xuICAgIGZvciAoaj0wOyBqPHR5cGVzLmxlbmd0aDsgKytqKSB7XG4gICAgICBpZiAodiAhPSBudWxsICYmICF0eXBlc1tqXS50ZXN0KHYpKSB7XG4gICAgICAgIHR5cGVzLnNwbGljZShqLCAxKTtcbiAgICAgICAgaiAtPSAxO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBpZiBubyB0eXBlcyBsZWZ0LCByZXR1cm4gJ3N0cmluZydcbiAgICBpZiAodHlwZXMubGVuZ3RoID09PSAwKSByZXR1cm4gXCJzdHJpbmdcIjtcbiAgfVxuICBcbiAgcmV0dXJuIHR5cGVzWzBdLnR5cGU7XG59OyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG4vLyBNYXRjaGVzIGFic29sdXRlIFVSTHMgd2l0aCBvcHRpb25hbCBwcm90b2NvbFxuLy8gICBodHRwczovLy4uLiAgICBmaWxlOi8vLi4uICAgIC8vLi4uXG52YXIgcHJvdG9jb2xfcmUgPSAvXihbQS1aYS16XSs6KT9cXC9cXC8vO1xuXG4vLyBTcGVjaWFsIHRyZWF0bWVudCBpbiBub2RlLmpzIGZvciB0aGUgZmlsZTogcHJvdG9jb2xcbnZhciBmaWxlUHJvdG9jb2wgPSAnZmlsZTovLyc7XG5cbi8vIFZhbGlkYXRlIGFuZCBjbGVhbnVwIFVSTCB0byBlbnN1cmUgdGhhdCBpdCBpcyBhbGxvd2VkIHRvIGJlIGFjY2Vzc2VkXG4vLyBSZXR1cm5zIGNsZWFuZWQgdXAgVVJMLCBvciBmYWxzZSBpZiBhY2Nlc3MgaXMgbm90IGFsbG93ZWRcbmZ1bmN0aW9uIHNhbml0aXplVXJsKG9wdCkge1xuICB2YXIgdXJsID0gb3B0LnVybDtcbiAgaWYgKCF1cmwgJiYgb3B0LmZpbGUpIHsgcmV0dXJuIGZpbGVQcm90b2NvbCArIG9wdC5maWxlOyB9XG5cbiAgLy8gSW4gY2FzZSB0aGlzIGlzIGEgcmVsYXRpdmUgdXJsIChoYXMgbm8gaG9zdCksIHByZXBlbmQgb3B0LmJhc2VVUkxcbiAgaWYgKG9wdC5iYXNlVVJMICYmICFwcm90b2NvbF9yZS50ZXN0KHVybCkpIHtcbiAgICBpZiAoIXV0aWwuc3RhcnRzV2l0aCh1cmwsICcvJykgJiYgb3B0LmJhc2VVUkxbb3B0LmJhc2VVUkwubGVuZ3RoLTFdICE9PSAnLycpIHtcbiAgICAgIHVybCA9ICcvJyArIHVybDsgLy8gRW5zdXJlIHRoYXQgdGhlcmUgaXMgYSBzbGFzaCBiZXR3ZWVuIHRoZSBiYXNlVVJMIChlLmcuIGhvc3RuYW1lKSBhbmQgdXJsXG4gICAgfVxuICAgIHVybCA9IG9wdC5iYXNlVVJMICsgdXJsO1xuICB9XG4gIC8vIHJlbGF0aXZlIHByb3RvY29sLCBzdGFydHMgd2l0aCAnLy8nXG4gIGlmICh1dGlsLmlzTm9kZSAmJiB1dGlsLnN0YXJ0c1dpdGgodXJsLCAnLy8nKSkge1xuICAgIHVybCA9IChvcHQuZGVmYXVsdFByb3RvY29sIHx8ICdodHRwJykgKyAnOicgKyB1cmw7XG4gIH1cbiAgLy8gSWYgb3B0LmRvbWFpbldoaXRlTGlzdCBpcyBzZXQsIG9ubHkgYWxsb3dzIHVybCwgd2hvc2UgaG9zdG5hbWVcbiAgLy8gKiBJcyB0aGUgc2FtZSBhcyB0aGUgb3JpZ2luICh3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUpXG4gIC8vICogRXF1YWxzIG9uZSBvZiB0aGUgdmFsdWVzIGluIHRoZSB3aGl0ZWxpc3RcbiAgLy8gKiBJcyBhIHByb3BlciBzdWJkb21haW4gb2Ygb25lIG9mIHRoZSB2YWx1ZXMgaW4gdGhlIHdoaXRlbGlzdFxuICBpZiAob3B0LmRvbWFpbldoaXRlTGlzdCkge1xuICAgIHZhciBkb21haW4sIG9yaWdpbjtcbiAgICBpZiAodXRpbC5pc05vZGUpIHtcbiAgICAgIC8vIHJlbGF0aXZlIHByb3RvY29sIGlzIGJyb2tlbjogaHR0cHM6Ly9naXRodWIuY29tL2RlZnVuY3R6b21iaWUvbm9kZS11cmwvaXNzdWVzLzVcbiAgICAgIHZhciBwYXJ0cyA9IHJlcXVpcmUoJ3VybCcpLnBhcnNlKHVybCk7XG4gICAgICBkb21haW4gPSBwYXJ0cy5ob3N0bmFtZTtcbiAgICAgIG9yaWdpbiA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgYS5ocmVmID0gdXJsO1xuICAgICAgLy8gRnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzczNjUxMy9ob3ctZG8taS1wYXJzZS1hLXVybC1pbnRvLWhvc3RuYW1lLWFuZC1wYXRoLWluLWphdmFzY3JpcHRcbiAgICAgIC8vIElFIGRvZXNuJ3QgcG9wdWxhdGUgYWxsIGxpbmsgcHJvcGVydGllcyB3aGVuIHNldHRpbmcgLmhyZWYgd2l0aCBhIHJlbGF0aXZlIFVSTCxcbiAgICAgIC8vIGhvd2V2ZXIgLmhyZWYgd2lsbCByZXR1cm4gYW4gYWJzb2x1dGUgVVJMIHdoaWNoIHRoZW4gY2FuIGJlIHVzZWQgb24gaXRzZWxmXG4gICAgICAvLyB0byBwb3B1bGF0ZSB0aGVzZSBhZGRpdGlvbmFsIGZpZWxkcy5cbiAgICAgIGlmIChhLmhvc3QgPT0gXCJcIikge1xuICAgICAgICBhLmhyZWYgPSBhLmhyZWY7XG4gICAgICB9XG4gICAgICBkb21haW4gPSBhLmhvc3RuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICBvcmlnaW4gPSB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWU7XG4gICAgfVxuXG4gICAgaWYgKG9yaWdpbiAhPT0gZG9tYWluKSB7XG4gICAgICB2YXIgd2hpdGVMaXN0ZWQgPSBvcHQuZG9tYWluV2hpdGVMaXN0LnNvbWUoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgdmFyIGlkeCA9IGRvbWFpbi5sZW5ndGggLSBkLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIGQgPT09IGRvbWFpbiB8fFxuICAgICAgICAgIChpZHggPiAxICYmIGRvbWFpbltpZHgtMV0gPT09ICcuJyAmJiBkb21haW4ubGFzdEluZGV4T2YoZCkgPT09IGlkeCk7XG4gICAgICB9KTtcbiAgICAgIGlmICghd2hpdGVMaXN0ZWQpIHtcbiAgICAgICAgdGhyb3cgJ1VSTCBpcyBub3Qgd2hpdGVsaXN0ZWQ6ICcgKyB1cmw7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB1cmw7XG59XG5cbmZ1bmN0aW9uIGxvYWQob3B0LCBjYWxsYmFjaykge1xuICB2YXIgZXJyb3IgPSBjYWxsYmFjayB8fCBmdW5jdGlvbihlKSB7IHRocm93IGU7IH07XG4gIFxuICB0cnkge1xuICAgIHZhciB1cmwgPSBsb2FkLnNhbml0aXplVXJsKG9wdCk7IC8vIGVuYWJsZSBvdmVycmlkZVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBlcnJvcihlcnIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICghdXJsKSB7XG4gICAgZXJyb3IoJ0ludmFsaWQgVVJMOiAnICsgdXJsKTtcbiAgfSBlbHNlIGlmICghdXRpbC5pc05vZGUpIHtcbiAgICAvLyBpbiBicm93c2VyLCB1c2UgeGhyXG4gICAgcmV0dXJuIHhocih1cmwsIGNhbGxiYWNrKTtcbiAgfSBlbHNlIGlmICh1dGlsLnN0YXJ0c1dpdGgodXJsLCBmaWxlUHJvdG9jb2wpKSB7XG4gICAgLy8gaW4gbm9kZS5qcywgaWYgdXJsIHN0YXJ0cyB3aXRoICdmaWxlOi8vJywgc3RyaXAgaXQgYW5kIGxvYWQgZnJvbSBmaWxlXG4gICAgcmV0dXJuIGZpbGUodXJsLnNsaWNlKGZpbGVQcm90b2NvbC5sZW5ndGgpLCBjYWxsYmFjayk7XG4gIH0gZWxzZSB7XG4gICAgLy8gZm9yIHJlZ3VsYXIgVVJMcyBpbiBub2RlLmpzXG4gICAgcmV0dXJuIGh0dHAodXJsLCBjYWxsYmFjayk7XG4gIH1cbn1cblxuZnVuY3Rpb24geGhySGFzUmVzcG9uc2UocmVxdWVzdCkge1xuICB2YXIgdHlwZSA9IHJlcXVlc3QucmVzcG9uc2VUeXBlO1xuICByZXR1cm4gdHlwZSAmJiB0eXBlICE9PSBcInRleHRcIlxuICAgICAgPyByZXF1ZXN0LnJlc3BvbnNlIC8vIG51bGwgb24gZXJyb3JcbiAgICAgIDogcmVxdWVzdC5yZXNwb25zZVRleHQ7IC8vIFwiXCIgb24gZXJyb3Jcbn1cblxuZnVuY3Rpb24geGhyKHVybCwgY2FsbGJhY2spIHtcbiAgdmFyIGFzeW5jID0gISFjYWxsYmFjaztcbiAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3Q7XG4gIC8vIElmIElFIGRvZXMgbm90IHN1cHBvcnQgQ09SUywgdXNlIFhEb21haW5SZXF1ZXN0IChjb3BpZWQgZnJvbSBkMy54aHIpXG4gIGlmICh0aGlzLlhEb21haW5SZXF1ZXN0XG4gICAgICAmJiAhKFwid2l0aENyZWRlbnRpYWxzXCIgaW4gcmVxdWVzdClcbiAgICAgICYmIC9eKGh0dHAocyk/Oik/XFwvXFwvLy50ZXN0KHVybCkpIHJlcXVlc3QgPSBuZXcgWERvbWFpblJlcXVlc3Q7XG5cbiAgZnVuY3Rpb24gcmVzcG9uZCgpIHtcbiAgICB2YXIgc3RhdHVzID0gcmVxdWVzdC5zdGF0dXM7XG4gICAgaWYgKCFzdGF0dXMgJiYgeGhySGFzUmVzcG9uc2UocmVxdWVzdCkgfHwgc3RhdHVzID49IDIwMCAmJiBzdGF0dXMgPCAzMDAgfHwgc3RhdHVzID09PSAzMDQpIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2socmVxdWVzdCwgbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGFzeW5jKSB7XG4gICAgXCJvbmxvYWRcIiBpbiByZXF1ZXN0XG4gICAgICA/IHJlcXVlc3Qub25sb2FkID0gcmVxdWVzdC5vbmVycm9yID0gcmVzcG9uZFxuICAgICAgOiByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkgeyByZXF1ZXN0LnJlYWR5U3RhdGUgPiAzICYmIHJlc3BvbmQoKTsgfTtcbiAgfVxuICBcbiAgcmVxdWVzdC5vcGVuKFwiR0VUXCIsIHVybCwgYXN5bmMpO1xuICByZXF1ZXN0LnNlbmQoKTtcbiAgXG4gIGlmICghYXN5bmMgJiYgeGhySGFzUmVzcG9uc2UocmVxdWVzdCkpIHtcbiAgICByZXR1cm4gcmVxdWVzdC5yZXNwb25zZVRleHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmlsZShmaWxlLCBjYWxsYmFjaykge1xuICB2YXIgZnMgPSByZXF1aXJlKCdmcycpO1xuICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhmaWxlLCAndXRmOCcpO1xuICB9XG4gIHJlcXVpcmUoJ2ZzJykucmVhZEZpbGUoZmlsZSwgY2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBodHRwKHVybCwgY2FsbGJhY2spIHtcbiAgaWYgKCFjYWxsYmFjaykge1xuICAgIHJldHVybiByZXF1aXJlKCdzeW5jLXJlcXVlc3QnKSgnR0VUJywgdXJsKS5nZXRCb2R5KCk7XG4gIH1cbiAgcmVxdWlyZSgncmVxdWVzdCcpKHVybCwgZnVuY3Rpb24oZXJyb3IsIHJlc3BvbnNlLCBib2R5KSB7XG4gICAgaWYgKCFlcnJvciAmJiByZXNwb25zZS5zdGF0dXNDb2RlID09PSAyMDApIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIGJvZHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfVxuICB9KTtcbn1cblxubG9hZC5zYW5pdGl6ZVVybCA9IHNhbml0aXplVXJsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxvYWQ7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcbnZhciBsb2FkID0gcmVxdWlyZSgnLi9sb2FkJyk7XG52YXIgcmVhZCA9IHJlcXVpcmUoJy4vcmVhZCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxcbiAgLmtleXMocmVhZC5mb3JtYXRzKVxuICAucmVkdWNlKGZ1bmN0aW9uKG91dCwgdHlwZSkge1xuICAgIG91dFt0eXBlXSA9IGZ1bmN0aW9uKG9wdCwgZm9ybWF0LCBjYWxsYmFjaykge1xuICAgICAgLy8gcHJvY2VzcyBhcmd1bWVudHNcbiAgICAgIGlmICh1dGlsLmlzU3RyaW5nKG9wdCkpIG9wdCA9IHt1cmw6IG9wdH07XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMiAmJiB1dGlsLmlzRnVuY3Rpb24oZm9ybWF0KSkge1xuICAgICAgICBjYWxsYmFjayA9IGZvcm1hdDtcbiAgICAgICAgZm9ybWF0ID0gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICAvLyBzZXQgdXAgcmVhZCBmb3JtYXRcbiAgICAgIGZvcm1hdCA9IHV0aWwuZXh0ZW5kKHtwYXJzZTogJ2F1dG8nfSwgZm9ybWF0KTtcbiAgICAgIGZvcm1hdC50eXBlID0gdHlwZTtcblxuICAgICAgLy8gbG9hZCBkYXRhXG4gICAgICB2YXIgZGF0YSA9IGxvYWQob3B0LCBjYWxsYmFjayA/IGZ1bmN0aW9uKGVycm9yLCBkYXRhKSB7XG4gICAgICAgIGlmIChlcnJvcikgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIGRhdGEgbG9hZGVkLCBub3cgcGFyc2UgaXQgKGFzeW5jKVxuICAgICAgICAgIGRhdGEgPSByZWFkKGRhdGEsIGZvcm1hdCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjYWxsYmFjayhlLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhudWxsLCBkYXRhKTtcbiAgICAgIH0gOiB1bmRlZmluZWQpO1xuICAgICAgXG4gICAgICAvLyBkYXRhIGxvYWRlZCwgbm93IHBhcnNlIGl0IChzeW5jKVxuICAgICAgaWYgKGRhdGEpIHJldHVybiByZWFkKGRhdGEsIGZvcm1hdCk7XG4gICAgfTtcbiAgICByZXR1cm4gb3V0O1xuICB9LCB7fSk7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJyk7XG52YXIgaW5mZXIgPSByZXF1aXJlKCcuL2luZmVyLXR5cGVzJyk7XG5cbnZhciBQQVJTRVJTID0ge1xuICBcIm51bWJlclwiOiB1dGlsLm51bWJlcixcbiAgXCJib29sZWFuXCI6IHV0aWwuYm9vbGVhbixcbiAgXCJkYXRlXCI6IHV0aWwuZGF0ZVxufTtcblxuZnVuY3Rpb24gcmVhZChkYXRhLCBmb3JtYXQpIHtcbiAgdmFyIHR5cGUgPSAoZm9ybWF0ICYmIGZvcm1hdC50eXBlKSB8fCBcImpzb25cIjtcbiAgZGF0YSA9IGZvcm1hdHNbdHlwZV0oZGF0YSwgZm9ybWF0KTtcbiAgaWYgKGZvcm1hdCAmJiBmb3JtYXQucGFyc2UpIHBhcnNlKGRhdGEsIGZvcm1hdC5wYXJzZSk7XG4gIHJldHVybiBkYXRhO1xufVxuXG5mdW5jdGlvbiBwYXJzZShkYXRhLCB0eXBlcykge1xuICB2YXIgY29scywgcGFyc2VycywgZCwgaSwgaiwgY2xlbiwgbGVuID0gZGF0YS5sZW5ndGg7XG5cbiAgaWYgKHR5cGVzID09PSAnYXV0bycpIHtcbiAgICAvLyBwZXJmb3JtIHR5cGUgaW5mZXJlbmNlXG4gICAgdHlwZXMgPSB1dGlsLmtleXMoZGF0YVswXSkucmVkdWNlKGZ1bmN0aW9uKHR5cGVzLCBjKSB7XG4gICAgICB2YXIgdHlwZSA9IGluZmVyKGRhdGEsIHV0aWwuYWNjZXNzb3IoYykpO1xuICAgICAgaWYgKFBBUlNFUlNbdHlwZV0pIHR5cGVzW2NdID0gdHlwZTtcbiAgICAgIHJldHVybiB0eXBlcztcbiAgICB9LCB7fSk7XG4gIH1cbiAgY29scyA9IHV0aWwua2V5cyh0eXBlcyk7XG4gIHBhcnNlcnMgPSBjb2xzLm1hcChmdW5jdGlvbihjKSB7IHJldHVybiBQQVJTRVJTW3R5cGVzW2NdXTsgfSk7XG5cbiAgZm9yIChpPTAsIGNsZW49Y29scy5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBkID0gZGF0YVtpXTtcbiAgICBmb3IgKGo9MDsgajxjbGVuOyArK2opIHtcbiAgICAgIGRbY29sc1tqXV0gPSBwYXJzZXJzW2pdKGRbY29sc1tqXV0pO1xuICAgIH1cbiAgfVxufVxuXG5yZWFkLmluZmVyID0gaW5mZXI7XG5yZWFkLmZvcm1hdHMgPSBmb3JtYXRzO1xucmVhZC5wYXJzZSA9IHBhcnNlO1xubW9kdWxlLmV4cG9ydHMgPSByZWFkOyIsInZhciBkbCA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG51dGlsLmV4dGVuZChkbCwgdXRpbCk7XG51dGlsLmV4dGVuZChkbCwgcmVxdWlyZSgnLi9nZW5lcmF0ZScpKTtcbnV0aWwuZXh0ZW5kKGRsLCByZXF1aXJlKCcuL3N0YXRzJykpO1xuZGwuYmluID0gcmVxdWlyZSgnLi9iaW4nKTtcbmRsLnN1bW1hcnkgPSByZXF1aXJlKCcuL3N1bW1hcnknKTtcbmRsLnRlbXBsYXRlID0gcmVxdWlyZSgnLi90ZW1wbGF0ZScpO1xuZGwudHJ1bmNhdGUgPSByZXF1aXJlKCcuL3RydW5jYXRlJyk7XG5cbmRsLmxvYWQgPSByZXF1aXJlKCcuL2ltcG9ydC9sb2FkJyk7XG5kbC5yZWFkID0gcmVxdWlyZSgnLi9pbXBvcnQvcmVhZCcpO1xudXRpbC5leHRlbmQoZGwsIHJlcXVpcmUoJy4vaW1wb3J0L2xvYWRlcnMnKSk7XG5cbnZhciBsb2cgPSByZXF1aXJlKCcuL2xvZycpO1xuZGwubG9nID0gZnVuY3Rpb24obXNnKSB7IGxvZyhtc2csIGxvZy5MT0cpOyB9O1xuZGwubG9nLnNpbGVudCA9IGxvZy5zaWxlbnQ7XG5kbC5lcnJvciA9IGZ1bmN0aW9uKG1zZykgeyBsb2cobXNnLCBsb2cuRVJSKTsgfTtcbiIsInZhciBMT0cgPSBcIkxPR1wiO1xudmFyIEVSUiA9IFwiRVJSXCI7XG52YXIgc2lsZW50ID0gZmFsc2U7XG5cbmZ1bmN0aW9uIHByZXBhcmUobXNnLCB0eXBlKSB7XG4gIHJldHVybiAnWycgKyBbXG4gICAgJ1wiJysodHlwZSB8fCBMT0cpKydcIicsXG4gICAgRGF0ZS5ub3coKSxcbiAgICAnXCInK21zZysnXCInXG4gIF0uam9pbihcIiwgXCIpICsgJ10nO1xufVxuXG5mdW5jdGlvbiBsb2cobXNnLCB0eXBlKSB7XG4gIGlmICghc2lsZW50KSB7XG4gICAgbXNnID0gcHJlcGFyZShtc2csIHR5cGUpO1xuICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgfVxufVxuXG5sb2cuc2lsZW50ID0gZnVuY3Rpb24odmFsKSB7IHNpbGVudCA9ICEhdmFsOyB9O1xuXG5sb2cuTE9HID0gTE9HO1xubG9nLkVSUiA9IEVSUjtcbm1vZHVsZS5leHBvcnRzID0gbG9nOyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgc3RhdHMgPSB7fTtcblxuc3RhdHMudW5pcXVlID0gZnVuY3Rpb24odmFsdWVzLCBmLCByZXN1bHRzKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09PTApIHJldHVybiBbXTtcbiAgcmVzdWx0cyA9IHJlc3VsdHMgfHwgW107XG4gIHZhciB1ID0ge30sIHYsIGk7XG4gIGZvciAoaT0wLCBuPXZhbHVlcy5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgaWYgKHYgaW4gdSkge1xuICAgICAgdVt2XSArPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB1W3ZdID0gMTtcbiAgICAgIHJlc3VsdHMucHVzaCh2KTtcbiAgICB9XG4gIH1cbiAgcmVzdWx0cy5jb3VudHMgPSB1O1xuICByZXR1cm4gcmVzdWx0cztcbn07XG5cbnN0YXRzLmNvdW50ID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09PTApIHJldHVybiAwO1xuICB2YXIgdiwgaSwgY291bnQgPSAwO1xuICBmb3IgKGk9MCwgbj12YWx1ZXMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh2ICE9IG51bGwpIGNvdW50ICs9IDE7XG4gIH1cbiAgcmV0dXJuIGNvdW50O1xufTtcblxuc3RhdHMuY291bnQuZGlzdGluY3QgPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgaWYgKCF1dGlsLmlzQXJyYXkodmFsdWVzKSB8fCB2YWx1ZXMubGVuZ3RoPT09MCkgcmV0dXJuIDA7XG4gIHZhciB1ID0ge30sIHYsIGksIGNvdW50ID0gMDtcbiAgZm9yIChpPTAsIG49dmFsdWVzLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodiBpbiB1KSBjb250aW51ZTtcbiAgICB1W3ZdID0gMTtcbiAgICBjb3VudCArPSAxO1xuICB9XG4gIHJldHVybiBjb3VudDtcbn07XG5cbnN0YXRzLmNvdW50Lm51bGxzID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09PTApIHJldHVybiAwO1xuICB2YXIgdiwgaSwgY291bnQgPSAwO1xuICBmb3IgKGk9MCwgbj12YWx1ZXMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh2ID09IG51bGwpIGNvdW50ICs9IDE7XG4gIH1cbiAgcmV0dXJuIGNvdW50O1xufTtcblxuc3RhdHMubWVkaWFuID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09PTApIHJldHVybiAwO1xuICBpZiAoZikgdmFsdWVzID0gdmFsdWVzLm1hcChmKTtcbiAgdmFsdWVzID0gdmFsdWVzLmZpbHRlcih1dGlsLmlzTm90TnVsbCkuc29ydCh1dGlsLmNtcCk7XG4gIHZhciBoYWxmID0gTWF0aC5mbG9vcih2YWx1ZXMubGVuZ3RoLzIpO1xuICBpZiAodmFsdWVzLmxlbmd0aCAlIDIpIHtcbiAgICByZXR1cm4gdmFsdWVzW2hhbGZdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAodmFsdWVzW2hhbGYtMV0gKyB2YWx1ZXNbaGFsZl0pIC8gMi4wO1xuICB9XG59O1xuXG5zdGF0cy5tZWFuID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09PTApIHJldHVybiAwO1xuICB2YXIgbWVhbiA9IDAsIGRlbHRhLCBpLCBjLCB2O1xuICBmb3IgKGk9MCwgYz0wOyBpPHZhbHVlcy5sZW5ndGg7ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh2ICE9IG51bGwpIHtcbiAgICAgIGRlbHRhID0gdiAtIG1lYW47XG4gICAgICBtZWFuID0gbWVhbiArIGRlbHRhIC8gKCsrYyk7XG4gICAgfVxuICB9XG4gIHJldHVybiBtZWFuO1xufTtcblxuc3RhdHMudmFyaWFuY2UgPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgaWYgKCF1dGlsLmlzQXJyYXkodmFsdWVzKSB8fCB2YWx1ZXMubGVuZ3RoPT09MCkgcmV0dXJuIDA7XG4gIHZhciBtZWFuID0gMCwgTTIgPSAwLCBkZWx0YSwgaSwgYywgdjtcbiAgZm9yIChpPTAsIGM9MDsgaTx2YWx1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodiAhPSBudWxsKSB7XG4gICAgICBkZWx0YSA9IHYgLSBtZWFuO1xuICAgICAgbWVhbiA9IG1lYW4gKyBkZWx0YSAvICgrK2MpO1xuICAgICAgTTIgPSBNMiArIGRlbHRhICogKHYgLSBtZWFuKTtcbiAgICB9XG4gIH1cbiAgTTIgPSBNMiAvIChjIC0gMSk7XG4gIHJldHVybiBNMjtcbn07XG5cbnN0YXRzLnN0ZGV2ID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIHJldHVybiBNYXRoLnNxcnQoc3RhdHMudmFyaWFuY2UodmFsdWVzLCBmKSk7XG59O1xuXG5zdGF0cy5za2V3ID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIHZhciBhdmcgPSBzdGF0cy5tZWFuKHZhbHVlcywgZiksXG4gICAgICBtZWQgPSBzdGF0cy5tZWRpYW4odmFsdWVzLCBmKSxcbiAgICAgIHN0ZCA9IHN0YXRzLnN0ZGV2KHZhbHVlcywgZik7XG4gIHJldHVybiBzdGQgPT09IDAgPyAwIDogKGF2ZyAtIG1lZCkgLyBzdGQ7XG59O1xuXG5zdGF0cy5taW5tYXggPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgdmFyIHMgPSB7bWluOiArSW5maW5pdHksIG1heDogLUluZmluaXR5fSwgdiwgaSwgbjtcbiAgZm9yIChpPTA7IGk8dmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgaWYgKHYgIT0gbnVsbCkge1xuICAgICAgaWYgKHYgPiBzLm1heCkgcy5tYXggPSB2O1xuICAgICAgaWYgKHYgPCBzLm1pbikgcy5taW4gPSB2O1xuICAgIH1cbiAgfVxuICByZXR1cm4gcztcbn07XG5cbnN0YXRzLm1pbkluZGV4ID0gZnVuY3Rpb24odmFsdWVzLCBmKSB7XG4gIGlmICghdXRpbC5pc0FycmF5KHZhbHVlcykgfHwgdmFsdWVzLmxlbmd0aD09MCkgcmV0dXJuIC0xO1xuICB2YXIgaWR4ID0gMCwgdiwgaSwgbiwgbWluID0gK0luZmluaXR5O1xuICBmb3IgKGk9MDsgaTx2YWx1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICB2ID0gZiA/IGYodmFsdWVzW2ldKSA6IHZhbHVlc1tpXTtcbiAgICBpZiAodiAhPSBudWxsICYmIHYgPCBtaW4pIHsgbWluID0gdjsgaWR4ID0gaTsgfVxuICB9XG4gIHJldHVybiBpZHg7XG59O1xuXG5zdGF0cy5tYXhJbmRleCA9IGZ1bmN0aW9uKHZhbHVlcywgZikge1xuICBpZiAoIXV0aWwuaXNBcnJheSh2YWx1ZXMpIHx8IHZhbHVlcy5sZW5ndGg9PTApIHJldHVybiAtMTtcbiAgdmFyIGlkeCA9IDAsIHYsIGksIG4sIG1heCA9IC1JbmZpbml0eTtcbiAgZm9yIChpPTA7IGk8dmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgdiA9IGYgPyBmKHZhbHVlc1tpXSkgOiB2YWx1ZXNbaV07XG4gICAgaWYgKHYgIT0gbnVsbCAmJiB2ID4gbWF4KSB7IG1heCA9IHY7IGlkeCA9IGk7IH1cbiAgfVxuICByZXR1cm4gaWR4O1xufTtcblxuc3RhdHMuZW50cm9weSA9IGZ1bmN0aW9uKGNvdW50cykge1xuICB2YXIgaSwgcCwgcyA9IDAsIEggPSAwO1xuICBmb3IgKGk9MDsgaTxjb3VudHMubGVuZ3RoOyArK2kpIHtcbiAgICBzICs9IGNvdW50c1tpXTtcbiAgfVxuICBpZiAocyA9PT0gMCkgcmV0dXJuIDA7XG4gIGZvciAoaT0wOyBpPGNvdW50cy5sZW5ndGg7ICsraSkge1xuICAgIHAgPSBjb3VudHNbaV0gLyBzO1xuICAgIGlmIChwID4gMCkgSCArPSBwICogTWF0aC5sb2cocCkgLyBNYXRoLkxOMjtcbiAgfVxuICByZXR1cm4gLUg7XG59O1xuXG5zdGF0cy5lbnRyb3B5Lm5vcm1hbGl6ZWQgPSBmdW5jdGlvbihjb3VudHMpIHtcbiAgdmFyIEggPSBzdGF0cy5lbnRyb3B5KGNvdW50cyk7XG4gIHZhciBtYXggPSAtTWF0aC5sb2coMS9jb3VudHMubGVuZ3RoKSAvIE1hdGguTE4yO1xuICByZXR1cm4gSCAvIG1heDtcbn07XG5cbnN0YXRzLnByb2ZpbGUgPSBmdW5jdGlvbih2YWx1ZXMsIGYpIHtcbiAgaWYgKCF1dGlsLmlzQXJyYXkodmFsdWVzKSB8fCB2YWx1ZXMubGVuZ3RoPT09MCkgcmV0dXJuIG51bGw7XG5cbiAgLy8gaW5pdFxuICB2YXIgcCA9IHt9LFxuICAgICAgbWVhbiA9IDAsXG4gICAgICBjb3VudCA9IDAsXG4gICAgICBkaXN0aW5jdCA9IDAsXG4gICAgICBtaW4gPSBmID8gZih2YWx1ZXNbMF0pIDogdmFsdWVzWzBdLFxuICAgICAgbWF4ID0gbWluLFxuICAgICAgTTIgPSAwLFxuICAgICAgbWVkaWFuID0gbnVsbCxcbiAgICAgIHZhbHMgPSBbXSxcbiAgICAgIHUgPSB7fSwgZGVsdGEsIHNkLCBpLCB2LCB4LCBoYWxmO1xuXG4gIC8vIGNvbXB1dGUgc3VtbWFyeSBzdGF0c1xuICBmb3IgKGk9MCwgYz0wOyBpPHZhbHVlcy5sZW5ndGg7ICsraSkge1xuICAgIHYgPSBmID8gZih2YWx1ZXNbaV0pIDogdmFsdWVzW2ldO1xuICAgIGlmICh2ICE9IG51bGwpIHtcbiAgICAgIC8vIHVwZGF0ZSB1bmlxdWUgdmFsdWVzXG4gICAgICB1W3ZdID0gKHYgaW4gdSkgPyB1W3ZdICsgMSA6IChkaXN0aW5jdCArPSAxLCAxKTtcbiAgICAgIC8vIHVwZGF0ZSBtaW4vbWF4XG4gICAgICBpZiAodiA8IG1pbikgbWluID0gdjtcbiAgICAgIGlmICh2ID4gbWF4KSBtYXggPSB2O1xuICAgICAgLy8gdXBkYXRlIHN0YXRzXG4gICAgICB4ID0gKHR5cGVvZiB2ID09PSAnc3RyaW5nJykgPyB2Lmxlbmd0aCA6IHY7XG4gICAgICBkZWx0YSA9IHggLSBtZWFuO1xuICAgICAgbWVhbiA9IG1lYW4gKyBkZWx0YSAvICgrK2NvdW50KTtcbiAgICAgIE0yID0gTTIgKyBkZWx0YSAqICh4IC0gbWVhbik7XG4gICAgICB2YWxzLnB1c2goeCk7XG4gICAgfVxuICB9XG4gIE0yID0gTTIgLyAoY291bnQgLSAxKTtcbiAgc2QgPSBNYXRoLnNxcnQoTTIpO1xuXG4gIC8vIGNvbXB1dGUgbWVkaWFuXG4gIHZhbHMuc29ydCh1dGlsLmNtcCk7XG4gIGhhbGYgPSBNYXRoLmZsb29yKHZhbHMubGVuZ3RoLzIpO1xuICBtZWRpYW4gPSAodmFscy5sZW5ndGggJSAyKVxuICAgPyB2YWxzW2hhbGZdXG4gICA6ICh2YWxzW2hhbGYtMV0gKyB2YWxzW2hhbGZdKSAvIDIuMDtcblxuICByZXR1cm4ge1xuICAgIHVuaXF1ZTogICB1LFxuICAgIGNvdW50OiAgICBjb3VudCxcbiAgICBudWxsczogICAgdmFsdWVzLmxlbmd0aCAtIGNvdW50LFxuICAgIGRpc3RpbmN0OiBkaXN0aW5jdCxcbiAgICBtaW46ICAgICAgbWluLFxuICAgIG1heDogICAgICBtYXgsXG4gICAgbWVhbjogICAgIG1lYW4sXG4gICAgbWVkaWFuOiAgIG1lZGlhbixcbiAgICBzdGRldjogICAgc2QsXG4gICAgc2tldzogICAgIHNkID09PSAwID8gMCA6IChtZWFuIC0gbWVkaWFuKSAvIHNkXG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YXRzOyIsInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgc3RhdHMgPSByZXF1aXJlKCcuL3N0YXRzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGF0YSwgZmllbGRzKSB7XG4gIGlmIChkYXRhID09IG51bGwgfHwgZGF0YS5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBmaWVsZHMgPSBmaWVsZHMgfHwgdXRpbC5rZXlzKGRhdGFbMF0pO1xuXG4gIHZhciBwcm9maWxlcyA9IGZpZWxkcy5tYXAoZnVuY3Rpb24oZikge1xuICAgIHZhciBwID0gc3RhdHMucHJvZmlsZShkYXRhLCB1dGlsLmFjY2Vzc29yKGYpKTtcbiAgICByZXR1cm4gKHAuZmllbGQgPSBmLCBwKTtcbiAgfSk7XG4gIFxuICBwcm9maWxlcy50b1N0cmluZyA9IHByaW50U3VtbWFyeTtcbiAgcmV0dXJuIHByb2ZpbGVzO1xufTtcblxuZnVuY3Rpb24gcHJpbnRTdW1tYXJ5KCkge1xuICB2YXIgcHJvZmlsZXMgPSB0aGlzO1xuICB2YXIgc3RyID0gW107XG4gIHByb2ZpbGVzLmZvckVhY2goZnVuY3Rpb24ocCkge1xuICAgIHN0ci5wdXNoKFwiLS0tLS0gRmllbGQ6ICdcIiArIHAuZmllbGQgKyBcIicgLS0tLS1cIik7XG4gICAgaWYgKHR5cGVvZiBwLm1pbiA9PT0gJ3N0cmluZycgfHwgcC5kaXN0aW5jdCA8IDEwKSB7XG4gICAgICBzdHIucHVzaChwcmludENhdGVnb3JpY2FsUHJvZmlsZShwKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ci5wdXNoKHByaW50UXVhbnRpdGF0aXZlUHJvZmlsZShwKSk7XG4gICAgfVxuICAgIHN0ci5wdXNoKFwiXCIpO1xuICB9KTtcbiAgcmV0dXJuIHN0ci5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwcmludFF1YW50aXRhdGl2ZVByb2ZpbGUocCkge1xuICByZXR1cm4gW1xuICAgIFwiZGlzdGluY3Q6IFwiICsgcC5kaXN0aW5jdCxcbiAgICBcIm51bGxzOiAgICBcIiArIHAubnVsbHMsXG4gICAgXCJtaW46ICAgICAgXCIgKyBwLm1pbixcbiAgICBcIm1heDogICAgICBcIiArIHAubWF4LFxuICAgIFwibWVkaWFuOiAgIFwiICsgcC5tZWRpYW4sXG4gICAgXCJtZWFuOiAgICAgXCIgKyBwLm1lYW4sXG4gICAgXCJzdGRldjogICAgXCIgKyBwLnN0ZGV2LFxuICAgIFwic2tldzogICAgIFwiICsgcC5za2V3XG4gIF0uam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcHJpbnRDYXRlZ29yaWNhbFByb2ZpbGUocCkge1xuICB2YXIgbGlzdCA9IFtcbiAgICBcImRpc3RpbmN0OiBcIiArIHAuZGlzdGluY3QsXG4gICAgXCJudWxsczogICAgXCIgKyBwLm51bGxzLFxuICAgIFwidG9wIHZhbHVlczogXCJcbiAgXTtcbiAgdmFyIHUgPSBwLnVuaXF1ZTtcbiAgdmFyIHRvcCA9IHV0aWwua2V5cyh1KVxuICAgIC5zb3J0KGZ1bmN0aW9uKGEsYikgeyByZXR1cm4gdVtiXSAtIHVbYV07IH0pXG4gICAgLnNsaWNlKDAsIDYpXG4gICAgLm1hcChmdW5jdGlvbih2KSB7IHJldHVybiBcIiAnXCIgKyB2ICsgXCInIChcIiArIHVbdl0gKyBcIilcIjsgfSk7XG4gIHJldHVybiBsaXN0LmNvbmNhdCh0b3ApLmpvaW4oXCJcXG5cIik7XG59IiwidmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpO1xuXG52YXIgY29udGV4dCA9IHtcbiAgZm9ybWF0czogICAgW10sXG4gIGZvcm1hdF9tYXA6IHt9LFxuICB0cnVuY2F0ZTogICByZXF1aXJlKCcuL3RydW5jYXRlJylcbn07XG5cbmZ1bmN0aW9uIHRlbXBsYXRlKHRleHQpIHtcbiAgdmFyIHNyYyA9IHNvdXJjZSh0ZXh0LCBcImRcIik7XG4gIHNyYyA9IFwidmFyIF9fdDsgcmV0dXJuIFwiICsgc3JjICsgXCI7XCI7XG5cbiAgdHJ5IHtcbiAgICByZXR1cm4gKG5ldyBGdW5jdGlvbihcImRcIiwgc3JjKSkuYmluZChjb250ZXh0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGUuc291cmNlID0gc3JjO1xuICAgIHRocm93IGU7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0ZW1wbGF0ZTtcblxuLy8gY2xlYXIgY2FjaGUgb2YgZm9ybWF0IG9iamVjdHNcbi8vIGNhbiAqYnJlYWsqIHByaW9yIHRlbXBsYXRlIGZ1bmN0aW9ucywgc28gaW52b2tlIHdpdGggY2FyZVxudGVtcGxhdGUuY2xlYXJGb3JtYXRDYWNoZSA9IGZ1bmN0aW9uKCkge1xuICBjb250ZXh0LmZvcm1hdHMgPSBbXTtcbiAgY29udGV4dC5mb3JtYXRfbWFwID0ge307XG59O1xuXG5mdW5jdGlvbiBzb3VyY2UodGV4dCwgdmFyaWFibGUpIHtcbiAgdmFyaWFibGUgPSB2YXJpYWJsZSB8fCBcIm9ialwiO1xuICB2YXIgaW5kZXggPSAwO1xuICB2YXIgc3JjID0gXCInXCI7XG4gIHZhciByZWdleCA9IHRlbXBsYXRlX3JlO1xuXG4gIC8vIENvbXBpbGUgdGhlIHRlbXBsYXRlIHNvdXJjZSwgZXNjYXBpbmcgc3RyaW5nIGxpdGVyYWxzIGFwcHJvcHJpYXRlbHkuXG4gIHRleHQucmVwbGFjZShyZWdleCwgZnVuY3Rpb24obWF0Y2gsIGludGVycG9sYXRlLCBvZmZzZXQpIHtcbiAgICBzcmMgKz0gdGV4dFxuICAgICAgLnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgICAucmVwbGFjZSh0ZW1wbGF0ZV9lc2NhcGVyLCB0ZW1wbGF0ZV9lc2NhcGVDaGFyKTtcbiAgICBpbmRleCA9IG9mZnNldCArIG1hdGNoLmxlbmd0aDtcblxuICAgIGlmIChpbnRlcnBvbGF0ZSkge1xuICAgICAgc3JjICs9IFwiJ1xcbisoKF9fdD0oXCJcbiAgICAgICAgKyB0ZW1wbGF0ZV92YXIoaW50ZXJwb2xhdGUsIHZhcmlhYmxlKVxuICAgICAgICArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG4gICAgfVxuXG4gICAgLy8gQWRvYmUgVk1zIG5lZWQgdGhlIG1hdGNoIHJldHVybmVkIHRvIHByb2R1Y2UgdGhlIGNvcnJlY3Qgb2ZmZXN0LlxuICAgIHJldHVybiBtYXRjaDtcbiAgfSk7XG4gIHJldHVybiBzcmMgKyBcIidcIjtcbn1cblxuZnVuY3Rpb24gdGVtcGxhdGVfdmFyKHRleHQsIHZhcmlhYmxlKSB7XG4gIHZhciBmaWx0ZXJzID0gdGV4dC5zcGxpdCgnfCcpO1xuICB2YXIgcHJvcCA9IGZpbHRlcnMuc2hpZnQoKS50cmltKCk7XG4gIHZhciBmb3JtYXQgPSBbXTtcbiAgdmFyIHN0cmluZ0Nhc3QgPSB0cnVlO1xuICBcbiAgZnVuY3Rpb24gc3RyY2FsbChmbikge1xuICAgIGZuID0gZm4gfHwgXCJcIjtcbiAgICBpZiAoc3RyaW5nQ2FzdCkge1xuICAgICAgc3RyaW5nQ2FzdCA9IGZhbHNlO1xuICAgICAgc3JjID0gXCJTdHJpbmcoXCIgKyBzcmMgKyBcIilcIiArIGZuO1xuICAgIH0gZWxzZSB7XG4gICAgICBzcmMgKz0gZm47XG4gICAgfVxuICAgIHJldHVybiBzcmM7XG4gIH1cbiAgXG4gIHZhciBzcmMgPSB1dGlsLmZpZWxkKHByb3ApLm1hcCh1dGlsLnN0cikuam9pbihcIl1bXCIpO1xuICBzcmMgPSB2YXJpYWJsZSArIFwiW1wiICsgc3JjICsgXCJdXCI7XG4gIFxuICBmb3IgKHZhciBpPTA7IGk8ZmlsdGVycy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBmID0gZmlsdGVyc1tpXSwgYXJncyA9IG51bGwsIHBpZHgsIGEsIGI7XG5cbiAgICBpZiAoKHBpZHg9Zi5pbmRleE9mKCc6JykpID4gMCkge1xuICAgICAgZiA9IGYuc2xpY2UoMCwgcGlkeCk7XG4gICAgICBhcmdzID0gZmlsdGVyc1tpXS5zbGljZShwaWR4KzEpLnNwbGl0KCcsJylcbiAgICAgICAgLm1hcChmdW5jdGlvbihzKSB7IHJldHVybiBzLnRyaW0oKTsgfSk7XG4gICAgfVxuICAgIGYgPSBmLnRyaW0oKTtcblxuICAgIHN3aXRjaCAoZikge1xuICAgICAgY2FzZSAnbGVuZ3RoJzpcbiAgICAgICAgc3RyY2FsbCgnLmxlbmd0aCcpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xvd2VyJzpcbiAgICAgICAgc3RyY2FsbCgnLnRvTG93ZXJDYXNlKCknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd1cHBlcic6XG4gICAgICAgIHN0cmNhbGwoJy50b1VwcGVyQ2FzZSgpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbG93ZXItbG9jYWxlJzpcbiAgICAgICAgc3RyY2FsbCgnLnRvTG9jYWxlTG93ZXJDYXNlKCknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd1cHBlci1sb2NhbGUnOlxuICAgICAgICBzdHJjYWxsKCcudG9Mb2NhbGVVcHBlckNhc2UoKScpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3RyaW0nOlxuICAgICAgICBzdHJjYWxsKCcudHJpbSgpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgIGEgPSB1dGlsLm51bWJlcihhcmdzWzBdKTtcbiAgICAgICAgc3RyY2FsbCgnLnNsaWNlKDAsJyArIGEgKyAnKScpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgYSA9IHV0aWwubnVtYmVyKGFyZ3NbMF0pO1xuICAgICAgICBzdHJjYWxsKCcuc2xpY2UoLScgKyBhICsnKScpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21pZCc6XG4gICAgICAgIGEgPSB1dGlsLm51bWJlcihhcmdzWzBdKTtcbiAgICAgICAgYiA9IGEgKyB1dGlsLm51bWJlcihhcmdzWzFdKTtcbiAgICAgICAgc3RyY2FsbCgnLnNsaWNlKCsnK2ErJywnK2IrJyknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzbGljZSc6XG4gICAgICAgIGEgPSB1dGlsLm51bWJlcihhcmdzWzBdKTtcbiAgICAgICAgc3RyY2FsbCgnLnNsaWNlKCcrIGFcbiAgICAgICAgICArIChhcmdzLmxlbmd0aCA+IDEgPyAnLCcgKyB1dGlsLm51bWJlcihhcmdzWzFdKSA6ICcnKVxuICAgICAgICAgICsgJyknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0cnVuY2F0ZSc6XG4gICAgICAgIGEgPSB1dGlsLm51bWJlcihhcmdzWzBdKTtcbiAgICAgICAgYiA9IGFyZ3NbMV07XG4gICAgICAgIGIgPSAoYiE9PVwibGVmdFwiICYmIGIhPT1cIm1pZGRsZVwiICYmIGIhPT1cImNlbnRlclwiKSA/IFwicmlnaHRcIiA6IGI7XG4gICAgICAgIHNyYyA9ICd0aGlzLnRydW5jYXRlKCcgKyBzdHJjYWxsKCkgKyAnLCcgKyBhICsgJyxcIicgKyBiICsgJ1wiKSc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgYSA9IHRlbXBsYXRlX2Zvcm1hdChhcmdzWzBdLCBkMy5mb3JtYXQpO1xuICAgICAgICBzdHJpbmdDYXN0ID0gZmFsc2U7XG4gICAgICAgIHNyYyA9ICd0aGlzLmZvcm1hdHNbJythKyddKCcrc3JjKycpJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0aW1lJzpcbiAgICAgICAgYSA9IHRlbXBsYXRlX2Zvcm1hdChhcmdzWzBdLCBkMy50aW1lLmZvcm1hdCk7XG4gICAgICAgIHN0cmluZ0Nhc3QgPSBmYWxzZTtcbiAgICAgICAgc3JjID0gJ3RoaXMuZm9ybWF0c1snK2ErJ10oJytzcmMrJyknO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IEVycm9yKFwiVW5yZWNvZ25pemVkIHRlbXBsYXRlIGZpbHRlcjogXCIgKyBmKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gc3JjO1xufVxuXG52YXIgdGVtcGxhdGVfcmUgPSAvXFx7XFx7KC4rPylcXH1cXH18JC9nO1xuXG4vLyBDZXJ0YWluIGNoYXJhY3RlcnMgbmVlZCB0byBiZSBlc2NhcGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgcHV0IGludG8gYVxuLy8gc3RyaW5nIGxpdGVyYWwuXG52YXIgdGVtcGxhdGVfZXNjYXBlcyA9IHtcbiAgXCInXCI6ICAgICAgXCInXCIsXG4gICdcXFxcJzogICAgICdcXFxcJyxcbiAgJ1xccic6ICAgICAncicsXG4gICdcXG4nOiAgICAgJ24nLFxuICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICdcXHUyMDI5JzogJ3UyMDI5J1xufTtcblxudmFyIHRlbXBsYXRlX2VzY2FwZXIgPSAvXFxcXHwnfFxccnxcXG58XFx1MjAyOHxcXHUyMDI5L2c7XG5cbmZ1bmN0aW9uIHRlbXBsYXRlX2VzY2FwZUNoYXIobWF0Y2gpIHtcbiAgcmV0dXJuICdcXFxcJyArIHRlbXBsYXRlX2VzY2FwZXNbbWF0Y2hdO1xufTtcblxuZnVuY3Rpb24gdGVtcGxhdGVfZm9ybWF0KHBhdHRlcm4sIGZtdCkge1xuICBpZiAoKHBhdHRlcm5bMF0gPT09IFwiJ1wiICYmIHBhdHRlcm5bcGF0dGVybi5sZW5ndGgtMV0gPT09IFwiJ1wiKSB8fFxuICAgICAgKHBhdHRlcm5bMF0gIT09ICdcIicgJiYgcGF0dGVybltwYXR0ZXJuLmxlbmd0aC0xXSA9PT0gJ1wiJykpIHtcbiAgICBwYXR0ZXJuID0gcGF0dGVybi5zbGljZSgxLCAtMSk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgRXJyb3IoXCJGb3JtYXQgcGF0dGVybiBtdXN0IGJlIHF1b3RlZDogXCIgKyBwYXR0ZXJuKTtcbiAgfVxuICBpZiAoIWNvbnRleHQuZm9ybWF0X21hcFtwYXR0ZXJuXSkge1xuICAgIHZhciBmID0gZm10KHBhdHRlcm4pO1xuICAgIHZhciBpID0gY29udGV4dC5mb3JtYXRzLmxlbmd0aDtcbiAgICBjb250ZXh0LmZvcm1hdHMucHVzaChmKTtcbiAgICBjb250ZXh0LmZvcm1hdF9tYXBbcGF0dGVybl0gPSBpO1xuICB9XG4gIHJldHVybiBjb250ZXh0LmZvcm1hdF9tYXBbcGF0dGVybl07XG59O1xuIiwidmFyIEZJRUxEUyA9IHtcbiAgcGFyZW50OiBcInBhcmVudFwiLFxuICBjaGlsZHJlbjogXCJjaGlsZHJlblwiXG59O1xuXG5mdW5jdGlvbiB0b1RhYmxlKHJvb3QsIGNoaWxkcmVuRmllbGQsIHBhcmVudEZpZWxkKSB7XG4gIGNoaWxkcmVuRmllbGQgPSBjaGlsZHJlbkZpZWxkIHx8IEZJRUxEUy5jaGlsZHJlbjtcbiAgcGFyZW50RmllbGQgPSBwYXJlbnRGaWVsZCB8fCBGSUVMRFMucGFyZW50O1xuICB2YXIgdGFibGUgPSBbXTtcbiAgXG4gIGZ1bmN0aW9uIHZpc2l0KG5vZGUsIHBhcmVudCkge1xuICAgIG5vZGVbcGFyZW50RmllbGRdID0gcGFyZW50O1xuICAgIHRhYmxlLnB1c2gobm9kZSk7XG4gICAgXG4gICAgdmFyIGNoaWxkcmVuID0gbm9kZVtjaGlsZHJlbkZpZWxkXTtcbiAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgIGZvciAodmFyIGk9MDsgaTxjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICB2aXNpdChjaGlsZHJlbltpXSwgbm9kZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICB2aXNpdChyb290LCBudWxsKTtcbiAgcmV0dXJuICh0YWJsZS5yb290ID0gcm9vdCwgdGFibGUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgdG9UYWJsZTogdG9UYWJsZSxcbiAgZmllbGRzOiBGSUVMRFNcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzLCBsZW5ndGgsIHBvcywgd29yZCwgZWxsaXBzaXMpIHtcbiAgdmFyIGxlbiA9IHMubGVuZ3RoO1xuICBpZiAobGVuIDw9IGxlbmd0aCkgcmV0dXJuIHM7XG4gIGVsbGlwc2lzID0gZWxsaXBzaXMgfHwgXCIuLi5cIjtcbiAgdmFyIGwgPSBNYXRoLm1heCgwLCBsZW5ndGggLSBlbGxpcHNpcy5sZW5ndGgpO1xuXG4gIHN3aXRjaCAocG9zKSB7XG4gICAgY2FzZSBcImxlZnRcIjpcbiAgICAgIHJldHVybiBlbGxpcHNpcyArICh3b3JkID8gdV90cnVuY2F0ZU9uV29yZChzLGwsMSkgOiBzLnNsaWNlKGxlbi1sKSk7XG4gICAgY2FzZSBcIm1pZGRsZVwiOlxuICAgIGNhc2UgXCJjZW50ZXJcIjpcbiAgICAgIHZhciBsMSA9IE1hdGguY2VpbChsLzIpLCBsMiA9IE1hdGguZmxvb3IobC8yKTtcbiAgICAgIHJldHVybiAod29yZCA/IHRydW5jYXRlT25Xb3JkKHMsbDEpIDogcy5zbGljZSgwLGwxKSkgKyBlbGxpcHNpc1xuICAgICAgICArICh3b3JkID8gdHJ1bmNhdGVPbldvcmQocyxsMiwxKSA6IHMuc2xpY2UobGVuLWwyKSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAod29yZCA/IHRydW5jYXRlT25Xb3JkKHMsbCkgOiBzLnNsaWNlKDAsbCkpICsgZWxsaXBzaXM7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHRydW5jYXRlT25Xb3JkKHMsIGxlbiwgcmV2KSB7XG4gIHZhciBjbnQgPSAwLCB0b2sgPSBzLnNwbGl0KHRydW5jYXRlX3dvcmRfcmUpO1xuICBpZiAocmV2KSB7XG4gICAgcyA9ICh0b2sgPSB0b2sucmV2ZXJzZSgpKVxuICAgICAgLmZpbHRlcihmdW5jdGlvbih3KSB7IGNudCArPSB3Lmxlbmd0aDsgcmV0dXJuIGNudCA8PSBsZW47IH0pXG4gICAgICAucmV2ZXJzZSgpO1xuICB9IGVsc2Uge1xuICAgIHMgPSB0b2suZmlsdGVyKGZ1bmN0aW9uKHcpIHsgY250ICs9IHcubGVuZ3RoOyByZXR1cm4gY250IDw9IGxlbjsgfSk7XG4gIH1cbiAgcmV0dXJuIHMubGVuZ3RoID8gcy5qb2luKFwiXCIpLnRyaW0oKSA6IHRva1swXS5zbGljZSgwLCBsZW4pO1xufVxuXG52YXIgdHJ1bmNhdGVfd29yZF9yZSA9IC8oW1xcdTAwMDlcXHUwMDBBXFx1MDAwQlxcdTAwMENcXHUwMDBEXFx1MDAyMFxcdTAwQTBcXHUxNjgwXFx1MTgwRVxcdTIwMDBcXHUyMDAxXFx1MjAwMlxcdTIwMDNcXHUyMDA0XFx1MjAwNVxcdTIwMDZcXHUyMDA3XFx1MjAwOFxcdTIwMDlcXHUyMDBBXFx1MjAyRlxcdTIwNUZcXHUyMDI4XFx1MjAyOVxcdTMwMDBcXHVGRUZGXSkvO1xuIiwidmFyIHUgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyB3aGVyZSBhcmUgd2U/XG5cbnUuaXNOb2RlID0gdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICYmIHR5cGVvZiBwcm9jZXNzLnN0ZGVyciAhPT0gJ3VuZGVmaW5lZCc7XG5cbi8vIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbnUuaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG59O1xuXG51LmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBGdW5jdGlvbl0nO1xufTtcblxudS5pc1N0cmluZyA9IGZ1bmN0aW9uKG9iaikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IFN0cmluZ10nO1xufTtcblxudS5pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxudS5pc051bWJlciA9IGZ1bmN0aW9uKG9iaikge1xuICByZXR1cm4gIWlzTmFOKHBhcnNlRmxvYXQob2JqKSkgJiYgaXNGaW5pdGUob2JqKTtcbn07XG5cbnUuaXNCb29sZWFuID0gZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xufTtcblxudS5pc0RhdGUgPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBEYXRlXSc7XG59O1xuXG51LmlzTm90TnVsbCA9IGZ1bmN0aW9uKG9iaikge1xuICByZXR1cm4gb2JqICE9IG51bGw7IC8vIFRPRE8gaW5jbHVkZSBOYU4gaGVyZT9cbn07XG5cbi8vIHR5cGUgY29lcmNpb24gZnVuY3Rpb25zXG5cbnUubnVtYmVyID0gZnVuY3Rpb24ocykgeyByZXR1cm4gcyA9PSBudWxsID8gbnVsbCA6ICtzOyB9O1xuXG51LmJvb2xlYW4gPSBmdW5jdGlvbihzKSB7IHJldHVybiBzID09IG51bGwgPyBudWxsIDogcz09PSdmYWxzZScgPyBmYWxzZSA6ICEhczsgfTtcblxudS5kYXRlID0gZnVuY3Rpb24ocykgeyByZXR1cm4gcyA9PSBudWxsID8gbnVsbCA6IERhdGUucGFyc2Uocyk7IH1cblxudS5hcnJheSA9IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHggIT0gbnVsbCA/ICh1LmlzQXJyYXkoeCkgPyB4IDogW3hdKSA6IFtdOyB9O1xuXG51LnN0ciA9IGZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHUuaXNBcnJheSh4KSA/IFwiW1wiICsgeC5tYXAodS5zdHIpICsgXCJdXCJcbiAgICA6IHUuaXNPYmplY3QoeCkgPyBKU09OLnN0cmluZ2lmeSh4KVxuICAgIDogdS5pc1N0cmluZyh4KSA/IChcIidcIit1dGlsX2VzY2FwZV9zdHIoeCkrXCInXCIpIDogeDtcbn07XG5cbnZhciBlc2NhcGVfc3RyX3JlID0gLyhefFteXFxcXF0pJy9nO1xuXG5mdW5jdGlvbiB1dGlsX2VzY2FwZV9zdHIoeCkge1xuICByZXR1cm4geC5yZXBsYWNlKGVzY2FwZV9zdHJfcmUsIFwiJDFcXFxcJ1wiKTtcbn1cblxuLy8gdXRpbGl0eSBmdW5jdGlvbnNcblxudS5pZGVudGl0eSA9IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHg7IH07XG5cbnUudHJ1ZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdHJ1ZTsgfTtcblxudS5kdXBsaWNhdGUgPSBmdW5jdGlvbihvYmopIHtcbiAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkob2JqKSk7XG59O1xuXG51LmVxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYSkgPT09IEpTT04uc3RyaW5naWZ5KGIpO1xufTtcblxudS5leHRlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgZm9yICh2YXIgeCwgbmFtZSwgaT0xLCBsZW49YXJndW1lbnRzLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIHggPSBhcmd1bWVudHNbaV07XG4gICAgZm9yIChuYW1lIGluIHgpIHsgb2JqW25hbWVdID0geFtuYW1lXTsgfVxuICB9XG4gIHJldHVybiBvYmo7XG59O1xuXG51LmtleXMgPSBmdW5jdGlvbih4KSB7XG4gIHZhciBrZXlzID0gW10sIGs7XG4gIGZvciAoayBpbiB4KSBrZXlzLnB1c2goayk7XG4gIHJldHVybiBrZXlzO1xufTtcblxudS52YWxzID0gZnVuY3Rpb24oeCkge1xuICB2YXIgdmFscyA9IFtdLCBrO1xuICBmb3IgKGsgaW4geCkgdmFscy5wdXNoKHhba10pO1xuICByZXR1cm4gdmFscztcbn07XG5cbnUudG9NYXAgPSBmdW5jdGlvbihsaXN0KSB7XG4gIHJldHVybiBsaXN0LnJlZHVjZShmdW5jdGlvbihvYmosIHgpIHtcbiAgICByZXR1cm4gKG9ialt4XSA9IDEsIG9iaik7XG4gIH0sIHt9KTtcbn07XG5cbnUua2V5c3RyID0gZnVuY3Rpb24odmFsdWVzKSB7XG4gIC8vIHVzZSB0byBlbnN1cmUgY29uc2lzdGVudCBrZXkgZ2VuZXJhdGlvbiBhY3Jvc3MgbW9kdWxlc1xuICByZXR1cm4gdmFsdWVzLmpvaW4oXCJ8XCIpO1xufTtcblxuLy8gZGF0YSBhY2Nlc3MgZnVuY3Rpb25zXG5cbnUuZmllbGQgPSBmdW5jdGlvbihmKSB7XG4gIHJldHVybiBmLnNwbGl0KFwiXFxcXC5cIilcbiAgICAubWFwKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc3BsaXQoXCIuXCIpOyB9KVxuICAgIC5yZWR1Y2UoZnVuY3Rpb24oYSwgYikge1xuICAgICAgaWYgKGEubGVuZ3RoKSB7IGFbYS5sZW5ndGgtMV0gKz0gXCIuXCIgKyBiLnNoaWZ0KCk7IH1cbiAgICAgIGEucHVzaC5hcHBseShhLCBiKTtcbiAgICAgIHJldHVybiBhO1xuICAgIH0sIFtdKTtcbn07XG5cbnUuYWNjZXNzb3IgPSBmdW5jdGlvbihmKSB7XG4gIHZhciBzO1xuICByZXR1cm4gKHUuaXNGdW5jdGlvbihmKSB8fCBmPT1udWxsKVxuICAgID8gZiA6IHUuaXNTdHJpbmcoZikgJiYgKHM9dS5maWVsZChmKSkubGVuZ3RoID4gMVxuICAgID8gZnVuY3Rpb24oeCkgeyByZXR1cm4gcy5yZWR1Y2UoZnVuY3Rpb24oeCxmKSB7XG4gICAgICAgICAgcmV0dXJuIHhbZl07XG4gICAgICAgIH0sIHgpO1xuICAgICAgfVxuICAgIDogZnVuY3Rpb24oeCkgeyByZXR1cm4geFtmXTsgfTtcbn07XG5cbnUubXV0YXRvciA9IGZ1bmN0aW9uKGYpIHtcbiAgdmFyIHM7XG4gIHJldHVybiB1LmlzU3RyaW5nKGYpICYmIChzPXUuZmllbGQoZikpLmxlbmd0aCA+IDFcbiAgICA/IGZ1bmN0aW9uKHgsIHYpIHtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHMubGVuZ3RoLTE7ICsraSkgeCA9IHhbc1tpXV07XG4gICAgICAgIHhbc1tpXV0gPSB2O1xuICAgICAgfVxuICAgIDogZnVuY3Rpb24oeCwgdikgeyB4W2ZdID0gdjsgfTtcbn07XG5cblxuLy8gY29tcGFyaXNvbiAvIHNvcnRpbmcgZnVuY3Rpb25zXG5cbnUuY29tcGFyYXRvciA9IGZ1bmN0aW9uKHNvcnQpIHtcbiAgdmFyIHNpZ24gPSBbXTtcbiAgaWYgKHNvcnQgPT09IHVuZGVmaW5lZCkgc29ydCA9IFtdO1xuICBzb3J0ID0gdS5hcnJheShzb3J0KS5tYXAoZnVuY3Rpb24oZikge1xuICAgIHZhciBzID0gMTtcbiAgICBpZiAgICAgIChmWzBdID09PSBcIi1cIikgeyBzID0gLTE7IGYgPSBmLnNsaWNlKDEpOyB9XG4gICAgZWxzZSBpZiAoZlswXSA9PT0gXCIrXCIpIHsgcyA9ICsxOyBmID0gZi5zbGljZSgxKTsgfVxuICAgIHNpZ24ucHVzaChzKTtcbiAgICByZXR1cm4gdS5hY2Nlc3NvcihmKTtcbiAgfSk7XG4gIHJldHVybiBmdW5jdGlvbihhLGIpIHtcbiAgICB2YXIgaSwgbiwgZiwgeCwgeTtcbiAgICBmb3IgKGk9MCwgbj1zb3J0Lmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICAgIGYgPSBzb3J0W2ldOyB4ID0gZihhKTsgeSA9IGYoYik7XG4gICAgICBpZiAoeCA8IHkpIHJldHVybiAtMSAqIHNpZ25baV07XG4gICAgICBpZiAoeCA+IHkpIHJldHVybiBzaWduW2ldO1xuICAgIH1cbiAgICByZXR1cm4gMDtcbiAgfTtcbn07XG5cbnUuY21wID0gZnVuY3Rpb24oYSwgYikge1xuICBpZiAoYSA8IGIpIHtcbiAgICByZXR1cm4gLTE7XG4gIH0gZWxzZSBpZiAoYSA+IGIpIHtcbiAgICByZXR1cm4gMTtcbiAgfSBlbHNlIGlmIChhID49IGIpIHtcbiAgICByZXR1cm4gMDtcbiAgfSBlbHNlIGlmIChhID09PSBudWxsICYmIGIgPT09IG51bGwpIHtcbiAgICByZXR1cm4gMDtcbiAgfSBlbHNlIGlmIChhID09PSBudWxsKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2UgaWYgKGIgPT09IG51bGwpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gTmFOO1xufTtcblxudS5udW1jbXAgPSBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIC0gYjsgfTtcblxudS5zdGFibGVzb3J0ID0gZnVuY3Rpb24oYXJyYXksIHNvcnRCeSwga2V5Rm4pIHtcbiAgdmFyIGluZGljZXMgPSBhcnJheS5yZWR1Y2UoZnVuY3Rpb24oaWR4LCB2LCBpKSB7XG4gICAgcmV0dXJuIChpZHhba2V5Rm4odildID0gaSwgaWR4KTtcbiAgfSwge30pO1xuXG4gIGFycmF5LnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciBzYSA9IHNvcnRCeShhKSxcbiAgICAgICAgc2IgPSBzb3J0QnkoYik7XG4gICAgcmV0dXJuIHNhIDwgc2IgPyAtMSA6IHNhID4gc2IgPyAxXG4gICAgICAgICA6IChpbmRpY2VzW2tleUZuKGEpXSAtIGluZGljZXNba2V5Rm4oYildKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGFycmF5O1xufTtcblxuLy8gc3RyaW5nIGZ1bmN0aW9uc1xuXG4vLyBFUzYgY29tcGF0aWJpbGl0eSBwZXIgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvU3RyaW5nL3N0YXJ0c1dpdGgjUG9seWZpbGxcbi8vIFdlIGNvdWxkIGhhdmUgdXNlZCB0aGUgcG9seWZpbGwgY29kZSwgYnV0IGxldHMgd2FpdCB1bnRpbCBFUzYgYmVjb21lcyBhIHN0YW5kYXJkIGZpcnN0XG51LnN0YXJ0c1dpdGggPSBTdHJpbmcucHJvdG90eXBlLnN0YXJ0c1dpdGhcbiAgPyBmdW5jdGlvbihzdHJpbmcsIHNlYXJjaFN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcuc3RhcnRzV2l0aChzZWFyY2hTdHJpbmcpO1xuICB9XG4gIDogZnVuY3Rpb24oc3RyaW5nLCBzZWFyY2hTdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLmxhc3RJbmRleE9mKHNlYXJjaFN0cmluZywgMCkgPT09IDA7XG4gIH07IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYi9oZWFwJyk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuOC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBIZWFwLCBkZWZhdWx0Q21wLCBmbG9vciwgaGVhcGlmeSwgaGVhcHBvcCwgaGVhcHB1c2gsIGhlYXBwdXNocG9wLCBoZWFwcmVwbGFjZSwgaW5zb3J0LCBtaW4sIG5sYXJnZXN0LCBuc21hbGxlc3QsIHVwZGF0ZUl0ZW0sIF9zaWZ0ZG93biwgX3NpZnR1cDtcblxuICBmbG9vciA9IE1hdGguZmxvb3IsIG1pbiA9IE1hdGgubWluO1xuXG5cbiAgLypcbiAgRGVmYXVsdCBjb21wYXJpc29uIGZ1bmN0aW9uIHRvIGJlIHVzZWRcbiAgICovXG5cbiAgZGVmYXVsdENtcCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICBpZiAoeCA8IHkpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgaWYgKHggPiB5KSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH07XG5cblxuICAvKlxuICBJbnNlcnQgaXRlbSB4IGluIGxpc3QgYSwgYW5kIGtlZXAgaXQgc29ydGVkIGFzc3VtaW5nIGEgaXMgc29ydGVkLlxuICBcbiAgSWYgeCBpcyBhbHJlYWR5IGluIGEsIGluc2VydCBpdCB0byB0aGUgcmlnaHQgb2YgdGhlIHJpZ2h0bW9zdCB4LlxuICBcbiAgT3B0aW9uYWwgYXJncyBsbyAoZGVmYXVsdCAwKSBhbmQgaGkgKGRlZmF1bHQgYS5sZW5ndGgpIGJvdW5kIHRoZSBzbGljZVxuICBvZiBhIHRvIGJlIHNlYXJjaGVkLlxuICAgKi9cblxuICBpbnNvcnQgPSBmdW5jdGlvbihhLCB4LCBsbywgaGksIGNtcCkge1xuICAgIHZhciBtaWQ7XG4gICAgaWYgKGxvID09IG51bGwpIHtcbiAgICAgIGxvID0gMDtcbiAgICB9XG4gICAgaWYgKGNtcCA9PSBudWxsKSB7XG4gICAgICBjbXAgPSBkZWZhdWx0Q21wO1xuICAgIH1cbiAgICBpZiAobG8gPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2xvIG11c3QgYmUgbm9uLW5lZ2F0aXZlJyk7XG4gICAgfVxuICAgIGlmIChoaSA9PSBudWxsKSB7XG4gICAgICBoaSA9IGEubGVuZ3RoO1xuICAgIH1cbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgbWlkID0gZmxvb3IoKGxvICsgaGkpIC8gMik7XG4gICAgICBpZiAoY21wKHgsIGFbbWlkXSkgPCAwKSB7XG4gICAgICAgIGhpID0gbWlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG8gPSBtaWQgKyAxO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gKFtdLnNwbGljZS5hcHBseShhLCBbbG8sIGxvIC0gbG9dLmNvbmNhdCh4KSksIHgpO1xuICB9O1xuXG5cbiAgLypcbiAgUHVzaCBpdGVtIG9udG8gaGVhcCwgbWFpbnRhaW5pbmcgdGhlIGhlYXAgaW52YXJpYW50LlxuICAgKi9cblxuICBoZWFwcHVzaCA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBjbXApIHtcbiAgICBpZiAoY21wID09IG51bGwpIHtcbiAgICAgIGNtcCA9IGRlZmF1bHRDbXA7XG4gICAgfVxuICAgIGFycmF5LnB1c2goaXRlbSk7XG4gICAgcmV0dXJuIF9zaWZ0ZG93bihhcnJheSwgMCwgYXJyYXkubGVuZ3RoIC0gMSwgY21wKTtcbiAgfTtcblxuXG4gIC8qXG4gIFBvcCB0aGUgc21hbGxlc3QgaXRlbSBvZmYgdGhlIGhlYXAsIG1haW50YWluaW5nIHRoZSBoZWFwIGludmFyaWFudC5cbiAgICovXG5cbiAgaGVhcHBvcCA9IGZ1bmN0aW9uKGFycmF5LCBjbXApIHtcbiAgICB2YXIgbGFzdGVsdCwgcmV0dXJuaXRlbTtcbiAgICBpZiAoY21wID09IG51bGwpIHtcbiAgICAgIGNtcCA9IGRlZmF1bHRDbXA7XG4gICAgfVxuICAgIGxhc3RlbHQgPSBhcnJheS5wb3AoKTtcbiAgICBpZiAoYXJyYXkubGVuZ3RoKSB7XG4gICAgICByZXR1cm5pdGVtID0gYXJyYXlbMF07XG4gICAgICBhcnJheVswXSA9IGxhc3RlbHQ7XG4gICAgICBfc2lmdHVwKGFycmF5LCAwLCBjbXApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm5pdGVtID0gbGFzdGVsdDtcbiAgICB9XG4gICAgcmV0dXJuIHJldHVybml0ZW07XG4gIH07XG5cblxuICAvKlxuICBQb3AgYW5kIHJldHVybiB0aGUgY3VycmVudCBzbWFsbGVzdCB2YWx1ZSwgYW5kIGFkZCB0aGUgbmV3IGl0ZW0uXG4gIFxuICBUaGlzIGlzIG1vcmUgZWZmaWNpZW50IHRoYW4gaGVhcHBvcCgpIGZvbGxvd2VkIGJ5IGhlYXBwdXNoKCksIGFuZCBjYW4gYmVcbiAgbW9yZSBhcHByb3ByaWF0ZSB3aGVuIHVzaW5nIGEgZml4ZWQgc2l6ZSBoZWFwLiBOb3RlIHRoYXQgdGhlIHZhbHVlXG4gIHJldHVybmVkIG1heSBiZSBsYXJnZXIgdGhhbiBpdGVtISBUaGF0IGNvbnN0cmFpbnMgcmVhc29uYWJsZSB1c2Ugb2ZcbiAgdGhpcyByb3V0aW5lIHVubGVzcyB3cml0dGVuIGFzIHBhcnQgb2YgYSBjb25kaXRpb25hbCByZXBsYWNlbWVudDpcbiAgICAgIGlmIGl0ZW0gPiBhcnJheVswXVxuICAgICAgICBpdGVtID0gaGVhcHJlcGxhY2UoYXJyYXksIGl0ZW0pXG4gICAqL1xuXG4gIGhlYXByZXBsYWNlID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGNtcCkge1xuICAgIHZhciByZXR1cm5pdGVtO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgcmV0dXJuaXRlbSA9IGFycmF5WzBdO1xuICAgIGFycmF5WzBdID0gaXRlbTtcbiAgICBfc2lmdHVwKGFycmF5LCAwLCBjbXApO1xuICAgIHJldHVybiByZXR1cm5pdGVtO1xuICB9O1xuXG5cbiAgLypcbiAgRmFzdCB2ZXJzaW9uIG9mIGEgaGVhcHB1c2ggZm9sbG93ZWQgYnkgYSBoZWFwcG9wLlxuICAgKi9cblxuICBoZWFwcHVzaHBvcCA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBjbXApIHtcbiAgICB2YXIgX3JlZjtcbiAgICBpZiAoY21wID09IG51bGwpIHtcbiAgICAgIGNtcCA9IGRlZmF1bHRDbXA7XG4gICAgfVxuICAgIGlmIChhcnJheS5sZW5ndGggJiYgY21wKGFycmF5WzBdLCBpdGVtKSA8IDApIHtcbiAgICAgIF9yZWYgPSBbYXJyYXlbMF0sIGl0ZW1dLCBpdGVtID0gX3JlZlswXSwgYXJyYXlbMF0gPSBfcmVmWzFdO1xuICAgICAgX3NpZnR1cChhcnJheSwgMCwgY21wKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZW07XG4gIH07XG5cblxuICAvKlxuICBUcmFuc2Zvcm0gbGlzdCBpbnRvIGEgaGVhcCwgaW4tcGxhY2UsIGluIE8oYXJyYXkubGVuZ3RoKSB0aW1lLlxuICAgKi9cblxuICBoZWFwaWZ5ID0gZnVuY3Rpb24oYXJyYXksIGNtcCkge1xuICAgIHZhciBpLCBfaSwgX2osIF9sZW4sIF9yZWYsIF9yZWYxLCBfcmVzdWx0cywgX3Jlc3VsdHMxO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgX3JlZjEgPSAoZnVuY3Rpb24oKSB7XG4gICAgICBfcmVzdWx0czEgPSBbXTtcbiAgICAgIGZvciAodmFyIF9qID0gMCwgX3JlZiA9IGZsb29yKGFycmF5Lmxlbmd0aCAvIDIpOyAwIDw9IF9yZWYgPyBfaiA8IF9yZWYgOiBfaiA+IF9yZWY7IDAgPD0gX3JlZiA/IF9qKysgOiBfai0tKXsgX3Jlc3VsdHMxLnB1c2goX2opOyB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHMxO1xuICAgIH0pLmFwcGx5KHRoaXMpLnJldmVyc2UoKTtcbiAgICBfcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjEubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGkgPSBfcmVmMVtfaV07XG4gICAgICBfcmVzdWx0cy5wdXNoKF9zaWZ0dXAoYXJyYXksIGksIGNtcCkpO1xuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH07XG5cblxuICAvKlxuICBVcGRhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZSBnaXZlbiBpdGVtIGluIHRoZSBoZWFwLlxuICBUaGlzIGZ1bmN0aW9uIHNob3VsZCBiZSBjYWxsZWQgZXZlcnkgdGltZSB0aGUgaXRlbSBpcyBiZWluZyBtb2RpZmllZC5cbiAgICovXG5cbiAgdXBkYXRlSXRlbSA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBjbXApIHtcbiAgICB2YXIgcG9zO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgcG9zID0gYXJyYXkuaW5kZXhPZihpdGVtKTtcbiAgICBpZiAocG9zID09PSAtMSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBfc2lmdGRvd24oYXJyYXksIDAsIHBvcywgY21wKTtcbiAgICByZXR1cm4gX3NpZnR1cChhcnJheSwgcG9zLCBjbXApO1xuICB9O1xuXG5cbiAgLypcbiAgRmluZCB0aGUgbiBsYXJnZXN0IGVsZW1lbnRzIGluIGEgZGF0YXNldC5cbiAgICovXG5cbiAgbmxhcmdlc3QgPSBmdW5jdGlvbihhcnJheSwgbiwgY21wKSB7XG4gICAgdmFyIGVsZW0sIHJlc3VsdCwgX2ksIF9sZW4sIF9yZWY7XG4gICAgaWYgKGNtcCA9PSBudWxsKSB7XG4gICAgICBjbXAgPSBkZWZhdWx0Q21wO1xuICAgIH1cbiAgICByZXN1bHQgPSBhcnJheS5zbGljZSgwLCBuKTtcbiAgICBpZiAoIXJlc3VsdC5sZW5ndGgpIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIGhlYXBpZnkocmVzdWx0LCBjbXApO1xuICAgIF9yZWYgPSBhcnJheS5zbGljZShuKTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGVsZW0gPSBfcmVmW19pXTtcbiAgICAgIGhlYXBwdXNocG9wKHJlc3VsdCwgZWxlbSwgY21wKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC5zb3J0KGNtcCkucmV2ZXJzZSgpO1xuICB9O1xuXG5cbiAgLypcbiAgRmluZCB0aGUgbiBzbWFsbGVzdCBlbGVtZW50cyBpbiBhIGRhdGFzZXQuXG4gICAqL1xuXG4gIG5zbWFsbGVzdCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBjbXApIHtcbiAgICB2YXIgZWxlbSwgaSwgbG9zLCByZXN1bHQsIF9pLCBfaiwgX2xlbiwgX3JlZiwgX3JlZjEsIF9yZXN1bHRzO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgaWYgKG4gKiAxMCA8PSBhcnJheS5sZW5ndGgpIHtcbiAgICAgIHJlc3VsdCA9IGFycmF5LnNsaWNlKDAsIG4pLnNvcnQoY21wKTtcbiAgICAgIGlmICghcmVzdWx0Lmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgbG9zID0gcmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXTtcbiAgICAgIF9yZWYgPSBhcnJheS5zbGljZShuKTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBlbGVtID0gX3JlZltfaV07XG4gICAgICAgIGlmIChjbXAoZWxlbSwgbG9zKSA8IDApIHtcbiAgICAgICAgICBpbnNvcnQocmVzdWx0LCBlbGVtLCAwLCBudWxsLCBjbXApO1xuICAgICAgICAgIHJlc3VsdC5wb3AoKTtcbiAgICAgICAgICBsb3MgPSByZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBoZWFwaWZ5KGFycmF5LCBjbXApO1xuICAgIF9yZXN1bHRzID0gW107XG4gICAgZm9yIChpID0gX2ogPSAwLCBfcmVmMSA9IG1pbihuLCBhcnJheS5sZW5ndGgpOyAwIDw9IF9yZWYxID8gX2ogPCBfcmVmMSA6IF9qID4gX3JlZjE7IGkgPSAwIDw9IF9yZWYxID8gKytfaiA6IC0tX2opIHtcbiAgICAgIF9yZXN1bHRzLnB1c2goaGVhcHBvcChhcnJheSwgY21wKSk7XG4gICAgfVxuICAgIHJldHVybiBfcmVzdWx0cztcbiAgfTtcblxuICBfc2lmdGRvd24gPSBmdW5jdGlvbihhcnJheSwgc3RhcnRwb3MsIHBvcywgY21wKSB7XG4gICAgdmFyIG5ld2l0ZW0sIHBhcmVudCwgcGFyZW50cG9zO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgbmV3aXRlbSA9IGFycmF5W3Bvc107XG4gICAgd2hpbGUgKHBvcyA+IHN0YXJ0cG9zKSB7XG4gICAgICBwYXJlbnRwb3MgPSAocG9zIC0gMSkgPj4gMTtcbiAgICAgIHBhcmVudCA9IGFycmF5W3BhcmVudHBvc107XG4gICAgICBpZiAoY21wKG5ld2l0ZW0sIHBhcmVudCkgPCAwKSB7XG4gICAgICAgIGFycmF5W3Bvc10gPSBwYXJlbnQ7XG4gICAgICAgIHBvcyA9IHBhcmVudHBvcztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5W3Bvc10gPSBuZXdpdGVtO1xuICB9O1xuXG4gIF9zaWZ0dXAgPSBmdW5jdGlvbihhcnJheSwgcG9zLCBjbXApIHtcbiAgICB2YXIgY2hpbGRwb3MsIGVuZHBvcywgbmV3aXRlbSwgcmlnaHRwb3MsIHN0YXJ0cG9zO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgZW5kcG9zID0gYXJyYXkubGVuZ3RoO1xuICAgIHN0YXJ0cG9zID0gcG9zO1xuICAgIG5ld2l0ZW0gPSBhcnJheVtwb3NdO1xuICAgIGNoaWxkcG9zID0gMiAqIHBvcyArIDE7XG4gICAgd2hpbGUgKGNoaWxkcG9zIDwgZW5kcG9zKSB7XG4gICAgICByaWdodHBvcyA9IGNoaWxkcG9zICsgMTtcbiAgICAgIGlmIChyaWdodHBvcyA8IGVuZHBvcyAmJiAhKGNtcChhcnJheVtjaGlsZHBvc10sIGFycmF5W3JpZ2h0cG9zXSkgPCAwKSkge1xuICAgICAgICBjaGlsZHBvcyA9IHJpZ2h0cG9zO1xuICAgICAgfVxuICAgICAgYXJyYXlbcG9zXSA9IGFycmF5W2NoaWxkcG9zXTtcbiAgICAgIHBvcyA9IGNoaWxkcG9zO1xuICAgICAgY2hpbGRwb3MgPSAyICogcG9zICsgMTtcbiAgICB9XG4gICAgYXJyYXlbcG9zXSA9IG5ld2l0ZW07XG4gICAgcmV0dXJuIF9zaWZ0ZG93bihhcnJheSwgc3RhcnRwb3MsIHBvcywgY21wKTtcbiAgfTtcblxuICBIZWFwID0gKGZ1bmN0aW9uKCkge1xuICAgIEhlYXAucHVzaCA9IGhlYXBwdXNoO1xuXG4gICAgSGVhcC5wb3AgPSBoZWFwcG9wO1xuXG4gICAgSGVhcC5yZXBsYWNlID0gaGVhcHJlcGxhY2U7XG5cbiAgICBIZWFwLnB1c2hwb3AgPSBoZWFwcHVzaHBvcDtcblxuICAgIEhlYXAuaGVhcGlmeSA9IGhlYXBpZnk7XG5cbiAgICBIZWFwLnVwZGF0ZUl0ZW0gPSB1cGRhdGVJdGVtO1xuXG4gICAgSGVhcC5ubGFyZ2VzdCA9IG5sYXJnZXN0O1xuXG4gICAgSGVhcC5uc21hbGxlc3QgPSBuc21hbGxlc3Q7XG5cbiAgICBmdW5jdGlvbiBIZWFwKGNtcCkge1xuICAgICAgdGhpcy5jbXAgPSBjbXAgIT0gbnVsbCA/IGNtcCA6IGRlZmF1bHRDbXA7XG4gICAgICB0aGlzLm5vZGVzID0gW107XG4gICAgfVxuXG4gICAgSGVhcC5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiBoZWFwcHVzaCh0aGlzLm5vZGVzLCB4LCB0aGlzLmNtcCk7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGhlYXBwb3AodGhpcy5ub2RlcywgdGhpcy5jbXApO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5wZWVrID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5ub2Rlc1swXTtcbiAgICB9O1xuXG4gICAgSGVhcC5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gdGhpcy5ub2Rlcy5pbmRleE9mKHgpICE9PSAtMTtcbiAgICB9O1xuXG4gICAgSGVhcC5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiBoZWFwcmVwbGFjZSh0aGlzLm5vZGVzLCB4LCB0aGlzLmNtcCk7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLnB1c2hwb3AgPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gaGVhcHB1c2hwb3AodGhpcy5ub2RlcywgeCwgdGhpcy5jbXApO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5oZWFwaWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gaGVhcGlmeSh0aGlzLm5vZGVzLCB0aGlzLmNtcCk7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLnVwZGF0ZUl0ZW0gPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gdXBkYXRlSXRlbSh0aGlzLm5vZGVzLCB4LCB0aGlzLmNtcCk7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5ub2RlcyA9IFtdO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5lbXB0eSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMubm9kZXMubGVuZ3RoID09PSAwO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5ub2Rlcy5sZW5ndGg7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaGVhcDtcbiAgICAgIGhlYXAgPSBuZXcgSGVhcCgpO1xuICAgICAgaGVhcC5ub2RlcyA9IHRoaXMubm9kZXMuc2xpY2UoMCk7XG4gICAgICByZXR1cm4gaGVhcDtcbiAgICB9O1xuXG4gICAgSGVhcC5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMubm9kZXMuc2xpY2UoMCk7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLmluc2VydCA9IEhlYXAucHJvdG90eXBlLnB1c2g7XG5cbiAgICBIZWFwLnByb3RvdHlwZS50b3AgPSBIZWFwLnByb3RvdHlwZS5wZWVrO1xuXG4gICAgSGVhcC5wcm90b3R5cGUuZnJvbnQgPSBIZWFwLnByb3RvdHlwZS5wZWVrO1xuXG4gICAgSGVhcC5wcm90b3R5cGUuaGFzID0gSGVhcC5wcm90b3R5cGUuY29udGFpbnM7XG5cbiAgICBIZWFwLnByb3RvdHlwZS5jb3B5ID0gSGVhcC5wcm90b3R5cGUuY2xvbmU7XG5cbiAgICByZXR1cm4gSGVhcDtcblxuICB9KSgpO1xuXG4gIChmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgcmV0dXJuIGRlZmluZShbXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybiBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHJvb3QuSGVhcCA9IGZhY3RvcnkoKTtcbiAgICB9XG4gIH0pKHRoaXMsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBIZWFwO1xuICB9KTtcblxufSkuY2FsbCh0aGlzKTtcbiIsInZhciBib3VuZHMgPSBmdW5jdGlvbihiKSB7XG4gIHRoaXMuY2xlYXIoKTtcbiAgaWYgKGIpIHRoaXMudW5pb24oYik7XG59O1xuXG52YXIgcHJvdG90eXBlID0gYm91bmRzLnByb3RvdHlwZTtcblxucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMueDEgPSArTnVtYmVyLk1BWF9WQUxVRTtcbiAgdGhpcy55MSA9ICtOdW1iZXIuTUFYX1ZBTFVFO1xuICB0aGlzLngyID0gLU51bWJlci5NQVhfVkFMVUU7XG4gIHRoaXMueTIgPSAtTnVtYmVyLk1BWF9WQUxVRTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIpIHtcbiAgdGhpcy54MSA9IHgxO1xuICB0aGlzLnkxID0geTE7XG4gIHRoaXMueDIgPSB4MjtcbiAgdGhpcy55MiA9IHkyO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih4LCB5KSB7XG4gIGlmICh4IDwgdGhpcy54MSkgdGhpcy54MSA9IHg7XG4gIGlmICh5IDwgdGhpcy55MSkgdGhpcy55MSA9IHk7XG4gIGlmICh4ID4gdGhpcy54MikgdGhpcy54MiA9IHg7XG4gIGlmICh5ID4gdGhpcy55MikgdGhpcy55MiA9IHk7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLmV4cGFuZCA9IGZ1bmN0aW9uKGQpIHtcbiAgdGhpcy54MSAtPSBkO1xuICB0aGlzLnkxIC09IGQ7XG4gIHRoaXMueDIgKz0gZDtcbiAgdGhpcy55MiArPSBkO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5yb3VuZCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLngxID0gTWF0aC5mbG9vcih0aGlzLngxKTtcbiAgdGhpcy55MSA9IE1hdGguZmxvb3IodGhpcy55MSk7XG4gIHRoaXMueDIgPSBNYXRoLmNlaWwodGhpcy54Mik7XG4gIHRoaXMueTIgPSBNYXRoLmNlaWwodGhpcy55Mik7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKGR4LCBkeSkge1xuICB0aGlzLngxICs9IGR4O1xuICB0aGlzLngyICs9IGR4O1xuICB0aGlzLnkxICs9IGR5O1xuICB0aGlzLnkyICs9IGR5O1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbihhbmdsZSwgeCwgeSkge1xuICB2YXIgY29zID0gTWF0aC5jb3MoYW5nbGUpLFxuICAgICAgc2luID0gTWF0aC5zaW4oYW5nbGUpLFxuICAgICAgY3ggPSB4IC0geCpjb3MgKyB5KnNpbixcbiAgICAgIGN5ID0geSAtIHgqc2luIC0geSpjb3MsXG4gICAgICB4MSA9IHRoaXMueDEsIHgyID0gdGhpcy54MixcbiAgICAgIHkxID0gdGhpcy55MSwgeTIgPSB0aGlzLnkyO1xuXG4gIHJldHVybiB0aGlzLmNsZWFyKClcbiAgICAuYWRkKGNvcyp4MSAtIHNpbip5MSArIGN4LCAgc2luKngxICsgY29zKnkxICsgY3kpXG4gICAgLmFkZChjb3MqeDEgLSBzaW4qeTIgKyBjeCwgIHNpbip4MSArIGNvcyp5MiArIGN5KVxuICAgIC5hZGQoY29zKngyIC0gc2luKnkxICsgY3gsICBzaW4qeDIgKyBjb3MqeTEgKyBjeSlcbiAgICAuYWRkKGNvcyp4MiAtIHNpbip5MiArIGN4LCAgc2luKngyICsgY29zKnkyICsgY3kpO1xufVxuXG5wcm90b3R5cGUudW5pb24gPSBmdW5jdGlvbihiKSB7XG4gIGlmIChiLngxIDwgdGhpcy54MSkgdGhpcy54MSA9IGIueDE7XG4gIGlmIChiLnkxIDwgdGhpcy55MSkgdGhpcy55MSA9IGIueTE7XG4gIGlmIChiLngyID4gdGhpcy54MikgdGhpcy54MiA9IGIueDI7XG4gIGlmIChiLnkyID4gdGhpcy55MikgdGhpcy55MiA9IGIueTI7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLmVuY2xvc2VzID0gZnVuY3Rpb24oYikge1xuICByZXR1cm4gYiAmJiAoXG4gICAgdGhpcy54MSA8PSBiLngxICYmXG4gICAgdGhpcy54MiA+PSBiLngyICYmXG4gICAgdGhpcy55MSA8PSBiLnkxICYmXG4gICAgdGhpcy55MiA+PSBiLnkyXG4gICk7XG59O1xuXG5wcm90b3R5cGUuaW50ZXJzZWN0cyA9IGZ1bmN0aW9uKGIpIHtcbiAgcmV0dXJuIGIgJiYgIShcbiAgICB0aGlzLngyIDwgYi54MSB8fFxuICAgIHRoaXMueDEgPiBiLngyIHx8XG4gICAgdGhpcy55MiA8IGIueTEgfHxcbiAgICB0aGlzLnkxID4gYi55MlxuICApO1xufTtcblxucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24oeCwgeSkge1xuICByZXR1cm4gIShcbiAgICB4IDwgdGhpcy54MSB8fFxuICAgIHggPiB0aGlzLngyIHx8XG4gICAgeSA8IHRoaXMueTEgfHxcbiAgICB5ID4gdGhpcy55MlxuICApO1xufTtcblxucHJvdG90eXBlLndpZHRoID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLngyIC0gdGhpcy54MTtcbn07XG5cbnByb3RvdHlwZS5oZWlnaHQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMueTIgLSB0aGlzLnkxO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBib3VuZHM7IiwidmFyIEdyYXBoID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvR3JhcGgnKSwgXG4gICAgTm9kZSAgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Ob2RlJyksXG4gICAgR3JvdXBCdWlsZGVyID0gcmVxdWlyZSgnLi4vc2NlbmUvR3JvdXBCdWlsZGVyJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0JyksIFxuICAgIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpO1xuXG5mdW5jdGlvbiBNb2RlbCgpIHtcbiAgdGhpcy5fZGVmcyA9IHt9O1xuICB0aGlzLl9wcmVkaWNhdGVzID0ge307XG4gIHRoaXMuX3NjZW5lID0gbnVsbDtcblxuICB0aGlzLmdyYXBoID0gbmV3IEdyYXBoKCk7XG5cbiAgdGhpcy5fbm9kZSA9IG5ldyBOb2RlKHRoaXMuZ3JhcGgpO1xuICB0aGlzLl9idWlsZGVyID0gbnVsbDsgLy8gVG9wLWxldmVsIHNjZW5lZ3JhcGggYnVpbGRlclxufTtcblxudmFyIHByb3RvID0gTW9kZWwucHJvdG90eXBlO1xuXG5wcm90by5kZWZzID0gZnVuY3Rpb24oZGVmcykge1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9kZWZzO1xuICB0aGlzLl9kZWZzID0gZGVmcztcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5kYXRhID0gZnVuY3Rpb24oKSB7XG4gIHZhciBkYXRhID0gdGhpcy5ncmFwaC5kYXRhLmFwcGx5KHRoaXMuZ3JhcGgsIGFyZ3VtZW50cyk7XG4gIGlmKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7ICAvLyBuZXcgRGF0YXNvdXJjZVxuICAgIHRoaXMuX25vZGUuYWRkTGlzdGVuZXIoZGF0YS5waXBlbGluZSgpWzBdKTtcbiAgfVxuXG4gIHJldHVybiBkYXRhO1xufTtcblxuZnVuY3Rpb24gcHJlZGljYXRlcyhuYW1lKSB7XG4gIHZhciBtID0gdGhpcywgcHJlZGljYXRlcyA9IHt9O1xuICBpZighZGwuaXNBcnJheShuYW1lKSkgcmV0dXJuIHRoaXMuX3ByZWRpY2F0ZXNbbmFtZV07XG4gIG5hbWUuZm9yRWFjaChmdW5jdGlvbihuKSB7IHByZWRpY2F0ZXNbbl0gPSBtLl9wcmVkaWNhdGVzW25dIH0pO1xuICByZXR1cm4gcHJlZGljYXRlcztcbn1cblxucHJvdG8ucHJlZGljYXRlID0gZnVuY3Rpb24obmFtZSwgcHJlZGljYXRlKSB7XG4gIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHJldHVybiBwcmVkaWNhdGVzLmNhbGwodGhpcywgbmFtZSk7XG4gIHJldHVybiAodGhpcy5fcHJlZGljYXRlc1tuYW1lXSA9IHByZWRpY2F0ZSk7XG59O1xuXG5wcm90by5wcmVkaWNhdGVzID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl9wcmVkaWNhdGVzOyB9O1xuXG5wcm90by5zY2VuZSA9IGZ1bmN0aW9uKHJlbmRlcmVyKSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fc2NlbmU7XG4gIGlmKHRoaXMuX2J1aWxkZXIpIHRoaXMuX25vZGUucmVtb3ZlTGlzdGVuZXIodGhpcy5fYnVpbGRlci5kaXNjb25uZWN0KCkpO1xuICB0aGlzLl9idWlsZGVyID0gbmV3IEdyb3VwQnVpbGRlcih0aGlzLCB0aGlzLl9kZWZzLm1hcmtzLCB0aGlzLl9zY2VuZT17fSk7XG4gIHRoaXMuX25vZGUuYWRkTGlzdGVuZXIodGhpcy5fYnVpbGRlci5jb25uZWN0KCkpO1xuICB2YXIgcCA9IHRoaXMuX2J1aWxkZXIucGlwZWxpbmUoKTtcbiAgcFtwLmxlbmd0aC0xXS5hZGRMaXN0ZW5lcihyZW5kZXJlcik7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8uYWRkTGlzdGVuZXIgPSBmdW5jdGlvbihsKSB7IHRoaXMuX25vZGUuYWRkTGlzdGVuZXIobCk7IH07XG5wcm90by5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKGwpIHsgdGhpcy5fbm9kZS5yZW1vdmVMaXN0ZW5lcihsKTsgfTtcblxucHJvdG8uZmlyZSA9IGZ1bmN0aW9uKGNzKSB7XG4gIGlmKCFjcykgY3MgPSBjaGFuZ2VzZXQuY3JlYXRlKCk7XG4gIHRoaXMuZ3JhcGgucHJvcGFnYXRlKGNzLCB0aGlzLl9ub2RlKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7IiwidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgTm9kZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L05vZGUnKSxcbiAgICBwYXJzZVN0cmVhbXMgPSByZXF1aXJlKCcuLi9wYXJzZS9zdHJlYW1zJyksXG4gICAgY2FudmFzID0gcmVxdWlyZSgnLi4vcmVuZGVyL2NhbnZhcy9pbmRleCcpLFxuICAgIHN2ZyA9IHJlcXVpcmUoJy4uL3JlbmRlci9zdmcvaW5kZXgnKSxcbiAgICBUcmFuc2l0aW9uID0gcmVxdWlyZSgnLi4vc2NlbmUvVHJhbnNpdGlvbicpLFxuICAgIGNvbmZpZyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uZmlnJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0Jyk7XG5cbnZhciBWaWV3ID0gZnVuY3Rpb24oZWwsIHdpZHRoLCBoZWlnaHQsIG1vZGVsKSB7XG4gIHRoaXMuX2VsICAgID0gbnVsbDtcbiAgdGhpcy5fbW9kZWwgPSBudWxsO1xuICB0aGlzLl93aWR0aCA9IHRoaXMuX193aWR0aCA9IHdpZHRoIHx8IDUwMDtcbiAgdGhpcy5faGVpZ2h0ID0gdGhpcy5fX2hlaWdodCA9IGhlaWdodCB8fCAzMDA7XG4gIHRoaXMuX2F1dG9wYWQgPSAxO1xuICB0aGlzLl9wYWRkaW5nID0ge3RvcDowLCBsZWZ0OjAsIGJvdHRvbTowLCByaWdodDowfTtcbiAgdGhpcy5fdmlld3BvcnQgPSBudWxsO1xuICB0aGlzLl9yZW5kZXJlciA9IG51bGw7XG4gIHRoaXMuX2hhbmRsZXIgPSBudWxsO1xuICB0aGlzLl9pbyA9IGNhbnZhcztcbiAgaWYgKGVsKSB0aGlzLmluaXRpYWxpemUoZWwpO1xufTtcblxudmFyIHByb3RvdHlwZSA9IFZpZXcucHJvdG90eXBlO1xuXG5wcm90b3R5cGUubW9kZWwgPSBmdW5jdGlvbihtb2RlbCkge1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9tb2RlbDtcbiAgaWYgKHRoaXMuX21vZGVsICE9PSBtb2RlbCkge1xuICAgIHRoaXMuX21vZGVsID0gbW9kZWw7XG4gICAgaWYgKHRoaXMuX2hhbmRsZXIpIHRoaXMuX2hhbmRsZXIubW9kZWwobW9kZWwpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLmRhdGEgPSBmdW5jdGlvbihkYXRhKSB7XG4gIHZhciBtID0gdGhpcy5tb2RlbCgpO1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBtLmRhdGEoKTtcbiAgZGwua2V5cyhkYXRhKS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgbS5kYXRhKGQpLmFkZChkbC5kdXBsaWNhdGUoZGF0YVtkXSkpOyB9KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUud2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9fd2lkdGg7XG4gIGlmICh0aGlzLl9fd2lkdGggIT09IHdpZHRoKSB7XG4gICAgdGhpcy5fd2lkdGggPSB0aGlzLl9fd2lkdGggPSB3aWR0aDtcbiAgICBpZiAodGhpcy5fZWwpIHRoaXMuaW5pdGlhbGl6ZSh0aGlzLl9lbC5wYXJlbnROb2RlKTtcbiAgICBpZiAodGhpcy5fc3RyaWN0KSB0aGlzLl9hdXRvcGFkID0gMTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5oZWlnaHQgPSBmdW5jdGlvbihoZWlnaHQpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fX2hlaWdodDtcbiAgaWYgKHRoaXMuX19oZWlnaHQgIT09IGhlaWdodCkge1xuICAgIHRoaXMuX2hlaWdodCA9IHRoaXMuX19oZWlnaHQgPSBoZWlnaHQ7XG4gICAgaWYgKHRoaXMuX2VsKSB0aGlzLmluaXRpYWxpemUodGhpcy5fZWwucGFyZW50Tm9kZSk7XG4gICAgaWYgKHRoaXMuX3N0cmljdCkgdGhpcy5fYXV0b3BhZCA9IDE7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUucGFkZGluZyA9IGZ1bmN0aW9uKHBhZCkge1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9wYWRkaW5nO1xuICBpZiAodGhpcy5fcGFkZGluZyAhPT0gcGFkKSB7XG4gICAgaWYgKGRsLmlzU3RyaW5nKHBhZCkpIHtcbiAgICAgIHRoaXMuX2F1dG9wYWQgPSAxO1xuICAgICAgdGhpcy5fcGFkZGluZyA9IHt0b3A6MCwgbGVmdDowLCBib3R0b206MCwgcmlnaHQ6MH07XG4gICAgICB0aGlzLl9zdHJpY3QgPSAocGFkID09PSBcInN0cmljdFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYXV0b3BhZCA9IDA7XG4gICAgICB0aGlzLl9wYWRkaW5nID0gcGFkO1xuICAgICAgdGhpcy5fc3RyaWN0ID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLl9lbCkge1xuICAgICAgdGhpcy5fcmVuZGVyZXIucmVzaXplKHRoaXMuX3dpZHRoLCB0aGlzLl9oZWlnaHQsIHBhZCk7XG4gICAgICB0aGlzLl9oYW5kbGVyLnBhZGRpbmcocGFkKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUuYXV0b3BhZCA9IGZ1bmN0aW9uKG9wdCkge1xuICBpZiAodGhpcy5fYXV0b3BhZCA8IDEpIHJldHVybiB0aGlzO1xuICBlbHNlIHRoaXMuX2F1dG9wYWQgPSAwO1xuXG4gIHZhciBwYWQgPSB0aGlzLl9wYWRkaW5nLFxuICAgICAgYiA9IHRoaXMubW9kZWwoKS5zY2VuZSgpLmJvdW5kcyxcbiAgICAgIGluc2V0ID0gY29uZmlnLmF1dG9wYWRJbnNldCxcbiAgICAgIGwgPSBiLngxIDwgMCA/IE1hdGguY2VpbCgtYi54MSkgKyBpbnNldCA6IDAsXG4gICAgICB0ID0gYi55MSA8IDAgPyBNYXRoLmNlaWwoLWIueTEpICsgaW5zZXQgOiAwLFxuICAgICAgciA9IGIueDIgPiB0aGlzLl93aWR0aCAgPyBNYXRoLmNlaWwoK2IueDIgLSB0aGlzLl93aWR0aCkgKyBpbnNldCA6IDAsXG4gICAgICBiID0gYi55MiA+IHRoaXMuX2hlaWdodCA/IE1hdGguY2VpbCgrYi55MiAtIHRoaXMuX2hlaWdodCkgKyBpbnNldCA6IDA7XG4gIHBhZCA9IHtsZWZ0OmwsIHRvcDp0LCByaWdodDpyLCBib3R0b206Yn07XG5cbiAgaWYgKHRoaXMuX3N0cmljdCkge1xuICAgIHRoaXMuX2F1dG9wYWQgPSAwO1xuICAgIHRoaXMuX3BhZGRpbmcgPSBwYWQ7XG4gICAgdGhpcy5fd2lkdGggPSBNYXRoLm1heCgwLCB0aGlzLl9fd2lkdGggLSAobCtyKSk7XG4gICAgdGhpcy5faGVpZ2h0ID0gTWF0aC5tYXgoMCwgdGhpcy5fX2hlaWdodCAtICh0K2IpKTtcbiAgICB0aGlzLl9tb2RlbC53aWR0aCh0aGlzLl93aWR0aCk7XG4gICAgdGhpcy5fbW9kZWwuaGVpZ2h0KHRoaXMuX2hlaWdodCk7XG4gICAgaWYgKHRoaXMuX2VsKSB0aGlzLmluaXRpYWxpemUodGhpcy5fZWwucGFyZW50Tm9kZSk7XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnBhZGRpbmcocGFkKS51cGRhdGUob3B0KTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS52aWV3cG9ydCA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fdmlld3BvcnQ7XG4gIGlmICh0aGlzLl92aWV3cG9ydCAhPT0gc2l6ZSkge1xuICAgIHRoaXMuX3ZpZXdwb3J0ID0gc2l6ZTtcbiAgICBpZiAodGhpcy5fZWwpIHRoaXMuaW5pdGlhbGl6ZSh0aGlzLl9lbC5wYXJlbnROb2RlKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5yZW5kZXJlciA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5faW87XG4gIGlmICh0eXBlID09PSBcImNhbnZhc1wiKSB0eXBlID0gY2FudmFzO1xuICBpZiAodHlwZSA9PT0gXCJzdmdcIikgdHlwZSA9IHN2ZztcbiAgaWYgKHRoaXMuX2lvICE9PSB0eXBlKSB7XG4gICAgdGhpcy5faW8gPSB0eXBlO1xuICAgIHRoaXMuX3JlbmRlcmVyID0gbnVsbDtcbiAgICBpZiAodGhpcy5fZWwpIHRoaXMuaW5pdGlhbGl6ZSh0aGlzLl9lbC5wYXJlbnROb2RlKTtcbiAgICBpZiAodGhpcy5fYnVpbGQpIHRoaXMucmVuZGVyKCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKGVsKSB7XG4gIHZhciB2ID0gdGhpcywgcHJldkhhbmRsZXIsXG4gICAgICB3ID0gdi5fd2lkdGgsIGggPSB2Ll9oZWlnaHQsIHBhZCA9IHYuX3BhZGRpbmc7XG4gIFxuICAvLyBjbGVhciBwcmUtZXhpc3RpbmcgY29udGFpbmVyXG4gIGQzLnNlbGVjdChlbCkuc2VsZWN0KFwiZGl2LnZlZ2FcIikucmVtb3ZlKCk7XG4gIFxuICAvLyBhZGQgZGl2IGNvbnRhaW5lclxuICB0aGlzLl9lbCA9IGVsID0gZDMuc2VsZWN0KGVsKVxuICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwidmVnYVwiKVxuICAgIC5zdHlsZShcInBvc2l0aW9uXCIsIFwicmVsYXRpdmVcIilcbiAgICAubm9kZSgpO1xuICBpZiAodi5fdmlld3BvcnQpIHtcbiAgICBkMy5zZWxlY3QoZWwpXG4gICAgICAuc3R5bGUoXCJ3aWR0aFwiLCAgKHYuX3ZpZXdwb3J0WzBdIHx8IHcpK1wicHhcIilcbiAgICAgIC5zdHlsZShcImhlaWdodFwiLCAodi5fdmlld3BvcnRbMV0gfHwgaCkrXCJweFwiKVxuICAgICAgLnN0eWxlKFwib3ZlcmZsb3dcIiwgXCJhdXRvXCIpO1xuICB9XG4gIFxuICAvLyByZW5kZXJlclxuICB2Ll9yZW5kZXJlciA9ICh2Ll9yZW5kZXJlciB8fCBuZXcgdGhpcy5faW8uUmVuZGVyZXIoKSlcbiAgICAuaW5pdGlhbGl6ZShlbCwgdywgaCwgcGFkKTtcbiAgXG4gIC8vIGlucHV0IGhhbmRsZXJcbiAgcHJldkhhbmRsZXIgPSB2Ll9oYW5kbGVyO1xuICB2Ll9oYW5kbGVyID0gbmV3IHRoaXMuX2lvLkhhbmRsZXIoKVxuICAgIC5pbml0aWFsaXplKGVsLCBwYWQsIHYpXG4gICAgLm1vZGVsKHYuX21vZGVsKTtcblxuICBpZiAocHJldkhhbmRsZXIpIHtcbiAgICBwcmV2SGFuZGxlci5oYW5kbGVycygpLmZvckVhY2goZnVuY3Rpb24oaCkge1xuICAgICAgdi5faGFuZGxlci5vbihoLnR5cGUsIGguaGFuZGxlcik7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gUmVnaXN0ZXIgZXZlbnQgbGlzdGVuZXJzIGZvciBzaWduYWwgc3RyZWFtIGRlZmluaXRpb25zLlxuICAgIHBhcnNlU3RyZWFtcyh0aGlzKTtcbiAgfVxuICBcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24ob3B0KSB7ICAgIFxuICBvcHQgPSBvcHQgfHwge307XG4gIHZhciB2ID0gdGhpcyxcbiAgICAgIHRyYW5zID0gb3B0LmR1cmF0aW9uXG4gICAgICAgID8gbmV3IFRyYW5zaXRpb24ob3B0LmR1cmF0aW9uLCBvcHQuZWFzZSlcbiAgICAgICAgOiBudWxsO1xuXG4gIC8vIFRPRE86IHdpdGggc3RyZWFtaW5nIGRhdGEgQVBJLCBhZGRzIHNob3VsZCBkbC5kdXBsaWNhdGUganVzdCBwYXJzZVNwZWNcbiAgLy8gdG8gcHJldmVudCBWZWdhIGZyb20gcG9sbHV0aW5nIHRoZSBlbnZpcm9ubWVudC5cblxuICB2YXIgY3MgPSBjaGFuZ2VzZXQuY3JlYXRlKCk7XG4gIGlmKHRyYW5zKSBjcy50cmFucyA9IHRyYW5zO1xuICBpZihvcHQucmVmbG93ICE9PSB1bmRlZmluZWQpIGNzLnJlZmxvdyA9IG9wdC5yZWZsb3dcblxuICBpZighdi5fYnVpbGQpIHtcbiAgICB2Ll9yZW5kZXJOb2RlID0gbmV3IE5vZGUodi5fbW9kZWwuZ3JhcGgpXG4gICAgICAucm91dGVyKHRydWUpO1xuXG4gICAgdi5fcmVuZGVyTm9kZS5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICBkZWJ1ZyhpbnB1dCwgW1wicmVuZGVyaW5nXCJdKTtcblxuICAgICAgdmFyIHMgPSB2Ll9tb2RlbC5zY2VuZSgpO1xuICAgICAgaWYoaW5wdXQudHJhbnMpIHtcbiAgICAgICAgaW5wdXQudHJhbnMuc3RhcnQoZnVuY3Rpb24oaXRlbXMpIHsgdi5fcmVuZGVyZXIucmVuZGVyKHMsIGl0ZW1zKTsgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2Ll9yZW5kZXJlci5yZW5kZXIocyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEZvciBhbGwgdXBkYXRlZCBkYXRhc291cmNlcywgZmluYWxpemUgdGhlaXIgY2hhbmdlc2V0cy5cbiAgICAgIHZhciBkLCBkcztcbiAgICAgIGZvcihkIGluIGlucHV0LmRhdGEpIHtcbiAgICAgICAgZHMgPSB2Ll9tb2RlbC5kYXRhKGQpO1xuICAgICAgICBpZighZHMucmV2aXNlcygpKSBjb250aW51ZTtcbiAgICAgICAgY2hhbmdlc2V0LmZpbmFsaXplKGRzLmxhc3QoKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9O1xuXG4gICAgdi5fbW9kZWwuc2NlbmUodi5fcmVuZGVyTm9kZSk7XG4gICAgdi5fYnVpbGQgPSB0cnVlO1xuICB9XG5cbiAgLy8gUHVsc2UgdGhlIGVudGlyZSBtb2RlbCAoRGF0YXNvdXJjZXMgKyBzY2VuZSkuXG4gIHYuX21vZGVsLmZpcmUoY3MpO1xuXG4gIHJldHVybiB2LmF1dG9wYWQob3B0KTtcbn07XG5cbnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9oYW5kbGVyLm9uLmFwcGx5KHRoaXMuX2hhbmRsZXIsIGFyZ3VtZW50cyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9oYW5kbGVyLm9mZi5hcHBseSh0aGlzLl9oYW5kbGVyLCBhcmd1bWVudHMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cblZpZXcuZmFjdG9yeSA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gIHJldHVybiBmdW5jdGlvbihvcHQpIHtcbiAgICBvcHQgPSBvcHQgfHwge307XG4gICAgdmFyIGRlZnMgPSBtb2RlbC5kZWZzKCk7XG4gICAgdmFyIHYgPSBuZXcgVmlldygpXG4gICAgICAubW9kZWwobW9kZWwpXG4gICAgICAud2lkdGgoZGVmcy53aWR0aClcbiAgICAgIC5oZWlnaHQoZGVmcy5oZWlnaHQpXG4gICAgICAucGFkZGluZyhkZWZzLnBhZGRpbmcpXG4gICAgICAucmVuZGVyZXIob3B0LnJlbmRlcmVyIHx8IFwiY2FudmFzXCIpO1xuXG4gICAgaWYgKG9wdC5lbCkgdi5pbml0aWFsaXplKG9wdC5lbCk7XG4gICAgaWYgKG9wdC5kYXRhKSB2LmRhdGEob3B0LmRhdGEpO1xuICBcbiAgICByZXR1cm4gdjtcbiAgfTsgICAgXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXc7IiwidmFyIE5vZGUgPSByZXF1aXJlKCcuL05vZGUnKSxcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCcuL2NoYW5nZXNldCcpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBDb2xsZWN0b3IoZ3JhcGgpIHtcbiAgTm9kZS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgdGhpcy5fZGF0YSA9IFtdO1xuICByZXR1cm4gdGhpcy5yb3V0ZXIodHJ1ZSlcbiAgICAuY29sbGVjdG9yKHRydWUpO1xufVxuXG52YXIgcHJvdG8gPSAoQ29sbGVjdG9yLnByb3RvdHlwZSA9IG5ldyBOb2RlKCkpO1xuXG5wcm90by5kYXRhID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl9kYXRhOyB9XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgZGVidWcoaW5wdXQsIFtcImNvbGxlY3RpbmdcIl0pO1xuXG4gIGlmKGlucHV0LnJlZmxvdykge1xuICAgIGlucHV0ID0gY2hhbmdlc2V0LmNyZWF0ZShpbnB1dCk7XG4gICAgaW5wdXQubW9kID0gdGhpcy5fZGF0YS5zbGljZSgpO1xuICAgIHJldHVybiBpbnB1dDtcbiAgfVxuXG4gIGlmKGlucHV0LnJlbS5sZW5ndGgpIHtcbiAgICB2YXIgaWRzID0gaW5wdXQucmVtLnJlZHVjZShmdW5jdGlvbihtLHgpIHsgcmV0dXJuIChtW3guX2lkXT0xLCBtKTsgfSwge30pO1xuICAgIHRoaXMuX2RhdGEgPSB0aGlzLl9kYXRhLmZpbHRlcihmdW5jdGlvbih4KSB7IHJldHVybiBpZHNbeC5faWRdICE9PSAxOyB9KTtcbiAgfVxuXG4gIGlmKGlucHV0LmFkZC5sZW5ndGgpIHtcbiAgICB0aGlzLl9kYXRhID0gdGhpcy5fZGF0YS5sZW5ndGggPyB0aGlzLl9kYXRhLmNvbmNhdChpbnB1dC5hZGQpIDogaW5wdXQuYWRkO1xuICB9XG5cbiAgaWYoaW5wdXQuc29ydCkge1xuICAgIHRoaXMuX2RhdGEuc29ydChpbnB1dC5zb3J0KTtcbiAgfVxuXG4gIHJldHVybiBpbnB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sbGVjdG9yOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCcuL2NoYW5nZXNldCcpLCBcbiAgICB0dXBsZSA9IHJlcXVpcmUoJy4vdHVwbGUnKSwgXG4gICAgTm9kZSA9IHJlcXVpcmUoJy4vTm9kZScpLFxuICAgIENvbGxlY3RvciA9IHJlcXVpcmUoJy4vQ29sbGVjdG9yJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIERhdGFzb3VyY2UoZ3JhcGgsIG5hbWUsIGZhY2V0KSB7XG4gIHRoaXMuX2dyYXBoID0gZ3JhcGg7XG4gIHRoaXMuX25hbWUgPSBuYW1lO1xuICB0aGlzLl9kYXRhID0gW107XG4gIHRoaXMuX3NvdXJjZSA9IG51bGw7XG4gIHRoaXMuX2ZhY2V0ID0gZmFjZXQ7XG4gIHRoaXMuX2lucHV0ID0gY2hhbmdlc2V0LmNyZWF0ZSgpO1xuICB0aGlzLl9vdXRwdXQgPSBudWxsOyAgICAvLyBPdXRwdXQgY2hhbmdlc2V0XG5cbiAgdGhpcy5fcGlwZWxpbmUgID0gbnVsbDsgLy8gUGlwZWxpbmUgb2YgdHJhbnNmb3JtYXRpb25zLlxuICB0aGlzLl9jb2xsZWN0b3IgPSBudWxsOyAvLyBDb2xsZWN0b3IgdG8gbWF0ZXJpYWxpemUgb3V0cHV0IG9mIHBpcGVsaW5lXG4gIHRoaXMuX3JldmlzZXMgPSBmYWxzZTsgLy8gRG9lcyBhbnkgcGlwZWxpbmUgb3BlcmF0b3IgbmVlZCB0byB0cmFjayBwcmV2P1xufTtcblxudmFyIHByb3RvID0gRGF0YXNvdXJjZS5wcm90b3R5cGU7XG5cbnByb3RvLm5hbWUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fbmFtZTtcbiAgcmV0dXJuICh0aGlzLl9uYW1lID0gbmFtZSwgdGhpcyk7XG59O1xuXG5wcm90by5zb3VyY2UgPSBmdW5jdGlvbihzcmMpIHtcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9zb3VyY2U7XG4gIHJldHVybiAodGhpcy5fc291cmNlID0gdGhpcy5fZ3JhcGguZGF0YShzcmMpKTtcbn07XG5cbnByb3RvLmFkZCA9IGZ1bmN0aW9uKGQpIHtcbiAgdmFyIHByZXYgPSB0aGlzLl9yZXZpc2VzID8gbnVsbCA6IHVuZGVmaW5lZDtcblxuICB0aGlzLl9pbnB1dC5hZGQgPSB0aGlzLl9pbnB1dC5hZGRcbiAgICAuY29uY2F0KGRsLmFycmF5KGQpLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiB0dXBsZS5pbmdlc3QoZCwgcHJldik7IH0pKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5yZW1vdmUgPSBmdW5jdGlvbih3aGVyZSkge1xuICB2YXIgZCA9IHRoaXMuX2RhdGEuZmlsdGVyKHdoZXJlKTtcbiAgdGhpcy5faW5wdXQucmVtID0gdGhpcy5faW5wdXQucmVtLmNvbmNhdChkKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by51cGRhdGUgPSBmdW5jdGlvbih3aGVyZSwgZmllbGQsIGZ1bmMpIHtcbiAgdmFyIG1vZCA9IHRoaXMuX2lucHV0Lm1vZCxcbiAgICAgIGlkcyA9IHR1cGxlLmlkTWFwKG1vZCksXG4gICAgICBwcmV2ID0gdGhpcy5fcmV2aXNlcyA/IG51bGwgOiB1bmRlZmluZWQ7IFxuXG4gIHRoaXMuX2lucHV0LmZpZWxkc1tmaWVsZF0gPSAxO1xuICB0aGlzLl9kYXRhLmZpbHRlcih3aGVyZSkuZm9yRWFjaChmdW5jdGlvbih4KSB7XG4gICAgdmFyIHByZXYgPSB4W2ZpZWxkXSxcbiAgICAgICAgbmV4dCA9IGZ1bmMoeCk7XG4gICAgaWYgKHByZXYgIT09IG5leHQpIHtcbiAgICAgIHR1cGxlLnNldCh4LCBmaWVsZCwgbmV4dCk7XG4gICAgICBpZihpZHNbeC5faWRdICE9PSAxKSB7XG4gICAgICAgIG1vZC5wdXNoKHgpO1xuICAgICAgICBpZHNbeC5faWRdID0gMTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLnZhbHVlcyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgcmV0dXJuIHRoaXMuX2NvbGxlY3RvciA/IHRoaXMuX2NvbGxlY3Rvci5kYXRhKCkgOiB0aGlzLl9kYXRhO1xuXG4gIC8vIFJlcGxhY2UgYmFja2luZyBkYXRhXG4gIHRoaXMuX2lucHV0LnJlbSA9IHRoaXMuX2RhdGEuc2xpY2UoKTtcbiAgaWYgKGRhdGEpIHsgdGhpcy5hZGQoZGF0YSk7IH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiBzZXRfcHJldihkKSB7IGlmKGQuX3ByZXYgPT09IHVuZGVmaW5lZCkgZC5fcHJldiA9IEMuU0VOVElORUw7IH1cblxucHJvdG8ucmV2aXNlcyA9IGZ1bmN0aW9uKHApIHtcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9yZXZpc2VzO1xuXG4gIC8vIElmIHdlJ3ZlIG5vdCBuZWVkZWQgcHJldiBpbiB0aGUgcGFzdCwgYnV0IGEgbmV3IGRhdGFmbG93IG5vZGUgbmVlZHMgaXQgbm93XG4gIC8vIGVuc3VyZSBleGlzdGluZyB0dXBsZXMgaGF2ZSBwcmV2IHNldC5cbiAgaWYoIXRoaXMuX3JldmlzZXMgJiYgcCkge1xuICAgIHRoaXMuX2RhdGEuZm9yRWFjaChzZXRfcHJldik7XG4gICAgdGhpcy5faW5wdXQuYWRkLmZvckVhY2goc2V0X3ByZXYpOyAvLyBOZXcgdHVwbGVzIHRoYXQgaGF2ZW4ndCB5ZXQgYmVlbiBtZXJnZWQgaW50byBfZGF0YVxuICB9XG5cbiAgdGhpcy5fcmV2aXNlcyA9IHRoaXMuX3JldmlzZXMgfHwgcDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5sYXN0ID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLl9vdXRwdXQ7IH07XG5cbnByb3RvLmZpcmUgPSBmdW5jdGlvbihpbnB1dCkge1xuICBpZihpbnB1dCkgdGhpcy5faW5wdXQgPSBpbnB1dDtcbiAgdGhpcy5fZ3JhcGgucHJvcGFnYXRlKHRoaXMuX2lucHV0LCB0aGlzLl9waXBlbGluZVswXSk7IFxufTtcblxucHJvdG8ucGlwZWxpbmUgPSBmdW5jdGlvbihwaXBlbGluZSkge1xuICB2YXIgZHMgPSB0aGlzLCBuLCBjO1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3BpcGVsaW5lO1xuXG4gIGlmKHBpcGVsaW5lLmxlbmd0aCkge1xuICAgIC8vIElmIHdlIGhhdmUgYSBwaXBlbGluZSwgYWRkIGEgY29sbGVjdG9yIHRvIHRoZSBlbmQgdG8gbWF0ZXJpYWxpemVcbiAgICAvLyB0aGUgb3V0cHV0LlxuICAgIGRzLl9jb2xsZWN0b3IgPSBuZXcgQ29sbGVjdG9yKHRoaXMuX2dyYXBoKTtcbiAgICBwaXBlbGluZS5wdXNoKGRzLl9jb2xsZWN0b3IpO1xuICAgIGRzLl9yZXZpc2VzID0gcGlwZWxpbmUuc29tZShmdW5jdGlvbihwKSB7IHJldHVybiBwLnJldmlzZXMoKTsgfSk7XG4gIH1cblxuICAvLyBJbnB1dCBub2RlIGFwcGxpZXMgdGhlIGRhdGFzb3VyY2UncyBkZWx0YSwgYW5kIHByb3BhZ2F0ZXMgaXQgdG8gXG4gIC8vIHRoZSByZXN0IG9mIHRoZSBwaXBlbGluZS4gSXQgcmVjZWl2ZXMgdG91Y2hlcyB0byByZWZsb3cgZGF0YS5cbiAgdmFyIGlucHV0ID0gbmV3IE5vZGUodGhpcy5fZ3JhcGgpXG4gICAgLnJvdXRlcih0cnVlKVxuICAgIC5jb2xsZWN0b3IodHJ1ZSk7XG5cbiAgaW5wdXQuZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgIGRlYnVnKGlucHV0LCBbXCJpbnB1dFwiLCBkcy5fbmFtZV0pO1xuXG4gICAgdmFyIGRlbHRhID0gZHMuX2lucHV0LCBcbiAgICAgICAgb3V0ID0gY2hhbmdlc2V0LmNyZWF0ZShpbnB1dCksXG4gICAgICAgIHJlbTtcblxuICAgIC8vIERlbHRhIG1pZ2h0IGNvbnRhaW4gZmllbGRzIHVwZGF0ZWQgdGhyb3VnaCBBUElcbiAgICBkbC5rZXlzKGRlbHRhLmZpZWxkcykuZm9yRWFjaChmdW5jdGlvbihmKSB7IG91dC5maWVsZHNbZl0gPSAxIH0pO1xuXG4gICAgaWYoaW5wdXQucmVmbG93KSB7XG4gICAgICBvdXQubW9kID0gZHMuX2RhdGEuc2xpY2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gdXBkYXRlIGRhdGFcbiAgICAgIGlmKGRlbHRhLnJlbS5sZW5ndGgpIHtcbiAgICAgICAgcmVtID0gdHVwbGUuaWRNYXAoZGVsdGEucmVtKTtcbiAgICAgICAgZHMuX2RhdGEgPSBkcy5fZGF0YVxuICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oeCkgeyByZXR1cm4gcmVtW3guX2lkXSAhPT0gMSB9KTtcbiAgICAgIH1cblxuICAgICAgaWYoZGVsdGEuYWRkLmxlbmd0aCkgZHMuX2RhdGEgPSBkcy5fZGF0YS5jb25jYXQoZGVsdGEuYWRkKTtcblxuICAgICAgLy8gcmVzZXQgY2hhbmdlIGxpc3RcbiAgICAgIGRzLl9pbnB1dCA9IGNoYW5nZXNldC5jcmVhdGUoKTtcblxuICAgICAgb3V0LmFkZCA9IGRlbHRhLmFkZDsgXG4gICAgICBvdXQubW9kID0gZGVsdGEubW9kO1xuICAgICAgb3V0LnJlbSA9IGRlbHRhLnJlbTtcbiAgICB9XG5cbiAgICByZXR1cm4gKG91dC5mYWNldCA9IGRzLl9mYWNldCwgb3V0KTtcbiAgfTtcblxuICBwaXBlbGluZS51bnNoaWZ0KGlucHV0KTtcblxuICAvLyBPdXRwdXQgbm9kZSBjYXB0dXJlcyB0aGUgbGFzdCBjaGFuZ2VzZXQgc2VlbiBieSB0aGlzIGRhdGFzb3VyY2VcbiAgLy8gKG5lZWRlZCBmb3Igam9pbnMgYW5kIGJ1aWxkcykgYW5kIG1hdGVyaWFsaXplcyBhbnkgbmVzdGVkIGRhdGEuXG4gIC8vIElmIHRoaXMgZGF0YXNvdXJjZSBpcyBmYWNldGVkLCBtYXRlcmlhbGl6ZXMgdGhlIHZhbHVlcyBpbiB0aGUgZmFjZXQuXG4gIHZhciBvdXRwdXQgPSBuZXcgTm9kZSh0aGlzLl9ncmFwaClcbiAgICAucm91dGVyKHRydWUpXG4gICAgLmNvbGxlY3Rvcih0cnVlKTtcblxuICBvdXRwdXQuZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgIGRlYnVnKGlucHV0LCBbXCJvdXRwdXRcIiwgZHMuX25hbWVdKTtcbiAgICB2YXIgb3V0cHV0ID0gY2hhbmdlc2V0LmNyZWF0ZShpbnB1dCwgdHJ1ZSk7XG5cbiAgICBpZihkcy5fZmFjZXQpIHtcbiAgICAgIGRzLl9mYWNldC52YWx1ZXMgPSBkcy52YWx1ZXMoKTtcbiAgICAgIGlucHV0LmZhY2V0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBkcy5fb3V0cHV0ID0gaW5wdXQ7XG4gICAgb3V0cHV0LmRhdGFbZHMuX25hbWVdID0gMTtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9O1xuXG4gIHBpcGVsaW5lLnB1c2gob3V0cHV0KTtcblxuICB0aGlzLl9waXBlbGluZSA9IHBpcGVsaW5lO1xuICB0aGlzLl9ncmFwaC5jb25uZWN0KGRzLl9waXBlbGluZSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8ubGlzdGVuZXIgPSBmdW5jdGlvbigpIHsgXG4gIHZhciBsID0gbmV3IE5vZGUodGhpcy5fZ3JhcGgpLnJvdXRlcih0cnVlKSxcbiAgICAgIGRlc3QgPSB0aGlzLFxuICAgICAgcHJldiA9IHRoaXMuX3JldmlzZXMgPyBudWxsIDogdW5kZWZpbmVkO1xuXG4gIGwuZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgIGRlc3QuX3NyY01hcCA9IGRlc3QuX3NyY01hcCB8fCB7fTsgIC8vIHRvIHByb3BhZ2F0ZSB0dXBsZXMgY29ycmVjdGx5XG4gICAgdmFyIG1hcCA9IGRlc3QuX3NyY01hcCxcbiAgICAgICAgb3V0cHV0ICA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpO1xuXG4gICAgb3V0cHV0LmFkZCA9IGlucHV0LmFkZC5tYXAoZnVuY3Rpb24odCkge1xuICAgICAgcmV0dXJuIChtYXBbdC5faWRdID0gdHVwbGUuZGVyaXZlKHQsIHQuX3ByZXYgIT09IHVuZGVmaW5lZCA/IHQuX3ByZXYgOiBwcmV2KSk7XG4gICAgfSk7XG4gICAgb3V0cHV0Lm1vZCA9IGlucHV0Lm1vZC5tYXAoZnVuY3Rpb24odCkgeyByZXR1cm4gbWFwW3QuX2lkXTsgfSk7XG4gICAgb3V0cHV0LnJlbSA9IGlucHV0LnJlbS5tYXAoZnVuY3Rpb24odCkgeyBcbiAgICAgIHZhciBvID0gbWFwW3QuX2lkXTtcbiAgICAgIG1hcFt0Ll9pZF0gPSBudWxsO1xuICAgICAgcmV0dXJuIG87XG4gICAgfSk7XG5cbiAgICByZXR1cm4gKGRlc3QuX2lucHV0ID0gb3V0cHV0KTtcbiAgfTtcblxuICBsLmFkZExpc3RlbmVyKHRoaXMuX3BpcGVsaW5lWzBdKTtcbiAgcmV0dXJuIGw7XG59O1xuXG5wcm90by5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKGwpIHtcbiAgaWYobCBpbnN0YW5jZW9mIERhdGFzb3VyY2UpIHtcbiAgICBpZih0aGlzLl9jb2xsZWN0b3IpIHRoaXMuX2NvbGxlY3Rvci5hZGRMaXN0ZW5lcihsLmxpc3RlbmVyKCkpO1xuICAgIGVsc2UgdGhpcy5fcGlwZWxpbmVbMF0uYWRkTGlzdGVuZXIobC5saXN0ZW5lcigpKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9waXBlbGluZVt0aGlzLl9waXBlbGluZS5sZW5ndGgtMV0uYWRkTGlzdGVuZXIobCk7ICAgICAgXG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24obCkge1xuICB0aGlzLl9waXBlbGluZVt0aGlzLl9waXBlbGluZS5sZW5ndGgtMV0ucmVtb3ZlTGlzdGVuZXIobCk7XG59O1xuXG5wcm90by5saXN0ZW5lcnMgPSBmdW5jdGlvbihkcykge1xuICByZXR1cm4gZHMgXG4gICAgPyB0aGlzLl9jb2xsZWN0b3IgPyB0aGlzLl9jb2xsZWN0b3IubGlzdGVuZXJzKCkgOiB0aGlzLl9waXBlbGluZVswXS5saXN0ZW5lcnMoKVxuICAgIDogdGhpcy5fcGlwZWxpbmVbdGhpcy5fcGlwZWxpbmUubGVuZ3RoLTFdLmxpc3RlbmVycygpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEYXRhc291cmNlOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBIZWFwID0gcmVxdWlyZSgnaGVhcCcpLFxuICAgIERhdGFzb3VyY2UgPSByZXF1aXJlKCcuL0RhdGFzb3VyY2UnKSxcbiAgICBTaWduYWwgPSByZXF1aXJlKCcuL1NpZ25hbCcpLFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4vY2hhbmdlc2V0JyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIEdyYXBoKCkge1xuICB0aGlzLl9zdGFtcCA9IDA7XG4gIHRoaXMuX3JhbmsgID0gMDtcblxuICB0aGlzLl9kYXRhID0ge307XG4gIHRoaXMuX3NpZ25hbHMgPSB7fTtcblxuICB0aGlzLmRvTm90UHJvcGFnYXRlID0ge307XG59XG5cbnZhciBwcm90byA9IEdyYXBoLnByb3RvdHlwZTtcblxucHJvdG8uZGF0YSA9IGZ1bmN0aW9uKG5hbWUsIHBpcGVsaW5lLCBmYWNldCkge1xuICB2YXIgZGIgPSB0aGlzLl9kYXRhO1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGRsLmtleXMoZGIpLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkYltkXTsgfSk7XG4gIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHJldHVybiBkYltuYW1lXTtcbiAgcmV0dXJuIChkYltuYW1lXSA9IG5ldyBEYXRhc291cmNlKHRoaXMsIG5hbWUsIGZhY2V0KS5waXBlbGluZShwaXBlbGluZSkpO1xufTtcblxuZnVuY3Rpb24gc2lnbmFsKG5hbWUpIHtcbiAgdmFyIG0gPSB0aGlzLCBpLCBsZW47XG4gIGlmKCFkbC5pc0FycmF5KG5hbWUpKSByZXR1cm4gdGhpcy5fc2lnbmFsc1tuYW1lXTtcbiAgcmV0dXJuIG5hbWUubWFwKGZ1bmN0aW9uKG4pIHsgbS5fc2lnbmFsc1tuXTsgfSk7XG59XG5cbnByb3RvLnNpZ25hbCA9IGZ1bmN0aW9uKG5hbWUsIGluaXQpIHtcbiAgdmFyIG0gPSB0aGlzO1xuICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAxKSByZXR1cm4gc2lnbmFsLmNhbGwodGhpcywgbmFtZSk7XG4gIHJldHVybiAodGhpcy5fc2lnbmFsc1tuYW1lXSA9IG5ldyBTaWduYWwodGhpcywgbmFtZSwgaW5pdCkpO1xufTtcblxucHJvdG8uc2lnbmFsVmFsdWVzID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIgZ3JhcGggPSB0aGlzO1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgbmFtZSA9IGRsLmtleXModGhpcy5fc2lnbmFscyk7XG4gIGlmKCFkbC5pc0FycmF5KG5hbWUpKSByZXR1cm4gdGhpcy5fc2lnbmFsc1tuYW1lXS52YWx1ZSgpO1xuICByZXR1cm4gbmFtZS5yZWR1Y2UoZnVuY3Rpb24oc2csIG4pIHtcbiAgICByZXR1cm4gKHNnW25dID0gZ3JhcGguX3NpZ25hbHNbbl0udmFsdWUoKSwgc2cpO1xuICB9LCB7fSk7XG59O1xuXG5wcm90by5zaWduYWxSZWYgPSBmdW5jdGlvbihyZWYpIHtcbiAgaWYoIWRsLmlzQXJyYXkocmVmKSkgcmVmID0gZGwuZmllbGQocmVmKTtcbiAgdmFyIHZhbHVlID0gdGhpcy5zaWduYWwocmVmLnNoaWZ0KCkpLnZhbHVlKCk7XG4gIGlmKHJlZi5sZW5ndGggPiAwKSB7XG4gICAgdmFyIGZuID0gRnVuY3Rpb24oXCJzXCIsIFwicmV0dXJuIHNbXCIrcmVmLm1hcChkbC5zdHIpLmpvaW4oXCJdW1wiKStcIl1cIik7XG4gICAgdmFsdWUgPSBmbi5jYWxsKG51bGwsIHZhbHVlKTtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn07XG5cbnZhciBzY2hlZHVsZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgLy8gSWYgdGhlIG5vZGVzIGFyZSBlcXVhbCwgcHJvcGFnYXRlIHRoZSBub24tcmVmbG93IHB1bHNlIGZpcnN0LFxuICAvLyBzbyB0aGF0IHdlIGNhbiBpZ25vcmUgc3Vic2VxdWVudCByZWZsb3cgcHVsc2VzLiBcbiAgaWYoYS5yYW5rID09IGIucmFuaykgcmV0dXJuIGEucHVsc2UucmVmbG93ID8gMSA6IC0xO1xuICBlbHNlIHJldHVybiBhLnJhbmsgLSBiLnJhbms7IFxufTtcblxucHJvdG8ucHJvcGFnYXRlID0gZnVuY3Rpb24ocHVsc2UsIG5vZGUpIHtcbiAgdmFyIHYsIGwsIG4sIHAsIHIsIGksIGxlbiwgcmVmbG93ZWQ7XG5cbiAgLy8gbmV3IFBRIHdpdGggZWFjaCBwcm9wYWdhdGlvbiBjeWNsZSBzbyB0aGF0IHdlIGNhbiBwdWxzZSBicmFuY2hlc1xuICAvLyBvZiB0aGUgZGF0YWZsb3cgZ3JhcGggZHVyaW5nIGEgcHJvcGFnYXRpb24gKGUuZy4sIHdoZW4gY3JlYXRpbmdcbiAgLy8gYSBuZXcgaW5saW5lIGRhdGFzb3VyY2UpLlxuICB2YXIgcHEgPSBuZXcgSGVhcChzY2hlZHVsZSk7IFxuXG4gIGlmKHB1bHNlLnN0YW1wKSB0aHJvdyBcIlB1bHNlIGFscmVhZHkgaGFzIGEgbm9uLXplcm8gc3RhbXBcIlxuXG4gIHB1bHNlLnN0YW1wID0gKyt0aGlzLl9zdGFtcDtcbiAgcHEucHVzaCh7IG5vZGU6IG5vZGUsIHB1bHNlOiBwdWxzZSwgcmFuazogbm9kZS5yYW5rKCkgfSk7XG5cbiAgd2hpbGUgKHBxLnNpemUoKSA+IDApIHtcbiAgICB2ID0gcHEucG9wKCksIG4gPSB2Lm5vZGUsIHAgPSB2LnB1bHNlLCByID0gdi5yYW5rLCBsID0gbi5fbGlzdGVuZXJzO1xuICAgIHJlZmxvd2VkID0gcC5yZWZsb3cgJiYgbi5sYXN0KCkgPj0gcC5zdGFtcDtcblxuICAgIGlmKHJlZmxvd2VkKSBjb250aW51ZTsgLy8gRG9uJ3QgbmVlZGxlc3NseSByZWZsb3cgb3BzLlxuXG4gICAgLy8gQSBub2RlJ3MgcmFuayBtaWdodCBjaGFuZ2UgZHVyaW5nIGEgcHJvcGFnYXRpb24gKGUuZy4gaW5zdGFudGlhdGluZ1xuICAgIC8vIGEgZ3JvdXAncyBkYXRhZmxvdyBicmFuY2gpLiBSZS1xdWV1ZSBpZiBpdCBoYXMuIFRcbiAgICAvLyBUT0RPOiB1c2UgcHEucmVwbGFjZSBvciBwcS5wb3BwdXNoP1xuICAgIGlmKHIgIT0gbi5yYW5rKCkpIHtcbiAgICAgIGRlYnVnKHAsIFsnUmFuayBtaXNtYXRjaCcsIHIsIG4ucmFuaygpXSk7XG4gICAgICBwcS5wdXNoKHsgbm9kZTogbiwgcHVsc2U6IHAsIHJhbms6IG4ucmFuaygpIH0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcCA9IHRoaXMuZXZhbHVhdGUocCwgbik7XG5cbiAgICAvLyBFdmVuIGlmIHdlIGRpZG4ndCBydW4gdGhlIG5vZGUsIHdlIHN0aWxsIHdhbnQgdG8gcHJvcGFnYXRlIFxuICAgIC8vIHRoZSBwdWxzZS4gXG4gICAgaWYgKHAgIT09IHRoaXMuZG9Ob3RQcm9wYWdhdGUpIHtcbiAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGwubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgcHEucHVzaCh7IG5vZGU6IGxbaV0sIHB1bHNlOiBwLCByYW5rOiBsW2ldLl9yYW5rIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLy8gQ29ubmVjdCBhIGJyYW5jaCBvZiBkYXRhZmxvdyBub2Rlcy4gXG4vLyBEZXBlbmRlbmNpZXMgZ2V0IHdpcmVkIHRvIHRoZSBuZWFyZXN0IGNvbGxlY3Rvci4gXG5mdW5jdGlvbiBmb3JFYWNoTm9kZShicmFuY2gsIGZuKSB7XG4gIHZhciBub2RlLCBjb2xsZWN0b3IsIGksIGxlbjtcbiAgZm9yKGk9MCwgbGVuPWJyYW5jaC5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBub2RlID0gYnJhbmNoW2ldO1xuICAgIGlmKG5vZGUuY29sbGVjdG9yKCkpIGNvbGxlY3RvciA9IG5vZGU7XG4gICAgZm4obm9kZSwgY29sbGVjdG9yLCBpKTtcbiAgfVxufVxuXG5wcm90by5jb25uZWN0ID0gZnVuY3Rpb24oYnJhbmNoKSB7XG4gIGRlYnVnKHt9LCBbJ2Nvbm5lY3RpbmcnXSk7XG4gIHZhciBncmFwaCA9IHRoaXM7XG4gIGZvckVhY2hOb2RlKGJyYW5jaCwgZnVuY3Rpb24obiwgYywgaSkge1xuICAgIHZhciBkYXRhID0gbi5kZXBlbmRlbmN5KEMuREFUQSksXG4gICAgICAgIHNpZ25hbHMgPSBuLmRlcGVuZGVuY3koQy5TSUdOQUxTKTtcblxuICAgIGlmKGRhdGEubGVuZ3RoID4gMCkge1xuICAgICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgXG4gICAgICAgIGdyYXBoLmRhdGEoZClcbiAgICAgICAgICAucmV2aXNlcyhuLnJldmlzZXMoKSlcbiAgICAgICAgICAuYWRkTGlzdGVuZXIoYyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZihzaWduYWxzLmxlbmd0aCA+IDApIHtcbiAgICAgIHNpZ25hbHMuZm9yRWFjaChmdW5jdGlvbihzKSB7IGdyYXBoLnNpZ25hbChzKS5hZGRMaXN0ZW5lcihjKTsgfSk7XG4gICAgfVxuXG4gICAgaWYoaSA+IDApIHtcbiAgICAgIGJyYW5jaFtpLTFdLmFkZExpc3RlbmVyKGJyYW5jaFtpXSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gYnJhbmNoO1xufTtcblxucHJvdG8uZGlzY29ubmVjdCA9IGZ1bmN0aW9uKGJyYW5jaCkge1xuICBkZWJ1Zyh7fSwgWydkaXNjb25uZWN0aW5nJ10pO1xuICB2YXIgZ3JhcGggPSB0aGlzO1xuXG4gIGZvckVhY2hOb2RlKGJyYW5jaCwgZnVuY3Rpb24obiwgYywgaSkge1xuICAgIHZhciBkYXRhID0gbi5kZXBlbmRlbmN5KEMuREFUQSksXG4gICAgICAgIHNpZ25hbHMgPSBuLmRlcGVuZGVuY3koQy5TSUdOQUxTKTtcblxuICAgIGlmKGRhdGEubGVuZ3RoID4gMCkge1xuICAgICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgZ3JhcGguZGF0YShkKS5yZW1vdmVMaXN0ZW5lcihjKTsgfSk7XG4gICAgfVxuXG4gICAgaWYoc2lnbmFscy5sZW5ndGggPiAwKSB7XG4gICAgICBzaWduYWxzLmZvckVhY2goZnVuY3Rpb24ocykgeyBncmFwaC5zaWduYWwocykucmVtb3ZlTGlzdGVuZXIoYykgfSk7XG4gICAgfVxuXG4gICAgbi5kaXNjb25uZWN0KCk7ICBcbiAgfSk7XG5cbiAgcmV0dXJuIGJyYW5jaDtcbn07XG5cbnByb3RvLnJlZXZhbHVhdGUgPSBmdW5jdGlvbihwdWxzZSwgbm9kZSkge1xuICB2YXIgcmVmbG93ZWQgPSAhcHVsc2UucmVmbG93IHx8IChwdWxzZS5yZWZsb3cgJiYgbm9kZS5sYXN0KCkgPj0gcHVsc2Uuc3RhbXApLFxuICAgICAgcnVuID0gISFwdWxzZS5hZGQubGVuZ3RoIHx8ICEhcHVsc2UucmVtLmxlbmd0aCB8fCBub2RlLnJvdXRlcigpO1xuICBydW4gPSBydW4gfHwgIXJlZmxvd2VkO1xuICByZXR1cm4gcnVuIHx8IG5vZGUucmVldmFsdWF0ZShwdWxzZSk7XG59O1xuXG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKHB1bHNlLCBub2RlKSB7XG4gIGlmKCF0aGlzLnJlZXZhbHVhdGUocHVsc2UsIG5vZGUpKSByZXR1cm4gcHVsc2U7XG4gIHB1bHNlID0gbm9kZS5ldmFsdWF0ZShwdWxzZSk7XG4gIG5vZGUubGFzdChwdWxzZS5zdGFtcCk7XG4gIHJldHVybiBwdWxzZVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHcmFwaDsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyksXG4gICAgUkVFVkFMID0gW0MuREFUQSwgQy5GSUVMRFMsIEMuU0NBTEVTLCBDLlNJR05BTFNdO1xuXG52YXIgbm9kZV9pZCA9IDE7XG5cbmZ1bmN0aW9uIE5vZGUoZ3JhcGgpIHtcbiAgaWYoZ3JhcGgpIHRoaXMuaW5pdChncmFwaCk7XG4gIHJldHVybiB0aGlzO1xufVxuXG52YXIgcHJvdG8gPSBOb2RlLnByb3RvdHlwZTtcblxucHJvdG8uaW5pdCA9IGZ1bmN0aW9uKGdyYXBoKSB7XG4gIHRoaXMuX2lkID0gbm9kZV9pZCsrO1xuICB0aGlzLl9ncmFwaCA9IGdyYXBoO1xuICB0aGlzLl9yYW5rID0gKytncmFwaC5fcmFuazsgLy8gRm9yIHRvcG9sb2dpYWwgc29ydFxuICB0aGlzLl9zdGFtcCA9IDA7ICAvLyBMYXN0IHN0YW1wIHNlZW5cblxuICB0aGlzLl9saXN0ZW5lcnMgPSBbXTtcbiAgdGhpcy5fcmVnaXN0ZXJlZCA9IHt9OyAvLyBUbyBwcmV2ZW50IGR1cGxpY2F0ZSBsaXN0ZW5lcnNcblxuICB0aGlzLl9kZXBzID0ge1xuICAgIGRhdGE6ICAgIFtdLFxuICAgIGZpZWxkczogIFtdLFxuICAgIHNjYWxlczogIFtdLFxuICAgIHNpZ25hbHM6IFtdLFxuICB9O1xuXG4gIHRoaXMuX2lzUm91dGVyID0gZmFsc2U7IC8vIFJlc3BvbnNpYmxlIGZvciBwcm9wYWdhdGluZyB0dXBsZXMsIGNhbm5vdCBldmVyIGJlIHNraXBwZWRcbiAgdGhpcy5faXNDb2xsZWN0b3IgPSBmYWxzZTsgIC8vIEhvbGRzIGEgbWF0ZXJpYWxpemVkIGRhdGFzZXQsIHB1bHNlIHRvIHJlZmxvd1xuICB0aGlzLl9yZXZpc2VzID0gZmFsc2U7IC8vIERvZXMgdGhlIG9wZXJhdG9yIHJlcXVpcmUgdHVwbGVzJyBwcmV2aW91cyB2YWx1ZXM/IFxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gIHZhciBuID0gbmV3IE5vZGUodGhpcy5fZ3JhcGgpO1xuICBuLmV2YWx1YXRlID0gdGhpcy5ldmFsdWF0ZTtcbiAgbi5fZGVwcyA9IHRoaXMuX2RlcHM7XG4gIG4uX2lzUm91dGVyID0gdGhpcy5faXNSb3V0ZXI7XG4gIG4uX2lzQ29sbGVjdG9yID0gdGhpcy5faXNDb2xsZWN0b3I7XG4gIHJldHVybiBuO1xufTtcblxucHJvdG8ucmFuayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fcmFuazsgfTtcblxucHJvdG8ubGFzdCA9IGZ1bmN0aW9uKHN0YW1wKSB7IFxuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3N0YW1wO1xuICB0aGlzLl9zdGFtcCA9IHN0YW1wO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmRlcGVuZGVuY3kgPSBmdW5jdGlvbih0eXBlLCBkZXBzKSB7XG4gIHZhciBkID0gdGhpcy5fZGVwc1t0eXBlXTtcbiAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGQ7XG4gIGlmKGRlcHMgPT09IG51bGwpIHsgLy8gQ2xlYXIgZGVwZW5kZW5jaWVzIG9mIGEgY2VydGFpbiB0eXBlXG4gICAgd2hpbGUoZC5sZW5ndGggPiAwKSBkLnBvcCgpO1xuICB9IGVsc2Uge1xuICAgIGlmKCFkbC5pc0FycmF5KGRlcHMpICYmIGQuaW5kZXhPZihkZXBzKSA8IDApIGQucHVzaChkZXBzKTtcbiAgICBlbHNlIGQucHVzaC5hcHBseShkLCBkbC5hcnJheShkZXBzKSk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5yb3V0ZXIgPSBmdW5jdGlvbihib29sKSB7XG4gIGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5faXNSb3V0ZXI7XG4gIHRoaXMuX2lzUm91dGVyID0gISFib29sXG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8uY29sbGVjdG9yID0gZnVuY3Rpb24oYm9vbCkge1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX2lzQ29sbGVjdG9yO1xuICB0aGlzLl9pc0NvbGxlY3RvciA9ICEhYm9vbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5yZXZpc2VzID0gZnVuY3Rpb24oYm9vbCkge1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3JldmlzZXM7XG4gIHRoaXMuX3JldmlzZXMgPSAhIWJvb2w7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8ubGlzdGVuZXJzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9saXN0ZW5lcnM7XG59O1xuXG5wcm90by5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKGwpIHtcbiAgaWYoIShsIGluc3RhbmNlb2YgTm9kZSkpIHRocm93IFwiTGlzdGVuZXIgaXMgbm90IGEgTm9kZVwiO1xuICBpZih0aGlzLl9yZWdpc3RlcmVkW2wuX2lkXSkgcmV0dXJuIHRoaXM7XG5cbiAgdGhpcy5fbGlzdGVuZXJzLnB1c2gobCk7XG4gIHRoaXMuX3JlZ2lzdGVyZWRbbC5faWRdID0gMTtcbiAgaWYodGhpcy5fcmFuayA+IGwuX3JhbmspIHtcbiAgICB2YXIgcSA9IFtsXTtcbiAgICB3aGlsZShxLmxlbmd0aCkge1xuICAgICAgdmFyIGN1ciA9IHEuc3BsaWNlKDAsMSlbMF07XG4gICAgICBjdXIuX3JhbmsgPSArK3RoaXMuX2dyYXBoLl9yYW5rO1xuICAgICAgcS5wdXNoLmFwcGx5KHEsIGN1ci5fbGlzdGVuZXJzKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gKGwpIHtcbiAgdmFyIGZvdW5kU2VuZGluZyA9IGZhbHNlO1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5fbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbiAmJiAhZm91bmRTZW5kaW5nOyBpKyspIHtcbiAgICBpZiAodGhpcy5fbGlzdGVuZXJzW2ldID09PSBsKSB7XG4gICAgICB0aGlzLl9saXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgdGhpcy5fcmVnaXN0ZXJlZFtsLl9pZF0gPSBudWxsO1xuICAgICAgZm91bmRTZW5kaW5nID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgXG4gIHJldHVybiBmb3VuZFNlbmRpbmc7XG59O1xuXG5wcm90by5kaXNjb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2xpc3RlbmVycyA9IFtdO1xuICB0aGlzLl9yZWdpc3RlcmVkID0ge307XG59O1xuXG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKHB1bHNlKSB7IHJldHVybiBwdWxzZTsgfVxuXG5wcm90by5yZWV2YWx1YXRlID0gZnVuY3Rpb24ocHVsc2UpIHtcbiAgdmFyIG5vZGUgPSB0aGlzLCByZWV2YWwgPSBmYWxzZTtcbiAgcmV0dXJuIFJFRVZBTC5zb21lKGZ1bmN0aW9uKHByb3ApIHtcbiAgICByZWV2YWwgPSByZWV2YWwgfHwgbm9kZS5fZGVwc1twcm9wXS5zb21lKGZ1bmN0aW9uKGspIHsgcmV0dXJuICEhcHVsc2VbcHJvcF1ba10gfSk7XG4gICAgcmV0dXJuIHJlZXZhbDtcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5vZGU7IiwidmFyIE5vZGUgPSByZXF1aXJlKCcuL05vZGUnKSxcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCcuL2NoYW5nZXNldCcpO1xuXG5mdW5jdGlvbiBTaWduYWwoZ3JhcGgsIG5hbWUsIGluaXQpIHtcbiAgTm9kZS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgdGhpcy5fbmFtZSAgPSBuYW1lO1xuICB0aGlzLl92YWx1ZSA9IGluaXQ7XG4gIHJldHVybiB0aGlzO1xufTtcblxudmFyIHByb3RvID0gKFNpZ25hbC5wcm90b3R5cGUgPSBuZXcgTm9kZSgpKTtcblxucHJvdG8ubmFtZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fbmFtZTsgfTtcblxucHJvdG8udmFsdWUgPSBmdW5jdGlvbih2YWwpIHtcbiAgaWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgdGhpcy5fdmFsdWUgPSB2YWw7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8uZmlyZSA9IGZ1bmN0aW9uKGNzKSB7XG4gIGlmKCFjcykgY3MgPSBjaGFuZ2VzZXQuY3JlYXRlKG51bGwsIHRydWUpO1xuICBjcy5zaWduYWxzW3RoaXMuX25hbWVdID0gMTtcbiAgdGhpcy5fZ3JhcGgucHJvcGFnYXRlKGNzLCB0aGlzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2lnbmFsOyIsInZhciBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcbnZhciBSRUVWQUwgPSBbQy5EQVRBLCBDLkZJRUxEUywgQy5TQ0FMRVMsIEMuU0lHTkFMU107XG5cbmZ1bmN0aW9uIGNyZWF0ZShjcywgcmVmbG93KSB7XG4gIHZhciBvdXQgPSB7fTtcbiAgY29weShjcywgb3V0KTtcblxuICBvdXQuYWRkID0gW107XG4gIG91dC5tb2QgPSBbXTtcbiAgb3V0LnJlbSA9IFtdO1xuXG4gIG91dC5yZWZsb3cgPSByZWZsb3c7XG5cbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gcmVzZXRfcHJldih4KSB7XG4gIHguX3ByZXYgPSAoeC5fcHJldiA9PT0gdW5kZWZpbmVkKSA/IHVuZGVmaW5lZCA6IEMuU0VOVElORUw7XG59XG5cbmZ1bmN0aW9uIGZpbmFsaXplKGNzKSB7XG4gIGZvcihpPTAsIGxlbj1jcy5hZGQubGVuZ3RoOyBpPGxlbjsgKytpKSByZXNldF9wcmV2KGNzLmFkZFtpXSk7XG4gIGZvcihpPTAsIGxlbj1jcy5tb2QubGVuZ3RoOyBpPGxlbjsgKytpKSByZXNldF9wcmV2KGNzLm1vZFtpXSk7XG59XG5cbmZ1bmN0aW9uIGNvcHkoYSwgYikge1xuICBiLnN0YW1wID0gYSA/IGEuc3RhbXAgOiAwO1xuICBiLnNvcnQgID0gYSA/IGEuc29ydCAgOiBudWxsO1xuICBiLmZhY2V0ID0gYSA/IGEuZmFjZXQgOiBudWxsO1xuICBiLnRyYW5zID0gYSA/IGEudHJhbnMgOiBudWxsO1xuICBSRUVWQUwuZm9yRWFjaChmdW5jdGlvbihkKSB7IGJbZF0gPSBhID8gYVtkXSA6IHt9OyB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNyZWF0ZTogY3JlYXRlLFxuICBjb3B5OiBjb3B5LFxuICBmaW5hbGl6ZTogZmluYWxpemUsXG59OyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKSxcbiAgICB0dXBsZV9pZCA9IDE7XG5cbi8vIE9iamVjdC5jcmVhdGUgaXMgZXhwZW5zaXZlLiBTbywgd2hlbiBpbmdlc3RpbmcsIHRydXN0IHRoYXQgdGhlXG4vLyBkYXR1bSBpcyBhbiBvYmplY3QgdGhhdCBoYXMgYmVlbiBhcHByb3ByaWF0ZWx5IHNhbmRib3hlZCBmcm9tIFxuLy8gdGhlIG91dHNpZGUgZW52aXJvbm1lbnQuIFxuZnVuY3Rpb24gaW5nZXN0KGRhdHVtLCBwcmV2KSB7XG4gIGRhdHVtID0gZGwuaXNPYmplY3QoZGF0dW0pID8gZGF0dW0gOiB7ZGF0YTogZGF0dW19O1xuICBkYXR1bS5faWQgPSB0dXBsZV9pZCsrO1xuICBkYXR1bS5fcHJldiA9IChwcmV2ICE9PSB1bmRlZmluZWQpID8gKHByZXYgfHwgQy5TRU5USU5FTCkgOiB1bmRlZmluZWQ7XG4gIHJldHVybiBkYXR1bTtcbn1cblxuZnVuY3Rpb24gZGVyaXZlKGRhdHVtLCBwcmV2KSB7XG4gIHJldHVybiBpbmdlc3QoT2JqZWN0LmNyZWF0ZShkYXR1bSksIHByZXYpO1xufVxuXG4vLyBXQVJOSU5HOiBvcGVyYXRvcnMgc2hvdWxkIG9ubHkgY2FsbCB0aGlzIG9uY2UgcGVyIHRpbWVzdGFtcCFcbmZ1bmN0aW9uIHNldCh0LCBrLCB2KSB7XG4gIHZhciBwcmV2ID0gdFtrXTtcbiAgaWYocHJldiA9PT0gdikgcmV0dXJuO1xuICBzZXRfcHJldih0LCBrKTtcbiAgdFtrXSA9IHY7XG59XG5cbmZ1bmN0aW9uIHNldF9wcmV2KHQsIGspIHtcbiAgaWYodC5fcHJldiA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gIHQuX3ByZXYgPSAodC5fcHJldiA9PT0gQy5TRU5USU5FTCkgPyB7fSA6IHQuX3ByZXY7XG4gIHQuX3ByZXZba10gPSB0W2tdO1xufVxuXG5mdW5jdGlvbiByZXNldCgpIHsgdHVwbGVfaWQgPSAxOyB9XG5cbmZ1bmN0aW9uIGlkTWFwKGEpIHtcbiAgcmV0dXJuIGEucmVkdWNlKGZ1bmN0aW9uKG0seCkge1xuICAgIHJldHVybiAobVt4Ll9pZF0gPSAxLCBtKTtcbiAgfSwge30pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGluZ2VzdDogaW5nZXN0LFxuICBkZXJpdmU6IGRlcml2ZSxcbiAgc2V0OiAgICBzZXQsXG4gIHByZXY6ICAgc2V0X3ByZXYsXG4gIHJlc2V0OiAgcmVzZXQsXG4gIGlkTWFwOiAgaWRNYXBcbn07IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdCkge1xuICBvcHQgPSBvcHQgfHwge307XG4gIHZhciBjb25zdGFudHMgPSBvcHQuY29uc3RhbnRzIHx8IHJlcXVpcmUoJy4vY29uc3RhbnRzJyk7XG4gIHZhciBmdW5jdGlvbnMgPSAob3B0LmZ1bmN0aW9ucyB8fCByZXF1aXJlKCcuL2Z1bmN0aW9ucycpKShjb2RlZ2VuKTtcbiAgdmFyIGlkV2hpdGVMaXN0ID0gb3B0LmlkV2hpdGVMaXN0ID8gZGwudG9NYXAob3B0LmlkV2hpdGVMaXN0KSA6IG51bGw7XG4gIHZhciBpZEJsYWNrTGlzdCA9IG9wdC5pZEJsYWNrTGlzdCA/IGRsLnRvTWFwKG9wdC5pZEJsYWNrTGlzdCkgOiBudWxsO1xuICB2YXIgbWVtYmVyRGVwdGggPSAwO1xuXG4gIC8vIFRPRE8gZ2VuZXJhbGl6ZT9cbiAgdmFyIERBVFVNID0gJ2QnO1xuICB2YXIgU0lHTkFMX1BSRUZJWCA9ICdzZy4nO1xuICB2YXIgc2lnbmFscyA9IHt9O1xuICB2YXIgZmllbGRzID0ge307XG5cbiAgZnVuY3Rpb24gY29kZWdlbl93cmFwKGFzdCkgeyAgICBcbiAgICB2YXIgcmV0dmFsID0ge1xuICAgICAgZm46IGNvZGVnZW4oYXN0KSxcbiAgICAgIHNpZ25hbHM6IGRsLmtleXMoc2lnbmFscyksXG4gICAgICBmaWVsZHM6IGRsLmtleXMoZmllbGRzKVxuICAgIH07XG4gICAgc2lnbmFscyA9IHt9O1xuICAgIGZpZWxkcyA9IHt9O1xuICAgIHJldHVybiByZXR2YWw7XG4gIH1cblxuICBmdW5jdGlvbiBjb2RlZ2VuKGFzdCkge1xuICAgIGlmIChhc3QgaW5zdGFuY2VvZiBTdHJpbmcpIHJldHVybiBhc3Q7XG4gICAgdmFyIGdlbmVyYXRvciA9IENPREVHRU5fVFlQRVNbYXN0LnR5cGVdO1xuICAgIGlmIChnZW5lcmF0b3IgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5zdXBwb3J0ZWQgdHlwZTogXCIgKyBhc3QudHlwZSk7XG4gICAgfVxuICAgIHJldHVybiBnZW5lcmF0b3IoYXN0KTtcbiAgfVxuXG4gIHZhciBDT0RFR0VOX1RZUEVTID0ge1xuICAgIFwiTGl0ZXJhbFwiOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIHJldHVybiBuLnJhdztcbiAgICAgIH0sXG4gICAgXCJJZGVudGlmaWVyXCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgdmFyIGlkID0gbi5uYW1lO1xuICAgICAgICBpZiAobWVtYmVyRGVwdGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIGlkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb25zdGFudHMuaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnN0YW50c1tpZF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlkV2hpdGVMaXN0KSB7XG4gICAgICAgICAgaWYgKGlkV2hpdGVMaXN0Lmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgICAgICAgcmV0dXJuIGlkO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzaWduYWxzW2lkXSA9IDE7XG4gICAgICAgICAgICByZXR1cm4gU0lHTkFMX1BSRUZJWCArIGlkOyAvLyBIQUNLaXNoLi4uXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChpZEJsYWNrTGlzdCAmJiBpZEJsYWNrTGlzdC5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbGxlZ2FsIGlkZW50aWZpZXI6IFwiICsgaWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpZDtcbiAgICAgIH0sXG4gICAgXCJQcm9ncmFtXCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgcmV0dXJuIG4uYm9keS5tYXAoY29kZWdlbikuam9pbihcIlxcblwiKTtcbiAgICAgIH0sXG4gICAgXCJNZW1iZXJFeHByZXNzaW9uXCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgdmFyIGQgPSAhbi5jb21wdXRlZDtcbiAgICAgICAgdmFyIG8gPSBjb2RlZ2VuKG4ub2JqZWN0KTtcbiAgICAgICAgaWYgKGQpIG1lbWJlckRlcHRoICs9IDE7XG4gICAgICAgIHZhciBwID0gY29kZWdlbihuLnByb3BlcnR5KTtcbiAgICAgICAgaWYgKG8gPT09IERBVFVNKSB7IGZpZWxkc1twXSA9IDE7IH0gLy8gSEFDS2lzaC4uLlxuICAgICAgICBpZiAoZCkgbWVtYmVyRGVwdGggLT0gMTtcbiAgICAgICAgcmV0dXJuIG8gKyAoZCA/IFwiLlwiK3AgOiBcIltcIitwK1wiXVwiKTtcbiAgICAgIH0sXG4gICAgXCJDYWxsRXhwcmVzc2lvblwiOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIGlmIChuLmNhbGxlZS50eXBlICE9PSBcIklkZW50aWZpZXJcIikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIklsbGVnYWwgY2FsbGVlIHR5cGU6IFwiICsgbi5jYWxsZWUudHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNhbGxlZSA9IG4uY2FsbGVlLm5hbWU7XG4gICAgICAgIHZhciBhcmdzID0gbi5hcmd1bWVudHM7XG4gICAgICAgIHZhciBmbiA9IGZ1bmN0aW9ucy5oYXNPd25Qcm9wZXJ0eShjYWxsZWUpICYmIGZ1bmN0aW9uc1tjYWxsZWVdO1xuICAgICAgICBpZiAoIWZuKSB0aHJvdyBuZXcgRXJyb3IoXCJVbnJlY29nbml6ZWQgZnVuY3Rpb246IFwiICsgY2FsbGVlKTtcbiAgICAgICAgcmV0dXJuIGZuIGluc3RhbmNlb2YgRnVuY3Rpb25cbiAgICAgICAgICA/IGZuKGFyZ3MpXG4gICAgICAgICAgOiBmbiArIFwiKFwiICsgYXJncy5tYXAoY29kZWdlbikuam9pbihcIixcIikgKyBcIilcIjtcbiAgICAgIH0sXG4gICAgXCJBcnJheUV4cHJlc3Npb25cIjogZnVuY3Rpb24obikge1xuICAgICAgICByZXR1cm4gXCJbXCIgKyBuLmVsZW1lbnRzLm1hcChjb2RlZ2VuKS5qb2luKFwiLFwiKSArIFwiXVwiO1xuICAgICAgfSxcbiAgICBcIkJpbmFyeUV4cHJlc3Npb25cIjogZnVuY3Rpb24obikge1xuICAgICAgICByZXR1cm4gXCIoXCIgKyBjb2RlZ2VuKG4ubGVmdCkgKyBuLm9wZXJhdG9yICsgY29kZWdlbihuLnJpZ2h0KSArIFwiKVwiO1xuICAgICAgfSxcbiAgICBcIlVuYXJ5RXhwcmVzc2lvblwiOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIHJldHVybiBcIihcIiArIG4ub3BlcmF0b3IgKyBjb2RlZ2VuKG4uYXJndW1lbnQpICsgXCIpXCI7XG4gICAgICB9LFxuICAgIFwiVXBkYXRlRXhwcmVzc2lvblwiOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIHJldHVybiBcIihcIiArIChwcmVmaXhcbiAgICAgICAgICA/IG4ub3BlcmF0b3IgKyBjb2RlZ2VuKG4uYXJndW1lbnQpXG4gICAgICAgICAgOiBjb2RlZ2VuKG4uYXJndW1lbnQpICsgbi5vcGVyYXRvclxuICAgICAgICApICsgXCIpXCI7XG4gICAgICB9LFxuICAgIFwiQ29uZGl0aW9uYWxFeHByZXNzaW9uXCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgcmV0dXJuIFwiKFwiICsgY29kZWdlbihuLnRlc3QpXG4gICAgICAgICAgKyBcIj9cIiArIGNvZGVnZW4obi5jb25zZXF1ZW50KVxuICAgICAgICAgICsgXCI6XCIgKyBjb2RlZ2VuKG4uYWx0ZXJuYXRlKVxuICAgICAgICAgICsgXCIpXCI7XG4gICAgICB9LFxuICAgIFwiTG9naWNhbEV4cHJlc3Npb25cIjogZnVuY3Rpb24obikge1xuICAgICAgICByZXR1cm4gXCIoXCIgKyBjb2RlZ2VuKG4ubGVmdCkgKyBuLm9wZXJhdG9yICsgY29kZWdlbihuLnJpZ2h0KSArIFwiKVwiO1xuICAgICAgfSxcbiAgICBcIk9iamVjdEV4cHJlc3Npb25cIjogZnVuY3Rpb24obikge1xuICAgICAgICByZXR1cm4gXCJ7XCIgKyBuLnByb3BlcnRpZXMubWFwKGNvZGVnZW4pLmpvaW4oXCIsXCIpICsgXCJ9XCI7XG4gICAgICB9LFxuICAgIFwiUHJvcGVydHlcIjogZnVuY3Rpb24obikge1xuICAgICAgICBtZW1iZXJEZXB0aCArPSAxO1xuICAgICAgICB2YXIgayA9IGNvZGVnZW4obi5rZXkpO1xuICAgICAgICBtZW1iZXJEZXB0aCAtPSAxO1xuICAgICAgICByZXR1cm4gayArIFwiOlwiICsgY29kZWdlbihuLnZhbHVlKTtcbiAgICAgIH0sXG4gICAgXCJFeHByZXNzaW9uU3RhdGVtZW50XCI6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgcmV0dXJuIGNvZGVnZW4obi5leHByZXNzaW9uKTtcbiAgICAgIH1cbiAgfTtcbiAgXG4gIHJldHVybiBjb2RlZ2VuX3dyYXA7XG59OyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBcIk5hTlwiOiAgICAgXCJOYU5cIixcbiAgXCJFXCI6ICAgICAgIFwiTWF0aC5FXCIsXG4gIFwiTE4yXCI6ICAgICBcIk1hdGguTE4yXCIsXG4gIFwiTE4xMFwiOiAgICBcIk1hdGguTE4xMFwiLFxuICBcIkxPRzJFXCI6ICAgXCJNYXRoLkxPRzJFXCIsXG4gIFwiTE9HMTBFXCI6ICBcIk1hdGguTE9HMTBFXCIsXG4gIFwiUElcIjogICAgICBcIk1hdGguUElcIixcbiAgXCJTUVJUMV8yXCI6IFwiTWF0aC5TUVJUMV8yXCIsXG4gIFwiU1FSVDJcIjogICBcIk1hdGguU1FSVDJcIlxufTsiLCJ2YXIgZGF0YWxpYiA9IHJlcXVpcmUoJ2RhdGFsaWInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjb2RlZ2VuKSB7XG5cbiAgZnVuY3Rpb24gZm5jYWxsKG5hbWUsIGFyZ3MsIGNhc3QsIHR5cGUpIHtcbiAgICB2YXIgb2JqID0gY29kZWdlbihhcmdzWzBdKTtcbiAgICBpZiAoY2FzdCkge1xuICAgICAgb2JqID0gY2FzdCArIFwiKFwiICsgb2JqICsgXCIpXCI7XG4gICAgICBpZiAoZGwuc3RhcnRzV2l0aChjYXN0LCBcIm5ldyBcIikpIG9iaiA9IFwiKFwiICsgb2JqICsgXCIpXCI7XG4gICAgfVxuICAgIHJldHVybiBvYmogKyBcIi5cIiArIG5hbWUgKyAodHlwZSA8IDAgPyBcIlwiIDogdHlwZSA9PT0gMFxuICAgICAgPyBcIigpXCJcbiAgICAgIDogXCIoXCIgKyBhcmdzLnNsaWNlKDEpLm1hcChjb2RlZ2VuKS5qb2luKFwiLFwiKSArIFwiKVwiKTtcbiAgfVxuICBcbiAgdmFyIERBVEUgPSBcIm5ldyBEYXRlXCI7XG4gIHZhciBTVFJJTkcgPSBcIlN0cmluZ1wiO1xuICB2YXIgUkVHRVhQID0gXCJSZWdFeHBcIjtcblxuICByZXR1cm4ge1xuICAgIC8vIE1BVEggZnVuY3Rpb25zXG4gICAgXCJpc05hTlwiOiAgICBcImlzTmFOXCIsXG4gICAgXCJpc0Zpbml0ZVwiOiBcImlzRmluaXRlXCIsXG4gICAgXCJhYnNcIjogICAgICBcIk1hdGguYWJzXCIsXG4gICAgXCJhY29zXCI6ICAgICBcIk1hdGguYWNvc1wiLFxuICAgIFwiYXNpblwiOiAgICAgXCJNYXRoLmFzaW5cIixcbiAgICBcImF0YW5cIjogICAgIFwiTWF0aC5hdGFuXCIsXG4gICAgXCJhdGFuMlwiOiAgICBcIk1hdGguYXRhbjJcIixcbiAgICBcImNlaWxcIjogICAgIFwiTWF0aC5jZWlsXCIsXG4gICAgXCJjb3NcIjogICAgICBcIk1hdGguY29zXCIsXG4gICAgXCJleHBcIjogICAgICBcIk1hdGguZXhwXCIsXG4gICAgXCJmbG9vclwiOiAgICBcIk1hdGguZmxvb3JcIixcbiAgICBcImxvZ1wiOiAgICAgIFwiTWF0aC5sb2dcIixcbiAgICBcIm1heFwiOiAgICAgIFwiTWF0aC5tYXhcIixcbiAgICBcIm1pblwiOiAgICAgIFwiTWF0aC5taW5cIixcbiAgICBcInBvd1wiOiAgICAgIFwiTWF0aC5wb3dcIixcbiAgICBcInJhbmRvbVwiOiAgIFwiTWF0aC5yYW5kb21cIixcbiAgICBcInJvdW5kXCI6ICAgIFwiTWF0aC5yb3VuZFwiLFxuICAgIFwic2luXCI6ICAgICAgXCJNYXRoLnNpblwiLFxuICAgIFwic3FydFwiOiAgICAgXCJNYXRoLnNxcnRcIixcbiAgICBcInRhblwiOiAgICAgIFwiTWF0aC50YW5cIixcblxuICAgIC8vIERBVEUgZnVuY3Rpb25zXG4gICAgXCJub3dcIjogICAgICBcIkRhdGUubm93XCIsXG4gICAgXCJkYXRldGltZVwiOiBcIm5ldyBEYXRlXCIsXG4gICAgXCJkYXRlXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImdldERhdGVcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwiZGF5XCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImdldERheVwiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJ5ZWFyXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImdldEZ1bGxZZWFyXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcIm1vbnRoXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImdldE1vbnRoXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcImhvdXJzXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImdldEhvdXJzXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcIm1pbnV0ZXNcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0TWludXRlc1wiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJzZWNvbmRzXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImdldFNlY29uZHNcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwibWlsbGlzZWNvbmRzXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImdldE1pbGxpc2Vjb25kc1wiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJ0aW1lXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImdldFRpbWVcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwidGltZXpvbmVvZmZzZXRcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwiZ2V0VGltZXpvbmVPZmZzZXRcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwidXRjZGF0ZVwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRVVENEYXRlXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcInV0Y2RheVwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRVVENEYXlcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwidXRjeWVhclwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRVVENGdWxsWWVhclwiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJ1dGNtb250aFwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRVVENNb250aFwiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJ1dGNob3Vyc1wiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRVVENIb3Vyc1wiLCBhcmdzLCBEQVRFLCAwKTtcbiAgICAgIH0sXG4gICAgXCJ1dGNtaW51dGVzXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImdldFVUQ01pbnV0ZXNcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuICAgIFwidXRjc2Vjb25kc1wiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRVVENTZWNvbmRzXCIsIGFyZ3MsIERBVEUsIDApO1xuICAgICAgfSxcbiAgICBcInV0Y21pbGxpc2Vjb25kc1wiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJnZXRVVENNaWxsaXNlY29uZHNcIiwgYXJncywgREFURSwgMCk7XG4gICAgICB9LFxuXG4gICAgLy8gc2hhcmVkIHNlcXVlbmNlIGZ1bmN0aW9uc1xuICAgIFwibGVuZ3RoXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImxlbmd0aFwiLCBhcmdzLCBudWxsLCAtMSk7XG4gICAgICB9LFxuICAgIFwiaW5kZXhvZlwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJpbmRleE9mXCIsIGFyZ3MsIG51bGwpO1xuICAgICAgfSxcbiAgICBcImxhc3RpbmRleG9mXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcImxhc3RJbmRleE9mXCIsIGFyZ3MsIG51bGwpO1xuICAgICAgfSxcblxuICAgIC8vIFNUUklORyBmdW5jdGlvbnNcbiAgICBcInBhcnNlRmxvYXRcIjogXCJwYXJzZUZsb2F0XCIsXG4gICAgXCJwYXJzZUludFwiOiBcInBhcnNlSW50XCIsXG4gICAgXCJ1cHBlclwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJ0b1VwcGVyQ2FzZVwiLCBhcmdzLCBTVFJJTkcsIDApO1xuICAgICAgfSxcbiAgICBcImxvd2VyXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGZuY2FsbChcInRvTG93ZXJDYXNlXCIsIGFyZ3MsIFNUUklORywgMCk7XG4gICAgICB9LFxuICAgIFwic2xpY2VcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwic2xpY2VcIiwgYXJncywgU1RSSU5HKTtcbiAgICAgIH0sXG4gICAgXCJzdWJzdHJpbmdcIjogZnVuY3Rpb24oYXJncykge1xuICAgICAgICByZXR1cm4gZm5jYWxsKFwic3Vic3RyaW5nXCIsIGFyZ3MsIFNUUklORyk7XG4gICAgICB9LFxuXG4gICAgLy8gUkVHRVhQIGZ1bmN0aW9uc1xuICAgIFwidGVzdFwiOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHJldHVybiBmbmNhbGwoXCJ0ZXN0XCIsIGFyZ3MsIFJFR0VYUCk7XG4gICAgICB9LFxuICAgIFxuICAgIC8vIENvbnRyb2wgRmxvdyBmdW5jdGlvbnNcbiAgICBcImlmXCI6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDwgMylcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNaXNzaW5nIGFyZ3VtZW50cyB0byBpZiBmdW5jdGlvbi5cIik7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA+IDMpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvbyBtYW55IGFyZ3VtZW50cyB0byBpZiBmdW5jdGlvbi5cIik7XG4gICAgICAgIHZhciBhID0gYXJncy5tYXAoY29kZWdlbik7XG4gICAgICAgIHJldHVybiBhWzBdK1wiP1wiK2FbMV0rXCI6XCIrYVsyXTtcbiAgICAgIH1cbiAgfTtcbn07IiwidmFyIHBhcnNlciA9IHJlcXVpcmUoJy4vcGFyc2VyJyksXG4gICAgY29kZWdlbiA9IHJlcXVpcmUoJy4vY29kZWdlbicpO1xuICAgIFxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHBhcnNlOiBmdW5jdGlvbihpbnB1dCwgb3B0KSB7IHJldHVybiBwYXJzZXIucGFyc2UoXCIoXCIraW5wdXQrXCIpXCIsIG9wdCk7IH0sXG4gIGNvZGU6IGZ1bmN0aW9uKG9wdCkgeyByZXR1cm4gY29kZWdlbihvcHQpOyB9XG59O1xuIiwiLypcbiAgVGhlIGZvbGxvd2luZyBleHByZXNzaW9uIHBhcnNlciBpcyBiYXNlZCBvbiBFc3ByaW1hIChodHRwOi8vZXNwcmltYS5vcmcvKS5cbiAgT3JpZ2luYWwgaGVhZGVyIGNvbW1lbnQgYW5kIGxpY2Vuc2UgZm9yIEVzcHJpbWEgaXMgaW5jbHVkZWQgaGVyZTpcblxuICBDb3B5cmlnaHQgKEMpIDIwMTMgQXJpeWEgSGlkYXlhdCA8YXJpeWEuaGlkYXlhdEBnbWFpbC5jb20+XG4gIENvcHlyaWdodCAoQykgMjAxMyBUaGFkZGVlIFR5bCA8dGhhZGRlZS50eWxAZ21haWwuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTMgTWF0aGlhcyBCeW5lbnMgPG1hdGhpYXNAcWl3aS5iZT5cbiAgQ29weXJpZ2h0IChDKSAyMDEyIEFyaXlhIEhpZGF5YXQgPGFyaXlhLmhpZGF5YXRAZ21haWwuY29tPlxuICBDb3B5cmlnaHQgKEMpIDIwMTIgTWF0aGlhcyBCeW5lbnMgPG1hdGhpYXNAcWl3aS5iZT5cbiAgQ29weXJpZ2h0IChDKSAyMDEyIEpvb3N0LVdpbSBCb2VrZXN0ZWlqbiA8am9vc3Qtd2ltQGJvZWtlc3RlaWpuLm5sPlxuICBDb3B5cmlnaHQgKEMpIDIwMTIgS3JpcyBLb3dhbCA8a3Jpcy5rb3dhbEBjaXhhci5jb20+XG4gIENvcHlyaWdodCAoQykgMjAxMiBZdXN1a2UgU3V6dWtpIDx1dGF0YW5lLnRlYUBnbWFpbC5jb20+XG4gIENvcHlyaWdodCAoQykgMjAxMiBBcnBhZCBCb3Jzb3MgPGFycGFkLmJvcnNvc0Bnb29nbGVtYWlsLmNvbT5cbiAgQ29weXJpZ2h0IChDKSAyMDExIEFyaXlhIEhpZGF5YXQgPGFyaXlhLmhpZGF5YXRAZ21haWwuY29tPlxuXG4gIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcblxuICAgICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAgICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0XG4gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlXG4gICAgICBkb2N1bWVudGF0aW9uIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuXG4gIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiXG4gIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEVcbiAgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0VcbiAgQVJFIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIDxDT1BZUklHSFQgSE9MREVSPiBCRSBMSUFCTEUgRk9SIEFOWVxuICBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFU1xuICAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7XG4gIExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORFxuICBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVFxuICAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0ZcbiAgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiovXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBUb2tlbixcbiAgICAgIFRva2VuTmFtZSxcbiAgICAgIFN5bnRheCxcbiAgICAgIFByb3BlcnR5S2luZCxcbiAgICAgIE1lc3NhZ2VzLFxuICAgICAgUmVnZXgsXG4gICAgICBzb3VyY2UsXG4gICAgICBzdHJpY3QsXG4gICAgICBpbmRleCxcbiAgICAgIGxpbmVOdW1iZXIsXG4gICAgICBsaW5lU3RhcnQsXG4gICAgICBsZW5ndGgsXG4gICAgICBsb29rYWhlYWQsXG4gICAgICBzdGF0ZSxcbiAgICAgIGV4dHJhO1xuXG4gIFRva2VuID0ge1xuICAgICAgQm9vbGVhbkxpdGVyYWw6IDEsXG4gICAgICBFT0Y6IDIsXG4gICAgICBJZGVudGlmaWVyOiAzLFxuICAgICAgS2V5d29yZDogNCxcbiAgICAgIE51bGxMaXRlcmFsOiA1LFxuICAgICAgTnVtZXJpY0xpdGVyYWw6IDYsXG4gICAgICBQdW5jdHVhdG9yOiA3LFxuICAgICAgU3RyaW5nTGl0ZXJhbDogOCxcbiAgICAgIFJlZ3VsYXJFeHByZXNzaW9uOiA5XG4gIH07XG5cbiAgVG9rZW5OYW1lID0ge307XG4gIFRva2VuTmFtZVtUb2tlbi5Cb29sZWFuTGl0ZXJhbF0gPSAnQm9vbGVhbic7XG4gIFRva2VuTmFtZVtUb2tlbi5FT0ZdID0gJzxlbmQ+JztcbiAgVG9rZW5OYW1lW1Rva2VuLklkZW50aWZpZXJdID0gJ0lkZW50aWZpZXInO1xuICBUb2tlbk5hbWVbVG9rZW4uS2V5d29yZF0gPSAnS2V5d29yZCc7XG4gIFRva2VuTmFtZVtUb2tlbi5OdWxsTGl0ZXJhbF0gPSAnTnVsbCc7XG4gIFRva2VuTmFtZVtUb2tlbi5OdW1lcmljTGl0ZXJhbF0gPSAnTnVtZXJpYyc7XG4gIFRva2VuTmFtZVtUb2tlbi5QdW5jdHVhdG9yXSA9ICdQdW5jdHVhdG9yJztcbiAgVG9rZW5OYW1lW1Rva2VuLlN0cmluZ0xpdGVyYWxdID0gJ1N0cmluZyc7XG4gIFRva2VuTmFtZVtUb2tlbi5SZWd1bGFyRXhwcmVzc2lvbl0gPSAnUmVndWxhckV4cHJlc3Npb24nO1xuXG4gIFN5bnRheCA9IHtcbiAgICAgIEFzc2lnbm1lbnRFeHByZXNzaW9uOiAnQXNzaWdubWVudEV4cHJlc3Npb24nLFxuICAgICAgQXJyYXlFeHByZXNzaW9uOiAnQXJyYXlFeHByZXNzaW9uJyxcbiAgICAgIEJpbmFyeUV4cHJlc3Npb246ICdCaW5hcnlFeHByZXNzaW9uJyxcbiAgICAgIENhbGxFeHByZXNzaW9uOiAnQ2FsbEV4cHJlc3Npb24nLFxuICAgICAgQ29uZGl0aW9uYWxFeHByZXNzaW9uOiAnQ29uZGl0aW9uYWxFeHByZXNzaW9uJyxcbiAgICAgIEV4cHJlc3Npb25TdGF0ZW1lbnQ6ICdFeHByZXNzaW9uU3RhdGVtZW50JyxcbiAgICAgIElkZW50aWZpZXI6ICdJZGVudGlmaWVyJyxcbiAgICAgIExpdGVyYWw6ICdMaXRlcmFsJyxcbiAgICAgIExvZ2ljYWxFeHByZXNzaW9uOiAnTG9naWNhbEV4cHJlc3Npb24nLFxuICAgICAgTWVtYmVyRXhwcmVzc2lvbjogJ01lbWJlckV4cHJlc3Npb24nLFxuICAgICAgT2JqZWN0RXhwcmVzc2lvbjogJ09iamVjdEV4cHJlc3Npb24nLFxuICAgICAgUHJvZ3JhbTogJ1Byb2dyYW0nLFxuICAgICAgUHJvcGVydHk6ICdQcm9wZXJ0eScsXG4gICAgICBVbmFyeUV4cHJlc3Npb246ICdVbmFyeUV4cHJlc3Npb24nLFxuICAgICAgVXBkYXRlRXhwcmVzc2lvbjogJ1VwZGF0ZUV4cHJlc3Npb24nXG4gIH07XG5cbiAgUHJvcGVydHlLaW5kID0ge1xuICAgICAgRGF0YTogMSxcbiAgICAgIEdldDogMixcbiAgICAgIFNldDogNFxuICB9O1xuXG4gIC8vIEVycm9yIG1lc3NhZ2VzIHNob3VsZCBiZSBpZGVudGljYWwgdG8gVjguXG4gIE1lc3NhZ2VzID0ge1xuICAgICAgVW5leHBlY3RlZFRva2VuOiAgJ1VuZXhwZWN0ZWQgdG9rZW4gJTAnLFxuICAgICAgVW5leHBlY3RlZE51bWJlcjogICdVbmV4cGVjdGVkIG51bWJlcicsXG4gICAgICBVbmV4cGVjdGVkU3RyaW5nOiAgJ1VuZXhwZWN0ZWQgc3RyaW5nJyxcbiAgICAgIFVuZXhwZWN0ZWRJZGVudGlmaWVyOiAgJ1VuZXhwZWN0ZWQgaWRlbnRpZmllcicsXG4gICAgICBVbmV4cGVjdGVkUmVzZXJ2ZWQ6ICAnVW5leHBlY3RlZCByZXNlcnZlZCB3b3JkJyxcbiAgICAgIFVuZXhwZWN0ZWRFT1M6ICAnVW5leHBlY3RlZCBlbmQgb2YgaW5wdXQnLFxuICAgICAgTmV3bGluZUFmdGVyVGhyb3c6ICAnSWxsZWdhbCBuZXdsaW5lIGFmdGVyIHRocm93JyxcbiAgICAgIEludmFsaWRSZWdFeHA6ICdJbnZhbGlkIHJlZ3VsYXIgZXhwcmVzc2lvbicsXG4gICAgICBVbnRlcm1pbmF0ZWRSZWdFeHA6ICAnSW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb246IG1pc3NpbmcgLycsXG4gICAgICBJbnZhbGlkTEhTSW5Bc3NpZ25tZW50OiAgJ0ludmFsaWQgbGVmdC1oYW5kIHNpZGUgaW4gYXNzaWdubWVudCcsXG4gICAgICBJbnZhbGlkTEhTSW5Gb3JJbjogICdJbnZhbGlkIGxlZnQtaGFuZCBzaWRlIGluIGZvci1pbicsXG4gICAgICBNdWx0aXBsZURlZmF1bHRzSW5Td2l0Y2g6ICdNb3JlIHRoYW4gb25lIGRlZmF1bHQgY2xhdXNlIGluIHN3aXRjaCBzdGF0ZW1lbnQnLFxuICAgICAgTm9DYXRjaE9yRmluYWxseTogICdNaXNzaW5nIGNhdGNoIG9yIGZpbmFsbHkgYWZ0ZXIgdHJ5JyxcbiAgICAgIFVua25vd25MYWJlbDogJ1VuZGVmaW5lZCBsYWJlbCBcXCclMFxcJycsXG4gICAgICBSZWRlY2xhcmF0aW9uOiAnJTAgXFwnJTFcXCcgaGFzIGFscmVhZHkgYmVlbiBkZWNsYXJlZCcsXG4gICAgICBJbGxlZ2FsQ29udGludWU6ICdJbGxlZ2FsIGNvbnRpbnVlIHN0YXRlbWVudCcsXG4gICAgICBJbGxlZ2FsQnJlYWs6ICdJbGxlZ2FsIGJyZWFrIHN0YXRlbWVudCcsXG4gICAgICBJbGxlZ2FsUmV0dXJuOiAnSWxsZWdhbCByZXR1cm4gc3RhdGVtZW50JyxcbiAgICAgIFN0cmljdE1vZGVXaXRoOiAgJ1N0cmljdCBtb2RlIGNvZGUgbWF5IG5vdCBpbmNsdWRlIGEgd2l0aCBzdGF0ZW1lbnQnLFxuICAgICAgU3RyaWN0Q2F0Y2hWYXJpYWJsZTogICdDYXRjaCB2YXJpYWJsZSBtYXkgbm90IGJlIGV2YWwgb3IgYXJndW1lbnRzIGluIHN0cmljdCBtb2RlJyxcbiAgICAgIFN0cmljdFZhck5hbWU6ICAnVmFyaWFibGUgbmFtZSBtYXkgbm90IGJlIGV2YWwgb3IgYXJndW1lbnRzIGluIHN0cmljdCBtb2RlJyxcbiAgICAgIFN0cmljdFBhcmFtTmFtZTogICdQYXJhbWV0ZXIgbmFtZSBldmFsIG9yIGFyZ3VtZW50cyBpcyBub3QgYWxsb3dlZCBpbiBzdHJpY3QgbW9kZScsXG4gICAgICBTdHJpY3RQYXJhbUR1cGU6ICdTdHJpY3QgbW9kZSBmdW5jdGlvbiBtYXkgbm90IGhhdmUgZHVwbGljYXRlIHBhcmFtZXRlciBuYW1lcycsXG4gICAgICBTdHJpY3RGdW5jdGlvbk5hbWU6ICAnRnVuY3Rpb24gbmFtZSBtYXkgbm90IGJlIGV2YWwgb3IgYXJndW1lbnRzIGluIHN0cmljdCBtb2RlJyxcbiAgICAgIFN0cmljdE9jdGFsTGl0ZXJhbDogICdPY3RhbCBsaXRlcmFscyBhcmUgbm90IGFsbG93ZWQgaW4gc3RyaWN0IG1vZGUuJyxcbiAgICAgIFN0cmljdERlbGV0ZTogICdEZWxldGUgb2YgYW4gdW5xdWFsaWZpZWQgaWRlbnRpZmllciBpbiBzdHJpY3QgbW9kZS4nLFxuICAgICAgU3RyaWN0RHVwbGljYXRlUHJvcGVydHk6ICAnRHVwbGljYXRlIGRhdGEgcHJvcGVydHkgaW4gb2JqZWN0IGxpdGVyYWwgbm90IGFsbG93ZWQgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgQWNjZXNzb3JEYXRhUHJvcGVydHk6ICAnT2JqZWN0IGxpdGVyYWwgbWF5IG5vdCBoYXZlIGRhdGEgYW5kIGFjY2Vzc29yIHByb3BlcnR5IHdpdGggdGhlIHNhbWUgbmFtZScsXG4gICAgICBBY2Nlc3NvckdldFNldDogICdPYmplY3QgbGl0ZXJhbCBtYXkgbm90IGhhdmUgbXVsdGlwbGUgZ2V0L3NldCBhY2Nlc3NvcnMgd2l0aCB0aGUgc2FtZSBuYW1lJyxcbiAgICAgIFN0cmljdExIU0Fzc2lnbm1lbnQ6ICAnQXNzaWdubWVudCB0byBldmFsIG9yIGFyZ3VtZW50cyBpcyBub3QgYWxsb3dlZCBpbiBzdHJpY3QgbW9kZScsXG4gICAgICBTdHJpY3RMSFNQb3N0Zml4OiAgJ1Bvc3RmaXggaW5jcmVtZW50L2RlY3JlbWVudCBtYXkgbm90IGhhdmUgZXZhbCBvciBhcmd1bWVudHMgb3BlcmFuZCBpbiBzdHJpY3QgbW9kZScsXG4gICAgICBTdHJpY3RMSFNQcmVmaXg6ICAnUHJlZml4IGluY3JlbWVudC9kZWNyZW1lbnQgbWF5IG5vdCBoYXZlIGV2YWwgb3IgYXJndW1lbnRzIG9wZXJhbmQgaW4gc3RyaWN0IG1vZGUnLFxuICAgICAgU3RyaWN0UmVzZXJ2ZWRXb3JkOiAgJ1VzZSBvZiBmdXR1cmUgcmVzZXJ2ZWQgd29yZCBpbiBzdHJpY3QgbW9kZSdcbiAgfTtcblxuICAvLyBTZWUgYWxzbyB0b29scy9nZW5lcmF0ZS11bmljb2RlLXJlZ2V4LnB5LlxuICBSZWdleCA9IHtcbiAgICAgIE5vbkFzY2lpSWRlbnRpZmllclN0YXJ0OiBuZXcgUmVnRXhwKCdbXFx4QUFcXHhCNVxceEJBXFx4QzAtXFx4RDZcXHhEOC1cXHhGNlxceEY4LVxcdTAyQzFcXHUwMkM2LVxcdTAyRDFcXHUwMkUwLVxcdTAyRTRcXHUwMkVDXFx1MDJFRVxcdTAzNzAtXFx1MDM3NFxcdTAzNzZcXHUwMzc3XFx1MDM3QS1cXHUwMzdEXFx1MDM3RlxcdTAzODZcXHUwMzg4LVxcdTAzOEFcXHUwMzhDXFx1MDM4RS1cXHUwM0ExXFx1MDNBMy1cXHUwM0Y1XFx1MDNGNy1cXHUwNDgxXFx1MDQ4QS1cXHUwNTJGXFx1MDUzMS1cXHUwNTU2XFx1MDU1OVxcdTA1NjEtXFx1MDU4N1xcdTA1RDAtXFx1MDVFQVxcdTA1RjAtXFx1MDVGMlxcdTA2MjAtXFx1MDY0QVxcdTA2NkVcXHUwNjZGXFx1MDY3MS1cXHUwNkQzXFx1MDZENVxcdTA2RTVcXHUwNkU2XFx1MDZFRVxcdTA2RUZcXHUwNkZBLVxcdTA2RkNcXHUwNkZGXFx1MDcxMFxcdTA3MTItXFx1MDcyRlxcdTA3NEQtXFx1MDdBNVxcdTA3QjFcXHUwN0NBLVxcdTA3RUFcXHUwN0Y0XFx1MDdGNVxcdTA3RkFcXHUwODAwLVxcdTA4MTVcXHUwODFBXFx1MDgyNFxcdTA4MjhcXHUwODQwLVxcdTA4NThcXHUwOEEwLVxcdTA4QjJcXHUwOTA0LVxcdTA5MzlcXHUwOTNEXFx1MDk1MFxcdTA5NTgtXFx1MDk2MVxcdTA5NzEtXFx1MDk4MFxcdTA5ODUtXFx1MDk4Q1xcdTA5OEZcXHUwOTkwXFx1MDk5My1cXHUwOUE4XFx1MDlBQS1cXHUwOUIwXFx1MDlCMlxcdTA5QjYtXFx1MDlCOVxcdTA5QkRcXHUwOUNFXFx1MDlEQ1xcdTA5RERcXHUwOURGLVxcdTA5RTFcXHUwOUYwXFx1MDlGMVxcdTBBMDUtXFx1MEEwQVxcdTBBMEZcXHUwQTEwXFx1MEExMy1cXHUwQTI4XFx1MEEyQS1cXHUwQTMwXFx1MEEzMlxcdTBBMzNcXHUwQTM1XFx1MEEzNlxcdTBBMzhcXHUwQTM5XFx1MEE1OS1cXHUwQTVDXFx1MEE1RVxcdTBBNzItXFx1MEE3NFxcdTBBODUtXFx1MEE4RFxcdTBBOEYtXFx1MEE5MVxcdTBBOTMtXFx1MEFBOFxcdTBBQUEtXFx1MEFCMFxcdTBBQjJcXHUwQUIzXFx1MEFCNS1cXHUwQUI5XFx1MEFCRFxcdTBBRDBcXHUwQUUwXFx1MEFFMVxcdTBCMDUtXFx1MEIwQ1xcdTBCMEZcXHUwQjEwXFx1MEIxMy1cXHUwQjI4XFx1MEIyQS1cXHUwQjMwXFx1MEIzMlxcdTBCMzNcXHUwQjM1LVxcdTBCMzlcXHUwQjNEXFx1MEI1Q1xcdTBCNURcXHUwQjVGLVxcdTBCNjFcXHUwQjcxXFx1MEI4M1xcdTBCODUtXFx1MEI4QVxcdTBCOEUtXFx1MEI5MFxcdTBCOTItXFx1MEI5NVxcdTBCOTlcXHUwQjlBXFx1MEI5Q1xcdTBCOUVcXHUwQjlGXFx1MEJBM1xcdTBCQTRcXHUwQkE4LVxcdTBCQUFcXHUwQkFFLVxcdTBCQjlcXHUwQkQwXFx1MEMwNS1cXHUwQzBDXFx1MEMwRS1cXHUwQzEwXFx1MEMxMi1cXHUwQzI4XFx1MEMyQS1cXHUwQzM5XFx1MEMzRFxcdTBDNThcXHUwQzU5XFx1MEM2MFxcdTBDNjFcXHUwQzg1LVxcdTBDOENcXHUwQzhFLVxcdTBDOTBcXHUwQzkyLVxcdTBDQThcXHUwQ0FBLVxcdTBDQjNcXHUwQ0I1LVxcdTBDQjlcXHUwQ0JEXFx1MENERVxcdTBDRTBcXHUwQ0UxXFx1MENGMVxcdTBDRjJcXHUwRDA1LVxcdTBEMENcXHUwRDBFLVxcdTBEMTBcXHUwRDEyLVxcdTBEM0FcXHUwRDNEXFx1MEQ0RVxcdTBENjBcXHUwRDYxXFx1MEQ3QS1cXHUwRDdGXFx1MEQ4NS1cXHUwRDk2XFx1MEQ5QS1cXHUwREIxXFx1MERCMy1cXHUwREJCXFx1MERCRFxcdTBEQzAtXFx1MERDNlxcdTBFMDEtXFx1MEUzMFxcdTBFMzJcXHUwRTMzXFx1MEU0MC1cXHUwRTQ2XFx1MEU4MVxcdTBFODJcXHUwRTg0XFx1MEU4N1xcdTBFODhcXHUwRThBXFx1MEU4RFxcdTBFOTQtXFx1MEU5N1xcdTBFOTktXFx1MEU5RlxcdTBFQTEtXFx1MEVBM1xcdTBFQTVcXHUwRUE3XFx1MEVBQVxcdTBFQUJcXHUwRUFELVxcdTBFQjBcXHUwRUIyXFx1MEVCM1xcdTBFQkRcXHUwRUMwLVxcdTBFQzRcXHUwRUM2XFx1MEVEQy1cXHUwRURGXFx1MEYwMFxcdTBGNDAtXFx1MEY0N1xcdTBGNDktXFx1MEY2Q1xcdTBGODgtXFx1MEY4Q1xcdTEwMDAtXFx1MTAyQVxcdTEwM0ZcXHUxMDUwLVxcdTEwNTVcXHUxMDVBLVxcdTEwNURcXHUxMDYxXFx1MTA2NVxcdTEwNjZcXHUxMDZFLVxcdTEwNzBcXHUxMDc1LVxcdTEwODFcXHUxMDhFXFx1MTBBMC1cXHUxMEM1XFx1MTBDN1xcdTEwQ0RcXHUxMEQwLVxcdTEwRkFcXHUxMEZDLVxcdTEyNDhcXHUxMjRBLVxcdTEyNERcXHUxMjUwLVxcdTEyNTZcXHUxMjU4XFx1MTI1QS1cXHUxMjVEXFx1MTI2MC1cXHUxMjg4XFx1MTI4QS1cXHUxMjhEXFx1MTI5MC1cXHUxMkIwXFx1MTJCMi1cXHUxMkI1XFx1MTJCOC1cXHUxMkJFXFx1MTJDMFxcdTEyQzItXFx1MTJDNVxcdTEyQzgtXFx1MTJENlxcdTEyRDgtXFx1MTMxMFxcdTEzMTItXFx1MTMxNVxcdTEzMTgtXFx1MTM1QVxcdTEzODAtXFx1MTM4RlxcdTEzQTAtXFx1MTNGNFxcdTE0MDEtXFx1MTY2Q1xcdTE2NkYtXFx1MTY3RlxcdTE2ODEtXFx1MTY5QVxcdTE2QTAtXFx1MTZFQVxcdTE2RUUtXFx1MTZGOFxcdTE3MDAtXFx1MTcwQ1xcdTE3MEUtXFx1MTcxMVxcdTE3MjAtXFx1MTczMVxcdTE3NDAtXFx1MTc1MVxcdTE3NjAtXFx1MTc2Q1xcdTE3NkUtXFx1MTc3MFxcdTE3ODAtXFx1MTdCM1xcdTE3RDdcXHUxN0RDXFx1MTgyMC1cXHUxODc3XFx1MTg4MC1cXHUxOEE4XFx1MThBQVxcdTE4QjAtXFx1MThGNVxcdTE5MDAtXFx1MTkxRVxcdTE5NTAtXFx1MTk2RFxcdTE5NzAtXFx1MTk3NFxcdTE5ODAtXFx1MTlBQlxcdTE5QzEtXFx1MTlDN1xcdTFBMDAtXFx1MUExNlxcdTFBMjAtXFx1MUE1NFxcdTFBQTdcXHUxQjA1LVxcdTFCMzNcXHUxQjQ1LVxcdTFCNEJcXHUxQjgzLVxcdTFCQTBcXHUxQkFFXFx1MUJBRlxcdTFCQkEtXFx1MUJFNVxcdTFDMDAtXFx1MUMyM1xcdTFDNEQtXFx1MUM0RlxcdTFDNUEtXFx1MUM3RFxcdTFDRTktXFx1MUNFQ1xcdTFDRUUtXFx1MUNGMVxcdTFDRjVcXHUxQ0Y2XFx1MUQwMC1cXHUxREJGXFx1MUUwMC1cXHUxRjE1XFx1MUYxOC1cXHUxRjFEXFx1MUYyMC1cXHUxRjQ1XFx1MUY0OC1cXHUxRjREXFx1MUY1MC1cXHUxRjU3XFx1MUY1OVxcdTFGNUJcXHUxRjVEXFx1MUY1Ri1cXHUxRjdEXFx1MUY4MC1cXHUxRkI0XFx1MUZCNi1cXHUxRkJDXFx1MUZCRVxcdTFGQzItXFx1MUZDNFxcdTFGQzYtXFx1MUZDQ1xcdTFGRDAtXFx1MUZEM1xcdTFGRDYtXFx1MUZEQlxcdTFGRTAtXFx1MUZFQ1xcdTFGRjItXFx1MUZGNFxcdTFGRjYtXFx1MUZGQ1xcdTIwNzFcXHUyMDdGXFx1MjA5MC1cXHUyMDlDXFx1MjEwMlxcdTIxMDdcXHUyMTBBLVxcdTIxMTNcXHUyMTE1XFx1MjExOS1cXHUyMTFEXFx1MjEyNFxcdTIxMjZcXHUyMTI4XFx1MjEyQS1cXHUyMTJEXFx1MjEyRi1cXHUyMTM5XFx1MjEzQy1cXHUyMTNGXFx1MjE0NS1cXHUyMTQ5XFx1MjE0RVxcdTIxNjAtXFx1MjE4OFxcdTJDMDAtXFx1MkMyRVxcdTJDMzAtXFx1MkM1RVxcdTJDNjAtXFx1MkNFNFxcdTJDRUItXFx1MkNFRVxcdTJDRjJcXHUyQ0YzXFx1MkQwMC1cXHUyRDI1XFx1MkQyN1xcdTJEMkRcXHUyRDMwLVxcdTJENjdcXHUyRDZGXFx1MkQ4MC1cXHUyRDk2XFx1MkRBMC1cXHUyREE2XFx1MkRBOC1cXHUyREFFXFx1MkRCMC1cXHUyREI2XFx1MkRCOC1cXHUyREJFXFx1MkRDMC1cXHUyREM2XFx1MkRDOC1cXHUyRENFXFx1MkREMC1cXHUyREQ2XFx1MkREOC1cXHUyRERFXFx1MkUyRlxcdTMwMDUtXFx1MzAwN1xcdTMwMjEtXFx1MzAyOVxcdTMwMzEtXFx1MzAzNVxcdTMwMzgtXFx1MzAzQ1xcdTMwNDEtXFx1MzA5NlxcdTMwOUQtXFx1MzA5RlxcdTMwQTEtXFx1MzBGQVxcdTMwRkMtXFx1MzBGRlxcdTMxMDUtXFx1MzEyRFxcdTMxMzEtXFx1MzE4RVxcdTMxQTAtXFx1MzFCQVxcdTMxRjAtXFx1MzFGRlxcdTM0MDAtXFx1NERCNVxcdTRFMDAtXFx1OUZDQ1xcdUEwMDAtXFx1QTQ4Q1xcdUE0RDAtXFx1QTRGRFxcdUE1MDAtXFx1QTYwQ1xcdUE2MTAtXFx1QTYxRlxcdUE2MkFcXHVBNjJCXFx1QTY0MC1cXHVBNjZFXFx1QTY3Ri1cXHVBNjlEXFx1QTZBMC1cXHVBNkVGXFx1QTcxNy1cXHVBNzFGXFx1QTcyMi1cXHVBNzg4XFx1QTc4Qi1cXHVBNzhFXFx1QTc5MC1cXHVBN0FEXFx1QTdCMFxcdUE3QjFcXHVBN0Y3LVxcdUE4MDFcXHVBODAzLVxcdUE4MDVcXHVBODA3LVxcdUE4MEFcXHVBODBDLVxcdUE4MjJcXHVBODQwLVxcdUE4NzNcXHVBODgyLVxcdUE4QjNcXHVBOEYyLVxcdUE4RjdcXHVBOEZCXFx1QTkwQS1cXHVBOTI1XFx1QTkzMC1cXHVBOTQ2XFx1QTk2MC1cXHVBOTdDXFx1QTk4NC1cXHVBOUIyXFx1QTlDRlxcdUE5RTAtXFx1QTlFNFxcdUE5RTYtXFx1QTlFRlxcdUE5RkEtXFx1QTlGRVxcdUFBMDAtXFx1QUEyOFxcdUFBNDAtXFx1QUE0MlxcdUFBNDQtXFx1QUE0QlxcdUFBNjAtXFx1QUE3NlxcdUFBN0FcXHVBQTdFLVxcdUFBQUZcXHVBQUIxXFx1QUFCNVxcdUFBQjZcXHVBQUI5LVxcdUFBQkRcXHVBQUMwXFx1QUFDMlxcdUFBREItXFx1QUFERFxcdUFBRTAtXFx1QUFFQVxcdUFBRjItXFx1QUFGNFxcdUFCMDEtXFx1QUIwNlxcdUFCMDktXFx1QUIwRVxcdUFCMTEtXFx1QUIxNlxcdUFCMjAtXFx1QUIyNlxcdUFCMjgtXFx1QUIyRVxcdUFCMzAtXFx1QUI1QVxcdUFCNUMtXFx1QUI1RlxcdUFCNjRcXHVBQjY1XFx1QUJDMC1cXHVBQkUyXFx1QUMwMC1cXHVEN0EzXFx1RDdCMC1cXHVEN0M2XFx1RDdDQi1cXHVEN0ZCXFx1RjkwMC1cXHVGQTZEXFx1RkE3MC1cXHVGQUQ5XFx1RkIwMC1cXHVGQjA2XFx1RkIxMy1cXHVGQjE3XFx1RkIxRFxcdUZCMUYtXFx1RkIyOFxcdUZCMkEtXFx1RkIzNlxcdUZCMzgtXFx1RkIzQ1xcdUZCM0VcXHVGQjQwXFx1RkI0MVxcdUZCNDNcXHVGQjQ0XFx1RkI0Ni1cXHVGQkIxXFx1RkJEMy1cXHVGRDNEXFx1RkQ1MC1cXHVGRDhGXFx1RkQ5Mi1cXHVGREM3XFx1RkRGMC1cXHVGREZCXFx1RkU3MC1cXHVGRTc0XFx1RkU3Ni1cXHVGRUZDXFx1RkYyMS1cXHVGRjNBXFx1RkY0MS1cXHVGRjVBXFx1RkY2Ni1cXHVGRkJFXFx1RkZDMi1cXHVGRkM3XFx1RkZDQS1cXHVGRkNGXFx1RkZEMi1cXHVGRkQ3XFx1RkZEQS1cXHVGRkRDXScpLFxuICAgICAgTm9uQXNjaWlJZGVudGlmaWVyUGFydDogbmV3IFJlZ0V4cCgnW1xceEFBXFx4QjVcXHhCQVxceEMwLVxceEQ2XFx4RDgtXFx4RjZcXHhGOC1cXHUwMkMxXFx1MDJDNi1cXHUwMkQxXFx1MDJFMC1cXHUwMkU0XFx1MDJFQ1xcdTAyRUVcXHUwMzAwLVxcdTAzNzRcXHUwMzc2XFx1MDM3N1xcdTAzN0EtXFx1MDM3RFxcdTAzN0ZcXHUwMzg2XFx1MDM4OC1cXHUwMzhBXFx1MDM4Q1xcdTAzOEUtXFx1MDNBMVxcdTAzQTMtXFx1MDNGNVxcdTAzRjctXFx1MDQ4MVxcdTA0ODMtXFx1MDQ4N1xcdTA0OEEtXFx1MDUyRlxcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYxLVxcdTA1ODdcXHUwNTkxLVxcdTA1QkRcXHUwNUJGXFx1MDVDMVxcdTA1QzJcXHUwNUM0XFx1MDVDNVxcdTA1QzdcXHUwNUQwLVxcdTA1RUFcXHUwNUYwLVxcdTA1RjJcXHUwNjEwLVxcdTA2MUFcXHUwNjIwLVxcdTA2NjlcXHUwNjZFLVxcdTA2RDNcXHUwNkQ1LVxcdTA2RENcXHUwNkRGLVxcdTA2RThcXHUwNkVBLVxcdTA2RkNcXHUwNkZGXFx1MDcxMC1cXHUwNzRBXFx1MDc0RC1cXHUwN0IxXFx1MDdDMC1cXHUwN0Y1XFx1MDdGQVxcdTA4MDAtXFx1MDgyRFxcdTA4NDAtXFx1MDg1QlxcdTA4QTAtXFx1MDhCMlxcdTA4RTQtXFx1MDk2M1xcdTA5NjYtXFx1MDk2RlxcdTA5NzEtXFx1MDk4M1xcdTA5ODUtXFx1MDk4Q1xcdTA5OEZcXHUwOTkwXFx1MDk5My1cXHUwOUE4XFx1MDlBQS1cXHUwOUIwXFx1MDlCMlxcdTA5QjYtXFx1MDlCOVxcdTA5QkMtXFx1MDlDNFxcdTA5QzdcXHUwOUM4XFx1MDlDQi1cXHUwOUNFXFx1MDlEN1xcdTA5RENcXHUwOUREXFx1MDlERi1cXHUwOUUzXFx1MDlFNi1cXHUwOUYxXFx1MEEwMS1cXHUwQTAzXFx1MEEwNS1cXHUwQTBBXFx1MEEwRlxcdTBBMTBcXHUwQTEzLVxcdTBBMjhcXHUwQTJBLVxcdTBBMzBcXHUwQTMyXFx1MEEzM1xcdTBBMzVcXHUwQTM2XFx1MEEzOFxcdTBBMzlcXHUwQTNDXFx1MEEzRS1cXHUwQTQyXFx1MEE0N1xcdTBBNDhcXHUwQTRCLVxcdTBBNERcXHUwQTUxXFx1MEE1OS1cXHUwQTVDXFx1MEE1RVxcdTBBNjYtXFx1MEE3NVxcdTBBODEtXFx1MEE4M1xcdTBBODUtXFx1MEE4RFxcdTBBOEYtXFx1MEE5MVxcdTBBOTMtXFx1MEFBOFxcdTBBQUEtXFx1MEFCMFxcdTBBQjJcXHUwQUIzXFx1MEFCNS1cXHUwQUI5XFx1MEFCQy1cXHUwQUM1XFx1MEFDNy1cXHUwQUM5XFx1MEFDQi1cXHUwQUNEXFx1MEFEMFxcdTBBRTAtXFx1MEFFM1xcdTBBRTYtXFx1MEFFRlxcdTBCMDEtXFx1MEIwM1xcdTBCMDUtXFx1MEIwQ1xcdTBCMEZcXHUwQjEwXFx1MEIxMy1cXHUwQjI4XFx1MEIyQS1cXHUwQjMwXFx1MEIzMlxcdTBCMzNcXHUwQjM1LVxcdTBCMzlcXHUwQjNDLVxcdTBCNDRcXHUwQjQ3XFx1MEI0OFxcdTBCNEItXFx1MEI0RFxcdTBCNTZcXHUwQjU3XFx1MEI1Q1xcdTBCNURcXHUwQjVGLVxcdTBCNjNcXHUwQjY2LVxcdTBCNkZcXHUwQjcxXFx1MEI4MlxcdTBCODNcXHUwQjg1LVxcdTBCOEFcXHUwQjhFLVxcdTBCOTBcXHUwQjkyLVxcdTBCOTVcXHUwQjk5XFx1MEI5QVxcdTBCOUNcXHUwQjlFXFx1MEI5RlxcdTBCQTNcXHUwQkE0XFx1MEJBOC1cXHUwQkFBXFx1MEJBRS1cXHUwQkI5XFx1MEJCRS1cXHUwQkMyXFx1MEJDNi1cXHUwQkM4XFx1MEJDQS1cXHUwQkNEXFx1MEJEMFxcdTBCRDdcXHUwQkU2LVxcdTBCRUZcXHUwQzAwLVxcdTBDMDNcXHUwQzA1LVxcdTBDMENcXHUwQzBFLVxcdTBDMTBcXHUwQzEyLVxcdTBDMjhcXHUwQzJBLVxcdTBDMzlcXHUwQzNELVxcdTBDNDRcXHUwQzQ2LVxcdTBDNDhcXHUwQzRBLVxcdTBDNERcXHUwQzU1XFx1MEM1NlxcdTBDNThcXHUwQzU5XFx1MEM2MC1cXHUwQzYzXFx1MEM2Ni1cXHUwQzZGXFx1MEM4MS1cXHUwQzgzXFx1MEM4NS1cXHUwQzhDXFx1MEM4RS1cXHUwQzkwXFx1MEM5Mi1cXHUwQ0E4XFx1MENBQS1cXHUwQ0IzXFx1MENCNS1cXHUwQ0I5XFx1MENCQy1cXHUwQ0M0XFx1MENDNi1cXHUwQ0M4XFx1MENDQS1cXHUwQ0NEXFx1MENENVxcdTBDRDZcXHUwQ0RFXFx1MENFMC1cXHUwQ0UzXFx1MENFNi1cXHUwQ0VGXFx1MENGMVxcdTBDRjJcXHUwRDAxLVxcdTBEMDNcXHUwRDA1LVxcdTBEMENcXHUwRDBFLVxcdTBEMTBcXHUwRDEyLVxcdTBEM0FcXHUwRDNELVxcdTBENDRcXHUwRDQ2LVxcdTBENDhcXHUwRDRBLVxcdTBENEVcXHUwRDU3XFx1MEQ2MC1cXHUwRDYzXFx1MEQ2Ni1cXHUwRDZGXFx1MEQ3QS1cXHUwRDdGXFx1MEQ4MlxcdTBEODNcXHUwRDg1LVxcdTBEOTZcXHUwRDlBLVxcdTBEQjFcXHUwREIzLVxcdTBEQkJcXHUwREJEXFx1MERDMC1cXHUwREM2XFx1MERDQVxcdTBEQ0YtXFx1MERENFxcdTBERDZcXHUwREQ4LVxcdTBEREZcXHUwREU2LVxcdTBERUZcXHUwREYyXFx1MERGM1xcdTBFMDEtXFx1MEUzQVxcdTBFNDAtXFx1MEU0RVxcdTBFNTAtXFx1MEU1OVxcdTBFODFcXHUwRTgyXFx1MEU4NFxcdTBFODdcXHUwRTg4XFx1MEU4QVxcdTBFOERcXHUwRTk0LVxcdTBFOTdcXHUwRTk5LVxcdTBFOUZcXHUwRUExLVxcdTBFQTNcXHUwRUE1XFx1MEVBN1xcdTBFQUFcXHUwRUFCXFx1MEVBRC1cXHUwRUI5XFx1MEVCQi1cXHUwRUJEXFx1MEVDMC1cXHUwRUM0XFx1MEVDNlxcdTBFQzgtXFx1MEVDRFxcdTBFRDAtXFx1MEVEOVxcdTBFREMtXFx1MEVERlxcdTBGMDBcXHUwRjE4XFx1MEYxOVxcdTBGMjAtXFx1MEYyOVxcdTBGMzVcXHUwRjM3XFx1MEYzOVxcdTBGM0UtXFx1MEY0N1xcdTBGNDktXFx1MEY2Q1xcdTBGNzEtXFx1MEY4NFxcdTBGODYtXFx1MEY5N1xcdTBGOTktXFx1MEZCQ1xcdTBGQzZcXHUxMDAwLVxcdTEwNDlcXHUxMDUwLVxcdTEwOURcXHUxMEEwLVxcdTEwQzVcXHUxMEM3XFx1MTBDRFxcdTEwRDAtXFx1MTBGQVxcdTEwRkMtXFx1MTI0OFxcdTEyNEEtXFx1MTI0RFxcdTEyNTAtXFx1MTI1NlxcdTEyNThcXHUxMjVBLVxcdTEyNURcXHUxMjYwLVxcdTEyODhcXHUxMjhBLVxcdTEyOERcXHUxMjkwLVxcdTEyQjBcXHUxMkIyLVxcdTEyQjVcXHUxMkI4LVxcdTEyQkVcXHUxMkMwXFx1MTJDMi1cXHUxMkM1XFx1MTJDOC1cXHUxMkQ2XFx1MTJEOC1cXHUxMzEwXFx1MTMxMi1cXHUxMzE1XFx1MTMxOC1cXHUxMzVBXFx1MTM1RC1cXHUxMzVGXFx1MTM4MC1cXHUxMzhGXFx1MTNBMC1cXHUxM0Y0XFx1MTQwMS1cXHUxNjZDXFx1MTY2Ri1cXHUxNjdGXFx1MTY4MS1cXHUxNjlBXFx1MTZBMC1cXHUxNkVBXFx1MTZFRS1cXHUxNkY4XFx1MTcwMC1cXHUxNzBDXFx1MTcwRS1cXHUxNzE0XFx1MTcyMC1cXHUxNzM0XFx1MTc0MC1cXHUxNzUzXFx1MTc2MC1cXHUxNzZDXFx1MTc2RS1cXHUxNzcwXFx1MTc3MlxcdTE3NzNcXHUxNzgwLVxcdTE3RDNcXHUxN0Q3XFx1MTdEQ1xcdTE3RERcXHUxN0UwLVxcdTE3RTlcXHUxODBCLVxcdTE4MERcXHUxODEwLVxcdTE4MTlcXHUxODIwLVxcdTE4NzdcXHUxODgwLVxcdTE4QUFcXHUxOEIwLVxcdTE4RjVcXHUxOTAwLVxcdTE5MUVcXHUxOTIwLVxcdTE5MkJcXHUxOTMwLVxcdTE5M0JcXHUxOTQ2LVxcdTE5NkRcXHUxOTcwLVxcdTE5NzRcXHUxOTgwLVxcdTE5QUJcXHUxOUIwLVxcdTE5QzlcXHUxOUQwLVxcdTE5RDlcXHUxQTAwLVxcdTFBMUJcXHUxQTIwLVxcdTFBNUVcXHUxQTYwLVxcdTFBN0NcXHUxQTdGLVxcdTFBODlcXHUxQTkwLVxcdTFBOTlcXHUxQUE3XFx1MUFCMC1cXHUxQUJEXFx1MUIwMC1cXHUxQjRCXFx1MUI1MC1cXHUxQjU5XFx1MUI2Qi1cXHUxQjczXFx1MUI4MC1cXHUxQkYzXFx1MUMwMC1cXHUxQzM3XFx1MUM0MC1cXHUxQzQ5XFx1MUM0RC1cXHUxQzdEXFx1MUNEMC1cXHUxQ0QyXFx1MUNENC1cXHUxQ0Y2XFx1MUNGOFxcdTFDRjlcXHUxRDAwLVxcdTFERjVcXHUxREZDLVxcdTFGMTVcXHUxRjE4LVxcdTFGMURcXHUxRjIwLVxcdTFGNDVcXHUxRjQ4LVxcdTFGNERcXHUxRjUwLVxcdTFGNTdcXHUxRjU5XFx1MUY1QlxcdTFGNURcXHUxRjVGLVxcdTFGN0RcXHUxRjgwLVxcdTFGQjRcXHUxRkI2LVxcdTFGQkNcXHUxRkJFXFx1MUZDMi1cXHUxRkM0XFx1MUZDNi1cXHUxRkNDXFx1MUZEMC1cXHUxRkQzXFx1MUZENi1cXHUxRkRCXFx1MUZFMC1cXHUxRkVDXFx1MUZGMi1cXHUxRkY0XFx1MUZGNi1cXHUxRkZDXFx1MjAwQ1xcdTIwMERcXHUyMDNGXFx1MjA0MFxcdTIwNTRcXHUyMDcxXFx1MjA3RlxcdTIwOTAtXFx1MjA5Q1xcdTIwRDAtXFx1MjBEQ1xcdTIwRTFcXHUyMEU1LVxcdTIwRjBcXHUyMTAyXFx1MjEwN1xcdTIxMEEtXFx1MjExM1xcdTIxMTVcXHUyMTE5LVxcdTIxMURcXHUyMTI0XFx1MjEyNlxcdTIxMjhcXHUyMTJBLVxcdTIxMkRcXHUyMTJGLVxcdTIxMzlcXHUyMTNDLVxcdTIxM0ZcXHUyMTQ1LVxcdTIxNDlcXHUyMTRFXFx1MjE2MC1cXHUyMTg4XFx1MkMwMC1cXHUyQzJFXFx1MkMzMC1cXHUyQzVFXFx1MkM2MC1cXHUyQ0U0XFx1MkNFQi1cXHUyQ0YzXFx1MkQwMC1cXHUyRDI1XFx1MkQyN1xcdTJEMkRcXHUyRDMwLVxcdTJENjdcXHUyRDZGXFx1MkQ3Ri1cXHUyRDk2XFx1MkRBMC1cXHUyREE2XFx1MkRBOC1cXHUyREFFXFx1MkRCMC1cXHUyREI2XFx1MkRCOC1cXHUyREJFXFx1MkRDMC1cXHUyREM2XFx1MkRDOC1cXHUyRENFXFx1MkREMC1cXHUyREQ2XFx1MkREOC1cXHUyRERFXFx1MkRFMC1cXHUyREZGXFx1MkUyRlxcdTMwMDUtXFx1MzAwN1xcdTMwMjEtXFx1MzAyRlxcdTMwMzEtXFx1MzAzNVxcdTMwMzgtXFx1MzAzQ1xcdTMwNDEtXFx1MzA5NlxcdTMwOTlcXHUzMDlBXFx1MzA5RC1cXHUzMDlGXFx1MzBBMS1cXHUzMEZBXFx1MzBGQy1cXHUzMEZGXFx1MzEwNS1cXHUzMTJEXFx1MzEzMS1cXHUzMThFXFx1MzFBMC1cXHUzMUJBXFx1MzFGMC1cXHUzMUZGXFx1MzQwMC1cXHU0REI1XFx1NEUwMC1cXHU5RkNDXFx1QTAwMC1cXHVBNDhDXFx1QTREMC1cXHVBNEZEXFx1QTUwMC1cXHVBNjBDXFx1QTYxMC1cXHVBNjJCXFx1QTY0MC1cXHVBNjZGXFx1QTY3NC1cXHVBNjdEXFx1QTY3Ri1cXHVBNjlEXFx1QTY5Ri1cXHVBNkYxXFx1QTcxNy1cXHVBNzFGXFx1QTcyMi1cXHVBNzg4XFx1QTc4Qi1cXHVBNzhFXFx1QTc5MC1cXHVBN0FEXFx1QTdCMFxcdUE3QjFcXHVBN0Y3LVxcdUE4MjdcXHVBODQwLVxcdUE4NzNcXHVBODgwLVxcdUE4QzRcXHVBOEQwLVxcdUE4RDlcXHVBOEUwLVxcdUE4RjdcXHVBOEZCXFx1QTkwMC1cXHVBOTJEXFx1QTkzMC1cXHVBOTUzXFx1QTk2MC1cXHVBOTdDXFx1QTk4MC1cXHVBOUMwXFx1QTlDRi1cXHVBOUQ5XFx1QTlFMC1cXHVBOUZFXFx1QUEwMC1cXHVBQTM2XFx1QUE0MC1cXHVBQTREXFx1QUE1MC1cXHVBQTU5XFx1QUE2MC1cXHVBQTc2XFx1QUE3QS1cXHVBQUMyXFx1QUFEQi1cXHVBQUREXFx1QUFFMC1cXHVBQUVGXFx1QUFGMi1cXHVBQUY2XFx1QUIwMS1cXHVBQjA2XFx1QUIwOS1cXHVBQjBFXFx1QUIxMS1cXHVBQjE2XFx1QUIyMC1cXHVBQjI2XFx1QUIyOC1cXHVBQjJFXFx1QUIzMC1cXHVBQjVBXFx1QUI1Qy1cXHVBQjVGXFx1QUI2NFxcdUFCNjVcXHVBQkMwLVxcdUFCRUFcXHVBQkVDXFx1QUJFRFxcdUFCRjAtXFx1QUJGOVxcdUFDMDAtXFx1RDdBM1xcdUQ3QjAtXFx1RDdDNlxcdUQ3Q0ItXFx1RDdGQlxcdUY5MDAtXFx1RkE2RFxcdUZBNzAtXFx1RkFEOVxcdUZCMDAtXFx1RkIwNlxcdUZCMTMtXFx1RkIxN1xcdUZCMUQtXFx1RkIyOFxcdUZCMkEtXFx1RkIzNlxcdUZCMzgtXFx1RkIzQ1xcdUZCM0VcXHVGQjQwXFx1RkI0MVxcdUZCNDNcXHVGQjQ0XFx1RkI0Ni1cXHVGQkIxXFx1RkJEMy1cXHVGRDNEXFx1RkQ1MC1cXHVGRDhGXFx1RkQ5Mi1cXHVGREM3XFx1RkRGMC1cXHVGREZCXFx1RkUwMC1cXHVGRTBGXFx1RkUyMC1cXHVGRTJEXFx1RkUzM1xcdUZFMzRcXHVGRTRELVxcdUZFNEZcXHVGRTcwLVxcdUZFNzRcXHVGRTc2LVxcdUZFRkNcXHVGRjEwLVxcdUZGMTlcXHVGRjIxLVxcdUZGM0FcXHVGRjNGXFx1RkY0MS1cXHVGRjVBXFx1RkY2Ni1cXHVGRkJFXFx1RkZDMi1cXHVGRkM3XFx1RkZDQS1cXHVGRkNGXFx1RkZEMi1cXHVGRkQ3XFx1RkZEQS1cXHVGRkRDXScpXG4gIH07XG5cbiAgLy8gRW5zdXJlIHRoZSBjb25kaXRpb24gaXMgdHJ1ZSwgb3RoZXJ3aXNlIHRocm93IGFuIGVycm9yLlxuICAvLyBUaGlzIGlzIG9ubHkgdG8gaGF2ZSBhIGJldHRlciBjb250cmFjdCBzZW1hbnRpYywgaS5lLiBhbm90aGVyIHNhZmV0eSBuZXRcbiAgLy8gdG8gY2F0Y2ggYSBsb2dpYyBlcnJvci4gVGhlIGNvbmRpdGlvbiBzaGFsbCBiZSBmdWxmaWxsZWQgaW4gbm9ybWFsIGNhc2UuXG4gIC8vIERvIE5PVCB1c2UgdGhpcyB0byBlbmZvcmNlIGEgY2VydGFpbiBjb25kaXRpb24gb24gYW55IHVzZXIgaW5wdXQuXG5cbiAgZnVuY3Rpb24gYXNzZXJ0KGNvbmRpdGlvbiwgbWVzc2FnZSkge1xuICAgICAgaWYgKCFjb25kaXRpb24pIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FTU0VSVDogJyArIG1lc3NhZ2UpO1xuICAgICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaXNEZWNpbWFsRGlnaXQoY2gpIHtcbiAgICAgIHJldHVybiAoY2ggPj0gMHgzMCAmJiBjaCA8PSAweDM5KTsgICAvLyAwLi45XG4gIH1cblxuICBmdW5jdGlvbiBpc0hleERpZ2l0KGNoKSB7XG4gICAgICByZXR1cm4gJzAxMjM0NTY3ODlhYmNkZWZBQkNERUYnLmluZGV4T2YoY2gpID49IDA7XG4gIH1cblxuICBmdW5jdGlvbiBpc09jdGFsRGlnaXQoY2gpIHtcbiAgICAgIHJldHVybiAnMDEyMzQ1NjcnLmluZGV4T2YoY2gpID49IDA7XG4gIH1cblxuICAvLyA3LjIgV2hpdGUgU3BhY2VcblxuICBmdW5jdGlvbiBpc1doaXRlU3BhY2UoY2gpIHtcbiAgICAgIHJldHVybiAoY2ggPT09IDB4MjApIHx8IChjaCA9PT0gMHgwOSkgfHwgKGNoID09PSAweDBCKSB8fCAoY2ggPT09IDB4MEMpIHx8IChjaCA9PT0gMHhBMCkgfHxcbiAgICAgICAgICAoY2ggPj0gMHgxNjgwICYmIFsweDE2ODAsIDB4MTgwRSwgMHgyMDAwLCAweDIwMDEsIDB4MjAwMiwgMHgyMDAzLCAweDIwMDQsIDB4MjAwNSwgMHgyMDA2LCAweDIwMDcsIDB4MjAwOCwgMHgyMDA5LCAweDIwMEEsIDB4MjAyRiwgMHgyMDVGLCAweDMwMDAsIDB4RkVGRl0uaW5kZXhPZihjaCkgPj0gMCk7XG4gIH1cblxuICAvLyA3LjMgTGluZSBUZXJtaW5hdG9yc1xuXG4gIGZ1bmN0aW9uIGlzTGluZVRlcm1pbmF0b3IoY2gpIHtcbiAgICAgIHJldHVybiAoY2ggPT09IDB4MEEpIHx8IChjaCA9PT0gMHgwRCkgfHwgKGNoID09PSAweDIwMjgpIHx8IChjaCA9PT0gMHgyMDI5KTtcbiAgfVxuXG4gIC8vIDcuNiBJZGVudGlmaWVyIE5hbWVzIGFuZCBJZGVudGlmaWVyc1xuXG4gIGZ1bmN0aW9uIGlzSWRlbnRpZmllclN0YXJ0KGNoKSB7XG4gICAgICByZXR1cm4gKGNoID09PSAweDI0KSB8fCAoY2ggPT09IDB4NUYpIHx8ICAvLyAkIChkb2xsYXIpIGFuZCBfICh1bmRlcnNjb3JlKVxuICAgICAgICAgIChjaCA+PSAweDQxICYmIGNoIDw9IDB4NUEpIHx8ICAgICAgICAgLy8gQS4uWlxuICAgICAgICAgIChjaCA+PSAweDYxICYmIGNoIDw9IDB4N0EpIHx8ICAgICAgICAgLy8gYS4uelxuICAgICAgICAgIChjaCA9PT0gMHg1QykgfHwgICAgICAgICAgICAgICAgICAgICAgLy8gXFwgKGJhY2tzbGFzaClcbiAgICAgICAgICAoKGNoID49IDB4ODApICYmIFJlZ2V4Lk5vbkFzY2lpSWRlbnRpZmllclN0YXJ0LnRlc3QoU3RyaW5nLmZyb21DaGFyQ29kZShjaCkpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzSWRlbnRpZmllclBhcnQoY2gpIHtcbiAgICAgIHJldHVybiAoY2ggPT09IDB4MjQpIHx8IChjaCA9PT0gMHg1RikgfHwgIC8vICQgKGRvbGxhcikgYW5kIF8gKHVuZGVyc2NvcmUpXG4gICAgICAgICAgKGNoID49IDB4NDEgJiYgY2ggPD0gMHg1QSkgfHwgICAgICAgICAvLyBBLi5aXG4gICAgICAgICAgKGNoID49IDB4NjEgJiYgY2ggPD0gMHg3QSkgfHwgICAgICAgICAvLyBhLi56XG4gICAgICAgICAgKGNoID49IDB4MzAgJiYgY2ggPD0gMHgzOSkgfHwgICAgICAgICAvLyAwLi45XG4gICAgICAgICAgKGNoID09PSAweDVDKSB8fCAgICAgICAgICAgICAgICAgICAgICAvLyBcXCAoYmFja3NsYXNoKVxuICAgICAgICAgICgoY2ggPj0gMHg4MCkgJiYgUmVnZXguTm9uQXNjaWlJZGVudGlmaWVyUGFydC50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpKSk7XG4gIH1cblxuICAvLyA3LjYuMS4yIEZ1dHVyZSBSZXNlcnZlZCBXb3Jkc1xuXG4gIGZ1bmN0aW9uIGlzRnV0dXJlUmVzZXJ2ZWRXb3JkKGlkKSB7XG4gICAgICBzd2l0Y2ggKGlkKSB7XG4gICAgICBjYXNlICdjbGFzcyc6XG4gICAgICBjYXNlICdlbnVtJzpcbiAgICAgIGNhc2UgJ2V4cG9ydCc6XG4gICAgICBjYXNlICdleHRlbmRzJzpcbiAgICAgIGNhc2UgJ2ltcG9ydCc6XG4gICAgICBjYXNlICdzdXBlcic6XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZChpZCkge1xuICAgICAgc3dpdGNoIChpZCkge1xuICAgICAgY2FzZSAnaW1wbGVtZW50cyc6XG4gICAgICBjYXNlICdpbnRlcmZhY2UnOlxuICAgICAgY2FzZSAncGFja2FnZSc6XG4gICAgICBjYXNlICdwcml2YXRlJzpcbiAgICAgIGNhc2UgJ3Byb3RlY3RlZCc6XG4gICAgICBjYXNlICdwdWJsaWMnOlxuICAgICAgY2FzZSAnc3RhdGljJzpcbiAgICAgIGNhc2UgJ3lpZWxkJzpcbiAgICAgIGNhc2UgJ2xldCc6XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgfVxuXG4gIC8vIDcuNi4xLjEgS2V5d29yZHNcblxuICBmdW5jdGlvbiBpc0tleXdvcmQoaWQpIHtcbiAgICAgIGlmIChzdHJpY3QgJiYgaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkKGlkKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyAnY29uc3QnIGlzIHNwZWNpYWxpemVkIGFzIEtleXdvcmQgaW4gVjguXG4gICAgICAvLyAneWllbGQnIGFuZCAnbGV0JyBhcmUgZm9yIGNvbXBhdGlibGl0eSB3aXRoIFNwaWRlck1vbmtleSBhbmQgRVMubmV4dC5cbiAgICAgIC8vIFNvbWUgb3RoZXJzIGFyZSBmcm9tIGZ1dHVyZSByZXNlcnZlZCB3b3Jkcy5cblxuICAgICAgc3dpdGNoIChpZC5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgICByZXR1cm4gKGlkID09PSAnaWYnKSB8fCAoaWQgPT09ICdpbicpIHx8IChpZCA9PT0gJ2RvJyk7XG4gICAgICBjYXNlIDM6XG4gICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ3ZhcicpIHx8IChpZCA9PT0gJ2ZvcicpIHx8IChpZCA9PT0gJ25ldycpIHx8XG4gICAgICAgICAgICAgIChpZCA9PT0gJ3RyeScpIHx8IChpZCA9PT0gJ2xldCcpO1xuICAgICAgY2FzZSA0OlxuICAgICAgICAgIHJldHVybiAoaWQgPT09ICd0aGlzJykgfHwgKGlkID09PSAnZWxzZScpIHx8IChpZCA9PT0gJ2Nhc2UnKSB8fFxuICAgICAgICAgICAgICAoaWQgPT09ICd2b2lkJykgfHwgKGlkID09PSAnd2l0aCcpIHx8IChpZCA9PT0gJ2VudW0nKTtcbiAgICAgIGNhc2UgNTpcbiAgICAgICAgICByZXR1cm4gKGlkID09PSAnd2hpbGUnKSB8fCAoaWQgPT09ICdicmVhaycpIHx8IChpZCA9PT0gJ2NhdGNoJykgfHxcbiAgICAgICAgICAgICAgKGlkID09PSAndGhyb3cnKSB8fCAoaWQgPT09ICdjb25zdCcpIHx8IChpZCA9PT0gJ3lpZWxkJykgfHxcbiAgICAgICAgICAgICAgKGlkID09PSAnY2xhc3MnKSB8fCAoaWQgPT09ICdzdXBlcicpO1xuICAgICAgY2FzZSA2OlxuICAgICAgICAgIHJldHVybiAoaWQgPT09ICdyZXR1cm4nKSB8fCAoaWQgPT09ICd0eXBlb2YnKSB8fCAoaWQgPT09ICdkZWxldGUnKSB8fFxuICAgICAgICAgICAgICAoaWQgPT09ICdzd2l0Y2gnKSB8fCAoaWQgPT09ICdleHBvcnQnKSB8fCAoaWQgPT09ICdpbXBvcnQnKTtcbiAgICAgIGNhc2UgNzpcbiAgICAgICAgICByZXR1cm4gKGlkID09PSAnZGVmYXVsdCcpIHx8IChpZCA9PT0gJ2ZpbmFsbHknKSB8fCAoaWQgPT09ICdleHRlbmRzJyk7XG4gICAgICBjYXNlIDg6XG4gICAgICAgICAgcmV0dXJuIChpZCA9PT0gJ2Z1bmN0aW9uJykgfHwgKGlkID09PSAnY29udGludWUnKSB8fCAoaWQgPT09ICdkZWJ1Z2dlcicpO1xuICAgICAgY2FzZSAxMDpcbiAgICAgICAgICByZXR1cm4gKGlkID09PSAnaW5zdGFuY2VvZicpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBza2lwQ29tbWVudCgpIHtcbiAgICAgIHZhciBjaCwgc3RhcnQ7XG5cbiAgICAgIHN0YXJ0ID0gKGluZGV4ID09PSAwKTtcbiAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGNoID0gc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpO1xuXG4gICAgICAgICAgaWYgKGlzV2hpdGVTcGFjZShjaCkpIHtcbiAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2gpKSB7XG4gICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgIGlmIChjaCA9PT0gMHgwRCAmJiBzb3VyY2UuY2hhckNvZGVBdChpbmRleCkgPT09IDB4MEEpIHtcbiAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgKytsaW5lTnVtYmVyO1xuICAgICAgICAgICAgICBsaW5lU3RhcnQgPSBpbmRleDtcbiAgICAgICAgICAgICAgc3RhcnQgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNjYW5IZXhFc2NhcGUocHJlZml4KSB7XG4gICAgICB2YXIgaSwgbGVuLCBjaCwgY29kZSA9IDA7XG5cbiAgICAgIGxlbiA9IChwcmVmaXggPT09ICd1JykgPyA0IDogMjtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICAgIGlmIChpbmRleCA8IGxlbmd0aCAmJiBpc0hleERpZ2l0KHNvdXJjZVtpbmRleF0pKSB7XG4gICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgICBjb2RlID0gY29kZSAqIDE2ICsgJzAxMjM0NTY3ODlhYmNkZWYnLmluZGV4T2YoY2gudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2NhblVuaWNvZGVDb2RlUG9pbnRFc2NhcGUoKSB7XG4gICAgICB2YXIgY2gsIGNvZGUsIGN1MSwgY3UyO1xuXG4gICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICBjb2RlID0gMDtcblxuICAgICAgLy8gQXQgbGVhc3QsIG9uZSBoZXggZGlnaXQgaXMgcmVxdWlyZWQuXG4gICAgICBpZiAoY2ggPT09ICd9Jykge1xuICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgIH1cblxuICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgaWYgKCFpc0hleERpZ2l0KGNoKSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY29kZSA9IGNvZGUgKiAxNiArICcwMTIzNDU2Nzg5YWJjZGVmJy5pbmRleE9mKGNoLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29kZSA+IDB4MTBGRkZGIHx8IGNoICE9PSAnfScpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFVURi0xNiBFbmNvZGluZ1xuICAgICAgaWYgKGNvZGUgPD0gMHhGRkZGKSB7XG4gICAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgICB9XG4gICAgICBjdTEgPSAoKGNvZGUgLSAweDEwMDAwKSA+PiAxMCkgKyAweEQ4MDA7XG4gICAgICBjdTIgPSAoKGNvZGUgLSAweDEwMDAwKSAmIDEwMjMpICsgMHhEQzAwO1xuICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY3UxLCBjdTIpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0RXNjYXBlZElkZW50aWZpZXIoKSB7XG4gICAgICB2YXIgY2gsIGlkO1xuXG4gICAgICBjaCA9IHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KyspO1xuICAgICAgaWQgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNoKTtcblxuICAgICAgLy8gJ1xcdScgKFUrMDA1QywgVSswMDc1KSBkZW5vdGVzIGFuIGVzY2FwZWQgY2hhcmFjdGVyLlxuICAgICAgaWYgKGNoID09PSAweDVDKSB7XG4gICAgICAgICAgaWYgKHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSAhPT0gMHg3NSkge1xuICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgY2ggPSBzY2FuSGV4RXNjYXBlKCd1Jyk7XG4gICAgICAgICAgaWYgKCFjaCB8fCBjaCA9PT0gJ1xcXFwnIHx8ICFpc0lkZW50aWZpZXJTdGFydChjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlkID0gY2g7XG4gICAgICB9XG5cbiAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGNoID0gc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgICAgICAgIGlmICghaXNJZGVudGlmaWVyUGFydChjaCkpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgaWQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjaCk7XG5cbiAgICAgICAgICAvLyAnXFx1JyAoVSswMDVDLCBVKzAwNzUpIGRlbm90ZXMgYW4gZXNjYXBlZCBjaGFyYWN0ZXIuXG4gICAgICAgICAgaWYgKGNoID09PSAweDVDKSB7XG4gICAgICAgICAgICAgIGlkID0gaWQuc3Vic3RyKDAsIGlkLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpICE9PSAweDc1KSB7XG4gICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgY2ggPSBzY2FuSGV4RXNjYXBlKCd1Jyk7XG4gICAgICAgICAgICAgIGlmICghY2ggfHwgY2ggPT09ICdcXFxcJyB8fCAhaXNJZGVudGlmaWVyUGFydChjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlkICs9IGNoO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SWRlbnRpZmllcigpIHtcbiAgICAgIHZhciBzdGFydCwgY2g7XG5cbiAgICAgIHN0YXJ0ID0gaW5kZXgrKztcbiAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGNoID0gc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgICAgICAgIGlmIChjaCA9PT0gMHg1Qykge1xuICAgICAgICAgICAgICAvLyBCbGFja3NsYXNoIChVKzAwNUMpIG1hcmtzIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlLlxuICAgICAgICAgICAgICBpbmRleCA9IHN0YXJ0O1xuICAgICAgICAgICAgICByZXR1cm4gZ2V0RXNjYXBlZElkZW50aWZpZXIoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlzSWRlbnRpZmllclBhcnQoY2gpKSB7XG4gICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc291cmNlLnNsaWNlKHN0YXJ0LCBpbmRleCk7XG4gIH1cblxuICBmdW5jdGlvbiBzY2FuSWRlbnRpZmllcigpIHtcbiAgICAgIHZhciBzdGFydCwgaWQsIHR5cGU7XG5cbiAgICAgIHN0YXJ0ID0gaW5kZXg7XG5cbiAgICAgIC8vIEJhY2tzbGFzaCAoVSswMDVDKSBzdGFydHMgYW4gZXNjYXBlZCBjaGFyYWN0ZXIuXG4gICAgICBpZCA9IChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkgPT09IDB4NUMpID8gZ2V0RXNjYXBlZElkZW50aWZpZXIoKSA6IGdldElkZW50aWZpZXIoKTtcblxuICAgICAgLy8gVGhlcmUgaXMgbm8ga2V5d29yZCBvciBsaXRlcmFsIHdpdGggb25seSBvbmUgY2hhcmFjdGVyLlxuICAgICAgLy8gVGh1cywgaXQgbXVzdCBiZSBhbiBpZGVudGlmaWVyLlxuICAgICAgaWYgKGlkLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIHR5cGUgPSBUb2tlbi5JZGVudGlmaWVyO1xuICAgICAgfSBlbHNlIGlmIChpc0tleXdvcmQoaWQpKSB7XG4gICAgICAgICAgdHlwZSA9IFRva2VuLktleXdvcmQ7XG4gICAgICB9IGVsc2UgaWYgKGlkID09PSAnbnVsbCcpIHtcbiAgICAgICAgICB0eXBlID0gVG9rZW4uTnVsbExpdGVyYWw7XG4gICAgICB9IGVsc2UgaWYgKGlkID09PSAndHJ1ZScgfHwgaWQgPT09ICdmYWxzZScpIHtcbiAgICAgICAgICB0eXBlID0gVG9rZW4uQm9vbGVhbkxpdGVyYWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHR5cGUgPSBUb2tlbi5JZGVudGlmaWVyO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgdmFsdWU6IGlkLFxuICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgIH07XG4gIH1cblxuICAvLyA3LjcgUHVuY3R1YXRvcnNcblxuICBmdW5jdGlvbiBzY2FuUHVuY3R1YXRvcigpIHtcbiAgICAgIHZhciBzdGFydCA9IGluZGV4LFxuICAgICAgICAgIGNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChpbmRleCksXG4gICAgICAgICAgY29kZTIsXG4gICAgICAgICAgY2gxID0gc291cmNlW2luZGV4XSxcbiAgICAgICAgICBjaDIsXG4gICAgICAgICAgY2gzLFxuICAgICAgICAgIGNoNDtcblxuICAgICAgc3dpdGNoIChjb2RlKSB7XG5cbiAgICAgIC8vIENoZWNrIGZvciBtb3N0IGNvbW1vbiBzaW5nbGUtY2hhcmFjdGVyIHB1bmN0dWF0b3JzLlxuICAgICAgY2FzZSAweDJFOiAgLy8gLiBkb3RcbiAgICAgIGNhc2UgMHgyODogIC8vICggb3BlbiBicmFja2V0XG4gICAgICBjYXNlIDB4Mjk6ICAvLyApIGNsb3NlIGJyYWNrZXRcbiAgICAgIGNhc2UgMHgzQjogIC8vIDsgc2VtaWNvbG9uXG4gICAgICBjYXNlIDB4MkM6ICAvLyAsIGNvbW1hXG4gICAgICBjYXNlIDB4N0I6ICAvLyB7IG9wZW4gY3VybHkgYnJhY2VcbiAgICAgIGNhc2UgMHg3RDogIC8vIH0gY2xvc2UgY3VybHkgYnJhY2VcbiAgICAgIGNhc2UgMHg1QjogIC8vIFtcbiAgICAgIGNhc2UgMHg1RDogIC8vIF1cbiAgICAgIGNhc2UgMHgzQTogIC8vIDpcbiAgICAgIGNhc2UgMHgzRjogIC8vID9cbiAgICAgIGNhc2UgMHg3RTogIC8vIH5cbiAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgIGlmIChleHRyYS50b2tlbml6ZSkge1xuICAgICAgICAgICAgICBpZiAoY29kZSA9PT0gMHgyOCkge1xuICAgICAgICAgICAgICAgICAgZXh0cmEub3BlblBhcmVuVG9rZW4gPSBleHRyYS50b2tlbnMubGVuZ3RoO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDB4N0IpIHtcbiAgICAgICAgICAgICAgICAgIGV4dHJhLm9wZW5DdXJseVRva2VuID0gZXh0cmEudG9rZW5zLmxlbmd0aDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICB2YWx1ZTogU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKSxcbiAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgIH07XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgY29kZTIgPSBzb3VyY2UuY2hhckNvZGVBdChpbmRleCArIDEpO1xuXG4gICAgICAgICAgLy8gJz0nIChVKzAwM0QpIG1hcmtzIGFuIGFzc2lnbm1lbnQgb3IgY29tcGFyaXNvbiBvcGVyYXRvci5cbiAgICAgICAgICBpZiAoY29kZTIgPT09IDB4M0QpIHtcbiAgICAgICAgICAgICAgc3dpdGNoIChjb2RlKSB7XG4gICAgICAgICAgICAgIGNhc2UgMHgyQjogIC8vICtcbiAgICAgICAgICAgICAgY2FzZSAweDJEOiAgLy8gLVxuICAgICAgICAgICAgICBjYXNlIDB4MkY6ICAvLyAvXG4gICAgICAgICAgICAgIGNhc2UgMHgzQzogIC8vIDxcbiAgICAgICAgICAgICAgY2FzZSAweDNFOiAgLy8gPlxuICAgICAgICAgICAgICBjYXNlIDB4NUU6ICAvLyBeXG4gICAgICAgICAgICAgIGNhc2UgMHg3QzogIC8vIHxcbiAgICAgICAgICAgICAgY2FzZSAweDI1OiAgLy8gJVxuICAgICAgICAgICAgICBjYXNlIDB4MjY6ICAvLyAmXG4gICAgICAgICAgICAgIGNhc2UgMHgyQTogIC8vICpcbiAgICAgICAgICAgICAgICAgIGluZGV4ICs9IDI7XG4gICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuLlB1bmN0dWF0b3IsXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUyKSxcbiAgICAgICAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgIGNhc2UgMHgyMTogLy8gIVxuICAgICAgICAgICAgICBjYXNlIDB4M0Q6IC8vID1cbiAgICAgICAgICAgICAgICAgIGluZGV4ICs9IDI7XG5cbiAgICAgICAgICAgICAgICAgIC8vICE9PSBhbmQgPT09XG4gICAgICAgICAgICAgICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpID09PSAweDNEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogc291cmNlLnNsaWNlKHN0YXJ0LCBpbmRleCksXG4gICAgICAgICAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gNC1jaGFyYWN0ZXIgcHVuY3R1YXRvcjogPj4+PVxuXG4gICAgICBjaDQgPSBzb3VyY2Uuc3Vic3RyKGluZGV4LCA0KTtcblxuICAgICAgaWYgKGNoNCA9PT0gJz4+Pj0nKSB7XG4gICAgICAgICAgaW5kZXggKz0gNDtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICB2YWx1ZTogY2g0LFxuICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gMy1jaGFyYWN0ZXIgcHVuY3R1YXRvcnM6ID09PSAhPT0gPj4+IDw8PSA+Pj1cblxuICAgICAgY2gzID0gY2g0LnN1YnN0cigwLCAzKTtcblxuICAgICAgaWYgKGNoMyA9PT0gJz4+PicgfHwgY2gzID09PSAnPDw9JyB8fCBjaDMgPT09ICc+Pj0nKSB7XG4gICAgICAgICAgaW5kZXggKz0gMztcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB0eXBlOiBUb2tlbi5QdW5jdHVhdG9yLFxuICAgICAgICAgICAgICB2YWx1ZTogY2gzLFxuICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gT3RoZXIgMi1jaGFyYWN0ZXIgcHVuY3R1YXRvcnM6ICsrIC0tIDw8ID4+ICYmIHx8XG4gICAgICBjaDIgPSBjaDMuc3Vic3RyKDAsIDIpO1xuXG4gICAgICBpZiAoKGNoMSA9PT0gY2gyWzFdICYmICgnKy08PiZ8Jy5pbmRleE9mKGNoMSkgPj0gMCkpIHx8IGNoMiA9PT0gJz0+Jykge1xuICAgICAgICAgIGluZGV4ICs9IDI7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgdmFsdWU6IGNoMixcbiAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIDEtY2hhcmFjdGVyIHB1bmN0dWF0b3JzOiA8ID4gPSAhICsgLSAqICUgJiB8IF4gL1xuXG4gICAgICBpZiAoJzw+PSErLSolJnxeLycuaW5kZXhPZihjaDEpID49IDApIHtcbiAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHR5cGU6IFRva2VuLlB1bmN0dWF0b3IsXG4gICAgICAgICAgICAgIHZhbHVlOiBjaDEsXG4gICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gIH1cblxuICAvLyA3LjguMyBOdW1lcmljIExpdGVyYWxzXG5cbiAgZnVuY3Rpb24gc2NhbkhleExpdGVyYWwoc3RhcnQpIHtcbiAgICAgIHZhciBudW1iZXIgPSAnJztcblxuICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKCFpc0hleERpZ2l0KHNvdXJjZVtpbmRleF0pKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuICAgICAgfVxuXG4gICAgICBpZiAobnVtYmVyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSkpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogVG9rZW4uTnVtZXJpY0xpdGVyYWwsXG4gICAgICAgICAgdmFsdWU6IHBhcnNlSW50KCcweCcgKyBudW1iZXIsIDE2KSxcbiAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gc2Nhbk9jdGFsTGl0ZXJhbChzdGFydCkge1xuICAgICAgdmFyIG51bWJlciA9ICcwJyArIHNvdXJjZVtpbmRleCsrXTtcbiAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIGlmICghaXNPY3RhbERpZ2l0KHNvdXJjZVtpbmRleF0pKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpKSB8fCBpc0RlY2ltYWxEaWdpdChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkpKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCAnSUxMRUdBTCcpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6IFRva2VuLk51bWVyaWNMaXRlcmFsLFxuICAgICAgICAgIHZhbHVlOiBwYXJzZUludChudW1iZXIsIDgpLFxuICAgICAgICAgIG9jdGFsOiB0cnVlLFxuICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBzY2FuTnVtZXJpY0xpdGVyYWwoKSB7XG4gICAgICB2YXIgbnVtYmVyLCBzdGFydCwgY2g7XG5cbiAgICAgIGNoID0gc291cmNlW2luZGV4XTtcbiAgICAgIGFzc2VydChpc0RlY2ltYWxEaWdpdChjaC5jaGFyQ29kZUF0KDApKSB8fCAoY2ggPT09ICcuJyksXG4gICAgICAgICAgJ051bWVyaWMgbGl0ZXJhbCBtdXN0IHN0YXJ0IHdpdGggYSBkZWNpbWFsIGRpZ2l0IG9yIGEgZGVjaW1hbCBwb2ludCcpO1xuXG4gICAgICBzdGFydCA9IGluZGV4O1xuICAgICAgbnVtYmVyID0gJyc7XG4gICAgICBpZiAoY2ggIT09ICcuJykge1xuICAgICAgICAgIG51bWJlciA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG5cbiAgICAgICAgICAvLyBIZXggbnVtYmVyIHN0YXJ0cyB3aXRoICcweCcuXG4gICAgICAgICAgLy8gT2N0YWwgbnVtYmVyIHN0YXJ0cyB3aXRoICcwJy5cbiAgICAgICAgICBpZiAobnVtYmVyID09PSAnMCcpIHtcbiAgICAgICAgICAgICAgaWYgKGNoID09PSAneCcgfHwgY2ggPT09ICdYJykge1xuICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBzY2FuSGV4TGl0ZXJhbChzdGFydCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGlzT2N0YWxEaWdpdChjaCkpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBzY2FuT2N0YWxMaXRlcmFsKHN0YXJ0KTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIGRlY2ltYWwgbnVtYmVyIHN0YXJ0cyB3aXRoICcwJyBzdWNoIGFzICcwOScgaXMgaWxsZWdhbC5cbiAgICAgICAgICAgICAgaWYgKGNoICYmIGlzRGVjaW1hbERpZ2l0KGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB3aGlsZSAoaXNEZWNpbWFsRGlnaXQoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpKSkge1xuICAgICAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICB9XG5cbiAgICAgIGlmIChjaCA9PT0gJy4nKSB7XG4gICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICB3aGlsZSAoaXNEZWNpbWFsRGlnaXQoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpKSkge1xuICAgICAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICB9XG5cbiAgICAgIGlmIChjaCA9PT0gJ2UnIHx8IGNoID09PSAnRScpIHtcbiAgICAgICAgICBudW1iZXIgKz0gc291cmNlW2luZGV4KytdO1xuXG4gICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICAgIGlmIChjaCA9PT0gJysnIHx8IGNoID09PSAnLScpIHtcbiAgICAgICAgICAgICAgbnVtYmVyICs9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlzRGVjaW1hbERpZ2l0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSkpIHtcbiAgICAgICAgICAgICAgd2hpbGUgKGlzRGVjaW1hbERpZ2l0KHNvdXJjZS5jaGFyQ29kZUF0KGluZGV4KSkpIHtcbiAgICAgICAgICAgICAgICAgIG51bWJlciArPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sICdJTExFR0FMJyk7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoc291cmNlLmNoYXJDb2RlQXQoaW5kZXgpKSkge1xuICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiBUb2tlbi5OdW1lcmljTGl0ZXJhbCxcbiAgICAgICAgICB2YWx1ZTogcGFyc2VGbG9hdChudW1iZXIpLFxuICAgICAgICAgIGxpbmVOdW1iZXI6IGxpbmVOdW1iZXIsXG4gICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICAgIGVuZDogaW5kZXhcbiAgICAgIH07XG4gIH1cblxuICAvLyA3LjguNCBTdHJpbmcgTGl0ZXJhbHNcblxuICBmdW5jdGlvbiBzY2FuU3RyaW5nTGl0ZXJhbCgpIHtcbiAgICAgIHZhciBzdHIgPSAnJywgcXVvdGUsIHN0YXJ0LCBjaCwgY29kZSwgdW5lc2NhcGVkLCByZXN0b3JlLCBvY3RhbCA9IGZhbHNlLCBzdGFydExpbmVOdW1iZXIsIHN0YXJ0TGluZVN0YXJ0O1xuICAgICAgc3RhcnRMaW5lTnVtYmVyID0gbGluZU51bWJlcjtcbiAgICAgIHN0YXJ0TGluZVN0YXJ0ID0gbGluZVN0YXJ0O1xuXG4gICAgICBxdW90ZSA9IHNvdXJjZVtpbmRleF07XG4gICAgICBhc3NlcnQoKHF1b3RlID09PSAnXFwnJyB8fCBxdW90ZSA9PT0gJ1wiJyksXG4gICAgICAgICAgJ1N0cmluZyBsaXRlcmFsIG11c3Qgc3RhcnRzIHdpdGggYSBxdW90ZScpO1xuXG4gICAgICBzdGFydCA9IGluZGV4O1xuICAgICAgKytpbmRleDtcblxuICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXgrK107XG5cbiAgICAgICAgICBpZiAoY2ggPT09IHF1b3RlKSB7XG4gICAgICAgICAgICAgIHF1b3RlID0gJyc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICdcXFxcJykge1xuICAgICAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleCsrXTtcbiAgICAgICAgICAgICAgaWYgKCFjaCB8fCAhaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgICAgICAgICAgc3dpdGNoIChjaCkge1xuICAgICAgICAgICAgICAgICAgY2FzZSAndSc6XG4gICAgICAgICAgICAgICAgICBjYXNlICd4JzpcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlW2luZGV4XSA9PT0gJ3snKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSBzY2FuVW5pY29kZUNvZGVQb2ludEVzY2FwZSgpO1xuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmUgPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdW5lc2NhcGVkID0gc2NhbkhleEVzY2FwZShjaCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1bmVzY2FwZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ciArPSB1bmVzY2FwZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IHJlc3RvcmU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICBjYXNlICduJzpcbiAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICBjYXNlICdyJzpcbiAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xccic7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICBjYXNlICd0JzpcbiAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcdCc7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICBjYXNlICdiJzpcbiAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcYic7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICBjYXNlICdmJzpcbiAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xcZic7XG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICBjYXNlICd2JzpcbiAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gJ1xceDBCJztcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNPY3RhbERpZ2l0KGNoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlID0gJzAxMjM0NTY3Jy5pbmRleE9mKGNoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBcXDAgaXMgbm90IG9jdGFsIGVzY2FwZSBzZXF1ZW5jZVxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29kZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2N0YWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgbGVuZ3RoICYmIGlzT2N0YWxEaWdpdChzb3VyY2VbaW5kZXhdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2N0YWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUgKiA4ICsgJzAxMjM0NTY3Jy5pbmRleE9mKHNvdXJjZVtpbmRleCsrXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDMgZGlnaXRzIGFyZSBvbmx5IGFsbG93ZWQgd2hlbiBzdHJpbmcgc3RhcnRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3aXRoIDAsIDEsIDIsIDNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgnMDEyMycuaW5kZXhPZihjaCkgPj0gMCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA8IGxlbmd0aCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc09jdGFsRGlnaXQoc291cmNlW2luZGV4XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlID0gY29kZSAqIDggKyAnMDEyMzQ1NjcnLmluZGV4T2Yoc291cmNlW2luZGV4KytdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgKytsaW5lTnVtYmVyO1xuICAgICAgICAgICAgICAgICAgaWYgKGNoID09PSAgJ1xccicgJiYgc291cmNlW2luZGV4XSA9PT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICArK2luZGV4O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgbGluZVN0YXJ0ID0gaW5kZXg7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHF1b3RlICE9PSAnJykge1xuICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiBUb2tlbi5TdHJpbmdMaXRlcmFsLFxuICAgICAgICAgIHZhbHVlOiBzdHIsXG4gICAgICAgICAgb2N0YWw6IG9jdGFsLFxuICAgICAgICAgIHN0YXJ0TGluZU51bWJlcjogc3RhcnRMaW5lTnVtYmVyLFxuICAgICAgICAgIHN0YXJ0TGluZVN0YXJ0OiBzdGFydExpbmVTdGFydCxcbiAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgIGxpbmVTdGFydDogbGluZVN0YXJ0LFxuICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdGVzdFJlZ0V4cChwYXR0ZXJuLCBmbGFncykge1xuICAgICAgdmFyIHRtcCA9IHBhdHRlcm4sXG4gICAgICAgICAgdmFsdWU7XG5cbiAgICAgIGlmIChmbGFncy5pbmRleE9mKCd1JykgPj0gMCkge1xuICAgICAgICAgIC8vIFJlcGxhY2UgZWFjaCBhc3RyYWwgc3ltYm9sIGFuZCBldmVyeSBVbmljb2RlIGNvZGUgcG9pbnRcbiAgICAgICAgICAvLyBlc2NhcGUgc2VxdWVuY2Ugd2l0aCBhIHNpbmdsZSBBU0NJSSBzeW1ib2wgdG8gYXZvaWQgdGhyb3dpbmcgb25cbiAgICAgICAgICAvLyByZWd1bGFyIGV4cHJlc3Npb25zIHRoYXQgYXJlIG9ubHkgdmFsaWQgaW4gY29tYmluYXRpb24gd2l0aCB0aGVcbiAgICAgICAgICAvLyBgL3VgIGZsYWcuXG4gICAgICAgICAgLy8gTm90ZTogcmVwbGFjaW5nIHdpdGggdGhlIEFTQ0lJIHN5bWJvbCBgeGAgbWlnaHQgY2F1c2UgZmFsc2VcbiAgICAgICAgICAvLyBuZWdhdGl2ZXMgaW4gdW5saWtlbHkgc2NlbmFyaW9zLiBGb3IgZXhhbXBsZSwgYFtcXHV7NjF9LWJdYCBpcyBhXG4gICAgICAgICAgLy8gcGVyZmVjdGx5IHZhbGlkIHBhdHRlcm4gdGhhdCBpcyBlcXVpdmFsZW50IHRvIGBbYS1iXWAsIGJ1dCBpdFxuICAgICAgICAgIC8vIHdvdWxkIGJlIHJlcGxhY2VkIGJ5IGBbeC1iXWAgd2hpY2ggdGhyb3dzIGFuIGVycm9yLlxuICAgICAgICAgIHRtcCA9IHRtcFxuICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXHVcXHsoWzAtOWEtZkEtRl0rKVxcfS9nLCBmdW5jdGlvbiAoJDAsICQxKSB7XG4gICAgICAgICAgICAgICAgICBpZiAocGFyc2VJbnQoJDEsIDE2KSA8PSAweDEwRkZGRikge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAneCc7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yKHt9LCBNZXNzYWdlcy5JbnZhbGlkUmVnRXhwKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL1tcXHVEODAwLVxcdURCRkZdW1xcdURDMDAtXFx1REZGRl0vZywgJ3gnKTtcbiAgICAgIH1cblxuICAgICAgLy8gRmlyc3QsIGRldGVjdCBpbnZhbGlkIHJlZ3VsYXIgZXhwcmVzc2lvbnMuXG4gICAgICB0cnkge1xuICAgICAgICAgIHZhbHVlID0gbmV3IFJlZ0V4cCh0bXApO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLkludmFsaWRSZWdFeHApO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm4gYSByZWd1bGFyIGV4cHJlc3Npb24gb2JqZWN0IGZvciB0aGlzIHBhdHRlcm4tZmxhZyBwYWlyLCBvclxuICAgICAgLy8gYG51bGxgIGluIGNhc2UgdGhlIGN1cnJlbnQgZW52aXJvbm1lbnQgZG9lc24ndCBzdXBwb3J0IHRoZSBmbGFncyBpdFxuICAgICAgLy8gdXNlcy5cbiAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAocGF0dGVybiwgZmxhZ3MpO1xuICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzY2FuUmVnRXhwQm9keSgpIHtcbiAgICAgIHZhciBjaCwgc3RyLCBjbGFzc01hcmtlciwgdGVybWluYXRlZCwgYm9keTtcblxuICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgYXNzZXJ0KGNoID09PSAnLycsICdSZWd1bGFyIGV4cHJlc3Npb24gbGl0ZXJhbCBtdXN0IHN0YXJ0IHdpdGggYSBzbGFzaCcpO1xuICAgICAgc3RyID0gc291cmNlW2luZGV4KytdO1xuXG4gICAgICBjbGFzc01hcmtlciA9IGZhbHNlO1xuICAgICAgdGVybWluYXRlZCA9IGZhbHNlO1xuICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXgrK107XG4gICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgIGlmIChjaCA9PT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICAgIGNoID0gc291cmNlW2luZGV4KytdO1xuICAgICAgICAgICAgICAvLyBFQ01BLTI2MiA3LjguNVxuICAgICAgICAgICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW50ZXJtaW5hdGVkUmVnRXhwKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgICAgICAgIHRocm93RXJyb3Ioe30sIE1lc3NhZ2VzLlVudGVybWluYXRlZFJlZ0V4cCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChjbGFzc01hcmtlcikge1xuICAgICAgICAgICAgICBpZiAoY2ggPT09ICddJykge1xuICAgICAgICAgICAgICAgICAgY2xhc3NNYXJrZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChjaCA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICB0ZXJtaW5hdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnWycpIHtcbiAgICAgICAgICAgICAgICAgIGNsYXNzTWFya2VyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCF0ZXJtaW5hdGVkKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcih7fSwgTWVzc2FnZXMuVW50ZXJtaW5hdGVkUmVnRXhwKTtcbiAgICAgIH1cblxuICAgICAgLy8gRXhjbHVkZSBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaC5cbiAgICAgIGJvZHkgPSBzdHIuc3Vic3RyKDEsIHN0ci5sZW5ndGggLSAyKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgICAgdmFsdWU6IGJvZHksXG4gICAgICAgICAgbGl0ZXJhbDogc3RyXG4gICAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gc2NhblJlZ0V4cEZsYWdzKCkge1xuICAgICAgdmFyIGNoLCBzdHIsIGZsYWdzLCByZXN0b3JlO1xuXG4gICAgICBzdHIgPSAnJztcbiAgICAgIGZsYWdzID0gJyc7XG4gICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBjaCA9IHNvdXJjZVtpbmRleF07XG4gICAgICAgICAgaWYgKCFpc0lkZW50aWZpZXJQYXJ0KGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgICsraW5kZXg7XG4gICAgICAgICAgaWYgKGNoID09PSAnXFxcXCcgJiYgaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgY2ggPSBzb3VyY2VbaW5kZXhdO1xuICAgICAgICAgICAgICBpZiAoY2ggPT09ICd1Jykge1xuICAgICAgICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgICAgICAgICAgIHJlc3RvcmUgPSBpbmRleDtcbiAgICAgICAgICAgICAgICAgIGNoID0gc2NhbkhleEVzY2FwZSgndScpO1xuICAgICAgICAgICAgICAgICAgaWYgKGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgZmxhZ3MgKz0gY2g7XG4gICAgICAgICAgICAgICAgICAgICAgZm9yIChzdHIgKz0gJ1xcXFx1JzsgcmVzdG9yZSA8IGluZGV4OyArK3Jlc3RvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyICs9IHNvdXJjZVtyZXN0b3JlXTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gcmVzdG9yZTtcbiAgICAgICAgICAgICAgICAgICAgICBmbGFncyArPSAndSc7XG4gICAgICAgICAgICAgICAgICAgICAgc3RyICs9ICdcXFxcdSc7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHN0ciArPSAnXFxcXCc7XG4gICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgJ0lMTEVHQUwnKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZsYWdzICs9IGNoO1xuICAgICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICAgIHZhbHVlOiBmbGFncyxcbiAgICAgICAgICBsaXRlcmFsOiBzdHJcbiAgICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBzY2FuUmVnRXhwKCkge1xuICAgICAgdmFyIHN0YXJ0LCBib2R5LCBmbGFncywgdmFsdWU7XG5cbiAgICAgIGxvb2thaGVhZCA9IG51bGw7XG4gICAgICBza2lwQ29tbWVudCgpO1xuICAgICAgc3RhcnQgPSBpbmRleDtcblxuICAgICAgYm9keSA9IHNjYW5SZWdFeHBCb2R5KCk7XG4gICAgICBmbGFncyA9IHNjYW5SZWdFeHBGbGFncygpO1xuICAgICAgdmFsdWUgPSB0ZXN0UmVnRXhwKGJvZHkudmFsdWUsIGZsYWdzLnZhbHVlKTtcblxuICAgICAgaWYgKGV4dHJhLnRva2VuaXplKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdHlwZTogVG9rZW4uUmVndWxhckV4cHJlc3Npb24sXG4gICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgICAgcmVnZXg6IHtcbiAgICAgICAgICAgICAgICAgIHBhdHRlcm46IGJvZHkudmFsdWUsXG4gICAgICAgICAgICAgICAgICBmbGFnczogZmxhZ3MudmFsdWVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbGluZU51bWJlcjogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgbGluZVN0YXJ0OiBsaW5lU3RhcnQsXG4gICAgICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgICAgbGl0ZXJhbDogYm9keS5saXRlcmFsICsgZmxhZ3MubGl0ZXJhbCxcbiAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgcmVnZXg6IHtcbiAgICAgICAgICAgICAgcGF0dGVybjogYm9keS52YWx1ZSxcbiAgICAgICAgICAgICAgZmxhZ3M6IGZsYWdzLnZhbHVlXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgZW5kOiBpbmRleFxuICAgICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbGxlY3RSZWdleCgpIHtcbiAgICAgIHZhciBwb3MsIGxvYywgcmVnZXgsIHRva2VuO1xuXG4gICAgICBza2lwQ29tbWVudCgpO1xuXG4gICAgICBwb3MgPSBpbmRleDtcbiAgICAgIGxvYyA9IHtcbiAgICAgICAgICBzdGFydDoge1xuICAgICAgICAgICAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICBjb2x1bW46IGluZGV4IC0gbGluZVN0YXJ0XG4gICAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcmVnZXggPSBzY2FuUmVnRXhwKCk7XG5cbiAgICAgIGxvYy5lbmQgPSB7XG4gICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICBjb2x1bW46IGluZGV4IC0gbGluZVN0YXJ0XG4gICAgICB9O1xuXG4gICAgICBpZiAoIWV4dHJhLnRva2VuaXplKSB7XG4gICAgICAgICAgLy8gUG9wIHRoZSBwcmV2aW91cyB0b2tlbiwgd2hpY2ggaXMgbGlrZWx5ICcvJyBvciAnLz0nXG4gICAgICAgICAgaWYgKGV4dHJhLnRva2Vucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHRva2VuID0gZXh0cmEudG9rZW5zW2V4dHJhLnRva2Vucy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgaWYgKHRva2VuLnJhbmdlWzBdID09PSBwb3MgJiYgdG9rZW4udHlwZSA9PT0gJ1B1bmN0dWF0b3InKSB7XG4gICAgICAgICAgICAgICAgICBpZiAodG9rZW4udmFsdWUgPT09ICcvJyB8fCB0b2tlbi52YWx1ZSA9PT0gJy89Jykge1xuICAgICAgICAgICAgICAgICAgICAgIGV4dHJhLnRva2Vucy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGV4dHJhLnRva2Vucy5wdXNoKHtcbiAgICAgICAgICAgICAgdHlwZTogJ1JlZ3VsYXJFeHByZXNzaW9uJyxcbiAgICAgICAgICAgICAgdmFsdWU6IHJlZ2V4LmxpdGVyYWwsXG4gICAgICAgICAgICAgIHJlZ2V4OiByZWdleC5yZWdleCxcbiAgICAgICAgICAgICAgcmFuZ2U6IFtwb3MsIGluZGV4XSxcbiAgICAgICAgICAgICAgbG9jOiBsb2NcbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlZ2V4O1xuICB9XG5cbiAgZnVuY3Rpb24gaXNJZGVudGlmaWVyTmFtZSh0b2tlbikge1xuICAgICAgcmV0dXJuIHRva2VuLnR5cGUgPT09IFRva2VuLklkZW50aWZpZXIgfHxcbiAgICAgICAgICB0b2tlbi50eXBlID09PSBUb2tlbi5LZXl3b3JkIHx8XG4gICAgICAgICAgdG9rZW4udHlwZSA9PT0gVG9rZW4uQm9vbGVhbkxpdGVyYWwgfHxcbiAgICAgICAgICB0b2tlbi50eXBlID09PSBUb2tlbi5OdWxsTGl0ZXJhbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkdmFuY2VTbGFzaCgpIHtcbiAgICAgIHZhciBwcmV2VG9rZW4sXG4gICAgICAgICAgY2hlY2tUb2tlbjtcbiAgICAgIC8vIFVzaW5nIHRoZSBmb2xsb3dpbmcgYWxnb3JpdGhtOlxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEvc3dlZXQuanMvd2lraS9kZXNpZ25cbiAgICAgIHByZXZUb2tlbiA9IGV4dHJhLnRva2Vuc1tleHRyYS50b2tlbnMubGVuZ3RoIC0gMV07XG4gICAgICBpZiAoIXByZXZUb2tlbikge1xuICAgICAgICAgIC8vIE5vdGhpbmcgYmVmb3JlIHRoYXQ6IGl0IGNhbm5vdCBiZSBhIGRpdmlzaW9uLlxuICAgICAgICAgIHJldHVybiBjb2xsZWN0UmVnZXgoKTtcbiAgICAgIH1cbiAgICAgIGlmIChwcmV2VG9rZW4udHlwZSA9PT0gJ1B1bmN0dWF0b3InKSB7XG4gICAgICAgICAgaWYgKHByZXZUb2tlbi52YWx1ZSA9PT0gJ10nKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzY2FuUHVuY3R1YXRvcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocHJldlRva2VuLnZhbHVlID09PSAnKScpIHtcbiAgICAgICAgICAgICAgY2hlY2tUb2tlbiA9IGV4dHJhLnRva2Vuc1tleHRyYS5vcGVuUGFyZW5Ub2tlbiAtIDFdO1xuICAgICAgICAgICAgICBpZiAoY2hlY2tUb2tlbiAmJlxuICAgICAgICAgICAgICAgICAgICAgIGNoZWNrVG9rZW4udHlwZSA9PT0gJ0tleXdvcmQnICYmXG4gICAgICAgICAgICAgICAgICAgICAgKGNoZWNrVG9rZW4udmFsdWUgPT09ICdpZicgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tUb2tlbi52YWx1ZSA9PT0gJ3doaWxlJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Rva2VuLnZhbHVlID09PSAnZm9yJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Rva2VuLnZhbHVlID09PSAnd2l0aCcpKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gY29sbGVjdFJlZ2V4KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHNjYW5QdW5jdHVhdG9yKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwcmV2VG9rZW4udmFsdWUgPT09ICd9Jykge1xuICAgICAgICAgICAgICAvLyBEaXZpZGluZyBhIGZ1bmN0aW9uIGJ5IGFueXRoaW5nIG1ha2VzIGxpdHRsZSBzZW5zZSxcbiAgICAgICAgICAgICAgLy8gYnV0IHdlIGhhdmUgdG8gY2hlY2sgZm9yIHRoYXQuXG4gICAgICAgICAgICAgIGlmIChleHRyYS50b2tlbnNbZXh0cmEub3BlbkN1cmx5VG9rZW4gLSAzXSAmJlxuICAgICAgICAgICAgICAgICAgICAgIGV4dHJhLnRva2Vuc1tleHRyYS5vcGVuQ3VybHlUb2tlbiAtIDNdLnR5cGUgPT09ICdLZXl3b3JkJykge1xuICAgICAgICAgICAgICAgICAgLy8gQW5vbnltb3VzIGZ1bmN0aW9uLlxuICAgICAgICAgICAgICAgICAgY2hlY2tUb2tlbiA9IGV4dHJhLnRva2Vuc1tleHRyYS5vcGVuQ3VybHlUb2tlbiAtIDRdO1xuICAgICAgICAgICAgICAgICAgaWYgKCFjaGVja1Rva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjYW5QdW5jdHVhdG9yKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXh0cmEudG9rZW5zW2V4dHJhLm9wZW5DdXJseVRva2VuIC0gNF0gJiZcbiAgICAgICAgICAgICAgICAgICAgICBleHRyYS50b2tlbnNbZXh0cmEub3BlbkN1cmx5VG9rZW4gLSA0XS50eXBlID09PSAnS2V5d29yZCcpIHtcbiAgICAgICAgICAgICAgICAgIC8vIE5hbWVkIGZ1bmN0aW9uLlxuICAgICAgICAgICAgICAgICAgY2hlY2tUb2tlbiA9IGV4dHJhLnRva2Vuc1tleHRyYS5vcGVuQ3VybHlUb2tlbiAtIDVdO1xuICAgICAgICAgICAgICAgICAgaWYgKCFjaGVja1Rva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3RSZWdleCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjYW5QdW5jdHVhdG9yKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHNjYW5QdW5jdHVhdG9yKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjb2xsZWN0UmVnZXgoKTtcbiAgICAgIH1cbiAgICAgIGlmIChwcmV2VG9rZW4udHlwZSA9PT0gJ0tleXdvcmQnICYmIHByZXZUb2tlbi52YWx1ZSAhPT0gJ3RoaXMnKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbGxlY3RSZWdleCgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNjYW5QdW5jdHVhdG9yKCk7XG4gIH1cblxuICBmdW5jdGlvbiBhZHZhbmNlKCkge1xuICAgICAgdmFyIGNoO1xuXG4gICAgICBza2lwQ29tbWVudCgpO1xuXG4gICAgICBpZiAoaW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdHlwZTogVG9rZW4uRU9GLFxuICAgICAgICAgICAgICBsaW5lTnVtYmVyOiBsaW5lTnVtYmVyLFxuICAgICAgICAgICAgICBsaW5lU3RhcnQ6IGxpbmVTdGFydCxcbiAgICAgICAgICAgICAgc3RhcnQ6IGluZGV4LFxuICAgICAgICAgICAgICBlbmQ6IGluZGV4XG4gICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgY2ggPSBzb3VyY2UuY2hhckNvZGVBdChpbmRleCk7XG5cbiAgICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChjaCkpIHtcbiAgICAgICAgICByZXR1cm4gc2NhbklkZW50aWZpZXIoKTtcbiAgICAgIH1cblxuICAgICAgLy8gVmVyeSBjb21tb246ICggYW5kICkgYW5kIDtcbiAgICAgIGlmIChjaCA9PT0gMHgyOCB8fCBjaCA9PT0gMHgyOSB8fCBjaCA9PT0gMHgzQikge1xuICAgICAgICAgIHJldHVybiBzY2FuUHVuY3R1YXRvcigpO1xuICAgICAgfVxuXG4gICAgICAvLyBTdHJpbmcgbGl0ZXJhbCBzdGFydHMgd2l0aCBzaW5nbGUgcXVvdGUgKFUrMDAyNykgb3IgZG91YmxlIHF1b3RlIChVKzAwMjIpLlxuICAgICAgaWYgKGNoID09PSAweDI3IHx8IGNoID09PSAweDIyKSB7XG4gICAgICAgICAgcmV0dXJuIHNjYW5TdHJpbmdMaXRlcmFsKCk7XG4gICAgICB9XG5cblxuICAgICAgLy8gRG90ICguKSBVKzAwMkUgY2FuIGFsc28gc3RhcnQgYSBmbG9hdGluZy1wb2ludCBudW1iZXIsIGhlbmNlIHRoZSBuZWVkXG4gICAgICAvLyB0byBjaGVjayB0aGUgbmV4dCBjaGFyYWN0ZXIuXG4gICAgICBpZiAoY2ggPT09IDB4MkUpIHtcbiAgICAgICAgICBpZiAoaXNEZWNpbWFsRGlnaXQoc291cmNlLmNoYXJDb2RlQXQoaW5kZXggKyAxKSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNjYW5OdW1lcmljTGl0ZXJhbCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzRGVjaW1hbERpZ2l0KGNoKSkge1xuICAgICAgICAgIHJldHVybiBzY2FuTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2xhc2ggKC8pIFUrMDAyRiBjYW4gYWxzbyBzdGFydCBhIHJlZ2V4LlxuICAgICAgaWYgKGV4dHJhLnRva2VuaXplICYmIGNoID09PSAweDJGKSB7XG4gICAgICAgICAgcmV0dXJuIGFkdmFuY2VTbGFzaCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2NhblB1bmN0dWF0b3IoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbGxlY3RUb2tlbigpIHtcbiAgICAgIHZhciBsb2MsIHRva2VuLCB2YWx1ZSwgZW50cnk7XG5cbiAgICAgIHNraXBDb21tZW50KCk7XG4gICAgICBsb2MgPSB7XG4gICAgICAgICAgc3RhcnQ6IHtcbiAgICAgICAgICAgICAgbGluZTogbGluZU51bWJlcixcbiAgICAgICAgICAgICAgY29sdW1uOiBpbmRleCAtIGxpbmVTdGFydFxuICAgICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHRva2VuID0gYWR2YW5jZSgpO1xuICAgICAgbG9jLmVuZCA9IHtcbiAgICAgICAgICBsaW5lOiBsaW5lTnVtYmVyLFxuICAgICAgICAgIGNvbHVtbjogaW5kZXggLSBsaW5lU3RhcnRcbiAgICAgIH07XG5cbiAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5FT0YpIHtcbiAgICAgICAgICB2YWx1ZSA9IHNvdXJjZS5zbGljZSh0b2tlbi5zdGFydCwgdG9rZW4uZW5kKTtcbiAgICAgICAgICBlbnRyeSA9IHtcbiAgICAgICAgICAgICAgdHlwZTogVG9rZW5OYW1lW3Rva2VuLnR5cGVdLFxuICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAgIHJhbmdlOiBbdG9rZW4uc3RhcnQsIHRva2VuLmVuZF0sXG4gICAgICAgICAgICAgIGxvYzogbG9jXG4gICAgICAgICAgfTtcbiAgICAgICAgICBpZiAodG9rZW4ucmVnZXgpIHtcbiAgICAgICAgICAgICAgZW50cnkucmVnZXggPSB7XG4gICAgICAgICAgICAgICAgICBwYXR0ZXJuOiB0b2tlbi5yZWdleC5wYXR0ZXJuLFxuICAgICAgICAgICAgICAgICAgZmxhZ3M6IHRva2VuLnJlZ2V4LmZsYWdzXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIGV4dHJhLnRva2Vucy5wdXNoKGVudHJ5KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRva2VuO1xuICB9XG5cbiAgZnVuY3Rpb24gbGV4KCkge1xuICAgICAgdmFyIHRva2VuO1xuXG4gICAgICB0b2tlbiA9IGxvb2thaGVhZDtcbiAgICAgIGluZGV4ID0gdG9rZW4uZW5kO1xuICAgICAgbGluZU51bWJlciA9IHRva2VuLmxpbmVOdW1iZXI7XG4gICAgICBsaW5lU3RhcnQgPSB0b2tlbi5saW5lU3RhcnQ7XG5cbiAgICAgIGxvb2thaGVhZCA9ICh0eXBlb2YgZXh0cmEudG9rZW5zICE9PSAndW5kZWZpbmVkJykgPyBjb2xsZWN0VG9rZW4oKSA6IGFkdmFuY2UoKTtcblxuICAgICAgaW5kZXggPSB0b2tlbi5lbmQ7XG4gICAgICBsaW5lTnVtYmVyID0gdG9rZW4ubGluZU51bWJlcjtcbiAgICAgIGxpbmVTdGFydCA9IHRva2VuLmxpbmVTdGFydDtcblxuICAgICAgcmV0dXJuIHRva2VuO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVlaygpIHtcbiAgICAgIHZhciBwb3MsIGxpbmUsIHN0YXJ0O1xuXG4gICAgICBwb3MgPSBpbmRleDtcbiAgICAgIGxpbmUgPSBsaW5lTnVtYmVyO1xuICAgICAgc3RhcnQgPSBsaW5lU3RhcnQ7XG4gICAgICBsb29rYWhlYWQgPSAodHlwZW9mIGV4dHJhLnRva2VucyAhPT0gJ3VuZGVmaW5lZCcpID8gY29sbGVjdFRva2VuKCkgOiBhZHZhbmNlKCk7XG4gICAgICBpbmRleCA9IHBvcztcbiAgICAgIGxpbmVOdW1iZXIgPSBsaW5lO1xuICAgICAgbGluZVN0YXJ0ID0gc3RhcnQ7XG4gIH1cblxuICBmdW5jdGlvbiBQb3NpdGlvbigpIHtcbiAgICAgIHRoaXMubGluZSA9IGxpbmVOdW1iZXI7XG4gICAgICB0aGlzLmNvbHVtbiA9IGluZGV4IC0gbGluZVN0YXJ0O1xuICB9XG5cbiAgZnVuY3Rpb24gU291cmNlTG9jYXRpb24oKSB7XG4gICAgICB0aGlzLnN0YXJ0ID0gbmV3IFBvc2l0aW9uKCk7XG4gICAgICB0aGlzLmVuZCA9IG51bGw7XG4gIH1cblxuICBmdW5jdGlvbiBXcmFwcGluZ1NvdXJjZUxvY2F0aW9uKHN0YXJ0VG9rZW4pIHtcbiAgICAgIGlmIChzdGFydFRva2VuLnR5cGUgPT09IFRva2VuLlN0cmluZ0xpdGVyYWwpIHtcbiAgICAgICAgICB0aGlzLnN0YXJ0ID0ge1xuICAgICAgICAgICAgICBsaW5lOiBzdGFydFRva2VuLnN0YXJ0TGluZU51bWJlcixcbiAgICAgICAgICAgICAgY29sdW1uOiBzdGFydFRva2VuLnN0YXJ0IC0gc3RhcnRUb2tlbi5zdGFydExpbmVTdGFydFxuICAgICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuc3RhcnQgPSB7XG4gICAgICAgICAgICAgIGxpbmU6IHN0YXJ0VG9rZW4ubGluZU51bWJlcixcbiAgICAgICAgICAgICAgY29sdW1uOiBzdGFydFRva2VuLnN0YXJ0IC0gc3RhcnRUb2tlbi5saW5lU3RhcnRcbiAgICAgICAgICB9O1xuICAgICAgfVxuICAgICAgdGhpcy5lbmQgPSBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gTm9kZSgpIHtcbiAgICAgIC8vIFNraXAgY29tbWVudC5cbiAgICAgIGluZGV4ID0gbG9va2FoZWFkLnN0YXJ0O1xuICAgICAgaWYgKGxvb2thaGVhZC50eXBlID09PSBUb2tlbi5TdHJpbmdMaXRlcmFsKSB7XG4gICAgICAgICAgbGluZU51bWJlciA9IGxvb2thaGVhZC5zdGFydExpbmVOdW1iZXI7XG4gICAgICAgICAgbGluZVN0YXJ0ID0gbG9va2FoZWFkLnN0YXJ0TGluZVN0YXJ0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaW5lTnVtYmVyID0gbG9va2FoZWFkLmxpbmVOdW1iZXI7XG4gICAgICAgICAgbGluZVN0YXJ0ID0gbG9va2FoZWFkLmxpbmVTdGFydDtcbiAgICAgIH1cbiAgICAgIGlmIChleHRyYS5yYW5nZSkge1xuICAgICAgICAgIHRoaXMucmFuZ2UgPSBbaW5kZXgsIDBdO1xuICAgICAgfVxuICAgICAgaWYgKGV4dHJhLmxvYykge1xuICAgICAgICAgIHRoaXMubG9jID0gbmV3IFNvdXJjZUxvY2F0aW9uKCk7XG4gICAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBXcmFwcGluZ05vZGUoc3RhcnRUb2tlbikge1xuICAgICAgaWYgKGV4dHJhLnJhbmdlKSB7XG4gICAgICAgICAgdGhpcy5yYW5nZSA9IFtzdGFydFRva2VuLnN0YXJ0LCAwXTtcbiAgICAgIH1cbiAgICAgIGlmIChleHRyYS5sb2MpIHtcbiAgICAgICAgICB0aGlzLmxvYyA9IG5ldyBXcmFwcGluZ1NvdXJjZUxvY2F0aW9uKHN0YXJ0VG9rZW4pO1xuICAgICAgfVxuICB9XG5cbiAgV3JhcHBpbmdOb2RlLnByb3RvdHlwZSA9IE5vZGUucHJvdG90eXBlID0ge1xuXG4gICAgICBmaW5pc2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoZXh0cmEucmFuZ2UpIHtcbiAgICAgICAgICAgICAgdGhpcy5yYW5nZVsxXSA9IGluZGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZXh0cmEubG9jKSB7XG4gICAgICAgICAgICAgIHRoaXMubG9jLmVuZCA9IG5ldyBQb3NpdGlvbigpO1xuICAgICAgICAgICAgICBpZiAoZXh0cmEuc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmxvYy5zb3VyY2UgPSBleHRyYS5zb3VyY2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBmaW5pc2hBcnJheUV4cHJlc3Npb246IGZ1bmN0aW9uIChlbGVtZW50cykge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5BcnJheUV4cHJlc3Npb247XG4gICAgICAgICAgdGhpcy5lbGVtZW50cyA9IGVsZW1lbnRzO1xuICAgICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuXG4gICAgICBmaW5pc2hBc3NpZ25tZW50RXhwcmVzc2lvbjogZnVuY3Rpb24gKG9wZXJhdG9yLCBsZWZ0LCByaWdodCkge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5Bc3NpZ25tZW50RXhwcmVzc2lvbjtcbiAgICAgICAgICB0aGlzLm9wZXJhdG9yID0gb3BlcmF0b3I7XG4gICAgICAgICAgdGhpcy5sZWZ0ID0gbGVmdDtcbiAgICAgICAgICB0aGlzLnJpZ2h0ID0gcmlnaHQ7XG4gICAgICAgICAgdGhpcy5maW5pc2goKTtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG5cbiAgICAgIGZpbmlzaEJpbmFyeUV4cHJlc3Npb246IGZ1bmN0aW9uIChvcGVyYXRvciwgbGVmdCwgcmlnaHQpIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSAob3BlcmF0b3IgPT09ICd8fCcgfHwgb3BlcmF0b3IgPT09ICcmJicpID8gU3ludGF4LkxvZ2ljYWxFeHByZXNzaW9uIDogU3ludGF4LkJpbmFyeUV4cHJlc3Npb247XG4gICAgICAgICAgdGhpcy5vcGVyYXRvciA9IG9wZXJhdG9yO1xuICAgICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XG4gICAgICAgICAgdGhpcy5yaWdodCA9IHJpZ2h0O1xuICAgICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuXG4gICAgICBmaW5pc2hDYWxsRXhwcmVzc2lvbjogZnVuY3Rpb24gKGNhbGxlZSwgYXJncykge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5DYWxsRXhwcmVzc2lvbjtcbiAgICAgICAgICB0aGlzLmNhbGxlZSA9IGNhbGxlZTtcbiAgICAgICAgICB0aGlzLmFyZ3VtZW50cyA9IGFyZ3M7XG4gICAgICAgICAgdGhpcy5maW5pc2goKTtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG5cbiAgICAgIGZpbmlzaENvbmRpdGlvbmFsRXhwcmVzc2lvbjogZnVuY3Rpb24gKHRlc3QsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSkge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5Db25kaXRpb25hbEV4cHJlc3Npb247XG4gICAgICAgICAgdGhpcy50ZXN0ID0gdGVzdDtcbiAgICAgICAgICB0aGlzLmNvbnNlcXVlbnQgPSBjb25zZXF1ZW50O1xuICAgICAgICAgIHRoaXMuYWx0ZXJuYXRlID0gYWx0ZXJuYXRlO1xuICAgICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuXG4gICAgICBmaW5pc2hFeHByZXNzaW9uU3RhdGVtZW50OiBmdW5jdGlvbiAoZXhwcmVzc2lvbikge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5FeHByZXNzaW9uU3RhdGVtZW50O1xuICAgICAgICAgIHRoaXMuZXhwcmVzc2lvbiA9IGV4cHJlc3Npb247XG4gICAgICAgICAgdGhpcy5maW5pc2goKTtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG5cbiAgICAgIGZpbmlzaElkZW50aWZpZXI6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgdGhpcy50eXBlID0gU3ludGF4LklkZW50aWZpZXI7XG4gICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcblxuICAgICAgZmluaXNoTGl0ZXJhbDogZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgICAgdGhpcy50eXBlID0gU3ludGF4LkxpdGVyYWw7XG4gICAgICAgICAgdGhpcy52YWx1ZSA9IHRva2VuLnZhbHVlO1xuICAgICAgICAgIHRoaXMucmF3ID0gc291cmNlLnNsaWNlKHRva2VuLnN0YXJ0LCB0b2tlbi5lbmQpO1xuICAgICAgICAgIGlmICh0b2tlbi5yZWdleCkge1xuICAgICAgICAgICAgICBpZiAodGhpcy5yYXcgPT0gJy8vJykge1xuICAgICAgICAgICAgICAgIHRoaXMucmF3ID0gJy8oPzopLyc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5yZWdleCA9IHRva2VuLnJlZ2V4O1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcblxuICAgICAgZmluaXNoTWVtYmVyRXhwcmVzc2lvbjogZnVuY3Rpb24gKGFjY2Vzc29yLCBvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgICAgICAgdGhpcy50eXBlID0gU3ludGF4Lk1lbWJlckV4cHJlc3Npb247XG4gICAgICAgICAgdGhpcy5jb21wdXRlZCA9IGFjY2Vzc29yID09PSAnWyc7XG4gICAgICAgICAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG4gICAgICAgICAgdGhpcy5wcm9wZXJ0eSA9IHByb3BlcnR5O1xuICAgICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuXG4gICAgICBmaW5pc2hPYmplY3RFeHByZXNzaW9uOiBmdW5jdGlvbiAocHJvcGVydGllcykge1xuICAgICAgICAgIHRoaXMudHlwZSA9IFN5bnRheC5PYmplY3RFeHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgICAgICAgdGhpcy5maW5pc2goKTtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0sXG5cbiAgICAgIGZpbmlzaFByb2dyYW06IGZ1bmN0aW9uIChib2R5KSB7XG4gICAgICAgICAgdGhpcy50eXBlID0gU3ludGF4LlByb2dyYW07XG4gICAgICAgICAgdGhpcy5ib2R5ID0gYm9keTtcbiAgICAgICAgICB0aGlzLmZpbmlzaCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSxcblxuICAgICAgZmluaXNoUHJvcGVydHk6IGZ1bmN0aW9uIChraW5kLCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgdGhpcy50eXBlID0gU3ludGF4LlByb3BlcnR5O1xuICAgICAgICAgIHRoaXMua2V5ID0ga2V5O1xuICAgICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICB0aGlzLmtpbmQgPSBraW5kO1xuICAgICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuXG4gICAgICBmaW5pc2hVbmFyeUV4cHJlc3Npb246IGZ1bmN0aW9uIChvcGVyYXRvciwgYXJndW1lbnQpIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSAob3BlcmF0b3IgPT09ICcrKycgfHwgb3BlcmF0b3IgPT09ICctLScpID8gU3ludGF4LlVwZGF0ZUV4cHJlc3Npb24gOiBTeW50YXguVW5hcnlFeHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMub3BlcmF0b3IgPSBvcGVyYXRvcjtcbiAgICAgICAgICB0aGlzLmFyZ3VtZW50ID0gYXJndW1lbnQ7XG4gICAgICAgICAgdGhpcy5wcmVmaXggPSB0cnVlO1xuICAgICAgICAgIHRoaXMuZmluaXNoKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRydWUgaWYgdGhlcmUgaXMgYSBsaW5lIHRlcm1pbmF0b3IgYmVmb3JlIHRoZSBuZXh0IHRva2VuLlxuXG4gIGZ1bmN0aW9uIHBlZWtMaW5lVGVybWluYXRvcigpIHtcbiAgICAgIHZhciBwb3MsIGxpbmUsIHN0YXJ0LCBmb3VuZDtcblxuICAgICAgcG9zID0gaW5kZXg7XG4gICAgICBsaW5lID0gbGluZU51bWJlcjtcbiAgICAgIHN0YXJ0ID0gbGluZVN0YXJ0O1xuICAgICAgc2tpcENvbW1lbnQoKTtcbiAgICAgIGZvdW5kID0gbGluZU51bWJlciAhPT0gbGluZTtcbiAgICAgIGluZGV4ID0gcG9zO1xuICAgICAgbGluZU51bWJlciA9IGxpbmU7XG4gICAgICBsaW5lU3RhcnQgPSBzdGFydDtcblxuICAgICAgcmV0dXJuIGZvdW5kO1xuICB9XG5cbiAgLy8gVGhyb3cgYW4gZXhjZXB0aW9uXG5cbiAgZnVuY3Rpb24gdGhyb3dFcnJvcih0b2tlbiwgbWVzc2FnZUZvcm1hdCkge1xuICAgICAgdmFyIGVycm9yLFxuICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpLFxuICAgICAgICAgIG1zZyA9IG1lc3NhZ2VGb3JtYXQucmVwbGFjZShcbiAgICAgICAgICAgICAgLyUoXFxkKS9nLFxuICAgICAgICAgICAgICBmdW5jdGlvbiAod2hvbGUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICBhc3NlcnQoaW5kZXggPCBhcmdzLmxlbmd0aCwgJ01lc3NhZ2UgcmVmZXJlbmNlIG11c3QgYmUgaW4gcmFuZ2UnKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBhcmdzW2luZGV4XTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG5cbiAgICAgIGlmICh0eXBlb2YgdG9rZW4ubGluZU51bWJlciA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcignTGluZSAnICsgdG9rZW4ubGluZU51bWJlciArICc6ICcgKyBtc2cpO1xuICAgICAgICAgIGVycm9yLmluZGV4ID0gdG9rZW4uc3RhcnQ7XG4gICAgICAgICAgZXJyb3IubGluZU51bWJlciA9IHRva2VuLmxpbmVOdW1iZXI7XG4gICAgICAgICAgZXJyb3IuY29sdW1uID0gdG9rZW4uc3RhcnQgLSBsaW5lU3RhcnQgKyAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcignTGluZSAnICsgbGluZU51bWJlciArICc6ICcgKyBtc2cpO1xuICAgICAgICAgIGVycm9yLmluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgZXJyb3IubGluZU51bWJlciA9IGxpbmVOdW1iZXI7XG4gICAgICAgICAgZXJyb3IuY29sdW1uID0gaW5kZXggLSBsaW5lU3RhcnQgKyAxO1xuICAgICAgfVxuXG4gICAgICBlcnJvci5kZXNjcmlwdGlvbiA9IG1zZztcbiAgICAgIHRocm93IGVycm9yO1xuICB9XG5cbiAgZnVuY3Rpb24gdGhyb3dFcnJvclRvbGVyYW50KCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgICB0aHJvd0Vycm9yLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgaWYgKGV4dHJhLmVycm9ycykge1xuICAgICAgICAgICAgICBleHRyYS5lcnJvcnMucHVzaChlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgfVxuXG5cbiAgLy8gVGhyb3cgYW4gZXhjZXB0aW9uIGJlY2F1c2Ugb2YgdGhlIHRva2VuLlxuXG4gIGZ1bmN0aW9uIHRocm93VW5leHBlY3RlZCh0b2tlbikge1xuICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLkVPRikge1xuICAgICAgICAgIHRocm93RXJyb3IodG9rZW4sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRFT1MpO1xuICAgICAgfVxuXG4gICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uTnVtZXJpY0xpdGVyYWwpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHRva2VuLCBNZXNzYWdlcy5VbmV4cGVjdGVkTnVtYmVyKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLlN0cmluZ0xpdGVyYWwpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHRva2VuLCBNZXNzYWdlcy5VbmV4cGVjdGVkU3RyaW5nKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuLklkZW50aWZpZXIpIHtcbiAgICAgICAgICB0aHJvd0Vycm9yKHRva2VuLCBNZXNzYWdlcy5VbmV4cGVjdGVkSWRlbnRpZmllcik7XG4gICAgICB9XG5cbiAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5LZXl3b3JkKSB7XG4gICAgICAgICAgaWYgKGlzRnV0dXJlUmVzZXJ2ZWRXb3JkKHRva2VuLnZhbHVlKSkge1xuICAgICAgICAgICAgICB0aHJvd0Vycm9yKHRva2VuLCBNZXNzYWdlcy5VbmV4cGVjdGVkUmVzZXJ2ZWQpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc3RyaWN0ICYmIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZCh0b2tlbi52YWx1ZSkpIHtcbiAgICAgICAgICAgICAgdGhyb3dFcnJvclRvbGVyYW50KHRva2VuLCBNZXNzYWdlcy5TdHJpY3RSZXNlcnZlZFdvcmQpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHRocm93RXJyb3IodG9rZW4sIE1lc3NhZ2VzLlVuZXhwZWN0ZWRUb2tlbiwgdG9rZW4udmFsdWUpO1xuICAgICAgfVxuXG4gICAgICAvLyBCb29sZWFuTGl0ZXJhbCwgTnVsbExpdGVyYWwsIG9yIFB1bmN0dWF0b3IuXG4gICAgICB0aHJvd0Vycm9yKHRva2VuLCBNZXNzYWdlcy5VbmV4cGVjdGVkVG9rZW4sIHRva2VuLnZhbHVlKTtcbiAgfVxuXG4gIC8vIEV4cGVjdCB0aGUgbmV4dCB0b2tlbiB0byBtYXRjaCB0aGUgc3BlY2lmaWVkIHB1bmN0dWF0b3IuXG4gIC8vIElmIG5vdCwgYW4gZXhjZXB0aW9uIHdpbGwgYmUgdGhyb3duLlxuXG4gIGZ1bmN0aW9uIGV4cGVjdCh2YWx1ZSkge1xuICAgICAgdmFyIHRva2VuID0gbGV4KCk7XG4gICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uUHVuY3R1YXRvciB8fCB0b2tlbi52YWx1ZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICB0aHJvd1VuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBuYW1lIGV4cGVjdFRvbGVyYW50XG4gICAqIEBkZXNjcmlwdGlvbiBRdWlldGx5IGV4cGVjdCB0aGUgZ2l2ZW4gdG9rZW4gdmFsdWUgd2hlbiBpbiB0b2xlcmFudCBtb2RlLCBvdGhlcndpc2UgZGVsZWdhdGVzXG4gICAqIHRvIDxjb2RlPmV4cGVjdCh2YWx1ZSk8L2NvZGU+XG4gICAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZSBUaGUgdmFsdWUgd2UgYXJlIGV4cGVjdGluZyB0aGUgbG9va2FoZWFkIHRva2VuIHRvIGhhdmVcbiAgICogQHNpbmNlIDIuMFxuICAgKi9cbiAgZnVuY3Rpb24gZXhwZWN0VG9sZXJhbnQodmFsdWUpIHtcbiAgICAgIGlmIChleHRyYS5lcnJvcnMpIHtcbiAgICAgICAgICB2YXIgdG9rZW4gPSBsb29rYWhlYWQ7XG4gICAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuLlB1bmN0dWF0b3IgJiYgdG9rZW4udmFsdWUgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh0b2tlbiwgTWVzc2FnZXMuVW5leHBlY3RlZFRva2VuLCB0b2tlbi52YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBleHBlY3QodmFsdWUpO1xuICAgICAgfVxuICB9XG5cbiAgLy8gRXhwZWN0IHRoZSBuZXh0IHRva2VuIHRvIG1hdGNoIHRoZSBzcGVjaWZpZWQga2V5d29yZC5cbiAgLy8gSWYgbm90LCBhbiBleGNlcHRpb24gd2lsbCBiZSB0aHJvd24uXG5cbiAgZnVuY3Rpb24gZXhwZWN0S2V5d29yZChrZXl3b3JkKSB7XG4gICAgICB2YXIgdG9rZW4gPSBsZXgoKTtcbiAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5LZXl3b3JkIHx8IHRva2VuLnZhbHVlICE9PSBrZXl3b3JkKSB7XG4gICAgICAgICAgdGhyb3dVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgIH1cbiAgfVxuXG4gIC8vIFJldHVybiB0cnVlIGlmIHRoZSBuZXh0IHRva2VuIG1hdGNoZXMgdGhlIHNwZWNpZmllZCBwdW5jdHVhdG9yLlxuXG4gIGZ1bmN0aW9uIG1hdGNoKHZhbHVlKSB7XG4gICAgICByZXR1cm4gbG9va2FoZWFkLnR5cGUgPT09IFRva2VuLlB1bmN0dWF0b3IgJiYgbG9va2FoZWFkLnZhbHVlID09PSB2YWx1ZTtcbiAgfVxuXG4gIC8vIFJldHVybiB0cnVlIGlmIHRoZSBuZXh0IHRva2VuIG1hdGNoZXMgdGhlIHNwZWNpZmllZCBrZXl3b3JkXG5cbiAgZnVuY3Rpb24gbWF0Y2hLZXl3b3JkKGtleXdvcmQpIHtcbiAgICAgIHJldHVybiBsb29rYWhlYWQudHlwZSA9PT0gVG9rZW4uS2V5d29yZCAmJiBsb29rYWhlYWQudmFsdWUgPT09IGtleXdvcmQ7XG4gIH1cblxuICBmdW5jdGlvbiBjb25zdW1lU2VtaWNvbG9uKCkge1xuICAgICAgdmFyIGxpbmU7XG5cbiAgICAgIC8vIENhdGNoIHRoZSB2ZXJ5IGNvbW1vbiBjYXNlIGZpcnN0OiBpbW1lZGlhdGVseSBhIHNlbWljb2xvbiAoVSswMDNCKS5cbiAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChpbmRleCkgPT09IDB4M0IgfHwgbWF0Y2goJzsnKSkge1xuICAgICAgICAgIGxleCgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbGluZSA9IGxpbmVOdW1iZXI7XG4gICAgICBza2lwQ29tbWVudCgpO1xuICAgICAgaWYgKGxpbmVOdW1iZXIgIT09IGxpbmUpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChsb29rYWhlYWQudHlwZSAhPT0gVG9rZW4uRU9GICYmICFtYXRjaCgnfScpKSB7XG4gICAgICAgICAgdGhyb3dVbmV4cGVjdGVkKGxvb2thaGVhZCk7XG4gICAgICB9XG4gIH1cblxuICAvLyBSZXR1cm4gdHJ1ZSBpZiBwcm92aWRlZCBleHByZXNzaW9uIGlzIExlZnRIYW5kU2lkZUV4cHJlc3Npb25cblxuICBmdW5jdGlvbiBpc0xlZnRIYW5kU2lkZShleHByKSB7XG4gICAgICByZXR1cm4gZXhwci50eXBlID09PSBTeW50YXguSWRlbnRpZmllciB8fCBleHByLnR5cGUgPT09IFN5bnRheC5NZW1iZXJFeHByZXNzaW9uO1xuICB9XG5cbiAgLy8gMTEuMS40IEFycmF5IEluaXRpYWxpc2VyXG5cbiAgZnVuY3Rpb24gcGFyc2VBcnJheUluaXRpYWxpc2VyKCkge1xuICAgICAgdmFyIGVsZW1lbnRzID0gW10sIG5vZGUgPSBuZXcgTm9kZSgpO1xuXG4gICAgICBleHBlY3QoJ1snKTtcblxuICAgICAgd2hpbGUgKCFtYXRjaCgnXScpKSB7XG4gICAgICAgICAgaWYgKG1hdGNoKCcsJykpIHtcbiAgICAgICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgICAgIGVsZW1lbnRzLnB1c2gobnVsbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudHMucHVzaChwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkpO1xuXG4gICAgICAgICAgICAgIGlmICghbWF0Y2goJ10nKSkge1xuICAgICAgICAgICAgICAgICAgZXhwZWN0KCcsJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxleCgpO1xuXG4gICAgICByZXR1cm4gbm9kZS5maW5pc2hBcnJheUV4cHJlc3Npb24oZWxlbWVudHMpO1xuICB9XG5cbiAgLy8gMTEuMS41IE9iamVjdCBJbml0aWFsaXNlclxuXG4gIGZ1bmN0aW9uIHBhcnNlT2JqZWN0UHJvcGVydHlLZXkoKSB7XG4gICAgICB2YXIgdG9rZW4sIG5vZGUgPSBuZXcgTm9kZSgpO1xuXG4gICAgICB0b2tlbiA9IGxleCgpO1xuXG4gICAgICAvLyBOb3RlOiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBvbmx5IGZyb20gcGFyc2VPYmplY3RQcm9wZXJ0eSgpLCB3aGVyZVxuICAgICAgLy8gRU9GIGFuZCBQdW5jdHVhdG9yIHRva2VucyBhcmUgYWxyZWFkeSBmaWx0ZXJlZCBvdXQuXG5cbiAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5TdHJpbmdMaXRlcmFsIHx8IHRva2VuLnR5cGUgPT09IFRva2VuLk51bWVyaWNMaXRlcmFsKSB7XG4gICAgICAgICAgaWYgKHN0cmljdCAmJiB0b2tlbi5vY3RhbCkge1xuICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQodG9rZW4sIE1lc3NhZ2VzLlN0cmljdE9jdGFsTGl0ZXJhbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBub2RlLmZpbmlzaExpdGVyYWwodG9rZW4pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbm9kZS5maW5pc2hJZGVudGlmaWVyKHRva2VuLnZhbHVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlT2JqZWN0UHJvcGVydHkoKSB7XG4gICAgICB2YXIgdG9rZW4sIGtleSwgaWQsIHZhbHVlLCBwYXJhbSwgbm9kZSA9IG5ldyBOb2RlKCk7XG5cbiAgICAgIHRva2VuID0gbG9va2FoZWFkO1xuXG4gICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW4uSWRlbnRpZmllcikge1xuICAgICAgICAgIGlkID0gcGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgICAgICAgIGV4cGVjdCgnOicpO1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICAgIHJldHVybiBub2RlLmZpbmlzaFByb3BlcnR5KCdpbml0JywgaWQsIHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlbi5FT0YgfHwgdG9rZW4udHlwZSA9PT0gVG9rZW4uUHVuY3R1YXRvcikge1xuICAgICAgICAgIHRocm93VW5leHBlY3RlZCh0b2tlbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGtleSA9IHBhcnNlT2JqZWN0UHJvcGVydHlLZXkoKTtcbiAgICAgICAgICBleHBlY3QoJzonKTtcbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgICByZXR1cm4gbm9kZS5maW5pc2hQcm9wZXJ0eSgnaW5pdCcsIGtleSwgdmFsdWUpO1xuICAgICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VPYmplY3RJbml0aWFsaXNlcigpIHtcbiAgICAgIHZhciBwcm9wZXJ0aWVzID0gW10sIHRva2VuLCBwcm9wZXJ0eSwgbmFtZSwga2V5LCBraW5kLCBtYXAgPSB7fSwgdG9TdHJpbmcgPSBTdHJpbmcsIG5vZGUgPSBuZXcgTm9kZSgpO1xuXG4gICAgICBleHBlY3QoJ3snKTtcblxuICAgICAgd2hpbGUgKCFtYXRjaCgnfScpKSB7XG4gICAgICAgICAgcHJvcGVydHkgPSBwYXJzZU9iamVjdFByb3BlcnR5KCk7XG5cbiAgICAgICAgICBpZiAocHJvcGVydHkua2V5LnR5cGUgPT09IFN5bnRheC5JZGVudGlmaWVyKSB7XG4gICAgICAgICAgICAgIG5hbWUgPSBwcm9wZXJ0eS5rZXkubmFtZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBuYW1lID0gdG9TdHJpbmcocHJvcGVydHkua2V5LnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAga2luZCA9IChwcm9wZXJ0eS5raW5kID09PSAnaW5pdCcpID8gUHJvcGVydHlLaW5kLkRhdGEgOiAocHJvcGVydHkua2luZCA9PT0gJ2dldCcpID8gUHJvcGVydHlLaW5kLkdldCA6IFByb3BlcnR5S2luZC5TZXQ7XG5cbiAgICAgICAgICBrZXkgPSAnJCcgKyBuYW1lO1xuICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobWFwLCBrZXkpKSB7XG4gICAgICAgICAgICAgIGlmIChtYXBba2V5XSA9PT0gUHJvcGVydHlLaW5kLkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChzdHJpY3QgJiYga2luZCA9PT0gUHJvcGVydHlLaW5kLkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLlN0cmljdER1cGxpY2F0ZVByb3BlcnR5KTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoa2luZCAhPT0gUHJvcGVydHlLaW5kLkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLkFjY2Vzc29yRGF0YVByb3BlcnR5KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGlmIChraW5kID09PSBQcm9wZXJ0eUtpbmQuRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudCh7fSwgTWVzc2FnZXMuQWNjZXNzb3JEYXRhUHJvcGVydHkpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXBba2V5XSAmIGtpbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aHJvd0Vycm9yVG9sZXJhbnQoe30sIE1lc3NhZ2VzLkFjY2Vzc29yR2V0U2V0KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBtYXBba2V5XSB8PSBraW5kO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG1hcFtrZXldID0ga2luZDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwcm9wZXJ0aWVzLnB1c2gocHJvcGVydHkpO1xuXG4gICAgICAgICAgaWYgKCFtYXRjaCgnfScpKSB7XG4gICAgICAgICAgICAgIGV4cGVjdFRvbGVyYW50KCcsJyk7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBleHBlY3QoJ30nKTtcblxuICAgICAgcmV0dXJuIG5vZGUuZmluaXNoT2JqZWN0RXhwcmVzc2lvbihwcm9wZXJ0aWVzKTtcbiAgfVxuXG4gIC8vIDExLjEuNiBUaGUgR3JvdXBpbmcgT3BlcmF0b3JcblxuICBmdW5jdGlvbiBwYXJzZUdyb3VwRXhwcmVzc2lvbigpIHtcbiAgICAgIHZhciBleHByO1xuXG4gICAgICBleHBlY3QoJygnKTtcblxuICAgICAgKytzdGF0ZS5wYXJlbnRoZXNpc0NvdW50O1xuXG4gICAgICBleHByID0gcGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgIGV4cGVjdCgnKScpO1xuXG4gICAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG5cbiAgLy8gMTEuMSBQcmltYXJ5IEV4cHJlc3Npb25zXG5cbiAgdmFyIGxlZ2FsS2V5d29yZHMgPSB7XCJpZlwiOjEsIFwidGhpc1wiOjF9O1xuXG4gIGZ1bmN0aW9uIHBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKSB7XG4gICAgICB2YXIgdHlwZSwgdG9rZW4sIGV4cHIsIG5vZGU7XG5cbiAgICAgIGlmIChtYXRjaCgnKCcpKSB7XG4gICAgICAgICAgcmV0dXJuIHBhcnNlR3JvdXBFeHByZXNzaW9uKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChtYXRjaCgnWycpKSB7XG4gICAgICAgICAgcmV0dXJuIHBhcnNlQXJyYXlJbml0aWFsaXNlcigpO1xuICAgICAgfVxuXG4gICAgICBpZiAobWF0Y2goJ3snKSkge1xuICAgICAgICAgIHJldHVybiBwYXJzZU9iamVjdEluaXRpYWxpc2VyKCk7XG4gICAgICB9XG5cbiAgICAgIHR5cGUgPSBsb29rYWhlYWQudHlwZTtcbiAgICAgIG5vZGUgPSBuZXcgTm9kZSgpO1xuXG4gICAgICBpZiAodHlwZSA9PT0gVG9rZW4uSWRlbnRpZmllciB8fCBsZWdhbEtleXdvcmRzW2xvb2thaGVhZC52YWx1ZV0pIHtcbiAgICAgICAgICBleHByID0gbm9kZS5maW5pc2hJZGVudGlmaWVyKGxleCgpLnZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gVG9rZW4uU3RyaW5nTGl0ZXJhbCB8fCB0eXBlID09PSBUb2tlbi5OdW1lcmljTGl0ZXJhbCkge1xuICAgICAgICAgIGlmIChzdHJpY3QgJiYgbG9va2FoZWFkLm9jdGFsKSB7XG4gICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudChsb29rYWhlYWQsIE1lc3NhZ2VzLlN0cmljdE9jdGFsTGl0ZXJhbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGV4cHIgPSBub2RlLmZpbmlzaExpdGVyYWwobGV4KCkpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBUb2tlbi5LZXl3b3JkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGlzYWJsZWQuXCIpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBUb2tlbi5Cb29sZWFuTGl0ZXJhbCkge1xuICAgICAgICAgIHRva2VuID0gbGV4KCk7XG4gICAgICAgICAgdG9rZW4udmFsdWUgPSAodG9rZW4udmFsdWUgPT09ICd0cnVlJyk7XG4gICAgICAgICAgZXhwciA9IG5vZGUuZmluaXNoTGl0ZXJhbCh0b2tlbik7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFRva2VuLk51bGxMaXRlcmFsKSB7XG4gICAgICAgICAgdG9rZW4gPSBsZXgoKTtcbiAgICAgICAgICB0b2tlbi52YWx1ZSA9IG51bGw7XG4gICAgICAgICAgZXhwciA9IG5vZGUuZmluaXNoTGl0ZXJhbCh0b2tlbik7XG4gICAgICB9IGVsc2UgaWYgKG1hdGNoKCcvJykgfHwgbWF0Y2goJy89JykpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGV4dHJhLnRva2VucyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgZXhwciA9IG5vZGUuZmluaXNoTGl0ZXJhbChjb2xsZWN0UmVnZXgoKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZXhwciA9IG5vZGUuZmluaXNoTGl0ZXJhbChzY2FuUmVnRXhwKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwZWVrKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93VW5leHBlY3RlZChsZXgoKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgLy8gMTEuMiBMZWZ0LUhhbmQtU2lkZSBFeHByZXNzaW9uc1xuXG4gIGZ1bmN0aW9uIHBhcnNlQXJndW1lbnRzKCkge1xuICAgICAgdmFyIGFyZ3MgPSBbXTtcblxuICAgICAgZXhwZWN0KCcoJyk7XG5cbiAgICAgIGlmICghbWF0Y2goJyknKSkge1xuICAgICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgICBhcmdzLnB1c2gocGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpKTtcbiAgICAgICAgICAgICAgaWYgKG1hdGNoKCcpJykpIHtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGV4cGVjdFRvbGVyYW50KCcsJyk7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBleHBlY3QoJyknKTtcblxuICAgICAgcmV0dXJuIGFyZ3M7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZU5vbkNvbXB1dGVkUHJvcGVydHkoKSB7XG4gICAgICB2YXIgdG9rZW4sIG5vZGUgPSBuZXcgTm9kZSgpO1xuXG4gICAgICB0b2tlbiA9IGxleCgpO1xuXG4gICAgICBpZiAoIWlzSWRlbnRpZmllck5hbWUodG9rZW4pKSB7XG4gICAgICAgICAgdGhyb3dVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5vZGUuZmluaXNoSWRlbnRpZmllcih0b2tlbi52YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCkge1xuICAgICAgZXhwZWN0KCcuJyk7XG5cbiAgICAgIHJldHVybiBwYXJzZU5vbkNvbXB1dGVkUHJvcGVydHkoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlQ29tcHV0ZWRNZW1iZXIoKSB7XG4gICAgICB2YXIgZXhwcjtcblxuICAgICAgZXhwZWN0KCdbJyk7XG5cbiAgICAgIGV4cHIgPSBwYXJzZUV4cHJlc3Npb24oKTtcblxuICAgICAgZXhwZWN0KCddJyk7XG5cbiAgICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uQWxsb3dDYWxsKCkge1xuICAgICAgdmFyIGV4cHIsIGFyZ3MsIHByb3BlcnR5LCBzdGFydFRva2VuLCBwcmV2aW91c0FsbG93SW4gPSBzdGF0ZS5hbGxvd0luO1xuXG4gICAgICBzdGFydFRva2VuID0gbG9va2FoZWFkO1xuICAgICAgc3RhdGUuYWxsb3dJbiA9IHRydWU7XG4gICAgICBleHByID0gcGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgICBmb3IgKDs7KSB7XG4gICAgICAgICAgaWYgKG1hdGNoKCcuJykpIHtcbiAgICAgICAgICAgICAgcHJvcGVydHkgPSBwYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCk7XG4gICAgICAgICAgICAgIGV4cHIgPSBuZXcgV3JhcHBpbmdOb2RlKHN0YXJ0VG9rZW4pLmZpbmlzaE1lbWJlckV4cHJlc3Npb24oJy4nLCBleHByLCBwcm9wZXJ0eSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChtYXRjaCgnKCcpKSB7XG4gICAgICAgICAgICAgIGFyZ3MgPSBwYXJzZUFyZ3VtZW50cygpO1xuICAgICAgICAgICAgICBleHByID0gbmV3IFdyYXBwaW5nTm9kZShzdGFydFRva2VuKS5maW5pc2hDYWxsRXhwcmVzc2lvbihleHByLCBhcmdzKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoKCdbJykpIHtcbiAgICAgICAgICAgICAgcHJvcGVydHkgPSBwYXJzZUNvbXB1dGVkTWVtYmVyKCk7XG4gICAgICAgICAgICAgIGV4cHIgPSBuZXcgV3JhcHBpbmdOb2RlKHN0YXJ0VG9rZW4pLmZpbmlzaE1lbWJlckV4cHJlc3Npb24oJ1snLCBleHByLCBwcm9wZXJ0eSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgICAgc3RhdGUuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oKSB7XG4gICAgICB2YXIgZXhwciwgcHJvcGVydHksIHN0YXJ0VG9rZW47XG4gICAgICBhc3NlcnQoc3RhdGUuYWxsb3dJbiwgJ2NhbGxlZSBvZiBuZXcgZXhwcmVzc2lvbiBhbHdheXMgYWxsb3cgaW4ga2V5d29yZC4nKTtcblxuICAgICAgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcbiAgICAgIGV4cHIgPSBwYXJzZVByaW1hcnlFeHByZXNzaW9uKCk7XG5cbiAgICAgIGZvciAoOzspIHtcbiAgICAgICAgICBpZiAobWF0Y2goJ1snKSkge1xuICAgICAgICAgICAgICBwcm9wZXJ0eSA9IHBhcnNlQ29tcHV0ZWRNZW1iZXIoKTtcbiAgICAgICAgICAgICAgZXhwciA9IG5ldyBXcmFwcGluZ05vZGUoc3RhcnRUb2tlbikuZmluaXNoTWVtYmVyRXhwcmVzc2lvbignWycsIGV4cHIsIHByb3BlcnR5KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoKCcuJykpIHtcbiAgICAgICAgICAgICAgcHJvcGVydHkgPSBwYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCk7XG4gICAgICAgICAgICAgIGV4cHIgPSBuZXcgV3JhcHBpbmdOb2RlKHN0YXJ0VG9rZW4pLmZpbmlzaE1lbWJlckV4cHJlc3Npb24oJy4nLCBleHByLCBwcm9wZXJ0eSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICAvLyAxMS4zIFBvc3RmaXggRXhwcmVzc2lvbnNcblxuICBmdW5jdGlvbiBwYXJzZVBvc3RmaXhFeHByZXNzaW9uKCkge1xuICAgICAgdmFyIGV4cHIsIHRva2VuLCBzdGFydFRva2VuID0gbG9va2FoZWFkO1xuXG4gICAgICBleHByID0gcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uQWxsb3dDYWxsKCk7XG5cbiAgICAgIGlmIChsb29rYWhlYWQudHlwZSA9PT0gVG9rZW4uUHVuY3R1YXRvcikge1xuICAgICAgICAgIGlmICgobWF0Y2goJysrJykgfHwgbWF0Y2goJy0tJykpICYmICFwZWVrTGluZVRlcm1pbmF0b3IoKSkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEaXNhYmxlZC5cIik7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIC8vIDExLjQgVW5hcnkgT3BlcmF0b3JzXG5cbiAgZnVuY3Rpb24gcGFyc2VVbmFyeUV4cHJlc3Npb24oKSB7XG4gICAgICB2YXIgdG9rZW4sIGV4cHIsIHN0YXJ0VG9rZW47XG5cbiAgICAgIGlmIChsb29rYWhlYWQudHlwZSAhPT0gVG9rZW4uUHVuY3R1YXRvciAmJiBsb29rYWhlYWQudHlwZSAhPT0gVG9rZW4uS2V5d29yZCkge1xuICAgICAgICAgIGV4cHIgPSBwYXJzZVBvc3RmaXhFeHByZXNzaW9uKCk7XG4gICAgICB9IGVsc2UgaWYgKG1hdGNoKCcrKycpIHx8IG1hdGNoKCctLScpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGlzYWJsZWQuXCIpO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaCgnKycpIHx8IG1hdGNoKCctJykgfHwgbWF0Y2goJ34nKSB8fCBtYXRjaCgnIScpKSB7XG4gICAgICAgICAgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcbiAgICAgICAgICB0b2tlbiA9IGxleCgpO1xuICAgICAgICAgIGV4cHIgPSBwYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuICAgICAgICAgIGV4cHIgPSBuZXcgV3JhcHBpbmdOb2RlKHN0YXJ0VG9rZW4pLmZpbmlzaFVuYXJ5RXhwcmVzc2lvbih0b2tlbi52YWx1ZSwgZXhwcik7XG4gICAgICB9IGVsc2UgaWYgKG1hdGNoS2V5d29yZCgnZGVsZXRlJykgfHwgbWF0Y2hLZXl3b3JkKCd2b2lkJykgfHwgbWF0Y2hLZXl3b3JkKCd0eXBlb2YnKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpc2FibGVkLlwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXhwciA9IHBhcnNlUG9zdGZpeEV4cHJlc3Npb24oKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBmdW5jdGlvbiBiaW5hcnlQcmVjZWRlbmNlKHRva2VuLCBhbGxvd0luKSB7XG4gICAgICB2YXIgcHJlYyA9IDA7XG5cbiAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlbi5QdW5jdHVhdG9yICYmIHRva2VuLnR5cGUgIT09IFRva2VuLktleXdvcmQpIHtcbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgY2FzZSAnfHwnOlxuICAgICAgICAgIHByZWMgPSAxO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICcmJic6XG4gICAgICAgICAgcHJlYyA9IDI7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3wnOlxuICAgICAgICAgIHByZWMgPSAzO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdeJzpcbiAgICAgICAgICBwcmVjID0gNDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnJic6XG4gICAgICAgICAgcHJlYyA9IDU7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJz09JzpcbiAgICAgIGNhc2UgJyE9JzpcbiAgICAgIGNhc2UgJz09PSc6XG4gICAgICBjYXNlICchPT0nOlxuICAgICAgICAgIHByZWMgPSA2O1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICc8JzpcbiAgICAgIGNhc2UgJz4nOlxuICAgICAgY2FzZSAnPD0nOlxuICAgICAgY2FzZSAnPj0nOlxuICAgICAgY2FzZSAnaW5zdGFuY2VvZic6XG4gICAgICAgICAgcHJlYyA9IDc7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2luJzpcbiAgICAgICAgICBwcmVjID0gYWxsb3dJbiA/IDcgOiAwO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICc8PCc6XG4gICAgICBjYXNlICc+Pic6XG4gICAgICBjYXNlICc+Pj4nOlxuICAgICAgICAgIHByZWMgPSA4O1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICcrJzpcbiAgICAgIGNhc2UgJy0nOlxuICAgICAgICAgIHByZWMgPSA5O1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICcqJzpcbiAgICAgIGNhc2UgJy8nOlxuICAgICAgY2FzZSAnJSc6XG4gICAgICAgICAgcHJlYyA9IDExO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcHJlYztcbiAgfVxuXG4gIC8vIDExLjUgTXVsdGlwbGljYXRpdmUgT3BlcmF0b3JzXG4gIC8vIDExLjYgQWRkaXRpdmUgT3BlcmF0b3JzXG4gIC8vIDExLjcgQml0d2lzZSBTaGlmdCBPcGVyYXRvcnNcbiAgLy8gMTEuOCBSZWxhdGlvbmFsIE9wZXJhdG9yc1xuICAvLyAxMS45IEVxdWFsaXR5IE9wZXJhdG9yc1xuICAvLyAxMS4xMCBCaW5hcnkgQml0d2lzZSBPcGVyYXRvcnNcbiAgLy8gMTEuMTEgQmluYXJ5IExvZ2ljYWwgT3BlcmF0b3JzXG5cbiAgZnVuY3Rpb24gcGFyc2VCaW5hcnlFeHByZXNzaW9uKCkge1xuICAgICAgdmFyIG1hcmtlciwgbWFya2VycywgZXhwciwgdG9rZW4sIHByZWMsIHN0YWNrLCByaWdodCwgb3BlcmF0b3IsIGxlZnQsIGk7XG5cbiAgICAgIG1hcmtlciA9IGxvb2thaGVhZDtcbiAgICAgIGxlZnQgPSBwYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgICB0b2tlbiA9IGxvb2thaGVhZDtcbiAgICAgIHByZWMgPSBiaW5hcnlQcmVjZWRlbmNlKHRva2VuLCBzdGF0ZS5hbGxvd0luKTtcbiAgICAgIGlmIChwcmVjID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIGxlZnQ7XG4gICAgICB9XG4gICAgICB0b2tlbi5wcmVjID0gcHJlYztcbiAgICAgIGxleCgpO1xuXG4gICAgICBtYXJrZXJzID0gW21hcmtlciwgbG9va2FoZWFkXTtcbiAgICAgIHJpZ2h0ID0gcGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcblxuICAgICAgc3RhY2sgPSBbbGVmdCwgdG9rZW4sIHJpZ2h0XTtcblxuICAgICAgd2hpbGUgKChwcmVjID0gYmluYXJ5UHJlY2VkZW5jZShsb29rYWhlYWQsIHN0YXRlLmFsbG93SW4pKSA+IDApIHtcblxuICAgICAgICAgIC8vIFJlZHVjZTogbWFrZSBhIGJpbmFyeSBleHByZXNzaW9uIGZyb20gdGhlIHRocmVlIHRvcG1vc3QgZW50cmllcy5cbiAgICAgICAgICB3aGlsZSAoKHN0YWNrLmxlbmd0aCA+IDIpICYmIChwcmVjIDw9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDJdLnByZWMpKSB7XG4gICAgICAgICAgICAgIHJpZ2h0ID0gc3RhY2sucG9wKCk7XG4gICAgICAgICAgICAgIG9wZXJhdG9yID0gc3RhY2sucG9wKCkudmFsdWU7XG4gICAgICAgICAgICAgIGxlZnQgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgbWFya2Vycy5wb3AoKTtcbiAgICAgICAgICAgICAgZXhwciA9IG5ldyBXcmFwcGluZ05vZGUobWFya2Vyc1ttYXJrZXJzLmxlbmd0aCAtIDFdKS5maW5pc2hCaW5hcnlFeHByZXNzaW9uKG9wZXJhdG9yLCBsZWZ0LCByaWdodCk7XG4gICAgICAgICAgICAgIHN0YWNrLnB1c2goZXhwcik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU2hpZnQuXG4gICAgICAgICAgdG9rZW4gPSBsZXgoKTtcbiAgICAgICAgICB0b2tlbi5wcmVjID0gcHJlYztcbiAgICAgICAgICBzdGFjay5wdXNoKHRva2VuKTtcbiAgICAgICAgICBtYXJrZXJzLnB1c2gobG9va2FoZWFkKTtcbiAgICAgICAgICBleHByID0gcGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcbiAgICAgICAgICBzdGFjay5wdXNoKGV4cHIpO1xuICAgICAgfVxuXG4gICAgICAvLyBGaW5hbCByZWR1Y2UgdG8gY2xlYW4tdXAgdGhlIHN0YWNrLlxuICAgICAgaSA9IHN0YWNrLmxlbmd0aCAtIDE7XG4gICAgICBleHByID0gc3RhY2tbaV07XG4gICAgICBtYXJrZXJzLnBvcCgpO1xuICAgICAgd2hpbGUgKGkgPiAxKSB7XG4gICAgICAgICAgZXhwciA9IG5ldyBXcmFwcGluZ05vZGUobWFya2Vycy5wb3AoKSkuZmluaXNoQmluYXJ5RXhwcmVzc2lvbihzdGFja1tpIC0gMV0udmFsdWUsIHN0YWNrW2kgLSAyXSwgZXhwcik7XG4gICAgICAgICAgaSAtPSAyO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIC8vIDExLjEyIENvbmRpdGlvbmFsIE9wZXJhdG9yXG5cbiAgZnVuY3Rpb24gcGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24oKSB7XG4gICAgICB2YXIgZXhwciwgcHJldmlvdXNBbGxvd0luLCBjb25zZXF1ZW50LCBhbHRlcm5hdGUsIHN0YXJ0VG9rZW47XG5cbiAgICAgIHN0YXJ0VG9rZW4gPSBsb29rYWhlYWQ7XG5cbiAgICAgIGV4cHIgPSBwYXJzZUJpbmFyeUV4cHJlc3Npb24oKTtcblxuICAgICAgaWYgKG1hdGNoKCc/JykpIHtcbiAgICAgICAgICBsZXgoKTtcbiAgICAgICAgICBwcmV2aW91c0FsbG93SW4gPSBzdGF0ZS5hbGxvd0luO1xuICAgICAgICAgIHN0YXRlLmFsbG93SW4gPSB0cnVlO1xuICAgICAgICAgIGNvbnNlcXVlbnQgPSBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgICAgc3RhdGUuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcbiAgICAgICAgICBleHBlY3QoJzonKTtcbiAgICAgICAgICBhbHRlcm5hdGUgPSBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgICBleHByID0gbmV3IFdyYXBwaW5nTm9kZShzdGFydFRva2VuKS5maW5pc2hDb25kaXRpb25hbEV4cHJlc3Npb24oZXhwciwgY29uc2VxdWVudCwgYWx0ZXJuYXRlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICAvLyAxMS4xMyBBc3NpZ25tZW50IE9wZXJhdG9yc1xuXG4gIGZ1bmN0aW9uIHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSB7XG4gICAgICB2YXIgb2xkUGFyZW50aGVzaXNDb3VudCwgdG9rZW4sIGV4cHIsIHJpZ2h0LCBsaXN0LCBzdGFydFRva2VuO1xuXG4gICAgICBvbGRQYXJlbnRoZXNpc0NvdW50ID0gc3RhdGUucGFyZW50aGVzaXNDb3VudDtcblxuICAgICAgc3RhcnRUb2tlbiA9IGxvb2thaGVhZDtcbiAgICAgIHRva2VuID0gbG9va2FoZWFkO1xuXG4gICAgICBleHByID0gcGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24oKTtcblxuICAgICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICAvLyAxMS4xNCBDb21tYSBPcGVyYXRvclxuXG4gIGZ1bmN0aW9uIHBhcnNlRXhwcmVzc2lvbigpIHtcbiAgICAgIHZhciBleHByLCBzdGFydFRva2VuID0gbG9va2FoZWFkLCBleHByZXNzaW9ucztcblxuICAgICAgZXhwciA9IHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcblxuICAgICAgaWYgKG1hdGNoKCcsJykpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEaXNhYmxlZC5cIik7IC8vIG5vIHNlcXVlbmNlIGV4cHJlc3Npb25zXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgLy8gMTIuNCBFeHByZXNzaW9uIFN0YXRlbWVudFxuXG4gIGZ1bmN0aW9uIHBhcnNlRXhwcmVzc2lvblN0YXRlbWVudChub2RlKSB7XG4gICAgICB2YXIgZXhwciA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgY29uc3VtZVNlbWljb2xvbigpO1xuICAgICAgcmV0dXJuIG5vZGUuZmluaXNoRXhwcmVzc2lvblN0YXRlbWVudChleHByKTtcbiAgfVxuXG4gIC8vIDEyIFN0YXRlbWVudHNcblxuICBmdW5jdGlvbiBwYXJzZVN0YXRlbWVudCgpIHtcbiAgICAgIHZhciB0eXBlID0gbG9va2FoZWFkLnR5cGUsXG4gICAgICAgICAgZXhwcixcbiAgICAgICAgICBsYWJlbGVkQm9keSxcbiAgICAgICAgICBrZXksXG4gICAgICAgICAgbm9kZTtcblxuICAgICAgaWYgKHR5cGUgPT09IFRva2VuLkVPRikge1xuICAgICAgICAgIHRocm93VW5leHBlY3RlZChsb29rYWhlYWQpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZSA9PT0gVG9rZW4uUHVuY3R1YXRvciAmJiBsb29rYWhlYWQudmFsdWUgPT09ICd7Jykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpc2FibGVkLlwiKTsgLy8gYmxvY2sgc3RhdGVtZW50XG4gICAgICB9XG5cbiAgICAgIG5vZGUgPSBuZXcgTm9kZSgpO1xuXG4gICAgICBpZiAodHlwZSA9PT0gVG9rZW4uUHVuY3R1YXRvcikge1xuICAgICAgICAgIHN3aXRjaCAobG9va2FoZWFkLnZhbHVlKSB7XG4gICAgICAgICAgY2FzZSAnOyc6XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpc2FibGVkLlwiKTsgLy8gZW1wdHkgc3RhdGVtZW50XG4gICAgICAgICAgY2FzZSAnKCc6XG4gICAgICAgICAgICAgIHJldHVybiBwYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSk7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBUb2tlbi5LZXl3b3JkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGlzYWJsZWQuXCIpOyAvLyBrZXl3b3JkXG4gICAgICB9XG5cbiAgICAgIGV4cHIgPSBwYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIGNvbnN1bWVTZW1pY29sb24oKTtcbiAgICAgIHJldHVybiBub2RlLmZpbmlzaEV4cHJlc3Npb25TdGF0ZW1lbnQoZXhwcik7XG4gIH1cblxuICAvLyAxNCBQcm9ncmFtXG5cbiAgZnVuY3Rpb24gcGFyc2VTb3VyY2VFbGVtZW50KCkge1xuICAgICAgaWYgKGxvb2thaGVhZC50eXBlID09PSBUb2tlbi5LZXl3b3JkKSB7XG4gICAgICAgICAgc3dpdGNoIChsb29rYWhlYWQudmFsdWUpIHtcbiAgICAgICAgICBjYXNlICdjb25zdCc6XG4gICAgICAgICAgY2FzZSAnbGV0JzpcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGlzYWJsZWQuXCIpO1xuICAgICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGlzYWJsZWQuXCIpO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHJldHVybiBwYXJzZVN0YXRlbWVudCgpO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGxvb2thaGVhZC50eXBlICE9PSBUb2tlbi5FT0YpIHtcbiAgICAgICAgICByZXR1cm4gcGFyc2VTdGF0ZW1lbnQoKTtcbiAgICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlU291cmNlRWxlbWVudHMoKSB7XG4gICAgICB2YXIgc291cmNlRWxlbWVudCwgc291cmNlRWxlbWVudHMgPSBbXSwgdG9rZW4sIGRpcmVjdGl2ZSwgZmlyc3RSZXN0cmljdGVkO1xuXG4gICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICB0b2tlbiA9IGxvb2thaGVhZDtcbiAgICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW4uU3RyaW5nTGl0ZXJhbCkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzb3VyY2VFbGVtZW50ID0gcGFyc2VTb3VyY2VFbGVtZW50KCk7XG4gICAgICAgICAgc291cmNlRWxlbWVudHMucHVzaChzb3VyY2VFbGVtZW50KTtcbiAgICAgICAgICBpZiAoc291cmNlRWxlbWVudC5leHByZXNzaW9uLnR5cGUgIT09IFN5bnRheC5MaXRlcmFsKSB7XG4gICAgICAgICAgICAgIC8vIHRoaXMgaXMgbm90IGRpcmVjdGl2ZVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgZGlyZWN0aXZlID0gc291cmNlLnNsaWNlKHRva2VuLnN0YXJ0ICsgMSwgdG9rZW4uZW5kIC0gMSk7XG4gICAgICAgICAgaWYgKGRpcmVjdGl2ZSA9PT0gJ3VzZSBzdHJpY3QnKSB7XG4gICAgICAgICAgICAgIHN0cmljdCA9IHRydWU7XG4gICAgICAgICAgICAgIGlmIChmaXJzdFJlc3RyaWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgIHRocm93RXJyb3JUb2xlcmFudChmaXJzdFJlc3RyaWN0ZWQsIE1lc3NhZ2VzLlN0cmljdE9jdGFsTGl0ZXJhbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoIWZpcnN0UmVzdHJpY3RlZCAmJiB0b2tlbi5vY3RhbCkge1xuICAgICAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgIHNvdXJjZUVsZW1lbnQgPSBwYXJzZVNvdXJjZUVsZW1lbnQoKTtcbiAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZUVsZW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzb3VyY2VFbGVtZW50cy5wdXNoKHNvdXJjZUVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNvdXJjZUVsZW1lbnRzO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VQcm9ncmFtKCkge1xuICAgICAgdmFyIGJvZHksIG5vZGU7XG5cbiAgICAgIHNraXBDb21tZW50KCk7XG4gICAgICBwZWVrKCk7XG4gICAgICBub2RlID0gbmV3IE5vZGUoKTtcbiAgICAgIHN0cmljdCA9IHRydWU7IC8vIGFzc3VtZSBzdHJpY3RcblxuICAgICAgYm9keSA9IHBhcnNlU291cmNlRWxlbWVudHMoKTtcbiAgICAgIHJldHVybiBub2RlLmZpbmlzaFByb2dyYW0oYm9keSk7XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXJUb2tlbkxvY2F0aW9uKCkge1xuICAgICAgdmFyIGksIGVudHJ5LCB0b2tlbiwgdG9rZW5zID0gW107XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBleHRyYS50b2tlbnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBlbnRyeSA9IGV4dHJhLnRva2Vuc1tpXTtcbiAgICAgICAgICB0b2tlbiA9IHtcbiAgICAgICAgICAgICAgdHlwZTogZW50cnkudHlwZSxcbiAgICAgICAgICAgICAgdmFsdWU6IGVudHJ5LnZhbHVlXG4gICAgICAgICAgfTtcbiAgICAgICAgICBpZiAoZW50cnkucmVnZXgpIHtcbiAgICAgICAgICAgICAgdG9rZW4ucmVnZXggPSB7XG4gICAgICAgICAgICAgICAgICBwYXR0ZXJuOiBlbnRyeS5yZWdleC5wYXR0ZXJuLFxuICAgICAgICAgICAgICAgICAgZmxhZ3M6IGVudHJ5LnJlZ2V4LmZsYWdzXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChleHRyYS5yYW5nZSkge1xuICAgICAgICAgICAgICB0b2tlbi5yYW5nZSA9IGVudHJ5LnJhbmdlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZXh0cmEubG9jKSB7XG4gICAgICAgICAgICAgIHRva2VuLmxvYyA9IGVudHJ5LmxvYztcbiAgICAgICAgICB9XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgfVxuXG4gICAgICBleHRyYS50b2tlbnMgPSB0b2tlbnM7XG4gIH1cblxuICBmdW5jdGlvbiB0b2tlbml6ZShjb2RlLCBvcHRpb25zKSB7XG4gICAgICB2YXIgdG9TdHJpbmcsXG4gICAgICAgICAgdG9rZW5zO1xuXG4gICAgICB0b1N0cmluZyA9IFN0cmluZztcbiAgICAgIGlmICh0eXBlb2YgY29kZSAhPT0gJ3N0cmluZycgJiYgIShjb2RlIGluc3RhbmNlb2YgU3RyaW5nKSkge1xuICAgICAgICAgIGNvZGUgPSB0b1N0cmluZyhjb2RlKTtcbiAgICAgIH1cblxuICAgICAgc291cmNlID0gY29kZTtcbiAgICAgIGluZGV4ID0gMDtcbiAgICAgIGxpbmVOdW1iZXIgPSAoc291cmNlLmxlbmd0aCA+IDApID8gMSA6IDA7XG4gICAgICBsaW5lU3RhcnQgPSAwO1xuICAgICAgbGVuZ3RoID0gc291cmNlLmxlbmd0aDtcbiAgICAgIGxvb2thaGVhZCA9IG51bGw7XG4gICAgICBzdGF0ZSA9IHtcbiAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgIGxhYmVsU2V0OiB7fSxcbiAgICAgICAgICBpbkZ1bmN0aW9uQm9keTogZmFsc2UsXG4gICAgICAgICAgaW5JdGVyYXRpb246IGZhbHNlLFxuICAgICAgICAgIGluU3dpdGNoOiBmYWxzZSxcbiAgICAgICAgICBsYXN0Q29tbWVudFN0YXJ0OiAtMVxuICAgICAgfTtcblxuICAgICAgZXh0cmEgPSB7fTtcblxuICAgICAgLy8gT3B0aW9ucyBtYXRjaGluZy5cbiAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAvLyBPZiBjb3Vyc2Ugd2UgY29sbGVjdCB0b2tlbnMgaGVyZS5cbiAgICAgIG9wdGlvbnMudG9rZW5zID0gdHJ1ZTtcbiAgICAgIGV4dHJhLnRva2VucyA9IFtdO1xuICAgICAgZXh0cmEudG9rZW5pemUgPSB0cnVlO1xuICAgICAgLy8gVGhlIGZvbGxvd2luZyB0d28gZmllbGRzIGFyZSBuZWNlc3NhcnkgdG8gY29tcHV0ZSB0aGUgUmVnZXggdG9rZW5zLlxuICAgICAgZXh0cmEub3BlblBhcmVuVG9rZW4gPSAtMTtcbiAgICAgIGV4dHJhLm9wZW5DdXJseVRva2VuID0gLTE7XG5cbiAgICAgIGV4dHJhLnJhbmdlID0gKHR5cGVvZiBvcHRpb25zLnJhbmdlID09PSAnYm9vbGVhbicpICYmIG9wdGlvbnMucmFuZ2U7XG4gICAgICBleHRyYS5sb2MgPSAodHlwZW9mIG9wdGlvbnMubG9jID09PSAnYm9vbGVhbicpICYmIG9wdGlvbnMubG9jO1xuXG4gICAgICBpZiAodHlwZW9mIG9wdGlvbnMudG9sZXJhbnQgPT09ICdib29sZWFuJyAmJiBvcHRpb25zLnRvbGVyYW50KSB7XG4gICAgICAgICAgZXh0cmEuZXJyb3JzID0gW107XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgICAgcGVlaygpO1xuICAgICAgICAgIGlmIChsb29rYWhlYWQudHlwZSA9PT0gVG9rZW4uRU9GKSB7XG4gICAgICAgICAgICAgIHJldHVybiBleHRyYS50b2tlbnM7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV4KCk7XG4gICAgICAgICAgd2hpbGUgKGxvb2thaGVhZC50eXBlICE9PSBUb2tlbi5FT0YpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgIGxleCgpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChsZXhFcnJvcikge1xuICAgICAgICAgICAgICAgICAgaWYgKGV4dHJhLmVycm9ycykge1xuICAgICAgICAgICAgICAgICAgICAgIGV4dHJhLmVycm9ycy5wdXNoKGxleEVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBoYXZlIHRvIGJyZWFrIG9uIHRoZSBmaXJzdCBlcnJvclxuICAgICAgICAgICAgICAgICAgICAgIC8vIHRvIGF2b2lkIGluZmluaXRlIGxvb3BzLlxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBsZXhFcnJvcjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZpbHRlclRva2VuTG9jYXRpb24oKTtcbiAgICAgICAgICB0b2tlbnMgPSBleHRyYS50b2tlbnM7XG4gICAgICAgICAgaWYgKHR5cGVvZiBleHRyYS5lcnJvcnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIHRva2Vucy5lcnJvcnMgPSBleHRyYS5lcnJvcnM7XG4gICAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHRocm93IGU7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGV4dHJhID0ge307XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9rZW5zO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2UoY29kZSwgb3B0aW9ucykge1xuICAgICAgdmFyIHByb2dyYW0sIHRvU3RyaW5nO1xuXG4gICAgICB0b1N0cmluZyA9IFN0cmluZztcbiAgICAgIGlmICh0eXBlb2YgY29kZSAhPT0gJ3N0cmluZycgJiYgIShjb2RlIGluc3RhbmNlb2YgU3RyaW5nKSkge1xuICAgICAgICAgIGNvZGUgPSB0b1N0cmluZyhjb2RlKTtcbiAgICAgIH1cblxuICAgICAgc291cmNlID0gY29kZTtcbiAgICAgIGluZGV4ID0gMDtcbiAgICAgIGxpbmVOdW1iZXIgPSAoc291cmNlLmxlbmd0aCA+IDApID8gMSA6IDA7XG4gICAgICBsaW5lU3RhcnQgPSAwO1xuICAgICAgbGVuZ3RoID0gc291cmNlLmxlbmd0aDtcbiAgICAgIGxvb2thaGVhZCA9IG51bGw7XG4gICAgICBzdGF0ZSA9IHtcbiAgICAgICAgICBhbGxvd0luOiB0cnVlLFxuICAgICAgICAgIGxhYmVsU2V0OiB7fSxcbiAgICAgICAgICBwYXJlbnRoZXNpc0NvdW50OiAwLFxuICAgICAgICAgIGluRnVuY3Rpb25Cb2R5OiBmYWxzZSxcbiAgICAgICAgICBpbkl0ZXJhdGlvbjogZmFsc2UsXG4gICAgICAgICAgaW5Td2l0Y2g6IGZhbHNlLFxuICAgICAgICAgIGxhc3RDb21tZW50U3RhcnQ6IC0xXG4gICAgICB9O1xuXG4gICAgICBleHRyYSA9IHt9O1xuICAgICAgaWYgKHR5cGVvZiBvcHRpb25zICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGV4dHJhLnJhbmdlID0gKHR5cGVvZiBvcHRpb25zLnJhbmdlID09PSAnYm9vbGVhbicpICYmIG9wdGlvbnMucmFuZ2U7XG4gICAgICAgICAgZXh0cmEubG9jID0gKHR5cGVvZiBvcHRpb25zLmxvYyA9PT0gJ2Jvb2xlYW4nKSAmJiBvcHRpb25zLmxvYztcblxuICAgICAgICAgIGlmIChleHRyYS5sb2MgJiYgb3B0aW9ucy5zb3VyY2UgIT09IG51bGwgJiYgb3B0aW9ucy5zb3VyY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBleHRyYS5zb3VyY2UgPSB0b1N0cmluZyhvcHRpb25zLnNvdXJjZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRva2VucyA9PT0gJ2Jvb2xlYW4nICYmIG9wdGlvbnMudG9rZW5zKSB7XG4gICAgICAgICAgICAgIGV4dHJhLnRva2VucyA9IFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudG9sZXJhbnQgPT09ICdib29sZWFuJyAmJiBvcHRpb25zLnRvbGVyYW50KSB7XG4gICAgICAgICAgICAgIGV4dHJhLmVycm9ycyA9IFtdO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgICBwcm9ncmFtID0gcGFyc2VQcm9ncmFtKCk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBleHRyYS50b2tlbnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIGZpbHRlclRva2VuTG9jYXRpb24oKTtcbiAgICAgICAgICAgICAgcHJvZ3JhbS50b2tlbnMgPSBleHRyYS50b2tlbnM7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0eXBlb2YgZXh0cmEuZXJyb3JzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBwcm9ncmFtLmVycm9ycyA9IGV4dHJhLmVycm9ycztcbiAgICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgZXh0cmEgPSB7fTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByb2dyYW07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHRva2VuaXplOiB0b2tlbml6ZSxcbiAgICBwYXJzZTogcGFyc2VcbiAgfTtcblxufSkoKTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgYXhzID0gcmVxdWlyZSgnLi4vc2NlbmUvYXhpcycpLFxuICAgIGNvbmZpZyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uZmlnJyk7XG5cbnZhciBPUklFTlQgPSB7XG4gIFwieFwiOiAgICAgIFwiYm90dG9tXCIsXG4gIFwieVwiOiAgICAgIFwibGVmdFwiLFxuICBcInRvcFwiOiAgICBcInRvcFwiLFxuICBcImJvdHRvbVwiOiBcImJvdHRvbVwiLFxuICBcImxlZnRcIjogICBcImxlZnRcIixcbiAgXCJyaWdodFwiOiAgXCJyaWdodFwiXG59O1xuXG5mdW5jdGlvbiBheGVzKG1vZGVsLCBzcGVjLCBheGVzLCBncm91cCkge1xuICAoc3BlYyB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbihkZWYsIGluZGV4KSB7XG4gICAgYXhlc1tpbmRleF0gPSBheGVzW2luZGV4XSB8fCBheHMobW9kZWwpO1xuICAgIGF4aXMoZGVmLCBpbmRleCwgYXhlc1tpbmRleF0sIGdyb3VwKTtcbiAgfSk7XG59O1xuXG5mdW5jdGlvbiBheGlzKGRlZiwgaW5kZXgsIGF4aXMsIGdyb3VwKSB7XG4gIC8vIGF4aXMgc2NhbGVcbiAgaWYgKGRlZi5zY2FsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgYXhpcy5zY2FsZShncm91cC5zY2FsZShkZWYuc2NhbGUpKTtcbiAgfVxuXG4gIC8vIGF4aXMgb3JpZW50YXRpb25cbiAgYXhpcy5vcmllbnQoZGVmLm9yaWVudCB8fCBPUklFTlRbZGVmLnR5cGVdKTtcbiAgLy8gYXhpcyBvZmZzZXRcbiAgYXhpcy5vZmZzZXQoZGVmLm9mZnNldCB8fCAwKTtcbiAgLy8gYXhpcyBsYXllclxuICBheGlzLmxheWVyKGRlZi5sYXllciB8fCBcImZyb250XCIpO1xuICAvLyBheGlzIGdyaWQgbGluZXNcbiAgYXhpcy5ncmlkKGRlZi5ncmlkIHx8IGZhbHNlKTtcbiAgLy8gYXhpcyB0aXRsZVxuICBheGlzLnRpdGxlKGRlZi50aXRsZSB8fCBudWxsKTtcbiAgLy8gYXhpcyB0aXRsZSBvZmZzZXRcbiAgYXhpcy50aXRsZU9mZnNldChkZWYudGl0bGVPZmZzZXQgIT0gbnVsbFxuICAgID8gZGVmLnRpdGxlT2Zmc2V0IDogY29uZmlnLmF4aXMudGl0bGVPZmZzZXQpO1xuICAvLyBheGlzIHZhbHVlc1xuICBheGlzLnRpY2tWYWx1ZXMoZGVmLnZhbHVlcyB8fCBudWxsKTtcbiAgLy8gYXhpcyBsYWJlbCBmb3JtYXR0aW5nXG4gIGF4aXMudGlja0Zvcm1hdChkZWYuZm9ybWF0IHx8IG51bGwpO1xuICAvLyBheGlzIHRpY2sgc3ViZGl2aXNpb25cbiAgYXhpcy50aWNrU3ViZGl2aWRlKGRlZi5zdWJkaXZpZGUgfHwgMCk7XG4gIC8vIGF4aXMgdGljayBwYWRkaW5nXG4gIGF4aXMudGlja1BhZGRpbmcoZGVmLnRpY2tQYWRkaW5nIHx8IGNvbmZpZy5heGlzLnBhZGRpbmcpO1xuXG4gIC8vIGF4aXMgdGljayBzaXplKHMpXG4gIHZhciBzaXplID0gW107XG4gIGlmIChkZWYudGlja1NpemUgIT09IHVuZGVmaW5lZCkge1xuICAgIGZvciAodmFyIGk9MDsgaTwzOyArK2kpIHNpemUucHVzaChkZWYudGlja1NpemUpO1xuICB9IGVsc2Uge1xuICAgIHZhciB0cyA9IGNvbmZpZy5heGlzLnRpY2tTaXplO1xuICAgIHNpemUgPSBbdHMsIHRzLCB0c107XG4gIH1cbiAgaWYgKGRlZi50aWNrU2l6ZU1ham9yICE9IG51bGwpIHNpemVbMF0gPSBkZWYudGlja1NpemVNYWpvcjtcbiAgaWYgKGRlZi50aWNrU2l6ZU1pbm9yICE9IG51bGwpIHNpemVbMV0gPSBkZWYudGlja1NpemVNaW5vcjtcbiAgaWYgKGRlZi50aWNrU2l6ZUVuZCAgICE9IG51bGwpIHNpemVbMl0gPSBkZWYudGlja1NpemVFbmQ7XG4gIGlmIChzaXplLmxlbmd0aCkge1xuICAgIGF4aXMudGlja1NpemUuYXBwbHkoYXhpcywgc2l6ZSk7XG4gIH1cblxuICAvLyB0aWNrIGFyZ3VtZW50c1xuICBpZiAoZGVmLnRpY2tzICE9IG51bGwpIHtcbiAgICB2YXIgdGlja3MgPSBkbC5pc0FycmF5KGRlZi50aWNrcykgPyBkZWYudGlja3MgOiBbZGVmLnRpY2tzXTtcbiAgICBheGlzLnRpY2tzLmFwcGx5KGF4aXMsIHRpY2tzKTtcbiAgfSBlbHNlIHtcbiAgICBheGlzLnRpY2tzKGNvbmZpZy5heGlzLnRpY2tzKTtcbiAgfVxuXG4gIC8vIHN0eWxlIHByb3BlcnRpZXNcbiAgdmFyIHAgPSBkZWYucHJvcGVydGllcztcbiAgaWYgKHAgJiYgcC50aWNrcykge1xuICAgIGF4aXMubWFqb3JUaWNrUHJvcGVydGllcyhwLm1ham9yVGlja3NcbiAgICAgID8gZGwuZXh0ZW5kKHt9LCBwLnRpY2tzLCBwLm1ham9yVGlja3MpIDogcC50aWNrcyk7XG4gICAgYXhpcy5taW5vclRpY2tQcm9wZXJ0aWVzKHAubWlub3JUaWNrc1xuICAgICAgPyBkbC5leHRlbmQoe30sIHAudGlja3MsIHAubWlub3JUaWNrcykgOiBwLnRpY2tzKTtcbiAgfSBlbHNlIHtcbiAgICBheGlzLm1ham9yVGlja1Byb3BlcnRpZXMocCAmJiBwLm1ham9yVGlja3MgfHwge30pO1xuICAgIGF4aXMubWlub3JUaWNrUHJvcGVydGllcyhwICYmIHAubWlub3JUaWNrcyB8fCB7fSk7XG4gIH1cbiAgYXhpcy50aWNrTGFiZWxQcm9wZXJ0aWVzKHAgJiYgcC5sYWJlbHMgfHwge30pO1xuICBheGlzLnRpdGxlUHJvcGVydGllcyhwICYmIHAudGl0bGUgfHwge30pO1xuICBheGlzLmdyaWRMaW5lUHJvcGVydGllcyhwICYmIHAuZ3JpZCB8fCB7fSk7XG4gIGF4aXMuZG9tYWluUHJvcGVydGllcyhwICYmIHAuYXhpcyB8fCB7fSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXhlczsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgY29uZmlnID0gcmVxdWlyZSgnLi4vdXRpbC9jb25maWcnKSxcbiAgICBwYXJzZVRyYW5zZm9ybXMgPSByZXF1aXJlKCcuL3RyYW5zZm9ybXMnKSxcbiAgICBwYXJzZU1vZGlmeSA9IHJlcXVpcmUoJy4vbW9kaWZ5Jyk7XG5cbnZhciBwYXJzZURhdGEgPSBmdW5jdGlvbihtb2RlbCwgc3BlYywgY2FsbGJhY2spIHtcbiAgdmFyIGNvdW50ID0gMDtcblxuICBmdW5jdGlvbiBsb2FkZWQoZCkge1xuICAgIHJldHVybiBmdW5jdGlvbihlcnJvciwgZGF0YSkge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIGRsLmVycm9yKFwiTE9BRElORyBGQUlMRUQ6IFwiICsgZC51cmwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbW9kZWwuZGF0YShkLm5hbWUpLnZhbHVlcyhkbC5yZWFkKGRhdGEsIGQuZm9ybWF0KSk7XG4gICAgICB9XG4gICAgICBpZiAoLS1jb3VudCA9PT0gMCkgY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cblxuICAvLyBwcm9jZXNzIGVhY2ggZGF0YSBzZXQgZGVmaW5pdGlvblxuICAoc3BlYyB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgaWYgKGQudXJsKSB7XG4gICAgICBjb3VudCArPSAxO1xuICAgICAgZGwubG9hZChkbC5leHRlbmQoe3VybDogZC51cmx9LCBjb25maWcubG9hZCksIGxvYWRlZChkKSk7XG4gICAgfVxuICAgIHBhcnNlRGF0YS5kYXRhc291cmNlKG1vZGVsLCBkKTtcbiAgfSk7XG5cbiAgaWYgKGNvdW50ID09PSAwKSBzZXRUaW1lb3V0KGNhbGxiYWNrLCAxKTtcbiAgcmV0dXJuIHNwZWM7XG59O1xuXG5wYXJzZURhdGEuZGF0YXNvdXJjZSA9IGZ1bmN0aW9uKG1vZGVsLCBkKSB7XG4gIHZhciB0cmFuc2Zvcm0gPSAoZC50cmFuc2Zvcm18fFtdKS5tYXAoZnVuY3Rpb24odCkgeyByZXR1cm4gcGFyc2VUcmFuc2Zvcm1zKG1vZGVsLCB0KSB9KSxcbiAgICAgIG1vZCA9IChkLm1vZGlmeXx8W10pLm1hcChmdW5jdGlvbihtKSB7IHJldHVybiBwYXJzZU1vZGlmeShtb2RlbCwgbSwgZCkgfSksXG4gICAgICBkcyA9IG1vZGVsLmRhdGEoZC5uYW1lLCBtb2QuY29uY2F0KHRyYW5zZm9ybSkpO1xuXG4gIGlmIChkLnZhbHVlcykge1xuICAgIGRzLnZhbHVlcyhkbC5yZWFkKGQudmFsdWVzLCBkLmZvcm1hdCkpO1xuICB9IGVsc2UgaWYgKGQuc291cmNlKSB7XG4gICAgZHMuc291cmNlKGQuc291cmNlKVxuICAgICAgLnJldmlzZXMoZHMucmV2aXNlcygpKSAvLyBJZiBuZXcgZHMgcmV2aXNlcywgdGhlbiBpdCdzIG9yaWdpbiBtdXN0IHJldmlzZSB0b28uXG4gICAgICAuYWRkTGlzdGVuZXIoZHMpOyAgLy8gRGVyaXZlZCBkcyB3aWxsIGJlIHB1bHNlZCBieSBpdHMgc3JjIHJhdGhlciB0aGFuIHRoZSBtb2RlbC5cbiAgICBtb2RlbC5yZW1vdmVMaXN0ZW5lcihkcy5waXBlbGluZSgpWzBdKTsgXG4gIH1cblxuICByZXR1cm4gZHM7ICAgIFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZURhdGE7IiwiLypcbiAqIEdlbmVyYXRlZCBieSBQRUcuanMgMC44LjAuXG4gKlxuICogaHR0cDovL3BlZ2pzLm1hamRhLmN6L1xuICovXG5cbmZ1bmN0aW9uIHBlZyRzdWJjbGFzcyhjaGlsZCwgcGFyZW50KSB7XG4gIGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfVxuICBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7XG4gIGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7XG59XG5cbmZ1bmN0aW9uIFN5bnRheEVycm9yKG1lc3NhZ2UsIGV4cGVjdGVkLCBmb3VuZCwgb2Zmc2V0LCBsaW5lLCBjb2x1bW4pIHtcbiAgdGhpcy5tZXNzYWdlICA9IG1lc3NhZ2U7XG4gIHRoaXMuZXhwZWN0ZWQgPSBleHBlY3RlZDtcbiAgdGhpcy5mb3VuZCAgICA9IGZvdW5kO1xuICB0aGlzLm9mZnNldCAgID0gb2Zmc2V0O1xuICB0aGlzLmxpbmUgICAgID0gbGluZTtcbiAgdGhpcy5jb2x1bW4gICA9IGNvbHVtbjtcblxuICB0aGlzLm5hbWUgICAgID0gXCJTeW50YXhFcnJvclwiO1xufVxuXG5wZWckc3ViY2xhc3MoU3ludGF4RXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gcGFyc2UoaW5wdXQpIHtcbiAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IHt9LFxuXG4gICAgICBwZWckRkFJTEVEID0ge30sXG5cbiAgICAgIHBlZyRzdGFydFJ1bGVGdW5jdGlvbnMgPSB7IHN0YXJ0OiBwZWckcGFyc2VzdGFydCB9LFxuICAgICAgcGVnJHN0YXJ0UnVsZUZ1bmN0aW9uICA9IHBlZyRwYXJzZXN0YXJ0LFxuXG4gICAgICBwZWckYzAgPSBwZWckRkFJTEVELFxuICAgICAgcGVnJGMxID0gXCIsXCIsXG4gICAgICBwZWckYzIgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCIsXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCIsXFxcIlwiIH0sXG4gICAgICBwZWckYzMgPSBmdW5jdGlvbihvLCBtKSB7IHJldHVybiBbb10uY29uY2F0KG0pIH0sXG4gICAgICBwZWckYzQgPSBmdW5jdGlvbihvKSB7IHJldHVybiBbb10gfSxcbiAgICAgIHBlZyRjNSA9IFwiW1wiLFxuICAgICAgcGVnJGM2ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiW1wiLCBkZXNjcmlwdGlvbjogXCJcXFwiW1xcXCJcIiB9LFxuICAgICAgcGVnJGM3ID0gXCJdXCIsXG4gICAgICBwZWckYzggPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJdXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJdXFxcIlwiIH0sXG4gICAgICBwZWckYzkgPSBcIj5cIixcbiAgICAgIHBlZyRjMTAgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCI+XCIsIGRlc2NyaXB0aW9uOiBcIlxcXCI+XFxcIlwiIH0sXG4gICAgICBwZWckYzExID0gZnVuY3Rpb24oZjEsIGYyLCBvKSB7IHJldHVybiB7c3RhcnQ6IGYxLCBlbmQ6IGYyLCBtaWRkbGU6IG99fSxcbiAgICAgIHBlZyRjMTIgPSBbXSxcbiAgICAgIHBlZyRjMTMgPSBmdW5jdGlvbihzLCBmKSB7IHJldHVybiAocy5maWx0ZXJzID0gZiksIHMgfSxcbiAgICAgIHBlZyRjMTQgPSBmdW5jdGlvbihzKSB7IHJldHVybiBzIH0sXG4gICAgICBwZWckYzE1ID0gbnVsbCxcbiAgICAgIHBlZyRjMTYgPSBmdW5jdGlvbih0LCBlKSB7IHJldHVybiB7IGV2ZW50OiBlLCB0YXJnZXQ6IHQgfSB9LFxuICAgICAgcGVnJGMxNyA9IC9eWzphLXpBLXowLTlfXFwtXS8sXG4gICAgICBwZWckYzE4ID0geyB0eXBlOiBcImNsYXNzXCIsIHZhbHVlOiBcIls6YS16QS16MC05X1xcXFwtXVwiLCBkZXNjcmlwdGlvbjogXCJbOmEtekEtejAtOV9cXFxcLV1cIiB9LFxuICAgICAgcGVnJGMxOSA9IGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHsgc2lnbmFsOiBzLmpvaW4oXCJcIikgfX0sXG4gICAgICBwZWckYzIwID0gXCIoXCIsXG4gICAgICBwZWckYzIxID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiKFwiLCBkZXNjcmlwdGlvbjogXCJcXFwiKFxcXCJcIiB9LFxuICAgICAgcGVnJGMyMiA9IFwiKVwiLFxuICAgICAgcGVnJGMyMyA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIilcIiwgZGVzY3JpcHRpb246IFwiXFxcIilcXFwiXCIgfSxcbiAgICAgIHBlZyRjMjQgPSBmdW5jdGlvbihtKSB7IHJldHVybiB7IHN0cmVhbTogbSB9fSxcbiAgICAgIHBlZyRjMjUgPSBcIi5cIixcbiAgICAgIHBlZyRjMjYgPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCIuXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCIuXFxcIlwiIH0sXG4gICAgICBwZWckYzI3ID0gXCI6XCIsXG4gICAgICBwZWckYzI4ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiOlwiLCBkZXNjcmlwdGlvbjogXCJcXFwiOlxcXCJcIiB9LFxuICAgICAgcGVnJGMyOSA9IGZ1bmN0aW9uKGMpIHsgcmV0dXJuIHsgdHlwZTonY2xhc3MnLCB2YWx1ZTogYyB9IH0sXG4gICAgICBwZWckYzMwID0gXCIjXCIsXG4gICAgICBwZWckYzMxID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiI1wiLCBkZXNjcmlwdGlvbjogXCJcXFwiI1xcXCJcIiB9LFxuICAgICAgcGVnJGMzMiA9IGZ1bmN0aW9uKGlkKSB7IHJldHVybiB7IHR5cGU6J2lkJywgdmFsdWU6IGlkIH0gfSxcbiAgICAgIHBlZyRjMzMgPSBcIm1vdXNlZG93blwiLFxuICAgICAgcGVnJGMzNCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIm1vdXNlZG93blwiLCBkZXNjcmlwdGlvbjogXCJcXFwibW91c2Vkb3duXFxcIlwiIH0sXG4gICAgICBwZWckYzM1ID0gXCJtb3VzZXVwXCIsXG4gICAgICBwZWckYzM2ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwibW91c2V1cFwiLCBkZXNjcmlwdGlvbjogXCJcXFwibW91c2V1cFxcXCJcIiB9LFxuICAgICAgcGVnJGMzNyA9IFwiY2xpY2tcIixcbiAgICAgIHBlZyRjMzggPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJjbGlja1wiLCBkZXNjcmlwdGlvbjogXCJcXFwiY2xpY2tcXFwiXCIgfSxcbiAgICAgIHBlZyRjMzkgPSBcImRibGNsaWNrXCIsXG4gICAgICBwZWckYzQwID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwiZGJsY2xpY2tcIiwgZGVzY3JpcHRpb246IFwiXFxcImRibGNsaWNrXFxcIlwiIH0sXG4gICAgICBwZWckYzQxID0gXCJ3aGVlbFwiLFxuICAgICAgcGVnJGM0MiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIndoZWVsXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJ3aGVlbFxcXCJcIiB9LFxuICAgICAgcGVnJGM0MyA9IFwia2V5ZG93blwiLFxuICAgICAgcGVnJGM0NCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcImtleWRvd25cIiwgZGVzY3JpcHRpb246IFwiXFxcImtleWRvd25cXFwiXCIgfSxcbiAgICAgIHBlZyRjNDUgPSBcImtleXByZXNzXCIsXG4gICAgICBwZWckYzQ2ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwia2V5cHJlc3NcIiwgZGVzY3JpcHRpb246IFwiXFxcImtleXByZXNzXFxcIlwiIH0sXG4gICAgICBwZWckYzQ3ID0gXCJrZXl1cFwiLFxuICAgICAgcGVnJGM0OCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcImtleXVwXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJrZXl1cFxcXCJcIiB9LFxuICAgICAgcGVnJGM0OSA9IFwibW91c2V3aGVlbFwiLFxuICAgICAgcGVnJGM1MCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIm1vdXNld2hlZWxcIiwgZGVzY3JpcHRpb246IFwiXFxcIm1vdXNld2hlZWxcXFwiXCIgfSxcbiAgICAgIHBlZyRjNTEgPSBcIm1vdXNlbW92ZVwiLFxuICAgICAgcGVnJGM1MiA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIm1vdXNlbW92ZVwiLCBkZXNjcmlwdGlvbjogXCJcXFwibW91c2Vtb3ZlXFxcIlwiIH0sXG4gICAgICBwZWckYzUzID0gXCJtb3VzZW91dFwiLFxuICAgICAgcGVnJGM1NCA9IHsgdHlwZTogXCJsaXRlcmFsXCIsIHZhbHVlOiBcIm1vdXNlb3V0XCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJtb3VzZW91dFxcXCJcIiB9LFxuICAgICAgcGVnJGM1NSA9IFwibW91c2VvdmVyXCIsXG4gICAgICBwZWckYzU2ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwibW91c2VvdmVyXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJtb3VzZW92ZXJcXFwiXCIgfSxcbiAgICAgIHBlZyRjNTcgPSBcIm1vdXNlZW50ZXJcIixcbiAgICAgIHBlZyRjNTggPSB7IHR5cGU6IFwibGl0ZXJhbFwiLCB2YWx1ZTogXCJtb3VzZWVudGVyXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJtb3VzZWVudGVyXFxcIlwiIH0sXG4gICAgICBwZWckYzU5ID0gXCJ0b3VjaHN0YXJ0XCIsXG4gICAgICBwZWckYzYwID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwidG91Y2hzdGFydFwiLCBkZXNjcmlwdGlvbjogXCJcXFwidG91Y2hzdGFydFxcXCJcIiB9LFxuICAgICAgcGVnJGM2MSA9IFwidG91Y2htb3ZlXCIsXG4gICAgICBwZWckYzYyID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwidG91Y2htb3ZlXCIsIGRlc2NyaXB0aW9uOiBcIlxcXCJ0b3VjaG1vdmVcXFwiXCIgfSxcbiAgICAgIHBlZyRjNjMgPSBcInRvdWNoZW5kXCIsXG4gICAgICBwZWckYzY0ID0geyB0eXBlOiBcImxpdGVyYWxcIiwgdmFsdWU6IFwidG91Y2hlbmRcIiwgZGVzY3JpcHRpb246IFwiXFxcInRvdWNoZW5kXFxcIlwiIH0sXG4gICAgICBwZWckYzY1ID0gZnVuY3Rpb24oZmllbGQpIHsgcmV0dXJuIGZpZWxkICB9LFxuICAgICAgcGVnJGM2NiA9IC9eWydcImEtekEtWjAtOV8uPjw9ISBcXHRcXC1dLyxcbiAgICAgIHBlZyRjNjcgPSB7IHR5cGU6IFwiY2xhc3NcIiwgdmFsdWU6IFwiWydcXFwiYS16QS1aMC05Xy4+PD0hIFxcXFx0XFxcXC1dXCIsIGRlc2NyaXB0aW9uOiBcIlsnXFxcImEtekEtWjAtOV8uPjw9ISBcXFxcdFxcXFwtXVwiIH0sXG4gICAgICBwZWckYzY4ID0gZnVuY3Rpb24odikgeyByZXR1cm4gdi5qb2luKFwiXCIpIH0sXG4gICAgICBwZWckYzY5ID0gL15bIFxcdFxcclxcbl0vLFxuICAgICAgcGVnJGM3MCA9IHsgdHlwZTogXCJjbGFzc1wiLCB2YWx1ZTogXCJbIFxcXFx0XFxcXHJcXFxcbl1cIiwgZGVzY3JpcHRpb246IFwiWyBcXFxcdFxcXFxyXFxcXG5dXCIgfSxcblxuICAgICAgcGVnJGN1cnJQb3MgICAgICAgICAgPSAwLFxuICAgICAgcGVnJHJlcG9ydGVkUG9zICAgICAgPSAwLFxuICAgICAgcGVnJGNhY2hlZFBvcyAgICAgICAgPSAwLFxuICAgICAgcGVnJGNhY2hlZFBvc0RldGFpbHMgPSB7IGxpbmU6IDEsIGNvbHVtbjogMSwgc2VlbkNSOiBmYWxzZSB9LFxuICAgICAgcGVnJG1heEZhaWxQb3MgICAgICAgPSAwLFxuICAgICAgcGVnJG1heEZhaWxFeHBlY3RlZCAgPSBbXSxcbiAgICAgIHBlZyRzaWxlbnRGYWlscyAgICAgID0gMCxcblxuICAgICAgcGVnJHJlc3VsdDtcblxuICBpZiAoXCJzdGFydFJ1bGVcIiBpbiBvcHRpb25zKSB7XG4gICAgaWYgKCEob3B0aW9ucy5zdGFydFJ1bGUgaW4gcGVnJHN0YXJ0UnVsZUZ1bmN0aW9ucykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IHN0YXJ0IHBhcnNpbmcgZnJvbSBydWxlIFxcXCJcIiArIG9wdGlvbnMuc3RhcnRSdWxlICsgXCJcXFwiLlwiKTtcbiAgICB9XG5cbiAgICBwZWckc3RhcnRSdWxlRnVuY3Rpb24gPSBwZWckc3RhcnRSdWxlRnVuY3Rpb25zW29wdGlvbnMuc3RhcnRSdWxlXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRleHQoKSB7XG4gICAgcmV0dXJuIGlucHV0LnN1YnN0cmluZyhwZWckcmVwb3J0ZWRQb3MsIHBlZyRjdXJyUG9zKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9mZnNldCgpIHtcbiAgICByZXR1cm4gcGVnJHJlcG9ydGVkUG9zO1xuICB9XG5cbiAgZnVuY3Rpb24gbGluZSgpIHtcbiAgICByZXR1cm4gcGVnJGNvbXB1dGVQb3NEZXRhaWxzKHBlZyRyZXBvcnRlZFBvcykubGluZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbHVtbigpIHtcbiAgICByZXR1cm4gcGVnJGNvbXB1dGVQb3NEZXRhaWxzKHBlZyRyZXBvcnRlZFBvcykuY29sdW1uO1xuICB9XG5cbiAgZnVuY3Rpb24gZXhwZWN0ZWQoZGVzY3JpcHRpb24pIHtcbiAgICB0aHJvdyBwZWckYnVpbGRFeGNlcHRpb24oXG4gICAgICBudWxsLFxuICAgICAgW3sgdHlwZTogXCJvdGhlclwiLCBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb24gfV0sXG4gICAgICBwZWckcmVwb3J0ZWRQb3NcbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgIHRocm93IHBlZyRidWlsZEV4Y2VwdGlvbihtZXNzYWdlLCBudWxsLCBwZWckcmVwb3J0ZWRQb3MpO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJGNvbXB1dGVQb3NEZXRhaWxzKHBvcykge1xuICAgIGZ1bmN0aW9uIGFkdmFuY2UoZGV0YWlscywgc3RhcnRQb3MsIGVuZFBvcykge1xuICAgICAgdmFyIHAsIGNoO1xuXG4gICAgICBmb3IgKHAgPSBzdGFydFBvczsgcCA8IGVuZFBvczsgcCsrKSB7XG4gICAgICAgIGNoID0gaW5wdXQuY2hhckF0KHApO1xuICAgICAgICBpZiAoY2ggPT09IFwiXFxuXCIpIHtcbiAgICAgICAgICBpZiAoIWRldGFpbHMuc2VlbkNSKSB7IGRldGFpbHMubGluZSsrOyB9XG4gICAgICAgICAgZGV0YWlscy5jb2x1bW4gPSAxO1xuICAgICAgICAgIGRldGFpbHMuc2VlbkNSID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiXFxyXCIgfHwgY2ggPT09IFwiXFx1MjAyOFwiIHx8IGNoID09PSBcIlxcdTIwMjlcIikge1xuICAgICAgICAgIGRldGFpbHMubGluZSsrO1xuICAgICAgICAgIGRldGFpbHMuY29sdW1uID0gMTtcbiAgICAgICAgICBkZXRhaWxzLnNlZW5DUiA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGV0YWlscy5jb2x1bW4rKztcbiAgICAgICAgICBkZXRhaWxzLnNlZW5DUiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBlZyRjYWNoZWRQb3MgIT09IHBvcykge1xuICAgICAgaWYgKHBlZyRjYWNoZWRQb3MgPiBwb3MpIHtcbiAgICAgICAgcGVnJGNhY2hlZFBvcyA9IDA7XG4gICAgICAgIHBlZyRjYWNoZWRQb3NEZXRhaWxzID0geyBsaW5lOiAxLCBjb2x1bW46IDEsIHNlZW5DUjogZmFsc2UgfTtcbiAgICAgIH1cbiAgICAgIGFkdmFuY2UocGVnJGNhY2hlZFBvc0RldGFpbHMsIHBlZyRjYWNoZWRQb3MsIHBvcyk7XG4gICAgICBwZWckY2FjaGVkUG9zID0gcG9zO1xuICAgIH1cblxuICAgIHJldHVybiBwZWckY2FjaGVkUG9zRGV0YWlscztcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRmYWlsKGV4cGVjdGVkKSB7XG4gICAgaWYgKHBlZyRjdXJyUG9zIDwgcGVnJG1heEZhaWxQb3MpIHsgcmV0dXJuOyB9XG5cbiAgICBpZiAocGVnJGN1cnJQb3MgPiBwZWckbWF4RmFpbFBvcykge1xuICAgICAgcGVnJG1heEZhaWxQb3MgPSBwZWckY3VyclBvcztcbiAgICAgIHBlZyRtYXhGYWlsRXhwZWN0ZWQgPSBbXTtcbiAgICB9XG5cbiAgICBwZWckbWF4RmFpbEV4cGVjdGVkLnB1c2goZXhwZWN0ZWQpO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJGJ1aWxkRXhjZXB0aW9uKG1lc3NhZ2UsIGV4cGVjdGVkLCBwb3MpIHtcbiAgICBmdW5jdGlvbiBjbGVhbnVwRXhwZWN0ZWQoZXhwZWN0ZWQpIHtcbiAgICAgIHZhciBpID0gMTtcblxuICAgICAgZXhwZWN0ZWQuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIGlmIChhLmRlc2NyaXB0aW9uIDwgYi5kZXNjcmlwdGlvbikge1xuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfSBlbHNlIGlmIChhLmRlc2NyaXB0aW9uID4gYi5kZXNjcmlwdGlvbikge1xuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgd2hpbGUgKGkgPCBleHBlY3RlZC5sZW5ndGgpIHtcbiAgICAgICAgaWYgKGV4cGVjdGVkW2kgLSAxXSA9PT0gZXhwZWN0ZWRbaV0pIHtcbiAgICAgICAgICBleHBlY3RlZC5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYnVpbGRNZXNzYWdlKGV4cGVjdGVkLCBmb3VuZCkge1xuICAgICAgZnVuY3Rpb24gc3RyaW5nRXNjYXBlKHMpIHtcbiAgICAgICAgZnVuY3Rpb24gaGV4KGNoKSB7IHJldHVybiBjaC5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpOyB9XG5cbiAgICAgICAgcmV0dXJuIHNcbiAgICAgICAgICAucmVwbGFjZSgvXFxcXC9nLCAgICdcXFxcXFxcXCcpXG4gICAgICAgICAgLnJlcGxhY2UoL1wiL2csICAgICdcXFxcXCInKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXHgwOC9nLCAnXFxcXGInKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXHQvZywgICAnXFxcXHQnKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXG4vZywgICAnXFxcXG4nKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXGYvZywgICAnXFxcXGYnKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXHIvZywgICAnXFxcXHInKVxuICAgICAgICAgIC5yZXBsYWNlKC9bXFx4MDAtXFx4MDdcXHgwQlxceDBFXFx4MEZdL2csIGZ1bmN0aW9uKGNoKSB7IHJldHVybiAnXFxcXHgwJyArIGhleChjaCk7IH0pXG4gICAgICAgICAgLnJlcGxhY2UoL1tcXHgxMC1cXHgxRlxceDgwLVxceEZGXS9nLCAgICBmdW5jdGlvbihjaCkgeyByZXR1cm4gJ1xcXFx4JyAgKyBoZXgoY2gpOyB9KVxuICAgICAgICAgIC5yZXBsYWNlKC9bXFx1MDE4MC1cXHUwRkZGXS9nLCAgICAgICAgIGZ1bmN0aW9uKGNoKSB7IHJldHVybiAnXFxcXHUwJyArIGhleChjaCk7IH0pXG4gICAgICAgICAgLnJlcGxhY2UoL1tcXHUxMDgwLVxcdUZGRkZdL2csICAgICAgICAgZnVuY3Rpb24oY2gpIHsgcmV0dXJuICdcXFxcdScgICsgaGV4KGNoKTsgfSk7XG4gICAgICB9XG5cbiAgICAgIHZhciBleHBlY3RlZERlc2NzID0gbmV3IEFycmF5KGV4cGVjdGVkLmxlbmd0aCksXG4gICAgICAgICAgZXhwZWN0ZWREZXNjLCBmb3VuZERlc2MsIGk7XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBleHBlY3RlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICBleHBlY3RlZERlc2NzW2ldID0gZXhwZWN0ZWRbaV0uZGVzY3JpcHRpb247XG4gICAgICB9XG5cbiAgICAgIGV4cGVjdGVkRGVzYyA9IGV4cGVjdGVkLmxlbmd0aCA+IDFcbiAgICAgICAgPyBleHBlY3RlZERlc2NzLnNsaWNlKDAsIC0xKS5qb2luKFwiLCBcIilcbiAgICAgICAgICAgICsgXCIgb3IgXCJcbiAgICAgICAgICAgICsgZXhwZWN0ZWREZXNjc1tleHBlY3RlZC5sZW5ndGggLSAxXVxuICAgICAgICA6IGV4cGVjdGVkRGVzY3NbMF07XG5cbiAgICAgIGZvdW5kRGVzYyA9IGZvdW5kID8gXCJcXFwiXCIgKyBzdHJpbmdFc2NhcGUoZm91bmQpICsgXCJcXFwiXCIgOiBcImVuZCBvZiBpbnB1dFwiO1xuXG4gICAgICByZXR1cm4gXCJFeHBlY3RlZCBcIiArIGV4cGVjdGVkRGVzYyArIFwiIGJ1dCBcIiArIGZvdW5kRGVzYyArIFwiIGZvdW5kLlwiO1xuICAgIH1cblxuICAgIHZhciBwb3NEZXRhaWxzID0gcGVnJGNvbXB1dGVQb3NEZXRhaWxzKHBvcyksXG4gICAgICAgIGZvdW5kICAgICAgPSBwb3MgPCBpbnB1dC5sZW5ndGggPyBpbnB1dC5jaGFyQXQocG9zKSA6IG51bGw7XG5cbiAgICBpZiAoZXhwZWN0ZWQgIT09IG51bGwpIHtcbiAgICAgIGNsZWFudXBFeHBlY3RlZChleHBlY3RlZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBTeW50YXhFcnJvcihcbiAgICAgIG1lc3NhZ2UgIT09IG51bGwgPyBtZXNzYWdlIDogYnVpbGRNZXNzYWdlKGV4cGVjdGVkLCBmb3VuZCksXG4gICAgICBleHBlY3RlZCxcbiAgICAgIGZvdW5kLFxuICAgICAgcG9zLFxuICAgICAgcG9zRGV0YWlscy5saW5lLFxuICAgICAgcG9zRGV0YWlscy5jb2x1bW5cbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlc3RhcnQoKSB7XG4gICAgdmFyIHMwO1xuXG4gICAgczAgPSBwZWckcGFyc2VtZXJnZWQoKTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZW1lcmdlZCgpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczMsIHM0LCBzNTtcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgczEgPSBwZWckcGFyc2VvcmRlcmVkKCk7XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZXNlcCgpO1xuICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDQpIHtcbiAgICAgICAgICBzMyA9IHBlZyRjMTtcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMik7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzNCA9IHBlZyRwYXJzZXNlcCgpO1xuICAgICAgICAgIGlmIChzNCAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgczUgPSBwZWckcGFyc2VtZXJnZWQoKTtcbiAgICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczEgPSBwZWckYzMoczEsIHM1KTtcbiAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckYzA7XG4gICAgfVxuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAgPSBwZWckY3VyclBvcztcbiAgICAgIHMxID0gcGVnJHBhcnNlb3JkZXJlZCgpO1xuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICBzMSA9IHBlZyRjNChzMSk7XG4gICAgICB9XG4gICAgICBzMCA9IHMxO1xuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZW9yZGVyZWQoKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzLCBzNCwgczUsIHM2LCBzNywgczgsIHM5LCBzMTAsIHMxMSwgczEyLCBzMTM7XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOTEpIHtcbiAgICAgIHMxID0gcGVnJGM1O1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzYpOyB9XG4gICAgfVxuICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczIgPSBwZWckcGFyc2VzZXAoKTtcbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBzMyA9IHBlZyRwYXJzZWZpbHRlcmVkKCk7XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHM0ID0gcGVnJHBhcnNlc2VwKCk7XG4gICAgICAgICAgaWYgKHM0ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQ0KSB7XG4gICAgICAgICAgICAgIHM1ID0gcGVnJGMxO1xuICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgczUgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMik7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzNSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICBzNiA9IHBlZyRwYXJzZXNlcCgpO1xuICAgICAgICAgICAgICBpZiAoczYgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICBzNyA9IHBlZyRwYXJzZWZpbHRlcmVkKCk7XG4gICAgICAgICAgICAgICAgaWYgKHM3ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICBzOCA9IHBlZyRwYXJzZXNlcCgpO1xuICAgICAgICAgICAgICAgICAgaWYgKHM4ICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gOTMpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzOSA9IHBlZyRjNztcbiAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIHM5ID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjOCk7IH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoczkgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzMTAgPSBwZWckcGFyc2VzZXAoKTtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoczEwICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDYyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHMxMSA9IHBlZyRjOTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHMxMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMxMCk7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMTEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgczEyID0gcGVnJHBhcnNlc2VwKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMTIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMTMgPSBwZWckcGFyc2VvcmRlcmVkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMxMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMSA9IHBlZyRjMTEoczMsIHM3LCBzMTMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJGMwO1xuICAgIH1cbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gcGVnJHBhcnNlZmlsdGVyZWQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VmaWx0ZXJlZCgpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIHMxID0gcGVnJHBhcnNlc3RyZWFtKCk7XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IFtdO1xuICAgICAgczMgPSBwZWckcGFyc2VmaWx0ZXIoKTtcbiAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICB3aGlsZSAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBzMi5wdXNoKHMzKTtcbiAgICAgICAgICBzMyA9IHBlZyRwYXJzZWZpbHRlcigpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzMiA9IHBlZyRjMDtcbiAgICAgIH1cbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgczEgPSBwZWckYzEzKHMxLCBzMik7XG4gICAgICAgIHMwID0gczE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJGMwO1xuICAgIH1cbiAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICBzMSA9IHBlZyRwYXJzZXN0cmVhbSgpO1xuICAgICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICBzMSA9IHBlZyRjMTQoczEpO1xuICAgICAgfVxuICAgICAgczAgPSBzMTtcbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VzdHJlYW0oKSB7XG4gICAgdmFyIHMwLCBzMSwgczIsIHMzO1xuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IHBlZyRwYXJzZWNsYXNzKCk7XG4gICAgaWYgKHMxID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMSA9IHBlZyRwYXJzZWlkKCk7XG4gICAgfVxuICAgIGlmIChzMSA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgczEgPSBwZWckYzE1O1xuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gcGVnJHBhcnNlZXZlbnRUeXBlKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgIHMxID0gcGVnJGMxNihzMSwgczIpO1xuICAgICAgICBzMCA9IHMxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRjMDtcbiAgICB9XG4gICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgICAgczEgPSBbXTtcbiAgICAgIGlmIChwZWckYzE3LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgczIgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMTgpOyB9XG4gICAgICB9XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgd2hpbGUgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgczEucHVzaChzMik7XG4gICAgICAgICAgaWYgKHBlZyRjMTcudGVzdChpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpKSkge1xuICAgICAgICAgICAgczIgPSBpbnB1dC5jaGFyQXQocGVnJGN1cnJQb3MpO1xuICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgczIgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzE4KTsgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczEgPSBwZWckYzA7XG4gICAgICB9XG4gICAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgIHMxID0gcGVnJGMxOShzMSk7XG4gICAgICB9XG4gICAgICBzMCA9IHMxO1xuICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gNDApIHtcbiAgICAgICAgICBzMSA9IHBlZyRjMjA7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzIxKTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHMyID0gcGVnJHBhcnNlbWVyZ2VkKCk7XG4gICAgICAgICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDQxKSB7XG4gICAgICAgICAgICAgIHMzID0gcGVnJGMyMjtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzIzKTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgICAgICBzMSA9IHBlZyRjMjQoczIpO1xuICAgICAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZWNsYXNzKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA0Nikge1xuICAgICAgczEgPSBwZWckYzI1O1xuICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICB9IGVsc2Uge1xuICAgICAgczEgPSBwZWckRkFJTEVEO1xuICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzI2KTsgfVxuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHMyID0gcGVnJHBhcnNldmFsdWUoKTtcbiAgICAgIGlmIChzMiAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdChwZWckY3VyclBvcykgPT09IDU4KSB7XG4gICAgICAgICAgczMgPSBwZWckYzI3O1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMyOCk7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoczMgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICBwZWckcmVwb3J0ZWRQb3MgPSBzMDtcbiAgICAgICAgICBzMSA9IHBlZyRjMjkoczIpO1xuICAgICAgICAgIHMwID0gczE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICBzMCA9IHBlZyRjMDtcbiAgICB9XG5cbiAgICByZXR1cm4gczA7XG4gIH1cblxuICBmdW5jdGlvbiBwZWckcGFyc2VpZCgpIHtcbiAgICB2YXIgczAsIHMxLCBzMiwgczM7XG5cbiAgICBzMCA9IHBlZyRjdXJyUG9zO1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHBlZyRjdXJyUG9zKSA9PT0gMzUpIHtcbiAgICAgIHMxID0gcGVnJGMzMDtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGMzMSk7IH1cbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZXZhbHVlKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA1OCkge1xuICAgICAgICAgIHMzID0gcGVnJGMyNztcbiAgICAgICAgICBwZWckY3VyclBvcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHMzID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMjgpOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHMzICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgcGVnJHJlcG9ydGVkUG9zID0gczA7XG4gICAgICAgICAgczEgPSBwZWckYzMyKHMyKTtcbiAgICAgICAgICBzMCA9IHMxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgICAgczAgPSBwZWckYzA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlZyRjdXJyUG9zID0gczA7XG4gICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgczAgPSBwZWckYzA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlZXZlbnRUeXBlKCkge1xuICAgIHZhciBzMDtcblxuICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDkpID09PSBwZWckYzMzKSB7XG4gICAgICBzMCA9IHBlZyRjMzM7XG4gICAgICBwZWckY3VyclBvcyArPSA5O1xuICAgIH0gZWxzZSB7XG4gICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMzQpOyB9XG4gICAgfVxuICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgNykgPT09IHBlZyRjMzUpIHtcbiAgICAgICAgczAgPSBwZWckYzM1O1xuICAgICAgICBwZWckY3VyclBvcyArPSA3O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjMzYpOyB9XG4gICAgICB9XG4gICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgNSkgPT09IHBlZyRjMzcpIHtcbiAgICAgICAgICBzMCA9IHBlZyRjMzc7XG4gICAgICAgICAgcGVnJGN1cnJQb3MgKz0gNTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzM4KTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDgpID09PSBwZWckYzM5KSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRjMzk7XG4gICAgICAgICAgICBwZWckY3VyclBvcyArPSA4O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNDApOyB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgNSkgPT09IHBlZyRjNDEpIHtcbiAgICAgICAgICAgICAgczAgPSBwZWckYzQxO1xuICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSA1O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNDIpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgNykgPT09IHBlZyRjNDMpIHtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRjNDM7XG4gICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gNztcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzQ0KTsgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDgpID09PSBwZWckYzQ1KSB7XG4gICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjNDU7XG4gICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSA4O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNDYpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgNSkgPT09IHBlZyRjNDcpIHtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzQ3O1xuICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSA1O1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNDgpOyB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgMTApID09PSBwZWckYzQ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckYzQ5O1xuICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDEwO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTApOyB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgOSkgPT09IHBlZyRjNTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJGM1MTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM1Mik7IH1cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA4KSA9PT0gcGVnJGM1Mykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjNTM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM1NCk7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuc3Vic3RyKHBlZyRjdXJyUG9zLCA5KSA9PT0gcGVnJGM1NSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJGM1NTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSA5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMwID0gcGVnJEZBSUxFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNTYpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMwID09PSBwZWckRkFJTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgMTApID09PSBwZWckYzU3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjNTc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSAxMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzU4KTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDEwKSA9PT0gcGVnJGM1OSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjNTk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlZyRjdXJyUG9zICs9IDEwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgczAgPSBwZWckRkFJTEVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNjApOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoczAgPT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LnN1YnN0cihwZWckY3VyclBvcywgOSkgPT09IHBlZyRjNjEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjNjE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVnJGN1cnJQb3MgKz0gOTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzYyKTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzMCA9PT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5zdWJzdHIocGVnJGN1cnJQb3MsIDgpID09PSBwZWckYzYzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRjNjM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZWckY3VyclBvcyArPSA4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzMCA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNjQpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHMwO1xuICB9XG5cbiAgZnVuY3Rpb24gcGVnJHBhcnNlZmlsdGVyKCkge1xuICAgIHZhciBzMCwgczEsIHMyLCBzMztcblxuICAgIHMwID0gcGVnJGN1cnJQb3M7XG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA5MSkge1xuICAgICAgczEgPSBwZWckYzU7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNik7IH1cbiAgICB9XG4gICAgaWYgKHMxICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICBzMiA9IHBlZyRwYXJzZXZhbHVlKCk7XG4gICAgICBpZiAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQocGVnJGN1cnJQb3MpID09PSA5Mykge1xuICAgICAgICAgIHMzID0gcGVnJGM3O1xuICAgICAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgczMgPSBwZWckRkFJTEVEO1xuICAgICAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM4KTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzMyAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgICAgIHMxID0gcGVnJGM2NShzMik7XG4gICAgICAgICAgczAgPSBzMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICAgIHMwID0gcGVnJGMwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZWckY3VyclBvcyA9IHMwO1xuICAgICAgICBzMCA9IHBlZyRjMDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcGVnJGN1cnJQb3MgPSBzMDtcbiAgICAgIHMwID0gcGVnJGMwO1xuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZXZhbHVlKCkge1xuICAgIHZhciBzMCwgczEsIHMyO1xuXG4gICAgczAgPSBwZWckY3VyclBvcztcbiAgICBzMSA9IFtdO1xuICAgIGlmIChwZWckYzY2LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgIHMyID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgIHBlZyRjdXJyUG9zKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIHMyID0gcGVnJEZBSUxFRDtcbiAgICAgIGlmIChwZWckc2lsZW50RmFpbHMgPT09IDApIHsgcGVnJGZhaWwocGVnJGM2Nyk7IH1cbiAgICB9XG4gICAgaWYgKHMyICE9PSBwZWckRkFJTEVEKSB7XG4gICAgICB3aGlsZSAoczIgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgICAgczEucHVzaChzMik7XG4gICAgICAgIGlmIChwZWckYzY2LnRlc3QoaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKSkpIHtcbiAgICAgICAgICBzMiA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzMiA9IHBlZyRGQUlMRUQ7XG4gICAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzY3KTsgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHMxID0gcGVnJGMwO1xuICAgIH1cbiAgICBpZiAoczEgIT09IHBlZyRGQUlMRUQpIHtcbiAgICAgIHBlZyRyZXBvcnRlZFBvcyA9IHMwO1xuICAgICAgczEgPSBwZWckYzY4KHMxKTtcbiAgICB9XG4gICAgczAgPSBzMTtcblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBlZyRwYXJzZXNlcCgpIHtcbiAgICB2YXIgczAsIHMxO1xuXG4gICAgczAgPSBbXTtcbiAgICBpZiAocGVnJGM2OS50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICBzMSA9IGlucHV0LmNoYXJBdChwZWckY3VyclBvcyk7XG4gICAgICBwZWckY3VyclBvcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBzMSA9IHBlZyRGQUlMRUQ7XG4gICAgICBpZiAocGVnJHNpbGVudEZhaWxzID09PSAwKSB7IHBlZyRmYWlsKHBlZyRjNzApOyB9XG4gICAgfVxuICAgIHdoaWxlIChzMSAhPT0gcGVnJEZBSUxFRCkge1xuICAgICAgczAucHVzaChzMSk7XG4gICAgICBpZiAocGVnJGM2OS50ZXN0KGlucHV0LmNoYXJBdChwZWckY3VyclBvcykpKSB7XG4gICAgICAgIHMxID0gaW5wdXQuY2hhckF0KHBlZyRjdXJyUG9zKTtcbiAgICAgICAgcGVnJGN1cnJQb3MrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMxID0gcGVnJEZBSUxFRDtcbiAgICAgICAgaWYgKHBlZyRzaWxlbnRGYWlscyA9PT0gMCkgeyBwZWckZmFpbChwZWckYzcwKTsgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzMDtcbiAgfVxuXG4gIHBlZyRyZXN1bHQgPSBwZWckc3RhcnRSdWxlRnVuY3Rpb24oKTtcblxuICBpZiAocGVnJHJlc3VsdCAhPT0gcGVnJEZBSUxFRCAmJiBwZWckY3VyclBvcyA9PT0gaW5wdXQubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHBlZyRyZXN1bHQ7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHBlZyRyZXN1bHQgIT09IHBlZyRGQUlMRUQgJiYgcGVnJGN1cnJQb3MgPCBpbnB1dC5sZW5ndGgpIHtcbiAgICAgIHBlZyRmYWlsKHsgdHlwZTogXCJlbmRcIiwgZGVzY3JpcHRpb246IFwiZW5kIG9mIGlucHV0XCIgfSk7XG4gICAgfVxuXG4gICAgdGhyb3cgcGVnJGJ1aWxkRXhjZXB0aW9uKG51bGwsIHBlZyRtYXhGYWlsRXhwZWN0ZWQsIHBlZyRtYXhGYWlsUG9zKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgU3ludGF4RXJyb3I6IFN5bnRheEVycm9yLFxuICBwYXJzZTogICAgICAgcGFyc2Vcbn07IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIGV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi9leHByZXNzaW9uJyk7XG5cbnZhciBleHByID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgcGFyc2UgPSBleHByZXNzaW9uLnBhcnNlO1xuICB2YXIgY29kZWdlbiA9IGV4cHJlc3Npb24uY29kZSh7XG4gICAgaWRXaGl0ZUxpc3Q6IFsnZCcsICdlJywgJ2knLCAncCcsICdzZyddXG4gIH0pO1xuXG4gIHJldHVybiBmdW5jdGlvbihleHByKSB7ICAgIFxuICAgIHZhciB2YWx1ZSA9IGNvZGVnZW4ocGFyc2UoZXhwcikpO1xuICAgIHZhbHVlLmZuID0gRnVuY3Rpb24oJ2QnLCAnZScsICdpJywgJ3AnLCAnc2cnLFxuICAgICAgJ1widXNlIHN0cmljdFwiOyByZXR1cm4gKCcgKyB2YWx1ZS5mbiArICcpOycpO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcbn0pKCk7XG5cbmV4cHIuZXZhbCA9IGZ1bmN0aW9uKGdyYXBoLCBmbiwgZCwgZSwgaSwgcCwgc2cpIHtcbiAgc2cgPSBncmFwaC5zaWduYWxWYWx1ZXMoZGwuYXJyYXkoc2cpKTtcbiAgcmV0dXJuIGZuLmNhbGwobnVsbCwgZCwgZSwgaSwgcCwgc2cpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHByOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBjb25maWcgPSByZXF1aXJlKCcuLi91dGlsL2NvbmZpZycpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhcnNlSW50ZXJhY3RvcnMobW9kZWwsIHNwZWMsIGRlZkZhY3RvcnkpIHtcbiAgdmFyIGNvdW50ID0gMCxcbiAgICAgIHNnID0ge30sIHBkID0ge30sIG1rID0ge30sXG4gICAgICBzaWduYWxzID0gW10sIHByZWRpY2F0ZXMgPSBbXTtcblxuICBmdW5jdGlvbiBsb2FkZWQoaSkge1xuICAgIHJldHVybiBmdW5jdGlvbihlcnJvciwgZGF0YSkge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIGRsLmVycm9yKFwiTE9BRElORyBGQUlMRUQ6IFwiICsgaS51cmwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGRlZiA9IGRsLmlzT2JqZWN0KGRhdGEpID8gZGF0YSA6IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgIGludGVyYWN0b3IoaS5uYW1lLCBkZWYpO1xuICAgICAgfVxuICAgICAgaWYgKC0tY291bnQgPT0gMCkgaW5qZWN0KCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW50ZXJhY3RvcihuYW1lLCBkZWYpIHtcbiAgICBzZyA9IHt9LCBwZCA9IHt9O1xuICAgIGlmIChkZWYuc2lnbmFscykgICAgc2lnbmFscy5wdXNoLmFwcGx5KHNpZ25hbHMsIG5zU2lnbmFscyhuYW1lLCBkZWYuc2lnbmFscykpO1xuICAgIGlmIChkZWYucHJlZGljYXRlcykgcHJlZGljYXRlcy5wdXNoLmFwcGx5KHByZWRpY2F0ZXMsIG5zUHJlZGljYXRlcyhuYW1lLCBkZWYucHJlZGljYXRlcykpO1xuICAgIG5zTWFya3MobmFtZSwgZGVmLm1hcmtzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGluamVjdCgpIHtcbiAgICBpZiAoZGwua2V5cyhtaykubGVuZ3RoID4gMCkgaW5qZWN0TWFya3Moc3BlYy5tYXJrcyk7XG4gICAgc3BlYy5zaWduYWxzID0gZGwuYXJyYXkoc3BlYy5zaWduYWxzKTtcbiAgICBzcGVjLnByZWRpY2F0ZXMgPSBkbC5hcnJheShzcGVjLnByZWRpY2F0ZXMpO1xuICAgIHNwZWMuc2lnbmFscy51bnNoaWZ0LmFwcGx5KHNwZWMuc2lnbmFscywgc2lnbmFscyk7XG4gICAgc3BlYy5wcmVkaWNhdGVzLnVuc2hpZnQuYXBwbHkoc3BlYy5wcmVkaWNhdGVzLCBwcmVkaWNhdGVzKTtcbiAgICBkZWZGYWN0b3J5KCk7XG4gIH1cblxuICBmdW5jdGlvbiBpbmplY3RNYXJrcyhtYXJrcykge1xuICAgIHZhciBtLCByLCBpLCBsZW47XG4gICAgbWFya3MgPSBkbC5hcnJheShtYXJrcyk7XG5cbiAgICBmb3IoaSA9IDAsIGxlbiA9IG1hcmtzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBtID0gbWFya3NbaV07XG4gICAgICBpZiAociA9IG1rW20udHlwZV0pIHtcbiAgICAgICAgbWFya3NbaV0gPSBkbC5kdXBsaWNhdGUocik7XG4gICAgICAgIGlmIChtLmZyb20pIG1hcmtzW2ldLmZyb20gPSBtLmZyb207XG4gICAgICAgIGlmIChtLnByb3BlcnRpZXMpIHtcbiAgICAgICAgICBbQy5FTlRFUiwgQy5VUERBVEUsIEMuRVhJVF0uZm9yRWFjaChmdW5jdGlvbihwKSB7XG4gICAgICAgICAgICBtYXJrc1tpXS5wcm9wZXJ0aWVzW3BdID0gZGwuZXh0ZW5kKHIucHJvcGVydGllc1twXSwgbS5wcm9wZXJ0aWVzW3BdKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChtLm1hcmtzKSB7ICAvLyBUT0RPIGhvdyB0byBvdmVycmlkZSBwcm9wZXJ0aWVzIG9mIG5lc3RlZCBtYXJrcz9cbiAgICAgICAgaW5qZWN0TWFya3MobS5tYXJrcyk7XG4gICAgICB9XG4gICAgfSAgICBcbiAgfVxuXG4gIGZ1bmN0aW9uIG5zKG4sIHMpIHsgXG4gICAgaWYgKGRsLmlzU3RyaW5nKHMpKSB7XG4gICAgICByZXR1cm4gcyArIFwiX1wiICsgbjtcbiAgICB9IGVsc2Uge1xuICAgICAgZGwua2V5cyhzKS5mb3JFYWNoKGZ1bmN0aW9uKHgpIHsgXG4gICAgICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoJ1xcXFxiJyt4KydcXFxcYicsIFwiZ1wiKTtcbiAgICAgICAgbiA9IG4ucmVwbGFjZShyZWdleCwgc1t4XSkgXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBuO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG5zU2lnbmFscyhuYW1lLCBzaWduYWxzKSB7XG4gICAgc2lnbmFscyA9IGRsLmFycmF5KHNpZ25hbHMpO1xuICAgIC8vIFR3byBwYXNzZXMgdG8gbnMgYWxsIHNpZ25hbHMsIGFuZCB0aGVuIG92ZXJ3cml0ZSB0aGVpciBkZWZpbml0aW9uc1xuICAgIC8vIGluIGNhc2Ugc2lnbmFsIG9yZGVyIGlzIGltcG9ydGFudC5cbiAgICBzaWduYWxzLmZvckVhY2goZnVuY3Rpb24ocykgeyBzLm5hbWUgPSBzZ1tzLm5hbWVdID0gbnMocy5uYW1lLCBuYW1lKTsgfSk7XG4gICAgc2lnbmFscy5mb3JFYWNoKGZ1bmN0aW9uKHMpIHtcbiAgICAgIChzLnN0cmVhbXMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24odCkge1xuICAgICAgICB0LnR5cGUgPSBucyh0LnR5cGUsIHNnKTtcbiAgICAgICAgdC5leHByID0gbnModC5leHByLCBzZyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gc2lnbmFscztcbiAgfVxuXG4gIGZ1bmN0aW9uIG5zUHJlZGljYXRlcyhuYW1lLCBwcmVkaWNhdGVzKSB7XG4gICAgcHJlZGljYXRlcyA9IGRsLmFycmF5KHByZWRpY2F0ZXMpO1xuICAgIHByZWRpY2F0ZXMuZm9yRWFjaChmdW5jdGlvbihwKSB7XG4gICAgICBwLm5hbWUgPSBwZFtwLm5hbWVdID0gbnMocC5uYW1lLCBuYW1lKTtcblxuICAgICAgW3Aub3BlcmFuZHMsIHAucmFuZ2VdLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgICAgICAoeCB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbihvKSB7XG4gICAgICAgICAgaWYgKG8uc2lnbmFsKSBvLnNpZ25hbCA9IG5zKG8uc2lnbmFsLCBzZyk7XG4gICAgICAgICAgZWxzZSBpZiAoby5wcmVkaWNhdGUpIG5zT3BlcmFuZChvKTtcbiAgICAgICAgfSlcbiAgICAgIH0pO1xuXG4gICAgfSk7ICBcbiAgICByZXR1cm4gcHJlZGljYXRlczsgXG4gIH1cblxuICBmdW5jdGlvbiBuc09wZXJhbmQobykge1xuICAgIG8ucHJlZGljYXRlID0gcGRbby5wcmVkaWNhdGVdO1xuICAgIGRsLmtleXMoby5pbnB1dCkuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICB2YXIgaSA9IG8uaW5wdXRba107XG4gICAgICBpZiAoaS5zaWduYWwpIGkuc2lnbmFsID0gbnMoaS5zaWduYWwsIHNnKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5zTWFya3MobmFtZSwgbWFya3MpIHtcbiAgICAobWFya3MgfHwgW10pLmZvckVhY2goZnVuY3Rpb24obSkgeyBcbiAgICAgIG5zUHJvcGVydGllcyhtLnByb3BlcnRpZXMuZW50ZXIpO1xuICAgICAgbnNQcm9wZXJ0aWVzKG0ucHJvcGVydGllcy51cGRhdGUpO1xuICAgICAgbnNQcm9wZXJ0aWVzKG0ucHJvcGVydGllcy5leGl0KTtcbiAgICAgIG1rW25zKG0ubmFtZSwgbmFtZSldID0gbTsgXG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBuc1Byb3BlcnRpZXMocHJvcHNldCkge1xuICAgIGRsLmtleXMocHJvcHNldCkuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICB2YXIgcCA9IHByb3BzZXRba107XG4gICAgICBpZiAocC5zaWduYWwpIHAuc2lnbmFsID0gbnMocC5zaWduYWwsIHNnKTtcbiAgICAgIGVsc2UgaWYgKHAucnVsZSkge1xuICAgICAgICBwLnJ1bGUuZm9yRWFjaChmdW5jdGlvbihyKSB7IFxuICAgICAgICAgIGlmIChyLnNpZ25hbCkgci5zaWduYWwgPSBucyhyLnNpZ25hbCwgc2cpO1xuICAgICAgICAgIGlmIChyLnByZWRpY2F0ZSkgbnNPcGVyYW5kKHIpOyBcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAoc3BlYy5pbnRlcmFjdG9ycyB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbihpKSB7XG4gICAgaWYgKGkudXJsKSB7XG4gICAgICBjb3VudCArPSAxO1xuICAgICAgZGwubG9hZChkbC5leHRlbmQoe3VybDogaS51cmx9LCBjb25maWcubG9hZCksIGxvYWRlZChpKSk7XG4gICAgfVxuICB9KTtcblxuICBpZiAoY291bnQgPT09IDApIHNldFRpbWVvdXQoaW5qZWN0LCAxKTtcbiAgcmV0dXJuIHNwZWM7XG59IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIHBhcnNlUHJvcGVydGllcyA9IHJlcXVpcmUoJy4vcHJvcGVydGllcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhcnNlTWFyayhtb2RlbCwgbWFyaykge1xuICB2YXIgcHJvcHMgPSBtYXJrLnByb3BlcnRpZXMsXG4gICAgICBncm91cCA9IG1hcmsubWFya3M7XG5cbiAgLy8gcGFyc2UgbWFyayBwcm9wZXJ0eSBkZWZpbml0aW9uc1xuICBkbC5rZXlzKHByb3BzKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICBwcm9wc1trXSA9IHBhcnNlUHJvcGVydGllcyhtb2RlbCwgbWFyay50eXBlLCBwcm9wc1trXSk7XG4gIH0pO1xuXG4gIC8vIHBhcnNlIGRlbGF5IGZ1bmN0aW9uXG4gIGlmIChtYXJrLmRlbGF5KSB7XG4gICAgbWFyay5kZWxheSA9IHBhcnNlUHJvcGVydGllcyhtb2RlbCwgbWFyay50eXBlLCB7ZGVsYXk6IG1hcmsuZGVsYXl9KTtcbiAgfVxuXG4gIC8vIHJlY3Vyc2UgaWYgZ3JvdXAgdHlwZVxuICBpZiAoZ3JvdXApIHtcbiAgICBtYXJrLm1hcmtzID0gZ3JvdXAubWFwKGZ1bmN0aW9uKGcpIHsgcmV0dXJuIHBhcnNlTWFyayhtb2RlbCwgZyk7IH0pO1xuICB9XG4gICAgXG4gIHJldHVybiBtYXJrO1xufTsiLCJ2YXIgcGFyc2VNYXJrID0gcmVxdWlyZSgnLi9tYXJrJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obW9kZWwsIHNwZWMsIHdpZHRoLCBoZWlnaHQpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcImdyb3VwXCIsXG4gICAgd2lkdGg6IHdpZHRoLFxuICAgIGhlaWdodDogaGVpZ2h0LFxuICAgIHNjYWxlczogc3BlYy5zY2FsZXMgfHwgW10sXG4gICAgYXhlczogc3BlYy5heGVzIHx8IFtdLFxuICAgIC8vIGxlZ2VuZHM6IHNwZWMubGVnZW5kcyB8fCBbXSxcbiAgICBtYXJrczogKHNwZWMubWFya3MgfHwgW10pLm1hcChmdW5jdGlvbihtKSB7IHJldHVybiBwYXJzZU1hcmsobW9kZWwsIG0pOyB9KVxuICB9O1xufTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgTm9kZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L05vZGUnKSxcbiAgICB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbnZhciBmaWx0ZXIgPSBmdW5jdGlvbihmaWVsZCwgdmFsdWUsIHNyYywgZGVzdCkge1xuICBmb3IodmFyIGkgPSBzcmMubGVuZ3RoLTE7IGkgPj0gMDsgLS1pKSB7XG4gICAgaWYoc3JjW2ldW2ZpZWxkXSA9PSB2YWx1ZSlcbiAgICAgIGRlc3QucHVzaC5hcHBseShkZXN0LCBzcmMuc3BsaWNlKGksIDEpKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZU1vZGlmeShtb2RlbCwgZGVmLCBkcykge1xuICB2YXIgZ3JhcGggPSBtb2RlbC5ncmFwaCxcbiAgICAgIHNpZ25hbCA9IGRlZi5zaWduYWwgPyBkbC5maWVsZChkZWYuc2lnbmFsKSA6IG51bGwsIFxuICAgICAgc2lnbmFsTmFtZSA9IHNpZ25hbCA/IHNpZ25hbFswXSA6IG51bGwsXG4gICAgICBwcmVkaWNhdGUgPSBkZWYucHJlZGljYXRlID8gbW9kZWwucHJlZGljYXRlKGRlZi5wcmVkaWNhdGUpIDogbnVsbCxcbiAgICAgIHJlZXZhbCA9IChwcmVkaWNhdGUgPT09IG51bGwpLFxuICAgICAgbm9kZSA9IG5ldyBOb2RlKGdyYXBoKTtcblxuICBub2RlLmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICBpZihwcmVkaWNhdGUgIT09IG51bGwpIHtcbiAgICAgIHZhciBkYiA9IHt9O1xuICAgICAgKHByZWRpY2F0ZS5kYXRhfHxbXSkuZm9yRWFjaChmdW5jdGlvbihkKSB7IGRiW2RdID0gbW9kZWwuZGF0YShkKS52YWx1ZXMoKTsgfSk7XG5cbiAgICAgIC8vIFRPRE86IGlucHV0XG4gICAgICByZWV2YWwgPSBwcmVkaWNhdGUoe30sIGRiLCBncmFwaC5zaWduYWxWYWx1ZXMocHJlZGljYXRlLnNpZ25hbHN8fFtdKSwgbW9kZWwuX3ByZWRpY2F0ZXMpO1xuICAgIH1cblxuICAgIGRlYnVnKGlucHV0LCBbZGVmLnR5cGUrXCJpbmdcIiwgcmVldmFsXSk7XG4gICAgaWYoIXJlZXZhbCkgcmV0dXJuIGlucHV0O1xuXG4gICAgdmFyIGRhdHVtID0ge30sIFxuICAgICAgICB2YWx1ZSA9IHNpZ25hbCA/IGdyYXBoLnNpZ25hbFJlZihkZWYuc2lnbmFsKSA6IG51bGwsXG4gICAgICAgIGQgPSBtb2RlbC5kYXRhKGRzLm5hbWUpLFxuICAgICAgICBwcmV2ID0gZC5yZXZpc2VzKCkgPyBudWxsIDogdW5kZWZpbmVkLFxuICAgICAgICB0ID0gbnVsbDtcblxuICAgIGRhdHVtW2RlZi5maWVsZF0gPSB2YWx1ZTtcblxuICAgIC8vIFdlIGhhdmUgdG8gbW9kaWZ5IGRzLl9kYXRhIHNvIHRoYXQgc3Vic2VxdWVudCBwdWxzZXMgY29udGFpblxuICAgIC8vIG91ciBkeW5hbWljIGRhdGEuIFcvbyBtb2RpZnlpbmcgZHMuX2RhdGEsIG9ubHkgdGhlIG91dHB1dFxuICAgIC8vIGNvbGxlY3RvciB3aWxsIGNvbnRhaW4gZHluYW1pYyB0dXBsZXMuIFxuICAgIGlmKGRlZi50eXBlID09IEMuQUREKSB7XG4gICAgICB0ID0gdHVwbGUuaW5nZXN0KGRhdHVtLCBwcmV2KTtcbiAgICAgIGlucHV0LmFkZC5wdXNoKHQpO1xuICAgICAgZC5fZGF0YS5wdXNoKHQpO1xuICAgIH0gZWxzZSBpZihkZWYudHlwZSA9PSBDLlJFTU9WRSkge1xuICAgICAgZmlsdGVyKGRlZi5maWVsZCwgdmFsdWUsIGlucHV0LmFkZCwgaW5wdXQucmVtKTtcbiAgICAgIGZpbHRlcihkZWYuZmllbGQsIHZhbHVlLCBpbnB1dC5tb2QsIGlucHV0LnJlbSk7XG4gICAgICBkLl9kYXRhID0gZC5fZGF0YS5maWx0ZXIoZnVuY3Rpb24oeCkgeyByZXR1cm4geFtkZWYuZmllbGRdICE9PSB2YWx1ZSB9KTtcbiAgICB9IGVsc2UgaWYoZGVmLnR5cGUgPT0gQy5UT0dHTEUpIHtcbiAgICAgIHZhciBhZGQgPSBbXSwgcmVtID0gW107XG4gICAgICBmaWx0ZXIoZGVmLmZpZWxkLCB2YWx1ZSwgaW5wdXQucmVtLCBhZGQpO1xuICAgICAgZmlsdGVyKGRlZi5maWVsZCwgdmFsdWUsIGlucHV0LmFkZCwgcmVtKTtcbiAgICAgIGZpbHRlcihkZWYuZmllbGQsIHZhbHVlLCBpbnB1dC5tb2QsIHJlbSk7XG4gICAgICBpZihhZGQubGVuZ3RoID09IDAgJiYgcmVtLmxlbmd0aCA9PSAwKSBhZGQucHVzaCh0dXBsZS5pbmdlc3QoZGF0dW0pKTtcblxuICAgICAgaW5wdXQuYWRkLnB1c2guYXBwbHkoaW5wdXQuYWRkLCBhZGQpO1xuICAgICAgZC5fZGF0YS5wdXNoLmFwcGx5KGQuX2RhdGEsIGFkZCk7XG4gICAgICBpbnB1dC5yZW0ucHVzaC5hcHBseShpbnB1dC5yZW0sIHJlbSk7XG4gICAgICBkLl9kYXRhID0gZC5fZGF0YS5maWx0ZXIoZnVuY3Rpb24oeCkgeyByZXR1cm4gcmVtLmluZGV4T2YoeCkgPT09IC0xIH0pO1xuICAgIH0gZWxzZSBpZihkZWYudHlwZSA9PSBDLkNMRUFSKSB7XG4gICAgICBpbnB1dC5yZW0ucHVzaC5hcHBseShpbnB1dC5yZW0sIGlucHV0LmFkZCk7XG4gICAgICBpbnB1dC5yZW0ucHVzaC5hcHBseShpbnB1dC5yZW0sIGlucHV0Lm1vZCk7XG4gICAgICBpbnB1dC5hZGQgPSBbXTtcbiAgICAgIGlucHV0Lm1vZCA9IFtdO1xuICAgICAgZC5fZGF0YSAgPSBbXTtcbiAgICB9IFxuXG4gICAgaW5wdXQuZmllbGRzW2RlZi5maWVsZF0gPSAxO1xuICAgIHJldHVybiBpbnB1dDtcbiAgfTtcblxuICBpZihzaWduYWxOYW1lKSBub2RlLmRlcGVuZGVuY3koQy5TSUdOQUxTLCBzaWduYWxOYW1lKTtcbiAgaWYocHJlZGljYXRlKSAgbm9kZS5kZXBlbmRlbmN5KEMuU0lHTkFMUywgcHJlZGljYXRlLnNpZ25hbHMpO1xuICBcbiAgcmV0dXJuIG5vZGU7XG59IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhcnNlUGFkZGluZyhwYWQpIHtcbiAgaWYgKHBhZCA9PSBudWxsKSByZXR1cm4gXCJhdXRvXCI7XG4gIGVsc2UgaWYgKGRsLmlzU3RyaW5nKHBhZCkpIHJldHVybiBwYWQ9PT1cInN0cmljdFwiID8gXCJzdHJpY3RcIiA6IFwiYXV0b1wiO1xuICBlbHNlIGlmIChkbC5pc09iamVjdChwYWQpKSByZXR1cm4gcGFkO1xuICB2YXIgcCA9IGRsLmlzTnVtYmVyKHBhZCkgPyBwYWQgOiAyMDtcbiAgcmV0dXJuIHt0b3A6cCwgbGVmdDpwLCByaWdodDpwLCBib3R0b206cH07XG59IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhcnNlUHJlZGljYXRlKG1vZGVsLCBzcGVjKSB7XG4gIHZhciB0eXBlcyA9IHtcbiAgICAnPSc6ICBwYXJzZUNvbXBhcmF0b3IsXG4gICAgJz09JzogcGFyc2VDb21wYXJhdG9yLFxuICAgICchPSc6IHBhcnNlQ29tcGFyYXRvcixcbiAgICAnPic6ICBwYXJzZUNvbXBhcmF0b3IsXG4gICAgJz49JzogcGFyc2VDb21wYXJhdG9yLFxuICAgICc8JzogIHBhcnNlQ29tcGFyYXRvcixcbiAgICAnPD0nOiBwYXJzZUNvbXBhcmF0b3IsXG4gICAgJ2FuZCc6IHBhcnNlTG9naWNhbCxcbiAgICAnJiYnOiAgcGFyc2VMb2dpY2FsLFxuICAgICdvcic6ICBwYXJzZUxvZ2ljYWwsXG4gICAgJ3x8JzogIHBhcnNlTG9naWNhbCxcbiAgICAnaW4nOiBwYXJzZUluXG4gIH07XG5cbiAgZnVuY3Rpb24gcGFyc2VTaWduYWwoc2lnbmFsLCBzaWduYWxzKSB7XG4gICAgdmFyIHMgPSBkbC5maWVsZChzaWduYWwpLFxuICAgICAgICBjb2RlID0gXCJzaWduYWxzW1wiK3MubWFwKGRsLnN0cikuam9pbihcIl1bXCIpK1wiXVwiO1xuICAgIHNpZ25hbHNbcy5zaGlmdCgpXSA9IDE7XG4gICAgcmV0dXJuIGNvZGU7XG4gIH07XG5cbiAgZnVuY3Rpb24gcGFyc2VPcGVyYW5kcyhvcGVyYW5kcykge1xuICAgIHZhciBkZWNsID0gW10sIGRlZnMgPSBbXSxcbiAgICAgICAgc2lnbmFscyA9IHt9LCBkYiA9IHt9O1xuXG4gICAgZGwuYXJyYXkob3BlcmFuZHMpLmZvckVhY2goZnVuY3Rpb24obywgaSkge1xuICAgICAgdmFyIHNpZ25hbCwgbmFtZSA9IFwib1wiK2ksIGRlZiA9IFwiXCI7XG4gICAgICBcbiAgICAgIGlmKG8udmFsdWUgIT09IHVuZGVmaW5lZCkgZGVmID0gZGwuc3RyKG8udmFsdWUpO1xuICAgICAgZWxzZSBpZihvLmFyZykgICAgZGVmID0gXCJhcmdzW1wiK2RsLnN0cihvLmFyZykrXCJdXCI7XG4gICAgICBlbHNlIGlmKG8uc2lnbmFsKSBkZWYgPSBwYXJzZVNpZ25hbChvLnNpZ25hbCwgc2lnbmFscyk7XG4gICAgICBlbHNlIGlmKG8ucHJlZGljYXRlKSB7XG4gICAgICAgIHZhciBwcmVkID0gbW9kZWwucHJlZGljYXRlKG8ucHJlZGljYXRlKSxcbiAgICAgICAgICAgIHAgPSBcInByZWRpY2F0ZXNbXCIrZGwuc3RyKG8ucHJlZGljYXRlKStcIl1cIjtcblxuICAgICAgICBwcmVkLnNpZ25hbHMuZm9yRWFjaChmdW5jdGlvbihzKSB7IHNpZ25hbHNbc10gPSAxOyB9KTtcbiAgICAgICAgcHJlZC5kYXRhLmZvckVhY2goZnVuY3Rpb24oZCkgeyBkYltkXSA9IDEgfSk7XG5cbiAgICAgICAgZGwua2V5cyhvLmlucHV0KS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgICAgICB2YXIgaSA9IG8uaW5wdXRba10sIHNpZ25hbDtcbiAgICAgICAgICBkZWYgKz0gXCJhcmdzW1wiK2RsLnN0cihrKStcIl0gPSBcIjtcbiAgICAgICAgICBpZihpLnNpZ25hbCkgICBkZWYgKz0gcGFyc2VTaWduYWwoaS5zaWduYWwsIHNpZ25hbHMpO1xuICAgICAgICAgIGVsc2UgaWYoaS5hcmcpIGRlZiArPSBcImFyZ3NbXCIrZGwuc3RyKGkuYXJnKStcIl1cIjtcbiAgICAgICAgICBkZWYrPVwiLCBcIjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZGVmKz0gcCtcIi5jYWxsKFwiK3ArXCIsIGFyZ3MsIGRiLCBzaWduYWxzLCBwcmVkaWNhdGVzKVwiO1xuICAgICAgfVxuXG4gICAgICBkZWNsLnB1c2gobmFtZSk7XG4gICAgICBkZWZzLnB1c2gobmFtZStcIj0oXCIrZGVmK1wiKVwiKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiBcInZhciBcIiArIGRlY2wuam9pbihcIiwgXCIpICsgXCI7XFxuXCIgKyBkZWZzLmpvaW4oXCI7XFxuXCIpICsgXCI7XFxuXCIsXG4gICAgICBzaWduYWxzOiBkbC5rZXlzKHNpZ25hbHMpLFxuICAgICAgZGF0YTogZGwua2V5cyhkYilcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gcGFyc2VDb21wYXJhdG9yKHNwZWMpIHtcbiAgICB2YXIgb3BzID0gcGFyc2VPcGVyYW5kcyhzcGVjLm9wZXJhbmRzKTtcbiAgICBpZihzcGVjLnR5cGUgPT0gJz0nKSBzcGVjLnR5cGUgPSAnPT0nO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGU6IG9wcy5jb2RlICsgXCJyZXR1cm4gXCIgKyBbXCJvMFwiLCBcIm8xXCJdLmpvaW4oc3BlYy50eXBlKSArIFwiO1wiLFxuICAgICAgc2lnbmFsczogb3BzLnNpZ25hbHMsXG4gICAgICBkYXRhOiBvcHMuZGF0YVxuICAgIH07XG4gIH07XG5cbiAgZnVuY3Rpb24gcGFyc2VMb2dpY2FsKHNwZWMpIHtcbiAgICB2YXIgb3BzID0gcGFyc2VPcGVyYW5kcyhzcGVjLm9wZXJhbmRzKSxcbiAgICAgICAgbyA9IFtdLCBpID0gMCwgbGVuID0gc3BlYy5vcGVyYW5kcy5sZW5ndGg7XG5cbiAgICB3aGlsZShvLnB1c2goXCJvXCIraSsrKTxsZW4pO1xuICAgIGlmKHNwZWMudHlwZSA9PSAnYW5kJykgc3BlYy50eXBlID0gJyYmJztcbiAgICBlbHNlIGlmKHNwZWMudHlwZSA9PSAnb3InKSBzcGVjLnR5cGUgPSAnfHwnO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGU6IG9wcy5jb2RlICsgXCJyZXR1cm4gXCIgKyBvLmpvaW4oc3BlYy50eXBlKSArIFwiO1wiLFxuICAgICAgc2lnbmFsczogb3BzLnNpZ25hbHMsXG4gICAgICBkYXRhOiBvcHMuZGF0YVxuICAgIH07XG4gIH07XG5cbiAgZnVuY3Rpb24gcGFyc2VJbihzcGVjKSB7XG4gICAgdmFyIG8gPSBbc3BlYy5pdGVtXSwgY29kZSA9IFwiXCI7XG4gICAgaWYoc3BlYy5yYW5nZSkgby5wdXNoLmFwcGx5KG8sIHNwZWMucmFuZ2UpO1xuICAgIGlmKHNwZWMuc2NhbGUpIHtcbiAgICAgIGNvZGUgPSBwYXJzZVNjYWxlKHNwZWMuc2NhbGUsIG8pO1xuICAgIH1cblxuICAgIHZhciBvcHMgPSBwYXJzZU9wZXJhbmRzKG8pO1xuICAgIGNvZGUgPSBvcHMuY29kZSArIGNvZGU7XG5cbiAgICBpZihzcGVjLmRhdGEpIHtcbiAgICAgIHZhciBmaWVsZCA9IGRsLmZpZWxkKHNwZWMuZmllbGQpLm1hcChkbC5zdHIpO1xuICAgICAgY29kZSArPSBcInZhciB3aGVyZSA9IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbXCIrZmllbGQuam9pbihcIl1bXCIpK1wiXSA9PSBvMCB9O1xcblwiO1xuICAgICAgY29kZSArPSBcInJldHVybiBkYltcIitkbC5zdHIoc3BlYy5kYXRhKStcIl0uZmlsdGVyKHdoZXJlKS5sZW5ndGggPiAwO1wiO1xuICAgIH0gZWxzZSBpZihzcGVjLnJhbmdlKSB7XG4gICAgICAvLyBUT0RPOiBpbmNsdXNpdmUvZXhjbHVzaXZlIHJhbmdlP1xuICAgICAgLy8gVE9ETzogaW52ZXJ0aW5nIG9yZGluYWwgc2NhbGVzXG4gICAgICBpZihzcGVjLnNjYWxlKSBjb2RlICs9IFwibzEgPSBzY2FsZShvMSk7XFxubzIgPSBzY2FsZShvMik7XFxuXCI7XG4gICAgICBjb2RlICs9IFwicmV0dXJuIG8xIDwgbzIgPyBvMSA8PSBvMCAmJiBvMCA8PSBvMiA6IG8yIDw9IG8wICYmIG8wIDw9IG8xXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGU6IGNvZGUsIFxuICAgICAgc2lnbmFsczogb3BzLnNpZ25hbHMsIFxuICAgICAgZGF0YTogb3BzLmRhdGEuY29uY2F0KHNwZWMuZGF0YSA/IFtzcGVjLmRhdGFdIDogW10pXG4gICAgfTtcbiAgfTtcblxuICAvLyBQb3B1bGF0ZSBvcHMgc3VjaCB0aGF0IHVsdGltYXRlIHNjYWxlL2ludmVyc2lvbiBmdW5jdGlvbiB3aWxsIGJlIGluIGBzY2FsZWAgdmFyLiBcbiAgZnVuY3Rpb24gcGFyc2VTY2FsZShzcGVjLCBvcHMpIHtcbiAgICB2YXIgY29kZSA9IFwidmFyIHNjYWxlID0gXCIsIFxuICAgICAgICBpZHggID0gb3BzLmxlbmd0aDtcblxuICAgIGlmKGRsLmlzU3RyaW5nKHNwZWMpKSB7XG4gICAgICBvcHMucHVzaCh7IHZhbHVlOiBzcGVjIH0pO1xuICAgICAgY29kZSArPSBcInRoaXMucm9vdCgpLnNjYWxlKG9cIitpZHgrXCIpXCI7XG4gICAgfSBlbHNlIGlmKHNwZWMuYXJnKSB7ICAvLyBTY2FsZSBmdW5jdGlvbiBpcyBiZWluZyBwYXNzZWQgYXMgYW4gYXJnXG4gICAgICBvcHMucHVzaChzcGVjKTtcbiAgICAgIGNvZGUgKz0gXCJvXCIraWR4O1xuICAgIH0gZWxzZSBpZihzcGVjLm5hbWUpIHsgLy8gRnVsbCBzY2FsZSBwYXJhbWV0ZXIge25hbWU6IC4ufVxuICAgICAgb3BzLnB1c2goZGwuaXNTdHJpbmcoc3BlYy5uYW1lKSA/IHt2YWx1ZTogc3BlYy5uYW1lfSA6IHNwZWMubmFtZSk7XG4gICAgICBjb2RlICs9IFwiKHRoaXMuaXNGdW5jdGlvbihvXCIraWR4K1wiKSA/IG9cIitpZHgrXCIgOiBcIjtcbiAgICAgIGlmKHNwZWMuc2NvcGUpIHtcbiAgICAgICAgb3BzLnB1c2goc3BlYy5zY29wZSk7XG4gICAgICAgIGNvZGUgKz0gXCIob1wiKyhpZHgrMSkrXCIuc2NhbGUgfHwgdGhpcy5yb290KCkuc2NhbGUpKG9cIitpZHgrXCIpXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb2RlICs9IFwidGhpcy5yb290KCkuc2NhbGUob1wiK2lkeCtcIilcIjtcbiAgICAgIH1cbiAgICAgIGNvZGUgKz0gXCIpXCJcbiAgICB9XG5cbiAgICBpZihzcGVjLmludmVydCA9PT0gdHJ1ZSkgeyAgLy8gQWxsb3cgc3BlYy5pbnZlcnQuYXJnP1xuICAgICAgY29kZSArPSBcIi5pbnZlcnRcIlxuICAgIH1cblxuICAgIHJldHVybiBjb2RlK1wiO1xcblwiO1xuICB9XG5cbiAgKHNwZWMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24ocykge1xuICAgIHZhciBwYXJzZSA9IHR5cGVzW3MudHlwZV0ocyksXG4gICAgICAgIHByZWQgID0gRnVuY3Rpb24oXCJhcmdzXCIsIFwiZGJcIiwgXCJzaWduYWxzXCIsIFwicHJlZGljYXRlc1wiLCBwYXJzZS5jb2RlKTtcbiAgICBwcmVkLnJvb3QgPSBmdW5jdGlvbigpIHsgcmV0dXJuIG1vZGVsLnNjZW5lKCkuaXRlbXNbMF0gfTsgLy8gRm9yIGdsb2JhbCBzY2FsZXNcbiAgICBwcmVkLmlzRnVuY3Rpb24gPSBkbC5pc0Z1bmN0aW9uO1xuICAgIHByZWQuc2lnbmFscyA9IHBhcnNlLnNpZ25hbHM7XG4gICAgcHJlZC5kYXRhID0gcGFyc2UuZGF0YTtcbiAgICBtb2RlbC5wcmVkaWNhdGUocy5uYW1lLCBwcmVkKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHNwZWM7XG59IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGNvbmZpZyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uZmlnJyk7XG5cbnZhciBERVBTID0gW1wic2lnbmFsc1wiLCBcInNjYWxlc1wiLCBcImRhdGFcIiwgXCJmaWVsZHNcIl07XG5cbmZ1bmN0aW9uIGNvbXBpbGUobW9kZWwsIG1hcmssIHNwZWMpIHtcbiAgdmFyIGNvZGUgPSBcIlwiLFxuICAgICAgbmFtZXMgPSBkbC5rZXlzKHNwZWMpLFxuICAgICAgaSwgbGVuLCBuYW1lLCByZWYsIHZhcnMgPSB7fSwgXG4gICAgICBkZXBzID0ge1xuICAgICAgICBzaWduYWxzOiB7fSxcbiAgICAgICAgc2NhbGVzOiAge30sXG4gICAgICAgIGRhdGE6ICAgIHt9LFxuICAgICAgICBmaWVsZHM6ICB7fSxcbiAgICAgICAgcmVmbG93OiAgZmFsc2VcbiAgICAgIH07XG4gICAgICBcbiAgY29kZSArPSBcInZhciBvID0gdHJhbnMgPyB7fSA6IGl0ZW07XFxuXCJcbiAgXG4gIGZvciAoaT0wLCBsZW49bmFtZXMubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgcmVmID0gc3BlY1tuYW1lID0gbmFtZXNbaV1dO1xuICAgIGNvZGUgKz0gKGkgPiAwKSA/IFwiXFxuICBcIiA6IFwiICBcIjtcbiAgICBpZihyZWYucnVsZSkge1xuICAgICAgcmVmID0gcnVsZShtb2RlbCwgbmFtZSwgcmVmLnJ1bGUpO1xuICAgICAgY29kZSArPSBcIlxcbiAgXCIgKyByZWYuY29kZVxuICAgIH0gZWxzZSB7XG4gICAgICByZWYgPSB2YWx1ZVJlZihuYW1lLCByZWYpO1xuICAgICAgY29kZSArPSBcInRoaXMudHBsLnNldChvLCBcIitkbC5zdHIobmFtZSkrXCIsIFwiK3JlZi52YWwrXCIpO1wiO1xuICAgIH1cblxuICAgIHZhcnNbbmFtZV0gPSB0cnVlO1xuICAgIERFUFMuZm9yRWFjaChmdW5jdGlvbihwKSB7XG4gICAgICBpZihyZWZbcF0gIT0gbnVsbCkgZGwuYXJyYXkocmVmW3BdKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHsgZGVwc1twXVtrXSA9IDEgfSk7XG4gICAgfSk7XG4gICAgZGVwcy5yZWZsb3cgPSBkZXBzLnJlZmxvdyB8fCByZWYucmVmbG93O1xuICB9XG5cbiAgaWYgKHZhcnMueDIpIHtcbiAgICBpZiAodmFycy54KSB7XG4gICAgICBjb2RlICs9IFwiXFxuICBpZiAoby54ID4gby54MikgeyBcIlxuICAgICAgICAgICAgKyBcInZhciB0ID0gby54O1wiXG4gICAgICAgICAgICArIFwidGhpcy50cGwuc2V0KG8sICd4Jywgby54Mik7XCJcbiAgICAgICAgICAgICsgXCJ0aGlzLnRwbC5zZXQobywgJ3gyJywgdCk7IFwiXG4gICAgICAgICAgICArIFwifTtcIjtcbiAgICAgIGNvZGUgKz0gXCJcXG4gIHRoaXMudHBsLnNldChvLCAnd2lkdGgnLCAoby54MiAtIG8ueCkpO1wiO1xuICAgIH0gZWxzZSBpZiAodmFycy53aWR0aCkge1xuICAgICAgY29kZSArPSBcIlxcbiAgdGhpcy50cGwuc2V0KG8sICd4JywgKG8ueDIgLSBvLndpZHRoKSk7XCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUgKz0gXCJcXG4gIHRoaXMudHBsLnNldChvLCAneCcsIG8ueDIpO1wiXG4gICAgfVxuICB9XG5cbiAgaWYgKHZhcnMueTIpIHtcbiAgICBpZiAodmFycy55KSB7XG4gICAgICBjb2RlICs9IFwiXFxuICBpZiAoby55ID4gby55MikgeyBcIlxuICAgICAgICAgICAgKyBcInZhciB0ID0gby55O1wiXG4gICAgICAgICAgICArIFwidGhpcy50cGwuc2V0KG8sICd5Jywgby55Mik7XCJcbiAgICAgICAgICAgICsgXCJ0aGlzLnRwbC5zZXQobywgJ3kyJywgdCk7XCJcbiAgICAgICAgICAgICsgXCJ9O1wiO1xuICAgICAgY29kZSArPSBcIlxcbiAgdGhpcy50cGwuc2V0KG8sICdoZWlnaHQnLCAoby55MiAtIG8ueSkpO1wiO1xuICAgIH0gZWxzZSBpZiAodmFycy5oZWlnaHQpIHtcbiAgICAgIGNvZGUgKz0gXCJcXG4gIHRoaXMudHBsLnNldChvLCAneScsIChvLnkyIC0gby5oZWlnaHQpKTtcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29kZSArPSBcIlxcbiAgdGhpcy50cGwuc2V0KG8sICd5Jywgby55Mik7XCJcbiAgICB9XG4gIH1cbiAgXG4gIGlmIChoYXNQYXRoKG1hcmssIHZhcnMpKSBjb2RlICs9IFwiXFxuICBpdGVtLnRvdWNoKCk7XCI7XG4gIGNvZGUgKz0gXCJcXG4gIGlmICh0cmFucykgdHJhbnMuaW50ZXJwb2xhdGUoaXRlbSwgbyk7XCI7XG5cbiAgdHJ5IHtcbiAgICB2YXIgZW5jb2RlciA9IEZ1bmN0aW9uKFwiaXRlbVwiLCBcImdyb3VwXCIsIFwidHJhbnNcIiwgXCJkYlwiLCBcbiAgICAgIFwic2lnbmFsc1wiLCBcInByZWRpY2F0ZXNcIiwgY29kZSk7XG4gICAgZW5jb2Rlci50cGwgID0gdHVwbGU7XG4gICAgZW5jb2Rlci51dGlsID0gZGw7XG4gICAgZW5jb2Rlci5kMyAgID0gZDM7IC8vIEZvciBjb2xvciBzcGFjZXNcbiAgICByZXR1cm4ge1xuICAgICAgZW5jb2RlOiAgZW5jb2RlcixcbiAgICAgIHNpZ25hbHM6IGRsLmtleXMoZGVwcy5zaWduYWxzKSxcbiAgICAgIHNjYWxlczogIGRsLmtleXMoZGVwcy5zY2FsZXMpLFxuICAgICAgZGF0YTogICAgZGwua2V5cyhkZXBzLmRhdGEpLFxuICAgICAgZmllbGRzOiAgZGwua2V5cyhkZXBzLmZpZWxkcyksXG4gICAgICByZWZsb3c6ICBkZXBzLnJlZmxvd1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGRsLmVycm9yKGUpO1xuICAgIGRsLmxvZyhjb2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoYXNQYXRoKG1hcmssIHZhcnMpIHtcbiAgcmV0dXJuIHZhcnMucGF0aCB8fFxuICAgICgobWFyaz09PVwiYXJlYVwiIHx8IG1hcms9PT1cImxpbmVcIikgJiZcbiAgICAgICh2YXJzLnggfHwgdmFycy54MiB8fCB2YXJzLndpZHRoIHx8XG4gICAgICAgdmFycy55IHx8IHZhcnMueTIgfHwgdmFycy5oZWlnaHQgfHxcbiAgICAgICB2YXJzLnRlbnNpb24gfHwgdmFycy5pbnRlcnBvbGF0ZSkpO1xufVxuXG5mdW5jdGlvbiBydWxlKG1vZGVsLCBuYW1lLCBydWxlcykge1xuICB2YXIgc2lnbmFscyA9IFtdLCBzY2FsZXMgPSBbXSwgZGIgPSBbXSxcbiAgICAgIGlucHV0cyA9IFtdLCBjb2RlID0gXCJcIjtcblxuICAocnVsZXN8fFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHIsIGkpIHtcbiAgICB2YXIgcHJlZE5hbWUgPSByLnByZWRpY2F0ZSxcbiAgICAgICAgcHJlZCA9IG1vZGVsLnByZWRpY2F0ZShwcmVkTmFtZSksXG4gICAgICAgIHAgPSBcInByZWRpY2F0ZXNbXCIrZGwuc3RyKHByZWROYW1lKStcIl1cIixcbiAgICAgICAgaW5wdXQgPSBbXSwgYXJncyA9IG5hbWUrXCJfYXJnXCIraSxcbiAgICAgICAgcmVmO1xuXG4gICAgZGwua2V5cyhyLmlucHV0KS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgIHZhciByZWYgPSB2YWx1ZVJlZihpLCByLmlucHV0W2tdKTtcbiAgICAgIGlucHV0LnB1c2goZGwuc3RyKGspK1wiOiBcIityZWYudmFsKTtcbiAgICAgIGlmKHJlZi5zaWduYWxzKSBzaWduYWxzLnB1c2guYXBwbHkoc2lnbmFscywgZGwuYXJyYXkocmVmLnNpZ25hbHMpKTtcbiAgICAgIGlmKHJlZi5zY2FsZXMpICBzY2FsZXMucHVzaC5hcHBseShzY2FsZXMsIGRsLmFycmF5KHJlZi5zY2FsZXMpKTtcbiAgICB9KTtcblxuICAgIHJlZiA9IHZhbHVlUmVmKG5hbWUsIHIpO1xuICAgIGlmKHJlZi5zaWduYWxzKSBzaWduYWxzLnB1c2guYXBwbHkoc2lnbmFscywgZGwuYXJyYXkocmVmLnNpZ25hbHMpKTtcbiAgICBpZihyZWYuc2NhbGVzKSAgc2NhbGVzLnB1c2guYXBwbHkoc2NhbGVzLCBkbC5hcnJheShyZWYuc2NhbGVzKSk7XG5cbiAgICBpZihwcmVkTmFtZSkge1xuICAgICAgc2lnbmFscy5wdXNoLmFwcGx5KHNpZ25hbHMsIHByZWQuc2lnbmFscyk7XG4gICAgICBkYi5wdXNoLmFwcGx5KGRiLCBwcmVkLmRhdGEpO1xuICAgICAgaW5wdXRzLnB1c2goYXJncytcIiA9IHtcIitpbnB1dC5qb2luKCcsICcpK1wifVwiKTtcbiAgICAgIGNvZGUgKz0gXCJpZihcIitwK1wiLmNhbGwoXCIrcCtcIixcIithcmdzK1wiLCBkYiwgc2lnbmFscywgcHJlZGljYXRlcykpIHtcXG5cIiArXG4gICAgICAgIFwiICAgIHRoaXMudHBsLnNldChvLCBcIitkbC5zdHIobmFtZSkrXCIsIFwiK3JlZi52YWwrXCIpO1xcblwiO1xuICAgICAgY29kZSArPSBydWxlc1tpKzFdID8gXCIgIH0gZWxzZSBcIiA6IFwiICB9XCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUgKz0gXCJ7XFxuXCIgKyBcbiAgICAgICAgXCIgICAgdGhpcy50cGwuc2V0KG8sIFwiK2RsLnN0cihuYW1lKStcIiwgXCIrcmVmLnZhbCtcIik7XFxuXCIrXG4gICAgICAgIFwiICB9XCI7XG4gICAgfVxuICB9KTtcblxuICBjb2RlID0gXCJ2YXIgXCIgKyBpbnB1dHMuam9pbihcIixcXG4gICAgICBcIikgKyBcIjtcXG4gIFwiICsgY29kZTtcbiAgcmV0dXJuIHtjb2RlOiBjb2RlLCBzaWduYWxzOiBzaWduYWxzLCBzY2FsZXM6IHNjYWxlcywgZGF0YTogZGJ9O1xufVxuXG5mdW5jdGlvbiB2YWx1ZVJlZihuYW1lLCByZWYpIHtcbiAgaWYgKHJlZiA9PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICBpZiAobmFtZT09PVwiZmlsbFwiIHx8IG5hbWU9PT1cInN0cm9rZVwiKSB7XG4gICAgaWYgKHJlZi5jKSB7XG4gICAgICByZXR1cm4gY29sb3JSZWYoXCJoY2xcIiwgcmVmLmgsIHJlZi5jLCByZWYubCk7XG4gICAgfSBlbHNlIGlmIChyZWYuaCB8fCByZWYucykge1xuICAgICAgcmV0dXJuIGNvbG9yUmVmKFwiaHNsXCIsIHJlZi5oLCByZWYucywgcmVmLmwpO1xuICAgIH0gZWxzZSBpZiAocmVmLmwgfHwgcmVmLmEpIHtcbiAgICAgIHJldHVybiBjb2xvclJlZihcImxhYlwiLCByZWYubCwgcmVmLmEsIHJlZi5iKTtcbiAgICB9IGVsc2UgaWYgKHJlZi5yIHx8IHJlZi5nIHx8IHJlZi5iKSB7XG4gICAgICByZXR1cm4gY29sb3JSZWYoXCJyZ2JcIiwgcmVmLnIsIHJlZi5nLCByZWYuYik7XG4gICAgfVxuICB9XG5cbiAgLy8gaW5pdGlhbGl6ZSB2YWx1ZVxuICB2YXIgdmFsID0gbnVsbCwgc2NhbGUgPSBudWxsLCBcbiAgICAgIHNnUmVmID0ge30sIGZSZWYgPSB7fSwgc1JlZiA9IHt9LFxuICAgICAgc2lnbmFscyA9IFtdLCBmaWVsZHMgPSBbXSwgcmVmbG93ID0gZmFsc2U7XG5cbiAgaWYgKHJlZi52YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdmFsID0gZGwuc3RyKHJlZi52YWx1ZSk7XG4gIH1cblxuICBpZiAocmVmLnNpZ25hbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgc2dSZWYgPSBkbC5maWVsZChyZWYuc2lnbmFsKTtcbiAgICB2YWwgPSBcInNpZ25hbHNbXCIrc2dSZWYubWFwKGRsLnN0cikuam9pbihcIl1bXCIpK1wiXVwiOyBcbiAgICBzaWduYWxzLnB1c2goc2dSZWYuc2hpZnQoKSk7XG4gIH1cblxuICBpZihyZWYuZmllbGQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJlZi5maWVsZCA9IGRsLmlzU3RyaW5nKHJlZi5maWVsZCkgPyB7ZGF0dW06IHJlZi5maWVsZH0gOiByZWYuZmllbGQ7XG4gICAgZlJlZiAgPSBmaWVsZFJlZihyZWYuZmllbGQpO1xuICAgIHZhbCA9IGZSZWYudmFsO1xuICB9XG5cbiAgaWYgKHJlZi5zY2FsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgc1JlZiA9IHNjYWxlUmVmKHJlZi5zY2FsZSk7XG4gICAgc2NhbGUgPSBzUmVmLnZhbDtcblxuICAgIC8vIHJ1biB0aHJvdWdoIHNjYWxlIGZ1bmN0aW9uIGlmIHZhbCBzcGVjaWZpZWQuXG4gICAgLy8gaWYgbm8gdmFsLCBzY2FsZSBmdW5jdGlvbiBpcyBwcmVkaWNhdGUgYXJnLlxuICAgIGlmKHZhbCAhPT0gbnVsbCB8fCByZWYuYmFuZCB8fCByZWYubXVsdCB8fCByZWYub2Zmc2V0KSB7XG4gICAgICB2YWwgPSBzY2FsZSArIChyZWYuYmFuZCA/IFwiLnJhbmdlQmFuZCgpXCIgOiBcbiAgICAgICAgXCIoXCIrKHZhbCAhPT0gbnVsbCA/IHZhbCA6IFwiaXRlbS5kYXR1bS5kYXRhXCIpK1wiKVwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsID0gc2NhbGU7XG4gICAgfVxuICB9XG4gIFxuICAvLyBtdWx0aXBseSwgb2Zmc2V0LCByZXR1cm4gdmFsdWVcbiAgdmFsID0gXCIoXCIgKyAocmVmLm11bHQ/KGRsLm51bWJlcihyZWYubXVsdCkrXCIgKiBcIik6XCJcIikgKyB2YWwgKyBcIilcIlxuICAgICsgKHJlZi5vZmZzZXQgPyBcIiArIFwiICsgZGwubnVtYmVyKHJlZi5vZmZzZXQpIDogXCJcIik7XG5cbiAgLy8gQ29sbGF0ZSBkZXBlbmRlbmNpZXNcbiAgcmV0dXJuIHtcbiAgICB2YWw6IHZhbCxcbiAgICBzaWduYWxzOiBzaWduYWxzLmNvbmNhdChkbC5hcnJheShmUmVmLnNpZ25hbHMpKS5jb25jYXQoZGwuYXJyYXkoc1JlZi5zaWduYWxzKSksXG4gICAgZmllbGRzOiAgZmllbGRzLmNvbmNhdChkbC5hcnJheShmUmVmLmZpZWxkcykpLmNvbmNhdChkbC5hcnJheShzUmVmLmZpZWxkcykpLFxuICAgIHNjYWxlczogIHJlZi5zY2FsZSA/IChyZWYuc2NhbGUubmFtZSB8fCByZWYuc2NhbGUpIDogbnVsbCwgLy8gVE9ETzogY29ubmVjdCBzUmVmJ2Qgc2NhbGU/XG4gICAgcmVmbG93OiAgcmVmbG93IHx8IGZSZWYucmVmbG93IHx8IHNSZWYucmVmbG93XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbG9yUmVmKHR5cGUsIHgsIHksIHopIHtcbiAgdmFyIHh4ID0geCA/IHZhbHVlUmVmKFwiXCIsIHgpIDogY29uZmlnLmNvbG9yW3R5cGVdWzBdLFxuICAgICAgeXkgPSB5ID8gdmFsdWVSZWYoXCJcIiwgeSkgOiBjb25maWcuY29sb3JbdHlwZV1bMV0sXG4gICAgICB6eiA9IHogPyB2YWx1ZVJlZihcIlwiLCB6KSA6IGNvbmZpZy5jb2xvclt0eXBlXVsyXVxuICAgICAgc2lnbmFscyA9IFtdLCBzY2FsZXMgPSBbXTtcblxuICBbeHgsIHl5LCB6el0uZm9yRWFjaChmdW5jdGlvbih2KSB7XG4gICAgaWYodi5zaWduYWxzKSBzaWduYWxzLnB1c2guYXBwbHkoc2lnbmFscywgdi5zaWduYWxzKTtcbiAgICBpZih2LnNjYWxlcykgIHNjYWxlcy5wdXNoKHYuc2NhbGVzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICB2YWw6IFwiKHRoaXMuZDMuXCIgKyB0eXBlICsgXCIoXCIgKyBbeHgudmFsLCB5eS52YWwsIHp6LnZhbF0uam9pbihcIixcIikgKyAnKSArIFwiXCIpJyxcbiAgICBzaWduYWxzOiBzaWduYWxzLFxuICAgIHNjYWxlczogc2NhbGVzXG4gIH07XG59XG5cbi8vIHtmaWVsZDoge2RhdHVtOiBcImZvb1wifSB9ICAtPiBpdGVtLmRhdHVtLmZvb1xuLy8ge2ZpZWxkOiB7Z3JvdXA6IFwiZm9vXCJ9IH0gIC0+IGdyb3VwLmZvb1xuLy8ge2ZpZWxkOiB7cGFyZW50OiBcImZvb1wifSB9IC0+IGdyb3VwLmRhdHVtLmZvb1xuZnVuY3Rpb24gZmllbGRSZWYocmVmKSB7XG4gIGlmKGRsLmlzU3RyaW5nKHJlZikpIHtcbiAgICByZXR1cm4ge3ZhbDogZGwuZmllbGQocmVmKS5tYXAoZGwuc3RyKS5qb2luKFwiXVtcIil9O1xuICB9IFxuXG4gIC8vIFJlc29sdmUgbmVzdGluZy9wYXJlbnQgbG9va3Vwc1xuICB2YXIgbCA9IHJlZi5sZXZlbCxcbiAgICAgIG5lc3RlZCA9IChyZWYuZ3JvdXAgfHwgcmVmLnBhcmVudCkgJiYgbCxcbiAgICAgIHNjb3BlID0gbmVzdGVkID8gQXJyYXkobCkuam9pbihcImdyb3VwLm1hcmsuXCIpIDogXCJcIixcbiAgICAgIHIgPSBmaWVsZFJlZihyZWYuZGF0dW0gfHwgcmVmLmdyb3VwIHx8IHJlZi5wYXJlbnQgfHwgcmVmLnNpZ25hbCksXG4gICAgICB2YWwgPSByLnZhbCxcbiAgICAgIGZpZWxkcyAgPSByLmZpZWxkcyAgfHwgW10sXG4gICAgICBzaWduYWxzID0gci5zaWduYWxzIHx8IFtdLFxuICAgICAgcmVmbG93ICA9IHIucmVmbG93ICB8fCBmYWxzZTsgLy8gTmVzdGVkIGZpZWxkcmVmcyB0cmlnZ2VyIGZ1bGwgcmVldmFsIG9mIEVuY29kZXIuXG5cbiAgaWYocmVmLmRhdHVtKSB7XG4gICAgdmFsID0gXCJpdGVtLmRhdHVtW1wiK3ZhbCtcIl1cIjtcbiAgICBmaWVsZHMucHVzaChyZWYuZGF0dW0pO1xuICB9IGVsc2UgaWYocmVmLmdyb3VwKSB7XG4gICAgdmFsID0gc2NvcGUrXCJncm91cFtcIit2YWwrXCJdXCI7XG4gICAgcmVmbG93ID0gdHJ1ZTtcbiAgfSBlbHNlIGlmKHJlZi5wYXJlbnQpIHtcbiAgICB2YWwgPSBzY29wZStcImdyb3VwLmRhdHVtW1wiK3ZhbCtcIl1cIjtcbiAgICByZWZsb3cgPSB0cnVlO1xuICB9IGVsc2UgaWYocmVmLnNpZ25hbCkge1xuICAgIHZhbCA9IFwic2lnbmFsc1tcIit2YWwrXCJdXCI7XG4gICAgc2lnbmFscy5wdXNoKGRsLmZpZWxkKHJlZi5zaWduYWwpWzBdKTtcbiAgICByZWZsb3cgPSB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIHt2YWw6IHZhbCwgZmllbGRzOiBmaWVsZHMsIHNpZ25hbHM6IHNpZ25hbHMsIHJlZmxvdzogcmVmbG93fTtcbn1cblxuLy8ge3NjYWxlOiBcInhcIn1cbi8vIHtzY2FsZToge25hbWU6IFwieFwifX0sXG4vLyB7c2NhbGU6IGZpZWxkUmVmfVxuZnVuY3Rpb24gc2NhbGVSZWYocmVmKSB7XG4gIHZhciBzY2FsZSA9IG51bGwsXG4gICAgICBmciA9IG51bGw7XG5cbiAgaWYoZGwuaXNTdHJpbmcocmVmKSkge1xuICAgIHNjYWxlID0gZGwuc3RyKHJlZik7XG4gIH0gZWxzZSBpZihyZWYubmFtZSkge1xuICAgIHNjYWxlID0gZGwuaXNTdHJpbmcocmVmLm5hbWUpID8gZGwuc3RyKHJlZi5uYW1lKSA6IChmciA9IGZpZWxkUmVmKHJlZi5uYW1lKSkudmFsO1xuICB9IGVsc2Uge1xuICAgIHNjYWxlID0gKGZyID0gZmllbGRSZWYocmVmKSkudmFsO1xuICB9XG5cbiAgc2NhbGUgPSBcImdyb3VwLnNjYWxlKFwiK3NjYWxlK1wiKVwiO1xuICBpZihyZWYuaW52ZXJ0KSBzY2FsZSArPSBcIi5pbnZlcnRcIjsgIC8vIFRPRE86IG9yZGluYWwgc2NhbGVzXG5cbiAgcmV0dXJuIGZyID8gKGZyLnZhbCA9IHNjYWxlLCBmcikgOiB7dmFsOiBzY2FsZX07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29tcGlsZTsiLCJ2YXIgZXhwciA9IHJlcXVpcmUoJy4vZXhwcicpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhcnNlU2lnbmFscyhtb2RlbCwgc3BlYykge1xuICB2YXIgZ3JhcGggPSBtb2RlbC5ncmFwaDtcblxuICAvLyBwcm9jZXNzIGVhY2ggc2lnbmFsIGRlZmluaXRpb25cbiAgKHNwZWMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24ocykge1xuICAgIHZhciBzaWduYWwgPSBncmFwaC5zaWduYWwocy5uYW1lLCBzLmluaXQpLFxuICAgICAgICBleHA7XG5cbiAgICBpZihzLmV4cHIpIHtcbiAgICAgIGV4cCA9IGV4cHIocy5leHByKTtcbiAgICAgIHNpZ25hbC5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGV4cHIuZXZhbChncmFwaCwgZXhwLmZuLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBleHAuc2lnbmFscyk7XG4gICAgICAgIGlmKHNwZWMuc2NhbGUpIHZhbHVlID0gbW9kZWwuc2NhbGUoc3BlYywgdmFsdWUpO1xuICAgICAgICBzaWduYWwudmFsdWUodmFsdWUpO1xuICAgICAgICBpbnB1dC5zaWduYWxzW3MubmFtZV0gPSAxO1xuICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICB9O1xuICAgICAgc2lnbmFsLmRlcGVuZGVuY3koQy5TSUdOQUxTLCBleHAuc2lnbmFscyk7XG4gICAgICBleHAuc2lnbmFscy5mb3JFYWNoKGZ1bmN0aW9uKGRlcCkgeyBncmFwaC5zaWduYWwoZGVwKS5hZGRMaXN0ZW5lcihzaWduYWwpOyB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBzcGVjO1xufTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuLi9jb3JlL01vZGVsJyksIFxuICAgIFZpZXcgPSByZXF1aXJlKCcuLi9jb3JlL1ZpZXcnKSwgXG4gICAgcGFyc2VQYWRkaW5nID0gcmVxdWlyZSgnLi4vcGFyc2UvcGFkZGluZycpLFxuICAgIHBhcnNlTWFya3MgPSByZXF1aXJlKCcuLi9wYXJzZS9tYXJrcycpLFxuICAgIHBhcnNlU2lnbmFscyA9IHJlcXVpcmUoJy4uL3BhcnNlL3NpZ25hbHMnKSxcbiAgICBwYXJzZVByZWRpY2F0ZXMgPSByZXF1aXJlKCcuLi9wYXJzZS9wcmVkaWNhdGVzJyksXG4gICAgcGFyc2VEYXRhID0gcmVxdWlyZSgnLi4vcGFyc2UvZGF0YScpLFxuICAgIHBhcnNlSW50ZXJhY3RvcnMgPSByZXF1aXJlKCcuLi9wYXJzZS9pbnRlcmFjdG9ycycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhcnNlU3BlYyhzcGVjLCBjYWxsYmFjaywgdmlld0ZhY3RvcnkpIHtcbiAgLy8gcHJvdGVjdCBhZ2FpbnN0IHN1YnNlcXVlbnQgc3BlYyBtb2RpZmljYXRpb25cbiAgc3BlYyA9IGRsLmR1cGxpY2F0ZShzcGVjKTtcblxuICB2aWV3RmFjdG9yeSA9IHZpZXdGYWN0b3J5IHx8IFZpZXcuZmFjdG9yeTtcblxuICB2YXIgd2lkdGggPSBzcGVjLndpZHRoIHx8IDUwMCxcbiAgICAgIGhlaWdodCA9IHNwZWMuaGVpZ2h0IHx8IDUwMCxcbiAgICAgIHZpZXdwb3J0ID0gc3BlYy52aWV3cG9ydCB8fCBudWxsLFxuICAgICAgbW9kZWwgPSBuZXcgTW9kZWwoKTtcblxuICBwYXJzZUludGVyYWN0b3JzKG1vZGVsLCBzcGVjLCBmdW5jdGlvbigpIHtcbiAgICBtb2RlbC5kZWZzKHtcbiAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgdmlld3BvcnQ6IHZpZXdwb3J0LFxuICAgICAgcGFkZGluZzogcGFyc2VQYWRkaW5nKHNwZWMucGFkZGluZyksXG4gICAgICBzaWduYWxzOiBwYXJzZVNpZ25hbHMobW9kZWwsIHNwZWMuc2lnbmFscyksXG4gICAgICBwcmVkaWNhdGVzOiBwYXJzZVByZWRpY2F0ZXMobW9kZWwsIHNwZWMucHJlZGljYXRlcyksXG4gICAgICBtYXJrczogcGFyc2VNYXJrcyhtb2RlbCwgc3BlYywgd2lkdGgsIGhlaWdodCksXG4gICAgICBkYXRhOiBwYXJzZURhdGEobW9kZWwsIHNwZWMuZGF0YSwgZnVuY3Rpb24oKSB7IGNhbGxiYWNrKHZpZXdGYWN0b3J5KG1vZGVsKSk7IH0pXG4gICAgfSk7XG4gIH0pO1xufSIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICAgIE5vZGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Ob2RlJyksXG4gICAgY2hhbmdzZXQgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9jaGFuZ2VzZXQnKSxcbiAgICBzZWxlY3RvciA9IHJlcXVpcmUoJy4vZXZlbnRzJyksXG4gICAgZXhwciA9IHJlcXVpcmUoJy4vZXhwcicpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG52YXIgU1RBUlQgPSBcInN0YXJ0XCIsIE1JRERMRSA9IFwibWlkZGxlXCIsIEVORCA9IFwiZW5kXCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmlldykge1xuICB2YXIgbW9kZWwgPSB2aWV3Lm1vZGVsKCksXG4gICAgICBncmFwaCA9IG1vZGVsLmdyYXBoLFxuICAgICAgc3BlYyAgPSBtb2RlbC5kZWZzKCkuc2lnbmFscyxcbiAgICAgIHJlZ2lzdGVyID0ge30sIG5vZGVzID0ge307XG5cbiAgZnVuY3Rpb24gc2NhbGUoc3BlYywgdmFsdWUpIHtcbiAgICB2YXIgZGVmID0gc3BlYy5zY2FsZSxcbiAgICAgICAgbmFtZSAgPSBkZWYubmFtZSB8fCBkZWYuc2lnbmFsIHx8IGRlZixcbiAgICAgICAgc2NvcGUgPSBkZWYuc2NvcGUgPyBncmFwaC5zaWduYWxSZWYoZGVmLnNjb3BlLnNpZ25hbCkgOiBudWxsO1xuXG4gICAgaWYoIXNjb3BlIHx8ICFzY29wZS5zY2FsZSkge1xuICAgICAgc2NvcGUgPSAoc2NvcGUgJiYgc2NvcGUubWFyaykgPyBzY29wZS5tYXJrLmdyb3VwIDogbW9kZWwuc2NlbmUoKS5pdGVtc1swXTtcbiAgICB9XG5cbiAgICB2YXIgc2NhbGUgPSBzY29wZS5zY2FsZShuYW1lKTtcbiAgICBpZighc2NhbGUpIHJldHVybiB2YWx1ZTtcbiAgICByZXR1cm4gZGVmLmludmVydCA/IHNjYWxlLmludmVydCh2YWx1ZSkgOiBzY2FsZSh2YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaWduYWwoc2lnLCBzZWxlY3RvciwgZXhwLCBzcGVjKSB7XG4gICAgdmFyIG4gPSBuZXcgTm9kZShncmFwaCk7XG4gICAgbi5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICBpZighaW5wdXQuc2lnbmFsc1tzZWxlY3Rvci5zaWduYWxdKSByZXR1cm4gZ3JhcGguZG9Ob3RQcm9wYWdhdGU7XG4gICAgICB2YXIgdmFsID0gZXhwci5ldmFsKGdyYXBoLCBleHAuZm4sIG51bGwsIG51bGwsIG51bGwsIG51bGwsIGV4cC5zaWduYWxzKTtcbiAgICAgIGlmKHNwZWMuc2NhbGUpIHZhbCA9IHNjYWxlKHNwZWMsIHZhbCk7XG4gICAgICBzaWcudmFsdWUodmFsKTtcbiAgICAgIGlucHV0LnNpZ25hbHNbc2lnLm5hbWUoKV0gPSAxO1xuICAgICAgaW5wdXQucmVmbG93ID0gdHJ1ZTtcbiAgICAgIHJldHVybiBpbnB1dDsgIFxuICAgIH07XG4gICAgbi5kZXBlbmRlbmN5KEMuU0lHTkFMUywgc2VsZWN0b3Iuc2lnbmFsKTtcbiAgICBuLmFkZExpc3RlbmVyKHNpZyk7XG4gICAgZ3JhcGguc2lnbmFsKHNlbGVjdG9yLnNpZ25hbCkuYWRkTGlzdGVuZXIobik7XG4gIH07XG5cbiAgZnVuY3Rpb24gZXZlbnQoc2lnLCBzZWxlY3RvciwgZXhwLCBzcGVjKSB7XG4gICAgdmFyIGZpbHRlcnMgPSBzZWxlY3Rvci5maWx0ZXJzIHx8IFtdLFxuICAgICAgICB0YXJnZXQgPSBzZWxlY3Rvci50YXJnZXQ7XG5cbiAgICBpZih0YXJnZXQpIGZpbHRlcnMucHVzaChcImkuXCIrdGFyZ2V0LnR5cGUrXCI9PVwiK2RsLnN0cih0YXJnZXQudmFsdWUpKTtcblxuICAgIHJlZ2lzdGVyW3NlbGVjdG9yLmV2ZW50XSA9IHJlZ2lzdGVyW3NlbGVjdG9yLmV2ZW50XSB8fCBbXTtcbiAgICByZWdpc3RlcltzZWxlY3Rvci5ldmVudF0ucHVzaCh7XG4gICAgICBzaWduYWw6IHNpZyxcbiAgICAgIGV4cDogZXhwLFxuICAgICAgZmlsdGVyczogZmlsdGVycy5tYXAoZnVuY3Rpb24oZikgeyByZXR1cm4gZXhwcihmKTsgfSksXG4gICAgICBzcGVjOiBzcGVjXG4gICAgfSk7XG5cbiAgICBub2Rlc1tzZWxlY3Rvci5ldmVudF0gPSBub2Rlc1tzZWxlY3Rvci5ldmVudF0gfHwgbmV3IE5vZGUoZ3JhcGgpO1xuICAgIG5vZGVzW3NlbGVjdG9yLmV2ZW50XS5hZGRMaXN0ZW5lcihzaWcpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIG9yZGVyZWRTdHJlYW0oc2lnLCBzZWxlY3RvciwgZXhwLCBzcGVjKSB7XG4gICAgdmFyIG5hbWUgPSBzaWcubmFtZSgpLCBcbiAgICAgICAgdHJ1ZUZuID0gZXhwcihcInRydWVcIiksXG4gICAgICAgIHMgPSB7fTtcblxuICAgIHNbU1RBUlRdICA9IGdyYXBoLnNpZ25hbChuYW1lICsgU1RBUlQsICBmYWxzZSk7XG4gICAgc1tNSURETEVdID0gZ3JhcGguc2lnbmFsKG5hbWUgKyBNSURETEUsIGZhbHNlKTtcbiAgICBzW0VORF0gICAgPSBncmFwaC5zaWduYWwobmFtZSArIEVORCwgICAgZmFsc2UpO1xuXG4gICAgdmFyIHJvdXRlciA9IG5ldyBOb2RlKGdyYXBoKTtcbiAgICByb3V0ZXIuZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgaWYoc1tTVEFSVF0udmFsdWUoKSA9PT0gdHJ1ZSAmJiBzW0VORF0udmFsdWUoKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgLy8gVE9ETzogRXhwYW5kIHNlbGVjdG9yIHN5bnRheCB0byBhbGxvdyBzdGFydC9lbmQgc2lnbmFscyBpbnRvIHN0cmVhbS5cbiAgICAgICAgLy8gVW50aWwgdGhlbiwgcHJldmVudCBvbGQgbWlkZGxlcyBlbnRlcmluZyBzdHJlYW0gb24gbmV3IHN0YXJ0LlxuICAgICAgICBpZihpbnB1dC5zaWduYWxzW25hbWUrU1RBUlRdKSByZXR1cm4gZ3JhcGguZG9Ob3RQcm9wYWdhdGU7XG5cbiAgICAgICAgc2lnLnZhbHVlKHNbTUlERExFXS52YWx1ZSgpKTtcbiAgICAgICAgaW5wdXQuc2lnbmFsc1tuYW1lXSA9IDE7XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgIH1cblxuICAgICAgaWYoc1tFTkRdLnZhbHVlKCkgPT09IHRydWUpIHtcbiAgICAgICAgc1tTVEFSVF0udmFsdWUoZmFsc2UpO1xuICAgICAgICBzW0VORF0udmFsdWUoZmFsc2UpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZ3JhcGguZG9Ob3RQcm9wYWdhdGU7XG4gICAgfTtcbiAgICByb3V0ZXIuYWRkTGlzdGVuZXIoc2lnKTtcblxuICAgIFtTVEFSVCwgTUlERExFLCBFTkRdLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgICAgdmFyIHZhbCA9ICh4ID09IE1JRERMRSkgPyBleHAgOiB0cnVlRm4sXG4gICAgICAgICAgc3AgPSAoeCA9PSBNSURETEUpID8gc3BlYyA6IHt9O1xuXG4gICAgICBpZihzZWxlY3Rvclt4XS5ldmVudCkgZXZlbnQoc1t4XSwgc2VsZWN0b3JbeF0sIHZhbCwgc3ApO1xuICAgICAgZWxzZSBpZihzZWxlY3Rvclt4XS5zaWduYWwpIHNpZ25hbChzW3hdLCBzZWxlY3Rvclt4XSwgdmFsLCBzcCk7XG4gICAgICBlbHNlIGlmKHNlbGVjdG9yW3hdLnN0cmVhbSkgbWVyZ2VkU3RyZWFtKHNbeF0sIHNlbGVjdG9yW3hdLnN0cmVhbSwgdmFsLCBzcCk7XG4gICAgICBzW3hdLmFkZExpc3RlbmVyKHJvdXRlcik7XG4gICAgfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gbWVyZ2VkU3RyZWFtKHNpZywgc2VsZWN0b3IsIGV4cCwgc3BlYykge1xuICAgIHNlbGVjdG9yLmZvckVhY2goZnVuY3Rpb24ocykge1xuICAgICAgaWYocy5ldmVudCkgICAgICAgZXZlbnQoc2lnLCBzLCBleHAsIHNwZWMpO1xuICAgICAgZWxzZSBpZihzLnNpZ25hbCkgc2lnbmFsKHNpZywgcywgZXhwLCBzcGVjKTtcbiAgICAgIGVsc2UgaWYocy5zdGFydCkgIG9yZGVyZWRTdHJlYW0oc2lnLCBzLCBleHAsIHNwZWMpO1xuICAgICAgZWxzZSBpZihzLnN0cmVhbSkgbWVyZ2VkU3RyZWFtKHNpZywgcy5zdHJlYW0sIGV4cCwgc3BlYyk7XG4gICAgfSk7XG4gIH07XG5cbiAgKHNwZWMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oc2lnKSB7XG4gICAgdmFyIHNpZ25hbCA9IGdyYXBoLnNpZ25hbChzaWcubmFtZSk7XG4gICAgaWYoc2lnLmV4cHIpIHJldHVybjsgIC8vIENhbm5vdCBoYXZlIGFuIGV4cHIgYW5kIHN0cmVhbSBkZWZpbml0aW9uLlxuXG4gICAgKHNpZy5zdHJlYW1zIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHN0cmVhbSkge1xuICAgICAgdmFyIHNlbCA9IHNlbGVjdG9yLnBhcnNlKHN0cmVhbS50eXBlKSxcbiAgICAgICAgICBleHAgPSBleHByKHN0cmVhbS5leHByKTtcbiAgICAgIG1lcmdlZFN0cmVhbShzaWduYWwsIHNlbCwgZXhwLCBzdHJlYW0pO1xuICAgIH0pO1xuICB9KTtcblxuICAvLyBXZSByZWdpc3RlciB0aGUgZXZlbnQgbGlzdGVuZXJzIGFsbCB0b2dldGhlciBzbyB0aGF0IGlmIG11bHRpcGxlXG4gIC8vIHNpZ25hbHMgYXJlIHJlZ2lzdGVyZWQgb24gdGhlIHNhbWUgZXZlbnQsIHRoZXkgd2lsbCByZWNlaXZlIHRoZVxuICAvLyBuZXcgdmFsdWUgb24gdGhlIHNhbWUgcHVsc2UuIFxuXG4gIC8vIFRPRE86IEZpbHRlcnMsIHRpbWUgaW50ZXJ2YWxzLCB0YXJnZXQgc2VsZWN0b3JzXG4gIGRsLmtleXMocmVnaXN0ZXIpLmZvckVhY2goZnVuY3Rpb24ocikge1xuICAgIHZhciBoYW5kbGVycyA9IHJlZ2lzdGVyW3JdLCBcbiAgICAgICAgbm9kZSA9IG5vZGVzW3JdO1xuXG4gICAgdmlldy5vbihyLCBmdW5jdGlvbihldnQsIGl0ZW0pIHtcbiAgICAgIHZhciBjcyA9IGNoYW5nc2V0LmNyZWF0ZShudWxsLCB0cnVlKSxcbiAgICAgICAgICBwYWQgPSB2aWV3LnBhZGRpbmcoKSxcbiAgICAgICAgICBmaWx0ZXJlZCA9IGZhbHNlLFxuICAgICAgICAgIHZhbCwgaCwgaSwgbSwgZDtcblxuICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7IC8vIFN0b3AgdGV4dCBzZWxlY3Rpb25cbiAgICAgIG0gPSBkMy5tb3VzZSgoZDMuZXZlbnQ9ZXZ0LCB2aWV3Ll9lbCkpOyAvLyBSZWxhdGl2ZSBwb3NpdGlvbiB3aXRoaW4gY29udGFpbmVyXG4gICAgICBpdGVtID0gaXRlbXx8e307XG4gICAgICBkID0gaXRlbS5kYXR1bXx8e307XG4gICAgICB2YXIgcCA9IHt4OiBtWzBdIC0gcGFkLmxlZnQsIHk6IG1bMV0gLSBwYWQudG9wfTtcblxuICAgICAgZm9yKGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaCA9IGhhbmRsZXJzW2ldO1xuICAgICAgICBmaWx0ZXJlZCA9IGguZmlsdGVycy5zb21lKGZ1bmN0aW9uKGYpIHtcbiAgICAgICAgICByZXR1cm4gIWV4cHIuZXZhbChncmFwaCwgZi5mbiwgZCwgZXZ0LCBpdGVtLCBwLCBmLnNpZ25hbHMpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYoZmlsdGVyZWQpIGNvbnRpbnVlO1xuICAgICAgICBcbiAgICAgICAgdmFsID0gZXhwci5ldmFsKGdyYXBoLCBoLmV4cC5mbiwgZCwgZXZ0LCBpdGVtLCBwLCBoLmV4cC5zaWduYWxzKTsgXG4gICAgICAgIGlmKGguc3BlYy5zY2FsZSkgdmFsID0gc2NhbGUoaC5zcGVjLCB2YWwsIGl0ZW0pO1xuICAgICAgICBoLnNpZ25hbC52YWx1ZSh2YWwpO1xuICAgICAgICBjcy5zaWduYWxzW2guc2lnbmFsLm5hbWUoKV0gPSAxO1xuICAgICAgfVxuXG4gICAgICBncmFwaC5wcm9wYWdhdGUoY3MsIG5vZGUpO1xuICAgIH0pO1xuICB9KVxufTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgdHJhbnNmb3JtcyA9IHJlcXVpcmUoJy4uL3RyYW5zZm9ybXMvaW5kZXgnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZVRyYW5zZm9ybXMobW9kZWwsIGRlZikge1xuICB2YXIgdHggPSBuZXcgdHJhbnNmb3Jtc1tkZWYudHlwZV0obW9kZWwuZ3JhcGgpO1xuICBpZihkZWYudHlwZSA9PSAnZmFjZXQnKSB7XG4gICAgdmFyIHBpcGVsaW5lID0gKGRlZi50cmFuc2Zvcm18fFtdKVxuICAgICAgLm1hcChmdW5jdGlvbih0KSB7IHJldHVybiBwYXJzZVRyYW5zZm9ybXMobW9kZWwsIHQpOyB9KTtcbiAgICB0eC5waXBlbGluZShwaXBlbGluZSk7XG4gIH1cblxuICAvLyBXZSB3YW50IHRvIHJlbmFtZSBvdXRwdXQgZmllbGRzIGJlZm9yZSBzZXR0aW5nIGFueSBvdGhlciBwcm9wZXJ0aWVzLFxuICAvLyBhcyBzdWJzZXF1ZW50IHByb3BlcnRpZXMgbWF5IHJlcXVpcmUgb3V0cHV0IHRvIGJlIHNldCAoZS5nLiBncm91cCBieSkuXG4gIGlmKGRlZi5vdXRwdXQpIHR4Lm91dHB1dChkZWYub3V0cHV0KTtcblxuICBkbC5rZXlzKGRlZikuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgaWYoayA9PT0gJ3R5cGUnIHx8IGsgPT09ICdvdXRwdXQnKSByZXR1cm47XG4gICAgaWYoayA9PT0gJ3RyYW5zZm9ybScgJiYgZGVmLnR5cGUgPT09ICdmYWNldCcpIHJldHVybjtcbiAgICAodHhba10pLnNldCh0eCwgZGVmW2tdKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHR4O1xufTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgICBtYXJrcyA9IHJlcXVpcmUoJy4vbWFya3MnKTtcblxudmFyIGhhbmRsZXIgPSBmdW5jdGlvbihlbCwgbW9kZWwpIHtcbiAgdGhpcy5fYWN0aXZlID0gbnVsbDtcbiAgdGhpcy5faGFuZGxlcnMgPSB7fTtcbiAgaWYgKGVsKSB0aGlzLmluaXRpYWxpemUoZWwpO1xuICBpZiAobW9kZWwpIHRoaXMubW9kZWwobW9kZWwpO1xufTtcblxudmFyIHByb3RvdHlwZSA9IGhhbmRsZXIucHJvdG90eXBlO1xuXG5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKGVsLCBwYWQsIG9iaikge1xuICB0aGlzLl9lbCA9IGQzLnNlbGVjdChlbCkubm9kZSgpO1xuICB0aGlzLl9jYW52YXMgPSBkMy5zZWxlY3QoZWwpLnNlbGVjdChcImNhbnZhcy5tYXJrc1wiKS5ub2RlKCk7XG4gIHRoaXMuX3BhZGRpbmcgPSBwYWQ7XG4gIHRoaXMuX29iaiA9IG9iaiB8fCBudWxsO1xuICBcbiAgLy8gYWRkIGV2ZW50IGxpc3RlbmVyc1xuICB2YXIgY2FudmFzID0gdGhpcy5fY2FudmFzLCB0aGF0ID0gdGhpcztcbiAgZXZlbnRzLmZvckVhY2goZnVuY3Rpb24odHlwZSkge1xuICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgcHJvdG90eXBlW3R5cGVdLmNhbGwodGhhdCwgZXZ0KTtcbiAgICB9KTtcbiAgfSk7XG4gIFxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5wYWRkaW5nID0gZnVuY3Rpb24ocGFkKSB7XG4gIHRoaXMuX3BhZGRpbmcgPSBwYWQ7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLm1vZGVsID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fbW9kZWw7XG4gIHRoaXMuX21vZGVsID0gbW9kZWw7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLmhhbmRsZXJzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBoID0gdGhpcy5faGFuZGxlcnM7XG4gIHJldHVybiBkbC5rZXlzKGgpLnJlZHVjZShmdW5jdGlvbihhLCBrKSB7XG4gICAgcmV0dXJuIGhba10ucmVkdWNlKGZ1bmN0aW9uKGEsIHgpIHsgcmV0dXJuIChhLnB1c2goeCksIGEpOyB9LCBhKTtcbiAgfSwgW10pO1xufTtcblxuLy8gc2V0dXAgZXZlbnRzXG52YXIgZXZlbnRzID0gW1xuICBcIm1vdXNlZG93blwiLFxuICBcIm1vdXNldXBcIixcbiAgXCJjbGlja1wiLFxuICBcImRibGNsaWNrXCIsXG4gIFwid2hlZWxcIixcbiAgXCJrZXlkb3duXCIsXG4gIFwia2V5cHJlc3NcIixcbiAgXCJrZXl1cFwiLFxuICBcIm1vdXNld2hlZWxcIixcbiAgXCJ0b3VjaHN0YXJ0XCJcbl07XG5ldmVudHMuZm9yRWFjaChmdW5jdGlvbih0eXBlKSB7XG4gIHByb3RvdHlwZVt0eXBlXSA9IGZ1bmN0aW9uKGV2dCkge1xuICAgIHRoaXMuZmlyZSh0eXBlLCBldnQpO1xuICB9O1xufSk7XG5ldmVudHMucHVzaChcIm1vdXNlbW92ZVwiKTtcbmV2ZW50cy5wdXNoKFwibW91c2VvdXRcIik7XG5ldmVudHMucHVzaChcInRvdWNobW92ZVwiKTtcbmV2ZW50cy5wdXNoKFwidG91Y2hlbmRcIik7XG5cbmZ1bmN0aW9uIGV2ZW50TmFtZShuYW1lKSB7XG4gIHZhciBpID0gbmFtZS5pbmRleE9mKFwiLlwiKTtcbiAgcmV0dXJuIGkgPCAwID8gbmFtZSA6IG5hbWUuc2xpY2UoMCxpKTtcbn1cblxucHJvdG90eXBlLnRvdWNobW92ZSA9IHByb3RvdHlwZS5tb3VzZW1vdmUgPSBmdW5jdGlvbihldnQpIHtcbiAgdmFyIHBhZCA9IHRoaXMuX3BhZGRpbmcsXG4gICAgICBiID0gZXZ0LnRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHggPSBldnQuY2xpZW50WCAtIGIubGVmdCxcbiAgICAgIHkgPSBldnQuY2xpZW50WSAtIGIudG9wLFxuICAgICAgYSA9IHRoaXMuX2FjdGl2ZSxcbiAgICAgIHAgPSB0aGlzLnBpY2sodGhpcy5fbW9kZWwuc2NlbmUoKSwgeCwgeSwgeC1wYWQubGVmdCwgeS1wYWQudG9wKTtcblxuICBpZiAocCA9PT0gYSkge1xuICAgIHRoaXMuZmlyZShcIm1vdXNlbW92ZVwiLCBldnQpO1xuICAgIGlmKGV2dC50eXBlID09IFwidG91Y2htb3ZlXCIpIHRoaXMuZmlyZShcInRvdWNobW92ZVwiLCBldnQpO1xuICAgIHJldHVybjtcbiAgfSBlbHNlIGlmIChhKSB7XG4gICAgdGhpcy5maXJlKFwibW91c2VvdXRcIiwgZXZ0KTtcbiAgICBpZihldnQudHlwZSA9PSBcInRvdWNoZW5kXCIpIHRoaXMuZmlyZShcInRvdWNoZW5kXCIsIGV2dCk7XG4gIH1cbiAgdGhpcy5fYWN0aXZlID0gcDtcbiAgaWYgKHApIHtcbiAgICB0aGlzLmZpcmUoXCJtb3VzZW92ZXJcIiwgZXZ0KTtcbiAgICBpZihldnQudHlwZSA9PSBcInRvdWNoc3RhcnRcIikgdGhpcy5maXJlKFwidG91Y2hzdGFydFwiLCBldnQpO1xuICB9XG59O1xuXG5wcm90b3R5cGUudG91Y2hlbmQgPSBwcm90b3R5cGUubW91c2VvdXQgPSBmdW5jdGlvbihldnQpIHtcbiAgaWYgKHRoaXMuX2FjdGl2ZSkge1xuICAgIHRoaXMuZmlyZShcIm1vdXNlb3V0XCIsIGV2dCk7XG4gICAgdGhpcy5maXJlKFwidG91Y2hlbmRcIiwgZXZ0KTtcbiAgfVxuICB0aGlzLl9hY3RpdmUgPSBudWxsO1xufTtcblxuLy8gdG8ga2VlcCBmaXJlZm94IGhhcHB5XG5wcm90b3R5cGUuRE9NTW91c2VTY3JvbGwgPSBmdW5jdGlvbihldnQpIHtcbiAgdGhpcy5maXJlKFwibW91c2V3aGVlbFwiLCBldnQpO1xufTtcblxuLy8gZmlyZSBhbiBldmVudFxucHJvdG90eXBlLmZpcmUgPSBmdW5jdGlvbih0eXBlLCBldnQpIHtcbiAgdmFyIGEgPSB0aGlzLl9hY3RpdmUsXG4gICAgICBoID0gdGhpcy5faGFuZGxlcnNbdHlwZV07XG4gIGlmIChoKSB7XG4gICAgZm9yICh2YXIgaT0wLCBsZW49aC5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICAgIGhbaV0uaGFuZGxlci5jYWxsKHRoaXMuX29iaiwgZXZ0LCBhKTtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFkZCBhbiBldmVudCBoYW5kbGVyXG5wcm90b3R5cGUub24gPSBmdW5jdGlvbih0eXBlLCBoYW5kbGVyKSB7XG4gIHZhciBuYW1lID0gZXZlbnROYW1lKHR5cGUpLFxuICAgICAgaCA9IHRoaXMuX2hhbmRsZXJzO1xuICBoID0gaFtuYW1lXSB8fCAoaFtuYW1lXSA9IFtdKTtcbiAgaC5wdXNoKHtcbiAgICB0eXBlOiB0eXBlLFxuICAgIGhhbmRsZXI6IGhhbmRsZXJcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gcmVtb3ZlIGFuIGV2ZW50IGhhbmRsZXJcbnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbih0eXBlLCBoYW5kbGVyKSB7XG4gIHZhciBuYW1lID0gZXZlbnROYW1lKHR5cGUpLFxuICAgICAgaCA9IHRoaXMuX2hhbmRsZXJzW25hbWVdO1xuICBpZiAoIWgpIHJldHVybjtcbiAgZm9yICh2YXIgaT1oLmxlbmd0aDsgLS1pPj0wOykge1xuICAgIGlmIChoW2ldLnR5cGUgIT09IHR5cGUpIGNvbnRpbnVlO1xuICAgIGlmICghaGFuZGxlciB8fCBoW2ldLmhhbmRsZXIgPT09IGhhbmRsZXIpIGguc3BsaWNlKGksIDEpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gcmV0cmlldmUgdGhlIGN1cnJlbnQgY2FudmFzIGNvbnRleHRcbnByb3RvdHlwZS5jb250ZXh0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9jYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xufTtcblxuLy8gZmluZCB0aGUgc2NlbmVncmFwaCBpdGVtIGF0IHRoZSBjdXJyZW50IG1vdXNlIHBvc2l0aW9uXG4vLyB4LCB5IC0tIHRoZSBhYnNvbHV0ZSB4LCB5IG1vdXNlIGNvb3JkaW5hdGVzIG9uIHRoZSBjYW52YXMgZWxlbWVudFxuLy8gZ3gsIGd5IC0tIHRoZSByZWxhdGl2ZSBjb29yZGluYXRlcyB3aXRoaW4gdGhlIGN1cnJlbnQgZ3JvdXBcbnByb3RvdHlwZS5waWNrID0gZnVuY3Rpb24oc2NlbmUsIHgsIHksIGd4LCBneSkge1xuICB2YXIgZyA9IHRoaXMuY29udGV4dCgpLFxuICAgICAgbWFya3R5cGUgPSBzY2VuZS5tYXJrdHlwZSxcbiAgICAgIHBpY2tlciA9IG1hcmtzLnBpY2tbbWFya3R5cGVdO1xuICByZXR1cm4gcGlja2VyLmNhbGwodGhpcywgZywgc2NlbmUsIHgsIHksIGd4LCBneSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGhhbmRsZXI7IiwidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgQm91bmRzID0gcmVxdWlyZSgnLi4vLi4vY29yZS9Cb3VuZHMnKSxcbiAgICBjb25maWcgPSByZXF1aXJlKCcuLi8uLi91dGlsL2NvbmZpZycpLFxuICAgIG1hcmtzID0gcmVxdWlyZSgnLi9tYXJrcycpO1xuXG52YXIgcmVuZGVyZXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fY3R4ID0gbnVsbDtcbiAgdGhpcy5fZWwgPSBudWxsO1xuICB0aGlzLl9pbWdsb2FkID0gMDtcbn07XG5cbnZhciBwcm90b3R5cGUgPSByZW5kZXJlci5wcm90b3R5cGU7XG5cbnByb3RvdHlwZS5pbml0aWFsaXplID0gZnVuY3Rpb24oZWwsIHdpZHRoLCBoZWlnaHQsIHBhZCkge1xuICB0aGlzLl9lbCA9IGVsO1xuICBcbiAgaWYgKCFlbCkgcmV0dXJuIHRoaXM7IC8vIGVhcmx5IGV4aXQgaWYgbm8gRE9NIGVsZW1lbnRcblxuICAvLyBzZWxlY3QgY2FudmFzIGVsZW1lbnRcbiAgdmFyIGNhbnZhcyA9IGQzLnNlbGVjdChlbClcbiAgICAuc2VsZWN0QWxsKFwiY2FudmFzLm1hcmtzXCIpXG4gICAgLmRhdGEoWzFdKTtcbiAgXG4gIC8vIGNyZWF0ZSBuZXcgY2FudmFzIGVsZW1lbnQgaWYgbmVlZGVkXG4gIGNhbnZhcy5lbnRlcigpXG4gICAgLmFwcGVuZChcImNhbnZhc1wiKVxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtYXJrc1wiKTtcbiAgXG4gIC8vIHJlbW92ZSBleHRyYW5lb3VzIGNhbnZhcyBpZiBuZWVkZWRcbiAgY2FudmFzLmV4aXQoKS5yZW1vdmUoKTtcbiAgXG4gIHJldHVybiB0aGlzLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0LCBwYWQpO1xufTtcblxucHJvdG90eXBlLnJlc2l6ZSA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIHBhZCkge1xuICB0aGlzLl93aWR0aCA9IHdpZHRoO1xuICB0aGlzLl9oZWlnaHQgPSBoZWlnaHQ7XG4gIHRoaXMuX3BhZGRpbmcgPSBwYWQ7XG4gIFxuICBpZiAodGhpcy5fZWwpIHtcbiAgICB2YXIgY2FudmFzID0gZDMuc2VsZWN0KHRoaXMuX2VsKS5zZWxlY3QoXCJjYW52YXMubWFya3NcIik7XG5cbiAgICAvLyBpbml0aWFsaXplIGNhbnZhcyBhdHRyaWJ1dGVzXG4gICAgY2FudmFzXG4gICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgcGFkLmxlZnQgKyBwYWQucmlnaHQpXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBwYWQudG9wICsgcGFkLmJvdHRvbSk7XG5cbiAgICAvLyBnZXQgdGhlIGNhbnZhcyBncmFwaGljcyBjb250ZXh0XG4gICAgdmFyIHM7XG4gICAgdGhpcy5fY3R4ID0gY2FudmFzLm5vZGUoKS5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgdGhpcy5fY3R4Ll9yYXRpbyA9IChzID0gc2NhbGVDYW52YXMoY2FudmFzLm5vZGUoKSwgdGhpcy5fY3R4KSB8fCAxKTtcbiAgICB0aGlzLl9jdHguc2V0VHJhbnNmb3JtKHMsIDAsIDAsIHMsIHMqcGFkLmxlZnQsIHMqcGFkLnRvcCk7XG4gIH1cbiAgXG4gIGluaXRpYWxpemVMaW5lRGFzaCh0aGlzLl9jdHgpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbmZ1bmN0aW9uIHNjYWxlQ2FudmFzKGNhbnZhcywgY3R4KSB7XG4gIC8vIGdldCBjYW52YXMgcGl4ZWwgZGF0YVxuICB2YXIgZGV2aWNlUGl4ZWxSYXRpbyA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDEsXG4gICAgICBiYWNraW5nU3RvcmVSYXRpbyA9IChcbiAgICAgICAgY3R4LndlYmtpdEJhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHxcbiAgICAgICAgY3R4Lm1vekJhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHxcbiAgICAgICAgY3R4Lm1zQmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fFxuICAgICAgICBjdHgub0JhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHxcbiAgICAgICAgY3R4LmJhY2tpbmdTdG9yZVBpeGVsUmF0aW8pIHx8IDEsXG4gICAgICByYXRpbyA9IGRldmljZVBpeGVsUmF0aW8gLyBiYWNraW5nU3RvcmVSYXRpbztcblxuICBpZiAoZGV2aWNlUGl4ZWxSYXRpbyAhPT0gYmFja2luZ1N0b3JlUmF0aW8pIHtcbiAgICB2YXIgdyA9IGNhbnZhcy53aWR0aCwgaCA9IGNhbnZhcy5oZWlnaHQ7XG4gICAgLy8gc2V0IGFjdHVhbCBhbmQgdmlzaWJsZSBjYW52YXMgc2l6ZVxuICAgIGNhbnZhcy5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCB3ICogcmF0aW8pO1xuICAgIGNhbnZhcy5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgaCAqIHJhdGlvKTtcbiAgICBjYW52YXMuc3R5bGUud2lkdGggPSB3ICsgJ3B4JztcbiAgICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gaCArICdweCc7XG4gIH1cbiAgcmV0dXJuIHJhdGlvO1xufVxuXG5mdW5jdGlvbiBpbml0aWFsaXplTGluZURhc2goY3R4KSB7XG4gIGlmIChjdHgudmdMaW5lRGFzaCkgcmV0dXJuOyAvLyBhbHJlYWR5IHNldFxuXG4gIHZhciBOT0RBU0ggPSBbXTtcbiAgaWYgKGN0eC5zZXRMaW5lRGFzaCkge1xuICAgIGN0eC52Z0xpbmVEYXNoID0gZnVuY3Rpb24oZGFzaCkgeyB0aGlzLnNldExpbmVEYXNoKGRhc2ggfHwgTk9EQVNIKTsgfTtcbiAgICBjdHgudmdMaW5lRGFzaE9mZnNldCA9IGZ1bmN0aW9uKG9mZikgeyB0aGlzLmxpbmVEYXNoT2Zmc2V0ID0gb2ZmOyB9O1xuICB9IGVsc2UgaWYgKGN0eC53ZWJraXRMaW5lRGFzaCAhPT0gdW5kZWZpbmVkKSB7XG4gIFx0Y3R4LnZnTGluZURhc2ggPSBmdW5jdGlvbihkYXNoKSB7IHRoaXMud2Via2l0TGluZURhc2ggPSBkYXNoIHx8IE5PREFTSDsgfTtcbiAgICBjdHgudmdMaW5lRGFzaE9mZnNldCA9IGZ1bmN0aW9uKG9mZikgeyB0aGlzLndlYmtpdExpbmVEYXNoT2Zmc2V0ID0gb2ZmOyB9O1xuICB9IGVsc2UgaWYgKGN0eC5tb3pEYXNoICE9PSB1bmRlZmluZWQpIHtcbiAgICBjdHgudmdMaW5lRGFzaCA9IGZ1bmN0aW9uKGRhc2gpIHsgdGhpcy5tb3pEYXNoID0gZGFzaDsgfTtcbiAgICBjdHgudmdMaW5lRGFzaE9mZnNldCA9IGZ1bmN0aW9uKG9mZikgeyAvKiB1bnN1cHBvcnRlZCAqLyB9O1xuICB9IGVsc2Uge1xuICAgIGN0eC52Z0xpbmVEYXNoID0gZnVuY3Rpb24oZGFzaCkgeyAvKiB1bnN1cHBvcnRlZCAqLyB9O1xuICAgIGN0eC52Z0xpbmVEYXNoT2Zmc2V0ID0gZnVuY3Rpb24ob2ZmKSB7IC8qIHVuc3VwcG9ydGVkICovIH07XG4gIH1cbn1cblxucHJvdG90eXBlLmNvbnRleHQgPSBmdW5jdGlvbihjdHgpIHtcbiAgaWYgKGN0eCkgeyB0aGlzLl9jdHggPSBjdHg7IHJldHVybiB0aGlzOyB9XG4gIGVsc2UgcmV0dXJuIHRoaXMuX2N0eDtcbn07XG5cbnByb3RvdHlwZS5lbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9lbDtcbn07XG5cbnByb3RvdHlwZS5wZW5kaW5nSW1hZ2VzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9pbWdsb2FkO1xufTtcblxuZnVuY3Rpb24gdHJhbnNsYXRlZEJvdW5kcyhpdGVtLCBib3VuZHMpIHtcbiAgdmFyIGIgPSBuZXcgQm91bmRzKGJvdW5kcyk7XG4gIHdoaWxlICgoaXRlbSA9IGl0ZW0ubWFyay5ncm91cCkgIT0gbnVsbCkge1xuICAgIGIudHJhbnNsYXRlKGl0ZW0ueCB8fCAwLCBpdGVtLnkgfHwgMCk7XG4gIH1cbiAgcmV0dXJuIGI7XG59XG4gIFxuZnVuY3Rpb24gZ2V0Qm91bmRzKGl0ZW1zKSB7XG4gIHJldHVybiAhaXRlbXMgPyBudWxsIDpcbiAgICBkbC5hcnJheShpdGVtcykucmVkdWNlKGZ1bmN0aW9uKGIsIGl0ZW0pIHtcbiAgICAgIHJldHVybiBiLnVuaW9uKHRyYW5zbGF0ZWRCb3VuZHMoaXRlbSwgaXRlbS5ib3VuZHMpKVxuICAgICAgICAgICAgICAudW5pb24odHJhbnNsYXRlZEJvdW5kcyhpdGVtLCBpdGVtWydib3VuZHM6cHJldiddKSk7XG4gICAgfSwgbmV3IEJvdW5kcygpKTsgIFxufVxuXG5mdW5jdGlvbiBzZXRCb3VuZHMoZywgYm91bmRzKSB7XG4gIHZhciBiYm94ID0gbnVsbDtcbiAgaWYgKGJvdW5kcykge1xuICAgIGJib3ggPSAobmV3IEJvdW5kcyhib3VuZHMpKS5yb3VuZCgpO1xuICAgIGcuYmVnaW5QYXRoKCk7XG4gICAgZy5yZWN0KGJib3gueDEsIGJib3gueTEsIGJib3gud2lkdGgoKSwgYmJveC5oZWlnaHQoKSk7XG4gICAgZy5jbGlwKCk7XG4gIH1cbiAgcmV0dXJuIGJib3g7XG59XG5cbnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihzY2VuZSwgaXRlbXMpIHtcbiAgdmFyIGcgPSB0aGlzLl9jdHgsXG4gICAgICBwYWQgPSB0aGlzLl9wYWRkaW5nLFxuICAgICAgdyA9IHRoaXMuX3dpZHRoICsgcGFkLmxlZnQgKyBwYWQucmlnaHQsXG4gICAgICBoID0gdGhpcy5faGVpZ2h0ICsgcGFkLnRvcCArIHBhZC5ib3R0b20sXG4gICAgICBiYiA9IG51bGwsIGJiMjtcblxuICAvLyBzZXR1cFxuICB0aGlzLl9zY2VuZSA9IHNjZW5lO1xuICBnLnNhdmUoKTtcbiAgYmIgPSBzZXRCb3VuZHMoZywgZ2V0Qm91bmRzKGl0ZW1zKSk7XG4gIGcuY2xlYXJSZWN0KC1wYWQubGVmdCwgLXBhZC50b3AsIHcsIGgpO1xuXG4gIC8vIHJlbmRlclxuICB0aGlzLmRyYXcoZywgc2NlbmUsIGJiKTtcblxuICAvLyByZW5kZXIgYWdhaW4gdG8gaGFuZGxlIHBvc3NpYmxlIGJvdW5kcyBjaGFuZ2VcbiAgaWYgKGl0ZW1zKSB7XG4gICAgZy5yZXN0b3JlKCk7XG4gICAgZy5zYXZlKCk7XG4gICAgYmIyID0gc2V0Qm91bmRzKGcsIGdldEJvdW5kcyhpdGVtcykpO1xuICAgIGlmICghYmIuZW5jbG9zZXMoYmIyKSkge1xuICAgICAgZy5jbGVhclJlY3QoLXBhZC5sZWZ0LCAtcGFkLnRvcCwgdywgaCk7XG4gICAgICB0aGlzLmRyYXcoZywgc2NlbmUsIGJiMik7XG4gICAgfVxuICB9XG4gIFxuICAvLyB0YWtlZG93blxuICBnLnJlc3RvcmUoKTtcbiAgdGhpcy5fc2NlbmUgPSBudWxsO1xufTtcblxucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjdHgsIHNjZW5lLCBib3VuZHMpIHtcbiAgdmFyIG1hcmt0eXBlID0gc2NlbmUubWFya3R5cGUsXG4gICAgICByZW5kZXJlciA9IG1hcmtzLmRyYXdbbWFya3R5cGVdO1xuICByZW5kZXJlci5jYWxsKHRoaXMsIGN0eCwgc2NlbmUsIGJvdW5kcyk7XG59O1xuXG5wcm90b3R5cGUucmVuZGVyQXN5bmMgPSBmdW5jdGlvbihzY2VuZSkge1xuICAvLyBUT0RPIG1ha2Ugc2FmZSBmb3IgbXVsdGlwbGUgc2NlbmUgcmVuZGVyaW5nP1xuICB2YXIgcmVuZGVyZXIgPSB0aGlzO1xuICBpZiAocmVuZGVyZXIuX2FzeW5jX2lkKSB7XG4gICAgY2xlYXJUaW1lb3V0KHJlbmRlcmVyLl9hc3luY19pZCk7XG4gIH1cbiAgcmVuZGVyZXIuX2FzeW5jX2lkID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUpO1xuICAgIGRlbGV0ZSByZW5kZXJlci5fYXN5bmNfaWQ7XG4gIH0sIDUwKTtcbn07XG5cbnByb3RvdHlwZS5sb2FkSW1hZ2UgPSBmdW5jdGlvbih1cmkpIHtcbiAgdmFyIHJlbmRlcmVyID0gdGhpcyxcbiAgICAgIHNjZW5lID0gcmVuZGVyZXIuX3NjZW5lLFxuICAgICAgaW1hZ2UgPSBudWxsLCB1cmw7XG5cbiAgcmVuZGVyZXIuX2ltZ2xvYWQgKz0gMTtcbiAgaWYgKGRsLmlzTm9kZSkge1xuICAgIGltYWdlID0gbmV3ICgodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5jYW52YXMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmNhbnZhcyA6IG51bGwpLkltYWdlKSgpO1xuICAgIGRsLmxvYWQoZGwuZXh0ZW5kKHt1cmw6IHVyaX0sIGNvbmZpZy5sb2FkKSwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICBpZiAoZXJyKSB7IGRsLmVycm9yKGVycik7IHJldHVybjsgfVxuICAgICAgaW1hZ2Uuc3JjID0gZGF0YTtcbiAgICAgIGltYWdlLmxvYWRlZCA9IHRydWU7XG4gICAgICByZW5kZXJlci5faW1nbG9hZCAtPSAxO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgdXJsID0gY29uZmlnLmJhc2VVUkwgKyB1cmk7XG4gICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBpbWFnZS5sb2FkZWQgPSB0cnVlO1xuICAgICAgcmVuZGVyZXIuX2ltZ2xvYWQgLT0gMTtcbiAgICAgIHJlbmRlcmVyLnJlbmRlckFzeW5jKHNjZW5lKTtcbiAgICB9O1xuICAgIGltYWdlLnNyYyA9IHVybDtcbiAgfVxuXG4gIHJldHVybiBpbWFnZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVuZGVyZXI7IiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIEhhbmRsZXI6ICByZXF1aXJlKCcuL0hhbmRsZXInKSxcbiAgUmVuZGVyZXI6IHJlcXVpcmUoJy4vUmVuZGVyZXInKVxufTsiLCJ2YXIgQm91bmRzID0gcmVxdWlyZSgnLi4vLi4vY29yZS9Cb3VuZHMnKSxcbiAgICBib3VuZHNDYWxjID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9ib3VuZHMnKSxcbiAgICBjb25maWcgPSByZXF1aXJlKCcuLi8uLi91dGlsL2NvbmZpZycpLFxuICAgIHBhdGggPSByZXF1aXJlKCcuL3BhdGgnKTtcblxudmFyIHBhcnNlUGF0aCA9IHBhdGgucGFyc2UsXG4gICAgcmVuZGVyUGF0aCA9IHBhdGgucmVuZGVyLFxuICAgIGhhbGZwaSA9IE1hdGguUEkgLyAyLFxuICAgIHNxcnQzID0gTWF0aC5zcXJ0KDMpLFxuICAgIHRhbjMwID0gTWF0aC50YW4oMzAgKiBNYXRoLlBJIC8gMTgwKSxcbiAgICB0bXBCb3VuZHMgPSBuZXcgQm91bmRzKCk7XG5cbmZ1bmN0aW9uIGZvbnRTdHJpbmcobykge1xuICByZXR1cm4gKG8uZm9udFN0eWxlID8gby5mb250U3R5bGUgKyBcIiBcIiA6IFwiXCIpXG4gICAgKyAoby5mb250VmFyaWFudCA/IG8uZm9udFZhcmlhbnQgKyBcIiBcIiA6IFwiXCIpXG4gICAgKyAoby5mb250V2VpZ2h0ID8gby5mb250V2VpZ2h0ICsgXCIgXCIgOiBcIlwiKVxuICAgICsgKG8uZm9udFNpemUgIT0gbnVsbCA/IG8uZm9udFNpemUgOiBjb25maWcucmVuZGVyLmZvbnRTaXplKSArIFwicHggXCJcbiAgICArIChvLmZvbnQgfHwgY29uZmlnLnJlbmRlci5mb250KTtcbn1cblxuLy8gcGF0aCBnZW5lcmF0b3JzXG5cbmZ1bmN0aW9uIGFyY1BhdGgoZywgbykge1xuICB2YXIgeCA9IG8ueCB8fCAwLFxuICAgICAgeSA9IG8ueSB8fCAwLFxuICAgICAgaXIgPSBvLmlubmVyUmFkaXVzIHx8IDAsXG4gICAgICBvciA9IG8ub3V0ZXJSYWRpdXMgfHwgMCxcbiAgICAgIHNhID0gKG8uc3RhcnRBbmdsZSB8fCAwKSAtIE1hdGguUEkvMixcbiAgICAgIGVhID0gKG8uZW5kQW5nbGUgfHwgMCkgLSBNYXRoLlBJLzI7XG4gIGcuYmVnaW5QYXRoKCk7XG4gIGlmIChpciA9PT0gMCkgZy5tb3ZlVG8oeCwgeSk7XG4gIGVsc2UgZy5hcmMoeCwgeSwgaXIsIHNhLCBlYSwgMCk7XG4gIGcuYXJjKHgsIHksIG9yLCBlYSwgc2EsIDEpO1xuICBnLmNsb3NlUGF0aCgpO1xufVxuXG5mdW5jdGlvbiBhcmVhUGF0aChnLCBpdGVtcykge1xuICB2YXIgbyA9IGl0ZW1zWzBdLFxuICAgICAgbSA9IG8ubWFyayxcbiAgICAgIHAgPSBtLnBhdGhDYWNoZSB8fCAobS5wYXRoQ2FjaGUgPSBwYXJzZVBhdGgocGF0aC5hcmVhKGl0ZW1zKSkpO1xuICByZW5kZXJQYXRoKGcsIHApO1xufVxuXG5mdW5jdGlvbiBsaW5lUGF0aChnLCBpdGVtcykge1xuICB2YXIgbyA9IGl0ZW1zWzBdLFxuICAgICAgbSA9IG8ubWFyayxcbiAgICAgIHAgPSBtLnBhdGhDYWNoZSB8fCAobS5wYXRoQ2FjaGUgPSBwYXJzZVBhdGgocGF0aC5saW5lKGl0ZW1zKSkpO1xuICByZW5kZXJQYXRoKGcsIHApO1xufVxuXG5mdW5jdGlvbiBwYXRoUGF0aChnLCBvKSB7XG4gIGlmIChvLnBhdGggPT0gbnVsbCkgcmV0dXJuO1xuICB2YXIgcCA9IG8ucGF0aENhY2hlIHx8IChvLnBhdGhDYWNoZSA9IHBhcnNlUGF0aChvLnBhdGgpKTtcbiAgcmV0dXJuIHJlbmRlclBhdGgoZywgcCwgby54LCBvLnkpO1xufVxuXG5mdW5jdGlvbiBzeW1ib2xQYXRoKGcsIG8pIHtcbiAgZy5iZWdpblBhdGgoKTtcbiAgdmFyIHNpemUgPSBvLnNpemUgIT0gbnVsbCA/IG8uc2l6ZSA6IDEwMCxcbiAgICAgIHggPSBvLngsIHkgPSBvLnksIHIsIHQsIHJ4LCByeTtcblxuICBpZiAoby5zaGFwZSA9PSBudWxsIHx8IG8uc2hhcGUgPT09IFwiY2lyY2xlXCIpIHtcbiAgICByID0gTWF0aC5zcXJ0KHNpemUvTWF0aC5QSSk7XG4gICAgZy5hcmMoeCwgeSwgciwgMCwgMipNYXRoLlBJLCAwKTtcbiAgICBnLmNsb3NlUGF0aCgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHN3aXRjaCAoby5zaGFwZSkge1xuICAgIGNhc2UgXCJjcm9zc1wiOlxuICAgICAgciA9IE1hdGguc3FydChzaXplIC8gNSkgLyAyO1xuICAgICAgdCA9IDMqcjtcbiAgICAgIGcubW92ZVRvKHgtdCwgeS1yKTtcbiAgICAgIGcubGluZVRvKHgtciwgeS1yKTtcbiAgICAgIGcubGluZVRvKHgtciwgeS10KTtcbiAgICAgIGcubGluZVRvKHgrciwgeS10KTtcbiAgICAgIGcubGluZVRvKHgrciwgeS1yKTtcbiAgICAgIGcubGluZVRvKHgrdCwgeS1yKTtcbiAgICAgIGcubGluZVRvKHgrdCwgeStyKTtcbiAgICAgIGcubGluZVRvKHgrciwgeStyKTtcbiAgICAgIGcubGluZVRvKHgrciwgeSt0KTtcbiAgICAgIGcubGluZVRvKHgtciwgeSt0KTtcbiAgICAgIGcubGluZVRvKHgtciwgeStyKTtcbiAgICAgIGcubGluZVRvKHgtdCwgeStyKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBcImRpYW1vbmRcIjpcbiAgICAgIHJ5ID0gTWF0aC5zcXJ0KHNpemUgLyAoMiAqIHRhbjMwKSk7XG4gICAgICByeCA9IHJ5ICogdGFuMzA7XG4gICAgICBnLm1vdmVUbyh4LCB5LXJ5KTtcbiAgICAgIGcubGluZVRvKHgrcngsIHkpO1xuICAgICAgZy5saW5lVG8oeCwgeStyeSk7XG4gICAgICBnLmxpbmVUbyh4LXJ4LCB5KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBcInNxdWFyZVwiOlxuICAgICAgdCA9IE1hdGguc3FydChzaXplKTtcbiAgICAgIHIgPSB0IC8gMjtcbiAgICAgIGcucmVjdCh4LXIsIHktciwgdCwgdCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgXCJ0cmlhbmdsZS1kb3duXCI6XG4gICAgICByeCA9IE1hdGguc3FydChzaXplIC8gc3FydDMpO1xuICAgICAgcnkgPSByeCAqIHNxcnQzIC8gMjtcbiAgICAgIGcubW92ZVRvKHgsIHkrcnkpO1xuICAgICAgZy5saW5lVG8oeCtyeCwgeS1yeSk7XG4gICAgICBnLmxpbmVUbyh4LXJ4LCB5LXJ5KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBcInRyaWFuZ2xlLXVwXCI6XG4gICAgICByeCA9IE1hdGguc3FydChzaXplIC8gc3FydDMpO1xuICAgICAgcnkgPSByeCAqIHNxcnQzIC8gMjtcbiAgICAgIGcubW92ZVRvKHgsIHktcnkpO1xuICAgICAgZy5saW5lVG8oeCtyeCwgeStyeSk7XG4gICAgICBnLmxpbmVUbyh4LXJ4LCB5K3J5KTtcbiAgfVxuICBnLmNsb3NlUGF0aCgpO1xufVxuXG5mdW5jdGlvbiBsaW5lU3Ryb2tlKGcsIGl0ZW1zKSB7XG4gIHZhciBvID0gaXRlbXNbMF0sXG4gICAgICBsdyA9IG8uc3Ryb2tlV2lkdGgsXG4gICAgICBsYyA9IG8uc3Ryb2tlQ2FwO1xuICBnLmxpbmVXaWR0aCA9IGx3ICE9IG51bGwgPyBsdyA6IGNvbmZpZy5yZW5kZXIubGluZVdpZHRoO1xuICBnLmxpbmVDYXAgICA9IGxjICE9IG51bGwgPyBsYyA6IGNvbmZpZy5yZW5kZXIubGluZUNhcDtcbiAgbGluZVBhdGgoZywgaXRlbXMpO1xufVxuXG5mdW5jdGlvbiBydWxlU3Ryb2tlKGcsIG8pIHtcbiAgdmFyIHgxID0gby54IHx8IDAsXG4gICAgICB5MSA9IG8ueSB8fCAwLFxuICAgICAgeDIgPSBvLngyICE9IG51bGwgPyBvLngyIDogeDEsXG4gICAgICB5MiA9IG8ueTIgIT0gbnVsbCA/IG8ueTIgOiB5MSxcbiAgICAgIGx3ID0gby5zdHJva2VXaWR0aCxcbiAgICAgIGxjID0gby5zdHJva2VDYXA7XG5cbiAgZy5saW5lV2lkdGggPSBsdyAhPSBudWxsID8gbHcgOiBjb25maWcucmVuZGVyLmxpbmVXaWR0aDtcbiAgZy5saW5lQ2FwICAgPSBsYyAhPSBudWxsID8gbGMgOiBjb25maWcucmVuZGVyLmxpbmVDYXA7XG4gIGcuYmVnaW5QYXRoKCk7XG4gIGcubW92ZVRvKHgxLCB5MSk7XG4gIGcubGluZVRvKHgyLCB5Mik7XG59XG5cbi8vIGRyYXdpbmcgZnVuY3Rpb25zXG5cbmZ1bmN0aW9uIGRyYXdQYXRoT25lKHBhdGgsIGcsIG8sIGl0ZW1zKSB7XG4gIHZhciBmaWxsID0gby5maWxsLCBzdHJva2UgPSBvLnN0cm9rZSwgb3BhYywgbGMsIGx3O1xuXG4gIHBhdGgoZywgaXRlbXMpO1xuXG4gIG9wYWMgPSBvLm9wYWNpdHkgPT0gbnVsbCA/IDEgOiBvLm9wYWNpdHk7XG4gIGlmIChvcGFjID09IDAgfHwgIWZpbGwgJiYgIXN0cm9rZSkgcmV0dXJuO1xuXG4gIGlmIChmaWxsKSB7XG4gICAgZy5nbG9iYWxBbHBoYSA9IG9wYWMgKiAoby5maWxsT3BhY2l0eT09bnVsbCA/IDEgOiBvLmZpbGxPcGFjaXR5KTtcbiAgICBnLmZpbGxTdHlsZSA9IGNvbG9yKGcsIG8sIGZpbGwpO1xuICAgIGcuZmlsbCgpO1xuICB9XG5cbiAgaWYgKHN0cm9rZSkge1xuICAgIGx3ID0gKGx3ID0gby5zdHJva2VXaWR0aCkgIT0gbnVsbCA/IGx3IDogY29uZmlnLnJlbmRlci5saW5lV2lkdGg7XG4gICAgaWYgKGx3ID4gMCkge1xuICAgICAgZy5nbG9iYWxBbHBoYSA9IG9wYWMgKiAoby5zdHJva2VPcGFjaXR5PT1udWxsID8gMSA6IG8uc3Ryb2tlT3BhY2l0eSk7XG4gICAgICBnLnN0cm9rZVN0eWxlID0gY29sb3IoZywgbywgc3Ryb2tlKTtcbiAgICAgIGcubGluZVdpZHRoID0gbHc7XG4gICAgICBnLmxpbmVDYXAgPSAobGMgPSBvLnN0cm9rZUNhcCkgIT0gbnVsbCA/IGxjIDogY29uZmlnLnJlbmRlci5saW5lQ2FwO1xuICAgICAgZy52Z0xpbmVEYXNoKG8uc3Ryb2tlRGFzaCB8fCBudWxsKTtcbiAgICAgIGcudmdMaW5lRGFzaE9mZnNldChvLnN0cm9rZURhc2hPZmZzZXQgfHwgMCk7XG4gICAgICBnLnN0cm9rZSgpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkcmF3UGF0aEFsbChwYXRoLCBnLCBzY2VuZSwgYm91bmRzKSB7XG4gIHZhciBpLCBsZW4sIGl0ZW07XG4gIGZvciAoaT0wLCBsZW49c2NlbmUuaXRlbXMubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgaXRlbSA9IHNjZW5lLml0ZW1zW2ldO1xuICAgIGlmIChib3VuZHMgJiYgIWJvdW5kcy5pbnRlcnNlY3RzKGl0ZW0uYm91bmRzKSlcbiAgICAgIGNvbnRpbnVlOyAvLyBib3VuZHMgY2hlY2tcbiAgICBkcmF3UGF0aE9uZShwYXRoLCBnLCBpdGVtLCBpdGVtKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkcmF3UmVjdChnLCBzY2VuZSwgYm91bmRzKSB7XG4gIGlmICghc2NlbmUuaXRlbXMubGVuZ3RoKSByZXR1cm47XG4gIHZhciBpdGVtcyA9IHNjZW5lLml0ZW1zLFxuICAgICAgbywgZmlsbCwgc3Ryb2tlLCBvcGFjLCBsYywgbHcsIHgsIHksIHcsIGg7XG5cbiAgZm9yICh2YXIgaT0wLCBsZW49aXRlbXMubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgbyA9IGl0ZW1zW2ldO1xuICAgIGlmIChib3VuZHMgJiYgIWJvdW5kcy5pbnRlcnNlY3RzKG8uYm91bmRzKSlcbiAgICAgIGNvbnRpbnVlOyAvLyBib3VuZHMgY2hlY2tcblxuICAgIHggPSBvLnggfHwgMDtcbiAgICB5ID0gby55IHx8IDA7XG4gICAgdyA9IG8ud2lkdGggfHwgMDtcbiAgICBoID0gby5oZWlnaHQgfHwgMDtcblxuICAgIG9wYWMgPSBvLm9wYWNpdHkgPT0gbnVsbCA/IDEgOiBvLm9wYWNpdHk7XG4gICAgaWYgKG9wYWMgPT0gMCkgY29udGludWU7XG5cbiAgICBpZiAoZmlsbCA9IG8uZmlsbCkge1xuICAgICAgZy5nbG9iYWxBbHBoYSA9IG9wYWMgKiAoby5maWxsT3BhY2l0eT09bnVsbCA/IDEgOiBvLmZpbGxPcGFjaXR5KTtcbiAgICAgIGcuZmlsbFN0eWxlID0gY29sb3IoZywgbywgZmlsbCk7XG4gICAgICBnLmZpbGxSZWN0KHgsIHksIHcsIGgpO1xuICAgIH1cblxuICAgIGlmIChzdHJva2UgPSBvLnN0cm9rZSkge1xuICAgICAgbHcgPSAobHcgPSBvLnN0cm9rZVdpZHRoKSAhPSBudWxsID8gbHcgOiBjb25maWcucmVuZGVyLmxpbmVXaWR0aDtcbiAgICAgIGlmIChsdyA+IDApIHtcbiAgICAgICAgZy5nbG9iYWxBbHBoYSA9IG9wYWMgKiAoby5zdHJva2VPcGFjaXR5PT1udWxsID8gMSA6IG8uc3Ryb2tlT3BhY2l0eSk7XG4gICAgICAgIGcuc3Ryb2tlU3R5bGUgPSBjb2xvcihnLCBvLCBzdHJva2UpO1xuICAgICAgICBnLmxpbmVXaWR0aCA9IGx3O1xuICAgICAgICBnLmxpbmVDYXAgPSAobGMgPSBvLnN0cm9rZUNhcCkgIT0gbnVsbCA/IGxjIDogY29uZmlnLnJlbmRlci5saW5lQ2FwO1xuICAgICAgICBnLnZnTGluZURhc2goby5zdHJva2VEYXNoIHx8IG51bGwpO1xuICAgICAgICBnLnZnTGluZURhc2hPZmZzZXQoby5zdHJva2VEYXNoT2Zmc2V0IHx8IDApO1xuICAgICAgICBnLnN0cm9rZVJlY3QoeCwgeSwgdywgaCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRyYXdSdWxlKGcsIHNjZW5lLCBib3VuZHMpIHtcbiAgaWYgKCFzY2VuZS5pdGVtcy5sZW5ndGgpIHJldHVybjtcbiAgdmFyIGl0ZW1zID0gc2NlbmUuaXRlbXMsXG4gICAgICBvLCBzdHJva2UsIG9wYWMsIGxjLCBsdywgeDEsIHkxLCB4MiwgeTI7XG5cbiAgZm9yICh2YXIgaT0wLCBsZW49aXRlbXMubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgbyA9IGl0ZW1zW2ldO1xuICAgIGlmIChib3VuZHMgJiYgIWJvdW5kcy5pbnRlcnNlY3RzKG8uYm91bmRzKSlcbiAgICAgIGNvbnRpbnVlOyAvLyBib3VuZHMgY2hlY2tcblxuICAgIHgxID0gby54IHx8IDA7XG4gICAgeTEgPSBvLnkgfHwgMDtcbiAgICB4MiA9IG8ueDIgIT0gbnVsbCA/IG8ueDIgOiB4MTtcbiAgICB5MiA9IG8ueTIgIT0gbnVsbCA/IG8ueTIgOiB5MTtcblxuICAgIG9wYWMgPSBvLm9wYWNpdHkgPT0gbnVsbCA/IDEgOiBvLm9wYWNpdHk7XG4gICAgaWYgKG9wYWMgPT0gMCkgY29udGludWU7XG4gICAgXG4gICAgaWYgKHN0cm9rZSA9IG8uc3Ryb2tlKSB7XG4gICAgICBsdyA9IChsdyA9IG8uc3Ryb2tlV2lkdGgpICE9IG51bGwgPyBsdyA6IGNvbmZpZy5yZW5kZXIubGluZVdpZHRoO1xuICAgICAgaWYgKGx3ID4gMCkge1xuICAgICAgICBnLmdsb2JhbEFscGhhID0gb3BhYyAqIChvLnN0cm9rZU9wYWNpdHk9PW51bGwgPyAxIDogby5zdHJva2VPcGFjaXR5KTtcbiAgICAgICAgZy5zdHJva2VTdHlsZSA9IGNvbG9yKGcsIG8sIHN0cm9rZSk7XG4gICAgICAgIGcubGluZVdpZHRoID0gbHc7XG4gICAgICAgIGcubGluZUNhcCA9IChsYyA9IG8uc3Ryb2tlQ2FwKSAhPSBudWxsID8gbGMgOiBjb25maWcucmVuZGVyLmxpbmVDYXA7XG4gICAgICAgIGcudmdMaW5lRGFzaChvLnN0cm9rZURhc2ggfHwgbnVsbCk7XG4gICAgICAgIGcudmdMaW5lRGFzaE9mZnNldChvLnN0cm9rZURhc2hPZmZzZXQgfHwgMCk7XG4gICAgICAgIGcuYmVnaW5QYXRoKCk7XG4gICAgICAgIGcubW92ZVRvKHgxLCB5MSk7XG4gICAgICAgIGcubGluZVRvKHgyLCB5Mik7XG4gICAgICAgIGcuc3Ryb2tlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRyYXdJbWFnZShnLCBzY2VuZSwgYm91bmRzKSB7XG4gIGlmICghc2NlbmUuaXRlbXMubGVuZ3RoKSByZXR1cm47XG4gIHZhciByZW5kZXJlciA9IHRoaXMsXG4gICAgICBpdGVtcyA9IHNjZW5lLml0ZW1zLCBvO1xuXG4gIGZvciAodmFyIGk9MCwgbGVuPWl0ZW1zLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIG8gPSBpdGVtc1tpXTtcbiAgICBpZiAoYm91bmRzICYmICFib3VuZHMuaW50ZXJzZWN0cyhvLmJvdW5kcykpXG4gICAgICBjb250aW51ZTsgLy8gYm91bmRzIGNoZWNrXG5cbiAgICBpZiAoIShvLmltYWdlICYmIG8uaW1hZ2UudXJsID09PSBvLnVybCkpIHtcbiAgICAgIG8uaW1hZ2UgPSByZW5kZXJlci5sb2FkSW1hZ2Uoby51cmwpO1xuICAgICAgby5pbWFnZS51cmwgPSBvLnVybDtcbiAgICB9XG5cbiAgICB2YXIgeCwgeSwgdywgaCwgb3BhYztcbiAgICB3ID0gby53aWR0aCB8fCAoby5pbWFnZSAmJiBvLmltYWdlLndpZHRoKSB8fCAwO1xuICAgIGggPSBvLmhlaWdodCB8fCAoby5pbWFnZSAmJiBvLmltYWdlLmhlaWdodCkgfHwgMDtcbiAgICB4ID0gKG8ueHx8MCkgLSAoby5hbGlnbiA9PT0gXCJjZW50ZXJcIlxuICAgICAgPyB3LzIgOiAoby5hbGlnbiA9PT0gXCJyaWdodFwiID8gdyA6IDApKTtcbiAgICB5ID0gKG8ueXx8MCkgLSAoby5iYXNlbGluZSA9PT0gXCJtaWRkbGVcIlxuICAgICAgPyBoLzIgOiAoby5iYXNlbGluZSA9PT0gXCJib3R0b21cIiA/IGggOiAwKSk7XG5cbiAgICBpZiAoby5pbWFnZS5sb2FkZWQpIHtcbiAgICAgIGcuZ2xvYmFsQWxwaGEgPSAob3BhYyA9IG8ub3BhY2l0eSkgIT0gbnVsbCA/IG9wYWMgOiAxO1xuICAgICAgZy5kcmF3SW1hZ2Uoby5pbWFnZSwgeCwgeSwgdywgaCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRyYXdUZXh0KGcsIHNjZW5lLCBib3VuZHMpIHtcbiAgaWYgKCFzY2VuZS5pdGVtcy5sZW5ndGgpIHJldHVybjtcbiAgdmFyIGl0ZW1zID0gc2NlbmUuaXRlbXMsXG4gICAgICBvLCBmaWxsLCBzdHJva2UsIG9wYWMsIGx3LCB4LCB5LCByLCB0O1xuXG4gIGZvciAodmFyIGk9MCwgbGVuPWl0ZW1zLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIG8gPSBpdGVtc1tpXTtcbiAgICBpZiAoYm91bmRzICYmICFib3VuZHMuaW50ZXJzZWN0cyhvLmJvdW5kcykpXG4gICAgICBjb250aW51ZTsgLy8gYm91bmRzIGNoZWNrXG5cbiAgICBnLmZvbnQgPSBmb250U3RyaW5nKG8pO1xuICAgIGcudGV4dEFsaWduID0gby5hbGlnbiB8fCBcImxlZnRcIjtcbiAgICBnLnRleHRCYXNlbGluZSA9IG8uYmFzZWxpbmUgfHwgXCJhbHBoYWJldGljXCI7XG5cbiAgICBvcGFjID0gby5vcGFjaXR5ID09IG51bGwgPyAxIDogby5vcGFjaXR5O1xuICAgIGlmIChvcGFjID09IDApIGNvbnRpbnVlO1xuXG4gICAgeCA9IG8ueCB8fCAwO1xuICAgIHkgPSBvLnkgfHwgMDtcbiAgICBpZiAociA9IG8ucmFkaXVzKSB7XG4gICAgICB0ID0gKG8udGhldGEgfHwgMCkgLSBNYXRoLlBJLzI7XG4gICAgICB4ICs9IHIgKiBNYXRoLmNvcyh0KTtcbiAgICAgIHkgKz0gciAqIE1hdGguc2luKHQpO1xuICAgIH1cblxuICAgIGlmIChvLmFuZ2xlKSB7XG4gICAgICBnLnNhdmUoKTtcbiAgICAgIGcudHJhbnNsYXRlKHgsIHkpO1xuICAgICAgZy5yb3RhdGUoby5hbmdsZSAqIE1hdGguUEkvMTgwKTtcbiAgICAgIHggPSBvLmR4IHx8IDA7XG4gICAgICB5ID0gby5keSB8fCAwO1xuICAgIH0gZWxzZSB7XG4gICAgICB4ICs9IChvLmR4IHx8IDApO1xuICAgICAgeSArPSAoby5keSB8fCAwKTtcbiAgICB9XG5cbiAgICBpZiAoZmlsbCA9IG8uZmlsbCkge1xuICAgICAgZy5nbG9iYWxBbHBoYSA9IG9wYWMgKiAoby5maWxsT3BhY2l0eT09bnVsbCA/IDEgOiBvLmZpbGxPcGFjaXR5KTtcbiAgICAgIGcuZmlsbFN0eWxlID0gY29sb3IoZywgbywgZmlsbCk7XG4gICAgICBnLmZpbGxUZXh0KG8udGV4dCwgeCwgeSk7XG4gICAgfVxuXG4gICAgaWYgKHN0cm9rZSA9IG8uc3Ryb2tlKSB7XG4gICAgICBsdyA9IChsdyA9IG8uc3Ryb2tlV2lkdGgpICE9IG51bGwgPyBsdyA6IDE7XG4gICAgICBpZiAobHcgPiAwKSB7XG4gICAgICAgIGcuZ2xvYmFsQWxwaGEgPSBvcGFjICogKG8uc3Ryb2tlT3BhY2l0eT09bnVsbCA/IDEgOiBvLnN0cm9rZU9wYWNpdHkpO1xuICAgICAgICBnLnN0cm9rZVN0eWxlID0gY29sb3Iobywgc3Ryb2tlKTtcbiAgICAgICAgZy5saW5lV2lkdGggPSBsdztcbiAgICAgICAgZy5zdHJva2VUZXh0KG8udGV4dCwgeCwgeSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG8uYW5nbGUpIGcucmVzdG9yZSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRyYXdBbGwocGF0aEZ1bmMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGcsIHNjZW5lLCBib3VuZHMpIHtcbiAgICBkcmF3UGF0aEFsbChwYXRoRnVuYywgZywgc2NlbmUsIGJvdW5kcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZHJhd09uZShwYXRoRnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24oZywgc2NlbmUsIGJvdW5kcykge1xuICAgIGlmICghc2NlbmUuaXRlbXMubGVuZ3RoKSByZXR1cm47XG4gICAgaWYgKGJvdW5kcyAmJiAhYm91bmRzLmludGVyc2VjdHMoc2NlbmUuaXRlbXNbMF0uYm91bmRzKSlcbiAgICAgIHJldHVybjsgLy8gYm91bmRzIGNoZWNrXG4gICAgZHJhd1BhdGhPbmUocGF0aEZ1bmMsIGcsIHNjZW5lLml0ZW1zWzBdLCBzY2VuZS5pdGVtcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZHJhd0dyb3VwKGcsIHNjZW5lLCBib3VuZHMpIHtcbiAgaWYgKCFzY2VuZS5pdGVtcy5sZW5ndGgpIHJldHVybjtcbiAgdmFyIGl0ZW1zID0gc2NlbmUuaXRlbXMsIGdyb3VwLCBheGVzLCBsZWdlbmRzLFxuICAgICAgcmVuZGVyZXIgPSB0aGlzLCBneCwgZ3ksIGdiLCBpLCBuLCBqLCBtO1xuXG4gIGRyYXdSZWN0KGcsIHNjZW5lLCBib3VuZHMpO1xuXG4gIGZvciAoaT0wLCBuPWl0ZW1zLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICBncm91cCA9IGl0ZW1zW2ldO1xuICAgIGF4ZXMgPSBncm91cC5heGlzSXRlbXMgfHwgW107XG4gICAgbGVnZW5kcyA9IGdyb3VwLmxlZ2VuZEl0ZW1zIHx8IFtdO1xuICAgIGd4ID0gZ3JvdXAueCB8fCAwO1xuICAgIGd5ID0gZ3JvdXAueSB8fCAwO1xuXG4gICAgLy8gcmVuZGVyIGdyb3VwIGNvbnRlbnRzXG4gICAgZy5zYXZlKCk7XG4gICAgZy50cmFuc2xhdGUoZ3gsIGd5KTtcbiAgICBpZiAoZ3JvdXAuY2xpcCkge1xuICAgICAgZy5iZWdpblBhdGgoKTtcbiAgICAgIGcucmVjdCgwLCAwLCBncm91cC53aWR0aCB8fCAwLCBncm91cC5oZWlnaHQgfHwgMCk7XG4gICAgICBnLmNsaXAoKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKGJvdW5kcykgYm91bmRzLnRyYW5zbGF0ZSgtZ3gsIC1neSk7XG4gICAgXG4gICAgZm9yIChqPTAsIG09YXhlcy5sZW5ndGg7IGo8bTsgKytqKSB7XG4gICAgICBpZiAoYXhlc1tqXS5kZWYubGF5ZXIgPT09IFwiYmFja1wiKSB7XG4gICAgICAgIHJlbmRlcmVyLmRyYXcoZywgYXhlc1tqXSwgYm91bmRzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChqPTAsIG09Z3JvdXAuaXRlbXMubGVuZ3RoOyBqPG07ICsraikge1xuICAgICAgcmVuZGVyZXIuZHJhdyhnLCBncm91cC5pdGVtc1tqXSwgYm91bmRzKTtcbiAgICB9XG4gICAgZm9yIChqPTAsIG09YXhlcy5sZW5ndGg7IGo8bTsgKytqKSB7XG4gICAgICBpZiAoYXhlc1tqXS5kZWYubGF5ZXIgIT09IFwiYmFja1wiKSB7XG4gICAgICAgIHJlbmRlcmVyLmRyYXcoZywgYXhlc1tqXSwgYm91bmRzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChqPTAsIG09bGVnZW5kcy5sZW5ndGg7IGo8bTsgKytqKSB7XG4gICAgICByZW5kZXJlci5kcmF3KGcsIGxlZ2VuZHNbal0sIGJvdW5kcyk7XG4gICAgfVxuICAgIFxuICAgIGlmIChib3VuZHMpIGJvdW5kcy50cmFuc2xhdGUoZ3gsIGd5KTtcbiAgICBnLnJlc3RvcmUoKTtcbiAgfSAgICBcbn1cblxuZnVuY3Rpb24gY29sb3IoZywgbywgdmFsdWUpIHtcbiAgcmV0dXJuICh2YWx1ZS5pZClcbiAgICA/IGdyYWRpZW50KGcsIHZhbHVlLCBvLmJvdW5kcylcbiAgICA6IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBncmFkaWVudChnLCBwLCBiKSB7XG4gIHZhciB3ID0gYi53aWR0aCgpLFxuICAgICAgaCA9IGIuaGVpZ2h0KCksXG4gICAgICB4MSA9IGIueDEgKyBwLngxICogdyxcbiAgICAgIHkxID0gYi55MSArIHAueTEgKiBoLFxuICAgICAgeDIgPSBiLngxICsgcC54MiAqIHcsXG4gICAgICB5MiA9IGIueTEgKyBwLnkyICogaCxcbiAgICAgIGdyYWQgPSBnLmNyZWF0ZUxpbmVhckdyYWRpZW50KHgxLCB5MSwgeDIsIHkyKSxcbiAgICAgIHN0b3AgPSBwLnN0b3BzLFxuICAgICAgaSwgbjtcblxuICBmb3IgKGk9MCwgbj1zdG9wLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICBncmFkLmFkZENvbG9yU3RvcChzdG9wW2ldLm9mZnNldCwgc3RvcFtpXS5jb2xvcik7XG4gIH1cbiAgcmV0dXJuIGdyYWQ7XG59XG5cbi8vIGhpdCB0ZXN0aW5nXG5cbmZ1bmN0aW9uIHBpY2tHcm91cChnLCBzY2VuZSwgeCwgeSwgZ3gsIGd5KSB7XG4gIGlmIChzY2VuZS5pdGVtcy5sZW5ndGggPT09IDAgfHxcbiAgICAgIHNjZW5lLmJvdW5kcyAmJiAhc2NlbmUuYm91bmRzLmNvbnRhaW5zKGd4LCBneSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIGl0ZW1zID0gc2NlbmUuaXRlbXMsIHN1YnNjZW5lLCBncm91cCwgaGl0LCBkeCwgZHksXG4gICAgICBoYW5kbGVyID0gdGhpcywgaSwgajtcblxuICBmb3IgKGk9aXRlbXMubGVuZ3RoOyAtLWk+PTA7KSB7XG4gICAgZ3JvdXAgPSBpdGVtc1tpXTtcbiAgICBkeCA9IGdyb3VwLnggfHwgMDtcbiAgICBkeSA9IGdyb3VwLnkgfHwgMDtcblxuICAgIGcuc2F2ZSgpO1xuICAgIGcudHJhbnNsYXRlKGR4LCBkeSk7XG4gICAgZm9yIChqPWdyb3VwLml0ZW1zLmxlbmd0aDsgLS1qID49IDA7KSB7XG4gICAgICBzdWJzY2VuZSA9IGdyb3VwLml0ZW1zW2pdO1xuICAgICAgaWYgKHN1YnNjZW5lLmludGVyYWN0aXZlID09PSBmYWxzZSkgY29udGludWU7XG4gICAgICBoaXQgPSBoYW5kbGVyLnBpY2soc3Vic2NlbmUsIHgsIHksIGd4LWR4LCBneS1keSk7XG4gICAgICBpZiAoaGl0KSB7XG4gICAgICAgIGcucmVzdG9yZSgpO1xuICAgICAgICByZXR1cm4gaGl0O1xuICAgICAgfVxuICAgIH1cbiAgICBnLnJlc3RvcmUoKTtcbiAgfVxuXG4gIHJldHVybiBzY2VuZS5pbnRlcmFjdGl2ZVxuICAgID8gcGlja0FsbChoaXRUZXN0cy5ncm91cCwgZywgc2NlbmUsIHgsIHksIGd4LCBneSlcbiAgICA6IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBwaWNrQWxsKHRlc3QsIGcsIHNjZW5lLCB4LCB5LCBneCwgZ3kpIHtcbiAgaWYgKCFzY2VuZS5pdGVtcy5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgdmFyIG8sIGIsIGk7XG5cbiAgaWYgKGcuX3JhdGlvICE9PSAxKSB7XG4gICAgeCAqPSBnLl9yYXRpbztcbiAgICB5ICo9IGcuX3JhdGlvO1xuICB9XG5cbiAgZm9yIChpPXNjZW5lLml0ZW1zLmxlbmd0aDsgLS1pID49IDA7KSB7XG4gICAgbyA9IHNjZW5lLml0ZW1zW2ldOyBiID0gby5ib3VuZHM7XG4gICAgLy8gZmlyc3QgaGl0IHRlc3QgYWdhaW5zdCBib3VuZGluZyBib3hcbiAgICBpZiAoKGIgJiYgIWIuY29udGFpbnMoZ3gsIGd5KSkgfHwgIWIpIGNvbnRpbnVlO1xuICAgIC8vIGlmIGluIGJvdW5kaW5nIGJveCwgcGVyZm9ybSBtb3JlIGNhcmVmdWwgdGVzdFxuICAgIGlmICh0ZXN0KGcsIG8sIHgsIHksIGd4LCBneSkpIHJldHVybiBvO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gcGlja0FyZWEoZywgc2NlbmUsIHgsIHksIGd4LCBneSkge1xuICBpZiAoIXNjZW5lLml0ZW1zLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICB2YXIgaXRlbXMgPSBzY2VuZS5pdGVtcyxcbiAgICAgIG8sIGIsIGksIGRpLCBkZCwgb2QsIGR4LCBkeTtcblxuICBiID0gaXRlbXNbMF0uYm91bmRzO1xuICBpZiAoYiAmJiAhYi5jb250YWlucyhneCwgZ3kpKSByZXR1cm4gZmFsc2U7XG4gIGlmIChnLl9yYXRpbyAhPT0gMSkge1xuICAgIHggKj0gZy5fcmF0aW87XG4gICAgeSAqPSBnLl9yYXRpbztcbiAgfVxuICBpZiAoIWhpdFRlc3RzLmFyZWEoZywgaXRlbXMsIHgsIHkpKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBpdGVtc1swXTtcbn1cblxuZnVuY3Rpb24gcGlja0xpbmUoZywgc2NlbmUsIHgsIHksIGd4LCBneSkge1xuICBpZiAoIXNjZW5lLml0ZW1zLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICB2YXIgaXRlbXMgPSBzY2VuZS5pdGVtcyxcbiAgICAgIG8sIGIsIGksIGRpLCBkZCwgb2QsIGR4LCBkeTtcblxuICBiID0gaXRlbXNbMF0uYm91bmRzO1xuICBpZiAoYiAmJiAhYi5jb250YWlucyhneCwgZ3kpKSByZXR1cm4gZmFsc2U7XG4gIGlmIChnLl9yYXRpbyAhPT0gMSkge1xuICAgIHggKj0gZy5fcmF0aW87XG4gICAgeSAqPSBnLl9yYXRpbztcbiAgfVxuICBpZiAoIWhpdFRlc3RzLmxpbmUoZywgaXRlbXMsIHgsIHkpKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBpdGVtc1swXTtcbn1cblxuZnVuY3Rpb24gcGljayh0ZXN0KSB7XG4gIHJldHVybiBmdW5jdGlvbiAoZywgc2NlbmUsIHgsIHksIGd4LCBneSkge1xuICAgIHJldHVybiBwaWNrQWxsKHRlc3QsIGcsIHNjZW5lLCB4LCB5LCBneCwgZ3kpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB0ZXh0SGl0KGcsIG8sIHgsIHksIGd4LCBneSkge1xuICBpZiAoIW8uZm9udFNpemUpIHJldHVybiBmYWxzZTtcbiAgaWYgKCFvLmFuZ2xlKSByZXR1cm4gdHJ1ZTsgLy8gYm91bmRzIHN1ZmZpY2llbnQgaWYgbm8gcm90YXRpb25cblxuICB2YXIgYiA9IGJvdW5kc0NhbGMudGV4dChvLCB0bXBCb3VuZHMsIHRydWUpLFxuICAgICAgYSA9IC1vLmFuZ2xlICogTWF0aC5QSSAvIDE4MCxcbiAgICAgIGNvcyA9IE1hdGguY29zKGEpLFxuICAgICAgc2luID0gTWF0aC5zaW4oYSksXG4gICAgICB4ID0gby54LFxuICAgICAgeSA9IG8ueSxcbiAgICAgIHB4ID0gY29zKmd4IC0gc2luKmd5ICsgKHggLSB4KmNvcyArIHkqc2luKSxcbiAgICAgIHB5ID0gc2luKmd4ICsgY29zKmd5ICsgKHkgLSB4KnNpbiAtIHkqY29zKTtcblxuICByZXR1cm4gYi5jb250YWlucyhweCwgcHkpO1xufVxuXG52YXIgaGl0VGVzdHMgPSB7XG4gIHRleHQ6ICAgdGV4dEhpdCxcbiAgcmVjdDogICBmdW5jdGlvbihnLG8seCx5KSB7IHJldHVybiB0cnVlOyB9LCAvLyBib3VuZHMgdGVzdCBpcyBzdWZmaWNpZW50XG4gIGltYWdlOiAgZnVuY3Rpb24oZyxvLHgseSkgeyByZXR1cm4gdHJ1ZTsgfSwgLy8gYm91bmRzIHRlc3QgaXMgc3VmZmljaWVudFxuICBncm91cDogIGZ1bmN0aW9uKGcsbyx4LHkpIHsgcmV0dXJuIG8uZmlsbCB8fCBvLnN0cm9rZTsgfSxcbiAgcnVsZTogICBmdW5jdGlvbihnLG8seCx5KSB7XG4gICAgICAgICAgICBpZiAoIWcuaXNQb2ludEluU3Ryb2tlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBydWxlU3Ryb2tlKGcsbyk7IHJldHVybiBnLmlzUG9pbnRJblN0cm9rZSh4LHkpO1xuICAgICAgICAgIH0sXG4gIGxpbmU6ICAgZnVuY3Rpb24oZyxzLHgseSkge1xuICAgICAgICAgICAgaWYgKCFnLmlzUG9pbnRJblN0cm9rZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgbGluZVN0cm9rZShnLHMpOyByZXR1cm4gZy5pc1BvaW50SW5TdHJva2UoeCx5KTtcbiAgICAgICAgICB9LFxuICBhcmM6ICAgIGZ1bmN0aW9uKGcsbyx4LHkpIHsgYXJjUGF0aChnLG8pOyAgcmV0dXJuIGcuaXNQb2ludEluUGF0aCh4LHkpOyB9LFxuICBhcmVhOiAgIGZ1bmN0aW9uKGcscyx4LHkpIHsgYXJlYVBhdGgoZyxzKTsgcmV0dXJuIGcuaXNQb2ludEluUGF0aCh4LHkpOyB9LFxuICBwYXRoOiAgIGZ1bmN0aW9uKGcsbyx4LHkpIHsgcGF0aFBhdGgoZyxvKTsgcmV0dXJuIGcuaXNQb2ludEluUGF0aCh4LHkpOyB9LFxuICBzeW1ib2w6IGZ1bmN0aW9uKGcsbyx4LHkpIHsgc3ltYm9sUGF0aChnLG8pOyByZXR1cm4gZy5pc1BvaW50SW5QYXRoKHgseSk7IH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkcmF3OiB7XG4gICAgZ3JvdXA6ICAgZHJhd0dyb3VwLFxuICAgIGFyZWE6ICAgIGRyYXdPbmUoYXJlYVBhdGgpLFxuICAgIGxpbmU6ICAgIGRyYXdPbmUobGluZVBhdGgpLFxuICAgIGFyYzogICAgIGRyYXdBbGwoYXJjUGF0aCksXG4gICAgcGF0aDogICAgZHJhd0FsbChwYXRoUGF0aCksXG4gICAgc3ltYm9sOiAgZHJhd0FsbChzeW1ib2xQYXRoKSxcbiAgICByZWN0OiAgICBkcmF3UmVjdCxcbiAgICBydWxlOiAgICBkcmF3UnVsZSxcbiAgICB0ZXh0OiAgICBkcmF3VGV4dCxcbiAgICBpbWFnZTogICBkcmF3SW1hZ2UsXG4gICAgZHJhd09uZTogZHJhd09uZSwgLy8gZXhwb3NlIGZvciBleHRlbnNpYmlsaXR5XG4gICAgZHJhd0FsbDogZHJhd0FsbCAgLy8gZXhwb3NlIGZvciBleHRlbnNpYmlsaXR5XG4gIH0sXG4gIHBpY2s6IHtcbiAgICBncm91cDogICBwaWNrR3JvdXAsXG4gICAgYXJlYTogICAgcGlja0FyZWEsXG4gICAgbGluZTogICAgcGlja0xpbmUsXG4gICAgYXJjOiAgICAgcGljayhoaXRUZXN0cy5hcmMpLFxuICAgIHBhdGg6ICAgIHBpY2soaGl0VGVzdHMucGF0aCksXG4gICAgc3ltYm9sOiAgcGljayhoaXRUZXN0cy5zeW1ib2wpLFxuICAgIHJlY3Q6ICAgIHBpY2soaGl0VGVzdHMucmVjdCksXG4gICAgcnVsZTogICAgcGljayhoaXRUZXN0cy5ydWxlKSxcbiAgICB0ZXh0OiAgICBwaWNrKGhpdFRlc3RzLnRleHQpLFxuICAgIGltYWdlOiAgIHBpY2soaGl0VGVzdHMuaW1hZ2UpLFxuICAgIHBpY2tBbGw6IHBpY2tBbGwgIC8vIGV4cG9zZSBmb3IgZXh0ZW5zaWJpbGl0eVxuICB9XG59OyIsInZhciBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICAgIEJvdW5kcyA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvQm91bmRzJyk7XG5cbi8vIFBhdGggcGFyc2luZyBhbmQgcmVuZGVyaW5nIGNvZGUgdGFrZW4gZnJvbSBmYWJyaWMuanMgLS0gVGhhbmtzIVxudmFyIGNtZExlbmd0aCA9IHsgbToyLCBsOjIsIGg6MSwgdjoxLCBjOjYsIHM6NCwgcTo0LCB0OjIsIGE6NyB9LFxuICAgIHJlID0gWy8oW01MSFZDU1FUQVptbGh2Y3NxdGF6XSkvZywgLyMjIy8sIC8oXFxkKS0vZywgL1xcc3wsfCMjIy9dO1xuXG5mdW5jdGlvbiBwYXJzZShwYXRoKSB7XG4gIHZhciByZXN1bHQgPSBbXSxcbiAgICAgIGN1cnJlbnRQYXRoLFxuICAgICAgY2h1bmtzLFxuICAgICAgcGFyc2VkO1xuXG4gIC8vIEZpcnN0LCBicmVhayBwYXRoIGludG8gY29tbWFuZCBzZXF1ZW5jZVxuICBwYXRoID0gcGF0aC5zbGljZSgpLnJlcGxhY2UocmVbMF0sICcjIyMkMScpLnNwbGl0KHJlWzFdKS5zbGljZSgxKTtcblxuICAvLyBOZXh0LCBwYXJzZSBlYWNoIGNvbW1hbmQgaW4gdHVyblxuICBmb3IgKHZhciBpPTAsIGosIGNodW5rc1BhcnNlZCwgbGVuPXBhdGgubGVuZ3RoOyBpPGxlbjsgaSsrKSB7XG4gICAgY3VycmVudFBhdGggPSBwYXRoW2ldO1xuICAgIGNodW5rcyA9IGN1cnJlbnRQYXRoLnNsaWNlKDEpLnRyaW0oKS5yZXBsYWNlKHJlWzJdLCckMSMjIy0nKS5zcGxpdChyZVszXSk7XG4gICAgY2h1bmtzUGFyc2VkID0gW2N1cnJlbnRQYXRoLmNoYXJBdCgwKV07XG5cbiAgICBmb3IgKHZhciBqID0gMCwgamxlbiA9IGNodW5rcy5sZW5ndGg7IGogPCBqbGVuOyBqKyspIHtcbiAgICAgIHBhcnNlZCA9IHBhcnNlRmxvYXQoY2h1bmtzW2pdKTtcbiAgICAgIGlmICghaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICBjaHVua3NQYXJzZWQucHVzaChwYXJzZWQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBjb21tYW5kID0gY2h1bmtzUGFyc2VkWzBdLnRvTG93ZXJDYXNlKCksXG4gICAgICAgIGNvbW1hbmRMZW5ndGggPSBjbWRMZW5ndGhbY29tbWFuZF07XG5cbiAgICBpZiAoY2h1bmtzUGFyc2VkLmxlbmd0aCAtIDEgPiBjb21tYW5kTGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBrID0gMSwga2xlbiA9IGNodW5rc1BhcnNlZC5sZW5ndGg7IGsgPCBrbGVuOyBrICs9IGNvbW1hbmRMZW5ndGgpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goWyBjaHVua3NQYXJzZWRbMF0gXS5jb25jYXQoY2h1bmtzUGFyc2VkLnNsaWNlKGssIGsgKyBjb21tYW5kTGVuZ3RoKSkpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJlc3VsdC5wdXNoKGNodW5rc1BhcnNlZCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gZHJhd0FyYyhnLCB4LCB5LCBjb29yZHMsIGJvdW5kcywgbCwgdCkge1xuICB2YXIgcnggPSBjb29yZHNbMF07XG4gIHZhciByeSA9IGNvb3Jkc1sxXTtcbiAgdmFyIHJvdCA9IGNvb3Jkc1syXTtcbiAgdmFyIGxhcmdlID0gY29vcmRzWzNdO1xuICB2YXIgc3dlZXAgPSBjb29yZHNbNF07XG4gIHZhciBleCA9IGNvb3Jkc1s1XTtcbiAgdmFyIGV5ID0gY29vcmRzWzZdO1xuICB2YXIgc2VncyA9IGFyY1RvU2VnbWVudHMoZXgsIGV5LCByeCwgcnksIGxhcmdlLCBzd2VlcCwgcm90LCB4LCB5KTtcbiAgZm9yICh2YXIgaT0wOyBpPHNlZ3MubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYmV6ID0gc2VnbWVudFRvQmV6aWVyLmFwcGx5KG51bGwsIHNlZ3NbaV0pO1xuICAgIGcuYmV6aWVyQ3VydmVUby5hcHBseShnLCBiZXopO1xuICAgIGJvdW5kcy5hZGQoYmV6WzBdLWwsIGJlelsxXS10KTtcbiAgICBib3VuZHMuYWRkKGJlelsyXS1sLCBiZXpbM10tdCk7XG4gICAgYm91bmRzLmFkZChiZXpbNF0tbCwgYmV6WzVdLXQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJvdW5kQXJjKHgsIHksIGNvb3JkcywgYm91bmRzKSB7XG4gIHZhciByeCA9IGNvb3Jkc1swXTtcbiAgdmFyIHJ5ID0gY29vcmRzWzFdO1xuICB2YXIgcm90ID0gY29vcmRzWzJdO1xuICB2YXIgbGFyZ2UgPSBjb29yZHNbM107XG4gIHZhciBzd2VlcCA9IGNvb3Jkc1s0XTtcbiAgdmFyIGV4ID0gY29vcmRzWzVdO1xuICB2YXIgZXkgPSBjb29yZHNbNl07XG4gIHZhciBzZWdzID0gYXJjVG9TZWdtZW50cyhleCwgZXksIHJ4LCByeSwgbGFyZ2UsIHN3ZWVwLCByb3QsIHgsIHkpO1xuICBmb3IgKHZhciBpPTA7IGk8c2Vncy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBiZXogPSBzZWdtZW50VG9CZXppZXIuYXBwbHkobnVsbCwgc2Vnc1tpXSk7XG4gICAgYm91bmRzLmFkZChiZXpbMF0sIGJlelsxXSk7XG4gICAgYm91bmRzLmFkZChiZXpbMl0sIGJlelszXSk7XG4gICAgYm91bmRzLmFkZChiZXpbNF0sIGJlels1XSk7XG4gIH1cbn1cblxudmFyIGFyY1RvU2VnbWVudHNDYWNoZSA9IHsgfSxcbiAgICBzZWdtZW50VG9CZXppZXJDYWNoZSA9IHsgfSxcbiAgICBqb2luID0gQXJyYXkucHJvdG90eXBlLmpvaW4sXG4gICAgYXJnc1N0cjtcblxuLy8gQ29waWVkIGZyb20gSW5rc2NhcGUgc3ZndG9wZGYsIHRoYW5rcyFcbmZ1bmN0aW9uIGFyY1RvU2VnbWVudHMoeCwgeSwgcngsIHJ5LCBsYXJnZSwgc3dlZXAsIHJvdGF0ZVgsIG94LCBveSkge1xuICBhcmdzU3RyID0gam9pbi5jYWxsKGFyZ3VtZW50cyk7XG4gIGlmIChhcmNUb1NlZ21lbnRzQ2FjaGVbYXJnc1N0cl0pIHtcbiAgICByZXR1cm4gYXJjVG9TZWdtZW50c0NhY2hlW2FyZ3NTdHJdO1xuICB9XG5cbiAgdmFyIHRoID0gcm90YXRlWCAqIChNYXRoLlBJLzE4MCk7XG4gIHZhciBzaW5fdGggPSBNYXRoLnNpbih0aCk7XG4gIHZhciBjb3NfdGggPSBNYXRoLmNvcyh0aCk7XG4gIHJ4ID0gTWF0aC5hYnMocngpO1xuICByeSA9IE1hdGguYWJzKHJ5KTtcbiAgdmFyIHB4ID0gY29zX3RoICogKG94IC0geCkgKiAwLjUgKyBzaW5fdGggKiAob3kgLSB5KSAqIDAuNTtcbiAgdmFyIHB5ID0gY29zX3RoICogKG95IC0geSkgKiAwLjUgLSBzaW5fdGggKiAob3ggLSB4KSAqIDAuNTtcbiAgdmFyIHBsID0gKHB4KnB4KSAvIChyeCpyeCkgKyAocHkqcHkpIC8gKHJ5KnJ5KTtcbiAgaWYgKHBsID4gMSkge1xuICAgIHBsID0gTWF0aC5zcXJ0KHBsKTtcbiAgICByeCAqPSBwbDtcbiAgICByeSAqPSBwbDtcbiAgfVxuXG4gIHZhciBhMDAgPSBjb3NfdGggLyByeDtcbiAgdmFyIGEwMSA9IHNpbl90aCAvIHJ4O1xuICB2YXIgYTEwID0gKC1zaW5fdGgpIC8gcnk7XG4gIHZhciBhMTEgPSAoY29zX3RoKSAvIHJ5O1xuICB2YXIgeDAgPSBhMDAgKiBveCArIGEwMSAqIG95O1xuICB2YXIgeTAgPSBhMTAgKiBveCArIGExMSAqIG95O1xuICB2YXIgeDEgPSBhMDAgKiB4ICsgYTAxICogeTtcbiAgdmFyIHkxID0gYTEwICogeCArIGExMSAqIHk7XG5cbiAgdmFyIGQgPSAoeDEteDApICogKHgxLXgwKSArICh5MS15MCkgKiAoeTEteTApO1xuICB2YXIgc2ZhY3Rvcl9zcSA9IDEgLyBkIC0gMC4yNTtcbiAgaWYgKHNmYWN0b3Jfc3EgPCAwKSBzZmFjdG9yX3NxID0gMDtcbiAgdmFyIHNmYWN0b3IgPSBNYXRoLnNxcnQoc2ZhY3Rvcl9zcSk7XG4gIGlmIChzd2VlcCA9PSBsYXJnZSkgc2ZhY3RvciA9IC1zZmFjdG9yO1xuICB2YXIgeGMgPSAwLjUgKiAoeDAgKyB4MSkgLSBzZmFjdG9yICogKHkxLXkwKTtcbiAgdmFyIHljID0gMC41ICogKHkwICsgeTEpICsgc2ZhY3RvciAqICh4MS14MCk7XG5cbiAgdmFyIHRoMCA9IE1hdGguYXRhbjIoeTAteWMsIHgwLXhjKTtcbiAgdmFyIHRoMSA9IE1hdGguYXRhbjIoeTEteWMsIHgxLXhjKTtcblxuICB2YXIgdGhfYXJjID0gdGgxLXRoMDtcbiAgaWYgKHRoX2FyYyA8IDAgJiYgc3dlZXAgPT0gMSl7XG4gICAgdGhfYXJjICs9IDIqTWF0aC5QSTtcbiAgfSBlbHNlIGlmICh0aF9hcmMgPiAwICYmIHN3ZWVwID09IDApIHtcbiAgICB0aF9hcmMgLT0gMiAqIE1hdGguUEk7XG4gIH1cblxuICB2YXIgc2VnbWVudHMgPSBNYXRoLmNlaWwoTWF0aC5hYnModGhfYXJjIC8gKE1hdGguUEkgKiAwLjUgKyAwLjAwMSkpKTtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICBmb3IgKHZhciBpPTA7IGk8c2VnbWVudHM7IGkrKykge1xuICAgIHZhciB0aDIgPSB0aDAgKyBpICogdGhfYXJjIC8gc2VnbWVudHM7XG4gICAgdmFyIHRoMyA9IHRoMCArIChpKzEpICogdGhfYXJjIC8gc2VnbWVudHM7XG4gICAgcmVzdWx0W2ldID0gW3hjLCB5YywgdGgyLCB0aDMsIHJ4LCByeSwgc2luX3RoLCBjb3NfdGhdO1xuICB9XG5cbiAgcmV0dXJuIChhcmNUb1NlZ21lbnRzQ2FjaGVbYXJnc1N0cl0gPSByZXN1bHQpO1xufVxuXG5mdW5jdGlvbiBzZWdtZW50VG9CZXppZXIoY3gsIGN5LCB0aDAsIHRoMSwgcngsIHJ5LCBzaW5fdGgsIGNvc190aCkge1xuICBhcmdzU3RyID0gam9pbi5jYWxsKGFyZ3VtZW50cyk7XG4gIGlmIChzZWdtZW50VG9CZXppZXJDYWNoZVthcmdzU3RyXSkge1xuICAgIHJldHVybiBzZWdtZW50VG9CZXppZXJDYWNoZVthcmdzU3RyXTtcbiAgfVxuXG4gIHZhciBhMDAgPSBjb3NfdGggKiByeDtcbiAgdmFyIGEwMSA9IC1zaW5fdGggKiByeTtcbiAgdmFyIGExMCA9IHNpbl90aCAqIHJ4O1xuICB2YXIgYTExID0gY29zX3RoICogcnk7XG5cbiAgdmFyIGNvc190aDAgPSBNYXRoLmNvcyh0aDApO1xuICB2YXIgc2luX3RoMCA9IE1hdGguc2luKHRoMCk7XG4gIHZhciBjb3NfdGgxID0gTWF0aC5jb3ModGgxKTtcbiAgdmFyIHNpbl90aDEgPSBNYXRoLnNpbih0aDEpO1xuXG4gIHZhciB0aF9oYWxmID0gMC41ICogKHRoMSAtIHRoMCk7XG4gIHZhciBzaW5fdGhfaDIgPSBNYXRoLnNpbih0aF9oYWxmICogMC41KTtcbiAgdmFyIHQgPSAoOC8zKSAqIHNpbl90aF9oMiAqIHNpbl90aF9oMiAvIE1hdGguc2luKHRoX2hhbGYpO1xuICB2YXIgeDEgPSBjeCArIGNvc190aDAgLSB0ICogc2luX3RoMDtcbiAgdmFyIHkxID0gY3kgKyBzaW5fdGgwICsgdCAqIGNvc190aDA7XG4gIHZhciB4MyA9IGN4ICsgY29zX3RoMTtcbiAgdmFyIHkzID0gY3kgKyBzaW5fdGgxO1xuICB2YXIgeDIgPSB4MyArIHQgKiBzaW5fdGgxO1xuICB2YXIgeTIgPSB5MyAtIHQgKiBjb3NfdGgxO1xuXG4gIHJldHVybiAoc2VnbWVudFRvQmV6aWVyQ2FjaGVbYXJnc1N0cl0gPSBbXG4gICAgYTAwICogeDEgKyBhMDEgKiB5MSwgIGExMCAqIHgxICsgYTExICogeTEsXG4gICAgYTAwICogeDIgKyBhMDEgKiB5MiwgIGExMCAqIHgyICsgYTExICogeTIsXG4gICAgYTAwICogeDMgKyBhMDEgKiB5MywgIGExMCAqIHgzICsgYTExICogeTNcbiAgXSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlcihnLCBwYXRoLCBsLCB0KSB7XG4gIHZhciBjdXJyZW50LCAvLyBjdXJyZW50IGluc3RydWN0aW9uXG4gICAgICBwcmV2aW91cyA9IG51bGwsXG4gICAgICB4ID0gMCwgLy8gY3VycmVudCB4XG4gICAgICB5ID0gMCwgLy8gY3VycmVudCB5XG4gICAgICBjb250cm9sWCA9IDAsIC8vIGN1cnJlbnQgY29udHJvbCBwb2ludCB4XG4gICAgICBjb250cm9sWSA9IDAsIC8vIGN1cnJlbnQgY29udHJvbCBwb2ludCB5XG4gICAgICB0ZW1wWCxcbiAgICAgIHRlbXBZLFxuICAgICAgdGVtcENvbnRyb2xYLFxuICAgICAgdGVtcENvbnRyb2xZLFxuICAgICAgYm91bmRzID0gbmV3IEJvdW5kcygpO1xuICBpZiAobCA9PSB1bmRlZmluZWQpIGwgPSAwO1xuICBpZiAodCA9PSB1bmRlZmluZWQpIHQgPSAwO1xuXG4gIGcuYmVnaW5QYXRoKCk7XG5cbiAgZm9yICh2YXIgaT0wLCBsZW49cGF0aC5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBjdXJyZW50ID0gcGF0aFtpXTtcblxuICAgIHN3aXRjaCAoY3VycmVudFswXSkgeyAvLyBmaXJzdCBsZXR0ZXJcblxuICAgICAgY2FzZSAnbCc6IC8vIGxpbmV0bywgcmVsYXRpdmVcbiAgICAgICAgeCArPSBjdXJyZW50WzFdO1xuICAgICAgICB5ICs9IGN1cnJlbnRbMl07XG4gICAgICAgIGcubGluZVRvKHggKyBsLCB5ICsgdCk7XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdMJzogLy8gbGluZXRvLCBhYnNvbHV0ZVxuICAgICAgICB4ID0gY3VycmVudFsxXTtcbiAgICAgICAgeSA9IGN1cnJlbnRbMl07XG4gICAgICAgIGcubGluZVRvKHggKyBsLCB5ICsgdCk7XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdoJzogLy8gaG9yaXpvbnRhbCBsaW5ldG8sIHJlbGF0aXZlXG4gICAgICAgIHggKz0gY3VycmVudFsxXTtcbiAgICAgICAgZy5saW5lVG8oeCArIGwsIHkgKyB0KTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ0gnOiAvLyBob3Jpem9udGFsIGxpbmV0bywgYWJzb2x1dGVcbiAgICAgICAgeCA9IGN1cnJlbnRbMV07XG4gICAgICAgIGcubGluZVRvKHggKyBsLCB5ICsgdCk7XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICd2JzogLy8gdmVydGljYWwgbGluZXRvLCByZWxhdGl2ZVxuICAgICAgICB5ICs9IGN1cnJlbnRbMV07XG4gICAgICAgIGcubGluZVRvKHggKyBsLCB5ICsgdCk7XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdWJzogLy8gdmVyaWNhbCBsaW5ldG8sIGFic29sdXRlXG4gICAgICAgIHkgPSBjdXJyZW50WzFdO1xuICAgICAgICBnLmxpbmVUbyh4ICsgbCwgeSArIHQpO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnbSc6IC8vIG1vdmVUbywgcmVsYXRpdmVcbiAgICAgICAgeCArPSBjdXJyZW50WzFdO1xuICAgICAgICB5ICs9IGN1cnJlbnRbMl07XG4gICAgICAgIGcubW92ZVRvKHggKyBsLCB5ICsgdCk7XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdNJzogLy8gbW92ZVRvLCBhYnNvbHV0ZVxuICAgICAgICB4ID0gY3VycmVudFsxXTtcbiAgICAgICAgeSA9IGN1cnJlbnRbMl07XG4gICAgICAgIGcubW92ZVRvKHggKyBsLCB5ICsgdCk7XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjJzogLy8gYmV6aWVyQ3VydmVUbywgcmVsYXRpdmVcbiAgICAgICAgdGVtcFggPSB4ICsgY3VycmVudFs1XTtcbiAgICAgICAgdGVtcFkgPSB5ICsgY3VycmVudFs2XTtcbiAgICAgICAgY29udHJvbFggPSB4ICsgY3VycmVudFszXTtcbiAgICAgICAgY29udHJvbFkgPSB5ICsgY3VycmVudFs0XTtcbiAgICAgICAgZy5iZXppZXJDdXJ2ZVRvKFxuICAgICAgICAgIHggKyBjdXJyZW50WzFdICsgbCwgLy8geDFcbiAgICAgICAgICB5ICsgY3VycmVudFsyXSArIHQsIC8vIHkxXG4gICAgICAgICAgY29udHJvbFggKyBsLCAvLyB4MlxuICAgICAgICAgIGNvbnRyb2xZICsgdCwgLy8geTJcbiAgICAgICAgICB0ZW1wWCArIGwsXG4gICAgICAgICAgdGVtcFkgKyB0XG4gICAgICAgICk7XG4gICAgICAgIGJvdW5kcy5hZGQoeCArIGN1cnJlbnRbMV0sIHkgKyBjdXJyZW50WzJdKTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHRlbXBYLCB0ZW1wWSk7XG4gICAgICAgIHggPSB0ZW1wWDtcbiAgICAgICAgeSA9IHRlbXBZO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnQyc6IC8vIGJlemllckN1cnZlVG8sIGFic29sdXRlXG4gICAgICAgIHggPSBjdXJyZW50WzVdO1xuICAgICAgICB5ID0gY3VycmVudFs2XTtcbiAgICAgICAgY29udHJvbFggPSBjdXJyZW50WzNdO1xuICAgICAgICBjb250cm9sWSA9IGN1cnJlbnRbNF07XG4gICAgICAgIGcuYmV6aWVyQ3VydmVUbyhcbiAgICAgICAgICBjdXJyZW50WzFdICsgbCxcbiAgICAgICAgICBjdXJyZW50WzJdICsgdCxcbiAgICAgICAgICBjb250cm9sWCArIGwsXG4gICAgICAgICAgY29udHJvbFkgKyB0LFxuICAgICAgICAgIHggKyBsLFxuICAgICAgICAgIHkgKyB0XG4gICAgICAgICk7XG4gICAgICAgIGJvdW5kcy5hZGQoY3VycmVudFsxXSwgY3VycmVudFsyXSk7XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3MnOiAvLyBzaG9ydGhhbmQgY3ViaWMgYmV6aWVyQ3VydmVUbywgcmVsYXRpdmVcbiAgICAgICAgLy8gdHJhbnNmb3JtIHRvIGFic29sdXRlIHgseVxuICAgICAgICB0ZW1wWCA9IHggKyBjdXJyZW50WzNdO1xuICAgICAgICB0ZW1wWSA9IHkgKyBjdXJyZW50WzRdO1xuICAgICAgICAvLyBjYWxjdWxhdGUgcmVmbGVjdGlvbiBvZiBwcmV2aW91cyBjb250cm9sIHBvaW50c1xuICAgICAgICBjb250cm9sWCA9IDIgKiB4IC0gY29udHJvbFg7XG4gICAgICAgIGNvbnRyb2xZID0gMiAqIHkgLSBjb250cm9sWTtcbiAgICAgICAgZy5iZXppZXJDdXJ2ZVRvKFxuICAgICAgICAgIGNvbnRyb2xYICsgbCxcbiAgICAgICAgICBjb250cm9sWSArIHQsXG4gICAgICAgICAgeCArIGN1cnJlbnRbMV0gKyBsLFxuICAgICAgICAgIHkgKyBjdXJyZW50WzJdICsgdCxcbiAgICAgICAgICB0ZW1wWCArIGwsXG4gICAgICAgICAgdGVtcFkgKyB0XG4gICAgICAgICk7XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh4ICsgY3VycmVudFsxXSwgeSArIGN1cnJlbnRbMl0pO1xuICAgICAgICBib3VuZHMuYWRkKHRlbXBYLCB0ZW1wWSk7XG5cbiAgICAgICAgLy8gc2V0IGNvbnRyb2wgcG9pbnQgdG8gMm5kIG9uZSBvZiB0aGlzIGNvbW1hbmRcbiAgICAgICAgLy8gXCIuLi4gdGhlIGZpcnN0IGNvbnRyb2wgcG9pbnQgaXMgYXNzdW1lZCB0byBiZSB0aGUgcmVmbGVjdGlvbiBvZiB0aGUgc2Vjb25kIGNvbnRyb2wgcG9pbnQgb24gdGhlIHByZXZpb3VzIGNvbW1hbmQgcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgcG9pbnQuXCJcbiAgICAgICAgY29udHJvbFggPSB4ICsgY3VycmVudFsxXTtcbiAgICAgICAgY29udHJvbFkgPSB5ICsgY3VycmVudFsyXTtcblxuICAgICAgICB4ID0gdGVtcFg7XG4gICAgICAgIHkgPSB0ZW1wWTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ1MnOiAvLyBzaG9ydGhhbmQgY3ViaWMgYmV6aWVyQ3VydmVUbywgYWJzb2x1dGVcbiAgICAgICAgdGVtcFggPSBjdXJyZW50WzNdO1xuICAgICAgICB0ZW1wWSA9IGN1cnJlbnRbNF07XG4gICAgICAgIC8vIGNhbGN1bGF0ZSByZWZsZWN0aW9uIG9mIHByZXZpb3VzIGNvbnRyb2wgcG9pbnRzXG4gICAgICAgIGNvbnRyb2xYID0gMip4IC0gY29udHJvbFg7XG4gICAgICAgIGNvbnRyb2xZID0gMip5IC0gY29udHJvbFk7XG4gICAgICAgIGcuYmV6aWVyQ3VydmVUbyhcbiAgICAgICAgICBjb250cm9sWCArIGwsXG4gICAgICAgICAgY29udHJvbFkgKyB0LFxuICAgICAgICAgIGN1cnJlbnRbMV0gKyBsLFxuICAgICAgICAgIGN1cnJlbnRbMl0gKyB0LFxuICAgICAgICAgIHRlbXBYICsgbCxcbiAgICAgICAgICB0ZW1wWSArIHRcbiAgICAgICAgKTtcbiAgICAgICAgeCA9IHRlbXBYO1xuICAgICAgICB5ID0gdGVtcFk7XG4gICAgICAgIGJvdW5kcy5hZGQoY3VycmVudFsxXSwgY3VycmVudFsyXSk7XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh0ZW1wWCwgdGVtcFkpO1xuICAgICAgICAvLyBzZXQgY29udHJvbCBwb2ludCB0byAybmQgb25lIG9mIHRoaXMgY29tbWFuZFxuICAgICAgICAvLyBcIi4uLiB0aGUgZmlyc3QgY29udHJvbCBwb2ludCBpcyBhc3N1bWVkIHRvIGJlIHRoZSByZWZsZWN0aW9uIG9mIHRoZSBzZWNvbmQgY29udHJvbCBwb2ludCBvbiB0aGUgcHJldmlvdXMgY29tbWFuZCByZWxhdGl2ZSB0byB0aGUgY3VycmVudCBwb2ludC5cIlxuICAgICAgICBjb250cm9sWCA9IGN1cnJlbnRbMV07XG4gICAgICAgIGNvbnRyb2xZID0gY3VycmVudFsyXTtcblxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAncSc6IC8vIHF1YWRyYXRpY0N1cnZlVG8sIHJlbGF0aXZlXG4gICAgICAgIC8vIHRyYW5zZm9ybSB0byBhYnNvbHV0ZSB4LHlcbiAgICAgICAgdGVtcFggPSB4ICsgY3VycmVudFszXTtcbiAgICAgICAgdGVtcFkgPSB5ICsgY3VycmVudFs0XTtcblxuICAgICAgICBjb250cm9sWCA9IHggKyBjdXJyZW50WzFdO1xuICAgICAgICBjb250cm9sWSA9IHkgKyBjdXJyZW50WzJdO1xuXG4gICAgICAgIGcucXVhZHJhdGljQ3VydmVUbyhcbiAgICAgICAgICBjb250cm9sWCArIGwsXG4gICAgICAgICAgY29udHJvbFkgKyB0LFxuICAgICAgICAgIHRlbXBYICsgbCxcbiAgICAgICAgICB0ZW1wWSArIHRcbiAgICAgICAgKTtcbiAgICAgICAgeCA9IHRlbXBYO1xuICAgICAgICB5ID0gdGVtcFk7XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh0ZW1wWCwgdGVtcFkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnUSc6IC8vIHF1YWRyYXRpY0N1cnZlVG8sIGFic29sdXRlXG4gICAgICAgIHRlbXBYID0gY3VycmVudFszXTtcbiAgICAgICAgdGVtcFkgPSBjdXJyZW50WzRdO1xuXG4gICAgICAgIGcucXVhZHJhdGljQ3VydmVUbyhcbiAgICAgICAgICBjdXJyZW50WzFdICsgbCxcbiAgICAgICAgICBjdXJyZW50WzJdICsgdCxcbiAgICAgICAgICB0ZW1wWCArIGwsXG4gICAgICAgICAgdGVtcFkgKyB0XG4gICAgICAgICk7XG4gICAgICAgIHggPSB0ZW1wWDtcbiAgICAgICAgeSA9IHRlbXBZO1xuICAgICAgICBjb250cm9sWCA9IGN1cnJlbnRbMV07XG4gICAgICAgIGNvbnRyb2xZID0gY3VycmVudFsyXTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHRlbXBYLCB0ZW1wWSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICd0JzogLy8gc2hvcnRoYW5kIHF1YWRyYXRpY0N1cnZlVG8sIHJlbGF0aXZlXG5cbiAgICAgICAgLy8gdHJhbnNmb3JtIHRvIGFic29sdXRlIHgseVxuICAgICAgICB0ZW1wWCA9IHggKyBjdXJyZW50WzFdO1xuICAgICAgICB0ZW1wWSA9IHkgKyBjdXJyZW50WzJdO1xuXG4gICAgICAgIGlmIChwcmV2aW91c1swXS5tYXRjaCgvW1FxVHRdLykgPT09IG51bGwpIHtcbiAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBubyBwcmV2aW91cyBjb21tYW5kIG9yIGlmIHRoZSBwcmV2aW91cyBjb21tYW5kIHdhcyBub3QgYSBRLCBxLCBUIG9yIHQsXG4gICAgICAgICAgLy8gYXNzdW1lIHRoZSBjb250cm9sIHBvaW50IGlzIGNvaW5jaWRlbnQgd2l0aCB0aGUgY3VycmVudCBwb2ludFxuICAgICAgICAgIGNvbnRyb2xYID0geDtcbiAgICAgICAgICBjb250cm9sWSA9IHk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJldmlvdXNbMF0gPT09ICd0Jykge1xuICAgICAgICAgIC8vIGNhbGN1bGF0ZSByZWZsZWN0aW9uIG9mIHByZXZpb3VzIGNvbnRyb2wgcG9pbnRzIGZvciB0XG4gICAgICAgICAgY29udHJvbFggPSAyICogeCAtIHRlbXBDb250cm9sWDtcbiAgICAgICAgICBjb250cm9sWSA9IDIgKiB5IC0gdGVtcENvbnRyb2xZO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByZXZpb3VzWzBdID09PSAncScpIHtcbiAgICAgICAgICAvLyBjYWxjdWxhdGUgcmVmbGVjdGlvbiBvZiBwcmV2aW91cyBjb250cm9sIHBvaW50cyBmb3IgcVxuICAgICAgICAgIGNvbnRyb2xYID0gMiAqIHggLSBjb250cm9sWDtcbiAgICAgICAgICBjb250cm9sWSA9IDIgKiB5IC0gY29udHJvbFk7XG4gICAgICAgIH1cblxuICAgICAgICB0ZW1wQ29udHJvbFggPSBjb250cm9sWDtcbiAgICAgICAgdGVtcENvbnRyb2xZID0gY29udHJvbFk7XG5cbiAgICAgICAgZy5xdWFkcmF0aWNDdXJ2ZVRvKFxuICAgICAgICAgIGNvbnRyb2xYICsgbCxcbiAgICAgICAgICBjb250cm9sWSArIHQsXG4gICAgICAgICAgdGVtcFggKyBsLFxuICAgICAgICAgIHRlbXBZICsgdFxuICAgICAgICApO1xuICAgICAgICB4ID0gdGVtcFg7XG4gICAgICAgIHkgPSB0ZW1wWTtcbiAgICAgICAgY29udHJvbFggPSB4ICsgY3VycmVudFsxXTtcbiAgICAgICAgY29udHJvbFkgPSB5ICsgY3VycmVudFsyXTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHRlbXBYLCB0ZW1wWSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdUJzpcbiAgICAgICAgdGVtcFggPSBjdXJyZW50WzFdO1xuICAgICAgICB0ZW1wWSA9IGN1cnJlbnRbMl07XG5cbiAgICAgICAgLy8gY2FsY3VsYXRlIHJlZmxlY3Rpb24gb2YgcHJldmlvdXMgY29udHJvbCBwb2ludHNcbiAgICAgICAgY29udHJvbFggPSAyICogeCAtIGNvbnRyb2xYO1xuICAgICAgICBjb250cm9sWSA9IDIgKiB5IC0gY29udHJvbFk7XG4gICAgICAgIGcucXVhZHJhdGljQ3VydmVUbyhcbiAgICAgICAgICBjb250cm9sWCArIGwsXG4gICAgICAgICAgY29udHJvbFkgKyB0LFxuICAgICAgICAgIHRlbXBYICsgbCxcbiAgICAgICAgICB0ZW1wWSArIHRcbiAgICAgICAgKTtcbiAgICAgICAgeCA9IHRlbXBYO1xuICAgICAgICB5ID0gdGVtcFk7XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh0ZW1wWCwgdGVtcFkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYSc6XG4gICAgICAgIGRyYXdBcmMoZywgeCArIGwsIHkgKyB0LCBbXG4gICAgICAgICAgY3VycmVudFsxXSxcbiAgICAgICAgICBjdXJyZW50WzJdLFxuICAgICAgICAgIGN1cnJlbnRbM10sXG4gICAgICAgICAgY3VycmVudFs0XSxcbiAgICAgICAgICBjdXJyZW50WzVdLFxuICAgICAgICAgIGN1cnJlbnRbNl0gKyB4ICsgbCxcbiAgICAgICAgICBjdXJyZW50WzddICsgeSArIHRcbiAgICAgICAgXSwgYm91bmRzLCBsLCB0KTtcbiAgICAgICAgeCArPSBjdXJyZW50WzZdO1xuICAgICAgICB5ICs9IGN1cnJlbnRbN107XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdBJzpcbiAgICAgICAgZHJhd0FyYyhnLCB4ICsgbCwgeSArIHQsIFtcbiAgICAgICAgICBjdXJyZW50WzFdLFxuICAgICAgICAgIGN1cnJlbnRbMl0sXG4gICAgICAgICAgY3VycmVudFszXSxcbiAgICAgICAgICBjdXJyZW50WzRdLFxuICAgICAgICAgIGN1cnJlbnRbNV0sXG4gICAgICAgICAgY3VycmVudFs2XSArIGwsXG4gICAgICAgICAgY3VycmVudFs3XSArIHRcbiAgICAgICAgXSwgYm91bmRzLCBsLCB0KTtcbiAgICAgICAgeCA9IGN1cnJlbnRbNl07XG4gICAgICAgIHkgPSBjdXJyZW50WzddO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAneic6XG4gICAgICBjYXNlICdaJzpcbiAgICAgICAgZy5jbG9zZVBhdGgoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHByZXZpb3VzID0gY3VycmVudDtcbiAgfVxuICByZXR1cm4gYm91bmRzLnRyYW5zbGF0ZShsLCB0KTtcbn1cblxuZnVuY3Rpb24gYm91bmRzKHBhdGgsIGJvdW5kcykge1xuICB2YXIgY3VycmVudCwgLy8gY3VycmVudCBpbnN0cnVjdGlvblxuICAgICAgcHJldmlvdXMgPSBudWxsLFxuICAgICAgeCA9IDAsIC8vIGN1cnJlbnQgeFxuICAgICAgeSA9IDAsIC8vIGN1cnJlbnQgeVxuICAgICAgY29udHJvbFggPSAwLCAvLyBjdXJyZW50IGNvbnRyb2wgcG9pbnQgeFxuICAgICAgY29udHJvbFkgPSAwLCAvLyBjdXJyZW50IGNvbnRyb2wgcG9pbnQgeVxuICAgICAgdGVtcFgsXG4gICAgICB0ZW1wWSxcbiAgICAgIHRlbXBDb250cm9sWCxcbiAgICAgIHRlbXBDb250cm9sWTtcblxuICBmb3IgKHZhciBpPTAsIGxlbj1wYXRoLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIGN1cnJlbnQgPSBwYXRoW2ldO1xuXG4gICAgc3dpdGNoIChjdXJyZW50WzBdKSB7IC8vIGZpcnN0IGxldHRlclxuXG4gICAgICBjYXNlICdsJzogLy8gbGluZXRvLCByZWxhdGl2ZVxuICAgICAgICB4ICs9IGN1cnJlbnRbMV07XG4gICAgICAgIHkgKz0gY3VycmVudFsyXTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ0wnOiAvLyBsaW5ldG8sIGFic29sdXRlXG4gICAgICAgIHggPSBjdXJyZW50WzFdO1xuICAgICAgICB5ID0gY3VycmVudFsyXTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2gnOiAvLyBob3Jpem9udGFsIGxpbmV0bywgcmVsYXRpdmVcbiAgICAgICAgeCArPSBjdXJyZW50WzFdO1xuICAgICAgICBib3VuZHMuYWRkKHgsIHkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnSCc6IC8vIGhvcml6b250YWwgbGluZXRvLCBhYnNvbHV0ZVxuICAgICAgICB4ID0gY3VycmVudFsxXTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3YnOiAvLyB2ZXJ0aWNhbCBsaW5ldG8sIHJlbGF0aXZlXG4gICAgICAgIHkgKz0gY3VycmVudFsxXTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ1YnOiAvLyB2ZXJpY2FsIGxpbmV0bywgYWJzb2x1dGVcbiAgICAgICAgeSA9IGN1cnJlbnRbMV07XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdtJzogLy8gbW92ZVRvLCByZWxhdGl2ZVxuICAgICAgICB4ICs9IGN1cnJlbnRbMV07XG4gICAgICAgIHkgKz0gY3VycmVudFsyXTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ00nOiAvLyBtb3ZlVG8sIGFic29sdXRlXG4gICAgICAgIHggPSBjdXJyZW50WzFdO1xuICAgICAgICB5ID0gY3VycmVudFsyXTtcbiAgICAgICAgYm91bmRzLmFkZCh4LCB5KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2MnOiAvLyBiZXppZXJDdXJ2ZVRvLCByZWxhdGl2ZVxuICAgICAgICB0ZW1wWCA9IHggKyBjdXJyZW50WzVdO1xuICAgICAgICB0ZW1wWSA9IHkgKyBjdXJyZW50WzZdO1xuICAgICAgICBjb250cm9sWCA9IHggKyBjdXJyZW50WzNdO1xuICAgICAgICBjb250cm9sWSA9IHkgKyBjdXJyZW50WzRdO1xuICAgICAgICBib3VuZHMuYWRkKHggKyBjdXJyZW50WzFdLCB5ICsgY3VycmVudFsyXSk7XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh0ZW1wWCwgdGVtcFkpO1xuICAgICAgICB4ID0gdGVtcFg7XG4gICAgICAgIHkgPSB0ZW1wWTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ0MnOiAvLyBiZXppZXJDdXJ2ZVRvLCBhYnNvbHV0ZVxuICAgICAgICB4ID0gY3VycmVudFs1XTtcbiAgICAgICAgeSA9IGN1cnJlbnRbNl07XG4gICAgICAgIGNvbnRyb2xYID0gY3VycmVudFszXTtcbiAgICAgICAgY29udHJvbFkgPSBjdXJyZW50WzRdO1xuICAgICAgICBib3VuZHMuYWRkKGN1cnJlbnRbMV0sIGN1cnJlbnRbMl0pO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQoeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdzJzogLy8gc2hvcnRoYW5kIGN1YmljIGJlemllckN1cnZlVG8sIHJlbGF0aXZlXG4gICAgICAgIC8vIHRyYW5zZm9ybSB0byBhYnNvbHV0ZSB4LHlcbiAgICAgICAgdGVtcFggPSB4ICsgY3VycmVudFszXTtcbiAgICAgICAgdGVtcFkgPSB5ICsgY3VycmVudFs0XTtcbiAgICAgICAgLy8gY2FsY3VsYXRlIHJlZmxlY3Rpb24gb2YgcHJldmlvdXMgY29udHJvbCBwb2ludHNcbiAgICAgICAgY29udHJvbFggPSAyICogeCAtIGNvbnRyb2xYO1xuICAgICAgICBjb250cm9sWSA9IDIgKiB5IC0gY29udHJvbFk7XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh4ICsgY3VycmVudFsxXSwgeSArIGN1cnJlbnRbMl0pO1xuICAgICAgICBib3VuZHMuYWRkKHRlbXBYLCB0ZW1wWSk7XG5cbiAgICAgICAgLy8gc2V0IGNvbnRyb2wgcG9pbnQgdG8gMm5kIG9uZSBvZiB0aGlzIGNvbW1hbmRcbiAgICAgICAgLy8gXCIuLi4gdGhlIGZpcnN0IGNvbnRyb2wgcG9pbnQgaXMgYXNzdW1lZCB0byBiZSB0aGUgcmVmbGVjdGlvbiBvZiB0aGUgc2Vjb25kIGNvbnRyb2wgcG9pbnQgb24gdGhlIHByZXZpb3VzIGNvbW1hbmQgcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgcG9pbnQuXCJcbiAgICAgICAgY29udHJvbFggPSB4ICsgY3VycmVudFsxXTtcbiAgICAgICAgY29udHJvbFkgPSB5ICsgY3VycmVudFsyXTtcblxuICAgICAgICB4ID0gdGVtcFg7XG4gICAgICAgIHkgPSB0ZW1wWTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ1MnOiAvLyBzaG9ydGhhbmQgY3ViaWMgYmV6aWVyQ3VydmVUbywgYWJzb2x1dGVcbiAgICAgICAgdGVtcFggPSBjdXJyZW50WzNdO1xuICAgICAgICB0ZW1wWSA9IGN1cnJlbnRbNF07XG4gICAgICAgIC8vIGNhbGN1bGF0ZSByZWZsZWN0aW9uIG9mIHByZXZpb3VzIGNvbnRyb2wgcG9pbnRzXG4gICAgICAgIGNvbnRyb2xYID0gMip4IC0gY29udHJvbFg7XG4gICAgICAgIGNvbnRyb2xZID0gMip5IC0gY29udHJvbFk7XG4gICAgICAgIHggPSB0ZW1wWDtcbiAgICAgICAgeSA9IHRlbXBZO1xuICAgICAgICBib3VuZHMuYWRkKGN1cnJlbnRbMV0sIGN1cnJlbnRbMl0pO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQodGVtcFgsIHRlbXBZKTtcbiAgICAgICAgLy8gc2V0IGNvbnRyb2wgcG9pbnQgdG8gMm5kIG9uZSBvZiB0aGlzIGNvbW1hbmRcbiAgICAgICAgLy8gXCIuLi4gdGhlIGZpcnN0IGNvbnRyb2wgcG9pbnQgaXMgYXNzdW1lZCB0byBiZSB0aGUgcmVmbGVjdGlvbiBvZiB0aGUgc2Vjb25kIGNvbnRyb2wgcG9pbnQgb24gdGhlIHByZXZpb3VzIGNvbW1hbmQgcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgcG9pbnQuXCJcbiAgICAgICAgY29udHJvbFggPSBjdXJyZW50WzFdO1xuICAgICAgICBjb250cm9sWSA9IGN1cnJlbnRbMl07XG5cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3EnOiAvLyBxdWFkcmF0aWNDdXJ2ZVRvLCByZWxhdGl2ZVxuICAgICAgICAvLyB0cmFuc2Zvcm0gdG8gYWJzb2x1dGUgeCx5XG4gICAgICAgIHRlbXBYID0geCArIGN1cnJlbnRbM107XG4gICAgICAgIHRlbXBZID0geSArIGN1cnJlbnRbNF07XG5cbiAgICAgICAgY29udHJvbFggPSB4ICsgY3VycmVudFsxXTtcbiAgICAgICAgY29udHJvbFkgPSB5ICsgY3VycmVudFsyXTtcblxuICAgICAgICB4ID0gdGVtcFg7XG4gICAgICAgIHkgPSB0ZW1wWTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHRlbXBYLCB0ZW1wWSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdRJzogLy8gcXVhZHJhdGljQ3VydmVUbywgYWJzb2x1dGVcbiAgICAgICAgdGVtcFggPSBjdXJyZW50WzNdO1xuICAgICAgICB0ZW1wWSA9IGN1cnJlbnRbNF07XG5cbiAgICAgICAgeCA9IHRlbXBYO1xuICAgICAgICB5ID0gdGVtcFk7XG4gICAgICAgIGNvbnRyb2xYID0gY3VycmVudFsxXTtcbiAgICAgICAgY29udHJvbFkgPSBjdXJyZW50WzJdO1xuICAgICAgICBib3VuZHMuYWRkKGNvbnRyb2xYLCBjb250cm9sWSk7XG4gICAgICAgIGJvdW5kcy5hZGQodGVtcFgsIHRlbXBZKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3QnOiAvLyBzaG9ydGhhbmQgcXVhZHJhdGljQ3VydmVUbywgcmVsYXRpdmVcblxuICAgICAgICAvLyB0cmFuc2Zvcm0gdG8gYWJzb2x1dGUgeCx5XG4gICAgICAgIHRlbXBYID0geCArIGN1cnJlbnRbMV07XG4gICAgICAgIHRlbXBZID0geSArIGN1cnJlbnRbMl07XG5cbiAgICAgICAgaWYgKHByZXZpb3VzWzBdLm1hdGNoKC9bUXFUdF0vKSA9PT0gbnVsbCkge1xuICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIHByZXZpb3VzIGNvbW1hbmQgb3IgaWYgdGhlIHByZXZpb3VzIGNvbW1hbmQgd2FzIG5vdCBhIFEsIHEsIFQgb3IgdCxcbiAgICAgICAgICAvLyBhc3N1bWUgdGhlIGNvbnRyb2wgcG9pbnQgaXMgY29pbmNpZGVudCB3aXRoIHRoZSBjdXJyZW50IHBvaW50XG4gICAgICAgICAgY29udHJvbFggPSB4O1xuICAgICAgICAgIGNvbnRyb2xZID0geTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChwcmV2aW91c1swXSA9PT0gJ3QnKSB7XG4gICAgICAgICAgLy8gY2FsY3VsYXRlIHJlZmxlY3Rpb24gb2YgcHJldmlvdXMgY29udHJvbCBwb2ludHMgZm9yIHRcbiAgICAgICAgICBjb250cm9sWCA9IDIgKiB4IC0gdGVtcENvbnRyb2xYO1xuICAgICAgICAgIGNvbnRyb2xZID0gMiAqIHkgLSB0ZW1wQ29udHJvbFk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJldmlvdXNbMF0gPT09ICdxJykge1xuICAgICAgICAgIC8vIGNhbGN1bGF0ZSByZWZsZWN0aW9uIG9mIHByZXZpb3VzIGNvbnRyb2wgcG9pbnRzIGZvciBxXG4gICAgICAgICAgY29udHJvbFggPSAyICogeCAtIGNvbnRyb2xYO1xuICAgICAgICAgIGNvbnRyb2xZID0gMiAqIHkgLSBjb250cm9sWTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRlbXBDb250cm9sWCA9IGNvbnRyb2xYO1xuICAgICAgICB0ZW1wQ29udHJvbFkgPSBjb250cm9sWTtcblxuICAgICAgICB4ID0gdGVtcFg7XG4gICAgICAgIHkgPSB0ZW1wWTtcbiAgICAgICAgY29udHJvbFggPSB4ICsgY3VycmVudFsxXTtcbiAgICAgICAgY29udHJvbFkgPSB5ICsgY3VycmVudFsyXTtcbiAgICAgICAgYm91bmRzLmFkZChjb250cm9sWCwgY29udHJvbFkpO1xuICAgICAgICBib3VuZHMuYWRkKHRlbXBYLCB0ZW1wWSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdUJzpcbiAgICAgICAgdGVtcFggPSBjdXJyZW50WzFdO1xuICAgICAgICB0ZW1wWSA9IGN1cnJlbnRbMl07XG5cbiAgICAgICAgLy8gY2FsY3VsYXRlIHJlZmxlY3Rpb24gb2YgcHJldmlvdXMgY29udHJvbCBwb2ludHNcbiAgICAgICAgY29udHJvbFggPSAyICogeCAtIGNvbnRyb2xYO1xuICAgICAgICBjb250cm9sWSA9IDIgKiB5IC0gY29udHJvbFk7XG5cbiAgICAgICAgeCA9IHRlbXBYO1xuICAgICAgICB5ID0gdGVtcFk7XG4gICAgICAgIGJvdW5kcy5hZGQoY29udHJvbFgsIGNvbnRyb2xZKTtcbiAgICAgICAgYm91bmRzLmFkZCh0ZW1wWCwgdGVtcFkpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYSc6XG4gICAgICAgIGJvdW5kQXJjKHgsIHksIFtcbiAgICAgICAgICBjdXJyZW50WzFdLFxuICAgICAgICAgIGN1cnJlbnRbMl0sXG4gICAgICAgICAgY3VycmVudFszXSxcbiAgICAgICAgICBjdXJyZW50WzRdLFxuICAgICAgICAgIGN1cnJlbnRbNV0sXG4gICAgICAgICAgY3VycmVudFs2XSArIHgsXG4gICAgICAgICAgY3VycmVudFs3XSArIHlcbiAgICAgICAgXSwgYm91bmRzKTtcbiAgICAgICAgeCArPSBjdXJyZW50WzZdO1xuICAgICAgICB5ICs9IGN1cnJlbnRbN107XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdBJzpcbiAgICAgICAgYm91bmRBcmMoeCwgeSwgW1xuICAgICAgICAgIGN1cnJlbnRbMV0sXG4gICAgICAgICAgY3VycmVudFsyXSxcbiAgICAgICAgICBjdXJyZW50WzNdLFxuICAgICAgICAgIGN1cnJlbnRbNF0sXG4gICAgICAgICAgY3VycmVudFs1XSxcbiAgICAgICAgICBjdXJyZW50WzZdLFxuICAgICAgICAgIGN1cnJlbnRbN11cbiAgICAgICAgXSwgYm91bmRzKTtcbiAgICAgICAgeCA9IGN1cnJlbnRbNl07XG4gICAgICAgIHkgPSBjdXJyZW50WzddO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAneic6XG4gICAgICBjYXNlICdaJzpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHByZXZpb3VzID0gY3VycmVudDtcbiAgfVxuICByZXR1cm4gYm91bmRzO1xufVxuXG5mdW5jdGlvbiBhcmVhKGl0ZW1zKSB7XG4gIHZhciBvID0gaXRlbXNbMF07XG4gIHZhciBhcmVhID0gZDMuc3ZnLmFyZWEoKVxuICAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcbiAgICAueTEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuICAgIC55MChmdW5jdGlvbihkKSB7IHJldHVybiBkLnkgKyBkLmhlaWdodDsgfSk7XG4gIGlmIChvLmludGVycG9sYXRlKSBhcmVhLmludGVycG9sYXRlKG8uaW50ZXJwb2xhdGUpO1xuICBpZiAoby50ZW5zaW9uICE9IG51bGwpIGFyZWEudGVuc2lvbihvLnRlbnNpb24pO1xuICByZXR1cm4gYXJlYShpdGVtcyk7XG59XG5cbmZ1bmN0aW9uIGxpbmUoaXRlbXMpIHtcbiAgdmFyIG8gPSBpdGVtc1swXTtcbiAgdmFyIGxpbmUgPSBkMy5zdmcubGluZSgpXG4gICAueChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG4gICAueShmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pO1xuICBpZiAoby5pbnRlcnBvbGF0ZSkgbGluZS5pbnRlcnBvbGF0ZShvLmludGVycG9sYXRlKTtcbiAgaWYgKG8udGVuc2lvbiAhPSBudWxsKSBsaW5lLnRlbnNpb24oby50ZW5zaW9uKTtcbiAgcmV0dXJuIGxpbmUoaXRlbXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcGFyc2U6ICBwYXJzZSxcbiAgcmVuZGVyOiByZW5kZXIsXG4gIGJvdW5kczogYm91bmRzLFxuICBhcmVhOiAgIGFyZWEsXG4gIGxpbmU6ICAgbGluZVxufTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyk7XG5cbnZhciBoYW5kbGVyID0gZnVuY3Rpb24oZWwsIG1vZGVsKSB7XG4gIHRoaXMuX2FjdGl2ZSA9IG51bGw7XG4gIHRoaXMuX2hhbmRsZXJzID0ge307XG4gIGlmIChlbCkgdGhpcy5pbml0aWFsaXplKGVsKTtcbiAgaWYgKG1vZGVsKSB0aGlzLm1vZGVsKG1vZGVsKTtcbn07XG5cbmZ1bmN0aW9uIHN2Z0hhbmRsZXIoaGFuZGxlcikge1xuICB2YXIgdGhhdCA9IHRoaXM7XG4gIHJldHVybiBmdW5jdGlvbihldnQpIHtcbiAgICB2YXIgdGFyZ2V0ID0gZXZ0LnRhcmdldCxcbiAgICAgICAgaXRlbSA9IHRhcmdldC5fX2RhdGFfXztcblxuICAgIGlmIChpdGVtKSBpdGVtID0gaXRlbS5tYXJrID8gaXRlbSA6IGl0ZW1bMF07XG4gICAgaGFuZGxlci5jYWxsKHRoYXQuX29iaiwgZXZ0LCBpdGVtKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gZXZlbnROYW1lKG5hbWUpIHtcbiAgdmFyIGkgPSBuYW1lLmluZGV4T2YoXCIuXCIpO1xuICByZXR1cm4gaSA8IDAgPyBuYW1lIDogbmFtZS5zbGljZSgwLGkpO1xufVxuXG52YXIgcHJvdG90eXBlID0gaGFuZGxlci5wcm90b3R5cGU7XG5cbnByb3RvdHlwZS5pbml0aWFsaXplID0gZnVuY3Rpb24oZWwsIHBhZCwgb2JqKSB7XG4gIHRoaXMuX2VsID0gZDMuc2VsZWN0KGVsKS5ub2RlKCk7XG4gIHRoaXMuX3N2ZyA9IGQzLnNlbGVjdChlbCkuc2VsZWN0KFwic3ZnLm1hcmtzXCIpLm5vZGUoKTtcbiAgdGhpcy5fcGFkZGluZyA9IHBhZDtcbiAgdGhpcy5fb2JqID0gb2JqIHx8IG51bGw7XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLnBhZGRpbmcgPSBmdW5jdGlvbihwYWQpIHtcbiAgdGhpcy5fcGFkZGluZyA9IHBhZDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUubW9kZWwgPSBmdW5jdGlvbihtb2RlbCkge1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9tb2RlbDtcbiAgdGhpcy5fbW9kZWwgPSBtb2RlbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUuaGFuZGxlcnMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGggPSB0aGlzLl9oYW5kbGVycztcbiAgcmV0dXJuIGRsLmtleXMoaCkucmVkdWNlKGZ1bmN0aW9uKGEsIGspIHtcbiAgICByZXR1cm4gaFtrXS5yZWR1Y2UoZnVuY3Rpb24oYSwgeCkgeyByZXR1cm4gKGEucHVzaCh4KSwgYSk7IH0sIGEpO1xuICB9LCBbXSk7XG59O1xuXG4vLyBhZGQgYW4gZXZlbnQgaGFuZGxlclxucHJvdG90eXBlLm9uID0gZnVuY3Rpb24odHlwZSwgaGFuZGxlcikge1xuICB2YXIgbmFtZSA9IGV2ZW50TmFtZSh0eXBlKSxcbiAgICAgIGggPSB0aGlzLl9oYW5kbGVycyxcbiAgICAgIGRvbSA9IGQzLnNlbGVjdCh0aGlzLl9zdmcpLm5vZGUoKTtcbiAgICAgIFxuICB2YXIgeCA9IHtcbiAgICB0eXBlOiB0eXBlLFxuICAgIGhhbmRsZXI6IGhhbmRsZXIsXG4gICAgc3ZnOiBzdmdIYW5kbGVyLmNhbGwodGhpcywgaGFuZGxlcilcbiAgfTtcbiAgaCA9IGhbbmFtZV0gfHwgKGhbbmFtZV0gPSBbXSk7XG4gIGgucHVzaCh4KTtcblxuICBkb20uYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCB4LnN2Zyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gcmVtb3ZlIGFuIGV2ZW50IGhhbmRsZXJcbnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbih0eXBlLCBoYW5kbGVyKSB7XG4gIHZhciBuYW1lID0gZXZlbnROYW1lKHR5cGUpLFxuICAgICAgaCA9IHRoaXMuX2hhbmRsZXJzW25hbWVdLFxuICAgICAgZG9tID0gZDMuc2VsZWN0KHRoaXMuX3N2Zykubm9kZSgpO1xuICBpZiAoIWgpIHJldHVybjtcbiAgZm9yICh2YXIgaT1oLmxlbmd0aDsgLS1pPj0wOykge1xuICAgIGlmIChoW2ldLnR5cGUgIT09IHR5cGUpIGNvbnRpbnVlO1xuICAgIGlmICghaGFuZGxlciB8fCBoW2ldLmhhbmRsZXIgPT09IGhhbmRsZXIpIHtcbiAgICAgIGRvbS5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGhbaV0uc3ZnKTtcbiAgICAgIGguc3BsaWNlKGksIDEpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaGFuZGxlcjsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgbWFya3MgPSByZXF1aXJlKCcuL21hcmtzJyk7XG5cbnZhciByZW5kZXJlciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9zdmcgPSBudWxsO1xuICB0aGlzLl9jdHggPSBudWxsO1xuICB0aGlzLl9lbCA9IG51bGw7XG4gIHRoaXMuX2RlZnMgPSB7XG4gICAgZ3JhZGllbnQ6IHt9LFxuICAgIGNsaXBwaW5nOiB7fVxuICB9O1xufTtcblxudmFyIHByb3RvdHlwZSA9IHJlbmRlcmVyLnByb3RvdHlwZTtcblxucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbihlbCwgd2lkdGgsIGhlaWdodCwgcGFkKSB7XG4gIHRoaXMuX2VsID0gZWw7XG5cbiAgLy8gcmVtb3ZlIGFueSBleGlzdGluZyBzdmcgZWxlbWVudFxuICBkMy5zZWxlY3QoZWwpLnNlbGVjdChcInN2Zy5tYXJrc1wiKS5yZW1vdmUoKTtcblxuICAvLyBjcmVhdGUgc3ZnIGVsZW1lbnQgYW5kIGluaXRpYWxpemUgYXR0cmlidXRlc1xuICB0aGlzLl9zdmcgPSBkMy5zZWxlY3QoZWwpXG4gICAgLmFwcGVuZChcInN2Z1wiKVxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtYXJrc1wiKTtcbiAgXG4gIC8vIHNldCB0aGUgc3ZnIHJvb3QgZ3JvdXBcbiAgdGhpcy5fY3R4ID0gdGhpcy5fc3ZnLmFwcGVuZChcImdcIik7XG4gIFxuICByZXR1cm4gdGhpcy5yZXNpemUod2lkdGgsIGhlaWdodCwgcGFkKTtcbn07XG5cbnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBwYWQpIHtcbiAgdGhpcy5fd2lkdGggPSB3aWR0aDtcbiAgdGhpcy5faGVpZ2h0ID0gaGVpZ2h0O1xuICB0aGlzLl9wYWRkaW5nID0gcGFkO1xuICBcbiAgdGhpcy5fc3ZnXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIHBhZC5sZWZ0ICsgcGFkLnJpZ2h0KVxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIHBhZC50b3AgKyBwYWQuYm90dG9tKTtcbiAgICBcbiAgdGhpcy5fY3R4XG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIrcGFkLmxlZnQrXCIsXCIrcGFkLnRvcCtcIilcIik7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUuY29udGV4dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5fY3R4O1xufTtcblxucHJvdG90eXBlLmVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuX2VsO1xufTtcblxucHJvdG90eXBlLnVwZGF0ZURlZnMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHN2ZyA9IHRoaXMuX3N2ZyxcbiAgICAgIGFsbCA9IHRoaXMuX2RlZnMsXG4gICAgICBkZ3JhZCA9IGRsLmtleXMoYWxsLmdyYWRpZW50KSxcbiAgICAgIGRjbGlwID0gZGwua2V5cyhhbGwuY2xpcHBpbmcpLFxuICAgICAgZGVmcyA9IHN2Zy5zZWxlY3QoXCJkZWZzXCIpLCBncmFkLCBjbGlwO1xuXG4gIC8vIGdldCBvciBjcmVhdGUgc3ZnIGRlZnMgYmxvY2tcbiAgaWYgKGRncmFkLmxlbmd0aD09PTAgJiYgZGNsaXAubGVuZ3RoPT0wKSB7IGRlZnMucmVtb3ZlKCk7IHJldHVybjsgfVxuICBpZiAoZGVmcy5lbXB0eSgpKSBkZWZzID0gc3ZnLmluc2VydChcImRlZnNcIiwgXCI6Zmlyc3QtY2hpbGRcIik7XG4gIFxuICBncmFkID0gZGVmcy5zZWxlY3RBbGwoXCJsaW5lYXJHcmFkaWVudFwiKS5kYXRhKGRncmFkLCBkbC5pZGVudGl0eSk7XG4gIGdyYWQuZW50ZXIoKS5hcHBlbmQoXCJsaW5lYXJHcmFkaWVudFwiKS5hdHRyKFwiaWRcIiwgZGwuaWRlbnRpdHkpO1xuICBncmFkLmV4aXQoKS5yZW1vdmUoKTtcbiAgZ3JhZC5lYWNoKGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGRlZiA9IGFsbC5ncmFkaWVudFtpZF0sXG4gICAgICAgIGdyZCA9IGQzLnNlbGVjdCh0aGlzKTtcblxuICAgIC8vIHNldCBncmFkaWVudCBjb29yZGluYXRlc1xuICAgIGdyZC5hdHRyKHt4MTogZGVmLngxLCB4MjogZGVmLngyLCB5MTogZGVmLnkxLCB5MjogZGVmLnkyfSk7XG5cbiAgICAvLyBzZXQgZ3JhZGllbnQgc3RvcHNcbiAgICBzdG9wID0gZ3JkLnNlbGVjdEFsbChcInN0b3BcIikuZGF0YShkZWYuc3RvcHMpO1xuICAgIHN0b3AuZW50ZXIoKS5hcHBlbmQoXCJzdG9wXCIpO1xuICAgIHN0b3AuZXhpdCgpLnJlbW92ZSgpO1xuICAgIHN0b3AuYXR0cihcIm9mZnNldFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLm9mZnNldDsgfSlcbiAgICAgICAgLmF0dHIoXCJzdG9wLWNvbG9yXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sb3I7IH0pO1xuICB9KTtcbiAgXG4gIGNsaXAgPSBkZWZzLnNlbGVjdEFsbChcImNsaXBQYXRoXCIpLmRhdGEoZGNsaXAsIGRsLmlkZW50aXR5KTtcbiAgY2xpcC5lbnRlcigpLmFwcGVuZChcImNsaXBQYXRoXCIpLmF0dHIoXCJpZFwiLCBkbC5pZGVudGl0eSk7XG4gIGNsaXAuZXhpdCgpLnJlbW92ZSgpO1xuICBjbGlwLmVhY2goZnVuY3Rpb24oaWQpIHtcbiAgICB2YXIgZGVmID0gYWxsLmNsaXBwaW5nW2lkXSxcbiAgICAgICAgY3IgPSBkMy5zZWxlY3QodGhpcykuc2VsZWN0QWxsKFwicmVjdFwiKS5kYXRhKFsxXSk7XG4gICAgY3IuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpO1xuICAgIGNyLmF0dHIoXCJ4XCIsIDApXG4gICAgICAuYXR0cihcInlcIiwgMClcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgZGVmLndpZHRoKVxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgZGVmLmhlaWdodCk7XG4gIH0pO1xufTtcblxucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKHNjZW5lLCBpdGVtcykge1xuICBtYXJrcy5jdXJyZW50ID0gdGhpcztcblxuICBpZiAoaXRlbXMpIHtcbiAgICB0aGlzLnJlbmRlckl0ZW1zKGRsLmFycmF5KGl0ZW1zKSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5kcmF3KHRoaXMuX2N0eCwgc2NlbmUsIC0xKTtcbiAgfVxuICB0aGlzLnVwZGF0ZURlZnMoKTtcblxuIGRlbGV0ZSBtYXJrcy5jdXJyZW50O1xufTtcblxucHJvdG90eXBlLnJlbmRlckl0ZW1zID0gZnVuY3Rpb24oaXRlbXMpIHtcbiAgdmFyIGl0ZW0sIG5vZGUsIHR5cGUsIG5lc3QsIGksIG47XG5cbiAgZm9yIChpPTAsIG49aXRlbXMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICBub2RlID0gaXRlbS5fc3ZnO1xuICAgIHR5cGUgPSBpdGVtLm1hcmsubWFya3R5cGU7XG5cbiAgICBpdGVtID0gbWFya3MubmVzdGVkW3R5cGVdID8gaXRlbS5tYXJrLml0ZW1zIDogaXRlbTtcbiAgICBtYXJrcy51cGRhdGVbdHlwZV0uY2FsbChub2RlLCBpdGVtKTtcbiAgICBtYXJrcy5zdHlsZS5jYWxsKG5vZGUsIGl0ZW0pO1xuICB9XG59XG5cbnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY3R4LCBzY2VuZSwgaW5kZXgpIHtcbiAgdmFyIG1hcmt0eXBlID0gc2NlbmUubWFya3R5cGUsXG4gICAgICByZW5kZXJlciA9IG1hcmtzLmRyYXdbbWFya3R5cGVdO1xuICByZW5kZXJlci5jYWxsKHRoaXMsIGN0eCwgc2NlbmUsIGluZGV4KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVuZGVyZXI7IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgY29uZmlnID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9jb25maWcnKTtcblxuZnVuY3Rpb24geChvKSAgICAgeyByZXR1cm4gby54IHx8IDA7IH1cbmZ1bmN0aW9uIHkobykgICAgIHsgcmV0dXJuIG8ueSB8fCAwOyB9XG5mdW5jdGlvbiB5aChvKSAgICB7IHJldHVybiBvLnkgKyBvLmhlaWdodCB8fCAwOyB9XG5mdW5jdGlvbiBrZXkobykgICB7IHJldHVybiBvLmtleTsgfVxuZnVuY3Rpb24gc2l6ZShvKSAgeyByZXR1cm4gby5zaXplPT1udWxsID8gMTAwIDogby5zaXplOyB9XG5mdW5jdGlvbiBzaGFwZShvKSB7IHJldHVybiBvLnNoYXBlIHx8IFwiY2lyY2xlXCI7IH1cbiAgICBcbnZhciBhcmNfcGF0aCAgICA9IGQzLnN2Zy5hcmMoKSxcbiAgICBhcmVhX3BhdGggICA9IGQzLnN2Zy5hcmVhKCkueCh4KS55MSh5KS55MCh5aCksXG4gICAgbGluZV9wYXRoICAgPSBkMy5zdmcubGluZSgpLngoeCkueSh5KSxcbiAgICBzeW1ib2xfcGF0aCA9IGQzLnN2Zy5zeW1ib2woKS50eXBlKHNoYXBlKS5zaXplKHNpemUpO1xuXG52YXIgbWFya19pZCA9IDAsXG4gICAgY2xpcF9pZCA9IDA7XG5cbnZhciB0ZXh0QWxpZ24gPSB7XG4gIFwibGVmdFwiOiAgIFwic3RhcnRcIixcbiAgXCJjZW50ZXJcIjogXCJtaWRkbGVcIixcbiAgXCJyaWdodFwiOiAgXCJlbmRcIlxufTtcblxudmFyIHN0eWxlcyA9IHtcbiAgXCJmaWxsXCI6ICAgICAgICAgICAgIFwiZmlsbFwiLFxuICBcImZpbGxPcGFjaXR5XCI6ICAgICAgXCJmaWxsLW9wYWNpdHlcIixcbiAgXCJzdHJva2VcIjogICAgICAgICAgIFwic3Ryb2tlXCIsXG4gIFwic3Ryb2tlV2lkdGhcIjogICAgICBcInN0cm9rZS13aWR0aFwiLFxuICBcInN0cm9rZU9wYWNpdHlcIjogICAgXCJzdHJva2Utb3BhY2l0eVwiLFxuICBcInN0cm9rZUNhcFwiOiAgICAgICAgXCJzdHJva2UtbGluZWNhcFwiLFxuICBcInN0cm9rZURhc2hcIjogICAgICAgXCJzdHJva2UtZGFzaGFycmF5XCIsXG4gIFwic3Ryb2tlRGFzaE9mZnNldFwiOiBcInN0cm9rZS1kYXNob2Zmc2V0XCIsXG4gIFwib3BhY2l0eVwiOiAgICAgICAgICBcIm9wYWNpdHlcIlxufTtcbnZhciBzdHlsZVByb3BzID0gZGwua2V5cyhzdHlsZXMpO1xuXG5mdW5jdGlvbiBzdHlsZShkKSB7XG4gIHZhciBpLCBuLCBwcm9wLCBuYW1lLCB2YWx1ZSxcbiAgICAgIG8gPSBkLm1hcmsgPyBkIDogZC5sZW5ndGggPyBkWzBdIDogbnVsbDtcbiAgaWYgKG8gPT09IG51bGwpIHJldHVybjtcblxuICBmb3IgKGk9MCwgbj1zdHlsZVByb3BzLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICBwcm9wID0gc3R5bGVQcm9wc1tpXTtcbiAgICBuYW1lID0gc3R5bGVzW3Byb3BdO1xuICAgIHZhbHVlID0gb1twcm9wXTtcblxuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBpZiAobmFtZSA9PT0gXCJmaWxsXCIpIHRoaXMuc3R5bGUuc2V0UHJvcGVydHkobmFtZSwgXCJub25lXCIsIG51bGwpO1xuICAgICAgZWxzZSB0aGlzLnN0eWxlLnJlbW92ZVByb3BlcnR5KG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodmFsdWUuaWQpIHtcbiAgICAgICAgLy8gZW5zdXJlIGRlZmluaXRpb24gaXMgaW5jbHVkZWRcbiAgICAgICAgbWFya3MuY3VycmVudC5fZGVmcy5ncmFkaWVudFt2YWx1ZS5pZF0gPSB2YWx1ZTtcbiAgICAgICAgdmFsdWUgPSBcInVybCgjXCIgKyB2YWx1ZS5pZCArIFwiKVwiO1xuICAgICAgfVxuICAgICAgdGhpcy5zdHlsZS5zZXRQcm9wZXJ0eShuYW1lLCB2YWx1ZStcIlwiLCBudWxsKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYXJjKG8pIHtcbiAgdmFyIHggPSBvLnggfHwgMCxcbiAgICAgIHkgPSBvLnkgfHwgMDtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIreCtcIixcIit5K1wiKVwiKTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJkXCIsIGFyY19wYXRoKG8pKTtcbn1cblxuZnVuY3Rpb24gYXJlYShpdGVtcykge1xuICBpZiAoIWl0ZW1zLmxlbmd0aCkgcmV0dXJuO1xuICB2YXIgbyA9IGl0ZW1zWzBdO1xuICBhcmVhX3BhdGhcbiAgICAuaW50ZXJwb2xhdGUoby5pbnRlcnBvbGF0ZSB8fCBcImxpbmVhclwiKVxuICAgIC50ZW5zaW9uKG8udGVuc2lvbiA9PSBudWxsID8gMC43IDogby50ZW5zaW9uKTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJkXCIsIGFyZWFfcGF0aChpdGVtcykpO1xufVxuXG5mdW5jdGlvbiBsaW5lKGl0ZW1zKSB7XG4gIGlmICghaXRlbXMubGVuZ3RoKSByZXR1cm47XG4gIHZhciBvID0gaXRlbXNbMF07XG4gIGxpbmVfcGF0aFxuICAgIC5pbnRlcnBvbGF0ZShvLmludGVycG9sYXRlIHx8IFwibGluZWFyXCIpXG4gICAgLnRlbnNpb24oby50ZW5zaW9uID09IG51bGwgPyAwLjcgOiBvLnRlbnNpb24pO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcImRcIiwgbGluZV9wYXRoKGl0ZW1zKSk7XG59XG5cbmZ1bmN0aW9uIHBhdGgobykge1xuICB2YXIgeCA9IG8ueCB8fCAwLFxuICAgICAgeSA9IG8ueSB8fCAwO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIit4K1wiLFwiK3krXCIpXCIpO1xuICBpZiAoby5wYXRoICE9IG51bGwpIHRoaXMuc2V0QXR0cmlidXRlKFwiZFwiLCBvLnBhdGgpO1xufVxuXG5mdW5jdGlvbiByZWN0KG8pIHtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ4XCIsIG8ueCB8fCAwKTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ5XCIsIG8ueSB8fCAwKTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCBvLndpZHRoIHx8IDApO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCBvLmhlaWdodCB8fCAwKTtcbn1cblxuZnVuY3Rpb24gcnVsZShvKSB7XG4gIHZhciB4MSA9IG8ueCB8fCAwLFxuICAgICAgeTEgPSBvLnkgfHwgMDtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ4MVwiLCB4MSk7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwieTFcIiwgeTEpO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcIngyXCIsIG8ueDIgIT0gbnVsbCA/IG8ueDIgOiB4MSk7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwieTJcIiwgby55MiAhPSBudWxsID8gby55MiA6IHkxKTtcbn1cblxuZnVuY3Rpb24gc3ltYm9sKG8pIHtcbiAgdmFyIHggPSBvLnggfHwgMCxcbiAgICAgIHkgPSBvLnkgfHwgMDtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIreCtcIixcIit5K1wiKVwiKTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJkXCIsIHN5bWJvbF9wYXRoKG8pKTtcbn1cblxuZnVuY3Rpb24gaW1hZ2Uobykge1xuICB2YXIgdyA9IG8ud2lkdGggfHwgKG8uaW1hZ2UgJiYgby5pbWFnZS53aWR0aCkgfHwgMCxcbiAgICAgIGggPSBvLmhlaWdodCB8fCAoby5pbWFnZSAmJiBvLmltYWdlLmhlaWdodCkgfHwgMCxcbiAgICAgIHggPSBvLnggLSAoby5hbGlnbiA9PT0gXCJjZW50ZXJcIlxuICAgICAgICA/IHcvMiA6IChvLmFsaWduID09PSBcInJpZ2h0XCIgPyB3IDogMCkpLFxuICAgICAgeSA9IG8ueSAtIChvLmJhc2VsaW5lID09PSBcIm1pZGRsZVwiXG4gICAgICAgID8gaC8yIDogKG8uYmFzZWxpbmUgPT09IFwiYm90dG9tXCIgPyBoIDogMCkpLFxuICAgICAgdXJsID0gY29uZmlnLmJhc2VVUkwgKyBvLnVybDtcbiAgXG4gIHRoaXMuc2V0QXR0cmlidXRlTlMoXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIsIFwiaHJlZlwiLCB1cmwpO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcInhcIiwgeCk7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwieVwiLCB5KTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCB3KTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgaCk7XG59XG4gIFxuZnVuY3Rpb24gZm9udFN0cmluZyhvKSB7XG4gIHJldHVybiAoby5mb250U3R5bGUgPyBvLmZvbnRTdHlsZSArIFwiIFwiIDogXCJcIilcbiAgICArIChvLmZvbnRWYXJpYW50ID8gby5mb250VmFyaWFudCArIFwiIFwiIDogXCJcIilcbiAgICArIChvLmZvbnRXZWlnaHQgPyBvLmZvbnRXZWlnaHQgKyBcIiBcIiA6IFwiXCIpXG4gICAgKyAoby5mb250U2l6ZSAhPSBudWxsID8gby5mb250U2l6ZSA6IGNvbmZpZy5yZW5kZXIuZm9udFNpemUpICsgXCJweCBcIlxuICAgICsgKG8uZm9udCB8fCBjb25maWcucmVuZGVyLmZvbnQpO1xufVxuXG5mdW5jdGlvbiB0ZXh0KG8pIHtcbiAgdmFyIHggPSBvLnggfHwgMCxcbiAgICAgIHkgPSBvLnkgfHwgMCxcbiAgICAgIGR4ID0gby5keCB8fCAwLFxuICAgICAgZHkgPSBvLmR5IHx8IDAsXG4gICAgICBhID0gby5hbmdsZSB8fCAwLFxuICAgICAgciA9IG8ucmFkaXVzIHx8IDAsXG4gICAgICBhbGlnbiA9IHRleHRBbGlnbltvLmFsaWduIHx8IFwibGVmdFwiXSxcbiAgICAgIGJhc2UgPSBvLmJhc2VsaW5lPT09XCJ0b3BcIiA/IFwiLjllbVwiXG4gICAgICAgICAgIDogby5iYXNlbGluZT09PVwibWlkZGxlXCIgPyBcIi4zNWVtXCIgOiAwO1xuXG4gIGlmIChyKSB7XG4gICAgdmFyIHQgPSAoby50aGV0YSB8fCAwKSAtIE1hdGguUEkvMjtcbiAgICB4ICs9IHIgKiBNYXRoLmNvcyh0KTtcbiAgICB5ICs9IHIgKiBNYXRoLnNpbih0KTtcbiAgfVxuXG4gIHRoaXMuc2V0QXR0cmlidXRlKFwieFwiLCB4ICsgZHgpO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcInlcIiwgeSArIGR5KTtcbiAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ0ZXh0LWFuY2hvclwiLCBhbGlnbik7XG4gIFxuICBpZiAoYSkgdGhpcy5zZXRBdHRyaWJ1dGUoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoXCIrYStcIiBcIit4K1wiLFwiK3krXCIpXCIpO1xuICBlbHNlIHRoaXMucmVtb3ZlQXR0cmlidXRlKFwidHJhbnNmb3JtXCIpO1xuICBcbiAgaWYgKGJhc2UpIHRoaXMuc2V0QXR0cmlidXRlKFwiZHlcIiwgYmFzZSk7XG4gIGVsc2UgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoXCJkeVwiKTtcbiAgXG4gIHRoaXMudGV4dENvbnRlbnQgPSBvLnRleHQ7XG4gIHRoaXMuc3R5bGUuc2V0UHJvcGVydHkoXCJmb250XCIsIGZvbnRTdHJpbmcobyksIG51bGwpO1xufVxuXG5mdW5jdGlvbiBncm91cChvKSB7XG4gIHZhciB4ID0gby54IHx8IDAsXG4gICAgICB5ID0gby55IHx8IDA7XG4gIHRoaXMuc2V0QXR0cmlidXRlKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiK3grXCIsXCIreStcIilcIik7XG5cbiAgaWYgKG8uY2xpcCkge1xuICAgIHZhciBjID0ge3dpZHRoOiBvLndpZHRoIHx8IDAsIGhlaWdodDogby5oZWlnaHQgfHwgMH0sXG4gICAgICAgIGlkID0gby5jbGlwX2lkIHx8IChvLmNsaXBfaWQgPSBcImNsaXBcIiArIGNsaXBfaWQrKyk7XG4gICAgbWFya3MuY3VycmVudC5fZGVmcy5jbGlwcGluZ1tpZF0gPSBjO1xuICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiY2xpcC1wYXRoXCIsIFwidXJsKCNcIitpZCtcIilcIik7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ3JvdXBfYmcobykge1xuICB2YXIgdyA9IG8ud2lkdGggfHwgMCxcbiAgICAgIGggPSBvLmhlaWdodCB8fCAwO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIHcpO1xuICB0aGlzLnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCBoKTtcbn1cblxuZnVuY3Rpb24gY3NzQ2xhc3MoZGVmKSB7XG4gIHZhciBjbHMgPSBcInR5cGUtXCIgKyBkZWYudHlwZTtcbiAgaWYgKGRlZi5uYW1lKSBjbHMgKz0gXCIgXCIgKyBkZWYubmFtZTtcbiAgcmV0dXJuIGNscztcbn1cblxuZnVuY3Rpb24gZHJhdyh0YWcsIGF0dHIsIG5lc3QpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGcsIHNjZW5lLCBpbmRleCkge1xuICAgIGRyYXdNYXJrKGcsIHNjZW5lLCBpbmRleCwgXCJtYXJrX1wiLCB0YWcsIGF0dHIsIG5lc3QpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBkcmF3TWFyayhnLCBzY2VuZSwgaW5kZXgsIHByZWZpeCwgdGFnLCBhdHRyLCBuZXN0KSB7XG4gIHZhciBkYXRhID0gbmVzdCA/IFtzY2VuZS5pdGVtc10gOiBzY2VuZS5pdGVtcyxcbiAgICAgIGV2dHMgPSBzY2VuZS5pbnRlcmFjdGl2ZT09PWZhbHNlID8gXCJub25lXCIgOiBudWxsLFxuICAgICAgZ3JwcyA9IGcubm9kZSgpLmNoaWxkTm9kZXMsXG4gICAgICBub3RHID0gKHRhZyAhPT0gXCJnXCIpLFxuICAgICAgcCA9IChwID0gZ3Jwc1tpbmRleCsxXSkgLy8gKzEgdG8gc2tpcCBncm91cCBiYWNrZ3JvdW5kIHJlY3RcbiAgICAgICAgPyBkMy5zZWxlY3QocClcbiAgICAgICAgOiBnLmFwcGVuZChcImdcIilcbiAgICAgICAgICAgLmF0dHIoXCJpZFwiLCBcImdcIisoKyttYXJrX2lkKSlcbiAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBjc3NDbGFzcyhzY2VuZS5kZWYpKTtcblxuICB2YXIgaWQgPSBwLmF0dHIoXCJpZFwiKSxcbiAgICAgIHMgPSBcIiNcIiArIGlkICsgXCIgPiBcIiArIHRhZyxcbiAgICAgIG0gPSBwLnNlbGVjdEFsbChzKS5kYXRhKGRhdGEpLFxuICAgICAgZSA9IG0uZW50ZXIoKS5hcHBlbmQodGFnKTtcblxuICBpZiAobm90Rykge1xuICAgIHAuc3R5bGUoXCJwb2ludGVyLWV2ZW50c1wiLCBldnRzKTtcbiAgICBlLmVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgaWYgKGQubWFyaykgZC5fc3ZnID0gdGhpcztcbiAgICAgIGVsc2UgaWYgKGQubGVuZ3RoKSBkWzBdLl9zdmcgPSB0aGlzO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGUuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIixcImJhY2tncm91bmRcIikuc3R5bGUoXCJwb2ludGVyLWV2ZW50c1wiLGV2dHMpO1xuICB9XG4gIFxuICBtLmV4aXQoKS5yZW1vdmUoKTtcbiAgbS5lYWNoKGF0dHIpO1xuICBpZiAobm90RykgbS5lYWNoKHN0eWxlKTtcbiAgZWxzZSBwLnNlbGVjdEFsbChzK1wiID4gcmVjdC5iYWNrZ3JvdW5kXCIpLmVhY2goZ3JvdXBfYmcpLmVhY2goc3R5bGUpO1xuICBcbiAgcmV0dXJuIHA7XG59XG5cbmZ1bmN0aW9uIGRyYXdHcm91cChnLCBzY2VuZSwgaW5kZXgsIHByZWZpeCkgeyAgICBcbiAgdmFyIHAgPSBkcmF3TWFyayhnLCBzY2VuZSwgaW5kZXgsIHByZWZpeCB8fCBcImdyb3VwX1wiLCBcImdcIiwgZ3JvdXApLFxuICAgICAgYyA9IHAubm9kZSgpLmNoaWxkTm9kZXMsIG4gPSBjLmxlbmd0aCwgaSwgaiwgbTtcbiAgXG4gIGZvciAoaT0wOyBpPG47ICsraSkge1xuICAgIHZhciBpdGVtcyA9IGNbaV0uX19kYXRhX18uaXRlbXMsXG4gICAgICAgIGxlZ2VuZHMgPSBjW2ldLl9fZGF0YV9fLmxlZ2VuZEl0ZW1zIHx8IFtdLFxuICAgICAgICBheGVzID0gY1tpXS5fX2RhdGFfXy5heGlzSXRlbXMgfHwgW10sXG4gICAgICAgIHNlbCA9IGQzLnNlbGVjdChjW2ldKSxcbiAgICAgICAgaWR4ID0gMDtcblxuICAgIGZvciAoaj0wLCBtPWF4ZXMubGVuZ3RoOyBqPG07ICsraikge1xuICAgICAgaWYgKGF4ZXNbal0uZGVmLmxheWVyID09PSBcImJhY2tcIikge1xuICAgICAgICBkcmF3R3JvdXAuY2FsbCh0aGlzLCBzZWwsIGF4ZXNbal0sIGlkeCsrLCBcImF4aXNfXCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGo9MCwgbT1pdGVtcy5sZW5ndGg7IGo8bTsgKytqKSB7XG4gICAgICB0aGlzLmRyYXcoc2VsLCBpdGVtc1tqXSwgaWR4KyspO1xuICAgIH1cbiAgICBmb3IgKGo9MCwgbT1heGVzLmxlbmd0aDsgajxtOyArK2opIHtcbiAgICAgIGlmIChheGVzW2pdLmRlZi5sYXllciAhPT0gXCJiYWNrXCIpIHtcbiAgICAgICAgZHJhd0dyb3VwLmNhbGwodGhpcywgc2VsLCBheGVzW2pdLCBpZHgrKywgXCJheGlzX1wiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChqPTAsIG09bGVnZW5kcy5sZW5ndGg7IGo8bTsgKytqKSB7XG4gICAgICBkcmF3R3JvdXAuY2FsbCh0aGlzLCBzZWwsIGxlZ2VuZHNbal0sIGlkeCsrLCBcImxlZ2VuZF9cIik7XG4gICAgfVxuICB9XG59XG5cbnZhciBtYXJrcyA9IG1vZHVsZS5leHBvcnRzID0ge1xuICB1cGRhdGU6IHtcbiAgICBncm91cDogICByZWN0LFxuICAgIGFyZWE6ICAgIGFyZWEsXG4gICAgbGluZTogICAgbGluZSxcbiAgICBhcmM6ICAgICBhcmMsXG4gICAgcGF0aDogICAgcGF0aCxcbiAgICBzeW1ib2w6ICBzeW1ib2wsXG4gICAgcmVjdDogICAgcmVjdCxcbiAgICBydWxlOiAgICBydWxlLFxuICAgIHRleHQ6ICAgIHRleHQsXG4gICAgaW1hZ2U6ICAgaW1hZ2VcbiAgfSxcbiAgbmVzdGVkOiB7XG4gICAgXCJhcmVhXCI6IHRydWUsXG4gICAgXCJsaW5lXCI6IHRydWVcbiAgfSxcbiAgc3R5bGU6IHN0eWxlLFxuICBkcmF3OiB7XG4gICAgZ3JvdXA6ICAgZHJhd0dyb3VwLFxuICAgIGFyZWE6ICAgIGRyYXcoXCJwYXRoXCIsIGFyZWEsIHRydWUpLFxuICAgIGxpbmU6ICAgIGRyYXcoXCJwYXRoXCIsIGxpbmUsIHRydWUpLFxuICAgIGFyYzogICAgIGRyYXcoXCJwYXRoXCIsIGFyYyksXG4gICAgcGF0aDogICAgZHJhdyhcInBhdGhcIiwgcGF0aCksXG4gICAgc3ltYm9sOiAgZHJhdyhcInBhdGhcIiwgc3ltYm9sKSxcbiAgICByZWN0OiAgICBkcmF3KFwicmVjdFwiLCByZWN0KSxcbiAgICBydWxlOiAgICBkcmF3KFwibGluZVwiLCBydWxlKSxcbiAgICB0ZXh0OiAgICBkcmF3KFwidGV4dFwiLCB0ZXh0KSxcbiAgICBpbWFnZTogICBkcmF3KFwiaW1hZ2VcIiwgaW1hZ2UpLFxuICAgIGRyYXc6ICAgIGRyYXcgLy8gZXhwb3NlIGZvciBleHRlbnNpYmlsaXR5XG4gIH0sXG4gIGN1cnJlbnQ6IG51bGxcbn07IiwidmFyIE5vZGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Ob2RlJyksXG4gICAgYm91bmRzID0gcmVxdWlyZSgnLi4vdXRpbC9ib3VuZHMnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKTtcblxuZnVuY3Rpb24gQm91bmRlcihtb2RlbCwgbWFyaykge1xuICB0aGlzLl9tYXJrID0gbWFyaztcbiAgcmV0dXJuIE5vZGUucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBtb2RlbC5ncmFwaCkucm91dGVyKHRydWUpO1xufVxuXG52YXIgcHJvdG8gPSAoQm91bmRlci5wcm90b3R5cGUgPSBuZXcgTm9kZSgpKTtcblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wiYm91bmRzXCIsIHRoaXMuX21hcmsubWFya3R5cGVdKTtcblxuICBib3VuZHMubWFyayh0aGlzLl9tYXJrKTtcbiAgaWYgKHRoaXMuX21hcmsubWFya3R5cGUgPT09IEMuR1JPVVApIFxuICAgIGJvdW5kcy5tYXJrKHRoaXMuX21hcmssIG51bGwsIGZhbHNlKTtcblxuICBpbnB1dC5yZWZsb3cgPSB0cnVlO1xuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJvdW5kZXI7IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIE5vZGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Ob2RlJyksXG4gICAgRW5jb2RlciAgPSByZXF1aXJlKCcuL0VuY29kZXInKSxcbiAgICBCb3VuZGVyICA9IHJlcXVpcmUoJy4vQm91bmRlcicpLFxuICAgIEl0ZW0gID0gcmVxdWlyZSgnLi9JdGVtJyksXG4gICAgcGFyc2VEYXRhID0gcmVxdWlyZSgnLi4vcGFyc2UvZGF0YScpLFxuICAgIHR1cGxlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvdHVwbGUnKSxcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9jaGFuZ2VzZXQnKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gQnVpbGRlcigpIHsgICAgXG4gIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID8gdGhpcy5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgOiB0aGlzO1xufVxuXG52YXIgcHJvdG8gPSAoQnVpbGRlci5wcm90b3R5cGUgPSBuZXcgTm9kZSgpKTtcblxucHJvdG8uaW5pdCA9IGZ1bmN0aW9uKG1vZGVsLCBkZWYsIG1hcmssIHBhcmVudCwgcGFyZW50X2lkLCBpbmhlcml0RnJvbSkge1xuICBOb2RlLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgbW9kZWwuZ3JhcGgpXG4gICAgLnJvdXRlcih0cnVlKVxuICAgIC5jb2xsZWN0b3IodHJ1ZSk7XG5cbiAgdGhpcy5fbW9kZWwgPSBtb2RlbDtcbiAgdGhpcy5fZGVmICAgPSBkZWY7XG4gIHRoaXMuX21hcmsgID0gbWFyaztcbiAgdGhpcy5fZnJvbSAgPSAoZGVmLmZyb20gPyBkZWYuZnJvbS5kYXRhIDogbnVsbCkgfHwgaW5oZXJpdEZyb207XG4gIHRoaXMuX2RzICAgID0gZGwuaXNTdHJpbmcodGhpcy5fZnJvbSkgPyBtb2RlbC5kYXRhKHRoaXMuX2Zyb20pIDogbnVsbDtcbiAgdGhpcy5fbWFwICAgPSB7fTtcblxuICB0aGlzLl9yZXZpc2VzID0gZmFsc2U7ICAvLyBTaG91bGQgc2NlbmVncmFwaCBpdGVtcyB0cmFjayBfcHJldj9cblxuICBtYXJrLmRlZiA9IGRlZjtcbiAgbWFyay5tYXJrdHlwZSA9IGRlZi50eXBlO1xuICBtYXJrLmludGVyYWN0aXZlID0gIShkZWYuaW50ZXJhY3RpdmUgPT09IGZhbHNlKTtcbiAgbWFyay5pdGVtcyA9IFtdO1xuXG4gIHRoaXMuX3BhcmVudCA9IHBhcmVudDtcbiAgdGhpcy5fcGFyZW50X2lkID0gcGFyZW50X2lkO1xuXG4gIGlmKGRlZi5mcm9tICYmIChkZWYuZnJvbS5tYXJrIHx8IGRlZi5mcm9tLnRyYW5zZm9ybSB8fCBkZWYuZnJvbS5tb2RpZnkpKSB7XG4gICAgaW5saW5lRHMuY2FsbCh0aGlzKTtcbiAgfVxuXG4gIC8vIE5vbi1ncm91cCBtYXJrIGJ1aWxkZXJzIGFyZSBzdXBlciBub2Rlcy4gRW5jb2RlciBhbmQgQm91bmRlciByZW1haW4gXG4gIC8vIHNlcGFyYXRlIG9wZXJhdG9ycyBidXQgYXJlIGVtYmVkZGVkIGFuZCBjYWxsZWQgYnkgQnVpbGRlci5ldmFsdWF0ZS5cbiAgdGhpcy5faXNTdXBlciA9ICh0aGlzLl9kZWYudHlwZSAhPT0gQy5HUk9VUCk7IFxuICB0aGlzLl9lbmNvZGVyID0gbmV3IEVuY29kZXIodGhpcy5fbW9kZWwsIHRoaXMuX21hcmspO1xuICB0aGlzLl9ib3VuZGVyID0gbmV3IEJvdW5kZXIodGhpcy5fbW9kZWwsIHRoaXMuX21hcmspO1xuXG4gIGlmKHRoaXMuX2RzKSB7IHRoaXMuX2VuY29kZXIuZGVwZW5kZW5jeShDLkRBVEEsIHRoaXMuX2Zyb20pOyB9XG5cbiAgLy8gU2luY2UgQnVpbGRlcnMgYXJlIHN1cGVyIG5vZGVzLCBjb3B5IG92ZXIgZW5jb2RlciBkZXBlbmRlbmNpZXNcbiAgLy8gKGJvdW5kZXIgaGFzIG5vIHJlZ2lzdGVyZWQgZGVwZW5kZW5jaWVzKS5cbiAgdGhpcy5kZXBlbmRlbmN5KEMuREFUQSwgdGhpcy5fZW5jb2Rlci5kZXBlbmRlbmN5KEMuREFUQSkpO1xuICB0aGlzLmRlcGVuZGVuY3koQy5TQ0FMRVMsIHRoaXMuX2VuY29kZXIuZGVwZW5kZW5jeShDLlNDQUxFUykpO1xuICB0aGlzLmRlcGVuZGVuY3koQy5TSUdOQUxTLCB0aGlzLl9lbmNvZGVyLmRlcGVuZGVuY3koQy5TSUdOQUxTKSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5yZXZpc2VzID0gZnVuY3Rpb24ocCkge1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3JldmlzZXM7XG5cbiAgLy8gSWYgd2UndmUgbm90IG5lZWRlZCBwcmV2IGluIHRoZSBwYXN0LCBidXQgYSBuZXcgaW5saW5lIGRzIG5lZWRzIGl0IG5vd1xuICAvLyBlbnN1cmUgZXhpc3RpbmcgaXRlbXMgaGF2ZSBwcmV2IHNldC5cbiAgaWYoIXRoaXMuX3JldmlzZXMgJiYgcCkge1xuICAgIHRoaXMuX2l0ZW1zLmZvckVhY2goZnVuY3Rpb24oZCkgeyBpZihkLl9wcmV2ID09PSB1bmRlZmluZWQpIGQuX3ByZXYgPSBDLlNFTlRJTkVMOyB9KTtcbiAgfVxuXG4gIHRoaXMuX3JldmlzZXMgPSB0aGlzLl9yZXZpc2VzIHx8IHA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gUmVhY3RpdmUgZ2VvbWV0cnkgYW5kIG1hcmstbGV2ZWwgdHJhbnNmb3JtYXRpb25zIGFyZSBoYW5kbGVkIGhlcmUgXG4vLyBiZWNhdXNlIHRoZXkgbmVlZCB0aGVpciBncm91cCdzIGRhdGEtam9pbmVkIGNvbnRleHQuIFxuZnVuY3Rpb24gaW5saW5lRHMoKSB7XG4gIHZhciBmcm9tID0gdGhpcy5fZGVmLmZyb20sXG4gICAgICBnZW9tID0gZnJvbS5tYXJrLFxuICAgICAgc3JjLCBuYW1lLCBzcGVjLCBzaWJsaW5nLCBvdXRwdXQ7XG5cbiAgaWYoZ2VvbSkge1xuICAgIG5hbWUgPSBbXCJ2Z1wiLCB0aGlzLl9wYXJlbnRfaWQsIGdlb21dLmpvaW4oXCJfXCIpO1xuICAgIHNwZWMgPSB7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgdHJhbnNmb3JtOiBmcm9tLnRyYW5zZm9ybSwgXG4gICAgICBtb2RpZnk6IGZyb20ubW9kaWZ5XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBzcmMgPSB0aGlzLl9tb2RlbC5kYXRhKHRoaXMuX2Zyb20pO1xuICAgIG5hbWUgPSBbXCJ2Z1wiLCB0aGlzLl9mcm9tLCB0aGlzLl9kZWYudHlwZSwgc3JjLmxpc3RlbmVycyh0cnVlKS5sZW5ndGhdLmpvaW4oXCJfXCIpO1xuICAgIHNwZWMgPSB7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgc291cmNlOiB0aGlzLl9mcm9tLFxuICAgICAgdHJhbnNmb3JtOiBmcm9tLnRyYW5zZm9ybSxcbiAgICAgIG1vZGlmeTogZnJvbS5tb2RpZnlcbiAgICB9O1xuICB9XG5cbiAgdGhpcy5fZnJvbSA9IG5hbWU7XG4gIHRoaXMuX2RzID0gcGFyc2VEYXRhLmRhdGFzb3VyY2UodGhpcy5fbW9kZWwsIHNwZWMpO1xuICB2YXIgcmV2aXNlcyA9IHRoaXMuX2RzLnJldmlzZXMoKTtcblxuICBpZihnZW9tKSB7XG4gICAgc2libGluZyA9IHRoaXMuc2libGluZyhnZW9tKS5yZXZpc2VzKHJldmlzZXMpO1xuICAgIGlmKHNpYmxpbmcuX2lzU3VwZXIpIHNpYmxpbmcuYWRkTGlzdGVuZXIodGhpcy5fZHMubGlzdGVuZXIoKSk7XG4gICAgZWxzZSBzaWJsaW5nLl9ib3VuZGVyLmFkZExpc3RlbmVyKHRoaXMuX2RzLmxpc3RlbmVyKCkpO1xuICB9IGVsc2Uge1xuICAgIC8vIEF0IHRoaXMgcG9pbnQsIHdlIGhhdmUgYSBuZXcgZGF0YXNvdXJjZSBidXQgaXQgaXMgZW1wdHkgYXNcbiAgICAvLyB0aGUgcHJvcGFnYXRpb24gY3ljbGUgaGFzIGFscmVhZHkgY3Jvc3NlZCB0aGUgZGF0YXNvdXJjZXMuIFxuICAgIC8vIFNvLCB3ZSByZXB1bHNlIGp1c3QgdGhpcyBkYXRhc291cmNlLiBUaGlzIHNob3VsZCBiZSBzYWZlXG4gICAgLy8gYXMgdGhlIGRzIGlzbid0IGNvbm5lY3RlZCB0byB0aGUgc2NlbmVncmFwaCB5ZXQuXG4gICAgXG4gICAgdmFyIG91dHB1dCA9IHRoaXMuX2RzLnNvdXJjZSgpLnJldmlzZXMocmV2aXNlcykubGFzdCgpO1xuICAgICAgICBpbnB1dCAgPSBjaGFuZ2VzZXQuY3JlYXRlKG91dHB1dCk7XG5cbiAgICBpbnB1dC5hZGQgPSBvdXRwdXQuYWRkO1xuICAgIGlucHV0Lm1vZCA9IG91dHB1dC5tb2Q7XG4gICAgaW5wdXQucmVtID0gb3V0cHV0LnJlbTtcbiAgICBpbnB1dC5zdGFtcCA9IG51bGw7XG4gICAgdGhpcy5fZ3JhcGgucHJvcGFnYXRlKGlucHV0LCB0aGlzLl9kcy5saXN0ZW5lcigpKTtcbiAgfVxufVxuXG5wcm90by5waXBlbGluZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gW3RoaXNdO1xufTtcblxucHJvdG8uY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYnVpbGRlciA9IHRoaXM7XG5cbiAgdGhpcy5fbW9kZWwuZ3JhcGguY29ubmVjdCh0aGlzLnBpcGVsaW5lKCkpO1xuICB0aGlzLl9lbmNvZGVyLmRlcGVuZGVuY3koQy5TQ0FMRVMpLmZvckVhY2goZnVuY3Rpb24ocykge1xuICAgIGJ1aWxkZXIuX3BhcmVudC5zY2FsZShzKS5hZGRMaXN0ZW5lcihidWlsZGVyKTtcbiAgfSk7XG5cbiAgaWYodGhpcy5fcGFyZW50KSB7XG4gICAgaWYodGhpcy5faXNTdXBlcikgdGhpcy5hZGRMaXN0ZW5lcih0aGlzLl9wYXJlbnQuX2NvbGxlY3Rvcik7XG4gICAgZWxzZSB0aGlzLl9ib3VuZGVyLmFkZExpc3RlbmVyKHRoaXMuX3BhcmVudC5fY29sbGVjdG9yKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG8uZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYnVpbGRlciA9IHRoaXM7XG4gIGlmKCF0aGlzLl9saXN0ZW5lcnMubGVuZ3RoKSByZXR1cm4gdGhpcztcblxuICBOb2RlLnByb3RvdHlwZS5kaXNjb25uZWN0LmNhbGwodGhpcyk7XG4gIHRoaXMuX21vZGVsLmdyYXBoLmRpc2Nvbm5lY3QodGhpcy5waXBlbGluZSgpKTtcbiAgdGhpcy5fZW5jb2Rlci5kZXBlbmRlbmN5KEMuU0NBTEVTKS5mb3JFYWNoKGZ1bmN0aW9uKHMpIHtcbiAgICBidWlsZGVyLl9wYXJlbnQuc2NhbGUocykucmVtb3ZlTGlzdGVuZXIoYnVpbGRlcik7XG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLnNpYmxpbmcgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiB0aGlzLl9wYXJlbnQuY2hpbGQobmFtZSwgdGhpcy5fcGFyZW50X2lkKTtcbn07XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgZGVidWcoaW5wdXQsIFtcImJ1aWxkaW5nXCIsIHRoaXMuX2Zyb20sIHRoaXMuX2RlZi50eXBlXSk7XG5cbiAgdmFyIG91dHB1dCwgZnVsbFVwZGF0ZSwgZmNzLCBkYXRhO1xuXG4gIGlmKHRoaXMuX2RzKSB7XG4gICAgb3V0cHV0ID0gY2hhbmdlc2V0LmNyZWF0ZShpbnB1dCk7XG5cbiAgICAvLyBXZSBuZWVkIHRvIGRldGVybWluZSBpZiBhbnkgZW5jb2RlciBkZXBlbmRlbmNpZXMgaGF2ZSBiZWVuIHVwZGF0ZWQuXG4gICAgLy8gSG93ZXZlciwgdGhlIGVuY29kZXIncyBkYXRhIHNvdXJjZSB3aWxsIGxpa2VseSBiZSB1cGRhdGVkLCBhbmQgc2hvdWxkbid0XG4gICAgLy8gdHJpZ2dlciBhbGwgaXRlbXMgdG8gbW9kLlxuICAgIGRhdGEgPSBkbC5kdXBsaWNhdGUob3V0cHV0LmRhdGEpO1xuICAgIGRlbGV0ZSBvdXRwdXQuZGF0YVt0aGlzLl9kcy5uYW1lKCldO1xuICAgIGZ1bGxVcGRhdGUgPSB0aGlzLl9lbmNvZGVyLnJlZXZhbHVhdGUob3V0cHV0KTtcbiAgICBvdXRwdXQuZGF0YSA9IGRhdGE7XG5cbiAgICAvLyBJZiBhIHNjYWxlIG9yIHNpZ25hbCBpbiB0aGUgdXBkYXRlIHByb3BzZXQgaGFzIGJlZW4gdXBkYXRlZCwgXG4gICAgLy8gc2VuZCBmb3J3YXJkIGFsbCBpdGVtcyBmb3IgcmVlbmNvZGluZyBpZiB3ZSBkbyBhbiBlYXJseSByZXR1cm4uXG4gICAgaWYoZnVsbFVwZGF0ZSkgb3V0cHV0Lm1vZCA9IHRoaXMuX21hcmsuaXRlbXMuc2xpY2UoKTtcblxuICAgIGZjcyA9IHRoaXMuX2RzLmxhc3QoKTtcbiAgICBpZighZmNzKSB7XG4gICAgICBvdXRwdXQucmVmbG93ID0gdHJ1ZVxuICAgIH0gZWxzZSBpZihmY3Muc3RhbXAgPiB0aGlzLl9zdGFtcCkge1xuICAgICAgb3V0cHV0ID0gam9pbkRhdGFzb3VyY2UuY2FsbCh0aGlzLCBmY3MsIHRoaXMuX2RzLnZhbHVlcygpLCBmdWxsVXBkYXRlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZnVsbFVwZGF0ZSA9IHRoaXMuX2VuY29kZXIucmVldmFsdWF0ZShpbnB1dCk7XG4gICAgZGF0YSA9IGRsLmlzRnVuY3Rpb24odGhpcy5fZGVmLmZyb20pID8gdGhpcy5fZGVmLmZyb20oKSA6IFtDLlNFTlRJTkVMXTtcbiAgICBvdXRwdXQgPSBqb2luVmFsdWVzLmNhbGwodGhpcywgaW5wdXQsIGRhdGEsIGZ1bGxVcGRhdGUpO1xuICB9XG5cbiAgb3V0cHV0ID0gdGhpcy5fZ3JhcGguZXZhbHVhdGUob3V0cHV0LCB0aGlzLl9lbmNvZGVyKTtcbiAgcmV0dXJuIHRoaXMuX2lzU3VwZXIgPyB0aGlzLl9ncmFwaC5ldmFsdWF0ZShvdXRwdXQsIHRoaXMuX2JvdW5kZXIpIDogb3V0cHV0O1xufTtcblxuZnVuY3Rpb24gbmV3SXRlbSgpIHtcbiAgdmFyIHByZXYgPSB0aGlzLl9yZXZpc2VzID8gbnVsbCA6IHVuZGVmaW5lZCxcbiAgICAgIGl0ZW0gPSB0dXBsZS5pbmdlc3QobmV3IEl0ZW0odGhpcy5fbWFyayksIHByZXYpO1xuXG4gIC8vIEZvciB0aGUgcm9vdCBub2RlJ3MgaXRlbVxuICBpZih0aGlzLl9kZWYud2lkdGgpICB0dXBsZS5zZXQoaXRlbSwgXCJ3aWR0aFwiLCAgdGhpcy5fZGVmLndpZHRoKTtcbiAgaWYodGhpcy5fZGVmLmhlaWdodCkgdHVwbGUuc2V0KGl0ZW0sIFwiaGVpZ2h0XCIsIHRoaXMuX2RlZi5oZWlnaHQpO1xuICByZXR1cm4gaXRlbTtcbn07XG5cbmZ1bmN0aW9uIGpvaW4oZGF0YSwga2V5ZiwgbmV4dCwgb3V0cHV0LCBwcmV2LCBtb2QpIHtcbiAgdmFyIGksIGtleSwgbGVuLCBpdGVtLCBkYXR1bSwgZW50ZXI7XG5cbiAgZm9yKGk9MCwgbGVuPWRhdGEubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgZGF0dW0gPSBkYXRhW2ldO1xuICAgIGl0ZW0gID0ga2V5ZiA/IHRoaXMuX21hcFtrZXkgPSBrZXlmKGRhdHVtKV0gOiBwcmV2W2ldO1xuICAgIGVudGVyID0gaXRlbSA/IGZhbHNlIDogKGl0ZW0gPSBuZXdJdGVtLmNhbGwodGhpcyksIHRydWUpO1xuICAgIGl0ZW0uc3RhdHVzID0gZW50ZXIgPyBDLkVOVEVSIDogQy5VUERBVEU7XG4gICAgaXRlbS5kYXR1bSA9IGRhdHVtO1xuICAgIHR1cGxlLnNldChpdGVtLCBcImtleVwiLCBrZXkpO1xuICAgIHRoaXMuX21hcFtrZXldID0gaXRlbTtcbiAgICBuZXh0LnB1c2goaXRlbSk7XG4gICAgaWYoZW50ZXIpIG91dHB1dC5hZGQucHVzaChpdGVtKTtcbiAgICBlbHNlIGlmKCFtb2QgfHwgKG1vZCAmJiBtb2RbZGF0dW0uX2lkXSkpIG91dHB1dC5tb2QucHVzaChpdGVtKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBqb2luRGF0YXNvdXJjZShpbnB1dCwgZGF0YSwgZnVsbFVwZGF0ZSkge1xuICB2YXIgb3V0cHV0ID0gY2hhbmdlc2V0LmNyZWF0ZShpbnB1dCksXG4gICAgICBrZXlmID0ga2V5RnVuY3Rpb24odGhpcy5fZGVmLmtleSB8fCBcIl9pZFwiKSxcbiAgICAgIGFkZCA9IGlucHV0LmFkZCwgXG4gICAgICBtb2QgPSBpbnB1dC5tb2QsIFxuICAgICAgcmVtID0gaW5wdXQucmVtLFxuICAgICAgbmV4dCA9IFtdLFxuICAgICAgaSwga2V5LCBsZW4sIGl0ZW0sIGRhdHVtLCBlbnRlcjtcblxuICAvLyBCdWlsZCByZW1zIGZpcnN0LCBhbmQgcHV0IHRoZW0gYXQgdGhlIGhlYWQgb2YgdGhlIG5leHQgaXRlbXNcbiAgLy8gVGhlbiBidWlsZCB0aGUgcmVzdCBvZiB0aGUgZGF0YSB2YWx1ZXMgKHdoaWNoIHdvbid0IGNvbnRhaW4gcmVtKS5cbiAgLy8gVGhpcyB3aWxsIHByZXNlcnZlIHRoZSBzb3J0IG9yZGVyIHdpdGhvdXQgbmVlZGluZyBhbnl0aGluZyBleHRyYS5cblxuICBmb3IoaT0wLCBsZW49cmVtLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIGl0ZW0gPSB0aGlzLl9tYXBba2V5ID0ga2V5ZihyZW1baV0pXTtcbiAgICBpdGVtLnN0YXR1cyA9IEMuRVhJVDtcbiAgICBuZXh0LnB1c2goaXRlbSk7XG4gICAgb3V0cHV0LnJlbS5wdXNoKGl0ZW0pO1xuICAgIHRoaXMuX21hcFtrZXldID0gbnVsbDtcbiAgfVxuXG4gIGpvaW4uY2FsbCh0aGlzLCBkYXRhLCBrZXlmLCBuZXh0LCBvdXRwdXQsIG51bGwsIHR1cGxlLmlkTWFwKGZ1bGxVcGRhdGUgPyBkYXRhIDogbW9kKSk7XG5cbiAgcmV0dXJuICh0aGlzLl9tYXJrLml0ZW1zID0gbmV4dCwgb3V0cHV0KTtcbn1cblxuZnVuY3Rpb24gam9pblZhbHVlcyhpbnB1dCwgZGF0YSwgZnVsbFVwZGF0ZSkge1xuICB2YXIgb3V0cHV0ID0gY2hhbmdlc2V0LmNyZWF0ZShpbnB1dCksXG4gICAgICBrZXlmID0ga2V5RnVuY3Rpb24odGhpcy5fZGVmLmtleSksXG4gICAgICBwcmV2ID0gdGhpcy5fbWFyay5pdGVtcyB8fCBbXSxcbiAgICAgIG5leHQgPSBbXSxcbiAgICAgIGksIGtleSwgbGVuLCBpdGVtLCBkYXR1bSwgZW50ZXI7XG5cbiAgZm9yIChpPTAsIGxlbj1wcmV2Lmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIGl0ZW0gPSBwcmV2W2ldO1xuICAgIGl0ZW0uc3RhdHVzID0gQy5FWElUO1xuICAgIGlmIChrZXlmKSB0aGlzLl9tYXBbaXRlbS5rZXldID0gaXRlbTtcbiAgfVxuICBcbiAgam9pbi5jYWxsKHRoaXMsIGRhdGEsIGtleWYsIG5leHQsIG91dHB1dCwgcHJldiwgZnVsbFVwZGF0ZSA/IHR1cGxlLmlkTWFwKGRhdGEpIDogbnVsbCk7XG5cbiAgZm9yIChpPTAsIGxlbj1wcmV2Lmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIGl0ZW0gPSBwcmV2W2ldO1xuICAgIGlmIChpdGVtLnN0YXR1cyA9PT0gQy5FWElUKSB7XG4gICAgICB0dXBsZS5zZXQoaXRlbSwgXCJrZXlcIiwga2V5ZiA/IGl0ZW0ua2V5IDogdGhpcy5faXRlbXMubGVuZ3RoKTtcbiAgICAgIG5leHQuc3BsaWNlKDAsIDAsIGl0ZW0pOyAgLy8gS2VlcCBpdGVtIGFyb3VuZCBmb3IgXCJleGl0XCIgdHJhbnNpdGlvbi5cbiAgICAgIG91dHB1dC5yZW0ucHVzaChpdGVtKTtcbiAgICB9XG4gIH1cbiAgXG4gIHJldHVybiAodGhpcy5fbWFyay5pdGVtcyA9IG5leHQsIG91dHB1dCk7XG59O1xuXG5mdW5jdGlvbiBrZXlGdW5jdGlvbihrZXkpIHtcbiAgaWYgKGtleSA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgdmFyIGYgPSBkbC5hcnJheShrZXkpLm1hcChkbC5hY2Nlc3Nvcik7XG4gIHJldHVybiBmdW5jdGlvbihkKSB7XG4gICAgZm9yICh2YXIgcz1cIlwiLCBpPTAsIG49Zi5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgICBpZiAoaT4wKSBzICs9IFwifFwiO1xuICAgICAgcyArPSBTdHJpbmcoZltpXShkKSk7XG4gICAgfVxuICAgIHJldHVybiBzO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1aWxkZXI7IiwidmFyIE5vZGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Ob2RlJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgRU1QVFkgPSB7fTtcblxuZnVuY3Rpb24gRW5jb2Rlcihtb2RlbCwgbWFyaykge1xuICB2YXIgcHJvcHMgPSBtYXJrLmRlZi5wcm9wZXJ0aWVzIHx8IHt9LFxuICAgICAgdXBkYXRlID0gcHJvcHMudXBkYXRlO1xuXG4gIE5vZGUucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBtb2RlbC5ncmFwaClcblxuICB0aGlzLl9tb2RlbCA9IG1vZGVsO1xuICB0aGlzLl9tYXJrICA9IG1hcms7XG5cbiAgaWYodXBkYXRlKSB7XG4gICAgdGhpcy5kZXBlbmRlbmN5KEMuREFUQSwgdXBkYXRlLmRhdGEpO1xuICAgIHRoaXMuZGVwZW5kZW5jeShDLlNDQUxFUywgdXBkYXRlLnNjYWxlcyk7XG4gICAgdGhpcy5kZXBlbmRlbmN5KEMuU0lHTkFMUywgdXBkYXRlLnNpZ25hbHMpO1xuICAgIHRoaXMuZGVwZW5kZW5jeShDLkZJRUxEUywgdXBkYXRlLmZpZWxkcyk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn1cblxudmFyIHByb3RvID0gKEVuY29kZXIucHJvdG90eXBlID0gbmV3IE5vZGUoKSk7XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgZGVidWcoaW5wdXQsIFtcImVuY29kaW5nXCIsIHRoaXMuX21hcmsuZGVmLnR5cGVdKTtcbiAgdmFyIGdyYXBoID0gdGhpcy5fZ3JhcGgsXG4gICAgICBpdGVtcyA9IHRoaXMuX21hcmsuaXRlbXMsXG4gICAgICBwcm9wcyA9IHRoaXMuX21hcmsuZGVmLnByb3BlcnRpZXMgfHwge30sXG4gICAgICBlbnRlciAgPSBwcm9wcy5lbnRlcixcbiAgICAgIHVwZGF0ZSA9IHByb3BzLnVwZGF0ZSxcbiAgICAgIGV4aXQgICA9IHByb3BzLmV4aXQsXG4gICAgICBzZyA9IGdyYXBoLnNpZ25hbFZhbHVlcygpLCAgLy8gRm9yIGV4cGVkaWVuY3ksIGdldCBhbGwgc2lnbmFsIHZhbHVlc1xuICAgICAgZGIsIGksIGxlbiwgaXRlbTtcblxuICBkYiA9IGdyYXBoLmRhdGEoKS5yZWR1Y2UoZnVuY3Rpb24oZGIsIGRzKSB7IFxuICAgIHJldHVybiAoZGJbZHMubmFtZSgpXSA9IGRzLnZhbHVlcygpLCBkYik7XG4gIH0sIHt9KTtcblxuICAvLyBJdGVtcyBtYXJrZWQgZm9yIHJlbW92YWwgYXJlIGF0IHRoZSBoZWFkIG9mIGl0ZW1zLiBQcm9jZXNzIHRoZW0gZmlyc3QuXG4gIGZvcihpPTAsIGxlbj1pbnB1dC5yZW0ubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgaXRlbSA9IGlucHV0LnJlbVtpXTtcbiAgICBpZih1cGRhdGUpIGVuY29kZS5jYWxsKHRoaXMsIHVwZGF0ZSwgaXRlbSwgaW5wdXQudHJhbnMsIGRiLCBzZyk7XG4gICAgaWYoZXhpdCkgICBlbmNvZGUuY2FsbCh0aGlzLCBleGl0LCAgIGl0ZW0sIGlucHV0LnRyYW5zKSwgZGIsIHNnOyBcbiAgICBpZihpbnB1dC50cmFucyAmJiAhZXhpdCkgaW5wdXQudHJhbnMuaW50ZXJwb2xhdGUoaXRlbSwgRU1QVFkpO1xuICAgIGVsc2UgaWYoIWlucHV0LnRyYW5zKSBpdGVtLnJlbW92ZSgpO1xuICB9XG5cbiAgZm9yKGk9MCwgbGVuPWlucHV0LmFkZC5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBpdGVtID0gaW5wdXQuYWRkW2ldO1xuICAgIGlmKGVudGVyKSAgZW5jb2RlLmNhbGwodGhpcywgZW50ZXIsICBpdGVtLCBpbnB1dC50cmFucywgZGIsIHNnKTtcbiAgICBpZih1cGRhdGUpIGVuY29kZS5jYWxsKHRoaXMsIHVwZGF0ZSwgaXRlbSwgaW5wdXQudHJhbnMsIGRiLCBzZyk7XG4gICAgaXRlbS5zdGF0dXMgPSBDLlVQREFURTtcbiAgfVxuXG4gIGlmKHVwZGF0ZSkge1xuICAgIGZvcihpPTAsIGxlbj1pbnB1dC5tb2QubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgICBpdGVtID0gaW5wdXQubW9kW2ldO1xuICAgICAgZW5jb2RlLmNhbGwodGhpcywgdXBkYXRlLCBpdGVtLCBpbnB1dC50cmFucywgZGIsIHNnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5mdW5jdGlvbiBlbmNvZGUocHJvcCwgaXRlbSwgdHJhbnMsIGRiLCBzZykge1xuICB2YXIgZW5jID0gcHJvcC5lbmNvZGU7XG4gIGVuYy5jYWxsKGVuYywgaXRlbSwgaXRlbS5tYXJrLmdyb3VwfHxpdGVtLCB0cmFucywgZGIsIHNnLCB0aGlzLl9tb2RlbC5wcmVkaWNhdGVzKCkpO1xufVxuXG4vLyBJZiB1cGRhdGUgcHJvcGVydHkgc2V0IHVzZXMgbmVzdGVkIGZpZWxkcmVmcywgcmVldmFsdWF0ZSBhbGwgaXRlbXMuXG5wcm90by5yZWV2YWx1YXRlID0gZnVuY3Rpb24ocHVsc2UpIHtcbiAgdmFyIHByb3BzID0gdGhpcy5fbWFyay5kZWYucHJvcGVydGllcyB8fCB7fSxcbiAgICAgIHVwZGF0ZSA9IHByb3BzLnVwZGF0ZTtcbiAgcmV0dXJuIE5vZGUucHJvdG90eXBlLnJlZXZhbHVhdGUuY2FsbCh0aGlzLCBwdWxzZSkgfHwgKHVwZGF0ZSA/IHVwZGF0ZS5yZWZsb3cgOiBmYWxzZSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVuY29kZXI7IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIE5vZGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Ob2RlJyksXG4gICAgQ29sbGVjdG9yID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvQ29sbGVjdG9yJyksXG4gICAgQnVpbGRlciA9IHJlcXVpcmUoJy4vQnVpbGRlcicpLFxuICAgIFNjYWxlID0gcmVxdWlyZSgnLi9TY2FsZScpLFxuICAgIHBhcnNlQXhlcyA9IHJlcXVpcmUoJy4uL3BhcnNlL2F4ZXMnKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gR3JvdXBCdWlsZGVyKCkge1xuICB0aGlzLl9jaGlsZHJlbiA9IHt9O1xuICB0aGlzLl9zY2FsZXIgPSBudWxsO1xuICB0aGlzLl9yZWN1cnNvciA9IG51bGw7XG5cbiAgdGhpcy5fc2NhbGVzID0ge307XG4gIHRoaXMuc2NhbGUgPSBzY2FsZS5iaW5kKHRoaXMpO1xuICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA/IHRoaXMuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDogdGhpcztcbn1cblxudmFyIHByb3RvID0gKEdyb3VwQnVpbGRlci5wcm90b3R5cGUgPSBuZXcgQnVpbGRlcigpKTtcblxucHJvdG8uaW5pdCA9IGZ1bmN0aW9uKG1vZGVsLCBkZWYsIG1hcmssIHBhcmVudCwgcGFyZW50X2lkLCBpbmhlcml0RnJvbSkge1xuICB2YXIgYnVpbGRlciA9IHRoaXM7XG5cbiAgdGhpcy5fc2NhbGVyID0gbmV3IE5vZGUobW9kZWwuZ3JhcGgpO1xuXG4gIChkZWYuc2NhbGVzfHxbXSkuZm9yRWFjaChmdW5jdGlvbihzKSB7IFxuICAgIHMgPSBidWlsZGVyLnNjYWxlKHMubmFtZSwgbmV3IFNjYWxlKG1vZGVsLCBzLCBidWlsZGVyKSk7XG4gICAgYnVpbGRlci5fc2NhbGVyLmFkZExpc3RlbmVyKHMpOyAgLy8gU2NhbGVzIHNob3VsZCBiZSBjb21wdXRlZCBhZnRlciBncm91cCBpcyBlbmNvZGVkXG4gIH0pO1xuXG4gIHRoaXMuX3JlY3Vyc29yID0gbmV3IE5vZGUobW9kZWwuZ3JhcGgpO1xuICB0aGlzLl9yZWN1cnNvci5ldmFsdWF0ZSA9IHJlY3Vyc2UuYmluZCh0aGlzKTtcblxuICB2YXIgc2NhbGVzID0gKGRlZi5heGVzfHxbXSkucmVkdWNlKGZ1bmN0aW9uKGFjYywgeCkge1xuICAgIHJldHVybiAoYWNjW3guc2NhbGVdID0gMSwgYWNjKTtcbiAgfSwge30pO1xuICB0aGlzLl9yZWN1cnNvci5kZXBlbmRlbmN5KEMuU0NBTEVTLCBkbC5rZXlzKHNjYWxlcykpO1xuXG4gIC8vIFdlIG9ubHkgbmVlZCBhIGNvbGxlY3RvciBmb3IgdXAtcHJvcGFnYXRpb24gb2YgYm91bmRzIGNhbGN1bGF0aW9uLFxuICAvLyBzbyBvbmx5IEdyb3VwQnVpbGRlcnMsIGFuZCBub3QgcmVndWxhciBCdWlsZGVycywgaGF2ZSBjb2xsZWN0b3JzLlxuICB0aGlzLl9jb2xsZWN0b3IgPSBuZXcgQ29sbGVjdG9yKG1vZGVsLmdyYXBoKTtcblxuICByZXR1cm4gQnVpbGRlci5wcm90b3R5cGUuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgb3V0cHV0ID0gQnVpbGRlci5wcm90b3R5cGUuZXZhbHVhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKSxcbiAgICAgIGJ1aWxkZXIgPSB0aGlzO1xuXG4gIG91dHB1dC5hZGQuZm9yRWFjaChmdW5jdGlvbihncm91cCkgeyBidWlsZEdyb3VwLmNhbGwoYnVpbGRlciwgb3V0cHV0LCBncm91cCk7IH0pO1xuICByZXR1cm4gb3V0cHV0O1xufTtcblxucHJvdG8ucGlwZWxpbmUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFt0aGlzLCB0aGlzLl9zY2FsZXIsIHRoaXMuX3JlY3Vyc29yLCB0aGlzLl9jb2xsZWN0b3IsIHRoaXMuX2JvdW5kZXJdO1xufTtcblxucHJvdG8uZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYnVpbGRlciA9IHRoaXM7XG4gIGRsLmtleXMoYnVpbGRlci5fY2hpbGRyZW4pLmZvckVhY2goZnVuY3Rpb24oZ3JvdXBfaWQpIHtcbiAgICBidWlsZGVyLl9jaGlsZHJlbltncm91cF9pZF0uZm9yRWFjaChmdW5jdGlvbihjKSB7XG4gICAgICBidWlsZGVyLl9yZWN1cnNvci5yZW1vdmVMaXN0ZW5lcihjLmJ1aWxkZXIpO1xuICAgICAgYy5idWlsZGVyLmRpc2Nvbm5lY3QoKTtcbiAgICB9KVxuICB9KTtcblxuICBidWlsZGVyLl9jaGlsZHJlbiA9IHt9O1xuICByZXR1cm4gQnVpbGRlci5wcm90b3R5cGUuZGlzY29ubmVjdC5jYWxsKHRoaXMpO1xufTtcblxucHJvdG8uY2hpbGQgPSBmdW5jdGlvbihuYW1lLCBncm91cF9pZCkge1xuICB2YXIgY2hpbGRyZW4gPSB0aGlzLl9jaGlsZHJlbltncm91cF9pZF0sXG4gICAgICBpID0gMCwgbGVuID0gY2hpbGRyZW4ubGVuZ3RoLFxuICAgICAgY2hpbGQ7XG5cbiAgZm9yKDsgaTxsZW47ICsraSkge1xuICAgIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgaWYoY2hpbGQudHlwZSA9PSBDLk1BUksgJiYgY2hpbGQuYnVpbGRlci5fZGVmLm5hbWUgPT0gbmFtZSkgYnJlYWs7XG4gIH1cblxuICByZXR1cm4gY2hpbGQuYnVpbGRlcjtcbn07XG5cbmZ1bmN0aW9uIHJlY3Vyc2UoaW5wdXQpIHtcbiAgdmFyIGJ1aWxkZXIgPSB0aGlzLFxuICAgICAgaGFzTWFya3MgPSB0aGlzLl9kZWYubWFya3MgJiYgdGhpcy5fZGVmLm1hcmtzLmxlbmd0aCA+IDAsXG4gICAgICBoYXNBeGVzID0gdGhpcy5fZGVmLmF4ZXMgJiYgdGhpcy5fZGVmLmF4ZXMubGVuZ3RoID4gMCxcbiAgICAgIGksIGxlbiwgZ3JvdXAsIHBpcGVsaW5lLCBkZWYsIGlubGluZSA9IGZhbHNlO1xuXG4gIGZvcihpPTAsIGxlbj1pbnB1dC5hZGQubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgZ3JvdXAgPSBpbnB1dC5hZGRbaV07XG4gICAgaWYoaGFzTWFya3MpIGJ1aWxkTWFya3MuY2FsbCh0aGlzLCBpbnB1dCwgZ3JvdXApO1xuICAgIGlmKGhhc0F4ZXMpICBidWlsZEF4ZXMuY2FsbCh0aGlzLCBpbnB1dCwgZ3JvdXApO1xuICB9XG5cbiAgLy8gV2lyZSB1cCBuZXcgY2hpbGRyZW4gYnVpbGRlcnMgaW4gcmV2ZXJzZSB0byBtaW5pbWl6ZSBncmFwaCByZXdyaXRlcy5cbiAgZm9yIChpPWlucHV0LmFkZC5sZW5ndGgtMTsgaT49MDsgLS1pKSB7XG4gICAgZ3JvdXAgPSBpbnB1dC5hZGRbaV07XG4gICAgZm9yIChqPXRoaXMuX2NoaWxkcmVuW2dyb3VwLl9pZF0ubGVuZ3RoLTE7IGo+PTA7IC0taikge1xuICAgICAgYyA9IHRoaXMuX2NoaWxkcmVuW2dyb3VwLl9pZF1bal07XG4gICAgICBjLmJ1aWxkZXIuY29ubmVjdCgpO1xuICAgICAgcGlwZWxpbmUgPSBjLmJ1aWxkZXIucGlwZWxpbmUoKTtcbiAgICAgIGRlZiA9IGMuYnVpbGRlci5fZGVmO1xuXG4gICAgICAvLyBUaGlzIG5ldyBjaGlsZCBuZWVkcyB0byBiZSBidWlsdCBkdXJpbmcgdGhpcyBwcm9wYWdhdGlvbiBjeWNsZS5cbiAgICAgIC8vIFdlIGNvdWxkIGFkZCBpdHMgYnVpbGRlciBhcyBhIGxpc3RlbmVyIG9mZiB0aGUgX3JlY3Vyc29yIG5vZGUsIFxuICAgICAgLy8gYnV0IHRyeSB0byBpbmxpbmUgaXQgaWYgd2UgY2FuIHRvIG1pbmltaXplIGdyYXBoIGRpc3BhdGNoZXMuXG4gICAgICBpbmxpbmUgPSAoZGVmLnR5cGUgIT09IEMuR1JPVVApO1xuICAgICAgaW5saW5lID0gaW5saW5lICYmICh0aGlzLl9tb2RlbC5kYXRhKGMuZnJvbSkgIT09IHVuZGVmaW5lZCk7IFxuICAgICAgaW5saW5lID0gaW5saW5lICYmIChwaXBlbGluZVtwaXBlbGluZS5sZW5ndGgtMV0ubGlzdGVuZXJzKCkubGVuZ3RoID09IDEpOyAvLyBSZWFjdGl2ZSBnZW9tXG4gICAgICBjLmlubGluZSA9IGlubGluZTtcblxuICAgICAgaWYoaW5saW5lKSBjLmJ1aWxkZXIuZXZhbHVhdGUoaW5wdXQpO1xuICAgICAgZWxzZSB0aGlzLl9yZWN1cnNvci5hZGRMaXN0ZW5lcihjLmJ1aWxkZXIpO1xuICAgIH1cbiAgfVxuXG4gIGZvcihpPTAsIGxlbj1pbnB1dC5tb2QubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgZ3JvdXAgPSBpbnB1dC5tb2RbaV07XG4gICAgLy8gUmVtb3ZlIHRlbXBvcmFyeSBjb25uZWN0aW9uIGZvciBtYXJrcyB0aGF0IGRyYXcgZnJvbSBhIHNvdXJjZVxuICAgIGlmKGhhc01hcmtzKSB7XG4gICAgICBidWlsZGVyLl9jaGlsZHJlbltncm91cC5faWRdLmZvckVhY2goZnVuY3Rpb24oYykge1xuICAgICAgICBpZihjLnR5cGUgPT0gQy5NQVJLICYmICFjLmlubGluZSAmJiBidWlsZGVyLl9tb2RlbC5kYXRhKGMuZnJvbSkgIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICBidWlsZGVyLl9yZWN1cnNvci5yZW1vdmVMaXN0ZW5lcihjLmJ1aWxkZXIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgYXhlcyBkYXRhIGRlZnNcbiAgICBpZihoYXNBeGVzKSB7XG4gICAgICBwYXJzZUF4ZXMoYnVpbGRlci5fbW9kZWwsIGJ1aWxkZXIuX2RlZi5heGVzLCBncm91cC5heGVzLCBncm91cCk7XG4gICAgICBncm91cC5heGVzLmZvckVhY2goZnVuY3Rpb24oYSwgaSkgeyBhLmRlZigpIH0pO1xuICAgIH0gICAgICBcbiAgfVxuXG4gIGZvcihpPTAsIGxlbj1pbnB1dC5yZW0ubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgZ3JvdXAgPSBpbnB1dC5yZW1baV07XG4gICAgLy8gRm9yIGRlbGV0ZWQgZ3JvdXBzLCBkaXNjb25uZWN0IHRoZWlyIGNoaWxkcmVuXG4gICAgYnVpbGRlci5fY2hpbGRyZW5bZ3JvdXAuX2lkXS5mb3JFYWNoKGZ1bmN0aW9uKGMpIHsgXG4gICAgICBidWlsZGVyLl9yZWN1cnNvci5yZW1vdmVMaXN0ZW5lcihjLmJ1aWxkZXIpO1xuICAgICAgYy5idWlsZGVyLmRpc2Nvbm5lY3QoKTsgXG4gICAgfSk7XG4gICAgZGVsZXRlIGJ1aWxkZXIuX2NoaWxkcmVuW2dyb3VwLl9pZF07XG4gIH1cblxuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5mdW5jdGlvbiBzY2FsZShuYW1lLCBzY2FsZSkge1xuICB2YXIgZ3JvdXAgPSB0aGlzO1xuICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAyKSByZXR1cm4gKGdyb3VwLl9zY2FsZXNbbmFtZV0gPSBzY2FsZSwgc2NhbGUpO1xuICB3aGlsZShzY2FsZSA9PSBudWxsKSB7XG4gICAgc2NhbGUgPSBncm91cC5fc2NhbGVzW25hbWVdO1xuICAgIGdyb3VwID0gZ3JvdXAubWFyayA/IGdyb3VwLm1hcmsuZ3JvdXAgOiBncm91cC5fcGFyZW50O1xuICAgIGlmKCFncm91cCkgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIHNjYWxlO1xufVxuXG5mdW5jdGlvbiBidWlsZEdyb3VwKGlucHV0LCBncm91cCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wiYnVpbGRpbmcgZ3JvdXBcIiwgZ3JvdXAuX2lkXSk7XG5cbiAgZ3JvdXAuX3NjYWxlcyA9IGdyb3VwLl9zY2FsZXMgfHwge307ICAgIFxuICBncm91cC5zY2FsZSAgPSBzY2FsZS5iaW5kKGdyb3VwKTtcblxuICBncm91cC5pdGVtcyA9IGdyb3VwLml0ZW1zIHx8IFtdO1xuICB0aGlzLl9jaGlsZHJlbltncm91cC5faWRdID0gdGhpcy5fY2hpbGRyZW5bZ3JvdXAuX2lkXSB8fCBbXTtcblxuICBncm91cC5heGVzID0gZ3JvdXAuYXhlcyB8fCBbXTtcbiAgZ3JvdXAuYXhpc0l0ZW1zID0gZ3JvdXAuYXhpc0l0ZW1zIHx8IFtdO1xufVxuXG5mdW5jdGlvbiBidWlsZE1hcmtzKGlucHV0LCBncm91cCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wiYnVpbGRpbmcgbWFya3NcIiwgZ3JvdXAuX2lkXSk7XG4gIHZhciBtYXJrcyA9IHRoaXMuX2RlZi5tYXJrcyxcbiAgICAgIGxpc3RlbmVycyA9IFtdLFxuICAgICAgbWFyaywgZnJvbSwgaW5oZXJpdCwgaSwgbGVuLCBtLCBiO1xuXG4gIGZvcihpPTAsIGxlbj1tYXJrcy5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICBtYXJrID0gbWFya3NbaV07XG4gICAgZnJvbSA9IG1hcmsuZnJvbSB8fCB7fTtcbiAgICBpbmhlcml0ID0gXCJ2Z19cIitncm91cC5kYXR1bS5faWQ7XG4gICAgZ3JvdXAuaXRlbXNbaV0gPSB7Z3JvdXA6IGdyb3VwfTtcbiAgICBiID0gKG1hcmsudHlwZSA9PT0gQy5HUk9VUCkgPyBuZXcgR3JvdXBCdWlsZGVyKCkgOiBuZXcgQnVpbGRlcigpO1xuICAgIGIuaW5pdCh0aGlzLl9tb2RlbCwgbWFyaywgZ3JvdXAuaXRlbXNbaV0sIHRoaXMsIGdyb3VwLl9pZCwgaW5oZXJpdCk7XG4gICAgdGhpcy5fY2hpbGRyZW5bZ3JvdXAuX2lkXS5wdXNoKHsgXG4gICAgICBidWlsZGVyOiBiLCBcbiAgICAgIGZyb206IGZyb20uZGF0YSB8fCAoZnJvbS5tYXJrID8gKFwidmdfXCIgKyBncm91cC5faWQgKyBcIl9cIiArIGZyb20ubWFyaykgOiBpbmhlcml0KSwgXG4gICAgICB0eXBlOiBDLk1BUksgXG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGRBeGVzKGlucHV0LCBncm91cCkge1xuICB2YXIgYXhlcyA9IGdyb3VwLmF4ZXMsXG4gICAgICBheGlzSXRlbXMgPSBncm91cC5heGlzSXRlbXMsXG4gICAgICBidWlsZGVyID0gdGhpcztcblxuICBwYXJzZUF4ZXModGhpcy5fbW9kZWwsIHRoaXMuX2RlZi5heGVzLCBheGVzLCBncm91cCk7XG4gIGF4ZXMuZm9yRWFjaChmdW5jdGlvbihhLCBpKSB7XG4gICAgdmFyIHNjYWxlID0gYnVpbGRlci5fZGVmLmF4ZXNbaV0uc2NhbGUsXG4gICAgICAgIGRlZiA9IGEuZGVmKCksXG4gICAgICAgIGIgPSBudWxsO1xuXG4gICAgYXhpc0l0ZW1zW2ldID0ge2dyb3VwOiBncm91cCwgYXhpc0RlZjogZGVmfTtcbiAgICBiID0gKGRlZi50eXBlID09PSBDLkdST1VQKSA/IG5ldyBHcm91cEJ1aWxkZXIoKSA6IG5ldyBCdWlsZGVyKCk7XG4gICAgYi5pbml0KGJ1aWxkZXIuX21vZGVsLCBkZWYsIGF4aXNJdGVtc1tpXSwgYnVpbGRlcilcbiAgICAgIC5kZXBlbmRlbmN5KEMuU0NBTEVTLCBzY2FsZSk7XG4gICAgYnVpbGRlci5fY2hpbGRyZW5bZ3JvdXAuX2lkXS5wdXNoKHsgYnVpbGRlcjogYiwgdHlwZTogQy5BWElTLCBzY2FsZTogc2NhbGUgfSk7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwQnVpbGRlcjsiLCJmdW5jdGlvbiBJdGVtKG1hcmspIHtcbiAgdGhpcy5tYXJrID0gbWFyaztcbn1cblxudmFyIHByb3RvdHlwZSA9IEl0ZW0ucHJvdG90eXBlO1xuXG5wcm90b3R5cGUuaGFzUHJvcGVydHlTZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBwcm9wcyA9IHRoaXMubWFyay5kZWYucHJvcGVydGllcztcbiAgcmV0dXJuIHByb3BzICYmIHByb3BzW25hbWVdICE9IG51bGw7XG59O1xuXG5wcm90b3R5cGUuY291c2luID0gZnVuY3Rpb24ob2Zmc2V0LCBpbmRleCkge1xuICBpZiAob2Zmc2V0ID09PSAwKSByZXR1cm4gdGhpcztcbiAgb2Zmc2V0ID0gb2Zmc2V0IHx8IC0xO1xuICB2YXIgbWFyayA9IHRoaXMubWFyayxcbiAgICAgIGdyb3VwID0gbWFyay5ncm91cCxcbiAgICAgIGlpZHggPSBpbmRleD09bnVsbCA/IG1hcmsuaXRlbXMuaW5kZXhPZih0aGlzKSA6IGluZGV4LFxuICAgICAgbWlkeCA9IGdyb3VwLml0ZW1zLmluZGV4T2YobWFyaykgKyBvZmZzZXQ7XG4gIHJldHVybiBncm91cC5pdGVtc1ttaWR4XS5pdGVtc1tpaWR4XTtcbn07XG5cbnByb3RvdHlwZS5zaWJsaW5nID0gZnVuY3Rpb24ob2Zmc2V0KSB7XG4gIGlmIChvZmZzZXQgPT09IDApIHJldHVybiB0aGlzO1xuICBvZmZzZXQgPSBvZmZzZXQgfHwgLTE7XG4gIHZhciBtYXJrID0gdGhpcy5tYXJrLFxuICAgICAgaWlkeCA9IG1hcmsuaXRlbXMuaW5kZXhPZih0aGlzKSArIG9mZnNldDtcbiAgcmV0dXJuIG1hcmsuaXRlbXNbaWlkeF07XG59O1xuXG5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpdGVtID0gdGhpcyxcbiAgICAgIGxpc3QgPSBpdGVtLm1hcmsuaXRlbXMsXG4gICAgICBpID0gbGlzdC5pbmRleE9mKGl0ZW0pO1xuICBpZiAoaSA+PSAwKSAoaT09PWxpc3QubGVuZ3RoLTEpID8gbGlzdC5wb3AoKSA6IGxpc3Quc3BsaWNlKGksIDEpO1xuICByZXR1cm4gaXRlbTtcbn07XG5cbnByb3RvdHlwZS50b3VjaCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5wYXRoQ2FjaGUpIHRoaXMucGF0aENhY2hlID0gbnVsbDtcbiAgaWYgKHRoaXMubWFyay5wYXRoQ2FjaGUpIHRoaXMubWFyay5wYXRoQ2FjaGUgPSBudWxsO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBJdGVtOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICAgIE5vZGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Ob2RlJyksXG4gICAgQWdncmVnYXRlID0gcmVxdWlyZSgnLi4vdHJhbnNmb3Jtcy9BZ2dyZWdhdGUnKSxcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9jaGFuZ2VzZXQnKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKSxcbiAgICBjb25maWcgPSByZXF1aXJlKCcuLi91dGlsL2NvbmZpZycpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG52YXIgR1JPVVBfUFJPUEVSVFkgPSB7d2lkdGg6IDEsIGhlaWdodDogMX07XG5cbmZ1bmN0aW9uIFNjYWxlKG1vZGVsLCBkZWYsIHBhcmVudCkge1xuICB0aGlzLl9tb2RlbCAgID0gbW9kZWw7XG4gIHRoaXMuX2RlZiAgICAgPSBkZWY7XG4gIHRoaXMuX3BhcmVudCAgPSBwYXJlbnQ7XG4gIHRoaXMuX3VwZGF0ZWQgPSBmYWxzZTtcbiAgcmV0dXJuIE5vZGUucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBtb2RlbC5ncmFwaCk7XG59XG5cbnZhciBwcm90byA9IChTY2FsZS5wcm90b3R5cGUgPSBuZXcgTm9kZSgpKTtcblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICBmbiA9IGZ1bmN0aW9uKGdyb3VwKSB7IHNjYWxlLmNhbGwoc2VsZiwgZ3JvdXApOyB9O1xuXG4gIHRoaXMuX3VwZGF0ZWQgPSBmYWxzZTtcbiAgaW5wdXQuYWRkLmZvckVhY2goZm4pO1xuICBpbnB1dC5tb2QuZm9yRWFjaChmbik7XG5cbiAgLy8gU2NhbGVzIGFyZSBhdCB0aGUgZW5kIG9mIGFuIGVuY29kaW5nIHBpcGVsaW5lLCBzbyB0aGV5IHNob3VsZCBmb3J3YXJkIGFcbiAgLy8gcmVmbG93IHB1bHNlLiBUaHVzLCBpZiBtdWx0aXBsZSBzY2FsZXMgdXBkYXRlIGluIHRoZSBwYXJlbnQgZ3JvdXAsIHdlIGRvbid0XG4gIC8vIHJlZXZhbHVhdGUgY2hpbGQgbWFya3MgbXVsdGlwbGUgdGltZXMuIFxuICBpZiAodGhpcy5fdXBkYXRlZCkgaW5wdXQuc2NhbGVzW3RoaXMuX2RlZi5uYW1lXSA9IDE7XG4gIHJldHVybiBjaGFuZ2VzZXQuY3JlYXRlKGlucHV0LCB0cnVlKTtcbn07XG5cbi8vIEFsbCBvZiBhIHNjYWxlJ3MgZGVwZW5kZW5jaWVzIGFyZSByZWdpc3RlcmVkIGR1cmluZyBwcm9wYWdhdGlvbiBhcyB3ZSBwYXJzZVxuLy8gZGF0YVJlZnMuIFNvIGEgc2NhbGUgbXVzdCBiZSByZXNwb25zaWJsZSBmb3IgY29ubmVjdGluZyBpdHNlbGYgdG8gZGVwZW5kZW50cy5cbnByb3RvLmRlcGVuZGVuY3kgPSBmdW5jdGlvbih0eXBlLCBkZXBzKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDIpIHtcbiAgICBkZXBzID0gZGwuYXJyYXkoZGVwcyk7XG4gICAgZm9yKHZhciBpPTAsIGxlbj1kZXBzLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgICAgdGhpcy5fZ3JhcGhbdHlwZSA9PSBDLkRBVEEgPyBDLkRBVEEgOiBDLlNJR05BTF0oZGVwc1tpXSlcbiAgICAgICAgLmFkZExpc3RlbmVyKHRoaXMuX3BhcmVudCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE5vZGUucHJvdG90eXBlLmRlcGVuZGVuY3kuY2FsbCh0aGlzLCB0eXBlLCBkZXBzKTtcbn07XG5cbmZ1bmN0aW9uIHNjYWxlKGdyb3VwKSB7XG4gIHZhciBuYW1lID0gdGhpcy5fZGVmLm5hbWUsXG4gICAgICBwcmV2ID0gbmFtZSArIFwiOnByZXZcIixcbiAgICAgIHMgPSBpbnN0YW5jZS5jYWxsKHRoaXMsIGdyb3VwLnNjYWxlKG5hbWUpKSxcbiAgICAgIG0gPSBzLnR5cGU9PT1DLk9SRElOQUwgPyBvcmRpbmFsIDogcXVhbnRpdGF0aXZlLFxuICAgICAgcm5nID0gcmFuZ2UuY2FsbCh0aGlzLCBncm91cCk7XG5cbiAgbS5jYWxsKHRoaXMsIHMsIHJuZywgZ3JvdXApO1xuXG4gIGdyb3VwLnNjYWxlKG5hbWUsIHMpO1xuICBncm91cC5zY2FsZShwcmV2LCBncm91cC5zY2FsZShwcmV2KSB8fCBzKTtcblxuICByZXR1cm4gcztcbn1cblxuZnVuY3Rpb24gaW5zdGFuY2Uoc2NhbGUpIHtcbiAgdmFyIHR5cGUgPSB0aGlzLl9kZWYudHlwZSB8fCBDLkxJTkVBUjtcbiAgaWYgKCFzY2FsZSB8fCB0eXBlICE9PSBzY2FsZS50eXBlKSB7XG4gICAgdmFyIGN0b3IgPSBjb25maWcuc2NhbGVbdHlwZV0gfHwgZDMuc2NhbGVbdHlwZV07XG4gICAgaWYgKCFjdG9yKSBkbC5lcnJvcihcIlVucmVjb2duaXplZCBzY2FsZSB0eXBlOiBcIiArIHR5cGUpO1xuICAgIChzY2FsZSA9IGN0b3IoKSkudHlwZSA9IHNjYWxlLnR5cGUgfHwgdHlwZTtcbiAgICBzY2FsZS5zY2FsZU5hbWUgPSB0aGlzLl9kZWYubmFtZTtcbiAgICBzY2FsZS5fcHJldiA9IHt9O1xuICB9XG4gIHJldHVybiBzY2FsZTtcbn1cblxuZnVuY3Rpb24gb3JkaW5hbChzY2FsZSwgcm5nLCBncm91cCkge1xuICB2YXIgZGVmID0gdGhpcy5fZGVmLFxuICAgICAgcHJldiA9IHNjYWxlLl9wcmV2LFxuICAgICAgZG9tYWluLCBzb3J0LCBzdHIsIHJlZnMsIGRhdGFEcml2ZW5SYW5nZSA9IGZhbHNlO1xuICBcbiAgLy8gcmFuZ2UgcHJlLXByb2Nlc3NpbmcgZm9yIGRhdGEtZHJpdmVuIHJhbmdlc1xuICBpZiAoZGwuaXNPYmplY3QoZGVmLnJhbmdlKSAmJiAhZGwuaXNBcnJheShkZWYucmFuZ2UpKSB7XG4gICAgZGF0YURyaXZlblJhbmdlID0gdHJ1ZTtcbiAgICBybmcgPSBkYXRhUmVmLmNhbGwodGhpcywgQy5SQU5HRSwgZGVmLnJhbmdlLCBzY2FsZSwgZ3JvdXApO1xuICB9XG4gIFxuICAvLyBkb21haW5cbiAgZG9tYWluID0gZGF0YVJlZi5jYWxsKHRoaXMsIEMuRE9NQUlOLCBkZWYuZG9tYWluLCBzY2FsZSwgZ3JvdXApO1xuICBpZiAoZG9tYWluICYmICFkbC5lcXVhbChwcmV2LmRvbWFpbiwgZG9tYWluKSkge1xuICAgIHNjYWxlLmRvbWFpbihkb21haW4pO1xuICAgIHByZXYuZG9tYWluID0gZG9tYWluO1xuICAgIHRoaXMuX3VwZGF0ZWQgPSB0cnVlO1xuICB9IFxuXG4gIC8vIHJhbmdlXG4gIGlmIChkbC5lcXVhbChwcmV2LnJhbmdlLCBybmcpKSByZXR1cm47XG5cbiAgc3RyID0gdHlwZW9mIHJuZ1swXSA9PT0gJ3N0cmluZyc7XG4gIGlmIChzdHIgfHwgcm5nLmxlbmd0aCA+IDIgfHwgcm5nLmxlbmd0aD09PTEgfHwgZGF0YURyaXZlblJhbmdlKSB7XG4gICAgc2NhbGUucmFuZ2Uocm5nKTsgLy8gY29sb3Igb3Igc2hhcGUgdmFsdWVzXG4gIH0gZWxzZSBpZiAoZGVmLnBvaW50cykge1xuICAgIHNjYWxlLnJhbmdlUG9pbnRzKHJuZywgZGVmLnBhZGRpbmd8fDApO1xuICB9IGVsc2UgaWYgKGRlZi5yb3VuZCB8fCBkZWYucm91bmQ9PT11bmRlZmluZWQpIHtcbiAgICBzY2FsZS5yYW5nZVJvdW5kQmFuZHMocm5nLCBkZWYucGFkZGluZ3x8MCk7XG4gIH0gZWxzZSB7XG4gICAgc2NhbGUucmFuZ2VCYW5kcyhybmcsIGRlZi5wYWRkaW5nfHwwKTtcbiAgfVxuXG4gIHByZXYucmFuZ2UgPSBybmc7XG4gIHRoaXMuX3VwZGF0ZWQgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBxdWFudGl0YXRpdmUoc2NhbGUsIHJuZywgZ3JvdXApIHtcbiAgdmFyIGRlZiA9IHRoaXMuX2RlZixcbiAgICAgIHByZXYgPSBzY2FsZS5fcHJldixcbiAgICAgIGRvbWFpbiwgaW50ZXJ2YWw7XG5cbiAgLy8gZG9tYWluXG4gIGRvbWFpbiA9IChkZWYudHlwZSA9PT0gQy5RVUFOVElMRSlcbiAgICA/IGRhdGFSZWYuY2FsbCh0aGlzLCBDLkRPTUFJTiwgZGVmLmRvbWFpbiwgc2NhbGUsIGdyb3VwKVxuICAgIDogZG9tYWluTWluTWF4LmNhbGwodGhpcywgc2NhbGUsIGdyb3VwKTtcbiAgaWYgKGRvbWFpbiAmJiAhZGwuZXF1YWwocHJldi5kb21haW4sIGRvbWFpbikpIHtcbiAgICBzY2FsZS5kb21haW4oZG9tYWluKTtcbiAgICBwcmV2LmRvbWFpbiA9IGRvbWFpbjtcbiAgICB0aGlzLl91cGRhdGVkID0gdHJ1ZTtcbiAgfSBcblxuICAvLyByYW5nZVxuICAvLyB2ZXJ0aWNhbCBzY2FsZXMgc2hvdWxkIGZsaXAgYnkgZGVmYXVsdCwgc28gdXNlIFhPUiBoZXJlXG4gIGlmIChkZWYucmFuZ2UgPT09IFwiaGVpZ2h0XCIpIHJuZyA9IHJuZy5yZXZlcnNlKCk7XG4gIGlmIChkbC5lcXVhbChwcmV2LnJhbmdlLCBybmcpKSByZXR1cm47XG4gIHNjYWxlW2RlZi5yb3VuZCAmJiBzY2FsZS5yYW5nZVJvdW5kID8gXCJyYW5nZVJvdW5kXCIgOiBcInJhbmdlXCJdKHJuZyk7XG4gIHByZXYucmFuZ2UgPSBybmc7XG4gIHRoaXMuX3VwZGF0ZWQgPSB0cnVlO1xuXG4gIC8vIFRPRE86IFN1cHBvcnQgc2lnbmFscyBmb3IgdGhlc2UgcHJvcGVydGllcy4gVW50aWwgdGhlbiwgb25seSBldmFsXG4gIC8vIHRoZW0gb25jZS5cbiAgaWYgKHRoaXMuX3N0YW1wID4gMCkgcmV0dXJuO1xuICBpZiAoZGVmLmV4cG9uZW50ICYmIGRlZi50eXBlPT09Qy5QT1dFUikgc2NhbGUuZXhwb25lbnQoZGVmLmV4cG9uZW50KTtcbiAgaWYgKGRlZi5jbGFtcCkgc2NhbGUuY2xhbXAodHJ1ZSk7XG4gIGlmIChkZWYubmljZSkge1xuICAgIGlmIChkZWYudHlwZSA9PT0gQy5USU1FKSB7XG4gICAgICBpbnRlcnZhbCA9IGQzLnRpbWVbZGVmLm5pY2VdO1xuICAgICAgaWYgKCFpbnRlcnZhbCkgZGwuZXJyb3IoXCJVbnJlY29nbml6ZWQgaW50ZXJ2YWw6IFwiICsgaW50ZXJ2YWwpO1xuICAgICAgc2NhbGUubmljZShpbnRlcnZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjYWxlLm5pY2UoKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZGF0YVJlZih3aGljaCwgZGVmLCBzY2FsZSwgZ3JvdXApIHtcbiAgaWYgKGRsLmlzQXJyYXkoZGVmKSkgcmV0dXJuIGRlZi5tYXAoc2lnbmFsLmJpbmQodGhpcykpO1xuXG4gIHZhciBzZWxmID0gdGhpcywgZ3JhcGggPSB0aGlzLl9ncmFwaCxcbiAgICAgIHJlZnMgPSBkZWYuZmllbGRzIHx8IGRsLmFycmF5KGRlZiksXG4gICAgICB1bmlxdWVzID0gc2NhbGUudHlwZSA9PT0gQy5PUkRJTkFMIHx8IHNjYWxlLnR5cGUgPT09IEMuUVVBTlRJTEUsXG4gICAgICBjayA9IFwiX1wiK3doaWNoLFxuICAgICAgY2FjaGUgPSBzY2FsZVtja10sXG4gICAgICBjYWNoZUZpZWxkID0ge29wczogW119LCAgLy8gdGhlIGZpZWxkIGFuZCBtZWFzdXJlcyBpbiB0aGUgYWdncmVnYXRvclxuICAgICAgc29ydCA9IGRlZi5zb3J0LFxuICAgICAgaSwgcmxlbiwgaiwgZmxlbiwgciwgZmllbGRzLCBmcm9tLCBkYXRhLCBrZXlzO1xuXG4gIGlmKCFjYWNoZSkge1xuICAgIGNhY2hlID0gc2NhbGVbY2tdID0gbmV3IEFnZ3JlZ2F0ZShncmFwaCk7XG4gICAgY2FjaGVGaWVsZC5vcHMgPSBbXTtcbiAgICBjYWNoZS5zaW5nbGV0b24odHJ1ZSk7XG4gICAgaWYodW5pcXVlcyAmJiBzb3J0KSBjYWNoZUZpZWxkLm9wcy5wdXNoKHNvcnQuc3RhdCk7XG4gIH1cblxuICBmb3IoaT0wLCBybGVuPXJlZnMubGVuZ3RoOyBpPHJsZW47ICsraSkge1xuICAgIHIgPSByZWZzW2ldO1xuICAgIGZyb20gPSByLmRhdGEgfHwgXCJ2Z19cIitncm91cC5kYXR1bS5faWQ7XG4gICAgZGF0YSA9IGdyYXBoLmRhdGEoZnJvbSlcbiAgICAgIC5yZXZpc2VzKHRydWUpXG4gICAgICAubGFzdCgpO1xuXG4gICAgaWYgKGRhdGEuc3RhbXAgPD0gdGhpcy5fc3RhbXApIGNvbnRpbnVlO1xuXG4gICAgZmllbGRzID0gZGwuYXJyYXkoci5maWVsZCkubWFwKGZ1bmN0aW9uKGYpIHtcbiAgICAgIGlmIChmLnBhcmVudCkgcmV0dXJuIGRsLmFjY2Vzc29yKGYucGFyZW50KShncm91cC5kYXR1bSlcbiAgICAgIHJldHVybiBmOyAvLyBTdHJpbmcgb3Ige1wic2lnbmFsXCJ9XG4gICAgfSk7XG5cbiAgICBpZih1bmlxdWVzKSB7XG4gICAgICBjYWNoZUZpZWxkLm5hbWUgPSBzb3J0ID8gc29ydC5maWVsZCA6IFwiX2lkXCI7XG4gICAgICBjYWNoZS5maWVsZHMuc2V0KGNhY2hlLCBbY2FjaGVGaWVsZF0pO1xuICAgICAgZm9yKGo9MCwgZmxlbj1maWVsZHMubGVuZ3RoOyBqPGZsZW47ICsraikge1xuICAgICAgICBjYWNoZS5ncm91cF9ieS5zZXQoY2FjaGUsIGZpZWxkc1tqXSlcbiAgICAgICAgICAuZXZhbHVhdGUoZGF0YSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvcihqPTAsIGZsZW49ZmllbGRzLmxlbmd0aDsgajxmbGVuOyArK2opIHtcbiAgICAgICAgY2FjaGVGaWVsZC5uYW1lID0gZmllbGRzW2pdO1xuICAgICAgICBjYWNoZUZpZWxkLm9wcyAgPSBbQy5NSU4sIEMuTUFYXTtcbiAgICAgICAgY2FjaGUuZmllbGRzLnNldChjYWNoZSwgW2NhY2hlRmllbGRdKSAvLyBUcmVhdCBhcyBmbGF0IGRhdGFzb3VyY2VcbiAgICAgICAgICAuZXZhbHVhdGUoZGF0YSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5kZXBlbmRlbmN5KEMuREFUQSwgZnJvbSk7XG4gICAgY2FjaGUuZGVwZW5kZW5jeShDLlNJR05BTFMpLmZvckVhY2goZnVuY3Rpb24ocykgeyBzZWxmLmRlcGVuZGVuY3koQy5TSUdOQUxTLCBzKSB9KTtcbiAgfVxuXG4gIGRhdGEgPSBjYWNoZS5kYXRhKCk7XG4gIGlmICh1bmlxdWVzKSB7XG4gICAga2V5cyA9IGRsLmtleXMoZGF0YSlcbiAgICAgIC5maWx0ZXIoZnVuY3Rpb24oaykgeyByZXR1cm4gZGF0YVtrXSAhPSBudWxsOyB9KTtcblxuICAgIGlmIChzb3J0KSB7XG4gICAgICBzb3J0ID0gc29ydC5vcmRlci5zaWduYWwgPyBncmFwaC5zaWduYWxSZWYoc29ydC5vcmRlci5zaWduYWwpIDogc29ydC5vcmRlcjtcbiAgICAgIHNvcnQgPSAoc29ydCA9PSBDLkRFU0MgPyBcIi1cIiA6IFwiK1wiKSArIFwidHBsLlwiICsgY2FjaGVGaWVsZC5uYW1lO1xuICAgICAgc29ydCA9IGRsLmNvbXBhcmF0b3Ioc29ydCk7XG4gICAgICBrZXlzID0ga2V5cy5tYXAoZnVuY3Rpb24oaykgeyByZXR1cm4geyBrZXk6IGssIHRwbDogZGF0YVtrXS50cGwgfX0pXG4gICAgICAgIC5zb3J0KHNvcnQpXG4gICAgICAgIC5tYXAoZnVuY3Rpb24oaykgeyByZXR1cm4gay5rZXk7IH0pO1xuICAgIC8vIH0gZWxzZSB7ICAvLyBcIkZpcnN0IHNlZW5cIiBvcmRlclxuICAgIC8vICAgc29ydCA9IGRsLmNvbXBhcmF0b3IoXCJ0cGwuX2lkXCIpO1xuICAgIH1cblxuICAgIHJldHVybiBrZXlzO1xuICB9IGVsc2Uge1xuICAgIGRhdGEgPSBkYXRhW1wiXCJdOyAvLyBVbnBhY2sgZmxhdCBhZ2dyZWdhdGlvblxuICAgIHJldHVybiAoZGF0YSA9PT0gbnVsbCkgPyBbXSA6IFtkYXRhW0MuU0lOR0xFVE9OXS5taW4sIGRhdGFbQy5TSU5HTEVUT05dLm1heF07XG4gIH1cbn1cblxuZnVuY3Rpb24gc2lnbmFsKHYpIHtcbiAgdmFyIHMgPSB2LnNpZ25hbCwgcmVmO1xuICBpZiAoIXMpIHJldHVybiB2O1xuICB0aGlzLmRlcGVuZGVuY3koQy5TSUdOQUxTLCAocmVmID0gZGwuZmllbGQocykpWzBdKTtcbiAgcmV0dXJuIHRoaXMuX2dyYXBoLnNpZ25hbFJlZihyZWYpO1xufVxuXG5mdW5jdGlvbiBkb21haW5NaW5NYXgoc2NhbGUsIGdyb3VwKSB7XG4gIHZhciBkZWYgPSB0aGlzLl9kZWYsXG4gICAgICBkb21haW4gPSBbbnVsbCwgbnVsbF0sIHJlZnMsIHo7XG5cbiAgaWYgKGRlZi5kb21haW4gIT09IHVuZGVmaW5lZCkge1xuICAgIGRvbWFpbiA9ICghZGwuaXNPYmplY3QoZGVmLmRvbWFpbikpID8gZG9tYWluIDpcbiAgICAgIGRhdGFSZWYuY2FsbCh0aGlzLCBDLkRPTUFJTiwgZGVmLmRvbWFpbiwgc2NhbGUsIGdyb3VwKTtcbiAgfVxuXG4gIHogPSBkb21haW4ubGVuZ3RoIC0gMTtcbiAgaWYgKGRlZi5kb21haW5NaW4gIT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChkbC5pc09iamVjdChkZWYuZG9tYWluTWluKSkge1xuICAgICAgaWYgKGRlZi5kb21haW5NaW4uc2lnbmFsKSB7XG4gICAgICAgIGRvbWFpblswXSA9IHNpZ25hbC5jYWxsKHRoaXMsIGRlZi5kb21haW5NaW4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9tYWluWzBdID0gZGF0YVJlZi5jYWxsKHRoaXMsIEMuRE9NQUlOK0MuTUlOLCBkZWYuZG9tYWluTWluLCBzY2FsZSwgZ3JvdXApWzBdO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBkb21haW5bMF0gPSBkZWYuZG9tYWluTWluO1xuICAgIH1cbiAgfVxuICBpZiAoZGVmLmRvbWFpbk1heCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGRsLmlzT2JqZWN0KGRlZi5kb21haW5NYXgpKSB7XG4gICAgICBpZiAoZGVmLmRvbWFpbk1heC5zaWduYWwpIHtcbiAgICAgICAgZG9tYWluW3pdID0gc2lnbmFsLmNhbGwodGhpcywgZGVmLmRvbWFpbk1heCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb21haW5bel0gPSBkYXRhUmVmLmNhbGwodGhpcywgQy5ET01BSU4rQy5NQVgsIGRlZi5kb21haW5NYXgsIHNjYWxlLCBncm91cClbMV07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvbWFpblt6XSA9IGRlZi5kb21haW5NYXg7XG4gICAgfVxuICB9XG4gIGlmIChkZWYudHlwZSAhPT0gQy5MT0cgJiYgZGVmLnR5cGUgIT09IEMuVElNRSAmJiAoZGVmLnplcm8gfHwgZGVmLnplcm89PT11bmRlZmluZWQpKSB7XG4gICAgZG9tYWluWzBdID0gTWF0aC5taW4oMCwgZG9tYWluWzBdKTtcbiAgICBkb21haW5bel0gPSBNYXRoLm1heCgwLCBkb21haW5bel0pO1xuICB9XG4gIHJldHVybiBkb21haW47XG59XG5cbmZ1bmN0aW9uIHJhbmdlKGdyb3VwKSB7XG4gIHZhciBkZWYgPSB0aGlzLl9kZWYsXG4gICAgICBybmcgPSBbbnVsbCwgbnVsbF07XG5cbiAgaWYgKGRlZi5yYW5nZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiBkZWYucmFuZ2UgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAoR1JPVVBfUFJPUEVSVFlbZGVmLnJhbmdlXSkge1xuICAgICAgICBybmcgPSBbMCwgZ3JvdXBbZGVmLnJhbmdlXV07XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5yYW5nZVtkZWYucmFuZ2VdKSB7XG4gICAgICAgIHJuZyA9IGNvbmZpZy5yYW5nZVtkZWYucmFuZ2VdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGwuZXJyb3IoXCJVbnJlY29naXplZCByYW5nZTogXCIrZGVmLnJhbmdlKTtcbiAgICAgICAgcmV0dXJuIHJuZztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGRsLmlzQXJyYXkoZGVmLnJhbmdlKSkge1xuICAgICAgcm5nID0gZGVmLnJhbmdlLm1hcChzaWduYWwuYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIGlmIChkbC5pc09iamVjdChkZWYucmFuZ2UpKSB7XG4gICAgICByZXR1cm4gbnVsbDsgLy8gZWFybHkgZXhpdFxuICAgIH0gZWxzZSB7XG4gICAgICBybmcgPSBbMCwgZGVmLnJhbmdlXTtcbiAgICB9XG4gIH1cbiAgaWYgKGRlZi5yYW5nZU1pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcm5nWzBdID0gZGVmLnJhbmdlTWluLnNpZ25hbCA/IHNpZ25hbC5jYWxsKHRoaXMsIGRlZi5yYW5nZU1pbikgOiBkZWYucmFuZ2VNaW47XG4gIH1cbiAgaWYgKGRlZi5yYW5nZU1heCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcm5nW3JuZy5sZW5ndGgtMV0gPSBkZWYucmFuZ2VNYXguc2lnbmFsID8gc2lnbmFsLmNhbGwodGhpcywgZGVmLnJhbmdlTWF4KSA6IGRlZi5yYW5nZU1heDtcbiAgfVxuICBcbiAgaWYgKGRlZi5yZXZlcnNlICE9PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgcmV2ID0gZGVmLnJldmVyc2U7XG4gICAgaWYgKGRsLmlzT2JqZWN0KHJldikpIHtcbiAgICAgIHJldiA9IGRsLmFjY2Vzc29yKHJldi5maWVsZCkoZ3JvdXAuZGF0dW0pO1xuICAgIH1cbiAgICBpZiAocmV2KSBybmcgPSBybmcucmV2ZXJzZSgpO1xuICB9XG4gIFxuICByZXR1cm4gcm5nO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNjYWxlOyIsInZhciB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyksXG4gICAgY2FsY0JvdW5kcyA9IHJlcXVpcmUoJy4uL3V0aWwvYm91bmRzJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIFRyYW5zaXRpb24oZHVyYXRpb24sIGVhc2UpIHtcbiAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uIHx8IDUwMDtcbiAgdGhpcy5lYXNlID0gZWFzZSAmJiBkMy5lYXNlKGVhc2UpIHx8IGQzLmVhc2UoXCJjdWJpYy1pbi1vdXRcIik7XG4gIHRoaXMudXBkYXRlcyA9IHtuZXh0OiBudWxsfTtcbn1cblxudmFyIHByb3RvdHlwZSA9IFRyYW5zaXRpb24ucHJvdG90eXBlO1xuXG52YXIgc2tpcCA9IHtcbiAgXCJ0ZXh0XCI6IDEsXG4gIFwidXJsXCI6ICAxXG59O1xuXG5wcm90b3R5cGUuaW50ZXJwb2xhdGUgPSBmdW5jdGlvbihpdGVtLCB2YWx1ZXMsIHN0YW1wKSB7XG4gIHZhciBrZXksIGN1cnIsIG5leHQsIGludGVycCwgbGlzdCA9IG51bGw7XG5cbiAgZm9yIChrZXkgaW4gdmFsdWVzKSB7XG4gICAgY3VyciA9IGl0ZW1ba2V5XTtcbiAgICBuZXh0ID0gdmFsdWVzW2tleV07ICAgICAgXG4gICAgaWYgKGN1cnIgIT09IG5leHQpIHtcbiAgICAgIGlmIChza2lwW2tleV0gfHwgY3VyciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIHNraXAgaW50ZXJwb2xhdGlvbiBmb3Igc3BlY2lmaWMga2V5cyBvciB1bmRlZmluZWQgc3RhcnQgdmFsdWVzXG4gICAgICAgIHR1cGxlLnNldChpdGVtLCBrZXksIG5leHQpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY3VyciA9PT0gXCJudW1iZXJcIiAmJiAhaXNGaW5pdGUoY3VycikpIHtcbiAgICAgICAgLy8gZm9yIE5hTiBvciBpbmZpbml0ZSBudW1lcmljIHZhbHVlcywgc2tpcCB0byBmaW5hbCB2YWx1ZVxuICAgICAgICB0dXBsZS5zZXQoaXRlbSwga2V5LCBuZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG90aGVyd2lzZSBsb29rdXAgaW50ZXJwb2xhdG9yXG4gICAgICAgIGludGVycCA9IGQzLmludGVycG9sYXRlKGN1cnIsIG5leHQpO1xuICAgICAgICBpbnRlcnAucHJvcGVydHkgPSBrZXk7XG4gICAgICAgIChsaXN0IHx8IChsaXN0PVtdKSkucHVzaChpbnRlcnApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChsaXN0ID09PSBudWxsICYmIGl0ZW0uc3RhdHVzID09PSBDLkVYSVQpIHtcbiAgICBsaXN0ID0gW107IC8vIGVuc3VyZSBleGl0aW5nIGl0ZW1zIGFyZSBpbmNsdWRlZFxuICB9XG5cbiAgaWYgKGxpc3QgIT0gbnVsbCkge1xuICAgIGxpc3QuaXRlbSA9IGl0ZW07XG4gICAgbGlzdC5lYXNlID0gaXRlbS5tYXJrLmVhc2UgfHwgdGhpcy5lYXNlO1xuICAgIGxpc3QubmV4dCA9IHRoaXMudXBkYXRlcy5uZXh0O1xuICAgIHRoaXMudXBkYXRlcy5uZXh0ID0gbGlzdDtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHZhciB0ID0gdGhpcywgcHJldiA9IHQudXBkYXRlcywgY3VyciA9IHByZXYubmV4dDtcbiAgZm9yICg7IGN1cnIhPW51bGw7IHByZXY9Y3VyciwgY3Vycj1wcmV2Lm5leHQpIHtcbiAgICBpZiAoY3Vyci5pdGVtLnN0YXR1cyA9PT0gQy5FWElUKSBjdXJyLnJlbW92ZSA9IHRydWU7XG4gIH1cbiAgdC5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICBkMy50aW1lcihmdW5jdGlvbihlbGFwc2VkKSB7IHJldHVybiBzdGVwLmNhbGwodCwgZWxhcHNlZCk7IH0pO1xufTtcblxuZnVuY3Rpb24gc3RlcChlbGFwc2VkKSB7XG4gIHZhciBsaXN0ID0gdGhpcy51cGRhdGVzLCBwcmV2ID0gbGlzdCwgY3VyciA9IHByZXYubmV4dCxcbiAgICAgIGR1cmF0aW9uID0gdGhpcy5kdXJhdGlvbixcbiAgICAgIGl0ZW0sIGRlbGF5LCBmLCBlLCBpLCBuLCBzdG9wID0gdHJ1ZTtcblxuICBmb3IgKDsgY3VyciE9bnVsbDsgcHJldj1jdXJyLCBjdXJyPXByZXYubmV4dCkge1xuICAgIGl0ZW0gPSBjdXJyLml0ZW07XG4gICAgZGVsYXkgPSBpdGVtLmRlbGF5IHx8IDA7XG5cbiAgICBmID0gKGVsYXBzZWQgLSBkZWxheSkgLyBkdXJhdGlvbjtcbiAgICBpZiAoZiA8IDApIHsgc3RvcCA9IGZhbHNlOyBjb250aW51ZTsgfVxuICAgIGlmIChmID4gMSkgZiA9IDE7XG4gICAgZSA9IGN1cnIuZWFzZShmKTtcblxuICAgIGZvciAoaT0wLCBuPWN1cnIubGVuZ3RoOyBpPG47ICsraSkge1xuICAgICAgaXRlbVtjdXJyW2ldLnByb3BlcnR5XSA9IGN1cnJbaV0oZSk7XG4gICAgfVxuICAgIGl0ZW0udG91Y2goKTtcbiAgICBjYWxjQm91bmRzLml0ZW0oaXRlbSk7XG5cbiAgICBpZiAoZiA9PT0gMSkge1xuICAgICAgaWYgKGN1cnIucmVtb3ZlKSBpdGVtLnJlbW92ZSgpO1xuICAgICAgcHJldi5uZXh0ID0gY3Vyci5uZXh0O1xuICAgICAgY3VyciA9IHByZXY7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0b3AgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICB0aGlzLmNhbGxiYWNrKCk7XG4gIHJldHVybiBzdG9wO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2l0aW9uOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBjb25maWcgPSByZXF1aXJlKCcuLi91dGlsL2NvbmZpZycpLFxuICAgIHRwbCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyksXG4gICAgcGFyc2VNYXJrID0gcmVxdWlyZSgnLi4vcGFyc2UvbWFyaycpO1xuXG5mdW5jdGlvbiBheHMobW9kZWwpIHtcbiAgdmFyIHNjYWxlLFxuICAgICAgb3JpZW50ID0gY29uZmlnLmF4aXMub3JpZW50LFxuICAgICAgb2Zmc2V0ID0gMCxcbiAgICAgIHRpdGxlT2Zmc2V0ID0gY29uZmlnLmF4aXMudGl0bGVPZmZzZXQsXG4gICAgICBheGlzRGVmID0ge30sXG4gICAgICBsYXllciA9IFwiZnJvbnRcIixcbiAgICAgIGdyaWQgPSBmYWxzZSxcbiAgICAgIHRpdGxlID0gbnVsbCxcbiAgICAgIHRpY2tNYWpvclNpemUgPSBjb25maWcuYXhpcy50aWNrU2l6ZSxcbiAgICAgIHRpY2tNaW5vclNpemUgPSBjb25maWcuYXhpcy50aWNrU2l6ZSxcbiAgICAgIHRpY2tFbmRTaXplID0gY29uZmlnLmF4aXMudGlja1NpemUsXG4gICAgICB0aWNrUGFkZGluZyA9IGNvbmZpZy5heGlzLnBhZGRpbmcsXG4gICAgICB0aWNrVmFsdWVzID0gbnVsbCxcbiAgICAgIHRpY2tGb3JtYXRTdHJpbmcgPSBudWxsLFxuICAgICAgdGlja0Zvcm1hdCA9IG51bGwsXG4gICAgICB0aWNrU3ViZGl2aWRlID0gMCxcbiAgICAgIHRpY2tBcmd1bWVudHMgPSBbY29uZmlnLmF4aXMudGlja3NdLFxuICAgICAgZ3JpZExpbmVTdHlsZSA9IHt9LFxuICAgICAgdGlja0xhYmVsU3R5bGUgPSB7fSxcbiAgICAgIG1ham9yVGlja1N0eWxlID0ge30sXG4gICAgICBtaW5vclRpY2tTdHlsZSA9IHt9LFxuICAgICAgdGl0bGVTdHlsZSA9IHt9LFxuICAgICAgZG9tYWluU3R5bGUgPSB7fSxcbiAgICAgIG0gPSB7IC8vIEF4aXMgbWFya3MgYXMgcmVmZXJlbmNlcyBmb3IgdXBkYXRlc1xuICAgICAgICBncmlkTGluZXM6IG51bGwsXG4gICAgICAgIG1ham9yVGlja3M6IG51bGwsXG4gICAgICAgIG1pbm9yVGlja3M6IG51bGwsXG4gICAgICAgIHRpY2tMYWJlbHM6IG51bGwsXG4gICAgICAgIGRvbWFpbjogbnVsbCxcbiAgICAgICAgdGl0bGU6IG51bGxcbiAgICAgIH07XG5cbiAgdmFyIGF4aXMgPSB7fTtcblxuICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICBheGlzRGVmLnR5cGUgPSBudWxsO1xuICB9O1xuXG4gIGF4aXMuZGVmID0gZnVuY3Rpb24oKSB7XG4gICAgaWYoIWF4aXNEZWYudHlwZSkgYXhpc19kZWYoc2NhbGUpO1xuXG4gICAgLy8gdGljayBmb3JtYXRcbiAgICB0aWNrRm9ybWF0ID0gIXRpY2tGb3JtYXRTdHJpbmcgPyBudWxsIDogKChzY2FsZS50eXBlID09PSAndGltZScpXG4gICAgICA/IGQzLnRpbWUuZm9ybWF0KHRpY2tGb3JtYXRTdHJpbmcpXG4gICAgICA6IGQzLmZvcm1hdCh0aWNrRm9ybWF0U3RyaW5nKSk7XG5cbiAgICAvLyBnZW5lcmF0ZSBkYXRhXG4gICAgLy8gV2UgZG9uJ3QgX3JlYWxseV8gbmVlZCB0byBtb2RlbCB0aGVzZSBhcyB0dXBsZXMgYXMgbm8gZnVydGhlclxuICAgIC8vIGRhdGEgdHJhbnNmb3JtYXRpb24gaXMgZG9uZS4gU28gd2Ugb3B0aW1pemUgZm9yIGEgaGlnaCBjaHVybiByYXRlLiBcbiAgICB2YXIgaW5qZXN0ID0gZnVuY3Rpb24oZCkgeyByZXR1cm4ge2RhdGE6IGR9OyB9O1xuICAgIHZhciBtYWpvciA9IHRpY2tWYWx1ZXMgPT0gbnVsbFxuICAgICAgPyAoc2NhbGUudGlja3MgPyBzY2FsZS50aWNrcy5hcHBseShzY2FsZSwgdGlja0FyZ3VtZW50cykgOiBzY2FsZS5kb21haW4oKSlcbiAgICAgIDogdGlja1ZhbHVlcztcbiAgICB2YXIgbWlub3IgPSB2Z19heGlzU3ViZGl2aWRlKHNjYWxlLCBtYWpvciwgdGlja1N1YmRpdmlkZSkubWFwKGluamVzdCk7XG4gICAgbWFqb3IgPSBtYWpvci5tYXAoaW5qZXN0KTtcbiAgICB2YXIgZm10ID0gdGlja0Zvcm1hdD09bnVsbCA/IChzY2FsZS50aWNrRm9ybWF0ID8gc2NhbGUudGlja0Zvcm1hdC5hcHBseShzY2FsZSwgdGlja0FyZ3VtZW50cykgOiBTdHJpbmcpIDogdGlja0Zvcm1hdDtcbiAgICBtYWpvci5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgZC5sYWJlbCA9IGZtdChkLmRhdGEpOyB9KTtcbiAgICB2YXIgdGRhdGEgPSB0aXRsZSA/IFt0aXRsZV0ubWFwKGluamVzdCkgOiBbXTtcblxuICAgIGF4aXNEZWYubWFya3NbMF0uZnJvbSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gZ3JpZCA/IG1ham9yIDogW107IH07XG4gICAgYXhpc0RlZi5tYXJrc1sxXS5mcm9tID0gZnVuY3Rpb24oKSB7IHJldHVybiBtYWpvcjsgfTtcbiAgICBheGlzRGVmLm1hcmtzWzJdLmZyb20gPSBmdW5jdGlvbigpIHsgcmV0dXJuIG1pbm9yOyB9O1xuICAgIGF4aXNEZWYubWFya3NbM10uZnJvbSA9IGF4aXNEZWYubWFya3NbMV0uZnJvbTtcbiAgICBheGlzRGVmLm1hcmtzWzRdLmZyb20gPSBmdW5jdGlvbigpIHsgcmV0dXJuIFsxXTsgfTtcbiAgICBheGlzRGVmLm1hcmtzWzVdLmZyb20gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRkYXRhOyB9O1xuICAgIGF4aXNEZWYub2Zmc2V0ID0gb2Zmc2V0O1xuICAgIGF4aXNEZWYub3JpZW50ID0gb3JpZW50O1xuICAgIGF4aXNEZWYubGF5ZXIgPSBsYXllcjtcbiAgICByZXR1cm4gYXhpc0RlZjtcbiAgfTtcblxuICBmdW5jdGlvbiBheGlzX2RlZihzY2FsZSkge1xuICAgIC8vIHNldHVwIHNjYWxlIG1hcHBpbmdcbiAgICB2YXIgbmV3U2NhbGUsIG9sZFNjYWxlLCByYW5nZTtcbiAgICBpZiAoc2NhbGUudHlwZSA9PT0gXCJvcmRpbmFsXCIpIHtcbiAgICAgIG5ld1NjYWxlID0ge3NjYWxlOiBzY2FsZS5zY2FsZU5hbWUsIG9mZnNldDogMC41ICsgc2NhbGUucmFuZ2VCYW5kKCkvMn07XG4gICAgICBvbGRTY2FsZSA9IG5ld1NjYWxlO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdTY2FsZSA9IHtzY2FsZTogc2NhbGUuc2NhbGVOYW1lLCBvZmZzZXQ6IDAuNX07XG4gICAgICBvbGRTY2FsZSA9IHtzY2FsZTogc2NhbGUuc2NhbGVOYW1lK1wiOnByZXZcIiwgb2Zmc2V0OiAwLjV9O1xuICAgIH1cbiAgICByYW5nZSA9IHZnX2F4aXNTY2FsZVJhbmdlKHNjYWxlKTtcblxuICAgIC8vIHNldHVwIGF4aXMgbWFya3NcbiAgICBpZiAoIW0uZ3JpZExpbmVzKSAgbS5ncmlkTGluZXMgID0gdmdfYXhpc1RpY2tzKCk7XG4gICAgaWYgKCFtLm1ham9yVGlja3MpIG0ubWFqb3JUaWNrcyA9IHZnX2F4aXNUaWNrcygpO1xuICAgIGlmICghbS5taW5vclRpY2tzKSBtLm1pbm9yVGlja3MgPSB2Z19heGlzVGlja3MoKTtcbiAgICBpZiAoIW0udGlja0xhYmVscykgbS50aWNrTGFiZWxzID0gdmdfYXhpc1RpY2tMYWJlbHMoKTtcbiAgICBpZiAoIW0uZG9tYWluKSBtLmRvbWFpbiA9IHZnX2F4aXNEb21haW4oKTtcbiAgICBpZiAoIW0udGl0bGUpICBtLnRpdGxlICA9IHZnX2F4aXNUaXRsZSgpO1xuICAgIG0uZ3JpZExpbmVzLnByb3BlcnRpZXMuZW50ZXIuc3Ryb2tlID0ge3ZhbHVlOiBjb25maWcuYXhpcy5ncmlkQ29sb3J9O1xuXG4gICAgLy8gZXh0ZW5kIGF4aXMgbWFya3MgYmFzZWQgb24gYXhpcyBvcmllbnRhdGlvblxuICAgIHZnX2F4aXNUaWNrc0V4dGVuZChvcmllbnQsIG0uZ3JpZExpbmVzLCBvbGRTY2FsZSwgbmV3U2NhbGUsIEluZmluaXR5KTtcbiAgICB2Z19heGlzVGlja3NFeHRlbmQob3JpZW50LCBtLm1ham9yVGlja3MsIG9sZFNjYWxlLCBuZXdTY2FsZSwgdGlja01ham9yU2l6ZSk7XG4gICAgdmdfYXhpc1RpY2tzRXh0ZW5kKG9yaWVudCwgbS5taW5vclRpY2tzLCBvbGRTY2FsZSwgbmV3U2NhbGUsIHRpY2tNaW5vclNpemUpO1xuICAgIHZnX2F4aXNMYWJlbEV4dGVuZChvcmllbnQsIG0udGlja0xhYmVscywgb2xkU2NhbGUsIG5ld1NjYWxlLCB0aWNrTWFqb3JTaXplLCB0aWNrUGFkZGluZyk7XG5cbiAgICB2Z19heGlzRG9tYWluRXh0ZW5kKG9yaWVudCwgbS5kb21haW4sIHJhbmdlLCB0aWNrRW5kU2l6ZSk7XG4gICAgdmdfYXhpc1RpdGxlRXh0ZW5kKG9yaWVudCwgbS50aXRsZSwgcmFuZ2UsIHRpdGxlT2Zmc2V0KTsgLy8gVE9ETyBnZXQgb2Zmc2V0XG4gICAgXG4gICAgLy8gYWRkIC8gb3ZlcnJpZGUgY3VzdG9tIHN0eWxlIHByb3BlcnRpZXNcbiAgICBkbC5leHRlbmQobS5ncmlkTGluZXMucHJvcGVydGllcy51cGRhdGUsIGdyaWRMaW5lU3R5bGUpO1xuICAgIGRsLmV4dGVuZChtLm1ham9yVGlja3MucHJvcGVydGllcy51cGRhdGUsIG1ham9yVGlja1N0eWxlKTtcbiAgICBkbC5leHRlbmQobS5taW5vclRpY2tzLnByb3BlcnRpZXMudXBkYXRlLCBtaW5vclRpY2tTdHlsZSk7XG4gICAgZGwuZXh0ZW5kKG0udGlja0xhYmVscy5wcm9wZXJ0aWVzLnVwZGF0ZSwgdGlja0xhYmVsU3R5bGUpO1xuICAgIGRsLmV4dGVuZChtLmRvbWFpbi5wcm9wZXJ0aWVzLnVwZGF0ZSwgZG9tYWluU3R5bGUpO1xuICAgIGRsLmV4dGVuZChtLnRpdGxlLnByb3BlcnRpZXMudXBkYXRlLCB0aXRsZVN0eWxlKTtcblxuICAgIHZhciBtYXJrcyA9IFttLmdyaWRMaW5lcywgbS5tYWpvclRpY2tzLCBtLm1pbm9yVGlja3MsIG0udGlja0xhYmVscywgbS5kb21haW4sIG0udGl0bGVdO1xuICAgIGRsLmV4dGVuZChheGlzRGVmLCB7XG4gICAgICB0eXBlOiBcImdyb3VwXCIsXG4gICAgICBpbnRlcmFjdGl2ZTogZmFsc2UsXG4gICAgICBwcm9wZXJ0aWVzOiB7IFxuICAgICAgICBlbnRlcjoge1xuICAgICAgICAgIGVuY29kZTogdmdfYXhpc1VwZGF0ZSxcbiAgICAgICAgICBzY2FsZXM6IFtzY2FsZS5zY2FsZU5hbWVdLFxuICAgICAgICAgIHNpZ25hbHM6IFtdLCBkYXRhOiBbXVxuICAgICAgICB9LFxuICAgICAgICB1cGRhdGU6IHtcbiAgICAgICAgICBlbmNvZGU6IHZnX2F4aXNVcGRhdGUsXG4gICAgICAgICAgc2NhbGVzOiBbc2NhbGUuc2NhbGVOYW1lXSxcbiAgICAgICAgICBzaWduYWxzOiBbXSwgZGF0YTogW11cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXhpc0RlZi5tYXJrcyA9IG1hcmtzLm1hcChmdW5jdGlvbihtKSB7IHJldHVybiBwYXJzZU1hcmsobW9kZWwsIG0pOyB9KTtcbiAgfTtcblxuICBheGlzLnNjYWxlID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHNjYWxlO1xuICAgIGlmIChzY2FsZSAhPT0geCkgeyBzY2FsZSA9IHg7IHJlc2V0KCk7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLm9yaWVudCA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBvcmllbnQ7XG4gICAgaWYgKG9yaWVudCAhPT0geCkge1xuICAgICAgb3JpZW50ID0geCBpbiB2Z19heGlzT3JpZW50cyA/IHggKyBcIlwiIDogY29uZmlnLmF4aXMub3JpZW50O1xuICAgICAgcmVzZXQoKTtcbiAgICB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy50aXRsZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aXRsZTtcbiAgICBpZiAodGl0bGUgIT09IHgpIHsgdGl0bGUgPSB4OyByZXNldCgpOyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRpY2tBcmd1bWVudHM7XG4gICAgdGlja0FyZ3VtZW50cyA9IGFyZ3VtZW50cztcbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLnRpY2tWYWx1ZXMgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja1ZhbHVlcztcbiAgICB0aWNrVmFsdWVzID0geDtcbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLnRpY2tGb3JtYXQgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja0Zvcm1hdFN0cmluZztcbiAgICBpZiAodGlja0Zvcm1hdFN0cmluZyAhPT0geCkge1xuICAgICAgdGlja0Zvcm1hdFN0cmluZyA9IHg7XG4gICAgICByZXNldCgpO1xuICAgIH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcbiAgXG4gIGF4aXMudGlja1NpemUgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja01ham9yU2l6ZTtcbiAgICB2YXIgbiA9IGFyZ3VtZW50cy5sZW5ndGggLSAxLFxuICAgICAgICBtYWpvciA9ICt4LFxuICAgICAgICBtaW5vciA9IG4gPiAxID8gK3kgOiB0aWNrTWFqb3JTaXplLFxuICAgICAgICBlbmQgICA9IG4gPiAwID8gK2FyZ3VtZW50c1tuXSA6IHRpY2tNYWpvclNpemU7XG5cbiAgICBpZiAodGlja01ham9yU2l6ZSAhPT0gbWFqb3IgfHxcbiAgICAgICAgdGlja01pbm9yU2l6ZSAhPT0gbWlub3IgfHxcbiAgICAgICAgdGlja0VuZFNpemUgIT09IGVuZCkge1xuICAgICAgcmVzZXQoKTtcbiAgICB9XG5cbiAgICB0aWNrTWFqb3JTaXplID0gbWFqb3I7XG4gICAgdGlja01pbm9yU2l6ZSA9IG1pbm9yO1xuICAgIHRpY2tFbmRTaXplID0gZW5kO1xuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMudGlja1N1YmRpdmlkZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aWNrU3ViZGl2aWRlO1xuICAgIHRpY2tTdWJkaXZpZGUgPSAreDtcbiAgICByZXR1cm4gYXhpcztcbiAgfTtcbiAgXG4gIGF4aXMub2Zmc2V0ID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIG9mZnNldDtcbiAgICBvZmZzZXQgPSBkbC5pc09iamVjdCh4KSA/IHggOiAreDtcbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLnRpY2tQYWRkaW5nID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRpY2tQYWRkaW5nO1xuICAgIGlmICh0aWNrUGFkZGluZyAhPT0gK3gpIHsgdGlja1BhZGRpbmcgPSAreDsgcmVzZXQoKTsgfVxuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMudGl0bGVPZmZzZXQgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGl0bGVPZmZzZXQ7XG4gICAgaWYgKHRpdGxlT2Zmc2V0ICE9PSAreCkgeyB0aXRsZU9mZnNldCA9ICt4OyByZXNldCgpOyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy5sYXllciA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBsYXllcjtcbiAgICBpZiAobGF5ZXIgIT09IHgpIHsgbGF5ZXIgPSB4OyByZXNldCgpOyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy5ncmlkID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGdyaWQ7XG4gICAgaWYgKGdyaWQgIT09IHgpIHsgZ3JpZCA9IHg7IHJlc2V0KCk7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLmdyaWRMaW5lUHJvcGVydGllcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBncmlkTGluZVN0eWxlO1xuICAgIGlmIChncmlkTGluZVN0eWxlICE9PSB4KSB7IGdyaWRMaW5lU3R5bGUgPSB4OyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy5tYWpvclRpY2tQcm9wZXJ0aWVzID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIG1ham9yVGlja1N0eWxlO1xuICAgIGlmIChtYWpvclRpY2tTdHlsZSAhPT0geCkgeyBtYWpvclRpY2tTdHlsZSA9IHg7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLm1pbm9yVGlja1Byb3BlcnRpZXMgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gbWlub3JUaWNrU3R5bGU7XG4gICAgaWYgKG1pbm9yVGlja1N0eWxlICE9PSB4KSB7IG1pbm9yVGlja1N0eWxlID0geDsgfVxuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMudGlja0xhYmVsUHJvcGVydGllcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aWNrTGFiZWxTdHlsZTtcbiAgICBpZiAodGlja0xhYmVsU3R5bGUgIT09IHgpIHsgdGlja0xhYmVsU3R5bGUgPSB4OyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy50aXRsZVByb3BlcnRpZXMgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGl0bGVTdHlsZTtcbiAgICBpZiAodGl0bGVTdHlsZSAhPT0geCkgeyB0aXRsZVN0eWxlID0geDsgfVxuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMuZG9tYWluUHJvcGVydGllcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBkb21haW5TdHlsZTtcbiAgICBpZiAoZG9tYWluU3R5bGUgIT09IHgpIHsgZG9tYWluU3R5bGUgPSB4OyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG4gIFxuICBheGlzLnJlc2V0ID0gZnVuY3Rpb24oKSB7IHJlc2V0KCk7IH07XG5cbiAgcmV0dXJuIGF4aXM7XG59O1xuXG52YXIgdmdfYXhpc09yaWVudHMgPSB7dG9wOiAxLCByaWdodDogMSwgYm90dG9tOiAxLCBsZWZ0OiAxfTtcblxuZnVuY3Rpb24gdmdfYXhpc1N1YmRpdmlkZShzY2FsZSwgdGlja3MsIG0pIHtcbiAgc3VidGlja3MgPSBbXTtcbiAgaWYgKG0gJiYgdGlja3MubGVuZ3RoID4gMSkge1xuICAgIHZhciBleHRlbnQgPSB2Z19heGlzU2NhbGVFeHRlbnQoc2NhbGUuZG9tYWluKCkpLFxuICAgICAgICBzdWJ0aWNrcyxcbiAgICAgICAgaSA9IC0xLFxuICAgICAgICBuID0gdGlja3MubGVuZ3RoLFxuICAgICAgICBkID0gKHRpY2tzWzFdIC0gdGlja3NbMF0pIC8gKyttLFxuICAgICAgICBqLFxuICAgICAgICB2O1xuICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICBmb3IgKGogPSBtOyAtLWogPiAwOykge1xuICAgICAgICBpZiAoKHYgPSArdGlja3NbaV0gLSBqICogZCkgPj0gZXh0ZW50WzBdKSB7XG4gICAgICAgICAgc3VidGlja3MucHVzaCh2KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKC0taSwgaiA9IDA7ICsraiA8IG0gJiYgKHYgPSArdGlja3NbaV0gKyBqICogZCkgPCBleHRlbnRbMV07KSB7XG4gICAgICBzdWJ0aWNrcy5wdXNoKHYpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3VidGlja3M7XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNTY2FsZUV4dGVudChkb21haW4pIHtcbiAgdmFyIHN0YXJ0ID0gZG9tYWluWzBdLCBzdG9wID0gZG9tYWluW2RvbWFpbi5sZW5ndGggLSAxXTtcbiAgcmV0dXJuIHN0YXJ0IDwgc3RvcCA/IFtzdGFydCwgc3RvcF0gOiBbc3RvcCwgc3RhcnRdO1xufVxuXG5mdW5jdGlvbiB2Z19heGlzU2NhbGVSYW5nZShzY2FsZSkge1xuICByZXR1cm4gc2NhbGUucmFuZ2VFeHRlbnRcbiAgICA/IHNjYWxlLnJhbmdlRXh0ZW50KClcbiAgICA6IHZnX2F4aXNTY2FsZUV4dGVudChzY2FsZS5yYW5nZSgpKTtcbn1cblxudmFyIHZnX2F4aXNBbGlnbiA9IHtcbiAgYm90dG9tOiBcImNlbnRlclwiLFxuICB0b3A6IFwiY2VudGVyXCIsXG4gIGxlZnQ6IFwicmlnaHRcIixcbiAgcmlnaHQ6IFwibGVmdFwiXG59O1xuXG52YXIgdmdfYXhpc0Jhc2VsaW5lID0ge1xuICBib3R0b206IFwidG9wXCIsXG4gIHRvcDogXCJib3R0b21cIixcbiAgbGVmdDogXCJtaWRkbGVcIixcbiAgcmlnaHQ6IFwibWlkZGxlXCJcbn07XG5cbmZ1bmN0aW9uIHZnX2F4aXNMYWJlbEV4dGVuZChvcmllbnQsIGxhYmVscywgb2xkU2NhbGUsIG5ld1NjYWxlLCBzaXplLCBwYWQpIHtcbiAgc2l6ZSA9IE1hdGgubWF4KHNpemUsIDApICsgcGFkO1xuICBpZiAob3JpZW50ID09PSBcImxlZnRcIiB8fCBvcmllbnQgPT09IFwidG9wXCIpIHtcbiAgICBzaXplICo9IC0xO1xuICB9ICBcbiAgaWYgKG9yaWVudCA9PT0gXCJ0b3BcIiB8fCBvcmllbnQgPT09IFwiYm90dG9tXCIpIHtcbiAgICBkbC5leHRlbmQobGFiZWxzLnByb3BlcnRpZXMuZW50ZXIsIHtcbiAgICAgIHg6IG9sZFNjYWxlLFxuICAgICAgeToge3ZhbHVlOiBzaXplfSxcbiAgICB9KTtcbiAgICBkbC5leHRlbmQobGFiZWxzLnByb3BlcnRpZXMudXBkYXRlLCB7XG4gICAgICB4OiBuZXdTY2FsZSxcbiAgICAgIHk6IHt2YWx1ZTogc2l6ZX0sXG4gICAgICBhbGlnbjoge3ZhbHVlOiBcImNlbnRlclwifSxcbiAgICAgIGJhc2VsaW5lOiB7dmFsdWU6IHZnX2F4aXNCYXNlbGluZVtvcmllbnRdfVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGRsLmV4dGVuZChsYWJlbHMucHJvcGVydGllcy5lbnRlciwge1xuICAgICAgeDoge3ZhbHVlOiBzaXplfSxcbiAgICAgIHk6IG9sZFNjYWxlLFxuICAgIH0pO1xuICAgIGRsLmV4dGVuZChsYWJlbHMucHJvcGVydGllcy51cGRhdGUsIHtcbiAgICAgIHg6IHt2YWx1ZTogc2l6ZX0sXG4gICAgICB5OiBuZXdTY2FsZSxcbiAgICAgIGFsaWduOiB7dmFsdWU6IHZnX2F4aXNBbGlnbltvcmllbnRdfSxcbiAgICAgIGJhc2VsaW5lOiB7dmFsdWU6IFwibWlkZGxlXCJ9XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmdfYXhpc1RpY2tzRXh0ZW5kKG9yaWVudCwgdGlja3MsIG9sZFNjYWxlLCBuZXdTY2FsZSwgc2l6ZSkge1xuICB2YXIgc2lnbiA9IChvcmllbnQgPT09IFwibGVmdFwiIHx8IG9yaWVudCA9PT0gXCJ0b3BcIikgPyAtMSA6IDE7XG4gIGlmIChzaXplID09PSBJbmZpbml0eSkge1xuICAgIHNpemUgPSAob3JpZW50ID09PSBcInRvcFwiIHx8IG9yaWVudCA9PT0gXCJib3R0b21cIilcbiAgICAgID8ge2ZpZWxkOiB7Z3JvdXA6IFwiaGVpZ2h0XCIsIGxldmVsOiAyfSwgbXVsdDogLXNpZ259XG4gICAgICA6IHtmaWVsZDoge2dyb3VwOiBcIndpZHRoXCIsICBsZXZlbDogMn0sIG11bHQ6IC1zaWdufTtcbiAgfSBlbHNlIHtcbiAgICBzaXplID0ge3ZhbHVlOiBzaWduICogc2l6ZX07XG4gIH1cbiAgaWYgKG9yaWVudCA9PT0gXCJ0b3BcIiB8fCBvcmllbnQgPT09IFwiYm90dG9tXCIpIHtcbiAgICBkbC5leHRlbmQodGlja3MucHJvcGVydGllcy5lbnRlciwge1xuICAgICAgeDogIG9sZFNjYWxlLFxuICAgICAgeTogIHt2YWx1ZTogMH0sXG4gICAgICB5Mjogc2l6ZVxuICAgIH0pO1xuICAgIGRsLmV4dGVuZCh0aWNrcy5wcm9wZXJ0aWVzLnVwZGF0ZSwge1xuICAgICAgeDogIG5ld1NjYWxlLFxuICAgICAgeTogIHt2YWx1ZTogMH0sXG4gICAgICB5Mjogc2l6ZVxuICAgIH0pO1xuICAgIGRsLmV4dGVuZCh0aWNrcy5wcm9wZXJ0aWVzLmV4aXQsIHtcbiAgICAgIHg6ICBuZXdTY2FsZSxcbiAgICB9KTsgICAgICAgIFxuICB9IGVsc2Uge1xuICAgIGRsLmV4dGVuZCh0aWNrcy5wcm9wZXJ0aWVzLmVudGVyLCB7XG4gICAgICB4OiAge3ZhbHVlOiAwfSxcbiAgICAgIHgyOiBzaXplLFxuICAgICAgeTogIG9sZFNjYWxlXG4gICAgfSk7XG4gICAgZGwuZXh0ZW5kKHRpY2tzLnByb3BlcnRpZXMudXBkYXRlLCB7XG4gICAgICB4OiAge3ZhbHVlOiAwfSxcbiAgICAgIHgyOiBzaXplLFxuICAgICAgeTogIG5ld1NjYWxlXG4gICAgfSk7XG4gICAgZGwuZXh0ZW5kKHRpY2tzLnByb3BlcnRpZXMuZXhpdCwge1xuICAgICAgeTogIG5ld1NjYWxlLFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNUaXRsZUV4dGVuZChvcmllbnQsIHRpdGxlLCByYW5nZSwgb2Zmc2V0KSB7XG4gIHZhciBtaWQgPSB+figocmFuZ2VbMF0gKyByYW5nZVsxXSkgLyAyKSxcbiAgICAgIHNpZ24gPSAob3JpZW50ID09PSBcInRvcFwiIHx8IG9yaWVudCA9PT0gXCJsZWZ0XCIpID8gLTEgOiAxO1xuICBcbiAgaWYgKG9yaWVudCA9PT0gXCJib3R0b21cIiB8fCBvcmllbnQgPT09IFwidG9wXCIpIHtcbiAgICBkbC5leHRlbmQodGl0bGUucHJvcGVydGllcy51cGRhdGUsIHtcbiAgICAgIHg6IHt2YWx1ZTogbWlkfSxcbiAgICAgIHk6IHt2YWx1ZTogc2lnbipvZmZzZXR9LFxuICAgICAgYW5nbGU6IHt2YWx1ZTogMH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBkbC5leHRlbmQodGl0bGUucHJvcGVydGllcy51cGRhdGUsIHtcbiAgICAgIHg6IHt2YWx1ZTogc2lnbipvZmZzZXR9LFxuICAgICAgeToge3ZhbHVlOiBtaWR9LFxuICAgICAgYW5nbGU6IHt2YWx1ZTogLTkwfVxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNEb21haW5FeHRlbmQob3JpZW50LCBkb21haW4sIHJhbmdlLCBzaXplKSB7XG4gIHZhciBwYXRoO1xuICBpZiAob3JpZW50ID09PSBcInRvcFwiIHx8IG9yaWVudCA9PT0gXCJsZWZ0XCIpIHtcbiAgICBzaXplID0gLTEgKiBzaXplO1xuICB9XG4gIGlmIChvcmllbnQgPT09IFwiYm90dG9tXCIgfHwgb3JpZW50ID09PSBcInRvcFwiKSB7XG4gICAgcGF0aCA9IFwiTVwiICsgcmFuZ2VbMF0gKyBcIixcIiArIHNpemUgKyBcIlYwSFwiICsgcmFuZ2VbMV0gKyBcIlZcIiArIHNpemU7XG4gIH0gZWxzZSB7XG4gICAgcGF0aCA9IFwiTVwiICsgc2l6ZSArIFwiLFwiICsgcmFuZ2VbMF0gKyBcIkgwVlwiICsgcmFuZ2VbMV0gKyBcIkhcIiArIHNpemU7XG4gIH1cbiAgZG9tYWluLnByb3BlcnRpZXMudXBkYXRlLnBhdGggPSB7dmFsdWU6IHBhdGh9O1xufVxuXG5mdW5jdGlvbiB2Z19heGlzVXBkYXRlKGl0ZW0sIGdyb3VwLCB0cmFucywgZGIsIHNpZ25hbHMsIHByZWRpY2F0ZXMpIHtcbiAgdmFyIG8gPSB0cmFucyA/IHt9IDogaXRlbSxcbiAgICAgIG9mZnNldCA9IGl0ZW0ubWFyay5kZWYub2Zmc2V0LFxuICAgICAgb3JpZW50ID0gaXRlbS5tYXJrLmRlZi5vcmllbnQsXG4gICAgICB3aWR0aCAgPSBncm91cC53aWR0aCxcbiAgICAgIGhlaWdodCA9IGdyb3VwLmhlaWdodDsgLy8gVE9ETyBmYWxsYmFjayB0byBnbG9iYWwgdyxoP1xuXG4gIGlmIChkbC5pc09iamVjdChvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gLWdyb3VwLnNjYWxlKG9mZnNldC5zY2FsZSkob2Zmc2V0LnZhbHVlKTtcbiAgfVxuXG4gIHN3aXRjaCAob3JpZW50KSB7XG4gICAgY2FzZSBcImxlZnRcIjogICB7IHRwbC5zZXQobywgJ3gnLCAtb2Zmc2V0KTsgdHBsLnNldChvLCAneScsIDApOyBicmVhazsgfVxuICAgIGNhc2UgXCJyaWdodFwiOiAgeyB0cGwuc2V0KG8sICd4Jywgd2lkdGggKyBvZmZzZXQpOyB0cGwuc2V0KG8sICd5JywgMCk7IGJyZWFrOyB9XG4gICAgY2FzZSBcImJvdHRvbVwiOiB7IHRwbC5zZXQobywgJ3gnLCAwKTsgdHBsLnNldChvLCAneScsIGhlaWdodCArIG9mZnNldCk7IGJyZWFrOyB9XG4gICAgY2FzZSBcInRvcFwiOiAgICB7IHRwbC5zZXQobywgJ3gnLCAwKTsgdHBsLnNldChvLCAneScsIC1vZmZzZXQpOyBicmVhazsgfVxuICAgIGRlZmF1bHQ6ICAgICAgIHsgdHBsLnNldChvLCAneCcsIDApOyB0cGwuc2V0KG8sICd5JywgMCk7IH1cbiAgfVxuXG4gIGlmICh0cmFucykgdHJhbnMuaW50ZXJwb2xhdGUoaXRlbSwgbyk7XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNUaWNrcygpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcInJ1bGVcIixcbiAgICBpbnRlcmFjdGl2ZTogZmFsc2UsXG4gICAga2V5OiBcImRhdGFcIixcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBlbnRlcjoge1xuICAgICAgICBzdHJva2U6IHt2YWx1ZTogY29uZmlnLmF4aXMudGlja0NvbG9yfSxcbiAgICAgICAgc3Ryb2tlV2lkdGg6IHt2YWx1ZTogY29uZmlnLmF4aXMudGlja1dpZHRofSxcbiAgICAgICAgb3BhY2l0eToge3ZhbHVlOiAxZS02fVxuICAgICAgfSxcbiAgICAgIGV4aXQ6IHsgb3BhY2l0eToge3ZhbHVlOiAxZS02fSB9LFxuICAgICAgdXBkYXRlOiB7IG9wYWNpdHk6IHt2YWx1ZTogMX0gfVxuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gdmdfYXhpc1RpY2tMYWJlbHMoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgaW50ZXJhY3RpdmU6IHRydWUsXG4gICAga2V5OiBcImRhdGFcIixcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBlbnRlcjoge1xuICAgICAgICBmaWxsOiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpY2tMYWJlbENvbG9yfSxcbiAgICAgICAgZm9udDoge3ZhbHVlOiBjb25maWcuYXhpcy50aWNrTGFiZWxGb250fSxcbiAgICAgICAgZm9udFNpemU6IHt2YWx1ZTogY29uZmlnLmF4aXMudGlja0xhYmVsRm9udFNpemV9LFxuICAgICAgICBvcGFjaXR5OiB7dmFsdWU6IDFlLTZ9LFxuICAgICAgICB0ZXh0OiB7ZmllbGQ6IFwibGFiZWxcIn1cbiAgICAgIH0sXG4gICAgICBleGl0OiB7IG9wYWNpdHk6IHt2YWx1ZTogMWUtNn0gfSxcbiAgICAgIHVwZGF0ZTogeyBvcGFjaXR5OiB7dmFsdWU6IDF9IH1cbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNUaXRsZSgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcInRleHRcIixcbiAgICBpbnRlcmFjdGl2ZTogdHJ1ZSxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBlbnRlcjoge1xuICAgICAgICBmb250OiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpdGxlRm9udH0sXG4gICAgICAgIGZvbnRTaXplOiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpdGxlRm9udFNpemV9LFxuICAgICAgICBmb250V2VpZ2h0OiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpdGxlRm9udFdlaWdodH0sXG4gICAgICAgIGZpbGw6IHt2YWx1ZTogY29uZmlnLmF4aXMudGl0bGVDb2xvcn0sXG4gICAgICAgIGFsaWduOiB7dmFsdWU6IFwiY2VudGVyXCJ9LFxuICAgICAgICBiYXNlbGluZToge3ZhbHVlOiBcIm1pZGRsZVwifSxcbiAgICAgICAgdGV4dDoge2ZpZWxkOiBcImRhdGFcIn1cbiAgICAgIH0sXG4gICAgICB1cGRhdGU6IHt9XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiB2Z19heGlzRG9tYWluKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwicGF0aFwiLFxuICAgIGludGVyYWN0aXZlOiBmYWxzZSxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBlbnRlcjoge1xuICAgICAgICB4OiB7dmFsdWU6IDAuNX0sXG4gICAgICAgIHk6IHt2YWx1ZTogMC41fSxcbiAgICAgICAgc3Ryb2tlOiB7dmFsdWU6IGNvbmZpZy5heGlzLmF4aXNDb2xvcn0sXG4gICAgICAgIHN0cm9rZVdpZHRoOiB7dmFsdWU6IGNvbmZpZy5heGlzLmF4aXNXaWR0aH1cbiAgICAgIH0sXG4gICAgICB1cGRhdGU6IHt9XG4gICAgfVxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGF4czsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICBHcm91cEJ5ID0gcmVxdWlyZSgnLi9Hcm91cEJ5JyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLCBcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9jaGFuZ2VzZXQnKSwgXG4gICAgbWVhcyA9IHJlcXVpcmUoJy4vbWVhc3VyZXMnKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gQWdncmVnYXRlKGdyYXBoKSB7XG4gIEdyb3VwQnkucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICBncm91cF9ieToge3R5cGU6IFwiYXJyYXk8ZmllbGQ+XCJ9XG4gIH0pO1xuXG4gIHRoaXMuX291dHB1dCA9IHtcbiAgICBcImNvdW50XCI6ICAgIFwiY291bnRcIixcbiAgICBcImF2Z1wiOiAgICAgIFwiYXZnXCIsXG4gICAgXCJtaW5cIjogICAgICBcIm1pblwiLFxuICAgIFwibWF4XCI6ICAgICAgXCJtYXhcIixcbiAgICBcInN1bVwiOiAgICAgIFwic3VtXCIsXG4gICAgXCJtZWFuXCI6ICAgICBcIm1lYW5cIixcbiAgICBcInZhclwiOiAgICAgIFwidmFyXCIsXG4gICAgXCJzdGRldlwiOiAgICBcInN0ZGV2XCIsXG4gICAgXCJ2YXJwXCI6ICAgICBcInZhcnBcIixcbiAgICBcInN0ZGV2cFwiOiAgIFwic3RkZXZwXCIsXG4gICAgXCJtZWRpYW5cIjogICBcIm1lZGlhblwiXG4gIH07XG5cbiAgLy8gQWdncmVnYXRvcnMgcGFyYW1ldGVyIGhhbmRsZWQgbWFudWFsbHkuXG4gIHRoaXMuX2ZpZWxkc0RlZiAgID0gbnVsbDtcbiAgdGhpcy5fQWdncmVnYXRvcnMgPSBudWxsO1xuICB0aGlzLl9zaW5nbGV0b24gICA9IGZhbHNlOyAgLy8gSWYgdHJ1ZSwgYWxsIGZpZWxkcyBhZ2dyZWdhdGVkIHdpdGhpbiBhIHNpbmdsZSBtb25vaWRcblxuICByZXR1cm4gdGhpcztcbn1cblxudmFyIHByb3RvID0gKEFnZ3JlZ2F0ZS5wcm90b3R5cGUgPSBuZXcgR3JvdXBCeSgpKTtcblxucHJvdG8uZmllbGRzID0ge1xuICBzZXQ6IGZ1bmN0aW9uKHRyYW5zZm9ybSwgZmllbGRzKSB7XG4gICAgdmFyIGksIGxlbiwgZiwgc2lnbmFscyA9IHt9O1xuICAgIGZvcihpPTAsIGxlbj1maWVsZHMubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgICBmID0gZmllbGRzW2ldO1xuICAgICAgaWYoZi5uYW1lLnNpZ25hbCkgc2lnbmFsc1tmLm5hbWUuc2lnbmFsXSA9IDE7XG4gICAgICBkbC5hcnJheShmLm9wcykuZm9yRWFjaChmdW5jdGlvbihvKXsgaWYoby5zaWduYWwpIHNpZ25hbHNbby5zaWduYWxdID0gMSB9KTtcbiAgICB9XG5cbiAgICB0cmFuc2Zvcm0uX2ZpZWxkc0RlZiA9IGZpZWxkcztcbiAgICB0cmFuc2Zvcm0uX0FnZ3JlZ2F0b3JzID0gbnVsbDtcbiAgICB0cmFuc2Zvcm0uYWdncygpO1xuICAgIHRyYW5zZm9ybS5kZXBlbmRlbmN5KEMuU0lHTkFMUywgZGwua2V5cyhzaWduYWxzKSk7XG4gICAgcmV0dXJuIHRyYW5zZm9ybTtcbiAgfVxufTtcblxucHJvdG8uc2luZ2xldG9uID0gZnVuY3Rpb24oYykge1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3NpbmdsZXRvbjtcbiAgdGhpcy5fc2luZ2xldG9uID0gYztcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5hZ2dzID0gZnVuY3Rpb24oKSB7XG4gIHZhciB0cmFuc2Zvcm0gPSB0aGlzLFxuICAgICAgZ3JhcGggPSB0aGlzLl9ncmFwaCxcbiAgICAgIGZpZWxkcyA9IHRoaXMuX2ZpZWxkc0RlZixcbiAgICAgIGFnZ3MgPSB0aGlzLl9BZ2dyZWdhdG9ycyxcbiAgICAgIGYsIGksIGssIG5hbWUsIG9wcywgbWVhc3VyZXM7XG5cbiAgaWYoYWdncykgcmV0dXJuIGFnZ3M7XG4gIGVsc2UgYWdncyA9IHRoaXMuX0FnZ3JlZ2F0b3JzID0gW107IFxuXG4gIGZvciAoaSA9IDA7IGkgPCBmaWVsZHMubGVuZ3RoOyBpKyspIHtcbiAgICBmID0gZmllbGRzW2ldO1xuICAgIGlmIChmLm9wcy5sZW5ndGggPT09IDApIGNvbnRpbnVlO1xuXG4gICAgbmFtZSA9IGYubmFtZS5zaWduYWwgPyBncmFwaC5zaWduYWxSZWYoZi5uYW1lLnNpZ25hbCkgOiBmLm5hbWU7XG4gICAgb3BzICA9IGRsLmFycmF5KGYub3BzLnNpZ25hbCA/IGdyYXBoLnNpZ25hbFJlZihmLm9wcy5zaWduYWwpIDogZi5vcHMpO1xuICAgIG1lYXN1cmVzID0gb3BzLm1hcChmdW5jdGlvbihhKSB7XG4gICAgICBhID0gYS5zaWduYWwgPyBncmFwaC5zaWduYWxSZWYoYS5zaWduYWwpIDogYTtcbiAgICAgIHJldHVybiBtZWFzW2FdKG5hbWUgKyAnXycgKyB0cmFuc2Zvcm0uX291dHB1dFthXSk7XG4gICAgfSk7XG4gICAgYWdncy5wdXNoKHtcbiAgICAgIGFjY2Vzc29yOiBkbC5hY2Nlc3NvcihuYW1lKSxcbiAgICAgIGZpZWxkOiB0aGlzLl9zaW5nbGV0b24gPyBDLlNJTkdMRVRPTiA6IG5hbWUsXG4gICAgICBtZWFzdXJlczogbWVhcy5jcmVhdGUobWVhc3VyZXMpXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gYWdncztcbn07XG5cbnByb3RvLl9yZXNldCA9IGZ1bmN0aW9uKGlucHV0LCBvdXRwdXQpIHtcbiAgdGhpcy5fQWdncmVnYXRvcnMgPSBudWxsOyAvLyByZWJ1aWxkIGFnZ3JlZ2F0b3JzXG4gIHRoaXMuYWdncygpO1xuICByZXR1cm4gR3JvdXBCeS5wcm90b3R5cGUuX3Jlc2V0LmNhbGwodGhpcywgaW5wdXQsIG91dHB1dCk7XG59O1xuXG5wcm90by5fa2V5cyA9IGZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHRoaXMuX2diLmZpZWxkcy5sZW5ndGggPyBcbiAgICBHcm91cEJ5LnByb3RvdHlwZS5fa2V5cy5jYWxsKHRoaXMsIHgpIDoge2tleXM6IFtdLCBrZXk6IFwiXCJ9O1xufTtcblxucHJvdG8uX25ld19jZWxsID0gZnVuY3Rpb24oeCwgaykge1xuICB2YXIgY2VsbCA9IEdyb3VwQnkucHJvdG90eXBlLl9uZXdfY2VsbC5jYWxsKHRoaXMsIHgsIGspLFxuICAgICAgYWdncyA9IHRoaXMuYWdncygpLFxuICAgICAgaSA9IDAsIGxlbiA9IGFnZ3MubGVuZ3RoLCBcbiAgICAgIGFnZztcblxuICBmb3IoOyBpPGxlbjsgaSsrKSB7XG4gICAgYWdnID0gYWdnc1tpXTtcbiAgICBjZWxsW2FnZy5maWVsZF0gPSBuZXcgYWdnLm1lYXN1cmVzKGNlbGwsIGNlbGwudHBsKTtcbiAgfVxuXG4gIHJldHVybiBjZWxsO1xufTtcblxucHJvdG8uX2FkZCA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGMgPSB0aGlzLl9jZWxsKHgpLFxuICAgICAgYWdncyA9IHRoaXMuYWdncygpLFxuICAgICAgaSA9IDAsIGxlbiA9IGFnZ3MubGVuZ3RoLFxuICAgICAgYWdnO1xuXG4gIGMuY250Kys7XG4gIGZvcig7IGk8bGVuOyBpKyspIHtcbiAgICBhZ2cgPSBhZ2dzW2ldO1xuICAgIGNbYWdnLmZpZWxkXS5hZGQoYWdnLmFjY2Vzc29yKHgpKTtcbiAgfVxuICBjLmZsZyB8PSBDLk1PRF9DRUxMO1xufTtcblxucHJvdG8uX3JlbSA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGMgPSB0aGlzLl9jZWxsKHgpLFxuICAgICAgYWdncyA9IHRoaXMuYWdncygpLFxuICAgICAgaSA9IDAsIGxlbiA9IGFnZ3MubGVuZ3RoLFxuICAgICAgYWdnO1xuXG4gIGMuY250LS07XG4gIGZvcig7IGk8bGVuOyBpKyspIHtcbiAgICBhZ2cgPSBhZ2dzW2ldO1xuICAgIGNbYWdnLmZpZWxkXS5yZW0oYWdnLmFjY2Vzc29yKHgpKTtcbiAgfVxuICBjLmZsZyB8PSBDLk1PRF9DRUxMO1xufTtcblxucHJvdG8udHJhbnNmb3JtID0gZnVuY3Rpb24oaW5wdXQsIHJlc2V0KSB7XG4gIGRlYnVnKGlucHV0LCBbXCJhZ2dyZWdhdGVcIl0pO1xuXG4gIHRoaXMuX2diID0gdGhpcy5ncm91cF9ieS5nZXQodGhpcy5fZ3JhcGgpO1xuXG4gIHZhciBvdXRwdXQgPSBHcm91cEJ5LnByb3RvdHlwZS50cmFuc2Zvcm0uY2FsbCh0aGlzLCBpbnB1dCwgcmVzZXQpLFxuICAgICAgYWdncyA9IHRoaXMuYWdncygpLFxuICAgICAgbGVuID0gYWdncy5sZW5ndGgsXG4gICAgICBpLCBrLCBjO1xuXG4gIGZvcihrIGluIHRoaXMuX2NlbGxzKSB7XG4gICAgYyA9IHRoaXMuX2NlbGxzW2tdO1xuICAgIGlmKCFjKSBjb250aW51ZTtcbiAgICBmb3IoaT0wOyBpPGxlbjsgaSsrKSB7XG4gICAgICBjW2FnZ3NbaV0uZmllbGRdLnNldCgpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXRwdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFnZ3JlZ2F0ZTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyk7XG5cbmZ1bmN0aW9uIEJpbihncmFwaCkge1xuICBUcmFuc2Zvcm0ucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICBmaWVsZDoge3R5cGU6IFwiZmllbGRcIn0sXG4gICAgbWluOiB7dHlwZTogXCJ2YWx1ZVwifSxcbiAgICBtYXg6IHt0eXBlOiBcInZhbHVlXCJ9LFxuICAgIHN0ZXA6IHt0eXBlOiBcInZhbHVlXCJ9LFxuICAgIG1heGJpbnM6IHt0eXBlOiBcInZhbHVlXCIsIGRlZmF1bHQ6IDIwfVxuICB9KTtcblxuICB0aGlzLl9vdXRwdXQgPSB7XCJiaW5cIjogXCJiaW5cIn07XG4gIHJldHVybiB0aGlzO1xufVxuXG52YXIgcHJvdG8gPSAoQmluLnByb3RvdHlwZSA9IG5ldyBUcmFuc2Zvcm0oKSk7XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciB0cmFuc2Zvcm0gPSB0aGlzLFxuICAgICAgb3V0cHV0ID0gdGhpcy5fb3V0cHV0LmJpbjtcbiAgICAgIFxuICB2YXIgYiA9IGRsLmJpbih7XG4gICAgbWluOiB0aGlzLm1pbi5nZXQoKSxcbiAgICBtYXg6IHRoaXMubWF4LmdldCgpLFxuICAgIHN0ZXA6IHRoaXMuc3RlcC5nZXQoKSxcbiAgICBtYXhiaW5zOiB0aGlzLm1heGJpbnMuZ2V0KClcbiAgfSk7XG5cbiAgZnVuY3Rpb24gdXBkYXRlKGQpIHtcbiAgICB2YXIgdiA9IHRyYW5zZm9ybS5maWVsZC5nZXQoKS5hY2Nlc3NvcihkKTtcbiAgICB2ID0gdiA9PSBudWxsID8gbnVsbFxuICAgICAgOiBiLnN0YXJ0ICsgYi5zdGVwICogfn4oKHYgLSBiLnN0YXJ0KSAvIGIuc3RlcCk7XG4gICAgdHVwbGUuc2V0KGQsIG91dHB1dCwgdiwgaW5wdXQuc3RhbXApO1xuICB9XG4gIGlucHV0LmFkZC5mb3JFYWNoKHVwZGF0ZSk7XG4gIGlucHV0Lm1vZC5mb3JFYWNoKHVwZGF0ZSk7XG4gIGlucHV0LnJlbS5mb3JFYWNoKHVwZGF0ZSk7XG5cbiAgcmV0dXJuIGlucHV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCaW47IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgQ29sbGVjdG9yID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvQ29sbGVjdG9yJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpO1xuXG5mdW5jdGlvbiBDcm9zcyhncmFwaCkge1xuICBUcmFuc2Zvcm0ucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICB3aXRoOiB7dHlwZTogXCJkYXRhXCJ9LFxuICAgIGRpYWdvbmFsOiB7dHlwZTogXCJ2YWx1ZVwiLCBkZWZhdWx0OiBcInRydWVcIn1cbiAgfSk7XG5cbiAgdGhpcy5fb3V0cHV0ID0ge1wibGVmdFwiOiBcImFcIiwgXCJyaWdodFwiOiBcImJcIn07XG4gIHRoaXMuX2NvbGxlY3RvciA9IG5ldyBDb2xsZWN0b3IoZ3JhcGgpO1xuICB0aGlzLl9sYXN0UmVtICA9IG51bGw7IC8vIE1vc3QgcmVjZW50IHN0YW1wIHRoYXQgcmVtIG9jY3VyZWQuIFxuICB0aGlzLl9sYXN0V2l0aCA9IG51bGw7IC8vIExhc3QgdGltZSB3ZSBjcm9zc2VkIHcvd2l0aGRzLlxuICB0aGlzLl9pZHMgICA9IHt9O1xuICB0aGlzLl9jYWNoZSA9IHt9O1xuXG4gIHJldHVybiB0aGlzLnJvdXRlcih0cnVlKTtcbn1cblxudmFyIHByb3RvID0gKENyb3NzLnByb3RvdHlwZSA9IG5ldyBUcmFuc2Zvcm0oKSk7XG5cbi8vIEVhY2ggY2FjaGVkIGluY29taW5nIHR1cGxlIGFsc28gaGFzIGEgc3RhbXAgdG8gdHJhY2sgaWYgd2UgbmVlZCB0byBkb1xuLy8gbGF6eSBmaWx0ZXJpbmcgb2YgcmVtb3ZlZCB0dXBsZXMuXG5mdW5jdGlvbiBjYWNoZSh4LCB0KSB7XG4gIHZhciBjID0gdGhpcy5fY2FjaGVbeC5faWRdID0gdGhpcy5fY2FjaGVbeC5faWRdIHx8IHtjOiBbXSwgczogdGhpcy5fc3RhbXB9O1xuICBjLmMucHVzaCh0KTtcbn1cblxuZnVuY3Rpb24gYWRkKG91dHB1dCwgbGVmdCwgd2RhdGEsIGRpYWcsIHgpIHtcbiAgdmFyIGRhdGEgPSBsZWZ0ID8gd2RhdGEgOiB0aGlzLl9jb2xsZWN0b3IuZGF0YSgpLCAvLyBMZWZ0IHR1cGxlcyBjcm9zcyB3L3JpZ2h0LlxuICAgICAgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoLFxuICAgICAgcHJldiAgPSB4Ll9wcmV2ICE9PSB1bmRlZmluZWQgPyBudWxsIDogdW5kZWZpbmVkLCBcbiAgICAgIHQsIHksIGlkO1xuXG4gIGZvcig7IGk8bGVuOyArK2kpIHtcbiAgICB5ID0gZGF0YVtpXTtcbiAgICBpZCA9IGxlZnQgPyB4Ll9pZCtcIl9cIit5Ll9pZCA6IHkuX2lkK1wiX1wiK3guX2lkO1xuICAgIGlmKHRoaXMuX2lkc1tpZF0pIGNvbnRpbnVlO1xuICAgIGlmKHguX2lkID09IHkuX2lkICYmICFkaWFnKSBjb250aW51ZTtcblxuICAgIHQgPSB0dXBsZS5pbmdlc3Qoe30sIHByZXYpO1xuICAgIHRbdGhpcy5fb3V0cHV0LmxlZnRdICA9IGxlZnQgPyB4IDogeTtcbiAgICB0W3RoaXMuX291dHB1dC5yaWdodF0gPSBsZWZ0ID8geSA6IHg7XG4gICAgb3V0cHV0LmFkZC5wdXNoKHQpO1xuICAgIGNhY2hlLmNhbGwodGhpcywgeCwgdCk7XG4gICAgY2FjaGUuY2FsbCh0aGlzLCB5LCB0KTtcbiAgICB0aGlzLl9pZHNbaWRdID0gMTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtb2Qob3V0cHV0LCBsZWZ0LCB4KSB7XG4gIHZhciBjcm9zcyA9IHRoaXMsXG4gICAgICBjID0gdGhpcy5fY2FjaGVbeC5faWRdO1xuXG4gIGlmKHRoaXMuX2xhc3RSZW0gPiBjLnMpIHsgIC8vIFJlbW92ZWQgdHVwbGVzIGhhdmVuJ3QgYmVlbiBmaWx0ZXJlZCB5ZXRcbiAgICBjLmMgPSBjLmMuZmlsdGVyKGZ1bmN0aW9uKHkpIHtcbiAgICAgIHZhciB0ID0geVtjcm9zcy5fb3V0cHV0W2xlZnQgPyBcInJpZ2h0XCIgOiBcImxlZnRcIl1dO1xuICAgICAgcmV0dXJuIGNyb3NzLl9jYWNoZVt0Ll9pZF0gIT09IG51bGw7XG4gICAgfSk7XG4gICAgYy5zID0gdGhpcy5fbGFzdFJlbTtcbiAgfVxuXG4gIG91dHB1dC5tb2QucHVzaC5hcHBseShvdXRwdXQubW9kLCBjLmMpO1xufVxuXG5mdW5jdGlvbiByZW0ob3V0cHV0LCB4KSB7XG4gIG91dHB1dC5yZW0ucHVzaC5hcHBseShvdXRwdXQucmVtLCB0aGlzLl9jYWNoZVt4Ll9pZF0uYyk7XG4gIHRoaXMuX2NhY2hlW3guX2lkXSA9IG51bGw7XG4gIHRoaXMuX2xhc3RSZW0gPSB0aGlzLl9zdGFtcDtcbn1cblxuZnVuY3Rpb24gdXBGaWVsZHMoaW5wdXQsIG91dHB1dCkge1xuICBpZihpbnB1dC5hZGQubGVuZ3RoIHx8IGlucHV0LnJlbS5sZW5ndGgpIHtcbiAgICBvdXRwdXQuZmllbGRzW3RoaXMuX291dHB1dC5sZWZ0XSAgPSAxOyBcbiAgICBvdXRwdXQuZmllbGRzW3RoaXMuX291dHB1dC5yaWdodF0gPSAxO1xuICB9XG59XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGRlYnVnKGlucHV0LCBbXCJjcm9zc2luZ1wiXSk7XG5cbiAgLy8gTWF0ZXJpYWxpemUgdGhlIGN1cnJlbnQgZGF0YXNvdXJjZS4gVE9ETzogc2hhcmUgY29sbGVjdG9yc1xuICB0aGlzLl9jb2xsZWN0b3IuZXZhbHVhdGUoaW5wdXQpO1xuXG4gIHZhciB3ID0gdGhpcy53aXRoLmdldCh0aGlzLl9ncmFwaCksXG4gICAgICBkaWFnID0gdGhpcy5kaWFnb25hbC5nZXQodGhpcy5fZ3JhcGgpLFxuICAgICAgc2VsZkNyb3NzID0gKCF3Lm5hbWUpLFxuICAgICAgZGF0YSA9IHRoaXMuX2NvbGxlY3Rvci5kYXRhKCksXG4gICAgICB3b3V0cHV0ID0gc2VsZkNyb3NzID8gaW5wdXQgOiB3LnNvdXJjZS5sYXN0KCksXG4gICAgICB3ZGF0YSAgID0gc2VsZkNyb3NzID8gZGF0YSA6IHcuc291cmNlLnZhbHVlcygpLFxuICAgICAgb3V0cHV0ICA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpLFxuICAgICAgciA9IHJlbS5iaW5kKHRoaXMsIG91dHB1dCk7IFxuXG4gIGlucHV0LnJlbS5mb3JFYWNoKHIpO1xuICBpbnB1dC5hZGQuZm9yRWFjaChhZGQuYmluZCh0aGlzLCBvdXRwdXQsIHRydWUsIHdkYXRhLCBkaWFnKSk7XG5cbiAgaWYoIXNlbGZDcm9zcyAmJiB3b3V0cHV0LnN0YW1wID4gdGhpcy5fbGFzdFdpdGgpIHtcbiAgICB3b3V0cHV0LnJlbS5mb3JFYWNoKHIpO1xuICAgIHdvdXRwdXQuYWRkLmZvckVhY2goYWRkLmJpbmQodGhpcywgb3V0cHV0LCBmYWxzZSwgZGF0YSwgZGlhZykpO1xuICAgIHdvdXRwdXQubW9kLmZvckVhY2gobW9kLmJpbmQodGhpcywgb3V0cHV0LCBmYWxzZSkpO1xuICAgIHVwRmllbGRzLmNhbGwodGhpcywgd291dHB1dCwgb3V0cHV0KTtcbiAgICB0aGlzLl9sYXN0V2l0aCA9IHdvdXRwdXQuc3RhbXA7XG4gIH1cblxuICAvLyBNb2RzIG5lZWQgdG8gY29tZSBhZnRlciBhbGwgcmVtb3ZhbHMgaGF2ZSBiZWVuIHJ1bi5cbiAgaW5wdXQubW9kLmZvckVhY2gobW9kLmJpbmQodGhpcywgb3V0cHV0LCB0cnVlKSk7XG4gIHVwRmllbGRzLmNhbGwodGhpcywgaW5wdXQsIG91dHB1dCk7XG5cbiAgcmV0dXJuIG91dHB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ3Jvc3M7IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgR3JvdXBCeSA9IHJlcXVpcmUoJy4vR3JvdXBCeScpLFxuICAgIHR1cGxlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvdHVwbGUnKSwgXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0JyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIEZhY2V0KGdyYXBoKSB7XG4gIEdyb3VwQnkucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtrZXlzOiB7dHlwZTogXCJhcnJheTxmaWVsZD5cIn0gfSk7XG5cbiAgdGhpcy5fcGlwZWxpbmUgPSBbXTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbnZhciBwcm90byA9IChGYWNldC5wcm90b3R5cGUgPSBuZXcgR3JvdXBCeSgpKTtcblxucHJvdG8ucGlwZWxpbmUgPSBmdW5jdGlvbihwaXBlbGluZSkge1xuICBpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3BpcGVsaW5lO1xuICB0aGlzLl9waXBlbGluZSA9IHBpcGVsaW5lO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLl9yZXNldCA9IGZ1bmN0aW9uKGlucHV0LCBvdXRwdXQpIHtcbiAgdmFyIGssIGM7XG4gIGZvcihrIGluIHRoaXMuX2NlbGxzKSB7XG4gICAgYyA9IHRoaXMuX2NlbGxzW2tdO1xuICAgIGlmKCFjKSBjb250aW51ZTtcbiAgICBvdXRwdXQucmVtLnB1c2goYy50cGwpO1xuICAgIGMuZGVsZXRlKCk7XG4gIH1cbiAgdGhpcy5fY2VsbHMgPSB7fTtcbn07XG5cbnByb3RvLl9uZXdfdHVwbGUgPSBmdW5jdGlvbih4LCBrKSB7XG4gIHJldHVybiB0dXBsZS5pbmdlc3QoaywgbnVsbCk7XG59O1xuXG5wcm90by5fbmV3X2NlbGwgPSBmdW5jdGlvbih4LCBrKSB7XG4gIC8vIFJhdGhlciB0aGFuIHNoYXJpbmcgdGhlIHBpcGVsaW5lIGJldHdlZW4gYWxsIG5vZGVzLFxuICAvLyBnaXZlIGVhY2ggY2VsbCBpdHMgaW5kaXZpZHVhbCBwaXBlbGluZS4gVGhpcyBhbGxvd3NcbiAgLy8gZHluYW1pY2FsbHkgYWRkZWQgY29sbGVjdG9ycyB0byBkbyB0aGUgcmlnaHQgdGhpbmdcbiAgLy8gd2hlbiB3aXJpbmcgdXAgdGhlIHBpcGVsaW5lcy5cbiAgdmFyIGNlbGwgPSBHcm91cEJ5LnByb3RvdHlwZS5fbmV3X2NlbGwuY2FsbCh0aGlzLCB4LCBrKSxcbiAgICAgIHBpcGVsaW5lID0gdGhpcy5fcGlwZWxpbmUubWFwKGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG4uY2xvbmUoKTsgfSksXG4gICAgICBmYWNldCA9IHRoaXMsXG4gICAgICB0ID0gY2VsbC50cGw7XG5cbiAgY2VsbC5kcyA9IHRoaXMuX2dyYXBoLmRhdGEoXCJ2Z19cIit0Ll9pZCwgcGlwZWxpbmUsIHQpO1xuICBjZWxsLmRlbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGRlYnVnKHt9LCBbXCJkZWxldGluZyBjZWxsXCIsIGsua2V5XSk7XG4gICAgZmFjZXQucmVtb3ZlTGlzdGVuZXIocGlwZWxpbmVbMF0pO1xuICAgIGZhY2V0Ll9ncmFwaC5kaXNjb25uZWN0KHBpcGVsaW5lKTtcbiAgfTtcblxuICB0aGlzLmFkZExpc3RlbmVyKHBpcGVsaW5lWzBdKTtcblxuICByZXR1cm4gY2VsbDtcbn07XG5cbnByb3RvLl9hZGQgPSBmdW5jdGlvbih4KSB7XG4gIHZhciBjZWxsID0gR3JvdXBCeS5wcm90b3R5cGUuX2FkZC5jYWxsKHRoaXMsIHgpO1xuICBjZWxsLmRzLl9pbnB1dC5hZGQucHVzaCh4KTtcbiAgcmV0dXJuIGNlbGw7XG59O1xuXG5wcm90by5fbW9kID0gZnVuY3Rpb24oeCwgcmVzZXQpIHtcbiAgdmFyIGNlbGwgPSBHcm91cEJ5LnByb3RvdHlwZS5fbW9kLmNhbGwodGhpcywgeCwgcmVzZXQpO1xuICBpZighKGNlbGwuZmxnICYgQy5BRERfQ0VMTCkpIGNlbGwuZHMuX2lucHV0Lm1vZC5wdXNoKHgpOyAvLyBQcm9wYWdhdGUgdHVwbGVzXG4gIGNlbGwuZmxnIHw9IEMuTU9EX0NFTEw7XG4gIHJldHVybiBjZWxsO1xufTtcblxucHJvdG8uX3JlbSA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGNlbGwgPSBHcm91cEJ5LnByb3RvdHlwZS5fcmVtLmNhbGwodGhpcywgeCk7XG4gIGNlbGwuZHMuX2lucHV0LnJlbS5wdXNoKHgpO1xuICByZXR1cm4gY2VsbDtcbn07XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0LCByZXNldCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wiZmFjZXRpbmdcIl0pO1xuXG4gIHRoaXMuX2diID0gdGhpcy5rZXlzLmdldCh0aGlzLl9ncmFwaCk7XG5cbiAgdmFyIG91dHB1dCA9IEdyb3VwQnkucHJvdG90eXBlLnRyYW5zZm9ybS5jYWxsKHRoaXMsIGlucHV0LCByZXNldCksXG4gICAgICBrLCBjO1xuXG4gIGZvcihrIGluIHRoaXMuX2NlbGxzKSB7XG4gICAgYyA9IHRoaXMuX2NlbGxzW2tdO1xuICAgIGlmKGMgPT0gbnVsbCkgY29udGludWU7XG4gICAgaWYoYy5jbnQgPT09IDApIHtcbiAgICAgIGMuZGVsZXRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHByb3BhZ2F0ZSBzb3J0LCBzaWduYWxzLCBmaWVsZHMsIGV0Yy5cbiAgICAgIGNoYW5nZXNldC5jb3B5KGlucHV0LCBjLmRzLl9pbnB1dCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dHB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRmFjZXQ7IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0JyksIFxuICAgIGV4cHIgPSByZXF1aXJlKCcuLi9wYXJzZS9leHByJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIEZpbHRlcihncmFwaCkge1xuICBUcmFuc2Zvcm0ucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHt0ZXN0OiB7dHlwZTogXCJleHByXCJ9IH0pO1xuXG4gIHRoaXMuX3NraXAgPSB7fTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbnZhciBwcm90byA9IChGaWx0ZXIucHJvdG90eXBlID0gbmV3IFRyYW5zZm9ybSgpKTtcblxuZnVuY3Rpb24gdGVzdCh4KSB7XG4gIHJldHVybiBleHByLmV2YWwodGhpcy5fZ3JhcGgsIHRoaXMudGVzdC5nZXQodGhpcy5fZ3JhcGgpLCBcbiAgICB4LCBudWxsLCBudWxsLCBudWxsLCB0aGlzLmRlcGVuZGVuY3koQy5TSUdOQUxTKSk7XG59O1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wiZmlsdGVyaW5nXCJdKTtcbiAgdmFyIG91dHB1dCA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpLFxuICAgICAgc2tpcCA9IHRoaXMuX3NraXAsXG4gICAgICBmID0gdGhpcztcblxuICBpbnB1dC5yZW0uZm9yRWFjaChmdW5jdGlvbih4KSB7XG4gICAgaWYgKHNraXBbeC5faWRdICE9PSAxKSBvdXRwdXQucmVtLnB1c2goeCk7XG4gICAgZWxzZSBza2lwW3guX2lkXSA9IDA7XG4gIH0pO1xuXG4gIGlucHV0LmFkZC5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAodGVzdC5jYWxsKGYsIHgpKSBvdXRwdXQuYWRkLnB1c2goeCk7XG4gICAgZWxzZSBza2lwW3guX2lkXSA9IDE7XG4gIH0pO1xuXG4gIGlucHV0Lm1vZC5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcbiAgICB2YXIgYiA9IHRlc3QuY2FsbChmLCB4KSxcbiAgICAgICAgcyA9IChza2lwW3guX2lkXSA9PT0gMSk7XG4gICAgaWYgKGIgJiYgcykge1xuICAgICAgc2tpcFt4Ll9pZF0gPSAwO1xuICAgICAgb3V0cHV0LmFkZC5wdXNoKHgpO1xuICAgIH0gZWxzZSBpZiAoYiAmJiAhcykge1xuICAgICAgb3V0cHV0Lm1vZC5wdXNoKHgpO1xuICAgIH0gZWxzZSBpZiAoIWIgJiYgcykge1xuICAgICAgLy8gZG8gbm90aGluZywga2VlcCBza2lwIHRydWVcbiAgICB9IGVsc2UgeyAvLyAhYiAmJiAhc1xuICAgICAgb3V0cHV0LnJlbS5wdXNoKHgpO1xuICAgICAgc2tpcFt4Ll9pZF0gPSAxO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG91dHB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsdGVyOyIsInZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxuICAgIGRlYnVnID0gcmVxdWlyZSgnLi4vdXRpbC9kZWJ1ZycpLCBcbiAgICB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyksIFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpO1xuXG5mdW5jdGlvbiBGb2xkKGdyYXBoKSB7XG4gIFRyYW5zZm9ybS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgVHJhbnNmb3JtLmFkZFBhcmFtZXRlcnModGhpcywge1xuICAgIGZpZWxkczoge3R5cGU6IFwiYXJyYXk8ZmllbGQ+XCJ9IFxuICB9KTtcblxuICB0aGlzLl9vdXRwdXQgPSB7a2V5OiBcImtleVwiLCB2YWx1ZTogXCJ2YWx1ZVwifTtcbiAgdGhpcy5fY2FjaGUgPSB7fTtcblxuICByZXR1cm4gdGhpcy5yb3V0ZXIodHJ1ZSkucmV2aXNlcyh0cnVlKTtcbn1cblxudmFyIHByb3RvID0gKEZvbGQucHJvdG90eXBlID0gbmV3IFRyYW5zZm9ybSgpKTtcblxuZnVuY3Rpb24gcnN0KGlucHV0LCBvdXRwdXQpIHsgXG4gIGZvcih2YXIgaWQgaW4gdGhpcy5fY2FjaGUpIG91dHB1dC5yZW0ucHVzaC5hcHBseShvdXRwdXQucmVtLCB0aGlzLl9jYWNoZVtpZF0pO1xuICB0aGlzLl9jYWNoZSA9IHt9O1xufTtcblxuZnVuY3Rpb24gZ2V0X3R1cGxlKHgsIGksIGxlbikge1xuICB2YXIgbGlzdCA9IHRoaXMuX2NhY2hlW3guX2lkXSB8fCAodGhpcy5fY2FjaGVbeC5faWRdID0gQXJyYXkobGVuKSk7XG4gIHJldHVybiBsaXN0W2ldIHx8IChsaXN0W2ldID0gdHVwbGUuZGVyaXZlKHgsIHguX3ByZXYpKTtcbn07XG5cbmZ1bmN0aW9uIGZuKGRhdGEsIGZpZWxkcywgYWNjZXNzb3JzLCBvdXQsIHN0YW1wKSB7XG4gIHZhciBpID0gMCwgZGxlbiA9IGRhdGEubGVuZ3RoLFxuICAgICAgaiwgZmxlbiA9IGZpZWxkcy5sZW5ndGgsXG4gICAgICBkLCB0O1xuXG4gIGZvcig7IGk8ZGxlbjsgKytpKSB7XG4gICAgZCA9IGRhdGFbaV07XG4gICAgZm9yKGo9MDsgajxmbGVuOyArK2opIHtcbiAgICAgIHQgPSBnZXRfdHVwbGUuY2FsbCh0aGlzLCBkLCBqLCBmbGVuKTsgIFxuICAgICAgdHVwbGUuc2V0KHQsIHRoaXMuX291dHB1dC5rZXksIGZpZWxkc1tqXSk7XG4gICAgICB0dXBsZS5zZXQodCwgdGhpcy5fb3V0cHV0LnZhbHVlLCBhY2Nlc3NvcnNbal0oZCkpO1xuICAgICAgb3V0LnB1c2godCk7XG4gICAgfSAgICAgIFxuICB9XG59O1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCwgcmVzZXQpIHtcbiAgZGVidWcoaW5wdXQsIFtcImZvbGRpbmdcIl0pO1xuXG4gIHZhciBmb2xkID0gdGhpcyxcbiAgICAgIG9uID0gdGhpcy5maWVsZHMuZ2V0KHRoaXMuX2dyYXBoKSxcbiAgICAgIGZpZWxkcyA9IG9uLmZpZWxkcywgYWNjZXNzb3JzID0gb24uYWNjZXNzb3JzLFxuICAgICAgb3V0cHV0ID0gY2hhbmdlc2V0LmNyZWF0ZShpbnB1dCk7XG5cbiAgaWYocmVzZXQpIHJzdC5jYWxsKHRoaXMsIGlucHV0LCBvdXRwdXQpO1xuXG4gIGZuLmNhbGwodGhpcywgaW5wdXQuYWRkLCBmaWVsZHMsIGFjY2Vzc29ycywgb3V0cHV0LmFkZCwgaW5wdXQuc3RhbXApO1xuICBmbi5jYWxsKHRoaXMsIGlucHV0Lm1vZCwgZmllbGRzLCBhY2Nlc3NvcnMsIHJlc2V0ID8gb3V0cHV0LmFkZCA6IG91dHB1dC5tb2QsIGlucHV0LnN0YW1wKTtcbiAgaW5wdXQucmVtLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgIG91dHB1dC5yZW0ucHVzaC5hcHBseShvdXRwdXQucmVtLCBmb2xkLl9jYWNoZVt4Ll9pZF0pO1xuICAgIGZvbGQuX2NhY2hlW3guX2lkXSA9IG51bGw7XG4gIH0pO1xuXG4gIC8vIElmIHdlJ3JlIG9ubHkgcHJvcGFnYXRpbmcgdmFsdWVzLCBkb24ndCBtYXJrIGtleS92YWx1ZSBhcyB1cGRhdGVkLlxuICBpZihpbnB1dC5hZGQubGVuZ3RoIHx8IGlucHV0LnJlbS5sZW5ndGggfHwgXG4gICAgZmllbGRzLnNvbWUoZnVuY3Rpb24oZikgeyByZXR1cm4gISFpbnB1dC5maWVsZHNbZl07IH0pKVxuICAgICAgb3V0cHV0LmZpZWxkc1t0aGlzLl9vdXRwdXQua2V5XSA9IDEsIG91dHB1dC5maWVsZHNbdGhpcy5fb3V0cHV0LnZhbHVlXSA9IDE7XG4gIHJldHVybiBvdXRwdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvbGQ7IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgQ29sbGVjdG9yID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvQ29sbGVjdG9yJyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpLFxuICAgIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCk7XG5cbmZ1bmN0aW9uIEZvcmNlKGdyYXBoKSB7XG4gIFRyYW5zZm9ybS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgVHJhbnNmb3JtLmFkZFBhcmFtZXRlcnModGhpcywge1xuICAgIHNpemU6IHt0eXBlOiBcImFycmF5PHZhbHVlPlwiLCBkZWZhdWx0OiBbNTAwLCA1MDBdfSxcbiAgICBsaW5rczoge3R5cGU6IFwiZGF0YVwifSxcbiAgICBsaW5rRGlzdGFuY2U6IHt0eXBlOiBcImZpZWxkXCIsIGRlZmF1bHQ6IDIwfSxcbiAgICBsaW5rU3RyZW5ndGg6IHt0eXBlOiBcImZpZWxkXCIsIGRlZmF1bHQ6IDF9LFxuICAgIGNoYXJnZToge3R5cGU6IFwiZmllbGRcIiwgZGVmYXVsdDogMzB9LFxuICAgIGNoYXJnZURpc3RhbmNlOiB7dHlwZTogXCJmaWVsZFwiLCBkZWZhdWx0OiBJbmZpbml0eX0sXG4gICAgaXRlcmF0aW9uczoge3R5cGU6IFwidmFsdWVcIiwgZGVmYXVsdDogNTAwfSxcbiAgICBmcmljdGlvbjoge3R5cGU6IFwidmFsdWVcIiwgZGVmYXVsdDogMC45fSxcbiAgICB0aGV0YToge3R5cGU6IFwidmFsdWVcIiwgZGVmYXVsdDogMC44fSxcbiAgICBncmF2aXR5OiB7dHlwZTogXCJ2YWx1ZVwiLCBkZWZhdWx0OiAwLjF9LFxuICAgIGFscGhhOiB7dHlwZTogXCJ2YWx1ZVwiLCBkZWZhdWx0OiAwLjF9XG4gIH0pO1xuXG4gIHRoaXMuX25vZGVzID0gW107XG4gIHRoaXMuX2xpbmtzID0gW107XG4gIHRoaXMuX2xheW91dCA9IGQzLmxheW91dC5mb3JjZSgpO1xuXG4gIHRoaXMuX291dHB1dCA9IHtcbiAgICBcInhcIjogXCJmb3JjZTp4XCIsXG4gICAgXCJ5XCI6IFwiZm9yY2U6eVwiLFxuICAgIFwic291cmNlXCI6IFwiZm9yY2U6c291cmNlXCIsXG4gICAgXCJ0YXJnZXRcIjogXCJmb3JjZTp0YXJnZXRcIlxuICB9O1xuXG4gIHJldHVybiB0aGlzO1xufVxuXG52YXIgcHJvdG8gPSAoRm9yY2UucHJvdG90eXBlID0gbmV3IFRyYW5zZm9ybSgpKTtcblxuZnVuY3Rpb24gZ2V0KHRyYW5zZm9ybSwgbmFtZSkge1xuICB2YXIgdiA9IHRyYW5zZm9ybVtuYW1lXS5nZXQodHJhbnNmb3JtLl9ncmFwaCk7XG4gIHJldHVybiB2LmFjY2Vzc29yXG4gICAgPyBmdW5jdGlvbih4KSB7IHJldHVybiB2LmFjY2Vzc29yKHgudHVwbGUpOyB9XG4gICAgOiB2LmZpZWxkO1xufVxuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihub2RlSW5wdXQpIHtcbiAgLy8gZ2V0IHZhcmlhYmxlc1xuICB2YXIgZyA9IHRoaXMuX2dyYXBoLFxuICAgICAgbGlua0lucHV0ID0gdGhpcy5saW5rcy5nZXQoZykuc291cmNlLmxhc3QoKSxcbiAgICAgIGxheW91dCA9IHRoaXMuX2xheW91dCxcbiAgICAgIG91dHB1dCA9IHRoaXMuX291dHB1dCxcbiAgICAgIG5vZGVzID0gdGhpcy5fbm9kZXMsXG4gICAgICBsaW5rcyA9IHRoaXMuX2xpbmtzLFxuICAgICAgaXRlciA9IHRoaXMuaXRlcmF0aW9ucy5nZXQoZyk7XG5cbiAgLy8gcHJvY2VzcyBhZGRlZCBub2Rlc1xuICBub2RlSW5wdXQuYWRkLmZvckVhY2goZnVuY3Rpb24obikge1xuICAgIG5vZGVzLnB1c2goe3R1cGxlOiBufSk7XG4gIH0pO1xuXG4gIC8vIHByb2Nlc3MgYWRkZWQgZWRnZXNcbiAgbGlua0lucHV0LmFkZC5mb3JFYWNoKGZ1bmN0aW9uKGwpIHtcbiAgICB2YXIgbGluayA9IHtcbiAgICAgIHR1cGxlOiBsLFxuICAgICAgc291cmNlOiBub2Rlc1tsLnNvdXJjZV0sXG4gICAgICB0YXJnZXQ6IG5vZGVzW2wudGFyZ2V0XVxuICAgIH07XG4gICAgdHVwbGUuc2V0KGwsIG91dHB1dC5zb3VyY2UsIGxpbmsuc291cmNlLnR1cGxlKTtcbiAgICB0dXBsZS5zZXQobCwgb3V0cHV0LnRhcmdldCwgbGluay50YXJnZXQudHVwbGUpO1xuICAgIGxpbmtzLnB1c2gobGluayk7XG4gIH0pO1xuXG4gIC8vIFRPRE8gcHJvY2VzcyBcIm1vZFwiIG9mIGVkZ2Ugc291cmNlIG9yIHRhcmdldD9cblxuICAvLyBjb25maWd1cmUgbGF5b3V0XG4gIGxheW91dFxuICAgIC5zaXplKHRoaXMuc2l6ZS5nZXQoZykpXG4gICAgLmxpbmtEaXN0YW5jZShnZXQodGhpcywgXCJsaW5rRGlzdGFuY2VcIikpXG4gICAgLmxpbmtTdHJlbmd0aChnZXQodGhpcywgXCJsaW5rU3RyZW5ndGhcIikpXG4gICAgLmNoYXJnZShnZXQodGhpcywgXCJjaGFyZ2VcIikpXG4gICAgLmNoYXJnZURpc3RhbmNlKGdldCh0aGlzLCBcImNoYXJnZURpc3RhbmNlXCIpKVxuICAgIC5mcmljdGlvbih0aGlzLmZyaWN0aW9uLmdldChnKSlcbiAgICAudGhldGEodGhpcy50aGV0YS5nZXQoZykpXG4gICAgLmdyYXZpdHkodGhpcy5ncmF2aXR5LmdldChnKSlcbiAgICAuYWxwaGEodGhpcy5hbHBoYS5nZXQoZykpXG4gICAgLm5vZGVzKG5vZGVzKVxuICAgIC5saW5rcyhsaW5rcyk7XG5cbiAgLy8gcnVuIGxheW91dFxuICBsYXlvdXQuc3RhcnQoKTtcbiAgZm9yICh2YXIgaT0wOyBpPGl0ZXI7ICsraSkge1xuICAgIGxheW91dC50aWNrKCk7XG4gIH1cbiAgbGF5b3V0LnN0b3AoKTtcblxuICAvLyBjb3B5IGxheW91dCB2YWx1ZXMgdG8gbm9kZXNcbiAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbihuKSB7XG4gICAgdHVwbGUuc2V0KG4udHVwbGUsIG91dHB1dC54LCBuLngpO1xuICAgIHR1cGxlLnNldChuLnR1cGxlLCBvdXRwdXQueSwgbi55KTtcbiAgfSk7XG5cbiAgLy8gcHJvY2VzcyByZW1vdmVkIG5vZGVzXG4gIGlmIChub2RlSW5wdXQucmVtLmxlbmd0aCA+IDApIHtcbiAgICB2YXIgbm9kZUlkcyA9IHR1cGxlLmlkTWFwKG5vZGVJbnB1dC5yZW0pO1xuICAgIHRoaXMuX25vZGVzID0gbm9kZXMuZmlsdGVyKGZ1bmN0aW9uKG4pIHsgcmV0dXJuICFub2RlSWRzW24udHVwbGUuX2lkXTsgfSk7XG4gIH1cblxuICAvLyBwcm9jZXNzIHJlbW92ZWQgZWRnZXNcbiAgaWYgKGxpbmtJbnB1dC5yZW0ubGVuZ3RoID4gMCkge1xuICAgIHZhciBsaW5rSWRzID0gdHVwbGUuaWRNYXAobGlua0lucHV0LnJlbSk7XG4gICAgdGhpcy5fbGlua3MgPSBsaW5rcy5maWx0ZXIoZnVuY3Rpb24obCkgeyByZXR1cm4gIWxpbmtJZHNbbC50dXBsZS5faWRdOyB9KTtcbiAgfVxuXG4gIC8vIHJldHVybiBjaGFuZ2VzZXRcbiAgbm9kZUlucHV0LmZpZWxkc1tvdXRwdXQueF0gPSAxO1xuICBub2RlSW5wdXQuZmllbGRzW291dHB1dC55XSA9IDE7XG4gIHJldHVybiBub2RlSW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvcmNlOyIsInZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxuICAgIHR1cGxlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvdHVwbGUnKSwgXG4gICAgZXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uL3BhcnNlL2V4cHInKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gRm9ybXVsYShncmFwaCkge1xuICBUcmFuc2Zvcm0ucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICBmaWVsZDoge3R5cGU6IFwidmFsdWVcIn0sXG4gICAgZXhwcjogIHt0eXBlOiBcImV4cHJcIn1cbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cbnZhciBwcm90byA9IChGb3JtdWxhLnByb3RvdHlwZSA9IG5ldyBUcmFuc2Zvcm0oKSk7XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGRlYnVnKGlucHV0LCBbXCJmb3JtdWxhdGluZ1wiXSk7XG4gIHZhciB0ID0gdGhpcywgXG4gICAgICBnID0gdGhpcy5fZ3JhcGgsXG4gICAgICBmaWVsZCA9IHRoaXMuZmllbGQuZ2V0KGcpLFxuICAgICAgZXhwciA9IHRoaXMuZXhwci5nZXQoZyksXG4gICAgICBkZXBzID0gdGhpcy5kZXBlbmRlbmN5KEMuU0lHTkFMUyk7XG4gIFxuICBmdW5jdGlvbiBzZXQoeCkge1xuICAgIHZhciB2YWwgPSBleHByZXNzaW9uLmV2YWwoZywgZXhwciwgeCwgbnVsbCwgbnVsbCwgbnVsbCwgZGVwcyk7XG4gICAgdHVwbGUuc2V0KHgsIGZpZWxkLCB2YWwpO1xuICB9XG5cbiAgaW5wdXQuYWRkLmZvckVhY2goc2V0KTtcbiAgXG4gIGlmICh0aGlzLnJlZXZhbHVhdGUoaW5wdXQpKSB7XG4gICAgaW5wdXQubW9kLmZvckVhY2goc2V0KTtcbiAgfVxuXG4gIGlucHV0LmZpZWxkc1tmaWVsZF0gPSAxO1xuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm11bGE7IiwidmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyksXG4gICAgdHVwbGUgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy90dXBsZScpLFxuICAgIGNoYW5nZXNldCA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L2NoYW5nZXNldCcpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBHcm91cEJ5KGdyYXBoKSB7XG4gIGlmKGdyYXBoKSB0aGlzLmluaXQoZ3JhcGgpO1xuICByZXR1cm4gdGhpcztcbn1cblxudmFyIHByb3RvID0gKEdyb3VwQnkucHJvdG90eXBlID0gbmV3IFRyYW5zZm9ybSgpKTtcblxucHJvdG8uaW5pdCA9IGZ1bmN0aW9uKGdyYXBoKSB7XG4gIHRoaXMuX2diID0gbnVsbDsgLy8gZmllbGRzK2FjY2Vzc29ycyB0byBncm91cGJ5IGZpZWxkc1xuICB0aGlzLl9jZWxscyA9IHt9O1xuICByZXR1cm4gVHJhbnNmb3JtLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgZ3JhcGgpXG4gICAgLnJvdXRlcih0cnVlKS5yZXZpc2VzKHRydWUpO1xufTtcblxucHJvdG8uZGF0YSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5fY2VsbHM7IH07XG5cbnByb3RvLl9yZXNldCA9IGZ1bmN0aW9uKGlucHV0LCBvdXRwdXQpIHtcbiAgdmFyIGssIGM7XG4gIGZvcihrIGluIHRoaXMuX2NlbGxzKSB7XG4gICAgaWYoIShjID0gdGhpcy5fY2VsbHNba10pKSBjb250aW51ZTtcbiAgICBvdXRwdXQucmVtLnB1c2goYy50cGwpO1xuICB9XG4gIHRoaXMuX2NlbGxzID0ge307XG59O1xuXG5wcm90by5fa2V5cyA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGFjYyA9IHRoaXMuX2diLmFjY2Vzc29ycyB8fCBbdGhpcy5fZ2IuYWNjZXNzb3JdO1xuICB2YXIga2V5cyA9IGFjYy5yZWR1Y2UoZnVuY3Rpb24oZywgZikge1xuICAgIHJldHVybiAoKHYgPSBmKHgpKSAhPT0gdW5kZWZpbmVkKSA/IChnLnB1c2godiksIGcpIDogZztcbiAgfSwgW10pLCBrID0ga2V5cy5qb2luKFwifFwiKSwgdjtcbiAgcmV0dXJuIGtleXMubGVuZ3RoID4gMCA/IHtrZXlzOiBrZXlzLCBrZXk6IGt9IDogdW5kZWZpbmVkO1xufTtcblxucHJvdG8uX2NlbGwgPSBmdW5jdGlvbih4KSB7XG4gIHZhciBrID0gdGhpcy5fa2V5cyh4KTtcbiAgcmV0dXJuIHRoaXMuX2NlbGxzW2sua2V5XSB8fCAodGhpcy5fY2VsbHNbay5rZXldID0gdGhpcy5fbmV3X2NlbGwoeCwgaykpO1xufTtcblxucHJvdG8uX25ld19jZWxsID0gZnVuY3Rpb24oeCwgaykge1xuICByZXR1cm4ge1xuICAgIGNudDogMCxcbiAgICB0cGw6IHRoaXMuX25ld190dXBsZSh4LCBrKSxcbiAgICBmbGc6IEMuQUREX0NFTExcbiAgfTtcbn07XG5cbnByb3RvLl9uZXdfdHVwbGUgPSBmdW5jdGlvbih4LCBrKSB7XG4gIHZhciBnYiA9IHRoaXMuX2diLFxuICAgICAgZmllbGRzID0gZ2IuZmllbGRzIHx8IFtnYi5maWVsZF0sXG4gICAgICBhY2MgPSBnYi5hY2Nlc3NvcnMgfHwgW2diLmFjY2Vzc29yXSxcbiAgICAgIHQgPSB7fSwgaSwgbGVuO1xuXG4gIGZvcihpPTAsIGxlbj1maWVsZHMubGVuZ3RoOyBpPGxlbjsgKytpKSB7XG4gICAgdFtmaWVsZHNbaV1dID0gYWNjW2ldKHgpO1xuICB9IFxuXG4gIHJldHVybiB0dXBsZS5pbmdlc3QodCwgbnVsbCk7XG59O1xuXG5wcm90by5fYWRkID0gZnVuY3Rpb24oeCkge1xuICB2YXIgY2VsbCA9IHRoaXMuX2NlbGwoeCk7XG4gIGNlbGwuY250ICs9IDE7XG4gIGNlbGwuZmxnIHw9IEMuTU9EX0NFTEw7XG4gIHJldHVybiBjZWxsO1xufTtcblxucHJvdG8uX3JlbSA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIGNlbGwgPSB0aGlzLl9jZWxsKHgpO1xuICBjZWxsLmNudCAtPSAxO1xuICBjZWxsLmZsZyB8PSBDLk1PRF9DRUxMO1xuICByZXR1cm4gY2VsbDtcbn07XG5cbnByb3RvLl9tb2QgPSBmdW5jdGlvbih4LCByZXNldCkge1xuICBpZih4Ll9wcmV2ICYmIHguX3ByZXYgIT09IEMuU0VOVElORUwgJiYgdGhpcy5fa2V5cyh4Ll9wcmV2KSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fcmVtKHguX3ByZXYpO1xuICAgIHJldHVybiB0aGlzLl9hZGQoeCk7XG4gIH0gZWxzZSBpZihyZXNldCkgeyAvLyBTaWduYWwgY2hhbmdlIHRyaWdnZXJlZCByZWZsb3dcbiAgICByZXR1cm4gdGhpcy5fYWRkKHgpO1xuICB9XG4gIHJldHVybiB0aGlzLl9jZWxsKHgpO1xufTtcblxucHJvdG8udHJhbnNmb3JtID0gZnVuY3Rpb24oaW5wdXQsIHJlc2V0KSB7XG4gIHZhciBncm91cEJ5ID0gdGhpcyxcbiAgICAgIG91dHB1dCA9IGNoYW5nZXNldC5jcmVhdGUoaW5wdXQpLFxuICAgICAgaywgYywgZiwgdDtcblxuICBpZihyZXNldCkgdGhpcy5fcmVzZXQoaW5wdXQsIG91dHB1dCk7XG5cbiAgaW5wdXQuYWRkLmZvckVhY2goZnVuY3Rpb24oeCkgeyBncm91cEJ5Ll9hZGQoeCk7IH0pO1xuICBpbnB1dC5tb2QuZm9yRWFjaChmdW5jdGlvbih4KSB7IGdyb3VwQnkuX21vZCh4LCByZXNldCk7IH0pO1xuICBpbnB1dC5yZW0uZm9yRWFjaChmdW5jdGlvbih4KSB7XG4gICAgaWYoeC5fcHJldiAmJiB4Ll9wcmV2ICE9PSBDLlNFTlRJTkVMICYmIGdyb3VwQnkuX2tleXMoeC5fcHJldikgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZ3JvdXBCeS5fcmVtKHguX3ByZXYpO1xuICAgIH0gZWxzZSB7XG4gICAgICBncm91cEJ5Ll9yZW0oeCk7XG4gICAgfVxuICB9KTtcblxuICBmb3IoayBpbiB0aGlzLl9jZWxscykge1xuICAgIGMgPSB0aGlzLl9jZWxsc1trXTtcbiAgICBpZighYykgY29udGludWU7XG4gICAgZiA9IGMuZmxnO1xuICAgIHQgPSBjLnRwbDtcblxuICAgIGlmKGMuY250ID09PSAwKSB7XG4gICAgICBpZihmID09PSBDLk1PRF9DRUxMKSBvdXRwdXQucmVtLnB1c2godCk7XG4gICAgICB0aGlzLl9jZWxsc1trXSA9IG51bGw7XG4gICAgfSBlbHNlIGlmKGYgJiBDLkFERF9DRUxMKSB7XG4gICAgICBvdXRwdXQuYWRkLnB1c2godCk7XG4gICAgfSBlbHNlIGlmKGYgJiBDLk1PRF9DRUxMKSB7XG4gICAgICBvdXRwdXQubW9kLnB1c2godCk7XG4gICAgfVxuICAgIGMuZmxnID0gMDtcbiAgfVxuXG4gIHJldHVybiBvdXRwdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwQnk7IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIGV4cHIgPSByZXF1aXJlKCcuLi9wYXJzZS9leHByJyksXG4gICAgQyA9IHJlcXVpcmUoJy4uL3V0aWwvY29uc3RhbnRzJyk7XG5cbnZhciBhcnJheVR5cGUgPSAvYXJyYXkvaSxcbiAgICBkYXRhVHlwZSAgPSAvZGF0YS9pLFxuICAgIGZpZWxkVHlwZSA9IC9maWVsZC9pLFxuICAgIGV4cHJUeXBlICA9IC9leHByL2k7XG5cbmZ1bmN0aW9uIFBhcmFtZXRlcihuYW1lLCB0eXBlKSB7XG4gIHRoaXMuX25hbWUgPSBuYW1lO1xuICB0aGlzLl90eXBlID0gdHlwZTtcblxuICAvLyBJZiBwYXJhbWV0ZXIgaXMgZGVmaW5lZCB3L3NpZ25hbHMsIGl0IG11c3QgYmUgcmVzb2x2ZWRcbiAgLy8gb24gZXZlcnkgcHVsc2UuXG4gIHRoaXMuX3ZhbHVlID0gW107XG4gIHRoaXMuX2FjY2Vzc29ycyA9IFtdO1xuICB0aGlzLl9yZXNvbHV0aW9uID0gZmFsc2U7XG4gIHRoaXMuX3NpZ25hbHMgPSB7fTtcbn1cblxudmFyIHByb3RvID0gUGFyYW1ldGVyLnByb3RvdHlwZTtcblxucHJvdG8uX2dldCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaXNBcnJheSA9IGFycmF5VHlwZS50ZXN0KHRoaXMuX3R5cGUpLFxuICAgICAgaXNEYXRhICA9IGRhdGFUeXBlLnRlc3QodGhpcy5fdHlwZSksXG4gICAgICBpc0ZpZWxkID0gZmllbGRUeXBlLnRlc3QodGhpcy5fdHlwZSk7XG5cbiAgaWYgKGlzRGF0YSkge1xuICAgIHJldHVybiBpc0FycmF5ID8geyBuYW1lczogdGhpcy5fdmFsdWUsIHNvdXJjZXM6IHRoaXMuX2FjY2Vzc29ycyB9IDpcbiAgICAgIHsgbmFtZTogdGhpcy5fdmFsdWVbMF0sIHNvdXJjZTogdGhpcy5fYWNjZXNzb3JzWzBdIH07XG4gIH0gZWxzZSBpZiAoaXNGaWVsZCkge1xuICAgIHJldHVybiBpc0FycmF5ID8geyBmaWVsZHM6IHRoaXMuX3ZhbHVlLCBhY2Nlc3NvcnM6IHRoaXMuX2FjY2Vzc29ycyB9IDpcbiAgICAgIHsgZmllbGQ6IHRoaXMuX3ZhbHVlWzBdLCBhY2Nlc3NvcjogdGhpcy5fYWNjZXNzb3JzWzBdIH07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGlzQXJyYXkgPyB0aGlzLl92YWx1ZSA6IHRoaXMuX3ZhbHVlWzBdO1xuICB9XG59O1xuXG5wcm90by5nZXQgPSBmdW5jdGlvbihncmFwaCkge1xuICB2YXIgaXNEYXRhICA9IGRhdGFUeXBlLnRlc3QodGhpcy5fdHlwZSksXG4gICAgICBpc0ZpZWxkID0gZmllbGRUeXBlLnRlc3QodGhpcy5fdHlwZSksXG4gICAgICBzLCBpZHgsIHZhbDtcblxuICAvLyBJZiB3ZSBkb24ndCByZXF1aXJlIHJlc29sdXRpb24sIHJldHVybiB0aGUgdmFsdWUgaW1tZWRpYXRlbHkuXG4gIGlmICghdGhpcy5fcmVzb2x1dGlvbikgcmV0dXJuIHRoaXMuX2dldCgpO1xuXG4gIGlmIChpc0RhdGEpIHtcbiAgICB0aGlzLl9hY2Nlc3NvcnMgPSB0aGlzLl92YWx1ZS5tYXAoZnVuY3Rpb24odikgeyByZXR1cm4gZ3JhcGguZGF0YSh2KTsgfSk7XG4gICAgcmV0dXJuIHRoaXMuX2dldCgpOyAvLyBUT0RPOiBzdXBwb3J0IHNpZ25hbCBhcyBkYXRhVHlwZXNcbiAgfVxuXG4gIGZvcihzIGluIHRoaXMuX3NpZ25hbHMpIHtcbiAgICBpZHggID0gdGhpcy5fc2lnbmFsc1tzXTtcbiAgICB2YWwgID0gZ3JhcGguc2lnbmFsUmVmKHMpO1xuXG4gICAgaWYgKGlzRmllbGQpIHtcbiAgICAgIHRoaXMuX2FjY2Vzc29yc1tpZHhdID0gdGhpcy5fdmFsdWVbaWR4XSAhPSB2YWwgPyBcbiAgICAgICAgZGwuYWNjZXNzb3IodmFsKSA6IHRoaXMuX2FjY2Vzc29yc1tpZHhdO1xuICAgIH1cblxuICAgIHRoaXMuX3ZhbHVlW2lkeF0gPSB2YWw7XG4gIH1cblxuICByZXR1cm4gdGhpcy5fZ2V0KCk7XG59O1xuXG5wcm90by5zZXQgPSBmdW5jdGlvbih0cmFuc2Zvcm0sIHZhbHVlKSB7XG4gIHZhciBwYXJhbSA9IHRoaXMsIFxuICAgICAgaXNFeHByID0gZXhwclR5cGUudGVzdCh0aGlzLl90eXBlKSxcbiAgICAgIGlzRGF0YSAgPSBkYXRhVHlwZS50ZXN0KHRoaXMuX3R5cGUpLFxuICAgICAgaXNGaWVsZCA9IGZpZWxkVHlwZS50ZXN0KHRoaXMuX3R5cGUpO1xuXG4gIHRoaXMuX3ZhbHVlID0gZGwuYXJyYXkodmFsdWUpLm1hcChmdW5jdGlvbih2LCBpKSB7XG4gICAgaWYgKGRsLmlzU3RyaW5nKHYpKSB7XG4gICAgICBpZiAoaXNFeHByKSB7XG4gICAgICAgIHZhciBlID0gZXhwcih2KTtcbiAgICAgICAgdHJhbnNmb3JtLmRlcGVuZGVuY3koQy5GSUVMRFMsICBlLmZpZWxkcyk7XG4gICAgICAgIHRyYW5zZm9ybS5kZXBlbmRlbmN5KEMuU0lHTkFMUywgZS5zaWduYWxzKTtcbiAgICAgICAgcmV0dXJuIGUuZm47XG4gICAgICB9IGVsc2UgaWYgKGlzRmllbGQpIHsgIC8vIEJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgICAgIHBhcmFtLl9hY2Nlc3NvcnNbaV0gPSBkbC5hY2Nlc3Nvcih2KTtcbiAgICAgICAgdHJhbnNmb3JtLmRlcGVuZGVuY3koQy5GSUVMRFMsIHYpO1xuICAgICAgfSBlbHNlIGlmIChpc0RhdGEpIHtcbiAgICAgICAgcGFyYW0uX3Jlc29sdXRpb24gPSB0cnVlO1xuICAgICAgICB0cmFuc2Zvcm0uZGVwZW5kZW5jeShDLkRBVEEsIHYpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHY7XG4gICAgfSBlbHNlIGlmICh2LnZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB2LnZhbHVlO1xuICAgIH0gZWxzZSBpZiAodi5maWVsZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBwYXJhbS5fYWNjZXNzb3JzW2ldID0gZGwuYWNjZXNzb3Iodi5maWVsZCk7XG4gICAgICB0cmFuc2Zvcm0uZGVwZW5kZW5jeShDLkZJRUxEUywgdi5maWVsZCk7XG4gICAgICByZXR1cm4gdi5maWVsZDtcbiAgICB9IGVsc2UgaWYgKHYuc2lnbmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHBhcmFtLl9yZXNvbHV0aW9uID0gdHJ1ZTtcbiAgICAgIHBhcmFtLl9zaWduYWxzW3Yuc2lnbmFsXSA9IGk7XG4gICAgICB0cmFuc2Zvcm0uZGVwZW5kZW5jeShDLlNJR05BTFMsIHYuc2lnbmFsKTtcbiAgICAgIHJldHVybiB2LnNpZ25hbDtcbiAgICB9XG5cbiAgICByZXR1cm4gdjtcbiAgfSk7XG5cbiAgcmV0dXJuIHRyYW5zZm9ybTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGFyYW1ldGVyOyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKSxcbiAgICBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxuICAgIGV4cHIgPSByZXF1aXJlKCcuLi9wYXJzZS9leHByJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyk7XG5cbmZ1bmN0aW9uIFNvcnQoZ3JhcGgpIHtcbiAgVHJhbnNmb3JtLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgZ3JhcGgpO1xuICBUcmFuc2Zvcm0uYWRkUGFyYW1ldGVycyh0aGlzLCB7Ynk6IHt0eXBlOiBcImFycmF5PGZpZWxkPlwifSB9KTtcbiAgcmV0dXJuIHRoaXMucm91dGVyKHRydWUpO1xufVxuXG52YXIgcHJvdG8gPSAoU29ydC5wcm90b3R5cGUgPSBuZXcgVHJhbnNmb3JtKCkpO1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCkge1xuICBkZWJ1ZyhpbnB1dCwgW1wic29ydGluZ1wiXSk7XG5cbiAgaWYoaW5wdXQuYWRkLmxlbmd0aCB8fCBpbnB1dC5tb2QubGVuZ3RoIHx8IGlucHV0LnJlbS5sZW5ndGgpIHtcbiAgICBpbnB1dC5zb3J0ID0gZGwuY29tcGFyYXRvcih0aGlzLmJ5LmdldCh0aGlzLl9ncmFwaCkuZmllbGRzKTtcbiAgfVxuXG4gIHJldHVybiBpbnB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU29ydDsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICBDb2xsZWN0b3IgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Db2xsZWN0b3InKSxcbiAgICB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvY2hhbmdlc2V0Jyk7XG5cbmZ1bmN0aW9uIFN0YWNrKGdyYXBoKSB7XG4gIFRyYW5zZm9ybS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgVHJhbnNmb3JtLmFkZFBhcmFtZXRlcnModGhpcywge1xuICAgIGdyb3VwYnk6IHt0eXBlOiBcImFycmF5PGZpZWxkPlwifSxcbiAgICBzb3J0Ynk6IHt0eXBlOiBcImFycmF5PGZpZWxkPlwifSxcbiAgICB2YWx1ZToge3R5cGU6IFwiZmllbGRcIn0sXG4gICAgb2Zmc2V0OiB7dHlwZTogXCJ2YWx1ZVwiLCBkZWZhdWx0OiBcInplcm9cIn1cbiAgfSk7XG5cbiAgdGhpcy5fb3V0cHV0ID0ge1xuICAgIFwic3RhcnRcIjogXCJ5MlwiLFxuICAgIFwic3RvcFwiOiBcInlcIixcbiAgICBcIm1pZFwiOiBcImN5XCJcbiAgfTtcbiAgdGhpcy5fY29sbGVjdG9yID0gbmV3IENvbGxlY3RvcihncmFwaCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59XG5cbnZhciBwcm90byA9IChTdGFjay5wcm90b3R5cGUgPSBuZXcgVHJhbnNmb3JtKCkpO1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCkge1xuICAvLyBNYXRlcmlhbGl6ZSB0aGUgY3VycmVudCBkYXRhc291cmNlLiBUT0RPOiBzaGFyZSBjb2xsZWN0b3JzXG4gIHRoaXMuX2NvbGxlY3Rvci5ldmFsdWF0ZShpbnB1dCk7XG4gIHZhciBkYXRhID0gdGhpcy5fY29sbGVjdG9yLmRhdGEoKTtcblxuICB2YXIgZyA9IHRoaXMuX2dyYXBoLFxuICAgICAgZ3JvdXBieSA9IHRoaXMuZ3JvdXBieS5nZXQoZykuYWNjZXNzb3JzLFxuICAgICAgc29ydGJ5ID0gZGwuY29tcGFyYXRvcih0aGlzLnNvcnRieS5nZXQoZykuZmllbGRzKSxcbiAgICAgIHZhbHVlID0gdGhpcy52YWx1ZS5nZXQoZykuYWNjZXNzb3IsXG4gICAgICBvZmZzZXQgPSB0aGlzLm9mZnNldC5nZXQoZyksXG4gICAgICBvdXRwdXQgPSB0aGlzLl9vdXRwdXQ7XG5cbiAgLy8gcGFydGl0aW9uLCBzdW0sIGFuZCBzb3J0IHRoZSBzdGFjayBncm91cHNcbiAgdmFyIGdyb3VwcyA9IHBhcnRpdGlvbihkYXRhLCBncm91cGJ5LCBzb3J0YnksIHZhbHVlKTtcblxuICAvLyBjb21wdXRlIHN0YWNrIGxheW91dHMgcGVyIGdyb3VwXG4gIGZvciAodmFyIGk9MCwgbWF4PWdyb3Vwcy5tYXg7IGk8Z3JvdXBzLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGdyb3VwID0gZ3JvdXBzW2ldLFxuICAgICAgICBzdW0gPSBncm91cC5zdW0sXG4gICAgICAgIG9mZiA9IG9mZnNldD09PVwiY2VudGVyXCIgPyAobWF4IC0gc3VtKS8yIDogMCxcbiAgICAgICAgc2NhbGUgPSBvZmZzZXQ9PT1cIm5vcm1hbGl6ZVwiID8gKDEvc3VtKSA6IDEsXG4gICAgICAgIGksIHgsIGEsIGIgPSBvZmYsIHYgPSAwO1xuXG4gICAgLy8gc2V0IHN0YWNrIGNvb3JkaW5hdGVzIGZvciBlYWNoIGRhdHVtIGluIGdyb3VwXG4gICAgZm9yIChqPTA7IGo8Z3JvdXAubGVuZ3RoOyArK2opIHtcbiAgICAgIHggPSBncm91cFtqXTtcbiAgICAgIGEgPSBiOyAvLyB1c2UgcHJldmlvdXMgdmFsdWUgZm9yIHN0YXJ0IHBvaW50XG4gICAgICB2ICs9IHZhbHVlKHgpO1xuICAgICAgYiA9IHNjYWxlICogdiArIG9mZjsgLy8gY29tcHV0ZSBlbmQgcG9pbnRcbiAgICAgIHR1cGxlLnNldCh4LCBvdXRwdXQuc3RhcnQsIGEpO1xuICAgICAgdHVwbGUuc2V0KHgsIG91dHB1dC5zdG9wLCBiKTtcbiAgICAgIHR1cGxlLnNldCh4LCBvdXRwdXQubWlkLCAwLjUgKiAoYSArIGIpKTtcbiAgICB9XG4gIH1cblxuICBpbnB1dC5maWVsZHNbb3V0cHV0LnN0YXJ0XSA9IDE7XG4gIGlucHV0LmZpZWxkc1tvdXRwdXQuc3RvcF0gPSAxO1xuICBpbnB1dC5maWVsZHNbb3V0cHV0Lm1pZF0gPSAxO1xuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5mdW5jdGlvbiBwYXJ0aXRpb24oZGF0YSwgZ3JvdXBieSwgc29ydGJ5LCB2YWx1ZSkge1xuICB2YXIgZ3JvdXBzID0gW10sXG4gICAgICBtYXAsIGksIHgsIGssIGcsIHMsIG1heDtcblxuICAvLyBwYXJ0aXRpb24gZGF0YSBwb2ludHMgaW50byBzdGFjayBncm91cHNcbiAgaWYgKGdyb3VwYnkgPT0gbnVsbCkge1xuICAgIGdyb3Vwcy5wdXNoKGRhdGEuc2xpY2UoKSk7XG4gIH0gZWxzZSB7XG4gICAgZm9yIChtYXA9e30sIGk9MDsgaTxkYXRhLmxlbmd0aDsgKytpKSB7XG4gICAgICB4ID0gZGF0YVtpXTtcbiAgICAgIGsgPSAoZ3JvdXBieS5tYXAoZnVuY3Rpb24oZikgeyByZXR1cm4gZih4KTsgfSkpO1xuICAgICAgZyA9IG1hcFtrXSB8fCAoZ3JvdXBzLnB1c2gobWFwW2tdID0gW10pLCBtYXBba10pO1xuICAgICAgZy5wdXNoKHgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGNvbXB1dGUgc3VtcyBvZiBncm91cHMsIHNvcnQgZ3JvdXBzIGFzIG5lZWRlZFxuICBmb3IgKGs9MCwgbWF4PTA7IGs8Z3JvdXBzLmxlbmd0aDsgKytrKSB7XG4gICAgZyA9IGdyb3Vwc1trXTtcbiAgICBmb3IgKGk9MCwgcz0wOyBpPGcubGVuZ3RoOyArK2kpIHtcbiAgICAgIHMgKz0gdmFsdWUoZ1tpXSk7XG4gICAgfVxuICAgIGcuc3VtID0gcztcbiAgICBpZiAocyA+IG1heCkgbWF4ID0gcztcbiAgICBpZiAoc29ydGJ5ICE9IG51bGwpIGcuc29ydChzb3J0YnkpO1xuICB9XG4gIGdyb3Vwcy5tYXggPSBtYXg7XG5cbiAgcmV0dXJuIGdyb3Vwcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGFjazsiLCJ2YXIgTm9kZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L05vZGUnKSxcbiAgICBQYXJhbWV0ZXIgPSByZXF1aXJlKCcuL1BhcmFtZXRlcicpLFxuICAgIEMgPSByZXF1aXJlKCcuLi91dGlsL2NvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBUcmFuc2Zvcm0oZ3JhcGgpIHtcbiAgaWYoZ3JhcGgpIE5vZGUucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIHJldHVybiB0aGlzO1xufVxuXG5UcmFuc2Zvcm0uYWRkUGFyYW1ldGVycyA9IGZ1bmN0aW9uKHByb3RvLCBwYXJhbXMpIHtcbiAgdmFyIHA7XG4gIGZvciAodmFyIG5hbWUgaW4gcGFyYW1zKSB7XG4gICAgcCA9IHBhcmFtc1tuYW1lXTtcbiAgICBwcm90b1tuYW1lXSA9IG5ldyBQYXJhbWV0ZXIobmFtZSwgcC50eXBlKTtcbiAgICBpZihwLmRlZmF1bHQpIHByb3RvW25hbWVdLnNldChwcm90bywgcC5kZWZhdWx0KTtcbiAgfVxuICBwcm90by5fcGFyYW1ldGVycyA9IHBhcmFtcztcbn07XG5cbnZhciBwcm90byA9IChUcmFuc2Zvcm0ucHJvdG90eXBlID0gbmV3IE5vZGUoKSk7XG5cbnByb3RvLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gIHZhciBuID0gTm9kZS5wcm90b3R5cGUuY2xvbmUuY2FsbCh0aGlzKTtcbiAgbi50cmFuc2Zvcm0gPSB0aGlzLnRyYW5zZm9ybTtcbiAgbi5fcGFyYW1ldGVycyA9IHRoaXMuX3BhcmFtZXRlcnM7XG4gIGZvcih2YXIgayBpbiB0aGlzKSB7IFxuICAgIGlmKG5ba10pIGNvbnRpbnVlO1xuICAgIG5ba10gPSB0aGlzW2tdOyBcbiAgfVxuICByZXR1cm4gbjtcbn07XG5cbnByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0LCByZXNldCkgeyByZXR1cm4gaW5wdXQ7IH07XG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIC8vIE1hbnkgdHJhbnNmb3JtcyBzdG9yZSBjYWNoZXMgdGhhdCBtdXN0IGJlIGludmFsaWRhdGVkIGlmXG4gIC8vIGEgc2lnbmFsIHZhbHVlIGhhcyBjaGFuZ2VkLiBcbiAgdmFyIHJlc2V0ID0gdGhpcy5fc3RhbXAgPCBpbnB1dC5zdGFtcCAmJiB0aGlzLmRlcGVuZGVuY3koQy5TSUdOQUxTKS5zb21lKGZ1bmN0aW9uKHMpIHsgXG4gICAgcmV0dXJuICEhaW5wdXQuc2lnbmFsc1tzXSBcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXMudHJhbnNmb3JtKGlucHV0LCByZXNldCk7XG59O1xuXG5wcm90by5vdXRwdXQgPSBmdW5jdGlvbihtYXApIHtcbiAgZm9yICh2YXIga2V5IGluIHRoaXMuX291dHB1dCkge1xuICAgIGlmIChtYXBba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9vdXRwdXRba2V5XSA9IG1hcFtrZXldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmb3JtOyIsInZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpLFxuICAgIEdyb3VwQnkgPSByZXF1aXJlKCcuL0dyb3VwQnknKSxcbiAgICB0dXBsZSA9IHJlcXVpcmUoJy4uL2RhdGFmbG93L3R1cGxlJyksXG4gICAgZGVidWcgPSByZXF1aXJlKCcuLi91dGlsL2RlYnVnJyk7XG5cbmZ1bmN0aW9uIFVuaXF1ZShncmFwaCkge1xuICBHcm91cEJ5LnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgZ3JhcGgpO1xuICBUcmFuc2Zvcm0uYWRkUGFyYW1ldGVycyh0aGlzLCB7XG4gICAgZmllbGQ6IHt0eXBlOiBcImZpZWxkXCJ9LFxuICAgIGFzOiB7dHlwZTogXCJ2YWx1ZVwifVxuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn1cblxudmFyIHByb3RvID0gKFVuaXF1ZS5wcm90b3R5cGUgPSBuZXcgR3JvdXBCeSgpKTtcblxucHJvdG8uX25ld190dXBsZSA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIG8gID0ge30sXG4gICAgICBvbiA9IHRoaXMuZmllbGQuZ2V0KHRoaXMuX2dyYXBoKSxcbiAgICAgIGFzID0gdGhpcy5hcy5nZXQodGhpcy5fZ3JhcGgpO1xuXG4gIG9bYXNdID0gb24uYWNjZXNzb3IoeCk7XG4gIHJldHVybiB0dXBsZS5pbmdlc3QobywgbnVsbCk7XG59O1xuXG5wcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCwgcmVzZXQpIHtcbiAgZGVidWcoaW5wdXQsIFtcInVuaXF1ZXNcIl0pO1xuICB0aGlzLl9nYiA9IHRoaXMuZmllbGQuZ2V0KHRoaXMuX2dyYXBoKTtcbiAgcmV0dXJuIEdyb3VwQnkucHJvdG90eXBlLnRyYW5zZm9ybS5jYWxsKHRoaXMsIGlucHV0LCByZXNldCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVuaXF1ZTsiLCJ2YXIgZGwgPSByZXF1aXJlKCdkYXRhbGliJyksXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICBDb2xsZWN0b3IgPSByZXF1aXJlKCcuLi9kYXRhZmxvdy9Db2xsZWN0b3InKSxcbiAgICBkZWJ1ZyA9IHJlcXVpcmUoJy4uL3V0aWwvZGVidWcnKTtcblxuZnVuY3Rpb24gWmlwKGdyYXBoKSB7XG4gIFRyYW5zZm9ybS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgVHJhbnNmb3JtLmFkZFBhcmFtZXRlcnModGhpcywge1xuICAgIHdpdGg6IHt0eXBlOiBcImRhdGFcIn0sXG4gICAgYXM6ICB7dHlwZTogXCJ2YWx1ZVwifSxcbiAgICBrZXk6IHt0eXBlOiBcImZpZWxkXCIsIGRlZmF1bHQ6IFwiZGF0YVwifSxcbiAgICB3aXRoS2V5OiB7dHlwZTogXCJmaWVsZFwiLCBkZWZhdWx0OiBudWxsfSxcbiAgICBkZWZhdWx0OiB7dHlwZTogXCJ2YWx1ZVwifVxuICB9KTtcblxuICB0aGlzLl9tYXAgPSB7fTtcbiAgdGhpcy5fY29sbGVjdG9yID0gbmV3IENvbGxlY3RvcihncmFwaCk7XG4gIHRoaXMuX2xhc3RKb2luID0gMDtcblxuICByZXR1cm4gdGhpcy5yZXZpc2VzKHRydWUpO1xufVxuXG52YXIgcHJvdG8gPSAoWmlwLnByb3RvdHlwZSA9IG5ldyBUcmFuc2Zvcm0oKSk7XG5cbmZ1bmN0aW9uIG1wKGspIHtcbiAgcmV0dXJuIHRoaXMuX21hcFtrXSB8fCAodGhpcy5fbWFwW2tdID0gW10pO1xufTtcblxucHJvdG8udHJhbnNmb3JtID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHcgPSB0aGlzLndpdGguZ2V0KHRoaXMuX2dyYXBoKSxcbiAgICAgIHdkcyA9IHcuc291cmNlLFxuICAgICAgd291dHB1dCA9IHdkcy5sYXN0KCksXG4gICAgICB3ZGF0YSA9IHdkcy52YWx1ZXMoKSxcbiAgICAgIGtleSA9IHRoaXMua2V5LmdldCh0aGlzLl9ncmFwaCksXG4gICAgICB3aXRoS2V5ID0gdGhpcy53aXRoS2V5LmdldCh0aGlzLl9ncmFwaCksXG4gICAgICBhcyA9IHRoaXMuYXMuZ2V0KHRoaXMuX2dyYXBoKSxcbiAgICAgIGRmbHQgPSB0aGlzLmRlZmF1bHQuZ2V0KHRoaXMuX2dyYXBoKSxcbiAgICAgIG1hcCA9IG1wLmJpbmQodGhpcyksXG4gICAgICByZW0gPSB7fTtcblxuICBkZWJ1ZyhpbnB1dCwgW1wiemlwcGluZ1wiLCB3Lm5hbWVdKTtcblxuICBpZih3aXRoS2V5LmZpZWxkKSB7XG4gICAgaWYod291dHB1dCAmJiB3b3V0cHV0LnN0YW1wID4gdGhpcy5fbGFzdEpvaW4pIHtcbiAgICAgIHdvdXRwdXQucmVtLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgICAgICB2YXIgbSA9IG1hcCh3aXRoS2V5LmFjY2Vzc29yKHgpKTtcbiAgICAgICAgaWYobVswXSkgbVswXS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgZFthc10gPSBkZmx0IH0pO1xuICAgICAgICBtWzFdID0gbnVsbDtcbiAgICAgIH0pO1xuXG4gICAgICB3b3V0cHV0LmFkZC5mb3JFYWNoKGZ1bmN0aW9uKHgpIHsgXG4gICAgICAgIHZhciBtID0gbWFwKHdpdGhLZXkuYWNjZXNzb3IoeCkpO1xuICAgICAgICBpZihtWzBdKSBtWzBdLmZvckVhY2goZnVuY3Rpb24oZCkgeyBkW2FzXSA9IHggfSk7XG4gICAgICAgIG1bMV0gPSB4O1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIE9ubHkgcHJvY2VzcyB3b3V0cHV0Lm1vZCB0dXBsZXMgaWYgdGhlIGpvaW4ga2V5IGhhcyBjaGFuZ2VkLlxuICAgICAgLy8gT3RoZXIgZmllbGQgdXBkYXRlcyB3aWxsIGF1dG8tcHJvcGFnYXRlIHZpYSBwcm90b3R5cGUuXG4gICAgICBpZih3b3V0cHV0LmZpZWxkc1t3aXRoS2V5LmZpZWxkXSkge1xuICAgICAgICB3b3V0cHV0Lm1vZC5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICB2YXIgcHJldjtcbiAgICAgICAgICBpZigheC5fcHJldiB8fCAocHJldiA9IHdpdGhLZXkuYWNjZXNzb3IoeC5fcHJldikpID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICAgICAgICB2YXIgcHJldm0gPSBtYXAocHJldik7XG4gICAgICAgICAgaWYocHJldm1bMF0pIHByZXZtWzBdLmZvckVhY2goZnVuY3Rpb24oZCkgeyBkW2FzXSA9IGRmbHQgfSk7XG4gICAgICAgICAgcHJldm1bMV0gPSBudWxsO1xuXG4gICAgICAgICAgdmFyIG0gPSBtYXAod2l0aEtleS5hY2Nlc3Nvcih4KSk7XG4gICAgICAgICAgaWYobVswXSkgbVswXS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgZFthc10gPSB4IH0pO1xuICAgICAgICAgIG1bMV0gPSB4O1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fbGFzdEpvaW4gPSB3b3V0cHV0LnN0YW1wO1xuICAgIH1cbiAgXG4gICAgaW5wdXQuYWRkLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgICAgdmFyIG0gPSBtYXAoa2V5LmFjY2Vzc29yKHgpKTtcbiAgICAgIHhbYXNdID0gbVsxXSB8fCBkZmx0O1xuICAgICAgKG1bMF09bVswXXx8W10pLnB1c2goeCk7XG4gICAgfSk7XG5cbiAgICBpbnB1dC5yZW0uZm9yRWFjaChmdW5jdGlvbih4KSB7IFxuICAgICAgdmFyIGsgPSBrZXkuYWNjZXNzb3IoeCk7XG4gICAgICAocmVtW2tdPXJlbVtrXXx8e30pW3guX2lkXSA9IDE7XG4gICAgfSk7XG5cbiAgICBpZihpbnB1dC5maWVsZHNba2V5LmZpZWxkXSkge1xuICAgICAgaW5wdXQubW9kLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgICAgICB2YXIgcHJldjtcbiAgICAgICAgaWYoIXguX3ByZXYgfHwgKHByZXYgPSBrZXkuYWNjZXNzb3IoeC5fcHJldikpID09PSB1bmRlZmluZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgbSA9IG1hcChrZXkuYWNjZXNzb3IoeCkpO1xuICAgICAgICB4W2FzXSA9IG1bMV0gfHwgZGZsdDtcbiAgICAgICAgKG1bMF09bVswXXx8W10pLnB1c2goeCk7XG4gICAgICAgIChyZW1bcHJldl09cmVtW3ByZXZdfHx7fSlbeC5faWRdID0gMTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGRsLmtleXMocmVtKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHsgXG4gICAgICB2YXIgbSA9IG1hcChrKTtcbiAgICAgIGlmKCFtWzBdKSByZXR1cm47XG4gICAgICBtWzBdID0gbVswXS5maWx0ZXIoZnVuY3Rpb24oeCkgeyByZXR1cm4gcmVtW2tdW3guX2lkXSAhPT0gMSB9KTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXZSBvbmx5IG5lZWQgdG8gcnVuIGEgbm9uLWtleS1qb2luIGFnYWluIGlmIHdlJ3ZlIGdvdCBhbnkgYWRkL3JlbVxuICAgIC8vIG9uIGlucHV0IG9yIHdvdXRwdXRcbiAgICBpZihpbnB1dC5hZGQubGVuZ3RoID09IDAgJiYgaW5wdXQucmVtLmxlbmd0aCA9PSAwICYmIFxuICAgICAgICB3b3V0cHV0LmFkZC5sZW5ndGggPT0gMCAmJiB3b3V0cHV0LnJlbS5sZW5ndGggPT0gMCkgcmV0dXJuIGlucHV0O1xuXG4gICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhIGtleS1qb2luLCB0aGVuIHdlIG5lZWQgdG8gbWF0ZXJpYWxpemUgYm90aFxuICAgIC8vIGRhdGEgc291cmNlcyB0byBpdGVyYXRlIHRocm91Z2ggdGhlbS4gXG4gICAgdGhpcy5fY29sbGVjdG9yLmV2YWx1YXRlKGlucHV0KTtcblxuICAgIHZhciBkYXRhID0gdGhpcy5fY29sbGVjdG9yLmRhdGEoKSwgXG4gICAgICAgIHdsZW4gPSB3ZGF0YS5sZW5ndGgsIGk7XG5cbiAgICBmb3IoaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7IGRhdGFbaV1bYXNdID0gd2RhdGFbaSV3bGVuXTsgfVxuICB9XG5cbiAgaW5wdXQuZmllbGRzW2FzXSA9IDE7XG4gIHJldHVybiBpbnB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gWmlwOyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBhZ2dyZWdhdGU6ICByZXF1aXJlKCcuL0FnZ3JlZ2F0ZScpLFxuICBiaW46ICAgICAgICByZXF1aXJlKCcuL0JpbicpLFxuICBjcm9zczogICAgICByZXF1aXJlKCcuL0Nyb3NzJyksXG4gIGZhY2V0OiAgICAgIHJlcXVpcmUoJy4vRmFjZXQnKSxcbiAgZmlsdGVyOiAgICAgcmVxdWlyZSgnLi9GaWx0ZXInKSxcbiAgZm9sZDogICAgICAgcmVxdWlyZSgnLi9Gb2xkJyksXG4gIGZvcmNlOiAgICAgIHJlcXVpcmUoJy4vRm9yY2UnKSxcbiAgZm9ybXVsYTogICAgcmVxdWlyZSgnLi9Gb3JtdWxhJyksXG4gIHNvcnQ6ICAgICAgIHJlcXVpcmUoJy4vU29ydCcpLFxuICBzdGFjazogICAgICByZXF1aXJlKCcuL1N0YWNrJyksXG4gIHVuaXF1ZTogICAgIHJlcXVpcmUoJy4vVW5pcXVlJyksXG4gIHppcDogICAgICAgIHJlcXVpcmUoJy4vWmlwJylcbn07IiwidmFyIGRsID0gcmVxdWlyZSgnZGF0YWxpYicpLFxuICAgIHR1cGxlID0gcmVxdWlyZSgnLi4vZGF0YWZsb3cvdHVwbGUnKSxcbiAgICBxdWlja3NlbGVjdCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVpY2tzZWxlY3QnKSxcbiAgICBDID0gcmVxdWlyZSgnLi4vdXRpbC9jb25zdGFudHMnKTtcblxudmFyIHR5cGVzID0ge1xuICBcImNvdW50XCI6IG1lYXN1cmUoe1xuICAgIG5hbWU6IFwiY291bnRcIixcbiAgICBpbml0OiBcIlwiLFxuICAgIGFkZDogIFwiXCIsXG4gICAgcmVtOiAgXCJcIixcbiAgICBzZXQ6ICBcInRoaXMuY2VsbC5jbnRcIlxuICB9KSxcbiAgXCJfY291bnRzXCI6IG1lYXN1cmUoe1xuICAgIG5hbWU6IFwiX2NvdW50c1wiLFxuICAgIGluaXQ6IFwidGhpcy5jbnRzID0ge307XCIsXG4gICAgYWRkOiAgXCJ0aGlzLmNudHNbdl0gPSArK3RoaXMuY250c1t2XSB8fCAxO1wiLFxuICAgIHJlbTogIFwidGhpcy5jbnRzW3ZdID0gLS10aGlzLmNudHNbdl0gPCAwID8gMCA6IHRoaXMuY250c1t2XTtcIixcbiAgICBzZXQ6ICBcIlwiLFxuICAgIHJlcTogIFtcImNvdW50XCJdXG4gIH0pLFxuICBcInN1bVwiOiBtZWFzdXJlKHtcbiAgICBuYW1lOiBcInN1bVwiLFxuICAgIGluaXQ6IFwidGhpcy5zdW0gPSAwO1wiLFxuICAgIGFkZDogIFwidGhpcy5zdW0gKz0gdjtcIixcbiAgICByZW06ICBcInRoaXMuc3VtIC09IHY7XCIsXG4gICAgc2V0OiAgXCJ0aGlzLnN1bVwiXG4gIH0pLFxuICBcImF2Z1wiOiBtZWFzdXJlKHtcbiAgICBuYW1lOiBcImF2Z1wiLFxuICAgIGluaXQ6IFwidGhpcy5hdmcgPSAwO1wiLFxuICAgIGFkZDogIFwidmFyIGQgPSB2IC0gdGhpcy5hdmc7IHRoaXMuYXZnICs9IGQgLyB0aGlzLmNlbGwuY250O1wiLFxuICAgIHJlbTogIFwidmFyIGQgPSB2IC0gdGhpcy5hdmc7IHRoaXMuYXZnIC09IGQgLyB0aGlzLmNlbGwuY250O1wiLFxuICAgIHNldDogIFwidGhpcy5hdmdcIixcbiAgICByZXE6ICBbXCJjb3VudFwiXSwgaWR4OiAxXG4gIH0pLFxuICBcInZhclwiOiBtZWFzdXJlKHtcbiAgICBuYW1lOiBcInZhclwiLFxuICAgIGluaXQ6IFwidGhpcy5kZXYgPSAwO1wiLFxuICAgIGFkZDogIFwidGhpcy5kZXYgKz0gZCAqICh2IC0gdGhpcy5hdmcpO1wiLFxuICAgIHJlbTogIFwidGhpcy5kZXYgLT0gZCAqICh2IC0gdGhpcy5hdmcpO1wiLFxuICAgIHNldDogIFwidGhpcy5kZXYgLyAodGhpcy5jZWxsLmNudC0xKVwiLFxuICAgIHJlcTogIFtcImF2Z1wiXSwgaWR4OiAyXG4gIH0pLFxuICBcInZhcnBcIjogbWVhc3VyZSh7XG4gICAgbmFtZTogXCJ2YXJwXCIsXG4gICAgaW5pdDogXCJcIixcbiAgICBhZGQ6ICBcIlwiLFxuICAgIHJlbTogIFwiXCIsXG4gICAgc2V0OiAgXCJ0aGlzLmRldiAvIHRoaXMuY2VsbC5jbnRcIixcbiAgICByZXE6ICBbXCJ2YXJcIl0sIGlkeDogM1xuICB9KSxcbiAgXCJzdGRldlwiOiBtZWFzdXJlKHtcbiAgICBuYW1lOiBcInN0ZGV2XCIsXG4gICAgaW5pdDogXCJcIixcbiAgICBhZGQ6ICBcIlwiLFxuICAgIHJlbTogIFwiXCIsXG4gICAgc2V0OiAgXCJNYXRoLnNxcnQodGhpcy5kZXYgLyAodGhpcy5jZWxsLmNudC0xKSlcIixcbiAgICByZXE6ICBbXCJ2YXJcIl0sIGlkeDogNFxuICB9KSxcbiAgXCJzdGRldnBcIjogbWVhc3VyZSh7XG4gICAgbmFtZTogXCJzdGRldnBcIixcbiAgICBpbml0OiBcIlwiLFxuICAgIGFkZDogIFwiXCIsXG4gICAgcmVtOiAgXCJcIixcbiAgICBzZXQ6ICBcIk1hdGguc3FydCh0aGlzLmRldiAvIHRoaXMuY2VsbC5jbnQpXCIsXG4gICAgcmVxOiAgW1widmFyXCJdLCBpZHg6IDVcbiAgfSksXG4gIFwibWluXCI6IG1lYXN1cmUoe1xuICAgIG5hbWU6IFwibWluXCIsXG4gICAgaW5pdDogXCJ0aGlzLm1pbiA9ICtJbmZpbml0eTtcIixcbiAgICBhZGQ6ICBcInRoaXMubWluID0gdiA8IHRoaXMubWluID8gdiA6IHRoaXMubWluO1wiLFxuICAgIHJlbTogIFwidmFyIHNlbGYgPSB0aGlzOyB0aGlzLm1pbiA9IHYgPT0gdGhpcy5taW4gXCIgK1xuICAgICAgICAgIFwiPyB0aGlzLmtleXModGhpcy5jbnRzKS5yZWR1Y2UoZnVuY3Rpb24obSwgdikgeyBcIiArXG4gICAgICAgICAgXCIgICByZXR1cm4gc2VsZi5jbnRzWyh2ID0gK3YpXSA+IDAgJiYgdiA8IG0gPyB2IDogbSB9LCArSW5maW5pdHkpIFwiICsgXG4gICAgICAgICAgXCI6IHRoaXMubWluO1wiLFxuICAgIHNldDogIFwidGhpcy5taW5cIixcbiAgICByZXE6IFtcIl9jb3VudHNcIl0sIGlkeDogNlxuICB9KSxcbiAgXCJtYXhcIjogbWVhc3VyZSh7XG4gICAgbmFtZTogXCJtYXhcIixcbiAgICBpbml0OiBcInRoaXMubWF4ID0gLUluZmluaXR5O1wiLFxuICAgIGFkZDogIFwidGhpcy5tYXggPSB2ID4gdGhpcy5tYXggPyB2IDogdGhpcy5tYXg7XCIsXG4gICAgcmVtOiAgXCJ2YXIgc2VsZiA9IHRoaXM7IHRoaXMubWF4ID0gdiA9PSB0aGlzLm1heCBcIiArXG4gICAgICAgICAgXCI/IHRoaXMua2V5cyh0aGlzLmNudHMpLnJlZHVjZShmdW5jdGlvbihtLCB2KSB7IFwiICtcbiAgICAgICAgICBcIiAgIHJldHVybiBzZWxmLmNudHNbKHYgPSArdildID4gMCAmJiB2ID4gbSA/IHYgOiBtIH0sIC1JbmZpbml0eSkgXCIgKyBcbiAgICAgICAgICBcIjogdGhpcy5tYXg7XCIsXG4gICAgc2V0OiAgXCJ0aGlzLm1heFwiLFxuICAgIHJlcTogW1wiX2NvdW50c1wiXSwgaWR4OiA3XG4gIH0pLFxuICBcIm1lZGlhblwiOiBtZWFzdXJlKHtcbiAgICBuYW1lOiBcIm1lZGlhblwiLFxuICAgIGluaXQ6IFwidGhpcy52YWxzID0gW107IFwiLFxuICAgIGFkZDogIFwiaWYodGhpcy52YWxzKSB0aGlzLnZhbHMucHVzaCh2KTsgXCIsXG4gICAgcmVtOiAgXCJ0aGlzLnZhbHMgPSBudWxsO1wiLFxuICAgIHNldDogIFwidGhpcy5jZWxsLmNudCAlIDIgPyB0aGlzLnNlbCh+fih0aGlzLmNlbGwuY250LzIpLCB0aGlzLnZhbHMsIHRoaXMuY250cykgOiBcIitcbiAgICAgICAgICBcIjAuNSAqICh0aGlzLnNlbCh+fih0aGlzLmNlbGwuY250LzIpLTEsIHRoaXMudmFscywgdGhpcy5jbnRzKSArIHRoaXMuc2VsKH5+KHRoaXMuY2VsbC5jbnQvMiksIHRoaXMudmFscywgdGhpcy5jbnRzKSlcIixcbiAgICByZXE6IFtcIl9jb3VudHNcIl0sIGlkeDogOFxuICB9KVxufTtcblxuZnVuY3Rpb24gbWVhc3VyZShiYXNlKSB7XG4gIHJldHVybiBmdW5jdGlvbihvdXQpIHtcbiAgICB2YXIgbSA9IE9iamVjdC5jcmVhdGUoYmFzZSk7XG4gICAgbS5vdXQgPSBvdXQgfHwgYmFzZS5uYW1lO1xuICAgIGlmICghbS5pZHgpIG0uaWR4ID0gMDtcbiAgICByZXR1cm4gbTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZShhZ2cpIHtcbiAgZnVuY3Rpb24gY29sbGVjdChtLCBhKSB7XG4gICAgKGEucmVxIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHIpIHtcbiAgICAgIGlmICghbVtyXSkgY29sbGVjdChtLCBtW3JdID0gdHlwZXNbcl0oKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG07XG4gIH1cbiAgdmFyIG1hcCA9IGFnZy5yZWR1Y2UoY29sbGVjdCxcbiAgICBhZ2cucmVkdWNlKGZ1bmN0aW9uKG0sIGEpIHsgcmV0dXJuIChtW2EubmFtZV0gPSBhLCBtKTsgfSwge30pKTtcbiAgdmFyIGFsbCA9IFtdO1xuICBmb3IgKHZhciBrIGluIG1hcCkgYWxsLnB1c2gobWFwW2tdKTtcbiAgYWxsLnNvcnQoZnVuY3Rpb24oYSxiKSB7IHJldHVybiBhLmlkeCAtIGIuaWR4OyB9KTtcbiAgcmV0dXJuIGFsbDtcbn1cblxuZnVuY3Rpb24gY29tcGlsZShhZ2cpIHtcbiAgdmFyIGFsbCA9IHJlc29sdmUoYWdnKSxcbiAgICAgIGN0ciA9IFwidGhpcy50cGwgPSB0OyB0aGlzLmNlbGwgPSBjO1wiLFxuICAgICAgYWRkID0gXCJcIixcbiAgICAgIHJlbSA9IFwiXCIsXG4gICAgICBzZXQgPSBcInZhciB0ID0gdGhpcy50cGw7XCI7XG5cbiAgYWxsLmZvckVhY2goZnVuY3Rpb24oYSkgeyBjdHIgKz0gYS5pbml0OyBhZGQgKz0gYS5hZGQ7IHJlbSArPSBhLnJlbTsgfSk7XG4gIGFnZy5mb3JFYWNoKGZ1bmN0aW9uKGEpIHsgc2V0ICs9IFwidGhpcy50dXBsZS5zZXQodCwnXCIrYS5vdXQrXCInLFwiK2Euc2V0K1wiKTtcIjsgfSk7XG4gIHNldCArPSBcInJldHVybiB0O1wiO1xuXG4gIGN0ciA9IEZ1bmN0aW9uKFwiY1wiLCBcInRcIiwgY3RyKTtcbiAgY3RyLnByb3RvdHlwZS5hZGQgPSBGdW5jdGlvbihcInZcIiwgYWRkKTtcbiAgY3RyLnByb3RvdHlwZS5yZW0gPSBGdW5jdGlvbihcInZcIiwgcmVtKTtcbiAgY3RyLnByb3RvdHlwZS5zZXQgPSBGdW5jdGlvbihcInN0YW1wXCIsIHNldCk7XG4gIGN0ci5wcm90b3R5cGUubW9kID0gbW9kO1xuICBjdHIucHJvdG90eXBlLmtleXMgPSBkbC5rZXlzO1xuICBjdHIucHJvdG90eXBlLnNlbCA9IHF1aWNrc2VsZWN0O1xuICBjdHIucHJvdG90eXBlLnR1cGxlID0gdHVwbGU7XG4gIHJldHVybiBjdHI7XG59XG5cbmZ1bmN0aW9uIG1vZCh2X25ldywgdl9vbGQpIHtcbiAgaWYgKHZfb2xkID09PSB1bmRlZmluZWQgfHwgdl9vbGQgPT09IHZfbmV3KSByZXR1cm47XG4gIHRoaXMucmVtKHZfb2xkKTtcbiAgdGhpcy5hZGQodl9uZXcpO1xufTtcblxudHlwZXMuY3JlYXRlICAgPSBjb21waWxlO1xubW9kdWxlLmV4cG9ydHMgPSB0eXBlczsiLCJ2YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgICBCb3VuZHMgPSByZXF1aXJlKCcuLi9jb3JlL0JvdW5kcycpLFxuICAgIGNhbnZhcyA9IHJlcXVpcmUoJy4uL3JlbmRlci9jYW52YXMvcGF0aCcpLFxuICAgIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG5cbnZhciBwYXJzZSA9IGNhbnZhcy5wYXJzZSxcbiAgICBib3VuZFBhdGggPSBjYW52YXMuYm91bmRzLFxuICAgIGFyZWFQYXRoID0gY2FudmFzLmFyZWEsXG4gICAgbGluZVBhdGggPSBjYW52YXMubGluZSxcbiAgICBoYWxmcGkgPSBNYXRoLlBJIC8gMixcbiAgICBzcXJ0MyA9IE1hdGguc3FydCgzKSxcbiAgICB0YW4zMCA9IE1hdGgudGFuKDMwICogTWF0aC5QSSAvIDE4MCksXG4gICAgZ2Z4ID0gbnVsbDtcblxuZnVuY3Rpb24gZm9udFN0cmluZyhvKSB7XG4gIHJldHVybiAoby5mb250U3R5bGUgPyBvLmZvbnRTdHlsZSArIFwiIFwiIDogXCJcIilcbiAgICArIChvLmZvbnRWYXJpYW50ID8gby5mb250VmFyaWFudCArIFwiIFwiIDogXCJcIilcbiAgICArIChvLmZvbnRXZWlnaHQgPyBvLmZvbnRXZWlnaHQgKyBcIiBcIiA6IFwiXCIpXG4gICAgKyAoby5mb250U2l6ZSAhPSBudWxsID8gby5mb250U2l6ZSA6IGNvbmZpZy5yZW5kZXIuZm9udFNpemUpICsgXCJweCBcIlxuICAgICsgKG8uZm9udCB8fCBjb25maWcucmVuZGVyLmZvbnQpO1xufVxuXG5mdW5jdGlvbiBjb250ZXh0KCkge1xuICAvLyBUT0RPOiBob3cgdG8gY2hlY2sgaWYgbm9kZUpTIGluIHJlcXVpcmVKUz9cbiAgcmV0dXJuIGdmeCB8fCAoZ2Z4ID0gKC8qY29uZmlnLmlzTm9kZVxuICAgID8gbmV3IChyZXF1aXJlKFwiY2FudmFzXCIpKSgxLDEpXG4gICAgOiAqL2QzLnNlbGVjdChcImJvZHlcIikuYXBwZW5kKFwiY2FudmFzXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ2ZWdhX2hpZGRlblwiKVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIDEpXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIDEpXG4gICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpXG4gICAgICAgIC5ub2RlKCkpXG4gICAgLmdldENvbnRleHQoXCIyZFwiKSk7XG59XG5cbmZ1bmN0aW9uIHBhdGhCb3VuZHMobywgcGF0aCwgYm91bmRzKSB7XG4gIGlmIChwYXRoID09IG51bGwpIHtcbiAgICBib3VuZHMuc2V0KDAsIDAsIDAsIDApO1xuICB9IGVsc2Uge1xuICAgIGJvdW5kUGF0aChwYXRoLCBib3VuZHMpO1xuICAgIGlmIChvLnN0cm9rZSAmJiBvLm9wYWNpdHkgIT09IDAgJiYgby5zdHJva2VXaWR0aCA+IDApIHtcbiAgICAgIGJvdW5kcy5leHBhbmQoby5zdHJva2VXaWR0aCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBib3VuZHM7XG59XG5cbmZ1bmN0aW9uIHBhdGgobywgYm91bmRzKSB7XG4gIHZhciBwID0gby5wYXRoXG4gICAgPyBvLnBhdGhDYWNoZSB8fCAoby5wYXRoQ2FjaGUgPSBwYXJzZShvLnBhdGgpKVxuICAgIDogbnVsbDtcbiAgcmV0dXJuIHBhdGhCb3VuZHMobywgcCwgYm91bmRzKTtcbn1cblxuZnVuY3Rpb24gYXJlYShvLCBib3VuZHMpIHtcbiAgdmFyIGl0ZW1zID0gby5tYXJrLml0ZW1zLCBvID0gaXRlbXNbMF07XG4gIHZhciBwID0gby5wYXRoQ2FjaGUgfHwgKG8ucGF0aENhY2hlID0gcGFyc2UoYXJlYVBhdGgoaXRlbXMpKSk7XG4gIHJldHVybiBwYXRoQm91bmRzKGl0ZW1zWzBdLCBwLCBib3VuZHMpO1xufVxuXG5mdW5jdGlvbiBsaW5lKG8sIGJvdW5kcykge1xuICB2YXIgaXRlbXMgPSBvLm1hcmsuaXRlbXMsIG8gPSBpdGVtc1swXTtcbiAgdmFyIHAgPSBvLnBhdGhDYWNoZSB8fCAoby5wYXRoQ2FjaGUgPSBwYXJzZShsaW5lUGF0aChpdGVtcykpKTtcbiAgcmV0dXJuIHBhdGhCb3VuZHMoaXRlbXNbMF0sIHAsIGJvdW5kcyk7XG59XG5cbmZ1bmN0aW9uIHJlY3QobywgYm91bmRzKSB7XG4gIHZhciB4ID0gby54IHx8IDAsXG4gICAgICB5ID0gby55IHx8IDAsXG4gICAgICB3ID0gKHggKyBvLndpZHRoKSB8fCAwLFxuICAgICAgaCA9ICh5ICsgby5oZWlnaHQpIHx8IDA7XG4gIGJvdW5kcy5zZXQoeCwgeSwgdywgaCk7XG4gIGlmIChvLnN0cm9rZSAmJiBvLm9wYWNpdHkgIT09IDAgJiYgby5zdHJva2VXaWR0aCA+IDApIHtcbiAgICBib3VuZHMuZXhwYW5kKG8uc3Ryb2tlV2lkdGgpO1xuICB9XG4gIHJldHVybiBib3VuZHM7XG59XG5cbmZ1bmN0aW9uIGltYWdlKG8sIGJvdW5kcykge1xuICB2YXIgdyA9IG8ud2lkdGggfHwgMCxcbiAgICAgIGggPSBvLmhlaWdodCB8fCAwLFxuICAgICAgeCA9IChvLnh8fDApIC0gKG8uYWxpZ24gPT09IFwiY2VudGVyXCJcbiAgICAgICAgICA/IHcvMiA6IChvLmFsaWduID09PSBcInJpZ2h0XCIgPyB3IDogMCkpLFxuICAgICAgeSA9IChvLnl8fDApIC0gKG8uYmFzZWxpbmUgPT09IFwibWlkZGxlXCJcbiAgICAgICAgICA/IGgvMiA6IChvLmJhc2VsaW5lID09PSBcImJvdHRvbVwiID8gaCA6IDApKTtcbiAgcmV0dXJuIGJvdW5kcy5zZXQoeCwgeSwgeCt3LCB5K2gpO1xufVxuXG5mdW5jdGlvbiBydWxlKG8sIGJvdW5kcykge1xuICB2YXIgeDEsIHkxO1xuICBib3VuZHMuc2V0KFxuICAgIHgxID0gby54IHx8IDAsXG4gICAgeTEgPSBvLnkgfHwgMCxcbiAgICBvLngyICE9IG51bGwgPyBvLngyIDogeDEsXG4gICAgby55MiAhPSBudWxsID8gby55MiA6IHkxXG4gICk7XG4gIGlmIChvLnN0cm9rZSAmJiBvLm9wYWNpdHkgIT09IDAgJiYgby5zdHJva2VXaWR0aCA+IDApIHtcbiAgICBib3VuZHMuZXhwYW5kKG8uc3Ryb2tlV2lkdGgpO1xuICB9XG4gIHJldHVybiBib3VuZHM7XG59XG5cbmZ1bmN0aW9uIGFyYyhvLCBib3VuZHMpIHtcbiAgdmFyIGN4ID0gby54IHx8IDAsXG4gICAgICBjeSA9IG8ueSB8fCAwLFxuICAgICAgaXIgPSBvLmlubmVyUmFkaXVzIHx8IDAsXG4gICAgICBvciA9IG8ub3V0ZXJSYWRpdXMgfHwgMCxcbiAgICAgIHNhID0gKG8uc3RhcnRBbmdsZSB8fCAwKSAtIGhhbGZwaSxcbiAgICAgIGVhID0gKG8uZW5kQW5nbGUgfHwgMCkgLSBoYWxmcGksXG4gICAgICB4bWluID0gSW5maW5pdHksIHhtYXggPSAtSW5maW5pdHksXG4gICAgICB5bWluID0gSW5maW5pdHksIHltYXggPSAtSW5maW5pdHksXG4gICAgICBhLCBpLCBuLCB4LCB5LCBpeCwgaXksIG94LCBveTtcblxuICB2YXIgYW5nbGVzID0gW3NhLCBlYV0sXG4gICAgICBzID0gc2EgLSAoc2ElaGFsZnBpKTtcbiAgZm9yIChpPTA7IGk8NCAmJiBzPGVhOyArK2ksIHMrPWhhbGZwaSkge1xuICAgIGFuZ2xlcy5wdXNoKHMpO1xuICB9XG5cbiAgZm9yIChpPTAsIG49YW5nbGVzLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICBhID0gYW5nbGVzW2ldO1xuICAgIHggPSBNYXRoLmNvcyhhKTsgaXggPSBpcip4OyBveCA9IG9yKng7XG4gICAgeSA9IE1hdGguc2luKGEpOyBpeSA9IGlyKnk7IG95ID0gb3IqeTtcbiAgICB4bWluID0gTWF0aC5taW4oeG1pbiwgaXgsIG94KTtcbiAgICB4bWF4ID0gTWF0aC5tYXgoeG1heCwgaXgsIG94KTtcbiAgICB5bWluID0gTWF0aC5taW4oeW1pbiwgaXksIG95KTtcbiAgICB5bWF4ID0gTWF0aC5tYXgoeW1heCwgaXksIG95KTtcbiAgfVxuXG4gIGJvdW5kcy5zZXQoY3greG1pbiwgY3kreW1pbiwgY3greG1heCwgY3kreW1heCk7XG4gIGlmIChvLnN0cm9rZSAmJiBvLm9wYWNpdHkgIT09IDAgJiYgby5zdHJva2VXaWR0aCA+IDApIHtcbiAgICBib3VuZHMuZXhwYW5kKG8uc3Ryb2tlV2lkdGgpO1xuICB9XG4gIHJldHVybiBib3VuZHM7XG59XG5cbmZ1bmN0aW9uIHN5bWJvbChvLCBib3VuZHMpIHtcbiAgdmFyIHNpemUgPSBvLnNpemUgIT0gbnVsbCA/IG8uc2l6ZSA6IDEwMCxcbiAgICAgIHggPSBvLnggfHwgMCxcbiAgICAgIHkgPSBvLnkgfHwgMCxcbiAgICAgIHIsIHQsIHJ4LCByeTtcblxuICBzd2l0Y2ggKG8uc2hhcGUpIHtcbiAgICBjYXNlIFwiY3Jvc3NcIjpcbiAgICAgIHIgPSBNYXRoLnNxcnQoc2l6ZSAvIDUpIC8gMjtcbiAgICAgIHQgPSAzKnI7XG4gICAgICBib3VuZHMuc2V0KHgtdCwgeS1yLCB4K3QsIHkrcik7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgXCJkaWFtb25kXCI6XG4gICAgICByeSA9IE1hdGguc3FydChzaXplIC8gKDIgKiB0YW4zMCkpO1xuICAgICAgcnggPSByeSAqIHRhbjMwO1xuICAgICAgYm91bmRzLnNldCh4LXJ4LCB5LXJ5LCB4K3J4LCB5K3J5KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBcInNxdWFyZVwiOlxuICAgICAgdCA9IE1hdGguc3FydChzaXplKTtcbiAgICAgIHIgPSB0IC8gMjtcbiAgICAgIGJvdW5kcy5zZXQoeC1yLCB5LXIsIHgrciwgeStyKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBcInRyaWFuZ2xlLWRvd25cIjpcbiAgICAgIHJ4ID0gTWF0aC5zcXJ0KHNpemUgLyBzcXJ0Myk7XG4gICAgICByeSA9IHJ4ICogc3FydDMgLyAyO1xuICAgICAgYm91bmRzLnNldCh4LXJ4LCB5LXJ5LCB4K3J4LCB5K3J5KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBcInRyaWFuZ2xlLXVwXCI6XG4gICAgICByeCA9IE1hdGguc3FydChzaXplIC8gc3FydDMpO1xuICAgICAgcnkgPSByeCAqIHNxcnQzIC8gMjtcbiAgICAgIGJvdW5kcy5zZXQoeC1yeCwgeS1yeSwgeCtyeCwgeStyeSk7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gICAgICByID0gTWF0aC5zcXJ0KHNpemUvTWF0aC5QSSk7XG4gICAgICBib3VuZHMuc2V0KHgtciwgeS1yLCB4K3IsIHkrcik7XG4gIH1cbiAgaWYgKG8uc3Ryb2tlICYmIG8ub3BhY2l0eSAhPT0gMCAmJiBvLnN0cm9rZVdpZHRoID4gMCkge1xuICAgIGJvdW5kcy5leHBhbmQoby5zdHJva2VXaWR0aCk7XG4gIH1cbiAgcmV0dXJuIGJvdW5kcztcbn1cblxuZnVuY3Rpb24gdGV4dChvLCBib3VuZHMsIG5vUm90YXRlKSB7XG4gIHZhciB4ID0gKG8ueCB8fCAwKSArIChvLmR4IHx8IDApLFxuICAgICAgeSA9IChvLnkgfHwgMCkgKyAoby5keSB8fCAwKSxcbiAgICAgIGggPSBvLmZvbnRTaXplIHx8IGNvbmZpZy5yZW5kZXIuZm9udFNpemUsXG4gICAgICBhID0gby5hbGlnbixcbiAgICAgIGIgPSBvLmJhc2VsaW5lLFxuICAgICAgciA9IG8ucmFkaXVzIHx8IDAsXG4gICAgICBnID0gY29udGV4dCgpLCB3LCB0O1xuXG4gIGcuZm9udCA9IGZvbnRTdHJpbmcobyk7XG4gIGcudGV4dEFsaWduID0gYSB8fCBcImxlZnRcIjtcbiAgZy50ZXh0QmFzZWxpbmUgPSBiIHx8IFwiYWxwaGFiZXRpY1wiO1xuICB3ID0gZy5tZWFzdXJlVGV4dChvLnRleHQgfHwgXCJcIikud2lkdGg7XG5cbiAgaWYgKHIpIHtcbiAgICB0ID0gKG8udGhldGEgfHwgMCkgLSBNYXRoLlBJLzI7XG4gICAgeCArPSByICogTWF0aC5jb3ModCk7XG4gICAgeSArPSByICogTWF0aC5zaW4odCk7XG4gIH1cblxuICAvLyBob3Jpem9udGFsXG4gIGlmIChhID09PSBcImNlbnRlclwiKSB7XG4gICAgeCA9IHggLSAodyAvIDIpO1xuICB9IGVsc2UgaWYgKGEgPT09IFwicmlnaHRcIikge1xuICAgIHggPSB4IC0gdztcbiAgfSBlbHNlIHtcbiAgICAvLyBsZWZ0IGJ5IGRlZmF1bHQsIGRvIG5vdGhpbmdcbiAgfVxuXG4gIC8vLyBUT0RPIGZpbmQgYSByb2J1c3Qgc29sdXRpb24gZm9yIGhlaWdodHMuXG4gIC8vLyBUaGVzZSBvZmZzZXRzIHdvcmsgZm9yIHNvbWUgYnV0IG5vdCBhbGwgZm9udHMuXG5cbiAgLy8gdmVydGljYWxcbiAgaWYgKGIgPT09IFwidG9wXCIpIHtcbiAgICB5ID0geSArIChoLzUpO1xuICB9IGVsc2UgaWYgKGIgPT09IFwiYm90dG9tXCIpIHtcbiAgICB5ID0geSAtIGg7XG4gIH0gZWxzZSBpZiAoYiA9PT0gXCJtaWRkbGVcIikge1xuICAgIHkgPSB5IC0gKGgvMikgKyAoaC8xMCk7XG4gIH0gZWxzZSB7XG4gICAgeSA9IHkgLSA0KmgvNTsgLy8gYWxwaGFiZXRpYyBieSBkZWZhdWx0XG4gIH1cbiAgXG4gIGJvdW5kcy5zZXQoeCwgeSwgeCt3LCB5K2gpO1xuICBpZiAoby5hbmdsZSAmJiAhbm9Sb3RhdGUpIHtcbiAgICBib3VuZHMucm90YXRlKG8uYW5nbGUqTWF0aC5QSS8xODAsIG8ueHx8MCwgby55fHwwKTtcbiAgfVxuICByZXR1cm4gYm91bmRzLmV4cGFuZChub1JvdGF0ZSA/IDAgOiAxKTtcbn1cblxuZnVuY3Rpb24gZ3JvdXAoZywgYm91bmRzLCBpbmNsdWRlTGVnZW5kcykge1xuICB2YXIgYXhlcyA9IGcuYXhpc0l0ZW1zIHx8IFtdLFxuICAgICAgbGVnZW5kcyA9IGcubGVnZW5kSXRlbXMgfHwgW10sIGosIG07XG5cbiAgZm9yIChqPTAsIG09YXhlcy5sZW5ndGg7IGo8bTsgKytqKSB7XG4gICAgYm91bmRzLnVuaW9uKGF4ZXNbal0uYm91bmRzKTtcbiAgfVxuICBmb3IgKGo9MCwgbT1nLml0ZW1zLmxlbmd0aDsgajxtOyArK2opIHtcbiAgICBib3VuZHMudW5pb24oZy5pdGVtc1tqXS5ib3VuZHMpO1xuICB9XG4gIGlmIChpbmNsdWRlTGVnZW5kcykge1xuICAgIGZvciAoaj0wLCBtPWxlZ2VuZHMubGVuZ3RoOyBqPG07ICsraikge1xuICAgICAgYm91bmRzLnVuaW9uKGxlZ2VuZHNbal0uYm91bmRzKTtcbiAgICB9XG4gICAgaWYgKGcud2lkdGggIT0gbnVsbCAmJiBnLmhlaWdodCAhPSBudWxsKSB7XG4gICAgICBib3VuZHMuYWRkKGcud2lkdGgsIGcuaGVpZ2h0KTtcbiAgICB9XG4gICAgaWYgKGcueCAhPSBudWxsICYmIGcueSAhPSBudWxsKSB7XG4gICAgICBib3VuZHMuYWRkKDAsIDApO1xuICAgIH1cbiAgfVxuICBib3VuZHMudHJhbnNsYXRlKGcueHx8MCwgZy55fHwwKTtcbiAgcmV0dXJuIGJvdW5kcztcbn1cblxudmFyIG1ldGhvZHMgPSB7XG4gIGdyb3VwOiAgZ3JvdXAsXG4gIHN5bWJvbDogc3ltYm9sLFxuICBpbWFnZTogIGltYWdlLFxuICByZWN0OiAgIHJlY3QsXG4gIHJ1bGU6ICAgcnVsZSxcbiAgYXJjOiAgICBhcmMsXG4gIHRleHQ6ICAgdGV4dCxcbiAgcGF0aDogICBwYXRoLFxuICBhcmVhOiAgIGFyZWEsXG4gIGxpbmU6ICAgbGluZVxufTtcblxuZnVuY3Rpb24gaXRlbUJvdW5kcyhpdGVtLCBmdW5jLCBvcHQpIHtcbiAgZnVuYyA9IGZ1bmMgfHwgbWV0aG9kc1tpdGVtLm1hcmsubWFya3R5cGVdO1xuICBpZiAoIWl0ZW0uYm91bmRzX3ByZXYpIGl0ZW1bJ2JvdW5kczpwcmV2J10gPSBuZXcgQm91bmRzKCk7XG4gIHZhciBiID0gaXRlbS5ib3VuZHMsIHBiID0gaXRlbVsnYm91bmRzOnByZXYnXTtcbiAgaWYgKGIpIHBiLmNsZWFyKCkudW5pb24oYik7XG4gIGl0ZW0uYm91bmRzID0gZnVuYyhpdGVtLCBiID8gYi5jbGVhcigpIDogbmV3IEJvdW5kcygpLCBvcHQpO1xuICBpZiAoIWIpIHBiLmNsZWFyKCkudW5pb24oaXRlbS5ib3VuZHMpO1xuICByZXR1cm4gaXRlbS5ib3VuZHM7XG59XG5cbmZ1bmN0aW9uIG1hcmtCb3VuZHMobWFyaywgYm91bmRzLCBvcHQpIHtcbiAgYm91bmRzID0gYm91bmRzIHx8IG1hcmsuYm91bmRzICYmIG1hcmsuYm91bmRzLmNsZWFyKCkgfHwgbmV3IEJvdW5kcygpO1xuICB2YXIgdHlwZSAgPSBtYXJrLm1hcmt0eXBlLFxuICAgICAgZnVuYyAgPSBtZXRob2RzW3R5cGVdLFxuICAgICAgaXRlbXMgPSBtYXJrLml0ZW1zLFxuICAgICAgaXRlbSwgaSwgbGVuO1xuICAgICAgXG4gIGlmICh0eXBlPT09XCJhcmVhXCIgfHwgdHlwZT09PVwibGluZVwiKSB7XG4gICAgaWYgKGl0ZW1zLmxlbmd0aCkge1xuICAgICAgaXRlbXNbMF0uYm91bmRzID0gZnVuYyhpdGVtc1swXSwgYm91bmRzKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yIChpPTAsIGxlbj1pdGVtcy5sZW5ndGg7IGk8bGVuOyArK2kpIHtcbiAgICAgIGJvdW5kcy51bmlvbihpdGVtQm91bmRzKGl0ZW1zW2ldLCBmdW5jLCBvcHQpKTtcbiAgICB9XG4gIH1cbiAgbWFyay5ib3VuZHMgPSBib3VuZHM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtYXJrOiAgbWFya0JvdW5kcyxcbiAgaXRlbTogIGl0ZW1Cb3VuZHMsXG4gIHRleHQ6ICB0ZXh0LFxuICBncm91cDogZ3JvdXBcbn07IiwidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgY29uZmlnID0ge307XG5cbmNvbmZpZy5kZWJ1ZyA9IGZhbHNlO1xuXG5jb25maWcubG9hZCA9IHtcbiAgLy8gYmFzZSB1cmwgZm9yIGxvYWRpbmcgZXh0ZXJuYWwgZGF0YSBmaWxlc1xuICAvLyB1c2VkIG9ubHkgZm9yIHNlcnZlci1zaWRlIG9wZXJhdGlvblxuICBiYXNlVVJMOiBcIlwiLFxuICAvLyBBbGxvd3MgZG9tYWluIHJlc3RyaWN0aW9uIHdoZW4gdXNpbmcgZGF0YSBsb2FkaW5nIHZpYSBYSFIuXG4gIC8vIFRvIGVuYWJsZSwgc2V0IGl0IHRvIGEgbGlzdCBvZiBhbGxvd2VkIGRvbWFpbnNcbiAgLy8gZS5nLiwgWyd3aWtpcGVkaWEub3JnJywgJ2VmZi5vcmcnXVxuICBkb21haW5XaGl0ZUxpc3Q6IGZhbHNlXG59O1xuXG4vLyB2ZXJzaW9uIGFuZCBuYW1lcHNhY2VzIGZvciBleHBvcnRlZCBzdmdcbmNvbmZpZy5zdmdOYW1lc3BhY2UgPVxuICAndmVyc2lvbj1cIjEuMVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiAnICtcbiAgJ3htbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiJztcblxuLy8gaW5zZXQgcGFkZGluZyBmb3IgYXV0b21hdGljIHBhZGRpbmcgY2FsY3VsYXRpb25cbmNvbmZpZy5hdXRvcGFkSW5zZXQgPSA1O1xuXG4vLyBleHRlbnNpYmxlIHNjYWxlIGxvb2t1cCB0YWJsZVxuLy8gYWxsIGQzLnNjYWxlLiogaW5zdGFuY2VzIGFsc28gc3VwcG9ydGVkXG5jb25maWcuc2NhbGUgPSB7XG4gIHRpbWU6IGQzLnRpbWUuc2NhbGUsXG4gIHV0YzogIGQzLnRpbWUuc2NhbGUudXRjXG59O1xuXG4vLyBkZWZhdWx0IHJlbmRlcmluZyBzZXR0aW5nc1xuY29uZmlnLnJlbmRlciA9IHtcbiAgbGluZVdpZHRoOiAxLFxuICBsaW5lQ2FwOiAgIFwiYnV0dFwiLFxuICBmb250OiAgICAgIFwic2Fucy1zZXJpZlwiLFxuICBmb250U2l6ZTogIDExXG59O1xuXG4vLyBkZWZhdWx0IGF4aXMgcHJvcGVydGllc1xuY29uZmlnLmF4aXMgPSB7XG4gIG9yaWVudDogXCJib3R0b21cIixcbiAgdGlja3M6IDEwLFxuICBwYWRkaW5nOiAzLFxuICBheGlzQ29sb3I6IFwiIzAwMFwiLFxuICBncmlkQ29sb3I6IFwiI2Q4ZDhkOFwiLFxuICB0aWNrQ29sb3I6IFwiIzAwMFwiLFxuICB0aWNrTGFiZWxDb2xvcjogXCIjMDAwXCIsXG4gIGF4aXNXaWR0aDogMSxcbiAgdGlja1dpZHRoOiAxLFxuICB0aWNrU2l6ZTogNixcbiAgdGlja0xhYmVsRm9udFNpemU6IDExLFxuICB0aWNrTGFiZWxGb250OiBcInNhbnMtc2VyaWZcIixcbiAgdGl0bGVDb2xvcjogXCIjMDAwXCIsXG4gIHRpdGxlRm9udDogXCJzYW5zLXNlcmlmXCIsXG4gIHRpdGxlRm9udFNpemU6IDExLFxuICB0aXRsZUZvbnRXZWlnaHQ6IFwiYm9sZFwiLFxuICB0aXRsZU9mZnNldDogMzVcbn07XG5cbi8vIGRlZmF1bHQgbGVnZW5kIHByb3BlcnRpZXNcbmNvbmZpZy5sZWdlbmQgPSB7XG4gIG9yaWVudDogXCJyaWdodFwiLFxuICBvZmZzZXQ6IDEwLFxuICBwYWRkaW5nOiAzLFxuICBncmFkaWVudFN0cm9rZUNvbG9yOiBcIiM4ODhcIixcbiAgZ3JhZGllbnRTdHJva2VXaWR0aDogMSxcbiAgZ3JhZGllbnRIZWlnaHQ6IDE2LFxuICBncmFkaWVudFdpZHRoOiAxMDAsXG4gIGxhYmVsQ29sb3I6IFwiIzAwMFwiLFxuICBsYWJlbEZvbnRTaXplOiAxMCxcbiAgbGFiZWxGb250OiBcInNhbnMtc2VyaWZcIixcbiAgbGFiZWxBbGlnbjogXCJsZWZ0XCIsXG4gIGxhYmVsQmFzZWxpbmU6IFwibWlkZGxlXCIsXG4gIGxhYmVsT2Zmc2V0OiA4LFxuICBzeW1ib2xTaGFwZTogXCJjaXJjbGVcIixcbiAgc3ltYm9sU2l6ZTogNTAsXG4gIHN5bWJvbENvbG9yOiBcIiM4ODhcIixcbiAgc3ltYm9sU3Ryb2tlV2lkdGg6IDEsXG4gIHRpdGxlQ29sb3I6IFwiIzAwMFwiLFxuICB0aXRsZUZvbnQ6IFwic2Fucy1zZXJpZlwiLFxuICB0aXRsZUZvbnRTaXplOiAxMSxcbiAgdGl0bGVGb250V2VpZ2h0OiBcImJvbGRcIlxufTtcblxuLy8gZGVmYXVsdCBjb2xvciB2YWx1ZXNcbmNvbmZpZy5jb2xvciA9IHtcbiAgcmdiOiBbMTI4LCAxMjgsIDEyOF0sXG4gIGxhYjogWzUwLCAwLCAwXSxcbiAgaGNsOiBbMCwgMCwgNTBdLFxuICBoc2w6IFswLCAwLCAwLjVdXG59O1xuXG4vLyBkZWZhdWx0IHNjYWxlIHJhbmdlc1xuY29uZmlnLnJhbmdlID0ge1xuICBjYXRlZ29yeTEwOiBbXG4gICAgXCIjMWY3N2I0XCIsXG4gICAgXCIjZmY3ZjBlXCIsXG4gICAgXCIjMmNhMDJjXCIsXG4gICAgXCIjZDYyNzI4XCIsXG4gICAgXCIjOTQ2N2JkXCIsXG4gICAgXCIjOGM1NjRiXCIsXG4gICAgXCIjZTM3N2MyXCIsXG4gICAgXCIjN2Y3ZjdmXCIsXG4gICAgXCIjYmNiZDIyXCIsXG4gICAgXCIjMTdiZWNmXCJcbiAgXSxcbiAgY2F0ZWdvcnkyMDogW1xuICAgIFwiIzFmNzdiNFwiLFxuICAgIFwiI2FlYzdlOFwiLFxuICAgIFwiI2ZmN2YwZVwiLFxuICAgIFwiI2ZmYmI3OFwiLFxuICAgIFwiIzJjYTAyY1wiLFxuICAgIFwiIzk4ZGY4YVwiLFxuICAgIFwiI2Q2MjcyOFwiLFxuICAgIFwiI2ZmOTg5NlwiLFxuICAgIFwiIzk0NjdiZFwiLFxuICAgIFwiI2M1YjBkNVwiLFxuICAgIFwiIzhjNTY0YlwiLFxuICAgIFwiI2M0OWM5NFwiLFxuICAgIFwiI2UzNzdjMlwiLFxuICAgIFwiI2Y3YjZkMlwiLFxuICAgIFwiIzdmN2Y3ZlwiLFxuICAgIFwiI2M3YzdjN1wiLFxuICAgIFwiI2JjYmQyMlwiLFxuICAgIFwiI2RiZGI4ZFwiLFxuICAgIFwiIzE3YmVjZlwiLFxuICAgIFwiIzllZGFlNVwiXG4gIF0sXG4gIHNoYXBlczogW1xuICAgIFwiY2lyY2xlXCIsXG4gICAgXCJjcm9zc1wiLFxuICAgIFwiZGlhbW9uZFwiLFxuICAgIFwic3F1YXJlXCIsXG4gICAgXCJ0cmlhbmdsZS1kb3duXCIsXG4gICAgXCJ0cmlhbmdsZS11cFwiXG4gIF1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY29uZmlnOyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBBRERfQ0VMTDogMSxcbiAgTU9EX0NFTEw6IDIsXG5cbiAgREFUQTogXCJkYXRhXCIsXG4gIEZJRUxEUzogIFwiZmllbGRzXCIsXG4gIFNDQUxFUzogIFwic2NhbGVzXCIsXG4gIFNJR05BTDogIFwic2lnbmFsXCIsXG4gIFNJR05BTFM6IFwic2lnbmFsc1wiLFxuXG4gIEdST1VQOiBcImdyb3VwXCIsXG5cbiAgRU5URVI6IFwiZW50ZXJcIixcbiAgVVBEQVRFOiBcInVwZGF0ZVwiLFxuICBFWElUOiBcImV4aXRcIixcblxuICBTRU5USU5FTDoge1wic2VudGluZWxcIjogMX0sXG4gIFNJTkdMRVRPTjogXCJfc2luZ2xldG9uXCIsXG5cbiAgQUREOiBcImFkZFwiLFxuICBSRU1PVkU6IFwicmVtb3ZlXCIsXG4gIFRPR0dMRTogXCJ0b2dnbGVcIixcbiAgQ0xFQVI6IFwiY2xlYXJcIixcblxuICBMSU5FQVI6IFwibGluZWFyXCIsXG4gIE9SRElOQUw6IFwib3JkaW5hbFwiLFxuICBMT0c6IFwibG9nXCIsXG4gIFBPV0VSOiBcInBvd1wiLFxuICBUSU1FOiBcInRpbWVcIixcbiAgUVVBTlRJTEU6IFwicXVhbnRpbGVcIixcblxuICBET01BSU46IFwiZG9tYWluXCIsXG4gIFJBTkdFOiBcInJhbmdlXCIsXG5cbiAgTUFSSzogXCJtYXJrXCIsXG4gIEFYSVM6IFwiYXhpc1wiLFxuXG4gIENPVU5UOiBcImNvdW50XCIsXG4gIE1JTjogXCJtaW5cIixcbiAgTUFYOiBcIm1heFwiLFxuXG4gIEFTQzogXCJhc2NcIixcbiAgREVTQzogXCJkZXNjXCJcbn07IiwidmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG52YXIgdHM7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGFyZ3MpIHtcbiAgaWYgKCFjb25maWcuZGVidWcpIHJldHVybjtcbiAgdmFyIGxvZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLmNhbGwoY29uc29sZS5sb2csIGNvbnNvbGUpO1xuICBhcmdzLnVuc2hpZnQoaW5wdXQuc3RhbXB8fC0xKTtcbiAgYXJncy51bnNoaWZ0KERhdGUubm93KCkgLSB0cyk7XG4gIGlmKGlucHV0LmFkZCkgYXJncy5wdXNoKGlucHV0LmFkZC5sZW5ndGgsIGlucHV0Lm1vZC5sZW5ndGgsIGlucHV0LnJlbS5sZW5ndGgsICEhaW5wdXQucmVmbG93KTtcbiAgbG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xuICB0cyA9IERhdGUubm93KCk7XG59OyIsInZhciBkbCA9IHJlcXVpcmUoJ2RhdGFsaWInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBxdWlja3NlbGVjdChrLCB4LCBjKSB7XG4gIGZ1bmN0aW9uIHN3YXAoYSwgYikge1xuICAgIHZhciB0ID0geFthXTtcbiAgICB4W2FdID0geFtiXTtcbiAgICB4W2JdID0gdDtcbiAgfVxuXG4gIC8vIHggbWF5IGJlIG51bGwsIGluIHdoaWNoIGNhc2UgYXNzZW1ibGUgYW4gYXJyYXkgZnJvbSBjIChjb3VudHMpXG4gIGlmKHggPT09IG51bGwpIHtcbiAgICB4ID0gW107XG4gICAgZGwua2V5cyhjKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgIHZhciBpID0gMCwgbGVuID0gY1trXTtcbiAgICAgIGsgPSArayB8fCBrO1xuICAgICAgZm9yKDsgaTxsZW47ICsraSkgeC5wdXNoKGspO1xuICAgIH0pO1xuICB9XG4gIFxuICB2YXIgbGVmdCA9IDAsXG4gICAgICByaWdodCA9IHgubGVuZ3RoIC0gMSxcbiAgICAgIHBvcywgaSwgcGl2b3Q7XG4gIFxuICB3aGlsZSAobGVmdCA8IHJpZ2h0KSB7XG4gICAgcGl2b3QgPSB4W2tdO1xuICAgIHN3YXAoaywgcmlnaHQpO1xuICAgIGZvciAoaSA9IHBvcyA9IGxlZnQ7IGkgPCByaWdodDsgKytpKSB7XG4gICAgICBpZiAoeFtpXSA8IHBpdm90KSB7IHN3YXAoaSwgcG9zKyspOyB9XG4gICAgfVxuICAgIHN3YXAocmlnaHQsIHBvcyk7XG4gICAgaWYgKHBvcyA9PT0gaykgYnJlYWs7XG4gICAgaWYgKHBvcyA8IGspIGxlZnQgPSBwb3MgKyAxO1xuICAgIGVsc2UgcmlnaHQgPSBwb3MgLSAxO1xuICB9XG4gIHJldHVybiB4W2tdO1xufTsiXX0=
