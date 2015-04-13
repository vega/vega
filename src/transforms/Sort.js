var Transform = require('./Transform'),
    expr = require('../parse/expr'),
    util = require('../util/index');

function Sort(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {by: {type: "array<field>"} });
  return this.router(true);
}

var proto = (Sort.prototype = new Transform());

proto.transform = function(input) {
  util.debug(input, ["sorting"]);

  if(input.add.length || input.mod.length || input.rem.length) {
    input.sort = util.comparator(this.by.get(this._graph).fields);
  }

  return input;
};

module.exports = Sort;