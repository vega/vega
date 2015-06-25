var util = require('datalib/src/util'),
    load = require('datalib/src/import/readers'),
    parse = require('../parse'),
    Scale = require('../scene/Scale'),
    config = require('./config');

function compile(module, opt, schema) {
  var s = module.schema;
  if (!s) return;
  if (s.refs) util.extend(schema.refs, s.refs);
  if (s.defs) util.extend(schema.defs, s.defs);
}

module.exports = function(opt) {
  var schema = null;
  opt = opt || {};

  // Compile if we're not loading the schema from a URL. 
  // Load from a URL to extend the existing base schema.
  if (opt.url) {
    schema = load.json(util.extend({url: opt.url}, config.load));
  } else {
    schema = {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "title": "Vega Visualization Specification Language",
      "defs": {}, 
      "refs": {}, 
      "$ref": "#/defs/spec"
    };

    util.keys(parse).forEach(function(k) { compile(parse[k], opt, schema); });

    // Scales aren't in the parser, add schema manually
    compile(Scale, opt, schema);
  }

  // Extend schema to support custom mark properties or property sets.
  if (opt.properties) util.keys(opt.properties).forEach(function(k) {
    schema.defs.propset.properties[k] = {"$ref": "#/refs/"+opt.properties[k]+"Value"};
  });

  if (opt.propertySets) util.keys(opt.propertySets).forEach(function(k) {
    schema.defs.mark.properties.properties.properties[k] = {"$ref": "#/defs/propset"};
  });

  return schema;
};