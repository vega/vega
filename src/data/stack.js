vg.data.stack = function() {
  var layout = d3.layout.stack()
                 .values(function(d) { return d.values; }),
      point = null,
      height = null,
      params = ["offset", "order"],
      output = {
        "y0": "y2",
        "y1": "y"
      };

  function stack(data) {
    var out_y0 = output["y0"],
        out_y1 = output["y1"];
    
    return layout
      .x(point)
      .y(height)
      .out(function(d, y0, y) {
        d[out_y0] = y0;
        d[out_y1] = y + y0;
      })
      (data.values);
  }
       
  stack.point = function(field) {
    point = vg.accessor(field);
    return stack;
  };
  
  stack.height = function(field) {
    height = vg.accessor(field);
    return stack;
  };

  params.forEach(function(name) {
    stack[name] = function(x) {
      layout[name](x);
      return stack;
    }
  });

  stack.output = function(map) {
    d3.keys(output).forEach(function(k) {
      if (map[k] !== undefined) {
        output[k] = map[k];
      }
    });
    return stack;
  };

  return stack;
};