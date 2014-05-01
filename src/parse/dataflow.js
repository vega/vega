vg.parse.dataflow = function(def) {
  var tx = (def.transform || []).map(vg.parse.transform),
      df = tx.length
        ? function(data, db, group) {
            return tx.reduce(function(d,t) { return t(d,db,group); }, data);
          }
        : vg.identity;
  df.transforms = tx;
  df.dependencies = vg.keys((def.transform || [])
    .reduce(function(map, tdef) {
      var deps = vg.data[tdef.type].dependencies;
      if (deps) deps.forEach(function(d) {
        if (tdef[d]) map[tdef[d]] = 1;
      });
      return map;
    }, {}));
  return df;
};