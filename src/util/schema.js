var dl = require('datalib'),
    parse = require('../parse');

module.exports = function schema() {
  var schema  = dl.extend(dl.duplicate(parse.spec.schema), {refs: {}});
  dl.keys(parse).forEach(function(k) {
    dl.extend(schema.refs, parse[k].schemaRefs);
  });
  return schema;
};