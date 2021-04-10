import {Aggregate, Collect} from './transforms';
import {aggrField, entry, keyFieldRef, ref, sortKey} from './util';
import {isString} from 'vega-util';

export default function DataScope(scope, input, output, values, aggr) {
  this.scope = scope;   // parent scope object
  this.input = input;   // first operator in pipeline (tuple input)
  this.output = output; // last operator in pipeline (tuple output)
  this.values = values; // operator for accessing tuples (but not tuple flow)

  // last aggregate in transform pipeline
  this.aggregate = aggr;

  // lookup table of field indices
  this.index = {};
}

DataScope.fromEntries = function(scope, entries) {
  const n = entries.length,
        values = entries[n-1],
        output = entries[n-2];

  let input = entries[0],
      aggr = null,
      i = 1;

  if (input && input.type === 'load') {
    input = entries[1];
  }

  // add operator entries to this scope, wire up pulse chain
  scope.add(entries[0]);
  for (; i<n; ++i) {
    entries[i].params.pulse = ref(entries[i-1]);
    scope.add(entries[i]);
    if (entries[i].type === 'aggregate') aggr = entries[i];
  }

  return new DataScope(scope, input, output, values, aggr);
};

function fieldKey(field) {
  return isString(field) ? field : null;
}

function addSortField(scope, p, sort, src) {
  const as = aggrField(sort.op, sort.field);
  let s;

  if (p.ops) {
    for (let i = 0, n = p.as.length; i < n; ++i) {
      if (p.as[i] === as) return;
    }
  } else {
    p.ops = ['count'];
    p.fields = [null];
    p.as = ['count'];
  }
  if (sort.op) {
    p.ops.push((s=sort.op.signal) ? scope.signalRef(s) : sort.op);
    p.fields.push(scope.fieldRef(sort.field, undefined, src));
    p.as.push(as);
  }
}

function cache(scope, ds, name, optype, field, counts, index, src) {
  const cache = ds[name] || (ds[name] = {}),
        sort = sortKey(counts);

  let k = fieldKey(field),
      v, op;

  if (k != null) {
    scope = ds.scope;
    k = k + (sort ? '|' + sort : '');
    v = cache[k];
  }

  if (!v) {
    const params = counts
      ? {field: keyFieldRef, pulse: ds.countsRef(scope, field, counts, src)}
      : {field: scope.fieldRef(field, undefined, src), pulse: ref(ds.output)};
    if (sort) params.sort = scope.sortRef(counts, src);
    op = scope.add(entry(optype, undefined, params, undefined, src));
    if (index) ds.index[field] = op;
    v = ref(op);
    if (k != null) cache[k] = v;
  }
  return v;
}

DataScope.prototype = {
  countsRef(scope, field, sort, src) {
    const ds = this,
          cache = ds.counts || (ds.counts = {}),
          k = fieldKey(field);

    let v, a, p;

    if (k != null) {
      scope = ds.scope;
      v = cache[k];
    }

    if (!v) {
      p = {
        groupby: scope.fieldRef(field, 'key', src),
        pulse: ref(ds.output)
      };
      if (sort && sort.field) addSortField(scope, p, sort, src);
      a = scope.add(Aggregate(p, undefined, undefined, src));
      v = scope.add(Collect({pulse: ref(a)}, undefined, undefined, src));
      v = {agg: a, ref: ref(v)};
      if (k != null) cache[k] = v;
    } else if (sort && sort.field) {
      addSortField(scope, v.agg.params, sort, src);
    }

    return v.ref;
  },

  tuplesRef() {
    return ref(this.values);
  },

  extentRef(scope, field, src) {
    return cache(scope, this, 'extent', 'extent', field, false, undefined, src);
  },

  domainRef(scope, field, src) {
    return cache(scope, this, 'domain', 'values', field, false, undefined, src);
  },

  valuesRef(scope, field, sort, src) {
    return cache(scope, this, 'vals', 'values', field, sort || true, undefined, src);
  },

  lookupRef(scope, field) {
    return cache(scope, this, 'lookup', 'tupleindex', field, false);
  },

  indataRef(scope, field) {
    return cache(scope, this, 'indata', 'tupleindex', field, true, true);
  }
};
