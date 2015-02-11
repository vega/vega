vg.data.truncate = function() {
  var value = vg.accessor("data"),
      as = "truncate",
      position = "right",
      ellipsis = "...",
      wordBreak = true,
      limit = 100,
      setter;

  var truncate = vg.data.mapper(function(d) {
    var text = vg.truncate(value(d), limit, position, wordBreak, ellipsis);
    setter(d, text);
    return d;
  });

  truncate.value = function(field) {
    value = vg.accessor(field);
    return truncate;
  };

  truncate.output = function(field) {
    as = field;
    setter = vg.mutator(field);
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