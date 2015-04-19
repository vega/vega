var dl = require('datalib');

module.exports = function quickselect(k, x, c) {
  function swap(a, b) {
    var t = x[a];
    x[a] = x[b];
    x[b] = t;
  }

  // x may be null, in which case assemble an array from c (counts)
  if(x === null) {
    x = [];
    dl.keys(c).forEach(function(k) {
      var i = 0, len = c[k];
      k = +k || k;
      for(; i<len; ++i) x.push(k);
    });
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