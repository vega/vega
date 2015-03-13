vg.data.formula = (function() {
  return function() {
    var field = null,
        expr = vg.identity,
        setter;

    var formula = vg.data.mapper(function(d, i, list) {
      if (field) {
        setter(d, expr.call(null, d, i, list));
      }
      return d;
    });

    formula.field = function(name) {
      field = name;
      setter = vg.mutator(field);
      return formula;
    };

    formula.expr = function(func) {
      expr = vg.isFunction(func) ? func : vg.parse.expr(func);
      return formula;
    };

    return formula;
  };
})();