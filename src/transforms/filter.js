define(function(require, exports, module) {
  var vg = require('vega'), 
      tuple = require('../core/tuple'), 
      changeset = require('../core/changeset'), 
      expr = require('../parse/expr');

  return function filter(model) {
    var test = null,
        skip = {}; // TODO: remove by recourse to prev values?

    function f(x) { return expr.eval(model, test, x, null, null, null, node._deps.signals); }

    var node = new model.Node(function(input) {
      global.debug(input, ["filtering"]);

      var output = changeset.create(input);

      input.rem.forEach(function(x) {
        if (skip[x._id] !== 1) output.rem.push(x);
        else skip[x._id] = 0;
      });

      input.add.forEach(function(x) {
        if (f(x)) output.add.push(x);
        else skip[x._id] = 1;
      });

      input.mod.forEach(function(x) {
        var b = f(x),
            s = (skip[x._id] === 1);
        if (b && s) {
          skip[x._id] = 0;
          output.add.push(x);
        } else if (b && !s) {
          output.mod.push(x);
        } else if (!b && s) {
          // do nothing, keep skip true
        } else { // !b && !s
          output.rem.push(x);
          skip[x._id] = 1;
        }
      });

      return output;
    });
    
    node.test = function(pred) { 
      if(vg.isFunction(pred)) test = pred;
      else {
        pred = expr(model, pred);
        test = pred.fn;
        node._deps.signals = pred.signals;
        node._deps.fields  = pred.fields;
      }
      
      return node;
    };

    return node;
  };
});