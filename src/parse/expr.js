var dl = require('datalib'),
    expression = require('../expression');

var expr = (function() {
  var parse = expression.parse;
  var codegen = expression.code({
    idWhiteList: ['datum', 'event', 'i', 'p', 'sg']
  });

  return function(expr) {    
    var value = codegen(parse(expr));
    value.fn = Function('datum', 'event', 'i', 'p', 'sg', 'fns',
      '"use strict"; return (' + value.fn + ');');
    return value;
  };
})();

expr.eval = function(graph, fn, d, e, i, p, sg) {
  sg = graph.signalValues(dl.array(sg));
  return fn.call(null, d, e, i, p, sg);
};

module.exports = expr;
