define(function(require, exports, module) {
  var changeset = require('../core/changeset');

  return function collector(model, pipeline) {
    var data = [];
    if(!pipeline) pipeline = [];

    function pipelines(fn) {
      for(var i = 0; i < pipeline.length; i++) {
        var n = pipeline[i];
        if(n == node) break;
        if(n._type == 'collector' || !n.data) continue;

        fn(n);
      }
    }
   
    var node = new model.Node(function(input) {
      global.debug(input, ["collecting"]);

      // Output/signal nodes issue touches, but touches shouldn't be issued if
      // one output node is pulsing another (e.g. facet pipelines -> main pipeline).
      if(input.touch) {
        if(pipeline.length == 0) {
          input = changeset.create(input);
          input.mod = data.slice();
        }
      } else {
        if(input.rem.length) {
          var ids = input.rem.reduce(function(m,x) { return (m[x._id]=1, m); }, {});
          data = data.filter(function(x) { return ids[x._id] !== 1; });
        }

        if(input.add.length) {
          if(data.length) data = data.concat(input.add);
          else data = input.add;
        }
        if(input.sort) data.sort(input.sort);
      }

      // If the collector has a pipeline, (1) refresh any nested data;
      // (2) it's listeners are other collectors or output nodes. So send forward
      // a touch pulse, to prevent multiple evaluations of downstream nodes. 
      if(pipeline.length > 0) { node.data(); input.touch = true; }
      return input;
    });

    node.data = function() { 
      var i, n, k, c, collect = {};

      // More efficient way to merge this? Or, we could just put it
      // in the tuples in the transforms (and ignore nested structure
      // in transforms).
      pipelines(function(n) {
        n.data().forEach(function(d) {
          c = collect[d._id] || (collect[d._id] = {});
          for(k in d) c[k] = d[k];
        });
      });

      if(Object.keys(collect).length) {
        for(i = 0; i < data.length; i++) {
          d = data[i];
          for(k in collect[d._id]) d[k] = collect[d._id][k];        
        }
      }

      return data; 
    };

    node._type = 'collector';
    node._router = true;
    node._touchable = true;

    // Store a pointer to this collector for any nodes that define 
    // internal pipelines. Those nodes can then hook up their piplines
    // to pulse to this one. 
    pipelines(function(n) { n.parentCollector = node; });

    return node;
  };
});