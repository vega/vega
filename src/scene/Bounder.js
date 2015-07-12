var util = require('datalib/src/util'),
    bound = require('vega-scenegraph/src/util/bound'),
    Node = require('vega-dataflow/src/Node'), // jshint ignore:line
    ChangeSet = require('vega-dataflow/src/ChangeSet'),
    log = require('vega-logging'),
    Encoder = require('./Encoder');

function Bounder(graph, mark) {
  this._mark = mark;
  return Node.prototype.init.call(this, graph)
    .router(true)
    .reflows(true);
}

var proto = (Bounder.prototype = new Node());

proto.evaluate = function(input) {
  log.debug(input, ["bounds", this._mark.marktype]);

  var type  = this._mark.marktype,
      isGrp = type === "group",
      items = this._mark.items,
      hasLegends = util.array(this._mark.def.legends).length > 0,
      i, ilen, j, jlen, group, legend;

  if (input.add.length || input.rem.length || !items.length || 
      input.mod.length === items.length ||
      type === "area" || type === "line") {
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
        Encoder.update(this._graph, input.trans, "vg_legendPosition", legend.items, input.dirty);
        bound.mark(legend, null, false);
      }
    }

    bound.mark(this._mark, null, true);
  }

  return ChangeSet.create(input, true);
};

module.exports = Bounder;