vg.data.pie = function() {
  var value = vg.identity,
      start = 0,
      end = 2 * Math.PI,
      sort = false,
      startAngle = "startAngle",
      endAngle = "endAngle";

  function pie(data) {
    var values = data.map(function(d, i) { return +value(d); }),
        a = start,
        k = (end - start) / d3.sum(values),
        index = d3.range(data.length);
    
    if (sort) {
      index.sort(function(a, b) {
        return values[a] - values[b];
      });
    }
    
    index.forEach(function(i) {
      var d;
      data[i].value = (d = values[i]);
      data[i][startAngle] = a;
      data[i][endAngle] = (a += d * k);
    });
    
    return data;
  }

  pie.sort = function(b) {
    sort = b;
    return pie;
  };
       
  pie.value = function(field) {
    value = vg.accessor(field);
    return pie;
  };

  pie.startAngle = function(field) {
    startAngle = field;
    return pie;
  };
  
  pie.endAngle = function(field) {
    endAngle = field;
    return pie;
  };

  return pie;
};