import accessor, { AccessorFn } from './accessor';
import splitAccessPath from './splitAccessPath';
import stringValue from './stringValue';

export default function<R>(field: string, name?: string): AccessorFn<R> {
  var path = splitAccessPath(field),
      code = 'return _[' + path.map(stringValue).join('][') + '];';

  return accessor(
    Function('_', code) as () => R,
    [(field = path.length===1 ? path[0] : field)],
    name || field
  );
}
