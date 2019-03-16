import isArray from './isArray';

function array<T>(_: T | T[]): T[] {
  return _ != null ? (isArray(_) ? _ : [_]) : [];
}

export default array;
