define(function(require, exports, module) {
  var Transform = require('./Transform'),
      tuple = require('../dataflow/tuple'), 
      changeset = require('../dataflow/changeset'),
      util = require('../util/index');

  var ADD = 1, MOD = 2;

  function Facet(graph) {
    Transform.prototype.init.call(this, graph);
    Transform.addParameters(this, {keys: {type: "array<field>"} });

    this._cells = {};
    this._pipeline = [];
    return this.router(true).prev(true);
  }

  var proto = (Facet.prototype = new Transform());

  proto.pipeline = function(pipeline) {
    if(!arguments.length) return this._pipeline;
    this._pipeline = pipeline;
    return this;
  };

  function rst(input, output) {
    var k, c;
    for(k in this._cells) {
      c = this._cells[k];
      output.rem.push(c.t);
      c.delete();
    }
  };

  function cell(x, prev) {
    var facet = this,
        accessors = this.keys.get(this._graph).accessors;

    var keys = accessors.reduce(function(v, f) {
      var p = null;
      if(prev && x._prev && (p = f(x._prev)) !== undefined) {
        return (v.push(p), v);
      } else {
        return (v.push(f(x)), v);
      }
    }, []), k = keys.join("|");

    if(this._cells[k]) return this._cells[k];

    // Rather than sharing the pipeline between all nodes,
    // give each cell its individual pipeline. This allows
    // dynamically added collectors to do the right thing
    // when wiring up the pipelines.
    var cp = this._pipeline.map(function(n) { return n.clone(); }),
        prev = (x._prev !== undefined) ? null : undefined,
        t  = tuple.create({keys: keys, key: k}, prev),
        ds = this._graph.data("vg_"+t._id, cp, t);

    this.addListener(cp[0]);
    // cp[cp.length-1].addListener(node.parentCollector);

    var del = function() {
      util.debug({}, ["deleting cell", k]);

      facet.removeListener(cp[0]);
      facet._graph.disconnect(cp);
      delete facet._cells[k];
    };

    return (this._cells[k] = {t: t, s: ADD, ds: ds, delete: del, count: 0});
  };

  proto.transform = function(input, reset) {
    util.debug(input, ["faceting"]);

    var facet = this,
        output = changeset.create(input),
        k, c, x, d, i, len;

    if(reset) rst.call(this, input, output);

    input.add.forEach(function(x) {
      var c = cell.call(facet, x);
      c.count += 1;
      c.s |= MOD;
      c.ds._input.add.push(x);
    });

    input.mod.forEach(function(x) {
      var c = cell.call(facet, x), 
          prev = cell.call(facet, x, true);

      if(c !== prev) {
        prev.count -= 1;
        prev.s |= MOD;
        prev.ds._input.rem.push(x);
      }

      if(c.s & ADD) {
        c.count += 1;
        c.ds._input.add.push(x);
      } else {
        c.ds._input.mod.push(x);
      }

      c.s |= MOD;
    });

    input.rem.forEach(function(x) {
      var c = cell.call(facet, x);
      c.count -= 1;
      c.s |= MOD;
      c.ds._input.rem.push(x);
    });

    for (k in this._cells) {
      c = this._cells[k], x = c.t;
      // propagate sort, signals, fields, etc.
      changeset.copy(input, c.ds._input);
      if (c.count === 0) {
        if (c.s === MOD) output.rem.push(x);
        c.delete();
      } else if (c.s & ADD) {
        output.add.push(x);
      } else if (c.s & MOD) {
        output.mod.push(x);
      }
      c.s = 0;
    }

    return output;
  };

  return Facet;
});