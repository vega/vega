var dl = require('datalib'),
    tuple = require('../dataflow/tuple'),
    changeset = require('../dataflow/changeset'),
    debug = require('../util/debug'),
    C = require('../util/constants');

function Facetor() {
  Aggregator.constructor.call(this);
  this._facet = null;
  this._multi = false; // Scales multi-aggregate across different schemas
  this._acc = {groupby: dl.true, value: dl.true} // Standardize w/custom accessors
}

var Aggregator = dl.groupby();
var proto = (Facetor.prototype = Object.create(Aggregator));

proto.facet = function(f) {
  if(!arguments.length) return this._facet;
  return (this._facet = f, this);
};

proto.multi = function(flag) { 
  return (this._multi = flag, this); 
};

proto.accessors = function(groupby, value) {
  this._acc.groupby = groupby || dl.true;
  this._acc.value   = value   || dl.true;
};

proto._ingest = function(t) { 
  return tuple.ingest(t, null) 
};

proto._assign = tuple.set;

function disconnect_cell(facet) {
  debug({}, ["deleting cell", this.tuple._id]);
  var pipeline = this.ds.pipeline();
  facet.removeListener(pipeline[0]);
  facet._graph.disconnect(pipeline);
}

proto._newcell = function(x, k) {
  var cell  = Aggregator._newcell.call(this, x, k),
      facet = this._facet,
      tuple = cell.tuple,
      graph, pipeline;

  if(this._facet !== null) {
    graph = facet._graph;
    pipeline = facet.pipeline.get(graph, facet);
    cell.ds  = graph.data("vg_"+tuple._id, pipeline, tuple);
    cell.delete = disconnect_cell;
    facet.addListener(pipeline[0]);
  }

  return cell;
};

proto._newtuple = function(x, k) {
  var t = Aggregator._newtuple.call(this, x, k);
  if(this._facet !== null) {
    tuple.set(t, "key", k.key);
    tuple.set(t, "keys", k.keys);
  }
  return t;
};

proto.clear = function() {
  if(this._facet !== null) for (var k in this._cells) {
    this._cells[k].delete(this._facet);
  }
  return Aggregator.clear.call(this);
};

function standardize(x) {
  if(!this._multi) return x;

  return {
    _id: x._id,
    groupby: this._acc.groupby(x),
    value: this._acc.value(x),
  };
}

proto._add = function(x) {
  var std = standardize.call(this, x),
      cell = this._cell(std);

  Aggregator._add.call(this, std);
  if(this._facet !== null) cell.ds._input.add.push(x);
};

proto._mod = function(x, prev) {
  var std0 = standardize.call(this, prev),
      std1 = standardize.call(this, x),
      cell0 = this._cell(std0),
      cell1 = this._cell(std1);

  Aggregator._mod.call(this, std1, std0);

  if(this._facet !== null) {  // Propagate tuples
    if(cell0 === cell1) {
      cell0.ds._input.mod.push(x);
    } else {
      cell0.ds._input.rem.push(x);
      cell1.ds._input.add.push(x);
    }
  }
};

proto._rem = function(x) {
  var std = standardize.call(this, x),
      cell = this._cell(std);

  Aggregator._rem.call(this, std);
  if(this._facet !== null) cell.ds._input.rem.push(x);  
};

proto.changes = function(input, output) {
  var aggr = this._aggr,
      cell, flag, i, k;

  for (k in this._cells) {
    cell = this._cells[k];
    flag = cell.flag;

    // update tuple properties
    for (i=0; i<aggr.length; ++i) {
      cell.aggs[aggr[i].name].set();
    }

    // organize output tuples
    if (cell.num <= 0) {
      if (flag === C.MOD_CELL) {
        output.rem.push(cell.tuple);
      }
      if(this._facet !== null) cell.delete(this._facet);
      delete this._cells[k];
    } else {
      if(this._facet !== null) {
        // propagate sort, signals, fields, etc.
        changeset.copy(input, cell.ds._input);
      }

      if (flag & C.ADD_CELL) {
        output.add.push(cell.tuple);
      } else if (flag & C.MOD_CELL) {
        output.mod.push(cell.tuple);
      }
    }

    cell.flag = 0;
  }

  this._consolidate();
  this._rems = false;
  return output;
};

module.exports = Facetor;