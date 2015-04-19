var Transform = require('./Transform'),
    GroupBy = require('./GroupBy'),
    tuple = require('../dataflow/tuple'), 
    changeset = require('../dataflow/changeset'), 
    meas = require('./measures'),
    util = require('../util/index'),
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
  this._Aggregators = [];

  return this;
}

var proto = (Aggregate.prototype = new GroupBy());

proto.fields = {
  set: function(transform, fields) {
    var f, i, k, measures, measure, cell;
    for (i = 0; i < fields.length; i++) {
      f = fields[i];
      if (f.ops.length === 0) continue;
      measures = f.ops.map(function(a) {
        return meas[a](f.name + '_' + transform._output[a]);
      });
      transform._Aggregators.push({
        accessor: util.accessor(f.name),
        field: transform._aggregate_in_one ? '_all' : f.name,
        measures: meas.create(measures)
      });
    }
    return transform;
  }
};

proto._reset = function(input, output) {
  var k, c, i, agg;
  // rebuild accessors
  for(i = 0; i < this._Aggregators.length; i++) {
    agg = this._Aggregators[i];
    agg.accessor = util.accessor(agg.name);
  }
  for(k in this._cells) {
    if(!(c = this._cells[k])) continue;
    output.rem.push(c.set());
  }
  this._cells = {};
};

proto._keys = function(x) {
  return this._gb.fields.length ? 
    GroupBy.prototype._keys.call(this, x) : {keys: [], key: ""};
};

proto._new_cell = function(x, k) {
  var cell = GroupBy.prototype._new_cell.call(this, x, k),
      aggs = this._Aggregators,
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
      aggs = this._Aggregators,
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
      aggs = this._Aggregators,
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
  util.debug(input, ["aggregate"]);

  this._gb = this.group_by.get(this._graph);

  var output = GroupBy.prototype.transform.call(this, input, reset),
      aggs = this._Aggregators,
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