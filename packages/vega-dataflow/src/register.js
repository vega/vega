import {hasOwnProperty} from 'vega-util';

export const transforms = {};

export function definition(type) {
  const t = transform(type);
  return t && t.Definition || null;
}

export function transform(type) {
  type = type && type.toLowerCase();
  return hasOwnProperty(transforms, type) ? transforms[type] : null;
}
