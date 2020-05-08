import accessor from './accessor';
import getter from './getter';
import splitAccessPath from './splitAccessPath';

export default function(field, name) {
  const path = splitAccessPath(field);
  field = path.length === 1 ? path[0] : field;
  return accessor(
    getter(path),
    [field],
    name || field
  );
}
