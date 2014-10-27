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
      '||':  parseLogical,
      'in': parseIn
    };

    function parseSignal(signal, signals) {
      var s = vg.field(signal),
          code = "signals["+s.map(vg.str).join("][")+"]";
      signals[s.shift()] = 1;
      return code;
    };

    function parseOperands(operands) {
      var decl = [], defs = [],
          signals = {}, db = {};

      vg.array(operands).forEach(function(o, i) {
        var signal, name = "o"+i, def = "";
        
        if(o.value)       def = vg.str(o.value);
        else if(o.arg)    def = "args["+vg.str(o.arg)+"]";
        else if(o.signal) def = parseSignal(o.signal, signals);
        else if(o.predicate) {
          var pred = model.predicate(o.predicate);
          pred.signals.forEach(function(s) { signals[s] = 1; });
          pred.db.forEach(function(d) { db[d] = 1 });

          vg.keys(o.input).forEach(function(k) {
            var i = o.input[k], signal;
            def += "args["+vg.str(k)+"] = ";
            if(i.signal)   def += parseSignal(i.signal, signals);
            else if(i.arg) def += "args["+vg.str(i.arg)+"]";
            def+=", ";
          });

          def+= "predicates["+vg.str(o.predicate)+"](args, db, signals, predicates)";
        }

        decl.push(name);
        defs.push(name+"=("+def+")");
      });

      return {
        code: "var " + decl.join(", ") + ";\n" + defs.join(";\n") + ";\n",
        signals: vg.keys(signals),
        db: vg.keys(db)
      }
    };

    function parseComparator(spec) {
      var ops = parseOperands(spec.operands);
      if(spec.type == '=') spec.type = '==';

      return {
        code: ops.code + "return " + ["o0", "o1"].join(spec.type) + ";",
        signals: ops.signals,
        db: ops.db
      };
    };

    function parseLogical(spec) {
      var ops = parseOperands(spec.operands),
          o = [], i = 0;

      while(o.push("o"+i++)<spec.operands.length);
      if(spec.type == 'and') spec.type = '&&';
      else if(spec.type == 'or') spec.type = '||';

      return {
        code: ops.code + "return " + o.join(spec.type) + ";",
        signals: ops.signals,
        db: ops.db
      };
    };

    function parseIn(spec) {
      var o = [spec.item];
      if(spec.range) o.push.apply(o, spec.range);
      if(spec.scale) o.push(spec.scale);

      var ops = parseOperands(o),
          code = ops.code;

      if(spec.data) code += "return db["+vg.str(spec.data)+"].indexOf(o1) !== -1";
      else if(spec.range) {
        // TODO: inclusive/exclusive range?
        // TODO: inverting ordinal scales
        if(spec.scale) code += "o1 = o3.invert(o1);\no2 = o3.invert(o2);\n";
        code += "return o1 < o2 ? o1 <= o0 && o0 <= o2 : o2 <= o0 && o0 <= o1";
      }

      return {
        code: code, 
        signals: ops.signals, 
        db: ops.db.concat(spec.data ? [spec.data] : [])
      };
    };

    (spec || []).forEach(function(s) {
      var parse = types[s.type](s),
          pred = Function("args", "db", "signals", "predicates", parse.code);
      console.log(s.name, parse.code);
      pred.signals = parse.signals;
      pred.db = parse.db;
      model.predicate(s.name, pred);
    });

    return spec;
  }
});