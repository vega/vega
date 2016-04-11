var df = require('vega-dataflow'),
    Tuple = df.Tuple,
    log = require('vega-logging'),
    Transform = require('./Transform');

function Formula(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    field: {type: 'value'},
    expr:  {type: 'expr'}
  });

  return this.mutates(true);
}

var prototype = (Formula.prototype = Object.create(Transform.prototype));
prototype.constructor = Formula;

prototype.transform = function(input) {
  log.debug(input, ['formulating']);

  var field = this.param('field'),
      expr = this.param('expr'),
      updated = false;

  function set(x) {
    Tuple.set(x, field, expr(x));
    updated = true;
  }

  input.add.forEach(set);

  if (this.reevaluate(input)) {
    input.mod.forEach(set);
  }

  if (updated) input.fields[field] = 1;
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
