vg.parse.marks = (function() {
  
  function parse(mark) {
    var props = mark.properties,
        group = mark.marks;
    
    // parse mark property definitions
    vg.keys(props).forEach(function(k) {
      props[k] = vg.parse.properties(props[k]);
    });
        
    // parse mark data definition
    if (mark.from) {
      var name = mark.from.data,
          tx = vg.parse.dataflow(mark.from);
      mark.from = function(db, group, parentData) {
        var data = vg.scene.data(name ? db[name] : null, parentData);
        return tx(data, db, group);
      };
    }
    
    // recurse if group type
    if (group) {
      mark.marks = group.map(parse);
    }
        
    return mark;
  }
  
  return function(spec) {
    return {
      type: "group",
      width: spec.width,
      height: spec.height,
      marks: vg.duplicate(spec.marks).map(parse)
    };
  };
})();