var tupleID = 0;

function ingest(datum) {
  datum = (datum === Object(datum)) ? datum : {data: datum};
  datum._id = ++tupleID;
  if (datum._prev) datum._prev = null;
  return datum;
}

function idMap(a, ids) {
  ids = ids || {};
  for (var i=0, n=a.length; i<n; ++i) {
    ids[a[i]._id] = 1;
  }
  return ids;
}

function copy(t, c) {
  c = c || {};
  for (var k in t) {
    if (k !== '_prev' && k !== '_id') c[k] = t[k];
  }
  return c;
}

module.exports = {
  ingest: ingest,
  idMap: idMap,

  derive: function(d) {
    return ingest(copy(d));
  },

  rederive: function(d, t) {
    return copy(d, t);
  },

  set: function(t, k, v) {
    return t[k] === v ? 0 : (t[k] = v, 1);
  },

  prev: function(t) {
    return t._prev || t;
  },

  prev_init: function(t) {
    if (!t._prev) { t._prev = {_id: t._id}; }
  },

  prev_update: function(t) {
    var p = t._prev, k, v;
    if (p) for (k in t) {
      if (k !== '_prev' && k !== '_id') {
        p[k] = ((v=t[k]) instanceof Object && v._prev) ? v._prev : v;
      }
    }
  },

  reset: function() { tupleID = 0; },

  idFilter: function(data) {
    var ids = {};
    for (var i=arguments.length; --i>0;) {
      idMap(arguments[i], ids);
    }
    return data.filter(function(x) { return !ids[x._id]; });
  }
};
