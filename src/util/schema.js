var dl = require('datalib'),
    parse = require('../parse');

module.exports = function schema(opt) {
  var schema = {defs: {}, refs:{}, "$ref": "#/defs/spec"};
  opt = opt || {};

  dl.keys(parse).forEach(function(k) {
    var s = parse[k].schema;
    if (!s) return;
    if (s.refs) dl.extend(schema.refs, s.refs);
    if (s.defs) dl.extend(schema.defs, s.defs);
  });

  // Extend schema to support custom mark properties or property sets.
  if (opt.properties) dl.keys(opt.properties).forEach(function(k) {
    schema.defs.propset.properties[k] = opt.properties;
  });

  if (opt.propertySets) dl.keys(opt.propertySets).forEach(function(k) {
    schema.defs.mark.properties.properties.properties[k] = opt.propertySets[k];
  });

  return schema;
};