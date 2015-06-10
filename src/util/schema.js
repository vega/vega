var dl = require('datalib'),
    parse = require('../parse'),
    Scale = require('../scene/Scale');

module.exports = function schema(opt) {
  var schema = {defs: {}, refs:{}, "$ref": "#/defs/spec"};
  opt = opt || {};

  dl.keys(parse).forEach(function(k) {
    var s = parse[k].schema;
    if (!s) return;
    if (s.refs) dl.extend(schema.refs, s.refs);
    if (s.defs) dl.extend(schema.defs, s.defs);
  });

  // Scales aren't part of the parser, so add their schema manually
  var ss = Scale.schema;
  if (ss.refs) dl.extend(schema.refs, ss.refs);
  if (ss.defs) dl.extend(schema.defs, ss.defs);

  // Extend schema to support custom mark properties or property sets.
  if (opt.properties) dl.keys(opt.properties).forEach(function(k) {
    schema.defs.propset.properties[k] = {"$ref": "#/refs/"+opt.properties[k]+"Value"};
  });

  if (opt.propertySets) dl.keys(opt.propertySets).forEach(function(k) {
    schema.defs.mark.properties.properties.properties[k] = {"$ref": "#/defs/propset"};
  });

  return schema;
};