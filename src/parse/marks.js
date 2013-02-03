vg.parse.marks = (function() {
  
  function parse(mark) {
    var props = mark.properties,
        group = mark.marks;
    
    // parse mark property definitions
    vg.keys(props).forEach(function(k) {
      props[k] = vg.parse.properties(props[k]);
    });
        
    // parse mark data definition
    var name = mark.from.data,
        tx = vg.parse.dataflow(mark.from);
    mark.from = function(db) {
      return tx(db[name]);
    };
    
    // recurse if group type
    if (group) {
      mark.marks = group.map(parse);
    }
        
    return mark;
  }
  
  return function(marks) {
    return {
      type: "group",
      marks: vg.duplicate(marks).map(parse)
    };
  };
})();