import {constant, peek} from 'vega-util';
import * as $ from 'd3-interpolate';

export function interpolateRange(interpolator, range) {
  var start = range[0],
      span = peek(range) - start;
  return function(i) { return interpolator(start + i * span); };
}

export function scaleFraction(scale, min, max) {
  var delta = max - min;
  return !delta || !isFinite(delta) ? constant(0)
    : scale.type === 'linear' || scale.type === 'sequential'
      ? function(_) { return (_ - min) / delta; }
      : scale.copy().domain([min, max]).range([0, 1]).interpolate(lerp);
}

function lerp(a, b) {
  var span = b - a;
  return function(i) { return a + i * span; }
}

export function interpolate(type, gamma) {
  var interp = $[method(type)];
  return (gamma != null && interp && interp.gamma)
    ? interp.gamma(gamma)
    : interp;
}

function method(type) {
  return 'interpolate' + type.toLowerCase()
    .split('-')
    .map(function(s) { return s[0].toUpperCase() + s.slice(1); })
    .join('');
}
