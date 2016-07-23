import entry from './entry';
import {isObject} from 'vega-util';

export default function(property, scope, params, fields) {
  return isObject(property)
      ? '(' + entry(null, property, scope, params, fields) + ')'
      : property;
}
