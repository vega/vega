var dl = require('datalib'),
    df = require('vega-dataflow'),
    Node = df.Node, // jshint ignore:line
    log = require('vega-logging'),
    bound = require('vega-scenegraph').bound,
    Encoder = require('./Encoder');

function Bounder(graph, mark) {
  this._mark = mark;
  return Node.prototype.init.call(this, graph)
    .router(true)
    .reflows(true)
    .mutates(true);
}

var proto = (Bounder.prototype = new Node());

proto.evaluate = function(input) {
  log.debug(input, ['bounds', this._mark.marktype]);

  var type  = this._mark.marktype,
      isGrp = type === 'group',
      items = this._mark.items,
      hasLegends = dl.array(this._mark.def.legends).length > 0,
      i, ilen, j, jlen, group, legend;

  if (input.add.length || input.rem.length || !items.length || 
      input.mod.length === items.length ||
      type === 'area' || type === 'line') {
    bound.mark(this._mark, null, isGrp && !hasLegends);
  } else {
    input.mod.forEach(function(item) { bound.item(item); });
  }

  if (isGrp && hasLegends) {
    for (i=0, ilen=items.length; i<ilen; ++i) {
      group = items[i];
      group._legendPositions = null;
      for (j=0, jlen=group.legendItems.length; j<jlen; ++j) {
        legend = group.legendItems[j];
        Encoder.update(this._graph, input.trans, 'vg_legendPosition', legend.items, input.dirty);
        bound.mark(legend, null, false);
      }
    }

    bound.mark(this._mark, null, true);
  }

  return df.ChangeSet.create(input, true);
};

module.exports = Bounder;