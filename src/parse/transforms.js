define(function(require, exports, module) {
  var vg = require('vega'),
      transforms = require('../transforms/index');

  return function(model) {
    return function parseTransforms(def) {
      var tx = tx = transforms[def.type](model);
      if(def.type == 'facet') {
        var pipeline = (def.transform||[]).map(parseTransforms);

        tx.pipeline(pipeline);
      }

      vg.keys(def).forEach(function(k) {
        if(k === 'type') return;
        if(k === 'transform' && def.type === 'facet') return;
        (tx[k])(def[k]);
      });

      return tx;
    }
  };
});