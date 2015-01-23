define(function(require, exports, module) {
  var util = require('../util/index'),
      transforms = require('../transforms/index');

  return function parseTransforms(model, def) {
    var tx = new transforms[def.type](model.graph);
    if(def.type == 'facet') {
      var pipeline = (def.transform||[])
        .map(function(t) { return parseTransforms(model, t); });
      tx.pipeline(pipeline);
    }

    util.keys(def).forEach(function(k) {
      if(k === 'type') return;
      if(k === 'transform' && def.type === 'facet') return;
      (tx[k]).set(tx, def[k]);
    });

    return tx;
  }
});