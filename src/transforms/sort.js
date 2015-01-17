define(function(require, exports, module) {
  var util = require('../util/index'), 
      expr = require('../parse/expr');

  return function sort(model) {
    var by = null;

    function comparator() {
      return util.comparator(by.map(function(b) {
        return model.signal(b) ? model.signal(b).value() : b;
      }));
    };

    var node = new model.Node(function(input) {
      util.debug(input, ["sorting"]);

      if(input.add.length || input.mod.length || input.rem.length)
        input.sort = comparator();
      
      return input;
    });
    node._router = true;

    node.by = function(b) {
      by = util.array(b);
      by.forEach(function(s) { 
        if(model.signal(s)) node._deps.signals.push(s);
      });
      return node;
    };

    return node;
  };
});