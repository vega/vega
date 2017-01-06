import {bandSpace} from 'vega-scale';
import {isArray, isObject, isString} from 'vega-util';

function getScale(name, ctx) {
  var s = isString(name) ? ctx.scales[name]
    : isObject(name) && name.signal ? ctx.signals[name.signal]
    : undefined;
  return s && s.value;
}

export function range(name, group) {
  var s = getScale(name, (group || this).context);
  return s && s.range ? s.range() : [0, 0];
}

export function domain(name, group) {
  var s = getScale(name, (group || this).context);
  return s ? s.domain() : [];
}

export function bandwidth(name, group) {
  var s = getScale(name, (group || this).context);
  return s && s.bandwidth ? s.bandwidth() : 0;
}

export function bandspace(count, paddingInner, paddingOuter) {
  return bandSpace(count || 0, paddingInner || 0, paddingOuter || 0);
}

export function copy(name, group) {
  var s = getScale(name, (group || this).context);
  return s ? s.copy() : undefined;
}

export function scale(name, value, group) {
  var s = getScale(name, (group || this).context);
  return s ? s(value) : undefined;
}

export function invert(name, range, group) {
  var s = getScale(name, (group || this).context);
  return !s ? undefined
    : isArray(range) ? (s.invertRange || s.invert)(range)
    : (s.invert || s.invertExtent)(range);
}
