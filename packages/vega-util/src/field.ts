import accessor, { Accessor } from './accessor.js';
import getter from './getter.js';
import splitAccessPath from './splitAccessPath.js';

export interface FieldOptions {
  get?: (path: string[]) => (obj: unknown) => unknown;
}

export default function field(field: string, name?: string, opt?: FieldOptions): Accessor {
  const path = splitAccessPath(field);
  const fieldName = path.length === 1 ? path[0] : field;
  return accessor(
    (opt && opt.get || getter)(path),
    [fieldName],
    name || fieldName
  );
}
