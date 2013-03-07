vg.data.fold = function() {
  var folds = [],
      accessors = [];

  function fold(data) {
    var result = {
      values: []
    };
    vals = result.values;

    data.forEach(function(d) {
      for(i=0;i<folds.length;i++) {
        vals.push({
          fold: folds[i],
          value: accessors[i](d),
          index: vals.length,
          values: [d]
        });
      }
    });

    return result;
  }  

  fold.folds = function(f) {
    folds = f;
    accessors = vg.array(f).map(vg.accessor);
    return fold;
  };

  return fold;
};