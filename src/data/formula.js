vg.data.formula = (function() {
  
  return function() {
    var field = null,
        expr = vg.identity;
  
    var formula = vg.data.mapper(function(d) {
      if (field) d[field] = expr.call(null, d);
      return d;
    });

    formula.field = function(name) {
      field = name;
      return formula;
    };
  
    formula.expr = function(func) {
      expr = vg.isFunction(func) ? func : vg.parse.expr(func);
      return formula;
    };

    return formula;
  };
})();