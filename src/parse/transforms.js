var util = require('datalib/src/util'),
    transforms = require('../transforms/index');

function parseTransforms(model, def) {
  var tx = new transforms[def.type](model);
  
  // We want to rename output fields before setting any other properties,
  // as subsequent properties may require output to be set (e.g. group by).
  if(def.output) tx.output(def.output);

  util.keys(def).forEach(function(k) {
    if(k === 'type' || k === 'output') return;
    if(k === 'transform' && def.type === 'facet') return;
    tx.param(k, def[k]);
  });

  return tx;
};

module.exports = parseTransforms;
parseTransforms.schema = {
  "defs": {
    "transform": {
      "type": "array",
      "items": {
        "oneOf": util.keys(transforms).map(function(k) {
          return transforms[k].schema;
        })
      }
    }
  }
};