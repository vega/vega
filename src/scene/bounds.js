define(function(require, exports, module) {
  var vg = require('vega');

  return function bounds(model, mark) {
    var node = new model.Node(function(input) {
      global.debug(input, ["bounds", mark.marktype]);

      vg.scene.bounds.mark(mark);
      if(mark.marktype === vg.scene.GROUP) 
        vg.scene.bounds.mark(mark, null, false);

      input.touch = true;
      return input;
    });
    return node;
  }
});