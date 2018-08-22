import {bisect} from 'd3-array';
import {scaleLinear} from 'd3-scale';
import {peek} from 'vega-util';

var map = Array.prototype.map,
    slice = Array.prototype.slice;

function numbers(_) {
  return map.call(_, function(x) { return +x; });
}

export function binLinear() {
  var linear = scaleLinear(),
      domain = [];

  function scale(x) {
    return linear(x);
  }

  function setDomain(_) {
    domain = numbers(_);
    linear.domain([domain[0], peek(domain)]);
  }

  scale.domain = function(_) {
    return arguments.length ? (setDomain(_), scale) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (linear.range(_), scale) : linear.range();
  };

  scale.rangeRound = function(_) {
    return arguments.length ? (linear.rangeRound(_), scale) : linear.rangeRound();
  };

  scale.interpolate = function(_) {
    return arguments.length ? (linear.interpolate(_), scale) : linear.interpolate();
  };

  scale.invert = function(_) {
    return linear.invert(_);
  };

  scale.ticks = function(count) {
    var n = domain.length,
        stride = ~~(n / (count || n));

    return stride < 2
      ? scale.domain()
      : domain.filter(function(x, i) { return !(i % stride); });
  };

  scale.tickFormat = function() {
    return linear.tickFormat.apply(linear, arguments);
  };

  scale.copy = function() {
    return binLinear().domain(scale.domain()).range(scale.range());
  };

  return scale;
}

export function binOrdinal() {
  var domain = [],
      range = [];

  function scale(x) {
    return x == null || x !== x
      ? undefined
      : range[(bisect(domain, x) - 1) % range.length];
  }

  scale.domain = function(_) {
    if (arguments.length) {
      domain = numbers(_);
      return scale;
    } else {
      return domain.slice();
    }
  };

  scale.range = function(_) {
    if (arguments.length) {
      range = slice.call(_);
      return scale;
    } else {
      return range.slice();
    }
  };

  // Addresses #1395, refine if/when d3-scale tickFormat is exposed
  scale.tickFormat = function() {
    var linear = scaleLinear().domain([domain[0], peek(domain)]);
    return linear.tickFormat.apply(linear, arguments);
  };

  scale.copy = function() {
    return binOrdinal().domain(scale.domain()).range(scale.range());
  };

  return scale;
}
