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

  var mark  = this._mark,
      type  = mark.marktype,
      isGrp = type === 'group',
      items = mark.items,
      group = items.length && (isGrp ? items[0] : items[0].mark.group),
      axis  = group && group.mark.axis,
      hasLegends = dl.array(mark.def.legends).length > 0,
      i, ilen, j, jlen, legend, axis;

  if (input.add.length || input.rem.length || !items.length ||
      input.mod.length === items.length ||
      type === 'area' || type === 'line' ||
      (axis && input.scales[axis.scale().scaleName])) {
    bound.mark(mark, null, isGrp && !hasLegends);
  } else {
    input.mod.forEach(function(item) { bound.item(item); });
  }

  if (isGrp && hasLegends) {
    for (i=0, ilen=items.length; i<ilen; ++i) {
      group = items[i];
      group._legendPositions = null;
      for (j=0, jlen=group.legendItems.length; j<jlen; ++j) {
        legend = group.legendItems[j];
        Encoder.update(this._graph, input.trans, 'legendPosition', legend.items, input.dirty);
        bound.mark(legend, null, false);
      }
    }

    bound.mark(mark, null, true);
  }

  return df.ChangeSet.create(input, true);
};

module.exports = Bounder;
