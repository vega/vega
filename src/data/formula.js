vg.data.formula = (function() {

  // TODO security check
  // TODO remove with, perform parse?
  function code(str) {
    return "with (Math) { return ("+str+"); }";
  }
  
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
      expr = vg.isFunction(func)
        ? func
        : new Function("d", code(func));
      return formula;
    };

    return formula;
  };
})();