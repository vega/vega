var DEPS = require('./Dependencies').ALL;

function create(cs, reflow) {
  var out = {};
  copy(cs, out);

  out.add = [];
  out.mod = [];
  out.rem = [];

  out.reflow = reflow;

  return out;
}

function copy(a, b) {
  b.stamp = a ? a.stamp : 0;
  b.sort  = a ? a.sort  : null;
  b.facet = a ? a.facet : null;
  b.trans = a ? a.trans : null;
  b.dirty = a ? a.dirty : [];
  b.request = a ? a.request : null;
  for (var d, i=0, n=DEPS.length; i<n; ++i) {
    b[d=DEPS[i]] = a ? a[d] : {};
  }
}

module.exports = {
  create: create,
  copy: copy
};