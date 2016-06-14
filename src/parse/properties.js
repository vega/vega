var d3 = require('d3'),
    dl = require('datalib'),
    log = require('vega-logging'),
    Tuple = require('vega-dataflow').Tuple;

var DEPS = ["signals", "scales", "data", "fields"];

function properties(model, mark, spec) {
  var config = model.config(),
      code = "",
      names = dl.keys(spec),
      exprs = [], // parsed expressions injected in the generated code
      i, len, name, ref, vars = {},
      deps = {
        signals: {},
        scales:  {},
        data:    {},
        fields:  {},
        nested:  [],
        _nRefs:  {},  // Temp stash to de-dupe nested refs.
        reflow:  false
      };

  code += "var o = trans ? {} : item, d=0, exprs=this.exprs, set=this.tpl.set, tmpl=signals||{}, t;\n" +
          // Stash for dl.template
          "tmpl.datum  = item.datum;\n" +
          "tmpl.group  = group;\n" +
          "tmpl.parent = group.datum;\n";

  function handleDep(p) {
    if (ref[p] == null) return;
    var k = dl.array(ref[p]), i, n;
    for (i=0, n=k.length; i<n; ++i) {
      deps[p][k[i]] = 1;
    }
  }

  function handleNestedRefs(r) {
    var k = (r.parent ? "parent_" : "group_")+r.level;
    deps._nRefs[k] = r;
  }

  parseShape(model, config, spec);

  for (i=0, len=names.length; i<len; ++i) {
    ref = spec[name = names[i]];
    code += (i > 0) ? "\n  " : "  ";
    if (ref.rule) {
      // a production rule valueref
      ref = rule(model, name, ref.rule, exprs);
      code += "\n  " + ref.code;
    } else if (dl.isArray(ref)) {
      // a production rule valueref as an array
      ref = rule(model, name, ref, exprs);
      code += "\n  " + ref.code;
    } else {
      // a simple valueref
      ref = valueRef(config, name, ref);
      code += "d += set(o, "+dl.str(name)+", "+ref.val+");";
    }

    vars[name] = true;
    DEPS.forEach(handleDep);
    deps.reflow = deps.reflow || ref.reflow;
    if (ref.nested.length) ref.nested.forEach(handleNestedRefs);
  }

  // If nested references are present, sort them based on their level
  // to speed up determination of whether encoders should be reeval'd.
  dl.keys(deps._nRefs).forEach(function(k) { deps.nested.push(deps._nRefs[k]); });
  deps.nested.sort(function(a, b) {
    a = a.level;
    b = b.level;
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  });

  if (vars.x2) {
    if (vars.x) {
      code += "\n  if (o.x > o.x2) { " +
              "\n    t = o.x;" +
              "\n    d += set(o, 'x', o.x2);" +
              "\n    d += set(o, 'x2', t); " +
              "\n  };";
      code += "\n  d += set(o, 'width', (o.x2 - o.x));";
    } else if (vars.width) {
      code += "\n  d += set(o, 'x', (o.x2 - o.width));";
    } else {
      code += "\n  d += set(o, 'x', o.x2);";
    }
  }

  if (vars.xc) {
    if (vars.width) {
      code += "\n  d += set(o, 'x', (o.xc - o.width/2));" ;
    } else {
      code += "\n  d += set(o, 'x', o.xc);" ;
    }
  }

  if (vars.y2) {
    if (vars.y) {
      code += "\n  if (o.y > o.y2) { " +
              "\n    t = o.y;" +
              "\n    d += set(o, 'y', o.y2);" +
              "\n    d += set(o, 'y2', t);" +
              "\n  };";
      code += "\n  d += set(o, 'height', (o.y2 - o.y));";
    } else if (vars.height) {
      code += "\n  d += set(o, 'y', (o.y2 - o.height));";
    } else {
      code += "\n  d += set(o, 'y', o.y2);";
    }
  }

  if (vars.yc) {
    if (vars.height) {
      code += "\n  d += set(o, 'y', (o.yc - o.height/2));" ;
    } else {
      code += "\n  d += set(o, 'y', o.yc);" ;
    }
  }

  if (hasPath(mark, vars)) code += "\n  d += (item.touch(), 1);";
  code += "\n  if (trans) trans.interpolate(item, o);";
  code += "\n  return d > 0;";

  try {
    /* jshint evil:true */
    var encoder = Function('item', 'group', 'trans', 'db',
      'signals', 'predicates', code);

    encoder.tpl  = Tuple;
    encoder.exprs = exprs;
    encoder.util = dl;
    encoder.d3   = d3; // For color spaces
    dl.extend(encoder, dl.template.context);
    return {
      encode:  encoder,
      signals: dl.keys(deps.signals),
      scales:  dl.keys(deps.scales),
      data:    dl.keys(deps.data),
      fields:  dl.keys(deps.fields),
      nested:  deps.nested,
      reflow:  deps.reflow
    };
  } catch (e) {
    log.error(e);
    log.log(code);
  }
}

function dependencies(a, b) {
  if (!dl.isObject(a)) {
    a = {reflow: false, nested: []};
    DEPS.forEach(function(d) { a[d] = []; });
  }

  if (dl.isObject(b)) {
    a.reflow = a.reflow || b.reflow;
    a.nested.push.apply(a.nested, b.nested);
    DEPS.forEach(function(d) { a[d].push.apply(a[d], b[d]); });
  }

  return a;
}

function hasPath(mark, vars) {
  return vars.path ||
    ((mark==='area' || mark==='line') &&
      (vars.x || vars.x2 || vars.width ||
       vars.y || vars.y2 || vars.height ||
       vars.tension || vars.interpolate));
}

var hb = /{{(.*?)}}/g;
function parseShape(model, config, spec) {
  var shape = spec.shape,
      last = 0,
      value, match;

  if (shape && (value = shape.value)) {
    if (config.shape && config.shape[value]) {
      value = config.shape[value];
    }

    // Parse handlebars
    shape = '';
    while ((match = hb.exec(value)) !== null) {
      shape += value.substring(last, match.index);
      shape += model.expr(match[1]).fn();
      last = hb.lastIndex;
    }
    spec.shape.value = shape + value.substring(last);
  }
}

function rule(model, name, rules, exprs) {
  var config  = model.config(),
      deps = dependencies(),
      inputs  = [],
      code = '';

  (rules||[]).forEach(function(r, i) {
    var ref = valueRef(config, name, r);
    dependencies(deps, ref);

    if (r.test) {
      // rule uses an expression instead of a predicate.
      var exprFn = model.expr(r.test);
      deps.signals.push.apply(deps.signals, exprFn.globals);
      deps.data.push.apply(deps.data, exprFn.dataSources);

      code += "if (exprs[" + exprs.length + "](item.datum, item.mark.group.datum, null)) {" +
          "\n    d += set(o, "+dl.str(name)+", " +ref.val+");";
      code += rules[i+1] ? "\n  } else " : "  }";

      exprs.push(exprFn.fn);
    } else {
      var def = r.predicate,
          predName = def && (def.name || def),
          pred = model.predicate(predName),
          p = 'predicates['+dl.str(predName)+']',
          input = [], args = name+'_arg'+i;

      if (dl.isObject(def)) {
        dl.keys(def).forEach(function(k) {
          if (k === 'name') return;
          var ref = valueRef(config, i, def[k], true);
          input.push(dl.str(k)+': '+ref.val);
          dependencies(deps, ref);
        });
      }

      if (predName) {
        // append the predicates dependencies to our dependencies
        deps.signals.push.apply(deps.signals, pred.signals);
        deps.data.push.apply(deps.data, pred.data);
        inputs.push(args+" = {\n    "+input.join(",\n    ")+"\n  }");
        code += "if ("+p+".call("+p+","+args+", db, signals, predicates)) {" +
          "\n    d += set(o, "+dl.str(name)+", "+ref.val+");";
        code += rules[i+1] ? "\n  } else " : "  }";
      } else {
        code += "{" +
          "\n    d += set(o, "+dl.str(name)+", "+ref.val+");"+
          "\n  }\n";
      }
    }
  });

  if (inputs.length) code = "var " + inputs.join(",\n      ") + ";\n  " + code;
  return (deps.code = code, deps);
}

function valueRef(config, name, ref, predicateArg) {
  if (ref == null) return null;

  if (name==='fill' || name==='stroke') {
    if (ref.c) {
      return colorRef(config, 'hcl', ref.h, ref.c, ref.l);
    } else if (ref.h || ref.s) {
      return colorRef(config, 'hsl', ref.h, ref.s, ref.l);
    } else if (ref.l || ref.a) {
      return colorRef(config, 'lab', ref.l, ref.a, ref.b);
    } else if (ref.r || ref.g || ref.b) {
      return colorRef(config, 'rgb', ref.r, ref.g, ref.b);
    }
  }

  // initialize value
  var val = null, scale = null,
      deps = dependencies(),
      sgRef = null, fRef = null, sRef = null, tmpl = {};

  if (ref.template !== undefined) {
    val = dl.template.source(ref.template, 'tmpl', tmpl);
    dl.keys(tmpl).forEach(function(k) {
      var f = dl.field(k),
          a = f.shift();
      if (a === 'parent' || a === 'group') {
        deps.nested.push({
          parent: a === 'parent',
          group:  a === 'group',
          level:  1
        });
      } else if (a === 'datum') {
        deps.fields.push(f[0]);
      } else {
        deps.signals.push(a);
      }
    });
  }

  if (ref.value !== undefined) {
    val = dl.str(ref.value);
  }

  if (ref.signal !== undefined) {
    sgRef = dl.field(ref.signal);
    val = 'signals['+sgRef.map(dl.str).join('][')+']';
    deps.signals.push(sgRef.shift());
  }

  if (ref.field !== undefined) {
    ref.field = dl.isString(ref.field) ? {datum: ref.field} : ref.field;
    fRef = fieldRef(ref.field);
    val  = fRef.val;
    dependencies(deps, fRef);
  }

  if (ref.scale !== undefined) {
    sRef  = scaleRef(ref.scale);
    scale = sRef.val;
    dependencies(deps, sRef);
    deps.scales.push(ref.scale.name || ref.scale);

    // run through scale function if val specified.
    // if no val, scale function is predicate arg.
    if (val !== null || ref.band || ref.mult || ref.offset || !predicateArg) {
      val = scale + (ref.band ? '.rangeBand()' :
        '('+(val !== null ? val : 'item.datum.data')+')');
    } else if (predicateArg) {
      val = scale;
    }
  }

  // multiply, offset, return value
  val = '(' + (ref.mult?(dl.number(ref.mult)+' * '):'') + val + ')' +
        (ref.offset ? ' + ' + dl.number(ref.offset) : '');

  // Collate dependencies
  return (deps.val = val, deps);
}

function colorRef(config, type, x, y, z) {
  var xx = x ? valueRef(config, '', x) : config.color[type][0],
      yy = y ? valueRef(config, '', y) : config.color[type][1],
      zz = z ? valueRef(config, '', z) : config.color[type][2],
      deps = dependencies();

  [xx, yy, zz].forEach(function(v) {
    if (dl.isArray) return;
    dependencies(deps, v);
  });

  var val = '(this.d3.' + type + '(' + [xx.val, yy.val, zz.val].join(',') + ') + "")';
  return (deps.val = val, deps);
}

// {field: {datum: "foo"} }  -> item.datum.foo
// {field: {group: "foo"} }  -> group.foo
// {field: {parent: "foo"} } -> group.datum.foo
function fieldRef(ref) {
  if (dl.isString(ref)) {
    return {val: dl.field(ref).map(dl.str).join('][')};
  }

  // Resolve nesting/parent lookups
  var l = ref.level || 1,
      nested = (ref.group || ref.parent) && l,
      scope = nested ? Array(l).join('group.mark.') : '',
      r = fieldRef(ref.datum || ref.group || ref.parent || ref.signal),
      val = r.val,
      deps = dependencies(null, r);

  if (ref.datum) {
    val = 'item.datum['+val+']';
    deps.fields.push(ref.datum);
  } else if (ref.group) {
    val = scope+'group['+val+']';
    deps.nested.push({ level: l, group: true });
  } else if (ref.parent) {
    val = scope+'group.datum['+val+']';
    deps.nested.push({ level: l, parent: true });
  } else if (ref.signal) {
    val = 'signals['+val+']';
    deps.signals.push(dl.field(ref.signal)[0]);
    deps.reflow = true;
  }

  return (deps.val = val, deps);
}

// {scale: "x"}
// {scale: {name: "x"}},
// {scale: fieldRef}
function scaleRef(ref) {
  var scale = null,
      fr = null,
      deps = dependencies();

  if (dl.isString(ref)) {
    scale = dl.str(ref);
  } else if (ref.name) {
    scale = dl.isString(ref.name) ? dl.str(ref.name) : (fr = fieldRef(ref.name)).val;
  } else {
    scale = (fr = fieldRef(ref)).val;
  }

  scale = '(item.mark._scaleRefs['+scale+'] = 1, group.scale('+scale+'))';
  if (ref.invert) scale += '.invert';

  // Mark scale refs as they're dealt with separately in mark._scaleRefs.
  if (fr) fr.nested.forEach(function(g) { g.scale = true; });
  return fr ? (fr.val = scale, fr) : (deps.val = scale, deps);
}

module.exports = properties;

function valueSchema(type) {
  type = dl.isArray(type) ? {"enum": type} : {"type": type};
  var modType = type.type === "number" && type.type || "string";
  var valRef  = {
    "type": "object",
    "allOf": [{"$ref": "#/refs/" + modType + "Modifiers"}, {
      "oneOf": [{
        "$ref": "#/refs/signal",
        "required": ["signal"]
      }, {
        "properties": {"value": type},
        "required": ["value"]
      }, {
        "properties": {"field": {"$ref": "#/refs/field"}},
        "required": ["field"]
      }, {
        "properties": {"band": {"type": "boolean"}},
        "required": ["band"]
      }]
    }]
  };

  if (type.type === "string") {
    valRef.allOf[1].oneOf.push({
      "properties": {"template": {"type": "string"}},
      "required": ["template"]
    });
  }

  return {
    "oneOf": [{
      "type": "object",
      "properties": {
        "rule": {
          "type": "array",
          "items": {
            "allOf": [{"$ref": "#/defs/rule"}, valRef]
          }
        }
      },
      "additionalProperties": false,
      "required": ["rule"]
    },
    {
      "type": "array",
      "items": {
        "allOf": [{"$ref": "#/defs/rule"}, valRef]
      }
    },
    valRef]
  };
}

properties.schema = {
  "refs": {
    "field": {
      "title": "FieldRef",
      "oneOf": [
        {"type": "string"},
        {
          "oneOf": [
            {"$ref": "#/refs/signal"},
            {
              "type": "object",
              "properties": {"datum": {"$ref": "#/refs/field"}},
              "required": ["datum"],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {
                "group": {"$ref": "#/refs/field"},
                "level": {"type": "number"}
              },
              "required": ["group"],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {
                "parent": {"$ref": "#/refs/field"},
                "level": {"type": "number"}
              },
              "required": ["parent"],
              "additionalProperties": false
            }
          ]
        }
      ]
    },

    "scale": {
      "title": "ScaleRef",
      "oneOf": [
        {"$ref": "#/refs/field"},
        {
          "type": "object",
          "properties": {
            "name": {"$ref": "#/refs/field"},
            "invert": {"type": "boolean", "default": false}
          },
          "required": ["name"]
        }
      ]
    },

    "stringModifiers": {
      "properties": {
        "scale": {"$ref": "#/refs/scale"}
      }
    },

    "numberModifiers": {
      "properties": {
        "mult": {"type": "number"},
        "offset": {"type": "number"},
        "scale": {"$ref": "#/refs/scale"}
      }
    },

    "value": valueSchema({}, "value"),
    "numberValue": valueSchema("number", "numberValue"),
    "stringValue": valueSchema("string", "stringValue"),
    "booleanValue": valueSchema("boolean", "booleanValue"),
    "arrayValue": valueSchema("array", "arrayValue"),

    "colorValue": {
      "title": "ColorRef",
      "oneOf": [{"$ref": "#/refs/stringValue"}, {
        "type": "object",
        "properties": {
          "r": {"$ref": "#/refs/numberValue"},
          "g": {"$ref": "#/refs/numberValue"},
          "b": {"$ref": "#/refs/numberValue"}
        },
        "required": ["r", "g", "b"]
      }, {
        "type": "object",
        "properties": {
          "h": {"$ref": "#/refs/numberValue"},
          "s": {"$ref": "#/refs/numberValue"},
          "l": {"$ref": "#/refs/numberValue"}
        },
        "required": ["h", "s", "l"]
      }, {
        "type": "object",
        "properties": {
          "l": {"$ref": "#/refs/numberValue"},
          "a": {"$ref": "#/refs/numberValue"},
          "b": {"$ref": "#/refs/numberValue"}
        },
        "required": ["l", "a", "b"]
      }, {
        "type": "object",
        "properties": {
          "h": {"$ref": "#/refs/numberValue"},
          "c": {"$ref": "#/refs/numberValue"},
          "l": {"$ref": "#/refs/numberValue"}
        },
        "required": ["h", "c", "l"]
      }]
    }
  },

  "defs": {
    "rule": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "predicate": {
              "oneOf": [
                {"type": "string"},
                {
                  "type": "object",
                  "properties": {"name": { "type": "string" }},
                  "required": ["name"]
                }
              ]
            }
          }
        },
        {
          "type": "object",
          "properties": {"test": {"type": "string"}}
        }
      ]
    },
    "propset": {
      "title": "Mark property set",
      "type": "object",
      "properties": {
        // Common Properties
        "x": {"$ref": "#/refs/numberValue"},
        "x2": {"$ref": "#/refs/numberValue"},
        "xc": {"$ref": "#/refs/numberValue"},
        "width": {"$ref": "#/refs/numberValue"},
        "y": {"$ref": "#/refs/numberValue"},
        "y2": {"$ref": "#/refs/numberValue"},
        "yc": {"$ref": "#/refs/numberValue"},
        "height": {"$ref": "#/refs/numberValue"},
        "opacity": {"$ref": "#/refs/numberValue"},
        "fill": {"$ref": "#/refs/colorValue"},
        "fillOpacity": {"$ref": "#/refs/numberValue"},
        "stroke": {"$ref": "#/refs/colorValue"},
        "strokeWidth": {"$ref": "#/refs/numberValue"},
        "strokeOpacity": {"$ref": "#/refs/numberValue"},
        "strokeDash": {"$ref": "#/refs/arrayValue"},
        "strokeDashOffset": {"$ref": "#/refs/numberValue"},
        "cursor": {"$ref": "#/refs/stringValue"},

        // Group-mark properties
        "clip": {"$ref": "#/refs/booleanValue"},

        // Symbol-mark properties
        "size": {"$ref": "#/refs/numberValue"},
        "shape": {
          "anyOf": [
            valueSchema(["circle", "square", "cross", "diamond",
              "triangle-up", "triangle-down"]),
            {"$ref": "#/refs/stringValue"}
          ]
        },

        // Path-mark properties
        "path": {"$ref": "#/refs/stringValue"},

        // Arc-mark properties
        "innerRadius": {"$ref": "#/refs/numberValue"},
        "outerRadius": {"$ref": "#/refs/numberValue"},
        "startAngle": {"$ref": "#/refs/numberValue"},
        "endAngle": {"$ref": "#/refs/numberValue"},

        // Area- and line-mark properties
        "interpolate": valueSchema(["linear", "linear-closed",
          "step", "step-before", "step-after",
          "basis", "basis-open", "basis-closed", 
          "cardinal", "cardinal-open", "cardinal-closed",
          "bundle", "monotone"]),
        "tension": {"$ref": "#/refs/numberValue"},
        "orient": valueSchema(["horizontal", "vertical"]),

        // Image-mark properties
        "url": {"$ref": "#/refs/stringValue"},
        "align": valueSchema(["left", "right", "center"]),
        "baseline": valueSchema(["top", "middle", "bottom", "alphabetic"]),

        // Text-mark properties
        "text": {"$ref": "#/refs/stringValue"},
        "dx": {"$ref": "#/refs/numberValue"},
        "dy": {"$ref": "#/refs/numberValue"},
        "radius":{"$ref": "#/refs/numberValue"},
        "theta": {"$ref": "#/refs/numberValue"},
        "angle": {"$ref": "#/refs/numberValue"},
        "font": {"$ref": "#/refs/stringValue"},
        "fontSize": {"$ref": "#/refs/numberValue"},
        "fontWeight": {"$ref": "#/refs/stringValue"},
        "fontStyle": {"$ref": "#/refs/stringValue"}
      },

      "additionalProperties": false
    }
  }
};
