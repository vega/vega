var dl = require('datalib'),
    Transform = require('./Transform'),
    GroupBy = require('./GroupBy'),
    tuple = require('../dataflow/tuple'), 
    changeset = require('../dataflow/changeset'), 
    meas = require('./measures'),
    debug = require('../util/debug'),
    C = require('../util/constants');

function Aggregate(graph) {
  GroupBy.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    group_by: {type: "array<field>"}
  });

  this._output = {
    "count":    "count",
    "avg":      "avg",
    "min":      "min",
    "max":      "max",
    "sum":      "sum",
    "mean":     "mean",
    "var":      "var",
    "stdev":    "stdev",
    "varp":     "varp",
    "stdevp":   "stdevp",
    "median":   "median"
  };

  // Aggregators parameter handled manually.
  this._fieldsDef   = null;
  this._Aggregators = null;
  this._singleton   = false;  // If true, all fields aggregated within a single monoid

  return this;
}

var proto = (Aggregate.prototype = new GroupBy());

proto.fields = {
  set: function(transform, fields) {
    var i, len, f, signals = {};
    for(i=0, len=fields.length; i<len; ++i) {
      f = fields[i];
      if(f.name.signal) signals[f.name.signal] = 1;
      dl.array(f.ops).forEach(function(o){ if(o.signal) signals[o.signal] = 1 });
    }

    transform._fieldsDef = fields;
    transform._Aggregators = null;
    transform.aggs();
    transform.dependency(C.SIGNALS, dl.keys(signals));
    return transform;
  }
};

proto.singleton = function(c) {
  if(!arguments.length) return this._singleton;
  this._singleton = c;
  return this;
};

proto.aggs = function() {
  var transform = this,
      graph = this._graph,
      fields = this._fieldsDef,
      aggs = this._Aggregators,
      f, i, k, name, ops, measures;

  if(aggs) return aggs;
  else aggs = this._Aggregators = []; 

  for (i = 0; i < fields.length; i++) {
    f = fields[i];
    if (f.ops.length === 0) continue;

    name = f.name.signal ? graph.signalRef(f.name.signal) : f.name;
    ops  = dl.array(f.ops.signal ? graph.signalRef(f.ops.signal) : f.ops);
    measures = ops.map(function(a) {
      a = a.signal ? graph.signalRef(a.signal) : a;
      return meas[a](name + '_' + transform._output[a]);
    });
    aggs.push({
      accessor: dl.accessor(name),
      field: this._singleton ? C.SINGLETON : name,
      measures: meas.create(measures)
    });
  }

  return aggs;
};

proto._reset = function(input, output) {
  this._Aggregators = null; // rebuild aggregators
  this.aggs();
  return GroupBy.prototype._reset.call(this, input, output);
};

proto._keys = function(x) {
  return this._gb.fields.length ? 
    GroupBy.prototype._keys.call(this, x) : {keys: [], key: ""};
};

proto._new_cell = function(x, k) {
  var cell = GroupBy.prototype._new_cell.call(this, x, k),
      aggs = this.aggs(),
      i = 0, len = aggs.length, 
      agg;

  for(; i<len; i++) {
    agg = aggs[i];
    cell[agg.field] = new agg.measures(cell, cell.tpl);
  }

  return cell;
};

proto._add = function(x) {
  var c = this._cell(x),
      aggs = this.aggs(),
      i = 0, len = aggs.length,
      agg;

  c.cnt++;
  for(; i<len; i++) {
    agg = aggs[i];
    c[agg.field].add(agg.accessor(x));
  }
  c.flg |= C.MOD_CELL;
};

proto._rem = function(x) {
  var c = this._cell(x),
      aggs = this.aggs(),
      i = 0, len = aggs.length,
      agg;

  c.cnt--;
  for(; i<len; i++) {
    agg = aggs[i];
    c[agg.field].rem(agg.accessor(x));
  }
  c.flg |= C.MOD_CELL;
};

proto.transform = function(input, reset) {
  debug(input, ["aggregate"]);

  this._gb = this.group_by.get(this._graph);

  var output = GroupBy.prototype.transform.call(this, input, reset),
      aggs = this.aggs(),
      len = aggs.length,
      i, k, c;

  for(k in this._cells) {
    c = this._cells[k];
    if(!c) continue;
    for(i=0; i<len; i++) {
      c[aggs[i].field].set();
    }
  }

  return output;
};

module.exports = Aggregate;