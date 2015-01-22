define(function(require, module, exports) {
  var C = require('../util/constants');

  function create(cs, reflow) {
    var out = {};
    copy(cs, out);

    out.add = [];
    out.mod = [];
    out.rem = [];

    out.reflow = reflow;

    return out;
  }

  function done(cs) {
    // nothing for now
  }

  function copy(a, b) {
    b.stamp = a ? a.stamp : 0;
    b.sort  = a ? a.sort  : null;
    b.facet = a ? a.facet : null;
    b.trans = a ? a.trans : null;
    C.DEPS.forEach(function(d) { b[d] = a ? a[d] : {} });
  }

  return {
    create:  create,
    done:    done,
    copy:    copy
  };
});