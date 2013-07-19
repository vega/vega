vg.data.window = function() {

  var size = 2,
      step = 1;
  
  function win(data) {
    data = vg.isArray(data) ? data : data.values || [];
    var runs = [], i, j, n=data.length-size, curr;
    for (i=0; i<=n; i+=step) {
      for (j=0, curr=[]; j<size; ++j) curr.push(data[i+j]);
      runs.push({key: i, values: curr});
    }
    return {values: runs};
  }
  
  win.size = function(n) {
    size = n;
    return win;
  };
  
  win.step = function(n) {
    step = n;
    return win;
  };

  return win;
};