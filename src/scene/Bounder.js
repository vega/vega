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

function reevaluate(input, mark) {
  return input.add.length ||
    input.rem.length ||
    mark.items.length === 0 ||
    mark.marktype === 'area' ||
    mark.marktype === 'line' ||
    input.mod.some(function(item) {
      return mark.bounds.alignsWith(item.bounds);
    });
}

proto.evaluate = function(input) {
  log.debug(input, ['bounds', this._mark.marktype]);

  var mark  = this._mark,
      isGroup = mark.marktype === 'group',
      items = mark.items,
      hasLegends = dl.array(mark.def.legends).length > 0,
      i, ilen, j, jlen, legend, group;

  if (reevaluate(input, mark)) {
    bound.mark(mark, null, isGroup && !hasLegends);
  } else {
    input.mod.forEach(function(item) { bound.item(item); });
  }

  if (isGroup && hasLegends) {
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
