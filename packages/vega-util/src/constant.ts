import isFunction from './isFunction.js';

export default function<T>(_: T | (() => T)): () => T {
  return isFunction(_) ? _ : () => _;
}
