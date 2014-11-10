define(function(require, exports, module) {
  var tuple = require('../core/tuple'), 
      changeset = require('../core/changeset'), 
      meas = require('./measures'),
      util = require('../util/index');

  return function aggregate(model) {
    var Measures = null, aggrs = {}, field = null;
    
    function aggr(input) {
      var k, a, t, i, f;
      k = input.facet ? input.facet.key : "";
      if (!(a = aggrs[k])) {
        t = input.facet ? input.facet : tuple.create(null);
        aggrs[k] = a = new Measures(t);      
      }
      return a;
    }
    
    var node = new model.Node(function(input) {
      util.debug(input, ["aggregating"]);

      var k = input.facet ? input.facet.key : "",
          a = aggr(input), x,
          output = changeset.create();

      input.add.forEach(function(x) { a.add(x[field], 1); });
      input.mod.forEach(function(x) { 
        // If it happened on this timestamp, reflect the aggregate
        if(x._prev[field] && x._prev[field].stamp == input.stamp) {
          a.mod(x[field], x._prev[field].value); 
        }
      });
      input.rem.forEach(function(x) { 
        // Handle all these upstream cases:
        // #1: Add(t) -> Rem(t)
        // #2: Add(t) -> Mod(t) -> Rem(t)
        // #3: Add(t) -> Mod(t) -> FilterOut(t)
        if(x._prev[field] && x._prev[field].stamp == input.stamp) { 
          a.rem(x._prev[field].value);
        } else {
          a.rem(x[field]);
        }
      });
      x = a.set(input.stamp);

      if(input.facet) return input;

      if (a.cnt === 0) {
        if (a.flag === a.MOD) output.rem.push(x);
        delete aggrs[k];
      } else if (a.flag & a.ADD) {
        output.add.push(x);
      } else if (a.flag & a.MOD) {
        output.mod.push(x);
      }
      a.flag = 0;

      return output;
    });


    node.field = function(f) { 
      var deps = node._deps.fields,
          idx = deps.indexOf(field);

      if(idx > -1) deps.slice(idx, 1);
      field = f; 
      deps.push(field);
      return node;
    };

    node.stats = function(aggs) {
      Measures = meas.create(aggs.map(function(a) { return meas[a](); }));
      return node;
    };

    return node;
  };
});