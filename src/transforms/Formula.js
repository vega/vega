define(function(require, exports, module) {
  var Transform = require('./Transform'),
      tuple = require('../dataflow/tuple'), 
      expr = require('../parse/expr'),
      util = require('../util/index'),
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

  function f(x, field, stamp) {
    var val = expr.eval(this._graph, this.expr.get(this._graph), 
      x, null, null, null, this.dependency(C.SIGNALS));

    tuple.set(x, field, val); 
  };

  proto.transform = function(input) {
    util.debug(input, ["formulating"]);
    var t = this, 
        field = this.field.get(this._graph);

    input.add.forEach(function(x) { f.call(t, x, field, input.stamp) });;
    input.mod.forEach(function(x) { f.call(t, x, field, input.stamp) });
    input.fields[field] = 1;
    return input;
  };

  return Formula;
});