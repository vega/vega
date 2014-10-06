define(function(require, exports, module) {
  var vg = require('vega'), 
      Model = require('../core/Model'), 
      View = require('../core/View'), 
      parseMarks = require('../parse/marks'),
      parseSignals = require('../parse/signals'),
      parsePredicates = require('../parse/predicates'),
      parseData = require('../parse/data');

  return function parseSpec(spec, callback, viewFactory) {
    // protect against subsequent spec modification
    spec = vg.duplicate(spec);

    viewFactory = viewFactory || View.factory;

    var width = spec.width || 500,
        height = spec.height || 500,
        viewport = spec.viewport || null,
        model = new Model();

    model._defs = {
      width: width,
      height: height,
      viewport: viewport,
      padding: vg.parse.padding(spec.padding),
      signals: parseSignals(model, spec.signals),
      predicates: parsePredicates(model, spec.predicates),
      marks: parseMarks(model, spec, width, height),
      data: parseData(model, spec.data, function() { callback(viewFactory(model)); })
    };
  }
});