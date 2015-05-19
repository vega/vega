var dl = require('datalib'),
    Node = require('../dataflow/Node'),
    Encoder = require('./Encoder'),
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
  var i, ilen, j, jlen, group, legend,
      hasLegends = dl.array(this._mark.def.legends).length > 0;

  bounds.mark(this._mark, null, !hasLegends);

  // HACK: Position legends. 
  if(hasLegends) {
    for(i=0, ilen=this._mark.items.length; i<ilen; ++i) {
      group = this._mark.items[i];
      for(j=0, jlen=group.legendItems.length; j<jlen; ++j) {
        legend = group.legendItems[j];
        Encoder.update(this._graph, input.trans, "vg_legendPosition", legend.items);
        bounds.mark(legend, null, true);
      }
    }

    bounds.mark(this._mark, null, true);
  }

  input.reflow = true;
  return input;
};

module.exports = Bounder;