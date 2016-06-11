import {ref, transform, keyRef} from './util';

export default function DataScope(scope, entries) {
  this.scope = scope;
  this.input = ref(entries[0]);
  this.output = ref(entries[entries.length - 1]);
  this.entries = entries; // is this needed? keep for now...
}

var prototype = DataScope.prototype;

prototype.countsRef = function(field) {
  var ds = this,
      cache = ds.counts || (ds.counts = {}),
      v = cache[field], a;

  if (!v) {
    // TODO additional measures for sorting?
    var params = {
      groupby: ds.scope.fieldRef(field, 'key'),
      pulse: ds.output
    };
    a = ds.scope.add(transform('Aggregate', params));
    v = ds.scope.add(transform('Collect', {pulse: ref(a)}));
    cache[field] = v = ref(v);
  }
  return v;
};

function cache(ds, name, optype, field, counts) {
  var cache = ds[name] || (ds[name] = {}),
      v = cache[field];

  if (!v) {
    var params = counts
      ? {field: keyRef, pulse: ds.countsRef(field)}
      : {field: ds.scope.fieldRef(field), pulse: ds.output};
    cache[field] = v = ref(ds.scope.add(transform(optype, params)));
  }
  return v;
}

prototype.extentRef = function(field) {
  return cache(this, 'extent', 'Extent', field, false);
};

prototype.lookupRef = function(field) {
  return cache(this, 'lookup', 'TupleIndex', field, false);
};

prototype.valuesRef = function(field) {
  return cache(this, 'values', 'Values', field, true);
};

prototype.indataRef = function(field) {
  return cache(this, 'indata', 'TupleIndex', field, true);
};
