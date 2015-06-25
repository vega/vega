var util = require('datalib/src/util'),
    Model = require('../core/Model'), 
    View = require('../core/View'), 
    parseBg = require('../parse/background'),
    parsePadding = require('../parse/padding'),
    parseMarks = require('../parse/marks'),
    parseSignals = require('../parse/signals'),
    parsePredicates = require('../parse/predicates'),
    parseData = require('../parse/data'),
    parseInteractors = require('../parse/interactors');

function parseSpec(spec, callback) {
  // protect against subsequent spec modification
  spec = util.duplicate(spec);

  var vf = arguments[arguments.length-1],
      viewFactory = arguments.length > 2 && util.isFunction(vf) ? vf : View.factory,
      config = arguments[2] !== viewFactory ? arguments[2] : {};

  var width = spec.width || 500,
      height = spec.height || 500,
      viewport = spec.viewport || null,
      model = new Model(config);

  parseInteractors(model, spec, function() {
    model.defs({
      width: width,
      height: height,
      viewport: viewport,
      background: parseBg(spec.background),
      padding: parsePadding(spec.padding),
      signals: parseSignals(model, spec.signals),
      predicates: parsePredicates(model, spec.predicates),
      marks: parseMarks(model, spec, width, height),
      data: parseData(model, spec.data, function() { callback(viewFactory(model)); })
    });
  });
}

module.exports = parseSpec;
parseSpec.schema = {
  "defs": {
    "spec": {
      "title": "Vega visualization specification",
      "type": "object",

      "allOf": [{"$ref": "#/defs/container"}, {
        "properties": {
          "width": {"type": "number"},
          "height": {"type": "number"},
          "viewport": {
            "type": "array",
            "items": {"type": "number"},
            "maxItems": 2
          },

          "background": {"$ref": "#/defs/background"},
          "padding": {"$ref": "#/defs/padding"},

          "interactors": {"$ref": "#/refs/interactors"},

          "signals": {
            "type": "array",
            "items": {"$ref": "#/defs/signal"}
          },

          "predicates": {
            "type": "array",
            "items": {"$ref": "#/defs/predicate"}
          },

          "data": {
            "type": "array",
            "items": {"$ref": "#/defs/data"}
          }
        }
      }]
    }
  }
};