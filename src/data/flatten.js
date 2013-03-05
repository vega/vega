vg.data.flatten = function() {
    
  function flatten(data) {
    return flat(data, []);
  }
  
  function flat(data, list) {
    if (data.values) {
      for (var i=0, n=data.values.length; i<n; ++i) {
        flat(data.values[i], list);
      }
    } else {
      list.push(data);
    }
    return list;
  }
  
  return flatten;
};