var dl = require('datalib'),
    Transform = require('./Transform'),
    expr = require('../parse/expr'),
    log = require('../util/log');

function Sort(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {by: {type: "array<field>"} });
  return this.router(true);
}

var proto = (Sort.prototype = new Transform());

proto.transform = function(input) {
  log.debug(input, ["sorting"]);

  if(input.add.length || input.mod.length || input.rem.length) {
    input.sort = dl.comparator(this.param("by").field);
  }

  return input;
};

module.exports = Sort;