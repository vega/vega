define(function() {
  function create(cs, touch) {
    var out = {};
    copy(cs, out);

    out.add = [], out.mod = [], out.rem = [];
    out.touch = touch;

    return out;
  }

  function done(cs) {
    // nothing for now
  }

  function copy(a, b) {
    if(!a) a = {};
    b.stamp = a.stamp||0;
    b.sort = a.sort;
    ['signals', 'fields', 'data', 'scales'].forEach(function(k) { b[k] = a[k]||{} });
    b.facet = a.facet;
  }

  return {
    create:  create,
    done:    done,
    copy:    copy
  };
});