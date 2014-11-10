define(function(require, module, exports) {
  var util = require('../util/index'),
      tuple_id = 1;

  function create(d, p) {
    var o = Object.create(util.isObject(d) ? d : {data: d});
    o._id = ++tuple_id;
    o._prev = p ? Object.create(p) : {};
    return o;
  }

  // WARNING: operators should only call this once per timestamp!
  function set(t, k, v, stamp) {
    var prev = t[k];
    if(prev === v) return;
    // if(t._prev[k] && t._prev[k].stamp >= stamp) 
      // throw "tuple field set on current timestamp " + k + " " + v + " " + stamp;

    if(prev) {
      t._prev[k] = {
        value: prev,
        stamp: stamp
      };    
    }

    t[k] = v;
  }

  function reset() { tuple_id = 1; }

  return {
    create: create,
    set:    set,
    reset:  reset
  };
});