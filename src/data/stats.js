vg.data.stats = function() {
  var value = vg.accessor("data");
  
  function reduce(data) {
    var min = +Infinity,
        max = -Infinity,
        sum = 0,
        mean = 0,
        M2 = 0,
        i, len, v, delta;

    data = Array.isArray(data) ? data : data.values || [];
    
    // compute aggregates
    for (i=0, len=data.length; i<len; ++i) {
      v = value(data[i]);
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
      delta = v - mean;
      mean = mean + delta / (i+1);
      M2 = M2 + delta * (v - mean);
    }
    M2 = M2 / (len - 1);
    
    return {
      count: len,
      min: min,
      max: max,
      sum: sum,
      mean: mean,
      variance: M2,
      stdev: Math.sqrt(M2)
    };
  }
  
  function stats(data) {
    return (Array.isArray(data) ? [data] : data.values || [])
      .map(reduce); // no pun intended
  }
  
  stats.value = function(field) {
    value = vg.accessor(field);
    return stats;
  };
  
  return stats;
};