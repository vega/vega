import { extend, identity, field, hasOwnProperty, extentIndex, inherits, array, accessorName, error, accessorFields, accessor, toNumber, merge, compare, truthy, extent, span, fastmap, isArray, key, ascending, peek, zero, constant } from 'vega-util';
import { tupleid, Transform, replace, ingest, stableCompare, Operator, derive, rederive } from 'vega-dataflow';
import { quartiles, bootstrapCI, bin, randomKDE, randomMixture, randomNormal, randomLogNormal, randomUniform, sampleCurve, dotbin, quantiles, random } from 'vega-statistics';
import { median, mean, min, max, range, bisector } from 'd3-array';
import { TIME_UNITS, utcInterval, timeInterval, timeBin, timeUnits, utcFloor, timeFloor } from 'vega-time';

function multikey(f) {
  return x => {
    const n = f.length;
    let i = 1,
      k = String(f[0](x));
    for (; i < n; ++i) {
      k += '|' + f[i](x);
    }
    return k;
  };
}
function groupkey(fields) {
  return !fields || !fields.length ? function () {
    return '';
  } : fields.length === 1 ? fields[0] : multikey(fields);
}

function measureName(op, field, as) {
  return as || op + (!field ? '' : '_' + field);
}
const noop = () => {};
const base_op = {
  init: noop,
  add: noop,
  rem: noop,
  idx: 0
};
const AggregateOps = {
  values: {
    init: m => m.cell.store = true,
    value: m => m.cell.data.values(),
    idx: -1
  },
  count: {
    value: m => m.cell.num
  },
  __count__: {
    value: m => m.missing + m.valid
  },
  missing: {
    value: m => m.missing
  },
  valid: {
    value: m => m.valid
  },
  sum: {
    init: m => m.sum = 0,
    value: m => m.sum,
    add: (m, v) => m.sum += +v,
    rem: (m, v) => m.sum -= v
  },
  product: {
    init: m => m.product = 1,
    value: m => m.valid ? m.product : undefined,
    add: (m, v) => m.product *= v,
    rem: (m, v) => m.product /= v
  },
  mean: {
    init: m => m.mean = 0,
    value: m => m.valid ? m.mean : undefined,
    add: (m, v) => (m.mean_d = v - m.mean, m.mean += m.mean_d / m.valid),
    rem: (m, v) => (m.mean_d = v - m.mean, m.mean -= m.valid ? m.mean_d / m.valid : m.mean)
  },
  average: {
    value: m => m.valid ? m.mean : undefined,
    req: ['mean'],
    idx: 1
  },
  variance: {
    init: m => m.dev = 0,
    value: m => m.valid > 1 ? m.dev / (m.valid - 1) : undefined,
    add: (m, v) => m.dev += m.mean_d * (v - m.mean),
    rem: (m, v) => m.dev -= m.mean_d * (v - m.mean),
    req: ['mean'],
    idx: 1
  },
  variancep: {
    value: m => m.valid > 1 ? m.dev / m.valid : undefined,
    req: ['variance'],
    idx: 2
  },
  stdev: {
    value: m => m.valid > 1 ? Math.sqrt(m.dev / (m.valid - 1)) : undefined,
    req: ['variance'],
    idx: 2
  },
  stdevp: {
    value: m => m.valid > 1 ? Math.sqrt(m.dev / m.valid) : undefined,
    req: ['variance'],
    idx: 2
  },
  stderr: {
    value: m => m.valid > 1 ? Math.sqrt(m.dev / (m.valid * (m.valid - 1))) : undefined,
    req: ['variance'],
    idx: 2
  },
  distinct: {
    value: m => m.cell.data.distinct(m.get),
    req: ['values'],
    idx: 3
  },
  ci0: {
    value: m => m.cell.data.ci0(m.get),
    req: ['values'],
    idx: 3
  },
  ci1: {
    value: m => m.cell.data.ci1(m.get),
    req: ['values'],
    idx: 3
  },
  median: {
    value: m => m.cell.data.q2(m.get),
    req: ['values'],
    idx: 3
  },
  q1: {
    value: m => m.cell.data.q1(m.get),
    req: ['values'],
    idx: 3
  },
  q3: {
    value: m => m.cell.data.q3(m.get),
    req: ['values'],
    idx: 3
  },
  min: {
    init: m => m.min = undefined,
    value: m => m.min = Number.isNaN(m.min) ? m.cell.data.min(m.get) : m.min,
    add: (m, v) => {
      if (v < m.min || m.min === undefined) m.min = v;
    },
    rem: (m, v) => {
      if (v <= m.min) m.min = NaN;
    },
    req: ['values'],
    idx: 4
  },
  max: {
    init: m => m.max = undefined,
    value: m => m.max = Number.isNaN(m.max) ? m.cell.data.max(m.get) : m.max,
    add: (m, v) => {
      if (v > m.max || m.max === undefined) m.max = v;
    },
    rem: (m, v) => {
      if (v >= m.max) m.max = NaN;
    },
    req: ['values'],
    idx: 4
  },
  argmin: {
    init: m => m.argmin = undefined,
    value: m => m.argmin || m.cell.data.argmin(m.get),
    add: (m, v, t) => {
      if (v < m.min) m.argmin = t;
    },
    rem: (m, v) => {
      if (v <= m.min) m.argmin = undefined;
    },
    req: ['min', 'values'],
    idx: 3
  },
  argmax: {
    init: m => m.argmax = undefined,
    value: m => m.argmax || m.cell.data.argmax(m.get),
    add: (m, v, t) => {
      if (v > m.max) m.argmax = t;
    },
    rem: (m, v) => {
      if (v >= m.max) m.argmax = undefined;
    },
    req: ['max', 'values'],
    idx: 3
  }
};
const ValidAggregateOps = Object.keys(AggregateOps).filter(d => d !== '__count__');
function measure(key, value) {
  return out => extend({
    name: key,
    out: out || key
  }, base_op, value);
}
[...ValidAggregateOps, '__count__'].forEach(key => {
  AggregateOps[key] = measure(key, AggregateOps[key]);
});
function createMeasure(op, name) {
  return AggregateOps[op](name);
}
function compareIndex(a, b) {
  return a.idx - b.idx;
}
function resolve(agg) {
  const map = {};
  agg.forEach(a => map[a.name] = a);
  const getreqs = a => {
    if (!a.req) return;
    a.req.forEach(key => {
      if (!map[key]) getreqs(map[key] = AggregateOps[key]());
    });
  };
  agg.forEach(getreqs);
  return Object.values(map).sort(compareIndex);
}
function init() {
  this.valid = 0;
  this.missing = 0;
  this._ops.forEach(op => op.init(this));
}
function add(v, t) {
  if (v == null || v === '') {
    ++this.missing;
    return;
  }
  if (v !== v) return;
  ++this.valid;
  this._ops.forEach(op => op.add(this, v, t));
}
function rem(v, t) {
  if (v == null || v === '') {
    --this.missing;
    return;
  }
  if (v !== v) return;
  --this.valid;
  this._ops.forEach(op => op.rem(this, v, t));
}
function set(t) {
  this._out.forEach(op => t[op.out] = op.value(this));
  return t;
}
function compileMeasures(agg, field) {
  const get = field || identity,
    ops = resolve(agg),
    out = agg.slice().sort(compareIndex);
  function ctr(cell) {
    this._ops = ops;
    this._out = out;
    this.cell = cell;
    this.init();
  }
  ctr.prototype.init = init;
  ctr.prototype.add = add;
  ctr.prototype.rem = rem;
  ctr.prototype.set = set;
  ctr.prototype.get = get;
  ctr.fields = agg.map(op => op.out);
  return ctr;
}

function TupleStore(key) {
  this._key = key ? field(key) : tupleid;
  this.reset();
}
const prototype$1 = TupleStore.prototype;
prototype$1.reset = function () {
  this._add = [];
  this._rem = [];
  this._ext = null;
  this._get = null;
  this._q = null;
};
prototype$1.add = function (v) {
  this._add.push(v);
};
prototype$1.rem = function (v) {
  this._rem.push(v);
};
prototype$1.values = function () {
  this._get = null;
  if (this._rem.length === 0) return this._add;
  const a = this._add,
    r = this._rem,
    k = this._key,
    n = a.length,
    m = r.length,
    x = Array(n - m),
    map = {};
  let i, j, v;

  // use unique key field to clear removed values
  for (i = 0; i < m; ++i) {
    map[k(r[i])] = 1;
  }
  for (i = 0, j = 0; i < n; ++i) {
    if (map[k(v = a[i])]) {
      map[k(v)] = 0;
    } else {
      x[j++] = v;
    }
  }
  this._rem = [];
  return this._add = x;
};

// memoizing statistics methods

prototype$1.distinct = function (get) {
  const v = this.values(),
    map = {};
  let n = v.length,
    count = 0,
    s;
  while (--n >= 0) {
    s = get(v[n]) + '';
    if (!hasOwnProperty(map, s)) {
      map[s] = 1;
      ++count;
    }
  }
  return count;
};
prototype$1.extent = function (get) {
  if (this._get !== get || !this._ext) {
    const v = this.values(),
      i = extentIndex(v, get);
    this._ext = [v[i[0]], v[i[1]]];
    this._get = get;
  }
  return this._ext;
};
prototype$1.argmin = function (get) {
  return this.extent(get)[0] || {};
};
prototype$1.argmax = function (get) {
  return this.extent(get)[1] || {};
};
prototype$1.min = function (get) {
  const m = this.extent(get)[0];
  return m != null ? get(m) : undefined;
};
prototype$1.max = function (get) {
  const m = this.extent(get)[1];
  return m != null ? get(m) : undefined;
};
prototype$1.quartile = function (get) {
  if (this._get !== get || !this._q) {
    this._q = quartiles(this.values(), get);
    this._get = get;
  }
  return this._q;
};
prototype$1.q1 = function (get) {
  return this.quartile(get)[0];
};
prototype$1.q2 = function (get) {
  return this.quartile(get)[1];
};
prototype$1.q3 = function (get) {
  return this.quartile(get)[2];
};
prototype$1.ci = function (get) {
  if (this._get !== get || !this._ci) {
    this._ci = bootstrapCI(this.values(), 1000, 0.05, get);
    this._get = get;
  }
  return this._ci;
};
prototype$1.ci0 = function (get) {
  return this.ci(get)[0];
};
prototype$1.ci1 = function (get) {
  return this.ci(get)[1];
};

/**
 * Group-by aggregation operator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
 * @param {Array<function(object): *>} [params.fields] - An array of accessors to aggregate.
 * @param {Array<string>} [params.ops] - An array of strings indicating aggregation operations.
 * @param {Array<string>} [params.as] - An array of output field names for aggregated values.
 * @param {boolean} [params.cross=false] - A flag indicating that the full
 *   cross-product of groupby values should be generated, including empty cells.
 *   If true, the drop parameter is ignored and empty cells are retained.
 * @param {boolean} [params.drop=true] - A flag indicating if empty cells should be removed.
 */
function Aggregate(params) {
  Transform.call(this, null, params);
  this._adds = []; // array of added output tuples
  this._mods = []; // array of modified output tuples
  this._alen = 0; // number of active added tuples
  this._mlen = 0; // number of active modified tuples
  this._drop = true; // should empty aggregation cells be removed
  this._cross = false; // produce full cross-product of group-by values

  this._dims = []; // group-by dimension accessors
  this._dnames = []; // group-by dimension names

  this._measures = []; // collection of aggregation monoids
  this._countOnly = false; // flag indicating only count aggregation
  this._counts = null; // collection of count fields
  this._prev = null; // previous aggregation cells

  this._inputs = null; // array of dependent input tuple field names
  this._outputs = null; // array of output tuple field names
}

Aggregate.Definition = {
  'type': 'Aggregate',
  'metadata': {
    'generates': true,
    'changes': true
  },
  'params': [{
    'name': 'groupby',
    'type': 'field',
    'array': true
  }, {
    'name': 'ops',
    'type': 'enum',
    'array': true,
    'values': ValidAggregateOps
  }, {
    'name': 'fields',
    'type': 'field',
    'null': true,
    'array': true
  }, {
    'name': 'as',
    'type': 'string',
    'null': true,
    'array': true
  }, {
    'name': 'drop',
    'type': 'boolean',
    'default': true
  }, {
    'name': 'cross',
    'type': 'boolean',
    'default': false
  }, {
    'name': 'key',
    'type': 'field'
  }]
};
inherits(Aggregate, Transform, {
  transform(_, pulse) {
    const aggr = this,
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      mod = _.modified();
    aggr.stamp = out.stamp;
    if (aggr.value && (mod || pulse.modified(aggr._inputs, true))) {
      aggr._prev = aggr.value;
      aggr.value = mod ? aggr.init(_) : Object.create(null);
      pulse.visit(pulse.SOURCE, t => aggr.add(t));
    } else {
      aggr.value = aggr.value || aggr.init(_);
      pulse.visit(pulse.REM, t => aggr.rem(t));
      pulse.visit(pulse.ADD, t => aggr.add(t));
    }

    // Indicate output fields and return aggregate tuples.
    out.modifies(aggr._outputs);

    // Should empty cells be dropped?
    aggr._drop = _.drop !== false;

    // If domain cross-product requested, generate empty cells as needed
    // and ensure that empty cells are not dropped
    if (_.cross && aggr._dims.length > 1) {
      aggr._drop = false;
      aggr.cross();
    }
    if (pulse.clean() && aggr._drop) {
      out.clean(true).runAfter(() => this.clean());
    }
    return aggr.changes(out);
  },
  cross() {
    const aggr = this,
      curr = aggr.value,
      dims = aggr._dnames,
      vals = dims.map(() => ({})),
      n = dims.length;

    // collect all group-by domain values
    function collect(cells) {
      let key, i, t, v;
      for (key in cells) {
        t = cells[key].tuple;
        for (i = 0; i < n; ++i) {
          vals[i][v = t[dims[i]]] = v;
        }
      }
    }
    collect(aggr._prev);
    collect(curr);

    // iterate over key cross-product, create cells as needed
    function generate(base, tuple, index) {
      const name = dims[index],
        v = vals[index++];
      for (const k in v) {
        const key = base ? base + '|' + k : k;
        tuple[name] = v[k];
        if (index < n) generate(key, tuple, index);else if (!curr[key]) aggr.cell(key, tuple);
      }
    }
    generate('', {}, 0);
  },
  init(_) {
    // initialize input and output fields
    const inputs = this._inputs = [],
      outputs = this._outputs = [],
      inputMap = {};
    function inputVisit(get) {
      const fields = array(accessorFields(get)),
        n = fields.length;
      let i = 0,
        f;
      for (; i < n; ++i) {
        if (!inputMap[f = fields[i]]) {
          inputMap[f] = 1;
          inputs.push(f);
        }
      }
    }

    // initialize group-by dimensions
    this._dims = array(_.groupby);
    this._dnames = this._dims.map(d => {
      const dname = accessorName(d);
      inputVisit(d);
      outputs.push(dname);
      return dname;
    });
    this.cellkey = _.key ? _.key : groupkey(this._dims);

    // initialize aggregate measures
    this._countOnly = true;
    this._counts = [];
    this._measures = [];
    const fields = _.fields || [null],
      ops = _.ops || ['count'],
      as = _.as || [],
      n = fields.length,
      map = {};
    let field, op, m, mname, outname, i;
    if (n !== ops.length) {
      error('Unmatched number of fields and aggregate ops.');
    }
    for (i = 0; i < n; ++i) {
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
        m = map[mname] = [];
        m.field = field;
        this._measures.push(m);
      }
      if (op !== 'count') this._countOnly = false;
      m.push(createMeasure(op, outname));
    }
    this._measures = this._measures.map(m => compileMeasures(m, m.field));
    return Object.create(null); // aggregation cells (this.value)
  },

  // -- Cell Management -----

  cellkey: groupkey(),
  cell(key, t) {
    let cell = this.value[key];
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
  },
  newcell(key, t) {
    const cell = {
      key: key,
      num: 0,
      agg: null,
      tuple: this.newtuple(t, this._prev && this._prev[key]),
      stamp: this.stamp,
      store: false
    };
    if (!this._countOnly) {
      const measures = this._measures,
        n = measures.length;
      cell.agg = Array(n);
      for (let i = 0; i < n; ++i) {
        cell.agg[i] = new measures[i](cell);
      }
    }
    if (cell.store) {
      cell.data = new TupleStore();
    }
    return cell;
  },
  newtuple(t, p) {
    const names = this._dnames,
      dims = this._dims,
      n = dims.length,
      x = {};
    for (let i = 0; i < n; ++i) {
      x[names[i]] = dims[i](t);
    }
    return p ? replace(p.tuple, x) : ingest(x);
  },
  clean() {
    const cells = this.value;
    for (const key in cells) {
      if (cells[key].num === 0) {
        delete cells[key];
      }
    }
  },
  // -- Process Tuples -----

  add(t) {
    const key = this.cellkey(t),
      cell = this.cell(key, t);
    cell.num += 1;
    if (this._countOnly) return;
    if (cell.store) cell.data.add(t);
    const agg = cell.agg;
    for (let i = 0, n = agg.length; i < n; ++i) {
      agg[i].add(agg[i].get(t), t);
    }
  },
  rem(t) {
    const key = this.cellkey(t),
      cell = this.cell(key, t);
    cell.num -= 1;
    if (this._countOnly) return;
    if (cell.store) cell.data.rem(t);
    const agg = cell.agg;
    for (let i = 0, n = agg.length; i < n; ++i) {
      agg[i].rem(agg[i].get(t), t);
    }
  },
  celltuple(cell) {
    const tuple = cell.tuple,
      counts = this._counts;

    // consolidate stored values
    if (cell.store) {
      cell.data.values();
    }

    // update tuple properties
    for (let i = 0, n = counts.length; i < n; ++i) {
      tuple[counts[i]] = cell.num;
    }
    if (!this._countOnly) {
      const agg = cell.agg;
      for (let i = 0, n = agg.length; i < n; ++i) {
        agg[i].set(tuple);
      }
    }
    return tuple;
  },
  changes(out) {
    const adds = this._adds,
      mods = this._mods,
      prev = this._prev,
      drop = this._drop,
      add = out.add,
      rem = out.rem,
      mod = out.mod;
    let cell, key, i, n;
    if (prev) for (key in prev) {
      cell = prev[key];
      if (!drop || cell.num) rem.push(cell.tuple);
    }
    for (i = 0, n = this._alen; i < n; ++i) {
      add.push(this.celltuple(adds[i]));
      adds[i] = null; // for garbage collection
    }

    for (i = 0, n = this._mlen; i < n; ++i) {
      cell = mods[i];
      (cell.num === 0 && drop ? rem : mod).push(this.celltuple(cell));
      mods[i] = null; // for garbage collection
    }

    this._alen = this._mlen = 0; // reset list of active cells
    this._prev = null;
    return out;
  }
});

// epsilon bias to offset floating point error (#1737)
const EPSILON$1 = 1e-14;

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
Bin.Definition = {
  'type': 'Bin',
  'metadata': {
    'modifies': true
  },
  'params': [{
    'name': 'field',
    'type': 'field',
    'required': true
  }, {
    'name': 'interval',
    'type': 'boolean',
    'default': true
  }, {
    'name': 'anchor',
    'type': 'number'
  }, {
    'name': 'maxbins',
    'type': 'number',
    'default': 20
  }, {
    'name': 'base',
    'type': 'number',
    'default': 10
  }, {
    'name': 'divide',
    'type': 'number',
    'array': true,
    'default': [5, 2]
  }, {
    'name': 'extent',
    'type': 'number',
    'array': true,
    'length': 2,
    'required': true
  }, {
    'name': 'span',
    'type': 'number'
  }, {
    'name': 'step',
    'type': 'number'
  }, {
    'name': 'steps',
    'type': 'number',
    'array': true
  }, {
    'name': 'minstep',
    'type': 'number',
    'default': 0
  }, {
    'name': 'nice',
    'type': 'boolean',
    'default': true
  }, {
    'name': 'name',
    'type': 'string'
  }, {
    'name': 'as',
    'type': 'string',
    'array': true,
    'length': 2,
    'default': ['bin0', 'bin1']
  }]
};
inherits(Bin, Transform, {
  transform(_, pulse) {
    const band = _.interval !== false,
      bins = this._bins(_),
      start = bins.start,
      step = bins.step,
      as = _.as || ['bin0', 'bin1'],
      b0 = as[0],
      b1 = as[1];
    let flag;
    if (_.modified()) {
      pulse = pulse.reflow(true);
      flag = pulse.SOURCE;
    } else {
      flag = pulse.modified(accessorFields(_.field)) ? pulse.ADD_MOD : pulse.ADD;
    }
    pulse.visit(flag, band ? t => {
      const v = bins(t);
      // minimum bin value (inclusive)
      t[b0] = v;
      // maximum bin value (exclusive)
      // use convoluted math for better floating point agreement
      // see https://github.com/vega/vega/issues/830
      // infinite values propagate through this formula! #2227
      t[b1] = v == null ? null : start + step * (1 + (v - start) / step);
    } : t => t[b0] = bins(t));
    return pulse.modifies(band ? as : b0);
  },
  _bins(_) {
    if (this.value && !_.modified()) {
      return this.value;
    }
    const field = _.field,
      bins = bin(_),
      step = bins.step;
    let start = bins.start,
      stop = start + Math.ceil((bins.stop - start) / step) * step,
      a,
      d;
    if ((a = _.anchor) != null) {
      d = a - (start + step * Math.floor((a - start) / step));
      start += d;
      stop += d;
    }
    const f = function (t) {
      let v = toNumber(field(t));
      return v == null ? null : v < start ? -Infinity : v > stop ? +Infinity : (v = Math.max(start, Math.min(v, stop - step)), start + step * Math.floor(EPSILON$1 + (v - start) / step));
    };
    f.start = start;
    f.stop = bins.stop;
    f.step = step;
    return this.value = accessor(f, accessorFields(field), _.name || 'bin_' + accessorName(field));
  }
});

function SortedList (idFunc, source, input) {
  const $ = idFunc;
  let data = source || [],
    add = input || [],
    rem = {},
    cnt = 0;
  return {
    add: t => add.push(t),
    remove: t => rem[$(t)] = ++cnt,
    size: () => data.length,
    data: (compare, resort) => {
      if (cnt) {
        data = data.filter(t => !rem[$(t)]);
        rem = {};
        cnt = 0;
      }
      if (resort && compare) {
        data.sort(compare);
      }
      if (add.length) {
        data = compare ? merge(compare, data, add.sort(compare)) : data.concat(add);
        add = [];
      }
      return data;
    }
  };
}

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
Collect.Definition = {
  'type': 'Collect',
  'metadata': {
    'source': true
  },
  'params': [{
    'name': 'sort',
    'type': 'compare'
  }]
};
inherits(Collect, Transform, {
  transform(_, pulse) {
    const out = pulse.fork(pulse.ALL),
      list = SortedList(tupleid, this.value, out.materialize(out.ADD).add),
      sort = _.sort,
      mod = pulse.changed() || sort && (_.modified('sort') || pulse.modified(sort.fields));
    out.visit(out.REM, list.remove);
    this.modified(mod);
    this.value = out.source = list.data(stableCompare(sort), mod);

    // propagate tree root if defined
    if (pulse.source && pulse.source.root) {
      this.value.root = pulse.source.root;
    }
    return out;
  }
});

/**
 * Generates a comparator function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<string|function>} params.fields - The fields to compare.
 * @param {Array<string>} [params.orders] - The sort orders.
 *   Each entry should be one of "ascending" (default) or "descending".
 */
function Compare(params) {
  Operator.call(this, null, update$5, params);
}
inherits(Compare, Operator);
function update$5(_) {
  return this.value && !_.modified() ? this.value : compare(_.fields, _.orders);
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
CountPattern.Definition = {
  'type': 'CountPattern',
  'metadata': {
    'generates': true,
    'changes': true
  },
  'params': [{
    'name': 'field',
    'type': 'field',
    'required': true
  }, {
    'name': 'case',
    'type': 'enum',
    'values': ['upper', 'lower', 'mixed'],
    'default': 'mixed'
  }, {
    'name': 'pattern',
    'type': 'string',
    'default': '[\\w"]+'
  }, {
    'name': 'stopwords',
    'type': 'string',
    'default': ''
  }, {
    'name': 'as',
    'type': 'string',
    'array': true,
    'length': 2,
    'default': ['text', 'count']
  }]
};
function tokenize(text, tcase, match) {
  switch (tcase) {
    case 'upper':
      text = text.toUpperCase();
      break;
    case 'lower':
      text = text.toLowerCase();
      break;
  }
  return text.match(match);
}
inherits(CountPattern, Transform, {
  transform(_, pulse) {
    const process = update => tuple => {
      var tokens = tokenize(get(tuple), _.case, match) || [],
        t;
      for (var i = 0, n = tokens.length; i < n; ++i) {
        if (!stop.test(t = tokens[i])) update(t);
      }
    };
    const init = this._parameterCheck(_, pulse),
      counts = this._counts,
      match = this._match,
      stop = this._stop,
      get = _.field,
      as = _.as || ['text', 'count'],
      add = process(t => counts[t] = 1 + (counts[t] || 0)),
      rem = process(t => counts[t] -= 1);
    if (init) {
      pulse.visit(pulse.SOURCE, add);
    } else {
      pulse.visit(pulse.ADD, add);
      pulse.visit(pulse.REM, rem);
    }
    return this._finish(pulse, as); // generate output tuples
  },

  _parameterCheck(_, pulse) {
    let init = false;
    if (_.modified('stopwords') || !this._stop) {
      this._stop = new RegExp('^' + (_.stopwords || '') + '$', 'i');
      init = true;
    }
    if (_.modified('pattern') || !this._match) {
      this._match = new RegExp(_.pattern || '[\\w\']+', 'g');
      init = true;
    }
    if (_.modified('field') || pulse.modified(_.field.fields)) {
      init = true;
    }
    if (init) this._counts = {};
    return init;
  },
  _finish(pulse, as) {
    const counts = this._counts,
      tuples = this._tuples || (this._tuples = {}),
      text = as[0],
      count = as[1],
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
    let w, t, c;
    for (w in counts) {
      t = tuples[w];
      c = counts[w] || 0;
      if (!t && c) {
        tuples[w] = t = ingest({});
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
  }
});

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
Cross.Definition = {
  'type': 'Cross',
  'metadata': {
    'generates': true
  },
  'params': [{
    'name': 'filter',
    'type': 'expr'
  }, {
    'name': 'as',
    'type': 'string',
    'array': true,
    'length': 2,
    'default': ['a', 'b']
  }]
};
inherits(Cross, Transform, {
  transform(_, pulse) {
    const out = pulse.fork(pulse.NO_SOURCE),
      as = _.as || ['a', 'b'],
      a = as[0],
      b = as[1],
      reset = !this.value || pulse.changed(pulse.ADD_REM) || _.modified('as') || _.modified('filter');
    let data = this.value;
    if (reset) {
      if (data) out.rem = data;
      data = pulse.materialize(pulse.SOURCE).source;
      out.add = this.value = cross(data, a, b, _.filter || truthy);
    } else {
      out.mod = data;
    }
    out.source = this.value;
    return out.modifies(as);
  }
});
function cross(input, a, b, filter) {
  var data = [],
    t = {},
    n = input.length,
    i = 0,
    j,
    left;
  for (; i < n; ++i) {
    t[a] = left = input[i];
    for (j = 0; j < n; ++j) {
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

const Distributions = {
  kde: randomKDE,
  mixture: randomMixture,
  normal: randomNormal,
  lognormal: randomLogNormal,
  uniform: randomUniform
};
const DISTRIBUTIONS = 'distributions',
  FUNCTION = 'function',
  FIELD = 'field';

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
function parse(def, data) {
  const func = def[FUNCTION];
  if (!hasOwnProperty(Distributions, func)) {
    error('Unknown distribution function: ' + func);
  }
  const d = Distributions[func]();
  for (const name in def) {
    // if data field, extract values
    if (name === FIELD) {
      d.data((def.from || data()).map(def[name]));
    }

    // if distribution mixture, recurse to parse each definition
    else if (name === DISTRIBUTIONS) {
      d[name](def[name].map(_ => parse(_, data)));
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
 * @param {number} [params.minsteps=25] - The minimum number of curve samples
 *   for plotting the density.
 * @param {number} [params.maxsteps=200] - The maximum number of curve samples
 *   for plotting the density.
 * @param {number} [params.steps] - The exact number of curve samples for
 *   plotting the density. If specified, overrides both minsteps and maxsteps
 *   to set an exact number of uniform samples. Useful in conjunction with
 *   a fixed extent to ensure consistent sample points for stacked densities.
 */
function Density(params) {
  Transform.call(this, null, params);
}
const distributions = [{
  'key': {
    'function': 'normal'
  },
  'params': [{
    'name': 'mean',
    'type': 'number',
    'default': 0
  }, {
    'name': 'stdev',
    'type': 'number',
    'default': 1
  }]
}, {
  'key': {
    'function': 'lognormal'
  },
  'params': [{
    'name': 'mean',
    'type': 'number',
    'default': 0
  }, {
    'name': 'stdev',
    'type': 'number',
    'default': 1
  }]
}, {
  'key': {
    'function': 'uniform'
  },
  'params': [{
    'name': 'min',
    'type': 'number',
    'default': 0
  }, {
    'name': 'max',
    'type': 'number',
    'default': 1
  }]
}, {
  'key': {
    'function': 'kde'
  },
  'params': [{
    'name': 'field',
    'type': 'field',
    'required': true
  }, {
    'name': 'from',
    'type': 'data'
  }, {
    'name': 'bandwidth',
    'type': 'number',
    'default': 0
  }]
}];
const mixture = {
  'key': {
    'function': 'mixture'
  },
  'params': [{
    'name': 'distributions',
    'type': 'param',
    'array': true,
    'params': distributions
  }, {
    'name': 'weights',
    'type': 'number',
    'array': true
  }]
};
Density.Definition = {
  'type': 'Density',
  'metadata': {
    'generates': true
  },
  'params': [{
    'name': 'extent',
    'type': 'number',
    'array': true,
    'length': 2
  }, {
    'name': 'steps',
    'type': 'number'
  }, {
    'name': 'minsteps',
    'type': 'number',
    'default': 25
  }, {
    'name': 'maxsteps',
    'type': 'number',
    'default': 200
  }, {
    'name': 'method',
    'type': 'string',
    'default': 'pdf',
    'values': ['pdf', 'cdf']
  }, {
    'name': 'distribution',
    'type': 'param',
    'params': distributions.concat(mixture)
  }, {
    'name': 'as',
    'type': 'string',
    'array': true,
    'default': ['value', 'density']
  }]
};
inherits(Density, Transform, {
  transform(_, pulse) {
    const out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
    if (!this.value || pulse.changed() || _.modified()) {
      const dist = parse(_.distribution, source(pulse)),
        minsteps = _.steps || _.minsteps || 25,
        maxsteps = _.steps || _.maxsteps || 200;
      let method = _.method || 'pdf';
      if (method !== 'pdf' && method !== 'cdf') {
        error('Invalid density method: ' + method);
      }
      if (!_.extent && !dist.data) {
        error('Missing density extent parameter.');
      }
      method = dist[method];
      const as = _.as || ['value', 'density'],
        domain = _.extent || extent(dist.data()),
        values = sampleCurve(method, domain, minsteps, maxsteps).map(v => {
          const tuple = {};
          tuple[as[0]] = v[0];
          tuple[as[1]] = v[1];
          return ingest(tuple);
        });
      if (this.value) out.rem = this.value;
      this.value = out.add = out.source = values;
    }
    return out;
  }
});
function source(pulse) {
  return () => pulse.materialize(pulse.SOURCE).source;
}

// use either provided alias or accessor field name
function fieldNames(fields, as) {
  if (!fields) return null;
  return fields.map((f, i) => as[i] || accessorName(f));
}
function partition$1(data, groupby, field) {
  const groups = [],
    get = f => f(t);
  let map, i, n, t, k, g;

  // partition data points into groups
  if (groupby == null) {
    groups.push(data.map(field));
  } else {
    for (map = {}, i = 0, n = data.length; i < n; ++i) {
      t = data[i];
      k = groupby.map(get);
      g = map[k];
      if (!g) {
        map[k] = g = [];
        g.dims = k;
        groups.push(g);
      }
      g.push(field(t));
    }
  }
  return groups;
}

const Output = 'bin';

/**
 * Dot density binning for dot plot construction.
 * Based on Leland Wilkinson, Dot Plots, The American Statistician, 1999.
 * https://www.cs.uic.edu/~wilkinson/Publications/dotplots.pdf
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to bin.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
 * @param {number} [params.step] - The step size (bin width) within which dots should be
 *   stacked. Defaults to 1/30 of the extent of the data *field*.
 * @param {boolean} [params.smooth=false] - A boolean flag indicating if dot density
 *   stacks should be smoothed to reduce variance.
 */
function DotBin(params) {
  Transform.call(this, null, params);
}
DotBin.Definition = {
  'type': 'DotBin',
  'metadata': {
    'modifies': true
  },
  'params': [{
    'name': 'field',
    'type': 'field',
    'required': true
  }, {
    'name': 'groupby',
    'type': 'field',
    'array': true
  }, {
    'name': 'step',
    'type': 'number'
  }, {
    'name': 'smooth',
    'type': 'boolean',
    'default': false
  }, {
    'name': 'as',
    'type': 'string',
    'default': Output
  }]
};
const autostep = (data, field) => span(extent(data, field)) / 30;
inherits(DotBin, Transform, {
  transform(_, pulse) {
    if (this.value && !(_.modified() || pulse.changed())) {
      return pulse; // early exit
    }

    const source = pulse.materialize(pulse.SOURCE).source,
      groups = partition$1(pulse.source, _.groupby, identity),
      smooth = _.smooth || false,
      field = _.field,
      step = _.step || autostep(source, field),
      sort = stableCompare((a, b) => field(a) - field(b)),
      as = _.as || Output,
      n = groups.length;

    // compute dotplot bins per group
    let min = Infinity,
      max = -Infinity,
      i = 0,
      j;
    for (; i < n; ++i) {
      const g = groups[i].sort(sort);
      j = -1;
      for (const v of dotbin(g, step, smooth, field)) {
        if (v < min) min = v;
        if (v > max) max = v;
        g[++j][as] = v;
      }
    }
    this.value = {
      start: min,
      stop: max,
      step: step
    };
    return pulse.reflow(true).modifies(as);
  }
});

/**
 * Wraps an expression function with access to external parameters.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function} params.expr - The expression function. The
 *  function should accept both a datum and a parameter object.
 *  This operator's value will be a new function that wraps the
 *  expression function with access to this operator's parameters.
 */
function Expression(params) {
  Operator.call(this, null, update$4, params);
  this.modified(true);
}
inherits(Expression, Operator);
function update$4(_) {
  const expr = _.expr;
  return this.value && !_.modified('expr') ? this.value : accessor(datum => expr(datum, _), accessorFields(expr), accessorName(expr));
}

/**
 * Computes extents (min/max) for a data field.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field over which to compute extends.
 */
function Extent(params) {
  Transform.call(this, [undefined, undefined], params);
}
Extent.Definition = {
  'type': 'Extent',
  'metadata': {},
  'params': [{
    'name': 'field',
    'type': 'field',
    'required': true
  }]
};
inherits(Extent, Transform, {
  transform(_, pulse) {
    const extent = this.value,
      field = _.field,
      mod = pulse.changed() || pulse.modified(field.fields) || _.modified('field');
    let min = extent[0],
      max = extent[1];
    if (mod || min == null) {
      min = +Infinity;
      max = -Infinity;
    }
    pulse.visit(mod ? pulse.SOURCE : pulse.ADD, t => {
      const v = toNumber(field(t));
      if (v != null) {
        // NaNs will fail all comparisons!
        if (v < min) min = v;
        if (v > max) max = v;
      }
    });
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      let name = accessorName(field);
      if (name) name = ` for field "${name}"`;
      pulse.dataflow.warn(`Infinite extent${name}: [${min}, ${max}]`);
      min = max = undefined;
    }
    this.value = [min, max];
  }
});

/**
 * Provides a bridge between a parent transform and a target subflow that
 * consumes only a subset of the tuples that pass through the parent.
 * @constructor
 * @param {Pulse} pulse - A pulse to use as the value of this operator.
 * @param {Transform} parent - The parent transform (typically a Facet instance).
 */
function Subflow(pulse, parent) {
  Operator.call(this, pulse);
  this.parent = parent;
  this.count = 0;
}
inherits(Subflow, Operator, {
  /**
   * Routes pulses from this subflow to a target transform.
   * @param {Transform} target - A transform that receives the subflow of tuples.
   */
  connect(target) {
    this.detachSubflow = target.detachSubflow;
    this.targets().add(target);
    return target.source = this;
  },
  /**
   * Add an 'add' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being added.
   */
  add(t) {
    this.count += 1;
    this.value.add.push(t);
  },
  /**
   * Add a 'rem' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being removed.
   */
  rem(t) {
    this.count -= 1;
    this.value.rem.push(t);
  },
  /**
   * Add a 'mod' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being modified.
   */
  mod(t) {
    this.value.mod.push(t);
  },
  /**
   * Re-initialize this operator's pulse value.
   * @param {Pulse} pulse - The pulse to copy from.
   * @see Pulse.init
   */
  init(pulse) {
    this.value.init(pulse, pulse.NO_SOURCE);
  },
  /**
   * Evaluate this operator. This method overrides the
   * default behavior to simply return the contained pulse value.
   * @return {Pulse}
   */
  evaluate() {
    // assert: this.value.stamp === pulse.stamp
    return this.value;
  }
});

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
  const a = this._targets = [];
  a.active = 0;
  a.forEach = f => {
    for (let i = 0, n = a.active; i < n; ++i) {
      f(a[i], i, a);
    }
  };
}
inherits(Facet, Transform, {
  activate(flow) {
    this._targets[this._targets.active++] = flow;
  },
  // parent argument provided by PreFacet subclass
  subflow(key, flow, pulse, parent) {
    const flows = this.value;
    let sf = hasOwnProperty(flows, key) && flows[key],
      df,
      p;
    if (!sf) {
      p = parent || (p = this._group[key]) && p.tuple;
      df = pulse.dataflow;
      sf = new Subflow(pulse.fork(pulse.NO_SOURCE), this);
      df.add(sf).connect(flow(df, key, p));
      flows[key] = sf;
      this.activate(sf);
    } else if (sf.value.stamp < pulse.stamp) {
      sf.init(pulse);
      this.activate(sf);
    }
    return sf;
  },
  clean() {
    const flows = this.value;
    let detached = 0;
    for (const key in flows) {
      if (flows[key].count === 0) {
        const detach = flows[key].detachSubflow;
        if (detach) detach();
        delete flows[key];
        ++detached;
      }
    }

    // remove inactive targets from the active targets array
    if (detached) {
      const active = this._targets.filter(sf => sf && sf.count > 0);
      this.initTargets(active);
    }
  },
  initTargets(act) {
    const a = this._targets,
      n = a.length,
      m = act ? act.length : 0;
    let i = 0;
    for (; i < m; ++i) {
      a[i] = act[i];
    }
    for (; i < n && a[i] != null; ++i) {
      a[i] = null; // ensure old flows can be garbage collected
    }

    a.active = m;
  },
  transform(_, pulse) {
    const df = pulse.dataflow,
      key = _.key,
      flow = _.subflow,
      cache = this._keys,
      rekey = _.modified('key'),
      subflow = key => this.subflow(key, flow, pulse);
    this._group = _.group || {};
    this.initTargets(); // reset list of active subflows

    pulse.visit(pulse.REM, t => {
      const id = tupleid(t),
        k = cache.get(id);
      if (k !== undefined) {
        cache.delete(id);
        subflow(k).rem(t);
      }
    });
    pulse.visit(pulse.ADD, t => {
      const k = key(t);
      cache.set(tupleid(t), k);
      subflow(k).add(t);
    });
    if (rekey || pulse.modified(key.fields)) {
      pulse.visit(pulse.MOD, t => {
        const id = tupleid(t),
          k0 = cache.get(id),
          k1 = key(t);
        if (k0 === k1) {
          subflow(k1).mod(t);
        } else {
          cache.set(id, k1);
          subflow(k0).rem(t);
          subflow(k1).add(t);
        }
      });
    } else if (pulse.changed(pulse.MOD)) {
      pulse.visit(pulse.MOD, t => {
        subflow(cache.get(tupleid(t))).mod(t);
      });
    }
    if (rekey) {
      pulse.visit(pulse.REFLOW, t => {
        const id = tupleid(t),
          k0 = cache.get(id),
          k1 = key(t);
        if (k0 !== k1) {
          cache.set(id, k1);
          subflow(k0).rem(t);
          subflow(k1).add(t);
        }
      });
    }
    if (pulse.clean()) {
      df.runAfter(() => {
        this.clean();
        cache.clean();
      });
    } else if (cache.empty > df.cleanThreshold) {
      df.runAfter(cache.clean);
    }
    return pulse;
  }
});

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
  Operator.call(this, null, update$3, params);
}
inherits(Field, Operator);
function update$3(_) {
  return this.value && !_.modified() ? this.value : isArray(_.name) ? array(_.name).map(f => field(f)) : field(_.name, _.as);
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
Filter.Definition = {
  'type': 'Filter',
  'metadata': {
    'changes': true
  },
  'params': [{
    'name': 'expr',
    'type': 'expr',
    'required': true
  }]
};
inherits(Filter, Transform, {
  transform(_, pulse) {
    const df = pulse.dataflow,
      cache = this.value,
      // cache ids of filtered tuples
      output = pulse.fork(),
      add = output.add,
      rem = output.rem,
      mod = output.mod,
      test = _.expr;
    let isMod = true;
    pulse.visit(pulse.REM, t => {
      const id = tupleid(t);
      if (!cache.has(id)) rem.push(t);else cache.delete(id);
    });
    pulse.visit(pulse.ADD, t => {
      if (test(t, _)) add.push(t);else cache.set(tupleid(t), 1);
    });
    function revisit(t) {
      const id = tupleid(t),
        b = test(t, _),
        s = cache.get(id);
      if (b && s) {
        cache.delete(id);
        add.push(t);
      } else if (!b && !s) {
        cache.set(id, 1);
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
  }
});

/**
 * Flattens array-typed field values into new data objects.
 * If multiple fields are specified, they are treated as parallel arrays,
 * with output values included for each matching index (or null if missing).
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} params.fields - An array of field
 *   accessors for the tuple fields that should be flattened.
 * @param {string} [params.index] - Optional output field name for index
 *   value. If unspecified, no index field is included in the output.
 * @param {Array<string>} [params.as] - Output field names for flattened
 *   array fields. Any unspecified fields will use the field name provided
 *   by the fields accessors.
 */
function Flatten(params) {
  Transform.call(this, [], params);
}
Flatten.Definition = {
  'type': 'Flatten',
  'metadata': {
    'generates': true
  },
  'params': [{
    'name': 'fields',
    'type': 'field',
    'array': true,
    'required': true
  }, {
    'name': 'index',
    'type': 'string'
  }, {
    'name': 'as',
    'type': 'string',
    'array': true
  }]
};
inherits(Flatten, Transform, {
  transform(_, pulse) {
    const out = pulse.fork(pulse.NO_SOURCE),
      fields = _.fields,
      as = fieldNames(fields, _.as || []),
      index = _.index || null,
      m = as.length;

    // remove any previous results
    out.rem = this.value;

    // generate flattened tuples
    pulse.visit(pulse.SOURCE, t => {
      const arrays = fields.map(f => f(t)),
        maxlen = arrays.reduce((l, a) => Math.max(l, a.length), 0);
      let i = 0,
        j,
        d,
        v;
      for (; i < maxlen; ++i) {
        d = derive(t);
        for (j = 0; j < m; ++j) {
          d[as[j]] = (v = arrays[j][i]) == null ? null : v;
        }
        if (index) {
          d[index] = i;
        }
        out.add.push(d);
      }
    });
    this.value = out.source = out.add;
    if (index) out.modifies(index);
    return out.modifies(as);
  }
});

/**
 * Folds one more tuple fields into multiple tuples in which the field
 * name and values are available under new 'key' and 'value' fields.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.fields - An array of field accessors
 *   for the tuple fields that should be folded.
 * @param {Array<string>} [params.as] - Output field names for folded key
 *   and value fields, defaults to ['key', 'value'].
 */
function Fold(params) {
  Transform.call(this, [], params);
}
Fold.Definition = {
  'type': 'Fold',
  'metadata': {
    'generates': true
  },
  'params': [{
    'name': 'fields',
    'type': 'field',
    'array': true,
    'required': true
  }, {
    'name': 'as',
    'type': 'string',
    'array': true,
    'length': 2,
    'default': ['key', 'value']
  }]
};
inherits(Fold, Transform, {
  transform(_, pulse) {
    const out = pulse.fork(pulse.NO_SOURCE),
      fields = _.fields,
      fnames = fields.map(accessorName),
      as = _.as || ['key', 'value'],
      k = as[0],
      v = as[1],
      n = fields.length;
    out.rem = this.value;
    pulse.visit(pulse.SOURCE, t => {
      for (let i = 0, d; i < n; ++i) {
        d = derive(t);
        d[k] = fnames[i];
        d[v] = fields[i](t);
        out.add.push(d);
      }
    });
    this.value = out.source = out.add;
    return out.modifies(as);
  }
});

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
Formula.Definition = {
  'type': 'Formula',
  'metadata': {
    'modifies': true
  },
  'params': [{
    'name': 'expr',
    'type': 'expr',
    'required': true
  }, {
    'name': 'as',
    'type': 'string',
    'required': true
  }, {
    'name': 'initonly',
    'type': 'boolean'
  }]
};
inherits(Formula, Transform, {
  transform(_, pulse) {
    const func = _.expr,
      as = _.as,
      mod = _.modified(),
      flag = _.initonly ? pulse.ADD : mod ? pulse.SOURCE : pulse.modified(func.fields) || pulse.modified(as) ? pulse.ADD_MOD : pulse.ADD;
    if (mod) {
      // parameters updated, need to reflow
      pulse = pulse.materialize().reflow(true);
    }
    if (!_.initonly) {
      pulse.modifies(as);
    }
    return pulse.visit(flag, t => t[as] = func(t, _));
  }
});

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
inherits(Generate, Transform, {
  transform(_, pulse) {
    const out = pulse.fork(pulse.ALL),
      gen = _.generator;
    let data = this.value,
      num = _.size - data.length,
      add,
      rem,
      t;
    if (num > 0) {
      // need more tuples, generate and add
      for (add = []; --num >= 0;) {
        add.push(t = ingest(gen(_)));
        data.push(t);
      }
      out.add = out.add.length ? out.materialize(out.ADD).add.concat(add) : add;
    } else {
      // need fewer tuples, remove
      rem = data.slice(0, -num);
      out.rem = out.rem.length ? out.materialize(out.REM).rem.concat(rem) : rem;
      data = data.slice(-num);
    }
    out.source = this.value = data;
    return out;
  }
});

const Methods = {
  value: 'value',
  median: median,
  mean: mean,
  min: min,
  max: max
};
const Empty = [];

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
Impute.Definition = {
  'type': 'Impute',
  'metadata': {
    'changes': true
  },
  'params': [{
    'name': 'field',
    'type': 'field',
    'required': true
  }, {
    'name': 'key',
    'type': 'field',
    'required': true
  }, {
    'name': 'keyvals',
    'array': true
  }, {
    'name': 'groupby',
    'type': 'field',
    'array': true
  }, {
    'name': 'method',
    'type': 'enum',
    'default': 'value',
    'values': ['value', 'mean', 'median', 'max', 'min']
  }, {
    'name': 'value',
    'default': 0
  }]
};
function getValue(_) {
  var m = _.method || Methods.value,
    v;
  if (Methods[m] == null) {
    error('Unrecognized imputation method: ' + m);
  } else if (m === Methods.value) {
    v = _.value !== undefined ? _.value : 0;
    return () => v;
  } else {
    return Methods[m];
  }
}
function getField(_) {
  const f = _.field;
  return t => t ? f(t) : NaN;
}
inherits(Impute, Transform, {
  transform(_, pulse) {
    var out = pulse.fork(pulse.ALL),
      impute = getValue(_),
      field = getField(_),
      fName = accessorName(_.field),
      kName = accessorName(_.key),
      gNames = (_.groupby || []).map(accessorName),
      groups = partition(pulse.source, _.groupby, _.key, _.keyvals),
      curr = [],
      prev = this.value,
      m = groups.domain.length,
      group,
      value,
      gVals,
      kVal,
      g,
      i,
      j,
      l,
      n,
      t;
    for (g = 0, l = groups.length; g < l; ++g) {
      group = groups[g];
      gVals = group.values;
      value = NaN;

      // add tuples for missing values
      for (j = 0; j < m; ++j) {
        if (group[j] != null) continue;
        kVal = groups.domain[j];
        t = {
          _impute: true
        };
        for (i = 0, n = gVals.length; i < n; ++i) t[gNames[i]] = gVals[i];
        t[kName] = kVal;
        t[fName] = Number.isNaN(value) ? value = impute(group, field) : value;
        curr.push(ingest(t));
      }
    }

    // update pulse with imputed tuples
    if (curr.length) out.add = out.materialize(out.ADD).add.concat(curr);
    if (prev.length) out.rem = out.materialize(out.REM).rem.concat(prev);
    this.value = curr;
    return out;
  }
});
function partition(data, groupby, key, keyvals) {
  var get = f => f(t),
    groups = [],
    domain = keyvals ? keyvals.slice() : [],
    kMap = {},
    gMap = {},
    gVals,
    gKey,
    group,
    i,
    j,
    k,
    n,
    t;
  domain.forEach((k, i) => kMap[k] = i + 1);
  for (i = 0, n = data.length; i < n; ++i) {
    t = data[i];
    k = key(t);
    j = kMap[k] || (kMap[k] = domain.push(k));
    gKey = (gVals = groupby ? groupby.map(get) : Empty) + '';
    if (!(group = gMap[gKey])) {
      group = gMap[gKey] = [];
      groups.push(group);
      group.values = gVals;
    }
    group[j - 1] = t;
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
JoinAggregate.Definition = {
  'type': 'JoinAggregate',
  'metadata': {
    'modifies': true
  },
  'params': [{
    'name': 'groupby',
    'type': 'field',
    'array': true
  }, {
    'name': 'fields',
    'type': 'field',
    'null': true,
    'array': true
  }, {
    'name': 'ops',
    'type': 'enum',
    'array': true,
    'values': ValidAggregateOps
  }, {
    'name': 'as',
    'type': 'string',
    'null': true,
    'array': true
  }, {
    'name': 'key',
    'type': 'field'
  }]
};
inherits(JoinAggregate, Aggregate, {
  transform(_, pulse) {
    const aggr = this,
      mod = _.modified();
    let cells;

    // process all input tuples to calculate aggregates
    if (aggr.value && (mod || pulse.modified(aggr._inputs, true))) {
      cells = aggr.value = mod ? aggr.init(_) : {};
      pulse.visit(pulse.SOURCE, t => aggr.add(t));
    } else {
      cells = aggr.value = aggr.value || this.init(_);
      pulse.visit(pulse.REM, t => aggr.rem(t));
      pulse.visit(pulse.ADD, t => aggr.add(t));
    }

    // update aggregation cells
    aggr.changes();

    // write aggregate values to input tuples
    pulse.visit(pulse.SOURCE, t => {
      extend(t, cells[aggr.cellkey(t)].tuple);
    });
    return pulse.reflow(mod).modifies(this._outputs);
  },
  changes() {
    const adds = this._adds,
      mods = this._mods;
    let i, n;
    for (i = 0, n = this._alen; i < n; ++i) {
      this.celltuple(adds[i]);
      adds[i] = null; // for garbage collection
    }

    for (i = 0, n = this._mlen; i < n; ++i) {
      this.celltuple(mods[i]);
      mods[i] = null; // for garbage collection
    }

    this._alen = this._mlen = 0; // reset list of active cells
  }
});

/**
 * Compute kernel density estimates (KDE) for one or more data groups.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors
 *   to groupby.
 * @param {function(object): *} params.field - An accessor for the data field
 *   to estimate.
 * @param {number} [params.bandwidth=0] - The KDE kernel bandwidth.
 *   If zero or unspecified, the bandwidth is automatically determined.
 * @param {boolean} [params.counts=false] - A boolean flag indicating if the
 *   output values should be probability estimates (false, default) or
 *   smoothed counts (true).
 * @param {string} [params.cumulative=false] - A boolean flag indicating if a
 *   density (false) or cumulative distribution (true) should be generated.
 * @param {Array<number>} [params.extent] - The domain extent over which to
 *   plot the density. If unspecified, the [min, max] data extent is used.
 * @param {string} [params.resolve='independent'] - Indicates how parameters for
 *   multiple densities should be resolved. If "independent" (the default), each
 *   density may have its own domain extent and dynamic number of curve sample
 *   steps. If "shared", the KDE transform will ensure that all densities are
 *   defined over a shared domain and curve steps, enabling stacking.
 * @param {number} [params.minsteps=25] - The minimum number of curve samples
 *   for plotting the density.
 * @param {number} [params.maxsteps=200] - The maximum number of curve samples
 *   for plotting the density.
 * @param {number} [params.steps] - The exact number of curve samples for
 *   plotting the density. If specified, overrides both minsteps and maxsteps
 *   to set an exact number of uniform samples. Useful in conjunction with
 *   a fixed extent to ensure consistent sample points for stacked densities.
 */
function KDE(params) {
  Transform.call(this, null, params);
}
KDE.Definition = {
  'type': 'KDE',
  'metadata': {
    'generates': true
  },
  'params': [{
    'name': 'groupby',
    'type': 'field',
    'array': true
  }, {
    'name': 'field',
    'type': 'field',
    'required': true
  }, {
    'name': 'cumulative',
    'type': 'boolean',
    'default': false
  }, {
    'name': 'counts',
    'type': 'boolean',
    'default': false
  }, {
    'name': 'bandwidth',
    'type': 'number',
    'default': 0
  }, {
    'name': 'extent',
    'type': 'number',
    'array': true,
    'length': 2
  }, {
    'name': 'resolve',
    'type': 'enum',
    'values': ['shared', 'independent'],
    'default': 'independent'
  }, {
    'name': 'steps',
    'type': 'number'
  }, {
    'name': 'minsteps',
    'type': 'number',
    'default': 25
  }, {
    'name': 'maxsteps',
    'type': 'number',
    'default': 200
  }, {
    'name': 'as',
    'type': 'string',
    'array': true,
    'default': ['value', 'density']
  }]
};
inherits(KDE, Transform, {
  transform(_, pulse) {
    const out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
    if (!this.value || pulse.changed() || _.modified()) {
      const source = pulse.materialize(pulse.SOURCE).source,
        groups = partition$1(source, _.groupby, _.field),
        names = (_.groupby || []).map(accessorName),
        bandwidth = _.bandwidth,
        method = _.cumulative ? 'cdf' : 'pdf',
        as = _.as || ['value', 'density'],
        values = [];
      let domain = _.extent,
        minsteps = _.steps || _.minsteps || 25,
        maxsteps = _.steps || _.maxsteps || 200;
      if (method !== 'pdf' && method !== 'cdf') {
        error('Invalid density method: ' + method);
      }
      if (_.resolve === 'shared') {
        if (!domain) domain = extent(source, _.field);
        minsteps = maxsteps = _.steps || maxsteps;
      }
      groups.forEach(g => {
        const density = randomKDE(g, bandwidth)[method],
          scale = _.counts ? g.length : 1,
          local = domain || extent(g);
        sampleCurve(density, local, minsteps, maxsteps).forEach(v => {
          const t = {};
          for (let i = 0; i < names.length; ++i) {
            t[names[i]] = g.dims[i];
          }
          t[as[0]] = v[0];
          t[as[1]] = v[1] * scale;
          values.push(ingest(t));
        });
      });
      if (this.value) out.rem = this.value;
      this.value = out.add = out.source = values;
    }
    return out;
  }
});

/**
 * Generates a key function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<string>} params.fields - The field name(s) for the key function.
 * @param {boolean} params.flat - A boolean flag indicating if the field names
 *  should be treated as flat property names, side-stepping nested field
 *  lookups normally indicated by dot or bracket notation.
 */
function Key(params) {
  Operator.call(this, null, update$2, params);
}
inherits(Key, Operator);
function update$2(_) {
  return this.value && !_.modified() ? this.value : key(_.fields, _.flat);
}

/**
 * Load and parse data from an external source. Marshalls parameter
 * values and then invokes the Dataflow request method.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {string} params.url - The URL to load from.
 * @param {object} params.format - The data format options.
 */
function Load(params) {
  Transform.call(this, [], params);
  this._pending = null;
}
inherits(Load, Transform, {
  transform(_, pulse) {
    const df = pulse.dataflow;
    if (this._pending) {
      // update state and return pulse
      return output(this, pulse, this._pending);
    }
    if (stop(_)) return pulse.StopPropagation;
    if (_.values) {
      // parse and ingest values, return output pulse
      return output(this, pulse, df.parse(_.values, _.format));
    } else if (_.async) {
      // return promise for non-blocking async loading
      const p = df.request(_.url, _.format).then(res => {
        this._pending = array(res.data);
        return df => df.touch(this);
      });
      return {
        async: p
      };
    } else {
      // return promise for synchronous loading
      return df.request(_.url, _.format).then(res => output(this, pulse, array(res.data)));
    }
  }
});
function stop(_) {
  return _.modified('async') && !(_.modified('values') || _.modified('url') || _.modified('format'));
}
function output(op, pulse, data) {
  data.forEach(ingest);
  const out = pulse.fork(pulse.NO_FIELDS & pulse.NO_SOURCE);
  out.rem = op.value;
  op.value = out.source = out.add = data;
  op._pending = null;
  if (out.rem.length) out.clean(true);
  return out;
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
Lookup.Definition = {
  'type': 'Lookup',
  'metadata': {
    'modifies': true
  },
  'params': [{
    'name': 'index',
    'type': 'index',
    'params': [{
      'name': 'from',
      'type': 'data',
      'required': true
    }, {
      'name': 'key',
      'type': 'field',
      'required': true
    }]
  }, {
    'name': 'values',
    'type': 'field',
    'array': true
  }, {
    'name': 'fields',
    'type': 'field',
    'array': true,
    'required': true
  }, {
    'name': 'as',
    'type': 'string',
    'array': true
  }, {
    'name': 'default',
    'default': null
  }]
};
inherits(Lookup, Transform, {
  transform(_, pulse) {
    const keys = _.fields,
      index = _.index,
      values = _.values,
      defaultValue = _.default == null ? null : _.default,
      reset = _.modified(),
      n = keys.length;
    let flag = reset ? pulse.SOURCE : pulse.ADD,
      out = pulse,
      as = _.as,
      set,
      m,
      mods;
    if (values) {
      m = values.length;
      if (n > 1 && !as) {
        error('Multi-field lookup requires explicit "as" parameter.');
      }
      if (as && as.length !== n * m) {
        error('The "as" parameter has too few output field names.');
      }
      as = as || values.map(accessorName);
      set = function (t) {
        for (var i = 0, k = 0, j, v; i < n; ++i) {
          v = index.get(keys[i](t));
          if (v == null) for (j = 0; j < m; ++j, ++k) t[as[k]] = defaultValue;else for (j = 0; j < m; ++j, ++k) t[as[k]] = values[j](v);
        }
      };
    } else {
      if (!as) {
        error('Missing output field names.');
      }
      set = function (t) {
        for (var i = 0, v; i < n; ++i) {
          v = index.get(keys[i](t));
          t[as[i]] = v == null ? defaultValue : v;
        }
      };
    }
    if (reset) {
      out = pulse.reflow(true);
    } else {
      mods = keys.some(k => pulse.modified(k.fields));
      flag |= mods ? pulse.MOD : 0;
    }
    pulse.visit(flag, set);
    return out.modifies(as);
  }
});

/**
 * Computes global min/max extents over a collection of extents.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<Array<number>>} params.extents - The input extents.
 */
function MultiExtent(params) {
  Operator.call(this, null, update$1, params);
}
inherits(MultiExtent, Operator);
function update$1(_) {
  if (this.value && !_.modified()) {
    return this.value;
  }
  const ext = _.extents,
    n = ext.length;
  let min = +Infinity,
    max = -Infinity,
    i,
    e;
  for (i = 0; i < n; ++i) {
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
  Operator.call(this, null, update, params);
}
inherits(MultiValues, Operator);
function update(_) {
  return this.value && !_.modified() ? this.value : _.values.reduce((data, _) => data.concat(_), []);
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
inherits(Params, Transform, {
  transform(_, pulse) {
    this.modified(_.modified());
    this.value = _;
    return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS); // do not pass tuples
  }
});

/**
 * Aggregate and pivot selected field values to become new fields.
 * This operator is useful to construction cross-tabulations.
 * @constructor
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors
 *  to groupby. These fields act just like groupby fields of an Aggregate transform.
 * @param {function(object): *} params.field - The field to pivot on. The unique
 *  values of this field become new field names in the output stream.
 * @param {function(object): *} params.value - The field to populate pivoted fields.
 *  The aggregate values of this field become the values of the new pivoted fields.
 * @param {string} [params.op] - The aggregation operation for the value field,
 *  applied per cell in the output stream. The default is "sum".
 * @param {number} [params.limit] - An optional parameter indicating the maximum
 *  number of pivoted fields to generate. The pivoted field names are sorted in
 *  ascending order prior to enforcing the limit.
 */
function Pivot(params) {
  Aggregate.call(this, params);
}
Pivot.Definition = {
  'type': 'Pivot',
  'metadata': {
    'generates': true,
    'changes': true
  },
  'params': [{
    'name': 'groupby',
    'type': 'field',
    'array': true
  }, {
    'name': 'field',
    'type': 'field',
    'required': true
  }, {
    'name': 'value',
    'type': 'field',
    'required': true
  }, {
    'name': 'op',
    'type': 'enum',
    'values': ValidAggregateOps,
    'default': 'sum'
  }, {
    'name': 'limit',
    'type': 'number',
    'default': 0
  }, {
    'name': 'key',
    'type': 'field'
  }]
};
inherits(Pivot, Aggregate, {
  _transform: Aggregate.prototype.transform,
  transform(_, pulse) {
    return this._transform(aggregateParams(_, pulse), pulse);
  }
});

// Shoehorn a pivot transform into an aggregate transform!
// First collect all unique pivot field values.
// Then generate aggregate fields for each output pivot field.
function aggregateParams(_, pulse) {
  const key = _.field,
    value = _.value,
    op = (_.op === 'count' ? '__count__' : _.op) || 'sum',
    fields = accessorFields(key).concat(accessorFields(value)),
    keys = pivotKeys(key, _.limit || 0, pulse);

  // if data stream content changes, pivot fields may change
  // flag parameter modification to ensure re-initialization
  if (pulse.changed()) _.set('__pivot__', null, null, true);
  return {
    key: _.key,
    groupby: _.groupby,
    ops: keys.map(() => op),
    fields: keys.map(k => get(k, key, value, fields)),
    as: keys.map(k => k + ''),
    modified: _.modified.bind(_)
  };
}

// Generate aggregate field accessor.
// Output NaN for non-existent values; aggregator will ignore!
function get(k, key, value, fields) {
  return accessor(d => key(d) === k ? value(d) : NaN, fields, k + '');
}

// Collect (and optionally limit) all unique pivot values.
function pivotKeys(key, limit, pulse) {
  const map = {},
    list = [];
  pulse.visit(pulse.SOURCE, t => {
    const k = key(t);
    if (!map[k]) {
      map[k] = 1;
      list.push(k);
    }
  });
  list.sort(ascending);
  return limit ? list.slice(0, limit) : list;
}

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
inherits(PreFacet, Facet, {
  transform(_, pulse) {
    const flow = _.subflow,
      field = _.field,
      subflow = t => this.subflow(tupleid(t), flow, pulse, t);
    if (_.modified('field') || field && pulse.modified(accessorFields(field))) {
      error('PreFacet does not support field modification.');
    }
    this.initTargets(); // reset list of active subflows

    if (field) {
      pulse.visit(pulse.MOD, t => {
        const sf = subflow(t);
        field(t).forEach(_ => sf.mod(_));
      });
      pulse.visit(pulse.ADD, t => {
        const sf = subflow(t);
        field(t).forEach(_ => sf.add(ingest(_)));
      });
      pulse.visit(pulse.REM, t => {
        const sf = subflow(t);
        field(t).forEach(_ => sf.rem(_));
      });
    } else {
      pulse.visit(pulse.MOD, t => subflow(t).mod(t));
      pulse.visit(pulse.ADD, t => subflow(t).add(t));
      pulse.visit(pulse.REM, t => subflow(t).rem(t));
    }
    if (pulse.clean()) {
      pulse.runAfter(() => this.clean());
    }
    return pulse;
  }
});

/**
 * Performs a relational projection, copying selected fields from source
 * tuples to a new set of derived tuples.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *} params.fields - The fields to project,
 *   as an array of field accessors. If unspecified, all fields will be
 *   copied with names unchanged.
 * @param {Array<string>} [params.as] - Output field names for each projected
 *   field. Any unspecified fields will use the field name provided by
 *   the field accessor.
 */
function Project(params) {
  Transform.call(this, null, params);
}
Project.Definition = {
  'type': 'Project',
  'metadata': {
    'generates': true,
    'changes': true
  },
  'params': [{
    'name': 'fields',
    'type': 'field',
    'array': true
  }, {
    'name': 'as',
    'type': 'string',
    'null': true,
    'array': true
  }]
};
inherits(Project, Transform, {
  transform(_, pulse) {
    const out = pulse.fork(pulse.NO_SOURCE),
      fields = _.fields,
      as = fieldNames(_.fields, _.as || []),
      derive = fields ? (s, t) => project(s, t, fields, as) : rederive;
    let lut;
    if (this.value) {
      lut = this.value;
    } else {
      pulse = pulse.addAll();
      lut = this.value = {};
    }
    pulse.visit(pulse.REM, t => {
      const id = tupleid(t);
      out.rem.push(lut[id]);
      lut[id] = null;
    });
    pulse.visit(pulse.ADD, t => {
      const dt = derive(t, ingest({}));
      lut[tupleid(t)] = dt;
      out.add.push(dt);
    });
    pulse.visit(pulse.MOD, t => {
      out.mod.push(derive(t, lut[tupleid(t)]));
    });
    return out;
  }
});
function project(s, t, fields, as) {
  for (let i = 0, n = fields.length; i < n; ++i) {
    t[as[i]] = fields[i](s);
  }
  return t;
}

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
inherits(Proxy, Transform, {
  transform(_, pulse) {
    this.value = _.value;
    return _.modified('value') ? pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS) : pulse.StopPropagation;
  }
});

/**
 * Generates sample quantile values from an input data stream.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - An accessor for the data field
 *   over which to calculate quantile values.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors
 *   to groupby.
 * @param {Array<number>} [params.probs] - An array of probabilities in
 *   the range (0, 1) for which to compute quantile values. If not specified,
 *   the *step* parameter will be used.
 * @param {Array<number>} [params.step=0.01] - A probability step size for
 *   sampling quantile values. All values from one-half the step size up to
 *   1 (exclusive) will be sampled. This parameter is only used if the
 *   *quantiles* parameter is not provided.
 */
function Quantile(params) {
  Transform.call(this, null, params);
}
Quantile.Definition = {
  'type': 'Quantile',
  'metadata': {
    'generates': true,
    'changes': true
  },
  'params': [{
    'name': 'groupby',
    'type': 'field',
    'array': true
  }, {
    'name': 'field',
    'type': 'field',
    'required': true
  }, {
    'name': 'probs',
    'type': 'number',
    'array': true
  }, {
    'name': 'step',
    'type': 'number',
    'default': 0.01
  }, {
    'name': 'as',
    'type': 'string',
    'array': true,
    'default': ['prob', 'value']
  }]
};
const EPSILON = 1e-14;
inherits(Quantile, Transform, {
  transform(_, pulse) {
    const out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      as = _.as || ['prob', 'value'];
    if (this.value && !_.modified() && !pulse.changed()) {
      out.source = this.value;
      return out;
    }
    const source = pulse.materialize(pulse.SOURCE).source,
      groups = partition$1(source, _.groupby, _.field),
      names = (_.groupby || []).map(accessorName),
      values = [],
      step = _.step || 0.01,
      p = _.probs || range(step / 2, 1 - EPSILON, step),
      n = p.length;
    groups.forEach(g => {
      const q = quantiles(g, p);
      for (let i = 0; i < n; ++i) {
        const t = {};
        for (let i = 0; i < names.length; ++i) {
          t[names[i]] = g.dims[i];
        }
        t[as[0]] = p[i];
        t[as[1]] = q[i];
        values.push(ingest(t));
      }
    });
    if (this.value) out.rem = this.value;
    this.value = out.add = out.source = values;
    return out;
  }
});

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
inherits(Relay, Transform, {
  transform(_, pulse) {
    let out, lut;
    if (this.value) {
      lut = this.value;
    } else {
      out = pulse = pulse.addAll();
      lut = this.value = {};
    }
    if (_.derive) {
      out = pulse.fork(pulse.NO_SOURCE);
      pulse.visit(pulse.REM, t => {
        const id = tupleid(t);
        out.rem.push(lut[id]);
        lut[id] = null;
      });
      pulse.visit(pulse.ADD, t => {
        const dt = derive(t);
        lut[tupleid(t)] = dt;
        out.add.push(dt);
      });
      pulse.visit(pulse.MOD, t => {
        const dt = lut[tupleid(t)];
        for (const k in t) {
          dt[k] = t[k];
          // down stream writes may overwrite re-derived tuples
          // conservatively mark all source fields as modified
          out.modifies(k);
        }
        out.mod.push(dt);
      });
    }
    return out;
  }
});

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
Sample.Definition = {
  'type': 'Sample',
  'metadata': {},
  'params': [{
    'name': 'size',
    'type': 'number',
    'default': 1000
  }]
};
inherits(Sample, Transform, {
  transform(_, pulse) {
    const out = pulse.fork(pulse.NO_SOURCE),
      mod = _.modified('size'),
      num = _.size,
      map = this.value.reduce((m, t) => (m[tupleid(t)] = 1, m), {});
    let res = this.value,
      cnt = this.count,
      cap = 0;

    // sample reservoir update function
    function update(t) {
      let p, idx;
      if (res.length < num) {
        res.push(t);
      } else {
        idx = ~~((cnt + 1) * random());
        if (idx < res.length && idx >= cap) {
          p = res[idx];
          if (map[tupleid(p)]) out.rem.push(p); // eviction
          res[idx] = t;
        }
      }
      ++cnt;
    }
    if (pulse.rem.length) {
      // find all tuples that should be removed, add to output
      pulse.visit(pulse.REM, t => {
        const id = tupleid(t);
        if (map[id]) {
          map[id] = -1;
          out.rem.push(t);
        }
        --cnt;
      });

      // filter removed tuples out of the sample reservoir
      res = res.filter(t => map[tupleid(t)] !== -1);
    }
    if ((pulse.rem.length || mod) && res.length < num && pulse.source) {
      // replenish sample if backing data source is available
      cap = cnt = res.length;
      pulse.visit(pulse.SOURCE, t => {
        // update, but skip previously sampled tuples
        if (!map[tupleid(t)]) update(t);
      });
      cap = -1;
    }
    if (mod && res.length > num) {
      const n = res.length - num;
      for (let i = 0; i < n; ++i) {
        map[tupleid(res[i])] = -1;
        out.rem.push(res[i]);
      }
      res = res.slice(n);
    }
    if (pulse.mod.length) {
      // propagate modified tuples in the sample reservoir
      pulse.visit(pulse.MOD, t => {
        if (map[tupleid(t)]) out.mod.push(t);
      });
    }
    if (pulse.add.length) {
      // update sample reservoir
      pulse.visit(pulse.ADD, update);
    }
    if (pulse.add.length || cap < 0) {
      // output newly added tuples
      out.add = res.filter(t => !map[tupleid(t)]);
    }
    this.count = cnt;
    this.value = out.source = res;
    return out;
  }
});

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
Sequence.Definition = {
  'type': 'Sequence',
  'metadata': {
    'generates': true,
    'changes': true
  },
  'params': [{
    'name': 'start',
    'type': 'number',
    'required': true
  }, {
    'name': 'stop',
    'type': 'number',
    'required': true
  }, {
    'name': 'step',
    'type': 'number',
    'default': 1
  }, {
    'name': 'as',
    'type': 'string',
    'default': 'data'
  }]
};
inherits(Sequence, Transform, {
  transform(_, pulse) {
    if (this.value && !_.modified()) return;
    const out = pulse.materialize().fork(pulse.MOD),
      as = _.as || 'data';
    out.rem = this.value ? pulse.rem.concat(this.value) : pulse.rem;
    this.value = range(_.start, _.stop, _.step || 1).map(v => {
      const t = {};
      t[as] = v;
      return ingest(t);
    });
    out.add = pulse.add.concat(this.value);
    return out;
  }
});

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

inherits(Sieve, Transform, {
  transform(_, pulse) {
    this.value = pulse.source;
    return pulse.changed() ? pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS) : pulse.StopPropagation;
  }
});

/**
 * Discretize dates to specific time units.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The data field containing date/time values.
 */
function TimeUnit(params) {
  Transform.call(this, null, params);
}
const OUTPUT = ['unit0', 'unit1'];
TimeUnit.Definition = {
  'type': 'TimeUnit',
  'metadata': {
    'modifies': true
  },
  'params': [{
    'name': 'field',
    'type': 'field',
    'required': true
  }, {
    'name': 'interval',
    'type': 'boolean',
    'default': true
  }, {
    'name': 'units',
    'type': 'enum',
    'values': TIME_UNITS,
    'array': true
  }, {
    'name': 'step',
    'type': 'number',
    'default': 1
  }, {
    'name': 'maxbins',
    'type': 'number',
    'default': 40
  }, {
    'name': 'extent',
    'type': 'date',
    'array': true
  }, {
    'name': 'timezone',
    'type': 'enum',
    'default': 'local',
    'values': ['local', 'utc']
  }, {
    'name': 'as',
    'type': 'string',
    'array': true,
    'length': 2,
    'default': OUTPUT
  }]
};
inherits(TimeUnit, Transform, {
  transform(_, pulse) {
    const field = _.field,
      band = _.interval !== false,
      utc = _.timezone === 'utc',
      floor = this._floor(_, pulse),
      offset = (utc ? utcInterval : timeInterval)(floor.unit).offset,
      as = _.as || OUTPUT,
      u0 = as[0],
      u1 = as[1],
      step = floor.step;
    let min = floor.start || Infinity,
      max = floor.stop || -Infinity,
      flag = pulse.ADD;
    if (_.modified() || pulse.changed(pulse.REM) || pulse.modified(accessorFields(field))) {
      pulse = pulse.reflow(true);
      flag = pulse.SOURCE;
      min = Infinity;
      max = -Infinity;
    }
    pulse.visit(flag, t => {
      const v = field(t);
      let a, b;
      if (v == null) {
        t[u0] = null;
        if (band) t[u1] = null;
      } else {
        t[u0] = a = b = floor(v);
        if (band) t[u1] = b = offset(a, step);
        if (a < min) min = a;
        if (b > max) max = b;
      }
    });
    floor.start = min;
    floor.stop = max;
    return pulse.modifies(band ? as : u0);
  },
  _floor(_, pulse) {
    const utc = _.timezone === 'utc';

    // get parameters
    const {
      units,
      step
    } = _.units ? {
      units: _.units,
      step: _.step || 1
    } : timeBin({
      extent: _.extent || extent(pulse.materialize(pulse.SOURCE).source, _.field),
      maxbins: _.maxbins
    });

    // check / standardize time units
    const tunits = timeUnits(units),
      prev = this.value || {},
      floor = (utc ? utcFloor : timeFloor)(tunits, step);
    floor.unit = peek(tunits);
    floor.units = tunits;
    floor.step = step;
    floor.start = prev.start;
    floor.stop = prev.stop;
    return this.value = floor;
  }
});

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
inherits(TupleIndex, Transform, {
  transform(_, pulse) {
    const df = pulse.dataflow,
      field = _.field,
      index = this.value,
      set = t => index.set(field(t), t);
    let mod = true;
    if (_.modified('field') || pulse.modified(field.fields)) {
      index.clear();
      pulse.visit(pulse.SOURCE, set);
    } else if (pulse.changed()) {
      pulse.visit(pulse.REM, t => index.delete(field(t)));
      pulse.visit(pulse.ADD, set);
    } else {
      mod = false;
    }
    this.modified(mod);
    if (index.empty > df.cleanThreshold) df.runAfter(index.clean);
    return pulse.fork();
  }
});

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
inherits(Values, Transform, {
  transform(_, pulse) {
    const run = !this.value || _.modified('field') || _.modified('sort') || pulse.changed() || _.sort && pulse.modified(_.sort.fields);
    if (run) {
      this.value = (_.sort ? pulse.source.slice().sort(stableCompare(_.sort)) : pulse.source).map(_.field);
    }
  }
});

function WindowOp(op, field, param, as) {
  const fn = WindowOps[op](field, param);
  return {
    init: fn.init || zero,
    update: function (w, t) {
      t[as] = fn.next(w);
    }
  };
}
const WindowOps = {
  row_number: function () {
    return {
      next: w => w.index + 1
    };
  },
  rank: function () {
    let rank;
    return {
      init: () => rank = 1,
      next: w => {
        const i = w.index,
          data = w.data;
        return i && w.compare(data[i - 1], data[i]) ? rank = i + 1 : rank;
      }
    };
  },
  dense_rank: function () {
    let drank;
    return {
      init: () => drank = 1,
      next: w => {
        const i = w.index,
          d = w.data;
        return i && w.compare(d[i - 1], d[i]) ? ++drank : drank;
      }
    };
  },
  percent_rank: function () {
    const rank = WindowOps.rank(),
      next = rank.next;
    return {
      init: rank.init,
      next: w => (next(w) - 1) / (w.data.length - 1)
    };
  },
  cume_dist: function () {
    let cume;
    return {
      init: () => cume = 0,
      next: w => {
        const d = w.data,
          c = w.compare;
        let i = w.index;
        if (cume < i) {
          while (i + 1 < d.length && !c(d[i], d[i + 1])) ++i;
          cume = i;
        }
        return (1 + cume) / d.length;
      }
    };
  },
  ntile: function (field, num) {
    num = +num;
    if (!(num > 0)) error('ntile num must be greater than zero.');
    const cume = WindowOps.cume_dist(),
      next = cume.next;
    return {
      init: cume.init,
      next: w => Math.ceil(num * next(w))
    };
  },
  lag: function (field, offset) {
    offset = +offset || 1;
    return {
      next: w => {
        const i = w.index - offset;
        return i >= 0 ? field(w.data[i]) : null;
      }
    };
  },
  lead: function (field, offset) {
    offset = +offset || 1;
    return {
      next: w => {
        const i = w.index + offset,
          d = w.data;
        return i < d.length ? field(d[i]) : null;
      }
    };
  },
  first_value: function (field) {
    return {
      next: w => field(w.data[w.i0])
    };
  },
  last_value: function (field) {
    return {
      next: w => field(w.data[w.i1 - 1])
    };
  },
  nth_value: function (field, nth) {
    nth = +nth;
    if (!(nth > 0)) error('nth_value nth must be greater than zero.');
    return {
      next: w => {
        const i = w.i0 + (nth - 1);
        return i < w.i1 ? field(w.data[i]) : null;
      }
    };
  },
  prev_value: function (field) {
    let prev;
    return {
      init: () => prev = null,
      next: w => {
        const v = field(w.data[w.index]);
        return v != null ? prev = v : prev;
      }
    };
  },
  next_value: function (field) {
    let v, i;
    return {
      init: () => (v = null, i = -1),
      next: w => {
        const d = w.data;
        return w.index <= i ? v : (i = find(field, d, w.index)) < 0 ? (i = d.length, v = null) : v = field(d[i]);
      }
    };
  }
};
function find(field, data, index) {
  for (let n = data.length; index < n; ++index) {
    const v = field(data[index]);
    if (v != null) return index;
  }
  return -1;
}
const ValidWindowOps = Object.keys(WindowOps);

function WindowState(_) {
  const ops = array(_.ops),
    fields = array(_.fields),
    params = array(_.params),
    as = array(_.as),
    outputs = this.outputs = [],
    windows = this.windows = [],
    inputs = {},
    map = {},
    counts = [],
    measures = [];
  let countOnly = true;
  function visitInputs(f) {
    array(accessorFields(f)).forEach(_ => inputs[_] = 1);
  }
  visitInputs(_.sort);
  ops.forEach((op, i) => {
    const field = fields[i],
      mname = accessorName(field),
      name = measureName(op, mname, as[i]);
    visitInputs(field);
    outputs.push(name);

    // Window operation
    if (hasOwnProperty(WindowOps, op)) {
      windows.push(WindowOp(op, fields[i], params[i], name));
    }

    // Aggregate operation
    else {
      if (field == null && op !== 'count') {
        error('Null aggregate field specified.');
      }
      if (op === 'count') {
        counts.push(name);
        return;
      }
      countOnly = false;
      let m = map[mname];
      if (!m) {
        m = map[mname] = [];
        m.field = field;
        measures.push(m);
      }
      m.push(createMeasure(op, name));
    }
  });
  if (counts.length || measures.length) {
    this.cell = cell(measures, counts, countOnly);
  }
  this.inputs = Object.keys(inputs);
}
const prototype = WindowState.prototype;
prototype.init = function () {
  this.windows.forEach(_ => _.init());
  if (this.cell) this.cell.init();
};
prototype.update = function (w, t) {
  const cell = this.cell,
    wind = this.windows,
    data = w.data,
    m = wind && wind.length;
  let j;
  if (cell) {
    for (j = w.p0; j < w.i0; ++j) cell.rem(data[j]);
    for (j = w.p1; j < w.i1; ++j) cell.add(data[j]);
    cell.set(t);
  }
  for (j = 0; j < m; ++j) wind[j].update(w, t);
};
function cell(measures, counts, countOnly) {
  measures = measures.map(m => compileMeasures(m, m.field));
  const cell = {
    num: 0,
    agg: null,
    store: false,
    count: counts
  };
  if (!countOnly) {
    var n = measures.length,
      a = cell.agg = Array(n),
      i = 0;
    for (; i < n; ++i) a[i] = new measures[i](cell);
  }
  if (cell.store) {
    var store = cell.data = new TupleStore();
  }
  cell.add = function (t) {
    cell.num += 1;
    if (countOnly) return;
    if (store) store.add(t);
    for (let i = 0; i < n; ++i) {
      a[i].add(a[i].get(t), t);
    }
  };
  cell.rem = function (t) {
    cell.num -= 1;
    if (countOnly) return;
    if (store) store.rem(t);
    for (let i = 0; i < n; ++i) {
      a[i].rem(a[i].get(t), t);
    }
  };
  cell.set = function (t) {
    let i, n;

    // consolidate stored values
    if (store) store.values();

    // update tuple properties
    for (i = 0, n = counts.length; i < n; ++i) t[counts[i]] = cell.num;
    if (!countOnly) for (i = 0, n = a.length; i < n; ++i) a[i].set(t);
  };
  cell.init = function () {
    cell.num = 0;
    if (store) store.reset();
    for (let i = 0; i < n; ++i) a[i].init();
  };
  return cell;
}

/**
 * Perform window calculations and write results to the input stream.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(*,*): number} [params.sort] - A comparator function for sorting tuples within a window.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors by which to partition tuples into separate windows.
 * @param {Array<string>} params.ops - An array of strings indicating window operations to perform.
 * @param {Array<function(object): *>} [params.fields] - An array of accessors
 *   for data fields to use as inputs to window operations.
 * @param {Array<*>} [params.params] - An array of parameter values for window operations.
 * @param {Array<string>} [params.as] - An array of output field names for window operations.
 * @param {Array<number>} [params.frame] - Window frame definition as two-element array.
 * @param {boolean} [params.ignorePeers=false] - If true, base window frame boundaries on row
 *   number alone, ignoring peers with identical sort values. If false (default),
 *   the window boundaries will be adjusted to include peer values.
 */
function Window(params) {
  Transform.call(this, {}, params);
  this._mlen = 0;
  this._mods = [];
}
Window.Definition = {
  'type': 'Window',
  'metadata': {
    'modifies': true
  },
  'params': [{
    'name': 'sort',
    'type': 'compare'
  }, {
    'name': 'groupby',
    'type': 'field',
    'array': true
  }, {
    'name': 'ops',
    'type': 'enum',
    'array': true,
    'values': ValidWindowOps.concat(ValidAggregateOps)
  }, {
    'name': 'params',
    'type': 'number',
    'null': true,
    'array': true
  }, {
    'name': 'fields',
    'type': 'field',
    'null': true,
    'array': true
  }, {
    'name': 'as',
    'type': 'string',
    'null': true,
    'array': true
  }, {
    'name': 'frame',
    'type': 'number',
    'null': true,
    'array': true,
    'length': 2,
    'default': [null, 0]
  }, {
    'name': 'ignorePeers',
    'type': 'boolean',
    'default': false
  }]
};
inherits(Window, Transform, {
  transform(_, pulse) {
    this.stamp = pulse.stamp;
    const mod = _.modified(),
      cmp = stableCompare(_.sort),
      key = groupkey(_.groupby),
      group = t => this.group(key(t));

    // initialize window state
    let state = this.state;
    if (!state || mod) {
      state = this.state = new WindowState(_);
    }

    // partition input tuples
    if (mod || pulse.modified(state.inputs)) {
      this.value = {};
      pulse.visit(pulse.SOURCE, t => group(t).add(t));
    } else {
      pulse.visit(pulse.REM, t => group(t).remove(t));
      pulse.visit(pulse.ADD, t => group(t).add(t));
    }

    // perform window calculations for each modified partition
    for (let i = 0, n = this._mlen; i < n; ++i) {
      processPartition(this._mods[i], state, cmp, _);
    }
    this._mlen = 0;
    this._mods = [];

    // TODO don't reflow everything?
    return pulse.reflow(mod).modifies(state.outputs);
  },
  group(key) {
    let group = this.value[key];
    if (!group) {
      group = this.value[key] = SortedList(tupleid);
      group.stamp = -1;
    }
    if (group.stamp < this.stamp) {
      group.stamp = this.stamp;
      this._mods[this._mlen++] = group;
    }
    return group;
  }
});
function processPartition(list, state, cmp, _) {
  const sort = _.sort,
    range = sort && !_.ignorePeers,
    frame = _.frame || [null, 0],
    data = list.data(cmp),
    // use cmp for stable sort
    n = data.length,
    b = range ? bisector(sort) : null,
    w = {
      i0: 0,
      i1: 0,
      p0: 0,
      p1: 0,
      index: 0,
      data: data,
      compare: sort || constant(-1)
    };
  state.init();
  for (let i = 0; i < n; ++i) {
    setWindow(w, frame, i, n);
    if (range) adjustRange(w, b);
    state.update(w, data[i]);
  }
}
function setWindow(w, f, i, n) {
  w.p0 = w.i0;
  w.p1 = w.i1;
  w.i0 = f[0] == null ? 0 : Math.max(0, i - Math.abs(f[0]));
  w.i1 = f[1] == null ? n : Math.min(n, i + Math.abs(f[1]) + 1);
  w.index = i;
}

// if frame type is 'range', adjust window for peer values
function adjustRange(w, bisect) {
  const r0 = w.i0,
    r1 = w.i1 - 1,
    c = w.compare,
    d = w.data,
    n = d.length - 1;
  if (r0 > 0 && !c(d[r0], d[r0 - 1])) w.i0 = bisect.left(d, d[r0]);
  if (r1 < n && !c(d[r1], d[r1 + 1])) w.i1 = bisect.right(d, d[r1]);
}

export { Aggregate as aggregate, Bin as bin, Collect as collect, Compare as compare, CountPattern as countpattern, Cross as cross, Density as density, DotBin as dotbin, Expression as expression, Extent as extent, Facet as facet, Field as field, Filter as filter, Flatten as flatten, Fold as fold, Formula as formula, Generate as generate, Impute as impute, JoinAggregate as joinaggregate, KDE as kde, Key as key, Load as load, Lookup as lookup, MultiExtent as multiextent, MultiValues as multivalues, Params as params, Pivot as pivot, PreFacet as prefacet, Project as project, Proxy as proxy, Quantile as quantile, Relay as relay, Sample as sample, Sequence as sequence, Sieve as sieve, Subflow as subflow, TimeUnit as timeunit, TupleIndex as tupleindex, Values as values, Window as window };
