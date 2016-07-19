import {isString} from 'vega-util';

export default function(name, fields) {
  if (!isString(name)) {
    fields[name.parent] = 1;
    return 'item.parent.datum[\'' + name.parent + '\']';
  } else {
    fields[name] = 1;
    return 'datum[\'' + name + '\']';
  }
}
