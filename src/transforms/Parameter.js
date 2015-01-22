define(function(require, exports, module) {
  var expr = require('../parse/expr'),
      util = require('../util/index'),
      C = require('../util/constants');

  var arrayType = /array/i,
      fieldType = /field/i,
      exprType  = /expr/i;

  function Parameter(name, type, dflt) {
    this._name = name;
    this._type = type;
    this._stamp = 0; // Last stamp seen on resolved signals

    // If parameter is defined w/signals, it must be resolved
    // on every pulse.
    this._value = util.array(dflt === null ? null : dflt);
    this._resolution = false;
    this._signals = {};
  }

  var proto = Parameter.prototype;

  proto.get = function(graph) {
    var isArray = arrayType(this._type),
        isField = fieldType(this._field),
        s, sg, idx, val, last;

    // If we don't require resolution, return the value immediately.
    if(!this._resolution) {
      return isArray ? this._value : this._value[0];
    }

    for(s in this._signals) {
      idx  = this._signals[s];
      sg   = graph.signal(s); 
      val  = sg.value();
      last = sg.last();

      this._value[idx] = isField 
        ? this._stamp <= last ? util.accessor(val) : this._value[idx]
        : val;
    }

    return isArray ? this._value : this._value[0];
  };

  proto.set = function(transform, value) {
    var param = this;
    this._value = util.array(value).map(function(v, i) {
      if(!util.isObject(v)) {
        if(exprType.test(this._type)) {
          var e = expr(transform._graph, v);
          transform.dependency(C.FIELDS,  e.fields);
          transform.dependency(C.SIGNALS, e.signals);
          return e;
        } else {
          return v;
        }
      } else if(v.value !== undefined) {
        return v.value;
      } else if(v.field !== undefined) {
        transform.dependency(C.FIELDS, v.field);
        return util.accessor(v.field);
      } else if(v.signal !== undefined) {
        param._resolution = true;
        param._signals[v.signal] = i;
        transform.dependency(C.SIGNALS, v.signal);
        return v.signal;
      }
    });

    return transform;
  };

  return Parameter;
})