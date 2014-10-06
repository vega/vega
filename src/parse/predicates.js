define(function(require, exports, module) {
  var vg = require('vega');

  return function parsePredicate(model, spec) {
    var types = {
      '=':  parseComparator,
      '==': parseComparator,
      '!=': parseComparator,
      '>':  parseComparator,
      '>=': parseComparator,
      '<':  parseComparator,
      '<=': parseComparator,
      'and': parseLogical,
      '&&':  parseLogical,
      'or':  parseLogical,
      '||':  parseLogical
    };

    function parseSignal(signal, signals) {
      var s = vg.field(signal),
          code = "signals["+s.map(vg.str).join("][")+"]";
      signals[s.shift()] = 1;
      return code;
    };

    function parseOperands(spec) {
      var decl = [], defs = [],
          signals = {};

      (spec.operands || []).forEach(function(o, i) {
        var signal, name = "o"+i, def = "";
        
        if(o.value)       def = vg.str(o.value);
        else if(o.arg)    def = "args["+vg.str(o.arg)+"]";
        else if(o.signal) def = parseSignal(o.signal, signals);
        else if(o.predicate) {
          vg.keys(o.input).forEach(function(k) {
            var i = o.input[k], signal;
            def += "args["+vg.str(k)+"] = ";
            if(i.signal)   def += parseSignal(i.signal, signals);
            else if(i.arg) def += "args["+vg.str(i.arg)+"]";
            def+=", ";
          });

          def+= "predicates["+vg.str(o.predicate)+"](args, signals, predicates)";
          model.predicate(o.predicate).signals.forEach(function(s) {
            signals[s] = 1;
          });
        }

        decl.push(name);
        defs.push(name+"=("+def+")");
      });

      return {
        code: "var " + decl.join(", ") + ";\n" + defs.join(";\n") + ";\n",
        signals: vg.keys(signals)
      }
    };

    function parseComparator(spec) {
      if(spec.type == '=') spec.type = '==';
      return "return " + ["o0", "o1"].join(spec.type) + ";";
    };

    function parseLogical(spec) {
      if(spec.type == 'and') spec.type = '&&';
      else if(spec.type == 'or') spec.type = '||';
      return parseComparator(spec);
    };

    (spec || []).forEach(function(s) {
      var ops  = parseOperands(s),
          sg   = ops.signals, 
          code = ops.code + types[s.type](s);

      var pred = Function("args", "signals", "predicates", code);
      pred.signals = sg;
      model.predicate(s.name, pred);
    });

    return spec;
  }
});