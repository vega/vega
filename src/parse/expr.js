vg.parse.expr = (function() {

  var parse = vg.expression.parse;
  var codegen = vg.expression.code({
    idWhiteList: ['d', 'index', 'data']
  });

  var lexer = /([\"\']|[\=\<\>\~\&\|\?\:\+\-\/\*\%\!\^\,\;\[\]\{\}\(\) ]+)/;

  var FUNCTION = vg_expression_functions();

  return function(expr) {
    var code;
    if (vg.config.safeMode) {
      code = codegen(parse(expr));
    } else {
      var tokens = expr.split(lexer),
        t, v, i, n, sq, dq;

      for (sq=0, dq=0, i=0, n=tokens.length; i<n; ++i) {
        var t = tokens[i];
        if (t==="'") { if (!dq) sq = !sq; continue; }
        if (t==='"') { if (!sq) dq = !dq; continue; }
        if (dq || sq) continue;
        if (vg_expression_constants[t]) {
          tokens[i] = vg_expression_constants[t];
        }
        if (FUNCTION[t] && (v=tokens[i+1]) && v[0]==="(") {
          tokens[i] = FUNCTION[t];
        }
      }

      code = tokens.join("");
    }

    return Function('d', 'index', 'data',
      '"use strict"; return (' + code + ');');
  };

})();
