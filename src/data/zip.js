vg.data.zip = function() {
  var z = null,
      as = "zip",
      key = vg.accessor("data"),
      withKey = null;

  function zip(data, db) {
    var zdata = db[z], d, i, len, map;
    
    if (withKey) {
      map = {};
      zdata.forEach(function(s) { map[withKey(s)] = s; });
    }
    
    for (i=0, len=data.length; i<len; ++i) {
      d = data[i];
      d[as] = map ? map[key(d)] : zdata[i];
    }
    
    return data;
  }

  zip["with"] = function(d) {
    z = d;
    return zip;
  };

  zip.as = function(name) {
    as = name;
    return zip;
  };

  zip.key = function(k) {
    key = vg.accessor(k);
    return zip;
  };

  zip.withKey = function(k) {
    withKey = vg.accessor(k);
    return zip;
  };

  return zip;
};