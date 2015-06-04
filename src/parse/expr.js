var dl = require('datalib'),
    expression = require('../expression');

var expr = (function() {
  var parse = expression.parse;
  var codegen = expression.code({
    idWhiteList: ['datum', 'event', 'signals']
  });

  return function(expr) {    
    var value = codegen(parse(expr));
    value.fn = Function('datum', 'event', 'signals',
      '"use strict"; return (' + value.fn + ');');
    return value;
  };
})();

expr.eval = function(graph, fn, opt) {
  opt.signals = graph.signalValues(dl.array(opt.signals));
  return fn.call(fn, opt.datum, opt.event, opt.signals);
};

module.exports = expr;
