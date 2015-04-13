var Transform = require('./Transform'),
    GroupBy = require('./GroupBy'),
    tuple = require('../dataflow/tuple'), 
    changeset = require('../dataflow/changeset'), 
    meas = require('./measures'),
    util = require('../util/index'),
    C = require('../util/constants');

function Stats(graph) {
  GroupBy.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    group_by: {type: "array<field>"},
    on: {type: "field"} 
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

  // Measures parameter handled manually.
  this._Measures = null;

  // The group_by might come via the facet. Store that to 
  // short-circuit usual GroupBy methods.
  this.__facet = null;

  return this;
}

var proto = (Stats.prototype = new GroupBy());

proto.measures = { 
  set: function(transform, aggs) {
    if(aggs.indexOf(C.COUNT) < 0) aggs.push(C.COUNT); // Need count for correct GroupBy propagation.
    transform._Measures = meas.create(aggs.map(function(a) { 
      return meas[a](transform._output[a]); 
    }));
    return transform;
  }
};

proto._reset = function(input, output) {
  var k, c
  for(k in this._cells) { 
    if(!(c = this._cells[k])) continue;
    if(!input.facet) output.rem.push(c.set());
  }
  this._cells = {};
};

proto._keys = function(x) {
  if(this.__facet) return this.__facet;
  else if(this._refs.length) return GroupBy.prototype._keys.call(this, x);
  return {keys: [], key: ""}; // Stats on a flat datasource
};

proto._new_cell = function(x, k) {
  var group_by = this.group_by.get(this._graph),
      fields = group_by.fields, acc = group_by.accessors,
      i, len;

  var t = this.__facet || {};
  if(!this.__facet) {
    for(i=0, len=fields.length; i<len; ++i) {
      t[fields[i]] = acc[i](x);
    }
    t = tuple.ingest(t, null);
  }

  return new this._Measures(t);
};

proto._add = function(x) {
  var field = this.on.get(this._graph).accessor;
  this._cell(x).add(field(x));
};

proto._rem = function(x) {
  var field = this.on.get(this._graph).accessor;
  this._cell(x).rem(field(x));
};

proto.transform = function(input, reset) {
  util.debug(input, ["stats"]);

  if(input.facet) {
    this.__facet = input.facet;
  } else {
    this._refs = this.group_by.get(this._graph).accessors;
  }

  var output = GroupBy.prototype.transform.call(this, input, reset),
      k, c;

  if(input.facet) {
    this._cells[input.facet.key].set();
    return input;
  } else {
    for(k in this._cells) {
      c = this._cells[k];
      if(!c) continue;
      c.set();
    }
    return output;
  }
};

module.exports = Stats;