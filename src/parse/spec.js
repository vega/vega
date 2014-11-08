define(function(require, exports, module) {
  var Model = require('../core/Model'), 
      View = require('../core/View'), 
      parsePadding = require('../parse/padding'),
      parseMarks = require('../parse/marks'),
      parseSignals = require('../parse/signals'),
      parsePredicates = require('../parse/predicates'),
      parseData = require('../parse/data'),
      util = require('../util/index');

  return function parseSpec(spec, callback, viewFactory) {
    // protect against subsequent spec modification
    spec = util.duplicate(spec);

    viewFactory = viewFactory || View.factory;

    var width = spec.width || 500,
        height = spec.height || 500,
        viewport = spec.viewport || null,
        model = new Model();

    model._defs = {
      width: width,
      height: height,
      viewport: viewport,
      padding: parsePadding(spec.padding),
      signals: parseSignals(model, spec.signals),
      predicates: parsePredicates(model, spec.predicates),
      marks: parseMarks(model, spec, width, height),
      data: parseData(model, spec.data, function() { callback(viewFactory(model)); })
    };
  }
});