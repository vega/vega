var dl = require('datalib'),
    Aggregator = dl.Aggregator,
    Base = Aggregator.prototype,
    Flags = Aggregator.Flags,
    df = require('vega-dataflow'),
    Tuple = df.Tuple,
    log = require('vega-logging'),
    facetID = 1;

function Facetor() {
  Aggregator.call(this);
  this._facet = null;
}

var prototype = (Facetor.prototype = Object.create(Base));
prototype.constructor = Facetor;

prototype.facet = function(f) {
  if (!arguments.length) return this._facet;
  return (this._facet = f, this);
};

prototype._ingest = function(t) { 
  return Tuple.ingest(t, null);
};

prototype._assign = Tuple.set;

function disconnect_cell(facet) {
  log.debug({}, ["deleting cell", this.tuple._id]);
  var pipeline = this.ds.pipeline();
  facet.removeListener(pipeline[0]);
  facet._graph.disconnect(pipeline);
}

prototype._newcell = function(x) {
  var cell  = Base._newcell.call(this, x),
      facet = this._facet,
      tuple = cell.tuple,
      graph, pipeline;

  if (this._facet !== null) {
    graph = facet._graph;
    pipeline = facet.param('transform');
    cell.ds  = graph.data(tuple._facetID, pipeline, tuple);
    cell.delete = disconnect_cell;
    facet.addListener(pipeline[0]);
  }

  return cell;
};

prototype._newtuple = function(x) {
  var t = Base._newtuple.call(this, x);
  if (this._facet !== null) {
    Tuple.set(t, 'key', this._cellkey(x));
    Tuple.set(t, '_facetID', 'vg_'+(facetID++));
  }
  return t;
};

prototype.clear = function() {
  if (this._facet !== null) for (var k in this._cells) {
    this._cells[k].delete(this._facet);
  }
  return Base.clear.call(this);
};

prototype._add = function(x) {
  var cell = this._cell(x);
  Base._add.call(this, x);
  if (this._facet !== null) cell.ds._input.add.push(x);
};

prototype._mod = function(x, prev) {
  var cell0 = this._cell(prev),
      cell1 = this._cell(x);

  Base._mod.call(this, x, prev);
  if (this._facet !== null) {  // Propagate tuples
    if (cell0 === cell1) {
      cell0.ds._input.mod.push(x);
    } else {
      cell0.ds._input.rem.push(x);
      cell1.ds._input.add.push(x);
    }
  }
};

prototype._rem = function(x) {
  var cell = this._cell(x);
  Base._rem.call(this, x);
  if (this._facet !== null) cell.ds._input.rem.push(x);  
};

prototype.changes = function(input, output) {
  var aggr = this._aggr,
      cell, flag, i, k;

  function fields(k) { output.fields[k] = 1; }

  for (k in this._cells) {
    cell = this._cells[k];
    flag = cell.flag;

    // consolidate collector values
    if (cell.collect) {
      cell.data.values();
    }

    // update tuple properties
    for (i=0; i<aggr.length; ++i) {
      cell.aggs[aggr[i].name].set();
    }

    // organize output tuples
    if (cell.num <= 0) {
      if (flag === Flags.MOD_CELL) {
        output.rem.push(cell.tuple);
      }
      if (this._facet !== null) cell.delete(this._facet);
      delete this._cells[k];
    } else {
      if (this._facet !== null) {
        // propagate sort, signals, fields, etc.
        df.ChangeSet.copy(input, cell.ds._input);
      }

      if (flag & Flags.ADD_CELL) {
        output.add.push(cell.tuple);
      } else if (flag & Flags.MOD_CELL) {
        output.mod.push(cell.tuple);
        dl.keys(cell.tuple._prev).forEach(fields);
      }
    }

    cell.flag = 0;
  }

  this._rems = false;
  return output;
};

module.exports = Facetor;