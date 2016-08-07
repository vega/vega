import accessor from './accessor';
import array from './array';
import splitAccessPath from './splitAccessPath';
import stringValue from './stringValue';

export default function(fields) {
  fields = fields ? array(fields) : fields;
  var fn = !(fields && fields.length)
    ? function() { return ''; }
    : Function('_', 'return \'\'+' +
        fields.map(function(f) {
          return '_[' + splitAccessPath(f).map(stringValue).join('][') + ']';
        }).join('+\'|\'+') + ';');
  return accessor(fn, fields, 'key');
}
