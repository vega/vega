define(function(require, module, exports) {
  var util = require('../util/index'),
      C = require('../util/constants'),
      tuple_id = 1;

  function create(d, p) {
    var o = Object.create(util.isObject(d) ? d : {data: d});
    o._id = ++tuple_id;
    // o._prev = p ? Object.create(p) : C.SENTINEL;
    o._prev = p || C.SENTINEL;
    return o;
  }

  // WARNING: operators should only call this once per timestamp!
  function set(t, k, v, stamp) {
    var prev = t[k];
    if(prev === v) return;

    if(prev && t._prev) set_prev(t, k);
    t[k] = v;
  }

  function set_prev(t, k, stamp) {
    t._prev = (t._prev === C.SENTINEL) ? {} : t._prev;
    t._prev[k] = {
      value: t[k],
      stamp: stamp
    };
  }

  function reset() { tuple_id = 1; }

  return {
    create: create,
    set:    set,
    prev:   set_prev,
    reset:  reset
  };
});