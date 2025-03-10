import isFunction from './isFunction.js';

export default function(_) {
  return isFunction(_) ? _ : () => _;
}
