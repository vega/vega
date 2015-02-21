vg.parse.expr = (function() {

  var parse = vg.expression.parse;
  var codegen = vg.expression.code({
    idWhiteList: ['d', 'index', 'data']
  });

  return function(expr) {
    var code = codegen(parse(expr));
    return Function('d', 'index', 'data',
      '"use strict"; return (' + code + ');');
  };

})();
