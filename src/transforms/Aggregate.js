var dl = require('datalib'),
    Transform = require('./Transform'),
    Facetor = require('./Facetor'),
    tuple = require('../dataflow/tuple'), 
    changeset = require('../dataflow/changeset'), 
    debug = require('../util/debug'),
    C = require('../util/constants');

function Aggregate(graph) {
  Transform.prototype.init.call(this, graph)
    .router(true).revises(true);

  Transform.addParameters(this, {
    groupby: {type: "array<field>"}
  });

  this._fieldsDef = [];
  this._aggr = null;  // dl.Aggregator

  this._type = TYPES.TUPLE; 
  this._acc = {groupby: dl.true, value: dl.true}
  this._cache = {};     // And cache them as aggregators expect original tuples.

  // Aggregator needs a full instantiation of the previous tuple. 
  // Cache them to reduce creation costs
  this._prev = {}; 

  return this;
}

var proto = (Aggregate.prototype = new Transform());

var TYPES = Aggregate.TYPES = {
  VALUE: 1, 
  TUPLE: 2, 
  MULTI: 3
};

proto.summarize = {
  set: function(transform, summarize) {
    var i, len, f, fields, name, ops, signals = {};
    if(!dl.isArray(fields = summarize)) { // Object syntax from dl
      fields = [];
      for (name in summarize) {
        ops = dl.array(summarize[name]);
        fields.push({name: name, ops: ops});
      }
    }

    for(i=0, len=fields.length; i<len; ++i) {
      f = fields[i];
      if(f.name.signal) signals[f.name.signal] = 1;
      dl.array(f.ops).forEach(function(o){ if(o.signal) signals[o.signal] = 1 });
    }

    transform._fieldsDef = fields;
    transform._aggr = null;
    transform.dependency(C.SIGNALS, dl.keys(signals));
    return transform;
  }
};

proto.type = function(type) { 
  return (this._type = type, this); 
};

proto.accessors = function(groupby, value) {
  var acc = this._acc;
  acc.groupby = dl.$(groupby) || acc.groupby || dl.true;
  acc.value = dl.$(value) || acc.value || dl.true;
};

function standardize(x) {
  var acc = this._acc;
  if(this._type === TYPES.TUPLE) {
    return x;
  } else if(this._type === TYPES.VALUE) {
    return acc.value(x);
  } else {
    return this._cache[x._id] || (this._cache[x._id] = {
      _id: x._id,
      groupby: acc.groupby(x),
      value: acc.value(x)
    });
  }
}

proto.aggr = function() {
  if(this._aggr) return this._aggr;

  var graph = this._graph,
      groupby = this.groupby.get(graph).fields;

  var fields = this._fieldsDef.map(function(field) {
    var f  = dl.duplicate(field);
    if(field.get) f.get = field.get;

    f.name = f.name.signal ? graph.signalRef(f.name.signal) : f.name;
    f.ops  = f.ops.signal ? graph.signalRef(f.ops.signal) : dl.array(f.ops).map(function(o) {
      return o.signal ? graph.signalRef(o.signal) : o;
    });

    return f;
  });

  var aggr = this._aggr = new Facetor()
    .groupby(groupby)
    .stream(true)
    .summarize(fields);

  if(this._type !== TYPES.VALUE) aggr.key("_id");
  return aggr;
};

proto._reset = function(input, output) {
  output.rem.push.apply(output.rem, this.aggr().result());
  this.aggr().clear();
  this._aggr = null;
};

function spoof_prev(x) {
  var prev = this._prev[x._id] || (this._prev[x._id] = Object.create(x));
  return dl.extend(prev, x._prev);
}

proto.transform = function(input, reset) {
  debug(input, ["aggregate"]);

  var output = changeset.create(input);
  if(reset) this._reset(input, output);

  var t = this,
      tpl  = this._type === TYPES.TUPLE, // reduce calls to standardize
      aggr = this.aggr();

  input.add.forEach(function(x) {
    aggr._add(tpl ? x : standardize.call(t, x));
  });

  input.mod.forEach(function(x) {
    if(reset) {
      aggr._add(tpl ? x : standardize.call(t, x));  // Signal change triggered reflow
    } else if(tuple.has_prev(x)) {
      var prev = spoof_prev.call(t, x);
      aggr._mod(tpl ? x : standardize.call(t, x), 
        tpl ? prev : standardize.call(t, prev));
    }
  });

  input.rem.forEach(function(x) {
    var y = tuple.has_prev(x) ? spoof_prev.call(t, x) : x;
    aggr._rem(tpl ? y : standardize.call(t, y));
    t._cache[x._id] = t._prev[x._id] = null;
  });

  return aggr.changes(input, output);
}

module.exports = Aggregate;