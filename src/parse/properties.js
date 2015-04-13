var d3 = require('d3'),
    tuple = require('../dataflow/tuple'),
    util = require('../util/index'),
    config = require('../util/config');

function compile(model, mark, spec) {
  var code = "",
      names = util.keys(spec),
      i, len, name, ref, vars = {}, 
      deps = {
        signals: {},
        scales: {},
        data: {}
      };
      
  code += "var o = trans ? {} : item;\n"
  
  for (i=0, len=names.length; i<len; ++i) {
    ref = spec[name = names[i]];
    code += (i > 0) ? "\n  " : "  ";
    if(ref.rule) {
      ref = rule(model, name, ref.rule);
      code += "\n  " + ref.code
    } else {
      ref = valueRef(name, ref);
      code += "this.tpl.set(o, "+util.str(name)+", "+ref.val+");";
    }

    vars[name] = true;
    ['signals', 'scales', 'data'].forEach(function(p) {
      if(ref[p] != null) util.array(ref[p]).forEach(function(k) { deps[p][k] = 1 });
    });
  }

  if (vars.x2) {
    if (vars.x) {
      code += "\n  if (o.x > o.x2) { "
            + "var t = o.x;"
            + "this.tpl.set(o, 'x', o.x2);"
            + "this.tpl.set(o, 'x2', t); "
            + "};";
      code += "\n  this.tpl.set(o, 'width', (o.x2 - o.x));";
    } else if (vars.width) {
      code += "\n  this.tpl.set(o, 'x', (o.x2 - o.width));";
    } else {
      code += "\n  this.tpl.set(o, 'x', o.x2);"
    }
  }

  if (vars.y2) {
    if (vars.y) {
      code += "\n  if (o.y > o.y2) { "
            + "var t = o.y;"
            + "this.tpl.set(o, 'y', o.y2);"
            + "this.tpl.set(o, 'y2', t);"
            + "};";
      code += "\n  this.tpl.set(o, 'height', (o.y2 - o.y));";
    } else if (vars.height) {
      code += "\n  this.tpl.set(o, 'y', (o.y2 - o.height));";
    } else {
      code += "\n  this.tpl.set(o, 'y', o.y2);"
    }
  }
  
  if (hasPath(mark, vars)) code += "\n  item.touch();";
  code += "\n  if (trans) trans.interpolate(item, o);";

  try {
    var encoder = Function("item", "group", "trans", "db", 
      "signals", "predicates", code);
    encoder.tpl  = tuple;
    encoder.util = util;
    encoder.d3   = d3; // For color spaces
    return {
      encode: encoder,
      signals: util.keys(deps.signals),
      scales: util.keys(deps.scales),
      data: util.keys(deps.data)
    }
  } catch (e) {
    util.error(e);
    util.log(code);
  }
}

function hasPath(mark, vars) {
  return vars.path ||
    ((mark==="area" || mark==="line") &&
      (vars.x || vars.x2 || vars.width ||
       vars.y || vars.y2 || vars.height ||
       vars.tension || vars.interpolate));
}

var GROUP_VARS = {
  "width": 1,
  "height": 1,
  "mark.group.width": 1,
  "mark.group.height": 1
};

function rule(model, name, rules) {
  var signals = [], scales = [], db = [],
      inputs = [], code = "";

  (rules||[]).forEach(function(r, i) {
    var predName = r.predicate,
        pred = model.predicate(predName),
        input = [], args = name+"_arg"+i,
        ref;

    util.keys(r.input).forEach(function(k) {
      var ref = valueRef(i, r.input[k]);
      input.push(util.str(k)+": "+ref.val);
      if(ref.signals) signals.push.apply(signals, util.array(ref.signals));
      if(ref.scales)  scales.push.apply(scales, util.array(ref.scales));
    });

    ref = valueRef(name, r);
    if(ref.signals) signals.push.apply(signals, util.array(ref.signals));
    if(ref.scales)  scales.push.apply(scales, util.array(ref.scales));

    if(predName) {
      signals.push.apply(signals, pred.signals);
      db.push.apply(db, pred.data);
      inputs.push(args+" = {"+input.join(', ')+"}");
      code += "if(predicates["+util.str(predName)+"]("+args+", db, signals, predicates)) {\n" +
        "    this.tpl.set(o, "+util.str(name)+", "+ref.val+");\n";
      code += rules[i+1] ? "  } else " : "  }";
    } else {
      code += "{\n" + 
        "    this.tpl.set(o, "+util.str(name)+", "+ref.val+");\n"+
        "  }";
    }
  });

  code = "var " + inputs.join(",\n      ") + ";\n  " + code;
  return {code: code, signals: signals, scales: scales, data: db};
}

function valueRef(name, ref) {
  if (ref == null) return null;
  var isColor = name==="fill" || name==="stroke";
  var signals = [];

  if (isColor) {
    if (ref.c) {
      return colorRef("hcl", ref.h, ref.c, ref.l);
    } else if (ref.h || ref.s) {
      return colorRef("hsl", ref.h, ref.s, ref.l);
    } else if (ref.l || ref.a) {
      return colorRef("lab", ref.l, ref.a, ref.b);
    } else if (ref.r || ref.g || ref.b) {
      return colorRef("rgb", ref.r, ref.g, ref.b);
    }
  }

  // initialize value
  var val = null, signalRef = null;
  if (ref.value !== undefined) {
    val = util.str(ref.value);
  }

  if (ref.signal !== undefined) {
    signalRef = util.field(ref.signal);
    val = "signals["+signalRef.map(util.str).join("][")+"]"; 
    signals.push(signalRef.shift());
  }

  // get field reference for enclosing group
  if (ref.group != null) {
    var grp = "group.datum";
    if (util.isString(ref.group)) {
      grp = GROUP_VARS[ref.group]
        ? "group." + ref.group
        : "group.datum["+util.field(ref.group).map(util.str).join("][")+"]";
    }
  }

  // get data field value
  if (ref.field != null) {
    if (util.isString(ref.field)) {
      val = "item.datum["+util.field(ref.field).map(util.str).join("][")+"]";
      if (ref.group != null) { val = "this.util.accessor("+val+")("+grp+")"; }
    } else if(ref.field.signal) {
      signalRef = util.field(ref.field.signal);
      val = "item.datum[signals["+signalRef.map(util.str).join("][")+"]]";
      if (ref.group != null) { val = "this.util.accessor("+val+")("+grp+")"; }
      signals.push(signalRef.shift());
    } else {
      val = "this.util.accessor(group.datum["
          + util.field(ref.field.group).map(util.str).join("][")
          + "])(item.datum)";
    }
  } else if (ref.group != null) {
    val = grp;
  }

  if (ref.scale != null) {
    var scale = null;
    if(util.isString(ref.scale)) {
      scale = util.str(ref.scale);
    } else if(ref.scale.signal) {
      signalRef = util.field(ref.scale.signal);
      scale = "signals["+signalRef.map(util.str).join("][")+"]";
      signals.push(signalRef.shift());
    } else {
      scale = (ref.scale.group ? "group" : "item")
        + ".datum[" + util.str(ref.scale.group || ref.scale.field) + "]";
    }

    scale = "group.scale(" + scale + ")";
    if(ref.invert) scale += ".invert";  // TODO: ordinal scales

    // run through scale function if val specified.
    // if no val, scale function is predicate arg.
    if(val !== null || ref.band || ref.mult || ref.offset) {
      val = scale + (ref.band ? ".rangeBand()" : 
        "("+(val !== null ? val : "item.datum.data")+")");
    } else {
      val = scale;
    }
  }
  
  // multiply, offset, return value
  val = "(" + (ref.mult?(util.number(ref.mult)+" * "):"") + val + ")"
    + (ref.offset ? " + " + util.number(ref.offset) : "");
  return {val: val, signals: signals, scales: ref.scale};
}

function colorRef(type, x, y, z) {
  var xx = x ? valueRef("", x) : config.color[type][0],
      yy = y ? valueRef("", y) : config.color[type][1],
      zz = z ? valueRef("", z) : config.color[type][2]
      signals = [], scales = [];

  [xx, yy, zz].forEach(function(v) {
    if(v.signals) signals.push.apply(signals, v.signals);
    if(v.scales)  scales.push(v.scales);
  });

  return {
    val: "(this.d3." + type + "(" + [xx.val, yy.val, zz.val].join(",") + ') + "")',
    signals: signals,
    scales: scales
  };
}

module.exports = compile;