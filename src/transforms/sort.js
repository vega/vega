define(function(require, exports, module) {
  var vg = require('vega'), 
      expr = require('../parse/expr');

  return function sort(model) {
    var fn = null, isExpr = false;

    function comparator() {
      if(!isExpr) return fn; 
      var by = expr.eval(model, fn, null, null, null, node._deps.signals);
      return vg.comparator(by);
    };

    var node = new model.Node(function(input) {
      global.debug(input, ["sorting"]);

      if(input.add.length || input.mod.length || input.rem.length)
        input.sort = comparator();
      
      return input;
    });
    node._router = true;

    node.by = function(s) {
      if(vg.isFunction(s)) f = s;
      else {
        s = expr(model, s);
        fn = s.fn;
        isExpr = true;
        node._deps.signals = s.signals;
        node._deps.fields  = s.fields;
      }

      return node;
    };

    return node;
  };
});