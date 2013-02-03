vg.data.zip = function() {
  var z = null,
      as = "zip",
      keys = null;

  function zip(data) {
    var src = this[z], k, d, i, len, map;
    
    if (keys) {
      map = {};
      k = keys[1];
      src.forEach(function(s) { map[s.data[k]] = s; });
    }
    
    for (k=keys[0], i=0, len=data.length; i<len; ++i) {
      d = data[i];
      d[as] = map ? map[d.data[k]] : src[i];
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
       
  zip.keys = function(k) {
    keys = k;//k ? k.map(vg.accessor) : null;
    return zip;
  };

  return zip;
};