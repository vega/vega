define(function() {
  return function quickselect(k, x) {
    function swap(a, b) {
      var t = x[a];
      x[a] = x[b];
      x[b] = t;
    }
    
    var left = 0,
        right = x.length - 1,
        pos, i, pivot;
    
    while (left < right) {
      pivot = x[k];
      swap(k, right);
      for (i = pos = left; i < right; ++i) {
        if (x[i] < pivot) { swap(i, pos++); }
      }
      swap(right, pos);
      if (pos === k) break;
      if (pos < k) left = pos + 1;
      else right = pos - 1;
    }
    return x[k];
  };
});