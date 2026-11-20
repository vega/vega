import {tupleid} from 'vega-dataflow';
import {bootstrapCI, quartiles} from 'vega-statistics';
import {extentIndex, field, hasOwnProperty} from 'vega-util';

export default function TupleStore(key) {
  this._key = key ? field(key) : tupleid;
  this.reset();
}

const prototype = TupleStore.prototype;

prototype.reset = function() {
  this._add = [];
  this._rem = [];
  this._memo = {};
};

prototype.add = function(v) {
  this._add.push(v);
  this._memo = {};
};

prototype.rem = function(v) {
  this._rem.push(v);
  this._memo = {};
};

prototype.values = function() {
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
  for (i=0; i<m; ++i) {
    map[k(r[i])] = 1;
  }
  for (i=0, j=0; i<n; ++i) {
    if (map[k(v = a[i])]) {
      map[k(v)] = 0;
    } else {
      x[j++] = v;
    }
  }

  this._rem = [];
  return (this._add = x);
};

// memoizing statistics methods
// Each statistic is cached separately along with the accessor it was
// computed for, and all caches are cleared whenever the store changes.
function memoize(store, name, get, compute) {
  const memo = store._memo[name];
  if (memo && memo.get === get) return memo.value;
  const value = compute(store.values(), get);
  store._memo[name] = {get, value};
  return value;
}

function computeExtent(v, get) {
  const i = extentIndex(v, get);
  return [v[i[0]], v[i[1]]];
}

function computeCI(v, get) {
  return bootstrapCI(v, 1000, 0.05, get);
}

prototype.distinct = function(get) {
  const v = this.values(),
        map = {};

  let n = v.length,
      count = 0, s;

  while (--n >= 0) {
    s = get(v[n]) + '';
    if (!hasOwnProperty(map, s)) {
      map[s] = 1;
      ++count;
    }
  }

  return count;
};

prototype.extent = function(get) {
  return memoize(this, 'extent', get, computeExtent);
};

prototype.argmin = function(get) {
  return this.extent(get)[0] || {};
};

prototype.argmax = function(get) {
  return this.extent(get)[1] || {};
};

prototype.min = function(get) {
  const m = this.extent(get)[0];
  return m != null ? get(m) : undefined;
};

prototype.max = function(get) {
  const m = this.extent(get)[1];
  return m != null ? get(m) : undefined;
};

prototype.quartile = function(get) {
  return memoize(this, 'quartile', get, quartiles);
};

prototype.q1 = function(get) {
  return this.quartile(get)[0];
};

prototype.q2 = function(get) {
  return this.quartile(get)[1];
};

prototype.q3 = function(get) {
  return this.quartile(get)[2];
};

prototype.ci = function(get) {
  return memoize(this, 'ci', get, computeCI);
};

prototype.ci0 = function(get) {
  return this.ci(get)[0];
};

prototype.ci1 = function(get) {
  return this.ci(get)[1];
};
