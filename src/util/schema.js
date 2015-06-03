var dl = require('datalib'),
    parse = require('../parse');

module.exports = function schema() {
  var schema = {defs: {}, refs:{}, "$ref": "#/defs/spec"};
  dl.keys(parse).forEach(function(k) {
    var s = parse[k].schema;
    if (!s) return;
    if (s.refs) dl.extend(schema.refs, s.refs);
    if (s.defs) dl.extend(schema.defs, s.defs);
  });
  return schema;
};