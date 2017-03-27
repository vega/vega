import {Literal, Identifier} from './ast';
import {scalePrefix} from './prefixes';
import {bandSpace} from 'vega-scale';
import {isArray, isFunction, isString} from 'vega-util';

export function getScale(name, ctx) {
  var s;
  return isFunction(name) ? name
    : isString(name) ? (s = ctx.scales[name]) && s.value
    : undefined;
}

function addScaleDependency(scope, params, name) {
  var scaleName = scalePrefix + name;
  if (!params.hasOwnProperty(scaleName)) {
    try {
      params[scaleName] = scope.scaleRef(name);
    } catch (err) {
      // TODO: error handling? warning?
    }
  }
}

export function scaleVisitor(name, args, scope, params) {
  if (args[0].type === Literal) {
    // add scale dependency
    addScaleDependency(scope, params, args[0].value);
  }
  else if (args[0].type === Identifier) {
    // indirect scale lookup; add all scales as parameters
    for (name in scope.scales) {
      addScaleDependency(scope, params, name);
    }
  }
}

export function range(name, group) {
  var s = getScale(name, (group || this).context);
  return s && s.range ? s.range() : [];
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
