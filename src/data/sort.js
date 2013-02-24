vg.data.sort = function() {
  var by = null;

  function sort(data) {
    (vg.isArray(data) ? data : data.values || []).sort(by);
    return data;
  }
  
  sort.by = function(s) {
    by = vg.comparator(s);
    return sort;
  };

  return sort;
};