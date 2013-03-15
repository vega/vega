vg.parse.properties = (function() {
  function compile(spec) {
    var code = "",
        names = vg.keys(spec),
        i, len, name, ref, vars = {};
        
    code += "var o = trans ? {} : item;\n"
    
    for (i=0, len=names.length; i<len; ++i) {
      ref = spec[name = names[i]];
      code += (i > 0) ? "\n  " : "  ";
      code += "o."+name+" = "+valueRef(ref)+";";
      vars[name] = true;
    }
    
    if (vars.x2) {
      code += "\n  if (o.x > o.x2) { "
            + "var t = o.x; o.x = o.x2; o.x2 = t; };"
      code += "\n  o.width = (o.x2 - o.x);"
    }
    
    if (vars.y2) {
      code += "\n  if (o.y > o.y2) { "
            + "var t = o.y; o.y = o.y2; o.y2 = t; };"
      code += "\n  o.height = (o.y2 - o.y);"
    }
    
    code += "if (trans) trans.interpolate(item, o);";

    return Function("item", "group", "trans", code);
  }

  // TODO security check for strings emitted into code
  function valueRef(ref) {
    if (ref == null) return null;

    var val = ref.value !== undefined
              ? vg.str(ref.value)
              : "item.datum.data";

    // get data field value
    if (ref.field !== undefined) {
      val = "item.datum["
          + vg.field(ref.field).map(vg.str).join("][")
          + "]";
    }
    
    // run through scale function
    if (ref.scale !== undefined) {
      var scale = "group.scales['"+ref.scale+"']";
      if (ref.band) {
        val = scale + ".rangeBand()";
      } else {
        val = scale + "(" + val + ")";
      }
    }
    
    // multiply, offset, return value
    return "(" + (ref.mult ? (ref.mult+" * ") : "") + val + ")"
      + (ref.offset ? " + "+ref.offset : "");
  }
  
  return compile;
})();