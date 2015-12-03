var dl = require('datalib'),
    df = require('vega-dataflow'),
    scene = require('vega-scenegraph'),
    Node = df.Node, // jshint ignore:line
    log = require('vega-logging'),
    bound = scene.bound,
    Bounds = scene.Bounds,
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
      hasLegends = dl.array(mark.def.legends).length > 0,
      bounds  = mark.bounds,
      rebound = !bounds || input.rem.length,
      i, ilen, j, jlen, group, legend;

  if (type === 'line' || type === 'area') {
    bound.mark(mark, null, isGrp && !hasLegends);
  } else {
    input.add.forEach(function(item) {
      bound.item(item);
      rebound = rebound || (bounds && !bounds.encloses(item.bounds));
    });

    input.mod.forEach(function(item) {
      rebound = rebound || (bounds && bounds.alignsWith(item.bounds));
      bound.item(item);
    });

    if (rebound) {
      bounds = mark.bounds && mark.bounds.clear() || (mark.bounds = new Bounds());
      for (i=0, ilen=items.length; i<ilen; ++i) bounds.union(items[i].bounds);
    }
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
