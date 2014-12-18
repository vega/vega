vg.data.bin = function() {

  var field,
      accessor,
      setter,
      min = undefined,
      max = undefined,
      step = undefined,
      maxbins = 20,
      output = "bin";

  function compare(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function bisectLeft(a, x, lo, hi) {
    if (arguments.length < 3) { lo = 0; }
    if (arguments.length < 4) { hi = a.length; }
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (compare(a[mid], x) < 0) { lo = mid + 1; }
      else { hi = mid; }
    }
    return lo;
  }

  function bins(opt) {
    opt = opt || {};

    // determine range
    var maxb = opt.maxbins || 1024,
        base = opt.base || 10,
        div = opt.div || [5, 2],
        mins = opt.minstep || 0,
        logb = Math.log(base),
        level = Math.ceil(Math.log(maxb) / logb),
        min = opt.min,
        max = opt.max,
        span = max - min,
        step = Math.max(mins, Math.pow(base, Math.round(Math.log(span) / logb) - level)),
        nbins = Math.ceil(span / step),
        precision, v, i, eps;

    if (opt.step != null) {
      step = opt.step;
    } else if (opt.steps) {
      // if provided, limit choice to acceptable step sizes
      step = opt.steps[Math.min(
          opt.steps.length - 1,
          bisectLeft(opt.steps, span / maxb)
      )];
    } else {
      // increase step size if too many bins
      do {
        step *= base;
        nbins = Math.ceil(span / step);
      } while (nbins > maxb);

      // decrease step size if allowed
      for (i = 0; i < div.length; ++i) {
        v = step / div[i];
        if (v >= mins && span / v <= maxb) {
          step = v;
          nbins = Math.ceil(span / step);
        }
      }
    }

    // update precision, min and max
    v = Math.log(step);
    precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
    eps = Math.pow(base, -precision - 1);

    // outer Math.min to remove some rounding errors:
    min = Math.min(min, Math.floor(min / step + eps) * step);
    max = Math.ceil(max / step) * step;

    return {
      start: min,
      stop: max,
      step: step,
      unit: precision
    };
  }

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
    var b = bins(opt);
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