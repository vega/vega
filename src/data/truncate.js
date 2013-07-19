vg.data.truncate = function() {
  var value = vg.accessor("data"),
      as = "truncate",
      position = "right",
      ellipsis = "...",
      wordBreak = true,
      limit = 100;
  
  var truncate = vg.data.mapper(function(d) {
    var text = vg.truncate(value(d), limit, position, wordBreak, ellipsis);
    return (d[as] = text, d);
  });

  truncate.value = function(field) {
    value = vg.accessor(field);
    return truncate;
  };
  
  truncate.output = function(field) {
    as = field;
    return truncate;
  };

  truncate.limit = function(len) {
    limit = +len;
    return truncate;
  };
  
  truncate.position = function(pos) {
    position = pos;
    return truncate;
  };

  truncate.ellipsis = function(str) {
    ellipsis = str+"";
    return truncate;
  };

  truncate.wordbreak = function(b) {
    wordBreak = !!b;
    return truncate;
  };

  return truncate;
};