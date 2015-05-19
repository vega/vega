var Node = require('../dataflow/Node'),
    bounds = require('../util/boundscalc'),
    C = require('../util/constants'),
    debug = require('../util/debug');

function Bounder(graph, mark) {
  this._mark = mark;
  return Node.prototype.init.call(this, graph).router(true);
}

var proto = (Bounder.prototype = new Node());

proto.evaluate = function(input) {
  debug(input, ["bounds", this._mark.marktype]);

  bounds.mark(this._mark, null, false);
  input.reflow = true;
  return input;
};

module.exports = Bounder;