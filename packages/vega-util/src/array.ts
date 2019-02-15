import isArray from './isArray';

function array<T extends any[]>(_: T): T;
function array<T>(_: T): T[];
function array(_: any): any {
  return _ != null ? (isArray(_) ? _ : [_]) : [];
}

export default array;
