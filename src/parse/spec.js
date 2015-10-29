var dl = require('datalib'),
    log = require('vega-logging'),
    Model = require('../core/Model'),
    View = require('../core/View');

/**
 * Backward compatibility wrapper that accepts callback without error handler
 * @param spec
 * @param callback
 * @param config (optional)
 * @param viewFactory (optional)
 * @returns {*}
 */
function parseSpec(spec, callback) {
  var cb = callback;
  arguments[1] = function(err, model) {
    // For backward compatibility, the error is thrown even though it might never be caught
    if (err) throw err;
    cb(model);
  };
  return module.exports.parse.apply(this, arguments);
}

module.exports = parseSpec;

parseSpec.parse = function (spec, callback /* config */  /* viewFactory */) {
  var vf = arguments[arguments.length-1],
      viewFactory = arguments.length > 2 && dl.isFunction(vf) ? vf : View.factory,
      config = arguments[2] !== viewFactory ? arguments[2] : {},
      model = new Model(config);

  function parse(spec) {
    // protect against subsequent spec modification
    spec = dl.duplicate(spec);

    var parsers = require('./'),
        width = spec.width || 500,
        height = spec.height || 500,
        viewport = spec.viewport || null;

    model.defs({
      width: width,
      height: height,
      viewport: viewport,
      background: parsers.background(spec.background),
      padding: parsers.padding(spec.padding),
      signals: parsers.signals(model, spec.signals),
      predicates: parsers.predicates(model, spec.predicates),
      marks: parsers.marks(model, spec, width, height),
      data: parsers.data(model, spec.data, function() {
        if (callback) callback(undefined, viewFactory(model));
      })
    });
  }

  if (dl.isObject(spec)) {
    parse(spec);
  } else if (dl.isString(spec)) {
    var opts = dl.extend({url: spec}, model.config().load);
    dl.load(opts, function(err, data) {
      try {
        if (err) {
          log.error('LOADING SPECIFICATION FAILED: ' + err.statusText);
        } else {
          try {
            parse(JSON.parse(data));
          } catch (e) {
            log.error('INVALID SPECIFICATION: Must be a valid JSON object. ' + e);
          }
        }
      } catch (err) {
        if (callback) callback(err);
        callback = false;
      }
    });
  } else {
    try {
      log.error('INVALID SPECIFICATION: Must be a valid JSON object or URL.');
    } catch (err) {
      if (callback) callback(err);
      callback = false;
    }
  }
};

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
