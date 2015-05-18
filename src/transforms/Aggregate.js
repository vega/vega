var dl = require('datalib'),
    Transform = require('./Transform'),
    Facetor = require('./Facetor'),
    tpl = require('../dataflow/tuple'), 
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

  return this;
}

var proto = (Aggregate.prototype = new Transform());

proto.summarize = {
  set: function(transform, summarize) {
    var i, len, f, fields, name, ops, signals = {};
    if(!dl.isArray(fields = summarize)) { // Object syntax from dl
      fields = [];
      for (name in summarize) {
        ops = util.array(summarize[name]);
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

proto.aggr = function() {
  if(this._aggr) return this._aggr;

  var graph = this._graph,
      groupby = this.groupby.get(graph).fields;

  var fields = this._fieldsDef.map(function(field) {
    var f = dl.duplicate(field);
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

  return aggr;
};

proto._reset = function(input, output) {
  output.rem.push.apply(output.rem, this.aggr().result());
  this.aggr().clear();
  this._aggr = null;
};

proto.transform = function(input, reset) {
  debug(input, ["aggregate"]);

  var output = changeset.create(input);
  if(reset) this._reset(input, output);

  var aggr = this.aggr();

  input.add.forEach(aggr.add.bind(aggr));

  input.mod.forEach(function(x) {
    if(reset) {
      aggr.add(x);  // Signal change triggered reflow
    } else if(tpl.has_prev(x)) {
      aggr.mod(x);
    }
  });

  input.rem.forEach(function(x) {
    aggr.rem(tpl.has_prev(x) ? tpl.prev(x) : x);
  });

  return aggr.changes(input, output);
}

module.exports = Aggregate;