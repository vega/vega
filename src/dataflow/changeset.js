define(function(require, exports, module) {
  var C = require('../util/constants');
  var REEVAL = [C.DATA, C.FIELDS, C.SCALES, C.SIGNALS];

  function create(cs, reflow) {
    var out = {};
    copy(cs, out);

    out.add = [];
    out.mod = [];
    out.rem = [];

    out.reflow = reflow;

    return out;
  }

  function finalize(cs) {
    function rp(x) {
      x._prev = (x._prev === undefined) ? undefined : C.SENTINEL;
    }

    cs.add.forEach(rp);
    cs.mod.forEach(rp);
  }

  function copy(a, b) {
    b.stamp = a ? a.stamp : 0;
    b.sort  = a ? a.sort  : null;
    b.facet = a ? a.facet : null;
    b.trans = a ? a.trans : null;
    REEVAL.forEach(function(d) { b[d] = a ? a[d] : {}; });
  }

  return {
    create: create,
    copy: copy,
    finalize: finalize,
  };
});