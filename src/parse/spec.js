var dl  = require('datalib'),
    log = require('vega-logging'),
    themeVal = require('../util/theme-val'),
    Model = require('../core/Model'),
    View  = require('../core/View');

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
      viewFactory = View.factory,
      config;

  if (arglen > argidx && dl.isFunction(arguments[arglen - argidx])) {
    viewFactory = arguments[arglen - argidx];
    ++argidx;
  }

  if (arglen > argidx && dl.isObject(arguments[arglen - argidx])) {
    model.config(arguments[arglen - argidx]);
  }

  config = model.config();
  if (dl.isObject(spec)) {
    parse(spec);
  } else if (dl.isString(spec)) {
    var opts = dl.extend({url: spec}, config.load);
    dl.json(opts, function(err, spec) {
      if (err) done('SPECIFICATION LOAD FAILED: ' + err);
      else parse(spec);
    });
  } else {
    done('INVALID SPECIFICATION: Must be a valid JSON object or URL.');
  }

  function parse(spec) {
    try {
      // protect against subsequent spec modification
      spec = dl.duplicate(spec);

      var parsers = require('./'),
          width   = themeVal(spec, config, 'width', 500),
          height  = themeVal(spec, config, 'height', 500),
          padding = parsers.padding(themeVal(spec, config, 'padding')),
          background = themeVal(spec, config, 'background');

      // create signals for width, height, padding, and cursor
      model.signal('width', width);
      model.signal('height', height);
      model.signal('padding', padding);
      cursor(spec);

      // initialize model
      model.defs({
        width:      width,
        height:     height,
        padding:    padding,
        viewport:   spec.viewport || null,
        background: parsers.background(background),
        signals:    parsers.signals(model, spec.signals),
        predicates: parsers.predicates(model, spec.predicates),
        marks:      parsers.marks(model, spec, width, height),
        data:       parsers.data(model, spec.data, done)
      });
    } catch (err) { done(err); }
  }

  function cursor(spec) {
    var signals = spec.signals || (spec.signals=[]),  def;
    signals.some(function(sg) {
      return (sg.name === 'cursor') ? (def=sg, true) : false;
    });

    if (!def) signals.push(def={name: 'cursor', streams: []});

    // Add a stream def at the head, so that custom defs can override it.
    def.init = def.init || {};
    def.streams.unshift({
      type: 'mousemove',
      expr: 'eventItem().cursor === cursor.default ? cursor : {default: eventItem().cursor}'
    });
  }

  function done(err) {
    var view;
    if (err) {
      log.error(err);
    } else {
      view = viewFactory(model.buildIndexes());
    }

    if (cb) {
      if (cb.length > 1) cb(err, view);
      else if (!err) cb(view);
      cb = null;
    }
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
