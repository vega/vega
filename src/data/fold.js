vg.data.fold = function() {
  var folds = [],
      accessors = [],
      key_as = "key", value_as = "value";

  function fold(data) {
    var values = [];

    for(var i=0; i<data.length; ++i) {
      for(var j=0; j<folds.length; ++j) {
        var o = {
          index: values.length,
          data: data[i].data
        };
        o[key_as] = folds[j];
        o[value_as] = accessors[j](data[i]);
        values.push(o);
      }
    }

    return values;
  }  

  fold.folds = function(f) {
    folds = vg.array(f);
    accessors = folds.map(vg.accessor);
    return fold;
  };

  fold.key_as = function(x) {
    key_as = x;
    return fold;
  };

  fold.value_as = function(x) {
    value_as = x;
    return fold;
  };

  return fold;
};