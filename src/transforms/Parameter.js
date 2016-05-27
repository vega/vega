var dl = require('datalib'),
    Deps = require('vega-dataflow').Dependencies;

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
  this._signals = [];
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
      i, n, sig, idx, val;

  // If we don't require resolution, return the value immediately.
  if (!this._resolution) return get.call(this);

  if (isData) {
    this._accessors = this._value.map(function(v) { return graph.data(v); });
    return get.call(this); // TODO: support signal as dataTypes
  }

  for (i=0, n=this._signals.length; i<n; ++i) {
    sig = this._signals[i];
    idx = sig.index;
    val = sig.value(graph);

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
      graph = p._transform._graph,
      isExpr = exprType.test(this._type),
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type);

  p._signals = [];
  this._value = dl.array(value).map(function(v, i) {
    var e;
    if (dl.isString(v)) {
      if (isExpr) {
        e = graph.expr(v);
        p._transform.dependency(Deps.FIELDS,  e.fields);
        p._transform.dependency(Deps.SIGNALS, e.globals);
        p._transform.dependency(Deps.DATA,    e.dataSources);
        return e.fn;
      } else if (isField) {  // Backwards compatibility
        p._accessors[i] = dl.accessor(v);
        p._transform.dependency(Deps.FIELDS, dl.field(v));
      } else if (isData) {
        p._resolution = true;
        p._transform.dependency(Deps.DATA, v);
      }
      return v;
    } else if (v.value !== undefined) {
      return v.value;
    } else if (v.field !== undefined) {
      p._accessors[i] = dl.accessor(v.field);
      p._transform.dependency(Deps.FIELDS, dl.field(v.field));
      return v.field;
    } else if (v.signal !== undefined) {
      p._resolution = true;
      p._transform.dependency(Deps.SIGNALS, dl.field(v.signal)[0]);
      p._signals.push({
        index: i,
        value: function(graph) { return graph.signalRef(v.signal); }
      });
      return v.signal;
    } else if (v.expr !== undefined) {
      p._resolution = true;
      e = graph.expr(v.expr);
      p._transform.dependency(Deps.SIGNALS, e.globals);
      p._signals.push({
        index: i,
        value: function() { return e.fn(); }
      });
      return v.expr;
    }

    return v;
  });

  return p._transform;
};

module.exports = Parameter;

// Schema for field|value-type parameters.
Parameter.schema = {
  "type": "object",
  "oneOf": [{
    "properties": {"field": {"type": "string"}},
    "required": ["field"]
  }, {
    "properties": {"value": {"type": "string"}},
    "required": ["value"]
  }]
};
