(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.vg = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
  version: '2.0.1',
  dataflow: require('vega-dataflow'),
  parse: require('./src/parse/'),
  scene: {
    Bounder: require('./src/scene/Bounder'),
    Builder: require('./src/scene/Builder'),
    Encoder: require('./src/scene/Encoder'),
    GroupBuilder: require('./src/scene/GroupBuilder'),
  },
  transforms: require('./src/transforms'),
  schema: require('./src/core/schema'),
  config: require('./src/core/config'),
  util:  require('datalib/src/util'),
  debug: require('vega-logging').debug
};
},{"./src/core/config":82,"./src/core/schema":83,"./src/parse/":89,"./src/scene/Bounder":101,"./src/scene/Builder":102,"./src/scene/Encoder":103,"./src/scene/GroupBuilder":104,"./src/transforms":130,"datalib/src/util":20,"vega-dataflow":35,"vega-logging":41}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
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
      changes.rem.push(cell.tuple);
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
},{"../util":20,"./collector":4,"./measures":5}],4:[function(require,module,exports){
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

},{"../stats":17,"../util":20}],5:[function(require,module,exports){
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
    rem:  'var d = v - this.mean; this.mean -= this.valid ? d / this.valid : this.mean;',
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
    set:  'this.valid > 1 ? this.dev / (this.valid-1) : 0',
    req:  ['mean'], idx: 1
  }),
  'variancep': measure({
    name: 'variancep',
    set:  'this.valid > 1 ? this.dev / this.valid : 0',
    req:  ['variance'], idx: 2
  }),
  'stdev': measure({
    name: 'stdev',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid-1)) : 0',
    req:  ['variance'], idx: 2
  }),
  'stdevp': measure({
    name: 'stdevp',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / this.valid) : 0',
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
      add = 'if (v==null) this.missing++; if (!this.isValid(v)) return; ++this.valid;',
      rem = 'if (v==null) this.missing--; if (!this.isValid(v)) return; --this.valid;',
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
  ctr.prototype.distinct = require('../stats').count.distinct;
  ctr.prototype.isValid = util.isValid;
  return ctr;
}

types.create = create;
module.exports = types;
},{"../stats":17,"../util":20}],6:[function(require,module,exports){
var util = require('../util');
var units = require('../time-units');
var EPSILON = 1e-15;

function bins(opt) {
  if (!opt) { throw Error("Missing binning options."); }

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
  if (!opt) { throw Error("Missing date binning options."); }

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

},{"../time-units":19,"../util":20}],7:[function(require,module,exports){
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
    max = min === undefined ? 1 : min;
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
},{}],8:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9pbXBvcnQvZm9ybWF0cy9kc3YuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwnKTtcbnZhciBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpO1xuXG5mdW5jdGlvbiBkc3YoZGF0YSwgZm9ybWF0KSB7XG4gIGlmIChkYXRhKSB7XG4gICAgdmFyIGggPSBmb3JtYXQuaGVhZGVyO1xuICAgIGRhdGEgPSAoaCA/IGguam9pbihmb3JtYXQuZGVsaW1pdGVyKSArICdcXG4nIDogJycpICsgZGF0YTtcbiAgfVxuICByZXR1cm4gZDMuZHN2KGZvcm1hdC5kZWxpbWl0ZXIpLnBhcnNlKGRhdGEpO1xufVxuXG5kc3YuZGVsaW1pdGVyID0gZnVuY3Rpb24oZGVsaW0pIHtcbiAgdmFyIGZtdCA9IHtkZWxpbWl0ZXI6IGRlbGltfTtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEsIGZvcm1hdCkge1xuICAgIHJldHVybiBkc3YoZGF0YSwgZm9ybWF0ID8gdXRpbC5leHRlbmQoZm9ybWF0LCBmbXQpIDogZm10KTtcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZHN2OyJdfQ==
},{"../../util":20}],9:[function(require,module,exports){
var dsv = require('./dsv');

module.exports = {
  json: require('./json'),
  topojson: require('./topojson'),
  treejson: require('./treejson'),
  dsv: dsv,
  csv: dsv.delimiter(','),
  tsv: dsv.delimiter('\t')
};
},{"./dsv":8,"./json":10,"./topojson":11,"./treejson":12}],10:[function(require,module,exports){
var util = require('../../util');

module.exports = function(data, format) {
  var d = util.isObject(data) && !util.isBuffer(data) ?
    data : JSON.parse(data);
  if (format && format.property) {
    d = util.accessor(format.property)(d);
  }
  return d;
};

},{"../../util":20}],11:[function(require,module,exports){
(function (global){
var json = require('./json');

var reader = function(data, format) {
  var topojson = reader.topojson;
  if (topojson == null) { throw Error('TopoJSON library not loaded.'); }

  var t = json(data, format), obj;

  if (format && format.feature) {
    if ((obj = t.objects[format.feature])) {
      return topojson.feature(t, obj).features;
    } else {
      throw Error('Invalid TopoJSON object: ' + format.feature);
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
};

reader.topojson = (typeof window !== "undefined" ? window.topojson : typeof global !== "undefined" ? global.topojson : null);
module.exports = reader;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy9pbXBvcnQvZm9ybWF0cy90b3BvanNvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIganNvbiA9IHJlcXVpcmUoJy4vanNvbicpO1xuXG52YXIgcmVhZGVyID0gZnVuY3Rpb24oZGF0YSwgZm9ybWF0KSB7XG4gIHZhciB0b3BvanNvbiA9IHJlYWRlci50b3BvanNvbjtcbiAgaWYgKHRvcG9qc29uID09IG51bGwpIHsgdGhyb3cgRXJyb3IoJ1RvcG9KU09OIGxpYnJhcnkgbm90IGxvYWRlZC4nKTsgfVxuXG4gIHZhciB0ID0ganNvbihkYXRhLCBmb3JtYXQpLCBvYmo7XG5cbiAgaWYgKGZvcm1hdCAmJiBmb3JtYXQuZmVhdHVyZSkge1xuICAgIGlmICgob2JqID0gdC5vYmplY3RzW2Zvcm1hdC5mZWF0dXJlXSkpIHtcbiAgICAgIHJldHVybiB0b3BvanNvbi5mZWF0dXJlKHQsIG9iaikuZmVhdHVyZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFRvcG9KU09OIG9iamVjdDogJyArIGZvcm1hdC5mZWF0dXJlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZm9ybWF0ICYmIGZvcm1hdC5tZXNoKSB7XG4gICAgaWYgKChvYmogPSB0Lm9iamVjdHNbZm9ybWF0Lm1lc2hdKSkge1xuICAgICAgcmV0dXJuIFt0b3BvanNvbi5tZXNoKHQsIHQub2JqZWN0c1tmb3JtYXQubWVzaF0pXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgVG9wb0pTT04gb2JqZWN0OiAnICsgZm9ybWF0Lm1lc2gpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBFcnJvcignTWlzc2luZyBUb3BvSlNPTiBmZWF0dXJlIG9yIG1lc2ggcGFyYW1ldGVyLicpO1xuICB9XG59O1xuXG5yZWFkZXIudG9wb2pzb24gPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy50b3BvanNvbiA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwudG9wb2pzb24gOiBudWxsKTtcbm1vZHVsZS5leHBvcnRzID0gcmVhZGVyOyJdfQ==
},{"./json":10}],12:[function(require,module,exports){
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
},{"./json":10}],13:[function(require,module,exports){
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
    if (!startsWith(url, '/') && opt.baseURL[opt.baseURL.length-1] !== '/') {
      url = '/' + url; // Ensure that there is a slash between the baseURL (e.g. hostname) and url
    }
    url = opt.baseURL + url;
  }
  // relative protocol, starts with '//'
  if (!load.useXHR && startsWith(url, '//')) {
    url = (opt.defaultProtocol || 'http') + ':' + url;
  }
  // If opt.domainWhiteList is set, only allows url, whose hostname
  // * Is the same as the origin (window.location.hostname)
  // * Equals one of the values in the whitelist
  // * Is a proper subdomain of one of the values in the whitelist
  if (opt.domainWhiteList) {
    var domain, origin;
    if (load.useXHR) {
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
    } else {
      // relative protocol is broken: https://github.com/defunctzombie/node-url/issues/5
      var parts = require('url').parse(url);
      domain = parts.hostname;
      origin = null;
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
    error('Invalid URL: ' + opt.url);
  } else if (load.useXHR) {
    // on client, use xhr
    return xhr(url, callback);
  } else if (startsWith(url, fileProtocol)) {
    // on server, if url starts with 'file://', strip it and load from file
    return file(url.slice(fileProtocol.length), callback);
  } else if (url.indexOf('://') < 0) { // TODO better protocol check?
    // on server, if no protocol assume file
    return file(url, callback);
  } else {
    // for regular URLs on server
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
  fs.readFile(filename, callback);
}

function http(url, callback) {
  if (!callback) {
    return require('sync-request')('GET', url).getBody();
  }
  require('request')(url, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      callback(null, body);
    } else {
      error = error ||
        'Load failed with response code ' + response.statusCode + '.';
      callback(error, null);
    }
  });
}

function startsWith(string, searchString) {
  return string == null ? false : string.lastIndexOf(searchString, 0) === 0;
}

load.sanitizeUrl = sanitizeUrl;

load.useXHR = (typeof XMLHttpRequest !== 'undefined');

module.exports = load;

},{"fs":2,"request":2,"sync-request":2,"url":2}],14:[function(require,module,exports){
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

},{"../util":20,"./formats":9,"./type":16}],15:[function(require,module,exports){
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
        if (error) { callback(error, null); return; }
        try {
          // data loaded, now parse it (async)
          data = read(data, format);
          callback(null, data);
        } catch (e) {
          callback(e, null);
        }
      } : undefined);
      
      // data loaded, now parse it (sync)
      if (!callback) return read(data, format);
    };
    return out;
  }, {});

},{"../util":20,"./load":13,"./read":14}],16:[function(require,module,exports){
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
    types[f] = infer(data, f);
    return types;
  }, {});
}

type.annotation = annotation;
type.all = typeAll;
type.infer = infer;
type.inferAll = inferAll;
type.parsers = PARSERS;
module.exports = type;
},{"../util":20}],17:[function(require,module,exports){
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
  if (!util.isArray(values) || values.length < 2) return 0;
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
      if (v === v) sum += v;
    }
  } else {
    a = util.$(a);
    b = util.$(b);
    for (i=0; i<values.length; ++i) {
      v = a(values[i]) * b(values[i]);
      if (v === v) sum += v;
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
},{"./generate":7,"./import/type":16,"./util":20}],18:[function(require,module,exports){
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

  /* jshint evil: true */
  return (new Function('d', src)).bind(context);
}

template.source = source;
template.context = context;
module.exports = template;

// Clear cache of format objects.
// This can *break* prior template functions, so invoke with care!
template.clearFormatCache = function() {
  context.formats = [];
  context.format_map = {};
};

// Generate property access code for use within template source.
// object: the name of the object (variable) containing template data
// property: the property access string, verbatim from template tag
template.property = function(object, property) {
  var src = util.field(property).map(util.str).join('][');
  return object + '[' + src + ']';
};

// Generate source code for a template function.
// text: the template text
// variable: the name of the data object variable ('obj' by default)
// properties: optional hash for collecting all accessed properties
function source(text, variable, properties) {
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
        template_var(interpolate, variable, properties) +
        '))==null?\'\':__t)+\n\'';
    }

    // Adobe VMs need the match returned to produce the correct offest.
    return match;
  });
  return src + '\'';
}

function template_var(text, variable, properties) {
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

  if (properties) properties[prop] = 1;
  var src = template.property(variable, prop);

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9kYXRhbGliL3NyYy90ZW1wbGF0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKTtcblxudmFyIGNvbnRleHQgPSB7XG4gIGZvcm1hdHM6ICAgIFtdLFxuICBmb3JtYXRfbWFwOiB7fSxcbiAgdHJ1bmNhdGU6ICAgdXRpbC50cnVuY2F0ZSxcbiAgcGFkOiAgICAgICAgdXRpbC5wYWRcbn07XG5cbmZ1bmN0aW9uIHRlbXBsYXRlKHRleHQpIHtcbiAgdmFyIHNyYyA9IHNvdXJjZSh0ZXh0LCAnZCcpO1xuICBzcmMgPSAndmFyIF9fdDsgcmV0dXJuICcgKyBzcmMgKyAnOyc7XG5cbiAgLyoganNoaW50IGV2aWw6IHRydWUgKi9cbiAgcmV0dXJuIChuZXcgRnVuY3Rpb24oJ2QnLCBzcmMpKS5iaW5kKGNvbnRleHQpO1xufVxuXG50ZW1wbGF0ZS5zb3VyY2UgPSBzb3VyY2U7XG50ZW1wbGF0ZS5jb250ZXh0ID0gY29udGV4dDtcbm1vZHVsZS5leHBvcnRzID0gdGVtcGxhdGU7XG5cbi8vIENsZWFyIGNhY2hlIG9mIGZvcm1hdCBvYmplY3RzLlxuLy8gVGhpcyBjYW4gKmJyZWFrKiBwcmlvciB0ZW1wbGF0ZSBmdW5jdGlvbnMsIHNvIGludm9rZSB3aXRoIGNhcmUhXG50ZW1wbGF0ZS5jbGVhckZvcm1hdENhY2hlID0gZnVuY3Rpb24oKSB7XG4gIGNvbnRleHQuZm9ybWF0cyA9IFtdO1xuICBjb250ZXh0LmZvcm1hdF9tYXAgPSB7fTtcbn07XG5cbi8vIEdlbmVyYXRlIHByb3BlcnR5IGFjY2VzcyBjb2RlIGZvciB1c2Ugd2l0aGluIHRlbXBsYXRlIHNvdXJjZS5cbi8vIG9iamVjdDogdGhlIG5hbWUgb2YgdGhlIG9iamVjdCAodmFyaWFibGUpIGNvbnRhaW5pbmcgdGVtcGxhdGUgZGF0YVxuLy8gcHJvcGVydHk6IHRoZSBwcm9wZXJ0eSBhY2Nlc3Mgc3RyaW5nLCB2ZXJiYXRpbSBmcm9tIHRlbXBsYXRlIHRhZ1xudGVtcGxhdGUucHJvcGVydHkgPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7XG4gIHZhciBzcmMgPSB1dGlsLmZpZWxkKHByb3BlcnR5KS5tYXAodXRpbC5zdHIpLmpvaW4oJ11bJyk7XG4gIHJldHVybiBvYmplY3QgKyAnWycgKyBzcmMgKyAnXSc7XG59O1xuXG4vLyBHZW5lcmF0ZSBzb3VyY2UgY29kZSBmb3IgYSB0ZW1wbGF0ZSBmdW5jdGlvbi5cbi8vIHRleHQ6IHRoZSB0ZW1wbGF0ZSB0ZXh0XG4vLyB2YXJpYWJsZTogdGhlIG5hbWUgb2YgdGhlIGRhdGEgb2JqZWN0IHZhcmlhYmxlICgnb2JqJyBieSBkZWZhdWx0KVxuLy8gcHJvcGVydGllczogb3B0aW9uYWwgaGFzaCBmb3IgY29sbGVjdGluZyBhbGwgYWNjZXNzZWQgcHJvcGVydGllc1xuZnVuY3Rpb24gc291cmNlKHRleHQsIHZhcmlhYmxlLCBwcm9wZXJ0aWVzKSB7XG4gIHZhcmlhYmxlID0gdmFyaWFibGUgfHwgJ29iaic7XG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBzcmMgPSAnXFwnJztcbiAgdmFyIHJlZ2V4ID0gdGVtcGxhdGVfcmU7XG5cbiAgLy8gQ29tcGlsZSB0aGUgdGVtcGxhdGUgc291cmNlLCBlc2NhcGluZyBzdHJpbmcgbGl0ZXJhbHMgYXBwcm9wcmlhdGVseS5cbiAgdGV4dC5yZXBsYWNlKHJlZ2V4LCBmdW5jdGlvbihtYXRjaCwgaW50ZXJwb2xhdGUsIG9mZnNldCkge1xuICAgIHNyYyArPSB0ZXh0XG4gICAgICAuc2xpY2UoaW5kZXgsIG9mZnNldClcbiAgICAgIC5yZXBsYWNlKHRlbXBsYXRlX2VzY2FwZXIsIHRlbXBsYXRlX2VzY2FwZUNoYXIpO1xuICAgIGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuXG4gICAgaWYgKGludGVycG9sYXRlKSB7XG4gICAgICBzcmMgKz0gJ1xcJ1xcbisoKF9fdD0oJyArXG4gICAgICAgIHRlbXBsYXRlX3ZhcihpbnRlcnBvbGF0ZSwgdmFyaWFibGUsIHByb3BlcnRpZXMpICtcbiAgICAgICAgJykpPT1udWxsP1xcJ1xcJzpfX3QpK1xcblxcJyc7XG4gICAgfVxuXG4gICAgLy8gQWRvYmUgVk1zIG5lZWQgdGhlIG1hdGNoIHJldHVybmVkIHRvIHByb2R1Y2UgdGhlIGNvcnJlY3Qgb2ZmZXN0LlxuICAgIHJldHVybiBtYXRjaDtcbiAgfSk7XG4gIHJldHVybiBzcmMgKyAnXFwnJztcbn1cblxuZnVuY3Rpb24gdGVtcGxhdGVfdmFyKHRleHQsIHZhcmlhYmxlLCBwcm9wZXJ0aWVzKSB7XG4gIHZhciBmaWx0ZXJzID0gdGV4dC5zcGxpdCgnfCcpO1xuICB2YXIgcHJvcCA9IGZpbHRlcnMuc2hpZnQoKS50cmltKCk7XG4gIHZhciBzdHJpbmdDYXN0ID0gdHJ1ZTtcblxuICBmdW5jdGlvbiBzdHJjYWxsKGZuKSB7XG4gICAgZm4gPSBmbiB8fCAnJztcbiAgICBpZiAoc3RyaW5nQ2FzdCkge1xuICAgICAgc3RyaW5nQ2FzdCA9IGZhbHNlO1xuICAgICAgc3JjID0gJ1N0cmluZygnICsgc3JjICsgJyknICsgZm47XG4gICAgfSBlbHNlIHtcbiAgICAgIHNyYyArPSBmbjtcbiAgICB9XG4gICAgcmV0dXJuIHNyYztcbiAgfVxuXG4gIGZ1bmN0aW9uIGRhdGUoKSB7XG4gICAgcmV0dXJuICcodHlwZW9mICcgKyBzcmMgKyAnPT09XCJudW1iZXJcIj9uZXcgRGF0ZSgnK3NyYysnKTonK3NyYysnKSc7XG4gIH1cblxuICBpZiAocHJvcGVydGllcykgcHJvcGVydGllc1twcm9wXSA9IDE7XG4gIHZhciBzcmMgPSB0ZW1wbGF0ZS5wcm9wZXJ0eSh2YXJpYWJsZSwgcHJvcCk7XG5cbiAgZm9yICh2YXIgaT0wOyBpPGZpbHRlcnMubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgZiA9IGZpbHRlcnNbaV0sIGFyZ3MgPSBudWxsLCBwaWR4LCBhLCBiO1xuXG4gICAgaWYgKChwaWR4PWYuaW5kZXhPZignOicpKSA+IDApIHtcbiAgICAgIGYgPSBmLnNsaWNlKDAsIHBpZHgpO1xuICAgICAgYXJncyA9IGZpbHRlcnNbaV0uc2xpY2UocGlkeCsxKS5zcGxpdCgnLCcpXG4gICAgICAgIC5tYXAoZnVuY3Rpb24ocykgeyByZXR1cm4gcy50cmltKCk7IH0pO1xuICAgIH1cbiAgICBmID0gZi50cmltKCk7XG5cbiAgICBzd2l0Y2ggKGYpIHtcbiAgICAgIGNhc2UgJ2xlbmd0aCc6XG4gICAgICAgIHN0cmNhbGwoJy5sZW5ndGgnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdsb3dlcic6XG4gICAgICAgIHN0cmNhbGwoJy50b0xvd2VyQ2FzZSgpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndXBwZXInOlxuICAgICAgICBzdHJjYWxsKCcudG9VcHBlckNhc2UoKScpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xvd2VyLWxvY2FsZSc6XG4gICAgICAgIHN0cmNhbGwoJy50b0xvY2FsZUxvd2VyQ2FzZSgpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndXBwZXItbG9jYWxlJzpcbiAgICAgICAgc3RyY2FsbCgnLnRvTG9jYWxlVXBwZXJDYXNlKCknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0cmltJzpcbiAgICAgICAgc3RyY2FsbCgnLnRyaW0oKScpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICBhID0gdXRpbC5udW1iZXIoYXJnc1swXSk7XG4gICAgICAgIHN0cmNhbGwoJy5zbGljZSgwLCcgKyBhICsgJyknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgIGEgPSB1dGlsLm51bWJlcihhcmdzWzBdKTtcbiAgICAgICAgc3RyY2FsbCgnLnNsaWNlKC0nICsgYSArJyknKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtaWQnOlxuICAgICAgICBhID0gdXRpbC5udW1iZXIoYXJnc1swXSk7XG4gICAgICAgIGIgPSBhICsgdXRpbC5udW1iZXIoYXJnc1sxXSk7XG4gICAgICAgIHN0cmNhbGwoJy5zbGljZSgrJythKycsJytiKycpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc2xpY2UnOlxuICAgICAgICBhID0gdXRpbC5udW1iZXIoYXJnc1swXSk7XG4gICAgICAgIHN0cmNhbGwoJy5zbGljZSgnKyBhICtcbiAgICAgICAgICAoYXJncy5sZW5ndGggPiAxID8gJywnICsgdXRpbC5udW1iZXIoYXJnc1sxXSkgOiAnJykgK1xuICAgICAgICAgICcpJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndHJ1bmNhdGUnOlxuICAgICAgICBhID0gdXRpbC5udW1iZXIoYXJnc1swXSk7XG4gICAgICAgIGIgPSBhcmdzWzFdO1xuICAgICAgICBiID0gKGIhPT0nbGVmdCcgJiYgYiE9PSdtaWRkbGUnICYmIGIhPT0nY2VudGVyJykgPyAncmlnaHQnIDogYjtcbiAgICAgICAgc3JjID0gJ3RoaXMudHJ1bmNhdGUoJyArIHN0cmNhbGwoKSArICcsJyArIGEgKyAnLFxcJycgKyBiICsgJ1xcJyknO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3BhZCc6XG4gICAgICAgIGEgPSB1dGlsLm51bWJlcihhcmdzWzBdKTtcbiAgICAgICAgYiA9IGFyZ3NbMV07XG4gICAgICAgIGIgPSAoYiE9PSdsZWZ0JyAmJiBiIT09J21pZGRsZScgJiYgYiE9PSdjZW50ZXInKSA/ICdyaWdodCcgOiBiO1xuICAgICAgICBzcmMgPSAndGhpcy5wYWQoJyArIHN0cmNhbGwoKSArICcsJyArIGEgKyAnLFxcJycgKyBiICsgJ1xcJyknO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgIGEgPSB0ZW1wbGF0ZV9mb3JtYXQoYXJnc1swXSwgZDMuZm9ybWF0KTtcbiAgICAgICAgc3RyaW5nQ2FzdCA9IGZhbHNlO1xuICAgICAgICBzcmMgPSAndGhpcy5mb3JtYXRzWycrYSsnXSgnK3NyYysnKSc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndGltZSc6XG4gICAgICAgIGEgPSB0ZW1wbGF0ZV9mb3JtYXQoYXJnc1swXSwgZDMudGltZS5mb3JtYXQpO1xuICAgICAgICBzdHJpbmdDYXN0ID0gZmFsc2U7XG4gICAgICAgIHNyYyA9ICd0aGlzLmZvcm1hdHNbJythKyddKCcrZGF0ZSgpKycpJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBFcnJvcignVW5yZWNvZ25pemVkIHRlbXBsYXRlIGZpbHRlcjogJyArIGYpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzcmM7XG59XG5cbnZhciB0ZW1wbGF0ZV9yZSA9IC9cXHtcXHsoLis/KVxcfVxcfXwkL2c7XG5cbi8vIENlcnRhaW4gY2hhcmFjdGVycyBuZWVkIHRvIGJlIGVzY2FwZWQgc28gdGhhdCB0aGV5IGNhbiBiZSBwdXQgaW50byBhXG4vLyBzdHJpbmcgbGl0ZXJhbC5cbnZhciB0ZW1wbGF0ZV9lc2NhcGVzID0ge1xuICAnXFwnJzogICAgICdcXCcnLFxuICAnXFxcXCc6ICAgICAnXFxcXCcsXG4gICdcXHInOiAgICAgJ3InLFxuICAnXFxuJzogICAgICduJyxcbiAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAnXFx1MjAyOSc6ICd1MjAyOSdcbn07XG5cbnZhciB0ZW1wbGF0ZV9lc2NhcGVyID0gL1xcXFx8J3xcXHJ8XFxufFxcdTIwMjh8XFx1MjAyOS9nO1xuXG5mdW5jdGlvbiB0ZW1wbGF0ZV9lc2NhcGVDaGFyKG1hdGNoKSB7XG4gIHJldHVybiAnXFxcXCcgKyB0ZW1wbGF0ZV9lc2NhcGVzW21hdGNoXTtcbn1cblxuZnVuY3Rpb24gdGVtcGxhdGVfZm9ybWF0KHBhdHRlcm4sIGZtdCkge1xuICBpZiAoKHBhdHRlcm5bMF0gPT09ICdcXCcnICYmIHBhdHRlcm5bcGF0dGVybi5sZW5ndGgtMV0gPT09ICdcXCcnKSB8fFxuICAgICAgKHBhdHRlcm5bMF0gPT09ICdcIicgICYmIHBhdHRlcm5bcGF0dGVybi5sZW5ndGgtMV0gPT09ICdcIicpKSB7XG4gICAgcGF0dGVybiA9IHBhdHRlcm4uc2xpY2UoMSwgLTEpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IEVycm9yKCdGb3JtYXQgcGF0dGVybiBtdXN0IGJlIHF1b3RlZDogJyArIHBhdHRlcm4pO1xuICB9XG4gIGlmICghY29udGV4dC5mb3JtYXRfbWFwW3BhdHRlcm5dKSB7XG4gICAgdmFyIGYgPSBmbXQocGF0dGVybik7XG4gICAgdmFyIGkgPSBjb250ZXh0LmZvcm1hdHMubGVuZ3RoO1xuICAgIGNvbnRleHQuZm9ybWF0cy5wdXNoKGYpO1xuICAgIGNvbnRleHQuZm9ybWF0X21hcFtwYXR0ZXJuXSA9IGk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQuZm9ybWF0X21hcFtwYXR0ZXJuXTtcbn1cbiJdfQ==
},{"./util":20}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
var buffer = require('buffer');
var units = require('./time-units');
var u = module.exports = {};

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
  return obj != null && obj === obj;
};

u.isBuffer = (buffer.Buffer && buffer.Buffer.isBuffer) || u.false;

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

},{"./time-units":19,"buffer":2}],21:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19}],22:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"./time-units":21,"buffer":2,"dup":20}],23:[function(require,module,exports){
module.exports = require('./lib/heap');

},{"./lib/heap":24}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
var ts = Date.now();

function write(msg) {
  msg = '[Vega Log] ' + msg;
  console.log(msg);
}

function error(msg) {
  msg = '[Vega Err] ' + msg;
  console.error(msg);
}

function debug(input, args) {
  if (!debug.enable) return;
  var log = Function.prototype.bind.call(console.log, console);
  var state = {
    prevTime:  Date.now() - ts,
    stamp: input.stamp
  };

  if (input.add) {
    state.add = input.add.length;
    state.mod = input.mod.length;
    state.rem = input.rem.length;
    state.reflow = !!input.reflow;
  }

  log.apply(console, (args.push(JSON.stringify(state)), args));
  ts = Date.now();
}

module.exports = {
  log:   write,
  error: error,
  debug: (debug.enable = false, debug)
};

},{}],26:[function(require,module,exports){
var DEPS = require('./Dependencies').ALL;

function create(cs, reflow) {
  var out = {};
  copy(cs, out);

  out.add = [];
  out.mod = [];
  out.rem = [];

  out.reflow = reflow;

  return out;
}

function copy(a, b) {
  b.stamp = a ? a.stamp : 0;
  b.sort  = a ? a.sort  : null;
  b.facet = a ? a.facet : null;
  b.trans = a ? a.trans : null;
  b.dirty = a ? a.dirty : [];
  b.request = a ? a.request : null;
  for (var d, i=0, n=DEPS.length; i<n; ++i) {
    b[d=DEPS[i]] = a ? a[d] : {};
  }
}

module.exports = {
  create: create,
  copy: copy
};
},{"./Dependencies":29}],27:[function(require,module,exports){
var log = require('vega-logging'),
    Tuple = require('./Tuple'),
    Base = require('./Node').prototype;

function Collector(graph) {
  Base.init.call(this, graph);
  this._data = [];
  this.router(true).collector(true);
}

var prototype = (Collector.prototype = Object.create(Base));
prototype.constructor = Collector;

prototype.data = function() {
  return this._data;
};

prototype.evaluate = function(input) {
  log.debug(input, ["collecting"]);

  if (input.rem.length) {
    this._data = Tuple.idFilter(this._data, input.rem);
  }

  if (input.add.length) {
    this._data = this._data.length ? this._data.concat(input.add) : input.add;
  }

  if (input.sort) {
    this._data.sort(input.sort);
  }

  if (input.reflow) {
    input.mod = input.mod.concat(Tuple.idFilter(this._data, 
      input.add, input.mod, input.rem));
    input.reflow = false;
  }

  return input;
};

module.exports = Collector;
},{"./Node":31,"./Tuple":34,"vega-logging":25}],28:[function(require,module,exports){
var log = require('vega-logging'),
    ChangeSet = require('./ChangeSet'), 
    Collector = require('./Collector'),
    Tuple = require('./Tuple'),
    Node = require('./Node'), // jshint ignore:line
    SENTINEL = require('./Sentinel');

function DataSource(graph, name, facet) {
  this._graph = graph;
  this._name = name;
  this._data = [];
  this._source = null;
  this._facet = facet;
  this._input = ChangeSet.create();
  this._output = null; // Output changeset

  this._pipeline  = null; // Pipeline of transformations.
  this._collector = null; // Collector to materialize output of pipeline
  this._revises = false;  // Does any pipeline operator need to track prev?
}

var prototype = DataSource.prototype;

prototype.name = function(name) {
  if (!arguments.length) return this._name;
  return (this._name = name, this);
};

prototype.source = function(src) {
  if (!arguments.length) return this._source;
  return (this._source = this._graph.data(src));
};

prototype.insert = function(tuples) {
  var prev = this._revises ? null : undefined;
  var insert = tuples.map(function(d) {
    return Tuple.ingest(d, prev);
  });

  this._input.add = this._input.add.concat(insert);
  return this;
};

prototype.remove = function(where) {
  var remove = this._data.filter(where);
  this._input.rem = this._input.rem.concat(remove);
  return this;
};

prototype.update = function(where, field, func) {
  var mod = this._input.mod,
      ids = Tuple.idMap(mod);

  this._input.fields[field] = 1;

  this._data.filter(where).forEach(function(x) {
    var prev = x[field],
        next = func(x);
    if (prev !== next) {
      Tuple.set(x, field, next);
      if (ids[x._id] !== 1) {
        mod.push(x);
        ids[x._id] = 1;
      }
    }
  });

  return this;
};

prototype.values = function(data) {
  if (!arguments.length) {
    return this._collector ? this._collector.data() : this._data;
  }

  // Replace backing data
  this._input.rem = this._data.slice();
  if (data) { this.insert(data); }
  return this;
};

function set_prev(d) {
  if (d._prev === undefined) d._prev = SENTINEL;
}

prototype.revises = function(p) {
  if (!arguments.length) return this._revises;

  // If we've not needed prev in the past, but a new dataflow node needs it now
  // ensure existing tuples have prev set.
  if (!this._revises && p) {
    this._data.forEach(set_prev);

    // New tuples that haven't yet been merged into _data
    this._input.add.forEach(set_prev); 
  }

  this._revises = this._revises || p;
  return this;
};

prototype.last = function() {
  return this._output;
};

prototype.fire = function(input) {
  if (input) this._input = input;
  this._graph.propagate(this._input, this._pipeline[0]);
  return this;
};

prototype.pipeline = function(pipeline) {
  if (!arguments.length) return this._pipeline;

  var ds = this;

  // Add a collector to materialize the output of pipeline operators.
  if (pipeline.length) {
    ds._collector = new Collector(this._graph);
    pipeline.push(ds._collector);
    ds._revises = pipeline.some(function(p) { return p.revises(); });
  }

  // Input/output nodes masquerade as collector nodes, so they need to
  // have a `data` function. dsData is used if a collector isn't available.
  function dsData() { return ds._data; }

  // Input node applies the datasource's delta, and propagates it to 
  // the rest of the pipeline. It receives touches to reflow data.
  var input = new Node(this._graph)
    .router(true)
    .collector(true);

  input.data = dsData;

  input.evaluate = function(input) {
    log.debug(input, ['input', ds._name]);

    var delta = ds._input, 
        out = ChangeSet.create(input), f;

    // Delta might contain fields updated through API
    for (f in delta.fields) {
      out.fields[f] = 1;
    }

    // update data
    if (delta.rem.length) {
      ds._data = Tuple.idFilter(ds._data, delta.rem);
    }

    if (delta.add.length) {
      ds._data = ds._data.concat(delta.add);
    }

    // if reflowing, add any other tuples not currently in changeset
    if (input.reflow) {
      delta.mod = delta.mod.concat(Tuple.idFilter(ds._data,
        delta.add, delta.mod, delta.rem));
    }

    // reset change list
    ds._input = ChangeSet.create();

    out.add = delta.add; 
    out.mod = delta.mod;
    out.rem = delta.rem;
    out.facet = ds._facet;
    return out;
  };

  pipeline.unshift(input);

  // Output node captures the last changeset seen by this datasource
  // (needed for joins and builds) and materializes any nested data.
  // If this datasource is faceted, materializes the values in the facet.
  var output = new Node(this._graph)
    .router(true)
    .reflows(true)
    .collector(true);

  output.data = ds._collector ?
    ds._collector.data.bind(ds._collector) :
    dsData;

  output.evaluate = function(input) {
    log.debug(input, ['output', ds._name]);

    var output = ChangeSet.create(input, true);

    if (ds._facet) {
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

prototype.finalize = function() {
  if (!this._revises) return;
  for (var i=0, n=this._data.length; i<n; ++i) {
    var x = this._data[i];
    x._prev = (x._prev === undefined) ? undefined : SENTINEL;
  }
};

prototype.listener = function() { 
  var l = new Node(this._graph).router(true),
      dest = this,
      prev = this._revises ? null : undefined;

  l.evaluate = function(input) {
    dest._srcMap = dest._srcMap || {}; // to propagate tuples correctly
    var map = dest._srcMap,
        output  = ChangeSet.create(input);

    output.add = input.add.map(function(t) {
      var d = Tuple.derive(t, t._prev !== undefined ? t._prev : prev);
      return (map[t._id] = d);
    });

    output.mod = input.mod.map(function(t) {
      var o = map[t._id];
      return (o._prev = t._prev, o);
    });

    output.rem = input.rem.map(function(t) { 
      var o = map[t._id];
      map[t._id] = null;
      return (o._prev = t._prev, o);
    });

    return (dest._input = output);
  };

  l.addListener(this._pipeline[0]);
  return l;
};

prototype.addListener = function(l) {
  if (l instanceof DataSource) {
    if (this._collector) {
      this._collector.addListener(l.listener());
    } else {
      this._pipeline[0].addListener(l.listener());
    }
  } else {
    this._pipeline[this._pipeline.length-1].addListener(l);      
  }

  return this;
};

prototype.removeListener = function(l) {
  this._pipeline[this._pipeline.length-1].removeListener(l);
};

prototype.listeners = function(ds) {
  if (ds) {
    return this._collector ?
      this._collector.listeners() :
      this._pipeline[0].listeners();
  } else {
    return this._pipeline[this._pipeline.length-1].listeners();
  }
};

module.exports = DataSource;

},{"./ChangeSet":26,"./Collector":27,"./Node":31,"./Sentinel":32,"./Tuple":34,"vega-logging":25}],29:[function(require,module,exports){
var deps = module.exports = {
  ALL: ['data', 'fields', 'scales', 'signals']
};
deps.ALL.forEach(function(k) { deps[k.toUpperCase()] = k; });

},{}],30:[function(require,module,exports){
var Heap = require('heap'),
    util = require('datalib/src/util'),
    ChangeSet = require('./ChangeSet'),
    DataSource = require('./DataSource'),
    Collector = require('./Collector'),
    Signal = require('./Signal'),
    Deps = require('./Dependencies');

function Graph() {
}

var prototype = Graph.prototype;

prototype.init = function() {
  this._stamp = 0;
  this._rank  = 0;

  this._data = {};
  this._signals = {};

  this.doNotPropagate = {};
};

prototype.rank = function() {
  return ++this._rank;
};

prototype.data = function(name, pipeline, facet) {
  var db = this._data;
  if (!arguments.length) {
    var all = [], key;
    for (key in db) { all.push(db[key]); }
    return all;
  } else if (arguments.length === 1) {
    return db[name];
  } else {
    return (db[name] = new DataSource(this, name, facet).pipeline(pipeline));
  }
};

prototype.dataValues = function(names) {
  var data = this._data, k;
  if (!arguments.length) {
    names = [];
    for (k in data) names.push(k);
  }
  if (Array.isArray(names)) {
    return names.reduce(function(db, name) {
      return (db[name] = data[name].values(), db);
    }, {});
  } else {
    return data[names].values();
  }
};

function signal(names) {
  var m = this;
  if (Array.isArray(names)) {
    return names.map(function(name) {
      return m._signals[name];
    });
  } else {
    return this._signals[names];
  }
}

prototype.signal = function(name, init) {
  if (arguments.length === 1) {
    return signal.call(this, name);
  } else {
    return (this._signals[name] = new Signal(this, name, init));
  }
};

// TODO: separate into signalValue and signalValues?
prototype.signalValues = function(names) {
  if (!arguments.length) {
    names = [];
    for (var k in this._signals) names.push(k);
  }
  if (Array.isArray(names)) {
    var values = {};
    for (var i=0, n=names.length; i<n; ++i) {
      values[names[i]] = this._signals[names[i]].value();
    }
    return values;
  } else {
    return this._signals[names].value();
  }
};

prototype.signalRef = function(ref) {
  if (!Array.isArray(ref)) {
    ref = util.field(ref);
  }

  var value = this.signal(ref[0]).value();
  if (ref.length > 1) {
    for (var i=1, n=ref.length; i<n; ++i) {
      value = value[ref[i]];
    }
  }
  return value;
};

var schedule = function(a, b) {
  if (a.rank !== b.rank) {  
    // Topological sort
    return a.rank - b.rank;
  } else {
    // If queueing multiple pulses to the same node, then there will be
    // at most one pulse with a changeset (add/mod/rem), and the remainder
    // will be reflows. Combine the changeset and reflows into a single pulse
    // and queue that first. Subsequent reflow-only pulses will be pruned.
    var pa = a.pulse, pb = b.pulse,
        paCS = pa.add.length || pa.mod.length || pa.rem.length,
        pbCS = pb.add.length || pb.mod.length || pb.rem.length;

    pa.reflow = pb.reflow = pa.reflow || pb.reflow;

    if (paCS && pbCS) throw Error('Both pulses have changesets.');
    return paCS ? -1 : 1;
  }
};

// Stamp should be specified with caution. It is necessary for inline datasources,
// which need to be populated during the same cycle even though propagation has
// passed that part of the dataflow graph.  
prototype.propagate = function(pulse, node, stamp) {
  var v, l, n, p, r, i, len, reflowed;

  // new PQ with each propagation cycle so that we can pulse branches
  // of the dataflow graph during a propagation (e.g., when creating
  // a new inline datasource).
  var pq = new Heap(schedule); 

  if (pulse.stamp) throw Error('Pulse already has a non-zero stamp.');

  pulse.stamp = stamp || ++this._stamp;
  pq.push({node: node, pulse: pulse, rank: node.rank()});

  while (pq.size() > 0) {
    v = pq.pop();
    n = v.node;
    p = v.pulse;
    r = v.rank;
    l = n._listeners;
    reflowed = p.reflow && n.last() >= p.stamp;

    if (reflowed) continue; // Don't needlessly reflow ops.

    // A node's rank might change during a propagation (e.g. instantiating
    // a group's dataflow branch). Re-queue if it has.
    // TODO: use pq.replace or pq.poppush?
    if (r !== n.rank()) {
      pq.push({node: n, pulse: p, rank: n.rank()});
      continue;
    }

    p = this.evaluate(p, n);

    // Even if we didn't run the node, we still want to propagate the pulse. 
    if (p !== this.doNotPropagate) {
      if (!p.reflow && n.reflows()) { // If skipped eval of reflows node
        p = ChangeSet.create(p, true);
      }

      for (i=0, len=l.length; i<len; ++i) {
        pq.push({node: l[i], pulse: p, rank: l[i]._rank, src: n});
      }
    }
  }
};

// Connect a branch of dataflow nodes. 
// Dependencies are wired to the nearest collector. 
function forEachNode(branch, fn) {
  var node, collector, router, i, n;

  for (i=0, n=branch.length; i<n; ++i) {
    node = branch[i];

    // Share collectors between batch transforms. We can reuse an
    // existing collector unless a router node has come after it,
    // in which case, we splice in a new collector.
    if (!node.data && node.batch()) { /* TODO: update transforms! */
      if (router) {
        branch.splice(i, 0, (node = new Collector(this)));
      } else {
        node.data = collector.data.bind(collector);
      }
    } 

    if (node.collector()) collector = node;
    router = node.router() && !node.collector(); 
    fn(node, collector, i);
  }
}

prototype.connect = function(branch) {
  var graph = this;

  forEachNode.call(this, branch, function(n, c, i) {
    var data = n.dependency(Deps.DATA),
        signals = n.dependency(Deps.SIGNALS);

    if (data.length > 0) {
      data.forEach(function(d) { 
        graph.data(d)
          .revises(n.revises())
          .addListener(c);
      });
    }

    if (signals.length > 0) {
      signals.forEach(function(s) { graph.signal(s).addListener(c); });
    }

    if (i > 0) {
      branch[i-1].addListener(branch[i]);
    }
  });

  return branch;
};

prototype.disconnect = function(branch) {
  var graph = this;

  forEachNode.call(this, branch, function(n, c) {
    var data = n.dependency(Deps.DATA),
        signals = n.dependency(Deps.SIGNALS);

    if (data.length > 0) {
      data.forEach(function(d) { graph.data(d).removeListener(c); });
    }

    if (signals.length > 0) {
      signals.forEach(function(s) { graph.signal(s).removeListener(c); });
    }

    n.disconnect();  
  });

  return branch;
};

prototype.reevaluate = function(pulse, node) {
  var reflowed = !pulse.reflow || (pulse.reflow && node.last() >= pulse.stamp),
      run = !!pulse.add.length || !!pulse.rem.length || node.router();

  return run || !reflowed || node.reevaluate(pulse);
};

prototype.evaluate = function(pulse, node) {
  if (!this.reevaluate(pulse, node)) return pulse;
  pulse = node.evaluate(pulse);
  node.last(pulse.stamp);
  return pulse;
};

module.exports = Graph;

},{"./ChangeSet":26,"./Collector":27,"./DataSource":28,"./Dependencies":29,"./Signal":33,"datalib/src/util":22,"heap":23}],31:[function(require,module,exports){
var DEPS = require('./Dependencies').ALL,
    nodeID = 1;

function Node(graph) {
  if (graph) this.init(graph);
}

var Flags = Node.Flags = {
  Router:     0x01, // Responsible for propagating tuples, cannot be skipped.
  Collector:  0x02, // Holds a materialized dataset, pulse node to reflow.
  Revises:    0x04, // Node requires tuple previous values.
  Reflows:    0x08, // Node will forward a reflow pulse.
  Batch:      0x10  // Node performs batch data processing, needs collector.
};

var prototype = Node.prototype;

prototype.init = function(graph) {
  this._id = nodeID++;
  this._graph = graph;
  this._rank = graph.rank(); // For topologial sort
  this._stamp = 0;  // Last stamp seen

  this._listeners = [];
  this._registered = {}; // To prevent duplicate listeners

  // Initialize dependencies.
  this._deps = {};
  for (var i=0, n=DEPS.length; i<n; ++i) {
    this._deps[DEPS[i]] = [];
  }

  // Initialize status flags.
  this._flags = 0;

  return this;
};

prototype.rank = function() {
  return this._rank;
};

prototype.last = function(stamp) { 
  if (!arguments.length) return this._stamp;
  this._stamp = stamp;
  return this;
};

// -- status flags ---

prototype._setf = function(v, b) {
  if (b) { this._flags |= v; } else { this._flags &= ~v; }
  return this;
};

prototype.router = function(state) {
  if (!arguments.length) return (this._flags & Flags.Router);
  return this._setf(Flags.Router, state);
};

prototype.collector = function(state) {
  if (!arguments.length) return (this._flags & Flags.Collector);
  return this._setf(Flags.Collector, state);
};

prototype.revises = function(state) {
  if (!arguments.length) return (this._flags & Flags.Revises);
  return this._setf(Flags.Revises, state);
};

prototype.reflows = function(state) {
  if (!arguments.length) return (this._flags & Flags.Reflows);
  return this._setf(Flags.Reflows, state);
};

prototype.batch = function(state) {
  if (!arguments.length) return (this._flags & Flags.Batch);
  return this._setf(Flags.Batch, state);
};

prototype.dependency = function(type, deps) {
  var d = this._deps[type];

  if (arguments.length === 1) {
    return d;
  }

  if (deps === null) {
    // Clear dependencies of the given type
    d.splice(0, d.length);
  } else if (deps !== undefined) {
    if (!Array.isArray(deps)) {
      if (d.indexOf(deps) < 0) { d.push(deps); }
    } else {
      // TODO: singleton case checks for inclusion already
      // Should this be done here as well?
      d.push.apply(d, deps);
    }
  }

    

  return this;
};

prototype.listeners = function() {
  return this._listeners;
};

prototype.addListener = function(l) {
  if (!(l instanceof Node)) {
    throw Error('Listener is not a Node');
  }
  if (this._registered[l._id]) return this;

  this._listeners.push(l);
  this._registered[l._id] = 1;
  if (this._rank > l._rank) {
    var q = [l],
        g = this._graph, cur;
    while (q.length) {
      cur = q.shift();
      cur._rank = g.rank();
      q.push.apply(q, cur.listeners());
    }
  }

  return this;
};

prototype.removeListener = function(l) {
  var idx = this._listeners.indexOf(l),
      b = idx >= 0;

  if (b) {
    this._listeners.splice(idx, 1);
    this._registered[l._id] = null;
  }
  return b;
};

prototype.disconnect = function() {
  this._listeners = [];
  this._registered = {};
};

// Evaluate this dataflow node for the current pulse.
// Subclasses should override to perform custom processing.
prototype.evaluate = function(pulse) {
  return pulse;
};

// Should this node be re-evaluated for the current pulse?
// Searches pulse to see if any dependencies have updated.
prototype.reevaluate = function(pulse) {
  var prop, dep, i, n, j, m;

  for (i=0, n=DEPS.length; i<n; ++i) {
    prop = DEPS[i];
    dep = this._deps[prop];
    for (j=0, m=dep.length; j<m; ++j) {
      if (pulse[prop][dep[j]]) return true;
    }
  }

  return false;
};

module.exports = Node;

},{"./Dependencies":29}],32:[function(require,module,exports){
module.exports = {'sentinel': 1};

},{}],33:[function(require,module,exports){
var ChangeSet = require('./ChangeSet'),
    Node = require('./Node'), // jshint ignore:line
    Base = Node.prototype;

function Signal(graph, name, initialValue) {
  Base.init.call(this, graph);
  this._name  = name;
  this._value = initialValue;
  this._verbose = false; // Verbose signals re-pulse the graph even if prev === val.
  this._handlers = [];
  return this;
}

var prototype = (Signal.prototype = Object.create(Base));
prototype.constructor = Signal;

prototype.name = function() {
  return this._name;
};

prototype.value = function(val) {
  if (!arguments.length) return this._value;
  return (this._value = val, this);
};

prototype.verbose = function(v) {
  if (!arguments.length) return this._verbose;
  return (this._verbose = !!v, this);
};

prototype.evaluate = function(input) {
  return input.signals[this._name] ? input : this._graph.doNotPropagate;
};

prototype.fire = function(cs) {
  if (!cs) cs = ChangeSet.create(null, true);
  cs.signals[this._name] = 1;
  this._graph.propagate(cs, this);
};

prototype.on = function(handler) {
  var signal = this,
      node = new Node(this._graph);

  node.evaluate = function(input) {
    handler(signal.name(), signal.value());
    return input;
  };

  this._handlers.push({
    handler: handler,
    node: node
  });

  return this.addListener(node);
};

prototype.off = function(handler) {
  var h = this._handlers, i, x;

  for (i=h.length; --i>=0;) {
    if (!handler || h[i].handler === handler) {
      x = h.splice(i, 1)[0];
      this.removeListener(x.node);
    }
  }

  return this;
};

module.exports = Signal;

},{"./ChangeSet":26,"./Node":31}],34:[function(require,module,exports){
var util = require('datalib/src/util'),
    SENTINEL = require('./Sentinel'),
    tupleID = 0;

// Object.create is expensive. So, when ingesting, trust that the
// datum is an object that has been appropriately sandboxed from 
// the outside environment. 
function ingest(datum, prev) {
  datum = (datum === Object(datum)) ? datum : {data: datum};
  datum._id = ++tupleID;
  datum._prev = (prev !== undefined) ? (prev || SENTINEL) : undefined;
  return datum;
}

function derive(datum, prev) {
  return ingest(Object.create(datum), prev);
}

// WARNING: operators should only call this once per timestamp!
function set(t, k, v) {
  var prev = t[k];
  if (prev === v) return false;
  set_prev(t, k);
  t[k] = v;
  return true;
}

function set_prev(t, k) {
  if (t._prev === undefined) return;
  t._prev = (t._prev === SENTINEL) ? {} : t._prev;
  t._prev[k] = t[k];
}

function has_prev(t) {
  return t._prev && t._prev !== SENTINEL;
}

function reset() {
  tupleID = 0;
}

function idMap(a) {
  for (var ids={}, i=0, n=a.length; i<n; ++i) {
    ids[a[i]._id] = 1;
  }
  return ids;
}

function idFilter(data) {
  var ids = {};
  for (var i=1, len=arguments.length; i<len; ++i) {
    util.extend(ids, idMap(arguments[i]));
  }

  return data.filter(function(x) { return !ids[x._id]; });
}

module.exports = {
  ingest:   ingest,
  derive:   derive,
  set:      set,
  set_prev: set_prev,
  has_prev: has_prev,
  reset:    reset,
  idMap:    idMap,
  idFilter: idFilter
};

},{"./Sentinel":32,"datalib/src/util":22}],35:[function(require,module,exports){
module.exports = {
  ChangeSet:    require('./ChangeSet'),
  Collector:    require('./Collector'),
  DataSource:   require('./DataSource'),
  Dependencies: require('./Dependencies'),
  Graph:        require('./Graph'),
  Node:         require('./Node'),
  Sentinel:     require('./Sentinel'),
  Signal:       require('./Signal'),
  Tuple:        require('./Tuple'),
  debug:        require('vega-logging').debug
};

},{"./ChangeSet":26,"./Collector":27,"./DataSource":28,"./Dependencies":29,"./Graph":30,"./Node":31,"./Sentinel":32,"./Signal":33,"./Tuple":34,"vega-logging":25}],36:[function(require,module,exports){
function toMap(list) {
  var map = {}, i, n;
  for (i=0, n=list.length; i<n; ++i) map[list[i]] = 1;
  return map;
}

function keys(object) {
  var list = [], k;
  for (k in object) list.push(k);
  return list;
}

module.exports = function(opt) {
  opt = opt || {};
  var constants = opt.constants || require('./constants'),
      functions = (opt.functions || require('./functions'))(codegen),
      idWhiteList = opt.idWhiteList ? toMap(opt.idWhiteList) : null,
      idBlackList = opt.idBlackList ? toMap(opt.idBlackList) : null,
      memberDepth = 0,
      FIELD_VAR = opt.fieldVar || 'datum',
      GLOBAL_VAR = opt.globalVar || 'signals',
      globals = {},
      fields = {};

  function codegen_wrap(ast) {    
    var retval = {
      code: codegen(ast),
      globals: keys(globals),
      fields: keys(fields)
    };
    globals = {};
    fields = {};
    return retval;
  }

  function lookupGlobal(id) {
    return GLOBAL_VAR + '["' + id + '"]';
  }

  function codegen(ast) {
    if (typeof ast === 'string') return ast;
    var generator = CODEGEN_TYPES[ast.type];
    if (generator == null) {
      throw new Error('Unsupported type: ' + ast.type);
    }
    return generator(ast);
  }

  var CODEGEN_TYPES = {
    'Literal': function(n) {
        return n.raw;
      },
    'Identifier': function(n) {
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
            globals[id] = 1;
            return lookupGlobal(id);
          }
        }
        if (idBlackList && idBlackList.hasOwnProperty(id)) {
          throw new Error('Illegal identifier: ' + id);
        }
        return id;
      },
    'Program': function(n) {
        return n.body.map(codegen).join('\n');
      },
    'MemberExpression': function(n) {
        var d = !n.computed;
        var o = codegen(n.object);
        if (d) memberDepth += 1;
        var p = codegen(n.property);
        if (o === FIELD_VAR) { fields[p] = 1; } // HACKish...
        if (d) memberDepth -= 1;
        return o + (d ? '.'+p : '['+p+']');
      },
    'CallExpression': function(n) {
        if (n.callee.type !== 'Identifier') {
          throw new Error('Illegal callee type: ' + n.callee.type);
        }
        var callee = n.callee.name;
        var args = n.arguments;
        var fn = functions.hasOwnProperty(callee) && functions[callee];
        if (!fn) throw new Error('Unrecognized function: ' + callee);
        return fn instanceof Function ?
          fn(args) :
          fn + '(' + args.map(codegen).join(',') + ')';
      },
    'ArrayExpression': function(n) {
        return '[' + n.elements.map(codegen).join(',') + ']';
      },
    'BinaryExpression': function(n) {
        return '(' + codegen(n.left) + n.operator + codegen(n.right) + ')';
      },
    'UnaryExpression': function(n) {
        return '(' + n.operator + codegen(n.argument) + ')';
      },
    'ConditionalExpression': function(n) {
        return '(' + codegen(n.test) +
          '?' + codegen(n.consequent) +
          ':' + codegen(n.alternate) +
          ')';
      },
    'LogicalExpression': function(n) {
        return '(' + codegen(n.left) + n.operator + codegen(n.right) + ')';
      },
    'ObjectExpression': function(n) {
        return '{' + n.properties.map(codegen).join(',') + '}';
      },
    'Property': function(n) {
        memberDepth += 1;
        var k = codegen(n.key);
        memberDepth -= 1;
        return k + ':' + codegen(n.value);
      },
    'ExpressionStatement': function(n) {
        return codegen(n.expression);
      }
  };
  
  return codegen_wrap;
};

},{"./constants":37,"./functions":38}],37:[function(require,module,exports){
module.exports = {
  'NaN':     'NaN',
  'E':       'Math.E',
  'LN2':     'Math.LN2',
  'LN10':    'Math.LN10',
  'LOG2E':   'Math.LOG2E',
  'LOG10E':  'Math.LOG10E',
  'PI':      'Math.PI',
  'SQRT1_2': 'Math.SQRT1_2',
  'SQRT2':   'Math.SQRT2'
};
},{}],38:[function(require,module,exports){
module.exports = function(codegen) {

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
  
  var DATE = 'new Date';
  var STRING = 'String';
  var REGEXP = 'RegExp';

  return {
    // MATH functions
    'isNaN':    'isNaN',
    'isFinite': 'isFinite',
    'abs':      'Math.abs',
    'acos':     'Math.acos',
    'asin':     'Math.asin',
    'atan':     'Math.atan',
    'atan2':    'Math.atan2',
    'ceil':     'Math.ceil',
    'cos':      'Math.cos',
    'exp':      'Math.exp',
    'floor':    'Math.floor',
    'log':      'Math.log',
    'max':      'Math.max',
    'min':      'Math.min',
    'pow':      'Math.pow',
    'random':   'Math.random',
    'round':    'Math.round',
    'sin':      'Math.sin',
    'sqrt':     'Math.sqrt',
    'tan':      'Math.tan',

    'clamp': function(args) {
      if (args.length < 3)
        throw new Error('Missing arguments to clamp function.');
      if (args.length > 3)
      throw new Error('Too many arguments to clamp function.');
      var a = args.map(codegen);
      return 'Math.max('+a[1]+', Math.min('+a[2]+','+a[0]+'))';
    },

    // DATE functions
    'now':      'Date.now',
    'datetime': 'new Date',
    'date': function(args) {
        return fncall('getDate', args, DATE, 0);
      },
    'day': function(args) {
        return fncall('getDay', args, DATE, 0);
      },
    'year': function(args) {
        return fncall('getFullYear', args, DATE, 0);
      },
    'month': function(args) {
        return fncall('getMonth', args, DATE, 0);
      },
    'hours': function(args) {
        return fncall('getHours', args, DATE, 0);
      },
    'minutes': function(args) {
        return fncall('getMinutes', args, DATE, 0);
      },
    'seconds': function(args) {
        return fncall('getSeconds', args, DATE, 0);
      },
    'milliseconds': function(args) {
        return fncall('getMilliseconds', args, DATE, 0);
      },
    'time': function(args) {
        return fncall('getTime', args, DATE, 0);
      },
    'timezoneoffset': function(args) {
        return fncall('getTimezoneOffset', args, DATE, 0);
      },
    'utcdate': function(args) {
        return fncall('getUTCDate', args, DATE, 0);
      },
    'utcday': function(args) {
        return fncall('getUTCDay', args, DATE, 0);
      },
    'utcyear': function(args) {
        return fncall('getUTCFullYear', args, DATE, 0);
      },
    'utcmonth': function(args) {
        return fncall('getUTCMonth', args, DATE, 0);
      },
    'utchours': function(args) {
        return fncall('getUTCHours', args, DATE, 0);
      },
    'utcminutes': function(args) {
        return fncall('getUTCMinutes', args, DATE, 0);
      },
    'utcseconds': function(args) {
        return fncall('getUTCSeconds', args, DATE, 0);
      },
    'utcmilliseconds': function(args) {
        return fncall('getUTCMilliseconds', args, DATE, 0);
      },

    // shared sequence functions
    'length': function(args) {
        return fncall('length', args, null, -1);
      },
    'indexof': function(args) {
        return fncall('indexOf', args, null);
      },
    'lastindexof': function(args) {
        return fncall('lastIndexOf', args, null);
      },

    // STRING functions
    'parseFloat': 'parseFloat',
    'parseInt': 'parseInt',
    'upper': function(args) {
        return fncall('toUpperCase', args, STRING, 0);
      },
    'lower': function(args) {
        return fncall('toLowerCase', args, STRING, 0);
      },
    'slice': function(args) {
        return fncall('slice', args, STRING);
      },
    'substring': function(args) {
        return fncall('substring', args, STRING);
      },

    // REGEXP functions
    'test': function(args) {
        return fncall('test', args, REGEXP);
      },
    
    // Control Flow functions
    'if': function(args) {
        if (args.length < 3)
          throw new Error('Missing arguments to if function.');
        if (args.length > 3)
        throw new Error('Too many arguments to if function.');
        var a = args.map(codegen);
        return a[0]+'?'+a[1]+':'+a[2];
      }
  };
};
},{}],39:[function(require,module,exports){
var parser = require('./parser'),
    codegen = require('./codegen');
    
var expr = module.exports = {
  parse: function(input, opt) {
      return parser.parse('('+input+')', opt);
    },
  code: function(opt) {
      return codegen(opt);
    },
  compiler: function(args, opt) {
      args = args.slice();
      var generator = codegen(opt),
          len = args.length;
      return function(str) {
        var value = generator(expr.parse(str));
        args[len] = '"use strict"; return (' + value.code + ');';
        value.fn = Function.apply(null, args);
        return value;
      };
    },
  functions: require('./functions'),
  constants: require('./constants')
};

},{"./codegen":36,"./constants":37,"./functions":38,"./parser":40}],40:[function(require,module,exports){
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
/* istanbul ignore next */
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
      UnaryExpression: 'UnaryExpression'
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
          this.type = Syntax.UnaryExpression;
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
      var token, key, id, value, node = new Node();

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
      var properties = [], property, name, key, kind, map = {}, toString = String, node = new Node();

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

  // 11.3 Postfix Expressions

  function parsePostfixExpression() {
      var expr = parseLeftHandSideExpressionAllowCall();

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
      var oldParenthesisCount, token, expr, startToken;

      oldParenthesisCount = state.parenthesisCount;

      startToken = lookahead;
      token = lookahead;

      expr = parseConditionalExpression();

      return expr;
  }

  // 11.14 Comma Operator

  function parseExpression() {
      var expr = parseAssignmentExpression();

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
arguments[4][25][0].apply(exports,arguments)
},{"dup":25}],42:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13,"fs":2,"request":2,"sync-request":2,"url":2}],43:[function(require,module,exports){
var segmentCache = {},
    bezierCache = {},
    join = [].join;

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

module.exports = {
  segments: segments,
  bezier: bezier,
  cache: {
    segments: segmentCache,
    bezier: bezierCache
  }
};

},{}],44:[function(require,module,exports){
var arc = require('./arc');

module.exports = function(path, bounds) {
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
      i, len;

  for (i=0, len=path.length; i<len; ++i) {
    current = path[i];

    switch (current[0]) { // command

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
        x = tempX;
        y = tempY;
        bounds.add(current[1], current[2]);
        bounds.add(controlX, controlY);
        bounds.add(tempX, tempY);
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
};

function boundArc(x, y, coords, bounds) {
  var seg = arc.segments(
    coords[5], // ex
    coords[6], // ey
    coords[0], // rx
    coords[1], // ry
    coords[3], // large
    coords[4], // sweep
    coords[2], // rot
    x, y
  );
  for (var i=0; i<seg.length; ++i) {
    var bez = arc.bezier(seg[i]);
    bounds.add(bez[0], bez[1]);
    bounds.add(bez[2], bez[3]);
    bounds.add(bez[4], bez[5]);
  }
}

},{"./arc":43}],45:[function(require,module,exports){
module.exports = {
  parse:  require('./parse'),
  render: require('./render'),
  bounds: require('./bounds')
};

},{"./bounds":44,"./parse":46,"./render":47}],46:[function(require,module,exports){
// Path parsing and rendering code adapted from fabric.js -- Thanks!
var cmdlen = { m:2, l:2, h:1, v:1, c:6, s:4, q:4, t:2, a:7 },
    regexp = [/([MLHVCSQTAZmlhvcsqtaz])/g, /###/, /(\d)-/g, /\s|,|###/];

module.exports = function(pathstr) {
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
      .replace(regexp[2],'$1###-')
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

},{}],47:[function(require,module,exports){
var arc = require('./arc');

module.exports = function(g, path, l, t) {
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

  g.beginPath();

  for (var i=0, len=path.length; i<len; ++i) {
    current = path[i];

    switch (current[0]) { // first letter

      case 'l': // lineto, relative
        x += current[1];
        y += current[2];
        g.lineTo(x + l, y + t);
        break;

      case 'L': // lineto, absolute
        x = current[1];
        y = current[2];
        g.lineTo(x + l, y + t);
        break;

      case 'h': // horizontal lineto, relative
        x += current[1];
        g.lineTo(x + l, y + t);
        break;

      case 'H': // horizontal lineto, absolute
        x = current[1];
        g.lineTo(x + l, y + t);
        break;

      case 'v': // vertical lineto, relative
        y += current[1];
        g.lineTo(x + l, y + t);
        break;

      case 'V': // verical lineto, absolute
        y = current[1];
        g.lineTo(x + l, y + t);
        break;

      case 'm': // moveTo, relative
        x += current[1];
        y += current[2];
        g.moveTo(x + l, y + t);
        break;

      case 'M': // moveTo, absolute
        x = current[1];
        y = current[2];
        g.moveTo(x + l, y + t);
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

        g.quadraticCurveTo(
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
        ]);
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
        ]);
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
};

function drawArc(g, x, y, coords) {
  var seg = arc.segments(
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
    var bez = arc.bezier(seg[i]);
    g.bezierCurveTo.apply(g, bez);
  }
}

},{"./arc":43}],48:[function(require,module,exports){
function Handler() {
  this._active = null;
  this._handlers = {};
}

var prototype = Handler.prototype;

prototype.initialize = function(el, pad, obj) {
  this._el = el;
  this._obj = obj || null;
  return this.padding(pad);
};

prototype.element = function() {
  return this._el;
};

prototype.padding = function(pad) {
  this._padding = pad || {top:0, left:0, bottom:0, right:0};
  return this;
};

prototype.scene = function(scene) {
  if (!arguments.length) return this._scene;
  this._scene = scene;
  return this;
};

// add an event handler
// subclasses should override
prototype.on = function(/*type, handler*/) {};

// remove an event handler
// subclasses should override
prototype.off = function(/*type, handler*/) {};

// return an array with all registered event handlers
prototype.handlers = function() {
  var h = this._handlers, a = [], k;
  for (k in h) { a.push.apply(a, h[k]); }
  return a;
};

prototype.eventName = function(name) {
  var i = name.indexOf('.');
  return i < 0 ? name : name.slice(0,i);
};

module.exports = Handler;
},{}],49:[function(require,module,exports){
function Renderer() {
  this._el = null;
  this._bgcolor = null;
}

var prototype = Renderer.prototype;

prototype.initialize = function(el, width, height, padding) {
  this._el = el;
  return this.resize(width, height, padding);
};

prototype.element = function() {
  return this._el;
};

prototype.background = function(bgcolor) {
  if (arguments.length === 0) return this._bgcolor;
  this._bgcolor = bgcolor;
  return this;
};

prototype.resize = function(width, height, padding) {
  this._width = width;
  this._height = height;
  this._padding = padding || {top:0, left:0, bottom:0, right:0};
  return this;
};

prototype.render = function(/*scene, items*/) {
  return this;
};

module.exports = Renderer;
},{}],50:[function(require,module,exports){
var DOM = require('../../util/dom'),
    Handler = require('../Handler'),
    marks = require('./marks');

function CanvasHandler() {
  Handler.call(this);
  this._down = null;
  this._touch = null;
  this._first = true;
}

var base = Handler.prototype;
var prototype = (CanvasHandler.prototype = Object.create(base));
prototype.constructor = CanvasHandler;

prototype.initialize = function(el, pad, obj) {
  // add event listeners
  var canvas = this._canvas = DOM.find(el, 'canvas'),
      that = this;
  this.events.forEach(function(type) {
    canvas.addEventListener(type, function(evt) {
      if (prototype[type]) {
        prototype[type].call(that, evt);
      } else {
        that.fire(type, evt);
      }
    });
  });

  this._rect = this._canvas.getBoundingClientRect();
  return base.initialize.call(this, el, pad, obj);
};

prototype.canvas = function() {
  return this._canvas;
};

// retrieve the current canvas context
prototype.context = function() {
  return this._canvas.getContext('2d');
};

// supported events
prototype.events = [
  'keydown',
  'keypress',
  'keyup',
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

// to keep firefox happy
prototype.DOMMouseScroll = function(evt) {
  this.fire('mousewheel', evt);
};

prototype.mousemove = function(evt) {
  var a = this._active,
      p = this.pickEvent(evt);

  if (p === a) {
    // active item and picked item are the same
    this.fire('mousemove', evt); // fire move
  } else {
    // active item and picked item are different
    this.fire('mouseout', evt);  // fire out for prior active item
    this._active = p;            // set new active item
    this.fire('mouseover', evt); // fire over for new active item
    this.fire('mousemove', evt); // fire move for new active item
  }
};

prototype.mouseout = function(evt) {
  this.fire('mouseout', evt);
  this._active = null;
};

prototype.mousedown = function(evt) {
  this._down = this._active;
  this.fire('mousedown', evt);
};

prototype.click = function(evt) {
  if (this._down === this._active) {
    this.fire('click', evt);
    this._down = null;
  }
};

prototype.touchstart = function(evt) {
  this._touch = this.pickEvent(evt.changedTouches[0]);

  if (this._first) {
    this._active = this._touch;
    this._first = false;
  }

  this.fire('touchstart', evt, true);
};

prototype.touchmove = function(evt) {
  this.fire('touchmove', evt, true);
};

prototype.touchend = function(evt) {
  this.fire('touchend', evt, true);
  this._touch = null;
};

// fire an event
prototype.fire = function(type, evt, touch) {
  var a = touch ? this._touch : this._active,
      h = this._handlers[type], i, len;
  if (h) {
    evt.vegaType = type;
    for (i=0, len=h.length; i<len; ++i) {
      h[i].handler.call(this._obj, evt, a);
    }
  }
};

// add an event handler
prototype.on = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers;
  (h[name] || (h[name] = [])).push({
    type: type,
    handler: handler
  });
  return this;
};

// remove an event handler
prototype.off = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers[name], i;
  if (!h) return;
  for (i=h.length; --i>=0;) {
    if (h[i].type !== type) continue;
    if (!handler || h[i].handler === handler) h.splice(i, 1);
  }
  return this;
};

prototype.pickEvent = function(evt) {
  var pad = this._padding, x, y;
  return this.pick(this._scene,
    x = (evt.clientX - this._rect.left),
    y = (evt.clientY - this._rect.top),
    x - pad.left, y - pad.top);
};

// find the scenegraph item at the current mouse position
// x, y -- the absolute x, y mouse coordinates on the canvas element
// gx, gy -- the relative coordinates within the current group
prototype.pick = function(scene, x, y, gx, gy) {
  var g = this.context(),
      mark = marks[scene.marktype];
  return mark.pick.call(this, g, scene, x, y, gx, gy);
};

module.exports = CanvasHandler;

},{"../../util/dom":76,"../Handler":48,"./marks":57}],51:[function(require,module,exports){
var DOM = require('../../util/dom'),
    Bounds = require('../../util/Bounds'),
    ImageLoader = require('../../util/ImageLoader'),
    Canvas = require('../../util/canvas'),
    Renderer = require('../Renderer'),
    marks = require('./marks');

function CanvasRenderer(loadConfig) {
  Renderer.call(this);
  this._loader = new ImageLoader(loadConfig);
}

var base = Renderer.prototype;
var prototype = (CanvasRenderer.prototype = Object.create(base));
prototype.constructor = CanvasRenderer;

prototype.initialize = function(el, width, height, padding) {
  this._canvas = Canvas.instance(width, height);
  if (el) {
    DOM.clear(el, 0).appendChild(this._canvas);
    this._canvas.setAttribute('class', 'marks');
  }
  return base.initialize.call(this, el, width, height, padding);
};

prototype.resize = function(width, height, padding) {
  base.resize.call(this, width, height, padding);
  Canvas.resize(this._canvas, this._width, this._height, this._padding);
  return this;
};

prototype.canvas = function() {
  return this._canvas;
};

prototype.context = function() {
  return this._canvas ? this._canvas.getContext('2d') : null;
};

prototype.pendingImages = function() {
  return this._loader.pending();
};

function clipToBounds(g, items) {
  if (!items) return null;

  var b = new Bounds(), i, n, item, mark, group;
  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = item.mark;
    group = mark.group;
    item = marks[mark.marktype].nested ? mark : item;
    b.union(translate(item.bounds, group));
    if (item['bounds:prev']) {
      b.union(translate(item['bounds:prev'], group));
    }
  }
  b.round();

  g.beginPath();
  g.rect(b.x1, b.y1, b.width(), b.height());
  g.clip();

  return b;
}

function translate(bounds, group) {
  if (group == null) return bounds;
  var b = bounds.clone();
  for (; group != null; group = group.mark.group) {
    b.translate(group.x || 0, group.y || 0);
  }
  return b;
}

prototype.render = function(scene, items) {
  var g = this.context(),
      p = this._padding,
      w = this._width + p.left + p.right,
      h = this._height + p.top + p.bottom,
      b;

  // setup
  this._scene = scene; // cache scene for async redraw
  g.save();
  b = clipToBounds(g, items);
  this.clear(-p.left, -p.top, w, h);

  // render
  this.draw(g, scene, b);
  
  // takedown
  g.restore();
  this._scene = null; // clear scene cache

  return this;
};

prototype.draw = function(ctx, scene, bounds) {
  var mark = marks[scene.marktype];
  mark.draw.call(this, ctx, scene, bounds);
};

prototype.clear = function(x, y, w, h) {
  var g = this.context();
  g.clearRect(x, y, w, h);
  if (this._bgcolor != null) {
    g.fillStyle = this._bgcolor;
    g.fillRect(x, y, w, h); 
  }
};

prototype.loadImage = function(uri) {
  var renderer = this,
      scene = this._scene;
  return this._loader.loadImage(uri, function() {
    renderer.renderAsync(scene);
  });
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
  }, 10);
};

module.exports = CanvasRenderer;

},{"../../util/Bounds":70,"../../util/ImageLoader":72,"../../util/canvas":75,"../../util/dom":76,"../Renderer":49,"./marks":57}],52:[function(require,module,exports){
module.exports = {
  Handler:  require('./CanvasHandler'),
  Renderer: require('./CanvasRenderer')
};
},{"./CanvasHandler":50,"./CanvasRenderer":51}],53:[function(require,module,exports){
var util = require('./util');
var halfpi = Math.PI / 2;

function path(g, o) {
  var x = o.x || 0,
      y = o.y || 0,
      ir = o.innerRadius || 0,
      or = o.outerRadius || 0,
      sa = (o.startAngle || 0) - halfpi,
      ea = (o.endAngle || 0) - halfpi;
  g.beginPath();
  if (ir === 0) g.moveTo(x, y);
  else g.arc(x, y, ir, sa, ea, 0);
  g.arc(x, y, or, ea, sa, 1);
  g.closePath();
}

module.exports = {
  draw: util.drawAll(path),
  pick: util.pickPath(path)
};
},{"./util":64}],54:[function(require,module,exports){
var util = require('./util'),
    parse = require('../../../path/parse'),
    render = require('../../../path/render'),
    areaPath = require('../../../util/svg').path.area;

function path(g, items) {
  var o = items[0],
      p = o.pathCache || (o.pathCache = parse(areaPath(items)));
  render(g, p);
}

function pick(g, scene, x, y, gx, gy) {
  var items = scene.items,
      b = scene.bounds;

  if (!items || !items.length || b && !b.contains(gx, gy)) {
    return null;
  }

  if (g.pixelratio != null && g.pixelratio !== 1) {
    x *= g.pixelratio;
    y *= g.pixelratio;
  }
  return hit(g, items, x, y) ? items[0] : null;
}

var hit = util.testPath(path);

module.exports = {
  draw: util.drawOne(path),
  pick: pick,
  nested: true
};

},{"../../../path/parse":46,"../../../path/render":47,"../../../util/svg":78,"./util":64}],55:[function(require,module,exports){
var util = require('./util'),
    rect = require('./rect');

function draw(g, scene, bounds) {
  if (!scene.items || !scene.items.length) return;

  var groups = scene.items,
      renderer = this,
      group, items, axes, legends, gx, gy, i, n, j, m;

  rect.draw.call(renderer, g, scene, bounds);

  for (i=0, n=groups.length; i<n; ++i) {
    group = groups[i];
    axes = group.axisItems || [];
    items = group.items || [];
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
      if (axes[j].layer === 'back') {
        renderer.draw(g, axes[j], bounds);
      }
    }
    for (j=0, m=items.length; j<m; ++j) {
      renderer.draw(g, items[j], bounds);
    }
    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].layer !== 'back') {
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

function hit(g, o) {
  return o.fill || o.stroke;
}

function pick(g, scene, x, y, gx, gy) {
  if (scene.bounds && !scene.bounds.contains(gx, gy)) {
    return null;
  }
  var items = scene.items || [],
      subscene, group, hits, dx, dy, i, j;

  for (i=items.length; --i>=0;) {
    group = items[i];
    dx = group.x || 0;
    dy = group.y || 0;

    g.save();
    g.translate(dx, dy);
    for (j=group.items.length; --j >= 0;) {
      subscene = group.items[j];
      if (subscene.interactive === false) continue;
      hits = this.pick(subscene, x, y, gx-dx, gy-dy);
      if (hits) {
        g.restore();
        return hits;
      }
    }
    g.restore();
  }

  return scene.interactive !== false ? pickSelf(g, scene, x, y, gx, gy) : null;
}

var pickSelf = util.pick(hit);

module.exports = {
  draw: draw,
  pick: pick
};

},{"./rect":60,"./util":64}],56:[function(require,module,exports){
var util = require('./util');

function draw(g, scene, bounds) {
  if (!scene.items || !scene.items.length) return;

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

    var x = o.x || 0,
        y = o.y || 0,
        w = o.width || (o.image && o.image.width) || 0,
        h = o.height || (o.image && o.image.height) || 0,
        opac;
    x = x - (o.align==='center' ? w/2 : o.align==='right' ? w : 0);
    y = y - (o.baseline==='middle' ? h/2 : o.baseline==='bottom' ? h : 0);

    if (o.image.loaded) {
      g.globalAlpha = (opac = o.opacity) != null ? opac : 1;
      g.drawImage(o.image, x, y, w, h);
    }
  }
}

module.exports = {
  draw: draw,
  pick: util.pick()
};
},{"./util":64}],57:[function(require,module,exports){
module.exports = {
  arc:    require('./arc'),
  area:   require('./area'),
  group:  require('./group'),
  image:  require('./image'),
  line:   require('./line'),
  path:   require('./path'),
  rect:   require('./rect'),
  rule:   require('./rule'),
  symbol: require('./symbol'),
  text:   require('./text')
};

},{"./arc":53,"./area":54,"./group":55,"./image":56,"./line":58,"./path":59,"./rect":60,"./rule":61,"./symbol":62,"./text":63}],58:[function(require,module,exports){
var util = require('./util'),
    parse = require('../../../path/parse'),
    render = require('../../../path/render'),
    linePath = require('../../../util/svg').path.line;
    
function path(g, items) {
  var o = items[0],
      p = o.pathCache || (o.pathCache = parse(linePath(items)));
  render(g, p);
}

function pick(g, scene, x, y, gx, gy) {
  var items = scene.items,
      b = scene.bounds;

  if (!items || !items.length || b && !b.contains(gx, gy)) {
    return null;
  }

  if (g.pixelratio != null && g.pixelratio !== 1) {
    x *= g.pixelratio;
    y *= g.pixelratio;
  }
  return hit(g, items, x, y) ? items[0] : null;
}

var hit = util.testPath(path, false);

module.exports = {
  draw: util.drawOne(path),
  pick: pick,
  nested: true
};

},{"../../../path/parse":46,"../../../path/render":47,"../../../util/svg":78,"./util":64}],59:[function(require,module,exports){
var util = require('./util'),
    parse = require('../../../path/parse'),
    render = require('../../../path/render');

function path(g, o) {
  if (o.path == null) return true;
  var p = o.pathCache || (o.pathCache = parse(o.path));
  render(g, p, o.x, o.y);
}

module.exports = {
  draw: util.drawAll(path),
  pick: util.pickPath(path)
};

},{"../../../path/parse":46,"../../../path/render":47,"./util":64}],60:[function(require,module,exports){
var util = require('./util');

function draw(g, scene, bounds) {
  if (!scene.items || !scene.items.length) return;

  var items = scene.items,
      o, opac, x, y, w, h;

  for (var i=0, len=items.length; i<len; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds))
      continue; // bounds check

    opac = o.opacity == null ? 1 : o.opacity;
    if (opac === 0) continue;

    x = o.x || 0;
    y = o.y || 0;
    w = o.width || 0;
    h = o.height || 0;

    if (o.fill && util.fill(g, o, opac)) {
      g.fillRect(x, y, w, h);
    }
    if (o.stroke && util.stroke(g, o, opac)) {
      g.strokeRect(x, y, w, h);
    }
  }
}

module.exports = {
  draw: draw,
  pick: util.pick()
};
},{"./util":64}],61:[function(require,module,exports){
var util = require('./util');

function draw(g, scene, bounds) {
  if (!scene.items || !scene.items.length) return;

  var items = scene.items,
      o, opac, x1, y1, x2, y2;

  for (var i=0, len=items.length; i<len; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds))
      continue; // bounds check

    opac = o.opacity == null ? 1 : o.opacity;
    if (opac === 0) continue;
      
    x1 = o.x || 0;
    y1 = o.y || 0;
    x2 = o.x2 != null ? o.x2 : x1;
    y2 = o.y2 != null ? o.y2 : y1;

    if (o.stroke && util.stroke(g, o, opac)) {
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
    }
  }
}

function stroke(g, o) {
  var x1 = o.x || 0,
      y1 = o.y || 0,
      x2 = o.x2 != null ? o.x2 : x1,
      y2 = o.y2 != null ? o.y2 : y1,
      lw = o.strokeWidth,
      lc = o.strokeCap;

  g.lineWidth = lw != null ? lw : 1;
  g.lineCap   = lc != null ? lc : 'butt';
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
}

function hit(g, o, x, y) {
  if (!g.isPointInStroke) return false;
  stroke(g, o);
  return g.isPointInStroke(x, y);
}

module.exports = {
  draw: draw,
  pick: util.pick(hit)
};

},{"./util":64}],62:[function(require,module,exports){
var util = require('./util');

var sqrt3 = Math.sqrt(3),
    tan30 = Math.tan(30 * Math.PI / 180);

function path(g, o) {
  var size = o.size != null ? o.size : 100,
      x = o.x, y = o.y, r, t, rx, ry;

  g.beginPath();

  if (o.shape == null || o.shape === 'circle') {
    r = Math.sqrt(size / Math.PI);
    g.arc(x, y, r, 0, 2*Math.PI, 0);
    g.closePath();
    return;
  }

  switch (o.shape) {
    case 'cross':
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

    case 'diamond':
      ry = Math.sqrt(size / (2 * tan30));
      rx = ry * tan30;
      g.moveTo(x, y-ry);
      g.lineTo(x+rx, y);
      g.lineTo(x, y+ry);
      g.lineTo(x-rx, y);
      break;

    case 'square':
      t = Math.sqrt(size);
      r = t / 2;
      g.rect(x-r, y-r, t, t);
      break;

    case 'triangle-down':
      rx = Math.sqrt(size / sqrt3);
      ry = rx * sqrt3 / 2;
      g.moveTo(x, y+ry);
      g.lineTo(x+rx, y-ry);
      g.lineTo(x-rx, y-ry);
      break;

    case 'triangle-up':
      rx = Math.sqrt(size / sqrt3);
      ry = rx * sqrt3 / 2;
      g.moveTo(x, y-ry);
      g.lineTo(x+rx, y+ry);
      g.lineTo(x-rx, y+ry);
  }
  g.closePath();
}

module.exports = {
  draw: util.drawAll(path),
  pick: util.pickPath(path)
};
},{"./util":64}],63:[function(require,module,exports){
var Bounds = require('../../../util/Bounds'),
    textBounds = require('../../../util/bound').text,
    font = require('../../../util/font'),
    util = require('./util'),
    tempBounds = new Bounds();

function draw(g, scene, bounds) {
  if (!scene.items || !scene.items.length) return;

  var items = scene.items,
      o, opac, x, y, r, t;

  for (var i=0, len=items.length; i<len; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds))
      continue; // bounds check

    opac = o.opacity == null ? 1 : o.opacity;
    if (opac === 0) continue;

    g.font = font.string(o);
    g.textAlign = o.align || 'left';

    x = (o.x || 0);
    y = (o.y || 0);
    if ((r = o.radius)) {
      t = (o.theta || 0) - Math.PI/2;
      x += r * Math.cos(t);
      y += r * Math.sin(t);
    }

    if (o.angle) {
      g.save();
      g.translate(x, y);
      g.rotate(o.angle * Math.PI/180);
      x = y = 0; // reset x, y
    }
    x += (o.dx || 0);
    y += (o.dy || 0) + font.offset(o);

    if (o.fill && util.fill(g, o, opac)) {
      g.fillText(o.text, x, y);
    }
    if (o.stroke && util.stroke(g, o, opac)) {
      g.strokeText(o.text, x, y);
    }
    if (o.angle) g.restore();
  }
}

function hit(g, o, x, y, gx, gy) {
  if (o.fontSize <= 0) return false;
  if (!o.angle) return true; // bounds sufficient if no rotation

  // project point into space of unrotated bounds
  var b = textBounds(o, tempBounds, true),
      a = -o.angle * Math.PI / 180,
      cos = Math.cos(a),
      sin = Math.sin(a),
      ox = o.x,
      oy = o.y,
      px = cos*gx - sin*gy + (ox - ox*cos + oy*sin),
      py = sin*gx + cos*gy + (oy - ox*sin - oy*cos);

  return b.contains(px, py);
}

module.exports = {
  draw: draw,
  pick: util.pick(hit)
};

},{"../../../util/Bounds":70,"../../../util/bound":74,"../../../util/font":77,"./util":64}],64:[function(require,module,exports){
function drawPathOne(path, g, o, items) {
  if (path(g, items)) return;

  var opac = o.opacity == null ? 1 : o.opacity;
  if (opac===0) return;

  if (o.fill && fill(g, o, opac)) { g.fill(); }
  if (o.stroke && stroke(g, o, opac)) { g.stroke(); }
}

function drawPathAll(path, g, scene, bounds) {
  var i, len, item;
  for (i=0, len=scene.items.length; i<len; ++i) {
    item = scene.items[i];
    if (!bounds || bounds.intersects(item.bounds)) {
      drawPathOne(path, g, item, item);
    }
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
    if (!bounds || bounds.intersects(scene.bounds)) {
      drawPathOne(pathFunc, g, scene.items[0], scene.items);
    }
  };
}

function pick(test) {
  if (!test) test = function() { return true; };

  return function(g, scene, x, y, gx, gy) {
    if (!scene.items.length) return null;

    var o, b, i;

    if (g.pixelratio != null && g.pixelratio !== 1) {
      x *= g.pixelratio;
      y *= g.pixelratio;
    }

    for (i=scene.items.length; --i >= 0;) {
      o = scene.items[i]; b = o.bounds;
      // first hit test against bounding box
      if ((b && !b.contains(gx, gy)) || !b) continue;
      // if in bounding box, perform more careful test
      if (test(g, o, x, y, gx, gy)) return o;
    }
    return null;
  };
}

function testPath(path, fill) {
  return function(g, o, x, y) {
    var item = Array.isArray(o) ? o[0] : o,
        stroke = item.stroke && g.isPointInStroke, lw, lc;
    fill = (fill == null) ? item.fill : fill;

    if (stroke) {
      lw = item.strokeWidth;
      lc = item.strokeCap;
      g.lineWidth = lw != null ? lw : 1;
      g.lineCap   = lc != null ? lc : 'butt';
    }

    return path(g, o) ? false :
      (fill && g.isPointInPath(x, y)) ||
      (stroke && g.isPointInStroke(x, y));
  };
}

function pickPath(path) {
  return pick(testPath(path));
}

function fill(g, o, opacity) {
  opacity *= (o.fillOpacity==null ? 1 : o.fillOpacity);
  if (opacity > 0) {
    g.globalAlpha = opacity;
    g.fillStyle = color(g, o, o.fill);
    return true;
  } else {
    return false;
  }
}

function stroke(g, o, opacity) {
  var lw = (lw = o.strokeWidth) != null ? lw : 1, lc;
  if (lw <= 0) return false;

  opacity *= (o.strokeOpacity==null ? 1 : o.strokeOpacity);
  if (opacity > 0) {
    g.globalAlpha = opacity;
    g.strokeStyle = color(g, o, o.stroke);
    g.lineWidth = lw;
    g.lineCap = (lc = o.strokeCap) != null ? lc : 'butt';
    g.vgLineDash(o.strokeDash || null);
    g.vgLineDashOffset(o.strokeDashOffset || 0);
    return true;
  } else {
    return false;
  }
}

function color(g, o, value) {
  return (value.id) ?
    gradient(g, value, o.bounds) :
    value;
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

module.exports = {
  drawOne:  drawOne,
  drawAll:  drawAll,
  pick:     pick,
  pickPath: pickPath,
  testPath: testPath,
  stroke:   stroke,
  fill:     fill,
  color:    color,
  gradient: gradient
};

},{}],65:[function(require,module,exports){
var DOM = require('../../util/dom'),
    Handler = require('../Handler');

function SVGHandler() {
  Handler.call(this);
}

var base = Handler.prototype;
var prototype = (SVGHandler.prototype = Object.create(base));
prototype.constructor = SVGHandler;

prototype.initialize = function(el, pad, obj) {
  this._svg = DOM.find(el, 'svg');
  return base.initialize.call(this, el, pad, obj);
};

prototype.svg = function() {
  return this._svg;
};

// wrap an event listener for the SVG DOM
prototype.listener = function(handler) {
  var that = this;
  return function(evt) {
    var target = evt.target,
        item = target.__data__;
    evt.vegaType = evt.type;
    item = Array.isArray(item) ? item[0] : item;
    handler.call(that._obj, evt, item);
  };
};

// add an event handler
prototype.on = function(type, handler) {
  var name = this.eventName(type),
      svg = this._svg,
      h = this._handlers,
      x = {
        type:     type,
        handler:  handler,
        listener: this.listener(handler)
      };

  (h[name] || (h[name] = [])).push(x);
  svg.addEventListener(name, x.listener);
  return this;
};

// remove an event handler
prototype.off = function(type, handler) {
  var name = this.eventName(type),
      svg = this._svg,
      h = this._handlers[name], i;
  if (!h) return;
  for (i=h.length; --i>=0;) {
    if (h[i].type === type && !handler || h[i].handler === handler) {
      svg.removeEventListener(name, h[i].listener);
      h.splice(i, 1);
    }
  }
  return this;
};

module.exports = SVGHandler;

},{"../../util/dom":76,"../Handler":48}],66:[function(require,module,exports){
var ImageLoader = require('../../util/ImageLoader'),
    Renderer = require('../Renderer'),
    font = require('../../util/font'),
    DOM = require('../../util/dom'),
    SVG = require('../../util/svg'),
    ns = SVG.metadata.xmlns,
    marks = require('./marks');

function SVGRenderer(loadConfig) {
  Renderer.call(this);
  this._loader = new ImageLoader(loadConfig);
  this._dirtyID = 0;
}

var base = Renderer.prototype;
var prototype = (SVGRenderer.prototype = Object.create(base));
prototype.constructor = SVGRenderer;

prototype.initialize = function(el, width, height, padding) {
  if (el) {
    this._svg = DOM.child(el, 0, 'svg', ns, 'marks');
    DOM.clear(el, 1);
    // set the svg root group
    this._root = DOM.child(this._svg, 0, 'g', ns);
    DOM.clear(this._svg, 1);
  }

  // create the svg definitions cache
  this._defs = {
    clip_id:  1,
    gradient: {},
    clipping: {}
  };

  // set background color if defined
  this.background(this._bgcolor);

  return base.initialize.call(this, el, width, height, padding);
};

prototype.background = function(bgcolor) {
  if (arguments.length && this._svg) {
    this._svg.style.setProperty('background-color', bgcolor);
  }
  return base.background.apply(this, arguments);
};

prototype.resize = function(width, height, padding) {
  base.resize.call(this, width, height, padding);
  
  if (this._svg) {
    var w = this._width,
        h = this._height,
        p = this._padding;
  
    this._svg.setAttribute('width', w + p.left + p.right);
    this._svg.setAttribute('height', h + p.top + p.bottom);
    
    this._root.setAttribute('transform', 'translate('+p.left+','+p.top+')');
  }

  return this;
};

prototype.svg = function() {
  if (!this._svg) return null;

  var attr = {
    'class':  'marks',
    'width':  this._width + this._padding.left + this._padding.right,
    'height': this._height + this._padding.top + this._padding.bottom,
  };
  for (var key in SVG.metadata) {
    attr[key] = SVG.metadata[key];
  }

  return DOM.openTag('svg', attr) + this._svg.innerHTML + DOM.closeTag('svg');
};

prototype.imageURL = function(url) {
  return this._loader.imageURL(url);
};


// -- Render entry point --

prototype.render = function(scene, items) {
  if (this._dirtyCheck(items)) {
    if (this._dirtyAll) this._resetDefs();
    this.draw(this._root, scene, -1);
    DOM.clear(this._root, 1);
  }
  this.updateDefs();
  return this;
};

prototype.draw = function(el, scene, index) {
  this.drawMark(el, scene, index, marks[scene.marktype]);
};


// -- Manage SVG definitions ('defs') block --

prototype.updateDefs = function() {
  var svg = this._svg,
      defs = this._defs,
      el = defs.el,
      index = 0, id;

  for (id in defs.gradient) {
    if (!el) el = (defs.el = DOM.child(svg, 0, 'defs', ns));
    updateGradient(el, defs.gradient[id], index++);
  }

  for (id in defs.clipping) {
    if (!el) el = (defs.el = DOM.child(svg, 0, 'defs', ns));
    updateClipping(el, defs.clipping[id], index++);
  }

  // clean-up
  if (el) {
    if (index === 0) {
      svg.removeChild(el);
      defs.el = null;
    } else {
      DOM.clear(el, index);      
    }
  }
};

function updateGradient(el, grad, index) {
  var i, n, stop;

  el = DOM.child(el, index, 'linearGradient', ns);
  el.setAttribute('id', grad.id);
  el.setAttribute('x1', grad.x1);
  el.setAttribute('x2', grad.x2);
  el.setAttribute('y1', grad.y1);
  el.setAttribute('y2', grad.y2);
  
  for (i=0, n=grad.stops.length; i<n; ++i) {
    stop = DOM.child(el, i, 'stop', ns);
    stop.setAttribute('offset', grad.stops[i].offset);
    stop.setAttribute('stop-color', grad.stops[i].color);
  }
  DOM.clear(el, i);
}

function updateClipping(el, clip, index) {
  var rect;

  el = DOM.child(el, index, 'clipPath', ns);
  el.setAttribute('id', clip.id);
  rect = DOM.child(el, 0, 'rect', ns);
  rect.setAttribute('x', 0);
  rect.setAttribute('y', 0);
  rect.setAttribute('width', clip.width);
  rect.setAttribute('height', clip.height);
}

prototype._resetDefs = function() {
  var def = this._defs;
  def.clip_id = 1;
  def.gradient = {};
  def.clipping = {};
};


// -- Manage rendering of items marked as dirty --

prototype.isDirty = function(item) {
  return this._dirtyAll || item.dirty === this._dirtyID;
};

prototype._dirtyCheck = function(items) {
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
      mdef = marks[type];
    }

    if (item.status === 'exit') { // EXIT
      if (item._svg) {
        if (mdef.nest && item.mark.items.length) {
          // if nested mark with remaining points, update instead
          this._update(mdef, item._svg, item.mark.items[0]);
          o = item.mark.items[0];
          o._svg = item._svg;
          o._update = id;
        } else {
          // otherwise remove from DOM
          DOM.remove(item._svg);
        }
        item._svg = null;
      }
      continue;
    }

    item = (mdef.nest ? mark.items[0] : item);
    if (item._update === id) { // Already processed
      continue;
    } else if (item._svg) { // UPDATE
      this._update(mdef, item._svg, item);
    } else { // ENTER
      this._dirtyAll = false;
      dirtyParents(item, id);
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
prototype.drawMark = function(el, scene, index, mdef) {
  if (!this.isDirty(scene)) return;

  var items = mdef.nest ?
        (scene.items && scene.items.length ? [scene.items[0]] : []) :
        scene.items || [],
      events = scene.interactive === false ? 'none' : null,
      isGroup = (mdef.tag === 'g'),
      className = DOM.cssClass(scene),
      p, i, n, c, d, insert;

  p = DOM.child(el, index+1, 'g', ns, className);
  p.setAttribute('class', className);
  scene._svg = p;
  if (!isGroup && events) {
    p.style.setProperty('pointer-events', events);
  }

  for (i=0, n=items.length; i<n; ++i) {
    if (this.isDirty(d = items[i])) {
      insert = !(this._dirtyAll || d._svg);
      c = insert ? bind(p, mdef, d, i, true)
        : (p.childNodes[i] || bind(p, mdef, d, i));
      this._update(mdef, c, d);
      if (isGroup) {
        if (insert) this._dirtyAll = true;
        this._recurse(c, d);
        if (insert) this._dirtyAll = false;
      }
    }
  }
  DOM.clear(p, i);
  return p;
};

// Recursively process group contents.
prototype._recurse = function(el, group) {
  var items = group.items || [],
      legends = group.legendItems || [],
      axes = group.axisItems || [],
      idx = 0, j, m;

  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].layer === 'back') {
      this.drawMark(el, axes[j], idx++, marks.group);
    }
  }
  for (j=0, m=items.length; j<m; ++j) {
    this.draw(el, items[j], idx++);
  }
  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].layer !== 'back') {
      this.drawMark(el, axes[j], idx++, marks.group);
    }
  }
  for (j=0, m=legends.length; j<m; ++j) {
    this.drawMark(el, legends[j], idx++, marks.group);
  }

  // remove any extraneous DOM elements
  DOM.clear(el, 1 + idx);
};

// Bind a scenegraph item to an SVG DOM element.
// Create new SVG elements as needed.
function bind(el, mdef, item, index, insert) {
  // create svg element, bind item data for D3 compatibility
  var node = DOM.child(el, index, mdef.tag, ns, null, insert);
  node.__data__ = item;
  node.__values__ = {fill: 'default'};

  // create background rect
  if (mdef.tag === 'g') {
    var bg = DOM.child(node, 0, 'rect', ns, 'background');
    bg.__data__ = item;
  }

  // add pointer from scenegraph item to svg element
  return (item._svg = node);
}


// -- Set attributes & styles on SVG elements ---

var href = (typeof window !== 'undefined' ? window.location.href : ''),
    element = null, // temp var for current SVG element
    values = null;  // temp var for current values hash

// Extra configuration for certain mark types
var mark_extras = {
  group: function(mdef, el, item) {
    element = el.childNodes[0];
    values = el.__values__; // use parent's values hash
    mdef.background(emit, item, this);

    var value = item.mark.interactive === false ? 'none' : null;
    if (value !== values.events) {
      element.style.setProperty('pointer-events', value);
      values.events = value;
    }
  },
  text: function(mdef, el, item) {
    if (item.text !== values.text) {
      el.textContent = item.text || '';
      values.text = item.text;
    }
    var str = font.string(item);
    if (str !== values.font) {
      el.style.setProperty('font', str);
      values.font = str;
    }
  }
};

prototype._update = function(mdef, el, item) {
  // set dom element and values cache
  // provides access to emit method
  element = el;
  values = el.__values__;

  // apply svg attributes
  mdef.attr(emit, item, this);

  // some marks need special treatment
  var extra = mark_extras[mdef.type];
  if (extra) extra(mdef, el, item);

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

prototype.style = function(el, o) {
  if (o == null) return;
  var i, n, prop, name, value;

  for (i=0, n=SVG.styleProperties.length; i<n; ++i) {
    prop = SVG.styleProperties[i];
    value = o[prop];
    if (value === values[prop]) continue;

    name = SVG.styles[prop];
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
        value = 'url(' + href + '#' + value.id + ')';
      }
      el.style.setProperty(name, value+'');
    }

    values[prop] = value;
  }
};

module.exports = SVGRenderer;

},{"../../util/ImageLoader":72,"../../util/dom":76,"../../util/font":77,"../../util/svg":78,"../Renderer":49,"./marks":69}],67:[function(require,module,exports){
var Renderer = require('../Renderer'),
    ImageLoader = require('../../util/ImageLoader'),
    SVG = require('../../util/svg'),
    font = require('../../util/font'),
    DOM = require('../../util/dom'),
    openTag = DOM.openTag,
    closeTag = DOM.closeTag,
    MARKS = require('./marks');

function SVGStringRenderer(loadConfig) {
  Renderer.call(this);

  this._loader = new ImageLoader(loadConfig);

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

var base = Renderer.prototype;
var prototype = (SVGStringRenderer.prototype = Object.create(base));
prototype.constructor = SVGStringRenderer;

prototype.resize = function(width, height, padding) {
  base.resize.call(this, width, height, padding);
  var p = this._padding,
      t = this._text;

  var attr = {
    'class':  'marks',
    'width':  this._width + p.left + p.right,
    'height': this._height + p.top + p.bottom,
  };
  for (var key in SVG.metadata) {
    attr[key] = SVG.metadata[key];
  }

  t.head = openTag('svg', attr);
  t.root = openTag('g', {
    transform: 'translate(' + p.left + ',' + p.top + ')'
  });
  t.foot = closeTag('g') + closeTag('svg');

  return this;
};

prototype.svg = function() {
  var t = this._text;
  return t.head + t.defs + t.root + t.body + t.foot;
};

prototype.render = function(scene) {
  this._text.body = this.mark(scene);
  this._text.defs = this.buildDefs();
  return this;
};

prototype.reset = function() {
  this._defs.clip_id = 0;
  return this;
};

prototype.buildDefs = function() {
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

prototype.imageURL = function(url) {
  return this._loader.imageURL(url);
};

var object;

function emit(name, value, ns, prefixed) {
  object[prefixed || name] = value;
}

prototype.attributes = function(attr, item) {
  object = {};
  attr(emit, item, this);
  return object;
};

prototype.mark = function(scene) {
  var mdef = MARKS[scene.marktype],
      tag  = mdef.tag,
      attr = mdef.attr,
      nest = mdef.nest || false,
      data = nest ?
          (scene.items && scene.items.length ? [scene.items[0]] : []) :
          (scene.items || []),
      defs = this._defs,
      str = '',
      style, i, item;

  if (tag !== 'g' && scene.interactive === false) {
    style = 'style="pointer-events: none;"';
  }

  // render opening group tag
  str += openTag('g', {
    'class': DOM.cssClass(scene)
  }, style);

  // render contained elements
  for (i=0; i<data.length; ++i) {
    item = data[i];
    style = (tag !== 'g') ? styles(item, scene, tag, defs) : null;
    str += openTag(tag, this.attributes(attr, item), style);
    if (tag === 'text') {
      str += escape_text(item.text);
    } else if (tag === 'g') {
      str += openTag('rect',
        this.attributes(mdef.background, item),
        styles(item, scene, 'bgrect', defs)) + closeTag('rect');
      str += this.markGroup(item);
    }
    str += closeTag(tag);
  }

  // render closing group tag
  return str + closeTag('g');
};

prototype.markGroup = function(scene) {
  var str = '',
      axes = scene.axisItems || [],
      items = scene.items || [],
      legends = scene.legendItems || [],
      j, m;

  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].layer === 'back') {
      str += this.mark(axes[j]);
    }
  }
  for (j=0, m=items.length; j<m; ++j) {
    str += this.mark(items[j]);
  }
  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].layer !== 'back') {
      str += this.mark(axes[j]);
    }
  }
  for (j=0, m=legends.length; j<m; ++j) {
    str += this.mark(legends[j]);
  }

  return str;
};

function styles(o, mark, tag, defs) {
  if (o == null) return '';
  var i, n, prop, name, value, s = '';

  if (tag === 'bgrect' && mark.interactive === false) {
    s += 'pointer-events: none;';
  }

  if (tag === 'text') {
    s += 'font: ' + font.string(o) + ';';
  }

  for (i=0, n=SVG.styleProperties.length; i<n; ++i) {
    prop = SVG.styleProperties[i];
    name = SVG.styles[prop];
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
  s = (s == null ? '' : String(s));
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

module.exports = SVGStringRenderer;

},{"../../util/ImageLoader":72,"../../util/dom":76,"../../util/font":77,"../../util/svg":78,"../Renderer":49,"./marks":69}],68:[function(require,module,exports){
module.exports = {
  Handler:  require('./SVGHandler'),
  Renderer: require('./SVGRenderer'),
  string: {
    Renderer : require('./SVGStringRenderer')
  }
};
},{"./SVGHandler":65,"./SVGRenderer":66,"./SVGStringRenderer":67}],69:[function(require,module,exports){
var font = require('../../util/font'),
    SVG = require('../../util/svg'),
    textAlign = SVG.textAlign,
    path = SVG.path;

function translateItem(o) {
  return translate(o.x || 0, o.y || 0);
}

function translate(x, y) {
  return 'translate(' + x + ',' + y + ')';
}

module.exports = {
  arc: {
    tag:  'path',
    type: 'arc',
    attr: function(emit, o) {
      emit('transform', translateItem(o));
      emit('d', path.arc(o));
    }
  },
  area: {
    tag:  'path',
    type: 'area',
    nest: true,
    attr: function(emit, o) {
      var items = o.mark.items;
      if (items.length) emit('d', path.area(items));
    }
  },
  group: {
    tag:  'g',
    type: 'group',
    attr: function(emit, o, renderer) {
      var id = null, defs, c;
      emit('transform', translateItem(o));
      if (o.clip) {
        defs = renderer._defs;
        id = o.clip_id || (o.clip_id = 'clip' + defs.clip_id++);
        c = defs.clipping[id] || (defs.clipping[id] = {id: id});
        c.width = o.width || 0;
        c.height = o.height || 0;
      }
      emit('clip-path', id ? ('url(#' + id + ')') : null);
    },
    background: function(emit, o) {
      emit('class', 'background');
      emit('width', o.width || 0);
      emit('height', o.height || 0);
    }
  },
  image: {
    tag:  'image',
    type: 'image',
    attr: function(emit, o, renderer) {
      var x = o.x || 0,
          y = o.y || 0,
          w = o.width || 0,
          h = o.height || 0,
          url = renderer.imageURL(o.url);

      x = x - (o.align === 'center' ? w/2 : o.align === 'right' ? w : 0);
      y = y - (o.baseline === 'middle' ? h/2 : o.baseline === 'bottom' ? h : 0);

      emit('href', url, 'http://www.w3.org/1999/xlink', 'xlink:href');
      emit('transform', translate(x, y));
      emit('width', w);
      emit('height', h);
    }
  },
  line: {
    tag:  'path',
    type: 'line',
    nest: true,
    attr: function(emit, o) {
      var items = o.mark.items;
      if (items.length) emit('d', path.line(items));
    }
  },
  path: {
    tag:  'path',
    type: 'path',
    attr: function(emit, o) {
      emit('transform', translateItem(o));
      emit('d', o.path);
    }
  },
  rect: {
    tag:  'rect',
    type: 'rect',
    nest: false,
    attr: function(emit, o) {
      emit('transform', translateItem(o));
      emit('width', o.width || 0);
      emit('height', o.height || 0);
    }
  },
  rule: {
    tag:  'line',
    type: 'rule',
    attr: function(emit, o) {
      emit('transform', translateItem(o));
      emit('x2', o.x2 != null ? o.x2 - (o.x||0) : 0);
      emit('y2', o.y2 != null ? o.y2 - (o.y||0) : 0);
    }
  },
  symbol: {
    tag:  'path',
    type: 'symbol',
    attr: function(emit, o) {
      emit('transform', translateItem(o));
      emit('d', path.symbol(o));
    }
  },
  text: {
    tag:  'text',
    type: 'text',
    nest: false,
    attr: function(emit, o) {
      var dx = (o.dx || 0),
          dy = (o.dy || 0) + font.offset(o),
          x = (o.x || 0),
          y = (o.y || 0),
          a = o.angle || 0,
          r = o.radius || 0, t;

      if (r) {
        t = (o.theta || 0) - Math.PI/2;
        x += r * Math.cos(t);
        y += r * Math.sin(t);
      }

      emit('text-anchor', textAlign[o.align] || 'start');
      
      if (a) {
        t = translate(x, y) + ' rotate('+a+')';
        if (dx || dy) t += ' ' + translate(dx, dy);
      } else {
        t = translate(x+dx, y+dy);
      }
      emit('transform', t);
    }
  }
};

},{"../../util/font":77,"../../util/svg":78}],70:[function(require,module,exports){
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

module.exports = Bounds;

},{}],71:[function(require,module,exports){
var gradient_id = 0;

function Gradient(type) {
  this.id = 'gradient_' + (gradient_id++);
  this.type = type || 'linear';
  this.stops = [];
  this.x1 = 0;
  this.x2 = 1;
  this.y1 = 0;
  this.y2 = 0;
}

var prototype = Gradient.prototype;

prototype.stop = function(offset, color) {
  this.stops.push({
    offset: offset,
    color: color
  });
  return this;
};

module.exports = Gradient;
},{}],72:[function(require,module,exports){
(function (global){
var load = require('datalib/src/import/load');

function ImageLoader(loadConfig) {
  this._pending = 0;
  this._config = loadConfig || ImageLoader.Config; 
}

// Overridable global default load configuration
ImageLoader.Config = null;

var prototype = ImageLoader.prototype;

prototype.pending = function() {
  return this._pending;
};

prototype.params = function(uri) {
  var p = {url: uri}, k;
  for (k in this._config) { p[k] = this._config[k]; }
  return p;
};

prototype.imageURL = function(uri) {
  return load.sanitizeUrl(this.params(uri));
};

function browser(uri, callback) {
  var url = load.sanitizeUrl(this.params(uri));
  if (!url) { // error
    if (callback) callback(uri, null);
    return null;
  }

  var loader = this,
      image = new Image();

  loader._pending += 1;

  image.onload = function() {
    loader._pending -= 1;
    image.loaded = true;
    if (callback) callback(null, image);
  };
  image.src = url;

  return image;
}

function server(uri, callback) {
  var loader = this,
      image = new ((typeof window !== "undefined" ? window.canvas : typeof global !== "undefined" ? global.canvas : null).Image)();

  loader._pending += 1;

  load(this.params(uri), function(err, data) {
    loader._pending -= 1;
    if (err) {
      if (callback) callback(err, null);
      return null;
    }
    image.src = data;
    image.loaded = true;
    if (callback) callback(null, image);
  });

  return image;
}

prototype.loadImage = function(uri, callback) {
  return load.useXHR ?
    browser.call(this, uri, callback) :
    server.call(this, uri, callback);
};

module.exports = ImageLoader;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy92ZWdhLXNjZW5lZ3JhcGgvc3JjL3V0aWwvSW1hZ2VMb2FkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgbG9hZCA9IHJlcXVpcmUoJ2RhdGFsaWIvc3JjL2ltcG9ydC9sb2FkJyk7XG5cbmZ1bmN0aW9uIEltYWdlTG9hZGVyKGxvYWRDb25maWcpIHtcbiAgdGhpcy5fcGVuZGluZyA9IDA7XG4gIHRoaXMuX2NvbmZpZyA9IGxvYWRDb25maWcgfHwgSW1hZ2VMb2FkZXIuQ29uZmlnOyBcbn1cblxuLy8gT3ZlcnJpZGFibGUgZ2xvYmFsIGRlZmF1bHQgbG9hZCBjb25maWd1cmF0aW9uXG5JbWFnZUxvYWRlci5Db25maWcgPSBudWxsO1xuXG52YXIgcHJvdG90eXBlID0gSW1hZ2VMb2FkZXIucHJvdG90eXBlO1xuXG5wcm90b3R5cGUucGVuZGluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5fcGVuZGluZztcbn07XG5cbnByb3RvdHlwZS5wYXJhbXMgPSBmdW5jdGlvbih1cmkpIHtcbiAgdmFyIHAgPSB7dXJsOiB1cml9LCBrO1xuICBmb3IgKGsgaW4gdGhpcy5fY29uZmlnKSB7IHBba10gPSB0aGlzLl9jb25maWdba107IH1cbiAgcmV0dXJuIHA7XG59O1xuXG5wcm90b3R5cGUuaW1hZ2VVUkwgPSBmdW5jdGlvbih1cmkpIHtcbiAgcmV0dXJuIGxvYWQuc2FuaXRpemVVcmwodGhpcy5wYXJhbXModXJpKSk7XG59O1xuXG5mdW5jdGlvbiBicm93c2VyKHVyaSwgY2FsbGJhY2spIHtcbiAgdmFyIHVybCA9IGxvYWQuc2FuaXRpemVVcmwodGhpcy5wYXJhbXModXJpKSk7XG4gIGlmICghdXJsKSB7IC8vIGVycm9yXG4gICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayh1cmksIG51bGwpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdmFyIGxvYWRlciA9IHRoaXMsXG4gICAgICBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuXG4gIGxvYWRlci5fcGVuZGluZyArPSAxO1xuXG4gIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIGxvYWRlci5fcGVuZGluZyAtPSAxO1xuICAgIGltYWdlLmxvYWRlZCA9IHRydWU7XG4gICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhudWxsLCBpbWFnZSk7XG4gIH07XG4gIGltYWdlLnNyYyA9IHVybDtcblxuICByZXR1cm4gaW1hZ2U7XG59XG5cbmZ1bmN0aW9uIHNlcnZlcih1cmksIGNhbGxiYWNrKSB7XG4gIHZhciBsb2FkZXIgPSB0aGlzLFxuICAgICAgaW1hZ2UgPSBuZXcgKCh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmNhbnZhcyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuY2FudmFzIDogbnVsbCkuSW1hZ2UpKCk7XG5cbiAgbG9hZGVyLl9wZW5kaW5nICs9IDE7XG5cbiAgbG9hZCh0aGlzLnBhcmFtcyh1cmkpLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICBsb2FkZXIuX3BlbmRpbmcgLT0gMTtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaW1hZ2Uuc3JjID0gZGF0YTtcbiAgICBpbWFnZS5sb2FkZWQgPSB0cnVlO1xuICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2sobnVsbCwgaW1hZ2UpO1xuICB9KTtcblxuICByZXR1cm4gaW1hZ2U7XG59XG5cbnByb3RvdHlwZS5sb2FkSW1hZ2UgPSBmdW5jdGlvbih1cmksIGNhbGxiYWNrKSB7XG4gIHJldHVybiBsb2FkLnVzZVhIUiA/XG4gICAgYnJvd3Nlci5jYWxsKHRoaXMsIHVyaSwgY2FsbGJhY2spIDpcbiAgICBzZXJ2ZXIuY2FsbCh0aGlzLCB1cmksIGNhbGxiYWNrKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSW1hZ2VMb2FkZXI7XG4iXX0=
},{"datalib/src/import/load":42}],73:[function(require,module,exports){
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
  if (i >= 0) {
    if (i===list.length-1) {
      list.pop();
    } else {
      list.splice(i, 1);
    }
  }
  return item;
};

prototype.touch = function() {
  if (this.pathCache) this.pathCache = null;
};

module.exports = Item;
},{}],74:[function(require,module,exports){
var Bounds = require('../util/Bounds'),
    canvas = require('../util/canvas'),
    svg = require('../util/svg'),
    font = require('./font'),
    paths = require('../path'),
    parse = paths.parse,
    boundPath = paths.bounds,
    areaPath = svg.path.area,
    linePath = svg.path.line,
    halfpi = Math.PI / 2,
    sqrt3 = Math.sqrt(3),
    tan30 = Math.tan(30 * Math.PI / 180),
    g2D = null;

function context() {
  return g2D || (g2D = canvas.instance(1,1).getContext('2d'));
}

function strokeBounds(o, bounds) {
  if (o.stroke && o.opacity !== 0 && o.stokeOpacity !== 0) {
    bounds.expand(o.strokeWidth != null ? o.strokeWidth : 1);
  }
  return bounds;
}

function pathBounds(o, path, bounds) {
  if (path == null) {
    bounds.set(0, 0, 0, 0);
  } else {
    boundPath(path, bounds);
    strokeBounds(o, bounds);
  }
  return bounds;
}

function path(o, bounds) {
  var p = o.path ? o.pathCache || (o.pathCache = parse(o.path)) : null;
  return pathBounds(o, p, bounds).translate(o.x || 0, o.y || 0);
}

function area(mark, bounds) {
  if (mark.items.length === 0) return bounds;
  var items = mark.items,
      item = items[0],
      p = item.pathCache || (item.pathCache = parse(areaPath(items)));
  return pathBounds(item, p, bounds);
}

function line(mark, bounds) {
  if (mark.items.length === 0) return bounds;
  var items = mark.items,
      item = items[0],
      p = item.pathCache || (item.pathCache = parse(linePath(items)));
  return pathBounds(item, p, bounds);
}

function rect(o, bounds) {
  var x, y;
  return strokeBounds(o, bounds.set(
    x = o.x || 0,
    y = o.y || 0,
    (x + o.width) || 0,
    (y + o.height) || 0
  ));
}

function image(o, bounds) {
  var x = o.x || 0,
      y = o.y || 0,
      w = o.width || 0,
      h = o.height || 0;
  x = x - (o.align === 'center' ? w/2 : (o.align === 'right' ? w : 0));
  y = y - (o.baseline === 'middle' ? h/2 : (o.baseline === 'bottom' ? h : 0));
  return bounds.set(x, y, x+w, y+h);
}

function rule(o, bounds) {
  var x1, y1;
  return strokeBounds(o, bounds.set(
    x1 = o.x || 0,
    y1 = o.y || 0,
    o.x2 != null ? o.x2 : x1,
    o.y2 != null ? o.y2 : y1
  ));
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
      s = sa - (sa % halfpi);
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

  return strokeBounds(o, bounds.set(
    cx + xmin,
    cy + ymin,
    cx + xmax,
    cy + ymax
  ));
}

function symbol(o, bounds) {
  var size = o.size != null ? o.size : 100,
      x = o.x || 0,
      y = o.y || 0,
      r, t, rx, ry;

  switch (o.shape) {
    case 'cross':
      t = 3 * Math.sqrt(size / 5) / 2;
      bounds.set(x-t, y-t, x+t, y+t);
      break;

    case 'diamond':
      ry = Math.sqrt(size / (2 * tan30));
      rx = ry * tan30;
      bounds.set(x-rx, y-ry, x+rx, y+ry);
      break;

    case 'square':
      t = Math.sqrt(size);
      r = t / 2;
      bounds.set(x-r, y-r, x+r, y+r);
      break;

    case 'triangle-down':
      rx = Math.sqrt(size / sqrt3);
      ry = rx * sqrt3 / 2;
      bounds.set(x-rx, y-ry, x+rx, y+ry);
      break;

    case 'triangle-up':
      rx = Math.sqrt(size / sqrt3);
      ry = rx * sqrt3 / 2;
      bounds.set(x-rx, y-ry, x+rx, y+ry);
      break;

    default:
      r = Math.sqrt(size/Math.PI);
      bounds.set(x-r, y-r, x+r, y+r);
  }

  return strokeBounds(o, bounds);
}

function text(o, bounds, noRotate) {
  var g = context(),
      h = font.size(o),
      a = o.align,
      r = o.radius || 0,
      x = (o.x || 0),
      y = (o.y || 0),
      dx = (o.dx || 0),
      dy = (o.dy || 0) + font.offset(o) - Math.round(0.8*h), // use 4/5 offset
      w, t;

  if (r) {
    t = (o.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  // horizontal alignment
  g.font = font.string(o);
  w = g.measureText(o.text || '').width;
  if (a === 'center') {
    dx -= (w / 2);
  } else if (a === 'right') {
    dx -= w;
  } else {
    // left by default, do nothing
  }

  bounds.set(dx+=x, dy+=y, dx+w, dy+h);
  if (o.angle && !noRotate) {
    bounds.rotate(o.angle*Math.PI/180, x, y);
  }
  return bounds.expand(noRotate ? 0 : 1);
}

function group(g, bounds, includeLegends) {
  var axes = g.axisItems || [],
      items = g.items || [],
      legends = g.legendItems || [],
      j, m;

  for (j=0, m=axes.length; j<m; ++j) {
    bounds.union(axes[j].bounds);
  }
  for (j=0, m=items.length; j<m; ++j) {
    bounds.union(items[j].bounds);
  }
  if (includeLegends) {
    for (j=0, m=legends.length; j<m; ++j) {
      bounds.union(legends[j].bounds);
    }
  }
  if (g.width || g.height) {
    strokeBounds(g, bounds
      .add(0, 0)
      .add(g.width || 0, g.height || 0));
  }
  return bounds.translate(g.x || 0, g.y || 0);
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
methods.area.nest = true;
methods.line.nest = true;

function itemBounds(item, func, opt) {
  var type = item.mark.marktype;
  func = func || methods[type];
  if (func.nest) item = item.mark;

  var curr = item.bounds,
      prev = item['bounds:prev'] || (item['bounds:prev'] = new Bounds());

  if (curr) {
    prev.clear().union(curr);
    curr.clear();
  } else {
    item.bounds = new Bounds();
  }
  func(item, item.bounds, opt);
  if (!curr) prev.clear().union(item.bounds);
  return item.bounds;
}

var DUMMY_ITEM = {mark: null};

function markBounds(mark, bounds, opt) {
  var type  = mark.marktype,
      func  = methods[type],
      items = mark.items,
      hasi  = items && items.length,
      i, n, o, b;

  if (func.nest) {
    o = hasi ? items[0]
      : (DUMMY_ITEM.mark = mark, DUMMY_ITEM); // no items, so fake it
    b = itemBounds(o, func, opt);
    bounds = bounds && bounds.union(b) || b;
    return bounds;
  }

  bounds = bounds || mark.bounds && mark.bounds.clear() || new Bounds();
  if (hasi) {  
    for (i=0, n=items.length; i<n; ++i) {
      bounds.union(itemBounds(items[i], func, opt));
    }
  }
  return (mark.bounds = bounds);
}

module.exports = {
  mark:  markBounds,
  item:  itemBounds,
  text:  text,
  group: group
};

},{"../path":45,"../util/Bounds":70,"../util/canvas":75,"../util/svg":78,"./font":77}],75:[function(require,module,exports){
(function (global){
function instance(w, h) {
  w = w || 1;
  h = h || 1;
  var canvas;

  if (typeof document !== 'undefined' && document.createElement) {
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
  } else {
    var Canvas = (typeof window !== "undefined" ? window.canvas : typeof global !== "undefined" ? global.canvas : null);
    if (!Canvas.prototype) return null;
    canvas = new Canvas(w, h);
  }
  return lineDash(canvas);
}

function resize(canvas, w, h, p) {
  var g = this._ctx = canvas.getContext('2d'), 
      s = 1;

  canvas.width = w + p.left + p.right;
  canvas.height = h + p.top + p.bottom;

  // if browser canvas, attempt to modify for retina display
  if (typeof HTMLElement !== 'undefined' && canvas instanceof HTMLElement) {
    g.pixelratio = (s = pixelRatio(canvas) || 1);
  }

  g.setTransform(s, 0, 0, s, s*p.left, s*p.top);
  return canvas;
}

function pixelRatio(canvas) {
  var g = canvas.getContext('2d');

  // get canvas pixel data
  var devicePixelRatio = window && window.devicePixelRatio || 1,
      backingStoreRatio = (
        g.webkitBackingStorePixelRatio ||
        g.mozBackingStorePixelRatio ||
        g.msBackingStorePixelRatio ||
        g.oBackingStorePixelRatio ||
        g.backingStorePixelRatio) || 1,
      ratio = devicePixelRatio / backingStoreRatio;

  if (devicePixelRatio !== backingStoreRatio) {
    // set actual and visible canvas size
    var w = canvas.width,
        h = canvas.height;
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }

  return ratio;
}

function lineDash(canvas) {
  var g = canvas.getContext('2d');
  if (g.vgLineDash) return; // already initialized!

  var NOOP = function() {},
      NODASH = [];
  
  if (g.setLineDash) {
    g.vgLineDash = function(dash) { this.setLineDash(dash || NODASH); };
    g.vgLineDashOffset = function(off) { this.lineDashOffset = off; };
  } else if (g.webkitLineDash !== undefined) {
  	g.vgLineDash = function(dash) { this.webkitLineDash = dash || NODASH; };
    g.vgLineDashOffset = function(off) { this.webkitLineDashOffset = off; };
  } else if (g.mozDash !== undefined) {
    g.vgLineDash = function(dash) { this.mozDash = dash; };
    g.vgLineDashOffset = NOOP;
  } else {
    g.vgLineDash = NOOP;
    g.vgLineDashOffset = NOOP;
  }
  return canvas;
}

module.exports = {
  instance:   instance,
  resize:     resize,
  pixelRatio: pixelRatio,
  lineDash:   lineDash
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy92ZWdhLXNjZW5lZ3JhcGgvc3JjL3V0aWwvY2FudmFzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBpbnN0YW5jZSh3LCBoKSB7XG4gIHcgPSB3IHx8IDE7XG4gIGggPSBoIHx8IDE7XG4gIHZhciBjYW52YXM7XG5cbiAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCkge1xuICAgIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIGNhbnZhcy53aWR0aCA9IHc7XG4gICAgY2FudmFzLmhlaWdodCA9IGg7XG4gIH0gZWxzZSB7XG4gICAgdmFyIENhbnZhcyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmNhbnZhcyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuY2FudmFzIDogbnVsbCk7XG4gICAgaWYgKCFDYW52YXMucHJvdG90eXBlKSByZXR1cm4gbnVsbDtcbiAgICBjYW52YXMgPSBuZXcgQ2FudmFzKHcsIGgpO1xuICB9XG4gIHJldHVybiBsaW5lRGFzaChjYW52YXMpO1xufVxuXG5mdW5jdGlvbiByZXNpemUoY2FudmFzLCB3LCBoLCBwKSB7XG4gIHZhciBnID0gdGhpcy5fY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyksIFxuICAgICAgcyA9IDE7XG5cbiAgY2FudmFzLndpZHRoID0gdyArIHAubGVmdCArIHAucmlnaHQ7XG4gIGNhbnZhcy5oZWlnaHQgPSBoICsgcC50b3AgKyBwLmJvdHRvbTtcblxuICAvLyBpZiBicm93c2VyIGNhbnZhcywgYXR0ZW1wdCB0byBtb2RpZnkgZm9yIHJldGluYSBkaXNwbGF5XG4gIGlmICh0eXBlb2YgSFRNTEVsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmIGNhbnZhcyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgZy5waXhlbHJhdGlvID0gKHMgPSBwaXhlbFJhdGlvKGNhbnZhcykgfHwgMSk7XG4gIH1cblxuICBnLnNldFRyYW5zZm9ybShzLCAwLCAwLCBzLCBzKnAubGVmdCwgcypwLnRvcCk7XG4gIHJldHVybiBjYW52YXM7XG59XG5cbmZ1bmN0aW9uIHBpeGVsUmF0aW8oY2FudmFzKSB7XG4gIHZhciBnID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgLy8gZ2V0IGNhbnZhcyBwaXhlbCBkYXRhXG4gIHZhciBkZXZpY2VQaXhlbFJhdGlvID0gd2luZG93ICYmIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDEsXG4gICAgICBiYWNraW5nU3RvcmVSYXRpbyA9IChcbiAgICAgICAgZy53ZWJraXRCYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XG4gICAgICAgIGcubW96QmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fFxuICAgICAgICBnLm1zQmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fFxuICAgICAgICBnLm9CYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XG4gICAgICAgIGcuYmFja2luZ1N0b3JlUGl4ZWxSYXRpbykgfHwgMSxcbiAgICAgIHJhdGlvID0gZGV2aWNlUGl4ZWxSYXRpbyAvIGJhY2tpbmdTdG9yZVJhdGlvO1xuXG4gIGlmIChkZXZpY2VQaXhlbFJhdGlvICE9PSBiYWNraW5nU3RvcmVSYXRpbykge1xuICAgIC8vIHNldCBhY3R1YWwgYW5kIHZpc2libGUgY2FudmFzIHNpemVcbiAgICB2YXIgdyA9IGNhbnZhcy53aWR0aCxcbiAgICAgICAgaCA9IGNhbnZhcy5oZWlnaHQ7XG4gICAgY2FudmFzLndpZHRoID0gdyAqIHJhdGlvO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBoICogcmF0aW87XG4gICAgY2FudmFzLnN0eWxlLndpZHRoID0gdyArICdweCc7XG4gICAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGggKyAncHgnO1xuICB9XG5cbiAgcmV0dXJuIHJhdGlvO1xufVxuXG5mdW5jdGlvbiBsaW5lRGFzaChjYW52YXMpIHtcbiAgdmFyIGcgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgaWYgKGcudmdMaW5lRGFzaCkgcmV0dXJuOyAvLyBhbHJlYWR5IGluaXRpYWxpemVkIVxuXG4gIHZhciBOT09QID0gZnVuY3Rpb24oKSB7fSxcbiAgICAgIE5PREFTSCA9IFtdO1xuICBcbiAgaWYgKGcuc2V0TGluZURhc2gpIHtcbiAgICBnLnZnTGluZURhc2ggPSBmdW5jdGlvbihkYXNoKSB7IHRoaXMuc2V0TGluZURhc2goZGFzaCB8fCBOT0RBU0gpOyB9O1xuICAgIGcudmdMaW5lRGFzaE9mZnNldCA9IGZ1bmN0aW9uKG9mZikgeyB0aGlzLmxpbmVEYXNoT2Zmc2V0ID0gb2ZmOyB9O1xuICB9IGVsc2UgaWYgKGcud2Via2l0TGluZURhc2ggIT09IHVuZGVmaW5lZCkge1xuICBcdGcudmdMaW5lRGFzaCA9IGZ1bmN0aW9uKGRhc2gpIHsgdGhpcy53ZWJraXRMaW5lRGFzaCA9IGRhc2ggfHwgTk9EQVNIOyB9O1xuICAgIGcudmdMaW5lRGFzaE9mZnNldCA9IGZ1bmN0aW9uKG9mZikgeyB0aGlzLndlYmtpdExpbmVEYXNoT2Zmc2V0ID0gb2ZmOyB9O1xuICB9IGVsc2UgaWYgKGcubW96RGFzaCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZy52Z0xpbmVEYXNoID0gZnVuY3Rpb24oZGFzaCkgeyB0aGlzLm1vekRhc2ggPSBkYXNoOyB9O1xuICAgIGcudmdMaW5lRGFzaE9mZnNldCA9IE5PT1A7XG4gIH0gZWxzZSB7XG4gICAgZy52Z0xpbmVEYXNoID0gTk9PUDtcbiAgICBnLnZnTGluZURhc2hPZmZzZXQgPSBOT09QO1xuICB9XG4gIHJldHVybiBjYW52YXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBpbnN0YW5jZTogICBpbnN0YW5jZSxcbiAgcmVzaXplOiAgICAgcmVzaXplLFxuICBwaXhlbFJhdGlvOiBwaXhlbFJhdGlvLFxuICBsaW5lRGFzaDogICBsaW5lRGFzaFxufTtcbiJdfQ==
},{}],76:[function(require,module,exports){
// create a new DOM element
function create(doc, tag, ns) {
  return ns ? doc.createElementNS(ns, tag) : doc.createElement(tag);
}

// remove element from DOM
// recursively remove parent elements if empty
function remove(el) {
  if (!el) return;
  var p = el.parentNode;
  if (p) {
    p.removeChild(el);
    if (!p.childNodes || !p.childNodes.length) remove(p);
  }
}

module.exports = {
  // find first child element with matching tag
  find: function(el, tag) {
    tag = tag.toLowerCase();
    for (var i=0, n=el.childNodes.length; i<n; ++i) {
      if (el.childNodes[i].tagName.toLowerCase() === tag) {
        return el.childNodes[i];
      }
    }
  },
  // retrieve child element at given index
  // create & insert if doesn't exist or if tag/className do not match
  child: function(el, index, tag, ns, className, insert) {
    var a, b;
    a = b = el.childNodes[index];
    if (!a || insert ||
        a.tagName.toLowerCase() !== tag.toLowerCase() ||
        className && a.getAttribute('class') != className) {
      a = create(el.ownerDocument, tag, ns);
      el.insertBefore(a, b);
      if (className) a.setAttribute('class', className);
    }
    return a;
  },
  // remove all child elements at or above the given index
  clear: function(el, index) {
    var curr = el.childNodes.length;
    while (curr > index) {
      el.removeChild(el.childNodes[--curr]);
    }
    return el;
  },
  remove: remove,
  // generate css class name for mark
  cssClass: function(mark) {
    return 'mark-' + mark.marktype + (mark.name ? ' '+mark.name : '');
  },
  // generate string for an opening xml tag
  // tag: the name of the xml tag
  // attr: hash of attribute name-value pairs to include
  // raw: additional raw string to include in tag markup
  openTag: function(tag, attr, raw) {
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
  },
  // generate string for closing xml tag
  // tag: the name of the xml tag
  closeTag: function(tag) {
    return '</' + tag + '>';
  }
};

},{}],77:[function(require,module,exports){
function size(item) {
  return item.fontSize != null ? item.fontSize : 11;
}

module.exports = {
  size: size,
  string: function(item, quote) {
    var font = item.font;
    if (quote && font) {
      font = String(font).replace(/\"/g, '\'');
    }
    return '' +
      (item.fontStyle ? item.fontStyle + ' ' : '') +
      (item.fontVariant ? item.fontVariant + ' ' : '') +
      (item.fontWeight ? item.fontWeight + ' ' : '') +
      size(item) + 'px ' +
      (font || 'sans-serif');
  },
  offset: function(item) {
    // perform our own font baseline calculation
    // why? not all browsers support SVG 1.1 'alignment-baseline' :(
    var baseline = item.baseline,
        h = size(item);
    return Math.round(
      baseline === 'top'    ?  0.93*h :
      baseline === 'middle' ?  0.30*h :
      baseline === 'bottom' ? -0.21*h : 0
    );
  }
};

},{}],78:[function(require,module,exports){
(function (global){
var d3_svg = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null).svg;

function x(o)     { return o.x || 0; }
function y(o)     { return o.y || 0; }
function xw(o)    { return (o.x || 0) + (o.width || 0); }
function yh(o)    { return (o.y || 0) + (o.height || 0); }
function size(o)  { return o.size == null ? 100 : o.size; }
function shape(o) { return o.shape || 'circle'; }

var areav = d3_svg.area().x(x).y1(y).y0(yh),
    areah = d3_svg.area().y(y).x1(x).x0(xw),
    line  = d3_svg.line().x(x).y(y);

module.exports = {
  metadata: {
    'version': '1.1',
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink'
  },
  path: {
    arc: d3_svg.arc(),
    symbol: d3_svg.symbol().type(shape).size(size),
    area: function(items) {
      var o = items[0];
      return (o.orient === 'horizontal' ? areah : areav)
        .interpolate(o.interpolate || 'linear')
        .tension(o.tension || 0.7)
        (items);
    },
    line: function(items) {
      var o = items[0];
      return line
        .interpolate(o.interpolate || 'linear')
        .tension(o.tension || 0.7)
        (items);
    }
  },
  textAlign: {
    'left':   'start',
    'center': 'middle',
    'right':  'end'
  },
  textBaseline: {
    'top':    'before-edge',
    'bottom': 'after-edge',
    'middle': 'central'
  },
  styles: {
    'fill':             'fill',
    'fillOpacity':      'fill-opacity',
    'stroke':           'stroke',
    'strokeWidth':      'stroke-width',
    'strokeOpacity':    'stroke-opacity',
    'strokeCap':        'stroke-linecap',
    'strokeDash':       'stroke-dasharray',
    'strokeDashOffset': 'stroke-dashoffset',
    'opacity':          'opacity'
  },
  styleProperties: [
    'fill',
    'fillOpacity',
    'stroke',
    'strokeWidth',
    'strokeOpacity',
    'strokeCap',
    'strokeDash',
    'strokeDashOffset',
    'opacity'
  ]
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy92ZWdhLXNjZW5lZ3JhcGgvc3JjL3V0aWwvc3ZnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZDNfc3ZnID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCkuc3ZnO1xuXG5mdW5jdGlvbiB4KG8pICAgICB7IHJldHVybiBvLnggfHwgMDsgfVxuZnVuY3Rpb24geShvKSAgICAgeyByZXR1cm4gby55IHx8IDA7IH1cbmZ1bmN0aW9uIHh3KG8pICAgIHsgcmV0dXJuIChvLnggfHwgMCkgKyAoby53aWR0aCB8fCAwKTsgfVxuZnVuY3Rpb24geWgobykgICAgeyByZXR1cm4gKG8ueSB8fCAwKSArIChvLmhlaWdodCB8fCAwKTsgfVxuZnVuY3Rpb24gc2l6ZShvKSAgeyByZXR1cm4gby5zaXplID09IG51bGwgPyAxMDAgOiBvLnNpemU7IH1cbmZ1bmN0aW9uIHNoYXBlKG8pIHsgcmV0dXJuIG8uc2hhcGUgfHwgJ2NpcmNsZSc7IH1cblxudmFyIGFyZWF2ID0gZDNfc3ZnLmFyZWEoKS54KHgpLnkxKHkpLnkwKHloKSxcbiAgICBhcmVhaCA9IGQzX3N2Zy5hcmVhKCkueSh5KS54MSh4KS54MCh4dyksXG4gICAgbGluZSAgPSBkM19zdmcubGluZSgpLngoeCkueSh5KTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGFkYXRhOiB7XG4gICAgJ3ZlcnNpb24nOiAnMS4xJyxcbiAgICAneG1sbnMnOiAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLFxuICAgICd4bWxuczp4bGluayc6ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJ1xuICB9LFxuICBwYXRoOiB7XG4gICAgYXJjOiBkM19zdmcuYXJjKCksXG4gICAgc3ltYm9sOiBkM19zdmcuc3ltYm9sKCkudHlwZShzaGFwZSkuc2l6ZShzaXplKSxcbiAgICBhcmVhOiBmdW5jdGlvbihpdGVtcykge1xuICAgICAgdmFyIG8gPSBpdGVtc1swXTtcbiAgICAgIHJldHVybiAoby5vcmllbnQgPT09ICdob3Jpem9udGFsJyA/IGFyZWFoIDogYXJlYXYpXG4gICAgICAgIC5pbnRlcnBvbGF0ZShvLmludGVycG9sYXRlIHx8ICdsaW5lYXInKVxuICAgICAgICAudGVuc2lvbihvLnRlbnNpb24gfHwgMC43KVxuICAgICAgICAoaXRlbXMpO1xuICAgIH0sXG4gICAgbGluZTogZnVuY3Rpb24oaXRlbXMpIHtcbiAgICAgIHZhciBvID0gaXRlbXNbMF07XG4gICAgICByZXR1cm4gbGluZVxuICAgICAgICAuaW50ZXJwb2xhdGUoby5pbnRlcnBvbGF0ZSB8fCAnbGluZWFyJylcbiAgICAgICAgLnRlbnNpb24oby50ZW5zaW9uIHx8IDAuNylcbiAgICAgICAgKGl0ZW1zKTtcbiAgICB9XG4gIH0sXG4gIHRleHRBbGlnbjoge1xuICAgICdsZWZ0JzogICAnc3RhcnQnLFxuICAgICdjZW50ZXInOiAnbWlkZGxlJyxcbiAgICAncmlnaHQnOiAgJ2VuZCdcbiAgfSxcbiAgdGV4dEJhc2VsaW5lOiB7XG4gICAgJ3RvcCc6ICAgICdiZWZvcmUtZWRnZScsXG4gICAgJ2JvdHRvbSc6ICdhZnRlci1lZGdlJyxcbiAgICAnbWlkZGxlJzogJ2NlbnRyYWwnXG4gIH0sXG4gIHN0eWxlczoge1xuICAgICdmaWxsJzogICAgICAgICAgICAgJ2ZpbGwnLFxuICAgICdmaWxsT3BhY2l0eSc6ICAgICAgJ2ZpbGwtb3BhY2l0eScsXG4gICAgJ3N0cm9rZSc6ICAgICAgICAgICAnc3Ryb2tlJyxcbiAgICAnc3Ryb2tlV2lkdGgnOiAgICAgICdzdHJva2Utd2lkdGgnLFxuICAgICdzdHJva2VPcGFjaXR5JzogICAgJ3N0cm9rZS1vcGFjaXR5JyxcbiAgICAnc3Ryb2tlQ2FwJzogICAgICAgICdzdHJva2UtbGluZWNhcCcsXG4gICAgJ3N0cm9rZURhc2gnOiAgICAgICAnc3Ryb2tlLWRhc2hhcnJheScsXG4gICAgJ3N0cm9rZURhc2hPZmZzZXQnOiAnc3Ryb2tlLWRhc2hvZmZzZXQnLFxuICAgICdvcGFjaXR5JzogICAgICAgICAgJ29wYWNpdHknXG4gIH0sXG4gIHN0eWxlUHJvcGVydGllczogW1xuICAgICdmaWxsJyxcbiAgICAnZmlsbE9wYWNpdHknLFxuICAgICdzdHJva2UnLFxuICAgICdzdHJva2VXaWR0aCcsXG4gICAgJ3N0cm9rZU9wYWNpdHknLFxuICAgICdzdHJva2VDYXAnLFxuICAgICdzdHJva2VEYXNoJyxcbiAgICAnc3Ryb2tlRGFzaE9mZnNldCcsXG4gICAgJ29wYWNpdHknXG4gIF1cbn07XG4iXX0=
},{}],79:[function(require,module,exports){
var canvas = require('vega-scenegraph/src/render/canvas'),
    svg = require('vega-scenegraph/src/render/svg').string,
    View = require('./View');

function HeadlessView(width, height, model) {
  View.call(null, width, height, model);
  this._type = 'canvas';
  this._renderers = {canvas: canvas, svg: svg};
}

var prototype = (HeadlessView.prototype = new View());

prototype.renderer = function(type) {
  if(type) this._type = type;
  return View.prototype.renderer.apply(this, arguments);
};

prototype.canvas = function() {
  return (this._type === 'canvas') ? this._renderer.canvas() : null;
};

prototype.canvasAsync = function(callback) {
  var r = this._renderer, view = this;
  
  function wait() {
    if (r.pendingImages() === 0) {
      view.render(); // re-render with all images
      callback(view.canvas());
    } else {
      setTimeout(wait, 10);
    }
  }

  // if images loading, poll until ready
  if (this._type !== 'canvas') return null;
  if (r.pendingImages() > 0) { wait(); } else { callback(this.canvas()); }
};

prototype.svg = function() {
  return (this._type === 'svg') ? this._renderer.svg() : null;
};

prototype.initialize = function() {    
  var w = this._width,
      h = this._height,
      bg  = this._bgcolor,
      pad = this._padding,
      config = this.model().config();

  if (this._viewport) {
    w = this._viewport[0] - (pad ? pad.left + pad.right : 0);
    h = this._viewport[1] - (pad ? pad.top + pad.bottom : 0);
  }

  this._renderer = (this._renderer || new this._io.Renderer(config.load))
    .initialize(null, w, h, pad)
    .background(bg);
  
  return this;
};

module.exports = HeadlessView;
},{"./View":81,"vega-scenegraph/src/render/canvas":52,"vega-scenegraph/src/render/svg":68}],80:[function(require,module,exports){
var util = require('datalib/src/util'),
    ChangeSet = require('vega-dataflow/src/ChangeSet'),
    Base = require('vega-dataflow/src/Graph').prototype,
    Node  = require('vega-dataflow/src/Node'), // jshint ignore:line
    GroupBuilder = require('../scene/GroupBuilder'),
    visit = require('../scene/visit'),
    config = require('./config');

function Model(cfg) {
  this._defs = {};
  this._predicates = {};
  this._scene = null;

  this._node = null;
  this._builder = null; // Top-level scenegraph builder

  this._reset = {axes: false, legends: false};

  this.config(cfg);
  Base.init.call(this);
}

var prototype = (Model.prototype = Object.create(Base));
prototype.constructor = Model;

prototype.defs = function(defs) {
  if (!arguments.length) return this._defs;
  this._defs = defs;
  return this;
};

prototype.config = function(cfg) {
  if (!arguments.length) return this._config;
  this._config = Object.create(config);
  for (var name in cfg) {
    var x = cfg[name], y = this._config[name];
    if (util.isObject(x) && util.isObject(y)) {
      util.extend(y, x);
    } else {
      this._config[name] = x;
    }
  }

  return this;
};

prototype.width = function(width) {
  if (this._defs) this._defs.width = width;
  if (this._defs && this._defs.marks) this._defs.marks.width = width;
  if (this._scene) {
    this._scene.items[0].width = width;
    this._scene.items[0]._dirty = true;
  }
  this._reset.axes = true;
  return this;
};

prototype.height = function(height) {
  if (this._defs) this._defs.height = height;
  if (this._defs && this._defs.marks) this._defs.marks.height = height;
  if (this._scene) {
    this._scene.items[0].height = height;
    this._scene.items[0]._dirty = true;
  }
  this._reset.axes = true;
  return this;
};

prototype.node = function() {
  return this._node || (this._node = new Node(this));
};

prototype.data = function() {
  var data = Base.data.apply(this, arguments);
  if (arguments.length > 1) {  // new Datasource
    this.node().addListener(data.pipeline()[0]);
  }

  return data;
};

function predicates(name) {
  var m = this, pred = {};
  if (!util.isArray(name)) return this._predicates[name];
  name.forEach(function(n) { pred[n] = m._predicates[n]; });
  return pred;
}

prototype.predicate = function(name, predicate) {
  if (arguments.length === 1) return predicates.call(this, name);
  return (this._predicates[name] = predicate);
};

prototype.predicates = function() { return this._predicates; };

prototype.scene = function(renderer) {
  if (!arguments.length) return this._scene;
  if (this._builder) this.node().removeListener(this._builder.disconnect());
  this._builder = new GroupBuilder(this, this._defs.marks, this._scene={});
  this.node().addListener(this._builder.connect());
  var p = this._builder.pipeline();
  p[p.length-1].addListener(renderer);
  return this;
};

prototype.reset = function() {
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

prototype.addListener = function(l) {
  this.node().addListener(l);
};

prototype.removeListener = function(l) {
  this.node().removeListener(l); 
};

prototype.fire = function(cs) {
  if (!cs) cs = ChangeSet.create();
  this.propagate(cs, this.node());
};

module.exports = Model;
},{"../scene/GroupBuilder":104,"../scene/visit":109,"./config":82,"datalib/src/util":20,"vega-dataflow/src/ChangeSet":26,"vega-dataflow/src/Graph":30,"vega-dataflow/src/Node":31}],81:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    util = require('datalib/src/util'),
    canvas = require('vega-scenegraph/src/render/canvas'),
    svg = require('vega-scenegraph/src/render/svg'),
    Node = require('vega-dataflow/src/Node'), // jshint ignore:line
    log = require('vega-logging'),
    parseStreams = require('../parse/streams'),
    Encoder = require('../scene/Encoder'),
    Transition = require('../scene/Transition'),
    changeset = require('vega-dataflow/src/ChangeSet');

function View(el, width, height) {
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
  this._repaint = true; // Full re-render on every re-init
  this._renderers = {canvas: canvas, svg: svg};
  this._io  = canvas;
  this._api = {}; // Stash streaming data API sandboxes.
}

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
      name = ds.name(),
      listener = ds.pipeline()[0],
      streamer = this._streamer,
      api = {};

  // If we have it stashed, don't create a new closure. 
  if (this._api[src]) return this._api[src];

  api.insert = function(vals) {
    ds.insert(util.duplicate(vals));  // Don't pollute the environment
    streamer.addListener(listener);
    view._changeset.data[name] = 1;
    return api;
  };

  api.update = function() {
    streamer.addListener(listener);
    view._changeset.data[name] = 1;
    return (ds.update.apply(ds, arguments), api);
  };

  api.remove = function() {
    streamer.addListener(listener);
    view._changeset.data[name] = 1;
    return (ds.remove.apply(ds, arguments), api);
  };

  api.values = function() { return ds.values(); };    

  return (this._api[src] = api);
}

prototype.data = function(data) {
  var v = this;
  if (!arguments.length) return v._model.dataValues();
  else if (util.isString(data)) return streaming.call(v, data);
  else if (util.isObject(data)) {
    util.keys(data).forEach(function(k) {
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

  if (!arguments.length) return m.signalValues();
  else if (arguments.length == 1 && util.isString(name)) return m.signalValues(name);

  if (arguments.length == 2) {
    setter = {};
    setter[name] = value;
  }

  util.keys(setter).forEach(function(k) {
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
    this.model().width(width);
    this.initialize();
    if (this._strict) this._autopad = 1;
  }
  return this;
};

prototype.height = function(height) {
  if (!arguments.length) return this.__height;
  if (this.__height !== height) {
    this._height = this.__height = height;
    this.model().height(height);
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
    if (util.isString(pad)) {
      this._autopad = 1;
      this._padding = {top:0, left:0, bottom:0, right:0};
      this._strict = (pad === "strict");
    } else {
      this._autopad = 0;
      this._padding = pad;
      this._strict = false;
    }
    if (this._renderer) this._renderer.resize(this._width, this._height, pad);
    if (this._handler)  this._handler.padding(pad);
  }
  return (this._repaint = true, this);
};

prototype.autopad = function(opt) {
  if (this._autopad < 1) return this;
  else this._autopad = 0;

  var b = this.model().scene().bounds,
      pad = this._padding,
      config = this.model().config(),
      inset = config.autopadInset,
      l = b.x1 < 0 ? Math.ceil(-b.x1) + inset : 0,
      t = b.y1 < 0 ? Math.ceil(-b.y1) + inset : 0,
      r = b.x2 > this._width  ? Math.ceil(+b.x2 - this._width) + inset : 0;
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
  else if (util.isString(type)) throw new Error("Unknown renderer: " + type);
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
      w = v._width, h = v._height, pad = v._padding, bg = v._bgcolor,
      config = this.model().config();

  if (!arguments.length || el === null) {
    el = this._el ? this._el.parentNode : null;
    if (!el) return this;  // This View cannot init w/o an
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
  v._renderer = (v._renderer || new this._io.Renderer(config.load))
    .initialize(el, w, h, pad)
    .background(bg);
  
  // input handler
  prevHandler = v._handler;
  v._handler = new this._io.Handler()
    .initialize(el, pad, v);

  if (prevHandler) {
    prevHandler.handlers().forEach(function(h) {
      v._handler.on(h.type, h.handler);
    });
  } else {
    // Register event listeners for signal stream definitions.
    v._detach = parseStreams(this);
  }
  
  return (this._repaint = true, this);
};

prototype.destroy = function() {
  if (this._detach) this._detach();
};

function build() {
  var v = this;
  v._renderNode = new Node(v._model)
    .router(true);

  v._renderNode.evaluate = function(input) {
    log.debug(input, ['rendering']);

    var s = v._model.scene(),
        h = v._handler,
        d;

    if (h && h.scene) h.scene(s);

    if (input.trans) {
      input.trans.start(function(items) { v._renderer.render(s, items); });
    } else if (v._repaint) {
      v._renderer.render(s);
      v._repaint = false;
    } else if (input.dirty.length) {
      v._renderer.render(s, input.dirty);
    }

    if (input.dirty.length) {
      input.dirty.forEach(function(i) { i._dirty = false; });
      s.items[0]._dirty = false;
    }

    // For all updated datasources, clear their previous values.
    for (d in input.data) v._model.data(d).finalize();
    return input;
  };

  return (v._model.scene(v._renderNode), true);  
}

prototype.update = function(opt) {   
  opt = opt || {};
  var v = this,
      trans = opt.duration ? new Transition(opt.duration, opt.ease) : null;

  var cs = v._changeset;
  if (trans) cs.trans = trans;
  if (opt.props !== undefined) {
    if (util.keys(cs.data).length > 0) {
      throw Error(
        "New data values are not reflected in the visualization." +
        " Please call view.update() before updating a specified property set."
      );
    }

    cs.reflow  = true;
    cs.request = opt.props;
  }

  var built = v._build;
  v._build = v._build || build.call(this);

  // If specific items are specified, short-circuit dataflow graph.
  // Else-If there are streaming updates, perform a targeted propagation.
  // Otherwise, reevaluate the entire model (datasources + scene).
  if (opt.items && built) { 
    Encoder.update(this._model, opt.trans, opt.props, opt.items, cs.dirty);
    v._renderNode.evaluate(cs);
  } else if (v._streamer.listeners().length && built) {
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
      .padding(defs.padding)
      .viewport(defs.viewport)
      .initialize(opt.el);

    if (opt.data) v.data(opt.data);

    if (opt.hover !== false && opt.el) {
      v.on("mouseover", function(evt, item) {
        if (item && item.hasPropertySet("hover")) {
          this.update({props:"hover", items:item});
        }
      })
      .on("mouseout", function(evt, item) {
        if (item && item.hasPropertySet("hover")) {
          this.update({props:"update", items:item});
        }
      });
    }
  
    return v;
  };    
};

module.exports = View;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb3JlL1ZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbInZhciBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICAgIHV0aWwgPSByZXF1aXJlKCdkYXRhbGliL3NyYy91dGlsJyksXG4gICAgY2FudmFzID0gcmVxdWlyZSgndmVnYS1zY2VuZWdyYXBoL3NyYy9yZW5kZXIvY2FudmFzJyksXG4gICAgc3ZnID0gcmVxdWlyZSgndmVnYS1zY2VuZWdyYXBoL3NyYy9yZW5kZXIvc3ZnJyksXG4gICAgTm9kZSA9IHJlcXVpcmUoJ3ZlZ2EtZGF0YWZsb3cvc3JjL05vZGUnKSwgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgbG9nID0gcmVxdWlyZSgndmVnYS1sb2dnaW5nJyksXG4gICAgcGFyc2VTdHJlYW1zID0gcmVxdWlyZSgnLi4vcGFyc2Uvc3RyZWFtcycpLFxuICAgIEVuY29kZXIgPSByZXF1aXJlKCcuLi9zY2VuZS9FbmNvZGVyJyksXG4gICAgVHJhbnNpdGlvbiA9IHJlcXVpcmUoJy4uL3NjZW5lL1RyYW5zaXRpb24nKSxcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCd2ZWdhLWRhdGFmbG93L3NyYy9DaGFuZ2VTZXQnKTtcblxuZnVuY3Rpb24gVmlldyhlbCwgd2lkdGgsIGhlaWdodCkge1xuICB0aGlzLl9lbCAgICA9IG51bGw7XG4gIHRoaXMuX21vZGVsID0gbnVsbDtcbiAgdGhpcy5fd2lkdGggPSB0aGlzLl9fd2lkdGggPSB3aWR0aCB8fCA1MDA7XG4gIHRoaXMuX2hlaWdodCAgPSB0aGlzLl9faGVpZ2h0ID0gaGVpZ2h0IHx8IDMwMDtcbiAgdGhpcy5fYmdjb2xvciA9IG51bGw7XG4gIHRoaXMuX2F1dG9wYWQgPSAxO1xuICB0aGlzLl9wYWRkaW5nID0ge3RvcDowLCBsZWZ0OjAsIGJvdHRvbTowLCByaWdodDowfTtcbiAgdGhpcy5fdmlld3BvcnQgPSBudWxsO1xuICB0aGlzLl9yZW5kZXJlciA9IG51bGw7XG4gIHRoaXMuX2hhbmRsZXIgID0gbnVsbDtcbiAgdGhpcy5fc3RyZWFtZXIgPSBudWxsOyAvLyBUYXJnZXRlZCB1cGRhdGUgZm9yIHN0cmVhbWluZyBjaGFuZ2VzXG4gIHRoaXMuX2NoYW5nZXNldCA9IG51bGw7XG4gIHRoaXMuX3JlcGFpbnQgPSB0cnVlOyAvLyBGdWxsIHJlLXJlbmRlciBvbiBldmVyeSByZS1pbml0XG4gIHRoaXMuX3JlbmRlcmVycyA9IHtjYW52YXM6IGNhbnZhcywgc3ZnOiBzdmd9O1xuICB0aGlzLl9pbyAgPSBjYW52YXM7XG4gIHRoaXMuX2FwaSA9IHt9OyAvLyBTdGFzaCBzdHJlYW1pbmcgZGF0YSBBUEkgc2FuZGJveGVzLlxufVxuXG52YXIgcHJvdG90eXBlID0gVmlldy5wcm90b3R5cGU7XG5cbnByb3RvdHlwZS5tb2RlbCA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX21vZGVsO1xuICBpZiAodGhpcy5fbW9kZWwgIT09IG1vZGVsKSB7XG4gICAgdGhpcy5fbW9kZWwgPSBtb2RlbDtcbiAgICB0aGlzLl9zdHJlYW1lciA9IG5ldyBOb2RlKG1vZGVsKTtcbiAgICB0aGlzLl9jaGFuZ2VzZXQgPSBjaGFuZ2VzZXQuY3JlYXRlKCk7XG4gICAgaWYgKHRoaXMuX2hhbmRsZXIpIHRoaXMuX2hhbmRsZXIubW9kZWwobW9kZWwpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gU2FuZGJveGVkIHN0cmVhbWluZyBkYXRhIEFQSVxuZnVuY3Rpb24gc3RyZWFtaW5nKHNyYykge1xuICB2YXIgdmlldyA9IHRoaXMsXG4gICAgICBkcyA9IHRoaXMuX21vZGVsLmRhdGEoc3JjKSxcbiAgICAgIG5hbWUgPSBkcy5uYW1lKCksXG4gICAgICBsaXN0ZW5lciA9IGRzLnBpcGVsaW5lKClbMF0sXG4gICAgICBzdHJlYW1lciA9IHRoaXMuX3N0cmVhbWVyLFxuICAgICAgYXBpID0ge307XG5cbiAgLy8gSWYgd2UgaGF2ZSBpdCBzdGFzaGVkLCBkb24ndCBjcmVhdGUgYSBuZXcgY2xvc3VyZS4gXG4gIGlmICh0aGlzLl9hcGlbc3JjXSkgcmV0dXJuIHRoaXMuX2FwaVtzcmNdO1xuXG4gIGFwaS5pbnNlcnQgPSBmdW5jdGlvbih2YWxzKSB7XG4gICAgZHMuaW5zZXJ0KHV0aWwuZHVwbGljYXRlKHZhbHMpKTsgIC8vIERvbid0IHBvbGx1dGUgdGhlIGVudmlyb25tZW50XG4gICAgc3RyZWFtZXIuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHZpZXcuX2NoYW5nZXNldC5kYXRhW25hbWVdID0gMTtcbiAgICByZXR1cm4gYXBpO1xuICB9O1xuXG4gIGFwaS51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBzdHJlYW1lci5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgdmlldy5fY2hhbmdlc2V0LmRhdGFbbmFtZV0gPSAxO1xuICAgIHJldHVybiAoZHMudXBkYXRlLmFwcGx5KGRzLCBhcmd1bWVudHMpLCBhcGkpO1xuICB9O1xuXG4gIGFwaS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgICBzdHJlYW1lci5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgdmlldy5fY2hhbmdlc2V0LmRhdGFbbmFtZV0gPSAxO1xuICAgIHJldHVybiAoZHMucmVtb3ZlLmFwcGx5KGRzLCBhcmd1bWVudHMpLCBhcGkpO1xuICB9O1xuXG4gIGFwaS52YWx1ZXMgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGRzLnZhbHVlcygpOyB9OyAgICBcblxuICByZXR1cm4gKHRoaXMuX2FwaVtzcmNdID0gYXBpKTtcbn1cblxucHJvdG90eXBlLmRhdGEgPSBmdW5jdGlvbihkYXRhKSB7XG4gIHZhciB2ID0gdGhpcztcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdi5fbW9kZWwuZGF0YVZhbHVlcygpO1xuICBlbHNlIGlmICh1dGlsLmlzU3RyaW5nKGRhdGEpKSByZXR1cm4gc3RyZWFtaW5nLmNhbGwodiwgZGF0YSk7XG4gIGVsc2UgaWYgKHV0aWwuaXNPYmplY3QoZGF0YSkpIHtcbiAgICB1dGlsLmtleXMoZGF0YSkuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICB2YXIgYXBpID0gc3RyZWFtaW5nLmNhbGwodiwgayk7XG4gICAgICBkYXRhW2tdKGFwaSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUuc2lnbmFsID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgdmFyIG0gID0gdGhpcy5fbW9kZWwsXG4gICAgICBjcyA9IHRoaXMuX2NoYW5nZXNldCxcbiAgICAgIHN0cmVhbWVyID0gdGhpcy5fc3RyZWFtZXIsXG4gICAgICBzZXR0ZXIgPSBuYW1lOyBcblxuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBtLnNpZ25hbFZhbHVlcygpO1xuICBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDEgJiYgdXRpbC5pc1N0cmluZyhuYW1lKSkgcmV0dXJuIG0uc2lnbmFsVmFsdWVzKG5hbWUpO1xuXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDIpIHtcbiAgICBzZXR0ZXIgPSB7fTtcbiAgICBzZXR0ZXJbbmFtZV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHV0aWwua2V5cyhzZXR0ZXIpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgIHN0cmVhbWVyLmFkZExpc3RlbmVyKG0uc2lnbmFsKGspLnZhbHVlKHNldHRlcltrXSkpO1xuICAgIGNzLnNpZ25hbHNba10gPSAxO1xuICAgIGNzLnJlZmxvdyA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fX3dpZHRoO1xuICBpZiAodGhpcy5fX3dpZHRoICE9PSB3aWR0aCkge1xuICAgIHRoaXMuX3dpZHRoID0gdGhpcy5fX3dpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5tb2RlbCgpLndpZHRoKHdpZHRoKTtcbiAgICB0aGlzLmluaXRpYWxpemUoKTtcbiAgICBpZiAodGhpcy5fc3RyaWN0KSB0aGlzLl9hdXRvcGFkID0gMTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5oZWlnaHQgPSBmdW5jdGlvbihoZWlnaHQpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fX2hlaWdodDtcbiAgaWYgKHRoaXMuX19oZWlnaHQgIT09IGhlaWdodCkge1xuICAgIHRoaXMuX2hlaWdodCA9IHRoaXMuX19oZWlnaHQgPSBoZWlnaHQ7XG4gICAgdGhpcy5tb2RlbCgpLmhlaWdodChoZWlnaHQpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZSgpO1xuICAgIGlmICh0aGlzLl9zdHJpY3QpIHRoaXMuX2F1dG9wYWQgPSAxO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLmJhY2tncm91bmQgPSBmdW5jdGlvbihiZ2NvbG9yKSB7XG4gIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX2JnY29sb3I7XG4gIGlmICh0aGlzLl9iZ2NvbG9yICE9PSBiZ2NvbG9yKSB7XG4gICAgdGhpcy5fYmdjb2xvciA9IGJnY29sb3I7XG4gICAgdGhpcy5pbml0aWFsaXplKCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUucGFkZGluZyA9IGZ1bmN0aW9uKHBhZCkge1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9wYWRkaW5nO1xuICBpZiAodGhpcy5fcGFkZGluZyAhPT0gcGFkKSB7XG4gICAgaWYgKHV0aWwuaXNTdHJpbmcocGFkKSkge1xuICAgICAgdGhpcy5fYXV0b3BhZCA9IDE7XG4gICAgICB0aGlzLl9wYWRkaW5nID0ge3RvcDowLCBsZWZ0OjAsIGJvdHRvbTowLCByaWdodDowfTtcbiAgICAgIHRoaXMuX3N0cmljdCA9IChwYWQgPT09IFwic3RyaWN0XCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9hdXRvcGFkID0gMDtcbiAgICAgIHRoaXMuX3BhZGRpbmcgPSBwYWQ7XG4gICAgICB0aGlzLl9zdHJpY3QgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3JlbmRlcmVyKSB0aGlzLl9yZW5kZXJlci5yZXNpemUodGhpcy5fd2lkdGgsIHRoaXMuX2hlaWdodCwgcGFkKTtcbiAgICBpZiAodGhpcy5faGFuZGxlcikgIHRoaXMuX2hhbmRsZXIucGFkZGluZyhwYWQpO1xuICB9XG4gIHJldHVybiAodGhpcy5fcmVwYWludCA9IHRydWUsIHRoaXMpO1xufTtcblxucHJvdG90eXBlLmF1dG9wYWQgPSBmdW5jdGlvbihvcHQpIHtcbiAgaWYgKHRoaXMuX2F1dG9wYWQgPCAxKSByZXR1cm4gdGhpcztcbiAgZWxzZSB0aGlzLl9hdXRvcGFkID0gMDtcblxuICB2YXIgYiA9IHRoaXMubW9kZWwoKS5zY2VuZSgpLmJvdW5kcyxcbiAgICAgIHBhZCA9IHRoaXMuX3BhZGRpbmcsXG4gICAgICBjb25maWcgPSB0aGlzLm1vZGVsKCkuY29uZmlnKCksXG4gICAgICBpbnNldCA9IGNvbmZpZy5hdXRvcGFkSW5zZXQsXG4gICAgICBsID0gYi54MSA8IDAgPyBNYXRoLmNlaWwoLWIueDEpICsgaW5zZXQgOiAwLFxuICAgICAgdCA9IGIueTEgPCAwID8gTWF0aC5jZWlsKC1iLnkxKSArIGluc2V0IDogMCxcbiAgICAgIHIgPSBiLngyID4gdGhpcy5fd2lkdGggID8gTWF0aC5jZWlsKCtiLngyIC0gdGhpcy5fd2lkdGgpICsgaW5zZXQgOiAwO1xuICBiID0gYi55MiA+IHRoaXMuX2hlaWdodCA/IE1hdGguY2VpbCgrYi55MiAtIHRoaXMuX2hlaWdodCkgKyBpbnNldCA6IDA7XG4gIHBhZCA9IHtsZWZ0OmwsIHRvcDp0LCByaWdodDpyLCBib3R0b206Yn07XG5cbiAgaWYgKHRoaXMuX3N0cmljdCkge1xuICAgIHRoaXMuX2F1dG9wYWQgPSAwO1xuICAgIHRoaXMuX3BhZGRpbmcgPSBwYWQ7XG4gICAgdGhpcy5fd2lkdGggPSBNYXRoLm1heCgwLCB0aGlzLl9fd2lkdGggLSAobCtyKSk7XG4gICAgdGhpcy5faGVpZ2h0ID0gTWF0aC5tYXgoMCwgdGhpcy5fX2hlaWdodCAtICh0K2IpKTtcblxuICAgIHRoaXMuX21vZGVsLndpZHRoKHRoaXMuX3dpZHRoKVxuICAgICAgLmhlaWdodCh0aGlzLl9oZWlnaHQpLnJlc2V0KCk7XG5cbiAgICB0aGlzLmluaXRpYWxpemUoKVxuICAgICAgLnVwZGF0ZSh7cHJvcHM6XCJlbnRlclwifSkudXBkYXRlKHtwcm9wczpcInVwZGF0ZVwifSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5wYWRkaW5nKHBhZCkudXBkYXRlKG9wdCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUudmlld3BvcnQgPSBmdW5jdGlvbihzaXplKSB7XG4gIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3ZpZXdwb3J0O1xuICBpZiAodGhpcy5fdmlld3BvcnQgIT09IHNpemUpIHtcbiAgICB0aGlzLl92aWV3cG9ydCA9IHNpemU7XG4gICAgdGhpcy5pbml0aWFsaXplKCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUucmVuZGVyZXIgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3JlbmRlcmVyO1xuICBpZiAodGhpcy5fcmVuZGVyZXJzW3R5cGVdKSB0eXBlID0gdGhpcy5fcmVuZGVyZXJzW3R5cGVdO1xuICBlbHNlIGlmICh1dGlsLmlzU3RyaW5nKHR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIHJlbmRlcmVyOiBcIiArIHR5cGUpO1xuICBlbHNlIGlmICghdHlwZSkgdGhyb3cgbmV3IEVycm9yKFwiTm8gcmVuZGVyZXIgc3BlY2lmaWVkXCIpO1xuXG4gIGlmICh0aGlzLl9pbyAhPT0gdHlwZSkge1xuICAgIHRoaXMuX2lvID0gdHlwZTtcbiAgICB0aGlzLl9yZW5kZXJlciA9IG51bGw7XG4gICAgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgaWYgKHRoaXMuX2J1aWxkKSB0aGlzLnJlbmRlcigpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbihlbCkge1xuICB2YXIgdiA9IHRoaXMsIHByZXZIYW5kbGVyLFxuICAgICAgdyA9IHYuX3dpZHRoLCBoID0gdi5faGVpZ2h0LCBwYWQgPSB2Ll9wYWRkaW5nLCBiZyA9IHYuX2JnY29sb3IsXG4gICAgICBjb25maWcgPSB0aGlzLm1vZGVsKCkuY29uZmlnKCk7XG5cbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoIHx8IGVsID09PSBudWxsKSB7XG4gICAgZWwgPSB0aGlzLl9lbCA/IHRoaXMuX2VsLnBhcmVudE5vZGUgOiBudWxsO1xuICAgIGlmICghZWwpIHJldHVybiB0aGlzOyAgLy8gVGhpcyBWaWV3IGNhbm5vdCBpbml0IHcvbyBhblxuICB9XG5cbiAgLy8gY2xlYXIgcHJlLWV4aXN0aW5nIGNvbnRhaW5lclxuICBkMy5zZWxlY3QoZWwpLnNlbGVjdChcImRpdi52ZWdhXCIpLnJlbW92ZSgpO1xuICBcbiAgLy8gYWRkIGRpdiBjb250YWluZXJcbiAgdGhpcy5fZWwgPSBlbCA9IGQzLnNlbGVjdChlbClcbiAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInZlZ2FcIilcbiAgICAuc3R5bGUoXCJwb3NpdGlvblwiLCBcInJlbGF0aXZlXCIpXG4gICAgLm5vZGUoKTtcbiAgaWYgKHYuX3ZpZXdwb3J0KSB7XG4gICAgZDMuc2VsZWN0KGVsKVxuICAgICAgLnN0eWxlKFwid2lkdGhcIiwgICh2Ll92aWV3cG9ydFswXSB8fCB3KStcInB4XCIpXG4gICAgICAuc3R5bGUoXCJoZWlnaHRcIiwgKHYuX3ZpZXdwb3J0WzFdIHx8IGgpK1wicHhcIilcbiAgICAgIC5zdHlsZShcIm92ZXJmbG93XCIsIFwiYXV0b1wiKTtcbiAgfVxuXG4gIC8vIHJlbmRlcmVyXG4gIHYuX3JlbmRlcmVyID0gKHYuX3JlbmRlcmVyIHx8IG5ldyB0aGlzLl9pby5SZW5kZXJlcihjb25maWcubG9hZCkpXG4gICAgLmluaXRpYWxpemUoZWwsIHcsIGgsIHBhZClcbiAgICAuYmFja2dyb3VuZChiZyk7XG4gIFxuICAvLyBpbnB1dCBoYW5kbGVyXG4gIHByZXZIYW5kbGVyID0gdi5faGFuZGxlcjtcbiAgdi5faGFuZGxlciA9IG5ldyB0aGlzLl9pby5IYW5kbGVyKClcbiAgICAuaW5pdGlhbGl6ZShlbCwgcGFkLCB2KTtcblxuICBpZiAocHJldkhhbmRsZXIpIHtcbiAgICBwcmV2SGFuZGxlci5oYW5kbGVycygpLmZvckVhY2goZnVuY3Rpb24oaCkge1xuICAgICAgdi5faGFuZGxlci5vbihoLnR5cGUsIGguaGFuZGxlcik7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gUmVnaXN0ZXIgZXZlbnQgbGlzdGVuZXJzIGZvciBzaWduYWwgc3RyZWFtIGRlZmluaXRpb25zLlxuICAgIHYuX2RldGFjaCA9IHBhcnNlU3RyZWFtcyh0aGlzKTtcbiAgfVxuICBcbiAgcmV0dXJuICh0aGlzLl9yZXBhaW50ID0gdHJ1ZSwgdGhpcyk7XG59O1xuXG5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5fZGV0YWNoKSB0aGlzLl9kZXRhY2goKTtcbn07XG5cbmZ1bmN0aW9uIGJ1aWxkKCkge1xuICB2YXIgdiA9IHRoaXM7XG4gIHYuX3JlbmRlck5vZGUgPSBuZXcgTm9kZSh2Ll9tb2RlbClcbiAgICAucm91dGVyKHRydWUpO1xuXG4gIHYuX3JlbmRlck5vZGUuZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICAgIGxvZy5kZWJ1ZyhpbnB1dCwgWydyZW5kZXJpbmcnXSk7XG5cbiAgICB2YXIgcyA9IHYuX21vZGVsLnNjZW5lKCksXG4gICAgICAgIGggPSB2Ll9oYW5kbGVyLFxuICAgICAgICBkO1xuXG4gICAgaWYgKGggJiYgaC5zY2VuZSkgaC5zY2VuZShzKTtcblxuICAgIGlmIChpbnB1dC50cmFucykge1xuICAgICAgaW5wdXQudHJhbnMuc3RhcnQoZnVuY3Rpb24oaXRlbXMpIHsgdi5fcmVuZGVyZXIucmVuZGVyKHMsIGl0ZW1zKTsgfSk7XG4gICAgfSBlbHNlIGlmICh2Ll9yZXBhaW50KSB7XG4gICAgICB2Ll9yZW5kZXJlci5yZW5kZXIocyk7XG4gICAgICB2Ll9yZXBhaW50ID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChpbnB1dC5kaXJ0eS5sZW5ndGgpIHtcbiAgICAgIHYuX3JlbmRlcmVyLnJlbmRlcihzLCBpbnB1dC5kaXJ0eSk7XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LmRpcnR5Lmxlbmd0aCkge1xuICAgICAgaW5wdXQuZGlydHkuZm9yRWFjaChmdW5jdGlvbihpKSB7IGkuX2RpcnR5ID0gZmFsc2U7IH0pO1xuICAgICAgcy5pdGVtc1swXS5fZGlydHkgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBGb3IgYWxsIHVwZGF0ZWQgZGF0YXNvdXJjZXMsIGNsZWFyIHRoZWlyIHByZXZpb3VzIHZhbHVlcy5cbiAgICBmb3IgKGQgaW4gaW5wdXQuZGF0YSkgdi5fbW9kZWwuZGF0YShkKS5maW5hbGl6ZSgpO1xuICAgIHJldHVybiBpbnB1dDtcbiAgfTtcblxuICByZXR1cm4gKHYuX21vZGVsLnNjZW5lKHYuX3JlbmRlck5vZGUpLCB0cnVlKTsgIFxufVxuXG5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24ob3B0KSB7ICAgXG4gIG9wdCA9IG9wdCB8fCB7fTtcbiAgdmFyIHYgPSB0aGlzLFxuICAgICAgdHJhbnMgPSBvcHQuZHVyYXRpb24gPyBuZXcgVHJhbnNpdGlvbihvcHQuZHVyYXRpb24sIG9wdC5lYXNlKSA6IG51bGw7XG5cbiAgdmFyIGNzID0gdi5fY2hhbmdlc2V0O1xuICBpZiAodHJhbnMpIGNzLnRyYW5zID0gdHJhbnM7XG4gIGlmIChvcHQucHJvcHMgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh1dGlsLmtleXMoY3MuZGF0YSkubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgIFwiTmV3IGRhdGEgdmFsdWVzIGFyZSBub3QgcmVmbGVjdGVkIGluIHRoZSB2aXN1YWxpemF0aW9uLlwiICtcbiAgICAgICAgXCIgUGxlYXNlIGNhbGwgdmlldy51cGRhdGUoKSBiZWZvcmUgdXBkYXRpbmcgYSBzcGVjaWZpZWQgcHJvcGVydHkgc2V0LlwiXG4gICAgICApO1xuICAgIH1cblxuICAgIGNzLnJlZmxvdyAgPSB0cnVlO1xuICAgIGNzLnJlcXVlc3QgPSBvcHQucHJvcHM7XG4gIH1cblxuICB2YXIgYnVpbHQgPSB2Ll9idWlsZDtcbiAgdi5fYnVpbGQgPSB2Ll9idWlsZCB8fCBidWlsZC5jYWxsKHRoaXMpO1xuXG4gIC8vIElmIHNwZWNpZmljIGl0ZW1zIGFyZSBzcGVjaWZpZWQsIHNob3J0LWNpcmN1aXQgZGF0YWZsb3cgZ3JhcGguXG4gIC8vIEVsc2UtSWYgdGhlcmUgYXJlIHN0cmVhbWluZyB1cGRhdGVzLCBwZXJmb3JtIGEgdGFyZ2V0ZWQgcHJvcGFnYXRpb24uXG4gIC8vIE90aGVyd2lzZSwgcmVldmFsdWF0ZSB0aGUgZW50aXJlIG1vZGVsIChkYXRhc291cmNlcyArIHNjZW5lKS5cbiAgaWYgKG9wdC5pdGVtcyAmJiBidWlsdCkgeyBcbiAgICBFbmNvZGVyLnVwZGF0ZSh0aGlzLl9tb2RlbCwgb3B0LnRyYW5zLCBvcHQucHJvcHMsIG9wdC5pdGVtcywgY3MuZGlydHkpO1xuICAgIHYuX3JlbmRlck5vZGUuZXZhbHVhdGUoY3MpO1xuICB9IGVsc2UgaWYgKHYuX3N0cmVhbWVyLmxpc3RlbmVycygpLmxlbmd0aCAmJiBidWlsdCkge1xuICAgIHYuX21vZGVsLnByb3BhZ2F0ZShjcywgdi5fc3RyZWFtZXIpO1xuICAgIHYuX3N0cmVhbWVyLmRpc2Nvbm5lY3QoKTtcbiAgfSBlbHNlIHtcbiAgICB2Ll9tb2RlbC5maXJlKGNzKTtcbiAgfVxuXG4gIHYuX2NoYW5nZXNldCA9IGNoYW5nZXNldC5jcmVhdGUoKTtcblxuICByZXR1cm4gdi5hdXRvcGFkKG9wdCk7XG59O1xuXG5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oaXRlbXMpIHtcbiAgdGhpcy5fcmVuZGVyZXIucmVuZGVyKHRoaXMuX21vZGVsLnNjZW5lKCksIGl0ZW1zKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUub24gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5faGFuZGxlci5vbi5hcHBseSh0aGlzLl9oYW5kbGVyLCBhcmd1bWVudHMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5vblNpZ25hbCA9IGZ1bmN0aW9uKG5hbWUsIGhhbmRsZXIpIHtcbiAgdGhpcy5fbW9kZWwuc2lnbmFsKG5hbWUpLm9uKGhhbmRsZXIpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5faGFuZGxlci5vZmYuYXBwbHkodGhpcy5faGFuZGxlciwgYXJndW1lbnRzKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90b3R5cGUub2ZmU2lnbmFsID0gZnVuY3Rpb24obmFtZSwgaGFuZGxlcikge1xuICB0aGlzLl9tb2RlbC5zaWduYWwobmFtZSkub2ZmKGhhbmRsZXIpO1xuICByZXR1cm4gdGhpcztcbn07XG5cblZpZXcuZmFjdG9yeSA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gIHZhciBIZWFkbGVzc1ZpZXcgPSByZXF1aXJlKCcuL0hlYWRsZXNzVmlldycpO1xuICByZXR1cm4gZnVuY3Rpb24ob3B0KSB7XG4gICAgb3B0ID0gb3B0IHx8IHt9O1xuICAgIHZhciBkZWZzID0gbW9kZWwuZGVmcygpO1xuICAgIHZhciB2ID0gKG9wdC5lbCA/IG5ldyBWaWV3KCkgOiBuZXcgSGVhZGxlc3NWaWV3KCkpXG4gICAgICAubW9kZWwobW9kZWwpXG4gICAgICAucmVuZGVyZXIob3B0LnJlbmRlcmVyIHx8IFwiY2FudmFzXCIpXG4gICAgICAud2lkdGgoZGVmcy53aWR0aClcbiAgICAgIC5oZWlnaHQoZGVmcy5oZWlnaHQpXG4gICAgICAuYmFja2dyb3VuZChkZWZzLmJhY2tncm91bmQpXG4gICAgICAucGFkZGluZyhkZWZzLnBhZGRpbmcpXG4gICAgICAudmlld3BvcnQoZGVmcy52aWV3cG9ydClcbiAgICAgIC5pbml0aWFsaXplKG9wdC5lbCk7XG5cbiAgICBpZiAob3B0LmRhdGEpIHYuZGF0YShvcHQuZGF0YSk7XG5cbiAgICBpZiAob3B0LmhvdmVyICE9PSBmYWxzZSAmJiBvcHQuZWwpIHtcbiAgICAgIHYub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZXZ0LCBpdGVtKSB7XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0uaGFzUHJvcGVydHlTZXQoXCJob3ZlclwiKSkge1xuICAgICAgICAgIHRoaXMudXBkYXRlKHtwcm9wczpcImhvdmVyXCIsIGl0ZW1zOml0ZW19KTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGV2dCwgaXRlbSkge1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLmhhc1Byb3BlcnR5U2V0KFwiaG92ZXJcIikpIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZSh7cHJvcHM6XCJ1cGRhdGVcIiwgaXRlbXM6aXRlbX0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIFxuICAgIHJldHVybiB2O1xuICB9OyAgICBcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmlldzsiXX0=
},{"../parse/streams":99,"../scene/Encoder":103,"../scene/Transition":106,"./HeadlessView":79,"datalib/src/util":20,"vega-dataflow/src/ChangeSet":26,"vega-dataflow/src/Node":31,"vega-logging":41,"vega-scenegraph/src/render/canvas":52,"vega-scenegraph/src/render/svg":68}],82:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    config = {};

config.load = {
  // base url for loading external data files
  // used only for server-side operation
  baseURL: '',
  // Allows domain restriction when using data loading via XHR.
  // To enable, set it to a list of allowed domains
  // e.g., ['wikipedia.org', 'eff.org']
  domainWhiteList: false
};

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
  lineCap:   'butt',
  font:      'sans-serif',
  fontSize:  11
};

// default axis properties
config.axis = {
  orient: 'bottom',
  ticks: 10,
  padding: 3,
  axisColor: '#000',
  gridColor: '#000',
  gridOpacity: 0.15,
  tickColor: '#000',
  tickLabelColor: '#000',
  axisWidth: 1,
  tickWidth: 1,
  tickSize: 6,
  tickLabelFontSize: 11,
  tickLabelFont: 'sans-serif',
  titleColor: '#000',
  titleFont: 'sans-serif',
  titleFontSize: 11,
  titleFontWeight: 'bold',
  titleOffset: 35
};

// default legend properties
config.legend = {
  orient: 'right',
  offset: 20,
  padding: 3,
  gradientStrokeColor: '#888',
  gradientStrokeWidth: 1,
  gradientHeight: 16,
  gradientWidth: 100,
  labelColor: '#000',
  labelFontSize: 10,
  labelFont: 'sans-serif',
  labelAlign: 'left',
  labelBaseline: 'middle',
  labelOffset: 8,
  symbolShape: 'circle',
  symbolSize: 50,
  symbolColor: '#888',
  symbolStrokeWidth: 1,
  titleColor: '#000',
  titleFont: 'sans-serif',
  titleFontSize: 11,
  titleFontWeight: 'bold'
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
    '#1f77b4',
    '#ff7f0e',
    '#2ca02c',
    '#d62728',
    '#9467bd',
    '#8c564b',
    '#e377c2',
    '#7f7f7f',
    '#bcbd22',
    '#17becf'
  ],
  category20: [
    '#1f77b4',
    '#aec7e8',
    '#ff7f0e',
    '#ffbb78',
    '#2ca02c',
    '#98df8a',
    '#d62728',
    '#ff9896',
    '#9467bd',
    '#c5b0d5',
    '#8c564b',
    '#c49c94',
    '#e377c2',
    '#f7b6d2',
    '#7f7f7f',
    '#c7c7c7',
    '#bcbd22',
    '#dbdb8d',
    '#17becf',
    '#9edae5'
  ],
  shapes: [
    'circle',
    'cross',
    'diamond',
    'square',
    'triangle-down',
    'triangle-up'
  ]
};

module.exports = config;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9jb3JlL2NvbmZpZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbInZhciBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICAgIGNvbmZpZyA9IHt9O1xuXG5jb25maWcubG9hZCA9IHtcbiAgLy8gYmFzZSB1cmwgZm9yIGxvYWRpbmcgZXh0ZXJuYWwgZGF0YSBmaWxlc1xuICAvLyB1c2VkIG9ubHkgZm9yIHNlcnZlci1zaWRlIG9wZXJhdGlvblxuICBiYXNlVVJMOiAnJyxcbiAgLy8gQWxsb3dzIGRvbWFpbiByZXN0cmljdGlvbiB3aGVuIHVzaW5nIGRhdGEgbG9hZGluZyB2aWEgWEhSLlxuICAvLyBUbyBlbmFibGUsIHNldCBpdCB0byBhIGxpc3Qgb2YgYWxsb3dlZCBkb21haW5zXG4gIC8vIGUuZy4sIFsnd2lraXBlZGlhLm9yZycsICdlZmYub3JnJ11cbiAgZG9tYWluV2hpdGVMaXN0OiBmYWxzZVxufTtcblxuLy8gaW5zZXQgcGFkZGluZyBmb3IgYXV0b21hdGljIHBhZGRpbmcgY2FsY3VsYXRpb25cbmNvbmZpZy5hdXRvcGFkSW5zZXQgPSA1O1xuXG4vLyBleHRlbnNpYmxlIHNjYWxlIGxvb2t1cCB0YWJsZVxuLy8gYWxsIGQzLnNjYWxlLiogaW5zdGFuY2VzIGFsc28gc3VwcG9ydGVkXG5jb25maWcuc2NhbGUgPSB7XG4gIHRpbWU6IGQzLnRpbWUuc2NhbGUsXG4gIHV0YzogIGQzLnRpbWUuc2NhbGUudXRjXG59O1xuXG4vLyBkZWZhdWx0IHJlbmRlcmluZyBzZXR0aW5nc1xuY29uZmlnLnJlbmRlciA9IHtcbiAgbGluZVdpZHRoOiAxLFxuICBsaW5lQ2FwOiAgICdidXR0JyxcbiAgZm9udDogICAgICAnc2Fucy1zZXJpZicsXG4gIGZvbnRTaXplOiAgMTFcbn07XG5cbi8vIGRlZmF1bHQgYXhpcyBwcm9wZXJ0aWVzXG5jb25maWcuYXhpcyA9IHtcbiAgb3JpZW50OiAnYm90dG9tJyxcbiAgdGlja3M6IDEwLFxuICBwYWRkaW5nOiAzLFxuICBheGlzQ29sb3I6ICcjMDAwJyxcbiAgZ3JpZENvbG9yOiAnIzAwMCcsXG4gIGdyaWRPcGFjaXR5OiAwLjE1LFxuICB0aWNrQ29sb3I6ICcjMDAwJyxcbiAgdGlja0xhYmVsQ29sb3I6ICcjMDAwJyxcbiAgYXhpc1dpZHRoOiAxLFxuICB0aWNrV2lkdGg6IDEsXG4gIHRpY2tTaXplOiA2LFxuICB0aWNrTGFiZWxGb250U2l6ZTogMTEsXG4gIHRpY2tMYWJlbEZvbnQ6ICdzYW5zLXNlcmlmJyxcbiAgdGl0bGVDb2xvcjogJyMwMDAnLFxuICB0aXRsZUZvbnQ6ICdzYW5zLXNlcmlmJyxcbiAgdGl0bGVGb250U2l6ZTogMTEsXG4gIHRpdGxlRm9udFdlaWdodDogJ2JvbGQnLFxuICB0aXRsZU9mZnNldDogMzVcbn07XG5cbi8vIGRlZmF1bHQgbGVnZW5kIHByb3BlcnRpZXNcbmNvbmZpZy5sZWdlbmQgPSB7XG4gIG9yaWVudDogJ3JpZ2h0JyxcbiAgb2Zmc2V0OiAyMCxcbiAgcGFkZGluZzogMyxcbiAgZ3JhZGllbnRTdHJva2VDb2xvcjogJyM4ODgnLFxuICBncmFkaWVudFN0cm9rZVdpZHRoOiAxLFxuICBncmFkaWVudEhlaWdodDogMTYsXG4gIGdyYWRpZW50V2lkdGg6IDEwMCxcbiAgbGFiZWxDb2xvcjogJyMwMDAnLFxuICBsYWJlbEZvbnRTaXplOiAxMCxcbiAgbGFiZWxGb250OiAnc2Fucy1zZXJpZicsXG4gIGxhYmVsQWxpZ246ICdsZWZ0JyxcbiAgbGFiZWxCYXNlbGluZTogJ21pZGRsZScsXG4gIGxhYmVsT2Zmc2V0OiA4LFxuICBzeW1ib2xTaGFwZTogJ2NpcmNsZScsXG4gIHN5bWJvbFNpemU6IDUwLFxuICBzeW1ib2xDb2xvcjogJyM4ODgnLFxuICBzeW1ib2xTdHJva2VXaWR0aDogMSxcbiAgdGl0bGVDb2xvcjogJyMwMDAnLFxuICB0aXRsZUZvbnQ6ICdzYW5zLXNlcmlmJyxcbiAgdGl0bGVGb250U2l6ZTogMTEsXG4gIHRpdGxlRm9udFdlaWdodDogJ2JvbGQnXG59O1xuXG4vLyBkZWZhdWx0IGNvbG9yIHZhbHVlc1xuY29uZmlnLmNvbG9yID0ge1xuICByZ2I6IFsxMjgsIDEyOCwgMTI4XSxcbiAgbGFiOiBbNTAsIDAsIDBdLFxuICBoY2w6IFswLCAwLCA1MF0sXG4gIGhzbDogWzAsIDAsIDAuNV1cbn07XG5cbi8vIGRlZmF1bHQgc2NhbGUgcmFuZ2VzXG5jb25maWcucmFuZ2UgPSB7XG4gIGNhdGVnb3J5MTA6IFtcbiAgICAnIzFmNzdiNCcsXG4gICAgJyNmZjdmMGUnLFxuICAgICcjMmNhMDJjJyxcbiAgICAnI2Q2MjcyOCcsXG4gICAgJyM5NDY3YmQnLFxuICAgICcjOGM1NjRiJyxcbiAgICAnI2UzNzdjMicsXG4gICAgJyM3ZjdmN2YnLFxuICAgICcjYmNiZDIyJyxcbiAgICAnIzE3YmVjZidcbiAgXSxcbiAgY2F0ZWdvcnkyMDogW1xuICAgICcjMWY3N2I0JyxcbiAgICAnI2FlYzdlOCcsXG4gICAgJyNmZjdmMGUnLFxuICAgICcjZmZiYjc4JyxcbiAgICAnIzJjYTAyYycsXG4gICAgJyM5OGRmOGEnLFxuICAgICcjZDYyNzI4JyxcbiAgICAnI2ZmOTg5NicsXG4gICAgJyM5NDY3YmQnLFxuICAgICcjYzViMGQ1JyxcbiAgICAnIzhjNTY0YicsXG4gICAgJyNjNDljOTQnLFxuICAgICcjZTM3N2MyJyxcbiAgICAnI2Y3YjZkMicsXG4gICAgJyM3ZjdmN2YnLFxuICAgICcjYzdjN2M3JyxcbiAgICAnI2JjYmQyMicsXG4gICAgJyNkYmRiOGQnLFxuICAgICcjMTdiZWNmJyxcbiAgICAnIzllZGFlNSdcbiAgXSxcbiAgc2hhcGVzOiBbXG4gICAgJ2NpcmNsZScsXG4gICAgJ2Nyb3NzJyxcbiAgICAnZGlhbW9uZCcsXG4gICAgJ3NxdWFyZScsXG4gICAgJ3RyaWFuZ2xlLWRvd24nLFxuICAgICd0cmlhbmdsZS11cCdcbiAgXVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjb25maWc7Il19
},{}],83:[function(require,module,exports){
var util = require('datalib/src/util'),
    load = require('datalib/src/import/readers'),
    parse = require('../parse'),
    Scale = require('../scene/Scale'),
    config = require('./config');

function compile(module, opt, schema) {
  var s = module.schema;
  if (!s) return;
  if (s.refs) util.extend(schema.refs, s.refs);
  if (s.defs) util.extend(schema.defs, s.defs);
}

module.exports = function(opt) {
  var schema = null;
  opt = opt || {};

  // Compile if we're not loading the schema from a URL. 
  // Load from a URL to extend the existing base schema.
  if (opt.url) {
    schema = load.json(util.extend({url: opt.url}, config.load));
  } else {
    schema = {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "title": "Vega Visualization Specification Language",
      "defs": {}, 
      "refs": {}, 
      "$ref": "#/defs/spec"
    };

    util.keys(parse).forEach(function(k) { compile(parse[k], opt, schema); });

    // Scales aren't in the parser, add schema manually
    compile(Scale, opt, schema);
  }

  // Extend schema to support custom mark properties or property sets.
  if (opt.properties) util.keys(opt.properties).forEach(function(k) {
    schema.defs.propset.properties[k] = {"$ref": "#/refs/"+opt.properties[k]+"Value"};
  });

  if (opt.propertySets) util.keys(opt.propertySets).forEach(function(k) {
    schema.defs.mark.properties.properties.properties[k] = {"$ref": "#/defs/propset"};
  });

  return schema;
};
},{"../parse":89,"../scene/Scale":105,"./config":82,"datalib/src/import/readers":15,"datalib/src/util":20}],84:[function(require,module,exports){
var util = require('datalib/src/util'),
    axs = require('../scene/axis');

var ORIENT = {
  "x":      "bottom",
  "y":      "left",
  "top":    "top",
  "bottom": "bottom",
  "left":   "left",
  "right":  "right"
};

function parseAxes(model, spec, axes, group) {
  var config = model.config();
  (spec || []).forEach(function(def, index) {
    axes[index] = axes[index] || axs(model);
    parseAxis(config, def, index, axes[index], group);
  });
}

function parseAxis(config, def, index, axis, group) {
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
  axis.titleOffset(def.titleOffset != null ?
    def.titleOffset : config.axis.titleOffset);
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
    axis.majorTickProperties(p.majorTicks ?
      util.extend({}, p.ticks, p.majorTicks) : p.ticks);
    axis.minorTickProperties(p.minorTicks ?
      util.extend({}, p.ticks, p.minorTicks) : p.ticks);
  } else {
    axis.majorTickProperties(p && p.majorTicks || {});
    axis.minorTickProperties(p && p.minorTicks || {});
  }
  axis.tickLabelProperties(p && p.labels || {});
  axis.titleProperties(p && p.title || {});
  axis.gridLineProperties(p && p.grid || {});
  axis.domainProperties(p && p.axis || {});
}

module.exports = parseAxes;
},{"../scene/axis":107,"datalib/src/util":20}],85:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null);

function parseBg(bg) {
  // return null if input is null or undefined
  if (bg == null) return null;
  // run through d3 rgb to sanity check
  return d3.rgb(bg) + "";  
}

module.exports = parseBg;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9wYXJzZS9iYWNrZ3JvdW5kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCk7XG5cbmZ1bmN0aW9uIHBhcnNlQmcoYmcpIHtcbiAgLy8gcmV0dXJuIG51bGwgaWYgaW5wdXQgaXMgbnVsbCBvciB1bmRlZmluZWRcbiAgaWYgKGJnID09IG51bGwpIHJldHVybiBudWxsO1xuICAvLyBydW4gdGhyb3VnaCBkMyByZ2IgdG8gc2FuaXR5IGNoZWNrXG4gIHJldHVybiBkMy5yZ2IoYmcpICsgXCJcIjsgIFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlQmc7Il19
},{}],86:[function(require,module,exports){
var load = require('datalib/src/import/load'),
    read = require('datalib/src/import/read'),
    util = require('datalib/src/util'),
    log = require('vega-logging'),
    parseTransforms = require('./transforms'),
    parseModify = require('./modify');

function parseData(model, spec, callback) {
  var config = model.config(),
      count = 0;

  function loaded(d) {
    return function(error, data) {
      if (error) {
        log.error("LOADING FAILED: " + d.url + " " + error);
      } else {
        model.data(d.name).values(read(data, d.format));
      }
      if (--count === 0) callback();
    };
  }

  // process each data set definition
  (spec || []).forEach(function(d) {
    if (d.url) {
      count += 1;
      load(util.extend({url: d.url}, config.load), loaded(d));
    }
    parseData.datasource(model, d);
  });

  if (count === 0) setTimeout(callback, 1);
  return spec;
}

parseData.datasource = function(model, d) {
  var transform = (d.transform || []).map(function(t) {
        return parseTransforms(model, t); 
      }),
      mod = (d.modify || []).map(function(m) {
        return parseModify(model, m, d);
      }),
      ds = model.data(d.name, mod.concat(transform));

  if (d.values) {
    ds.values(read(d.values, d.format));
  } else if (d.source) {
    ds.source(d.source)
      .revises(ds.revises()) // If new ds revises, then it's origin must revise too.
      .addListener(ds);  // Derived ds will be pulsed by its src rather than the model.
    model.removeListener(ds.pipeline()[0]); 
  }

  return ds;    
};

module.exports = parseData;
},{"./modify":93,"./transforms":100,"datalib/src/import/load":13,"datalib/src/import/read":14,"datalib/src/util":20,"vega-logging":41}],87:[function(require,module,exports){
module.exports = (function() {
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
        peg$c3 = function(o, m) { return [o].concat(m); },
        peg$c4 = function(o) { return [o]; },
        peg$c5 = "[",
        peg$c6 = { type: "literal", value: "[", description: "\"[\"" },
        peg$c7 = "]",
        peg$c8 = { type: "literal", value: "]", description: "\"]\"" },
        peg$c9 = ">",
        peg$c10 = { type: "literal", value: ">", description: "\">\"" },
        peg$c11 = function(f1, f2, o) { return {start: f1, end: f2, middle: o}; },
        peg$c12 = [],
        peg$c13 = function(s, f) { return (s.filters = f, s); },
        peg$c14 = function(s) { return s; },
        peg$c15 = "(",
        peg$c16 = { type: "literal", value: "(", description: "\"(\"" },
        peg$c17 = ")",
        peg$c18 = { type: "literal", value: ")", description: "\")\"" },
        peg$c19 = function(m) { return {stream: m}; },
        peg$c20 = "@",
        peg$c21 = { type: "literal", value: "@", description: "\"@\"" },
        peg$c22 = ":",
        peg$c23 = { type: "literal", value: ":", description: "\":\"" },
        peg$c24 = function(n, e) { return {event: e, name: n}; },
        peg$c25 = function(m, e) { return {event: e, mark: m}; },
        peg$c26 = function(t, e) { return {event: e, target: t}; },
        peg$c27 = function(e) { return {event: e}; },
        peg$c28 = function(s) { return {signal: s}; },
        peg$c29 = "rect",
        peg$c30 = { type: "literal", value: "rect", description: "\"rect\"" },
        peg$c31 = "symbol",
        peg$c32 = { type: "literal", value: "symbol", description: "\"symbol\"" },
        peg$c33 = "path",
        peg$c34 = { type: "literal", value: "path", description: "\"path\"" },
        peg$c35 = "arc",
        peg$c36 = { type: "literal", value: "arc", description: "\"arc\"" },
        peg$c37 = "area",
        peg$c38 = { type: "literal", value: "area", description: "\"area\"" },
        peg$c39 = "line",
        peg$c40 = { type: "literal", value: "line", description: "\"line\"" },
        peg$c41 = "rule",
        peg$c42 = { type: "literal", value: "rule", description: "\"rule\"" },
        peg$c43 = "image",
        peg$c44 = { type: "literal", value: "image", description: "\"image\"" },
        peg$c45 = "text",
        peg$c46 = { type: "literal", value: "text", description: "\"text\"" },
        peg$c47 = "group",
        peg$c48 = { type: "literal", value: "group", description: "\"group\"" },
        peg$c49 = "mousedown",
        peg$c50 = { type: "literal", value: "mousedown", description: "\"mousedown\"" },
        peg$c51 = "mouseup",
        peg$c52 = { type: "literal", value: "mouseup", description: "\"mouseup\"" },
        peg$c53 = "click",
        peg$c54 = { type: "literal", value: "click", description: "\"click\"" },
        peg$c55 = "dblclick",
        peg$c56 = { type: "literal", value: "dblclick", description: "\"dblclick\"" },
        peg$c57 = "wheel",
        peg$c58 = { type: "literal", value: "wheel", description: "\"wheel\"" },
        peg$c59 = "keydown",
        peg$c60 = { type: "literal", value: "keydown", description: "\"keydown\"" },
        peg$c61 = "keypress",
        peg$c62 = { type: "literal", value: "keypress", description: "\"keypress\"" },
        peg$c63 = "keyup",
        peg$c64 = { type: "literal", value: "keyup", description: "\"keyup\"" },
        peg$c65 = "mousewheel",
        peg$c66 = { type: "literal", value: "mousewheel", description: "\"mousewheel\"" },
        peg$c67 = "mousemove",
        peg$c68 = { type: "literal", value: "mousemove", description: "\"mousemove\"" },
        peg$c69 = "mouseout",
        peg$c70 = { type: "literal", value: "mouseout", description: "\"mouseout\"" },
        peg$c71 = "mouseover",
        peg$c72 = { type: "literal", value: "mouseover", description: "\"mouseover\"" },
        peg$c73 = "mouseenter",
        peg$c74 = { type: "literal", value: "mouseenter", description: "\"mouseenter\"" },
        peg$c75 = "touchstart",
        peg$c76 = { type: "literal", value: "touchstart", description: "\"touchstart\"" },
        peg$c77 = "touchmove",
        peg$c78 = { type: "literal", value: "touchmove", description: "\"touchmove\"" },
        peg$c79 = "touchend",
        peg$c80 = { type: "literal", value: "touchend", description: "\"touchend\"" },
        peg$c81 = function(e) { return e; },
        peg$c82 = /^[a-zA-Z0-9_\-]/,
        peg$c83 = { type: "class", value: "[a-zA-Z0-9_\\-]", description: "[a-zA-Z0-9_\\-]" },
        peg$c84 = function(n) { return n.join(""); },
        peg$c85 = /^[a-zA-Z0-9\-_  #.>+~[\]=|\^$*]/,
        peg$c86 = { type: "class", value: "[a-zA-Z0-9\\-_  #.>+~[\\]=|\\^$*]", description: "[a-zA-Z0-9\\-_  #.>+~[\\]=|\\^$*]" },
        peg$c87 = function(c) { return c.join(""); },
        peg$c88 = /^['"a-zA-Z0-9_().><=! \t-&|~]/,
        peg$c89 = { type: "class", value: "['\"a-zA-Z0-9_().><=! \\t-&|~]", description: "['\"a-zA-Z0-9_().><=! \\t-&|~]" },
        peg$c90 = function(v) { return v.join(""); },
        peg$c91 = /^[ \t\r\n]/,
        peg$c92 = { type: "class", value: "[ \\t\\r\\n]", description: "[ \\t\\r\\n]" },

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
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 40) {
        s1 = peg$c15;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c16); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsemerged();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 41) {
            s3 = peg$c17;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c18); }
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c19(s2);
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
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 64) {
          s1 = peg$c20;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c21); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsename();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 58) {
              s3 = peg$c22;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c23); }
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parseeventType();
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c24(s2, s4);
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
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsemarkType();
          if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 58) {
              s2 = peg$c22;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c23); }
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parseeventType();
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c25(s1, s3);
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
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsecss();
            if (s1 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 58) {
                s2 = peg$c22;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c23); }
              }
              if (s2 !== peg$FAILED) {
                s3 = peg$parseeventType();
                if (s3 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c26(s1, s3);
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
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parseeventType();
              if (s1 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c27(s1);
              }
              s0 = s1;
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parsename();
                if (s1 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c28(s1);
                }
                s0 = s1;
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsemarkType() {
      var s0;

      if (input.substr(peg$currPos, 4) === peg$c29) {
        s0 = peg$c29;
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c30); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 6) === peg$c31) {
          s0 = peg$c31;
          peg$currPos += 6;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c32); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 4) === peg$c33) {
            s0 = peg$c33;
            peg$currPos += 4;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c34); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 3) === peg$c35) {
              s0 = peg$c35;
              peg$currPos += 3;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c36); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 4) === peg$c37) {
                s0 = peg$c37;
                peg$currPos += 4;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c38); }
              }
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 4) === peg$c39) {
                  s0 = peg$c39;
                  peg$currPos += 4;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c40); }
                }
                if (s0 === peg$FAILED) {
                  if (input.substr(peg$currPos, 4) === peg$c41) {
                    s0 = peg$c41;
                    peg$currPos += 4;
                  } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c42); }
                  }
                  if (s0 === peg$FAILED) {
                    if (input.substr(peg$currPos, 5) === peg$c43) {
                      s0 = peg$c43;
                      peg$currPos += 5;
                    } else {
                      s0 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c44); }
                    }
                    if (s0 === peg$FAILED) {
                      if (input.substr(peg$currPos, 4) === peg$c45) {
                        s0 = peg$c45;
                        peg$currPos += 4;
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

    function peg$parseeventType() {
      var s0;

      if (input.substr(peg$currPos, 9) === peg$c49) {
        s0 = peg$c49;
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c50); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 7) === peg$c51) {
          s0 = peg$c51;
          peg$currPos += 7;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c52); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 5) === peg$c53) {
            s0 = peg$c53;
            peg$currPos += 5;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c54); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 8) === peg$c55) {
              s0 = peg$c55;
              peg$currPos += 8;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c56); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 5) === peg$c57) {
                s0 = peg$c57;
                peg$currPos += 5;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c58); }
              }
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 7) === peg$c59) {
                  s0 = peg$c59;
                  peg$currPos += 7;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c60); }
                }
                if (s0 === peg$FAILED) {
                  if (input.substr(peg$currPos, 8) === peg$c61) {
                    s0 = peg$c61;
                    peg$currPos += 8;
                  } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c62); }
                  }
                  if (s0 === peg$FAILED) {
                    if (input.substr(peg$currPos, 5) === peg$c63) {
                      s0 = peg$c63;
                      peg$currPos += 5;
                    } else {
                      s0 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c64); }
                    }
                    if (s0 === peg$FAILED) {
                      if (input.substr(peg$currPos, 10) === peg$c65) {
                        s0 = peg$c65;
                        peg$currPos += 10;
                      } else {
                        s0 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c66); }
                      }
                      if (s0 === peg$FAILED) {
                        if (input.substr(peg$currPos, 9) === peg$c67) {
                          s0 = peg$c67;
                          peg$currPos += 9;
                        } else {
                          s0 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c68); }
                        }
                        if (s0 === peg$FAILED) {
                          if (input.substr(peg$currPos, 8) === peg$c69) {
                            s0 = peg$c69;
                            peg$currPos += 8;
                          } else {
                            s0 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c70); }
                          }
                          if (s0 === peg$FAILED) {
                            if (input.substr(peg$currPos, 9) === peg$c71) {
                              s0 = peg$c71;
                              peg$currPos += 9;
                            } else {
                              s0 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c72); }
                            }
                            if (s0 === peg$FAILED) {
                              if (input.substr(peg$currPos, 10) === peg$c73) {
                                s0 = peg$c73;
                                peg$currPos += 10;
                              } else {
                                s0 = peg$FAILED;
                                if (peg$silentFails === 0) { peg$fail(peg$c74); }
                              }
                              if (s0 === peg$FAILED) {
                                if (input.substr(peg$currPos, 10) === peg$c75) {
                                  s0 = peg$c75;
                                  peg$currPos += 10;
                                } else {
                                  s0 = peg$FAILED;
                                  if (peg$silentFails === 0) { peg$fail(peg$c76); }
                                }
                                if (s0 === peg$FAILED) {
                                  if (input.substr(peg$currPos, 9) === peg$c77) {
                                    s0 = peg$c77;
                                    peg$currPos += 9;
                                  } else {
                                    s0 = peg$FAILED;
                                    if (peg$silentFails === 0) { peg$fail(peg$c78); }
                                  }
                                  if (s0 === peg$FAILED) {
                                    if (input.substr(peg$currPos, 8) === peg$c79) {
                                      s0 = peg$c79;
                                      peg$currPos += 8;
                                    } else {
                                      s0 = peg$FAILED;
                                      if (peg$silentFails === 0) { peg$fail(peg$c80); }
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
        s2 = peg$parseexpr();
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
            s1 = peg$c81(s2);
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

    function peg$parsename() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c82.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c83); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c82.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c83); }
          }
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c84(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecss() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c85.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c86); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c85.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c86); }
          }
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c87(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseexpr() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c88.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c89); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c88.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c89); }
          }
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c90(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsesep() {
      var s0, s1;

      s0 = [];
      if (peg$c91.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c92); }
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        if (peg$c91.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c92); }
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

  return {
    SyntaxError: SyntaxError,
    parse:       parse
  };
})();
},{}],88:[function(require,module,exports){
var expr = require('vega-expression'),
    args = ['datum', 'event', 'signals'];

module.exports = expr.compiler(args, {
  idWhiteList: args,
  fieldVar:    args[0],
  globalVar:   args[2],
  functions:   function(codegen) {
    var fn = expr.functions(codegen);
    fn.eventItem = function() { return 'event.vg.item'; };
    fn.eventGroup = 'event.vg.getGroup';
    fn.eventX = 'event.vg.getX';
    fn.eventY = 'event.vg.getY';
    return fn;
  }
});
},{"vega-expression":39}],89:[function(require,module,exports){
module.exports = {
  axes: require('./axes'),
  background: require('./background'),
  data: require('./data'),
  events: require('./events'),
  expr: require('./expr'),
  legends: require('./legends'),
  mark: require('./mark'),
  marks: require('./marks'),
  modify: require('./modify'),
  padding: require('./padding'),
  predicates: require('./predicates'),
  properties: require('./properties'),
  signals: require('./signals'),
  spec: require('./spec'),
  streams: require('./streams'),
  transforms: require('./transforms')
};
},{"./axes":84,"./background":85,"./data":86,"./events":87,"./expr":88,"./legends":90,"./mark":91,"./marks":92,"./modify":93,"./padding":94,"./predicates":95,"./properties":96,"./signals":97,"./spec":98,"./streams":99,"./transforms":100}],90:[function(require,module,exports){
var lgnd = require('../scene/legend');

function parseLegends(model, spec, legends, group) {
  (spec || []).forEach(function(def, index) {
    legends[index] = legends[index] || lgnd(model);
    parseLegend(def, index, legends[index], group);
  });
}

function parseLegend(def, index, legend, group) {
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

module.exports = parseLegends;
},{"../scene/legend":108}],91:[function(require,module,exports){
var util = require('datalib/src/util'),
    parseProperties = require('./properties');

function parseMark(model, mark) {
  var props = mark.properties,
      group = mark.marks;

  // parse mark property definitions
  util.keys(props).forEach(function(k) {
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
}

module.exports = parseMark;
},{"./properties":96,"datalib/src/util":20}],92:[function(require,module,exports){
var parseMark = require('./mark');

function parseRootMark(model, spec, width, height) {
  return {
    type: "group",
    width: width,
    height: height,
    scales: spec.scales || [],
    axes: spec.axes || [],
    legends: spec.legends || [],
    marks: (spec.marks || []).map(function(m) { return parseMark(model, m); })
  };
}

module.exports = parseRootMark;
},{"./mark":91}],93:[function(require,module,exports){
var util = require('datalib/src/util'),
    Node = require('vega-dataflow/src/Node'), // jshint ignore:line
    Tuple = require('vega-dataflow/src/Tuple'),
    Deps = require('vega-dataflow/src/Dependencies'),
    log = require('vega-logging');

var Types = {
  INSERT: "insert",
  REMOVE: "remove",
  TOGGLE: "toggle",
  CLEAR:  "clear"
};

var filter = function(field, value, src, dest) {
  for(var i = src.length-1; i >= 0; --i) {
    if (src[i][field] == value)
      dest.push.apply(dest, src.splice(i, 1));
  }
};

function parseModify(model, def, ds) {
  var signal = def.signal ? util.field(def.signal) : null, 
      signalName = signal ? signal[0] : null,
      predicate = def.predicate ? model.predicate(def.predicate.name || def.predicate) : null,
      reeval = (predicate === null),
      node = new Node(model).router(def.type === Types.CLEAR);

  node.evaluate = function(input) {
    if (predicate !== null) {  // TODO: predicate args
      var db = model.dataValues(predicate.data||[]);
      reeval = predicate.call(predicate, {}, db, model.signalValues(predicate.signals||[]), model._predicates);
    }

    log.debug(input, [def.type+"ing", reeval]);
    if (!reeval) return input;

    var datum = {}, 
        value = signal ? model.signalRef(def.signal) : null,
        d = model.data(ds.name),
        prev = d.revises() ? null : undefined,
        t = null;

    datum[def.field] = value;

    // We have to modify ds._data so that subsequent pulses contain
    // our dynamic data. W/o modifying ds._data, only the output
    // collector will contain dynamic tuples. 
    if (def.type === Types.INSERT) {
      t = Tuple.ingest(datum, prev);
      input.add.push(t);
      d._data.push(t);
    } else if (def.type === Types.REMOVE) {
      filter(def.field, value, input.add, input.rem);
      filter(def.field, value, input.mod, input.rem);
      d._data = d._data.filter(function(x) { return x[def.field] !== value; });
    } else if (def.type === Types.TOGGLE) {
      var add = [], rem = [];
      filter(def.field, value, input.rem, add);
      filter(def.field, value, input.add, rem);
      filter(def.field, value, input.mod, rem);
      if (!(add.length || rem.length)) add.push(Tuple.ingest(datum));

      input.add.push.apply(input.add, add);
      d._data.push.apply(d._data, add);
      input.rem.push.apply(input.rem, rem);
      d._data = d._data.filter(function(x) { return rem.indexOf(x) === -1; });
    } else if (def.type === Types.CLEAR) {
      input.rem.push.apply(input.rem, input.add);
      input.rem.push.apply(input.rem, input.mod);
      input.add = [];
      input.mod = [];
      d._data  = [];
    } 

    input.fields[def.field] = 1;
    return input;
  };

  if (signalName) node.dependency(Deps.SIGNALS, signalName);
  if (predicate)  node.dependency(Deps.SIGNALS, predicate.signals);
  
  return node;
}

module.exports = parseModify;
},{"datalib/src/util":20,"vega-dataflow/src/Dependencies":29,"vega-dataflow/src/Node":31,"vega-dataflow/src/Tuple":34,"vega-logging":41}],94:[function(require,module,exports){
var util = require('datalib/src/util');

function parsePadding(pad) {
  if (pad == null) return "auto";
  else if (util.isString(pad)) return pad==="strict" ? "strict" : "auto";
  else if (util.isObject(pad)) return pad;
  var p = util.isNumber(pad) ? pad : 20;
  return {top:p, left:p, right:p, bottom:p};
}

module.exports = parsePadding;
},{"datalib/src/util":20}],95:[function(require,module,exports){
var util = require('datalib/src/util');

var types = {
  '=':   parseComparator,
  '==':  parseComparator,
  '!=':  parseComparator,
  '>':   parseComparator,
  '>=':  parseComparator,
  '<':   parseComparator,
  '<=':  parseComparator,
  'and': parseLogical,
  '&&':  parseLogical,
  'or':  parseLogical,
  '||':  parseLogical,
  'in':  parseIn
};

var nullScale = function() { return 0; };
nullScale.invert = nullScale;

function parsePredicates(model, spec) {
  (spec || []).forEach(function(s) {
    var parse = types[s.type](model, s);
    
    /* jshint evil:true */
    var pred  = Function("args", "db", "signals", "predicates", parse.code);
    pred.root = function() { return model.scene().items[0]; }; // For global scales
    pred.nullScale = nullScale;
    pred.isFunction = util.isFunction;
    pred.signals = parse.signals;
    pred.data = parse.data;

    model.predicate(s.name, pred);
  });

  return spec;
}

function parseSignal(signal, signals) {
  var s = util.field(signal),
      code = "signals["+s.map(util.str).join("][")+"]";
  signals[s[0]] = 1;
  return code;
}

function parseOperands(model, operands) {
  var decl = [], defs = [],
      signals = {}, db = {};

  function setSignal(s) { signals[s] = 1; }
  function setData(d) { db[d] = 1; }

  util.array(operands).forEach(function(o, i) {
    var name = "o" + i,
        def = "";

    if (o.value !== undefined) {
      def = util.str(o.value);
    } else if (o.arg) {
      def = "args["+util.str(o.arg)+"]";
    } else if (o.signal) {
      def = parseSignal(o.signal, signals);
    } else if (o.predicate) {
      var ref = o.predicate,
          predName = ref && (ref.name || ref),
          pred = model.predicate(predName),
          p = "predicates["+util.str(predName)+"]";

      pred.signals.forEach(setSignal);
      pred.data.forEach(setData);

      if (util.isObject(ref)) {
        util.keys(ref).forEach(function(k) {
          if (k === "name") return;
          var i = ref[k];
          def += "args["+util.str(k)+"] = ";
          if (i.signal) {
            def += parseSignal(i.signal, signals);
          } else if (i.arg) {
            def += "args["+util.str(i.arg)+"]";
          }
          def += ", ";
        });  
      } 

      def += p+".call("+p+", args, db, signals, predicates)";
    }

    decl.push(name);
    defs.push(name+"=("+def+")");
  });

  return {
    code: "var " + decl.join(", ") + ";\n" + defs.join(";\n") + ";\n",
    signals: util.keys(signals),
    data: util.keys(db)
  };
}

function parseComparator(model, spec) {
  var ops = parseOperands(model, spec.operands);
  if (spec.type === '=') spec.type = '==';

  ops.code += "o0 = o0 instanceof Date ? o0.getTime() : o0;\n" +
    "o1 = o1 instanceof Date ? o1.getTime() : o1;\n";

  return {
    code: ops.code + "return " + ["o0", "o1"].join(spec.type) + ";",
    signals: ops.signals,
    data: ops.data
  };
}

function parseLogical(model, spec) {
  var ops = parseOperands(model, spec.operands),
      o = [], i = 0, len = spec.operands.length;

  while (o.push("o"+i++) < len);
  if (spec.type === 'and') spec.type = '&&';
  else if (spec.type === 'or') spec.type = '||';

  return {
    code: ops.code + "return " + o.join(spec.type) + ";",
    signals: ops.signals,
    data: ops.data
  };
}

function parseIn(model, spec) {
  var o = [spec.item], code = "";
  if (spec.range) o.push.apply(o, spec.range);
  if (spec.scale) {
    code = parseScale(spec.scale, o);
  }

  var ops = parseOperands(model, o);
  code = ops.code + code + "\n  var ordSet = null;\n";

  if (spec.data) {
    var field = util.field(spec.field).map(util.str);
    code += "var where = function(d) { return d["+field.join("][")+"] == o0 };\n";
    code += "return db["+util.str(spec.data)+"].filter(where).length > 0;";
  } else if (spec.range) {
    // TODO: inclusive/exclusive range?
    if (spec.scale) {
      code += "if (scale.length == 2) {\n" + // inverting ordinal scales
        "  ordSet = scale(o1, o2);\n" +
        "} else {\n" +
        "  o1 = scale(o1);\no2 = scale(o2);\n" +
        "}";
    }

    code += "return ordSet !== null ? ordSet.indexOf(o0) !== -1 :\n" + 
      "  o1 < o2 ? o1 <= o0 && o0 <= o2 : o2 <= o0 && o0 <= o1;";
  }

  return {
    code: code, 
    signals: ops.signals, 
    data: ops.data.concat(spec.data ? [spec.data] : [])
  };
}

// Populate ops such that ultimate scale/inversion function will be in `scale` var. 
function parseScale(spec, ops) {
  var code = "var scale = ", 
      idx  = ops.length;

  if (util.isString(spec)) {
    ops.push({ value: spec });
    code += "this.root().scale(o"+idx+")";
  } else if (spec.arg) {  // Scale function is being passed as an arg
    ops.push(spec);
    code += "o"+idx;
  } else if (spec.name) { // Full scale parameter {name: ..}
    ops.push(util.isString(spec.name) ? {value: spec.name} : spec.name);
    code += "(this.isFunction(o"+idx+") ? o"+idx+" : ";
    if (spec.scope) {
      ops.push(spec.scope);
      code += "((o"+(idx+1)+".scale || this.root().scale)(o"+idx+") || this.nullScale)";
    } else {
      code += "this.root().scale(o"+idx+")";
    }
    code += ")";
  }

  if (spec.invert === true) {  // Allow spec.invert.arg?
    code += ".invert";
  }

  return code+";\n";
}

module.exports = parsePredicates;
},{"datalib/src/util":20}],96:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    template = require('datalib/src/template'),
    util = require('datalib/src/util'),
    Tuple = require('vega-dataflow/src/Tuple'),
    log = require('vega-logging');

var DEPS = ["signals", "scales", "data", "fields"];

function properties(model, mark, spec) {
  var config = model.config(),
      code = "",
      names = util.keys(spec),
      i, len, name, ref, vars = {}, 
      deps = {
        signals: {},
        scales:  {},
        data:    {},
        fields:  {},
        reflow:  false
      };
      
  code += "var o = trans ? {} : item,\n" +
          "    dirty = false;\n" +
          // Stash for util.template
          "  signals.datum  = item.datum;\n" + 
          "  signals.group  = group;\n" + 
          "  signals.parent = group.datum;\n";

  function handleDep(p) {
    if (ref[p] == null) return;
    var k = util.array(ref[p]), i, n;
    for (i=0, n=k.length; i<n; ++i) {
      deps[p][k[i]] = 1;
    }
  }

  for (i=0, len=names.length; i<len; ++i) {
    ref = spec[name = names[i]];
    code += (i > 0) ? "\n  " : "  ";
    if (ref.rule) {
      ref = rule(model, name, ref.rule);
      code += "\n  " + ref.code;
    } else {
      ref = valueRef(config, name, ref);
      code += "dirty = this.tpl.set(o, "+util.str(name)+", "+ref.val+") || dirty;";
    }

    vars[name] = true;
    DEPS.forEach(handleDep);
    deps.reflow = deps.reflow || ref.reflow;
  }

  if (vars.x2) {
    if (vars.x) {
      code += "\n  if (o.x > o.x2) { " +
              "\n    var t = o.x;" +
              "\n    dirty = this.tpl.set(o, 'x', o.x2) || dirty;" +
              "\n    dirty = this.tpl.set(o, 'x2', t) || dirty; " +
              "\n  };";
      code += "\n  dirty = this.tpl.set(o, 'width', (o.x2 - o.x)) || dirty;";
    } else if (vars.width) {
      code += "\n  dirty = this.tpl.set(o, 'x', (o.x2 - o.width)) || dirty;";
    } else {
      code += "\n  dirty = this.tpl.set(o, 'x', o.x2) || dirty;";
    }
  }

  if (vars.xc) {
    if (vars.width) {
      code += "\n  dirty = this.tpl.set(o, 'x', (o.xc - o.width/2)) || dirty;" ;
    } else {
      code += "\n  dirty = this.tpl.set(o, 'x', o.xc) || dirty;" ;
    }
  }

  if (vars.y2) {
    if (vars.y) {
      code += "\n  if (o.y > o.y2) { " +
              "\n    var t = o.y;" +
              "\n    dirty = this.tpl.set(o, 'y', o.y2) || dirty;" +
              "\n    dirty = this.tpl.set(o, 'y2', t) || dirty;" +
              "\n  };";
      code += "\n  dirty = this.tpl.set(o, 'height', (o.y2 - o.y)) || dirty;";
    } else if (vars.height) {
      code += "\n  dirty = this.tpl.set(o, 'y', (o.y2 - o.height)) || dirty;";
    } else {
      code += "\n  dirty = this.tpl.set(o, 'y', o.y2) || dirty;";
    }
  }

  if (vars.yc) {
    if (vars.height) {
      code += "\n  dirty = this.tpl.set(o, 'y', (o.yc - o.height/2)) || dirty;" ;
    } else {
      code += "\n  dirty = this.tpl.set(o, 'y', o.yc) || dirty;" ;
    }
  }
  
  if (hasPath(mark, vars)) code += "\n  dirty = (item.touch(), true);";
  code += "\n  if (trans) trans.interpolate(item, o);";
  code += "\n  return dirty;";

  try {
    /* jshint evil:true */
    var encoder = Function("item", "group", "trans", "db", 
      "signals", "predicates", code);
    encoder.tpl  = Tuple;
    encoder.util = util;
    encoder.d3   = d3; // For color spaces
    util.extend(encoder, template.context);
    return {
      encode:  encoder,
      signals: util.keys(deps.signals),
      scales:  util.keys(deps.scales),
      data:    util.keys(deps.data),
      fields:  util.keys(deps.fields),
      reflow:  deps.reflow
    };
  } catch (e) {
    log.error(e);
    log.log(code);
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
  var config  = model.config(),
      signals = [], scales = [], db = [],
      inputs  = [], code = "";

  (rules||[]).forEach(function(r, i) {
    var def = r.predicate,
        predName = def && (def.name || def),
        pred = model.predicate(predName),
        p = "predicates["+util.str(predName)+"]",
        input = [], args = name+"_arg"+i,
        ref;

    if (util.isObject(def)) {
      util.keys(def).forEach(function(k) {
        if (k === "name") return;
        var ref = valueRef(config, i, def[k]);
        input.push(util.str(k)+": "+ref.val);
        if (ref.signals) signals.push.apply(signals, util.array(ref.signals));
        if (ref.scales)  scales.push.apply(scales, util.array(ref.scales));
      });
    }

    ref = valueRef(config, name, r);
    if (ref.signals) signals.push.apply(signals, util.array(ref.signals));
    if (ref.scales)  scales.push.apply(scales, util.array(ref.scales));

    if (predName) {
      signals.push.apply(signals, pred.signals);
      db.push.apply(db, pred.data);
      inputs.push(args+" = {\n    "+input.join(",\n    ")+"\n  }");
      code += "if ("+p+".call("+p+","+args+", db, signals, predicates)) {" +
        "\n    dirty = this.tpl.set(o, "+util.str(name)+", "+ref.val+") || dirty;";
      code += rules[i+1] ? "\n  } else " : "  }";
    } else {
      code += "{" + 
        "\n    dirty = this.tpl.set(o, "+util.str(name)+", "+ref.val+") || dirty;"+
        "\n  }\n";
    }
  });

  code = "var " + inputs.join(",\n      ") + ";\n  " + code;
  return {code: code, signals: signals, scales: scales, data: db};
}

function valueRef(config, name, ref) {
  if (ref == null) return null;

  if (name==="fill" || name==="stroke") {
    if (ref.c) {
      return colorRef(config, "hcl", ref.h, ref.c, ref.l);
    } else if (ref.h || ref.s) {
      return colorRef(config, "hsl", ref.h, ref.s, ref.l);
    } else if (ref.l || ref.a) {
      return colorRef(config, "lab", ref.l, ref.a, ref.b);
    } else if (ref.r || ref.g || ref.b) {
      return colorRef(config, "rgb", ref.r, ref.g, ref.b);
    }
  }

  // initialize value
  var val = null, scale = null, 
      sgRef = {}, fRef = {}, sRef = {}, tmpl = {},
      signals = [], fields = [], reflow = false;

  if (ref.template !== undefined) {
    val = template.source(ref.template, "signals", tmpl);
    util.keys(tmpl).forEach(function(k) {
      var f = util.field(k)[0];
      if (f === 'parent' || f === 'group') {
        reflow = true;
        fRef[f] = 1;
      } else if (k === 'datum') {
        fRef[f] = 1;
      } else {
        sgRef[f] = 1;
      }
    });
  }

  if (ref.value !== undefined) {
    val = util.str(ref.value);
  }

  if (ref.signal !== undefined) {
    sgRef = util.field(ref.signal);
    val = "signals["+sgRef.map(util.str).join("][")+"]"; 
    signals.push(sgRef.shift());
  }

  if (ref.field !== undefined) {
    ref.field = util.isString(ref.field) ? {datum: ref.field} : ref.field;
    fRef  = fieldRef(ref.field);
    val = fRef.val;
  }

  if (ref.scale !== undefined) {
    sRef = scaleRef(ref.scale);
    scale = sRef.val;

    // run through scale function if val specified.
    // if no val, scale function is predicate arg.
    if (val !== null || ref.band || ref.mult || ref.offset) {
      val = scale + (ref.band ? ".rangeBand()" : 
        "("+(val !== null ? val : "item.datum.data")+")");
    } else {
      val = scale;
    }
  }
  
  // multiply, offset, return value
  val = "(" + (ref.mult?(util.number(ref.mult)+" * "):"") + val + ")" +
        (ref.offset ? " + " + util.number(ref.offset) : "");

  // Collate dependencies
  return {
    val: val,
    signals: signals.concat(util.array(fRef.signals)).concat(util.array(sRef.signals)),
    fields:  fields.concat(util.array(fRef.fields)).concat(util.array(sRef.fields)),
    scales:  ref.scale ? (ref.scale.name || ref.scale) : null, // TODO: connect sRef'd scale?
    reflow:  reflow || fRef.reflow || sRef.reflow
  };
}

function colorRef(config, type, x, y, z) {
  var xx = x ? valueRef(config, "", x) : config.color[type][0],
      yy = y ? valueRef(config, "", y) : config.color[type][1],
      zz = z ? valueRef(config, "", z) : config.color[type][2],
      signals = [], scales = [];

  [xx, yy, zz].forEach(function(v) {
    if (v.signals) signals.push.apply(signals, v.signals);
    if (v.scales)  scales.push(v.scales);
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
  if (util.isString(ref)) {
    return {val: util.field(ref).map(util.str).join("][")};
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

  if (ref.datum) {
    val = "item.datum["+val+"]";
    fields.push(ref.datum);
  } else if (ref.group) {
    val = scope+"group["+val+"]";
    reflow = true;
  } else if (ref.parent) {
    val = scope+"group.datum["+val+"]";
    reflow = true;
  } else if (ref.signal) {
    val = "signals["+val+"]";
    signals.push(util.field(ref.signal)[0]);
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

  if (util.isString(ref)) {
    scale = util.str(ref);
  } else if (ref.name) {
    scale = util.isString(ref.name) ? util.str(ref.name) : (fr = fieldRef(ref.name)).val;
  } else {
    scale = (fr = fieldRef(ref)).val;
  }

  scale = "group.scale("+scale+")";
  if (ref.invert) scale += ".invert";

  return fr ? (fr.val = scale, fr) : {val: scale};
}

module.exports = properties;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9wYXJzZS9wcm9wZXJ0aWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgICB0ZW1wbGF0ZSA9IHJlcXVpcmUoJ2RhdGFsaWIvc3JjL3RlbXBsYXRlJyksXG4gICAgdXRpbCA9IHJlcXVpcmUoJ2RhdGFsaWIvc3JjL3V0aWwnKSxcbiAgICBUdXBsZSA9IHJlcXVpcmUoJ3ZlZ2EtZGF0YWZsb3cvc3JjL1R1cGxlJyksXG4gICAgbG9nID0gcmVxdWlyZSgndmVnYS1sb2dnaW5nJyk7XG5cbnZhciBERVBTID0gW1wic2lnbmFsc1wiLCBcInNjYWxlc1wiLCBcImRhdGFcIiwgXCJmaWVsZHNcIl07XG5cbmZ1bmN0aW9uIHByb3BlcnRpZXMobW9kZWwsIG1hcmssIHNwZWMpIHtcbiAgdmFyIGNvbmZpZyA9IG1vZGVsLmNvbmZpZygpLFxuICAgICAgY29kZSA9IFwiXCIsXG4gICAgICBuYW1lcyA9IHV0aWwua2V5cyhzcGVjKSxcbiAgICAgIGksIGxlbiwgbmFtZSwgcmVmLCB2YXJzID0ge30sIFxuICAgICAgZGVwcyA9IHtcbiAgICAgICAgc2lnbmFsczoge30sXG4gICAgICAgIHNjYWxlczogIHt9LFxuICAgICAgICBkYXRhOiAgICB7fSxcbiAgICAgICAgZmllbGRzOiAge30sXG4gICAgICAgIHJlZmxvdzogIGZhbHNlXG4gICAgICB9O1xuICAgICAgXG4gIGNvZGUgKz0gXCJ2YXIgbyA9IHRyYW5zID8ge30gOiBpdGVtLFxcblwiICtcbiAgICAgICAgICBcIiAgICBkaXJ0eSA9IGZhbHNlO1xcblwiICtcbiAgICAgICAgICAvLyBTdGFzaCBmb3IgdXRpbC50ZW1wbGF0ZVxuICAgICAgICAgIFwiICBzaWduYWxzLmRhdHVtICA9IGl0ZW0uZGF0dW07XFxuXCIgKyBcbiAgICAgICAgICBcIiAgc2lnbmFscy5ncm91cCAgPSBncm91cDtcXG5cIiArIFxuICAgICAgICAgIFwiICBzaWduYWxzLnBhcmVudCA9IGdyb3VwLmRhdHVtO1xcblwiO1xuXG4gIGZ1bmN0aW9uIGhhbmRsZURlcChwKSB7XG4gICAgaWYgKHJlZltwXSA9PSBudWxsKSByZXR1cm47XG4gICAgdmFyIGsgPSB1dGlsLmFycmF5KHJlZltwXSksIGksIG47XG4gICAgZm9yIChpPTAsIG49ay5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgICBkZXBzW3BdW2tbaV1dID0gMTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGk9MCwgbGVuPW5hbWVzLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgIHJlZiA9IHNwZWNbbmFtZSA9IG5hbWVzW2ldXTtcbiAgICBjb2RlICs9IChpID4gMCkgPyBcIlxcbiAgXCIgOiBcIiAgXCI7XG4gICAgaWYgKHJlZi5ydWxlKSB7XG4gICAgICByZWYgPSBydWxlKG1vZGVsLCBuYW1lLCByZWYucnVsZSk7XG4gICAgICBjb2RlICs9IFwiXFxuICBcIiArIHJlZi5jb2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWYgPSB2YWx1ZVJlZihjb25maWcsIG5hbWUsIHJlZik7XG4gICAgICBjb2RlICs9IFwiZGlydHkgPSB0aGlzLnRwbC5zZXQobywgXCIrdXRpbC5zdHIobmFtZSkrXCIsIFwiK3JlZi52YWwrXCIpIHx8IGRpcnR5O1wiO1xuICAgIH1cblxuICAgIHZhcnNbbmFtZV0gPSB0cnVlO1xuICAgIERFUFMuZm9yRWFjaChoYW5kbGVEZXApO1xuICAgIGRlcHMucmVmbG93ID0gZGVwcy5yZWZsb3cgfHwgcmVmLnJlZmxvdztcbiAgfVxuXG4gIGlmICh2YXJzLngyKSB7XG4gICAgaWYgKHZhcnMueCkge1xuICAgICAgY29kZSArPSBcIlxcbiAgaWYgKG8ueCA+IG8ueDIpIHsgXCIgK1xuICAgICAgICAgICAgICBcIlxcbiAgICB2YXIgdCA9IG8ueDtcIiArXG4gICAgICAgICAgICAgIFwiXFxuICAgIGRpcnR5ID0gdGhpcy50cGwuc2V0KG8sICd4Jywgby54MikgfHwgZGlydHk7XCIgK1xuICAgICAgICAgICAgICBcIlxcbiAgICBkaXJ0eSA9IHRoaXMudHBsLnNldChvLCAneDInLCB0KSB8fCBkaXJ0eTsgXCIgK1xuICAgICAgICAgICAgICBcIlxcbiAgfTtcIjtcbiAgICAgIGNvZGUgKz0gXCJcXG4gIGRpcnR5ID0gdGhpcy50cGwuc2V0KG8sICd3aWR0aCcsIChvLngyIC0gby54KSkgfHwgZGlydHk7XCI7XG4gICAgfSBlbHNlIGlmICh2YXJzLndpZHRoKSB7XG4gICAgICBjb2RlICs9IFwiXFxuICBkaXJ0eSA9IHRoaXMudHBsLnNldChvLCAneCcsIChvLngyIC0gby53aWR0aCkpIHx8IGRpcnR5O1wiO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2RlICs9IFwiXFxuICBkaXJ0eSA9IHRoaXMudHBsLnNldChvLCAneCcsIG8ueDIpIHx8IGRpcnR5O1wiO1xuICAgIH1cbiAgfVxuXG4gIGlmICh2YXJzLnhjKSB7XG4gICAgaWYgKHZhcnMud2lkdGgpIHtcbiAgICAgIGNvZGUgKz0gXCJcXG4gIGRpcnR5ID0gdGhpcy50cGwuc2V0KG8sICd4JywgKG8ueGMgLSBvLndpZHRoLzIpKSB8fCBkaXJ0eTtcIiA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUgKz0gXCJcXG4gIGRpcnR5ID0gdGhpcy50cGwuc2V0KG8sICd4Jywgby54YykgfHwgZGlydHk7XCIgO1xuICAgIH1cbiAgfVxuXG4gIGlmICh2YXJzLnkyKSB7XG4gICAgaWYgKHZhcnMueSkge1xuICAgICAgY29kZSArPSBcIlxcbiAgaWYgKG8ueSA+IG8ueTIpIHsgXCIgK1xuICAgICAgICAgICAgICBcIlxcbiAgICB2YXIgdCA9IG8ueTtcIiArXG4gICAgICAgICAgICAgIFwiXFxuICAgIGRpcnR5ID0gdGhpcy50cGwuc2V0KG8sICd5Jywgby55MikgfHwgZGlydHk7XCIgK1xuICAgICAgICAgICAgICBcIlxcbiAgICBkaXJ0eSA9IHRoaXMudHBsLnNldChvLCAneTInLCB0KSB8fCBkaXJ0eTtcIiArXG4gICAgICAgICAgICAgIFwiXFxuICB9O1wiO1xuICAgICAgY29kZSArPSBcIlxcbiAgZGlydHkgPSB0aGlzLnRwbC5zZXQobywgJ2hlaWdodCcsIChvLnkyIC0gby55KSkgfHwgZGlydHk7XCI7XG4gICAgfSBlbHNlIGlmICh2YXJzLmhlaWdodCkge1xuICAgICAgY29kZSArPSBcIlxcbiAgZGlydHkgPSB0aGlzLnRwbC5zZXQobywgJ3knLCAoby55MiAtIG8uaGVpZ2h0KSkgfHwgZGlydHk7XCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUgKz0gXCJcXG4gIGRpcnR5ID0gdGhpcy50cGwuc2V0KG8sICd5Jywgby55MikgfHwgZGlydHk7XCI7XG4gICAgfVxuICB9XG5cbiAgaWYgKHZhcnMueWMpIHtcbiAgICBpZiAodmFycy5oZWlnaHQpIHtcbiAgICAgIGNvZGUgKz0gXCJcXG4gIGRpcnR5ID0gdGhpcy50cGwuc2V0KG8sICd5JywgKG8ueWMgLSBvLmhlaWdodC8yKSkgfHwgZGlydHk7XCIgO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2RlICs9IFwiXFxuICBkaXJ0eSA9IHRoaXMudHBsLnNldChvLCAneScsIG8ueWMpIHx8IGRpcnR5O1wiIDtcbiAgICB9XG4gIH1cbiAgXG4gIGlmIChoYXNQYXRoKG1hcmssIHZhcnMpKSBjb2RlICs9IFwiXFxuICBkaXJ0eSA9IChpdGVtLnRvdWNoKCksIHRydWUpO1wiO1xuICBjb2RlICs9IFwiXFxuICBpZiAodHJhbnMpIHRyYW5zLmludGVycG9sYXRlKGl0ZW0sIG8pO1wiO1xuICBjb2RlICs9IFwiXFxuICByZXR1cm4gZGlydHk7XCI7XG5cbiAgdHJ5IHtcbiAgICAvKiBqc2hpbnQgZXZpbDp0cnVlICovXG4gICAgdmFyIGVuY29kZXIgPSBGdW5jdGlvbihcIml0ZW1cIiwgXCJncm91cFwiLCBcInRyYW5zXCIsIFwiZGJcIiwgXG4gICAgICBcInNpZ25hbHNcIiwgXCJwcmVkaWNhdGVzXCIsIGNvZGUpO1xuICAgIGVuY29kZXIudHBsICA9IFR1cGxlO1xuICAgIGVuY29kZXIudXRpbCA9IHV0aWw7XG4gICAgZW5jb2Rlci5kMyAgID0gZDM7IC8vIEZvciBjb2xvciBzcGFjZXNcbiAgICB1dGlsLmV4dGVuZChlbmNvZGVyLCB0ZW1wbGF0ZS5jb250ZXh0KTtcbiAgICByZXR1cm4ge1xuICAgICAgZW5jb2RlOiAgZW5jb2RlcixcbiAgICAgIHNpZ25hbHM6IHV0aWwua2V5cyhkZXBzLnNpZ25hbHMpLFxuICAgICAgc2NhbGVzOiAgdXRpbC5rZXlzKGRlcHMuc2NhbGVzKSxcbiAgICAgIGRhdGE6ICAgIHV0aWwua2V5cyhkZXBzLmRhdGEpLFxuICAgICAgZmllbGRzOiAgdXRpbC5rZXlzKGRlcHMuZmllbGRzKSxcbiAgICAgIHJlZmxvdzogIGRlcHMucmVmbG93XG4gICAgfTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZy5lcnJvcihlKTtcbiAgICBsb2cubG9nKGNvZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhc1BhdGgobWFyaywgdmFycykge1xuICByZXR1cm4gdmFycy5wYXRoIHx8XG4gICAgKChtYXJrPT09XCJhcmVhXCIgfHwgbWFyaz09PVwibGluZVwiKSAmJlxuICAgICAgKHZhcnMueCB8fCB2YXJzLngyIHx8IHZhcnMud2lkdGggfHxcbiAgICAgICB2YXJzLnkgfHwgdmFycy55MiB8fCB2YXJzLmhlaWdodCB8fFxuICAgICAgIHZhcnMudGVuc2lvbiB8fCB2YXJzLmludGVycG9sYXRlKSk7XG59XG5cbmZ1bmN0aW9uIHJ1bGUobW9kZWwsIG5hbWUsIHJ1bGVzKSB7XG4gIHZhciBjb25maWcgID0gbW9kZWwuY29uZmlnKCksXG4gICAgICBzaWduYWxzID0gW10sIHNjYWxlcyA9IFtdLCBkYiA9IFtdLFxuICAgICAgaW5wdXRzICA9IFtdLCBjb2RlID0gXCJcIjtcblxuICAocnVsZXN8fFtdKS5mb3JFYWNoKGZ1bmN0aW9uKHIsIGkpIHtcbiAgICB2YXIgZGVmID0gci5wcmVkaWNhdGUsXG4gICAgICAgIHByZWROYW1lID0gZGVmICYmIChkZWYubmFtZSB8fCBkZWYpLFxuICAgICAgICBwcmVkID0gbW9kZWwucHJlZGljYXRlKHByZWROYW1lKSxcbiAgICAgICAgcCA9IFwicHJlZGljYXRlc1tcIit1dGlsLnN0cihwcmVkTmFtZSkrXCJdXCIsXG4gICAgICAgIGlucHV0ID0gW10sIGFyZ3MgPSBuYW1lK1wiX2FyZ1wiK2ksXG4gICAgICAgIHJlZjtcblxuICAgIGlmICh1dGlsLmlzT2JqZWN0KGRlZikpIHtcbiAgICAgIHV0aWwua2V5cyhkZWYpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgICBpZiAoayA9PT0gXCJuYW1lXCIpIHJldHVybjtcbiAgICAgICAgdmFyIHJlZiA9IHZhbHVlUmVmKGNvbmZpZywgaSwgZGVmW2tdKTtcbiAgICAgICAgaW5wdXQucHVzaCh1dGlsLnN0cihrKStcIjogXCIrcmVmLnZhbCk7XG4gICAgICAgIGlmIChyZWYuc2lnbmFscykgc2lnbmFscy5wdXNoLmFwcGx5KHNpZ25hbHMsIHV0aWwuYXJyYXkocmVmLnNpZ25hbHMpKTtcbiAgICAgICAgaWYgKHJlZi5zY2FsZXMpICBzY2FsZXMucHVzaC5hcHBseShzY2FsZXMsIHV0aWwuYXJyYXkocmVmLnNjYWxlcykpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVmID0gdmFsdWVSZWYoY29uZmlnLCBuYW1lLCByKTtcbiAgICBpZiAocmVmLnNpZ25hbHMpIHNpZ25hbHMucHVzaC5hcHBseShzaWduYWxzLCB1dGlsLmFycmF5KHJlZi5zaWduYWxzKSk7XG4gICAgaWYgKHJlZi5zY2FsZXMpICBzY2FsZXMucHVzaC5hcHBseShzY2FsZXMsIHV0aWwuYXJyYXkocmVmLnNjYWxlcykpO1xuXG4gICAgaWYgKHByZWROYW1lKSB7XG4gICAgICBzaWduYWxzLnB1c2guYXBwbHkoc2lnbmFscywgcHJlZC5zaWduYWxzKTtcbiAgICAgIGRiLnB1c2guYXBwbHkoZGIsIHByZWQuZGF0YSk7XG4gICAgICBpbnB1dHMucHVzaChhcmdzK1wiID0ge1xcbiAgICBcIitpbnB1dC5qb2luKFwiLFxcbiAgICBcIikrXCJcXG4gIH1cIik7XG4gICAgICBjb2RlICs9IFwiaWYgKFwiK3ArXCIuY2FsbChcIitwK1wiLFwiK2FyZ3MrXCIsIGRiLCBzaWduYWxzLCBwcmVkaWNhdGVzKSkge1wiICtcbiAgICAgICAgXCJcXG4gICAgZGlydHkgPSB0aGlzLnRwbC5zZXQobywgXCIrdXRpbC5zdHIobmFtZSkrXCIsIFwiK3JlZi52YWwrXCIpIHx8IGRpcnR5O1wiO1xuICAgICAgY29kZSArPSBydWxlc1tpKzFdID8gXCJcXG4gIH0gZWxzZSBcIiA6IFwiICB9XCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUgKz0gXCJ7XCIgKyBcbiAgICAgICAgXCJcXG4gICAgZGlydHkgPSB0aGlzLnRwbC5zZXQobywgXCIrdXRpbC5zdHIobmFtZSkrXCIsIFwiK3JlZi52YWwrXCIpIHx8IGRpcnR5O1wiK1xuICAgICAgICBcIlxcbiAgfVxcblwiO1xuICAgIH1cbiAgfSk7XG5cbiAgY29kZSA9IFwidmFyIFwiICsgaW5wdXRzLmpvaW4oXCIsXFxuICAgICAgXCIpICsgXCI7XFxuICBcIiArIGNvZGU7XG4gIHJldHVybiB7Y29kZTogY29kZSwgc2lnbmFsczogc2lnbmFscywgc2NhbGVzOiBzY2FsZXMsIGRhdGE6IGRifTtcbn1cblxuZnVuY3Rpb24gdmFsdWVSZWYoY29uZmlnLCBuYW1lLCByZWYpIHtcbiAgaWYgKHJlZiA9PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICBpZiAobmFtZT09PVwiZmlsbFwiIHx8IG5hbWU9PT1cInN0cm9rZVwiKSB7XG4gICAgaWYgKHJlZi5jKSB7XG4gICAgICByZXR1cm4gY29sb3JSZWYoY29uZmlnLCBcImhjbFwiLCByZWYuaCwgcmVmLmMsIHJlZi5sKTtcbiAgICB9IGVsc2UgaWYgKHJlZi5oIHx8IHJlZi5zKSB7XG4gICAgICByZXR1cm4gY29sb3JSZWYoY29uZmlnLCBcImhzbFwiLCByZWYuaCwgcmVmLnMsIHJlZi5sKTtcbiAgICB9IGVsc2UgaWYgKHJlZi5sIHx8IHJlZi5hKSB7XG4gICAgICByZXR1cm4gY29sb3JSZWYoY29uZmlnLCBcImxhYlwiLCByZWYubCwgcmVmLmEsIHJlZi5iKTtcbiAgICB9IGVsc2UgaWYgKHJlZi5yIHx8IHJlZi5nIHx8IHJlZi5iKSB7XG4gICAgICByZXR1cm4gY29sb3JSZWYoY29uZmlnLCBcInJnYlwiLCByZWYuciwgcmVmLmcsIHJlZi5iKTtcbiAgICB9XG4gIH1cblxuICAvLyBpbml0aWFsaXplIHZhbHVlXG4gIHZhciB2YWwgPSBudWxsLCBzY2FsZSA9IG51bGwsIFxuICAgICAgc2dSZWYgPSB7fSwgZlJlZiA9IHt9LCBzUmVmID0ge30sIHRtcGwgPSB7fSxcbiAgICAgIHNpZ25hbHMgPSBbXSwgZmllbGRzID0gW10sIHJlZmxvdyA9IGZhbHNlO1xuXG4gIGlmIChyZWYudGVtcGxhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgIHZhbCA9IHRlbXBsYXRlLnNvdXJjZShyZWYudGVtcGxhdGUsIFwic2lnbmFsc1wiLCB0bXBsKTtcbiAgICB1dGlsLmtleXModG1wbCkuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICB2YXIgZiA9IHV0aWwuZmllbGQoaylbMF07XG4gICAgICBpZiAoZiA9PT0gJ3BhcmVudCcgfHwgZiA9PT0gJ2dyb3VwJykge1xuICAgICAgICByZWZsb3cgPSB0cnVlO1xuICAgICAgICBmUmVmW2ZdID0gMTtcbiAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ2RhdHVtJykge1xuICAgICAgICBmUmVmW2ZdID0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNnUmVmW2ZdID0gMTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGlmIChyZWYudmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgIHZhbCA9IHV0aWwuc3RyKHJlZi52YWx1ZSk7XG4gIH1cblxuICBpZiAocmVmLnNpZ25hbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgc2dSZWYgPSB1dGlsLmZpZWxkKHJlZi5zaWduYWwpO1xuICAgIHZhbCA9IFwic2lnbmFsc1tcIitzZ1JlZi5tYXAodXRpbC5zdHIpLmpvaW4oXCJdW1wiKStcIl1cIjsgXG4gICAgc2lnbmFscy5wdXNoKHNnUmVmLnNoaWZ0KCkpO1xuICB9XG5cbiAgaWYgKHJlZi5maWVsZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmVmLmZpZWxkID0gdXRpbC5pc1N0cmluZyhyZWYuZmllbGQpID8ge2RhdHVtOiByZWYuZmllbGR9IDogcmVmLmZpZWxkO1xuICAgIGZSZWYgID0gZmllbGRSZWYocmVmLmZpZWxkKTtcbiAgICB2YWwgPSBmUmVmLnZhbDtcbiAgfVxuXG4gIGlmIChyZWYuc2NhbGUgIT09IHVuZGVmaW5lZCkge1xuICAgIHNSZWYgPSBzY2FsZVJlZihyZWYuc2NhbGUpO1xuICAgIHNjYWxlID0gc1JlZi52YWw7XG5cbiAgICAvLyBydW4gdGhyb3VnaCBzY2FsZSBmdW5jdGlvbiBpZiB2YWwgc3BlY2lmaWVkLlxuICAgIC8vIGlmIG5vIHZhbCwgc2NhbGUgZnVuY3Rpb24gaXMgcHJlZGljYXRlIGFyZy5cbiAgICBpZiAodmFsICE9PSBudWxsIHx8IHJlZi5iYW5kIHx8IHJlZi5tdWx0IHx8IHJlZi5vZmZzZXQpIHtcbiAgICAgIHZhbCA9IHNjYWxlICsgKHJlZi5iYW5kID8gXCIucmFuZ2VCYW5kKClcIiA6IFxuICAgICAgICBcIihcIisodmFsICE9PSBudWxsID8gdmFsIDogXCJpdGVtLmRhdHVtLmRhdGFcIikrXCIpXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWwgPSBzY2FsZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIG11bHRpcGx5LCBvZmZzZXQsIHJldHVybiB2YWx1ZVxuICB2YWwgPSBcIihcIiArIChyZWYubXVsdD8odXRpbC5udW1iZXIocmVmLm11bHQpK1wiICogXCIpOlwiXCIpICsgdmFsICsgXCIpXCIgK1xuICAgICAgICAocmVmLm9mZnNldCA/IFwiICsgXCIgKyB1dGlsLm51bWJlcihyZWYub2Zmc2V0KSA6IFwiXCIpO1xuXG4gIC8vIENvbGxhdGUgZGVwZW5kZW5jaWVzXG4gIHJldHVybiB7XG4gICAgdmFsOiB2YWwsXG4gICAgc2lnbmFsczogc2lnbmFscy5jb25jYXQodXRpbC5hcnJheShmUmVmLnNpZ25hbHMpKS5jb25jYXQodXRpbC5hcnJheShzUmVmLnNpZ25hbHMpKSxcbiAgICBmaWVsZHM6ICBmaWVsZHMuY29uY2F0KHV0aWwuYXJyYXkoZlJlZi5maWVsZHMpKS5jb25jYXQodXRpbC5hcnJheShzUmVmLmZpZWxkcykpLFxuICAgIHNjYWxlczogIHJlZi5zY2FsZSA/IChyZWYuc2NhbGUubmFtZSB8fCByZWYuc2NhbGUpIDogbnVsbCwgLy8gVE9ETzogY29ubmVjdCBzUmVmJ2Qgc2NhbGU/XG4gICAgcmVmbG93OiAgcmVmbG93IHx8IGZSZWYucmVmbG93IHx8IHNSZWYucmVmbG93XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbG9yUmVmKGNvbmZpZywgdHlwZSwgeCwgeSwgeikge1xuICB2YXIgeHggPSB4ID8gdmFsdWVSZWYoY29uZmlnLCBcIlwiLCB4KSA6IGNvbmZpZy5jb2xvclt0eXBlXVswXSxcbiAgICAgIHl5ID0geSA/IHZhbHVlUmVmKGNvbmZpZywgXCJcIiwgeSkgOiBjb25maWcuY29sb3JbdHlwZV1bMV0sXG4gICAgICB6eiA9IHogPyB2YWx1ZVJlZihjb25maWcsIFwiXCIsIHopIDogY29uZmlnLmNvbG9yW3R5cGVdWzJdLFxuICAgICAgc2lnbmFscyA9IFtdLCBzY2FsZXMgPSBbXTtcblxuICBbeHgsIHl5LCB6el0uZm9yRWFjaChmdW5jdGlvbih2KSB7XG4gICAgaWYgKHYuc2lnbmFscykgc2lnbmFscy5wdXNoLmFwcGx5KHNpZ25hbHMsIHYuc2lnbmFscyk7XG4gICAgaWYgKHYuc2NhbGVzKSAgc2NhbGVzLnB1c2godi5zY2FsZXMpO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIHZhbDogXCIodGhpcy5kMy5cIiArIHR5cGUgKyBcIihcIiArIFt4eC52YWwsIHl5LnZhbCwgenoudmFsXS5qb2luKFwiLFwiKSArICcpICsgXCJcIiknLFxuICAgIHNpZ25hbHM6IHNpZ25hbHMsXG4gICAgc2NhbGVzOiBzY2FsZXNcbiAgfTtcbn1cblxuLy8ge2ZpZWxkOiB7ZGF0dW06IFwiZm9vXCJ9IH0gIC0+IGl0ZW0uZGF0dW0uZm9vXG4vLyB7ZmllbGQ6IHtncm91cDogXCJmb29cIn0gfSAgLT4gZ3JvdXAuZm9vXG4vLyB7ZmllbGQ6IHtwYXJlbnQ6IFwiZm9vXCJ9IH0gLT4gZ3JvdXAuZGF0dW0uZm9vXG5mdW5jdGlvbiBmaWVsZFJlZihyZWYpIHtcbiAgaWYgKHV0aWwuaXNTdHJpbmcocmVmKSkge1xuICAgIHJldHVybiB7dmFsOiB1dGlsLmZpZWxkKHJlZikubWFwKHV0aWwuc3RyKS5qb2luKFwiXVtcIil9O1xuICB9IFxuXG4gIC8vIFJlc29sdmUgbmVzdGluZy9wYXJlbnQgbG9va3Vwc1xuICB2YXIgbCA9IHJlZi5sZXZlbCxcbiAgICAgIG5lc3RlZCA9IChyZWYuZ3JvdXAgfHwgcmVmLnBhcmVudCkgJiYgbCxcbiAgICAgIHNjb3BlID0gbmVzdGVkID8gQXJyYXkobCkuam9pbihcImdyb3VwLm1hcmsuXCIpIDogXCJcIixcbiAgICAgIHIgPSBmaWVsZFJlZihyZWYuZGF0dW0gfHwgcmVmLmdyb3VwIHx8IHJlZi5wYXJlbnQgfHwgcmVmLnNpZ25hbCksXG4gICAgICB2YWwgPSByLnZhbCxcbiAgICAgIGZpZWxkcyAgPSByLmZpZWxkcyAgfHwgW10sXG4gICAgICBzaWduYWxzID0gci5zaWduYWxzIHx8IFtdLFxuICAgICAgcmVmbG93ICA9IHIucmVmbG93ICB8fCBmYWxzZTsgLy8gTmVzdGVkIGZpZWxkcmVmcyB0cmlnZ2VyIGZ1bGwgcmVldmFsIG9mIEVuY29kZXIuXG5cbiAgaWYgKHJlZi5kYXR1bSkge1xuICAgIHZhbCA9IFwiaXRlbS5kYXR1bVtcIit2YWwrXCJdXCI7XG4gICAgZmllbGRzLnB1c2gocmVmLmRhdHVtKTtcbiAgfSBlbHNlIGlmIChyZWYuZ3JvdXApIHtcbiAgICB2YWwgPSBzY29wZStcImdyb3VwW1wiK3ZhbCtcIl1cIjtcbiAgICByZWZsb3cgPSB0cnVlO1xuICB9IGVsc2UgaWYgKHJlZi5wYXJlbnQpIHtcbiAgICB2YWwgPSBzY29wZStcImdyb3VwLmRhdHVtW1wiK3ZhbCtcIl1cIjtcbiAgICByZWZsb3cgPSB0cnVlO1xuICB9IGVsc2UgaWYgKHJlZi5zaWduYWwpIHtcbiAgICB2YWwgPSBcInNpZ25hbHNbXCIrdmFsK1wiXVwiO1xuICAgIHNpZ25hbHMucHVzaCh1dGlsLmZpZWxkKHJlZi5zaWduYWwpWzBdKTtcbiAgICByZWZsb3cgPSB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIHt2YWw6IHZhbCwgZmllbGRzOiBmaWVsZHMsIHNpZ25hbHM6IHNpZ25hbHMsIHJlZmxvdzogcmVmbG93fTtcbn1cblxuLy8ge3NjYWxlOiBcInhcIn1cbi8vIHtzY2FsZToge25hbWU6IFwieFwifX0sXG4vLyB7c2NhbGU6IGZpZWxkUmVmfVxuZnVuY3Rpb24gc2NhbGVSZWYocmVmKSB7XG4gIHZhciBzY2FsZSA9IG51bGwsXG4gICAgICBmciA9IG51bGw7XG5cbiAgaWYgKHV0aWwuaXNTdHJpbmcocmVmKSkge1xuICAgIHNjYWxlID0gdXRpbC5zdHIocmVmKTtcbiAgfSBlbHNlIGlmIChyZWYubmFtZSkge1xuICAgIHNjYWxlID0gdXRpbC5pc1N0cmluZyhyZWYubmFtZSkgPyB1dGlsLnN0cihyZWYubmFtZSkgOiAoZnIgPSBmaWVsZFJlZihyZWYubmFtZSkpLnZhbDtcbiAgfSBlbHNlIHtcbiAgICBzY2FsZSA9IChmciA9IGZpZWxkUmVmKHJlZikpLnZhbDtcbiAgfVxuXG4gIHNjYWxlID0gXCJncm91cC5zY2FsZShcIitzY2FsZStcIilcIjtcbiAgaWYgKHJlZi5pbnZlcnQpIHNjYWxlICs9IFwiLmludmVydFwiO1xuXG4gIHJldHVybiBmciA/IChmci52YWwgPSBzY2FsZSwgZnIpIDoge3ZhbDogc2NhbGV9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHByb3BlcnRpZXM7Il19
},{"datalib/src/template":18,"datalib/src/util":20,"vega-dataflow/src/Tuple":34,"vega-logging":41}],97:[function(require,module,exports){
var util = require('datalib/src/util'),
    functions = require('vega-expression/src/functions')(),
    Deps = require('vega-dataflow/src/Dependencies'),
    expr = require('./expr');

var RESERVED = ['datum', 'event', 'signals'].concat(util.keys(functions));

function parseSignals(model, spec) {
  // process each signal definition
  (spec || []).forEach(function(s) {
    if (RESERVED.indexOf(s.name) !== -1) {
      throw Error('Signal name "'+s.name+'" is a '+
        'reserved keyword ('+RESERVED.join(', ')+').');
    }

    var signal = model.signal(s.name, s.init)
      .verbose(s.verbose);

    if (s.init && s.init.expr) {
      s.init.expr = expr(s.init.expr);
      signal.value(exprVal(model, s.init));
    }

    if (s.expr) {
      s.expr = expr(s.expr);
      signal.evaluate = function(input) {
        var val = exprVal(model, s);
        if (val !== signal.value() || signal.verbose()) {
          signal.value(val);
          input.signals[s.name] = 1;
          return input;
        }
        return model.doNotPropagate;        
      };
      signal.dependency(Deps.SIGNALS, s.expr.globals);
      s.expr.globals.forEach(function(dep) {
        model.signal(dep).addListener(signal);
      });
    }
  });

  return spec;
}

function exprVal(model, spec) {
  var e = spec.expr,
      val = e.fn(null, null, model.signalValues(e.globals));
  return spec.scale ? parseSignals.scale(model, spec, val) : val;
}

parseSignals.scale = function scale(model, spec, value, datum, evt) {
  var def = spec.scale,
      name  = def.name || def.signal || def,
      scope = def.scope, e;

  if (scope) {
    if (scope.signal) {
      scope = model.signalRef(scope.signal);
    } else if (util.isString(scope)) { // Scope is an expression
      e = def._expr = (def._expr || expr(scope));
      scope = e.fn(datum, evt, model.signalValues(e.globals));
    }
  }

  if (!scope || !scope.scale) {
    scope = (scope && scope.mark) ? scope.mark.group : model.scene().items[0];
  }

  var s = scope.scale(name);
  return !s ? value : (def.invert ? s.invert(value) : s(value));
};

module.exports = parseSignals;
},{"./expr":88,"datalib/src/util":20,"vega-dataflow/src/Dependencies":29,"vega-expression/src/functions":38}],98:[function(require,module,exports){
var load = require('datalib/src/import/load'),
    util = require('datalib/src/util'),
    log = require('vega-logging'),
    Model = require('../core/Model'), 
    View = require('../core/View'), 
    parseBg = require('../parse/background'),
    parsePadding = require('../parse/padding'),
    parseMarks = require('../parse/marks'),
    parseSignals = require('../parse/signals'),
    parsePredicates = require('../parse/predicates'),
    parseData = require('../parse/data');

function parseSpec(spec, callback) {
  var vf = arguments[arguments.length-1],
      viewFactory = arguments.length > 2 && util.isFunction(vf) ? vf : View.factory,
      config = arguments[2] !== viewFactory ? arguments[2] : {},
      model = new Model(config);

  function parse(spec) {
    // protect against subsequent spec modification
    spec = util.duplicate(spec);

    var width = spec.width || 500,
        height = spec.height || 500,
        viewport = spec.viewport || null;

    model.defs({
      width: width,
      height: height,
      viewport: viewport,
      background: parseBg(spec.background),
      padding: parsePadding(spec.padding),
      signals: parseSignals(model, spec.signals),
      predicates: parsePredicates(model, spec.predicates),
      marks: parseMarks(model, spec, width, height),
      data:  parseData(model, spec.data, function() { callback(viewFactory(model)); })
    });    
  }

  if (util.isObject(spec)) {
    parse(spec);
  } else if (util.isString(spec)) {
    var opts = util.extend({url: spec}, model.config().load);
    load(opts, function(err, data) {
      if (err) {
        log.error('LOADING SPECIFICATION FAILED: ' + err.statusText);
      } else {
        try { 
          parse(JSON.parse(data)); 
        } catch (e) { 
          log.error('INVALID SPECIFICATION: Must be a valid JSON object. '+e); 
        }
      }
    });
  } else {
    log.error('INVALID SPECIFICATION: Must be a valid JSON object or URL.');
  }
}

module.exports = parseSpec;
},{"../core/Model":80,"../core/View":81,"../parse/background":85,"../parse/data":86,"../parse/marks":92,"../parse/padding":94,"../parse/predicates":95,"../parse/signals":97,"datalib/src/import/load":13,"datalib/src/util":20,"vega-logging":41}],99:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    util = require('datalib/src/util'),
    changeset = require('vega-dataflow/src/ChangeSet'),
    Node = require('vega-dataflow/src/Node'), // jshint ignore:line
    Deps = require('vega-dataflow/src/Dependencies'),
    parseSignals = require('./signals'),
    selector = require('./events'),
    expr = require('./expr');

var GATEKEEPER = '_vgGATEKEEPER';

var vgEvent = {
  getGroup: function(name) { return name ? this.name[name] : this.group; },
  getXY: function(item) {
      var p = {x: this.x, y: this.y};
      if (typeof item === 'string') {
        item = this.name[item];
      }
      for (; item; item = item.mark && item.mark.group) {
        p.x -= item.x || 0;
        p.y -= item.y || 0;
      }
      return p;
    },
  getX: function(item) { return this.getXY(item).x; },
  getY: function(item) { return this.getXY(item).y; }
};

function parseStreams(view) {
  var model = view.model(),
      spec  = model.defs().signals,
      registry = {handlers: {}, nodes: {}},
      internal = util.duplicate(registry),  // Internal event processing
      external = util.duplicate(registry);  // External event processing

  (spec || []).forEach(function(sig) {
    var signal = model.signal(sig.name);
    if (sig.expr) return;  // Cannot have an expr and stream definition.

    (sig.streams || []).forEach(function(stream) {
      var sel = selector.parse(stream.type),
          exp = expr(stream.expr);
      mergedStream(signal, sel, exp, stream);
    });
  });

  // We register the event listeners all together so that if multiple
  // signals are registered on the same event, they will receive the
  // new value on the same pulse. 
  util.keys(internal.handlers).forEach(function(type) {
    view.on(type, function(evt, item) {
      evt.preventDefault(); // stop text selection
      extendEvent(evt, item);
      fire(internal, type, (item && item.datum) || {}, evt);
    });
  });

  // add external event listeners
  util.keys(external.handlers).forEach(function(type) {
    if (typeof window === 'undefined') return; // No external support

    var h = external.handlers[type],
        t = type.split(':'), // --> no element pseudo-selectors
        elt = (t[0] === 'window') ? [window] :
              window.document.querySelectorAll(t[0]);

    function handler(evt) {
      extendEvent(evt);
      fire(external, type, d3.select(this).datum(), evt);
    }

    for (var i=0; i<elt.length; ++i) {
      elt[i].addEventListener(t[1], handler);
    }

    h.elements = elt;
    h.listener = handler;
  });

  // remove external event listeners
  external.detach = function() {
    util.keys(external.handlers).forEach(function(type) {
      var h = external.handlers[type],
          t = type.split(':'),
          elt = h.elements || [];

      for (var i=0; i<elt.length; ++i) {
        elt[i].removeEventListener(t[1], h.listener);
      }
    });
  };

  // export detach method
  return external.detach;

  // -- helper functions -----

  function extendEvent(evt, item) {
    var mouse = d3.mouse((d3.event=evt, view._el)),
        pad = view.padding(),
        names = {}, mark, group, i;

    if (item) {
      mark = item.mark;
      group = mark.marktype === 'group' ? item : mark.group;
      for (i=item; i!=null; i=i.mark.group) {
        if (i.mark.def.name) {
          names[i.mark.def.name] = i;
        }
      }
    }
    names.root = view.model().scene().items[0];

    evt.vg = Object.create(vgEvent);
    evt.vg.group = group;
    evt.vg.item = item || {};
    evt.vg.name = names;
    evt.vg.x = mouse[0] - pad.left;
    evt.vg.y = mouse[1] - pad.top;
  }

  function fire(registry, type, datum, evt) {
    var handlers = registry.handlers[type],
        node = registry.nodes[type],
        cs = changeset.create(null, true),
        filtered = false,
        val, i, n, h;

    function invoke(f) {
      return !f.fn(datum, evt, model.signalValues(f.globals));
    }

    for (i=0, n=handlers.length; i<n; ++i) {
      h = handlers[i];
      filtered = h.filters.some(invoke);
      if (filtered) continue;
      
      val = h.exp.fn(datum, evt, model.signalValues(h.exp.globals));
      if (h.spec.scale) {
        val = parseSignals.scale(model, h.spec, val, datum, evt);
      }

      if (val !== h.signal.value() || h.signal.verbose()) {
        h.signal.value(val);
        cs.signals[h.signal.name()] = 1;
      }
    }

    model.propagate(cs, node);
  }

  function mergedStream(sig, selector, exp, spec) {
    selector.forEach(function(s) {
      if (s.event)       domEvent(sig, s, exp, spec);
      else if (s.signal) signal(sig, s, exp, spec);
      else if (s.start)  orderedStream(sig, s, exp, spec);
      else if (s.stream) mergedStream(sig, s.stream, exp, spec);
    });
  }

  function domEvent(sig, selector, exp, spec) {
    var evt = selector.event,
        name = selector.name,
        mark = selector.mark,
        target   = selector.target,
        filters  = selector.filters || [],
        registry = target ? external : internal,
        type = target ? target+':'+evt : evt,
        node = registry.nodes[type] || (registry.nodes[type] = new Node(model)),
        handlers = registry.handlers[type] || (registry.handlers[type] = []);

    if (name) {
      filters.push('!!event.vg.name["' + name + '"]'); // Mimic event bubbling
    } else if (mark) {
      filters.push('event.vg.item.mark && event.vg.item.mark.marktype==='+util.str(mark));
    }

    handlers.push({
      signal: sig,
      exp: exp,
      spec: spec,
      filters: filters.map(function(f) { return expr(f); })
    });

    node.addListener(sig);
  }

  function signal(sig, selector, exp, spec) {
    var n = new Node(model);
    n.evaluate = function(input) {
      if (!input.signals[selector.signal]) return model.doNotPropagate;
      var val = exp.fn(null, null, model.signalValues(exp.globals));
      if (spec.scale) {
        val = parseSignals.scale(model, spec, val);
      }

      if (val !== sig.value() || sig.verbose()) {
        sig.value(val);
        input.signals[sig.name()] = 1;
        input.reflow = true;        
      }

      return input;  
    };
    n.dependency(Deps.SIGNALS, selector.signal);
    n.addListener(sig);
    model.signal(selector.signal).addListener(n);
  }

  function orderedStream(sig, selector, exp, spec) {
    var name = sig.name(), 
        trueFn  = expr('true'), 
        falseFn = expr('false'),
        middle  = selector.middle,
        filters = middle.filters || (middle.filters = []),
        gatekeeper = model.signal(name + GATEKEEPER, false);

    // Register an anonymous signal to act as a gatekeeper. Its value is
    // true or false depending on whether the start or end streams occur. 
    // The middle signal then simply filters for the gatekeeper's value. 
    mergedStream(gatekeeper, [selector.start], trueFn, {});
    mergedStream(gatekeeper, [selector.end], falseFn, {});

    filters.push(gatekeeper.name());
    mergedStream(sig, [selector.middle], exp, spec);
  }
}

module.exports = parseStreams;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9wYXJzZS9zdHJlYW1zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgdXRpbCA9IHJlcXVpcmUoJ2RhdGFsaWIvc3JjL3V0aWwnKSxcbiAgICBjaGFuZ2VzZXQgPSByZXF1aXJlKCd2ZWdhLWRhdGFmbG93L3NyYy9DaGFuZ2VTZXQnKSxcbiAgICBOb2RlID0gcmVxdWlyZSgndmVnYS1kYXRhZmxvdy9zcmMvTm9kZScpLCAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICBEZXBzID0gcmVxdWlyZSgndmVnYS1kYXRhZmxvdy9zcmMvRGVwZW5kZW5jaWVzJyksXG4gICAgcGFyc2VTaWduYWxzID0gcmVxdWlyZSgnLi9zaWduYWxzJyksXG4gICAgc2VsZWN0b3IgPSByZXF1aXJlKCcuL2V2ZW50cycpLFxuICAgIGV4cHIgPSByZXF1aXJlKCcuL2V4cHInKTtcblxudmFyIEdBVEVLRUVQRVIgPSAnX3ZnR0FURUtFRVBFUic7XG5cbnZhciB2Z0V2ZW50ID0ge1xuICBnZXRHcm91cDogZnVuY3Rpb24obmFtZSkgeyByZXR1cm4gbmFtZSA/IHRoaXMubmFtZVtuYW1lXSA6IHRoaXMuZ3JvdXA7IH0sXG4gIGdldFhZOiBmdW5jdGlvbihpdGVtKSB7XG4gICAgICB2YXIgcCA9IHt4OiB0aGlzLngsIHk6IHRoaXMueX07XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGl0ZW0gPSB0aGlzLm5hbWVbaXRlbV07XG4gICAgICB9XG4gICAgICBmb3IgKDsgaXRlbTsgaXRlbSA9IGl0ZW0ubWFyayAmJiBpdGVtLm1hcmsuZ3JvdXApIHtcbiAgICAgICAgcC54IC09IGl0ZW0ueCB8fCAwO1xuICAgICAgICBwLnkgLT0gaXRlbS55IHx8IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gcDtcbiAgICB9LFxuICBnZXRYOiBmdW5jdGlvbihpdGVtKSB7IHJldHVybiB0aGlzLmdldFhZKGl0ZW0pLng7IH0sXG4gIGdldFk6IGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIHRoaXMuZ2V0WFkoaXRlbSkueTsgfVxufTtcblxuZnVuY3Rpb24gcGFyc2VTdHJlYW1zKHZpZXcpIHtcbiAgdmFyIG1vZGVsID0gdmlldy5tb2RlbCgpLFxuICAgICAgc3BlYyAgPSBtb2RlbC5kZWZzKCkuc2lnbmFscyxcbiAgICAgIHJlZ2lzdHJ5ID0ge2hhbmRsZXJzOiB7fSwgbm9kZXM6IHt9fSxcbiAgICAgIGludGVybmFsID0gdXRpbC5kdXBsaWNhdGUocmVnaXN0cnkpLCAgLy8gSW50ZXJuYWwgZXZlbnQgcHJvY2Vzc2luZ1xuICAgICAgZXh0ZXJuYWwgPSB1dGlsLmR1cGxpY2F0ZShyZWdpc3RyeSk7ICAvLyBFeHRlcm5hbCBldmVudCBwcm9jZXNzaW5nXG5cbiAgKHNwZWMgfHwgW10pLmZvckVhY2goZnVuY3Rpb24oc2lnKSB7XG4gICAgdmFyIHNpZ25hbCA9IG1vZGVsLnNpZ25hbChzaWcubmFtZSk7XG4gICAgaWYgKHNpZy5leHByKSByZXR1cm47ICAvLyBDYW5ub3QgaGF2ZSBhbiBleHByIGFuZCBzdHJlYW0gZGVmaW5pdGlvbi5cblxuICAgIChzaWcuc3RyZWFtcyB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbihzdHJlYW0pIHtcbiAgICAgIHZhciBzZWwgPSBzZWxlY3Rvci5wYXJzZShzdHJlYW0udHlwZSksXG4gICAgICAgICAgZXhwID0gZXhwcihzdHJlYW0uZXhwcik7XG4gICAgICBtZXJnZWRTdHJlYW0oc2lnbmFsLCBzZWwsIGV4cCwgc3RyZWFtKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gV2UgcmVnaXN0ZXIgdGhlIGV2ZW50IGxpc3RlbmVycyBhbGwgdG9nZXRoZXIgc28gdGhhdCBpZiBtdWx0aXBsZVxuICAvLyBzaWduYWxzIGFyZSByZWdpc3RlcmVkIG9uIHRoZSBzYW1lIGV2ZW50LCB0aGV5IHdpbGwgcmVjZWl2ZSB0aGVcbiAgLy8gbmV3IHZhbHVlIG9uIHRoZSBzYW1lIHB1bHNlLiBcbiAgdXRpbC5rZXlzKGludGVybmFsLmhhbmRsZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKHR5cGUpIHtcbiAgICB2aWV3Lm9uKHR5cGUsIGZ1bmN0aW9uKGV2dCwgaXRlbSkge1xuICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7IC8vIHN0b3AgdGV4dCBzZWxlY3Rpb25cbiAgICAgIGV4dGVuZEV2ZW50KGV2dCwgaXRlbSk7XG4gICAgICBmaXJlKGludGVybmFsLCB0eXBlLCAoaXRlbSAmJiBpdGVtLmRhdHVtKSB8fCB7fSwgZXZ0KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gYWRkIGV4dGVybmFsIGV2ZW50IGxpc3RlbmVyc1xuICB1dGlsLmtleXMoZXh0ZXJuYWwuaGFuZGxlcnMpLmZvckVhY2goZnVuY3Rpb24odHlwZSkge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykgcmV0dXJuOyAvLyBObyBleHRlcm5hbCBzdXBwb3J0XG5cbiAgICB2YXIgaCA9IGV4dGVybmFsLmhhbmRsZXJzW3R5cGVdLFxuICAgICAgICB0ID0gdHlwZS5zcGxpdCgnOicpLCAvLyAtLT4gbm8gZWxlbWVudCBwc2V1ZG8tc2VsZWN0b3JzXG4gICAgICAgIGVsdCA9ICh0WzBdID09PSAnd2luZG93JykgPyBbd2luZG93XSA6XG4gICAgICAgICAgICAgIHdpbmRvdy5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHRbMF0pO1xuXG4gICAgZnVuY3Rpb24gaGFuZGxlcihldnQpIHtcbiAgICAgIGV4dGVuZEV2ZW50KGV2dCk7XG4gICAgICBmaXJlKGV4dGVybmFsLCB0eXBlLCBkMy5zZWxlY3QodGhpcykuZGF0dW0oKSwgZXZ0KTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpPTA7IGk8ZWx0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBlbHRbaV0uYWRkRXZlbnRMaXN0ZW5lcih0WzFdLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICBoLmVsZW1lbnRzID0gZWx0O1xuICAgIGgubGlzdGVuZXIgPSBoYW5kbGVyO1xuICB9KTtcblxuICAvLyByZW1vdmUgZXh0ZXJuYWwgZXZlbnQgbGlzdGVuZXJzXG4gIGV4dGVybmFsLmRldGFjaCA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwua2V5cyhleHRlcm5hbC5oYW5kbGVycykuZm9yRWFjaChmdW5jdGlvbih0eXBlKSB7XG4gICAgICB2YXIgaCA9IGV4dGVybmFsLmhhbmRsZXJzW3R5cGVdLFxuICAgICAgICAgIHQgPSB0eXBlLnNwbGl0KCc6JyksXG4gICAgICAgICAgZWx0ID0gaC5lbGVtZW50cyB8fCBbXTtcblxuICAgICAgZm9yICh2YXIgaT0wOyBpPGVsdC5sZW5ndGg7ICsraSkge1xuICAgICAgICBlbHRbaV0ucmVtb3ZlRXZlbnRMaXN0ZW5lcih0WzFdLCBoLmxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvLyBleHBvcnQgZGV0YWNoIG1ldGhvZFxuICByZXR1cm4gZXh0ZXJuYWwuZGV0YWNoO1xuXG4gIC8vIC0tIGhlbHBlciBmdW5jdGlvbnMgLS0tLS1cblxuICBmdW5jdGlvbiBleHRlbmRFdmVudChldnQsIGl0ZW0pIHtcbiAgICB2YXIgbW91c2UgPSBkMy5tb3VzZSgoZDMuZXZlbnQ9ZXZ0LCB2aWV3Ll9lbCkpLFxuICAgICAgICBwYWQgPSB2aWV3LnBhZGRpbmcoKSxcbiAgICAgICAgbmFtZXMgPSB7fSwgbWFyaywgZ3JvdXAsIGk7XG5cbiAgICBpZiAoaXRlbSkge1xuICAgICAgbWFyayA9IGl0ZW0ubWFyaztcbiAgICAgIGdyb3VwID0gbWFyay5tYXJrdHlwZSA9PT0gJ2dyb3VwJyA/IGl0ZW0gOiBtYXJrLmdyb3VwO1xuICAgICAgZm9yIChpPWl0ZW07IGkhPW51bGw7IGk9aS5tYXJrLmdyb3VwKSB7XG4gICAgICAgIGlmIChpLm1hcmsuZGVmLm5hbWUpIHtcbiAgICAgICAgICBuYW1lc1tpLm1hcmsuZGVmLm5hbWVdID0gaTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBuYW1lcy5yb290ID0gdmlldy5tb2RlbCgpLnNjZW5lKCkuaXRlbXNbMF07XG5cbiAgICBldnQudmcgPSBPYmplY3QuY3JlYXRlKHZnRXZlbnQpO1xuICAgIGV2dC52Zy5ncm91cCA9IGdyb3VwO1xuICAgIGV2dC52Zy5pdGVtID0gaXRlbSB8fCB7fTtcbiAgICBldnQudmcubmFtZSA9IG5hbWVzO1xuICAgIGV2dC52Zy54ID0gbW91c2VbMF0gLSBwYWQubGVmdDtcbiAgICBldnQudmcueSA9IG1vdXNlWzFdIC0gcGFkLnRvcDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpcmUocmVnaXN0cnksIHR5cGUsIGRhdHVtLCBldnQpIHtcbiAgICB2YXIgaGFuZGxlcnMgPSByZWdpc3RyeS5oYW5kbGVyc1t0eXBlXSxcbiAgICAgICAgbm9kZSA9IHJlZ2lzdHJ5Lm5vZGVzW3R5cGVdLFxuICAgICAgICBjcyA9IGNoYW5nZXNldC5jcmVhdGUobnVsbCwgdHJ1ZSksXG4gICAgICAgIGZpbHRlcmVkID0gZmFsc2UsXG4gICAgICAgIHZhbCwgaSwgbiwgaDtcblxuICAgIGZ1bmN0aW9uIGludm9rZShmKSB7XG4gICAgICByZXR1cm4gIWYuZm4oZGF0dW0sIGV2dCwgbW9kZWwuc2lnbmFsVmFsdWVzKGYuZ2xvYmFscykpO1xuICAgIH1cblxuICAgIGZvciAoaT0wLCBuPWhhbmRsZXJzLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICAgIGggPSBoYW5kbGVyc1tpXTtcbiAgICAgIGZpbHRlcmVkID0gaC5maWx0ZXJzLnNvbWUoaW52b2tlKTtcbiAgICAgIGlmIChmaWx0ZXJlZCkgY29udGludWU7XG4gICAgICBcbiAgICAgIHZhbCA9IGguZXhwLmZuKGRhdHVtLCBldnQsIG1vZGVsLnNpZ25hbFZhbHVlcyhoLmV4cC5nbG9iYWxzKSk7XG4gICAgICBpZiAoaC5zcGVjLnNjYWxlKSB7XG4gICAgICAgIHZhbCA9IHBhcnNlU2lnbmFscy5zY2FsZShtb2RlbCwgaC5zcGVjLCB2YWwsIGRhdHVtLCBldnQpO1xuICAgICAgfVxuXG4gICAgICBpZiAodmFsICE9PSBoLnNpZ25hbC52YWx1ZSgpIHx8IGguc2lnbmFsLnZlcmJvc2UoKSkge1xuICAgICAgICBoLnNpZ25hbC52YWx1ZSh2YWwpO1xuICAgICAgICBjcy5zaWduYWxzW2guc2lnbmFsLm5hbWUoKV0gPSAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIG1vZGVsLnByb3BhZ2F0ZShjcywgbm9kZSk7XG4gIH1cblxuICBmdW5jdGlvbiBtZXJnZWRTdHJlYW0oc2lnLCBzZWxlY3RvciwgZXhwLCBzcGVjKSB7XG4gICAgc2VsZWN0b3IuZm9yRWFjaChmdW5jdGlvbihzKSB7XG4gICAgICBpZiAocy5ldmVudCkgICAgICAgZG9tRXZlbnQoc2lnLCBzLCBleHAsIHNwZWMpO1xuICAgICAgZWxzZSBpZiAocy5zaWduYWwpIHNpZ25hbChzaWcsIHMsIGV4cCwgc3BlYyk7XG4gICAgICBlbHNlIGlmIChzLnN0YXJ0KSAgb3JkZXJlZFN0cmVhbShzaWcsIHMsIGV4cCwgc3BlYyk7XG4gICAgICBlbHNlIGlmIChzLnN0cmVhbSkgbWVyZ2VkU3RyZWFtKHNpZywgcy5zdHJlYW0sIGV4cCwgc3BlYyk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBkb21FdmVudChzaWcsIHNlbGVjdG9yLCBleHAsIHNwZWMpIHtcbiAgICB2YXIgZXZ0ID0gc2VsZWN0b3IuZXZlbnQsXG4gICAgICAgIG5hbWUgPSBzZWxlY3Rvci5uYW1lLFxuICAgICAgICBtYXJrID0gc2VsZWN0b3IubWFyayxcbiAgICAgICAgdGFyZ2V0ICAgPSBzZWxlY3Rvci50YXJnZXQsXG4gICAgICAgIGZpbHRlcnMgID0gc2VsZWN0b3IuZmlsdGVycyB8fCBbXSxcbiAgICAgICAgcmVnaXN0cnkgPSB0YXJnZXQgPyBleHRlcm5hbCA6IGludGVybmFsLFxuICAgICAgICB0eXBlID0gdGFyZ2V0ID8gdGFyZ2V0Kyc6JytldnQgOiBldnQsXG4gICAgICAgIG5vZGUgPSByZWdpc3RyeS5ub2Rlc1t0eXBlXSB8fCAocmVnaXN0cnkubm9kZXNbdHlwZV0gPSBuZXcgTm9kZShtb2RlbCkpLFxuICAgICAgICBoYW5kbGVycyA9IHJlZ2lzdHJ5LmhhbmRsZXJzW3R5cGVdIHx8IChyZWdpc3RyeS5oYW5kbGVyc1t0eXBlXSA9IFtdKTtcblxuICAgIGlmIChuYW1lKSB7XG4gICAgICBmaWx0ZXJzLnB1c2goJyEhZXZlbnQudmcubmFtZVtcIicgKyBuYW1lICsgJ1wiXScpOyAvLyBNaW1pYyBldmVudCBidWJibGluZ1xuICAgIH0gZWxzZSBpZiAobWFyaykge1xuICAgICAgZmlsdGVycy5wdXNoKCdldmVudC52Zy5pdGVtLm1hcmsgJiYgZXZlbnQudmcuaXRlbS5tYXJrLm1hcmt0eXBlPT09Jyt1dGlsLnN0cihtYXJrKSk7XG4gICAgfVxuXG4gICAgaGFuZGxlcnMucHVzaCh7XG4gICAgICBzaWduYWw6IHNpZyxcbiAgICAgIGV4cDogZXhwLFxuICAgICAgc3BlYzogc3BlYyxcbiAgICAgIGZpbHRlcnM6IGZpbHRlcnMubWFwKGZ1bmN0aW9uKGYpIHsgcmV0dXJuIGV4cHIoZik7IH0pXG4gICAgfSk7XG5cbiAgICBub2RlLmFkZExpc3RlbmVyKHNpZyk7XG4gIH1cblxuICBmdW5jdGlvbiBzaWduYWwoc2lnLCBzZWxlY3RvciwgZXhwLCBzcGVjKSB7XG4gICAgdmFyIG4gPSBuZXcgTm9kZShtb2RlbCk7XG4gICAgbi5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICBpZiAoIWlucHV0LnNpZ25hbHNbc2VsZWN0b3Iuc2lnbmFsXSkgcmV0dXJuIG1vZGVsLmRvTm90UHJvcGFnYXRlO1xuICAgICAgdmFyIHZhbCA9IGV4cC5mbihudWxsLCBudWxsLCBtb2RlbC5zaWduYWxWYWx1ZXMoZXhwLmdsb2JhbHMpKTtcbiAgICAgIGlmIChzcGVjLnNjYWxlKSB7XG4gICAgICAgIHZhbCA9IHBhcnNlU2lnbmFscy5zY2FsZShtb2RlbCwgc3BlYywgdmFsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHZhbCAhPT0gc2lnLnZhbHVlKCkgfHwgc2lnLnZlcmJvc2UoKSkge1xuICAgICAgICBzaWcudmFsdWUodmFsKTtcbiAgICAgICAgaW5wdXQuc2lnbmFsc1tzaWcubmFtZSgpXSA9IDE7XG4gICAgICAgIGlucHV0LnJlZmxvdyA9IHRydWU7ICAgICAgICBcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGlucHV0OyAgXG4gICAgfTtcbiAgICBuLmRlcGVuZGVuY3koRGVwcy5TSUdOQUxTLCBzZWxlY3Rvci5zaWduYWwpO1xuICAgIG4uYWRkTGlzdGVuZXIoc2lnKTtcbiAgICBtb2RlbC5zaWduYWwoc2VsZWN0b3Iuc2lnbmFsKS5hZGRMaXN0ZW5lcihuKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9yZGVyZWRTdHJlYW0oc2lnLCBzZWxlY3RvciwgZXhwLCBzcGVjKSB7XG4gICAgdmFyIG5hbWUgPSBzaWcubmFtZSgpLCBcbiAgICAgICAgdHJ1ZUZuICA9IGV4cHIoJ3RydWUnKSwgXG4gICAgICAgIGZhbHNlRm4gPSBleHByKCdmYWxzZScpLFxuICAgICAgICBtaWRkbGUgID0gc2VsZWN0b3IubWlkZGxlLFxuICAgICAgICBmaWx0ZXJzID0gbWlkZGxlLmZpbHRlcnMgfHwgKG1pZGRsZS5maWx0ZXJzID0gW10pLFxuICAgICAgICBnYXRla2VlcGVyID0gbW9kZWwuc2lnbmFsKG5hbWUgKyBHQVRFS0VFUEVSLCBmYWxzZSk7XG5cbiAgICAvLyBSZWdpc3RlciBhbiBhbm9ueW1vdXMgc2lnbmFsIHRvIGFjdCBhcyBhIGdhdGVrZWVwZXIuIEl0cyB2YWx1ZSBpc1xuICAgIC8vIHRydWUgb3IgZmFsc2UgZGVwZW5kaW5nIG9uIHdoZXRoZXIgdGhlIHN0YXJ0IG9yIGVuZCBzdHJlYW1zIG9jY3VyLiBcbiAgICAvLyBUaGUgbWlkZGxlIHNpZ25hbCB0aGVuIHNpbXBseSBmaWx0ZXJzIGZvciB0aGUgZ2F0ZWtlZXBlcidzIHZhbHVlLiBcbiAgICBtZXJnZWRTdHJlYW0oZ2F0ZWtlZXBlciwgW3NlbGVjdG9yLnN0YXJ0XSwgdHJ1ZUZuLCB7fSk7XG4gICAgbWVyZ2VkU3RyZWFtKGdhdGVrZWVwZXIsIFtzZWxlY3Rvci5lbmRdLCBmYWxzZUZuLCB7fSk7XG5cbiAgICBmaWx0ZXJzLnB1c2goZ2F0ZWtlZXBlci5uYW1lKCkpO1xuICAgIG1lcmdlZFN0cmVhbShzaWcsIFtzZWxlY3Rvci5taWRkbGVdLCBleHAsIHNwZWMpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcGFyc2VTdHJlYW1zOyJdfQ==
},{"./events":87,"./expr":88,"./signals":97,"datalib/src/util":20,"vega-dataflow/src/ChangeSet":26,"vega-dataflow/src/Dependencies":29,"vega-dataflow/src/Node":31}],100:[function(require,module,exports){
var util = require('datalib/src/util'),
    transforms = require('../transforms/index');

function parseTransforms(model, def) {
  var tx = new transforms[def.type](model);
  
  // We want to rename output fields before setting any other properties,
  // as subsequent properties may require output to be set (e.g. group by).
  if(def.output) tx.output(def.output);

  util.keys(def).forEach(function(k) {
    if(k === 'type' || k === 'output') return;
    tx.param(k, def[k]);
  });

  return tx;
}

module.exports = parseTransforms;
},{"../transforms/index":130,"datalib/src/util":20}],101:[function(require,module,exports){
var util = require('datalib/src/util'),
    bound = require('vega-scenegraph/src/util/bound'),
    Node = require('vega-dataflow/src/Node'), // jshint ignore:line
    ChangeSet = require('vega-dataflow/src/ChangeSet'),
    log = require('vega-logging'),
    Encoder = require('./Encoder');

function Bounder(graph, mark) {
  this._mark = mark;
  return Node.prototype.init.call(this, graph)
    .router(true)
    .reflows(true);
}

var proto = (Bounder.prototype = new Node());

proto.evaluate = function(input) {
  log.debug(input, ["bounds", this._mark.marktype]);

  var type  = this._mark.marktype,
      isGrp = type === "group",
      items = this._mark.items,
      hasLegends = util.array(this._mark.def.legends).length > 0,
      i, ilen, j, jlen, group, legend;

  if (input.add.length || input.rem.length || !items.length || 
      input.mod.length === items.length ||
      type === "area" || type === "line") {
    bound.mark(this._mark, null, isGrp && !hasLegends);
  } else {
    input.mod.forEach(function(item) { bound.item(item); });
  }

  if (isGrp && hasLegends) {
    for (i=0, ilen=items.length; i<ilen; ++i) {
      group = items[i];
      group._legendPositions = null;
      for (j=0, jlen=group.legendItems.length; j<jlen; ++j) {
        legend = group.legendItems[j];
        Encoder.update(this._graph, input.trans, "vg_legendPosition", legend.items, input.dirty);
        bound.mark(legend, null, false);
      }
    }

    bound.mark(this._mark, null, true);
  }

  return ChangeSet.create(input, true);
};

module.exports = Bounder;
},{"./Encoder":103,"datalib/src/util":20,"vega-dataflow/src/ChangeSet":26,"vega-dataflow/src/Node":31,"vega-logging":41,"vega-scenegraph/src/util/bound":74}],102:[function(require,module,exports){
var util = require('datalib/src/util'),
    Item = require('vega-scenegraph/src/util/Item'),
    Tuple = require('vega-dataflow/src/Tuple'),
    ChangeSet = require('vega-dataflow/src/ChangeSet'),
    Node = require('vega-dataflow/src/Node'), // jshint ignore:line
    Deps = require('vega-dataflow/src/Dependencies'),
    Sentinel = require('vega-dataflow/src/Sentinel'),
    log = require('vega-logging'),
    Encoder  = require('./Encoder'),
    Bounder  = require('./Bounder'),
    parseData = require('../parse/data');

function Builder() {    
  return arguments.length ? this.init.apply(this, arguments) : this;
}

var Status = Builder.STATUS = {
  ENTER: "enter",
  UPDATE: "update",
  EXIT: "exit"
};

var proto = (Builder.prototype = new Node());

proto.init = function(graph, def, mark, parent, parent_id, inheritFrom) {
  Node.prototype.init.call(this, graph)
    .router(true)
    .collector(true);

  this._def   = def;
  this._mark  = mark;
  this._from  = (def.from ? def.from.data : null) || inheritFrom;
  this._ds    = util.isString(this._from) ? graph.data(this._from) : null;
  this._map   = {};

  this._revises = false;  // Should scenegraph items track _prev?

  mark.def = def;
  mark.marktype = def.type;
  mark.interactive = (def.interactive !== false);
  mark.items = [];
  if (util.isValid(def.name)) mark.name = def.name;

  this._parent = parent;
  this._parent_id = parent_id;

  if (def.from && (def.from.mark || def.from.transform || def.from.modify)) {
    inlineDs.call(this);
  }

  // Non-group mark builders are super nodes. Encoder and Bounder remain 
  // separate operators but are embedded and called by Builder.evaluate.
  this._isSuper = (this._def.type !== "group"); 
  this._encoder = new Encoder(this._graph, this._mark);
  this._bounder = new Bounder(this._graph, this._mark);
  this._output  = null; // Output changeset for reactive geom as Bounder reflows

  if (this._ds) { this._encoder.dependency(Deps.DATA, this._from); }

  // Since Builders are super nodes, copy over encoder dependencies
  // (bounder has no registered dependencies).
  this.dependency(Deps.DATA, this._encoder.dependency(Deps.DATA));
  this.dependency(Deps.SCALES, this._encoder.dependency(Deps.SCALES));
  this.dependency(Deps.SIGNALS, this._encoder.dependency(Deps.SIGNALS));

  return this;
};

proto.revises = function(p) {
  if (!arguments.length) return this._revises;

  // If we've not needed prev in the past, but a new inline ds needs it now
  // ensure existing items have prev set.
  if (!this._revises && p) {
    this._items.forEach(function(d) { if (d._prev === undefined) d._prev = Sentinel; });
  }

  this._revises = this._revises || p;
  return this;
};

// Reactive geometry and mark-level transformations are handled here 
// because they need their group's data-joined context. 
function inlineDs() {
  var from = this._def.from,
      geom = from.mark,
      src, name, spec, sibling, output, input;

  if (geom) {
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
  var revises = this._ds.revises(), node;

  if (geom) {
    sibling = this.sibling(geom).revises(revises);

    // Bounder reflows, so we need an intermediary node to propagate
    // the output constructed by the Builder.
    node = new Node(this._graph).addListener(this._ds.listener());
    node.evaluate = function() { return sibling._output; };

    if (sibling._isSuper) {
      sibling.addListener(node);
    } else {
      sibling._bounder.addListener(node);
    }
  } else {
    // At this point, we have a new datasource but it is empty as
    // the propagation cycle has already crossed the datasources. 
    // So, we repulse just this datasource. This should be safe
    // as the ds isn't connected to the scenegraph yet.
    
    output = this._ds.source().revises(revises).last();
    input  = ChangeSet.create(output);

    input.add = output.add;
    input.mod = output.mod;
    input.rem = output.rem;
    input.stamp = null;
    this._graph.propagate(input, this._ds.listener(), output.stamp);
  }
}

proto.pipeline = function() {
  return [this];
};

proto.connect = function() {
  var builder = this;

  this._graph.connect(this.pipeline());
  this._encoder._scales.forEach(function(s) {
    if (!(s = builder._parent.scale(s))) return;
    s.addListener(builder);
  });

  if (this._parent) {
    if (this._isSuper) this.addListener(this._parent._collector);
    else this._bounder.addListener(this._parent._collector);
  }

  return this;
};

proto.disconnect = function() {
  var builder = this;
  if (!this._listeners.length) return this;

  Node.prototype.disconnect.call(this);
  this._graph.disconnect(this.pipeline());
  this._encoder._scales.forEach(function(s) {
    if (!(s = builder._parent.scale(s))) return;
    s.removeListener(builder);
  });
  return this;
};

proto.sibling = function(name) {
  return this._parent.child(name, this._parent_id);
};

proto.evaluate = function(input) {
  log.debug(input, ["building", (this._from || this._def.from), this._def.type]);

  var output, fullUpdate, fcs, data, name;

  if (this._ds) {
    output = ChangeSet.create(input);

    // We need to determine if any encoder dependencies have been updated.
    // However, the encoder's data source will likely be updated, and shouldn't
    // trigger all items to mod.
    data = output.data[(name=this._ds.name())];
    delete output.data[name];
    fullUpdate = this._encoder.reevaluate(output);
    output.data[name] = data;

    // If a scale or signal in the update propset has been updated, 
    // send forward all items for reencoding if we do an early return.
    if (fullUpdate) output.mod = this._mark.items.slice();

    fcs = this._ds.last();
    if (!fcs) throw Error('Builder evaluated before backing DataSource');
    if (fcs.stamp > this._stamp) {
      output = joinDatasource.call(this, fcs, this._ds.values(), fullUpdate);
    }
  } else {
    data = util.isFunction(this._def.from) ? this._def.from() : [Sentinel];
    output = joinValues.call(this, input, data);
  }

  // Stash output before Bounder for downstream reactive geometry.
  this._output = output = this._graph.evaluate(output, this._encoder);

  // Supernodes calculate bounds too, but only on items marked dirty.
  if (this._isSuper) {
    output.mod = output.mod.filter(function(x) { return x._dirty; });
    output = this._graph.evaluate(output, this._bounder);
  }

  return output;
};

function newItem() {
  var prev = this._revises ? null : undefined,
      item = Tuple.ingest(new Item(this._mark), prev);

  // For the root node's item
  if (this._def.width)  Tuple.set(item, "width",  this._def.width);
  if (this._def.height) Tuple.set(item, "height", this._def.height);
  return item;
}

function join(data, keyf, next, output, prev, mod) {
  var i, key, len, item, datum, enter;

  for (i=0, len=data.length; i<len; ++i) {
    datum = data[i];
    item  = keyf ? this._map[key = keyf(datum)] : prev[i];
    enter = item ? false : (item = newItem.call(this), true);
    item.status = enter ? Status.ENTER : Status.UPDATE;
    item.datum = datum;
    Tuple.set(item, "key", key);
    this._map[key] = item;
    next.push(item);
    if (enter) {
      output.add.push(item);
    } else if (!mod || (mod && mod[datum._id])) {
      output.mod.push(item);
    }
  }
}

function joinDatasource(input, data, fullUpdate) {
  var output = ChangeSet.create(input),
      keyf = keyFunction(this._def.key || "_id"),
      mod = input.mod,
      rem = input.rem,
      next = [],
      i, key, len, item;

  // Build rems first, and put them at the head of the next items
  // Then build the rest of the data values (which won't contain rem).
  // This will preserve the sort order without needing anything extra.

  for (i=0, len=rem.length; i<len; ++i) {
    item = this._map[key = keyf(rem[i])];
    item.status = Status.EXIT;
    item._dirty = true;
    input.dirty.push(item);
    next.push(item);
    output.rem.push(item);
    this._map[key] = null;
  }

  join.call(this, data, keyf, next, output, null, Tuple.idMap(fullUpdate ? data : mod));

  return (this._mark.items = next, output);
}

function joinValues(input, data) {
  var output = ChangeSet.create(input),
      keyf = keyFunction(this._def.key),
      prev = this._mark.items || [],
      next = [],
      i, len, item;

  for (i=0, len=prev.length; i<len; ++i) {
    item = prev[i];
    item.status = Status.EXIT;
    if (keyf) this._map[item.key] = item;
  }

  join.call(this, data, keyf, next, output, prev, Tuple.idMap(data));

  for (i=0, len=prev.length; i<len; ++i) {
    item = prev[i];
    if (item.status === Status.EXIT) {
      Tuple.set(item, "key", keyf ? item.key : this._items.length);
      item._dirty = true;
      input.dirty.push(item);
      next.splice(0, 0, item);  // Keep item around for "exit" transition.
      output.rem.push(item);
    }
  }

  return (this._mark.items = next, output);
}

function keyFunction(key) {
  if (key == null) return null;
  var f = util.array(key).map(util.accessor);
  return function(d) {
    for (var s="", i=0, n=f.length; i<n; ++i) {
      if (i>0) s += "|";
      s += String(f[i](d));
    }
    return s;
  };
}

module.exports = Builder;
},{"../parse/data":86,"./Bounder":101,"./Encoder":103,"datalib/src/util":20,"vega-dataflow/src/ChangeSet":26,"vega-dataflow/src/Dependencies":29,"vega-dataflow/src/Node":31,"vega-dataflow/src/Sentinel":32,"vega-dataflow/src/Tuple":34,"vega-logging":41,"vega-scenegraph/src/util/Item":73}],103:[function(require,module,exports){
var util = require('datalib/src/util'),
    bound = require('vega-scenegraph/src/util/bound'),
    Node = require('vega-dataflow/src/Node'), // jshint ignore:line
    Deps = require('vega-dataflow/src/Dependencies'),
    log = require('vega-logging');
  
var EMPTY = {};

function Encoder(graph, mark) {
  var props  = mark.def.properties || {},
      enter  = props.enter,
      update = props.update,
      exit   = props.exit;

  Node.prototype.init.call(this, graph);

  this._mark = mark;
  var s = this._scales = [];

  // Only scales used in the "update" property set are set as
  // encoder depedencies to have targeted reevaluations. However,
  // we still want scales in "enter" and "exit" to be evaluated
  // before the encoder. 
  if (enter) s.push.apply(s, enter.scales);

  if (update) {
    this.dependency(Deps.DATA, update.data);
    this.dependency(Deps.SIGNALS, update.signals);
    this.dependency(Deps.FIELDS, update.fields);
    this.dependency(Deps.SCALES, update.scales);
    s.push.apply(s, update.scales);
  }

  if (exit) s.push.apply(s, exit.scales);

  return this;
}

var proto = (Encoder.prototype = new Node());

proto.evaluate = function(input) {
  log.debug(input, ["encoding", this._mark.def.type]);
  var graph = this._graph,
      props = this._mark.def.properties || {},
      enter  = props.enter,
      update = props.update,
      exit   = props.exit,
      dirty  = input.dirty,
      preds  = this._graph.predicates(),
      sg = graph.signalValues(),  // For expediency, get all signal values
      db = graph.dataValues(), 
      req = input.request,
      i, len, item, prop;

  if (req) {
    if ((prop = props[req])) {
      for (i=0, len=input.mod.length; i<len; ++i) {
        item = input.mod[i];
        encode.call(this, prop, item, input.trans, db, sg, preds, dirty);
      }
    }

    return input; // exit early if given request
  }

  // Items marked for removal are at the head of items. Process them first.
  for (i=0, len=input.rem.length; i<len; ++i) {
    item = input.rem[i];
    if (exit)   encode.call(this, exit,   item, input.trans, db, sg, preds, dirty); 
    if (input.trans && !exit) input.trans.interpolate(item, EMPTY);
    else if (!input.trans) item.remove();
  }

  for (i=0, len=input.add.length; i<len; ++i) {
    item = input.add[i];
    if (enter)  encode.call(this, enter,  item, input.trans, db, sg, preds, dirty);
    if (update) encode.call(this, update, item, input.trans, db, sg, preds, dirty);
    item.status = require('./Builder').STATUS.UPDATE;
  }

  if (update) {
    for (i=0, len=input.mod.length; i<len; ++i) {
      item = input.mod[i];
      encode.call(this, update, item, input.trans, db, sg, preds, dirty);
    }
  }

  return input;
};

function encode(prop, item, trans, db, sg, preds, dirty) {
  var enc = prop.encode,
      wasDirty = item._dirty,
      isDirty  = enc.call(enc, item, item.mark.group||item, trans, db, sg, preds);

  item._dirty = isDirty || wasDirty;
  if (isDirty && !wasDirty) dirty.push(item);
}

// If a specified property set called, or update property set 
// uses nested fieldrefs, reevaluate all items.
proto.reevaluate = function(pulse) {
  var def = this._mark.def,
      props = def.properties || {},
      update = props.update;

  return util.isFunction(def.from) || def.orient || pulse.request || 
    Node.prototype.reevaluate.call(this, pulse) || 
    (update ? update.reflow : false);
};

// Short-circuit encoder if user specifies items
Encoder.update = function(graph, trans, request, items, dirty) {
  items = util.array(items);
  var preds = graph.predicates(), 
      db = graph.dataValues(),
      sg = graph.signalValues(),
      i, len, item, props, prop;

  for (i=0, len=items.length; i<len; ++i) {
    item = items[i];
    props = item.mark.def.properties;
    prop = props && props[request];
    if (prop) {
      encode.call(null, prop, item, trans, db, sg, preds, dirty);
      bound.item(item);
    }
  }

};

module.exports = Encoder;
},{"./Builder":102,"datalib/src/util":20,"vega-dataflow/src/Dependencies":29,"vega-dataflow/src/Node":31,"vega-logging":41,"vega-scenegraph/src/util/bound":74}],104:[function(require,module,exports){
var util = require('datalib/src/util'),
    Node = require('vega-dataflow/src/Node'), // jshint ignore:line
    Collector = require('vega-dataflow/src/Collector'),
    Deps = require('vega-dataflow/src/Dependencies'),
    log = require('vega-logging'),
    Builder = require('./Builder'),
    Scale = require('./Scale'),
    parseAxes = require('../parse/axes'),
    parseLegends = require('../parse/legends');

function GroupBuilder() {
  this._children = {};
  this._scaler = null;
  this._recursor = null;

  this._scales = {};
  this.scale = scale.bind(this);
  return arguments.length ? this.init.apply(this, arguments) : this;
}

var Types = GroupBuilder.TYPES = {
  GROUP:  "group",
  MARK:   "mark",
  AXIS:   "axis",
  LEGEND: "legend"
};

var proto = (GroupBuilder.prototype = new Builder());

proto.init = function(graph, def) {
  var builder = this, name;

  this._scaler = new Node(graph);

  (def.scales||[]).forEach(function(s) {
    s = builder.scale((name=s.name), new Scale(graph, s, builder));
    builder.scale(name+":prev", s);
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

  this._recursor.dependency(Deps.SCALES, util.keys(scales));

  // We only need a collector for up-propagation of bounds calculation,
  // so only GroupBuilders, and not regular Builders, have collectors.
  this._collector = new Collector(graph);

  return Builder.prototype.init.apply(this, arguments);
};

proto.evaluate = function() {
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
  util.keys(builder._children).forEach(function(group_id) {
    builder._children[group_id].forEach(function(c) {
      builder._recursor.removeListener(c.builder);
      c.builder.disconnect();
    });
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
    if (child.type == Types.MARK && child.builder._def.name == name) break;
  }

  return child.builder;
};

function recurse(input) {
  var builder = this,
      hasMarks = util.array(this._def.marks).length > 0,
      hasAxes = util.array(this._def.axes).length > 0,
      hasLegends = util.array(this._def.legends).length > 0,
      i, j, c, len, group, pipeline, def, inline = false;

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
      inline = (def.type !== Types.GROUP);
      inline = inline && (this._graph.data(c.from) !== undefined); 
      inline = inline && (pipeline[pipeline.length-1].listeners().length === 1); // Reactive geom source
      inline = inline && (def.from && !def.from.mark); // Reactive geom target
      c.inline = inline;

      if (inline) this._graph.evaluate(input, c.builder);
      else this._recursor.addListener(c.builder);
    }
  }

  function removeTemp(c) {
    if (c.type == Types.MARK && !c.inline &&
        builder._graph.data(c.from) !== undefined) {
      builder._recursor.removeListener(c.builder);
    }
  }

  function updateAxis(a) { 
    var scale = a.scale();
    if (!input.scales[scale.scaleName]) return;
    a.reset().def();
  }
  
  function updateLegend(l) { 
    var scale = l.size() || l.shape() || l.fill() || l.stroke();
    if (!input.scales[scale.scaleName]) return;
    l.reset().def();
  }

  for (i=0, len=input.mod.length; i<len; ++i) {
    group = input.mod[i];

    // Remove temporary connection for marks that draw from a source
    if (hasMarks) builder._children[group._id].forEach(removeTemp);

    // Update axis data defs
    if (hasAxes) group.axes.forEach(updateAxis);

    // Update legend data defs
    if (hasLegends) group.legends.forEach(updateLegend);
  }

  function disconnectChildren(c) { 
    builder._recursor.removeListener(c.builder);
    c.builder.disconnect(); 
  }

  for (i=0, len=input.rem.length; i<len; ++i) {
    group = input.rem[i];
    // For deleted groups, disconnect their children
    builder._children[group._id].forEach(disconnectChildren);
    delete builder._children[group._id];
  }

  return input;
}

function scale(name, s) {
  var group = this;
  if (arguments.length === 2) return (group._scales[name] = s, s);
  while (s == null) {
    s = group._scales[name];
    group = group.mark ? group.mark.group : group._parent;
    if (!group) break;
  }
  return s;
}

function buildGroup(input, group) {
  log.debug(input, ["building group", group._id]);

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
  log.debug(input, ["building children marks #"+group._id]);
  var marks = this._def.marks,
      mark, from, inherit, i, len, b;

  for (i=0, len=marks.length; i<len; ++i) {
    mark = marks[i];
    from = mark.from || {};
    inherit = group.datum._facetID;
    group.items[i] = {group: group};
    b = (mark.type === Types.GROUP) ? new GroupBuilder() : new Builder();
    b.init(this._graph, mark, group.items[i], this, group._id, inherit);
    this._children[group._id].push({ 
      builder: b, 
      from: from.data || (from.mark ? ("vg_" + group._id + "_" + from.mark) : inherit), 
      type: Types.MARK 
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

    axisItems[i] = {group: group, axisDef: def, layer: def.layer};
    b = (def.type === Types.GROUP) ? new GroupBuilder() : new Builder();
    b.init(builder._graph, def, axisItems[i], builder)
      .dependency(Deps.SCALES, scale);
    builder._children[group._id].push({ builder: b, type: Types.AXIS, scale: scale });
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
    b = (def.type === Types.GROUP) ? new GroupBuilder() : new Builder();
    b.init(builder._graph, def, legendItems[i], builder)
      .dependency(Deps.SCALES, scale);
    builder._children[group._id].push({ builder: b, type: Types.LEGEND, scale: scale });
  });
}

module.exports = GroupBuilder;
},{"../parse/axes":84,"../parse/legends":90,"./Builder":102,"./Scale":105,"datalib/src/util":20,"vega-dataflow/src/Collector":27,"vega-dataflow/src/Dependencies":29,"vega-dataflow/src/Node":31,"vega-logging":41}],105:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    util = require('datalib/src/util'),
    changeset = require('vega-dataflow/src/ChangeSet'),
    Node = require('vega-dataflow/src/Node'), // jshint ignore:line
    Deps = require('vega-dataflow/src/Dependencies'),
    log = require('vega-logging'),
    Aggregate = require('../transforms/Aggregate');

var Properties = {
  width: 1,
  height: 1
};

var Types = {
  LINEAR: 'linear',
  ORDINAL: 'ordinal',
  LOG: 'log',
  POWER: 'pow',
  SQRT: 'sqrt',
  TIME: 'time',
  TIME_UTC: 'utc',
  QUANTILE: 'quantile',
  QUANTIZE: 'quantize',
  THRESHOLD: 'threshold'
};

var DataRef = {
  DOMAIN: 'domain',
  RANGE: 'range',

  COUNT: 'count',
  GROUPBY: 'groupby',
  MIN: 'min',
  MAX: 'max',
  VALUE: 'value',

  ASC: 'asc',
  DESC: 'desc'
};

function Scale(graph, def, parent) {
  this._def     = def;
  this._parent  = parent;
  this._updated = false;
  return Node.prototype.init.call(this, graph).reflows(true);
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
    var method = (type === Deps.DATA ? 'data' : 'signal');
    deps = util.array(deps);
    for (var i=0, len=deps.length; i<len; ++i) {
      this._graph[method](deps[i]).addListener(this._parent);
    }
  }

  return Node.prototype.dependency.call(this, type, deps);
};

function scale(group) {
  var name = this._def.name,
      prev = name + ':prev',
      s = instance.call(this, group.scale(name)),
      m = s.type===Types.ORDINAL ? ordinal : quantitative,
      rng = range.call(this, group);

  m.call(this, s, rng, group);

  group.scale(name, s);
  group.scale(prev, group.scale(prev) || s);

  return s;
}

function instance(scale) {
  var config = this._graph.config(),
      type = this._def.type || Types.LINEAR;
  if (!scale || type !== scale.type) {
    var ctor = config.scale[type] || d3.scale[type];
    if (!ctor) util.error('Unrecognized scale type: ' + type);
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
      pad = signal.call(this, def.padding) || 0,
      outer = def.outerPadding == null ? pad : signal.call(this, def.outerPadding),
      points = def.points && signal.call(this, def.points),
      round = signal.call(this, def.round) || def.round == null,
      domain, str;
  
  // range pre-processing for data-driven ranges
  if (util.isObject(def.range) && !util.isArray(def.range)) {
    dataDrivenRange = true;
    rng = dataRef.call(this, DataRef.RANGE, def.range, scale, group);
  }
  
  // domain
  domain = dataRef.call(this, DataRef.DOMAIN, def.domain, scale, group);
  if (domain && !util.equal(prev.domain, domain)) {
    scale.domain(domain);
    prev.domain = domain;
    this._updated = true;
  } 

  // range
  if (util.equal(prev.range, rng)) return;

  // width-defined range
  if (def.bandWidth) {
    var bw = signal.call(this, def.bandWidth),
        len = domain.length,
        space = def.points ? (pad*bw) : (pad*bw*(len-1) + 2*outer),
        start;
    if (rng[0] > rng[1]) {
      start = rng[1] || 0;
      rng = [start + (bw * len + space), start];
    } else {
      start = rng[0] || 0;
      rng = [start, start + (bw * len + space)];
    }
  }

  str = typeof rng[0] === 'string';
  if (str || rng.length > 2 || rng.length===1 || dataDrivenRange) {
    scale.range(rng); // color or shape values
  } else if (points && round) {
    scale.rangeRoundPoints(rng, pad);
  } else if (points) {
    scale.rangePoints(rng, pad);
  } else if (round) {
    scale.rangeRoundBands(rng, pad, outer);
  } else {
    scale.rangeBands(rng, pad, outer);
  }

  if (!scale.invert) {
    scale.invert = function(x, y) {
      if (arguments.length === 1) {
        return scale.domain()[d3.bisect(scale.range(), x) - 1];
      } else if (arguments.length === 2) {  // Invert extents
        if (!util.isNumber(x) || !util.isNumber(y)) {
          throw new Error('Extents to ordinal invert are not numbers ('+x+', '+y+').');
        }

        var points = [],
            rng = scale.range(),
            i = 0, len = rng.length, r;

        for(; i<len; ++i) {
          r = rng[i];
          if (x < y ? x <= r && r <= y : y <= r && r <= x) {
            points.push(r);
          }
        }

        return points.map(function(p) { return scale.invert(p); });
      }
    };
  }

  prev.range = rng;
  this._updated = true;
}

function quantitative(scale, rng, group) {
  var def = this._def,
      prev = scale._prev,
      round = signal.call(this, def.round),
      exponent = signal.call(this, def.exponent),
      clamp = signal.call(this, def.clamp),
      nice = signal.call(this, def.nice),
      domain, interval;

  // domain
  domain = (def.type === Types.QUANTILE) ?
    dataRef.call(this, DataRef.DOMAIN, def.domain, scale, group) :
    domainMinMax.call(this, scale, group);
  if (domain && !util.equal(prev.domain, domain)) {
    scale.domain(domain);
    prev.domain = domain;
    this._updated = true;
  } 

  // range
  // vertical scales should flip by default, so use XOR here
  if (signal.call(this, def.range) === 'height') rng = rng.reverse();
  if (util.equal(prev.range, rng)) return;
  scale[round && scale.rangeRound ? 'rangeRound' : 'range'](rng);
  prev.range = rng;
  this._updated = true;

  // TODO: Support signals for these properties. Until then, only eval
  // them once.
  if (this._stamp > 0) return;
  if (exponent && def.type===Types.POWER) scale.exponent(exponent);
  if (clamp) scale.clamp(true);
  if (nice) {
    if (def.type === Types.TIME) {
      interval = d3.time[nice];
      if (!interval) log.error('Unrecognized interval: ' + interval);
      scale.nice(interval);
    } else {
      scale.nice();
    }
  }
}

function isUniques(scale) { 
  return scale.type === Types.ORDINAL || scale.type === Types.QUANTILE; 
}

function getRefs(def) { 
  return def.fields || util.array(def);
}

function getFields(ref, group) {
  return util.array(ref.field).map(function(f) {
    return f.parent ?
      util.accessor(f.parent)(group.datum) :
      f; // String or {'signal'}
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
  if (refs.length == 1 && util.array(refs[0].field).length == 1) {
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
      ck = '_'+which,
      fields = getFields(refs[0], group),
      ref;

  if (scale[ck]) return scale[ck];

  var cache = scale[ck] = new Aggregate(this._graph).type(atype),
      groupby, summarize;

  if (uniques) {
    if (atype === Aggregate.TYPES.VALUE) {
      groupby = [{ name: DataRef.GROUPBY, get: util.identity }];
      summarize = {'*': DataRef.COUNT};
    } else if (atype === Aggregate.TYPES.TUPLE) {
      groupby = [{ name: DataRef.GROUPBY, get: util.$(fields[0]) }];
      summarize = sort ? [{
        field: DataRef.VALUE,
        get:  util.$(ref.sort || sort.field),
        ops: [sort.op]
      }] : {'*': DataRef.COUNT};
    } else {  // atype === Aggregate.TYPES.MULTI
      groupby   = DataRef.GROUPBY;
      summarize = [{ field: DataRef.VALUE, ops: [sort.op] }]; 
    }
  } else {
    groupby = [];
    summarize = [{
      field: DataRef.VALUE,
      get: (atype == Aggregate.TYPES.TUPLE) ? util.$(fields[0]) : util.identity,
      ops: [DataRef.MIN, DataRef.MAX],
      as:  [DataRef.MIN, DataRef.MAX]
    }];
  }

  cache.param('groupby', groupby)
    .param('summarize', summarize);

  return cache;
}

function dataRef(which, def, scale, group) {
  if (def == null) { return []; }
  if (util.isArray(def)) return def.map(signal.bind(this));

  var self = this, graph = this._graph,
      refs = getRefs(def),
      atype = aggrType(def, scale),
      cache = getCache.apply(this, arguments),
      sort  = def.sort,
      uniques = isUniques(scale),
      i, rlen, j, flen, ref, fields, field, data, from;

  function addDep(s) {
    self.dependency(Deps.SIGNALS, s);
  }

  for (i=0, rlen=refs.length; i<rlen; ++i) {
    ref = refs[i];
    from = ref.data || group.datum._facetID;
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

    this.dependency(Deps.DATA, from);
    cache.dependency(Deps.SIGNALS).forEach(addDep);
  }

  data = cache.aggr().result();
  if (uniques) {
    if (sort) {
      sort = sort.order.signal ? graph.signalRef(sort.order.signal) : sort.order;
      sort = (sort == DataRef.DESC ? '-' : '+') + DataRef.VALUE;
      sort = util.comparator(sort);
      data = data.sort(sort);
    // } else {  // 'First seen' order
    //   sort = util.comparator('tpl._id');
    }

    return data.map(function(d) { return d[DataRef.GROUPBY]; });
  } else {
    data = data[0];
    return !util.isValid(data) ? [] : [data[DataRef.MIN], data[DataRef.MAX]];
  }
}

function signal(v) {
  if (!v || !v.signal) return v;
  var s = v.signal, ref;
  this.dependency(Deps.SIGNALS, (ref = util.field(s))[0]);
  return this._graph.signalRef(ref);
}

function domainMinMax(scale, group) {
  var def = this._def,
      domain = [null, null], z;

  if (def.domain !== undefined) {
    domain = (!util.isObject(def.domain)) ? domain :
      dataRef.call(this, DataRef.DOMAIN, def.domain, scale, group);
  }

  z = domain.length - 1;
  if (def.domainMin !== undefined) {
    if (util.isObject(def.domainMin)) {
      if (def.domainMin.signal) {
        domain[0] = signal.call(this, def.domainMin);
      } else {
        domain[0] = dataRef.call(this, DataRef.DOMAIN+DataRef.MIN, def.domainMin, scale, group)[0];
      }
    } else {
      domain[0] = def.domainMin;
    }
  }
  if (def.domainMax !== undefined) {
    if (util.isObject(def.domainMax)) {
      if (def.domainMax.signal) {
        domain[z] = signal.call(this, def.domainMax);
      } else {
        domain[z] = dataRef.call(this, DataRef.DOMAIN+DataRef.MAX, def.domainMax, scale, group)[1];
      }
    } else {
      domain[z] = def.domainMax;
    }
  }
  if (def.type !== Types.LOG && def.type !== Types.TIME && (def.zero || def.zero===undefined)) {
    domain[0] = Math.min(0, domain[0]);
    domain[z] = Math.max(0, domain[z]);
  }
  return domain;
}

function range(group) {
  var def = this._def,
      config = this._graph.config(),
      rangeVal = signal.call(this, def.range),
      rng = [null, null];

  if (rangeVal !== undefined) {
    if (typeof rangeVal === 'string') {
      if (Properties[rangeVal]) {
        rng = [0, group[rangeVal]];
      } else if (config.range[rangeVal]) {
        rng = config.range[rangeVal];
      } else {
        log.error('Unrecogized range: ' + rangeVal);
        return rng;
      }
    } else if (util.isArray(rangeVal)) {
      rng = util.duplicate(rangeVal).map(signal.bind(this));
    } else if (util.isObject(rangeVal)) {
      return null; // early exit
    } else {
      rng = [0, rangeVal];
    }
  }
  if (def.rangeMin !== undefined) {
    rng[0] = def.rangeMin.signal ?
      signal.call(this, def.rangeMin) :
      def.rangeMin;
  }
  if (def.rangeMax !== undefined) {
    rng[rng.length-1] = def.rangeMax.signal ?
      signal.call(this, def.rangeMax) :
      def.rangeMax;
  }
  
  if (def.reverse !== undefined) {
    var rev = signal.call(this, def.reverse);
    if (util.isObject(rev)) {
      rev = util.accessor(rev.field)(group.datum);
    }
    if (rev) rng = rng.reverse();
  }
  
  return rng;
}

module.exports = Scale;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9zY2VuZS9TY2FsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbInZhciBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICAgIHV0aWwgPSByZXF1aXJlKCdkYXRhbGliL3NyYy91dGlsJyksXG4gICAgY2hhbmdlc2V0ID0gcmVxdWlyZSgndmVnYS1kYXRhZmxvdy9zcmMvQ2hhbmdlU2V0JyksXG4gICAgTm9kZSA9IHJlcXVpcmUoJ3ZlZ2EtZGF0YWZsb3cvc3JjL05vZGUnKSwgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgRGVwcyA9IHJlcXVpcmUoJ3ZlZ2EtZGF0YWZsb3cvc3JjL0RlcGVuZGVuY2llcycpLFxuICAgIGxvZyA9IHJlcXVpcmUoJ3ZlZ2EtbG9nZ2luZycpLFxuICAgIEFnZ3JlZ2F0ZSA9IHJlcXVpcmUoJy4uL3RyYW5zZm9ybXMvQWdncmVnYXRlJyk7XG5cbnZhciBQcm9wZXJ0aWVzID0ge1xuICB3aWR0aDogMSxcbiAgaGVpZ2h0OiAxXG59O1xuXG52YXIgVHlwZXMgPSB7XG4gIExJTkVBUjogJ2xpbmVhcicsXG4gIE9SRElOQUw6ICdvcmRpbmFsJyxcbiAgTE9HOiAnbG9nJyxcbiAgUE9XRVI6ICdwb3cnLFxuICBTUVJUOiAnc3FydCcsXG4gIFRJTUU6ICd0aW1lJyxcbiAgVElNRV9VVEM6ICd1dGMnLFxuICBRVUFOVElMRTogJ3F1YW50aWxlJyxcbiAgUVVBTlRJWkU6ICdxdWFudGl6ZScsXG4gIFRIUkVTSE9MRDogJ3RocmVzaG9sZCdcbn07XG5cbnZhciBEYXRhUmVmID0ge1xuICBET01BSU46ICdkb21haW4nLFxuICBSQU5HRTogJ3JhbmdlJyxcblxuICBDT1VOVDogJ2NvdW50JyxcbiAgR1JPVVBCWTogJ2dyb3VwYnknLFxuICBNSU46ICdtaW4nLFxuICBNQVg6ICdtYXgnLFxuICBWQUxVRTogJ3ZhbHVlJyxcblxuICBBU0M6ICdhc2MnLFxuICBERVNDOiAnZGVzYydcbn07XG5cbmZ1bmN0aW9uIFNjYWxlKGdyYXBoLCBkZWYsIHBhcmVudCkge1xuICB0aGlzLl9kZWYgICAgID0gZGVmO1xuICB0aGlzLl9wYXJlbnQgID0gcGFyZW50O1xuICB0aGlzLl91cGRhdGVkID0gZmFsc2U7XG4gIHJldHVybiBOb2RlLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgZ3JhcGgpLnJlZmxvd3ModHJ1ZSk7XG59XG5cbnZhciBwcm90byA9IChTY2FsZS5wcm90b3R5cGUgPSBuZXcgTm9kZSgpKTtcblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICBmbiA9IGZ1bmN0aW9uKGdyb3VwKSB7IHNjYWxlLmNhbGwoc2VsZiwgZ3JvdXApOyB9O1xuXG4gIHRoaXMuX3VwZGF0ZWQgPSBmYWxzZTtcbiAgaW5wdXQuYWRkLmZvckVhY2goZm4pO1xuICBpbnB1dC5tb2QuZm9yRWFjaChmbik7XG5cbiAgLy8gU2NhbGVzIGFyZSBhdCB0aGUgZW5kIG9mIGFuIGVuY29kaW5nIHBpcGVsaW5lLCBzbyB0aGV5IHNob3VsZCBmb3J3YXJkIGFcbiAgLy8gcmVmbG93IHB1bHNlLiBUaHVzLCBpZiBtdWx0aXBsZSBzY2FsZXMgdXBkYXRlIGluIHRoZSBwYXJlbnQgZ3JvdXAsIHdlIGRvbid0XG4gIC8vIHJlZXZhbHVhdGUgY2hpbGQgbWFya3MgbXVsdGlwbGUgdGltZXMuIFxuICBpZiAodGhpcy5fdXBkYXRlZCkgaW5wdXQuc2NhbGVzW3RoaXMuX2RlZi5uYW1lXSA9IDE7XG4gIHJldHVybiBjaGFuZ2VzZXQuY3JlYXRlKGlucHV0LCB0cnVlKTtcbn07XG5cbi8vIEFsbCBvZiBhIHNjYWxlJ3MgZGVwZW5kZW5jaWVzIGFyZSByZWdpc3RlcmVkIGR1cmluZyBwcm9wYWdhdGlvbiBhcyB3ZSBwYXJzZVxuLy8gZGF0YVJlZnMuIFNvIGEgc2NhbGUgbXVzdCBiZSByZXNwb25zaWJsZSBmb3IgY29ubmVjdGluZyBpdHNlbGYgdG8gZGVwZW5kZW50cy5cbnByb3RvLmRlcGVuZGVuY3kgPSBmdW5jdGlvbih0eXBlLCBkZXBzKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDIpIHtcbiAgICB2YXIgbWV0aG9kID0gKHR5cGUgPT09IERlcHMuREFUQSA/ICdkYXRhJyA6ICdzaWduYWwnKTtcbiAgICBkZXBzID0gdXRpbC5hcnJheShkZXBzKTtcbiAgICBmb3IgKHZhciBpPTAsIGxlbj1kZXBzLmxlbmd0aDsgaTxsZW47ICsraSkge1xuICAgICAgdGhpcy5fZ3JhcGhbbWV0aG9kXShkZXBzW2ldKS5hZGRMaXN0ZW5lcih0aGlzLl9wYXJlbnQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBOb2RlLnByb3RvdHlwZS5kZXBlbmRlbmN5LmNhbGwodGhpcywgdHlwZSwgZGVwcyk7XG59O1xuXG5mdW5jdGlvbiBzY2FsZShncm91cCkge1xuICB2YXIgbmFtZSA9IHRoaXMuX2RlZi5uYW1lLFxuICAgICAgcHJldiA9IG5hbWUgKyAnOnByZXYnLFxuICAgICAgcyA9IGluc3RhbmNlLmNhbGwodGhpcywgZ3JvdXAuc2NhbGUobmFtZSkpLFxuICAgICAgbSA9IHMudHlwZT09PVR5cGVzLk9SRElOQUwgPyBvcmRpbmFsIDogcXVhbnRpdGF0aXZlLFxuICAgICAgcm5nID0gcmFuZ2UuY2FsbCh0aGlzLCBncm91cCk7XG5cbiAgbS5jYWxsKHRoaXMsIHMsIHJuZywgZ3JvdXApO1xuXG4gIGdyb3VwLnNjYWxlKG5hbWUsIHMpO1xuICBncm91cC5zY2FsZShwcmV2LCBncm91cC5zY2FsZShwcmV2KSB8fCBzKTtcblxuICByZXR1cm4gcztcbn1cblxuZnVuY3Rpb24gaW5zdGFuY2Uoc2NhbGUpIHtcbiAgdmFyIGNvbmZpZyA9IHRoaXMuX2dyYXBoLmNvbmZpZygpLFxuICAgICAgdHlwZSA9IHRoaXMuX2RlZi50eXBlIHx8IFR5cGVzLkxJTkVBUjtcbiAgaWYgKCFzY2FsZSB8fCB0eXBlICE9PSBzY2FsZS50eXBlKSB7XG4gICAgdmFyIGN0b3IgPSBjb25maWcuc2NhbGVbdHlwZV0gfHwgZDMuc2NhbGVbdHlwZV07XG4gICAgaWYgKCFjdG9yKSB1dGlsLmVycm9yKCdVbnJlY29nbml6ZWQgc2NhbGUgdHlwZTogJyArIHR5cGUpO1xuICAgIChzY2FsZSA9IGN0b3IoKSkudHlwZSA9IHNjYWxlLnR5cGUgfHwgdHlwZTtcbiAgICBzY2FsZS5zY2FsZU5hbWUgPSB0aGlzLl9kZWYubmFtZTtcbiAgICBzY2FsZS5fcHJldiA9IHt9O1xuICB9XG4gIHJldHVybiBzY2FsZTtcbn1cblxuZnVuY3Rpb24gb3JkaW5hbChzY2FsZSwgcm5nLCBncm91cCkge1xuICB2YXIgZGVmID0gdGhpcy5fZGVmLFxuICAgICAgcHJldiA9IHNjYWxlLl9wcmV2LFxuICAgICAgZGF0YURyaXZlblJhbmdlID0gZmFsc2UsXG4gICAgICBwYWQgPSBzaWduYWwuY2FsbCh0aGlzLCBkZWYucGFkZGluZykgfHwgMCxcbiAgICAgIG91dGVyID0gZGVmLm91dGVyUGFkZGluZyA9PSBudWxsID8gcGFkIDogc2lnbmFsLmNhbGwodGhpcywgZGVmLm91dGVyUGFkZGluZyksXG4gICAgICBwb2ludHMgPSBkZWYucG9pbnRzICYmIHNpZ25hbC5jYWxsKHRoaXMsIGRlZi5wb2ludHMpLFxuICAgICAgcm91bmQgPSBzaWduYWwuY2FsbCh0aGlzLCBkZWYucm91bmQpIHx8IGRlZi5yb3VuZCA9PSBudWxsLFxuICAgICAgZG9tYWluLCBzdHI7XG4gIFxuICAvLyByYW5nZSBwcmUtcHJvY2Vzc2luZyBmb3IgZGF0YS1kcml2ZW4gcmFuZ2VzXG4gIGlmICh1dGlsLmlzT2JqZWN0KGRlZi5yYW5nZSkgJiYgIXV0aWwuaXNBcnJheShkZWYucmFuZ2UpKSB7XG4gICAgZGF0YURyaXZlblJhbmdlID0gdHJ1ZTtcbiAgICBybmcgPSBkYXRhUmVmLmNhbGwodGhpcywgRGF0YVJlZi5SQU5HRSwgZGVmLnJhbmdlLCBzY2FsZSwgZ3JvdXApO1xuICB9XG4gIFxuICAvLyBkb21haW5cbiAgZG9tYWluID0gZGF0YVJlZi5jYWxsKHRoaXMsIERhdGFSZWYuRE9NQUlOLCBkZWYuZG9tYWluLCBzY2FsZSwgZ3JvdXApO1xuICBpZiAoZG9tYWluICYmICF1dGlsLmVxdWFsKHByZXYuZG9tYWluLCBkb21haW4pKSB7XG4gICAgc2NhbGUuZG9tYWluKGRvbWFpbik7XG4gICAgcHJldi5kb21haW4gPSBkb21haW47XG4gICAgdGhpcy5fdXBkYXRlZCA9IHRydWU7XG4gIH0gXG5cbiAgLy8gcmFuZ2VcbiAgaWYgKHV0aWwuZXF1YWwocHJldi5yYW5nZSwgcm5nKSkgcmV0dXJuO1xuXG4gIC8vIHdpZHRoLWRlZmluZWQgcmFuZ2VcbiAgaWYgKGRlZi5iYW5kV2lkdGgpIHtcbiAgICB2YXIgYncgPSBzaWduYWwuY2FsbCh0aGlzLCBkZWYuYmFuZFdpZHRoKSxcbiAgICAgICAgbGVuID0gZG9tYWluLmxlbmd0aCxcbiAgICAgICAgc3BhY2UgPSBkZWYucG9pbnRzID8gKHBhZCpidykgOiAocGFkKmJ3KihsZW4tMSkgKyAyKm91dGVyKSxcbiAgICAgICAgc3RhcnQ7XG4gICAgaWYgKHJuZ1swXSA+IHJuZ1sxXSkge1xuICAgICAgc3RhcnQgPSBybmdbMV0gfHwgMDtcbiAgICAgIHJuZyA9IFtzdGFydCArIChidyAqIGxlbiArIHNwYWNlKSwgc3RhcnRdO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydCA9IHJuZ1swXSB8fCAwO1xuICAgICAgcm5nID0gW3N0YXJ0LCBzdGFydCArIChidyAqIGxlbiArIHNwYWNlKV07XG4gICAgfVxuICB9XG5cbiAgc3RyID0gdHlwZW9mIHJuZ1swXSA9PT0gJ3N0cmluZyc7XG4gIGlmIChzdHIgfHwgcm5nLmxlbmd0aCA+IDIgfHwgcm5nLmxlbmd0aD09PTEgfHwgZGF0YURyaXZlblJhbmdlKSB7XG4gICAgc2NhbGUucmFuZ2Uocm5nKTsgLy8gY29sb3Igb3Igc2hhcGUgdmFsdWVzXG4gIH0gZWxzZSBpZiAocG9pbnRzICYmIHJvdW5kKSB7XG4gICAgc2NhbGUucmFuZ2VSb3VuZFBvaW50cyhybmcsIHBhZCk7XG4gIH0gZWxzZSBpZiAocG9pbnRzKSB7XG4gICAgc2NhbGUucmFuZ2VQb2ludHMocm5nLCBwYWQpO1xuICB9IGVsc2UgaWYgKHJvdW5kKSB7XG4gICAgc2NhbGUucmFuZ2VSb3VuZEJhbmRzKHJuZywgcGFkLCBvdXRlcik7XG4gIH0gZWxzZSB7XG4gICAgc2NhbGUucmFuZ2VCYW5kcyhybmcsIHBhZCwgb3V0ZXIpO1xuICB9XG5cbiAgaWYgKCFzY2FsZS5pbnZlcnQpIHtcbiAgICBzY2FsZS5pbnZlcnQgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gc2NhbGUuZG9tYWluKClbZDMuYmlzZWN0KHNjYWxlLnJhbmdlKCksIHgpIC0gMV07XG4gICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHsgIC8vIEludmVydCBleHRlbnRzXG4gICAgICAgIGlmICghdXRpbC5pc051bWJlcih4KSB8fCAhdXRpbC5pc051bWJlcih5KSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRXh0ZW50cyB0byBvcmRpbmFsIGludmVydCBhcmUgbm90IG51bWJlcnMgKCcreCsnLCAnK3krJykuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcG9pbnRzID0gW10sXG4gICAgICAgICAgICBybmcgPSBzY2FsZS5yYW5nZSgpLFxuICAgICAgICAgICAgaSA9IDAsIGxlbiA9IHJuZy5sZW5ndGgsIHI7XG5cbiAgICAgICAgZm9yKDsgaTxsZW47ICsraSkge1xuICAgICAgICAgIHIgPSBybmdbaV07XG4gICAgICAgICAgaWYgKHggPCB5ID8geCA8PSByICYmIHIgPD0geSA6IHkgPD0gciAmJiByIDw9IHgpIHtcbiAgICAgICAgICAgIHBvaW50cy5wdXNoKHIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwb2ludHMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHNjYWxlLmludmVydChwKTsgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHByZXYucmFuZ2UgPSBybmc7XG4gIHRoaXMuX3VwZGF0ZWQgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBxdWFudGl0YXRpdmUoc2NhbGUsIHJuZywgZ3JvdXApIHtcbiAgdmFyIGRlZiA9IHRoaXMuX2RlZixcbiAgICAgIHByZXYgPSBzY2FsZS5fcHJldixcbiAgICAgIHJvdW5kID0gc2lnbmFsLmNhbGwodGhpcywgZGVmLnJvdW5kKSxcbiAgICAgIGV4cG9uZW50ID0gc2lnbmFsLmNhbGwodGhpcywgZGVmLmV4cG9uZW50KSxcbiAgICAgIGNsYW1wID0gc2lnbmFsLmNhbGwodGhpcywgZGVmLmNsYW1wKSxcbiAgICAgIG5pY2UgPSBzaWduYWwuY2FsbCh0aGlzLCBkZWYubmljZSksXG4gICAgICBkb21haW4sIGludGVydmFsO1xuXG4gIC8vIGRvbWFpblxuICBkb21haW4gPSAoZGVmLnR5cGUgPT09IFR5cGVzLlFVQU5USUxFKSA/XG4gICAgZGF0YVJlZi5jYWxsKHRoaXMsIERhdGFSZWYuRE9NQUlOLCBkZWYuZG9tYWluLCBzY2FsZSwgZ3JvdXApIDpcbiAgICBkb21haW5NaW5NYXguY2FsbCh0aGlzLCBzY2FsZSwgZ3JvdXApO1xuICBpZiAoZG9tYWluICYmICF1dGlsLmVxdWFsKHByZXYuZG9tYWluLCBkb21haW4pKSB7XG4gICAgc2NhbGUuZG9tYWluKGRvbWFpbik7XG4gICAgcHJldi5kb21haW4gPSBkb21haW47XG4gICAgdGhpcy5fdXBkYXRlZCA9IHRydWU7XG4gIH0gXG5cbiAgLy8gcmFuZ2VcbiAgLy8gdmVydGljYWwgc2NhbGVzIHNob3VsZCBmbGlwIGJ5IGRlZmF1bHQsIHNvIHVzZSBYT1IgaGVyZVxuICBpZiAoc2lnbmFsLmNhbGwodGhpcywgZGVmLnJhbmdlKSA9PT0gJ2hlaWdodCcpIHJuZyA9IHJuZy5yZXZlcnNlKCk7XG4gIGlmICh1dGlsLmVxdWFsKHByZXYucmFuZ2UsIHJuZykpIHJldHVybjtcbiAgc2NhbGVbcm91bmQgJiYgc2NhbGUucmFuZ2VSb3VuZCA/ICdyYW5nZVJvdW5kJyA6ICdyYW5nZSddKHJuZyk7XG4gIHByZXYucmFuZ2UgPSBybmc7XG4gIHRoaXMuX3VwZGF0ZWQgPSB0cnVlO1xuXG4gIC8vIFRPRE86IFN1cHBvcnQgc2lnbmFscyBmb3IgdGhlc2UgcHJvcGVydGllcy4gVW50aWwgdGhlbiwgb25seSBldmFsXG4gIC8vIHRoZW0gb25jZS5cbiAgaWYgKHRoaXMuX3N0YW1wID4gMCkgcmV0dXJuO1xuICBpZiAoZXhwb25lbnQgJiYgZGVmLnR5cGU9PT1UeXBlcy5QT1dFUikgc2NhbGUuZXhwb25lbnQoZXhwb25lbnQpO1xuICBpZiAoY2xhbXApIHNjYWxlLmNsYW1wKHRydWUpO1xuICBpZiAobmljZSkge1xuICAgIGlmIChkZWYudHlwZSA9PT0gVHlwZXMuVElNRSkge1xuICAgICAgaW50ZXJ2YWwgPSBkMy50aW1lW25pY2VdO1xuICAgICAgaWYgKCFpbnRlcnZhbCkgbG9nLmVycm9yKCdVbnJlY29nbml6ZWQgaW50ZXJ2YWw6ICcgKyBpbnRlcnZhbCk7XG4gICAgICBzY2FsZS5uaWNlKGludGVydmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NhbGUubmljZSgpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpc1VuaXF1ZXMoc2NhbGUpIHsgXG4gIHJldHVybiBzY2FsZS50eXBlID09PSBUeXBlcy5PUkRJTkFMIHx8IHNjYWxlLnR5cGUgPT09IFR5cGVzLlFVQU5USUxFOyBcbn1cblxuZnVuY3Rpb24gZ2V0UmVmcyhkZWYpIHsgXG4gIHJldHVybiBkZWYuZmllbGRzIHx8IHV0aWwuYXJyYXkoZGVmKTtcbn1cblxuZnVuY3Rpb24gZ2V0RmllbGRzKHJlZiwgZ3JvdXApIHtcbiAgcmV0dXJuIHV0aWwuYXJyYXkocmVmLmZpZWxkKS5tYXAoZnVuY3Rpb24oZikge1xuICAgIHJldHVybiBmLnBhcmVudCA/XG4gICAgICB1dGlsLmFjY2Vzc29yKGYucGFyZW50KShncm91cC5kYXR1bSkgOlxuICAgICAgZjsgLy8gU3RyaW5nIG9yIHsnc2lnbmFsJ31cbiAgfSk7XG59XG5cbi8vIFNjYWxlIGRhdGFyZWZzIGNhbiBiZSBjb21wdXRlZCBvdmVyIG11bHRpcGxlIHNjaGVtYSB0eXBlcy4gXG4vLyBUaGlzIGZ1bmN0aW9uIGRldGVybWluZXMgdGhlIHR5cGUgb2YgYWdncmVnYXRvciBjcmVhdGVkLCBhbmRcbi8vIHdoYXQgZGF0YSBpcyBzZW50IHRvIGl0OiB2YWx1ZXMsIHR1cGxlcywgb3IgbXVsdGktdHVwbGVzIHRoYXQgbXVzdFxuLy8gYmUgc3RhbmRhcmRpemVkIGludG8gYSBjb25zaXN0ZW50IHNjaGVtYS4gXG5mdW5jdGlvbiBhZ2dyVHlwZShkZWYsIHNjYWxlKSB7XG4gIHZhciByZWZzID0gZ2V0UmVmcyhkZWYpO1xuXG4gIC8vIElmIHdlJ3JlIG9wZXJhdGluZyBvdmVyIG9ubHkgYSBzaW5nbGUgZG9tYWluLCBzZW5kIGZ1bGwgdHVwbGVzXG4gIC8vIHRocm91Z2ggZm9yIGVmZmljaWVuY3kgKGZld2VyIGFjY2Vzc29yIGNyZWF0aW9ucy9jYWxscylcbiAgaWYgKHJlZnMubGVuZ3RoID09IDEgJiYgdXRpbC5hcnJheShyZWZzWzBdLmZpZWxkKS5sZW5ndGggPT0gMSkge1xuICAgIHJldHVybiBBZ2dyZWdhdGUuVFlQRVMuVFVQTEU7XG4gIH1cblxuICAvLyBXaXRoIHF1YW50aXRhdGl2ZSBzY2FsZXMsIHdlIG9ubHkgY2FyZSBhYm91dCBtaW4vbWF4LlxuICBpZiAoIWlzVW5pcXVlcyhzY2FsZSkpIHJldHVybiBBZ2dyZWdhdGUuVFlQRVMuVkFMVUU7XG5cbiAgLy8gSWYgd2UgZG9uJ3Qgc29ydCwgdGhlbiB3ZSBjYW4gc2VuZCB2YWx1ZXMgZGlyZWN0bHkgdG8gYWdncnMgYXMgd2VsbFxuICBpZiAoIWRlZi5zb3J0KSByZXR1cm4gQWdncmVnYXRlLlRZUEVTLlZBTFVFO1xuXG4gIHJldHVybiBBZ2dyZWdhdGUuVFlQRVMuTVVMVEk7XG59XG5cbmZ1bmN0aW9uIGdldENhY2hlKHdoaWNoLCBkZWYsIHNjYWxlLCBncm91cCkge1xuICB2YXIgcmVmcyA9IGdldFJlZnMoZGVmKSxcbiAgICAgIGF0eXBlID0gYWdnclR5cGUoZGVmLCBzY2FsZSksXG4gICAgICB1bmlxdWVzID0gaXNVbmlxdWVzKHNjYWxlKSxcbiAgICAgIHNvcnQgPSBkZWYuc29ydCxcbiAgICAgIGNrID0gJ18nK3doaWNoLFxuICAgICAgZmllbGRzID0gZ2V0RmllbGRzKHJlZnNbMF0sIGdyb3VwKSxcbiAgICAgIHJlZjtcblxuICBpZiAoc2NhbGVbY2tdKSByZXR1cm4gc2NhbGVbY2tdO1xuXG4gIHZhciBjYWNoZSA9IHNjYWxlW2NrXSA9IG5ldyBBZ2dyZWdhdGUodGhpcy5fZ3JhcGgpLnR5cGUoYXR5cGUpLFxuICAgICAgZ3JvdXBieSwgc3VtbWFyaXplO1xuXG4gIGlmICh1bmlxdWVzKSB7XG4gICAgaWYgKGF0eXBlID09PSBBZ2dyZWdhdGUuVFlQRVMuVkFMVUUpIHtcbiAgICAgIGdyb3VwYnkgPSBbeyBuYW1lOiBEYXRhUmVmLkdST1VQQlksIGdldDogdXRpbC5pZGVudGl0eSB9XTtcbiAgICAgIHN1bW1hcml6ZSA9IHsnKic6IERhdGFSZWYuQ09VTlR9O1xuICAgIH0gZWxzZSBpZiAoYXR5cGUgPT09IEFnZ3JlZ2F0ZS5UWVBFUy5UVVBMRSkge1xuICAgICAgZ3JvdXBieSA9IFt7IG5hbWU6IERhdGFSZWYuR1JPVVBCWSwgZ2V0OiB1dGlsLiQoZmllbGRzWzBdKSB9XTtcbiAgICAgIHN1bW1hcml6ZSA9IHNvcnQgPyBbe1xuICAgICAgICBmaWVsZDogRGF0YVJlZi5WQUxVRSxcbiAgICAgICAgZ2V0OiAgdXRpbC4kKHJlZi5zb3J0IHx8IHNvcnQuZmllbGQpLFxuICAgICAgICBvcHM6IFtzb3J0Lm9wXVxuICAgICAgfV0gOiB7JyonOiBEYXRhUmVmLkNPVU5UfTtcbiAgICB9IGVsc2UgeyAgLy8gYXR5cGUgPT09IEFnZ3JlZ2F0ZS5UWVBFUy5NVUxUSVxuICAgICAgZ3JvdXBieSAgID0gRGF0YVJlZi5HUk9VUEJZO1xuICAgICAgc3VtbWFyaXplID0gW3sgZmllbGQ6IERhdGFSZWYuVkFMVUUsIG9wczogW3NvcnQub3BdIH1dOyBcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZ3JvdXBieSA9IFtdO1xuICAgIHN1bW1hcml6ZSA9IFt7XG4gICAgICBmaWVsZDogRGF0YVJlZi5WQUxVRSxcbiAgICAgIGdldDogKGF0eXBlID09IEFnZ3JlZ2F0ZS5UWVBFUy5UVVBMRSkgPyB1dGlsLiQoZmllbGRzWzBdKSA6IHV0aWwuaWRlbnRpdHksXG4gICAgICBvcHM6IFtEYXRhUmVmLk1JTiwgRGF0YVJlZi5NQVhdLFxuICAgICAgYXM6ICBbRGF0YVJlZi5NSU4sIERhdGFSZWYuTUFYXVxuICAgIH1dO1xuICB9XG5cbiAgY2FjaGUucGFyYW0oJ2dyb3VwYnknLCBncm91cGJ5KVxuICAgIC5wYXJhbSgnc3VtbWFyaXplJywgc3VtbWFyaXplKTtcblxuICByZXR1cm4gY2FjaGU7XG59XG5cbmZ1bmN0aW9uIGRhdGFSZWYod2hpY2gsIGRlZiwgc2NhbGUsIGdyb3VwKSB7XG4gIGlmIChkZWYgPT0gbnVsbCkgeyByZXR1cm4gW107IH1cbiAgaWYgKHV0aWwuaXNBcnJheShkZWYpKSByZXR1cm4gZGVmLm1hcChzaWduYWwuYmluZCh0aGlzKSk7XG5cbiAgdmFyIHNlbGYgPSB0aGlzLCBncmFwaCA9IHRoaXMuX2dyYXBoLFxuICAgICAgcmVmcyA9IGdldFJlZnMoZGVmKSxcbiAgICAgIGF0eXBlID0gYWdnclR5cGUoZGVmLCBzY2FsZSksXG4gICAgICBjYWNoZSA9IGdldENhY2hlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyksXG4gICAgICBzb3J0ICA9IGRlZi5zb3J0LFxuICAgICAgdW5pcXVlcyA9IGlzVW5pcXVlcyhzY2FsZSksXG4gICAgICBpLCBybGVuLCBqLCBmbGVuLCByZWYsIGZpZWxkcywgZmllbGQsIGRhdGEsIGZyb207XG5cbiAgZnVuY3Rpb24gYWRkRGVwKHMpIHtcbiAgICBzZWxmLmRlcGVuZGVuY3koRGVwcy5TSUdOQUxTLCBzKTtcbiAgfVxuXG4gIGZvciAoaT0wLCBybGVuPXJlZnMubGVuZ3RoOyBpPHJsZW47ICsraSkge1xuICAgIHJlZiA9IHJlZnNbaV07XG4gICAgZnJvbSA9IHJlZi5kYXRhIHx8IGdyb3VwLmRhdHVtLl9mYWNldElEO1xuICAgIGRhdGEgPSBncmFwaC5kYXRhKGZyb20pXG4gICAgICAucmV2aXNlcyh0cnVlKVxuICAgICAgLmxhc3QoKTtcblxuICAgIGlmIChkYXRhLnN0YW1wIDw9IHRoaXMuX3N0YW1wKSBjb250aW51ZTtcblxuICAgIGZpZWxkcyA9IGdldEZpZWxkcyhyZWYsIGdyb3VwKTtcbiAgICBmb3IgKGo9MCwgZmxlbj1maWVsZHMubGVuZ3RoOyBqPGZsZW47ICsraikge1xuICAgICAgZmllbGQgPSBmaWVsZHNbal07XG5cbiAgICAgIGlmIChhdHlwZSA9PT0gQWdncmVnYXRlLlRZUEVTLlZBTFVFKSB7XG4gICAgICAgIGNhY2hlLmFjY2Vzc29ycyhudWxsLCBmaWVsZCk7XG4gICAgICB9IGVsc2UgaWYgKGF0eXBlID09PSBBZ2dyZWdhdGUuVFlQRVMuTVVMVEkpIHtcbiAgICAgICAgY2FjaGUuYWNjZXNzb3JzKGZpZWxkLCByZWYuc29ydCB8fCBzb3J0LmZpZWxkKTtcbiAgICAgIH0gLy8gRWxzZSAoVHVwbGUtY2FzZSkgaXMgaGFuZGxlZCBieSB0aGUgYWdncmVnYXRvciBhY2Nlc3NvcnMgYnkgZGVmYXVsdFxuXG4gICAgICBjYWNoZS5ldmFsdWF0ZShkYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLmRlcGVuZGVuY3koRGVwcy5EQVRBLCBmcm9tKTtcbiAgICBjYWNoZS5kZXBlbmRlbmN5KERlcHMuU0lHTkFMUykuZm9yRWFjaChhZGREZXApO1xuICB9XG5cbiAgZGF0YSA9IGNhY2hlLmFnZ3IoKS5yZXN1bHQoKTtcbiAgaWYgKHVuaXF1ZXMpIHtcbiAgICBpZiAoc29ydCkge1xuICAgICAgc29ydCA9IHNvcnQub3JkZXIuc2lnbmFsID8gZ3JhcGguc2lnbmFsUmVmKHNvcnQub3JkZXIuc2lnbmFsKSA6IHNvcnQub3JkZXI7XG4gICAgICBzb3J0ID0gKHNvcnQgPT0gRGF0YVJlZi5ERVNDID8gJy0nIDogJysnKSArIERhdGFSZWYuVkFMVUU7XG4gICAgICBzb3J0ID0gdXRpbC5jb21wYXJhdG9yKHNvcnQpO1xuICAgICAgZGF0YSA9IGRhdGEuc29ydChzb3J0KTtcbiAgICAvLyB9IGVsc2UgeyAgLy8gJ0ZpcnN0IHNlZW4nIG9yZGVyXG4gICAgLy8gICBzb3J0ID0gdXRpbC5jb21wYXJhdG9yKCd0cGwuX2lkJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGEubWFwKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbRGF0YVJlZi5HUk9VUEJZXTsgfSk7XG4gIH0gZWxzZSB7XG4gICAgZGF0YSA9IGRhdGFbMF07XG4gICAgcmV0dXJuICF1dGlsLmlzVmFsaWQoZGF0YSkgPyBbXSA6IFtkYXRhW0RhdGFSZWYuTUlOXSwgZGF0YVtEYXRhUmVmLk1BWF1dO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNpZ25hbCh2KSB7XG4gIGlmICghdiB8fCAhdi5zaWduYWwpIHJldHVybiB2O1xuICB2YXIgcyA9IHYuc2lnbmFsLCByZWY7XG4gIHRoaXMuZGVwZW5kZW5jeShEZXBzLlNJR05BTFMsIChyZWYgPSB1dGlsLmZpZWxkKHMpKVswXSk7XG4gIHJldHVybiB0aGlzLl9ncmFwaC5zaWduYWxSZWYocmVmKTtcbn1cblxuZnVuY3Rpb24gZG9tYWluTWluTWF4KHNjYWxlLCBncm91cCkge1xuICB2YXIgZGVmID0gdGhpcy5fZGVmLFxuICAgICAgZG9tYWluID0gW251bGwsIG51bGxdLCB6O1xuXG4gIGlmIChkZWYuZG9tYWluICE9PSB1bmRlZmluZWQpIHtcbiAgICBkb21haW4gPSAoIXV0aWwuaXNPYmplY3QoZGVmLmRvbWFpbikpID8gZG9tYWluIDpcbiAgICAgIGRhdGFSZWYuY2FsbCh0aGlzLCBEYXRhUmVmLkRPTUFJTiwgZGVmLmRvbWFpbiwgc2NhbGUsIGdyb3VwKTtcbiAgfVxuXG4gIHogPSBkb21haW4ubGVuZ3RoIC0gMTtcbiAgaWYgKGRlZi5kb21haW5NaW4gIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh1dGlsLmlzT2JqZWN0KGRlZi5kb21haW5NaW4pKSB7XG4gICAgICBpZiAoZGVmLmRvbWFpbk1pbi5zaWduYWwpIHtcbiAgICAgICAgZG9tYWluWzBdID0gc2lnbmFsLmNhbGwodGhpcywgZGVmLmRvbWFpbk1pbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb21haW5bMF0gPSBkYXRhUmVmLmNhbGwodGhpcywgRGF0YVJlZi5ET01BSU4rRGF0YVJlZi5NSU4sIGRlZi5kb21haW5NaW4sIHNjYWxlLCBncm91cClbMF07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvbWFpblswXSA9IGRlZi5kb21haW5NaW47XG4gICAgfVxuICB9XG4gIGlmIChkZWYuZG9tYWluTWF4ICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodXRpbC5pc09iamVjdChkZWYuZG9tYWluTWF4KSkge1xuICAgICAgaWYgKGRlZi5kb21haW5NYXguc2lnbmFsKSB7XG4gICAgICAgIGRvbWFpblt6XSA9IHNpZ25hbC5jYWxsKHRoaXMsIGRlZi5kb21haW5NYXgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9tYWluW3pdID0gZGF0YVJlZi5jYWxsKHRoaXMsIERhdGFSZWYuRE9NQUlOK0RhdGFSZWYuTUFYLCBkZWYuZG9tYWluTWF4LCBzY2FsZSwgZ3JvdXApWzFdO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBkb21haW5bel0gPSBkZWYuZG9tYWluTWF4O1xuICAgIH1cbiAgfVxuICBpZiAoZGVmLnR5cGUgIT09IFR5cGVzLkxPRyAmJiBkZWYudHlwZSAhPT0gVHlwZXMuVElNRSAmJiAoZGVmLnplcm8gfHwgZGVmLnplcm89PT11bmRlZmluZWQpKSB7XG4gICAgZG9tYWluWzBdID0gTWF0aC5taW4oMCwgZG9tYWluWzBdKTtcbiAgICBkb21haW5bel0gPSBNYXRoLm1heCgwLCBkb21haW5bel0pO1xuICB9XG4gIHJldHVybiBkb21haW47XG59XG5cbmZ1bmN0aW9uIHJhbmdlKGdyb3VwKSB7XG4gIHZhciBkZWYgPSB0aGlzLl9kZWYsXG4gICAgICBjb25maWcgPSB0aGlzLl9ncmFwaC5jb25maWcoKSxcbiAgICAgIHJhbmdlVmFsID0gc2lnbmFsLmNhbGwodGhpcywgZGVmLnJhbmdlKSxcbiAgICAgIHJuZyA9IFtudWxsLCBudWxsXTtcblxuICBpZiAocmFuZ2VWYWwgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2YgcmFuZ2VWYWwgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAoUHJvcGVydGllc1tyYW5nZVZhbF0pIHtcbiAgICAgICAgcm5nID0gWzAsIGdyb3VwW3JhbmdlVmFsXV07XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5yYW5nZVtyYW5nZVZhbF0pIHtcbiAgICAgICAgcm5nID0gY29uZmlnLnJhbmdlW3JhbmdlVmFsXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvZy5lcnJvcignVW5yZWNvZ2l6ZWQgcmFuZ2U6ICcgKyByYW5nZVZhbCk7XG4gICAgICAgIHJldHVybiBybmc7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh1dGlsLmlzQXJyYXkocmFuZ2VWYWwpKSB7XG4gICAgICBybmcgPSB1dGlsLmR1cGxpY2F0ZShyYW5nZVZhbCkubWFwKHNpZ25hbC5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2UgaWYgKHV0aWwuaXNPYmplY3QocmFuZ2VWYWwpKSB7XG4gICAgICByZXR1cm4gbnVsbDsgLy8gZWFybHkgZXhpdFxuICAgIH0gZWxzZSB7XG4gICAgICBybmcgPSBbMCwgcmFuZ2VWYWxdO1xuICAgIH1cbiAgfVxuICBpZiAoZGVmLnJhbmdlTWluICE9PSB1bmRlZmluZWQpIHtcbiAgICBybmdbMF0gPSBkZWYucmFuZ2VNaW4uc2lnbmFsID9cbiAgICAgIHNpZ25hbC5jYWxsKHRoaXMsIGRlZi5yYW5nZU1pbikgOlxuICAgICAgZGVmLnJhbmdlTWluO1xuICB9XG4gIGlmIChkZWYucmFuZ2VNYXggIT09IHVuZGVmaW5lZCkge1xuICAgIHJuZ1tybmcubGVuZ3RoLTFdID0gZGVmLnJhbmdlTWF4LnNpZ25hbCA/XG4gICAgICBzaWduYWwuY2FsbCh0aGlzLCBkZWYucmFuZ2VNYXgpIDpcbiAgICAgIGRlZi5yYW5nZU1heDtcbiAgfVxuICBcbiAgaWYgKGRlZi5yZXZlcnNlICE9PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgcmV2ID0gc2lnbmFsLmNhbGwodGhpcywgZGVmLnJldmVyc2UpO1xuICAgIGlmICh1dGlsLmlzT2JqZWN0KHJldikpIHtcbiAgICAgIHJldiA9IHV0aWwuYWNjZXNzb3IocmV2LmZpZWxkKShncm91cC5kYXR1bSk7XG4gICAgfVxuICAgIGlmIChyZXYpIHJuZyA9IHJuZy5yZXZlcnNlKCk7XG4gIH1cbiAgXG4gIHJldHVybiBybmc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2NhbGU7Il19
},{"../transforms/Aggregate":110,"datalib/src/util":20,"vega-dataflow/src/ChangeSet":26,"vega-dataflow/src/Dependencies":29,"vega-dataflow/src/Node":31,"vega-logging":41}],106:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    bound = require('vega-scenegraph/src/util/bound'),
    tuple = require('vega-dataflow/src/Tuple'),
    Status = require('./Builder').STATUS;

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

prototype.interpolate = function(item, values) {
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

  if (list === null && item.status === Status.EXIT) {
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
    if (curr.item.status === Status.EXIT) {
      // Only mark item as exited when it is removed.
      curr.item.status = Status.UPDATE;
      curr.remove = true;
    }
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
    bound.item(item);

    if (f === 1) {
      if (curr.remove) {
        item.status = Status.EXIT;
        item.remove();
      }
      prev.next = curr.next;
      curr = prev;
    } else {
      stop = false;
    }
  }

  this.callback();
  return stop;
}

module.exports = Transition;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9zY2VuZS9UcmFuc2l0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgYm91bmQgPSByZXF1aXJlKCd2ZWdhLXNjZW5lZ3JhcGgvc3JjL3V0aWwvYm91bmQnKSxcbiAgICB0dXBsZSA9IHJlcXVpcmUoJ3ZlZ2EtZGF0YWZsb3cvc3JjL1R1cGxlJyksXG4gICAgU3RhdHVzID0gcmVxdWlyZSgnLi9CdWlsZGVyJykuU1RBVFVTO1xuXG5mdW5jdGlvbiBUcmFuc2l0aW9uKGR1cmF0aW9uLCBlYXNlKSB7XG4gIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbiB8fCA1MDA7XG4gIHRoaXMuZWFzZSA9IGVhc2UgJiYgZDMuZWFzZShlYXNlKSB8fCBkMy5lYXNlKFwiY3ViaWMtaW4tb3V0XCIpO1xuICB0aGlzLnVwZGF0ZXMgPSB7bmV4dDogbnVsbH07XG59XG5cbnZhciBwcm90b3R5cGUgPSBUcmFuc2l0aW9uLnByb3RvdHlwZTtcblxudmFyIHNraXAgPSB7XG4gIFwidGV4dFwiOiAxLFxuICBcInVybFwiOiAgMVxufTtcblxucHJvdG90eXBlLmludGVycG9sYXRlID0gZnVuY3Rpb24oaXRlbSwgdmFsdWVzKSB7XG4gIHZhciBrZXksIGN1cnIsIG5leHQsIGludGVycCwgbGlzdCA9IG51bGw7XG5cbiAgZm9yIChrZXkgaW4gdmFsdWVzKSB7XG4gICAgY3VyciA9IGl0ZW1ba2V5XTtcbiAgICBuZXh0ID0gdmFsdWVzW2tleV07ICAgICAgXG4gICAgaWYgKGN1cnIgIT09IG5leHQpIHtcbiAgICAgIGlmIChza2lwW2tleV0gfHwgY3VyciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIHNraXAgaW50ZXJwb2xhdGlvbiBmb3Igc3BlY2lmaWMga2V5cyBvciB1bmRlZmluZWQgc3RhcnQgdmFsdWVzXG4gICAgICAgIHR1cGxlLnNldChpdGVtLCBrZXksIG5leHQpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY3VyciA9PT0gXCJudW1iZXJcIiAmJiAhaXNGaW5pdGUoY3VycikpIHtcbiAgICAgICAgLy8gZm9yIE5hTiBvciBpbmZpbml0ZSBudW1lcmljIHZhbHVlcywgc2tpcCB0byBmaW5hbCB2YWx1ZVxuICAgICAgICB0dXBsZS5zZXQoaXRlbSwga2V5LCBuZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG90aGVyd2lzZSBsb29rdXAgaW50ZXJwb2xhdG9yXG4gICAgICAgIGludGVycCA9IGQzLmludGVycG9sYXRlKGN1cnIsIG5leHQpO1xuICAgICAgICBpbnRlcnAucHJvcGVydHkgPSBrZXk7XG4gICAgICAgIChsaXN0IHx8IChsaXN0PVtdKSkucHVzaChpbnRlcnApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChsaXN0ID09PSBudWxsICYmIGl0ZW0uc3RhdHVzID09PSBTdGF0dXMuRVhJVCkge1xuICAgIGxpc3QgPSBbXTsgLy8gZW5zdXJlIGV4aXRpbmcgaXRlbXMgYXJlIGluY2x1ZGVkXG4gIH1cblxuICBpZiAobGlzdCAhPSBudWxsKSB7XG4gICAgbGlzdC5pdGVtID0gaXRlbTtcbiAgICBsaXN0LmVhc2UgPSBpdGVtLm1hcmsuZWFzZSB8fCB0aGlzLmVhc2U7XG4gICAgbGlzdC5uZXh0ID0gdGhpcy51cGRhdGVzLm5leHQ7XG4gICAgdGhpcy51cGRhdGVzLm5leHQgPSBsaXN0O1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdmFyIHQgPSB0aGlzLCBwcmV2ID0gdC51cGRhdGVzLCBjdXJyID0gcHJldi5uZXh0O1xuICBmb3IgKDsgY3VyciE9bnVsbDsgcHJldj1jdXJyLCBjdXJyPXByZXYubmV4dCkge1xuICAgIGlmIChjdXJyLml0ZW0uc3RhdHVzID09PSBTdGF0dXMuRVhJVCkge1xuICAgICAgLy8gT25seSBtYXJrIGl0ZW0gYXMgZXhpdGVkIHdoZW4gaXQgaXMgcmVtb3ZlZC5cbiAgICAgIGN1cnIuaXRlbS5zdGF0dXMgPSBTdGF0dXMuVVBEQVRFO1xuICAgICAgY3Vyci5yZW1vdmUgPSB0cnVlO1xuICAgIH1cbiAgfVxuICB0LmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gIGQzLnRpbWVyKGZ1bmN0aW9uKGVsYXBzZWQpIHsgcmV0dXJuIHN0ZXAuY2FsbCh0LCBlbGFwc2VkKTsgfSk7XG59O1xuXG5mdW5jdGlvbiBzdGVwKGVsYXBzZWQpIHtcbiAgdmFyIGxpc3QgPSB0aGlzLnVwZGF0ZXMsIHByZXYgPSBsaXN0LCBjdXJyID0gcHJldi5uZXh0LFxuICAgICAgZHVyYXRpb24gPSB0aGlzLmR1cmF0aW9uLFxuICAgICAgaXRlbSwgZGVsYXksIGYsIGUsIGksIG4sIHN0b3AgPSB0cnVlO1xuXG4gIGZvciAoOyBjdXJyIT1udWxsOyBwcmV2PWN1cnIsIGN1cnI9cHJldi5uZXh0KSB7XG4gICAgaXRlbSA9IGN1cnIuaXRlbTtcbiAgICBkZWxheSA9IGl0ZW0uZGVsYXkgfHwgMDtcblxuICAgIGYgPSAoZWxhcHNlZCAtIGRlbGF5KSAvIGR1cmF0aW9uO1xuICAgIGlmIChmIDwgMCkgeyBzdG9wID0gZmFsc2U7IGNvbnRpbnVlOyB9XG4gICAgaWYgKGYgPiAxKSBmID0gMTtcbiAgICBlID0gY3Vyci5lYXNlKGYpO1xuXG4gICAgZm9yIChpPTAsIG49Y3Vyci5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgICBpdGVtW2N1cnJbaV0ucHJvcGVydHldID0gY3VycltpXShlKTtcbiAgICB9XG4gICAgaXRlbS50b3VjaCgpO1xuICAgIGJvdW5kLml0ZW0oaXRlbSk7XG5cbiAgICBpZiAoZiA9PT0gMSkge1xuICAgICAgaWYgKGN1cnIucmVtb3ZlKSB7XG4gICAgICAgIGl0ZW0uc3RhdHVzID0gU3RhdHVzLkVYSVQ7XG4gICAgICAgIGl0ZW0ucmVtb3ZlKCk7XG4gICAgICB9XG4gICAgICBwcmV2Lm5leHQgPSBjdXJyLm5leHQ7XG4gICAgICBjdXJyID0gcHJldjtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RvcCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMuY2FsbGJhY2soKTtcbiAgcmV0dXJuIHN0b3A7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNpdGlvbjsiXX0=
},{"./Builder":102,"vega-dataflow/src/Tuple":34,"vega-scenegraph/src/util/bound":74}],107:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    util = require('datalib/src/util'),
    tpl = require('vega-dataflow/src/Tuple'),
    parseMark = require('../parse/mark');

function axs(model) {
  var scale,
      config = model.config(),
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

  function ingest(d) {
    return {data: d};
  }

  function getTickFormatString() {
    return tickFormatString || (scale.type === 'log' ? ".1s" : null);
  }

  function getTickFormatFn(fmtStr) {
    return (!fmtStr && String) || ((scale.type === 'time') ?
      d3.time.format(fmtStr) : d3.format(fmtStr));
  }
  
  function buildTickFormat() {
    var fmtStr = getTickFormatString();
    
    // D3 v3 has an inconsistent tickFormat API for time scales.
    if (scale.tickFormat) {
      return fmtStr ?
        (scale.tickFormat.length === 2 ?
          scale.tickFormat(tickCount, fmtStr) : getTickFormatFn(fmtStr)) :
        scale.tickFormat(tickCount);
    }

    return getTickFormatFn(fmtStr);
  }
  
  function buildTicks(fmt) {
    var ticks = {
      major: tickValues,
      minor: null
    };
    
    if (ticks.major == null) {
      ticks.major = scale.ticks ?
        scale.ticks(tickCount) : scale.domain();
    }
  
    ticks.minor = vg_axisSubdivide(scale, ticks.major, tickSubdivide)
      .map(ingest);
  
    ticks.major = ticks.major.map(function(d) {
      return (d = ingest(d), d.label = fmt(d.data), d);
    });
    
    return ticks;
  }

  axis.def = function() {
    if(!axisDef.type) axis_def(scale);

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
    util.extend(m.gridLines, vg_axisTicks(config));
    util.extend(m.majorTicks, vg_axisTicks(config));
    util.extend(m.minorTicks, vg_axisTicks(config));
    util.extend(m.tickLabels, vg_axisTickLabels(config));
    util.extend(m.domain, vg_axisDomain(config));
    util.extend(m.title, vg_axisTitle(config));
    m.gridLines.properties.enter.stroke = {value: config.axis.gridColor};
    m.gridLines.properties.enter.strokeOpacity = {value: config.axis.gridOpacity};

    // extend axis marks based on axis orientation
    vg_axisTicksExtend(orient, m.gridLines, oldScale, newScale, Infinity);
    vg_axisTicksExtend(orient, m.majorTicks, oldScale, newScale, tickMajorSize);
    vg_axisTicksExtend(orient, m.minorTicks, oldScale, newScale, tickMinorSize);
    vg_axisLabelExtend(orient, m.tickLabels, oldScale, newScale, tickMajorSize, tickPadding);

    vg_axisDomainExtend(orient, m.domain, range, tickEndSize);
    vg_axisTitleExtend(orient, m.title, range, titleOffset); // TODO get offset
    
    // add / override custom style properties
    util.extend(m.gridLines.properties.update, gridLineStyle);
    util.extend(m.majorTicks.properties.update, majorTickStyle);
    util.extend(m.minorTicks.properties.update, minorTickStyle);
    util.extend(m.tickLabels.properties.update, tickLabelStyle);
    util.extend(m.domain.properties.update, domainStyle);
    util.extend(m.title.properties.update, titleStyle);

    var marks = [m.gridLines, m.majorTicks, m.minorTicks, m.tickLabels, m.domain, m.title];
    util.extend(axisDef, {
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
  }

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
    offset = util.isObject(x) ? x : +x;
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
  
  axis.reset = function() { 
    reset(); 
    return axis; 
  };

  return axis;
}

var vg_axisOrients = {top: 1, right: 1, bottom: 1, left: 1};

function vg_axisSubdivide(scale, ticks, m) {
  var subticks = [];
  if (m && ticks.length > 1) {
    var extent = vg_axisScaleExtent(scale.domain()),
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
  return scale.rangeExtent ?
    scale.rangeExtent() :
    vg_axisScaleExtent(scale.range());
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
    util.extend(labels.properties.enter, {
      x: oldScale,
      y: {value: size},
    });
    util.extend(labels.properties.update, {
      x: newScale,
      y: {value: size},
      align: {value: "center"},
      baseline: {value: vg_axisBaseline[orient]}
    });
  } else {
    util.extend(labels.properties.enter, {
      x: {value: size},
      y: oldScale,
    });
    util.extend(labels.properties.update, {
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
    size = (orient === "top" || orient === "bottom") ?
      {field: {group: "height", level: 2}, mult: -sign} :
      {field: {group: "width",  level: 2}, mult: -sign};
  } else {
    size = {value: sign * size};
  }
  if (orient === "top" || orient === "bottom") {
    util.extend(ticks.properties.enter, {
      x:  oldScale,
      y:  {value: 0},
      y2: size
    });
    util.extend(ticks.properties.update, {
      x:  newScale,
      y:  {value: 0},
      y2: size
    });
    util.extend(ticks.properties.exit, {
      x:  newScale,
    });        
  } else {
    util.extend(ticks.properties.enter, {
      x:  {value: 0},
      x2: size,
      y:  oldScale
    });
    util.extend(ticks.properties.update, {
      x:  {value: 0},
      x2: size,
      y:  newScale
    });
    util.extend(ticks.properties.exit, {
      y:  newScale,
    });
  }
}

function vg_axisTitleExtend(orient, title, range, offset) {
  var mid = ~~((range[0] + range[1]) / 2),
      sign = (orient === "top" || orient === "left") ? -1 : 1;
  
  if (orient === "bottom" || orient === "top") {
    util.extend(title.properties.update, {
      x: {value: mid},
      y: {value: sign*offset},
      angle: {value: 0}
    });
  } else {
    util.extend(title.properties.update, {
      x: {value: sign*offset},
      y: {value: mid},
      angle: {value: orient === "left" ? -90 : 90}
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

  if (util.isArray(offset)) {
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
    if (util.isObject(offset)) {
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
  return true;
}

function vg_axisTicks(config) {
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

function vg_axisTickLabels(config) {
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

function vg_axisTitle(config) {
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

function vg_axisDomain(config) {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9zY2VuZS9heGlzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgICB1dGlsID0gcmVxdWlyZSgnZGF0YWxpYi9zcmMvdXRpbCcpLFxuICAgIHRwbCA9IHJlcXVpcmUoJ3ZlZ2EtZGF0YWZsb3cvc3JjL1R1cGxlJyksXG4gICAgcGFyc2VNYXJrID0gcmVxdWlyZSgnLi4vcGFyc2UvbWFyaycpO1xuXG5mdW5jdGlvbiBheHMobW9kZWwpIHtcbiAgdmFyIHNjYWxlLFxuICAgICAgY29uZmlnID0gbW9kZWwuY29uZmlnKCksXG4gICAgICBvcmllbnQgPSBjb25maWcuYXhpcy5vcmllbnQsXG4gICAgICBvZmZzZXQgPSAwLFxuICAgICAgdGl0bGVPZmZzZXQgPSBjb25maWcuYXhpcy50aXRsZU9mZnNldCxcbiAgICAgIGF4aXNEZWYgPSB7fSxcbiAgICAgIGxheWVyID0gXCJmcm9udFwiLFxuICAgICAgZ3JpZCA9IGZhbHNlLFxuICAgICAgdGl0bGUgPSBudWxsLFxuICAgICAgdGlja01ham9yU2l6ZSA9IGNvbmZpZy5heGlzLnRpY2tTaXplLFxuICAgICAgdGlja01pbm9yU2l6ZSA9IGNvbmZpZy5heGlzLnRpY2tTaXplLFxuICAgICAgdGlja0VuZFNpemUgPSBjb25maWcuYXhpcy50aWNrU2l6ZSxcbiAgICAgIHRpY2tQYWRkaW5nID0gY29uZmlnLmF4aXMucGFkZGluZyxcbiAgICAgIHRpY2tWYWx1ZXMgPSBudWxsLFxuICAgICAgdGlja0Zvcm1hdFN0cmluZyA9IG51bGwsXG4gICAgICB0aWNrU3ViZGl2aWRlID0gMCxcbiAgICAgIHRpY2tDb3VudCA9IGNvbmZpZy5heGlzLnRpY2tzLFxuICAgICAgZ3JpZExpbmVTdHlsZSA9IHt9LFxuICAgICAgdGlja0xhYmVsU3R5bGUgPSB7fSxcbiAgICAgIG1ham9yVGlja1N0eWxlID0ge30sXG4gICAgICBtaW5vclRpY2tTdHlsZSA9IHt9LFxuICAgICAgdGl0bGVTdHlsZSA9IHt9LFxuICAgICAgZG9tYWluU3R5bGUgPSB7fSxcbiAgICAgIG0gPSB7IC8vIEF4aXMgbWFya3MgYXMgcmVmZXJlbmNlcyBmb3IgdXBkYXRlc1xuICAgICAgICBncmlkTGluZXM6ICB7fSxcbiAgICAgICAgbWFqb3JUaWNrczoge30sXG4gICAgICAgIG1pbm9yVGlja3M6IHt9LFxuICAgICAgICB0aWNrTGFiZWxzOiB7fSxcbiAgICAgICAgZG9tYWluOiB7fSxcbiAgICAgICAgdGl0bGU6ICB7fVxuICAgICAgfTtcblxuICB2YXIgYXhpcyA9IHt9O1xuXG4gIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgIGF4aXNEZWYudHlwZSA9IG51bGw7XG4gIH1cblxuICBmdW5jdGlvbiBpbmdlc3QoZCkge1xuICAgIHJldHVybiB7ZGF0YTogZH07XG4gIH1cblxuICBmdW5jdGlvbiBnZXRUaWNrRm9ybWF0U3RyaW5nKCkge1xuICAgIHJldHVybiB0aWNrRm9ybWF0U3RyaW5nIHx8IChzY2FsZS50eXBlID09PSAnbG9nJyA/IFwiLjFzXCIgOiBudWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFRpY2tGb3JtYXRGbihmbXRTdHIpIHtcbiAgICByZXR1cm4gKCFmbXRTdHIgJiYgU3RyaW5nKSB8fCAoKHNjYWxlLnR5cGUgPT09ICd0aW1lJykgP1xuICAgICAgZDMudGltZS5mb3JtYXQoZm10U3RyKSA6IGQzLmZvcm1hdChmbXRTdHIpKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gYnVpbGRUaWNrRm9ybWF0KCkge1xuICAgIHZhciBmbXRTdHIgPSBnZXRUaWNrRm9ybWF0U3RyaW5nKCk7XG4gICAgXG4gICAgLy8gRDMgdjMgaGFzIGFuIGluY29uc2lzdGVudCB0aWNrRm9ybWF0IEFQSSBmb3IgdGltZSBzY2FsZXMuXG4gICAgaWYgKHNjYWxlLnRpY2tGb3JtYXQpIHtcbiAgICAgIHJldHVybiBmbXRTdHIgP1xuICAgICAgICAoc2NhbGUudGlja0Zvcm1hdC5sZW5ndGggPT09IDIgP1xuICAgICAgICAgIHNjYWxlLnRpY2tGb3JtYXQodGlja0NvdW50LCBmbXRTdHIpIDogZ2V0VGlja0Zvcm1hdEZuKGZtdFN0cikpIDpcbiAgICAgICAgc2NhbGUudGlja0Zvcm1hdCh0aWNrQ291bnQpO1xuICAgIH1cblxuICAgIHJldHVybiBnZXRUaWNrRm9ybWF0Rm4oZm10U3RyKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gYnVpbGRUaWNrcyhmbXQpIHtcbiAgICB2YXIgdGlja3MgPSB7XG4gICAgICBtYWpvcjogdGlja1ZhbHVlcyxcbiAgICAgIG1pbm9yOiBudWxsXG4gICAgfTtcbiAgICBcbiAgICBpZiAodGlja3MubWFqb3IgPT0gbnVsbCkge1xuICAgICAgdGlja3MubWFqb3IgPSBzY2FsZS50aWNrcyA/XG4gICAgICAgIHNjYWxlLnRpY2tzKHRpY2tDb3VudCkgOiBzY2FsZS5kb21haW4oKTtcbiAgICB9XG4gIFxuICAgIHRpY2tzLm1pbm9yID0gdmdfYXhpc1N1YmRpdmlkZShzY2FsZSwgdGlja3MubWFqb3IsIHRpY2tTdWJkaXZpZGUpXG4gICAgICAubWFwKGluZ2VzdCk7XG4gIFxuICAgIHRpY2tzLm1ham9yID0gdGlja3MubWFqb3IubWFwKGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiAoZCA9IGluZ2VzdChkKSwgZC5sYWJlbCA9IGZtdChkLmRhdGEpLCBkKTtcbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4gdGlja3M7XG4gIH1cblxuICBheGlzLmRlZiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmKCFheGlzRGVmLnR5cGUpIGF4aXNfZGVmKHNjYWxlKTtcblxuICAgIHZhciBmbXQgPSBidWlsZFRpY2tGb3JtYXQoKTtcbiAgICB2YXIgdGlja3MgPSBidWlsZFRpY2tzKGZtdCk7XG4gICAgdmFyIHRkYXRhID0gdGl0bGUgPyBbdGl0bGVdLm1hcChpbmdlc3QpIDogW107XG5cbiAgICBheGlzRGVmLm1hcmtzWzBdLmZyb20gPSBmdW5jdGlvbigpIHsgcmV0dXJuIGdyaWQgPyB0aWNrcy5tYWpvciA6IFtdOyB9O1xuICAgIGF4aXNEZWYubWFya3NbMV0uZnJvbSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGlja3MubWFqb3I7IH07XG4gICAgYXhpc0RlZi5tYXJrc1syXS5mcm9tID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aWNrcy5taW5vcjsgfTtcbiAgICBheGlzRGVmLm1hcmtzWzNdLmZyb20gPSBheGlzRGVmLm1hcmtzWzFdLmZyb207XG4gICAgYXhpc0RlZi5tYXJrc1s0XS5mcm9tID0gZnVuY3Rpb24oKSB7IHJldHVybiBbMV07IH07XG4gICAgYXhpc0RlZi5tYXJrc1s1XS5mcm9tID0gZnVuY3Rpb24oKSB7IHJldHVybiB0ZGF0YTsgfTtcbiAgICBheGlzRGVmLm9mZnNldCA9IG9mZnNldDtcbiAgICBheGlzRGVmLm9yaWVudCA9IG9yaWVudDtcbiAgICBheGlzRGVmLmxheWVyID0gbGF5ZXI7XG4gICAgcmV0dXJuIGF4aXNEZWY7XG4gIH07XG5cbiAgZnVuY3Rpb24gYXhpc19kZWYoc2NhbGUpIHtcbiAgICAvLyBzZXR1cCBzY2FsZSBtYXBwaW5nXG4gICAgdmFyIG5ld1NjYWxlLCBvbGRTY2FsZSwgcmFuZ2U7XG4gICAgaWYgKHNjYWxlLnR5cGUgPT09IFwib3JkaW5hbFwiKSB7XG4gICAgICBuZXdTY2FsZSA9IHtzY2FsZTogc2NhbGUuc2NhbGVOYW1lLCBvZmZzZXQ6IDAuNSArIHNjYWxlLnJhbmdlQmFuZCgpLzJ9O1xuICAgICAgb2xkU2NhbGUgPSBuZXdTY2FsZTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3U2NhbGUgPSB7c2NhbGU6IHNjYWxlLnNjYWxlTmFtZSwgb2Zmc2V0OiAwLjV9O1xuICAgICAgb2xkU2NhbGUgPSB7c2NhbGU6IHNjYWxlLnNjYWxlTmFtZStcIjpwcmV2XCIsIG9mZnNldDogMC41fTtcbiAgICB9XG4gICAgcmFuZ2UgPSB2Z19heGlzU2NhbGVSYW5nZShzY2FsZSk7XG5cbiAgICAvLyBzZXR1cCBheGlzIG1hcmtzXG4gICAgdXRpbC5leHRlbmQobS5ncmlkTGluZXMsIHZnX2F4aXNUaWNrcyhjb25maWcpKTtcbiAgICB1dGlsLmV4dGVuZChtLm1ham9yVGlja3MsIHZnX2F4aXNUaWNrcyhjb25maWcpKTtcbiAgICB1dGlsLmV4dGVuZChtLm1pbm9yVGlja3MsIHZnX2F4aXNUaWNrcyhjb25maWcpKTtcbiAgICB1dGlsLmV4dGVuZChtLnRpY2tMYWJlbHMsIHZnX2F4aXNUaWNrTGFiZWxzKGNvbmZpZykpO1xuICAgIHV0aWwuZXh0ZW5kKG0uZG9tYWluLCB2Z19heGlzRG9tYWluKGNvbmZpZykpO1xuICAgIHV0aWwuZXh0ZW5kKG0udGl0bGUsIHZnX2F4aXNUaXRsZShjb25maWcpKTtcbiAgICBtLmdyaWRMaW5lcy5wcm9wZXJ0aWVzLmVudGVyLnN0cm9rZSA9IHt2YWx1ZTogY29uZmlnLmF4aXMuZ3JpZENvbG9yfTtcbiAgICBtLmdyaWRMaW5lcy5wcm9wZXJ0aWVzLmVudGVyLnN0cm9rZU9wYWNpdHkgPSB7dmFsdWU6IGNvbmZpZy5heGlzLmdyaWRPcGFjaXR5fTtcblxuICAgIC8vIGV4dGVuZCBheGlzIG1hcmtzIGJhc2VkIG9uIGF4aXMgb3JpZW50YXRpb25cbiAgICB2Z19heGlzVGlja3NFeHRlbmQob3JpZW50LCBtLmdyaWRMaW5lcywgb2xkU2NhbGUsIG5ld1NjYWxlLCBJbmZpbml0eSk7XG4gICAgdmdfYXhpc1RpY2tzRXh0ZW5kKG9yaWVudCwgbS5tYWpvclRpY2tzLCBvbGRTY2FsZSwgbmV3U2NhbGUsIHRpY2tNYWpvclNpemUpO1xuICAgIHZnX2F4aXNUaWNrc0V4dGVuZChvcmllbnQsIG0ubWlub3JUaWNrcywgb2xkU2NhbGUsIG5ld1NjYWxlLCB0aWNrTWlub3JTaXplKTtcbiAgICB2Z19heGlzTGFiZWxFeHRlbmQob3JpZW50LCBtLnRpY2tMYWJlbHMsIG9sZFNjYWxlLCBuZXdTY2FsZSwgdGlja01ham9yU2l6ZSwgdGlja1BhZGRpbmcpO1xuXG4gICAgdmdfYXhpc0RvbWFpbkV4dGVuZChvcmllbnQsIG0uZG9tYWluLCByYW5nZSwgdGlja0VuZFNpemUpO1xuICAgIHZnX2F4aXNUaXRsZUV4dGVuZChvcmllbnQsIG0udGl0bGUsIHJhbmdlLCB0aXRsZU9mZnNldCk7IC8vIFRPRE8gZ2V0IG9mZnNldFxuICAgIFxuICAgIC8vIGFkZCAvIG92ZXJyaWRlIGN1c3RvbSBzdHlsZSBwcm9wZXJ0aWVzXG4gICAgdXRpbC5leHRlbmQobS5ncmlkTGluZXMucHJvcGVydGllcy51cGRhdGUsIGdyaWRMaW5lU3R5bGUpO1xuICAgIHV0aWwuZXh0ZW5kKG0ubWFqb3JUaWNrcy5wcm9wZXJ0aWVzLnVwZGF0ZSwgbWFqb3JUaWNrU3R5bGUpO1xuICAgIHV0aWwuZXh0ZW5kKG0ubWlub3JUaWNrcy5wcm9wZXJ0aWVzLnVwZGF0ZSwgbWlub3JUaWNrU3R5bGUpO1xuICAgIHV0aWwuZXh0ZW5kKG0udGlja0xhYmVscy5wcm9wZXJ0aWVzLnVwZGF0ZSwgdGlja0xhYmVsU3R5bGUpO1xuICAgIHV0aWwuZXh0ZW5kKG0uZG9tYWluLnByb3BlcnRpZXMudXBkYXRlLCBkb21haW5TdHlsZSk7XG4gICAgdXRpbC5leHRlbmQobS50aXRsZS5wcm9wZXJ0aWVzLnVwZGF0ZSwgdGl0bGVTdHlsZSk7XG5cbiAgICB2YXIgbWFya3MgPSBbbS5ncmlkTGluZXMsIG0ubWFqb3JUaWNrcywgbS5taW5vclRpY2tzLCBtLnRpY2tMYWJlbHMsIG0uZG9tYWluLCBtLnRpdGxlXTtcbiAgICB1dGlsLmV4dGVuZChheGlzRGVmLCB7XG4gICAgICB0eXBlOiBcImdyb3VwXCIsXG4gICAgICBpbnRlcmFjdGl2ZTogZmFsc2UsXG4gICAgICBwcm9wZXJ0aWVzOiB7IFxuICAgICAgICBlbnRlcjoge1xuICAgICAgICAgIGVuY29kZTogdmdfYXhpc1VwZGF0ZSxcbiAgICAgICAgICBzY2FsZXM6IFtzY2FsZS5zY2FsZU5hbWVdLFxuICAgICAgICAgIHNpZ25hbHM6IFtdLCBkYXRhOiBbXVxuICAgICAgICB9LFxuICAgICAgICB1cGRhdGU6IHtcbiAgICAgICAgICBlbmNvZGU6IHZnX2F4aXNVcGRhdGUsXG4gICAgICAgICAgc2NhbGVzOiBbc2NhbGUuc2NhbGVOYW1lXSxcbiAgICAgICAgICBzaWduYWxzOiBbXSwgZGF0YTogW11cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXhpc0RlZi5tYXJrcyA9IG1hcmtzLm1hcChmdW5jdGlvbihtKSB7IHJldHVybiBwYXJzZU1hcmsobW9kZWwsIG0pOyB9KTtcbiAgfVxuXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc2NhbGU7XG4gICAgaWYgKHNjYWxlICE9PSB4KSB7IHNjYWxlID0geDsgcmVzZXQoKTsgfVxuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMub3JpZW50ID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIG9yaWVudDtcbiAgICBpZiAob3JpZW50ICE9PSB4KSB7XG4gICAgICBvcmllbnQgPSB4IGluIHZnX2F4aXNPcmllbnRzID8geCArIFwiXCIgOiBjb25maWcuYXhpcy5vcmllbnQ7XG4gICAgICByZXNldCgpO1xuICAgIH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLnRpdGxlID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRpdGxlO1xuICAgIGlmICh0aXRsZSAhPT0geCkgeyB0aXRsZSA9IHg7IHJlc2V0KCk7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLnRpY2tDb3VudCA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aWNrQ291bnQ7XG4gICAgdGlja0NvdW50ID0geDtcbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLnRpY2tWYWx1ZXMgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja1ZhbHVlcztcbiAgICB0aWNrVmFsdWVzID0geDtcbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLnRpY2tGb3JtYXQgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja0Zvcm1hdFN0cmluZztcbiAgICBpZiAodGlja0Zvcm1hdFN0cmluZyAhPT0geCkge1xuICAgICAgdGlja0Zvcm1hdFN0cmluZyA9IHg7XG4gICAgICByZXNldCgpO1xuICAgIH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcbiAgXG4gIGF4aXMudGlja1NpemUgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja01ham9yU2l6ZTtcbiAgICB2YXIgbiA9IGFyZ3VtZW50cy5sZW5ndGggLSAxLFxuICAgICAgICBtYWpvciA9ICt4LFxuICAgICAgICBtaW5vciA9IG4gPiAxID8gK3kgOiB0aWNrTWFqb3JTaXplLFxuICAgICAgICBlbmQgICA9IG4gPiAwID8gK2FyZ3VtZW50c1tuXSA6IHRpY2tNYWpvclNpemU7XG5cbiAgICBpZiAodGlja01ham9yU2l6ZSAhPT0gbWFqb3IgfHxcbiAgICAgICAgdGlja01pbm9yU2l6ZSAhPT0gbWlub3IgfHxcbiAgICAgICAgdGlja0VuZFNpemUgIT09IGVuZCkge1xuICAgICAgcmVzZXQoKTtcbiAgICB9XG5cbiAgICB0aWNrTWFqb3JTaXplID0gbWFqb3I7XG4gICAgdGlja01pbm9yU2l6ZSA9IG1pbm9yO1xuICAgIHRpY2tFbmRTaXplID0gZW5kO1xuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMudGlja1N1YmRpdmlkZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aWNrU3ViZGl2aWRlO1xuICAgIHRpY2tTdWJkaXZpZGUgPSAreDtcbiAgICByZXR1cm4gYXhpcztcbiAgfTtcbiAgXG4gIGF4aXMub2Zmc2V0ID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIG9mZnNldDtcbiAgICBvZmZzZXQgPSB1dGlsLmlzT2JqZWN0KHgpID8geCA6ICt4O1xuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMudGlja1BhZGRpbmcgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGlja1BhZGRpbmc7XG4gICAgaWYgKHRpY2tQYWRkaW5nICE9PSAreCkgeyB0aWNrUGFkZGluZyA9ICt4OyByZXNldCgpOyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy50aXRsZU9mZnNldCA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aXRsZU9mZnNldDtcbiAgICBpZiAodGl0bGVPZmZzZXQgIT09ICt4KSB7IHRpdGxlT2Zmc2V0ID0gK3g7IHJlc2V0KCk7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLmxheWVyID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGxheWVyO1xuICAgIGlmIChsYXllciAhPT0geCkgeyBsYXllciA9IHg7IHJlc2V0KCk7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLmdyaWQgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZ3JpZDtcbiAgICBpZiAoZ3JpZCAhPT0geCkgeyBncmlkID0geDsgcmVzZXQoKTsgfVxuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMuZ3JpZExpbmVQcm9wZXJ0aWVzID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGdyaWRMaW5lU3R5bGU7XG4gICAgaWYgKGdyaWRMaW5lU3R5bGUgIT09IHgpIHsgZ3JpZExpbmVTdHlsZSA9IHg7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLm1ham9yVGlja1Byb3BlcnRpZXMgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gbWFqb3JUaWNrU3R5bGU7XG4gICAgaWYgKG1ham9yVGlja1N0eWxlICE9PSB4KSB7IG1ham9yVGlja1N0eWxlID0geDsgfVxuICAgIHJldHVybiBheGlzO1xuICB9O1xuXG4gIGF4aXMubWlub3JUaWNrUHJvcGVydGllcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBtaW5vclRpY2tTdHlsZTtcbiAgICBpZiAobWlub3JUaWNrU3R5bGUgIT09IHgpIHsgbWlub3JUaWNrU3R5bGUgPSB4OyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy50aWNrTGFiZWxQcm9wZXJ0aWVzID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRpY2tMYWJlbFN0eWxlO1xuICAgIGlmICh0aWNrTGFiZWxTdHlsZSAhPT0geCkgeyB0aWNrTGFiZWxTdHlsZSA9IHg7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcblxuICBheGlzLnRpdGxlUHJvcGVydGllcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aXRsZVN0eWxlO1xuICAgIGlmICh0aXRsZVN0eWxlICE9PSB4KSB7IHRpdGxlU3R5bGUgPSB4OyB9XG4gICAgcmV0dXJuIGF4aXM7XG4gIH07XG5cbiAgYXhpcy5kb21haW5Qcm9wZXJ0aWVzID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGRvbWFpblN0eWxlO1xuICAgIGlmIChkb21haW5TdHlsZSAhPT0geCkgeyBkb21haW5TdHlsZSA9IHg7IH1cbiAgICByZXR1cm4gYXhpcztcbiAgfTtcbiAgXG4gIGF4aXMucmVzZXQgPSBmdW5jdGlvbigpIHsgXG4gICAgcmVzZXQoKTsgXG4gICAgcmV0dXJuIGF4aXM7IFxuICB9O1xuXG4gIHJldHVybiBheGlzO1xufVxuXG52YXIgdmdfYXhpc09yaWVudHMgPSB7dG9wOiAxLCByaWdodDogMSwgYm90dG9tOiAxLCBsZWZ0OiAxfTtcblxuZnVuY3Rpb24gdmdfYXhpc1N1YmRpdmlkZShzY2FsZSwgdGlja3MsIG0pIHtcbiAgdmFyIHN1YnRpY2tzID0gW107XG4gIGlmIChtICYmIHRpY2tzLmxlbmd0aCA+IDEpIHtcbiAgICB2YXIgZXh0ZW50ID0gdmdfYXhpc1NjYWxlRXh0ZW50KHNjYWxlLmRvbWFpbigpKSxcbiAgICAgICAgaSA9IC0xLFxuICAgICAgICBuID0gdGlja3MubGVuZ3RoLFxuICAgICAgICBkID0gKHRpY2tzWzFdIC0gdGlja3NbMF0pIC8gKyttLFxuICAgICAgICBqLFxuICAgICAgICB2O1xuICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICBmb3IgKGogPSBtOyAtLWogPiAwOykge1xuICAgICAgICBpZiAoKHYgPSArdGlja3NbaV0gLSBqICogZCkgPj0gZXh0ZW50WzBdKSB7XG4gICAgICAgICAgc3VidGlja3MucHVzaCh2KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKC0taSwgaiA9IDA7ICsraiA8IG0gJiYgKHYgPSArdGlja3NbaV0gKyBqICogZCkgPCBleHRlbnRbMV07KSB7XG4gICAgICBzdWJ0aWNrcy5wdXNoKHYpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3VidGlja3M7XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNTY2FsZUV4dGVudChkb21haW4pIHtcbiAgdmFyIHN0YXJ0ID0gZG9tYWluWzBdLCBzdG9wID0gZG9tYWluW2RvbWFpbi5sZW5ndGggLSAxXTtcbiAgcmV0dXJuIHN0YXJ0IDwgc3RvcCA/IFtzdGFydCwgc3RvcF0gOiBbc3RvcCwgc3RhcnRdO1xufVxuXG5mdW5jdGlvbiB2Z19heGlzU2NhbGVSYW5nZShzY2FsZSkge1xuICByZXR1cm4gc2NhbGUucmFuZ2VFeHRlbnQgP1xuICAgIHNjYWxlLnJhbmdlRXh0ZW50KCkgOlxuICAgIHZnX2F4aXNTY2FsZUV4dGVudChzY2FsZS5yYW5nZSgpKTtcbn1cblxudmFyIHZnX2F4aXNBbGlnbiA9IHtcbiAgYm90dG9tOiBcImNlbnRlclwiLFxuICB0b3A6IFwiY2VudGVyXCIsXG4gIGxlZnQ6IFwicmlnaHRcIixcbiAgcmlnaHQ6IFwibGVmdFwiXG59O1xuXG52YXIgdmdfYXhpc0Jhc2VsaW5lID0ge1xuICBib3R0b206IFwidG9wXCIsXG4gIHRvcDogXCJib3R0b21cIixcbiAgbGVmdDogXCJtaWRkbGVcIixcbiAgcmlnaHQ6IFwibWlkZGxlXCJcbn07XG5cbmZ1bmN0aW9uIHZnX2F4aXNMYWJlbEV4dGVuZChvcmllbnQsIGxhYmVscywgb2xkU2NhbGUsIG5ld1NjYWxlLCBzaXplLCBwYWQpIHtcbiAgc2l6ZSA9IE1hdGgubWF4KHNpemUsIDApICsgcGFkO1xuICBpZiAob3JpZW50ID09PSBcImxlZnRcIiB8fCBvcmllbnQgPT09IFwidG9wXCIpIHtcbiAgICBzaXplICo9IC0xO1xuICB9ICBcbiAgaWYgKG9yaWVudCA9PT0gXCJ0b3BcIiB8fCBvcmllbnQgPT09IFwiYm90dG9tXCIpIHtcbiAgICB1dGlsLmV4dGVuZChsYWJlbHMucHJvcGVydGllcy5lbnRlciwge1xuICAgICAgeDogb2xkU2NhbGUsXG4gICAgICB5OiB7dmFsdWU6IHNpemV9LFxuICAgIH0pO1xuICAgIHV0aWwuZXh0ZW5kKGxhYmVscy5wcm9wZXJ0aWVzLnVwZGF0ZSwge1xuICAgICAgeDogbmV3U2NhbGUsXG4gICAgICB5OiB7dmFsdWU6IHNpemV9LFxuICAgICAgYWxpZ246IHt2YWx1ZTogXCJjZW50ZXJcIn0sXG4gICAgICBiYXNlbGluZToge3ZhbHVlOiB2Z19heGlzQmFzZWxpbmVbb3JpZW50XX1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICB1dGlsLmV4dGVuZChsYWJlbHMucHJvcGVydGllcy5lbnRlciwge1xuICAgICAgeDoge3ZhbHVlOiBzaXplfSxcbiAgICAgIHk6IG9sZFNjYWxlLFxuICAgIH0pO1xuICAgIHV0aWwuZXh0ZW5kKGxhYmVscy5wcm9wZXJ0aWVzLnVwZGF0ZSwge1xuICAgICAgeDoge3ZhbHVlOiBzaXplfSxcbiAgICAgIHk6IG5ld1NjYWxlLFxuICAgICAgYWxpZ246IHt2YWx1ZTogdmdfYXhpc0FsaWduW29yaWVudF19LFxuICAgICAgYmFzZWxpbmU6IHt2YWx1ZTogXCJtaWRkbGVcIn1cbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2Z19heGlzVGlja3NFeHRlbmQob3JpZW50LCB0aWNrcywgb2xkU2NhbGUsIG5ld1NjYWxlLCBzaXplKSB7XG4gIHZhciBzaWduID0gKG9yaWVudCA9PT0gXCJsZWZ0XCIgfHwgb3JpZW50ID09PSBcInRvcFwiKSA/IC0xIDogMTtcbiAgaWYgKHNpemUgPT09IEluZmluaXR5KSB7XG4gICAgc2l6ZSA9IChvcmllbnQgPT09IFwidG9wXCIgfHwgb3JpZW50ID09PSBcImJvdHRvbVwiKSA/XG4gICAgICB7ZmllbGQ6IHtncm91cDogXCJoZWlnaHRcIiwgbGV2ZWw6IDJ9LCBtdWx0OiAtc2lnbn0gOlxuICAgICAge2ZpZWxkOiB7Z3JvdXA6IFwid2lkdGhcIiwgIGxldmVsOiAyfSwgbXVsdDogLXNpZ259O1xuICB9IGVsc2Uge1xuICAgIHNpemUgPSB7dmFsdWU6IHNpZ24gKiBzaXplfTtcbiAgfVxuICBpZiAob3JpZW50ID09PSBcInRvcFwiIHx8IG9yaWVudCA9PT0gXCJib3R0b21cIikge1xuICAgIHV0aWwuZXh0ZW5kKHRpY2tzLnByb3BlcnRpZXMuZW50ZXIsIHtcbiAgICAgIHg6ICBvbGRTY2FsZSxcbiAgICAgIHk6ICB7dmFsdWU6IDB9LFxuICAgICAgeTI6IHNpemVcbiAgICB9KTtcbiAgICB1dGlsLmV4dGVuZCh0aWNrcy5wcm9wZXJ0aWVzLnVwZGF0ZSwge1xuICAgICAgeDogIG5ld1NjYWxlLFxuICAgICAgeTogIHt2YWx1ZTogMH0sXG4gICAgICB5Mjogc2l6ZVxuICAgIH0pO1xuICAgIHV0aWwuZXh0ZW5kKHRpY2tzLnByb3BlcnRpZXMuZXhpdCwge1xuICAgICAgeDogIG5ld1NjYWxlLFxuICAgIH0pOyAgICAgICAgXG4gIH0gZWxzZSB7XG4gICAgdXRpbC5leHRlbmQodGlja3MucHJvcGVydGllcy5lbnRlciwge1xuICAgICAgeDogIHt2YWx1ZTogMH0sXG4gICAgICB4Mjogc2l6ZSxcbiAgICAgIHk6ICBvbGRTY2FsZVxuICAgIH0pO1xuICAgIHV0aWwuZXh0ZW5kKHRpY2tzLnByb3BlcnRpZXMudXBkYXRlLCB7XG4gICAgICB4OiAge3ZhbHVlOiAwfSxcbiAgICAgIHgyOiBzaXplLFxuICAgICAgeTogIG5ld1NjYWxlXG4gICAgfSk7XG4gICAgdXRpbC5leHRlbmQodGlja3MucHJvcGVydGllcy5leGl0LCB7XG4gICAgICB5OiAgbmV3U2NhbGUsXG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmdfYXhpc1RpdGxlRXh0ZW5kKG9yaWVudCwgdGl0bGUsIHJhbmdlLCBvZmZzZXQpIHtcbiAgdmFyIG1pZCA9IH5+KChyYW5nZVswXSArIHJhbmdlWzFdKSAvIDIpLFxuICAgICAgc2lnbiA9IChvcmllbnQgPT09IFwidG9wXCIgfHwgb3JpZW50ID09PSBcImxlZnRcIikgPyAtMSA6IDE7XG4gIFxuICBpZiAob3JpZW50ID09PSBcImJvdHRvbVwiIHx8IG9yaWVudCA9PT0gXCJ0b3BcIikge1xuICAgIHV0aWwuZXh0ZW5kKHRpdGxlLnByb3BlcnRpZXMudXBkYXRlLCB7XG4gICAgICB4OiB7dmFsdWU6IG1pZH0sXG4gICAgICB5OiB7dmFsdWU6IHNpZ24qb2Zmc2V0fSxcbiAgICAgIGFuZ2xlOiB7dmFsdWU6IDB9XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgdXRpbC5leHRlbmQodGl0bGUucHJvcGVydGllcy51cGRhdGUsIHtcbiAgICAgIHg6IHt2YWx1ZTogc2lnbipvZmZzZXR9LFxuICAgICAgeToge3ZhbHVlOiBtaWR9LFxuICAgICAgYW5nbGU6IHt2YWx1ZTogb3JpZW50ID09PSBcImxlZnRcIiA/IC05MCA6IDkwfVxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNEb21haW5FeHRlbmQob3JpZW50LCBkb21haW4sIHJhbmdlLCBzaXplKSB7XG4gIHZhciBwYXRoO1xuICBpZiAob3JpZW50ID09PSBcInRvcFwiIHx8IG9yaWVudCA9PT0gXCJsZWZ0XCIpIHtcbiAgICBzaXplID0gLTEgKiBzaXplO1xuICB9XG4gIGlmIChvcmllbnQgPT09IFwiYm90dG9tXCIgfHwgb3JpZW50ID09PSBcInRvcFwiKSB7XG4gICAgcGF0aCA9IFwiTVwiICsgcmFuZ2VbMF0gKyBcIixcIiArIHNpemUgKyBcIlYwSFwiICsgcmFuZ2VbMV0gKyBcIlZcIiArIHNpemU7XG4gIH0gZWxzZSB7XG4gICAgcGF0aCA9IFwiTVwiICsgc2l6ZSArIFwiLFwiICsgcmFuZ2VbMF0gKyBcIkgwVlwiICsgcmFuZ2VbMV0gKyBcIkhcIiArIHNpemU7XG4gIH1cbiAgZG9tYWluLnByb3BlcnRpZXMudXBkYXRlLnBhdGggPSB7dmFsdWU6IHBhdGh9O1xufVxuXG5mdW5jdGlvbiB2Z19heGlzVXBkYXRlKGl0ZW0sIGdyb3VwLCB0cmFucykge1xuICB2YXIgbyA9IHRyYW5zID8ge30gOiBpdGVtLFxuICAgICAgb2Zmc2V0ID0gaXRlbS5tYXJrLmRlZi5vZmZzZXQsXG4gICAgICBvcmllbnQgPSBpdGVtLm1hcmsuZGVmLm9yaWVudCxcbiAgICAgIHdpZHRoICA9IGdyb3VwLndpZHRoLFxuICAgICAgaGVpZ2h0ID0gZ3JvdXAuaGVpZ2h0OyAvLyBUT0RPIGZhbGxiYWNrIHRvIGdsb2JhbCB3LGg/XG5cbiAgaWYgKHV0aWwuaXNBcnJheShvZmZzZXQpKSB7XG4gICAgdmFyIG9meCA9IG9mZnNldFswXSxcbiAgICAgICAgb2Z5ID0gb2Zmc2V0WzFdO1xuXG4gICAgc3dpdGNoIChvcmllbnQpIHtcbiAgICAgIGNhc2UgXCJsZWZ0XCI6ICAgeyB0cGwuc2V0KG8sICd4JywgLW9meCk7IHRwbC5zZXQobywgJ3knLCBvZnkpOyBicmVhazsgfVxuICAgICAgY2FzZSBcInJpZ2h0XCI6ICB7IHRwbC5zZXQobywgJ3gnLCB3aWR0aCArIG9meCk7IHRwbC5zZXQobywgJ3knLCBvZnkpOyBicmVhazsgfVxuICAgICAgY2FzZSBcImJvdHRvbVwiOiB7IHRwbC5zZXQobywgJ3gnLCBvZngpOyB0cGwuc2V0KG8sICd5JywgaGVpZ2h0ICsgb2Z5KTsgYnJlYWs7IH1cbiAgICAgIGNhc2UgXCJ0b3BcIjogICAgeyB0cGwuc2V0KG8sICd4Jywgb2Z4KTsgdHBsLnNldChvLCAneScsIC1vZnkpOyBicmVhazsgfVxuICAgICAgZGVmYXVsdDogICAgICAgeyB0cGwuc2V0KG8sICd4Jywgb2Z4KTsgdHBsLnNldChvLCAneScsIG9meSk7IH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKHV0aWwuaXNPYmplY3Qob2Zmc2V0KSkge1xuICAgICAgb2Zmc2V0ID0gLWdyb3VwLnNjYWxlKG9mZnNldC5zY2FsZSkob2Zmc2V0LnZhbHVlKTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKG9yaWVudCkge1xuICAgICAgY2FzZSBcImxlZnRcIjogICB7IHRwbC5zZXQobywgJ3gnLCAtb2Zmc2V0KTsgdHBsLnNldChvLCAneScsIDApOyBicmVhazsgfVxuICAgICAgY2FzZSBcInJpZ2h0XCI6ICB7IHRwbC5zZXQobywgJ3gnLCB3aWR0aCArIG9mZnNldCk7IHRwbC5zZXQobywgJ3knLCAwKTsgYnJlYWs7IH1cbiAgICAgIGNhc2UgXCJib3R0b21cIjogeyB0cGwuc2V0KG8sICd4JywgMCk7IHRwbC5zZXQobywgJ3knLCBoZWlnaHQgKyBvZmZzZXQpOyBicmVhazsgfVxuICAgICAgY2FzZSBcInRvcFwiOiAgICB7IHRwbC5zZXQobywgJ3gnLCAwKTsgdHBsLnNldChvLCAneScsIC1vZmZzZXQpOyBicmVhazsgfVxuICAgICAgZGVmYXVsdDogICAgICAgeyB0cGwuc2V0KG8sICd4JywgMCk7IHRwbC5zZXQobywgJ3knLCAwKTsgfVxuICAgIH1cbiAgfVxuXG4gIGlmICh0cmFucykgdHJhbnMuaW50ZXJwb2xhdGUoaXRlbSwgbyk7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiB2Z19heGlzVGlja3MoY29uZmlnKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJydWxlXCIsXG4gICAgaW50ZXJhY3RpdmU6IGZhbHNlLFxuICAgIGtleTogXCJkYXRhXCIsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgZW50ZXI6IHtcbiAgICAgICAgc3Ryb2tlOiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpY2tDb2xvcn0sXG4gICAgICAgIHN0cm9rZVdpZHRoOiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpY2tXaWR0aH0sXG4gICAgICAgIG9wYWNpdHk6IHt2YWx1ZTogMWUtNn1cbiAgICAgIH0sXG4gICAgICBleGl0OiB7IG9wYWNpdHk6IHt2YWx1ZTogMWUtNn0gfSxcbiAgICAgIHVwZGF0ZTogeyBvcGFjaXR5OiB7dmFsdWU6IDF9IH1cbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHZnX2F4aXNUaWNrTGFiZWxzKGNvbmZpZykge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwidGV4dFwiLFxuICAgIGludGVyYWN0aXZlOiB0cnVlLFxuICAgIGtleTogXCJkYXRhXCIsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgZW50ZXI6IHtcbiAgICAgICAgZmlsbDoge3ZhbHVlOiBjb25maWcuYXhpcy50aWNrTGFiZWxDb2xvcn0sXG4gICAgICAgIGZvbnQ6IHt2YWx1ZTogY29uZmlnLmF4aXMudGlja0xhYmVsRm9udH0sXG4gICAgICAgIGZvbnRTaXplOiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpY2tMYWJlbEZvbnRTaXplfSxcbiAgICAgICAgb3BhY2l0eToge3ZhbHVlOiAxZS02fSxcbiAgICAgICAgdGV4dDoge2ZpZWxkOiBcImxhYmVsXCJ9XG4gICAgICB9LFxuICAgICAgZXhpdDogeyBvcGFjaXR5OiB7dmFsdWU6IDFlLTZ9IH0sXG4gICAgICB1cGRhdGU6IHsgb3BhY2l0eToge3ZhbHVlOiAxfSB9XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiB2Z19heGlzVGl0bGUoY29uZmlnKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgaW50ZXJhY3RpdmU6IHRydWUsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgZW50ZXI6IHtcbiAgICAgICAgZm9udDoge3ZhbHVlOiBjb25maWcuYXhpcy50aXRsZUZvbnR9LFxuICAgICAgICBmb250U2l6ZToge3ZhbHVlOiBjb25maWcuYXhpcy50aXRsZUZvbnRTaXplfSxcbiAgICAgICAgZm9udFdlaWdodDoge3ZhbHVlOiBjb25maWcuYXhpcy50aXRsZUZvbnRXZWlnaHR9LFxuICAgICAgICBmaWxsOiB7dmFsdWU6IGNvbmZpZy5heGlzLnRpdGxlQ29sb3J9LFxuICAgICAgICBhbGlnbjoge3ZhbHVlOiBcImNlbnRlclwifSxcbiAgICAgICAgYmFzZWxpbmU6IHt2YWx1ZTogXCJtaWRkbGVcIn0sXG4gICAgICAgIHRleHQ6IHtmaWVsZDogXCJkYXRhXCJ9XG4gICAgICB9LFxuICAgICAgdXBkYXRlOiB7fVxuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gdmdfYXhpc0RvbWFpbihjb25maWcpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcInBhdGhcIixcbiAgICBpbnRlcmFjdGl2ZTogZmFsc2UsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgZW50ZXI6IHtcbiAgICAgICAgeDoge3ZhbHVlOiAwLjV9LFxuICAgICAgICB5OiB7dmFsdWU6IDAuNX0sXG4gICAgICAgIHN0cm9rZToge3ZhbHVlOiBjb25maWcuYXhpcy5heGlzQ29sb3J9LFxuICAgICAgICBzdHJva2VXaWR0aDoge3ZhbHVlOiBjb25maWcuYXhpcy5heGlzV2lkdGh9XG4gICAgICB9LFxuICAgICAgdXBkYXRlOiB7fVxuICAgIH1cbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBheHM7Il19
},{"../parse/mark":91,"datalib/src/util":20,"vega-dataflow/src/Tuple":34}],108:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    util = require('datalib/src/util'),
    Gradient = require('vega-scenegraph/src/util/Gradient'),
    parseProperties = require('../parse/properties'),
    parseMark = require('../parse/mark');

function lgnd(model) {
  var size = null,
      shape = null,
      fill = null,
      stroke = null,
      spacing = null,
      values = null,
      format = null,
      formatString = null,
      config = model.config(),
      title,
      orient = "right",
      offset = config.legend.offset,
      padding = config.legend.padding,
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
  function ingest(d, i) { return {data: d, index: i}; }

  legend.def = function() {
    var scale = size || shape || fill || stroke;
    
    format = !formatString ? null : ((scale.type === 'time') ?
      d3.time.format(formatString) : d3.format(formatString));
    
    if (!legendDef.type) {
      legendDef = (scale===fill || scale===stroke) && !discrete(scale.type) ?
        quantDef(scale) : ordinalDef(scale);      
    }
    legendDef.orient = orient;
    legendDef.offset = offset;
    legendDef.padding = padding;
    return legendDef;
  };

  function discrete(type) {
    return type==="ordinal" || type==="quantize" ||
           type==="quantile" || type==="threshold";
  }

  function ordinalDef(scale) {
    var def = o_legend_def(size, shape, fill, stroke);

    // generate data
    var data = (values == null ?
      (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain()) :
      values).map(ingest);
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
      range = spacing ||
        (fs = labelStyle.fontSize) && (fs.value + pad) ||
        (config.legend.labelFontSize + pad);
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
    var scaleSpec = {
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
    def.scales = [ scaleSpec ];
    def.marks[0].from = function() { return tdata; };
    def.marks[1].from = function() { return data; };
    def.marks[2].from = def.marks[1].from;

    return def;
  }

  function o_legend_def(size, shape, fill, stroke) {
    // setup legend marks
    var titles  = util.extend(m.titles, vg_legendTitle(config)),
        symbols = util.extend(m.symbols, vg_legendSymbols(config)),
        labels  = util.extend(m.labels, vg_vLegendLabels(config));

    // extend legend marks
    vg_legendSymbolExtend(symbols, size, shape, fill, stroke);
    
    // add / override custom style properties
    util.extend(titles.properties.update,  titleStyle);
    util.extend(symbols.properties.update, symbolStyle);
    util.extend(labels.properties.update,  labelStyle);

    // padding from legend border
    titles.properties.enter.x.value += padding;
    titles.properties.enter.y.value += padding;
    labels.properties.enter.x.offset += padding + 1;
    symbols.properties.enter.x.offset = padding + 1;
    labels.properties.update.x.offset += padding + 1;
    symbols.properties.update.x.offset = padding + 1;

    util.extend(legendDef, {
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
        data = (values == null ?
          (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain()) :
          values).map(ingest),
        width = (gradientStyle.width && gradientStyle.width.value) || config.legend.gradientWidth,
        fmt = format==null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : String) : format;

    // build scale for label layout
    var layoutSpec = {
      name: "legend",
      type: scale.type,
      round: true,
      zero: false,
      domain: [dom[0], dom[dom.length-1]],
      range: [padding, width+padding]
    };
    if (scale.type==="pow") layoutSpec.exponent = scale.exponent();
    
    // update legend def
    var tdata = (title ? [title] : []).map(ingest);
    data.forEach(function(d,i) {
      d.label = fmt(d.data);
      d.align = i==(data.length-1) ? "right" : i===0 ? "left" : "center";
    });
    def.scales = [ layoutSpec ];
    def.marks[0].from = function() { return tdata; };
    def.marks[1].from = function() { return [1]; };
    def.marks[2].from = function() { return data; };
    return def;
  }
  
  function q_legend_def(scale) {
    // setup legend marks
    var titles = util.extend(m.titles, vg_legendTitle(config)),
        gradient = util.extend(m.gradient, vg_legendGradient(config)),
        labels = util.extend(m.labels, vg_hLegendLabels(config)),
        grad = new Gradient();

    // setup color gradient
    var dom = scale.domain(),
        min = dom[0],
        max = dom[dom.length-1],
        f = scale.copy().domain([min, max]).range([0,1]);
        
    var stops = (scale.type !== "linear" && scale.ticks) ?
      scale.ticks.call(scale, 15) : dom;
    if (min !== stops[0]) stops.unshift(min);
    if (max !== stops[stops.length-1]) stops.push(max);

    for (var i=0, n=stops.length; i<n; ++i) {
      grad.stop(f(stops[i]), scale(stops[i]));
    }
    gradient.properties.enter.fill = {value: grad};

    // add / override custom style properties
    util.extend(titles.properties.update, titleStyle);
    util.extend(gradient.properties.update, gradientStyle);
    util.extend(labels.properties.update, labelStyle);

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

    util.extend(legendDef, {
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

  legend.reset = function() { 
    reset(); 
    return legend;
  };

  return legend;
}

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
    }
    case "right": {
      gx = group.width + (group.bounds && trans ? group.bounds.delta : 0);
      o.x += gx + offset;
      break;
    }
  }
  
  if (trans) trans.interpolate(item, o);
  var enc = item.mark.def.properties.enter.encode;
  enc.call(enc, item, group, trans, db, signals, predicates);
  return true;
}

function vg_legendSymbolExtend(mark, size, shape, fill, stroke) {
  var e = mark.properties.enter,
      u = mark.properties.update;
  if (size)   e.size   = u.size   = {scale: size.scaleName,   field: "data"};
  if (shape)  e.shape  = u.shape  = {scale: shape.scaleName,  field: "data"};
  if (fill)   e.fill   = u.fill   = {scale: fill.scaleName,   field: "data"};
  if (stroke) e.stroke = u.stroke = {scale: stroke.scaleName, field: "data"};
}

function vg_legendTitle(config) {
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

function vg_legendSymbols(config) {
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

function vg_vLegendLabels(config) {
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

function vg_legendGradient(config) {
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

function vg_hLegendLabels(config) {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9zY2VuZS9sZWdlbmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgdXRpbCA9IHJlcXVpcmUoJ2RhdGFsaWIvc3JjL3V0aWwnKSxcbiAgICBHcmFkaWVudCA9IHJlcXVpcmUoJ3ZlZ2Etc2NlbmVncmFwaC9zcmMvdXRpbC9HcmFkaWVudCcpLFxuICAgIHBhcnNlUHJvcGVydGllcyA9IHJlcXVpcmUoJy4uL3BhcnNlL3Byb3BlcnRpZXMnKSxcbiAgICBwYXJzZU1hcmsgPSByZXF1aXJlKCcuLi9wYXJzZS9tYXJrJyk7XG5cbmZ1bmN0aW9uIGxnbmQobW9kZWwpIHtcbiAgdmFyIHNpemUgPSBudWxsLFxuICAgICAgc2hhcGUgPSBudWxsLFxuICAgICAgZmlsbCA9IG51bGwsXG4gICAgICBzdHJva2UgPSBudWxsLFxuICAgICAgc3BhY2luZyA9IG51bGwsXG4gICAgICB2YWx1ZXMgPSBudWxsLFxuICAgICAgZm9ybWF0ID0gbnVsbCxcbiAgICAgIGZvcm1hdFN0cmluZyA9IG51bGwsXG4gICAgICBjb25maWcgPSBtb2RlbC5jb25maWcoKSxcbiAgICAgIHRpdGxlLFxuICAgICAgb3JpZW50ID0gXCJyaWdodFwiLFxuICAgICAgb2Zmc2V0ID0gY29uZmlnLmxlZ2VuZC5vZmZzZXQsXG4gICAgICBwYWRkaW5nID0gY29uZmlnLmxlZ2VuZC5wYWRkaW5nLFxuICAgICAgdGlja0FyZ3VtZW50cyA9IFs1XSxcbiAgICAgIGxlZ2VuZFN0eWxlID0ge30sXG4gICAgICBzeW1ib2xTdHlsZSA9IHt9LFxuICAgICAgZ3JhZGllbnRTdHlsZSA9IHt9LFxuICAgICAgdGl0bGVTdHlsZSA9IHt9LFxuICAgICAgbGFiZWxTdHlsZSA9IHt9LFxuICAgICAgbSA9IHsgLy8gTGVnZW5kIG1hcmtzIGFzIHJlZmVyZW5jZXMgZm9yIHVwZGF0ZXNcbiAgICAgICAgdGl0bGVzOiAge30sXG4gICAgICAgIHN5bWJvbHM6IHt9LFxuICAgICAgICBsYWJlbHM6ICB7fSxcbiAgICAgICAgZ3JhZGllbnQ6IHt9XG4gICAgICB9O1xuXG4gIHZhciBsZWdlbmQgPSB7fSxcbiAgICAgIGxlZ2VuZERlZiA9IHt9O1xuXG4gIGZ1bmN0aW9uIHJlc2V0KCkgeyBsZWdlbmREZWYudHlwZSA9IG51bGw7IH1cbiAgZnVuY3Rpb24gaW5nZXN0KGQsIGkpIHsgcmV0dXJuIHtkYXRhOiBkLCBpbmRleDogaX07IH1cblxuICBsZWdlbmQuZGVmID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNjYWxlID0gc2l6ZSB8fCBzaGFwZSB8fCBmaWxsIHx8IHN0cm9rZTtcbiAgICBcbiAgICBmb3JtYXQgPSAhZm9ybWF0U3RyaW5nID8gbnVsbCA6ICgoc2NhbGUudHlwZSA9PT0gJ3RpbWUnKSA/XG4gICAgICBkMy50aW1lLmZvcm1hdChmb3JtYXRTdHJpbmcpIDogZDMuZm9ybWF0KGZvcm1hdFN0cmluZykpO1xuICAgIFxuICAgIGlmICghbGVnZW5kRGVmLnR5cGUpIHtcbiAgICAgIGxlZ2VuZERlZiA9IChzY2FsZT09PWZpbGwgfHwgc2NhbGU9PT1zdHJva2UpICYmICFkaXNjcmV0ZShzY2FsZS50eXBlKSA/XG4gICAgICAgIHF1YW50RGVmKHNjYWxlKSA6IG9yZGluYWxEZWYoc2NhbGUpOyAgICAgIFxuICAgIH1cbiAgICBsZWdlbmREZWYub3JpZW50ID0gb3JpZW50O1xuICAgIGxlZ2VuZERlZi5vZmZzZXQgPSBvZmZzZXQ7XG4gICAgbGVnZW5kRGVmLnBhZGRpbmcgPSBwYWRkaW5nO1xuICAgIHJldHVybiBsZWdlbmREZWY7XG4gIH07XG5cbiAgZnVuY3Rpb24gZGlzY3JldGUodHlwZSkge1xuICAgIHJldHVybiB0eXBlPT09XCJvcmRpbmFsXCIgfHwgdHlwZT09PVwicXVhbnRpemVcIiB8fFxuICAgICAgICAgICB0eXBlPT09XCJxdWFudGlsZVwiIHx8IHR5cGU9PT1cInRocmVzaG9sZFwiO1xuICB9XG5cbiAgZnVuY3Rpb24gb3JkaW5hbERlZihzY2FsZSkge1xuICAgIHZhciBkZWYgPSBvX2xlZ2VuZF9kZWYoc2l6ZSwgc2hhcGUsIGZpbGwsIHN0cm9rZSk7XG5cbiAgICAvLyBnZW5lcmF0ZSBkYXRhXG4gICAgdmFyIGRhdGEgPSAodmFsdWVzID09IG51bGwgP1xuICAgICAgKHNjYWxlLnRpY2tzID8gc2NhbGUudGlja3MuYXBwbHkoc2NhbGUsIHRpY2tBcmd1bWVudHMpIDogc2NhbGUuZG9tYWluKCkpIDpcbiAgICAgIHZhbHVlcykubWFwKGluZ2VzdCk7XG4gICAgdmFyIGZtdCA9IGZvcm1hdD09bnVsbCA/IChzY2FsZS50aWNrRm9ybWF0ID8gc2NhbGUudGlja0Zvcm1hdC5hcHBseShzY2FsZSwgdGlja0FyZ3VtZW50cykgOiBTdHJpbmcpIDogZm9ybWF0O1xuICAgIFxuICAgIC8vIGRldGVybWluZSBzcGFjaW5nIGJldHdlZW4gbGVnZW5kIGVudHJpZXNcbiAgICB2YXIgZnMsIHJhbmdlLCBvZmZzZXQsIHBhZD01LCBkb21haW4gPSBkMy5yYW5nZShkYXRhLmxlbmd0aCk7XG4gICAgaWYgKHNpemUpIHtcbiAgICAgIHJhbmdlID0gZGF0YS5tYXAoZnVuY3Rpb24oeCkgeyByZXR1cm4gTWF0aC5zcXJ0KHNpemUoeC5kYXRhKSk7IH0pO1xuICAgICAgb2Zmc2V0ID0gZDMubWF4KHJhbmdlKTtcbiAgICAgIHJhbmdlID0gcmFuZ2UucmVkdWNlKGZ1bmN0aW9uKGEsYixpLHopIHtcbiAgICAgICAgICBpZiAoaSA+IDApIGFbaV0gPSBhW2ktMV0gKyB6W2ktMV0vMiArIHBhZDtcbiAgICAgICAgICByZXR1cm4gKGFbaV0gKz0gYi8yLCBhKTsgfSwgWzBdKS5tYXAoTWF0aC5yb3VuZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9mZnNldCA9IE1hdGgucm91bmQoTWF0aC5zcXJ0KGNvbmZpZy5sZWdlbmQuc3ltYm9sU2l6ZSkpO1xuICAgICAgcmFuZ2UgPSBzcGFjaW5nIHx8XG4gICAgICAgIChmcyA9IGxhYmVsU3R5bGUuZm9udFNpemUpICYmIChmcy52YWx1ZSArIHBhZCkgfHxcbiAgICAgICAgKGNvbmZpZy5sZWdlbmQubGFiZWxGb250U2l6ZSArIHBhZCk7XG4gICAgICByYW5nZSA9IGRvbWFpbi5tYXAoZnVuY3Rpb24oZCxpKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKG9mZnNldC8yICsgaSpyYW5nZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBhY2NvdW50IGZvciBwYWRkaW5nIGFuZCB0aXRsZSBzaXplXG4gICAgdmFyIHN6ID0gcGFkZGluZywgdHM7XG4gICAgaWYgKHRpdGxlKSB7XG4gICAgICB0cyA9IHRpdGxlU3R5bGUuZm9udFNpemU7XG4gICAgICBzeiArPSA1ICsgKCh0cyAmJiB0cy52YWx1ZSkgfHwgY29uZmlnLmxlZ2VuZC50aXRsZUZvbnRTaXplKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaT0wLCBuPXJhbmdlLmxlbmd0aDsgaTxuOyArK2kpIHJhbmdlW2ldICs9IHN6O1xuICAgIFxuICAgIC8vIGJ1aWxkIHNjYWxlIGZvciBsYWJlbCBsYXlvdXRcbiAgICB2YXIgc2NhbGVTcGVjID0ge1xuICAgICAgbmFtZTogXCJsZWdlbmRcIixcbiAgICAgIHR5cGU6IFwib3JkaW5hbFwiLFxuICAgICAgcG9pbnRzOiB0cnVlLFxuICAgICAgZG9tYWluOiBkb21haW4sXG4gICAgICByYW5nZTogcmFuZ2VcbiAgICB9O1xuICAgIFxuICAgIC8vIHVwZGF0ZSBsZWdlbmQgZGVmXG4gICAgdmFyIHRkYXRhID0gKHRpdGxlID8gW3RpdGxlXSA6IFtdKS5tYXAoaW5nZXN0KTtcbiAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgZC5sYWJlbCA9IGZtdChkLmRhdGEpO1xuICAgICAgZC5vZmZzZXQgPSBvZmZzZXQ7XG4gICAgfSk7XG4gICAgZGVmLnNjYWxlcyA9IFsgc2NhbGVTcGVjIF07XG4gICAgZGVmLm1hcmtzWzBdLmZyb20gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRkYXRhOyB9O1xuICAgIGRlZi5tYXJrc1sxXS5mcm9tID0gZnVuY3Rpb24oKSB7IHJldHVybiBkYXRhOyB9O1xuICAgIGRlZi5tYXJrc1syXS5mcm9tID0gZGVmLm1hcmtzWzFdLmZyb207XG5cbiAgICByZXR1cm4gZGVmO1xuICB9XG5cbiAgZnVuY3Rpb24gb19sZWdlbmRfZGVmKHNpemUsIHNoYXBlLCBmaWxsLCBzdHJva2UpIHtcbiAgICAvLyBzZXR1cCBsZWdlbmQgbWFya3NcbiAgICB2YXIgdGl0bGVzICA9IHV0aWwuZXh0ZW5kKG0udGl0bGVzLCB2Z19sZWdlbmRUaXRsZShjb25maWcpKSxcbiAgICAgICAgc3ltYm9scyA9IHV0aWwuZXh0ZW5kKG0uc3ltYm9scywgdmdfbGVnZW5kU3ltYm9scyhjb25maWcpKSxcbiAgICAgICAgbGFiZWxzICA9IHV0aWwuZXh0ZW5kKG0ubGFiZWxzLCB2Z192TGVnZW5kTGFiZWxzKGNvbmZpZykpO1xuXG4gICAgLy8gZXh0ZW5kIGxlZ2VuZCBtYXJrc1xuICAgIHZnX2xlZ2VuZFN5bWJvbEV4dGVuZChzeW1ib2xzLCBzaXplLCBzaGFwZSwgZmlsbCwgc3Ryb2tlKTtcbiAgICBcbiAgICAvLyBhZGQgLyBvdmVycmlkZSBjdXN0b20gc3R5bGUgcHJvcGVydGllc1xuICAgIHV0aWwuZXh0ZW5kKHRpdGxlcy5wcm9wZXJ0aWVzLnVwZGF0ZSwgIHRpdGxlU3R5bGUpO1xuICAgIHV0aWwuZXh0ZW5kKHN5bWJvbHMucHJvcGVydGllcy51cGRhdGUsIHN5bWJvbFN0eWxlKTtcbiAgICB1dGlsLmV4dGVuZChsYWJlbHMucHJvcGVydGllcy51cGRhdGUsICBsYWJlbFN0eWxlKTtcblxuICAgIC8vIHBhZGRpbmcgZnJvbSBsZWdlbmQgYm9yZGVyXG4gICAgdGl0bGVzLnByb3BlcnRpZXMuZW50ZXIueC52YWx1ZSArPSBwYWRkaW5nO1xuICAgIHRpdGxlcy5wcm9wZXJ0aWVzLmVudGVyLnkudmFsdWUgKz0gcGFkZGluZztcbiAgICBsYWJlbHMucHJvcGVydGllcy5lbnRlci54Lm9mZnNldCArPSBwYWRkaW5nICsgMTtcbiAgICBzeW1ib2xzLnByb3BlcnRpZXMuZW50ZXIueC5vZmZzZXQgPSBwYWRkaW5nICsgMTtcbiAgICBsYWJlbHMucHJvcGVydGllcy51cGRhdGUueC5vZmZzZXQgKz0gcGFkZGluZyArIDE7XG4gICAgc3ltYm9scy5wcm9wZXJ0aWVzLnVwZGF0ZS54Lm9mZnNldCA9IHBhZGRpbmcgKyAxO1xuXG4gICAgdXRpbC5leHRlbmQobGVnZW5kRGVmLCB7XG4gICAgICB0eXBlOiBcImdyb3VwXCIsXG4gICAgICBpbnRlcmFjdGl2ZTogZmFsc2UsXG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIGVudGVyOiBwYXJzZVByb3BlcnRpZXMobW9kZWwsIFwiZ3JvdXBcIiwgbGVnZW5kU3R5bGUpLFxuICAgICAgICB2Z19sZWdlbmRQb3NpdGlvbjoge1xuICAgICAgICAgIGVuY29kZTogdmdfbGVnZW5kUG9zaXRpb24sXG4gICAgICAgICAgc2lnbmFsczogW10sIHNjYWxlczpbXSwgZGF0YTogW10sIGZpZWxkczogW11cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgbGVnZW5kRGVmLm1hcmtzID0gW3RpdGxlcywgc3ltYm9scywgbGFiZWxzXS5tYXAoZnVuY3Rpb24obSkgeyByZXR1cm4gcGFyc2VNYXJrKG1vZGVsLCBtKTsgfSk7XG4gICAgcmV0dXJuIGxlZ2VuZERlZjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHF1YW50RGVmKHNjYWxlKSB7XG4gICAgdmFyIGRlZiA9IHFfbGVnZW5kX2RlZihzY2FsZSksXG4gICAgICAgIGRvbSA9IHNjYWxlLmRvbWFpbigpLFxuICAgICAgICBkYXRhID0gKHZhbHVlcyA9PSBudWxsID9cbiAgICAgICAgICAoc2NhbGUudGlja3MgPyBzY2FsZS50aWNrcy5hcHBseShzY2FsZSwgdGlja0FyZ3VtZW50cykgOiBzY2FsZS5kb21haW4oKSkgOlxuICAgICAgICAgIHZhbHVlcykubWFwKGluZ2VzdCksXG4gICAgICAgIHdpZHRoID0gKGdyYWRpZW50U3R5bGUud2lkdGggJiYgZ3JhZGllbnRTdHlsZS53aWR0aC52YWx1ZSkgfHwgY29uZmlnLmxlZ2VuZC5ncmFkaWVudFdpZHRoLFxuICAgICAgICBmbXQgPSBmb3JtYXQ9PW51bGwgPyAoc2NhbGUudGlja0Zvcm1hdCA/IHNjYWxlLnRpY2tGb3JtYXQuYXBwbHkoc2NhbGUsIHRpY2tBcmd1bWVudHMpIDogU3RyaW5nKSA6IGZvcm1hdDtcblxuICAgIC8vIGJ1aWxkIHNjYWxlIGZvciBsYWJlbCBsYXlvdXRcbiAgICB2YXIgbGF5b3V0U3BlYyA9IHtcbiAgICAgIG5hbWU6IFwibGVnZW5kXCIsXG4gICAgICB0eXBlOiBzY2FsZS50eXBlLFxuICAgICAgcm91bmQ6IHRydWUsXG4gICAgICB6ZXJvOiBmYWxzZSxcbiAgICAgIGRvbWFpbjogW2RvbVswXSwgZG9tW2RvbS5sZW5ndGgtMV1dLFxuICAgICAgcmFuZ2U6IFtwYWRkaW5nLCB3aWR0aCtwYWRkaW5nXVxuICAgIH07XG4gICAgaWYgKHNjYWxlLnR5cGU9PT1cInBvd1wiKSBsYXlvdXRTcGVjLmV4cG9uZW50ID0gc2NhbGUuZXhwb25lbnQoKTtcbiAgICBcbiAgICAvLyB1cGRhdGUgbGVnZW5kIGRlZlxuICAgIHZhciB0ZGF0YSA9ICh0aXRsZSA/IFt0aXRsZV0gOiBbXSkubWFwKGluZ2VzdCk7XG4gICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGQsaSkge1xuICAgICAgZC5sYWJlbCA9IGZtdChkLmRhdGEpO1xuICAgICAgZC5hbGlnbiA9IGk9PShkYXRhLmxlbmd0aC0xKSA/IFwicmlnaHRcIiA6IGk9PT0wID8gXCJsZWZ0XCIgOiBcImNlbnRlclwiO1xuICAgIH0pO1xuICAgIGRlZi5zY2FsZXMgPSBbIGxheW91dFNwZWMgXTtcbiAgICBkZWYubWFya3NbMF0uZnJvbSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGRhdGE7IH07XG4gICAgZGVmLm1hcmtzWzFdLmZyb20gPSBmdW5jdGlvbigpIHsgcmV0dXJuIFsxXTsgfTtcbiAgICBkZWYubWFya3NbMl0uZnJvbSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gZGF0YTsgfTtcbiAgICByZXR1cm4gZGVmO1xuICB9XG4gIFxuICBmdW5jdGlvbiBxX2xlZ2VuZF9kZWYoc2NhbGUpIHtcbiAgICAvLyBzZXR1cCBsZWdlbmQgbWFya3NcbiAgICB2YXIgdGl0bGVzID0gdXRpbC5leHRlbmQobS50aXRsZXMsIHZnX2xlZ2VuZFRpdGxlKGNvbmZpZykpLFxuICAgICAgICBncmFkaWVudCA9IHV0aWwuZXh0ZW5kKG0uZ3JhZGllbnQsIHZnX2xlZ2VuZEdyYWRpZW50KGNvbmZpZykpLFxuICAgICAgICBsYWJlbHMgPSB1dGlsLmV4dGVuZChtLmxhYmVscywgdmdfaExlZ2VuZExhYmVscyhjb25maWcpKSxcbiAgICAgICAgZ3JhZCA9IG5ldyBHcmFkaWVudCgpO1xuXG4gICAgLy8gc2V0dXAgY29sb3IgZ3JhZGllbnRcbiAgICB2YXIgZG9tID0gc2NhbGUuZG9tYWluKCksXG4gICAgICAgIG1pbiA9IGRvbVswXSxcbiAgICAgICAgbWF4ID0gZG9tW2RvbS5sZW5ndGgtMV0sXG4gICAgICAgIGYgPSBzY2FsZS5jb3B5KCkuZG9tYWluKFttaW4sIG1heF0pLnJhbmdlKFswLDFdKTtcbiAgICAgICAgXG4gICAgdmFyIHN0b3BzID0gKHNjYWxlLnR5cGUgIT09IFwibGluZWFyXCIgJiYgc2NhbGUudGlja3MpID9cbiAgICAgIHNjYWxlLnRpY2tzLmNhbGwoc2NhbGUsIDE1KSA6IGRvbTtcbiAgICBpZiAobWluICE9PSBzdG9wc1swXSkgc3RvcHMudW5zaGlmdChtaW4pO1xuICAgIGlmIChtYXggIT09IHN0b3BzW3N0b3BzLmxlbmd0aC0xXSkgc3RvcHMucHVzaChtYXgpO1xuXG4gICAgZm9yICh2YXIgaT0wLCBuPXN0b3BzLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICAgIGdyYWQuc3RvcChmKHN0b3BzW2ldKSwgc2NhbGUoc3RvcHNbaV0pKTtcbiAgICB9XG4gICAgZ3JhZGllbnQucHJvcGVydGllcy5lbnRlci5maWxsID0ge3ZhbHVlOiBncmFkfTtcblxuICAgIC8vIGFkZCAvIG92ZXJyaWRlIGN1c3RvbSBzdHlsZSBwcm9wZXJ0aWVzXG4gICAgdXRpbC5leHRlbmQodGl0bGVzLnByb3BlcnRpZXMudXBkYXRlLCB0aXRsZVN0eWxlKTtcbiAgICB1dGlsLmV4dGVuZChncmFkaWVudC5wcm9wZXJ0aWVzLnVwZGF0ZSwgZ3JhZGllbnRTdHlsZSk7XG4gICAgdXRpbC5leHRlbmQobGFiZWxzLnByb3BlcnRpZXMudXBkYXRlLCBsYWJlbFN0eWxlKTtcblxuICAgIC8vIGFjY291bnQgZm9yIGdyYWRpZW50IHNpemVcbiAgICB2YXIgZ3AgPSBncmFkaWVudC5wcm9wZXJ0aWVzLCBnaCA9IGdyYWRpZW50U3R5bGUuaGVpZ2h0LFxuICAgICAgICBoaCA9IChnaCAmJiBnaC52YWx1ZSkgfHwgZ3AuZW50ZXIuaGVpZ2h0LnZhbHVlO1xuICAgIGxhYmVscy5wcm9wZXJ0aWVzLmVudGVyLnkudmFsdWUgPSBoaDtcbiAgICBsYWJlbHMucHJvcGVydGllcy51cGRhdGUueS52YWx1ZSA9IGhoO1xuXG4gICAgLy8gYWNjb3VudCBmb3IgdGl0bGUgc2l6ZSBhcyBuZWVkZWRcbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIHZhciB0cCA9IHRpdGxlcy5wcm9wZXJ0aWVzLCBmcyA9IHRpdGxlU3R5bGUuZm9udFNpemUsXG4gICAgICAgICAgc3ogPSA0ICsgKChmcyAmJiBmcy52YWx1ZSkgfHwgdHAuZW50ZXIuZm9udFNpemUudmFsdWUpO1xuICAgICAgZ3JhZGllbnQucHJvcGVydGllcy5lbnRlci55LnZhbHVlICs9IHN6O1xuICAgICAgbGFiZWxzLnByb3BlcnRpZXMuZW50ZXIueS52YWx1ZSArPSBzejtcbiAgICAgIGdyYWRpZW50LnByb3BlcnRpZXMudXBkYXRlLnkudmFsdWUgKz0gc3o7XG4gICAgICBsYWJlbHMucHJvcGVydGllcy51cGRhdGUueS52YWx1ZSArPSBzejtcbiAgICB9XG4gICAgXG4gICAgLy8gcGFkZGluZyBmcm9tIGxlZ2VuZCBib3JkZXJcbiAgICB0aXRsZXMucHJvcGVydGllcy5lbnRlci54LnZhbHVlICs9IHBhZGRpbmc7XG4gICAgdGl0bGVzLnByb3BlcnRpZXMuZW50ZXIueS52YWx1ZSArPSBwYWRkaW5nO1xuICAgIGdyYWRpZW50LnByb3BlcnRpZXMuZW50ZXIueC52YWx1ZSArPSBwYWRkaW5nO1xuICAgIGdyYWRpZW50LnByb3BlcnRpZXMuZW50ZXIueS52YWx1ZSArPSBwYWRkaW5nO1xuICAgIGxhYmVscy5wcm9wZXJ0aWVzLmVudGVyLnkudmFsdWUgKz0gcGFkZGluZztcbiAgICBncmFkaWVudC5wcm9wZXJ0aWVzLnVwZGF0ZS54LnZhbHVlICs9IHBhZGRpbmc7XG4gICAgZ3JhZGllbnQucHJvcGVydGllcy51cGRhdGUueS52YWx1ZSArPSBwYWRkaW5nO1xuICAgIGxhYmVscy5wcm9wZXJ0aWVzLnVwZGF0ZS55LnZhbHVlICs9IHBhZGRpbmc7XG5cbiAgICB1dGlsLmV4dGVuZChsZWdlbmREZWYsIHtcbiAgICAgIHR5cGU6IFwiZ3JvdXBcIixcbiAgICAgIGludGVyYWN0aXZlOiBmYWxzZSxcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgZW50ZXI6IHBhcnNlUHJvcGVydGllcyhtb2RlbCwgXCJncm91cFwiLCBsZWdlbmRTdHlsZSksXG4gICAgICAgIHZnX2xlZ2VuZFBvc2l0aW9uOiB7XG4gICAgICAgICAgZW5jb2RlOiB2Z19sZWdlbmRQb3NpdGlvbixcbiAgICAgICAgICBzaWduYWxzOiBbXSwgc2NhbGVzOiBbXSwgZGF0YTogW10sIGZpZWxkczogW11cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgbGVnZW5kRGVmLm1hcmtzID0gW3RpdGxlcywgZ3JhZGllbnQsIGxhYmVsc10ubWFwKGZ1bmN0aW9uKG0pIHsgcmV0dXJuIHBhcnNlTWFyayhtb2RlbCwgbSk7IH0pO1xuICAgIHJldHVybiBsZWdlbmREZWY7XG4gIH1cblxuICBsZWdlbmQuc2l6ZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBzaXplO1xuICAgIGlmIChzaXplICE9PSB4KSB7IHNpemUgPSB4OyByZXNldCgpOyB9XG4gICAgcmV0dXJuIGxlZ2VuZDtcbiAgfTtcblxuICBsZWdlbmQuc2hhcGUgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc2hhcGU7XG4gICAgaWYgKHNoYXBlICE9PSB4KSB7IHNoYXBlID0geDsgcmVzZXQoKTsgfVxuICAgIHJldHVybiBsZWdlbmQ7XG4gIH07XG5cbiAgbGVnZW5kLmZpbGwgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZmlsbDtcbiAgICBpZiAoZmlsbCAhPT0geCkgeyBmaWxsID0geDsgcmVzZXQoKTsgfVxuICAgIHJldHVybiBsZWdlbmQ7XG4gIH07XG4gIFxuICBsZWdlbmQuc3Ryb2tlID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHN0cm9rZTtcbiAgICBpZiAoc3Ryb2tlICE9PSB4KSB7IHN0cm9rZSA9IHg7IHJlc2V0KCk7IH1cbiAgICByZXR1cm4gbGVnZW5kO1xuICB9O1xuXG4gIGxlZ2VuZC50aXRsZSA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aXRsZTtcbiAgICBpZiAodGl0bGUgIT09IHgpIHsgdGl0bGUgPSB4OyByZXNldCgpOyB9XG4gICAgcmV0dXJuIGxlZ2VuZDtcbiAgfTtcblxuICBsZWdlbmQuZm9ybWF0ID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGZvcm1hdFN0cmluZztcbiAgICBpZiAoZm9ybWF0U3RyaW5nICE9PSB4KSB7XG4gICAgICBmb3JtYXRTdHJpbmcgPSB4O1xuICAgICAgcmVzZXQoKTtcbiAgICB9XG4gICAgcmV0dXJuIGxlZ2VuZDtcbiAgfTtcblxuICBsZWdlbmQuc3BhY2luZyA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBzcGFjaW5nO1xuICAgIGlmIChzcGFjaW5nICE9PSAreCkgeyBzcGFjaW5nID0gK3g7IHJlc2V0KCk7IH1cbiAgICByZXR1cm4gbGVnZW5kO1xuICB9O1xuXG4gIGxlZ2VuZC5vcmllbnQgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gb3JpZW50O1xuICAgIG9yaWVudCA9IHggaW4gdmdfbGVnZW5kT3JpZW50cyA/IHggKyBcIlwiIDogY29uZmlnLmxlZ2VuZC5vcmllbnQ7XG4gICAgcmV0dXJuIGxlZ2VuZDtcbiAgfTtcblxuICBsZWdlbmQub2Zmc2V0ID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIG9mZnNldDtcbiAgICBvZmZzZXQgPSAreDtcbiAgICByZXR1cm4gbGVnZW5kO1xuICB9O1xuXG4gIGxlZ2VuZC52YWx1ZXMgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdmFsdWVzO1xuICAgIHZhbHVlcyA9IHg7XG4gICAgcmV0dXJuIGxlZ2VuZDtcbiAgfTtcblxuICBsZWdlbmQubGVnZW5kUHJvcGVydGllcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBsZWdlbmRTdHlsZTtcbiAgICBsZWdlbmRTdHlsZSA9IHg7XG4gICAgcmV0dXJuIGxlZ2VuZDtcbiAgfTtcblxuICBsZWdlbmQuc3ltYm9sUHJvcGVydGllcyA9IGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBzeW1ib2xTdHlsZTtcbiAgICBzeW1ib2xTdHlsZSA9IHg7XG4gICAgcmV0dXJuIGxlZ2VuZDtcbiAgfTtcblxuICBsZWdlbmQuZ3JhZGllbnRQcm9wZXJ0aWVzID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGdyYWRpZW50U3R5bGU7XG4gICAgZ3JhZGllbnRTdHlsZSA9IHg7XG4gICAgcmV0dXJuIGxlZ2VuZDtcbiAgfTtcblxuICBsZWdlbmQubGFiZWxQcm9wZXJ0aWVzID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGxhYmVsU3R5bGU7XG4gICAgbGFiZWxTdHlsZSA9IHg7XG4gICAgcmV0dXJuIGxlZ2VuZDtcbiAgfTtcbiAgXG4gIGxlZ2VuZC50aXRsZVByb3BlcnRpZXMgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGl0bGVTdHlsZTtcbiAgICB0aXRsZVN0eWxlID0geDtcbiAgICByZXR1cm4gbGVnZW5kO1xuICB9O1xuXG4gIGxlZ2VuZC5yZXNldCA9IGZ1bmN0aW9uKCkgeyBcbiAgICByZXNldCgpOyBcbiAgICByZXR1cm4gbGVnZW5kO1xuICB9O1xuXG4gIHJldHVybiBsZWdlbmQ7XG59XG5cbnZhciB2Z19sZWdlbmRPcmllbnRzID0ge3JpZ2h0OiAxLCBsZWZ0OiAxfTtcblxuZnVuY3Rpb24gdmdfbGVnZW5kUG9zaXRpb24oaXRlbSwgZ3JvdXAsIHRyYW5zLCBkYiwgc2lnbmFscywgcHJlZGljYXRlcykge1xuICB2YXIgbyA9IHRyYW5zID8ge30gOiBpdGVtLCBneCxcbiAgICAgIG9mZnNldCA9IGl0ZW0ubWFyay5kZWYub2Zmc2V0LFxuICAgICAgb3JpZW50ID0gaXRlbS5tYXJrLmRlZi5vcmllbnQsXG4gICAgICBwYWQgICAgPSBpdGVtLm1hcmsuZGVmLnBhZGRpbmcgKiAyLFxuICAgICAgbHcgICAgID0gfn5pdGVtLmJvdW5kcy53aWR0aCgpICsgKGl0ZW0ud2lkdGggPyAwIDogcGFkKSxcbiAgICAgIGxoICAgICA9IH5+aXRlbS5ib3VuZHMuaGVpZ2h0KCkgKyAoaXRlbS5oZWlnaHQgPyAwIDogcGFkKSxcbiAgICAgIHBvcyA9IGdyb3VwLl9sZWdlbmRQb3NpdGlvbnMgfHwgXG4gICAgICAgIChncm91cC5fbGVnZW5kUG9zaXRpb25zID0ge3JpZ2h0OiAwLjUsIGxlZnQ6IDAuNX0pO1xuXG4gIG8ueCA9IDAuNTtcbiAgby53aWR0aCA9IGx3O1xuICBvLnkgPSBwb3Nbb3JpZW50XTtcbiAgcG9zW29yaWVudF0gKz0gKG8uaGVpZ2h0ID0gbGgpO1xuXG4gIC8vIEhBQ0s6IHVzZSB0byBlc3RpbWF0ZSBncm91cCBib3VuZHMgZHVyaW5nIGFuaW1hdGVkIHRyYW5zaXRpb25cbiAgaWYgKCF0cmFucyAmJiBncm91cC5ib3VuZHMpIHtcbiAgICBncm91cC5ib3VuZHMuZGVsdGEgPSBncm91cC5ib3VuZHMueDIgLSBncm91cC53aWR0aDtcbiAgfVxuXG4gIHN3aXRjaCAob3JpZW50KSB7XG4gICAgY2FzZSBcImxlZnRcIjogIHtcbiAgICAgIGd4ID0gZ3JvdXAuYm91bmRzID8gZ3JvdXAuYm91bmRzLngxIDogMDtcbiAgICAgIG8ueCArPSBneCAtIG9mZnNldCAtIGx3O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJyaWdodFwiOiB7XG4gICAgICBneCA9IGdyb3VwLndpZHRoICsgKGdyb3VwLmJvdW5kcyAmJiB0cmFucyA/IGdyb3VwLmJvdW5kcy5kZWx0YSA6IDApO1xuICAgICAgby54ICs9IGd4ICsgb2Zmc2V0O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIFxuICBpZiAodHJhbnMpIHRyYW5zLmludGVycG9sYXRlKGl0ZW0sIG8pO1xuICB2YXIgZW5jID0gaXRlbS5tYXJrLmRlZi5wcm9wZXJ0aWVzLmVudGVyLmVuY29kZTtcbiAgZW5jLmNhbGwoZW5jLCBpdGVtLCBncm91cCwgdHJhbnMsIGRiLCBzaWduYWxzLCBwcmVkaWNhdGVzKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHZnX2xlZ2VuZFN5bWJvbEV4dGVuZChtYXJrLCBzaXplLCBzaGFwZSwgZmlsbCwgc3Ryb2tlKSB7XG4gIHZhciBlID0gbWFyay5wcm9wZXJ0aWVzLmVudGVyLFxuICAgICAgdSA9IG1hcmsucHJvcGVydGllcy51cGRhdGU7XG4gIGlmIChzaXplKSAgIGUuc2l6ZSAgID0gdS5zaXplICAgPSB7c2NhbGU6IHNpemUuc2NhbGVOYW1lLCAgIGZpZWxkOiBcImRhdGFcIn07XG4gIGlmIChzaGFwZSkgIGUuc2hhcGUgID0gdS5zaGFwZSAgPSB7c2NhbGU6IHNoYXBlLnNjYWxlTmFtZSwgIGZpZWxkOiBcImRhdGFcIn07XG4gIGlmIChmaWxsKSAgIGUuZmlsbCAgID0gdS5maWxsICAgPSB7c2NhbGU6IGZpbGwuc2NhbGVOYW1lLCAgIGZpZWxkOiBcImRhdGFcIn07XG4gIGlmIChzdHJva2UpIGUuc3Ryb2tlID0gdS5zdHJva2UgPSB7c2NhbGU6IHN0cm9rZS5zY2FsZU5hbWUsIGZpZWxkOiBcImRhdGFcIn07XG59XG5cbmZ1bmN0aW9uIHZnX2xlZ2VuZFRpdGxlKGNvbmZpZykge1xuICB2YXIgY2ZnID0gY29uZmlnLmxlZ2VuZDtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcInRleHRcIixcbiAgICBpbnRlcmFjdGl2ZTogZmFsc2UsXG4gICAga2V5OiBcImRhdGFcIixcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBlbnRlcjoge1xuICAgICAgICB4OiB7dmFsdWU6IDB9LFxuICAgICAgICB5OiB7dmFsdWU6IDB9LFxuICAgICAgICBmaWxsOiB7dmFsdWU6IGNmZy50aXRsZUNvbG9yfSxcbiAgICAgICAgZm9udDoge3ZhbHVlOiBjZmcudGl0bGVGb250fSxcbiAgICAgICAgZm9udFNpemU6IHt2YWx1ZTogY2ZnLnRpdGxlRm9udFNpemV9LFxuICAgICAgICBmb250V2VpZ2h0OiB7dmFsdWU6IGNmZy50aXRsZUZvbnRXZWlnaHR9LFxuICAgICAgICBiYXNlbGluZToge3ZhbHVlOiBcInRvcFwifSxcbiAgICAgICAgdGV4dDoge2ZpZWxkOiBcImRhdGFcIn0sXG4gICAgICAgIG9wYWNpdHk6IHt2YWx1ZTogMWUtNn1cbiAgICAgIH0sXG4gICAgICBleGl0OiB7IG9wYWNpdHk6IHt2YWx1ZTogMWUtNn0gfSxcbiAgICAgIHVwZGF0ZTogeyBvcGFjaXR5OiB7dmFsdWU6IDF9IH1cbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHZnX2xlZ2VuZFN5bWJvbHMoY29uZmlnKSB7XG4gIHZhciBjZmcgPSBjb25maWcubGVnZW5kO1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwic3ltYm9sXCIsXG4gICAgaW50ZXJhY3RpdmU6IGZhbHNlLFxuICAgIGtleTogXCJkYXRhXCIsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgZW50ZXI6IHtcbiAgICAgICAgeDoge2ZpZWxkOiBcIm9mZnNldFwiLCBtdWx0OiAwLjV9LFxuICAgICAgICB5OiB7c2NhbGU6IFwibGVnZW5kXCIsIGZpZWxkOiBcImluZGV4XCJ9LFxuICAgICAgICBzaGFwZToge3ZhbHVlOiBjZmcuc3ltYm9sU2hhcGV9LFxuICAgICAgICBzaXplOiB7dmFsdWU6IGNmZy5zeW1ib2xTaXplfSxcbiAgICAgICAgc3Ryb2tlOiB7dmFsdWU6IGNmZy5zeW1ib2xDb2xvcn0sXG4gICAgICAgIHN0cm9rZVdpZHRoOiB7dmFsdWU6IGNmZy5zeW1ib2xTdHJva2VXaWR0aH0sXG4gICAgICAgIG9wYWNpdHk6IHt2YWx1ZTogMWUtNn1cbiAgICAgIH0sXG4gICAgICBleGl0OiB7IG9wYWNpdHk6IHt2YWx1ZTogMWUtNn0gfSxcbiAgICAgIHVwZGF0ZToge1xuICAgICAgICB4OiB7ZmllbGQ6IFwib2Zmc2V0XCIsIG11bHQ6IDAuNX0sXG4gICAgICAgIHk6IHtzY2FsZTogXCJsZWdlbmRcIiwgZmllbGQ6IFwiaW5kZXhcIn0sXG4gICAgICAgIG9wYWNpdHk6IHt2YWx1ZTogMX1cbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHZnX3ZMZWdlbmRMYWJlbHMoY29uZmlnKSB7XG4gIHZhciBjZmcgPSBjb25maWcubGVnZW5kO1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwidGV4dFwiLFxuICAgIGludGVyYWN0aXZlOiBmYWxzZSxcbiAgICBrZXk6IFwiZGF0YVwiLFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIGVudGVyOiB7XG4gICAgICAgIHg6IHtmaWVsZDogXCJvZmZzZXRcIiwgb2Zmc2V0OiA1fSxcbiAgICAgICAgeToge3NjYWxlOiBcImxlZ2VuZFwiLCBmaWVsZDogXCJpbmRleFwifSxcbiAgICAgICAgZmlsbDoge3ZhbHVlOiBjZmcubGFiZWxDb2xvcn0sXG4gICAgICAgIGZvbnQ6IHt2YWx1ZTogY2ZnLmxhYmVsRm9udH0sXG4gICAgICAgIGZvbnRTaXplOiB7dmFsdWU6IGNmZy5sYWJlbEZvbnRTaXplfSxcbiAgICAgICAgYWxpZ246IHt2YWx1ZTogY2ZnLmxhYmVsQWxpZ259LFxuICAgICAgICBiYXNlbGluZToge3ZhbHVlOiBjZmcubGFiZWxCYXNlbGluZX0sXG4gICAgICAgIHRleHQ6IHtmaWVsZDogXCJsYWJlbFwifSxcbiAgICAgICAgb3BhY2l0eToge3ZhbHVlOiAxZS02fVxuICAgICAgfSxcbiAgICAgIGV4aXQ6IHsgb3BhY2l0eToge3ZhbHVlOiAxZS02fSB9LFxuICAgICAgdXBkYXRlOiB7XG4gICAgICAgIG9wYWNpdHk6IHt2YWx1ZTogMX0sXG4gICAgICAgIHg6IHtmaWVsZDogXCJvZmZzZXRcIiwgb2Zmc2V0OiA1fSxcbiAgICAgICAgeToge3NjYWxlOiBcImxlZ2VuZFwiLCBmaWVsZDogXCJpbmRleFwifSxcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHZnX2xlZ2VuZEdyYWRpZW50KGNvbmZpZykge1xuICB2YXIgY2ZnID0gY29uZmlnLmxlZ2VuZDtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcInJlY3RcIixcbiAgICBpbnRlcmFjdGl2ZTogZmFsc2UsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgZW50ZXI6IHtcbiAgICAgICAgeDoge3ZhbHVlOiAwfSxcbiAgICAgICAgeToge3ZhbHVlOiAwfSxcbiAgICAgICAgd2lkdGg6IHt2YWx1ZTogY2ZnLmdyYWRpZW50V2lkdGh9LFxuICAgICAgICBoZWlnaHQ6IHt2YWx1ZTogY2ZnLmdyYWRpZW50SGVpZ2h0fSxcbiAgICAgICAgc3Ryb2tlOiB7dmFsdWU6IGNmZy5ncmFkaWVudFN0cm9rZUNvbG9yfSxcbiAgICAgICAgc3Ryb2tlV2lkdGg6IHt2YWx1ZTogY2ZnLmdyYWRpZW50U3Ryb2tlV2lkdGh9LFxuICAgICAgICBvcGFjaXR5OiB7dmFsdWU6IDFlLTZ9XG4gICAgICB9LFxuICAgICAgZXhpdDogeyBvcGFjaXR5OiB7dmFsdWU6IDFlLTZ9IH0sXG4gICAgICB1cGRhdGU6IHtcbiAgICAgICAgeDoge3ZhbHVlOiAwfSxcbiAgICAgICAgeToge3ZhbHVlOiAwfSxcbiAgICAgICAgb3BhY2l0eToge3ZhbHVlOiAxfVxuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gdmdfaExlZ2VuZExhYmVscyhjb25maWcpIHtcbiAgdmFyIGNmZyA9IGNvbmZpZy5sZWdlbmQ7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgaW50ZXJhY3RpdmU6IGZhbHNlLFxuICAgIGtleTogXCJkYXRhXCIsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgZW50ZXI6IHtcbiAgICAgICAgeDoge3NjYWxlOiBcImxlZ2VuZFwiLCBmaWVsZDogXCJkYXRhXCJ9LFxuICAgICAgICB5OiB7dmFsdWU6IDIwfSxcbiAgICAgICAgZHk6IHt2YWx1ZTogMn0sXG4gICAgICAgIGZpbGw6IHt2YWx1ZTogY2ZnLmxhYmVsQ29sb3J9LFxuICAgICAgICBmb250OiB7dmFsdWU6IGNmZy5sYWJlbEZvbnR9LFxuICAgICAgICBmb250U2l6ZToge3ZhbHVlOiBjZmcubGFiZWxGb250U2l6ZX0sXG4gICAgICAgIGFsaWduOiB7ZmllbGQ6IFwiYWxpZ25cIn0sXG4gICAgICAgIGJhc2VsaW5lOiB7dmFsdWU6IFwidG9wXCJ9LFxuICAgICAgICB0ZXh0OiB7ZmllbGQ6IFwibGFiZWxcIn0sXG4gICAgICAgIG9wYWNpdHk6IHt2YWx1ZTogMWUtNn1cbiAgICAgIH0sXG4gICAgICBleGl0OiB7IG9wYWNpdHk6IHt2YWx1ZTogMWUtNn0gfSxcbiAgICAgIHVwZGF0ZToge1xuICAgICAgICB4OiB7c2NhbGU6IFwibGVnZW5kXCIsIGZpZWxkOiBcImRhdGFcIn0sXG4gICAgICAgIHk6IHt2YWx1ZTogMjB9LFxuICAgICAgICBvcGFjaXR5OiB7dmFsdWU6IDF9XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxnbmQ7Il19
},{"../parse/mark":91,"../parse/properties":96,"datalib/src/util":20,"vega-scenegraph/src/util/Gradient":71}],109:[function(require,module,exports){
module.exports = function visit(node, func) {
  var i, n, s, m, items;
  if (func(node)) return true;

  var sets = ['items', 'axisItems', 'legendItems'];
  for (s=0, m=sets.length; s<m; ++s) {
    if ((items = node[sets[s]])) {
      for (i=0, n=items.length; i<n; ++i) {
        if (visit(items[i], func)) return true;
      }
    }
  }
};
},{}],110:[function(require,module,exports){
var util = require('datalib/src/util'),
    ChangeSet = require('vega-dataflow/src/ChangeSet'),
    Tuple = require('vega-dataflow/src/Tuple'),
    Deps = require('vega-dataflow/src/Dependencies'),
    log = require('vega-logging'),
    Transform = require('./Transform'),
    Facetor = require('./Facetor');

function Aggregate(graph) {
  Transform.prototype.init.call(this, graph);

  Transform.addParameters(this, {
    groupby: {type: 'array<field>'},
    summarize: {
      type: 'custom', 
      set: function(summarize) {
        var signals = {},
            i, len, f, fields, name, ops;

        if (!util.isArray(fields = summarize)) { // Object syntax from util
          fields = [];
          for (name in summarize) {
            ops = util.array(summarize[name]);
            fields.push({field: name, ops: ops});
          }
        }

        function sg(x) { if (x.signal) signals[x.signal] = 1; }

        for (i=0, len=fields.length; i<len; ++i) {
          f = fields[i];
          if (f.field.signal) signals[f.field.signal] = 1;
          util.array(f.ops).forEach(sg);
          util.array(f.as).forEach(sg);
        }

        this._transform._fieldsDef = fields;
        this._transform._aggr = null;
        this._transform.dependency(Deps.SIGNALS, util.keys(signals));
        return this._transform;
      }
    }
  });

  this._fieldsDef = [];
  this._aggr = null;  // util.Aggregator

  this._type = TYPES.TUPLE; 
  this._acc = {groupby: util.true, value: util.true};
  this._cache = {}; // And cache them as aggregators expect original tuples.

  // Aggregator needs a full instantiation of the previous tuple.
  // Cache them to reduce creation costs.
  this._prev = {}; 

  return this.router(true).revises(true);
}

var prototype = (Aggregate.prototype = Object.create(Transform.prototype));
prototype.constructor = Aggregate;

var TYPES = Aggregate.TYPES = {
  VALUE: 1, 
  TUPLE: 2, 
  MULTI: 3
};

Aggregate.VALID_OPS = [
  'values', 'count', 'valid', 'missing', 'distinct', 
  'sum', 'mean', 'average', 'variance', 'variancep', 'stdev', 
  'stdevp', 'median', 'q1', 'q3', 'modeskew', 'min', 'max', 
  'argmin', 'argmax'
];

prototype.type = function(type) { 
  return (this._type = type, this); 
};

prototype.accessors = function(groupby, value) {
  var acc = this._acc;
  acc.groupby = util.$(groupby) || util.true;
  acc.value = util.$(value) || util.true;
};

function standardize(x) {
  var acc = this._acc;
  if (this._type === TYPES.TUPLE) {
    return x;
  } else if (this._type === TYPES.VALUE) {
    return acc.value(x);
  } else {
    return this._cache[x._id] || (this._cache[x._id] = {
      _id: x._id,
      groupby: acc.groupby(x),
      value: acc.value(x)
    });
  }
}

prototype.aggr = function() {
  if (this._aggr) return this._aggr;

  var graph = this._graph,
      groupby = this.param('groupby').field;

  var fields = this._fieldsDef.map(function(field) {
    var f = util.duplicate(field);
    if (field.get) f.get = field.get;

    f.name = f.field.signal ? graph.signalRef(f.field.signal) : f.field;
    f.ops  = f.ops.signal ? graph.signalRef(f.ops.signal) :
      util.array(f.ops).map(function(o) {
        return o.signal ? graph.signalRef(o.signal) : o;
      });

    return f;
  });

  if (!fields.length) fields = {'*':'values'};

  var aggr = this._aggr = new Facetor()
    .groupby(groupby)
    .stream(true)
    .summarize(fields);

  if (this._type !== TYPES.VALUE) aggr.key('_id');
  return aggr;
};

prototype._reset = function(input, output) {
  output.rem.push.apply(output.rem, this.aggr().result());
  this.aggr().clear();
  this._aggr = null;
};

function spoof_prev(x) {
  var prev = this._prev[x._id] || (this._prev[x._id] = Object.create(x));
  return util.extend(prev, x._prev);
}

prototype.transform = function(input, reset) {
  log.debug(input, ['aggregate']);

  var output = ChangeSet.create(input);
  if (reset) this._reset(input, output);

  var t = this,
      tpl = this._type === TYPES.TUPLE, // reduce calls to standardize
      aggr = this.aggr();

  input.add.forEach(function(x) {
    aggr._add(tpl ? x : standardize.call(t, x));
  });

  input.mod.forEach(function(x) {
    if (reset) {
      // Signal change triggered reflow
      aggr._add(tpl ? x : standardize.call(t, x));
    } else {
      var y = Tuple.has_prev(x) ? spoof_prev.call(t, x) : x;
      aggr._mod(tpl ? x : standardize.call(t, x), 
        tpl ? y : standardize.call(t, y));
    }
  });

  input.rem.forEach(function(x) {
    var y = Tuple.has_prev(x) ? spoof_prev.call(t, x) : x;
    aggr._rem(tpl ? y : standardize.call(t, y));
    t._cache[x._id] = t._prev[x._id] = null;
  });

  return aggr.changes(input, output);
};

module.exports = Aggregate;
},{"./Facetor":115,"./Transform":127,"datalib/src/util":20,"vega-dataflow/src/ChangeSet":26,"vega-dataflow/src/Dependencies":29,"vega-dataflow/src/Tuple":34,"vega-logging":41}],111:[function(require,module,exports){
var Base = require('./Transform').prototype;

function BatchTransform() {
  // Funcptr to nearest shared upstream collector. 
  // Populated by the dataflow Graph during connection.
  this.data = null; 
}

var prototype = (BatchTransform.prototype = Object.create(Base));
prototype.constructor = BatchTransform;

prototype.init = function(graph) {
  Base.init.call(this, graph);
  return this.batch(true);
};

prototype.transform = function(input) {
  return this.batchTransform(input, this.data());
};

prototype.batchTransform = function(/* input, data */) {
};

module.exports = BatchTransform;
},{"./Transform":127}],112:[function(require,module,exports){
var bins = require('datalib/src/bins/bins'),
    Tuple = require('vega-dataflow/src/Tuple'),
    log = require('vega-logging'),
    Transform = require('./Transform');

function Bin(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    field: {type: 'field'},
    min: {type: 'value'},
    max: {type: 'value'},
    base: {type: 'value', default: 10},
    maxbins: {type: 'value', default: 20},
    step: {type: 'value'},
    steps: {type: 'value'},
    minstep: {type: 'value'},
    div: {type: 'array<value>', default: [5, 2]}
  });

  this._output = {'bin': 'bin'};
  return this;
}

var prototype = (Bin.prototype = Object.create(Transform.prototype));
prototype.constructor = Bin;

prototype.transform = function(input) {
  log.debug(input, ['binning']);

  var output  = this._output.bin,
      step    = this.param('step'),
      steps   = this.param('steps'),
      minstep = this.param('minstep'),
      get     = this.param('field').accessor,
      opt = {
        min: this.param('min'),
        max: this.param('max'),
        base: this.param('base'),
        maxbins: this.param('maxbins'),
        div: this.param('div')
      };

  if (step) opt.step = step;
  if (steps) opt.steps = steps;
  if (minstep) opt.minstep = minstep;
  var b = bins(opt);

  function update(d) {
    var v = get(d);
    v = v == null ? null
      : b.start + b.step * ~~((v - b.start) / b.step);
    Tuple.set(d, output, v, input.stamp);
  }
  input.add.forEach(update);
  input.mod.forEach(update);
  input.rem.forEach(update);

  return input;
};

module.exports = Bin;
},{"./Transform":127,"datalib/src/bins/bins":6,"vega-dataflow/src/Tuple":34,"vega-logging":41}],113:[function(require,module,exports){
var ChangeSet = require('vega-dataflow/src/ChangeSet'),
    Tuple = require('vega-dataflow/src/Tuple'),
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function Cross(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    with: {type: 'data'},
    diagonal: {type: 'value', default: 'true'}
  });

  this._output = {'left': 'a', 'right': 'b'};
  this._lastRem  = null; // Most recent stamp that rem occured. 
  this._lastWith = null; // Last time we crossed w/withds.
  this._ids   = {};
  this._cache = {};

  return this.router(true);
}

var prototype = (Cross.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Cross;

// Each cached incoming tuple also has a stamp to track if we need to do
// lazy filtering of removed tuples.
function cache(x, t) {
  var c = this._cache[x._id] = this._cache[x._id] || {c: [], s: this._stamp};
  c.c.push(t);
}

function add(output, left, data, diag, x) {
  var i = 0, len = data.length,
      prev = x._prev !== undefined ? null : undefined, 
      t, y, id;

  for (; i<len; ++i) {
    y = data[i];
    id = left ? x._id+'_'+y._id : y._id+'_'+x._id;
    if (this._ids[id]) continue;
    if (x._id == y._id && !diag) continue;

    t = Tuple.ingest({}, prev);
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

  if (this._lastRem > c.s) {  // Removed tuples haven't been filtered yet
    c.c = c.c.filter(function(y) {
      var t = y[cross._output[left ? 'right' : 'left']];
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
  if (input.add.length || input.rem.length) {
    output.fields[this._output.left]  = 1; 
    output.fields[this._output.right] = 1;
  }
}

prototype.batchTransform = function(input, data) {
  log.debug(input, ['crossing']);

  var w = this.param('with'),
      diag = this.param('diagonal'),
      selfCross = (!w.name),
      woutput = selfCross ? input : w.source.last(),
      wdata   = selfCross ? data : w.source.values(),
      output  = ChangeSet.create(input),
      r = rem.bind(this, output); 

  input.rem.forEach(r);
  input.add.forEach(add.bind(this, output, true, wdata, diag));

  if (!selfCross && woutput.stamp > this._lastWith) {
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
},{"./BatchTransform":111,"./Transform":127,"vega-dataflow/src/ChangeSet":26,"vega-dataflow/src/Tuple":34,"vega-logging":41}],114:[function(require,module,exports){
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
        return facet._pipeline.map(function(t) {
          return parse(facet._graph, t);
        });
      }      
    }
  });

  this._pipeline = [];
  Aggregate.call(this, graph);
}

var prototype = (Facet.prototype = Object.create(Aggregate.prototype));
prototype.constructor = Facet;

prototype.aggr = function() {
  return Aggregate.prototype.aggr.call(this).facet(this);
};

module.exports = Facet;
},{"../parse/transforms":100,"./Aggregate":110,"./Transform":127}],115:[function(require,module,exports){
var Aggregator = require('datalib/src/aggregate/aggregator'),
    Base = Aggregator.prototype,
    Flags = Aggregator.Flags,
    ChangeSet = require('vega-dataflow/src/ChangeSet'),
    Tuple = require('vega-dataflow/src/Tuple'),
    util = require('datalib/src/util'),
    log = require('vega-logging'),
    facetID = 1;

function Facetor() {
  Aggregator.call(this);
  this._facet = null;
}

var prototype = (Facetor.prototype = Object.create(Base));
prototype.constructor = Facetor;

prototype.facet = function(f) {
  if (!arguments.length) return this._facet;
  return (this._facet = f, this);
};

prototype._ingest = function(t) { 
  return Tuple.ingest(t, null);
};

prototype._assign = Tuple.set;

function disconnect_cell(facet) {
  log.debug({}, ["deleting cell", this.tuple._id]);
  var pipeline = this.ds.pipeline();
  facet.removeListener(pipeline[0]);
  facet._graph.disconnect(pipeline);
}

prototype._newcell = function(x) {
  var cell  = Base._newcell.call(this, x),
      facet = this._facet,
      tuple = cell.tuple,
      graph, pipeline;

  if (this._facet !== null) {
    graph = facet._graph;
    pipeline = facet.param('transform');
    cell.ds  = graph.data(tuple._facetID, pipeline, tuple);
    cell.delete = disconnect_cell;
    facet.addListener(pipeline[0]);
  }

  return cell;
};

prototype._newtuple = function(x) {
  var t = Base._newtuple.call(this, x);
  if (this._facet !== null) {
    Tuple.set(t, 'key', this._cellkey(x));
    Tuple.set(t, '_facetID', 'vg_'+(facetID++));
  }
  return t;
};

prototype.clear = function() {
  if (this._facet !== null) for (var k in this._cells) {
    this._cells[k].delete(this._facet);
  }
  return Base.clear.call(this);
};

prototype._add = function(x) {
  var cell = this._cell(x);
  Base._add.call(this, x);
  if (this._facet !== null) cell.ds._input.add.push(x);
};

prototype._mod = function(x, prev) {
  var cell0 = this._cell(prev),
      cell1 = this._cell(x);

  Base._mod.call(this, x, prev);
  if (this._facet !== null) {  // Propagate tuples
    if (cell0 === cell1) {
      cell0.ds._input.mod.push(x);
    } else {
      cell0.ds._input.rem.push(x);
      cell1.ds._input.add.push(x);
    }
  }
};

prototype._rem = function(x) {
  var cell = this._cell(x);
  Base._rem.call(this, x);
  if (this._facet !== null) cell.ds._input.rem.push(x);  
};

prototype.changes = function(input, output) {
  var aggr = this._aggr,
      cell, flag, i, k;

  function fields(k) { output.fields[k] = 1; }

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
        output.rem.push(cell.tuple);
      }
      if (this._facet !== null) cell.delete(this._facet);
      delete this._cells[k];
    } else {
      if (this._facet !== null) {
        // propagate sort, signals, fields, etc.
        ChangeSet.copy(input, cell.ds._input);
      }

      if (flag & Flags.ADD_CELL) {
        output.add.push(cell.tuple);
      } else if (flag & Flags.MOD_CELL) {
        output.mod.push(cell.tuple);
        util.keys(cell.tuple._prev).forEach(fields);
      }
    }

    cell.flag = 0;
  }

  this._rems = false;
  return output;
};

module.exports = Facetor;
},{"datalib/src/aggregate/aggregator":3,"datalib/src/util":20,"vega-dataflow/src/ChangeSet":26,"vega-dataflow/src/Tuple":34,"vega-logging":41}],116:[function(require,module,exports){
var ChangeSet = require('vega-dataflow/src/ChangeSet'),
    Deps = require('vega-dataflow/src/Dependencies'),
    log = require('vega-logging'),
    Transform = require('./Transform');

function Filter(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {test: {type: 'expr'}});

  this._skip = {};
  return this.router(true);
}

var prototype = (Filter.prototype = Object.create(Transform.prototype));
prototype.constructor = Filter;

prototype.transform = function(input) {
  log.debug(input, ['filtering']);

  var output = ChangeSet.create(input),
      graph = this._graph,
      skip = this._skip,
      test = this.param('test'),
      signals = graph.signalValues(this.dependency(Deps.SIGNALS));

  input.rem.forEach(function(x) {
    if (skip[x._id] !== 1) output.rem.push(x);
    else skip[x._id] = 0;
  });

  input.add.forEach(function(x) {
    if (test(x, null, signals)) output.add.push(x);
    else skip[x._id] = 1;
  });

  input.mod.forEach(function(x) {
    var b = test(x, null, signals),
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
},{"./Transform":127,"vega-dataflow/src/ChangeSet":26,"vega-dataflow/src/Dependencies":29,"vega-logging":41}],117:[function(require,module,exports){
var ChangeSet = require('vega-dataflow/src/ChangeSet'),
    Tuple = require('vega-dataflow/src/Tuple'),
    log = require('vega-logging'),
    Transform = require('./Transform');

function Fold(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    fields: {type: 'array<field>'} 
  });

  this._output = {key: 'key', value: 'value'};
  this._cache = {};

  return this.router(true).revises(true);
}

var prototype = (Fold.prototype = Object.create(Transform.prototype));
prototype.constructor = Fold;

function rst(input, output) { 
  for (var id in this._cache) {
    output.rem.push.apply(output.rem, this._cache[id]);
  }
  this._cache = {};
}

function get_tuple(x, i, len) {
  var list = this._cache[x._id] || (this._cache[x._id] = Array(len));
  return list[i] || (list[i] = Tuple.derive(x, x._prev));
}

function fn(data, on, out) {
  var i, j, n, m, d, t;
  for (i=0, n=data.length; i<n; ++i) {
    d = data[i];
    for (j=0, m=on.field.length; j<m; ++j) {
      t = get_tuple.call(this, d, j, m);  
      Tuple.set(t, this._output.key, on.field[j]);
      Tuple.set(t, this._output.value, on.accessor[j](d));
      out.push(t);
    }      
  }
}

prototype.transform = function(input, reset) {
  log.debug(input, ['folding']);

  var fold = this,
      on = this.param('fields'),
      output = ChangeSet.create(input);

  if (reset) rst.call(this, input, output);

  fn.call(this, input.add, on, output.add);
  fn.call(this, input.mod, on, reset ? output.add : output.mod);
  input.rem.forEach(function(x) {
    output.rem.push.apply(output.rem, fold._cache[x._id]);
    fold._cache[x._id] = null;
  });

  // If we're only propagating values, don't mark key/value as updated.
  if (input.add.length || input.rem.length || 
      on.field.some(function(f) { return !!input.fields[f]; })) {
    output.fields[this._output.key] = 1;
    output.fields[this._output.value] = 1;
  }
  return output;
};

module.exports = Fold;
},{"./Transform":127,"vega-dataflow/src/ChangeSet":26,"vega-dataflow/src/Tuple":34,"vega-logging":41}],118:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    Tuple = require('vega-dataflow/src/Tuple'),
    log = require('vega-logging'),
    Transform = require('./Transform');

function Force(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    size: {type: 'array<value>', default: [500, 500]},
    links: {type: 'data'},
    linkDistance: {type: 'field|value', default: 20},
    linkStrength: {type: 'field|value', default: 1},
    charge: {type: 'field|value', default: -30},
    chargeDistance: {type: 'field|value', default: Infinity},
    iterations: {type: 'value', default: 500},
    friction: {type: 'value', default: 0.9},
    theta: {type: 'value', default: 0.8},
    gravity: {type: 'value', default: 0.1},
    alpha: {type: 'value', default: 0.1}
  });

  this._nodes  = [];
  this._links = [];
  this._layout = d3.layout.force();

  this._output = {
    'x': 'layout_x',
    'y': 'layout_y',
    'px': 'layout_px',
    'py': 'layout_py',
    'fixed': 'layout_fixed',
    'weight': 'layout_weight',
    'source': '_source',
    'target': '_target'
  };

  return this;
}

var prototype = (Force.prototype = Object.create(Transform.prototype));
prototype.constructor = Force;

prototype.transform = function(nodeInput) {
  log.debug(nodeInput, ['force']);

  // get variables
  var linkInput = this.param('links').source.last(),
      layout = this._layout,
      output = this._output,
      nodes = this._nodes,
      links = this._links,
      iter = this.param('iterations');

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
    Tuple.set(l, output.source, link.source.tuple);
    Tuple.set(l, output.target, link.target.tuple);
    links.push(link);
  });

  // TODO process 'mod' of edge source or target?

  // configure layout
  layout
    .size(this.param('size'))
    .linkDistance(this.param('linkDistance'))
    .linkStrength(this.param('linkStrength'))
    .charge(this.param('charge'))
    .chargeDistance(this.param('chargeDistance'))
    .friction(this.param('friction'))
    .theta(this.param('theta'))
    .gravity(this.param('gravity'))
    .alpha(this.param('alpha'))
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
    Tuple.set(n.tuple, output.x, n.x);
    Tuple.set(n.tuple, output.y, n.y);
    Tuple.set(n.tuple, output.px, n.px);
    Tuple.set(n.tuple, output.py, n.py);
    Tuple.set(n.tuple, output.fixed, n.fixed);
    Tuple.set(n.tuple, output.weight, n.weight);
  });

  // process removed nodes
  if (nodeInput.rem.length > 0) {
    this._nodes = Tuple.idFilter(nodes, nodeInput.rem);
  }

  // process removed edges
  if (linkInput.rem.length > 0) {
    this.links = Tuple.idFilter(links, linkInput.rem);
  }

  // return changeset
  nodeInput.fields[output.x] = 1;
  nodeInput.fields[output.y] = 1;
  return nodeInput;
};

module.exports = Force;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy90cmFuc2Zvcm1zL0ZvcmNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbInZhciBkMyA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93LmQzIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbC5kMyA6IG51bGwpLFxuICAgIFR1cGxlID0gcmVxdWlyZSgndmVnYS1kYXRhZmxvdy9zcmMvVHVwbGUnKSxcbiAgICBsb2cgPSByZXF1aXJlKCd2ZWdhLWxvZ2dpbmcnKSxcbiAgICBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpO1xuXG5mdW5jdGlvbiBGb3JjZShncmFwaCkge1xuICBUcmFuc2Zvcm0ucHJvdG90eXBlLmluaXQuY2FsbCh0aGlzLCBncmFwaCk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICBzaXplOiB7dHlwZTogJ2FycmF5PHZhbHVlPicsIGRlZmF1bHQ6IFs1MDAsIDUwMF19LFxuICAgIGxpbmtzOiB7dHlwZTogJ2RhdGEnfSxcbiAgICBsaW5rRGlzdGFuY2U6IHt0eXBlOiAnZmllbGR8dmFsdWUnLCBkZWZhdWx0OiAyMH0sXG4gICAgbGlua1N0cmVuZ3RoOiB7dHlwZTogJ2ZpZWxkfHZhbHVlJywgZGVmYXVsdDogMX0sXG4gICAgY2hhcmdlOiB7dHlwZTogJ2ZpZWxkfHZhbHVlJywgZGVmYXVsdDogLTMwfSxcbiAgICBjaGFyZ2VEaXN0YW5jZToge3R5cGU6ICdmaWVsZHx2YWx1ZScsIGRlZmF1bHQ6IEluZmluaXR5fSxcbiAgICBpdGVyYXRpb25zOiB7dHlwZTogJ3ZhbHVlJywgZGVmYXVsdDogNTAwfSxcbiAgICBmcmljdGlvbjoge3R5cGU6ICd2YWx1ZScsIGRlZmF1bHQ6IDAuOX0sXG4gICAgdGhldGE6IHt0eXBlOiAndmFsdWUnLCBkZWZhdWx0OiAwLjh9LFxuICAgIGdyYXZpdHk6IHt0eXBlOiAndmFsdWUnLCBkZWZhdWx0OiAwLjF9LFxuICAgIGFscGhhOiB7dHlwZTogJ3ZhbHVlJywgZGVmYXVsdDogMC4xfVxuICB9KTtcblxuICB0aGlzLl9ub2RlcyAgPSBbXTtcbiAgdGhpcy5fbGlua3MgPSBbXTtcbiAgdGhpcy5fbGF5b3V0ID0gZDMubGF5b3V0LmZvcmNlKCk7XG5cbiAgdGhpcy5fb3V0cHV0ID0ge1xuICAgICd4JzogJ2xheW91dF94JyxcbiAgICAneSc6ICdsYXlvdXRfeScsXG4gICAgJ3B4JzogJ2xheW91dF9weCcsXG4gICAgJ3B5JzogJ2xheW91dF9weScsXG4gICAgJ2ZpeGVkJzogJ2xheW91dF9maXhlZCcsXG4gICAgJ3dlaWdodCc6ICdsYXlvdXRfd2VpZ2h0JyxcbiAgICAnc291cmNlJzogJ19zb3VyY2UnLFxuICAgICd0YXJnZXQnOiAnX3RhcmdldCdcbiAgfTtcblxuICByZXR1cm4gdGhpcztcbn1cblxudmFyIHByb3RvdHlwZSA9IChGb3JjZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFRyYW5zZm9ybS5wcm90b3R5cGUpKTtcbnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZvcmNlO1xuXG5wcm90b3R5cGUudHJhbnNmb3JtID0gZnVuY3Rpb24obm9kZUlucHV0KSB7XG4gIGxvZy5kZWJ1Zyhub2RlSW5wdXQsIFsnZm9yY2UnXSk7XG5cbiAgLy8gZ2V0IHZhcmlhYmxlc1xuICB2YXIgbGlua0lucHV0ID0gdGhpcy5wYXJhbSgnbGlua3MnKS5zb3VyY2UubGFzdCgpLFxuICAgICAgbGF5b3V0ID0gdGhpcy5fbGF5b3V0LFxuICAgICAgb3V0cHV0ID0gdGhpcy5fb3V0cHV0LFxuICAgICAgbm9kZXMgPSB0aGlzLl9ub2RlcyxcbiAgICAgIGxpbmtzID0gdGhpcy5fbGlua3MsXG4gICAgICBpdGVyID0gdGhpcy5wYXJhbSgnaXRlcmF0aW9ucycpO1xuXG4gIC8vIHByb2Nlc3MgYWRkZWQgbm9kZXNcbiAgbm9kZUlucHV0LmFkZC5mb3JFYWNoKGZ1bmN0aW9uKG4pIHtcbiAgICBub2Rlcy5wdXNoKHt0dXBsZTogbn0pO1xuICB9KTtcblxuICAvLyBwcm9jZXNzIGFkZGVkIGVkZ2VzXG4gIGxpbmtJbnB1dC5hZGQuZm9yRWFjaChmdW5jdGlvbihsKSB7XG4gICAgdmFyIGxpbmsgPSB7XG4gICAgICB0dXBsZTogbCxcbiAgICAgIHNvdXJjZTogbm9kZXNbbC5zb3VyY2VdLFxuICAgICAgdGFyZ2V0OiBub2Rlc1tsLnRhcmdldF1cbiAgICB9O1xuICAgIFR1cGxlLnNldChsLCBvdXRwdXQuc291cmNlLCBsaW5rLnNvdXJjZS50dXBsZSk7XG4gICAgVHVwbGUuc2V0KGwsIG91dHB1dC50YXJnZXQsIGxpbmsudGFyZ2V0LnR1cGxlKTtcbiAgICBsaW5rcy5wdXNoKGxpbmspO1xuICB9KTtcblxuICAvLyBUT0RPIHByb2Nlc3MgJ21vZCcgb2YgZWRnZSBzb3VyY2Ugb3IgdGFyZ2V0P1xuXG4gIC8vIGNvbmZpZ3VyZSBsYXlvdXRcbiAgbGF5b3V0XG4gICAgLnNpemUodGhpcy5wYXJhbSgnc2l6ZScpKVxuICAgIC5saW5rRGlzdGFuY2UodGhpcy5wYXJhbSgnbGlua0Rpc3RhbmNlJykpXG4gICAgLmxpbmtTdHJlbmd0aCh0aGlzLnBhcmFtKCdsaW5rU3RyZW5ndGgnKSlcbiAgICAuY2hhcmdlKHRoaXMucGFyYW0oJ2NoYXJnZScpKVxuICAgIC5jaGFyZ2VEaXN0YW5jZSh0aGlzLnBhcmFtKCdjaGFyZ2VEaXN0YW5jZScpKVxuICAgIC5mcmljdGlvbih0aGlzLnBhcmFtKCdmcmljdGlvbicpKVxuICAgIC50aGV0YSh0aGlzLnBhcmFtKCd0aGV0YScpKVxuICAgIC5ncmF2aXR5KHRoaXMucGFyYW0oJ2dyYXZpdHknKSlcbiAgICAuYWxwaGEodGhpcy5wYXJhbSgnYWxwaGEnKSlcbiAgICAubm9kZXMobm9kZXMpXG4gICAgLmxpbmtzKGxpbmtzKTtcblxuICAvLyBydW4gbGF5b3V0XG4gIGxheW91dC5zdGFydCgpO1xuICBmb3IgKHZhciBpPTA7IGk8aXRlcjsgKytpKSB7XG4gICAgbGF5b3V0LnRpY2soKTtcbiAgfVxuICBsYXlvdXQuc3RvcCgpO1xuXG4gIC8vIGNvcHkgbGF5b3V0IHZhbHVlcyB0byBub2Rlc1xuICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uKG4pIHtcbiAgICBUdXBsZS5zZXQobi50dXBsZSwgb3V0cHV0LngsIG4ueCk7XG4gICAgVHVwbGUuc2V0KG4udHVwbGUsIG91dHB1dC55LCBuLnkpO1xuICAgIFR1cGxlLnNldChuLnR1cGxlLCBvdXRwdXQucHgsIG4ucHgpO1xuICAgIFR1cGxlLnNldChuLnR1cGxlLCBvdXRwdXQucHksIG4ucHkpO1xuICAgIFR1cGxlLnNldChuLnR1cGxlLCBvdXRwdXQuZml4ZWQsIG4uZml4ZWQpO1xuICAgIFR1cGxlLnNldChuLnR1cGxlLCBvdXRwdXQud2VpZ2h0LCBuLndlaWdodCk7XG4gIH0pO1xuXG4gIC8vIHByb2Nlc3MgcmVtb3ZlZCBub2Rlc1xuICBpZiAobm9kZUlucHV0LnJlbS5sZW5ndGggPiAwKSB7XG4gICAgdGhpcy5fbm9kZXMgPSBUdXBsZS5pZEZpbHRlcihub2Rlcywgbm9kZUlucHV0LnJlbSk7XG4gIH1cblxuICAvLyBwcm9jZXNzIHJlbW92ZWQgZWRnZXNcbiAgaWYgKGxpbmtJbnB1dC5yZW0ubGVuZ3RoID4gMCkge1xuICAgIHRoaXMubGlua3MgPSBUdXBsZS5pZEZpbHRlcihsaW5rcywgbGlua0lucHV0LnJlbSk7XG4gIH1cblxuICAvLyByZXR1cm4gY2hhbmdlc2V0XG4gIG5vZGVJbnB1dC5maWVsZHNbb3V0cHV0LnhdID0gMTtcbiAgbm9kZUlucHV0LmZpZWxkc1tvdXRwdXQueV0gPSAxO1xuICByZXR1cm4gbm9kZUlucHV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb3JjZTsiXX0=
},{"./Transform":127,"vega-dataflow/src/Tuple":34,"vega-logging":41}],119:[function(require,module,exports){
var Tuple = require('vega-dataflow/src/Tuple'),
    Deps = require('vega-dataflow/src/Dependencies'),
    log = require('vega-logging'),
    Transform = require('./Transform');

function Formula(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    field: {type: 'value'},
    expr:  {type: 'expr'}
  });

  return this;
}

var prototype = (Formula.prototype = Object.create(Transform.prototype));
prototype.constructor = Formula;

prototype.transform = function(input) {
  log.debug(input, ['formulating']);

  var g = this._graph,
      field = this.param('field'),
      expr = this.param('expr'),
      signals = g.signalValues(this.dependency(Deps.SIGNALS));

  function set(x) {
    Tuple.set(x, field, expr(x, null, signals));
  }

  input.add.forEach(set);
  
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
  }

  input.fields[field] = 1;
  return input;
};

module.exports = Formula;
},{"./Transform":127,"vega-dataflow/src/Dependencies":29,"vega-dataflow/src/Tuple":34,"vega-logging":41}],120:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    util = require('datalib/src/util'),
    Tuple = require('vega-dataflow/src/Tuple'),
    log = require('vega-logging'),
    Transform = require('./Transform');

function Geo(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, Geo.Parameters);
  Transform.addParameters(this, {
    lon: {type: 'field'},
    lat: {type: 'field'}
  });

  this._output = {
    'x': 'layout_x',
    'y': 'layout_y'
  };
  return this;
}

Geo.Parameters = {
  projection: {type: 'value', default: 'mercator'},
  center:     {type: 'array<value>'},
  translate:  {type: 'array<value>'},
  rotate:     {type: 'array<value>'},
  scale:      {type: 'value'},
  precision:  {type: 'value'},
  clipAngle:  {type: 'value'},
  clipExtent: {type: 'value'}
};

Geo.d3Projection = function() {
  var p = this.param('projection'),
      param = Geo.Parameters,
      proj, name, value;

  if (p !== this._mode) {
    this._mode = p;
    this._projection = d3.geo[p]();
  }
  proj = this._projection;

  for (name in param) {
    if (name === 'projection' || !proj[name]) continue;
    value = this.param(name);
    if (value === undefined || (util.isArray(value) && value.length === 0)) {
      continue;
    }
    if (value !== proj[name]()) {
      proj[name](value);
    }
  }

  return proj;
};

var prototype = (Geo.prototype = Object.create(Transform.prototype));
prototype.constructor = Geo;

prototype.transform = function(input) {
  log.debug(input, ['geo']);

  var output = this._output,
      lon = this.param('lon').accessor,
      lat = this.param('lat').accessor,
      proj = Geo.d3Projection.call(this);

  function set(t) {
    var ll = [lon(t), lat(t)];
    var xy = proj(ll);
    Tuple.set(t, output.x, xy[0]);
    Tuple.set(t, output.y, xy[1]);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy90cmFuc2Zvcm1zL0dlby5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgICB1dGlsID0gcmVxdWlyZSgnZGF0YWxpYi9zcmMvdXRpbCcpLFxuICAgIFR1cGxlID0gcmVxdWlyZSgndmVnYS1kYXRhZmxvdy9zcmMvVHVwbGUnKSxcbiAgICBsb2cgPSByZXF1aXJlKCd2ZWdhLWxvZ2dpbmcnKSxcbiAgICBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuL1RyYW5zZm9ybScpO1xuXG5mdW5jdGlvbiBHZW8oZ3JhcGgpIHtcbiAgVHJhbnNmb3JtLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgZ3JhcGgpO1xuICBUcmFuc2Zvcm0uYWRkUGFyYW1ldGVycyh0aGlzLCBHZW8uUGFyYW1ldGVycyk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICBsb246IHt0eXBlOiAnZmllbGQnfSxcbiAgICBsYXQ6IHt0eXBlOiAnZmllbGQnfVxuICB9KTtcblxuICB0aGlzLl9vdXRwdXQgPSB7XG4gICAgJ3gnOiAnbGF5b3V0X3gnLFxuICAgICd5JzogJ2xheW91dF95J1xuICB9O1xuICByZXR1cm4gdGhpcztcbn1cblxuR2VvLlBhcmFtZXRlcnMgPSB7XG4gIHByb2plY3Rpb246IHt0eXBlOiAndmFsdWUnLCBkZWZhdWx0OiAnbWVyY2F0b3InfSxcbiAgY2VudGVyOiAgICAge3R5cGU6ICdhcnJheTx2YWx1ZT4nfSxcbiAgdHJhbnNsYXRlOiAge3R5cGU6ICdhcnJheTx2YWx1ZT4nfSxcbiAgcm90YXRlOiAgICAge3R5cGU6ICdhcnJheTx2YWx1ZT4nfSxcbiAgc2NhbGU6ICAgICAge3R5cGU6ICd2YWx1ZSd9LFxuICBwcmVjaXNpb246ICB7dHlwZTogJ3ZhbHVlJ30sXG4gIGNsaXBBbmdsZTogIHt0eXBlOiAndmFsdWUnfSxcbiAgY2xpcEV4dGVudDoge3R5cGU6ICd2YWx1ZSd9XG59O1xuXG5HZW8uZDNQcm9qZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwID0gdGhpcy5wYXJhbSgncHJvamVjdGlvbicpLFxuICAgICAgcGFyYW0gPSBHZW8uUGFyYW1ldGVycyxcbiAgICAgIHByb2osIG5hbWUsIHZhbHVlO1xuXG4gIGlmIChwICE9PSB0aGlzLl9tb2RlKSB7XG4gICAgdGhpcy5fbW9kZSA9IHA7XG4gICAgdGhpcy5fcHJvamVjdGlvbiA9IGQzLmdlb1twXSgpO1xuICB9XG4gIHByb2ogPSB0aGlzLl9wcm9qZWN0aW9uO1xuXG4gIGZvciAobmFtZSBpbiBwYXJhbSkge1xuICAgIGlmIChuYW1lID09PSAncHJvamVjdGlvbicgfHwgIXByb2pbbmFtZV0pIGNvbnRpbnVlO1xuICAgIHZhbHVlID0gdGhpcy5wYXJhbShuYW1lKTtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCAodXRpbC5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDApKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKHZhbHVlICE9PSBwcm9qW25hbWVdKCkpIHtcbiAgICAgIHByb2pbbmFtZV0odmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwcm9qO1xufTtcblxudmFyIHByb3RvdHlwZSA9IChHZW8ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUcmFuc2Zvcm0ucHJvdG90eXBlKSk7XG5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBHZW87XG5cbnByb3RvdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCkge1xuICBsb2cuZGVidWcoaW5wdXQsIFsnZ2VvJ10pO1xuXG4gIHZhciBvdXRwdXQgPSB0aGlzLl9vdXRwdXQsXG4gICAgICBsb24gPSB0aGlzLnBhcmFtKCdsb24nKS5hY2Nlc3NvcixcbiAgICAgIGxhdCA9IHRoaXMucGFyYW0oJ2xhdCcpLmFjY2Vzc29yLFxuICAgICAgcHJvaiA9IEdlby5kM1Byb2plY3Rpb24uY2FsbCh0aGlzKTtcblxuICBmdW5jdGlvbiBzZXQodCkge1xuICAgIHZhciBsbCA9IFtsb24odCksIGxhdCh0KV07XG4gICAgdmFyIHh5ID0gcHJvaihsbCk7XG4gICAgVHVwbGUuc2V0KHQsIG91dHB1dC54LCB4eVswXSk7XG4gICAgVHVwbGUuc2V0KHQsIG91dHB1dC55LCB4eVsxXSk7XG4gIH1cblxuICBpbnB1dC5hZGQuZm9yRWFjaChzZXQpO1xuICBpZiAodGhpcy5yZWV2YWx1YXRlKGlucHV0KSkge1xuICAgIGlucHV0Lm1vZC5mb3JFYWNoKHNldCk7XG4gICAgaW5wdXQucmVtLmZvckVhY2goc2V0KTtcbiAgfVxuXG4gIGlucHV0LmZpZWxkc1tvdXRwdXQueF0gPSAxO1xuICBpbnB1dC5maWVsZHNbb3V0cHV0LnldID0gMTtcbiAgcmV0dXJuIGlucHV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHZW87Il19
},{"./Transform":127,"datalib/src/util":20,"vega-dataflow/src/Tuple":34,"vega-logging":41}],121:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    util = require('datalib/src/util'),
    Tuple = require('vega-dataflow/src/Tuple'),
    log = require('vega-logging'),
    Geo = require('./Geo'),
    Transform = require('./Transform');

function GeoPath(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, Geo.Parameters);
  Transform.addParameters(this, {
    field: {type: 'field', default: null},
  });

  this._output = {
    'path': 'layout_path'
  };
  return this;
}

var prototype = (GeoPath.prototype = Object.create(Transform.prototype));
prototype.constructor = GeoPath;

prototype.transform = function(input) {
  log.debug(input, ['geopath']);

  var output = this._output,
      geojson = this.param('field').accessor || util.identity,
      proj = Geo.d3Projection.call(this),
      path = d3.geo.path().projection(proj);

  function set(t) {
    Tuple.set(t, output.path, path(geojson(t)));
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy90cmFuc2Zvcm1zL0dlb1BhdGguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgICB1dGlsID0gcmVxdWlyZSgnZGF0YWxpYi9zcmMvdXRpbCcpLFxuICAgIFR1cGxlID0gcmVxdWlyZSgndmVnYS1kYXRhZmxvdy9zcmMvVHVwbGUnKSxcbiAgICBsb2cgPSByZXF1aXJlKCd2ZWdhLWxvZ2dpbmcnKSxcbiAgICBHZW8gPSByZXF1aXJlKCcuL0dlbycpLFxuICAgIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vVHJhbnNmb3JtJyk7XG5cbmZ1bmN0aW9uIEdlb1BhdGgoZ3JhcGgpIHtcbiAgVHJhbnNmb3JtLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgZ3JhcGgpO1xuICBUcmFuc2Zvcm0uYWRkUGFyYW1ldGVycyh0aGlzLCBHZW8uUGFyYW1ldGVycyk7XG4gIFRyYW5zZm9ybS5hZGRQYXJhbWV0ZXJzKHRoaXMsIHtcbiAgICBmaWVsZDoge3R5cGU6ICdmaWVsZCcsIGRlZmF1bHQ6IG51bGx9LFxuICB9KTtcblxuICB0aGlzLl9vdXRwdXQgPSB7XG4gICAgJ3BhdGgnOiAnbGF5b3V0X3BhdGgnXG4gIH07XG4gIHJldHVybiB0aGlzO1xufVxuXG52YXIgcHJvdG90eXBlID0gKEdlb1BhdGgucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUcmFuc2Zvcm0ucHJvdG90eXBlKSk7XG5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBHZW9QYXRoO1xuXG5wcm90b3R5cGUudHJhbnNmb3JtID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgbG9nLmRlYnVnKGlucHV0LCBbJ2dlb3BhdGgnXSk7XG5cbiAgdmFyIG91dHB1dCA9IHRoaXMuX291dHB1dCxcbiAgICAgIGdlb2pzb24gPSB0aGlzLnBhcmFtKCdmaWVsZCcpLmFjY2Vzc29yIHx8IHV0aWwuaWRlbnRpdHksXG4gICAgICBwcm9qID0gR2VvLmQzUHJvamVjdGlvbi5jYWxsKHRoaXMpLFxuICAgICAgcGF0aCA9IGQzLmdlby5wYXRoKCkucHJvamVjdGlvbihwcm9qKTtcblxuICBmdW5jdGlvbiBzZXQodCkge1xuICAgIFR1cGxlLnNldCh0LCBvdXRwdXQucGF0aCwgcGF0aChnZW9qc29uKHQpKSk7XG4gIH1cblxuICBpbnB1dC5hZGQuZm9yRWFjaChzZXQpO1xuICBpZiAodGhpcy5yZWV2YWx1YXRlKGlucHV0KSkge1xuICAgIGlucHV0Lm1vZC5mb3JFYWNoKHNldCk7XG4gICAgaW5wdXQucmVtLmZvckVhY2goc2V0KTtcbiAgfVxuXG4gIGlucHV0LmZpZWxkc1tvdXRwdXQucGF0aF0gPSAxO1xuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdlb1BhdGg7Il19
},{"./Geo":120,"./Transform":127,"datalib/src/util":20,"vega-dataflow/src/Tuple":34,"vega-logging":41}],122:[function(require,module,exports){
var Tuple = require('vega-dataflow/src/Tuple'),
    log = require('vega-logging'),
    Transform = require('./Transform');

function LinkPath(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    source:  {type: 'field', default: '_source'},
    target:  {type: 'field', default: '_target'},
    x:       {type: 'field', default: 'layout_x'},
    y:       {type: 'field', default: 'layout_y'},
    tension: {type: 'value', default: 0.2},
    shape:   {type: 'value', default: 'line'}
  });

  this._output = {'path': 'layout_path'};
  return this;
}

var prototype = (LinkPath.prototype = Object.create(Transform.prototype));
prototype.constructor = LinkPath;

function line(d, source, target, x, y) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t);
  return 'M' + sx + ',' + sy +
         'L' + tx + ',' + ty;
}

function curve(d, source, target, x, y, tension) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t),
      dx = tx - sx,
      dy = ty - sy,
      ix = tension * (dx + dy),
      iy = tension * (dy - dx);
  return 'M' + sx + ',' + sy +
         'C' + (sx+ix) + ',' + (sy+iy) +
         ' ' + (tx+iy) + ',' + (ty-ix) +
         ' ' + tx + ',' + ty;
}

function diagonalX(d, source, target, x, y) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t),
      m = (sx + tx) / 2;
  return 'M' + sx + ',' + sy +
         'C' + m  + ',' + sy +
         ' ' + m  + ',' + ty +
         ' ' + tx + ',' + ty;
}

function diagonalY(d, source, target, x, y) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t),
      m = (sy + ty) / 2;
  return 'M' + sx + ',' + sy +
         'C' + sx + ',' + m +
         ' ' + tx + ',' + m +
         ' ' + tx + ',' + ty;
}

var shapes = {
  line:      line,
  curve:     curve,
  diagonal:  diagonalX,
  diagonalX: diagonalX,
  diagonalY: diagonalY
};

prototype.transform = function(input) {
  log.debug(input, ['linkpath']);

  var output = this._output,
      shape = shapes[this.param('shape')] || shapes.line,
      source = this.param('source').accessor,
      target = this.param('target').accessor,
      x = this.param('x').accessor,
      y = this.param('y').accessor,
      tension = this.param('tension');
  
  function set(t) {
    var path = shape(t, source, target, x, y, tension);
    Tuple.set(t, output.path, path);
  }

  input.add.forEach(set);
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
  }

  input.fields[output.path] = 1;
  return input;
};

module.exports = LinkPath;
},{"./Transform":127,"vega-dataflow/src/Tuple":34,"vega-logging":41}],123:[function(require,module,exports){
var util = require('datalib/src/util'),
    Deps = require('vega-dataflow/src/Dependencies'),
    expr = require('../parse/expr');

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

var prototype = Parameter.prototype;

function get() {
  var isArray = arrayType.test(this._type),
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type);

  var val = isArray ? this._value : this._value[0],
      acc = isArray ? this._accessors : this._accessors[0];

  if (!util.isValid(acc) && valType.test(this._type)) {
    return val;
  } else {
    return isData ? { name: val, source: acc } :
    isField ? { field: val, accessor: acc } : val;
  }
}

prototype.get = function() {
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
        util.accessor(val) : this._accessors[idx];
    }

    this._value[idx] = val;
  }

  return get.call(this);
};

prototype.set = function(value) {
  var p = this,
      isExpr = exprType.test(this._type),
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type);

  this._value = util.array(value).map(function(v, i) {
    if (util.isString(v)) {
      if (isExpr) {
        var e = expr(v);
        p._transform.dependency(Deps.FIELDS,  e.fields);
        p._transform.dependency(Deps.SIGNALS, e.globals);
        return e.fn;
      } else if (isField) {  // Backwards compatibility
        p._accessors[i] = util.accessor(v);
        p._transform.dependency(Deps.FIELDS, v);
      } else if (isData) {
        p._resolution = true;
        p._transform.dependency(Deps.DATA, v);
      }
      return v;
    } else if (v.value !== undefined) {
      return v.value;
    } else if (v.field !== undefined) {
      p._accessors[i] = util.accessor(v.field);
      p._transform.dependency(Deps.FIELDS, v.field);
      return v.field;
    } else if (v.signal !== undefined) {
      p._resolution = true;
      p._signals[v.signal] = i;
      p._transform.dependency(Deps.SIGNALS, v.signal);
      return v.signal;
    }

    return v;
  });

  return p._transform;
};

module.exports = Parameter;
},{"../parse/expr":88,"datalib/src/util":20,"vega-dataflow/src/Dependencies":29}],124:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    gen  = require('datalib/src/generate'),
    Tuple = require('vega-dataflow/src/Tuple'),
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function Pie(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    field:      {type: "field", default: null},
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

var prototype = (Pie.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Pie;

function ones() { return 1; }

prototype.batchTransform = function(input, data) {
  log.debug(input, ['pie']);

  var output = this._output,
      field = this.param("field").accessor || ones,
      start = this.param("startAngle"),
      stop = this.param("endAngle"),
      sort = this.param("sort");

  var values = data.map(field),
      a = start,
      k = (stop - start) / d3.sum(values),
      index = gen.range(data.length),
      i, t, v;

  if (sort) {
    index.sort(function(a, b) {
      return values[a] - values[b];
    });
  }

  for (i=0; i<index.length; ++i) {
    t = data[index[i]];
    v = values[index[i]];
    Tuple.set(t, output.start, a);
    Tuple.set(t, output.mid, (a + 0.5 * v * k));
    Tuple.set(t, output.end, (a += v * k));
  }

  input.fields[output.start] = 1;
  input.fields[output.end] = 1;
  input.fields[output.mid] = 1;
  return input;
};

module.exports = Pie;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy90cmFuc2Zvcm1zL1BpZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZDMgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdy5kMyA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwuZDMgOiBudWxsKSxcbiAgICBnZW4gID0gcmVxdWlyZSgnZGF0YWxpYi9zcmMvZ2VuZXJhdGUnKSxcbiAgICBUdXBsZSA9IHJlcXVpcmUoJ3ZlZ2EtZGF0YWZsb3cvc3JjL1R1cGxlJyksXG4gICAgbG9nID0gcmVxdWlyZSgndmVnYS1sb2dnaW5nJyksXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICBCYXRjaFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vQmF0Y2hUcmFuc2Zvcm0nKTtcblxuZnVuY3Rpb24gUGllKGdyYXBoKSB7XG4gIEJhdGNoVHJhbnNmb3JtLnByb3RvdHlwZS5pbml0LmNhbGwodGhpcywgZ3JhcGgpO1xuICBUcmFuc2Zvcm0uYWRkUGFyYW1ldGVycyh0aGlzLCB7XG4gICAgZmllbGQ6ICAgICAge3R5cGU6IFwiZmllbGRcIiwgZGVmYXVsdDogbnVsbH0sXG4gICAgc3RhcnRBbmdsZToge3R5cGU6IFwidmFsdWVcIiwgZGVmYXVsdDogMH0sXG4gICAgZW5kQW5nbGU6ICAge3R5cGU6IFwidmFsdWVcIiwgZGVmYXVsdDogMiAqIE1hdGguUEl9LFxuICAgIHNvcnQ6ICAgICAgIHt0eXBlOiBcInZhbHVlXCIsIGRlZmF1bHQ6IGZhbHNlfVxuICB9KTtcblxuICB0aGlzLl9vdXRwdXQgPSB7XG4gICAgXCJzdGFydFwiOiBcImxheW91dF9zdGFydFwiLFxuICAgIFwiZW5kXCI6ICAgXCJsYXlvdXRfZW5kXCIsXG4gICAgXCJtaWRcIjogICBcImxheW91dF9taWRcIlxuICB9O1xuXG4gIHJldHVybiB0aGlzO1xufVxuXG52YXIgcHJvdG90eXBlID0gKFBpZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhdGNoVHJhbnNmb3JtLnByb3RvdHlwZSkpO1xucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUGllO1xuXG5mdW5jdGlvbiBvbmVzKCkgeyByZXR1cm4gMTsgfVxuXG5wcm90b3R5cGUuYmF0Y2hUcmFuc2Zvcm0gPSBmdW5jdGlvbihpbnB1dCwgZGF0YSkge1xuICBsb2cuZGVidWcoaW5wdXQsIFsncGllJ10pO1xuXG4gIHZhciBvdXRwdXQgPSB0aGlzLl9vdXRwdXQsXG4gICAgICBmaWVsZCA9IHRoaXMucGFyYW0oXCJmaWVsZFwiKS5hY2Nlc3NvciB8fCBvbmVzLFxuICAgICAgc3RhcnQgPSB0aGlzLnBhcmFtKFwic3RhcnRBbmdsZVwiKSxcbiAgICAgIHN0b3AgPSB0aGlzLnBhcmFtKFwiZW5kQW5nbGVcIiksXG4gICAgICBzb3J0ID0gdGhpcy5wYXJhbShcInNvcnRcIik7XG5cbiAgdmFyIHZhbHVlcyA9IGRhdGEubWFwKGZpZWxkKSxcbiAgICAgIGEgPSBzdGFydCxcbiAgICAgIGsgPSAoc3RvcCAtIHN0YXJ0KSAvIGQzLnN1bSh2YWx1ZXMpLFxuICAgICAgaW5kZXggPSBnZW4ucmFuZ2UoZGF0YS5sZW5ndGgpLFxuICAgICAgaSwgdCwgdjtcblxuICBpZiAoc29ydCkge1xuICAgIGluZGV4LnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgcmV0dXJuIHZhbHVlc1thXSAtIHZhbHVlc1tiXTtcbiAgICB9KTtcbiAgfVxuXG4gIGZvciAoaT0wOyBpPGluZGV4Lmxlbmd0aDsgKytpKSB7XG4gICAgdCA9IGRhdGFbaW5kZXhbaV1dO1xuICAgIHYgPSB2YWx1ZXNbaW5kZXhbaV1dO1xuICAgIFR1cGxlLnNldCh0LCBvdXRwdXQuc3RhcnQsIGEpO1xuICAgIFR1cGxlLnNldCh0LCBvdXRwdXQubWlkLCAoYSArIDAuNSAqIHYgKiBrKSk7XG4gICAgVHVwbGUuc2V0KHQsIG91dHB1dC5lbmQsIChhICs9IHYgKiBrKSk7XG4gIH1cblxuICBpbnB1dC5maWVsZHNbb3V0cHV0LnN0YXJ0XSA9IDE7XG4gIGlucHV0LmZpZWxkc1tvdXRwdXQuZW5kXSA9IDE7XG4gIGlucHV0LmZpZWxkc1tvdXRwdXQubWlkXSA9IDE7XG4gIHJldHVybiBpbnB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGllOyJdfQ==
},{"./BatchTransform":111,"./Transform":127,"datalib/src/generate":7,"vega-dataflow/src/Tuple":34,"vega-logging":41}],125:[function(require,module,exports){
var util = require('datalib/src/util'),
    log  = require('vega-logging'),
    Transform = require('./Transform');

function Sort(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {by: {type: 'array<field>'} });
  this.router(true);
}

var prototype = (Sort.prototype = Object.create(Transform.prototype));
prototype.constructor = Sort;

prototype.transform = function(input) {
  log.debug(input, ['sorting']);

  if (input.add.length || input.mod.length || input.rem.length) {
    input.sort = util.comparator(this.param('by').field);
  }
  return input;
};

module.exports = Sort;
},{"./Transform":127,"datalib/src/util":20,"vega-logging":41}],126:[function(require,module,exports){
var util = require('datalib/src/util'),
    Tuple = require('vega-dataflow/src/Tuple'),
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function Stack(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    groupby: {type: 'array<field>'},
    sortby: {type: 'array<field>'},
    field: {type: 'field'},
    offset: {type: 'value', default: 'zero'}
  });

  this._output = {
    'start': 'layout_start',
    'end':   'layout_end',
    'mid':   'layout_mid'
  };
  return this;
}

var prototype = (Stack.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Stack;

prototype.batchTransform = function(input, data) {
  log.debug(input, ['stacking']);

  var groupby = this.param('groupby').accessor,
      sortby = util.comparator(this.param('sortby').field),
      field = this.param('field').accessor,
      offset = this.param('offset'),
      output = this._output;

  // partition, sum, and sort the stack groups
  var groups = partition(data, groupby, sortby, field);

  // compute stack layouts per group
  for (var i=0, max=groups.max; i<groups.length; ++i) {
    var group = groups[i],
        sum = group.sum,
        off = offset==='center' ? (max - sum)/2 : 0,
        scale = offset==='normalize' ? (1/sum) : 1,
        j, x, a, b = off, v = 0;

    // set stack coordinates for each datum in group
    for (j=0; j<group.length; ++j) {
      x = group[j];
      a = b; // use previous value for start point
      v += field(x);
      b = scale * v + off; // compute end point
      Tuple.set(x, output.start, a);
      Tuple.set(x, output.end, b);
      Tuple.set(x, output.mid, 0.5 * (a + b));
    }
  }

  input.fields[output.start] = 1;
  input.fields[output.end] = 1;
  input.fields[output.mid] = 1;
  return input;
};

function partition(data, groupby, sortby, field) {
  var groups = [],
      get = function(f) { return f(x); },
      map, i, x, k, g, s, max;

  // partition data points into stack groups
  if (groupby == null) {
    groups.push(data.slice());
  } else {
    for (map={}, i=0; i<data.length; ++i) {
      x = data[i];
      k = groupby.map(get);
      g = map[k] || (groups.push(map[k] = []), map[k]);
      g.push(x);
    }
  }

  // compute sums of groups, sort groups as needed
  for (k=0, max=0; k<groups.length; ++k) {
    g = groups[k];
    for (i=0, s=0; i<g.length; ++i) {
      s += field(g[i]);
    }
    g.sum = s;
    if (s > max) max = s;
    if (sortby != null) g.sort(sortby);
  }
  groups.max = max;

  return groups;
}

module.exports = Stack;
},{"./BatchTransform":111,"./Transform":127,"datalib/src/util":20,"vega-dataflow/src/Tuple":34,"vega-logging":41}],127:[function(require,module,exports){
var Base = require('vega-dataflow/src/Node').prototype, // jshint ignore:line
    Deps = require('vega-dataflow/src/Dependencies'),
    Parameter = require('./Parameter');

function Transform(graph) {
  if (graph) Base.init.call(this, graph);
}

Transform.addParameters = function(proto, params) {
  proto._parameters = proto._parameters || {};
  for (var name in params) {
    var p = params[name],
        param = new Parameter(name, p.type, proto);

    proto._parameters[name] = param;

    if (p.type === 'custom') {
      if (p.set) param.set = p.set.bind(param);
      if (p.get) param.get = p.get.bind(param);
    }

    if (p.hasOwnProperty('default')) param.set(p.default);
  }
};

var prototype = (Transform.prototype = Object.create(Base));
prototype.constructor = Transform;

prototype.param = function(name, value) {
  var param = this._parameters[name];
  return (param === undefined) ? this :
    (arguments.length === 1) ? param.get() : param.set(value);
};

// Perform transformation. Subclasses should override.
prototype.transform = function(input/*, reset */) {
  return input;
};

prototype.evaluate = function(input) {
  // Many transforms store caches that must be invalidated if
  // a signal value has changed. 
  var reset = this._stamp < input.stamp &&
    this.dependency(Deps.SIGNALS).some(function(s) { 
      return !!input.signals[s];
    });
  return this.transform(input, reset);
};

prototype.output = function(map) {
  for (var key in this._output) {
    if (map[key] !== undefined) {
      this._output[key] = map[key];
    }
  }
  return this;
};

module.exports = Transform;
},{"./Parameter":123,"vega-dataflow/src/Dependencies":29,"vega-dataflow/src/Node":31}],128:[function(require,module,exports){
(function (global){
var d3 = (typeof window !== "undefined" ? window.d3 : typeof global !== "undefined" ? global.d3 : null),
    util = require('datalib/src/util'),
    Tuple = require('vega-dataflow/src/Tuple'),
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

var defaultRatio = 0.5 * (1 + Math.sqrt(5));

function Treemap(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    // hierarchy parameters
    sort: {type: 'array<field>', default: ['-value']},
    children: {type: 'field', default: 'children'},
    field: {type: 'field', default: 'value'},
    // treemap parameters
    size: {type: 'array<value>', default: [500, 500]},
    round: {type: 'value', default: true},
    sticky: {type: 'value', default: false},
    ratio: {type: 'value', default: defaultRatio},
    padding: {type: 'value', default: null},
    mode: {type: 'value', default: 'squarify'}
  });

  this._layout = d3.layout.treemap();

  this._output = {
    'x':      'layout_x',
    'y':      'layout_y',
    'width':  'layout_width',
    'height': 'layout_height',
    'depth':  'layout_depth',
  };
  return this;
}

var prototype = (Treemap.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Treemap;

prototype.batchTransform = function(input, data) {
  log.debug(input, ['treemap']);

  // get variables
  var layout = this._layout,
      output = this._output;

  // configure layout
  layout
    .sort(util.comparator(this.param('sort').field))
    .children(this.param('children').accessor)
    .value(this.param('field').accessor)
    .size(this.param('size'))
    .round(this.param('round'))
    .sticky(this.param('sticky'))
    .ratio(this.param('ratio'))
    .padding(this.param('padding'))
    .mode(this.param('mode'))
    .nodes(data[0]);

  // copy layout values to nodes
  data.forEach(function(n) {
    Tuple.set(n, output.x, n.x);
    Tuple.set(n, output.y, n.y);
    Tuple.set(n, output.width, n.dx);
    Tuple.set(n, output.height, n.dy);
    Tuple.set(n, output.depth, n.depth);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy90cmFuc2Zvcm1zL1RyZWVtYXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGQzID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cuZDMgOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsLmQzIDogbnVsbCksXG4gICAgdXRpbCA9IHJlcXVpcmUoJ2RhdGFsaWIvc3JjL3V0aWwnKSxcbiAgICBUdXBsZSA9IHJlcXVpcmUoJ3ZlZ2EtZGF0YWZsb3cvc3JjL1R1cGxlJyksXG4gICAgbG9nID0gcmVxdWlyZSgndmVnYS1sb2dnaW5nJyksXG4gICAgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICBCYXRjaFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vQmF0Y2hUcmFuc2Zvcm0nKTtcblxudmFyIGRlZmF1bHRSYXRpbyA9IDAuNSAqICgxICsgTWF0aC5zcXJ0KDUpKTtcblxuZnVuY3Rpb24gVHJlZW1hcChncmFwaCkge1xuICBCYXRjaFRyYW5zZm9ybS5wcm90b3R5cGUuaW5pdC5jYWxsKHRoaXMsIGdyYXBoKTtcbiAgVHJhbnNmb3JtLmFkZFBhcmFtZXRlcnModGhpcywge1xuICAgIC8vIGhpZXJhcmNoeSBwYXJhbWV0ZXJzXG4gICAgc29ydDoge3R5cGU6ICdhcnJheTxmaWVsZD4nLCBkZWZhdWx0OiBbJy12YWx1ZSddfSxcbiAgICBjaGlsZHJlbjoge3R5cGU6ICdmaWVsZCcsIGRlZmF1bHQ6ICdjaGlsZHJlbid9LFxuICAgIGZpZWxkOiB7dHlwZTogJ2ZpZWxkJywgZGVmYXVsdDogJ3ZhbHVlJ30sXG4gICAgLy8gdHJlZW1hcCBwYXJhbWV0ZXJzXG4gICAgc2l6ZToge3R5cGU6ICdhcnJheTx2YWx1ZT4nLCBkZWZhdWx0OiBbNTAwLCA1MDBdfSxcbiAgICByb3VuZDoge3R5cGU6ICd2YWx1ZScsIGRlZmF1bHQ6IHRydWV9LFxuICAgIHN0aWNreToge3R5cGU6ICd2YWx1ZScsIGRlZmF1bHQ6IGZhbHNlfSxcbiAgICByYXRpbzoge3R5cGU6ICd2YWx1ZScsIGRlZmF1bHQ6IGRlZmF1bHRSYXRpb30sXG4gICAgcGFkZGluZzoge3R5cGU6ICd2YWx1ZScsIGRlZmF1bHQ6IG51bGx9LFxuICAgIG1vZGU6IHt0eXBlOiAndmFsdWUnLCBkZWZhdWx0OiAnc3F1YXJpZnknfVxuICB9KTtcblxuICB0aGlzLl9sYXlvdXQgPSBkMy5sYXlvdXQudHJlZW1hcCgpO1xuXG4gIHRoaXMuX291dHB1dCA9IHtcbiAgICAneCc6ICAgICAgJ2xheW91dF94JyxcbiAgICAneSc6ICAgICAgJ2xheW91dF95JyxcbiAgICAnd2lkdGgnOiAgJ2xheW91dF93aWR0aCcsXG4gICAgJ2hlaWdodCc6ICdsYXlvdXRfaGVpZ2h0JyxcbiAgICAnZGVwdGgnOiAgJ2xheW91dF9kZXB0aCcsXG4gIH07XG4gIHJldHVybiB0aGlzO1xufVxuXG52YXIgcHJvdG90eXBlID0gKFRyZWVtYXAucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXRjaFRyYW5zZm9ybS5wcm90b3R5cGUpKTtcbnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRyZWVtYXA7XG5cbnByb3RvdHlwZS5iYXRjaFRyYW5zZm9ybSA9IGZ1bmN0aW9uKGlucHV0LCBkYXRhKSB7XG4gIGxvZy5kZWJ1ZyhpbnB1dCwgWyd0cmVlbWFwJ10pO1xuXG4gIC8vIGdldCB2YXJpYWJsZXNcbiAgdmFyIGxheW91dCA9IHRoaXMuX2xheW91dCxcbiAgICAgIG91dHB1dCA9IHRoaXMuX291dHB1dDtcblxuICAvLyBjb25maWd1cmUgbGF5b3V0XG4gIGxheW91dFxuICAgIC5zb3J0KHV0aWwuY29tcGFyYXRvcih0aGlzLnBhcmFtKCdzb3J0JykuZmllbGQpKVxuICAgIC5jaGlsZHJlbih0aGlzLnBhcmFtKCdjaGlsZHJlbicpLmFjY2Vzc29yKVxuICAgIC52YWx1ZSh0aGlzLnBhcmFtKCdmaWVsZCcpLmFjY2Vzc29yKVxuICAgIC5zaXplKHRoaXMucGFyYW0oJ3NpemUnKSlcbiAgICAucm91bmQodGhpcy5wYXJhbSgncm91bmQnKSlcbiAgICAuc3RpY2t5KHRoaXMucGFyYW0oJ3N0aWNreScpKVxuICAgIC5yYXRpbyh0aGlzLnBhcmFtKCdyYXRpbycpKVxuICAgIC5wYWRkaW5nKHRoaXMucGFyYW0oJ3BhZGRpbmcnKSlcbiAgICAubW9kZSh0aGlzLnBhcmFtKCdtb2RlJykpXG4gICAgLm5vZGVzKGRhdGFbMF0pO1xuXG4gIC8vIGNvcHkgbGF5b3V0IHZhbHVlcyB0byBub2Rlc1xuICBkYXRhLmZvckVhY2goZnVuY3Rpb24obikge1xuICAgIFR1cGxlLnNldChuLCBvdXRwdXQueCwgbi54KTtcbiAgICBUdXBsZS5zZXQobiwgb3V0cHV0LnksIG4ueSk7XG4gICAgVHVwbGUuc2V0KG4sIG91dHB1dC53aWR0aCwgbi5keCk7XG4gICAgVHVwbGUuc2V0KG4sIG91dHB1dC5oZWlnaHQsIG4uZHkpO1xuICAgIFR1cGxlLnNldChuLCBvdXRwdXQuZGVwdGgsIG4uZGVwdGgpO1xuICB9KTtcblxuICAvLyByZXR1cm4gY2hhbmdlc2V0XG4gIGlucHV0LmZpZWxkc1tvdXRwdXQueF0gPSAxO1xuICBpbnB1dC5maWVsZHNbb3V0cHV0LnldID0gMTtcbiAgaW5wdXQuZmllbGRzW291dHB1dC53aWR0aF0gPSAxO1xuICBpbnB1dC5maWVsZHNbb3V0cHV0LmhlaWdodF0gPSAxO1xuICByZXR1cm4gaW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVtYXA7Il19
},{"./BatchTransform":111,"./Transform":127,"datalib/src/util":20,"vega-dataflow/src/Tuple":34,"vega-logging":41}],129:[function(require,module,exports){
var util = require('datalib/src/util'),
    Collector = require('vega-dataflow/src/Collector'),
    log = require('vega-logging'),
    Transform = require('./Transform');

function Zip(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    with: {type: 'data'},
    as:  {type: 'value'},
    key: {type: 'field', default: 'data'},
    withKey: {type: 'field', default: null},
    default: {type: 'value'}
  });

  this._map = {};
  this._collector = new Collector(graph);
  this._lastJoin = 0;

  return this.revises(true);
}

var prototype = (Zip.prototype = Object.create(Transform.prototype));
prototype.constructor = Zip;

function mp(k) {
  return this._map[k] || (this._map[k] = []);
}

prototype.transform = function(input) {
  log.debug(input, ['zipping']);

  var w = this.param('with'),
      wds = w.source,
      woutput = wds.last(),
      wdata = wds.values(),
      key = this.param('key'),
      withKey = this.param('withKey'),
      as = this.param('as'),
      dflt = this.param('default'),
      map = mp.bind(this),
      rem = {};

  if (withKey.field) {
    if (woutput && woutput.stamp > this._lastJoin) {
      woutput.rem.forEach(function(x) {
        var m = map(withKey.accessor(x));
        if (m[0]) m[0].forEach(function(d) { d[as] = dflt; });
        m[1] = null;
      });

      woutput.add.forEach(function(x) { 
        var m = map(withKey.accessor(x));
        if (m[0]) m[0].forEach(function(d) { d[as] = x; });
        m[1] = x;
      });
      
      // Only process woutput.mod tuples if the join key has changed.
      // Other field updates will auto-propagate via prototype.
      if (woutput.fields[withKey.field]) {
        woutput.mod.forEach(function(x) {
          var prev;
          if (!x._prev || (prev = withKey.accessor(x._prev)) === undefined) return;
          var prevm = map(prev);
          if (prevm[0]) prevm[0].forEach(function(d) { d[as] = dflt; });
          prevm[1] = null;

          var m = map(withKey.accessor(x));
          if (m[0]) m[0].forEach(function(d) { d[as] = x; });
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

    util.keys(rem).forEach(function(k) { 
      var m = map(k);
      if (!m[0]) return;
      m[0] = m[0].filter(function(x) { return rem[k][x._id] !== 1; });
    });
  } else {
    // We only need to run a non-key-join again if we've got any add/rem
    // on input or woutput
    if (!(input.add.length || input.rem.length ||
          woutput.add.length || woutput.rem.length)) {
      return input;
    }

    // If we don't have a key-join, then we need to materialize both
    // data sources to iterate through them. 
    this._collector.evaluate(input);

    var data = this._collector.data(), 
        wlen = wdata.length, i;

    for (i=0; i<data.length; i++) {
      data[i][as] = wdata[i%wlen];
    }
  }

  input.fields[as] = 1;
  return input;
};

module.exports = Zip;
},{"./Transform":127,"datalib/src/util":20,"vega-dataflow/src/Collector":27,"vega-logging":41}],130:[function(require,module,exports){
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
},{"./Aggregate":110,"./Bin":112,"./Cross":113,"./Facet":114,"./Filter":116,"./Fold":117,"./Force":118,"./Formula":119,"./Geo":120,"./GeoPath":121,"./LinkPath":122,"./Pie":124,"./Sort":125,"./Stack":126,"./Treemap":128,"./Zip":129}]},{},[1])(1)
});
//# sourceMappingURL=vega.js.map
