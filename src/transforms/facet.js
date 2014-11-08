define(function(require, exports, module) {
  var util = require('../util/index'), 
      tuple = require('../core/tuple'), 
      changeset = require('../core/changeset');

  return function facet(model) {
    var groupby = [], pipeline = [];

    var ADD = 1, MOD = 2;
    var cells = {};
  
    function cell(x) {
      // TODO: consider more efficient key constructions?
      var keys = groupby.reduce(function(v,f) {
        return (v.push(f(x)), v);
      }, []), k = keys.join("|");

      if(cells[k]) return cells[k];

      // Rather than sharing the pipeline between all nodes,
      // give each cell its individual pipeline. This allows
      // dynamically added collectors to do the right thing
      // when wiring up the pipelines.
      var cp = pipeline.map(function(node) {
        var n = new model.Node();
        n._fn = node._fn, n._deps = node._deps;
        // We don't need to transfer over any other properties, because
        // the nodes in pipeline are unconnected dummy nodes. 
        return n;
      });

      var t = tuple.create({keys: keys, key: k}),
          ds = model.data("vg_"+t._id, cp, t);

      node.addListener(cp[0]);
      cp[cp.length-1].addListener(node.parentCollector);

      var del = function() {
        global.debug({}, ["deleting cell", k, cp[0]._type]);

        node.removeListener(cp[0]);
        model.graph.disconnect(cp);
        delete cells[k];
      };

      return cells[k] = {t: t, s: ADD, ds: ds, delete: del, count: 0};
    };

    var node = new model.Node(function(input) {
      global.debug(input, ["faceting"]);

      var output = changeset.create(input);
      var k, c, x, d;

      input.add.forEach(function(x) {
        var c = cell(x);
        c.count += 1;
        c.s |= MOD;
        c.ds._input.add.push(x);
      });

      input.mod.forEach(function(x) {
        var c = cell(x);
        c.s |= MOD;
        c.ds._input.mod.push(x);
      });

      input.rem.forEach(function(x) {
        var c = cell(x);
        c.count -= 1;
        c.s |= MOD;
        c.ds._input.rem.push(x);
      });

      for (k in cells) {
        c = cells[k], x = c.t;
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
    });

    node._router = true;

    node.data = function() {
      var k, t, d, data = [];
      for(k in cells) {
        t = cells[k].t, d = model.data("vg_"+t._id).data();
        // console.log("facet data", t._id, d);
        data.push({_id: t._id, values: d });
      }

      return data;
    };

    node.pipeline = function(p) { 
      if(!arguments.length) return pipeline; 
      pipeline = p;
      return node;
    };

    node.keys = function(k) {
      groupby = util.array(k).map(util.accessor);
      return node;
    };

    // The output collector in the facet node's pipeline. We hook up the
    // output nodes of each cell's pipeline to it.
    node.parentCollector = null;

    return node;
  }
});