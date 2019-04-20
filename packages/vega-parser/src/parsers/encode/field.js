import expression from './expression';
import {error, isString, isObject, splitAccessPath, stringValue} from 'vega-util';

export default function(ref, scope, params, fields) {
  return resolve(isObject(ref) ? ref : {datum: ref}, scope, params, fields);
}

function resolve(ref, scope, params, fields) {
  var object, level, field;

  if (ref.signal) {
    object = 'datum';
    field = expression(ref.signal, scope, params, fields);
  } else if (ref.group || ref.parent) {
    level = Math.max(1, ref.level || 1);
    object = 'item';

    while (level-- > 0) {
      object += '.mark.group';
    }

    if (ref.parent) {
      field = ref.parent;
      object += '.datum';
    } else {
      field = ref.group;
    }
  } else if (ref.datum) {
    object = 'datum';
    field = ref.datum;
  } else {
    error('Invalid field reference: ' + stringValue(ref));
  }

  if (!ref.signal) {
    if (isString(field)) {
      fields[field] = 1; // TODO review field tracking?
      field = splitAccessPath(field).map(stringValue).join('][');
    } else {
      field = resolve(field, scope, params, fields);
    }
  }

  return object + '[' + field + ']';
}
