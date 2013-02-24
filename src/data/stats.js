vg.data.stats = function() {
  var value = vg.accessor("data"),
      median = false;
  
  function reduce(data) {
    var min = +Infinity,
        max = -Infinity,
        sum = 0,
        mean = 0,
        M2 = 0,
        i, len, v, delta;

    var list = (vg.isArray(data) ? data : data.values || []).map(value);
    
    // compute aggregates
    for (i=0, len=list.length; i<len; ++i) {
      v = list[i];
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
      delta = v - mean;
      mean = mean + delta / (i+1);
      M2 = M2 + delta * (v - mean);
    }
    M2 = M2 / (len - 1);
    
    var o = vg.isArray(data) ? {} : data;
    if (median) {
      list.sort(vg.numcmp);
      i = list.length >> 1;
      o.median = list.length % 2 ? list[i] : (list[i-1] + list[i])/2;
    }
    o.count = len;
    o.min = min;
    o.max = max;
    o.sum = sum;
    o.mean = mean;
    o.variance = M2;
    o.stdev = Math.sqrt(M2);
    return o;
  }
  
  function stats(data) {
    return (Array.isArray(data) ? [data] : data.values || [])
      .map(reduce); // no pun intended
  }
  
  stats.median = function(bool) {
    median = bool || false;
    return stats;
  };
  
  stats.value = function(field) {
    value = vg.accessor(field);
    return stats;
  };
  
  return stats;
};