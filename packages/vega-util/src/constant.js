import isFunction from './isFunction';

export default function(_) {
  return isFunction(_) ? _ : () => _;
}
