vg.parse.properties = (function() {
  function compile(spec) {
    var code = "",
        names = vg.keys(spec),
        i, len, name, ref, vars = {};
    
    for (i=0, len=names.length; i<len; ++i) {
      ref = spec[name = names[i]];
      code += (i > 0) ? "\n  " : "  ";
      code += "item."+name+" = "+valueRef(ref)+";";
      vars[name] = true;
    }
    
    if (vars.x2) {
      code += "\n  if (item.x > item.x2) { "
            + "var t = item.x; item.x = item.x2; item.x2 = t; };"
      code += "\n  item.width = (item.x2 - item.x);"
    }
    
    if (vars.y2) {
      code += "\n  if (item.y > item.y2) { "
            + "var t = item.y; item.y = item.y2; item.y2 = t; };"
      code += "\n  item.height = (item.y2 - item.y);"
    }

    return Function("item", "group", code);
  }

  // TODO security check for strings emitted into code
  function valueRef(ref) {
    if (ref == null) return null;

    var val = ref.value !== undefined
              ? vg.str(ref.value)
              : "item.datum['data']";

    // get data field value
    if (ref.field !== undefined) {
      val = "item.datum["
          + vg.array(ref.field).map(vg.str).join("][")
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
    
    // add offset, return value
    return val + (ref.offset ? " + "+ref.offset : "");
  }
  
  return compile;
})();