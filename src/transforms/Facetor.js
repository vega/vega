var dl = require('datalib'),
    Aggregator = dl.Aggregator,
    Base = Aggregator.prototype,
    df = require('vega-dataflow'),
    Tuple = df.Tuple,
    log = require('vega-logging'),
    facetID = 0;

function Facetor() {
  Aggregator.call(this);
  this._facet = null;
  this._facetID = ++facetID;
}

var prototype = (Facetor.prototype = Object.create(Base));
prototype.constructor = Facetor;

prototype.facet = function(f) {
  return arguments.length ? (this._facet = f, this) : this._facet;
};

prototype._ingest = function(t) {
  return Tuple.ingest(t, null);
};

prototype._assign = Tuple.set;

function disconnect_cell(facet) {
  log.debug({}, ['disconnecting cell', this.tuple._id]);
  var pipeline = this.ds.pipeline();
  facet.removeListener(pipeline[0]);
  facet._graph.removeListener(pipeline[0]);
  facet._graph.disconnect(pipeline);
}

prototype._newcell = function(x, key) {
  var cell  = Base._newcell.call(this, x, key),
      facet = this._facet;

  if (facet) {
    var graph = facet._graph,
        tuple = cell.tuple,
        pipeline = facet.param('transform');
    cell.ds = graph.data(tuple._facetID, pipeline, tuple);
    cell.disconnect = disconnect_cell;
    facet.addListener(pipeline[0]);
  }

  return cell;
};

prototype._newtuple = function(x, key) {
  var t = Base._newtuple.call(this, x);
  if (this._facet) {
    Tuple.set(t, 'key', key);
    Tuple.set(t, '_facetID', this._facetID + '_' + key);
  }
  return t;
};

prototype.clear = function() {
  if (this._facet) {
    for (var k in this._cells) {
      this._cells[k].disconnect(this._facet);
    }
  }
  return Base.clear.call(this);
};

prototype._on_add = function(x, cell) {
  if (this._facet) cell.ds._input.add.push(x);
};

prototype._on_rem = function(x, cell) {
  if (this._facet) cell.ds._input.rem.push(x);
};

prototype._on_mod = function(x, prev, cell0, cell1) {
  if (this._facet) { // Propagate tuples
    if (cell0 === cell1) {
      cell0.ds._input.mod.push(x);
    } else {
      cell0.ds._input.rem.push(x);
      cell1.ds._input.add.push(x);
    }
  }
};

prototype._on_drop = function(cell) {
  if (this._facet) cell.disconnect(this._facet);
};

prototype._on_keep = function(cell) {
  // propagate sort, signals, fields, etc.
  if (this._facet) df.ChangeSet.copy(this._input, cell.ds._input);
};

module.exports = Facetor;
