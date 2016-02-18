var dl = require('datalib'),
    transforms = require('../transforms/index');

function parseTransforms(model, def) {
  var transform = transforms[def.type],
      tx;

  if (!transform) throw new Error('"' + def.type + '" is not a valid transformation');

  tx = new transform(model);
  // We want to rename output fields before setting any other properties,
  // as subsequent properties may require output to be set (e.g. group by).
  if(def.output) tx.output(def.output);

  dl.keys(def).forEach(function(k) {
    if(k === 'type' || k === 'output') return;
    tx.param(k, def[k]);
  });

  return tx;
}

module.exports = parseTransforms;

var keys = dl.keys(transforms)
  .filter(function(k) { return transforms[k].schema; });

var defs = keys.reduce(function(acc, k) {
  return (acc[k+'Transform'] = transforms[k].schema, acc);
}, {});

parseTransforms.schema = {
  "defs": dl.extend(defs, {
    "transform": {
      "type": "array",
      "items": {
        "oneOf": keys.map(function(k) {
          return {"$ref": "#/defs/"+k+"Transform"};
        })
      }
    }
  })
};
