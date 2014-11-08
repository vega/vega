define(function(require, exports, module) {
  var vg = require('vega'),
      boundsCalc = require('../util/bounds');

  return function bounds(model, mark) {
    var node = new model.Node(function(input) {
      global.debug(input, ["bounds", mark.marktype]);

      boundsCalc.mark(mark);
      if(mark.marktype === vg.scene.GROUP) 
        boundsCalc.mark(mark, null, false);

      input.touch = true;
      return input;
    });
    return node;
  }
});