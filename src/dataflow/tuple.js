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
  prev:   set_prev,
  reset:  reset,
  idMap:  idMap
};