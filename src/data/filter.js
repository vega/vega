vg.data.filter = function() {

  var test = null;

  function filter(data) {
    return test ? data.filter(test) : data;
  }
  
  filter.test = function(t) {
    // TODO security check
    test = vg.isFunction(t)
      ? t
      : new Function("d", "return " + t);
    return filter;
  };

  return filter;
};