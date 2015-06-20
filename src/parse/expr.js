var util = require('datalib/src/util'),
    expression = require('vega-expression'),
    args = ['datum', 'event', 'signals'],
    expr = expression.compiler(args, args[0], args[2]);

expr.eval = function(graph, fn, opt) {
  // TODO memoize here or elsewhere to avoid repeated signal lookups.
  var signals = graph.signalValues(util.array(opt.signals));
  return fn.call(fn, opt.datum, opt.event, signals);
};

module.exports = expr;
