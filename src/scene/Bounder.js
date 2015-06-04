var dl = require('datalib'),
    Node = require('../dataflow/Node'),
    Encoder = require('./Encoder'),
    bounds = require('../util/boundscalc'),
    C = require('../util/constants'),
    log = require('../util/log');

function Bounder(graph, mark) {
  this._mark = mark;
  return Node.prototype.init.call(this, graph).router(true);
}

var proto = (Bounder.prototype = new Node());

proto.evaluate = function(input) {
  log.debug(input, ["bounds", this._mark.marktype]);

  var type  = this._mark.marktype,
      group = type === C.GROUP,
      items = this._mark.items,
      hasLegends = dl.array(this._mark.def.legends).length > 0,
      i, ilen, j, jlen, group, legend;

  bounds.mark(this._mark, null, group && !hasLegends);

  if(group && hasLegends) {
    for(i=0, ilen=this._mark.items.length; i<ilen; ++i) {
      group = this._mark.items[i];
      group._legendPositions = null;
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