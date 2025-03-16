import isFunction from './isFunction.js';

export default function(_) {
  return _ && isFunction(_[Symbol.iterator]);
}
