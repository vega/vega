var dl = require('datalib'),
    Deps = require('vega-dataflow').Dependencies,
    expr = require('../parse/expr');

var arrayType = /array/i,
    dataType  = /data/i,
    fieldType = /field/i,
    exprType  = /expr/i,
    valType   = /value/i;

function Parameter(name, type, transform) {
  this._name = name;
  this._type = type;
  this._transform = transform;

  // If parameter is defined w/signals, it must be resolved
  // on every pulse.
  this._value = [];
  this._accessors = [];
  this._resolution = false;
  this._signals = {};
}

var prototype = Parameter.prototype;

function get() {
  var isArray = arrayType.test(this._type),
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type);

  var val = isArray ? this._value : this._value[0],
      acc = isArray ? this._accessors : this._accessors[0];

  if (!dl.isValid(acc) && valType.test(this._type)) {
    return val;
  } else {
    return isData ? { name: val, source: acc } :
    isField ? { field: val, accessor: acc } : val;
  }
}

prototype.get = function() {
  var graph = this._transform._graph, 
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type),
      s, idx, val;

  // If we don't require resolution, return the value immediately.
  if (!this._resolution) return get.call(this);

  if (isData) {
    this._accessors = this._value.map(function(v) { return graph.data(v); });
    return get.call(this); // TODO: support signal as dataTypes
  }

  for (s in this._signals) {
    idx = this._signals[s];
    val = graph.signalRef(s);

    if (isField) {
      this._accessors[idx] = this._value[idx] != val ? 
        dl.accessor(val) : this._accessors[idx];
    }

    this._value[idx] = val;
  }

  return get.call(this);
};

prototype.set = function(value) {
  var p = this,
      isExpr = exprType.test(this._type),
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type);

  this._value = dl.array(value).map(function(v, i) {
    if (dl.isString(v)) {
      if (isExpr) {
        var e = expr(v);
        p._transform.dependency(Deps.FIELDS,  e.fields);
        p._transform.dependency(Deps.SIGNALS, e.globals);
        return e.fn;
      } else if (isField) {  // Backwards compatibility
        p._accessors[i] = dl.accessor(v);
        p._transform.dependency(Deps.FIELDS, v);
      } else if (isData) {
        p._resolution = true;
        p._transform.dependency(Deps.DATA, v);
      }
      return v;
    } else if (v.value !== undefined) {
      return v.value;
    } else if (v.field !== undefined) {
      p._accessors[i] = dl.accessor(v.field);
      p._transform.dependency(Deps.FIELDS, v.field);
      return v.field;
    } else if (v.signal !== undefined) {
      p._resolution = true;
      p._signals[v.signal] = i;
      p._transform.dependency(Deps.SIGNALS, v.signal);
      return v.signal;
    }

    return v;
  });

  return p._transform;
};

module.exports = Parameter;