import Bitmaps from './Bitmaps';
import Dimension from './Dimension';
import SortedIndex from './SortedIndex';
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
  this._indices = null;
  this._dims = null;
}

CrossFilter.Definition = {
  'type': 'CrossFilter',
  'metadata': {},
  'params': [
    { 'name': 'fields', 'type': 'field', 'array': true, 'required': true },
    { 'name': 'query', 'type': 'array', 'array': true, 'required': true,
      'content': {'type': 'number', 'array': true, 'length': 2} }
  ]
};

inherits(CrossFilter, Transform, {
  transform(_, pulse) {
    if (!this._dims) {
      return this.init(_, pulse);
    } else {
      var init = _.modified('fields')
            || _.fields.some(f => pulse.modified(f.fields));

      return init
        ? this.reinit(_, pulse)
        : this.eval(_, pulse);
    }
  },

  init(_, pulse) {
    const fields = _.fields;
    const query = _.query;
    const indices = this._indices = {};
    const dims = this._dims = [];
    const m = query.length;
    let i = 0;
    let key;
    let index;

    // instantiate indices and dimensions
    for (; i<m; ++i) {
      key = fields[i].fname;
      index = indices[key] || (indices[key] = SortedIndex());
      dims.push(Dimension(index, i, query[i]));
    }

    return this.eval(_, pulse);
  },

  reinit(_, pulse) {
    const output = pulse.materialize().fork();
    const fields = _.fields;
    const query = _.query;
    const indices = this._indices;
    const dims = this._dims;
    const bits = this.value;
    const curr = bits.curr();
    const prev = bits.prev();
    const all = bits.all();
    const out = (output.rem = output.add);
    const mod = output.mod;
    const m = query.length;
    const adds = {};
    let add;
    let index;
    let key;
    let mods;
    let remMap;
    let modMap;
    let i;
    let n;
    let f;

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
        key = f.fname;
        if (!(add = adds[key])) {
          indices[key] = index = SortedIndex();
          adds[key] = add = index.insert(f, pulse.source, 0);
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
  },

  eval(_, pulse) {
    const output = pulse.materialize().fork();
    const m = this._dims.length;
    let mask = 0;

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
  },

  insert(_, pulse, output) {
    const tuples = pulse.add;
    const bits = this.value;
    const dims = this._dims;
    const indices = this._indices;
    const fields = _.fields;
    const adds = {};
    const out = output.add;
    const n = bits.size() + tuples.length;
    const m = dims.length;
    let k = bits.size();
    let j;
    let key;
    let add;

    // resize bitmaps and add tuples as needed
    bits.resize(n, m);
    bits.add(tuples);

    const curr = bits.curr();
    const prev = bits.prev();
    const all  = bits.all();

    // add to dimensional indices
    for (j=0; j<m; ++j) {
      key = fields[j].fname;
      add = adds[key] || (adds[key] = indices[key].insert(fields[j], tuples, k));
      dims[j].onAdd(add, curr);
    }

    // set previous filters, output if passes at least one filter
    for (; k < n; ++k) {
      prev[k] = all;
      if (curr[k] !== all) out.push(k);
    }
  },

  modify(pulse, output) {
    const out = output.mod;
    const bits = this.value;
    const curr = bits.curr();
    const all  = bits.all();
    const tuples = pulse.mod;
    let i;
    let n;
    let k;

    for (i=0, n=tuples.length; i<n; ++i) {
      k = tuples[i]._index;
      if (curr[k] !== all) out.push(k);
    }
  },

  remove(_, pulse, output) {
    const indices = this._indices;
    const bits = this.value;
    const curr = bits.curr();
    const prev = bits.prev();
    const all  = bits.all();
    const map = {};
    const out = output.rem;
    const tuples = pulse.rem;
    let i;
    let n;
    let k;
    let f;

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
  },

  // reindex filters and indices after propagation completes
  reindex(pulse, num, map) {
    const indices = this._indices;
    const bits = this.value;

    pulse.runAfter(() => {
      const indexMap = bits.remove(num, map);
      for (const key in indices) indices[key].reindex(indexMap);
    });
  },

  update(_, pulse, output) {
    const dims = this._dims;
    const query = _.query;
    const stamp = pulse.stamp;
    const m = dims.length;
    let mask = 0;
    let i;
    let q;

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
  },

  incrementAll(dim, query, stamp, out) {
    const bits = this.value;
    const seen = bits.seen();
    const curr = bits.curr();
    const prev = bits.prev();
    const index = dim.index();
    const old = dim.bisect(dim.range);
    const range = dim.bisect(query);
    const lo1 = range[0];
    const hi1 = range[1];
    const lo0 = old[0];
    const hi0 = old[1];
    const one = dim.one;
    let i;
    let j;
    let k;

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
  },

  incrementOne(dim, query, add, rem) {
    const bits = this.value;
    const curr = bits.curr();
    const index = dim.index();
    const old = dim.bisect(dim.range);
    const range = dim.bisect(query);
    const lo1 = range[0];
    const hi1 = range[1];
    const lo0 = old[0];
    const hi0 = old[1];
    const one = dim.one;
    let i;
    let j;
    let k;

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
  }
});
