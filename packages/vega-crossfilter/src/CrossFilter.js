import SortedIndex from './SortedIndex';
import Bitmaps from './Bitmaps';
import {Transform} from 'vega-dataflow';
import {inherits} from 'vega-util';

/**
 * An indexed multi-dimensional filter.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} params.fields - An array of dimension accessors to filter.
 * @param {Array} params.query - An array of per-dimension range queries.
 */
export default function CrossFilter(params) {
  Transform.call(this, Bitmaps(), params);
  this.index = null;
}

function Dimension(index, field, query) {
  var dim = SortedIndex();
  dim.one = (1 << index);
  dim.zero = ~dim.one;
  dim.field = field;
  dim.range = query.slice();
  dim.add = function(data, curr, k) {
    var dim = this,
        one = dim.one,
        added = dim.insert(dim.field, data, k),
        range = dim.bisect(dim.range, added.value),
        index = added.index,
        lo = range[0],
        hi = range[1],
        n1 = index.length, i;

    for (i=0;  i<lo; ++i) curr[index[i]] |= one;
    for (i=hi; i<n1; ++i) curr[index[i]] |= one;
  };
  return dim;
}

var prototype = inherits(CrossFilter, Transform);

prototype.transform = function(_, pulse) {
  if (!this.index) {
    return this.init(_, pulse);
  } else {
    var init = _.modified('fields')
          || _.fields.some(function(f) { return pulse.modified(f.fields); });

    return init
      ? this.reinit(_, pulse)
      : this.eval(_, pulse);
  }
};

prototype.init = function(_, pulse) {
  var fields = _.fields,
      query = _.query,
      m = query.length,
      dims = (this.index = Array(m)), q;

  // instantiate dimensions
  for (q=0; q<m; ++q) {
    dims[q] = Dimension(q, fields[q], query[q]);
  }

  return this.eval(_, pulse);
};

prototype.reinit = function(_, pulse) {
  var output = pulse.materialize().fork(),
      fields = _.fields,
      query = _.query,
      m = query.length,
      dims = this.index,
      bits = this.value,
      curr = bits.curr(),
      prev = bits.prev(),
      all = bits.all(),
      out = (output.rem = output.add),
      mod = output.mod,
      mods, remMap, modMap, i, n, f, q;

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
  for (q=0; q<m; ++q) {
    f = fields[q];
    if (!dims[q] || _.modified('fields', q) || pulse.modified(f.fields)) {
      dims[q] = Dimension(q, fields[q], query[q]);
      dims[q].add(pulse.source, curr, 0);
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

prototype.eval = function(_, pulse) {
  var output = pulse.materialize().fork(),
      m = this.index.length,
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

prototype.insert = function(_, pulse, output) {
  var tuples = pulse.add,
      bits = this.value,
      dims = this.index,
      out = output.add,
      k = bits.size(),
      n = k + tuples.length,
      m = dims.length, j;

  // resize bitmaps and add tuples as needed
  bits.resize(n, m);
  bits.add(tuples);

  var curr = bits.curr(),
      prev = bits.prev(),
      all  = bits.all();

  // add to dimensional indices
  for (j=0; j<m; ++j) {
    dims[j].add(tuples, curr, k);
  }

  // set previous filters, output if passes at least one filter
  for (; k<n; ++k) {
    prev[k] = all;
    if (curr[k] !== all) out.push(k);
  }
};

prototype.modify = function(pulse, output) {
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

prototype.remove = function(_, pulse, output) {
  var dims = this.index,
      bits = this.value,
      curr = bits.curr(),
      prev = bits.prev(),
      all  = bits.all(),
      map = {},
      out = output.rem,
      tuples = pulse.rem,
      i, j, n, m, k, f;

  // process tuples, output if passes at least one filter
  for (i=0, n=tuples.length; i<n; ++i) {
    k = tuples[i]._index;
    map[k] = 1; // build index map
    prev[k] = (f = curr[k]);
    curr[k] = all;
    if (f !== all) out.push(k);
  }

  // remove from dimensional indices
  for (j=0, m=dims.length; j<m; ++j) {
    dims[j].remove(n, map);
  }

  return (this.reindex(pulse, n, map), map);
};

// reindex filters and indices after propagation completes
prototype.reindex = function(pulse, num, map) {
  var bits = this.value,
      dims = this.index;

  pulse.runAfter(function() {
    var indexMap = bits.remove(num, map);
    dims.forEach(function(dim) {
      dim.reindex(indexMap);
    });
  });
};

prototype.update = function(_, pulse, output) {
  var dims = this.index,
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

prototype.incrementAll = function(dim, query, stamp, out) {
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

prototype.incrementOne = function(dim, query, add, rem) {
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
