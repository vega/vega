import {error, isString, isObject, splitAccessPath, stringValue} from 'vega-util';

export default function(ref, fields) {
  return resolve(isObject(ref) ? ref: {datum: ref}, fields);
}

function resolve(ref, fields) {
  var object, level, field;

  if (ref.group || ref.parent) {
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
    error('Invalid field reference: ' + JSON.stringify(ref));
  }

  if (isString(field)) {
    fields[field] = 1; // TODO review field tracking?
    field = splitAccessPath(field).map(stringValue).join('][');
  } else {
    field = resolve(field, fields);
  }

  return object + '[' + field + ']';
}
