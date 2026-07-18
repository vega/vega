import {isArray} from './isArray.js';

export default function<T>(_: T | readonly T[] | null | undefined): readonly T[] {
  return _ != null ? (isArray<T>(_) ? _ : [_]) : [];
}
