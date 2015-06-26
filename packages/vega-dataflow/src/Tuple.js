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
