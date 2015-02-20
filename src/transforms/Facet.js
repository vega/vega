define(function(require, exports, module) {
  var Transform = require('./Transform'),
      Aggregate = require('./Aggregate'),
      tuple = require('../dataflow/tuple'), 
      changeset = require('../dataflow/changeset'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Facet(graph) {
    Aggregate.prototype.init.call(this, graph);
    Transform.addParameters(this, {keys: {type: "array<field>"} });

    this._pipeline = [];
    return this;
  }

  var proto = (Facet.prototype = new Aggregate());

  proto.pipeline = function(pipeline) {
    if(!arguments.length) return this._pipeline;
    this._pipeline = pipeline;
    return this;
  };

  proto._reset = function(input, output) {
    var k, c;
    for(k in this._cells) {
      c = this._cells[k];
      if(!c) continue;
      output.rem.push(c.tpl);
      c.delete();
    }
    this._cells = {};
  };

  proto._new_tuple = function(x, k) {
    return tuple.ingest(k, null);
  };

  proto._new_cell = function(x, k) {
    // Rather than sharing the pipeline between all nodes,
    // give each cell its individual pipeline. This allows
    // dynamically added collectors to do the right thing
    // when wiring up the pipelines.
    var cell = Aggregate.prototype._new_cell.call(this, x, k),
        pipeline = this._pipeline.map(function(n) { return n.clone(); }),
        facet = this,
        t = cell.tpl;

    cell.ds = this._graph.data("vg_"+t._id, pipeline, t);
    cell.delete = function() {
      util.debug({}, ["deleting cell", k.key]);
      facet.removeListener(pipeline[0]);
      facet._graph.disconnect(pipeline);
    };

    this.addListener(pipeline[0]);

    return cell;
  };

  proto._add = function(x) {
    var cell = Aggregate.prototype._add.call(this, x);
    cell.ds._input.add.push(x);
    return cell;
  };

  proto._mod = function(x, reset) {
    var cell = Aggregate.prototype._mod.call(this, x, reset);
    if(!(cell.flg & C.ADD_CELL)) cell.ds._input.mod.push(x); // Propagate tuples
    cell.flg |= C.MOD_CELL;
    return cell;
  };

  proto._rem = function(x) {
    var cell = Aggregate.prototype._rem.call(this, x);
    cell.ds._input.rem.push(x);
    return cell;
  };

  proto.transform = function(input, reset) {
    util.debug(input, ["faceting"]);

    this._refs = this.keys.get(this._graph).accessors;

    var output = Aggregate.prototype.transform.call(this, input, reset),
        k, c;

    for(k in this._cells) {
      c = this._cells[k];
      if(c == null) continue;
      if(c.cnt === 0) {
        c.delete();
      } else {
        // propagate sort, signals, fields, etc.
        changeset.copy(input, c.ds._input);
      }
    }

    return output;
  };

  return Facet;
});