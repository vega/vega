(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.vg = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
  core: {
    View: require('./src/core/View')
  },
  dataflow: {
    changeset: require('./src/dataflow/changeset'),
    Datasource: require('./src/dataflow/Datasource'),
    Graph: require('./src/dataflow/Graph'),
    Node: require('./src/dataflow/Node')
  },
  parse: {
    spec: require('./src/parse/spec')
  },
  scene: {
    Builder: require('./src/scene/Builder'),
    GroupBuilder: require('./src/scene/GroupBuilder')
  },
  transforms: require('./src/transforms/index'),
  config: require('./src/util/config'),
  util: require('datalib')
};
},{"./src/core/View":30,"./src/dataflow/Datasource":32,"./src/dataflow/Graph":33,"./src/dataflow/Node":34,"./src/dataflow/changeset":36,"./src/parse/spec":57,"./src/scene/Builder":73,"./src/scene/GroupBuilder":75,"./src/transforms/index":102,"./src/util/config":106,"datalib":20}],2:[function(require,module,exports){

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
var util = require('../util'),
    Measures = require('./measures'),
    Collector = require('./collector');

function Aggregator() {
  this._cells = {};
  this._aggr = [];
  this._stream = false;
}

var Flags = Aggregator.Flags = {
  ADD_CELL: 1,
  MOD_CELL: 2
};

var proto = Aggregator.prototype;

// Parameters

proto.stream = function(v) {
  if (v == null) return this._stream;
  this._stream = !!v;
  this._aggr = [];
  return this;
};

// key accessor to use for streaming removes
proto.key = function(key) {
  if (key == null) return this._key;
  this._key = util.$(key);
  return this;
};

// Input: array of objects of the form
// {name: string, get: function}
proto.groupby = function(dims) {
  this._dims = util.array(dims).map(function(d, i) {
    d = util.isString(d) ? {name: d, get: util.$(d)}
      : util.isFunction(d) ? {name: util.name(d) || d.name || ('_' + i), get: d}
      : (d.name && util.isFunction(d.get)) ? d : null;
    if (d == null) throw 'Invalid groupby argument: ' + d;
    return d;
  });
  return this.clear();
};

// Input: array of objects of the form
// {name: string, ops: [string, ...]}
proto.summarize = function(fields) {
  fields = summarize_args(fields);
  this._count = true;
  var aggr = (this._aggr = []),
      m, f, i, j, op, as, get;

  for (i=0; i<fields.length; ++i) {
    for (j=0, m=[], f=fields[i]; j<f.ops.length; ++j) {
      op = f.ops[j];
      if (op !== 'count') this._count = false;
      as = (f.as && f.as[j]) || (op + (f.name==='*' ? '' : '_'+f.name));
      m.push(Measures[op](as));
    }
    get = f.get && util.$(f.get) ||
      (f.name === '*' ? util.identity : util.$(f.name));
    aggr.push({
      name: f.name,
      measures: Measures.create(
        m,
        this._stream, // streaming remove flag
        get,          // input tuple getter
        this._assign) // output tuple setter
    });
  }
  return this.clear();
};

// Convenience method to summarize by count
proto.count = function() {
  return this.summarize({'*':'count'});
};

// Override to perform custom tuple value assignment
proto._assign = function(object, name, value) {
  object[name] = value;
};

function summarize_args(fields) {
  if (util.isArray(fields)) { return fields; }
  if (fields == null) { return []; }
  var a = [], name, ops;
  for (name in fields) {
    ops = util.array(fields[name]);
    a.push({name: name, ops: ops});
  }
  return a;
}

// Cell Management

proto.clear = function() {
  return (this._cells = {}, this);
};

proto._cellkey = function(x) {
  var d = this._dims,
      n = d.length, i,
      k = String(d[0].get(x));
  for (i=1; i<n; ++i) {
    k += '|' + d[i].get(x);
  }
  return k;
};

proto._cell = function(x) {
  var key = this._dims.length ? this._cellkey(x) : '';
  return this._cells[key] || (this._cells[key] = this._newcell(x));
};

proto._newcell = function(x) {
  var cell = {
    num:   0,
    tuple: this._newtuple(x),
    flag:  Flags.ADD_CELL,
    aggs:  {}
  };

  var aggr = this._aggr, i;
  for (i=0; i<aggr.length; ++i) {
    cell.aggs[aggr[i].name] = new aggr[i].measures(cell, cell.tuple);
  }
  if (cell.collect) {
    cell.data = new Collector(this._key);
  }
  return cell;
};

proto._newtuple = function(x) {
  var dims = this._dims,
      t = {}, i, n;
  for (i=0, n=dims.length; i<n; ++i) {
    t[dims[i].name] = dims[i].get(x);
  }
  return this._ingest(t);
};

// Override to perform custom tuple ingestion
proto._ingest = util.identity;

// Process Tuples

proto._add = function(x) {
  var cell = this._cell(x),
      aggr = this._aggr, i;

  cell.num += 1;
  if (!this._count) { // skip if count-only
    if (cell.collect) cell.data.add(x);
    for (i=0; i<aggr.length; ++i) {
      cell.aggs[aggr[i].name].add(x);
    }
  }
  cell.flag |= Flags.MOD_CELL;
};

proto._rem = function(x) {
  var cell = this._cell(x),
      aggr = this._aggr, i;

  cell.num -= 1;
  if (!this._count) { // skip if count-only
    if (cell.collect) cell.data.rem(x);
    for (i=0; i<aggr.length; ++i) {
      cell.aggs[aggr[i].name].rem(x);
    }
  }
  cell.flag |= Flags.MOD_CELL;
};

proto._mod = function(curr, prev) {
  var cell0 = this._cell(prev),
      cell1 = this._cell(curr),
      aggr = this._aggr, i;

  if (cell0 !== cell1) {
    cell0.num -= 1;
    cell1.num += 1;
    if (cell0.collect) cell0.data.rem(prev);
    if (cell1.collect) cell1.data.add(curr);
  } else if (cell0.collect && !util.isObject(curr)) {
    cell0.data.rem(prev);
    cell0.data.add(curr);
  }

  for (i=0; i<aggr.length; ++i) {
    cell0.aggs[aggr[i].name].rem(prev);
    cell1.aggs[aggr[i].name].add(curr);
  }
  cell0.flag |= Flags.MOD_CELL;
  cell1.flag |= Flags.MOD_CELL;
};

proto.result = function() {
  var result = [],
      aggr = this._aggr,
      cell, i, k;

  for (k in this._cells) {
    cell = this._cells[k];
    if (cell.num > 0) {
      // consolidate collector values
      if (cell.collect) {
        cell.data.values();
      }
      // update tuple properties
      for (i=0; i<aggr.length; ++i) {
        cell.aggs[aggr[i].name].set();
      }
      // add output tuple
      result.push(cell.tuple);
    } else {
      delete this._cells[k];
    }
    cell.flag = 0;
  }

  this._rems = false;
  return result;
};

proto.changes = function() {
  var changes = {add:[], rem:[], mod:[]},
      aggr = this._aggr,
      cell, flag, i, k;

  for (k in this._cells) {
    cell = this._cells[k];
    flag = cell.flag;

    // consolidate collector values
    if (cell.collect) {
      cell.data.values();
    }

    // update tuple properties
    for (i=0; i<aggr.length; ++i) {
      cell.aggs[aggr[i].name].set();
    }

    // organize output tuples
    if (cell.num <= 0) {
      if (flag === Flags.MOD_CELL) {
        changes.rem.push(cell.tuple);
      }
      delete this._cells[k];
    } else if (flag & Flags.ADD_CELL) {
      changes.add.push(cell.tuple);
    } else if (flag & Flags.MOD_CELL) {
      changes.mod.push(cell.tuple);
    }

    cell.flag = 0;
  }

  this._rems = false;
  return changes;
};

proto.execute = function(input) {
  return this.clear().insert(input).result();
};

proto.insert = function(input) {
  this._consolidate();
  for (var i=0; i<input.length; ++i) {
    this._add(input[i]);
  }
  return this;
};

proto.remove = function(input) {
  if (!this._stream) {
    throw 'Aggregator not configured for streaming removes.' +
      ' Call stream(true) prior to calling summarize.';
  }
  for (var i=0; i<input.length; ++i) {
    this._rem(input[i]);
  }
  this._rems = true;
  return this;
};

// consolidate removals
proto._consolidate = function() {
  if (!this._rems) return;
  for (var k in this._cells) {
    if (this._cells[k].collect) {
      this._cells[k].data.values();
    }
  }
  this._rems = false;
};

module.exports = Aggregator;
},{"../util":25,"./collector":5,"./measures":7}],5:[function(require,module,exports){
var util = require('../util');
var stats = require('../stats');

var REM = '__dl_rem__';

function Collector(key) {
  this._add = [];
  this._rem = [];
  this._key = key || null;
  this._last = null;
}

var proto = Collector.prototype;

proto.add = function(v) {
  this._add.push(v);
};

proto.rem = function(v) {
  this._rem.push(v);
};

proto.values = function() {
  this._get = null;
  if (this._rem.length === 0) return this._add;

  var a = this._add,
      r = this._rem,
      k = this._key,
      x = Array(a.length - r.length),
      i, j, n, m;

  if (!util.isObject(r[0])) {
    // processing raw values
    m = stats.count.map(r);
    for (i=0, j=0, n=a.length; i<n; ++i) {
      if (m[a[i]] > 0) {
        m[a[i]] -= 1;
      } else {
        x[j++] = a[i];
      }
    }
  } else if (k) {
    // has unique key field, so use that
    m = util.toMap(r, k);
    for (i=0, j=0, n=a.length; i<n; ++i) {
      if (!m.hasOwnProperty(k(a[i]))) { x[j++] = a[i]; }
    }
  } else {
    // no unique key, mark tuples directly
    for (i=0, n=r.length; i<n; ++i) {
      r[i][REM] = 1;
    }
    for (i=0, j=0, n=a.length; i<n; ++i) {
      if (!a[i][REM]) { x[j++] = a[i]; }
    }
    for (i=0, n=r.length; i<n; ++i) {
      delete r[i][REM];
    }
  }

  this._rem = [];
  return (this._add = x);
};

// memoizing statistics methods

proto.extent = function(get) {
  if (this._get !== get || !this._ext) {
    var v = this.values(),
        i = stats.extent.index(v, get);
    this._ext = [v[i[0]], v[i[1]]];
    this._get = get;    
  }
  return this._ext;
};

proto.argmin = function(get) {
  return this.extent(get)[0];
};

proto.argmax = function(get) {
  return this.extent(get)[1];
};

proto.min = function(get) {
  var m = this.extent(get)[0];
  return m ? get(m) : +Infinity;
};
proto.max = function(get) {
  var m = this.extent(get)[1];
  return m ? get(m) : -Infinity;
};

proto.quartile = function(get) {
  if (this._get !== get || !this._q) {
    this._q = stats.quartile(this.values(), get);
    this._get = get;    
  }
  return this._q;
};

proto.q1 = function(get) {
  return this.quartile(get)[0];
};

proto.q2 = function(get) {
  return this.quartile(get)[1];
};

proto.q3 = function(get) {
  return this.quartile(get)[2];
};

module.exports = Collector;

},{"../stats":22,"../util":25}],6:[function(require,module,exports){
var util = require('../util');
var Aggregator = require('./aggregator');

module.exports = function() {
  // flatten arguments into a single array
  var args = [].reduce.call(arguments, function(a, x) {
    return a.concat(util.array(x));
  }, []);
  // create and return an aggregator
  return new Aggregator()
    .groupby(args)
    .summarize({'*':'values'});
};

},{"../util":25,"./aggregator":4}],7:[function(require,module,exports){
var util = require('../util');

var types = {
  'values': measure({
    name: 'values',
    init: 'cell.collect = true;',
    set:  'cell.data.values()', idx: -1
  }),
  'count': measure({
    name: 'count',
    set:  'cell.num'
  }),
  'missing': measure({
    name: 'missing',
    set:  'this.missing'
  }),
  'valid': measure({
    name: 'valid',
    set:  'this.valid'
  }),
  'sum': measure({
    name: 'sum',
    init: 'this.sum = 0;',
    add:  'this.sum += v;',
    rem:  'this.sum -= v;',
    set:  'this.sum'
  }),
  'mean': measure({
    name: 'mean',
    init: 'this.mean = 0;',
    add:  'var d = v - this.mean; this.mean += d / this.valid;',
    rem:  'var d = v - this.mean; this.mean -= d / this.valid;',
    set:  'this.mean'
  }),
  'average': measure({
    name: 'average',
    set:  'this.mean',
    req:  ['mean'], idx: 1
  }),
  'variance': measure({
    name: 'variance',
    init: 'this.dev = 0;',
    add:  'this.dev += d * (v - this.mean);',
    rem:  'this.dev -= d * (v - this.mean);',
    set:  'this.dev / (this.valid-1)',
    req:  ['mean'], idx: 1
  }),
  'variancep': measure({
    name: 'variancep',
    set:  'this.dev / this.valid',
    req:  ['variance'], idx: 2
  }),
  'stdev': measure({
    name: 'stdev',
    set:  'Math.sqrt(this.dev / (this.valid-1))',
    req:  ['variance'], idx: 2
  }),
  'stdevp': measure({
    name: 'stdevp',
    set:  'Math.sqrt(this.dev / this.valid)',
    req:  ['variance'], idx: 2
  }),
  'median': measure({
    name: 'median',
    set:  'cell.data.q2(this.get)',
    req:  ['values'], idx: 3
  }),
  'q1': measure({
    name: 'q1',
    set:  'cell.data.q1(this.get)',
    req:  ['values'], idx: 3
  }),
  'q3': measure({
    name: 'q3',
    set:  'cell.data.q3(this.get)',
    req:  ['values'], idx: 3
  }),
  'distinct': measure({
    name: 'distinct',
    set:  'this.distinct(cell.data.values(), this.get)',
    req:  ['values'], idx: 3
  }),
  'argmin': measure({
    name: 'argmin',
    add:  'if (v < this.min) this.argmin = t;',
    rem:  'if (v <= this.min) this.argmin = null;',
    set:  'this.argmin = this.argmin || cell.data.argmin(this.get)',
    req:  ['min'], str: ['values'], idx: 3
  }),
  'argmax': measure({
    name: 'argmax',
    add:  'if (v > this.max) this.argmax = t;',
    rem:  'if (v >= this.max) this.argmax = null;',
    set:  'this.argmax = this.argmax || cell.data.argmax(this.get)',
    req:  ['max'], str: ['values'], idx: 3
  }),
  'min': measure({
    name: 'min',
    init: 'this.min = +Infinity;',
    add:  'if (v < this.min) this.min = v;',
    rem:  'if (v <= this.min) this.min = NaN;',
    set:  'this.min = (isNaN(this.min) ? cell.data.min(this.get) : this.min)',
    str:  ['values'], idx: 4
  }),
  'max': measure({
    name: 'max',
    init: 'this.max = -Infinity;',
    add:  'if (v > this.max) this.max = v;',
    rem:  'if (v >= this.max) this.max = NaN;',
    set:  'this.max = (isNaN(this.max) ? cell.data.max(this.get) : this.max)',
    str:  ['values'], idx: 4
  }),
  'modeskew': measure({
    name: 'modeskew',
    set:  'this.dev===0 ? 0 : (this.mean - cell.data.q2(this.get)) / Math.sqrt(this.dev/(this.valid-1))',
    req:  ['mean', 'stdev', 'median'], idx: 5
  })
};

function measure(base) {
  return function(out) {
    var m = util.extend({init:'', add:'', rem:'', idx:0}, base);
    m.out = out || base.name;
    return m;
  };
}

function resolve(agg, stream) {
  function collect(m, a) {
    function helper(r) { if (!m[r]) collect(m, m[r] = types[r]()); }
    if (a.req) a.req.forEach(helper);
    if (stream && a.str) a.str.forEach(helper);
    return m;
  }
  var map = agg.reduce(
    collect,
    agg.reduce(function(m, a) { return (m[a.name] = a, m); }, {})
  );
  return util.vals(map).sort(function(a, b) { return a.idx - b.idx; });
}

function create(agg, stream, accessor, mutator) {
  var all = resolve(agg, stream),
      ctr = 'this.cell = cell; this.tuple = t; this.valid = 0; this.missing = 0;',
      add = 'if (v==null) this.missing++; if (!this.isValid(v)) return; this.valid++;',
      rem = 'if (v==null) this.missing--; if (!this.isValid(v)) return; this.valid--;',
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
  agg.slice()
    .sort(function(a, b) { return a.idx - b.idx; })
    .forEach(function(a) {
      set += 'this.assign(t,\''+a.out+'\','+a.set+');';
    });
  set += 'return t;';

  /* jshint evil: true */
  ctr = Function('cell', 't', ctr);
  ctr.prototype.assign = mutator;
  ctr.prototype.add = Function('t', 'var v = this.get(t);' + add);
  ctr.prototype.rem = Function('t', 'var v = this.get(t);' + rem);
  ctr.prototype.set = Function(set);
  ctr.prototype.get = accessor;
  ctr.prototype.mod = mod;
  ctr.prototype.distinct = require('../stats').count.distinct;
  ctr.prototype.isValid = util.isValid;
  return ctr;
}

function mod(v_new, v_old) {
  if (v_old === undefined || v_old === v_new) return;
  this.rem(v_old);
  this.add(v_new);
}

types.create = create;
module.exports = types;
},{"../stats":22,"../util":25}],8:[function(require,module,exports){
var util = require('../util');
var units = require('../time-units');
var EPSILON = 1e-15;

function bins(opt) {
  opt = opt || {};

  // determine range
  var maxb = opt.maxbins || 15,
      base = opt.base || 10,
      logb = Math.log(base),
      div = opt.div || [5, 2],      
      min = opt.min,
      max = opt.max,
      span = max - min,
      step, level, minstep, precision, v, i, eps;

  if (opt.step) {
    // if step size is explicitly given, use that
    step = opt.step;
  } else if (opt.steps) {
    // if provided, limit choice to acceptable step sizes
    step = opt.steps[Math.min(
      opt.steps.length - 1,
      bisect(opt.steps, span/maxb, 0, opt.steps.length)
    )];
  } else {
    // else use span to determine step size
    level = Math.ceil(Math.log(maxb) / logb);
    minstep = opt.minstep || 0;
    step = Math.max(
      minstep,
      Math.pow(base, Math.round(Math.log(span) / logb) - level)
    );
    
    // increase step size if too many bins
    do { step *= base; } while (Math.ceil(span/step) > maxb);

    // decrease step size if allowed
    for (i=0; i<div.length; ++i) {
      v = step / div[i];
      if (v >= minstep && span / v <= maxb) step = v;
    }
  }

  // update precision, min and max
  v = Math.log(step);
  precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
  eps = Math.pow(base, -precision - 1);
  min = Math.min(min, Math.floor(min / step + eps) * step);
  max = Math.ceil(max / step) * step;

  return {
    start: min,
    stop:  max,
    step:  step,
    unit:  {precision: precision},
    value: value,
    index: index
  };
}

function bisect(a, x, lo, hi) {
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (util.cmp(a[mid], x) < 0) { lo = mid + 1; }
    else { hi = mid; }
  }
  return lo;
}

function value(v) {
  return this.step * Math.floor(v / this.step + EPSILON);
}

function index(v) {
  return Math.floor((v - this.start) / this.step + EPSILON);
}

function date_value(v) {
  return this.unit.date(value.call(this, v));
}

function date_index(v) {
  return index.call(this, this.unit.unit(v));
}

bins.date = function(opt) {
  opt = opt || {};

  // find time step, then bin
  var dmin = opt.min,
      dmax = opt.max,
      maxb = opt.maxbins || 20,
      minb = opt.minbins || 4,
      span = (+dmax) - (+dmin),
      unit = opt.unit ? units[opt.unit] : units.find(span, minb, maxb),
      spec = bins({
        min:     unit.min != null ? unit.min : unit.unit(dmin),
        max:     unit.max != null ? unit.max : unit.unit(dmax),
        maxbins: maxb,
        minstep: unit.minstep,
        steps:   unit.step
      });

  spec.unit = unit;
  spec.index = date_index;
  if (!opt.raw) spec.value = date_value;
  return spec;
};

module.exports = bins;

},{"../time-units":24,"../util":25}],9:[function(require,module,exports){
var stats = require('../stats');
var type = require('../import/type');
var util = require('../util');
var gen = require('../generate');
var bins = require('./bins');

var qtype = {
  'integer': 1,
  'number': 1,
  'date': 1
};

function $bin(values, f, opt) {
  opt = options(values, f, opt);
  var b = spec(opt);
  return !b ? (opt.accessor || util.identity) :
    util.$func('bin', b.unit.unit ?
      function(x) { return b.value(b.unit.unit(x)); } :
      function(x) { return b.value(x); }
    )(opt.accessor);
}

function histogram(values, f, opt) {
  opt = options(values, f, opt);
  var b = spec(opt);
  return b ?
    numerical(values, opt.accessor, b) :
    categorical(values, opt.accessor, opt && opt.sort);
}

function spec(opt) {
  var t = opt.type, b = null;
  if (t == null || qtype[t]) {
    if (t === 'integer' && opt.minstep == null) opt.minstep = 1;
    b = (t === 'date') ? bins.date(opt) : bins(opt);
  }
  return b;
}

function options() {
  var a = arguments,
      i = 0,
      values = util.isArray(a[i]) ? a[i++] : null,
      f = util.isFunction(a[i]) || util.isString(a[i]) ? util.$(a[i++]) : null,
      opt = util.extend({}, a[i]);
  
  if (values) {
    opt.type = opt.type || type(values, f);
    if (qtype[opt.type]) {
      var ext = stats.extent(values, f);
      opt = util.extend({min: ext[0], max: ext[1]}, opt);
    }
  }
  if (f) { opt.accessor = f; }
  return opt;
}

function numerical(values, f, b) {
  var h = gen.range(b.start, b.stop + b.step/2, b.step)
    .map(function(v) { return {value: b.value(v), count: 0}; });

  for (var i=0, v, j; i<values.length; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) {
      j = b.index(v);
      if (j < 0 || j >= h.length || !isFinite(j)) continue;
      h[j].count += 1;
    }
  }
  h.bins = b;
  return h;
}

function categorical(values, f, sort) {
  var u = stats.unique(values, f),
      c = stats.count.map(values, f);
  return u.map(function(k) { return {value: k, count: c[k]}; })
    .sort(util.comparator(sort ? '-count' : '+value'));
}

module.exports = {
  $bin: $bin,
  histogram: histogram
};
},{"../generate":10,"../import/type":19,"../stats":22,"../util":25,"./bins":8}],10:[function(require,module,exports){
var gen = module.exports = {};

gen.repeat = function(val, n) {
  var a = Array(n), i;
  for (i=0; i<n; ++i) a[i] = val;
  return a;
};

gen.zeros = function(n) {
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
  if (max === undefined) {
    max = min;
    min = 0;
  }
  var d = max - min;
  var f = function() {
    return min + d * Math.random();
  };
  f.samples = function(n) { return gen.zeros(n).map(f); };
  return f;
};

gen.random.integer = function(a, b) {
  if (b === undefined) {
    b = a;
    a = 0;
  }
  var d = b - a;
  var f = function() {
    return a + Math.floor(d * Math.random());
  };
  f.samples = function(n) { return gen.zeros(n).map(f); };
  return f;
};

gen.random.normal = function(mean, stdev) {
  mean = mean || 0;
  stdev = stdev || 1;
  var next;
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
    } while (rds === 0 || rds > 1);
    c = Math.sqrt(-2*Math.log(rds)/rds); // Box-Muller transform
    next = mean + y*c*stdev;
    return mean + x*c*stdev;
  };
  f.samples = function(n) { return gen.zeros(n).map(f); };
  return f;
};
},{}],11:[function(require,module,exports){
(function (global){
var util = require('../../util');
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null);

function dsv(data, format) {
  if (data) {
    var h = format.header;
    data = (h ? h.join(format.delimiter) + '\n' : '') + data;
  }
  return d3.dsv(format.delimiter).parse(data);
}

dsv.delimiter = function(delim) {
  var fmt = {delimiter: delim};
  return function(data, format) {
    return dsv(data, format ? util.extend(format, fmt) : fmt);
  };
};

module.exports = dsv;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../util":25}],12:[function(require,module,exports){
var dsv = require('./dsv');

module.exports = {
  json: require('./json'),
  topojson: require('./topojson'),
  treejson: require('./treejson'),
  dsv: dsv,
  csv: dsv.delimiter(','),
  tsv: dsv.delimiter('\t')
};
},{"./dsv":11,"./json":13,"./topojson":14,"./treejson":15}],13:[function(require,module,exports){
var util = require('../../util');

module.exports = function(data, format) {
  var d = util.isObject(data) && !util.isBuffer(data) ?
    data : JSON.parse(data);
  if (format && format.property) {
    d = util.accessor(format.property)(d);
  }
  return d;
};

},{"../../util":25}],14:[function(require,module,exports){
(function (global){
var json = require('./json');
var topojson = (typeof window !== "undefined" ? window.topojson : typeof global !== "undefined" ? global.topojson : null);

module.exports = function(data, format) {
  if (topojson == null) { throw Error('TopoJSON library not loaded.'); }

  var t = json(data, format), obj;

  if (format && format.feature) {
    if ((obj = t.objects[format.feature])) {
      return topojson.feature(t, obj).features;
    } else {
      throw Error('Invalid TopoJSON object: '+format.feature);
    }
  } else if (format && format.mesh) {
    if ((obj = t.objects[format.mesh])) {
      return [topojson.mesh(t, t.objects[format.mesh])];
    } else {
      throw Error('Invalid TopoJSON object: ' + format.mesh);
    }
  } else {
    throw Error('Missing TopoJSON feature or mesh parameter.');
  }

  return [];
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./json":13}],15:[function(require,module,exports){
var json = require('./json');

module.exports = function(data, format) {
  data = json(data, format);
  return toTable(data, (format && format.children));
};

function toTable(root, childrenField) {
  childrenField = childrenField || 'children';
  var table = [];
  
  function visit(node) {
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
},{"./json":13}],16:[function(require,module,exports){
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
      if (a.host === '') {
        a.href = a.href;
      }
      domain = a.hostname.toLowerCase();
      origin = window.location.hostname;
    }

    if (origin !== domain) {
      var whiteListed = opt.domainWhiteList.some(function(d) {
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
  var error = callback || function(e) { throw e; }, url;

  try {
    url = load.sanitizeUrl(opt); // enable override
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
  } else if (url.indexOf('://') < 0) { // TODO better protocol check?
    // if node.js, if no protocol assume file
    return file(url, callback);
  } else {
    // for regular URLs in node.js
    return http(url, callback);
  }
}

function xhrHasResponse(request) {
  var type = request.responseType;
  return type && type !== 'text' ?
    request.response : // null on error
    request.responseText; // '' on error
}

function xhr(url, callback) {
  var async = !!callback;
  var request = new XMLHttpRequest();
  // If IE does not support CORS, use XDomainRequest (copied from d3.xhr)
  if (this.XDomainRequest &&
      !('withCredentials' in request) &&
      /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest();

  function respond() {
    var status = request.status;
    if (!status && xhrHasResponse(request) || status >= 200 && status < 300 || status === 304) {
      callback(null, request.responseText);
    } else {
      callback(request, null);
    }
  }

  if (async) {
    if ('onload' in request) {
      request.onload = request.onerror = respond;
    } else {
      request.onreadystatechange = function() {
        if (request.readyState > 3) respond();
      };
    }
  }
  
  request.open('GET', url, async);
  request.send();
  
  if (!async && xhrHasResponse(request)) {
    return request.responseText;
  }
}

function file(filename, callback) {
  var fs = require('fs');
  if (!callback) {
    return fs.readFileSync(filename, 'utf8');
  }
  require('fs').readFile(filename, callback);
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

},{"../util":25,"fs":2,"request":2,"sync-request":2,"url":2}],17:[function(require,module,exports){
var util = require('../util');
var type = require('./type');
var formats = require('./formats');

function read(data, format) {
  var type = (format && format.type) || 'json';
  data = formats[type](data, format);
  if (format && format.parse) parse(data, format.parse);
  return data;
}

function parse(data, types) {
  var cols, parsers, d, i, j, clen, len = data.length;

  types = (types==='auto') ? type.inferAll(data) : util.duplicate(types);
  cols = util.keys(types);
  parsers = cols.map(function(c) { return type.parsers[types[c]]; });

  for (i=0, clen=cols.length; i<len; ++i) {
    d = data[i];
    for (j=0; j<clen; ++j) {
      d[cols[j]] = parsers[j](d[cols[j]]);
    }
  }
  type.annotation(data, types);
}

read.formats = formats;
module.exports = read;

},{"../util":25,"./formats":12,"./type":19}],18:[function(require,module,exports){
var util = require('../util');
var load = require('./load');
var read = require('./read');

module.exports = util
  .keys(read.formats)
  .reduce(function(out, type) {
    out[type] = function(opt, format, callback) {
      // process arguments
      if (util.isString(opt)) { opt = {url: opt}; }
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

},{"../util":25,"./load":16,"./read":17}],19:[function(require,module,exports){
var util = require('../util');

var TYPES = '__types__';

var PARSERS = {
  boolean: util.boolean,
  integer: util.number,
  number:  util.number,
  date:    util.date,
  string:  function(x) { return x==='' ? null : x; }
};

var TESTS = {
  boolean: function(x) { return x==='true' || x==='false' || util.isBoolean(x); },
  integer: function(x) { return TESTS.number(x) && (x=+x) === ~~x; },
  number: function(x) { return !isNaN(+x) && !util.isDate(x); },
  date: function(x) { return !isNaN(Date.parse(x)); }
};

function annotation(data, types) {
  if (!types) return data && data[TYPES] || null;
  data[TYPES] = types;
}

function type(values, f) {
  f = util.$(f);
  var v, i, n;

  // if data array has type annotations, use them
  if (values[TYPES]) {
    v = f(values[TYPES]);
    if (util.isString(v)) return v;
  }

  for (i=0, n=values.length; !util.isValid(v) && i<n; ++i) {
    v = f ? f(values[i]) : values[i];
  }

  return util.isDate(v) ? 'date' :
    util.isNumber(v)    ? 'number' :
    util.isBoolean(v)   ? 'boolean' :
    util.isString(v)    ? 'string' : null;
}

function typeAll(data, fields) {
  if (!data.length) return;
  fields = fields || util.keys(data[0]);
  return fields.reduce(function(types, f) {
    return (types[f] = type(data, f), types);
  }, {});
}

function infer(values, f) {
  f = util.$(f);
  var i, j, v;

  // types to test for, in precedence order
  var types = ['boolean', 'integer', 'number', 'date'];

  for (i=0; i<values.length; ++i) {
    // get next value to test
    v = f ? f(values[i]) : values[i];
    // test value against remaining types
    for (j=0; j<types.length; ++j) {
      if (util.isValid(v) && !TESTS[types[j]](v)) {
        types.splice(j, 1);
        j -= 1;
      }
    }
    // if no types left, return 'string'
    if (types.length === 0) return 'string';
  }

  return types[0];
}

function inferAll(data, fields) {
  fields = fields || util.keys(data[0]);
  return fields.reduce(function(types, f) {
    var type = infer(data, f);
    if (PARSERS[type]) types[f] = type;
    return types;
  }, {});
}

type.annotation = annotation;
type.all = typeAll;
type.infer = infer;
type.inferAll = inferAll;
type.parsers = PARSERS;
module.exports = type;
},{"../util":25}],20:[function(require,module,exports){
var util = require('./util');

var dl = {
  load:      require('./import/load'),
  read:      require('./import/read'),
  type:      require('./import/type'),
  bins:      require('./bins/bins'),
  $bin:      require('./bins/histogram').$bin,
  groupby:   require('./aggregate/groupby'),
  histogram: require('./bins/histogram').histogram,
  print:     require('./print'),
  template:  require('./template'),
  timeunits: require('./time-units')
};

util.extend(dl, util);
util.extend(dl, require('./generate'));
util.extend(dl, require('./stats'));
util.extend(dl, require('./import/readers'));

module.exports = dl;
},{"./aggregate/groupby":6,"./bins/bins":8,"./bins/histogram":9,"./generate":10,"./import/load":16,"./import/read":17,"./import/readers":18,"./import/type":19,"./print":21,"./stats":22,"./template":23,"./time-units":24,"./util":25}],21:[function(require,module,exports){
var util = require('./util');
var type = require('./import/type');
var stats = require('./stats');
var template = require('./template');

var FMT = {
  'date':    '|time:"%m/%d/%Y %H:%M:%S"',
  'number':  '|number:".4f"',
  'integer': '|number:"d"'
};

var POS = {
  'number':  'left',
  'integer': 'left'
};

module.exports.table = function(data, opt) {
  opt = util.extend({separator:' ', minwidth: 8, maxwidth: 15}, opt);
  var fields = opt.fields || util.keys(data[0]),
      types = type.all(data);

  if (opt.start || opt.limit) {
    var a = opt.start || 0,
        b = opt.limit ? a + opt.limit : data.length;
    data = data.slice(a, b);
  }

  // determine char width of fields
  var lens = fields.map(function(name) {
    var format = FMT[types[name]] || '',
        t = template('{{' + name + format + '}}'),
        l = stats.max(data, function(x) { return t(x).length; });
    l = Math.max(Math.min(name.length, opt.minwidth), l);
    return opt.maxwidth > 0 ? Math.min(l, opt.maxwidth) : l;
  });

  // print header row
  var head = fields.map(function(name, i) {
    return util.truncate(util.pad(name, lens[i], 'center'), lens[i]);
  }).join(opt.separator);

  // build template function for each row
  var tmpl = template(fields.map(function(name, i) {
    return '{{' +
      name +
      (FMT[types[name]] || '') +
      ('|pad:' + lens[i] + ',' + POS[types[name]] || 'right') +
      ('|truncate:' + lens[i]) +
    '}}';
  }).join(opt.separator));

  // print table
  return head + "\n" + data.map(tmpl).join('\n');
};

module.exports.summary = function(s) {
  s = s ? s.__summary__ ? s : stats.summary(s) : this;
  var str = [], i, n;
  for (i=0, n=s.length; i<n; ++i) {
    str.push('-- ' + s[i].field + ' --');
    if (s[i].type === 'string' || s[i].distinct < 10) {
      str.push(printCategoricalProfile(s[i]));
    } else {
      str.push(printQuantitativeProfile(s[i]));
    }
    str.push('');
  }
  return str.join('\n');
};

function printQuantitativeProfile(p) {
  return [
    'valid:    ' + p.valid,
    'missing:  ' + p.missing,
    'distinct: ' + p.distinct,
    'min:      ' + p.min,
    'max:      ' + p.max,
    'median:   ' + p.median,
    'mean:     ' + p.mean,
    'stdev:    ' + p.stdev,
    'modeskew: ' + p.modeskew
  ].join('\n');
}

function printCategoricalProfile(p) {
  var list = [
    'valid:    ' + p.valid,
    'missing:  ' + p.missing,
    'distinct: ' + p.distinct,
    'top values: '
  ];
  var u = p.unique;
  var top = util.keys(u)
    .sort(function(a,b) { return u[b] - u[a]; })
    .slice(0, 6)
    .map(function(v) { return ' \'' + v + '\' (' + u[v] + ')'; });
  return list.concat(top).join('\n');
}
},{"./import/type":19,"./stats":22,"./template":23,"./util":25}],22:[function(require,module,exports){
var util = require('./util');
var type = require('./import/type');
var gen = require('./generate');
var stats = {};

// Collect unique values.
// Output: an array of unique values, in first-observed order
stats.unique = function(values, f, results) {
  f = util.$(f);
  results = results || [];
  var u = {}, v, i, n;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v in u) continue;
    u[v] = 1;
    results.push(v);
  }
  return results;
};

// Return the length of the input array.
stats.count = function(values) {
  return values && values.length || 0;
};

// Count the number of non-null, non-undefined, non-NaN values.
stats.count.valid = function(values, f) {
  f = util.$(f);
  var v, i, n, valid = 0;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) valid += 1;
  }
  return valid;
};

// Count the number of null or undefined values.
stats.count.missing = function(values, f) {
  f = util.$(f);
  var v, i, n, count = 0;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v == null) count += 1;
  }
  return count;
};

// Count the number of distinct values.
// Null, undefined and NaN are each considered distinct values.
stats.count.distinct = function(values, f) {
  f = util.$(f);
  var u = {}, v, i, n, count = 0;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v in u) continue;
    u[v] = 1;
    count += 1;
  }
  return count;
};

// Construct a map from distinct values to occurrence counts.
stats.count.map = function(values, f) {
  f = util.$(f);
  var map = {}, v, i, n;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    map[v] = (v in map) ? map[v] + 1 : 1;
  }
  return map;
};

// Compute the median of an array of numbers.
stats.median = function(values, f) {
  if (f) values = values.map(util.$(f));
  values = values.filter(util.isValid).sort(util.cmp);
  return stats.quantile(values, 0.5);
};

// Computes the quartile boundaries of an array of numbers.
stats.quartile = function(values, f) {
  if (f) values = values.map(util.$(f));
  values = values.filter(util.isValid).sort(util.cmp);
  var q = stats.quantile;
  return [q(values, 0.25), q(values, 0.50), q(values, 0.75)];
};

// Compute the quantile of a sorted array of numbers.
// Adapted from the D3.js implementation.
stats.quantile = function(values, f, p) {
  if (p === undefined) { p = f; f = util.identity; }
  f = util.$(f);
  var H = (values.length - 1) * p + 1,
      h = Math.floor(H),
      v = +f(values[h - 1]),
      e = H - h;
  return e ? v + e * (f(values[h]) - v) : v;
};

// Compute the sum of an array of numbers.
stats.sum = function(values, f) {
  f = util.$(f);
  for (var sum=0, i=0, n=values.length, v; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) sum += v;
  }
  return sum;
};

// Compute the mean (average) of an array of numbers.
stats.mean = function(values, f) {
  f = util.$(f);
  var mean = 0, delta, i, n, c, v;
  for (i=0, c=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) {
      delta = v - mean;
      mean = mean + delta / (++c);
    }
  }
  return mean;
};

// Compute the sample variance of an array of numbers.
stats.variance = function(values, f) {
  f = util.$(f);
  if (!util.isArray(values) || values.length===0) return 0;
  var mean = 0, M2 = 0, delta, i, c, v;
  for (i=0, c=0; i<values.length; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) {
      delta = v - mean;
      mean = mean + delta / (++c);
      M2 = M2 + delta * (v - mean);
    }
  }
  M2 = M2 / (c - 1);
  return M2;
};

// Compute the sample standard deviation of an array of numbers.
stats.stdev = function(values, f) {
  return Math.sqrt(stats.variance(values, f));
};

// Compute the Pearson mode skewness ((median-mean)/stdev) of an array of numbers.
stats.modeskew = function(values, f) {
  var avg = stats.mean(values, f),
      med = stats.median(values, f),
      std = stats.stdev(values, f);
  return std === 0 ? 0 : (avg - med) / std;
};

// Find the minimum value in an array.
stats.min = function(values, f) {
  return stats.extent(values, f)[0];
};

// Find the maximum value in an array.
stats.max = function(values, f) {
  return stats.extent(values, f)[1];
};

// Find the minimum and maximum of an array of values.
stats.extent = function(values, f) {
  f = util.$(f);
  var a, b, v, i, n = values.length;
  for (i=0; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) { a = b = v; break; }
  }
  for (; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) {
      if (v < a) a = v;
      if (v > b) b = v;
    }
  }
  return [a, b];
};

// Find the integer indices of the minimum and maximum values.
stats.extent.index = function(values, f) {
  f = util.$(f);
  var x = -1, y = -1, a, b, v, i, n = values.length;
  for (i=0; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) { a = b = v; x = y = i; break; }
  }
  for (; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (util.isValid(v)) {
      if (v < a) { a = v; x = i; }
      if (v > b) { b = v; y = i; }
    }
  }
  return [x, y];
};

// Compute the dot product of two arrays of numbers.
stats.dot = function(values, a, b) {
  var sum = 0, i, v;
  if (!b) {
    if (values.length !== a.length) {
      throw Error('Array lengths must match.');
    }
    for (i=0; i<values.length; ++i) {
      v = values[i] * a[i];
      if (!Number.isNaN(v)) sum += v;
    }
  } else {
    a = util.$(a);
    b = util.$(b);
    for (i=0; i<values.length; ++i) {
      v = a(values[i]) * b(values[i]);
      if (!Number.isNaN(v)) sum += v;
    }
  }
  return sum;
};

// Compute ascending rank scores for an array of values.
// Ties are assigned their collective mean rank.
stats.rank = function(values, f) {
  f = util.$(f) || util.identity;
  var a = values.map(function(v, i) {
      return {idx: i, val: f(v)};
    })
    .sort(util.comparator('val'));

  var n = values.length,
      r = Array(n),
      tie = -1, p = {}, i, v, mu;

  for (i=0; i<n; ++i) {
    v = a[i].val;
    if (tie < 0 && p === v) {
      tie = i - 1;
    } else if (tie > -1 && p !== v) {
      mu = 1 + (i-1 + tie) / 2;
      for (; tie<i; ++tie) r[a[tie].idx] = mu;
      tie = -1;
    }
    r[a[i].idx] = i + 1;
    p = v;
  }

  if (tie > -1) {
    mu = 1 + (n-1 + tie) / 2;
    for (; tie<n; ++tie) r[a[tie].idx] = mu;
  }

  return r;
};

// Compute the sample Pearson product-moment correlation of two arrays of numbers.
stats.cor = function(values, a, b) {
  var fn = b;
  b = fn ? values.map(util.$(b)) : a;
  a = fn ? values.map(util.$(a)) : values;

  var dot = stats.dot(a, b),
      mua = stats.mean(a),
      mub = stats.mean(b),
      sda = stats.stdev(a),
      sdb = stats.stdev(b),
      n = values.length;

  return (dot - n*mua*mub) / ((n-1) * sda * sdb);
};

// Compute the Spearman rank correlation of two arrays of values.
stats.cor.rank = function(values, a, b) {
  var ra = b ? stats.rank(values, util.$(a)) : stats.rank(values),
      rb = b ? stats.rank(values, util.$(b)) : stats.rank(a),
      n = values.length, i, s, d;

  for (i=0, s=0; i<n; ++i) {
    d = ra[i] - rb[i];
    s += d * d;
  }

  return 1 - 6*s / (n * (n*n-1));
};

// Compute the distance correlation of two arrays of numbers.
// http://en.wikipedia.org/wiki/Distance_correlation
stats.cor.dist = function(values, a, b) {
  var X = b ? values.map(util.$(a)) : values,
      Y = b ? values.map(util.$(b)) : a;

  var A = stats.dist.mat(X),
      B = stats.dist.mat(Y),
      n = A.length,
      i, aa, bb, ab;

  for (i=0, aa=0, bb=0, ab=0; i<n; ++i) {
    aa += A[i]*A[i];
    bb += B[i]*B[i];
    ab += A[i]*B[i];
  }

  return Math.sqrt(ab / Math.sqrt(aa*bb));
};

// Compute the vector distance between two arrays of numbers.
// Default is Euclidean (exp=2) distance, configurable via exp argument.
stats.dist = function(values, a, b, exp) {
  var f = util.isFunction(b) || util.isString(b),
      X = values,
      Y = f ? values : a,
      e = f ? exp : b,
      L2 = e === 2 || e == null,
      n = values.length, s = 0, d, i;
  if (f) {
    a = util.$(a);
    b = util.$(b);
  }
  for (i=0; i<n; ++i) {
    d = f ? (a(X[i])-b(Y[i])) : (X[i]-Y[i]);
    s += L2 ? d*d : Math.pow(Math.abs(d), e);
  }
  return L2 ? Math.sqrt(s) : Math.pow(s, 1/e);
};

// Construct a mean-centered distance matrix for an array of numbers.
stats.dist.mat = function(X) {
  var n = X.length,
      m = n*n,
      A = Array(m),
      R = gen.zeros(n),
      M = 0, v, i, j;

  for (i=0; i<n; ++i) {
    A[i*n+i] = 0;
    for (j=i+1; j<n; ++j) {
      A[i*n+j] = (v = Math.abs(X[i] - X[j]));
      A[j*n+i] = v;
      R[i] += v;
      R[j] += v;
    }
  }

  for (i=0; i<n; ++i) {
    M += R[i];
    R[i] /= n;
  }
  M /= m;

  for (i=0; i<n; ++i) {
    for (j=i; j<n; ++j) {
      A[i*n+j] += M - R[i] - R[j];
      A[j*n+i] = A[i*n+j];
    }
  }

  return A;
};

// Compute the Shannon entropy (log base 2) of an array of counts.
stats.entropy = function(counts, f) {
  f = util.$(f);
  var i, p, s = 0, H = 0, n = counts.length;
  for (i=0; i<n; ++i) {
    s += (f ? f(counts[i]) : counts[i]);
  }
  if (s === 0) return 0;
  for (i=0; i<n; ++i) {
    p = (f ? f(counts[i]) : counts[i]) / s;
    if (p) H += p * Math.log(p);
  }
  return -H / Math.LN2;
};

// Compute the mutual information between two discrete variables.
// Returns an array of the form [MI, MI_distance] 
// MI_distance is defined as 1 - I(a,b) / H(a,b).
// http://en.wikipedia.org/wiki/Mutual_information
stats.mutual = function(values, a, b, counts) {
  var x = counts ? values.map(util.$(a)) : values,
      y = counts ? values.map(util.$(b)) : a,
      z = counts ? values.map(util.$(counts)) : b;

  var px = {},
      py = {},
      n = z.length,
      s = 0, I = 0, H = 0, p, t, i;

  for (i=0; i<n; ++i) {
    px[x[i]] = 0;
    py[y[i]] = 0;
  }

  for (i=0; i<n; ++i) {
    px[x[i]] += z[i];
    py[y[i]] += z[i];
    s += z[i];
  }

  t = 1 / (s * Math.LN2);
  for (i=0; i<n; ++i) {
    if (z[i] === 0) continue;
    p = (s * z[i]) / (px[x[i]] * py[y[i]]);
    I += z[i] * t * Math.log(p);
    H += z[i] * t * Math.log(z[i]/s);
  }

  return [I, 1 + I/H];
};

// Compute the mutual information between two discrete variables.
stats.mutual.info = function(values, a, b, counts) {
  return stats.mutual(values, a, b, counts)[0];
};

// Compute the mutual information distance between two discrete variables.
// MI_distance is defined as 1 - I(a,b) / H(a,b).
stats.mutual.dist = function(values, a, b, counts) {
  return stats.mutual(values, a, b, counts)[1];
};

// Compute a profile of summary statistics for a variable.
stats.profile = function(values, f) {
  var mean = 0,
      valid = 0,
      missing = 0,
      distinct = 0,
      min = null,
      max = null,
      M2 = 0,
      vals = [],
      u = {}, delta, sd, i, v, x;

  // compute summary stats
  for (i=0; i<values.length; ++i) {
    v = f ? f(values[i]) : values[i];

    // update unique values
    u[v] = (v in u) ? u[v] + 1 : (distinct += 1, 1);

    if (v == null) {
      ++missing;
    } else if (util.isValid(v)) {
      // update stats
      x = (typeof v === 'string') ? v.length : v;
      if (min===null || x < min) min = x;
      if (max===null || x > max) max = x;
      delta = x - mean;
      mean = mean + delta / (++valid);
      M2 = M2 + delta * (x - mean);
      vals.push(x);
    }
  }
  M2 = M2 / (valid - 1);
  sd = Math.sqrt(M2);

  // sort values for median and iqr
  vals.sort(util.cmp);

  return {
    type:     type(values, f),
    unique:   u,
    count:    values.length,
    valid:    valid,
    missing:  missing,
    distinct: distinct,
    min:      min,
    max:      max,
    mean:     mean,
    stdev:    sd,
    median:   (v = stats.quantile(vals, 0.5)),
    q1:       stats.quantile(vals, 0.25),
    q3:       stats.quantile(vals, 0.75),
    modeskew: sd === 0 ? 0 : (mean - v) / sd
  };
};

// Compute profiles for all variables in a data set.
stats.summary = function(data, fields) {
  fields = fields || util.keys(data[0]);
  var s = fields.map(function(f) {
    var p = stats.profile(data, util.$(f));
    return (p.field = f, p);
  });
  return (s.__summary__ = true, s);
};

module.exports = stats;
},{"./generate":10,"./import/type":19,"./util":25}],23:[function(require,module,exports){
(function (global){
var util = require('./util');
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null);

var context = {
  formats:    [],
  format_map: {},
  truncate:   util.truncate,
  pad:        util.pad
};

function template(text) {
  var src = source(text, 'd');
  src = 'var __t; return ' + src + ';';

  try {
    /* jshint evil: true */
    return (new Function('d', src)).bind(context);
  } catch (e) {
    e.source = src;
    throw e;
  }
}

template.source = source;
module.exports = template;

// clear cache of format objects
// can *break* prior template functions, so invoke with care
template.clearFormatCache = function() {
  context.formats = [];
  context.format_map = {};
};

function source(text, variable) {
  variable = variable || 'obj';
  var index = 0;
  var src = '\'';
  var regex = template_re;

  // Compile the template source, escaping string literals appropriately.
  text.replace(regex, function(match, interpolate, offset) {
    src += text
      .slice(index, offset)
      .replace(template_escaper, template_escapeChar);
    index = offset + match.length;

    if (interpolate) {
      src += '\'\n+((__t=(' +
        template_var(interpolate, variable) +
        '))==null?\'\':__t)+\n\'';
    }

    // Adobe VMs need the match returned to produce the correct offest.
    return match;
  });
  return src + '\'';
}

function template_var(text, variable) {
  var filters = text.split('|');
  var prop = filters.shift().trim();
  var stringCast = true;
  
  function strcall(fn) {
    fn = fn || '';
    if (stringCast) {
      stringCast = false;
      src = 'String(' + src + ')' + fn;
    } else {
      src += fn;
    }
    return src;
  }
  
  function date() {
    return '(typeof ' + src + '==="number"?new Date('+src+'):'+src+')';
  }
  
  var src = util.field(prop).map(util.str).join('][');
  src = variable + '[' + src + ']';
  
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
        strcall('.slice('+ a +
          (args.length > 1 ? ',' + util.number(args[1]) : '') +
          ')');
        break;
      case 'truncate':
        a = util.number(args[0]);
        b = args[1];
        b = (b!=='left' && b!=='middle' && b!=='center') ? 'right' : b;
        src = 'this.truncate(' + strcall() + ',' + a + ',\'' + b + '\')';
        break;
      case 'pad':
        a = util.number(args[0]);
        b = args[1];
        b = (b!=='left' && b!=='middle' && b!=='center') ? 'right' : b;
        src = 'this.pad(' + strcall() + ',' + a + ',\'' + b + '\')';
        break;
      case 'number':
        a = template_format(args[0], d3.format);
        stringCast = false;
        src = 'this.formats['+a+']('+src+')';
        break;
      case 'time':
        a = template_format(args[0], d3.time.format);
        stringCast = false;
        src = 'this.formats['+a+']('+date()+')';
        break;
      default:
        throw Error('Unrecognized template filter: ' + f);
    }
  }

  return src;
}

var template_re = /\{\{(.+?)\}\}|$/g;

// Certain characters need to be escaped so that they can be put into a
// string literal.
var template_escapes = {
  '\'':     '\'',
  '\\':     '\\',
  '\r':     'r',
  '\n':     'n',
  '\u2028': 'u2028',
  '\u2029': 'u2029'
};

var template_escaper = /\\|'|\r|\n|\u2028|\u2029/g;

function template_escapeChar(match) {
  return '\\' + template_escapes[match];
}

function template_format(pattern, fmt) {
  if ((pattern[0] === '\'' && pattern[pattern.length-1] === '\'') ||
      (pattern[0] === '"'  && pattern[pattern.length-1] === '"')) {
    pattern = pattern.slice(1, -1);
  } else {
    throw Error('Format pattern must be quoted: ' + pattern);
  }
  if (!context.format_map[pattern]) {
    var f = fmt(pattern);
    var i = context.formats.length;
    context.formats.push(f);
    context.format_map[pattern] = i;
  }
  return context.format_map[pattern];
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./util":25}],24:[function(require,module,exports){
var STEPS = [
  [31536e6, 5],  // 1-year
  [7776e6, 4],   // 3-month
  [2592e6, 4],   // 1-month
  [12096e5, 3],  // 2-week
  [6048e5, 3],   // 1-week
  [1728e5, 3],   // 2-day
  [864e5, 3],    // 1-day
  [432e5, 2],    // 12-hour
  [216e5, 2],    // 6-hour
  [108e5, 2],    // 3-hour
  [36e5, 2],     // 1-hour
  [18e5, 1],     // 30-minute
  [9e5, 1],      // 15-minute
  [3e5, 1],      // 5-minute
  [6e4, 1],      // 1-minute
  [3e4, 0],      // 30-second
  [15e3, 0],     // 15-second
  [5e3, 0],      // 5-second
  [1e3, 0]       // 1-second
];

function isNumber(d) { return typeof d === 'number'; }

var entries = [
  {
    type: 'second',
    minstep: 1,
    format: '%Y %b %-d %H:%M:%S.%L',
    date: function(d) {
      return new Date(d * 1e3);
    },
    unit: function(d) {
      return (+d / 1e3);
    }
  },
  {
    type: 'minute',
    minstep: 1,
    format: '%Y %b %-d %H:%M',
    date: function(d) {
      return new Date(d * 6e4);
    },
    unit: function(d) {
      return ~~(+d / 6e4);
    }
  },
  {
    type: 'hour',
    minstep: 1,
    format: '%Y %b %-d %H:00',
    date: function(d) {
      return new Date(d * 36e5);
    },
    unit: function(d) {
      return ~~(+d / 36e5);
    }
  },
  {
    type: 'day',
    minstep: 1,
    step: [1, 7],
    format: '%Y %b %-d',
    date: function(d) {
      return new Date(d * 864e5);
    },
    unit: function(d) {
      return ~~(+d / 864e5);
    }
  },
  {
    type: 'month',
    minstep: 1,
    step: [1, 3, 6],
    format: '%b %Y',
    date: function(d) {
      return new Date(Date.UTC(~~(d / 12), d % 12, 1));
    },
    unit: function(d) {
      if (isNumber(d)) d = new Date(d);
      return 12 * d.getUTCFullYear() + d.getUTCMonth();
    }
  },
  {
    type: 'year',
    minstep: 1,
    format: '%Y',
    date: function(d) {
      return new Date(Date.UTC(d, 0, 1));
    },
    unit: function(d) {
      return (isNumber(d) ? new Date(d) : d).getUTCFullYear();
    }
  }
];

var minuteOfHour = {
  type: 'minuteOfHour',
  min: 0,
  max: 59,
  minstep: 1,
  format: '%M',
  date: function(d) {
    return new Date(Date.UTC(1970, 0, 1, 0, d));
  },
  unit: function(d) {
    return (isNumber(d) ? new Date(d) : d).getUTCMinutes();
  }
};

var hourOfDay = {
  type: 'hourOfDay',
  min: 0,
  max: 23,
  minstep: 1,
  format: '%H',
  date: function(d) {
    return new Date(Date.UTC(1970, 0, 1, d));
  },
  unit: function(d) {
    return (isNumber(d) ? new Date(d) : d).getUTCHours();
  }
};

var dayOfWeek = {
  type: 'dayOfWeek',
  min: 0,
  max: 6,
  step: [1],
  format: '%a',
  date: function(d) {
    return new Date(Date.UTC(1970, 0, 4 + d));
  },
  unit: function(d) {
    return (isNumber(d) ? new Date(d) : d).getUTCDay();
  }
};

var dayOfMonth = {
  type: 'dayOfMonth',
  min: 1,
  max: 31,
  step: [1],
  format: '%-d',
  date: function(d) {
    return new Date(Date.UTC(1970, 0, d));
  },
  unit: function(d) {
    return (isNumber(d) ? new Date(d) : d).getUTCDate();
  }
};

var monthOfYear = {
  type: 'monthOfYear',
  min: 0,
  max: 11,
  step: [1],
  format: '%b',
  date: function(d) {
    return new Date(Date.UTC(1970, d % 12, 1));
  },
  unit: function(d) {
    return (isNumber(d) ? new Date(d) : d).getUTCMonth();
  }
};

var units = {
  'second':       entries[0],
  'minute':       entries[1],
  'hour':         entries[2],
  'day':          entries[3],
  'month':        entries[4],
  'year':         entries[5],
  'minuteOfHour': minuteOfHour,
  'hourOfDay':    hourOfDay,
  'dayOfWeek':    dayOfWeek,
  'dayOfMonth':   dayOfMonth,
  'monthOfYear':  monthOfYear,
  'timesteps':    entries
};

units.find = function(span, minb, maxb) {
  var i, len, bins, step = STEPS[0];

  for (i = 1, len = STEPS.length; i < len; ++i) {
    step = STEPS[i];
    if (span > step[0]) {
      bins = span / step[0];
      if (bins > maxb) {
        return entries[STEPS[i - 1][1]];
      }
      if (bins >= minb) {
        return entries[step[1]];
      }
    }
  }
  return entries[STEPS[STEPS.length - 1][1]];
};

module.exports = units;

},{}],25:[function(require,module,exports){
(function (process){
var Buffer = require('buffer').Buffer;
var units = require('./time-units');
var u = module.exports = {};

// where are we?

u.isNode = typeof process !== 'undefined' &&
           typeof process.stderr !== 'undefined';

// utility functions

var FNAME = '__name__';

u.namedfunc = function(name, f) { return (f[FNAME] = name, f); };

u.name = function(f) { return f==null ? null : f[FNAME]; };

u.identity = function(x) { return x; };

u.true = u.namedfunc('true', function() { return true; });

u.false = u.namedfunc('false', function() { return false; });

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

u.length = function(x) {
  return x != null && x.length != null ? x.length : null;
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

u.toMap = function(list, f) {
  return (f = u.$(f)) ?
    list.reduce(function(obj, x) { return (obj[f(x)] = 1, obj); }, {}) :
    list.reduce(function(obj, x) { return (obj[x] = 1, obj); }, {});
};

u.keystr = function(values) {
  // use to ensure consistent key generation across modules
  var n = values.length;
  if (!n) return '';
  for (var s=String(values[0]), i=1; i<n; ++i) {
    s += '|' + String(values[i]);
  }
  return s;
};

// type checking functions

var toString = Object.prototype.toString;

u.isObject = function(obj) {
  return obj === Object(obj);
};

u.isFunction = function(obj) {
  return toString.call(obj) === '[object Function]';
};

u.isString = function(obj) {
  return typeof value === 'string' || toString.call(obj) === '[object String]';
};

u.isArray = Array.isArray || function(obj) {
  return toString.call(obj) === '[object Array]';
};

u.isNumber = function(obj) {
  return typeof obj === 'number' || toString.call(obj) === '[object Number]';
};

u.isBoolean = function(obj) {
  return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
};

u.isDate = function(obj) {
  return toString.call(obj) === '[object Date]';
};

u.isValid = function(obj) {
  return obj != null && !Number.isNaN(obj);
};

u.isBuffer = (Buffer && Buffer.isBuffer) || u.false;

// type coercion functions

u.number = function(s) {
  return s == null || s === '' ? null : +s;
};

u.boolean = function(s) {
  return s == null || s === '' ? null : s==='false' ? false : !!s;
};

u.date = function(s) {
  return s == null || s === '' ? null : Date.parse(s);
};

u.array = function(x) {
  return x != null ? (u.isArray(x) ? x : [x]) : [];
};

u.str = function(x) {
  return u.isArray(x) ? '[' + x.map(u.str) + ']'
    : u.isObject(x) ? JSON.stringify(x)
    : u.isString(x) ? ('\''+util_escape_str(x)+'\'') : x;
};

var escape_str_re = /(^|[^\\])'/g;

function util_escape_str(x) {
  return x.replace(escape_str_re, '$1\\\'');
}

// data access functions

u.field = function(f) {
  return String(f).split('\\.')
    .map(function(d) { return d.split('.'); })
    .reduce(function(a, b) {
      if (a.length) { a[a.length-1] += '.' + b.shift(); }
      a.push.apply(a, b);
      return a;
    }, []);
};

u.accessor = function(f) {
  var s;
  return f==null || u.isFunction(f) ? f :
    u.namedfunc(f, (s = u.field(f)).length > 1 ?
      function(x) { return s.reduce(function(x,f) { return x[f]; }, x); } :
      function(x) { return x[f]; }
    );
};

u.$ = u.accessor;

u.mutator = function(f) {
  var s;
  return u.isString(f) && (s=u.field(f)).length > 1 ?
    function(x, v) {
      for (var i=0; i<s.length-1; ++i) x = x[s[i]];
      x[s[i]] = v;
    } :
    function(x, v) { x[f] = v; };
};

u.$func = function(name, op) {
  return function(f) {
    f = u.$(f) || u.identity;
    var n = name + (u.name(f) ? '_'+u.name(f) : '');
    return u.namedfunc(n, function(d) { return op(f(d)); });
  };
};

u.$valid  = u.$func('valid', u.isValid);
u.$length = u.$func('length', u.length);
u.$year   = u.$func('year', units.year.unit);
u.$month  = u.$func('month', units.monthOfYear.unit);
u.$date   = u.$func('date', units.dayOfMonth.unit);
u.$day    = u.$func('day', units.dayOfWeek.unit);
u.$hour   = u.$func('hour', units.hourOfDay.unit);
u.$minute = u.$func('minute', units.minuteOfHour.unit);

u.$in = function(f, values) {
  f = u.$(f);
  var map = u.isArray(values) ? u.toMap(values) : values;
  return function(d) { return !!map[f(d)]; };
};

// comparison / sorting functions

u.comparator = function(sort) {
  var sign = [];
  if (sort === undefined) sort = [];
  sort = u.array(sort).map(function(f) {
    var s = 1;
    if      (f[0] === '-') { s = -1; f = f.slice(1); }
    else if (f[0] === '+') { s = +1; f = f.slice(1); }
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
u.startsWith = String.prototype.startsWith ?
  function(string, searchString) {
    return string.startsWith(searchString);
  } :
  function(string, searchString) {
    return string.lastIndexOf(searchString, 0) === 0;
  };

u.pad = function(s, length, pos, padchar) {
  padchar = padchar || " ";
  var d = length - s.length;
  if (d <= 0) return s;
  switch (pos) {
    case 'left':
      return strrep(d, padchar) + s;
    case 'middle':
    case 'center':
      return strrep(Math.floor(d/2), padchar) +
         s + strrep(Math.ceil(d/2), padchar);
    default:
      return s + strrep(d, padchar);
  }
};

function strrep(n, str) {
  var s = "", i;
  for (i=0; i<n; ++i) s += str;
  return s;
}

u.truncate = function(s, length, pos, word, ellipsis) {
  var len = s.length;
  if (len <= length) return s;
  ellipsis = ellipsis !== undefined ? String(ellipsis) : '\u2026';
  var l = Math.max(0, length - ellipsis.length);

  switch (pos) {
    case 'left':
      return ellipsis + (word ? truncateOnWord(s,l,1) : s.slice(len-l));
    case 'middle':
    case 'center':
      var l1 = Math.ceil(l/2), l2 = Math.floor(l/2);
      return (word ? truncateOnWord(s,l1) : s.slice(0,l1)) +
        ellipsis + (word ? truncateOnWord(s,l2,1) : s.slice(len-l2));
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
  return s.length ? s.join('').trim() : tok[0].slice(0, len);
}

var truncate_word_re = /([\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u2028\u2029\u3000\uFEFF])/;

}).call(this,require('_process'))

},{"./time-units":24,"_process":3,"buffer":2}],26:[function(require,module,exports){
module.exports = require('./lib/heap');

},{"./lib/heap":27}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
(function (global){
var dl = require('datalib'),
    canvas = require('../render/canvas/index'),
    svg = require('../render/svg-headless/index'),
    View = require('./View'),
    debug = require('../util/debug');

var HeadlessView = function(width, height, model) {
  View.call(null, width, height, model);
  this._el = "body";
  this._type = "canvas";
  this._renderers = {canvas: canvas, svg: svg};
  this._canvas = null;
}

var prototype = (HeadlessView.prototype = new View());

prototype.renderer = function(type) {
  if(type) this._type = type;
  return View.prototype.renderer.apply(this, arguments);
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
      pad = this._padding,
      bg = this._bgcolor;

  if (this._viewport) {
    w = this._viewport[0] - (pad ? pad.left + pad.right : 0);
    h = this._viewport[1] - (pad ? pad.top + pad.bottom : 0);
  }

  this._renderer = this._renderer || new this._io.Renderer();
  
  if (this._type === "svg") {
    this.initSVG(w, h, pad, bg);
  } else {
    this.initCanvas(w, h, pad, bg);
  }
  
  return this;
};

prototype.initCanvas = function(w, h, pad, bg) {
  var Canvas = (typeof window !== "undefined" ? window.canvas : typeof global !== "undefined" ? global.canvas : null),
      tw = w + (pad ? pad.left + pad.right : 0),
      th = h + (pad ? pad.top + pad.bottom : 0),
      canvas = this._canvas = dl.isNode ? new Canvas(tw, th) : document.createElement('canvas'),
      ctx = canvas.getContext("2d");

  if(!dl.isNode) {  // Manually set width/height on DOM elements
    canvas.setAttribute("width", tw);
    canvas.setAttribute("height", th);
  }
  
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

module.exports = HeadlessView;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../render/canvas/index":62,"../render/svg-headless/index":66,"../util/debug":108,"./View":30,"datalib":20}],29:[function(require,module,exports){
var dl = require('datalib'),
    Graph = require('../dataflow/Graph'), 
    Node  = require('../dataflow/Node'),
    GroupBuilder = require('../scene/GroupBuilder'),
    changeset = require('../dataflow/changeset'),
    visit = require('../scene/visit');

function Model() {
  this._defs = {};
  this._predicates = {};
  this._scene = null;

  this._node = null;
  this._builder = null; // Top-level scenegraph builder

  this._reset = {axes: false, legends: false};

  Graph.prototype.init.call(this);
};

var proto = (Model.prototype = new Graph());

proto.defs = function(defs) {
  if (!arguments.length) return this._defs;
  this._defs = defs;
  return this;
};

proto.width = function(width) {
  if (this._defs) this._defs.width = width;
  if (this._defs && this._defs.marks) this._defs.marks.width = width;
  if (this._scene) this._scene.items[0].width = width;
  this._reset.axes = true;
  return this;
};

proto.height = function(height) {
  if (this._defs) this._defs.height = height;
  if (this._defs && this._defs.marks) this._defs.marks.height = height;
  if (this._scene) this._scene.items[0].height = height;
  this._reset.axes = true;
  return this;
};

proto.node = function() {
  return this._node || (this._node = new Node(this));
};

proto.data = function() {
  var data = Graph.prototype.data.apply(this, arguments);
  if(arguments.length > 1) {  // new Datasource
    this.node().addListener(data.pipeline()[0]);
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
  if(this._builder) this.node().removeListener(this._builder.disconnect());
  this._builder = new GroupBuilder(this, this._defs.marks, this._scene={});
  this.node().addListener(this._builder.connect());
  var p = this._builder.pipeline();
  p[p.length-1].addListener(renderer);
  return this;
};

proto.reset = function() {
  if (this._scene && this._reset.axes) {
    visit(this._scene, function(item) {
      if (item.axes) item.axes.forEach(function(axis) { axis.reset(); });
    });
    this._reset.axes = false;
  }
  if (this._scene && this._reset.legends) {
    visit(this._scene, function(item) {
      if (item.legends) item.legends.forEach(function(l) { l.reset(); });
    });
    this._reset.legends = false;
  }
  return this;
};

proto.addListener = function(l) { this.node().addListener(l); };
proto.removeListener = function(l) { this.node().removeListener(l); };

proto.fire = function(cs) {
  if(!cs) cs = changeset.create();
  this.propagate(cs, this.node());
};

module.exports = Model;
},{"../dataflow/Graph":33,"../dataflow/Node":34,"../dataflow/changeset":36,"../scene/GroupBuilder":75,"../scene/visit":81,"datalib":20}],30:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    dl = require('datalib'),
    Node = require('../dataflow/Node'),
    parseStreams = require('../parse/streams'),
    canvas = require('../render/canvas/index'),
    svg = require('../render/svg/index'),
    Encoder = require('../scene/Encoder'),
    Transition = require('../scene/Transition'),
    config = require('../util/config'),
    debug = require('../util/debug'),
    changeset = require('../dataflow/changeset');

var View = function(el, width, height, model) {
  this._el    = null;
  this._model = null;
  this._width = this.__width = width || 500;
  this._height  = this.__height = height || 300;
  this._bgcolor = null;
  this._autopad = 1;
  this._padding = {top:0, left:0, bottom:0, right:0};
  this._viewport = null;
  this._renderer = null;
  this._handler  = null;
  this._streamer = null; // Targeted update for streaming changes
  this._changeset = null;
  this._renderers = {canvas: canvas, svg: svg};
  this._io  = canvas;
  this._api = {}; // Stash streaming data API sandboxes.
};

var prototype = View.prototype;

prototype.model = function(model) {
  if (!arguments.length) return this._model;
  if (this._model !== model) {
    this._model = model;
    this._streamer = new Node(model);
    this._changeset = changeset.create();
    if (this._handler) this._handler.model(model);
  }
  return this;
};

// Sandboxed streaming data API
function streaming(src) {
  var view = this,
      ds = this._model.data(src),
      listener = ds.pipeline()[0],
      streamer = this._streamer,
      cs  = this._changeset,
      api = {};

  if(dl.keys(cs.signals).length > 0) {
    throw "New signal values are not reflected in the visualization." +
      " Please call view.update() before updating data values."
  }

  // If we have it stashed, don't create a new closure. 
  if(this._api[src]) return this._api[src];

  api.insert = function(vals) {
    ds.insert(dl.duplicate(vals));  // Don't pollute the environment
    streamer.addListener(listener);
    cs.data[ds.name()] = 1;
    return api;
  };

  api.update = function() {
    streamer.addListener(listener);
    cs.data[ds.name()] = 1;
    return (ds.update.apply(ds, arguments), api);
  };

  api.remove = function() {
    streamer.addListener(listener);
    cs.data[ds.name()] = 1;
    return (ds.remove.apply(ds, arguments), api);
  };

  api.values = function() { return ds.values() };    

  return (this._api[src] = api);
};

prototype.data = function(data) {
  var v = this;
  if(!arguments.length) return v._model.dataValues();
  else if(dl.isString(data)) return streaming.call(v, data);
  else if(dl.isObject(data)) {
    dl.keys(data).forEach(function(k) {
      var api = streaming.call(v, k);
      data[k](api);
    });
  }
  return this;
};

prototype.signal = function(name, value) {
  var m  = this._model,
      cs = this._changeset,
      streamer = this._streamer,
      setter = name; 

  if(!arguments.length) return m.signalValues();
  else if(arguments.length == 1 && dl.isString(name)) return m.signalValues(name);

  if(dl.keys(cs.data).length > 0) {
    throw "New data values are not reflected in the visualization." +
      " Please call view.update() before updating signal values."
  }

  if(arguments.length == 2) {
    setter = {};
    setter[name] = value;
  }

  dl.keys(setter).forEach(function(k) {
    streamer.addListener(m.signal(k).value(setter[k]));
    cs.signals[k] = 1;
    cs.reflow = true;
  });

  return this;
};

prototype.width = function(width) {
  if (!arguments.length) return this.__width;
  if (this.__width !== width) {
    this._width = this.__width = width;
    this.initialize();
    if (this._strict) this._autopad = 1;
  }
  return this;
};

prototype.height = function(height) {
  if (!arguments.length) return this.__height;
  if (this.__height !== height) {
    this._height = this.__height = height;
    this.initialize();
    if (this._strict) this._autopad = 1;
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
      if(this._handler) this._handler.padding(pad);
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

    this._model.width(this._width)
      .height(this._height).reset();

    this.initialize()
      .update({props:"enter"}).update({props:"update"});
  } else {
    this.padding(pad).update(opt);
  }
  return this;
};

prototype.viewport = function(size) {
  if (!arguments.length) return this._viewport;
  if (this._viewport !== size) {
    this._viewport = size;
    this.initialize();
  }
  return this;
};

prototype.renderer = function(type) {
  if (!arguments.length) return this._renderer;
  if (this._renderers[type]) type = this._renderers[type];
  else if (dl.isString(type)) throw new Error("Unknown renderer: " + type);
  else if (!type) throw new Error("No renderer specified");

  if (this._io !== type) {
    this._io = type;
    this._renderer = null;
    this.initialize();
    if (this._build) this.render();
  }
  return this;
};

prototype.initialize = function(el) {
  var v = this, prevHandler,
      w = v._width, h = v._height, pad = v._padding, bg = v._bgcolor;

  if (!arguments.length || el === null) {
    el = this._el ? this._el.parentNode : null;
    if(!el) return this;  // This View cannot init w/o an
  }
  
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
  } else {
    // Register event listeners for signal stream definitions.
    parseStreams(this);
  }
  
  return this;
};

function build() {
  var v = this;
  v._renderNode = new Node(v._model)
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

  return (v._model.scene(v._renderNode), true);  
}

prototype.update = function(opt) {    
  opt = opt || {};
  var v = this,
      trans = opt.duration
        ? new Transition(opt.duration, opt.ease)
        : null;

  var cs = v._changeset;
  if(trans) cs.trans = trans;
  if(opt.props !== undefined) {
    if(dl.keys(cs.data).length > 0) {
      throw "New data values are not reflected in the visualization." +
        " Please call view.update() before updating a specified property set."
    }

    cs.reflow  = true;
    cs.request = opt.props;
  }

  v._build = v._build || build.call(this);

  // If specific items are specified, short-circuit dataflow graph.
  // Else-If there are streaming updates, perform a targeted propagation.
  // Otherwise, reevaluate the entire model (datasources + scene).
  if(opt.items) { 
    Encoder.update(this._model, opt.trans, opt.props, opt.items);
    v._renderNode.evaluate(cs);
  } else if(v._streamer.listeners().length) {
    v._model.propagate(cs, v._streamer);
    v._streamer.disconnect();
  } else {
    v._model.fire(cs);
  }

  v._changeset = changeset.create();

  return v.autopad(opt);
};

prototype.render = function(items) {
  this._renderer.render(this._model.scene(), items);
  return this;
};

prototype.on = function() {
  this._handler.on.apply(this._handler, arguments);
  return this;
};

prototype.onSignal = function(name, handler) {
  this._model.signal(name).on(handler);
  return this;
};

prototype.off = function() {
  this._handler.off.apply(this._handler, arguments);
  return this;
};

prototype.offSignal = function(name, handler) {
  this._model.signal(name).off(handler);
  return this;
};

View.factory = function(model) {
  var HeadlessView = require('./HeadlessView');
  return function(opt) {
    opt = opt || {};
    var defs = model.defs();
    var v = (opt.el ? new View() : new HeadlessView())
      .model(model)
      .renderer(opt.renderer || "canvas")
      .width(defs.width)
      .height(defs.height)
      .background(defs.background)
      .padding(defs.padding);

    if(opt.el || (!opt.el && v instanceof HeadlessView)) v.initialize(opt.el);
    if(opt.data) v.data(opt.data);
  
    return v;
  };    
};

module.exports = View;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../dataflow/Node":34,"../dataflow/changeset":36,"../parse/streams":58,"../render/canvas/index":62,"../render/svg/index":70,"../scene/Encoder":74,"../scene/Transition":78,"../util/config":106,"../util/debug":108,"./HeadlessView":28,"datalib":20}],31:[function(require,module,exports){
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
},{"../util/constants":107,"../util/debug":108,"./Node":34,"./changeset":36}],32:[function(require,module,exports){
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

proto.insert = function(d) {
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
  if (data) { this.insert(data); }
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
  return this;
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
},{"../util/constants":107,"../util/debug":108,"./Collector":31,"./Node":34,"./changeset":36,"./tuple":37,"datalib":20}],33:[function(require,module,exports){
var dl = require('datalib'),
    Heap = require('heap'),
    Datasource = require('./Datasource'),
    Signal = require('./Signal'),
    changeset = require('./changeset'),
    debug = require('../util/debug'),
    C = require('../util/constants');

function Graph() {
}

var proto = Graph.prototype;

proto.init = function() {
  this._stamp = 0;
  this._rank  = 0;

  this._data = {};
  this._signals = {};

  this.doNotPropagate = {};
};

proto.data = function(name, pipeline, facet) {
  var db = this._data;
  if(!arguments.length) return dl.keys(db).map(function(d) { return db[d]; });
  if(arguments.length === 1) return db[name];
  return (db[name] = new Datasource(this, name, facet).pipeline(pipeline));
};

proto.dataValues = function(names) {
  var graph = this;
  if (!arguments.length) names = dl.keys(this._data);
  if (!dl.isArray(names)) return this._data[names].values();
  return names.reduce(function(db, n) {
    return (db[n] = graph._data[n].values(), db);
  }, {});
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

proto.signalValues = function(names) {
  var graph = this;
  if(!arguments.length) names = dl.keys(this._signals);
  if(!dl.isArray(names)) return this._signals[names].value();
  return names.reduce(function(sg, n) {
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
},{"../util/constants":107,"../util/debug":108,"./Datasource":32,"./Signal":35,"./changeset":36,"datalib":20,"heap":26}],34:[function(require,module,exports){
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
},{"../util/constants":107,"datalib":20}],35:[function(require,module,exports){
var Node = require('./Node'),
    changeset = require('./changeset');

function Signal(graph, name, init) {
  Node.prototype.init.call(this, graph);
  this._name  = name;
  this._value = init;
  this._handlers = [];
  return this;
};

var proto = (Signal.prototype = new Node());

proto.name = function() { return this._name; };

proto.value = function(val) {
  if(!arguments.length) return this._value;
  this._value = val;
  return this;
};

proto.evaluate = function(input) {
  return input.signals[this._name] ? input : this._graph.doNotPropagate;
};

proto.fire = function(cs) {
  if(!cs) cs = changeset.create(null, true);
  cs.signals[this._name] = 1;
  this._graph.propagate(cs, this);
};

proto.on = function(handler) {
  var sg = this,
      node = new Node(this._graph);

  node.evaluate = function(input) {
    return (handler(sg.name(), sg.value()), input);
  };

  this._handlers.push({ handler: handler, node: node });
  return this.addListener(node);
};

proto.off = function(handler) {
  var sg = this, h = this._handlers;
  for(var i=h.length; --i>=0;) {
    if(!handler || h[i].handler === handler) {
      sg.removeListener(h.splice(i, 1)[0].node);
    }
  }
  return this;
};

module.exports = Signal;
},{"./Node":34,"./changeset":36}],36:[function(require,module,exports){
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
  b.request = a ? a.request : null;
  REEVAL.forEach(function(d) { b[d] = a ? a[d] : {}; });
}

module.exports = {
  create: create,
  copy: copy,
  finalize: finalize,
};
},{"../util/constants":107}],37:[function(require,module,exports){
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

function has_prev(t) {
  return t._prev && t._prev !== C.SENTINEL;
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
  set_prev: set_prev,
  has_prev: has_prev,
  reset:  reset,
  idMap:  idMap
};
},{"../util/constants":107,"datalib":20}],38:[function(require,module,exports){
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
},{"./constants":39,"./functions":40,"datalib":20}],39:[function(require,module,exports){
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
},{}],40:[function(require,module,exports){
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
},{"datalib":20}],41:[function(require,module,exports){
var parser = require('./parser'),
    codegen = require('./codegen');
    
module.exports = {
  parse: function(input, opt) { return parser.parse("("+input+")", opt); },
  code: function(opt) { return codegen(opt); }
};

},{"./codegen":38,"./parser":42}],42:[function(require,module,exports){
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
},{}],43:[function(require,module,exports){
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

  // axis tick count
  axis.tickCount(def.ticks || config.axis.ticks);

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
},{"../scene/axis":79,"../util/config":106,"datalib":20}],44:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null);

module.exports = function parseBg(bg) {
  // return null if input is null or undefined
  if (bg == null) return null;
  // run through d3 rgb to sanity check
  return d3.rgb(bg) + "";  
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],45:[function(require,module,exports){
var dl = require('datalib'),
    config = require('../util/config'),
    parseTransforms = require('./transforms'),
    parseModify = require('./modify');

var parseData = function(model, spec, callback) {
  var count = 0;

  function loaded(d) {
    return function(error, data) {
      if (error) {
        dl.error("LOADING FAILED: " + d.url + " " + error);
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

},{"../util/config":106,"./modify":52,"./transforms":59,"datalib":20}],46:[function(require,module,exports){
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
},{}],47:[function(require,module,exports){
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
},{"../expression":41,"datalib":20}],48:[function(require,module,exports){
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
},{"../util/config":106,"../util/constants":107,"datalib":20}],49:[function(require,module,exports){
var lgnd = require('../scene/legend'),
    config = require('../util/config');

function legends(model, spec, legends, group) {
  (spec || []).forEach(function(def, index) {
    legends[index] = legends[index] || lgnd(model);
    legend(def, index, legends[index], group);
  });
};

function legend(def, index, legend, group) {
  // legend scales
  legend.size  (def.size   ? group.scale(def.size)   : null);
  legend.shape (def.shape  ? group.scale(def.shape)  : null);
  legend.fill  (def.fill   ? group.scale(def.fill)   : null);
  legend.stroke(def.stroke ? group.scale(def.stroke) : null);

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

module.exports = legends;
},{"../scene/legend":80,"../util/config":106}],50:[function(require,module,exports){
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
},{"./properties":55,"datalib":20}],51:[function(require,module,exports){
var parseMark = require('./mark');

module.exports = function(model, spec, width, height) {
  return {
    type: "group",
    width: width,
    height: height,
    scales: spec.scales || [],
    axes: spec.axes || [],
    legends: spec.legends || [],
    marks: (spec.marks || []).map(function(m) { return parseMark(model, m); })
  };
};
},{"./mark":50}],52:[function(require,module,exports){
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
  var signal = def.signal ? dl.field(def.signal) : null, 
      signalName = signal ? signal[0] : null,
      predicate = def.predicate ? model.predicate(def.predicate.name || def.predicate) : null,
      reeval = (predicate === null),
      node = new Node(model).router(def.type === C.CLEAR);

  node.evaluate = function(input) {
    if(predicate !== null) {  // TODO: predicate args
      var db = model.dataValues(predicate.data||[]);
      reeval = predicate.call(predicate, {}, db, model.signalValues(predicate.signals||[]), model._predicates);
    }

    debug(input, [def.type+"ing", reeval]);
    if(!reeval) return input;

    var datum = {}, 
        value = signal ? model.signalRef(def.signal) : null,
        d = model.data(ds.name),
        prev = d.revises() ? null : undefined,
        t = null;

    datum[def.field] = value;

    // We have to modify ds._data so that subsequent pulses contain
    // our dynamic data. W/o modifying ds._data, only the output
    // collector will contain dynamic tuples. 
    if(def.type === C.ADD) {
      t = tuple.ingest(datum, prev);
      input.add.push(t);
      d._data.push(t);
    } else if(def.type === C.REMOVE) {
      filter(def.field, value, input.add, input.rem);
      filter(def.field, value, input.mod, input.rem);
      d._data = d._data.filter(function(x) { return x[def.field] !== value });
    } else if(def.type === C.TOGGLE) {
      var add = [], rem = [];
      filter(def.field, value, input.rem, add);
      filter(def.field, value, input.add, rem);
      filter(def.field, value, input.mod, rem);
      if(add.length == 0 && rem.length == 0) add.push(tuple.ingest(datum));

      input.add.push.apply(input.add, add);
      d._data.push.apply(d._data, add);
      input.rem.push.apply(input.rem, rem);
      d._data = d._data.filter(function(x) { return rem.indexOf(x) === -1 });
    } else if(def.type === C.CLEAR) {
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
},{"../dataflow/Node":34,"../dataflow/tuple":37,"../util/constants":107,"../util/debug":108,"datalib":20}],53:[function(require,module,exports){
var dl = require('datalib');

module.exports = function parsePadding(pad) {
  if (pad == null) return "auto";
  else if (dl.isString(pad)) return pad==="strict" ? "strict" : "auto";
  else if (dl.isObject(pad)) return pad;
  var p = dl.isNumber(pad) ? pad : 20;
  return {top:p, left:p, right:p, bottom:p};
}
},{"datalib":20}],54:[function(require,module,exports){
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
        var ref  = o.predicate,
            predName = ref && (ref.name || ref),
            pred = model.predicate(predName),
            p = "predicates["+dl.str(predName)+"]";

        pred.signals.forEach(function(s) { signals[s] = 1; });
        pred.data.forEach(function(d) { db[d] = 1 });

        if(dl.isObject(ref)) {
          dl.keys(ref).forEach(function(k) {
            if(k === "name") return;
            var i = ref[k], signal;
            def += "args["+dl.str(k)+"] = ";
            if(i.signal)   def += parseSignal(i.signal, signals);
            else if(i.arg) def += "args["+dl.str(i.arg)+"]";
            def+=", ";
          });  
        } 

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
},{"datalib":20}],55:[function(require,module,exports){
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

  if (vars.xc) {
    if (vars.width) {
      code += "\n  this.tpl.set(o, 'x', (o.xc - o.width/2));";
    } else {
      code += "\n  this.tpl.set(o, 'x', o.xc);";
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

  if (vars.yc) {
    if (vars.height) {
      code += "\n  this.tpl.set(o, 'y', (o.yc - o.height/2));";
    } else {
      code += "\n  this.tpl.set(o, 'y', o.yc);";
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
    var def = r.predicate,
        predName = def && (def.name || def),
        pred = model.predicate(predName),
        p = "predicates["+dl.str(predName)+"]",
        input = [], args = name+"_arg"+i,
        ref;

    if(dl.isObject(def)) {
      dl.keys(def).forEach(function(k) {
        if(k === "name") return;
        var ref = valueRef(i, def[k]);
        input.push(dl.str(k)+": "+ref.val);
        if(ref.signals) signals.push.apply(signals, dl.array(ref.signals));
        if(ref.scales)  scales.push.apply(scales, dl.array(ref.scales));
      });
    }

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

  if (ref.template !== undefined) {
    val = dl.template.source(ref.template, "item.datum");
  }

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

},{"../dataflow/tuple":37,"../util/config":106,"datalib":20}],56:[function(require,module,exports){
var expr = require('./expr'),
    C = require('../util/constants');

function parseSignals(model, spec) {
  // process each signal definition
  (spec || []).forEach(function(s) {
    var signal = model.signal(s.name, s.init);

    if(s.init && s.init.expr) {
      s.init.expr = expr(s.init.expr);
      signal.value(exprVal(model, s.init));
    }

    if(s.expr) {
      s.expr = expr(s.expr);
      signal.evaluate = function(input) {
        var val = exprVal(model, s);
        if(val !== signal.value()) {
          signal.value(val);
          input.signals[s.name] = 1;
          return input;
        }
        return model.doNotPropagate;        
      };
      signal.dependency(C.SIGNALS, s.expr.signals);
      s.expr.signals.forEach(function(dep) { model.signal(dep).addListener(signal); });
    }
  });

  return spec;
};

function exprVal(model, spec) {
  var e = spec.expr,
      val = expr.eval(model, e.fn, null, null, null, null, e.signals);
  return spec.scale ? scale(model, spec, val) : val;
}

parseSignals.scale = function scale(model, spec, value) {
  var def = spec.scale,
      name  = def.name || def.signal || def,
      scope = def.scope ? model.signalRef(def.scope.signal) : null;

  if(!scope || !scope.scale) {
    scope = (scope && scope.mark) ? scope.mark.group : model.scene().items[0];
  }

  var scale = scope.scale(name);
  if(!scale) return value;
  return def.invert ? scale.invert(value) : scale(value);
}

module.exports = parseSignals;
},{"../util/constants":107,"./expr":47}],57:[function(require,module,exports){
var dl = require('datalib'),
    Model = require('../core/Model'), 
    View = require('../core/View'), 
    parseBg = require('../parse/background'),
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
      background: parseBg(spec.background),
      padding: parsePadding(spec.padding),
      signals: parseSignals(model, spec.signals),
      predicates: parsePredicates(model, spec.predicates),
      marks: parseMarks(model, spec, width, height),
      data: parseData(model, spec.data, function() { callback(viewFactory(model)); })
    });
  });
}

},{"../core/Model":29,"../core/View":30,"../parse/background":44,"../parse/data":45,"../parse/interactors":48,"../parse/marks":51,"../parse/padding":53,"../parse/predicates":54,"../parse/signals":56,"datalib":20}],58:[function(require,module,exports){
(function (global){
var dl = require('datalib'),
    d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    Node = require('../dataflow/Node'),
    parseSignals = require('./signals'),
    changset = require('../dataflow/changeset'),
    selector = require('./events'),
    expr = require('./expr'),
    C = require('../util/constants');

var START = "start", MIDDLE = "middle", END = "end";

module.exports = function(view) {
  var model = view.model(),
      spec  = model.defs().signals,
      register = {}, nodes = {};

  function signal(sig, selector, exp, spec) {
    var n = new Node(model);
    n.evaluate = function(input) {
      if(!input.signals[selector.signal]) return model.doNotPropagate;
      var val = expr.eval(model, exp.fn, null, null, null, null, exp.signals);
      if(spec.scale) val = parseSignals.scale(model, spec, val);

      if(val !== sig.value()) {
        sig.value(val);
        input.signals[sig.name()] = 1;
        input.reflow = true;        
      }

      return input;  
    };
    n.dependency(C.SIGNALS, selector.signal);
    n.addListener(sig);
    model.signal(selector.signal).addListener(n);
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

    nodes[selector.event] = nodes[selector.event] || new Node(model);
    nodes[selector.event].addListener(sig);
  };

  function orderedStream(sig, selector, exp, spec) {
    var name = sig.name(), 
        trueFn = expr("true"),
        s = {};

    s[START]  = model.signal(name + START,  false);
    s[MIDDLE] = model.signal(name + MIDDLE, false);
    s[END]    = model.signal(name + END,    false);

    var router = new Node(model);
    router.evaluate = function(input) {
      if(s[START].value() === true && s[END].value() === false) {
        // TODO: Expand selector syntax to allow start/end signals into stream.
        // Until then, prevent old middles entering stream on new start.
        if(input.signals[name+START]) return model.doNotPropagate;

        if(s[MIDDLE].value() !== sig.value()) {
          sig.value(s[MIDDLE].value());
          input.signals[name] = 1;
        }

        return input;
      }

      if(s[END].value() === true) {
        s[START].value(false);
        s[END].value(false);
      }

      return model.doNotPropagate;
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
    var signal = model.signal(sig.name);
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
          return !expr.eval(model, f.fn, d, evt, item, p, f.signals);
        });
        if(filtered) continue;
        
        val = expr.eval(model, h.exp.fn, d, evt, item, p, h.exp.signals); 
        if(h.spec.scale) val = parseSignals.scale(model, h.spec, val);

        if(val !== h.signal.value()) {
          h.signal.value(val);
          cs.signals[h.signal.name()] = 1;
        }
      }

      model.propagate(cs, node);
    });
  })
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../dataflow/Node":34,"../dataflow/changeset":36,"../util/constants":107,"./events":46,"./expr":47,"./signals":56,"datalib":20}],59:[function(require,module,exports){
var dl = require('datalib'),
    transforms = require('../transforms/index');

module.exports = function parseTransforms(model, def) {
  var tx = new transforms[def.type](model);
  
  // We want to rename output fields before setting any other properties,
  // as subsequent properties may require output to be set (e.g. group by).
  if(def.output) tx.output(def.output);

  dl.keys(def).forEach(function(k) {
    if(k === 'type' || k === 'output') return;
    if(k === 'transform' && def.type === 'facet') return;
    tx.param(k, def[k]);
  });

  return tx;
};
},{"../transforms/index":102,"datalib":20}],60:[function(require,module,exports){
(function (global){
var dl = require('datalib'),
    d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    marks = require('./marks');

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
  return dl.keys(h).reduce(function(a, k) {
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
  "mousewheel",
  "touchstart"
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

},{"./marks":63,"datalib":20}],61:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    dl = require('datalib'),
    Bounds = require('../../util/Bounds'),
    config = require('../../util/config'),
    marks = require('./marks');

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
      renderer = marks.draw[marktype];
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

  if (dl.isNode) {
    renderer._imgload += 1;
    image = new ((typeof window !== "undefined" ? window.canvas : typeof global !== "undefined" ? global.canvas : null).Image)();
    dl.load(dl.extend({url: uri}, config.load), function(err, data) {
      renderer._imgload -= 1;
      if (err) { dl.error(err); return; }
      dl.log("LOAD IMAGE: " + uri);
      image.src = data;
      image.loaded = true;
    });
  } else {
    image = new Image();
    url = dl.load.sanitizeUrl(dl.extend({url: uri}, config.load));
    if (!url) { return; }
    renderer._imgload += 1;
    image.onload = function() {
      dl.log("LOAD IMAGE: " + url);
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

},{"../../util/Bounds":103,"../../util/config":106,"./marks":63,"datalib":20}],62:[function(require,module,exports){
module.exports = {
  Handler:  require('./Handler'),
  Renderer: require('./Renderer')
};
},{"./Handler":60,"./Renderer":61}],63:[function(require,module,exports){
var Bounds = require('../../util/Bounds'),
    boundsCalc = require('../../util/boundscalc'),
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
        g.strokeStyle = color(g, o, stroke);
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

},{"../../util/Bounds":103,"../../util/boundscalc":105,"../../util/config":106,"./path":64}],64:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    Bounds = require('../../util/Bounds');

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

module.exports = {
  parse:  parse,
  render: render,
  bounds: bounds,
  area:   area,
  line:   line
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../util/Bounds":103}],65:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    dl = require('datalib'),
    config = require('../../util/config'),
    SVGBuilder = require('./svg');

var renderer = function() {
  this._builder = null;
};

var prototype = renderer.prototype;

prototype.initialize = function(el, width, height, pad) {
  this._builder = new SVGBuilder();
  return this.resize(width, height, pad);
}

prototype.resize = function(width, height, pad) {
  this._width = width;
  this._height = height;
  this._padding = pad || {top:0, left:0, bottom:0, right:0};
  this._autopad = dl.isString(this._padding) ? 1 : 0;

  var w = this._width, h = this._height, pad = this._padding;
  
  // (re-)configure builder size
  this._builder.initialize(null, w, h, pad);

  return this;
};

prototype.render = function(scene, items) {
  // headless always draws the entire scene, ignoring items
  this._builder.render(scene);
  return this;
};

prototype.svg = function() {
  return this._builder.svg();
};

module.exports = renderer;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../util/config":106,"./svg":67,"datalib":20}],66:[function(require,module,exports){
module.exports = {
  Renderer: require('./Renderer')
};

},{"./Renderer":65}],67:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    dl = require('datalib'),
    config = require('../../util/config');

var renderer = function() {
  this._gid = 0; // group id counter for d3 dom compat
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

prototype.initialize = function(el, w, h, pad) {
  var t = this._text;

  t.head = open('svg', {
    "class": 'marks',
    width: w + pad.left + pad.right,
    height: h + pad.top + pad.bottom,
  }, config.svgNamespace);

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
      dgrad = dl.keys(all.gradient),
      dclip = dl.keys(all.clipping),
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
  
  if (defs.length > 0) {
    return open("defs") + defs + close("defs");
  } else {
    return ""
  }
  return defs;
};

prototype.render = function(scene) {
  this._gid = 0; // reset the group counter
  this._text.body = this.draw(scene);
  this._text.defs = this.buildDefs();
};

prototype.draw = function(scene) {
  var meta = MARKS[scene.marktype];
  if (!meta) {
    return; // no known marktype (e.g., an interactor)
  }
  var tag  = meta[0],
      attr = meta[1],
      nest = meta[2] || false,
      data = nest ? [scene.items] : scene.items,
      defs = this._defs,
      svg = "", i, sty;

  var cls = cssClass(scene.def);

  // style literals to exactly match the d3 dom
  var styl = null;
  if (cls === 'type-rule' || cls === 'type-path')
    styl = 'style="pointer-events: none;"';
  else if (cls !== 'type-group')
    styl = 'style=""';

  svg += open('g', {
    'id': 'g' + ++this._gid, // d3 dom compat
    'class': cssClass(scene.def)
  }, styl);

  for (i=0; i<data.length; ++i) {
    var sty = tag === 'g' ? null : style(data[i], tag, defs);
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

  var styl = o.mark.interactive === false ?
    'style="pointer-events: none;"' : 
    'style=""';

  return open('rect', {
    'class': 'background'
  }, styl) + close('rect');
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
      url = config.load.baseURL + o.url;
  
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

var styleProps = dl.keys(styles);

function style(d, tag, defs) {
  var i, n, prop, name, value,
      o = d.mark ? d : d.length ? d[0] : null;
  if (o === null) return null;

  var s = "";

  if (tag === 'text') {
    s += 'font: ' + fontString(o) + ';';
  }
  
  for (i=0, n=styleProps.length; i<n; ++i) {
    prop = styleProps[i];
    name = styles[prop];
    value = o[prop];

    if (value == null) {
      if (name === "fill") s += 'fill: none;';
    } else {
      if (value.id) {
        // ensure definition is included
        defs.gradient[value.id] = value;
        value = "url(" + window.location.href + "#" + value.id + ")";
      }
      s += (s.length ? ' ' : '') + name + ': ' + value + ';'
    }
  }
  
  // not that we don't exclude blank styles for d3 dom compat
  return 'style="'+s+'"';
}

function fontString(o) {
  var f = (o.fontStyle ? o.fontStyle + " " : "")
    + (o.fontVariant ? o.fontVariant + " " : "")
    + (o.fontWeight ? o.fontWeight + " " : "")
    + (o.fontSize != null ? o.fontSize : config.render.fontSize) + "px "
    + (o.font && escape_font(o.font) || config.render.font);
  return f;
}

module.exports = renderer;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../util/config":106,"datalib":20}],68:[function(require,module,exports){
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
},{"datalib":20}],69:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    dl = require('datalib'),
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./marks":71,"datalib":20}],70:[function(require,module,exports){
arguments[4][62][0].apply(exports,arguments)
},{"./Handler":68,"./Renderer":69,"dup":62}],71:[function(require,module,exports){
(function (global){
var dl = require('datalib'),
    d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    config = require('../../util/config');

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
      url = dl.load.sanitizeUrl(dl.extend({url: o.url}, config.load));
  
  if (url) {
    this.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
  }

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

},{"../../util/config":106,"datalib":20}],72:[function(require,module,exports){
var dl = require('datalib'),
    Node = require('../dataflow/Node'),
    Encoder = require('./Encoder'),
    bounds = require('../util/boundscalc'),
    C = require('../util/constants'),
    debug = require('../util/debug');

function Bounder(graph, mark) {
  this._mark = mark;
  return Node.prototype.init.call(this, graph).router(true);
}

var proto = (Bounder.prototype = new Node());

proto.evaluate = function(input) {
  debug(input, ["bounds", this._mark.marktype]);
  var i, ilen, j, jlen, group, legend;
      hasLegends = this._mark.marktype == C.GROUP 
        && dl.array(this._mark.def.legends).length > 0;

  bounds.mark(this._mark, null, !hasLegends);

  if(hasLegends) {
    for(i=0, ilen=this._mark.items.length; i<ilen; ++i) {
      group = this._mark.items[i];
      group._legendPositions = null;
      for(j=0, jlen=group.legendItems.length; j<jlen; ++j) {
        legend = group.legendItems[j];
        Encoder.update(this._graph, input.trans, "vg_legendPosition", legend.items);
        bounds.mark(legend, null, true);
      }
    }

    bounds.mark(this._mark, null, true);
  }

  input.reflow = true;
  return input;
};

module.exports = Bounder;
},{"../dataflow/Node":34,"../util/boundscalc":105,"../util/constants":107,"../util/debug":108,"./Encoder":74,"datalib":20}],73:[function(require,module,exports){
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

proto.init = function(graph, def, mark, parent, parent_id, inheritFrom) {
  Node.prototype.init.call(this, graph)
    .router(true)
    .collector(true);

  this._def   = def;
  this._mark  = mark;
  this._from  = (def.from ? def.from.data : null) || inheritFrom;
  this._ds    = dl.isString(this._from) ? graph.data(this._from) : null;
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
  this._encoder = new Encoder(this._graph, this._mark);
  this._bounder = new Bounder(this._graph, this._mark);

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
    src = this._graph.data(this._from);
    name = ["vg", this._from, this._def.type, src.listeners(true).length].join("_");
    spec = {
      name: name,
      source: this._from,
      transform: from.transform,
      modify: from.modify
    };
  }

  this._from = name;
  this._ds = parseData.datasource(this._graph, spec);
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

  this._graph.connect(this.pipeline());
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
  this._graph.disconnect(this.pipeline());
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
},{"../dataflow/Node":34,"../dataflow/changeset":36,"../dataflow/tuple":37,"../parse/data":45,"../util/constants":107,"../util/debug":108,"./Bounder":72,"./Encoder":74,"./Item":76,"datalib":20}],74:[function(require,module,exports){
var dl = require('datalib'),
    Node = require('../dataflow/Node'),
    bounds = require('../util/boundscalc'),
    C = require('../util/constants'),
    debug = require('../util/debug'),
    EMPTY = {};

function Encoder(graph, mark) {
  var props = mark.def.properties || {},
      update = props.update;

  Node.prototype.init.call(this, graph)

  this._mark  = mark;

  if (update) {
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
      preds  = this._graph.predicates(),
      sg = graph.signalValues(),  // For expediency, get all signal values
      db = graph.dataValues(), 
      req = input.request,
      i, len, item, prop;

  if (req) {
    if (prop = props[req]) {
      for (i=0, len=input.mod.length; i<len; ++i) {
        item = input.mod[i];
        encode.call(this, prop, item, input.trans, db, sg, preds);
      }
    }

    return input; // exit early if given request
  }

  // Items marked for removal are at the head of items. Process them first.
  for (i=0, len=input.rem.length; i<len; ++i) {
    item = input.rem[i];
    if (update) encode.call(this, update, item, input.trans, db, sg, preds);
    if (exit)   encode.call(this, exit,   item, input.trans, db, sg, preds); 
    if (input.trans && !exit) input.trans.interpolate(item, EMPTY);
    else if (!input.trans) item.remove();
  }

  for (i=0, len=input.add.length; i<len; ++i) {
    item = input.add[i];
    if (enter)  encode.call(this, enter,  item, input.trans, db, sg, preds);
    if (update) encode.call(this, update, item, input.trans, db, sg, preds);
    item.status = C.UPDATE;
  }

  if (update) {
    for (i=0, len=input.mod.length; i<len; ++i) {
      item = input.mod[i];
      encode.call(this, update, item, input.trans, db, sg, preds);
    }
  }

  return input;
};

function encode(prop, item, trans, db, sg, preds) {
  var enc = prop.encode;
  enc.call(enc, item, item.mark.group||item, trans, db, sg, preds);
}

// If a specified property set called, or update property set 
// uses nested fieldrefs, reevaluate all items.
proto.reevaluate = function(pulse) {
  var props = this._mark.def.properties || {},
      update = props.update;

  return pulse.request || 
    Node.prototype.reevaluate.call(this, pulse) || 
    (update ? update.reflow : false);
};

// Short-circuit encoder if user specifies items
Encoder.update = function(graph, trans, request, items) {
  items = dl.array(items);
  var preds = graph.predicates(), 
      db = graph.dataValues(),
      sg = graph.signalValues(),
      i, len, item, props, prop;

  for (i=0, len=items.length; i<len; ++i) {
    item = items[i];
    props = item.mark.def.properties;
    prop = props && props[request];
    if (prop) {
      encode.call(null, prop, item, trans, db, sg, preds);
      bounds.item(item);
    }
  }

};

module.exports = Encoder;
},{"../dataflow/Node":34,"../util/boundscalc":105,"../util/constants":107,"../util/debug":108,"datalib":20}],75:[function(require,module,exports){
var dl = require('datalib'),
    Node = require('../dataflow/Node'),
    Collector = require('../dataflow/Collector'),
    Builder = require('./Builder'),
    Scale = require('./Scale'),
    parseAxes = require('../parse/axes'),
    parseLegends = require('../parse/legends'),
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

proto.init = function(graph, def, mark, parent, parent_id, inheritFrom) {
  var builder = this;

  this._scaler = new Node(graph);

  (def.scales||[]).forEach(function(s) { 
    s = builder.scale(s.name, new Scale(graph, s, builder));
    builder._scaler.addListener(s);  // Scales should be computed after group is encoded
  });

  this._recursor = new Node(graph);
  this._recursor.evaluate = recurse.bind(this);

  var scales = (def.axes||[]).reduce(function(acc, x) {
    return (acc[x.scale] = 1, acc);
  }, {});

  scales = (def.legends||[]).reduce(function(acc, x) {
    return (acc[x.size || x.shape || x.fill || x.stroke], acc);
  }, scales);

  this._recursor.dependency(C.SCALES, dl.keys(scales));

  // We only need a collector for up-propagation of bounds calculation,
  // so only GroupBuilders, and not regular Builders, have collectors.
  this._collector = new Collector(graph);

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

  for (; i<len; ++i) {
    child = children[i];
    if (child.type == C.MARK && child.builder._def.name == name) break;
  }

  return child.builder;
};

function recurse(input) {
  var builder = this,
      hasMarks = dl.array(this._def.marks).length > 0,
      hasAxes = dl.array(this._def.axes).length > 0,
      hasLegends = dl.array(this._def.legends).length > 0,
      i, len, group, pipeline, def, inline = false;

  for (i=0, len=input.add.length; i<len; ++i) {
    group = input.add[i];
    if (hasMarks) buildMarks.call(this, input, group);
    if (hasAxes)  buildAxes.call(this, input, group);
    if (hasLegends) buildLegends.call(this, input, group);
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
      inline = inline && (this._graph.data(c.from) !== undefined); 
      inline = inline && (pipeline[pipeline.length-1].listeners().length == 1); // Reactive geom
      c.inline = inline;

      if (inline) c.builder.evaluate(input);
      else this._recursor.addListener(c.builder);
    }
  }

  for (i=0, len=input.mod.length; i<len; ++i) {
    group = input.mod[i];
    // Remove temporary connection for marks that draw from a source
    if (hasMarks) {
      builder._children[group._id].forEach(function(c) {
        if (c.type == C.MARK && !c.inline && builder._graph.data(c.from) !== undefined ) {
          builder._recursor.removeListener(c.builder);
        }
      });
    }

    // Update axes data defs
    if (hasAxes) {
      parseAxes(builder._graph, builder._def.axes, group.axes, group);
      group.axes.forEach(function(a, i) { a.def() });
    }

    // Update legend data defs
    if (hasLegends) {
      parseLegends(builder._graph, builder._def.legends, group.legends, group);
      group.legends.forEach(function(l, i) { l.def() });
    }   
  }

  for (i=0, len=input.rem.length; i<len; ++i) {
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
  if (arguments.length === 2) return (group._scales[name] = scale, scale);
  while(scale == null) {
    scale = group._scales[name];
    group = group.mark ? group.mark.group : group._parent;
    if (!group) break;
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

  group.legends = group.legends || [];
  group.legendItems = group.legendItems || [];
}

function buildMarks(input, group) {
  debug(input, ["building marks", group._id]);
  var marks = this._def.marks,
      listeners = [],
      mark, from, inherit, i, len, m, b;

  for (i=0, len=marks.length; i<len; ++i) {
    mark = marks[i];
    from = mark.from || {};
    inherit = "vg_"+group.datum._id;
    group.items[i] = {group: group};
    b = (mark.type === C.GROUP) ? new GroupBuilder() : new Builder();
    b.init(this._graph, mark, group.items[i], this, group._id, inherit);
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

  parseAxes(this._graph, this._def.axes, axes, group);
  axes.forEach(function(a, i) {
    var scale = builder._def.axes[i].scale,
        def = a.def(),
        b = null;

    axisItems[i] = {group: group, axisDef: def};
    b = (def.type === C.GROUP) ? new GroupBuilder() : new Builder();
    b.init(builder._graph, def, axisItems[i], builder)
      .dependency(C.SCALES, scale);
    builder._children[group._id].push({ builder: b, type: C.AXIS, scale: scale });
  });
}

function buildLegends(input, group) {
  var legends = group.legends,
      legendItems = group.legendItems,
      builder = this;

  parseLegends(this._graph, this._def.legends, legends, group);
  legends.forEach(function(l, i) {
    var scale = l.size() || l.shape() || l.fill() || l.stroke(),
        def = l.def(),
        b = null;

    legendItems[i] = {group: group, legendDef: def};
    b = (def.type === C.GROUP) ? new GroupBuilder() : new Builder();
    b.init(builder._graph, def, legendItems[i], builder)
      .dependency(C.SCALES, scale);
    builder._children[group._id].push({ builder: b, type: C.LEGEND, scale: scale });
  });
}

module.exports = GroupBuilder;
},{"../dataflow/Collector":31,"../dataflow/Node":34,"../parse/axes":43,"../parse/legends":49,"../util/constants":107,"../util/debug":108,"./Builder":73,"./Scale":77,"datalib":20}],76:[function(require,module,exports){
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
},{}],77:[function(require,module,exports){
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

function Scale(graph, def, parent) {
  this._def     = def;
  this._parent  = parent;
  this._updated = false;
  return Node.prototype.init.call(this, graph);
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
    for (var i=0, len=deps.length; i<len; ++i) {
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
      dataDrivenRange = false,
      pad = def.padding || 0,
      outer = def.outerPadding == null ? pad : def.outerPadding,
      domain, sort, str, refs;
  
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

  // width-defined range
  if (def.bandWidth) {
    var bw = def.bandWidth,
        len = domain.length,
        start = rng[0] || 0,
        space = def.points ? (pad*bw) : (pad*bw*(len-1) + 2*outer);
    rng = [start, start + (bw * len + space)];
  }

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

function isUniques(scale) { 
  return scale.type === C.ORDINAL || scale.type === C.QUANTILE; 
}

function getRefs(def) { 
  return def.fields || dl.array(def);
}

function getFields(ref, group) {
  return dl.array(ref.field).map(function(f) {
    if (f.parent) return dl.accessor(f.parent)(group.datum)
    return f; // String or {"signal"}
  });
}

// Scale datarefs can be computed over multiple schema types. 
// This function determines the type of aggregator created, and
// what data is sent to it: values, tuples, or multi-tuples that must
// be standardized into a consistent schema. 
function aggrType(def, scale) {
  var refs = getRefs(def);

  // If we're operating over only a single domain, send full tuples
  // through for efficiency (fewer accessor creations/calls)
  if (refs.length == 1 && dl.array(refs[0].field).length == 1) {
    return Aggregate.TYPES.TUPLE;
  }

  // With quantitative scales, we only care about min/max.
  if (!isUniques(scale)) return Aggregate.TYPES.VALUE;

  // If we don't sort, then we can send values directly to aggrs as well
  if (!def.sort) return Aggregate.TYPES.VALUE;

  return Aggregate.TYPES.MULTI;
}

function getCache(which, def, scale, group) {
  var refs = getRefs(def),
      atype = aggrType(def, scale),
      uniques = isUniques(scale),
      sort = def.sort,
      ck = "_"+which,
      fields = getFields(refs[0], group),
      i, rlen, j, flen, ref, field;

  if (scale[ck]) return scale[ck];

  var cache = scale[ck] = new Aggregate(this._graph).type(atype),
      groupby, summarize;

  if (uniques) {
    if (atype === Aggregate.TYPES.VALUE) {
      groupby = [{ name: C.GROUPBY, get: dl.identity }];
      summarize = {"*": C.COUNT};
    } else if (atype === Aggregate.TYPES.TUPLE) {
      groupby = [{ name: C.GROUPBY, get: dl.$(fields[0]) }];
      summarize = sort ? [{
        name: C.VALUE,
        get:  dl.$(ref.sort || sort.field),
        ops: [sort.stat]
      }] : {"*": C.COUNT};
    } else {  // atype === Aggregate.TYPES.MULTI
      groupby   = C.GROUPBY;
      summarize = [{ name: C.VALUE, ops: [sort.stat] }]; 
    }
  } else {
    groupby = [];
    summarize = [{
      name: C.VALUE,
      get: (atype == Aggregate.TYPES.TUPLE) ? dl.$(fields[0]) : dl.identity,
      ops: [C.MIN, C.MAX],
      as:  [C.MIN, C.MAX]
    }];
  }

  cache.param("groupby", groupby)
    .param("summarize", summarize);

  return cache;
}

function dataRef(which, def, scale, group) {
  if (def == null) { return []; }
  if (dl.isArray(def)) return def.map(signal.bind(this));

  var self = this, graph = this._graph,
      refs = getRefs(def),
      atype = aggrType(def, scale),
      cache = getCache.apply(this, arguments),
      sort  = def.sort,
      uniques = isUniques(scale),
      i, rlen, j, flen, ref, fields, field;

  for (i=0, rlen=refs.length; i<rlen; ++i) {
    ref = refs[i];
    from = ref.data || "vg_"+group.datum._id;
    data = graph.data(from)
      .revises(true)
      .last();

    if (data.stamp <= this._stamp) continue;

    fields = getFields(ref, group);
    for (j=0, flen=fields.length; j<flen; ++j) {
      field = fields[j];

      if (atype === Aggregate.TYPES.VALUE) {
        cache.accessors(null, field);
      } else if (atype === Aggregate.TYPES.MULTI) {
        cache.accessors(field, ref.sort || sort.field);
      } // Else (Tuple-case) is handled by the aggregator accessors by default

      cache.evaluate(data);
    }

    this.dependency(C.DATA, from);
    cache.dependency(C.SIGNALS).forEach(function(s) { self.dependency(C.SIGNALS, s) });
  }

  data = cache.aggr().result();
  if (uniques) {
    if (sort) {
      sort = sort.order.signal ? graph.signalRef(sort.order.signal) : sort.order;
      sort = (sort == C.DESC ? "-" : "+") + C.VALUE;
      sort = dl.comparator(sort);
      data = data.sort(sort);
    // } else {  // "First seen" order
    //   sort = dl.comparator("tpl._id");
    }

    return data.map(function(d) { return d[C.GROUPBY]; });
  } else {
    data = data[0];
    return !dl.isValid(data) ? [] : [data[C.MIN], data[C.MAX]];
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
      rng = dl.duplicate(def.range).map(signal.bind(this));
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

},{"../dataflow/Node":34,"../dataflow/changeset":36,"../transforms/Aggregate":82,"../util/config":106,"../util/constants":107,"../util/debug":108,"datalib":20}],78:[function(require,module,exports){
var tuple = require('../dataflow/tuple'),
    boundsCalc = require('../util/boundscalc'),
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
    boundsCalc.item(item);

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
},{"../dataflow/tuple":37,"../util/boundscalc":105,"../util/constants":107}],79:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    dl = require('datalib'),
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
      tickSubdivide = 0,
      tickCount = config.axis.ticks,
      gridLineStyle = {},
      tickLabelStyle = {},
      majorTickStyle = {},
      minorTickStyle = {},
      titleStyle = {},
      domainStyle = {},
      m = { // Axis marks as references for updates
        gridLines:  {},
        majorTicks: {},
        minorTicks: {},
        tickLabels: {},
        domain: {},
        title:  {}
      };

  var axis = {};

  function reset() {
    axisDef.type = null;
  }

  function ingest(d) { return {data: d}; };

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
      .map(ingest);
  
    ticks.major = ticks.major.map(function(d) {
      return (d = ingest(d), d.label = fmt(d.data), d);
    });
    
    return ticks;
  }

  axis.def = function() {
    if (!axisDef.type) axis_def(scale);

    var fmt = buildTickFormat();
    var ticks = buildTicks(fmt);
    var tdata = title ? [title].map(ingest) : [];

    axisDef.marks[0].from = function() { return grid ? ticks.major : []; };
    axisDef.marks[1].from = function() { return ticks.major; };
    axisDef.marks[2].from = function() { return ticks.minor; };
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
    dl.extend(m.gridLines, vg_axisTicks());
    dl.extend(m.majorTicks, vg_axisTicks());
    dl.extend(m.minorTicks, vg_axisTicks());
    dl.extend(m.tickLabels, vg_axisTickLabels());
    dl.extend(m.domain, vg_axisDomain());
    dl.extend(m.title, vg_axisTitle());
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

  if (dl.isArray(offset)) {
    var ofx = offset[0],
        ofy = offset[1];

    switch (orient) {
      case "left":   { tpl.set(o, 'x', -ofx); tpl.set(o, 'y', ofy); break; }
      case "right":  { tpl.set(o, 'x', width + ofx); tpl.set(o, 'y', ofy); break; }
      case "bottom": { tpl.set(o, 'x', ofx); tpl.set(o, 'y', height + ofy); break; }
      case "top":    { tpl.set(o, 'x', ofx); tpl.set(o, 'y', -ofy); break; }
      default:       { tpl.set(o, 'x', ofx); tpl.set(o, 'y', ofy); }
    }
  } else {
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../dataflow/tuple":37,"../parse/mark":50,"../util/config":106,"datalib":20}],80:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    dl = require('datalib'),
    parseProperties = require('../parse/properties'),
    parseMark = require('../parse/mark'),
    Gradient = require('../util/Gradient'),
    config = require('../util/config');

function lgnd(model) {
  var size = null,
      shape = null,
      fill = null,
      stroke = null,
      spacing = null,
      values = null,
      format = null,
      formatString = null,
      title = undefined,
      orient = "right",
      offset = config.legend.offset,
      padding = config.legend.padding,
      legendDef,
      tickArguments = [5],
      legendStyle = {},
      symbolStyle = {},
      gradientStyle = {},
      titleStyle = {},
      labelStyle = {},
      m = { // Legend marks as references for updates
        titles:  {},
        symbols: {},
        labels:  {},
        gradient: {}
      };

  var legend = {},
      legendDef = {};

  function reset() { legendDef.type = null; }
  function ingest(d, i) { return {data: d, index: i} }

  legend.def = function() {
    var scale = size || shape || fill || stroke;
    
    format = !formatString ? null : ((scale.type === 'time')
      ? d3.time.format(formatString)
      : d3.format(formatString));
    
    if (!legendDef.type) {
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
      : values).map(ingest);
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
      offset = Math.round(Math.sqrt(config.legend.symbolSize));
      range = spacing
        || (fs = labelStyle.fontSize) && (fs.value + pad)
        || (config.legend.labelFontSize + pad);
      range = domain.map(function(d,i) {
        return Math.round(offset/2 + i*range);
      });
    }

    // account for padding and title size
    var sz = padding, ts;
    if (title) {
      ts = titleStyle.fontSize;
      sz += 5 + ((ts && ts.value) || config.legend.titleFontSize);
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
    var tdata = (title ? [title] : []).map(ingest);
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
    var titles  = dl.extend(m.titles, vg_legendTitle()),
        symbols = dl.extend(m.symbols, vg_legendSymbols()),
        labels  = dl.extend(m.labels, vg_vLegendLabels());

    // extend legend marks
    vg_legendSymbolExtend(symbols, size, shape, fill, stroke);
    
    // add / override custom style properties
    dl.extend(titles.properties.update,  titleStyle);
    dl.extend(symbols.properties.update, symbolStyle);
    dl.extend(labels.properties.update,  labelStyle);

    // padding from legend border
    titles.properties.enter.x.value += padding;
    titles.properties.enter.y.value += padding;
    labels.properties.enter.x.offset += padding + 1;
    symbols.properties.enter.x.offset = padding + 1;
    labels.properties.update.x.offset += padding + 1;
    symbols.properties.update.x.offset = padding + 1;

    dl.extend(legendDef, {
      type: "group",
      interactive: false,
      properties: {
        enter: parseProperties(model, "group", legendStyle),
        vg_legendPosition: {
          encode: vg_legendPosition,
          signals: [], scales:[], data: [], fields: []
        }
      }
    });

    legendDef.marks = [titles, symbols, labels].map(function(m) { return parseMark(model, m); });
    return legendDef;
  }

  function quantDef(scale) {
    var def = q_legend_def(scale),
        dom = scale.domain(),
        data = dom.map(ingest),
        width = (gradientStyle.width && gradientStyle.width.value) || config.legend.gradientWidth,
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
    var tdata = (title ? [title] : []).map(ingest);
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
    var titles = dl.extend(m.title, vg_legendTitle()),
        gradient = dl.extend(m.gradient, vg_legendGradient()),
        labels = dl.extend(m.labels, vg_hLegendLabels()),
        grad = new Gradient();

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
    dl.extend(titles.properties.update, titleStyle);
    dl.extend(gradient.properties.update, gradientStyle);
    dl.extend(labels.properties.update, labelStyle);

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

    dl.extend(legendDef, {
      type: "group",
      interactive: false,
      properties: {
        enter: parseProperties(model, "group", legendStyle),
        vg_legendPosition: {
          encode: vg_legendPosition,
          signals: [], scales: [], data: [], fields: []
        }
      }
    });

    legendDef.marks = [titles, gradient, labels].map(function(m) { return parseMark(model, m); });
    return legendDef;
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
    orient = x in vg_legendOrients ? x + "" : config.legend.orient;
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

function vg_legendPosition(item, group, trans, db, signals, predicates) {
  var o = trans ? {} : item, gx,
      offset = item.mark.def.offset,
      orient = item.mark.def.orient,
      pad    = item.mark.def.padding * 2,
      lw     = ~~item.bounds.width() + (item.width ? 0 : pad),
      lh     = ~~item.bounds.height() + (item.height ? 0 : pad),
      pos = group._legendPositions || 
        (group._legendPositions = {right: 0.5, left: 0.5});

  o.x = 0.5;
  o.width = lw;
  o.y = pos[orient];
  pos[orient] += (o.height = lh);

  // HACK: use to estimate group bounds during animated transition
  if (!trans && group.bounds) {
    group.bounds.delta = group.bounds.x2 - group.width;
  }

  switch (orient) {
    case "left":  {
      gx = group.bounds ? group.bounds.x1 : 0;
      o.x += gx - offset - lw;
      break;
    };
    case "right": {
      gx = group.width;
      if (group.bounds) gx = trans
        ? group.width + group.bounds.delta
        : group.bounds.x2;
      o.x += gx + offset;
      break;
    };
  }
  
  if (trans) trans.interpolate(item, o);
  var enc = item.mark.def.properties.enter.encode;
  enc.call(enc, item, group, trans);
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
  var cfg = config.legend;
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
  var cfg = config.legend;
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
  var cfg = config.legend;
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
  var cfg = config.legend;
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
  var cfg = config.legend;
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
}

module.exports = lgnd;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../parse/mark":50,"../parse/properties":55,"../util/Gradient":104,"../util/config":106,"datalib":20}],81:[function(require,module,exports){
module.exports = function visit(node, func) {
  var i, n, s, m, items;
  if (func(node)) return true;

  var sets = ["items", "axisItems", "legendItems"];
  for (s=0, m=sets.length; s<m; ++s) {
    if (items = node[sets[s]]) {
      for (i=0, n=items.length; i<n; ++i) {
        if (visit(items[i], func)) return true;
      }
    }
  }
};
},{}],82:[function(require,module,exports){
var dl = require('datalib'),
    Transform = require('./Transform'),
    Facetor = require('./Facetor'),
    tuple = require('../dataflow/tuple'), 
    changeset = require('../dataflow/changeset'), 
    debug = require('../util/debug'),
    C = require('../util/constants');

function Aggregate(graph) {
  Transform.prototype.init.call(this, graph)
    .router(true).revises(true);

  Transform.addParameters(this, {
    groupby: {type: "array<field>"},

    summarize: {
      type: "custom", 
      set: function(summarize) {
        var i, len, f, fields, name, ops, signals = {};
        if(!dl.isArray(fields = summarize)) { // Object syntax from dl
          fields = [];
          for (name in summarize) {
            ops = dl.array(summarize[name]);
            fields.push({name: name, ops: ops});
          }
        }

        for(i=0, len=fields.length; i<len; ++i) {
          f = fields[i];
          if(f.name.signal) signals[f.name.signal] = 1;
          dl.array(f.ops).forEach(function(o){ if(o.signal) signals[o.signal] = 1 });
        }

        this._transform._fieldsDef = fields;
        this._transform._aggr = null;
        this._transform.dependency(C.SIGNALS, dl.keys(signals));
        return this._transform;
      }
    }
  });

  this._fieldsDef = [];
  this._aggr = null;  // dl.Aggregator

  this._type = TYPES.TUPLE; 
  this._acc = {groupby: dl.true, value: dl.true}
  this._cache = {};     // And cache them as aggregators expect original tuples.

  // Aggregator needs a full instantiation of the previous tuple. 
  // Cache them to reduce creation costs
  this._prev = {}; 

  return this;
}

var proto = (Aggregate.prototype = new Transform());

var TYPES = Aggregate.TYPES = {
  VALUE: 1, 
  TUPLE: 2, 
  MULTI: 3
};

proto.type = function(type) { 
  return (this._type = type, this); 
};

proto.accessors = function(groupby, value) {
  var acc = this._acc;
  acc.groupby = dl.$(groupby) || dl.true;
  acc.value = dl.$(value) || dl.true;
};

function standardize(x) {
  var acc = this._acc;
  if(this._type === TYPES.TUPLE) {
    return x;
  } else if(this._type === TYPES.VALUE) {
    return acc.value(x);
  } else {
    return this._cache[x._id] || (this._cache[x._id] = {
      _id: x._id,
      groupby: acc.groupby(x),
      value: acc.value(x)
    });
  }
}

proto.aggr = function() {
  if(this._aggr) return this._aggr;

  var graph = this._graph,
      groupby = this.param("groupby").field;

  var fields = this._fieldsDef.map(function(field) {
    var f  = dl.duplicate(field);
    if(field.get) f.get = field.get;

    f.name = f.name.signal ? graph.signalRef(f.name.signal) : f.name;
    f.ops  = f.ops.signal ? graph.signalRef(f.ops.signal) : dl.array(f.ops).map(function(o) {
      return o.signal ? graph.signalRef(o.signal) : o;
    });

    return f;
  });

  var aggr = this._aggr = new Facetor()
    .groupby(groupby)
    .stream(true)
    .summarize(fields);

  if(this._type !== TYPES.VALUE) aggr.key("_id");
  return aggr;
};

proto._reset = function(input, output) {
  output.rem.push.apply(output.rem, this.aggr().result());
  this.aggr().clear();
  this._aggr = null;
};

function spoof_prev(x) {
  var prev = this._prev[x._id] || (this._prev[x._id] = Object.create(x));
  return dl.extend(prev, x._prev);
}

proto.transform = function(input, reset) {
  debug(input, ["aggregate"]);

  var output = changeset.create(input);
  if(reset) this._reset(input, output);

  var t = this,
      tpl  = this._type === TYPES.TUPLE, // reduce calls to standardize
      aggr = this.aggr();

  input.add.forEach(function(x) {
    aggr._add(tpl ? x : standardize.call(t, x));
  });

  input.mod.forEach(function(x) {
    if(reset) {
      aggr._add(tpl ? x : standardize.call(t, x));  // Signal change triggered reflow
    } else if(tuple.has_prev(x)) {
      var prev = spoof_prev.call(t, x);
      aggr._mod(tpl ? x : standardize.call(t, x), 
        tpl ? prev : standardize.call(t, prev));
    }
  });

  input.rem.forEach(function(x) {
    var y = tuple.has_prev(x) ? spoof_prev.call(t, x) : x;
    aggr._rem(tpl ? y : standardize.call(t, y));
    t._cache[x._id] = t._prev[x._id] = null;
  });

  return aggr.changes(input, output);
}

module.exports = Aggregate;
},{"../dataflow/changeset":36,"../dataflow/tuple":37,"../util/constants":107,"../util/debug":108,"./Facetor":87,"./Transform":99,"datalib":20}],83:[function(require,module,exports){
var Transform = require('./Transform'),
    Collector = require('../dataflow/Collector');

function BatchTransform() {
}

var proto = (BatchTransform.prototype = new Transform());

proto.init = function(graph) {
  Transform.prototype.init.call(this, graph);
  this._collector = new Collector(graph);
  return this;
};

proto.transform = function(input) {
  // Materialize the current datasource.
  // TODO: efficiently share collectors
  this._collector.evaluate(input);
  var data = this._collector.data();
  return this.batchTransform(input, data);
};

proto.batchTransform = function(input, data) {
};

module.exports = BatchTransform;

},{"../dataflow/Collector":31,"./Transform":99}],84:[function(require,module,exports){
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
      
  var b = dl.bins({
    min: this.param("min"),
    max: this.param("max"),
    step: this.param("step"),
    maxbins: this.param("maxbins")
  });

  function update(d) {
    var v = transform.param("field").accessor(d);
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

},{"../dataflow/tuple":37,"./Transform":99,"datalib":20}],85:[function(require,module,exports){
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

  var w = this.param("with"),
      diag = this.param("diagonal"),
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
},{"../dataflow/Collector":31,"../dataflow/changeset":36,"../dataflow/tuple":37,"../util/debug":108,"./Transform":99}],86:[function(require,module,exports){
var Transform = require('./Transform'),
    Aggregate = require('./Aggregate');

function Facet(graph) {
  Transform.addParameters(this, {
    transform: {
      type: "custom",
      set: function(pipeline) {
        return (this._transform._pipeline = pipeline, this._transform);
      },
      get: function() {
        var parse = require('../parse/transforms'),
            facet = this._transform;
        return facet._pipeline.map(function(t) { return parse(facet._graph, t) });
      }      
    }
  });

  this._pipeline = [];
  return Aggregate.call(this, graph);
}

var proto = (Facet.prototype = Object.create(Aggregate.prototype));

proto.aggr = function() {
  return Aggregate.prototype.aggr.call(this).facet(this);
};

module.exports = Facet;
},{"../parse/transforms":59,"./Aggregate":82,"./Transform":99}],87:[function(require,module,exports){
var dl = require('datalib'),
    tuple = require('../dataflow/tuple'),
    changeset = require('../dataflow/changeset'),
    debug = require('../util/debug'),
    C = require('../util/constants');

function Facetor() {
  Aggregator.constructor.call(this);
  this._facet = null;
}

var Aggregator = dl.groupby();
var proto = (Facetor.prototype = Object.create(Aggregator));

proto.facet = function(f) {
  if (!arguments.length) return this._facet;
  return (this._facet = f, this);
};

proto._ingest = function(t) { 
  return tuple.ingest(t, null) 
};

proto._assign = tuple.set;

function disconnect_cell(facet) {
  debug({}, ["deleting cell", this.tuple._id]);
  var pipeline = this.ds.pipeline();
  facet.removeListener(pipeline[0]);
  facet._graph.disconnect(pipeline);
}

proto._newcell = function(x) {
  var cell  = Aggregator._newcell.call(this, x),
      facet = this._facet,
      tuple = cell.tuple,
      graph, pipeline;

  if (this._facet !== null) {
    graph = facet._graph;
    pipeline = facet.param("transform");
    cell.ds  = graph.data("vg_"+tuple._id, pipeline, tuple);
    cell.delete = disconnect_cell;
    facet.addListener(pipeline[0]);
  }

  return cell;
};

proto._newtuple = function(x) {
  var t = Aggregator._newtuple.call(this, x);
  if (this._facet !== null) {
    tuple.set(t, "key", this._cellkey(x));
  }
  return t;
};

proto.clear = function() {
  if (this._facet !== null) for (var k in this._cells) {
    this._cells[k].delete(this._facet);
  }
  return Aggregator.clear.call(this);
};

proto._add = function(x) {
  var cell = this._cell(x);
  Aggregator._add.call(this, x);
  if (this._facet !== null) cell.ds._input.add.push(x);
};

proto._mod = function(x, prev) {
  var cell0 = this._cell(prev),
      cell1 = this._cell(x);

  Aggregator._mod.call(this, x, prev);
  if (this._facet !== null) {  // Propagate tuples
    if (cell0 === cell1) {
      cell0.ds._input.mod.push(x);
    } else {
      cell0.ds._input.rem.push(x);
      cell1.ds._input.add.push(x);
    }
  }
};

proto._rem = function(x) {
  var cell = this._cell(x);
  Aggregator._rem.call(this, x);
  if (this._facet !== null) cell.ds._input.rem.push(x);  
};

proto.changes = function(input, output) {
  var aggr = this._aggr,
      cell, flag, i, k;

  for (k in this._cells) {
    cell = this._cells[k];
    flag = cell.flag;

    // consolidate collector values
    if (cell.collect) {
      cell.data.values();
    }

    // update tuple properties
    for (i=0; i<aggr.length; ++i) {
      cell.aggs[aggr[i].name].set();
    }

    // organize output tuples
    if (cell.num <= 0) {
      if (flag === C.MOD_CELL) {
        output.rem.push(cell.tuple);
      }
      if (this._facet !== null) cell.delete(this._facet);
      delete this._cells[k];
    } else {
      if (this._facet !== null) {
        // propagate sort, signals, fields, etc.
        changeset.copy(input, cell.ds._input);
      }

      if (flag & C.ADD_CELL) {
        output.add.push(cell.tuple);
      } else if (flag & C.MOD_CELL) {
        output.mod.push(cell.tuple);
      }
    }

    cell.flag = 0;
  }

  this._rems = false;
  return output;
};

module.exports = Facetor;
},{"../dataflow/changeset":36,"../dataflow/tuple":37,"../util/constants":107,"../util/debug":108,"datalib":20}],88:[function(require,module,exports){
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
  return expr.eval(this._graph, this.param("test"), 
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
},{"../dataflow/changeset":36,"../parse/expr":47,"../util/constants":107,"../util/debug":108,"./Transform":99}],89:[function(require,module,exports){
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
      on = this.param('fields'),
      output = changeset.create(input);

  if(reset) rst.call(this, input, output);

  fn.call(this, input.add, on.field, on.accessor, output.add, input.stamp);
  fn.call(this, input.mod, on.field, on.accessor, reset ? output.add : output.mod, input.stamp);
  input.rem.forEach(function(x) {
    output.rem.push.apply(output.rem, fold._cache[x._id]);
    fold._cache[x._id] = null;
  });

  // If we're only propagating values, don't mark key/value as updated.
  if(input.add.length || input.rem.length || 
    on.field.some(function(f) { return !!input.fields[f]; }))
      output.fields[this._output.key] = 1, output.fields[this._output.value] = 1;
  return output;
};

module.exports = Fold;
},{"../dataflow/changeset":36,"../dataflow/tuple":37,"../util/debug":108,"./Transform":99}],90:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    Transform = require('./Transform'),
    tuple = require('../dataflow/tuple');

function Force(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    size: {type: "array<value>", default: [500, 500]},
    links: {type: "data"},
    linkDistance: {type: "field|value", default: 20},
    linkStrength: {type: "field|value", default: 1},
    charge: {type: "field|value", default: 30},
    chargeDistance: {type: "field|value", default: Infinity},
    iterations: {type: "value", default: 500},
    friction: {type: "value", default: 0.9},
    theta: {type: "value", default: 0.8},
    gravity: {type: "value", default: 0.1},
    alpha: {type: "value", default: 0.1}
  });

  this._nodes  = [];
  this._links = [];
  this._layout = d3.layout.force();

  this._output = {
    "x": "layout_x",
    "y": "layout_y",
    "source": "_source",
    "target": "_target"
  };

  return this;
}

var proto = (Force.prototype = new Transform());

proto.transform = function(nodeInput) {
  // get variables
  var linkInput = this.param("links").source.last(),
      layout = this._layout,
      output = this._output,
      nodes = this._nodes,
      links = this._links,
      iter = this.param("iterations");

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
    .size(this.param("size"))
    .linkDistance(this.param("linkDistance"))
    .linkStrength(this.param("linkStrength"))
    .charge(this.param("charge"))
    .chargeDistance(this.param("chargeDistance"))
    .friction(this.param("friction"))
    .theta(this.param("theta"))
    .gravity(this.param("gravity"))
    .alpha(this.param("alpha"))
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

},{"../dataflow/tuple":37,"./Transform":99}],91:[function(require,module,exports){
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
      field = this.param("field"),
      expr = this.param("expr"),
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
},{"../dataflow/tuple":37,"../parse/expr":47,"../util/constants":107,"../util/debug":108,"./Transform":99}],92:[function(require,module,exports){
(function (global){
var dl = require('datalib'),
    d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    Transform = require('./Transform'),
    tuple = require('../dataflow/tuple');

function Geo(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, Geo.Parameters);
  Transform.addParameters(this, {
    lon: {type: "field"},
    lat: {type: "field"}
  });

  this._output = {
    "x": "layout_x",
    "y": "layout_y"
  };
  return this;
}

var None

Geo.Parameters = {
  projection: {type: "value", default: "mercator"},
  center:     {type: "array[value]"},
  translate:  {type: "array[value]"},
  rotate:     {type: "array[value]"},
  scale:      {type: "value"},
  precision:  {type: "value"},
  clipAngle:  {type: "value"},
  clipExtent: {type: "value"}
};

Geo.d3Projection = function() {
  var g = this._graph,
      p = this.param("projection"),
      param = Geo.Parameters,
      proj, name, value;

  if (p !== this._mode) {
    this._mode = p;
    this._projection = d3.geo[p]();
  }
  proj = this._projection;

  for (name in param) {
    if (name === "projection" || !proj[name]) continue;
    value = this.param(name);
    if (value === undefined || (dl.isArray(value) && value.length === 0)) {
      continue;
    }
    if (value !== proj[name]()) {
      proj[name](value);
    }
  }

  return proj;
};

var proto = (Geo.prototype = new Transform());

proto.transform = function(input) {
  var g = this._graph,
      output = this._output,
      lon = this.param("lon").accessor,
      lat = this.param("lat").accessor,
      proj = Geo.d3Projection.call(this);

  function set(t) {
    var ll = [lon(t), lat(t)];
    var xy = proj(ll);
    tuple.set(t, output.x, xy[0]);
    tuple.set(t, output.y, xy[1]);
  }

  input.add.forEach(set);
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
    input.rem.forEach(set);
  }

  input.fields[output.x] = 1;
  input.fields[output.y] = 1;
  return input;
};

module.exports = Geo;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../dataflow/tuple":37,"./Transform":99,"datalib":20}],93:[function(require,module,exports){
(function (global){
var dl = require('datalib'),
    d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    Geo = require('./Geo'),
    Transform = require('./Transform'),
    tuple = require('../dataflow/tuple');

function GeoPath(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, Geo.Parameters);
  Transform.addParameters(this, {
    value: {type: "field", default: null},
  });

  this._output = {
    "path": "layout_path"
  };
  return this;
}

var proto = (GeoPath.prototype = new Transform());

proto.transform = function(input) {
  var output = this._output,
      geojson = this.param("value").accessor || dl.identity,
      proj = Geo.d3Projection.call(this),
      path = d3.geo.path().projection(proj);

  function set(t) {
    tuple.set(t, output.path, path(geojson(t)));
  }

  input.add.forEach(set);
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
    input.rem.forEach(set);
  }

  input.fields[output.path] = 1;
  return input;
};

module.exports = GeoPath;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../dataflow/tuple":37,"./Geo":92,"./Transform":99,"datalib":20}],94:[function(require,module,exports){
var Transform = require('./Transform'),
    tuple = require('../dataflow/tuple');

function LinkPath(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    source:  {type: "field", default: "_source"},
    target:  {type: "field", default: "_target"},
    x:       {type: "field", default: "layout_x"},
    y:       {type: "field", default: "layout_y"},
    tension: {type: "value", default: 0.2},
    shape:   {type: "value", default: "line"}
  });

  this._output = {"path": "layout_path"};
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
  var output = this._output,
      shape = shapes[this.param("shape")] || shapes.line,
      source = this.param("source").accessor,
      target = this.param("target").accessor,
      x = this.param("x").accessor,
      y = this.param("y").accessor,
      tension = this.param("tension");
  
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
},{"../dataflow/tuple":37,"./Transform":99}],95:[function(require,module,exports){
var dl = require('datalib'),
    expr = require('../parse/expr'),
    C = require('../util/constants');

var arrayType = /array/i,
    dataType  = /data/i,
    fieldType = /field/i,
    exprType  = /expr/i,
    valType   = /value/i;

function Parameter(name, type, transform) {
  this._name = name;
  this._type = type;
  this._transform = transform;

  // If parameter is defined w/signals, it must be resolved
  // on every pulse.
  this._value = [];
  this._accessors = [];
  this._resolution = false;
  this._signals = {};
}

var proto = Parameter.prototype;

function get() {
  var isArray = arrayType.test(this._type),
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type);

  var val = isArray ? this._value : this._value[0],
      acc = isArray ? this._accessors : this._accessors[0];

  if(!dl.isValid(acc) && valType.test(this._type)) {
    return val;
  } else {
    return isData ? { name: val, source: acc } :
    isField ? { field: val, accessor: acc } : val;
  }
};

proto.get = function() {
  var graph = this._transform._graph, 
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type),
      s, idx, val;

  // If we don't require resolution, return the value immediately.
  if (!this._resolution) return get.call(this);

  if (isData) {
    this._accessors = this._value.map(function(v) { return graph.data(v); });
    return get.call(this); // TODO: support signal as dataTypes
  }

  for (s in this._signals) {
    idx = this._signals[s];
    val = graph.signalRef(s);

    if (isField) {
      this._accessors[idx] = this._value[idx] != val ? 
        dl.accessor(val) : this._accessors[idx];
    }

    this._value[idx] = val;
  }

  return get.call(this);
};

proto.set = function(value) {
  var p = this,
      isExpr = exprType.test(this._type),
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type);

  this._value = dl.array(value).map(function(v, i) {
    if (dl.isString(v)) {
      if (isExpr) {
        var e = expr(v);
        p._transform.dependency(C.FIELDS,  e.fields);
        p._transform.dependency(C.SIGNALS, e.signals);
        return e.fn;
      } else if (isField) {  // Backwards compatibility
        p._accessors[i] = dl.accessor(v);
        p._transform.dependency(C.FIELDS, v);
      } else if (isData) {
        p._resolution = true;
        p._transform.dependency(C.DATA, v);
      }
      return v;
    } else if (v.value !== undefined) {
      return v.value;
    } else if (v.field !== undefined) {
      p._accessors[i] = dl.accessor(v.field);
      p._transform.dependency(C.FIELDS, v.field);
      return v.field;
    } else if (v.signal !== undefined) {
      p._resolution = true;
      p._signals[v.signal] = i;
      p._transform.dependency(C.SIGNALS, v.signal);
      return v.signal;
    }

    return v;
  });

  return p._transform;
};

module.exports = Parameter;
},{"../parse/expr":47,"../util/constants":107,"datalib":20}],96:[function(require,module,exports){
(function (global){
var dl = require('datalib'),
    d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform'),
    tuple = require('../dataflow/tuple');

function Pie(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    value:      {type: "field", default: null},
    startAngle: {type: "value", default: 0},
    endAngle:   {type: "value", default: 2 * Math.PI},
    sort:       {type: "value", default: false}
  });

  this._output = {
    "start": "layout_start",
    "end":   "layout_end",
    "mid":   "layout_mid"
  };

  return this;
}

var proto = (Pie.prototype = new BatchTransform());

function ones() { return 1; }

proto.batchTransform = function(input, data) {
  var g = this._graph,
      output = this._output,
      value = this.param("value").accessor || ones,
      start = this.param("startAngle"),
      stop = this.param("endAngle"),
      sort = this.param("sort");

  var values = data.map(value),
      a = start,
      k = (stop - start) / d3.sum(values),
      index = dl.range(data.length),
      i, t, v;

  if (sort) {
    index.sort(function(a, b) {
      return values[a] - values[b];
    });
  }

  for (i=0; i<index.length; ++i) {
    t = data[index[i]];
    v = values[index[i]];
    tuple.set(t, output.start, a);
    tuple.set(t, output.mid, (a + 0.5 * v * k));
    tuple.set(t, output.end, (a += v * k));
  }

  input.fields[output.start] = 1;
  input.fields[output.end] = 1;
  input.fields[output.mid] = 1;
  return input;
};

module.exports = Pie;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../dataflow/tuple":37,"./BatchTransform":83,"./Transform":99,"datalib":20}],97:[function(require,module,exports){
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

  if (input.add.length || input.mod.length || input.rem.length) {
    input.sort = dl.comparator(this.param("by").field);
  }

  return input;
};

module.exports = Sort;
},{"../parse/expr":47,"../util/debug":108,"./Transform":99,"datalib":20}],98:[function(require,module,exports){
var dl = require('datalib'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform'),
    tuple = require('../dataflow/tuple');

function Stack(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    groupby: {type: "array<field>"},
    sortby: {type: "array<field>"},
    value: {type: "field"},
    offset: {type: "value", default: "zero"}
  });

  this._output = {
    "start": "layout_start",
    "end":   "layout_end",
    "mid":   "layout_mid"
  };
  return this;
}

var proto = (Stack.prototype = new BatchTransform());

proto.batchTransform = function(input, data) {
  var g = this._graph,
      groupby = this.param("groupby").accessor,
      sortby = dl.comparator(this.param("sortby").field),
      value = this.param("value").accessor,
      offset = this.param("offset"),
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
      tuple.set(x, output.end, b);
      tuple.set(x, output.mid, 0.5 * (a + b));
    }
  }

  input.fields[output.start] = 1;
  input.fields[output.end] = 1;
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
},{"../dataflow/tuple":37,"./BatchTransform":83,"./Transform":99,"datalib":20}],99:[function(require,module,exports){
var Node = require('../dataflow/Node'),
    Parameter = require('./Parameter'),
    C = require('../util/constants');

function Transform(graph) {
  if(graph) Node.prototype.init.call(this, graph);
  return this;
}

Transform.addParameters = function(proto, params) {
  proto._parameters = proto._parameters || {};
  for (var name in params) {
    var p = params[name],
        param = proto._parameters[name] = new Parameter(name, p.type, proto);

    if (p.type === 'custom') {
      if (p.set) param.set = p.set.bind(param);
      if (p.get) param.get = p.get.bind(param);
    }

    if (p.hasOwnProperty('default')) param.set(p.default);
  }
};

var proto = (Transform.prototype = new Node());

proto.param = function(name, value) {
  if(arguments.length === 1) return this._parameters[name].get();
  return this._parameters[name].set(value);
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
},{"../dataflow/Node":34,"../util/constants":107,"./Parameter":95}],100:[function(require,module,exports){
(function (global){
var dl = require('datalib'),
    d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform'),
    tuple = require('../dataflow/tuple');

function Treemap(graph) {
  BatchTransform.prototype.init.call(this, graph);
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
    "x":      "layout_x",
    "y":      "layout_y",
    "width":  "layout_width",
    "height": "layout_height"
  };
  return this;
}

var proto = (Treemap.prototype = new BatchTransform());

proto.batchTransform = function(input, data) {
  // get variables
  var layout = this._layout,
      output = this._output;

  // configure layout
  layout
    .sort(dl.comparator(this.param("sort").field))
    .children(this.param("children").accessor)
    .value(this.param("value").accessor)
    .size(this.param("size"))
    .round(this.param("round"))
    .sticky(this.param("sticky"))
    .ratio(this.param("ratio"))
    .padding(this.param("padding"))
    .mode(this.param("mode"))
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

},{"../dataflow/tuple":37,"./BatchTransform":83,"./Transform":99,"datalib":20}],101:[function(require,module,exports){
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
  var w = this.param("with"),
      wds = w.source,
      woutput = wds.last(),
      wdata = wds.values(),
      key = this.param("key"),
      withKey = this.param("withKey"),
      as = this.param("as"),
      dflt = this.param("default"),
      map = mp.bind(this),
      rem = {};

  debug(input, ["zipping", w.name]);

  if (withKey.field) {
    if (woutput && woutput.stamp > this._lastJoin) {
      woutput.rem.forEach(function(x) {
        var m = map(withKey.accessor(x));
        if (m[0]) m[0].forEach(function(d) { d[as] = dflt });
        m[1] = null;
      });

      woutput.add.forEach(function(x) { 
        var m = map(withKey.accessor(x));
        if (m[0]) m[0].forEach(function(d) { d[as] = x });
        m[1] = x;
      });
      
      // Only process woutput.mod tuples if the join key has changed.
      // Other field updates will auto-propagate via prototype.
      if (woutput.fields[withKey.field]) {
        woutput.mod.forEach(function(x) {
          var prev;
          if (!x._prev || (prev = withKey.accessor(x._prev)) === undefined) return;
          var prevm = map(prev);
          if (prevm[0]) prevm[0].forEach(function(d) { d[as] = dflt });
          prevm[1] = null;

          var m = map(withKey.accessor(x));
          if (m[0]) m[0].forEach(function(d) { d[as] = x });
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

    if (input.fields[key.field]) {
      input.mod.forEach(function(x) {
        var prev;
        if (!x._prev || (prev = key.accessor(x._prev)) === undefined) return;

        var m = map(key.accessor(x));
        x[as] = m[1] || dflt;
        (m[0]=m[0]||[]).push(x);
        (rem[prev]=rem[prev]||{})[x._id] = 1;
      });
    }

    dl.keys(rem).forEach(function(k) { 
      var m = map(k);
      if (!m[0]) return;
      m[0] = m[0].filter(function(x) { return rem[k][x._id] !== 1 });
    });
  } else {
    // We only need to run a non-key-join again if we've got any add/rem
    // on input or woutput
    if (input.add.length == 0 && input.rem.length == 0 && 
        woutput.add.length == 0 && woutput.rem.length == 0) return input;

    // If we don't have a key-join, then we need to materialize both
    // data sources to iterate through them. 
    this._collector.evaluate(input);

    var data = this._collector.data(), 
        wlen = wdata.length, i;

    for (i = 0; i < data.length; i++) { data[i][as] = wdata[i%wlen]; }
  }

  input.fields[as] = 1;
  return input;
};

module.exports = Zip;
},{"../dataflow/Collector":31,"../util/debug":108,"./Transform":99,"datalib":20}],102:[function(require,module,exports){
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
  geo:        require('./Geo'),
  geopath:    require('./GeoPath'),
  pie:        require('./Pie'),
  sort:       require('./Sort'),
  stack:      require('./Stack'),
  treemap:    require('./Treemap'),
  zip:        require('./Zip')
};
},{"./Aggregate":82,"./Bin":84,"./Cross":85,"./Facet":86,"./Filter":88,"./Fold":89,"./Force":90,"./Formula":91,"./Geo":92,"./GeoPath":93,"./LinkPath":94,"./Pie":96,"./Sort":97,"./Stack":98,"./Treemap":100,"./Zip":101}],103:[function(require,module,exports){
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
},{}],104:[function(require,module,exports){
var vg_gradient_id = 0;

function gradient(type) {
  this.id = "grad_" + (vg_gradient_id++);
  this.type = type || "linear";
  this.stops = [];
  this.x1 = 0;
  this.x2 = 1;
  this.y1 = 0;
  this.y2 = 0;
};

var prototype = gradient.prototype;

prototype.stop = function(offset, color) {
  this.stops.push({
    offset: offset,
    color: color
  });
  return this;
};

module.exports = gradient;
},{}],105:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    dl = require('datalib'),
    Bounds = require('../util/Bounds'),
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
  return gfx || (gfx = (dl.isNode
    ? new ((typeof window !== "undefined" ? window.canvas : typeof global !== "undefined" ? global.canvas : null))(1,1)
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

},{"../render/canvas/path":64,"../util/Bounds":103,"./config":106,"datalib":20}],106:[function(require,module,exports){
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

},{}],107:[function(require,module,exports){
module.exports = {
  ADD_CELL: 1,
  MOD_CELL: 2,

  ID: "_id",

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
  LEGEND: "legend",

  COUNT: "count",
  GROUPBY: "groupby",
  MIN: "min",
  MAX: "max",
  VALUE: "value",

  SORT: "sort",
  ASC: "asc",
  DESC: "desc"
};
},{}],108:[function(require,module,exports){
var config = require('./config');
var ts;

module.exports = function(input, args) {
  if (!config.debug) return;
  var log = Function.prototype.bind.call(console.log, console);
  args.unshift(input.stamp||-1);
  args.unshift(Date.now() - ts);
  if (input.add) args.push(input.add.length, input.mod.length, input.rem.length, !!input.reflow);
  log.apply(console, args);
  ts = Date.now();
};
},{"./config":106}]},{},[1])(1)
});
//# sourceMappingURL=vega2.js.map
