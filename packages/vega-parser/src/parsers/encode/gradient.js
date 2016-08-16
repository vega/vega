import {getScale} from './scale';
import {stringValue} from 'vega-util';

export default function(enc, scope, params, fields) {
  return 'this.gradient('
    + getScale(enc.gradient, scope, params, fields)
    + ',' + stringValue(enc.start)
    + ',' + stringValue(enc.stop)
    + ',' + stringValue(enc.count)
    + ')';
}
