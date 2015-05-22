var expr = require('./expr'),
    C = require('../util/constants');

module.exports = function parseSignals(model, spec) {
  // process each signal definition
  (spec || []).forEach(function(s) {
    var signal = model.signal(s.name, s.init),
        exp;

    if(s.expr) {
      exp = expr(s.expr);
      signal.evaluate = function(input) {
        var value = expr.eval(model, exp.fn, null, null, null, null, exp.signals);
        if(spec.scale) value = model.scale(spec, value);
        signal.value(value);
        input.signals[s.name] = 1;
        return input;
      };
      signal.dependency(C.SIGNALS, exp.signals);
      exp.signals.forEach(function(dep) { model.signal(dep).addListener(signal); });
    }
  });

  return spec;
};