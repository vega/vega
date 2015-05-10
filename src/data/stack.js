vg.data.stack = function() {
  var layout = d3.layout.stack(),
      point = vg.accessor("index"),
      height = vg.accessor("data"),
      params = ["offset", "order"],
      output = {
        "y0": "y2",
        "y1": "y",
        "cy": "cy"
      };

  function stack(data) {
    var out_y0 = output["y0"],
        out_y1 = output["y1"],
        out_cy = output["cy"];
    
    var series = stacks(data);
    if (series.length === 0) return data;
    
    layout.out(function(d, y0, y) {
      if (d.datum) {
        d.datum[out_y0] = y0;
        d.datum[out_y1] = y + y0;
        d.datum[out_cy] = y0 + y/2;
      }
    })(series);
    
    return data;
  }
  
  function stacks(data) {
    var values = vg.values(data),
        points = [], series = [],
        a, i, n, j, m, k, p, v, x;

    // exit early if no data
    if (values.length === 0) return series;

    // collect and sort data points
    for (i=0, n=values.length; i<n; ++i) {
      a = vg.values(values[i]);
      for (j=0, m=a.length; j<m; ++j) {
        points.push({x:point(a[j]), y:height(a[j]), z:i, datum:a[j]});
      }
      series.push([]);
    }
    points.sort(function(a,b) {
      return a.x<b.x ? -1 : a.x>b.x ? 1 : (a.z<b.z ? -1 : a.z>b.z ? 1 : 0);
    });

    // emit data series for stack layout
    for (x=points[0].x, i=0, j=0, k=0, n=points.length; k<n; ++k) {
      p = points[k];    
      if (p.x !== x) {
        while (i < series.length) series[i++].push({x:j, y:0});
        x = p.x; i = 0; j += 1;
      }
      while (p.z > i) series[i++].push({x:j, y:0});
      p.x = j;
      series[i++].push(p);
    }
    while (i < series.length) series[i++].push({x:j, y:0});

    return series;
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
    };
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