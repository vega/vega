vg.parse.dataflow = function(def) {
  var tx = (def.transform || []).map(vg.parse.transform),
      df = tx.length
        ? function(data, db, group) {
            return tx.reduce(function(d,t) { return t(d,db,group); }, data);
          }
        : vg.identity;
  df.transforms = tx;
  return df;
};