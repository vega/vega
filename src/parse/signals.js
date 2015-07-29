var dl = require('datalib'),
    Deps = require('vega-dataflow').Dependencies,
    expr = require('./expr');

var RESERVED = ['datum', 'event', 'signals']
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
      s.init.expr = expr(s.init.expr);
      signal.value(exprVal(model, s.init));
    }

    if (s.expr) {
      s.expr = expr(s.expr);
      signal.evaluate = function(input) {
        var val = exprVal(model, s);
        if (val !== signal.value() || signal.verbose()) {
          signal.value(val);
          input.signals[s.name] = 1;
          return input;
        }
        return model.doNotPropagate;        
      };
      signal.dependency(Deps.SIGNALS, s.expr.globals);
      s.expr.globals.forEach(function(dep) {
        model.signal(dep).addListener(signal);
      });
    }
  });

  return spec;
}

function exprVal(model, spec) {
  var e = spec.expr,
      val = e.fn(null, null, model.signalValues(e.globals));
  return spec.scale ? parseSignals.scale(model, spec, val) : val;
}

parseSignals.scale = function scale(model, spec, value, datum, evt) {
  var def = spec.scale,
      name  = def.name || def.signal || def,
      scope = def.scope, e;

  if (scope) {
    if (scope.signal) {
      scope = model.signalRef(scope.signal);
    } else if (dl.isString(scope)) { // Scope is an expression
      e = def._expr = (def._expr || expr(scope));
      scope = e.fn(datum, evt, model.signalValues(e.globals));
    }
  }

  if (!scope || !scope.scale) {
    scope = (scope && scope.mark) ? scope.mark.group : model.scene().items[0];
  }

  var s = scope.scale(name);
  return !s ? value : (def.invert ? s.invert(value) : s(value));
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