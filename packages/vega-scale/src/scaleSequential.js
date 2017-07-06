import {peek} from 'vega-util';
import {scaleLinear} from 'd3-scale';

export default function sequential(interpolator) {
  var linear = scaleLinear(),
      x0 = 0,
      dx = 1,
      clamp = false;

  function update() {
    var domain = linear.domain();
    x0 = domain[0];
    dx = peek(domain) - x0;
  }

  function scale(x) {
    var t = (x - x0) / dx;
    return interpolator(clamp ? Math.max(0, Math.min(1, t)) : t);
  }

  scale.clamp = function(_) {
    if (arguments.length) {
      clamp = !!_;
      return scale;
    } else {
      return clamp;
    }
  };

  scale.domain = function(_) {
    return arguments.length ? (linear.domain(_), update(), scale) : linear.domain();
  };

  scale.interpolator = function(_) {
    if (arguments.length) {
      interpolator = _;
      return scale;
    } else {
      return interpolator;
    }
  };

  scale.copy = function() {
    return sequential().domain(linear.domain()).clamp(clamp).interpolator(interpolator);
  };

  scale.ticks = function(count) {
    return linear.ticks(count);
  };

  scale.tickFormat = function(count, specifier) {
    return linear.tickFormat(count, specifier);
  };

  scale.nice = function(count) {
    return linear.nice(count), update(), scale;
  };

  return scale;
}
