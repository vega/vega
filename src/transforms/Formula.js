var Transform = require('./Transform'),
    tuple = require('../dataflow/tuple'), 
    expression = require('../parse/expr'),
    debug = require('../util/debug'),
    C = require('../util/constants');

function Formula(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    field: {type: "value"},
    expr:  {type: "expr"}
  });

  return this;
}

var proto = (Formula.prototype = new Transform());

proto.transform = function(input) {
  debug(input, ["formulating"]);
  var t = this, 
      g = this._graph,
      field = this.field.get(g),
      expr = this.expr.get(g),
      deps = this.dependency(C.SIGNALS);
  
  function set(x) {
    var val = expression.eval(g, expr, x, null, null, null, deps);
    tuple.set(x, field, val);
  }

  input.add.forEach(set);
  
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
  }

  input.fields[field] = 1;
  return input;
};

module.exports = Formula;