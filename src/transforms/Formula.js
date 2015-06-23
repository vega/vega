var tuple = require('vega-dataflow/src/Tuple'),
    Deps = require('vega-dataflow/src/Dependencies'),
    Transform = require('./Transform'),
    expression = require('../parse/expr'),
    log = require('../util/log');

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
  log.debug(input, ["formulating"]);
  var t = this, 
      g = this._graph,
      field = this.param("field"),
      expr = this.param("expr"),
      context = {
        datum: null,
        signals: this.dependency(Deps.SIGNALS) 
      };

  function set(x) {
    context.datum = x;
    var val = expression.eval(g, expr, context);
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
Formula.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Formula transform",
  "description": "Extends data elements with new values according to a calculation formula.",
  "type": "object",
  "properties": {
    "type": {"enum": ["formula"]},
    "field": {
      "type": "string",
      "description": "The property name in which to store the computed formula value."
    },
    "expr": {
      "type": "string",
      "description": "A string containing an expression (in JavaScript syntax) for the formula."
    }
  },
  "required": ["type", "field", "expr"]
};
