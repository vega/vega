import {stringValue} from 'vega-util';

export default function(obj, key, value) {
  const o = obj + '[' + stringValue(key) + ']';
  return `$=${value};if(${o}!==$)${o}=$,m=1;`;
}
