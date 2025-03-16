import isArray from './isArray.js';

export default function(_) {
  return _ != null ? (isArray(_) ? _ : [_]) : [];
}
