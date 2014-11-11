define(function(require, exports, module) {
  var expr = require('./expr');

  return function parseSignals(model, spec) {
    // process each signal definition
    (spec || []).forEach(function(s) {
      var signal = model.signal(s.name, s.init),
          node, exp;

      if(s.expr) {
        exp = expr(model, s.expr);
        node = new model.Node(function(input) {
          var value = expr.eval(model, exp.fn, null, null, null, null, exp.signals);
          if(spec.scale) value = model.scene().scale(spec, value);
          signal.value(value);
          input.signals[s.name] = 1;
          return input;
        });
        node._deps.signals = exp.signals;
        exp.signals.forEach(function(dep) { model.signal(dep).addListener(node); });
        signal.node(node);
      }
    });

    return spec;
  };
});