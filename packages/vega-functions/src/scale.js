import {bandSpace} from 'vega-scale';
import {isArray, isFunction, isString} from 'vega-util';

export function getScale(name, ctx) {
  let s;
  return isFunction(name) ? name
    : isString(name) ? (s = ctx.scales[name]) && s.value
    : undefined;
}

export function range(name, group) {
  const s = getScale(name, (group || this).context);
  return s && s.range ? s.range() : [];
}

export function domain(name, group) {
  const s = getScale(name, (group || this).context);
  return s ? s.domain() : [];
}

export function bandwidth(name, group) {
  const s = getScale(name, (group || this).context);
  return s && s.bandwidth ? s.bandwidth() : 0;
}

export function bandspace(count, paddingInner, paddingOuter) {
  return bandSpace(count || 0, paddingInner || 0, paddingOuter || 0);
}

export function copy(name, group) {
  const s = getScale(name, (group || this).context);
  return s ? s.copy() : undefined;
}

export function scale(name, value, group) {
  const s = getScale(name, (group || this).context);
  return s && value !== undefined ? s(value) : undefined;
}

export function invert(name, range, group) {
  const s = getScale(name, (group || this).context);
  return !s ? undefined
    : isArray(range) ? (s.invertRange || s.invert)(range)
    : (s.invert || s.invertExtent)(range);
}
