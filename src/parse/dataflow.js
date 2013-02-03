vg.parse.dataflow = function(def) {
  var tx = (def.transform || []).map(vg.parse.transform);
  return !tx.length ? vg.identity :
    function(data) {
      var that = this;
      return tx.reduce(function(d,t) { return t.call(that, d); }, data);
    };
};