import accessor, { Accessor } from './accessor.js';
import getter from './getter.js';
import splitAccessPath from './splitAccessPath.js';

export interface FieldOptions {
  get?: (path: string[]) => (obj: any) => any;
}

export default function field(
  fieldPath: string,
  name?: string,
  opt?: FieldOptions
): Accessor {
  const path = splitAccessPath(fieldPath);
  const fieldName = path.length === 1 ? path[0] : fieldPath;
  return accessor(
    (opt && opt.get || getter)(path),
    [fieldName],
    name || fieldName
  );
}
