vg.data.slice = function() {
  var by = null,
      field = vg.accessor("data");

  function slice(data) {
    data = vg.values(data);
    
    if (by === "min") {
      data = [data[vg.minIndex(data, field)]];
    } else if (by === "max") {
      data = [data[vg.maxIndex(data, field)]];
    } else if (by === "median") {
      var list = data.slice().sort(function(a,b) {
        a = field(a); b = field(b);
        return a < b ? -1 : a > b ? 1 : 0;
      });
      data = [data[~~(list.length/2)]];
    } else {
      var idx = vg.array(by);
      data = data.slice(idx[0], idx[1]);
    }
    return data;
  }
  
  slice.by = function(x) {
    by = x;
    return slice;
  };
  
  slice.field = function(f) {
    field = vg.accessor(f);
    return slice;
  };

  return slice;
};