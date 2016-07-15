import accessor from './accessor';
import splitAccessPath from './splitAccessPath';
import stringValue from './stringValue';

export default function(field, name) {
  var path = splitAccessPath(field).map(stringValue),
      fn = Function('_', 'return _[' + path.join('][') + '];');
  return accessor(fn, [field], name || field);
}
