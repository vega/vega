var dl = require('datalib'),
    log = require('vega-logging'),
    Model = require('../core/Model'),
    View = require('../core/View');

/**
 * Parse graph specification
 * @param spec (object)
 * @param config (optional object)
 * @param viewFactory (optional function)
 * @param callback (error, model)
 */
 function parseSpec(spec /*, [config,] [viewFactory,] callback */) {
  // do not assign any values to callback, as it will change arguments
  var arglen = arguments.length,
      argidx = 2,
      cb = arguments[arglen-1],
      model = new Model(),
      viewFactory = View.factory;

  if (arglen > argidx && dl.isFunction(arguments[arglen - argidx])) {
    viewFactory = arguments[arglen - argidx];
    ++argidx;
  }
  if (arglen > argidx && dl.isObject(arguments[arglen - argidx])) {
    model.config(arguments[arglen - argidx]);
  }

  function onDone(err, value) {
    if (cb) {
      if (cb.length > 1) cb(err, value);
      else if (!err) cb(value);
      cb = null;
    }
  }

  function onError(err) {
    log.error(err);
    onDone(err);
  }

  function onCreate(err) {
    if (err) onError(err);
    else onDone(null, viewFactory(model));
  }

  function parse(spec) {
    try {
      // protect against subsequent spec modification
      spec = dl.duplicate(spec);

      var parsers = require('./'),
          width   = spec.width || 500,
          height  = spec.height || 500,
          padding = parsers.padding(spec.padding);

      // create signals for width, height and padding
      model.signal('width', width);
      model.signal('height', height);
      model.signal('padding', padding);

      // initialize model
      model.defs({
        width:      width,
        height:     height,
        padding:    padding,
        viewport:   spec.viewport || null,
        background: parsers.background(spec.background),
        signals:    parsers.signals(model, spec.signals),
        predicates: parsers.predicates(model, spec.predicates),
        marks:      parsers.marks(model, spec, width, height),
        data:       parsers.data(model, spec.data, onCreate)
      });
    } catch (err) { onError(err); }
  }

  if (dl.isObject(spec)) {
    parse(spec);
  } else if (dl.isString(spec)) {
    var opts = dl.extend({url: spec}, model.config().load);
    dl.json(opts, function(err, spec) {
      if (err) onError('SPECIFICATION LOAD FAILED: ' + err);
      else parse(spec);
    });
  } else {
    onError('INVALID SPECIFICATION: Must be a valid JSON object or URL.');
  }
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
