import {isString} from 'vega-util';

export default function(name, fields) {
  if (!isString(name)) {
    var object = 'item.mark.group', field;
    if (name.parent != null) {
      field = name.parent;
      object += '.datum';
    } else if (name.group != null) {
      field = name.group;
    }
    fields[field] = 1;
    return object + '[\'' + field + '\']';
  } else {
    fields[name] = 1;
    return 'datum[\'' + name + '\']';
  }
}
