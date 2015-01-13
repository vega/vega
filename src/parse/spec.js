define(function(require, exports, module) {
  var Model = require('../core/Model'), 
      View = require('../core/View'), 
      parsePadding = require('../parse/padding'),
      parseMarks = require('../parse/marks'),
      parseSignals = require('../parse/signals'),
      parsePredicates = require('../parse/predicates'),
      parseData = require('../parse/data'),
      parseInteractors = require('../parse/interactors'),
      tuple = require('../core/tuple'),
      util = require('../util/index');

  return function parseSpec(spec, callback, viewFactory) {
    spec = util.duplicate(spec);  // protect against subsequent spec modification
    tuple.reset();

    viewFactory = viewFactory || View.factory;

    var width = spec.width || 500,
        height = spec.height || 500,
        viewport = spec.viewport || null,
        model = new Model();

    parseInteractors(model, spec, function() {
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
    });
  }
});