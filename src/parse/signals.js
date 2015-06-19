var util = require('datalib/src/util'),
    expr = require('./expr'),
    functions = require('vega-expression/src/functions')(),
    C = require('../util/constants');

function parseSignals(model, spec) {
  // process each signal definition
  (spec || []).forEach(function(s) {
    var signal = model.signal(s.name, s.init)
      .verbose(s.verbose);

    if (s.init && s.init.expr) {
      s.init.expr = expr(s.init.expr);
      signal.value(exprVal(model, s.init));
    }

    if (s.expr) {
      s.expr = expr(s.expr);
      signal.evaluate = function(input) {
        var val = exprVal(model, s, signal.value());
        if (val !== signal.value() || signal.verbose()) {
          signal.value(val);
          input.signals[s.name] = 1;
          return input;
        }
        return model.doNotPropagate;        
      };
      signal.dependency(C.SIGNALS, s.expr.globals);
      s.expr.globals.forEach(function(dep) {
        model.signal(dep).addListener(signal);
      });
    }
  });

  return spec;
};

function exprVal(model, spec, currentValue) {
  var e = spec.expr,
      val = expr.eval(model, e.fn, {signals: e.globals});
  return spec.scale ? parseSignals.scale(model, spec, val) : val;
}

parseSignals.scale = function scale(model, spec, value) {
  var def = spec.scale,
      name  = def.name || def.signal || def,
      scope = def.scope ? model.signalRef(def.scope.signal) : null;

  if (!scope || !scope.scale) {
    scope = (scope && scope.mark) ? scope.mark.group : model.scene().items[0];
  }

  var scale = scope.scale(name);
  if (!scale) return value;
  return def.invert ? scale.invert(value) : scale(value);
}

module.exports = parseSignals;
parseSignals.schema = {
  "refs": {
    "signal": {
      "title": "SignalRef",
      "type": "object",
      "properties": {"signal": {"type": "string"}},
      "required": ["signal"]
    },

    "scopedScale": {
      "oneOf": [
        {"type": "string"},
        {
          "type": "object",
          "properties": {
            "name": {
              "oneOf": [{"$ref": "#/refs/signal"}, {"type": "string"}]
            },
            "scope": {"$ref": "#/refs/signal"},
            "invert": {"type": "boolean", "default": false}
          },

          "additionalProperties": false,
          "required": ["name"]
        }
      ]
    }
  },

  "defs": {
    "signal": {
      "type": "object",

      "properties": {
        "name": {
          "type": "string",
          "not": {"enum": ["datum", "event"].concat(util.keys(functions))}
        },
        "init": {},
        "verbose": {"type": "boolean", "default": false},
        "expr": {"type": "string"},
        "scale": {"$ref": "#/refs/scopedScale"},
        "streams": {"$ref": "#/defs/streams"}
      },

      "additionalProperties": false,
      "required": ["name"]
    }
  }
};