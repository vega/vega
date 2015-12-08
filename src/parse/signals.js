var dl = require('datalib'),
    expr = require('./expr'),
    SIGNALS = require('vega-dataflow').Dependencies.SIGNALS;

var RESERVED = ['datum', 'event', 'signals', 'width', 'height', 'padding']
    .concat(dl.keys(expr.codegen.functions));

function parseSignals(model, spec) {
  // process each signal definition
  (spec || []).forEach(function(s) {
    if (RESERVED.indexOf(s.name) !== -1) {
      throw Error('Signal name "'+s.name+'" is a '+
        'reserved keyword ('+RESERVED.join(', ')+').');
    }

    var signal = model.signal(s.name, s.init)
      .verbose(s.verbose);

    if (s.init && s.init.expr) {
      s.init.expr = model.expr(s.init.expr);
      signal.value(exprVal(model, s.init));
    }

    if (s.expr) {
      s.expr = model.expr(s.expr);
      signal.evaluate = function(input) {
        var val = exprVal(model, s),
            sg  = input.signals;
        if (val !== signal.value() || signal.verbose()) {
          signal.value(val);
          sg[s.name] = 1;
        }
        return sg[s.name] ? input : model.doNotPropagate;
      };
      signal.dependency(SIGNALS, s.expr.globals);
      s.expr.globals.forEach(function(dep) {
        model.signal(dep).addListener(signal);
      });
    }
  });

  return spec;
}

function exprVal(model, spec) {
  var e = spec.expr, v = e.fn();
  return spec.scale ? parseSignals.scale(model, spec, v) : v;
}

parseSignals.scale = function scale(model, spec, value, datum, evt) {
  var def = spec.scale,
      name  = def.name || def.signal || def,
      scope = def.scope, e;

  if (scope) {
    if (scope.signal) {
      scope = model.signalRef(scope.signal);
    } else if (dl.isString(scope)) { // Scope is an expression
      e = def._expr = (def._expr || model.expr(scope));
      scope = e.fn(datum, evt);
    }
  }

  return expr.scale(model, def.invert, name, value, scope);
};

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
            "scope": {
              "oneOf": [
                {"$ref": "#/refs/signal"},
                {"type": "string"}
              ]
            },
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
          "not": {"enum": RESERVED}
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
