define(function(require, exports, module) {
  var Transform = require('./Transform'),
      tuple = require('../dataflow/tuple'), 
      changeset = require('../dataflow/changeset'), 
      meas = require('./measures'),
      util = require('../util/index');

  function Aggregate(graph) {
    Transform.prototype.init.call(this, graph);
    Transform.addParameters(this, {on: {type: "field"} });
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

    // Stats parameter handled manually.

    this._Measures = null;
    this._cache = {};
    return this;
  }

  var proto = (Aggregate.prototype = new Transform());

  proto.stats = { 
    set: function(transform, aggs) {
      transform._Measures = meas.create(aggs.map(function(a) { 
        return meas[a](transform._output[a]); 
      }));
      return transform;
    }
  };

  function rst(input, output) {
    for(var k in this._cache) { 
      if(!input.facet) output.rem.push(this._cache[k].set(input.stamp));
      this._cache[k] = null;
    }
  };

  function aggr(input) {
    var k = input.facet ? input.facet.key : "",
        a = this._cache[k],
        t;

    if(!a) {
      t = input.facet || tuple.create(null);
      this._cache[k] = a = new this._Measures(t);
    }

    return a;
  };

  proto.transform = function(input, reset) {
    util.debug(input, ["aggregating"]);

    var k = input.facet ? input.facet.key : "",
        output = input.facet ? input : changeset.create(),
        field = this.on.get().accessor,
        a, x;

    if(reset) rst.call(this, input, output);
    a = aggr.call(this, input);

    input.add.forEach(function(x) { a.add(field(x)); });
    input.mod.forEach(function(x) { 
      var prev = field(x._prev);
      if(prev && prev.stamp == input.stamp) {
        a.mod(field(x), prev.value); 
      }
    });
    input.rem.forEach(function(x) { 
      // Handle all these upstream cases:
      // #1: Add(t) -> Rem(t)
      // #2: Add(t) -> Mod(t) -> Rem(t)
      // #3: Add(t) -> Mod(t) -> FilterOut(t)
      var prev = field(x._prev);
      if(prev && prev.stamp == input.stamp) { 
        a.rem(prev.value);
      } else {
        a.rem(field(x));
      }
    });

    x = a.set(input.stamp);
    if(input.facet) return input;

    if (a.cnt === 0) {
      if (a.flag === a.MOD) output.rem.push(x);
      this._cache[k] = null;
    } else if (a.flag & a.ADD) {
      output.add.push(x);
    } else if (a.flag & a.MOD) {
      output.mod.push(x);
    }
    a.flag = 0;

    return output;
  };

  return Aggregate;
});