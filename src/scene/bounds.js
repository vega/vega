define(function(require, exports, module) {
  var calcBounds = require('../util/bounds'),
      C = require('../util/constants'),
      util = require('../util/index');

  return function bounds(model, mark) {
    var node = new model.Node(function(input) {
      util.debug(input, ["bounds", mark.marktype]);

      calcBounds.mark(mark);
      if(mark.marktype === C.GROUP) 
        calcBounds.mark(mark, null, false);

      input.touch = true;
      return input;
    });
    return node;
  }
});