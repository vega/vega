var dl = require('datalib'),
    expr = require('../parse/expr'),
    C = require('../util/constants');

var arrayType = /array/i,
    dataType  = /data/i,
    fieldType = /field/i,
    exprType  = /expr/i;

function Parameter(name, type) {
  this._name = name;
  this._type = type;

  // If parameter is defined w/signals, it must be resolved
  // on every pulse.
  this._value = [];
  this._accessors = [];
  this._resolution = false;
  this._signals = {};
}

var proto = Parameter.prototype;

proto._get = function() {
  var isArray = arrayType.test(this._type),
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type);

  if (isData) {
    return isArray ? { names: this._value, sources: this._accessors } :
      { name: this._value[0], source: this._accessors[0] };
  } else if (isField) {
    return isArray ? { fields: this._value, accessors: this._accessors } :
      { field: this._value[0], accessor: this._accessors[0] };
  } else {
    return isArray ? this._value : this._value[0];
  }
};

proto.get = function(graph) {
  var isData  = dataType.test(this._type),
      isField = fieldType.test(this._type),
      s, idx, val;

  // If we don't require resolution, return the value immediately.
  if (!this._resolution) return this._get();

  if (isData) {
    this._accessors = this._value.map(function(v) { return graph.data(v); });
    return this._get(); // TODO: support signal as dataTypes
  }

  for(s in this._signals) {
    idx  = this._signals[s];
    val  = graph.signalRef(s);

    if (isField) {
      this._accessors[idx] = this._value[idx] != val ? 
        dl.accessor(val) : this._accessors[idx];
    }

    this._value[idx] = val;
  }

  return this._get();
};

proto.set = function(transform, value) {
  var param = this, 
      isExpr = exprType.test(this._type),
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type);

  this._value = dl.array(value).map(function(v, i) {
    if (dl.isString(v)) {
      if (isExpr) {
        var e = expr(v);
        transform.dependency(C.FIELDS,  e.fields);
        transform.dependency(C.SIGNALS, e.signals);
        return e.fn;
      } else if (isField) {  // Backwards compatibility
        param._accessors[i] = dl.accessor(v);
        transform.dependency(C.FIELDS, v);
      } else if (isData) {
        param._resolution = true;
        transform.dependency(C.DATA, v);
      }
      return v;
    } else if (v.value !== undefined) {
      return v.value;
    } else if (v.field !== undefined) {
      param._accessors[i] = dl.accessor(v.field);
      transform.dependency(C.FIELDS, v.field);
      return v.field;
    } else if (v.signal !== undefined) {
      param._resolution = true;
      param._signals[v.signal] = i;
      transform.dependency(C.SIGNALS, v.signal);
      return v.signal;
    }

    return v;
  });

  return transform;
};

module.exports = Parameter;