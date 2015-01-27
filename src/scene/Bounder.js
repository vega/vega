define(function(require, exports, module) {
  var Node = require('../dataflow/Node'),
      bounds = require('../util/bounds'),
      C = require('../util/constants'),
      util = require('../util/index');

  function Bounder(model, mark) {
    this._mark = mark;
    return Node.prototype.init.call(this, model.graph);
  }

  var proto = (Bounder.prototype = new Node());

  proto.evaluate = function(input) {
    util.debug(input, ["bounds", mark.marktype]);

    bounds.mark(mark);
    if(this._mark.marktype === C.GROUP) 
      bounds.mark(mark, null, false);

    input.touch = true;
    return input;
  };

  return Bounder;
});