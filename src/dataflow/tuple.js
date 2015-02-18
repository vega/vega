define(function(require, module, exports) {
  var util = require('../util/index'),
      C = require('../util/constants'),
      tuple_id = 1;

  function create(d, p) {
    var o = Object.create(util.isObject(d) ? d : {data: d});
    o._id = ++tuple_id;
    // We might not want to track prev state (p == undefined),
    // or delay prev object creation (p == null).
    o._prev = p !== undefined ? p || C.SENTINEL : undefined;
    return o;
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

  return {
    create: create,
    set:    set,
    prev:   set_prev,
    reset:  reset
  };
});