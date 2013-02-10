vg.data.copy = function() {
  var from = vg.accessor("data"),
      fields = [];
  
  var copy = vg.data.mapper(function(d) {
    var src = from(d), i, len;
    for (i=0, len=fields.length; i<len; ++i) {
      d[fields[i]] = src[fields[i]];
    }
    return d;
  });

  copy.from = function(field) {
    from = vg.accessor(field);
    return copy;
  };
  
  copy.fields = function(fieldList) {
    fields = vg.array(fieldList);
    return copy;
  };

  return copy;
};