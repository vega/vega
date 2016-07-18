import {stringValue} from 'vega-util';

export default function(obj, key, value) {
  return obj + '[' + stringValue(key) + ']=' + value + ';';
}
