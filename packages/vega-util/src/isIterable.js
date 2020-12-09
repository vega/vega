import isFunction from './isFunction';

export default function(_) {
  return _ && isFunction(_[Symbol.iterator]);
}
