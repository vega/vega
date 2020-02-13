import {extend, identity, stringValue} from 'vega-util';

export function measureName(op, field, as) {
  return as || (op + (!field ? '' : '_' + field));
}

export var AggregateOps = {
  'values': measure({
    name: 'values',
    init: 'cell.store = true;',
    set:  'cell.data.values()', idx: -1
  }),
  'count': measure({
    name: 'count',
    set:  'cell.num'
  }),
  '__count__': measure({
    name: 'count',
    set:  'this.missing + this.valid'
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
    add:  'this.sum += +v;',
    rem:  'this.sum -= v;',
    set:  'this.sum'
  }),
  'mean': measure({
    name: 'mean',
    init: 'this.mean = 0;',
    add:  'var d = v - this.mean; this.mean += d / this.valid;',
    rem:  'var d = v - this.mean; this.mean -= this.valid ? d / this.valid : this.mean;',
    set:  'this.valid ? this.mean : undefined'
  }),
  'average': measure({
    name: 'average',
    set:  'this.valid ? this.mean : undefined',
    req:  ['mean'], idx: 1
  }),
  'variance': measure({
    name: 'variance',
    init: 'this.dev = 0;',
    add:  'this.dev += d * (v - this.mean);',
    rem:  'this.dev -= d * (v - this.mean);',
    set:  'this.valid > 1 ? this.dev / (this.valid-1) : undefined',
    req:  ['mean'], idx: 1
  }),
  'variancep': measure({
    name: 'variancep',
    set:  'this.valid > 1 ? this.dev / this.valid : undefined',
    req:  ['variance'], idx: 2
  }),
  'stdev': measure({
    name: 'stdev',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid-1)) : undefined',
    req:  ['variance'], idx: 2
  }),
  'stdevp': measure({
    name: 'stdevp',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / this.valid) : undefined',
    req:  ['variance'], idx: 2
  }),
  'stderr': measure({
    name: 'stderr',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid * (this.valid-1))) : undefined',
    req:  ['variance'], idx: 2
  }),
  'distinct': measure({
    name: 'distinct',
    set:  'cell.data.distinct(this.get)',
    req:  ['values'], idx: 3
  }),
  'ci0': measure({
    name: 'ci0',
    set:  'cell.data.ci0(this.get)',
    req:  ['values'], idx: 3
  }),
  'ci1': measure({
    name: 'ci1',
    set:  'cell.data.ci1(this.get)',
    req:  ['values'], idx: 3
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
  'argmin': measure({
    name: 'argmin',
    init: 'this.argmin = undefined;',
    add:  'if (v < this.min) this.argmin = t;',
    rem:  'if (v <= this.min) this.argmin = undefined;',
    set:  'this.argmin || cell.data.argmin(this.get)',
    req:  ['min'], str: ['values'], idx: 3
  }),
  'argmax': measure({
    name: 'argmax',
    init: 'this.argmax = undefined;',
    add:  'if (v > this.max) this.argmax = t;',
    rem:  'if (v >= this.max) this.argmax = undefined;',
    set:  'this.argmax || cell.data.argmax(this.get)',
    req:  ['max'], str: ['values'], idx: 3
  }),
  'min': measure({
    name: 'min',
    init: 'this.min = undefined;',
    add:  'if (v < this.min || this.min === undefined) this.min = v;',
    rem:  'if (v <= this.min) this.min = NaN;',
    set:  'this.min = (Number.isNaN(this.min) ? cell.data.min(this.get) : this.min)',
    str:  ['values'], idx: 4
  }),
  'max': measure({
    name: 'max',
    init: 'this.max = undefined;',
    add:  'if (v > this.max || this.max === undefined) this.max = v;',
    rem:  'if (v >= this.max) this.max = NaN;',
    set:  'this.max = (Number.isNaN(this.max) ? cell.data.max(this.get) : this.max)',
    str:  ['values'], idx: 4
  })
};

export var ValidAggregateOps = Object.keys(AggregateOps);

export function createMeasure(op, name) {
  return AggregateOps[op](name);
}

function measure(base) {
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
    function helper(r) { if (!m[r]) collect(m, m[r] = AggregateOps[r]()); }
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
  var values = [], key;
  for (key in map) values.push(map[key]);
  return values.sort(compareIndex);
}

export function compileMeasures(agg, field) {
  var get = field || identity,
      all = resolve(agg, true), // assume streaming removes may occur
      init = 'var cell = this.cell; this.valid = 0; this.missing = 0;',
      ctr = 'this.cell = cell; this.init();',
      add = 'if(v==null){++this.missing; return;} if(v!==v) return; ++this.valid;',
      rem = 'if(v==null){--this.missing; return;} if(v!==v) return; --this.valid;',
      set = 'var cell = this.cell;';

  all.forEach(function(a) {
    init += a.init;
    add += a.add;
    rem += a.rem;
  });
  agg.slice().sort(compareIndex).forEach(function(a) {
    set += 't[' + stringValue(a.out) + ']=' + a.set + ';';
  });
  set += 'return t;';

  ctr = Function('cell', ctr);
  ctr.prototype.init = Function(init);
  ctr.prototype.add = Function('v', 't', add);
  ctr.prototype.rem = Function('v', 't', rem);
  ctr.prototype.set = Function('t', set);
  ctr.prototype.get = get;
  ctr.fields = agg.map(function(_) { return _.out; });
  return ctr;
}
