import accessor from './accessor.js';
import getter from './getter.js';
import splitAccessPath from './splitAccessPath.js';

export default function(field, name, opt) {
  const path = splitAccessPath(field);
  field = path.length === 1 ? path[0] : field;
  return accessor(
    (opt && opt.get || getter)(path),
    [field],
    name || field
  );
}
