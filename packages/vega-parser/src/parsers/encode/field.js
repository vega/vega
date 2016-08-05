import {isString, splitAccessPath, stringValue} from 'vega-util';

export default function(name, fields) {
  var object = 'datum';

  if (!isString(name)) {
    if (name.datum != null) {
      name = name.datum;
    } else {
      object = 'item.mark.group';
      if (name.parent != null) {
        name = name.parent;
        object += '.datum';
      } else if (name.group != null) {
        name = name.group;
      }
    }
  }

  fields[name] = 1;
  return object + '['
    + splitAccessPath(name).map(stringValue).join('][')
    + ']';
}
