define(function(require, exports, module) {
  var expr = require('./expr'),
      C = require('../util/constants');

  return function parseSignals(model, spec) {
    // process each signal definition
    (spec || []).forEach(function(s) {
      var signal = model.graph.signal(s.name, s.init),
          node, exp;

      if(s.expr) {
        exp = expr(model, s.expr);
        signal.evaluate = function(input) {
          var value = expr.eval(model, exp.fn, null, null, null, null, exp.signals);
          if(spec.scale) value = model.scene().scale(spec, value);
          signal.value(value);
          input.signals[s.name] = 1;
          return input;
        };
        signal.dependency(C.SIGNALS, exp.signals);
        exp.signals.forEach(function(dep) { model.signal(dep).addListener(node); });
      }
    });

    return spec;
  };
});