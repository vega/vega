vg.data.window = function() {

  var count = 2,
      overlap = 0;
  
  function win(data) {
    data = vg.isArray(data) ? data : data.values || [];
    var runs = [], i, j, n=data.length-overlap, curr;
    for (i=0; i<n; ++i) {
      for (j=0, curr=[]; j<count; ++j) curr.push(data[i+j]);
      runs.push({key: i, values: curr});
    }
    return {values: runs};
  }
  
  win.count = function(n) {
    count = n;
    return win;
  };
  
  win.overlap = function(n) {
    overlap = n;
    return win;
  };

  return win;
};