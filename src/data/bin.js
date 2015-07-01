vg.data.bin = function() {

  var field,
      accessor,
      setter,
      min,
      max,
      step,
      maxbins = 20,
      output = "bin";

  function bin(input) {
    var opt = {
      min: min != null ? min : +Infinity,
      max: max != null ? max : -Infinity,
      step: step != null ? step : null,
      maxbins: maxbins
    };
    if (min == null || max == null) {
      input.forEach(function(d) {
        var v = accessor(d);
        if (min == null && v > opt.max) opt.max = v;
        if (max == null && v < opt.min) opt.min = v;
      });
    }
    var b = vg.bins(opt);
    input.forEach(function(d) {
      var v = accessor(d);
      setter(d, b.start + b.step * ~~((v - b.start) / b.step));
    });
    return input;
  }

  bin.min = function(x) {
    min = x;
    return bin;
  };

  bin.max = function(x) {
    max = x;
    return bin;
  };

  bin.step = function(x) {
    step = x;
    return bin;
  };

  bin.maxbins = function(x) {
    maxbins = x;
    return bin;
  };

  bin.field = function(f) {
    field = f;
    accessor = vg.accessor(f);
    return bin;
  };

  bin.output = function(f) {
    output = f;
    setter = vg.mutator(f);
    return bin;
  };

  return bin;
};