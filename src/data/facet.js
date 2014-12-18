vg.data.facet = function() {

  var keys = [],
      sort = null;

  function facet(data) {
    var result = {
          key: "",
          keys: [],
          values: []
        },
        map = {},
        vals = result.values,
        obj, klist, kstr, len, i, j, k, kv, cmp;

    if (keys.length === 0) {
      // if no keys, skip collation step
      vals.push(obj = {
        key: "", keys: [], index: 0,
        values: sort ? data.slice() : data
      });
      if (sort) sort(obj.values);
      return result;
    }

    for (i=0, len=data.length; i<len; ++i) {
      for (k=0, klist=[], kstr=""; k<keys.length; ++k) {
        kv = keys[k](data[i]);
        klist.push(kv);
        kstr += (k>0 ? "|" : "") + String(kv);
      }
      obj = map[kstr];
      if (obj === undefined) {
        vals.push(obj = map[kstr] = {
          key: kstr,
          keys: klist,
          index: vals.length,
          values: []
        });
      }
      obj.values.push(data[i]);
    }

    if (sort) {
      for (i=0, len=vals.length; i<len; ++i) {
        sort(vals[i].values);
      }
    }

    return result;
  }

  facet.keys = function(k) {
    keys = vg.array(k).map(vg.accessor);
    return facet;
  };

  facet.sort = function(s) {
    sort = vg.data.sort().by(s);
    return facet;
  };

  return facet;
};